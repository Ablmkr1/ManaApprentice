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
        recalculateCharacterStats();
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
        recalculateCharacterStats();
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
    availableActions: ["gatherFiber"],
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
        deepThought: 5,
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
              { type: "research", id: "salvagedSheltercraft" },
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

  quietGrove: {
    region: "east",
    label: "Quiet Grove",
    exploredLabel: "Quiet Grove",
    distance: 250,
    discovered: false,
    explored: false,
    explorationProgress: 0,
    explorationRequired: 2,
    onDiscoverStory:
      "The deepwood opens into a still grove. The tracks here are too light for their size, as if something large barely touched the earth.",
    exploreStory: [
      "Silver scratches mark the bark at shoulder height. Whatever made them moved with impossible grace.",
      "You glimpse a stag between the trees, its antlers bright as glass. Mana bends around it, then settles before you can understand how.",
    ],
    panelText: {
      discovered: "A still grove waits deep in the eastern forest. Something magical moves here.",
      explored: "The grove is quiet, but the glass-antler stag returns when you wait and watch.",
    },
    availableActions: [],
    explorableObjects: {
      observeGlassAntlerStag: {
        label: "Observe Glass-Antler Stag",
        duration: 3,
        cost: {
          energy: 8,
        },
        deepThought: 5,
        progress: 0,
        spellCharges: {},
        spellInteractions: {
          manaSense: {
            required: 3,
            stories: [
              "Mana Sense catches the faint path of force through the stag's legs.",
              "The pattern returns around its hide, brief and protective.",
              "The shape is clearer now. The stag is not changing itself; it is emphasizing what is already there.",
            ],
          },
        },
        requires: {
          locationsExplored: ["quietGrove"],
          spellCharges: {
            manaSense: 3,
          },
        },
        stages: [
          {
            story:
              "The stag steps across soft moss without sinking into it. Mana gathers in its legs, not changing them, only making their natural grace sharper.",
          },
          {
            story:
              "A branch falls nearby. The stag's hide flashes with pale light for a heartbeat, turning the impact aside before fading back to ordinary fur.",
          },
          {
            story:
              "You follow the pattern with your own mana and feel it answer through your equipment. The lesson is clear: mana can strengthen what is already there.",
            unlocks: [
              { type: "spell", id: "attunement" },
              { type: "journal", id: "attunementLearned" },
            ],
          },
        ],
      },
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
    explorableObjects: {
      studySmelterHeat: {
        label: "Study Smelter Heat",
        duration: 3,
        cost: {
          energy: 8,
        },
        deepThought: 5,
        progress: 0,
        spellCharges: {},
        spellInteractions: {
          manaSense: {
            required: 3,
            stories: [
              "Mana Sense settles over the cold smelter. The old stones remember heat, but not ordinary flame.",
              "The smelter's shape guides pressure as much as fire. Mana could hold iron soft without letting it collapse.",
              "The pattern becomes clear: heat, force, and restraint braided tightly enough to shape metal by will.",
            ],
          },
        },
        requires: {
          locationsExplored: ["minersCamp"],
          spellCharges: {
            manaSense: 3,
          },
        },
        stages: [
          {
            story:
              "You study the smelter's remembered pressure until the lesson catches in your hands. Iron can be persuaded, not merely hammered.",
            unlocks: [
              { type: "spell", id: "arcaneForce" },
              { type: "journal", id: "arcaneForceLearned" },
            ],
          },
        ],
      },
    },
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
      glimmerleaf: 0,
      staminaTonicBase: 0,
      manaTonicBase: 0,
      concentratedTonicBase: 0,
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
    availableActions: ["storeHerb", "storeGlimmerleaf", "concentrateTonicBase"],
    explorableObjects: {
      studyInfusionPattern: {
        label: "Study Infusion Pattern",
        duration: 3,
        cost: {
          energy: 8,
        },
        deepThought: 5,
        progress: 0,
        spellCharges: {},
        spellInteractions: {
          manaSense: {
            required: 3,
            stories: [
              "Mana Sense settles over the stained bowls. The old residue holds a pattern, faint but deliberate.",
              "The notes make more sense now: herbs provide the shape, but mana fixes the effect into the brew.",
              "The final step is clear. A tonic is not finished until mana is bound into the prepared base.",
            ],
          },
        },
        requires: {
          locationsDiscovered: ["alchemistsHut"],
          spellCharges: {
            manaSense: 3,
          },
        },
        stages: [
          {
            story:
              "You trace the infusion pattern from bowl to note to old stain. Mana can be held inside prepared matter, waiting for the right moment to release.",
            unlocks: [
              { type: "spell", id: "imbue" },
              { type: "journal", id: "imbueLearned" },
            ],
          },
        ],
      },
    },
  },

  overgrownFields: {
    region: "south",
    label: "Overgrown Fields",
    exploredLabel: "Overgrown Fields",
    distance: 250,
    discovered: false,
    explored: false,
    explorationProgress: 0,
    explorationRequired: 2,
    onDiscoverStory: "The southern growth opens into old fields, their rows almost erased beneath waist-high green.",
    exploreStory: [
      "Beneath the weeds, the ground still rises in long, deliberate rows. This place was cultivated before it was abandoned.",
      "Tiny silver-veined leaves shimmer among the ordinary growth. They hold a cool pressure that feels almost like mana.",
    ],
    panelText: {
      discovered: "Old cultivated fields lie buried beneath the overgrowth. The plants here seem less wild than unsupervised.",
      explored: "Glimmerleaf grows in the abandoned rows. It is rare, but careful gathering can preserve it.",
    },
    availableActions: ["gatherGlimmerleaf"],
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

  silentGearworks: {
    region: "west",
    label: "Silent Gearworks",
    exploredLabel: "Silent Gearworks",
    distance: 140,
    dungeon: "silentGearworksDepths",
    discovered: false,
    explored: false,
    explorationProgress: 0,
    explorationRequired: 2,
    onDiscoverStory:
      "The broken road passes a low stone building sunk into the hillside. No smoke rises from it, but something inside waits with patient precision.",
    exploreStory: [
      "The outer stones are fitted too tightly for age to loosen them.",
      "Past the cracked threshold, silent mechanisms sit in rows. They look less abandoned than asleep.",
    ],
    panelText: {
      discovered: "A low ruin waits beside the broken road. The air near it feels organized, like a held breath.",
      explored: "The gearworks entrance is clear. Old mechanisms wait below, still enough to study.",
    },
    availableActions: ["enterDungeon"],
  },

  arcaneArchive: {
    region: "west",
    label: "Arcane Archive",
    exploredLabel: "Arcane Archive",
    distance: 250,
    dungeon: "arcaneArchiveDepths",
    dungeonUnlockedFlag: "archiveDoorOpened",
    discovered: false,
    explored: false,
    explorationProgress: 0,
    explorationRequired: 3,
    onDiscoverStory:
      "The broken road ends at a low, windowless building of pale stone. Its single door is sealed beneath four overlapping patterns of mana.",
    exploreStory: [
      "The archive walls are nearly seamless. Even the moss seems reluctant to cling to them.",
      "A ring of old script surrounds the door. Each section answers to a different shape of magic.",
      "The seal is not a lock so much as a question. Mana Sense, Arcane Force, Imbue, and Attunement will all be needed to answer it.",
    ],
    panelText: {
      discovered: "A pale stone archive waits at the end of the western road. Its door is sealed by old magic.",
      explored: "The archive door waits under four linked spell-patterns. Opening it will take a complete ritual in one visit.",
    },
    availableActions: ["enterDungeon"],
    explorableObjects: {
      sealedArchiveDoor: {
        label: "Open Archive Door",
        duration: 5,
        cost: {
          energy: 12,
        },
        progress: 0,
        flag: "archiveDoorOpened",
        resetSpellChargesOnLeave: true,
        spellCharges: {},
        spellInteractions: {
          manaSense: {
            required: 1,
            cost: { mana: 1 },
            duration: 1,
            stories: ["Mana Sense finds the first shape of the seal: meaning, not mechanism."],
          },
          arcaneForce: {
            required: 1,
            cost: { mana: 4 },
            duration: 3,
            stories: ["Arcane Force presses through the door's inner hinge until the old metal remembers how to move."],
          },
          imbue: {
            required: 1,
            cost: { mana: 5 },
            duration: 2,
            stories: ["Imbue settles into the repaired channel, leaving mana held inside the seal instead of sliding off its surface."],
          },
          attunement: {
            required: 1,
            cost: { mana: 4 },
            duration: 2,
            stories: ["Attunement lets your hands match the door's weight. The final ring turns beneath your palms."],
          },
        },
        requires: {
          locationsExplored: ["arcaneArchive"],
          resourceMaximums: {
            mana: 14,
          },
          spellCharges: {
            manaSense: 1,
            arcaneForce: 1,
            imbue: 1,
            attunement: 1,
          },
        },
        stages: [
          {
            story: "The four spell-patterns align. The archive door opens inward without a sound.",
            unlocks: [
              { type: "flag", id: "archiveDoorOpened" },
              { type: "journal", id: "arcaneArchiveOpened" },
            ],
          },
        ],
      },
    },
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
        exits: [
          { label: "Return to the cracked hall", to: "crackedHall" },
          { label: "Enter the crystal alcove", to: "crystalBindingAlcove" },
        ],
      },

      crystalBindingAlcove: {
        x: 3,
        y: 0,
        label: "Crystal Binding Alcove",
        description: "The passage opens into an intact alcove. Crystal facets line the stone like a diagram of pressure and patience.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        search: {
          duration: 10,
          baseChance: 30,
          cost: {
            energy: 10,
          },
          successText: "You study the facets until the pattern resolves: enough mana can be compressed into a stable crystal lattice.",
          deepThought: 3,
          reward: {
            unlocks: [
              { type: "flag", id: "manaCrystalImbuingUnlocked" },
              { type: "journal", id: "manaCrystalImbuingUnlocked" },
            ],
          },
        },
        exits: [{ label: "Return to the collapsed passage", to: "collapsedPassage" }],
      },
    },
  },

  silentGearworksDepths: {
    label: "Silent Gearworks Depths",
    entryLocation: "silentGearworks",
    startNode: "entryGallery",
    nodes: {
      entryGallery: {
        x: 0,
        y: 1,
        label: "Entry Gallery",
        description: "Stone benches line the room. Brass tracks run through the floor and vanish beneath sealed doors.",
        discovered: true,
        explored: true,
        rewardClaimed: false,
        exits: [{ label: "Follow the brass tracks", to: "cycleHall" }],
      },

      cycleHall: {
        x: 1,
        y: 1,
        label: "Cycle Hall",
        description: "Small gearframes sit motionless along the wall, each built to repeat a single task.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        search: {
          duration: 6,
          baseChance: 45,
          cost: { energy: 8 },
          successText: "You trace the repeated motion of the old frames: task, rhythm, reset.",
        },
        exits: [
          { label: "Return to the entry gallery", to: "entryGallery" },

          { label: "Follow the conveyor", to: "conveyorGallery" },
          { label: "Enter the gear nest", to: "gearNest" },
        ],
      },

      gaugeRoom: {
        x: 2,
        y: 2,
        label: "Gauge Room",
        description: "Cracked dials cover the walls. A few needles still twitch when mana stirs nearby.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        search: {
          duration: 7,
          baseChance: 40,
          cost: { energy: 8 },
          successText: "Behind a broken dial, you find a small crystal still holding a faint charge.",
          reward: { carried: { manaCrystal: 1 } },
        },
        exits: [
          { label: "Follow the pressure lines", to: "manaReservoir" },
          { label: "Return through the gear nest", to: "gearNest" },
        ],
      },

      manaReservoir: {
        x: 3,
        y: 2,
        label: "Mana Reservoir",
        description: "A dry basin of etched stone waits beneath glass tubes and corroded valves.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        spellCharges: {},
        spellInteractions: {
          arcaneForce: {
            required: 1,
            requiredForceLevel: 2,
            cost: { mana: 4 },
            duration: 2,
            stories: ["Arcane Force turns the cracked valve ring one hard notch. The reservoir path opens with a dry groan."],
          },
        },
        requires: {
          spellCharges: {
            arcaneForce: 1,
          },
        },
        search: {
          duration: 9,
          baseChance: 35,
          cost: { energy: 10 },
          successText: "You pry loose two crystals from the reservoir housing.",
          reward: { carried: { manaCrystal: 2 } },
        },
        exits: [
          { label: "Return to the gauge room", to: "gaugeRoom" },
          { label: "A small passage appears ahead", to: "smallPassage" },
        ],
      },

      smallPassage: {
        x: 4,
        y: 2,
        label: "Small Passage",
        description: "A small passage behind a ruined portrait.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        search: {
          duration: 9,
          baseChance: 75,
          cost: { energy: 5 },
          successText: "A crystal is on the floor of the passage.",
          reward: { carried: { manaCrystal: 1 } },
        },
        exits: [
          { label: "Return to the mana reservoir", to: "manaReservoir" },
          { label: "Approach the control dais", to: "controlDais" },
        ],
      },

      conveyorGallery: {
        x: 2,
        y: 1,
        label: "Conveyor Gallery",
        description: "A narrow belt of linked brass plates runs through the chamber, frozen mid-task.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        search: {
          duration: 7,
          baseChance: 45,
          cost: { energy: 8 },
          successText: "The conveyor's pattern is simple: receive, carry, release, repeat.",
        },
        exits: [
          { label: "Return to the cycle hall", to: "cycleHall" },
          { label: "Follow the belt forward", to: "sortingFloor" },
        ],
      },

      sortingFloor: {
        x: 3,
        y: 1,
        label: "Sorting Floor",
        description: "Stone trays sit beneath a rack of delicate arms, each one angled toward a different bin.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        search: {
          duration: 8,
          baseChance: 40,
          cost: { energy: 10 },
          successText: "One sorting arm releases a crystal chip when you nudge the old mechanism.",
          reward: { carried: { manaCrystal: 2 } },
        },
        exits: [
          { label: "Return to the conveyor gallery", to: "conveyorGallery" },
          { label: "Approach the control dais", to: "controlDais" },
        ],
      },

      gearNest: {
        x: 1,
        y: 2,
        label: "Gear Nest",
        description: "Loose gears crowd the floor like fallen leaves, all arranged around an empty socket.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        search: {
          duration: 8,
          baseChance: 40,
          cost: { energy: 10 },
          successText: "You find a crystal caught in the socket where the gear nest once turned.",
          reward: { carried: { manaCrystal: 1 } },
        },
        exits: [
          { label: "Return to the cycle hall", to: "cycleHall" },
          { label: "Inspect the gauge room", to: "gaugeRoom" },
        ],
      },

      controlDais: {
        x: 4,
        y: 1,
        label: "Control Dais",
        description: "A raised platform holds a ring of inactive controls. Every track in the ruin leads here.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        spellCharges: {},
        spellInteractions: {
          arcaneForce: {
            required: 1,
            requiredForceLevel: 2,
            cost: { mana: 5 },
            duration: 2,
            stories: ["Arcane Force levers the control ring into alignment. The dais accepts your weight without resisting."],
          },
        },
        requires: {
          spellCharges: {
            arcaneForce: 1,
          },
        },
        search: {
          duration: 12,
          baseChance: 35,
          deepThought: 6,
          cost: { energy: 12 },
          successText: "The ruin's lesson locks into place: mana can hold a task in motion for a fixed number of cycles.",
          reward: {
            unlocks: [
              { type: "research", id: "automationPrinciples" },
              { type: "journal", id: "automationPrinciplesFound" },
            ],
          },
        },
        exits: [
          { label: "Return to the sorting floor", to: "sortingFloor" },
          { label: "Return through the small passage", to: "smallPassage" },
        ],
      },
    },
  },

  arcaneArchiveDepths: {
    label: "Arcane Archive Depths",
    entryLocation: "arcaneArchive",
    startNode: "archiveEntry",
    layers: {
      upper: "Upper Archive",
      lower: "Lower Archive",
    },
    nodes: {
      archiveEntry: {
        layer: "upper",
        x: 0,
        y: 2,
        label: "Archive Entry",
        description: "The opened door leads to a quiet vestibule. Pale shelves wait beyond a curtain of dust.",
        discovered: true,
        explored: true,
        rewardClaimed: false,
        exits: [{ label: "Enter the threshold hall", to: "thresholdHall" }],
      },

      thresholdHall: {
        layer: "upper",
        x: 1,
        y: 2,
        label: "Threshold Hall",
        description: "Four inlaid lines run from the door to the archive interior, each carrying the memory of one spell.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        search: {
          duration: 7,
          baseChance: 55,
          cost: { energy: 10 },
          successText: "You map the spell-lines enough to move through the hall without disturbing the old wards.",
        },
        exits: [
          { label: "Return to the archive entry", to: "archiveEntry" },
          { label: "Follow the main stacks", to: "catalogHall" },
          { label: "Enter the west stacks", to: "westStacks" },
          { label: "Enter the east stacks", to: "eastStacks" },
        ],
      },

      catalogHall: {
        layer: "upper",
        x: 2,
        y: 2,
        label: "Catalog Hall",
        description: "Stone catalog blocks sit in long rows. Most labels are worn smooth, but a few still answer to touch.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        search: {
          duration: 8,
          baseChance: 50,
          cost: { energy: 10 },
          successText: "You piece together the archive's old ordering: craft, vessel, structure, tower.",
          reward: { carried: { manaCrystal: 1 } },
        },
        exits: [
          { label: "Return to the threshold hall", to: "thresholdHall" },
        ],
      },

      westStacks: {
        layer: "upper",
        x: 1,
        y: 1,
        label: "West Stacks",
        description: "Shelves have collapsed into careful drifts. Thin tablets gleam between splinters of old wood.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        search: {
          duration: 8,
          baseChance: 45,
          cost: { energy: 10 },
          successText: "You recover a tablet whose diagrams describe preparing workspaces for repeated craft.",
          reward: { carried: { manaCrystal: 2 } },
        },
        exits: [
          { label: "Return to the threshold hall", to: "thresholdHall" },
          { label: "Cross to the reading room", to: "readingRoom" },
        ],
      },

      eastStacks: {
        layer: "upper",
        x: 1,
        y: 3,
        label: "East Stacks",
        description: "Cracked cases hold sketches of hides, metal, herbs, and stranger materials arranged by process.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        search: {
          duration: 8,
          baseChance: 45,
          cost: { energy: 10 },
          successText: "You sort the surviving diagrams by craft and mark the useful shelves.",
          reward: { carried: { manaCrystal: 2 } },
        },
        exits: [
          { label: "Return to the threshold hall", to: "thresholdHall" },
          { label: "Study the pattern gallery", to: "patternGallery" },
        ],
      },

      readingRoom: {
        layer: "upper",
        x: 1,
        y: 0,
        label: "Reading Room",
        description: "A semicircle of stone desks faces a blank wall. Notes are carved directly into the work surfaces.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        search: {
          duration: 9,
          baseChance: 45,
          cost: { energy: 12 },
          successText: "The room teaches a simple archive habit: every useful plan was copied into at least two neighboring chambers.",
        },
        exits: [
          { label: "Enter the preservation lab", to: "preservationLab" },
          { label: "Return to the west stacks", to: "westStacks" },        
        ],
      },

      preservationLab: {
        layer: "upper",
        x: 2,
        y: 0,
        label: "Preservation Lab",
        description: "Glass jars line a stone counter. The air still smells faintly of herbs preserved past their natural span.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        search: {
          duration: 10,
          baseChance: 45,
          deepThought: 4,
          cost: { energy: 12 },
          successText: "You copy plans for building an alchemy station at camp.",
          reward: {
            unlocks: [
              { type: "flag", id: "campAlchemyPlansFound" },
              { type: "journal", id: "campAlchemyPlansFound" },
            ],
          },
        },
        exits: [
          { label: "Return to the reading room", to: "readingRoom" },
          //{ label: "Inspect the heat diagram hall", to: "heatDiagramHall" },//
        ],
      },

      patternGallery: {
        layer: "upper",
        x: 2,
        y: 3,
        label: "Pattern Gallery",
        description: "Thin hides are pressed between etched plates, their fibers preserved in diagrams rather than flesh.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        search: {
          duration: 10,
          baseChance: 45,
          deepThought: 4,
          cost: { energy: 12 },
          successText: "You copy plans for building a tannery at camp.",
          reward: {
            unlocks: [
              { type: "flag", id: "campTanningPlansFound" },
              { type: "journal", id: "campTanningPlansFound" },
            ],
          },
        },
        exits: [
          { label: "Return to the east stacks", to: "eastStacks" },
          { label: "Inspect the heat diagram hall", to: "heatDiagramHall" },
        ],
      },

      heatDiagramHall: {
        layer: "upper",
        x: 3,
        y: 3,
        label: "Heat Diagram Hall",
        description: "The walls show iron softening under blue-white pressure, each step marked with tiny channels for mana flow.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        search: {
          duration: 10,
          baseChance: 40,
          deepThought: 4,
          cost: { energy: 12 },
          successText: "You copy plans for building a camp smelter braced for Arcane Force.",
          reward: {
            unlocks: [
              { type: "flag", id: "campSmeltingPlansFound" },
              { type: "journal", id: "campSmeltingPlansFound" },
            ],
          },
        },
        exits: [
          { label: "Return to the pattern gallery", to: "patternGallery" },
          { label: "Enter the map rotunda", to: "mapRotunda" },
        ],
      },

      mapRotunda: {
        layer: "upper",
        x: 4,
        y: 3,
        label: "Map Rotunda",
        description: "A circular room maps the archive below as a second ring beneath the first.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        search: {
          duration: 9,
          baseChance: 45,
          cost: { energy: 12 },
          successText: "The lower archive layout resolves: ducts, machines, and a drafting room lie below.",
        },
        exits: [
          { label: "Return to the heat diagram hall", to: "heatDiagramHall" },
          { label: "Enter the keeper's office", to: "keeperOffice" },
          { label: "Find the lower stair", to: "lowerStair" },
        ],
      },

      keeperOffice: {
        layer: "upper",
        x: 4,
        y: 2,
        label: "Keeper's Office",
        description: "A narrow office watches the archive from behind a slit window. The desk is stone, the chair long gone.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        search: {
          duration: 9,
          baseChance: 40,
          cost: { energy: 12 },
          successText: "Inside the desk, you find two mana crystals wrapped in brittle cloth.",
          reward: { carried: { manaCrystal: 2 } },
        },
        exits: [
          { label: "Find the lower stair", to: "lowerStair" },
          { label: "Return to the map rotunda", to: "mapRotunda" },
        ],
      },

      lowerStair: {
        layer: "upper",
        x: 4,
        y: 1,
        label: "Lower Stair",
        description: "A tight stair curls down through the archive's foundation. Cool mana rises from below.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        spellCharges: {},
        spellInteractions: {
          arcaneForce: {
            required: 1,
            requiredForceLevel: 2,
            cost: { mana: 4 },
            duration: 2,
            stories: ["Arcane Force presses the stair's hidden brace aside. The way down loosens with a muted click."],
          },
        },
        requires: {
          spellCharges: {
            arcaneForce: 1,
          },
        },
        search: {
          duration: 8,
          baseChance: 50,
          cost: { energy: 10 },
          successText: "You clear the dust from the stair and mark the safest descent.",
        },
        exits: [
          { label: "Return to the keepers office", to: "keeperOffice" },
          { label: "Descend to the lower archive", to: "lowerLanding" },
        ],
      },

      lowerLanding: {
        layer: "lower",
        x: 3,
        y: 1,
        label: "Lower Landing",
        description: "The stair ends in a low hall. The air hums with the slow pressure of old machines.",
        discovered: false,
        explored: true,
        rewardClaimed: false,
        exits: [
          { label: "Climb to the upper archive", to: "lowerStair" },
          { label: "Follow the mana ducts", to: "manaDucts" },
          { label: "Enter the sealed stacks", to: "sealedStacks" },
        ],
      },

      manaDucts: {
        layer: "lower",
        x: 3,
        y: 0,
        label: "Mana Ducts",
        description: "Glass-lined channels run through the floor. Their old flow points toward a chamber deeper in.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        search: {
          duration: 10,
          baseChance: 40,
          cost: { energy: 12 },
          successText: "You trace the duct pattern and recover a crystal from a cracked junction.",
          reward: { carried: { manaCrystal: 1 } },
        },
        exits: [
          { label: "Return to the lower landing", to: "lowerLanding" },
          { label: "Enter the machine nave", to: "machineNave" },
        ],
      },

      sealedStacks: {
        layer: "lower",
        x: 3,
        y: 2,
        label: "Sealed Stacks",
        description: "Metal shutters cover these shelves, but several have warped open over the years.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        spellCharges: {},
        spellInteractions: {
          arcaneForce: {
            required: 1,
            requiredForceLevel: 2,
            cost: { mana: 5 },
            duration: 2,
            stories: ["A flat plane of Force catches the warped shutters and shoves them fully open."],
          },
        },
        requires: {
          spellCharges: {
            arcaneForce: 1,
          },
        },
        search: {
          duration: 10,
          baseChance: 40,
          cost: { energy: 12 },
          successText: "You open a warped shutter and find a bundle of stable archive slates.",
          reward: { carried: { manaCrystal: 1 } },
        },
        exits: [
          { label: "Return to the lower landing", to: "lowerLanding" },
          { label: "Enter the machine nave", to: "machineNave" },
          { label: "Search the deep repository", to: "deepRepository" },
        ],
      },

      machineNave: {
        layer: "lower",
        x: 2,
        y: 0,
        label: "Machine Nave",
        description: "Tall frames stand in two rows like silent columns. Each one once guided mana into useful motion.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        search: {
          duration: 11,
          baseChance: 35,
          cost: { energy: 14 },
          successText: "The frames are too damaged to use, but their alignment points toward a dedicated condenser chamber.",
          reward: { carried: { manaCrystal: 2 } },
        },
        exits: [
          { label: "Return to the mana ducts", to: "manaDucts" },
          { label: "Enter the condenser gallery", to: "condenserGallery" },
          { label: "Enter the drafting room", to: "towerDraftingRoom" },
        ],
      },

      condenserGallery: {
        layer: "lower",
        x: 2,
        y: 1,
        label: "Condenser Gallery",
        description: "A ring-shaped device has been disassembled across three tables. Its purpose is unmistakable: gather, cool, condense.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        search: {
          duration: 12,
          baseChance: 35,
          deepThought: 5,
          cost: { energy: 14 },
          successText: "You copy the ancient mana condenser plans. With enough work, camp could produce mana crystals instead of only finding them.",
          reward: {
            unlocks: [
              { type: "flag", id: "manaCondenserPlansFound" },
              { type: "journal", id: "manaCondenserPlansFound" },
            ],
          },
        },
        exits: [
          { label: "Return to the machine nave", to: "machineNave" },
          { label: "Search the deep repository", to: "deepRepository" },
        ],
      },

      towerDraftingRoom: {
        layer: "lower",
        x: 1,
        y: 0,
        label: "Tower Drafting Room",
        description: "Huge foundation circles cover the walls. The drawings are incomplete, but the scale matches the buried foundation at camp.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        search: {
          duration: 12,
          baseChance: 35,
          deepThought: 5,
          cost: { energy: 14 },
          successText: "You copy the partial tower plans. They are not enough to build from, but they prove the camp foundation was only the beginning.",
          reward: {
            unlocks: [
              { type: "flag", id: "partialTowerPlansFound" },
              { type: "journal", id: "partialTowerPlansFound" },
              { type: "research", id: "towerFoundations" },
            ],
          },
        },
        exits: [
          { label: "Return to the machine nave", to: "machineNave" },
          { label: "Search the deep repository", to: "deepRepository" },
        ],
      },

      deepRepository: {
        layer: "lower",
        x: 1,
        y: 1,
        label: "Deep Repository",
        description: "The final room is mostly empty. Its shelves were cleared deliberately, not looted.",
        discovered: false,
        explored: false,
        rewardClaimed: false,
        manaSenseCharges: 0,
        spellCharges: {},
        spellInteractions: {
          arcaneForce: {
            required: 1,
            requiredForceLevel: 2,
            cost: { mana: 6 },
            duration: 3,
            stories: ["Arcane Force spreads through the repository seal until the old pressure lock releases."],
          },
        },
        requires: {
          spellCharges: {
            arcaneForce: 1,
          },
        },
        search: {
          duration: 13,
          baseChance: 30,
          deepThought: 3,
          cost: { energy: 16 },
          successText: "You find a few intact fragments and the unsettling outline of plans removed before the archive was sealed.",
          reward: { carried: { manaCrystal: 3 } },
        },
        exits: [
          { label: "Return to the condenser gallery", to: "condenserGallery" },
          { label: "Return to the drafting room", to: "towerDraftingRoom" },
        ],
      },
    },
  },
};

