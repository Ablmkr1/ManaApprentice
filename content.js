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

//Recepies Definitions
const recipes = {
  cordage: {
    label: "Cordage",
    discovered: false,
    requires: {
      locationsExplored: ["mysteriousPlants"],
    },
    story: "The fibers are not just plants anymore. Twisted together, they become cordage.",
    unlocks: [
      { type: "gearUpgrade", id: "crudeSatchel" },
      { type: "campUpgrade", id: "lessCrudeShelter" },
      { type: "storageUpgrade", id: "woodStorage" },
      { type: "storageUpgrade", id: "foodStorage" },
    ],
  },

  simpleTraps: {
    label: "Simple Traps",
    discovered: false,
    requires: {
      locationsExplored: ["strangeTrails"],
    },
    story: "The animal trails suggest a crude design: bait, tension, and patience.",
    unlocks: [
      { type: "resource", id: "trap" },
      { type: "resourceCraft", id: "trap" },
      { type: "action", id: "scoutTrapSite" },
    ],
  },

  hideworking: {
    label: "Hideworking",
    discovered: false,
    requires: {
      recipesDiscovered: ["simpleTraps"],
      resources: {
        pelt: 1,
      },
    },
    story: "The pelt can be more than a trophy. Scraped, stretched, and sealed, it might carry water or protect supplies.",
    unlocks: [
      { type: "gearUpgrade", id: "waterskin" },
      { type: "storageUpgrade", id: "peltStorage" },
      { type: "storageUpgrade", id: "waterStorage" },
    ],
  },

  crudeBackpack: {
    label: "Crude Backpack",
    discovered: false,
    requires: {
      recipesDiscovered: ["hideworking"],
      resources: {
        pelt: 6,
        fiber: 10,
        wood: 5,
      },
    },
    story: "Carrying on your back would make things easier.  You could weave pelts with fibers and keeps the load from spilling.",
    unlocks: [{ type: "gearUpgrade", id: "crudeBackpack" }],
  },

  smellyShoes: {
    label: "Smelly Shoes",
    discovered: false,
    requires: {
      recipesDiscovered: ["hideworking"],
      resources: {
        pelt: 5,
      },
    },
    story: "Wrapped hide could soften the trail underfoot, even if the smell leaves something to be desired.",
    unlocks: [{ type: "gearUpgrade", id: "smellyShoes" }],
  },

  uncomfortableCot: {
    label: "Uncomfortable Cot",
    discovered: false,
    requires: {
      recipesDiscovered: ["hideworking"],
      resources: {
        pelt: 5,
        fiber: 10,
        wood: 10,
      },
    },
    story: "A raised frame, layered pelts, and enough cordage might make sleep less punishing.",
    unlocks: [{ type: "campUpgrade", id: "uncomfortableCot" }],
  },

  stoneTools: {
    label: "Stone Tools",
    discovered: false,
    requires: {
      resources: {
        stone: 1,
      },
    },
    story: "A sharp edge changes what your hands can do. Stone, fiber, and patience become tools.",
    unlocks: [
      { type: "gearUpgrade", id: "stoneKnife" },
      { type: "gearUpgrade", id: "stoneAxe" },
    ],
  },
};

