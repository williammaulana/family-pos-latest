<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class TransactionItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_id', 'product_id', 'quantity', 'unit_price', 'total_price', 'discount'
    ];

    public $incrementing = false;
    protected $keyType = 'string';

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    protected static function booted(): void
    {
        static::creating(function (TransactionItem $item) {
            if (! $item->getKey()) {
                $item->{$item->getKeyName()} = (string) Str::uuid();
            }
        });
    }
}
