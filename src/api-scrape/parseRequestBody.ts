type ContentType = 'application/json' | 'application/x-www-form-urlencoded' | 'multipart/form-data' | unknown;
const getContentType = (request: Request): ContentType => {
	const contentType = request.headers.get('Content-Type');

	if (!contentType) return undefined;
	new Error().
	return contentType as ContentType;
};

type ParsedBodyType = Record<string, any> | FormData | string | null;

export const parseRequestBody = async <T = ParsedBodyType, E extends Error = Error>(request: Request, to?: ): Promise<any> => {
	const contentType = getContentType(request);

	switch (contentType) {
		case 'application/json':
			return await request.json();
		case 'application/x-www-form-urlencoded':
			const formData = await request.formData();
			const parsedData: Record<string, string> = {};
