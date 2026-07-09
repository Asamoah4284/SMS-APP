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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { usePortalData } from '../hooks/usePortalData';
import { colors, radius, TAB_BAR_HEIGHT } from '../theme';

/** Navy → gold ring segments (school brand), clockwise */
const DONUT_SEGMENT_COLORS = [
  '#E8EDF5',
  '#D4DFF0',
  '#B8CBE5',
  '#8EA8CD',
  '#5C7CAD',
  '#1B4480',
  '#C9A020',
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

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** 7 equal segments, full ring (100% week) — animates in on focus */
function WeekDonutGauge({ percent = 100 }) {
  const seg = 360 / 7;
  const gap = 0.8;

  const segmentAnims = useRef(
    Array.from({ length: 7 }, () => new Animated.Value(0))
  ).current;
  const wrapAnim = useRef(new Animated.Value(0)).current;
  const counterAnim = useRef(new Animated.Value(0)).current;
  const [displayPercent, setDisplayPercent] = useState(0);

  useFocusEffect(
    useCallback(() => {
      segmentAnims.forEach((a) => a.setValue(0));
      wrapAnim.setValue(0);
      counterAnim.setValue(0);
      setDisplayPercent(0);

      const id = counterAnim.addListener(({ value }) => {
        setDisplayPercent(Math.round(value));
      });

      Animated.parallel([
        Animated.spring(wrapAnim, {
          toValue: 1,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.stagger(
          70,
          segmentAnims.map((a) =>
            Animated.timing(a, {
              toValue: 1,
              duration: 320,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            })
          )
        ),
        Animated.timing(counterAnim, {
          toValue: percent,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();

      return () => counterAnim.removeListener(id);
    }, [counterAnim, percent, segmentAnims, wrapAnim])
  );

  const wrapScale = wrapAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.78, 1],
  });

  return (
    <Animated.View
      style={[
        styles.weekDonutWrap,
        { opacity: wrapAnim, transform: [{ scale: wrapScale }] },
      ]}
    >
      <View style={styles.weekDonutGlow} />
      <Svg
        width={DONUT_VIEW}
        height={DONUT_VIEW}
        viewBox={`0 0 ${DONUT_VIEW} ${DONUT_VIEW}`}
      >
        {Array.from({ length: 7 }).map((_, i) => {
          const start = -90 + i * seg + gap / 2;
          const end = -90 + (i + 1) * seg - gap / 2;
          return (
            <AnimatedPath
              key={i}
              d={donutSegmentPath(start, end)}
              fill={DONUT_SEGMENT_COLORS[i]}
              opacity={segmentAnims[i]}
            />
          );
        })}
      </Svg>
      <View style={styles.weekDonutCenter} pointerEvents="none">
        <Text style={styles.weekDonutPercent}>{displayPercent}%</Text>
      </View>
    </Animated.View>
  );
}

const STUDENT_AVATAR_URI =
  'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=200&q=80';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const FULL_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

function formatRecordDate(dateStr) {
  const d = new Date(dateStr);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

const STATUS_META = {
  PRESENT: {
    icon: 'checkmark-circle',
    fg: colors.brandGoldDark,
    bg: colors.yellowMuted,
    label: 'Present',
    subline: 'On time',
  },
  LATE: {
    icon: 'time',
    fg: '#B45309',
    bg: '#FEF3C7',
    label: 'Late',
    subline: 'Arrived late',
  },
  EXCUSED: {
    icon: 'shield-checkmark',
    fg: colors.brandNavy,
    bg: colors.brandNavyMuted,
    label: 'Excused',
    subline: 'Excused absence',
  },
  ABSENT: {
    icon: 'close-circle',
    fg: colors.danger,
    bg: colors.redMuted,
    label: 'Absent',
    subline: 'Did not attend',
  },
};

function RecentRecordRow({ record, index }) {
  const meta = STATUS_META[record.status] ?? STATUS_META.ABSENT;
  const enter = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      enter.setValue(0);
      Animated.sequence([
        Animated.delay(Math.min(index, 8) * 55),
        Animated.spring(enter, {
          toValue: 1,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }, [enter, index])
  );

  const translateY = enter.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });

  const d = new Date(record.date);
  const dayLabel = FULL_DAYS[d.getDay()] ?? '';
  const dateLabel = `${MONTHS[d.getMonth()]} ${d.getDate()}`;

  return (
    <Animated.View
      style={[styles.recentCard, { opacity: enter, transform: [{ translateY }] }]}
    >
      <View style={[styles.recentIconWrap, { backgroundColor: meta.bg }]}>
        <Ionicons name={meta.icon} size={20} color={meta.fg} />
      </View>
      <View style={styles.recentMid}>
        <View style={styles.recentMidTop}>
          <Text style={styles.recentDate} numberOfLines={1}>
            {dayLabel}
          </Text>
          <Text style={styles.recentDateChip} numberOfLines={1}>
            {dateLabel}
          </Text>
        </View>
        <Text style={styles.recentSubLine} numberOfLines={1}>
          {meta.subline}
        </Text>
      </View>
      <View
        style={[
          styles.recentBadge,
          { backgroundColor: `${meta.fg}1A`, borderColor: `${meta.fg}40` },
        ]}
      >
        <Text style={[styles.recentBadgeText, { color: meta.fg }]}>
          {meta.label}
        </Text>
      </View>
    </Animated.View>
  );
}

/** Single attendance bar with focus-triggered fill animation */
function AttendanceBar({ record, index, chartHeight }) {
  const isPresent = record.status === 'PRESENT' || record.status === 'LATE';
  const h =
    record.status === 'PRESENT'
      ? 0.82
      : record.status === 'LATE'
      ? 0.55
      : record.status === 'EXCUSED'
      ? 0.45
      : 0.2;
  const targetHeight = Math.max(8, chartHeight * h * 0.94);

  const anim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      anim.setValue(0);
      Animated.sequence([
        Animated.delay(Math.min(index, 12) * 55),
        Animated.spring(anim, {
          toValue: 1,
          friction: 7,
          tension: 70,
          useNativeDriver: false,
        }),
      ]).start();
    }, [anim, index])
  );

  const animatedHeight = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [6, targetHeight],
  });

  return (
    <View style={styles.barCol}>
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            {
              height: animatedHeight,
              backgroundColor: isPresent ? colors.brandGold : colors.danger,
            },
          ]}
        />
      </View>
    </View>
  );
}

