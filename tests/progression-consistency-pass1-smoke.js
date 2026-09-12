const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const files = [
  "state.js", "expeditionData.js", "content.js", "definitions.js", "resources.js",
  "skills.js", "camp.js", "equipment.js", "expedition.js", "actions.js", "combat.js", "save.js",
];

const browserStubs = `
const emptyClassList = { add() {}, remove() {}, toggle() {} };
function element() { return { style: {}, classList: emptyClassList, addEventListener() {}, querySelector() { return null; } }; }
const ui = { restBtn: element() };
const resourceElements = {};
let testGameTime = 1000;
function getGameTime() { return testGameTime; }
function safeSetText() {}
function updateResource() {}
function updateAllResources() {}
function updateTrainingUI() {}
function updateEquipmentSlotUI() {}
function updateAllActionButtons() {}
function updateActionButton() {}
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
function updateResearchHistoryUI() {}
function updateCraftingUIForCurrentContext() {}
function updateTowerNodePanel() {}
function updateDestinationActions() {}
function updateLocationActions() {}
function updatePlacePanel() {}
function updateResourceCraftUI() {}
function updateCraftingSectionVisibility() {}
function updateCampUpgradeUI() {}
function updateCampUpgradeDisplay() {}
function addStoryEntry() {}
function addJournalEntry() {}
function announceUiStatus() {}
function showElement() {}
function hideElement() {}
function trySaveGame() {}
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
  updateLocationActions = function () {};
  updatePlacePanel = function () {};
  updateDestinationActions = function () {};
  refreshBoundEarthElementalUI = function () {};

  gameState.hasCamp = true;
  getResource("stone").value = 0;
  getResource("stone").display = { style: { display: "none" } };
  getCampUpgrade("workbench").unlocked = false;
  getCampUpgrade("workbench").purchased = false;
  syncHomeStructureUnlocks();
  assert(!getCampUpgrade("workbench").unlocked, "Establishing camp does not reveal the Rough Workbench");

  applyUnlocks(expeditionReturnUnlocks.stone);
  assert(getCampUpgrade("workbench").unlocked && getCampUpgrade("stoneFirePit").unlocked, "Returning stone reveals both stone camp upgrades through one return event");

  getCampUpgrade("workbench").purchased = false;
  getResourceCraft("trap").unlocked = true;
  assert(isCraftAvailable("resourceCraft", "trap"), "Primitive Trap crafting remains available without a workbench");
  getResearch("stoneTools").unlocked = true;
  getCampUpgrade("researchSpot").purchased = true;
  assert(!isCraftAvailable("research", "stoneTools"), "Stone Tools research is gated by the Rough Workbench");
  getGearUpgrade("stoneKnife").unlocked = true;
  assert(!isCraftAvailable("gearUpgrade", "stoneKnife"), "A known Stone Knife recipe cannot bypass the workbench gate");
  assert(getCraftCampUpgradeRequirementReason(getGearUpgrade("stoneKnife")) === "Requires Rough Workbench", "Locked crafting explains the Rough Workbench requirement");
  getCampUpgrade("workbench").purchased = true;
  assert(isCraftAvailable("research", "stoneTools") && isCraftAvailable("gearUpgrade", "stoneKnife"), "Workbench-dependent crafting becomes available immediately after construction");

  ["east", "south"].forEach(function (regionId) {
    const locationName = regionId === "east" ? "huntersCabin" : "alchemistsHut";
    const researchName = regionId === "east" ? "easternTowerNode" : "southernTowerNode";
    getExpeditionLocation(locationName).explored = true;
    getRegionalProgressState(regionId).disturbanceResolved = false;
    const node = getTowerNodeState(regionId);
    Object.assign(node, getDefaultTowerNodeState(regionId));
    const research = getResearch(researchName);
    research.unlocked = false;
    research.completed = false;

    discoverResource(regionId === "east" ? "runedLeather" : "naturalEssence");
    resolveRegionalDisturbanceVictory(regionId);
    assert(node.activated && research.unlocked, regionId + " victory reveals its Tower Node research");
    assert(!node.researchUnlocked, regionId + " victory does not directly reveal node construction");
    completeResearch(researchName, true);
    assert(research.completed && node.researchUnlocked, regionId + " research completion reveals node construction");
  });

  const automation = getResearch("automationPrinciples");
  automation.unlocked = false;
  automation.completed = false;
  getExpeditionLocation("silentGearworks").explored = true;
  checkResearchDiscoveries();
  assert(!automation.unlocked, "Exploring the Silent Gearworks does not reveal Automation Principles");
  applyUnlocks(getDungeon("silentGearworksDepths").nodes.controlDais.search.reward.unlocks);
  assert(!automation.unlocked, "The Control Dais no longer reveals retired Automation Principles");

  const migrated = migrateSaveData({
    version: 32,
    gameState: {
      regionalProgress: { east: { disturbanceResolved: true }, south: { disturbanceResolved: true } },
      towerNodes: {
        east: { activated: true, researchUnlocked: true, built: false, deposits: {}, imbueProgress: 0 },
        south: { activated: true, researchUnlocked: true, built: true, deposits: {}, imbueProgress: 60 },
      },
    },
    resources: { stone: { value: 0, visible: false } },
    actions: {}, campUpgrades: { workbench: { unlocked: true, purchased: false } }, gearUpgrades: {}, spells: {},
    resourceCrafts: {}, expeditionLocations: {}, dungeons: {}, research: {}, automation: {},
  });
  assert(migrated.version === SAVE_VERSION && !migrated.campUpgrades.workbench.unlocked, "Early legacy saves lose the premature unbuilt workbench reveal");
  assert(migrated.research.easternTowerNode.completed && migrated.gameState.towerNodes.east.researchUnlocked, "Legacy Eastern construction access is preserved as completed research");
  assert(migrated.research.southernTowerNode.completed && migrated.gameState.towerNodes.south.built, "A built legacy Southern Node remains built with completed research");

  console.log(JSON.stringify({ passed: results.length, results }, null, 2));
})();
`;

const source = browserStubs + "\n" + files.map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n") + "\n" + tests;
vm.runInNewContext(source, { console, structuredClone, setTimeout, clearTimeout, Date, Math }, { filename: "progression-consistency-pass1-smoke.vm.js" });
