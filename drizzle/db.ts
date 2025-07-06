import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from './schema'

// Initialize Neon client using DATABASE_URL from env vars
const sql = neon(process.env.DATABASE_URL!)

// Create and export the Drizzle ORM instance with the Neon client and schema for type-safe queries
export const db = drizzle(sql, { schema })