import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors, radius } from '../theme';

/** Weekly summary card surface */
const WEEK_CARD_BG = colors.white;
const WEEK_TEXT = '#0F172A';
const WEEK_ICON_GREEN = '#14532D';
const WEEK_FOOT_GREEN = '#15803D';
const WEEK_DONUT_CENTER = '#166534';

/** Lime → forest green, clockwise around the ring */
const DONUT_SEGMENT_COLORS = [
  '#BBF7D0',
  '#86EFAC',
  '#4ADE80',
  '#34D399',
  '#22C55E',
  '#16A34A',
  '#15803D',
];

const DONUT_VIEW = 100;
const DONUT_CX = 50;
const DONUT_CY = 50;
const DONUT_OUTER = 44;
const DONUT_INNER = 28;

function donutSegmentPath(startDeg, endDeg) {
  const rad = (d) => (d * Math.PI) / 180;
  const xo1 = DONUT_CX + DONUT_OUTER * Math.cos(rad(startDeg));
  const yo1 = DONUT_CY + DONUT_OUTER * Math.sin(rad(startDeg));
  const xo2 = DONUT_CX + DONUT_OUTER * Math.cos(rad(endDeg));
  const yo2 = DONUT_CY + DONUT_OUTER * Math.sin(rad(endDeg));
  const xi1 = DONUT_CX + DONUT_INNER * Math.cos(rad(endDeg));
  const yi1 = DONUT_CY + DONUT_INNER * Math.sin(rad(endDeg));
  const xi2 = DONUT_CX + DONUT_INNER * Math.cos(rad(startDeg));
  const yi2 = DONUT_CY + DONUT_INNER * Math.sin(rad(startDeg));
  const delta = endDeg - startDeg;
  const largeArc = Math.abs(delta) > 180 ? 1 : 0;
  return `M ${xo1} ${yo1} A ${DONUT_OUTER} ${DONUT_OUTER} 0 ${largeArc} 1 ${xo2} ${yo2} L ${xi1} ${yi1} A ${DONUT_INNER} ${DONUT_INNER} 0 ${largeArc} 0 ${xi2} ${yi2} Z`;
}

/** 7 equal segments, full ring (100% week) */
function WeekDonutGauge({ percent = 100 }) {
  const seg = 360 / 7;
  const gap = 0.8;
  const paths = [];
  for (let i = 0; i < 7; i += 1) {
    const start = -90 + i * seg + gap / 2;
    const end = -90 + (i + 1) * seg - gap / 2;
    paths.push(
      <Path
        key={i}
        d={donutSegmentPath(start, end)}
        fill={DONUT_SEGMENT_COLORS[i]}
      />,
    );
  }
  return (
    <View style={styles.weekDonutWrap}>
      <View style={styles.weekDonutGlow} />
      <Svg
        width={DONUT_VIEW}
        height={DONUT_VIEW}
        viewBox={`0 0 ${DONUT_VIEW} ${DONUT_VIEW}`}
      >
        {paths}
      </Svg>
      <View style={styles.weekDonutCenter} pointerEvents="none">
        <Text style={styles.weekDonutPercent}>{percent}%</Text>
      </View>
    </View>
  );
}

const STUDENT_AVATAR_URI =
  'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=200&q=80';

const BAR_DATA = [
  { h: 0.45, present: true },
  { h: 0.62, present: true },
  { h: 0.38, present: true },
  { h: 0.55, present: true },
  { h: 0.48, present: true },
  { h: 0.5, present: true },
  { h: 0.42, present: true },
  { h: 0.35, present: true },
  { h: 0.2, present: false },
];

const X_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'F', 'S', 'S'];

