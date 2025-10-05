<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockHistory extends Model
{
    use HasFactory;

    protected $table = 'stock_history';

    protected $fillable = [
        'product_id', 'quantity_change', 'reason'
    ];

    public $incrementing = false;
    protected $keyType = 'string';

    public $timestamps = false;

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
