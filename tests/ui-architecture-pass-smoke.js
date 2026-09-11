const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const home = fs.readFileSync(path.join(root, "home-ui.js"), "utf8");
const homeCss = fs.readFileSync(path.join(root, "home-ui.css"), "utf8");
const ui = fs.readFileSync(path.join(root, "ui.js"), "utf8");
const camp = fs.readFileSync(path.join(root, "camp.js"), "utf8");
const content = fs.readFileSync(path.join(root, "content.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");

let passed = 0;
function assert(condition, message) {
  if (!condition) throw new Error(message);
  passed += 1;
  console.log("PASS:", message);
}

assert(/data-home-area="trail"[^>]*aria-controls="expeditionView"[^>]*hidden/.test(html), "Trail begins as a hidden semantic Home hotspot");
assert(!/data-home-area="trail"[^>]*disabled/.test(html), "Trail is not presented as a disabled or locked control");
assert(/trail:\s*\{[\s\S]*?destination:\s*"expedition"/.test(home), "Trail delegates to the existing Expedition destination");
assert(/isHomeTrailAvailable\(\)[\s\S]*?isMainViewAvailable\("expedition"\)/.test(home), "Trail availability reuses the canonical Expedition view gate");
assert(/trailButton\.hidden\s*=\s*!trailAvailable/.test(home), "Trail has no interactive target before Expedition is available");
assert(/updateSystemNewIndicator\(trailButton,\s*"expedition"\)/.test(home), "Trail reuses the existing one-time Expedition NEW treatment");
assert(/\.home-place-trail\s*\{[\s\S]*?right:\s*0[\s\S]*?bottom:\s*2%/.test(homeCss), "Trail occupies the lower-right clearing corner");
assert(/clearing-background-landmarks\.png/.test(homeCss) && /clearing-background-tower-landmarks\.png/.test(homeCss), "Clearing backgrounds include visible resource landmarks with and without the Tower");
assert(/\.home-place-food\s*\{[^}]*top:\s*59%[^}]*right:\s*0/.test(homeCss), "Food discovery is aligned with the right-edge berry bush");
assert(/\.home-place-water\s*\{[^}]*right:\s*12%[^}]*bottom:\s*2%/.test(homeCss), "Stream discovery is aligned with the lower-right watercourse");

assert(/id="objectiveDisclosureBtn"[\s\S]*?aria-controls="currentGoalDetails"[\s\S]*?aria-expanded="false"/.test(html), "Objective strip is a semantic inline disclosure");
assert(/id="currentGoalDetails"[^>]*hidden/.test(html), "Detailed objective content is compact by default");
assert(/id="activeTaskCard"[^>]*hidden/.test(html), "Inactive tasks reserve no permanent HUD space");
assert(/visibleItemCount[\s\S]*?completedItemCount[\s\S]*?currentGoalProgress/.test(ui), "Objective progress is derived from visible checklist items");
assert(/objectiveAutoExpandReady[\s\S]*?isNewGoal[\s\S]*?objectiveExpanded\s*=\s*true/.test(ui), "A genuinely changed objective expands once without save state");
assert(/enableObjectiveAutoExpansion\(\)[\s\S]*?setObjectiveExpanded\(false\)/.test(ui), "Loaded objectives return to the compact default state");
assert(/ui\.activeTaskCard\.hidden\s*=\s*true[\s\S]*?ui\.activeTaskCard\.hidden\s*=\s*false/.test(ui), "Active task visibility follows the shared activity state");
assert(/\.objective-summary\s*\{[\s\S]*?min-height:\s*60px/.test(css), "Desktop objective renders as a short status strip");
assert(/@media \(max-width: 719px\)[\s\S]*?\.objective-summary\s*\{[\s\S]*?min-height:\s*54px/.test(css), "Mobile objective remains a concise strip");
assert(/grid-template-columns:\s*repeat\(auto-fit, minmax\(62px, 1fr\)\)/.test(css), "Mobile vital resources share one compact adaptive row");

const researchSource = content.slice(content.indexOf("const researchDefinitions = {"), content.indexOf("const towerFloorDefinitions = {"));
const researchBlocks = [...researchSource.matchAll(/^  ([A-Za-z][A-Za-z0-9]*): \{([\s\S]*?)(?=^  [A-Za-z][A-Za-z0-9]*: \{|^\};)/gm)];
const allowedCategories = new Set(["Survival", "Craft", "Magic", "Tower", "Automation"]);
assert(researchBlocks.length > 20, "All current Research definitions were inspected");
assert(researchBlocks.every(([, , block]) => /category:\s*"([^"]+)"/.test(block)), "Every Research definition carries category metadata");
assert(researchBlocks.every(([, , block]) => allowedCategories.has(block.match(/category:\s*"([^"]+)"/)[1])), "Research uses only the five requested categories");
assert(/if \(!research\.unlocked && !research\.completed\) continue;/.test(camp), "Category grouping preserves the existing hidden-research filter");
assert(/RESEARCH_CATEGORY_ORDER\s*=\s*\["Survival", "Craft", "Magic", "Tower", "Automation"\]/.test(camp), "Visible Research follows the requested category order");
assert(/getResearchStatusPriority[\s\S]*?"available"\) return 0[\s\S]*?"blocked"\) return 2/.test(camp), "Actionable Research sorts ahead of locked Research");
assert(/document\.createElement\("details"\)[\s\S]*?"research-learned"[\s\S]*?createResearchListItem\(entry\)/.test(camp), "Learned Research is collapsed but remains selectable");
assert(/@media \(max-width: 719px\)[\s\S]*?\.research-layout\s*\{[\s\S]*?grid-template-columns:\s*1fr/.test(css), "Mobile Research uses a stacked layout");

console.log(`UI architecture smoke checks passed (${passed}).`);
