/**
 * api.ts
 * طبقة API تتصل مباشرة بـ Turso عبر StorageService.
 * لا يوجد mock، لا يوجد supabase، لا يوجد قاعدة بيانات قديمة.
 */
import { StorageService } from './storage';

const wrapError = (msg: string) => {
  const err = new Error(msg) as any;
  err.response = { data: { error: msg } };
  return err;
};

const safeRun = async <T>(fn: () => Promise<T>): Promise<{ data: T }> => {
  try {
    return { data: await fn() };
  } catch (e: any) {
    if (e.response) throw e;
    throw wrapError(e.message || 'حدث خطأ غير متوقع');
  }
};

export const getApiClient = async () => ({
  get: async (url: string) => {
    if (url === '/api/products')       return safeRun(() => StorageService.getProducts());
    if (url === '/api/stats')          return safeRun(() => StorageService.getStats());
    if (url === '/api/logs/all')       return safeRun(() => StorageService.getLogs());
    if (url === '/api/logs/user') {
      const session = await StorageService.getSession();
      return safeRun(() => StorageService.getLogs(session?.username || ''));
    }
    if (url === '/api/users')          return safeRun(() => StorageService.getUsers());
    if (url === '/api/session')        return safeRun(() => StorageService.getSession() as any);
    throw wrapError(`GET ${url} - 404 Not Found`);
  },

  post: async (url: string, payload: any) => {
    if (url === '/api/login')
      return safeRun(() => StorageService.login(payload.username, payload.password));

    if (url === '/api/logout')
      return safeRun(() => StorageService.logout() as any);

    if (url === '/api/user/password' || url === '/api/users/change-password') {
      return safeRun(async () => {
        const session = await StorageService.getSession();
        if (!session) throw new Error('لا توجد جلسة نشطة');
        if (payload.oldPassword) {
          const valid = await StorageService.verifyPassword(session.id, payload.oldPassword);
          if (!valid) throw new Error('كلمة المرور الحالية غير صحيحة');
        }
        await StorageService.changePassword(session.id, payload.newPassword || payload.password);
        return { success: true };
      });
    }

    if (url === '/api/user/update') {
      return safeRun(async () => {
        const session = await StorageService.getSession();
        if (session) await StorageService.updateUser(session.id, payload);
        return { success: true };
      });
    }

    if (url === '/api/products')
      return safeRun(() => StorageService.addProduct(payload));

    if (url.startsWith('/api/withdraw/')) {
      const id = parseInt(url.split('/').pop() || '0');
      return safeRun(() => StorageService.withdraw(id, payload.quantity, payload.note));
    }

    if (url.startsWith('/api/logs/') && !url.endsWith('/all') && !url.endsWith('/user')) {
      const id = parseInt(url.split('/').pop() || '0');
      if (!isNaN(id)) return safeRun(async () => { await StorageService.updateLog(id, payload); return { success: true }; });
    }

    if (url === '/api/users')
      return safeRun(() => StorageService.addUser(payload));

    if (url === '/api/recover/verify-user') {
      return safeRun(async () => {
        const user = await StorageService.getUserByUsername(payload.username);
        if (!user) throw new Error('اسم المستخدم غير موجود');
        return { security_question: user.security_question || 'ما هو اسم صديقك المقرب؟' };
      });
    }

    if (url === '/api/recover') {
      return safeRun(async () => {
        const user = await StorageService.verifyRecovery(payload.username, payload.answer);
        if (payload.newPassword) await StorageService.changePassword(user.id, payload.newPassword);
        return { success: true };
      });
    }

    throw wrapError(`POST ${url} - 404 Not Found`);
  },

  put: async (url: string, payload: any) => {
    if (url.startsWith('/api/products/')) {
      const id = parseInt(url.split('/').pop() || '0');
      return safeRun(async () => { await StorageService.updateProduct(id, payload); return { success: true }; });
    }
    if (url.startsWith('/api/users/')) {
      const id = parseInt(url.split('/').pop() || '0');
      return safeRun(async () => { await StorageService.updateUser(id, payload); return { success: true }; });
    }
    throw wrapError(`PUT ${url} - 404 Not Found`);
  },

  delete: async (url: string) => {
    if (url.startsWith('/api/products/')) {
      const id = parseInt(url.split('/').pop() || '0');
      return safeRun(async () => { await StorageService.deleteProduct(id); return { success: true }; });
    }
    if (url.startsWith('/api/users/')) {
      const id = parseInt(url.split('/').pop() || '0');
      return safeRun(async () => { await StorageService.deleteUser(id); return { success: true }; });
    }
    if (url.startsWith('/api/logs/')) {
      const id = parseInt(url.split('/').pop() || '0');
      return safeRun(async () => { await StorageService.deleteLog(id); return { success: true }; });
    }
    throw wrapError(`DELETE ${url} - 404 Not Found`);
  },
});

/** للتوافق مع أي مكان يستخدم هذه الدوال القديمة */
export const saveServerUrl = async (_url: string) => {};
export const getServerUrl = async () => process.env.EXPO_PUBLIC_DATABASE_URL || 'Turso';
