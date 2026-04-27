# Centralized Citizen Governance and Grievance Management System

A production-ready web application for complaint submission, tracking, and governance workflow, featuring a modern React frontend and a robust Node.js backend.

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: MySQL 8.0
- **Authentication**: JWT-based secure login

## Roles Supported
- **Citizen**: Submit complaints, upload evidence, and track progress via timeline.
- **Officer**: Manage department-specific complaints and update status with remarks.
- **Admin**: Full system management (users, departments, assignments) and analytics.

## Features
- Secure authentication with role-based access control.
- Complaint submission with department categorization and image upload.
- Interactive tracking with a real-time status timeline.
- Officer dashboard with closure workflow and audit logs.
- Admin dashboard with department-wise reports and user management.
- Fully responsive UI optimized for desktop and mobile.

## Project Structure
```text
CP/
├── frontend/             # Modern React (Vite) Application
│   ├── src/
│   │   ├── components/   # Reusable UI components (Sidebar, Button, etc.)
│   │   ├── pages/        # Main route pages (Dashboards, Login, etc.)
│   │   ├── contexts/     # Auth and state management
│   │   ├── services/     # API service layer
│   │   └── App.tsx       # Main routing
│   ├── vite.config.ts    # Build and proxy config
│   └── package.json
│
├── backend/              # Node.js + Express API
│   ├── routes/           # Role-specific route handlers
│   ├── controllers/      # Business logic
│   ├── models/           # MySQL data models
│   └── server.js         # API entry point
│
├── database/             # Database scripts and migrations
│   └── setup.sql         # Database schema and initial seed data
│
├── uploads/              # Storage for complaint evidence
└── package.json          # Main project config
```

## Setup and Installation

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **MySQL 8.0**

### 2. Database Setup
1. Create the database and seed initial data:
   ```bash
   mysql -u root -p < database/setup.sql
   ```

### 3. Backend Setup
1. From the project root (`CP`), install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the root with your configuration:
   ```env
   PORT=5000
   JWT_SECRET=your_secure_secret_here
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=grievance_db
   ```
3. Start the backend server:
   ```bash
   npm run dev
   ```

### 4. Frontend Setup
1. Open a new terminal in the `frontend` directory:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite dev server:
   ```bash
   npm run dev
   ```
3. Access the application at: `http://localhost:3000`

---

## Default Admin Credentials
- **Email**: `admin@gov.local`
- **Password**: `admin123`

## Development Notes
- The frontend is proxied to the backend on port 5000 via `vite.config.ts`.
- Evidence uploads are handled via `multer` and served from the `/uploads` directory.
- Use `npm run build` in the `frontend` directory for production-ready assets.
