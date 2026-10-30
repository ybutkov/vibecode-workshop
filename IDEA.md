# The idea

Project: Classic Color Lines Game (Lines 98)

## Core Concept
A single-player, turn-based $9 \times 9$ grid puzzle game where a player arranges colored balls into lines of 5 or more to clear them and score points within their own local browser session.

## Rules & Constraints
- **Grid:** Played on a $9 \times 9$ board (starts with initial random balls and 3 upcoming preview balls).
- **Upcoming Preview:** 3 upcoming balls are displayed directly on their future board cells with semi-transparency (showing both color and position).
- **Movement:** Each turn, the player selects a ball and moves it to an empty (or preview-occupied) cell, provided there is an unblocked orthogonal (up/down/left/right) path of empty cells.
- **Stepping on Preview Cells:** A player may move their ball onto a cell showing an upcoming preview ball. If they do, that displaced preview ball spawns on another random free cell when the turn spawns balls.
- **Clearing Lines:** Aligning 5 or more balls of the same color horizontally, vertically, or diagonally clears all matching lines from the board and awards points.
- **Turn Flow:**
  - If the player's move clears a line of 5+, no new balls spawn on that turn.
  - If the player's move does not clear a line, the 3 previewed balls spawn onto the board (relocating any displaced preview ball to a free cell) and 3 new preview balls are generated.
  - If any newly spawned ball completes a line of 5+, that line automatically clears and awards points according to the 5-line rule.
- **Persistence:** Each player has their own local game session in the browser (`localStorage`): active board state, upcoming preview, current score, and personal high score survive page reloads.
- **Game Over:** The game ends when the board has no empty cells left and no valid moves remain. The player can start a new game at any time.
