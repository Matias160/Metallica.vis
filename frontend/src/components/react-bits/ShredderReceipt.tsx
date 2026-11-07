// ShredderReceipt: Ticket de transacción con bordes dentados y efecto trituradora de recibo (React Bits)
// https://reactbits.dev/micro/shredder
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  StyleProp,
  ViewStyle,
  Animated
} from 'react-native';
import * as Haptics from 'expo-haptics';

export interface ActionLog {
  id: string | number;
  type: 'DUB' | 'CLAIM' | 'TRANSFER' | 'VERIFY';
  title: string;
  details: string;
  timestamp: string;
  hash?: string;
  user?: string;
}

interface ShredderReceiptProps {
  log: ActionLog;
  onShred?: (id: string | number) => void;
  style?: StyleProp<ViewStyle>;
  palette: any;
}

export const ShredderReceipt: React.FC<ShredderReceiptProps> = ({
  log,
  onShred,
  style,
  palette
}) => {
  const [isShredding, setIsShredding] = useState(false);
  const [isShredded, setIsShredded] = useState(false);

  const handleShred = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setIsShredding(true);
    setTimeout(() => {
      setIsShredded(true);
      if (onShred) onShred(log.id);
    }, 600);
  };

  if (isShredded) return null;

  const typeColor =
    log.type === 'DUB'
      ? palette.cyan || '#00E5FF'
      : log.type === 'CLAIM'
      ? palette.accent || '#F59E0B'
      : log.type === 'VERIFY'
      ? palette.emerald || '#10B981'
      : palette.purple || '#A855F7';

  return (
    <View
      style={[
        styles.receiptWrap,
        style,
        isShredding && (Platform.OS === 'web' ? { animation: 'shredderFall 0.6s ease forwards' } : { opacity: 0.2 }) as any
      ]}
    >
      {/* Borde superior dentado tipo ticket */}
      <View style={styles.perforatedTop}>
        {Array.from({ length: 18 }).map((_, i) => (
          <View key={i} style={[styles.tooth, { backgroundColor: palette.background || '#06080D' }]} />
        ))}
      </View>

      <View style={[styles.receiptBody, { backgroundColor: palette.card || '#111726', borderColor: palette.border }]}>
        {/* Cabecera del ticket */}
        <View style={styles.receiptHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
              <Text style={styles.typeBadgeText}>{log.type}</Text>
            </View>
            <Text style={[styles.receiptId, { color: palette.muted }]}>
              REC-#{String(log.id).padStart(5, '0')}
            </Text>
          </View>

          <Text style={[styles.timestamp, { color: palette.muted }]}>
            {log.timestamp}
          </Text>
        </View>

        {/* Título de la acción */}
        <Text style={[styles.actionTitle, { color: palette.text }]}>
          {log.title}
        </Text>
        <Text style={[styles.actionDetails, { color: palette.textSecondary }]}>
          {log.details}
        </Text>

        {log.hash && (
          <View style={[styles.hashBox, { backgroundColor: palette.surfaceDark, borderColor: palette.borderSubtle }]}>
            <Text style={[styles.hashLabel, { color: palette.muted }]}>LINAJE CRIPTOGRÁFICO:</Text>
            <Text numberOfLines={1} style={[styles.hashText, { color: palette.cyan }]}>
              {log.hash}
            </Text>
          </View>
        )}

        {/* Botón de triturar comprobante con efecto Shredder */}
        <View style={[styles.receiptFooter, { borderTopColor: palette.borderSubtle }]}>
          <Text style={[styles.verifiedLabel, { color: palette.emerald || '#10B981' }]}>
            ✓ REGISTRO EN BODEGA VÁLIDO
          </Text>

          <Pressable
            onPress={handleShred}
            style={[styles.shredBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.35)' }]}
          >
            <Text style={styles.shredBtnText}>TRITURAR TICKET ✂</Text>
          </Pressable>
        </View>
      </View>

      {/* Borde inferior dentado */}
      <View style={styles.perforatedBottom}>
        {Array.from({ length: 18 }).map((_, i) => (
          <View key={i} style={[styles.tooth, { backgroundColor: palette.background || '#06080D' }]} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  receiptWrap: {
    width: '100%',
    marginVertical: 8,
    position: 'relative'
  },
  perforatedTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 6,
    zIndex: 2,
    overflow: 'hidden'
  },
  perforatedBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 6,
    zIndex: 2,
    overflow: 'hidden'
  },
  tooth: {
    width: 8,
    height: 8,
    borderRadius: 4,
    transform: [{ translateY: -4 }]
  },
  receiptBody: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: 14,
    ...Platform.select({
      web: {
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.45)'
      }
    })
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4
  },
  typeBadgeText: {
    color: '#06080D',
    fontSize: 9.5,
    fontWeight: '800'
  },
  receiptId: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700'
  },
  timestamp: {
    fontSize: 11,
    fontFamily: 'monospace'
  },
  actionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 3
  },
  actionDetails: {
    fontSize: 12.5,
    lineHeight: 18
  },
  hashBox: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 8
  },
  hashLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  hashText: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    marginTop: 2
  },
  receiptFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 10
  },
  verifiedLabel: {
    fontSize: 10.5,
    fontWeight: '700'
  },
  shredBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1
  },
  shredBtnText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800'
  }
});
