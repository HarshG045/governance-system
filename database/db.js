const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'grievance_db',
  waitForConnections: true,
  connectionLimit: 10
});

const generateId = (prefix = 'ID') => {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${Date.now()}-${randomPart}`;
};

const initDatabase = async () => {
  // Seed default departments
  const [depts] = await pool.query('SELECT COUNT(*) AS cnt FROM departments');
  if (depts[0].cnt === 0) {
    const defaults = ['Water Supply', 'Roads and Transport', 'Sanitation', 'Electricity'];
    for (const name of defaults) {
      await pool.query(
        'INSERT INTO departments (id, department_name) VALUES (?, ?)',
        [generateId('DEP'), name]
      );
    }
    console.log('Default departments seeded.');
  }

  // Seed default admin
  const [admins] = await pool.query("SELECT COUNT(*) AS cnt FROM users WHERE role = 'admin'");
  if (admins[0].cnt === 0) {
    const hash = await bcrypt.hash('admin123', 10);
    await pool.query(
      'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [generateId('USR'), 'System Admin', 'admin@gov.local', hash, 'admin']
    );
    console.log('Default admin seeded (admin@gov.local / admin123).');
  }
};

module.exports = { pool, generateId, initDatabase };
