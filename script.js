const introPopup = document.getElementById("introPopup");
const continueBtn = document.getElementById("continueBtn");
const game = { exploreCount: 0 };

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
  health: {
    label: "Health",
    value: 0,
    maxValue: 100,
    perClick: 0,
    perSecond: 0,
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

const upgrades = {
  energyFocus: {
    label: "Cardio",
    cost: 10,
    costMultiplier: 1.5,
    effect: function () {
      resources.energy.perSecond += 1;
    },
    display: null,
  },
  healthHabit: {
    label: "Build Habit",
    cost: 10,
    costMultiplier: 1.5,
    effect: function () {
      resources.health.perSecond += 1;
    },
    display: null,
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

window.onload = function () {
  //Establish Buttons
  const studyBtn = document.getElementById("studyBtn");
  const exerciseBtn = document.getElementById("exerciseBtn");
  const upgradeBtn = document.getElementById("upgradeBtn");
  const habitBtn = document.getElementById("habitBtn");
  const nergyUpgradeText = document.getElementById("nergyUpgradeText");
  const healthUpgradeText = document.getElementById("healthUpgradeText");
  const restBtn = document.getElementById("restBtn");
  const clearingPopup = document.getElementById("clearingPopup");
  const clearingContinueBtn = document.getElementById("clearingContinueBtn");
  const campPanel = document.getElementById("campPanel");
  const streamPopup = document.getElementById("streamPopup");
  const streamContinueBtn = document.getElementById("streamContinueBtn");
  const waterAmount = document.getElementById("waterAmount");
  const foodAmount = document.getElementById("foodAmount");
  const woodAmount = document.getElementById("woodAmount");
  const resourcePanel = document.getElementById("resourcePanel");
  const smallFire = document.getElementById("smallFire");
  const crudeLeanTo = document.getElementById("crudeLeanTo");
  const smallFireBtn = document.getElementById("smallFireBtn");
  const crudeLeanToBtn = document.getElementById("crudeLeanToBtn");
  const gatherWoodBtn = document.getElementById("gatherWoodBtn");
  const expeditionPanel = document.getElementById("expeditionPanel");
  const expeditionDistanceAmount = document.getElementById(
    "expeditionDistanceAmount",
  );
  const packedFoodAmount = document.getElementById("packedFoodAmount");
  const packedWaterAmount = document.getElementById("packedWaterAmount");
  const fiberAmount = document.getElementById("fiberAmount");
  const resourceElements = {
    water: waterAmount,
    food: foodAmount,
    wood: woodAmount,
    fiber: fiberAmount,
  };
  const panelElements = {
    resources: resourcePanel,
    camp: campPanel,
    expedition: expeditionPanel,
  };

  //UI Unlock Resource and Panels
  function unlockResource(resourceName) {
    const resourceElement = resourceElements[resourceName];

    if (!resourceElement) {
      console.warn("Unknown resource unlock:", resourceName);
      return;
    }

    showElement(resourcePanel);
    showElement(resourceElement);
  }

  function unlockPanel(panelName) {
    const panel = panelElements[panelName];

    if (!panel) {
      console.warn("Unknown panel unlock:", panelName);
      return;
    }

    showElement(panel);
  }

  function applyUnlock(unlock) {
    if (unlock.type === "resource") {
      unlockResource(unlock.id);
      return;
    }

    if (unlock.type === "action") {
      unlockAction(unlock.id);
      return;
    }

    if (unlock.type === "campUpgrade") {
      unlockCampUpgrade(unlock.id);
      return;
    }

    if (unlock.type === "panel") {
      unlockPanel(unlock.id);
      return;
    }

    console.warn("Unknown unlock type:", unlock.type);
  }

  function applyUnlocks(unlocks) {
    unlocks.forEach(applyUnlock);
  }

  //UI Saftety Function
  function safeSetText(el, text) {
    if (el) {
      el.textContent = text;
    }
  }

  //Hook to UI Function
  function hookStatsToUI() {
    for (let resourceName in resources) {
      const resource = resources[resourceName];

      resource.display = document.getElementById(resourceName + "Amount");
      resource.perClickDisplay = document.getElementById(
        resourceName + "PerClickDisplay",
      );
      resource.perSecondDisplay = document.getElementById(
        resourceName + "PerSecondDisplay",
      );
    }
  }

  function hookUpgradesToUi() {
    for (let upgradeName in upgrades) {
      const upgradeUI = upgrades[upgradeName];

      upgradeUI.display = document.getElementById(upgradeName + "UpgradeText");
    }
  }

  //Hook Camp Upgrades to UI
  function hookCampUpgradestoUI() {
    for (let upgradeName in campUpgrades) {
      const upgrade = campUpgrades[upgradeName];

      upgrade.button = document.getElementById(upgradeName + "Btn");
      upgrade.display = document.getElementById(upgradeName);

      if (upgrade.button) {
        upgrade.button.addEventListener("click", function () {
          buyCampUpgrade(upgradeName);
        });
      }

      updateCampUpgradeUI(upgradeName);
    }
  }

  //Update Camp Upgrade UI
  function updateCampUpgradeUI(upgradeName) {
    const upgrade = campUpgrades[upgradeName];

    if (!upgrade) return;

    if (upgrade.button) {
      upgrade.button.style.display =
        upgrade.unlocked && !upgrade.purchased ? "inline-block" : "none";
    }

    if (upgrade.display) {
      upgrade.display.style.display = upgrade.purchased ? "flex" : "none";
    }
  }

  //UI Helpers
  function showElement(el, displayType = "flex") {
    if (el) {
      el.style.display = displayType;
    }
  }

  function hideElement(el) {
    if (el) {
      el.style.display = "none";
    }
  }

  //Add Resource Function
  function addResource(resourceName, amount) {
    const resource = resources[resourceName];

    resource.value += amount;
    if (resource.value >= resource.maxValue) {
      resource.value = resource.maxValue;
    }

    updateResource(resourceName);
  }

  //Can Afford Cost Function
  function canAffordCost(cost) {
    for (let resourceName in cost) {
      const resource = resources[resourceName];

      if (!resource) {
        console.warn("unknown resource", resourceName);
        return false;
      }

      if (resource.value < cost[resourceName]) {
        return false;
      }
    }
    return true;
  }

  //Spend Resource Cost Function
  function spendCost(cost) {
    if (!canAffordCost(cost)) return false;

    for (let resourceName in cost) {
      resources[resourceName].value -= cost[resourceName];
      updateResource(resourceName);
    }

    return true;
  }

  //Action onComplete
  actions.catchBreath.onComplete = function () {
    addResource("energy", resources.energy.perClick);
  };

  actions.gatherWood.onComplete = function () {
    addResource("wood", 1);
  };

  actions.exploreLocation.onComplete = function () {
    exploreCurrentLocation();
  };

  actions.gatherFiber.onComplete = function () {
    if (!addCarriedItem("fiber", 1)) {
      addStoryEntry("Your hands are full. You cannot carry more.");
    }
  };

  actions.returnToCamp.onComplete = function () {
    endExpedition("returned");
  };

  actions.travelToMysteriousPlants.onComplete = function () {
    startDestinationTravel("mysteriousPlants");
  };

  //Reusable Upgrade Function
  function buyUpgrade(upgradeName) {
    const upgrade = upgrades[upgradeName];

    const resourceKey = upgradeName === "energyFocus" ? "energy" : "health";

    const resource = resources[resourceKey];

    if (resource.value >= upgrade.cost) {
      resource.value -= upgrade.cost;

      upgrade.effect();

      upgrade.cost = Math.floor(upgrade.cost * upgrade.costMultiplier);

      upgrade.display.textContent = `(+1 ${resourceKey}/sec) - Cost: ${upgrade.cost}`;

      updateResource(resourceKey);
    }
  }

  //State Engine
  const gameState = {
    phase: "clearing",

    resting: false,

    restStartTime: null,

    exploration: {
      currentStage: "findClearing",
      count: 0,
    },

    discoveredClearning: false,
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
      discoveredSomething: false,
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

  //Expedition Location Definitions
  const expeditionLocations = {
    mysteriousPlants: {
      label: "Mysterious Plants",
      exploredLabel: "Fibrous Plants",
      distance: 20,
      discovered: false,
      explored: false,
      explorationProgress: 0,
      explorationRequired: 3,
      onDiscoverStory:
        "Clusters of unfamiliar plants grow beside the path, their pale stems twisting around one another.",
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

  function setCurrentLocation(locationName) {
    gameState.expedition.currentLocation = locationName;

    updateLocationActions();
  }

  function clearCurrentLocation() {
    gameState.expedition.currentLocation = null;

    updateLocationActions();
  }

  function updateLocationActions() {
    const locationName = gameState.expedition.currentLocation;

    lockAction("exploreLocation");
    lockAction("gatherFiber");

    if (!locationName) return;

    const location = expeditionLocations[locationName];

    if (!location) return;

    if (!location.explored) {
      unlockAction("exploreLocation");
      return;
    }

    if (locationName === "mysteriousPlants" && location.explored) {
      unlockAction("gatherFiber");
    }
  }

  //Expedition Modifiers
  const expeditionModifiers = {
    food: {
      storage: "carried",
      cost: {
        food: 0.25,
      },
      apply: function (step) {
        step.distance *= 2;
      },
    },

    water: {
      storage: "water",
      cost: 0.5,
      apply: function (step) {
        step.energyCost *= 0.5;
      },
    },
  };

  //Check Expedition Modifiers Cost
  function getAffordableExpeditionModifiers() {
    const affordableModifiers = [];

    for (let modifierName in expeditionModifiers) {
      const modifier = expeditionModifiers[modifierName];

      if (canAffordModifierCost(modifier)) {
        affordableModifiers.push(modifierName);
      }
    }

    return affordableModifiers;
  }

  //Expedition Inventory Cost Helps
  //Can Afford
  function canAffordExpeditionCost(cost) {
    const inventory = gameState.expedition.inventory;

    for (let resourceName in cost) {
      if (inventory[resourceName] === undefined) {
        console.warn("Unknown expedition inventory resource:", resourceName);
        return false;
      }

      if (inventory[resourceName] < cost[resourceName]) {
        return false;
      }
    }

    return true;
  }

  //Spend Cost Expedition Inventory
  function spendExpeditionCost(cost) {
    if (!canAffordExpeditionCost(cost)) return false;

    const inventory = gameState.expedition.inventory;

    for (let resourceName in cost) {
      inventory[resourceName] -= cost[resourceName];
    }

    return true;
  }

  //Carry Helpers
  function getCarriedTotal() {
    const carriedItems = gameState.expedition.carriedItems;
    let total = 0;

    for (let itemName in carriedItems) {
      total += carriedItems[itemName];
    }

    return total;
  }

  function hasCarrySpace(amount) {
    return getCarriedTotal() + amount <= gameState.expedition.carryCapacity;
  }

  function addCarriedItem(itemName, amount) {
    if (!hasCarrySpace(amount)) return false;

    const carriedItems = gameState.expedition.carriedItems;

    if (!carriedItems[itemName]) {
      carriedItems[itemName] = 0;
    }

    carriedItems[itemName] += amount;
    updateExpeditionUI();

    return true;
  }

  function removeCarriedItem(itemName, amount) {
    const carriedItems = gameState.expedition.carriedItems;

    if (!carriedItems[itemName] || carriedItems[itemName] < amount) {
      return false;
    }

    carriedItems[itemName] -= amount;

    if (carriedItems[itemName] <= 0) {
      delete carriedItems[itemName];
    }

    updateExpeditionUI();

    return true;
  }

  function canAffordWater(amount) {
    return gameState.expedition.water >= amount;
  }

  function spendWater(amount) {
    if (!canAffordWater(amount)) return false;

    gameState.expedition.water -= amount;
    updateExpeditionUI();

    return true;
  }

  function canAffordModifierCost(modifier) {
    if (modifier.storage === "carried") {
      return canAffordCarriedCost(modifier.cost);
    }

    if (modifier.storage === "water") {
      return canAffordWater(modifier.cost);
    }

    console.warn("Unknown modifier storage:", modifier.storage);
    return false;
  }

  function spendModifierCost(modifier) {
    if (modifier.storage === "carried") {
      return spendCarriedCost(modifier.cost);
    }

    if (modifier.storage === "water") {
      return spendWater(modifier.cost);
    }

    console.warn("Unknown modifier storage:", modifier.storage);
    return false;
  }

  function getCarriedSummary() {
    const carriedItems = gameState.expedition.carriedItems;
    const parts = [];

    for (let itemName in carriedItems) {
      if (carriedItems[itemName] > 0) {
        parts.push(itemName + ": " + carriedItems[itemName]);
      }
    }

    if (parts.length === 0) return "empty";

    return parts.join(", ");
  }

  //Cargo Helpers
  function transferCarriedItemsToCamp() {
    const carriedItems = gameState.expedition.carriedItems;

    for (let itemName in carriedItems) {
      addResource(itemName, carriedItems[itemName]);
      if (itemName === "fiber") {
        unlockResource("fiber");
      }
    }

    gameState.expedition.carriedItems = {};
    updateExpeditionUI();
  }

  function setCampActionsAvailable(available) {
    if (available) {
      if (gameState.discoveredDeadfall) {
        unlockAction("gatherWood");
      }

      if (gameState.phase === "clearing") {
        unlockAction("explore");
      }

      restBtn.style.display = "inline-block";
    } else {
      lockAction("gatherWood");
      lockAction("explore");
      restBtn.style.display = "none";
    }
  }

  function clearCurrentLocationActions() {
    clearCurrentLocation();
  }

  //Expedition Step Engine
  function resolveExpeditionStep() {
    const step = {
      energyCost: 1,
      distance: 1,
      duration: 1,
      modifiersUsed: [],
    };

    const affordableModifiers = getAffordableExpeditionModifiers();

    for (let i = 0; i < affordableModifiers.length; i++) {
      const modifierName = affordableModifiers[i];
      const modifier = expeditionModifiers[modifierName];

      modifier.apply(step);
      step.modifiersUsed.push(modifierName);
    }

    const finalEnergyCost = step.energyCost;

    if (!canAffordCost({ energy: finalEnergyCost })) {
      return {
        success: false,
        reason: "notEnoughEnergy",
        step,
      };
    }

    for (let i = 0; i < step.modifiersUsed.length; i++) {
      const modifierName = step.modifiersUsed[i];
      const modifier = expeditionModifiers[modifierName];

      spendModifierCost(modifier);
    }

    spendCost({ energy: finalEnergyCost });

    gameState.expedition.distance += step.distance;

    return {
      success: true,
      step,
    };
  }

  //Start Expedition Function
  function startExpedition() {
    const expedition = gameState.expedition;

    expedition.active = true;
    expedition.returning = false;
    expedition.completed = false;
    expedition.distance = 0;
    clearCurrentLocation();

    lockAction("packFood");
    lockAction("packWater");
    lockAction("beginExpedition");
    unlockAction("travel");
    setCampActionsAvailable(false);
    unlockAction("returnToCamp");
    updateDestinationActions();

    addStoryEntry("You leave the clearing behind and begin your expedition.");
    updateExpeditionUI();
  }

  //End Expedition Function
  function endExpedition(reason) {
    const expedition = gameState.expedition;

    stopTraveling();

    expedition.active = false;
    expedition.returning = false;

    transferCarriedItemsToCamp();
    clearCurrentLocationActions();
    setCampActionsAvailable(true);

    lockAction("returnToCamp");
    lockAction("travel");
    unlockAction("packFood");
    unlockAction("packWater");
    unlockAction("beginExpedition");
    updateDestinationActions();

    if (reason === "completed") {
      expedition.completed = true;
      addStoryEntry(
        "You reach the edge of your planned route and return with new knowledge of the wilds.",
      );
    }

    if (reason === "exhausted") {
      addStoryEntry(
        "Your strength gives out. You turn back toward the clearing.",
      );
    }

    updateExpeditionUI();
  }

  //Explore Current Location Function
  function exploreCurrentLocation() {
    const locationName = gameState.expedition.currentLocation;

    if (!locationName) return;

    const location = expeditionLocations[locationName];

    if (!location || location.explored) return;

    location.explorationProgress++;

    const storyIndex = location.explorationProgress - 1;

    if (location.exploreStory[storyIndex]) {
      addStoryEntry(location.exploreStory[storyIndex]);
    }

    if (location.explorationProgress >= location.explorationRequired) {
      location.explored = true;

      updateDestinationActions();

      addStoryEntry(
        location.label + " understood: " + location.exploredLabel + ".",
      );

      if (location.onExplored) {
        location.onExplored();
      }

      updateLocationActions();
    }
  }

  //Exploration Engine
  const explorationStages = {
    findClearing: {
      required: 1,
      story: [
        "You stumble forward, mind in a daze...",
        "The forest clears ahead...",
        "You can rest here.",
        "You need water, food, shelter.",
      ],
      unlocks: [{ type: "panel", id: "camp" }],
      onComplete: function () {
        gameState.discoveredClearning = true;
        showClearingPopup();
      },
      nextStage: "findStream",
    },

    findStream: {
      required: 1,
      story: [
        "You hear something that makes your thirst grow.",
        "Your stomach rumbles.",
      ],
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
      story: [
        "Your hunger grows sharper.",
        "What's hanging from that bush across the stream?",
      ],
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
      story: [
        "Your hunger grows sharper.",
        "What's hanging from that bush across the stream?",
      ],
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

  actions.travel.onComplete = function () {
    toggleTraveling();
  };

  function toggleTraveling() {
    const expedition = gameState.expedition;

    if (!expedition.active) return;

    expedition.traveling = !expedition.traveling;

    if (expedition.traveling) {
      expedition.travelStartTime = Date.now();
      addStoryEntry("You press onward.");
      clearCurrentLocation();
    } else {
      expedition.travelStartTime = null;
      addStoryEntry("You pause your expedition.");
    }

    updateTravelButton();
  }

  function stopTraveling() {
    const expedition = gameState.expedition;

    expedition.traveling = false;
    expedition.travelStartTime = null;

    updateTravelButton();
  }

  function updateTravelButton() {
    const travelButton = actions.travel.button;

    if (!travelButton) return;

    const label = travelButton.querySelector("span");

    if (label) {
      label.textContent = gameState.expedition.traveling
        ? "Pause Travel"
        : "Travel";
    }
  }

  function processTravelTick() {
    const expedition = gameState.expedition;

    if (!expedition.active || !expedition.traveling) return;

    const travelDuration = 1000;

    const elapsed = Date.now() - expedition.travelStartTime;
    const progress = Math.min(elapsed / travelDuration, 1);

    if (actions.travel.progressBar) {
      actions.travel.progressBar.style.width = progress * 100 + "%";
    }

    if (progress < 1) return;

    actions.travel.progressBar.style.width = "0%";
    expedition.travelStartTime = Date.now();

    const result = resolveExpeditionStep();

    updateResource("energy");
    updateExpeditionUI();

    if (!result.success && result.reason === "notEnoughEnergy") {
      stopTraveling();
      endExpedition("exhausted");
      return;
    }

    if (checkDestinationArrival()) {
      stopTraveling();
      return;
    }

    if (checkExpeditionDiscovery()) {
      stopTraveling();
      return;
    }

    if (expedition.distance >= expedition.targetDistance) {
      stopTraveling();
      endExpedition("completed");
    }
  }

  function checkDestinationArrival() {
    const expedition = gameState.expedition;

    if (!expedition.destination) return false;

    const location = expeditionLocations[expedition.destination];

    if (!location) return false;

    if (expedition.distance >= location.distance) {
      setCurrentLocation(expedition.destination);
      expedition.destination = null;

      addStoryEntry("You arrive at " + location.label + ".");

      return true;
    }

    return false;
  }

  function updateDestinationActions() {
    const mysteriousPlants = expeditionLocations.mysteriousPlants;
    const action = actions.travelToMysteriousPlants;

    if (action && action.button) {
      const label = action.button.querySelector("span");

      if (label) {
        label.textContent = "Travel to " + getLocationLabel("mysteriousPlants");
      }
    }

    if (!gameState.expedition.active && mysteriousPlants.discovered) {
      unlockAction("travelToMysteriousPlants");
    } else {
      lockAction("travelToMysteriousPlants");
    }
  }

  function getLocationLabel(locationName) {
    const location = expeditionLocations[locationName];

    if (!location) return locationName;

    if (location.explored && location.exploredLabel) {
      return location.exploredLabel;
    }

    return location.label;
  }

  function startDestinationTravel(locationName) {
    const location = expeditionLocations[locationName];

    if (!location || !location.discovered) return;

    const expedition = gameState.expedition;

    expedition.active = true;
    expedition.destination = locationName;
    expedition.distance = 0;
    expedition.completed = false;
    expedition.returning = false;

    clearCurrentLocation();

    lockAction("packFood");
    lockAction("packWater");
    lockAction("beginExpedition");
    lockAction("travelToMysteriousPlants");

    unlockAction("travel");
    unlockAction("returnToCamp");

    setCampActionsAvailable(false);
    updateDestinationActions();

    addStoryEntry("You set out toward " + location.label + ".");
    updateExpeditionUI();
  }

  function checkExpeditionDiscovery() {
    const expedition = gameState.expedition;

    for (let locationName in expeditionLocations) {
      const location = expeditionLocations[locationName];

      if (location.discovered) continue;

      if (expedition.distance >= location.distance) {
        location.discovered = true;
        setCurrentLocation(locationName);

        addStoryEntry(location.onDiscoverStory);

        updateDestinationActions();

        return true;
      }
    }

    return false;
  }

  actions.beginExpedition.onComplete = function () {
    startExpedition();
  };

  actions.travel.onComplete = function () {
    toggleTraveling();
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

  //Buy Camp Upgrade Function
  function buyCampUpgrade(upgradeName) {
    const upgrade = campUpgrades[upgradeName];

    if (!upgrade || !upgrade.unlocked || upgrade.purchased) return;

    //Check and Spend Cost
    if (!spendCost(upgrade.cost)) return;

    upgrade.onComplete();
    upgrade.purchased = true;
    upgrade.unlocked = false;

    updateCampUpgradeUI(upgradeName);
    checkClearingComplete();
  }

  //Unlock Camp Upgrade Function
  function unlockCampUpgrade(upgradeName) {
    const upgrade = campUpgrades[upgradeName];

    if (!upgrade) {
      console.warn("Unknown camp upgrade:", upgradeName);
      return;
    }

    upgrade.unlocked = true;
    updateCampUpgradeUI(upgradeName);
  }

  //Lock Camp Upgrade Function
  function lockCampUpgrade(upgradeName) {
    const upgrade = campUpgrades[upgradeName];

    if (!upgrade) {
      console.warn("Unknown camp upgrade:", upgradeName);
      return;
    }

    upgrade.unlocked = false;
    updateCampUpgradeUI(upgradeName);
  }

  // Get Explore Function
  function getCurrentExploreStage() {
    const stage = explorationStages[gameState.exploration.currentStage];

    if (!stage) {
      console.warn(
        "Unknown exploration stage:",
        gameState.exploration.currentStage,
      );
      return null;
    }

    return stage;
  }

  //Phase Helper
  function setPhase(phaseName) {
    gameState.phase = phaseName;
    console.log("Phase changed:", phaseName);

    if (phaseName === "expedition") {
      lockAction("explore");
    }

    if (phaseName === "expedition") {
      lockAction("explore");

      applyUnlocks([
        { type: "panel", id: "expedition" },
        { type: "action", id: "packFood" },
        { type: "action", id: "packWater" },
        { type: "action", id: "beginExpedition" },
      ]);

      updateExpeditionUI();
      updateDestinationActions();
    }
  }

  //Camp Upgrade Purchase Checker
  function hasPurchasedCampUpgrade(upgradeName) {
    const upgrade = campUpgrades[upgradeName];

    return !!upgrade && upgrade.purchased;
  }

  //Check Clearning Complete Phase Helper
  function checkClearingComplete() {
    const hasSmallFire = hasPurchasedCampUpgrade("smallFire");
    const hasCrudeLeanTo = hasPurchasedCampUpgrade("crudeLeanTo");

    if (gameState.phase === "clearing" && hasSmallFire && hasCrudeLeanTo) {
      setPhase("expedition");
      addStoryEntry(
        "With fire and shelter established, the clearing feels less like a refuge and more like a camp. It is time to range farther.",
      );
    }
  }

  //Discover Clearing Popup & Function & CampDisplay
  function showClearingPopup() {
    clearingPopup.style.display = "flex";
  }

  function showStreamPopup() {
    streamPopup.style.display = "flex";
  }

  function showCampPanel() {
    campPanel.style.display = "flex";
  }

  clearingContinueBtn.addEventListener("click", function () {
    clearingPopup.style.display = "none";

    lockAction("catchBreath");

    restBtn.style.display = "inline-block";
    updateRestButton();
  });

  streamContinueBtn.addEventListener("click", function () {
    streamPopup.style.display = "none";
  });

  //On Complete Functions
  actions.explore.onComplete = function () {
    const stage = getCurrentExploreStage();

    if (!stage) return;

    gameState.exploration.count++;

    const storyIndex = gameState.exploration.count - 1;

    if (stage.story[storyIndex]) {
      addStoryEntry(stage.story[storyIndex]);
    }

    if (gameState.exploration.count >= stage.required) {
      if (stage.unlocks) {
        applyUnlocks(stage.unlocks);
      }

      if (stage.onComplete) {
        stage.onComplete();
      }

      if (stage.nextStage) {
        resetExploreMetaProgress(stage.nextStage);
      }
    }
  };

  actions.packFood.onComplete = function () {
    if (!addCarriedItem("food", 1)) {
      addResource("food", 1);
    }
  };

  actions.packWater.onComplete = function () {
    const expedition = gameState.expedition;

    if (expedition.water >= expedition.waterCapacity) {
      addResource("water", 1);
      return;
    }

    expedition.water++;
    updateExpeditionUI();
  };

  function canAffordCarriedCost(cost) {
    const carriedItems = gameState.expedition.carriedItems;

    for (let itemName in cost) {
      if (!carriedItems[itemName] || carriedItems[itemName] < cost[itemName]) {
        return false;
      }
    }

    return true;
  }

  function spendCarriedCost(cost) {
    if (!canAffordCarriedCost(cost)) return false;

    for (let itemName in cost) {
      removeCarriedItem(itemName, cost[itemName]);
    }

    return true;
  }

  function resetExploreMetaProgress(nextStageName) {
    gameState.exploration.currentStage = nextStageName;
    gameState.exploration.count = 0;

    if (actions.explore.metaProgressBar) {
      actions.explore.metaProgressBar.style.width = "0%";
    }
  }

  function addStoryEntry(text) {
    const storyLogPanel = document.getElementById("storyLog");

    const entry = document.createElement("div");
    entry.classList.add("story-entry");
    entry.textContent = text;
    storyLogPanel.appendChild(entry);
    storyLogPanel.scrollTop = storyLogPanel.scrollHeight;
  }

  //Initial Hook Call and Resource Update
  hookStatsToUI();
  hookUpgradesToUi();
  updateResource("energy");
  updateResource("health");
  hookActionButtons();
  hookCampUpgradestoUI();

  //Gerneral Update Function
  function updateResource(resourceName) {
    const resource = resources[resourceName];

    safeSetText(
      resource.display,
      resource.label +
        ": " +
        Math.floor(resource.value * 10) / 10 +
        " / " +
        resource.maxValue,
    );
    safeSetText(resource.perClickDisplay, "+" + resource.perClick + "/Click");
    safeSetText(resource.perSecondDisplay, "+" + resource.perSecond + "/Sec");
  }

  //Hook Action Button Function
  function hookActionButtons() {
    const buttons = document.querySelectorAll(".action-btn");

    buttons.forEach((btn) => {
      const actionName = btn.dataset.action;
      const action = actions[actionName];

      if (!action) return;

      action.button = btn;
      action.progressBar = btn.querySelector(".progressFill");
      action.metaProgressBar = btn.querySelector(".metaProgressFill");
      updateActionButton(actionName);

      btn.addEventListener("click", function () {
        runAction(actionName);
      });
    });
  }

  //Action help Functions
  //Update Action Button Helper
  function updateActionButton(actionName) {
    const action = actions[actionName];

    if (!action || !action.button) return;

    action.button.style.display = action.unlocked ? "inline-block" : "none";
  }

  function unlockAction(actionName) {
    const action = actions[actionName];

    if (!action) {
      console.warn("Unknown Action:", actionName);
      return;
    }

    action.unlocked = true;
    updateActionButton(actionName);
  }

  function lockAction(actionName) {
    const action = actions[actionName];

    if (!action) {
      console.warn("Unknown Action:", actionName);
      return;
    }

    action.unlocked = false;
    updateActionButton(actionName);
  }

  //Progress Funtion
  function runAction(actionName) {
    console.log("RUN ACTION FIRED:", actionName);

    const action = actions[actionName];

    console.log("ACTION FOUND:", action);

    //alert("Action triggered: " + actionName);
    if (!action || !action.unlocked || action.running) return;

    // Check and Pay Cost
    if (!spendCost(action.cost)) return;

    action.running = true;

    const duration = action.duration * 1000;
    const startTime = Date.now();

    if (action.onStart) {
      action.onStart();
    }

    const interval = setInterval(() => {
      let elapsed = Date.now() - startTime;
      let progress = Math.min(elapsed / duration, 1);

      // 1. Main progress bar
      if (action.progressBar) {
        action.progressBar.style.width = progress * 100 + "%";
      }

      // 2. Meta progress (if exists)
      if (action.metaProgressBar) {
        updateMetaProgress(action, progress);
      }

      // 3. Finish
      if (progress >= 1) {
        clearInterval(interval);

        action.running = false;

        if (action.progressBar) {
          action.progressBar.style.width = "0%";
        }

        if (action.onComplete) {
          action.onComplete();
        }
      }
    }, 50);
  }

  //Meta Progress Function
  function updateMetaProgress(action, progress) {
    const stage = getCurrentExploreStage();

    const target = stage.required;

    const current = gameState.exploration.count;

    const interpolated = (current + progress) / target;

    if (action.metaProgressBar) {
      action.metaProgressBar.style.width = interpolated * 100 + "%";
    }
  }

  function animateMetaBar(bar, target) {
    let current = parseFloat(bar.style.width) || 0;

    const interval = setInterval(() => {
      current += (target * 100 - current) * 0.01;
      bar.style.width = current + "%";
      if (Math.abs(current - target * 100) < 0.5) {
        bar.style.width = target * 100 + "%";
        clearInterval(interval);
      }
    }, 16);
  }

  //Update Expedition UI
  function updateExpeditionUI() {
    const expedition = gameState.expedition;

    safeSetText(
      expeditionDistanceAmount,
      "Distance: " + expedition.distance + " / " + expedition.targetDistance,
    );

    safeSetText(
      packedFoodAmount,
      "Carried: " +
        getCarriedTotal() +
        " / " +
        expedition.carryCapacity +
        " (" +
        getCarriedSummary() +
        ")",
    );

    safeSetText(
      packedWaterAmount,
      "Packed Water: " + expedition.water + " / " + expedition.waterCapacity,
    );
  }

  continueBtn.addEventListener("click", function () {
    introPopup.style.display = "none";

    addStoryEntry(explorationStages.findClearing.story[3]);
  });

  restBtn.addEventListener("click", function () {
    gameState.resting = !gameState.resting;

    if (gameState.resting) {
      gameState.restStartTime = Date.now();
    } else {
      gameState.restStartTime = null;

      const restProgressFill = restBtn.querySelector(".restProgressFill");
      restProgressFill.style.width = "0%";
    }

    updateRestButton();
  });

  //Rest Button Text Toggle
  function updateRestButton() {
    const restButtonText = restBtn.querySelector("span");

    if (gameState.resting) {
      restBtn.classList.add("running");
    } else {
      restBtn.classList.remove("running");
    }
  }

  //Passive Interval Function - Drives the passive resource updates
  function gameTick() {
    for (let resourceName in resources) {
      addResource(resourceName, resources[resourceName].perSecond / 20);
    }

    if (gameState.resting) {
      const restDuration = 1000;
      const restProgressFill = restBtn.querySelector(".restProgressFill");

      if (resources.energy.value >= resources.energy.maxValue) {
        gameState.resting = false;
        gameState.restStartTime = null;
        restProgressFill.style.width = "0%";
        updateRestButton();
        return;
      }

      const elapsed = Date.now() - gameState.restStartTime;
      const progress = Math.min(elapsed / restDuration, 1);

      restProgressFill.style.width = progress * 100 + "%";

      if (progress >= 1) {
        addResource("energy", resources.energy.restPerSecond);
        gameState.restStartTime = Date.now();
        restProgressFill.style.width = "0%";
      }
    }
    processTravelTick();
  }

  setInterval(gameTick, 50);

  updateResource("energy");
  updateResource("health");
};
