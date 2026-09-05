const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const files = [
  "state.js",
  "expeditionData.js",
  "content.js",
  "definitions.js",
  "resources.js",
  "skills.js",
  "camp.js",
  "expedition.js",
  "actions.js",
  "combat.js",
  "save.js",
];

const browserStubs = `
const emptyClassList = { add() {}, remove() {}, toggle() {} };
function combatElement() { return { style: {}, classList: emptyClassList, addEventListener() {}, querySelector() { return null; } }; }
const ui = {
  combatPanel: combatElement(), combatEnemyName: combatElement(), combatEnemyHealthText: combatElement(),
  combatEnemyHealthFill: combatElement(), combatWardText: combatElement(), combatAttackTimer: combatElement(),
  combatStatus: combatElement(), combatRecallBtn: combatElement(), closeCombatBtn: combatElement(),
  manaBoltBtn: combatElement(), manaBoltProgressFill: combatElement(),
  manaMissileBtn: combatElement(), manaMissileProgressFill: combatElement(),
  manaLanceBtn: combatElement(), manaLanceProgressFill: combatElement(),
};
const resourceElements = {};
let testGameTime = 1000;
function getGameTime() { return testGameTime; }
function updateResource() {}
function safeSetText(element, value) { if (element) element.textContent = value; }
function updateAllResources() {}
function updateTrainingUI() {}
function updateEquipmentSlotUI() {}
function updateAllActionButtons() {}
function updateCraftingButtons() {}
function updateLocationStorageUI() {}
function updateCampResourcesSectionVisibility() {}
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
const document = { querySelector() { return null; }, createElement() { return combatElement(); } };
`;

