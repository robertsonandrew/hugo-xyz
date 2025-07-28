+++
title = "API Reference"
date = 2024-01-01T00:00:00Z
draft = false
tags = ["documentation", "api"]
description = "Complete API reference with examples"
weight = 2
+++

# API Reference

This document provides detailed information about our API endpoints, request/response formats, and authentication methods.

## Base URL

All API requests should be made to:

```
https://api.arobertson.xyz/v1
```

## Authentication

Our API uses API key authentication. Include your API key in the header of all requests:

```http
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### Users

#### Get User Profile

```http
GET /users/{id}
```

**Parameters:**
- `id` (string, required): The user ID

**Response:**
```json
{
  "id": "user123",
  "name": "John Doe",
  "email": "john@example.com",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### Update User Profile

```http
PUT /users/{id}
```

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
```

**Response:**
```json
{
  "id": "user123",
  "name": "John Smith",
  "email": "johnsmith@example.com",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

### Projects

#### List Projects

```http
GET /projects
```

**Query Parameters:**
- `limit` (integer, optional): Number of projects to return (default: 10)
- `offset` (integer, optional): Number of projects to skip (default: 0)

**Response:**
```json
{
  "projects": [
    {
      "id": "proj123",
      "name": "My Project",
      "description": "A sample project",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1
}
```

#### Create Project

```http
POST /projects
```

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Project description"
}
```

## Error Handling

The API uses standard HTTP status codes and returns error details in JSON format:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request is invalid",
    "details": "Missing required field: name"
  }
}
```

## Rate Limiting

API requests are limited to 100 requests per minute per API key. Rate limit information is included in response headers:

- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when the rate limit window resets

## SDKs and Libraries

We provide official SDKs for popular programming languages:

- [JavaScript/Node.js SDK](https://github.com/arobertson/api-sdk-js)
- [Python SDK](https://github.com/arobertson/api-sdk-python)
- [Go SDK](https://github.com/arobertson/api-sdk-go)
