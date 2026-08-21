import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../config/api';
import { useGameMatch } from '../../hooks/useGameMatch';
import ConfettiBurst from './hangman/ConfettiBurst';
import { ChipRow, TTT_SUBJECTS } from './tictac/chips';
import DrawCanvas from './scribble/DrawCanvas';
import { colors, shadowCard } from '../../theme';

const PENS = [
  { color: '#1B4480', label: 'Navy' },
  { color: '#0F766E', label: 'Teal' },
  { color: '#C9A020', label: 'Gold' },
  { color: '#C2410C', label: 'Orange' },
];

function normalizeStrokes(raw) {
  return (raw || []).map((stroke) => {
    if (Array.isArray(stroke)) return { color: '#1B4480', width: 5, points: stroke };
    return {
      color: stroke.color || '#1B4480',
      width: stroke.width || 5,
      points: stroke.points || [],
    };
  });
}

export default function ScribbleScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { student, token } = useAuth();
  const isMatch = route.params?.mode === 'match';
  const { match, sendAction, loading } = useGameMatch(
    route.params?.matchId,
    token,
    student?.studentId,
    { enabled: isMatch },
  );

  const canvasSize = Math.round(Math.min(width - 32, 340, 420));
  const [phase, setPhase] = useState(isMatch ? 'play' : 'setup');
  const [subject, setSubject] = useState('All');
  const [word, setWord] = useState('');
  const [hint, setHint] = useState('');
  const [wordSubject, setWordSubject] = useState('');
  const [strokes, setStrokes] = useState([]);
  const [replay, setReplay] = useState([]);
  const [guess, setGuess] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pen, setPen] = useState(PENS[0].color);
  const [toast, setToast] = useState(null);
  const [confettiOn, setConfettiOn] = useState(false);
  const toastTimer = useRef(null);

  const flash = useCallback((type, text) => {
    setToast({ type, text });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const loadSolo = useCallback(async () => {
    try {
      setBusy(true);
      setConfettiOn(false);
      const q = new URLSearchParams({
        gameType: 'SCRIBBLE',
        studentId: student.studentId,
      });
      if (subject && subject !== 'All') q.set('subject', subject);
      const deal = await apiFetch(`/portal/games/deal?${q.toString()}`, token);
      setWord(String(deal.word || '').toUpperCase());
      setHint(deal.hint || '');
      setWordSubject(deal.subject || '');
      setStrokes([]);
      setReplay([]);
      setRevealed(false);
      setGuess('');
      setPhase('play');
    } catch (err) {
      flash('error', err.message || 'Could not start. Try again.');
    } finally {
      setBusy(false);
    }
  }, [flash, student?.studentId, subject, token]);

  useEffect(() => {
    const paths = match?.state?.pathCoordinates;
    if (!isMatch || !paths?.length || !match?.state?.drawingSubmitted) return undefined;
    const list = normalizeStrokes(paths);
    let i = 0;
    setReplay([]);
    const t = setInterval(() => {
      i += 1;
      setReplay(list.slice(0, i));
      if (i >= list.length) clearInterval(t);
    }, 90);
    return () => clearInterval(t);
  }, [isMatch, match?.id, match?.state?.drawingSubmitted]);

  const isHost = !isMatch || match?.role === 'HOST';
  const canDraw = isHost && !revealed && (!isMatch || (match?.status === 'ACTIVE' && !match?.state?.drawingSubmitted));
  const canGuess = isMatch && match?.role === 'GUEST' && match?.state?.drawingSubmitted && match?.status === 'ACTIVE';
  const shown = isMatch && match?.role === 'GUEST' && match?.state?.drawingSubmitted ? replay : strokes;
  const displayWord = isMatch ? (match?.state?.targetWord || word) : word;
  const subjectLabel = isMatch ? (match?.seed?.subject || match?.state?.subject || '') : wordSubject;
  const displayHint = isMatch ? (match?.state?.hint || hint) : hint;
  const guesses = match?.state?.guessHistory || [];
  const triesLeft = Math.max(0, 5 - guesses.length);
  const matchOver = isMatch && match?.status === 'FINISHED';
  const waitingGuess = isMatch && isHost && match?.state?.drawingSubmitted && !matchOver;

  const submitDrawing = async () => {
    if (!strokes.length) {
      flash('error', 'Draw something first.');
      return;
    }
    if (isMatch) {
      try {
        await sendAction('SUBMIT_DRAWING', { pathCoordinates: strokes });
        flash('ok', 'Sent! Waiting for a guess…');
      } catch (err) {
        flash('error', err.message || 'Could not send the drawing.');
      }
      return;
    }
    setRevealed(true);
  };

  const submitGuess = async () => {
    if (!guess.trim()) {
      flash('error', 'Type a guess first.');
      return;
    }
    try {
      await sendAction('GUESS', { text: guess });
      setGuess('');
    } catch (err) {
      flash('error', err.message || 'Could not send that guess.');
    }
  };

  useEffect(() => {
    if (matchOver && match.winnerStudentId === student?.studentId && match?.role === 'GUEST') {
      setConfettiOn(true);
    }
  }, [matchOver, match?.winnerStudentId, match?.role, student?.studentId]);

  const undo = () => setStrokes((s) => s.slice(0, -1));

  const subtitle = useMemo(() => {
    if (!isMatch) return canDraw ? `Draw: ${displayWord}` : displayWord;
    if (isHost) return match?.state?.drawingSubmitted ? 'Waiting for a guess' : `Draw: ${displayWord}`;
    return match?.state?.drawingSubmitted ? 'What did they draw?' : 'Waiting for the drawing…';
  }, [canDraw, displayWord, isHost, isMatch, match?.state?.drawingSubmitted]);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.hud}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backCircle}>
          <Ionicons name="chevron-back" size={22} color={colors.brandNavy} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle}>Scribble</Text>
          <Text style={styles.topSub} numberOfLines={1}>{subtitle}</Text>
        </View>
        {canGuess ? (
          <View style={styles.scorePill}>
            <Text style={styles.scoreLabel}>TRIES</Text>
            <Text style={styles.scoreValue}>{triesLeft}</Text>
          </View>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {busy || (isMatch && loading && !match) ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#0F766E" />
          <Text style={styles.loadingText}>Picking something to draw…</Text>
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
              <Text style={styles.hero}>Sketch it</Text>
              <Text style={styles.heroSub}>You get a word. Draw it. In a match, your friend guesses — five tries.</Text>
              <ChipRow title="Which subject?" items={TTT_SUBJECTS} value={subject} onChange={setSubject} />
              <Pressable onPress={loadSolo} style={styles.playBtn}>
                <Text style={styles.playText}>Get a word</Text>
              </Pressable>
            </ScrollView>
          ) : (
            <>
              {subjectLabel ? (
                <View style={styles.subjectChip}>
                  <Text style={styles.subjectText}>{subjectLabel}</Text>
                </View>
              ) : null}

              <DrawCanvas
                strokes={shown}
                onChange={setStrokes}
                enabled={canDraw}
                size={canvasSize}
                color={pen}
              />

              {canDraw ? (
                <>
                  <View style={styles.pens}>
                    {PENS.map((p) => (
                      <Pressable
                        key={p.color}
                        onPress={() => setPen(p.color)}
                        style={[styles.pen, { backgroundColor: p.color }, pen === p.color && styles.penOn]}
                      />
                    ))}
                  </View>
                  <View style={styles.row}>
                    <Pressable onPress={undo} style={styles.iconBtn}>
                      <Ionicons name="arrow-undo-outline" size={20} color={colors.brandNavy} />
                    </Pressable>
                    <Pressable onPress={() => setStrokes([])} style={styles.iconBtn}>
                      <Ionicons name="trash-outline" size={20} color={colors.brandNavy} />
                    </Pressable>
                    <Pressable onPress={submitDrawing} style={styles.playBtnSmall}>
                      <Text style={styles.playText}>{isMatch ? 'Send drawing' : 'Reveal word'}</Text>
                    </Pressable>
                  </View>
                </>
              ) : null}

              {canGuess ? (
                <View style={[styles.sheet, shadowCard]}>
                  <TextInput
                    style={styles.input}
                    placeholder="What is it?"
                    placeholderTextColor={colors.textSoft}
                    value={guess}
                    onChangeText={setGuess}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    onSubmitEditing={submitGuess}
                  />
                  <Pressable onPress={submitGuess} style={styles.playBtnSmall}>
                    <Text style={styles.playText}>Guess</Text>
                  </Pressable>
                  {guesses.length ? <Text style={styles.history}>{guesses.join(' · ')}</Text> : null}
                </View>
              ) : null}

              {waitingGuess ? (
                <Text style={styles.wait}>Waiting for guesses… {guesses.join(' · ')}</Text>
              ) : null}

              {isMatch && match?.role === 'GUEST' && !match?.state?.drawingSubmitted && !matchOver ? (
                <Text style={styles.wait}>Your friend is drawing…</Text>
              ) : null}

              {revealed && !isMatch ? (
                <View style={[styles.sheet, shadowCard]}>
                  <Text style={styles.reveal}>{word}</Text>
                  {hint ? <Text style={styles.hint}>{hint}</Text> : null}
                  <View style={styles.row}>
                    <Pressable onPress={() => { setPhase('setup'); setConfettiOn(false); }} style={styles.ghostBtn}>
                      <Text style={styles.ghostText}>Settings</Text>
                    </Pressable>
                    <Pressable onPress={loadSolo} style={styles.playBtnSmall}>
                      <Text style={styles.playText}>New word</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}

              {matchOver ? (
                <View style={[styles.sheet, shadowCard]}>
                  <Text style={styles.reveal}>{match.state?.targetWord || displayWord}</Text>
                  <Text style={styles.hint}>
                    {match.winnerStudentId === student.studentId
                      ? (match.role === 'GUEST' ? 'You guessed it!' : 'They could not guess it')
                      : match.winnerStudentId
                        ? (match.role === 'GUEST' ? 'Out of tries' : 'They got it!')
                        : 'Round over'}
                  </Text>
                  {displayHint ? <Text style={styles.hint}>{displayHint}</Text> : null}
                </View>
              ) : null}
            </>
          )}
        </View>
      )}
      <ConfettiBurst play={confettiOn} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0FDFA' },
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
    backgroundColor: '#115E59',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'flex-end',
    minWidth: 64,
  },
  scoreLabel: { fontSize: 9, fontWeight: '800', color: '#99F6E4', letterSpacing: 0.5 },
  scoreValue: { fontSize: 18, fontWeight: '800', color: colors.white, marginTop: -2 },
  body: { flex: 1, paddingHorizontal: 16, alignItems: 'center', gap: 10 },
  loadingBox: { marginTop: 48, alignItems: 'center', gap: 12 },
  loadingText: { fontWeight: '700', color: colors.textMuted },
  toast: { width: '100%', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14 },
  toastOk: { backgroundColor: '#DCFCE7' },
  toastErr: { backgroundColor: '#FEE2E2' },
  toastText: { fontWeight: '800', textAlign: 'center', fontSize: 15 },
  toastOkText: { color: '#166534' },
  toastErrText: { color: '#B91C1C' },
  setup: { width: '100%', flexGrow: 1, justifyContent: 'center', gap: 16, paddingBottom: 24 },
  hero: { fontSize: 28, fontWeight: '800', color: '#115E59', textAlign: 'center' },
  heroSub: { fontSize: 15, color: colors.textMuted, fontWeight: '600', textAlign: 'center' },
  playBtn: {
    alignSelf: 'center',
    backgroundColor: '#0F766E',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
  },
  playBtnSmall: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  playText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  subjectChip: {
    backgroundColor: '#CCFBF1',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  subjectText: { fontWeight: '800', color: '#0F766E', fontSize: 12 },
  pens: { flexDirection: 'row', gap: 10 },
  pen: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  penOn: { borderColor: colors.text, transform: [{ scale: 1.12 }] },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
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
  sheet: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 14,
    gap: 10,
    alignItems: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 1,
  },
  history: { color: colors.textMuted, fontWeight: '700', textAlign: 'center' },
  wait: { color: colors.textMuted, fontWeight: '700', textAlign: 'center' },
  reveal: { fontSize: 24, fontWeight: '800', color: '#115E59', textAlign: 'center' },
  hint: { color: colors.textMuted, fontWeight: '600', textAlign: 'center' },
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
