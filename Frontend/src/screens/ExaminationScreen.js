import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import Svg, { Defs, LinearGradient, Line, Path, Rect, Stop, Circle } from 'react-native-svg';
import { usePortalData, average, scoreToGrade } from '../hooks/usePortalData';
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

const SUBJECT_TINTS = ['#E0F2FE', '#DCFCE7', '#FFEDD5', '#EDE9FE', '#FEF3C7', '#FCE7F3'];
const SCORE_LABELS = [
  { score: 80, label: 'Excellent' },
  { score: 70, label: 'Very Good' },
  { score: 60, label: 'Good' },
  { score: 50, label: 'Average' },
  { score: 0,  label: 'Needs Work' },
];

function getLabel(score) {
  if (score == null) return '—';
  return SCORE_LABELS.find(s => score >= s.score)?.label ?? 'Needs Work';
}

function getGradeColor(grade) {
  if (!grade) return colors.textSoft;
  if (['A1','B2','B3'].includes(grade)) return '#166534';
  if (['C4','C5','C6'].includes(grade)) return '#92400E';
  return '#991B1B';
}

function SubjectTile({ title, score, grade, tint, icon }) {
  return (
    <View style={[styles.subjectTile, { flex: 1 }]}>
      <View style={styles.subjectTileTop}>
        <MaterialCommunityIcons name={icon || 'book-outline'} size={24} color="#334155" />
        <Text style={styles.subjectTileTitle} numberOfLines={1}>{title}</Text>
      </View>
      <Text style={[styles.subjectTileScore, { color: getGradeColor(grade) }]}>
        {score != null ? `${score.toFixed(0)}%` : '—'}
      </Text>
      <View style={[styles.subjectTilePill, { backgroundColor: tint }]}>
        <Text style={styles.subjectTilePillText}>{getLabel(score)}</Text>
      </View>
    </View>
  );
}

