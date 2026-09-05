const fs = require("fs");
const path = require("path");
const vm = require("vm");

const campSource = fs.readFileSync(path.join(__dirname, "..", "camp.js"), "utf8");
const automationStart = campSource.indexOf("function processBoundEarthElementalAutomation(deltaSeconds)");
const automationEnd = campSource.indexOf("function getBoundEarthElementalAutomationSignature()", automationStart);
const automationSource = campSource.slice(automationStart, automationEnd);
if (!automationSource.includes("updateBoundEarthElementalLiveUI()") || automationSource.includes("refreshBoundEarthElementalUI()")) {
  throw new Error("Automation ticks must update live Tower values without rebuilding the clickable controls.");
}
const functionStart = campSource.indexOf("function createBoundEarthElementalTowerPanel()");
const functionEnd = campSource.indexOf("function appendBoundEarthElementalTowerPanel()", functionStart);
const createPanelSource = campSource.slice(functionStart, functionEnd);
const unlockedNodes = new Set();

function element(tagName) {
  return {
    tagName,
    children: [],
    className: "",
    textContent: "",
    appendChild(child) { this.children.push(child); return child; },
    append() { this.children.push(...arguments); },
    setAttribute() {},
  };
}

const context = {
  document: { createElement: element },
  getBoundEarthElementalState() { return { assignments: { tower: 2 } }; },
  getBoundEarthElementalActiveCount() { return 3; },
  getBoundEarthElementalAssignmentCount(destination) { return destination.type === "tower" ? 2 : 0; },
  getBoundEarthElementalTowerConstructionRate() { return 2; },
  getTowerHeartElementalControlCapacity() { return 5; },
  createBoundEarthElementalAssignmentAdjustButton() { return element("button"); },
  isBoundEarthElementalNodeUnlocked(nodeName) { return unlockedNodes.has(nodeName); },
  createCompactBoundEarthElementalNodePanel(nodeName) { return { nodeName }; },
  createBoundEarthElementalCraftingDropdown() { return element("details"); },
};

vm.runInNewContext(createPanelSource, context);

const separatedSummaryPanel = context.createBoundEarthElementalTowerPanel();
const totalControlledRow = separatedSummaryPanel.children.find((child) => child.className === "elemental-controlled-row");
const constructionRow = separatedSummaryPanel.children.find((child) => child.className.includes("elemental-construction-row"));
if (!totalControlledRow || totalControlledRow.children[0].textContent !== "Total Controlled" || totalControlledRow.children[1].textContent !== "3 / 5") {
  throw new Error("The Tower Heart should show total controlled elementals separately from assignments.");
}
if (!constructionRow || constructionRow.children[0].textContent !== "Tower Construction" || constructionRow.children[1].children[1].textContent !== "2") {
  throw new Error("Tower Construction should have its own assignment count between minus and plus controls.");
}

function renderedNodes() {
  return context.createBoundEarthElementalTowerPanel().children
    .filter((child) => child.nodeName)
    .map((child) => child.nodeName);
}

unlockedNodes.add("north");
if (JSON.stringify(renderedNodes()) !== JSON.stringify(["north"])) {
  throw new Error("The Tower Heart should initially show only the unlocked northern node.");
}

unlockedNodes.add("east");
if (JSON.stringify(renderedNodes()) !== JSON.stringify(["north", "east"])) {
  throw new Error("The Tower Heart should show the eastern leather job after the Eastern Node unlocks.");
}

unlockedNodes.add("south");
if (JSON.stringify(renderedNodes()) !== JSON.stringify(["north", "east", "south"])) {
  throw new Error("The Tower Heart should show the southern herb job after the Southern Node unlocks.");
}

console.log("Tower Heart renders all unlocked regional gathering nodes.");
