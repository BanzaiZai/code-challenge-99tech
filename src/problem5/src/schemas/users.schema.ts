import { z } from "zod";

export const createUserSchema = z.object({
	name: z
		.string()
		.min(2, "Name must be at least 2 characters")
		.max(100, "Name must not exceed 100 characters"),
	email: z.email("Invalid email format"),
});

export const updateUserSchema = z
	.object({
		name: z
			.string()
			.min(2, "Name must be at least 2 characters")
			.max(100, "Name must not exceed 100 characters")
			.optional(),
		email: z.email("Invalid email format"),
	})
	.refine((data) => data.name || data.email, {
		message: "At least one field (name or email) must be provided",
	});

export const idParamSchema = z.object({
	id: z
		.string()
		.regex(/^\d+$/, "ID must be a positive integer")
		.transform(Number),
});

export const getUsersQuerySchema = z.object({
	limit: z
		.string()
		.regex(/^\d+$/, "Limit must be a positive integer")
		.transform(Number)
		.refine((n) => n >= 1 && n <= 100, "Limit must be between 1 and 100")
		.default(10),
	offset: z
		.string()
		.regex(/^\d+$/, "Offset must be a positive integer")
		.transform(Number)
		.refine((n) => n >= 0, "Offset must be a non-negative integer")
		.default(0),
	sortBy: z.enum(["id", "name", "email"]).default("id"),
	sortOrder: z.enum(["asc", "desc"]).default("asc"),
	email: z.string().optional(),
	name: z.string().optional(),
	search: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type IdParam = z.infer<typeof idParamSchema>;
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;
