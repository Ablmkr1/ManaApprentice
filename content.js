// Expedition Location Definitions
const expeditionLocations = {
  mysteriousPlants: {
    label: "Mysterious Plants",
    exploredLabel: "Fibrous Plants",
    travelAction: "travelToMysteriousPlants",
    distance: 10,
    knownPathDistance: 6,
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
    availableActions: ["gatherFiber", "gatherFiber5"],
  },

  strangeTrails: {
    label: "Strange Trails",
    exploredLabel: "Animal Trails",
    travelAction: "travelToStrangeTrails",
    distance: 30,
    knownPathDistance: 17,
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
      successChance: 0.75,
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
    knownPathDistance: 39,
    discovered: false,
    explored: true,
    onDiscoverStory: "A dark opening cuts into the hillside. Loose stone is scattered around the cave mouth.",
    panelText: {
      discovered: "A dark opening cuts into the hillside. Loose stone is scattered around the cave mouth.",
      explored: "Loose stone litters the cave mouth.",
    },
    availableActions: ["gatherStone"],
    explorableObjects: {
      caveInterior: {
        label: "Explore Cave Interior",
        duration: 2,
        cost: {
          energy: 6,
        },
        progress: 0,
        requires: {
          gearPurchased: ["torch"],
        },
        stages: [
          {
            story:
              "The torchlight reaches farther than your eyes could before. Near the cave wall, you find the remains of moldy food. Someone sheltered here, but not recently.",
          },
          {
            story: "Behind a loose stone, you find an old map marked with paths far beyond the outskirts.",
            unlocks: [
              { type: "flag", id: "oldMapFound" },
              { type: "flag", id: "tier3Unlocked" },
              { type: "region", id: "north" },
              { type: "region", id: "east" },
              { type: "region", id: "south" },
              { type: "region", id: "west" },
              { type: "journal", id: "oldMapFound" },
            ],
          },
          {
            story: "At the back of the cave, your torchlight reveals runes carved into the floor.",
            unlocks: [
              { type: "flag", id: "magicUnlocked" },
              { type: "resource", id: "mana" },
              { type: "journal", id: "manaAwakened" },
              { type: "campUpgrade", id: "meditationSpot" },
            ],
          },
        ],
      },
    },
  },

  mysteriousTrail: {
    label: "Mysterious Trail",
    exploredLabel: "Abandoned Camp",
    distance: 120,
    discovered: false,
    explored: true,
    onDiscoverStory:
      "With the forest near your camp growing familiar you notice something you missed before, a broken branch, a patch of dirt, someone passed through here.",
    panelText: {
      discovered: "The trail ends at the remains of an abandoned camp. The ruined shelter, shredded pack, and washed out fire pit wait in silence.",
      explored: "The abandoned camp sits quiet beneath the trees. Whoever was here was long gone.",
    },
    availableActions: [],
    explorableObjects: {
      washedOutFirePit: {
        label: "Washed Out Fire Pit",
        duration: 1,
        cost: {
          energy: 3,
        },
        progress: 0,
        stages: [
          {
            story: "The fire pit has been washed flat by rain and time. You sift through cold mud and scattered ash, but nothing useful remains.",
          },
        ],
      },

      shreddedPack: {
        label: "Shredded Pack",
        duration: 4,
        cost: {
          energy: 4,
        },
        progress: 0,
        stages: [
          {
            story:
              "The pack is torn almost beyond use, but the stitching and frame are better than anything you've made. Whoever carried this pack knew how to travel.",
            unlocks: [{ type: "gearUpgrade", id: "patchedLeatherBackpack" }],
          },
        ],
      },

      ruinedShelter: {
        label: "Ruined Shelter",
        duration: 1,
        cost: {
          energy: 5,
        },
        progress: 0,
        stages: [
          {
            story: "Beneath the collapsed shelter, you find the remains of a blackened torch.",
            unlocks: [
              { type: "flag", id: "ruinedTorchFound" },
              { type: "journal", id: "ruinedTorchFound" },
            ],
          },
          {
            story:
              "Under a rotten plank, you find scraps of a ruined journal. Most of the pages are gone, but someone else survived here for a while.",
            unlocks: [
              { type: "flag", id: "ruinedJournalFound" },
              { type: "flag", id: "researchUnlocked" },
              { type: "research", id: "ruinedTorch" },
              { type: "journal", id: "ruinedJournalFound" },
            ],
          },
        ],
      },
    },
  },

  stagRuns: {
    region: "east",
    label: "Stag Runs",
    exploredLabel: "Marked Stag Runs",
    distance: 40,
    discovered: false,
    explored: false,
    explorationProgress: 0,
    explorationRequired: 1,
    onDiscoverStory: "Fresh tracks cut through the deepwood. Something larger than rabbits moves through these trees.",
    exploreStory: ["The tracks cross and return in patterns. This is not a single trail, but a place where deer pass often."],
    panelText: {
      discovered: "Fresh tracks cut through the deepwood. Something larger than rabbits moves through these trees.",
      explored: "Heavy tracks mark the undergrowth. This will become useful once you know how to hunt larger game.",
    },
    availableActions: ["trackGame", "huntGame"],
    hunt: {
      tracked: false,
      successChance: 0.65,
      reward: "pelt",
      rewardAmount: 3,
    },
  },

  huntersCabin: {
    region: "east",
    label: "Hunter's Cabin",
    exploredLabel: "Weathered Hunter's Cabin",
    distance: 130,
    storage: {
      pelt: 0,
      leather: 0,
    },
    availableActions: ["storePelt", "takeLeather"],
    discovered: false,
    explored: false,
    explorationProgress: 0,
    explorationRequired: 2,
    onDiscoverStory: "A low cabin sits between old trees, half-hidden by moss and fallen branches.",
    exploreStory: [
      "Inside, stretched hides hang from warped beams.",
      "The old tools are rusted, but the process is clear enough: scrape, soak, stretch, and cure.",
    ],
    panelText: {
      discovered: "A weathered cabin waits in the deepwood. Whoever used it knew how to turn hides into something sturdier.",
      explored: "The cabin's ruined tools have taught you how to process pelts into leather.",
    },
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
    ],
  },

  leatherworking: {
    label: "Leatherworking",
    discovered: false,
    requires: {
      locationsExplored: ["huntersCabin"],
    },
    story: "The cabin's old tools teach you how to scrape, soak, stretch, and cure pelts into stronger leather.",
    unlocks: [
      { type: "resourceCraft", id: "leather" },
      { type: "gearUpgrade", id: "reinforcedWaterskin" },
      { type: "gearUpgrade", id: "repairedLeatherBackpack" },
    ],
  },

  crudeBackpack: {
    label: "Crude Backpack",
    discovered: false,
    requires: {
      recipesDiscovered: ["hideworking"],
      gearPurchased: ["crudeSatchel"],
      resources: {},
    },
    story: "Carrying on your back would make things easier.  You could weave pelts with fibers and keeps the load from spilling.",
    unlocks: [{ type: "gearUpgrade", id: "crudeBackpack" }],
  },

  smellyShoes: {
    label: "Smelly Shoes",
    discovered: false,
    requires: {
      recipesDiscovered: ["hideworking"],
      resources: {},
    },
    story: "Wrapped hide could soften the trail underfoot, even if the smell leaves something to be desired.",
    unlocks: [{ type: "gearUpgrade", id: "smellyShoes" }],
  },

  uncomfortableCot: {
    label: "Uncomfortable Cot",
    discovered: false,
    requires: {
      recipesDiscovered: ["hideworking"],
      resources: {},
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
    story: ["You stumble forward, mind in a daze...", "The forest clears ahead...", "You can rest here."],
    unlocks: [{ type: "panel", id: "camp" }],
    onComplete: function () {
      gameState.discoveredClearing = true;
      setPhase("clearing");
      lockAction("catchBreath");
      updatePlacePanel();
      setCurrentGoal("buildCamp");
      setCampActionsAvailable(true);
    },
    nextStage: "findStream",
  },

  findStream: {
    required: 1,
    story: ["You hear something that makes your thirst grow.", "Your stomach rumbles."],
    unlocks: [],
    onComplete: function () {
      gameState.discoveredStream = true;
      getResource("energy").maxValue += 10;
      updateResource("energy");
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

  meditationSpot: {
    label: "Meditation Spot",
    duration: 10,
    cost: {
      fiber: 12,
      wood: 7,
      pelt: 3,
      stone: 8,
      energy: 10,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      unlockAction("meditate");
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
    displayName: "Crude Satchel",
    equipmentType: "gear",
    slot: "pack",
    slotLabel: "Pack",
    slotOrder: 1,
    slotRank: 1,
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
    displayName: "Waterskin",
    equipmentType: "gear",
    slot: "water",
    slotLabel: "Water",
    slotOrder: 2,
    slotRank: 1,
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

  reinforcedWaterskin: {
    label: "Reinforced Waterskin (25 Water Capacity)",
    displayName: "Reinforced Waterskin",
    equipmentType: "gear",
    slot: "water",
    slotLabel: "Water",
    slotOrder: 2,
    slotRank: 2,
    duration: 8,
    cost: {
      leather: 2,
      fiber: 6,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      gameState.expedition.waterCapacity += 15;

      if (getGearUpgrade("waterskin").display) {
        getGearUpgrade("waterskin").display.style.display = "none";
      }

      refreshExpeditionUI();
    },
  },

  crudeBackpack: {
    label: "Crude Backpack (Inventory 20)",
    displayName: "Crude Backpack",
    equipmentType: "gear",
    slot: "pack",
    slotLabel: "Pack",
    slotOrder: 1,
    slotRank: 2,
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
    displayName: "Smelly Shoes",
    equipmentType: "gear",
    slot: "feet",
    slotLabel: "Feet",
    slotOrder: 3,
    slotRank: 1,
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
    label: "Stone Knife (+1 Fiber)",
    duration: 10,
    displayName: "Stone Knife",
    equipmentType: "tool",
    slot: "knife",
    slotLabel: "Knife",
    slotOrder: 1,
    slotRank: 1,
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
    label: "Stone Axe (+1 Wood)",
    displayName: "Stone Axe",
    equipmentType: "tool",
    slot: "axe",
    slotLabel: "Axe",
    slotOrder: 2,
    slotRank: 1,
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

  patchedLeatherBackpack: {
    label: "Patched Leather Backpack (Inventory 35)",
    displayName: "Patched Backpack",
    equipmentType: "gear",
    slot: "pack",
    slotLabel: "Pack",
    slotOrder: 1,
    slotRank: 3,
    duration: 10,
    cost: {
      pelt: 5,
      fiber: 10,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      gameState.expedition.carryCapacity = 35;

      if (getGearUpgrade("crudeSatchel").display) {
        getGearUpgrade("crudeSatchel").display.style.display = "none";
      }

      if (getGearUpgrade("crudeBackpack").display) {
        getGearUpgrade("crudeBackpack").display.style.display = "none";
      }

      refreshExpeditionUI();
    },
  },

  repairedLeatherBackpack: {
    label: "Repaired Leather Backpack (Inventory 50)",
    displayName: "Leather Backpack",
    equipmentType: "gear",
    slot: "pack",
    slotLabel: "Pack",
    slotOrder: 1,
    slotRank: 4,
    duration: 10,
    cost: {
      leather: 3,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      gameState.expedition.carryCapacity = 50;

      if (getGearUpgrade("crudeSatchel").display) {
        getGearUpgrade("crudeSatchel").display.style.display = "none";
      }

      if (getGearUpgrade("crudeBackpack").display) {
        getGearUpgrade("crudeBackpack").display.style.display = "none";
      }

      refreshExpeditionUI();
    },
  },

  torch: {
    label: "Torch",
    displayName: "Torch",
    equipmentType: "tool",
    slot: "tool",
    slotLabel: "Light",
    slotOrder: 3,
    slotRank: 1,
    duration: 6,
    cost: {
      wood: 5,
      fiber: 4,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      refreshExpeditionUI();
      setCurrentGoal("returnToCave");
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

  leather: {
    label: "Tan Leather",
    requiredLocation: "huntersCabin",
    duration: 2,
    cost: {
      energy: 6,
    },
    storageCost: {
      pelt: 3,
    },
    storageProduces: {
      leather: 1,
    },
    unlocked: false,
    button: null,
  },
};

const researchDefinitions = {
  ruinedTorch: {
    label: "Research Ruined Torch",
    duration: 8,
    cost: {
      energy: 20,
      wood: 5,
      fiber: 8,
    },
    unlocked: false,
    completed: false,
    requires: {
      flags: ["researchUnlocked", "ruinedTorchFound"],
    },
    onComplete() {
      gameState.torchResearched = true;
      unlockGearUpgrade("torch");
      setCurrentGoal("craftTorch");
      addJournalEntry("torchResearched");
    },
  },
};

const goalDefinitions = {
  surviveTheWoods: {
    title: "Survive the Woods",
    text: "Find a place to rest.",
  },
  buildCamp: {
    title: "Build A Camp",
    text: "Secure the essentials for survival. You need food, water, and shelter. You'll need to forge your own safety.",
  },
  exploreOutskirts: {
    title: "Explore The Outskirts",
    text: "Range farther from camp and learn the nearby woods.",
  },
  followTrail: {
    title: "Follow The Unfamiliar Trail",
    text: "A narrow trail leads beyond the paths you know.",
  },
  searchAbandonedCamp: {
    title: "Search The Abandoned Camp",
    text: "Investigate the ruined shelter, shredded pack, and washed out fire pit.",
  },
  researchTorch: {
    title: "Research The Ruined Torch",
    text: "Use the ruined journal to understand the strange torch.",
  },
  craftTorch: {
    title: "Craft A Torch",
    text: "Build a reliable light source before returning to the dark cave.",
  },
  returnToCave: {
    title: "Return To The Cave",
    text: "Bring the torch into the cave and search what the darkness hid.",
  },
  chooseRegion: {
    title: "Choose A Direction",
    text: "The old map shows routes beyond the outskirts. Choose where to search next.",
  },
};

const journalDefinitions = {
  campEstablished: {
    title: "Camp Established",
    text: "The clearing is no longer only where you collapsed. With fire and shelter, it has become a place you can return to.",
  },
  outskirtsMastered: {
    title: "Camp Outskirts Mastered",
    text: "The nearby woods have become familiar. You know the stream crossings, animal paths, exposed roots, and safe ground.",
  },
  abandonedCampFound: {
    title: "Abandoned Camp",
    text: "A narrow trail led to the remains of another camp. Whoever stayed there left behind ruined shelter, a torn pack, and old questions.",
  },
  ruinedTorchFound: {
    title: "Ruined Torch",
    text: "The ruined torch sparked against your hand for a heartbeat. It felt less like learning something new than almost remembering.",
  },
  ruinedJournalFound: {
    title: "Ruined Journal",
    text: "The journal is damaged, but its notes give you a way to study the strange torch properly.",
  },
  torchResearched: {
    title: "Torch Reconstructed",
    text: "The ruined torch was not magical by itself. It was built well enough to hold flame in bad weather, and that is enough to return to the cave.",
  },
  oldMapFound: {
    title: "Old Map",
    text: "The map shows routes far beyond the camp outskirts. The forest around camp is only one small part of a larger wilderness.",
  },
  manaAwakened: {
    title: "Mana Awakened",
    text: "The runes answered something inside you. Mana is not new to you, only forgotten.",
  },
};

//Region Definitions
const regionDefinitions = {
  outskirts: {
    direction: "HOME",
    label: "Camp Outskirts",
    terrain: "Familiar woodland",
    description: "The paths surrounding camp are familiar now. Nearby locations remain useful even as your attention turns outward.",
    maxProgress: 100,
    milestones: [{ at: 100, text: "The camp outskirts are fully explored." }],
  },
  north: {
    direction: "NORTH",
    label: "Northern Reach",
    terrain: "Distant ridges",
    description: "Jagged silhouettes rise beyond the forest. The route is steep, exposed, and still largely unknown.",
    maxProgress: 250,
    milestones: [
      { at: 50, text: "Reach the first foothills." },
      { at: 100, text: "Establish a dependable mountain route." },
      { at: 250, text: "Master the northern route." },
    ],
  },
  east: {
    direction: "EAST",
    label: "Eastern Deepwood",
    terrain: "Dense old forest",
    description: "The trees grow broader and the undergrowth thicker. Tracks vanish beneath roots and shadow.",
    maxProgress: 250,
    milestones: [
      { at: 50, text: "Identify the first reliable game trails." },
      { at: 100, text: "Learn how larger prey moves through the forest." },
      { at: 250, text: "Master the eastern hunting grounds." },
    ],
  },
  south: {
    direction: "SOUTH",
    label: "Southern Overgrowth",
    terrain: "Wild fields",
    description: "Open land lies beneath waist-high growth. Strange scents drift from plants you almost recognize.",
    maxProgress: 250,
    milestones: [
      { at: 50, text: "Catalog the first unfamiliar herbs." },
      { at: 100, text: "Find evidence the fields were once cultivated." },
      { at: 250, text: "Master the southern growing grounds." },
    ],
  },
  west: {
    direction: "WEST",
    label: "Broken Road",
    terrain: "Old stone route",
    description: "Weathered stones and a nearly vanished road continue west beneath moss and fallen branches.",
    maxProgress: 1000,
    milestones: [
      { at: 50, text: "Follow the road to its first marker." },
      { at: 100, text: "Understand how the old markers connect." },
      { at: 250, text: "Master the western road network." },
    ],
  },
};
