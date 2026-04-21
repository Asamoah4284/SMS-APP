import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme';

// ─── Layout constants ─────────────────────────────────────────────────────────
const CIRCLE_D    = 58;             // center button diameter
const CIRCLE_R    = CIRCLE_D / 2;  // 29
const BAR_H       = 62;            // visual bar height
const BAR_Y       = 22;            // how far circle protrudes above bar edge
const NOTCH_R     = 36;            // CIRCLE_R + 7 gap — fills notch perfectly
const CURVE_W     = 26;            // bezier shoulder width
const SVG_H       = BAR_Y + BAR_H; // 84 — total SVG height

// ─── Colour tokens — derived from school logo palette ───────────────────────
// Gold ring on logo seal  → center button
// Shield navy blue        → active tab indicator
const GOLD        = '#C9A020';  // logo outer gold ring
const GOLD_DARK   = '#A07C10';  // pressed / active state
const ACTIVE_COL  = '#1B4480';  // logo shield navy blue
const INACTIVE    = '#A0ADB8';
const WHITE       = '#FFFFFF';

// ─── Per-tab display config ───────────────────────────────────────────────────
const TAB_MAP = {
  Overview:    { icon: 'home-outline',             activeIcon: 'home',              family: 'ion', label: 'Home' },
  Fees:        { icon: 'wallet-outline',            activeIcon: 'wallet',            family: 'ion', label: 'Fees', isCenter: true },
  Attendance:  { icon: 'calendar-check-outline',   activeIcon: 'calendar-check',    family: 'mci', label: 'Attend' },
  Examination: { icon: 'document-text-outline',    activeIcon: 'document-text',     family: 'ion', label: 'Exams' },
  Performance: { icon: 'bar-chart-outline',        activeIcon: 'bar-chart',         family: 'ion', label: 'Results' },
};

// ─── SVG path: white bar with smooth curved notch at center ──────────────────
// Coordinate origin (0,0) = top-left of the SVG.
// The bar's flat top edge is at y = BAR_Y (= 22).
// The notch descends from BAR_Y down to BAR_Y + NOTCH_R (= 58 = CIRCLE_D).
function buildPath(W) {
  const cx          = W / 2;
  const notchBottom = BAR_Y + NOTCH_R;          // 22 + 36 = 58
  const leftEnd     = cx - NOTCH_R - CURVE_W;   // approach point left  of notch
  const rightStart  = cx + NOTCH_R + CURVE_W;   // departure point right of notch

  return [
    `M 0 ${BAR_Y}`,
    `L ${leftEnd} ${BAR_Y}`,
    // smooth cubic bezier descending left wall of notch
    `C ${cx - NOTCH_R} ${BAR_Y} ${cx - NOTCH_R} ${notchBottom} ${cx} ${notchBottom}`,
    // mirror cubic bezier ascending right wall
    `C ${cx + NOTCH_R} ${notchBottom} ${cx + NOTCH_R} ${BAR_Y} ${rightStart} ${BAR_Y}`,
    `L ${W} ${BAR_Y}`,
    `L ${W} ${SVG_H}`,
    `L 0 ${SVG_H}`,
    `Z`,
  ].join(' ');
}

/** Open path along the top edge of the tab bar — follows the flat segments and center notch. */
function buildTopEdgePath(W) {
  const cx = W / 2;
  const notchBottom = BAR_Y + NOTCH_R;
  const leftEnd = cx - NOTCH_R - CURVE_W;
  const rightStart = cx + NOTCH_R + CURVE_W;
  return [
    `M 0 ${BAR_Y}`,
    `L ${leftEnd} ${BAR_Y}`,
    `C ${cx - NOTCH_R} ${BAR_Y} ${cx - NOTCH_R} ${notchBottom} ${cx} ${notchBottom}`,
    `C ${cx + NOTCH_R} ${notchBottom} ${cx + NOTCH_R} ${BAR_Y} ${rightStart} ${BAR_Y}`,
    `L ${W} ${BAR_Y}`,
  ].join(' ');
}

// Hairline stroke width — crisp on all densities
const SEPARATOR_STROKE = Platform.select({
  ios: StyleSheet.hairlineWidth,
  android: 1,
  default: 1,
});

