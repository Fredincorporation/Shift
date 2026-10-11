# SHIFT

**A 3D isometric narrative game set at Northlight Interactive.**

You play a junior developer at a small game studio. Shift is a story game, not an action game: you walk around hand-built isometric rooms, talk to people, make choices that move relationships, and manage the gap between your career and your personal life across a seven-episode arc.

Built with **Three.js**, **React 19**, **Tailwind CSS v4**, **TypeScript**, and **Vite**.

## What's In The Game

- **7 episodes**, from the first day at the studio to the finale.
- **8 locations** you can travel between once the story unlocks them: the studio, your apartment, the bar, your family's house, the publisher, the rooftop, the clinic, and the hospital.
- **Choice-driven dialogue** that writes into a dual-sphere stat model — work relationships (Mara, Jonah, Theo, Nadia), personal relationships (family, friends), and a burnout meter.
- **A phone** you actually use: message threads you can reply to, vitals meters, a journal, and an MP3 player.
- **Exploration** with on-screen thumb-stick, WASD/arrow keys, and tap-to-walk pathing; world-space labels float over people and props, and a minimap shows the room you're in.
- **Sleep, travel and promotion** as real mechanics — nights fade to black and advance the day, and a promotion is earned by hitting a trust threshold, not by picking a menu item.

## Getting Started

```bash
npm install
npm run dev            # http://localhost:5173
```

You should see: boot cover → "Building the studio…" loading bar → main menu. Pick **Begin Episode 1** (or **Continue** if a save exists) to enter the world.

Other commands:

```bash
npm run build          # type-checks (tsc --noEmit) then bundles to dist/
npm run preview        # serve the production build locally
npm run build:bundled  # standalone bundle with React inlined (see Platform Notes)
npm run deploy         # build, then publish via the rundot CLI
```

Requires Node.js 18 or newer.

## Where Things Live

```
index.html                   // viewport lock + inline boot cover (no stuck black screen)
src/main.tsx                 // boot sequence: storage probe → save load → React mount → menu
src/ui/                      // React screens, routed by phase (loading → menu → playing)
  App.tsx                    //   the phase router
  MainMenu.tsx               //   title screen, continue / new game, save warnings
  GameView.tsx               //   mounts the 3D world and stacks the gameplay overlays
  Hud.tsx                    //   day + location banner, objectives, help modal, menu drawer
  DialogueOverlay.tsx        //   speaker, typewriter lines, choice buttons
  PhoneOverlay.tsx           //   messages, vitals, journal, music player
  TravelSheet.tsx            //   unlocked destinations for the current beat
  MiniMap.tsx / Controls.tsx / WorldLabels.tsx
  EpisodeEnd.tsx             //   per-episode recap
src/world/                   // the Three.js world
  world.ts                   //   isometric camera, rooms, input, pathing, render loop
  anchors.ts                 //   the coordinate registry: locations, hit-points, seats, bounds
  diorama.ts, rooms*.ts      //   room geometry, built procedurally from primitives
  models.ts / dressing.ts    //   optional GLB props layered on top of the rooms
  characterRig.ts            //   procedural rigs for the cast
  nav.ts                     //   per-room walkability grid
src/story/                   // the narrative layer
  story.ts                   //   all scripted data: objectives, interactions, dialogue nodes
  runtime.ts                 //   the engine: node flow, stat effects, replies, travel, persistence
src/state/                   // store + persistence
  store.ts                   //   useSyncExternalStore bridge between game code and React
  gameState.ts               //   GameState, stats, save/load, save report
  storage.ts                 //   backend selection (host → localStorage → sessionStorage → memory)
  migrate.ts                 //   save-version migration contract
src/sdk/runSdk.ts            // RUN.game SDK init + lifecycle registration
src/game/                    // dead template leftovers — see Cleanup Notes
src/styles/app.css           // Tailwind import, @theme palette, device-frame CSS
public/cdn-assets/           // large assets deployed alongside the build
game.config.prod.json        // deploy config (name, description, orientation, build path)
```

### How A Scene Runs

`src/ui/GameView.tsx` owns the boundary between React and Three.js: it calls `createWorld()` from `src/world/world.ts`, then wires the world's movement and interaction events into `src/story/runtime.ts`. The story data in `story.ts` is declarative — an `Interaction` ties a labelled hit-point to a beat (`{ id:'home_bed', label:'Go to bed', beats:['act2_choice'], node:'home_sleep', key:true }`), and a `StoryNode` holds the lines and the choices, each choice carrying stat `deltas`, an optional `unlock`, `beat`, `dayLabel`, and the `next` node. The runtime applies those effects and writes back through `store.patch()`; React never touches the Three.js scene graph, and the world never touches React state directly.

### Visuals

Rooms are built procedurally from Three.js primitives under a fixed orthographic isometric camera, and each diorama is placed along +X in `anchors.ts` so the camera can follow you room to room. Kenney GLB packs (people, city, suburb, food, market, cars) are **additive dressing only** — they load after the rooms are already standing, so a slow asset fetch costs you furniture, not the game. The loader tries the Cloudflare R2 bucket first, then the platform asset library, then a local `referenced-files.json` manifest, and falls back to a procedural palette if a texture fails. Character rigs are procedural.

### Saving

There is one versioned save key (`shift_save`), written as JSON with a read-back verify and retries. `src/state/storage.ts` probes for a working backend at boot and uses the first one that answers: the RUN host's `appStorage`, then `localStorage`, then `sessionStorage`, then an in-memory map. If only memory is available the game still runs but tells you honestly that progress is not durable, and `MainMenu` warns before you start.

## Platform Notes

This project runs standalone in a plain browser — no SDK, no host, no login needed to play. The [`RUN.game`](https://series-1.gitbook.io/rundot-docs) integration is still wired in and does three real jobs:

- **Cloud save** via `RundotGameAPI.appStorage` (the preferred backend when hosted).
- **Analytics** for load, save, and session events.
- **Lifecycle hooks** (`onPause`/`onResume`/`onSleep`/`onQuit`) that flush the save; `onSleep` is the reliable one.

`vite.config.ts` registers `rundotGameLibrariesPlugin()`, which externalizes the pinned React 19.2.4 so the host serves it. Because of that, keep `firebase` in `devDependencies`: the SDK dynamically imports `firebase/app` without declaring it, and removing the package breaks `vite build`. Use `npm run build:bundled` if you need a self-contained bundle that ignores the host.

## Cleanup Notes

The repo was forked from a Pixi.js + React starter template, and parts of that template are still on disk but no longer run. **There is no Pixi.js in this project** — it is not imported and not a dependency. These files are dead and safe to delete:

- `src/game/pixiApp.ts`, `src/game/demoScene.ts`, `src/game/stage.ts`, `src/game/GameCanvas.tsx` — the old Pixi canvas boundary, superseded by `src/world/world.ts` mounted directly by `GameView.tsx`.
- `src/assets/manifest.ts`, `src/assets/preload.ts` — the old asset warm-up path; `warmAssets()` is never called, since real preloading happens in `world.ts` via `preloadCritical()` / `dressRooms()` / `preloadDeferred()`. The loading bar in `main.tsx` is a timed animation, not asset progress.
- `src/ui/SaveIndicator.tsx` — imported in `GameView.tsx` but never rendered.

`CLAUDE.md` still documents the original Pixi template and should be treated as historical, not current.

## License

See `LICENSE` and `LICENSE.txt`.
