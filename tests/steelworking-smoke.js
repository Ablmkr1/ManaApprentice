const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const files = [
  "state.js", "expeditionData.js", "content.js", "definitions.js", "resources.js",
  "skills.js", "camp.js", "expedition.js", "actions.js", "combat.js", "save.js",
];

const browserStubs = `
const emptyClassList = { add() {}, remove() {}, toggle() {} };
function element() { return { style: {}, classList: emptyClassList, addEventListener() {}, querySelector() { return null; } }; }
const ui = {
  combatPanel: element(), combatEnemyName: element(), combatEnemyHealthText: element(), combatEnemyHealthFill: element(),
  combatWardText: element(), combatAttackTimer: element(), combatStatus: element(), combatRecallBtn: element(), closeCombatBtn: element(),
  manaBoltBtn: element(), manaBoltProgressFill: element(), manaMissileBtn: element(), manaMissileProgressFill: element(),
  manaLanceBtn: element(), manaLanceProgressFill: element(),
};
const resourceElements = {};
let testGameTime = 1000;
function getGameTime() { return testGameTime; }
function updateResource() {}
function safeSetText(target, value) { if (target) target.textContent = value; }
function updateAllResources() {}
function updateTrainingUI() {}
function updateEquipmentSlotUI() {}
function updateAllActionButtons() {}
function updateCraftingButtons() {}
function updateLocationStorageUI() {}
function updateCampResourcesSectionVisibility() {}
function unlockResource() {}
function updateExpeditionUI() {}
function updateCurrentGoalUI() {}
function updateWorkTabsVisibility() {}
function updateExpeditionLoadoutVisibility() {}
function syncMainViewAvailability() {}
function refreshExpeditionUI() {}
function refreshBoundEarthElementalUI() {}
function addStoryEntry() {}
function addJournalEntry() {}
function announceUiStatus() {}
function showElement() {}
function hideElement() {}
const localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
const document = { getElementById() { return null; }, querySelector() { return null; }, createElement() { return element(); } };
`;

