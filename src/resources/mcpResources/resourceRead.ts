import { server, logger } from 'harperdb';
import type { ReadResourceResult, ReadResourceRequest, TextResourceContents } from '@modelcontextprotocol/sdk/types.js';
import type { ErrorResponse, ParsedUri } from '../../types/index.js';

export const resourceRead = async (
	params: ReadResourceRequest['params']
): Promise<ReadResourceResult | ErrorResponse> => {
	try {
		if (!params?.uri) {
			return {
				error: {
					code: -32602,
					message: 'Must provide properly formatted JSONRPC body with uri in params.',
				},
			};
		}

		const { uri } = params;
		const { resourceName, conditions, path, limit, start: offset } = parseRequestUri(uri);

		const resourceMatch = server.resources.getMatch(path.substring(1));

		if (!resourceMatch) {
			return { contents: [] };
		}

		const data = await resourceMatch.Resource.get({
			conditions,
			limit: limit ?? 250,
			offset,
		});

		if (resourceMatch.Resource.databaseName) {
			const tableData: Record<string, any>[] = [];

			for await (const item of data) {
				tableData.push(item);
			}

			const response = {
				contents: formatTableData(resourceName, tableData, resourceMatch.Resource.primaryKey),
			};

			return response;
		}

		return {
			contents: [
				{
					uri,
					mimeType: 'application/json',
					text: JSON.stringify(data),
				},
			],
		};
	} catch (error) {
		logger.error('Error processing request:', (error as any).message);

		return {
			error: {
				code: -32603,
				message: `InternalServerError`,
			},
		};
	}
};

const parseRequestUri = (uri: string): ParsedUri => {
	const url = new URL(uri);

	const pathSegments = url.pathname.split('/').filter(Boolean);
	const resourceName = pathSegments[0];

	const conditions = [];
	let limit: number | undefined;
	let start: number | undefined;
	for (const [key, value] of url.searchParams.entries()) {
		if (key === 'limit') {
			limit = parseInt(value, 10);
			continue;
		}

		if (key === 'start') {
			start = parseInt(value, 10);
			continue;
		}

		conditions.push({
			attribute: decodeURIComponent(key),
			comparator: 'equals',
			value: decodeURIComponent(value),
		});
	}

	return {
		resourceName,
		conditions,
		path: url.pathname,
		limit,
		start,
	};
};

const formatTableData = (
	resource: string,
	data: Record<string, any>[],
	primaryKeyField: string
): TextResourceContents[] => {
	if (!Array.isArray(data) || data.length === 0) {
		return [];
	}

	return data.map((item) => ({
		uri: `${process.env.HOST}/${resource}/${encodeURIComponent(item[primaryKeyField])}`,
		mimeType: 'application/json',
		text: JSON.stringify(item),
	}));
};
