function setCurrentLocation(locationName) {
  gameState.expedition.currentLocation = locationName;

  updateLocationActions();
  updatePlacePanel();
}

function clearCurrentLocation() {
  gameState.expedition.currentLocation = null;

  updateLocationActions();
  updatePlacePanel();
}

function updateLocationActions() {
  const locationName = gameState.expedition.currentLocation;

  lockLocationActions();

  if (!locationName) return;

  const location = getExpeditionLocation(locationName);

  if (!location) return;

  if (!location.explored) {
    unlockAction("exploreLocation");
    return;
  }

  if (location.availableActions) {
    location.availableActions.forEach((actionName) => {
      unlockAction(actionName);
    });
  }
}

function lockLocationActions() {
  getLocationActionNames().forEach((actionName) => {
    lockAction(actionName);
  });
}

function getLocationActionNames() {
  const actionNames = ["exploreLocation"];

  const locations = getExpeditionLocationDefinitions();

  for (let locationName in locations) {
    const location = locations[locationName];

    if (!location.availableActions) continue;

    location.availableActions.forEach((actionName) => {
      if (!actionNames.includes(actionName)) {
        actionNames.push(actionName);
      }
    });
  }

  return actionNames;
}

function formatCarryAmount(value) {
  return Math.round(value * 100) / 100;
}

// Check Expedition Modifiers Cost
function getAffordableExpeditionModifiers() {
  const affordableModifiers = [];

  const modifierDefinitions = getExpeditionModifierDefinitions();

  for (let modifierName in modifierDefinitions) {
    const modifier = getExpeditionModifier(modifierName);

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
    total += carriedItems[itemName] * getCarriedItemWeight(itemName);
  }

  return formatCarryAmount(total);
}

const carriedItemWeights = {
  stone: 2,
};

function getCarriedItemWeight(itemName) {
  return carriedItemWeights[itemName] || 1;
}

function hasCarrySpace(itemName, amount) {
  return getCarriedTotal() + amount * getCarriedItemWeight(itemName) <= gameState.expedition.carryCapacity;
}

function addCarriedItem(itemName, amount) {
  if (!hasCarrySpace(itemName, amount)) return false;

  const carriedItems = gameState.expedition.carriedItems;

  if (!carriedItems[itemName]) {
    carriedItems[itemName] = 0;
  }

  carriedItems[itemName] += amount;
  refreshExpeditionUI();

  return true;
}

function addCarriedItemUpToCapacity(itemName, amount) {
  const itemWeight = getCarriedItemWeight(itemName);
  const availableSpace = gameState.expedition.carryCapacity - getCarriedTotal();
  const amountToCarry = Math.min(amount, Math.floor(availableSpace / itemWeight));

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
      parts.push(itemName + ": " + formatCarryAmount(carriedItems[itemName]));
    }
  }

  if (parts.length === 0) return "empty";

  return parts.join(", ");
}

function applyReturnPenalty() {
  const expedition = gameState.expedition;
  const dropChance = expedition.returnPenalty;

  if (dropChance <= 0) return;

  const carriedItems = expedition.carriedItems;
  let lostSomething = false;

  if (carriedItems.food && carriedItems.food > 0) {
    delete carriedItems.food;
    lostSomething = true;
  }

  if (expedition.water > 0) {
    expedition.water = 0;
    lostSomething = true;
  }

  for (let itemName in carriedItems) {
    if (itemName === "food") continue;

    const currentAmount = carriedItems[itemName];
    let keptAmount = 0;

    for (let i = 0; i < currentAmount; i++) {
      if (Math.random() >= dropChance) {
        keptAmount++;
      }
    }

    if (keptAmount < currentAmount) {
      lostSomething = true;
    }

    if (keptAmount <= 0) {
      delete carriedItems[itemName];
    } else {
      carriedItems[itemName] = keptAmount;
    }
  }

  expedition.returnPenalty = 0;

  if (lostSomething) {
    addStoryEntry("Food and water are spent on the hard return, and some supplies are lost along the way.");
  }
}

// Cargo Helpers
function transferCarriedItemsToCamp() {
  const carriedItems = gameState.expedition.carriedItems;

  for (let itemName in carriedItems) {
    if (carriedItems[itemName] <= 0) continue;

    addResource(itemName, carriedItems[itemName]);
    unlockResource(itemName);

    const returnUnlocks = expeditionReturnUnlocks[itemName];

    if (returnUnlocks) {
      applyUnlocks(returnUnlocks);
    }
  }

  gameState.expedition.carriedItems = {};
  refreshExpeditionUI();
}

