import { useCallback, useEffect, useRef, useState } from 'react';
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
import ConfettiBurst from './hangman/ConfettiBurst';
import SkyScene from './tower/SkyScene';
import TowerHero from './tower/TowerHero';
import { loadTowerBest, saveTowerBest, towerPoints } from './tower/score';
import { colors, shadowCard } from '../../theme';

const LETTERS = ['A', 'B', 'C', 'D'];
const LETTER_COLORS = ['#1B4480', '#A07C10', '#15803D', '#C2410C'];

const SUBJECT = {
  Science: { bg: '#ECFDF5', fg: '#15803D', icon: 'leaf-outline' },
  Maths: { bg: '#E3ECF7', fg: '#1B4480', icon: 'calculator-outline' },
  English: { bg: '#F5F0E0', fg: '#A07C10', icon: 'book-outline' },
  Social: { bg: '#FFEDD5', fg: '#C2410C', icon: 'globe-outline' },
};

export default function KnowledgeTowerScreen() {
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

  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [floors, setFloors] = useState(0);
  const [misses, setMisses] = useState(0);
  const [busy, setBusy] = useState(!isMatch);
  const [over, setOver] = useState(false);
  const [remain, setRemain] = useState(45);
  const [picked, setPicked] = useState(null);
  const [wasCorrect, setWasCorrect] = useState(null);
  const [locked, setLocked] = useState(false);
  const [runScore, setRunScore] = useState(0);
  const [best, setBest] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastGain, setLastGain] = useState(0);
  const [confettiOn, setConfettiOn] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;
  const gainY = useRef(new Animated.Value(0)).current;
  const gainOp = useRef(new Animated.Value(0)).current;
  const delayRef = useRef(null);

  useEffect(() => {
    loadTowerBest(student?.studentId).then(setBest);
  }, [student?.studentId]);

  useEffect(() => () => clearTimeout(delayRef.current), []);

  useEffect(() => {
    if (!lastGain) return undefined;
    gainY.setValue(8);
    gainOp.setValue(1);
    Animated.parallel([
      Animated.timing(gainY, { toValue: -36, duration: 780, useNativeDriver: true }),
      Animated.timing(gainOp, { toValue: 0, duration: 780, useNativeDriver: true }),
    ]).start();
    return undefined;
  }, [gainOp, gainY, lastGain, floors]);

  const loadSolo = useCallback(async () => {
    try {
      setBusy(true);
      setConfettiOn(false);
      const data = await apiFetch(`/portal/games/deal?gameType=KNOWLEDGE_TOWER&studentId=${encodeURIComponent(student.studentId)}`, token);
      setQuestions(data.questions || []);
      setIndex(0);
      setFloors(0);
      setMisses(0);
      setOver(false);
      setPicked(null);
      setWasCorrect(null);
      setLocked(false);
      setRunScore(0);
      setStreak(0);
      setLastGain(0);
    } catch (err) {
      Alert.alert('Could not start', err.message);
    } finally {
      setBusy(false);
    }
  }, [student?.studentId, token]);

  useEffect(() => {
    if (!isMatch) loadSolo();
  }, [isMatch, loadSolo]);

  useEffect(() => {
    if (!isMatch || match?.status !== 'ACTIVE' || match?.turn !== match?.role) return undefined;
    if (!match.state.turnStartedAt) {
      sendAction('START_TURN').catch(() => {});
    }
    return undefined;
  }, [isMatch, match?.status, match?.turn, match?.role, match?.state?.turnStartedAt]);

  useEffect(() => {
    if (!isMatch || !match?.state?.turnStartedAt || match.turn !== match.role) return undefined;
    const tick = () => {
      const left = Math.max(0, 45 - Math.floor((Date.now() - match.state.turnStartedAt) / 1000));
      setRemain(left);
      if (left <= 0) sendAction('END_TURN').catch(() => {});
    };
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [isMatch, match?.state?.turnStartedAt, match?.turn, match?.role]);

  useEffect(() => {
    if (isMatch && match?.status === 'FINISHED' && match.winnerStudentId === student?.studentId) {
      setConfettiOn(true);
    }
  }, [isMatch, match?.status, match?.winnerStudentId, student?.studentId]);

  const bumpScore = (pts) => {
    setLastGain(pts);
    setRunScore((prev) => {
      const next = prev + pts;
      if (next > best) {
        setBest(next);
        saveTowerBest(student?.studentId, next);
      }
      return next;
    });
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1.12, duration: 160, useNativeDriver: true }),
      Animated.spring(pulse, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };

  const finishRun = (nextFloors) => {
    setOver(true);
    if (nextFloors >= 3) setConfettiOn(true);
  };

  const answerSolo = (choiceIndex) => {
    const q = questions[index];
    if (!q || over || locked) return;
    const correct = choiceIndex === q.answerIndex;
    setPicked(choiceIndex);
    setWasCorrect(correct);
    setLocked(true);

    let nextFloors = floors;
    let nextMisses = misses;
    let nextStreak = streak;

    if (correct) {
      nextStreak = streak + 1;
      nextFloors = floors + 1;
      const pts = towerPoints(nextStreak);
      setStreak(nextStreak);
      setFloors(nextFloors);
      bumpScore(pts);
    } else {
      nextMisses = misses + 1;
      setStreak(0);
      setMisses(nextMisses);
    }

    const willEnd = (!correct && nextMisses >= 3) || index + 1 >= questions.length;
    delayRef.current = setTimeout(() => {
      if (willEnd) finishRun(nextFloors);
      else {
        setIndex((n) => n + 1);
        setPicked(null);
        setWasCorrect(null);
        setLocked(false);
        setLastGain(0);
      }
    }, 850);
  };

  const answerMatch = async (choiceIndex) => {
    if (locked) return;
    setPicked(choiceIndex);
    setLocked(true);
    try {
      await sendAction('SUBMIT_ANSWER', { choiceIndex });
    } catch (err) {
      Alert.alert('Answer failed', err.message);
    } finally {
      setPicked(null);
      setLocked(false);
    }
  };

  const q = isMatch ? match?.state?.currentQuestion : questions[index];
  const myTurn = !isMatch || (match?.status === 'ACTIVE' && match?.turn === match?.role);
  const p1 = isMatch ? match?.state?.player1Floors || 0 : floors;
  const p2 = isMatch ? match?.state?.player2Floors || 0 : 0;
  const livesLeft = 3 - misses;
  const collapsed = !isMatch && over && misses >= 3;
  const matchOver = isMatch && match?.status === 'FINISHED';
  const showResult = over || matchOver;
  const subjectMeta = SUBJECT[q?.subject] || { bg: colors.brandNavyMuted, fg: colors.brandNavy, icon: 'school-outline' };
  const timerPct = Math.max(0, Math.min(1, remain / 45));

  const choiceStyle = (i) => {
    if (picked == null || isMatch) return [styles.choice];
    const right = questions[index]?.answerIndex;
    if (i === right) return [styles.choice, styles.choiceGood];
    if (i === picked && !wasCorrect) return [styles.choice, styles.choiceBad];
    return [styles.choice, styles.choiceDim];
  };

  return (
    <View style={styles.root}>
      <SkyScene collapsed={collapsed} />

      <View style={[styles.hud, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backCircle}>
          <Ionicons name="chevron-back" size={22} color={colors.brandNavy} />
        </Pressable>
        <View style={styles.titleChip}>
          <Text style={styles.topTitle}>Knowledge Tower</Text>
          <Text style={styles.topSub}>
            {isMatch ? `Round ${match?.state?.roundNumber || 1} of 3` : 'Answer right. Build higher.'}
          </Text>
        </View>
        {!isMatch ? (
          <Animated.View style={[styles.scorePill, { transform: [{ scale: pulse }] }]}>
            <Text style={styles.scoreLabel}>SCORE</Text>
            <Text style={styles.scoreValue}>{runScore}</Text>
            <Text style={styles.bestLabel}>best {best}</Text>
          </Animated.View>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      {busy || (isMatch && loading && !match) ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={colors.white} />
      ) : (
        <>
          <View style={styles.stage}>
            {!isMatch ? (
              <View style={styles.livesRow}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <View key={i} style={[styles.life, i < livesLeft && !collapsed ? styles.lifeOn : styles.lifeOff]}>
                    <Ionicons
                      name={i < livesLeft && !collapsed ? 'heart' : 'heart-outline'}
                      size={16}
                      color={i < livesLeft && !collapsed ? '#E11D48' : '#94A3B8'}
                    />
                  </View>
                ))}
                {streak > 1 ? (
                  <View style={styles.streakChip}>
                    <Text style={styles.streak}>🔥 {streak} streak</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View>
              {isMatch ? (
                <View style={styles.towers}>
                  <View style={styles.towerCol}>
                    <Text style={styles.towerLabel} numberOfLines={1}>{match?.hostName || 'Host'}</Text>
                    <TowerHero floors={p1} compact tint={colors.brandNavy} collapsed={matchOver && p1 < p2} />
                  </View>
                  <View style={styles.towerCol}>
                    <Text style={styles.towerLabel} numberOfLines={1}>{match?.guestName || 'Friend'}</Text>
                    <TowerHero floors={p2} compact tint="#9A3412" collapsed={matchOver && p2 < p1} />
                  </View>
                </View>
              ) : (
                <TowerHero floors={floors} collapsed={collapsed} />
              )}
              <Animated.Text style={[styles.floatGain, { opacity: gainOp, transform: [{ translateY: gainY }] }]}>
                {lastGain ? `+${lastGain}` : ''}
              </Animated.Text>
            </View>
          </View>

          <View style={[styles.sheet, shadowCard, { paddingBottom: Math.max(insets.bottom, 14) }]}>
            <View style={styles.handle} />
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {showResult ? (
                <View style={[styles.resultCard, collapsed ? styles.resultLose : styles.resultWin]}>
                  <Text style={styles.resultEmoji}>{collapsed ? '💨' : '🏆'}</Text>
                  <Text style={styles.resultTitle}>
                    {matchOver
                      ? (match.winnerStudentId === student.studentId
                        ? 'Tallest tower — you win!'
                        : match.winnerStudentId
                          ? 'Your friend built higher'
                          : 'Tied towers!')
                      : collapsed
                        ? 'The tower fell'
                        : 'What a tower!'}
                  </Text>
                  {!isMatch ? (
                    <>
                      <Text style={styles.gain}>{floors} floors · {runScore} pts</Text>
                      <Text style={styles.resultMeta}>
                        Best {best}{runScore >= best && runScore > 0 ? '  ·  New best!' : ''}
                      </Text>
                      <Pressable onPress={loadSolo} style={styles.againBtn}>
                        <Text style={styles.againText}>Build again</Text>
                      </Pressable>
                    </>
                  ) : null}
                </View>
              ) : !myTurn ? (
                <Text style={styles.wait}>Waiting for {match?.turn === 'HOST' ? match?.hostName : match?.guestName}…</Text>
              ) : q ? (
                <View style={styles.qWrap}>
                  <View style={styles.qMeta}>
                    <View style={[styles.subjectChip, { backgroundColor: subjectMeta.bg }]}>
                      <Ionicons name={subjectMeta.icon} size={14} color={subjectMeta.fg} />
                      <Text style={[styles.subject, { color: subjectMeta.fg }]}>{q.subject || 'Quiz'}</Text>
                    </View>
                    {!isMatch ? (
                      <Text style={styles.qCount}>Q{index + 1}</Text>
                    ) : (
                      <Text style={styles.qCount}>{remain}s</Text>
                    )}
                  </View>
                  {isMatch ? (
                    <View style={styles.timerTrack}>
                      <View style={[styles.timerFill, { width: `${timerPct * 100}%` }]} />
                    </View>
                  ) : null}
                  <Text style={styles.prompt}>{q.prompt}</Text>
                  {(q.choices || []).map((choice, i) => (
                    <Pressable
                      key={`${q.id || index}-${i}`}
                      disabled={locked && !isMatch}
                      onPress={() => (isMatch ? answerMatch(i) : answerSolo(i))}
                      style={({ pressed }) => [
                        ...choiceStyle(i),
                        pressed && !locked && styles.choicePressed,
                      ]}
                    >
                      <View style={[styles.choiceLetter, { backgroundColor: LETTER_COLORS[i] || colors.brandNavy }]}>
                        <Text style={styles.choiceLetterText}>{LETTERS[i] || i + 1}</Text>
                      </View>
                      <Text style={styles.choiceText}>{choice}</Text>
                    </Pressable>
                  ))}
                  {isMatch ? (
                    <Pressable onPress={() => sendAction('END_TURN')} style={styles.endTurn}>
                      <Text style={styles.endTurnText}>End turn</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : (
                <ActivityIndicator color={colors.brandNavy} />
              )}
            </ScrollView>
          </View>
        </>
      )}

      <ConfettiBurst play={confettiOn} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#4C8DFF' },
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    zIndex: 2,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleChip: {
    flex: 1,
    marginHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  topTitle: { fontSize: 16, fontWeight: '800', color: colors.brandNavy },
  topSub: { fontSize: 11, color: colors.textMuted, fontWeight: '700', marginTop: 1 },
  scorePill: {
    backgroundColor: 'rgba(15,23,42,0.88)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'flex-end',
    minWidth: 70,
  },
  scoreLabel: { fontSize: 9, fontWeight: '800', color: '#FDE68A', letterSpacing: 0.6 },
  scoreValue: { fontSize: 18, fontWeight: '800', color: colors.white, marginTop: -2 },
  bestLabel: { fontSize: 10, color: '#CBD5E1', fontWeight: '700' },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 4 },
  livesRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  life: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lifeOn: { backgroundColor: 'rgba(255,255,255,0.92)' },
  lifeOff: { backgroundColor: 'rgba(255,255,255,0.4)' },
  streakChip: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  streak: { fontWeight: '800', color: colors.orange, fontSize: 13 },
  towers: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  towerCol: { alignItems: 'center', flex: 1 },
  towerLabel: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '800',
    marginBottom: 2,
    maxWidth: 140,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  floatGain: {
    position: 'absolute',
    alignSelf: 'center',
    top: 18,
    fontSize: 22,
    fontWeight: '800',
    color: '#166534',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 8,
    maxHeight: '52%',
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    marginBottom: 10,
  },
  qWrap: { gap: 10, paddingBottom: 8 },
  qMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  subject: { fontSize: 12, fontWeight: '800', letterSpacing: 0.2 },
  qCount: { fontSize: 13, fontWeight: '800', color: colors.textMuted },
  timerTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  timerFill: { height: '100%', backgroundColor: colors.brandNavy, borderRadius: 999 },
  prompt: { fontSize: 20, fontWeight: '800', color: colors.text, lineHeight: 26 },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 58,
    borderWidth: 1.5,
    borderColor: '#E8ECF1',
  },
  choicePressed: { transform: [{ scale: 0.98 }], backgroundColor: colors.brandNavyMuted },
  choiceGood: { backgroundColor: '#DCFCE7', borderColor: '#16A34A' },
  choiceBad: { backgroundColor: '#FEE2E2', borderColor: '#E11D48' },
  choiceDim: { opacity: 0.4 },
  choiceLetter: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceLetterText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  choiceText: { flex: 1, fontSize: 17, color: colors.text, fontWeight: '700' },
  wait: { textAlign: 'center', color: colors.textMuted, marginVertical: 24, fontSize: 16, fontWeight: '600' },
  resultCard: {
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  resultWin: { backgroundColor: '#ECFDF5' },
  resultLose: { backgroundColor: '#FEF2F2' },
  resultEmoji: { fontSize: 32 },
  resultTitle: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
  gain: { fontSize: 20, fontWeight: '800', color: colors.brandNavy },
  resultMeta: { fontSize: 14, color: colors.textMuted, fontWeight: '600', textAlign: 'center' },
  againBtn: {
    marginTop: 8,
    backgroundColor: colors.brandNavy,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 14,
  },
  againText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  endTurn: { alignSelf: 'center', marginTop: 4, padding: 8 },
  endTurnText: { color: colors.textMuted, fontWeight: '700' },
});
