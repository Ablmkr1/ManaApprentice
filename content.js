// Clearing Definition
const clearingPlace = {
  label: "Clearing",
  manaSenseReveal: {
    id: "campFoundation",
    story:
      "Mana gathers along lines beneath the camp. For a moment the soil becomes almost transparent to your awareness, and you sense a vast stone foundation buried below the clearing.",
    journal: "campFoundationSensed",
    popup: "campFoundation",
  },
  explorableObjects: {
    soundOfWater: {
      label: "Follow Sound of Water",
      flag: "discoveredStream",
      duration: 1,
      cost: {
        energy: 5,
      },
      progress: 0,
      stages: [
        {
          story: "You follow the sound through the trees and find a narrow stream cutting past the clearing.",
          unlocks: [{ type: "flag", id: "discoveredStream" }],
        },
      ],
      onComplete: function () {
        getResource("energy").maxValue += 10;
        updateResource("energy");
      },
    },

    berryBush: {
      label: "Inspect Berry Bush",
      flag: "discoveredBerryBush",
      duration: 1,
      cost: {
        energy: 5,
      },
      progress: 0,
      stages: [
        {
          story: "Across the stream, a bush hangs heavy with berries. They are bitter, but edible.",
          unlocks: [
            { type: "flag", id: "discoveredBerryBush" },
            { type: "resource", id: "food" },
            { type: "action", id: "gatherFood" },
          ],
        },
      ],
      onComplete: function () {
        getResource("energy").maxValue += 10;
        updateResource("energy");
      },
    },

    deadTree: {
      label: "Search Dead Tree",
      flag: "discoveredDeadfall",
      duration: 1,
      cost: {
        energy: 5,
      },
      progress: 0,
      stages: [
        {
          story: "A dead tree leans at the edge of the clearing. Its fallen branches will make useful firewood.",
          unlocks: [
            { type: "flag", id: "discoveredDeadfall" },
            { type: "resource", id: "wood" },
            { type: "action", id: "gatherWood" },
            { type: "campUpgrade", id: "smallFire" },
            { type: "campUpgrade", id: "crudeLeanTo" },
          ],
        },
      ],
    },
  },
};

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
    unlocks: [{ type: "campUpgrade", id: "researchSpot" }],
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
              { type: "spell", id: "manaSense" },
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

  foothillScree: {
    region: "north",
    label: "Foothill Scree",
    exploredLabel: "Mapped Foothill Scree",
    distance: 45,
    discovered: false,
    explored: false,
    explorationProgress: 0,
    explorationRequired: 1,
    onDiscoverStory: "Loose stone spills down from the first hard slopes of the northern reach.",
    exploreStory: ["The slope is unstable, but the scattered stone is useful and easy enough to pry loose."],
    panelText: {
      discovered: "A field of loose stone marks the beginning of the northern foothills.",
      explored: "Loose stone covers the slope. It is rough work, but useful stone can be gathered here.",
    },
    availableActions: ["gatherStone"],
  },

  minersCamp: {
    region: "north",
    label: "Miners' Camp",
    exploredLabel: "Restored Miners' Camp",
    distance: 135,
    storage: {
      food: 0,
      wood: 0,
      ore: 0,
      iron: 0,
    },
    discovered: false,
    explored: false,
    explorationProgress: 0,
    explorationRequired: 2,
    onDiscoverStory: "A collapsed work camp clings to the lower ridge. A cold stream runs beside rusted tools and broken crates.",
    exploreStory: [
      "The stream is clear and fast, fed by meltwater from higher slopes.",
      "Beneath a leaning shelter, you find the remains of a crude smelter. It might work again with enough fuel and ore.",
    ],
    panelText: {
      discovered: "An old miners' camp sits beside a mountain stream. The place looks abandoned, but useful.",
      explored: "The miners' camp has water, storage, and the remains of a smelter. It could become the northern workshop.",
    },
    availableActions: ["storeWood", "storeOre", "takeIron"],
  },

  ironMine: {
    region: "north",
    label: "Iron Mine",
    exploredLabel: "Iron Mine",
    distance: 250,
    discovered: false,
    explored: false,
    explorationProgress: 0,
    explorationRequired: 2,
    onDiscoverStory: "A dark opening cuts into the northern ridge. Rust-colored veins mark the stone around it.",
    exploreStory: [
      "The mine is shallow near the entrance, but old tool marks score the walls.",
      "Iron-rich stone waits deeper in the dark. You will need a proper pick to make use of it.",
    ],
    panelText: {
      discovered: "A narrow mine cuts into the ridge. The stone is rich with ore, but too hard for bare hands.",
      explored: "Iron veins run through the mine wall. With the right pick, ore can be mined here reliably.",
    },
    availableActions: ["mineOre"],
  },

  wildHerbPatch: {
    region: "south",
    label: "Patch of Strange Plants",
    exploredLabel: "Herb Patch",
    distance: 130,
    discovered: false,
    explored: false,
    explorationProgress: 0,
    explorationRequired: 1,
    onDiscoverStory: "A sharp green scent rises from a patch of unfamiliar plants swaying in the southern growth.",
    exploreStory: ["The leaves bruise easily, releasing a clean, bitter smell. These herbs could be useful if handled carefully."],
    panelText: {
      discovered: "Unfamiliar herbs grow thickly here, bright against the wild grass.",
      explored: "Useful herbs grow in clusters. You can gather them when you visit.",
    },
    availableActions: ["gatherHerbs"],
  },

  alchemistsHut: {
    region: "south",
    label: "Abandoned Hut",
    exploredLabel: "Abandoned Alchemist's Hut",
    distance: 40,
    storage: {
      herb: 0,
    },
    discovered: false,
    explored: false,
    explorationProgress: 0,
    explorationRequired: 2,
    onDiscoverStory: "A crooked hut leans beneath curtains of vine, its windows clouded with greenish glass.",
    exploreStory: [
      "Bundles of dried plants hang from the rafters, too old to use but carefully labeled.",
      "A stained workbench holds cloudy jars, cracked bowls, and notes written in a precise hand. Whoever lived here knew how to draw strength from wild things.",
    ],
    panelText: {
      discovered: "A vine-covered hut waits in the southern overgrowth. Strange scents cling to the air around it.",
      explored: "The abandoned hut has storage, tools, and enough old notes to begin simple alchemy.",
    },
    availableActions: ["storeHerb"],
  },

  roadsideRuin: {
    region: "west",
    label: "Roadside Ruin",
    exploredLabel: "Entrance to Roadside Ruin",
    distance: 40,
    dungeon: "roadsideRuinDepths",
    discovered: false,
    explored: false,
    explorationProgress: 0,
    explorationRequired: 2,
    onDiscoverStory: "The broken road leads to a sunken ruin half-buried beneath moss and fallen stone.",
    exploreStory: [
      "Weathered blocks mark the outline of an old structure beneath the road.",
      "A dark stair descends below the ruin. The air below carries a faint mineral shimmer.",
    ],
    panelText: {
      discovered: "A collapsed ruin sits beside the broken road, its stones too regular to be natural.",
      explored: "The ruin has been mapped from the surface. A dark stair leads deeper underground.",
    },
    availableActions: ["enterDungeon"],
  },
};

