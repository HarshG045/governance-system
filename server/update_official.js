const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cgms',
  password: 'postgres@123',
  port: 5432,
});

async function update() {
  await pool.query("UPDATE users SET department = 'Public Works Department' WHERE email = 'official@demo.com'");
  console.log('Updated official department');
  await pool.end();
}
update();
