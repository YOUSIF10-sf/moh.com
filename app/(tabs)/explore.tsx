/**
 * explore.tsx — شاشة المخزن
 * ✅ يستخدم AppContext بدلاً من module-level cache
 * ✅ debounced search
 * ✅ Skeleton موحد
 * ✅ Toast بدلاً من Alert
 * ✅ TypeScript نظيف
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Archive, Search, ShoppingBag, X } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useProducts, useToast } from '@/context/AppContext';
import { ProductCardSkeleton } from '@/components/Skeleton';
import { StorageService, type Product } from '@/services/storage';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// ─── Debounce utility ─────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Product Card ─────────────────────────────────────────────────────────────

const ProductCard = React.memo(({ item, index, onPress }: { item: Product; index: number; onPress: () => void }) => {
  const isOutOfStock = item.current_quantity <= 0;

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 40, 400)).springify()}>
      <TouchableOpacity
        style={[styles.card, isWeb && styles.webCard]}
        onPress={onPress}
        activeOpacity={0.75}
        disabled={isOutOfStock}
      >
        <View style={[styles.imageContainer, isOutOfStock && { opacity: 0.4 }]}>
          {item.image_url ? (
            <ExpoImage
              source={{ uri: item.image_url }}
              style={styles.productImage}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
          ) : (
            <ShoppingBag size={20} color="#d2d2d7" />
          )}
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.stockValue, isOutOfStock && { color: '#FF3B30', fontFamily: 'CairoBold' }]}>
            {isOutOfStock ? 'نفد المخزون' : `المتوفر: ${item.current_quantity}`}
          </Text>
          <View style={[styles.withdrawBtn, isOutOfStock && styles.withdrawBtnDisabled]}>
            <Archive size={13} color={isOutOfStock ? '#86868b' : '#fff'} />
            <Text style={[styles.withdrawBtnText, isOutOfStock && { color: '#86868b' }]}>
              {isOutOfStock ? 'غير متاح' : 'سحب'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const { products, loading, refresh } = useProducts();
  const showToast = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [withdrawQty, setWithdrawQty] = useState('1');
  const [withdrawNote, setWithdrawNote] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const debouncedSearch = useDebounce(searchQuery);

  // Load on first focus
  useFocusEffect(
    useCallback(() => {
      if (products.length === 0) refresh();
    }, [products.length, refresh])
  );

  const filteredProducts = useMemo(() =>
    debouncedSearch.trim()
      ? products.filter(p => p.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
      : products,
    [products, debouncedSearch]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const openWithdraw = useCallback((product: Product) => {
    setSelectedProduct(product);
    setWithdrawQty('1');
    setWithdrawNote('');
  }, []);

  const closeModal = useCallback(() => setSelectedProduct(null), []);

  const executeWithdraw = useCallback(async () => {
    if (!selectedProduct) return;
    const qty = parseInt(withdrawQty, 10);

    if (isNaN(qty) || qty < 1) {
      showToast('أدخل كمية صحيحة', 'warning');
      return;
    }
    if (qty > selectedProduct.current_quantity) {
      showToast(`الكمية المتاحة فقط: ${selectedProduct.current_quantity}`, 'warning');
      return;
    }
    if (withdrawNote.trim().length < 3) {
      showToast('يرجى كتابة سبب السحب (3 أحرف على الأقل)', 'warning');
      return;
    }

    setIsWithdrawing(true);
    try {
      await StorageService.withdraw(selectedProduct.id, qty, withdrawNote.trim());
      showToast(`تم سحب ${qty} من "${selectedProduct.name}" بنجاح`, 'success');
      closeModal();
      refresh(); // تحديث الكاش
    } catch (e: any) {
      showToast(e.message || 'فشلت عملية السحب', 'error');
    } finally {
      setIsWithdrawing(false);
    }
  }, [selectedProduct, withdrawQty, withdrawNote, showToast, closeModal, refresh]);

  const skeletonData = useMemo(() => Array.from({ length: 10 }, (_, i) => i), []);

  return (
    <View style={styles.container}>
      <View style={styles.maxContainer}>
        <FlatList
          data={(loading ? skeletonData : filteredProducts) as any}
          renderItem={loading
            ? ({ index }) => <ProductCardSkeleton key={index} isWeb={isWeb} />
            : ({ item, index }) => (
              <ProductCard
                item={item as Product}
                index={index}
                onPress={() => openWithdraw(item as Product)}
              />
            )
          }
          keyExtractor={(item, index) =>
            loading ? `skel-${index}` : String((item as Product).id)
          }
          key={isWeb ? 'web-grid' : 'mob-grid'}
          numColumns={isWeb ? 5 : 2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.headerTitle}>المخزن</Text>
              <View style={styles.searchBox}>
                <TextInput
                  style={styles.searchInput as any}
                  placeholder="بحث عن منتج..."
                  placeholderTextColor="#86868b"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <Search size={17} color="#86868b" />
              </View>
            </View>
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyBox}>
                <ShoppingBag size={36} color="#d2d2d7" />
                <Text style={styles.emptyText}>
                  {debouncedSearch ? 'لا توجد نتائج' : 'لا توجد منتجات في المخزن'}
                </Text>
              </View>
            ) : null
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS !== 'web'}
        />
      </View>

      {/* Withdraw Modal */}
      <Modal visible={!!selectedProduct} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            enabled={Platform.OS !== 'web'}
            style={isWeb ? styles.webModalWrapper : { width: '100%' }}
          >
            <View style={[styles.modalContent, isWeb && styles.webModal]}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closeModal} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <X size={22} color="#86868b" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>تأكيد السحب</Text>
              </View>

              {/* Product name */}
              <Text style={styles.modalProduct}>{selectedProduct?.name}</Text>
              <Text style={styles.modalAvail}>الكمية المتاحة: {selectedProduct?.current_quantity}</Text>

              {/* Quantity */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>الكمية المطلوبة</Text>
                <TextInput
                  style={styles.input as any}
                  keyboardType="number-pad"
                  value={withdrawQty}
                  onChangeText={setWithdrawQty}
                  placeholderTextColor="#86868b"
                />
              </View>

              {/* Note */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>سبب السحب <Text style={{ color: '#FF3B30' }}>*</Text></Text>
                <TextInput
                  style={[styles.input, { height: 90, textAlignVertical: 'top', paddingTop: 10 }] as any}
                  multiline
                  numberOfLines={4}
                  value={withdrawNote}
                  onChangeText={setWithdrawNote}
                  placeholder="اكتب سبب السحب بوضوح..."
                  placeholderTextColor="#86868b"
                />
              </View>

              <TouchableOpacity
                style={[styles.confirmBtn, isWithdrawing && { opacity: 0.7 }]}
                onPress={executeWithdraw}
                disabled={isWithdrawing}
              >
                {isWithdrawing
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.confirmText}>تأكيد السحب</Text>
                }
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fbfbfd' },
  maxContainer: { flex: 1, width: '100%', maxWidth: isWeb ? 1100 : '100%', alignSelf: 'center' },

  header: { paddingHorizontal: 16, marginBottom: 10, alignItems: 'flex-end' },
  headerTitle: { fontFamily: 'CairoBold', fontSize: 20, color: '#1d1d1f', textAlign: 'right' },
  searchBox: {
    alignSelf: 'flex-end',
    width: 220,
    height: 36,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#1d1d1f',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 8,
    ...(isWeb ? ({ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } as any) : {
      shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    }),
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Cairo',
    fontSize: 13,
    textAlign: 'right' as const,
    color: '#1d1d1f',
    ...(isWeb ? { outlineStyle: 'none' as any } : {}),
  },

  listContainer: { paddingHorizontal: 8, paddingTop: isWeb ? 10 : 135, paddingBottom: 100 },
  columnWrapper: { flexDirection: 'row-reverse', justifyContent: 'flex-start', gap: 10, marginBottom: 10 },

  card: {
    width: (width - 48) / 2,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 6,
    ...(isWeb ? ({ boxShadow: '0 6px 20px rgba(0,0,0,0.07)' } as any) : {}),
  },
  webCard: { width: 160, margin: 10, padding: 14 },
  imageContainer: { width: '100%', height: 55, backgroundColor: '#f5f5f7', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  productImage: { width: '100%', height: '100%', borderRadius: 10 },
  cardContent: { width: '100%', alignItems: 'center', gap: 4 },
  productName: { fontFamily: 'CairoBold', fontSize: 12, color: '#1d1d1f' },
  stockValue: { fontFamily: 'Cairo', fontSize: 10, color: '#86868b' },
  withdrawBtn: {
    width: '100%',
    height: 30,
    backgroundColor: '#1d1d1f',
    borderRadius: 8,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  withdrawBtnDisabled: { backgroundColor: '#f5f5f7' },
  withdrawBtnText: { fontFamily: 'CairoBold', fontSize: 11, color: '#fff' },

  emptyBox: { alignItems: 'center', paddingTop: 80, gap: 14 },
  emptyText: { fontFamily: 'Cairo', fontSize: 16, color: '#86868b' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: isWeb ? 'center' : 'flex-end',
    alignItems: 'center',
  },
  webModalWrapper: { width: 460, alignItems: 'center' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    width: '100%',
    ...(isWeb ? ({ boxShadow: '0 20px 60px rgba(0,0,0,0.2)', borderRadius: 24 } as any) : {}),
  },
  webModal: { width: 460, borderRadius: 24 },
  modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { fontFamily: 'CairoBold', fontSize: 18, color: '#1d1d1f' },
  modalProduct: { fontFamily: 'CairoBold', fontSize: 16, color: Colors.primary, textAlign: 'center', marginBottom: 4 },
  modalAvail: { fontFamily: 'Cairo', fontSize: 13, color: '#86868b', textAlign: 'center', marginBottom: 20 },
  inputGroup: { gap: 6, marginBottom: 14 },
  label: { fontFamily: 'CairoBold', fontSize: 12, color: '#86868b', textAlign: 'right' },
  input: {
    height: 46,
    backgroundColor: '#f5f5f7',
    borderRadius: 12,
    paddingHorizontal: 14,
    textAlign: 'right',
    fontFamily: 'Cairo',
    fontSize: 14,
    color: '#1d1d1f',
    borderWidth: 1,
    borderColor: 'transparent',
    ...(isWeb ? { outlineStyle: 'none' as any } : {}),
  },
  confirmBtn: {
    height: 50,
    backgroundColor: '#1d1d1f',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  confirmText: { color: '#fff', fontFamily: 'CairoBold', fontSize: 16 },
});
