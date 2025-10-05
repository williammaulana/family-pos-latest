<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_code', 'customer_name', 'customer_phone', 'total_amount', 'tax_amount',
        'payment_method', 'payment_amount', 'change_amount', 'status', 'cashier_id', 'discount_amount'
    ];

    public $incrementing = false;
    protected $keyType = 'string';

    public function items()
    {
        return $this->hasMany(TransactionItem::class);
    }

    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    protected static function booted(): void
    {
        static::creating(function (Transaction $trx) {
            if (! $trx->getKey()) {
                $trx->{$trx->getKeyName()} = (string) Str::uuid();
            }
        });
    }
}
