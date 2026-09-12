import type { AppId } from "@/lib/apps";

/** Hand-drawn line icons — no icon library, no extra bytes. */
const PATHS: Record<AppId | "search" | "close" | "min" | "max" | "arrow" | "power", string[]> = {
  me: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M4.5 20a7.5 7.5 0 0 1 15 0"],
  work: ["M3 7.5h18v12H3z", "M8.5 7.5V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5v2", "M3 13h18"],
  project: ["M5 3.5h9l5 5v12H5z", "M14 3.5v5h5", "M8.5 13h7", "M8.5 16.5h4.5"],
  lab: ["M9.5 3v6.2L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3l-4.7-8.8V3", "M8 3h8", "M7.6 15h8.8"],
  log: ["M4 4.5h16v15H4z", "M8 9h8", "M8 12.5h8", "M8 16h5"],
  stack: ["M12 3 3 7.5l9 4.5 9-4.5L12 3Z", "M3 12.5 12 17l9-4.5", "M3 16.75 12 21.25l9-4.5"],
  now: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 7.5V12l3 2"],
  proof: ["M12 3 4 6v6c0 4.5 3.2 7.9 8 9 4.8-1.1 8-4.5 8-9V6l-8-3Z", "M9 12.2l2.2 2.2L15.5 10"],
  notes: ["M6 3.5h12v17l-6-3-6 3z", "M9.5 8h5", "M9.5 11.5h5"],
  failures: ["M4 20 20 4", "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z"],
  contact: ["M3 6h18v12H3z", "m3.5 7 8.5 6 8.5-6"],
  browser: ["M3 5h18v14H3z", "M3 9h18", "M6 7h.01M8.5 7h.01M11 7h.01"],
  settings: ["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z", "M19.4 15a1.6 1.6 0 0 0 .32 1.77l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-1 1.47V21a2 2 0 1 1-4 0v-.11a1.6 1.6 0 0 0-1.05-1.46 1.6 1.6 0 0 0-1.77.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.6 1.6 0 0 0 4.6 15a1.6 1.6 0 0 0-1.47-1H3a2 2 0 1 1 0-4h.11a1.6 1.6 0 0 0 1.46-1.05 1.6 1.6 0 0 0-.32-1.77l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.6 1.6 0 0 0 9 4.6a1.6 1.6 0 0 0 1-1.47V3a2 2 0 1 1 4 0v.11a1.6 1.6 0 0 0 1 1.47 1.6 1.6 0 0 0 1.77-.32l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.6 1.6 0 0 0-.32 1.77V9a1.6 1.6 0 0 0 1.47 1H21a2 2 0 1 1 0 4h-.11a1.6 1.6 0 0 0-1.47 1Z"],
  terminal: ["M3 4.5h18v15H3z", "m7 10 2.5 2.5L7 15", "M12.5 15h4.5"],
  search: ["M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z", "m16.2 16.2 4.3 4.3"],
  close: ["M6 6l12 12", "M18 6 6 18"],
  min: ["M6 12h12"],
  max: ["M5.5 5.5h13v13h-13z"],
  arrow: ["M7 17 17 7", "M9 7h8v8"],
  power: ["M12 3.5v8", "M7.2 6.6a8 8 0 1 0 9.6 0"],
};

export function Icon({
  name,
  className = "h-4 w-4",
  strokeWidth = 1.5,
}: {
  name: keyof typeof PATHS;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
