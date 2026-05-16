import { router } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { Colors } from '@/constants/theme';
import { getApiClient } from '@/services/api';
import { Edit3, Plus, Search, Trash2, X, ShieldCheck, Bell } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const isWeb = Platform.OS === 'web';

interface UserData {
  id: number;
  username: string;
  full_name: string;
  role: string;
  security_answer?: string;
  password?: string;
  created_at?: string;
}

export default function ProfessionalUserSpreadsheet() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [role, setRole] = useState('employee');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const api = await getApiClient();
      const response = await api.get('/api/users');
      setUsers(response.data as UserData[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const { user } = useAuth();
  
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/explore');
    }
  }, [user]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateOrUpdate = async () => {
    if (!fullName || !username || (!isEditing && !password) || !securityAnswer) {
      if (isWeb) alert('يرجى إكمال البيانات');
      else Alert.alert('خطأ', 'يرجى إكمال كافة البيانات');
      return;
    }

    setIsSubmitting(true);
    try {
      const api = await getApiClient();
      const payload = { 
        full_name: fullName, 
        username, 
        role, 
        security_answer: securityAnswer,
        ...(password && { password }) 
      };
      
      if (isEditing && selectedUserId) {
        await api.put(`/api/users/${selectedUserId}`, payload);
        setModalVisible(false);
        resetForm();
        if (isWeb) alert('تم تحديث بيانات الموظف بنجاح');
      } else {
        await api.post('/api/users', payload);
        setModalVisible(false);
        resetForm();
        if (isWeb) alert('تم إنشاء حساب الموظف بنجاح');
      }
      
      await fetchUsers();
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || 'تعذر إتمام العملية، يرجى المحاولة لاحقاً';
      if (isWeb) alert(errorMessage);
      else Alert.alert('خطأ', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    const targetUser = users.find(u => u.id === id);
    if (targetUser?.username === 'admin') {
      const msg = 'لا يمكن حذف حساب المدير الرئيسي';
      isWeb ? alert(msg) : Alert.alert('تنبيه', msg);
      return;
    }

    const performDelete = async () => {
      try {
        const api = await getApiClient();
        await api.delete(`/api/users/${id}`);
        await fetchUsers();
        if (isWeb) alert('تم حذف المستخدم بنجاح');
      } catch (error) { 
        const msg = 'حدث خطأ أثناء محاولة الحذف';
        isWeb ? alert(msg) : Alert.alert('خطأ', msg);
      }
    };

    if (isWeb) {
      if (window.confirm(`هل أنت متأكد من حذف المستخدم "${targetUser?.full_name}"؟`)) {
        performDelete();
      }
    } else {
      Alert.alert('تأكيد الحذف', `هل أنت متأكد من حذف ${targetUser?.full_name}؟`, [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف نهائي', style: 'destructive', onPress: performDelete }
      ]);
    }
  };

  const openEditModal = (user: UserData) => {
    setIsEditing(true);
    setSelectedUserId(user.id);
    setFullName(user.full_name);
    setUsername(user.username);
    setRole(user.role);
    setSecurityAnswer(user.security_answer || '');
    setPassword(''); // Reset password field during edit
    setModalVisible(true);
  };

  const resetForm = () => {
    setIsEditing(false);
    setFullName('');
    setUsername('');
    setPassword('123'); // Default password for new users
    setSecurityAnswer('');
    setRole('employee');
  };

  const TableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.columnHeader, { flex: 0.5 }]}>إجراء</Text>
      <Text style={[styles.columnHeader, { flex: 1 }]}>التاريخ</Text>
      <Text style={styles.columnHeader}>الصلاحية</Text>
      <Text style={[styles.columnHeader, { flex: 2, textAlign: 'right', paddingRight: 40 }]}>الموظف</Text>
    </View>
  );

  const TableRow = ({ item }: { item: UserData }) => {
    let dateStr = '-';
    if (item.created_at) {
      try {
        const d = new Date(item.created_at);
        if (!isNaN(d.getTime())) {
          dateStr = d.toLocaleDateString('ar-EG');
        }
      } catch (e) {}
    }
    if (!isWeb) {
      return (
        <View style={styles.mobileCard}>
          <View style={styles.mobileCardTop}>
            <View style={[styles.roleBadge, { backgroundColor: item.role === 'admin' ? '#0071e310' : (item.role === 'supervisor' ? '#34c75910' : '#f5f5f7') }]}>
              <Text style={[styles.roleText, { color: item.role === 'admin' ? '#0071e3' : (item.role === 'supervisor' ? '#34c759' : '#86868b') }]}>
                {item.role === 'admin' ? 'مدير' : (item.role === 'supervisor' ? 'مشرف' : 'موظف')}
              </Text>
            </View>
            <View style={styles.mobileUserInfo}>
              <Text style={styles.cellTextBold}>{item.full_name}</Text>
              <Text style={styles.cellTextMeta}>@{item.username}</Text>
            </View>
          </View>
          
          <View style={styles.mobileCardBottom}>
            <View style={styles.mobileActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => openEditModal(item)}>
                <Edit3 size={15} color="#1d1d1f" />
              </TouchableOpacity>
              {item.username !== 'admin' && (
                <TouchableOpacity style={[styles.iconBtn, { marginLeft: 8 }]} onPress={() => handleDelete(item.id)}>
                  <Trash2 size={15} color="#ff3b30" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.cellTextSmall}>البدء: {dateStr}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.tableRow}>
        <View style={styles.actionCell}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => openEditModal(item)}>
            <Edit3 size={15} color="#1d1d1f" />
          </TouchableOpacity>
          {item.username !== 'admin' && (
            <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item.id)}>
              <Trash2 size={15} color="#1d1d1f" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={[styles.cell, { flex: 1 }]}>
          <Text style={styles.cellTextSmall}>{dateStr}</Text>
        </View>

        <View style={styles.cell}>
          <View style={[styles.roleBadge, { backgroundColor: item.role === 'admin' ? '#0071e310' : (item.role === 'supervisor' ? '#34c75910' : '#f5f5f7') }]}>
            <Text style={[styles.roleText, { color: item.role === 'admin' ? '#0071e3' : (item.role === 'supervisor' ? '#34c759' : '#86868b') }]}>
              {item.role === 'admin' ? 'مدير' : (item.role === 'supervisor' ? 'مشرف' : 'موظف')}
            </Text>
          </View>
        </View>
        
        <View style={[styles.cell, { flex: 2, alignItems: 'flex-end', paddingRight: 10 }]}>
          <Text style={styles.cellTextBold} numberOfLines={1}>{item.full_name}</Text>
          <Text style={styles.cellTextMeta}>@{item.username}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.maxContainer}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setModalVisible(true); }}>
              <Plus size={18} color="#fff" />
              <Text style={styles.addBtnText}>إضافة مستخدم</Text>
            </TouchableOpacity>
            <View style={styles.headerRow}>
            </View>
            <View style={styles.titleBox}>
              <Text style={styles.headerTitle}>شؤون الموظفين</Text>
              <Text style={styles.headerSubtitle}>إدارة الوصول والصلاحيات</Text>
            </View>
          </View>

          <View style={styles.searchBar}>
            <View style={styles.searchInputWrapper}>
              <TextInput
                style={styles.searchInput}
                placeholder="بحث باسم الموظف..."
                placeholderTextColor="#86868b"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <Search size={18} color="#86868b" />
            </View>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.tableContainer}>
            <TableHeader />
            {loading ? <ActivityIndicator style={{marginTop:20}} /> : (
              <FlatList
                data={users.filter(u => u.full_name.toLowerCase().includes(searchQuery.toLowerCase()))}
                renderItem={({ item }) => <TableRow item={item} />}
                keyExtractor={item => item.id.toString()}
                scrollEnabled={false}
                extraData={refreshKey}
              />
            )}
          </View>
        </ScrollView>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%', maxWidth: 500, alignSelf: 'center' }}
          >
            <View style={[styles.modalContent, isWeb && styles.webModal]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                  <X size={22} color="#1d1d1f" />
                </TouchableOpacity>
                <View style={styles.modalTitleBox}>
                   <Text style={styles.modalTitle}>{isEditing ? 'تعديل بيانات الحساب' : 'إضافة حساب موظف جديد'}</Text>
                   <Text style={styles.modalSubtitle}>يرجى إدخال كافة البيانات المطلوبة لضمان الوصول</Text>
                </View>
              </View>

              <ScrollView 
                contentContainerStyle={[styles.form, { paddingBottom: 40 }]} 
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>الاسم الكامل</Text>
                  <TextInput 
                    style={styles.input} 
                    value={fullName} 
                    onChangeText={setFullName} 
                    placeholder="مثال: أحمد محمد علي"
                    placeholderTextColor="#86868b"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>اسم المستخدم (Username)</Text>
                  <TextInput 
                    style={styles.input} 
                    value={username} 
                    onChangeText={setUsername} 
                    autoCapitalize="none" 
                    placeholder="ahmed_store"
                    placeholderTextColor="#86868b"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>اسم الأم (لسؤال الأمان)</Text>
                  <TextInput 
                    style={styles.input} 
                    value={securityAnswer} 
                    onChangeText={setSecurityAnswer} 
                    placeholder="يستخدم لاستعادة كلمة المرور"
                    placeholderTextColor="#86868b"
                  />
                </View>

                {!isEditing && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>كلمة المرور الابتدائية</Text>
                    <TextInput 
                      style={styles.input} 
                      value={password} 
                      onChangeText={setPassword} 
                      placeholder="افتراضياً: 123"
                      placeholderTextColor="#86868b"
                      secureTextEntry
                    />
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>تحديد الصلاحيات</Text>
                  <View style={styles.roleGrid}>
                    <TouchableOpacity style={[styles.roleBtn, role === 'admin' && styles.activeRole]} onPress={() => setRole('admin')}>
                      <Text style={[styles.roleBtnText, role === 'admin' && styles.activeRoleText]}>مدير</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.roleBtn, role === 'supervisor' && styles.activeRole]} onPress={() => setRole('supervisor')}>
                      <Text style={[styles.roleBtnText, role === 'supervisor' && styles.activeRoleText]}>مشرف</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.roleBtn, role === 'employee' && styles.activeRole]} onPress={() => setRole('employee')}>
                      <Text style={[styles.roleBtnText, role === 'employee' && styles.activeRoleText]}>موظف</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={handleCreateOrUpdate} disabled={isSubmitting}>
                  {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{isEditing ? 'حفظ التغييرات' : 'إنشاء الحساب'}</Text>}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fbfbfd' },
  maxContainer: { 
    flex: 1, 
    width: '100%',
    maxWidth: isWeb ? 1100 : '100%',
    alignSelf: 'center',
    paddingHorizontal: isWeb ? 40 : 16, 
    paddingTop: isWeb ? 60 : 135 
  },
  header: { marginBottom: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  titleBox: { alignItems: 'flex-end' },
  headerTitle: { fontFamily: 'CairoBold', fontSize: 20, color: '#1d1d1f' },
  headerSubtitle: { fontFamily: 'Cairo', fontSize: 13, color: '#86868b' },
  headerBellBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1.2,
    borderColor: '#d2d2d7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: { 
    backgroundColor: '#1d1d1f', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 12, 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    gap: 6, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 5, 
    elevation: 3 
  },
  addBtnText: { color: '#fff', fontFamily: 'CairoBold', fontSize: 13 },
  
  searchBar: { marginBottom: 15, alignItems: 'flex-end' },
  searchInputWrapper: { 
    width: isWeb ? 280 : '60%',
    height: 34, 
    backgroundColor: '#fff', 
    borderRadius: 8, 
    borderWidth: 1.5, 
    borderColor: '#d2d2d7', 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5
  },
  searchInput: { flex: 1, fontFamily: 'Cairo', fontSize: 13, textAlign: 'right' },

  tableContainer: { 
    backgroundColor: '#fff', 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: '#f2f2f7', 
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
    marginBottom: isWeb ? 0 : 20, // Space between cards on mobile
  },
  mobileCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
  },
  mobileCardTop: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mobileUserInfo: {
    alignItems: 'flex-end',
  },
  mobileCardBottom: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mobileActions: {
    flexDirection: 'row',
  },
  tableHeader: { flexDirection: 'row-reverse', backgroundColor: '#fbfbfd', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f2f2f7', display: isWeb ? 'flex' : 'none' },
  columnHeader: { flex: 1, fontFamily: 'CairoBold', fontSize: 11, color: '#86868b', textAlign: 'center' },
  tableRow: { flexDirection: 'row-reverse', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#fbfbfd', alignItems: 'center' },
  cell: { flex: 1, alignItems: 'center' },
  cellTextBold: { fontFamily: 'CairoBold', fontSize: 12, color: '#1d1d1f' },
  cellTextSmall: { fontFamily: 'Cairo', fontSize: 10, color: '#1d1d1f' },
  cellTextMeta: { fontFamily: 'Cairo', fontSize: 9, color: '#86868b' },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  actionCell: { flex: 0.5, flexDirection: 'row-reverse', justifyContent: 'center', gap: 10 },
  iconBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#f5f5f7', justifyContent: 'center', alignItems: 'center' },
  roleText: { fontFamily: 'CairoBold', fontSize: 11 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: isWeb ? 'center' : 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 25 },
  webModal: { maxWidth: 500, alignSelf: 'center', borderRadius: 24 },
  modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  modalTitleBox: { alignItems: 'flex-end', flex: 1 },
  modalTitle: { fontFamily: 'CairoBold', fontSize: 18, color: '#1d1d1f' },
  modalSubtitle: { fontFamily: 'Cairo', fontSize: 12, color: '#86868b', marginTop: 2 },
  closeBtn: { padding: 4, marginLeft: 10 },
  form: { gap: 12 },
  inputGroup: { gap: 4 },
  label: { fontFamily: 'CairoBold', fontSize: 12, textAlign: 'right' },
  input: { 
    height: 52, 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    textAlign: 'right', 
    fontFamily: 'Cairo', 
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: '#f2f2f7'
  },
  roleGrid: { flexDirection: 'row', gap: 8 },
  roleBtn: { flex: 1, height: 40, backgroundColor: '#f5f5f7', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  activeRole: { backgroundColor: '#1d1d1f' },
  roleBtnText: { fontFamily: 'CairoBold', fontSize: 12, color: '#1d1d1f' },
  activeRoleText: { color: '#fff' },
  submitBtn: { height: 48, backgroundColor: '#1d1d1f', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#fff', fontFamily: 'CairoBold', fontSize: 14 }
});