//Dungeon Definitions
const dungeonDefinitions = {
  roadsideRuinDepths: {
    label: "Roadside Ruin Depths",
    entryLocation: "roadsideRuin",
    startNode: "entryStair",
    nodes: {
      entryStair: {
        x: 0,
        y: 0,
        label: "Entry Stair",
        description: "A narrow stair descends beneath the broken road. Cold air rises from below.",
        discovered: true,
        explored: true,
        rewardClaimed: false,
        exits: [
          { label: "Follow the cracked hall", to: "crackedHall" },
          { label: "Search the side chamber", to: "sideChamber" },
        ],
      },

      crackedHall: {
        x: 1,
        y: 0,
        label: "Cracked Hall",
        description: "Old stones sag overhead. Faint blue flecks glimmer inside the mortar.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        search: {
          duration: 3,
          baseChance: 30,
          cost: {
            energy: 6,
          },
          successText: "You trace the blue flecks through the cracked mortar and pry loose a small mana crystal.",
          reward: {
            carried: {
              manaCrystal: 1,
            },
          },
        },
        exits: [
          { label: "Return to the entry stair", to: "entryStair" },
          { label: "Approach the collapsed passage", to: "collapsedPassage" },
        ],
      },

      sideChamber: {
        x: 0,
        y: 1,
        label: "Side Chamber",
        description: "Broken shelves line the walls. Most are empty, but crystal dust shines in the cracks.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        search: {
          duration: 7,
          baseChance: 30,
          cost: {
            energy: 8,
          },
          successText: "You search the broken shelves and sweep crystal dust from a hidden niche.",
          reward: {
            carried: {
              manaCrystal: 2,
            },
          },
        },
        exits: [
          { label: "Return to the entry stair", to: "entryStair" },
          { label: "Approach the open door", to: "emptyRoom" },
        ],
      },

      emptyRoom: {
        x: 0,
        y: 2,
        label: "Empty Room",
        description: "Debris cover the floor.  There is too much damage to tell what this room was used for.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        search: {
          duration: 7,
          baseChance: 30,
          cost: {
            energy: 8,
          },
          successText: "You search the broken debris and collect two crystals from under broken furniture.",
          reward: {
            carried: {
              manaCrystal: 2,
            },
          },
        },
        exits: [{ label: "Return to the side chamber", to: "sideChamber" }],
      },

      collapsedPassage: {
        x: 2,
        y: 0,
        label: "Collapsed Passage",
        description: "A fall of stone blocks the way deeper into the ruin.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        requires: {
          gearPurchased: ["crudeIronPick"],
        },
        search: {
          duration: 10,
          baseChance: 30,
          cost: {
            energy: 10,
          },
          successText: "You clear enough fallen stone to understand the passage beyond.",
        },
        exits: [{ label: "Return to the cracked hall", to: "crackedHall" }],
      },
    },
  },
};

