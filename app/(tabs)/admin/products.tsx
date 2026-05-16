import { router } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { Colors } from '@/constants/theme';
import { getApiClient } from '@/services/api';
import * as ImagePicker from 'expo-image-picker';
import { Bell, Camera, Edit3, Filter, Image as ImageIcon, Plus, Search, Trash2, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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

interface ProductData {
  id: number;
  name: string;
  current_quantity: number;
  original_quantity: number;
  image_url: string;
  created_at?: string;
}

export default function ProfessionalProductSpreadsheet() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      const api = await getApiClient();
      const response = await api.get('/api/products');
      setProducts(response.data as ProductData[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'supervisor') {
      router.replace('/explore');
    }
  }, [user]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const pickImage = async () => {
    if (!isWeb) {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('فشل', 'يرجى منح صلاحية الوصول للمعرض لاختيار صورة');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setImageUrl(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
    }
  };

  const handleCreateOrUpdate = async () => {
    const qty = parseInt(quantity);
    if (!name || isNaN(qty) || qty < 0) {
      const msg = !name ? 'يرجى إدخال اسم المنتج' : 'يرجى إدخال كمية صحيحة (رقم)';
      if (isWeb) alert(msg);
      else Alert.alert('خطأ', msg);
      return;
    }

    setIsSubmitting(true);
    try {
      const api = await getApiClient();
      const payload = {
        name,
        original_quantity: parseInt(quantity),
        current_quantity: parseInt(quantity),
        image_url: imageUrl,
      };

      if (isEditing && selectedProductId) {
        await api.put(`/api/products/${selectedProductId}`, payload);
      } else {
        await api.post('/api/products', payload);
      }
      setModalVisible(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      if (isWeb) alert('فشلت العملية');
      else Alert.alert('خطأ', 'فشلت العملية');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    const performDelete = async () => {
      try {
        const api = await getApiClient();
        await api.delete(`/api/products/${id}`);
        fetchProducts();
        setModalVisible(false);
      } catch (error) {
        if (isWeb) alert('فشل الحذف');
        else Alert.alert('خطأ', 'فشل الحذف');
      }
    };

    if (isWeb) {
      if (confirm('هل أنت متأكد؟')) performDelete();
    } else {
      Alert.alert('تأكيد', 'حذف المنتج نهائياً؟', [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: performDelete }
      ]);
    }
  };

  const openEditModal = (product: ProductData) => {
    setIsEditing(true);
    setSelectedProductId(product.id);
    setName(product.name);
    setQuantity(product.original_quantity.toString());
    setImageUrl(product.image_url);
    setModalVisible(true);
  };

  const resetForm = () => {
    setIsEditing(false);
    setSelectedProductId(null);
    setName('');
    setQuantity('');
    setImageUrl('');
  };

  const filteredProducts = products.filter(p =>
    (p.name || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  const TableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.columnHeader, { flex: 0.5 }]}>إجراء</Text>
      <Text style={[styles.columnHeader, { flex: 0.8 }]}>التاريخ</Text>
      <Text style={styles.columnHeader}>الحالة</Text>
      <Text style={styles.columnHeader}>الكمية</Text>
      <Text style={[styles.columnHeader, { flex: 1.2, textAlign: 'right', paddingRight: 15 }]}>اسم المنتج</Text>
      <Text style={[styles.columnHeader, { flex: 0.8 }]}>صورة المنتج</Text>
    </View>
  );

  const TableRow = ({ item }: { item: ProductData }) => {
    const isOutOfStock = item.current_quantity <= 0;
    const isLowStock = !isOutOfStock && item.current_quantity <= (item.original_quantity * 0.2);
    
    let dateStr = '-';
    if (item.created_at) {
      try {
        const d = new Date(item.created_at);
        if (!isNaN(d.getTime())) {
          dateStr = d.toLocaleDateString('ar-EG');
        }
      } catch (e) {}
    }

    return (
      <View style={styles.tableRow}>
        <View style={styles.actionCell}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => openEditModal(item)}>
            <Edit3 size={15} color="#1d1d1f" />
          </TouchableOpacity>
        </View>

        <View style={[styles.cell, { flex: 0.8 }]}>
           <Text style={styles.cellTextSmall}>{dateStr}</Text>
        </View>

        <View style={styles.cell}>
          <View style={[styles.statusBadge, { backgroundColor: isOutOfStock ? '#ff3b3010' : (isLowStock ? '#ff950010' : '#34c75910') }]}>
            <Text style={[styles.statusText, { color: isOutOfStock ? '#ff3b30' : (isLowStock ? '#ff9500' : '#34c759') }]}>
              {isOutOfStock ? 'نفذ' : (isLowStock ? 'منخفض' : 'متوفر')}
            </Text>
          </View>
        </View>

        <View style={styles.cell}>
          <Text style={[styles.cellTextBold, isOutOfStock && { color: '#ff3b30' }]}>{item.current_quantity}</Text>
          <Text style={styles.cellTextSmall}>من {item.original_quantity}</Text>
        </View>
        
        <View style={[styles.cell, { flex: 1.2, alignItems: 'flex-end', paddingRight: 15 }]}>
          <Text style={styles.cellTextBold} numberOfLines={1}>{item.name}</Text>
        </View>

        <View style={[styles.cell, { flex: 0.8 }]}>
          <View style={styles.productThumbnailWrapper}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.productThumbnail} />
            ) : (
              <ImageIcon size={14} color="#86868b" />
            )}
          </View>
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
               <Plus size={18} color="#fff" strokeWidth={2.5} />
               <Text style={styles.addBtnText}>إضافة صنف</Text>
            </TouchableOpacity>
            <View style={styles.headerRow}>
              <View style={styles.titleBox}>
                <Text style={styles.headerTitle}>إدارة المنتجات</Text>
                <Text style={styles.headerSubtitle}>تحكم كامل في أصناف المخزن</Text>
              </View>
            </View>
          </View>

          <View style={styles.searchBar}>
            <View style={styles.searchInputWrapper}>
              <TextInput
                style={styles.searchInput}
                placeholder="بحث عن منتج..."
                placeholderTextColor="#86868b"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <Search size={18} color="#86868b" />
            </View>
          </View>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View style={styles.tableContainer}>
            <TableHeader />
            {loading ? (
              <ActivityIndicator style={{ marginTop: 20 }} color="#1d1d1f" />
            ) : (
              filteredProducts.length > 0 ? (
                filteredProducts.map((item) => (
                  <TableRow key={item.id.toString()} item={item} />
                ))
              ) : (
                <Text style={styles.emptyText}>لا يوجد منتجات حالياً</Text>
              )
            )}
          </View>
        </ScrollView>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isWeb && styles.webModal]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <X size={22} color="#1d1d1f" />
              </TouchableOpacity>
              <View style={styles.modalTitleBox}>
                 <Text style={styles.modalTitle}>{isEditing ? 'تعديل بيانات الصنف' : 'إضافة صنف جديد للمخزون'}</Text>
                 <Text style={styles.modalSubtitle}>يرجى إدخال تفاصيل المنتج والكمية للمتابعة</Text>
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>صورة المنتج</Text>
                <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.pickerPreview} />
                  ) : (
                    <View style={styles.pickerPlaceholder}>
                      <Camera size={28} color="#86868b" />
                      <Text style={styles.pickerText}>انقر لاختيار أو التقاط صورة</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>اسم المنتج بالكامل</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="مثال: إطار هانكوك مقاس 17"
                  placeholderTextColor="#86868b"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>الكمية الكلية المتوفرة</Text>
                <TextInput
                  style={styles.input}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#86868b"
                />
              </View>

              <View style={{ height: 20 }} />

              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateOrUpdate} disabled={isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                    <Plus size={20} color="#fff" strokeWidth={3} />
                    <Text style={styles.submitBtnText}>{isEditing ? 'حفظ التعديلات' : 'إضافة المنتج للمخزن'}</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              {isEditing && (
                <TouchableOpacity style={styles.deleteLink} onPress={() => handleDelete(selectedProductId!)}>
                  <Trash2 size={16} color="#ff3b30" />
                  <Text style={styles.deleteLinkText}>حذف هذا المنتج نهائياً من النظام</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
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
    justifyContent: 'center',
    gap: 8, 
    shadowColor: '#000', 
    shadowOpacity: 0.2, 
    shadowRadius: 15, 
    elevation: 6 
  },
  addBtnText: { color: '#fff', fontFamily: 'CairoBold', fontSize: 14 },
  
  searchBar: { marginBottom: 12, alignItems: 'flex-end' },
  searchInputWrapper: { 
    width: 210,
    height: 34, 
    backgroundColor: '#fff', 
    borderRadius: 8, 
    borderWidth: 1.5, 
    borderColor: '#1d1d1f', 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1
  },
  searchInput: { flex: 1, fontFamily: 'Cairo', fontSize: 12, textAlign: 'right' },

  tableContainer: { 
    backgroundColor: '#fff', 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: '#f2f2f7', 
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2
  },
  tableHeader: { flexDirection: 'row-reverse', backgroundColor: '#fbfbfd', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f2f2f7' },
  columnHeader: { flex: 1, fontFamily: 'CairoBold', fontSize: 11, color: '#86868b', textAlign: 'center' },
  tableRow: { flexDirection: 'row-reverse', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#fbfbfd', alignItems: 'center' },
  cell: { flex: 1, alignItems: 'center' },
  cellTextBold: { fontFamily: 'CairoBold', fontSize: 11, color: '#1d1d1f' },
  cellTextSmall: { fontFamily: 'Cairo', fontSize: 9, color: '#86868b' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontFamily: 'CairoBold', fontSize: 10 },
  actionCell: { flex: 0.5, flexDirection: 'row', justifyContent: 'center' },
  iconBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#f5f5f7', justifyContent: 'center', alignItems: 'center' },
  productThumbnailWrapper: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#f5f5f7', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#f2f2f7' },
  productThumbnail: { width: '100%', height: '100%' },

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
  imagePickerBtn: { 
    width: '100%', 
    height: 140, 
    backgroundColor: '#fbfbfd', 
    borderRadius: 20, 
    borderWidth: 1.5, 
    borderColor: '#f2f2f7', 
    borderStyle: 'dashed', 
    justifyContent: 'center', 
    alignItems: 'center', 
    overflow: 'hidden',
    marginBottom: 10
  },
  pickerPreview: { width: '100%', height: '100%' },
  pickerPlaceholder: { alignItems: 'center', gap: 4 },
  pickerText: { fontFamily: 'Cairo', fontSize: 12, color: '#86868b' },
  submitBtn: { 
    height: 60, 
    backgroundColor: '#1d1d1f', 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  submitBtnText: { color: '#fff', fontFamily: 'CairoBold', fontSize: 16 },
  deleteLink: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 25, paddingVertical: 10 },
  deleteLinkText: { color: '#ff3b30', fontFamily: 'CairoBold', fontSize: 13 },
  emptyText: { textAlign: 'center', fontFamily: 'Cairo', color: '#86868b', padding: 40 }
});
