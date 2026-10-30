# M1.3 Validation — Local browser session persistence (`localStorage`)

## SHAs and session metadata

- **Step:** `M1.3`
- **Branch:** `m1.3-local-storage-persistence`
- **Base SHA:** `f7afe0e0780df5d54ee9a884c9ae5eb114a1bef2` (`f7afe0e`)
- **Implementation SHA:** `0eb03408844b67e247cee85503c94c5c8e9d336f` (`0eb0340`)
- **Coder session:** `497a0904-87dd-410f-aabd-7c71a7755233`

## Summary of changes

1. **`public/index.html` & `public/style.css`:**
   - Added the `Best` personal high score HUD stat (`<strong id="high-score-value" class="hud-score">0</strong>`) inside `.hud-bar` next to `Score`.
   - Adjusted mobile `.hud-bar`, `.hud-stat`, `.hud-score`, `.preview-chip`, and `.new-game-btn` sizing so `Score`, `Best`, `Next 3`, and `"New Game"` fit cleanly at both desktop (`1280×800`) and phone (`375×667`) widths with zero horizontal/vertical overflow (`scrollWidth <= innerWidth`, `scrollHeight <= innerHeight`) and `>= 34px` board cells.
2. **`public/game.js`:**
   - Added `highScore` to game state (`createInitialState`, `cloneState`, `applyMove`), updating `highScore = Math.max(highScore, score)` whenever lines clear via player move or post-spawn clear, and preserving `highScore` across `"New Game"` resets.
   - Exported pure persistence and validation helpers (`STORAGE_KEY = 'colorLines.session.v1'`, `serializeState`, `validateSavedState`, `loadSavedState`, `saveState`) with zero top-level DOM/window side effects when imported in Node.
   - `validateSavedState` validates that `board` is a $9 \times 9$ array of `null` or valid `COLORS`, `previews` is a valid array of `{ row, col, color }` with distinct coordinates pointing to `null` board cells (with count consistent with `gameOver` and empty cells), `score` and `highScore` are non-negative integers (`highScore = Math.max(highScore, score)`), and `gameOver` is a boolean matching `countPlacedBalls(board) === 81`.
   - `loadSavedState` and `saveState` guard storage access in `try / catch` and safely return `null` / `false` when `localStorage` is empty, throws an exception, contains malformed JSON, or fails validation.
   - `initGameApp(doc, { rng, storage })` restores saved state on startup (or creates and saves a fresh state if empty/corrupted), renders `#high-score-value`, and persists state on every cell click, `"New Game"` reset (preserving `highScore`), and `setState`.
3. **`test/game.test.mjs`:**
   - Added unit tests covering saving and restoring active board, previews, score, highScore, and 81-ball Game Over state; preserving `highScore` across `"New Game"`; and rejecting empty storage, malformed JSON, invalid board dimensions, unknown colors, overlapping/duplicate/out-of-bounds previews, negative/non-integer scores, inconsistent `gameOver`, and storage exceptions.

## Automated tests run

Command:
```bash
npm test
```

