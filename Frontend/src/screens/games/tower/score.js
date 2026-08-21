import AsyncStorage from '@react-native-async-storage/async-storage';

export function towerPoints(streak) {
  return 100 + Math.max(0, streak - 1) * 15;
}

export async function loadTowerBest(studentId) {
  if (!studentId) return 0;
  try {
    const raw = await AsyncStorage.getItem(`@edutrack_tower_best_${studentId}`);
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

export async function saveTowerBest(studentId, score) {
  if (!studentId) return;
  await AsyncStorage.setItem(`@edutrack_tower_best_${studentId}`, String(score));
}
