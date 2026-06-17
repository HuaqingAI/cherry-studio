# Acceptance Auditor Review Prompt

You are the acceptance auditor for this BMAD implementation.

Repository: `/Users/chenkangping/cherry-studio`
Spec file: `_bmad-output/implementation-artifacts/spec-fix-chat-runtime-status-and-logging.md`
Baseline commit: `6df278ebe4f9d0d318da68fbfa09c8a4d109a048`
Required context doc from spec frontmatter: `CLAUDE.md`

Read the spec and required context doc before reviewing. Then review the diff scope:
- Tracked changes since the baseline commit.
- Untracked files listed by `git ls-files --others --exclude-standard`.

Check whether the implementation satisfies all acceptance criteria and repository rules relevant to this spec. Report findings as Markdown bullets with file/line references when possible.

Acceptance focus:
- Custom OpenAI-compatible provider chat should avoid normal-path `Provider ID not found in registered extensions, using as-is` warning while preserving real unsupported-provider visibility.
- New-api provider chat should keep runtime provider config on `newapi` and request the provider-facing API model id without changing internal selection ids.
- Natural stream close after visible text/reasoning should emit completion events so waiting/processing state finalizes.
- Abort/error streams must keep existing paused/error behavior.
- Chat logs should include only truncated user and assistant previews plus metadata, never full text or secrets.
- Verification evidence should include focused tests plus `pnpm lint`, `pnpm test`, and `pnpm format`.
