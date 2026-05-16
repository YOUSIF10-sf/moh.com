/**
 * storage.ts
 * طبقة البيانات الكاملة — تتصل حصرياً بـ Turso (libsql).
 * الجلسة مخزنة محلياً في AsyncStorage (خفيفة وبدون اتصال).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './db';

// ─── Hash ────────────────────────────────────────────────────────────────────

async function hashPassword(password: string): Promise<string> {
  const msg = password + 'mstore_salt_2024';
  let hash = 5381;
  for (let i = 0; i < msg.length; i++) {
    hash = ((hash << 5) + hash) + msg.charCodeAt(i);
    hash = hash & hash;
  }
  return `v1_${Math.abs(hash).toString(16).padStart(8, '0')}_sec`;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SESSION_KEY = 'mstore_auth_user';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Product {
  id: number;
  name: string;
  current_quantity: number;
  original_quantity: number;
  image_url: string;
  created_at?: string;
}

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
  security_question?: string;
  security_answer?: string;
  password?: string;
  created_at?: string;
}

export interface Log {
  id: number;
  product_name: string;
  quantity: number;
  note: string;
  employee_name: string;
  created_at: string;
  username: string;
}

// ─── Database Initialization ─────────────────────────────────────────────────

export const initStorage = async (): Promise<void> => {
  try {
    // Create tables
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        username          TEXT UNIQUE NOT NULL,
        full_name         TEXT NOT NULL DEFAULT '',
        role              TEXT NOT NULL DEFAULT 'employee',
        password          TEXT NOT NULL DEFAULT '',
        security_question TEXT DEFAULT 'ما هو اسم صديقك المقرب؟',
        security_answer   TEXT DEFAULT '',
        created_at        TEXT DEFAULT ''
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        name              TEXT NOT NULL DEFAULT '',
        original_quantity INTEGER NOT NULL DEFAULT 0,
        current_quantity  INTEGER NOT NULL DEFAULT 0,
        image_url         TEXT DEFAULT '',
        created_at        TEXT DEFAULT ''
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS logs (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        product_name  TEXT NOT NULL DEFAULT '',
        quantity      INTEGER NOT NULL DEFAULT 0,
        note          TEXT DEFAULT '',
        employee_name TEXT DEFAULT '',
        username      TEXT DEFAULT '',
        created_at    TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migration: ensure security_question column exists (for older databases)
    try {
      const tableInfo = await db.execute('PRAGMA table_info(users)');
      const hasSecQ = tableInfo.rows.some((r: any) => r.name === 'security_question');
      if (!hasSecQ) {
        await db.execute(
          "ALTER TABLE users ADD COLUMN security_question TEXT DEFAULT 'ما هو اسم صديقك المقرب؟'"
        );
      }
    } catch {
      // Ignore — PRAGMA not critical on all environments
    }

    // Seed admin user
    const adminCheck = await db.execute({
      sql: 'SELECT id FROM users WHERE username = ?',
      args: ['admin'],
    });

    const hashedAdmin = await hashPassword('admin123');
    const now = new Date().toISOString();

    if (adminCheck.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO users
              (username, full_name, role, password, security_question, security_answer, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: ['admin', 'المسؤول الرئيسي', 'admin', hashedAdmin, 'ما هو اسم صديقك المقرب؟', 'العنزي', now],
      });
    } else {
      // Keep admin password in sync with hash algorithm
      await db.execute({
        sql: `UPDATE users
              SET password = ?, full_name = ?
              WHERE username = 'admin'`,
        args: [hashedAdmin, 'المسؤول الرئيسي'],
      });
    }
  } catch (error) {
    console.error('[Turso] initStorage failed:', error);
    throw error;
  }
};

// ─── Storage Service ─────────────────────────────────────────────────────────

export const StorageService = {

  // ── Auth ───────────────────────────────────────────────────────────────────

  login: async (username: string, password: string): Promise<User> => {
    const cleanUser = username.trim().toLowerCase();
    const hashed    = await hashPassword(password.trim());

    // Try hashed password first
    let res = await db.execute({
      sql: 'SELECT id, username, full_name, role FROM users WHERE username = ? AND password = ?',
      args: [cleanUser, hashed],
    });

    if (res.rows.length > 0) {
      const user = res.rows[0] as unknown as User;
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user;
    }

    // Legacy plain-text migration
    const legacy = await db.execute({
      sql: 'SELECT id, username, full_name, role FROM users WHERE username = ? AND password = ?',
      args: [cleanUser, password.trim()],
    });

    if (legacy.rows.length > 0) {
      const user = legacy.rows[0] as unknown as User;
      // Upgrade to hashed password
      await db.execute({ sql: 'UPDATE users SET password = ? WHERE id = ?', args: [hashed, user.id] });
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user;
    }

    throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
  },

  getSession: async (): Promise<User | null> => {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  },

  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem(SESSION_KEY);
  },

  // ── Products ───────────────────────────────────────────────────────────────

  getProducts: async (): Promise<Product[]> => {
    const res = await db.execute('SELECT * FROM products ORDER BY id DESC');
    return res.rows as unknown as Product[];
  },

  addProduct: async (product: Partial<Product>): Promise<Product> => {
    const session = await StorageService.getSession();
    if (session?.role !== 'admin') throw new Error('غير مصرح لك بإضافة منتجات');

    const now = new Date().toISOString();
    const qty = Math.max(0, product.original_quantity || 0);

    const res = await db.execute({
      sql: `INSERT INTO products (name, original_quantity, current_quantity, image_url, created_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [product.name?.trim() || '', qty, qty, product.image_url?.trim() || '', now],
    });

    return { ...product, id: Number(res.lastInsertRowid), created_at: now } as Product;
  },

  updateProduct: async (id: number, updates: Partial<Product>): Promise<void> => {
    const sets: string[] = [];
    const args: any[] = [];

    if (updates.name              !== undefined) { sets.push('name = ?');              args.push(updates.name); }
    if (updates.original_quantity !== undefined) { sets.push('original_quantity = ?'); args.push(updates.original_quantity); }
    if (updates.current_quantity  !== undefined) { sets.push('current_quantity = ?');  args.push(updates.current_quantity); }
    if (updates.image_url         !== undefined) { sets.push('image_url = ?');         args.push(updates.image_url); }

    if (sets.length === 0) return;
    args.push(id);

    await db.execute({ sql: `UPDATE products SET ${sets.join(', ')} WHERE id = ?`, args });
  },

  deleteProduct: async (id: number): Promise<void> => {
    await db.execute({ sql: 'DELETE FROM products WHERE id = ?', args: [id] });
  },

  // ── Withdrawals ────────────────────────────────────────────────────────────

  withdraw: async (productId: number, quantity: number, note: string): Promise<true> => {
    const session = await StorageService.getSession();

    const pRes = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [productId] });
    if (pRes.rows.length === 0) throw new Error('المنتج غير موجود');

    const product = pRes.rows[0] as unknown as Product;
    if (product.current_quantity < quantity) throw new Error('الكمية المطلوبة غير متوفرة في المخزن');

    await db.batch([
      {
        sql: 'UPDATE products SET current_quantity = current_quantity - ? WHERE id = ?',
        args: [quantity, productId],
      },
      {
        sql: `INSERT INTO logs (product_name, quantity, note, employee_name, username)
              VALUES (?, ?, ?, ?, ?)`,
        args: [product.name, quantity, note, session?.full_name || 'غير معروف', session?.username || ''],
      },
    ], 'write');

    return true;
  },

  // ── Logs ───────────────────────────────────────────────────────────────────

  getLogs: async (username?: string): Promise<Log[]> => {
    const sql  = username
      ? 'SELECT * FROM logs WHERE username = ? ORDER BY created_at DESC'
      : 'SELECT * FROM logs ORDER BY created_at DESC';
    const args = username ? [username] : [];

    const res = await db.execute({ sql, args });
    return res.rows as unknown as Log[];
  },

  updateLog: async (id: number, updates: Partial<Log>): Promise<void> => {
    const sets: string[] = [];
    const args: any[] = [];

    if (updates.note     !== undefined) { sets.push('note = ?');     args.push(updates.note); }
    if (updates.quantity !== undefined) { sets.push('quantity = ?'); args.push(updates.quantity); }

    if (sets.length === 0) return;
    args.push(id);

    await db.execute({ sql: `UPDATE logs SET ${sets.join(', ')} WHERE id = ?`, args });
  },

  deleteLog: async (id: number): Promise<void> => {
    const logRes = await db.execute({
      sql: 'SELECT product_name, quantity FROM logs WHERE id = ?',
      args: [id],
    });
    if (logRes.rows.length === 0) throw new Error('عملية السحب غير موجودة');

    const log = logRes.rows[0] as unknown as { product_name: string; quantity: number };

    await db.batch([
      {
        sql: 'UPDATE products SET current_quantity = current_quantity + ? WHERE name = ?',
        args: [Number(log.quantity || 0), log.product_name],
      },
      {
        sql: 'DELETE FROM logs WHERE id = ?',
        args: [id],
      },
    ], 'write');
  },

  // ── Users ──────────────────────────────────────────────────────────────────

  getUsers: async (): Promise<User[]> => {
    const res = await db.execute(
      'SELECT id, username, full_name, role, created_at FROM users ORDER BY id DESC'
    );
    return res.rows as unknown as User[];
  },

  getUserByUsername: async (username: string): Promise<User | null> => {
    const res = await db.execute({
      sql: 'SELECT id, username, full_name, role, security_question FROM users WHERE username = ?',
      args: [username.trim().toLowerCase()],
    });
    return res.rows.length > 0 ? (res.rows[0] as unknown as User) : null;
  },

  addUser: async (user: Partial<User>): Promise<User> => {
    const session = await StorageService.getSession();
    if (session?.role !== 'admin') throw new Error('غير مصرح لك بإضافة مستخدمين');

    const cleanUsername = user.username?.trim().toLowerCase() || '';
    const hashed        = await hashPassword(user.password?.trim() || '123');
    const now           = new Date().toISOString();

    const res = await db.execute({
      sql: `INSERT INTO users
            (username, full_name, role, password, security_question, security_answer, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        cleanUsername,
        user.full_name?.trim() || '',
        user.role || 'employee',
        hashed,
        user.security_question || '',
        user.security_answer?.trim() || '',
        now,
      ],
    });

    return {
      id: Number(res.lastInsertRowid),
      username: cleanUsername,
      full_name: user.full_name || '',
      role: user.role || 'employee',
      created_at: now,
    };
  },

  changePassword: async (userId: number, newPass: string): Promise<void> => {
    const hashed = await hashPassword(newPass.trim());
    await db.execute({ sql: 'UPDATE users SET password = ? WHERE id = ?', args: [hashed, userId] });
  },

  verifyPassword: async (userId: number, password: string): Promise<boolean> => {
    const hashed = await hashPassword(password.trim());
    const res = await db.execute({
      sql: 'SELECT id FROM users WHERE id = ? AND password = ?',
      args: [userId, hashed],
    });
    return res.rows.length > 0;
  },

  updateUser: async (id: number, updates: Partial<User>): Promise<void> => {
    const sets: string[] = [];
    const args: any[] = [];

    if (updates.full_name         !== undefined) { sets.push('full_name = ?');         args.push(updates.full_name); }
    if (updates.username          !== undefined) { sets.push('username = ?');           args.push(updates.username); }
    if (updates.role              !== undefined) { sets.push('role = ?');               args.push(updates.role); }
    if (updates.security_question !== undefined) { sets.push('security_question = ?'); args.push(updates.security_question); }
    if (updates.security_answer   !== undefined) { sets.push('security_answer = ?');   args.push(updates.security_answer); }
    if (updates.password          !== undefined) {
      sets.push('password = ?');
      args.push(await hashPassword(updates.password.trim()));
    }

    if (sets.length === 0) return;
    args.push(id);

    await db.execute({ sql: `UPDATE users SET ${sets.join(', ')} WHERE id = ?`, args });

    // Sync local session if editing self
    const session = await StorageService.getSession();
    if (session && session.id === id) {
      const updated = { ...session, ...updates };
      delete (updated as any).password;
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    }
  },

  deleteUser: async (id: number): Promise<void> => {
    await db.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [id] });
  },

  verifyRecovery: async (username: string, answer: string): Promise<User> => {
    const res = await db.execute({
      sql: `SELECT id, username, full_name, role, security_question
            FROM users WHERE username = ? AND security_answer = ?`,
      args: [username.trim().toLowerCase(), answer.trim()],
    });

    if (res.rows.length === 0) throw new Error('اسم المستخدم أو إجابة سؤال الأمان غير صحيحة');

    const user = res.rows[0] as unknown as User;
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  // ── Stats ──────────────────────────────────────────────────────────────────

  getStats: async () => {
    const [pRes, logRes] = await Promise.all([
      db.execute(
        'SELECT COUNT(*) as total, SUM(CASE WHEN current_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock FROM products'
      ),
      db.execute(
        'SELECT product_name, SUM(quantity) as withdrawals FROM logs GROUP BY product_name ORDER BY withdrawals DESC LIMIT 5'
      ),
    ]);

    const total      = Number(pRes.rows[0]?.total       ?? 0);
    const outOfStock = Number(pRes.rows[0]?.out_of_stock ?? 0);
    const health     = total > 0 ? Math.round(((total - outOfStock) / total) * 100) : 100;

    return {
      total_products:   total,
      out_of_stock:     outOfStock,
      inventory_health: health,
      top_products: logRes.rows.map((r: any) => ({
        name:        String(r.product_name || 'غير معروف'),
        withdrawals: Number(r.withdrawals  || 0),
      })),
    };
  },
};
