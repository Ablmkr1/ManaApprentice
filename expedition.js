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
  lockAction("setTrap");
  lockAction("checkTrap");

  if (!locationName) return;

  const location = expeditionLocations[locationName];

  if (!location) return;

  if (!location.explored) {
    unlockAction("exploreLocation");
    return;
  }

  if (location.availableActions) {
    location.availableActions.forEach((actionName) => {
      if (canUseLocationAction(locationName, actionName)) {
        unlockAction(actionName);
      }
    });
  }
}

function canUseLocationAction(locationName, actionName) {
  const location = expeditionLocations[locationName];

  if (actionName === "setTrap") {
    return location.traps && location.traps.installed < location.traps.max && gameState.expedition.carriedItems.trap > 0;
  }

  if (actionName === "checkTrap") {
    return location.traps && location.traps.installed > 0;
  }

  return true;
}

// Check Expedition Modifiers Cost
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

// Carry Helpers
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
  refreshExpeditionUI();

  return true;
}

function addCarriedItemUpToCapacity(itemName, amount) {
  const availableSpace = gameState.expedition.carryCapacity - getCarriedTotal();
  const amountToCarry = Math.min(amount, availableSpace);

  if (amountToCarry <= 0) return 0;

  const carriedItems = gameState.expedition.carriedItems;

  if (!carriedItems[itemName]) {
    carriedItems[itemName] = 0;
  }

  carriedItems[itemName] += amountToCarry;
  refreshExpeditionUI();

  return amountToCarry;
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

  refreshExpeditionUI();

  return true;
}

function canAffordWater(amount) {
  return gameState.expedition.water >= amount;
}

function spendWater(amount) {
  if (!canAffordWater(amount)) return false;

  gameState.expedition.water -= amount;
  refreshExpeditionUI();

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

// Cargo Helpers
function transferCarriedItemsToCamp() {
  const carriedItems = gameState.expedition.carriedItems;

  for (let itemName in carriedItems) {
    addResource(itemName, carriedItems[itemName]);
    unlockResource(itemName);

    if (itemName === "pelt") {
      unlockGearUpgrade("waterskin");
      unlockGearUpgrade("crudeBackpack");
    }
  }

  gameState.expedition.carriedItems = {};
  refreshExpeditionUI();
}

function clearCurrentLocationActions() {
  clearCurrentLocation();
}

// Expedition Step Engine
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

// Start Expedition Function
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
  refreshExpeditionUI();
}

// End Expedition Function
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
  unlockAction("beginExpedition");
  setPackingActionsAvailable(false);
  updateDestinationActions();

  if (reason === "completed") {
    expedition.completed = true;
    addStoryEntry("You reach the edge of your planned route and return with new knowledge of the wilds.");
  }

  if (reason === "exhausted") {
    addStoryEntry("Your strength gives out. You turn back toward the clearing.");
  }

  refreshExpeditionUI();
}

// Explore Current Location Function
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

    addStoryEntry(location.label + " understood: " + location.exploredLabel + ".");

    if (location.unlocks) {
      applyUnlocks(location.unlocks);
    }

    updateLocationActions();
  }
}

function toggleTraveling() {
  const expedition = gameState.expedition;

  if (!expedition.active) return;

  expedition.traveling = !expedition.traveling;

  if (expedition.traveling) {
    expedition.travelStartTime = Date.now();
    addStoryEntry("You press onward.");
    clearCurrentLocation();
    setPackingActionsAvailable(false);
  } else {
    expedition.travelStartTime = null;
    addStoryEntry("You pause your expedition.");
  }

  updateTravelButton(gameState.expedition.traveling);
}

function stopTraveling() {
  const expedition = gameState.expedition;

  expedition.traveling = false;
  expedition.travelStartTime = null;

  updateTravelButton(gameState.expedition.traveling);
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
  refreshExpeditionUI();

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
  updateDestinationAction("mysteriousPlants", "travelToMysteriousPlants");
  updateDestinationAction("strangeTrails", "travelToStrangeTrails");
}

function updateDestinationAction(locationName, actionName) {
  const location = expeditionLocations[locationName];
  const action = actions[actionName];

  if (!location || !action) return;

  if (action.button) {
    const label = action.button.querySelector("span");

    if (label) {
      label.textContent = "Travel to " + getLocationLabel(locationName);
    }
  }

  if (!gameState.expedition.active && location.discovered) {
    unlockAction(actionName);
  } else {
    lockAction(actionName);
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

function refreshExpeditionUI() {
  updateExpeditionUI(getCarriedTotal(), getCarriedSummary());
}

//Helper to Toggle Packing Buttons
function setPackingActionsAvailable(available) {
  if (!available) {
    lockAction("packFood");
    lockAction("packWater");
    lockAction("packTrap");
    return;
  }

  if (gameState.expedition.distance > 0 || gameState.expedition.traveling) {
    return;
  }

  unlockAction("packFood");
  unlockAction("packWater");

  if (resources.trap.display && resources.trap.display.style.display !== "none") {
    unlockAction("packTrap");
  }
}

function prepareExpedition() {
  const expedition = gameState.expedition;

  expedition.active = true;
  expedition.returning = false;
  expedition.completed = false;
  expedition.distance = 0;

  clearCurrentLocation();

  lockAction("beginExpedition");
  unlockAction("travel");
  unlockAction("returnToCamp");

  setCampActionsAvailable(false);
  setPackingActionsAvailable(true);
  updateDestinationActions();

  addStoryEntry("You sort through your supplies and prepare to leave the clearing.");
  refreshExpeditionUI();
}

function prepareDestinationTravel(locationName) {
  const location = expeditionLocations[locationName];

  if (!location || !location.discovered) return;

  const expedition = gameState.expedition;

  expedition.active = true;
  expedition.destination = locationName;
  expedition.distance = 0;
  expedition.completed = false;
  expedition.returning = false;

  clearCurrentLocation();

  lockAction("beginExpedition");
  lockAction("travelToMysteriousPlants");
  lockAction("travelToStrangeTrails");

  unlockAction("travel");
  unlockAction("returnToCamp");

  setCampActionsAvailable(false);
  setPackingActionsAvailable(true);

  addStoryEntry("You prepare to travel to " + getLocationLabel(locationName) + ".");
  refreshExpeditionUI();
}