// Research Definitions
const researchDefinitions = {
  cordage: {
    label: "Cordage",
    duration: 5,
    completed: false,
    unlocked: false,
    cost: {
      energy: 10,
      fiber: 2,
      focus: 1,
    },
    requires: {
      locationsExplored: ["mysteriousPlants"],
    },
    story: "The fibers are not just plants anymore. Twisted together, they become cordage.",
    unlocks: [
      { type: "gearUpgrade", id: "crudeSatchel" },
      { type: "campUpgrade", id: "lessCrudeShelter" },
      { type: "storageUpgrade", id: "woodStorage" },
      { type: "storageUpgrade", id: "foodStorage" },
      { type: "gearUpgrade", id: "foragingBasket" },
    ],
  },

  simpleTraps: {
    label: "Simple Traps",
    duration: 3,
    completed: false,
    unlocked: false,
    cost: {
      energy: 15,
      fiber: 2,
      wood: 3,
      focus: 1,
    },
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
    duration: 7,
    completed: false,
    unlocked: false,
    cost: {
      energy: 8,
      pelt: 2,
      wood: 3,
      focus: 2,
    },
    requires: {
      researchCompleted: ["simpleTraps"],
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
    duration: 9,
    completed: false,
    unlocked: false,
    cost: {
      energy: 15,
      pelt: 4,
      wood: 3,
      fiber: 2,
      focus: 3,
    },
    requires: {
      locationsExplored: ["huntersCabin"],
    },
    story: "The cabin's old tools teach you how to scrape, soak, stretch, and cure pelts into stronger leather.",
    unlocks: [
      { type: "resourceCraft", id: "leather" },
      { type: "gearUpgrade", id: "reinforcedWaterskin" },
      { type: "gearUpgrade", id: "travelBoots" },
      { type: "gearUpgrade", id: "repairedLeatherBackpack" },
    ],
  },

  crudeBackpack: {
    label: "Crude Backpack",
    duration: 5,
    completed: false,
    unlocked: false,
    cost: {
      energy: 3,
      pelt: 1,
      wood: 3,
      focus: 1,
    },
    requires: {
      researchCompleted: ["hideworking"],
      gearPurchased: ["crudeSatchel"],
      resources: {},
    },
    story: "Carrying on your back would make things easier.  You could weave pelts with fibers and keeps the load from spilling.",
    unlocks: [{ type: "gearUpgrade", id: "crudeBackpack" }],
  },

  smellyShoes: {
    label: "Smelly Shoes",
    duration: 5,
    completed: false,
    unlocked: false,
    cost: {
      energy: 3,
      pelt: 1,
      focus: 1,
    },
    requires: {
      researchCompleted: ["hideworking"],
      resources: {},
    },
    story: "Wrapped hide could soften the trail underfoot, even if the smell leaves something to be desired.",
    unlocks: [{ type: "gearUpgrade", id: "smellyShoes" }],
  },

  scratchyClothes: {
    label: "Scratchy Clothes",
    duration: 5,
    completed: false,
    unlocked: false,
    cost: {
      energy: 15,
      fiber: 2,
      focus: 1,
    },
    requires: {
      gearPurchased: ["crudeSatchel"],
      resources: {},
    },
    story: "Your small woven satchel inspires you. You can weave crude, scratchy clothes.",
    unlocks: [
      { type: "gearUpgrade", id: "scratchyShirt" },
      { type: "gearUpgrade", id: "scratchyPants" },
    ],
  },

  uncomfortableCot: {
    label: "Ugly Cot",
    duration: 5,
    completed: false,
    unlocked: false,
    cost: {
      energy: 3,
      pelt: 1,
      wood: 3,
      focus: 1,
    },
    requires: {
      researchCompleted: ["hideworking"],
      resources: {},
    },
    story: "A raised frame, layered pelts, and enough cordage might make sleep less punishing.",
    unlocks: [{ type: "campUpgrade", id: "uncomfortableCot" }],
  },

  stoneTools: {
    label: "Stone Tools",
    duration: 5,
    completed: false,
    unlocked: false,
    cost: {
      energy: 8,
      stone: 1,
      wood: 1,
      fiber: 1,
      focus: 1,
    },
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

  ruinedTorch: {
    label: "Ruined Torch",
    duration: 8,
    completed: false,
    unlocked: false,
    cost: {
      energy: 20,
      wood: 5,
      fiber: 8,
      focus: 1,
    },
    requires: {
      flags: ["researchUnlocked", "ruinedTorchFound", "ruinedJournalFound"],
    },
    story:
      "The ruined journal gives the torch shape again: bundled pitchwood, tight fiber binding, and enough structure to keep flame alive in the cave damp.",
    unlocks: [
      { type: "flag", id: "torchResearched" },
      { type: "gearUpgrade", id: "torch" },
      { type: "journal", id: "torchResearched" },
      { type: "goal", id: "craftTorch" },
    ],
  },

  smelting: {
    label: "Smelting",
    duration: 5,
    completed: false,
    unlocked: false,
    cost: {
      energy: 8,
      ore: 1,
      wood: 10,
      focus: 3,
    },
    requires: {
      locationsExplored: ["minersCamp"],
    },
    story: "The old smelter is crude, but the shape of the work is clear: ore, fuel, heat, and patience.",
    unlocks: [
      { type: "resourceCraft", id: "iron" },
      { type: "resource", id: "nails" },
      { type: "resourceCraft", id: "nails" },
    ],
  },

  crudeIronPick: {
    label: "Crude Iron Pick",
    duration: 5,
    completed: false,
    unlocked: false,
    cost: {
      energy: 8,
      iron: 1,
      wood: 10,
      focus: 3,
    },
    requires: {
      researchCompleted: ["smelting"],
      resources: {
        iron: 1,
      },
    },
    story: "Iron changes what the northern stone will yield. A crude pick would bite deeper than stone tools ever could.",
    unlocks: [{ type: "gearUpgrade", id: "crudeIronPick" }],
  },

  ironTools: {
    label: "Iron Tools",
    duration: 5,
    completed: false,
    unlocked: false,
    cost: {
      energy: 8,
      iron: 1,
      wood: 10,
      focus: 3,
    },
    requires: {
      researchCompleted: ["smelting", "leatherworking"],
      resources: {},
    },
    story: "Iron and leather together can make better tools.",
    unlocks: [
      { type: "gearUpgrade", id: "ironKnife" },
      { type: "gearUpgrade", id: "ironAxe" },
    ],
  },

  lumberMill: {
    label: "Lumber Mill",
    duration: 5,
    completed: false,
    unlocked: false,
    cost: {
      energy: 8,
      nails: 1,
      wood: 10,
      focus: 3,
    },
    requires: {
      resources: { nails: 1 },
    },
    story: "With iron fasteners and a proper frame, rough logs could be cut into reliable building lumber.",
    unlocks: [{ type: "campUpgrade", id: "lumberMill" }],
  },

  alchemy: {
    label: "Alchemy",
    duration: 5,
    completed: false,
    unlocked: false,
    cost: {
      energy: 8,
      herbs: 10,
      focus: 3,
    },
    requires: {
      locationsExplored: ["alchemistsHut"],
    },
    story: "The alchemist's notes are fragmented, but the pattern is clear: herbs can be prepared into brews that restore what travel spends.",
    unlocks: [
      { type: "resourceCraft", id: "staminaTonic" },
      { type: "gearUpgrade", id: "simpleTonicBelt" },
    ],
  },
  alchemyBelt2: {
    label: "Improved Tonic Belt",
    duration: 5,
    completed: false,
    unlocked: false,
    cost: {
      energy: 8,
      herbs: 10,
      leather: 1,
      focus: 3,
    },
    requires: {
      gearPurchased: ["simpleTonicBelt"],
      researchCompleted: ["leatherworking"],
    },
    story: "This belt could be upgraded further with Leather.",
    unlocks: [{ type: "gearUpgrade", id: "tonicBelt" }],
  },

  alchemyBelt3: {
    label: "Reinforced Tonic Belt",
    duration: 5,
    completed: false,
    unlocked: false,
    cost: {
      energy: 8,
      iron: 1,
      leather: 1,
      focus: 3,
    },
    requires: {
      gearPurchased: ["tonicBelt"],
      researchCompleted: ["smelting", "leatherworking"],
    },
    story: "This belt could be upgraded further with leather and iron.",
    unlocks: [{ type: "gearUpgrade", id: "reinforcedTonicBelt" }],
  },

  meditation: {
    label: "Meditation",
    duration: 8,
    completed: false,
    unlocked: false,
    cost: {
      energy: 20,
      focus: 3,
      manaCrystal: 1,
    },
    requires: {
      resources: {
        manaCrystal: 1,
      },
    },
    story:
      "The crystal hums with the same quiet pressure as the cave runes. With the right place prepared, you could recover mana without returning underground.",
    unlocks: [{ type: "campUpgrade", id: "meditationSpot" }],
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
    nextStage: null,
  },
};

// Camp Upgrade Definitions
const campUpgrades = {
  smallFire: {
    label: "Small Fire",
    displayName: "Small fire",
    campSlot: "fire",
    campSlotLabel: "Fire",
    campSlotOrder: 1,
    campSlotRank: 1,
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
    displayName: "Crude Lean-To",
    campSlot: "shelter",
    campSlotLabel: "Shelter",
    campSlotOrder: 2,
    campSlotRank: 1,
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
    displayName: "Less Crude Shelter",
    campSlot: "shelter",
    campSlotLabel: "Shelter",
    campSlotOrder: 2,
    campSlotRank: 2,
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
    },
  },

  uncomfortableCot: {
    label: "Ugly Cot",
    displayName: "Ugly Cot",
    campSlot: "rest",
    campSlotLabel: "Rest",
    campSlotOrder: 3,
    campSlotRank: 1,
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
    displayName: "Stone Fire Pit",
    campSlot: "fire",
    campSlotLabel: "Fire",
    campSlotOrder: 1,
    campSlotRank: 2,
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
    },
  },

  researchSpot: {
    label: "Research Spot",
    displayName: "Research Spot",
    campSlot: "research",
    campSlotLabel: "Research",
    campSlotOrder: 4,
    campSlotRank: 1,
    duration: 1,
    cost: {
      energy: 1,
      focus: 1,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {},
  },

  meditationSpot: {
    label: "Meditation Spot",
    displayName: "Meditation Spot",
    campSlot: "meditation",
    campSlotLabel: "Meditation",
    campSlotOrder: 5,
    campSlotRank: 1,
    duration: 10,
    cost: {
      stone: 8,
      manaCrystal: 4,
      focus: 1,
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

  lumberMill: {
    label: "Lumber Mill",
    displayName: "Lumber Mill",
    campSlot: "mill",
    campSlotLabel: "Mill",
    campSlotOrder: 6,
    campSlotRank: 1,
    duration: 12,
    cost: {
      nails: 20,
      wood: 40,
      iron: 3,
      energy: 100,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      unlockResource("lumber");
      unlockResourceCraft("lumber");

      getResource("wood").maxValue = 500;
      getResource("lumber").maxValue = 500;
      updateResource("wood");
      updateResource("lumber");
      updateCampResourcesSectionVisibility();
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
    maxValueIncrease: 100,
    tierNames: ["Wood Pile", "Covered Woodpile", "Lumber Rack", "Storage Yard"],
    unlocked: false,
    button: null,
    display: null,
    costs: [
      { wood: 10, iron: 5, energy: 10 },
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
      { fiber: 10, iron: 5 },
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
      { wood: 10, iron: 5, energy: 10 },
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
      { wood: 2, iron: 5, energy: 20 },
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
      { wood: 10, iron: 2, energy: 20 },
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
      { wood: 10, iron: 5, energy: 20 },
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
      fiber: 7,
      energy: 7,
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
  scratchyShirt: {
    label: "Scratchy Shirt",
    displayName: "Scratchy Shirt",
    equipmentType: "gear",
    slot: "chest",
    slotLabel: "Chest",
    slotOrder: 4,
    slotRank: 1,
    duration: 5,
    cost: {
      fiber: 8,
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
  scratchyPants: {
    label: "Scratchy Pants",
    displayName: "Scratchy Pants",
    equipmentType: "gear",
    slot: "legs",
    slotLabel: "Legs",
    slotOrder: 5,
    slotRank: 1,
    duration: 5,
    cost: {
      fiber: 12,
      energy: 12,
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

  foragingBasket: {
    label: "Foraging Basket (+1 Food)",
    displayName: "Foraging Basket",
    equipmentType: "tool",
    slot: "forage",
    slotLabel: "Foraging",
    slotOrder: 0,
    slotRank: 1,
    duration: 5,
    cost: {
      fiber: 6,
      wood: 2,
      energy: 8,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      getResource("food").perClick += 1;
      updateResource("food");
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
      energy: 30,
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
      pelt: 4,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      refreshExpeditionUI();
    },
  },

  travelBoots: {
    label: "Travel Boots (+100% Travel Distance)",
    displayName: "Travel Boots",
    equipmentType: "gear",
    slot: "feet",
    slotLabel: "Feet",
    slotOrder: 3,
    slotRank: 2,
    duration: 7,
    cost: {
      leather: 4,
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
    label: "Stone Knife (+1)",
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

  ironKnife: {
    label: "Iron Knife (+2)",
    duration: 15,
    displayName: "Iron Knife",
    equipmentType: "tool",
    slot: "knife",
    slotLabel: "Knife",
    slotOrder: 1,
    slotRank: 2,
    cost: {
      leather: 1,
      iron: 1,
      energy: 30,
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
    label: "Stone Axe (+1)",
    displayName: "Stone Axe",
    equipmentType: "tool",
    slot: "axe",
    slotLabel: "Axe",
    slotOrder: 2,
    slotRank: 1,
    duration: 10,
    cost: {
      pelt: 2,
      fiber: 1,
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

  ironAxe: {
    label: "Iron Axe (+2)",
    displayName: "Iron Axe",
    equipmentType: "tool",
    slot: "axe",
    slotLabel: "Axe",
    slotOrder: 2,
    slotRank: 2,
    duration: 15,
    cost: {
      leather: 2,
      wood: 5,
      iron: 3,
      energy: 40,
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
      energy: 20,
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
      wood: 2,
      fiber: 3,
      energy: 45,
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
    slotOrder: 4,
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

  crudeIronPick: {
    label: "Crude Iron Pick",
    displayName: "Crude Iron Pick",
    equipmentType: "tool",
    slot: "pick",
    slotLabel: "Pick",
    slotOrder: 3,
    slotRank: 1,
    duration: 15,
    cost: {
      wood: 5,
      iron: 3,
      fiber: 2,
      energy: 15,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {},
  },

  simpleTonicBelt: {
    label: "Simple Tonic Belt (1 Tonic)",
    displayName: "Simple Tonic Belt",
    equipmentType: "gear",
    slot: "belt",
    slotLabel: "Belt",
    slotOrder: 4,
    slotRank: 1,
    duration: 8,
    cost: {
      pelt: 5,
      fiber: 2,
      energy: 30,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      gameState.expedition.tonicSlots = [null];
      refreshExpeditionUI();
      updateEquipmentSlotUI();
    },
  },

  tonicBelt: {
    label: "Tonic Belt (2 Tonics)",
    displayName: "Tonic Belt",
    equipmentType: "gear",
    slot: "belt",
    slotLabel: "Belt",
    slotOrder: 4,
    slotRank: 2,
    duration: 10,
    cost: {
      leather: 2,
      energy: 50,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      gameState.expedition.tonicSlots = gameState.expedition.tonicSlots || [];

      while (gameState.expedition.tonicSlots.length < 2) {
        gameState.expedition.tonicSlots.push(null);
      }

      refreshExpeditionUI();
      updateEquipmentSlotUI();
    },
  },

  reinforcedTonicBelt: {
    label: "Reinforced Tonic Belt (3 Tonics)",
    displayName: "Reinforced Tonic Belt",
    equipmentType: "gear",
    slot: "belt",
    slotLabel: "Belt",
    slotOrder: 4,
    slotRank: 3,
    duration: 12,
    cost: {
      leather: 3,
      iron: 1,
      energy: 60,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      gameState.expedition.tonicSlots = gameState.expedition.tonicSlots || [];

      while (gameState.expedition.tonicSlots.length < 3) {
        gameState.expedition.tonicSlots.push(null);
      }

      refreshExpeditionUI();
      updateEquipmentSlotUI();
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
  iron: {
    label: "Smelt Iron",
    requiredLocation: "minersCamp",
    duration: 4,
    cost: {
      energy: 8,
    },
    storageCost: {
      ore: 3,
      wood: 5,
    },
    storageProduces: {
      iron: 1,
    },
    unlocked: false,
    button: null,
  },
  nails: {
    label: "Forge Nails",
    duration: 2,
    cost: {
      energy: 4,
      iron: 1,
    },
    produces: {
      resource: "nails",
      amount: 10,
    },
    unlocked: false,
    button: null,
  },
  lumber: {
    label: "Saw Lumber",
    duration: 2,
    cost: {
      energy: 4,
      wood: 2,
    },
    produces: {
      resource: "lumber",
      amount: 1,
    },
    auto: true,
    unlocked: false,
    button: null,
  },
  staminaTonic: {
    label: "Brew Stamina Tonic",
    requiredLocation: "alchemistsHut",
    duration: 4,
    cost: {
      energy: 15,
      mana: 10,
    },
    storageCost: {
      herb: 25,
    },
    producesConsumable: {
      resource: "staminaTonic",
      amount: 1,
    },
    unlocked: false,
    button: null,
  },
};

const consumables = {
  staminaTonic: {
    label: "Stamina Tonic",
    carriedItem: "staminaTonic",
    effectText: "You drink a bitter tonic and feel strength return.",
    use() {
      addResource("energy", 20);
      updateResource("energy");
    },
  },
};

const spellDefinitions = {
  manaSense: {
    label: "Mana Sense",
    unlockFlag: "magicUnlocked",
    duration: 1,
    unlocked: false,
    cost: {
      mana: 1,
    },
    effects: {
      dungeonSearchBonus: 25,
      maxDungeonCharges: 3,
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
    items: [
      {
        label: "Find food",
        isComplete: function () {
          return gameState.discoveredBerryBush;
        },
      },
      {
        label: "Find water",
        isComplete: function () {
          return gameState.discoveredStream;
        },
      },
      {
        label: "Make fire",
        isComplete: function () {
          return hasPurchasedCampUpgrade("smallFire");
        },
      },
      {
        label: "Make shelter",
        isComplete: function () {
          return hasPurchasedCampUpgrade("crudeLeanTo");
        },
      },
    ],
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
  campFoundationSensed: {
    title: "Buried Foundation",
    text: "Mana Sense revealed a large stone foundation beneath camp. It feels deliberate, old, and far too large for a simple shelter.",
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
    maxProgress: 250,
    milestones: [
      { at: 50, text: "Follow the road to its first marker." },
      { at: 100, text: "Understand how the old markers connect." },
      { at: 250, text: "Master the western road network." },
    ],
  },
};
