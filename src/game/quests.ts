import type { ZoneId } from "./zones";

/**
 * Achievements. A short list on purpose: each one points the visitor at a part
 * of the portfolio they might otherwise have walked past.
 */
export type AchievementId =
  | "explorer"
  | "reader"
  | "root"
  | "collector"
  | "historian"
  | "signal"
  | "leap"
  | "konami";

export type Achievement = {
  id: AchievementId;
  title: string;
  detail: string;
  /** Secret ones don't count toward 100% and stay hidden until earned. */
  secret?: boolean;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: "explorer", title: "Cartographer", detail: "Visit every place on the island" },
  { id: "reader", title: "Case closed", detail: "Open a project case file in the workshop" },
  { id: "root", title: "Root access", detail: "Boot THARUN OS on the studio computer" },
  { id: "historian", title: "Historian", detail: "Walk the Long Road and light every stone" },
  { id: "collector", title: "git good", detail: "Find all five floating commits" },
  { id: "signal", title: "Signal sent", detail: "Use the radio at the tower" },
  { id: "leap", title: "Leap of faith", detail: "Step off the edge of the world", secret: true },
  { id: "konami", title: "↑↑↓↓←→←→BA", detail: "You know the one", secret: true },
];

export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a])) as Record<
  AchievementId,
  Achievement
>;

export const MAIN_ACHIEVEMENTS = ACHIEVEMENTS.filter((a) => !a.secret);

/** Places that count toward Cartographer. The road counts once you are on it. */
export const EXPLORABLE: ZoneId[] = ["studio", "workshop", "lab", "arcade", "tower", "board", "timeline"];
