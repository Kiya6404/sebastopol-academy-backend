# Sebastopol Academy — Backend

This repository contains the backend API for the Sebastopol learning platform. It provides authentication, lessons and news endpoints and is designed to be deployed (for example) on Railway, Heroku, or another Node-friendly host.

This README documents the project, how to run it locally, required environment variables, the API contract the frontend expects, database notes, security considerations, and troubleshooting tips.

Table of contents
- About
- Tech stack
- Quick start (local)
- Environment variables
- Database (Postgres) & schema
- Project structure (key files)
- API endpoints
- Authentication & tokens
- CORS & deployed origins
- Deployment (Railway / similar)
- Logging & debugging
- Troubleshooting
- Contributing
- License

About
-----
A small Express-based API that supports user registration/login (JWT-based), lesson management, and news content. It exposes routes under `/api/*`.

Tech stack
----------
- Node.js (Express)
- PostgreSQL (pg)
- bcryptjs (password hashing)
- jsonwebtoken (JWT)
- helmet (security headers)
- cors (CORS handling)

Quick start (local)
-------------------
1. Clone the repo:
   git clone https://github.com/Kiya6404/sebastopol-academy-backend.git
   cd sebastopol-academy-backend

2. Install dependencies:
   npm install

3. Create a .env file (see Environment variables below) and configure your Postgres DB and JWT secret.

4. Run locally:
   npm run dev
   or
   node server.js

5. The server listens on the port defined by `PORT` or 8080 by default:
   http://localhost:8080

Environment variables
---------------------
Create a `.env` file at the project root or set these variables in your environment:

- PORT — port to run the server (default 8080)
- DATABASE_URL or separate Postgres variables:
  - PGHOST
  - PGPORT
  - PGUSER
  - PGPASSWORD
  - PGDATABASE
- JWT_SECRET — secret used to sign JWT tokens (required)
- NODE_ENV — development | production (optional)

Example .env:
```
PORT=8080
DATABASE_URL=postgres://user:password@host:5432/database
JWT_SECRET=super_secret_here
NODE_ENV=development
```

Database (Postgres)
-------------------
The backend uses PostgreSQL. The repo expects a `users` table (and presumably lessons/news tables). Example schemas to get started:

