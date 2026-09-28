import { Pool } from "pg";

// Create a Postgres connection pool
// This connects to the default PostgreSQL instance on localhost.
// Make sure POSTGRES_URL or connection parameters are set correctly in your environment.
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || "postgres://postgres:postgres@localhost:5432/resqops",
});

/**
 * Execute a SQL query with parameters.
 */
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`Executed query: { text: ${text}, duration: ${duration}ms, rows: ${res.rowCount} }`);
    return res;
  } catch (error) {
    console.error("Database Query Error:", error);
    throw error;
  }
}
