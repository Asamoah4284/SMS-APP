import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useMemo, useState } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { usePortalData } from '../hooks/usePortalData';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../config/api';
import { colors, TAB_BAR_HEIGHT } from '../theme';

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

/** Shows % paid — logo gold arc on navy-tint track; full ring uses gold at 100% */
function FeesDonut({ paidPercent }) {
  const pct = Math.min(100, Math.max(0, paidPercent));
  const start = -90;
  const end = start + (360 * pct) / 100;
  const trackStroke = 'rgba(27, 68, 128, 0.14)';
  const arcStroke = colors.brandGold;
  const isFull = pct >= 99.9;
  return (
    <View style={styles.donutWrap}>
      <Svg width={DONUT_VIEW} height={DONUT_VIEW} viewBox={`0 0 ${DONUT_VIEW} ${DONUT_VIEW}`}>
        {!isFull && (
          <Path
            d={arcPath(DONUT_CX, DONUT_CY, DONUT_R, 0, 359.999)}
            stroke={trackStroke}
            strokeWidth={DONUT_STROKE}
            strokeLinecap="round"
            fill="none"
          />
        )}
        {isFull ? (
          <Circle
            cx={DONUT_CX}
            cy={DONUT_CY}
            r={DONUT_R}
            stroke={arcStroke}
            strokeWidth={DONUT_STROKE}
            fill="none"
          />
        ) : (
          pct > 0 && (
            <Path
              d={arcPath(DONUT_CX, DONUT_CY, DONUT_R, start, end)}
              stroke={arcStroke}
              strokeWidth={DONUT_STROKE}
              strokeLinecap="round"
              fill="none"
            />
          )
        )}
      </Svg>
      <View style={styles.donutCenter} pointerEvents="none">
        <Text style={styles.donutPct}>{pct}%</Text>
        <Text style={styles.donutDue}>Paid</Text>
      </View>
    </View>
  );
}

const FEE_STATUS_INFO = {
  FULLY_PAID: { label: 'Fully Paid', color: colors.green, bg: colors.greenMuted },
  PARTIAL: { label: 'Partially Paid', color: colors.brandGoldDark, bg: colors.yellowMuted },
  UNPAID: { label: 'Unpaid', color: colors.red, bg: colors.redMuted },
};

const EPS = 0.005;

function categoryLabel(cat, name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('feed')) return 'Feeding';
  if (cat === 'TUITION') return 'School fees';
  if (cat === 'UNIFORM') return 'Uniform / kit';
  if (cat === 'OTHER') return 'Other charges';
  return cat || 'Fee';
}

