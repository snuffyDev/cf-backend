
const keyOk = Symbol("Ok");
const keyErr = Symbol("Err");

type InternalResult<T, E> =
	| { [keyOk]: T; [keyErr]?: never }
	| { [keyErr]: E; [keyOk]?: never };

function Ok<T, E extends Error = never>(value: T): InternalResult<T, E> {
	return { [keyOk]: value };
}

function Err<T = never, E extends Error = Error>(
	error: E,
): InternalResult<T, E> {
	return { [keyErr]: error };
}

export class Result<T, E extends Error> {
	private constructor(private readonly result: InternalResult<T, E>) {}

	static Ok<T, E extends never>(value: T): Result<T, E> {
		return new Result(Ok(value));
	}

	static Err<T = never, E extends Error = Error>(error: E): Result<T, E> {
		return new Result(Err(error));
	}

	static fromPromise<T, E extends Error = Error>(
		promise: Promise<T>,
	): Promise<Result<T, E>> {
		return promise
			.then((value) => Result.Ok<T, never>(value))
			.catch((error) => Result.Err<never, E>(error));
	}

	unwrap(): T {
		if (keyOk in this.result) {
			return this.result[keyOk] as T;
		} else {
			throw this.result[keyErr] as E;
		}
	}

	unwrapOr(defaultValue: T): T {
		if (keyOk in this.result) {
			return this.result[keyOk] as T;
		} else {
			return defaultValue;
		}
	}
}
