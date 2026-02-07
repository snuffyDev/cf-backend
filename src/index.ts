import HtmlPage from "./pages/index.html.js";
import { mergeHeaders } from "./api-scrape/headers.js";
import { Router, html, json } from "./core/router.js";
import { sessionMiddleware } from "./middleware/session.js";
import { decodeFormData } from "./utils/formdata.js";
import { validateSchema, parseJsonSafely } from "./utils/validation.js";
import { stripFrameBlockingHeaders, addCorsHeaders } from "./utils/response.js";
import type { AppState, ApiResponse, Json } from "./types/index.js";
import { typedFetch } from "./api-scrape/request.js";

const router = new Router<AppState, Env, ExecutionContext>();

router.get("/", sessionMiddleware, async () => {
	return html(HtmlPage);
});

router.post(
	"/api",
	sessionMiddleware,
	async ({ request, env, cookies, state }) => {
		try {
			const formData = await request.formData();
			const data = decodeFormData(formData);

			const { url, method = "GET", headers: headersJson, body, schema } = data;

			if (!url) {
				return json<ApiResponse>(
					{
						success: false,
						error: "URL is required",
					},
					{ status: 400 },
				);
			}

			// Store URL in session
			const userId = cookies["user_id"];
			if (userId) {
				await env.KV.put(`session:${userId}`, url);
				state.previousUrl = url;
			}

			// const defaultHeaders = await fetchDefaultHeaders(url);

			// Parse headers and body
			const customHeaders = parseJsonSafely<Record<string, string>>(
				headersJson,
			).unwrapOr({});

			const requestBody =
				method === "POST" || method === "PUT" || method === "PATCH"
					? body
					: undefined;

			// Build fetch options
			const fetchOptions: RequestInit = {
				method: method.toUpperCase(),
				headers: mergeHeaders(new Headers(), customHeaders),
			};

			if (requestBody) {
				fetchOptions.body = requestBody;
			}

			// Fetch the API
			const response = await typedFetch(url, fetchOptions);
			const responseType = response.headers.get("Content-Type") || "";
			let responseData: Json | FormData | string | undefined;

			if (responseType.includes("application/json")) {
				responseData = (await response.json()).unwrap();
			} else if (responseType.includes("application/x-www-form-urlencoded")) {
				const text = await response.text();
				const data = new URLSearchParams(text);
				responseData = Object.fromEntries(data.entries());
			}
			// Validate schema
			const result: ApiResponse = {
				success: true,
				data: responseData,
				status: response.status,
				statusText: response.statusText,
			};

			if (schema) {
				const expectedSchema = parseJsonSafely<Record<string, string>>(
					schema,
				).unwrapOr({});
				const validationErrors = validateSchema(responseData, expectedSchema);
				if (validationErrors.length > 0) {
					result.warning = "Schema validation failed";
					result.errors = validationErrors;
				}
			}

			return json(result);
		} catch (error) {
			return json<ApiResponse>(
				{
					success: false,
					error: "Failed to fetch API",
					details: (error as Error).message,
				},
				{ status: 500 },
			);
		}
	},
);

router.post(
	"/crawl",
	sessionMiddleware,
	async ({ request, state, url, env }) => {
		// TODO
	},
);

router.all("/:params+", sessionMiddleware, async ({ state, request }) => {
	const previousUrl = state.previousUrl;
	if (!previousUrl) return new Response("Not Found", { status: 404 });

	const reqUrl = new URL(request.url);
	const realUrl = new URL(previousUrl);
	const targetUrl = new URL(
		reqUrl.pathname + reqUrl.search,
		realUrl,
	).toString();

	const fetchOptions: RequestInit = {
		method: request.method,
		headers: request.headers,
	};

	const proxiedRequest = new Request(targetUrl, fetchOptions);
	proxiedRequest.headers.set("Origin", new URL(targetUrl).origin);

	let response = await fetch(proxiedRequest);
	response = stripFrameBlockingHeaders(response);
	response = addCorsHeaders(response);

	return response;
});

export default {
	fetch: (req, env, ctx) => router.fetch(req, env, ctx),
} as ExportedHandler<Cloudflare.Env>;
