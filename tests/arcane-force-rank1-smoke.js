const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const combatSource = fs.readFileSync(path.join(root, "combat.js"), "utf8");

const harness = `
const elementalAutomationConfig = { earth: { coreDropQuantity: 1 } };
let forceLevel = 4;
let now = 1000;
let mana = { value: 20 };
let arcaneForceXp = 0;
let manaControlSpent = 0;
const RESOURCE_AFFORDABILITY_EPSILON = 0.000001;
const gameState = {
  combat: {
    active: true,
    resolved: false,
    enemyId: "minorEarthElemental",
    enemyHealth: 20,
    enemyMaxHealth: 20,
    nextAttackTime: 5000,
    nextAbilityTime: null,
    ability: null,
    cast: null,
    resultMessage: "",
  },
};
const ui = {
  combatPanel: { style: {} },
  combatEnemyName: {},
  combatEnemyHealthText: {},
  combatEnemyHealthFill: { style: {} },
  combatWardText: {},
  manaBoltProgressFill: { style: {} },
  manaBoltBtn: { style: {} },
  combatRecallBtn: { style: {} },
  closeCombatBtn: { style: {} },
  combatAttackTimer: { classList: { add() {}, remove() {} } },
  combatStatus: {},
};
function getArcaneForceLevel() { return forceLevel; }
function getGameTime() { return now; }
function getResource(name) { return name === "mana" ? mana : { value: 10, maxValue: 10 }; }
function roundResourceAmount(value) { return Math.round(value * 1000000) / 1000000; }
function spendCost(cost) {
  if (mana.value < cost.mana) return false;
  mana.value -= cost.mana;
  return true;
}
function recordSpellProgressExperience(spellName, amount) {
  if (spellName === "arcaneForce") arcaneForceXp += amount;
}
function recordManaControl(amount) { manaControlSpent += amount; }
function safeSetText(element, value) { element.textContent = value; }
function formatResourceAmountForDisplay(value) { return String(value); }
function renderCombatConsumables() {}
function applyWardDamage() {}
function beginReturnToCamp() {}
function addResource() {}
function unlockResource() {}
function addStoryEntry() {}
function updateCurrentGoalUI() {}
function updateLocationActions() {}
function updatePlacePanel() {}
const document = { querySelector() { return null; } };
`;

const tests = `
(function () {
  const results = [];
  function assert(condition, message) {
    if (!condition) throw new Error(message);
    results.push(message);
  }

  assert(!isManaBoltUnlocked(), "Mana Bolt is locked below Arcane Force Rank I Level 5");
  assert(!canStartManaBoltCast(), "The combat cast entry point rejects Mana Bolt below Level 5");
  assert(!startManaBoltCast(), "Mana Bolt cannot be started through its direct function below Level 5");
  renderCombatUI();
  assert(ui.manaBoltBtn.style.display === "none", "Combat hides Mana Bolt below Level 5");

  gameState.combat.cast = { startTime: 0, endTime: 1, manaSpent: 0 };
  completeManaBoltCast();
  assert(gameState.combat.enemyHealth === 20, "A forged or stale locked cast cannot deal damage");
  assert(gameState.combat.cast === null, "A forged or stale locked cast is cleared cleanly");

  forceLevel = 5;
  renderCombatUI();
  assert(isManaBoltUnlocked(), "Mana Bolt unlocks at Arcane Force Rank I Level 5");
  assert(ui.manaBoltBtn.style.display === "block", "Combat shows Mana Bolt at Level 5");
  assert(startManaBoltCast(), "Mana Bolt starts at Level 5 when its mana cost is available");

  now = 2000;
  spendManaBoltProgress(now);
  assert(mana.value === 10, "Mana Bolt preserves its 10 mana cost");
  assert(arcaneForceXp === 10, "Mana Bolt mana expenditure grants Arcane Force XP once");
  assert(manaControlSpent === 10, "Mana Bolt records the successful mana spend for Mana Control");

  console.log(JSON.stringify({ passed: results.length, results }, null, 2));
})();
`;

vm.runInNewContext(harness + "\n" + combatSource + "\n" + tests, { console, Math });
