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

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type IdParam = z.infer<typeof idParamSchema>;
