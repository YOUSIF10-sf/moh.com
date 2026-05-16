import { Colors } from '@/constants/theme';
import { getApiClient } from '@/services/api';
import { router } from 'expo-router';
import { AlignJustify, ChevronRight, Eye, EyeOff, Lock, User, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function WebLoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Recovery State
  const [showHelp, setShowHelp] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(1); // 1: Username, 2: Question/Answer, 3: New Password
  const [recoveryUser, setRecoveryUser] = useState('');
  const [recoveryQuestion, setRecoveryQuestion] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');

  const handleLogin = async () => {
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const api = await getApiClient();
      await api.post('/api/login', {
        username: cleanUsername,
        password: cleanPassword
      });
      router.replace('/');
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول: بيانات غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  const handleRecoveryNext = async () => {
    setRecoveryError('');
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
        alert('تم تغيير كلمة المرور بنجاح، يمكنك الآن تسجيل الدخول');
        setShowHelp(false);
        setRecoveryStep(1);
        setRecoveryUser('');
        setRecoveryAnswer('');
        setNewPassword('');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'فشلت العملية';
      setRecoveryError(msg);
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageSection}>
        <Image source={require('../assets/images/BC.jpg')} style={styles.backgroundImage} resizeMode="cover" />
        <View style={styles.imageOverlay}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandName}>Smart Warehouse</Text>
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>كفاءة عالية.{'\n'}في إدارة المخزون.</Text>
            <Text style={styles.heroSubtitle}>نظام متكامل لإدارة العمليات اليومية بكل سهولة واحترافية.</Text>
          </View>
        </View>
      </View>

      <View style={styles.formSection}>
        <View style={styles.loginCard}>
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: '#1d1d1f', justifyContent: 'center', alignItems: 'center' }]}>
              <AlignJustify size={32} color="#ffffff" />
            </View>
            <Text style={styles.title}>تسجيل الدخول</Text>
            <Text style={styles.subtitle}>أهلاً بك، يرجى إدخال بياناتك للمتابعة.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>اسم المستخدم</Text>
              <View style={[styles.inputWrapper, focusedInput === 'user' && styles.focusedInput]}>
                <User size={20} color={focusedInput === 'user' ? '#1d1d1f' : '#86868b'} />
                <TextInput
                  style={[styles.input, isWeb && { outlineStyle: 'none' } as any]}
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setFocusedInput('user')}
                  onBlur={() => setFocusedInput(null)}
                  autoCapitalize="none"
                  placeholder="الاسم"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>كلمة المرور</Text>
              <View style={[styles.inputWrapper, focusedInput === 'pass' && styles.focusedInput]}>
                <Lock size={20} color={focusedInput === 'pass' ? '#1d1d1f' : '#86868b'} />
                <TextInput
                  style={[styles.input, isWeb && { outlineStyle: 'none' } as any]}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedInput('pass')}
                  onBlur={() => setFocusedInput(null)}
                  secureTextEntry
                  placeholder="••••••••"
                />
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Text style={styles.loginBtnText}>دخول للنظام</Text>
                  <ChevronRight size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotBtn} onPress={() => { setShowHelp(true); setRecoveryStep(1); }}>
              <Text style={styles.forgotText}>نسيت كلمة المرور؟</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal visible={showHelp} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>استعادة الوصول</Text>
              <TouchableOpacity onPress={() => setShowHelp(false)}><X size={24} color="#1d1d1f" /></TouchableOpacity>
            </View>

            <View style={styles.recoveryForm}>
              {recoveryStep === 1 && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>أدخل اسم المستخدم للتحقق</Text>
                  <TextInput
                    style={styles.recoveryInput}
                    value={recoveryUser}
                    onChangeText={setRecoveryUser}
                    placeholder="USERNAME"
                    autoCapitalize="none"
                  />
                </View>
              )}

              {recoveryStep === 2 && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: Colors.primary, marginBottom: 10 }]}>{recoveryQuestion}</Text>
                  <TextInput
                    style={styles.recoveryInput}
                    value={recoveryAnswer}
                    onChangeText={setRecoveryAnswer}
                    placeholder="إجابة سؤال الأمان"
                  />
                </View>
              )}

              {recoveryStep === 3 && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>تعيين كلمة مرور جديدة</Text>
                  <TextInput
                    style={styles.recoveryInput}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="كلمة المرور الجديدة"
                    secureTextEntry
                  />
                </View>
              )}

              {recoveryError ? <Text style={styles.errorText}>{recoveryError}</Text> : null}

              <TouchableOpacity style={[styles.loginBtn, { marginTop: 20 }]} onPress={handleRecoveryNext} disabled={isRecovering}>
                {isRecovering ? <ActivityIndicator color="#fff" /> : (
                  <Text style={styles.loginBtnText}>
                    {recoveryStep === 1 ? 'متابعة للتحقق' : recoveryStep === 2 ? 'تأكيد الإجابة' : 'تغيير كلمة المرور'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', flexDirection: 'row' },
  imageSection: { flex: 1.3, backgroundColor: '#000', display: isWeb ? 'flex' : 'none' },
  backgroundImage: { width: '100%', height: '100%', opacity: 0.7 },
  imageOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: 60, justifyContent: 'space-between' },
  brandBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  brandName: { color: '#fff', fontFamily: 'CairoBold', fontSize: 18 },
  heroContent: { maxWidth: 500, alignItems: 'flex-start' },
  heroTitle: { color: '#fff', fontFamily: 'CairoBold', fontSize: 48, lineHeight: 60, textAlign: 'left' },
  heroSubtitle: { color: 'rgba(255,255,255,0.7)', fontFamily: 'Cairo', fontSize: 18, marginTop: 20, textAlign: 'left' },
  formSection: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fbfbfd' },
  loginCard: { width: 400, padding: 40, backgroundColor: '#fff', borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.04)' } as any,
  header: { alignItems: 'center', marginBottom: 32 },
  logoContainer: { width: 64, height: 64, borderRadius: 20, marginBottom: 20 },
  title: { fontFamily: 'CairoBold', fontSize: 28, color: '#1d1d1f', marginBottom: 8 },
  subtitle: { fontFamily: 'Cairo', fontSize: 14, color: '#86868b' },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontFamily: 'CairoBold', fontSize: 13, color: '#1d1d1f', textAlign: 'right' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f7', borderRadius: 12, paddingHorizontal: 16, height: 52, borderWidth: 1.5, borderColor: 'transparent' },
  focusedInput: { borderColor: '#1d1d1f', backgroundColor: '#fff' },
  input: { flex: 1, height: '100%', marginLeft: 12, fontFamily: 'Cairo', fontSize: 15, color: '#1d1d1f', textAlign: 'right' },
  loginBtn: { height: 52, backgroundColor: '#1d1d1f', borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 10 },
  loginBtnText: { color: '#fff', fontFamily: 'CairoBold', fontSize: 16 },
  forgotBtn: { alignSelf: 'center', marginTop: 8 },
  forgotText: { color: '#86868b', fontFamily: 'CairoBold', fontSize: 13 },
  errorText: { color: '#ff3b30', fontSize: 13, textAlign: 'right', fontFamily: 'CairoBold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: 400, padding: 30, borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } as any,
  modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontFamily: 'CairoBold', fontSize: 20 },
  recoveryForm: { gap: 15 },
  recoveryInput: { height: 50, backgroundColor: '#f5f5f7', borderRadius: 12, paddingHorizontal: 16, textAlign: 'right', fontFamily: 'Cairo', fontSize: 15 },
});
