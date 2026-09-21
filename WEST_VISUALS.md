# West Expedition visuals

Completed surface-only West integration. No gameplay definitions, dungeon rooms, shared CSS, or other regional configurations/assets were changed.

## Production assets

Exactly four built-in image_gen calls produced these final images. Optimized indexed PNGs, 1122 × 1402, matching the existing regional dimensions. The existing northern-node.webp overlay is reused at the Archive.

| Path | Bytes |
| --- | ---: |
| assets/expedition/west-map.png | 1284856 |
| assets/expedition/roadside-ruin.png | 1276529 |
| assets/expedition/silent-gearworks.png | 1232264 |
| assets/expedition/arcane-archive.png | 1176872 |

## Hotspot mapping

Coordinates are percentages of the existing shared artwork plane; positions were adjusted to the generated landmarks and mobile labels.

| Surface | Hotspots (x, y) | Existing controls |
| --- | --- | --- |
| West map | Roadside Ruin (28,47), Abandon Workshop (75,37), Arcane Archive (53,19) | Known-location inspection and current route controls |
| Roadside Ruin | Survey (28,34), stair (75,44), route (40,62) | exploreLocation, enterDungeon, route inspection |
| Abandon Workshop | Survey (33,34), entrance (75,43), route (40,62) | exploreLocation, enterDungeon, route inspection |
| Arcane Archive | Survey (36,25), door (49,36), node (75,47), route (40,62) | exploreLocation, sealedArchiveDoor ritual, enterDungeon, towerNodePanel, route inspection |

The explored Roadside Ruin label remains “Entrance to Roadside Ruin.” Completed survey markers use the existing completion treatment. The Archive node requires the existing opened-door flag, explored Archive, and an allowed node status. Its overlay uses the existing dormant/built styling.

## Implementation

expedition-scene.js contains West configuration, map eligibility/asset registration, Western node wording, and a West-only door-panel adapter. The ordinary local spell section only supplies Mana Sense and Arcane Force, so this adapter uses appendSpellCastOption and existing cost, charge, availability, requirement, and casting functions for all four spells. Buttons stay mounted across rendering; completed charges remain visible and disabled. The adapter is hidden outside the Archive door panel. Shared CSS and action routing are unchanged.

The existing ritual definition remains authoritative: one charge each of Mana Sense, Arcane Force, Imbue and Attunement, Mana maximum 14, 12 Energy door action, reset on leaving, and the existing completion flag. Displayed spell costs still incorporate existing character modifiers. No condenser or dungeon content was moved.

## Checks

Focused Playwright test: tests/west-scene-browser.cjs, using the existing disposable QA server/save fixture and headless Edge. Desktop 1360 × 1000; mobile 390 × 844. No real save loaded or written.

- Early discovery map hides unknown destination hotspots; destination selection does not mutate gameplay state.
- All three locations explored through existing action buttons; completed exploration treatment verified.
- All three existing Enter Ruin / leave dungeon actions exercised; Archive stays locked before opening.
- Four ritual spells cast through the panel, door completed through its original object action; charges reset after recall and revisit.
- Repeated rendering during actions preserves panel selection, focus and scroll.
- Discovered, unbuilt and built Western Node states checked; no node or node art before its gate.
- Desktop/mobile screenshots inspected; raster decoding, readable parchment contrast (4.5:1 checks), and no horizontal mobile overflow verified.
- West ritual controls remain hidden when moving to another surface.
- JavaScript syntax checked. No broad gameplay test suite run.

Test screenshots are in tests/west-screenshots/ and are verification captures, not production assets or generated art.

## Image prompts

Built-in image_gen, one image per prompt; no variants or extra art. Each prompt is this common prefix followed by its asset-specific text:

Use case: stylized-concept. One final production game environment painting, portrait 1122x1402, matching grounded naturalistic painterly fantasy with readable soft daylight, detailed pale weathered ancient stone, dark moss, rusted metal, muted woodland greens and earth browns. No text, labels, UI, icons, pins, locks, dotted routes, magic glows, symbols, enemies, people, cartoon, vector, isometric or mobile-strategy aesthetic. 

### west-map.png

Western-road overview: elevated natural perspective along a broken old road through quiet woodland. Three clearly separated destinations: low sunken roadside ruin with dark stair at x28% y51%; compact old stone industrial structure half-sunk into hillside with rusted metalwork at x74% y40%; distant pale windowless archive at road end x51% y25%. A natural woodland continuation beyond the road remains visible. Leave space around landmarks for later HTML hotspots. Single image, no variants.

### roadside-ruin.png

Roadside Ruin surface only: sunken moss-covered low ruin beside a broken stone road through quiet woodland. Surveyable broken walls at x28% y38%, dark descending stair entrance at x70% y43%, road at x40% y62%. No condenser, dungeon interiors or rewards. Leave breathing room around landmarks for HTML hotspots. Single final image.

### silent-gearworks.png

Abandon Workshop surface: low compact ancient stone industrial building half-sunk into wooded hillside. Weathered rusted metal braces and motionless machinery details in outer stonework at x28% y38%; cracked dark entrance at x70% y43%. Broken road foreground x40% y62%. No active machinery, resources, rewards or interior rooms. Single final image.

### arcane-archive.png

Arcane Archive surface only. Low imposing pale windowless ancient building at end of broken western woodland road. Nearly seamless stone walls for survey at x28% y33%; architecturally sealed massive plain door at x43% y44%, no glyphs or glowing spell markings. Empty ordinary earthen terrace at x74% y42% reserved for later node overlay: NO node, standing stones, crystal or machinery here. Road foreground x40% y62%. Single final image, no interior.

