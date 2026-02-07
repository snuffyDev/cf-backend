// Helpers for setting up valid HTTP headers for API requests

// Do a HEAD request to get default headers
export async function fetchDefaultHeaders(url: string): Promise<Headers> {
	const response = await fetch(url, { method: "HEAD" });
	return response.headers;
}

// Merge default headers with custom headers
export function mergeHeaders(
	defaultHeaders: Headers,
	customHeaders?: Record<string, string>,
): Headers {
	const headers = new Headers(defaultHeaders);
	if (customHeaders) {
		for (const [key, value] of Object.entries(customHeaders)) {
			headers.set(key, value);
		}
	}
	return headers;
}
