import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTimetable } from '../hooks/useTimetable';
import { colors, radius } from '../theme';

/** Lighter than global shadowCard — schedule screen only */
const shadowSoft = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  android: { elevation: 1 },
});

/**
 * Per-day accents — all derived from school brand (navy + gold); alternates for scanability.
 */
const DAY_THEMES = {
  Monday: {
    stripe: colors.brandNavy,
    icon: colors.brandNavy,
    badgeBg: colors.iconBlueMuted,
    pmBg: colors.brandNavyMuted,
  },
  Tuesday: {
    stripe: colors.brandGold,
    icon: colors.brandGoldDark,
    badgeBg: colors.yellowMuted,
    pmBg: colors.yellowMuted,
  },
  Wednesday: {
    stripe: colors.brandNavyLight,
    icon: colors.brandNavy,
    badgeBg: colors.hlFeeBlueBg,
    pmBg: colors.hlFeeBlueBg,
  },
  Thursday: {
    stripe: colors.brandGoldDark,
    icon: colors.quickTimeFg,
    badgeBg: colors.quickTimeBg,
    pmBg: colors.quickTimeBg,
  },
  Friday: {
    stripe: colors.brandNavy,
    icon: colors.brandGoldDark,
    badgeBg: colors.yellowMuted,
    pmBg: colors.iconBlueMuted,
  },
};

const FALLBACK_DAY_THEME = {
  stripe: colors.brandNavy,
  icon: colors.textMuted,
  badgeBg: colors.cardBlue,
  pmBg: colors.brandNavyMuted,
};

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_FROM_NUMBER = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
};

const SUBJECT_ICONS = {
  Mathematics: 'calculator-variant',
  Science: 'microscope',
  English: 'book-open-page-variant',
  Social: 'earth',
  'Religious & Moral': 'hands-pray',
  'Creative Arts': 'palette',
  Computing: 'laptop',
  French: 'translate',
};

function SessionCard({ entry, theme }) {
  const icon = SUBJECT_ICONS[entry.subject?.name] || 'book-outline';
  const safeStartTime = entry?.startTime || '--:--';
  const safeEndTime = entry?.endTime || '--:--';
  const [startHour] = safeStartTime.split(':');
  const hour = parseInt(startHour, 10);
  const isAfternoon = Number.isFinite(hour) && hour >= 12;

  return (
    <View
      style={[styles.sessionCard, { borderLeftColor: theme.stripe, borderLeftWidth: 3 }]}
    >
      <View style={styles.timeColumn}>
        <Text style={styles.startTime}>{safeStartTime}</Text>
        <Text style={styles.endTime}>{safeEndTime}</Text>
      </View>

      <View style={styles.sessionBody}>
        <View style={[styles.iconBadge, { backgroundColor: theme.badgeBg }]}>
          <MaterialCommunityIcons name={icon} size={17} color={theme.icon} />
        </View>
        <View style={styles.sessionText}>
          <Text style={styles.subjectName} numberOfLines={2}>
            {entry.subject?.name || 'Subject'}
          </Text>
          {entry.subject?.code ? (
            <Text style={styles.subjectCode}>{entry.subject.code}</Text>
          ) : null}
        </View>
      </View>

      <Text style={[styles.ampmText, { color: theme.icon }]}>{isAfternoon ? 'PM' : 'AM'}</Text>
    </View>
  );
}

