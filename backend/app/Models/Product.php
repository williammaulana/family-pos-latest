<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'category_id', 'price', 'stock', 'min_stock', 'barcode', 'image_url',
        'cost_price', 'unit', 'sku', 'description'
    ];

    public $incrementing = false;
    protected $keyType = 'string';

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function stockHistory()
    {
        return $this->hasMany(StockHistory::class);
    }

    public function transactionItems()
    {
        return $this->hasMany(TransactionItem::class);
    }

    protected static function booted(): void
    {
        static::creating(function (Product $product) {
            if (! $product->getKey()) {
                $product->{$product->getKeyName()} = (string) Str::uuid();
            }
        });
    }
}
