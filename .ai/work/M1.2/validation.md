# M1.2 Validation — Playable Color Lines 9×9 core gameplay loop

## SHAs and session metadata

- **Step:** `M1.2`
- **Branch:** `m1.2-playable-color-lines`
- **Base SHA:** `d1038f1bfa86dbcbb250e952e49247e1dcd38701` (`d1038f1`)
- **Implementation SHA:** `9a1f1ec3213ea9a279a3aded1957dcaa37034889` (`9a1f1ec`)
- **Coder session:** `cb74b5cb-2f7d-4992-89a8-b0d556ecc958`

## Summary of changes

1. **`server.mjs`:** Added `['/game.js', ['game.js', 'text/javascript; charset=utf-8']]` to the strict `assets` whitelist while keeping `/api/health` and `404` rejection for all unmapped/traversal paths intact.
2. **`public/game.js`:** Implemented pure deterministic Color Lines $9 \times 9$ state and rules functions (`createEmptyBoard`, `createInitialState`, `findPath`, `findLinesToClear`, `applyMove`, `handleCellClick`, `initGameApp`) exported as an ES module with no top-level DOM side effects in Node (`if (typeof document !== 'undefined')` guards browser initialization). Supports:
   - $9 \times 9$ grid (`81` cells), 7 high-contrast ball colors, 5 initial placed balls, and 3 upcoming preview balls on their target empty cells.
   - Orthogonal (up/down/left/right) BFS pathfinding through empty or preview-occupied cells (`findPath`).
   - Stepping onto a preview cell and relocating the displaced preview ball to another random free cell when balls spawn (or keeping 3 valid previews when the move clears a line).
   - Horizontal, vertical, and both diagonal 5+ line detection and clearing (`findLinesToClear`), awarding points (`10 + (count - 5) * 2`) without spawning balls on a clearing player move, plus automatic 5+ line clearing when newly spawned balls complete a line.
   - `Game Over` detection when all 81 cells are occupied (`remainingEmpty.length === 0`), blocking further moves until `"New Game"` is clicked.
   - Deliberately excludes `localStorage` persistence (scoped to `M1.3`).
3. **`public/index.html` & `public/style.css`:** Implemented the responsive dark UI (`#15171c` surface, `#1e222a`/`#252a34` board/cells, `#ff8b54` accent, `<h1>Color Lines</h1>` header, HUD with Score, Next 3 swatches, `"New Game"` button, status bar, Game Over alert banner, and $9 \times 9$ square board with full-opacity placed balls and `0.4` opacity dashed-ring preview balls inside their target cells).
4. **`test/app.test.mjs` & `test/game.test.mjs`:** Added HTTP test coverage for `/game.js` and unit tests covering initial state, selection and orthogonal pathfinding, blocked paths, preview displacement, 5+ horizontal/vertical/diagonal clearing, post-spawn auto-clearing, and 81-ball Game Over.

## Automated tests run

Command:
```bash
npm test
```

Result (`27/27` passing, exit code `0`):
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
ℹ tests 27 | pass 27 | fail 0
```

## Real browser verification (Desktop `1280×800` & Phone `375×667`)

Verified using headless Google Chrome (`/usr/bin/google-chrome --headless=new`) connected via Chrome DevTools Protocol against `createApp()` listening on an ephemeral localhost port (server and browser processes terminated cleanly on completion):

- **Desktop (`1280×800`):**
  - Renders `<h1>Color Lines</h1>`, score `0`, status message, `"New Game"` button, and `81` `.board-cell` buttons (`5` placed balls with computed `opacity: 1`, `3` preview balls on their target cells with computed `opacity: 0.4` and smaller dashed-ring scale).
  - Board dimensions: `496×496px`, individual cell size: `50×50px`.
  - Viewport fit: `scrollWidth = 1280` (`<= innerWidth 1280`), `scrollHeight = 800` (`<= innerHeight 800`) — zero horizontal or vertical overflow.
- **Phone (`375×667`):**
  - Compact stacked header/HUD above the square $9 \times 9$ grid.
  - Board dimensions: `356×356px`, individual cell size: `35.6×35.6px` (`>= 34px` touch-friendly requirement).
  - Viewport fit: `scrollWidth = 375` (`<= innerWidth 375`), `scrollHeight = 667` (`<= innerHeight 667`) — zero horizontal overflow.
- **Interactive user journey exercised via real DOM `.click()` events:**
  - **Selection & switching:** Clicking a placed ball adds `.is-selected` (`firstSelected: true`); clicking another placed ball switches `.is-selected` to the second ball (`switchedSelected: true`); clicking an orthogonally reachable empty cell moves the ball there (`destStateAfterClick: "placed"`), spawns the 3 previewed balls (`placedCountAfterTurn: 8`), and generates 3 new previews (`previewCountAfterTurn: 3`).
  - **Stepping onto a preview cell:** Clicking a placed ball at `(0,0)` and clicking a preview-occupied cell at `(0,2)` moves the ball to `(0,2)` and relocates the displaced preview ball to another free cell so all 4 balls are placed (`placedCount: 4`, status `"Moved onto a preview cell; displaced preview spawned on another free cell."`).
  - **Blocked move rejection:** Clicking a boxed-in ball at `(0,0)` (blocked by `(0,1)` and `(1,0)`) and clicking unreachable `(1,1)` applies `.is-invalid` to `(1,1)`, keeps `(0,0)` selected (`selectionKept: true`), does not spawn balls (`placedCountUnchanged: 3`), and updates `#status-message` (`data-state="error"`) to `"No clear path to that cell. Orthogonal empty/preview path required."`.
  - **Clearing a 5+ line:** Moving the 5th red ball into row 0 (`(1,4)` -> `(0,4)`) clears all 5 balls (`placedCountAfterClear: 0`), updates `#score-value` to `"10"`, keeps `previewCountAfterClear: 3` without spawning balls, and displays `"Cleared 5 balls! +10 points (bonus turn — no balls spawned)."`.
  - **Game Over & New Game reset:** Moving a ball when 3 empty cells remain spawns the final 3 balls (`placedAtGameOver: 81`), reveals `#game-over-banner` (`"Game Over — Final Score: 40. Press New Game to play again."`), and clicking `#new-game-btn` hides the banner, resets `#score-value` to `"0"`, and deals `5` placed balls and `3` previews.
- **Console / Page errors:** `0` console errors, `0` uncaught page exceptions, `0` failed network requests.

## Limitations / Scope boundary

- In-memory session state only, as required by `.ai/work/M1.2/brief.md`. Browser reload persistence via `localStorage` is scoped to step `M1.3`.