//Unlock Return Unlocker
// Immediate rewards for bringing a resource back to camp.
// Deeper equipment/camp discoveries should live in recipes.
const expeditionReturnUnlocks = {
  fiber: [{ type: "storageUpgrade", id: "fiberStorage" }],

  stone: [
    { type: "campUpgrade", id: "stoneFirePit" },
    { type: "campUpgrade", id: "packedStoneFloor" },
    { type: "storageUpgrade", id: "stoneStorage" },
  ],
};

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

  const smellyShoes = getGearUpgrade("smellyShoes");

  if (smellyShoes && smellyShoes.purchased) {
    step.distance += 0.5;
  }

  const expedition = gameState.expedition;
  const canUseTravelModifiers = !expedition.returning || canAffordCost({ energy: step.energyCost });

  const affordableModifiers = canUseTravelModifiers ? getAffordableExpeditionModifiers() : [];

  for (let i = 0; i < affordableModifiers.length; i++) {
    const modifierName = affordableModifiers[i];
    const modifier = getExpeditionModifier(modifierName);

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
    const modifier = getExpeditionModifier(modifierName);

    spendModifierCost(modifier);
  }

  spendCost({ energy: finalEnergyCost });

  return {
    success: true,
    step,
  };
}

function applyExpeditionStep(step) {
  const expedition = gameState.expedition;

  if (expedition.returning) {
    expedition.distance = Math.max(0, expedition.distance - step.distance);
    return;
  }

  expedition.distance += step.distance;
}

function beginReturnToCamp(reason) {
  const expedition = gameState.expedition;

  if (!expedition.active) return;

  expedition.returning = true;

  expedition.returnPenalty = reason === "exhausted" ? 0.25 : 0;

  expedition.destination = null;
  expedition.currentLocation = null;

  lockAction("returnToCamp");
  updateLocationActions();
  setPackingActionsAvailable(false);

  if (reason === "manual") {
    addStoryEntry("You turn back toward camp.");
  }

  if (reason === "exhausted") {
    addStoryEntry("Your strength gives out. You turn back toward camp with what you can carry.");
  }

  refreshExpeditionUI();
  updatePlacePanel();
}

// End Expedition Function
function endExpedition(reason) {
  const expedition = gameState.expedition;

  stopTraveling();

  expedition.active = false;
  expedition.returning = false;

  applyReturnPenalty();
  transferCarriedItemsToCamp();
  checkRecipeDiscoveries();
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
  updatePlacePanel();
}

