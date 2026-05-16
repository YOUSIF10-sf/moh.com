/**
 * db.ts — Native Platform (iOS / Android)
 * يستخدم @libsql/client/http للاتصال عبر HTTP.
 */
import { createClient } from '@libsql/client/http';

const DATABASE_URL   = process.env.EXPO_PUBLIC_DATABASE_URL   ?? '';
const DATABASE_TOKEN = process.env.EXPO_PUBLIC_DATABASE_TOKEN ?? '';

if (!DATABASE_URL || !DATABASE_TOKEN) {
  console.error('[Turso] ⚠️  EXPO_PUBLIC_DATABASE_URL أو EXPO_PUBLIC_DATABASE_TOKEN مفقود من ملف .env');
}

export const db = DATABASE_URL ? createClient({
  url:       DATABASE_URL,
  authToken: DATABASE_TOKEN,
}) : null as any;
