# Home progression rule

Player-made Home locations appear only after their construction finishes. Unlocking
a recipe, revealing a panel, or completing research does not place a structure.
Specialized facilities require relevant research before their build project unlocks
(for example, Meditation Spot). Simple facilities can unlock directly for building.

Meditation follows one replacement chain: Mana awakening unlocks the base Meditation Spot,
the Roadside Ruin crystal-pattern research unlocks Improved Meditation Spot, and the former
late attunement milestone unlocks Greater Meditation Spot. The latter retains the existing
Meditation Rank II skill gate.

Practice Circle and Storage Cache unlock as construction projects when camp is
established: discover the stream and berry bush, then finish the Small Fire and
Crude Lean-To. They cost wood and energy and require no research. Existing saves
also receive these projects; their locations stay hidden until built. Storage Cache
provides a Home entry to supplies and raises normal resource storage from 25 to 100.
Resources with explicit special caps keep those limits.

Natural features, trails, and the existing buried Tower are discovered rather than
built. The initial Work Spot is declared to bootstrap construction; its permanent
Workbench replacement must be built. Future player-made Home locations must follow
the same completed-construction gate.

## Tower home, pass 1

Functional rooms provide home capabilities before their advanced upgrades. Bedroom
uses existing meditation and recovery, Library shares research and training, and
Workshop covers all ordinary gear definitions plus material recipes and home
tanning. Forge and Alchemy share the original fuel pool and controls. Basement
displays the original stockpile and offers expedition preparation and packing.
Material/tool magic belongs to Workshop, processing imbuements to Forge/Alchemy,
and matrix imbuements to the Heart. Enchanting, rings, nodes and golems retain
their existing owners.

Shared controls move with return anchors; opening rooms never re-hooks their
listeners. Station capability is independent of camp structure ownership and is
unavailable away from home. Existing recipe, skill, research and upgrade gates
still apply. Tower batches retain their validated plan while navigating; normal
save loading retains its existing timed-job cancellation policy.

Focused coverage: `tests/tower-home-pass1-smoke.js` and
`tests/tower-home-pass1-browser.cjs` (using `tests/serve-preview.cjs`).

## Tower home, pass 2

Recovering the Warden Core and unlocking Long-Range Network reveals a parallel
move-in objective. It checks the restored Heart, basement, and functional first
stages of all six ordinary rooms. Moving in costs no materials and does not replace
the active story objective. New progression must move in before gate activation;
network research and gate construction keep their established order.

`gameState.towerHome.relocated` is the persisted authority for Home routing. Before
the move, Home resolves to the clearing. Afterwards, Home and every physical return
resolve to the Tower; the clearing remains reachable as Tower Grounds for outdoor
gathering and trail access.

The two former fuel-eliminating imbuements are retired. Their saved tier ownership
is retained and supplies the existing 50% reduction before relocation. After the
move, the restored Heart makes furnace and alchemy fuel cost zero through the
central cost adjustment, including regional stations and batch completion. Stored
fuel remains in saves but its meters and loading controls are hidden.

Focused coverage: `tests/tower-home-pass2-smoke.js` and
`tests/tower-home-pass2-browser.cjs`.

## Tower home, pass 3

After relocation, the single Home navigation entry opens Tower Home and the old
Tower entry retires. The illustrated room cutaway remains the main navigation and
is supplemented by keyboard-friendly room shortcuts, Tower Grounds, and expedition
controls. Research and breakthrough attention appears on the Library. Forge and
Alchemy show Heart-powered status instead of fuel controls, and the shared resource
summary is identified as Tower Storage.

Tower Grounds uses the existing clearing illustration and keeps only outdoor
resources, the stream, trail, traps, golem work, and the Tower entrance interactive.
Dimmed existing fire and shelter art marks the former camp without restoring its
stations. The move-in presentation is persisted so its story and completion notice
cannot repeat after reload.

Focused coverage: `tests/tower-home-pass3-smoke.js` and
`tests/tower-home-pass3-browser.cjs`. The three-pass transition is complete.
