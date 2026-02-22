/**
 * Named z-index scale — matches tailwind.config.ts `zIndex` extend.
 *
 * Usage in Tailwind:  `z-dropdown`, `z-modal`, `z-toast`
 * Usage in JS/TS:     `style={{ zIndex: zIndex.modal }}`
 *
 * Layer order (low → high):
 *   dropdown < sticky < fixed < overlay < modal < popover < tooltip < toast < command-palette
 */
export const zIndex = {
  /** Dropdown menus, autocomplete panels */
  dropdown: 100,
  /** Sticky table headers, sticky columns */
  sticky: 200,
  /** Fixed sidebars, bottom navs, FABs */
  fixed: 300,
  /** Modal/drawer backdrops */
  overlay: 400,
  /** Modals, drawers, dialog panels */
  modal: 500,
  /** Popovers, date-pickers */
  popover: 600,
  /** Tooltips */
  tooltip: 700,
  /** Toasts, offline indicator, AI chat FAB */
  toast: 800,
  /** Command palette (Cmd+K) */
  'command-palette': 900,
} as const;

export type ZIndexToken = keyof typeof zIndex;
