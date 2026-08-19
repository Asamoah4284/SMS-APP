import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useAuth } from '../context/AuthContext';
import { usePortalData } from '../hooks/usePortalData';
import { apiFetch } from '../config/api';
import { colors, radius, TAB_BAR_HEIGHT } from '../theme';

function buildReportCardHtml(data) {
  const rows = (data.results || [])
    .map(
      (sub) => `
      <tr>
        <td>${sub.subjectName}</td>
        <td style="text-align:center">${sub.totalScore != null ? Number(sub.totalScore).toFixed(1) : 'ABS'}</td>
        <td style="text-align:center;font-weight:bold">${sub.grade ?? '—'}</td>
        <td style="text-align:center">${sub.position ?? '—'}</td>
        <td>${sub.remarks ?? ''}</td>
      </tr>`
    )
    .join('');

  const avg =
    data.average ??
    (() => {
      const scores = (data.results || []).map((r) => r.totalScore).filter((s) => s != null);
      return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    })();

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Report Card</title>
  <style>
    body { font-family: Georgia, serif; margin: 24px; color: #111; }
    h1, h2 { margin: 0; }
    .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; font-size: 14px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; }
    th { background: #f0f0f0; text-transform: uppercase; font-size: 11px; }
    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
    .box { border: 1px solid #ddd; border-radius: 6px; padding: 8px; text-align: center; }
    .remarks { border-top: 1px solid #ccc; padding-top: 12px; font-size: 12px; }
    @media print { body { margin: 12px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>END OF TERM REPORT CARD</h1>
    <p>${data.term?.name ?? ''} ${data.term?.year ?? ''}</p>
  </div>
  <div class="grid">
    <div><strong>Name:</strong> ${data.student?.name ?? ''}</div>
    <div><strong>Student ID:</strong> ${data.student?.studentId ?? ''}</div>
    <div><strong>Class:</strong> ${data.student?.className ?? ''}</div>
    <div><strong>Class Teacher:</strong> ${data.student?.classTeacher ?? ''}</div>
    <div><strong>Gender:</strong> ${data.student?.gender ?? ''}</div>
    <div><strong>Class Size:</strong> ${data.student?.classSize ?? ''}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Subject</th>
        <th>Score</th>
        <th>Grade</th>
        <th>Position</th>
        <th>Remarks</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="5" style="text-align:center">No results</td></tr>'}</tbody>
  </table>
  <div class="summary">
    <div class="box"><div>Average</div><strong>${avg != null ? `${avg.toFixed(1)}%` : '—'}</strong></div>
    <div class="box"><div>Days Present</div><strong>${(data.attendance?.PRESENT ?? 0) + (data.attendance?.LATE ?? 0)}/${data.totalDays ?? 0}</strong></div>
    <div class="box"><div>Promotion</div><strong>${data.isPromoted ? 'Promoted' : 'Repeat'}</strong></div>
  </div>
  <div class="remarks">
    <p><strong>Class Teacher:</strong> ${data.teacherRemarks ?? ''}</p>
    <p><strong>Headmaster:</strong> ${data.headmasterRemarks ?? ''}</p>
  </div>
</body>
</html>`;
}

export default function ReportCardScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { data: portalData, isLoading } = usePortalData();
  const initialTermId = route?.params?.termId ?? null;

  const terms = useMemo(() => {
    const map = new Map();
    (portalData?.results ?? []).forEach((r) => {
      if (r.termId && !map.has(r.termId)) {
        map.set(r.termId, r.term);
      }
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [portalData?.results]);

  const [selectedTermId, setSelectedTermId] = useState(initialTermId);
  const [card, setCard] = useState(null);
  const [loadingCard, setLoadingCard] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [html, setHtml] = useState('');

  const activeTermId = selectedTermId || terms[0]?.id || null;

  const loadReportCard = useCallback(async () => {
    if (!token || !portalData?.student?.studentId || !activeTermId) return;
    setLoadingCard(true);
    try {
      const res = await apiFetch(
        `/portal/child/${portalData.student.studentId}/reportcard/${activeTermId}`,
        token
      );
      setCard(res);
      setHtml(buildReportCardHtml(res));
    } catch (e) {
      Alert.alert('Report card', e?.message || 'Could not load report card. Results may not be published yet.');
      setCard(null);
    } finally {
      setLoadingCard(false);
    }
  }, [token, portalData?.student?.studentId, activeTermId]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.brandNavy} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.headerLeft}>
          <Ionicons name="chevron-back" size={22} color={colors.brandNavy} />
          <Text style={styles.headerTitle}>Report Card</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {terms.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={36} color={colors.textSoft} />
            <Text style={styles.emptyTitle}>No published results yet</Text>
            <Text style={styles.emptyBody}>
              Report cards appear here once the school publishes end-of-term results.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.label}>Select term</Text>
            <View style={styles.termRow}>
              {terms.map((t) => {
                const active = t.id === activeTermId;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setSelectedTermId(t.id)}
                    style={[styles.termChip, active && styles.termChipActive]}
                  >
                    <Text style={[styles.termChipText, active && styles.termChipTextActive]}>{t.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={[styles.loadBtn, loadingCard && styles.loadBtnDisabled]}
              onPress={loadReportCard}
              disabled={loadingCard}
            >
              {loadingCard ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loadBtnText}>Load report card</Text>
              )}
            </Pressable>

            {card && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{card.student?.name}</Text>
                <Text style={styles.cardSub}>
                  {card.term?.name} {card.term?.year} · {card.student?.className}
                </Text>
                <Text style={styles.cardMeta}>
                  Average: {card.average != null ? `${card.average.toFixed(1)}%` : '—'} ·{' '}
                  {card.results?.length ?? 0} subjects
                </Text>
                <Pressable style={styles.pdfBtn} onPress={() => setPreviewVisible(true)}>
                  <Ionicons name="download-outline" size={18} color="#fff" />
                  <Text style={styles.pdfBtnText}>View & save as PDF</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={previewVisible} animationType="slide" onRequestClose={() => setPreviewVisible(false)}>
        <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: '#fff' }}>
          <View style={styles.previewHeader}>
            <Pressable onPress={() => setPreviewVisible(false)}>
              <Text style={styles.previewClose}>Close</Text>
            </Pressable>
            <Text style={styles.previewTitle}>Report card</Text>
            <View style={{ width: 48 }} />
          </View>
          {html ? (
            <WebView
              originWhitelist={['*']}
              source={{ html }}
              style={{ flex: 1 }}
            />
          ) : (
            <ActivityIndicator style={{ marginTop: 40 }} />
          )}
          <View style={[styles.previewFooter, { paddingBottom: insets.bottom + 12 }]}>
            <Text style={styles.previewHint}>
              Use your device menu (Share / Print) to save this report card as a PDF.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 18 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.brandNavy },
  label: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 8 },
  termRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  termChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.cardBlue,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brandNavyMuted,
  },
  termChipActive: { backgroundColor: colors.brandNavy, borderColor: colors.brandNavy },
  termChipText: { fontSize: 12, fontWeight: '700', color: colors.brandNavy },
  termChipTextActive: { color: '#fff' },
  loadBtn: {
    backgroundColor: colors.brandNavy,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  loadBtnDisabled: { opacity: 0.7 },
  loadBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brandNavyMuted,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.brandNavy },
  cardSub: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  cardMeta: { fontSize: 12, color: colors.text, marginTop: 8 },
  pdfBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.brandGoldDark,
    borderRadius: radius.md,
    paddingVertical: 12,
  },
  pdfBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  emptyCard: {
    backgroundColor: colors.cardBlue,
    borderRadius: radius.md,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.brandNavy },
  emptyBody: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  previewClose: { fontSize: 14, fontWeight: '700', color: colors.brandNavy },
  previewTitle: { fontSize: 15, fontWeight: '800', color: colors.brandNavy },
  previewFooter: { paddingHorizontal: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e5e7eb' },
  previewHint: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
});
