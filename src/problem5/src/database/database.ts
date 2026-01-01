import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./tables/index";

const databaseUrl = process.env["DATABASE_URL"];

if (!databaseUrl) {
	throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
	connectionString: databaseUrl,
});

pool.on("error", (err) => {
	console.error("Unexpected pool error:", err);
});

export const db = drizzle(pool, { schema });
export { pool };
