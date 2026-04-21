import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import Svg, {
  Defs,
  LinearGradient,
  Line,
  Path,
  Rect,
  Stop,
  Circle,
  Text as SvgText,
} from 'react-native-svg';
import { usePortalData, average, scoreToGrade } from '../hooks/usePortalData';
import { colors, radius, TAB_BAR_HEIGHT } from '../theme';

/** Navy / gold / muted surfaces — matches Fees & Attendance */
const SUBJECT_TINTS = [
  colors.yellowMuted,
  colors.brandNavyMuted,
  colors.hlFeeBlueBg,
  colors.quickTimeBg,
  colors.iconBlueMuted,
  '#F5F0E0',
];

/** Bar chart gradients (6 max) — brand spectrum, not rainbow */
const BAR_GRADIENT_BASE = [
  ['#1B4480', '#2A5BA8'],
  ['#2A5BA8', '#3D6496'],
  ['#C9A020', '#D4B038'],
  ['#1B4480', '#C9A020'],
  ['#5C7CAD', '#1B4480'],
  ['#A07C10', '#C9A020'],
];

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
  if (['A1', 'B2', 'B3'].includes(grade)) return colors.brandNavy;
  if (['C4', 'C5', 'C6'].includes(grade)) return colors.brandGoldDark;
  return colors.danger;
}

const CHART_W = 300;
/** Plot area: top pad for % labels, bottom for baseline */
const CHART_H = 162;
const PLOT_TOP = 22;
const PLOT_BOTTOM = CHART_H - 12;
const PLOT_H = PLOT_BOTTOM - PLOT_TOP;

/**
 * Renders the score distribution: gradient plot, dashed grid, bars with % labels, area + trend.
 */
