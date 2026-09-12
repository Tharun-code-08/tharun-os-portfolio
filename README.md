# THARUN OS

A portfolio built as a desktop operating system. Boot sequence, draggable windows, a dock,
a command palette, a terminal that actually runs commands — and a Recruiter Mode for people
who do not want any of that.

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4. No UI libraries, no icon packs,
no animation libraries. Everything in `src/components` is hand-written.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

## Two ways in

| Audience | What they get | How |
| --- | --- | --- |
| Someone curious | The OS — windows, dock, terminal, easter eggs | Default |
| Someone hiring, in a hurry | A plain, scrollable, printable résumé page | Press `R`, or the menu-bar button |
| Phones | A command centre with full-screen sheets, no dragging | Automatic below 820px |

## Keyboard

| Key | Does |
| --- | --- |
| `⌘K` / `Ctrl+K` / `/` | Command palette — searches apps, projects and links |
| `⌘W` | Close the front window |
| `⌘M` | Minimise the front window |
| `⌘↵` | Maximise or restore the front window |
| `⌘←` `⌘→` | Snap the front window to a half |
| `⌘1`…`⌘5` | Work, Lab, Build log, Now, Terminal |
| `⌘,` | Settings |
| `F2` | Mission Control |
| `R` | Recruiter Mode |
| `Esc` | Close the front window |
| `↑` `↓` in the terminal | Command history |
| `↑ ↑ ↓ ↓ ← → ← → B A` | Something |

Shortcuts are defined once in `src/lib/shortcuts.ts` and Settings renders that same list, so
the documentation cannot drift from the handler.

Terminal commands: `help`, `apps`, `open <app>`, `projects`, `skills`, `whoami`, `neofetch`,
`api`, `theme`, `github`, `linkedin`, `email`, `resume`, `clear`. Two are not in `help`.

## The room

The wallpaper is a room — desk, CRT, sunset window, plant, and a figure at the right — drawn as
original pixel art in [`Scene.tsx`](src/components/os/Scene.tsx). It is plain `<rect>`s on a
320×180 grid with `shape-rendering: crispEdges`, so it scales up chunky rather than blurry. No
image files, no sprite sheets, nothing traced from anyone else's site.

The figure is a **stylised character, not a portrait** — swap `Character` for an `<image>` if you
want a real pixel avatar of yourself.

Desktop icons sit on top in a grid: single click selects, double click opens.

## He lives here

After the welcome film plays once, TharunBOT drops into **ambient mode** — an ongoing life in
[`life.ts`](src/lib/life.ts) rather than the same fifteen seconds forever.

Five anchors (desk, whiteboard, shelf, couch, window) and a set of activities with real durations.
Which one comes next is weighted by **the actual hour** — coffee in the morning, notes in the
evening, "one more fix, famous last words" at night — and nudged by what you have been reading, so
a visitor who lives in the Lab sees more whiteboard time.

Movement has anticipation: **notice → turn → walk → settle**, never a teleport. He blinks on an
irregular cadence, breathes by a single pixel, and most activities pass in complete silence. A
thought appears maybe 45% of the time, in a quieter dashed bubble that is his, not speech to you.

Opening anything pauses all of it. He was here before you arrived and carries on after.

## The 15-second loop

Five scenes, three seconds each — WAKE, DISCOVER, BUILD, THINK, INVITE — defined in
[`cinematic.ts`](src/lib/cinematic.ts). The character walks between marks with a two-frame leg
cycle, the camera reframes, and the light shifts from morning through to night. **The OS chrome
never moves**; only the world layer animates underneath it.

The rule that matters: **the visitor always wins**. Open a window, the palette, Mission Control,
Recruiter or Developer Mode and the loop pauses exactly where it is. It resumes only when the desk
is clear again. `SKIP INTRO` is remembered, so returning visitors never see it twice, and
`prefers-reduced-motion` disables it outright.

## Spaces

Three desks — Personal, Work, Lab — switched with `Ctrl+1/2/3` or the menu bar. Windows belong to
the desk they were opened on, so the same app can be open on two desks at once, and each desk has
its own light. Close-all only closes the desk you're standing at.

## Developer Mode

Press `D`. A live read-out of the running app: the process tree of open windows with sizes and
z-order, the runtime, the content-model counts straight out of `src/data`, the public API, and the
current relationship tier. Every number is read at render time — if one is wrong, the site is wrong.

## Atmosphere

