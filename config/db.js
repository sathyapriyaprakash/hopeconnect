const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const config = require('./config');

let dbInstance = null;

async function initDb() {
  if (dbInstance) return dbInstance;

  // Try MySQL connection first if configured
  if (config.db.type === 'mysql' && !process.env.VERCEL) {
    try {
      const connection = await mysql.createConnection({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password
      });

      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.database}\``);
      await connection.end();

      const pool = mysql.createPool({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      const testConn = await pool.getConnection();
      testConn.release();

      console.log('✅ Connected to MySQL Database successfully!');

      dbInstance = {
        isSqlite: false,
        query: async (sql, params = []) => {
          const [rows] = await pool.query(sql, params);
          return { rows, insertId: rows.insertId, affectedRows: rows.affectedRows };
        }
      };

      await createTablesIfNotExist(dbInstance);
      return dbInstance;

    } catch (err) {
      console.warn('⚠️ Could not connect to MySQL Server:', err.message);
      console.log('🔄 Automatically falling back to local SQLite database mode...');
    }
  }

  // Fallback to SQLite (Writable location for Vercel/Serverless: /tmp/volunteer_ngo.db)
  let dbPath = path.join(__dirname, '..', 'database', 'volunteer_ngo.db');
  if (process.env.VERCEL || process.env.TMPDIR || process.env.NODE_ENV === 'production') {
    dbPath = path.join('/tmp', 'volunteer_ngo.db');
  }

  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    try {
      fs.mkdirSync(dbDir, { recursive: true });
    } catch (e) {
      dbPath = ':memory:';
    }
  }

  const sqliteDb = new sqlite3.Database(dbPath);

  dbInstance = {
    isSqlite: true,
    query: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        let sqliteSql = sql
          .replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT')
          .replace(/ENUM\([^)]+\)/gi, 'TEXT');

        const isSelect = sqliteSql.trim().toUpperCase().startsWith('SELECT');

        if (isSelect) {
          sqliteDb.all(sqliteSql, params, (err, rows) => {
            if (err) return reject(err);
            resolve({ rows });
          });
        } else {
          sqliteDb.run(sqliteSql, params, function (err) {
            if (err) return reject(err);
            resolve({ rows: [], insertId: this.lastID, affectedRows: this.changes });
          });
        }
      });
    },
    close: () => {
      return new Promise((resolve) => sqliteDb.close(resolve));
    }
  };

  console.log('✅ SQLite Database ready at:', dbPath);
  await createTablesIfNotExist(dbInstance);
  return dbInstance;
}

