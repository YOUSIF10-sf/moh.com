/**
 * use-auth.ts
 * الآن مجرد wrapper خفيف حول AppContext — لا API calls، لا تكرار.
 * يُستخدم في أي مكون يحتاج بيانات المستخدم.
 */
export { useUser as useAuth } from '@/context/AppContext';
