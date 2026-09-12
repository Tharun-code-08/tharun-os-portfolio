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
| `R` | Toggle Recruiter Mode |
| `Esc` | Close the front window |
| `↑` `↓` in the terminal | Command history |
| `↑ ↑ ↓ ↓ ← → ← → B A` | Something |

Terminal commands: `help`, `apps`, `open <app>`, `projects`, `skills`, `whoami`, `neofetch`,
`github`, `linkedin`, `email`, `resume`, `clear`. Two are not in `help`.

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
