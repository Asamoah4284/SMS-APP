import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Linking,
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
import { useCallback, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePortalData } from '../hooks/usePortalData';
import { colors, radius, TAB_BAR_HEIGHT } from '../theme';

// ────────────────────────────────────────────────────────────────────────────
// Building blocks
// ────────────────────────────────────────────────────────────────────────────

function StatTile({ icon, iconColor, value, label, accentBg, animation }) {
  return (
    <Animated.View
      style={[
        styles.statTile,
        {
          opacity: animation,
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: accentBg }]}>
        <Ionicons name={icon} size={14} color={iconColor} />
      </View>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </Animated.View>
  );
}

function SectionCard({ icon, iconLib = 'mci', title, animation, style, children }) {
  const Icon = iconLib === 'ion' ? Ionicons : MaterialCommunityIcons;
  return (
    <Animated.View
      style={[
        styles.card,
        style,
        {
          opacity: animation,
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Icon name={icon} size={16} color={colors.brandNavy} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </Animated.View>
  );
}

function DataLine({ icon, iconColor, label, value, onPress, last }) {
  const trimmed = typeof value === 'string' ? value.trim() : value;
  const tappable = !!onPress && !!trimmed;
  const RowWrap = tappable ? Pressable : View;
  return (
    <RowWrap
      onPress={tappable ? onPress : undefined}
      style={({ pressed }) => [
        styles.dataLine,
        !last && styles.dataLineDivider,
        tappable && pressed && styles.dataLinePressed,
      ]}
    >
      <View style={[styles.dataLineIcon, { backgroundColor: `${iconColor}14` }]}>
        <Ionicons name={icon} size={14} color={iconColor} />
      </View>
      <View style={styles.dataLineText}>
        <Text style={styles.dataLineLabel}>{label}</Text>
        <Text style={styles.dataLineValue} numberOfLines={2}>
          {trimmed || '—'}
        </Text>
      </View>
      {tappable ? (
        <Ionicons name="open-outline" size={14} color={colors.textSoft} />
      ) : null}
    </RowWrap>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Screen
// ────────────────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { signOut, switchChild } = useAuth();
  const { data, isLoading, refetch } = usePortalData();
  const [refreshing, setRefreshing] = useState(false);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const cardsAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      heroAnim.setValue(0);
      statsAnim.setValue(0);
      cardsAnim.setValue(0);
      Animated.stagger(120, [
        Animated.timing(heroAnim, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(statsAnim, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cardsAnim, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, [cardsAnim, heroAnim, statsAnim])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const examAverage = useMemo(() => {
    const scores = (data?.results ?? [])
      .map((r) => Number(r?.totalScore))
      .filter((n) => Number.isFinite(n));
    if (!scores.length) return null;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, [data?.results]);

  if (isLoading) {
    return (
      <View
        style={[
          styles.root,
          { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={colors.brandNavy} />
      </View>
    );
  }

  const child = data?.student;
  const fees = data?.fees;
  const attendanceRate = data?.attendance?.rate;

  const firstName = child?.firstName?.trim();
  const lastName = child?.lastName?.trim();
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Student';
  const initials =
    `${firstName?.[0] || 'S'}${lastName?.[0] || 'T'}`.toUpperCase();

  const teacherName = child?.class?.teacher?.name?.trim();
  const teacherPhone = child?.class?.teacher?.phone?.trim();

  const heroTranslate = heroAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });

  const callPhone = (raw) => {
    if (!raw) return;
    Linking.openURL(`tel:${String(raw).replace(/\s+/g, '')}`).catch(() => {});
  };

  const onSignOut = () => {
    Alert.alert(
      'Sign out',
      'You will need to look up your child again the next time you sign in.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
      ]
    );
  };

  const onSwitchChild = () => {
    Alert.alert(
      'Switch child',
      'Pick a different child without signing out.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Switch', onPress: () => switchChild() },
      ]
    );
  };

  // Stats values
  const attendanceLabel =
    attendanceRate != null ? `${Math.round(attendanceRate)}%` : '—';
  const examLabel =
    examAverage != null ? `${Math.round(examAverage)}%` : '—';
  const feeStatus = (fees?.status ?? '').toLowerCase();
  const feeLabel =
    feeStatus === 'paid'
      ? 'Paid'
      : feeStatus === 'partial'
      ? 'Partial'
      : feeStatus === 'unpaid'
      ? 'Due'
      : '—';
  const feeAccent =
    feeStatus === 'paid'
      ? { iconColor: colors.green, accentBg: colors.greenMuted }
      : feeStatus === 'partial'
      ? { iconColor: colors.brandGoldDark, accentBg: colors.yellowMuted }
      : feeStatus === 'unpaid'
      ? { iconColor: colors.red, accentBg: colors.redMuted }
      : { iconColor: colors.textSoft, accentBg: colors.borderLight };

  return (
    <View style={[styles.root, { paddingTop: 0 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 24,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.white}
            colors={[colors.brandNavy]}
            progressBackgroundColor={colors.white}
          />
        }
      >
        {/* ── Curved navy hero ──────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.hero,
            {
              paddingTop: insets.top + 18,
              opacity: heroAnim,
              transform: [{ translateY: heroTranslate }],
            },
          ]}
        >
          {/* Decorative circles */}
          <View style={[styles.heroBlob, styles.heroBlobA]} />
          <View style={[styles.heroBlob, styles.heroBlobB]} />
          <View style={[styles.heroBlob, styles.heroBlobC]} />

          <View style={styles.heroTopRow}>
            <Text style={styles.heroEyebrow}>STUDENT PROFILE</Text>
          </View>
        </Animated.View>

        {/* ── Floating identity card (overlaps hero bottom) ─────────────── */}
        <Animated.View
          style={[
            styles.identityCard,
            {
              opacity: heroAnim,
              transform: [{ translateY: heroTranslate }],
            },
          ]}
        >
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.avatarBadge}>
              <Ionicons name="checkmark" size={11} color={colors.white} />
            </View>
          </View>

          <Text style={styles.identityName} numberOfLines={1}>
            {fullName}
          </Text>
          <Text style={styles.identityClass} numberOfLines={1}>
            {child?.class?.name ?? 'No class assigned'}
            {child?.class?.level ? `  ·  ${child.class.level}` : ''}
          </Text>

          <View style={styles.identityChips}>
            <View style={styles.identityChip}>
              <Ionicons
                name="id-card-outline"
                size={11}
                color={colors.brandNavy}
              />
              <Text style={styles.identityChipText} numberOfLines={1}>
                {child?.studentId ?? '—'}
              </Text>
            </View>
            {fees?.termName ? (
              <View
                style={[
                  styles.identityChip,
                  { backgroundColor: colors.yellowMuted },
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={11}
                  color={colors.brandGoldDark}
                />
                <Text
                  style={[styles.identityChipText, { color: colors.brandGoldDark }]}
                  numberOfLines={1}
                >
                  {fees.termName}
                </Text>
              </View>
            ) : null}
          </View>
        </Animated.View>

        {/* ── Quick stats strip ─────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <StatTile
            icon="calendar-check-outline"
            iconColor={colors.green}
            accentBg={colors.greenMuted}
            value={attendanceLabel}
            label="Attendance"
            animation={statsAnim}
          />
          <StatTile
            icon="document-text-outline"
            iconColor={colors.brandNavy}
            accentBg={colors.brandNavyMuted}
            value={examLabel}
            label="Exam avg"
            animation={statsAnim}
          />
          <StatTile
            icon="wallet-outline"
            iconColor={feeAccent.iconColor}
            accentBg={feeAccent.accentBg}
            value={feeLabel}
            label="Fees"
            animation={statsAnim}
          />
        </View>

        <View style={styles.body}>
          {/* ── Teacher contact ─────────────────────────────────────────── */}
          {(teacherName || teacherPhone) ? (
            <SectionCard
              icon="account-tie-outline"
              title="Teacher contact"
              animation={cardsAnim}
            >
              <DataLine
                icon="person-circle-outline"
                iconColor={colors.brandNavy}
                label="Class teacher"
                value={teacherName}
              />
              <DataLine
                icon="call-outline"
                iconColor={colors.brandGoldDark}
                label="Phone"
                value={teacherPhone}
                onPress={() => callPhone(teacherPhone)}
                last
              />
            </SectionCard>
          ) : null}

          {/* ── Account actions ─────────────────────────────────────────── */}
          <Animated.View
            style={[
              styles.actionsRow,
              {
                opacity: cardsAnim,
                transform: [
                  {
                    translateY: cardsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Pressable
              onPress={onSwitchChild}
              style={({ pressed }) => [
                styles.actionTile,
                pressed && styles.actionTilePressed,
              ]}
            >
              <View
                style={[styles.actionTileIcon, { backgroundColor: colors.brandNavyMuted }]}
              >
                <Ionicons
                  name="swap-horizontal"
                  size={16}
                  color={colors.brandNavy}
                />
              </View>
              <Text style={styles.actionTileLabel}>Switch child</Text>
            </Pressable>

            <Pressable
              onPress={onSignOut}
              style={({ pressed }) => [
                styles.actionTile,
                pressed && styles.actionTilePressed,
              ]}
            >
              <View
                style={[styles.actionTileIcon, { backgroundColor: colors.redMuted }]}
              >
                <Ionicons name="log-out-outline" size={16} color={colors.danger} />
              </View>
              <Text style={[styles.actionTileLabel, { color: colors.danger }]}>
                Sign out
              </Text>
            </Pressable>
          </Animated.View>

          <View style={styles.syncStrip}>
            <Ionicons name="cloud-done-outline" size={12} color={colors.textSoft} />
            <Text style={styles.syncText}>
              Synced live from school records
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────────────────────────

const HERO_HEIGHT = 170;
const AVATAR_SIZE = 84;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Hero ─────────────────────────────────────────────────────────────────
  hero: {
    backgroundColor: colors.brandNavy,
    height: HERO_HEIGHT,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.6,
  },
  heroBlob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroBlobA: {
    width: 160,
    height: 160,
    top: -50,
    right: -40,
    backgroundColor: 'rgba(201,160,32,0.15)',
  },
  heroBlobB: {
    width: 110,
    height: 110,
    bottom: -30,
    left: -20,
  },
  heroBlobC: {
    width: 70,
    height: 70,
    top: 30,
    left: 40,
    backgroundColor: 'rgba(201,160,32,0.1)',
  },

  // Identity card overlapping hero ───────────────────────────────────────
  identityCard: {
    backgroundColor: colors.white,
    marginHorizontal: 18,
    marginTop: -AVATAR_SIZE / 2 - 14,
    paddingTop: AVATAR_SIZE / 2 + 8,
    paddingBottom: 16,
    paddingHorizontal: 18,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  avatarRing: {
    position: 'absolute',
    top: -AVATAR_SIZE / 2,
    width: AVATAR_SIZE + 8,
    height: AVATAR_SIZE + 8,
    borderRadius: (AVATAR_SIZE + 8) / 2,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brandNavy,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.brandNavy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.brandGold,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -0.4,
  },
  avatarBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  identityName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
    marginTop: 4,
  },
  identityClass: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  identityChips: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  identityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.brandNavyMuted,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    maxWidth: 200,
  },
  identityChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brandNavy,
  },

  // Stats strip ─────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    marginTop: 14,
    gap: 8,
  },
  statTile: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },

  // Body container ──────────────────────────────────────────────────────
  body: {
    paddingHorizontal: 18,
    marginTop: 14,
  },

  // Generic card ────────────────────────────────────────────────────────
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.brandNavy,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  // DataLine rows (used by parent) ──────────────────────────────────────
  dataLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
  },
  dataLineDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  dataLinePressed: {
    backgroundColor: colors.borderLight,
  },
  dataLineIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dataLineText: { flex: 1 },
  dataLineLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dataLineValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },

  // Action tiles ────────────────────────────────────────────────────────
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  actionTile: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  actionTilePressed: {
    backgroundColor: colors.borderLight,
  },
  actionTileIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTileLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.brandNavy,
  },

  syncStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 4,
  },
  syncText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSoft,
  },
});
