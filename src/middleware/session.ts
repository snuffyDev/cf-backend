/**
 * Session management middleware
 */

import type { Handler } from "../core/router.js";
import type { Environment, AppState } from "../types/index.js";

export const sessionMiddleware: Handler<
	AppState,
	Environment,
	ExecutionContext
> = async ({ cookies, setCookie, env, state }) => {
	const userId = cookies["user_id"] || Math.random().toString(36).substring(2);
	console.log({ cookies, setCookie, env, state });
	// Set cookie if it doesn't exist
	if (!cookies["user_id"]) {
		setCookie("user_id", userId, {
			path: "/",
			httpOnly: true,
			maxAge: 60 * 60 * 24 * 365, // 1 year
		});
	}

	// Load previous URL from KV
	const url = await env.KV.get(`session:${userId}`);
	if (url) {
		state.previousUrl = url;
	}
};
