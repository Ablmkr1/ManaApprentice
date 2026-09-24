const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const harness = fs.readFileSync(path.join(__dirname, "progression-consistency-pass1-smoke.js"), "utf8");
const stubs = harness.split("const browserStubs = `")[1].split("`;")[0];
const files = [
  "state.js", "expeditionData.js", "content.js", "definitions.js", "resources.js",
  "skills.js", "camp.js", "equipment.js", "expedition.js", "actions.js", "combat.js", "save.js",
];
const checks = `
let passed = 0;
function assert(ok, label) { if (!ok) throw Error(label); passed++; }
updateCraftingUIForCurrentContext = function () {};
refreshBoundEarthElementalUI = function () {};
updateBoundEarthElementalLiveUI = function () {};
updateLocationActions = function () {};
updatePlacePanel = function () {};
hookActionCompletions();

const normal = Object.values(getResourceDefinitions()).filter(resource => resource.usesDefaultStorageCap);
assert(normal.length > 10 && normal.every(resource => resource.maxValue === 25), "fresh normal storage is 25");
assert(getResource("trap").maxValue === 5 && getResource("glimmerleaf").maxValue === 50 &&
  getResource("staminaTonic").maxValue === 20 && getResource("fuel").maxValue === 2000,
  "explicit special caps remain");
addResource("food", 40);
assert(getResource("food").value === 25, "resource gains obey fresh cap");

applyResourceSaveData({ food: { value: 70, maxValue: 100, discovered: true } });
assert(getResource("food").maxValue === 25 && getResource("food").value === 70, "legacy stock is preserved above new cap");
addResource("food", 2);
assert(getResource("food").value === 70, "legacy over-cap stock cannot grow");
getCampUpgrade("storageCache").unlocked = true;
completeCampUpgrade("storageCache");
assert(normal.every(resource => resource.maxValue === 100) && getResource("food").value === 70,
  "Storage Cache raises normal caps without losing inventory");
assert(getResource("trap").maxValue === 5 && getResource("glimmerleaf").maxValue === 50,
  "Storage Cache leaves special caps unchanged");
addResource("food", 40);
assert(getResource("food").value === 100, "resource gain uses upgraded cap");

gameState.expedition.carriedItems = {};
getAction("mineIron").onComplete();
assert(gameState.expedition.carriedItems.ore === getMineResourceAmount("ore") &&
  !gameState.expedition.carriedItems.iron, "manual mine delivers ore only");
assert(getAction("mineIron").auto.carriedItem === "ore" &&
  getAutoActionCarryAmount("mineIron") === getMineResourceAmount("ore"),
  "repeat mining checks ore capacity and yield");
assert(getElementalNodeConfig("north").jobs.iron.resource === "ore", "northern golem job targets ore");
const north = getTowerNodeState("north");
Object.assign(north, { built: true, advancedRecallUnlocked: true });
const earth = getBoundEarthElementalState();
earth.owned = 1;
earth.assignments.nodes.north.iron = 1;
getResource("ore").value = 0;
getResource("iron").value = 0;
processBoundEarthElementalAutomation(120);
assert(getResource("ore").value === 2 && getResource("iron").value === 0,
  "golem return delivers ore and no finished iron");

const mana = getResource("mana");
const cycling = getSkillState("manaCycling");
cycling.revealed = true;
cycling.breakthroughReady = true;
getResource("energy").value = 10;
getResource("focus").value = 3;
mana.maxValue = 50;
mana.value = 37;
assert(!canPracticeManaCycling() && getManaCyclingCost().mana === 50,
  "partial mana cannot start and full cap is the cost");
mana.value = 50;
assert(canPracticeManaCycling() && spendCost(getManaCyclingCost()) && mana.value === 0,
  "full pool costs exactly one pool");
mana.maxValue = 60;
mana.value = 70;
getResource("energy").value = 10;
getResource("focus").value = 3;
assert(canPracticeManaCycling() && getManaCyclingCost().mana === 60 &&
  spendCost(getManaCyclingCost()) && mana.value === 10,
  "upgraded pool scales cost and preserves excess mana");

const original = getGearUpgrade("foragingBasket");
const improved = getGearUpgrade("foragersBasket");
improved.unlocked = true;
completeGearUpgrade("foragersBasket");
assert(!improved.purchased, "improved basket requires original");
original.purchased = true;
assert(getGatherResourceYield("food") === 2, "original basket adds one food");
assert(getResearch("foragersBasket").requires.researchCompleted.includes("leatherworking") &&
  getResearch("foragersBasket").requires.gearPurchased.includes("foragingBasket"),
  "improved basket is researched after leatherworking and the original");
completeGearUpgrade("foragersBasket");
assert(improved.purchased && !original.purchased && getGatherResourceYield("food") === 3 &&
  getHerbGatherBonus() === 1,
  "improved basket replaces the original with a two-food bonus and retains its herb bonus");
console.log("Progression/resource fixes: " + passed + " focused checks passed.");
`;

vm.runInNewContext(stubs + files.map(file => fs.readFileSync(path.join(root, file), "utf8")).join("\n") + checks,
  { console, structuredClone, setTimeout, clearTimeout, Date, Math, Map, Set },
  { filename: "progression-resource-fixes.vm.js" });

const uiStubs = stubs
  .replace("const ui = { restBtn: element() };", "")
  .replace("const resourceElements = {};", "");
const uiFiles = files.slice();
uiFiles.splice(uiFiles.indexOf("resources.js"), 0, "ui.js");
const uiChecks = `
let passed = 0;
function assert(ok, label) { if (!ok) throw Error(label); passed++; }
scheduleActionUiRefresh = function () {};
updateInventorySummary = function () {};
const food = getResource("food");
food.display = { textContent: "" };
updateResource("food");
assert(food.display.textContent === "Food: 0 / 25", "UI shows fresh storage cap");
getCampUpgrade("storageCache").purchased = true;
syncDefaultResourceStorageCaps();
assert(food.display.textContent === "Food: 0 / 100", "UI shows Storage Cache cap");
const action = getAction("practiceManaCycling");
action.unlocked = true;
getSkillState("manaCycling").revealed = true;
getSkillState("manaCycling").breakthroughReady = true;
getResource("mana").maxValue = 50;
getResource("mana").value = 37;
assert(getUiActionAvailability("practiceManaCycling").reason === "Requires a full mana pool (50 Mana)",
  "UI explains full mana requirement");
console.log("Progression/resource UI: " + passed + " focused checks passed.");
`;
vm.runInNewContext(uiStubs + uiFiles.map(file => fs.readFileSync(path.join(root, file), "utf8")).join("\n") + uiChecks,
  { console, structuredClone, setTimeout, clearTimeout, Date, Math, Map, Set },
  { filename: "progression-resource-ui.vm.js" });
