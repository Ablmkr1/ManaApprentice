# Tower and equipment overhaul

Baseline: clean working tree; all 16 existing `tests/*smoke.js` suites pass.
No applicable AGENTS.md was found in the repository or its ancestor directories.

Checkpoints:
1. Split room projects into functional/upgrade stages; explicit recovery and Mana Conduit.
2. Central bounded wearable records, atomic operations, and versioned legacy conversion.
3. Equipped effects, regional events, Study/collection UI using existing assets.
4. Regression suite, combat loadouts, desktop/mobile browser verification.

Preserve floor shells and temporary tool charges. Use existing resources only. Room
functional materials/work are approximately 30%, with regional ingredients deferred
to upgrades. Recipe defaults and verification results are recorded below as completed.

## Delivered

All six rooms have functional and upgraded construction stages. Floor 2 accepts
any functional Floor 1 room. Existing floor shells, enemies, spells, temporary tool
charges, infrastructure Imbue gates and resource types remain unchanged.

`equipment.js` centralizes per-item ownership, enchantments, recipes, validation,
transactions, migration, equipped effects, regional triggers and collection UI.
`content.js` defines room stages; `camp.js`, `skills.js`, `actions.js`, `combat.js`
and `expedition.js` integrate them. `save.js` implements version 35 and backup;
`script.js` updates recovery/developer fixtures; `resources.js` removes obsolete
regeneration commentary. `index.html`, `ui.js` and `style.css` provide the controls,
two ring positions, activity labels and cache updates. Tests and disposable browser
preview fixtures are under `tests/`.

## Room defaults

Both stages together preserve every original material amount and total work.
Material quantities are rounded from 30%; work is rounded to tens. Advanced
ingredients are deferred entirely to upgrades.

| Room | Functional materials; work | Upgrade materials; work |
|---|---|---|
| Bedroom | Wood 48, fiber 30, leather 9, nails 18; 130 | Wood 112, fiber 70, leather 21, nails 42; 290 |
| Forge | Stone 75, iron 45, wood 30, nails 36; 230 | Stone 175, iron 105, wood 70, nails 84, charged crystal 6; 530 |
| Workshop | Wood 60, iron 18, nails 30, mana crystal 1; 160 | Wood 140, iron 42, nails 70, mana crystal 3; 360 |
| Alchemy | Wood 54, stone 36, iron 12, herb 24, mana crystal 2; 190 | Wood 126, stone 84, iron 28, herb 56, glimmerleaf 20, mana crystal 4; 430 |
| Library | Wood 54, leather 12, mana crystal 2, nails 24; 140 | Wood 126, leather 28, mana crystal 6, nails 56; 340 |
| Study | Wood 54, stone 30, iron 12, mana crystal 6; 220 | Wood 126, stone 70, iron 28, mana crystal 14, charged crystal 12, imbued wood 50; 500 |

Bedroom Energy is multiplied by 1.25; upgraded rest completes in 10 seconds and
adds 20 mana, increased to 25/30 by Meditative Weave. No idle/offline mana rate
remains. Library Study costs 5 Energy per 3-second cycle and restores 2/4 Focus.
Research and ordinary crafting durations are multiplied by 0.85; Tower iron and
brewing durations by 0.75. Steel is excluded from Workshop acceleration.
Grand Study awards Imbue XP times 1.2 once, including Rank II. Ordinary batches
offer 1/5/10, advanced tonics 1/2/3 within existing tonic slots. Existing steel
batches remain available. Grand Alchemy reuses Improved Stamina and Major Mana
Tonics with their existing prerequisites; existing single-tonic access is preserved.

Access concern: unchanged Floor 1/2 shells require 1,200/1,600 work. Together they
require 1,100 stone, 550 wood, 220 iron, 200 nails and 8 charged crystals, before
room materials. They still dominate the shortened enchanting route: choosing
Bedroom then Study adds only 350 functional-room work. No shell cost rebalance
was made. No steel, greater enchantment, or Warden reward is needed for the Forge
or Study upgrades. No placeholder advanced research was added.

## Recipe defaults and effects

Base gear retains established recipes. Standard binding: fiber 12, leather 4,
mana crystals 2, mana 15. Greater wearable upgrade: fiber 20, leather 6, mana
crystals 5, charged crystals 2, mana 20; upgrades preserve the instance and name.
Bindings, upgrades, runes and salvage take 3 seconds. Crafting uses base duration.

Mana ring: iron ring 1, mana crystals 2, mana 10. Warding ring: iron ring 1,
mana crystals 3, stone 10, mana 12. Greater ring: mana crystals 5, charged
crystals 2, mana 20. A rune costs mana crystals 2 and mana 15 plus regional
materials. Regional wearable binding costs mana crystals 4, charged crystals 2,
mana 20 plus regional materials. Northern materials: elemental core 1, stone 20;
eastern: runed leather 2, leather 6; southern: natural essence 2, glimmerleaf 6.
Western recipes use existing Archive crystal supplies: 6 mana crystals and 2
charged crystals (these replace overlapping crystal entries in the base cost).
No West Node or new resource was introduced.

