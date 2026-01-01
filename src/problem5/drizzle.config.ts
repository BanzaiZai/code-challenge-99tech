import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/database/tables",
	out: "./src/database/migrations",
	// biome-ignore lint/style/noNonNullAssertion: <ENV Value>
	dbCredentials: { url: process.env["DATABASE_URL"]! },
});
