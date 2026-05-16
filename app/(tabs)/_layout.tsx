/**
 * (tabs)/_layout.tsx
 * ✅ إصلاح جميع TypeScript errors
 * ✅ يستخدم useUser من AppContext
 * ✅ لا يوجد redundant API calls
 * ✅ كود نظيف ومنظم
 */
import { Colors } from '@/constants/theme';
import { useUser } from '@/context/AppContext';
import { Tabs, router, usePathname } from 'expo-router';
import {
  AlignJustify, Bell, History, LayoutDashboard,
  LogOut, Settings, ShieldCheck, Store, User as UserIcon,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Platform, StyleSheet, Text,
  TouchableOpacity, View, Animated
} from 'react-native';
import { ProfileMenu } from '@/components/profile-menu';

const isWeb = Platform.OS === 'web';

// ─── Mobile Header ────────────────────────────────────────────────────────────

const MobileHeader = ({ user, toggleSidebar }: { user: any, toggleSidebar: () => void }) => (
  <View style={s.customHeader}>
    <View style={s.headerLeftArea}>
      <TouchableOpacity style={s.headerIconBtn} activeOpacity={0.7}>
        <Bell size={15} color="#1d1d1f" />
      </TouchableOpacity>
      <View style={s.headerProfileBox}>
        <ProfileMenu userName={user?.full_name || ''} />
      </View>
    </View>

    <View style={s.magicalTitleContainer}>
      <Text style={s.titleMain}>وضح </Text>
      <Text style={s.titleAccent}>يا </Text>
      <Text style={s.titleHighlight}>المخزن الصح</Text>
    </View>

    <TouchableOpacity 
      style={[s.headerLogoBlock, { justifyContent: 'center', alignItems: 'center' }]}
      onPress={toggleSidebar}
      activeOpacity={0.7}
    >
      <AlignJustify size={16} color="#fff" />
    </TouchableOpacity>
  </View>
);

// ─── Web Sidebar ──────────────────────────────────────────────────────────────

interface SidebarProps {
  user: any;
  pathname: string;
  logout: () => void;
  hasAdminAccess: boolean;
}

