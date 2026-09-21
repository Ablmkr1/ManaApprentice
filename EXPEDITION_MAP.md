# Expedition parchment map

## Behavior and files

Before the player finds the old map in the Outskirts cave, opening Expedition shows the retained Outskirts interface and the parchment-map control is hidden. Once `oldMapFound` is earned, opening the Expedition tab selects the parchment map by default. Selecting a region displays earned highlights in the bottom sheet; **Enter [region]** opens its retained illustrated navigation scene. **Return to Map** and Escape switch between map and scene without changing the expedition. An active expedition must return to camp before preparing a different region, following the existing travel rules. Combat and active dungeons retain their own views.

- `expedition-map-config.js`: declarative region coordinates, overlay IDs, assets/sprite cells, accessible labels, destinations, visibility predicates, and home variants.
- `expedition-map.js`: inline MapBase/MapOverlays renderer, selection, bottom details, current-location indication, keyboard focus, and delegation to original travel controls. Replaces the previous card dialog.
- `expedition-scene.css`: parchment presentation, shared percentage coordinate plane, large transparent hit areas, amber states, mobile scrolling and wrapping scene headings.
- `ui.js`: opens the map after a user selects the Expedition tab and its panel becomes visible.
- `index.html`: loads the configuration before the renderer and updates presentation cache versions.
- `assets/expedition/map/`: six generated WebP assets and the complete generation prompt manifest.
- `tests/expedition-map-browser.cjs`: default entry, disclosure boundaries, home transitions, keyboard/pointer navigation, mobile layout and original travel coverage.
- Regional/browser fixture updates: `expedition-scene-browser.cjs`, `outskirts-scene-browser.cjs`, `east-scene-browser.cjs`, `south-scene-browser.cjs`, `west-scene-browser.cjs`, `dungeon-scene-browser.cjs`. Fixtures explicitly leave the default map when testing a regional scene. The older North suite's expectations for unillustrated Outskirts/East and direct dungeon entry were updated to the already-established illustrated interfaces.

Existing gameplay code, definitions, saved IDs, resource/research rules and save schema are unchanged by this pass. Pre-existing workspace changes were retained.

## State model

The map is a read-only projection. `showing`, `selected` and a render signature are transient closure values, never saved. Every overlay has `id`, `region`, normalized `x/y`, `asset`, `label`, `displayCondition`, and `destination`. Optional `sprite` selects a cell of the transparent landmark atlas; asset/label functions provide camp improvement variants. The renderer evaluates `displayCondition` before creating any DOM, tooltip, accessible name or image for that object. Actual discovery changes rebuild overlays while preserving focused IDs; ordinary ticks retain the DOM and pan position.

`MapBase` is one immutable geography-only painting. Labels/hit areas use coordinates: Outskirts **50,50**, North **38,16**, East **79,31**, South **67,76**, West **21,30**. Outer-region destinations progress visually outward from camp in travel-distance order. Related encounter and condenser art stays beside its destination. These are presentation coordinates only; travel distances and discovery gates are unchanged.

`MapOverlays` contains native buttons and transparent landmark imagery. Existing regional paintings are not used as thumbnails because they could expose secondary discoveries or interior structures. The atlas contains only individual exteriors, terrain miniatures and separately gated objects. No future objects are baked into the base.

## Authoritative progression gates

