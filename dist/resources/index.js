import { Resource } from 'harperdb';
import { resourceList } from './mcpResources/resourceList.js';
import { resourceRead } from './mcpResources/resourceRead.js';
import { MCPMethods } from '../constants/index.js';
class MCPHandler extends Resource {
    async post(body) {
        const { jsonrpc, id, method, params } = body;
        let result;
        switch (method) {
            case MCPMethods.RESOURCES_LIST:
                result = resourceList();
                break;
            case MCPMethods.RESOURCES_GET:
                result = await resourceRead(params);
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
