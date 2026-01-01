import "dotenv/config";
import express from "express";
import { Client } from "pg";
import {
	createUser,
	deleteUser,
	getAllUsers,
	getUserById,
	updateUser,
} from "../controllers/users.controller";
import { pool } from "../database/database";
import { errorHandler, notFoundHandler } from "../middleware/errorHandler";

const app = express();
app.use(express.json());

const PORT = process.env["PORT"] || 3000;
let server: ReturnType<typeof app.listen>;

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

app.post("/users", createUser);
app.get("/users", getAllUsers);
app.get("/users/:id", getUserById);
app.put("/users/:id", updateUser);
app.delete("/users/:id", deleteUser);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
	const dbActive = await checkDatabaseConnection();

	if (!dbActive) {
		console.warn("Starting server without database connection");
	}

	server = app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	});
}

async function shutdown(signal: string) {
	console.log(`\nReceived ${signal}. Shutting down gracefully...`);

	server.close(async () => {
		console.log("Server closed");
		await pool.end();
		console.log("Database pool closed");
		process.exit(0);
	});

	setTimeout(() => {
		console.error("Forced shutdown after timeout");
		process.exit(1);
	}, 10000);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer();
