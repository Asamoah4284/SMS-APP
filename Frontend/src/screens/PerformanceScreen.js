import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
import { colors } from '../theme';

const STUDENT_AVATAR_URI =
  'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=200&q=80';

function arcPath(cx, cy, r, startDeg, endDeg) {
  const rad = (d) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(startDeg));
  const y1 = cy + r * Math.sin(rad(startDeg));
  const x2 = cx + r * Math.cos(rad(endDeg));
  const y2 = cy + r * Math.sin(rad(endDeg));
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

function GradeDonut({ grade = 'A', percent = 90 }) {
  const view = 120;
  const cx = 60;
  const cy = 60;
  const r = 42;
  const stroke = 14;
  const start = -90;
  const end = start + (360 * percent) / 100;
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
        <Path
          d={arcPath(cx, cy, r, start, end)}
          stroke="url(#gradeRing)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      <View style={styles.gradeDonutInner} pointerEvents="none">
        <Text style={styles.gradeLetter}>{grade}</Text>
      </View>
    </View>
  );
}

function Radar({ values = [0.9, 0.84, 0.99, 0.86, 0.92] }) {
  const size = 140;
  const cx = 70;
  const cy = 68;
  const r = 46;
  const angles = [-90, -18, 54, 126, 198]; // 5 points
  const p = (deg, rr) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + rr * Math.cos(rad), cy + rr * Math.sin(rad)];
  };
  const ring = (scale) => angles.map((a) => p(a, r * scale).join(',')).join(' ');
  const poly = angles
    .map((a, i) => p(a, r * Math.max(0.2, Math.min(1, values[i]))).join(','))
    .join(' ');
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Polygon points={ring(1)} fill="none" stroke="rgba(15, 23, 42, 0.10)" />
      <Polygon points={ring(0.75)} fill="none" stroke="rgba(15, 23, 42, 0.08)" />
      <Polygon points={ring(0.5)} fill="none" stroke="rgba(15, 23, 42, 0.06)" />
      {angles.map((a, i) => {
        const [x, y] = p(a, r);
        return <Line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(15, 23, 42, 0.06)" />;
      })}
      <Polygon points={poly} fill="rgba(59, 130, 246, 0.28)" stroke="rgba(37, 99, 235, 0.65)" />
      {angles.map((a, i) => {
        const [x, y] = p(a, r * Math.max(0.2, Math.min(1, values[i])));
        return <Circle key={`c-${i}`} cx={x} cy={y} r={3} fill="rgba(37, 99, 235, 0.9)" />;
      })}
      <SvgText x={14} y={70} fontSize="10" fill={colors.textSoft}>
        Art
      </SvgText>
      <SvgText x={60} y={18} fontSize="10" fill={colors.textSoft}>
        Math
      </SvgText>
      <SvgText x={112} y={70} fontSize="10" fill={colors.textSoft}>
        99%
      </SvgText>
      <SvgText x={30} y={116} fontSize="10" fill={colors.textSoft}>
        84%
      </SvgText>
      <SvgText x={82} y={124} fontSize="10" fill={colors.textSoft}>
        Social
      </SvgText>
    </Svg>
  );
}

