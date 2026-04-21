import { Platform } from 'react-native';

/** Design tokens — school logo brand palette
 *  Primary:  Navy  #1B4480  (logo shield blue)
 *  Accent:   Gold  #C9A020  (logo outer ring gold)
 */
export const colors = {
  bg: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  textSoft: '#94A3B8',
  white: '#FFFFFF',
  border: '#E8ECF1',
  borderLight: '#F0F2F5',

  /** Class banner / card surfaces — subtle navy tint */
  cardBlue: '#F0F4FA',
  classCardBlue: '#EEF3FA',

  /** Logo navy — primary interactive & icon colour */
  iconBlue: '#1B4480',
  iconBlueMuted: '#E3ECF7',

  red: '#DC2626',
  redMuted: '#F3EDED',

  /** Logo gold ring — accent & highlight colour */
  yellow: '#C9A020',
  yellowMuted: '#F5F0E0',

  purple: '#7C3AED',
  purpleMuted: '#F2F0F7',

  green: '#16A34A',
  greenMuted: '#ECF3EE',

  /** Highlight card top tints */
  highlightTop: '#FAFAFB',
  highlightTopAlt: '#F9FAFB',

  /** Today's Highlights */
  hlAttendanceBg:  '#ECFDF5',
  hlAttendanceIcon:'#10B981',
  hlGradesBg:      '#EEF3FA',   // logo navy-tinted
  hlGradesIcon:    '#1B4480',   // logo navy
  hlFeeBlueBg:     '#EEF3FA',   // logo navy-tinted
  hlFeeBlueText:   '#1E293B',
  hlFeeOrangeBg:   '#FFF7ED',
  hlFeeOrangeAmt:  '#B45309',

  orange: '#EA580C',
  orangeMuted: '#F7F2EE',

  /** Quick-actions grid chips */
  quickExamBg:   '#DCFCE7',
  quickExamFg:   '#15803D',
  quickGradesBg: '#E3ECF7',   // logo navy muted
  quickGradesFg: '#1B4480',   // logo navy
  quickFeesBg:   '#FFEDD5',
  quickFeesFg:   '#C2410C',
  quickTimeBg:   '#F5F0E0',   // logo gold muted
  quickTimeFg:   '#7A5E0A',   // dark gold

  tabActive:   '#1B4480',     // logo shield navy
  tabInactive: '#9CA3AF',

  /** Status */
  success: '#10B981',
  danger:  '#EF4444',

  /** Direct logo brand tokens for explicit use */
  brandGold:      '#C9A020',
  brandGoldDark:  '#A07C10',
  brandNavy:      '#1B4480',
  brandNavyLight: '#2A5BA8',  // slightly lighter navy for gradients
  brandNavyMuted: '#E3ECF7',
};

/** Shared card elevation */
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

/**
 * Total visual height of the custom curved tab bar (SVG region).
 * Add to paddingBottom in scroll views inside tab screens.
 */
export const TAB_BAR_HEIGHT = 84;
