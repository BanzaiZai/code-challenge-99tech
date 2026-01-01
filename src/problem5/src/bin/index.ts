import dotenv from "dotenv";
import express from "express";
import { Client } from "pg";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env["PORT"] || 3000;

async function checkDatabaseConnection(): Promise<boolean> {
	const databaseUrl = process.env["DATABASE_URL"];

	if (!databaseUrl) {
		console.error("DATABASE_URL is not set in .env file");
		return false;
	}

	const client = new Client({ connectionString: databaseUrl });

	try {
		await client.connect();
		await client.query("SELECT 1");
		await client.end();
		console.log("Database connection successful");
		return true;
	} catch (error) {
		console.error("Database connection failed:", error);
		return false;
	}
}

app.get("/health", (req, res) => {
	res.json({ status: "ok" });
});

async function startServer() {
	const dbActive = await checkDatabaseConnection();

	if (!dbActive) {
		console.warn("Starting server without database connection");
	}

	app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	});
}

startServer();
