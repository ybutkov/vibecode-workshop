# Pitfalls

Add incidents when they occur: date, symptom, cause, correction and how to detect recurrence. Do not turn guesses into historical incidents.

## 2026-10-30 — Stale commit SHA copied from markdown instead of Git

- **Date:** 2026-10-30
- **Symptom:** `.ai/sessions/2026-10-30-m1-project-plan.md` recorded `main` at `f11b2ea`, whereas the actual `HEAD` commit on `main` was `c3e2c39`.
- **Cause:** The Project Lead copied `f11b2ea` from the previous starter contents of `.ai/context.md` instead of querying Git directly.
- **Correction:** Verified `git rev-parse --short HEAD` (`c3e2c39`) and updated `.ai/sessions/2026-10-30-m1-project-plan.md`.
- **Detection:** Agents must always run `git rev-parse --short HEAD` (or `git log -1`) before recording any base, head, or reviewed SHA in session handoffs, briefs, validations, or reviews, and reviewers/leads must compare recorded SHAs against actual `git log` output.