export default function ExaminationScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch } = usePortalData();
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

  const results = data?.results ?? [];
  const scores = results.map(r => r.totalScore).filter(s => s != null);
  const avgScore = average(scores);
  const avgGrade = scoreToGrade(avgScore);
  const mostRecent = results[0] ?? null;

  // Up to 3 subjects for tiles
  const subjectTiles = results.slice(0, 3);

  // Bar chart heights (up to 6 subjects for the chart)
  const chartSubjects = results.slice(0, 6);
  const barWidth = 26;
  const barXPositions = [26, 74, 122, 170, 218, 266];
  const maxScore = 100;
  const chartH = 130;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => navigation.navigate('Overview')}
          hitSlop={12}
          style={styles.headerLeft}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
          <Text style={styles.headerTitle}>Examination</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 18 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0369A1" />
        }
      >
        {results.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={40} color={colors.textSoft} />
            <Text style={styles.emptyTitle}>No results yet</Text>
            <Text style={styles.emptyBody}>Examination results will appear here once they are published by the school.</Text>
          </View>
        ) : (
          <>
            {/* Summary cards */}
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, styles.summaryCardWarm]}>
                <View style={styles.summaryTop}>
                  <View style={styles.summaryIconWarm}>
                    <MaterialCommunityIcons name="calendar-check" size={28} color="#92400E" />
                  </View>
                  <Text style={styles.summaryTitle}>Most Recent{'\n'}Result</Text>
                </View>
                <Text style={styles.summaryMidTitle} numberOfLines={1}>
                  {mostRecent?.subject ?? '—'}
                </Text>
                <Text style={styles.summaryPctWarm}>
                  {mostRecent?.totalScore != null ? `${mostRecent.totalScore.toFixed(0)}%` : '—'}
                </Text>
                <Text style={styles.summaryFoot}>Grade: {mostRecent?.grade ?? '—'}</Text>
              </View>

              <View style={[styles.summaryCard, styles.summaryCardCool]}>
                <View style={styles.summaryTop}>
                  <View style={styles.summaryIconCool}>
                    <Ionicons name="checkmark" size={24} color={colors.white} />
                  </View>
                  <Text style={styles.summaryTitle}>Overall{'\n'}Performance</Text>
                </View>
                <Text style={styles.summaryPctCool}>
                  {avgScore != null ? `${avgScore.toFixed(0)}%` : '—'}
                </Text>
                <View style={styles.gradeBadgeRow}>
                  <View style={styles.gradeBadge}>
                    <Text style={styles.gradeBadgeText}>{avgGrade}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Score distribution chart */}
            {chartSubjects.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Score Distribution</Text>
                <View style={styles.chartCard}>
                  <View style={styles.chartInner}>
                    <View style={styles.chartY}>
                      {['100', '75', '50', '25'].map((t) => (
                        <Text key={t} style={styles.yLabel}>{t}%</Text>
                      ))}
                    </View>
                    <View style={styles.chartMain}>
                      <Svg width={300} height={chartH} viewBox={`0 0 300 ${chartH}`}>
                        <Defs>
                          {['gA','gB','gC','gD','gE','gF'].map((id, i) => {
                            const colors2 = ['#3B82F6','#22C55E','#F59E0B','#EF4444','#8B5CF6','#EC4899'];
                            const c = colors2[i];
                            return (
                              <LinearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor={c} stopOpacity="0.95" />
                                <Stop offset="1" stopColor={c} stopOpacity="0.55" />
                              </LinearGradient>
                            );
                          })}
                        </Defs>
                        {[0.25, 0.5, 0.75].map((frac) => (
                          <Line key={frac} x1="0" y1={chartH * frac} x2="300" y2={chartH * frac}
                            stroke="rgba(15, 23, 42, 0.06)" />
                        ))}
                        {chartSubjects.map((r, i) => {
                          const h = r.totalScore != null ? (r.totalScore / maxScore) * chartH * 0.92 : 4;
                          const x = barXPositions[i] ?? 26 + i * 48;
                          return (
                            <Rect key={i} x={x} y={chartH - h} width={barWidth} height={Math.max(4, h)}
                              rx="4" fill={`url(#g${['A','B','C','D','E','F'][i]})`} />
                          );
                        })}
                        {/* Trend line */}
                        {chartSubjects.length > 1 && (() => {
                          const points = chartSubjects.map((r, i) => {
                            const x = (barXPositions[i] ?? 26 + i * 48) + barWidth / 2;
                            const y = r.totalScore != null ? chartH - (r.totalScore / maxScore) * chartH * 0.92 : chartH - 4;
                            return `${x},${y}`;
                          }).join(' ');
                          // Simple polyline path
                          const pts = chartSubjects.map((r, i) => {
                            const x = (barXPositions[i] ?? 26 + i * 48) + barWidth / 2;
                            const y = r.totalScore != null ? chartH - (r.totalScore / maxScore) * chartH * 0.92 : chartH - 4;
                            return [x, y];
                          });
                          const d = pts.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');
                          return (
                            <>
                              <Path d={d} stroke="#2563EB" strokeWidth="2.5" fill="none" />
                              {pts.map((p, i) => (
                                <Circle key={i} cx={p[0]} cy={p[1]} r="4" fill="#2563EB" opacity="0.9" />
                              ))}
                            </>
                          );
                        })()}
                      </Svg>
                      <View style={styles.chartX}>
                        {chartSubjects.map((r, i) => (
                          <Text key={i} style={styles.xLabel} numberOfLines={1}>
                            {r.subject.split(' ')[0]}
                          </Text>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              </>
            )}

            {/* Subject tiles */}
            <Text style={styles.sectionTitle}>Subject Performance</Text>
            <View style={styles.subjectTiles}>
              {subjectTiles.map((r, i) => (
                <SubjectTile
                  key={i}
                  title={r.subject}
                  score={r.totalScore}
                  grade={r.grade}
                  tint={SUBJECT_TINTS[i % SUBJECT_TINTS.length]}
                  icon={SUBJECT_ICONS[r.subject] ?? 'book-open-variant'}
                />
              ))}
            </View>

            {/* Full results list if more than 3 */}
            {results.length > 3 && (
              <>
                <Text style={styles.sectionTitle}>All Results</Text>
                <View style={styles.resultsCard}>
                  {results.map((r, i) => (
                    <View key={i} style={[styles.resultRow, i > 0 && styles.resultRowRule]}>
                      <Text style={styles.resultSubject} numberOfLines={1}>{r.subject}</Text>
                      <Text style={styles.resultTerm} numberOfLines={1}>{r.term}</Text>
                      <Text style={[styles.resultScore, { color: getGradeColor(r.grade) }]}>
                        {r.totalScore != null ? r.totalScore.toFixed(0) : '—'}
                      </Text>
                      <View style={[styles.gradeBadge, { marginLeft: 6 }]}>
                        <Text style={[styles.gradeBadgeText, { color: getGradeColor(r.grade) }]}>
                          {r.grade ?? '—'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.text },

  emptyCard: {
    backgroundColor: colors.white, borderRadius: 18, padding: 28,
    alignItems: 'center', gap: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderLight,
    marginTop: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptyBody: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },

  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  summaryCard: {
    flex: 1, borderRadius: 18, padding: 14,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderLight, overflow: 'hidden',
  },
  summaryCardWarm: { backgroundColor: '#FFF7ED' },
  summaryCardCool: { backgroundColor: '#ECFEFF' },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryIconWarm: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.18)', alignItems: 'center', justifyContent: 'center',
  },
  summaryIconCool: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#2F9E74', alignItems: 'center', justifyContent: 'center',
  },
  summaryTitle: { fontSize: 12, fontWeight: '800', color: colors.text, lineHeight: 15 },
  summaryMidTitle: { marginTop: 14, fontSize: 12, fontWeight: '800', color: colors.text },
  summaryPctWarm: { marginTop: 6, fontSize: 28, fontWeight: '900', color: '#14532D' },
  summaryPctCool: { marginTop: 18, fontSize: 28, fontWeight: '900', color: '#14532D' },
  summaryFoot: { marginTop: 4, fontSize: 11, fontWeight: '700', color: colors.textMuted },
  gradeBadgeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  gradeBadge: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.16)',
  },
  gradeBadgeText: { fontSize: 11, fontWeight: '900', color: '#166634' },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginTop: 6, marginBottom: 10 },
  chartCard: {
    backgroundColor: colors.white, borderRadius: 18, padding: 12,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderLight, marginBottom: 14,
  },
  chartInner: { flexDirection: 'row' },
  chartY: { width: 36, justifyContent: 'space-between', paddingTop: 4, paddingBottom: 24 },
  yLabel: { fontSize: 9, fontWeight: '600', color: colors.textSoft },
  chartMain: { flex: 1 },
  chartX: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 4, marginTop: 4 },
  xLabel: { fontSize: 9, fontWeight: '700', color: colors.textMuted, flex: 1, textAlign: 'center' },

  subjectTiles: { flexDirection: 'row', gap: 10, marginBottom: 18, flexWrap: 'wrap' },
  subjectTile: {
    minWidth: '30%', backgroundColor: colors.white, borderRadius: 18, padding: 12,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderLight,
  },
  subjectTileTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subjectTileTitle: { fontSize: 12, fontWeight: '800', color: colors.text, flex: 1 },
  subjectTileScore: { marginTop: 8, fontSize: 20, fontWeight: '900' },
  subjectTilePill: { marginTop: 10, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  subjectTilePillText: { fontSize: 11, fontWeight: '800', color: '#334155' },

  resultsCard: {
    backgroundColor: colors.white, borderRadius: 18, overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderLight, marginBottom: 14,
  },
  resultRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11 },
  resultRowRule: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  resultSubject: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.text },
  resultTerm: { fontSize: 11, color: colors.textSoft, marginRight: 10 },
  resultScore: { fontSize: 14, fontWeight: '800' },
});