export default function PerformanceScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const goProfile = () => {
    navigation.navigate('Overview', { screen: 'EditProfile' });
  };

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
      >
     
        <View style={styles.topCardsRow}>
          <View style={styles.topCard}>
            <View style={styles.topCardBgAqua} />
            <Text style={styles.topCardTitle}>Overall Grade</Text>
            <View style={styles.gradeRow}>
              <GradeDonut grade="A" percent={90} />
              <View style={styles.gradeRight}>
              </View>
            </View>
          </View>

          <View style={styles.topCard}>
            <View style={styles.topCardBgMint} />
            <Text style={styles.topCardTitle}>Performance Trend</Text>
            <Text style={styles.trendUp}>+3% Increase</Text>
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
                  <Line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="160"
                    y2={y}
                    stroke="rgba(15, 23, 42, 0.05)"
                  />
                ))}

                {Array.from({ length: 8 }).map((_, i) => {
                  const x = 14 + i * 18;
                  const h = 10 + i * 6;
                  const fill = i < 3 ? 'url(#barWarm)' : 'url(#barGreen)';
                  return (
                    <Rect
                      key={i}
                      x={x}
                      y={78 - h}
                      width="10"
                      height={h}
                      rx="2"
                      fill={fill}
                    />
                  );
                })}

                <Path
                  d="M10 66 C 35 62, 40 54, 58 48 C 78 40, 92 36, 110 28 C 130 18, 142 12, 152 10"
                  stroke="#2F9E74"
                  strokeWidth="3"
                  fill="none"
                />
                <Path
                  d="M146 10 L156 10 L156 20"
                  stroke="#2F9E74"
                  strokeWidth="3"
                  fill="none"
                />
              </Svg>
              <View style={styles.trendAxis}>
                {['1', '2', '3', '4', '5', '6', '7', '7'].map((l, i) => (
                  <Text key={i} style={styles.trendAxisLabel}>
                    {l}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Subject Performance</Text>
        <View style={styles.subjectCard}>
          <View style={styles.subjectLeft}>
            <View style={styles.subjectLeftBg}>
              <View style={styles.subjectLeftGlow1} />
              <View style={styles.subjectLeftGlow2} />
              <Radar />
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Teacher’s Remarks</Text>
        <View style={styles.remarkCard}>
          <View style={styles.remarkHeader}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?auto=format&fit=crop&w=120&q=80' }} style={styles.remarkAvatar} />
            <View style={styles.remarkHeaderMid}>
              <Text style={styles.remarkName}>Mr. Johnson</Text>
              <Text style={styles.remarkBody}>
                Isaac consistently excels in math. Keep up the great work!
              </Text>
              <View style={styles.remarkTagRow}>
                <Ionicons name="book-outline" size={14} color={colors.textMuted} />
                <Text style={styles.remarkTag}>Math</Text>
              </View>
            </View>
            <View style={styles.remarkRight}>
              <Text style={styles.remarkDate}>Mar 15, 2024</Text>
              <Ionicons name="leaf-outline" size={16} color="#2F9E74" />
            </View>
          </View>
        </View>

        <View style={styles.remarkCardAlt}>
          <View style={styles.remarkHeader}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80' }} style={styles.remarkAvatar} />
            <View style={styles.remarkHeaderMid}>
              <Text style={styles.remarkName}>Miss Anderson</Text>
              <Text style={styles.remarkBody}>
                Excellent performance in science. Shows a great curiosity for learning.
              </Text>
              <View style={styles.remarkTagRow}>
                <Ionicons name="flask-outline" size={14} color={colors.textMuted} />
                <Text style={styles.remarkTag}>Science</Text>
              </View>
            </View>
            <View style={styles.remarkRight}>
              <Text style={styles.remarkDate}>Mar 12, 2024</Text>
              <Ionicons name="leaf-outline" size={16} color="#2F9E74" />
            </View>
          </View>
        </View>
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
  headerAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#CBD5E1' },

  profileCard: {
    backgroundColor: colors.classCardBlue,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#CBD5E1' },
  profileText: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '800', color: colors.text },
  profileMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

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

  trendUp: { marginTop: 6, fontSize: 14, fontWeight: '800', color: '#2F9E74' },
  trendChartWrap: { marginTop: 6 },
  trendAxis: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, marginTop: 2 },
  trendAxisLabel: { fontSize: 10, fontWeight: '600', color: colors.textSoft, width: 16, textAlign: 'center' },

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
  // right-side list removed per request

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
  remarkAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#CBD5E1' },
  remarkHeaderMid: { flex: 1, minWidth: 0 },
  remarkRight: { alignItems: 'flex-end', gap: 6 },
  remarkName: { fontSize: 14, fontWeight: '800', color: colors.text },
  remarkDate: { fontSize: 11, fontWeight: '600', color: colors.textSoft },
  remarkBody: { marginTop: 6, fontSize: 12, lineHeight: 17, color: colors.textMuted, fontWeight: '500' },
  remarkTagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  remarkTag: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
});

