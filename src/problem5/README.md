# Users API

A RESTful API for managing users built with Express, TypeScript, and PostgreSQL using Drizzle ORM.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your PostgreSQL connection string:
```
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

3. Set up the database:
```bash
npx drizzle-kit push
```

## Running

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server starts on port 3000 by default (configurable via `PORT` env var).

## Endpoints

### POST /users
Create a new user.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response (201):**
```json
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### GET /users
Get all users with filtering, sorting, and pagination.

**Query Parameters:**
- `limit` (1-100, default: 10)
- `offset` (default: 0)
- `sortBy` (id|name|email, default: id)
- `sortOrder` (asc|desc, default: asc)
- `email` - exact email match
- `name` - exact name match
- `search` - case-insensitive search in name or email

**Response (200):**
```json
{
  "data": [...],
  "count": 10
}
```

### GET /users/:id
Get a user by ID.

**Response (200):**
```json
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### PUT /users/:id
Update a user (partial update).

**Request:**
```json
{
  "name": "Jane Doe"
}
```

**Response (200):**
```json
{
  "data": {
    "id": 1,
    "name": "Jane Doe",
    "email": "john@example.com"
  }
}
```

### DELETE /users/:id
Delete a user.

**Response (204)** - No content

## Error Responses

Errors follow the format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

Common error codes:
- `VALIDATION_ERROR` (400) - Invalid input
- `DUPLICATE_EMAIL` (409) - Email already exists
- `USER_NOT_FOUND` (404) - User not found
- `NOT_FOUND` (404) - Route not found
- `INTERNAL_ERROR` (500) - Server error
