import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View, Pressable, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useState, useMemo } from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Rect, Text as SvgText } from 'react-native-svg';
import { usePortalData, scoreToGrade, average } from '../hooks/usePortalData';
import { colors, radius, shadowCard, TAB_BAR_HEIGHT } from '../theme';

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
  const g = grade.toUpperCase();
  if (['A1', 'B2', 'B3'].includes(g)) return colors.green;
  if (['C4', 'C5', 'C6'].includes(g)) return colors.yellow;
  return colors.red;
}

/**
 * A smooth line chart showing average score trends across terms.
 */
function TrendLineChart({ data }) {
  const { width: winW } = useWindowDimensions();
  const chartW = winW - 60;
  const chartH = 120;
  const padding = 20;
  
  if (!data || data.length === 0) {
    return (
      <View style={[styles.chartContainer, { height: chartH, justifyContent: 'center' }]}>
        <Text style={{ color: colors.textSoft, fontSize: 12 }}>Trend will appear after next term</Text>
      </View>
    );
  }

  const maxScore = 100;
  const minScore = 0;
  
  const points = data.map((d, i) => {
    const x = padding + (i * (chartW - 2 * padding)) / (data.length > 1 ? data.length - 1 : 1);
    const y = chartH - padding - ((d.avg - minScore) * (chartH - 2 * padding)) / (maxScore - minScore);
    return { x, y };
  });

  let pathData = `M ${points[0].x} ${points[0].y}`;
  if (points.length > 1) {
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cx = (curr.x + next.x) / 2;
      pathData += ` C ${cx} ${curr.y}, ${cx} ${next.y}, ${next.x} ${next.y}`;
    }
  }

  return (
    <View style={styles.chartContainer}>
      <Svg width={chartW} height={chartH}>
        <Defs>
          <LinearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.brandNavy} stopOpacity="0.8" />
            <Stop offset="1" stopColor={colors.brandNavyLight} stopOpacity="0.2" />
          </LinearGradient>
        </Defs>
        
        {/* Helper lines */}
        <Rect x={padding} y={padding} width={chartW - 2 * padding} height={chartH - 2 * padding} fill="none" stroke={colors.border} strokeWidth="1" strokeDasharray="4 4" />
        
        {points.length > 1 && (
          <Path d={pathData} fill="none" stroke={colors.brandNavy} strokeWidth="3" strokeLinecap="round" />
        )}
        
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r="5" fill={colors.brandGold} stroke={colors.white} strokeWidth="2" />
        ))}

        {data.map((d, i) => {
           const x = padding + (i * (chartW - 2 * padding)) / (data.length > 1 ? data.length - 1 : 1);
           return (
             <SvgText
               key={`label-${i}`}
               x={x}
               y={chartH - 2}
               fontSize="10"
               fill={colors.textSoft}
               textAnchor="middle"
               fontWeight="600"
             >
               {d.term.split(' ')[0]}
             </SvgText>
           );
        })}
      </Svg>
    </View>
  );
}

/**
 * Circular progress indicator for grades.
 */
