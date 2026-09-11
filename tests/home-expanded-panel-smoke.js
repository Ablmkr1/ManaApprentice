const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const home = fs.readFileSync(path.join(root, "home-ui.js"), "utf8");
const css = fs.readFileSync(path.join(root, "home-ui.css"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log("PASS:", message);
}

assert(/study:\s*{[\s\S]*?panelMode: "expanded"/.test(home), "Research Spot declares expanded panel mode");
assert(/definition\.panelMode === "expanded" \? "expanded" : "standard"/.test(home), "Stations default to standard mode");
assert(/layout\.dataset\.panelMode = panelMode/.test(home), "Selection reflects panel mode on the Home layout");
assert(/!selectedHomeArea[\s\S]*layout\.dataset\.panelMode = "standard"/.test(home), "Closing a station restores the standard layout mode");
assert(/\.home-clearing-layout\s*\{[\s\S]*?position:\s*relative/.test(css), "The clearing layout is the positioning context for one persistent scene");
assert(/\.home-area-panel\s*\{[\s\S]*?position:\s*absolute[\s\S]*?z-index:\s*7/.test(css), "Desktop station content floats over the persistent clearing");
assert(/home-area-panel\[data-panel-mode="expanded"\][^}]*width:\s*min\(62%, 760px\)/.test(css), "Expanded Research gets a wider overlay without replacing the scene");
assert(/data-panel-mode="expanded"[^}]*\.research-layout[\s\S]*grid-template-columns:\s*minmax\(0, 0\.54fr\)\s*minmax\(0, 1fr\)/.test(css), "Expanded Research uses a shrink-safe master/detail grid");
assert(/research-list,[\s\S]*research-details[\s\S]*overflow-x:\s*hidden[\s\S]*overflow-y:\s*auto/.test(css), "Research panes scroll vertically without horizontal overflow");
assert(/@media \(max-width: 719px\)[\s\S]*research-layout[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/.test(css), "Mobile Research stacks into one column");
assert(/@media \(max-width: 900px\)[\s\S]*\.home-area-panel,[\s\S]*bottom:\s*10px[\s\S]*max-height:\s*min\(40vh/.test(css), "Mobile station content is a bounded bottom sheet over the clearing");
assert(!/scrollIntoView/.test(home), "Selecting a mobile station does not scroll below the clearing artwork");
assert(/@keyframes home-panel-open/.test(css) && /prefers-reduced-motion[\s\S]*home-area-panel \{ animation: none/.test(css), "Overlay motion is restrained and respects reduced motion");
assert(/aria-label="Research list"/.test(html) && /aria-label="Selected research details"/.test(html), "Research master and detail panes have accessible identities");

console.log("Home expanded panel smoke checks passed.");
