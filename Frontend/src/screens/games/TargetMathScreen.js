import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { evalTargetExpression, peekTargetValue } from '../../games/playUtils';
import ConfettiBurst from './hangman/ConfettiBurst';
import { ChipRow } from './tictac/chips';
import TargetHero from './targetmath/TargetHero';
import { MATH_DIFFS, MATH_TIMES } from './targetmath/chips';
import { loadMathBest, mathScore, saveMathBest } from './targetmath/score';
import { colors, shadowCard } from '../../theme';

const OPS = [
  { op: '+', color: '#15803D' },
  { op: '−', value: '-', color: '#C2410C' },
  { op: '×', color: '#1B4480' },
  { op: '÷', color: '#A07C10' },
];

export default function TargetMathScreen() {
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
  const [difficulty, setDifficulty] = useState('medium');
  const [durationSec, setDurationSec] = useState(60);
  const [tiles, setTiles] = useState([]);
  const [target, setTarget] = useState(0);
  const [hint, setHint] = useState('');
  const [used, setUsed] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [left, setLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [result, setResult] = useState(null);
  const [hintOn, setHintOn] = useState(false);
  const [confettiOn, setConfettiOn] = useState(false);
  const started = useRef(Date.now());
  const doneRef = useRef(false);
  const toastTimer = useRef(null);

  const flash = useCallback((type, text) => {
    setToast({ type, text });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  useEffect(() => {
    if (isMatch) return undefined;
    loadMathBest(student?.studentId, difficulty).then(setBest);
    return undefined;
  }, [difficulty, isMatch, student?.studentId]);

  const applyPuzzle = (data, clock) => {
    setTiles(data.tiles || data.numberTiles || []);
    setTarget(data.target ?? data.targetValue ?? 0);
    setHint(String(data.hint || ''));
    setUsed([]);
    setTokens([]);
    setResult(null);
    setHintOn(false);
    setScore(0);
    setConfettiOn(false);
    doneRef.current = false;
    started.current = Date.now();
    setLeft(clock || 0);
    setPhase('play');
  };

  const loadSolo = useCallback(async () => {
    try {
      setBusy(true);
      const q = new URLSearchParams({
        gameType: 'TARGET_MATH',
        studentId: student.studentId,
        difficulty,
      });
      const data = await apiFetch(`/portal/games/deal?${q.toString()}`, token);
      applyPuzzle(data, durationSec);
    } catch (err) {
      flash('error', err.message || 'Could not start. Try again.');
    } finally {
      setBusy(false);
    }
  }, [difficulty, durationSec, flash, student?.studentId, token]);

  useEffect(() => {
    if (!isMatch || !match?.state?.numberTiles) return undefined;
    applyPuzzle({
      tiles: match.state.numberTiles,
      target: match.state.targetValue,
      hint: match.state.hint || match.seed?.hint,
    }, match.state.durationSec || match.seed?.durationSec || 0);
    return undefined;
  }, [isMatch, match?.id]);

  const displayTiles = isMatch ? (match?.state?.numberTiles || tiles) : tiles;
  const displayTarget = isMatch ? (match?.state?.targetValue || target) : target;
  const clock = isMatch ? (match?.state?.durationSec || match?.seed?.durationSec || 0) : durationSec;
  const myBucket = match?.role === 'HOST' ? match?.state?.host : match?.state?.guest;
  const friendBucket = match?.role === 'HOST' ? match?.state?.guest : match?.state?.host;
  const mySolved = isMatch ? !!myBucket?.expression : phase === 'done';
  const matchOver = isMatch && match?.status === 'FINISHED';
  const playing = !mySolved && !matchOver && phase === 'play';
  const last = tokens[tokens.length - 1];
  const canNum = playing && (tokens.length === 0 || typeof last !== 'number');
  const canOp = playing && typeof last === 'number';
  const live = useMemo(
    () => peekTargetValue(tokens, displayTiles),
    [tokens, displayTiles],
  );
  const away = live == null ? null : Math.abs(live - displayTarget);
  const onTarget = away === 0;

  const finishSolo = useCallback((hit, value, steps, leftover, reason) => {
    if (doneRef.current) return;
    doneRef.current = true;
    const pts = mathScore({ hit, steps, leftover });
    setScore(pts);
    setResult({ hit, value, steps, leftover, reason });
    setPhase('done');
    if (hit) {
      setConfettiOn(true);
      flash('ok', 'Bullseye!');
      if (pts > best) {
        setBest(pts);
        saveMathBest(student?.studentId, difficulty, pts);
      }
    } else {
      flash('error', reason || (value == null ? 'Time’s up.' : `Got ${value} — ${Math.abs(value - displayTarget)} away.`));
    }
  }, [best, difficulty, displayTarget, flash, student?.studentId]);

  const submit = useCallback(async (fromTimer) => {
    if (doneRef.current) return;
    const timeMs = Date.now() - started.current;
    if (isMatch) {
      try {
        doneRef.current = true;
        let payload = tokens;
        if (fromTimer) {
          try {
            if (!tokens.length) payload = [];
            else evalTargetExpression(tokens, displayTiles);
          } catch {
            payload = [];
          }
        }
        await sendAction('SUBMIT_SOLUTION', { tokens: payload, timeMs });
      } catch (err) {
        doneRef.current = false;
        flash('error', err.message || 'Could not send that.');
      }
      return;
    }
    if (fromTimer) {
      try {
        const out = evalTargetExpression(tokens, displayTiles);
        finishSolo(out.value === displayTarget, out.value, out.steps, out.leftover?.length || 0, 'Time’s up.');
      } catch {
        finishSolo(false, null, 99, displayTiles.length, 'Time’s up.');
      }
      return;
    }
    if (!tokens.length) {
      flash('error', 'Build something first.');
      return;
    }
    try {
      const out = evalTargetExpression(tokens, displayTiles);
      if (out.value === displayTarget) {
        finishSolo(true, out.value, out.steps, out.leftover?.length || 0);
      } else {
        flash('error', `Got ${out.value} — ${Math.abs(out.value - displayTarget)} away. Undo and try again.`);
      }
    } catch (err) {
      flash('error', err.message || 'That expression is not finished.');
    }
  }, [displayTarget, displayTiles, finishSolo, flash, isMatch, sendAction, tokens]);

  useEffect(() => {
    if (!playing || !clock) return undefined;
    const t = setInterval(() => {
      const remain = Math.max(0, clock - Math.floor((Date.now() - started.current) / 1000));
      setLeft(remain);
      if (remain <= 0) submit(true);
    }, 250);
    return () => clearInterval(t);
  }, [playing, clock, submit]);

  useEffect(() => {
    if (matchOver && match.winnerStudentId === student?.studentId) setConfettiOn(true);
  }, [matchOver, match?.winnerStudentId, student?.studentId]);

  const pushNum = (n, idx) => {
    if (!canNum || used.includes(idx)) return;
    setTokens((t) => [...t, n]);
    setUsed((u) => [...u, idx]);
  };
  const pushOp = (op) => {
    if (!canOp) return;
    setTokens((t) => [...t, op]);
  };
  const undo = () => {
    if (!playing || !tokens.length) return;
    const lastTok = tokens[tokens.length - 1];
    setTokens((t) => t.slice(0, -1));
    if (typeof lastTok === 'number') setUsed((u) => u.slice(0, -1));
  };
  const clearAll = () => {
    if (!playing) return;
    setTokens([]);
    setUsed([]);
  };

  const timerPct = clock > 0 ? Math.max(0, left / clock) : 1;
  const urgent = playing && clock > 0 && left <= 8;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.hud}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backCircle}>
          <Ionicons name="chevron-back" size={22} color={colors.brandNavy} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle}>Target Math</Text>
          <Text style={styles.topSub}>
            {isMatch ? 'Same tiles. Fewer steps wins.' : 'Tap numbers, then +, −, ×, ÷'}
          </Text>
        </View>
        {phase !== 'setup' || isMatch ? (
          <View style={styles.scorePill}>
            <Text style={styles.scoreLabel}>{isMatch ? 'YOU' : 'SCORE'}</Text>
            <Text style={styles.scoreValue}>{isMatch ? (myBucket?.hit ? myBucket.steps : '—') : score}</Text>
            {!isMatch ? <Text style={styles.bestLabel}>best {best}</Text> : null}
          </View>
        ) : null}
      </View>

      {busy || (isMatch && loading && !match) ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#A07C10" />
          <Text style={styles.loadingText}>Finding a solvable puzzle…</Text>
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
            <ScrollView contentContainerStyle={styles.setup} showsVerticalScrollIndicator={false}>
              <Text style={styles.hero}>Hit the target</Text>
              <Text style={styles.heroSub}>Five number tiles. Build in the order you tap. You don’t have to use every tile.</Text>
              <ChipRow title="How hard?" items={MATH_DIFFS} value={difficulty} onChange={setDifficulty} />
              <ChipRow title="Clock?" items={MATH_TIMES} value={durationSec} onChange={setDurationSec} />
              {best > 0 ? <Text style={styles.bestHint}>Best for {difficulty}: {best} pts</Text> : null}
              <Pressable onPress={loadSolo} style={styles.playBtn}>
                <Text style={styles.playText}>Start puzzle</Text>
              </Pressable>
            </ScrollView>
          ) : (
            <>
              {playing && clock > 0 ? (
                <View style={styles.timerBlock}>
                  <Text style={[styles.timer, urgent && styles.timerHot]}>{left}s</Text>
                  <View style={styles.timerTrack}>
                    <View style={[styles.timerFill, urgent && styles.timerFillHot, { width: `${timerPct * 100}%` }]} />
                  </View>
                </View>
              ) : null}

              <TargetHero value={displayTarget} hot={onTarget} />
              <Text style={styles.live}>
                {live == null
                  ? (tokens.length ? 'Keep going…' : 'Make this number')
                  : onTarget
                    ? `${live}  ·  on target!`
                    : `${live}  ·  ${away} away`}
              </Text>
              <View style={styles.exprBox}>
                <Text style={styles.expr}>{tokens.length ? tokens.join(' ') : 'Tap a number to start'}</Text>
              </View>

              <View style={styles.row}>
                {displayTiles.map((n, i) => (
                  <Pressable
                    key={`${n}-${i}`}
                    disabled={!canNum || used.includes(i)}
                    onPress={() => pushNum(n, i)}
                    style={[styles.tile, used.includes(i) && styles.tileUsed]}
                  >
                    <Text style={[styles.tileText, used.includes(i) && styles.tileTextUsed]}>{n}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.row}>
                {OPS.map((item) => (
                  <Pressable
                    key={item.op}
                    disabled={!canOp}
                    onPress={() => pushOp(item.value || item.op)}
                    style={[styles.op, { borderColor: item.color }, !canOp && { opacity: 0.4 }]}
                  >
                    <Text style={[styles.opText, { color: item.color }]}>{item.op}</Text>
                  </Pressable>
                ))}
              </View>

              {playing ? (
                <View style={styles.row}>
                  <Pressable onPress={undo} style={styles.iconBtn}>
                    <Ionicons name="arrow-undo-outline" size={20} color={colors.brandNavy} />
                  </Pressable>
                  <Pressable onPress={clearAll} style={styles.iconBtn}>
                    <Ionicons name="close" size={20} color={colors.brandNavy} />
                  </Pressable>
                  {hint ? (
                    <Pressable onPress={() => setHintOn(true)} style={styles.iconBtn}>
                      <Ionicons name="bulb-outline" size={20} color="#A07C10" />
                    </Pressable>
                  ) : null}
                  <Pressable onPress={() => submit(false)} style={[styles.checkBtn, onTarget && styles.checkHot]}>
                    <Text style={styles.checkText}>Check</Text>
                  </Pressable>
                </View>
              ) : null}

              {hintOn && hint ? <Text style={styles.hint}>{hint}</Text> : null}

              <View style={[styles.sheet, shadowCard]}>
                {matchOver || (!isMatch && phase === 'done') ? (
                  <View style={styles.resultCard}>
                    <Text style={styles.resultTitle}>
                      {matchOver
                        ? (match.winnerStudentId === student.studentId
                          ? 'You win!'
                          : match.winnerStudentId
                            ? 'Your friend wins'
                            : 'Draw')
                        : result?.hit
                          ? 'Bullseye!'
                          : 'So close'}
                    </Text>
                    {!isMatch && result ? (
                      <>
                        <Text style={styles.resultMeta}>
                          {result.hit
                            ? `${result.steps} step${result.steps === 1 ? '' : 's'} · ${score} pts`
                            : result.value == null
                              ? (result.reason || 'No answer')
                              : `Got ${result.value}, target ${displayTarget}`}
                        </Text>
                        {score >= best && result.hit ? <Text style={styles.bestHint}>New best!</Text> : null}
                        <View style={styles.resultBtns}>
                          <Pressable onPress={() => { setPhase('setup'); setConfettiOn(false); }} style={styles.ghostBtn}>
                            <Text style={styles.ghostText}>Settings</Text>
                          </Pressable>
                          <Pressable onPress={loadSolo} style={styles.playBtnSmall}>
                            <Text style={styles.playText}>New puzzle</Text>
                          </Pressable>
                        </View>
                      </>
                    ) : null}
                    {matchOver ? (
                      <Text style={styles.resultMeta}>
                        You {myBucket?.hit ? `hit in ${myBucket.steps}` : 'missed'}
                        {'  ·  '}
                        Friend {friendBucket?.hit ? `hit in ${friendBucket.steps}` : 'missed'}
                      </Text>
                    ) : null}
                  </View>
                ) : isMatch && mySolved ? (
                  <Text style={styles.wait}>Waiting for the other player…</Text>
                ) : (
                  <Text style={styles.wait}>Calculated in the order you tap. Whole numbers only.</Text>
                )}
              </View>
            </>
          )}
        </View>
      )}
      <ConfettiBurst play={confettiOn} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F0E0' },
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
    backgroundColor: '#7A5E0A',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'flex-end',
    minWidth: 72,
  },
  scoreLabel: { fontSize: 9, fontWeight: '800', color: '#FDE68A', letterSpacing: 0.5 },
  scoreValue: { fontSize: 18, fontWeight: '800', color: colors.white, marginTop: -2 },
  bestLabel: { fontSize: 10, color: '#FEF3C7', fontWeight: '700' },
  body: { flex: 1, paddingHorizontal: 16, alignItems: 'center', gap: 8 },
  loadingBox: { marginTop: 48, alignItems: 'center', gap: 12 },
  loadingText: { fontWeight: '700', color: colors.textMuted },
  toast: { width: '100%', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14 },
  toastOk: { backgroundColor: '#DCFCE7' },
  toastErr: { backgroundColor: '#FEE2E2' },
  toastText: { fontWeight: '800', textAlign: 'center', fontSize: 15 },
  toastOkText: { color: '#166534' },
  toastErrText: { color: '#B91C1C' },
  setup: { width: '100%', flexGrow: 1, justifyContent: 'center', gap: 16, paddingBottom: 24 },
  hero: { fontSize: 28, fontWeight: '800', color: '#7A5E0A', textAlign: 'center' },
  heroSub: { fontSize: 15, color: colors.textMuted, fontWeight: '600', textAlign: 'center' },
  bestHint: { textAlign: 'center', fontWeight: '700', color: '#A07C10' },
  playBtn: {
    alignSelf: 'center',
    backgroundColor: '#A07C10',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
  },
  playBtnSmall: {
    backgroundColor: '#A07C10',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  playText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  timerBlock: { width: '100%', marginBottom: 2 },
  timer: { fontSize: 22, fontWeight: '800', color: '#7A5E0A' },
  timerHot: { color: '#DC2626' },
  timerTrack: { height: 7, borderRadius: 999, backgroundColor: '#E8DFC8', overflow: 'hidden', marginTop: 4 },
  timerFill: { height: '100%', backgroundColor: '#A07C10', borderRadius: 999 },
  timerFillHot: { backgroundColor: '#DC2626' },
  live: { fontWeight: '800', color: '#7A5E0A', fontSize: 16 },
  exprBox: {
    width: '100%',
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#E8DFC8',
  },
  expr: { fontSize: 22, fontWeight: '800', color: colors.brandNavy, textAlign: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', alignItems: 'center' },
  tile: {
    minWidth: 56,
    height: 56,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#C9A020',
    borderWidth: 1,
    borderColor: '#E8DFC8',
  },
  tileUsed: { opacity: 0.28 },
  tileText: { fontSize: 20, fontWeight: '800', color: colors.brandNavy },
  tileTextUsed: { color: colors.textMuted },
  op: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  opText: { fontSize: 24, fontWeight: '800' },
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
  checkBtn: {
    flexGrow: 1,
    minWidth: 120,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#A07C10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkHot: { backgroundColor: '#15803D' },
  checkText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  hint: { fontWeight: '700', color: '#A07C10', textAlign: 'center', paddingHorizontal: 8 },
  sheet: {
    width: '100%',
    flex: 1,
    minHeight: 88,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 14,
    marginTop: 4,
  },
  wait: { textAlign: 'center', color: colors.textMuted, fontWeight: '700' },
  resultCard: { alignItems: 'center', gap: 6 },
  resultTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  resultMeta: { fontWeight: '600', color: colors.textMuted, textAlign: 'center' },
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
});
