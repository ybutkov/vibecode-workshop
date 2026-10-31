export const GRID_SIZE = 9;
export const INITIAL_BALL_COUNT = 5;
export const PREVIEW_COUNT = 3;
export const MIN_LINE_LENGTH = 5;
export const STORAGE_KEY = 'colorLines.session.v1';

export const COLORS = [
  'red',
  'blue',
  'green',
  'yellow',
  'purple',
  'cyan',
  'orange',
];

export const COLOR_INFO = {
  red: { label: 'Crimson Red', short: 'R' },
  blue: { label: 'Cobalt Blue', short: 'B' },
  green: { label: 'Emerald Green', short: 'G' },
  yellow: { label: 'Amber Gold', short: 'Y' },
  purple: { label: 'Royal Violet', short: 'P' },
  cyan: { label: 'Electric Cyan', short: 'C' },
  orange: { label: 'Tangerine Orange', short: 'O' },
};

function getDefaultStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage || null;
  } catch {
    return null;
  }
}

export function createEmptyBoard() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

export function cloneBoard(board) {
  return board.map(row => [...row]);
}

export function cloneState(state) {
  const score = Number.isInteger(state.score) && state.score >= 0 ? state.score : 0;
  const rawHighScore = Number.isInteger(state.highScore) && state.highScore >= 0 ? state.highScore : 0;
  return {
    board: cloneBoard(state.board),
    previews: state.previews.map(p => ({ ...p })),
    score,
    highScore: Math.max(rawHighScore, score),
    selected: state.selected ? { ...state.selected } : null,
    gameOver: Boolean(state.gameOver),
    status: state.status,
    lastInvalidCell: state.lastInvalidCell ? { ...state.lastInvalidCell } : null,
    lastClearedCells: state.lastClearedCells ? state.lastClearedCells.map(c => ({ ...c })) : [],
  };
}

export function isInsideBoard(row, col) {
  return (
    Number.isInteger(row) &&
    Number.isInteger(col) &&
    row >= 0 &&
    row < GRID_SIZE &&
    col >= 0 &&
    col < GRID_SIZE
  );
}

export function getEmptyCells(board, excludedCoords = []) {
  const excluded = new Set(excludedCoords.map(c => `${c.row},${c.col}`));
  const empty = [];
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (board[row][col] === null && !excluded.has(`${row},${col}`)) {
        empty.push({ row, col });
      }
    }
  }
  return empty;
}

export function countPlacedBalls(board) {
  let count = 0;
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (board[row][col] !== null) count += 1;
    }
  }
  return count;
}

function pickRandomIndex(length, rng) {
  const idx = Math.floor(rng() * length);
  return Math.max(0, Math.min(length - 1, idx));
}

function pickRandomColor(rng) {
  return COLORS[pickRandomIndex(COLORS.length, rng)];
}

export function generatePreviewBalls(board, count = PREVIEW_COUNT, { rng = Math.random, excludedCoords = [] } = {}) {
  const available = getEmptyCells(board, excludedCoords);
  const targetCount = Math.min(count, available.length);
  const previews = [];
  for (let i = 0; i < targetCount; i += 1) {
    const idx = pickRandomIndex(available.length, rng);
    const [cell] = available.splice(idx, 1);
    previews.push({
      row: cell.row,
      col: cell.col,
      color: pickRandomColor(rng),
    });
  }
  return previews;
}

export function scoreForClearedCount(clearedCount) {
  if (clearedCount < MIN_LINE_LENGTH) return 0;
  return 10 + (clearedCount - MIN_LINE_LENGTH) * 2;
}

export function findLinesToClear(board) {
  const directions = [
    [0, 1],  // horizontal
    [1, 0],  // vertical
    [1, 1],  // diagonal down-right
    [1, -1], // diagonal down-left
  ];

  const matchedKeys = new Set();
  const matchedCells = [];
  let lineCount = 0;

  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      const color = board[r][c];
      if (!color) continue;

      for (const [dr, dc] of directions) {
        const prevR = r - dr;
        const prevC = c - dc;
        if (isInsideBoard(prevR, prevC) && board[prevR][prevC] === color) {
          continue; // Only start from the beginning of a contiguous run
        }

        const run = [{ row: r, col: c }];
        let nr = r + dr;
        let nc = c + dc;
        while (isInsideBoard(nr, nc) && board[nr][nc] === color) {
          run.push({ row: nr, col: nc });
          nr += dr;
          nc += dc;
        }

        if (run.length >= MIN_LINE_LENGTH) {
          lineCount += 1;
          for (const cell of run) {
            const key = `${cell.row},${cell.col}`;
            if (!matchedKeys.has(key)) {
              matchedKeys.add(key);
              matchedCells.push(cell);
            }
          }
        }
      }
    }
  }

  return {
    cells: matchedCells,
    lineCount,
    points: scoreForClearedCount(matchedCells.length),
  };
}

