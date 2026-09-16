const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const config = require('./config');

let dbInstance = null;

async function initDb() {
  if (dbInstance) return dbInstance;

  // Try MySQL connection first if configured
  if (config.db.type === 'mysql') {
    try {
      // First try connecting to MySQL server
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

      // Test pool connection
      const testConn = await pool.getConnection();
      testConn.release();

      console.log('✅ Connected to MySQL Database successfully!');

      dbInstance = {
        isSqlite: false,
        query: async (sql, params = []) => {
          const [rows, fields] = await pool.query(sql, params);
          return { rows, insertId: rows.insertId, affectedRows: rows.affectedRows };
        }
      };

      // Ensure tables exist in MySQL
      await createTablesIfNotExist(dbInstance);
      return dbInstance;

    } catch (err) {
      console.warn('⚠️ Could not connect to MySQL Server:', err.message);
      console.log('🔄 Automatically falling back to local SQLite database mode for smooth local execution...');
    }
  }

  // Fallback to SQLite
  const dbPath = path.join(__dirname, '..', 'database', 'volunteer_ngo.db');
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const sqliteDb = new sqlite3.Database(dbPath);

  dbInstance = {
    isSqlite: true,
    query: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        // Convert MySQL standard queries to SQLite if necessary
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
  } catch (err) {
    console.error('Error creating database tables:', err.message);
  }
}

async function getDb() {
  return await initDb();
}

module.exports = { getDb };
