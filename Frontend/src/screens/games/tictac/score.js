import AsyncStorage from '@react-native-async-storage/async-storage';

const key = (studentId) => `@edutrack_ttt_stats_${studentId}`;

export async function loadTttStats(studentId) {
  if (!studentId) return { best: 0, wins: 0, streak: 0 };
  try {
    const raw = await AsyncStorage.getItem(key(studentId));
    if (!raw) return { best: 0, wins: 0, streak: 0 };
    const data = JSON.parse(raw);
    return {
      best: Number(data.best) || 0,
      wins: Number(data.wins) || 0,
      streak: Number(data.streak) || 0,
    };
  } catch {
    return { best: 0, wins: 0, streak: 0 };
  }
}

export async function saveTttStats(studentId, stats) {
  if (!studentId) return;
  await AsyncStorage.setItem(key(studentId), JSON.stringify(stats));
}

export function tttRoundScore(claimed, won) {
  return claimed * 10 + (won ? 40 : 0);
}
