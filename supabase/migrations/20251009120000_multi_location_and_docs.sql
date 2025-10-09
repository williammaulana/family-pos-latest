-- Tabel master
create table if not exists public.warehouses (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  address text,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Stok per lokasi (gudang ATAU toko)
create table if not exists public.product_stocks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  warehouse_id uuid references public.warehouses(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  stock integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint one_location_chk check (
    (warehouse_id is not null and store_id is null) or
    (warehouse_id is null and store_id is not null)
  ),
  constraint uniq_location unique (product_id, warehouse_id, store_id)
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  store_id uuid references public.stores(id) on delete set null,
  type text not null check (type in ('in','out','transfer')),
  quantity integer not null check (quantity >= 0),
  ref_id uuid,
  ref_type text check (ref_type in ('penerimaan','surat_jalan','penyesuaian')),
  created_at timestamptz not null default now()
);

-- Dokumen Surat Jalan
create table if not exists public.surat_jalan (
  id uuid primary key default gen_random_uuid(),
  nomor text unique not null,
  dari_gudang_id uuid not null references public.warehouses(id) on delete restrict,
  ke_gudang_id uuid references public.warehouses(id) on delete set null,
  ke_toko_id uuid references public.stores(id) on delete set null,
  sopir text,
  nomor_kendaraan text,
  tanggal date not null,
  status text not null default 'Draft' check (status in ('Draft','Disetujui','Dibatalkan')),
  dibuat_oleh uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists public.surat_jalan_items (
  id uuid primary key default gen_random_uuid(),
  surat_jalan_id uuid not null references public.surat_jalan(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit text
);

-- Dokumen Penerimaan Barang
create table if not exists public.penerimaan_barang (
  id uuid primary key default gen_random_uuid(),
  nomor text unique not null,
  warehouse_id uuid not null references public.warehouses(id) on delete restrict,
  pemasok text,
  tanggal date not null,
  status text not null default 'Draft' check (status in ('Draft','Disetujui','Dibatalkan')),
  dibuat_oleh uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists public.penerimaan_barang_items (
  id uuid primary key default gen_random_uuid(),
  penerimaan_id uuid not null references public.penerimaan_barang(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit text
);

-- Upsert helper: memastikan baris stok ada
create or replace function public.ensure_product_stock_row(p_product_id uuid, p_warehouse_id uuid, p_store_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.product_stocks (product_id, warehouse_id, store_id, stock)
  values (p_product_id, p_warehouse_id, p_store_id, 0)
  on conflict (product_id, warehouse_id, store_id) do nothing;
end;
$$;

-- Trigger Penerimaan: saat disetujui, tambah stok di gudang penerima
create or replace function public.trg_penerimaan_approve_sync_stock()
returns trigger
language plpgsql
as $$
declare
  r_item record;
begin
  if (TG_OP = 'UPDATE') and (new.status = 'Disetujui') and (old.status is distinct from 'Disetujui') then
    for r_item in
      select i.product_id, i.quantity from public.penerimaan_barang_items i where i.penerimaan_id = new.id
    loop
      perform public.ensure_product_stock_row(r_item.product_id, new.warehouse_id, null);
      update public.product_stocks
        set stock = stock + r_item.quantity, updated_at = now()
        where product_id = r_item.product_id and warehouse_id = new.warehouse_id and store_id is null;

      insert into public.stock_movements (product_id, warehouse_id, store_id, type, quantity, ref_id, ref_type)
      values (r_item.product_id, new.warehouse_id, null, 'in', r_item.quantity, new.id, 'penerimaan');
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists penerimaan_approve_sync on public.penerimaan_barang;
create trigger penerimaan_approve_sync
after update on public.penerimaan_barang
for each row execute function public.trg_penerimaan_approve_sync_stock();

-- Trigger Surat Jalan: saat disetujui, kurangi stok dari gudang asal, tambah stok ke gudang/toko tujuan
create or replace function public.trg_surat_jalan_approve_sync_stock()
returns trigger
language plpgsql
as $$
declare
  r_item record;
  trg_wh uuid;
  trg_store uuid;
begin
  if (TG_OP = 'UPDATE') and (new.status = 'Disetujui') and (old.status is distinct from 'Disetujui') then
    for r_item in
      select i.product_id, i.quantity from public.surat_jalan_items i where i.surat_jalan_id = new.id
    loop
      -- kurangi gudang asal
      perform public.ensure_product_stock_row(r_item.product_id, new.dari_gudang_id, null);
      update public.product_stocks
        set stock = greatest(0, stock - r_item.quantity), updated_at = now()
        where product_id = r_item.product_id and warehouse_id = new.dari_gudang_id and store_id is null;

      insert into public.stock_movements (product_id, warehouse_id, store_id, type, quantity, ref_id, ref_type)
      values (r_item.product_id, new.dari_gudang_id, null, 'out', r_item.quantity, new.id, 'surat_jalan');

      -- tambah tujuan
      trg_wh := new.ke_gudang_id;
      trg_store := new.ke_toko_id;

      if trg_wh is not null then
        perform public.ensure_product_stock_row(r_item.product_id, trg_wh, null);
        update public.product_stocks
          set stock = stock + r_item.quantity, updated_at = now()
          where product_id = r_item.product_id and warehouse_id = trg_wh and store_id is null;

        insert into public.stock_movements (product_id, warehouse_id, store_id, type, quantity, ref_id, ref_type)
        values (r_item.product_id, trg_wh, null, 'in', r_item.quantity, new.id, 'surat_jalan');
      elsif trg_store is not null then
        perform public.ensure_product_stock_row(r_item.product_id, null, trg_store);
        update public.product_stocks
          set stock = stock + r_item.quantity, updated_at = now()
          where product_id = r_item.product_id and store_id = trg_store and warehouse_id is null;

        insert into public.stock_movements (product_id, warehouse_id, store_id, type, quantity, ref_id, ref_type)
        values (r_item.product_id, null, trg_store, 'in', r_item.quantity, new.id, 'surat_jalan');
      end if;
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists surat_jalan_approve_sync on public.surat_jalan;
create trigger surat_jalan_approve_sync
after update on public.surat_jalan
for each row execute function public.trg_surat_jalan_approve_sync_stock();
