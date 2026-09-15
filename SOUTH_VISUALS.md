# South Expedition visual pass

South now uses the existing Expedition frame, raster renderer, parchment panels, percentage hotspots, responsive cover transform, and original action routing. The production change is confined to South configuration and its map/region/label branches in `expedition-scene.js`. Shared CSS and prior regional definitions, assets, and gameplay were left unchanged.

## Final production assets

Exactly four images were generated using the built-in imagegen tool, one per destination, without variants or additional interaction art. All are 1122 × 1402 and optimized using Sharp palette PNG, quality 90, effort 10.

| Path | Bytes |
| --- | ---: |
| assets/expedition/south-map.png | 1,271,043 |
| assets/expedition/herb-patch.png | 1,283,052 |
| assets/expedition/alchemists-hut.png | 1,258,437 |
| assets/expedition/overgrown-fields.png | 1,234,856 |

## Hotspot mapping

Coordinates are percentages of the painting. All three scenes retain the existing Trail & travel control at 40,62.

| Location | Hotspots and existing controls |
| --- | --- |
| wildHerbPatch / Herb Patch | Wild growth 70,35: Explore Location, completion state. Herb clusters 28,44: Gather Herbs and applicable existing magic. |
| alchemistsHut / Abandoned Alchemist's Hut | Abandoned hut 32,24: Explore Location. Study Infusion Pattern 28,43: original object action, Mana Sense requirements and progress. Stores 57,33: local storage, Store Fuel, Store Herb, Store Glimmerleaf, existing crafts, both tonic concentration actions and applicable magic. Southern Tower Node 77,45: original node panel and local functions, gated by South node state. |
| overgrownFields | Cultivation rows 28,43: Explore Location, Gather Glimmerleaf and applicable magic. Tangled briars 72,44: Investigate Southern Disturbance and Challenge Blighted Briar, gated by South regional progress and marked complete after resolution. |

Map destinations: Herb Patch 28,51; Alchemist's Hut 74,40; Overgrown Fields 51,25. Only known locations receive markers, with labels and distances supplied by existing gameplay. Map selection preserves physical location, activity and resources. Open exploration remains available.

The hut reuses `northern-node.webp` through the existing state overlay at left 71%, top 35%. It is absent before discovery, dormant when discovered/unbuilt, and uses the existing restrained cyan treatment when built. No node, monster, combat effects or active magic is baked into South backgrounds.

## Files changed in this pass

- `expedition-scene.js`: South scene/map configuration and South branches in existing region selection, caption and node labeling.
- The four production PNGs listed above.
- `tests/south-scene-browser.cjs`: focused verification using the existing disposable save fixture.
- `tests/south-screenshots/`: 23 browser verification captures; these are QA evidence, not generated production artwork.
- `SOUTH_VISUALS.md`: this report.

The workspace contained other modified and untracked files before this task. Those changes were preserved.

## Verification

Passed the focused South Playwright test in headless Edge against the existing local test server. JavaScript syntax checks passed for the renderer and South test. The renderer diff against the pre-pass copy contains only South additions/branches; whitespace inspection found no errors. No broad test suites were run.

Desktop 1360 × 1000 and mobile viewport 390 × 844 checks cover decoded raster backgrounds, early discovery map, Herb Patch exploration and gathering, hut exploration, three actual Mana Sense casts and Study Infusion Pattern completion, actual storage transfers and both concentration actions, hidden/discovered/unbuilt/built node states, field exploration and Glimmerleaf gathering, disturbance encounter, victory return and repeat Blighted Briar challenge. Node construction and online controls remain visible in the original scrollable panel.

Assertions verify panel/status text contrast of at least 4.5:1, no mobile horizontal overflow, stable panel selection during repeatable actions, focus and scroll preservation during gathering progress and repeated renders, investigation completion status, state-preserving map inspection, and absence of remote local actions. No browser page errors occurred. Combat victory was advanced directly in the disposable fixture to verify return behavior; combat balance was not tested. Node states were staged with existing fixture fields to verify presentation rather than replaying all construction gameplay. Existing travel code was unchanged; map inspection and open-exploration control availability were checked.

Visually inspected all four production paintings and desktop/mobile captures for the requested states, including node construction/online panels. Adjusted only the hut hotspot configuration to separate labels on mobile. Parchment text is readable and landmarks align with the paintings. Mobile verification uses viewport emulation, not a physical device.

## Production prompt set

All four calls used: stylized-concept; one final production raster for grounded painterly fantasy expedition, portrait 1122 × 1402; naturalistic detailed brushwork, lush southern overgrowth, warm green daylight, readable brightness, wet earth, old wood, vines and stone, muted greens and earth tones, believable scale and atmospheric depth matching woodland expedition art. No text, labels, UI, icons, pins, locks, objectives, marked routes, cyan, active magic, glowing markers, people, creatures, enemies, cartoon, vector, isometric or mobile-strategy look. Room around landmarks for HTML hotspots; exactly one image, no variants.

1. South map: Elevated natural overview; useful herb patch amid dense wild growth at 28,51; crooked vine-covered hut at 74,40; cultivated rows swallowed by waist-high plants at 51,25. Separate destinations, natural path continuing deeper into unexplored growth, no state or distances.
2. Herb Patch: Dense readable useful bright herbs amid grass and tangled growth; herb cluster at 28,44, exploration area at 70,35, approach at 40,62. No alchemy equipment, tonics, tools, enemies or extra resources.
3. Alchemist's Hut: Crooked vine-covered abandoned hut with clouded green glass and weathered timber at 32,30; broken entry reveals damaged workbench, stained bowls and herb-drying remnants at 28,43; storage shelves and bowls at 68,48. Empty earth for a later node overlay, no tower, node, standing stones, runes, active magic or glowing glass. Approach at 40,62. Final HTML coordinates were aligned to the resulting painting.
4. Overgrown Fields: Reclaimed cultivated fields, fading rows and waist-high plants; subtly glimmering leaf clusters reflecting ordinary daylight at 28,43; tangled briars and disturbed cultivation at 72,44; approach at 40,62. No monster, combat effects or active magic.
