import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Rect, Stop } from 'react-native-svg';
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

export default function ExaminationScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const goProfile = () => navigation.navigate('Overview', { screen: 'EditProfile' });
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => navigation.navigate('Overview')}
          hitSlop={12}
          style={styles.headerLeft}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
          <Text style={styles.headerTitle}>Examination</Text>
        </Pressable>
        
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 18 }}
      >
       

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.summaryCardWarm]}>
            <View style={styles.summaryTop}>
              <View style={styles.summaryIconWarm}>
                <MaterialCommunityIcons name="calendar-check" size={28} color="#92400E" />
              </View>
              <Text style={styles.summaryTitle}>Most Recent{'\n'}Exam</Text>
            </View>
            <Text style={styles.summaryMidTitle}>Midterm Exam</Text>
            <Text style={styles.summaryPctWarm}>95%</Text>
            <Text style={styles.summaryFoot}>Grade: A</Text>
          </View>

          <View style={[styles.summaryCard, styles.summaryCardCool]}>
            <View style={styles.summaryTop}>
              <View style={styles.summaryIconCool}>
                <Ionicons name="checkmark" size={24} color={colors.white} />
              </View>
              <Text style={styles.summaryTitle}>Overall{'\n'}Performance</Text>
            </View>
            <Text style={styles.summaryPctCool}>90%</Text>
            <View style={styles.gradeBadgeRow}>
              <View style={styles.gradeBadge}>
                <Text style={styles.gradeBadgeText}>A</Text>
              </View>
              <View style={styles.gradeBadge}>
                <Text style={styles.gradeBadgeText}>A</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Score Distribution</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartInner}>
            <View style={styles.chartY}>
              {['50%', '40%', '30%', '20%', '10%'].map((t) => (
                <Text key={t} style={styles.yLabel}>
                  {t}
                </Text>
              ))}
            </View>

            <View style={styles.chartMain}>
              <Svg width={300} height={140} viewBox="0 0 300 140">
                <Defs>
                  <LinearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#3B82F6" stopOpacity="0.95" />
                    <Stop offset="1" stopColor="#2563EB" stopOpacity="0.55" />
                  </LinearGradient>
                  <LinearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#22C55E" stopOpacity="0.95" />
                    <Stop offset="1" stopColor="#16A34A" stopOpacity="0.55" />
                  </LinearGradient>
                  <LinearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#F59E0B" stopOpacity="0.95" />
                    <Stop offset="1" stopColor="#D97706" stopOpacity="0.55" />
                  </LinearGradient>
                  <LinearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#EF4444" stopOpacity="0.95" />
                    <Stop offset="1" stopColor="#DC2626" stopOpacity="0.55" />
                  </LinearGradient>
                </Defs>

                {[22, 50, 78, 106].map((y) => (
                  <Line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="300"
                    y2={y}
                    stroke="rgba(15, 23, 42, 0.06)"
                  />
                ))}

                <Rect x="26" y="18" width="26" height="112" rx="4" fill="url(#gA)" />
                <Rect x="78" y="44" width="26" height="86" rx="4" fill="url(#gB)" />
                <Rect x="130" y="86" width="26" height="44" rx="4" fill="url(#gC)" />
                <Rect x="182" y="104" width="26" height="26" rx="4" fill="url(#gD)" />

                <Path
                  d="M60 72 C 92 58, 116 56, 144 46 C 168 38, 194 36, 220 36 C 246 36, 268 40, 290 40"
                  stroke="#2563EB"
                  strokeWidth="3"
                  fill="none"
                />
                <Path
                  d="M60 82 C 92 70, 116 62, 144 58 C 168 56, 194 56, 220 56 C 246 56, 268 56, 290 56"
                  stroke="#F59E0B"
                  strokeWidth="3"
                  fill="none"
                />
                <Path
                  d="M60 96 C 92 84, 116 80, 144 80 C 168 80, 194 82, 220 84 C 246 86, 268 88, 290 88"
                  stroke="#EF4444"
                  strokeWidth="3"
                  fill="none"
                />

                {[
                  { x: 220, y: 36, c: '#2563EB' },
                  { x: 290, y: 40, c: '#2563EB' },
                  { x: 220, y: 56, c: '#F59E0B' },
                  { x: 290, y: 56, c: '#F59E0B' },
                  { x: 220, y: 84, c: '#EF4444' },
                  { x: 290, y: 88, c: '#EF4444' },
                ].map((p, i) => (
                  <Circle key={i} cx={p.x} cy={p.y} r="5.5" fill={p.c} opacity="0.95" />
                ))}
              </Svg>

              <View style={styles.chartX}>
                {['A', 'B', 'B', 'C', 'Midterm', 'Quiz 3'].map((l, i) => (
                  <Text key={`${l}-${i}`} style={styles.xLabel} numberOfLines={1}>
                    {l}
                  </Text>
                ))}
              </View>

              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#2563EB' }]} />
                  <Text style={styles.legendText}>Present</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.legendText}>Late</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.legendText}>Absent</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Subject Performance</Text>
        <View style={styles.subjectTiles}>
          <SubjectTile
            title="Math"
            score={95}
            label="Excellent"
            tint="#E0F2FE"
            icon="calculator-variant"
          />
          <SubjectTile
            title="Science"
            score={88}
            label="Great"
            tint="#DCFCE7"
            icon="microscope"
          />
          <SubjectTile
            title="English"
            score={81}
            label="Good"
            tint="#FFEDD5"
            icon="book-open-variant"
          />
        </View>
      </ScrollView>
    </View>
  );
}

