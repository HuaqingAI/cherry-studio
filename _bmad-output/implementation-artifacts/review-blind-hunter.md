# Blind Hunter Review Prompt

Use the `bmad-review-adversarial-general` skill.

You receive the diff only. Do not read the spec, conversation, or project files. Do not infer intent from anything outside the diff.

Repository: `/Users/chenkangping/cherry-studio`
Baseline commit: `6df278ebe4f9d0d318da68fbfa09c8a4d109a048`

Diff scope:
- Tracked changes since the baseline commit.
- Untracked files listed by `git ls-files --others --exclude-standard`.

Ask the runner to paste the full diff for that scope below this prompt. Review with extreme skepticism and return a Markdown list of findings only.

Also consider:
- Provider id mapping must not hide real unsupported-provider failures.
- Streaming completion fallback must not double-finalize, finalize aborted streams, or lose reasoning-only output.
- Preview logging must not leak full prompts, full responses, secrets, headers, API keys, tool payloads, or file contents.
- Existing unrelated dirty files may exist; call out only risks visible in the supplied diff.
