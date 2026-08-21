import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme';

export const TTT_SUBJECTS = [
  { id: 'All', label: 'Mix' },
  { id: 'Science', label: 'Science' },
  { id: 'Maths', label: 'Maths' },
  { id: 'English', label: 'English' },
  { id: 'Social', label: 'Social' },
];

export const TTT_DIFFS = [
  { id: 'easy', label: 'Easy', hint: 'Rival misses a lot' },
  { id: 'medium', label: 'Medium', hint: 'Rival thinks' },
  { id: 'hard', label: 'Hard', hint: 'Rival hunts wins' },
];

export function ChipRow({ title, items, value, onChange }) {
  return (
    <View style={styles.wrap}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.row}>
        {items.map((item) => {
          const id = item.id;
          const on = value === id;
          return (
            <Pressable key={id} onPress={() => onChange(id)} style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.label, on && styles.labelOn]}>{item.label}</Text>
              {item.hint ? <Text style={[styles.hint, on && styles.hintOn]}>{item.hint}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: 8 },
  title: { fontSize: 15, fontWeight: '800', color: colors.text, textAlign: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  chip: {
    minWidth: 88,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipOn: {
    backgroundColor: '#FFEDD5',
    borderColor: '#C2410C',
  },
  label: { fontSize: 14, fontWeight: '800', color: colors.brandNavy },
  labelOn: { color: '#C2410C' },
  hint: { fontSize: 10, fontWeight: '700', color: colors.textMuted, marginTop: 2, textAlign: 'center' },
  hintOn: { color: '#9A3412' },
});
