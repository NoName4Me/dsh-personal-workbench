import * as React from "react"

// Portals stay within the plugin's scoped CSS and theme, never the host's unthemed body.
export const PortalContext=React.createContext<HTMLElement|null>(null)
export function usePortalContainer(){return React.useContext(PortalContext)}
