import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../theme';

export default function EditProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.toolbar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <Text style={styles.title}>View Profile</Text>
        <View style={styles.toolbarSpacer} />
      </View>
      <View style={styles.body}>
        <Text style={styles.label}>Student name</Text>
        <TextInput
          style={styles.input}
          defaultValue="Isaac Owusu"
          placeholderTextColor={colors.textSoft}
        />
        <Text style={styles.label}>Student ID</Text>
        <TextInput
          style={styles.input}
          defaultValue="10234"
          placeholderTextColor={colors.textSoft}
        />
        <Text style={styles.hint}>
          Update details for your child’s school profile.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  back: {
    fontSize: 16,
    color: colors.iconBlue,
    fontWeight: '600',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  toolbarSpacer: { width: 48 },
  body: { gap: 8 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 12,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.white,
  },
  hint: {
    marginTop: 16,
    fontSize: 13,
    color: colors.textSoft,
    lineHeight: 18,
  },
});
