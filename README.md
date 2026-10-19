# THARUN — a playable portfolio

A small floating island you walk around as me. Every place on it is a part of the portfolio: the
workshop holds the projects, the lab holds the open questions, the road is the build log, the arcade
is the stack, the radio tower is how you reach me. The studio in the middle has a CRT on the desk —
walk up, press E, and the camera dives into the glass and boots **THARUN OS**, the desktop portfolio
this site used to be.

It is a portfolio first: a recruiter is one key (`R`) from a plain, printable résumé, and the classic
OS is one click from the title screen.

Next.js 16 · React 19 · TypeScript · Tailwind v4 · three.js through react-three-fiber · Rapier
physics · Blender for the character and the computer · Web Audio for every sound (no audio files).

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

## Three ways in

| Who | What they get | How |
| --- | --- | --- |
| Someone curious | The island — walk, explore, collect, boot the OS | Default |
| Someone hiring, in a hurry | A plain, scrollable, printable résumé | `R` anywhere, or the title menu |
| Someone who wants the desktop | THARUN OS, no game | Title menu → Classic OS, or `/?classic=1` |

`prefers-reduced-motion` and browsers without WebGL get the classic OS automatically, so nobody is
handed a flying camera they did not ask for. `/?play=1` forces the game. Switching between the two is
a re-render, not a reload.

## Controls

| Input | Does |
| --- | --- |
| `W` `A` `S` `D` / arrows | Walk (relative to the camera) |
| `Shift` | Run |
| `Space` | Jump — there is coyote time and a jump buffer, so it forgives you |
| `E` / `Enter` | Interact with whatever the ring on the ground is under |
| Click / tap the ground | Walk there |
| Drag | Orbit the camera · wheel or pinch to zoom |
| `M` | Map, with fast travel |
| `J` | Quest log |
| `Esc` | Close the panel · pause |
| `R` | Recruiter Mode |
| `↑ ↑ ↓ ↓ ← → ← → B A` | Still something |

Phones get a thumbstick (push it all the way to run), **A** to interact and **B** to jump.

## The island

| Place | What's there | Opens |
| --- | --- | --- |
| The Studio | Desk, CRT, bookshelf, my ID card on the wall | THARUN OS (the computer), ME |
| The Workshop | A hologram per published project, a workbench, a live billboard | Case files, WORK, the in-OS browser |
| The Lab | A glass dome, one orb per open question, coloured by status | LAB |
| The Long Road | One stone per build-log entry, oldest first; each lights as you pass | BUILD LOG |
| The Arcade | One cabinet per part of the stack — and crates up to the roof | STACK |
| Radio Tower | A radio desk and a proof plaque | CONTACT, PROOF |
| Notice Board | What I'm doing this month | NOW |

Every one of those is generated from `src/data`. Publish a project and a hologram appears; add a
build-log entry and the road grows a stone. Nothing about content lives in a 3D component.

Opening anything docks a panel on the right and frames me on the left. The panels are the OS apps
themselves, running on their own window store — so WORK → case file → back works exactly as it does
on the desktop, with no second implementation.

There are achievements, five floating commits hidden around the island (each one carries a real line
from the build log), a time of day that follows your clock, and a curtain call at 100%.

## The character

`art/build_tharun.py` builds me in Blender from code — mesh, an 18-bone rig, computed skin weights and
nine animations (idle, walk, run, jump, fall, land, wave, interact, victory) — and exports
`public/models/tharun.glb`. `art/build_props.py` does the same for the CRT, keyboard and mouse.

```powershell
# Windows; set BLENDER_PATH to use a non-Store install
powershell -File art/run-blender.ps1 -Script art/build_tharun.py
```

The look is the `LOOK` block at the top of the script — textured hair with volume on top, medium-brown
skin, rectangular glasses, stubble along the jaw and a moustache, a black tee with the amber T, jeans
and white sneakers. Change any of it and re-run; the game picks up the new GLB on reload. The pixel
TharunBOT in the OS (`src/components/os/TharunBot.tsx`) wears the same outfit. If the model ever fails
to load, a procedural stand-in made of primitives takes its place.

## How it is put together

