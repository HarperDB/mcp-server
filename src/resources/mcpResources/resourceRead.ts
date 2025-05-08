import { server, logger } from 'harperdb';
import type { ReadResourceResult, ReadResourceRequest, TextResourceContents } from '@modelcontextprotocol/sdk/types.js';
import type { ErrorResponse, ParsedUri, QueryCondition, ResourceInfo } from '../../types/index.js';

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
		const { resourceName, conditions, path, query, limit, start } = parseRequestUri(uri);

		const tableResource = server.resources.get(resourceName)?.Resource;
		if (tableResource?.databaseName) {
			const data = await queryHarperDB(tableResource, conditions, limit, start);

			const response = {
				contents: formatTableData(resourceName, data, tableResource.primaryKey),
			};

			return response;
		}

		const customResource = server.resources.getMatch(path.substring(1));
		if (customResource) {
			const data = await getResourceData(customResource.Resource, query);

			return {
				contents: [
					{
						uri,
						mimeType: 'application/json',
						text: JSON.stringify(data),
					},
				],
			};
		}

		return { contents: [] };
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
		query: url.searchParams,
		path: url.pathname,
		limit,
		start,
	};
};

const queryHarperDB = async (
	tableResource: ResourceInfo['Resource'],
	conditions: QueryCondition[],
	limit = 250,
	start?: number
): Promise<Record<string, any>[]> => {
	const results = await tableResource.search({
		conditions,
		limit,
		offset: start,
	});

	const output: Record<string, any>[] = [];

	for await (const item of results) {
		output.push(item);
	}

	return output;
};

const getResourceData = async (
	resource: ResourceInfo['Resource'],
	query: URLSearchParams
): Promise<Record<string, any>[]> => {
	try {
		return await resource.search(query);
	} catch (error) {
		if ((error as any).statusCode === 405) {
			return await resource.get(query);
		}
		throw error;
	}
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
