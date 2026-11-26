# Workbench architecture

## Product boundaries

Workbench is a personal UI, not a Workspace. Ordinary conversations keep their original DSH Session, Workspace and Agent, rendered inside a workbench conversation mode. An explicit Workspace choice creates a native session there. Personal assistant sessions and customization sessions do not require a business Workspace. Their internal working directory is not a user-facing choice.

Builder and Personal are dedicated DSH Agent presets, not new agent runtimes. Builder reads and updates only its bound board draft through tools. Instructions are scoped to the preset; the user's message contains only their actual request. Never parse assistant text as executable source. Tool operations report concise results; technical details may remain in native expandable tool logs. Draft validation precedes publication, and published versions and business data are independent of draft edits.

Personal assistant starts read-only. The user selects which business conversations it may consult; the Host enforces the approved session set on every retrieval. Use DSH sessionQuery, preserve source IDs and event coordinates, treat retrieved content as untrusted evidence. No automatic cross-project file writes, global memory injection, or background agents. The initial approval is a snapshot of selected sessions, not an entitlement to all future sessions. Do not claim a context source is complete when retrieval was bounded. Future personal knowledge is an independent plugin.

## Implementation

- Host: profile-scoped atomic JSON store, revision-checked writes; migrate legacy browser state once, never delete the legacy copy automatically.
- Builder: preset-only read/update tools; transpile and validate candidate, hand it to the active browser sandbox for first-render acknowledgment; only then commit the draft. Retain the last valid preview on error. Publication remains a user action. No filesystem/shell tool in this preset.
- Client: same workbench Panel for home, native conversation, studio and management; preserve board selection and return without native Panel navigation.
- Personal: dedicated preset, explicit read-only scope, bounded session retrieval via DSH; suggestions can use this context on demand, not invisible model calls.
- Reuse DSH owner-authenticated connection routes and native conversation slots. Verify both supported tagged releases; do not patch the host. Scope permissions to each session, fail closed when unsupported.
- Keep existing build/dev commands; no CI or new automated browser framework. Check actual client integration locally after implementation. The iframe is still experimental, not a security audit.

## Main-flow acceptance

1. Migrate existing boards, reopen after cache clear, restore a saved version without losing business data.
2. Enter Studio with no Workspace, send only the user's words. Builder reads/updates via tools; good candidate updates preview; failed candidate does not replace draft. Publish manually.
3. Start and resume native conversations from the workbench, including attachments, model selection and return; verify left-side selection and original ownership.
4. Personal assistant can answer using only explicitly approved sessions across projects, cite source IDs, and refuse others; no file writes. Context/recommendations do not automatically send unrelated business data.
5. Verify real DSH web/desktop, Windows offline, and actual internal model. Until then distinguish source implementation from runtime acceptance.
