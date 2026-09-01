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
  force.rank = 2;
  force.rankTwoLevel = 3;
  syncSteelworkingUnlocks();
  assert(getResourceCraft("steel").unlocked, "Steelworking exposes Steel refining");
  assert(["steelKnife", "steelAxe", "steelPick", "steelStaff"].every(function (id) { return getGearUpgrade(id).unlocked; }), "Steelworking exposes all four Steel upgrades");
  assert(STEELWORKING_CONFIG.steel.cost.iron > 0 && getResourceCraft("steel").cost === STEELWORKING_CONFIG.steel.cost, "The centralized Steel recipe uses Iron as its primary input");

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
  const saved = createSaveData();
  assert(saved.resources.steel.value === 7 && saved.gearUpgrades.steelStaff.purchased && saved.gameState.combatVictories === 1, "Save data preserves Steel, staff tier, equipment, and victory progress");

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