// Explore Current Location Function
function exploreCurrentLocation() {
  const locationName = gameState.expedition.currentLocation;

  if (!locationName) return;

  const location = getExpeditionLocation(locationName);

  if (!location || location.explored) return;

  location.explorationProgress++;

  const storyIndex = location.explorationProgress - 1;

  if (location.exploreStory[storyIndex]) {
    addStoryEntry(location.exploreStory[storyIndex]);
  }

  if (location.explorationProgress >= location.explorationRequired) {
    location.explored = true;

    if (getAction("exploreLocation").metaProgressBar) {
      getAction("exploreLocation").metaProgressBar.style.width = "0%";
    }

    updateDestinationActions();

    addStoryEntry(location.label + " understood: " + location.exploredLabel + ".");

    if (location.unlocks) {
      applyUnlocks(location.unlocks);
    }

    checkRecipeDiscoveries();
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
  updatePlacePanel();
}

function stopTraveling() {
  const expedition = gameState.expedition;

  expedition.traveling = false;
  expedition.travelStartTime = null;

  updateTravelButton(gameState.expedition.traveling);
  updatePlacePanel();
}

function processTravelTick() {
  const expedition = gameState.expedition;

  if (!expedition.active || !expedition.traveling) return;

  const travelDuration = 1000;

  const elapsed = Date.now() - expedition.travelStartTime;
  const progress = Math.min(elapsed / travelDuration, 1);

  if (getAction("travel").progressBar) {
    getAction("travel").progressBar.style.width = progress * 100 + "%";
  }

  if (progress < 1) return;

  getAction("travel").progressBar.style.width = "0%";
  expedition.travelStartTime = Date.now();

  const result = resolveExpeditionStep();

  updateResource("energy");

  if (!result.success && result.reason === "notEnoughEnergy") {
    if (!expedition.returning) {
      stopTraveling();
      beginReturnToCamp("exhausted");
      return;
    }

    applyExpeditionStep(result.step);
    refreshExpeditionUI();

    if (expedition.distance <= 0) {
      stopTraveling();
      endExpedition("returned");
    }

    return;
  }

  applyExpeditionStep(result.step);
  refreshExpeditionUI();

  if (expedition.returning && expedition.distance <= 0) {
    stopTraveling();
    endExpedition("returned");
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

  const location = getExpeditionLocation(expedition.destination);

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
  renderDestinationActions();
}

function getLocationLabel(locationName) {
  const location = getExpeditionLocation(locationName);

  if (!location) return locationName;

  if (location.explored && location.exploredLabel) {
    return location.exploredLabel;
  }

  return location.label;
}

function updatePlacePanel() {
  const expedition = gameState.expedition;

  if (expedition.traveling) {
    if (expedition.returning) {
      safeSetText(ui.campPanelTitle, "Returning to Camp");
      safeSetText(ui.locationDescription, "You are making your way back to camp.");
    } else {
      safeSetText(ui.campPanelTitle, "Traveling");
      safeSetText(ui.locationDescription, "You are moving through the wilds.");
    }

    hideElement(ui.campContent);
    showElement(ui.locationContent, "block");
    updateTrapSitesUI(null);
    return;
  }

  if (expedition.returning) {
    safeSetText(ui.campPanelTitle, "Returning to Camp");
    safeSetText(ui.locationDescription, "You are on the trail back to camp.");
    hideElement(ui.campContent);
    showElement(ui.locationContent, "block");
    updateTrapSitesUI(null);
    return;
  }

  if (expedition.currentLocation) {
    const location = getExpeditionLocation(expedition.currentLocation);

    updateTrapSitesUI(location);

    safeSetText(ui.campPanelTitle, getLocationLabel(expedition.currentLocation));
    safeSetText(ui.locationDescription, getLocationPanelText(location));
    hideElement(ui.campContent);
    showElement(ui.locationContent, "block");
    return;
  }

  const restLabel = ui.restBtn ? ui.restBtn.querySelector("span") : null;

  if (gameState.phase === "expedition") {
    safeSetText(ui.campPanelTitle, "Camp");
    safeSetText(restLabel, "Rest at Camp");
  } else if (gameState.phase === "clearing") {
    safeSetText(ui.campPanelTitle, "Clearing");
    safeSetText(restLabel, "Rest in Clearing");
  } else {
    safeSetText(ui.campPanelTitle, "Lost in the Woods");
    safeSetText(restLabel, "Rest");
  }

  showElement(ui.campContent, "block");
  hideElement(ui.locationContent);
  updateTrapSitesUI(null);
}

function updateTrapSitesUI(location) {
  if (!ui.trapSitesList) return;

  ui.trapSitesList.innerHTML = "";

  if (!location || !location.trapSites || !location.explored) {
    hideElement(ui.trapSitesList);
    return;
  }

  showElement(ui.trapSitesList, "block");

  location.trapSites.sites.forEach((site, index) => {
    const row = document.createElement("div");
    row.classList.add("trap-site-row");

    row.textContent = getTrapSiteLabel(site, index);

    ui.trapSitesList.appendChild(row);
  });
}

function getFirstOpenTrapSite(locationName) {
  const sites = getTrapSites(locationName);

  if (!sites) return null;

  for (let i = 0; i < sites.length; i++) {
    if (sites[i].discovered && !sites[i].installed) {
      return sites[i];
    }
  }

  return null;
}

function resetTrapSiteChecks() {
  const locations = getExpeditionLocationDefinitions();

  for (let locationName in locations) {
    const sites = getTrapSites(locationName);

    if (!sites) continue;

    sites.forEach((site) => {
      site.checkedThisVisit = false;
    });
  }
}

function getFirstUncheckedInstalledTrapSite(locationName) {
  const sites = getTrapSites(locationName);

  if (!sites) return null;

  for (let i = 0; i < sites.length; i++) {
    if (sites[i].discovered && sites[i].installed && !sites[i].checkedThisVisit) {
      return sites[i];
    }
  }

  return null;
}

function getTrapSiteData(locationName) {
  const location = getExpeditionLocation(locationName);

  if (!location || !location.trapSites) return null;

  return location.trapSites;
}

function getTrapSiteLabel(site, index) {
  if (!site.discovered) {
    return "Unknown Trail";
  }

  const siteName = site.label || "Trail " + (index + 1);

  if (!site.installed) {
    return siteName + ": Open";
  }

  if (site.checkedThisVisit) {
    return siteName + ": Empty";
  }

  return siteName + ": Ready to Check";
}

function getTrapSites(locationName) {
  const location = getExpeditionLocation(locationName);

  if (!location || !location.trapSites) return null;

  return location.trapSites.sites;
}

function getFirstHiddenTrapSite(locationName) {
  const sites = getTrapSites(locationName);

  if (!sites) return null;

  for (let i = 0; i < sites.length; i++) {
    if (!sites[i].discovered) {
      return sites[i];
    }
  }

  return null;
}

function hasOpenTrapSite(locationName) {
  const sites = getTrapSites(locationName);

  if (!sites) return false;

  return sites.some((site) => site.discovered && !site.installed);
}

function hasUncheckedInstalledTrapSite(locationName) {
  const sites = getTrapSites(locationName);

  if (!sites) return false;

  return sites.some((site) => site.discovered && site.installed && !site.checkedThisVisit);
}

function getLocationPanelText(location) {
  if (!location) return "";

  if (location.panelText) {
    if (location.explored && location.panelText.explored) {
      return location.panelText.explored;
    }

    if (location.panelText.discovered) {
      return location.panelText.discovered;
    }
  }

  return location.onDiscoverStory || "";
}

function checkExpeditionDiscovery() {
  const expedition = gameState.expedition;

  const locations = getExpeditionLocationDefinitions();

  for (let locationName in locations) {
    const location = locations[locationName];

    if (!isLocationDiscoverable(location)) continue;

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

function hasRequiredResources(requiredResources) {
  if (!requiredResources) return true;

  for (let resourceName in requiredResources) {
    const resource = getResource(resourceName);

    if (!resource || resource.value < requiredResources[resourceName]) {
      return false;
    }
  }

  return true;
}

function isLocationDiscoverable(location) {
  if (!location) return false;

  if (location.discovered) return false;

  if (!location.requires) return true;

  if (location.requires.locationsExplored) {
    for (let i = 0; i < location.requires.locationsExplored.length; i++) {
      const requiredLocation = getExpeditionLocation(location.requires.locationsExplored[i]);

      if (!requiredLocation || !requiredLocation.explored) {
        return false;
      }
    }
  }

  if (location.requires.gearPurchased) {
    for (let i = 0; i < location.requires.gearPurchased.length; i++) {
      if (!hasPurchasedGear(location.requires.gearPurchased[i])) {
        return false;
      }
    }
  }

  if (!hasRequiredResources(location.requires.resources)) {
    return false;
  }

  if (!hasRequiredTools(location.requires.tools)) {
    return false;
  }

  return true;
}

function hasPurchasedGear(gearName) {
  const gear = getGearUpgrade(gearName);

  return !!gear && gear.purchased;
}

function hasRequiredTools(requiredTools) {
  if (!requiredTools) return true;

  if (!gameState.tools) return false;

  for (let i = 0; i < requiredTools.length; i++) {
    const toolName = requiredTools[i];

    if (!gameState.tools[toolName] || !gameState.tools[toolName].owned) {
      return false;
    }
  }

  return true;
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

  const trap = getResource("trap");

  if (trap.display && trap.display.style.display !== "none") {
    unlockAction("packTrap");
  }
}

function enterExpeditionPreparation() {
  const expedition = gameState.expedition;

  expedition.active = true;
  expedition.returning = false;
  expedition.completed = false;
  expedition.distance = 0;
  expedition.returnPenalty = 0;

  resetTrapSiteChecks();
  clearCurrentLocation();

  lockAction("beginExpedition");
  unlockAction("travel");
  unlockAction("returnToCamp");

  setCampActionsAvailable(false);
  setPackingActionsAvailable(true);
}

function prepareOpenExpedition() {
  gameState.expedition.destination = null;

  enterExpeditionPreparation();

  updateDestinationActions();

  addStoryEntry("You sort through your supplies and prepare to leave the clearing.");
  refreshExpeditionUI();
  updatePlacePanel();
}

function prepareDestinationTravel(locationName) {
  const location = getExpeditionLocation(locationName);

  if (!location || !location.discovered) return;

  gameState.expedition.destination = locationName;

  enterExpeditionPreparation();
  renderDestinationActions();

  addStoryEntry("You prepare to travel to " + getLocationLabel(locationName) + ".");
  refreshExpeditionUI();
  updatePlacePanel();
}

function renderDestinationActions() {
  if (!ui.destinationActions) return;

  ui.destinationActions.innerHTML = "";

  const locations = getExpeditionLocationDefinitions();

  for (let locationName in locations) {
    const location = getExpeditionLocation(locationName);

    if (!location || !location.discovered || gameState.expedition.active) continue;

    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("action-btn");
    button.textContent = "Travel to " + getLocationLabel(locationName);

    button.addEventListener("click", function () {
      prepareDestinationTravel(locationName);
    });

    ui.destinationActions.appendChild(button);
  }
}