// Research Definitions
const researchDefinitions = {
  cordage: {
    label: "Cordage",
    duration: 5,
    deepThought: 1,
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
      { type: "gearUpgrade", id: "foragingBasket" },
    ],
  },

  simpleTraps: {
    label: "Simple Traps",
    duration: 3,
    deepThought: 1,
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
    deepThought: 2,
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
    unlocks: [{ type: "gearUpgrade", id: "waterskin" }],
  },

  leatherworking: {
    label: "Leatherworking",
    duration: 9,
    deepThought: 3,
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
      { type: "gearUpgrade", id: "leatherShirt" },
      { type: "gearUpgrade", id: "leatherPants" },
      { type: "campUpgrade", id: "warmCot" },
    ],
  },

  crudeBackpack: {
    label: "Crude Backpack",
    duration: 5,
    deepThought: 1,
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
    deepThought: 1,
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
    deepThought: 1,
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
    deepThought: 1,
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
    deepThought: 1,
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
    deepThought: 2,
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
    deepThought: 3,
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
      { type: "campUpgrade", id: "researchBench" },
    ],
  },

  crudeIronPick: {
    label: "Crude Iron Pick",
    duration: 5,
    deepThought: 2,
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
    deepThought: 2,
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

  salvagedSheltercraft: {
    label: "Salvaged Sheltercraft",
    duration: 6,
    deepThought: 2,
    completed: false,
    unlocked: false,
    cost: {
      energy: 20,
      wood: 25,
      fiber: 10,
      focus: 2,
    },
    requires: {
      flags: ["ruinedTorchFound"],
    },
    story:
      "The abandoned shelter failed from rot, not design. Its angled frame gives you a better way to brace your own shelter against weather.",
    unlocks: [{ type: "campUpgrade", id: "framedShelter" }],
  },

  sturdyConstruction: {
    label: "Sturdy Construction",
    duration: 5,
    deepThought: 3,
    completed: false,
    unlocked: false,
    cost: {
      energy: 8,
      iron: 1,
      wood: 10,
      focus: 3,
    },
    requires: {
      researchCompleted: ["smelting", "leatherworking", "automationPrinciples"],
      campUpgradesPurchased: ["framedShelter"],
      resources: {},
    },
    story: "With more and better resources you can build sturdier buildings.",
    unlocks: [{ type: "campUpgrade", id: "smallHut" }],
  },

  automationPrinciples: {
    label: "Automation Principles",
    duration: 8,
    deepThought: 5,
    completed: false,
    unlocked: false,
    cost: {
      energy: 12,
      focus: 4,
      manaCrystal: 2,
      iron: 1,
    },
    requires: {
      locationsExplored: ["silentGearworks"],
    },
    story:
      "The ruin's mechanisms are not alive, exactly. They remember motion when mana is fed into them: a task, a rhythm, a cycle repeated until the charge fades.",
    unlocks: [
      { type: "campUpgrade", id: "lumberMill" },
      { type: "campUpgrade", id: "foragingLure" },
    ],
  },

  alchemy: {
    label: "Alchemy",
    duration: 5,
    deepThought: 3,
    completed: false,
    unlocked: false,
    cost: {
      energy: 8,
      herb: 10,
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

  manaTonics: {
    label: "Mana Tonics",
    duration: 6,
    deepThought: 3,
    completed: false,
    unlocked: false,
    cost: {
      energy: 12,
      glimmerleaf: 5,
      focus: 3,
    },
    requires: {
      locationsExplored: ["overgrownFields"],
      researchCompleted: ["alchemy"],
      flags: ["magicUnlocked"],
    },
    story:
      "Glimmerleaf does not restore mana on its own. Prepared properly, though, it can hold a charge until you need it away from a place of meditation.",
    unlocks: [{ type: "resourceCraft", id: "manaTonicBase" }],
  },

  alchemyBelt2: {
    label: "Improved Tonic Belt",
    duration: 5,
    deepThought: 2,
    completed: false,
    unlocked: false,
    cost: {
      energy: 8,
      herb: 10,
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
    deepThought: 2,
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
    deepThought: 4,
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
    discoveryStory: "The mana crystal keeps a quiet pressure in your thoughts. There may be a way to recover mana without returning underground.",
    story:
      "The crystal hums with the same quiet pressure as the cave runes. With the right place prepared, you could recover mana without returning underground.",
    unlocks: [{ type: "campUpgrade", id: "meditationSpot" }],
  },

  manaCycling: {
    label: "Mana Cycling",
    duration: 8,
    deepThought: 4,
    completed: false,
    unlocked: false,
    cost: {
      energy: 20,
      focus: 3,
      manaCrystal: 1,
    },
    requires: {
      flags: ["magicUnlocked"],
      campUpgradesPurchased: ["meditationSpot"],
    },
    discoveryStory:
      "As mana returns, you begin to notice that it does not simply appear. It follows a path through you. With practice, that path might be widened.",
    story: "Careful meditation reveals the first safe path for cycling mana through yourself instead of casting it outward.",
    unlocks: [{ type: "action", id: "practiceManaCycling" }],
  },

  campTanning: {
    label: "Camp Tanning",
    duration: 8,
    deepThought: 3,
    completed: false,
    unlocked: false,
    cost: {
      energy: 30,
      focus: 4,
      leather: 4,
      iron: 2,
    },
    requires: {
      flags: ["campTanningPlansFound"],
      researchCompleted: ["leatherworking"],
    },
    story: "The archive plans adapt the cabin's old hidework into a compact camp tannery.",
    unlocks: [{ type: "campUpgrade", id: "campTannery" }],
  },

  campSmelting: {
    label: "Camp Smelting",
    duration: 10,
    deepThought: 4,
    completed: false,
    unlocked: false,
    cost: {
      energy: 40,
      focus: 4,
      iron: 6,
      nails: 20,
      stone: 4,
    },
    requires: {
      flags: ["campSmeltingPlansFound"],
      researchCompleted: ["smelting"],
    },
    story: "The smelter diagrams show how to brace a small furnace so Arcane Force can work safely at camp.",
    unlocks: [{ type: "campUpgrade", id: "campSmelterFoundation" }],
  },

  campAlchemy: {
    label: "Camp Alchemy",
    duration: 8,
    deepThought: 3,
    completed: false,
    unlocked: false,
    cost: {
      energy: 35,
      focus: 4,
      herb: 25,
      glimmerleaf: 5,
      manaCrystal: 2,
    },
    requires: {
      flags: ["campAlchemyPlansFound", "magicUnlocked"],
      researchCompleted: ["alchemy"],
    },
    story: "The preservation lab plans bring the alchemist's workbench home, with enough containment for mana-bound tonics.",
    unlocks: [{ type: "campUpgrade", id: "campAlchemyStation" }],
  },

  ancientManaCondenser: {
    label: "Ancient Mana Condenser",
    duration: 12,
    deepThought: 5,
    completed: false,
    unlocked: false,
    cost: {
      energy: 60,
      focus: 5,
      wood: 30,
      chargedCrystal: 1,
    },
    requires: {
      flags: ["manaCondenserPlansFound"],
      researchCompleted: ["automationPrinciples"],
    },
    story: "The archive's condenser design is slow, exacting, and too valuable to leave as theory.",
    unlocks: [{ type: "campUpgrade", id: "manaCondenserFrame" }],
  },

  towerFoundations: {
    label: "Tower Foundations",
    duration: 10,
    deepThought: 5,
    completed: false,
    unlocked: false,
    cost: {
      energy: 40,
      focus: 5,
    },
    requires: {
      flags: ["partialTowerPlansFound"],
    },
    story:
      "The partial tower plans match the foundation beneath camp. They are not enough to build upward, but they are enough to clear, stabilize, and awaken what was buried.",
    unlocks: [
      { type: "project", id: "towerFoundation" },
      { type: "journal", id: "towerFoundationStarted" },
      { type: "goal", id: "clearTowerFoundation" },
    ],
  },
};

const projectDefinitions = {
  towerFoundation: {
    label: "Tower Foundation",
    actionLabel: "Work on Foundation",
    completedLabel: "Foundation Awakened",
    workCost: {
      energy: 20,
    },
    workDuration: 3,
    description:
      "The tower plans point to the clearing beneath your camp. The stone below is old, deliberate, and still waiting for the shape above it.",
    completedDescription:
      "The buried foundation has been cleared, repaired, reinforced, and awakened. The clearing is no longer just a camp; it is the base of something larger.",
    completedStory:
      "Charged crystals settle into the restored channels. Blue-white light runs through the old stone, and the whole foundation answers at once.",
    levels: [
      {
        name: "Site Cleared",
        workYield: 20,
        workRequired: 100,
        materials: {
          wood: 25,
        },
        description: "Brush, roots, and camp clutter cover the footprint shown in the plans.",
        completionStory: "You clear enough of the site to see the first deliberate curve beneath the soil.",
      },
      {
        name: "Excavation Rig",
        workYield: 20,
        workRequired: 200,
        materials: {
          wood: 50,
        },
        description: "The foundation is too large to clear by hand alone. Braces, ramps, and hauling frames will keep the work moving.",
        completionStory: "A crude rig rises over the clearing, turning hard digging into repeatable labor.",
      },
      {
        name: "Buried Stonework",
        workYield: 22,
        workRequired: 300,
        materials: {
          stone: 50,
        },
        description: "Packed earth and rubble hide fitted stonework beneath the camp.",
        completionStory: "Your tools strike fitted stone. The foundation was not destroyed; it was buried.",
      },
      {
        name: "Outer Ring Exposed",
        workYield: 22,
        workRequired: 450,
        materials: {
          stone: 100,
        },
        description: "The outer ring is visible now, wide enough to make the camp feel like it was built inside a sleeping tower.",
        completionStory: "The tower footprint resolves into a full ring beneath the clearing.",
      },
      {
        name: "Foundation Repaired",
        workYield: 25,
        workRequired: 600,
        materials: {
          stone: 150,
          iron: 25,
        },
        description: "Cracked foundation sections need fitted stone and iron pins before they can bear weight again.",
        completionStory: "The repaired ring settles with a deep, steady weight. The old foundation can carry structure again.",
      },
      {
        name: "Reinforced Foundation",
        workYield: 25,
        workRequired: 800,
        materials: {
          stone: 250,
          iron: 50,
        },
        description: "Iron reinforcement from the northern forge can bind the ancient structure into one frame.",
        completionStory: "Iron ties the old stone together, making the foundation feel less like ruins and more like engineering.",
      },
      {
        name: "Central Footing Restored",
        workYield: 30,
        workRequired: 1000,
        materials: {
          stone: 400,
          iron: 75,
        },
        description: "The central footing holds narrow channels that look less like drainage and more like mana pathways.",
        completionStory: "The central footing opens under your hands. Faint mana channels run through the entire foundation.",
      },
      {
        name: "Foundation Awakened",
        workYield: 30,
        workRequired: 1250,
        materials: {
          stone: 600,
          iron: 100,
          chargedCrystal: 8,
        },
        description: "The foundation is physically whole. Charged crystals should be able to wake the channels carved through the stone.",
        completionStory:
          "One by one, charged crystals seat into the channels. The foundation lights from edge to center, remembering the tower it was meant to hold.",
      },
    ],
  },
};

// Exploration Definitions
const explorationStages = {
  findClearing: {
    required: 3,
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
    label: "Small Fire (Rest/Recover 10% Faster)",
    displayName: "Small Fire",
    campSlot: "fire",
    campSlotLabel: "Fire",
    campSlotOrder: 2,
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
      recalculateCampEffects();
      updateAllActionButtons();
    },
  },
  crudeLeanTo: {
    label: "Crude Lean-To (Rest +2 Energy)",
    displayName: "Crude Lean-To",
    campSlot: "shelter",
    campSlotLabel: "Shelter",
    campSlotOrder: 1,
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
      recalculateCampEffects();
      recalculateCharacterStats();
    },
  },
  lessCrudeShelter: {
    label: "Less Crude Shelter (Rest +4 Energy)",
    displayName: "Less Crude Shelter",
    campSlot: "shelter",
    campSlotLabel: "Shelter",
    campSlotOrder: 1,
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
      recalculateCampEffects();
    },
  },

  framedShelter: {
    label: "Framed Shelter (Rest +8 Energy)",
    displayName: "Framed Shelter",
    campSlot: "shelter",
    campSlotLabel: "Shelter",
    campSlotOrder: 1,
    campSlotRank: 3,
    duration: 10,
    cost: {
      wood: 60,
      fiber: 30,
      stone: 10,
      energy: 50,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      recalculateCampEffects();
    },
  },

  smallHut: {
    label: "Small Hut (Rest +12 Energy)",
    displayName: "Small Hut",
    campSlot: "shelter",
    campSlotLabel: "Shelter",
    campSlotOrder: 1,
    campSlotRank: 4,
    duration: 15,
    cost: {
      wood: 200,
      stone: 20,
      nails: 20,
      energy: 100,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      recalculateCampEffects();
      recalculateCharacterStats();
    },
  },

  uncomfortableCot: {
    label: "Ugly Cot (Recover +2 Focus)",
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
      updateAllActionButtons();
    },
  },

  warmCot: {
    label: "Warm Cot (Recover +3 Focus)",
    displayName: "Warm Cot",
    campSlot: "rest",
    campSlotLabel: "Rest",
    campSlotOrder: 3,
    campSlotRank: 2,
    duration: 10,
    cost: {
      wood: 20,
      fiber: 20,
      leather: 4,
      energy: 60,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      updateAllActionButtons();
    },
  },

  stoneFirePit: {
    label: "Stone Fire Pit (Rest/Recover 20% Faster)",
    displayName: "Stone Fire Pit",
    campSlot: "fire",
    campSlotLabel: "Fire",
    campSlotOrder: 2,
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
      updateAllActionButtons();
    },
  },

  researchSpot: {
    label: "Research Spot (Unlock Research)",
    displayName: "Research Spot",
    campSlot: "research",
    campSlotLabel: "Research",
    campSlotOrder: 4,
    campSlotRank: 1,
    duration: 1,
    cost: {
      focus: 1,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {},
  },

  researchBench: {
    label: "Research Bench (-25% Research Time, -1 Focus Cost)",
    displayName: "Research Bench",
    campSlot: "research",
    campSlotLabel: "Research",
    campSlotOrder: 4,
    campSlotRank: 2,
    duration: 12,
    cost: {
      wood: 40,
      nails: 10,
      iron: 2,
      energy: 80,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      updateResearchHistoryUI();
      updateCraftingButtons();
    },
  },

  meditationSpot: {
    label: "Meditation Spot (Meditate At Camp)",
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
    label: "Lumber Mill (Automate Wood)",
    displayName: "Lumber Mill",
    campSlot: "mill",
    campSlotLabel: "Mill",
    campSlotOrder: 6,
    campSlotRank: 1,
    duration: 12,
    cost: {
      nails: 20,
      wood: 40,
      manaCrystal: 2,
      energy: 100,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      getResource("wood").maxValue = 500;
      updateResource("wood");
      unlockAutomation("lumberMill");
      updateCampResourcesSectionVisibility();
    },
  },

  foragingLure: {
    label: "Foraging Lure (Automate Food)",
    displayName: "Foraging Lure",
    campSlot: "foodAutomation",
    campSlotLabel: "Food",
    campSlotOrder: 7,
    campSlotRank: 1,
    duration: 10,
    cost: {
      wood: 20,
      fiber: 20,
      manaCrystal: 2,
      energy: 60,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      getResource("food").maxValue = 500;
      updateResource("food");
      unlockAutomation("foragingLure");
      updateCampResourcesSectionVisibility();
    },
  },

  campTannery: {
    label: "Camp Tannery (Tan Leather At Camp)",
    displayName: "Camp Tannery",
    campSlot: "tannery",
    campSlotLabel: "Tannery",
    campSlotOrder: 8,
    campSlotRank: 1,
    duration: 10,
    cost: {
      energy: 80,
      wood: 60,
      leather: 5,
      nails: 25,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      updateResourceCraftUI("leather");
      updateCraftingButtons();
    },
  },

  campSmelterFoundation: {
    label: "Camp Smelter Foundation (Smelter Step 1)",
    displayName: "Smelter Foundation",
    campSlot: "forge",
    campSlotLabel: "Forge",
    campSlotOrder: 9,
    campSlotRank: 1,
    duration: 8,
    cost: {
      energy: 70,
      stone: 35,
      iron: 2,
      nails: 10,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      unlockCampUpgrade("campSmelter");
    },
  },

  campSmelter: {
    label: "Camp Smelter (Smelt Iron At Camp)",
    displayName: "Camp Smelter",
    campSlot: "forge",
    campSlotLabel: "Forge",
    campSlotOrder: 9,
    campSlotRank: 2,
    duration: 10,
    cost: {
      energy: 70,
      stone: 25,
      iron: 4,
      nails: 15,
      manaCrystal: 4,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      updateResourceCraftUI("iron");
      updateCraftingButtons();
    },
  },

  campAlchemyStation: {
    label: "Camp Alchemy Station (Tonics At Camp)",
    displayName: "Camp Alchemy Station",
    campSlot: "alchemy",
    campSlotLabel: "Alchemy",
    campSlotOrder: 10,
    campSlotRank: 1,
    duration: 10,
    cost: {
      energy: 100,
      wood: 50,
      iron: 4,
      leather: 4,
      manaCrystal: 6,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      updateResourceCraftUI("staminaTonic");
      updateResourceCraftUI("manaTonicBase");
      updateCraftingButtons();
    },
  },

  manaCondenserFrame: {
    label: "Mana Condenser Frame (Condenser Step 1)",
    displayName: "Condenser Frame",
    campSlot: "condenser",
    campSlotLabel: "Condenser",
    campSlotOrder: 11,
    campSlotRank: 1,
    duration: 10,
    cost: {
      energy: 90,
      stone: 40,
      iron: 5,
      nails: 20,
      manaCrystal: 4,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      unlockCampUpgrade("manaCondenser");
    },
  },

  manaCondenser: {
    label: "Mana Condenser (Automate Mana Crystals)",
    displayName: "Mana Condenser",
    campSlot: "condenser",
    campSlotLabel: "Condenser",
    campSlotOrder: 11,
    campSlotRank: 2,
    duration: 12,
    cost: {
      energy: 90,
      stone: 20,
      iron: 5,
      nails: 20,
      chargedCrystal: 4,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      unlockAutomation("manaCondenser");
      updateWorkTabsVisibility();
    },
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
    label: "Scratchy Shirt (-1 Exploration Energy)",
    displayName: "Scratchy Shirt",
    equipmentType: "gear",
    slot: "chest",
    slotLabel: "Chest",
    slotOrder: 4,
    slotRank: 1,
    effects: {
      explorationEnergyReduction: 1,
    },
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
      updateDungeonUI();
      refreshExpeditionUI();
      updateAllActionButtons();
    },
  },
  leatherShirt: {
    label: "Leather Shirt (-2 Exploration Energy)",
    displayName: "Leather Shirt",
    equipmentType: "gear",
    slot: "chest",
    slotLabel: "Chest",
    slotOrder: 4,
    slotRank: 2,
    effects: {
      explorationEnergyReduction: 2,
    },
    duration: 8,
    cost: {
      leather: 3,
      fiber: 6,
      energy: 35,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      updateDungeonUI();
      refreshExpeditionUI();
      updateAllActionButtons();
    },
  },
  scratchyPants: {
    label: "Scratchy Pants (-10% Travel Energy)",
    displayName: "Scratchy Pants",
    equipmentType: "gear",
    slot: "legs",
    slotLabel: "Legs",
    slotOrder: 5,
    slotRank: 1,
    effects: {
      travelEnergyMultiplier: 0.9,
    },
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
      refreshExpeditionUI();
      updateAllActionButtons();
    },
  },
  leatherPants: {
    label: "Leather Pants (-20% Travel Energy)",
    displayName: "Leather Pants",
    equipmentType: "gear",
    slot: "legs",
    slotLabel: "Legs",
    slotOrder: 5,
    slotRank: 2,
    effects: {
      travelEnergyMultiplier: 0.8,
    },
    duration: 8,
    cost: {
      leather: 4,
      fiber: 6,
      energy: 40,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      refreshExpeditionUI();
      updateAllActionButtons();
    },
  },

  foragingBasket: {
    label: "Foraging Basket (+1 Food, +1 Herb)",
    displayName: "Foraging Basket",
    equipmentType: "tool",
    slot: "forage",
    slotLabel: "Foraging",
    slotOrder: 0,
    slotRank: 1,
    effects: {
      forageYieldFlat: 1,
    },
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
      recalculateToolEffects();
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
      energy: 15,
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
      energy: 10,
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
      energy: 20,
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
    label: "Stone Knife (+1 Fiber, +1 Hunt Pelt)",
    duration: 10,
    displayName: "Stone Knife",
    equipmentType: "tool",
    slot: "knife",
    slotLabel: "Knife",
    slotOrder: 1,
    slotRank: 1,
    effects: {
      cuttingYieldFlat: 1,
      huntRewardFlat: 1,
    },
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
      recalculateToolEffects();
      refreshExpeditionUI();
    },
  },

  ironKnife: {
    label: "Iron Knife (+2 Fiber, +2 Hunt Pelts)",
    duration: 15,
    displayName: "Iron Knife",
    equipmentType: "tool",
    slot: "knife",
    slotLabel: "Knife",
    slotOrder: 1,
    slotRank: 2,
    effects: {
      cuttingYieldFlat: 2,
      huntRewardFlat: 2,
    },
    cost: {
      leather: 1,
      ironKnifeBlade: 1,
      energy: 30,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      recalculateToolEffects();
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
    effects: {
      choppingYieldFlat: 1,
    },
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
      recalculateToolEffects();
      refreshExpeditionUI();
    },
  },

  ironAxe: {
    label: "Iron Axe (+2 Wood)",
    displayName: "Iron Axe",
    equipmentType: "tool",
    slot: "axe",
    slotLabel: "Axe",
    slotOrder: 2,
    slotRank: 2,
    effects: {
      choppingYieldFlat: 2,
    },
    duration: 15,
    cost: {
      leather: 2,
      wood: 5,
      ironAxeHead: 1,
      energy: 40,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      recalculateToolEffects();
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
    label: "Torch (Explore Dark Places)",
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
    label: "Crude Iron Pick (Mine 2 Ore)",
    displayName: "Crude Iron Pick",
    equipmentType: "tool",
    slot: "pick",
    slotLabel: "Pick",
    slotOrder: 3,
    slotRank: 1,
    effects: {
      miningYieldBase: 2,
    },
    duration: 15,
    cost: {
      wood: 5,
      crudeIronPickHead: 1,
      fiber: 2,
      energy: 15,
    },
    unlocked: false,
    purchased: false,
    button: null,
    display: null,
    onComplete() {
      recalculateToolEffects();
      refreshExpeditionUI();
    },
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

const automationDefinitions = {
  lumberMill: {
    label: "Lumber Mill",
    description: "A mana-turned frame that helps process nearby wood.",
    duration: 3,
    cyclesPerMana: 10,
    fuelCost: { mana: 1 },
    produces: { resource: "wood", amount: 1 },
    unlocked: false,
    cycles: 0,
    progress: 0,
  },

  foragingLure: {
    label: "Foraging Lure",
    description: "A quiet charm that draws small edible finds back toward camp.",
    duration: 5,
    cyclesPerMana: 10,
    fuelCost: { mana: 1 },
    produces: { resource: "food", amount: 1 },
    unlocked: false,
    cycles: 0,
    progress: 0,
  },

  manaCondenser: {
    label: "Mana Condenser",
    description: "An archive device that condenses diffuse mana into new crystals.",
    duration: 30,
    cyclesPerMana: 10,
    cyclesPerOutput: 20,
    fuelCost: { mana: 1 },
    produces: { resource: "manaCrystal", amount: 1 },
    unlocked: false,
    cycles: 0,
    progress: 0,
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
    campUpgradeRequired: "campTannery",
    duration: 2,
    cost: {
      energy: 6,
    },
    campCost: {
      energy: 6,
      pelt: 3,
    },
    storageCost: {
      pelt: 3,
    },
    storageProduces: {
      leather: 1,
    },
    campProduces: {
      resource: "leather",
      amount: 1,
    },
    unlocked: false,
    button: null,
  },

  iron: {
    label: "Smelt Iron",
    requiredLocation: "minersCamp",
    campUpgradeRequired: "campSmelter",
    duration: 4,
    cost: {
      energy: 8,
    },
    campCost: {
      energy: 8,
      ore: 3,
      wood: 5,
    },
    storageCost: {
      ore: 3,
      wood: 5,
    },
    storageProduces: {
      iron: 1,
    },
    campProduces: {
      resource: "iron",
      amount: 1,
    },
    unlocked: false,
    button: null,
  },

  staminaTonic: {
    label: "Brew Stamina Tonic Base",
    requiredLocation: "alchemistsHut",
    campUpgradeRequired: "campAlchemyStation",
    duration: 4,
    cost: {
      energy: 15,
    },
    campCost: {
      energy: 15,
      herb: 25,
    },
    storageCost: {
      herb: 25,
    },
    storageProduces: {
      staminaTonicBase: 1,
    },
    campProduces: {
      resource: "staminaTonicBase",
      amount: 1,
    },
    unlocked: false,
    button: null,
  },

  manaTonicBase: {
    label: "Brew Mana Tonic Base",
    requiredLocation: "alchemistsHut",
    campUpgradeRequired: "campAlchemyStation",
    duration: 4,
    cost: {
      energy: 10,
    },
    campCost: {
      energy: 10,
      glimmerleaf: 4,
    },
    storageCost: {
      glimmerleaf: 4,
    },
    storageProduces: {
      manaTonicBase: 1,
    },
    campProduces: {
      resource: "manaTonicBase",
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

  improvedStaminaTonic: {
    label: "Improved Stamina Tonic",
    carriedItem: "improvedStaminaTonic",
    effectText: "You drink a bright, biting tonic and strength floods back into your limbs.",
    use() {
      addResource("energy", 30);
      updateResource("energy");
    },
  },

  manaTonic: {
    label: "Mana Tonic",
    carriedItem: "manaTonic",
    effectText: "You drink a cool, silver-edged tonic and feel mana settle back into reach.",
    use() {
      addResource("mana", 5);
      updateResource("mana");
    },
  },

  majorManaTonic: {
    label: "Major Mana Tonic",
    carriedItem: "majorManaTonic",
    effectText: "You drink a dense, bright tonic and mana surges back into shape.",
    use() {
      addResource("mana", 10);
      updateResource("mana");
    },
  },

  huntingLure: {
    label: "Hunting Lure",
    carriedItem: "huntingLure",
    effectText: "The lure pulls nearby game toward a trail you can read.",
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
  attunement: {
    label: "Attunement",
    duration: 1,
    unlocked: false,
    targeted: true,
    sustained: true,
  },
  imbue: {
    label: "Imbue",
    duration: 2,
    unlocked: false,
    targeted: true,
  },
  arcaneForce: {
    label: "Arcane Force",
    duration: 2,
    unlocked: false,
    targeted: true,
  },
};

const manaSenseDefinitions = {
  stoneSense: {
    label: "Stone Sense",
    description: "Sense ore-rich stone in the foothill scree until you leave.",
    requiredLocation: "foothillScree",
    requiredManaSenseLevel: 1,
    duration: 3,
    cost: {
      mana: 4,
    },
    story: "You let Mana Sense sink into the loose stone. Ore-rich seams stand out like pressure behind your eyes.",
  },
};

const attunementDefinitions = {
  feetTravel: {
    label: "Long Stride",
    description: "+0.5 travel distance per step",
    cost: { mana: 2 },
    effects: {
      travelDistanceFlat: 0.5,
    },
  },

  packCapacity: {
    label: "Strong Back",
    description: "+10 carried capacity",
    cost: { mana: 4 },
    effects: {
      carryCapacityFlat: 10,
    },
  },

  knifeHunting: {
    label: "Hunter's Eye",
    description: "Improves hunt success chance; +1 pelt at level 5",
    cost: { mana: 4 },
    effects: {
      huntSuccessChancePerLevel: 0.07,
      maxLevelHuntRewardFlat: 1,
    },
  },

  reinforcedBody: {
    label: "Reinforced Body",
    description: "+25 max energy",
    requiredAttunementLevel: 5,
    cost: { mana: 10 },
    effects: {
      maxEnergyFlat: 12.5,
    },
  },
};

const imbueDefinitions = {
  huntingLure: {
    label: "Imbue Hunting Lure",
    description: "Bind mana into a small food lure that can skip tracking at a hunt location.",
    requiredLocation: "camp",
    cost: {
      food: 1,
      mana: 2,
    },
    produces: {
      resource: "huntingLure",
      amount: 1,
    },
    story: "You fold mana into the food until it carries a tempting, deliberate trail-scent.",
  },

  manaCrystal: {
    label: "Create Mana Crystal",
    description: "Compress a full reserve of mana into a new stable crystal.",
    requiredLocation: "camp",
    cost: {
      mana: 20,
      focus: 5,
    },
    produces: {
      resource: "manaCrystal",
      amount: 1,
    },
    requires: {
      flags: ["manaCrystalImbuingUnlocked"],
    },
    story: "You compress the mana inward until it hardens into a clear, steady crystal.",
  },

  staminaTonic: {
    label: "Imbue Weak Stamina Tonic",
    description: "Bind a small charge into one stamina tonic base, filling an empty tonic slot.",
    requiredLocation: "alchemistsHut",
    campUpgradeRequired: "campAlchemyStation",
    cost: {
      mana: 2,
    },
    campCost: {
      mana: 2,
      staminaTonicBase: 1,
    },
    storageCost: {
      staminaTonicBase: 1,
    },
    producesConsumable: {
      resource: "staminaTonic",
      amount: 1,
    },
    story: "You bind mana into the prepared base. The tonic sharpens, bitter and ready.",
  },

  improvedStaminaTonic: {
    label: "Imbue Concentrated Stamina Tonic",
    description: "Bind mana into one concentrated tonic base, filling an empty tonic slot with a stronger tonic.",
    requiredLocation: "alchemistsHut",
    campUpgradeRequired: "campAlchemyStation",
    cost: {
      mana: 5,
    },
    campCost: {
      mana: 5,
      concentratedTonicBase: 1,
    },
    storageCost: {
      concentratedTonicBase: 1,
    },
    producesConsumable: {
      resource: "improvedStaminaTonic",
      amount: 1,
    },
    story: "You bind mana into the concentrated base. The tonic clears, sharp and potent.",
  },

  manaTonic: {
    label: "Imbue Minor Mana Tonic",
    description: "Bind mana into one mana tonic base, filling an empty tonic slot with field-ready mana recovery.",
    requiredLocation: "alchemistsHut",
    campUpgradeRequired: "campAlchemyStation",
    cost: {
      mana: 8,
    },
    campCost: {
      mana: 8,
      manaTonicBase: 1,
    },
    storageCost: {
      manaTonicBase: 1,
    },
    producesConsumable: {
      resource: "manaTonic",
      amount: 1,
    },
    story: "You bind a steady charge into the glimmerleaf base. The tonic cools around the mana instead of letting it fade.",
  },

  majorManaTonic: {
    label: "Imbue Major Mana Tonic",
    description: "Bind a deeper charge into glimmerleaf and concentrated tonic base, filling an empty tonic slot with stronger mana recovery.",
    requiredLocation: "alchemistsHut",
    campUpgradeRequired: "campAlchemyStation",
    duration: 3,
    cost: {
      mana: 12,
    },
    campCost: {
      mana: 12,
      manaTonicBase: 1,
      concentratedTonicBase: 1,
    },
    storageCost: {
      manaTonicBase: 1,
      concentratedTonicBase: 1,
    },
    producesConsumable: {
      resource: "majorManaTonic",
      amount: 1,
    },
    story: "You bind a dense, layered charge into the prepared base. The tonic brightens around a deeper reservoir of mana.",
  },

  chargedCrystal: {
    label: "Charge Mana Crystal",
    description: "Store mana inside an existing crystal for later tower and automation work.",
    requiredLocation: "camp",
    cost: {
      mana: 5,
      manaCrystal: 1,
    },
    produces: {
      resource: "chargedCrystal",
      amount: 1,
    },
    story: "The crystal catches the Gearworks rhythm and holds a steady inner charge.",
  },

  chargedCrystalCluster: {
    label: "Charge Crystal Cluster",
    description: "Charge several mana crystals in one stable tower-scale pattern.",
    requiredLocation: "camp",
    duration: 4,
    cost: {
      mana: 16,
      manaCrystal: 4,
    },
    produces: {
      resource: "chargedCrystal",
      amount: 4,
    },
    story: "Four crystals answer the same pattern at once, each holding a clean, steady charge.",
  },
};

const arcaneForceDefinitions = {
  nails: {
    label: "Shape Nails",
    description: "Use directed pressure to shape one iron into ten nails.",
    requiredLocation: "camp",
    requiredForceLevel: 0,
    duration: 2,
    cost: {
      mana: 4,
      iron: 1,
    },
    produces: {
      resource: "nails",
      amount: 10,
    },
    story: "You press the iron through a narrow force pattern until it draws into a neat row of nails.",
  },

  crudeIronPickHead: {
    label: "Shape Pick Head",
    description: "Shape the iron head needed to assemble a crude iron pick.",
    requiredLocation: "camp",
    requiredForceLevel: 0,
    duration: 10,
    cost: {
      mana: 10,
      iron: 3,
    },
    produces: {
      resource: "crudeIronPickHead",
      amount: 1,
    },
    requires: {
      researchCompleted: ["crudeIronPick"],
      notPurchasedGear: ["crudeIronPick"],
      resourcesBelowMax: {
        crudeIronPickHead: 1,
      },
    },
    story: "You press force through the iron until it draws into the rough wedge of a pick head.",
  },

  ironKnifeBlade: {
    label: "Shape Knife Blade",
    description: "Shape the iron blade needed to assemble an iron knife.",
    requiredLocation: "camp",
    requiredForceLevel: 1,
    duration: 5,
    cost: {
      mana: 5,
      iron: 1,
    },
    produces: {
      resource: "ironKnifeBlade",
      amount: 1,
    },
    requires: {
      researchCompleted: ["ironTools"],
      notPurchasedGear: ["ironKnife"],
      resourcesBelowMax: {
        ironKnifeBlade: 1,
      },
    },
    story: "You pull the iron thin and keen, holding the edge in shape with steady pressure.",
  },

  ironAxeHead: {
    label: "Shape Axe Head",
    description: "Shape the iron head needed to assemble an iron axe.",
    requiredLocation: "camp",
    requiredForceLevel: 1,
    duration: 8,
    cost: {
      mana: 10,
      iron: 3,
    },
    produces: {
      resource: "ironAxeHead",
      amount: 1,
    },
    requires: {
      researchCompleted: ["ironTools"],
      notPurchasedGear: ["ironAxe"],
      resourcesBelowMax: {
        ironAxeHead: 1,
      },
    },
    story: "You fold force through the iron until the axe head holds its weight and bite.",
  },

  herbPatch: {
    label: "Force Harvest Herbs",
    description: "Sweep a controlled pressure wave through the patch to gather a large bundle of herbs.",
    requiredLocation: "wildHerbPatch",
    requiredForceLevel: 3,
    duration: 3,
    cost: {
      mana: 6,
    },
    carriedProduces: {
      resource: "herb",
      amount: 25,
    },
    story: "Arcane Force combs the patch in one careful sweep, snapping useful stems free without bruising them.",
    partialStory: "Arcane Force shakes loose more herbs than you can carry.",
  },

  glimmerleafField: {
    label: "Force Harvest Glimmerleaf",
    description: "Lift the fragile glimmerleaf with even pressure before the field can tangle around it.",
    requiredLocation: "overgrownFields",
    requiredForceLevel: 3,
    duration: 3,
    cost: {
      mana: 6,
    },
    carriedProduces: {
      resource: "glimmerleaf",
      amount: 10,
    },
    story: "A careful pulse of Force lifts silver-veined leaves from the rows before the surrounding growth can tear them.",
    partialStory: "The field yields more glimmerleaf than your pack can hold.",
  },

  oreNode: {
    label: "Detonate Ore Node",
    description: "Crack an ore-rich node with a focused burst of pressure.",
    requiredLocation: "ironMine",
    requiredForceLevel: 4,
    duration: 4,
    cost: {
      mana: 8,
    },
    carriedProduces: {
      resource: "ore",
      amount: 10,
    },
    story: "Force blooms inside the vein with a dull crack, dropping heavy chunks of ore at your feet.",
    partialStory: "The burst frees more ore than you can carry.",
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
    text: "Learn the nearby woods well enough to travel them with purpose. Master each place you find, then complete a full outskirts route.",
    items: [
      {
        label: "Master the camp outskirts",
        isComplete: function () {
          return gameState.tier2Complete;
        },
      },
      {
        getLabel: function () {
          const location = getExpeditionLocation("mysteriousPlants");
          const label = location && location.explored ? location.exploredLabel || location.label : location && location.label;

          return "Master " + (label || "Mysterious Plants");
        },
        isVisible: function () {
          const location = getExpeditionLocation("mysteriousPlants");
          return !!location && location.discovered;
        },
        isComplete: function () {
          const research = getResearch("cordage");
          return !!research && research.completed;
        },
      },
      {
        getLabel: function () {
          const location = getExpeditionLocation("strangeTrails");
          const label = location && location.explored ? location.exploredLabel || location.label : location && location.label;

          return "Master " + (label || "Strange Trails");
        },
        isVisible: function () {
          const location = getExpeditionLocation("strangeTrails");
          return !!location && location.discovered;
        },
        isComplete: function () {
          const research = getResearch("simpleTraps");
          return !!research && research.completed;
        },
      },
      {
        getLabel: function () {
          const location = getExpeditionLocation("creepyCave");
          const label = location && location.explored ? location.exploredLabel || location.label : location && location.label;

          return "Master " + (label || "Creepy Cave");
        },
        isVisible: function () {
          const location = getExpeditionLocation("creepyCave");
          return !!location && location.discovered;
        },
        isComplete: function () {
          const research = getResearch("stoneTools");
          return (!!research && research.completed) || hasPurchasedCampUpgrade("stoneFirePit");
        },
      },
    ],
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
  clearTowerFoundation: {
    title: "Clear The Tower Foundation",
    text: "Use the partial tower plans to clear and stabilize the buried foundation beneath camp.",
    items: [
      {
        label: "Complete the tower foundation project",
        isComplete: function () {
          const project = typeof getProjectState === "function" ? getProjectState("towerFoundation") : null;
          return !!project && project.completed;
        },
      },
    ],
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
  manaCrystalImbuingUnlocked: {
    title: "Crystal Binding Pattern",
    text: "The ruined alcove showed how raw mana can be pressed into a crystal lattice. With enough mana, you can create mana crystals at camp.",
  },
  manaAwakened: {
    title: "Mana Awakened",
    text: "The runes answered something inside you. Mana is not new to you, only forgotten.",
  },
  campFoundationSensed: {
    title: "Buried Foundation",
    text: "Mana Sense revealed a large stone foundation beneath camp. It feels deliberate, old, and far too large for a simple shelter.",
  },
  automationPrinciplesFound: {
    title: "Automation Principles",
    text: "The Silent Gearworks used mana to repeat simple tasks. The machines were not intelligent, but they could remember a pattern while the charge lasted.",
  },
  attunementLearned: {
    title: "Attunement",
    text: "The glass-antler stag did not transform itself. It briefly strengthened qualities it already possessed. You can imitate that pattern through your own gear and tools.",
  },
  imbueLearned: {
    title: "Imbuement",
    text: "The alchemist's old notes revealed that prepared matter can hold mana after you release it. Herbs shape the effect; Imbue fixes that effect into the finished tonic.",
  },
  arcaneForceLearned: {
    title: "Arcane Force",
    text: "The miners' smelter taught you that mana can become directed pressure: shaping iron, moving old locks, and breaking stubborn stone through restraint and will.",
  },
  arcaneArchiveOpened: {
    title: "Arcane Archive Opened",
    text: "The archive door required all four spells in one sustained ritual. Whatever waited inside was meant for someone with a broader command of mana.",
  },
  campAlchemyPlansFound: {
    title: "Camp Alchemy Plans",
    text: "Archive diagrams show how to build an alchemy station at camp, bringing the tonic workflow home instead of relying on the abandoned hut.",
  },
  campTanningPlansFound: {
    title: "Camp Tanning Plans",
    text: "The archive preserved a compact tannery design. With the right materials, camp could process hides without returning to the hunter's cabin.",
  },
  campSmeltingPlansFound: {
    title: "Camp Smelting Plans",
    text: "The smelter diagrams describe a camp furnace braced strongly enough for regular iron work with Arcane Force.",
  },
  manaCondenserPlansFound: {
    title: "Ancient Mana Condenser",
    text: "The condenser plans describe a machine that gathers diffuse mana and slowly condenses it into crystals.",
  },
  partialTowerPlansFound: {
    title: "Partial Tower Plans",
    text: "The tower plans match the buried foundation beneath camp, but the archive only preserved fragments. More plans will be needed before construction can begin.",
  },
  towerFoundationStarted: {
    title: "Tower Foundation",
    text: "The partial plans are incomplete, but they show enough to clear and stabilize the buried foundation beneath camp.",
  },
  towerFoundationAwakened: {
    title: "Foundation Awakened",
    text: "Charged crystals woke the restored channels beneath camp. The foundation is ready for whatever tower plans you can recover next.",
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
