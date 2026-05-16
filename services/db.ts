import { createClient } from '@libsql/client/web';

// Replace these placeholders with your new database credentials
const DATABASE_URL = process.env.EXPO_PUBLIC_DATABASE_URL || 'libsql://your-database-url.turso.io';
const DATABASE_TOKEN = process.env.EXPO_PUBLIC_DATABASE_TOKEN || 'your-auth-token-here';

export const db = createClient({
  url: DATABASE_URL,
  authToken: DATABASE_TOKEN,
});
