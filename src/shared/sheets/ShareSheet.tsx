import React from 'react';
import { View, TouchableOpacity, StyleSheet, Linking, Share } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/design/primitives/Text';
import { useTheme } from '@/design/theme/useTheme';
import { spacing } from '@/design/tokens/spacing';
import { radius } from '@/design/tokens/radius';

interface ShareSheetProps {
  title: string;
  url: string;
  onClose: () => void;
}

const OPTIONS = [
  { id: 'whatsapp', label: 'WhatsApp',    icon: 'message-circle' as const, color: '#25D366' },
  { id: 'copy',     label: 'Copy Link',   icon: 'copy'           as const, color: '#6b7280' },
  { id: 'more',     label: 'More',        icon: 'share-2'        as const, color: '#6b7280' },
];

export function ShareSheet({ title, url, onClose }: ShareSheetProps) {
  const { colors } = useTheme();

  const handle = async (id: string) => {
    if (id === 'whatsapp') {
      const text = encodeURIComponent(`${title}\n${url}`);
      await Linking.openURL(`whatsapp://send?text=${text}`).catch(() => {});
    } else if (id === 'copy') {
      // expo-clipboard not installed — fallback to native share
      await Share.share({ message: `${title}\n${url}` }).catch(() => {});
    } else {
      await Share.share({ title, message: url }).catch(() => {});
    }
    onClose();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.handle, { backgroundColor: colors.border }]} />
      <Text variant="label" tone="secondary" style={{ marginBottom: spacing['4'] }}>Share via</Text>
      <View style={styles.row}>
        {OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.id}
            onPress={() => handle(opt.id)}
            activeOpacity={0.7}
            style={styles.option}
            testID={`share-${opt.id}`}
          >
            <View style={[styles.iconWrap, { backgroundColor: opt.color + '20' }]}>
              <Feather name={opt.icon} size={22} color={opt.color} />
            </View>
            <Text variant="caption">{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    borderTopWidth: 1,
    paddingTop: spacing['2'],
    paddingHorizontal: spacing['5'],
    paddingBottom: spacing['8'],
    alignItems: 'center',
  },
  handle: { width: 36, height: 4, borderRadius: 2, marginBottom: spacing['4'] },
  row:    { flexDirection: 'row', gap: spacing['6'] },
  option: { alignItems: 'center', gap: spacing['1'] },
  iconWrap: { width: 52, height: 52, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center' },
});
