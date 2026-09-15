# Expedition raster revision

## Direct-click actions (September 15 update)

Simple local landmarks now execute their existing action in one click. The scene
metadata explicitly distinguishes action landmarks from detail panels; disabling
an action never changes a panel into a shortcut. The parchment and regional maps
retain route previews and their existing travel preparation flow.

- Exploration, gathering, tracking, hunting, mining, disturbance encounters, and
  ordinary dungeon entry use the original action buttons and handlers. A compact
  wrapping tray below the illustration exposes each individual action, including
  Use Hunting Lure. Completed exploration stays visible as disabled status.
- Sense Prey and Stone Sense have separate buttons bound to their specific
  `manaSenseTarget` contexts. They retain canonical mana costs, durations, unlocks,
  and active-state checks. Duplicate targeted options in the utility area are hidden.
- Contextual actions and remaining magic stay available below the scene without
  selecting a landmark. Stores, crafting, trap sites, staged objects, the Archive
  ritual, and tower nodes retain their detail panels.
- Direct buttons show costs, blocked reasons, and progress. Pointer and keyboard
  activation do not open or scroll a detail panel. Artwork captions stay compact;
  the tray provides full requirements and wraps into one column on narrow screens.
- Illustrated dungeon search now delegates immediately to `exploreRoom`; the
  existing room magic and navigation controls remain available.

Validation: all five regional browser suites, parchment map, dungeon flow, and
`tests/expedition-direct-actions-browser.cjs`. The dedicated suite checks actual
marker clicks, keyboard activation, single charging, stale availability, busy and
mana gates, explicit spell targets, lure use, exploration completion, progress,
focus/scroll stability, utility access, and 1360/390/320px layouts. Screenshots are
`tests/expedition-screenshots/direct-actions-{1360,390,320}.png`.

The earlier sections below document the original raster pass; this update
supersedes their descriptions of inspecting single-action landmarks.

The local working copy was treated as authoritative. This revision replaces the rejected Expedition scenery while retaining the first pass's functional presentation. Home, combat styling, other regions, and dungeon artwork were not redesigned. Existing unrelated edits were left in place.

## Retained behavior

- Planning, preparation and packing, open exploration, known destination selection, travel/pause/arrival, Return and Recall, and node jumps.
- Existing location investigations, processing, resource transfers, Stone Sense, encounters, combat results/return, Northern Node construction, Advanced Recall, and golem assignment.
- Original action buttons and section containers, handlers, cost and availability owners, progress updates, save compatibility, retained region/dungeon interfaces, keyboard controls and reduced motion.
- Transient landmark selection and map browsing; no new saved state or gameplay definitions. Inspecting routes cannot perform work remotely.

The only shared gameplay-code edit extracts the existing stone reward expression into `getGatherStoneAmount()` in `actions.js`. The reward and scene's yield description call the same function; the expression, costs, and reward behavior are unchanged.

## Removed presentation

Removed the entire `scenery()` SVG builder, including its mountain/terrain paths, procedural trees and rocks, smelter/shelter/mine/node shapes, painted stream, gradients and noise filter. Removed its art vocabulary fields, SVG sizing/compression rules, and node rune/ring selectors. There is one Expedition renderer.

`expedition-scene.js` now creates a single background `<img>` for each scene. One shared cover transform sizes the raster and percentage-based hit-area plane together, without stretching or independently shifting the painting. Native hotspot buttons rest transparently over landmarks, with separate parchment captions. Hover, focus, and selection use warm restrained highlights. Active Stone Sense adds temporary cyan lighting to the scree hotspot.

## Generated asset manifest

Generated with the built-in image-generation tool, using `assets/home/clearing-background-landmarks.png` as the four scenes' style reference. All output artwork was visually inspected before WebP optimization. Original generated files remain in the generator's output directory; the game uses the optimized project copies below.

| Project asset | Dimensions | Size |
| --- | --- | --- |
| `assets/expedition/north.webp` | 1122 × 1402 | 502 KiB |
| `assets/expedition/foothill-scree.webp` | 1122 × 1402 | 475 KiB |
| `assets/expedition/miners-camp.webp` | 1122 × 1402 | 471 KiB |
| `assets/expedition/iron-mine.webp` | 1122 × 1402 | 446 KiB |
| `assets/expedition/northern-node.webp` | 420 × 525, alpha | 60 KiB |

Total: approximately 1.91 MiB. Exact prompts, reference and source paths are saved in `assets/expedition/manifest.json`. There are no per-action or per-resource generated images. Each background includes its physical landmarks and no baked labels or UI.

**Source/brief discrepancy:** `towerNodeDefinitions.north.locationName` is `minersCamp`, not `ironMine`. Node discovery, construction, jumps, and golems remain at the camp. The single transparent dormant node overlay is used there only after the existing reveal gate. Built state adds restrained cyan light. Iron Mine remains node-free in every node progression state, preserving both location ownership and the no-remote-interaction rule.

## Hotspot-to-action mapping

Coordinates below are percentages of the original raster, before the shared cover transform. Availability and costs remain in the original gameplay owners, outside scene configuration.

