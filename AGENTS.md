# Development

- This repository contains one independently installable DSH plugin. Keep the plugin manifest, build scripts, and source at the repository root.
- Target DSH release dsh-v0.2.3-alpha.2; verify public contracts against the tagged upstream source. Never patch the host or inspect its DOM to navigate.
- Use the upstream [DSH UI/UX skill](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.3-alpha.2/.agents/skills/dsh-client-ui-ux/SKILL.md) and theme tokens as the visual foundation. Use shadcn/ui (Radix) controls and scoped portals; no visible native select or custom confirmation overlays. No global Tailwind preflight. Built-in templates may use distinct layouts; custom pages can override style at user request. Check rendered UI in light/dark and constrained widths.
- Workbench uses actual host data; no mock production content. Do not grant generated code host or shell access.
- Prioritize the complete workflow; keep docs and tests small. Explicitly identify integration checks that have not run.
