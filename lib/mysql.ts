import mysql from "mysql2/promise"

// MySQL connection configuration for InfinityFree
const dbConfig = {
  host: process.env.DB_HOST || "sql208.infinityfree.com",
  user: process.env.DB_USER || "",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "",
  port: Number.parseInt(process.env.DB_PORT || "3306"),
  ssl: false,
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
}

let connection: mysql.Connection | null = null

export async function getConnection() {
  if (!connection) {
    try {
      connection = await mysql.createConnection(dbConfig)
      console.log("[v0] MySQL connected successfully")
    } catch (error) {
      console.error("[v0] MySQL connection failed:", error)
      throw error
    }
  }
  return connection
}

export async function executeQuery(query: string, params: any[] = []) {
  const conn = await getConnection()
  try {
    const [results] = await conn.execute(query, params)
    return results
  } catch (error) {
    console.error("[v0] Query execution failed:", error)
    throw error
  }
}

export async function closeConnection() {
  if (connection) {
    await connection.end()
    connection = null
  }
}
