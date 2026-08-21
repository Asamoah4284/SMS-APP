function applyOp(a, b, op) {
  if (op === '+') return a + b;
  if (op === '-') return a - b;
  if (op === '×' || op === '*') return a * b;
  if (op === '÷' || op === '/') {
    if (b === 0 || a % b !== 0) return null;
    return a / b;
  }
  return null;
}

export function evalTargetExpression(tokens, tiles) {
  const remaining = [...tiles];
  let value = null;
  let pendingOp = null;
  let steps = 0;
  for (const raw of tokens) {
    if (typeof raw === 'number') {
      const idx = remaining.indexOf(raw);
      if (idx < 0) throw new Error('You already used that tile.');
      remaining.splice(idx, 1);
      if (value == null) {
        value = raw;
      } else {
        if (!pendingOp) throw new Error('Put an operation between numbers.');
        const next = applyOp(value, raw, pendingOp);
        if (next == null || !Number.isFinite(next)) {
          throw new Error('That ÷ does not make a whole number.');
        }
        value = next;
        pendingOp = null;
        steps += 1;
      }
    } else if ('+-×*÷/'.includes(raw)) {
      if (value == null) throw new Error('Start with a number.');
      if (pendingOp) throw new Error('One operation at a time.');
      pendingOp = raw;
    } else {
      throw new Error('Bad token');
    }
  }
  if (value == null) throw new Error('Build an expression first.');
  if (pendingOp) throw new Error('Finish with a number.');
  return { value, steps, leftover: remaining };
}

export function peekTargetValue(tokens, tiles) {
  if (!tokens.length) return null;
  if (typeof tokens[tokens.length - 1] !== 'number') return null;
  try {
    return evalTargetExpression(tokens, tiles).value;
  } catch {
    return null;
  }
}

export function wordScore(word) {
  const n = String(word || '').length;
  if (n < 3) return 0;
  if (n === 3) return 1;
  if (n === 4) return 2;
  if (n === 5) return 4;
  if (n === 6) return 6;
  return 10;
}

export function canMakeWord(word, seed) {
  const counts = {};
  for (const ch of String(seed || '').toUpperCase()) counts[ch] = (counts[ch] || 0) + 1;
  for (const ch of String(word || '').toUpperCase()) {
    if (!counts[ch]) return false;
    counts[ch] -= 1;
  }
  return true;
}

export function isKnownWord(word, seed, dict) {
  const w = String(word || '').toUpperCase().replace(/[^A-Z]/g, '');
  const letters = String(seed || '').toUpperCase();
  if (w.length < 3 || w.length > letters.length) return false;
  if (!canMakeWord(w, letters)) return false;
  if (!dict || !dict.size) return false;
  return dict.has(w.toLowerCase());
}

export function wordsFromTiles(seed, dict) {
  if (!seed || !dict || !dict.size) return [];
  const out = [];
  for (const raw of dict) {
    const w = String(raw || '').toLowerCase();
    if (w.length < 3 || w.length > 7) continue;
    if (!/[aeiouy]/.test(w)) continue;
    if (/^(.)\1+$/.test(w)) continue;
    if (canMakeWord(w, seed)) out.push(w.toUpperCase());
  }
  return out.sort((a, b) => b.length - a.length || a.localeCompare(b));
}
