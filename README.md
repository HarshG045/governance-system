# Centralized Citizen Governance and Grievance Management System

A complete student-friendly web application for complaint submission, tracking, and governance workflow.

## Tech Stack
- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js, Express
- Database: MySQL 8.0
- Authentication: JWT-based login

## Roles Supported
- Citizen
- Government Officer
- Admin

## Features
- Citizen registration and login
- Complaint submission with category, department, and evidence upload
- Complaint status tracking with timeline and officer remarks
- Officer dashboard with complaint update and closure workflow
- Admin department/user management, complaint assignment, and analytics reports
- Role-based route protection and secure password hashing

## Folder Structure
```text
CP/
  frontend/
    index.html
    login.html
    register.html
    citizen-dashboard.html
    submit-complaint.html
    track-complaint.html
    officer-dashboard.html
    complaint-management.html
    admin-dashboard.html
    department-management.html
    user-management.html
    style.css
    script.js

  backend/
    server.js
    routes/
      authRoutes.js
      citizenRoutes.js
      officerRoutes.js
      adminRoutes.js
    controllers/
      authController.js
      citizenController.js
      officerController.js
      adminController.js
    middleware/
      auth.js
      upload.js
    models/
      userModel.js
      departmentModel.js
      complaintModel.js

  database/
    db.js
    setup.sql

  uploads/
  package.json
  .gitignore
```

## API Endpoints
### Auth APIs
- `POST /api/auth/register`
- `POST /api/auth/login`

### Citizen APIs
- `POST /api/complaints`
- `GET /api/complaints`
- `GET /api/complaints/:id`

### Officer APIs
- `GET /api/officer/complaints`
- `PUT /api/officer/complaints/:id`

### Admin APIs
- `POST /api/admin/departments`
- `GET /api/admin/users`
- `PUT /api/admin/assign`

Additional admin APIs:
- `POST /api/admin/officers`
- `GET /api/admin/departments`
- `GET /api/admin/complaints`
- `GET /api/admin/reports`

## How to Run
1. Install **Node.js** (v18+ recommended) and **MySQL 8.0**.
2. Open terminal in the project root (`CP`).
3. Create the database by running the setup script:
   ```bash
   mysql -u root -p < database/setup.sql
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Create a `.env` file in the project root with these values:
   ```env
   PORT=5000
   JWT_SECRET=your_secure_secret_here
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=grievance_db
   ```
6. Start server:
   ```bash
   npm run dev
   ```
   or
   ```bash
   npm start
   ```
7. Open in browser:
   - `http://localhost:5000/`

## Default Admin Login
- Email: `admin@gov.local`
- Password: `admin123`

## Notes
- Evidence files are stored in `/uploads`.
- Complaint timeline events are stored in a separate `complaint_timeline` table.
- The database auto-seeds default departments and an admin user on first start.
"# governance-system" 
