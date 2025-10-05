<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\SupabaseService;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    protected $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }

    /**
     * Get all products
     */
    public function index(Request $request)
    {
        try {
            $products = $this->supabase->select(
                'products',
                '*,categories(name)'
            );

            return response()->json([
                'success' => true,
                'data' => $products
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch products',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single product
     */
    public function show($id)
    {
        try {
            $product = $this->supabase->selectOne(
                'products',
                '*,categories(name)',
                ['id' => $id]
            );

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $product
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create product
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string',
            'category_id' => 'required|uuid',
            'price' => 'required|integer|min:0',
            'cost_price' => 'required|integer|min:0',
            'stock' => 'required|integer|min:0',
            'min_stock' => 'required|integer|min:0',
            'unit' => 'required|string',
            'barcode' => 'nullable|string',
            'image_url' => 'nullable|url'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $productData = [
                'name' => $request->name,
                'category_id' => $request->category_id,
                'price' => $request->price,
                'cost_price' => $request->cost_price,
                'stock' => $request->stock,
                'min_stock' => $request->min_stock,
                'unit' => $request->unit,
                'barcode' => $request->barcode,
                'image_url' => $request->image_url
            ];

            $product = $this->supabase->insert('products', [$productData]);

            return response()->json([
                'success' => true,
                'data' => $product[0],
                'message' => 'Product created successfully'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update product
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string',
            'category_id' => 'sometimes|uuid',
            'price' => 'sometimes|integer|min:0',
            'cost_price' => 'sometimes|integer|min:0',
            'stock' => 'sometimes|integer|min:0',
            'min_stock' => 'sometimes|integer|min:0',
            'unit' => 'sometimes|string',
            'barcode' => 'nullable|string',
            'image_url' => 'nullable|url'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $updateData = $request->only([
                'name', 'category_id', 'price', 'cost_price',
                'stock', 'min_stock', 'unit', 'barcode', 'image_url'
            ]);

            $updateData['updated_at'] = now()->toIso8601String();

            $product = $this->supabase->update(
                'products',
                ['id' => $id],
                $updateData
            );

            return response()->json([
                'success' => true,
                'data' => $product[0],
                'message' => 'Product updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete product
     */
    public function destroy($id)
    {
        try {
            $this->supabase->delete('products', ['id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'Product deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get low stock products
     */
    public function lowStock()
    {
        try {
            $products = $this->supabase->select(
                'products',
                '*,categories(name)'
            );

            // Filter products where stock <= min_stock
            $lowStockProducts = array_filter($products, function($product) {
                return $product['stock'] <= $product['min_stock'];
            });

            return response()->json([
                'success' => true,
                'data' => array_values($lowStockProducts)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch low stock products',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
