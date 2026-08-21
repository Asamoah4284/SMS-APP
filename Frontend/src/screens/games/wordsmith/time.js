export const WORD_SMITH_TIMES = [
  { sec: 30, label: '30s', hint: 'Sprint' },
  { sec: 45, label: '45s', hint: 'Quick' },
  { sec: 60, label: '1 min', hint: 'Classic' },
  { sec: 90, label: '1½ min', hint: 'Relaxed' },
  { sec: 120, label: '2 min', hint: 'Long' },
];

export function clampWordSmithTime(n) {
  const v = Number(n);
  return WORD_SMITH_TIMES.some((t) => t.sec === v) ? v : 60;
}

export function timeLabel(sec) {
  const hit = WORD_SMITH_TIMES.find((t) => t.sec === Number(sec));
  return hit?.label || `${sec}s`;
}
