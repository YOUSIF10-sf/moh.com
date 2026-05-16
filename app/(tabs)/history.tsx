import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { Printer, Calendar, Hash, FileText, Info, ChevronLeft } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Colors } from '@/constants/theme';
import { getApiClient } from '@/services/api';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface LogEntry {
  id: number;
  created_at: string;
  product_name: string;
  quantity: number;
  note: string;
  employee_name: string;
}

export default function UnifiedHistoryScreen() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async () => {
    try {
      const api = await getApiClient();
      const response = await api.get('/api/logs/user'); 
      setLogs(response.data as LogEntry[]);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const printReceipt = async (log: LogEntry) => {
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
                <span class="value">${new Date(log.created_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
              <div class="info-item">
                <span class="label">اسم الموظف:</span>
                <span class="value">${log.employee_name || '---'}</span>
              </div>
              <div class="info-item">
                <span class="label">القسم:</span>
                <span class="value">العمليات التشغيلية</span>
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

  const renderLogItem = ({ item }: { item: LogEntry }) => (
    <View style={[styles.logCard, isWeb && styles.webCard]}>
      <View style={styles.logHeader}>
        <View style={styles.logIdContainer}>
          <Hash size={14} color={Colors.primary} />
          <Text style={styles.logId}>{item.id}</Text>
        </View>
        <View style={styles.logDateContainer}>
          <Calendar size={14} color="#86868b" />
          <Text style={styles.logDate}>{new Date(item.created_at).toLocaleDateString('ar-EG')}</Text>
        </View>
      </View>

      <Text style={styles.productName}>{item.product_name}</Text>
      
      <View style={styles.logDetail}>
        <Text style={styles.qtyLabel}>الكمية المسحوبة:</Text>
        <Text style={styles.qtyValue}>{item.quantity}</Text>
      </View>

      <View style={styles.noteContainer}>
        <FileText size={14} color="#86868b" />
        <Text style={styles.logNote} numberOfLines={2}>{item.note || 'بدون ملاحظات'}</Text>
      </View>

      <TouchableOpacity 
        style={styles.printBtn}
        onPress={() => printReceipt(item)}
        activeOpacity={0.7}
      >
        <Printer size={16} color={Colors.primary} />
        <Text style={styles.printBtnText}>طباعة الإيصال</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.maxContainer}>
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>السجل الشخصي</Text>
          <Text style={styles.headerTitle}>تتبع مسحوباتك.{'\n'}بكل شفافية.</Text>
        </View>

        <FlatList
          data={logs}
          renderItem={renderLogItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          numColumns={isWeb && width > 800 ? 3 : 1}
          key={isWeb && width > 800 ? 'web-grid' : 'mobile-list'}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Info size={40} color="#86868b" />
              <Text style={styles.emptyText}>لا توجد سحوبات مسجلة بعد</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fbfbfd',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fbfbfd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  maxContainer: {
    flex: 1,
    width: '100%',
    maxWidth: isWeb ? 1100 : '100%',
    alignSelf: 'center',
  },
  header: {
    paddingHorizontal: isWeb ? 40 : 24,
    paddingTop: isWeb ? 60 : 135,
    paddingBottom: 30,
    alignItems: 'flex-end',
  },
  headerSubtitle: {
    fontFamily: 'CairoBold',
    fontSize: 16,
    color: '#86868b',
    marginBottom: 8,
  },
  headerTitle: {
    fontFamily: 'CairoBold',
    fontSize: isWeb ? 40 : 34,
    color: '#1d1d1f',
    textAlign: 'right',
    lineHeight: isWeb ? 48 : 42,
  },
  listContent: {
    paddingHorizontal: isWeb ? 30 : 20,
    paddingBottom: 120,
  },
  logCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
    marginHorizontal: isWeb ? 10 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
  },
  webCard: {
    maxWidth: '33%',
  },
  logHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logIdContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 113, 227, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  logId: {
    fontFamily: 'CairoBold',
    fontSize: 13,
    color: Colors.primary,
  },
  logDateContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  logDate: {
    fontFamily: 'CairoBold',
    fontSize: 13,
    color: '#86868b',
  },
  productName: {
    fontFamily: 'CairoBold',
    fontSize: 22,
    color: '#1d1d1f',
    marginBottom: 15,
    textAlign: 'right',
  },
  logDetail: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  qtyLabel: {
    fontFamily: 'Cairo',
    fontSize: 15,
    color: '#86868b',
  },
  qtyValue: {
    fontFamily: 'CairoBold',
    fontSize: 19,
    color: '#34c759',
  },
  noteContainer: {
    flexDirection: 'row-reverse',
    gap: 10,
    backgroundColor: '#f5f5f7',
    padding: 18,
    borderRadius: 16,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#d2d2d7',
  },
  logNote: {
    flex: 1,
    fontFamily: 'Cairo',
    fontSize: 14,
    color: '#1d1d1f',
    textAlign: 'right',
    lineHeight: 22,
  },
  printBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  printBtnText: {
    fontFamily: 'CairoBold',
    fontSize: 15,
    color: Colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
  },
  emptyText: {
    fontFamily: 'Cairo',
    fontSize: 17,
    color: '#86868b',
    marginTop: 15,
  },
});
