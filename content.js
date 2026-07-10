// Expedition Location Definitions
const expeditionLocations = {
  mysteriousPlants: {
    label: "Mysterious Plants",
    exploredLabel: "Fibrous Plants",
    distance: 10,
    discovered: false,
    explored: false,
    explorationProgress: 0,
    explorationRequired: 3,
    onDiscoverStory: "Clusters of unfamiliar plants grow beside the path, their pale stems twisting around one another.",
    exploreStory: [
      "The plants resist when pulled, stronger than they look.",
      "Their stalks split into long, stringy fibers.",
      "Twisted together, the fibers might make crude cord.",
    ],
    availableActions: ["gatherFiber"],
    unlocks: [{ type: "gearUpgrade", id: "crudeSatchel" }],
  },

  strangeTrails: {
    label: "Strange Trails",
    exploredLabel: "Animal Trails",
    distance: 30,
    discovered: false,
    explored: false,
    explorationProgress: 0,
    explorationRequired: 3,
    onDiscoverStory: "There's something strange about that bush...and that grass...",
    exploreStory: [
      "There's more strange markings as you look around.",
      "The strange markings almost seem connected.",
      "You catch sight of a rabbit. These are small animal trails. You'll need to make a trap if you want to catch them.",
    ],
    traps: { installed: 0, max: 5, reward: "pelt", successChance: 0.5 },
    availableActions: ["setTrap", "checkTrap"],
    unlocks: [
      { type: "resource", id: "trap" },
      { type: "action", id: "makeTrap" },
    ],
  },
};

// Exploration Engine
const explorationStages = {
  findClearing: {
    required: 1,
    story: ["You stumble forward, mind in a daze...", "The forest clears ahead...", "You can rest here.", "You need water, food, shelter."],
    unlocks: [{ type: "panel", id: "camp" }],
    onComplete: function () {
      gameState.discoveredClearing = true;
      showClearingPopup();
    },
    nextStage: "findStream",
  },

  findStream: {
    required: 1,
    story: ["You hear something that makes your thirst grow.", "Your stomach rumbles."],
    unlocks: [
      { type: "resource", id: "water" },
      { type: "action", id: "gatherWater" },
    ],
    onComplete: function () {
      gameState.discoveredStream = true;
      resources.energy.maxValue += 10;
      updateResource("energy");
      showStreamPopup();
    },
    nextStage: "findBerryBush",
  },

  findBerryBush: {
    required: 1,
    story: ["Your hunger grows sharper.", "What's hanging from that bush across the stream?"],
    unlocks: [
      { type: "resource", id: "food" },
      { type: "action", id: "gatherFood" },
    ],
    onComplete: function () {
      gameState.discoveredBerryBush = true;
      resources.energy.maxValue += 10;
      updateResource("energy");
    },
    nextStage: "findWoodPile",
  },
  findWoodPile: {
    required: 1,
    story: ["Your hunger grows sharper.", "What's hanging from that bush across the stream?"],
    unlocks: [
      { type: "resource", id: "wood" },
      { type: "action", id: "gatherWood" },
      { type: "campUpgrade", id: "smallFire" },
      { type: "campUpgrade", id: "crudeLeanTo" },
    ],
    onComplete: function () {
      gameState.discoveredDeadfall = true;
    },
    nextStage: null,
  },
};

// Camp Upgrade Engine
const campUpgrades = {
  smallFire: {
    label: "Small Fire",
    cost: {
      wood: 10,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      resources.energy.restPerSecond++;
    },
  },
  crudeLeanTo: {
    label: "Crude Lean-To",
    cost: {
      wood: 10,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      resources.energy.maxValue += 10;
      updateResource("energy");
    },
  },
};

//Player Gear System
const gearUpgrades = {
  crudeSatchel: {
    label: "Crude Satchel (10 Inventory)",
    cost: {
      fiber: 10,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      gameState.expedition.carryCapacity = 10;
      refreshExpeditionUI();
    },
  },
  waterskin: {
    label: "Waterskin (+10 Water Capacity)",
    cost: {
      pelt: 3,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      gameState.expedition.waterCapacity += 10;
      refreshExpeditionUI();
    },
  },

  crudeBackpack: {
    label: "Crude Backpack (Inventory 20)",
    cost: {
      pelt: 6,
      fiber: 10,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      gameState.expedition.carryCapacity = 20;

      if (gearUpgrades.crudeSatchel.display) {
        gearUpgrades.crudeSatchel.display.style.display = "none";
      }

      refreshExpeditionUI();
    },
  },
};
