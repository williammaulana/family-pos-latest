import mysql from "mysql2/promise"

// Konfigurasi database yang fleksibel untuk berbagai provider
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "famq4413_william",
  password: process.env.DB_PASSWORD || "15juli2001",
  database: process.env.DB_NAME || "famq4413_family_store",
  port: Number.parseInt(process.env.DB_PORT || "3306"),
  // SSL configuration - otomatis detect berdasarkan host
  ssl: process.env.DB_HOST?.includes('planetscale') || process.env.DB_HOST?.includes('railway') ? {
    rejectUnauthorized: false
  } : false,
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
  // Connection pool settings untuk performa lebih baik
  connectionLimit: 10,
  queueLimit: 0,
  // Charset untuk mendukung emoji dan karakter khusus
  charset: 'utf8mb4',
  // Timezone setting
  timezone: '+07:00', // WIB
}

// Connection pool untuk performa lebih baik
let pool: mysql.Pool | null = null

export async function getConnection() {
  if (!pool) {
    try {
      // Gunakan connection pool untuk performa lebih baik
      pool = mysql.createPool(dbConfig)
      
      // Test koneksi
      const testConnection = await pool.getConnection()
      await testConnection.ping()
      testConnection.release()
      
      console.log(`[POS] MySQL connected successfully to ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`)
    } catch (error) {
      console.error("[POS] MySQL connection failed:", error)
      
      // Berikan pesan error yang lebih informatif
      if (error instanceof Error) {
        const message = error.message || String(error)
        if (message.includes('ECONNREFUSED')) {
          throw new Error(
            `Tidak dapat terhubung ke MySQL di ${dbConfig.host}:${dbConfig.port}. ` +
            `Pastikan server MySQL berjalan dan dapat diakses. ` +
            `Periksa DB_HOST/DB_PORT atau jalankan database terlebih dahulu.`
          )
        } else if (message.includes('ETIMEDOUT')) {
          throw new Error(
            `Koneksi ke MySQL timeout ke ${dbConfig.host}:${dbConfig.port}. ` +
            `Periksa firewall, jaringan, atau gunakan host yang benar (mis. host Docker atau cloud).`
          )
        } else if (message.includes('EAI_AGAIN') || message.includes('ENOTFOUND')) {
          throw new Error(`Database host tidak ditemukan atau DNS bermasalah: ${dbConfig.host}. Periksa nilai DB_HOST.`)
        }
        if (message.includes('Access denied')) {
          throw new Error(`Akses ditolak. Periksa username dan password database.`)
        } else if (message.includes('Unknown database')) {
          throw new Error(`Database '${dbConfig.database}' tidak ditemukan. Pastikan database sudah dibuat.`)
        }
      }
      throw error
    }
  }
  return pool
}

export async function executeQuery(query: string, params: any[] = []) {
  const pool = await getConnection()
  let connection: mysql.PoolConnection | null = null
  
  try {
    connection = await pool.getConnection()
    const [results] = await connection.execute(query, params)
    return results
  } catch (error) {
    console.error("[POS] Query execution failed:", error)
    console.error("[POS] Query:", query)
    console.error("[POS] Params:", params)
    
    // Berikan pesan error yang lebih informatif
    if (error instanceof Error) {
      if (error.message.includes("Table") && error.message.includes("doesn't exist")) {
        throw new Error(`Tabel tidak ditemukan. Jalankan migration terlebih dahulu: /api/migrate`)
      } else if (error.message.includes("Duplicate entry")) {
        throw new Error(`Data sudah ada. Tidak dapat menambahkan data yang sama.`)
      } else if (error.message.includes("cannot be null")) {
        throw new Error(`Field wajib tidak boleh kosong.`)
      }
    }
    throw error
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

export async function closeConnection() {
  if (pool) {
    await pool.end()
    pool = null
    console.log("[POS] MySQL connection pool closed")
  }
}

// Fungsi untuk test koneksi database
export async function testConnection() {
  try {
    const pool = await getConnection()
    const connection = await pool.getConnection()
    await connection.ping()
    connection.release()
    
    return {
      success: true,
      message: `Koneksi berhasil ke ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`,
      config: {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        user: dbConfig.user,
        ssl: !!dbConfig.ssl
      }
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      config: {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        user: dbConfig.user,
        ssl: !!dbConfig.ssl
      }
    }
  }
}