All destination rows below additionally require `getRegionState(region).unlocked` and membership in `getRegionKnownLocations(region)` (which reads the location's existing `discovered` flag).

| Overlay / location ID | Region | Discovery condition / visual |
| --- | --- | --- |
| `mysteriousPlants` | Outskirts | Location discovered; pale plant patch |
| `strangeTrails` | Outskirts | Location discovered; footpath, no prey/traps |
| `creepyCave` | Outskirts | Location discovered; cave exterior |
| `mysteriousTrail` | Outskirts | Location discovered; trail, label from `getLocationLabel` |
| `foothillScree` | North | Location discovered; scree |
| `minersCamp` | North | Location discovered; modest abandoned shelter |
| `ironMine` | North | Location discovered; mine exterior |
| `stagRuns` | East | Location discovered; tracks/path, no deer |
| `huntersCabin` | East | Location discovered; cabin exterior, no tanning machinery |
| `quietGrove` | East | Location discovered; empty grove, no stag |
| `wildHerbPatch` | South | Location discovered; named herb patch |
| `alchemistsHut` | South | Location discovered; hut exterior, no alchemy interior |
| `overgrownFields` | South | Location discovered; field rows |
| `roadsideRuin` | West | Location discovered; ruined arch, no interior/crystal systems |
| `silentGearworks` | West | Location discovered; ruined exterior, no machinery |
| `arcaneArchive` | West | Location discovered; sealed archive exterior, no interior |
| `<location>-dungeon` | Location's region | Discovered location **and** `location.explored` **and** `location.dungeon`; existing torch artwork identifies the entrance |
| `north-node` | North / `minersCamp` | Discovered camp and node `activated`, `researchUnlocked`, or `built` |
| `east-node` | East / `huntersCabin` | Discovered cabin and node `activated`, `researchUnlocked`, or `built` |
| `south-node` | South / `alchemistsHut` | Discovered hut and node `activated`, `researchUnlocked`, or `built` |
| `west-node` | West / `arcaneArchive` | Same node flags, plus `archiveDoorOpened` and Archive `explored` |
| `north-elemental` | North / `ironMine` | Discovered mine and `northernDisturbance.resolved`; triggering a disturbance alone reveals no creature |
| `glass-antler-stag` | East / `quietGrove` | Discovered grove and grove `explored`, matching the existing stag revelation |
| `western-condenser` | West / `roadsideRuin` | Discovered ruin and `hasPurchasedCampUpgrade('manaCondenser')`; plans, research and a frame alone do not show a finished condenser |

Node art reuses `assets/expedition/northern-node.webp`; labels distinguish discovered and built state. No new discovery flags or progression requirements were introduced. Future detailed resource systems, jobs or enemies can be added as independently gated overlays; the map does not infer them from regional progress or render undiscovered props.

### Central Outskirts

All foundation/tower variants remain exactly **50,50**; they never replace the Outskirts region.

| State / overlay | Existing gate |
| --- | --- |
| Camp workspot | Camp variant, `isHomeWorkSpotDeclared()`, no purchased workbench |
| Camp workbench | Camp variant, purchased `workbench`; replaces workspot at the same position |
| Camp fire | Camp variant, purchased `smallFire`; `stoneFirePit` selects improved art |
| Camp shelter | Camp variant, purchased `crudeLeanTo`; highest purchased `lessCrudeShelter`, `framedShelter`, `smallHut` selects improvement art |
| Foundation | `magic.sensedReveals.campFoundation`, with no construction started; camp overlays disappear |
| Tower under construction | `getTowerConstructionState('towerFoundation')` is `under-construction`/`completed`, or `towerConstructionUnlocked`; replaces foundation/camp |
| Expanded tower | `getProjectState('towerFloor2').completed`; an unfinished upper floor does not show a completed roof |

The canonical construction helper detects deposited materials, completed work, active project work and completion. Merely unlocking the foundation project does not display construction. Existing completed-tower flags take precedence for compatible loaded games. Inspecting the central site uses the existing Home/Tower navigation; it performs no remote construction.

## Assets

Generated with the built-in `image_gen` tool. The attachment contained the written brief only, so the supplied prototype image was unavailable. The painting follows the written bright parchment direction. Prompts are preserved verbatim in `assets/expedition/map/manifest.json`.

| Asset | Dimensions | Use |
| --- | --- | --- |
| `parchment.webp` | 1536 × 1024 | Opaque permanent geography |
| `foundation.webp` | 1536 × 1024 | Transparent discovered foundation |
| `tower.webp` | 1273 × 1236 | Transparent construction stage |
| `tower-expanded.webp` | 1235 × 1274 | Transparent completed upper floor |
| `landmarks.webp` | 1254 × 1254 | Transparent 4 × 4 atlas; CSS cell selection |
| `stag.webp` | 1374 × 1145 | Transparent discovered stag |

Total generated runtime art: 2,331,530 bytes (about 2.2 MiB). Alpha was verified after WebP encoding. Existing camp and entrance/node assets are reused. Generated source PNGs remain in the generator's output directory; runtime references all point inside this project.

## Validation

- Map suite passes at 1360, 390 and 320 pixels: early camp without foundation/tower; foundation only; construction at the same center; finished upper floor; partial discovery in all four outer regions; node/stag/elemental/condenser/dungeon gates; locked hints; all five region entry/return loops; pointer travel; 44px object targets; no page/panel overflow; focus stability; reduced motion; current location and original destination/intra-region travel.
- All five regional browser suites pass. North additionally covers preparation/packing/arrival/Recall/node jumps, processing, gathering, combat return, repeat actions and real disposable-save load.
- Dungeon browser suite passes: room discovery, locks, movement, actions, rewards, reload, entry/exit and Archive combat return.
- Seven smoke suites pass: progression consistency 1/2, combat scene, golem management, equipment effects, UI architecture and Home construction (296 checks).
- JavaScript syntax and `git diff --check` pass.
- Reviewed parchment screenshots in `tests/expedition-screenshots/parchment-*.png`, including early, foundation, construction, partial/discovered desktop and 390/320px layouts. Mobile uses a horizontally scrollable 720px parchment with an independent wrapping detail panel; region selection recenters the parchment when returning from a scene. Browser checks use a disposable save key, never the player's save.

Mobile validation is viewport emulation in headless Edge, not a physical-device or screen-reader audit. Art stays still; reduced-motion rules also suppress inherited transitions and animations.
