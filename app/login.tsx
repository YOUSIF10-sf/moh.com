import { router } from 'expo-router';
import { ChevronRight, Lock, User, X, AlignJustify, Zap } from 'lucide-react-native';
import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
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
import { useAuth } from '@/hooks/use-auth';

const isWeb = Platform.OS === 'web';

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
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

  const { refreshUser } = useAuth();
  
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
      await refreshUser();
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
        setRecoveryQuestion((res.data as any).security_question);
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
    <View style={styles.mainContainer}>
      {/* Absolute Background Image for Mobile only */}
      {!isLargeScreen && (
        <ImageBackground 
          source={require('../assets/images/BC.jpg')} 
          style={styles.absoluteBg}
          resizeMode="cover"
        >
          <View style={styles.absoluteOverlay} />
        </ImageBackground>
      )}

      {/* Content wrapper */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={[styles.contentWrapper, { flexDirection: isLargeScreen ? 'row' : 'column' }]}>
          
          {/* Left Side: Magical Touch (Takes up remaining space) */}
          <View style={[styles.magicSection, !isLargeScreen && { display: 'none' }, isLargeScreen && { padding: 0 }]}>
            {isLargeScreen && (
              <ImageBackground 
                source={require('../assets/images/BC.jpg')} 
                style={styles.imageBg}
                resizeMode="cover"
              >
                <View style={styles.absoluteOverlay} />
                <View style={styles.magicOverlay}>
                  <View style={styles.glassEffect}>
                    <Zap size={48} color="#fff" style={{ marginBottom: 15 }} />
                    <Text style={styles.magicTextTitle}>نظام المخزن الذكي</Text>
                    <Text style={styles.magicTextSubtitle}>الجيل الجديد من الإدارة والتحكم الكامل بمواردك في مكان واحد وبلمسة سحرية</Text>
                  </View>
                </View>
              </ImageBackground>
            )}
          </View>

          {/* Right Side: Floating Small Form Panel */}
          <View style={[
            styles.formSectionContainer, 
            isLargeScreen && { width: '45%', minWidth: 450, backgroundColor: '#ffffff' },
            !isLargeScreen && { flex: 1, paddingBottom: '15%' }
          ]}>
            <LinearGradient
              colors={['rgba(255, 50, 150, 0.7)', 'rgba(100, 150, 255, 0.7)', 'rgba(50, 255, 150, 0.7)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientWrapper}
            >
              <View style={[styles.loginCard, { alignSelf: 'stretch' }]}>
                <View style={styles.brandContainer}>
                  <View style={styles.logoSquare}>
                    <AlignJustify size={30} color="#fff" />
                  </View>
                  <Text style={styles.brandTitle}>تسجيل الدخول</Text>
                  <Text style={styles.brandSubtitle}>مرحباً بك مجدداً في نظامك</Text>
                </View>

              <View style={[styles.form, { alignItems: 'stretch' }]}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>اسم المستخدم</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput 
                      style={styles.input} 
                      placeholder="أدخل اسم المستخدم" 
                      value={username} 
                      onChangeText={setUsername} 
                      autoCapitalize="none" 
                      placeholderTextColor="#aaa"
                    />
                    <User size={18} color="#666" />
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
                      placeholderTextColor="#aaa"
                    />
                    <Lock size={18} color="#666" />
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.loginBtn, { width: '100%', alignSelf: 'stretch' }]} 
                  onPress={handleLogin} 
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.loginBtnText}>الدخول الآن</Text>
                      <ChevronRight size={20} color="#fff" style={{ marginLeft: 10 }} />
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.forgotBtn} onPress={() => { setShowHelp(true); setRecoveryStep(1); }}>
                  <Text style={styles.forgotText}>نسيت كلمة المرور؟</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Enterprise Edition v2.5</Text>
                <Text style={styles.versionText}>Powered by Turso</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

      </View>
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
                    <Text style={[styles.label, { color: '#1d1d1f', marginBottom: 8 }]}>{recoveryQuestion}</Text>
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
  mainContainer: { flex: 1, backgroundColor: '#000' },
  
  absoluteBg: { ...StyleSheet.absoluteFillObject },
  absoluteOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  
  contentWrapper: { flex: 1 },
  
  magicSection: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 30
  },
  
  formSectionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginBottom: Platform.OS === 'web' ? 0 : 30
  },

  gradientWrapper: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    padding: 1.5,
    borderRadius: 31.5,
    shadowColor: '#fff',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },

  imageBg: { flex: 1, width: '100%', height: '100%' },
  magicOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.45)', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 30
  },
  glassEffect: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 30,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    maxWidth: 400
  },
  magicTextTitle: { fontFamily: 'CairoBold', fontSize: 32, color: '#fff', textAlign: 'center', marginBottom: 10 },
  magicTextSubtitle: { fontFamily: 'Cairo', fontSize: 16, color: '#ddd', textAlign: 'center', lineHeight: 24 },

  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  
  loginCard: { 
    width: '100%', 
    maxWidth: 400,
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 30,
    alignItems: 'stretch',
  },
  
  brandContainer: { alignItems: 'center', marginBottom: 25 },
  logoSquare: { width: 55, height: 55, backgroundColor: '#1d1d1f', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  brandTitle: { fontFamily: 'CairoBold', fontSize: 22, color: '#1d1d1f' },
  brandSubtitle: { fontFamily: 'Cairo', fontSize: 13, color: '#666' },

  form: { width: '100%', gap: 14, alignItems: 'stretch' },
  inputGroup: { width: '100%', gap: 4 },
  label: { fontFamily: 'CairoBold', fontSize: 13, color: '#1d1d1f', textAlign: 'right', marginRight: 4 },
  
  // Thin borders for inputs
  inputWrapper: { 
    width: '100%', 
    height: 48, 
    backgroundColor: '#fafafa', 
    borderRadius: 10, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15,
    borderWidth: StyleSheet.hairlineWidth, // Very thin border
    borderColor: '#ccc',
    overflow: 'hidden'
  },
  input: { 
    flex: 1, 
    height: '100%', 
    color: '#1d1d1f', 
    fontSize: 14, 
    fontFamily: 'Cairo', 
    textAlign: 'right', 
    marginRight: 10,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {})
  },
  
  // Black buttons
  loginBtn: { 
    width: '100%', 
    height: 54, 
    backgroundColor: '#1d1d1f', 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 10,
    alignSelf: 'stretch' 
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontFamily: 'CairoBold' },
  
  forgotBtn: { alignSelf: 'center', marginTop: 2 },
  forgotText: { color: '#1d1d1f', fontFamily: 'CairoBold', fontSize: 13 },
  
  footer: { marginTop: 25, alignItems: 'center', gap: 4 },
  footerText: { color: '#1d1d1f', fontSize: 11, fontFamily: 'CairoBold' },
  versionText: { color: '#86868b', fontSize: 10, fontFamily: 'Cairo' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 30, paddingBottom: 50 },
  modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontFamily: 'CairoBold', fontSize: 20, color: '#1d1d1f' },
  recoveryForm: { gap: 15 },
  inputRecovery: { 
    height: 54, 
    backgroundColor: '#fafafa', 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    textAlign: 'right', 
    fontFamily: 'Cairo', 
    fontSize: 16,
    color: '#1d1d1f',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {})
  },
  confirmBtn: { height: 54, backgroundColor: '#1d1d1f', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  confirmText: { color: '#fff', fontFamily: 'CairoBold', fontSize: 16 }
});
