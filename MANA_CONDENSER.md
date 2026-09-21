# Mana Condenser progression

The Crystal Binding Alcove still unlocks manual condensation with the existing Imbue capacity requirement of 20. **Hand-Condense Mana Crystal** works at Roadside Ruin, Abandon Workshop and Arcane Archive, costing 20 Mana and 4 Focus for one crystal in normal storage.

The Arcane Archive supplies the plans. Ancient Mana Condenser research costs 40 Energy and 4 Focus. At Roadside Ruin, build the frame for 40 Stone, 20 Wood, 5 Iron, 20 Nails and 40 Energy; install the lattice for 2 Mana Crystals, 2 Charged Crystals and 40 Energy; then complete three separate 10-Mana activation spells. Installed machinery appears in the scene and on the regional map. Full activation reduces manual condensation at Roadside Ruin to 16 Mana and 4 Focus.

The active Western Node at Arcane Archive controls **Operate Mana Condenser**, physically located at Roadside Ruin. The shared Bound Earth Elemental engine delivers one crystal per 120 seconds for one operator, or one per 60 seconds for two. Western capacity remains two; workers also consume shared Heart capacity. No calibration, other Western jobs, or retired machine production is enabled. Full storage pauses production, without banking excess offline time. Partial work is measured in operator-seconds and survives changes to the nonzero operator count; removing the last operator resets unfinished work, matching existing reassignment rules.

The Abandon Workshop Depths reward remains the Faded Artificer’s Ring with +5 maximum Mana, independently of condenser progression.

## Save version 39

- Existing completed condensers receive all three activations. Migration assigns no workers and grants no node progression or extra resources.
- Existing frame/lattice purchases, plans, manual unlocks, node deposits and retired machine records keep their original IDs and save keys.
- `gameState.manaCondenserActivation` stores completed activation actions, from zero through three.
- Paid manual, construction and activation activities retain elapsed work through reload and Recall. The existing `pendingCondenserActivity` remains supported; `pendingCondenserActivities` preserves additional paused work when the player works at another Western location.
- A manual crystal whose storage fills during casting waits as paid pending work instead of losing its payment or overflowing storage.
- The existing load pipeline advances worker production and commits the updated timestamp, preventing repeated offline delivery on reload.

## Verification

`tests/mana-condenser-smoke.js` covers costs, unlock sequence, three separate payments, manual delivery, location discount, production rates, storage, Recall, queued paid work, migration and ring independence. `tests/golem-management-smoke.js` retains shared workforce coverage. `tests/golem-management-browser.cjs` exercises real controls, activation, offline reload idempotence and desktop/mobile machinery visibility. `tests/west-scene-browser.cjs` retains Western route, door and node checks; `WEST_SCREENSHOT_DIR` optionally directs screenshots to a disposable directory.

Implementation files: `content.js`, `camp.js`, `actions.js`, `state.js`, `save.js`, `expedition.js`, `expedition-scene.js`, `expedition-scene.css`. Tests: the three updated suites above plus the new condenser smoke suite. Existing unrelated working-tree edits were retained.
