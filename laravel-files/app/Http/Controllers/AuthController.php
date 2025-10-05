<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\SupabaseService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    protected $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Get user by email
            $user = $this->supabase->selectOne('users', '*', [
                'email' => $request->email
            ]);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials'
                ], 401);
            }

            // Verify password
            if (!Hash::check($request->password, $user['password_hash'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials'
                ], 401);
            }

            // Generate token (simple implementation)
            $token = base64_encode(json_encode([
                'user_id' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role'],
                'exp' => time() + (24 * 60 * 60) // 24 hours
            ]));

            // Remove password from response
            unset($user['password_hash']);

            return response()->json([
                'success' => true,
                'user' => $user,
                'token' => $token
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Login failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Register new user
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'name' => 'required|string',
            'password' => 'required|string|min:6',
            'role' => 'required|in:super_admin,admin,kasir'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if email exists
            $existingUser = $this->supabase->selectOne('users', 'id', [
                'email' => $request->email
            ]);

            if ($existingUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email already exists'
                ], 409);
            }

            // Create user
            $userData = [
                'email' => $request->email,
                'name' => $request->name,
                'password_hash' => Hash::make($request->password),
                'role' => $request->role
            ];

            $user = $this->supabase->insert('users', [$userData]);

            if (!empty($user)) {
                unset($user[0]['password_hash']);

                return response()->json([
                    'success' => true,
                    'user' => $user[0],
                    'message' => 'User registered successfully'
                ], 201);
            }

            throw new \Exception('Failed to create user');

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Registration failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        // In a real application, you would invalidate the token here
        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }
}