export function findPath(board, startRow, startCol, targetRow, targetCol) {
  if (!isInsideBoard(startRow, startCol) || !isInsideBoard(targetRow, targetCol)) {
    return null;
  }
  if (startRow === targetRow && startCol === targetCol) {
    return null;
  }
  if (board[startRow][startCol] === null) {
    return null;
  }
  if (board[targetRow][targetCol] !== null) {
    return null;
  }

  const visited = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
  const parent = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
  const queue = [{ row: startRow, col: startCol }];
  visited[startRow][startCol] = true;

  const deltas = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current.row === targetRow && current.col === targetCol) {
      const path = [];
      let step = current;
      while (step) {
        path.push({ row: step.row, col: step.col });
        step = parent[step.row][step.col];
      }
      path.reverse();
      return path;
    }

    for (const [dr, dc] of deltas) {
      const nr = current.row + dr;
      const nc = current.col + dc;
      if (isInsideBoard(nr, nc) && !visited[nr][nc] && board[nr][nc] === null) {
        visited[nr][nc] = true;
        parent[nr][nc] = current;
        queue.push({ row: nr, col: nc });
      }
    }
  }

  return null;
}

export function createInitialState({ rng = Math.random, highScore = 0 } = {}) {
  const board = createEmptyBoard();
  const empty = getEmptyCells(board);

  for (let i = 0; i < INITIAL_BALL_COUNT && empty.length > 0; i += 1) {
    const idx = pickRandomIndex(empty.length, rng);
    const [cell] = empty.splice(idx, 1);
    let color = pickRandomColor(rng);
    board[cell.row][cell.col] = color;

    if (findLinesToClear(board).cells.length > 0) {
      const altColor = COLORS.find(c => c !== color) || color;
      board[cell.row][cell.col] = altColor;
    }
  }

  const previews = generatePreviewBalls(board, PREVIEW_COUNT, { rng });
  const normalizedHighScore = Number.isInteger(highScore) && highScore >= 0 ? highScore : 0;

  return {
    board,
    previews,
    score: 0,
    highScore: normalizedHighScore,
    selected: null,
    gameOver: false,
    status: 'Select a ball to move along an open path.',
    lastInvalidCell: null,
    lastClearedCells: [],
  };
}

export function serializeState(state) {
  const score = Number.isInteger(state.score) && state.score >= 0 ? state.score : 0;
  const rawHighScore = Number.isInteger(state.highScore) && state.highScore >= 0 ? state.highScore : 0;
  return {
    board: cloneBoard(state.board),
    previews: state.previews.map(p => ({ row: p.row, col: p.col, color: p.color })),
    score,
    highScore: Math.max(rawHighScore, score),
    gameOver: Boolean(state.gameOver),
    status: typeof state.status === 'string' ? state.status : 'Select a ball to move along an open path.',
  };
}

