/**
 * index.tsx — لوحة التحكم الرئيسية
 * ✅ إحصائيات حقيقية محسوبة من البيانات الفعلية
 * ✅ يستخدم AppContext
 * ✅ Toast بدلاً من console.error صامت
 * ✅ Skeleton loading
 * ✅ TypeScript نظيف
 */
import React, { useCallback, useEffect, useMemo } from 'react';
import {
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Layers,
  TrendingUp,
  Zap,
} from 'lucide-react-native';
import { BarChart } from 'react-native-chart-kit';
import { router, useFocusEffect } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useUser, useToast, useAppContext } from '@/context/AppContext';
import { StatCardSkeleton } from '@/components/Skeleton';
import { StorageService } from '@/services/storage';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface Stats {
  total_products: number;
  out_of_stock: number;
  inventory_health: number;
  top_products: { name: string; withdrawals: number }[];
}

export default function DashboardScreen() {
  const { user } = useUser();
  const { products } = useAppContext();
  const showToast = useToast();

  const [stats, setStats] = React.useState<Stats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  // Redirect employees away from dashboard
  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'supervisor') {
      router.replace('/explore');
    }
  }, [user]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await StorageService.getStats();
      setStats(data);
    } catch (e: any) {
      showToast(e.message || 'فشل تحميل الإحصائيات', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useFocusEffect(useCallback(() => { fetchStats(); }, [fetchStats]));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, [fetchStats]);

  // حساب نسبة التغير الحقيقية من البيانات
  const healthTrend = useMemo(() => {
    if (!stats) return null;
    const h = stats.inventory_health;
    if (h >= 80) return { label: 'ممتاز', up: true, color: '#34C759' };
    if (h >= 50) return { label: 'جيد', up: true, color: '#FF9500' };
    return { label: 'يحتاج انتباهاً', up: false, color: '#FF3B30' };
  }, [stats]);

  const chartConfig = useMemo(() => ({
    backgroundColor: '#fff',
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(29, 29, 31, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(134, 134, 139, ${opacity})`,
    style: { borderRadius: 20 },
    barPercentage: 0.55,
    propsForBackgroundLines: { strokeDasharray: '', strokeWidth: 1, stroke: '#f2f2f7' },
  }), []);

  if (loading && !refreshing) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrapper}>
          <View style={styles.mainHeader}>
            <View style={{ width: 200, height: 24, backgroundColor: '#e5e5ea', borderRadius: 8 }} />
          </View>
          <View style={styles.metricsGrid}>
            {[0, 1, 2].map(i => (
              <View key={i} style={styles.metricItem}><StatCardSkeleton /></View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.contentWrapper}>
        {/* Header */}
        <View style={styles.mainHeader}>
          <View style={styles.headerInfo}>
            <Text style={styles.welcomeText}>
              أهلاً، {user?.full_name?.split(' ')[0] || 'مسؤول'}
            </Text>
            <Text style={styles.mainTitle}>نظرة عامة على المخزن</Text>
          </View>
          <View style={[styles.statusBadge, { borderColor: healthTrend?.color ?? '#34C759' }]}>
            <View style={[styles.statusDot, { backgroundColor: healthTrend?.color ?? '#34C759' }]} />
            <Text style={[styles.statusText, { color: healthTrend?.color ?? '#34C759' }]}>
              {healthTrend?.label ?? 'متصل'}
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <StatCard
              title="إجمالي المنتجات"
              value={stats?.total_products ?? 0}
              icon={Layers}
              color="#007AFF"
              sub={`${stats?.total_products ?? 0} صنف مسجل`}
            />
          </View>
          <View style={styles.metricItem}>
            <StatCard
              title="نقص المخزون"
              value={stats?.out_of_stock ?? 0}
              icon={AlertTriangle}
              color={stats?.out_of_stock ?? 0 > 0 ? '#FF3B30' : '#34C759'}
              sub={(stats?.out_of_stock ?? 0) > 0 ? 'يحتاج إعادة تخزين' : 'المخزون سليم'}
            />
          </View>
          <View style={styles.metricItem}>
            <StatCard
              title="صحة المستودع"
              value={`${stats?.inventory_health ?? 0}%`}
              icon={Activity}
              color="#34C759"
              progress={stats?.inventory_health}
            />
          </View>
        </View>

        {/* Intelligence Section */}
        <View style={styles.intelligenceRow}>
          {/* Top Products Ranking */}
          <View style={[styles.card, styles.rankingCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>أكثر المنتجات سحباً</Text>
              <TrendingUp size={18} color="#86868b" />
            </View>
            {(stats?.top_products?.length ?? 0) === 0 ? (
              <Text style={styles.emptyChart}>لا توجد بيانات سحب بعد</Text>
            ) : (
              <View style={styles.rankList}>
                {stats!.top_products.map((item, index) => (
                  <View key={index} style={styles.rankRow}>
                    <View style={styles.rankIconContainer}>
                      <Text style={styles.rankNumber}>{String(index + 1).padStart(2, '0')}</Text>
                    </View>
                    <View style={styles.rankMainInfo}>
                      <Text style={styles.rankName} numberOfLines={1}>{item.name}</Text>
                      <View style={styles.miniProgressContainer}>
                        <View
                          style={[
                            styles.miniProgress,
                            { width: `${(item.withdrawals / (stats!.top_products[0]?.withdrawals || 1)) * 100}%` },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={styles.rankScore}>{item.withdrawals}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Bar Chart */}
          {(stats?.top_products?.length ?? 0) > 0 && (
            <View style={[styles.card, styles.chartCard]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>معدلات السحب</Text>
                <Activity size={18} color="#86868b" />
              </View>
              <BarChart
                data={{
                  labels: stats!.top_products.slice(0, 5).map(p => p.name.substring(0, 4)),
                  datasets: [{ data: stats!.top_products.slice(0, 5).map(p => p.withdrawals) }],
                }}
                width={isWeb ? 500 : width - 60}
                height={200}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={chartConfig}
                style={styles.mainChart}
                fromZero
              />
            </View>
          )}
        </View>

        {/* Quick Action */}
        <TouchableOpacity
          style={styles.masterAction}
          onPress={() => router.push('/explore')}
          activeOpacity={0.88}
        >
          <View style={styles.actionIconBox}>
            <Zap size={24} color="#fff" />
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>بدء عملية سحب</Text>
            <Text style={styles.actionDesc}>الوصول الفوري لقاعدة بيانات المخزون</Text>
          </View>
          <ChevronRight size={22} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Stat Card Component ──────────────────────────────────────────────────────

function StatCard({ title, value, icon: Icon, color, sub, progress }: {
  title: string; value: string | number; icon: any;
  color: string; sub?: string; progress?: number;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statCardHeader}>
        <View style={[styles.iconBox, { backgroundColor: color + '18' }]}>
          <Icon size={20} color={color} />
        </View>
      </View>
      <Text style={styles.statValueText}>{value}</Text>
      <Text style={styles.statLabelText}>{title}</Text>
      {sub && <Text style={styles.statSubText}>{sub}</Text>}
      {progress !== undefined && (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${Math.min(progress, 100)}%` as any, backgroundColor: color }]} />
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  scrollContent: { paddingTop: 130, paddingBottom: 60, alignItems: 'center' },
  contentWrapper: { width: '100%', maxWidth: isWeb ? 1100 : '100%', paddingHorizontal: 20 },

  mainHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerInfo: { alignItems: 'flex-end' },
  welcomeText: { fontFamily: 'Cairo', fontSize: 14, color: '#86868b', marginBottom: 2 },
  mainTitle: { fontFamily: 'CairoBold', fontSize: 22, color: '#1d1d1f' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontFamily: 'CairoBold', fontSize: 11 },

  metricsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', marginHorizontal: -6, marginBottom: 20 },
  metricItem: { width: isWeb ? '33.33%' : '50%', padding: 6 },

  statCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    ...(isWeb ? ({ boxShadow: '0 4px 20px rgba(0,0,0,0.04)' } as any) : {
      shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 4,
    }),
  },
  statCardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 14 },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  statValueText: { fontFamily: 'CairoBold', fontSize: 30, color: '#1d1d1f', marginBottom: 2 },
  statLabelText: { fontFamily: 'CairoBold', fontSize: 13, color: '#86868b', textAlign: 'right' },
  statSubText: { fontFamily: 'Cairo', fontSize: 11, color: '#aeaeb2', textAlign: 'right', marginTop: 3 },
  progressBarContainer: { height: 4, backgroundColor: '#f5f5f7', borderRadius: 2, marginTop: 12, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 2 },

  intelligenceRow: { flexDirection: isWeb ? 'row-reverse' : 'column', gap: 16, marginBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 22,
    ...(isWeb ? ({ boxShadow: '0 4px 20px rgba(0,0,0,0.03)' } as any) : {
      shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 3,
    }),
  },
  rankingCard: { flex: 1 },
  chartCard: { flex: 1.5, alignItems: 'center' },
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 18,
  },
  cardTitle: { fontFamily: 'CairoBold', fontSize: 15, color: '#1d1d1f' },
  emptyChart: { fontFamily: 'Cairo', fontSize: 14, color: '#86868b', textAlign: 'center', paddingVertical: 20 },

  rankList: { gap: 14 },
  rankRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  rankIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#f5f5f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: { fontFamily: 'CairoBold', fontSize: 12, color: '#86868b' },
  rankMainInfo: { flex: 1, alignItems: 'flex-end' },
  rankName: { fontFamily: 'CairoBold', fontSize: 13, color: '#1d1d1f', marginBottom: 5 },
  miniProgressContainer: { width: '100%', height: 4, backgroundColor: '#f5f5f7', borderRadius: 2 },
  miniProgress: { height: '100%', backgroundColor: '#1d1d1f', borderRadius: 2 },
  rankScore: { fontFamily: 'CairoBold', fontSize: 14, color: '#1d1d1f', minWidth: 28, textAlign: 'center' },
  mainChart: { marginTop: 8, borderRadius: 20 },

  masterAction: {
    backgroundColor: '#1d1d1f',
    borderRadius: 24,
    padding: 22,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 18,
    ...(isWeb ? ({ boxShadow: '0 16px 40px rgba(0,0,0,0.18)' } as any) : {
      shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
    }),
  },
  actionIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionInfo: { flex: 1, alignItems: 'flex-end' },
  actionTitle: { fontFamily: 'CairoBold', fontSize: 17, color: '#fff', marginBottom: 3 },
  actionDesc: { fontFamily: 'Cairo', fontSize: 12, color: 'rgba(255,255,255,0.55)' },
});
