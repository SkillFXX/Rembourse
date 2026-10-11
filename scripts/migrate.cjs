const fs = require('fs');
const Database = require('better-sqlite3');
const path = require('path');

function migrateOldData(dbPath = 'data/rembourse.db', sqlPath = 'old_data.sql') {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      is_active INTEGER NOT NULL DEFAULT 1,
      phone TEXT DEFAULT '',
      avatar TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'tag',
      color TEXT NOT NULL DEFAULT '#6366f1'
    );

    CREATE TABLE IF NOT EXISTS debts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      creditor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      debtor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      reason TEXT NOT NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      due_date TEXT DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      status TEXT NOT NULL DEFAULT 'unpaid',
      paid_amount REAL NOT NULL DEFAULT 0.00,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      approval_status TEXT NOT NULL DEFAULT 'pending_approval',
      creditor_approved INTEGER NOT NULL DEFAULT 0,
      debtor_approved INTEGER NOT NULL DEFAULT 0,
      dispute_reason TEXT DEFAULT NULL,
      disputed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      disputed_at TEXT DEFAULT NULL,
      approved_at TEXT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'Virement',
      reason TEXT NOT NULL,
      debt_id INTEGER REFERENCES debts(id) ON DELETE SET NULL,
      payment_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      approval_status TEXT NOT NULL DEFAULT 'pending_approval',
      payer_approved INTEGER NOT NULL DEFAULT 0,
      receiver_approved INTEGER NOT NULL DEFAULT 0,
      dispute_reason TEXT DEFAULT NULL,
      disputed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      disputed_at TEXT DEFAULT NULL,
      approved_at TEXT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER DEFAULT NULL,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      used_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT DEFAULT NULL,
      is_used INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT DEFAULT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    console.log(`Database already has ${userCount} users. Skipping import from ${sqlPath}.`);
    return db;
  }

  if (!fs.existsSync(sqlPath)) {
    console.log(`SQL file ${sqlPath} not found. Skipping migration.`);
    return db;
  }

  console.log(`Importing data from ${sqlPath}...`);
  const rawSql = fs.readFileSync(sqlPath, 'utf8');

  // Helper to extract INSERT statements
  const tables = ['categories', 'users', 'debts', 'payments', 'audit_logs'];

  db.transaction(() => {
    for (const table of tables) {
      const regex = new RegExp("INSERT INTO [`]?" + table + "[`]?\\s*\\(([^\\)]+)\\)\\s*VALUES\\s*([\\s\\S]*?);", "i");
      const match = rawSql.match(regex);
      if (!match) {
        console.log(`No INSERT found for table ${table}`);
        continue;
      }

      const columnsStr = match[1].replace(/`/g, '').trim();
      const columns = columnsStr.split(',').map(c => c.trim());
      const valuesStr = match[2].trim();

      // Parse SQL row tuples like (val1, val2, ...), (val3, val4, ...)
      // We parse carefully taking string quotes into account
      const rows = parseSqlValues(valuesStr);
      console.log(`Table ${table}: found ${rows.length} rows to insert with columns: ${columns.join(', ')}`);

      const placeholders = columns.map(() => '?').join(', ');
      const stmt = db.prepare(`INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`);

      for (const row of rows) {
        if (row.length !== columns.length) {
          console.warn(`Mismatch in ${table}: expected ${columns.length} values, got ${row.length}`, row);
        }
        stmt.run(...row);
      }
    }
  })();

  const newCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const debtsCount = db.prepare('SELECT COUNT(*) as count FROM debts').get().count;
  const paymentsCount = db.prepare('SELECT COUNT(*) as count FROM payments').get().count;
  console.log(`Migration finished! Imported ${newCount} users, ${debtsCount} debts, ${paymentsCount} payments.`);
  return db;
}

function parseSqlValues(str) {
  const rows = [];
  let inRow = false;
  let inString = false;
  let wasQuoted = false;
  let escapeNext = false;
  let currentVal = '';
  let currentRow = [];

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (!inRow) {
      if (char === '(') {
        inRow = true;
        currentRow = [];
        currentVal = '';
        inString = false;
        wasQuoted = false;
        escapeNext = false;
      }
      continue;
    }

    if (inString) {
      if (escapeNext) {
        currentVal += char;
        escapeNext = false;
      } else if (char === '\\') {
        escapeNext = true;
      } else if (char === '\'') {
        if (i + 1 < str.length && str[i + 1] === '\'') {
          currentVal += '\'';
          i++;
        } else {
          inString = false;
        }
      } else {
        currentVal += char;
      }
      continue;
    }

    // Not in string:
    if (char === '\'') {
      inString = true;
      wasQuoted = true;
      currentVal = '';
      continue;
    }

    if (char === ',' || char === ')') {
      let parsed = null;
      if (wasQuoted) {
        parsed = currentVal;
      } else {
        const trimmed = currentVal.trim();
        if (trimmed.toUpperCase() === 'NULL' || trimmed === '') {
          parsed = null;
        } else if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
          parsed = Number(trimmed);
        } else {
          parsed = trimmed;
        }
      }
      currentRow.push(parsed);
      currentVal = '';
      wasQuoted = false;

      if (char === ')') {
        rows.push(currentRow);
        inRow = false;
        currentRow = [];
      }
      continue;
    }

    if (!wasQuoted) {
      currentVal += char;
    }
  }

  return rows;
}

if (require.main === module) {
  migrateOldData();
}

module.exports = { migrateOldData };
