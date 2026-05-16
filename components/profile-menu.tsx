import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LogOut, Key, X, ChevronDown, User } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { getApiClient } from '@/services/api';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';

interface ProfileMenuProps {
  userName: string;
  isWeb?: boolean;
  direction?: 'up' | 'down';
}

const isWeb = Platform.OS === 'web';

export function ProfileMenu({ userName, direction = 'down' }: ProfileMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [passModalVisible, setPassModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [fullName, setFullName] = useState(userName);
  const [username, setUsername] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const { user, logout, refreshUser } = useAuth();

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setUsername(user.username);
      setSecurityQuestion(user.security_question || 'ما هو اسم صديقك المقرب؟');
      setSecurityAnswer(user.security_answer || '');
    }
  }, [user]);

  const handleLogout = async () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من رغبتك في تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'تسجيل الخروج', 
          style: 'destructive', 
          onPress: async () => {
            await logout();
            router.replace('/login');
          } 
        }
      ]
    );
  };

  const handleChangePassword = async () => {
    const cleanOld = oldPassword.trim();
    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanOld || !cleanNew || !cleanConfirm) {
      const msg = 'يرجى ملء جميع الحقول المطلوبة';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('خطأ', msg);
      return;
    }

    if (cleanNew !== cleanConfirm) {
      const msg = 'كلمة المرور الجديدة غير متطابقة';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('تنبيه', msg);
      return;
    }

    if (cleanNew.length < 4) {
      const msg = 'كلمة المرور الجديدة قصيرة جداً';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('تنبيه', msg);
      return;
    }

    setIsSaving(true);
    try {
      const api = await getApiClient();
      // Using a more standard endpoint and payload for security
      await api.post('/api/users/change-password', { 
        oldPassword: cleanOld, 
        newPassword: cleanNew 
      });
      setPassModalVisible(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      const successMsg = 'تم تحديث كلمة المرور بنجاح';
      Platform.OS === 'web' ? alert(successMsg) : Alert.alert('نجاح', successMsg);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'تعذر تغيير كلمة المرور، يرجى التأكد من الكلمة الحالية';
      Platform.OS === 'web' ? alert(errorMsg) : Alert.alert('خطأ', errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    const cleanName = fullName?.trim();
    const cleanUname = username?.trim();
    const cleanAns = securityAnswer?.trim();

    if (!cleanName || !cleanUname) {
      const msg = 'يرجى إدخال الاسم واسم المستخدم';
      isWeb ? alert(msg) : Alert.alert('تنبيه', msg);
      return;
    }

    if (!securityQuestion || !cleanAns) {
      const msg = 'يرجى اختيار سؤال الأمان وكتابة الإجابة';
      isWeb ? alert(msg) : Alert.alert('تنبيه', msg);
      return;
    }

    setIsSaving(true);
    try {
      const api = await getApiClient();
      await api.post(`/api/user/update`, { 
        full_name: cleanName, 
        username: cleanUname,
        security_question: securityQuestion,
        security_answer: cleanAns
      });
      await refreshUser();
      setEditModalVisible(false);
      const successMsg = 'تم تحديث البيانات بنجاح';
      isWeb ? alert(successMsg) : Alert.alert('نجاح', successMsg);
    } catch (error: any) {
      console.error('Update Error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'فشل تحديث البيانات';
      isWeb ? alert(`خطأ: ${errorMsg}`) : Alert.alert('خطأ', errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.trigger, isWeb && styles.webTrigger]} 
        onPress={() => setMenuOpen(!menuOpen)}
      >
        <View style={styles.avatar}>
          <User size={15} color="#1d1d1f" />
        </View>
      </TouchableOpacity>

      {menuOpen && (
        <View style={[
          styles.dropdown, 
          direction === 'up' ? styles.dropdownUp : styles.dropdownDown,
          styles.webDropdown
        ]}>
          <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); setEditModalVisible(true); }}>
            <Text style={[styles.menuItemText, styles.webMenuItemText]}>تعديل البيانات</Text>
            <User size={16} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); setPassModalVisible(true); }}>
            <Text style={[styles.menuItemText, styles.webMenuItemText]}>تغيير كلمة المرور</Text>
            <Key size={16} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={() => { setMenuOpen(false); handleLogout(); }}>
            <Text style={[styles.menuItemText, styles.webMenuItemText, styles.logoutText]}>تسجيل الخروج</Text>
            <LogOut size={16} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      )}

      {/* Change Password Modal */}
      <Modal visible={passModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isWeb && { width: 300, padding: 15 }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setPassModalVisible(false)}>
                <X size={24} color="#1d1d1f" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>تغيير كلمة المرور</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>كلمة المرور الحالية</Text>
                <TextInput
                  style={[styles.input, focusedInput === 'old' && styles.inputFocused]}
                  placeholder="••••••••"
                  placeholderTextColor="#86868b"
                  secureTextEntry
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  onFocus={() => setFocusedInput('old')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>كلمة المرور الجديدة</Text>
                <TextInput
                  style={[styles.input, focusedInput === 'new' && styles.inputFocused]}
                  placeholder="••••••••"
                  placeholderTextColor="#86868b"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                  onFocus={() => setFocusedInput('new')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>تأكيد كلمة المرور الجديدة</Text>
                <TextInput
                  style={[styles.input, focusedInput === 'conf' && styles.inputFocused]}
                  placeholder="••••••••"
                  placeholderTextColor="#86868b"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedInput('conf')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>تحديث كلمة المرور</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isWeb && { width: 400 }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={24} color="#1d1d1f" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>تعديل الحساب</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>الاسم الكامل</Text>
                <TextInput
                  style={[styles.input, focusedInput === 'name' && styles.inputFocused]}
                  placeholder="الاسم"
                  placeholderTextColor="#86868b"
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>اسم المستخدم</Text>
                <TextInput
                  style={[styles.input, focusedInput === 'uname' && styles.inputFocused]}
                  placeholder="اسم المستخدم"
                  placeholderTextColor="#86868b"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  onFocus={() => setFocusedInput('uname')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>اختر سؤال الأمان</Text>
                <View style={styles.questionList}>
                  {[
                    'ما هو اسم صديقك المقرب؟',
                    'ما هو اسم مدرستك الابتدائية؟',
                    'ما هو اسم مدينتك المفضلة؟'
                  ].map((q) => (
                    <TouchableOpacity 
                      key={q} 
                      style={[styles.questionItem, securityQuestion === q && styles.questionItemActive]}
                      onPress={() => setSecurityQuestion(q)}
                    >
                      <Text style={[styles.questionItemText, securityQuestion === q && styles.questionItemTextActive]}>{q}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>إجابة السؤال المختارة</Text>
                <TextInput
                  style={[styles.input, focusedInput === 'ans' && styles.inputFocused]}
                  placeholder="اكتب الإجابة هنا..."
                  placeholderTextColor="#86868b"
                  value={securityAnswer}
                  onChangeText={setSecurityAnswer}
                  onFocus={() => setFocusedInput('ans')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>حفظ التغييرات</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { zIndex: 1000 },
  trigger: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 12 },
  webTrigger: { backgroundColor: 'transparent' },
  avatar: { 
    width: 24, 
    height: 24, 
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  userName: { fontFamily: 'CairoBold', fontSize: 14, color: '#1d1d1f' },
  webUserName: { color: '#1d1d1f' },
  dropdown: {
    position: 'absolute',
    left: 0, // Changed to left for left-side triggers
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 8,
    width: 220,
    borderWidth: 1,
    borderColor: '#f2f2f7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  dropdownDown: { top: 50 },
  dropdownUp: { bottom: 60 },
  webDropdown: { backgroundColor: '#ffffff' },
  mobileDropdown: { right: 0 },
  menuItem: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10 },
  menuItemText: { fontFamily: 'CairoBold', fontSize: 14, color: '#1d1d1f' },
  webMenuItemText: { color: '#1d1d1f' },
  logoutItem: { borderTopWidth: 1, borderTopColor: '#f5f5f7', marginTop: 4 },
  logoutText: { color: Colors.danger },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { backgroundColor: '#ffffff', width: '90%', borderRadius: 28, padding: 25, borderWidth: 1, borderColor: '#f2f2f7' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontFamily: 'CairoBold', fontSize: 16, color: '#1d1d1f' },
  form: { gap: 10 },
  inputGroup: { gap: 4 },
  label: { fontFamily: 'CairoBold', fontSize: 11, color: '#1d1d1f', textAlign: 'right', marginRight: 4 },
  input: { 
    backgroundColor: '#fff', 
    borderRadius: 10, 
    padding: 10, 
    color: '#1d1d1f', 
    fontFamily: 'Cairo', 
    textAlign: 'right', 
    borderWidth: 1.2, 
    borderColor: '#eee', 
    fontSize: 13,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  inputFocused: {
    borderColor: '#1d1d1f',
  },
  saveBtn: { backgroundColor: '#1d1d1f', height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 5 },
  saveBtnText: { color: '#fff', fontFamily: 'CairoBold', fontSize: 13 },
  questionList: { gap: 8, marginTop: 4 },
  questionItem: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f5f5f7',
    borderWidth: 1.2,
    borderColor: 'transparent',
  },
  questionItemActive: {
    backgroundColor: '#fff',
    borderColor: '#1d1d1f',
  },
  questionItemText: {
    fontFamily: 'Cairo',
    fontSize: 12,
    color: '#86868b',
    textAlign: 'right',
  },
  questionItemTextActive: {
    color: '#1d1d1f',
    fontFamily: 'CairoBold',
  }
});
