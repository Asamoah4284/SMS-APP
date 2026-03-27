import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { usePortalData } from '../hooks/usePortalData';
import { colors, radius } from '../theme';

const shadowCard = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.022,
    shadowRadius: 5,
  },
  android: { elevation: 1 },
});

/** Class panel — softer than default cards, but still visibly lifted */
const shadowClassCard = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  android: { elevation: 1 },
});

const shadowSoft = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.022,
    shadowRadius: 2,
  },
  android: { elevation: 1 },
});

export default function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { student, token, switchChild, signOut } = useAuth();
  const { data, isLoading, error, refetch } = usePortalData();
  const [menuVisible, setMenuVisible] = useState(false);
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
        <Text style={styles.errorTitle}>Failed to load data</Text>
        <Text style={styles.errorText}>{error.message}</Text>
      </View>
    );
  }

  const studentFirstName = data?.student?.firstName || student?.firstName || 'Student';
  const className = data?.student?.class?.name || student?.class?.name || 'No class';
  const classTeacherName = data?.student?.class?.teacher?.name || 'Class Teacher';
  const classTeacherPhone = data?.student?.class?.teacher?.phone || '';
  const attendanceRate = data?.attendance?.rate ?? 0;
  const latestGrades = data?.results?.slice(0, 2) || [];
  const balanceDue = data?.fees?.balance ?? 0;

  const openProfile = () => {
    setMenuVisible(false);
    navigation.navigate('EditProfile');
  };

  const onSwitchChild = () => {
    setMenuVisible(false);
    Alert.alert(
      'Switch Child',
      'You will return to child selection to choose a different child.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            try {
              await switchChild(token);
              // Auth state change will automatically trigger navigation back to Auth screen
            } catch (err) {
              console.error('Switch child error:', err);
              Alert.alert('Error', `Could not switch child: ${err?.message || 'Unknown error'}`);
            }
          },
        },
      ]
    );
  };

  const onLogout = () => {
    setMenuVisible(false);
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // Auth state change will automatically trigger navigation back to Auth screen
            } catch (err) {
              console.error('Logout error:', err);
              Alert.alert('Error', `Could not log out: ${err?.message || 'Unknown error'}`);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.menuBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuVisible(false)} />
          <View style={[styles.menuCard, { top: insets.top + 58 }]}>
            <Pressable style={styles.menuItem} onPress={openProfile}>
              <Ionicons name="person-circle-outline" size={18} color={colors.text} />
              <Text style={styles.menuItemText}>View Child Profile</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={onSwitchChild}>
              <Ionicons name="swap-horizontal-outline" size={18} color={colors.text} />
              <Text style={styles.menuItemText}>Select Another Child</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable style={styles.menuItem} onPress={onLogout}>
              <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              <Text style={[styles.menuItemText, styles.menuItemDanger]}>Log Out</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.iconBlue}
          />
        }
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + 24,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.welcome}>Hello!</Text>
            <Text style={styles.subtitle}>
              Here's an update on {studentFirstName}'s progress.
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.avatarOuter, pressed && styles.avatarOuterPressed]}
            onPress={() => setMenuVisible((prev) => !prev)}
          >
            <View style={styles.avatarInner}>
              <Text style={styles.avatarEmoji}>👦</Text>
            </View>
            <View style={styles.avatarBadge}>
              <Ionicons name="chevron-down" size={12} color={colors.iconBlue} />
            </View>
          </Pressable>
        </View>

        {/* Class card — matches reference: soft blue panel, row footer with pill CTA */}
        <View style={[styles.classCard, shadowClassCard]}>
          <View style={styles.classCardTop}>
            <View style={styles.classIconWrap}>
              <MaterialCommunityIcons
                name="school-outline"
                size={18}
                color={colors.white}
              />
            </View>
            <View style={styles.classTextCol}>
              <Text style={styles.classTitle}>{className}</Text>
              <Text style={styles.classTeacherName}>{classTeacherName}</Text>
            </View>
          </View>

          <View style={styles.teacherBlock}>
            <View style={styles.teacherAvatarRing}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=128&h=128&fit=crop&crop=faces',
                }}
                style={styles.teacherAvatarImage}
              />
            </View>
            <View style={styles.teacherTextBlock}>
              <View style={styles.nameAndCtaRow}>
                <Text
                  style={styles.teacherName}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {classTeacherName}
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.viewProfilePill,
                    pressed && styles.viewProfilePillPressed,
                  ]}
                  hitSlop={6}
                  onPress={() => navigation.navigate('Attendance')}
                >
                  <Text style={styles.viewProfilePillText}>Attendance</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={colors.iconBlue}
                  />
                </Pressable>
              </View>
              <Text
                style={styles.teacherPhone}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {classTeacherPhone || 'Class Teacher'}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick actions — 2×2 row layout: icon | title + subtitle (flat white card, no shadow) */}
        <View style={styles.quickCard}>
          <View style={styles.quickGrid}>
            <QuickAction
              iconBg={colors.quickExamBg}
              iconColor={colors.quickExamFg}
              icon="checkbox-marked-circle-outline"
              iconFamily="mci"
              title="Examination"
              subtitle="Term 1"
              onPress={() => navigation.navigate('Examination')}
            />
            <QuickAction
              iconBg={colors.quickGradesBg}
              iconColor={colors.quickGradesFg}
              icon="file-document-outline"
              iconFamily="mci"
              title="Grades"
              subtitle="Term 2"
              onPress={() => navigation.navigate('Grades')}
            />
            <QuickAction
              iconBg={colors.quickFeesBg}
              iconColor={colors.quickFeesFg}
              icon="wallet-outline"
              iconFamily="ion"
              title="Fees"
              subtitle="Estimates"
              onPress={() => navigation.navigate('Fees')}
            />
            <QuickAction
              iconBg={colors.quickTimeBg}
              iconColor={colors.quickTimeFg}
              icon="calendar-clock-outline"
              iconFamily="mci"
              title="Timetable"
              subtitle="4 weeks"
              onPress={() => navigation.navigate('Timetable')}
            />
          </View>
        </View>

        {/* Today's Highlights — 2×2: attendance + grades (split), fee tiles */}
        <Text style={styles.sectionTitle}>Today’s Highlights</Text>
        <View style={styles.highlightsGrid}>
          <HighlightAttendance
            onPress={() => navigation.navigate('Attendance')}
            attendanceRate={attendanceRate}
            studentName={studentFirstName}
          />
          <HighlightGrades grades={latestGrades} />
          <HighlightFeeBlue balanceDue={balanceDue} />
          <HighlightFeeOrange feeStatus={data?.fees?.status} termName={data?.fees?.termName} />
        </View>

      </ScrollView>
    </View>
  );
}

