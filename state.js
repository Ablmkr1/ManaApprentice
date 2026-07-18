const resources = {
  energy: {
    label: "Energy",
    value: 0,
    maxValue: 10,
    perClick: 10,
    perSecond: 0,
    restPerSecond: 10,
    display: null,
    perClickDisplay: null,
    perSecondDisplay: null,
  },
  mana: {
    label: "Mana",
    value: 0,
    maxValue: 10,
    perClick: 1,
    perSecond: 0,
    display: null,
    perClickDisplay: null,
    perSecondDisplay: null,
  },
  water: {
    label: "Water",
    value: 0,
    maxValue: 0,
    perClick: 1,
    perSecond: 0,
    display: null,
    perClickDisplay: null,
    perSecondDisplay: null,
  },
  food: {
    label: "Food",
    value: 0,
    maxValue: 10,
    perClick: 1,
    perSecond: 0,
    display: null,
    perClickDisplay: null,
    perSecondDisplay: null,
  },
  wood: {
    label: "Wood",
    value: 0,
    maxValue: 20,
    perClick: 1,
    perSecond: 0,
    display: null,
    perClickDisplay: null,
    perSecondDisplay: null,
  },
  fiber: {
    label: "Fiber",
    value: 0,
    maxValue: 20,
    perClick: 1,
    perSecond: 0,
    display: null,
    perClickDisplay: null,
    perSecondDisplay: null,
  },
  trap: {
    label: "Trap",
    value: 0,
    maxValue: 5,
    perClick: 0,
    perSecond: 0,
    display: null,
    perClickDisplay: null,
    perSecondDisplay: null,
  },
  pelt: {
    label: "Pelt",
    value: 0,
    maxValue: 20,
    perClick: 0,
    perSecond: 0,
    display: null,
    perClickDisplay: null,
    perSecondDisplay: null,
  },
  stone: {
    label: "Stone",
    value: 0,
    maxValue: 20,
    perClick: 0,
    perSecond: 0,
    display: null,
    perClickDisplay: null,
    perSecondDisplay: null,
  },
};

const actions = {
  explore: {
    label: "Explore",
    duration: 1,
    cost: {
      energy: 5,
    },
    unlocked: true,
    running: false,

    button: null,
    progressBar: null,
    metaProgressBar: null,

    onStart: function () {},
    onComplete: function () {},
  },

  catchBreath: {
    label: "Catch Breath",
    duration: 1,
    cost: {},
    unlocked: true,
    running: false,

    button: null,
    progressBar: null,
    metaProgressBar: null,

    onStart: function () {},
    onComplete: function () {},
  },

  gatherWood: {
    label: "Gather Wood",
    duration: 1,
    cost: {
      energy: 4,
    },
    unlocked: false,
    running: false,
    auto: { resource: "wood", resumeAfterRest: true },

    button: null,
    progressBar: null,
    metaProgressBar: null,

    onStart: function () {},
    onComplete: function () {},
  },

  gatherFood: {
    label: "Gather Food",
    duration: 1.5,
    cost: {
      energy: 3,
    },
    unlocked: false,
    running: false,
    auto: { resource: "food", resumeAfterRest: true },

    button: null,
    progressBar: null,
    metaProgressBar: null,

    onStart: function () {},
    onComplete: function () {},
  },

  gatherWater: {
    label: "Gather Water",
    duration: 1,
    cost: {
      energy: 2,
    },
    unlocked: false,
    running: false,
    auto: { resource: "water", resumeAfterRest: true },

    button: null,
    progressBar: null,
    metaProgressBar: null,

    onStart: function () {},
    onComplete: function () {},
  },

  travel: {
    label: "Travel",
    duration: 1,
    cost: {},
    unlocked: false,
    running: false,
    button: null,
    progressBar: null,
    metaProgressBar: null,
    onStart: function () {},
    onComplete: function () {},
  },

  packFood: {
    label: "Pack Food",
    duration: 0,
    cost: {
      food: 1,
    },
    unlocked: false,
    running: false,
    button: null,
    progressBar: null,
    metaProgressBar: null,
    onStart: function () {},
    onComplete: function () {},
  },

  packWater: {
    label: "Pack Water",
    duration: 0,
    cost: {},
    unlocked: false,
    running: false,
    button: null,
    progressBar: null,
    metaProgressBar: null,
    onStart: function () {},
    onComplete: function () {},
  },

  beginExpedition: {
    label: "Prepare for Expedition",
    duration: 1,
    cost: {},
    unlocked: false,
    running: false,
    button: null,
    progressBar: null,
    metaProgressBar: null,
    onStart: function () {},
    onComplete: function () {},
  },

  exploreLocation: {
    label: "Explore Location",
    duration: 1,
    cost: {
      energy: 6,
    },
    unlocked: false,
    running: false,
    button: null,
    progressBar: null,
    metaProgressBar: null,
    onStart: function () {},
    onComplete: function () {},
  },

  gatherFiber: {
    label: "Gather Fiber",
    duration: 1,
    cost: {
      energy: 1,
    },
    unlocked: false,
    running: false,
    button: null,
    progressBar: null,
    metaProgressBar: null,
    onStart: function () {},
    onComplete: function () {},
  },
  returnToCamp: {
    label: "Return to Camp",
    duration: 1,
    cost: {},
    unlocked: false,
    running: false,
    button: null,
    progressBar: null,
    metaProgressBar: null,
    onStart: function () {},
    onComplete: function () {},
  },

  packTrap: {
    label: "Pack Trap",
    duration: 0,
    cost: {
      trap: 1,
    },
    unlocked: false,
    running: false,
    button: null,
    progressBar: null,
    metaProgressBar: null,
    onStart: function () {},
    onComplete: function () {},
  },
  setTrap: {
    label: "Set Trap",
    duration: 1,
    cost: {
      energy: 7,
    },
    unlocked: false,
    running: false,
    button: null,
    progressBar: null,
    metaProgressBar: null,
    onStart: function () {},
    onComplete: function () {},
  },
  checkTrap: {
    label: "Check Trap",
    duration: 1,
    cost: {
      energy: 2,
    },
    unlocked: false,
    running: false,
    button: null,
    progressBar: null,
    metaProgressBar: null,
    onStart: function () {},
    onComplete: function () {},
  },
  scoutTrapSite: {
    label: "Scout Trail",
    duration: 1,
    cost: {
      energy: 5,
    },
    unlocked: false,
    running: false,
    button: null,
    progressBar: null,
    metaProgressBar: null,
    onStart: function () {},
    onComplete: function () {},
  },
  gatherStone: {
    label: "Gather Stone",
    duration: 1,
    cost: {
      energy: 2,
    },
    unlocked: false,
    running: false,
    button: null,
    progressBar: null,
    metaProgressBar: null,
    onStart: function () {},
    onComplete: function () {},
  },
};

