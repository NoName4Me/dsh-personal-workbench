// Narrow adapter for the public DSH client surfaces at dsh-v0.2.3-alpha.2.
// Never import other plugins' private implementations.
export interface Workspace { workspaceId: string; title?: string }
export interface WorkspaceState { items: readonly Workspace[]; phase?: unknown }
export type UseWorkspaces = <T>(select: (snapshot: WorkspaceState) => T) => T
export interface WorkbenchProps {
  useWorkspaces: UseWorkspaces
  startSession: (id?: string, prompt?: string) => void
  t: (key: string) => string
}
export interface ClientContext {
  slots: {
    inject: (name: string, callback: () => unknown) => unknown
    register: (options: Record<string, unknown>, component: unknown) => unknown
  }
  effect: (callback: () => unknown, label?: string) => unknown
  locale: {
    register: (namespace: string, dictionaries: Record<string, Record<string,string>>) => unknown
    bind: (namespace: string) => (key: string) => string
  }
  layout: { selectPanel: (id: string) => void }
  uiWorkspace: {
    startSession: (id?: string, options?: {prompt: string; whenDraftExists: 'append'}) => void
  }
}