// Exploration Definitions
const explorationStages = {
  findClearing: {
    required: 1,
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
    required: 1,
    story: ["You hear something that makes your thirst grow.", "Your stomach rumbles."],
    unlocks: [
      { type: "resource", id: "water" },
      { type: "action", id: "gatherWater" },
    ],
    onComplete: function () {
      gameState.discoveredStream = true;
      getResource("energy").maxValue += 10;
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
      getResource("energy").maxValue += 10;
      updateResource("energy");
    },
    nextStage: "findWoodPile",
  },
  findWoodPile: {
    required: 1,
    story: ["Huh, it's a stick?", "Even more sticks, if you collected them you might be able to use them."],
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

// Camp Upgrade Definitions
const campUpgrades = {
  smallFire: {
    label: "Small Fire",
    duration: 3,
    cost: {
      wood: 5,
      energy: 10,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      getResource("energy").restPerSecond++;
    },
  },
  crudeLeanTo: {
    label: "Crude Lean-To",
    duration: 4,
    cost: {
      wood: 10,
      energy: 8,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      getResource("energy").maxValue += 10;
      updateResource("energy");
    },
  },
  lessCrudeShelter: {
    label: "Less Crude Shelter",
    duration: 6,
    cost: {
      wood: 10,
      fiber: 10,
      energy: 16,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      getResource("energy").restPerSecond += 1;

      if (getCampUpgrade("crudeLeanTo").display) {
        getCampUpgrade("crudeLeanTo").display.style.display = "none";
      }
    },
  },

  uncomfortableCot: {
    label: "Uncomfortable Cot",
    duration: 5,
    cost: {
      wood: 10,
      fiber: 10,
      pelt: 5,
      energy: 8,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      getResource("energy").maxValue += 20;
      updateResource("energy");
    },
  },
  stoneFirePit: {
    label: "Stone Fire Pit",
    duration: 6,
    cost: {
      wood: 10,
      stone: 10,
      energy: 20,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      getResource("energy").maxValue += 20;
      updateResource("energy");

      if (getCampUpgrade("smallFire").display) {
        getCampUpgrade("smallFire").display.style.display = "none";
      }
    },
  },

  packedStoneFloor: {
    label: "Packed Stone Floor",
    duration: 15,
    cost: {
      wood: 10,
      stone: 20,
      energy: 60,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      getResource("energy").maxValue += 20;
      updateResource("energy");
    },
  },
};

// Camp Storage Upgrade Defintions
const storageUpgrades = {
  woodStorage: {
    label: "Wood Storage",
    resource: "wood",
    duration: 5,
    tier: 0,
    maxTier: 4,
    maxValueIncrease: 20,
    tierNames: ["Wood Pile", "Covered Woodpile", "Lumber Rack", "Storage Yard"],
    unlocked: false,
    button: null,
    display: null,
    costs: [
      { wood: 10, fiber: 5, energy: 10 },
      { wood: 20, fiber: 20, energy: 20 },
      { wood: 30, stone: 10, energy: 50 },
      { wood: 40, stone: 20, energy: 75 },
    ],
  },
  foodStorage: {
    label: "Food Storage",
    resource: "food",
    duration: 5,
    tier: 0,
    maxTier: 4,
    maxValueIncrease: 10,
    tierNames: ["Food Basket", "Pantry", "Smokehouse", "Root Cellar"],
    unlocked: false,
    button: null,
    display: null,
    costs: [
      { fiber: 10, energy: 5 },
      { wood: 20, fiber: 5, energy: 20 },
      { wood: 20, fiber: 10, stone: 2, energy: 45 },
      { wood: 30, fiber: 10, stone: 5, energy: 50 },
    ],
  },
  fiberStorage: {
    label: "Fiber Storage",
    resource: "fiber",
    duration: 5,
    tier: 0,
    maxTier: 4,
    maxValueIncrease: 20,
    tierNames: ["Fiber Bundle", "Fiber Rack", "Cordage Rack", "Weaving Shed"],
    unlocked: false,
    button: null,
    display: null,
    costs: [
      { wood: 10, fiber: 5, energy: 10 },
      { wood: 20, fiber: 10, energy: 20 },
      { wood: 20, fiber: 20, pelt: 2, energy: 20 },
      { wood: 30, fiber: 20, pelt: 5, energy: 20 },
    ],
  },
  waterStorage: {
    label: "Water Storage",
    resource: "water",
    duration: 5,
    tier: 0,
    maxTier: 4,
    maxValueIncrease: 10,
    tierNames: ["Water Bucket", "Water Barrel", "Cistern", "Well"],
    unlocked: false,
    button: null,
    display: null,
    costs: [
      { wood: 2, fiber: 5, energy: 20 },
      { fiber: 10, wood: 20, energy: 20 },
      { stone: 6, wood: 20, energy: 20 },
      { wood: 20, stone: 30, energy: 80 },
    ],
  },
  peltStorage: {
    label: "Pelt Storage",
    resource: "pelt",
    duration: 5,
    tier: 0,
    maxTier: 4,
    maxValueIncrease: 10,
    tierNames: ["Pelt Bundle", "Drying Frame", "Tanning Rack", "Hide Shed"],
    unlocked: false,
    button: null,
    display: null,
    costs: [
      { wood: 10, pelt: 2, energy: 20 },
      { wood: 20, pelt: 5, energy: 20 },
      { fiber: 10, pelt: 10, energy: 20 },
      { fiber: 20, pelt: 15, stone: 5, energy: 20 },
    ],
  },
  stoneStorage: {
    label: "Stone Storage",
    resource: "stone",
    duration: 5,
    tier: 0,
    maxTier: 4,
    maxValueIncrease: 20,
    tierNames: ["Stone Pile", "Reinforced Stone Stack", "Mason's Yard", "Stone Depot"],
    unlocked: false,
    button: null,
    display: null,
    costs: [
      { wood: 10, stone: 5, energy: 20 },
      { wood: 20, stone: 10, energy: 20 },
      { wood: 20, stone: 20, energy: 20 },
      { wood: 30, stone: 30, pelt: 5, energy: 20 },
    ],
  },
};

//Player Gear System
const gearUpgrades = {
  crudeSatchel: {
    label: "Crude Satchel (10 Inventory)",
    duration: 5,
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
    duration: 6,
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
    duration: 10,
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

      if (getGearUpgrade("crudeSatchel").display) {
        getGearUpgrade("crudeSatchel").display.style.display = "none";
      }

      refreshExpeditionUI();
    },
  },

  smellyShoes: {
    label: "Smelly Shoes (+50% Travel Distance)",
    duration: 7,
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

  stoneKnife: {
    label: "Stone Knife",
    duration: 10,
    cost: {
      pelt: 1,
      fiber: 2,
      stone: 1,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      getResource("fiber").perClick += 1;
      refreshExpeditionUI();
    },
  },

  stoneAxe: {
    label: "Stone Axe",
    duration: 10,
    cost: {
      pelt: 2,
      fiber: 2,
      stone: 2,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      getResource("wood").perClick += 1;
      refreshExpeditionUI();
    },
  },
};

const resourceCrafts = {
  trap: {
    label: "Trap",
    duration: 1,
    cost: {
      energy: 10,
      wood: 2,
      fiber: 5,
    },
    produces: {
      resource: "trap",
      amount: 1,
    },
    unlocked: false,
    button: null,
  },
};
