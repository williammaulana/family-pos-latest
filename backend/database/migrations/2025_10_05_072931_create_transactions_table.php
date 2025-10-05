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
        Schema::create('transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('transaction_code', 20)->unique();
            $table->string('customer_name')->nullable();
            $table->string('customer_phone', 20)->nullable();
            $table->unsignedBigInteger('total_amount');
            $table->unsignedBigInteger('tax_amount')->default(0);
            $table->enum('payment_method', ['tunai', 'kartu_debit', 'kartu_kredit', 'e_wallet', 'qris', 'transfer_bank']);
            $table->unsignedBigInteger('payment_amount');
            $table->unsignedBigInteger('change_amount')->default(0);
            $table->enum('status', ['completed', 'cancelled'])->default('completed');
            $table->uuid('cashier_id');
            $table->unsignedBigInteger('discount_amount')->default(0);
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->nullable();

            $table->foreign('cashier_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index('cashier_id');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
