# CGMS Server

Minimal Node/Express backend for the CGMS app.

Quick start:

1. Copy `.env.example` to `.env` and adjust if needed.
2. Install dependencies:

```bash
cd server
npm install
```

3. Create tables:

```bash
npm run migrate
```

4. Start server:

```bash
npm start
```

API endpoints:
- `GET /health`
- `POST /api/complaints` { title, description, user_id }
- `GET /api/complaints` (optional `?userId=`)
- `GET /api/complaints/:id`
- `PUT /api/complaints/:id/status` { status }
