import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	name: varchar("name").notNull(),
	email: varchar("email").notNull().unique(),
});
