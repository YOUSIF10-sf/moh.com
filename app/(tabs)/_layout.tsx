import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, router, usePathname } from 'expo-router';
import { AlignJustify, Bell, History, LayoutDashboard, LogOut, Settings, ShieldCheck, Store, User as UserIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInRight, FadeOutRight, Layout } from 'react-native-reanimated';
import { ProfileMenu } from '@/components/profile-menu';

const isWeb = Platform.OS === 'web';

// --- INTERNAL COMPONENTS DEFINED OUTSIDE TO ENSURE STABILITY ---

const MobileHeader = ({ user }: { user: any }) => (
  <View style={styles.customHeader}>
    <View style={styles.headerLeftArea}>
      <TouchableOpacity 
        style={styles.headerIconBtn} 
        onPress={() => alert('التنبيهات قيد التطوير')}
        activeOpacity={0.7}
      >
        <Bell size={15} color="#1d1d1f" />
      </TouchableOpacity>
      
      <View style={styles.headerProfileBox}>
        <ProfileMenu userName={user?.full_name || ''} />
      </View>
    </View>

    <View style={styles.magicalTitleContainer}>
      <Text style={styles.magicalTitleMainSmall}>وضح </Text>
      <Text style={styles.magicalTitleAccentSmall}>يااا </Text>
      <Text style={styles.magicalTitleHighlightSmall}>المخزن الصح</Text>
    </View>

    <View style={[styles.headerLogoBlock, { backgroundColor: '#1d1d1f', justifyContent: 'center', alignItems: 'center' }]}>
      <AlignJustify size={16} color="#ffffff" />
    </View>
  </View>
);