export default function AttendanceScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const chartHeight = 136;
  const { student } = useAuth();
  const { data, isLoading, refetch } = usePortalData();
  const [refreshing, setRefreshing] = useState(false);
  const canGoBack = navigation?.canGoBack?.() ?? false;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const records = data?.attendance?.recentRecords ?? [];
  const rate = data?.attendance?.rate ?? 0;
  const absences = data?.attendance?.recentAbsences ?? 0;
  const presentCount = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;

  // Bar chart uses up to 9 most recent records (reversed so oldest→newest left→right)
  const barRecords = records.slice(0, 9).reverse();

  // Recent list shows up to 7
  const recentList = records.slice(0, 7);

  if (isLoading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.brandNavy} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        {canGoBack ? (
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.headerLeft}>
            <Ionicons name="chevron-back" size={22} color={colors.brandNavy} />
            <Text style={styles.headerTitle}>Attendance</Text>
          </Pressable>
        ) : (
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Attendance</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandNavy} />
        }
      >
        {/* Weekly card */}
        <View style={styles.weekCard}>
          <View style={styles.weekCardMain}>
            <View style={styles.weekLeftCol}>
              <View style={styles.weekIconTitleRow}>
                <View style={styles.weekIconCircle}>
                  <MaterialCommunityIcons name="calendar-check" size={28} color={colors.brandNavy} />
                </View>
                <View style={styles.weekTitleBlock}>
                  <Text style={styles.weekPct}>{rate}% Present</Text>
                  <Text style={styles.weekSub}>Last 30 days</Text>
                </View>
              </View>
              <Text style={styles.weekFoot}>{presentCount}/{records.length} Days Present</Text>
            </View>
            <WeekDonutGauge percent={rate} />
          </View>
        </View>

        {/* Monthly Attendance */}
        <Text style={styles.sectionTitle}>Recent Attendance</Text>
        <View style={styles.monthCard}>
          <View style={styles.monthStatsRow}>
            <View style={styles.monthStatHero}>
              <Text style={styles.monthStatValue}>{rate}%</Text>
              <Text style={styles.monthStatLabel}>Attendance rate</Text>
            </View>
            <View style={styles.monthStatChips}>
              <View style={styles.monthChipPresent}>
                <View style={styles.monthChipDot} />
                <Text style={styles.monthChipText}>{presentCount} days present</Text>
              </View>
              <View style={styles.monthChipAbsent}>
                <View style={[styles.monthChipDot, styles.monthChipDotAbsent]} />
                <Text style={styles.monthChipTextAbsent}>{absences} absent</Text>
              </View>
            </View>
          </View>

          {barRecords.length > 0 && (
            <View style={styles.chartWrap}>
              <View style={styles.chartY}>
                <Text style={styles.yLabel}>100%</Text>
                <Text style={styles.yLabel}>50%</Text>
                <Text style={styles.yLabel}>0%</Text>
              </View>
              <View style={styles.chartMain}>
                <View style={[styles.chartGrid, { height: chartHeight }]}>
                  {[0, 1, 2].map((i) => (
                    <View key={i} style={[styles.gridLine, { top: (chartHeight / 3) * i }]} />
                  ))}
                </View>
                <View style={[styles.barsRow, { height: chartHeight }]}>
                  {barRecords.map((b, i) => (
                    <AttendanceBar
                      key={`${b.date}-${i}`}
                      record={b}
                      index={i}
                      chartHeight={chartHeight}
                    />
                  ))}
                </View>
                <View style={styles.xLabels}>
                  {barRecords.map((b, i) => {
                    const d = new Date(b.date);
                    return (
                      <Text key={i} style={styles.xLab}>{DAYS[d.getDay()][0]}</Text>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          <View style={styles.monthLegendRow}>
            <View style={styles.legendChip}>
              <View style={[styles.legendSwatch, { backgroundColor: colors.brandGold }]} />
              <Text style={styles.legendChipLabel}>Present</Text>
            </View>
            <View style={styles.legendChip}>
              <View style={[styles.legendSwatch, { backgroundColor: colors.danger }]} />
              <Text style={styles.legendChipLabel}>Absent</Text>
            </View>
          </View>
        </View>

        {/* Recent list */}
        <View style={styles.recentHeader}>
          <Text style={[styles.sectionTitle, styles.recentSectionTitle]}>
            Recent Records
          </Text>
          {recentList.length > 0 ? (
            <View style={styles.recentCountPill}>
              <Text style={styles.recentCountText}>{recentList.length}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.recentList}>
          {recentList.length === 0 ? (
            <View style={styles.recentEmpty}>
              <Ionicons name="calendar-outline" size={28} color={colors.brandGold} />
              <Text style={styles.recentEmptyText}>No attendance records yet</Text>
            </View>
          ) : (
            recentList.map((r, idx) => (
              <RecentRecordRow key={`${r.date}-${idx}`} record={r} index={idx} />
            ))
          )}
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.brandNavy,
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
  weekCard: {
    backgroundColor: colors.cardBlue,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brandNavyMuted,
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
    borderRadius: 12,
    backgroundColor: colors.brandNavyMuted,
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
    color: colors.brandNavy,
    letterSpacing: -0.2,
  },
  weekSub: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textMuted,
    letterSpacing: -0.1,
    marginTop: 4,
  },
  weekFoot: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.brandGoldDark,
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
    borderRadius: 46,
    backgroundColor: 'rgba(27, 68, 128, 0.06)',
  },
  weekDonutCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDonutPercent: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.brandNavy,
    letterSpacing: -0.3,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.brandNavy,
    marginBottom: 12,
  },
  monthCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
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
    color: colors.brandNavy,
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
    backgroundColor: colors.yellowMuted,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    maxWidth: '100%',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(201, 160, 32, 0.35)',
  },
  monthChipAbsent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.redMuted,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    maxWidth: '100%',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  monthChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brandGold,
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
    backgroundColor: colors.brandNavyMuted,
    borderRadius: 6,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(27, 68, 128, 0.12)',
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
    borderRadius: 3,
  },
  legendChipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  recentSectionTitle: {
    marginTop: 4,
    marginBottom: 0,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  recentCountPill: {
    minWidth: 22,
    height: 20,
    paddingHorizontal: 7,
    borderRadius: 10,
    backgroundColor: colors.brandNavyMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.brandNavy,
  },
  recentList: {
    gap: 10,
  },
  recentEmpty: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  recentEmptyText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  recentCard: {
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
  recentIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentMid: { flex: 1, gap: 4 },
  recentMidTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recentDate: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.brandNavy,
  },
  recentDateChip: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSoft,
    backgroundColor: colors.borderLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  recentSubLine: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  recentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 64,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  recentBadgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
});
