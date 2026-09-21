# Tower Heart golem management

Implemented September 12, 2026. This change extends the existing Bound Earth Elemental workforce; ownership, assignment counts, control upgrades, recall, and regional equipment rules remain shared.

## Retired machines

The original Automation Principles research, Lumber Mill and Foraging Lure construction definitions, machine recipes, charge controls, production functions, camp panel, and unlock notifications are commented out with retirement labels. Minimal serialization records retain completed/unlocked/purchased states and machine charge/progress. No retired machine produces resources online or offline. Ordinary gathering and manual traps remain available.

Sturdy Construction and Ancient Mana Condenser no longer require the retired Automation Principles research. Its saved research/history remains stored but is excluded from visible research and journal lists.

## Progression and the Western condenser

The finalized three-stage condenser progression, exact costs, Western Node operator rates, and version 39 save behavior are documented in [MANA_CONDENSER.md](MANA_CONDENSER.md). This supersedes the initial relocation-only condenser implementation.

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

Save version is 39. Existing condenser construction and retired machine data are retained. Saves with previously accessible condenser/manual production keep Western Roadside Ruin access without opening the archive or activating a node.

Paid manual crystal or condenser construction work survives loading as a saved pending activity, including elapsed work. It resumes at the Roadside Ruin without charging again. Other pre-existing activity save behavior is unchanged.

Assignments and partial delivery timers survive travel/reload. Local discovery checks use permanent milestones, since the player's manual action buttons are temporarily locked during travel. Timers keep stable object identity during shared state reads. Recalling/reassigning never removes earned resources; an emptied job resets its unfinished cycle under the existing assignment rules.

Loading advances the shared workforce engine by elapsed save time, respects storage, and commits the resulting resources/timestamp. Repeated reloads do not replay the same offline deliveries. Traps retain their saved visit checks; offline work never manufactures a new expedition or trap catch.

## Verification

- All 20 `tests/*-smoke.js` suites pass, including 52 focused golem-management checks.
- The focused suite covers retired data and controls, manual production, first crystals, Western progression/travel, shared capacity, discovery, travel persistence, fractional timers, reloads, storage, trap races, and save migration.
- `tests/golem-management-browser.cjs` passes in headless Edge at desktop and 390-pixel mobile widths. It checks real assignment buttons, hidden discoveries, Western construction/manual controls, full save loading, offline delivery idempotence, and completion of paid legacy manual production without a second charge. No browser runtime errors occurred.
- Desktop/mobile screenshots were inspected; the Heart panel fits the mobile width and the compact controls display visible minus/plus signs.

To repeat browser verification, run `node tests/serve-preview.cjs`, then run `node tests/golem-management-browser.cjs` with Playwright available through Node's module path. The test uses a disposable browser context and the preview's separate save key.
