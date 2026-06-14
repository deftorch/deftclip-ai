import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

/**
 * Database client — gunakan Neon serverless untuk Vercel edge compatibility.
 * Pastikan DATABASE_URL sudah diset di .env.local
 */
const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
