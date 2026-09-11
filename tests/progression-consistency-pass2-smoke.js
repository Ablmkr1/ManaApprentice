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
  let passed = 0;
  function assert(ok, message) { if (!ok) throw Error(message); passed++; }
  refreshBoundEarthElementalUI = updateLocationActions = updatePlacePanel = updateDestinationActions = function () {};
  unlockAction = function(id) { getAction(id).unlocked = true; };
  updateResearchHistoryUI = updateCraftingSectionVisibility = updateCraftingUIForCurrentContext = function () {};
  recordDeepThought = function () {};
  const known = id => discoverResource(id);
  gameState.towerConstructionUnlocked = true;
  assert(!isResearchDiscoverable(getResearch('elementalBinding')), 'Enemy exposure is insufficient');
  getResource('earthElementalCore').value = 1;
  known('earthElementalCore');
  assert(!getResearch('elementalBinding').unlocked, 'Core alone needs Northern completion');
  resolveNorthernDisturbanceVictory();
  assert(getResearch('elementalBinding').unlocked, 'Northern victory plus core and Tower reveals Binding');
  assert(!createBoundEarthElemental() && getResource('earthElementalCore').value === 1, 'Creation blocked without spending core');
  completeResearch('elementalBinding', true);
  assert(isBoundEarthElementalTowerUnlocked(), 'Binding unlocks creation');
  assert(createBoundEarthElemental() && getBoundEarthElementalState().owned === 1, 'Creation succeeds');
  for (const [region,id,resource,flag] of [['east','elementalHarnessing','runedLeather','equipmentUnlocked'],['south','elementalAttunement','naturalEssence','attunementUnlocked']]) {
    getResearch('elementalBinding').completed = false;
    known(resource);
    resolveRegionalDisturbanceVictory(region);
    assert(!getResearch(id).unlocked && !getBoundEarthElementalState().capabilities[flag], 'Specialization requires Binding');
    getResearch('elementalBinding').completed = true;
    checkResearchDiscoveries();
    assert(getResearch(id).unlocked && getResearch(id).unlockedAt > 0, 'Specialization gets normal new-research timestamp');
    assert(!getBoundEarthElementalState().capabilities[flag], 'Discovery does not unlock capability');
    completeResearch(id, true);
    assert(getBoundEarthElementalState().capabilities[flag], 'Completion unlocks capability');
  }
  getExpeditionLocation('alchemistsHut').explored = true;
  const alchemy = getResearch('alchemy');
  alchemy.unlocked = true;
  checkResearchDiscoveries();
  assert(!alchemy.unlocked, 'Legacy incomplete Alchemy hides without herbs');
  alchemy.unlocked = true;
  gameState.activity = {kind:'craft', type:'research', id:'alchemy', progress:2};
  checkResearchDiscoveries();
  assert(alchemy.unlocked && gameState.activity.progress === 2, 'Paid legacy research progress is preserved');
  gameState.activity = null;
  checkResearchDiscoveries();
  known('herb');
  assert(alchemy.unlocked, 'Herbs reveal Alchemy without revisiting');
  completeResearch('alchemy', true);
  assert(alchemy.completed && getResourceCraft('staminaTonic').unlocked, 'Alchemy downstream reward works');
  for (const id of ['ore','chargedCrystal','manaCrystal']) {
    const research = {requires: {}, requiresDiscoveredResources: [id]};
    assert(!isResearchDiscoverable(research), 'Unknown resource hides research: '+id);
    known(id);
    assert(isResearchDiscoverable(research), 'Discovery reveals research: '+id);
    getResource(id).value = 0;
    assert(isResearchDiscoverable(research), 'Spending does not hide research: '+id);
  }
  assert(isResearchDiscoverable({requires:{}}), 'Unrelated research unaffected');
  getExpeditionLocation('minersCamp').explored = true;
  checkResearchDiscoveries();
  assert(getResearch('smelting').unlocked, 'Known ore reveals actual Smelting entry');
  gameState.magicUnlocked = true;
  known('mana');
  checkResearchDiscoveries();
  assert(getResearch('manaCycling').unlocked && !getSkillState('manaCycling').revealed && !getAction('practiceManaCycling').unlocked, 'Mana reveals research only');
  completeResearch('manaCycling', true);
  assert(getSkillState('manaCycling').revealed && getAction('practiceManaCycling').unlocked, 'Research unlocks skill and practice');
  const skill = getSkillState('manaCycling');
  const before = skill.manaXp;
  recordManaCyclingManaSpent(1);
  assert(skill.manaXp === before + 1, 'Mana spending still earns XP');
  recordManaCyclingManaSpent(4);
  assert(skill.level === 0 && skill.breakthroughReady, 'Rank I still pauses at the 5 XP breakthrough');
  getResource('mana').value = 3;
  assert(canPracticeManaCycling() && getManaCyclingCost().mana === 3, 'Breakthrough retains its available-mana cost');
  recordManaCycle();
  assert(skill.level === 1 && !skill.breakthroughReady && getSkillCapacity('manaCycling') === 5, 'Breakthrough preserves Rank I level and capacity');
  for (const [id,craft] of [['quarryHarness',craftElementalHarness],['herbalAttunement',craftElementalWorkerAttunement]]) {
    const recipe = (getElementalHarnessDefinition(id) || getElementalWorkerAttunementDefinition(id)).recipe;
    for (const [resource,amount] of Object.entries(recipe)) getResource(resource).value = amount;
    assert(craft(id), 'Existing elemental crafting succeeds: '+id);
  }
  const saved = {version:33, gameState:{elementals:{earth:{owned:2,capabilities:{harnesses:{test:1},attunements:{test:1}}}},skills:{manaCycling:{revealed:true,level:3,manaXp:75}}},resources:{herb:{visible:true,value:0}},research:{alchemy:{completed:true}},actions:{}};
  migrateV33SaveDataToV34(saved);
  assert(['elementalBinding','elementalHarnessing','elementalAttunement','manaCycling','alchemy'].every(id=>saved.research[id].completed), 'Veteran systems normalized to completed research');
  assert(saved.gameState.elementals.earth.owned === 2 && saved.gameState.skills.manaCycling.manaXp === 75, 'Veteran ownership and XP untouched');
  assert(saved.resources.herb.discovered, 'Legacy visible empty resource remains known');
  const fresh = {gameState:{}, resources:{}, research:{}, actions:{}};
  migrateV33SaveDataToV34(fresh);
  assert(Object.keys(fresh.research).length === 0, 'Unprogressed legacy saves receive no mastery');
  const roundtrip = JSON.parse(JSON.stringify(createResourceSaveData()));
  getResource('herb').discovered = false;
  applyResourceSaveData(roundtrip);
  assert(isResourceDiscovered('herb'), 'Resource knowledge survives save/load');
  const researchSave = JSON.parse(JSON.stringify(createResearchSaveData()));
  getResearch('elementalBinding').completed = false;
  applyResearchSaveData(researchSave);
  assert(getResearch('elementalBinding').completed, 'New research completion survives save/load');
  console.log(JSON.stringify({passed}));
})();
`;

const source = browserStubs + "\n" + files.map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n") + "\n" + tests;
vm.runInNewContext(source, { console, structuredClone, setTimeout, clearTimeout, Date, Math }, { filename: "progression-consistency-pass2-smoke.vm.js" });
