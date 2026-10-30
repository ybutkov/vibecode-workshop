import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GRID_SIZE,
  INITIAL_BALL_COUNT,
  PREVIEW_COUNT,
  COLORS,
  createEmptyBoard,
  countPlacedBalls,
  createInitialState,
  findPath,
  findLinesToClear,
  handleCellClick,
} from '../public/game.js';

function makeDeterministicRng(seed = 42) {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

test('createInitialState creates a 9x9 board with 5 placed balls, 3 previews on empty cells, and score 0', () => {
  const rng = makeDeterministicRng(101);
  const state = createInitialState({ rng });

  assert.equal(state.board.length, GRID_SIZE);
  for (const row of state.board) {
    assert.equal(row.length, GRID_SIZE);
  }
  assert.equal(countPlacedBalls(state.board), INITIAL_BALL_COUNT);
  assert.equal(state.previews.length, PREVIEW_COUNT);
  assert.equal(state.score, 0);
  assert.equal(state.gameOver, false);
  assert.equal(state.selected, null);

  const previewKeys = new Set();
  for (const p of state.previews) {
    assert.ok(COLORS.includes(p.color));
    assert.equal(state.board[p.row][p.col], null, 'Preview must be on an empty board cell');
    previewKeys.add(`${p.row},${p.col}`);
  }
  assert.equal(previewKeys.size, PREVIEW_COUNT, 'All 3 previews must occupy distinct cells');
});

test('selection and orthogonal pathfinding allow valid moves and reject blocked paths', () => {
  const board = createEmptyBoard();
  board[0][0] = 'red';
  board[0][1] = 'blue';
  board[1][0] = 'green';
  board[2][2] = 'yellow';

  // (0,0) is boxed in orthogonally by (0,1) and (1,0); diagonal (1,1) is not orthogonal
  assert.equal(findPath(board, 0, 0, 1, 1), null);

  // (2,2) has an open orthogonal path to (0,2)
  const path = findPath(board, 2, 2, 0, 2);
  assert.ok(Array.isArray(path));
  assert.deepEqual(path[0], { row: 2, col: 2 });
  assert.deepEqual(path[path.length - 1], { row: 0, col: 2 });

  const initialState = {
    board,
    previews: [
      { row: 8, col: 6, color: 'cyan' },
      { row: 8, col: 7, color: 'purple' },
      { row: 8, col: 8, color: 'orange' },
    ],
    score: 0,
    selected: null,
    gameOver: false,
    status: 'Ready',
    lastInvalidCell: null,
    lastClearedCells: [],
  };

  // Selecting (0,0) then switching selection to (0,1), then back to (0,0)
  let state = handleCellClick(initialState, 0, 0);
  assert.deepEqual(state.selected, { row: 0, col: 0 });
  state = handleCellClick(state, 0, 1);
  assert.deepEqual(state.selected, { row: 0, col: 1 });
  state = handleCellClick(state, 0, 0);
  assert.deepEqual(state.selected, { row: 0, col: 0 });

  // Clicking unreachable (1,1) from boxed-in (0,0) rejects move, keeps selection, does not spawn previews
  const blocked = handleCellClick(state, 1, 1);
  assert.deepEqual(blocked.selected, { row: 0, col: 0 });
  assert.deepEqual(blocked.lastInvalidCell, { row: 1, col: 1 });
  assert.equal(blocked.board[0][0], 'red');
  assert.equal(blocked.board[1][1], null);
  assert.equal(countPlacedBalls(blocked.board), 4);
  assert.match(blocked.status, /No clear path/i);
});

test('stepping onto a preview cell relocates the displaced preview ball to another free cell on spawn', () => {
  const board = createEmptyBoard();
  board[0][0] = 'red';

  const state = {
    board,
    previews: [
      { row: 0, col: 3, color: 'blue' },   // player will step onto this preview cell
      { row: 4, col: 4, color: 'green' },
      { row: 5, col: 5, color: 'yellow' },
    ],
    score: 0,
    selected: { row: 0, col: 0 },
    gameOver: false,
    status: 'Selected',
    lastInvalidCell: null,
    lastClearedCells: [],
  };

  const rng = makeDeterministicRng(7);
  const next = handleCellClick(state, 0, 3, { rng });

  // Red moved to (0,3)
  assert.equal(next.board[0][0] !== 'red', true);
  assert.equal(next.board[0][3], 'red');
  // Non-displaced previews materialized at (4,4) and (5,5)
  assert.equal(next.board[4][4], 'green');
  assert.equal(next.board[5][5], 'yellow');
  // Displaced 'blue' preview spawned on another cell, so total placed balls is 1 + 3 = 4
  assert.equal(countPlacedBalls(next.board), 4);
  let foundRelocatedBlue = false;
  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      if (next.board[r][c] === 'blue') {
        assert.notDeepEqual({ row: r, col: c }, { row: 0, col: 3 });
        foundRelocatedBlue = true;
      }
    }
  }
  assert.equal(foundRelocatedBlue, true);
  assert.equal(next.previews.length, 3);
});

