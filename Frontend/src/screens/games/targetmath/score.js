import AsyncStorage from '@react-native-async-storage/async-storage';

const key = (studentId, difficulty) => `@edutrack_math_best_${studentId}_${difficulty}`;

export function mathScore({ hit, steps, leftover }) {
  if (!hit) return 0;
  return 50 + Math.max(0, 5 - steps) * 10 + Math.max(0, leftover) * 5;
}

export async function loadMathBest(studentId, difficulty) {
  if (!studentId) return 0;
  try {
    const raw = await AsyncStorage.getItem(key(studentId, difficulty));
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

export async function saveMathBest(studentId, difficulty, score) {
  if (!studentId) return;
  await AsyncStorage.setItem(key(studentId, difficulty), String(score));
}