const WebSidebar = ({ user, pathname, logout, hasAdminAccess }: SidebarProps) => {
  const navItems = [
    { name: 'index',   label: 'الرئيسية', icon: LayoutDashboard, href: '/' },
    { name: 'explore', label: 'المخزن',   icon: Store,           href: '/explore' },
    { name: 'history', label: 'سجلاتي',   icon: History,         href: '/history' },
    ...(hasAdminAccess ? [{ name: 'admin', label: 'الإدارة', icon: ShieldCheck, href: '/admin' }] : []),
    { name: 'profile', label: 'حسابي',    icon: UserIcon,        href: '/profile' },
  ];

  return (
    <View style={s.sidebar}>
      <Text style={s.sidebarTitle}>المخزن الذكي</Text>

      <View style={s.sidebarNav}>
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <TouchableOpacity
              key={item.name}
              style={[s.sidebarItem, active && s.sidebarItemActive]}
              onPress={() => router.push(item.href as any)}
            >
              <item.icon size={21} color={active ? Colors.primary : '#1d1d1f'} />
              <Text style={[s.sidebarItemText, active && s.sidebarItemTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={s.sidebarFooter}>
        <View style={s.sidebarProfile}>
          <View style={s.sidebarAvatar}>
            <UserIcon size={18} color="#1d1d1f" />
          </View>
          <View style={s.sidebarProfileInfo}>
            <Text style={s.sidebarProfileName} numberOfLines={1}>{user?.full_name}</Text>
            <Text style={s.sidebarProfileRole}>{user?.role === 'admin' ? 'مدير' : 'موظف'}</Text>
          </View>
        </View>
        <TouchableOpacity style={s.sidebarLogout} onPress={logout}>
          <LogOut size={17} color="#FF3B30" />
          <Text style={s.sidebarLogoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Mobile Sidebar ─────────────────────────────────────────────────────────────

const MobileSideBar = ({ pathname, hasAdminAccess, onClose }: { pathname: string, hasAdminAccess: boolean, onClose: () => void }) => {
  const navItems = [
    { name: 'index',   icon: LayoutDashboard, href: '/' },
    { name: 'explore', icon: Store,           href: '/explore' },
    { name: 'history', icon: History,         href: '/history' },
    ...(hasAdminAccess ? [{ name: 'admin', icon: ShieldCheck, href: '/admin' }] : []),
    { name: 'profile', icon: Settings,        href: '/profile' },
  ];

  return (
    <View style={s.mobileSideBar}>
      {navItems.map(item => {
        const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <TouchableOpacity
            key={item.name}
            style={[s.mobileSideBarItem, active && s.mobileSideBarItemActive]}
            onPress={() => {
              router.push(item.href as any);
              onClose();
            }}
            activeOpacity={0.7}
          >
            <item.icon size={22} color={active ? '#ffffff' : '#86868b'} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ─── Tab Layout ───────────────────────────────────────────────────────────────

export default function TabLayout() {
  const { user, loading, logout } = useUser();
  const pathname = usePathname();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [mobileSidebarVisible, setMobileSidebarVisible] = useState(false);

  const isAdmin       = user?.role === 'admin';
  const isSupervisor  = user?.role === 'supervisor';
  const hasAdminAccess = isAdmin || isSupervisor;
  const isWorker      = user?.role === 'employee';

  useEffect(() => {
    if (!loading && user) {
      if (isWorker && pathname.startsWith('/admin')) router.replace('/explore');
    }
    if (!loading && !user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [user, loading, pathname]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fbfbfd' }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ flex: 1, flexDirection: isWeb ? 'row-reverse' : 'column' }}>
        {/* Sidebar (Web only) */}
        {isWeb && sidebarVisible && (
          <Animated.View
            style={{ width: 280, height: '100%', zIndex: 50 }}
          >
            <WebSidebar
              user={user}
              pathname={pathname}
              logout={logout}
              hasAdminAccess={hasAdminAccess}
            />
          </Animated.View>
        )}

        {/* Main Content */}
        <View style={{ flex: 1 }}>
          {/* Web Top Header */}
          {isWeb && (
            <View style={s.webTopHeader}>
              <View style={s.webHeaderLeft}>
                <TouchableOpacity style={s.webHeaderBell} activeOpacity={0.7}>
                  <Bell size={15} color="#1d1d1f" />
                </TouchableOpacity>
                <View style={s.webHeaderProfile}>
                  <ProfileMenu userName={user?.full_name || ''} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={s.magicalTitleContainer}>
                  <Text style={s.titleMainLg}>وضح </Text>
                  <Text style={s.titleAccentLg}>يا </Text>
                  <Text style={s.titleHighlightLg}>المخزن الصح</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSidebarVisible(v => !v)}
                  style={[s.headerLogoBlock, { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }]}
                >
                  <AlignJustify size={15} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Mobile Sidebar Overlay & Component */}
          {!isWeb && mobileSidebarVisible && (
            <>
              <TouchableOpacity
                style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 900 }]}
                activeOpacity={1}
                onPress={() => setMobileSidebarVisible(false)}
              />
              <Animated.View
                style={{ position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 1000 }}
              >
                <MobileSideBar pathname={pathname} hasAdminAccess={hasAdminAccess} onClose={() => setMobileSidebarVisible(false)} />
              </Animated.View>
            </>
          )}

          <Tabs
            screenOptions={{
              headerShown: !isWeb,
              headerTransparent: true,
              header: () => !isWeb ? <MobileHeader user={user} toggleSidebar={() => setMobileSidebarVisible(v => !v)} /> : null,
              tabBarStyle: { display: 'none' }, // Completely hidden, we use MobileSideBar now
              sceneStyle: { backgroundColor: '#fbfbfd' }, // Remove right padding, sidebar overlays content
            }}
          >
            <Tabs.Screen name="index" />
            <Tabs.Screen name="explore" />
            <Tabs.Screen name="history" />
            <Tabs.Screen name="admin" />
            <Tabs.Screen name="profile" />
            <Tabs.Screen name="admin/products" />
            <Tabs.Screen name="admin/users" />
            <Tabs.Screen name="admin/withdrawals" />
          </Tabs>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  customHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
    marginTop: 45,
  },
  headerLeftArea: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIconBtn: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  headerProfileBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  headerLogoBlock: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#1d1d1f',
    overflow: 'hidden',
  },

  // Magical title — mobile
  magicalTitleContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  titleMain:      { fontFamily: 'CairoBold', fontSize: 11, color: '#1d1d1f' },
  titleAccent:    { fontFamily: 'CairoBold', fontSize: 11, color: '#AF52DE' },
  titleHighlight: { fontFamily: 'CairoBold', fontSize: 12, color: '#007AFF' },
  // Large (web)
  titleMainLg:      { fontFamily: 'CairoBold', fontSize: 16, color: '#1d1d1f' },
  titleAccentLg:    { fontFamily: 'CairoBold', fontSize: 16, color: '#AF52DE' },
  titleHighlightLg: { fontFamily: 'CairoBold', fontSize: 18, color: '#007AFF' },

  mobileSideBar: {
    position: 'absolute',
    right: 12,
    top: '25%', // Centered vertically
    height: 320, // Enough for 5 icons
    width: 60,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 30,
    elevation: 20,
    shadowColor: '#1d1d1f',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 15,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  mobileSideBarItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileSideBarItemActive: {
    backgroundColor: '#1d1d1f',
    shadowColor: '#1d1d1f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  sidebar: {
    width: 280,
    height: '100%',
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderLeftColor: '#e5e5e7',
    padding: 24,
    zIndex: 100,
  },
  sidebarTitle: { fontFamily: 'CairoBold', fontSize: 20, color: '#1d1d1f', textAlign: 'right', marginTop: 10 },
  sidebarNav: { flex: 1, gap: 6, marginTop: 20 },
  sidebarItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 14,
    padding: 13,
    borderRadius: 14,
  },
  sidebarItemActive: { backgroundColor: '#f5f5f7' },
  sidebarItemText: { fontFamily: 'CairoBold', fontSize: 15, color: '#1d1d1f', textAlign: 'right' },
  sidebarItemTextActive: { color: Colors.primary },
  sidebarFooter: { borderTopWidth: 1, borderTopColor: '#f5f5f7', paddingTop: 20, gap: 16 },
  sidebarProfile: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  sidebarAvatar: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#f5f5f7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e7',
  },
  sidebarProfileInfo: { alignItems: 'flex-end', flex: 1 },
  sidebarProfileName: { fontFamily: 'CairoBold', fontSize: 14, color: '#1d1d1f' },
  sidebarProfileRole: { fontFamily: 'Cairo', fontSize: 11, color: '#86868b', marginTop: 2 },
  sidebarLogout: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, padding: 8 },
  sidebarLogoutText: { fontFamily: 'CairoBold', fontSize: 14, color: '#FF3B30' },

  webTopHeader: {
    height: 62,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 100,
    ...(isWeb ? ({ boxShadow: '0 1px 12px rgba(0,0,0,0.04)' } as any) : {}),
  },
  webHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  webHeaderBell: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  webHeaderProfile: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#fbfbfd',
    padding: 5,
    paddingRight: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e7',
  },
});
