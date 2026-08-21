import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../config/api';
import { GAME_CATALOG, screenForGame } from '../../games/catalog';
import { useGameMatch } from '../../hooks/useGameMatch';
import GameHeader from './GameHeader';
import TimeChips from './wordsmith/TimeChips';
import { timeLabel } from './wordsmith/time';
import { ChipRow, TTT_SUBJECTS } from './tictac/chips';
import { MATH_DIFFS, MATH_TIMES } from './targetmath/chips';
import { colors } from '../../theme';

export default function GameLobbyScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { student, token } = useAuth();
  const mode = route.params?.mode === 'join' ? 'join' : 'host';
  const gameType = route.params?.gameType;
  const game = GAME_CATALOG.find((g) => g.type === gameType);
  const [codeInput, setCodeInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [createdId, setCreatedId] = useState(route.params?.matchId || null);
  const [durationSec, setDurationSec] = useState(60);
  const [subject, setSubject] = useState('All');
  const [difficulty, setDifficulty] = useState('medium');
  const [error, setError] = useState('');
  const { match } = useGameMatch(createdId, token, student?.studentId, { enabled: !!createdId });
  const isWordSmith = gameType === 'WORD_SMITH';
  const isTicTac = gameType === 'TIC_TAC_TRIVIA';
  const isScribble = gameType === 'SCRIBBLE';
  const isTargetMath = gameType === 'TARGET_MATH';
  const matchTime = match?.state?.durationSec || match?.seed?.durationSec;
  const matchSubject = match?.state?.subject || match?.seed?.subject;
  const matchDiff = match?.state?.difficulty || match?.seed?.difficulty;

  useEffect(() => {
    if (match?.status === 'ACTIVE' || match?.status === 'FINISHED') {
      navigation.replace(screenForGame(match.gameType), { mode: 'match', matchId: match.id });
    }
  }, [match?.status, match?.id, match?.gameType, navigation]);

  const createMatch = async () => {
    try {
      setBusy(true);
      setError('');
      const data = await apiFetch('/portal/games/matches', token, {
        method: 'POST',
        body: JSON.stringify({
          studentId: student.studentId,
          gameType,
          ...(isWordSmith ? { durationSec } : {}),
          ...(isTicTac && subject !== 'All' ? { subject } : {}),
          ...(isScribble && subject !== 'All' ? { subject } : {}),
          ...(isTargetMath ? { durationSec, difficulty } : {}),
        }),
      });
      setCreatedId(data.match.id);
    } catch (err) {
      setError(err.message || 'Could not create the room.');
    } finally {
      setBusy(false);
    }
  };

  const joinMatch = async () => {
    try {
      setBusy(true);
      setError('');
      const data = await apiFetch('/portal/games/matches/join', token, {
        method: 'POST',
        body: JSON.stringify({ studentId: student.studentId, code: codeInput.trim().toUpperCase() }),
      });
      navigation.replace(screenForGame(data.match.gameType), { mode: 'match', matchId: data.match.id });
    } catch (err) {
      setError(err.message || 'Could not join that room.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <GameHeader
        title={mode === 'join' ? 'Join a match' : game?.title || 'Challenge'}
        subtitle={mode === 'host' ? 'Share the room code' : 'Enter a 6-letter code'}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.body}>
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {mode === 'host' && !createdId ? (
          <>
            {isWordSmith ? (
              <TimeChips value={durationSec} onChange={setDurationSec} />
            ) : null}
            {isTicTac || isScribble ? (
              <ChipRow title="Which subject?" items={TTT_SUBJECTS} value={subject} onChange={setSubject} />
            ) : null}
            {isTargetMath ? (
              <>
                <ChipRow title="How hard?" items={MATH_DIFFS} value={difficulty} onChange={setDifficulty} />
                <ChipRow title="Clock?" items={MATH_TIMES} value={durationSec} onChange={setDurationSec} />
              </>
            ) : null}
            <Pressable onPress={createMatch} disabled={busy} style={styles.primaryBtn}>
              {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>Create room</Text>}
            </Pressable>
          </>
        ) : null}

        {mode === 'host' && match ? (
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Room code</Text>
            <Text style={styles.code}>{match.code}</Text>
            {matchTime ? <Text style={styles.wait}>{timeLabel(matchTime)} round</Text> : null}
            {matchSubject && matchSubject !== 'All' ? <Text style={styles.wait}>{matchSubject} questions</Text> : null}
            {matchDiff ? <Text style={styles.wait}>{String(matchDiff)} puzzle</Text> : null}
            <Text style={styles.wait}>Waiting for a friend to join…</Text>
            <ActivityIndicator color={colors.brandNavy} style={{ marginTop: 16 }} />
          </View>
        ) : null}

        {mode === 'join' ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="ABC123"
              placeholderTextColor={colors.textSoft}
              autoCapitalize="characters"
              maxLength={6}
              value={codeInput}
              onChangeText={setCodeInput}
            />
            <Pressable
              onPress={joinMatch}
              disabled={busy || codeInput.trim().length < 4}
              style={[styles.primaryBtn, (busy || codeInput.trim().length < 4) && { opacity: 0.5 }]}
            >
              {busy ? <ActivityIndicator color={colors.white} /> : (
                <>
                  <Ionicons name="enter-outline" size={18} color={colors.white} />
                  <Text style={styles.primaryText}>Join</Text>
                </>
              )}
            </Pressable>
          </>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 16 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.brandNavy,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  codeCard: {
    alignItems: 'center',
    backgroundColor: colors.brandNavyMuted,
    padding: 28,
    borderRadius: 20,
    width: '100%',
  },
  codeLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  code: { fontSize: 40, fontWeight: '800', letterSpacing: 6, color: colors.brandNavy, marginVertical: 8 },
  wait: { fontSize: 14, color: colors.textMuted },
  errorBanner: {
    width: '100%',
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  errorText: { color: '#B91C1C', fontWeight: '700', textAlign: 'center' },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
    color: colors.text,
  },
});