// ─── Component ───────────────────────────────────────────────────────────────
export default function CustomTabBar({ state, descriptors, navigation }) {
  const { width: W }  = useWindowDimensions();
  const insets        = useSafeAreaInsets();
  const { routes, index: activeIndex } = state;

  // ── Renders a regular (non-center) tab button ──
  const renderTab = (route, idx) => {
    const config   = TAB_MAP[route.name] ?? { icon: 'ellipse-outline', activeIcon: 'ellipse', family: 'ion', label: route.name };
    const isActive = activeIndex === idx;
    const Icon     = config.family === 'mci' ? MaterialCommunityIcons : Ionicons;

    const onPress = () => {
      const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isActive && !e.defaultPrevented) {
        navigation.navigate({ name: route.name, merge: true });
      }
    };
    const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });

    return (
      <TouchableOpacity
        key={route.key}
        style={styles.tab}
        activeOpacity={0.7}
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityRole="button"
        accessibilityState={isActive ? { selected: true } : {}}
        accessibilityLabel={descriptors[route.key]?.options?.tabBarAccessibilityLabel ?? config.label}
      >
        <Icon
          name={isActive ? config.activeIcon : config.icon}
          size={22}
          color={isActive ? ACTIVE_COL : INACTIVE}
        />
        <Text style={[styles.tabLabel, { color: isActive ? ACTIVE_COL : INACTIVE }]}>
          {config.label}
        </Text>
      </TouchableOpacity>
    );
  };

  // Center tab = index 2 (Fees)
  const centerRoute   = routes[2];
  const isCenterActive = activeIndex === 2;

  const onCenterPress = () => {
    const e = navigation.emit({ type: 'tabPress', target: centerRoute.key, canPreventDefault: true });
    if (!isCenterActive && !e.defaultPrevented) {
      navigation.navigate({ name: centerRoute.name, merge: true });
    }
  };

  // Container height: SVG visual area + device safe area (home indicator bar)
  const containerH = SVG_H + insets.bottom;

  return (
    <View style={[styles.outer, { height: containerH }]}>

      {/* ── SVG: shadow layer + white notched bar ── */}
      <Svg width={W} height={SVG_H} style={StyleSheet.absoluteFill}>
        {/* subtle drop-shadow: offset darker path 1px below */}
        <Path d={buildPath(W)} fill="rgba(15,23,42,0.045)" translateY={1.5} />
        {/* main white fill */}
        <Path d={buildPath(W)} fill={WHITE} />
        {/* Separator between screen content and tab bar — follows notch curve */}
        <Path
          d={buildTopEdgePath(W)}
          fill="none"
          stroke={colors.border}
          strokeWidth={SEPARATOR_STROKE}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>

      {/* ── Tab row (inside the bar area, y = BAR_Y onward) ── */}
      <View style={[styles.tabRow, { top: BAR_Y, height: BAR_H }]}>
        {/* Left 2 tabs */}
        <View style={styles.side}>
          {routes.slice(0, 2).map((r, i) => renderTab(r, i))}
        </View>

        {/* Center spacer — matches the button's footprint width */}
        <View style={{ width: CIRCLE_D + 20 }} />

        {/* Right 2 tabs */}
        <View style={styles.side}>
          {routes.slice(3, 5).map((r, i) => renderTab(r, i + 3))}
        </View>
      </View>

      {/* ── Floating center button ── */}
      <TouchableOpacity
        style={[
          styles.centerBtn,
          {
            top:             0,
            left:            W / 2 - CIRCLE_R,
            backgroundColor: isCenterActive ? GOLD_DARK : GOLD,
          },
        ]}
        activeOpacity={0.85}
        onPress={onCenterPress}
        accessibilityRole="button"
        accessibilityLabel="Fees"
      >
        <Ionicons name="wallet" size={24} color={WHITE} />
      </TouchableOpacity>

      {/* ── Center label (sits just below the circle, inside the bar) ── */}
      <Text
        style={[
          styles.centerLabel,
          {
            top:   CIRCLE_D + 4,   // 62 → just under the circle bottom (y=58)
            color: isCenterActive ? GOLD_DARK : INACTIVE,
          },
        ]}
      >
        Fees
      </Text>

      {/* ── Safe-area white fill at the very bottom ── */}
      {insets.bottom > 0 && (
        <View style={[styles.safeAreaFill, { height: insets.bottom }]} />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  outer: {
    // Normal-flow (not absolute) so React Navigation handles screen height.
    // zIndex allows center button to visually overlap screen content edge.
    zIndex: 100,
    overflow: 'visible',
    backgroundColor: 'transparent',
    ...Platform.select({
      android: { elevation: 10 },
      ios:     {},
    }),
  },

  tabRow: {
    position:       'absolute',
    left:           0,
    right:          0,
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 4,
  },

  side: {
    flex:           1,
    flexDirection:  'row',
    justifyContent: 'space-evenly',
    alignItems:     'center',
  },

  tab: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingTop:     8,
    paddingBottom:  4,
  },

  tabLabel: {
    fontSize:      10,
    fontWeight:    '600',
    marginTop:     3,
    letterSpacing: 0.3,
  },

  centerBtn: {
    position:       'absolute',
    width:          CIRCLE_D,
    height:         CIRCLE_D,
    borderRadius:   CIRCLE_R,
    alignItems:     'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor:   GOLD,
        shadowOffset:  { width: 0, height: 5 },
        shadowOpacity: 0.50,
        shadowRadius:  12,
      },
      android: { elevation: 8 },
    }),
  },

  centerLabel: {
    position:      'absolute',
    left:          0,
    right:         0,
    textAlign:     'center',
    fontSize:      10,
    fontWeight:    '600',
    letterSpacing: 0.3,
  },

  safeAreaFill: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    backgroundColor: '#FFFFFF',
  },
});
