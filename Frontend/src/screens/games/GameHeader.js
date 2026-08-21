import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

export default function GameHeader({ title, subtitle, onBack, right }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={10} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </Pressable>
      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.sub} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      <View style={styles.right}>{right || <View style={{ width: 24 }} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backBtn: { marginRight: 8 },
  center: { flex: 1 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  sub: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  right: { minWidth: 24, alignItems: 'flex-end' },
});
