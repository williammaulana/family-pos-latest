import mysql from "mysql2/promise"

type AnyError = (Error & {
  code?: string
  errno?: number
  fatal?: boolean
  errors?: unknown[]
}) | any

function flattenAggregateError(error: unknown): AnyError {
  const err = error as AnyError
  if (err && Array.isArray(err?.errors) && err.errors.length > 0) {
    const innerWithCode = (err.errors as AnyError[]).find((e) => e && (e.code || e.errno))
    return (innerWithCode || err.errors[0]) as AnyError
  }
  return err
}

function toFriendlyDbError(error: unknown, context: "connect" | "query" | "ping" = "connect"): Error {
  const primary = flattenAggregateError(error)
  const rawMessage = (primary?.message || String(primary || error || "")) as string
  const lower = rawMessage.toLowerCase()
  const code = (primary?.code || "").toString()

  if (code === "ECONNREFUSED" || lower.includes("econnrefused")) {
    return new Error(
      `Tidak dapat terhubung ke MySQL di ${dbConfig.host}:${dbConfig.port}. ` +
        `Pastikan server MySQL berjalan, port terbuka, dan kredensial benar. ` +
        `Periksa DB_HOST/DB_PORT atau jalankan database terlebih dahulu.`
    )
  }
  if (code === "ETIMEDOUT" || lower.includes("etimedout") || lower.includes("timed out") || lower.includes("timeout")) {
    return new Error(
      `Koneksi ke MySQL timeout ke ${dbConfig.host}:${dbConfig.port}. ` +
        `Periksa firewall/jaringan atau gunakan host yang benar (mis. host Docker/cloud).`
    )
  }
  if (code === "EAI_AGAIN" || code === "ENOTFOUND" || lower.includes("eai_again") || lower.includes("enotfound")) {
    return new Error(`Database host tidak ditemukan atau DNS bermasalah: ${dbConfig.host}. Periksa nilai DB_HOST.`)
  }
  if (lower.includes("access denied") || code === "ER_ACCESS_DENIED_ERROR") {
    return new Error(`Akses ditolak. Periksa username dan password database.`)
  }
  if (lower.includes("unknown database") || code === "ER_BAD_DB_ERROR") {
    return new Error(`Database '${dbConfig.database}' tidak ditemukan. Pastikan database sudah dibuat.`)
  }

  return primary instanceof Error ? primary : new Error(rawMessage)
}

// Konfigurasi database yang fleksibel untuk berbagai provider
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "family_store_pos",
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
      throw toFriendlyDbError(error, "connect")
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
    
    const friendly = toFriendlyDbError(error, "query")
    const originalMsg = (error as any)?.message || ""
    if (typeof originalMsg === "string") {
      if (originalMsg.includes("Table") && originalMsg.includes("doesn't exist")) {
        throw new Error(`Tabel tidak ditemukan. Jalankan migration terlebih dahulu: /api/migrate`)
      } else if (originalMsg.includes("Duplicate entry")) {
        throw new Error(`Data sudah ada. Tidak dapat menambahkan data yang sama.`)
      } else if (originalMsg.includes("cannot be null")) {
        throw new Error(`Field wajib tidak boleh kosong.`)
      }
    }
    throw friendly
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
    const friendly = toFriendlyDbError(error, "ping")
    return {
      success: false,
      message: friendly.message,
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
