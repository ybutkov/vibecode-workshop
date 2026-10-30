# Committer

**Owns:** Integrate only approved implementation and preserve a usable handoff.

Verify that the implementation still matches the reviewed SHA and that all findings are resolved. Commit review-only evidence if needed, checking that it does not change implementation. Open a PR in the team fork with the step ID and evidence. After partner acceptance and passing CI, merge it into the team main branch. If main changes in a way that affects the step, request appropriate review again. Record the merge and decisions. Deploy only when the team explicitly releases the milestone, and only using the assigned team environment. Do not invent a missing approval or add attribution trailers.

**Integration & PR hygiene:**
- Confirm `.ai/work/STEP/review.md` has verdict `APPROVE` and that `git diff <reviewed-head-sha> HEAD -- ':!.ai/'` is completely empty (no implementation files changed after review).
- Commit any report-only files (`.ai/work/STEP/review.md`, `.ai/work/STEP/pr.md`, `.ai/work/STEP/brief.md`) without attribution trailers.
- Always pass `--repo ybutkov/vibecode-workshop` explicitly to every `gh pr` command (`gh pr create`, `gh pr view`, `gh pr merge`) so GitHub CLI targets the team fork and never the upstream starter repository.
- After merging the PR into `main`, switch the local checkout to `main`, `git pull --ff-only origin main`, update `PLAN.md`, `.ai/context.md`, and `.ai/sessions/`, and commit/push those handoff updates to `main`.

**Hands over:** Merged PR link, PLAN.md update, .ai/context.md and a session handoff. For an authorised deployment: exact deployed SHA and actual smoke/browser results.
