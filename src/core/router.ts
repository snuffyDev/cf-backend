/**
 * Lightweight router for Cloudflare Workers with middleware, context, cookies, and
 * pattern-based route matching (fixed, params, greedy params, and wildcards).
 */

export type RequestMethod =
	| "GET"
	| "POST"
	| "PUT"
	| "DELETE"
	| "PATCH"
	| "OPTIONS"
	| "HEAD"
	| "ALL";

export type RequestPath = string;

export type CookieSameSite = "Strict" | "Lax" | "None";

export type CookieOptions = {
	path?: string;
	domain?: string;
	expires?: Date;
	maxAge?: number;
	secure?: boolean;
	httpOnly?: boolean;
	sameSite?: CookieSameSite;
};

export type CfRuntime<CFEnv, CFContext> = {
	cfEnv: CFEnv;
	cfContext: CFContext;
};

export type RequestContext<
	State extends Record<string, unknown>,
	CFEnv = unknown,
	CFContext = unknown,
> = {
	request: Request;
	url: URL;
	params: Record<string, string>;
	cookies: Record<string, string>;
	state: State;
	env: CFEnv;
	cf: CfRuntime<CFEnv, CFContext>;
	setCookie: (name: string, value: string, options?: CookieOptions) => void;
};

export type Handler<
	State extends Record<string, unknown> = Record<string, unknown>,
	CFEnv = unknown,
	CFContext = unknown,
> = (
	ctx: RequestContext<State, CFEnv, CFContext>,
) => Response | Promise<Response> | void | Promise<void>;

type CompiledRoute = {
	regex: RegExp;
	paramNames: string[];
};

type Route<State extends Record<string, unknown>, CFEnv, CFContext> = {
	method: RequestMethod;
	path: RequestPath;
	matcher: CompiledRoute;
	handlers: Handler<State, CFEnv, CFContext>[];
};

type RouterOptions<State extends Record<string, unknown>, CFEnv, CFContext> = {
	onNotFound?: Handler<State, CFEnv, CFContext>;
	onError?: (
		error: unknown,
		ctx: RequestContext<State, CFEnv, CFContext>,
	) => Response | Promise<Response>;
};

const defaultState = (): Record<string, unknown> => ({});

const escapeRegex = (value: string): string =>
	value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const compilePath = (pattern: string): CompiledRoute => {
	// Support bare wildcard
	if (pattern === "*") {
		return { regex: /^.*$/, paramNames: ["wildcard"] };
	}

	const segments = pattern.split("/");
	const paramNames: string[] = [];
	let regex = "^";

	for (let index = 0; index < segments.length; index++) {
		const segment = segments[index];

		if (index === 0 && segment === "") {
			// Preserve the leading slash
			continue;
		}

		if (segment === "*") {
			paramNames.push("wildcard");
			regex += "(?:/(.*))?";
			continue;
		}

		const greedyMatch = /^:([A-Za-z0-9_]+)\+$/;
		const paramMatch = /^:([A-Za-z0-9_]+)$/;

		if (greedyMatch.test(segment)) {
			const [, name] = greedyMatch.exec(segment)!;
			paramNames.push(name);
			regex += "/(.+)";
			continue;
		}

		if (paramMatch.test(segment)) {
			const [, name] = paramMatch.exec(segment)!;
			paramNames.push(name);
			regex += "/([^/]+)";
			continue;
		}

		regex += "/" + escapeRegex(segment);
	}

	// Allow trailing slash but ensure end of string
	regex += "/?$";

	return { regex: new RegExp(regex), paramNames };
};

const parseCookies = (header: string | null): Record<string, string> => {
	if (!header) return {};
	return header
		.split(";")
		.map((part) => part.trim())
		.filter(Boolean)
		.reduce<Record<string, string>>((all, part) => {
			const [name, ...rest] = part.split("=");
			const value = rest.join("=");
			if (name) all[decodeURIComponent(name)] = decodeURIComponent(value);
			return all;
		}, {});
};

