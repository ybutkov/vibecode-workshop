# M1.2 — Playable Color Lines 9×9 core gameplay loop

## Summary

Implements the complete local in-memory gameplay loop for Classic Color Lines (Lines 98) on a $9 \times 9$ grid for desktop and phone viewports:

- **Core game mechanics (`public/game.js`):**
  - $9 \times 9$ grid (`81` cells), 7 distinct high-contrast ball colors, 5 initial placed balls, and 3 semi-transparent on-board upcoming preview balls shown directly on their future target cells.
  - Orthogonal (up/down/left/right) BFS pathfinding through empty or preview-occupied cells (`findPath`).
  - Stepping onto a preview cell relocates the displaced preview ball to another random free cell when balls spawn (or preserves 3 valid previews when the player's move clears a line).
  - Horizontal, vertical, and diagonal 5+ line detection and clearing (`findLinesToClear`), awarding `10 + (count - 5) * 2` points and skipping ball spawning on clearing player moves, plus automatic clearing when newly spawned balls complete a 5+ line.
  - Clear visual feedback for blocked/unreachable moves, `Game Over` banner when all 81 cells fill, and `"New Game"` reset at any time.
- **Responsive UI & Server whitelist (`public/index.html`, `public/style.css`, `server.mjs`):**
  - High-contrast dark theme fitting comfortably within both desktop (`1280×800`) and phone (`375×667`) viewports without horizontal overflow.
  - Added `/game.js` to the explicit `assets` whitelist in `server.mjs` while keeping `/api/health` and `404` rejection for all unmapped and traversal paths.
- **Automated & Browser verification (`test/app.test.mjs`, `test/game.test.mjs`):**
  - `27/27` automated tests passing (`npm test`).
  - Real headless Chrome verification at `1280×800` and `375×667` across the full user journey with zero console/page errors.

## Commit & Review Audit

- **Step:** `M1.2`
- **Branch:** `m1.2-playable-color-lines`
- **Base SHA:** `d1038f1bfa86dbcbb250e952e49247e1dcd38701` (`d1038f1`)
- **Implementation SHA:** `9a1f1ec3213ea9a279a3aded1957dcaa37034889` (`9a1f1ec`)
- **Reviewed SHA:** `701ece51c76ff56374b9852b984ece7ecb39e83c` (`701ece5`) — Verdict: **APPROVE**

## Evidence

- Step brief: `.ai/work/M1.2/brief.md`
- Coder validation: `.ai/work/M1.2/validation.md`
- Independent review: `.ai/work/M1.2/review.md`

## Sessions

- **Human owner:** UNCLE
- **Milestone lead:** `a0774d1e-26ce-4509-bb44-979fd6af3260`
- **Coder:** `cb74b5cb-2f7d-4992-89a8-b0d556ecc958`
- **Reviewer:** `76cdfaa7-ad7a-45b1-a48a-e91bd1a7f1c7`
- **Committer:** `58fc76bf-8158-4b34-b76b-dcf860f00302`
