# Constraints learned from this project

- The workshop reverse proxy expects the app on port 3000. The starter binds to 0.0.0.0.
- Only files under public/ are web assets. Never expose the repository root or .env files.
- `/api/health` returns the app status and deployed revision; do not put secrets in it.
- Deployments use archived commits in separate release directories. Durable data belongs outside those directories, for example under `~/.local/share/vibecode-workshop/data/`.
- Workshop DNS, SSH access and containers are organiser-managed. Use assigned connection details.
- Deployment runs on the assigned Linux guest as `vc-team` with no sudo. The guest provides `/etc/vc-guest-contract` containing `user-app-v1`, the lingering user unit `vc-app.service`, and a `~/workshop` placeholder that deploy must not rewrite. It is not a laptop tool. `npm run deploy:preview` changes nothing and can run elsewhere.
- Never add `Co-authored-by:`, `Generated with`, AI attribution trailers, or session links to git commit messages or PR descriptions.
- By default, `Milestone Lead` orchestrates `Coder`, `Reviewer`, and `Committer` sequentially via `invoke_subagent` (`TypeName: "self"`, `Workspace: "inherit"`) so each role runs in an isolated session context while sharing the repository checkout one writer at a time.
- Always pass `--repo ybutkov/vibecode-workshop` to `gh pr` commands so PRs target the team fork rather than the upstream starter repo.
- Always stop any background local server started during testing/browser checks before finishing a session so port `3000` is not left occupied.

Add constraints when code or observed behaviour establishes them. Workflow rules live in AGENTS.md.
