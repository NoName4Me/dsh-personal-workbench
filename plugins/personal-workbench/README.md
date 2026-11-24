# Personal Workbench

Initial integration prototype, not a finished product. Target: [DSH dsh-v0.2.3-alpha.2](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.3-alpha.2).

```sh
pnpm install
pnpm --filter dsh-personal-workbench check
pnpm --filter dsh-personal-workbench test
pnpm --filter dsh-personal-workbench build
pnpm --filter dsh-personal-workbench pack
```

Install the packed archive in a disposable DSH web/desktop profile using its plugin manager or the version-matched CLI; inspect the host's available commands first. No CDN or runtime npm dependency is intended for the browser bundle.

Implemented in source: native sidebar panel, real workspace selector, draft-prefilled native session launch, four quick actions, scoped shadcn/ui styles. Prompt is prepared in the native composer rather than sent automatically. The host appends the new task to any existing draft without sending or deleting it. With no workspace, open an empty native conversation or add a workspace in the sidebar. The browser dependencies are bundled at build time, not declared as install-time production dependencies.

Not yet verified: dependency installation, build, real DSH loading, locale/selector contract, light/dark appearance, Windows offline packaging. No claim of runtime compatibility until tested. Default startup selection, recent sessions/status, workbench templates, editing Agent, isolated user runtime, version persistence are subsequent work. Do not evaluate generated code in the host client.

Upstream contracts: `packages/client/ui-layout/README.md`, `packages/client/ui-sidebar/README.md`, `packages/client/ui-workspace/src/client/navigation.ts`, `packages/preset/agent-preset/skills/dsh-doc/references/ui-plugin.md` at the pinned release.
