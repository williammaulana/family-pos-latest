<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function createInvoice(Request $request)
    {
        $validated = $request->validate([
            'amount' => ['required', 'integer', 'min:1000'],
            'description' => ['nullable', 'string'],
            'payer_email' => ['nullable', 'email'],
        ]);

        // Stub: integrate Xendit SDK here
        $invoice = [
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'status' => 'PENDING',
            'amount' => $validated['amount'],
            'description' => $validated['description'] ?? null,
            'invoice_url' => 'https://demo-payments.local/invoice/'.uniqid('inv_'),
        ];

        return response()->json($invoice, 201);
    }
}
