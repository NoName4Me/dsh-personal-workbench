# Development

- Keep plugins independently installable; do not create shared packages until needed.
- Target DSH release dsh-v0.2.3-alpha.2; verify public contracts against the tagged upstream source. Never patch the host or inspect its DOM to navigate.
- Use shadcn/ui source components and semantic theme variables. No global Tailwind preflight, decorative gradients or card grids by default. Match host spacing and theme.
- Workbench uses actual host data; no mock production content. Do not grant generated code host or shell access.
- Prioritize the complete workflow; keep docs and tests small. Explicitly identify integration checks that have not run.
