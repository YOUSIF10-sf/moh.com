import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  Dimensions
} from 'react-native';
import { 
  User, 
  Mail, 
  Shield, 
  LogOut, 
  ChevronLeft,
  Settings,
  ShieldCheck,
  CreditCard
} from 'lucide-react-native';
import { useAuth } from '@/hooks/use-auth';
import { Colors } from '@/constants/theme';
import { ProfileMenu } from '@/components/profile-menu';
import { 
  Modal, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView
} from 'react-native';
import { getApiClient } from '@/services/api';
import { Lock, X, ChevronRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function UnifiedProfileScreen() {
  const { user } = useAuth();

  const ProfileItem = ({ icon: Icon, label, value, color = '#1d1d1f' }: any) => (
    <View style={styles.item}>
      <View style={styles.itemContent}>
        <Text style={styles.itemLabel}>{label}</Text>
        <Text style={[styles.itemValue, { color }]}>{value}</Text>
      </View>
      <View style={[styles.iconBox, { backgroundColor: '#f5f5f7' }]}>
        <Icon size={20} color="#1d1d1f" />
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>إعدادات الحساب</Text>
        <Text style={styles.headerTitle}>الملف الشخصي.{'\n'}والخصوصية.</Text>
      </View>

      <View style={[styles.mainCard, isWeb && styles.webCard]}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <User size={50} color="#1d1d1f" />
          </View>
          <Text style={styles.userName}>{user?.full_name}</Text>
          <View style={[styles.roleBadge, { backgroundColor: '#f5f5f7' }]}>
            <Text style={[styles.roleText, { color: '#1d1d1f' }]}>
              {user?.role === 'admin' ? 'مدير النظام' : 'موظف'}
            </Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <ProfileItem 
            icon={User} 
            label="اسم المستخدم" 
            value={user?.username} 
          />
          <ProfileItem 
            icon={ShieldCheck} 
            label="نوع الصلاحية" 
            value={user?.role === 'admin' ? 'وصول كامل' : 'وصول محدود'} 
          />
          <ProfileItem 
            icon={CreditCard} 
            label="رقم المعرف" 
            value={`ID-${user?.id?.toString().padStart(4, '0')}`} 
          />
        </View>

        <View style={styles.actions}>
          <ProfileMenu userName={user?.full_name || ''} direction="up" />
        </View>
      </View>

      <View style={[styles.supportCard, isWeb && styles.webCard]}>
        <Text style={styles.supportTitle}>الدعم الفني والخصوصية</Text>
        <Text style={styles.supportDesc}>
          إذا كنت تواجه مشكلة في سجلاتك أو صلاحيات الوصول، يرجى التواصل مع مسؤول النظام مباشرة.
        </Text>
        <TouchableOpacity style={styles.supportBtn}>
          <Text style={styles.supportBtnText}>مركز المساعدة</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.footerVersion}>M-Store Enterprise v2.0.4 Unified Bundle</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fbfbfd',
  },
  content: {
    paddingHorizontal: isWeb ? (width > 1200 ? width * 0.15 : 40) : 24,
    paddingTop: isWeb ? 60 : 135,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 40,
    alignItems: 'flex-end',
  },
  headerSubtitle: {
    fontFamily: 'CairoBold',
    fontSize: 18,
    color: '#86868b',
    marginBottom: 8,
  },
  headerTitle: {
    fontFamily: 'CairoBold',
    fontSize: isWeb ? 42 : 34,
    color: '#1d1d1f',
    textAlign: 'right',
    lineHeight: isWeb ? 52 : 42,
  },
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 30,
    borderWidth: 1,
    borderColor: '#d2d2d7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    marginBottom: 24,
  },
  webCard: {
    maxWidth: 800,
    alignSelf: 'flex-end',
    width: '100%',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f7',
    paddingBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f5f5f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#d2d2d7',
  },
  userName: {
    fontFamily: 'CairoBold',
    fontSize: 24,
    color: '#1d1d1f',
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    fontFamily: 'CairoBold',
    fontSize: 14,
  },
  infoSection: {
    gap: 20,
    marginBottom: 40,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 15,
  },
  itemContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  itemLabel: {
    fontFamily: 'Cairo',
    fontSize: 14,
    color: '#86868b',
    marginBottom: 2,
  },
  itemValue: {
    fontFamily: 'CairoBold',
    fontSize: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    paddingTop: 10,
    alignItems: 'center',
  },
  supportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#d2d2d7',
    marginBottom: 40,
  },
  supportTitle: {
    fontFamily: 'CairoBold',
    fontSize: 18,
    color: '#1d1d1f',
    textAlign: 'right',
    marginBottom: 10,
  },
  supportDesc: {
    fontFamily: 'Cairo',
    fontSize: 14,
    color: '#86868b',
    textAlign: 'right',
    lineHeight: 22,
    marginBottom: 20,
  },
  supportBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f5f5f7',
  },
  supportBtnText: {
    fontFamily: 'CairoBold',
    fontSize: 14,
    color: '#1d1d1f',
  },
  footerVersion: {
    textAlign: 'center',
    fontFamily: 'Cairo',
    fontSize: 12,
    color: '#d2d2d7',
    marginBottom: 20,
  }
});
