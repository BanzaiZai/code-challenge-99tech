import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { db } from "../database/database";
import { users } from "../database/tables/index";
import { BusinessError, ValidationError } from "../errors/index";
import {
	createUserSchema,
	idParamSchema,
	updateUserSchema,
} from "../schemas/users.schema";
import { doesUserExist, isEmailUnique } from "../validators/users.validator";

export async function createUser(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	try {
		const validationResult = createUserSchema.safeParse(req.body);

		if (!validationResult.success) {
			throw ValidationError.fromZod(validationResult.error);
		}

		const { name, email } = validationResult.data;

		const emailExists = !(await isEmailUnique(email));
		if (emailExists) {
			throw new BusinessError(409, "DUPLICATE_EMAIL", "Email already exists");
		}

		const [newUser] = await db
			.insert(users)
			.values({ name, email })
			.returning();

		res.status(201).json({ data: newUser });
	} catch (error) {
		next(error);
	}
}

export async function getAllUsers(
	_req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	try {
		const allUsers = await db.select().from(users);
		res.json({ data: allUsers, count: allUsers.length });
	} catch (error) {
		next(error);
	}
}

export async function getUserById(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	try {
		const paramsResult = idParamSchema.safeParse(req.params);

		if (!paramsResult.success) {
			throw ValidationError.fromZod(paramsResult.error);
		}

		const { id } = paramsResult.data;

		const [user] = await db.select().from(users).where(eq(users.id, id));

		if (!user) {
			throw new BusinessError(404, "USER_NOT_FOUND", "User not found");
		}

		res.json({ data: user });
	} catch (error) {
		next(error);
	}
}

export async function updateUser(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	try {
		const paramsResult = idParamSchema.safeParse(req.params);

		if (!paramsResult.success) {
			throw ValidationError.fromZod(paramsResult.error);
		}

		const { id } = paramsResult.data;

		const bodyResult = updateUserSchema.safeParse(req.body);

		if (!bodyResult.success) {
			throw ValidationError.fromZod(bodyResult.error);
		}

		const userExists = await doesUserExist(id);
		if (!userExists) {
			throw new BusinessError(404, "USER_NOT_FOUND", "User not found");
		}

		const { name, email } = bodyResult.data;

		if (email) {
			const emailExists = !(await isEmailUnique(email, id));
			if (emailExists) {
				throw new BusinessError(409, "DUPLICATE_EMAIL", "Email already exists");
			}
		}

		const updateData: Record<string, string> = {};
		if (name) updateData["name"] = name;
		if (email) updateData["email"] = email;

		const [updatedUser] = await db
			.update(users)
			.set(updateData)
			.where(eq(users.id, id))
			.returning();

		res.json({ data: updatedUser });
	} catch (error) {
		next(error);
	}
}

export async function deleteUser(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	try {
		const paramsResult = idParamSchema.safeParse(req.params);

		if (!paramsResult.success) {
			throw ValidationError.fromZod(paramsResult.error);
		}

		const { id } = paramsResult.data;

		const userExists = await doesUserExist(id);
		if (!userExists) {
			throw new BusinessError(404, "USER_NOT_FOUND", "User not found");
		}

		await db.delete(users).where(eq(users.id, id));

		res.status(204).send();
	} catch (error) {
		next(error);
	}
}
