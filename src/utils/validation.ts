/**
 * Validation utilities for API responses and schemas
 */

import { ParseError } from "../api-scrape/errors";
import { Result } from "../api-scrape/result";

export function validateSchema(
	data: unknown,
	schema: Record<string, string>,
): string[] {
	const errors: string[] = [];

	if (typeof data !== "object" || data === null) {
		errors.push("Response is not an object");
		return errors;
	}

	const dataObj = data as Record<string, unknown>;

	for (const [key, expectedType] of Object.entries(schema)) {
		if (!(key in dataObj)) {
			errors.push(`Missing field: ${key}`);
			continue;
		}

		const value = dataObj[key];
		const actualType = Array.isArray(value) ? "array" : typeof value;

		// Handle nested objects
		if (typeof expectedType === "object" && expectedType !== null) {
			const nestedErrors = validateSchema(
				value,
				expectedType as Record<string, string>,
			);
			errors.push(...nestedErrors.map((e) => `${key}.${e}`));
		} else if (expectedType !== actualType) {
			errors.push(
				`Field '${key}' expected ${expectedType} but got ${actualType}`,
			);
		}
	}

	return errors;
}

export function isValidJson(str: string): boolean {
	try {
		JSON.parse(str);
		return true;
	} catch {
		return false;
	}
}

export function parseJsonSafely<T = unknown>(
	str: string,
): Result<T, ParseError> {
	try {
		const json = JSON.parse(str);
		return Result.Ok(json as T);
	} catch (error) {
		return Result.Err(ParseError.from(error));
	}
}
