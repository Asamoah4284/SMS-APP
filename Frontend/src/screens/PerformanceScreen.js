import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Line,
  Path,
  Polygon,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { usePortalData, scoreToGrade, average } from '../hooks/usePortalData';
import { colors } from '../theme';

function arcPath(cx, cy, r, startDeg, endDeg) {
  const rad = (d) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(startDeg));
  const y1 = cy + r * Math.sin(rad(startDeg));
  const x2 = cx + r * Math.cos(rad(endDeg));
  const y2 = cy + r * Math.sin(rad(endDeg));
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

function GradeDonut({ grade = '—', percent = 0 }) {
  const view = 120;
  const cx = 60;
  const cy = 60;
  const r = 42;
  const stroke = 14;
  const start = -90;
  const end = start + (360 * Math.min(100, Math.max(0, percent))) / 100;
  return (
    <View style={styles.gradeDonutWrap}>
      <Svg width={view} height={view} viewBox={`0 0 ${view} ${view}`}>
        <Defs>
          <LinearGradient id="gradeRing" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#86EFAC" />
            <Stop offset="0.55" stopColor="#34D399" />
            <Stop offset="1" stopColor="#047857" />
          </LinearGradient>
        </Defs>
        <Path
          d={arcPath(cx, cy, r, 0, 359.999)}
          stroke="rgba(15, 23, 42, 0.08)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
        />
        {percent > 0 && (
          <Path
            d={arcPath(cx, cy, r, start, end)}
            stroke="url(#gradeRing)"
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
          />
        )}
      </Svg>
      <View style={styles.gradeDonutInner} pointerEvents="none">
        <Text style={styles.gradeLetter}>{grade}</Text>
      </View>
    </View>
  );
}

// subjects: array of { label: string, value: 0–1 }
function Radar({ subjects = [] }) {
  const padded = [...subjects.slice(0, 5)];
  while (padded.length < 5) padded.push({ label: '', value: 0 });

  const size = 140;
  const cx = 70;
  const cy = 68;
  const r = 46;
  const ANGLES = [-90, -18, 54, 126, 198];
  const LABEL_POSITIONS = [
    { x: 48, y: 12 },
    { x: 112, y: 52 },
    { x: 82, y: 120 },
    { x: 2, y: 120 },
    { x: 2, y: 52 },
  ];

  const p = (deg, rr) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + rr * Math.cos(rad), cy + rr * Math.sin(rad)];
  };
  const ring = (scale) => ANGLES.map((a) => p(a, r * scale).join(',')).join(' ');
  const poly = ANGLES.map((a, i) =>
    p(a, r * Math.max(0.1, Math.min(1, padded[i].value))).join(',')
  ).join(' ');

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Polygon points={ring(1)} fill="none" stroke="rgba(15, 23, 42, 0.10)" />
      <Polygon points={ring(0.75)} fill="none" stroke="rgba(15, 23, 42, 0.08)" />
      <Polygon points={ring(0.5)} fill="none" stroke="rgba(15, 23, 42, 0.06)" />
      {ANGLES.map((a, i) => {
        const [x, y] = p(a, r);
        return <Line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(15, 23, 42, 0.06)" />;
      })}
      <Polygon points={poly} fill="rgba(59, 130, 246, 0.28)" stroke="rgba(37, 99, 235, 0.65)" />
      {ANGLES.map((a, i) => {
        const [x, y] = p(a, r * Math.max(0.1, Math.min(1, padded[i].value)));
        return <Circle key={`c-${i}`} cx={x} cy={y} r={3} fill="rgba(37, 99, 235, 0.9)" />;
      })}
      {padded.map((s, i) =>
        s.label ? (
          <SvgText key={`l-${i}`} x={LABEL_POSITIONS[i].x} y={LABEL_POSITIONS[i].y} fontSize="10" fill={colors.textSoft}>
            {s.label}
          </SvgText>
        ) : null
      )}
    </Svg>
  );
}

