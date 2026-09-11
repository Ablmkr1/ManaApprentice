const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const home = fs.readFileSync(path.join(root, "home-ui.js"), "utf8");
const css = fs.readFileSync(path.join(root, "home-ui.css"), "utf8");
const camp = fs.readFileSync(path.join(root, "camp.js"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log("PASS:", message);
}

assert(/\.home-clearing-layout\s*\{[\s\S]*?position:\s*relative/.test(css), "Home scene provides the overlay positioning context");
assert(/\.home-area-panel\s*\{[\s\S]*?position:\s*absolute/.test(css), "Desktop context is overlaid instead of placed in the document flow");
assert(/@media \(max-width: 900px\)[\s\S]*bottom:\s*10px[\s\S]*max-height:\s*min\(40vh/.test(css) && /\.home-area-panel\s*\{[\s\S]*?overflow:\s*auto/.test(css), "Mobile uses the same internally scrolling bottom sheet");
assert(!/scrollIntoView/.test(home), "Station selection never scrolls the player below the clearing");
assert(/content\.replaceChildren\(\);\s*panel\.scrollTop = 0;/.test(home), "Each station swap starts the shared overlay at its heading");
assert(/id="homeAreaCloseBtn"/.test(html) && /aria-label="Return to clearing"/.test(html), "The existing clearing reset is available inside the overlay");
assert(/revealId === "campFoundation"[\s\S]*updateHomeAreaAvailability\(\)[\s\S]*syncMainViewAvailability\(\)/.test(camp), "Mana Sense refreshes Home and Tower navigation immediately");

const towerButton = {
  hidden: false,
  disabled: false,
  classList: { toggle() {} },
};
const scene = { classList: { toggle(name, value) { this[name] = value; } } };
let destination = null;
const context = {
  console,
  gameState: { magic: { sensedReveals: {} } },
  document: {
    querySelector(selector) {
      if (selector === '[data-home-area="tower"]') return towerButton;
      return null;
    },
    getElementById(id) { return id === "homeScene" ? scene : null; },
  },
  getProjectState() { return null; },
  setMainView(name, options) { destination = { name, options }; },
};

vm.runInNewContext(home, context, { filename: "home-ui.js" });
context.updateHomeTowerVisibility();
assert(towerButton.hidden && towerButton.disabled, "Tower has no hover/click target before foundation discovery");
context.activateHomeDestination("tower");
assert(destination === null, "Tower navigation is blocked before foundation discovery");

context.gameState.magic.sensedReveals.campFoundation = true;
context.updateHomeTowerVisibility();
assert(!towerButton.hidden && !towerButton.disabled, "Existing saves with a sensed foundation expose the Tower hotspot immediately");
context.activateHomeDestination("tower");
assert(destination && destination.name === "tower" && destination.options.userSelected && destination.options.homeTowerEntry, "Tower hotspot delegates to the existing main-view navigation");

console.log("Home overlay smoke checks passed.");