function SubjectTile({ title, score, label, tint, icon }) {
  return (
    <View style={styles.subjectTile}>
      <View style={styles.subjectTileTop}>
        <MaterialCommunityIcons name={icon} size={28} color="#334155" />
        <Text style={styles.subjectTileTitle}>{title}</Text>
      </View>
      <Text style={styles.subjectTileScore}>{score}%</Text>
      <View style={[styles.subjectTilePill, { backgroundColor: tint }]}>
        <Text style={styles.subjectTilePillText}>{label}</Text>
      </View>
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
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
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
  profileName: { fontSize: 15, fontWeight: '800', color: colors.text },
  profileMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  summaryCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  summaryCardWarm: { backgroundColor: '#FFF7ED' },
  summaryCardCool: { backgroundColor: '#ECFEFF' },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryIconWarm: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryIconCool: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#2F9E74',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: { fontSize: 12, fontWeight: '800', color: colors.text, lineHeight: 15 },
  summaryMidTitle: { marginTop: 14, fontSize: 12, fontWeight: '800', color: colors.text },
  summaryPctWarm: { marginTop: 6, fontSize: 28, fontWeight: '900', color: '#14532D' },
  summaryPctCool: { marginTop: 18, fontSize: 28, fontWeight: '900', color: '#14532D' },
  summaryFoot: { marginTop: 4, fontSize: 11, fontWeight: '700', color: colors.textMuted },
  gradeBadgeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.16)',
  },
  gradeBadgeText: { fontSize: 11, fontWeight: '900', color: '#166534' },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginTop: 6, marginBottom: 10 },
  chartCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
    marginBottom: 14,
  },
  chartInner: { flexDirection: 'row' },
  chartY: { width: 36, justifyContent: 'space-between', paddingTop: 6, paddingBottom: 34 },
  yLabel: { fontSize: 9, fontWeight: '600', color: colors.textSoft },
  chartMain: { flex: 1 },
  chartX: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, marginTop: 2 },
  xLabel: { fontSize: 9, fontWeight: '700', color: colors.textMuted, width: 46, textAlign: 'center' },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 10, fontWeight: '600', color: colors.textMuted },

  subjectTiles: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  subjectTile: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  subjectTileTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subjectTileTitle: { fontSize: 13, fontWeight: '800', color: colors.text },
  subjectTileScore: { marginTop: 8, fontSize: 20, fontWeight: '900', color: '#14532D' },
  subjectTilePill: { marginTop: 10, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  subjectTilePillText: { fontSize: 11, fontWeight: '800', color: '#334155' },
});

