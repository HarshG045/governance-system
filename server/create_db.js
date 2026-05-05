const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
  const client = new Client({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: 'postgres',
  });

  try {
    await client.connect();
    await client.query('CREATE DATABASE cgms');
    console.log('Database cgms created.');
  } catch (err) {
    if (err.code === '42P04') {
      console.log('Database cgms already exists.');
    } else {
      console.error('Error creating database:', err);
    }
  } finally {
    await client.end();
  }
}

createDatabase();
