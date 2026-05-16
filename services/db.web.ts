/**
 * db.ts — Web Platform
 * يستخدم @libsql/client/web للمتصفح (WebSockets/HTTP).
 */
import { createClient } from '@libsql/client/web';

const DATABASE_URL   = process.env.EXPO_PUBLIC_DATABASE_URL   ?? '';
const DATABASE_TOKEN = process.env.EXPO_PUBLIC_DATABASE_TOKEN ?? '';

if (!DATABASE_URL || !DATABASE_TOKEN) {
  console.error('[Turso] ⚠️  EXPO_PUBLIC_DATABASE_URL أو EXPO_PUBLIC_DATABASE_TOKEN مفقود من ملف .env');
}

export const db = createClient({
  url:       DATABASE_URL,
  authToken: DATABASE_TOKEN,
});
