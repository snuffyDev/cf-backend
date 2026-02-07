/**
 *  TODO: Clean this up eventually?
 *  I need to clean this up, but this is mostly me experimenting
 *  with a flexible fetch wrapper
 **/
import { ParseError } from "./errors";
import { Result } from "./result";

type TypedFetch<T> = {
	(input: RequestInfo, init?: RequestInit): Promise<WrappedResponse<T>>;
	get: (input: RequestInfo, init?: RequestInit) => Promise<WrappedResponse<T>>;
	post: (input: RequestInfo, init?: RequestInit) => Promise<WrappedResponse<T>>;
	put: (input: RequestInfo, init?: RequestInit) => Promise<WrappedResponse<T>>;
	delete: (
		input: RequestInfo,
		init?: RequestInit,
	) => Promise<WrappedResponse<T>>;
	patch: (
		input: RequestInfo,
		init?: RequestInit,
	) => Promise<WrappedResponse<T>>;
};

type Fetcher<T> = TypedFetch<T>;

class WrappedResponse<T>
	extends Response
	implements Omit<Response, "json" | "text">
{
	constructor(body?: BodyInit | null, init?: ResponseInit) {
		super(body, init);
	}

	static fromResponse<I>(response: Response): WrappedResponse<I> {
		const wrapped = new WrappedResponse<I>(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: response.headers,
		});
		return wrapped;
	}

	json<T>(): Promise<Result<T, ParseError>>;
	json<T>(): Promise<T>;
	json<T>(): any {
		return Result.fromPromise(super.json().then((data) => data as T));
	}
	text(): Result<string, ParseError>;
	text(): Promise<string>;
	text(): any {
		return Result.fromPromise(super.text());
	}

	stream(): ReadableStream<Uint8Array> {
		return super.body as ReadableStream<Uint8Array>;
	}
}

function wrapResponse<T>(response: Response): WrappedResponse<T> {
	return WrappedResponse.fromResponse(response);
}

const _typedFetch = async <T>(
	input: RequestInfo,
	init?: RequestInit,
): Promise<WrappedResponse<T>> => {
	const response = await fetch(input, init);
	return wrapResponse<T>(response);
};

export const typedFetch = Object.assign(_typedFetch, {
	get: (input: RequestInfo, init?: RequestInit) =>
		_typedFetch(input, { ...init, method: "GET" }),
	post: (input: RequestInfo, init?: RequestInit) =>
		_typedFetch(input, { ...init, method: "POST" }),
	put: (input: RequestInfo, init?: RequestInit) =>
		_typedFetch(input, { ...init, method: "PUT" }),
	delete: (input: RequestInfo, init?: RequestInit) =>
		_typedFetch(input, { ...init, method: "DELETE" }),
	patch: (input: RequestInfo, init?: RequestInit) =>
		_typedFetch(input, { ...init, method: "PATCH" }),
});
