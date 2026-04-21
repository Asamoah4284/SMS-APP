import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import Svg, {
  Circle,
  Defs,
  Line,
  Polygon,
  Rect,
  Stop,
  Text as SvgText,
  LinearGradient,
} from 'react-native-svg';
import { usePortalData, scoreToGrade, average } from '../hooks/usePortalData';
import { colors, radius, TAB_BAR_HEIGHT } from '../theme';

/** Bar chart — single navy tone, full width, no line overlay */
function SubjectScoreBars({ subjects }) {
  const { width: winW } = useWindowDimensions();
  const pad = 16;
  const chartW = Math.max(260, winW - 36 - pad * 2);
  const chartH = 82;
  const baselineY = chartH - 8;
  const plotH = baselineY - 10;
  const n = subjects.length;
  if (n === 0) return null;

  const gap = n > 6 ? 5 : 8;
  const innerW = chartW - 4;
  const barW = Math.max(6, (innerW - gap * (n - 1)) / n);

  return (
    <View style={styles.trendBarsOuter}>
      <Svg width={chartW} height={chartH + 22} viewBox={`0 0 ${chartW} ${chartH + 22}`}>
        <Defs>
          <LinearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#2A5BA8" />
            <Stop offset="1" stopColor="#1B4480" />
          </LinearGradient>
        </Defs>
        <Line x1="0" y1={baselineY} x2={chartW} y2={baselineY} stroke="rgba(27, 68, 128, 0.15)" strokeWidth={1} />
        {subjects.map((r, i) => {
          const raw = r.totalScore != null ? Math.max(0, Math.min(100, r.totalScore)) : 0;
          const h = raw > 0 ? Math.max(6, (raw / 100) * plotH) : 4;
          const y = baselineY - h;
          const bx = 2 + i * (barW + gap);
          return (
            <Rect
              key={i}
              x={bx}
              y={y}
              width={barW}
              height={h}
              rx={4}
              fill="url(#barFill)"
              opacity={0.88}
            />
          );
        })}
        {subjects.map((r, i) => {
          const label = r.subject.trim().split(/\s+/)[0] ?? '';
          const short = label.length > 4 ? `${label.slice(0, 3)}.` : label;
          const cx = 2 + i * (barW + gap) + barW / 2;
          return (
            <SvgText
              key={`lbl-${i}`}
              x={cx}
              y={chartH + 14}
              fontSize="10"
              fontWeight="600"
              fill="#64748B"
              textAnchor="middle"
            >
              {short}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const RADAR_AXES = 5;

/** Short label for around the chart (first word, trimmed). */
function shortSubjectLabel(name) {
  const first = (name ?? '').trim().split(/\s+/)[0] ?? '';
  if (!first) return '';
  return first.length > 9 ? `${first.slice(0, 8)}…` : first;
}

/**
 * Pentagon radar: scale rings, gradient fill, gold vertices, % at each point.
 * `items`: { label, fullName, value: 0–1, score }[]
 */
function SubjectRadarChart({ items = [] }) {
  const { width: winW } = useWindowDimensions();
  const chartSize = Math.min(300, Math.max(232, winW - 36 - 32));
  const cx = chartSize / 2;
  const cy = chartSize / 2;
  const maxR = chartSize * 0.34;
  const labelR = chartSize * 0.445;

  const padded = [...items.slice(0, RADAR_AXES)];
  while (padded.length < RADAR_AXES) {
    padded.push({ label: '', fullName: '', value: 0, score: null });
  }

  const angles = Array.from({ length: RADAR_AXES }, (_, i) => {
    return (-Math.PI / 2 + (i * 2 * Math.PI) / RADAR_AXES);
  });

  const ringPoints = (scale) =>
    angles.map((a) => `${cx + maxR * scale * Math.cos(a)},${cy + maxR * scale * Math.sin(a)}`).join(' ');

  const dataPoints = angles.map((a, i) => {
    const v = Math.max(0.06, Math.min(1, padded[i].value));
    return {
      x: cx + maxR * v * Math.cos(a),
      y: cy + maxR * v * Math.sin(a),
      v,
    };
  });
  const dataPoly = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <Svg width={chartSize} height={chartSize} viewBox={`0 0 ${chartSize} ${chartSize}`}>
      <Defs>
        <LinearGradient id="radarFillPerf" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#1B4480" stopOpacity={0.42} />
          <Stop offset="55%" stopColor="#2A5BA8" stopOpacity={0.28} />
          <Stop offset="100%" stopColor="#C9A020" stopOpacity={0.32} />
        </LinearGradient>
      </Defs>
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <Polygon
          key={`ring-${s}`}
          points={ringPoints(s)}
          fill="none"
          stroke="rgba(27, 68, 128, 0.14)"
          strokeWidth={s === 1 ? 1.25 : 0.75}
          strokeDasharray={s === 1 ? undefined : '4 6'}
        />
      ))}
      {angles.map((a, i) => {
        const x2 = cx + maxR * Math.cos(a);
        const y2 = cy + maxR * Math.sin(a);
        return (
          <Line
            key={`spoke-${i}`}
            x1={cx}
            y1={cy}
            x2={x2}
            y2={y2}
            stroke="rgba(27, 68, 128, 0.1)"
            strokeWidth={1}
          />
        );
      })}
      <Polygon
        points={dataPoly}
        fill="url(#radarFillPerf)"
        stroke="#1B4480"
        strokeWidth={1.75}
        strokeLinejoin="round"
      />
      {dataPoints.map((p, i) =>
        padded[i].label ? (
          <Circle
            key={`pt-${i}`}
            cx={p.x}
            cy={p.y}
            r={5}
            fill="#C9A020"
            stroke="#FFFFFF"
            strokeWidth={2}
          />
        ) : null
      )}
      {angles.map((a, i) => {
        if (!padded[i].label) return null;
        const lx = cx + labelR * Math.cos(a);
        const ly = cy + labelR * Math.sin(a) + 4;
        return (
          <SvgText
            key={`lab-${i}`}
            x={lx}
            y={ly}
            fontSize="11"
            fontWeight="700"
            fill="#475569"
            textAnchor="middle"
          >
            {padded[i].label}
          </SvgText>
        );
      })}
    </Svg>
  );
}

function InitialsAvatar({ name = '', size = 38, bg = colors.brandNavyMuted }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View style={[styles.initialsAvatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.initialsText, { fontSize: size * 0.35 }]}>{initials || '?'}</Text>
    </View>
  );
}

export default function PerformanceScreen({ navigation }) {
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
  const scores = results.map((r) => r.totalScore).filter((s) => s != null);
  const avgScore = average(scores);
  const avgGrade = scoreToGrade(avgScore);

  // Trend: compare first-half avg vs second-half avg of subjects
  let trendLabel = 'Not enough data';
  let trendColor = colors.textMuted;
  let trendIcon = 'analytics-outline';
  if (scores.length >= 2) {
    const mid = Math.floor(scores.length / 2);
    const firstHalf = average(scores.slice(0, mid));
    const secondHalf = average(scores.slice(mid));
    const diff = Math.round((secondHalf - firstHalf) * 10) / 10;
    if (diff > 0) {
      trendLabel = `Up ${Math.abs(diff).toFixed(0)} pts`;
      trendColor = colors.brandGoldDark;
      trendIcon = 'trending-up';
    } else if (diff < 0) {
      trendLabel = `Down ${Math.abs(diff).toFixed(0)} pts`;
      trendColor = colors.danger;
      trendIcon = 'trending-down';
    } else {
      trendLabel = 'Flat';
      trendColor = colors.brandNavy;
      trendIcon = 'remove-outline';
    }
  }

  const trendSubjects = results.slice(0, 8);

  const radarSubjects = results.slice(0, 5).map((r) => ({
    label: shortSubjectLabel(r.subject),
    fullName: r.subject,
    value: r.totalScore != null ? r.totalScore / 100 : 0,
    score: r.totalScore,
  }));

  const latestRemarks = data?.latestRemarks ?? null;
  const teacherName = data?.student?.class?.teacher?.name ?? 'Class Teacher';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => navigation.navigate('Overview')}
          hitSlop={12}
          style={styles.headerLeft}
        >
          <Ionicons name="chevron-back" size={22} color={colors.brandNavy} />
          <Text style={styles.headerTitle}>Performance</Text>
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
            <Ionicons name="stats-chart-outline" size={36} color={colors.brandGold} />
            <Text style={styles.emptyTitle}>No performance data</Text>
            <Text style={styles.emptyBody}>Results will appear here once the school publishes examination scores.</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryStack}>
              <View style={styles.summaryCard}>
                <View style={styles.cardGoldAccent} />
                <Text style={styles.summaryCardKicker}>Overall</Text>
                <View style={styles.gradeHeroRow}>
                  <View style={styles.gradeLetterBadge}>
                    <Text style={styles.gradeLetterBadgeText}>{avgGrade ?? '—'}</Text>
                  </View>
                  <View style={styles.gradeHeroText}>
                    <Text style={styles.gradeHeroPct}>{avgScore != null ? `${avgScore.toFixed(0)}%` : '—'}</Text>
                    <Text style={styles.gradeHeroCaption}>Mean score across your subjects</Text>
                  </View>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(100, Math.max(0, avgScore ?? 0))}%` },
                    ]}
                  />
                </View>
                <Text style={styles.summaryFoot}>
                  {results.length} subject{results.length === 1 ? '' : 's'} in this report
                </Text>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.cardGoldAccent} />
                <View style={styles.trendHeaderRow}>
                  <View style={styles.trendTitleBlock}>
                    <Text style={styles.summaryCardKicker}>Subject scores</Text>
                    <Text style={styles.trendHint}>Latest published score per subject (bar height = %).</Text>
                  </View>
                  <View
                    style={[
                      styles.trendPill,
                      { borderColor: trendColor },
                      scores.length < 2 && styles.trendPillMuted,
                    ]}
                  >
                    <Ionicons name={trendIcon} size={15} color={trendColor} />
                    <Text style={[styles.trendPillText, { color: trendColor }]}>{trendLabel}</Text>
                  </View>
                </View>
                <Text style={styles.trendCompareNote}>
                  {scores.length >= 2
                    ? 'Pill compares average of earlier subjects to average of later ones.'
                    : 'Add another subject to unlock the trend pill.'}
                </Text>
                <SubjectScoreBars subjects={trendSubjects} />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Subject Performance</Text>
            <View style={styles.radarCard}>
              <View style={styles.cardGoldAccent} />
              <Text style={styles.radarCardKicker}>Relative strength</Text>
              <Text style={styles.radarCardHint}>
                The outer ring is 100%. Your shape shows how each subject compares — further out is stronger.
              </Text>
              <View style={styles.radarSvgWrap}>
                <SubjectRadarChart items={radarSubjects} />
              </View>
              <View style={styles.radarLegend}>
                {radarSubjects.map((s, i) =>
                  s.fullName ? (
                    <View key={i} style={styles.radarLegendRow}>
                      <View style={styles.radarLegendDot} />
                      <Text style={styles.radarLegendName} numberOfLines={2}>
                        {s.fullName}
                      </Text>
                      <Text style={styles.radarLegendScore}>
                        {s.score != null ? `${Math.round(s.score)}%` : '—'}
                      </Text>
                    </View>
                  ) : null
                )}
              </View>
            </View>

            {/* Remarks */}
            {latestRemarks ? (
              <>
                <Text style={styles.sectionTitle}>Remarks</Text>
                {latestRemarks.teacherRemarks && (
                  <View style={styles.remarkCard}>
                    <View style={styles.remarkHeader}>
                      <InitialsAvatar name={teacherName} bg={colors.brandNavyMuted} />
                      <View style={styles.remarkHeaderMid}>
                        <Text style={styles.remarkName}>{teacherName}</Text>
                        <Text style={styles.remarkBody}>{latestRemarks.teacherRemarks}</Text>
                        <View style={styles.remarkTagRow}>
                          <Ionicons name="person-outline" size={14} color={colors.textMuted} />
                          <Text style={styles.remarkTag}>Class Teacher · {latestRemarks.term ?? ''}</Text>
                        </View>
                      </View>
                      <View style={styles.remarkRight}>
                        <Ionicons name="ribbon-outline" size={16} color={colors.brandGold} />
                      </View>
                    </View>
                  </View>
                )}
                {latestRemarks.headmasterRemarks && (
                  <View style={styles.remarkCardAlt}>
                    <View style={styles.remarkHeader}>
                      <InitialsAvatar name="Headmaster" bg={colors.yellowMuted} />
                      <View style={styles.remarkHeaderMid}>
                        <Text style={styles.remarkName}>Headmaster</Text>
                        <Text style={styles.remarkBody}>{latestRemarks.headmasterRemarks}</Text>
                        <View style={styles.remarkTagRow}>
                          <Ionicons name="school-outline" size={14} color={colors.textMuted} />
                          <Text style={styles.remarkTag}>Head Teacher · {latestRemarks.term ?? ''}</Text>
                        </View>
                      </View>
                      <View style={styles.remarkRight}>
                        <Ionicons name="ribbon-outline" size={16} color={colors.brandGold} />
                      </View>
                    </View>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.noRemarksCard}>
                <Ionicons name="chatbubble-outline" size={32} color={colors.brandGold} />
                <Text style={styles.noRemarksText}>No remarks recorded yet</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 18 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
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

  summaryStack: { gap: 12, marginBottom: 14 },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brandNavyMuted,
    overflow: 'hidden',
  },
  cardGoldAccent: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 3,
    backgroundColor: colors.brandGold,
  },
  summaryCardKicker: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.brandNavy,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  gradeHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  gradeLetterBadge: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: colors.brandNavy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(201, 160, 32, 0.45)',
  },
  gradeLetterBadgeText: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.brandGold,
  },
  gradeHeroText: { flex: 1, minWidth: 0 },
  gradeHeroPct: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.brandNavy,
    letterSpacing: -0.5,
  },
  gradeHeroCaption: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    lineHeight: 18,
  },
  progressTrack: {
    marginTop: 16,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brandNavyMuted,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: colors.brandNavy,
  },
  summaryFoot: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSoft,
  },

  trendHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 6,
  },
  trendTitleBlock: { flex: 1, minWidth: 0 },
  trendHint: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    lineHeight: 17,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: '44%',
  },
  trendPillMuted: {
    backgroundColor: colors.cardBlue,
  },
  trendPillText: { fontSize: 11, fontWeight: '800', flexShrink: 1 },
  trendCompareNote: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSoft,
    marginBottom: 10,
    lineHeight: 15,
  },
  trendBarsOuter: { alignItems: 'center', marginTop: 4 },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: colors.brandNavy, marginTop: 6, marginBottom: 10 },
  radarCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brandNavyMuted,
    marginBottom: 14,
    overflow: 'hidden',
  },
  radarCardKicker: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.brandNavy,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  radarCardHint: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    lineHeight: 17,
    marginBottom: 4,
  },
  radarSvgWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  radarLegend: {
    marginTop: 8,
    gap: 8,
  },
  radarLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.cardBlue,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brandNavyMuted,
  },
  radarLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brandGold,
  },
  radarLegendName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.brandNavy,
    minWidth: 0,
  },
  radarLegendScore: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.brandNavy,
    minWidth: 40,
    textAlign: 'right',
  },

  initialsAvatar: { alignItems: 'center', justifyContent: 'center' },
  initialsText: { fontWeight: '800', color: colors.brandNavy },

  remarkCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brandNavyMuted,
    marginBottom: 12,
  },
  remarkCardAlt: {
    backgroundColor: colors.yellowMuted,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(201, 160, 32, 0.28)',
    marginBottom: 14,
  },
  remarkHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  remarkHeaderMid: { flex: 1, minWidth: 0 },
  remarkRight: { alignItems: 'flex-end', gap: 6 },
  remarkName: { fontSize: 14, fontWeight: '800', color: colors.brandNavy },
  remarkBody: { marginTop: 6, fontSize: 12, lineHeight: 17, color: colors.textMuted, fontWeight: '500' },
  remarkTagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  remarkTag: { fontSize: 12, fontWeight: '700', color: colors.textMuted },

  noRemarksCard: {
    backgroundColor: colors.cardBlue,
    borderRadius: radius.md,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brandNavyMuted,
    marginBottom: 14,
  },
  noRemarksText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
});