function GradeCircularIndicator({ score, grade, size = 50 }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (score || 0) / 100;
  const offset = circumference - progress * circumference;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.borderLight}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getGradeColor(grade)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.gradeBadgeText, { color: getGradeColor(grade), fontSize: size * 0.3 }]}>
          {grade || '—'}
        </Text>
      </View>
    </View>
  );
}
export default function GradesScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, error, refetch } = usePortalData();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(null);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const { groupedByTerm, termTrend } = useMemo(() => {
    if (!data?.results) return { groupedByTerm: {}, termTrend: [] };
    
    const groups = {};
    data.results.forEach((r) => {
      if (!groups[r.term]) groups[r.term] = [];
      groups[r.term].push(r);
    });

    const trend = Object.entries(groups).map(([term, subjects]) => ({
      term,
      avg: average(subjects.map((s) => s.totalScore)),
    })).sort((a, b) => a.term.localeCompare(b.term)); // Basic sort, could be improved if term names are complex

    return { groupedByTerm: groups, termTrend: trend };
  }, [data]);

  const terms = Object.keys(groupedByTerm);
  const activeTerm = selectedTerm || terms[0];
  const subjects = groupedByTerm[activeTerm] || [];
  const avgScore = average(subjects.map((s) => s.totalScore));
  const avgGrade = scoreToGrade(avgScore);

  if (isLoading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.brandNavy} />
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

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Grades</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom }]} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandNavy} />}
      >
        {terms.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-document-outline" size={56} color={colors.textSoft} />
            <Text style={styles.emptyText}>No grades available yet</Text>
          </View>
        ) : (
          <>
            {/* Trend Summary */}
            <View style={styles.summaryCard}>
               <View style={styles.cardGoldAccent} />
               <View style={styles.summaryHeader}>
                 <View>
                   <Text style={styles.summaryKicker}>Performance Trend</Text>
                   <Text style={styles.summaryTitle}>Academic Growth</Text>
                 </View>
                 <View style={styles.avgBadge}>
                   <Text style={styles.avgBadgeScore}>{avgScore ? avgScore.toFixed(1) : '—'}%</Text>
                   <Text style={styles.avgBadgeLabel}>Avg Score</Text>
                 </View>
               </View>
               <TrendLineChart data={termTrend} />
            </View>

            {/* Term Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.termSelector} contentContainerStyle={styles.termSelectorContent}>
              {terms.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setSelectedTerm(t)}
                  style={[
                    styles.termChip,
                    activeTerm === t && styles.termChipActive
                  ]}
                >
                  <Text style={[styles.termChipText, activeTerm === t && styles.termChipTextActive]}>
                    {t}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.subjectsList}>
              <Text style={styles.sectionTitle}>{activeTerm} Results</Text>
              {subjects.map((result, idx) => (
                <View key={idx} style={styles.gradeCard}>
                  <View style={styles.gradeCardContent}>
                    <View style={[styles.gradeIcon, { backgroundColor: colors.cardBlue }]}>
                      <MaterialCommunityIcons
                        name={SUBJECT_ICONS[result.subject] || 'book-outline'}
                        size={24}
                        color={colors.brandNavy}
                      />
                    </View>
                    <View style={styles.subjectInfo}>
                      <Text style={styles.subjectName}>{result.subject}</Text>
                      <View style={styles.scoreDetailRow}>
                        <Text style={styles.scoreDetailItem}>Test: <Text style={styles.scoreDetailValue}>{result.classScore != null ? result.classScore.toFixed(0) : '—'}</Text></Text>
                        <View style={styles.scoreDetailDivider} />
                        <Text style={styles.scoreDetailItem}>Exam: <Text style={styles.scoreDetailValue}>{result.examScore != null ? result.examScore.toFixed(0) : '—'}</Text></Text>
                      </View>
                      <Text style={styles.scoreText}>
                        Total Score: <Text style={styles.scoreValue}>{result.totalScore != null ? result.totalScore.toFixed(1) : 'N/A'}</Text>
                      </Text>
                    </View>
                    <GradeCircularIndicator score={result.totalScore} grade={result.grade} />
                  </View>
                  
                  {(result.remarks || result.position) && (
                    <View style={styles.cardFooter}>
                      {result.remarks && (
                        <Text style={styles.remarks} numberOfLines={1}>
                          <Ionicons name="chatbubble-ellipses-outline" size={12} color={colors.textSoft} /> {result.remarks}
                        </Text>
                      )}
                      {result.position && (
                        <View style={styles.positionPlate}>
                          <Text style={styles.positionText}>Position: {result.position}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </>
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
    fontSize: 22,
    fontWeight: '800',
    color: colors.brandNavy,
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
  
  /* Summary Card */
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardGoldAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.brandGold,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryKicker: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.brandNavy,
    marginTop: 2,
  },
  avgBadge: {
    backgroundColor: colors.brandNavy,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  avgBadgeScore: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.brandGold,
  },
  avgBadgeLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.white,
    opacity: 0.8,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 8,
  },

  /* Term Selector */
  termSelector: {
    marginBottom: 20,
  },
  termSelectorContent: {
    paddingRight: 20,
  },
  termChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.borderLight,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  termChipActive: {
    backgroundColor: colors.brandNavyMuted,
    borderColor: colors.brandNavy,
  },
  termChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  termChipTextActive: {
    color: colors.brandNavy,
  },

  /* Subjects List */
  subjectsList: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    marginLeft: 4,
  },
  gradeCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  gradeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gradeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  scoreDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  scoreDetailItem: {
    fontSize: 12,
    color: colors.textSoft,
  },
  scoreDetailValue: {
    fontWeight: '600',
    color: colors.textMuted,
  },
  scoreDetailDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  scoreText: {
    fontSize: 12,
    color: colors.textSoft,
    marginTop: 6,
  },
  scoreValue: {
    fontWeight: '600',
    color: colors.textMuted,
  },
  gradeBadgeText: {
    fontWeight: '900',
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remarks: {
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.textSoft,
    flex: 1,
    marginRight: 10,
  },
  positionPlate: {
    backgroundColor: colors.cardBlue,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  positionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brandNavy,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.red,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSoft,
    textAlign: 'center',
  },
});
