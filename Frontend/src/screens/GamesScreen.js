import { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GAME_CATALOG } from '../games/catalog';
import { colors, shadowCard } from '../theme';

const H_PAD = 16;
const GAP = 12;

function GameArt({ game, height }) {
  const [failed, setFailed] = useState(false);
  const Icon = game.family === 'mci' ? MaterialCommunityIcons : Ionicons;
  return (
    <View style={[styles.coverWrap, { height, backgroundColor: game.tint }]}>
      {game.cover && !failed ? (
        <Image
          source={game.cover}
          style={styles.cover}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : null}
      <View style={[styles.coverScrim, { backgroundColor: failed || !game.cover ? 'transparent' : 'rgba(255,255,255,0.18)' }]} />
      <View style={[styles.iconBadge, { backgroundColor: game.color }]}>
        <Icon name={game.icon} size={28} color={colors.white} />
      </View>
    </View>
  );
}

export default function GamesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cardWidth = (width - H_PAD * 2 - GAP) / 2;
  const coverHeight = Math.round(cardWidth * 0.78);
  const [selected, setSelected] = useState(null);

  const playSolo = (game) => {
    setSelected(null);
    navigation.navigate(game.screen, { mode: 'solo' });
  };

  const playVs = (game) => {
    setSelected(null);
    navigation.navigate('GameLobby', { mode: 'host', gameType: game.type });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backCircle}>
          <Ionicons name="chevron-back" size={22} color={colors.brandNavy} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Playground</Text>
          <Text style={styles.headerSub}>{GAME_CATALOG.length} games · solo or vs a friend</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 28 }]}
      >
        <Pressable
          onPress={() => navigation.navigate('GameLobby', { mode: 'join' })}
          style={[styles.joinBanner, shadowCard]}
        >
          <View style={styles.joinIcon}>
            <Ionicons name="enter-outline" size={22} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.joinTitle}>Have a room code?</Text>
            <Text style={styles.joinSub}>Join a friend’s challenge</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.brandNavy} />
        </Pressable>

        <Text style={styles.section}>Pick a game</Text>
        <Text style={styles.sectionSub}>Tap a card to see how it works, then play.</Text>

        <View style={styles.grid}>
          {GAME_CATALOG.map((game) => (
            <Pressable
              key={game.type}
              onPress={() => setSelected(game)}
              style={({ pressed }) => [
                styles.card,
                shadowCard,
                { width: cardWidth, borderColor: game.tint },
                pressed && styles.cardPressed,
              ]}
            >
              <GameArt game={game} height={coverHeight} />
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>{game.title}</Text>
                <Text style={styles.cardSub} numberOfLines={2}>{game.subtitle}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelected(null)}
      >
        {selected ? (
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.sheetHandle} />
            <View style={[styles.sheetHero, { backgroundColor: selected.tint }]}>
              <Pressable onPress={() => setSelected(null)} hitSlop={12} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
              <GameArt game={selected} height={148} />
            </View>
            <View style={styles.sheetBody}>
              <Text style={[styles.sheetKicker, { color: selected.color }]}>How to play</Text>
              <Text style={styles.sheetTitle}>{selected.title}</Text>
              <Text style={styles.sheetDesc}>{selected.description}</Text>
              <View style={styles.howRow}>
                <View style={[styles.howCard, { backgroundColor: selected.tint }]}>
                  <Ionicons name="person-outline" size={16} color={selected.color} />
                  <Text style={[styles.howLabel, { color: selected.color }]}>Solo</Text>
                  <Text style={styles.howText}>{selected.soloHow}</Text>
                </View>
                <View style={[styles.howCard, { backgroundColor: selected.tint }]}>
                  <Ionicons name="people-outline" size={16} color={selected.color} />
                  <Text style={[styles.howLabel, { color: selected.color }]}>Vs a friend</Text>
                  <Text style={styles.howText}>{selected.vsHow}</Text>
                </View>
              </View>
              <View style={styles.sheetActions}>
                <Pressable style={[styles.sheetSolo, { borderColor: selected.color }]} onPress={() => playSolo(selected)}>
                  <Text style={[styles.soloText, { color: selected.color }]}>Play solo</Text>
                </Pressable>
                <Pressable style={[styles.sheetVs, { backgroundColor: selected.color }]} onPress={() => playVs(selected)}>
                  <Text style={styles.challengeText}>Challenge</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F6FB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  headerSub: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  scroll: { paddingHorizontal: H_PAD, paddingTop: 8 },
  joinBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: colors.brandNavyMuted,
  },
  joinIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.brandNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  joinSub: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginTop: 1 },
  section: { fontSize: 18, fontWeight: '800', color: colors.text },
  sectionSub: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginTop: 2, marginBottom: 14 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  cardPressed: { transform: [{ scale: 0.98 }], opacity: 0.94 },
  coverWrap: {
    width: '100%',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cover: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  coverScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    minHeight: 72,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  cardSub: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.textMuted,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: 10,
    marginBottom: 8,
  },
  sheetHero: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    paddingTop: 8,
    paddingBottom: 4,
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sheetKicker: { fontSize: 12, fontWeight: '800', letterSpacing: 0.4, marginBottom: 4 },
  sheetTitle: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 8 },
  sheetDesc: { fontSize: 15, lineHeight: 22, color: colors.textMuted, marginBottom: 16 },
  howRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  howCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  howLabel: { fontSize: 12, fontWeight: '800' },
  howText: { fontSize: 13, lineHeight: 18, color: colors.text, fontWeight: '600' },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 'auto' },
  sheetSolo: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  sheetVs: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  soloText: { fontWeight: '800', fontSize: 15 },
  challengeText: { fontWeight: '800', fontSize: 15, color: colors.white },
});