const tests = `
(function () {
  const results = [];
  function assert(condition, message) {
    if (!condition) throw new Error(message);
    results.push(message);
  }
  function setRankTwoLevel(level, xp) {
    const state = ensureArcaneForceRankTwoState();
    state.rank = 2;
    state.rankTwoLevel = level;
    state.rankTwoXp = xp === undefined ? level * 50 : xp;
    return state;
  }
  function resetCombat(health) {
    gameState.combat.active = true;
    gameState.combat.resolved = false;
    gameState.combat.enemyId = "minorEarthElemental";
    gameState.combat.enemyHealth = health;
    gameState.combat.enemyMaxHealth = health;
    gameState.combat.nextAttackTime = getGameTime() + 100000;
    gameState.combat.nextAbilityTime = null;
    gameState.combat.ability = null;
    gameState.combat.cast = null;
    gameState.combat.reward = null;
    gameState.combat.rewardGranted = false;
  }

  getArcaneForceProgressState().xp = 150;
  getTowerNodeState = function () { return { built: true }; };
  isHeartRestoredForRankTwoSkills = function () { return true; };
  const breakthroughState = ensureArcaneForceRankTwoState();
  breakthroughState.rank = 1;
  breakthroughState.breakthroughs.forceAmplification = 0;
  recordArcaneForceExperience(49);
  assert(getArcaneForceRank() === 1 && getArcaneForceBreakthroughProgress() === 49, "Force Amplification tracks valid Arcane Force mana spending after its story prerequisites");
  recordArcaneForceExperience(1);
  assert(getArcaneForceRank() === 2 && getArcaneForceRankTwoLevel() === 0, "Force Amplification begins Arcane Force Rank II at Level 0");
  assert(getArcaneForcePowerPercent() === 100, "Rank II Level 0 has exactly 100% Force Power");
  setRankTwoLevel(0, 49);
  recordArcaneForceExperience(1);
  assert(getArcaneForceRankTwoLevel() === 1, "Rank II advances one level per 50 mana spent");
  for (let level = 0; level <= 10; level++) {
    setRankTwoLevel(level);
    assert(getArcaneForcePowerPercent() === 100 + level * 20, "Rank II Level " + level + " has the designed Force Power");
  }
  assert(getArcaneForcePowerPercent() === 300, "Rank II Level 10 has exactly 300% Force Power");

  const basicNails = getArcaneForceDefinition("nails");
  const bulkNails = getArcaneForceDefinition("nailsBulk");
  getSpell("arcaneForce").unlocked = true;
  gameState.expedition.currentLocation = null;
  getResource("mana").maxValue = 200;
  getResource("mana").value = 200;
  getResource("iron").value = 20;
  getResource("nails").value = 0;
  setRankTwoLevel(1);
  assert(isProductionSpellTargetAvailable("arcaneForce", "nails"), "The existing 10-nail action remains available below Rank II Level 2");
  assert(!isProductionSpellTargetAvailable("arcaneForce", "nailsBulk"), "Shape 50 Nails remains hidden below Rank II Level 2");
  setRankTwoLevel(2);
  assert(isProductionSpellTargetAvailable("arcaneForce", "nailsBulk"), "Shape 50 Nails unlocks at Rank II Level 2");
  assert(basicNails.cost.mana === 4 && basicNails.cost.iron === 1 && basicNails.produces.amount === 10, "The existing 10-nail recipe remains unchanged");
  assert(bulkNails.cost.mana === basicNails.cost.mana * 3, "Shape 50 Nails costs exactly three times the basic recipe's mana");
  assert(bulkNails.cost.iron === basicNails.cost.iron * 5, "Shape 50 Nails scales the basic recipe's iron cost to five batches");
  assert(bulkNails.produces.amount === 50, "Shape 50 Nails produces exactly 50 nails");

  getResource("mana").value = bulkNails.cost.mana - 1;
  assert(!canApplyProductionSpellTarget("arcaneForce", "nailsBulk"), "Shape 50 Nails cannot cast without sufficient mana");
  getResource("mana").value = 100;
  getResource("iron").value = bulkNails.cost.iron - 1;
  assert(!canApplyProductionSpellTarget("arcaneForce", "nailsBulk"), "Shape 50 Nails cannot cast without sufficient iron");

  getResource("iron").value = bulkNails.cost.iron;
  const bulkXpStart = ensureArcaneForceRankTwoState().rankTwoXp;
  castTargetedSpell("arcaneForce", { type: "productionSpell", spellName: "arcaneForce", targetId: "nailsBulk", mode: "camp" });
  assert(isActivityActive(), "Shape 50 Nails uses the shared timed spell activity");
  assert(getResource("mana").value === 100 - bulkNails.cost.mana && getResource("iron").value === 0, "Shape 50 Nails spends exactly 12 mana and 5 iron");
  const bulkContext = gameState.activity.context;
  resetActivity();
  completeSpellCast("arcaneForce", bulkContext);
  assert(getResource("nails").value === 50, "Completing Shape 50 Nails awards exactly 50 nails");
  assert(ensureArcaneForceRankTwoState().rankTwoXp - bulkXpStart === bulkNails.cost.mana, "Shape 50 Nails grants Arcane Force XP from the mana actually spent");

  getResource("nails").value = getResource("nails").maxValue - 49;
  getResource("iron").value = bulkNails.cost.iron;
  assert(!isProductionSpellTargetAvailable("arcaneForce", "nailsBulk"), "Shape 50 Nails respects nail inventory limits");
  setRankTwoLevel(7);
  const efficientBasicNailsCost = getProductionSpellTargetContext("arcaneForce", "nails").cost.mana;
  const efficientBulkNailsCost = getProductionSpellTargetContext("arcaneForce", "nailsBulk").cost.mana;
  assert(efficientBulkNailsCost === roundResourceAmount(efficientBasicNailsCost * 3), "Shape 50 Nails remains exactly three times the basic mana cost after Arcane Efficiency");

  setRankTwoLevel(2);
  assert(!isSteelworkingUnlocked(), "Arcane Force Rank II does not directly unlock Steelworking");
  setRankTwoLevel(3);
  assert(!isSteelworkingUnlocked(), "Rank II Level 3 no longer bypasses Forge construction and Steelworking research");

  gameState.expedition.currentLocation = "wildHerbPatch";
  setRankTwoLevel(0);
  assert(getProductionSpellTargetContext("arcaneForce", "herbPatch").carriedProduces.amount === 25, "Force Harvest preserves its baseline yield at 100% Force Power");
  setRankTwoLevel(10);
  assert(getProductionSpellTargetContext("arcaneForce", "herbPatch").carriedProduces.amount === 75, "Force Harvest scales to triple yield at 300% Force Power");
  gameState.expedition.currentLocation = "ironMine";
  assert(getProductionSpellTargetContext("arcaneForce", "oreNode").carriedProduces.amount === 30, "Detonate Ore scales to triple yield at 300% Force Power");

  const originalProjectDefinition = getProjectDefinition;
  const originalProjectLevel = getProjectCurrentLevel;
  getProjectDefinition = function () { return { arcaneForceWorkMultiplier: 3, arcaneForceWorkCost: { mana: 10 }, workDuration: 5 }; };
  getProjectCurrentLevel = function () { return { workYield: 10 }; };
  getTowerRoomEffectValue = function () { return 1; };
  setRankTwoLevel(5);
  assert(getProjectLevelWorkYield("towerFoundation", PROJECT_WORK_MODE_ARCANE_FORCE) === 60, "Arcane Force construction work receives full 200% Force Power scaling");
  setRankTwoLevel(7);
  assert(getProjectWorkCost("towerFoundation", PROJECT_WORK_MODE_ARCANE_FORCE).mana === 8, "Arcane Efficiency reduces Arcane Force project mana cost by 20%");
  assert(getProjectWorkDuration("towerFoundation", PROJECT_WORK_MODE_ARCANE_FORCE) === 4, "Arcane Efficiency applies +25% casting speed to project work");
  getProjectDefinition = originalProjectDefinition;
  getProjectCurrentLevel = originalProjectLevel;

  gameState.expedition.currentLocation = "wildHerbPatch";
  assert(getProductionSpellTargetContext("arcaneForce", "herbPatch").cost.mana === 4.8, "Arcane Efficiency reduces utility mana costs by 20%");
  assert(getSpellCastDuration("arcaneForce", { type: "productionSpell", spellName: "arcaneForce", targetId: "herbPatch", mode: "location" }) === 2.4, "Arcane Efficiency applies +25% casting speed to utility casts");

  getArcaneForceProgressState().xp = 150;
  const mana = getResource("mana");
  mana.maxValue = 200;
  mana.value = 200;
  rollCombatRange = function (range) { return range.min; };

  setRankTwoLevel(4);
  assert(!isManaMissileUnlocked(), "Mana Missile is locked below Rank II Level 5");
  setRankTwoLevel(5);
  resetCombat(200);
  const missileXpStart = ensureArcaneForceRankTwoState().rankTwoXp;
  assert(startManaMissileCast(), "Mana Missile becomes available at Rank II Level 5");
  spendArcaneCombatCastProgress(gameState.combat.cast.endTime);
  assert(ensureArcaneForceRankTwoState().rankTwoXp - missileXpStart === 12, "Mana Missile grants Arcane Force XP from its actual mana spend");
  assert(completeManaMissileCast() === 18, "Mana Missile performs three Force-Power-scaled low-damage hits");
  assert(gameState.combat.resultMessage.includes("strikes 3 times"), "Mana Missile reports its multi-hit resolution");

  setRankTwoLevel(7);
  assert(hasArcaneEfficiency(), "Arcane Efficiency activates at Rank II Level 7");
  assert(getArcaneCombatManaCost("manaMissile") === 9.6, "Arcane Efficiency reduces Mana Missile cost by exactly 20%");
  assert(getArcaneCombatCastTime("manaMissile") === 1, "Arcane Efficiency converts Mana Missile's 1.25s cast to 1s");
  resetCombat(200);
  mana.value = 200;
  const efficientXpStart = ensureArcaneForceRankTwoState().rankTwoXp;
  assert(isManaBoltUnlocked(), "Mana Bolt's Rank I unlock remains intact during Rank II");
  assert(isCombatActive() && !gameState.combat.cast && mana.value >= getArcaneCombatManaCost("manaBolt"), "Rank II combat state can begin another Arcane Force cast");
  assert(startManaBoltCast(), "Mana Bolt remains available after Rank II techniques unlock");
  spendArcaneCombatCastProgress(gameState.combat.cast.endTime);
  assert(ensureArcaneForceRankTwoState().rankTwoXp - efficientXpStart === 8, "Efficient Mana Bolt XP reflects the discounted 8 mana actually spent");
  assert(completeManaBoltCast() === 19, "Mana Bolt receives full Force Power damage scaling with integer rounding");

  setRankTwoLevel(9);
  assert(!isManaLanceUnlocked(), "Mana Lance is locked below Rank II Level 10");
  setRankTwoLevel(10);
  assert(isManaLanceUnlocked(), "Mana Lance unlocks at Rank II Level 10");
  assert(getArcaneCombatManaCost("manaLance") === 16 && getArcaneCombatCastTime("manaLance") === 1.4, "Mana Lance receives centralized Arcane Efficiency cost and speed modifiers");
  resetCombat(200);
  mana.value = 200;
  const lanceXpStart = ensureArcaneForceRankTwoState().rankTwoXp;
  assert(startManaLanceCast(), "Mana Lance starts through the shared combat casting path");
  spendArcaneCombatCastProgress(gameState.combat.cast.endTime);
  assert(ensureArcaneForceRankTwoState().rankTwoXp - lanceXpStart === 16, "Mana Lance grants Arcane Force XP from its actual discounted mana spend");
  assert(completeManaLanceCast() === 54, "Mana Lance delivers one high-damage hit with 300% Force Power");

  const migrated = { magic: { spellProgress: { arcaneForce: { level: 5, xp: 150 } } } };
  normalizeSavedArcaneForceRankTwoState(migrated);
  assert(migrated.magic.spellProgress.arcaneForce.level === 5 && migrated.magic.arcaneForce.rank === 1, "Save normalization preserves Rank I Arcane Force progression and safely defaults new Rank II state");
  migrated.magic.arcaneForce = { rank: 2, rankTwoLevel: 7, rankTwoXp: 350 };
  normalizeSavedArcaneForceRankTwoState(migrated);
  assert(migrated.magic.arcaneForce.rankTwoLevel === 7, "Save normalization preserves existing Rank II level state for derived unlocks");
  assert(!("bulkShapingUnlocked" in migrated.magic.arcaneForce), "Bulk Shaping availability requires no saved-game unlock flag");
  const loadedBulkSave = { magic: { spellProgress: { arcaneForce: { level: 5, xp: 150 } }, arcaneForce: { rank: 2, rankTwoLevel: 2, rankTwoXp: 100 } } };
  normalizeSavedArcaneForceRankTwoState(loadedBulkSave);
  gameState.magic.arcaneForce = loadedBulkSave.magic.arcaneForce;
  gameState.expedition.currentLocation = null;
  getResource("mana").value = 100;
  getResource("iron").value = bulkNails.cost.iron;
  getResource("nails").value = 0;
  assert(isProductionSpellTargetAvailable("arcaneForce", "nailsBulk"), "A loaded Rank II Level 2 save derives Bulk Shaping availability automatically");

  console.log(JSON.stringify({ passed: results.length, results }, null, 2));
})();
`;

const source = files.map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
vm.runInNewContext(browserStubs + "\n" + source + "\n" + tests, { console, structuredClone, setTimeout, clearTimeout });
