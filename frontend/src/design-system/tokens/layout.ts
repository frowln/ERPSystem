// =============================================================================
// Layout tokens — single source of truth for structural dimensions
// =============================================================================

export const layout = {
  /** Sidebar width when expanded (desktop) */
  sidebarWidth: 260,
  /** Sidebar width when collapsed (desktop) */
  sidebarCollapsedWidth: 68,
  /** Sidebar width on mobile (slides in) */
  sidebarMobileWidth: 280,
  /** Top bar height */
  topBarHeight: 64,
  /** Maximum content width */
  maxContentWidth: 1440,
  /** Messaging — left channel list width */
  channelListWidth: 250,
  /** Messaging — right info panel width */
  channelInfoWidth: 300,
  /** Thread panel width */
  threadPanelWidth: 380,
} as const;

// Tailwind-compatible class helpers (arbitrary values)
export const tw = {
  sidebarWidth: 'w-[260px]',
  sidebarCollapsedWidth: 'w-[68px]',
  sidebarMobileWidth: 'w-[280px]',
  topBarHeight: 'h-16',
  plSidebar: 'pl-[260px]',
  plSidebarCollapsed: 'pl-[68px]',
  ptTopBar: 'pt-16',
  leftSidebar: 'left-[68px]',
  leftSidebarExpanded: 'left-[260px]',
} as const;
