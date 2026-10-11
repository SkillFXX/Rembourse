import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

const DB_PATH = path.resolve('data', 'rembourse.db');
const SQL_BACKUP_PATH = path.resolve('old_data.sql');

// Ensure data folder exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
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

// Auto-migrate from old_data.sql if users table is empty
function checkAndMigrate() {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (countRow.count === 0 && fs.existsSync(SQL_BACKUP_PATH)) {
    try {
      const rawSql = fs.readFileSync(SQL_BACKUP_PATH, 'utf8');
      const tables = ['categories', 'users', 'debts', 'payments', 'audit_logs'];

      db.transaction(() => {
        for (const table of tables) {
          const regex = new RegExp("INSERT INTO [`]?" + table + "[`]?\\s*\\(([^\\)]+)\\)\\s*VALUES\\s*([\\s\\S]*?);", "i");
          const match = rawSql.match(regex);
          if (!match) continue;

          const columnsStr = match[1].replace(/`/g, '').trim();
          const columns = columnsStr.split(',').map((c) => c.trim());
          const valuesStr = match[2].trim();
          const rows = parseSqlValues(valuesStr);

          const placeholders = columns.map(() => '?').join(', ');
          const stmt = db.prepare(`INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`);

          for (const row of rows) {
            stmt.run(...row);
          }
        }
      })();
      console.log('Successfully auto-imported data from old_data.sql');
    } catch (err) {
      console.error('Error during auto-migration from old_data.sql:', err);
    }
  }
}

function parseSqlValues(str: string): any[][] {
  const rows: any[][] = [];
  let inRow = false;
  let inString = false;
  let wasQuoted = false;
  let escapeNext = false;
  let currentVal = '';
  let currentRow: any[] = [];

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

    if (char === '\'') {
      inString = true;
      wasQuoted = true;
      currentVal = '';
      continue;
    }

    if (char === ',' || char === ')') {
      let parsed: any = null;
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

checkAndMigrate();

// Types
export interface User {
  id: number;
  username: string;
  email: string;
  password?: string;
  full_name: string;
  role: 'admin' | 'user';
  is_active: number;
  phone: string;
  avatar: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
}

export interface Debt {
  id: number;
  creditor_id: number;
  debtor_id: number;
  creator_id: number;
  amount: number;
  reason: string;
  category_id: number | null;
  due_date: string | null;
  notes: string | null;
  status: string;
  paid_amount: number;
  created_at: string;
  updated_at: string;
  approval_status: 'pending_approval' | 'approved' | 'disputed' | 'cancelled';
  creditor_approved: number;
  debtor_approved: number;
  dispute_reason: string | null;
  disputed_by: number | null;
  disputed_at: string | null;
  approved_at: string | null;
  // joined fields
  creditor_name?: string;
  debtor_name?: string;
  creator_name?: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
}

export interface Payment {
  id: number;
  payer_id: number;
  receiver_id: number;
  creator_id: number;
  amount: number;
  payment_method: string;
  reason: string;
  debt_id: number | null;
  payment_date: string;
  created_at: string;
  approval_status: 'pending_approval' | 'approved' | 'disputed' | 'cancelled';
  payer_approved: number;
  receiver_approved: number;
  dispute_reason: string | null;
  disputed_by: number | null;
  disputed_at: string | null;
  approved_at: string | null;
  // joined fields
  payer_name?: string;
  receiver_name?: string;
  creator_name?: string;
}

export interface Invitation {
  id: number;
  code: string;
  created_by: number;
  used_by: number | null;
  created_at: string;
  expires_at: string | null;
  is_used: number;
  creator_name?: string;
}

export interface AppNotification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: number;
  created_at: string;
}

// User & Auth Functions
export function getUserById(id: number): User | null {
  const row = db.prepare('SELECT id, username, email, full_name, role, is_active, phone, avatar, created_at, updated_at FROM users WHERE id = ?').get(id) as User | undefined;
  return row || null;
}

export function getUserByUsernameOrEmail(identifier: string): (User & { password: string }) | null {
  const row = db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)').get(identifier, identifier) as (User & { password: string }) | undefined;
  return row || null;
}

export function getAllUsers(): User[] {
  return db.prepare('SELECT id, username, email, full_name, role, is_active, phone, avatar, created_at, updated_at FROM users WHERE is_active = 1 ORDER BY full_name ASC').all() as User[];
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    const normalizedHash = hash.startsWith('$2y$') ? hash.replace(/^\$2y\$/, '$2a$') : hash;
    return bcrypt.compareSync(password, normalizedHash);
  } catch (err) {
    console.error('Password compare error:', err);
    return false;
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function createSession(userId: number): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expiresAt);
  return token;
}

export function getSessionUser(token: string): User | null {
  if (!token) return null;
  const row = db.prepare(`
    SELECT u.id, u.username, u.email, u.full_name, u.role, u.is_active, u.phone, u.avatar, u.created_at, u.updated_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND datetime(s.expires_at) > datetime('now') AND u.is_active = 1
  `).get(token) as User | undefined;
  return row || null;
}

export function deleteSession(token: string): void {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

// Invitations
export function createInvitation(userId: number): Invitation {
  const code = 'INV-' + crypto.randomBytes(6).toString('hex').toUpperCase();
  db.prepare('INSERT INTO invitations (code, created_by) VALUES (?, ?)').run(code, userId);
  return db.prepare(`
    SELECT i.*, u.full_name as creator_name
    FROM invitations i
    JOIN users u ON i.created_by = u.id
    WHERE i.code = ?
  `).get(code) as Invitation;
}

export function getInvitation(code: string): Invitation | null {
  const row = db.prepare(`
    SELECT i.*, u.full_name as creator_name
    FROM invitations i
    JOIN users u ON i.created_by = u.id
    WHERE UPPER(i.code) = UPPER(?)
  `).get(code) as Invitation | undefined;
  return row || null;
}

export function getUserInvitations(userId: number): Invitation[] {
  return db.prepare(`
    SELECT i.*, u.full_name as creator_name, used.full_name as used_by_name
    FROM invitations i
    JOIN users u ON i.created_by = u.id
    LEFT JOIN users used ON i.used_by = used.id
    WHERE i.created_by = ?
    ORDER BY i.created_at DESC
  `).all(userId) as Invitation[];
}

export function registerWithInvitation(data: {
  username: string;
  email: string;
  password: string;
  full_name: string;
  inviteCode: string;
}): { success: boolean; user?: User; error?: string } {
  const invite = getInvitation(data.inviteCode);
  if (!invite) {
    return { success: false, error: "Code d'invitation invalide." };
  }
  if (invite.is_used) {
    return { success: false, error: "Ce code d'invitation a déjà été utilisé." };
  }

  // Check unique username / email
  const existingUser = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)').get(data.username, data.email);
  if (existingUser) {
    return { success: false, error: "Ce nom d'utilisateur ou cet email est déjà utilisé." };
  }

  const hashedPassword = hashPassword(data.password);

  const result = db.transaction(() => {
    const insertRes = db.prepare(`
      INSERT INTO users (username, email, password, full_name, role, is_active)
      VALUES (?, ?, ?, ?, 'user', 1)
    `).run(data.username.trim(), data.email.trim(), hashedPassword, data.full_name.trim());

    const newUserId = insertRes.lastInsertRowid as number;

    // Mark invite used
    db.prepare('UPDATE invitations SET is_used = 1, used_by = ? WHERE id = ?').run(newUserId, invite.id);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES (?, 'USER_CREATED', 'user', ?, ?)
    `).run(invite.created_by, newUserId, `Inscription de ${data.full_name} via invitation ${data.inviteCode}`);

    // Notify inviter
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (?, 'USER_JOINED', 'Nouvel ami inscrit !', ?, '/amis')
    `).run(invite.created_by, `${data.full_name} a rejoint Rembourse grâce à votre invitation.`);

    return getUserById(newUserId);
  })();

  return { success: true, user: result! };
}

// Categories
export function getCategories(): Category[] {
  return db.prepare('SELECT * FROM categories ORDER BY id ASC').all() as Category[];
}

// Debts & Payments
export function getDebtsForUser(userId: number, limit = 100): Debt[] {
  return db.prepare(`
    SELECT d.*,
           c.name as category_name, c.icon as category_icon, c.color as category_color,
           u_cred.full_name as creditor_name,
           u_debt.full_name as debtor_name,
           u_create.full_name as creator_name
    FROM debts d
    LEFT JOIN categories c ON d.category_id = c.id
    JOIN users u_cred ON d.creditor_id = u_cred.id
    JOIN users u_debt ON d.debtor_id = u_debt.id
    JOIN users u_create ON d.creator_id = u_create.id
    WHERE d.creditor_id = ? OR d.debtor_id = ?
    ORDER BY d.created_at DESC
    LIMIT ?
  `).all(userId, userId, limit) as Debt[];
}

export function getPaymentsForUser(userId: number, limit = 100): Payment[] {
  return db.prepare(`
    SELECT p.*,
           u_pay.full_name as payer_name,
           u_rec.full_name as receiver_name,
           u_create.full_name as creator_name
    FROM payments p
    JOIN users u_pay ON p.payer_id = u_pay.id
    JOIN users u_rec ON p.receiver_id = u_rec.id
    JOIN users u_create ON p.creator_id = u_create.id
    WHERE p.payer_id = ? OR p.receiver_id = ?
    ORDER BY p.created_at DESC
    LIMIT ?
  `).all(userId, userId, limit) as Payment[];
}

export interface FriendBalance {
  friendId: number;
  friendName: string;
  friendUsername: string;
  avatar: string | null;
  // Positive means friend owes me, negative means I owe friend
  netBalance: number;
  totalLent: number;       // What I paid for friend (approved)
  totalBorrowed: number;   // What friend paid for me (approved)
  totalPaidToFriend: number;   // What I refunded to friend (approved)
  totalReceivedFromFriend: number; // What friend refunded to me (approved)
  pendingToValidateCount: number; // Transactions waiting for MY validation
  pendingAwaitingFriendCount: number; // Transactions created by me waiting for friend's validation
}

export function getUserBalances(userId: number): {
  totalNet: number;
  friendsBalances: FriendBalance[];
  pendingValidationsCount: number;
} {
  const users = getAllUsers().filter((u) => u.id !== userId);

  // Approved Debts where userId is creditor
  const lentDebts = db.prepare(`
    SELECT debtor_id, SUM(amount) as total
    FROM debts
    WHERE creditor_id = ? AND approval_status = 'approved'
    GROUP BY debtor_id
  `).all(userId) as { debtor_id: number; total: number }[];

  // Approved Debts where userId is debtor
  const borrowedDebts = db.prepare(`
    SELECT creditor_id, SUM(amount) as total
    FROM debts
    WHERE debtor_id = ? AND approval_status = 'approved'
    GROUP BY creditor_id
  `).all(userId) as { creditor_id: number; total: number }[];

  // Approved Payments where userId is payer
  const paymentsMade = db.prepare(`
    SELECT receiver_id, SUM(amount) as total
    FROM payments
    WHERE payer_id = ? AND approval_status = 'approved'
    GROUP BY receiver_id
  `).all(userId) as { receiver_id: number; total: number }[];

  // Approved Payments where userId is receiver
  const paymentsReceived = db.prepare(`
    SELECT payer_id, SUM(amount) as total
    FROM payments
    WHERE receiver_id = ? AND approval_status = 'approved'
    GROUP BY payer_id
  `).all(userId) as { payer_id: number; total: number }[];

  // Debts needing MY validation (I am either creditor or debtor, but didn't approve)
  const pendingDebtsForMe = db.prepare(`
    SELECT creditor_id, debtor_id, creator_id
    FROM debts
    WHERE approval_status = 'pending_approval'
      AND (
        (creditor_id = ? AND creditor_approved = 0) OR
        (debtor_id = ? AND debtor_approved = 0)
      )
  `).all(userId, userId) as { creditor_id: number; debtor_id: number; creator_id: number }[];

  // Debts created by me, waiting for friend
  const pendingDebtsByMe = db.prepare(`
    SELECT creditor_id, debtor_id
    FROM debts
    WHERE approval_status = 'pending_approval' AND creator_id = ?
  `).all(userId) as { creditor_id: number; debtor_id: number }[];

  // Payments needing MY validation
  const pendingPaymentsForMe = db.prepare(`
    SELECT payer_id, receiver_id, creator_id
    FROM payments
    WHERE approval_status = 'pending_approval'
      AND (
        (payer_id = ? AND payer_approved = 0) OR
        (receiver_id = ? AND receiver_approved = 0)
      )
  `).all(userId, userId) as { payer_id: number; receiver_id: number; creator_id: number }[];

  // Payments created by me, waiting for friend
  const pendingPaymentsByMe = db.prepare(`
    SELECT payer_id, receiver_id
    FROM payments
    WHERE approval_status = 'pending_approval' AND creator_id = ?
  `).all(userId) as { payer_id: number; receiver_id: number }[];

  const lentMap = new Map(lentDebts.map((r) => [r.debtor_id, r.total]));
  const borrowedMap = new Map(borrowedDebts.map((r) => [r.creditor_id, r.total]));
  const paidMap = new Map(paymentsMade.map((r) => [r.receiver_id, r.total]));
  const receivedMap = new Map(paymentsReceived.map((r) => [r.payer_id, r.total]));

  let totalNet = 0;
  const friendsBalances: FriendBalance[] = [];

  for (const friend of users) {
    const totalLent = lentMap.get(friend.id) || 0;
    const totalBorrowed = borrowedMap.get(friend.id) || 0;
    const totalPaidToFriend = paidMap.get(friend.id) || 0;
    const totalReceivedFromFriend = receivedMap.get(friend.id) || 0;

    // Net from my perspective:
    // Money I advanced (+) + Money I reimbursed friend (+) - Money friend advanced for me (-) - Money friend reimbursed me (-)
    const netBalance = Math.round((totalLent + totalPaidToFriend - totalBorrowed - totalReceivedFromFriend) * 100) / 100;

    // Count pending validations from this friend to me
    let pendingToValidateCount = 0;
    for (const d of pendingDebtsForMe) {
      if ((d.creditor_id === friend.id || d.debtor_id === friend.id) && d.creator_id === friend.id) {
        pendingToValidateCount++;
      }
    }
    for (const p of pendingPaymentsForMe) {
      if ((p.payer_id === friend.id || p.receiver_id === friend.id) && p.creator_id === friend.id) {
        pendingToValidateCount++;
      }
    }

    // Count pending validations waiting on friend
    let pendingAwaitingFriendCount = 0;
    for (const d of pendingDebtsByMe) {
      if (d.creditor_id === friend.id || d.debtor_id === friend.id) {
        pendingAwaitingFriendCount++;
      }
    }
    for (const p of pendingPaymentsByMe) {
      if (p.payer_id === friend.id || p.receiver_id === friend.id) {
        pendingAwaitingFriendCount++;
      }
    }

    totalNet += netBalance;
    friendsBalances.push({
      friendId: friend.id,
      friendName: friend.full_name,
      friendUsername: friend.username,
      avatar: friend.avatar,
      netBalance,
      totalLent,
      totalBorrowed,
      totalPaidToFriend,
      totalReceivedFromFriend,
      pendingToValidateCount,
      pendingAwaitingFriendCount
    });
  }

  // Sort friends: those with transactions or balances first, then alphabetically
  friendsBalances.sort((a, b) => {
    const aActive = a.netBalance !== 0 || a.pendingToValidateCount > 0 ? 1 : 0;
    const bActive = b.netBalance !== 0 || b.pendingToValidateCount > 0 ? 1 : 0;
    if (aActive !== bActive) return bActive - aActive;
    return a.friendName.localeCompare(b.friendName);
  });

  const pendingValidationsCount = pendingDebtsForMe.length + pendingPaymentsForMe.length;

  return {
    totalNet: Math.round(totalNet * 100) / 100,
    friendsBalances,
    pendingValidationsCount
  };
}

export function createDebt(data: {
  creatorId: number;
  creditorId: number;
  debtorId: number;
  amount: number;
  reason: string;
  categoryId?: number | null;
  notes?: string | null;
  dueDate?: string | null;
}): { success: boolean; debtId?: number; error?: string } {
  if (data.amount <= 0) {
    return { success: false, error: 'Le montant doit être supérieur à 0.' };
  }
  if (data.creditorId === data.debtorId) {
    return { success: false, error: 'Le payeur et le bénéficiaire doivent être différents.' };
  }

  // The creator auto-approves their own side
  const creditorApproved = data.creatorId === data.creditorId ? 1 : 0;
  const debtorApproved = data.creatorId === data.debtorId ? 1 : 0;
  const targetUserId = data.creatorId === data.creditorId ? data.debtorId : data.creditorId;

  const result = db.transaction(() => {
    const res = db.prepare(`
      INSERT INTO debts (
        creditor_id, debtor_id, creator_id, amount, reason,
        category_id, notes, due_date, status, paid_amount,
        approval_status, creditor_approved, debtor_approved
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', 0, 'pending_approval', ?, ?)
    `).run(
      data.creditorId,
      data.debtorId,
      data.creatorId,
      data.amount,
      data.reason.trim(),
      data.categoryId || null,
      data.notes || null,
      data.dueDate || null,
      creditorApproved,
      debtorApproved
    );

    const debtId = res.lastInsertRowid as number;

    const creator = getUserById(data.creatorId);
    const creatorName = creator ? creator.full_name : 'Un ami';

    // Notification for target user
    const actionDesc = data.creatorId === data.creditorId
      ? `${creatorName} indique avoir payé ${data.amount.toFixed(2)} € pour vous (${data.reason})`
      : `${creatorName} vous demande de valider une avance de ${data.amount.toFixed(2)} € (${data.reason})`;

    db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (?, 'DEBT_PENDING', 'Dépense à valider', ?, '/validations')
    `).run(targetUserId, actionDesc);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES (?, 'DEBT_CREATED', 'debt', ?, ?)
    `).run(
      data.creatorId,
      debtId,
      `Dette de ${data.amount.toFixed(2)} € soumise : #${data.debtorId} doit à #${data.creditorId} (Motif: ${data.reason})`
    );

    return debtId;
  })();

  return { success: true, debtId: result };
}

export function createPayment(data: {
  creatorId: number;
  payerId: number;
  receiverId: number;
  amount: number;
  reason?: string;
  paymentMethod?: string;
  debtId?: number | null;
  paymentDate?: string;
}): { success: boolean; paymentId?: number; error?: string } {
  if (data.amount <= 0) {
    return { success: false, error: 'Le montant doit être supérieur à 0.' };
  }
  if (data.payerId === data.receiverId) {
    return { success: false, error: 'Le payeur et le receveur doivent être différents.' };
  }

  const payerApproved = data.creatorId === data.payerId ? 1 : 0;
  const receiverApproved = data.creatorId === data.receiverId ? 1 : 0;
  const targetUserId = data.creatorId === data.payerId ? data.receiverId : data.payerId;
  const paymentDate = data.paymentDate || new Date().toISOString().slice(0, 10);
  const reason = data.reason?.trim() || 'Remboursement';
  const paymentMethod = data.paymentMethod || 'Espèces';

  const result = db.transaction(() => {
    const res = db.prepare(`
      INSERT INTO payments (
        payer_id, receiver_id, creator_id, amount,
        payment_method, reason, debt_id, payment_date,
        approval_status, payer_approved, receiver_approved
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval', ?, ?)
    `).run(
      data.payerId,
      data.receiverId,
      data.creatorId,
      data.amount,
      paymentMethod,
      reason,
      data.debtId || null,
      paymentDate,
      payerApproved,
      receiverApproved
    );

    const paymentId = res.lastInsertRowid as number;

    const creator = getUserById(data.creatorId);
    const creatorName = creator ? creator.full_name : 'Un ami';

    const notifMsg = data.creatorId === data.payerId
      ? `${creatorName} déclare vous avoir remboursé ${data.amount.toFixed(2)} € (${reason})`
      : `${creatorName} a enregistré un remboursement de ${data.amount.toFixed(2)} € de votre part`;

    db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (?, 'PAYMENT_PENDING', 'Remboursement à valider', ?, '/validations')
    `).run(targetUserId, notifMsg);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES (?, 'PAYMENT_RECORDED', 'payment', ?, ?)
    `).run(
      data.creatorId,
      paymentId,
      `Remboursement de ${data.amount.toFixed(2)} € soumis de #${data.payerId} vers #${data.receiverId} (Moyen: ${paymentMethod}, Motif: ${reason})`
    );

    return paymentId;
  })();

  return { success: true, paymentId: result };
}

export function validateTransaction(
  type: 'debt' | 'payment',
  id: number,
  userId: number
): { success: boolean; error?: string } {
  if (type === 'debt') {
    const debt = db.prepare('SELECT * FROM debts WHERE id = ?').get(id) as Debt | undefined;
    if (!debt) return { success: false, error: 'Dette introuvable.' };
    if (debt.creditor_id !== userId && debt.debtor_id !== userId) {
      return { success: false, error: 'Vous ne participez pas à cette transaction.' };
    }
    if (debt.approval_status !== 'pending_approval') {
      return { success: false, error: 'Cette transaction a déjà été traitée.' };
    }

    const now = new Date().toISOString();
    const isCreditor = debt.creditor_id === userId;
    const newCreditorApproved = isCreditor ? 1 : debt.creditor_approved;
    const newDebtorApproved = !isCreditor ? 1 : debt.debtor_approved;

    db.transaction(() => {
      db.prepare(`
        UPDATE debts
        SET creditor_approved = ?, debtor_approved = ?,
            approval_status = 'approved', approved_at = ?, updated_at = ?
        WHERE id = ?
      `).run(newCreditorApproved, newDebtorApproved, now, now, id);

      // Notify the creator if someone else validated
      if (debt.creator_id !== userId) {
        const user = getUserById(userId);
        db.prepare(`
          INSERT INTO notifications (user_id, type, title, message, link)
          VALUES (?, 'DEBT_APPROVED', 'Transaction validée !', ?, '/historique')
        `).run(
          debt.creator_id,
          `${user?.full_name || 'Votre ami'} a validé la dépense de ${debt.amount.toFixed(2)} € (${debt.reason}).`
        );
      }

      // Audit log
      db.prepare(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
        VALUES (?, 'DEBT_APPROVED', 'debt', ?, ?)
      `).run(userId, id, `Dette #${id} de ${debt.amount.toFixed(2)} € validée par l'utilisateur #${userId} (Motif: ${debt.reason})`);
    })();

    return { success: true };
  } else {
    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(id) as Payment | undefined;
    if (!payment) return { success: false, error: 'Remboursement introuvable.' };
    if (payment.payer_id !== userId && payment.receiver_id !== userId) {
      return { success: false, error: 'Vous ne participez pas à ce remboursement.' };
    }
    if (payment.approval_status !== 'pending_approval') {
      return { success: false, error: 'Ce remboursement a déjà été traité.' };
    }

    const now = new Date().toISOString();
    const isPayer = payment.payer_id === userId;
    const newPayerApproved = isPayer ? 1 : payment.payer_approved;
    const newReceiverApproved = !isPayer ? 1 : payment.receiver_approved;

    db.transaction(() => {
      db.prepare(`
        UPDATE payments
        SET payer_approved = ?, receiver_approved = ?,
            approval_status = 'approved', approved_at = ?
        WHERE id = ?
      `).run(newPayerApproved, newReceiverApproved, now, id);

      if (payment.creator_id !== userId) {
        const user = getUserById(userId);
        db.prepare(`
          INSERT INTO notifications (user_id, type, title, message, link)
          VALUES (?, 'PAYMENT_APPROVED', 'Remboursement validé !', ?, '/historique')
        `).run(
          payment.creator_id,
          `${user?.full_name || 'Votre ami'} a validé le remboursement de ${payment.amount.toFixed(2)} €.`
        );
      }

      db.prepare(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
        VALUES (?, 'PAYMENT_APPROVED', 'payment', ?, ?)
      `).run(userId, id, `Remboursement #${id} de ${payment.amount.toFixed(2)} € validé par #${userId}`);
    })();

    return { success: true };
  }
}

export function disputeTransaction(
  type: 'debt' | 'payment',
  id: number,
  userId: number,
  reason: string
): { success: boolean; error?: string } {
  if (!reason || !reason.trim()) {
    return { success: false, error: 'Le motif de contestation est obligatoire.' };
  }
  const cleanReason = reason.trim();
  const now = new Date().toISOString();

  if (type === 'debt') {
    const debt = db.prepare('SELECT * FROM debts WHERE id = ?').get(id) as Debt | undefined;
    if (!debt) return { success: false, error: 'Dette introuvable.' };
    if (debt.creditor_id !== userId && debt.debtor_id !== userId) {
      return { success: false, error: 'Vous ne participez pas à cette transaction.' };
    }

    db.transaction(() => {
      db.prepare(`
        UPDATE debts
        SET approval_status = 'disputed', dispute_reason = ?,
            disputed_by = ?, disputed_at = ?, updated_at = ?
        WHERE id = ?
      `).run(cleanReason, userId, now, now, id);

      // Notify creator
      const user = getUserById(userId);
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (?, 'DEBT_DISPUTED', 'Dépense contestée !', ?, '/historique')
      `).run(
        debt.creator_id,
        `${user?.full_name || 'Votre ami'} a contesté la dépense de ${debt.amount.toFixed(2)} €. Motif : "${cleanReason}"`
      );

      db.prepare(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
        VALUES (?, 'DEBT_DISPUTED', 'debt', ?, ?)
      `).run(userId, id, `Dette #${id} contestée par #${userId}. Raison: '${cleanReason}'`);
    })();

    return { success: true };
  } else {
    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(id) as Payment | undefined;
    if (!payment) return { success: false, error: 'Remboursement introuvable.' };
    if (payment.payer_id !== userId && payment.receiver_id !== userId) {
      return { success: false, error: 'Vous ne participez pas à ce remboursement.' };
    }

    db.transaction(() => {
      db.prepare(`
        UPDATE payments
        SET approval_status = 'disputed', dispute_reason = ?,
            disputed_by = ?, disputed_at = ?
        WHERE id = ?
      `).run(cleanReason, userId, now, id);

      const user = getUserById(userId);
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (?, 'PAYMENT_DISPUTED', 'Remboursement contesté !', ?, '/historique')
      `).run(
        payment.creator_id,
        `${user?.full_name || 'Votre ami'} a contesté le remboursement de ${payment.amount.toFixed(2)} €. Motif : "${cleanReason}"`
      );

      db.prepare(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
        VALUES (?, 'PAYMENT_DISPUTED', 'payment', ?, ?)
      `).run(userId, id, `Remboursement #${id} contesté par #${userId}. Raison: '${cleanReason}'`);
    })();

    return { success: true };
  }
}

export function getPendingValidationsForUser(userId: number): {
  debtsToValidate: Debt[];
  paymentsToValidate: Payment[];
  debtsWaitingOthers: Debt[];
  paymentsWaitingOthers: Payment[];
} {
  const debtsToValidate = db.prepare(`
    SELECT d.*,
           c.name as category_name, c.icon as category_icon, c.color as category_color,
           u_cred.full_name as creditor_name,
           u_debt.full_name as debtor_name,
           u_create.full_name as creator_name
    FROM debts d
    LEFT JOIN categories c ON d.category_id = c.id
    JOIN users u_cred ON d.creditor_id = u_cred.id
    JOIN users u_debt ON d.debtor_id = u_debt.id
    JOIN users u_create ON d.creator_id = u_create.id
    WHERE d.approval_status = 'pending_approval'
      AND (
        (d.creditor_id = ? AND d.creditor_approved = 0) OR
        (d.debtor_id = ? AND d.debtor_approved = 0)
      )
    ORDER BY d.created_at DESC
  `).all(userId, userId) as Debt[];

  const paymentsToValidate = db.prepare(`
    SELECT p.*,
           u_pay.full_name as payer_name,
           u_rec.full_name as receiver_name,
           u_create.full_name as creator_name
    FROM payments p
    JOIN users u_pay ON p.payer_id = u_pay.id
    JOIN users u_rec ON p.receiver_id = u_rec.id
    JOIN users u_create ON p.creator_id = u_create.id
    WHERE p.approval_status = 'pending_approval'
      AND (
        (p.payer_id = ? AND p.payer_approved = 0) OR
        (p.receiver_id = ? AND p.receiver_approved = 0)
      )
    ORDER BY p.created_at DESC
  `).all(userId, userId) as Payment[];

  const debtsWaitingOthers = db.prepare(`
    SELECT d.*,
           c.name as category_name, c.icon as category_icon, c.color as category_color,
           u_cred.full_name as creditor_name,
           u_debt.full_name as debtor_name,
           u_create.full_name as creator_name
    FROM debts d
    LEFT JOIN categories c ON d.category_id = c.id
    JOIN users u_cred ON d.creditor_id = u_cred.id
    JOIN users u_debt ON d.debtor_id = u_debt.id
    JOIN users u_create ON d.creator_id = u_create.id
    WHERE d.approval_status = 'pending_approval'
      AND d.creator_id = ?
    ORDER BY d.created_at DESC
  `).all(userId) as Debt[];

  const paymentsWaitingOthers = db.prepare(`
    SELECT p.*,
           u_pay.full_name as payer_name,
           u_rec.full_name as receiver_name,
           u_create.full_name as creator_name
    FROM payments p
    JOIN users u_pay ON p.payer_id = u_pay.id
    JOIN users u_rec ON p.receiver_id = u_rec.id
    JOIN users u_create ON p.creator_id = u_create.id
    WHERE p.approval_status = 'pending_approval'
      AND p.creator_id = ?
    ORDER BY p.created_at DESC
  `).all(userId) as Payment[];

  return {
    debtsToValidate,
    paymentsToValidate,
    debtsWaitingOthers,
    paymentsWaitingOthers
  };
}

export function getNotificationsForUser(userId: number, limit = 50): AppNotification[] {
  return db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(userId, limit) as AppNotification[];
}

export function markNotificationsRead(userId: number): void {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
}

export function getAuditLogs(limit = 100): any[] {
  return db.prepare(`
    SELECT a.*, u.full_name, u.username
    FROM audit_logs a
    JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
    LIMIT ?
  `).all(limit);
}

export function logAudit(userId: number, action: string, entityType: string, entityId: number | null, details: string) {
  db.prepare(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, action, entityType, entityId, details);
}

