<?php

namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class SupabaseService
{
    protected $client;
    protected $baseUrl;
    protected $apiKey;

    public function __construct()
    {
        $this->baseUrl = config('services.supabase.url');
        $this->apiKey = config('services.supabase.key');

        $this->client = new Client([
            'base_uri' => $this->baseUrl,
            'headers' => [
                'apikey' => $this->apiKey,
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
                'Prefer' => 'return=representation'
            ]
        ]);
    }

    /**
     * Select data from table
     */
    public function select($table, $columns = '*', $filters = [])
    {
        try {
            $url = "/rest/v1/{$table}?select={$columns}";

            // Add filters
            foreach ($filters as $key => $value) {
                if (is_array($value)) {
                    $url .= "&{$key}={$value['operator']}.{$value['value']}";
                } else {
                    $url .= "&{$key}=eq.{$value}";
                }
            }

            $response = $this->client->get($url);
            return json_decode($response->getBody(), true);
        } catch (\Exception $e) {
            Log::error('Supabase Select Error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Insert data into table
     */
    public function insert($table, $data)
    {
        try {
            $response = $this->client->post("/rest/v1/{$table}", [
                'json' => $data
            ]);
            return json_decode($response->getBody(), true);
        } catch (\Exception $e) {
            Log::error('Supabase Insert Error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update data in table
     */
    public function update($table, $filters, $data)
    {
        try {
            $url = "/rest/v1/{$table}?";

            foreach ($filters as $key => $value) {
                $url .= "{$key}=eq.{$value}&";
            }

            $url = rtrim($url, '&');

            $response = $this->client->patch($url, [
                'json' => $data
            ]);
            return json_decode($response->getBody(), true);
        } catch (\Exception $e) {
            Log::error('Supabase Update Error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Delete data from table
     */
    public function delete($table, $filters)
    {
        try {
            $url = "/rest/v1/{$table}?";

            foreach ($filters as $key => $value) {
                $url .= "{$key}=eq.{$value}&";
            }

            $url = rtrim($url, '&');

            $response = $this->client->delete($url);
            return true;
        } catch (\Exception $e) {
            Log::error('Supabase Delete Error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Execute RPC function
     */
    public function rpc($functionName, $params = [])
    {
        try {
            $response = $this->client->post("/rest/v1/rpc/{$functionName}", [
                'json' => $params
            ]);
            return json_decode($response->getBody(), true);
        } catch (\Exception $e) {
            Log::error('Supabase RPC Error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get single record
     */
    public function selectOne($table, $columns = '*', $filters = [])
    {
        $results = $this->select($table, $columns, $filters);
        return !empty($results) ? $results[0] : null;
    }
}
