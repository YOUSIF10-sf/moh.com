/**
 * AppContext.tsx
 * مركز إدارة الحالة العالمي — يُغني عن API calls متكررة
 * ويوفر Cache ذكي + Toast System + بيانات المستخدم في كل مكان
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { StorageService, type Product, type User } from '@/services/storage';

// ─── Toast Types ─────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

// ─── Context Shape ────────────────────────────────────────────────────────────

interface AppContextValue {
  // Auth
  user: User | null;
  authLoading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;

  // Products Cache
  products: Product[];
  productsLoading: boolean;
  refreshProducts: () => Promise<void>;

  // Toast
  showToast: (message: string, type?: ToastType) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

// ─── Toast Component ──────────────────────────────────────────────────────────

const TOAST_COLORS: Record<ToastType, string> = {
  success: '#34C759',
  error:   '#FF3B30',
  info:    '#007AFF',
  warning: '#FF9500',
};

const ToastItem = ({ toast, onDone }: { toast: ToastMessage; onDone: () => void }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.delay(2400),
      Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(onDone);
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-80, 0] });

  return (
    <Animated.View
      style={[
        toastStyles.container,
        { borderLeftColor: TOAST_COLORS[toast.type], opacity: anim, transform: [{ translateY }] },
      ]}
    >
      <View style={[toastStyles.dot, { backgroundColor: TOAST_COLORS[toast.type] }]} />
      <Text style={toastStyles.text}>{toast.message}</Text>
    </Animated.View>
  );
};

const toastStyles = StyleSheet.create({
  container: {
    backgroundColor: '#1d1d1f',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderLeftWidth: 4,
    maxWidth: 360,
    alignSelf: 'center',
    width: '90%',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 8px 30px rgba(0,0,0,0.25)' } as any)
      : { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, elevation: 10 }),
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { color: '#fff', fontFamily: 'Cairo', fontSize: 14, flex: 1, textAlign: 'right' },
});

// ─── Provider ─────────────────────────────────────────────────────────────────

let _toastId = 0;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]                   = useState<User | null>(null);
  const [authLoading, setAuthLoading]     = useState(true);
  const [products, setProducts]           = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [toasts, setToasts]               = useState<ToastMessage[]>([]);

  // ── Auth ──────────────────────────────────────────────────────────────────

  const refreshUser = useCallback(async () => {
    try {
      const session = await StorageService.getSession();
      setUser(session);
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const logout = useCallback(async () => {
    await StorageService.logout();
    setUser(null);
    setProducts([]);
    router.replace('/login');
  }, []);

  // ── Products ─────────────────────────────────────────────────────────────

  const refreshProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const data = await StorageService.getProducts();
      setProducts(data);
    } catch (e: any) {
      showToast(e.message || 'فشل تحميل المنتجات', 'error');
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // ── Toast ─────────────────────────────────────────────────────────────────

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <AppContext.Provider
      value={{ user, authLoading, logout, refreshUser, products, productsLoading, refreshProducts, showToast }}
    >
      {children}

      {/* Global Toast Layer */}
      <View style={overlayStyles.toastStack} pointerEvents="none">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDone={() => removeToast(t.id)} />
        ))}
      </View>
    </AppContext.Provider>
  );
}

const overlayStyles = StyleSheet.create({
  toastStack: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
  },
});

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside <AppProvider>');
  return ctx;
}

// ─── Convenience hooks ────────────────────────────────────────────────────────

export const useUser       = () => { const { user, authLoading, logout, refreshUser } = useAppContext(); return { user, loading: authLoading, logout, refreshUser }; };
export const useProducts   = () => { const { products, productsLoading, refreshProducts } = useAppContext(); return { products, loading: productsLoading, refresh: refreshProducts }; };
export const useToast      = () => useAppContext().showToast;
