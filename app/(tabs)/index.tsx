import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  ChevronRight,
  LayoutGrid,
  Zap,
  Activity,
  Layers,
  ArrowUpRight
} from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { getApiClient } from '@/services/api';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { BarChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface Stats {
  total_products: number;
  out_of_stock: number;
  inventory_health: number;
  top_products: { name: string; withdrawals: number }[];
  recent_products?: { name: string; current_quantity: number }[];
}

export default function UnifiedDashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/explore');
    }
  }, [user]);

  const fetchStats = React.useCallback(async () => {
    try {
      const api = await getApiClient();
      const [statsRes, productsRes] = await Promise.all([
        api.get('/api/stats'),
        api.get('/api/products')
      ]);
      
      const statsData = statsRes.data as Stats;
      const productsData = productsRes.data as any[];
      
      statsData.recent_products = productsData
        .slice(-5)
        .map(p => ({ name: p.name, current_quantity: p.current_quantity }));

      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchStats();
    }, [fetchStats])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const StatCard = ({ title, value, icon: Icon, color, subValue, trend }: any) => (
    <View style={styles.statCard}>
      <View style={styles.statCardHeader}>
        <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
          <Icon size={20} color={color} />
        </View>
        {trend && (
          <View style={styles.trendBox}>
            <ArrowUpRight size={12} color={Colors.success} />
            <Text style={styles.trendText}>{trend}</Text>
          </View>
        )}
      </View>
      <Text style={styles.statValueText}>{value}</Text>
      <Text style={styles.statLabelText}>{title}</Text>
      {subValue && (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: subValue, backgroundColor: color }]} />
        </View>
      )}
    </View>
  );

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(29, 29, 31, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(134, 134, 139, ${opacity})`,
    style: { borderRadius: 24 },
    propsForDots: { r: '4', strokeWidth: '0' },
    barPercentage: 0.6,
    propsForBackgroundLines: {
      strokeDasharray: '',
      strokeWidth: 1,
      stroke: '#f2f2f7',
    },
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
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
        {/* Scientific Header */}
        <View style={styles.mainHeader}>
          <View style={styles.headerInfo}>
            <Text style={styles.welcomeText}>مرحباً بك في مركز التحكم</Text>
            <Text style={styles.mainTitle}>نظرة عامة على البيانات</Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>متصل بالنظام</Text>
          </View>
        </View>

        {/* Premium Stats Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <StatCard 
              title="إجمالي المنتجات" 
              value={stats?.total_products || 0} 
              icon={Layers} 
              color="#007AFF"
              trend="+12%"
            />
          </View>
          <View style={styles.metricItem}>
            <StatCard 
              title="نقص المخزون" 
              value={stats?.out_of_stock || 0} 
              icon={AlertTriangle} 
              color="#FF3B30"
            />
          </View>
          <View style={styles.metricItem}>
            <StatCard 
              title="صحة المستودع" 
              value={`${stats?.inventory_health || 0}%`} 
              icon={Activity} 
              color="#34C759"
              subValue={`${stats?.inventory_health || 0}%`}
            />
          </View>
        </View>

        {/* Intelligence Section */}
        <View style={styles.intelligenceRow}>
          <View style={[styles.card, styles.rankingCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>تحليل السحب الأعلى</Text>
              <TrendingUp size={18} color="#86868b" />
            </View>
            <View style={styles.rankList}>
              {stats?.top_products.map((item, index) => (
                <View key={index} style={styles.rankRow}>
                  <View style={styles.rankIconContainer}>
                    <Text style={styles.rankNumber}>0{index + 1}</Text>
                  </View>
                  <View style={styles.rankMainInfo}>
                    <Text style={styles.rankName}>{item.name}</Text>
                    <View style={styles.miniProgressContainer}>
                      <View style={[styles.miniProgress, { width: `${(item.withdrawals / (stats?.top_products[0]?.withdrawals || 1)) * 100}%` }]} />
                    </View>
                  </View>
                  <Text style={styles.rankScore}>{item.withdrawals}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.card, styles.chartCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>معدلات التدفق</Text>
              <Activity size={18} color="#86868b" />
            </View>
            <BarChart
              data={{
                labels: stats?.top_products.slice(0, 5).map(p => p.name.substring(0, 4)) || [],
                datasets: [{ data: stats?.top_products.slice(0, 5).map(p => p.withdrawals) || [] }]
              }}
              width={isWeb ? 550 : width - 60}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={chartConfig}
              style={styles.mainChart}
              fromZero
            />
          </View>
        </View>

        {/* Quick Access Action */}
        <TouchableOpacity 
          style={styles.masterAction}
          onPress={() => router.push('/explore')}
          activeOpacity={0.9}
        >
          <View style={styles.actionIconBox}>
            <Zap size={24} color="#fff" />
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>بدء عملية سحب ذكية</Text>
            <Text style={styles.actionDesc}>الوصول الفوري لقاعدة بيانات المخزون</Text>
          </View>
          <ChevronRight size={24} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  scrollContent: { paddingTop: 130, paddingBottom: 60, alignItems: 'center' },
  contentWrapper: { width: '100%', maxWidth: isWeb ? 1100 : '100%', paddingHorizontal: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f7' },
  
  mainHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  headerInfo: { alignItems: 'flex-end' },
  welcomeText: { fontFamily: 'Cairo', fontSize: 13, color: '#86868b' },
  mainTitle: { fontFamily: 'CairoBold', fontSize: 24, color: '#1d1d1f' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#e5e5e7' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34C759' },
  statusText: { fontFamily: 'CairoBold', fontSize: 11, color: '#1d1d1f' },

  metricsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', marginHorizontal: -8, marginBottom: 20 },
  metricItem: { width: isWeb ? '33.33%' : '50%', padding: 8 },
  
  statCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.03)' } as any,
  statCardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  trendBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(52, 199, 89, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  trendText: { fontFamily: 'CairoBold', fontSize: 11, color: '#34C759' },
  statValueText: { fontFamily: 'CairoBold', fontSize: 28, color: '#1d1d1f', marginBottom: 4 },
  statLabelText: { fontFamily: 'Cairo', fontSize: 14, color: '#86868b', textAlign: 'right' },
  progressBarContainer: { height: 4, backgroundColor: '#f5f5f7', borderRadius: 2, marginTop: 12, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 2 },

  intelligenceRow: { flexDirection: isWeb ? 'row-reverse' : 'column', gap: 20, marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' } as any,
  rankingCard: { flex: 1 },
  chartCard: { flex: 1.5, alignItems: 'center' },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 20 },
  cardTitle: { fontFamily: 'CairoBold', fontSize: 16, color: '#1d1d1f' },

  rankList: { gap: 15 },
  rankRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 15 },
  rankIconContainer: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f5f5f7', justifyContent: 'center', alignItems: 'center' },
  rankNumber: { fontFamily: 'CairoBold', fontSize: 14, color: '#86868b' },
  rankMainInfo: { flex: 1, alignItems: 'flex-end' },
  rankName: { fontFamily: 'CairoBold', fontSize: 14, color: '#1d1d1f', marginBottom: 4 },
  miniProgressContainer: { width: '100%', height: 4, backgroundColor: '#f5f5f7', borderRadius: 2 },
  miniProgress: { height: '100%', backgroundColor: '#1d1d1f', borderRadius: 2 },
  rankScore: { fontFamily: 'CairoBold', fontSize: 15, color: '#1d1d1f' },
  mainChart: { marginTop: 10, borderRadius: 24 },

  masterAction: { 
    backgroundColor: '#1d1d1f', 
    borderRadius: 24, 
    padding: 24, 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    gap: 20,
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)' 
  } as any,
  actionIconBox: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  actionInfo: { flex: 1, alignItems: 'flex-end' },
  actionTitle: { fontFamily: 'CairoBold', fontSize: 18, color: '#fff', marginBottom: 4 },
  actionDesc: { fontFamily: 'Cairo', fontSize: 13, color: 'rgba(255,255,255,0.6)' },
});