Salvage returns floor(base mundane cost / 2), with wood, stone, iron, nails,
fiber, leather and pelts eligible. Ring salvage returns 1 iron. Magical costs,
mana, Energy and Focus are never refunded. Equipped gear cannot be salvaged;
the UI requires confirmation and room gates apply.

Effects match the requested standard/greater values in `ENCHANTMENTS` and
`RING_RUNES`. Flat duplicates add; multiplier effects multiply; greater replaces
standard. Coreguard plus Greater Resisting receives 0.8 × 0.8 = 0.64 basic damage
and 0.8 special damage. Hunter speed is duration / (1 + 0.1 × rune count).
Earth adds 0.1 per rune once to Lance damage and shell progress. Verdant awards
Ward once per Bolt cast with positive health damage. Sense charges and XP follow
actual cap-limited additions. Potion payload and independent Ward triggers are
separate. Mana Conduit uses 10 × (1 + Rank II bonus / 100), reaching 30; the
general attunement multiplier remains unchanged at its actual maximum of 4.

## Ownership and saves

Stable instance IDs and equipped references replace automatic highest-wearable
selection. Each base gear permits one copy per family, including one blank;
standard/greater share the key. Rings permit two per core/rune configuration
across grades, and one instance cannot occupy both slots. Operations reserve
the active transaction and revalidate at completion before payment. Cancellation
and load clear unpaid pending operations. Replayed completions cannot pay twice.
Equipment changes are blocked during combat/actions and capacity reductions
that overflow inventory are rejected. Maximum increases preserve current values.

Version 35 backs up legacy saves at the existing save key plus `BackupPre35`
before conversion; backup failure stops loading. Completed rooms become upgraded;
partial deposits/work split between stages with carried upgrade credit. Purchased
wearables and owned basic/greater rings become records; no extra ring is granted.
Swiftstep/Reservoir map directly. Unsupported Restoring/Stoneward/Verdant/old
Trailweave keep their original effects as explicitly labeled legacy variants.
Backpack Imbue becomes an equipped Expansive pack. Existing research and
infrastructure persist. Paid legacy wearable activities are refunded and canceled
once. Repeat conversion is a no-op. Regional rest/expedition/room trigger flags
persist through saves. Existing combat-save behavior still ends transient combat.

## Verification and balance

Run all suites from PowerShell:

```powershell
Get-ChildItem tests/*smoke.js | ForEach-Object { node $_.FullName; if ($LASTEXITCODE) { throw $_.Name } }
```

New suites cover room progression/migration (108 checks), every equipment effect
(77), transactional/travel integration (15), and actual Warden loadouts (21).
Existing regression suites cover infrastructure, combat, steelworking, progression,
Home, Tower and UI architecture. The final run includes all 19 smoke suites.

Warden measurements use capped Mana Cycling II, Ward I, Attunement II and Arcane
Force II, Steel Staff, Mana Conduit, Hardened Ward, Greater Resisting legs and
Greater Potency belt. Rings are greater. Balanced uses Reservoir chest and one
ring of each core; mana specialist uses Reservoir and two Mana/Earth rings;
defensive uses Coreguard and two Warding/Hunter rings. Values are calculated by
the game rather than assigned as artificial resource pools.

| Loadout | Mana / Ward | Lance during exposure | Mana spent | Tonics | Seconds |
|---|---|---|---|---|---|
| Balanced | 195 / 115 | Victory | 153.60 | 0 | 28.585 |
| Mana specialist | 220 / 90 | Victory | 133.12 | 0 | 24.892 |
| Defensive specialist | 130 / 140 | Victory | 153.60 | 2 | 28.092 |

These simulations break armor with Lance, clear sigils with Missile and use
Lance during exposure, finishing with Bolt when appropriate. They do not prove
all player strategies are viable. Using Bolt throughout exposure instead leaves
the balanced build at 1 enemy HP after three tonics, while the mana specialist
wins with one tonic; the defensive build runs out at 259 enemy HP. This is a
mana-efficiency concern, not a reason to alter enemy stats in this change.

Browser QA uses `node tests/serve-preview.cjs` and
`http://127.0.0.1:8765/tests/overhaul-preview.html`, an isolated save key with
saving suppressed. Tower and equipment were inspected at 1440×1000 and 390×844;
both rings, item comparison, equipping, upgrade previews and locked reasons were
checked. Mobile document width stayed within the viewport. Screenshots were
displayed inline during QA. The preview initialization race was fixed; subsequent
interaction produced no new browser errors. Ring/belt overlap and duplicate
waterskin rendering found during QA were fixed. No production save was used.
