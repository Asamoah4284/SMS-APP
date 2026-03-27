import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import { useTimetable } from '../hooks/useTimetable';
import { colors } from '../theme';

const DAY_COLORS = {
  Monday: { bg: '#E0F2FE', border: '#0369A1', icon: '#0369A1' },
  Tuesday: { bg: '#DCFCE7', border: '#16A34A', icon: '#16A34A' },
  Wednesday: { bg: '#FFEDD5', border: '#EA580C', icon: '#EA580C' },
  Thursday: { bg: '#EDE9FE', border: '#7C3AED', icon: '#7C3AED' },
  Friday: { bg: '#FEF3C7', border: '#B45309', icon: '#B45309' },
};

const FALLBACK_DAY_COLOR = { bg: '#F1F5F9', border: '#64748B', icon: '#475569' };
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

function SessionCard({ entry, dayColor, index }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 50),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const icon = SUBJECT_ICONS[entry.subject?.name] || 'book-outline';
  const safeStartTime = entry?.startTime || '--:--';
  const safeEndTime = entry?.endTime || '--:--';
  const [startHour] = safeStartTime.split(':');
  const hour = parseInt(startHour, 10);
  const isAfternoon = hour >= 12;

  return (
    <Animated.View
      style={[
        styles.sessionCardWrapper,
        {
          transform: [
            {
              scaleY: scaleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ],
          opacity: fadeAnim,
        },
      ]}
    >
      <View style={[styles.sessionCard, { borderLeftColor: dayColor.border, borderLeftWidth: 5 }]}>
        {/* Left time section */}
        <View style={styles.timeSection}>
          <Text style={styles.startTime}>{safeStartTime}</Text>
          <Text style={styles.endTime}>{safeEndTime}</Text>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: dayColor.border }]} />

        {/* Center content */}
        <View style={styles.contentSection}>
          <View style={styles.titleRow}>
            <View style={[styles.iconBadge, { backgroundColor: dayColor.bg }]}>
              <MaterialCommunityIcons name={icon} size={20} color={dayColor.icon} />
            </View>
            <View style={styles.textContent}>
              <Text style={styles.subjectName} numberOfLines={1}>
                {entry.subject?.name || 'Unknown'}
              </Text>
              {entry.subject?.code && (
                <Text style={styles.subjectCode}>{entry.subject.code}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Right indicator */}
        <View style={[styles.timeIndicator, { backgroundColor: dayColor.bg }]}>
          <Text style={[styles.indicatorText, { color: dayColor.icon }]}>
            {isAfternoon ? 'PM' : 'AM'}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function TimetableScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, error, refetch } = useTimetable();
  const [refreshing, setRefreshing] = useState(false);
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

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
        <ActivityIndicator size="large" color={colors.iconBlue} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header} />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={56} color="#EF4444" />
          <Text style={styles.errorTitle}>Failed to load timetable</Text>
          <Text style={styles.errorText}>{error.message}</Text>
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

  // Group entries by day
  const groupedByDay = {};
  entries.forEach((entry) => {
    const day = getNormalizedDay(entry);
    if (!groupedByDay[day]) {
      groupedByDay[day] = [];
    }
    groupedByDay[day].push(entry);
  });

  // Sort by known day order, then append any unknown labels
  const knownDays = DAY_ORDER.filter((day) => groupedByDay[day]);
  const unknownDays = Object.keys(groupedByDay)
    .filter((day) => !DAY_ORDER.includes(day))
    .sort((a, b) => a.localeCompare(b));
  const sortedDays = [...knownDays, ...unknownDays];

  // Calculate stats
  const totalSessions = entries.length;
  const totalDays = sortedDays.length;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Sticky Header */}
      <Animated.View style={[styles.header, { opacity: headerFade }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Weekly Schedule</Text>
          {classData && (
            <Text style={styles.headerSubtitle}>
              {classData.name} • {classData.level}
            </Text>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="calendar-outline" size={18} color={colors.iconBlue} />
            <Text style={styles.statValue}>{totalDays}</Text>
            <Text style={styles.statLabel}>Days</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="clock-outline" size={18} color="#16A34A" />
            <Text style={styles.statValue}>{totalSessions}</Text>
            <Text style={styles.statLabel}>Classes</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="book-open-variant" size={18} color="#F97316" />
            <Text style={styles.statValue}>
              {new Set(entries.map((e) => e.subject?.id).filter(Boolean)).size}
            </Text>
            <Text style={styles.statLabel}>Subjects</Text>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.iconBlue} />
        }
      >
        {sortedDays.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={72} color={colors.border} />
            <Text style={styles.emptyTitle}>No Schedule</Text>
            <Text style={styles.emptyText}>Timetable will be available soon</Text>
          </View>
        ) : (
          sortedDays.map((day, dayIndex) => {
            const dayColor = DAY_COLORS[day] || FALLBACK_DAY_COLOR;

            return (
              <View key={day} style={styles.daySection}>
                {/* Day Header */}
                <View style={[styles.dayHeaderContainer, { marginTop: dayIndex === 0 ? 0 : 20 }]}>
                  <View
                    style={[
                      styles.dayBadge,
                      {
                        backgroundColor: dayColor.bg,
                        borderColor: dayColor.border,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="calendar-check-outline"
                      size={16}
                      color={dayColor.icon}
                    />
                    <Text
                      style={[
                        styles.dayName,
                        { color: dayColor.icon },
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                  <Text style={styles.sessionCount}>
                    {groupedByDay[day].length} class{groupedByDay[day].length !== 1 ? 'es' : ''}
                  </Text>
                </View>

                {/* Sessions */}
                <View style={styles.sessionsContainer}>
                  {groupedByDay[day].map((entry, idx) => (
                    <SessionCard
                      key={`${day}-${idx}`}
                      entry={entry}
                      dayColor={dayColor}
                      index={dayIndex * 5 + idx}
                    />
                  ))}
                </View>
              </View>
            );
          })
        )}

        {/* Footer spacing */}
        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerContent: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSoft,
    marginTop: 4,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSoft,
    marginTop: 2,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSoft,
    marginTop: 6,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  emptyText: {
    marginTop: 6,
    fontSize: 14,
    color: colors.textSoft,
    textAlign: 'center',
  },
  daySection: {
    marginBottom: 28,
  },
  dayHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    gap: 6,
  },
  dayName: {
    fontSize: 14,
    fontWeight: '600',
  },
  sessionCount: {
    fontSize: 12,
    color: colors.textSoft,
    fontWeight: '500',
  },
  sessionsContainer: {
    gap: 10,
  },
  sessionCardWrapper: {
    overflow: 'hidden',
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 5,
  },
  timeSection: {
    minWidth: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startTime: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  endTime: {
    fontSize: 11,
    color: colors.textSoft,
    marginTop: 2,
    fontWeight: '500',
  },
  divider: {
    width: 2,
    height: 32,
    marginHorizontal: 12,
    borderRadius: 1,
    opacity: 0.3,
  },
  contentSection: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  subjectCode: {
    fontSize: 12,
    color: colors.textSoft,
    marginTop: 2,
    fontWeight: '500',
  },
  timeIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 10,
  },
  indicatorText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