function QuickAction({
  iconBg,
  iconColor,
  icon,
  title,
  subtitle,
  iconFamily = 'ion',
  onPress,
}) {
  const Icon =
    iconFamily === 'mci' ? MaterialCommunityIcons : Ionicons;
  return (
    <Pressable 
      style={({ pressed }) => [styles.quickCell, pressed && styles.quickCellPressed]} 
      onPress={onPress}
    >
      <View style={styles.quickRow}>
        <View style={[styles.quickIconWrap, { backgroundColor: iconBg }]}>
          <Icon name={icon} size={18} color={iconColor} />
        </View>
        <View style={styles.quickTextCol}>
          <Text style={styles.quickTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.quickSub} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function HighlightAttendance({ onPress, attendanceRate, studentName }) {
  const displayRate = attendanceRate !== null ? attendanceRate : 0;
  return (
    <View style={styles.highlightWrap}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.highlightPressed]}
      >
        <View style={[styles.highlightInner, styles.cardHairline]}>
          <View
            style={[styles.hlTop, { backgroundColor: colors.hlAttendanceBg }]}
          >
            <View style={styles.hlTopRow}>
              <View
                style={[
                  styles.hlIconWrap,
                  { backgroundColor: 'rgba(16, 185, 129, 0.14)' },
                ]}
              >
                <MaterialCommunityIcons
                  name="calendar-check"
                  size={20}
                  color={colors.hlAttendanceIcon}
                />
              </View>
              <View style={styles.hlTopTextCol}>
                <Text style={styles.hlBigNumber}>{displayRate}%</Text>
                <Text style={styles.hlTopSub}>Attendance</Text>
              </View>
            </View>
          </View>
          <View style={styles.hlFooterWhite}>
            <Text style={styles.hlFooterSentence}>
              {studentName} has {displayRate}% attendance overall.
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

function HighlightGrades({ grades = [] }) {
  const topGrades = grades.slice(0, 2);
  const avgGrade = grades.length > 0 ? 'B+' : 'N/A';
  
  return (
    <View style={styles.highlightWrap}>
      <View style={[styles.highlightInner, styles.cardHairline]}>
        <View style={[styles.hlTop, { backgroundColor: colors.hlGradesBg }]}>
          <View style={styles.hlTopRow}>
            <View
              style={[
                styles.hlIconWrap,
                { backgroundColor: 'rgba(59, 130, 246, 0.14)' },
              ]}
            >
              <MaterialCommunityIcons
                name="file-document-outline"
                size={20}
                color={colors.hlGradesIcon}
              />
            </View>
            <View style={styles.hlTopTextCol}>
              <Text style={styles.hlBigNumber}>{avgGrade}</Text>
              <Text style={styles.hlTopSub}>Latest Grades</Text>
            </View>
          </View>
        </View>
        <View style={[styles.hlFooterWhite, styles.hlFooterGrades]}>
          {topGrades.length > 0 ? (
            topGrades.map((grade, idx) => (
              <View key={idx} style={[styles.hlGradeLine, idx > 0 && styles.hlGradeLineSecond]}>
                <Text style={styles.hlGradeSubject} numberOfLines={1}>{grade.subject}</Text>
                <View style={styles.hlGradeRight}>
                  <Text style={styles.hlGradeLetter}>{grade.grade ?? '—'}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.hlGradeSubject}>No grades yet</Text>
          )}
        </View>
      </View>
    </View>
  );
}

function HighlightFeeBlue({ balanceDue = 0 }) {
  return (
    <View style={styles.highlightWrap}>
      <View style={[styles.highlightInner, styles.cardHairline]}>
        <View
          style={[styles.hlFeeBlueInner, { backgroundColor: colors.hlFeeBlueBg }]}
        >
          <View
            style={[
              styles.hlIconWrap,
              { backgroundColor: 'rgba(37, 99, 235, 0.12)' },
            ]}
          >
            <Ionicons name="wallet-outline" size={18} color={colors.iconBlue} />
          </View>
          <View style={styles.hlFeeBlueTextCol}>
            <Text style={styles.hlFeeBlueAmount}>GH₵{balanceDue.toFixed(2)}</Text>
            <Text style={styles.hlFeeBlueDue}>Balance due</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const FEE_STATUS_LABEL = {
  FULLY_PAID: 'All paid up',
  PARTIAL: 'Partially paid',
  UNPAID: 'No payment yet',
};
const FEE_STATUS_COLOR = {
  FULLY_PAID: '#16A34A',
  PARTIAL: '#B45309',
  UNPAID: '#DC2626',
};

function HighlightFeeOrange({ feeStatus, termName }) {
  const label = feeStatus ? FEE_STATUS_LABEL[feeStatus] : 'No fee data';
  const color = feeStatus ? FEE_STATUS_COLOR[feeStatus] : colors.textSoft;
  return (
    <View style={styles.highlightWrap}>
      <View style={[styles.highlightInner, styles.cardHairline]}>
        <View
          style={[
            styles.hlFeeOrangeInner,
            { backgroundColor: colors.hlFeeOrangeBg },
          ]}
        >
          <Text style={[styles.hlFeeOrangeAmount, { color }]}>{label}</Text>
          <Text style={styles.hlFeeOrangeDue}>{termName || 'Current term'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  cardHairline: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.12)',
  },
  menuCard: {
    position: 'absolute',
    right: 16,
    width: 220,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    ...shadowCard,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  menuItemText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  menuItemDanger: {
    color: colors.danger,
  },
  menuDivider: {
    marginHorizontal: 10,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  welcome: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 21,
  },
  avatarOuter: {
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: 999,
    position: 'relative',
    ...shadowSoft,
  },
  avatarOuterPressed: {
    opacity: 0.9,
  },
  avatarInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 26,
  },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classCard: {
    backgroundColor: colors.classCardBlue,
    borderRadius: 18,
    padding: 10,
    marginBottom: 14,
    overflow: 'hidden',
  },
  classCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.iconBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classTextCol: {
    marginLeft: 10,
    flex: 1,
  },
  classTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  classTeacherName: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '400',
  },
  teacherBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 10,
  },
  teacherAvatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.white,
    overflow: 'hidden',
    backgroundColor: colors.white,
    ...shadowSoft,
  },
  teacherAvatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  teacherTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  nameAndCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  teacherName: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  teacherPhone: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    fontWeight: '400',
    marginTop: 2,
  },
  viewProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    backgroundColor: colors.white,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
  viewProfilePillPressed: {
    opacity: 0.92,
  },
  viewProfilePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.iconBlue,
  },
  quickCard: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 22,
    marginBottom: 16,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    rowGap: 14,
  },
  quickCell: {
    width: '50%',
    paddingHorizontal: 6,
  },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  quickIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTextCol: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
    justifyContent: 'center',
  },
  quickTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  quickSub: {
    marginTop: 2,
    fontSize: 11,
    color: colors.textSoft,
    fontWeight: '400',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  highlightWrap: {
    width: '50%',
    padding: 4,
  },
  highlightPressed: {
    opacity: 0.96,
  },
  /** Square top edge, rounded bottom — colored top row isn’t curved */
  highlightInner: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  hlTop: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  hlTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hlIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hlTopTextCol: {
    marginLeft: 8,
    flex: 1,
    minWidth: 0,
  },
  hlBigNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  hlTopSub: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
  },
  hlFooterWhite: {
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  hlFooterGrades: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  hlFooterSentence: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.textMuted,
    fontWeight: '400',
  },
  hlGradeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hlGradeLineSecond: {
    marginTop: 4,
  },
  hlGradeSubject: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  hlGradeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hlGradeLetter: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  hlFeeBlueInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    minHeight: 72,
  },
  hlFeeBlueTextCol: {
    marginLeft: 8,
    flex: 1,
    minWidth: 0,
  },
  hlFeeBlueAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.hlFeeBlueText,
  },
  hlFeeBlueDue: {
    marginTop: 2,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '400',
  },
  hlFeeOrangeInner: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    minHeight: 72,
    justifyContent: 'center',
  },
  hlFeeOrangeAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.hlFeeOrangeAmt,
    letterSpacing: -0.3,
  },
  hlFeeOrangeDue: {
    marginTop: 4,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '400',
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 12,
    marginTop: 8,
  },
  secondaryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
