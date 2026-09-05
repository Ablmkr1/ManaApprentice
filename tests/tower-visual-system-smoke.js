const fs = require("fs");
const path = require("path");
const vm = require("vm");

const rendererPath = path.join(__dirname, "..", "tower-visual-system.js");
const rendererSource = fs.readFileSync(rendererPath, "utf8");
const results = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
  results.push(message);
}

class FakeClassList {
  constructor() { this.values = new Set(); }
  add() { Array.from(arguments).forEach((value) => this.values.add(value)); }
  contains(value) { return this.values.has(value); }
}

class FakeNode {
  constructor(tagName, document) {
    this.tagName = tagName;
    this.ownerDocument = document;
    this.children = [];
    this.attributes = {};
    this.dataset = {};
    this.classList = new FakeClassList();
    this.listeners = {};
    this.parentNode = null;
    this.textContent = "";
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name === "class") String(value).split(/\s+/).filter(Boolean).forEach((item) => this.classList.add(item));
    if (name === "data-tower-select") this.dataset.towerSelect = String(value);
  }

  getAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null; }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  append() { Array.from(arguments).forEach((child) => this.appendChild(child)); }

  insertBefore(child, reference) {
    child.parentNode = this;
    const index = this.children.indexOf(reference);
    if (index < 0) this.children.push(child);
    else this.children.splice(index, 0, child);
    return child;
  }

  addEventListener(type, listener) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(listener);
  }

  emit(type, additions) {
    const event = Object.assign({
      key: "",
      preventDefault() { this.defaultPrevented = true; },
      stopPropagation() { this.propagationStopped = true; },
    }, additions || {});
    (this.listeners[type] || []).forEach((listener) => listener(event));
    return event;
  }

  querySelector(selector) {
    if (selector.includes("button") && this.usableControl) return this.usableControl;
    const wantedTag = selector.toLowerCase();
    return findNode(this, (node) => node.tagName.toLowerCase() === wantedTag);
  }

  focus() { this.ownerDocument.activeElement = this; }
  scrollIntoView() { this.scrolledIntoView = true; }
}

function findNode(root, predicate) {
  for (const child of root.children) {
    if (predicate(child)) return child;
    const nested = findNode(child, predicate);
    if (nested) return nested;
  }
  return null;
}

function collectNodes(root, predicate, output) {
  output = output || [];
  if (predicate(root)) output.push(root);
  root.children.forEach((child) => collectNodes(child, predicate, output));
  return output;
}

function makeState(unlocked, completed, level, progress) {
  return { unlocked, completed, level: level || 0, visualProgress: progress || 0, work: progress ? 1 : 0, deposits: {} };
}

const floors = {
  floor1: { id: "floor1", name: "Floor 1", subtitle: "Living / Practical Floor", number: 1, projectId: "towerFloor1", rooms: ["bedroom", "forge", "workshop"] },
  floor2: { id: "floor2", name: "Floor 2", subtitle: "Arcane Work Floor", number: 2, projectId: "towerFloor2", rooms: ["alchemyRoom", "library", "enchantingStudy"] },
};

const rooms = {
  bedroom: { id: "bedroom", name: "Bedroom", projectId: "towerRoomBedroom" },
  library: { id: "library", name: "Library", projectId: "towerRoomLibrary" },
  workshop: { id: "workshop", name: "Workshop", projectId: "towerRoomWorkshop" },
  alchemyRoom: { id: "alchemyRoom", name: "Alchemy Room", projectId: "towerRoomAlchemyRoom" },
  forge: { id: "forge", name: "Forge", projectId: "towerRoomForge" },
  enchantingStudy: { id: "enchantingStudy", name: "Enchanting Study", projectId: "towerRoomEnchantingStudy" },
};

const definitions = {
  towerFoundation: { visualStages: Array(6).fill({}) },
  towerBasement: { visualStages: Array(6).fill({}) },
  towerFloor1: { visualStages: Array(2).fill({}) },
  towerFloor2: { visualStages: Array(2).fill({}) },
};
Object.values(rooms).forEach((room) => { definitions[room.projectId] = { visualStages: Array(2).fill({}) }; });

