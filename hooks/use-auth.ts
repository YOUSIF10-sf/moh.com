import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { getApiClient } from '../services/api';

interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const api = await getApiClient();
      const response = await api.get('/api/session');
      setUser(response.data as User);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const api = await getApiClient();
      await api.post('/api/logout', {});
    } catch (error) {
      console.error('Logout error:', error);
      // فقط في حال فشل طلب الخادم نوضح للمستخدم أننا سنقوم بخروج محلي فقط
    }

    // دائماً نقوم بإزالة الجلسة المحلية وإعادة التوجيه بعد محاولة الخروج
    await AsyncStorage.removeItem('mstore_auth_user');
    setUser(null);
    router.replace('/login');
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return { user, loading, logout, refreshUser: fetchUser };
}