//State Engine
const gameState = {
  phase: "lost",

  autoAction: {
    actionName: null,
    pausedForRest: false,
  },

  activity: {
    active: false,
    kind: null,
    type: null,
    id: null,
    label: null,
    startTime: null,
    duration: 0,
    interval: false,
    context: null,
  },

  exploration: {
    currentStage: "findClearing",
    count: 0,
  },

  currentGoalId: "surviveTheWoods",
  journal: {
    entries: [],
  },

<<<<<<< HEAD
  world: {
    selectedRegion: "outskirts",
    regions: {
      outskirts: {
        unlocked: true,
        progress: 100,
        mastered: true,
        locations: ["Fibrous Plants", "Animal Trails", "Creepy Cave", "Abandoned Camp"],
      },
      north: {
        unlocked: false,
        progress: 0,
        mastered: false,
        locations: [],
      },
      east: {
        unlocked: false,
        progress: 0,
        mastered: false,
        locations: [],
      },
      south: {
        unlocked: false,
        progress: 0,
        mastered: false,
        locations: [],
      },
      west: {
        unlocked: false,
        progress: 0,
        mastered: false,
        locations: [],
      },
    },
  },

=======
>>>>>>> 86ac9513542bd256aa795f218e5db58adf7168cf
  discoveredClearing: false,
  discoveredStream: false,
  discoveredBerryBush: false,
  discoveredDeadfall: false,
  tier2Complete: false,
  knownOutskirtsPathsUnlocked: false,
  oldMapFound: false,
  tier3Unlocked: false,
  ruinedTorchFound: false,
  ruinedJournalFound: false,
  researchUnlocked: false,
  torchResearched: false,
  magicUnlocked: false,

  destination: null,

  hasCamp: false,

  expedition: {
    active: false,
    discoveredSomething: false,
    returning: false,
    returnPenalty: 0,
    completed: false,
    currentLocation: null,
    distance: 0,
    targetDistance: 100,

    carriedItems: {
      food: 0,
      fiber: 0,
      trap: 0,
    },
    carryCapacity: 5,

    water: 0,
    waterCapacity: 0,
  },
};
