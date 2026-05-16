import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { initStorage } from '@/services/storage';
import { useAuth } from '@/hooks/use-auth';
import { View, ActivityIndicator, Platform } from 'react-native';
import { Colors } from '@/constants/theme';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { user, loading: authLoading } = useAuth();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // 1. Load Fonts
        await Font.loadAsync({
          'Cairo': require('../assets/fonts/Cairo-Regular.ttf'),
          'CairoBold': require('../assets/fonts/Cairo-Bold.ttf'),
          'CairoExtraBold': require('../assets/fonts/Cairo-ExtraBold.ttf'),
        });

        // 2. Initialize Database
        await initStorage();
        
        // Artifical delay for smooth transition
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn('Initialization Error:', e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady && !authLoading) {
      if (!user) {
        router.replace('/login');
      } else {
        router.replace('/(tabs)');
      }
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
      <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
    </Stack>
  );
}