test('clearing 5+ lines horizontally, vertically, and diagonally awards points and skips spawning on player move', () => {
  // Check findLinesToClear across horizontal, vertical, and both diagonals
  const diagBoard = createEmptyBoard();
  for (let i = 0; i < 5; i += 1) {
    diagBoard[i][i] = 'purple';
    diagBoard[i][5 - i] = 'cyan';
  }
  const diagClear = findLinesToClear(diagBoard);
  assert.equal(diagClear.lineCount, 2);
  assert.equal(diagClear.cells.length, 10);
  assert.ok(diagClear.points > 0);

  // Player move completing a horizontal line of 5 does not spawn previews
  const board = createEmptyBoard();
  board[2][0] = 'red';
  board[2][1] = 'red';
  board[2][2] = 'red';
  board[2][3] = 'red';
  board[0][4] = 'red'; // will move to (2,4)

  const state = {
    board,
    previews: [
      { row: 2, col: 4, color: 'blue' }, // preview on the winning destination cell
      { row: 7, col: 7, color: 'green' },
      { row: 7, col: 8, color: 'yellow' },
    ],
    score: 0,
    selected: { row: 0, col: 4 },
    gameOver: false,
    status: 'Selected',
    lastInvalidCell: null,
    lastClearedCells: [],
  };

  const next = handleCellClick(state, 2, 4, { rng: makeDeterministicRng(99) });
  assert.equal(next.score, 10);
  assert.equal(countPlacedBalls(next.board), 0, 'All 5 red balls cleared and no preview balls spawned');
  assert.equal(next.previews.length, 3, '3 previews remain active');
  assert.notDeepEqual(
    { row: next.previews[0].row, col: next.previews[0].col },
    { row: 2, col: 4 },
    'Displaced preview on winning cell was relocated to another free cell'
  );
});

test('newly spawned balls completing a 5+ vertical line automatically clear and award points', () => {
  const board = createEmptyBoard();
  board[0][0] = 'orange';
  // 4 green balls waiting in column 8
  board[1][8] = 'green';
  board[2][8] = 'green';
  board[3][8] = 'green';
  board[4][8] = 'green';

  const state = {
    board,
    previews: [
      { row: 5, col: 8, color: 'green' }, // spawning this completes a vertical 5-line
      { row: 8, col: 0, color: 'blue' },
      { row: 8, col: 1, color: 'yellow' },
    ],
    score: 0,
    selected: { row: 0, col: 0 },
    gameOver: false,
    status: 'Selected',
    lastInvalidCell: null,
    lastClearedCells: [],
  };

  const next = handleCellClick(state, 0, 1, { rng: makeDeterministicRng(15) });
  // The 5 green balls in col 8 should be automatically cleared
  for (let r = 1; r <= 5; r += 1) {
    assert.equal(next.board[r][8], null);
  }
  assert.equal(next.score, 10);
  assert.equal(next.board[0][1], 'orange');
  assert.equal(next.board[8][0], 'blue');
  assert.equal(next.board[8][1], 'yellow');
});

test('filling all 81 cells triggers Game Over and blocks further moves', () => {
  const board = createEmptyBoard();
  // Fill 78 cells with non-matching pattern so no 5-line forms
  const palette = ['red', 'blue', 'green', 'yellow', 'purple', 'cyan'];
  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      board[r][c] = palette[(r * 2 + c) % palette.length];
    }
  }
  // Leave 3 empty cells: (0,1), (0,2), (0,3)
  board[0][1] = null;
  board[0][2] = null;
  board[0][3] = null;

  const state = {
    board,
    previews: [
      { row: 0, col: 1, color: 'orange' },
      { row: 0, col: 2, color: 'orange' },
      { row: 0, col: 3, color: 'orange' },
    ],
    score: 20,
    selected: { row: 0, col: 0 },
    gameOver: false,
    status: 'Selected',
    lastInvalidCell: null,
    lastClearedCells: [],
  };

  // Move (0,0) -> (0,1); then the 3 orange previews fill (0,2), (0,3), and displaced (0,0) -> 81 balls
  const endState = handleCellClick(state, 0, 1, { rng: makeDeterministicRng(3) });
  assert.equal(countPlacedBalls(endState.board), 81);
  assert.equal(endState.gameOver, true);
  assert.equal(endState.previews.length, 0);
  assert.match(endState.status, /Game Over/i);

  // Clicking when gameOver is true does not select or move
  const afterOver = handleCellClick(endState, 0, 1);
  assert.equal(afterOver.gameOver, true);
  assert.equal(afterOver.selected, null);
});
