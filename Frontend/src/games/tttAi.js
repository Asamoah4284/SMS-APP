const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function boardWinner(board) {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  if (board.every(Boolean)) return 'DRAW';
  return null;
}

export function findWinningLine(board) {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return line;
  }
  return null;
}

export function emptyCells(board) {
  return board.map((v, i) => (v ? null : i)).filter((v) => v != null);
}

function firstWinningMove(board, mark) {
  for (const i of emptyCells(board)) {
    const next = [...board];
    next[i] = mark;
    if (boardWinner(next) === mark) return i;
  }
  return null;
}

export function aiPickCell(board, difficulty = 'easy') {
  const empties = emptyCells(board);
  if (!empties.length) return null;

  const win = firstWinningMove(board, 'O');
  if (win != null && difficulty !== 'easy') return win;

  const block = firstWinningMove(board, 'X');
  if (block != null && difficulty === 'hard') return block;
  if (block != null && difficulty === 'medium' && Math.random() < 0.55) return block;

  if (difficulty !== 'easy' && empties.includes(4)) return 4;

  const corners = [0, 2, 6, 8].filter((i) => empties.includes(i));
  if (difficulty === 'hard' && corners.length) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  return empties[Math.floor(Math.random() * empties.length)];
}

export function aiAnswersCorrect(difficulty = 'easy') {
  const p = { easy: 0.42, medium: 0.66, hard: 0.88 }[difficulty] ?? 0.45;
  return Math.random() < p;
}