const document = {
  activeElement: null,
  events: [],
  createElement(tag) { return new FakeNode(tag, this); },
  createElementNS(namespace, tag) { return new FakeNode(tag, this); },
  dispatchEvent(event) { this.events.push(event.type); return true; },
  querySelector(selector) { return selector === ".elemental-tower-panel" ? this.elementalPanel : null; },
};
document.elementalPanel = new FakeNode("section", document);
document.elementalPanel.usableControl = new FakeNode("button", document);

let projects = {};
const gameState = { tower: { selectedId: "heart" } };

const context = {
  console,
  CustomEvent: class CustomEvent { constructor(type, options) { this.type = type; this.options = options; } },
  document,
  gameState,
  getProjectState(id) { return projects[id] || null; },
  getProjectDefinition(id) { return definitions[id] || null; },
  getTowerFloorDefinitions() { return floors; },
  getTowerRoomDefinition(id) { return rooms[id] || null; },
  getTowerProjectStageIndex(definition, state) { return state.completed ? definition.visualStages.length - 1 : state.level || 0; },
  getTowerProjectVisualProgress(id) { return projects[id] ? projects[id].visualProgress || 0 : 0; },
  getTowerConstructionState(id) {
    const state = projects[id];
    if (!state || !state.unlocked) return "locked";
    if (state.completed) return "completed";
    return state.visualProgress > 0 ? "under-construction" : "available";
  },
  getTowerStateLabel(state) { return state === "completed" ? "Complete" : state === "under-construction" ? "Under construction" : state === "available" ? "Ready to build" : "Locked"; },
  isTowerSelectionVisible(id) {
    const state = id === "heart" ? projects.towerFoundation
      : id === "basement" ? projects.towerBasement
      : id.startsWith("floor:") ? projects[floors[id.slice(6)].projectId]
      : id.startsWith("room:") ? projects[rooms[id.slice(5)].projectId]
      : null;
    return !!state && (state.unlocked || state.completed);
  },
  isBoundEarthElementalTowerUnlocked() { return !!projects.towerFoundation && projects.towerFoundation.completed; },
  selectTowerEntity(id) { gameState.tower.selectedId = id; },
};

context.makeTowerSvgZone = function makeTowerSvgZone(group, id, label, stateName) {
  group.classList.add("tower-illustration-zone", "is-" + stateName);
  group.dataset.towerSelect = id;
  group.setAttribute("data-tower-select", id);
  group.setAttribute("role", "button");
  group.setAttribute("tabindex", "0");
  group.setAttribute("aria-label", label + ". " + context.getTowerStateLabel(stateName) + ".");
  const activate = (event) => { event.stopPropagation(); context.selectTowerEntity(id); };
  group.addEventListener("click", activate);
  group.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(event); } });
  return group;
};

context.window = {
  matchMedia() { return { matches: true }; },
  setTimeout(callback) { callback(); },
};

vm.runInNewContext(rendererSource, context, { filename: rendererPath });

