// Notificaciones flotantes in-app con micro-bordes de estudio y máxima legibilidad.
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const FeedbackContext = createContext(null);

export function FeedbackProvider({ children }) {
  const [message, setMessage] = useState(null);

  const notify = useCallback((title, detail = '', kind = 'info') => {
    setMessage({ title, detail, kind });
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      setMessage((curr) => (curr?.title === title ? null : curr));
    }, 5000);
  }, []);

  const dismiss = useCallback(() => setMessage(null), []);

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);

  const kindIcons = {
    info: 'ℹ',
    success: '✓',
    error: '✕',
    warning: '⚠'
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {message ? (
        <Pressable onPress={dismiss} style={[styles.toast, styles[message.kind] || styles.info]}>
          <View style={[styles.iconBadge, styles[`icon_${message.kind}`] || styles.icon_info]}>
            <Text style={styles.iconText}>{kindIcons[message.kind] || '●'}</Text>
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>{message.title}</Text>
            {message.detail ? <Text style={styles.detail}>{message.detail}</Text> : null}
          </View>
          <Text style={styles.close}>×</Text>
        </Pressable>
      ) : null}
    </FeedbackContext.Provider>
  );
}

export const useFeedback = () => useContext(FeedbackContext);

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    right: 20,
    left: 20,
    bottom: 28,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  iconText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff'
  },
  icon_info: { backgroundColor: '#0d2838', borderColor: '#00e5ff' },
  icon_success: { backgroundColor: '#092d1c', borderColor: '#10b981' },
  icon_error: { backgroundColor: '#3b0d17', borderColor: '#ff3b5c' },
  icon_warning: { backgroundColor: '#382506', borderColor: '#f59e0b' },
  copy: { flex: 1 },
  title: { color: '#f8fafc', fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },
  detail: { color: '#94a3b8', marginTop: 3, fontSize: 12, lineHeight: 17 },
  close: { color: '#64748b', fontSize: 22, paddingHorizontal: 4, fontWeight: '300' },
  info: { backgroundColor: '#0c1524', borderColor: '#00e5ff' },
  success: { backgroundColor: '#0a1d17', borderColor: '#10b981' },
  error: { backgroundColor: '#210d14', borderColor: '#ff3b5c' },
  warning: { backgroundColor: '#211808', borderColor: '#f59e0b' }
});
