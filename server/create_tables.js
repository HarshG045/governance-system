const db = require('./db');
const bcrypt = require('bcryptjs');

async function createTables() {
  try {
    // 1. Departments Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        code TEXT,
        description TEXT DEFAULT '',
        head_id UUID,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // 2. Users Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('citizen', 'official', 'admin')),
        name TEXT NOT NULL,
        department TEXT REFERENCES departments(name) ON DELETE SET NULL,
        phone TEXT,
        status TEXT DEFAULT 'Active',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // 3. Complaints Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id SERIAL PRIMARY KEY,
        ticket_number TEXT UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        priority TEXT,
        status TEXT DEFAULT 'Pending',
        citizen_id UUID REFERENCES users(id) ON DELETE CASCADE,
        official_id UUID REFERENCES users(id) ON DELETE SET NULL,
        department TEXT REFERENCES departments(name) ON DELETE SET NULL,
        location TEXT,
        attachments JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // 4. Notifications Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // 5. Comments Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS complaint_comments (
        id SERIAL PRIMARY KEY,
        complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // Trigger for updated_at
    await db.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = now();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Trigger for ticket number (simple sequence based)
    await db.query(`
      CREATE OR REPLACE FUNCTION generate_ticket_number()
      RETURNS TRIGGER AS $$
      BEGIN
          IF NEW.ticket_number IS NULL THEN
              NEW.ticket_number := 'TKT-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(nextval(pg_get_serial_sequence('complaints', 'id'))::text, 4, '0');
          END IF;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Apply triggers
    await db.query(`DROP TRIGGER IF EXISTS set_updated_at ON users;`);
    await db.query(`CREATE TRIGGER set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();`);
    
    await db.query(`DROP TRIGGER IF EXISTS set_updated_at ON complaints;`);
    await db.query(`CREATE TRIGGER set_updated_at BEFORE UPDATE ON complaints FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();`);

    await db.query(`DROP TRIGGER IF EXISTS set_ticket_number ON complaints;`);
    await db.query(`CREATE TRIGGER set_ticket_number BEFORE INSERT ON complaints FOR EACH ROW EXECUTE PROCEDURE generate_ticket_number();`);

    // Seed initial departments
    const departments = ['Public Works Department', 'Water Supply Board', 'Electricity Board', 'Municipal Corporation', 'Town Planning'];
    for (const dept of departments) {
      const code = dept.split(/\s+/).map(part => part[0]).join('').toUpperCase();
      await db.query(
        'INSERT INTO departments (name, code, description) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
        [dept, code, `${dept} complaint management`]
      );
    }

    // Seed demo accounts
    const demoAccounts = [
      { email: 'citizen@demo.com', name: 'Demo Citizen', role: 'citizen' },
      { email: 'official@demo.com', name: 'Demo Official', role: 'official', department: 'Public Works Department' },
      { email: 'admin@demo.com', name: 'Demo Admin', role: 'admin' },
    ];

    for (const acc of demoAccounts) {
      const { rows: existing } = await db.query('SELECT * FROM users WHERE email = $1', [acc.email]);
      if (existing.length === 0) {
        const hashedPassword = await bcrypt.hash('demo123', 10);
        await db.query(
          'INSERT INTO users (email, password_hash, role, name, department) VALUES ($1, $2, $3, $4, $5)',
          [acc.email, hashedPassword, acc.role, acc.name, acc.department || null]
        );
        console.log(`Demo account created: ${acc.email} / demo123 (${acc.role})`);
      }
    }

    console.log('Schema created and seeded successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error creating schema:', err);
    process.exit(1);
  }
}

createTables();