export default function FeesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { token, student } = useAuth();
  const { data, isLoading, refetch } = usePortalData();
  const balance = data?.fees?.balance ?? 0;

  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState(false);
  /** GH₵ amount parent wants to pay (capped at selected fee lines server-side) */
  const [amountToPay, setAmountToPay] = useState('');
  /** Fee structure IDs included in this payment (school fees, feeding, other, etc.) */
  const [selectedFeeStructureIds, setSelectedFeeStructureIds] = useState([]);

  const fees = data?.fees;
  const lineItems = Array.isArray(fees?.lineItems) ? fees.lineItems : [];

  const payableSignature = useMemo(
    () =>
      lineItems
        .filter((l) => l.remaining > EPS)
        .map((l) => `${l.feeStructureId}:${l.remaining}`)
        .join('|'),
    [lineItems]
  );

  /** Stable key when the parent changes which fee lines are included */
  const selectionSig = useMemo(
    () => [...selectedFeeStructureIds].sort().join('|'),
    [selectedFeeStructureIds]
  );

  /** Max GH₵ for this checkout: selected lines only; if school sends no breakdown, whole balance applies */
  const maxPayableSelected = useMemo(() => {
    if (lineItems.length === 0) return balance;
    return lineItems
      .filter((l) => selectedFeeStructureIds.includes(l.feeStructureId))
      .reduce((s, l) => s + l.remaining, 0);
  }, [lineItems, selectedFeeStructureIds, balance]);

  useEffect(() => {
    setAmountToPay('');
    setSelectedFeeStructureIds([]);
  }, [student?.studentId]);

  useEffect(() => {
    if (lineItems.length === 0) return;
    const payable = lineItems.filter((l) => l.remaining > EPS).map((l) => l.feeStructureId);
    setSelectedFeeStructureIds((prev) => {
      const filtered = prev.filter((id) => payable.includes(id));
      return payable.length === 0 ? [] : filtered.length > 0 ? filtered : [...payable];
    });
  }, [payableSignature]);

  /**
   * Keep “Amount to pay” equal to the full total for the current selection until the parent edits it.
   * When they change which fees are ticked (or balances refresh), reset to that full amount again.
   */
  useEffect(() => {
    if (isLoading) return;

    if (lineItems.length === 0) {
      if (balance > EPS) {
        setAmountToPay(balance.toFixed(2));
      } else {
        setAmountToPay('');
      }
      return;
    }

    const max = lineItems
      .filter((l) => selectedFeeStructureIds.includes(l.feeStructureId))
      .reduce((s, l) => s + l.remaining, 0);

    if (max > EPS) {
      setAmountToPay(max.toFixed(2));
    } else {
      setAmountToPay('');
    }
  }, [selectionSig, payableSignature, isLoading, balance, lineItems.length, selectedFeeStructureIds]);

  useEffect(() => {
    const raw = String(amountToPay).trim().replace(/,/g, '');
    const parsed = raw === '' ? NaN : parseFloat(raw);
    if (
      maxPayableSelected > EPS &&
      Number.isFinite(parsed) &&
      parsed > maxPayableSelected + EPS
    ) {
      setAmountToPay(maxPayableSelected.toFixed(2));
    }
  }, [maxPayableSelected]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const toggleFeeLine = (feeStructureId) => {
    setSelectedFeeStructureIds((prev) =>
      prev.includes(feeStructureId)
        ? prev.filter((id) => id !== feeStructureId)
        : [...prev, feeStructureId]
    );
  };

  const payWithPaystack = async () => {
    if (!token || !student?.studentId) {
      Alert.alert('Sign in required', 'Please select your ward again and try paying.');
      return;
    }

    if (lineItems.length > 0 && selectedFeeStructureIds.length === 0) {
      Alert.alert('Select fees', 'Choose at least one fee line (school fees, feeding, or other) to pay toward.');
      return;
    }

    const cap = lineItems.length > 0 ? maxPayableSelected : balance;
    const raw = String(amountToPay).trim().replace(/,/g, '');
    const parsed = raw === '' ? cap : parseFloat(raw);
    if (!Number.isFinite(parsed) || parsed < 0.01) {
      Alert.alert('Amount', 'Enter a valid amount of at least GH₵0.01.');
      return;
    }
    if (parsed > cap + EPS) {
      Alert.alert(
        'Amount too high',
        lineItems.length > 0
          ? `You can pay at most GH₵${cap.toFixed(2)} for the fees you selected (outstanding total GH₵${balance.toFixed(2)}).`
          : `You can pay at most GH₵${balance.toFixed(2)} (outstanding balance).`
      );
      return;
    }

    setPaying(true);
    let reference = '';
    try {
      const callbackUrl = Linking.createURL('paystack');
      const payload = {
        studentId: student.studentId,
        amount: Math.round(parsed * 100) / 100,
        callbackUrl,
      };
      if (lineItems.length > 0) {
        payload.feeStructureIds = selectedFeeStructureIds;
      }
      const init = await apiFetch('/portal/paystack/initialize', token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      reference = init.reference;

      const browserResult = await WebBrowser.openAuthSessionAsync(init.authorizationUrl, callbackUrl);

      if (browserResult.type === 'success' || browserResult.type === 'dismiss') {
        try {
          const verify = await apiFetch(`/portal/paystack/verify/${encodeURIComponent(reference)}`, token);
          await refetch();
          if (verify.status === 'SUCCESS') {
            Alert.alert('Payment successful', 'The amount has been applied to your ward’s fee balance.');
          } else {
            Alert.alert(
              'Payment status',
              'If you finished paying in the browser, balances may take a moment to update. Pull down to refresh, or try again shortly.'
            );
          }
        } catch (verifyErr) {
          await refetch();
          Alert.alert(
            'Check balance',
            verifyErr?.message ||
              'We could not confirm the payment immediately. Pull down to refresh — if money left your account, the school record usually updates within a minute.'
          );
        }
      } else if (browserResult.type === 'cancel') {
        Alert.alert('Payment cancelled', 'No charge was made.');
      }
    } catch (e) {
      Alert.alert('Payment', e?.message || 'Could not start or complete payment.');
    } finally {
      setPaying(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.iconBlue} />
      </View>
    );
  }

  const totalDue = fees?.totalDue ?? 0;
  const totalPaid = fees?.totalPaid ?? 0;
  const termName = fees?.termName ?? 'Current Term';
  const feeStatus = fees?.status ?? null;
  /** Force 100 for fully settled fees so the donut ring is completely green (avoids 99% rounding gaps) */
  const paidPct =
    totalDue > 0
      ? feeStatus === 'FULLY_PAID' || balance <= 0.02
        ? 100
        : Math.min(100, Math.round((totalPaid / totalDue) * 100))
      : 0;
  const statusInfo = feeStatus ? FEE_STATUS_INFO[feeStatus] : null;
  const canPayOnline = balance >= 0.01;
  const canSubmitPayment =
    canPayOnline && (lineItems.length === 0 ? true : maxPayableSelected >= 0.01);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.headerLeft}>
          <Ionicons name="chevron-back" size={22} color={colors.brandNavy} />
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
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 18 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandNavy} />
        }
      >
        <View style={styles.balanceCard}>
          <View style={styles.balanceTopRow}>
            <View style={styles.balanceLeft}>
              <Text style={styles.balanceLabel}>Total Outstanding Balance</Text>
              <Text style={styles.balanceValue}>GH₵{balance.toFixed(2)}</Text>
              <Text style={styles.termLabel}>{termName}</Text>

              <View style={styles.balanceLines}>
                <View style={styles.balanceLine}>
                  <View style={[styles.swatch, { backgroundColor: colors.danger }]} />
                  <Text style={styles.balanceLineLabel}>Unpaid</Text>
                  <Text style={styles.balanceLineAmt}>GH₵{balance.toFixed(2)}</Text>
                </View>
                <View style={styles.balanceLine}>
                  <View style={[styles.swatch, { backgroundColor: colors.brandGold }]} />
                  <Text style={styles.balanceLineLabel}>Paid</Text>
                  <Text style={[styles.balanceLineAmt, { color: colors.brandGoldDark }]}>GH₵{totalPaid.toFixed(2)}</Text>
                </View>
              </View>
            </View>

            {totalDue > 0 ? (
              <FeesDonut paidPercent={paidPct} />
            ) : (
              <View style={styles.noFeesBox}>
                <Ionicons name="checkmark-circle" size={40} color={colors.brandGold} />
                <Text style={styles.noFeesText}>No fees{'\n'}recorded</Text>
              </View>
            )}
          </View>
        </View>

        {lineItems.length > 0 && (
          <View style={styles.linesCard}>
            <Text style={styles.linesTitle}>Choose what to pay</Text>
            <Text style={styles.linesSub}>
              Tick school fees, feeding, uniform, or other charges for this payment. Your amount cannot exceed the
              selected lines (GH₵{maxPayableSelected.toFixed(2)}).
            </Text>
            {lineItems.map((line) => {
              const payable = line.remaining > EPS;
              const checked = selectedFeeStructureIds.includes(line.feeStructureId);
              return (
                <Pressable
                  key={line.feeStructureId}
                  style={[styles.lineRow, !payable && styles.lineRowDisabled]}
                  onPress={() => payable && toggleFeeLine(line.feeStructureId)}
                  disabled={!payable || paying}
                >
                  <Ionicons
                    style={styles.lineCheck}
                    name={checked ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={
                      !payable ? colors.textSoft : checked ? colors.brandNavy : colors.textMuted
                    }
                  />
                  <View style={styles.lineLeft}>
                    <Text style={styles.lineName}>{line.name}</Text>
                    <Text style={styles.lineCat}>{categoryLabel(line.category, line.name)}</Text>
                  </View>
                  <View style={styles.lineRight}>
                    <Text style={styles.lineDue}>GH₵{line.lineDue.toFixed(2)}</Text>
                    {payable ? (
                      <Text style={styles.lineRem}>GH₵{line.remaining.toFixed(2)} left</Text>
                    ) : (
                      <Text style={styles.linePaid}>Paid</Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {canPayOnline && (
          <View style={styles.payCard}>
            <Text style={styles.payFieldLabel}>Amount to pay (GH₵)</Text>
            <TextInput
              style={styles.payInput}
              value={amountToPay}
              onChangeText={setAmountToPay}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textSoft}
              editable={!paying && canSubmitPayment}
            />
            <View style={styles.payHintRow}>
              <Text style={styles.payHint}>
                {lineItems.length > 0
                  ? `Selected fees max: GH₵${maxPayableSelected.toFixed(2)} · Total outstanding GH₵${balance.toFixed(2)}`
                  : `Outstanding: GH₵${balance.toFixed(2)} · you can pay any amount up to this`}
              </Text>
              <Pressable
                onPress={() =>
                  setAmountToPay((lineItems.length > 0 ? maxPayableSelected : balance).toFixed(2))
                }
                hitSlop={8}
                disabled={paying || !canSubmitPayment}
              >
                <Text style={[styles.payUseFull, !canSubmitPayment && styles.payUseFullDisabled]}>
                  {lineItems.length > 0 ? 'Pay selected in full' : 'Pay full balance'}
                </Text>
              </Pressable>
            </View>
            <Pressable
              style={[
                styles.payBtn,
                (paying || !canSubmitPayment) && styles.payBtnDisabled,
              ]}
              onPress={payWithPaystack}
              disabled={paying || !canSubmitPayment}
            >
              {paying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="card-outline" size={20} color="#fff" />
                  <Text style={styles.payBtnText}>Pay</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        <View style={styles.tileRow}>
          <View style={[styles.tileCard, styles.tileDueCard]}>
            <Text style={styles.tileTitle}>Total Due</Text>
            <View style={styles.tileAmounts}>
              <Text style={[styles.tilePaid, styles.tileDueAmt]}>GH₵{totalDue.toFixed(2)}</Text>
            </View>
            <Text style={styles.tileDueDate}>{termName}</Text>
          </View>
          <View style={[styles.tileCard, styles.tilePaidCard]}>
            <Text style={styles.tileTitle}>Total Paid</Text>
            <View style={styles.tileAmounts}>
              <Text style={[styles.tilePaid, styles.tilePaidAmt]}>GH₵{totalPaid.toFixed(2)}</Text>
            </View>
            <Text style={styles.tileDueDate}>{termName}</Text>
          </View>
        </View>

        {totalDue === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="wallet-outline" size={36} color={colors.textSoft} />
            <Text style={styles.emptyTitle}>No fee records yet</Text>
            <Text style={styles.emptyBody}>
              Fee lines will appear once the school publishes fee structures for the current term.
            </Text>
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
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.brandNavy },

  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusPillText: { fontSize: 12, fontWeight: '700' },

  balanceCard: {
    backgroundColor: colors.cardBlue,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brandNavyMuted,
  },
  balanceTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  balanceLeft: { flex: 1, minWidth: 0 },
  balanceLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  balanceValue: { fontSize: 28, fontWeight: '800', color: colors.brandNavy, marginTop: 4 },
  termLabel: { fontSize: 11, color: colors.textSoft, marginTop: 2, marginBottom: 8 },
  balanceLines: { gap: 8 },
  balanceLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  balanceLineLabel: { fontSize: 12, color: colors.textMuted, width: 54 },
  balanceLineAmt: { fontSize: 13, fontWeight: '700', color: colors.text },

  payCard: {
    backgroundColor: colors.cardBlue,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brandNavyMuted,
    gap: 8,
  },
  payFieldLabel: { fontSize: 13, fontWeight: '700', color: colors.brandNavy },
  payInput: {
    backgroundColor: colors.brandNavyMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(27, 68, 128, 0.22)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '700',
    color: colors.brandNavy,
  },
  payHintRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  payHint: { flex: 1, minWidth: 120, fontSize: 11, color: colors.textMuted, lineHeight: 15 },
  payUseFull: { fontSize: 12, fontWeight: '700', color: colors.brandNavy },
  payUseFullDisabled: { color: colors.textSoft },

  payBtn: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.brandNavy,
    paddingVertical: 14,
    borderRadius: 14,
  },
  payBtnDisabled: { opacity: 0.7 },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  linesCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brandNavyMuted,
  },
  linesTitle: { fontSize: 15, fontWeight: '800', color: colors.brandNavy, marginBottom: 4 },
  linesSub: { fontSize: 12, color: colors.textMuted, marginBottom: 12, lineHeight: 17 },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
    gap: 6,
  },
  lineRowDisabled: { opacity: 0.55 },
  lineCheck: { marginTop: 1 },
  lineLeft: { flex: 1, paddingRight: 8, minWidth: 0 },
  lineName: { fontSize: 14, fontWeight: '700', color: colors.brandNavy },
  lineCat: { fontSize: 11, color: colors.textSoft, marginTop: 2 },
  lineRight: { alignItems: 'flex-end' },
  lineDue: { fontSize: 13, fontWeight: '700', color: colors.text },
  lineRem: { fontSize: 11, color: colors.brandGoldDark, marginTop: 2, fontWeight: '600' },
  linePaid: { fontSize: 11, color: colors.brandNavy, marginTop: 2, fontWeight: '700' },

  donutWrap: { width: DONUT_VIEW, height: DONUT_VIEW, alignItems: 'center', justifyContent: 'center' },
  donutCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  donutPct: { fontSize: 18, fontWeight: '800', color: colors.brandNavy },
  donutDue: { fontSize: 12, fontWeight: '700', color: colors.brandGoldDark, marginTop: 2 },

  noFeesBox: { width: DONUT_VIEW, alignItems: 'center', justifyContent: 'center', gap: 4 },
  noFeesText: { fontSize: 11, color: colors.textMuted, textAlign: 'center', lineHeight: 15 },

  tileRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  tileCard: { flex: 1, borderRadius: 18, padding: 14 },
  tileDueCard: {
    backgroundColor: colors.yellowMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(201, 160, 32, 0.28)',
  },
  tilePaidCard: {
    backgroundColor: colors.hlFeeBlueBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brandNavyMuted,
  },
  tileDueAmt: { color: colors.brandGoldDark },
  tilePaidAmt: { color: colors.brandNavy },
  tileTitle: { fontSize: 13, fontWeight: '800', color: colors.brandNavy },
  tileAmounts: { flexDirection: 'row', alignItems: 'baseline', marginTop: 10 },
  tilePaid: { fontSize: 18, fontWeight: '800', color: colors.text },
  tileDueDate: { marginTop: 8, fontSize: 12, color: colors.textMuted },

  emptyCard: {
    backgroundColor: colors.cardBlue,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brandNavyMuted,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.brandNavy },
  emptyBody: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
});
