<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TransactionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $transactions = Transaction::with(['items.product', 'cashier'])->orderByDesc('created_at')->paginate(50);
        return response()->json($transactions);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => ['required', 'string'],
            'payment_method' => ['required', Rule::in(['tunai','kartu_debit','kartu_kredit','e_wallet','qris','transfer_bank'])],
            'payment_amount' => ['required', 'integer', 'min:0'],
            'cashier_id' => ['required', 'uuid'],
            'discount_amount' => ['sometimes', 'integer', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'uuid', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'integer', 'min:0'],
            'items.*.total_price' => ['required', 'integer', 'min:0'],
            'items.*.discount' => ['sometimes', 'integer', 'min:0'],
        ]);

        return DB::transaction(function () use ($validated) {
            $lastCode = Transaction::orderByDesc('created_at')->value('transaction_code');
            $nextNumber = 1;
            if ($lastCode && str_starts_with($lastCode, 'TRX')) {
                $num = (int) substr($lastCode, 3);
                if ($num > 0) $nextNumber = $num + 1;
            }
            $transactionCode = 'TRX' . str_pad((string) $nextNumber, 3, '0', STR_PAD_LEFT);

            $subtotal = collect($validated['items'])->sum('total_price');
            $tax = (int) floor($subtotal * 0.1);
            $discountAmount = (int) ($validated['discount_amount'] ?? 0);
            $total = max(0, $subtotal + $tax - $discountAmount);
            $change = max(0, (int)$validated['payment_amount'] - $total);

            $trx = Transaction::create([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'transaction_code' => $transactionCode,
                'customer_name' => $validated['customer_name'],
                'payment_method' => $validated['payment_method'],
                'payment_amount' => $validated['payment_amount'],
                'change_amount' => $change,
                'total_amount' => $total,
                'tax_amount' => $tax,
                'discount_amount' => $discountAmount,
                'status' => 'completed',
                'cashier_id' => $validated['cashier_id'],
            ]);

            foreach ($validated['items'] as $item) {
                TransactionItem::create([
                    'id' => (string) \Illuminate\Support\Str::uuid(),
                    'transaction_id' => $trx->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['total_price'],
                    'discount' => $item['discount'] ?? 0,
                ]);
                Product::where('id', $item['product_id'])->decrement('stock', $item['quantity']);
            }

            return response()->json($trx->load(['items.product']), 201);
        });
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $transaction = Transaction::with(['items.product', 'cashier'])->findOrFail($id);
        return response()->json($transaction);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $transaction = Transaction::findOrFail($id);
        $transaction->delete();
        return response()->json(['success' => true]);
    }
}
