# Outskirts visual pass

Outskirts uses the existing Expedition renderer, parchment panel, transparent HTML hotspot buttons, cover transform, responsive layout, action owners and route selection. North scene definitions, coordinates and assets are unchanged. No gameplay, save fields, costs, routes, Home, combat or other-region art changed.

## Assets

Exactly four production images generated with the built-in image-generation tool. Each is 1122 × 1402, matching North, then optimized as a palette PNG with Sharp (quality 90, effort 10). Total: 4,991,353 bytes. No variants or per-site images were generated.

| Path | Bytes | Use |
| --- | ---: | --- |
| assets/expedition/outskirts-map.png | 1244954 | Discovered Outskirts destinations only receive HTML markers |
| assets/expedition/outskirts-forest.png | 1261859 | Shared Plants and Trails background |
| assets/expedition/creepy-cave.png | 1239897 | Loose stone and cave entrance |
| assets/expedition/abandoned-camp.png | 1244643 | Three existing camp investigations |

Original source files remain under `C:/Users/abour/.codex/generated_images/01a09bf6-3a59-78a2-9036-826e65451bcc/`: map `exec-a76ceb0b-5a39-4a52-a364-f345cadb5c8c.png`, forest `exec-f31ab26a-03f4-4637-9937-6a3f19cf1f2f.png`, cave `exec-418689d3-bfa3-454c-bf0d-247984c0c593.png`, camp `exec-5a60968b-48e0-4736-93c3-bd2d8cfa1b66.png`.

## Hotspots

| Location | Landmark centers (percent of raster) | Existing controls |
| --- | --- | --- |
| Mysterious Plants / Fibrous Plants | Pale plants 24,50 | Explore Location; Gather Fiber; applicable magic |
| Strange Trails / Animal Trails | Grass & brush 71,46 | Explore Location; Scout Trail; Set Trap; Check Trap; all five existing site status rows |
| Creepy Cave | Loose stone 27,53; Cave entrance 63,41 | Gather Stone with canonical yield and remaining count; Explore Cave Interior with canonical requirements/progress |
| Mysterious Trail / Abandoned Camp | Washed Out Fire Pit 28,44; Shredded Pack 72,48; Ruined Shelter 66,29 | Matching original object investigation only |

Every local scene also has Trail & travel at 40,62. Map centers are Plants 25,49; Trails 70,51; Cave 29,24; Camp 77,24. Map labels use `getLocationLabel`; only `getRegionKnownLocations` destinations receive markers. Selection does not travel or replace the physical location. Existing open exploration stays available.

Object completion uses `isLocationObjectComplete`, progress uses the existing accessors, and completed objects remain in the scene marked Complete. Unstarted objects use a separate HTML New indicator. Repeatable action buttons stay in their original DOM and retain panel selection, focus and scroll. Trap handling remains the game's existing shared controls and five site rows, without adding new per-site gameplay.

## Changed files

- `expedition-scene.js`: four scene definitions, Outskirts map coordinates and activation, region caption, object-specific panel filtering and completion text.
- Four PNGs above.
- `tests/outskirts-scene-browser.cjs`: focused disposable-save browser verification.
- `tests/outskirts-screenshots/`: 15 verification captures.
- This report.

## Verification

Passed `node --check expedition-scene.js`, whitespace check, and `node tests/outskirts-scene-browser.cjs` using bundled Playwright and headless Edge with the existing preview server. Only Outskirts states were exercised.

At 1360 × 1000 and 390 × 844: early map discovery, Plants before/after actual three-step exploration, actual fiber gathering and stable focus/scroll during progress, Trails controls and five site rows, actual trap placement/checking, cave stone count and interior control, all three Camp object controls with isolated filtering, actual completed fire-pit investigation, raster decoding, text contrast at least 4.5:1 for tested panel/status text, and no horizontal mobile overflow. Route-marker selection preserves expedition/activity/resources and exposes no remote Gather Fiber action.

Visually inspected the early map desktop/mobile, Plants before/after, Trails, cave stone/interior, Camp all-landmarks/selected shelter, and mobile completed Camp panel. Painted landmarks align with their HTML hit areas and reading surfaces remain bright. Mobile uses viewport emulation; no physical-device or screen-reader audit. No broad test suites were run.

## Production prompt set (brief)

All four prompts specified stylized-concept production raster art, portrait 1122 × 1402, painterly naturalistic grounded fantasy woodland, believable materials, muted greens/browns, clear warm daylight, landmarks concentrated in the middle band for responsive cropping, and breathing room for HTML hotspots. All prohibited text, labels, UI, icons, markers, locks, dotted trails, buttons, cartoon/vector/isometric/mobile-strategy styling, and heavy dark overlays; each requested one final image only.

1. **Map:** Elevated perspective forest overview with pale fibrous plants beside the path at 28,56, small animal tracks in grass/brush at 67,53, dark cave in wooded hillside at 28,35, distant abandoned camp with collapsed shelter at 70,28, and an open earth path deeper into wilderness. No people.
2. **Forest:** Pale fibrous plant clumps at 28,53, separate grassy trail at 68,48 with split tree, thorn bush, fallen log, muddy bend and hollow stump. Central footpath at 43,62, canopy and forest floor filling portrait. No people, animals, traps, buildings or treasure.
3. **Cave:** Detailed forested hillside, dark unlit cave entrance at 65,37, loose gray stone slope at 29,53 and empty approach path at 40,62. No interior discoveries, map, runes, magic, glowing objects, loot, facilities, enemies or people.
4. **Camp:** Quiet ruined camp with washed-out cold muddy fire pit at 28,50, shredded leather backpack at 70,55 and collapsed primitive rotted-pole/torn-cloth shelter at 66,32. Empty approach at 40,62. No added loot, torch/journal discoveries, enemies, people, resources, functional facilities, fire or smoke.

Final hotspot coordinates were aligned to the generated artwork, as listed above.
