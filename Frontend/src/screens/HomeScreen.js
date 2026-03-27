import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
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
            <Text style={styles.welcome}>Welcome back, Kwame!</Text>
            <Text style={styles.subtitle}>
              Here’s an update on Isaac’s progress.
            </Text>
          </View>
          <View style={styles.avatarOuter}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarEmoji}>👦</Text>
            </View>
          </View>
        </View>

        {/* Class 3A card — matches reference: soft blue panel, row footer with pill CTA */}
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
              <Text style={styles.classTitle}>Class 3A</Text>
              <Text style={styles.classTeacherName}>Mr. Kwaku Mensah</Text>
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
                  Mr. Kwaku Mensah
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
                +233 54 345 6789
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
            />
            <QuickAction
              iconBg={colors.quickGradesBg}
              iconColor={colors.quickGradesFg}
              icon="file-document-outline"
              iconFamily="mci"
              title="Grades"
              subtitle="Term 2"
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
            />
          </View>
        </View>

        {/* Today's Highlights — 2×2: attendance + grades (split), fee tiles */}
        <Text style={styles.sectionTitle}>Today’s Highlights</Text>
        <View style={styles.highlightsGrid}>
          <HighlightAttendance
            onPress={() => navigation.navigate('Attendance')}
          />
          <HighlightGrades />
          <HighlightFeeBlue />
          <HighlightFeeOrange />
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
    <Pressable style={styles.quickCell} onPress={onPress} disabled={!onPress}>
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

function HighlightAttendance({ onPress }) {
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
                <Text style={styles.hlBigNumber}>Upcoming </Text>
                <Text style={styles.hlTopSub}>Present This Week</Text>
              </View>
            </View>
          </View>
          <View style={styles.hlFooterWhite}>
            <Text style={styles.hlFooterSentence}>
              Isaac has 100% attendance this week.
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

function HighlightGrades() {
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
              <Text style={styles.hlBigNumber}>B+</Text>
              <Text style={styles.hlTopSub}>Latest Grades</Text>
            </View>
          </View>
        </View>
        <View style={[styles.hlFooterWhite, styles.hlFooterGrades]}>
          <View style={styles.hlGradeLine}>
            <Text style={styles.hlGradeSubject}>English</Text>
            <View style={styles.hlGradeRight}>
              <Text style={styles.hlGradeLetter}>A</Text>
            </View>
          </View>
          <View style={[styles.hlGradeLine, styles.hlGradeLineSecond]}>
            <Text style={styles.hlGradeSubject}>Math</Text>
            <Text style={styles.hlGradeLetter}>B</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function HighlightFeeBlue() {
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
            <Text style={styles.hlFeeBlueAmount}>GH₵120</Text>
            <Text style={styles.hlFeeBlueDue}>Balance due Apr 30</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function HighlightFeeOrange() {
  return (
    <View style={styles.highlightWrap}>
      <View style={[styles.highlightInner, styles.cardHairline]}>
        <View
          style={[
            styles.hlFeeOrangeInner,
            { backgroundColor: colors.hlFeeOrangeBg },
          ]}
        >
          <Text style={styles.hlFeeOrangeAmount}>GH₵120</Text>
          <Text style={styles.hlFeeOrangeDue}>Balance due Apr 30</Text>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  cardHairline: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
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
    ...shadowSoft,
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
    marginBottom: 0,
  },
  teacherPhone: {
    fontSize: 12,
    lineHeight: 10,
    color: colors.textMuted,
    fontWeight: '400',
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
