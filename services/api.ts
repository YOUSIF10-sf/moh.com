import { Platform } from 'react-native';
import { StorageService } from './storage';

// Set this to your real API URL to enable sync (e.g. Supabase or Custom API)
// If empty, it stays in "Standalone Mode" (Local Storage Only)
const REAL_API_URL = '';

const isWeb = Platform.OS === 'web';
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getApiClient = async () => {
  if (REAL_API_URL) {
    // Future: Implement real Axios/Fetch client here
    // return axios.create({ baseURL: REAL_API_URL });
  }

  const wrapError = (msg: string) => {
    const err = new Error(msg) as any;
    err.response = { data: { error: msg } };
    return err;
  };

  // Standalone Mock Client (Current)
  return {
    get: async (url: string) => {
      try {
        await delay(isWeb ? 200 : 500);
        if (url === '/api/products') return { data: await StorageService.getProducts() };
        if (url === '/api/stats') return { data: await StorageService.getStats() };
        if (url === '/api/logs/all') return { data: await StorageService.getLogs() };
        if (url === '/api/logs/user') {
          const session = await StorageService.getSession();
          return { data: await StorageService.getLogs(session?.username || '') };
        }
        if (url === '/api/users') return { data: await StorageService.getUsers() };
        if (url === '/api/session') return { data: await StorageService.getSession() };
        throw wrapError('404 Not Found');
      } catch (e: any) {
        if (e.response) throw e;
        throw wrapError(e.message);
      }
    },
    post: async (url: string, payload: any) => {
      try {
        await delay(isWeb ? 300 : 800);
        if (url === '/api/login') return { data: await StorageService.login(payload.username, payload.password) };
        if (url === '/api/logout') return { data: await StorageService.logout() };
        if (url === '/api/user/password' || url === '/api/users/change-password') {
          const session = await StorageService.getSession();
          if (session) {
            // If it's a change password request, verify old password first
            if (payload.oldPassword) {
              const isValid = await StorageService.verifyPassword(session.id, payload.oldPassword);
              if (!isValid) throw wrapError('كلمة المرور الحالية غير صحيحة');
            }
            const passwordToSet = payload.newPassword || payload.password;
            await StorageService.changePassword(session.id, passwordToSet);
          }
          return { data: { success: true } };
        }
        if (url === '/api/user/update') {
          const session = await StorageService.getSession();
          if (session) await StorageService.updateUser(session.id, payload);
          return { data: { success: true } };
        }
        if (url === '/api/products') return { data: await StorageService.addProduct(payload) };
        if (url.startsWith('/api/withdraw/')) {
          const id = parseInt(url.split('/').pop() || '0');
          return { data: await StorageService.withdraw(id, payload.quantity, payload.note) };
        }
        if (url.startsWith('/api/logs/') && !url.endsWith('/all') && !url.endsWith('/user')) {
          const id = parseInt(url.split('/').pop() || '0');
          if (!isNaN(id)) {
            await StorageService.updateLog(id, payload);
            return { data: { success: true } };
          }
        }
        if (url === '/api/users') return { data: await StorageService.addUser(payload) };
        if (url === '/api/recover/verify-user') {
          const user = await StorageService.getUserByUsername(payload.username);
          if (!user) throw wrapError('اسم المستخدم غير موجود');
          return { data: { security_question: user.security_question || 'ما هو اسم صديقك المقرب؟' } };
        }
        if (url === '/api/recover') {
          const user = await StorageService.verifyRecovery(payload.username, payload.answer);
          if (!user) throw wrapError('إجابة سؤال الأمان غير صحيحة');
          
          if (payload.newPassword) {
            await StorageService.changePassword(user.id, payload.newPassword);
          }
          return { data: { success: true } };
        }
        throw wrapError('404 Not Found');
      } catch (e: any) {
        if (e.response) throw e;
        throw wrapError(e.message);
      }
    },
    put: async (url: string, payload: any) => {
      try {
        await delay(isWeb ? 300 : 800);
        if (url.startsWith('/api/products/')) {
          const id = parseInt(url.split('/').pop() || '0');
          await StorageService.updateProduct(id, payload);
          return { data: { success: true } };
        }
        if (url.startsWith('/api/users/')) {
          const id = parseInt(url.split('/').pop() || '0');
          await StorageService.updateUser(id, payload);
          return { data: { success: true } };
        }
        throw wrapError('404 Not Found');
      } catch (e: any) {
        if (e.response) throw e;
        throw wrapError(e.message);
      }
    },
    delete: async (url: string) => {
      try {
        await delay(isWeb ? 300 : 800);
        if (url.startsWith('/api/products/')) {
          const id = parseInt(url.split('/').pop() || '0');
          await StorageService.deleteProduct(id);
          return { data: { success: true } };
        }
        if (url.startsWith('/api/users/')) {
          const id = parseInt(url.split('/').pop() || '0');
          await StorageService.deleteUser(id);
          return { data: { success: true } };
        }
        if (url.startsWith('/api/logs/')) {
          const id = parseInt(url.split('/').pop() || '0');
          await StorageService.deleteLog(id);
          return { data: { success: true } };
        }
        throw wrapError('404 Not Found');
      } catch (e: any) {
        if (e.response) throw e;
        throw wrapError(e.message);
      }
    }
  };
};

export const saveServerUrl = async (url: string) => { };
export const getServerUrl = async () => REAL_API_URL || 'Standalone Mode';
