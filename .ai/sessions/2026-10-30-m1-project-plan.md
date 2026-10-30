# Session — 2026-10-30 M1 project plan & goal agreement

## Decisions

- **Human owner:** UNCLE.
- **Core game rules (`IDEA.md`):** Classic Color Lines (Lines 98) on a $9 \times 9$ grid.
  - 3 upcoming balls are shown directly on their future board cells with semi-transparency (both color and position).
  - Players can move a ball along any unblocked orthogonal path onto an empty cell or a preview cell. Stepping onto a preview cell relocates that preview ball to another random free cell when the turn spawns balls.
  - Aligning 5+ balls of the same color horizontally, vertically, or diagonally clears the line and awards points.
  - If a move clears a line, no new balls spawn that turn. If a newly spawned ball completes a 5+ line, it also triggers the 5-line clear and awards points immediately.
- **Persistence boundary (`M1.3`):** Local browser session only (`localStorage`) — active board state, upcoming preview, current score, and personal high score survive page reloads.
- **Verification & stack:** Keep zero-dependency Node.js (`server.mjs`) and vanilla HTML/CSS/ES modules (`public/`) so `node --test` can unit-test pure game logic (`public/game.js`) alongside HTTP and browser verification.
- **Ordering (`M1.1` vs `M1.2`):** The team does not have the organiser SSH/URL handout yet, so `M1.1` is marked `blocked (no SSH/URL handout yet)` and `M1.2` is unblocked (`ready`) to proceed locally first.

## Handoff

- **State:** `IDEA.md`, `PLAN.md`, and `.ai/context.md` are updated and approved by UNCLE.
- **Next step:** Hand off to the **Milestone Lead** (`.ai/roles/milestone-lead.md`) to audit the starting state, write `.ai/work/M1.2/brief.md`, and coordinate `M1.2` (coder → reviewer → committer).
- **Half-done work:** None. Planning files (`IDEA.md`, `PLAN.md`, `.ai/context.md`, `.ai/pitfalls.md`, `.ai/rules.md`, `.ai/roles/coder.md`, `.gitignore`, and this session file) are committed on `main`.
- **Branch / reviewed SHA / PR:** `main` based on `c3e2c39`, no PR yet.
- **Checks and limitations:** No application code modified; remote guest deployment (`M1.1`) awaits organiser SSH/URL handout.
