import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { usePortalData, scoreToGrade } from '../hooks/usePortalData';
import { colors } from '../theme';

const SUBJECT_ICONS = {
  Mathematics: 'calculator-variant',
  Science: 'microscope',
  English: 'book-open-variant',
  Social: 'earth',
  'Religious & Moral': 'hands-pray',
  'Creative Arts': 'palette',
  Computing: 'laptop',
  French: 'translate',
};

function getGradeColor(grade) {
  if (!grade) return colors.textSoft;
  if (['A1', 'B2', 'B3'].includes(grade)) return '#166534';
  if (['C4', 'C5', 'C6'].includes(grade)) return '#92400E';
  return '#991B1B';
}

export default function GradesScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, error, refetch } = usePortalData();
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
        <Text style={styles.errorTitle}>Failed to load grades</Text>
        <Text style={styles.errorText}>{error.message}</Text>
      </View>
    );
  }

  const results = data?.results || [];
  const groupedByTerm = {};
  results.forEach((result) => {
    if (!groupedByTerm[result.term]) {
      groupedByTerm[result.term] = [];
    }
    groupedByTerm[result.term].push(result);
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Grades</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0369A1" />}>
        {Object.entries(groupedByTerm).length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-document-outline" size={56} color={colors.textSoft} />
            <Text style={styles.emptyText}>No grades available yet</Text>
          </View>
        ) : (
          Object.entries(groupedByTerm).map(([term, subjects]) => (
            <View key={term} style={styles.termSection}>
              <Text style={styles.termLabel}>{term}</Text>
              <View style={styles.subjectsGrid}>
                {subjects.map((result, idx) => (
                  <View key={idx} style={styles.gradeCard}>
                    <View style={styles.gradeCardTop}>
                      <View style={[styles.gradeIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                        <MaterialCommunityIcons
                          name={SUBJECT_ICONS[result.subject] || 'book-outline'}
                          size={24}
                          color="#3B82F6"
                        />
                      </View>
                      <Text style={styles.subjectName} numberOfLines={1}>
                        {result.subject}
                      </Text>
                    </View>

                    <View style={styles.gradeScore}>
                      <Text style={[styles.gradeValue, { color: getGradeColor(result.grade) }]}>
                        {result.grade || '—'}
                      </Text>
                      <Text style={styles.scoreLabel}>
                        {result.totalScore != null ? `${result.totalScore.toFixed(1)}%` : 'N/A'}
                      </Text>
                    </View>

                    {result.remarks && (
                      <Text style={styles.remarks} numberOfLines={2}>
                        {result.remarks}
                      </Text>
                    )}

                    {result.position && (
                      <Text style={styles.position}>Position: {result.position}</Text>
                    )}
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
  termSection: {
    marginBottom: 28,
  },
  termLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  subjectsGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  gradeCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gradeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  gradeIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subjectName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  gradeScore: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  gradeValue: {
    fontSize: 28,
    fontWeight: '700',
    marginRight: 12,
  },
  scoreLabel: {
    fontSize: 13,
    color: colors.textSoft,
  },
  remarks: {
    fontSize: 13,
    color: colors.textSoft,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  position: {
    fontSize: 12,
    color: colors.textSoft,
    fontWeight: '500',
  },
});
