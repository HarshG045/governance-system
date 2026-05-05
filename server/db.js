const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  database: process.env.PGDATABASE || 'cgms',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '0113',
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
