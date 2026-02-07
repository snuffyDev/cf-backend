interface BaseAbstractError {
	get name(): string;
	get message(): string;
	get stack(): string;
}

interface AbstractErrorConstructor {
	new (message: string): BaseAbstractError;
	readonly prototype: BaseAbstractError;
}

export interface AbstractError extends Omit<
	AbstractErrorConstructor,
	"call" | "apply" | "bind" | "prototype"
> {
	new ({
		message,
		stack,
	}: {
		message: string;
		stack?: string;
	}): BaseAbstractError;
}

export interface APIError extends AbstractError {
	new ({
		message,
		status,
		type,
		details,
		cause,
	}: {
		message: string;
		status: number;
		cause: string[];
		type:
			| "HTTPError"
			| "TimeoutError"
			| "RateLimitError"
			| "UnknownError"
			| "BadRequestError";
		details?: string[];
	}): APIError;
}

export interface ScrapeError extends AbstractError {
	new ({
		message,
		type,
		details,
	}: {
		message: string;
		type: "NetworkError" | "ParseError" | "UnknownError";
		details?: string[];
	}): ScrapeError;
}

export class AggregateError extends Error {
	errors: AbstractError[];
	constructor(errors: AbstractError[], message?: string) {
		super(message || "Multiple errors occurred");
		this.errors = errors;
	}
}

/**
 * Error type for when an API request fails
 */
export class AbstractError extends Error implements AbstractError {
	#message: string;
	#stack: string;

	constructor({ message }: { message: string; stack?: string }) {
		super(message);
		this.#message = message;
		this.#stack = this.stack;
	}
	get message() {
		return this.#message;
	}
	get stack() {
		return this.#stack;
	}

	static fromError(error: Error): AbstractError {
		return new AbstractError({ message: error.message, stack: error.stack });
	}

	static fromMessage(message: string): AbstractError {
		return new AbstractError({ message });
	}
	static from(error: unknown): AbstractError {
		if (error instanceof Error) {
			return AbstractError.fromError(error);
		} else if (typeof error === "string") {
			return AbstractError.fromMessage(error);
		} else {
			// @ts-expect-error - This is a catch-all for any other types of errors that might be thrown, such as numbers, objects, etc. We convert them to a string and use that as the message.
			return new AbstractError({ message: error });
		}
	}
}

/**
 * Error type for when an API request fails
 */
export class APIError extends AbstractError {
	#status: number;
	#type:
		| "HTTPError"
		| "TimeoutError"
		| "RateLimitError"
		| "UnknownError"
		| "BadRequestError";
	#details?: string[];
	constructor({
		message,
		status,
		type,
		details,
	}: {
		message: string;
		status: number;
		type:
			| "HTTPError"
			| "TimeoutError"
			| "RateLimitError"
			| "UnknownError"
			| "BadRequestError";
		details?: string[];
	}) {
		super({ message, stack: undefined });
		this.#status = status;
		this.#type = type;
		this.#details = details;
	}

	get status() {
		return this.#status;
	}
	get type() {
		return this.#type;
	}
	get details() {
		return this.#details;
	}
}

/**
 * Error type for when scraping a site's HTML fails
 */
export class ScrapeError extends AbstractError implements ScrapeError {
	#type: "NetworkError" | "ParseError" | "UnknownError";
	#details?: string[];
	constructor({
		message,
		type,
		details,
	}: {
		message: string;
		type: "NetworkError" | "ParseError" | "UnknownError";
		details?: string[];
	}) {
		super({ message, stack: undefined });
		this.#type = type;
		this.#details = details;
	}

	get type() {
		return this.#type;
	}

	get details() {
		return this.#details;
	}
}

/**
 * Parse error is for when parsing a Request or Response fails
 * This could be due to invalid JSON, missing fields, etc.
 **/
export class ParseError extends AbstractError {
	constructor({
		message,
		type,
		details,
	}: {
		message: string;
		type: "ParseError";
		details?: string[];
	}) {
		super({ message });
	}
}