/** present drives row tint + status color; status text should match */
const RECENT = [
  {
    key: '1',
    day: 'Today',
    date: 'Apr 23',
    present: true,
    status: 'Present',
    right: '8:00 AM',
    subRight: 'On Time',
  },
  {
    key: '2',
    day: 'Tuesday',
    date: 'Apr 23',
    present: true,
    status: 'Present',
    right: '8:02 AM',
    subRight: 'On Time',
  },
  {
    key: '3',
    day: 'Monday',
    date: 'Apr 22',
    present: true,
    status: 'Present',
    right: '8:01 AM',
    subRight: 'On Time',
  },
  {
    key: '4',
    day: 'Friday',
    date: 'Apr 19',
    present: false,
    status: 'Absent',
    right: '—',
    subRight: 'Unexcused',
  },
  {
    key: '5',
    day: 'Thursday',
    date: 'Apr 18',
    present: true,
    status: 'Present',
    right: '8:00 AM',
    subRight: 'On Time',
  },
];

function openProfile(navigation) {
  navigation.navigate('EditProfile');
}

export default function AttendanceScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const chartHeight = 136;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.headerLeft}>
          <Text style={styles.backChevron}>‹</Text>
          <Text style={styles.headerTitle}>Attendance</Text>
        </Pressable>
        <Pressable onPress={() => openProfile(navigation)} hitSlop={8}>
          <View style={styles.headerAvatarWrap}>
            <Image source={{ uri: STUDENT_AVATAR_URI }} style={styles.headerAvatar} />
          </View>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileRow}>
          <Pressable onPress={() => openProfile(navigation)}>
            <Image source={{ uri: STUDENT_AVATAR_URI }} style={styles.profileAvatar} />
          </Pressable>
          <View style={styles.profileText}>
            <Pressable onPress={() => openProfile(navigation)}>
              <Text style={styles.profileName}>Isaac Owusu</Text>
            </Pressable>
            <Text style={styles.profileMeta}>Class: 3A</Text>
            <Text style={styles.profileMeta}>Student ID: 10234</Text>
          </View>
        </View>

        <View style={styles.weekCard}>
          <View style={styles.weekCardMain}>
            <View style={styles.weekLeftCol}>
              <View style={styles.weekIconTitleRow}>
                <View style={styles.weekIconCircle}>
                  <MaterialCommunityIcons
                    name="calendar-check"
                    size={30}
                    color={WEEK_ICON_GREEN}
                  />
                </View>
                <View style={styles.weekTitleBlock}>
                  <Text style={styles.weekPct}>100% Present</Text>
                  <Text style={styles.weekSub}>This Week</Text>
                </View>
              </View>
              <Text style={styles.weekFoot}>7/7 Days Present</Text>
            </View>
            <WeekDonutGauge percent={100} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Monthly Attendance</Text>
        <View style={styles.monthCard}>
          <View style={styles.monthCardHeader}>
            <View style={styles.monthCardHeaderText}>
              <Text style={styles.monthEyebrow}>Calendar overview</Text>
              <Text style={styles.monthCardTitle}>April 2025</Text>
            </View>
            <View style={styles.monthNavGroup}>
              <Pressable
                style={({ pressed }) => [styles.monthNavBtn, pressed && styles.monthNavBtnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Previous month"
              >
                <Ionicons name="chevron-back" size={18} color={colors.iconBlue} />
              </Pressable>
              <View style={styles.monthNavDivider} />
              <Pressable
                style={({ pressed }) => [styles.monthNavBtn, pressed && styles.monthNavBtnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Next month"
              >
                <Ionicons name="chevron-forward" size={18} color={colors.iconBlue} />
              </Pressable>
            </View>
          </View>

          <View style={styles.monthStatsRow}>
            <View style={styles.monthStatHero}>
              <Text style={styles.monthStatValue}>96%</Text>
              <Text style={styles.monthStatLabel}>Attendance rate</Text>
            </View>
            <View style={styles.monthStatChips}>
              <View style={styles.monthChipPresent}>
                <View style={styles.monthChipDot} />
                <Text style={styles.monthChipText}>23 days present</Text>
              </View>
              <View style={styles.monthChipAbsent}>
                <View style={[styles.monthChipDot, styles.monthChipDotAbsent]} />
                <Text style={styles.monthChipTextAbsent}>1 absent</Text>
              </View>
            </View>
          </View>

          <View style={styles.chartWrap}>
            <View style={styles.chartY}>
              <Text style={styles.yLabel}>100%</Text>
              <Text style={styles.yLabel}>50%</Text>
              <Text style={styles.yLabel}>0%</Text>
            </View>
            <View style={styles.chartMain}>
              <View style={[styles.chartGrid, { height: chartHeight }]}>
                {[0, 1, 2].map((i) => (
                  <View
                    key={i}
                    style={[styles.gridLine, { top: (chartHeight / 3) * i }]}
                  />
                ))}
              </View>
              <View style={[styles.barsRow, { height: chartHeight }]}>
                {BAR_DATA.map((b, i) => (
                  <View key={i} style={styles.barCol}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: Math.max(
                              8,
                              chartHeight * b.h * 0.94,
                            ),
                            backgroundColor: b.present
                              ? colors.success
                              : colors.danger,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
              <View style={styles.xLabels}>
                {X_LABELS.map((l, i) => (
                  <Text key={i} style={styles.xLab}>
                    {l}
                  </Text>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.monthLegendRow}>
            <View style={styles.legendChip}>
              <View style={[styles.legendSwatch, { backgroundColor: colors.success }]} />
              <Text style={styles.legendChipLabel}>Present</Text>
            </View>
            <View style={styles.legendChip}>
              <View style={[styles.legendSwatch, { backgroundColor: colors.danger }]} />
              <Text style={styles.legendChipLabel}>Absent</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, styles.recentSectionTitle]}>
          Recent Attendance
        </Text>
        <View style={styles.recentList}>
          {RECENT.map((r) => (
            <View
              key={r.key}
              style={[
                styles.recentRowOuter,
                r.present ? styles.recentRowTintPresent : styles.recentRowTintAbsent,
              ]}
            >
              <View
                style={[
                  styles.recentAccentBar,
                  { backgroundColor: r.present ? colors.success : colors.danger },
                ]}
              />
              <View style={styles.recentRowInner}>
                <View style={styles.recentLeftCol}>
                  <Text style={styles.recentDateLine} numberOfLines={1}>
                    {r.day === 'Today' ? `Today · ${r.date}` : `${r.day}, ${r.date}`}
                  </Text>
                  <Text
                    style={[
                      styles.recentStatusMin,
                      r.present ? styles.recentStatusPresent : styles.recentStatusAbsent,
                    ]}
                  >
                    {r.status}
                  </Text>
                </View>
                <View style={styles.recentTimesMin}>
                  <Text
                    style={[
                      styles.recentTimeMin,
                      r.present ? styles.recentTimePresent : styles.recentTimeAbsent,
                    ]}
                  >
                    {r.right}
                  </Text>
                  <Text
                    style={[
                      styles.recentSubTimeMin,
                      r.present && r.subRight === 'On Time'
                        ? styles.recentSubOnTime
                        : null,
                      !r.present ? styles.recentSubAbsentNote : null,
                    ]}
                  >
                    {r.subRight}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backChevron: {
    fontSize: 22,
    color: colors.text,
    fontWeight: '600',
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  headerAvatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.classCardBlue,
  },
  headerAvatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    backgroundColor: '#93C5FD',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 18,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    resizeMode: 'cover',
    backgroundColor: '#93C5FD',
    borderWidth: 2,
    borderColor: colors.white,
  },
  profileText: { flex: 1 },
  profileName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  profileMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  weekCard: {
    backgroundColor: WEEK_CARD_BG,
    borderRadius: 0,
    padding: 18,
    marginBottom: 22,
  },
  weekCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  weekLeftCol: {
    flex: 1,
    minWidth: 0,
  },
  weekIconTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  weekIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 0,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekTitleBlock: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  weekPct: {
    fontSize: 18,
    fontWeight: '800',
    color: WEEK_TEXT,
    letterSpacing: -0.2,
  },
  weekSub: {
    fontSize: 13,
    fontWeight: '400',
    color: WEEK_TEXT,
    letterSpacing: -0.1,
    marginTop: 4,
    opacity: 0.85,
  },
  weekFoot: {
    fontSize: 13,
    fontWeight: '600',
    color: WEEK_FOOT_GREEN,
    marginTop: 14,
  },
  weekDonutWrap: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDonutGlow: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 0,
    backgroundColor: 'rgba(187, 247, 208, 0.45)',
  },
  weekDonutCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDonutPercent: {
    fontSize: 15,
    fontWeight: '800',
    color: WEEK_DONUT_CENTER,
    letterSpacing: -0.3,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  monthCard: {
    backgroundColor: colors.white,
    borderRadius: 0,
    padding: 16,
    marginBottom: 20,
  },
  monthCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthCardHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  monthEyebrow: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSoft,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  monthCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  monthNavGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.classCardBlue,
    overflow: 'hidden',
  },
  monthNavBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthNavBtnPressed: {
    backgroundColor: colors.borderLight,
  },
  monthNavDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
  },
  monthStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  monthStatHero: {
    minWidth: 88,
  },
  monthStatValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
    lineHeight: 36,
  },
  monthStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 2,
  },
  monthStatChips: {
    flex: 1,
    gap: 8,
    alignItems: 'flex-end',
  },
  monthChipPresent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 0,
    maxWidth: '100%',
  },
  monthChipAbsent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 0,
    maxWidth: '100%',
  },
  monthChipDot: {
    width: 8,
    height: 8,
    borderRadius: 0,
    backgroundColor: colors.success,
  },
  monthChipDotAbsent: {
    backgroundColor: colors.danger,
  },
  monthChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  monthChipTextAbsent: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  chartWrap: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  chartY: {
    width: 34,
    justifyContent: 'space-between',
    paddingTop: 2,
    paddingBottom: 20,
  },
  yLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSoft,
  },
  chartMain: {
    flex: 1,
  },
  chartGrid: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderLight,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    gap: 2,
  },
  barCol: {
    flex: 1,
    minWidth: 0,
  },
  barTrack: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15, 23, 42, 0.04)',
  },
  barFill: {
    width: '76%',
    minHeight: 6,
  },
  xLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 0,
  },
  xLab: {
    flex: 1,
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSoft,
  },
  monthLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 4,
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 0,
  },
  legendChipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  recentSectionTitle: {
    marginTop: 4,
    marginBottom: 6,
  },
  /** Tinted rows + accent — status color follows `present` */
  recentList: {
    marginTop: 0,
    gap: 8,
  },
  recentRowOuter: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  recentRowTintPresent: {
    backgroundColor: 'rgba(16, 185, 129, 0.07)',
  },
  recentRowTintAbsent: {
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  recentAccentBar: {
    width: 3,
  },
  recentRowInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 10,
    paddingRight: 10,
    paddingLeft: 10,
  },
  recentLeftCol: {
    flex: 1,
    minWidth: 0,
  },
  recentDateLine: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 17,
  },
  recentStatusMin: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  recentStatusPresent: {
    color: colors.success,
  },
  recentStatusAbsent: {
    color: colors.danger,
  },
  recentTimesMin: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  recentTimeMin: {
    fontSize: 11,
    fontWeight: '600',
  },
  recentTimePresent: {
    color: colors.textMuted,
  },
  recentTimeAbsent: {
    color: colors.danger,
  },
  recentSubTimeMin: {
    fontSize: 10,
    color: colors.textSoft,
    marginTop: 2,
  },
  recentSubOnTime: {
    color: 'rgba(16, 185, 129, 0.9)',
    fontWeight: '600',
  },
  recentSubAbsentNote: {
    color: colors.textMuted,
    fontWeight: '500',
  },
});
