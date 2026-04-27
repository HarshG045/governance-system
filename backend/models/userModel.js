const { pool, generateId } = require('../../database/db');

const getUsers = async () => {
  const [rows] = await pool.query('SELECT * FROM users');
  // Map DB column to JS field name used by controllers
  return rows.map((r) => ({ ...r, departmentId: r.department_id }));
};

const findUserByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
  if (rows.length === 0) return null;
  const r = rows[0];
  return { ...r, departmentId: r.department_id };
};

const findUserById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  const r = rows[0];
  return { ...r, departmentId: r.department_id };
};

const createUser = async (payload) => {
  const id = generateId('USR');
  await pool.query(
    'INSERT INTO users (id, name, email, password, role, department_id) VALUES (?, ?, ?, ?, ?, ?)',
    [id, payload.name, payload.email, payload.password, payload.role, payload.departmentId || null]
  );
  return { id, name: payload.name, email: payload.email, role: payload.role, departmentId: payload.departmentId || null };
};

module.exports = { getUsers, findUserByEmail, findUserById, createUser };