export function validateSavedState(candidate) {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return null;
  }

  if (!Array.isArray(candidate.board) || candidate.board.length !== GRID_SIZE) {
    return null;
  }

  const board = createEmptyBoard();
  let placedCount = 0;
  for (let r = 0; r < GRID_SIZE; r += 1) {
    const row = candidate.board[r];
    if (!Array.isArray(row) || row.length !== GRID_SIZE) {
      return null;
    }
    for (let c = 0; c < GRID_SIZE; c += 1) {
      const cell = row[c];
      if (cell !== null && !COLORS.includes(cell)) {
        return null;
      }
      board[r][c] = cell;
      if (cell !== null) {
        placedCount += 1;
      }
    }
  }

  if (!Number.isInteger(candidate.score) || candidate.score < 0) {
    return null;
  }

  let rawHighScore = 0;
  if (candidate.highScore !== undefined) {
    if (!Number.isInteger(candidate.highScore) || candidate.highScore < 0) {
      return null;
    }
    rawHighScore = candidate.highScore;
  }

  if (typeof candidate.gameOver !== 'boolean') {
    return null;
  }

  const totalCells = GRID_SIZE * GRID_SIZE;
  const emptyCount = totalCells - placedCount;
  if (candidate.gameOver !== (placedCount === totalCells)) {
    return null;
  }

  if (!Array.isArray(candidate.previews)) {
    return null;
  }

  const maxPreviews = Math.min(PREVIEW_COUNT, emptyCount);
  if (candidate.gameOver) {
    if (candidate.previews.length !== 0) {
      return null;
    }
  } else if (emptyCount > 0) {
    if (candidate.previews.length < 1 || candidate.previews.length > maxPreviews) {
      return null;
    }
  }

  const previews = [];
  const seenCoords = new Set();
  for (const item of candidate.previews) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return null;
    }
    const { row, col, color } = item;
    if (!isInsideBoard(row, col) || !COLORS.includes(color)) {
      return null;
    }
    if (board[row][col] !== null) {
      return null;
    }
    const key = `${row},${col}`;
    if (seenCoords.has(key)) {
      return null;
    }
    seenCoords.add(key);
    previews.push({ row, col, color });
  }

  const score = candidate.score;
  const highScore = Math.max(rawHighScore, score);
  const gameOver = candidate.gameOver;
  const status = typeof candidate.status === 'string' && candidate.status.trim().length > 0
    ? candidate.status
    : (gameOver
      ? `Game Over — Final Score: ${score}`
      : 'Select a ball to move along an open path.');

  return {
    board,
    previews,
    score,
    highScore,
    selected: null,
    gameOver,
    status,
    lastInvalidCell: null,
    lastClearedCells: [],
  };
}

export function loadSavedState(storage = getDefaultStorage()) {
  if (!storage || typeof storage.getItem !== 'function') {
    return null;
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (typeof raw !== 'string' || raw.trim() === '') {
      return null;
    }
    const parsed = JSON.parse(raw);
    return validateSavedState(parsed);
  } catch {
    return null;
  }
}

export function saveState(state, storage = getDefaultStorage()) {
  if (!storage || typeof storage.setItem !== 'function') {
    return false;
  }
  const validated = validateSavedState(state);
  if (!validated) {
    return false;
  }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(serializeState(validated)));
    return true;
  } catch {
    return false;
  }
}

export function applyMove(state, targetRow, targetCol, { rng = Math.random } = {}) {
  if (state.gameOver) {
    return {
      ...cloneState(state),
      status: `Game Over — Final Score: ${state.score}. Start a New Game to play again.`,
      lastInvalidCell: { row: targetRow, col: targetCol },
    };
  }

  if (!state.selected) {
    return {
      ...cloneState(state),
      status: 'Select a placed ball first.',
      lastInvalidCell: { row: targetRow, col: targetCol },
    };
  }

  const { row: startRow, col: startCol } = state.selected;
  const path = findPath(state.board, startRow, startCol, targetRow, targetCol);
  if (!path) {
    return {
      ...cloneState(state),
      status: 'No clear path to that cell. Orthogonal empty/preview path required.',
      lastInvalidCell: { row: targetRow, col: targetCol },
      lastClearedCells: [],
    };
  }

  const next = cloneState(state);
  const movingColor = next.board[startRow][startCol];
  next.board[startRow][startCol] = null;
  next.board[targetRow][targetCol] = movingColor;
  next.selected = null;
  next.lastInvalidCell = null;
  next.lastClearedCells = [];

  const steppedPreviewIndex = next.previews.findIndex(
    p => p.row === targetRow && p.col === targetCol
  );

  // Check if the player's move itself clears a line of 5+
  const moveClear = findLinesToClear(next.board);
  if (moveClear.cells.length > 0) {
    for (const cell of moveClear.cells) {
      next.board[cell.row][cell.col] = null;
    }
    next.score += moveClear.points;
    next.highScore = Math.max(next.highScore || 0, next.score);
    next.lastClearedCells = moveClear.cells;

    // If the winning move stepped onto a preview cell, relocate that displaced preview to another free cell
    if (steppedPreviewIndex !== -1) {
      const displacedPreview = next.previews[steppedPreviewIndex];
      const otherPreviews = next.previews.filter((_, idx) => idx !== steppedPreviewIndex);
      const candidates = getEmptyCells(next.board, [
        ...otherPreviews,
        { row: targetRow, col: targetCol },
      ]);
      const fallbackCandidates = candidates.length > 0
        ? candidates
        : getEmptyCells(next.board, otherPreviews);

      if (fallbackCandidates.length > 0) {
        const chosen = fallbackCandidates[pickRandomIndex(fallbackCandidates.length, rng)];
        next.previews[steppedPreviewIndex] = {
          row: chosen.row,
          col: chosen.col,
          color: displacedPreview.color,
        };
      } else {
        next.previews.splice(steppedPreviewIndex, 1);
      }
    }

    next.status = `Cleared ${moveClear.cells.length} balls! +${moveClear.points} points (bonus turn — no balls spawned).`;
    return next;
  }

  // Move did NOT clear a line: spawn the previewed balls onto the board
  const directPreviews = [];
  const displacedPreviews = [];
  for (const preview of next.previews) {
    if (next.board[preview.row][preview.col] === null) {
      directPreviews.push(preview);
    } else {
      displacedPreviews.push(preview);
    }
  }

  for (const preview of directPreviews) {
    next.board[preview.row][preview.col] = preview.color;
  }

  for (const preview of displacedPreviews) {
    const emptyCells = getEmptyCells(next.board);
    if (emptyCells.length > 0) {
      const target = emptyCells[pickRandomIndex(emptyCells.length, rng)];
      next.board[target.row][target.col] = preview.color;
    }
  }

  // Check if any newly spawned ball completed a line of 5+
  const spawnClear = findLinesToClear(next.board);
  if (spawnClear.cells.length > 0) {
    for (const cell of spawnClear.cells) {
      next.board[cell.row][cell.col] = null;
    }
    next.score += spawnClear.points;
    next.highScore = Math.max(next.highScore || 0, next.score);
    next.lastClearedCells = spawnClear.cells;
  }

  // Check if board is now full (81 balls)
  const remainingEmpty = getEmptyCells(next.board);
  if (remainingEmpty.length === 0) {
    next.previews = [];
    next.gameOver = true;
    next.status = `Game Over — Final Score: ${next.score}`;
    return next;
  }

  // Generate 3 new upcoming preview balls
  next.previews = generatePreviewBalls(next.board, PREVIEW_COUNT, { rng });

  if (spawnClear.cells.length > 0) {
    next.status = `Spawned balls completed a line of ${spawnClear.cells.length}! +${spawnClear.points} points.`;
  } else if (displacedPreviews.length > 0) {
    next.status = 'Moved onto a preview cell; displaced preview spawned on another free cell.';
  } else {
    next.status = 'Ball moved. 3 new balls spawned.';
  }

  return next;
}