Users table (minimal):
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'student',
  created_at TIMESTAMP DEFAULT NOW()
);
```

A simple lessons table (example — adjust fields to match frontend expectations):
```sql
CREATE TABLE lessons (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  category TEXT,
  difficulty_level TEXT,
  estimated_duration INTEGER,
  is_completed BOOLEAN DEFAULT FALSE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

Adjust schema as needed to reflect real application requirements.

Project structure (key files)
-----------------------------
- `server.js` — main server entry. Registers middleware, CORS, connects DB, mounts routes:
  - `app.use('/api/auth', require('./src/routes/auth'))`
  - `app.use('/api/lessons', require('./src/routes/lessons'))`
  - `app.use('/api/news', require('./src/routes/news'))`
- `src/config/database.js` — database connection logic (pg or pool initialization).
- `src/routes/auth.js` (and `routes/auth.js`) — authentication endpoints (register, login, get current user).
  - Note: `/api/auth/register` (POST), `/api/auth/login` (POST), `/api/auth/me` (GET).
- `middleware/auth.js` — JWT auth middleware (parses Authorization header `Bearer <token>` and attaches `req.user`).
- `src/routes/lessons.js` — lessons endpoints (list, get, create, update, delete).
- `src/routes/news.js` — news endpoints (if present).
- `src/models/*` — model helpers (if present) — some files may provide helper functions to query DB.

API endpoints (frontend contract)
--------------------------------
The frontend expects the API endpoints under the `/api` base path:

Auth
- POST /api/auth/register
  - Body: { email, password, name, role? }
  - Response (example): { success: true, token, user: { id, email, name, role } }

- POST /api/auth/login
  - Body: { email, password }
  - Response (example): { success: true, token, user: { id, email, name, role } }

- GET /api/auth/me
  - Header: Authorization: Bearer <token>
  - Response (example): { success: true, user: { id, email, name, role } }

Lessons (typical)
- GET /api/lessons — list lessons
- GET /api/lessons/:id — get single lesson
- POST /api/lessons — create lesson (likely requires instructor role / auth)
- PUT /api/lessons/:id — update lesson
- DELETE /api/lessons/:id — delete lesson

News (typical)
- GET /api/news
- GET /api/news/:id
- POST /api/news
- PUT /api/news/:id
- DELETE /api/news/:id

Authentication & tokens
----------------------
- JWT tokens are signed using `JWT_SECRET`. The token payload typically includes at least `userId` and `role`.
- Protected endpoints use the `Authorization` header with the `Bearer` scheme.
- The middleware `middleware/auth.js` verifies the token and sets `req.user` to the authenticated user record.
- The backend currently issues tokens on register/login but does not necessarily implement a server-side logout route (invalidate tokens) — logout can be client-side by deleting the token.

CORS & deployed origins
-----------------------
- `server.js` configures CORS and contains an allowed origins list. Make sure your frontend origin(s) are listed.
- Example allowed origins in code:
  - `https://sebastopol-gamma.vercel.app`
  - `https://*.vercel.app`
  - `https://sebastopol-academy-backend-production.up.railway.app`
- If the frontend is hosted on Vercel, include the exact Vercel deployment domain or `*.vercel.app` as needed.
- If you need to allow other domains, edit the `allowedOrigins` array in `server.js` or make it configurable via env var.

Deployment (Railway / similar)
-----------------------------
- Railway and similar hosts accept `DATABASE_URL` and `PORT` env variables. Configure them in the project settings on the host.
- Ensure `JWT_SECRET` is set in the deployment environment.
- Confirm the branch/commit being deployed matches the code containing the mounted routes.

Logging & debugging
-------------------
- Server logs show CORS checks and route-related errors. Check the host's logs (Railway/Heroku) when debugging requests.
- Typical debugging flow:
  1. Trigger the request from the frontend.
  2. Inspect browser DevTools Network — note Request URL (should include `/api/...`), headers, and response status/body.
  3. Inspect server logs — confirm the request arrived and review any stack traces.
  4. Fix either frontend path or backend route as needed.

Troubleshooting
---------------
- 404 "Cannot POST /auth/login" or "Cannot GET /api/..."  
  - Usually a path mismatch: the frontend called `/auth/login` (without `/api`) while the server mounts at `/api/auth`.
  - Ensure frontend baseURL is correct or server mounts routes where expected.

- 401 Unauthorized on protected endpoints  
  - Check the Authorization header is present and the JWT is valid.
  - Verify `JWT_SECRET` matches the secret used to sign tokens.

- CORS errors  
  - Make sure the frontend origin is allowed in the server's CORS configuration.

- Database errors  
  - Confirm `DATABASE_URL` / Postgres credentials are correct and the required tables exist.
  - Check migrations or run provided SQL to create tables.

- Deprecation warnings (Node)  
  - `fs.F_OK is deprecated` may appear — update code that uses `fs.F_OK` to `fs.constants.F_OK`, or update dependencies.

Security notes
--------------
- Use a strong `JWT_SECRET` in production and never commit secrets to version control.
- Consider refresh tokens or token revocation if required by your security model.
- Use HTTPS in production and ensure cookies/headers are set securely.
- Rate limiting is included via `express-rate-limit` — adjust limits according to expected traffic.

Contributing
------------
- Follow branch/PR workflow. If `main` is protected, open a branch and create a pull request.
- Run linting/tests (if any) before merging.
- Document DB migrations and schema changes in PRs.

License
-------
Specify project license here (e.g., MIT). If none is specified, indicate proprietary status.

Appendix — Example curl calls
-----------------------------
Register:
```
curl -X POST 'https://<BACKEND>/api/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"password","name":"Your Name"}'
```

Login:
```
curl -X POST 'https://<BACKEND>/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"password"}'
```

Get current user (replace TOKEN):
```
curl -X GET 'https://<BACKEND>/api/auth/me' \
  -H 'Authorization: Bearer TOKEN'
```
