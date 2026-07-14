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
    duration: 0.1,
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
    duration: 0.1,
    cost: {
      water: 1,
    },
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
    duration: 0.1,
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
    cost: {},
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

  resting: false,
  restStartTime: null,

  autoAction: {
    actionName: null,
    pausedForRest: false,
  },

  crafting: {
    active: false,
    type: null,
    id: null,
    startTime: null,
    duration: 0,
  },

  exploration: {
    currentStage: "findClearing",
    count: 0,
  },

  discoveredClearing: false,
  discoveredStream: false,
  discoveredBerryBush: false,
  discoveredDeadfall: false,

  destination: null,

  hasCamp: false,

  expedition: {
    active: false,
    traveling: false,
    discoveredSomething: false,
    travelStartTime: null,
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
