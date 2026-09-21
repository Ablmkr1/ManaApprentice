# Roadside Ruin scene prototype

## Scope and selection

Roadside Ruin Depths is the earliest of the three existing dungeons. Its six rooms include two branches, backtracking, searches, progression gates, crystal rewards and the crystal-binding unlock. It is small enough to validate the presentation pattern without changing content. Abandon Workshop and Arcane Archive retain their original presentation.

Inspected before implementation: all three dungeon definitions in `content.js`; dungeon rendering, navigation, requirements, searches and reward helpers in `expedition.js`; action timing in `actions.js`; contextual spells and dungeon charges in `camp.js`/`skills.js`; equipment effects; dungeon state and serialization in `state.js`/`save.js`; the Archive Warden trigger and combat return path; Expedition scene/hotspot layout and Combat scene rendering; existing image assets and browser test conventions.

Roadside Ruin has **no enemy encounter, chest, trap, separate completion flag, or item/spell-locked doorway**. Its deeper paths require searching the current room. No additional mechanics or interactions were invented. The final alcove's existing reward unlocks `manaCrystalImbuingUnlocked`. “All rooms explored” is a derived UI summary, not a new completion rule.

## Files added or changed in this pass

- `dungeon-scene.js`: opt-in room metadata, scene/hotspot rendering, context placement, map decoration and DOM restoration.
- `dungeon-scene.css`: scoped desktop/mobile layout, typography, controls and map styles.
- `expedition.js`: two optional presentation calls in `updateDungeonUI()`; the original renderer and mechanics remain intact.
- `index.html`: load the new CSS and script.
- `assets/dungeons/roadside-ruin/{hall,chamber,alcove}.png`: three generated 1536 × 1024 raster backgrounds.
- `assets/dungeons/roadside-ruin/manifest.json`: exact generation prompts, built-in generator provenance and room assignments.
- `tests/dungeon-scene-browser.cjs` and `tests/dungeon-screenshots/`: flow assertions and desktop/mobile visual evidence.
- This document.

Pre-existing working-tree changes were preserved. No changes to dungeon definitions, rewards, save schemas, Home, Expedition scene code, or Combat code were needed.

## Reusable architecture

`DungeonScene` follows the project's plain JavaScript presentation-module convention. `prepare()` opts in only when an entry exists for the current dungeon and room. It moves the actual map, room description, search controls, spell sections and Leave Ruin button into the scene layout. Return-point comments restore these nodes when leaving the prototype. Crafting spell controls are also retained because the existing spell placement helper follows the location spell section.

`render()` presents the current room and decorates the existing map buttons. The module's small `hotspot()` and `decorateMap()` helpers serve as the reusable hotspot and room-map components; separate component frameworks are unnecessary here.

There is no second navigation implementation. Passage hotspots click the canonical map buttons, which retain `canEnterDungeonNode`, `getDungeonMovementBlockedText`, `canMoveToDungeonNode` and `moveToDungeonNode`. Search landmarks reveal/focus the original Explore Room control; that control retains `startDungeonRoomSearch`, costs, progress, random outcomes and `claimDungeonNodeReward`. Leave Ruin uses the original action button and its timing/availability. Available magic is the existing contextual spell UI.

## Art and hotspots

Each entry in `scenes[dungeonId][nodeId]` supplies:

- `image` and `alt` for a room's artwork;
- `passages`: existing exit node IDs mapped to `[x, y]` percentages;
- optional `search` and `exit` positions for existing actions;
- optional `important` map emphasis, shown only once that room is discovered.

Assignments: Entry Stair / Cracked Hall share `hall.png`; Side Chamber / Empty Room share `chamber.png`; Collapsed Passage / Crystal Binding Alcove share `alcove.png`. Art can be swapped per room by changing one `image` field. Images preserve their full 3:2 frame, so percentage positions do not drift through cropping. All images were created using the built-in image generation tool; the manifest records the complete prompt set.

Only passages present in the current node's exits get controls. Unvisited targets remain labeled “Unexplored passage,” matching the original `?` map disclosure. Search landmarks disappear once their room is explored. Major passages are spatial hotspots on desktop; on mobile the same buttons become readable controls immediately below the image.

## Preserved map and state

The original map renderer still decides which rooms appear: discovered rooms on the current layer plus adjacent targets. Existing `x`/`y` coordinates preserve topology; only the unused margin column is removed in the prototype. SVG connection lines are drawn from existing exits only when both endpoints are already visible. Current adjacent locked connections are dashed.

Rooms show current position, explored or visited state, unknown/locked state and the entrance. The system has no separate “discovered but unvisited” flag: `discovered` is set by entering a room. The UI does not invent one. On narrow screens the map is collapsible and its topology can be scrolled horizontally with touch or keyboard. No unseen room count is shown in the progress summary.

All discovery, charges, search outcomes, one-time rewards, Deep Thought, unlocks, carried loot and saved current-room state continue to use existing data. No save migration is required. The prototype also hides the higher-level region selector and makes Recall non-sticky while inside the room presentation; those controls regain their existing behavior outside this dungeon.

## Verification

Passed in the disposable preview save, with no access to the player's normal save:

- Dungeon entry, six illustrated rooms, original-map navigation and scene passage navigation.
- Hidden room names, adjacent unknown markers, connection lines, discovery, current position and backtracking before searching.
- Search gate rejection, energy affordability/cost, failed and successful searches, Mana Sense casting/charges.
- Reward claim and repeat-claim protection, final crystal-binding unlock, all-room completion, cleared-room actions, exit and re-entry.
- Real serialization and document reload mid-dungeon, preserving room state, current room and carried loot.
- Repeated rendering does not change saved state; topology, requirements, search and reward definitions stay unchanged.
- Desktop at 1440px; mobile at 390px and 320px; 44px+ hotspot targets, map expansion, no page overflow and keyboard focus after navigation. Screenshots visually inspected.
- Legacy Abandon Workshop spell gate; original Archive Warden action, existing Combat UI, victory flags and return to the same room. The browser test forces victory to exercise the transition; existing combat suites exercise fight mechanics.
- Existing `expedition-map-browser.cjs` and `west-scene-browser.cjs` passed.
- Existing `combat-scene-smoke.js` (64 checks), `combat-content-smoke.js` (199), `equipment-warden-smoke.js` (21) and `arcane-force-rank2-smoke.js` (64) passed.

Run the browser test with the existing `tests/serve-preview.cjs` server on port 8765 and Playwright available on `NODE_PATH`:

```sh
node tests/dungeon-scene-browser.cjs
```

## Converting the next dungeon

Add artwork under its own `assets/dungeons/<dungeon>/` directory and a scene entry for each existing node. Supply passage/search positions and optional map emphasis; keep room content and saved state in their existing definitions. Confirm layered map connections and spell-gated entrances against that dungeon's data. For the Archive, place its existing Warden challenge button in the context panel; keep combat in the existing Combat UI. Add any encounter artwork/state treatment as presentation metadata derived from current flags. Repeat the flow and responsive tests. No additional dungeon has been converted in this pass.

## Direct search update

The illustrated **Explore room** hotspot now starts the existing `exploreRoom`
action in one click. It mirrors the original button's unavailable state and
rechecks that button at activation. Room magic remains in the context area;
passage navigation, search costs, timing, outcomes, rewards, and saves are unchanged.
The dungeon browser suite exercises search through this hotspot, including
failure, success, mana-assisted search, rewards, and reload.
