import type { NextFunction, Request, Response } from "express";
import { BaseError, ValidationError } from "../errors/index";

export function errorHandler(
	err: Error,
	_req: Request,
	res: Response,
	_next: NextFunction,
): void {
	console.error(`[${new Date().toISOString()}] Error:`, err);

	if (err instanceof BaseError) {
		const response: {
			error: { code: string; message: string; details?: unknown[] };
		} = {
			error: {
				code: err.code,
				message: err.message,
			},
		};

		if (err instanceof ValidationError) {
			response["error"]["details"] = err.details;
		}

		res.status(err.statusCode).json(response);
		return;
	}

	res.status(500).json({
		error: {
			code: "INTERNAL_SERVER_ERROR",
			message: "An unexpected error occurred",
		},
	});
}

export function notFoundHandler(_req: Request, res: Response): void {
	res.status(404).json({
		error: {
			code: "NOT_FOUND",
			message: "Route not found",
		},
	});
}
