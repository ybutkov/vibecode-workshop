# M1.3 — Local browser session persistence (`localStorage`)

## Outcome

A player playing Classic Color Lines ($9 \times 9$) on desktop or phone keeps their active in-progress board, the 3 upcoming preview ball positions and colors, their current score, their personal high score (`Best`), and Game Over status across browser page reloads via `localStorage` — while starting a `"New Game"` resets the board and current score to `0` without losing the personal high score, and empty or corrupted `localStorage` data safely initializes a clean game without crashing.

## Audit

- **Base SHA:** `f7afe0e0780df5d54ee9a884c9ae5eb114a1bef2` (short: `f7afe0e` on `main`, matching `origin/main` after merging `M1.2` via [PR #1](https://github.com/ybutkov/vibecode-workshop/pull/1) at `40c81a7c41a190e40c04e24d802ee7afac700287`).
- **Milestone state (`PLAN.md`):**
  - `M1.1` remains blocked awaiting the organiser SSH/URL handout.
  - `M1.2` is merged (`40c81a7`).
  - `M1.3` depends on `M1.2` and is **ready** for implementation on branch `m1.3-local-storage-persistence`.
- **Relevant files and starting behaviour checked:**
  - `public/game.js`: Exports deterministic game logic (`createEmptyBoard`, `createInitialState`, `findPath`, `findLinesToClear`, `applyMove`, `handleCellClick`, `initGameApp`) with zero `localStorage` integration and no `highScore` field yet. `initGameApp` currently initializes an in-memory `createInitialState({ rng })` on every page load.
  - `public/index.html` & `public/style.css`: Render the dark-palette header, `.hud-bar` (`Score`, `Next 3` swatches, `"New Game"` button), `#status-message`, `#game-over-banner`, and `#game-board`. There is no HUD display for the player's personal high score (`Best`) yet.
  - `test/app.test.mjs`, `test/deploy.test.mjs`, `test/game.test.mjs`: `npm test` currently runs `27` tests (`27/27` passing).

## Visual design reference (desktop and phone)

- **HUD High Score (`Best`) stat:** Add a compact `.hud-stat` block in `.hud-bar` displaying label `Best` and `<strong id="high-score-value" class="hud-score">0</strong>` next to `Score`.
- **Responsive layout preservation:**
  - **Desktop (`1280×800`):** Header with `Score`, `Best`, `Next 3`, and `"New Game"` plus status bar and $9 \times 9$ board fit within `1280×800` with zero horizontal or vertical overflow (`scrollWidth <= innerWidth`, `scrollHeight <= innerHeight`).
  - **Phone (`375×667`):** Compact `.hud-bar` wraps or scales cleanly so `Score`, `Best`, `Next 3`, and `"New Game"` remain legible and all `81` board cells remain `>= 34px` square with zero horizontal or vertical overflow (`scrollWidth <= innerWidth`, `scrollHeight <= innerHeight`).

## Acceptance

- [ ] **Normal case — Active session & high score survive page reload:**
  - Making moves (changing board positions, upcoming previews, current score, and personal high score) and reloading the page in the same browser restores the exact $9 \times 9$ placed balls, the exact upcoming preview balls (positions and colors), the current score, the personal high score (`#high-score-value`), and `gameOver` status from `localStorage`.
  - Whenever `score` increases above `highScore` (via player move line-clear or post-spawn line-clear), `highScore` updates immediately in state, DOM (`#high-score-value`), and `localStorage`.
- [ ] **Normal case — High score survives `"New Game"` reset and Game Over:**
  - Reaching a positive score/high score and clicking `"New Game"` (either mid-game or after `Game Over`) resets the board to 5 initial placed balls, 3 upcoming previews, `score: 0`, and `gameOver: false`, while **preserving** `highScore` in both the HUD (`#high-score-value`) and `localStorage` across subsequent reloads.
  - Reloading the page while in `Game Over` state restores the full 81-ball board, `Game Over` banner (`#game-over-banner` visible with final score), `score`, and `highScore`, blocking board moves until `"New Game"` is clicked.
- [ ] **Empty, corrupted, or unavailable `localStorage` fallback cases:**
  - **Empty storage:** When `localStorage` has no saved key, the app initializes a fresh valid game (`5` placed balls, `3` previews, `score: 0`, `highScore: 0`, `gameOver: false`) without errors.
  - **Corrupted JSON or invalid state shape:** If `localStorage` contains malformed JSON (e.g. `"{bad-json"`) or structurally invalid state (wrong board dimensions, unknown ball color, preview coordinate out of bounds or overlapping a placed ball, negative/non-integer score, etc.), the app ignores the corrupted state, initializes a clean fresh game without throwing any console/page error, and overwrites storage with valid state on the next save.
  - **Storage exceptions:** If `storage.getItem` or `storage.setItem` throws (e.g. disabled storage / quota error), the game continues functioning in-memory without uncaught exceptions.
- [ ] **Access/data boundary & module contract:**
  - Pure persistence and validation functions (e.g. `STORAGE_KEY`, `serializeState` / `validateSavedState`, `loadSavedState`, `saveState`) are exported from `public/game.js` without top-level DOM/window side effects so `node --test` unit tests in `test/game.test.mjs` can deterministically test saving, restoring, high score preservation across resets, and corrupted-data fallbacks.
  - Existing HTTP and deploy contracts (`test/app.test.mjs`, `test/deploy.test.mjs`, `/api/health`, `404` on non-whitelisted paths) remain intact.
- [ ] **Browser task (desktop and phone verification required):**
  - Run the app locally and verify in a real headless browser at both **desktop (`1280×800`)** and **phone (`375×667`)** viewports:
    1. Play a turn and score points so `score > 0` and `highScore > 0`, reload the page (`location.reload()`), and verify the exact board, previews, score (`#score-value`), and high score (`#high-score-value`) are restored.
    2. Click `"New Game"`, verify `#score-value` resets to `0` while `#high-score-value` retains the high score, reload again, and confirm `#high-score-value` still persists.
    3. Trigger `Game Over` (81 balls), reload the page, and confirm `#game-over-banner` and all 81 balls persist after reload.
    4. Write corrupted data into `localStorage` (both malformed JSON and invalid board/preview structure), reload the page, and verify the app cleanly recovers to a fresh playable board with `0` console/page errors.
    5. Confirm `scrollWidth <= innerWidth`, `scrollHeight <= innerHeight`, and phone cell size `>= 34px` at both viewports, then stop the local server process.

## Boundaries and dependencies

- **Depends on:** `M1.2` merged on `main` at `f7afe0e0780df5d54ee9a884c9ae5eb114a1bef2`.
- **Must remain true:**
  - Zero external npm runtime dependencies; `npm test` passes all HTTP, deploy, and game unit tests.
  - Server whitelist in `server.mjs` and `/api/health` contract remain unchanged.
- **Outside this step (`M1.3` boundary):**
  - Teammate observation and feedback fix (`M1.4`) and remote guest deployment (`M1.1`).

## Handoff

- **Human owner:** UNCLE
- **Milestone lead session:** `a0774d1e-26ce-4509-bb44-979fd6af3260` (Gemini)
- **Branch:** `m1.3-local-storage-persistence` (to be branched from `main` at `f7afe0e0780df5d54ee9a884c9ae5eb114a1bef2`)
- **Coder session:** Pending dispatch
- **Independent reviewer session:** Pending coder completion
- **Committer session:** Pending reviewer `APPROVE`
- **Evidence paths:**
  - Brief: `.ai/work/M1.3/brief.md`
  - Validation (coder): `.ai/work/M1.3/validation.md`
  - Review (reviewer): `.ai/work/M1.3/review.md`
  - PR body (committer): `.ai/work/M1.3/pr.md`
