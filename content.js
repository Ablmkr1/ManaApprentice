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
    onExplored: function () {
      unlockAction("gatherFiber");
    },
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
    unlocks: [{ type: "resource", id: "water" }],
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
    unlocks: [{ type: "resource", id: "food" }],
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
