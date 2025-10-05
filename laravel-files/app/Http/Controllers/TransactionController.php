<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\SupabaseService;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class TransactionController extends Controller
{
    protected $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }

    /**
     * Get all transactions
     */
    public function index(Request $request)
    {
        try {
            $limit = $request->query('limit');

            $transactions = $this->supabase->select(
                'transactions',
                '*,users!transactions_cashier_id_fkey(name),transaction_items(*,products(name))'
            );

            if ($limit) {
                $transactions = array_slice($transactions, 0, $limit);
            }

            return response()->json([
                'success' => true,
                'data' => $transactions
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch transactions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create transaction
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_name' => 'nullable|string',
            'customer_phone' => 'nullable|string',
            'payment_method' => 'required|in:tunai,qris,transfer',
            'payment_amount' => 'required|integer|min:0',
            'cashier_id' => 'required|uuid',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|uuid',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|integer|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $items = $request->items;

            // Calculate totals
            $subtotal = 0;
            foreach ($items as $item) {
                $subtotal += $item['unit_price'] * $item['quantity'];
            }

            $discountAmount = $request->discount_amount ?? 0;
            $taxAmount = $request->tax_amount ?? 0;
            $totalAmount = $subtotal - $discountAmount + $taxAmount;
            $changeAmount = $request->payment_amount - $totalAmount;

            // Validate stock
            foreach ($items as $item) {
                $product = $this->supabase->selectOne(
                    'products',
                    'id,name,stock',
                    ['id' => $item['product_id']]
                );

                if (!$product) {
                    return response()->json([
                        'success' => false,
                        'message' => "Product {$item['product_id']} not found"
                    ], 404);
                }

                if ($product['stock'] < $item['quantity']) {
                    return response()->json([
                        'success' => false,
                        'message' => "Insufficient stock for {$product['name']}"
                    ], 400);
                }
            }

            // Generate transaction code
            $lastTransaction = $this->supabase->select(
                'transactions',
                'transaction_code'
            );

            $nextNumber = 1;
            if (!empty($lastTransaction)) {
                $lastCode = end($lastTransaction)['transaction_code'];
                $lastNumber = (int) str_replace('TRX', '', $lastCode);
                $nextNumber = $lastNumber + 1;
            }

            $transactionCode = 'TRX' . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);

            // Create transaction
            $transactionData = [
                'transaction_code' => $transactionCode,
                'customer_name' => $request->customer_name,
                'customer_phone' => $request->customer_phone,
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'total_amount' => $totalAmount,
                'tax_amount' => $taxAmount,
                'payment_method' => $request->payment_method,
                'payment_amount' => $request->payment_amount,
                'change_amount' => max(0, $changeAmount),
                'status' => 'completed',
                'cashier_id' => $request->cashier_id,
                'notes' => $request->notes
            ];

            $transaction = $this->supabase->insert('transactions', [$transactionData]);
            $transactionId = $transaction[0]['id'];

            // Create transaction items and update stock
            foreach ($items as $item) {
                $product = $this->supabase->selectOne(
                    'products',
                    'name,stock',
                    ['id' => $item['product_id']]
                );

                $totalPrice = $item['unit_price'] * $item['quantity'] - ($item['discount_amount'] ?? 0);

                // Insert transaction item
                $this->supabase->insert('transaction_items', [[
                    'transaction_id' => $transactionId,
                    'product_id' => $item['product_id'],
                    'product_name' => $product['name'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'discount_amount' => $item['discount_amount'] ?? 0,
                    'total_price' => $totalPrice
                ]]);

                // Update product stock
                $newStock = $product['stock'] - $item['quantity'];
                $this->supabase->update(
                    'products',
                    ['id' => $item['product_id']],
                    [
                        'stock' => $newStock,
                        'updated_at' => now()->toIso8601String()
                    ]
                );

                // Create stock history
                $this->supabase->insert('stock_history', [[
                    'product_id' => $item['product_id'],
                    'type' => 'out',
                    'quantity' => $item['quantity'],
                    'notes' => "Penjualan {$transactionCode}",
                    'user_id' => $request->cashier_id
                ]]);
            }

            return response()->json([
                'success' => true,
                'transaction' => $transaction[0],
                'message' => 'Transaction created successfully'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create transaction',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single transaction
     */
    public function show($id)
    {
        try {
            $transaction = $this->supabase->selectOne(
                'transactions',
                '*,users!transactions_cashier_id_fkey(name),transaction_items(*,products(name))',
                ['id' => $id]
            );

            if (!$transaction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transaction not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $transaction
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch transaction',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
