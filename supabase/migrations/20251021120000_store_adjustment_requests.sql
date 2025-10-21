-- Store Adjustment Requests (Gudang meminta perubahan stok pada Toko)
-- Termasuk approval oleh admin toko sebelum sinkron stok berjalan

-- Enable pgcrypto for gen_random_uuid if not enabled (safe no-op if already enabled)
create extension if not exists pgcrypto;

create table if not exists public.store_adjustment_requests (
  id uuid primary key default gen_random_uuid(),
  nomor text unique not null,
  warehouse_id uuid not null references public.warehouses(id) on delete restrict,
  store_id uuid not null references public.stores(id) on delete restrict,
  type text not null check (type in ('increase','decrease')),
  status text not null default 'Draft' check (status in ('Draft','Disetujui','Ditolak','Dibatalkan')),
  requested_by uuid not null,
  approved_by uuid,
  tanggal date not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.store_adjustment_request_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.store_adjustment_requests(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit text
);

-- Approval trigger: when a request is approved, update store product_stocks
create or replace function public.trg_store_adjust_request_approve_sync_stock()
returns trigger
language plpgsql
as $$
declare
  r_item record;
begin
  if (TG_OP = 'UPDATE') and (new.status = 'Disetujui') and (old.status is distinct from 'Disetujui') then
    for r_item in
      select i.product_id, i.quantity from public.store_adjustment_request_items i where i.request_id = new.id
    loop
      -- pastikan baris stok toko ada
      perform public.ensure_product_stock_row(r_item.product_id, null, new.store_id);

      if new.type = 'increase' then
        update public.product_stocks
          set stock = stock + r_item.quantity, updated_at = now()
          where product_id = r_item.product_id and store_id = new.store_id and warehouse_id is null;

        insert into public.stock_movements (product_id, warehouse_id, store_id, type, quantity, ref_id, ref_type)
        values (r_item.product_id, null, new.store_id, 'in', r_item.quantity, new.id, 'store_adjustment');
      elsif new.type = 'decrease' then
        update public.product_stocks
          set stock = greatest(0, stock - r_item.quantity), updated_at = now()
          where product_id = r_item.product_id and store_id = new.store_id and warehouse_id is null;

        insert into public.stock_movements (product_id, warehouse_id, store_id, type, quantity, ref_id, ref_type)
        values (r_item.product_id, null, new.store_id, 'out', r_item.quantity, new.id, 'store_adjustment');
      end if;
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists store_adjust_request_approve_sync on public.store_adjustment_requests;
create trigger store_adjust_request_approve_sync
after update on public.store_adjustment_requests
for each row execute function public.trg_store_adjust_request_approve_sync_stock();
