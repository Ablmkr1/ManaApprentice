const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const ui = fs.readFileSync(path.join(root, "ui.js"), "utf8");
const home = fs.readFileSync(path.join(root, "home-ui.js"), "utf8");
const css = fs.readFileSync(path.join(root, "home-ui.css"), "utf8");
const content = fs.readFileSync(path.join(root, "content.js"), "utf8");

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
assert(/data-home-area="tower"[^>]*aria-controls="towerView"[^>]*hidden disabled/.test(html), "Tower begins as a non-interactive hidden scene destination");
assert(/function isHomeTowerDiscovered\(\)[\s\S]*sensedReveals\.campFoundation/.test(home), "Tower hotspot derives from the existing Mana Sense foundation reveal");
assert(/destination: "tower"/.test(home) && /setMainView\(viewName, \{ userSelected: true, homeTowerEntry: viewName === "tower" \}\)/.test(home), "Tower hotspot reuses existing main-view navigation");
assert(/viewName === "tower"[\s\S]*return typeof hasVisibleProject/.test(ui), "The Tower tab retains its existing project-visibility gate");
assert(/homeTowerViewEntryActive[\s\S]*options\.homeTowerEntry[\s\S]*sensedReveals\.campFoundation/.test(ui), "The sensed foundation grants only transient scene-entry access to Tower");
assert(/const MAIN_VIEW_NAMES = \["home", "camp"/.test(ui), "Home is registered with the existing tab controller");
assert(/viewName === "home"\) return isHomeUnlocked\(\)/.test(ui), "Home availability uses the main-view route");
assert(/function isHomeUnlocked\(\) \{\s*return true;\s*\}/.test(ui), "Home is available from the beginning");
assert(/function getDefaultMainView\(\)[\s\S]*return "home"/.test(ui), "Home is the default view while the player is at the clearing");
assert(/function areHomeResourcesDiscovered\(\)[\s\S]*discoveredDeadfall[\s\S]*discoveredBerryBush[\s\S]*discoveredStream/.test(home), "The resource-discovery gate reuses all three canonical flags");
assert(/function isHomeCampEstablished\(\)[\s\S]*hasPurchasedCampUpgrade\("smallFire"\)[\s\S]*hasPurchasedCampUpgrade\("crudeLeanTo"\)/.test(home), "Established camp derives from the two founding structures");
assert(/home:\s*{[\s\S]*title: "Home Established"[\s\S]*The clearing is beginning to feel like a place you can return to\./.test(ui), "Home uses the existing one-time system notification framework");

const homeUnlockSource = ui.match(/function isHomeUnlocked\(\) \{[\s\S]*?\n\}/);
assert(homeUnlockSource, "Home unlock predicate can be evaluated independently");
const isHomeUnlocked = new Function(
  homeUnlockSource[0] + "; return isHomeUnlocked;"
)();

assert(isHomeUnlocked(), "Home unlocks for a brand-new game");
assert((html.match(/home-place-resource/g) || []).length >= 3, "Wood, Food, and Stream use spatial Home hotspots");
assert(/data-home-state="fogged"/.test(css) && /data-explore-step="1"/.test(css) && /data-explore-step="2"/.test(css), "Explore progress drives three progressively lighter fog treatments");
assert(/function declareHomeWorkSpot\(\)[\s\S]*unlockCampUpgrade\("smallFire"\)[\s\S]*unlockCampUpgrade\("crudeLeanTo"\)/.test(home), "Declaring the Work Spot unlocks the existing founding projects");
const deadTreeStart = content.indexOf("deadTree:");
const clearingEnd = content.indexOf("// Expedition Location Definitions", deadTreeStart);
const deadTreeSource = content.slice(deadTreeStart, clearingEnd);
assert(deadTreeStart >= 0 && clearingEnd > deadTreeStart && !/campUpgrade/.test(deadTreeSource), "Deadfall discovery no longer bypasses Work Spot declaration");

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
assert(/towerFloor1[\s\S]*completed[\s\S]*has-built-tower/.test(home), "Above-ground Tower artwork still waits for a completed floor");
assert(/workPanel: "research"/.test(home) && /isResearchSpotPurchased/.test(home), "Research reuses its work panel and unlock gate");
assert(/data-home-area="workspot"[\s\S]*#workTabs[\s\S]*data-home-area="study"[\s\S]*#workTabs/.test(css), "Workspot and Research Spot suppress the shared work sub-tabs in Home");
assert(/processing:\s*{[\s\S]*title: "Processing Station"/.test(home) && /hasPurchasedCampUpgrade\("campAlchemyStation"\)/.test(home), "Processing Station preserves the existing mixed-workshop upgrade gate");
assert(/station-processing\.png/.test(css) && !/home-place-alchemy/.test(css), "Processing Station replaces the alchemy-only clearing art");
assert(/hasUnlockedAutomation/.test(home), "Automation place preserves its existing unlock gate");
assert(/restoreHomeCampNodes/.test(home) && /homeNodeAnchors/.test(home), "Moved Camp controls are restored for the existing Camp tab");
assert(/@media \(max-width: 560px\)/.test(css), "Clearing includes a mobile layout");

console.log("Home UI Pass 1 smoke checks passed.");