One WebGL fragment shader draws drifting dust, a soft window shaft and film grain over the SVG
room ([`Atmosphere.tsx`](src/components/os/Atmosphere.tsx)). It is additive only — no library, half
resolution, paused on a hidden tab, and skipped entirely without WebGL or under reduced motion. The
room is still vector art underneath.

## TharunBOT

The character is a behaviour engine, not decoration — [`src/lib/bot.ts`](src/lib/bot.ts) holds a
data-driven line table, and [`TharunBot.tsx`](src/components/os/TharunBot.tsx) draws it.

Lines are matched on events (`open:lab`, `hover:work`, `idle`, `enter`, `return`), and the rules
are what keep it from being irritating:

- one bubble at a time, highest priority wins
- a reaction always beats ambient chatter
- ambient lines fire every ~32s at most and never repeat back to back
- `once` lines fire a single time per session
- `prefers-reduced-motion` silences ambient lines and the cursor tracking entirely

It also escalates. Open three different apps and the `explorer` flag unlocks a second tier of
lines — the Lab stops saying "these are unresolved questions" and starts saying "you're actually
reading this". First-time visitors get a greeting; returning ones just get "Welcome back."

Adding dialogue means adding an object to `LINES`. Nothing else changes.

## The browser

`BROWSER` in the dock opens an in-OS browser with back / forward / reload, an address bar and
bookmarks for **Claxon AI**, **BrandThis** and **Softdigit Consulting** — all three verified to
load inside a frame. Sites are listed in [`src/data/sites.ts`](src/data/sites.ts).

A cross-origin frame cannot be inspected, so a blocked site looks identical to a slow one. After
six seconds the browser offers a real tab instead of leaving a white rectangle. GitHub and
LinkedIn both send `X-Frame-Options`, which is why they are not bookmarked.

## The OS layer

Drag a window to a screen edge and it snaps, with a translucent panel previewing where it lands.
Right-click the desktop for a context menu. `F2` opens Mission Control. Settings carries three
themes — Charcoal, Paper, Midnight — that reskin everything with no reload; the choice is applied
in `<head>` before first paint, so there is no flash on the way back.

The workspace is remembered. Move a window, resize it, snap it, refresh: it comes back as you left
it, from `localStorage` under `tharun-os-session-v1`.

## The portfolio has an API

```bash
curl http://localhost:3000/api/portfolio
curl "http://localhost:3000/api/portfolio?q=projects"
```

Sections: `projects`, `experience`, `stack`, `buildLog`, `now`, `openQuestions`, `education`.
It reads the same `src/data` files the UI renders, so there is no second source of truth.

## Editing the content

**All content lives in `src/data/`. You should never need to touch a component to change
what the site says.**

| File | Holds |
| --- | --- |
| `profile.ts` | Name, headline, intro, status line, stack, the NOW page, contact details |
| `projects.ts` | Projects and their case studies, plus experience and education |
| `journal.ts` | Build log, Lab questions, Failure Museum, Notes |
| `proof.ts` | The checkable numbers and live deployment links |

Three rules the code enforces so nothing half-finished ships:

- A project with `published: false` is invisible everywhere — the site, the palette, the terminal.
- A project with an empty `study: []` renders as a card with links but no case file.
- `LAB`, `NOTES` and `FAILURE_MUSEUM` hide themselves from the dock while their arrays are empty.

### Still to fill in

- `projects.ts` — the **Claxon AI** entry is a stub with `published: false`. Nothing about it was
  invented; fill it in and flip the flag.
- `journal.ts` — `failures` and `notes` are empty, with templates in the comments. The Failure
  Museum is the section almost nobody else will have.
- `public/` — a `resume.pdf` would be better than the `.docx` that is there now. Drop one in and
  point `contact.resume` at `/resume.pdf`.

## Deploying

Static, so anywhere works. Vercel:

```bash
npx vercel
```

Then set `NEXT_PUBLIC_SITE_URL` to the live domain so Open Graph tags resolve absolutely.

## Structure

```
src/
  app/            layout, page, global CSS, favicon
  data/           all content — edit these
  lib/
    apps.ts       the app registry (dock order, sizes, search keywords, visibility)
    os.tsx        window manager: open/close/focus/move/resize/maximise
  components/
    os/           Shell, Boot, MenuBar, Dock, Window, Desktop, CommandPalette, MobileShell, Konami
    apps/         the contents of each window
    modes/        Recruiter Mode
```

The window manager is a `useReducer` in `lib/os.tsx`. Windows are plain absolutely-positioned
elements; dragging and resizing use pointer capture, and window bodies are memoised so dragging
one does not re-render what is inside it.
