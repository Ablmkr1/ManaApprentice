# East Expedition visual pass

East reuses the Expedition frame, raster cover transform, percentage hotspots, parchment panel, responsive styling, original controls and action routing. North and Outskirts scene definitions and assets are unchanged. No gameplay, costs, resources, encounters, travel routes or save fields were changed.

## Production assets

Exactly four final images were generated with the built-in imagegen tool. All are 1122 × 1402, optimized with Sharp palette PNG, quality 90, effort 10, matching Outskirts. No variants or additional node/enemy/action art were generated.

| Path | Bytes |
| --- | ---: |
| assets/expedition/east-map.png | 1,293,383 |
| assets/expedition/stag-runs.png | 1,326,798 |
| assets/expedition/hunters-cabin.png | 1,361,395 |
| assets/expedition/quiet-grove.png | 1,222,430 |

Original generated files remain in `C:/Users/abour/.codex/generated_images/01a09c40-b1f4-7ac3-9f43-b814bce192e6/`: map `exec-bc36bb2c-641b-407e-ac54-faa342c31bf5.png`, trails `exec-facb944f-d9ef-48fc-9496-e08b0c7a876f.png`, cabin `exec-aab3fcb1-6ff5-45b0-9d66-f94d83d35f35.png`, grove `exec-6c7677a7-1721-4788-ac71-9cd242a1780a.png`.

## Hotspot mapping

Coordinates are percentages of the source painting; the existing cover transform handles responsive cropping.

| Location | Hotspots and original controls |
| --- | --- |
| Stag Runs / Marked Stag Runs | Track Game at 28,42: Explore Location, Track Game, applicable magic. Hunt Game at 72,38: Hunt Game, applicable magic. |
| Hunter's Cabin / Weathered Hunter's Cabin | Weathered cabin at 32,31: Explore Location. Hide-working & stores at 26,46: Store Pelt, Take Leather, local storage, existing Tan Leather craft and applicable magic. Eastern Tower Node at 72,41: original node construction, activation and local functions, gated by East node state. |
| Quiet Grove | Quiet clearing at 50,30: Explore Location. Observation at 28,45: Observe Glass-Antler Stag, original Mana Sense interaction and progress after exploration. Disturbed roots at 73,47: Investigate Eastern Disturbance and Challenge Thornfang, gated by East regional progress. |

All scenes retain Trail & travel at 40,62. Map destinations are Stag Runs 28,51; Hunter's Cabin 78,40; Quiet Grove 52,25. Only known destinations get HTML markers, with canonical location labels and travel distances.

The cabin reuses `northern-node.webp` as a separate state-controlled overlay at left 66%, top 31%. Before discovery it is absent. Discovered and unbuilt states are dormant; built uses the existing restrained cyan CSS treatment. The map contains no state overlays. Stag observation and enemy availability use the original contextual controls, with no permanent creatures painted into the backgrounds. Completed investigations remain visible with completion status.

## Files changed in this pass

- `expedition-scene.js`: East scene/map configuration and the small configuration hooks needed for its region-specific node, visibility, overlay position and completion status. Existing North defaults remain intact. Shared CSS was not edited.
- The four production PNGs above.
- `tests/east-scene-browser.cjs`: focused browser verification using the existing disposable preview save.
- `tests/east-screenshots/`: 21 verification screenshots, not production art.
- `EAST_VISUALS.md`: this report.

The workspace already contained other modified and untracked files before this pass; they were left alone.

## Checks performed

Passed syntax checks for the renderer and East browser test, whitespace check, and the focused East test with bundled Playwright and headless Edge using the existing preview server. North/Outskirts scene definitions were compared against the pre-hook copy and are unchanged. No broad suites were run.

At desktop 1360 × 1000 and emulated mobile 390 × 844: early discovery map, actual Stag Runs exploration/tracking/hunting, cabin exploration and storage actions, hidden/discovered/unbuilt/built node presentation, grove exploration, actual three Mana Sense casts with charge progression, three observation stages and completion, disturbance encounter, victory return, and repeat Thornfang challenge. Combat victory was advanced directly in the disposable fixture to test return handling; combat balance was not tested.

Assertions cover raster decoding, panel/status text contrast of at least 4.5:1, mobile horizontal overflow, panel selection retention after storage, focus and scroll stability during tracking progress and repeated scene refreshes, completed investigation state, and state-preserving map inspection without remote local actions. The original open exploration control remains available.

Visually inspected East map, Stag Runs before/after and mobile, cabin storage and all node states including mobile, and grove before exploration, Mana Sense locked/progress/ready, observation completion and encounter availability. Landmarks and transparent hit areas align; parchment panels remain readable. Mobile verification uses browser viewport emulation, not a physical device. Existing responsive and sticky-control behavior is retained.

## Production prompt set

All four used: one final production raster, stylized-concept, portrait 1122 × 1402, naturalistic painterly deep woodland, believable scale, weathered wood, moss, dark earth, muted greens/browns, soft readable daylight and atmospheric depth. Landmarks concentrated around y30–60% for responsive cropping, with space for HTML hotspots. No text, labels, UI, icons, bars, locks, pins, dotted routes, objective markers, active magic, cyan, people, enemies, animals or loot; no cartoon, vector, isometric, mobile-strategy or overly dark treatment. Exactly one final image per call, no variants.

1. **East map:** Elevated natural forest overview; heavy game trails in brush/tall grass around 28,51; low mossy weathered hunter cabin among old trees around 70,46; still open grove around 53,28. Natural dirt routes connect terrain and continue deeper behind the grove. No discovery, node or boss state.
2. **Stag Runs:** Heavy hoof tracks in dark earth and broken undergrowth around 28,49; separate game-trail intersection through tall grass/brush around 70,43; old mossy trees at edges and empty approach around 40,62. No captured animal, enemy, traps, carcass, tools or loot.
3. **Hunter's Cabin:** Low weathered timber cabin partly hidden by moss, trees and fallen branches around 28,38; ruined hide-working bench and empty drying-frame remnants around 28,54; ordinary empty earth among roots reserved for a separate node overlay. No standing stones, node, tower, runes or magic in base art. Empty approach at 40,62.
4. **Quiet Grove:** Still open grove with enormous old trees at edges, moss and empty sunlit focal clearing around 28,44; separate tangled roots and disturbed leaf litter around 72,47; approach around 40,62. No stag, Thornfang, creatures, combat effects or active magic.

Final hotspot positions were adjusted to the generated paintings as listed above.
