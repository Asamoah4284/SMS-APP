import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { WebView } from 'react-native-webview';
import { useAuth } from '../context/AuthContext';
import { useBooksData } from '../hooks/useBooksData';
import { apiFetch, resolveMediaUrl } from '../config/api';
import { colors, radius, TAB_BAR_HEIGHT } from '../theme';

const EPS = 0.005;

function BookCoverThumb({ coverUrl, size = 52 }) {
  const [failed, setFailed] = useState(false);
  const uri = resolveMediaUrl(coverUrl);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  if (!uri || failed) {
    return (
      <View style={[styles.bookCover, styles.bookCoverFallback, { width: size, height: size * 1.25 }]}>
        <MaterialCommunityIcons name="book-open-variant" size={22} color={colors.brandNavy} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[styles.bookCover, { width: size, height: size * 1.25 }]}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}

export default function LibraryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { token, student } = useAuth();
  const { data, isLoading, refetch } = useBooksData();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState([]);
  const [paying, setPaying] = useState(false);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [checkoutReference, setCheckoutReference] = useState('');
  const checkoutReferenceRef = useRef('');
  const checkoutFinalizedRef = useRef(false);

  const books = data?.books ?? [];
  const unpaid = books.filter((b) => !b.isPaid && b.remaining > EPS);
  const paid = books.filter((b) => b.isPaid);

  useEffect(() => {
    setSelectedBookIds(unpaid.map((b) => b.bookId));
  }, [data?.termId, unpaid.length]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const toggleBook = (bookId) => {
    setSelectedBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
  };

  const verifyPayment = useCallback(async () => {
    const ref = checkoutReferenceRef.current;
    if (!ref || checkoutFinalizedRef.current) return;
    try {
      const res = await apiFetch(`/portal/books/moolre/verify/${ref}`, token);
      if (res.status === 'SUCCESS') {
        checkoutFinalizedRef.current = true;
        setCheckoutVisible(false);
        setPaying(false);
        Alert.alert('Payment successful', 'Your book payment has been recorded.');
        refetch();
      }
    } catch {
      // keep polling
    }
  }, [token, refetch]);

  useEffect(() => {
    if (!checkoutVisible || !checkoutReference) return;
    const interval = setInterval(verifyPayment, 2500);
    return () => clearInterval(interval);
  }, [checkoutVisible, checkoutReference, verifyPayment]);

  const startPayment = async () => {
    if (selectedBookIds.length === 0) {
      Alert.alert('Library', 'Select at least one book to pay.');
      return;
    }
    const amount = unpaid
      .filter((b) => selectedBookIds.includes(b.bookId))
      .reduce((s, b) => s + b.remaining, 0);
    if (amount < 0.01) {
      Alert.alert('Library', 'Nothing to pay for selected books.');
      return;
    }

    setPaying(true);
    checkoutFinalizedRef.current = false;
    try {
      const callbackUrl = Linking.createURL('moolre');
      const init = await apiFetch('/portal/books/moolre/initialize', token, {
        method: 'POST',
        body: JSON.stringify({
          studentId: student.studentId,
          bookIds: selectedBookIds,
          amount,
          callbackUrl,
        }),
      });
      checkoutReferenceRef.current = init.reference;
      setCheckoutReference(init.reference);
      setCheckoutUrl(init.authorizationUrl);
      setCheckoutVisible(true);
    } catch (e) {
      Alert.alert('Payment', e?.message || 'Could not start payment.');
      setPaying(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.brandNavy} />
      </View>
    );
  }

  const selectedTotal = unpaid
    .filter((b) => selectedBookIds.includes(b.bookId))
    .reduce((s, b) => s + b.remaining, 0);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.headerLeft}>
          <Ionicons name="chevron-back" size={22} color={colors.brandNavy} />
          <Text style={styles.headerTitle}>Library</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandNavy} />}
      >
        <View style={styles.summaryCard}>
          <Text style={styles.termLabel}>{data?.termName ?? 'Current term'}</Text>
          <Text style={styles.balanceLabel}>Outstanding</Text>
          <Text style={styles.balanceValue}>GH₵{(data?.balance ?? 0).toFixed(2)}</Text>
          <Text style={styles.summaryMeta}>
            {unpaid.length} unpaid · {paid.length} paid
          </Text>
        </View>

        {unpaid.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Books to pay</Text>
            {unpaid.map((book) => {
              const selected = selectedBookIds.includes(book.bookId);
              return (
                <Pressable
                  key={book.bookId}
                  onPress={() => toggleBook(book.bookId)}
                  style={[styles.bookCard, selected && styles.bookCardSelected]}
                >
                  <BookCoverThumb coverUrl={book.coverUrl} />
                  <View style={styles.bookInfo}>
                    <Text style={styles.bookTitle}>{book.title}</Text>
                    {book.author ? <Text style={styles.bookAuthor}>{book.author}</Text> : null}
                    <Text style={styles.bookPrice}>GH₵{book.remaining.toFixed(2)}</Text>
                  </View>
                  <Ionicons
                    name={selected ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={selected ? colors.brandNavy : colors.textSoft}
                  />
                </Pressable>
              );
            })}
            <Pressable
              style={[styles.payBtn, paying && styles.payBtnDisabled]}
              onPress={startPayment}
              disabled={paying}
            >
              <Text style={styles.payBtnText}>
                {paying ? 'Starting…' : `Pay GH₵${selectedTotal.toFixed(2)}`}
              </Text>
            </Pressable>
          </>
        )}

        {paid.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Paid books</Text>
            {paid.map((book) => (
              <View key={book.bookId} style={styles.paidCard}>
                <BookCoverThumb coverUrl={book.coverUrl} size={44} />
                <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle}>{book.title}</Text>
                  <Text style={styles.paidMeta}>Paid GH₵{book.paid.toFixed(2)}</Text>
                </View>
                <MaterialCommunityIcons name="check-circle" size={20} color={colors.green} />
              </View>
            ))}
          </>
        )}

        {books.length === 0 && (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="bookshelf" size={40} color={colors.brandGold} />
            <Text style={styles.emptyTitle}>No books assigned</Text>
            <Text style={styles.emptyBody}>Required textbooks for this term will appear here.</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={checkoutVisible} animationType="slide" onRequestClose={() => setCheckoutVisible(false)}>
        <View
          style={{
            flex: 1,
            paddingTop: Math.max(insets.top, 0) + (Platform.OS === 'android' ? 12 : 8),
          }}
        >
          <View style={styles.checkoutHeader}>
            <Pressable onPress={() => { setCheckoutVisible(false); setPaying(false); }}>
              <Text style={styles.checkoutClose}>Close</Text>
            </Pressable>
            <Text style={styles.checkoutTitle}>Pay for books</Text>
            <View style={{ width: 48 }} />
          </View>
          {checkoutUrl ? (
            <WebView
              source={{ uri: checkoutUrl }}
              onNavigationStateChange={() => verifyPayment()}
              onMessage={(event) => {
                try {
                  const msg = JSON.parse(event.nativeEvent.data);
                  if (msg?.type === 'moolre-payment-success') {
                    verifyPayment();
                  }
                } catch {
                  // ignore non-JSON messages
                }
              }}
            />
          ) : (
            <ActivityIndicator style={{ marginTop: 40 }} />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.brandNavy },
  summaryCard: {
    backgroundColor: colors.cardBlue,
    borderRadius: radius.md,
    padding: 18,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brandNavyMuted,
  },
  termLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  balanceLabel: { fontSize: 13, color: colors.textMuted, marginTop: 8 },
  balanceValue: { fontSize: 28, fontWeight: '800', color: colors.brandNavy },
  summaryMeta: { fontSize: 12, color: colors.textSoft, marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.brandNavy, marginBottom: 10, marginTop: 8 },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  bookCardSelected: { borderColor: colors.brandNavy, backgroundColor: colors.brandNavyMuted },
  bookCover: {
    borderRadius: 8,
    backgroundColor: colors.hlFeeBlueBg,
  },
  bookCoverFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookInfo: { flex: 1 },
  bookTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  bookAuthor: { fontSize: 12, color: colors.textMuted },
  bookPrice: { fontSize: 13, fontWeight: '700', color: colors.brandGoldDark, marginTop: 4 },
  payBtn: {
    backgroundColor: colors.brandNavy,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  paidCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.greenMuted,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 8,
  },
  paidMeta: { fontSize: 12, color: colors.green, marginTop: 2 },
  emptyCard: {
    backgroundColor: colors.cardBlue,
    borderRadius: radius.md,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.brandNavy },
  emptyBody: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  checkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  checkoutClose: { color: colors.brandNavy, fontWeight: '600' },
  checkoutTitle: { fontWeight: '700', color: colors.text },
});
