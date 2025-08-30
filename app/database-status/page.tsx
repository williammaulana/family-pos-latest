"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

interface ConnectionStatus {
  success: boolean
  message: string
  config: {
    host: string
    port: number
    database: string
    user: string
    ssl: boolean
  }
  timestamp: string
}

interface MigrationStatus {
  success: boolean
  migrations: Array<{
    id: number
    name: string
    executed_at: string
  }>
}

export default function DatabaseStatusPage() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null)
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [migrating, setMigrating] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-connection')
      const data = await response.json()
      setConnectionStatus(data)
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: 'Gagal menghubungi API test koneksi',
        config: { host: '', port: 0, database: '', user: '', ssl: false },
        timestamp: new Date().toISOString()
      })
    }
    setLoading(false)
  }

  const checkMigrations = async () => {
    try {
      const response = await fetch('/api/migrate')
      const data = await response.json()
      setMigrationStatus(data)
    } catch (error) {
      setMigrationStatus({
        success: false,
        migrations: []
      })
    }
  }

  const runMigrations = async () => {
    setMigrating(true)
    try {
      const response = await fetch('/api/migrate', { method: 'POST' })
      const data = await response.json()
      setMigrationStatus(data)
      
      if (data.success) {
        // Refresh connection status after successful migration
        await testConnection()
      }
    } catch (error) {
      setMigrationStatus({
        success: false,
        migrations: []
      })
    }
    setMigrating(false)
  }

  useEffect(() => {
    testConnection()
    checkMigrations()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Status Database</h1>
          <p className="text-muted-foreground">
            Monitor koneksi database dan status migration
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={testConnection} disabled={loading}>
            {loading ? "Testing..." : "Test Koneksi"}
          </Button>
          <Button onClick={runMigrations} disabled={migrating} variant="outline">
            {migrating ? "Migrating..." : "Jalankan Migration"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Status Koneksi Database
              {connectionStatus && (
                <Badge variant={connectionStatus.success ? "default" : "destructive"}>
                  {connectionStatus.success ? "Terhubung" : "Gagal"}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Informasi koneksi ke database MySQL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {connectionStatus ? (
              <>
                <Alert variant={connectionStatus.success ? "default" : "destructive"}>
                  <AlertDescription>
                    {connectionStatus.message}
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Host:</span>
                    <span className="font-mono">{connectionStatus.config.host}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Port:</span>
                    <span className="font-mono">{connectionStatus.config.port}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Database:</span>
                    <span className="font-mono">{connectionStatus.config.database}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">User:</span>
                    <span className="font-mono">{connectionStatus.config.user}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">SSL:</span>
                    <Badge variant={connectionStatus.config.ssl ? "default" : "secondary"}>
                      {connectionStatus.config.ssl ? "Aktif" : "Tidak Aktif"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Waktu Test:</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(connectionStatus.timestamp).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Klik "Test Koneksi" untuk memulai</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Migration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Status Migration Database
              {migrationStatus && (
                <Badge variant={migrationStatus.success ? "default" : "destructive"}>
                  {migrationStatus.success ? "Berhasil" : "Gagal"}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Daftar migration yang sudah dijalankan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {migrationStatus ? (
              <div className="space-y-4">
                {migrationStatus.success ? (
                  <>
                    <Alert>
                      <AlertDescription>
                        {migrationStatus.migrations.length} migration berhasil dijalankan
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2">
                      {migrationStatus.migrations.map((migration) => (
                        <div key={migration.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Migration #{migration.id}</p>
                            <p className="text-sm text-muted-foreground">{migration.name}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">Selesai</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(migration.executed_at).toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Migration gagal dijalankan. Periksa koneksi database.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Loading status migration...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Panduan Setup Database</CardTitle>
          <CardDescription>
            Ikuti langkah-langkah berikut jika koneksi database gagal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">1. MySQL Lokal</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Install MySQL di komputer Anda untuk development
              </p>
              <ul className="text-sm space-y-1">
                <li>• Performa sangat cepat</li>
                <li>• Tidak perlu internet</li>
                <li>• Full control</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">2. Railway (Cloud)</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Database cloud gratis dengan performa tinggi
              </p>
              <ul className="text-sm space-y-1">
                <li>• 500 jam gratis/bulan</li>
                <li>• SSL otomatis</li>
                <li>• Backup otomatis</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">3. PlanetScale</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Database serverless dengan branching seperti Git
              </p>
              <ul className="text-sm space-y-1">
                <li>• 1GB storage gratis</li>
                <li>• Serverless scaling</li>
                <li>• Zero-downtime schema</li>
              </ul>
            </div>
          </div>
          
          <Separator />
          
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">File konfigurasi yang perlu diedit:</p>
            <ul className="space-y-1">
              <li>• <code className="bg-muted px-1 rounded">.env.local</code> - Konfigurasi database</li>
              <li>• Lihat folder <code className="bg-muted px-1 rounded">scripts/</code> untuk panduan lengkap</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
