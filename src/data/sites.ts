/**
 * Bookmarks for the in-OS browser.
 *
 * Each of these was checked to make sure it allows embedding — no
 * X-Frame-Options, no CSP frame-ancestors. If you add a site that sets either,
 * the frame will come up blank and the browser will offer a real tab instead.
 * GitHub and LinkedIn both block framing, which is why they are not here.
 */
export type Site = {
  id: string;
  label: string;
  url: string;
  note: string;
};

export const sites: Site[] = [
  {
    id: "claxon",
    label: "Claxon AI",
    url: "https://claxonai.in",
    note: "Where I shipped BrandThis and PitchMyWeb",
  },
  {
    id: "pitchmyweb",
    label: "PitchMyWeb",
    url: "https://pitchmyweb.in",
    note: "Shipped Oct 2026 — find, build, pitch on WhatsApp",
  },
  {
    id: "softdigit",
    label: "Softdigit",
    url: "https://softdigitconsulting.com",
    note: "Softventory — the inventory SaaS I led",
  },
];
