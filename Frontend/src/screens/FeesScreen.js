import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import Svg, { Path } from 'react-native-svg';
import { usePortalData } from '../hooks/usePortalData';
import { colors } from '../theme';

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
  const end = start + (360 * Math.min(100, Math.max(0, percent))) / 100;
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
        {/* Paid arc — remainder */}
        {percent < 100 && (
          <Path
            d={arcPath(DONUT_CX, DONUT_CY, DONUT_R, end + 6, end + Math.max(0, (360 * (1 - percent / 100)) - 12))}
            stroke="#22C55E"
            strokeWidth={DONUT_STROKE}
            strokeLinecap="round"
            fill="none"
          />
        )}
      </Svg>
      <View style={styles.donutCenter} pointerEvents="none">
        <Text style={styles.donutPct}>{percent}%</Text>
        <Text style={styles.donutDue}>Unpaid</Text>
      </View>
    </View>
  );
}

const FEE_STATUS_INFO = {
  FULLY_PAID: { label: 'Fully Paid', color: '#166534', bg: '#DCFCE7' },
  PARTIAL:    { label: 'Partially Paid', color: '#92400E', bg: '#FEF3C7' },
  UNPAID:     { label: 'Unpaid', color: '#991B1B', bg: '#FEE2E2' },
};

export default function FeesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch } = usePortalData();
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

  const fees = data?.fees;
  const balance = fees?.balance ?? 0;
  const totalDue = fees?.totalDue ?? 0;
  const totalPaid = fees?.totalPaid ?? 0;
  const termName = fees?.termName ?? 'Current Term';
  const feeStatus = fees?.status ?? null;
  const unpaidPct = totalDue > 0 ? Math.round((balance / totalDue) * 100) : 0;
  const statusInfo = feeStatus ? FEE_STATUS_INFO[feeStatus] : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.headerLeft}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
          <Text style={styles.headerTitle}>Fees</Text>
        </Pressable>
        {statusInfo && (
          <View style={[styles.statusPill, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.statusPillText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 18 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0369A1" />
        }
      >
        {/* Balance card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceTopRow}>
            <View style={styles.balanceLeft}>
              <Text style={styles.balanceLabel}>Total Outstanding Balance</Text>
              <Text style={styles.balanceValue}>GH₵{balance.toFixed(2)}</Text>
              <Text style={styles.termLabel}>{termName}</Text>

              <View style={styles.balanceLines}>
                <View style={styles.balanceLine}>
                  <View style={[styles.swatch, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.balanceLineLabel}>Unpaid</Text>
                  <Text style={styles.balanceLineAmt}>GH₵{balance.toFixed(2)}</Text>
                </View>
                <View style={styles.balanceLine}>
                  <View style={[styles.swatch, { backgroundColor: '#22C55E' }]} />
                  <Text style={styles.balanceLineLabel}>Paid</Text>
                  <Text style={[styles.balanceLineAmt, { color: '#16A34A' }]}>GH₵{totalPaid.toFixed(2)}</Text>
                </View>
              </View>
            </View>

            {totalDue > 0 ? (
              <FeesDonut percent={unpaidPct} />
            ) : (
              <View style={styles.noFeesBox}>
                <Ionicons name="checkmark-circle" size={40} color="#22C55E" />
                <Text style={styles.noFeesText}>No fees{'\n'}recorded</Text>
              </View>
            )}
          </View>
        </View>

        {/* Summary tiles */}
        <View style={styles.tileRow}>
          <View style={[styles.tileCard, { backgroundColor: '#FEF3C7' }]}>
            <Text style={styles.tileTitle}>Total Due</Text>
            <View style={styles.tileAmounts}>
              <Text style={styles.tilePaid}>GH₵{totalDue.toFixed(2)}</Text>
            </View>
            <Text style={styles.tileDueDate}>{termName}</Text>
          </View>
          <View style={[styles.tileCard, { backgroundColor: '#DCFCE7' }]}>
            <Text style={styles.tileTitle}>Total Paid</Text>
            <View style={styles.tileAmounts}>
              <Text style={[styles.tilePaid, { color: '#166534' }]}>GH₵{totalPaid.toFixed(2)}</Text>
            </View>
            <Text style={styles.tileDueDate}>{termName}</Text>
          </View>
        </View>

        {/* No fee data state */}
        {totalDue === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="wallet-outline" size={36} color={colors.textSoft} />
            <Text style={styles.emptyTitle}>No fee records yet</Text>
            <Text style={styles.emptyBody}>Fee data will appear here once the school sets up fee structures for the current term.</Text>
          </View>
        )}
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

  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusPillText: { fontSize: 12, fontWeight: '700' },

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
  termLabel: { fontSize: 11, color: colors.textSoft, marginTop: 2, marginBottom: 8 },
  balanceLines: { gap: 8 },
  balanceLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  balanceLineLabel: { fontSize: 12, color: colors.textMuted, width: 54 },
  balanceLineAmt: { fontSize: 13, fontWeight: '700', color: colors.text },

  donutWrap: { width: DONUT_VIEW, height: DONUT_VIEW, alignItems: 'center', justifyContent: 'center' },
  donutCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  donutPct: { fontSize: 18, fontWeight: '800', color: colors.text },
  donutDue: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginTop: 2 },

  noFeesBox: { width: DONUT_VIEW, alignItems: 'center', justifyContent: 'center', gap: 4 },
  noFeesText: { fontSize: 11, color: colors.textMuted, textAlign: 'center', lineHeight: 15 },

  tileRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  tileCard: { flex: 1, borderRadius: 18, padding: 14 },
  tileTitle: { fontSize: 13, fontWeight: '800', color: colors.text },
  tileAmounts: { flexDirection: 'row', alignItems: 'baseline', marginTop: 10 },
  tilePaid: { fontSize: 18, fontWeight: '800', color: colors.text },
  tileDueDate: { marginTop: 8, fontSize: 12, color: colors.textMuted },

  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  emptyBody: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
});