const serializeCookie = (
	name: string,
	value: string,
	options?: CookieOptions,
): string => {
	const pieces: string[] = [
		`${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
	];

	if (options?.maxAge !== undefined) pieces.push(`Max-Age=${options.maxAge}`);
	if (options?.expires) pieces.push(`Expires=${options.expires.toUTCString()}`);
	if (options?.domain) pieces.push(`Domain=${options.domain}`);
	if (options?.path) pieces.push(`Path=${options.path}`);
	if (options?.secure) pieces.push("Secure");
	if (options?.httpOnly) pieces.push("HttpOnly");
	if (options?.sameSite) pieces.push(`SameSite=${options.sameSite}`);

	return pieces.join("; ");
};

export class Router<
	State extends Record<string, unknown> = Record<string, unknown>,
	CFEnv = unknown,
	CFContext = unknown,
> {
	private routes: Route<State, CFEnv, CFContext>[] = [];
	private onNotFound?: Handler<State, CFEnv, CFContext>;
	private onError?: (
		error: unknown,
		ctx: RequestContext<State, CFEnv, CFContext>,
	) => Response | Promise<Response>;

	constructor(options?: RouterOptions<State, CFEnv, CFContext>) {
		this.onNotFound = options?.onNotFound;
		this.onError = options?.onError;
	}

	get(
		path: RequestPath,
		...handlers: Handler<State, CFEnv, CFContext>[]
	): this {
		return this.add("GET", path, ...handlers);
	}

	post(
		path: RequestPath,
		...handlers: Handler<State, CFEnv, CFContext>[]
	): this {
		return this.add("POST", path, ...handlers);
	}

	put(
		path: RequestPath,
		...handlers: Handler<State, CFEnv, CFContext>[]
	): this {
		return this.add("PUT", path, ...handlers);
	}

	patch(
		path: RequestPath,
		...handlers: Handler<State, CFEnv, CFContext>[]
	): this {
		return this.add("PATCH", path, ...handlers);
	}

	delete(
		path: RequestPath,
		...handlers: Handler<State, CFEnv, CFContext>[]
	): this {
		return this.add("DELETE", path, ...handlers);
	}

	head(
		path: RequestPath,
		...handlers: Handler<State, CFEnv, CFContext>[]
	): this {
		return this.add("HEAD", path, ...handlers);
	}

	options(
		path: RequestPath,
		...handlers: Handler<State, CFEnv, CFContext>[]
	): this {
		return this.add("OPTIONS", path, ...handlers);
	}

	all(
		path: RequestPath,
		...handlers: Handler<State, CFEnv, CFContext>[]
	): this {
		return this.add("ALL", path, ...handlers);
	}

	private add(
		method: RequestMethod,
		path: RequestPath,
		...handlers: Handler<State, CFEnv, CFContext>[]
	): this {
		const matcher = compilePath(path);
		this.routes.push({ method, path, matcher, handlers });
		return this;
	}

	async fetch(
		request: Request,
		cfEnv: CFEnv,
		cfContext: CFContext,
	): Promise<Response> {
		return this.handle(request, { cfEnv, cfContext }, {});
	}

	async handle(
		request: Request,
		cf?: CfRuntime<CFEnv, CFContext>,
		initialState?: Partial<State>,
	): Promise<Response> {
		const url = new URL(request.url);
		const pathname = url.pathname;
		const method = (request.method || "GET").toUpperCase() as RequestMethod;

		const route = this.routes.find(({ method: m, matcher }) => {
			if (m !== "ALL" && m !== method) return false;
			return matcher.regex.test(pathname);
		});

		const cfRuntime: CfRuntime<CFEnv, CFContext> =
			cf ??
			({
				cfEnv: undefined as unknown as CFEnv,
				cfContext: undefined as unknown as CFContext,
			} satisfies CfRuntime<CFEnv, CFContext>);

		if (!route) {
			const ctx: RequestContext<State, CFEnv, CFContext> = {
				request,
				url,
				params: {},
				cookies: parseCookies(request.headers.get("Cookie")),
				state: Object.assign(defaultState(), initialState) as State,
				env: cfRuntime.cfEnv,
				cf: cfRuntime,
				setCookie: () => undefined,
			};

			if (this.onNotFound) {
				const res = (await this.onNotFound(ctx)) as Response | void;
				return res instanceof Response
					? res
					: new Response("Not Found", { status: 404 });
			}
			return new Response("Not Found", { status: 404 });
		}

		const match = route.matcher.regex.exec(pathname);
		const params: Record<string, string> = {};
		if (match) {
			route.matcher.paramNames.forEach((name, idx) => {
				const value = match[idx + 1] ?? "";
				params[name] = decodeURIComponent(value);
			});
		}

		const pendingCookies: string[] = [];
		const ctx: RequestContext<State, CFEnv, CFContext> = {
			request,
			url,
			params,
			cookies: parseCookies(request.headers.get("Cookie")),
			state: Object.assign(defaultState(), initialState) as State,
			env: cfRuntime.cfEnv,
			cf: cfRuntime,
			setCookie: (name: string, value: string, options?: CookieOptions) => {
				pendingCookies.push(serializeCookie(name, value, options));
				ctx.cookies[name] = value;
			},
		};

		try {
			let response: Response | void = undefined;
			for (const handler of route.handlers) {
				response = (await handler(ctx)) as Response | void;
				if (response instanceof Response) break;
			}

			if (!(response instanceof Response)) {
				// No handler produced a response
				response = new Response("Not Found", { status: 404 });
			}

			return this.mergeCookies(response, pendingCookies);
		} catch (error) {
			if (this.onError) {
				return this.onError(error, ctx);
			}
			return new Response(`${error}\n\n\n\n${(error as Error).stack}`, {
				status: 500,
			});
		}
	}

	private mergeCookies(response: Response, pendingCookies: string[]): Response {
		if (!pendingCookies.length) return response;

		// Clone the response so we can safely append headers
		const res = new Response(response.body, response);

		const existingSetCookies: string[] = [];
		response.headers.forEach((value, key) => {
			if (key.toLowerCase() === "set-cookie") existingSetCookies.push(value);
		});

		res.headers.delete("Set-Cookie");
		existingSetCookies.forEach((cookie) =>
			res.headers.append("Set-Cookie", cookie),
		);
		pendingCookies.forEach((cookie) =>
			res.headers.append("Set-Cookie", cookie),
		);

		return res;
	}
}

export function json<T>(data: T, init?: ResponseInit): Response {
	return new Response(JSON.stringify(data), {
		...init,
		headers: {
			"Content-Type": "application/json",
			...(init?.headers || {}),
		},
	});
}

export function html(content: string, init?: ResponseInit): Response {
	return new Response(content, {
		...init,
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			...(init?.headers || {}),
		},
	});
}

export function text(content: string, init?: ResponseInit): Response {
	return new Response(content, {
		...init,
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			...(init?.headers || {}),
		},
	});
}

export function redirect(url: string, status: number = 302): Response {
	return new Response(null, {
		status,
		headers: {
			Location: url,
		},
	});
}

export function error(message: string, status: number = 500): Response {
	return new Response(message, { status });
}

export default Router;
