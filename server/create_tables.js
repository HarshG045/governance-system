const db = require('./db');
const bcrypt = require('bcryptjs');

async function createTables() {
  try {
    await db.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

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

    await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT');
    await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'Active\'');
    await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()');
    await db.query('ALTER TABLE departments ADD COLUMN IF NOT EXISTS code TEXT');
    await db.query('ALTER TABLE departments ADD COLUMN IF NOT EXISTS description TEXT DEFAULT \'\'');
    await db.query('ALTER TABLE departments ADD COLUMN IF NOT EXISTS head_id UUID REFERENCES users(id) ON DELETE SET NULL');
    await db.query('ALTER TABLE departments ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true');
    await db.query('ALTER TABLE complaints ADD COLUMN IF NOT EXISTS ticket_number TEXT UNIQUE');
    await db.query('ALTER TABLE complaints ADD COLUMN IF NOT EXISTS official_id UUID REFERENCES users(id) ON DELETE SET NULL');
    await db.query('ALTER TABLE complaints ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT \'[]\'');
    await db.query('ALTER TABLE complaints ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()');
    await db.query("UPDATE departments SET code = upper(regexp_replace(name, '[^A-Za-z0-9]+', '', 'g')) WHERE code IS NULL");
    await db.query("UPDATE departments SET description = name || ' complaint management' WHERE description IS NULL OR description = ''");
    await db.query("UPDATE users SET status = 'Active' WHERE status IS NULL");

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
          IF NEW.id IS NULL THEN
              NEW.id := nextval(pg_get_serial_sequence('complaints', 'id'));
          END IF;
          IF NEW.ticket_number IS NULL THEN
              NEW.ticket_number := 'TKT-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(NEW.id::text, 4, '0');
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
      { email: 'citizen@demo.com', name: 'Demo Citizen', role: 'citizen', phone: '+91 90000 10001' },
      { email: 'ananya.sharma@demo.com', name: 'Ananya Sharma', role: 'citizen', phone: '+91 90000 10002' },
      { email: 'rahul.mehta@demo.com', name: 'Rahul Mehta', role: 'citizen', phone: '+91 90000 10003' },
      { email: 'priya.nair@demo.com', name: 'Priya Nair', role: 'citizen', phone: '+91 90000 10004' },
      { email: 'official@demo.com', name: 'Demo Official', role: 'official', department: 'Public Works Department', phone: '+91 91000 20001' },
      { email: 'roads.officer@demo.com', name: 'Arjun Patel', role: 'official', department: 'Public Works Department', phone: '+91 91000 20002' },
      { email: 'water.officer@demo.com', name: 'Meera Iyer', role: 'official', department: 'Water Supply Board', phone: '+91 91000 20003' },
      { email: 'electricity.officer@demo.com', name: 'Karan Singh', role: 'official', department: 'Electricity Board', phone: '+91 91000 20004' },
      { email: 'sanitation.officer@demo.com', name: 'Neha Gupta', role: 'official', department: 'Municipal Corporation', phone: '+91 91000 20005' },
      { email: 'planning.officer@demo.com', name: 'Vikram Rao', role: 'official', department: 'Town Planning', phone: '+91 91000 20006' },
      { email: 'admin@demo.com', name: 'Demo Admin', role: 'admin', phone: '+91 92000 30001' },
    ];

    const hashedPassword = await bcrypt.hash('demo123', 10);
    for (const acc of demoAccounts) {
      await db.query(
        `INSERT INTO users (email, password_hash, role, name, department, phone, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'Active')
         ON CONFLICT (email) DO UPDATE
         SET role = EXCLUDED.role,
             name = EXCLUDED.name,
             department = EXCLUDED.department,
             phone = EXCLUDED.phone,
             status = 'Active'`,
        [acc.email, hashedPassword, acc.role, acc.name, acc.department || null, acc.phone || null]
      );
      console.log(`Demo account ready: ${acc.email} / demo123 (${acc.role})`);
    }

    const { rows: seededUsers } = await db.query('SELECT id, email FROM users WHERE email = ANY($1)', [demoAccounts.map(acc => acc.email)]);
    const userIdByEmail = seededUsers.reduce((acc, user) => {
      acc[user.email] = user.id;
      return acc;
    }, {});

    const departmentHeads = [
      ['Public Works Department', 'roads.officer@demo.com'],
      ['Water Supply Board', 'water.officer@demo.com'],
      ['Electricity Board', 'electricity.officer@demo.com'],
      ['Municipal Corporation', 'sanitation.officer@demo.com'],
      ['Town Planning', 'planning.officer@demo.com'],
    ];
    for (const [department, email] of departmentHeads) {
      await db.query('UPDATE departments SET head_id = $1 WHERE name = $2', [userIdByEmail[email], department]);
    }

    const demoComplaints = [
      {
        title: 'Large pothole near college gate',
        description: 'A deep pothole is slowing traffic and creating risk for two-wheelers near the main college gate.',
        category: 'Road',
        priority: 'High',
        status: 'In Progress',
        citizen: 'ananya.sharma@demo.com',
        official: 'roads.officer@demo.com',
        department: 'Public Works Department',
        location: 'College Road, Ward 12',
        daysAgo: 2,
      },
      {
        title: 'Water leakage from main pipeline',
        description: 'Clean water has been leaking continuously from the roadside pipeline since yesterday evening.',
        category: 'Water',
        priority: 'Urgent',
        status: 'Pending',
        citizen: 'rahul.mehta@demo.com',
        official: 'water.officer@demo.com',
        department: 'Water Supply Board',
        location: 'Market Street, Sector 4',
        daysAgo: 1,
      },
      {
        title: 'Street lights not working',
        description: 'Three street lights are not working, making the lane unsafe after sunset.',
        category: 'Electricity',
        priority: 'Medium',
        status: 'Resolved',
        citizen: 'priya.nair@demo.com',
        official: 'electricity.officer@demo.com',
        department: 'Electricity Board',
        location: 'Lake View Colony',
        daysAgo: 6,
      },
      {
        title: 'Garbage collection missed for three days',
        description: 'Garbage bins are overflowing and need urgent collection before the weekend.',
        category: 'Sanitation',
        priority: 'High',
        status: 'In Progress',
        citizen: 'citizen@demo.com',
        official: 'sanitation.officer@demo.com',
        department: 'Municipal Corporation',
        location: 'Green Park Apartments',
        daysAgo: 4,
      },
      {
        title: 'Illegal construction blocking footpath',
        description: 'Construction material is blocking the pedestrian path and forcing people onto the road.',
        category: 'Other',
        priority: 'Medium',
        status: 'Pending',
        citizen: 'ananya.sharma@demo.com',
        official: 'planning.officer@demo.com',
        department: 'Town Planning',
        location: 'MG Road Junction',
        daysAgo: 3,
      },
      {
        title: 'Broken drain cover',
        description: 'A drain cover is broken near the bus stop and needs replacement.',
        category: 'Road',
        priority: 'Low',
        status: 'Closed',
        citizen: 'rahul.mehta@demo.com',
        official: 'roads.officer@demo.com',
        department: 'Public Works Department',
        location: 'Central Bus Stop',
        daysAgo: 9,
      },
    ];

    for (const complaint of demoComplaints) {
      const citizenId = userIdByEmail[complaint.citizen];
      const officialId = userIdByEmail[complaint.official];
      const { rows } = await db.query(
        `INSERT INTO complaints
          (title, description, category, priority, status, citizen_id, official_id, department, location, attachments, created_at, updated_at)
         SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, '[]'::jsonb, now() - ($10::int * interval '1 day'), now() - (($10::int - 1) * interval '1 day')
         WHERE NOT EXISTS (
           SELECT 1 FROM complaints WHERE title = $1 AND citizen_id = $6
         )
         RETURNING id`,
        [
          complaint.title,
          complaint.description,
          complaint.category,
          complaint.priority,
          complaint.status,
          citizenId,
          officialId,
          complaint.department,
          complaint.location,
          complaint.daysAgo,
        ]
      );
      if (rows.length) {
        console.log(`Demo complaint created: ${complaint.title}`);
      }
    }

    const { rows: seededComplaints } = await db.query('SELECT id, title FROM complaints WHERE title = ANY($1)', [demoComplaints.map(c => c.title)]);
    const complaintIdByTitle = seededComplaints.reduce((acc, complaint) => {
      acc[complaint.title] = complaint.id;
      return acc;
    }, {});

    const demoComments = [
      ['Large pothole near college gate', 'roads.officer@demo.com', 'Inspection completed. Repair crew has been assigned for tomorrow morning.'],
      ['Water leakage from main pipeline', 'water.officer@demo.com', 'Team notified. Valve isolation is planned before repair work starts.'],
      ['Street lights not working', 'electricity.officer@demo.com', 'Faulty fuse replaced and lights are operational now.'],
      ['Garbage collection missed for three days', 'sanitation.officer@demo.com', 'Collection vehicle has been routed to the apartment block today.'],
    ];
    for (const [title, email, comment] of demoComments) {
      await db.query(
        `INSERT INTO complaint_comments (complaint_id, user_id, comment)
         SELECT $1, $2, $3
         WHERE NOT EXISTS (
           SELECT 1 FROM complaint_comments WHERE complaint_id = $1 AND comment = $3
         )`,
        [complaintIdByTitle[title], userIdByEmail[email], comment]
      );
    }

    const adminId = userIdByEmail['admin@demo.com'];
    const demoNotifications = [
      [adminId, 'Demo data loaded: citizens, officials and complaints are ready.', 'admin'],
      [adminId, 'New urgent water complaint is pending assignment review.', 'submit'],
      [adminId, 'Road repair complaint moved to In Progress.', 'update'],
    ];
    for (const [userId, message, type] of demoNotifications) {
      await db.query(
        `INSERT INTO notifications (user_id, message, type)
         SELECT $1, $2, $3
         WHERE NOT EXISTS (
           SELECT 1 FROM notifications WHERE user_id = $1 AND message = $2
         )`,
        [userId, message, type]
      );
    }

    console.log('Schema created and seeded successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error creating schema:', err);
    process.exit(1);
  }
}

createTables();