const WebSidebar = ({ 
  user, 
  pathname, 
  logout, 
  isAdmin, 
  isWorker, 
  hasAdminAccess 
}: { 
  user: any; 
  pathname: string; 
  logout: () => void; 
  isAdmin: boolean; 
  isWorker: boolean; 
  hasAdminAccess: boolean;
}) => {
  const navItems = [
    { name: 'index', label: 'الرئيسية', icon: LayoutDashboard, href: '/' },
    { name: 'explore', label: 'المخزن', icon: Store, href: '/explore' },
    { name: 'history', label: 'سجلاتي', icon: History, href: '/history' },
    ...(hasAdminAccess ? [{ name: 'admin', label: 'الإدارة', icon: ShieldCheck, href: '/admin' }] : []),
    { name: 'profile', label: 'حسابي', icon: UserIcon, href: '/profile' },
  ];

  return (
    <View style={styles.sidebar}>
        <Text style={styles.sidebarTitle}>المخزن الذكي</Text>

      <View style={styles.sidebarNav}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.sidebarItem, isActive && styles.sidebarItemActive]}
              onPress={() => router.push(item.href as any)}
            >
              <item.icon size={22} color={isActive ? Colors.primary : "#1d1d1f"} />
              <Text style={[styles.sidebarItemText, isActive && styles.sidebarItemTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.sidebarFooter}>
        <View style={styles.sidebarProfile}>
          <View style={styles.sidebarAvatar}>
            <UserIcon size={20} color="#1d1d1f" />
          </View>
          <View style={styles.sidebarProfileInfo}>
            <Text style={styles.sidebarProfileName} numberOfLines={1}>{user?.full_name}</Text>
            <Text style={styles.sidebarProfileRole}>{user?.role === 'admin' ? 'مدير' : 'موظف'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.sidebarLogout} onPress={logout}>
          <LogOut size={18} color="#ff3b30" />
          <Text style={styles.sidebarLogoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function TabLayout() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const isAdmin = user?.role === 'admin';
  const isSupervisor = user?.role === 'supervisor';
  const hasAdminAccess = isAdmin || isSupervisor; 
  const isWorker = user?.role === 'employee'; 

  // --- SCIENTIFIC ROLE GATE ---
  useEffect(() => {
    if (!loading && user) {
      // Employees can now see Home (/), Explore, History, Profile
      // Only block Admin routes for workers
      if (isWorker && pathname.startsWith('/admin')) {
        router.replace('/explore');
      }
      // Supervisor cannot see the Main Dashboard (index /) if reserved for Admin
      // (Optional: Keeping this if you still want Index for Admin only, 
      // but you asked to allow Employee, so I will disable this restriction)
      // if (isSupervisor && pathname === '/') {
      //   router.replace('/admin');
      // }
    }
    // Auth Check
    if (!loading && !user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [user, loading, pathname]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {loading ? (
        <View style={{ flex: 1, backgroundColor: Colors.light.background, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <View style={{ flex: 1, flexDirection: isWeb ? 'row-reverse' : 'column' }}>
          {isWeb && sidebarVisible && (
            <Animated.View 
              entering={FadeInRight.duration(300).springify()} 
              exiting={FadeOutRight.duration(200)}
              style={{ width: 280, height: '100%', zIndex: 50 }}
            >
              <WebSidebar 
                user={user} 
                pathname={pathname} 
                logout={logout} 
                isAdmin={isAdmin} 
                isWorker={isWorker} 
                hasAdminAccess={hasAdminAccess} 
              />
            </Animated.View>
          )}

          <Animated.View layout={Layout.springify()} style={{ flex: 1 }}>
            {isWeb && (
              <View style={styles.webTopHeader}>
                <View style={styles.webHeaderLeft}>
                  <TouchableOpacity style={styles.webHeaderBell} activeOpacity={0.7} onPress={() => alert('التنبيهات قيد التطوير')}>
                    <Bell size={15} color="#1d1d1f" />
                  </TouchableOpacity>
                  
                  <View style={styles.webHeaderProfile}>
                    <ProfileMenu userName={user?.full_name || ''} />
                  </View>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                  <View style={styles.magicalTitleContainer}>
                    <Text style={styles.magicalTitleMain}>وضح </Text>
                    <Text style={styles.magicalTitleAccent}>يااا </Text>
                    <Text style={styles.magicalTitleHighlight}>المخزن الصح</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => setSidebarVisible(!sidebarVisible)}
                    style={[styles.headerLogoBlock, { 
                      backgroundColor: '#1d1d1f', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: 8
                    }]}
                  >
                    <AlignJustify size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            <Tabs
              screenOptions={{
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.light.textMuted,
                headerShown: !isWeb,
                headerTransparent: true,
                header: () => !isWeb ? <MobileHeader user={user} /> : null,
                tabBarStyle: isWeb ? { display: 'none' } : styles.mobileTabBar,
                tabBarLabelStyle: {
                  fontFamily: 'CairoBold',
                  fontSize: 11,
                },
                sceneStyle: isWeb ? { backgroundColor: '#fbfbfd' } : undefined,
              }}>
              <Tabs.Screen
                name="index"
                options={{
                  title: 'الرئيسية',
                  tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
                }}
              />
              <Tabs.Screen
                name="explore"
                options={{
                  title: 'المخزن',
                  tabBarIcon: ({ color }) => <Store size={24} color={color} />,
                }}
              />
              <Tabs.Screen
                name="history"
                options={{
                  title: 'سجلاتي',
                  tabBarIcon: ({ color }) => <History size={24} color={color} />,
                }}
              />
              <Tabs.Screen
                name="admin"
                options={{
                  title: 'الإدارة',
                  tabBarButton: hasAdminAccess ? undefined : () => null,
                  tabBarIcon: ({ color }) => <ShieldCheck size={24} color={color} />,
                }}
              />
              <Tabs.Screen
                name="profile"
                options={{
                  title: 'حسابي',
                  tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
                }}
              />

              <Tabs.Screen 
                name="admin/products" 
                options={{ 
                  tabBarButton: () => null,
                  tabBarItemStyle: { display: 'none' }
                }} 
              />
              <Tabs.Screen 
                name="admin/users" 
                options={{ 
                  tabBarButton: () => null,
                  tabBarItemStyle: { display: 'none' }
                }} 
              />
              <Tabs.Screen 
                name="admin/withdrawals" 
                options={{ 
                  tabBarButton: () => null,
                  tabBarItemStyle: { display: 'none' }
                }} 
              />
            </Tabs>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  customHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
    marginTop: isWeb ? 0 : 45,
  },
  headerLeftArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerProfileBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingLeft: 4,
    paddingRight: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  profileNamePrefix: {
    fontFamily: 'Cairo',
    fontSize: 9,
    color: '#86868b',
    lineHeight: 10,
  },
  profileName: {
    fontFamily: 'CairoBold',
    fontSize: 12,
    color: '#1d1d1f',
    lineHeight: 14,
  },
  headerProfileCircle: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#1d1d1f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAppTitle: {
    fontFamily: 'CairoExtraBold',
    fontSize: 8,
    color: '#86868b',
    letterSpacing: 2,
    opacity: 0.8,
  },
  headerLogoBlock: {
    width: 36,
    height: 36,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1d1d1f',
  },
  headerLogoImg: { 
    width: '100%', 
    height: '100%',
    borderRadius: 16,
  },
  mobileTabBar: {
    backgroundColor: '#ffffff',
    height: 64,
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    borderRadius: 32,
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    paddingBottom: 0,
    paddingTop: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebar: {
    width: 280,
    height: '100%',
    backgroundColor: '#ffffff',
    borderLeftWidth: 1,
    borderLeftColor: '#d2d2d7',
    padding: 24,
    zIndex: 100,
  },
  sidebarHeaderTop: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sidebarLogo: {
    width: 60,
    height: 60,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sidebarTitle: {
    fontFamily: 'CairoBold',
    fontSize: 20,
    color: '#1d1d1f',
    textAlign: 'right',
    marginTop: 10,
  },
  sidebarNav: {
    flex: 1,
    gap: 8,
    marginTop: 20,
  },
  sidebarItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 15,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  sidebarItemActive: {
    backgroundColor: '#f5f5f7',
  },
  sidebarItemText: {
    fontFamily: 'CairoBold',
    fontSize: 16,
    color: '#1d1d1f',
    textAlign: 'right',
  },
  sidebarItemTextActive: {
    color: Colors.primary,
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f5f5f7',
    paddingTop: 24,
    gap: 20,
  },
  sidebarProfile: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  sidebarAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f5f5f7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d2d2d7',
  },
  sidebarProfileInfo: {
    alignItems: 'flex-end',
    flex: 1,
  },
  sidebarProfileName: {
    fontFamily: 'CairoBold',
    fontSize: 15,
    color: '#1d1d1f',
  },
  sidebarProfileRole: {
    fontFamily: 'Cairo',
    fontSize: 12,
    color: '#86868b',
    marginTop: 2,
  },
  sidebarLogout: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    padding: 10,
  },
  sidebarLogoutText: {
    fontFamily: 'CairoBold',
    fontSize: 14,
    color: '#ff3b30',
  },
  webTopHeader: {
    height: 64,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 100,
    // Premium Floating Effect
    ...(isWeb ? { 
      boxShadow: '0 2px 15px rgba(0,0,0,0.03)',
      borderBottomWidth: 0.5,
      borderBottomColor: '#e5e5e7',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 3,
    })
  },
  webHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  webHeaderBell: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webHeaderProfile: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#fbfbfd',
    padding: 6,
    paddingRight: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f2f2f7',
  },
  webProfileNamePrefix: {
    fontFamily: 'Cairo',
    fontSize: 10,
    color: '#86868b',
  },
  webProfileName: {
    fontFamily: 'CairoBold',
    fontSize: 13,
    color: '#1d1d1f',
  },
  webAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#1d1d1f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webHeaderTitle: {
    fontFamily: 'CairoBold',
    fontSize: 16,
    color: '#1d1d1f',
    opacity: 0.6,
  },
  magicalTitleContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    // Shadow/Glow Effect
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  magicalTitleMain: {
    fontFamily: 'CairoBold',
    fontSize: 16,
    color: '#1d1d1f',
  },
  magicalTitleAccent: {
    fontFamily: 'CairoBold',
    fontSize: 16,
    color: '#AF52DE', // Vibrant Purple
  },
  magicalTitleHighlight: {
    fontFamily: 'CairoBold',
    fontSize: 18,
    color: '#007AFF', // Royal Blue
    textShadowColor: 'rgba(0, 122, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  magicalTitleMainSmall: {
    fontFamily: 'CairoBold',
    fontSize: 11,
    color: '#1d1d1f',
  },
  magicalTitleAccentSmall: {
    fontFamily: 'CairoBold',
    fontSize: 11,
    color: '#AF52DE',
  },
  magicalTitleHighlightSmall: {
    fontFamily: 'CairoBold',
    fontSize: 12,
    color: '#007AFF',
    textShadowColor: 'rgba(0, 122, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  }
});
