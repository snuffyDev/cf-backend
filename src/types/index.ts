/**
 * Type definitions for the application
 */

export type Environment = {
	KV: KVNamespace;
};

export type AppState = {
	previousUrl?: string;
};

export type ApiRequestData = {
	url: string;
	method?: string;
	headers?: string; // JSON string
	body?: string; // JSON string
	schema?: string; // JSON string
};

export type ApiResponse<T = unknown> = {
	success: boolean;
	data?: T;
	error?: string;
	details?: string;
	warning?: string;
	errors?: string[];
	status?: number;
	statusText?: string;
};

export type CrawlRequestData = {
	url: string;
	htmlMode?: "full" | "extract";
	selectors?: string;
};

export type Json =
	| string
	| number
	| boolean
	| null
	| Json[]
	| { [key: string]: Json };
