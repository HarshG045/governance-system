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

The migration seeds demo accounts, officers, citizens, complaints, comments, and admin activity. All demo accounts use the password `demo123`.

Useful logins:

- `admin@demo.com`
- `citizen@demo.com`
- `official@demo.com`
- `roads.officer@demo.com`
- `water.officer@demo.com`
- `electricity.officer@demo.com`
- `sanitation.officer@demo.com`
- `planning.officer@demo.com`

4. Start server:

```bash
npm start
```

API endpoints:

- `GET /health`
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`
- `GET /api/complaints`
- `GET /api/complaints/:id`
- `POST /api/complaints`
- `PUT /api/complaints/:id`
- `DELETE /api/complaints/:id`
- `GET /api/departments`
- `GET /api/departments/:id`
- `POST /api/departments`
- `PUT /api/departments/:id`
- `DELETE /api/departments/:id`
- `GET /api/notifications`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`
- `DELETE /api/notifications`
- `GET /api/complaints/:id/comments`
- `POST /api/complaints/:id/comments`
- `DELETE /api/comments/:id`