function ScoreDistributionChart({ subjects }) {
  const n = subjects.length;
  const maxScore = 100;
  const innerPad = 14;
  const innerW = CHART_W - innerPad * 2;
  const slot = n > 0 ? innerW / n : innerW;
  const barWidth = Math.min(28, Math.max(18, slot * 0.55));

  const getBarX = (i) => innerPad + i * slot + (slot - barWidth) / 2;
  const barCenterX = (i) => getBarX(i) + barWidth / 2;

  const scoreY = (score) => {
    if (score == null) return PLOT_BOTTOM - 4;
    const h = (score / maxScore) * PLOT_H * 0.94;
    return PLOT_BOTTOM - h;
  };

  const pts = subjects.map((r, i) => {
    const sc = r.totalScore;
    const y = scoreY(sc);
    return [barCenterX(i), y];
  });

  const trendD =
    pts.length > 1
      ? pts.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ')
      : '';

  const areaD =
    pts.length > 1
      ? `${trendD} L ${pts[pts.length - 1][0]} ${PLOT_BOTTOM} L ${pts[0][0]} ${PLOT_BOTTOM} Z`
      : '';

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartGoldAccent} />
      <View style={styles.chartCardHeader}>
        <View>
          <Text style={styles.chartKicker}>By subject</Text>
          <Text style={styles.chartHeadline}>Score distribution</Text>
        </View>
        <View style={styles.chartLegendMini}>
          <View style={styles.chartLegendItem}>
            <View style={[styles.chartLegendSwatch, { backgroundColor: colors.brandNavy }]} />
            <Text style={styles.chartLegendTxt}>Bars</Text>
          </View>
          <View style={styles.chartLegendItem}>
            <View style={[styles.chartLegendDot, { borderColor: colors.brandGold }]} />
            <Text style={styles.chartLegendTxt}>Trend</Text>
          </View>
        </View>
      </View>

      <View style={styles.chartInner}>
        <View style={styles.chartY}>
          {['100', '75', '50', '25'].map((t) => (
            <Text key={t} style={styles.yLabel}>
              {t}%
            </Text>
          ))}
        </View>
        <View style={styles.chartMain}>
          <Svg width={CHART_W} height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
            <Defs>
              <LinearGradient id="chartPlotBg" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
                <Stop offset="1" stopColor="#E8EEF7" stopOpacity="1" />
              </LinearGradient>
              <LinearGradient id="trendAreaFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#1B4480" stopOpacity="0.14" />
                <Stop offset="1" stopColor="#1B4480" stopOpacity="0.02" />
              </LinearGradient>
              {['gA', 'gB', 'gC', 'gD', 'gE', 'gF'].map((id, i) => {
                const [top, bottom] = BAR_GRADIENT_BASE[i] ?? BAR_GRADIENT_BASE[0];
                return (
                  <LinearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={top} stopOpacity="0.98" />
                    <Stop offset="1" stopColor={bottom} stopOpacity="0.78" />
                  </LinearGradient>
                );
              })}
            </Defs>

            <Rect
              x={4}
              y={PLOT_TOP - 2}
              width={CHART_W - 8}
              height={PLOT_BOTTOM - PLOT_TOP + 4}
              rx={12}
              fill="url(#chartPlotBg)"
              stroke="rgba(27, 68, 128, 0.1)"
              strokeWidth={1}
            />

            {[0.25, 0.5, 0.75].map((frac) => (
              <Line
                key={frac}
                x1={8}
                y1={PLOT_TOP + PLOT_H * frac}
                x2={CHART_W - 8}
                y2={PLOT_TOP + PLOT_H * frac}
                stroke="rgba(27, 68, 128, 0.1)"
                strokeWidth={1}
                strokeDasharray="4 7"
              />
            ))}

            <Line
              x1={8}
              y1={PLOT_BOTTOM}
              x2={CHART_W - 8}
              y2={PLOT_BOTTOM}
              stroke="#C9A020"
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.85}
            />

            {areaD.length > 8 && <Path d={areaD} fill="url(#trendAreaFill)" />}

            {subjects.map((r, i) => {
              const sc = r.totalScore;
              const h =
                sc != null ? Math.max(6, (sc / maxScore) * PLOT_H * 0.94) : 6;
              const x = getBarX(i);
              const y = PLOT_BOTTOM - h;
              return (
                <Rect
                  key={i}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={h}
                  rx={7}
                  ry={7}
                  fill={`url(#g${['A', 'B', 'C', 'D', 'E', 'F'][i]})`}
                />
              );
            })}

            {subjects.map((r, i) => {
              const sc = r.totalScore;
              if (sc == null) return null;
              const y = scoreY(sc);
              return (
                <SvgText
                  key={`lbl-${i}`}
                  x={barCenterX(i)}
                  y={Math.max(PLOT_TOP + 11, y - 5)}
                  fontSize={10}
                  fontWeight="700"
                  fill="#1B4480"
                  textAnchor="middle"
                >
                  {`${Math.round(sc)}%`}
                </SvgText>
              );
            })}

            {trendD.length > 8 && (
              <Path
                d={trendD}
                stroke="#1B4480"
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {pts.map((p, i) => (
              <Circle key={`pt-${i}`} cx={p[0]} cy={p[1]} r={4} fill="#C9A020" stroke="#FFFFFF" strokeWidth={1.5} />
            ))}
          </Svg>

          <View style={styles.chartX}>
            {subjects.map((r, i) => (
              <Text key={i} style={styles.xLabel} numberOfLines={1}>
                {r.subject.split(' ')[0]}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function SubjectTile({ title, score, grade, tint, icon }) {
  return (
    <View style={[styles.subjectTile, { flex: 1 }]}>
      <View style={styles.subjectTileTop}>
        <MaterialCommunityIcons name={icon || 'book-outline'} size={20} color={colors.brandNavy} />
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
        <ActivityIndicator size="large" color={colors.brandNavy} />
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

  const chartSubjects = results.slice(0, 6);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => navigation.navigate('Overview')}
          hitSlop={12}
          style={styles.headerLeft}
        >
          <Ionicons name="chevron-back" size={22} color={colors.brandNavy} />
          <Text style={styles.headerTitle}>Examination</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 18 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandNavy} />
        }
      >
        {results.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={36} color={colors.brandGold} />
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
                    <MaterialCommunityIcons name="calendar-check" size={24} color={colors.brandNavy} />
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
                    <Ionicons name="school-outline" size={22} color={colors.white} />
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

            {chartSubjects.length > 0 && <ScoreDistributionChart subjects={chartSubjects} />}

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
                      <View style={[styles.resultGradeBadge, { marginLeft: 6 }]}>
                        <Text style={[styles.resultGradeBadgeText, { color: getGradeColor(r.grade) }]}>
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
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.brandNavy },

  emptyCard: {
    backgroundColor: colors.cardBlue,
    borderRadius: radius.md,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brandNavyMuted,
    marginTop: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.brandNavy },
  emptyBody: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },

  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  summaryCard: {
    flex: 1,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  summaryCardWarm: {
    backgroundColor: colors.yellowMuted,
    borderColor: 'rgba(201, 160, 32, 0.28)',
  },
  summaryCardCool: {
    backgroundColor: colors.hlFeeBlueBg,
    borderColor: colors.brandNavyMuted,
  },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryIconWarm: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(201, 160, 32, 0.4)',
  },
  summaryIconCool: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.brandNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: { fontSize: 12, fontWeight: '800', color: colors.brandNavy, lineHeight: 15 },
  summaryMidTitle: { marginTop: 14, fontSize: 12, fontWeight: '800', color: colors.text },
  summaryPctWarm: { marginTop: 6, fontSize: 28, fontWeight: '900', color: colors.brandNavy },
  summaryPctCool: { marginTop: 18, fontSize: 28, fontWeight: '900', color: colors.brandNavy },
  summaryFoot: { marginTop: 4, fontSize: 11, fontWeight: '700', color: colors.textMuted },
  gradeBadgeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.yellowMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(201, 160, 32, 0.45)',
  },
  gradeBadgeText: { fontSize: 11, fontWeight: '900', color: colors.brandNavy },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: colors.brandNavy, marginTop: 6, marginBottom: 10 },
  chartCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 14,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brandNavyMuted,
    overflow: 'hidden',
  },
  chartGoldAccent: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 3,
    backgroundColor: colors.brandGold,
  },
  chartCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 4,
    gap: 6,
  },
  chartKicker: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.brandGoldDark,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  chartHeadline: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.brandNavy,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  chartLegendMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
  },
  chartLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  chartLegendSwatch: {
    width: 10,
    height: 8,
    borderRadius: 2,
  },
  chartLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  chartLegendTxt: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  chartInner: { flexDirection: 'row', alignItems: 'flex-start' },
  chartY: { width: 38, height: 162, justifyContent: 'space-between', paddingTop: 2, paddingBottom: 2 },
  yLabel: { fontSize: 9, fontWeight: '700', color: colors.textSoft, fontVariant: ['tabular-nums'] },
  chartMain: { flex: 1 },
  chartX: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginTop: 6,
  },
  xLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.brandNavy,
    flex: 1,
    textAlign: 'center',
    opacity: 0.85,
  },

  subjectTiles: { flexDirection: 'row', gap: 10, marginBottom: 18, flexWrap: 'wrap' },
  subjectTile: {
    minWidth: '30%',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brandNavyMuted,
  },
  subjectTileTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subjectTileTitle: { fontSize: 12, fontWeight: '800', color: colors.brandNavy, flex: 1 },
  subjectTileScore: { marginTop: 8, fontSize: 20, fontWeight: '900' },
  subjectTilePill: { marginTop: 10, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  subjectTilePillText: { fontSize: 11, fontWeight: '800', color: colors.brandNavy },

  resultsCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
    marginBottom: 14,
  },
  resultRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11 },
  resultRowRule: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  resultSubject: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.brandNavy },
  resultTerm: { fontSize: 11, color: colors.textSoft, marginRight: 10 },
  resultScore: { fontSize: 14, fontWeight: '800' },
  resultGradeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.brandNavyMuted,
    minWidth: 36,
    alignItems: 'center',
  },
  resultGradeBadgeText: { fontSize: 11, fontWeight: '800' },
});