Result (`29/29` passing, exit code `0`):
```text
✔ page, CSS and health are reachable and health identifies the served revision
✔ repository files and traversal requests cannot be downloaded
✔ HEAD has no body and unsupported writes are rejected
✔ drop-in points the user service at a release without a system user or privilege directive
✔ preview names an uninstalled release and does not require the guest
✔ unsafe service interpolation is rejected before any unit can be installed
✔ guest guard accepts only the image contract and refuses each missing marker
✔ deploy refuses a dirty tree, a non-main branch, and the placeholder checkout
✔ releases cannot occupy the placeholder or application data
✔ recovery restores the previous drop-in or falls back to the placeholder unit
✔ deploy helper does not call a privilege tool or install a system unit
✔ prune keeps the active release and the rollback release
✔ a first deploy keeps only the active release when rollback is the placeholder
✔ an unreadable previous drop-in does not prune
✔ prune refuses paths outside the releases directory and deletes nothing
✔ install and build stay under the 3GiB guest limit
✔ memory delegation recognises only the memory controller
✔ deploy lock rejects a second holder and releases when the holder dies
✔ health wait failure format captures observations, expected revision, shape and vc-app logs
✔ memory scope OOM detection recognises scope Result oom-kill and signals
✔ smoke resolves local health on workshop guest and public health on laptop
✔ createInitialState creates a 9x9 board with 5 placed balls, 3 previews on empty cells, and score 0
✔ selection and orthogonal pathfinding allow valid moves and reject blocked paths
✔ stepping onto a preview cell relocates the displaced preview ball to another free cell on spawn
✔ clearing 5+ lines horizontally, vertically, and diagonally awards points and skips spawning on player move
✔ newly spawned balls completing a 5+ vertical line automatically clear and award points
✔ filling all 81 cells triggers Game Over and blocks further moves
✔ saveState and loadSavedState persist and restore active board, previews, score, highScore, and Game Over
✔ validateSavedState and loadSavedState reject empty, malformed, or invalid state and handle storage exceptions safely
ℹ tests 29 | pass 29 | fail 0
```

## Real browser verification (Desktop `1280×800` & Phone `375×667`)

Verified using headless Google Chrome (`/usr/bin/google-chrome --headless=new`) connected via Chrome DevTools Protocol against `createApp()` listening on an ephemeral localhost port (both server and browser processes terminated cleanly on completion):

1. **Active session & high score survive reload (`location.reload()`):**
   - At both `1280×800` and `375×667`, played a 5-ball line-clearing move (`(1,4)` -> `(3,4)`) bringing `#score-value` to `"10"` and `#high-score-value` to `"10"`, with `2` remaining placed balls and `3` upcoming previews.
   - Reloaded the page (`Page.reload`) and verified the exact $9 \times 9$ board array, the exact 3 preview coordinates/colors, `#score-value === "10"`, `#high-score-value === "10"`, `2` placed DOM balls, and `3` preview DOM balls were restored from `localStorage`.
2. **High score survives `"New Game"` reset and subsequent reload:**
   - Clicked `#new-game-btn` (`"New Game"`), confirming `#score-value` reset to `"0"`, `5` placed balls and `3` previews were dealt, while `#high-score-value` remained `"10"`.
   - Reloaded the page again and confirmed `#score-value === "0"` and `#high-score-value === "10"` persisted.
3. **Game Over state survives reload:**
   - Triggered `Game Over` (81 placed balls, `score: 28`, `highScore: 28`), reloaded the page, and verified `#game-over-banner` remained visible (`hidden === false`), `81` placed balls rendered on the grid (`0` previews), `#score-value === "28"`, and `#high-score-value === "28"`.
4. **Corrupted JSON and invalid state structure recovery:**
   - Wrote malformed JSON (`"{corrupted-json"`) to `localStorage.setItem('colorLines.session.v1', ...)` and reloaded: app cleanly initialized a fresh playable game (`5` placed balls, `3` previews, `#score-value === "0"`, `#high-score-value === "0"`, `#game-over-banner` hidden) with `0` console or page errors.
   - Wrote structurally invalid JSON (`board: [[null]]`, out-of-bounds preview `{ row: 99, col: 99, color: 'invalid' }`, `score: -10`, `highScore: -5`, `gameOver: 'nope'`) and reloaded: app cleanly initialized a fresh playable game (`5` placed balls, `3` previews, `0` errors).
5. **Responsive layout & touch cell dimensions:**
   - **Desktop (`1280×800`):** `scrollWidth = 1280 <= innerWidth = 1280`, `scrollHeight = 800 <= innerHeight = 800` (both normal and Game Over states); board `496×496px`, cell size `49.8×49.8px`.
   - **Phone (`375×667`):** `scrollWidth = 375 <= innerWidth = 375`, `scrollHeight = 667 <= innerHeight = 667` (both normal and Game Over states); board `356.3×356.3px`, cell size `35.6×35.6px` (`>= 34px`).
   - **Console / Page errors:** `0` console errors, `0` uncaught page exceptions.
