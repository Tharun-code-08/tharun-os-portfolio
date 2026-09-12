/** Single source of truth: the handler in Shell and the list in Settings both read this. */
export const SHORTCUTS = [
  { keys: "⌘K  /  /", label: "Search everything — projects, apps, links" },
  { keys: "⌘W", label: "Close the front window" },
  { keys: "⌘M", label: "Minimise the front window" },
  { keys: "⌘↵", label: "Maximise or restore the front window" },
  { keys: "⌘←  ⌘→", label: "Snap the front window to the left or right half" },
  { keys: "⌘1 … ⌘5", label: "Open Work, Lab, Build log, Now, Terminal" },
  { keys: "⌘,", label: "Open Settings" },
  { keys: "F2", label: "Mission Control — every open window at once" },
  { keys: "R", label: "Recruiter Mode" },
  { keys: "Esc", label: "Close the front window, or leave Mission Control" },
] as const;
