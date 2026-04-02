import type { APIGatewayProxyResultV2 } from 'aws-lambda';

const headers = {
  'Content-Type': 'application/json',
} as const;

export const ok = <T>(data: T, statusCode = 200): APIGatewayProxyResultV2 => ({
  statusCode,
  headers,
  body: JSON.stringify({ success: true, data }),
});

export const created = <T>(data: T): APIGatewayProxyResultV2 => ok(data, 201);

export const badRequest = (errors: unknown): APIGatewayProxyResultV2 => ({
  statusCode: 400,
  headers,
  body: JSON.stringify({ success: false, errors }),
});

export const unauthorized = (message = 'Unauthorized'): APIGatewayProxyResultV2 => ({
  statusCode: 401,
  headers,
  body: JSON.stringify({ success: false, message }),
});

export const forbidden = (message = 'Forbidden'): APIGatewayProxyResultV2 => ({
  statusCode: 403,
  headers,
  body: JSON.stringify({ success: false, message }),
});

export const conflict = (message = 'Conflict'): APIGatewayProxyResultV2 => ({
  statusCode: 409,
  headers,
  body: JSON.stringify({ success: false, message }),
});

export const notFound = (message = 'Not found'): APIGatewayProxyResultV2 => ({
  statusCode: 404,
  headers,
  body: JSON.stringify({ success: false, message }),
});

export const internalError = (message = 'Internal server error'): APIGatewayProxyResultV2 => ({
  statusCode: 500,
  headers,
  body: JSON.stringify({ success: false, message }),
});