const presets = {
  buried: { projects: { towerFoundation: makeState(true, false, 0, 0) }, viewBox: "70 340 580 410", zones: ["heart"] },
  excavated: { projects: { towerFoundation: makeState(true, false, 3, 0.45) }, viewBox: "45 305 630 510", zones: ["heart"] },
  heart: { projects: { towerFoundation: makeState(true, true, 5, 1) }, viewBox: "35 245 650 570", zones: ["heart", "golem-control"] },
  basementBuild: { projects: { towerFoundation: makeState(true, true, 5, 1), towerBasement: makeState(true, false, 2, 0.55) }, viewBox: "35 245 650 570", zones: ["basement", "heart", "golem-control"] },
  basementComplete: { projects: { towerFoundation: makeState(true, true, 5, 1), towerBasement: makeState(true, true, 5, 1) }, viewBox: "35 245 650 570", zones: ["basement", "heart", "golem-control"] },
  floor1Build: { projects: { towerFoundation: makeState(true, true, 5, 1), towerBasement: makeState(true, true, 5, 1), towerFloor1: makeState(true, false, 0, 0.58) }, viewBox: "18 112 684 704", zones: ["basement", "heart", "golem-control", "floor:floor1"] },
  floor1Rooms: { projects: { towerFoundation: makeState(true, true, 5, 1), towerBasement: makeState(true, true, 5, 1), towerFloor1: makeState(true, true, 1, 1), towerRoomBedroom: makeState(true, true, 1, 1), towerRoomForge: makeState(true, false, 0, 0.63), towerRoomWorkshop: makeState(true, false, 0, 0) }, viewBox: "18 112 684 704", zones: ["basement", "heart", "golem-control", "floor:floor1", "room:bedroom", "room:forge", "room:workshop"] },
  floor2Build: { projects: { towerFoundation: makeState(true, true, 5, 1), towerBasement: makeState(true, true, 5, 1), towerFloor1: makeState(true, true, 1, 1), towerRoomBedroom: makeState(true, true, 1, 1), towerRoomForge: makeState(true, true, 1, 1), towerRoomWorkshop: makeState(true, true, 1, 1), towerFloor2: makeState(true, false, 0, 0.47) }, viewBox: "0 0 720 840", zones: ["basement", "heart", "golem-control", "floor:floor1", "room:bedroom", "room:forge", "room:workshop", "floor:floor2"] },
  complete: { projects: { towerFoundation: makeState(true, true, 5, 1), towerBasement: makeState(true, true, 5, 1), towerFloor1: makeState(true, true, 1, 1), towerRoomBedroom: makeState(true, true, 1, 1), towerRoomLibrary: makeState(true, true, 1, 1), towerRoomWorkshop: makeState(true, true, 1, 1), towerFloor2: makeState(true, true, 1, 1), towerRoomAlchemyRoom: makeState(true, true, 1, 1), towerRoomForge: makeState(true, true, 1, 1), towerRoomEnchantingStudy: makeState(true, true, 1, 1) }, viewBox: "0 0 720 840", zones: ["basement", "heart", "golem-control", "floor:floor1", "room:bedroom", "room:forge", "room:workshop", "floor:floor2", "room:alchemyRoom", "room:library", "room:enchantingStudy"] },
};

let completedVisual;
Object.entries(presets).forEach(([name, preset]) => {
  projects = preset.projects;
  gameState.tower.selectedId = "heart";
  const visual = context.window.createUnifiedTowerVisual();
  const svg = findNode(visual, (node) => node.tagName === "svg");
  const zones = collectNodes(visual, (node) => !!node.dataset.towerSelect);
  assert(svg.getAttribute("viewBox") === preset.viewBox, name + " uses the expected progression camera");
  assert(JSON.stringify(zones.map((node) => node.dataset.towerSelect)) === JSON.stringify(preset.zones), name + " exposes only its unlocked tower targets");
  assert(zones.every((node) => node.getAttribute("role") === "button" && node.getAttribute("tabindex") === "0" && node.getAttribute("aria-label")), name + " targets have keyboard semantics and accessible labels");
  if (name === "complete") completedVisual = visual;
});

const completeZones = collectNodes(completedVisual, (node) => !!node.dataset.towerSelect);
const library = completeZones.find((node) => node.dataset.towerSelect === "room:library");
library.emit("click");
assert(gameState.tower.selectedId === "room:library", "room click uses the existing tower selection path");

const forge = completeZones.find((node) => node.dataset.towerSelect === "room:forge");
forge.emit("keydown", { key: "Enter" });
assert(gameState.tower.selectedId === "room:forge", "Enter activates a room target");
forge.emit("keydown", { key: " " });
assert(gameState.tower.selectedId === "room:forge", "Space activates a room target");

const golem = completeZones.find((node) => node.dataset.towerSelect === "golem-control");
golem.emit("click");
assert(gameState.tower.selectedId === "heart", "Golem Control selects the Tower Heart");
assert(document.events.includes("mana-tower:golem-control"), "Golem Control emits mana-tower:golem-control");
assert(document.activeElement === document.elementalPanel.usableControl, "Golem Control focuses the first usable elemental control");

console.log(JSON.stringify({ passed: results.length, results }, null, 2));
