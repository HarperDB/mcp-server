# Harper MCP Server

A server implementation of the [Model Context Protocol (MCP)](https://github.com/modelcontextprotocol), designed to expose data in HarperDB as structured "Resources" accessible via standardized JSON-RPC calls.

> **Note:** Requires HarperDB version 4.5.10 or later.

---

## Features

- MCP-compatible API server for Harper
- Predefined static capabilities endpoint (`/capabilities.json`)
- Provides read-only access to data from Harper tables and custom resources
- Supports filtering data in Harper tables using query parameters
- Handles pagination (limit, start) for table data retrieval
- Provides standardized error responses

---

## Getting Started

### Prerequisites

- [Harper](https://docs.harperdb.io/docs/deployments/install-harperdb/) stack installed globally.
- Ensure HarperDB v4.5.10 or later is configured and running with necessary databases and schemas.
- Environment variable `HOST` should be set to the base URL of your server. This is used to construct resource URIs.

### Deploying to Harper

The Harper `mcp-server` is published to NPM and can be installed using [Harper's Operation API](https://docs.harperdb.io/docs/developers/operations-api/components).

i.e.

`POST https://harper-server.com:9925`

```json
{
	"operation": "deploy_component",
	"package": "@harperdb/mcp-server@1.0.0"
}
```

## Security & Authentication

Harper employs role-based, attribute-level security to ensure users access only authorized data. Requests to the server are authenticated using HarperDB's built-in authentication mechanisms, which include Basic Auth, JWT, and mTLS.
See [Harper Security Docs](https://docs.harperdb.io/docs/developers/security/) for more details.

## API

### MCP Methods

The server implements the following MCP methods:

- **`resources/list`**: Lists all available resources (HarperDB tables and custom resources).
- **`resources/read`**: Retrieves data for a specific resource based on its URI.

A single endpoint, `/mcp` handles all requests. The server uses JSON-RPC 2.0 for communication.

- **Request Format**: All requests are sent as JSON-RPC 2.0 formatted JSON objects.
- **Response Format**: The server responds with JSON-RPC 2.0 formatted JSON objects.
- **Error Handling**: The server returns standardized error responses.

### Resource URIs

- **Tables:** Resources representing HarperDB tables are accessed via URIs like:

  ```
  {HOST}/{table_name}
  ```

  - Example: `http://localhost:9925/my_table`

- **Table Rows:** Individual rows within a table can be accessed using the primary key:

  ```
  {HOST}/{table_name}/{primary_key_value}
  ```

  - Example: `http://localhost:9925/my_table/123` (where 123 is the primary key value)

- **Custom Resources:** Custom resources are accessed via URIs defined by their registered path:

  ```
  {HOST}/{path}/{resource_name}
  ```

  - Example: `http://localhost:9925/custom/my_resource`

## Usage

### 1. Listing Resources

POST `/mcp`

Sample Request:

```json
{
	"jsonrpc": "2.0",
	"id": 1,
	"method": "resources/list"
}
```

Sample Response:

```json
{
	"jsonrpc": "2.0",
	"id": 1,
	"result": {
		"resources": [
			{
				"uri": "http://localhost:9926/CustomerOrders",
				"name": "CustomerOrders",
				"description": "CustomerOrders table with attributes: id (PK - Int), customerId (string), customer (Relationship from customerId - Customers), itemSku (String), item (Relationship from itemSku - Items), subTotal (Float), orderTotal (Float), date (DateTime). Results can be filtered with optional query parameters.",
				"mimeType": "application/json"
			},
			{
				"uri": "http://localhost:9926/Customers",
				"name": "Customers",
				"description": "Customers table with attributes: id (PK - Int), email (String), phoneNumber (String), customerName (String), country (String), orders (Relationship to customerId - array). Results can be filtered with optional query parameters.",
				"mimeType": "application/json"
			},
			{
				"uri": "http://localhost:9926/Items",
				"name": "Items",
				"description": "Items table with attributes: sku (PK - String), itemName (String), itemDescription (String), unitPrice (Int). Results can be filtered with optional query parameters.",
				"mimeType": "application/json"
			},
			{
				"uri": "http://localhost:9926/TestCustomer",
				"name": "TestCustomer",
				"description": "Customers table with attributes: id (PK - Int), email (String), phoneNumber (String), customerName (String), country (String), orders (Relationship to customerId - array). Results can be filtered with optional query parameters.",
				"mimeType": "application/json"
			},
			{
				"uri": "http://localhost:9926/api/test",
				"name": "test",
				"description": "REST Resource.",
				"mimeType": "application/json"
			}
		]
	}
}
```

### 2. Get resources data

POST `/mcp`

Sample Request:

```json
{
	"jsonrpc": "2.0",
	"id": 2,
	"method": "resources/read",
	"params": {
		"uri": "http://localhost:9926/Customers"
	}
}
```

Sample Response:

```json
{
	"jsonrpc": "2.0",
	"id": 2,
	"result": {
		"contents": [
			{
				"uri": "http://localhost:9926/Customers/11",
				"mimeType": "application/json",
				"text": "{\"id\":11,\"email\":\"kelly.williams@example.com\",\"phoneNumber\":\"214-555-1234\",\"customerName\":\"Kelly Williams\",\"country\":\"USA\"}"
			},
			{
				"uri": "http://localhost:9926/Customers/12",
				"mimeType": "application/json",
				"text": "{\"id\":12,\"email\":\"liam.martinez@example.com\",\"phoneNumber\":\"972-555-5678\",\"customerName\":\"Liam Martinez\",\"country\":\"Canada\"}"
			},
			{
				"uri": "http://localhost:9926/Customers/13",
				"mimeType": "application/json",
				"text": "{\"id\":13,\"email\":\"mia.anderson@example.com\",\"phoneNumber\":\"469-555-9012\",\"customerName\":\"Mia Anderson\",\"country\":\"UK\"}"
			},
			{
				"uri": "http://localhost:9926/Customers/14",
				"mimeType": "application/json",
				"text": "{\"id\":14,\"email\":\"noah.thomas@example.com\",\"phoneNumber\":\"817-555-3456\",\"customerName\":\"Noah Thomas\",\"country\":\"Australia\"}"
			},
			{
				"uri": "http://localhost:9926/Customers/15",
				"mimeType": "application/json",
				"text": "{\"id\":15,\"email\":\"olivia.jackson@example.com\",\"phoneNumber\":\"682-555-7890\",\"customerName\":\"Olivia Jackson\",\"country\":\"Germany\"}"
			},
			{
				"uri": "http://localhost:9926/Customers/16",
				"mimeType": "application/json",
				"text": "{\"id\":16,\"email\":\"owen.white@example.com\",\"phoneNumber\":\"214-555-2345\",\"customerName\":\"Owen White\",\"country\":\"France\"}"
			},
			{
				"uri": "http://localhost:9926/Customers/17",
				"mimeType": "application/json",
				"text": "{\"id\":17,\"email\":\"sophia.harris@example.com\",\"phoneNumber\":\"972-555-6789\",\"customerName\":\"Sophia Harris\",\"country\":\"Japan\"}"
			}
		]
	}
}
```

### Querying Tables

When retrieving data from tables using `resources/read`, you can use optional query parameters in the URI to filter data.

- **Filtering:** Use `attribute=value` pairs to filter based on column values. The comparator is always "equals".
  - Example: `http://localhost:9925/my_table?name=John&city=NewYork`
- **Pagination:** Use `limit` and `start` parameters for pagination.
  - `limit`: Maximum number of results to return.
  - `start`: Offset to start returning results from.
  - Example: `http://localhost:9925/my_table?limit=10&start=20`

### Error Responses

The server returns standardized JSON-RPC error responses:

```json
{
	"jsonrpc": "2.0",
	"id": 2,
	"error": {
		"code": -32602,
		"message": "Invalid params."
	}
}
```

Error Codes:

- `-32601`: Method not found.
- `-32602`: Invalid params.
- `-32603`: Internal server error.
