import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { ChevronRight, History as HistoryIcon, Package, Shield, Users } from 'lucide-react-native';
import React, { useEffect } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const isWeb = Platform.OS === 'web';

export default function AdminHubScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'supervisor') {
      router.replace('/explore');
    }
  }, [user]);

  const AdminCard = ({ title, subtitle, icon: Icon, onPress, color }: any) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.cardContainer}
    >
      <View style={styles.card}>
        <View style={[styles.cardIcon, { backgroundColor: color + '10' }]}>
          <Icon size={24} color={color} />
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        <ChevronRight size={20} color="#86868b" />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.maxContainer}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Shield size={24} color={Colors.primary} />
            <Text style={styles.headerLabel}>بوابة التحكم العليا</Text>
          </View>
          <Text style={styles.headerTitle}>إدارة الموارد.{'\n'}والصلاحيات.</Text>
        </View>

        <View style={styles.menuGrid}>
          <AdminCard
            title="إدارة المنتجات"
            subtitle="إضافة وتعديل الأصناف"
            icon={Package}
            color="#1d1d1f"
            onPress={() => router.push('/admin/products')}
          />
          {isAdmin && (
            <AdminCard
              title="إدارة الموظفين"
              subtitle="الصلاحيات والمستخدمين"
              icon={Users}
              color="#0071e3"
              onPress={() => router.push('/admin/users')}
            />
          )}
          <AdminCard
            title="سجل العمليات"
            subtitle="مراجعة كافة السحوبات"
            icon={HistoryIcon}
            color="#34c759"
            onPress={() => router.push('/admin/withdrawals')}
          />
        </View>

        <View style={styles.footerBox}>
          <Text style={styles.footerText}>
            مرحباً بك في لوحة تحكم مدير النظام. جميع العمليات المسجلة هنا يتم أرشفتها لأغراض التدقيق.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fbfbfd',
  },
  scrollContent: {
    paddingBottom: 120,
    paddingTop: isWeb ? 60 : 110,
    alignItems: 'center',
  },
  maxContainer: {
    width: '100%',
    maxWidth: 1000,
    paddingHorizontal: isWeb ? 40 : 24,
  },
  header: {
    marginBottom: 48,
    alignItems: 'flex-end',
  },
  headerTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  headerLabel: {
    fontFamily: 'CairoBold',
    fontSize: 18,
    color: '#86868b',
  },
  headerTitle: {
    fontFamily: 'CairoBold',
    fontSize: isWeb ? 48 : 34,
    color: '#1d1d1f',
    textAlign: 'right',
    lineHeight: isWeb ? 56 : 42,
  },
  menuGrid: {
    gap: 20,
    marginBottom: 40,
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#d2d2d7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 24,
    gap: 20,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  cardTitle: {
    fontFamily: 'CairoBold',
    fontSize: 20,
    color: '#1d1d1f',
  },
  cardSubtitle: {
    fontFamily: 'Cairo',
    fontSize: 14,
    color: '#86868b',
    marginTop: 4,
  },
  footerBox: {
    padding: 24,
    backgroundColor: '#f5f5f7',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d2d2d7',
  },
  footerText: {
    fontFamily: 'Cairo',
    fontSize: 14,
    color: '#86868b',
    textAlign: 'center',
    lineHeight: 22,
  },
});
