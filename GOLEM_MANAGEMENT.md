# Tower Heart golem management

Implemented September 12, 2026. This change extends the existing Bound Earth Elemental workforce; ownership, assignment counts, control upgrades, recall, and regional equipment rules remain shared.

## Retired machines

The original Automation Principles research, Lumber Mill and Foraging Lure construction definitions, machine recipes, charge controls, production functions, camp panel, and unlock notifications are commented out with retirement labels. Minimal serialization records retain completed/unlocked/purchased states and machine charge/progress. No retired machine produces resources online or offline. Ordinary gathering and manual traps remain available.

Sturdy Construction and Ancient Mana Condenser no longer require the retired Automation Principles research. Its saved research/history remains stored but is excluded from visible research and journal lists.

## Progression and the Western condenser

Inspection found two separate systems: manual **Create Mana Crystal** was an Imbue recipe unlocked in the Roadside Ruin, while the later **Mana Condenser** construction unlocked a passive machine. They were not construction prerequisites for one another. This update preserves that distinction.

1. The Creepy Cave's old map unlocks the Western road along with the other regions, before crystal production or node construction.
2. Searches in the Roadside Ruin's Cracked Hall and Side Chamber provide the first crystals without a golem or node. Those rewards and requirements are unchanged.
3. The Crystal Binding Alcove unlocks `manaCrystalImbuingUnlocked`. Manual creation retains that flag, the existing Imbue Level 5 / 20-mana capacity requirement, spell timing, **20 mana + 5 focus → 1 mana crystal**, and delivery to the resource stockpile. Its controls now appear at the **Western Roadside Ruin**, instead of camp. No condenser construction, node activation, or golem requirement has been added.
4. Later, the Arcane Archive's condenser plans still unlock the Ancient Mana Condenser research at the same archive milestone. Its discovery requirement (charged crystal), cost (60 energy, 5 focus, 30 wood, 1 charged crystal), and duration (12 seconds) remain intact; only the obsolete automation research dependency is removed.
5. Both construction steps now appear at the Roadside Ruin. The frame still costs 90 energy, 40 stone, 5 iron, 20 nails, and 4 mana crystals, taking 10 seconds. Assembly still costs 90 energy, 20 stone, 5 iron, 20 nails, and 4 charged crystals, taking 12 seconds. Construction IDs and saved purchases remain unchanged. Assembly does not reactivate the retired passive machine.

Crystal-consuming progression therefore remains reachable: early ruin crystals fund Meditation and Mana Cycling (1 crystal each), and Charge Mana Crystal still converts 1 crystal plus 5 mana at camp. Tower Heart restoration still uses 8 mana crystals and 8 charged crystals. Neither these steps nor manual crystal creation depend on the new Western node. The existing Northern disturbance/core and Elemental Binding research still lead to golem creation, which consumes one Earth Elemental Core.

## Western node

The node stands at the **Arcane Archive**, separate from the earlier condenser location. Discover it by restoring the Heart, exploring the archive exterior, and opening its existing four-spell door. No archive-door requirements are bypassed.

- Research: 60 energy, 8 focus, 8 seconds.
- Construction: deposit 30 stone, 8 iron, and 4 charged crystals at the archive.
- Activation: 60 imbuement, supplied by six existing 3-second actions costing 10 mana each.
- Activated node: shared node travel, the usual 10-mana jump cost, and regional capacity of 2 subject to total Heart capacity.

The Heart and regional node panels show activation and capacity. Western job definitions are intentionally empty: there is no crystal assignment or placeholder assignment control.

## Local jobs and rates

| Assignment | Base output / timing | Discovery |
| --- | --- | --- |
| Gather Food | 5 food per 60 seconds per golem | Food discovered and berry bush found |
| Gather Wood | 5 wood per 60 seconds per golem | Wood discovered and deadfall found |
| Gather Fiber | 5 fiber per 60 seconds per golem | Fiber discovered and fibrous plants explored |
| Check Traps | One installed trap checked per second; maximum one golem | Simple Traps completed, trails explored, at least one discovered installed trap |

Gathering batches are five existing manual gathering yields, so applicable gathering/tool yield bonuses are applied once through `getGatherResourceYield`. Base yields are one. Tool action-speed charges are not consumed or counted again. All deliveries use the shared resource storage limit. Full storage pauses work and is shown in the status text. Local jobs have no travel node and no additional local cap; they compete with Tower construction and all regional jobs for owned golems and Heart control capacity.

The inspected trap system has **no elapsed catch timer, bait, or rearming material cost**. Each installed trap allows one check per expedition, with a 75% chance of one pelt. A new expedition resets `checkedThisVisit`; golems never reset it themselves. Manual and worker checks share a synchronous claim function that marks the actual trap checked before rolling its catch. Golems deliver to storage without energy cost. Full storage leaves the catch unclaimed; exhausted traps display “Waiting: next expedition resets traps.” Extra offline time and extra workers cannot multiply one catch.

## Saves and offline work

Save version is 36. Existing condenser construction and retired machine data are retained. Saves with previously accessible condenser/manual production keep Western Roadside Ruin access without opening the archive or activating a node.

Paid manual crystal or condenser construction work survives loading as a saved pending activity, including elapsed work. It resumes at the Roadside Ruin without charging again. Other pre-existing activity save behavior is unchanged.

Assignments and partial delivery timers survive travel/reload. Local discovery checks use permanent milestones, since the player's manual action buttons are temporarily locked during travel. Timers keep stable object identity during shared state reads. Recalling/reassigning never removes earned resources; an emptied job resets its unfinished cycle under the existing assignment rules.

Loading advances the shared workforce engine by elapsed save time, respects storage, and commits the resulting resources/timestamp. Repeated reloads do not replay the same offline deliveries. Traps retain their saved visit checks; offline work never manufactures a new expedition or trap catch.

## Verification

- All 20 `tests/*-smoke.js` suites pass, including 52 focused golem-management checks.
- The focused suite covers retired data and controls, manual production, first crystals, Western progression/travel, shared capacity, discovery, travel persistence, fractional timers, reloads, storage, trap races, and save migration.
- `tests/golem-management-browser.cjs` passes in headless Edge at desktop and 390-pixel mobile widths. It checks real assignment buttons, hidden discoveries, Western construction/manual controls, full save loading, offline delivery idempotence, and completion of paid legacy manual production without a second charge. No browser runtime errors occurred.
- Desktop/mobile screenshots were inspected; the Heart panel fits the mobile width and the compact controls display visible minus/plus signs.

To repeat browser verification, run `node tests/serve-preview.cjs`, then run `node tests/golem-management-browser.cjs` with Playwright available through Node's module path. The test uses a disposable browser context and the preview's separate save key.
