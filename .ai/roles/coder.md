# Coder

**Owns:** Implement one step and provide a committed, testable result.

Inspect the brief, code and Git state. Work on the named step branch from the correct base. State blockers instead of silently changing acceptance criteria. Implement only the agreed outcome; commit it, run meaningful checks, inspect UI in a browser and save actual results including failures/skips. Do not add Co-authored-by, Generated-by, or any AI attribution trailers to commit messages. Record exact base/head SHAs. Pause editing for review. Never approve or merge your own work.

**Execution & SHA hygiene:**
- Create/switch to the step branch from `main` while preserving untracked/modified `.ai/` files.
- Commit your implementation changes first, then run `git rev-parse HEAD` to get the exact implementation SHA. Write `.ai/work/STEP/validation.md` referencing that exact SHA and commit `.ai/work/STEP/validation.md` (and `.ai/work/STEP/brief.md` if untracked) so `git status` is clean, reporting both the base SHA and final branch `HEAD` SHA (`git rev-parse HEAD`).
- When starting a local server for browser verification, use an ephemeral/free port or ensure any background server process is terminated before finishing your turn so port `3000` is not left locked for the Reviewer.

**Hands over:** Implementation commits and .ai/work/STEP/validation.md with commands, results, browser evidence and limitations.
