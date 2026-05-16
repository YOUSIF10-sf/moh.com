import { router } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { Colors } from '@/constants/theme';
import { getApiClient } from '@/services/api';
import { Download, Edit2, Search, X, Printer, Trash2 } from 'lucide-react-native';
import * as Print from 'expo-print';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Alert
} from 'react-native';

const isWeb = Platform.OS === 'web';

interface Log {
  id: number;
  product_name: string;
  quantity: number;
  note: string;
  employee_name: string;
  created_at: string;
  username: string;
}

export default function ProfessionalWithdrawalSpreadsheet() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Log>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogs = async () => {
    try {
      const api = await getApiClient();
      const response = await api.get('/api/logs/all');
      setLogs(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (err) {
      setError('فشل تحميل السجلات.');
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
    fetchLogs();
  }, []);

  const startEdit = (item: Log) => {
    setSelectedLog(item);
    setEditForm({ quantity: item.quantity, note: item.note });
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    if (!selectedLog) return;
    setSavingEdit(true);
    try {
      const api = await getApiClient();
      await api.post(`/api/logs/${selectedLog.id}`, editForm);
      await fetchLogs();
      setEditModalVisible(false);
      if (isWeb) alert('تم تحديث العملية بنجاح');
      else Alert.alert('نجاح', 'تم تحديث العملية بنجاح');
    } catch (err) {
      setError('فشل الحفظ.');
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteLog = async (item: Log) => {
    const confirmed = isWeb
      ? window.confirm('هل تريد حذف عملية السحب هذه؟ سيتم إرجاع الكمية إلى المخزون.')
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'تأكيد الحذف',
            'هل تريد حذف عملية السحب هذه؟ سيتم إرجاع الكمية إلى المخزون.',
            [
              { text: 'إلغاء', style: 'cancel', onPress: () => resolve(false) },
              { text: 'حذف', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmed) return;

    setDeletingId(item.id);
    try {
      const api = await getApiClient();
      await api.delete(`/api/logs/${item.id}`);
      await fetchLogs();
      if (isWeb) alert('تم حذف العملية وإرجاع الكمية للمخزون');
      else Alert.alert('نجاح', 'تم حذف العملية وإرجاع الكمية للمخزون');
    } catch (err) {
      setError('فشل حذف العملية.');
    } finally {
      setDeletingId(null);
    }
  };

  const printReceipt = async (log: Log) => {
    const style = `
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
      @page { size: A4; margin: 15mm; }
      body { 
        font-family: 'Cairo', sans-serif; 
        color: #1d1d1f; 
        direction: rtl; 
        background-color: #fff;
        margin: 0;
        padding: 0;
        font-size: 12px;
      }
      .page {
        width: 100%;
        padding: 0;
      }
      .header {
        text-align: center;
        border-bottom: 1.5px solid #1d1d1f;
        padding-bottom: 10px;
        margin-bottom: 20px;
      }
      .header h1 { margin: 0; font-size: 18px; color: #1d1d1f; }
      .header p { margin: 2px 0 0; color: #86868b; font-size: 11px; }
      
      .doc-title {
        text-align: center;
        background: #f5f5f7;
        padding: 6px;
        border-radius: 6px;
        margin-bottom: 20px;
      }
      .doc-title h2 { margin: 0; font-size: 16px; }

      .info-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 20px;
      }
      .info-item {
        border-bottom: 1px solid #eee;
        padding: 5px 0;
        display: flex;
        justify-content: space-between;
      }
      .label { font-weight: 700; color: #86868b; font-size: 11px; }
      .value { font-weight: 700; color: #1d1d1f; font-size: 11px; }

      .pledge-box {
        border: 1.5px dashed #d2d2d7;
        padding: 15px;
        border-radius: 8px;
        margin: 25px 0;
        background: #fff;
      }
      .pledge-title { font-weight: 700; margin-bottom: 8px; display: block; border-bottom: 1px solid #eee; padding-bottom: 4px; font-size: 13px; }
      .pledge-text { line-height: 1.6; font-size: 12px; text-align: justify; }

      .signatures {
        margin-top: 40px;
        display: flex;
        justify-content: space-between;
      }
      .sig-block {
        text-align: center;
        width: 180px;
      }
      .sig-line {
        margin-top: 40px;
        border-top: 1px solid #1d1d1f;
        padding-top: 8px;
        font-weight: 700;
        font-size: 11px;
      }
      
      @media print {
        body { background: white; width: 100%; }
        .page { box-shadow: none; border: none; }
      }
    `;

    const htmlContent = `
      <html>
        <head><style>${style}</style></head>
        <body>
          <div class="page">
            <div class="header">
              <h1>المستودع الذكي لإدارة المعدات</h1>
              <p>نظام ضبط المخزون والعهد الشخصية</p>
            </div>

            <div class="doc-title">
              <h2>مستند استلام عهـدة</h2>
            </div>
            
            <div class="info-section">
              <div class="info-item">
                <span class="label">رقم المستند:</span>
                <span class="value">#${log.id}</span>
              </div>
              <div class="info-item">
                <span class="label">التاريخ:</span>
                <span class="value">${formatDate(log.created_at)}</span>
              </div>
              <div class="info-item">
                <span class="label">اسم الموظف:</span>
                <span class="value">${log.employee_name || '---'}</span>
              </div>
              <div class="info-item">
                <span class="label">الاسم الكامل:</span>
                <span class="value">${log.employee_name || '---'}</span>
              </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
              <thead>
                <tr style="background: #1d1d1f; color: white;">
                  <th style="padding: 8px; border: 1px solid #1d1d1f; text-align: right;">المادة / العهدة</th>
                  <th style="padding: 8px; border: 1px solid #1d1d1f; text-align: center;">الكمية</th>
                  <th style="padding: 8px; border: 1px solid #1d1d1f; text-align: right;">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 10px; border: 1px solid #eee; text-align: right; font-weight: 700;">${log.product_name}</td>
                  <td style="padding: 10px; border: 1px solid #eee; text-align: center; font-weight: 700;">${log.quantity} وحدة</td>
                  <td style="padding: 10px; border: 1px solid #eee; text-align: right; color: #86868b;">${log.note || '---'}</td>
                </tr>
              </tbody>
            </table>

            <div class="pledge-box">
              <span class="pledge-title">إقرار وتعهد بالاستلام</span>
              <p class="pledge-text">
                أقر أنا الموقع أدناه بأنني قد استلمت المواد المذكورة أعلاه بصفة عُهدة عمل شخصية، 
                وأتعهد بالمحافظة عليها واستخدامها في أغراض العمل المخصصة لها فقط. 
                كما أتعهد بإعادة هذه العُهدة بحالتها التشغيلية الأصلية إلى الشركة في حال طُلب مني ذلك من قبل الإدارة، 
                أو عند انتهاء علاقتي التعاقدية مع الشركة لأي سبب كان، وفي حال فقدانها أو تضررها نتيجة الإهمال، فإنني أتحمل المسؤولية كاملة عن ذلك.
              </p>
            </div>

            <div class="signatures">
              <div class="sig-block">
                <p>توقيع أمين المستودع</p>
                <div class="sig-line">إدارة المخازن الرئيسي</div>
              </div>
              
              <div class="sig-block">
                <p>توقيع الموظف المستلم</p>
                <div class="sig-line">${log.employee_name || '---'}</div>
              </div>
            </div>

            <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 8px;">
              صادر عن نظام المستودع الذكي
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      if (isWeb) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 500);
        }
      } else {
        await Print.printAsync({ html: htmlContent });
      }
    } catch (error) {
      console.error('Print error:', error);
    }
  };

  const exportToCSV = () => {
    if (!isWeb) return;
    const headers = 'ID,Product,Quantity,Employee,Date,Note\n';
    const rows = logs.map(l => 
      `${l.id},"${l.product_name}",${l.quantity},"${l.employee_name}","${l.created_at}","${l.note || ''}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `withdrawals_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter(l => {
    const pName = (l.product_name || '').toLowerCase();
    const eName = (l.employee_name || '').toLowerCase();
    const uName = (l.username || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    
    const logDate = new Date(l.created_at);
    let isAfterStart = true;
    let isBeforeEnd = true;

    if (startDate) {
      const s = new Date(startDate);
      s.setHours(0,0,0,0);
      isAfterStart = logDate >= s;
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23,59,59,999);
      isBeforeEnd = logDate <= e;
    }

    const matchesSearch = pName.includes(query) || eName.includes(query) || uName.includes(query);
    return matchesSearch && isAfterStart && isBeforeEnd;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '---';
    try {
      const date = new Date(dateString.replace(' ', 'T'));
      return date.toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return dateString; }
  };

  const TableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.columnHeader, { flex: 0.4 }]}>حذف</Text>
      <Text style={[styles.columnHeader, { flex: 0.4 }]}>-</Text>
      <Text style={[styles.columnHeader, { flex: 0.4 }]}>طباعة</Text>
      <Text style={[styles.columnHeader, { flex: 1.5 }]}>السبب</Text>
      <Text style={styles.columnHeader}>المستلم</Text>
      <Text style={styles.columnHeader}>التاريخ</Text>
      <Text style={styles.columnHeader}>الكمية</Text>
      <Text style={[styles.columnHeader, { flex: 1.5, textAlign: 'right', paddingRight: 20 }]}>المنتج</Text>
    </View>
  );

  const TableRow = ({ item }: { item: Log }) => {
    if (!isWeb) {
      return (
        <View style={styles.mobileCard}>
          <View style={styles.mobileCardHeader}>
            <View style={styles.mobileProductInfo}>
              <Text style={styles.cellTextBold}>{item.product_name}</Text>
              <Text style={[styles.cellTextBold, { color: '#34c759' }]}>{item.quantity} وحدة</Text>
            </View>
            <TouchableOpacity onPress={() => printReceipt(item)} style={styles.printBtn}>
              <Printer size={14} color="#0071e3" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.mobileCardDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>المستلم:</Text>
              <Text style={styles.detailValue}>{item.employee_name}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>التاريخ:</Text>
              <Text style={styles.detailValueSmall}>{formatDate(item.created_at)}</Text>
            </View>
          </View>

          {item.note && (
            <View style={styles.mobileNoteBox}>
              <Text style={styles.noteLabel}>السبب: </Text>
              <Text style={styles.noteText} numberOfLines={1}>{item.note}</Text>
            </View>
          )}

          <TouchableOpacity onPress={() => startEdit(item)} style={styles.mobileEditBtn}>
            <Edit2 size={12} color="#86868b" />
            <Text style={styles.editBtnText}>تعديل السجل</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => deleteLog(item)}
            style={styles.mobileDeleteBtn}
            disabled={deletingId === item.id}
          >
            {deletingId === item.id ? (
              <ActivityIndicator size="small" color="#d70015" />
            ) : (
              <>
                <Trash2 size={12} color="#d70015" />
                <Text style={styles.deleteBtnText}>حذف السجل</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.tableRow}>
        <View style={[styles.cell, { flex: 0.4 }]}>
          <TouchableOpacity
            onPress={() => deleteLog(item)}
            style={styles.deleteBtn}
            disabled={deletingId === item.id}
          >
            {deletingId === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Trash2 size={12} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
        <View style={[styles.cell, { flex: 0.4 }]}>
          <TouchableOpacity onPress={() => startEdit(item)} style={styles.editBtn}>
            <Edit2 size={12} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={[styles.cell, { flex: 0.4 }]}>
          <TouchableOpacity onPress={() => printReceipt(item)}>
            <Printer size={16} color="#0071e3" />
          </TouchableOpacity>
        </View>
        <View style={[styles.cell, { flex: 1.5, alignItems: 'center' }]}>
          <Text style={styles.cellTextSmaller} numberOfLines={1}>{item.note || '---'}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellTextSmall} numberOfLines={1}>{item.employee_name}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellTextSmaller}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={[styles.cellTextBold, { color: '#34c759' }]}>{item.quantity}</Text>
        </View>
        <View style={[styles.cell, { flex: 1.5, alignItems: 'flex-end', paddingRight: 20 }]}>
          <Text style={styles.cellTextBold} numberOfLines={1}>{item.product_name}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.maxContainer}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {isWeb && (
              <TouchableOpacity style={styles.exportBtn} onPress={exportToCSV}>
                <Download size={16} color="#1d1d1f" />
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle}>سجل العمليات</Text>
          </View>
          <View style={styles.searchInputWrapper}>
            <TextInput 
              style={styles.searchInput} 
              placeholder="البحث عن طريق اسم الموظف..." 
              value={searchQuery} 
              onChangeText={setSearchQuery} 
            />
            <Search size={16} color="#86868b" />
          </View>

          <View style={styles.filterRow}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>من:</Text>
              {isWeb ? (
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{...webInputStyle}}
                />
              ) : (
                <TextInput style={styles.dateTextIn} placeholder="YYYY-MM-DD" value={startDate} onChangeText={setStartDate} />
              )}
            </View>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>إلى:</Text>
               {isWeb ? (
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{...webInputStyle}}
                />
              ) : (
                <TextInput style={styles.dateTextIn} placeholder="YYYY-MM-DD" value={endDate} onChangeText={setEndDate} />
              )}
            </View>
            {(startDate || endDate) && (
              <TouchableOpacity onPress={() => { setStartDate(''); setEndDate(''); }}>
                <Text style={styles.clearFilter}>مسح</Text>
              </TouchableOpacity>
            )}
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.tableContainer}>
            <TableHeader />
            {loading ? <ActivityIndicator style={{marginTop:20}} color="#1d1d1f" /> : (
              <FlatList
                data={filteredLogs}
                renderItem={({ item }) => <TableRow item={item} />}
                keyExtractor={item => item.id?.toString()}
                scrollEnabled={false}
                ListEmptyComponent={<Text style={styles.emptyText}>لا يوجد</Text>}
              />
            )}
          </View>
        </ScrollView>
      </View>

      {/* Edit Log Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isWeb && styles.webModal]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={24} color="#1d1d1f" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>تعديل السجل</Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.modalProduct}>{selectedLog?.product_name}</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>الكمية</Text>
                <TextInput 
                  style={styles.input} 
                  keyboardType="numeric" 
                  value={editForm.quantity?.toString()} 
                  onChangeText={(val) => setEditForm({ ...editForm, quantity: parseInt(val) || 0 })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>الملاحظات</Text>
                <TextInput 
                  style={[styles.input, { height: 100 }]} 
                  multiline 
                  value={editForm.note} 
                  onChangeText={(val) => setEditForm({ ...editForm, note: val })}
                  placeholder="سبب التعديل أو ملاحظات إضافية..."
                />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={saveEdit} disabled={savingEdit}>
                {savingEdit ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>حفظ التغييرات</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fbfbfd' },
  maxContainer: { flex: 1, paddingHorizontal: 12, paddingTop: 135 },
  header: { marginBottom: 15 },
  headerRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontFamily: 'CairoBold', fontSize: 18, color: '#1d1d1f' },
  exportBtn: { padding: 10, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: '#d2d2d7' },
  searchInputWrapper: { 
    alignSelf: 'flex-end',
    width: isWeb ? 280 : '60%',
    height: 34, 
    backgroundColor: '#fff', 
    borderRadius: 8, 
    borderWidth: 1.5, 
    borderColor: '#d2d2d7', 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    marginBottom: 12
  },
  searchInput: { flex: 1, fontFamily: 'Cairo', fontSize: 14, textAlign: 'right' },
  tableContainer: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#d2d2d7', overflow: 'hidden', padding: isWeb ? 0 : 8 },
  tableHeader: { flexDirection: 'row-reverse', backgroundColor: '#f5f5f7', paddingVertical: 8, display: isWeb ? 'flex' : 'none' },
  columnHeader: { flex: 1, fontFamily: 'CairoBold', fontSize: 11, color: '#86868b', textAlign: 'center' },
  
  mobileCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f2f2f7',
  },
  mobileCardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#fbfbfd',
    paddingBottom: 6,
  },
  mobileProductInfo: {
    alignItems: 'flex-end',
  },
  mobileCardDetails: {
    gap: 4,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontFamily: 'Cairo',
    fontSize: 10,
    color: '#86868b',
  },
  detailValue: {
    fontFamily: 'CairoBold',
    fontSize: 11,
    color: '#1d1d1f',
  },
  detailValueSmall: {
    fontFamily: 'Cairo',
    fontSize: 10,
    color: '#1d1d1f',
  },
  mobileNoteBox: {
    backgroundColor: '#fbfbfd',
    padding: 6,
    borderRadius: 6,
    marginBottom: 8,
    flexDirection: 'row-reverse',
  },
  noteLabel: {
    fontFamily: 'CairoBold',
    fontSize: 10,
    color: '#86868b',
  },
  noteText: {
    fontFamily: 'Cairo',
    fontSize: 10,
    color: '#1d1d1f',
    flex: 1,
    textAlign: 'right',
  },
  mobileEditBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#fbfbfd',
  },
  mobileDeleteBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  printBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#0071e310',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtnText: {
    fontFamily: 'CairoBold',
    fontSize: 10,
    color: '#86868b',
  },
  deleteBtnText: {
    fontFamily: 'CairoBold',
    fontSize: 10,
    color: '#d70015',
  },
  tableRow: { flexDirection: 'row-reverse', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f5f5f7', alignItems: 'center' },
  cell: { flex: 1, alignItems: 'center' },
  cellTextBold: { fontFamily: 'CairoBold', fontSize: 12, color: '#1d1d1f' },
  cellTextSmaller: { fontFamily: 'Cairo', fontSize: 10, color: '#86868b', textAlign: 'center', flex: 1 },
  cellTextSmall: { fontFamily: 'Cairo', fontSize: 11, color: '#1d1d1f' },
  editBtn: { backgroundColor: '#1d1d1f', padding: 6, borderRadius: 6 },
  deleteBtn: { backgroundColor: '#d70015', padding: 6, borderRadius: 6 },
  editingRow: { backgroundColor: '#f5f5f7' },
  emptyText: { padding: 20, textAlign: 'center', fontFamily: 'Cairo', color: '#86868b' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: '90%', maxWidth: 500, borderRadius: 28, padding: 30 },
  webModal: { maxWidth: 450 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontFamily: 'CairoBold', fontSize: 20 },
  modalProduct: { fontFamily: 'CairoBold', fontSize: 16, color: Colors.primary, textAlign: 'center', marginBottom: 20 },
  form: { gap: 15 },
  inputGroup: { gap: 8 },
  label: { fontFamily: 'CairoBold', fontSize: 13, textAlign: 'right', color: '#86868b' },
  input: { 
    height: 54, 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    textAlign: 'right', 
    fontFamily: 'Cairo', 
    borderWidth: 1.5, 
    borderColor: '#f2f2f7',
    fontSize: 15
  },
  saveBtn: { height: 54, backgroundColor: '#1d1d1f', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontFamily: 'CairoBold', fontSize: 16 },
  filterRow: { flexDirection: 'row-reverse', gap: 15, alignItems: 'center', marginTop: 10 },
  filterGroup: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  filterLabel: { fontFamily: 'CairoBold', fontSize: 12, color: '#86868b' },
  dateTextIn: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#e5e5e7', 
    paddingHorizontal: 12, 
    height: 40, 
    width: 120, 
    fontSize: 12, 
    fontFamily: 'Cairo' 
  },
  clearFilter: { fontFamily: 'CairoBold', fontSize: 12, color: '#d70015', marginRight: 10 }
  ,
  errorText: { marginTop: 8, fontFamily: 'Cairo', fontSize: 12, color: '#d70015', textAlign: 'right' }
});

const webInputStyle = {
  border: '1px solid #e5e5e7',
  borderRadius: '12px',
  padding: '8px 12px',
  fontFamily: 'Cairo',
  fontSize: '13px',
  outline: 'none',
  backgroundColor: '#fff'
};
