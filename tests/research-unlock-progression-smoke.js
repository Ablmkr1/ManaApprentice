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
function assert(ok, message) { if (!ok) throw Error(message); passed++; }
hookActionCompletions();

const meditation = getSkillState("meditation");
const mana = getResource("mana");
mana.maxValue = 20;
mana.value = 0;
getResearch("meditation").completed = false;
getAction("meditate").onComplete();
recordMeditation(); // No alternate caller may bypass the shared progress guard.
assert(mana.value > 0 && meditation.successfulMeditations === 0 && meditation.level === 0,
  "meditation restores mana without awarding locked skill progress");
getResearch("meditation").completed = true;
getAction("meditate").onComplete();
assert(meditation.successfulMeditations === 1 && meditation.level === 0,
  "research enables meditation progress at the original rate without backfill");

const stages = ["leatherworking", "leatherGear", "reinforcedLeatherwork"];
assert(getResearch("leatherGear").requires.researchCompleted.includes("leatherworking") &&
  getResearch("reinforcedLeatherwork").requires.researchCompleted.includes("leatherGear"),
  "leather research forms a dependency chain");
const expected = [
  ["resourceCraft:leather", "gearUpgrade:reinforcedWaterskin"],
  ["gearUpgrade:travelBoots", "gearUpgrade:leatherShirt", "gearUpgrade:leatherPants"],
  ["gearUpgrade:repairedLeatherBackpack", "campUpgrade:warmCot"],
];
stages.forEach((id, index) => {
  const actual = getResearch(id).unlocks.map(unlock => unlock.type + ":" + unlock.id);
  assert(JSON.stringify(actual) === JSON.stringify(expected[index]), id + " grants its intended recipe group");
});
assert(stages.flatMap(id => getResearch(id).unlocks).length === 7,
  "all seven original Leatherworking unlocks remain obtainable");
getResearch("leatherworking").completed = true;
applyResearchUnlocks("leatherworking");
assert(getResourceCraft("leather").unlocked && getGearUpgrade("reinforcedWaterskin").unlocked &&
  !getGearUpgrade("travelBoots").unlocked && !getGearUpgrade("repairedLeatherBackpack").unlocked,
  "foundational research grants only the first leather group");
getResearch("leatherGear").completed = true;
applyResearchUnlocks("leatherGear");
assert(["travelBoots", "leatherShirt", "leatherPants"].every(id => getGearUpgrade(id).unlocked) &&
  !getGearUpgrade("repairedLeatherBackpack").unlocked && !getCampUpgrade("warmCot").unlocked,
  "Leather Gear grants wearables without advanced utility gear");
getResearch("reinforcedLeatherwork").completed = true;
applyResearchUnlocks("reinforcedLeatherwork");
assert(getGearUpgrade("repairedLeatherBackpack").unlocked && getCampUpgrade("warmCot").unlocked,
  "Reinforced Leatherwork grants the remaining old unlocks");

const legacy = {
  version: 41, gameState: {}, resources: {}, actions: {}, campUpgrades: {}, gearUpgrades: {},
  spells: {}, resourceCrafts: {}, expeditionLocations: {}, dungeons: {},
  research: { leatherworking: { completed: true } }, automation: {},
};
const migrated = migrateSaveData(legacy);
assert(migrated.version === SAVE_VERSION && stages.slice(1).every(id => migrated.research[id].completed),
  "old Leatherworking saves retain access to both new stages");
assert(migrated.gearUpgrades.repairedLeatherBackpack.unlocked && migrated.campUpgrades.warmCot.unlocked &&
  migrated.resourceCrafts.leather.unlocked, "migration preserves old recipe unlocks");
const ownedLegacy = structuredClone(legacy);
ownedLegacy.gearUpgrades.leatherShirt = { purchased: true, unlocked: false };
const ownedMigrated = migrateSaveData(ownedLegacy);
assert(ownedMigrated.gearUpgrades.leatherShirt.purchased,
  "migration preserves already-crafted leather equipment");

getSpell("arcaneForce").unlocked = true;
getResearch("crudeIronPick").completed = false;
getResource("crudeIronPickHead").value = 0;
getResource("iron").value = 0;
mana.value = 20;
getResource("iron").discovered = false;
assert(!isProductionSpellTargetAvailable("arcaneForce", "nails"),
  "undiscovered iron does not reveal generic shaping recipes");
getResource("iron").discovered = true;
assert(isProductionSpellTargetAvailable("arcaneForce", "nails") &&
  !canApplyProductionSpellTarget("arcaneForce", "nails"),
  "discovered generic recipes remain visible when their iron is spent");
assert(!isProductionSpellTargetAvailable("arcaneForce", "crudeIronPickHead"),
  "Shape Pick Head stays hidden before research");
getResearch("crudeIronPick").completed = true;
assert(isProductionSpellTargetAvailable("arcaneForce", "crudeIronPickHead") &&
  !canApplyProductionSpellTarget("arcaneForce", "crudeIronPickHead"),
  "unlocked Shape Pick Head is visible but unusable without iron");
assert(formatSpellOptionDetails("arcaneForce", getArcaneForceDefinitions().crudeIronPickHead,
  { type: "productionSpell", spellName: "arcaneForce", targetId: "crudeIronPickHead", mode: "camp" }).includes("3 Iron"),
  "normal spell cost details show the iron requirement");
getResource("iron").value = 3;
assert(canApplyProductionSpellTarget("arcaneForce", "crudeIronPickHead"),
  "Shape Pick Head becomes usable with enough iron");

createArcaneForceExperienceEntry = function () { return {}; };
renderContextualSpellCastOption = function () { return false; };
appendProductionSpellOptionContent = function (button, spellName, definition) { button.textContent = definition.label; };
applyUiSpellOptionState = function () {};
document.createElement = function () { return { classList: { add() {} }, addEventListener() {}, appendChild() {} }; };
getResource("iron").value = 0;
const menu = { children: [], appendChild(item) { this.children.push(item); } };
renderProductionSpellTargetMenu("arcaneForce", menu);
const pickButton = menu.children.find(item => item.textContent === "Shape Pick Head");
assert(pickButton && pickButton.disabled, "spell menu renders the unaffordable pick head disabled");
getResource("iron").value = 3;
const affordableMenu = { children: [], appendChild(item) { this.children.push(item); } };
renderProductionSpellTargetMenu("arcaneForce", affordableMenu);
const affordablePick = affordableMenu.children.find(item => item.textContent === "Shape Pick Head");
assert(affordablePick && !affordablePick.disabled,
  "the same visible pick-head option re-enables when iron is sufficient");

console.log("Research/unlock progression: " + passed + " focused checks passed.");
`;

vm.runInNewContext(stubs + files.map(file => fs.readFileSync(path.join(root, file), "utf8")).join("\n") + checks,
  { console, structuredClone, setTimeout, clearTimeout, Date, Math, Map, Set },
  { filename: "research-unlock-progression.vm.js" });
