# Complaint Portal

React/Vite frontend with an Express and PostgreSQL backend for citizen complaint management.

## Prerequisites

- Node.js 18+
- PostgreSQL running locally
- A PostgreSQL database named `cgms`

## Setup

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
cd server
npm install
```

Create backend environment config:

```bash
copy .env.example .env
```

Update `server/.env` with your local PostgreSQL credentials, then create and seed the schema:

```bash
npm run migrate
```

Start the backend:

```bash
npm start
```

In another terminal, start the frontend from the project root:

```bash
npm run dev
```

The frontend proxies `/api` requests to `http://localhost:4000`.

## Demo Logins

After migration, all demo accounts use password `demo123`.

- `admin@demo.com`
- `citizen@demo.com`
- `official@demo.com`
- `roads.officer@demo.com`
- `water.officer@demo.com`
- `electricity.officer@demo.com`
- `sanitation.officer@demo.com`
- `planning.officer@demo.com`
