/**
 * ErrorBoundary.tsx
 * يمسك أي خطأ React غير متوقع ويعرض شاشة لطيفة بدلاً من الكراش الكامل
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error.message, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={s.container}>
        <View style={s.iconBox}>
          <AlertTriangle size={40} color="#FF3B30" />
        </View>
        <Text style={s.title}>حدث خطأ غير متوقع</Text>
        <Text style={s.desc}>{this.state.error?.message || 'خطأ داخلي في التطبيق'}</Text>
        <TouchableOpacity style={s.btn} onPress={this.reset}>
          <Text style={s.btnText}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fbfbfd',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,59,48,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: 'CairoBold',
    fontSize: 22,
    color: '#1d1d1f',
    textAlign: 'center',
  },
  desc: {
    fontFamily: 'Cairo',
    fontSize: 14,
    color: '#86868b',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  btn: {
    marginTop: 10,
    backgroundColor: '#1d1d1f',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnText: {
    fontFamily: 'CairoBold',
    fontSize: 15,
    color: '#fff',
  },
});
