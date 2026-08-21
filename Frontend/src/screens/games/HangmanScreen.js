import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../config/api';
import { useGameMatch } from '../../hooks/useGameMatch';
import HangmanHero from './hangman/HangmanHero';
import ConfettiBurst from './hangman/ConfettiBurst';
import { hangmanPoints, loadHangmanBest, saveHangmanBest } from './hangman/score';
import { colors } from '../../theme';

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function HangmanScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { student, token } = useAuth();
  const isMatch = route.params?.mode === 'match';
  const { match, sendAction, loading } = useGameMatch(
    route.params?.matchId,
    token,
    student?.studentId,
    { enabled: isMatch },
  );

  const [word, setWord] = useState('');
  const [hint, setHint] = useState('');
  const [subject, setSubject] = useState('');
  const [revealed, setRevealed] = useState([]);
  const [wrong, setWrong] = useState([]);
  const [lives, setLives] = useState(6);
  const [hintUsed, setHintUsed] = useState(false);
  const [busy, setBusy] = useState(!isMatch);
  const [runScore, setRunScore] = useState(0);
  const [best, setBest] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastGain, setLastGain] = useState(0);
  const [confettiOn, setConfettiOn] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadHangmanBest(student?.studentId).then(setBest);
  }, [student?.studentId]);

  const dealWord = useCallback(async () => {
    try {
      setBusy(true);
      setConfettiOn(false);
      const deal = await apiFetch(`/portal/games/deal?gameType=HANGMAN&studentId=${encodeURIComponent(student.studentId)}`, token);
      setWord(String(deal.word || '').toUpperCase());
      setHint(deal.hint || '');
      setSubject(deal.subject || '');
      setRevealed([]);
      setWrong([]);
      setLives(6);
      setHintUsed(false);
      setLastGain(0);
    } catch (err) {
      Alert.alert('Could not start', err.message);
    } finally {
      setBusy(false);
    }
  }, [student?.studentId, token]);

  useEffect(() => {
    if (!isMatch) dealWord();
  }, [isMatch, dealWord]);

  const display = useMemo(() => {
    if (isMatch && match) {
      const won = match.status === 'FINISHED' && match.winnerStudentId === match.guestStudentId;
      const lost = match.status === 'FINISHED' && !won;
      return {
        word: match.state.word || '',
        lives: match.state.remainingLives,
        hint: match.state.hintText,
        hintUsed: match.state.hintUsed,
        revealed: match.state.revealedLetters || [],
        wrong: match.state.wrongLetters || [],
        subject: match.seed?.subject,
        finished: match.status === 'FINISHED',
        won,
        lost,
        canGuess: match.role === 'GUEST' && match.status === 'ACTIVE',
      };
    }
    const letters = word.replace(/[^A-Z]/g, '');
    const won = !!letters && [...letters].every((ch) => revealed.includes(ch));
    const lost = lives <= 0;
    return {
      word,
      lives,
      hint: hintUsed ? hint : null,
      hintUsed,
      revealed,
      wrong,
      subject,
      finished: won || lost,
      won,
      lost,
      canGuess: !!word && !won && !lost,
    };
  }, [isMatch, match, word, hint, subject, revealed, wrong, lives, hintUsed]);

  useEffect(() => {
    if (display.won) setConfettiOn(true);
  }, [display.won]);

  const celebrate = (pts, nextRun) => {
    setLastGain(pts);
    setRunScore(nextRun);
    setStreak((s) => s + 1);
    setConfettiOn(true);
    if (nextRun > best) {
      setBest(nextRun);
      saveHangmanBest(student?.studentId, nextRun);
    }
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1.12, duration: 160, useNativeDriver: true }),
      Animated.spring(pulse, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };

  const guess = async (letter) => {
    if (!display.canGuess) return;
    if (display.revealed.includes(letter) || display.wrong.includes(letter)) return;
    if (isMatch) {
      try {
        await sendAction('GUESS_LETTER', { letter });
      } catch (err) {
        Alert.alert('Guess failed', err.message);
      }
      return;
    }

    if (word.includes(letter)) {
      const nextRevealed = [...revealed, letter];
      setRevealed(nextRevealed);
      const letters = word.replace(/[^A-Z]/g, '');
      const won = [...letters].every((ch) => nextRevealed.includes(ch));
      if (won) {
        const pts = hangmanPoints({ word, lives, streak });
        celebrate(pts, runScore + pts);
      }
    } else {
      const nextLives = lives - 1;
      setWrong((prev) => [...prev, letter]);
      setLives(nextLives);
      if (nextLives <= 0) {
        setStreak(0);
        if (runScore > best) {
          setBest(runScore);
          saveHangmanBest(student?.studentId, runScore);
        }
      }
    }
  };

  const useHint = async () => {
    if (display.hintUsed) return;
    if (isMatch) {
      try { await sendAction('USE_HINT'); } catch (err) { Alert.alert('Hint failed', err.message); }
      return;
    }
    setHintUsed(true);
  };

  const restartRun = () => {
    setRunScore(0);
    setStreak(0);
    setLastGain(0);
    dealWord();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle}>Save the Scout</Text>
          <Text style={styles.topSub}>{display.subject || (isMatch ? 'Challenge' : 'Hangman')}</Text>
        </View>
        {!isMatch ? (
          <Animated.View style={[styles.scorePill, { transform: [{ scale: pulse }] }]}>
            <Text style={styles.scoreLabel}>Score</Text>
            <Text style={styles.scoreValue}>{runScore}</Text>
            <Text style={styles.bestLabel}>Best {best}</Text>
          </Animated.View>
        ) : null}
      </View>

      {busy || (isMatch && loading && !match) ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.brandNavy} />
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.hearts}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Ionicons
                key={i}
                name={i < display.lives ? 'heart' : 'heart-outline'}
                size={24}
                color={i < display.lives ? '#E11D48' : colors.border}
              />
            ))}
            {streak > 1 ? <Text style={styles.streak}>🔥 {streak} streak</Text> : null}
          </View>

          <HangmanHero lives={display.lives} won={!!display.won} lost={!!display.lost} />

          <View style={styles.wordRow}>
            {(display.word || '').split('').map((ch, i) => {
              if (ch === ' ') return <View key={`s${i}`} style={{ width: 10 }} />;
              const show = display.revealed.includes(ch) || display.finished;
              return (
                <View key={`${ch}${i}`} style={[styles.letterBox, show && styles.letterBoxOn]}>
                  <Text style={styles.letter}>{show ? ch : ''}</Text>
                </View>
              );
            })}
          </View>

          {display.hint ? (
            <View style={styles.hintCard}>
              <Ionicons name="bulb" size={26} color={colors.brandGoldDark} />
              <Text style={styles.hintText}>{display.hint}</Text>
            </View>
          ) : !display.finished ? (
            <Pressable onPress={useHint} style={styles.hintBtn}>
              <Ionicons name="bulb-outline" size={26} color={colors.brandGoldDark} />
              <Text style={styles.hintBtnText}>Need a hint?</Text>
            </Pressable>
          ) : null}

          {display.finished ? (
            <View style={[styles.resultCard, display.won ? styles.resultWin : styles.resultLose]}>
              <Text style={styles.resultTitle}>
                {isMatch
                  ? (display.won ? 'You saved them!' : 'So close')
                  : display.won ? 'You saved them!' : 'Oh no — they slipped away'}
              </Text>
              {display.won && lastGain ? (
                <Text style={styles.gain}>+{lastGain} points</Text>
              ) : null}
              <Text style={styles.resultWord}>{display.word}</Text>
              {!isMatch && display.won ? (
                <>
                  <Text style={styles.resultMeta}>Run {runScore} · Best {best}{runScore >= best && runScore > 0 ? '  ★ New best!' : ''}</Text>
                  <Pressable onPress={dealWord} style={styles.againBtn}>
                    <Text style={styles.againText}>Next word</Text>
                  </Pressable>
                </>
              ) : null}
              {!isMatch && display.lost ? (
                <>
                  <Text style={styles.resultMeta}>Run ended at {runScore} · Best {best}</Text>
                  <Pressable onPress={restartRun} style={styles.againBtn}>
                    <Text style={styles.againText}>Try again</Text>
                  </Pressable>
                </>
              ) : null}
            </View>
          ) : (
            <View style={styles.keys}>
              {ALPHA.map((letter) => {
                const used = display.revealed.includes(letter) || display.wrong.includes(letter);
                const good = display.revealed.includes(letter);
                return (
                  <Pressable
                    key={letter}
                    disabled={used || !display.canGuess}
                    onPress={() => guess(letter)}
                    style={({ pressed }) => [
                      styles.key,
                      used && (good ? styles.keyGood : styles.keyBad),
                      pressed && !used && styles.keyPressed,
                    ]}
                  >
                    <Text style={[styles.keyText, used && { color: colors.white }]}>{letter}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      <ConfettiBurst play={confettiOn && !!display.won} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F3F6FB' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backBtn: { marginRight: 6 },
  topTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  topSub: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  scorePill: {
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'flex-end',
    minWidth: 72,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  scoreLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted },
  scoreValue: { fontSize: 18, fontWeight: '800', color: colors.brandNavy, marginTop: -2 },
  bestLabel: { fontSize: 10, color: colors.brandGoldDark, fontWeight: '700' },
  body: { alignItems: 'center', paddingHorizontal: 12, paddingBottom: 28 },
  hearts: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  streak: { marginLeft: 8, fontWeight: '800', color: colors.orange, fontSize: 15 },
  wordRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 6, marginBottom: 14 },
  letterBox: {
    minWidth: 34,
    height: 46,
    borderBottomWidth: 3,
    borderBottomColor: colors.brandNavy,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  letterBoxOn: { borderBottomColor: colors.brandGold },
  letter: { fontSize: 28, fontWeight: '800', color: colors.brandNavy },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.yellowMuted,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    width: '100%',
  },
  hintText: { flex: 1, color: colors.text, fontWeight: '700', fontSize: 18, lineHeight: 24 },
  hintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.yellowMuted,
    paddingHorizontal: 22,
    paddingVertical: 16,
    minHeight: 56,
    borderRadius: 18,
    marginBottom: 12,
    width: '100%',
  },
  hintBtnText: { color: colors.brandGoldDark, fontWeight: '800', fontSize: 18 },
  keys: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 8 },
  key: {
    width: 40,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  keyPressed: { transform: [{ scale: 0.94 }], backgroundColor: colors.brandNavyMuted },
  keyGood: { backgroundColor: colors.green, borderColor: colors.green },
  keyBad: { backgroundColor: '#CBD5E1', borderColor: '#CBD5E1' },
  keyText: { fontWeight: '800', color: colors.brandNavy, fontSize: 18 },
  resultCard: {
    width: '100%',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  resultWin: { backgroundColor: '#ECFDF5' },
  resultLose: { backgroundColor: '#FEF2F2' },
  resultTitle: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' },
  gain: { fontSize: 22, fontWeight: '800', color: colors.green },
  resultWord: { fontSize: 16, fontWeight: '800', color: colors.brandNavy, letterSpacing: 2 },
  resultMeta: { fontSize: 13, color: colors.textMuted, fontWeight: '600', textAlign: 'center' },
  againBtn: {
    marginTop: 8,
    backgroundColor: colors.brandNavy,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  againText: { color: colors.white, fontWeight: '800' },
});
