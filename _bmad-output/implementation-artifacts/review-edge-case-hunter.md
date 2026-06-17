# Edge Case Hunter Review Prompt

Use the `bmad-review-edge-case-hunter` skill.

Repository: `/Users/chenkangping/cherry-studio`
Baseline commit: `6df278ebe4f9d0d318da68fbfa09c8a4d109a048`

Diff scope:
- Tracked changes since the baseline commit.
- Untracked files listed by `git ls-files --others --exclude-standard`.

You may read project files, but when a diff is supplied, scan only the diff hunks and list boundaries directly reachable from changed lines that lack an explicit guard in the diff.

Return only the JSON array format required by the skill.

Also consider:
- Custom OpenAI-compatible providers versus system OpenAI-compatible providers such as Poe.
- New-api provider shims and provider-facing API model ids.
- Natural stream close without an AI SDK `finish` part.
- Abort/error streams, reasoning-only streams, empty text, duplicate completion events, and buffered web-search link text.
- Log preview truncation, whitespace normalization, empty previews, and leakage boundaries.
