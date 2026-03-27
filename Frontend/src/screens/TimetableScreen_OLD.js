import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTimetable } from '../hooks/useTimetable';
import { colors } from '../theme';

const DAY_COLORS = {
  Monday: '#E0F2FE',
  Tuesday: '#DCFCE7',
  Wednesday: '#FFEDD5',
  Thursday: '#EDE9FE',
  Friday: '#FEF3C7',
};

const DAY_ICON_COLORS = {
  Monday: '#0369A1',
  Tuesday: '#16A34A',
  Wednesday: '#EA580C',
  Thursday: '#7C3AED',
  Friday: '#B45309',
};

export default function TimetableScreen() {
  const insets = useSafeAreaInsets();
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
        <ActivityIndicator size="large" color={colors.iconBlue} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }]}>
        <Text style={styles.errorTitle}>Failed to load timetable</Text>
        <Text style={styles.errorText}>{error.message}</Text>
      </View>
    );
  }

  const classData = data?.class;
  const entries = data?.entries || [];

  // Group entries by day
  const groupedByDay = {};
  entries.forEach((entry) => {
    const day = entry.dayName;
    if (!groupedByDay[day]) {
      groupedByDay[day] = [];
    }
    groupedByDay[day].push(entry);
  });

  // Sort by day of week
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const sortedDays = dayOrder.filter((day) => groupedByDay[day]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Class Timetable</Text>
        {classData && (
          <Text style={styles.headerSubtitle}>
            {classData.name} • Level {classData.level}
          </Text>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0369A1" />}>
        {sortedDays.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={56} color={colors.textSoft} />
            <Text style={styles.emptyText}>No timetable available</Text>
          </View>
        ) : (
          sortedDays.map((day) => (
            <View key={day} style={styles.daySection}>
              <View style={[styles.dayHeader, { backgroundColor: DAY_COLORS[day] || '#F3F4F6' }]}>
                <MaterialCommunityIcons
                  name="calendar-outline"
                  size={20}
                  color={DAY_ICON_COLORS[day] || colors.text}
                />
                <Text style={styles.dayLabel}>{day}</Text>
              </View>

              <View style={styles.sessionsContainer}>
                {groupedByDay[day].map((entry, idx) => (
                  <View key={idx} style={styles.sessionCard}>
                    <View style={styles.sessionTime}>
                      <Text style={styles.timeText}>
                        {entry.startTime} - {entry.endTime}
                      </Text>
                    </View>

                    <View style={styles.sessionContent}>
                      <Text style={styles.subjectName}>{entry.subject?.name || 'Unknown'}</Text>
                      {entry.subject?.code && (
                        <Text style={styles.subjectCode}>{entry.subject.code}</Text>
                      )}
                    </View>

                    <View style={styles.sessionIcon}>
                      <MaterialCommunityIcons name="book-open-variant" size={18} color={colors.iconBlue} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSoft,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSoft,
  },
  daySection: {
    marginBottom: 24,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 10,
  },
  sessionsContainer: {
    flexDirection: 'column',
    gap: 10,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sessionTime: {
    minWidth: 70,
    marginRight: 12,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSoft,
  },
  sessionContent: {
    flex: 1,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  subjectCode: {
    fontSize: 12,
    color: colors.textSoft,
  },
  sessionIcon: {
    marginLeft: 12,
  },
});
