<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\SupabaseService;
use Carbon\Carbon;

class ReportController extends Controller
{
    protected $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }

    /**
     * Sales report
     */
    public function salesReport(Request $request)
    {
        try {
            $days = $request->query('days', 30);
            $startDate = Carbon::now()->subDays($days)->toIso8601String();

            $transactions = $this->supabase->select(
                'transactions',
                'created_at,total_amount',
                [
                    'created_at' => [
                        'operator' => 'gte',
                        'value' => $startDate
                    ]
                ]
            );

            // Group by date
            $salesByDate = [];
            foreach ($transactions as $transaction) {
                $date = substr($transaction['created_at'], 0, 10);

                if (!isset($salesByDate[$date])) {
                    $salesByDate[$date] = [
                        'date' => $date,
                        'total_sales' => 0,
                        'total_transactions' => 0
                    ];
                }

                $salesByDate[$date]['total_sales'] += $transaction['total_amount'];
                $salesByDate[$date]['total_transactions'] += 1;
            }

            // Calculate average
            foreach ($salesByDate as &$data) {
                $data['average_transaction'] = $data['total_sales'] / $data['total_transactions'];
            }

            return response()->json([
                'success' => true,
                'data' => array_values($salesByDate)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch sales report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Product performance report
     */
    public function productPerformance()
    {
        try {
            $items = $this->supabase->select(
                'transaction_items',
                '*,products(name,cost_price,categories(name))'
            );

            // Group by product
            $productStats = [];
            foreach ($items as $item) {
                $productId = $item['product_id'];

                if (!isset($productStats[$productId])) {
                    $productStats[$productId] = [
                        'product_id' => $productId,
                        'product_name' => $item['products']['name'] ?? $item['product_name'],
                        'category' => $item['products']['categories']['name'] ?? 'Unknown',
                        'total_sold' => 0,
                        'revenue' => 0,
                        'profit' => 0
                    ];
                }

                $productStats[$productId]['total_sold'] += $item['quantity'];
                $productStats[$productId]['revenue'] += $item['total_price'];

                // Calculate profit
                $costPrice = $item['products']['cost_price'] ?? 0;
                $unitProfit = $item['unit_price'] - $costPrice;
                $productStats[$productId]['profit'] += $unitProfit * $item['quantity'];
            }

            return response()->json([
                'success' => true,
                'data' => array_values($productStats)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch product performance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Dashboard statistics
     */
    public function dashboardStats()
    {
        try {
            $today = Carbon::today()->toIso8601String();
            $yesterday = Carbon::yesterday()->toIso8601String();

            // Today's transactions
            $todayTransactions = $this->supabase->select(
                'transactions',
                'total_amount,transaction_items(quantity)',
                [
                    'created_at' => [
                        'operator' => 'gte',
                        'value' => $today
                    ]
                ]
            );

            // Yesterday's transactions
            $yesterdayTransactions = $this->supabase->select(
                'transactions',
                'total_amount,transaction_items(quantity)',
                [
                    'created_at' => [
                        'operator' => 'gte',
                        'value' => $yesterday
                    ],
                    'created_at' => [
                        'operator' => 'lt',
                        'value' => $today
                    ]
                ]
            );

            // Calculate totals
            $todayTotal = array_sum(array_column($todayTransactions, 'total_amount'));
            $yesterdayTotal = array_sum(array_column($yesterdayTransactions, 'total_amount'));

            $todayCount = count($todayTransactions);
            $yesterdayCount = count($yesterdayTransactions);

            // Calculate products sold
            $todayProductsSold = 0;
            foreach ($todayTransactions as $trans) {
                foreach ($trans['transaction_items'] as $item) {
                    $todayProductsSold += $item['quantity'];
                }
            }

            // Get total stock
            $products = $this->supabase->select('products', 'stock');
            $totalStock = array_sum(array_column($products, 'stock'));

            // Calculate growth
            $salesGrowth = $yesterdayTotal > 0
                ? round((($todayTotal - $yesterdayTotal) / $yesterdayTotal) * 100)
                : 0;

            $transactionsGrowth = $yesterdayCount > 0
                ? round((($todayCount - $yesterdayCount) / $yesterdayCount) * 100)
                : 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'total_sales' => $todayTotal,
                    'products_sold' => $todayProductsSold,
                    'available_stock' => $totalStock,
                    'today_transactions' => $todayCount,
                    'sales_growth' => $salesGrowth,
                    'transactions_growth' => $transactionsGrowth
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
