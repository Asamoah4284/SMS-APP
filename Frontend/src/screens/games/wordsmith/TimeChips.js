import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WORD_SMITH_TIMES } from './time';
import { colors } from '../../../theme';

export default function TimeChips({ value, onChange }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>How long is the round?</Text>
      <Text style={styles.sub}>Same clock for everyone in a match.</Text>
      <View style={styles.grid}>
        {WORD_SMITH_TIMES.map((t) => {
          const on = value === t.sec;
          return (
            <Pressable
              key={t.sec}
              onPress={() => onChange(t.sec)}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={[styles.label, on && styles.labelOn]}>{t.label}</Text>
              <Text style={[styles.hint, on && styles.hintOn]}>{t.hint}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: 8 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  sub: { fontSize: 13, color: colors.textMuted, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  chip: {
    width: '30%',
    minWidth: 96,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipOn: {
    backgroundColor: '#ECF3EE',
    borderColor: '#15803D',
  },
  label: { fontSize: 16, fontWeight: '800', color: colors.brandNavy },
  labelOn: { color: '#15803D' },
  hint: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginTop: 2 },
  hintOn: { color: '#166534' },
});
