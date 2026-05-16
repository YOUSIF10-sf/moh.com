import { Stack, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { initStorage } from '@/services/storage';
import { View, ActivityIndicator, I18nManager, Modal, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { AppProvider, useUser } from '@/context/AppContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Prevent React Native from automatically mirroring layouts on Arabic devices
// because we already manually handle RTL using 'row-reverse'.
try {
  I18nManager.allowRTL(false);
  I18nManager.forceRTL(false);
} catch (e) {}

SplashScreen.preventAutoHideAsync();

// ─── Inner navigator (reads from AppContext) ──────────────────────────────────

function RootNavigator() {
  const { user, loading: authLoading, logout } = useUser();
  const [appIsReady, setAppIsReady] = useState(false);
  const [showInactivity, setShowInactivity] = useState(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const resetTimer = React.useCallback(() => {
    if (showInactivity) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (user) {
      // 10 minutes = 10 * 60 * 1000 = 600000 ms
      timerRef.current = setTimeout(() => {
        setShowInactivity(true);
      }, 600000);
    }
  }, [showInactivity, user]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleWebActivity = () => resetTimer();
      window.addEventListener('mousemove', handleWebActivity);
      window.addEventListener('keydown', handleWebActivity);
      window.addEventListener('click', handleWebActivity);
      return () => {
        window.removeEventListener('mousemove', handleWebActivity);
        window.removeEventListener('keydown', handleWebActivity);
        window.removeEventListener('click', handleWebActivity);
      };
    }
  }, [resetTimer]);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({
          'Cairo':          require('../assets/fonts/Cairo-Regular.ttf'),
          'CairoBold':      require('../assets/fonts/Cairo-Bold.ttf'),
          'CairoExtraBold': require('../assets/fonts/Cairo-ExtraBold.ttf'),
        });
        await initStorage();
        await new Promise(resolve => setTimeout(resolve, 400));
      } catch (e) {
        console.warn('[App] Initialization warning:', e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady && !authLoading) {
      router.replace(user ? '/(tabs)' : '/login');
    }
  }, [user, authLoading, appIsReady]);

  if (!appIsReady || authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const handleRefreshSession = async () => {
    setShowInactivity(false);
    if (logout) await logout();
  };

  return (
    <View style={{ flex: 1 }} onTouchStart={resetTimer}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      </Stack>

      <Modal visible={showInactivity} transparent animationType="fade">
        <View style={inactivityStyles.overlay}>
          <View style={inactivityStyles.card}>
            <Text style={inactivityStyles.title}>انتهت الجلسة</Text>
            <Text style={inactivityStyles.subtitle}>لقد مرت 10 دقائق بدون نشاط. لحماية بياناتك، يرجى تحديث الصفحة لبدء جلسة جديدة.</Text>
            <TouchableOpacity style={inactivityStyles.btn} onPress={handleRefreshSession}>
              <Text style={inactivityStyles.btnText}>تحديث الصفحة وتسجيل الخروج</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const inactivityStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  card: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 15
  },
  title: {
    fontFamily: 'CairoBold',
    fontSize: 22,
    color: '#1d1d1f',
    marginBottom: 10
  },
  subtitle: {
    fontFamily: 'Cairo',
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22
  },
  btn: {
    backgroundColor: '#1d1d1f',
    width: '100%',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  btnText: {
    color: '#fff',
    fontFamily: 'CairoBold',
    fontSize: 16
  }
});

// ─── Root — wraps everything in Context + Error Boundary ─────────────────────

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </ErrorBoundary>
  );
}
