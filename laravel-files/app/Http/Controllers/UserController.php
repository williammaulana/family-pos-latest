<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\SupabaseService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    protected $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }

    /**
     * Get all users
     */
    public function index()
    {
        try {
            $users = $this->supabase->select('users', 'id,email,name,role,created_at,updated_at');

            return response()->json([
                'success' => true,
                'data' => $users
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch users',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create user
     */
    public function store(Request $request)
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
            $userData = [
                'email' => $request->email,
                'name' => $request->name,
                'password_hash' => Hash::make($request->password),
                'role' => $request->role
            ];

            $user = $this->supabase->insert('users', [$userData]);

            unset($user[0]['password_hash']);

            return response()->json([
                'success' => true,
                'data' => $user[0],
                'message' => 'User created successfully'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update user
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'sometimes|email',
            'name' => 'sometimes|string',
            'password' => 'sometimes|string|min:6',
            'role' => 'sometimes|in:super_admin,admin,kasir'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $updateData = $request->only(['email', 'name', 'role']);

            if ($request->has('password')) {
                $updateData['password_hash'] = Hash::make($request->password);
            }

            $updateData['updated_at'] = now()->toIso8601String();

            $user = $this->supabase->update('users', ['id' => $id], $updateData);

            if (!empty($user)) {
                unset($user[0]['password_hash']);
            }

            return response()->json([
                'success' => true,
                'data' => $user[0] ?? null,
                'message' => 'User updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete user
     */
    public function destroy($id)
    {
        try {
            $this->supabase->delete('users', ['id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
