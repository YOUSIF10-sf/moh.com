import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { initStorage } from '@/services/storage';
import { View, ActivityIndicator, I18nManager } from 'react-native';
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
  const { user, loading: authLoading } = useUser();
  const [appIsReady, setAppIsReady] = useState(false);

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

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
    </Stack>
  );
}

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
