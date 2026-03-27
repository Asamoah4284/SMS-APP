import { Platform } from 'react-native';

/** Design tokens — muted, subtle surfaces (no strong color blocks) */
export const colors = {
  bg: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  textSoft: '#94A3B8',
  white: '#FFFFFF',
  border: '#E8ECF1',
  borderLight: '#F0F2F5',

  /** Class banner — barely-there blue-gray */
  cardBlue: '#F3F5F9',
  /** Class card — very light cool tint (low chroma) */
  classCardBlue: '#F3F6FA',

  iconBlue: '#2563EB',
  iconBlueMuted: '#E8EEF5',

  red: '#DC2626',
  redMuted: '#F3EDED',

  yellow: '#CA8A04',
  yellowMuted: '#F5F3EB',

  purple: '#7C3AED',
  purpleMuted: '#F2F0F7',

  green: '#16A34A',
  greenMuted: '#ECF3EE',

  /** Highlight card tops — almost flat; variation is very slight */
  highlightTop: '#FAFAFB',
  highlightTopAlt: '#F9FAFB',

  /** Today's Highlights — reference tints */
  hlAttendanceBg: '#ECFDF5',
  hlAttendanceIcon: '#10B981',
  hlGradesBg: '#EFF6FF',
  hlGradesIcon: '#3B82F6',
  hlFeeBlueBg: '#EEF2FF',
  hlFeeBlueText: '#1E293B',
  hlFeeOrangeBg: '#FFF7ED',
  hlFeeOrangeAmt: '#B45309',

  orange: '#EA580C',
  orangeMuted: '#F7F2EE',

  /** Quick actions grid — pastel chips (reference layout) */
  quickExamBg: '#DCFCE7',
  quickExamFg: '#15803D',
  quickGradesBg: '#DBEAFE',
  quickGradesFg: '#1D4ED8',
  quickFeesBg: '#FFEDD5',
  quickFeesFg: '#C2410C',
  quickTimeBg: '#EDE9FE',
  quickTimeFg: '#6D28D9',

  tabActive: '#2563EB',
  tabInactive: '#9CA3AF',

  /** Status — attendance / alerts */
  success: '#10B981',
  danger: '#EF4444',
};

/** Shared card elevation for screens */
export const shadowCard = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  android: { elevation: 2 },
});

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
};
