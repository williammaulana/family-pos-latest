<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // Public routes
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Protected routes
    Route::middleware(['auth.supabase'])->group(function () {

        // Auth routes
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/auth/register', [AuthController::class, 'register'])
            ->middleware('role:super_admin,admin');

        // Product routes
        Route::get('/products', [ProductController::class, 'index']);
        Route::get('/products/low-stock', [ProductController::class, 'lowStock']);
        Route::get('/products/{id}', [ProductController::class, 'show']);
        Route::post('/products', [ProductController::class, 'store'])
            ->middleware('role:super_admin,admin');
        Route::put('/products/{id}', [ProductController::class, 'update'])
            ->middleware('role:super_admin,admin');
        Route::delete('/products/{id}', [ProductController::class, 'destroy'])
            ->middleware('role:super_admin,admin');

        // Category routes
        Route::get('/categories', [CategoryController::class, 'index']);
        Route::post('/categories', [CategoryController::class, 'store'])
            ->middleware('role:super_admin,admin');

        // Transaction routes
        Route::get('/transactions', [TransactionController::class, 'index']);
        Route::get('/transactions/{id}', [TransactionController::class, 'show']);
        Route::post('/transactions', [TransactionController::class, 'store']);

        // Inventory routes
        Route::post('/inventory/adjust', [InventoryController::class, 'adjustStock'])
            ->middleware('role:super_admin,admin');
        Route::get('/inventory/history', [InventoryController::class, 'stockHistory']);

        // Report routes
        Route::get('/reports/sales', [ReportController::class, 'salesReport']);
        Route::get('/reports/product-performance', [ReportController::class, 'productPerformance']);
        Route::get('/reports/dashboard', [ReportController::class, 'dashboardStats']);

        // User routes
        Route::get('/users', [UserController::class, 'index'])
            ->middleware('role:super_admin,admin');
        Route::post('/users', [UserController::class, 'store'])
            ->middleware('role:super_admin,admin');
        Route::put('/users/{id}', [UserController::class, 'update'])
            ->middleware('role:super_admin,admin');
        Route::delete('/users/{id}', [UserController::class, 'destroy'])
            ->middleware('role:super_admin');
    });
});
