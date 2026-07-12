// Expedition Location Definitions
const expeditionLocations = {
  mysteriousPlants: {
    label: "Mysterious Plants",
    exploredLabel: "Fibrous Plants",
    travelAction: "travelToMysteriousPlants",
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
    panelText: {
      discovered: "Clusters of unfamiliar plants grow beside the path, their pale stems twisting around one another.",
      explored: "Fibrous plants grow in dense clumps here.",
    },
    availableActions: ["gatherFiber"],
    unlocks: [
      { type: "gearUpgrade", id: "crudeSatchel" },
      { type: "campUpgrade", id: "lessCrudeShelter" },
    ],
  },

  strangeTrails: {
    label: "Strange Trails",
    exploredLabel: "Animal Trails",
    travelAction: "travelToStrangeTrails",
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
    panelText: {
      discovered: "There's something strange about that bush...and that grass...",
      explored: "Game trails cross through the grass. Your traps can be checked here.",
    },
    trapSites: {
      reward: "pelt",
      successChance: 0.5,
      sites: [
        { label: "Beside the Split Tree", discovered: false, installed: false, checkedThisVisit: false },
        { label: "Through the Thorn Bush", discovered: false, installed: false, checkedThisVisit: false },
        { label: "Under the Fallen Log", discovered: false, installed: false, checkedThisVisit: false },
        { label: "Along the Muddy Bend", discovered: false, installed: false, checkedThisVisit: false },
        { label: "Near the Hollow Stump", discovered: false, installed: false, checkedThisVisit: false },
      ],
    },
    availableActions: ["scoutTrapSite", "setTrap", "checkTrap"],
    unlocks: [
      { type: "resource", id: "trap" },
      { type: "action", id: "makeTrap" },
      { type: "action", id: "scoutTrapSite" },
    ],
  },

  creepyCave: {
    label: "Creepy Cave",
    travelAction: "travelToCreepyCave",
    distance: 60,
    discovered: false,
    explored: true,
    onDiscoverStory: "A dark opening cuts into the hillside. Loose stone is scattered around the cave mouth.",
    panelText: {
      discovered: "A dark opening cuts into the hillside. Loose stone is scattered around the cave mouth.",
      explored: "Loose stone litters the cave mouth.",
    },
    availableActions: ["gatherStone"],
  },
};

// Exploration Engine
const explorationStages = {
  findClearing: {
    required: 3,
    story: ["You stumble forward, mind in a daze...", "The forest clears ahead...", "You can rest here.", "You need water, food, shelter."],
    unlocks: [{ type: "panel", id: "camp" }],
    onComplete: function () {
      gameState.discoveredClearing = true;
      setPhase("clearing");
      updatePlacePanel();
      showClearingPopup();
    },
    nextStage: "findStream",
  },

  findStream: {
    required: 2,
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
    required: 2,
    story: ["Your hunger grows sharper.", "What's hanging from that bush across the stream?"],
    unlocks: [
      { type: "resource", id: "food" },
      { type: "action", id: "gatherFood" },
      { type: "storageUpgrade", id: "foodStorage" },
    ],
    onComplete: function () {
      gameState.discoveredBerryBush = true;
      resources.energy.maxValue += 10;
      updateResource("energy");
    },
    nextStage: "findWoodPile",
  },
  findWoodPile: {
    required: 2,
    story: ["Huh, it's a stick?", "Even more sticks, if you collected them you might be able to use them."],
    unlocks: [
      { type: "resource", id: "wood" },
      { type: "action", id: "gatherWood" },
      { type: "campUpgrade", id: "smallFire" },
      { type: "campUpgrade", id: "crudeLeanTo" },
      { type: "storageUpgrade", id: "woodStorage" },
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
  lessCrudeShelter: {
    label: "Less Crude Shelter",
    cost: {
      wood: 10,
      fiber: 10,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      resources.energy.restPerSecond += 1;

      if (campUpgrades.crudeLeanTo.display) {
        campUpgrades.crudeLeanTo.display.style.display = "none";
      }
    },
  },

  uncomfortableCot: {
    label: "Uncomfortable Cot",
    cost: {
      wood: 10,
      fiber: 10,
      pelt: 5,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      resources.energy.maxValue += 20;
      updateResource("energy");
    },
  },
  stoneFirePit: {
    label: "Stone Fire Pit",
    cost: {
      wood: 10,
      stone: 10,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      resources.energy.maxValue += 20;
      updateResource("energy");

      if (campUpgrades.smallFire.display) {
        campUpgrades.smallFire.display.style.display = "none";
      }
    },
  },

  damStream: {
    label: "Dam Stream",
    cost: {
      wood: 20,
      stone: 20,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      resources.energy.maxValue += 20;
      updateResource("energy");
    },
  },
};

// Camp Storage Upgrade Engine
const storageUpgrades = {
  woodStorage: {
    label: "Wood Storage",
    resource: "wood",
    tier: 0,
    maxTier: 4,
    maxValueIncrease: 20,
    unlocked: false,
    button: null,
    display: null,
    costs: [{ wood: 10 }, { wood: 20, fiber: 5 }, { wood: 30, fiber: 10 }, { wood: 40, stone: 10 }],
  },
  foodStorage: {
    label: "Food Storage",
    resource: "food",
    tier: 0,
    maxTier: 4,
    maxValueIncrease: 10,
    unlocked: false,
    button: null,
    display: null,
    costs: [{ wood: 10 }, { wood: 20, fiber: 5 }, { wood: 20, fiber: 10, pelt: 2 }, { wood: 30, fiber: 10, stone: 5 }],
  },
  fiberStorage: {
    label: "Fiber Storage",
    resource: "fiber",
    tier: 0,
    maxTier: 4,
    maxValueIncrease: 20,
    unlocked: false,
    button: null,
    display: null,
    costs: [
      { wood: 10, fiber: 5 },
      { wood: 20, fiber: 10 },
      { wood: 20, fiber: 20, pelt: 2 },
      { wood: 30, fiber: 20, pelt: 5 },
    ],
  },
  waterStorage: {
    label: "Water Storage",
    resource: "water",
    tier: 0,
    maxTier: 4,
    maxValueIncrease: 10,
    unlocked: false,
    button: null,
    display: null,
    costs: [
      { pelt: 2, fiber: 5 },
      { pelt: 4, fiber: 10, wood: 10 },
      { pelt: 6, fiber: 15, wood: 20 },
      { pelt: 8, fiber: 20, stone: 10 },
    ],
  },
  peltStorage: {
    label: "Pelt Storage",
    resource: "pelt",
    tier: 0,
    maxTier: 4,
    maxValueIncrease: 10,
    unlocked: false,
    button: null,
    display: null,
    costs: [
      { wood: 10, pelt: 2 },
      { wood: 20, pelt: 5 },
      { fiber: 10, pelt: 10 },
      { fiber: 20, pelt: 15, stone: 5 },
    ],
  },
  stoneStorage: {
    label: "Stone Storage",
    resource: "stone",
    tier: 0,
    maxTier: 4,
    maxValueIncrease: 20,
    unlocked: false,
    button: null,
    display: null,
    costs: [
      { wood: 10, stone: 5 },
      { wood: 20, stone: 10 },
      { wood: 20, stone: 20 },
      { wood: 30, stone: 30, pelt: 5 },
    ],
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
    label: "Waterskin (10 Water Capacity)",
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
      wood: 5,
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

  smellyShoes: {
    label: "Smelly Shoes (+50% Travel Distance)",
    cost: {
      pelt: 5,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      refreshExpeditionUI();
    },
  },
};
