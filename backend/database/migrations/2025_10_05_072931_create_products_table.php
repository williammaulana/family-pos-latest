<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->uuid('category_id')->nullable();
            $table->unsignedBigInteger('price');
            $table->integer('stock')->default(0);
            $table->integer('min_stock')->default(10);
            $table->string('barcode')->nullable()->unique();
            $table->text('image_url')->nullable();
            $table->unsignedBigInteger('cost_price')->nullable();
            $table->string('unit')->nullable();
            $table->string('sku')->nullable();
            $table->text('description')->nullable();
            $table->timestampsTz();

            $table->foreign('category_id')->references('id')->on('categories')->cascadeOnDelete();
            $table->index('category_id');
            $table->index('barcode');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
