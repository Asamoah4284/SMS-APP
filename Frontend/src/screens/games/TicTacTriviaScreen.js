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
import { aiAnswersCorrect, aiPickCell, boardWinner, findWinningLine } from '../../games/tttAi';
import ConfettiBurst from './hangman/ConfettiBurst';
import TicTacBoard from './tictac/Board';
import { ChipRow, TTT_DIFFS, TTT_SUBJECTS } from './tictac/chips';
import { loadTttStats, saveTttStats, tttRoundScore } from './tictac/score';
import { colors, shadowCard } from '../../theme';

const LETTERS = ['A', 'B', 'C', 'D'];
const LETTER_COLORS = ['#1B4480', '#A07C10', '#15803D', '#C2410C'];
const Q_SECS = 12;
const SUBJECT = {
  Science: { bg: '#ECFDF5', fg: '#15803D', icon: 'leaf-outline' },
  Maths: { bg: '#E3ECF7', fg: '#1B4480', icon: 'calculator-outline' },
  English: { bg: '#F5F0E0', fg: '#A07C10', icon: 'book-outline' },
  Social: { bg: '#FFEDD5', fg: '#C2410C', icon: 'globe-outline' },
};

export default function TicTacTriviaScreen() {
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
  const [subject, setSubject] = useState('All');
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [pending, setPending] = useState(null);
  const [rivalCell, setRivalCell] = useState(null);
  const [turn, setTurn] = useState('X');
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [picked, setPicked] = useState(null);
  const [wasCorrect, setWasCorrect] = useState(null);
  const [locked, setLocked] = useState(false);
  const [qLeft, setQLeft] = useState(Q_SECS);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [wins, setWins] = useState(0);
  const [streak, setStreak] = useState(0);
  const [confettiOn, setConfettiOn] = useState(false);
  const toastTimer = useRef(null);
  const aiTimers = useRef([]);
  const lastResultKey = useRef('');
  const pulse = useRef(new Animated.Value(1)).current;

  const flash = useCallback((type, text) => {
    setToast({ type, text });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  }, []);

  useEffect(() => () => {
    clearTimeout(toastTimer.current);
    aiTimers.current.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (isMatch) return undefined;
    loadTttStats(student?.studentId).then((s) => {
      setBest(s.best);
      setWins(s.wins);
      setStreak(s.streak);
    });
    return undefined;
  }, [isMatch, student?.studentId]);

  const finishBoard = useCallback((nextBoard, claimed) => {
    const w = boardWinner(nextBoard);
    if (!w) return false;
    const youWon = w === 'X';
    const pts = tttRoundScore(claimed, youWon);
    setScore(pts);
    setResult(w);
    setPhase('done');
    if (youWon) setConfettiOn(true);
    const nextWins = youWon ? wins + 1 : wins;
    const nextStreak = youWon ? streak + 1 : 0;
    const nextBest = Math.max(best, pts);
    setWins(nextWins);
    setStreak(nextStreak);
    setBest(nextBest);
    saveTttStats(student?.studentId, { best: nextBest, wins: nextWins, streak: nextStreak });
    return true;
  }, [best, student?.studentId, streak, wins]);

  const loadSolo = useCallback(async () => {
    try {
      setBusy(true);
      setConfettiOn(false);
      const q = new URLSearchParams({
        gameType: 'TIC_TAC_TRIVIA',
        studentId: student.studentId,
      });
      if (subject && subject !== 'All') q.set('subject', subject);
      const data = await apiFetch(`/portal/games/deal?${q.toString()}`, token);
      setQuestions(data.questions || []);
      setQIndex(0);
      setBoard(Array(9).fill(null));
      setPending(null);
      setRivalCell(null);
      setTurn('X');
      setResult(null);
      setPicked(null);
      setWasCorrect(null);
      setLocked(false);
      setScore(0);
      setPhase('play');
    } catch (err) {
      flash('error', err.message || 'Could not start. Try again.');
    } finally {
      setBusy(false);
    }
  }, [flash, student?.studentId, subject, token]);

  const playAi = useCallback((nextBoard, nextIndex, claimed) => {
    setAiBusy(true);
    flash('info', 'Rival is choosing a square…');
    const t1 = setTimeout(() => {
      const cell = aiPickCell(nextBoard, difficulty);
      if (cell == null) {
        setAiBusy(false);
        finishBoard(nextBoard, claimed);
        return;
      }
      setRivalCell(cell);
      flash('info', 'Rival is answering…');
      const t2 = setTimeout(() => {
        setRivalCell(null);
        if (aiAnswersCorrect(difficulty)) {
          const after = [...nextBoard];
          after[cell] = 'O';
          setBoard(after);
          flash('error', 'Rival claimed it.');
          if (!finishBoard(after, claimed)) setTurn('X');
        } else {
          flash('ok', 'Rival missed — still open.');
          if (!finishBoard(nextBoard, claimed)) setTurn('X');
        }
        setQIndex(nextIndex + 1);
        setAiBusy(false);
      }, 720);
      aiTimers.current.push(t2);
    }, 520);
    aiTimers.current.push(t1);
  }, [difficulty, finishBoard, flash]);

  const resolveSolo = useCallback((choiceIndex) => {
    const q = questions[qIndex % Math.max(questions.length, 1)];
    const correct = q && choiceIndex === q.answerIndex;
    const cell = pending;
    const claimed = board.filter((c) => c === 'X').length + (correct ? 1 : 0);
    setPending(null);
    setPicked(null);
    setWasCorrect(null);
    setLocked(false);
    if (cell == null) return;
    if (correct) {
      const next = [...board];
      next[cell] = 'X';
      setBoard(next);
      flash('ok', 'Yours!');
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.1, duration: 120, useNativeDriver: true }),
        Animated.spring(pulse, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();
      if (!finishBoard(next, claimed)) {
        setTurn('O');
        playAi(next, qIndex, claimed);
      }
    } else {
      flash('error', choiceIndex < 0 ? 'Time’s up — square stays open.' : 'Miss — square stays open.');
      setTurn('O');
      playAi(board, qIndex, claimed);
    }
    setQIndex((n) => n + 1);
  }, [board, finishBoard, flash, pending, playAi, pulse, qIndex, questions]);

  const onCell = (i) => {
    if (isMatch) {
      if (match?.turn !== match?.role || match?.state?.pendingCell != null || match?.status !== 'ACTIVE') return;
      sendAction('SELECT_CELL', { index: i }).catch((err) => flash('error', err.message || 'Could not pick that square.'));
      return;
    }
    if (phase !== 'play' || result || turn !== 'X' || aiBusy || board[i] || pending != null) return;
    setPending(i);
    setPicked(null);
    setWasCorrect(null);
    setLocked(false);
    setQLeft(Q_SECS);
  };

  const onAnswer = (choiceIndex) => {
    if (locked) return;
    if (isMatch) {
      setLocked(true);
      sendAction('ANSWER', { choiceIndex }).catch((err) => {
        setLocked(false);
        flash('error', err.message || 'Could not send that answer.');
      });
      return;
    }
    const q = questions[qIndex % Math.max(questions.length, 1)];
    setPicked(choiceIndex);
    setWasCorrect(q && choiceIndex === q.answerIndex);
    setLocked(true);
    const t = setTimeout(() => resolveSolo(choiceIndex), 620);
    aiTimers.current.push(t);
  };

  const displayBoard = isMatch ? (match?.state?.board || Array(9).fill(null)) : board;
  const question = isMatch
    ? match?.state?.currentQuestion
    : (pending != null ? questions[qIndex % Math.max(questions.length, 1)] : null);
  const pendingCell = isMatch ? match?.state?.pendingCell : pending;
  const answering = !!question;
  const myBoardTurn = isMatch
    ? match?.status === 'ACTIVE' && match?.turn === match?.role && !answering
    : phase === 'play' && turn === 'X' && !result && !aiBusy && pending == null;
  const finished = isMatch ? match?.status === 'FINISHED' : phase === 'done';
  const winLine = useMemo(() => findWinningLine(displayBoard), [displayBoard]);
  const myMark = isMatch ? (match?.role === 'HOST' ? 'X' : 'O') : 'X';
  const theirName = isMatch
    ? (match?.role === 'HOST' ? (match?.guestName || 'Friend') : (match?.hostName || 'Host'))
    : 'Rival';
  const claimed = displayBoard.filter((c) => c === myMark).length;
  const subjectMeta = SUBJECT[question?.subject] || { bg: colors.brandNavyMuted, fg: colors.brandNavy, icon: 'school-outline' };

  useEffect(() => {
    if (!answering || finished || locked) return undefined;
    setQLeft(Q_SECS);
    const t = setInterval(() => {
      setQLeft((n) => {
        if (n <= 1) {
          clearInterval(t);
          onAnswer(-1);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answering, question?.id, question?.prompt, finished, locked]);

  useEffect(() => {
    if (!isMatch) return undefined;
    setLocked(false);
    return undefined;
  }, [isMatch, match?.state?.currentQuestion?.id, match?.turn]);

  useEffect(() => {
    const last = match?.state?.lastQuestionResult;
    if (!last) return undefined;
    const key = `${last.cell}-${last.player}-${last.correct}-${match?.state?.questionCursor}`;
    if (lastResultKey.current === key) return undefined;
    lastResultKey.current = key;
    const mine = last.player === match.role;
    if (last.correct) flash('ok', mine ? 'You claimed it!' : 'They claimed that square.');
    else flash('error', mine ? 'Miss — square stays open.' : 'They missed — still open.');
    return undefined;
  }, [flash, isMatch, match?.role, match?.state?.lastQuestionResult, match?.state?.questionCursor]);

  useEffect(() => {
    if (isMatch && match?.status === 'FINISHED' && match.winnerStudentId === student?.studentId) {
      setConfettiOn(true);
    }
  }, [isMatch, match?.status, match?.winnerStudentId, student?.studentId]);

  const choiceStyle = (i) => {
    if (picked == null || isMatch) return [styles.choice];
    const right = questions[qIndex % Math.max(questions.length, 1)]?.answerIndex;
    if (i === right) return [styles.choice, styles.choiceGood];
    if (i === picked && !wasCorrect) return [styles.choice, styles.choiceBad];
    return [styles.choice, styles.choiceDim];
  };

  const resultTitle = isMatch
    ? (match.winnerStudentId === student.studentId
      ? 'You win!'
      : match.winnerStudentId
        ? 'Your friend wins'
        : 'Draw')
    : result === 'X'
      ? 'You win!'
      : result === 'O'
        ? 'Rival wins'
        : 'Draw';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.hud}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backCircle}>
          <Ionicons name="chevron-back" size={22} color={colors.brandNavy} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle}>Tic Tac Trivia</Text>
          <Text style={styles.topSub}>
            {isMatch
              ? `${match?.turn === 'HOST' ? match?.hostName : match?.guestName}'s turn`
              : phase === 'setup'
                ? 'Claim squares with right answers'
                : `You are X · ${difficulty}`}
          </Text>
        </View>
        {phase !== 'setup' || isMatch ? (
          <Animated.View style={[styles.scorePill, { transform: [{ scale: pulse }] }]}>
            <Text style={styles.scoreLabel}>{isMatch ? 'YOU' : 'SCORE'}</Text>
            <Text style={styles.scoreValue}>{isMatch ? claimed : (phase === 'done' ? score : claimed * 10)}</Text>
            {!isMatch ? <Text style={styles.bestLabel}>best {best}</Text> : null}
          </Animated.View>
        ) : null}
      </View>

      {busy || (isMatch && loading && !match) ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#C2410C" />
          <Text style={styles.loadingText}>Shuffling questions…</Text>
        </View>
      ) : (
        <View style={[styles.body, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {toast ? (
            <View style={[
              styles.toast,
              toast.type === 'ok' ? styles.toastOk : toast.type === 'info' ? styles.toastInfo : styles.toastErr,
            ]}
            >
              <Text style={[
                styles.toastText,
                toast.type === 'ok' ? styles.toastOkText : toast.type === 'info' ? styles.toastInfoText : styles.toastErrText,
              ]}
              >
                {toast.text}
              </Text>
            </View>
          ) : null}

          {!isMatch && phase === 'setup' ? (
            <ScrollView contentContainerStyle={styles.setup} showsVerticalScrollIndicator={false}>
              <Text style={styles.hero}>Claim the board</Text>
              <Text style={styles.heroSub}>Tap a square. Get the question right and it’s yours. Miss, and it stays open.</Text>
              <ChipRow title="How sharp is the rival?" items={TTT_DIFFS} value={difficulty} onChange={setDifficulty} />
              <ChipRow title="Which questions?" items={TTT_SUBJECTS} value={subject} onChange={setSubject} />
              {wins > 0 ? <Text style={styles.bestHint}>{wins} wins · best {best} pts · streak {streak}</Text> : null}
              <Pressable onPress={loadSolo} disabled={busy} style={styles.playBtn}>
                <Text style={styles.playText}>Start match</Text>
              </Pressable>
            </ScrollView>
          ) : (
            <>
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: myMark === 'X' ? '#1B4480' : '#C2410C' }]} />
                  <Text style={styles.legendText}>You · {myMark}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: myMark === 'X' ? '#C2410C' : '#1B4480' }]} />
                  <Text style={styles.legendText}>{theirName} · {myMark === 'X' ? 'O' : 'X'}</Text>
                </View>
              </View>

              <TicTacBoard
                board={displayBoard}
                pending={pendingCell}
                rivalCell={isMatch ? null : rivalCell}
                winLine={winLine}
                onPress={onCell}
                disabled={!myBoardTurn || finished}
              />

              <View style={[styles.sheet, shadowCard]}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.sheetInner}
                >
                  {finished ? (
                    <View style={styles.resultCard}>
                      <Text style={styles.resultEmoji}>{resultTitle.includes('You') ? '🏆' : resultTitle === 'Draw' ? '🤝' : '📘'}</Text>
                      <Text style={styles.resultTitle}>{resultTitle}</Text>
                      {!isMatch ? (
                        <>
                          <Text style={styles.resultMeta}>{score} pts{score >= best && score > 0 ? '  ·  New best!' : ''}</Text>
                          <View style={styles.resultBtns}>
                            <Pressable onPress={() => { setPhase('setup'); setConfettiOn(false); }} style={styles.ghostBtn}>
                              <Text style={styles.ghostText}>Settings</Text>
                            </Pressable>
                            <Pressable onPress={loadSolo} style={styles.playBtnSmall}>
                              <Text style={styles.playText}>Play again</Text>
                            </Pressable>
                          </View>
                        </>
                      ) : null}
                    </View>
                  ) : answering ? (
                    <View>
                      <View style={styles.qMeta}>
                        <View style={[styles.subjectChip, { backgroundColor: subjectMeta.bg }]}>
                          <Ionicons name={subjectMeta.icon} size={14} color={subjectMeta.fg} />
                          <Text style={[styles.subject, { color: subjectMeta.fg }]}>{question.subject || 'Quiz'}</Text>
                        </View>
                        <Text style={[styles.qCount, qLeft <= 4 && styles.qHot]}>{qLeft}s</Text>
                      </View>
                      <View style={styles.timerTrack}>
                        <View style={[styles.timerFill, qLeft <= 4 && styles.timerHot, { width: `${(qLeft / Q_SECS) * 100}%` }]} />
                      </View>
                      <Text style={styles.prompt}>{question.prompt}</Text>
                      {(question.choices || []).map((choice, i) => (
                        <Pressable
                          key={`${question.id || qIndex}-${i}`}
                          disabled={locked}
                          onPress={() => onAnswer(i)}
                          style={choiceStyle(i)}
                        >
                          <View style={[styles.choiceLetter, { backgroundColor: LETTER_COLORS[i] || colors.brandNavy }]}>
                            <Text style={styles.choiceLetterText}>{LETTERS[i]}</Text>
                          </View>
                          <Text style={styles.choiceText}>{choice}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : isMatch && match?.state?.pendingCell != null ? (
                    <Text style={styles.wait}>They picked a square — answering now…</Text>
                  ) : aiBusy ? (
                    <Text style={styles.wait}>Rival’s turn…</Text>
                  ) : myBoardTurn ? (
                    <Text style={styles.wait}>Tap an empty square to claim it.</Text>
                  ) : (
                    <Text style={styles.wait}>Waiting for the other player…</Text>
                  )}
                </ScrollView>
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
  root: { flex: 1, backgroundColor: '#FFF7ED' },
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
    backgroundColor: '#9A3412',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'flex-end',
    minWidth: 72,
  },
  scoreLabel: { fontSize: 9, fontWeight: '800', color: '#FED7AA', letterSpacing: 0.5 },
  scoreValue: { fontSize: 18, fontWeight: '800', color: colors.white, marginTop: -2 },
  bestLabel: { fontSize: 10, color: '#FFEDD5', fontWeight: '700' },
  body: { flex: 1, paddingHorizontal: 16, alignItems: 'center', gap: 10 },
  loadingBox: { marginTop: 48, alignItems: 'center', gap: 12 },
  loadingText: { fontWeight: '700', color: colors.textMuted },
  toast: { width: '100%', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14 },
  toastOk: { backgroundColor: '#DCFCE7' },
  toastErr: { backgroundColor: '#FEE2E2' },
  toastInfo: { backgroundColor: '#FFEDD5' },
  toastText: { fontWeight: '800', textAlign: 'center', fontSize: 15 },
  toastOkText: { color: '#166534' },
  toastErrText: { color: '#B91C1C' },
  toastInfoText: { color: '#9A3412' },
  setup: { width: '100%', paddingBottom: 24, gap: 16, justifyContent: 'center', flexGrow: 1 },
  hero: { fontSize: 28, fontWeight: '800', color: '#9A3412', textAlign: 'center' },
  heroSub: { fontSize: 15, color: colors.textMuted, fontWeight: '600', textAlign: 'center' },
  bestHint: { textAlign: 'center', fontWeight: '700', color: '#C2410C' },
  playBtn: {
    alignSelf: 'center',
    backgroundColor: '#C2410C',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
  },
  playBtnSmall: {
    backgroundColor: '#C2410C',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  playText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  legend: { flexDirection: 'row', gap: 16, marginBottom: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontWeight: '700', color: colors.textMuted, fontSize: 13 },
  sheet: {
    width: '100%',
    flex: 1,
    minHeight: 180,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 14,
    marginTop: 4,
  },
  sheetInner: { paddingBottom: 8 },
  qMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  subjectChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  subject: { fontWeight: '800', fontSize: 12 },
  qCount: { fontWeight: '800', color: colors.textMuted },
  qHot: { color: '#DC2626' },
  timerTrack: { height: 7, borderRadius: 999, backgroundColor: '#F1E6D8', overflow: 'hidden', marginBottom: 10 },
  timerFill: { height: '100%', backgroundColor: '#C2410C', borderRadius: 999 },
  timerHot: { backgroundColor: '#DC2626' },
  prompt: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 10 },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
  },
  choiceGood: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
  choiceBad: { backgroundColor: '#FEE2E2', borderColor: '#FECACA' },
  choiceDim: { opacity: 0.45 },
  choiceLetter: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceLetterText: { color: colors.white, fontWeight: '800' },
  choiceText: { flex: 1, fontWeight: '700', color: colors.text, fontSize: 15 },
  wait: { textAlign: 'center', color: colors.textMuted, fontWeight: '700', marginTop: 8 },
  resultCard: { alignItems: 'center', gap: 6, paddingVertical: 8 },
  resultEmoji: { fontSize: 28 },
  resultTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  resultMeta: { fontWeight: '600', color: colors.textMuted },
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
