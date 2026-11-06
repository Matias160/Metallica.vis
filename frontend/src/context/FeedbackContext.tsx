// Notificaciones flotantes in-app con micro-bordes de estudio, animación elástica y vector icons.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

export type FeedbackKind = 'info' | 'success' | 'error' | 'warning';

export interface FeedbackMessage {
  title: string;
  detail?: string;
  kind: FeedbackKind;
}

export interface FeedbackContextValue {
  notify: (title: string, detail?: string, kind?: FeedbackKind) => void;
  dismiss: () => void;
}

const FeedbackContext = createContext<FeedbackContextValue>({
  notify: () => {},
  dismiss: () => {}
});

function ToastItem({ message, onDismiss }: { message: FeedbackMessage; onDismiss: () => void }): React.JSX.Element {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrada elástica suave
    Animated.spring(animValue, {
      toValue: 1,
      damping: 14,
      stiffness: 120,
      useNativeDriver: true
    }).start();

    // Auto-cierre con transición de salida
    const timer = setTimeout(() => {
      handleExit();
    }, 4200);

    return () => clearTimeout(timer);
  }, [message]);

  const handleExit = () => {
    Animated.timing(animValue, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true
    }).start(() => {
      onDismiss();
    });
  };

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 0]
  });

  const scale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1]
  });

  const iconNameMap: Record<FeedbackKind, keyof typeof Feather.glyphMap> = {
    info: 'info',
    success: 'check-circle',
    error: 'alert-circle',
    warning: 'alert-triangle'
  };

  const iconColorMap: Record<FeedbackKind, string> = {
    info: '#00e5ff',
    success: '#10b981',
    error: '#ff3b5c',
    warning: '#f59e0b'
  };

  const currentIcon = iconNameMap[message.kind] || 'bell';
  const iconColor = iconColorMap[message.kind] || '#00e5ff';

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        {
          opacity: animValue,
          transform: [{ translateY }, { scale }]
        }
      ]}
    >
      <Pressable onPress={handleExit} style={[styles.toast, (styles as any)[message.kind] || styles.info]}>
        <View style={[styles.iconBadge, (styles as any)[`icon_${message.kind}`] || styles.icon_info]}>
          <Feather name={currentIcon} size={16} color={iconColor} />
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>{message.title}</Text>
          {message.detail ? <Text style={styles.detail}>{message.detail}</Text> : null}
        </View>

        <Pressable onPress={handleExit} hitSlop={12} style={styles.closeBtn}>
          <Feather name="x" size={16} color="#94a3b8" />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<FeedbackMessage | null>(null);

  const notify = useCallback((title: string, detail: string = '', kind: FeedbackKind = 'info') => {
    setMessage({ title, detail, kind });
  }, []);

  const dismiss = useCallback(() => setMessage(null), []);

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {message ? <ToastItem message={message} onDismiss={dismiss} /> : null}
    </FeedbackContext.Provider>
  );
}

export const useFeedback = (): FeedbackContextValue => useContext(FeedbackContext);

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 24 : 54,
    left: 20,
    right: 20,
    zIndex: 99999,
    alignItems: 'center',
    pointerEvents: 'box-none'
  },
  toast: {
    width: '100%',
    maxWidth: 620,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.65,
    shadowRadius: 20,
    elevation: 25
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  icon_info: { backgroundColor: 'rgba(0, 229, 255, 0.1)', borderColor: 'rgba(0, 229, 255, 0.4)' },
  icon_success: { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.4)' },
  icon_error: { backgroundColor: 'rgba(255, 59, 92, 0.12)', borderColor: 'rgba(255, 59, 92, 0.4)' },
  icon_warning: { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.4)' },
  copy: { flex: 1 },
  title: { color: '#f8fafc', fontSize: 13, fontWeight: '800', letterSpacing: -0.2 },
  detail: { color: '#94a3b8', marginTop: 2, fontSize: 11, lineHeight: 16 },
  closeBtn: {
    padding: 4,
    borderRadius: 6
  },
  info: { backgroundColor: '#0c1524', borderColor: '#00e5ff' },
  success: { backgroundColor: '#0a1d17', borderColor: '#10b981' },
  error: { backgroundColor: '#210d14', borderColor: '#ff3b5c' },
  warning: { backgroundColor: '#211808', borderColor: '#f59e0b' }
});