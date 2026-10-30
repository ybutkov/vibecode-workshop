# M1.2 — Playable Color Lines 9×9 core gameplay loop (desktop and phone)

## Outcome

A player opening the app locally on desktop or phone can play a complete in-memory session of Classic Color Lines (Lines 98) on a $9 \times 9$ grid: seeing initial balls and 3 semi-transparent on-board upcoming preview balls on their target cells, selecting and moving balls along unblocked orthogonal paths (including stepping onto preview cells, which relocates the displaced preview ball to another free cell when balls spawn), clearing horizontal, vertical, or diagonal lines of 5 or more matching balls to score points without spawning new balls on that turn (and automatically clearing any 5+ line formed by newly spawned balls), seeing clear feedback on invalid/unreachable moves and on Game Over when all 81 cells fill, and resetting at any time with a "New Game" button.

## Audit

- **Base SHA:** `d1038f1bfa86dbcbb250e952e49247e1dcd38701` (short: `d1038f1` on `main`, matching `origin/main`).
- **Milestone state (`PLAN.md`):**
  - `M1.1` (remote guest deployment and public URL verification) is **blocked** awaiting the organiser's SSH/URL handout.
  - `M1.2` depends only on the local starter repository and is **ready** for implementation on branch `m1.2-playable-color-lines`.
- **Relevant files and starting behaviour checked:**
  - `server.mjs`: Serves `/api/health` (`200` JSON `{"ok": true, "revision": ...}`) and a strict `assets` whitelist currently mapping only `/` (`public/index.html`) and `/style.css` (`public/style.css`). Rejects non-`GET`/`HEAD` requests with `405` (`Allow: GET, HEAD`) and returns `404` for any unmapped path. **Assumption checked:** Adding client-side ES module scripts under `public/` (such as `public/game.js`) requires adding the explicit asset route (e.g. `['/game.js', ['game.js', 'text/javascript; charset=utf-8']]`) to `assets` in `server.mjs` while preserving `404` on all non-whitelisted and traversal paths.
  - `public/index.html` and `public/style.css`: Currently serve the static starter landing page using a dark palette (`#15171c` surface, `#f2eee6` text, `#ff8b54` accent, `#b9b4aa` muted copy, `#34363b` / `#55524b` borders). There is no game UI or client script yet.
  - `test/app.test.mjs` and `test/deploy.test.mjs`: `npm test` (`node --test`) currently passes (21/21 tests). Note: `test/app.test.mjs` asserts that `GET /` includes `<h1>`, `GET /style.css` returns `text/css`, `GET /api/health` returns `{ ok: true, revision }`, traversal/repo files return `404`, and `HEAD`/`POST` contracts hold.

## Visual design reference (desktop and phone)

Before UI implementation, the layout and visual states must follow this reference so coder and reviewer evaluate against the same target:

- **Theme & palette:** Preserve and extend the starter's high-contrast dark theme (`#15171c` page background, `#1e222a` / `#252a34` board/cell surfaces, `#34363b` / `#55524b` cell borders, `#f2eee6` primary text, `#b9b4aa` muted labels, `#ff8b54` interactive accent).
- **Distinct ball colors (6–7 high-contrast colors):** Each ball color must be visually distinct on dark cells (using radial gradients/highlights or distinct hues + accessible contrast/markers so colors are unmistakable on both desktop monitors and phone screens).
- **On-board upcoming preview balls:** The 3 upcoming balls are rendered directly inside their target empty board cells at reduced opacity (`opacity: 0.35`–`0.45`) and smaller scale (`~40%–55%` of a full ball diameter) or dashed ring so a player can immediately distinguish a **placed ball** (full size, `opacity: 1`) from an **upcoming preview ball** (small, semi-transparent, showing both future color and target cell).
- **Interactive states:**
  - **Selected ball:** Clear highlight ring/outline (e.g., `#ff8b54` or bright white glow + slight scale/pulse) on the active cell.
  - **Blocked / invalid move feedback:** Visible status message (e.g., `"No clear path to that cell"`) and/or brief cell shake/error border when clicking an occupied cell (other than switching selection to another placed ball) or an empty/preview cell with no unblocked orthogonal path.
  - **Game Over state:** Clear banner/overlay or status alert (`"Game Over — Final Score: N"`) when all 81 cells are occupied, with the `"New Game"` button immediately accessible.
- **Responsive layout:**
  - **Desktop (`1280×800`):** Centered single-screen layout where header (`<h1>` title), HUD bar (current score, turn status/feedback message, `"New Game"` button), and the square $9 \times 9$ board (`aspect-ratio: 1 / 1`, max width `min(72vh, 34rem)`) fit comfortably within the viewport without vertical or horizontal scrolling.
  - **Phone (`375×667` / `390×844`):** Compact stacked HUD above a full-width square $9 \times 9$ grid (`width: min(92vw, 24rem)`, `aspect-ratio: 1 / 1`) with touch-friendly cells (`>= 34px` square at `375px` width), zero horizontal overflow (`document.documentElement.scrollWidth <= window.innerWidth`), and both HUD controls and all 81 cells visible without page zoom.

## Acceptance

- [ ] **Normal case — Initial state & HUD:**
  - Opening `/` renders an `<h1>` game title, current score (`0`), status/feedback area, a `"New Game"` button, and a $9 \times 9$ grid (`81` addressable cells with coordinates/attributes).
  - A new game starts with initial placed balls (e.g., 5 random balls) and 3 semi-transparent upcoming preview balls displayed directly on their future board cells.
