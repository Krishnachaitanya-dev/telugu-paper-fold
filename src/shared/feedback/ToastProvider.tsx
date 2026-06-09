import React, { createContext, useState, useCallback, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/design/theme/useTheme';
import { radius } from '@/design/tokens/radius';
import { spacing } from '@/design/tokens/spacing';

type ToastVariant = 'default' | 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  show: (message: string, variant?: ToastVariant) => void;
}

export const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const show = useCallback((message: string, variant: ToastVariant = 'default') => {
    const id = ++counterRef.current;
    setToasts(prev => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2800);
  }, []);

  const bgMap: Record<ToastVariant, string> = {
    default: colors.card,
    success: '#166534',
    error:   colors.destructive,
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View style={[styles.container, { bottom: insets.bottom + 16 }]} pointerEvents="none">
        {toasts.map(t => (
          <View
            key={t.id}
            style={[styles.toast, { backgroundColor: bgMap[t.variant], borderColor: colors.border }]}
          >
            <Text style={[styles.label, { color: t.variant === 'default' ? colors.textPrimary : '#fff' }]}>
              {t.message}
            </Text>
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 16, right: 16, gap: 8, zIndex: 9999 },
  toast: {
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['3'],
    borderRadius: radius.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  label: { fontSize: 14, fontWeight: '600' },
});
