import AsyncStorage from '@react-native-async-storage/async-storage';

export async function loadWordSmithBest(studentId, durationSec) {
  if (!studentId) return 0;
  try {
    const raw = await AsyncStorage.getItem(`@edutrack_wordsmith_best_${studentId}_${durationSec}`);
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

export async function saveWordSmithBest(studentId, durationSec, score) {
  if (!studentId) return;
  await AsyncStorage.setItem(`@edutrack_wordsmith_best_${studentId}_${durationSec}`, String(score));
}
