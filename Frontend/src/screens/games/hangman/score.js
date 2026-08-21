import AsyncStorage from '@react-native-async-storage/async-storage';

export function hangmanPoints({ word, lives, streak }) {
  const letters = String(word || '').replace(/[^A-Z]/g, '').length;
  const raw = letters * 10 + lives * 20 + streak * 15;
  return Math.max(25, raw);
}

export async function loadHangmanBest(studentId) {
  if (!studentId) return 0;
  try {
    const raw = await AsyncStorage.getItem(`@edutrack_hangman_best_${studentId}`);
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

export async function saveHangmanBest(studentId, score) {
  if (!studentId) return;
  await AsyncStorage.setItem(`@edutrack_hangman_best_${studentId}`, String(score));
}
