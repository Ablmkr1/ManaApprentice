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
  "save.js",
];

const browserStubs = `
const ui = {};
const resourceElements = {};
function updateResource() {}
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
function trySaveGame() {}
const localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
`;

const tests = `
(function () {
  const results = [];
  function assert(condition, message) {
    if (!condition) throw new Error(message);
    results.push(message);
  }

  normalizeBoundEarthElementalAssignments = function () {};

  const imbuement = ensureImbueRankTwoState();
  promoteImbueToRankTwo();
  assert(imbuement.rank === 2 && imbuement.rankTwoLevel === 0 && imbuement.rankTwoXp === 0, "Permanent Binding begins Imbue Rank II at Level 0");
  imbuement.rankTwoXp = 49;
  recordImbueExperience(1);
  assert(imbuement.rankTwoLevel === 1, "Rank II advances from Level 0 using its own Mana-spent progression");
  imbuement.rank = 2;
  imbuement.rankTwoLevel = 10;
  imbuement.rankTwoXp = 500;

  getProjectState("towerFoundation").completed = true;
  ["north", "east", "south"].forEach(function (nodeName) {
    const node = getTowerNodeState(nodeName);
    node.activated = true;
    node.built = true;
  });

  ["campSmelter", "campAlchemyStation"].forEach(function (upgradeId) {
    getCampUpgrade(upgradeId).purchased = true;
  });
  ["repairedLeatherBackpack", "travelBoots", "leatherShirt", "leatherPants"].forEach(function (gearId) {
    getGearUpgrade(gearId).purchased = true;
  });

  assert(getTowerHeartElementalControlCapacity() === 5, "Tower Heart begins with 5 control capacity");
  assert(getPurchasedEquipmentSlots("gear").filter(function (slot) { return slot.current.slot === "ring"; }).length === 1, "Rank II exposes exactly one Ring slot");

  recalculateCharacterStats();
  const baseManaMaximum = getResource("mana").maxValue;
  const baseWardMaximum = getResource("ward").maxValue;
  const manaRingAction = getImbueDefinition("rankTwoRingOfMana").permanentAction;
  assert(canApplyImbueRankTwoTarget(manaRingAction), "Level 0 Ring of Mana is craftable once its component cost is available");
  completeImbueRankTwoTarget(manaRingAction);
  assert(ensureImbueRankTwoState().equippedRing === "ringOfMana", "Crafted Ring of Mana equips into the Ring slot");
  assert(getEquippedPermanentImbueEffectTotal("maxManaFlat") === 10, "Ring of Mana grants the configured maximum Mana bonus");
  assert(getResource("mana").maxValue === baseManaMaximum + 10, "Ring of Mana updates the actual maximum Mana resource");

  const wardRingAction = getImbueDefinition("rankTwoRingOfWarding").permanentAction;
  completeImbueRankTwoTarget(wardRingAction);
  assert(getPurchasedEquipmentSlots("gear").filter(function (slot) { return slot.current.slot === "ring"; }).length === 1, "Crafting a second ring does not add another Ring slot");
  assert(getEquippedPermanentImbueEffectTotal("maxWardFlat") === 10, "Ring of Warding grants the configured maximum Ward bonus");
  assert(getResource("ward").maxValue === baseWardMaximum + 10, "Ring of Warding updates the actual maximum Ward resource");
  equipImbueRing("ringOfMana");
  assert(getEquippedPermanentImbueEffectTotal("maxWardFlat") === 0, "Unequipped rings do not contribute stats");

  completeImbueRankTwoTarget(getImbueDefinition("rankTwoGreaterRingOfMana").permanentAction);
  assert(getEquippedPermanentImbueEffectTotal("maxManaFlat") === 25, "Greater Ring of Mana upgrades the owned mana-ring path to its configured bonus");
  completeImbueRankTwoTarget(getImbueDefinition("rankTwoGreaterRingOfWarding").permanentAction);
  assert(getEquippedPermanentImbueEffectTotal("maxWardFlat") === 25, "Greater Ring of Warding upgrades the owned ward-ring path to its configured bonus");
  assert(getPurchasedEquipmentSlots("gear").filter(function (slot) { return slot.current.slot === "ring"; }).length === 1, "Greater rings still share the single Ring slot");

  completeImbueRankTwoTarget(getImbueDefinition("rankTwoBackpack").permanentAction);
  assert(getImbuedBackpackCapacityBonus() === 15, "Backpack imbuement grants the configured permanent Pack bonus");
  assert(getEffectiveCarryCapacity() === gameState.expedition.carryCapacity + 15, "Effective Pack capacity includes the imbuement");

  const swiftstep = getImbueDefinition("rankTwoEnchant_swiftstep").permanentAction;
  completeImbueRankTwoTarget(swiftstep);
  assert(getEquippedPermanentImbueEffectTotal("travelDistanceFlat") === 0.5, "Equipment enchantment effects apply only through equipped gear");
  assert(!canApplyImbueRankTwoTarget(getImbueDefinition("rankTwoEnchant_trailweave").permanentAction), "An equipment item cannot hold a second permanent Imbue enchantment");

  completeImbueRankTwoTarget(getImbueDefinition("rankTwoEmberboundFurnace").permanentAction);
  completeImbueRankTwoTarget(getImbueDefinition("rankTwoImbuedAlchemy").permanentAction);
  assert(getImbueWorkshopFuelCost("furnace", 5) === 2.5, "Emberbound Furnace halves fuel use");
  assert(getImbueWorkshopFuelCost("alchemy", 3) === 1.5, "Imbued Alchemy halves fuel use");
  completeImbueRankTwoTarget(getImbueDefinition("rankTwoArcaneFurnace").permanentAction);
  completeImbueRankTwoTarget(getImbueDefinition("rankTwoArcaneAlchemy").permanentAction);
  assert(getImbueWorkshopFuelCost("furnace", 5) === 0 && getImbueWorkshopFuelCost("alchemy", 5) === 0, "Arcane workshop upgrades remove fuel use");

  assert(!canApplyImbueRankTwoTarget(getImbueDefinition("rankTwoMatrix_2").permanentAction), "Matrix II is blocked before Matrix I");
  [6, 7, 8, 9, 10, 12].forEach(function (capacity, index) {
    const stage = index + 1;
    completeImbueRankTwoTarget(getImbueDefinition("rankTwoMatrix_" + stage).permanentAction);
    assert(getTowerHeartElementalControlCapacity() === capacity, "Matrix stage " + stage + " sets Heart capacity to " + capacity);
  });
  assert(getElementalNodeConfig("north").elementalCapacity === 3, "Matrix upgrades leave Node-specific assignment caps unchanged");
  assert(getBoundEarthElementalState().owned === 0, "Matrix upgrades do not grant Bound Elementals");

  completeImbueRankTwoTarget(getImbueDefinition("rankTwoNode_east").permanentAction);
  assert(!Object.prototype.hasOwnProperty.call(getTowerNodeJumpCost("east"), "mana"), "An imbued Node has zero Mana travel cost");
  assert(getTowerNodeJumpCost("north").mana === 10, "Imbuing one Node does not alter other Node travel costs");

  assert(!Object.keys(getImbueRankTwoConfig().equipmentEnchantments).some(function (id) {
    return getImbueRankTwoConfig().equipmentEnchantments[id].region === "west";
  }), "Regional enchantments do not expose unfinished West content");

  const migrated = { magic: {}, tower: { controlCapacity: 17 }, elementals: {}, towerNodes: {} };
  normalizeSavedImbueRankTwoState(migrated);
  assert(migrated.magic.imbuement.rankTwoLevel === 0, "Existing saves default Imbue Rank II to Level 0");
  assert(migrated.magic.imbuement.controlCapacity === 17, "Migration preserves unusual existing control-capacity values");

  gameState.magic.toolCharges.axe = 7;
  equipImbueRing("ringOfWarding");
  assert(gameState.magic.toolCharges.axe === 7, "Rank II changes do not mutate Rank I tool charges");

  console.log(JSON.stringify({ passed: results.length, results }, null, 2));
})();
`;

const source = browserStubs + "\n" + files.map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n") + tests;
vm.runInNewContext(source, { console, structuredClone, setTimeout, clearTimeout, Date, Math, Map, Set });