- [ ] **Normal case — Selection & valid orthogonal movement:**
  - Clicking/tapping a placed ball selects it (visually highlighted); clicking/tapping another placed ball switches the selection to that ball.
  - Clicking/tapping an empty cell or a preview-occupied cell that has an unblocked orthogonal (up/down/left/right) path of empty/preview-only cells moves the selected ball to that destination cell.
- [ ] **Normal case — Turn spawn & stepping onto a preview cell:**
  - If the player's move does **not** complete a line of 5+, the 3 previewed balls materialize as full placed balls on their previewed cells, and 3 new semi-transparent preview balls are generated on random remaining free cells (or fewer if fewer than 3 empty cells remain).
  - If the player moved their ball onto a cell holding a preview ball, that displaced preview ball is relocated and spawns on another random free cell during that turn's spawn phase.
- [ ] **Normal case — Clearing lines of 5+ (move and post-spawn):**
  - Aligning 5 or more balls of the same color horizontally, vertically, or in either diagonal clears all balls belonging to any matched 5+ line(s) and increases the score.
  - When a player's move clears a line of 5+, **no** preview balls spawn on that turn (the existing 3 preview balls remain as previews; if the winning move stepped onto a preview cell, that displaced preview is relocated to another free cell so 3 previews remain valid).
  - When a newly spawned ball after a non-clearing move completes a line of 5+ horizontally, vertically, or diagonally, that line automatically clears and awards points immediately.
- [ ] **Empty / reset & failure cases:**
  - **Blocked path:** Clicking/tapping an empty or preview cell when no unblocked orthogonal path exists rejects the move, displays clear user-visible feedback, keeps the current turn/selection intact, and does not spawn balls.
  - **New Game reset:** Clicking `"New Game"` at any time (mid-game or after Game Over) resets the score to `0`, clears Game Over state, and deals a fresh $9 \times 9$ board with initial balls and 3 previews.
  - **Game Over:** When the board reaches 81 placed balls (no empty cells remain after spawning or when the last empty cells fill without clearing a line), the game enters and displays a clear `Game Over` state and blocks further moves until `"New Game"` is clicked.
- [ ] **Access/data boundary & server contract:**
  - Only whitelisted assets under `public/` (`/`, `/style.css`, and any explicit game JS module such as `/game.js`) and `/api/health` are served (`GET`/`HEAD` only).
  - Repository files and traversal paths (`/.env`, `/AGENTS.md`, `/package.json`, `/.git/config`, `/%2e%2e/.env`, `/public/../server.mjs`) continue returning `404`.
  - Pure game state/rules logic in `public/game.js` is exported as an ES module without top-level DOM side effects so `node --test` unit tests can import and verify deterministic board scenarios (orthogonal BFS/pathfinding, preview displacement, 5+ horizontal/vertical/diagonal clearing, post-spawn auto-clear, and 81-ball Game Over) alongside HTTP tests in `test/app.test.mjs` and `test/deploy.test.mjs`.
- [ ] **Browser task (desktop and phone verification required):**
  - Run the app locally (`npm start`) and inspect the live page in a real browser at both **desktop (`1280×800`)** and **phone (`375×667`)** viewports.
  - Exercise the user journey in the browser: initial render (placed balls + 3 semi-transparent on-board previews), valid move along an orthogonal path, stepping onto a preview cell, blocked move rejection feedback, clearing a 5+ line with score increase, Game Over state, and `"New Game"` reset.
  - Confirm zero console/page errors and no horizontal overflow at either viewport width. Record actual browser verification details in `.ai/work/M1.2/validation.md` and `.ai/work/M1.2/review.md`.

## Boundaries and dependencies

- **Depends on:** Starter repository on `main` at base SHA `d1038f1bfa86dbcbb250e952e49247e1dcd38701` (`d1038f1`). Does **not** depend on `M1.1` (blocked on organiser SSH/URL handout).
- **Must remain true:**
  - Zero external npm runtime dependencies (`package.json` scripts `start`, `test`, `doctor`, `deploy:preview`, `deploy`, `smoke` and `scripts/` remain intact).
  - `/api/health` continues to return HTTP 200 `{"ok": true, "revision": ...}`.
  - `GET /` still renders an `<h1>` element and passes `test/app.test.mjs` and `test/deploy.test.mjs`.
- **Outside this step (`M1.2` boundary):**
  - Browser persistence across reloads (`localStorage` for board state, preview balls, score, and personal high score) belongs to **`M1.3`** — do not implement `localStorage` persistence in `M1.2`.
  - Remote guest deployment (`npm run deploy` / `npm run smoke`) belongs to **`M1.1`** once the organiser handout arrives.

## Handoff

- **Human owner:** UNCLE
- **Milestone lead session:** `a0774d1e-26ce-4509-bb44-979fd6af3260` (Gemini)
- **Branch:** `m1.2-playable-color-lines` (to be branched from `main` at `d1038f1bfa86dbcbb250e952e49247e1dcd38701`)
- **Coder session:** Pending dispatch — fresh session using `.ai/roles/coder.md` and `.ai/work/M1.2/brief.md`
- **Independent reviewer session:** Pending coder completion — separate fresh session (preferably a different model family) using `.ai/roles/reviewer.md`, `.ai/work/M1.2/brief.md`, committed diff, and `.ai/work/M1.2/validation.md`
- **Committer session:** Pending reviewer `APPROVE` — separate fresh session using `.ai/roles/committer.md` to open and merge the PR into `ybutkov/vibecode-workshop` `main`
- **Evidence paths:**
  - Brief: `.ai/work/M1.2/brief.md`
  - Validation (coder): `.ai/work/M1.2/validation.md`
  - Review (reviewer): `.ai/work/M1.2/review.md`
  - PR body (committer): `.ai/work/M1.2/pr.md`
