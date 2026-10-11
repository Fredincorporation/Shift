# SHIFT — 3D Isometric Narrative Game

Story-driven isometric game set at "Northlight Interactive". Seven episodes, eight
traversable locations, choice-driven dialogue writing into a dual-sphere stat model.
Engine: **Three.js** (`three` 0.185). UI: **React 19.2.4** + **Tailwind v4**. Build: **Vite 6** +
**TypeScript 5.8**. There is **no Pixi.js** in this project — it was forked from a Pixi starter
template, and that template's canvas layer has since been deleted.

## File Structure (current)

- **src/main.tsx** — Entry point. `boot()` order matters: `initSdk()` → `initStorage()` probe →
  `loadStateDetailed()` (before first paint) → mount React → lift `#boot-cover` → timed load-progress
  warm-up → `phase:'menu'` → register lifecycles → flush on `pagehide`/`beforeunload` → analytics.
  The loading bar is an animation, not real asset progress; real model warm-up happens in `world.ts`.
- **src/ui/App.tsx** — 3-phase router only: `loading` → LoadingScreen, `menu` → MainMenu, `playing` → GameView.
  All gameplay overlays live inside GameView, not App.
- **src/ui/GameView.tsx** — The React / Three.js boundary. Calls `createWorld()`, wires movement and
  interaction events into the story runtime, stacks Dialogue/Phone/Travel/EpisodeEnd/Hud.
