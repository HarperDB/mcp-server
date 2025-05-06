import { server, logger, databases } from 'harperdb';
import type { ReadResourceResult, ReadResourceRequest, TextResourceContents } from '@modelcontextprotocol/sdk/types.js';
import type { ErrorResponse, ParsedUri, QueryCondition, ResourceInfo } from '../../types/index.js';

export const resourceGet = async (params: ReadResourceRequest): Promise<ReadResourceResult | ErrorResponse> => {
	try {
		if (!params?.uri) {
			return {
				error: {
					code: -32602,
					message: 'Must include request body with uri field in request params.',
				},
			};
		}

		const { uri } = params;
		const { resourceName, conditions, path, query, limit, start } = parseRequestUri(uri);

		const tableResource = server.resources.get(resourceName)?.Resource;
		if (tableResource?.databaseName) {
			const data = await queryHarperDB(tableResource.databaseName, resourceName, conditions, limit, start);

			const response = {
				contents: formatTableData(resourceName, data, tableResource.primaryKey),
			};

			return response;
		}

		const customResource = server.resources.getMatch(path.substring(1));
		if (customResource) {
			const data = await getResourceData(customResource, query);

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
		logger.error('Error processing request:', error);

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
	databaseName: string,
	resourceName: string,
	conditions: QueryCondition[],
	limit = 250,
	start?: number
): Promise<Record<string, any>[]> => {
	const results = await databases[databaseName][resourceName].search({
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

const getResourceData = async ({ Resource: resource }: ResourceInfo, query: URLSearchParams) => {
	return await resource.get(query);
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