async function createTablesIfNotExist(db) {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY ${db.isSqlite ? 'AUTOINCREMENT' : 'AUTO_INCREMENT'},
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'volunteer',
        phone VARCHAR(20) DEFAULT NULL,
        organization_name VARCHAR(150) DEFAULT NULL,
        city VARCHAR(100) DEFAULT NULL,
        bio TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY ${db.isSqlite ? 'AUTOINCREMENT' : 'AUTO_INCREMENT'},
        ngo_id INTEGER NOT NULL,
        title VARCHAR(200) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        event_date DATE NOT NULL,
        event_time TIME NOT NULL,
        location VARCHAR(255) NOT NULL,
        city VARCHAR(100) NOT NULL,
        max_volunteers INTEGER NOT NULL,
        available_slots INTEGER NOT NULL,
        image_url TEXT DEFAULT NULL,
        status VARCHAR(20) DEFAULT 'Upcoming',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ngo_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS registrations (
        id INTEGER PRIMARY KEY ${db.isSqlite ? 'AUTOINCREMENT' : 'AUTO_INCREMENT'},
        event_id INTEGER NOT NULL,
        volunteer_id INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'Registered',
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (event_id, volunteer_id),
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (volunteer_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Auto seed if empty
    const usersCount = await db.query('SELECT COUNT(*) as count FROM users');
    const count = usersCount.rows ? usersCount.rows[0].count : (usersCount[0] ? usersCount[0][0].count : 0);
    if (count === 0) {
      await autoSeedData(db);
    }
  } catch (err) {
    console.error('Error creating database tables:', err.message);
  }
}

async function autoSeedData(db) {
  try {
    const defaultPassword = await bcrypt.hash('password123', 10);
    const users = [
      ['System Administrator', 'admin@portal.org', defaultPassword, 'admin', '9876543210', 'Central Admin Hub', 'New Delhi', 'Platform Administrator'],
      ['Green Earth Foundation', 'ngo@greenearth.org', defaultPassword, 'ngo', '9811223344', 'Green Earth Foundation', 'Mumbai', 'Dedicated to environmental conservation, tree planting, and beach cleanups.'],
      ['Hope Education Trust', 'ngo@hopeedu.org', defaultPassword, 'ngo', '9822334455', 'Hope Education Trust', 'Bengaluru', 'Providing free tutoring, books, and digital literacy to underprivileged children.'],
      ['Care & Compassion Care', 'ngo@carecompassion.org', defaultPassword, 'ngo', '9833445566', 'Care & Compassion Care', 'Delhi', 'Animal rescue, shelter management, and stray feeding initiatives.'],
      ['Aarav Sharma', 'aarav@gmail.com', defaultPassword, 'volunteer', '9988776655', null, 'Mumbai', 'Passionate about nature, climate action, and community service.'],
      ['Priya Patel', 'priya@gmail.com', defaultPassword, 'volunteer', '9977665544', null, 'Bengaluru', 'Computer Science student keen on teaching coding and basic tech to kids.'],
      ['Rohan Verma', 'rohan@gmail.com', defaultPassword, 'volunteer', '9966554433', null, 'Delhi', 'Animal lover and active blood donor.'],
      ['Sneha Reddy', 'sneha@gmail.com', defaultPassword, 'volunteer', '9955443322', null, 'Hyderabad', 'Youth volunteer enthusiast and emergency response volunteer.']
    ];

    for (const u of users) {
      await db.query(
        `INSERT INTO users (name, email, password, role, phone, organization_name, city, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        u
      );
    }

    const events = [
      [2, 'Mega Coastal & Beach Cleanup 2026', 'Environment', 'Join hands with Green Earth Foundation to restore Juhu Beach.', '2026-10-15', '07:00:00', 'Juhu Beach, Near Ramada Inn', 'Mumbai', 50, 48, 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80', 'Upcoming'],
      [2, 'Urban Forest Tree Plantation Drive', 'Environment', 'Help us plant 500 native trees to create a green lungs zone.', '2026-11-05', '08:30:00', 'Aarey Colony Forest Reserve', 'Mumbai', 30, 28, 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80', 'Upcoming'],
      [3, 'Weekend STEM & Math Tutoring for Kids', 'Education', 'Volunteer teachers needed for primary school children.', '2026-10-20', '10:00:00', 'Hope Community Center, Koramangala', 'Bengaluru', 15, 14, 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80', 'Upcoming'],
      [4, 'Stray Dog Vaccination & Feeding Drive', 'Animal Welfare', 'Feed stray dogs and assist in anti-rabies vaccination tagging.', '2026-10-28', '09:00:00', 'Janakpuri Community Park Gate 3', 'Delhi', 25, 24, 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80', 'Upcoming']
    ];

    for (const e of events) {
      await db.query(
        `INSERT INTO events (ngo_id, title, category, description, event_date, event_time, location, city, max_volunteers, available_slots, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        e
      );
    }

    const regs = [
      [1, 5, 'Registered'],
      [1, 6, 'Registered'],
      [2, 5, 'Registered'],
      [3, 6, 'Registered']
    ];

    for (const r of regs) {
      await db.query(`INSERT INTO registrations (event_id, volunteer_id, status) VALUES (?, ?, ?)`, r);
    }

    console.log('✅ Serverless DB Auto-Seeded Successfully!');
  } catch (err) {
    console.error('Auto-seed error:', err.message);
  }
}

async function getDb() {
  return await initDb();
}

module.exports = { getDb };
