<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\SupabaseService;
use Illuminate\Support\Facades\Validator;

class InventoryController extends Controller
{
    protected $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }

    /**
     * Adjust product stock
     */
    public function adjustStock(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|uuid',
            'quantity' => 'required|integer',
            'type' => 'required|in:in,out,adjustment',
            'user_id' => 'required|uuid',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Get current product stock
            $product = $this->supabase->selectOne(
                'products',
                'stock',
                ['id' => $request->product_id]
            );

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found'
                ], 404);
            }

            // Calculate new stock
            $currentStock = $product['stock'];
            $newStock = $currentStock;

            if ($request->type === 'in') {
                $newStock += $request->quantity;
            } elseif ($request->type === 'out') {
                $newStock -= $request->quantity;
            } else {
                $newStock = $request->quantity;
            }

            if ($newStock < 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Stock cannot be negative'
                ], 400);
            }

            // Update product stock
            $this->supabase->update(
                'products',
                ['id' => $request->product_id],
                [
                    'stock' => $newStock,
                    'updated_at' => now()->toIso8601String()
                ]
            );

            // Create stock history
            $historyData = [
                'product_id' => $request->product_id,
                'type' => $request->type,
                'quantity' => $request->type === 'adjustment'
                    ? ($request->quantity - $currentStock)
                    : $request->quantity,
                'notes' => $request->notes,
                'user_id' => $request->user_id
            ];

            $this->supabase->insert('stock_history', [$historyData]);

            return response()->json([
                'success' => true,
                'message' => 'Stock adjusted successfully',
                'data' => [
                    'old_stock' => $currentStock,
                    'new_stock' => $newStock
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to adjust stock',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get stock history
     */
    public function stockHistory(Request $request)
    {
        try {
            $productId = $request->query('product_id');
            $limit = $request->query('limit');

            $filters = [];
            if ($productId) {
                $filters['product_id'] = $productId;
            }

            $history = $this->supabase->select(
                'stock_history',
                '*,products(name),users(name)',
                $filters
            );

            if ($limit) {
                $history = array_slice($history, 0, $limit);
            }

            return response()->json([
                'success' => true,
                'data' => $history
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch stock history',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
