import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Svg, {
  ClipPath,
  Defs,
  LinearGradient,
  G,
  Line,
  Path,
  Rect,
  Stop,
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

function getGradeColor(grade) {
  if (!grade) return colors.textSoft;
  if (['A1', 'B2', 'B3'].includes(grade)) return colors.brandNavy;
  if (['C4', 'C5', 'C6'].includes(grade)) return colors.brandGoldDark;
  return colors.danger;
}

function ordinalSuffix(n) {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

const CHART_W = 300;
/** Plot area: top pad for % labels, bottom for baseline */
const CHART_H = 162;
const PLOT_TOP = 22;
const PLOT_BOTTOM = CHART_H - 12;
const PLOT_H = PLOT_BOTTOM - PLOT_TOP;
const BAR_RADIUS = 7;

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Score distribution with entrance animation when the Exams tab gains focus.
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

  const barTargets = useMemo(
    () =>
      subjects.map((r, i) => {
        const sc = r.totalScore;
        const h = sc != null ? Math.max(6, (sc / maxScore) * PLOT_H * 0.94) : 6;
        return {
          x: getBarX(i),
          h,
          score: sc,
        };
      }),
    [subjects, maxScore, n, barWidth, slot]
  );

  const cardOpacity = useRef(new Animated.Value(0)).current;
  const gridOpacity = useRef(new Animated.Value(0)).current;
  const barAnimsRef = useRef([]);

  if (barAnimsRef.current.length !== n) {
    barAnimsRef.current = Array.from({ length: n }, () => new Animated.Value(0));
  }
  const barAnims = barAnimsRef.current;

  const runEntrance = useCallback(() => {
    cardOpacity.setValue(0);
    gridOpacity.setValue(0);
    barAnims.forEach((a) => a.setValue(0));

    Animated.sequence([
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(gridOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
      Animated.stagger(
        72,
        barAnims.map((anim) =>
          Animated.spring(anim, {
            toValue: 1,
            friction: 7,
            tension: 68,
            useNativeDriver: false,
          })
        )
      ),
    ]).start();
  }, [barAnims, cardOpacity, gridOpacity]);

  useFocusEffect(
    useCallback(() => {
      runEntrance();
    }, [runEntrance])
  );

  return (
    <Animated.View style={[styles.chartCard, { opacity: cardOpacity }]}>
      <View style={styles.chartCardHeader}>
        <View>
          <Text style={styles.chartKicker}>By subject</Text>
          <Text style={styles.chartHeadline}>Score distribution</Text>
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
              {['gA', 'gB', 'gC', 'gD', 'gE', 'gF'].map((id, i) => {
                const [top, bottom] = BAR_GRADIENT_BASE[i] ?? BAR_GRADIENT_BASE[0];
                return (
                  <LinearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={top} stopOpacity="0.98" />
                    <Stop offset="1" stopColor={bottom} stopOpacity="0.78" />
                  </LinearGradient>
                );
              })}
              <ClipPath id="barTopOnly">
                <Rect x={0} y={0} width={CHART_W} height={PLOT_BOTTOM} />
              </ClipPath>
            </Defs>

            <Rect
              x={4}
              y={PLOT_TOP - 2}
              width={CHART_W - 8}
              height={PLOT_BOTTOM - PLOT_TOP + 4}
              fill="url(#chartPlotBg)"
              stroke="rgba(27, 68, 128, 0.12)"
              strokeWidth={1}
            />

            {[0.25, 0.5, 0.75].map((frac) => (
              <AnimatedPath
                key={frac}
                d={`M 8 ${PLOT_TOP + PLOT_H * frac} L ${CHART_W - 8} ${PLOT_TOP + PLOT_H * frac}`}
                stroke="rgba(27, 68, 128, 0.1)"
                strokeWidth={1}
                strokeDasharray="4 7"
                fill="none"
                opacity={gridOpacity}
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
              opacity={0.9}
            />

            {subjects.map((r, i) => {
              const { x, h } = barTargets[i];
              const sc = r.totalScore;
              const anim = barAnims[i];
              if (!anim) return null;
              const BAR_BOTTOM_EXTEND = BAR_RADIUS;
              const animatedHeight = anim.interpolate({
                inputRange: [0, 1],
                outputRange: [BAR_BOTTOM_EXTEND, h + BAR_BOTTOM_EXTEND],
              });
              const animatedY = anim.interpolate({
                inputRange: [0, 1],
                outputRange: [PLOT_BOTTOM, PLOT_BOTTOM - h],
              });
              const gradeLabel =
                r.grade ?? (sc != null ? scoreToGrade(sc) : '—');
              const labelY = Math.max(PLOT_TOP + 8, PLOT_BOTTOM - h - 6);
              return (
                <G key={`bar-group-${i}`}>
                  <AnimatedRect
                    x={x}
                    y={animatedY}
                    width={barWidth}
                    height={animatedHeight}
                    rx={BAR_RADIUS}
                    ry={BAR_RADIUS}
                    fill={`url(#g${['A', 'B', 'C', 'D', 'E', 'F'][i]})`}
                    clipPath="url(#barTopOnly)"
                  />
                  <SvgText
                    x={barCenterX(i)}
                    y={labelY}
                    fontSize={barWidth < 20 ? 9 : 11}
                    fontWeight="800"
                    fill="#1B4480"
                    textAnchor="middle"
                  >
                    {gradeLabel}
                  </SvgText>
                </G>
              );
            })}
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
    </Animated.View>
  );
}

function ResultCard({ result, index, tint }) {
  const gradeColor = getGradeColor(result.grade);
  const pct = result.totalScore != null
    ? Math.max(0, Math.min(100, result.totalScore))
    : 0;

  const enter = useRef(new Animated.Value(0)).current;
  const fillProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = Math.min(index, 8) * 60;
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(enter, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fillProgress, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
    ]);
    anim.start();
    return () => anim.stop();
  }, [enter, fillProgress, index]);

  const translateY = enter.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });
  const fillWidth = fillProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${pct}%`],
  });

  return (
    <Animated.View
      style={[styles.resultCard, { opacity: enter, transform: [{ translateY }] }]}
    >
      <View style={[styles.resultIconWrap, { backgroundColor: tint }]}>
        <MaterialCommunityIcons
          name={SUBJECT_ICONS[result.subject] ?? 'book-open-variant'}
          size={20}
          color={colors.brandNavy}
        />
      </View>
      <View style={styles.resultMid}>
        <View style={styles.resultMidTop}>
          <Text style={styles.resultSubject} numberOfLines={1}>
            {result.subject}
          </Text>
          <Text
            style={[styles.resultScore, { color: gradeColor }]}
            numberOfLines={1}
          >
            {result.totalScore != null ? `${result.totalScore.toFixed(0)}%` : '—'}
          </Text>
        </View>
        <View style={styles.resultProgressTrack}>
          <Animated.View
            style={[
              styles.resultProgressFill,
              { width: fillWidth, backgroundColor: gradeColor },
            ]}
          />
        </View>
        <View style={styles.resultMidBottom}>
          <View style={styles.resultTermRow}>
            <Ionicons
              name="calendar-outline"
              size={11}
              color={colors.textSoft}
            />
            <Text style={styles.resultTerm} numberOfLines={1}>
              {result.term ?? '—'}
            </Text>
          </View>
          {result.position ? (
            <Text style={styles.resultPosition}>Pos. {result.position}</Text>
          ) : null}
          <View
            style={[
              styles.resultGradeBadge,
              { backgroundColor: `${gradeColor}1A`, borderColor: `${gradeColor}40` },
            ]}
          >
            <Text style={[styles.resultGradeBadgeText, { color: gradeColor }]}>
              {result.grade ?? '—'}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function ExaminationScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch } = usePortalData();
  const [refreshing, setRefreshing] = useState(false);
  const canGoBack = navigation?.canGoBack?.() ?? false;

  const handleBack = () => {
    if (canGoBack) {
      navigation.goBack();
      return;
    }
    navigation.getParent()?.navigate('Overview', { screen: 'Home' });
  };

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
  const classPositionByTerm = data?.classPositionByTerm ?? {};
  const scores = results.map(r => r.totalScore).filter(s => s != null);
  const avgScore = average(scores);
  const avgGrade = scoreToGrade(avgScore);
  const mostRecent = results[0] ?? null;

  const mostRecentTermId = mostRecent?.termId;
  const overallRank = mostRecentTermId ? classPositionByTerm[mostRecentTermId] : null;
  const overallPositionText = overallRank
    ? `${overallRank.position}${ordinalSuffix(overallRank.position)} of ${overallRank.outOf}`
    : null;

  const chartSubjects = results.slice(0, 6);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={styles.headerLeft}
        >
          <Ionicons name="chevron-back" size={22} color={colors.brandNavy} />
          <Text style={styles.headerTitle}>Examination</Text>
        </Pressable>
        {results.length > 0 && (
          <Pressable
            onPress={() => navigation.navigate('ReportCard', { termId: mostRecentTermId })}
            hitSlop={10}
            style={styles.reportCardBtn}
          >
            <Ionicons name="document-text-outline" size={16} color={colors.brandNavy} />
            <Text style={styles.reportCardBtnText}>Report card</Text>
          </Pressable>
        )}
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
              {/* Most Recent — light card with gold accents */}
              <View style={[styles.summaryCard, styles.summaryCardWarm]}>
                <View style={styles.warmAccent} />
                <View style={styles.summaryHeaderRow}>
                  <View style={styles.summaryKickerRow}>
                    <View style={styles.warmKickerIcon}>
                      <MaterialCommunityIcons
                        name="trending-up"
                        size={11}
                        color={colors.brandGoldDark}
                      />
                    </View>
                    <Text style={styles.warmKicker}>RECENT</Text>
                  </View>
                  {mostRecent?.position ? (
                    <Text style={styles.warmPositionBadge}>Pos. {mostRecent.position}</Text>
                  ) : null}
                  {mostRecent?.term ? (
                    <Text style={styles.warmTermBadge} numberOfLines={1}>
                      {mostRecent.term}
                    </Text>
                  ) : null}
                </View>

                <Text style={styles.summarySubject} numberOfLines={1}>
                  {mostRecent?.subject ?? '—'}
                </Text>

                <View style={styles.summaryScoreRow}>
                  <Text style={styles.summaryBigScore}>
                    {mostRecent?.totalScore != null
                      ? `${mostRecent.totalScore.toFixed(0)}`
                      : '—'}
                    <Text style={styles.summaryBigPct}>
                      {mostRecent?.totalScore != null ? '%' : ''}
                    </Text>
                  </Text>
                  <View style={styles.summaryGradePill}>
                    <Text style={styles.summaryGradePillText}>
                      {avgGrade ?? '—'}
                    </Text>
                  </View>
                </View>

                <View style={styles.summaryProgressTrackLight}>
                  <View
                    style={[
                      styles.summaryProgressFill,
                      {
                        width: `${Math.min(
                          100,
                          Math.max(0, mostRecent?.totalScore ?? 0)
                        )}%`,
                        backgroundColor: colors.brandGold,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Overall — solid navy with gold highlights */}
              <View style={[styles.summaryCard, styles.summaryCardCool]}>
                <View style={styles.coolAccent} />
                <View style={styles.summaryHeaderRow}>
                  <View style={styles.summaryKickerRow}>
                    <View style={styles.coolKickerIcon}>
                      <Ionicons name="school" size={11} color={colors.white} />
                    </View>
                    <Text style={styles.coolKicker}>OVERALL</Text>
                  </View>
                  <Text style={styles.coolTermBadge}>
                    {results.length} subj
                  </Text>
                </View>

                <Text style={styles.coolLabel} numberOfLines={1}>
                  {overallPositionText ? `Class rank: ${overallPositionText}` : 'Performance'}
                </Text>

                <View style={styles.summaryScoreRow}>
                  <Text style={styles.coolBigScore}>
                    {avgScore != null ? avgScore.toFixed(0) : '—'}
                    <Text style={styles.coolBigPct}>
                      {avgScore != null ? '%' : ''}
                    </Text>
                  </Text>
                  <View style={styles.coolGradePill}>
                    <Text style={styles.coolGradePillText}>{avgGrade}</Text>
                  </View>
                </View>

                <View style={styles.summaryProgressTrackDark}>
                  <View
                    style={[
                      styles.summaryProgressFill,
                      {
                        width: `${Math.min(
                          100,
                          Math.max(0, avgScore ?? 0)
                        )}%`,
                        backgroundColor: colors.brandGold,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            {chartSubjects.length > 0 && <ScoreDistributionChart subjects={chartSubjects} />}

            {/* All results with per-subject positions */}
            {results.length > 0 && (
              <>
                <View style={styles.allResultsHeader}>
                  <Text style={styles.sectionTitle}>All Results</Text>
                  <View style={styles.allResultsCountPill}>
                    <Text style={styles.allResultsCountText}>{results.length}</Text>
                  </View>
                </View>
                <View style={styles.resultsList}>
                  {results.map((r, i) => (
                    <ResultCard
                      key={`${r.subject}-${r.term ?? i}`}
                      result={r}
                      index={i}
                      tint={SUBJECT_TINTS[i % SUBJECT_TINTS.length]}
                    />
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
  reportCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.cardBlue,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brandNavyMuted,
  },
  reportCardBtnText: { fontSize: 11, fontWeight: '800', color: colors.brandNavy },

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

  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    minHeight: 158,
  },
  summaryCardWarm: {
    backgroundColor: colors.white,
    borderColor: 'rgba(201, 160, 32, 0.28)',
  },
  summaryCardCool: {
    backgroundColor: colors.brandNavy,
    borderColor: colors.brandNavy,
  },
  warmAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.brandGold,
  },
  coolAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.brandGold,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  summaryKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  warmKickerIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.yellowMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coolKickerIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warmKicker: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.brandGoldDark,
    letterSpacing: 0.7,
  },
  coolKicker: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.7,
  },
  warmTermBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSoft,
    maxWidth: 80,
  },
  coolTermBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  summarySubject: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: '800',
    color: colors.brandNavy,
  },
  coolLabel: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
  },
  summaryScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  summaryBigScore: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.brandNavy,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  summaryBigPct: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.brandGoldDark,
  },
  coolBigScore: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  coolBigPct: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.brandGold,
  },
  summaryGradePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.yellowMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(201, 160, 32, 0.45)',
  },
  summaryGradePillText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.brandNavy,
  },
  coolGradePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.brandGold,
  },
  coolGradePillText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.brandNavy,
  },
  summaryProgressTrackLight: {
    marginTop: 12,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(27, 68, 128, 0.08)',
    overflow: 'hidden',
  },
  summaryProgressTrackDark: {
    marginTop: 12,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    overflow: 'hidden',
  },
  summaryProgressFill: {
    height: '100%',
    borderRadius: 3,
  },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: colors.brandNavy, marginTop: 6, marginBottom: 10 },
  chartCard: {
    backgroundColor: colors.white,
    borderRadius: 0,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 14,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brandNavyMuted,
    overflow: 'hidden',
  },
  chartCardHeader: {
    marginBottom: 12,
    paddingTop: 4,
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
  allResultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 10,
  },
  allResultsCountPill: {
    minWidth: 22,
    height: 20,
    paddingHorizontal: 7,
    borderRadius: 10,
    backgroundColor: colors.brandNavyMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allResultsCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.brandNavy,
  },
  resultsList: {
    gap: 10,
    marginBottom: 14,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  resultIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultMid: { flex: 1, gap: 6 },
  resultMidTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  resultSubject: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: colors.brandNavy,
  },
  resultScore: {
    fontSize: 14,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  resultProgressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderLight,
    overflow: 'hidden',
  },
  resultProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  resultMidBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  resultTermRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  resultTerm: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSoft,
    flex: 1,
  },
  resultPosition: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.brandNavy,
    marginRight: 4,
  },
  warmPositionBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.brandGoldDark,
    marginLeft: 6,
  },
  resultGradeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    minWidth: 36,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  resultGradeBadgeText: { fontSize: 11, fontWeight: '900' },
});
