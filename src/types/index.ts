export interface ErrorResponse {
	error: {
		code: number;
		message: string;
	};
}

export interface ResourceInfo {
	Resource: {
		name: string;
		tableName?: string;
		attributes?: TableAttr[];
		get: Function;
		search: Function;
	};
	path: string;
}

export interface TableAttr {
	type: string;
	relationship: string;
	isPrimaryKey: string;
	name: string;
}

export interface QueryCondition {
	attribute: string;
	comparator: string;
	value: string;
}

export interface ParsedUri {
	resourceName: string;
	conditions: QueryCondition[];
	path: string;
	limit?: number;
	start?: number;
}