- **src/ui/** — `Hud.tsx` (day/location banner, objectives, help modal, burger drawer), `DialogueOverlay.tsx`
  (portrait, typewriter, choices), `PhoneOverlay.tsx` (threads, vitals, journal, MP3 player),
  `TravelSheet.tsx`, `MiniMap.tsx`, `Controls.tsx` (thumb-stick + contextual action), `WorldLabels.tsx`,
  `EpisodeEnd.tsx`, `MainMenu.tsx`, `LoadingScreen.tsx`.
- **src/world/world.ts** — The world factory. Orthographic isometric camera (fixed yaw/`ISO_DIR`,
  `CAM_DIST=46`), builds rooms, cast, nav grids, input, and the render loop. Camera clamps to the room
  the player stands in. Awaits `preloadCritical()` → `dressRooms()` → `preloadDeferred()`, and re-dresses
  at +2.5s/+6s so a slow CDN costs you furniture, not the game.
- **src/world/anchors.ts** — Shared coordinate registry: `SceneId`, `OFFSETS` (each diorama along +X),
  `LOCATIONS` (name/subtitle/`openIn` beats/`playerStart`), `ANCHORS` hit-points, `ROOM_BOUNDS`, `SEATS`,
  `openLocations()`. **This is where you add a location or an interaction point.**
- **src/world/diorama.ts, rooms.ts, rooms2.ts, rooms3.ts** — Room geometry, built **procedurally from
  primitives (boxes)**: studio, apartment, bar, family house, publisher, rooftop, clinic, hospital.
- **src/world/models.ts, dressing.ts** — Optional Kenney GLB dressing via `GLTFLoader`; `CRITICAL_MODELS`
  vs `DEFERRED_MODELS`, `preloadModels()`, `makeModel()`, `dressRooms()`. Everything here is additive.
- **src/world/characterRig.ts, nav.ts** — Procedural rigs for the cast; per-room walkability grid with
  `findPath`/`walkable`/`clamp`.
- **src/story/story.ts** — All scripted data (~2400+ lines): `OBJECTIVES` per beat, `INTERACTIONS`,
  `NODES`, and the `Choice`/`Line`/`StoryNode`/`Interaction` types. **Content lives here, not in code.**
- **src/story/runtime.ts** — The engine that plays it: `openNode`/`advance`/`pickChoice`/`endNode`,
  `applyEffects`/`applyConsequences`, phone replies, `travelOptions`/`travelTo`, guidance
  (`objective`/`keyInteraction`/`activeInteractions`/`nodeFocus`), `nightFactor`, persistence, and `track()`.
- **src/state/store.ts** — `useSyncExternalStore` bridge: `store.patch({...})` from game code,
  `useStore(selector)` in React. Also the global `audioManager` (main theme + phone MP3 player, mutually
  exclusive, resume position in `localStorage`).
- **src/state/gameState.ts** — `GameState`, the stat model (`StatKey`), save/load (`SAVE_KEY='shift_save'`),
  and `SaveReport`.
- **src/state/storage.ts** — Backend chosen by probing at boot, in order: RUN host `appStorage` →
  `localStorage` (guarded; throws in sandboxed frames) → `sessionStorage` → in-memory map.
- **src/state/migrate.ts** — Save-version migration contract (`SAVE_VERSION=2`, `BEAT_FALLBACKS`).
- **src/sdk/runSdk.ts** — `initSdk()` (never throws; runs SDK-less in a plain browser), `sdkReady()`,
  `registerLifecycles()`.
- **src/styles/app.css** — Tailwind import, `@theme` palette, device-frame CSS, and all game-specific
  component CSS (phone chassis, MP3 player, help modal, episode meters).
- **game.config.prod.json** — Deploy config (name/description/orientation/buildPath). Not read by app code.

## Key Patterns

- **Data-driven story** — A `Choice` carries `deltas` (StatKey→number), `seeds`, `unlock`, `beat`, `scene`,
  `dayLabel`, `promote`, `message`, `log`, `next`. An `Interaction` binds a labelled hit-point to beats:
  `{ id:'home_bed', label:'Go to bed', beats:['act2_choice'], node:'home_sleep', key:true }`.
  New dialogue = new `StoryNode` + choices; new hotspots = `ANCHORS` entry + `INTERACTIONS` entry.
- **Two stat spheres** — work (`mara_trust`, `jonah_closeness`, `theo_trust`, `nadia_trust`) and personal
  (`family_bond`, `friend_closeness`), plus `burnout`. Promotion is *earned* (`mara_trust>=62`), not menu-picked.
- **Layering** — React owns navigation; Three.js owns the world. Never touch the scene graph from a
  component; never patch the store per-frame (discrete events only).
- **Room unlock gating** — `LOCATIONS[*].openIn` is a beat list; travel and visibility both derive from it.
  Adding an episode means extending `openIn` arrays across `anchors.ts`.
- **Cast visibility** — `applyCastVisibility` in `world.ts` gates characters by episode (e.g. Nadia from
  Ep3, Tara from Ep4). Keep that gating narrative-consistent when adding rigs.
- **Assets posture** — GLB resolution order: R2 bucket flat name → R2 full path → SDK `assetLibrary`
  pack base URL → local `referenced-files.json` manifest. `colormap.png` is redirected by
  `LoadingManager.setURLModifier`, with a procedural canvas palette fallback on failure.
- **SDK posture** — The game must boot and play with no host: every `RundotGameAPI` call is guarded and
  `initSdk()` runs before any other SDK call. The SDK still does real work: cloud save (`appStorage`),
  analytics, and lifecycle save-flushes (`onSleep` is the reliable one).
- **Dependency gotchas** — Keep `firebase` in `devDependencies`: the SDK dynamically imports `firebase/app`
  without declaring it, and removing it breaks `vite build`. Keep `react`/`react-dom` pinned to exactly
  19.2.4 so `rundotGameLibrariesPlugin()` externalizes them; a version mismatch silently falls back to
  bundling. `npm run build:bundled` forces a standalone bundle.

## What to Modify

- **New dialogue / branch / stat consequence** → `src/story/story.ts` (`NODES`, `INTERACTIONS`, `OBJECTIVES`).
- **New episode** → `story.ts` beats + `MainMenu.tsx` `episodeOf` label + `EpisodeEnd.tsx` recap +
  `anchors.ts` `openIn` arrays + `migrate.ts` `BEAT_FALLBACKS`.
- **New location** → a room builder in `src/world/rooms*.ts` (or `diorama.ts`), plus entries in `LOCATIONS`,
  `OFFSETS`, `ROOM_BOUNDS` and `ANCHORS` in `anchors.ts`.
- **New character** → rig in `world.ts` (`rigs`, `rigHome`), `applyCastVisibility` gating, portrait badge +
  tint in `DialogueOverlay.tsx`, focus case in `runtime.ts` `nodeFocus`.
- **New interaction / HUD element** → `ANCHORS` + `INTERACTIONS`, then a component in `src/ui/` rendered
  from `Hud.tsx` or `GameView.tsx`; game-facing state through `store.patch()`.
- **Audio** → `INITIAL_PLAYLIST` / `audioManager` in `src/state/store.ts` (tracks stream from R2).
- **Palette / component styling** → `@theme` and component CSS in `src/styles/app.css`.

## Verification

- `npm install` clean; `npm run dev` boots with no console errors (boot cover → loading bar → menu;
  no white flash, no stuck black screen).
- Play → world renders under the isometric camera; stick/keys/tap-to-walk path correctly; minimap and
  world labels track the player; dialogue choices move the stats; travel lists only beat-unlocked places.
- Menu round-trips destroy the Three.js scene cleanly (no WebGL context warnings).
- Save survives reload (Continue shows the right episode/day); on a storage-less backend the game warns
  instead of silently discarding.
- `npm run build` passes (it type-checks first via `tsc --noEmit`); `npm run preview` serves a working
  game; `dist/index.html` asset URLs start with `./`.


## Change Log & Modifications Audit

### [2026-09-06 03:04:41 +01:00] — Complete 7-Episode Story Arc, Cloudflare R2 Model Integration & Explorer Easter Eggs
**Strict Constraints Met:**
- **Zero New Files / Folders Created:** All work was completed strictly inside existing project files.
- **Always Log File Changes:** Every modified file and exact set of changes is documented below.

#### Modified Files:
1. **`src/world/models.ts`**
   - Configured Cloudflare R2 Bucket URL (`https://pub-d7c3135bfc1c4c92ba9902f5bc0199f7.r2.dev`).
   - Upgraded `loadPrototype` with sequential candidate fallback resolution: flat R2 URL, full path R2 URL, SDK packBase prefix, and local manifest URL.

2. **`src/world/dressing.ts`**
   - Wired 3D prop models into every episode location.
   - Added dressing for Ward 6 / Hospital bay (`glass`, `cup-tea`, `grapes`, `shelf-boxes`, `can`, `planter`, distant skyline towers).
   - Added desk dressing for Nadia's desk (`cup-tea`, `donut`) and Tara's audit desk (`cup-saucer`) in the Northlight Studio.

3. **`src/world/anchors.ts`**
   - Added anchors for character rigs: `STUDIO.nadia` (`-1.4, -3.6`) and `STUDIO.tara` (`-5.2, 1.2`).
   - Extended all location `openIn` arrays across Episodes 3, 4, 5, 6, and 7 so the world remains fully traversable.
   - Added `nadia` and `tara` to `ANCHORS` dictionary with interactive labels.

4. **`src/world/world.ts`**
   - Integrated full animated character rigs for **Nadia** (`0x2e8b8b` teal shirt) and **Tara Patel** (`0x9e3852` blazer).
   - Added both rigs into the `rigs` dictionary and `rigHome` mapping for camera focus and visibility filtering per room.
   - Gated Nadia's studio appearance to Episode 3+ and Tara's studio appearance to Episode 4+ in `applyCastVisibility` to ensure accurate narrative consistency during early episode playthroughs.

5. **`src/story/runtime.ts`**
   - Added camera focus handling for `who === 'nadia'` and `who === 'tara'` in `nodeFocus`.

6. **`src/ui/DialogueOverlay.tsx`**
   - Added portrait badges and color tints for `nadia` (`'N'`, `#38a3a5`) and `tara` (`'TP'`, `#b56576`).

7. **`src/state/gameState.ts`**
   - Added legacy seeds for Episodes 3-7 and hidden explorer branches:
     - `found_jukebox_cassette`, `found_family_photo_note`, `found_rooftop_manifesto`, `discovered_vantage_leak`, `unlocked_indie_timeline`, `unlocked_coop_timeline`, `unlocked_reconciliation_timeline`.
     - Episode 4: `stood_up_to_tara`, `allied_with_tara`, `sheltered_nadia_from_audit`, `jonah_mentored_nadia`.
     - Episode 5: `whistleblower_emailed`, `erased_crunch_records`, `pulled_all_nighter_solo`, `admitted_defeat_to_iris`.
     - Episode 6: `pushed_launch_back`, `certified_flawed_build`, `gave_team_full_royalties`, `family_attended_launch`.
     - Episode 7: `founded_worker_coop`, `stayed_vantage_director`, `walked_away_clean`, `dad_recovered_proud`.
   - Added interactive SMS threads and reply sets for `priya_tape`, `dad_boat`, and `jonah_charter`.

8. **`src/state/migrate.ts`**
   - Extended `BEAT_FALLBACKS` to cover all beats from Episodes 3 through 7.

9. **`src/story/story.ts`**
   - Deepened early story dialogue in Episode 1 and 2 (Priya's bar scene and the family Sunday dinner).
   - Embedded explorer secrets and alternate timeline triggers:
     - Jukebox cassette in Lamplighter (`bar_jukebox_beat`) unlocking Priya's garage mixtape.
     - Father's sailing photo note on the mantelpiece (`family_photos_beat`) unlocking his woodworking guidance.
     - Original Northlight Founding Charter (`ep2_roof_edge`) unlocking the Independent Co-op timeline.
   - Finished Episode 3 and authored complete narrative beats, dialogue, and choices for:
     - **Episode 4: "The Embedded Producer"** (Tara Patel arrives from Vantage, efficiency audits, protecting Nadia, dinner with the sisters).
     - **Episode 5: "The Blackout"** (2:00 AM server crash, corrupted geometry branches, paper trail of Vantage cuts, confronting Halvard).
     - **Episode 6: "The Gold Master"** (Submission deadline, QA memory leak discovery, the release waiver signing, midnight launch reviews).
     - **Episode 7: "The Horizon" (Series Finale)** (Two months post-launch, 1.8M sales, Halvard's contract offer, Sunday family reunion, and the 3 distinct crossroads endings: Worker Co-op, Studio Director, or Family Timber Workshop).

10. **`src/ui/GameView.tsx`**
    - Updated epilogue flag trigger to support episodes 1 through 7 (`ep1` to `ep7`).
    - Added reactive `setCast` synchronization effect hook so cast appearances update seamlessly whenever the room or episode beat advances.

11. **`src/ui/EpisodeEnd.tsx`**
    - Built comprehensive dynamic recap screen for all 7 episodes with custom kickers, subtitles, branching threads, next-episode teasers, and series completion screens.

12. **`src/ui/MainMenu.tsx`**
    - Updated `episodeOf` helper to detect and display Episodes 1 through 7 on the Continue button.


### [2026-09-06 11:05:31 +01:00] — Integrated Cloudflare R2 Music Streaming, Phone MP3 Player, Redesigned How-To-Play Modal & Incompetech Attribution
**Strict Constraints Met:**
- **Zero New Files / Folders Created:** Completed strictly inside existing files (`src/state/store.ts`, `src/ui/PhoneOverlay.tsx`, `src/ui/GameView.tsx`, `src/ui/MainMenu.tsx`, `src/styles/app.css`, and `CLAUDE.md`).
- **Always Log File Changes:** Every modified file and exact set of changes is documented below.

#### Modified Files:
1. **`src/state/store.ts`**
   - Added audio state definitions (`AudioPlayerState`, `MusicTrack`) and constants (`R2_MUSIC_BASE`, `MAIN_THEME_URL`, `INITIAL_PLAYLIST`).
   - Implemented global `audioManager` singleton:
     - `Main music.mp3` theme plays in continuous loop, automatically unlocked on initial user gesture, with playback position persisted across page refresh via `localStorage`.
     - Strict mutual exclusivity: `Main music.mp3` pauses the instant any track in the phone MP3 player plays, and resumes the instant the phone player pauses or finishes.
     - Controls for `playMain`, `pauseMain`, `playPhone`, `pausePhone`, `togglePhone`, `nextPhone`, `prevPhone`, `seekPhone`, `setVolume`, `toggleMute`, and `addCustomTrack`.

2. **`src/ui/PhoneOverlay.tsx`**
   - Built static, stylish MP3 player pinned at the bottom of the phone chassis:
     - Spinning vinyl record animation when playing (`.mp3-disc.is-spinning`).
     - Track title, artist badge, and interactive time scrubber with duration calculation.
     - Full tactile playback controls (`⏮`, `▶ / ⏸`, `⏭`, `🔊 / 🔇`).
     - Expandable playlist drawer with song selection and a custom R2 `.mp3` filename input.

3. **`src/styles/app.css`**
   - Made phone chassis taller (`height: 89vh; max-height: 45rem; max-width: 22.8rem;`) to comfortably fit both phone tabs and the static MP3 player deck.
   - Added complete styling for `.phone-music-player`, disc rotation animation, timeline scrubber, and slide-up playlist drawer.
   - Redesigned the "How to play" modal (`.modern-help-card`): glassmorphic radial background, gold badge header, icon cards for Movement, Interactions, Contextual Action, Smartphone & Mixtape, City Travel, and Story Objectives.
   - Added styling for the in-game burger menu drawer (`.burger-menu-sheet`) and Incompetech music attribution tags.

4. **`src/ui/GameView.tsx`**
   - Integrated burger menu drawer (`showMenu` state) with navigation shortcuts and prominent `Music By: Incompetech.com` attribution.
   - Upgraded the "How To Play" modal with comprehensive visual cards, clear instructions, and soundtrack attribution.

5. **`src/ui/MainMenu.tsx`**
   - Added permanent music credit footer: `Music By: Incompetech.com` linking to incompetech.com.


### [2026-09-06 11:25:35 +01:00] — Fixed Phone Static MP3 Player Controls & Incompetech Track Playlist
**Strict Constraints Met:**
- **Zero New Files / Folders Created:** Completed strictly inside existing files (`src/state/store.ts`, `src/ui/PhoneOverlay.tsx`, `src/styles/app.css`, and `CLAUDE.md`).
- **Always Log File Changes:** Every modified file and exact set of changes is documented below.

#### Key Fixes:
1. **`src/state/store.ts`**
   - Populated `INITIAL_PLAYLIST` with the exact 24 Incompetech tracks verified on the user's Cloudflare R2 bucket (`Lamplighter.mp3`, `Aces High.mp3`, `District Four.mp3`, etc.), resolving previous 404 playback errors caused by placeholder names.
   - Pre-assigned `phoneAudio.src` to `Lamplighter.mp3` with `preload = 'metadata'` so audio buffers and duration populate immediately upon boot.
   - Added direct HTMLAudioElement lifecycle event listeners (`play`, `pause`, `loadedmetadata`) to keep store state synchronized with native audio hardware.
   - Updated `togglePhone()` to check `phoneAudio.paused` directly, preventing desynchronization.

2. **`src/ui/PhoneOverlay.tsx`**
   - Added `e.stopPropagation()` on the player container and all interactive elements (`.mp3-ctrl-btn`, `.mp3-bar-track`, `.mp3-btn-playlist`, track list items) to prevent clicks from bubbling to the phone backdrop.
   - Enabled clicking on the spinning disc icon and track title to toggle play/pause directly.

3. **`src/styles/app.css`**
   - Added `flex: 1 1 auto; min-height: 0;` to `.phone-scroll` to ensure flexbox scrolling works properly without pushing the static MP3 player off-screen.
   - Added `touch-action: manipulation; position: relative; z-index: 12; pointer-events: auto !important;` to `.mp3-ctrl-btn` and player components for instant touch responsiveness.


### [2026-09-06 11:29:20 +01:00] — Redesigned Episode Summary Stat Progress Bars
**Strict Constraints Met:**
- **Zero New Files / Folders Created:** Completed strictly inside existing files (`src/ui/EpisodeEnd.tsx`, `src/styles/app.css`, and `CLAUDE.md`).
- **Always Log File Changes:** Every modified file and exact set of changes is documented below.

#### Key Enhancements:
1. **`src/ui/EpisodeEnd.tsx`**
   - Re-architected `Bar` component to position an animated glowing progress bar directly in between the label on the left and the value on the right.
   - Added visual emoji icons for each stat category (Burnout 🔥, Mara 💼, Jonah 📐, Theo 🎨, Nadia ✨, Family 🏡, Friends 🍻).
   - Displayed Nadia's junior mentorship stat starting from Episode 3+.

2. **`src/styles/app.css`**
   - Wrapped meters in a frosted container (`.ep-meters`) with subtle inset borders and box shadow.
   - Designed `.ep-meter-row` with flex alignment (`gap: 0.85rem`).
   - Added `.ep-meter-bar-track` and `.ep-meter-bar-fill` with gradient fills, glint highlight (`.ep-meter-bar-glint`), and ambient glow shadows matching each stat's tint.
   - Aligned values on the right with mood-based colors (green `#7ccb90`, amber `#eab069`, red `#e2703f`).


### [2026-09-06 12:05:04 +01:00] — Resolved THREE.GLTFLoader Colormap Texture Error
**Strict Constraints Met:**
- **Zero New Files / Folders Created:** Completed strictly inside existing files (`src/world/models.ts` and `CLAUDE.md`).
- **Always Log File Changes:** Every modified file and exact set of changes is documented below.

#### Key Fixes:
1. **`src/world/models.ts`**
   - Configured `THREE.LoadingManager` with `setURLModifier` to route relative `Textures/colormap.png` references directly to `${R2_BUCKET_URL}/Textures/colormap.png`.
   - Added procedural in-memory canvas fallback (`getFallbackColormap`) that generates a vibrant 64x64 Kenney color palette texture data URL.
   - If `colormap.png` is missing from R2, materials seamlessly apply the procedural fallback palette and console texture errors are silenced.
   - Extracted `colormap.png` from `kenney_food-kit.zip` to `C:\Users\fred\Downloads\colormap.png` for direct upload to Cloudflare R2 under `Textures/colormap.png`.

### [2026-10-11] — Repo Hygiene: `.gitignore` Added, Dead Pixi Template Layer Removed, Docs Corrected
**Strict Constraints Met:**
- **No behaviour changes:** only unused files were removed; the live game path was untouched.
- **Always Log File Changes:** every change is documented below.

#### Added Files:
1. **`.gitignore`**
   - Repo previously had none; `node_modules/` (~14,900 files) and `dist/` were committed.
   - Ignores dependencies, build output (`dist/`, `*.tsbuildinfo`), env files, logs, OS files
     (`.DS_Store`, `Thumbs.db`), editor files (keeping `.vscode/settings.json`), Vite/coverage caches,
     `Shift.zip` archives from `zip_project.*`, and the `rundot init`-generated `game.config.json`.
   - Note: `node_modules/` and `dist/` remain tracked until removed with `git rm -r --cached`.

#### Deleted Files (dead starter-template code, verified unreferenced):
1. **`src/game/pixiApp.ts`, `src/game/demoScene.ts`** — 4-line stubs; the Pixi app and bouncing-sprite demo
   had already been replaced by `src/world/world.ts`.
2. **`src/game/GameCanvas.tsx`, `src/game/stage.ts`** — the old Pixi canvas boundary + design-unit stage
   helper; nothing imported `GameCanvas` (`GameView.tsx` mounts `createWorld()` directly).
3. **`src/assets/manifest.ts`, `src/assets/preload.ts`** — the old asset warm-up path; `warmAssets()` was
   never called. Real preloading is `preloadCritical()`/`dressRooms()`/`preloadDeferred()` in
   `src/world/dressing.ts`, driven by `world.ts`. The `main.tsx` loading bar is a timed animation.
4. **`src/ui/SaveIndicator.tsx`** — imported by `GameView.tsx` but never rendered.

#### Modified Files:
1. **`src/ui/GameView.tsx`**
   - Removed the orphaned `import SaveIndicator from './SaveIndicator.tsx';` line. No other edits.
2. **`README.md`**
   - Rewritten. It described the starter template ("Pixi.js + React + RundotGameAPI Template",
     "warmAssets() via Pixi Assets bundles", "bouncing sprite demo scene"). Now documents SHIFT as a
     Three.js isometric narrative game: episodes, locations, mechanics, real file map, save backends,
     and platform notes.
3. **`CLAUDE.md`**
   - Header sections (File Structure / Key Patterns / What to Modify / Verification) rewritten for the
     actual Three.js + story-runtime architecture; the Pixi/design-unit/`ADAPT:` guidance is gone.
     Change Log below preserved verbatim.

#### Verified:
- `grep` confirmed **zero `pixi.js` imports in `src/`** and that `pixi.js` is not in `package.json`
  dependencies — only stale comments in the deleted files and `vite.config.ts` mentioned it.
- `npx tsc --noEmit` passes after deletion.
- **Correction for future sessions:** despite the "not a rundot project" framing, `RundotGameAPI` is still
  LIVE for cloud save (`state/storage.ts` `appStorage`), analytics (`runtime.ts` `track()`, `gameState.ts`,
  `GameView.tsx`), and lifecycle save-flushes (`sdk/runSdk.ts`, `main.tsx`), plus
  `rundotGameLibrariesPlugin()` in `vite.config.ts` and `npm run deploy`. `firebase` is genuinely absent
  from app code (dev-dependency hoist for the SDK only).
