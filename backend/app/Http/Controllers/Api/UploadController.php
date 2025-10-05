<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    public function logo(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'image', 'max:2048'],
        ]);
        $path = $request->file('file')->store('logos', 'public');
        return response()->json([
            'url' => Storage::disk('public')->url($path),
            'path' => $path,
        ]);
    }
}
