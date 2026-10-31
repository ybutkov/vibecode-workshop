# Project plan

## Goal

A player visiting our team's live URL on desktop or phone can play a complete local session of Classic Color Lines ($9 \times 9$) — seeing semi-transparent on-board previews of the 3 upcoming balls, moving balls along unblocked orthogonal paths (including onto preview cells), clearing horizontal/vertical/diagonal lines of 5+ for points, keeping their active game and high score across page reloads, and restarting after Game Over. See [IDEA.md](IDEA.md) for full rules.

## Working model

Project lead → one milestone lead → one step at a time through coder → independent reviewer → committer. Each milestone has one lead session. Each step names a human owner and the real agent sessions used. The lead records blockers here; it does not invent an approval.

## M1 — First useful live journey

Milestone lead: assign a fresh session (`milestone-lead`). Human owner: UNCLE. Release: only after the team accepts the journey and receives the organiser guest handout.

| Step | Outcome | Depends on | Human owner | State / PR |
|---|---|---|---|---|
| M1.1 | Our fork runs at the assigned URL and reports its deployed revision | Team access / organiser handout | UNCLE | blocked (no SSH/URL handout yet) |
| M1.2 | The player can complete the core Color Lines gameplay loop on desktop and phone | Starter repo (local) | UNCLE | merged ([PR #1](https://github.com/ybutkov/vibecode-workshop/pull/1)) |
| M1.3 | The player's active board, preview, score, and high score survive page reloads (`localStorage`) | M1.2 | UNCLE | merged ([PR #2](https://github.com/ybutkov/vibecode-workshop/pull/2)) |
| M1.4 | A teammate can complete the whole journey on desktop and phone; observed failures are corrected | M1.3 | UNCLE | ready |

### M1.1 — The live starting point (Blocked on organiser SSH/URL handout)

- [ ] Every teammate has access to the same team fork (`ybutkov/vibecode-workshop`).
- [ ] The assigned SSH connection reaches our team environment (`vc-team`).
- [ ] Our page is reachable at the assigned HTTPS URL (`https://team-NN.intra.land`).
- [ ] `/api/health` reports the revision we intended to deploy.
- [ ] Another teammate opens the page on a phone.

### M1.2 — Core action (Playable Color Lines 9×9)

- **Normal input:**
  - [x] Opening the page renders a $9 \times 9$ board with initial balls, 3 semi-transparent upcoming preview balls on their target cells, current score, and a "New Game" button.
  - [x] Selecting a ball highlights it; clicking an empty cell (or a preview cell) with an unblocked orthogonal path moves the ball there.
  - [x] If the move does not form a line of 5+, the 3 previewed balls spawn (if the player stepped onto a preview cell, that ball spawns on another random empty cell) and 3 new transparent preview balls appear.
  - [x] If a move **or** a newly spawned ball forms 5 or more matching balls horizontally, vertically, or diagonally, those balls clear from the board and increase the score (and if cleared by the player's move, no new balls spawn that turn).
- **Empty / Reset state:**
  - [x] Clicking "New Game" resets the score to 0 and starts a fresh $9 \times 9$ board with initial balls and 3 previews.
- **Failure / Blocked cases:**
  - [x] Clicking an unreachable cell (no unblocked orthogonal path) rejects the move with clear visual feedback and does not consume the turn.
  - [x] When the board fills completely (81 balls), the game displays a clear Game Over state and allows starting a new game.

### M1.3 — Persistence (Local browser session)

- [x] **What survives:** Reloading the page in the same browser restores the exact in-progress $9 \times 9$ board, the 3 upcoming preview positions/colors, the current score, the personal high score, and Game Over status from `localStorage`.
- [x] **Fallback / Corrupted state:** If `localStorage` is empty or contains invalid data, the app cleanly initializes a fresh game without crashing.

### M1.4 — Feedback

- Record one observed user problem from a teammate testing on desktop/phone, the resulting acceptance criterion, and the result after correction. Add new scope as a new step instead of hiding it inside a fix.

## M2 — Improve the demonstrated journey

Plan only after M1 gives you evidence. Add the next useful milestone or stop and prepare the demo.