| Location | Hotspot | Center | Existing controls exposed |
| --- | --- | --- | --- |
| `foothillScree` | Loose scree | 29%, 55% | Gather Stone; location/crafting magic; current Stone Sense effect, ore chance and canonical stone yield |
| `foothillScree` | Rocky slope | 68%, 36% | Explore Location; existing completed-investigation status |
| `foothillScree` | Trail & travel | 60%, 62% | Inspect existing routes; no immediate travel or work |
| `minersCamp` | Smelter & stores | 28%, 46% | Store Fuel, Store Ore, Take Iron, Smelt Iron, local storage, Study Smelter Heat and its existing Mana Sense requirements; applicable magic |
| `minersCamp` | Abandoned worksite | 75%, 54% | Explore Location, including the existing stream/worksite investigation sequence |
| `minersCamp` | Northern Node | 72%, 30% | Existing node state, construction/materials/imbuement, thread sensing, Advanced Recall and golem/elemental assignments, gated by current progression |
| `minersCamp` | Trail & travel | 40%, 62% | Inspect existing routes |
| `ironMine` | Mine entrance | 27%, 39% | Explore Location, Mine Stone, Mine Iron, canonical mining yields and applicable magic |
| `ironMine` | Disturbed rock | 72%, 50% | Investigate Northern Disturbance and Challenge Earth Elemental, subject to existing gates |
| `ironMine` | Trail & travel | 40%, 62% | Inspect existing routes |

Shared legitimate contextual utilities remain available with a selected work area. North map destinations use live discovered IDs only: Scree at 30%,57%; Camp at 57%,44%; Mine at 81%,26%. Undiscovered destinations have no named markers, accessible labels, or interactive highlights, though their terrain can naturally exist in the painting. Open exploration retains its original control above the map.

## Readability and responsive behavior

- Main parchment `#fffaf0`, secondary parchment `#eadfca`, primary ink `#2b241c`, secondary ink `#655b4f`, visible warm borders. Forest green primarily frames the view and selected region.
- Pack usage and its itemized contents, water, region controls, travel controls, packing, resources, costs, yields, requirements, and disabled actions use readable surfaces. Activity progress stays on the active action instead of occupying a separate task-status row. The smelter panel reports relevant pack quantities alongside storage.
- Desktop panel is up to 460px wide and switches to the side opposite the selected landmark. The painting stays fixed. Close or Escape exposes landmarks under the panel; Escape restores focus.
- At widths up to 900px, a 330px scene is followed by a bright sheet, with a sticky heading and scrollable contents. Selecting a hotspot scrolls the sheet into reach. Mobile Return/Recall remains in the sticky travel controls beneath the existing app header.
- No opening animation is replayed on ticks. Counts and progress update in the existing controls; repeatable work preserves panel selection, focus, DOM identity and sheet scroll.
- Scoped reduced-motion treatment and native keyboard buttons are retained. Hotspots override the shared pressed-button transform so pointer-down cannot displace their image coordinates; the 320px reduced-motion pointer regression passes.

## Validation

Run with bundled Playwright available on `NODE_PATH`:

```text
node tests/serve-preview.cjs
node tests/expedition-scene-browser.cjs
```

The browser suite uses `tests/overhaul-preview.html` and its disposable QA save key, never the real player save. It passed in headless Edge at 1360×1000, 390×844 and 320×740:

- North locked/undiscovered, only Scree discovered, and all three destinations discovered.
- Scree investigation, Stone Sense unavailable/available/active, gathering progress and repeat actions.
- Camp investigation, Study Smelter Heat, smelting progress, resource transfers.
- Node hidden, discovered, unbuilt, built, Advanced Recall and golem assignment at its actual camp location.
- Iron Mine before node discovery, after node discovery/unbuilt, and after completion, with no leaked node UI or art; mining and disturbance/encounter gates.
- Preparation, packing, open exploration, travel/pause/arrival, Return/Recall, node jumps and intra-region travel.
- No-op route browsing during active work; no remote gathering.
- Combat entry, victory/return and repeat challenge; retained East and dungeon entry/exit.
- Real save/load, stable focus and scroll, Escape, reduced motion, no horizontal overflow, raster decoding and absence of SVG scene art.
- Computed contrast checks for visible panel/status descriptions, headings, action labels/costs/reasons and resource quantities meet 4.5:1 against their reading surfaces.

Seven focused smoke suites passed (286 checks): carry capacity, progression consistency passes 1 and 2, combat scene, golem management, UI architecture, and equipment effects. JavaScript syntax and whitespace checks also passed.

Screenshots are under `tests/expedition-screenshots/`. Key review images:

- `north-map-all-discovered-desktop.png`
- `north-map-only-scree-desktop.png`
- `foothill-scree-desktop.png`
- `foothill-scree-active-progress.png`
- `miners-camp-desktop.png`
- `northern-node-desktop.png`
- `northern-node-unbuilt-desktop.png`
- `iron-mine-node-built-desktop.png`
- `miners-camp-mobile.png`
- `mobile-viewport.png`

The requested states were captured and visually reviewed. Full-section captures suppress app navigation/toasts for clarity; the mobile viewport capture retains the app header and navigation while suppressing transient toasts.

## Limits

Mobile verification uses browser viewport emulation, not physical iPhone hardware; no screen-reader device audit was performed. Contrast assertions cover the listed reading surfaces, not a certification of the entire game. Existing shared action-reason wording remains owned by the game (for example, its generic matching-location message on empty storage transfers); the scene adds relevant pack quantities and transfer requirements for clarity. The node's actual location differs from the brief as documented above. Other-region and dungeon art remain outside this pass.
