/**
 * @module Form data parsing utilities
 */

/**
 *
 * @param data Form Data
 * @returns Decoded form data
 */
export function decodeFormData(data: FormData): Record<string, string> {
	const decoded: Record<string, string> = {};
	for (const [key, value] of data.entries()) {
		decoded[key] = value.toString();
	}
	return decoded;
}

export function getFormValue(
	data: Record<string, string>,
	key: string,
	defaultValue: string = "",
): string {
	return data[key] || defaultValue;
}