const tests = `
(function () {
  const results = [];
  function assert(condition, message) {
    if (!condition) throw new Error(message);
    results.push(message);
  }
  function near(actual, expected) { return Math.abs(actual - expected) < 0.000001; }
  updateCraftingUIForCurrentContext = function () {};

  assert(JSON.stringify(getTowerFloorDefinition("floor1").rooms) === JSON.stringify(["bedroom", "forge", "workshop"]), "The Forge occupies the Tower First Floor");
  assert(JSON.stringify(getTowerFloorDefinition("floor2").rooms) === JSON.stringify(["alchemyRoom", "library", "enchantingStudy"]), "The Library occupies the Tower Second Floor");
  assert(getTowerRoomDefinition("forge").floor === "floor1" && getTowerRoomDefinition("library").floor === "floor2", "Forge and Library room metadata matches the swapped floor layout");

  assert(!getGearUpgrade("ironStaff").unlocked && !getGearUpgrade("ironStaff").purchased, "A new player starts without a staff");

  gameState.combat.active = true;
  gameState.combat.resolved = false;
  gameState.combat.enemyId = "minorEarthElemental";
  gameState.combat.enemyHealth = 0;
  gameState.combat.enemyMaxHealth = 20;
  gameState.combat.reward = null;
  gameState.combat.rewardGranted = false;
  resolveCombatVictory();
  assert(gameState.combatVictories === 1 && getGearUpgrade("ironStaff").unlocked, "The first combat victory unlocks Iron Staff crafting");

  completeGearUpgrade("ironStaff");
  assert(getGearUpgrade("ironStaff").purchased, "Iron Staff is a permanent equipment upgrade");
  assert(getEquipmentEffectText(getGearUpgrade("ironStaff")) === "Combat Cast Speed +15% · Combat Mana Cost -10%", "Iron Staff details show its exact combat-only effects");

  getArcaneForceProgressState().level = 5;
  ensureArcaneForceRankTwoState().rank = 1;
  assert(near(getArcaneCombatManaCost("manaBolt"), 9), "Iron Staff reduces combat spell mana cost by exactly 10%");
  assert(near(getArcaneCombatCastTime("manaBolt"), 0.869565), "Iron Staff increases combat casting speed by exactly 15%");
  assert(getSpellCastDuration("arcaneForce", { type: "productionSpell", spellName: "arcaneForce", targetId: "nails", mode: "camp" }) === 2, "Staff speed does not affect utility spell casting");
  assert(getProductionSpellTargetContext("arcaneForce", "nails", { mode: "camp" }).cost.mana === 4, "Staff mana efficiency does not affect utility spell mana costs");

  const force = ensureArcaneForceRankTwoState();
  const forgeState = getProjectState("towerRoomForge");
  getResource("ore").value = 0;
  getResource("iron").value = 0;
  checkResearchDiscoveries();
  assert(!getResearch("steelworking").unlocked, "Steelworking stays hidden before the Forge is complete");
  forgeState.completed = true;
  forgeState.unlocked = true;
  checkResearchDiscoveries();
  assert(getResearch("steelworking").unlocked, "Completing the Forge reveals Steelworking research");

  force.rank = 1;
  assert(getVisibleResearchEntries().find(function (entry) { return entry.id === "steelworking"; }).status === "blocked", "Steelworking is visibly locked with its Rank II requirement after Forge completion");
  completeResearch("steelworking", true);
  assert(!getResearch("steelworking").completed && !isCraftAvailable("research", "steelworking"), "Steelworking cannot begin before Arcane Force Rank II");
  force.rank = 2;
  force.rankTwoLevel = 0;
  assert(isCraftAvailable("research", "steelworking"), "Arcane Force Rank II satisfies the Steelworking start requirement without a Rank II level gate");
  completeResearch("steelworking", true);
  assert(getResearch("steelworking").completed && isSteelworkingUnlocked(), "Completing Steelworking becomes the authoritative steel unlock");
  assert(getResourceCraft("steel").unlocked, "Steelworking unlocks the existing Steel craft definition");
  assert(["steelKnife", "steelAxe", "steelPick", "steelStaff"].every(function (id) { return getGearUpgrade(id).unlocked; }), "Steel equipment remains gated behind completed Steelworking research");
  assert(STEELWORKING_CONFIG.steel.cost.ore === 2 && STEELWORKING_CONFIG.steel.cost.mana === 10, "The centralized Steel recipe uses 2 Iron Ore and 10 Mana");
  assert(getResourceCraft("steel").button === null, "Steel production has no generic crafting-menu button");
  gameState.tower.selectedId = "heart";
  assert(getActiveCraftContext(getResourceCraft("steel")) === null, "Steel production is unavailable outside the selected Forge room");

  gameState.tower.selectedId = "room:forge";
  getResource("mana").maxValue = 200;
  getResource("mana").value = 200;
  getResource("ore").value = 40;
  getResource("steel").value = 0;
  assert(canStartTowerForgeSteelBatch(1), "Create Steel is available inside the completed Forge after research");
  assert(startTowerForgeSteelBatch(1), "A single Steel craft starts through the shared timed activity system");
  assert(gameState.activity.duration === 5 && getResource("ore").value === 38 && getResource("mana").value === 190, "One Steel craft takes 5 seconds and spends exactly 2 Ore and 10 Mana");
  const singleContext = gameState.activity.context;
  resetActivity();
  completeResourceCraft("steel", singleContext);
  assert(getResource("steel").value === 1, "One Steel craft produces exactly 1 Steel");

  const batchCost = getTowerForgeSteelBatchCost(5);
  assert(batchCost.ore === 10 && batchCost.mana === 50, "The +5 batch multiplies Ore and Mana costs exactly");
  const largeBatchCost = getTowerForgeSteelBatchCost(10);
  assert(largeBatchCost.ore === 20 && largeBatchCost.mana === 100, "The +10 batch multiplies Ore and Mana costs exactly");
  assert(startTowerForgeSteelBatch(5), "The +5 Steel batch can start with sufficient resources");
  assert(gameState.activity.duration === 25, "The +5 batch multiplies processing time");
  const batchContext = gameState.activity.context;
  resetActivity();
  completeResourceCraft("steel", batchContext);
  assert(getResource("steel").value === 6, "The +5 batch produces exactly 5 additional Steel");

  assert(startTowerForgeSteelBatch(10), "The +10 Steel batch can start with sufficient resources");
  assert(gameState.activity.duration === 50, "The +10 batch multiplies processing time");
  const largeBatchContext = gameState.activity.context;
  resetActivity();
  completeResourceCraft("steel", largeBatchContext);
  assert(getResource("steel").value === 16, "The +10 batch produces exactly 10 additional Steel");

  getResource("ore").value = 1;
  getResource("mana").value = 200;
  assert(!canStartTowerForgeSteelBatch(1), "Steel crafting rejects insufficient Ore");
  getResource("ore").value = 20;
  getResource("mana").value = 9;
  assert(!canStartTowerForgeSteelBatch(1), "Steel crafting rejects insufficient Mana");

  [["ironKnife", "steelKnife", "cuttingYieldFlat"], ["ironAxe", "steelAxe", "choppingYieldFlat"], ["crudeIronPick", "steelPick", "miningYieldBase"]].forEach(function (entry) {
    const iron = getGearUpgrade(entry[0]);
    const steel = getGearUpgrade(entry[1]);
    iron.purchased = true;
    completeGearUpgrade(entry[1]);
    assert(steel.purchased && !iron.purchased, steel.displayName + " consumes and replaces its Iron predecessor");
    assert(steel.effects[entry[2]] === iron.effects[entry[2]] + 1, steel.displayName + " improves its established resource yield by exactly +1");
  });

  completeGearUpgrade("steelStaff");
  assert(getGearUpgrade("steelStaff").purchased && !getGearUpgrade("ironStaff").purchased, "Steel Staff upgrades and replaces Iron Staff instead of stacking");
  assert(getActiveCombatStaff() === getGearUpgrade("steelStaff"), "Only the highest purchased staff is active");
  assert(getEquipmentEffectText(getGearUpgrade("steelStaff")) === "Combat Cast Speed +30% · Combat Mana Cost -20%", "Steel Staff details show its exact combat-only effects");

  force.rankTwoLevel = 7;
  assert(near(getArcaneCombatManaCost("manaBolt"), 6.4), "Steel Staff and Arcane Efficiency mana reductions stack once");
  assert(near(getArcaneCombatCastTime("manaBolt"), 0.615385), "Steel Staff and Arcane Efficiency casting speed stack once");
  COMBAT_CONFIG.spells.testMinimum = { manaCost: 1, castTimeSeconds: 1, damage: { min: 1, max: 1 }, hits: 1 };
  assert(getArcaneCombatManaCost("testMinimum") === 1, "Combat spells that normally cost mana preserve the minimum cost of 1");

  getResource("steel").value = 7;
  getResearch("steelworking").completed = false;
  getResourceCraft("steel").unlocked = true;
  assert(repairLegacySteelworkingResearch() && getResearch("steelworking").completed, "Legacy Steel access migrates to completed Steelworking research");
  const saved = createSaveData();
  assert(saved.resources.steel.value === 7 && saved.research.steelworking.completed && saved.gameState.projects.towerRoomForge.completed, "Save data preserves Steel, Steelworking research, and Forge completion");

  const legacy = normalizeSaveData({
    version: 31,
    gameState: { northernDisturbance: { resolved: true } },
    resources: {}, actions: {}, campUpgrades: {}, gearUpgrades: {}, spells: {}, resourceCrafts: {}, expeditionLocations: {}, dungeons: {}, research: {}, automation: {},
  });
  assert(legacy.gameState.combatVictories === 1, "Existing saves with a completed combat encounter migrate to one victory");
  getGearUpgrade("ironStaff").purchased = false;
  getGearUpgrade("ironStaff").unlocked = false;
  gameState.combatVictories = legacy.gameState.combatVictories;
  syncIronStaffUnlockFromCombatHistory();
  assert(getGearUpgrade("ironStaff").unlocked, "Migrated combat history repairs the Iron Staff unlock automatically");

  console.log(JSON.stringify({ passed: results.length, results }, null, 2));
})();
`;

const source = browserStubs + "\n" + files.map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n") + "\n" + tests;
vm.runInNewContext(source, { console, structuredClone, setTimeout, clearTimeout, Date, Math }, { filename: "steelworking-smoke.vm.js" });
