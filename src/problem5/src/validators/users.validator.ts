import { eq } from "drizzle-orm";
import { db } from "../database/database";
import { users } from "../database/tables/index";

export async function isEmailUnique(
	email: string,
	excludeUserId?: number,
): Promise<boolean> {
	const query = db.select().from(users).where(eq(users.email, email));
	const [user] = await query;

	if (!user) {
		return true;
	}

	return excludeUserId !== undefined && user.id === excludeUserId;
}

export async function doesUserExist(id: number): Promise<boolean> {
	const [user] = await db.select().from(users).where(eq(users.id, id));
	return Boolean(user);
}
