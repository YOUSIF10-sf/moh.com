import { router } from 'expo-router';
import { ChevronRight, Lock, User, X, AlignJustify, Zap } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  useWindowDimensions,
  Modal
} from 'react-native';
import { Colors } from '../constants/theme';
import { getApiClient } from '../services/api';

const isWeb = Platform.OS === 'web';

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Recovery State
  const [showHelp, setShowHelp] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(1); // 1: Username, 2: Question/Answer, 3: New Password
  const [recoveryUser, setRecoveryUser] = useState('');
  const [recoveryQuestion, setRecoveryQuestion] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);

  const handleLogin = async () => {
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      const api = await getApiClient();
      await api.post('/api/login', {
        username: cleanUsername,
        password: cleanPassword
      });
      router.replace('/');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'بيانات الدخول غير صحيحة';
      Alert.alert('خطأ', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRecoveryNext = async () => {
    setIsRecovering(true);
    try {
      const api = await getApiClient();
      
      if (recoveryStep === 1) {
        if (!recoveryUser.trim()) throw new Error('يرجى إدخال اسم المستخدم');
        const res = await api.post('/api/recover/verify-user', { username: recoveryUser.trim() });
        setRecoveryQuestion(res.data.security_question);
        setRecoveryStep(2);
      } else if (recoveryStep === 2) {
        if (!recoveryAnswer.trim()) throw new Error('يرجى إدخال الإجابة');
        await api.post('/api/recover', { username: recoveryUser.trim(), answer: recoveryAnswer.trim() });
        setRecoveryStep(3);
      } else if (recoveryStep === 3) {
        if (newPassword.length < 4) throw new Error('كلمة المرور قصيرة جداً');
        await api.post('/api/recover', { 
          username: recoveryUser.trim(), 
          answer: recoveryAnswer.trim(),
          newPassword: newPassword.trim()
        });
        Alert.alert('نجاح', 'تم تغيير كلمة المرور، يمكنك الدخول الآن');
        setShowHelp(false);
        setRecoveryStep(1);
        setRecoveryUser('');
        setRecoveryAnswer('');
        setNewPassword('');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'فشلت العملية';
      Alert.alert('تنبيه', msg);
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.loginCard}>
            {/* Unified Branding Icon */}
            <View style={styles.brandContainer}>
              <View style={styles.logoSquare}>
                <AlignJustify size={40} color="#fff" />
              </View>
              <Text style={styles.brandTitle}>المخزن الذكي</Text>
              <Text style={styles.brandSubtitle}>نظام الإدارة المتكامل</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>اسم المستخدم</Text>
                <View style={styles.inputWrapper}>
                  <TextInput 
                    style={styles.input} 
                    placeholder="أدخل اسم المستخدم" 
                    value={username} 
                    onChangeText={setUsername} 
                    autoCapitalize="none" 
                  />
                  <User size={20} color="#86868b" />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>كلمة المرور</Text>
                <View style={styles.inputWrapper}>
                  <TextInput 
                    style={styles.input} 
                    placeholder="••••••••" 
                    value={password} 
                    onChangeText={setPassword} 
                    secureTextEntry 
                  />
                  <Lock size={20} color="#86868b" />
                </View>
              </View>

              <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
                    <ChevronRight size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.forgotBtn} onPress={() => { setShowHelp(true); setRecoveryStep(1); }}>
                <Text style={styles.forgotText}>نسيت كلمة المرور؟</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Enterprise Edition v2.5</Text>
              <Text style={styles.versionText}>Powered by Turso Real-time DB</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Recovery Modal */}
      <Modal visible={showHelp} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%' }}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowHelp(false)}>
                  <X size={24} color="#1d1d1f" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>استعادة الحساب</Text>
              </View>
              
              <View style={styles.recoveryForm}>
                {recoveryStep === 1 && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>أدخل اسم المستخدم</Text>
                    <TextInput 
                      style={styles.inputRecovery} 
                      value={recoveryUser} 
                      onChangeText={setRecoveryUser} 
                      placeholder="اسم المستخدم" 
                      autoCapitalize="none" 
                    />
                  </View>
                )}

                {recoveryStep === 2 && (
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: Colors.primary, marginBottom: 8 }]}>{recoveryQuestion}</Text>
                    <TextInput 
                      style={styles.inputRecovery} 
                      value={recoveryAnswer} 
                      onChangeText={setRecoveryAnswer} 
                      placeholder="أدخل الإجابة هنا" 
                    />
                  </View>
                )}

                {recoveryStep === 3 && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>تعيين كلمة مرور جديدة</Text>
                    <TextInput 
                      style={styles.inputRecovery} 
                      value={newPassword} 
                      onChangeText={setNewPassword} 
                      placeholder="كلمة المرور الجديدة" 
                      secureTextEntry 
                    />
                  </View>
                )}

                <TouchableOpacity style={styles.confirmBtn} onPress={handleRecoveryNext} disabled={isRecovering}>
                  {isRecovering ? <ActivityIndicator color="#fff" /> : (
                    <Text style={styles.confirmText}>
                      {recoveryStep === 1 ? 'تحقق من المستخدم' : recoveryStep === 2 ? 'تأكيد الإجابة' : 'تغيير كلمة المرور'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fbfbfd' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  loginCard: { width: '90%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 30, padding: 30, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, elevation: 5 },
  
  brandContainer: { alignItems: 'center', marginBottom: 30 },
  logoSquare: { width: 70, height: 70, backgroundColor: '#1d1d1f', borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  brandTitle: { fontFamily: 'CairoBold', fontSize: 24, color: '#1d1d1f' },
  brandSubtitle: { fontFamily: 'Cairo', fontSize: 13, color: '#86868b' },

  form: { width: '100%', gap: 18 },
  inputGroup: { width: '100%', gap: 6 },
  label: { fontFamily: 'CairoBold', fontSize: 13, color: '#1d1d1f', textAlign: 'right', marginRight: 4 },
  inputWrapper: { 
    width: '100%', 
    height: 56, 
    backgroundColor: '#f5f5f7', 
    borderRadius: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: 'transparent'
  },
  input: { flex: 1, height: '100%', color: '#1d1d1f', fontSize: 16, fontFamily: 'Cairo', textAlign: 'right', marginRight: 12 },
  
  loginBtn: { width: '100%', height: 56, backgroundColor: '#1d1d1f', borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 10 },
  loginBtnText: { color: '#fff', fontSize: 16, fontFamily: 'CairoBold' },
  
  forgotBtn: { alignSelf: 'center', marginTop: 10 },
  forgotText: { color: '#86868b', fontFamily: 'CairoBold', fontSize: 13 },
  
  footer: { marginTop: 40, alignItems: 'center', gap: 4 },
  footerText: { color: '#1d1d1f', fontSize: 12, fontFamily: 'CairoBold' },
  versionText: { color: '#86868b', fontSize: 11, fontFamily: 'Cairo' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 30, paddingBottom: 50 },
  modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontFamily: 'CairoBold', fontSize: 20, color: '#1d1d1f' },
  recoveryForm: { gap: 15 },
  inputRecovery: { 
    height: 56, 
    backgroundColor: '#f5f5f7', 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    textAlign: 'right', 
    fontFamily: 'Cairo', 
    fontSize: 16,
    color: '#1d1d1f'
  },
  confirmBtn: { height: 56, backgroundColor: '#1d1d1f', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  confirmText: { color: '#fff', fontFamily: 'CairoBold', fontSize: 16 }
});
