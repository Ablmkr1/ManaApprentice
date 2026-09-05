const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const ui = fs.readFileSync(path.join(root, "ui.js"), "utf8");
const home = fs.readFileSync(path.join(root, "home-ui.js"), "utf8");
const css = fs.readFileSync(path.join(root, "home-ui.css"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log("PASS:", message);
}

assert(/data-main-view-tab="home"/.test(html), "Home is present in primary navigation");
assert(/id="homeViewTab"[^>]*style="display: none"/.test(html), "Home is hidden before availability is evaluated");
assert(/data-main-view-panel="home"/.test(html), "Home has its own main view panel");
assert(/data-main-view-tab="camp"/.test(html) && /data-main-view-tab="tower"/.test(html), "Camp and Tower tabs remain present");
assert((html.match(/data-home-area=/g) || []).length >= 7, "Clearing is composed from independent clickable places");
assert(/homeTowerVisual/.test(html) && /createUnifiedTowerVisual/.test(home), "Home reuses the progression-aware Tower visual as a placeholder");
assert(/const MAIN_VIEW_NAMES = \["home", "camp"/.test(ui), "Home is registered with the existing tab controller");
assert(/viewName === "home"\) return isHomeUnlocked\(\)/.test(ui), "Home availability uses the progression gate");
assert(/gameState\.discoveredBerryBush[\s\S]*gameState\.discoveredStream[\s\S]*gameState\.discoveredDeadfall[\s\S]*hasPurchasedCampUpgrade\("smallFire"\)[\s\S]*hasPurchasedCampUpgrade\("crudeLeanTo"\)/.test(ui), "Home requires Food, Water, Wood, Campfire, and Crude Shelter progression");
assert(/home:\s*{[\s\S]*title: "Home Established"[\s\S]*The clearing is beginning to feel like a place you can return to\./.test(ui), "Home uses the existing one-time system notification framework");

const homeUnlockSource = ui.match(/function isHomeUnlocked\(\) \{[\s\S]*?\n\}/);
assert(homeUnlockSource, "Home unlock predicate can be evaluated independently");

const discoveryState = {
  discoveredBerryBush: true,
  discoveredStream: true,
  discoveredDeadfall: true,
};
const purchasedUpgrades = { smallFire: true, crudeLeanTo: true };
const isHomeUnlocked = new Function(
  "gameState",
  "hasPurchasedCampUpgrade",
  homeUnlockSource[0] + "; return isHomeUnlocked;"
)(discoveryState, function (upgradeName) { return !!purchasedUpgrades[upgradeName]; });

assert(isHomeUnlocked(), "Home unlocks when all five canonical requirements are complete");
[
  ["discoveredBerryBush", discoveryState],
  ["discoveredStream", discoveryState],
  ["discoveredDeadfall", discoveryState],
  ["smallFire", purchasedUpgrades],
  ["crudeLeanTo", purchasedUpgrades],
].forEach(function ([requirement, owner]) {
  owner[requirement] = false;
  assert(!isHomeUnlocked(), "Home stays hidden without " + requirement);
  owner[requirement] = true;
});

assert(/nodeIds: \["campActionsSection", "campContextualActions", "campLocationObjectActionsSlot"\]/.test(home), "Campfire mounts the existing camp action controls");
assert(/shelter:\s*{[\s\S]*?nodeIds: \[\][\s\S]*?directAction: "rest"/.test(home), "Shelter directly invokes Rest without mounting a context panel");
assert(/ui\.restBtn\.click\(\)/.test(home), "Shelter reuses the existing Rest button handler");
assert(/meditation:\s*{[\s\S]*?nodeIds: \[\][\s\S]*?directAction: "meditate"/.test(home), "Meditation Spot directly invokes Meditate without mounting a context panel");
assert(/getAction\("meditate"\)[\s\S]*meditation\.button\.click\(\)/.test(home), "Meditation Spot reuses the existing Meditate button handler");
const directActionSource = home.match(/function activateHomeDirectAction\(actionName\) \{[\s\S]*?\n\}/);
assert(directActionSource && !/selectHomeArea\(null\)/.test(directActionSource[0]), "Shelter preserves the currently open station panel while resting");
assert(/workspot:\s*{[\s\S]*?nodeIds: \["craftingSection"\][\s\S]*?workPanel: "crafting"/.test(home), "Initial Workspot mounts only the existing crafting controls");
assert(/workbench:\s*{[\s\S]*?nodeIds: \["craftingSection"\][\s\S]*?workPanel: "crafting"/.test(home), "Workbench mounts only the existing crafting controls");
assert(/hasPurchasedCampUpgrade\("workbench"\)/.test(home), "Workbench illustration is gated by its purchased upgrade");
assert(/hasPurchasedCampUpgrade\("stoneFirePit"\)[\s\S]*stone-fire-pit[\s\S]*small-fire/.test(home), "Campfire artwork advances from Small Fire to Stone Fire Pit");
assert(/hasPurchasedCampUpgrade\("smallHut"\)[\s\S]*hasPurchasedCampUpgrade\("framedShelter"\)[\s\S]*hasPurchasedCampUpgrade\("lessCrudeShelter"\)/.test(home), "Shelter artwork follows every purchased shelter tier");
assert(/station-campfire-small\.png[\s\S]*station-campfire\.png/.test(css), "Campfire visual stages use separate environmental assets");
assert(/station-shelter-less-crude\.png[\s\S]*station-shelter-framed\.png[\s\S]*station-shelter-hut\.png/.test(css), "Shelter visual stages use separate environmental assets");
assert(/hasPurchasedCampUpgrade\("attunedMeditationSpot"\)[\s\S]*attuned-meditation-spot/.test(home), "Meditation artwork follows its attuned upgrade");
assert(/station-meditation\.png[\s\S]*station-meditation-attuned\.png/.test(css), "Meditation stages use separate environmental assets");
assert(/towerFloor1[\s\S]*completed[\s\S]*has-built-tower/.test(home), "Tower exterior stays hidden until an above-ground floor is built");
assert(/workPanel: "research"/.test(home) && /isResearchSpotPurchased/.test(home), "Research reuses its work panel and unlock gate");
assert(/data-home-area="workspot"[\s\S]*#workTabs[\s\S]*data-home-area="study"[\s\S]*#workTabs/.test(css), "Workspot and Research Spot suppress the shared work sub-tabs in Home");
assert(/processing:\s*{[\s\S]*title: "Processing Station"/.test(home) && /hasPurchasedCampUpgrade\("campAlchemyStation"\)/.test(home), "Processing Station preserves the existing mixed-workshop upgrade gate");
assert(/station-processing\.png/.test(css) && !/home-place-alchemy/.test(css), "Processing Station replaces the alchemy-only clearing art");
assert(/hasUnlockedAutomation/.test(home), "Automation place preserves its existing unlock gate");
assert(/restoreHomeCampNodes/.test(home) && /homeNodeAnchors/.test(home), "Moved Camp controls are restored for the existing Camp tab");
assert(/@media \(max-width: 560px\)/.test(css), "Clearing includes a mobile layout");

console.log("Home UI Pass 1 smoke checks passed.");
