import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAnnouncements, formatAnnouncementDate } from '../hooks/useAnnouncements';
import { colors, radius, TAB_BAR_HEIGHT } from '../theme';

export default function AnnouncementsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { data, isLoading, error, refetch } = useAnnouncements();
  const [refreshing, setRefreshing] = useState(false);

  const announcements = Array.isArray(data) ? data : [];

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Home');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.brandNavy} />
        </Pressable>
        <Text style={styles.headerTitle}>Announcements</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.iconBlue} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Could not load announcements.</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.iconBlue} />
          }
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 24 },
          ]}
        >
          {announcements.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="megaphone-outline" size={40} color={colors.textSoft} />
              <Text style={styles.emptyTitle}>No announcements yet</Text>
              <Text style={styles.emptySub}>
                When the school posts updates, they will appear here and you may get a push notification.
              </Text>
            </View>
          ) : (
            announcements.map((a) => (
              <View key={a.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.iconWrap}>
                    <Ionicons name="megaphone" size={16} color={colors.brandNavy} />
                  </View>
                  <Text style={styles.date}>{formatAnnouncementDate(a.createdAt)}</Text>
                </View>
                <Text style={styles.title}>{a.title}</Text>
                <Text style={styles.body}>{a.content}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text },
  headerSpacer: { width: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: colors.textMuted, fontSize: 14 },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  empty: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 24 },
  emptyTitle: { marginTop: 12, fontSize: 16, fontWeight: '700', color: colors.text },
  emptySub: { marginTop: 6, fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.brandNavyMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  date: { fontSize: 12, color: colors.textSoft },
  title: { fontSize: 15, fontWeight: '700', color: colors.brandNavy, marginBottom: 6 },
  body: { fontSize: 14, color: colors.text, lineHeight: 20 },
});
