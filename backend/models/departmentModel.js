const { pool, generateId } = require('../../database/db');

const getDepartments = async () => {
  const [rows] = await pool.query('SELECT * FROM departments ORDER BY created_at');
  return rows;
};

const createDepartment = async (department_name) => {
  const id = generateId('DEP');
  await pool.query(
    'INSERT INTO departments (id, department_name) VALUES (?, ?)',
    [id, department_name]
  );
  return { id, department_name };
};

module.exports = { getDepartments, createDepartment };
