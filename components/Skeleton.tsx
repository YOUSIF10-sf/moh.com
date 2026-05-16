/**
 * Skeleton.tsx
 * مكونات Loading Skeleton موحدة وقابلة للاستخدام في كل الشاشات
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

// ─── Base Skeleton Pulse ──────────────────────────────────────────────────────

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 10, style }: SkeletonProps) {
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius, backgroundColor: '#e5e5ea', opacity: anim },
        style,
      ]}
    />
  );
}

// ─── Product Card Skeleton ────────────────────────────────────────────────────

export function ProductCardSkeleton({ isWeb }: { isWeb?: boolean }) {
  return (
    <View style={[s.productCard, isWeb && s.productCardWeb]}>
      <Skeleton width="100%" height={isWeb ? 100 : 55} borderRadius={10} />
      <View style={{ marginTop: 10, gap: 6 }}>
        <Skeleton width="75%" height={12} borderRadius={6} />
        <Skeleton width="50%" height={10} borderRadius={6} />
        <Skeleton width="100%" height={28} borderRadius={8} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

// ─── Stat Card Skeleton ───────────────────────────────────────────────────────

export function StatCardSkeleton() {
  return (
    <View style={s.statCard}>
      <Skeleton width={44} height={44} borderRadius={14} />
      <View style={{ marginTop: 15, gap: 8 }}>
        <Skeleton width="60%" height={28} borderRadius={8} />
        <Skeleton width="80%" height={12} borderRadius={6} />
      </View>
    </View>
  );
}

// ─── Log Card Skeleton ────────────────────────────────────────────────────────

export function LogCardSkeleton() {
  return (
    <View style={s.logCard}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        <Skeleton width={80} height={28} borderRadius={10} />
        <Skeleton width={100} height={20} borderRadius={8} />
      </View>
      <Skeleton width="70%" height={22} borderRadius={8} style={{ marginBottom: 15 }} />
      <Skeleton width="40%" height={16} borderRadius={6} style={{ marginBottom: 18 }} />
      <Skeleton width="100%" height={60} borderRadius={14} style={{ marginBottom: 20 }} />
      <Skeleton width="100%" height={48} borderRadius={14} />
    </View>
  );
}

// ─── Full Page Loader ─────────────────────────────────────────────────────────

export function PageLoader() {
  return (
    <View style={s.pageLoader}>
      <View style={s.loaderDot} />
    </View>
  );
}

const s = StyleSheet.create({
  productCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
  },
  productCardWeb: {
    width: 160,
    margin: 10,
    padding: 15,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    flex: 1,
  },
  logCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
  },
  pageLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fbfbfd',
  },
  loaderDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1d1d1f',
    opacity: 0.5,
  },
});
