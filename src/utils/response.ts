/**
 * Response manipulation utilities
 */

/**
 * Strip headers that prevent embedding in iframes
 */
export function stripFrameBlockingHeaders(response: Response): Response {
	const res = new Response(response.body, response);
	const blockList = [
		"x-frame-options",
		"content-security-policy",
		"frame-ancestors",
		"cross-origin-opener-policy",
		"cross-origin-embedder-policy",
		"cross-origin-resource-policy",
		"permissions-policy",
	];
	blockList.forEach((header) => res.headers.delete(header));
	return res;
}

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(
	response: Response,
	origin: string = "*",
): Response {
	response.headers.set("Access-Control-Allow-Origin", origin);
	response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	response.headers.set(
		"Access-Control-Allow-Headers",
		"Content-Type, Authorization",
	);
	response.headers.append("Vary", "Origin");
	return response;
}
