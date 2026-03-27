import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';

const STUDENT_AVATAR_URI =
  'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=200&q=80';

const BALANCE = 250;
const UNPAID = 250;
const PAID = 700;
const DUE_PERCENT = 71;

const DONUT_VIEW = 106;
const DONUT_CX = 53;
const DONUT_CY = 53;
const DONUT_R = 42;
const DONUT_STROKE = 14;

function arcPath(cx, cy, r, startDeg, endDeg) {
  const rad = (d) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(startDeg));
  const y1 = cy + r * Math.sin(rad(startDeg));
  const x2 = cx + r * Math.cos(rad(endDeg));
  const y2 = cy + r * Math.sin(rad(endDeg));
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

function FeesDonut({ percent }) {
  const start = -90;
  const end = start + (360 * percent) / 100;
  return (
    <View style={styles.donutWrap}>
      <Svg width={DONUT_VIEW} height={DONUT_VIEW} viewBox={`0 0 ${DONUT_VIEW} ${DONUT_VIEW}`}>
        <Path
          d={arcPath(DONUT_CX, DONUT_CY, DONUT_R, 0, 359.999)}
          stroke="rgba(15, 23, 42, 0.08)"
          strokeWidth={DONUT_STROKE}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={arcPath(DONUT_CX, DONUT_CY, DONUT_R, start, end)}
          stroke="#EF4444"
          strokeWidth={DONUT_STROKE}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={arcPath(DONUT_CX, DONUT_CY, DONUT_R, end + 6, end + 44)}
          stroke="#F59E0B"
          strokeWidth={DONUT_STROKE}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={arcPath(DONUT_CX, DONUT_CY, DONUT_R, end + 50, end + 74)}
          stroke="#22C55E"
          strokeWidth={DONUT_STROKE}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      <View style={styles.donutCenter} pointerEvents="none">
        <Text style={styles.donutPct}>{percent}%</Text>
        <Text style={styles.donutDue}>Due</Text>
      </View>
    </View>
  );
}

const TILES = [
  { key: 'tuition', title: 'Tuition Fees', paid: 500, due: 200, tint: '#FEF3C7' },
  { key: 'books', title: 'Books & Supplies', paid: 200, due: 50, tint: '#DBEAFE' },
];

const TX = [
  { key: '1', date: 'April 15, 2024', title: 'Tuition Fees', amount: 200, icon: 'home-outline' },
  { key: '2', date: 'April 02, 2024', title: 'Books & Supplies', amount: 200, icon: 'book-outline' },
  { key: '3', date: 'March 20, 2024', title: 'School Trip', amount: 50, icon: 'bus-outline' },
  { key: '4', date: 'March 05, 2024', title: 'PTA Fees', amount: 150, icon: 'people-outline' },
];

export default function FeesScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.headerLeft}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
          <Text style={styles.headerTitle}>Fees</Text>
        </Pressable>
     
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 18 }}
      >
       

        <View style={styles.balanceCard}>
          <View style={styles.balanceTopRow}>
            <View style={styles.balanceLeft}>
              <Text style={styles.balanceLabel}>Total Outstanding Balance</Text>
              <Text style={styles.balanceValue}>${BALANCE}</Text>

              <View style={styles.balanceLines}>
                <View style={styles.balanceLine}>
                  <View style={[styles.swatch, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.balanceLineLabel}>Unpaid</Text>
                  <Text style={styles.balanceLineAmt}>${UNPAID}</Text>
                  <Text style={styles.balanceLineRight}>${200}</Text>
                </View>
                <View style={styles.balanceLine}>
                  <View style={[styles.swatch, { backgroundColor: '#22C55E' }]} />
                  <Text style={styles.balanceLineLabel}>Paid</Text>
                  <Text style={[styles.balanceLineAmt, { color: '#16A34A' }]}>${PAID}</Text>
                  <Text style={styles.balanceLineUp}>↑39%</Text>
                </View>
              </View>

              <Text style={styles.balanceDue}>Due Apr 30, 2024</Text>
            </View>

            <FeesDonut percent={DUE_PERCENT} />
          </View>
        </View>

        <View style={styles.tileRow}>
          {TILES.map((t) => (
            <View key={t.key} style={[styles.tileCard, { backgroundColor: t.tint }]}>
              <Text style={styles.tileTitle}>{t.title}</Text>
              <View style={styles.tileAmounts}>
                <Text style={styles.tilePaid}>${t.paid} </Text>
                <Text style={styles.tilePaidLabel}>Paid</Text>
                <Text style={styles.tileDue}> ${t.due}</Text>
              </View>
              <Text style={styles.tileDueDate}>Due Apr 30, 2024</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <View style={styles.txCard}>
          {TX.map((x, idx) => (
            <View key={x.key} style={[styles.txRow, idx > 0 && styles.txRowRule]}>
              <View style={styles.txIconBox}>
                <Ionicons name={x.icon} size={18} color={colors.iconBlue} />
              </View>
              <View style={styles.txMid}>
                <Text style={styles.txDate}>{x.date}</Text>
                <Text style={styles.txTitle}>{x.title}</Text>
              </View>
              <View style={styles.txRight}>
                <Text style={styles.txAmount}>${x.amount}</Text>
                <View style={styles.paidPill}>
                  <Text style={styles.paidPillText}>Paid</Text>
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

  balanceCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  balanceTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  balanceLeft: { flex: 1, minWidth: 0 },
  balanceLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  balanceValue: { fontSize: 28, fontWeight: '800', color: '#14532D', marginTop: 4 },
  balanceLines: { marginTop: 10, gap: 8 },
  balanceLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  balanceLineLabel: { fontSize: 12, color: colors.textMuted, width: 54 },
  balanceLineAmt: { fontSize: 13, fontWeight: '700', color: colors.text, width: 56 },
  balanceLineRight: { fontSize: 13, fontWeight: '700', color: colors.text },
  balanceLineUp: { fontSize: 12, fontWeight: '700', color: '#16A34A' },
  balanceDue: { fontSize: 12, color: colors.textMuted, marginTop: 10 },

  donutWrap: { width: DONUT_VIEW, height: DONUT_VIEW, alignItems: 'center', justifyContent: 'center' },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutPct: { fontSize: 18, fontWeight: '800', color: colors.text },
  donutDue: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginTop: 2 },

  tileRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  tileCard: { flex: 1, borderRadius: 18, padding: 14 },
  tileTitle: { fontSize: 13, fontWeight: '800', color: colors.text },
  tileAmounts: { flexDirection: 'row', alignItems: 'baseline', marginTop: 10 },
  tilePaid: { fontSize: 18, fontWeight: '800', color: colors.text },
  tilePaidLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  tileDue: { fontSize: 16, fontWeight: '800', color: colors.orange },
  tileDueDate: { marginTop: 8, fontSize: 12, color: colors.textMuted },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 6, marginBottom: 10 },
  txCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  txRowRule: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  txIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(37, 99, 235, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txMid: { flex: 1, minWidth: 0 },
  txDate: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  txTitle: { fontSize: 14, color: colors.text, fontWeight: '700', marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 14, fontWeight: '800', color: colors.text },
  paidPill: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(34, 197, 94, 0.16)',
  },
  paidPillText: { fontSize: 11, fontWeight: '700', color: '#166534' },

});

