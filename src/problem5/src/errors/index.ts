import type { ZodError } from "zod";

export interface ValidationErrorDetail {
	field: string;
	message: string;
}

export interface ValidationErrorResponse {
	code: string;
	message: string;
	details?: ValidationErrorDetail[];
}

export interface BusinessErrorResponse {
	code: string;
	message: string;
}

export interface TechnicalErrorResponse {
	code: string;
	message: string;
}

export abstract class BaseError extends Error {
	abstract statusCode: number;
	abstract code: string;

	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

export class ValidationError extends BaseError {
	statusCode = 400;
	code: string;
	details: ValidationErrorDetail[];

	constructor(code: string, message: string, details: ValidationErrorDetail[]) {
		super(message);
		this.code = code;
		this.details = details;
	}

	static fromZod(zodError: ZodError): ValidationError {
		const details = zodError.issues.map((issue) => ({
			field: issue.path.join("."),
			message: issue.message,
		}));
		return new ValidationError("VALIDATION_FAILED", "Invalid input", details);
	}
}

export class BusinessError extends BaseError {
	statusCode: number;
	code: string;

	constructor(statusCode: number, code: string, message: string) {
		super(message);
		this.statusCode = statusCode;
		this.code = code;
	}
}

export class TechnicalError extends BaseError {
	statusCode = 500;
	code: string;

	constructor(code: string, message: string) {
		super(message);
		this.code = code;
	}
}
