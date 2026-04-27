-- Grievance Management System — MySQL Setup
-- Run: mysql -u root < database/setup.sql

CREATE DATABASE IF NOT EXISTS grievance_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE grievance_db;

-- ───────────────────────────────────────────
-- Departments
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id            VARCHAR(30)  PRIMARY KEY,
  department_name VARCHAR(100) NOT NULL UNIQUE,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ───────────────────────────────────────────
-- Users
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(30)  PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password      VARCHAR(255) NOT NULL,
  role          ENUM('citizen','officer','admin') NOT NULL DEFAULT 'citizen',
  department_id VARCHAR(30)  DEFAULT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ───────────────────────────────────────────
-- Complaints
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS complaints (
  id              VARCHAR(30)  PRIMARY KEY,
  citizen_id      VARCHAR(30)  NOT NULL,
  title           VARCHAR(200) NOT NULL,
  description     TEXT         NOT NULL,
  category        VARCHAR(50)  NOT NULL,
  department      VARCHAR(100) DEFAULT NULL,
  department_id   VARCHAR(30)  DEFAULT NULL,
  evidence        VARCHAR(300) DEFAULT NULL,
  status          ENUM('Submitted','In Progress','Resolved') NOT NULL DEFAULT 'Submitted',
  officer_id      VARCHAR(30)  DEFAULT NULL,
  officer_remarks TEXT         DEFAULT NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (citizen_id)    REFERENCES users(id),
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (officer_id)    REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ───────────────────────────────────────────
-- Complaint Timeline (normalized from JSON array)
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS complaint_timeline (
  id            INT          AUTO_INCREMENT PRIMARY KEY,
  complaint_id  VARCHAR(30)  NOT NULL,
  status        VARCHAR(30)  NOT NULL,
  note          TEXT         DEFAULT NULL,
  by_user       VARCHAR(100) DEFAULT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
) ENGINE=InnoDB;
