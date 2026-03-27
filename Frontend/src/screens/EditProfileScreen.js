import { ActivityIndicator, ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePortalData } from '../hooks/usePortalData';
import { colors, radius } from '../theme';

export default function EditProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const { data, isLoading, error } = usePortalData();

  if (isLoading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.iconBlue} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.toolbar}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={styles.back}>Back</Text>
          </Pressable>
          <Text style={styles.title}>Child Profile</Text>
          <View style={styles.toolbarSpacer} />
        </View>
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Could not load profile</Text>
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      </View>
    );
  }

  const child = data?.student;
  const fullName = `${child?.firstName || ''} ${child?.lastName || ''}`.trim() || 'Student';

  const fields = [
    { label: 'Student Name', value: fullName },
    { label: 'Student ID', value: child?.studentId || '—' },
    { label: 'Gender', value: child?.gender || '—' },
    { label: 'Class', value: child?.class?.name || '—' },
    { label: 'Class Level', value: child?.class?.level || '—' },
    { label: 'Class Teacher', value: child?.class?.teacher?.name || '—' },
    { label: 'Teacher Phone', value: child?.class?.teacher?.phone || '—' },
  ];

  const initials = (child?.firstName?.[0] || 'S') + (child?.lastName?.[0] || 'T');

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.toolbar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Child Profile</Text>
        <View style={styles.toolbarSpacer} />
      </View>
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroAvatarText}>{initials}</Text>
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroName}>{fullName}</Text>
            <Text style={styles.heroSub}>{child?.class?.name || 'No class assigned'}</Text>
          </View>
          <View style={styles.heroBadge}>
            <Ionicons name="person-outline" size={14} color={colors.iconBlue} />
            <Text style={styles.heroBadgeText}>Student</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          {fields.slice(0, 3).map((field) => (
            <View key={field.label} style={styles.rowItem}>
              <Text style={styles.label}>{field.label}</Text>
              <View style={styles.valueBox}>
                <Text style={styles.valueText}>{field.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>School Details</Text>
          {fields.slice(3).map((field) => (
            <View key={field.label} style={styles.rowItem}>
              <Text style={styles.label}>{field.label}</Text>
              <View style={styles.valueBox}>
                <Text style={styles.valueText}>{field.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.infoStrip}>
          <Ionicons name="cloud-done-outline" size={14} color={colors.iconBlue} />
          <Text style={styles.hint}>Synced live from school backend records.</Text>
        </View>
      </ScrollView>
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
  body: {
    gap: 12,
    paddingBottom: 16,
  },
  heroCard: {
    backgroundColor: '#EEF4FF',
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D9E8FF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.iconBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  heroTextWrap: {
    flex: 1,
  },
  heroName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  heroSub: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D9E8FF',
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.iconBlue,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  rowItem: {
    marginTop: 6,
  },
  errorBox: {
    marginTop: 24,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 4,
    marginTop: 2,
  },
  valueBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  valueText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  infoStrip: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: '#EEF4FF',
  },
  hint: {
    fontSize: 12,
    color: colors.textSoft,
    lineHeight: 16,
  },
});
