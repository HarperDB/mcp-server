import { server } from 'harperdb';
import type { ListResourcesResult, Resource as MCPResource } from '@modelcontextprotocol/sdk/types.js';
import type { ResourceInfo, TableAttr } from '../../types/index.js';

export const resourceList = (): ListResourcesResult => {
	const resources = [];

	for (const harperResource of server.resources.values() as Iterable<ResourceInfo>) {
		if (harperResource.Resource.name === 'MCPHandler') {
			continue;
		} else if (harperResource.Resource.tableName) {
			resources.push(formatTableForContext(harperResource));
		} else {
			resources.push(formatResourceForContext(harperResource));
		}
	}

	return { resources };
};

const formatTableForContext = ({ Resource: resource }: ResourceInfo): MCPResource => {
	const attrs = attributesToString(resource.attributes!);
	return {
		uri: `${process.env.HOST}/${resource.name}`,
		name: resource.name,
		description: `${resource.tableName} table with attributes: ${attrs}.`,
		mimeType: 'application/json',
	};
};

const formatResourceForContext = ({ Resource: resource, path }: ResourceInfo): MCPResource => {
	let resourcePath = path;
	if (resourcePath !== resource.name) {
		resourcePath = `${path}/${resource.name}`;
	}

	return {
		uri: `${process.env.HOST}/${resourcePath}`,
		name: resource.name,
		description: 'Custom REST Resource.',
		mimeType: 'application/json',
	};
};

const attributesToString = (attributes: TableAttr[]): string =>
	attributes
		.map((attr) => {
			let type = attr.type;

			if (attr.relationship) {
				const relationship = Object.entries(attr.relationship)[0];
				type = `Relationship ${relationship[0]} ${relationship[1]} - ${attr.type}`;
			}

			const typeString = `(${attr.isPrimaryKey ? 'PK - ' : ''}${type})`;
			return `${attr.name} ${typeString}`;
		})
		.join(', ');
