# M1.2 review

Base SHA: `d1038f1bfa86dbcbb250e952e49247e1dcd38701` (`d1038f1`)
Head SHA: `701ece51c76ff56374b9852b984ece7ecb39e83c` (`701ece5`, implementation commit `9a1f1ec3213ea9a279a3aded1957dcaa37034889` / `9a1f1ec`)
Reviewer session/provider: `76cdfaa7-ad7a-45b1-a48a-e91bd1a7f1c7` (Gemini — independent reviewer session)

## What I checked

1. **Git history, SHA integrity, and commit hygiene:**
   - Ran `git rev-parse HEAD` and verified `701ece51c76ff56374b9852b984ece7ecb39e83c` on branch `m1.2-playable-color-lines`.
   - Inspected `git log --format=fuller d1038f1bfa86dbcbb250e952e49247e1dcd38701..HEAD` (`a9326ef`, `9a1f1ec`, `701ece5`) and `git diff --stat d1038f1bfa86dbcbb250e952e49247e1dcd38701..HEAD`.
   - Confirmed commit messages contain zero `Co-authored-by:`, `Generated with`, or AI attribution trailers.
   - Confirmed `localStorage` is not used anywhere in `public/` or `server.mjs` (`grep -rn "localStorage" public/ server.mjs` returned no matches), respecting the `M1.3` persistence scope boundary.

2. **Acceptance criteria mapped to committed diff, automated tests, and independent browser checks:**
   - **Normal case — Initial state & HUD (`public/index.html`, `public/style.css`, `public/game.js`):**
     - `public/index.html` renders `<h1>Color Lines</h1>`, `#score-value` (`0`), `#upcoming-swatches`, `#new-game-btn` (`"New Game"`), `#status-message`, `#game-over-banner` (`hidden`), and `#game-board`.
     - `createInitialState()` in `public/game.js` initializes a $9 \times 9$ grid (`81` cells), places `5` initial balls (preventing accidental 5-in-a-row on initial deal), and places `3` upcoming preview balls on distinct empty cells.
     - Verified in unit test `createInitialState creates a 9x9 board with 5 placed balls, 3 previews on empty cells, and score 0` and in headless Chrome (`totalCells: 81`, `placedCount: 5`, `previewCount: 3`, `placedOpacity: "1"`, `previewOpacity: "0.4"`).
   - **Normal case — Selection & valid orthogonal movement (`public/game.js` `findPath`, `handleCellClick`, `applyMove`):**
     - Clicking a placed ball highlights it (`.is-selected`); clicking a different placed ball switches `.is-selected` to the newly clicked ball (`sel1: true`, `sel2: true` in browser check).
     - `findPath()` uses 4-directional (`[-1,0], [1,0], [0,-1], [0,1]`) BFS over cells where `board[nr][nc] === null` (which includes both empty and preview-occupied cells, since preview balls live in `state.previews` rather than `state.board`).
   - **Normal case — Turn spawn & stepping onto a preview cell (`public/game.js` lines 284–346):**
     - When a move does not clear a line, `directPreviews` materialize on their target cells and any `displacedPreviews` (where the player moved onto the preview's cell) are relocated to a random remaining empty cell via `getEmptyCells(next.board)`, followed by generating `3` new previews.
     - Verified both in `test/game.test.mjs` and in our independent browser journey (`movedToPreviewCell: true`, `totalPlacedAfterPreviewStep: 6` starting from 3 placed balls + 3 spawned previews).
   - **Normal case — Clearing lines of 5+ on player move and post-spawn (`public/game.js` `findLinesToClear`, `applyMove`):**
     - `findLinesToClear()` scans all 4 axes (`[0,1]`, `[1,0]`, `[1,1]`, `[1,-1]`) from run starts and collects all unique cells belonging to contiguous runs of length `>= 5`, scoring `10 + (clearedCount - 5) * 2`.
     - When a player move clears a 5+ line, no new balls spawn on that turn (`previewsAfterDiagClear: 3`, `placedAfterDiagClear: 0`, `scoreAfterDiagClear: "10"`), and if the winning move stepped onto a preview cell, that displaced preview is relocated to another free cell.
     - When a non-clearing move spawns the 3 previewed balls and one of those newly spawned balls completes a 5+ line, `spawnClear` immediately clears the line and awards points (`scoreAfterSpawnClear: "20"`, `placedAfterSpawnClear: 3`).
   - **Empty / reset & failure cases (`public/game.js`):**
     - **Blocked path:** Clicking an unreachable cell sets `lastInvalidCell`, adds `.is-invalid` shake feedback (`blockedInvalidClass: true`), sets `#status-message` (`data-state="error"`) to `"No clear path to that cell. Orthogonal empty/preview path required."`, preserves selection (`blockedKeptSelection: true`), and does not spawn balls.
     - **Game Over:** Filling all 81 cells sets `gameOver: true`, empties `previews`, reveals `#game-over-banner` (`gameOverBannerVisible: true`, `gameOverPlaced: 81`), and blocks further moves.
     - **New Game reset:** Clicking `#new-game-btn` resets score to `"0"`, hides `#game-over-banner` (`resetBannerHidden: true`), and deals `5` placed balls and `3` previews.
   - **Access/data boundary & server contract (`server.mjs`, `test/app.test.mjs`, `test/deploy.test.mjs`):**
     - `server.mjs` maps only `/`, `/style.css`, and `/game.js` in `assets`, plus `/api/health`. Traversal and repo files (`/.env`, `/AGENTS.md`, `/package.json`, `/.git/config`, `/%2e%2e/.env`, `/public/../server.mjs`) return `404`.
     - Re-ran `npm test` independently: all `27/27` tests pass (`0` failures).
   - **Independent browser verification (Desktop `1280×800` & Phone `375×667`):**
     - Started `createApp()` on an ephemeral localhost port and ran headless Google Chrome via CDP at `1280×800` and `375×667`, then stopped both Chrome and the local server.
     - **Desktop (`1280×800`):** Board `496×496px`, cells `49.8×49.8px`, dark surface `rgb(21, 23, 28)` (`#15171c`), `scrollWidth = 1280 <= innerWidth 1280`, `scrollHeight = 800 <= innerHeight 800` (zero horizontal or vertical overflow).
     - **Phone (`375×667`):** Board `356×356px`, cells `35.6×35.6px` (`>= 34px` requirement met), `scrollWidth = 375 <= innerWidth 375`, `scrollHeight = 667 <= innerHeight 667` (zero horizontal or vertical overflow).
     - **Console / page errors:** `0` console errors and `0` uncaught page exceptions across both viewports and the full interactive journey.

3. **Skipped checks / limits:**
   - Remote guest deployment (`npm run deploy` / `npm run smoke`) is outside `M1.2` scope and remains gated on `M1.1` (organiser SSH/URL handout).
   - Browser reload persistence (`localStorage`) is scoped to `M1.3`.

## Findings

No blocking or non-blocking defects found.

## Verdict

**APPROVE** — Commit `701ece51c76ff56374b9852b984ece7ecb39e83c` (implementation commit `9a1f1ec3213ea9a279a3aded1957dcaa37034889` from base `d1038f1bfa86dbcbb250e952e49247e1dcd38701`) satisfies every acceptance criterion, visual design constraint, access boundary, and responsive browser verification requirement in `.ai/work/M1.2/brief.md`.
