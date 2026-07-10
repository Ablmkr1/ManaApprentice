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
    value: 10,
    maxValue: 10,
    perClick: 0,
    perSecond: 0,
    display: null,
    perClickDisplay: null,
    perSecondDisplay: null,
  },
  food: {
    label: "Food",
    value: 10,
    maxValue: 10,
    perClick: 0,
    perSecond: 0,
    display: null,
    perClickDisplay: null,
    perSecondDisplay: null,
  },
  wood: {
    label: "Wood",
    value: 20,
    maxValue: 20,
    perClick: 0,
    perSecond: 0,
    display: null,
    perClickDisplay: null,
    perSecondDisplay: null,
  },
  fiber: {
    label: "Fiber",
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
      energy: 10,
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
    label: "Begin Expedition",
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
      energy: 10,
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
  travelToMysteriousPlants: {
    label: "Travel to Mysterious Plants",
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
};

//State Engine
const gameState = {
  phase: "clearing",

  resting: false,

  restStartTime: null,

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
    completed: false,
    currentLocation: null,
    distance: 0,
    targetDistance: 100,

    carriedItems: {
      food: 0,
      fiber: 0,
    },
    carryCapacity: 5,

    water: 0,
    waterCapacity: 10,
  },
};
