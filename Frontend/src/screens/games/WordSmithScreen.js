import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { isKnownWord, wordScore } from '../../games/playUtils';
import ConfettiBurst from './hangman/ConfettiBurst';
import TimeChips from './wordsmith/TimeChips';
import { clampWordSmithTime, timeLabel } from './wordsmith/time';
import { loadWordSmithBest, saveWordSmithBest } from './wordsmith/score';
import { colors, shadowCard } from '../../theme';

const VOWELS = new Set('AEIOU');

function shuffleList(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function WordSmithScreen() {
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

  const [phase, setPhase] = useState(isMatch ? 'play' : 'setup');
  const [durationSec, setDurationSec] = useState(60);
  const [seed, setSeed] = useState('');
  const [pangram, setPangram] = useState('');
  const [answers, setAnswers] = useState([]);
  const [order, setOrder] = useState([]);
  const [picked, setPicked] = useState([]);
  const [words, setWords] = useState([]);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(60);
  const [busy, setBusy] = useState(false);
  const [best, setBest] = useState(0);
  const [toast, setToast] = useState(null);
  const [confettiOn, setConfettiOn] = useState(false);
  const [lastGain, setLastGain] = useState(0);
  const pulse = useRef(new Animated.Value(1)).current;
  const started = useRef(null);
  const doneRef = useRef(false);
  const toastTimer = useRef(null);
  const dictRef = useRef(new Set());
  const scoreRef = useRef(0);
  const wordsRef = useRef([]);
  const bestRef = useRef(0);
  scoreRef.current = score;
  wordsRef.current = words;
  bestRef.current = best;

  const myBucket = match?.role === 'HOST' ? match?.state?.host : match?.state?.guest;
  const matchDuration = clampWordSmithTime(match?.state?.durationSec || match?.seed?.durationSec || 60);
  const letters = isMatch ? String(match?.state?.letterSeed || '') : seed;
  const playing = isMatch
    ? (match?.status === 'ACTIVE' && !myBucket?.finished)
    : phase === 'play';
  const shownWords = words;
  const shownScore = score;
  const clock = isMatch ? matchDuration : durationSec;
  const matchOver = isMatch && match?.status === 'FINISHED';
  const waitingOther = isMatch && myBucket?.finished && !matchOver;
  const roundOver = !playing && (phase === 'done' || waitingOther || matchOver);
  const possible = useMemo(
    () => [...new Set(answers.map((w) => String(w).toUpperCase()))]
      .sort((a, b) => b.length - a.length || a.localeCompare(b)),
    [answers],
  );
  const foundSet = useMemo(() => new Set(shownWords.map((w) => String(w).toUpperCase())), [shownWords]);
  const missed = useMemo(
    () => possible.filter((w) => !foundSet.has(w)),
    [possible, foundSet],
  );

  const flash = useCallback((type, text) => {
    setToast({ type, text });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  useEffect(() => {
    if (!isMatch || !match) return undefined;
    const list = match.seed?.answers || match.state?.answers || [];
    if (list.length) {
      setAnswers(list.map((w) => String(w).toUpperCase()));
      setPangram(String(match.seed?.pangram || match.state?.pangram || '').toUpperCase());
      dictRef.current = new Set(list.map((w) => String(w).toLowerCase()));
    }
    return undefined;
  }, [isMatch, match]);

  useEffect(() => {
    if (isMatch) return undefined;
    loadWordSmithBest(student?.studentId, durationSec).then(setBest);
    return undefined;
  }, [isMatch, student?.studentId, durationSec]);

  const startSolo = useCallback(async () => {
    try {
      setBusy(true);
      setConfettiOn(false);
      const data = await apiFetch(`/portal/games/deal?gameType=WORD_SMITH&studentId=${encodeURIComponent(student.studentId)}`, token);
      const nextSeed = String(data.letterSeed || '').toUpperCase();
      const nextAnswers = (data.answers || []).map((w) => String(w).toUpperCase());
      setSeed(nextSeed);
      setAnswers(nextAnswers);
      setPangram(String(data.pangram || '').toUpperCase());
      dictRef.current = new Set(nextAnswers.map((w) => w.toLowerCase()));
      setOrder(shuffleList(nextSeed.split('').map((_, i) => i)));
      setPicked([]);
      setWords([]);
      setScore(0);
      setLastGain(0);
      setLeft(durationSec);
      doneRef.current = false;
      started.current = Date.now();
      setPhase('play');
    } catch (err) {
      flash('error', err.message || 'Could not start. Try again.');
    } finally {
      setBusy(false);
    }
  }, [durationSec, flash, student?.studentId, token]);

  useEffect(() => {
    if (!isMatch || match?.status !== 'ACTIVE') return undefined;
    if (!started.current) {
      started.current = Date.now();
      setWords([]);
      setScore(0);
      setPicked([]);
    }
    return undefined;
  }, [isMatch, match?.status, match?.id]);

  useEffect(() => {
    if (isMatch && letters) {
      setOrder((prev) => (prev.length === letters.length ? prev : shuffleList(letters.split('').map((_, i) => i))));
    }
  }, [isMatch, letters]);

  const finish = useCallback(async () => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (!isMatch) {
      const finalScore = scoreRef.current;
      const count = wordsRef.current.length;
      setPhase('done');
      if (finalScore >= 4 || count >= 3) setConfettiOn(true);
      if (finalScore > bestRef.current) {
        setBest(finalScore);
        saveWordSmithBest(student?.studentId, durationSec, finalScore);
      }
      return;
    }
    if (myBucket && !myBucket.finished) {
      try {
        await sendAction('FINISH_TURN', {
          timeMs: Date.now() - (started.current || Date.now()),
          words: wordsRef.current,
        });
      } catch (err) {
        flash('error', err.message || 'Could not finish round.');
        doneRef.current = false;
      }
    }
  }, [durationSec, flash, isMatch, myBucket, sendAction, student?.studentId]);

  useEffect(() => {
    if (!playing) return undefined;
    const t = setInterval(() => {
      const startAt = started.current || Date.now();
      const remain = Math.max(0, clock - Math.floor((Date.now() - startAt) / 1000));
      setLeft(remain);
      if (remain <= 0) finish();
    }, 250);
    return () => clearInterval(t);
  }, [playing, clock, finish, letters]);

  useEffect(() => {
    if (matchOver && match.winnerStudentId === student?.studentId) setConfettiOn(true);
  }, [matchOver, match?.winnerStudentId, student?.studentId]);

  const used = useMemo(() => new Set(picked.map((p) => p.idx)), [picked]);
  const built = picked.map((p) => p.ch).join('');

  const tapTile = (idx) => {
    if (!playing || used.has(idx)) return;
    setPicked((prev) => [...prev, { idx, ch: letters[idx] }]);
  };

  const backspace = () => {
    if (!playing) return;
    setPicked((prev) => prev.slice(0, -1));
  };

  const clearBuild = () => {
    if (!playing) return;
    setPicked([]);
  };

  const submitWord = () => {
    const word = built;
    if (!playing) return;
    if (word.length < 3) {
      flash('error', 'Need at least 3 letters.');
      return;
    }
    if (words.includes(word)) {
      flash('error', 'Already found that one.');
      setPicked([]);
      return;
    }
    if (!isKnownWord(word, letters, dictRef.current)) {
      flash('error', 'Not on this puzzle’s list.');
      return;
    }
    const pts = wordScore(word);
    setWords((w) => [...w, word]);
    setScore((s) => s + pts);
    setLastGain(pts);
    setPicked([]);
    flash('ok', `+${pts}  ${word}`);
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1.12, duration: 140, useNativeDriver: true }),
      Animated.spring(pulse, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };

  const timerPct = clock > 0 ? Math.max(0, left / clock) : 0;
  const urgent = playing && left <= 10;
  const friendScore = isMatch
    ? (match?.role === 'HOST' ? match?.state?.guest?.totalScore : match?.state?.host?.totalScore) || 0
    : 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.hud}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backCircle}>
          <Ionicons name="chevron-back" size={22} color={colors.brandNavy} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle}>Word Smith</Text>
          <Text style={styles.topSub}>
            {isMatch ? `${timeLabel(clock)} · same tiles` : 'Tap tiles. Make real words.'}
          </Text>
        </View>
        {phase !== 'setup' || isMatch ? (
          <Animated.View style={[styles.scorePill, { transform: [{ scale: pulse }] }]}>
            <Text style={styles.scoreLabel}>SCORE</Text>
            <Text style={styles.scoreValue}>{shownScore}</Text>
            {!isMatch ? <Text style={styles.bestLabel}>best {best}</Text> : null}
          </Animated.View>
        ) : null}
      </View>

      {busy || (isMatch && loading && !match) ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#15803D" />
          <Text style={styles.loadingText}>Picking a letter set…</Text>
        </View>
      ) : (
        <View style={[styles.body, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {toast ? (
            <View style={[styles.toast, toast.type === 'ok' ? styles.toastOk : styles.toastErr]}>
              <Text style={[styles.toastText, toast.type === 'ok' ? styles.toastOkText : styles.toastErrText]}>
                {toast.text}
              </Text>
            </View>
          ) : null}

          {!isMatch && phase === 'setup' ? (
            <View style={styles.setup}>
              <Text style={styles.hero}>Anvil of words</Text>
              <Text style={styles.heroSub}>Seven tiles. Make the words this puzzle allows.</Text>
              <TimeChips value={durationSec} onChange={setDurationSec} />
              {best > 0 ? <Text style={styles.bestHint}>Best for {timeLabel(durationSec)}: {best} pts</Text> : null}
              <Pressable onPress={startSolo} disabled={busy} style={styles.playBtn}>
                <Text style={styles.playText}>Start round</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {(playing || (!isMatch && phase === 'play')) ? (
                <View style={styles.timerBlock}>
                  <View style={styles.timerRow}>
                    <Text style={[styles.timer, urgent && styles.timerHot]}>{left}s</Text>
                    {lastGain ? <Text style={styles.gainNow}>+{lastGain}</Text> : null}
                  </View>
                  <View style={styles.timerTrack}>
                    <View style={[styles.timerFill, urgent && styles.timerFillHot, { width: `${timerPct * 100}%` }]} />
                  </View>
                </View>
              ) : null}

              <View style={styles.tiles}>
                {order.map((idx) => {
                  const ch = letters[idx] || '';
                  const taken = used.has(idx);
                  const vowel = VOWELS.has(ch);
                  return (
                    <Pressable
                      key={`t${idx}`}
                      disabled={!playing || taken}
                      onPress={() => tapTile(idx)}
                      style={[
                        styles.tile,
                        vowel && styles.tileVowel,
                        taken && styles.tileUsed,
                      ]}
                    >
                      <Text style={[styles.tileText, taken && styles.tileTextUsed]}>{ch}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {playing ? (
                <View style={styles.tray}>
                  <View style={styles.builtBox}>
                    <Text style={styles.built}>{built || ' '}</Text>
                    {!built ? <Text style={styles.builtHint}>Tap letters to spell</Text> : null}
                  </View>
                  <View style={styles.trayBtns}>
                    <Pressable onPress={backspace} style={styles.iconBtn}>
                      <Ionicons name="backspace-outline" size={22} color={colors.brandNavy} />
                    </Pressable>
                    <Pressable onPress={clearBuild} style={styles.iconBtn}>
                      <Ionicons name="close" size={22} color={colors.brandNavy} />
                    </Pressable>
                    <Pressable onPress={() => setOrder(shuffleList(order))} style={styles.iconBtn}>
                      <Ionicons name="shuffle-outline" size={22} color={colors.brandNavy} />
                    </Pressable>
                    <Pressable onPress={submitWord} style={styles.addBtn}>
                      <Text style={styles.addText}>Add</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}

              {playing || !roundOver ? (
                <ScrollView style={styles.foundWrap} contentContainerStyle={styles.found} showsVerticalScrollIndicator={false}>
                  {shownWords.length ? shownWords.map((w) => (
                    <View key={w} style={styles.chip}>
                      <Text style={styles.chipWord}>{w}</Text>
                      <Text style={styles.chipPts}>+{wordScore(w)}</Text>
                    </View>
                  )) : (
                    <Text style={styles.empty}>Words you find land here.</Text>
                  )}
                </ScrollView>
              ) : (
                <ScrollView style={styles.foundWrap} contentContainerStyle={styles.review} showsVerticalScrollIndicator={false}>
                  {matchOver ? (
                    <View style={[styles.resultCard, shadowCard]}>
                      <Text style={styles.resultTitle}>
                        {match.winnerStudentId === student.studentId
                          ? 'You win!'
                          : match.winnerStudentId
                            ? 'Your friend wins'
                            : 'Draw'}
                      </Text>
                      <Text style={styles.resultMeta}>You {shownScore}  ·  Friend {friendScore}</Text>
                    </View>
                  ) : waitingOther ? (
                    <Text style={styles.wait}>Waiting for the other player to finish…</Text>
                  ) : phase === 'done' ? (
                    <View style={[styles.resultCard, shadowCard]}>
                      <Text style={styles.resultTitle}>Time!</Text>
                      <Text style={styles.resultMeta}>
                        {shownWords.length} words · {shownScore} pts
                        {shownScore >= best && shownScore > 0 ? '  ·  New best!' : ''}
                      </Text>
                      <View style={styles.resultBtns}>
                        <Pressable onPress={() => { setPhase('setup'); setConfettiOn(false); }} style={styles.ghostBtn}>
                          <Text style={styles.ghostText}>Change time</Text>
                        </Pressable>
                        <Pressable onPress={startSolo} style={styles.playBtnSmall}>
                          <Text style={styles.playText}>Play again</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}

                  <Text style={styles.reviewTitle}>
                    You found {foundSet.size} of {possible.length}
                  </Text>
                  {pangram ? (
                    <Text style={styles.pangramHint}>These letters spell {pangram}</Text>
                  ) : null}
                  {foundSet.size ? (
                    <>
                      <Text style={styles.reviewLabel}>You got</Text>
                      <View style={styles.found}>
                        {possible.filter((w) => foundSet.has(w)).map((w) => (
                          <View key={`g${w}`} style={styles.chip}>
                            <Text style={styles.chipWord}>{w}</Text>
                            <Text style={styles.chipPts}>+{wordScore(w)}</Text>
                          </View>
                        ))}
                      </View>
                    </>
                  ) : null}
                  {missed.length ? (
                    <>
                      <Text style={styles.reviewLabel}>Could have made</Text>
                      <View style={styles.found}>
                        {missed.map((w) => (
                          <View key={`m${w}`} style={[styles.chip, styles.chipMiss]}>
                            <Text style={[styles.chipWord, styles.chipMissWord]}>{w}</Text>
                            <Text style={styles.chipMissPts}>+{wordScore(w)}</Text>
                          </View>
                        ))}
                      </View>
                    </>
                  ) : (
                    <Text style={styles.empty}>You found every word we know for these tiles.</Text>
                  )}
                </ScrollView>
              )}

              {playing ? (
                <Pressable onPress={finish} style={styles.endBtn}>
                  <Text style={styles.endText}>End round</Text>
                </Pressable>
              ) : null}
            </>
          )}
        </View>
      )}

      <ConfettiBurst play={confettiOn} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F3F6F1' },
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  topTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  topSub: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  scorePill: {
    backgroundColor: '#14532D',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'flex-end',
    minWidth: 72,
  },
  scoreLabel: { fontSize: 9, fontWeight: '800', color: '#BBF7D0', letterSpacing: 0.5 },
  scoreValue: { fontSize: 18, fontWeight: '800', color: colors.white, marginTop: -2 },
  bestLabel: { fontSize: 10, color: '#D9F99D', fontWeight: '700' },
  body: { flex: 1, paddingHorizontal: 16, paddingBottom: 16 },
  loadingBox: { marginTop: 48, alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  loadingText: { fontWeight: '700', color: colors.textMuted, textAlign: 'center' },
  toast: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  toastOk: { backgroundColor: '#DCFCE7' },
  toastErr: { backgroundColor: '#FEE2E2' },
  toastText: { fontWeight: '800', textAlign: 'center', fontSize: 15 },
  toastOkText: { color: '#166534' },
  toastErrText: { color: '#B91C1C' },
  setup: { flex: 1, justifyContent: 'center', gap: 16, paddingBottom: 24 },
  hero: { fontSize: 28, fontWeight: '800', color: '#14532D', textAlign: 'center' },
  heroSub: { fontSize: 15, color: colors.textMuted, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  bestHint: { textAlign: 'center', fontWeight: '700', color: '#15803D' },
  playBtn: {
    alignSelf: 'center',
    backgroundColor: '#15803D',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  playBtnSmall: {
    backgroundColor: '#15803D',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  playText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  timerBlock: { marginBottom: 12 },
  timerRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  timer: { fontSize: 28, fontWeight: '800', color: '#14532D' },
  timerHot: { color: '#DC2626' },
  gainNow: { fontSize: 18, fontWeight: '800', color: '#15803D' },
  timerTrack: { height: 8, borderRadius: 999, backgroundColor: '#DCE7D8', overflow: 'hidden', marginTop: 6 },
  timerFill: { height: '100%', backgroundColor: '#15803D', borderRadius: 999 },
  timerFillHot: { backgroundColor: '#DC2626' },
  tiles: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  tile: {
    width: 48,
    height: 58,
    borderRadius: 12,
    backgroundColor: '#FFFBF0',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#C9A020',
    borderWidth: 1,
    borderColor: '#E8DFC8',
  },
  tileVowel: { backgroundColor: '#FFF8DC' },
  tileUsed: { opacity: 0.28 },
  tileText: { fontSize: 22, fontWeight: '800', color: colors.brandNavy },
  tileTextUsed: { color: colors.textMuted },
  tray: { gap: 8, marginBottom: 10 },
  builtBox: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D9E5D4',
  },
  built: { fontSize: 26, fontWeight: '800', color: colors.brandNavy, letterSpacing: 4 },
  builtHint: { position: 'absolute', color: colors.textSoft, fontWeight: '600' },
  trayBtns: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  addBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#15803D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  foundWrap: { flex: 1 },
  found: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 8 },
  review: { paddingBottom: 20, gap: 8 },
  reviewTitle: { fontSize: 16, fontWeight: '800', color: '#14532D', marginTop: 8 },
  pangramHint: { fontSize: 14, fontWeight: '700', color: colors.brandGoldDark },
  reviewLabel: { fontSize: 12, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.4, marginTop: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECF3EE',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipMiss: { backgroundColor: '#F1F5F9' },
  chipWord: { fontWeight: '800', color: '#14532D', fontSize: 14 },
  chipPts: { fontWeight: '700', color: '#15803D', fontSize: 12 },
  chipMissWord: { color: colors.textMuted },
  chipMissPts: { fontWeight: '700', color: colors.textSoft, fontSize: 12 },
  empty: { color: colors.textMuted, fontWeight: '600' },
  endBtn: { alignSelf: 'center', padding: 10 },
  endText: { color: colors.textMuted, fontWeight: '700' },
  resultCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  resultTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  resultMeta: { fontSize: 15, fontWeight: '600', color: colors.textMuted, textAlign: 'center' },
  resultBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  ghostBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  ghostText: { fontWeight: '800', color: colors.brandNavy },
  wait: { textAlign: 'center', color: colors.textMuted, fontWeight: '600', marginTop: 8 },
});