```
src/
  app/page.tsx              the game entry + a server-rendered summary for crawlers and no-JS
  data/                     all content — edit these, never the components
  game/                     the rules, no React rendering
    store.ts                mode machine (title → intro → play ⇄ OS), quests, settings, save file
    zones.ts                places and interactables, derived from src/data
    terrain.ts              the island as one height function: mesh, collider and props all ask it
    controller.ts           Rapier core's kinematic character controller, configured
    runtime.ts              per-frame state (player, camera, input) outside React
    audio.ts                generative music + every sound effect, in Web Audio
    sky.ts, quality.ts, quests.ts, input.ts, experience.ts, useGameBot.ts
  components/game/
    GameEntry.tsx           game or classic OS; the 3D stack is its own lazy chunk
    GameRoot.tsx            canvas + HUD + panels + OS, glued to the store
    Player.tsx              velocity, gravity, coyote time, jump buffer, respawn
    CameraRig.tsx           follow, orbit, wall pull-in, scripted shots, the dive into the CRT
    Character.tsx           the GLB, crossfading clips from the controller state
    world/                  island, sea, sky, foliage, every place, sensors, life
    hud/                    title, HUD, panel, menus, map, toasts, touch controls, OS screen
  components/os/, apps/     THARUN OS — unchanged apps, reused by the game panels
art/                        Blender build scripts and their .blend output
```

**The player** is a kinematic capsule we move ourselves. Velocity, gravity, coyote time and the jump
buffer are ours; Rapier's `KinematicCharacterController` (from `@dimforge/rapier3d-compat`, not a React
wrapper) only answers "if I try to move this far, how far do I get?" — which is what gives slopes,
autostep over porch steps and snapping to the ground on the way down. Fall off the island and you are
put back where you last stood safely.

**Triggers** are Rapier sensors — zones, interactables and commits in one fixed body. The player's
collider opts into kinematic↔fixed events, which Rapier leaves off by default.

**TharunBOT** still talks: the same line table in `src/lib/bot.ts` drives a bubble over my head, with
island events (`zone:workshop`, `collect`, `fall`, …) next to the OS ones.

**The OS** boots inside the game: the camera dives into the CRT, the glass flashes, and the full
desktop mounts on top. The canvas stops rendering while it is up; "Back to the island" (or `Esc` on an
empty desk) plays it in reverse.

## Performance

- Three presets (Low / Medium / High) — shadows, post-processing, grass density, pixel ratio. Auto
  picks one from the device and a performance monitor steps down if frames drop.
- Foliage, rocks, birds and dust are instanced; one shadow-casting light follows the player.
- Bloom is driven by materials (anything brighter than 1 glows), not by masks.
- Rendering stops while the OS or Recruiter Mode is open.
- The first page load does not include three.js or Rapier.

## THARUN OS

Still all there, in the studio computer and at `/?classic=1`: draggable windows, dock, `⌘K` palette,
terminal, Mission Control (`F2`), three desks (`Ctrl+1/2/3`), Developer Mode (`D`), themes, session
memory, the pixel-art room and TharunBOT's life in it. Shortcuts live in `src/lib/shortcuts.ts`.

## The portfolio has an API

```bash
curl http://localhost:3000/api/portfolio
curl "http://localhost:3000/api/portfolio?q=projects"
```

Sections: `projects`, `experience`, `stack`, `buildLog`, `now`, `openQuestions`, `education`. It reads
the same `src/data` files as everything else.

## Editing the content

**All content lives in `src/data/`.**

| File | Holds |
| --- | --- |
| `profile.ts` | Name, headline, intro, status, stack, the NOW page, contact details |
| `projects.ts` | Projects and case studies, experience and education |
| `journal.ts` | Build log, Lab questions, Failure Museum, Notes |
| `proof.ts` | The checkable numbers and live deployment links |

- A project with `published: false` is invisible everywhere — the island, the OS, the palette.
- A project with an empty `study: []` gets a hologram that opens WORK instead of a case file.
- `LAB`, `NOTES` and `FAILURE_MUSEUM` hide themselves while their arrays are empty.

To add a place: put it in `LAYOUT` (`src/game/terrain.ts`) so the ground flattens under it, give it a
zone and interactables in `src/game/zones.ts`, and a component in `src/components/game/world/`.

### Still to fill in

- `projects.ts` — the **XR work at Ingage** entry is a stub with `published: false`.
- `journal.ts` — `failures` and `notes` are empty, with templates in the comments.
- `public/` — a `resume.pdf` would be better than the `.docx`. Drop one in and point
  `contact.resume` at `/resume.pdf`.

## Deploying

Static, so anywhere works. Vercel: `npx vercel`, then set `NEXT_PUBLIC_SITE_URL` to the live domain so
Open Graph tags resolve absolutely.
