const db = require('./db');

async function createTables() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        user_id TEXT,
        category TEXT,
        department TEXT,
        priority TEXT,
        location TEXT,
        attachments TEXT DEFAULT '[]',
        status TEXT DEFAULT 'submitted',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);
    await db.query(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS category TEXT;`);
    await db.query(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS department TEXT;`);
    await db.query(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS priority TEXT;`);
    await db.query(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS location TEXT;`);
    await db.query(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS attachments TEXT DEFAULT '[]';`);
    await db.query(`ALTER TABLE complaints ALTER COLUMN attachments TYPE TEXT USING attachments::text;`);
    console.log('Tables created or already exist.');
    process.exit(0);
  } catch (err) {
    console.error('Error creating tables', err);
    process.exit(1);
  }
}

createTables();
