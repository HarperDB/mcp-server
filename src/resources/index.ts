import { Resource } from 'harperdb';
import type { JSONRPCRequest, JSONRPCResponse, JSONRPCError } from '@modelcontextprotocol/sdk/types.js';
import { resourceList } from './mcpResources/resourceList.js';
import { resourceGet } from './mcpResources/resourceGet.js';

class MCPHandler extends Resource {
	async post(body: JSONRPCRequest): Promise<JSONRPCResponse | JSONRPCError> {
		const { jsonrpc, id, method, params } = body;

		let result;
		switch (method) {
			case 'resources/list':
				result = resourceList();
				break;
			case 'resources/get':
				result = await resourceGet(params);
				break;
			default:
				return {
					jsonrpc,
					id,
					error: {
						code: -32601,
						message: `Method ${method} not allowed.`,
					},
				};
		}

		return {
			jsonrpc,
			id,
			result: result.error ? undefined : result,
			error: result.error ?? undefined,
		};
	}
}

export const mcp = MCPHandler;
