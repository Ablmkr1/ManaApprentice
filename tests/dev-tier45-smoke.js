const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
let passed = 0;

function assert(condition, message) {
  if (!condition) throw new Error(message);
  passed += 1;
  console.log("PASS: " + message);
}

assert(/data-tier="4\.5">T4\.5<\/button>/.test(html), "Developer options expose the T4.5 checkpoint");
assert(/DEV_TIER_CHECKPOINTS\s*=\s*\[[^\]]*4\.5/.test(script), "T4.5 is accepted by the tier jump controller");
assert(/if \(tier >= 4\.5\) applyDevTier45\(\)/.test(script), "T4.5 builds on the complete T4 checkpoint");

const start = script.indexOf("function applyDevTier45()");
const end = script.indexOf("function markClearingObjectComplete", start);
const tier45 = script.slice(start, end);

[
  "getExpeditionLocationDefinitions",
  "getDungeonDefinitions",
  "getResearchDefinitions",
  "getCampUpgradeDefinitions",
  "getGearUpgradeDefinitions",
  "getResourceCraftDefinitions",
  "getAutomationDefinitions",
  "getActionDefinitions",
  "getSpellDefinitions",
  "getProjectDefinitions",
  "getTowerNodeDefinitions",
  "getSkillDefinitions",
  "getJournalDefinitions",
].forEach(function (definitionGetter) {
  assert(tier45.includes(definitionGetter + "()"), "T4.5 covers every current entry from " + definitionGetter);
});

assert(tier45.includes("ATTUNEMENT_RANK_TWO_PROGRESSION"), "T4.5 maxes Attunement Rank II");
assert(tier45.includes("getImbueRankTwoConfig().progression"), "T4.5 maxes Imbue Rank II");
assert(tier45.includes("ARCANE_FORCE_RANK_TWO_CONFIG.progression"), "T4.5 maxes Arcane Force Rank II");
assert(tier45.includes("completeAllPermanentImbuementsForDev"), "T4.5 completes permanent Imbue upgrades");
assert(tier45.includes("maxBoundElementalInventoryForDev"), "T4.5 fills the finite Tower Heart elemental capacity");
assert(/tier === 4\.5 \? Object\.keys\(getResourceDefinitions\(\)\)/.test(script), "T4.5 fills every defined resource inventory");
assert(/gameState\.towerNodes\[nodeName\] = getDefaultTowerNodeState\(nodeName\)/.test(script), "Tier reset clears all modern Tower Node fields");
assert(/gameState\.magic\.imbuement = \{/.test(script) && /gameState\.magic\.arcaneForce = \{/.test(script), "Tier reset clears Rank II spell state");

console.log("T4.5 developer checkpoint smoke checks passed (" + passed + ").");