function InitialsAvatar({ name = '', size = 38, bg = '#CBD5E1' }) {
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
        <ActivityIndicator size="large" color={colors.iconBlue} />
      </View>
    );
  }

  const results = data?.results ?? [];
  const scores = results.map((r) => r.totalScore).filter((s) => s != null);
  const avgScore = average(scores);
  const avgGrade = scoreToGrade(avgScore);

  // Trend: compare first-half avg vs second-half avg of subjects
  let trendLabel = 'No data';
  let trendColor = colors.textMuted;
  if (scores.length >= 2) {
    const mid = Math.floor(scores.length / 2);
    const firstHalf = average(scores.slice(0, mid));
    const secondHalf = average(scores.slice(mid));
    const diff = Math.round((secondHalf - firstHalf) * 10) / 10;
    if (diff > 0) {
      trendLabel = `+${diff.toFixed(0)}% Increase`;
      trendColor = '#2F9E74';
    } else if (diff < 0) {
      trendLabel = `${diff.toFixed(0)}% Decrease`;
      trendColor = '#EF4444';
    } else {
      trendLabel = 'Stable';
      trendColor = '#F59E0B';
    }
  }

  // Trend chart bars — up to 8 subjects
  const trendSubjects = results.slice(0, 8);
  const trendBarCount = trendSubjects.length;
  const trendBarW = 10;
  const trendSpacing = trendBarCount > 0 ? Math.min(18, Math.floor(146 / trendBarCount)) : 18;
  const chartH = 78;

  // Radar subjects — up to 5
  const radarSubjects = results.slice(0, 5).map((r) => ({
    label: r.subject.split(' ')[0],
    value: r.totalScore != null ? r.totalScore / 100 : 0,
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
          <Ionicons name="chevron-back" size={22} color={colors.text} />
          <Text style={styles.headerTitle}>Performance</Text>
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
            <Ionicons name="bar-chart-outline" size={40} color={colors.textSoft} />
            <Text style={styles.emptyTitle}>No performance data</Text>
            <Text style={styles.emptyBody}>Results will appear here once the school publishes examination scores.</Text>
          </View>
        ) : (
          <>
            <View style={styles.topCardsRow}>
              {/* Overall Grade */}
              <View style={styles.topCard}>
                <View style={styles.topCardBgAqua} />
                <Text style={styles.topCardTitle}>Overall Grade</Text>
                <View style={styles.gradeRow}>
                  <GradeDonut grade={avgGrade} percent={avgScore ?? 0} />
                  <View style={styles.gradeRight}>
                    <Text style={styles.gradePct}>
                      {avgScore != null ? `${avgScore.toFixed(0)}%` : '—'}
                    </Text>
                    <Text style={styles.gradeSub}>Average{'\n'}across all{'\n'}subjects</Text>
                  </View>
                </View>
              </View>

              {/* Performance Trend */}
              <View style={styles.topCard}>
                <View style={styles.topCardBgMint} />
                <Text style={styles.topCardTitle}>Performance Trend</Text>
                <Text style={[styles.trendUp, { color: trendColor }]}>{trendLabel}</Text>
                <View style={styles.trendChartWrap}>
                  <Svg width={160} height={86} viewBox="0 0 160 86">
                    <Defs>
                      <LinearGradient id="barWarm" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#F59E0B" stopOpacity="0.85" />
                        <Stop offset="1" stopColor="#F59E0B" stopOpacity="0.35" />
                      </LinearGradient>
                      <LinearGradient id="barGreen" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#22C55E" stopOpacity="0.92" />
                        <Stop offset="1" stopColor="#22C55E" stopOpacity="0.35" />
                      </LinearGradient>
                    </Defs>
                    {[24, 48, 72].map((y) => (
                      <Line key={y} x1="0" y1={y} x2="160" y2={y} stroke="rgba(15, 23, 42, 0.05)" />
                    ))}
                    {trendSubjects.map((r, i) => {
                      const h = r.totalScore != null ? Math.max(4, (r.totalScore / 100) * chartH) : 4;
                      const x = 14 + i * trendSpacing;
                      const mid = Math.floor(trendBarCount / 2);
                      const fill = i < mid ? 'url(#barWarm)' : 'url(#barGreen)';
                      return (
                        <Rect key={i} x={x} y={chartH - h} width={trendBarW} height={h} rx="2" fill={fill} />
                      );
                    })}
                    {trendSubjects.length > 1 && (() => {
                      const pts = trendSubjects.map((r, i) => {
                        const h = r.totalScore != null ? Math.max(4, (r.totalScore / 100) * chartH) : 4;
                        return [14 + i * trendSpacing + trendBarW / 2, chartH - h];
                      });
                      const d = pts.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');
                      return <Path d={d} stroke="#2F9E74" strokeWidth="2.5" fill="none" />;
                    })()}
                  </Svg>
                  <View style={styles.trendAxis}>
                    {trendSubjects.map((r, i) => (
                      <Text key={i} style={styles.trendAxisLabel} numberOfLines={1}>
                        {r.subject.slice(0, 3)}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* Radar Chart */}
            <Text style={styles.sectionTitle}>Subject Performance</Text>
            <View style={styles.subjectCard}>
              <View style={styles.subjectLeft}>
                <View style={styles.subjectLeftBg}>
                  <View style={styles.subjectLeftGlow1} />
                  <View style={styles.subjectLeftGlow2} />
                  <Radar subjects={radarSubjects} />
                </View>
              </View>
            </View>

            {/* Remarks */}
            {latestRemarks ? (
              <>
                <Text style={styles.sectionTitle}>Remarks</Text>
                {latestRemarks.teacherRemarks && (
                  <View style={styles.remarkCard}>
                    <View style={styles.remarkHeader}>
                      <InitialsAvatar name={teacherName} bg="#DBEAFE" />
                      <View style={styles.remarkHeaderMid}>
                        <Text style={styles.remarkName}>{teacherName}</Text>
                        <Text style={styles.remarkBody}>{latestRemarks.teacherRemarks}</Text>
                        <View style={styles.remarkTagRow}>
                          <Ionicons name="person-outline" size={14} color={colors.textMuted} />
                          <Text style={styles.remarkTag}>Class Teacher · {latestRemarks.term ?? ''}</Text>
                        </View>
                      </View>
                      <View style={styles.remarkRight}>
                        <Ionicons name="leaf-outline" size={16} color="#2F9E74" />
                      </View>
                    </View>
                  </View>
                )}
                {latestRemarks.headmasterRemarks && (
                  <View style={styles.remarkCardAlt}>
                    <View style={styles.remarkHeader}>
                      <InitialsAvatar name="Headmaster" bg="#DCFCE7" />
                      <View style={styles.remarkHeaderMid}>
                        <Text style={styles.remarkName}>Headmaster</Text>
                        <Text style={styles.remarkBody}>{latestRemarks.headmasterRemarks}</Text>
                        <View style={styles.remarkTagRow}>
                          <Ionicons name="school-outline" size={14} color={colors.textMuted} />
                          <Text style={styles.remarkTag}>Head Teacher · {latestRemarks.term ?? ''}</Text>
                        </View>
                      </View>
                      <View style={styles.remarkRight}>
                        <Ionicons name="leaf-outline" size={16} color="#2F9E74" />
                      </View>
                    </View>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.noRemarksCard}>
                <Ionicons name="chatbubble-outline" size={32} color={colors.textSoft} />
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
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text },

  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
    marginTop: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptyBody: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },

  topCardsRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  topCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  topCardBgAqua: {
    position: 'absolute',
    left: -30,
    bottom: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(59, 130, 246, 0.10)',
  },
  topCardBgMint: {
    position: 'absolute',
    right: -40,
    top: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
  },
  topCardTitle: { fontSize: 13, fontWeight: '800', color: colors.text },
  gradeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  gradeDonutWrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  gradeDonutInner: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 2,
    borderColor: 'rgba(15, 23, 42, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeLetter: { fontSize: 30, fontWeight: '900', color: '#2F9E74' },
  gradeRight: { flex: 1, alignItems: 'flex-start' },
  gradePct: { fontSize: 22, fontWeight: '900', color: '#14532D' },
  gradeSub: { fontSize: 11, fontWeight: '600', color: colors.textMuted, marginTop: 4, lineHeight: 14 },

  trendUp: { marginTop: 6, fontSize: 13, fontWeight: '800' },
  trendChartWrap: { marginTop: 6 },
  trendAxis: { flexDirection: 'row', justifyContent: 'flex-start', gap: 8, paddingHorizontal: 10, marginTop: 2 },
  trendAxisLabel: { fontSize: 9, fontWeight: '600', color: colors.textSoft, width: 16 },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 6, marginBottom: 10 },
  subjectCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
    marginBottom: 14,
  },
  subjectLeft: {
    width: '100%',
    backgroundColor: colors.classCardBlue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  subjectLeftBg: {
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  subjectLeftGlow1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(59, 130, 246, 0.10)',
    top: -120,
    left: -90,
  },
  subjectLeftGlow2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    bottom: -120,
    right: -90,
  },

  initialsAvatar: { alignItems: 'center', justifyContent: 'center' },
  initialsText: { fontWeight: '800', color: '#334155' },

  remarkCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
    marginBottom: 12,
  },
  remarkCardAlt: {
    backgroundColor: colors.classCardBlue,
    borderRadius: 18,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
    marginBottom: 14,
  },
  remarkHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  remarkHeaderMid: { flex: 1, minWidth: 0 },
  remarkRight: { alignItems: 'flex-end', gap: 6 },
  remarkName: { fontSize: 14, fontWeight: '800', color: colors.text },
  remarkBody: { marginTop: 6, fontSize: 12, lineHeight: 17, color: colors.textMuted, fontWeight: '500' },
  remarkTagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  remarkTag: { fontSize: 12, fontWeight: '700', color: colors.textMuted },

  noRemarksCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
    marginBottom: 14,
  },
  noRemarksText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
});