export function handleCellClick(state, row, col, { rng = Math.random } = {}) {
  if (!isInsideBoard(row, col)) {
    return cloneState(state);
  }

  if (state.gameOver) {
    return {
      ...cloneState(state),
      status: `Game Over — Final Score: ${state.score}. Click "New Game" to play again.`,
      lastInvalidCell: { row, col },
    };
  }

  const clickedColor = state.board[row][col];
  if (clickedColor !== null) {
    const next = cloneState(state);
    next.selected = { row, col };
    next.lastInvalidCell = null;
    next.lastClearedCells = [];
    const info = COLOR_INFO[clickedColor] || { label: clickedColor };
    next.status = `Selected ${info.label} ball at (${row + 1}, ${col + 1}). Choose an empty or preview cell.`;
    return next;
  }

  if (!state.selected) {
    const next = cloneState(state);
    next.lastInvalidCell = { row, col };
    next.lastClearedCells = [];
    next.status = 'Select a placed ball first before choosing a destination cell.';
    return next;
  }

  return applyMove(state, row, col, { rng });
}

export function initGameApp(doc = document, { rng = Math.random, storage } = {}) {
  const boardEl = doc.getElementById('game-board');
  const scoreEl = doc.getElementById('score-value');
  const highScoreEl = doc.getElementById('high-score-value');
  const statusEl = doc.getElementById('status-message');
  const newGameBtn = doc.getElementById('new-game-btn');
  const gameOverBanner = doc.getElementById('game-over-banner');
  const gameOverScoreEl = doc.getElementById('game-over-score');
  const previewLegendEl = doc.getElementById('upcoming-swatches');

  if (!boardEl || !scoreEl || !statusEl || !newGameBtn) {
    return null;
  }

  const activeStorage = storage !== undefined ? storage : getDefaultStorage();
  const restored = loadSavedState(activeStorage);
  let state = restored || createInitialState({ rng, highScore: 0 });
  saveState(state, activeStorage);

  function render() {
    scoreEl.textContent = String(state.score);
    if (highScoreEl) {
      highScoreEl.textContent = String(state.highScore);
    }
    statusEl.textContent = state.status;
    statusEl.dataset.state = state.gameOver
      ? 'game-over'
      : state.lastInvalidCell
        ? 'error'
        : 'normal';

    if (gameOverBanner) {
      gameOverBanner.hidden = !state.gameOver;
      if (gameOverScoreEl) {
        gameOverScoreEl.textContent = String(state.score);
      }
    }

    if (previewLegendEl) {
      previewLegendEl.innerHTML = '';
      for (const preview of state.previews) {
        const info = COLOR_INFO[preview.color] || { label: preview.color, short: '?' };
        const chip = doc.createElement('span');
        chip.className = `preview-chip ball-color-${preview.color}`;
        chip.title = `${info.label} at row ${preview.row + 1}, col ${preview.col + 1}`;
        chip.setAttribute('aria-label', `${info.label} preview at row ${preview.row + 1}, col ${preview.col + 1}`);
        previewLegendEl.appendChild(chip);
      }
    }

    const previewMap = new Map();
    for (const preview of state.previews) {
      previewMap.set(`${preview.row},${preview.col}`, preview.color);
    }

    boardEl.innerHTML = '';
    for (let r = 0; r < GRID_SIZE; r += 1) {
      for (let c = 0; c < GRID_SIZE; c += 1) {
        const cellBtn = doc.createElement('button');
        cellBtn.type = 'button';
        cellBtn.className = 'board-cell';
        cellBtn.dataset.row = String(r);
        cellBtn.dataset.col = String(c);

        const placedColor = state.board[r][c];
        const previewColor = previewMap.get(`${r},${c}`) || null;
        const isSelected = Boolean(
          state.selected && state.selected.row === r && state.selected.col === c
        );
        const isInvalid = Boolean(
          state.lastInvalidCell && state.lastInvalidCell.row === r && state.lastInvalidCell.col === c
        );

        if (placedColor) {
          cellBtn.dataset.ball = placedColor;
          cellBtn.dataset.cellState = 'placed';
          if (isSelected) {
            cellBtn.classList.add('is-selected');
          }
          const info = COLOR_INFO[placedColor] || { label: placedColor, short: '' };
          cellBtn.setAttribute(
            'aria-label',
            `Row ${r + 1}, Column ${c + 1}: ${info.label} ball${isSelected ? ' (selected)' : ''}`
          );

          const ballEl = doc.createElement('span');
          ballEl.className = `ball placed-ball ball-color-${placedColor}`;
          ballEl.dataset.symbol = info.short;
          cellBtn.appendChild(ballEl);
        } else if (previewColor) {
          cellBtn.dataset.preview = previewColor;
          cellBtn.dataset.cellState = 'preview';
          const info = COLOR_INFO[previewColor] || { label: previewColor, short: '' };
          cellBtn.setAttribute(
            'aria-label',
            `Row ${r + 1}, Column ${c + 1}: upcoming ${info.label} preview ball`
          );

          const previewEl = doc.createElement('span');
          previewEl.className = `ball preview-ball ball-color-${previewColor}`;
          previewEl.dataset.symbol = info.short;
          cellBtn.appendChild(previewEl);
        } else {
          cellBtn.dataset.cellState = 'empty';
          cellBtn.setAttribute('aria-label', `Row ${r + 1}, Column ${c + 1}: empty cell`);
        }

        if (isInvalid) {
          cellBtn.classList.add('is-invalid');
        }

        cellBtn.addEventListener('click', () => {
          state = handleCellClick(state, r, c, { rng });
          saveState(state, activeStorage);
          render();
        });

        boardEl.appendChild(cellBtn);
      }
    }
  }

  function resetToNewGame() {
    const preservedHighScore = Math.max(state.highScore || 0, state.score || 0);
    state = createInitialState({ rng, highScore: preservedHighScore });
    saveState(state, activeStorage);
    render();
    return cloneState(state);
  }

  newGameBtn.addEventListener('click', () => {
    resetToNewGame();
  });

  render();

  const controller = {
    getState: () => cloneState(state),
    setState: (nextState) => {
      state = cloneState(nextState);
      saveState(state, activeStorage);
      render();
    },
    clickCell: (r, c) => {
      state = handleCellClick(state, r, c, { rng });
      saveState(state, activeStorage);
      render();
      return cloneState(state);
    },
    resetGame: () => resetToNewGame(),
  };

  if (typeof window !== 'undefined') {
    window.__colorLinesApp = controller;
  }

  return controller;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initGameApp(document));
  } else {
    initGameApp(document);
  }
}