export default function TimetableScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { data, isLoading, error, refetch } = useTimetable();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="small" color={colors.brandNavy} />
        <Text style={styles.loadingLabel}>Loading…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={[styles.navRow, { paddingHorizontal: 18 }]}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={14} style={styles.backHit}>
            <Ionicons name="chevron-back" size={20} color={colors.brandNavy} />
          </Pressable>
          <Text style={styles.navCenterTitle}>Timetable</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.errorContainer}>
          <View style={[styles.errorIconWrap, shadowSoft]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={32} color={colors.danger} />
          </View>
          <Text style={styles.errorTitle}>Couldn’t load timetable</Text>
          <Text style={styles.errorText}>{error.message}</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>Try again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const classData = data?.class;
  const entries = data?.entries || [];

  const getNormalizedDay = (entry) => {
    if (!entry) return 'Other';

    const fromName = typeof entry.dayName === 'string' ? entry.dayName.trim() : '';
    if (DAY_ORDER.includes(fromName)) return fromName;

    const dayNum = Number(entry.dayOfWeek);
    if (DAY_FROM_NUMBER[dayNum]) return DAY_FROM_NUMBER[dayNum];

    return fromName || 'Other';
  };

  const groupedByDay = {};
  entries.forEach((entry) => {
    const day = getNormalizedDay(entry);
    if (!groupedByDay[day]) groupedByDay[day] = [];
    groupedByDay[day].push(entry);
  });

  const knownDays = DAY_ORDER.filter((day) => groupedByDay[day]);
  const unknownDays = Object.keys(groupedByDay)
    .filter((day) => !DAY_ORDER.includes(day))
    .sort((a, b) => a.localeCompare(b));
  const sortedDays = [...knownDays, ...unknownDays];

  const totalSessions = entries.length;
  const totalDays = sortedDays.length;
  const subjectCount = new Set(entries.map((e) => e.subject?.id).filter(Boolean)).size;

  const statItems = [
    {
      icon: 'calendar-month-outline',
      value: totalDays,
      label: 'Days',
      fg: colors.brandNavy,
      bg: colors.hlFeeBlueBg,
    },
    {
      icon: 'clock-outline',
      value: totalSessions,
      label: 'Periods',
      fg: colors.quickTimeFg,
      bg: colors.quickTimeBg,
    },
    {
      icon: 'book-open-variant',
      value: subjectCount,
      label: 'Subjects',
      fg: colors.brandGoldDark,
      bg: colors.yellowMuted,
    },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.navRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={14} style={styles.backHit}>
          <Ionicons name="chevron-back" size={20} color={colors.brandNavy} />
        </Pressable>
        <Text style={styles.navCenterTitle}>Timetable</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 28 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandNavy} />
        }
      >
        <View style={[styles.heroCard, shadowSoft]}>
          <View style={styles.heroGoldBar} />
          <Text style={styles.heroEyebrow}>Schedule</Text>
          <Text style={styles.heroTitle} numberOfLines={2}>
            {classData?.name?.trim() ? classData.name : 'Your class'}
          </Text>
          {classData?.level ? (
            <Text style={styles.heroMeta}>{classData.level}</Text>
          ) : null}

          <View style={styles.statsRow}>
            {statItems.map((s) => (
              <View key={s.label} style={[styles.statChip, { backgroundColor: s.bg }]}>
                <MaterialCommunityIcons name={s.icon} size={14} color={s.fg} />
                <Text style={[styles.statValue, { color: s.fg }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {sortedDays.length === 0 ? (
          <View style={[styles.emptyCard, shadowSoft]}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={28} color={colors.textSoft} />
            <Text style={styles.emptyTitle}>No timetable yet</Text>
            <Text style={styles.emptyText}>Pull down to refresh when your school publishes it.</Text>
          </View>
        ) : (
          sortedDays.map((day, dayIndex) => {
            const theme = DAY_THEMES[day] || FALLBACK_DAY_THEME;

            return (
              <View key={day} style={[styles.daySection, dayIndex > 0 && styles.daySectionGap]}>
                <View style={styles.dayHeaderRow}>
                  <Text style={[styles.dayName, { color: theme.icon }]}>{day}</Text>
                  <Text style={styles.sessionCount}>
                    {groupedByDay[day].length} period{groupedByDay[day].length !== 1 ? 's' : ''}
                  </Text>
                </View>

                <View style={styles.sessionsStack}>
                  {groupedByDay[day].map((entry, idx) => (
                    <SessionCard
                      key={`${day}-${entry.subject?.id ?? 's'}-${idx}-${entry.startTime}`}
                      entry={entry}
                      theme={theme}
                    />
                  ))}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  backHit: {
    paddingVertical: 2,
    marginLeft: -4,
  },
  navCenterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.brandNavy,
    letterSpacing: -0.2,
  },
  loadingLabel: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 2,
  },

  heroCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    marginBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  heroGoldBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 2,
    backgroundColor: colors.brandGold,
  },
  heroEyebrow: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  heroTitle: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: '600',
    color: colors.brandNavy,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  heroMeta: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
  },
  statChip: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 1,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  errorIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.brandNavy,
    marginTop: 10,
  },
  errorText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: colors.brandNavy,
  },
  retryBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },

  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: 28,
    paddingHorizontal: 18,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.brandNavy,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

  daySection: {},
  daySectionGap: {
    marginTop: 18,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  dayName: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  sessionCount: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
  },
  sessionsStack: {
    gap: 8,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  timeColumn: {
    width: 44,
    alignItems: 'flex-start',
  },
  startTime: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brandNavy,
    fontVariant: ['tabular-nums'],
  },
  endTime: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSoft,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  sessionBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
    marginLeft: 4,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionText: {
    flex: 1,
    minWidth: 0,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.15,
    lineHeight: 18,
  },
  subjectCode: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  ampmText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginLeft: 8,
    minWidth: 22,
    textAlign: 'right',
  },
});
