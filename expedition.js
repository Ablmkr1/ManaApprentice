const REGION_APPROACH_DISTANCE = 100;

function setCurrentLocation(locationName) {
  gameState.expedition.currentLocation = locationName;

  updateLocationActions();
  updateCraftingUIForCurrentContext();
  updatePlacePanel();
}

function clearCurrentLocation() {
  gameState.expedition.currentLocation = null;

  updateLocationActions();
  updateCraftingUIForCurrentContext();
  updatePlacePanel();
  updateRegionalMapVisibility();
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
  ore: 2,
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
  updateRegionalMapVisibility();
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

  if (isKnownPathTravelActive() || isOutskirtsTravelActive()) {
    step.distance *= 1.2;
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

  const regionId = expedition.regionId || "outskirts";
  const previousDistance = expedition.distance;

  expedition.distance += step.distance;

  if (regionId !== "outskirts") {
    const previousRegionalDistance = Math.max(0, previousDistance - REGION_APPROACH_DISTANCE);
    const currentRegionalDistance = Math.max(0, expedition.distance - REGION_APPROACH_DISTANCE);
    const regionalProgressGained = currentRegionalDistance - previousRegionalDistance;

    addRegionProgress(regionId, regionalProgressGained);
  }
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

function completeTier2Exploration() {
  if (gameState.tier2Complete) return;

  gameState.tier2Complete = true;
  gameState.knownOutskirtsPathsUnlocked = true;
  gameState.expedition.targetDistance = 120;
  setCurrentGoal("followTrail");
  addJournalEntry("outskirtsMastered");

  unlockLocation("mysteriousTrail");
  showOutskirtsCompletePopup();
}

function completeRegionalExploration(regionId) {
  const region = getRegionDefinition(regionId);

  if (!region) return;

  addRegionProgress(regionId, region.maxProgress);

  addStoryEntry("You complete a long route through " + region.label + ".");
}

function addRegionProgress(regionId, amount) {
  if (regionId === "outskirts") return;

  const region = getRegionDefinition(regionId);
  const regionState = gameState.world.regions[regionId];

  if (!region || !regionState || !regionState.unlocked) return;

  regionState.progress = Math.min(regionState.progress + amount, region.maxProgress);

  if (regionState.progress >= region.maxProgress) {
    regionState.mastered = true;
  }

  updateRegionalMapVisibility();
}

function getOpenExpeditionTargetDistance() {
  if (gameState.tier2Complete) return 120;

  return 100;
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
    const completedRegionId = expedition.regionId || "outskirts";

    expedition.completed = true;

    if (completedRegionId === "outskirts") {
      completeTier2Exploration();
      addStoryEntry("You reach the edge of your planned route and return with new knowledge of the wilds.");
    } else {
      completeRegionalExploration(completedRegionId);
    }
  }

  if (reason === "exhausted") {
    addStoryEntry("Your strength gives out. You turn back toward the clearing.");
  }

  updateRegionalMapVisibility();
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
    updateCraftingUIForCurrentContext();
    updateLocationActions();
  }
}

function toggleTraveling() {
  const expedition = gameState.expedition;

  if (!expedition.active) return;

  const isTraveling = isTravelActivityActive();

  if (isTraveling) {
    stopTraveling();
    addStoryEntry("You pause your expedition.");
  } else {
    startActivity({
      kind: "travel",
      id: "travel",
      duration: 1,
      interval: true,
    });

    addStoryEntry("You press onward.");
    clearCurrentLocation();
    setPackingActionsAvailable(false);
  }

  updateTravelButton(isTravelActivityActive());
  updateAllActionButtons();
  updateCraftingButtons();
  updatePlacePanel();
}

function stopTraveling() {
  if (isTravelActivityActive()) {
    resetProgressBar(getAction("travel"));
    resetActivity();
  }

  updateTravelButton(false);
  updatePlacePanel();
}

function checkDestinationArrival() {
  const expedition = gameState.expedition;

  if (!expedition.destination) return false;

  const location = getExpeditionLocation(expedition.destination);

  if (!location) return false;

  if (expedition.distance >= getLocationTravelDistance(location)) {
    setCurrentLocation(expedition.destination);
    expedition.destination = null;

    addStoryEntry("You arrive at " + location.label + ".");
    if (expedition.currentLocation === "mysteriousTrail") {
      setCurrentGoal("searchAbandonedCamp");
      addJournalEntry("abandonedCampFound");
    }

    return true;
  }

  return false;
}

function getLocationTravelDistance(location) {
  if (!location) return 0;

  const regionId = getLocationRegionId(location);

  if (regionId !== "outskirts") {
    return REGION_APPROACH_DISTANCE + location.distance;
  }

  if (gameState.knownOutskirtsPathsUnlocked && location.knownPathDistance) {
    return location.knownPathDistance;
  }

  return location.distance;
}

function isKnownPathTravelActive() {
  const expedition = gameState.expedition;

  if (!gameState.knownOutskirtsPathsUnlocked) return false;

  if (!expedition.destination) return false;

  const location = getExpeditionLocation(expedition.destination);

  return !!location && !!location.knownPathDistance;
}

function isOutskirtsTravelActive() {
  const expedition = gameState.expedition;

  if (!gameState.knownOutskirtsPathsUnlocked) return false;
  if (!expedition.active || expedition.returning) return false;

  if (!expedition.regionId || expedition.regionId === "outskirts") return true;

  return expedition.distance < REGION_APPROACH_DISTANCE;
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
  updateLocationStorageUI(null);

  if (isTravelActivityActive()) {
    if (expedition.returning) {
      safeSetText(ui.campPanelTitle, "Returning to Camp");
      safeSetText(ui.locationDescription, "You are making your way back to camp.");
    } else {
      safeSetText(ui.campPanelTitle, "Traveling");

      if (isOutskirtsTravelActive()) {
        safeSetText(ui.locationDescription, "You follow known paths through the camp outskirts.");
      } else {
        safeSetText(ui.locationDescription, "You press into unknown territory.");
      }
    }

    hideElement(ui.campContent);
    showElement(ui.locationContent, "block");
    updateTrapSitesUI(null);
    updateLocationObjectActionsUI(null);
    return;
  }

  if (expedition.returning) {
    safeSetText(ui.campPanelTitle, "Returning to Camp");
    safeSetText(ui.locationDescription, "You are on the trail back to camp.");
    hideElement(ui.campContent);
    showElement(ui.locationContent, "block");
    updateTrapSitesUI(null);
    updateLocationObjectActionsUI(null);
    return;
  }

  if (expedition.currentLocation) {
    const location = getExpeditionLocation(expedition.currentLocation);

    updateTrapSitesUI(location);
    updateLocationObjectActionsUI(location);
    updateLocationStorageUI(location);

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

  const storageUpgradeDefinitions = getStorageUpgradeDefinitions();

  for (let upgradeName in storageUpgradeDefinitions) {
    updateStorageUpgradeUI(upgradeName);
  }

  updateStorageSectionVisibility();
  updateTrapSitesUI(null);
  updateLocationObjectActionsUI(null);
}

function getLocationObject(locationName, objectName) {
  const location = getExpeditionLocation(locationName);

  if (!location || !location.explorableObjects) return null;

  return location.explorableObjects[objectName] || null;
}

function getLocationObjectButton(objectName) {
  if (!ui.locationObjectActions) return null;

  return ui.locationObjectActions.querySelector('[data-location-object="' + objectName + '"]');
}

function getLocationObjectProgress(object) {
  return object.progress || 0;
}

function getLocationObjectStages(object) {
  if (Array.isArray(object.stages)) {
    return object.stages;
  }

  return [
    {
      story: object.story,
      unlocks: object.unlocks,
    },
  ];
}

function isLocationObjectComplete(object) {
  return getLocationObjectProgress(object) >= getLocationObjectStages(object).length;
}

function getCurrentLocationObjectStage(object) {
  const stages = getLocationObjectStages(object);
  const progress = getLocationObjectProgress(object);

  return stages[progress] || null;
}

function startLocationObjectExploration(objectName) {
  const locationName = gameState.expedition.currentLocation;
  const object = getLocationObject(locationName, objectName);

  if (!object || isLocationObjectComplete(object)) return;
  if (!isLocationObjectAvailable(object)) return;

  if (isActivityActive()) return;
  if (!spendCost(object.cost || {})) return;

  startActivity({
    kind: "locationObject",
    id: objectName,
    duration: object.duration || 1,
    context: {
      locationName: locationName,
      objectName: objectName,
    },
  });

  updateLocationObjectActionsUI(getExpeditionLocation(locationName));
  updateAllActionButtons();
  updateCraftingButtons();
}

function completeLocationObjectExploration(locationName, objectName) {
  const location = getExpeditionLocation(locationName);
  const object = getLocationObject(locationName, objectName);

  if (!location || !object || isLocationObjectComplete(object)) return;

  const stage = getCurrentLocationObjectStage(object);

  object.progress = getLocationObjectProgress(object) + 1;

  if (stage && stage.story) {
    addStoryEntry(stage.story);
  }

  if (stage && stage.unlocks) {
    applyUnlocks(stage.unlocks);
    if (stage && stage.unlocks && stage.unlocks.some((unlock) => unlock.type === "flag" && unlock.id === "ruinedJournalFound")) {
      setCurrentGoal("researchTorch");
    }
    if (stage && stage.unlocks && stage.unlocks.some((unlock) => unlock.type === "flag" && unlock.id === "oldMapFound")) {
      setCurrentGoal("chooseRegion");
      updateRegionalMapVisibility();
    }
    if (stage.unlocks.some((unlock) => unlock.type === "flag" && unlock.id === "ruinedTorchFound")) {
      showTorchSparkPopup();
    }

    if (stage.unlocks.some((unlock) => unlock.type === "flag" && unlock.id === "magicUnlocked")) {
      showManaAwakenedPopup();
    }
  }

  checkRecipeDiscoveries();
  updateLocationObjectActionsUI(location);
  updateAllActionButtons();
  updateCraftingButtons();
}

function updateLocationObjectActionsUI(location) {
  if (!ui.locationObjectActions) return;

  ui.locationObjectActions.innerHTML = "";

  if (!location || !location.explorableObjects) {
    hideElement(ui.locationObjectActions);
    return;
  }

  const objects = location.explorableObjects;
  let hasVisibleObject = false;

  for (let objectName in objects) {
    const object = objects[objectName];

    if (isLocationObjectComplete(object)) continue;
    if (!isLocationObjectAvailable(object)) continue;

    hasVisibleObject = true;

    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("action-btn");
    button.dataset.locationObject = objectName;

    const progressFill = document.createElement("div");
    progressFill.classList.add("progressFill");

    const label = document.createElement("span");
    const stages = getLocationObjectStages(object);
    const progress = getLocationObjectProgress(object);

    if (stages.length > 1) {
      label.textContent = object.label + " (" + (progress + 1) + "/" + stages.length + ")";
    } else {
      label.textContent = object.label;
    }

    button.appendChild(progressFill);
    button.appendChild(label);

    const isCurrentObjectActivity =
      isActivityActive() && gameState.activity.kind === "locationObject" && gameState.activity.context.objectName === objectName;

    button.disabled = !isCurrentObjectActivity && (isActivityActive() || !canAffordCost(object.cost || {}));

    button.addEventListener("click", function () {
      startLocationObjectExploration(objectName);
    });

    ui.locationObjectActions.appendChild(button);
  }

  if (hasVisibleObject) {
    showElement(ui.locationObjectActions, "block");
  } else {
    hideElement(ui.locationObjectActions);
  }
}

function isLocationObjectAvailable(object) {
  if (!object.requires) return true;

  if (object.requires.gearPurchased) {
    for (let i = 0; i < object.requires.gearPurchased.length; i++) {
      if (!hasPurchasedGear(object.requires.gearPurchased[i])) {
        return false;
      }
    }
  }

  if (object.requires.flags) {
    for (let i = 0; i < object.requires.flags.length; i++) {
      if (!gameState[object.requires.flags[i]]) {
        return false;
      }
    }
  }

  return true;
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
  const regionId = getSelectedTravelRegionId();

  const locations = getExpeditionLocationDefinitions();

  for (let locationName in locations) {
    const location = locations[locationName];

    if (getLocationRegionId(location) !== regionId) continue;
    if (!isLocationDiscoverable(location)) continue;

    if (expedition.distance >= getLocationTravelDistance(location)) {
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
    lockAction("packPelt");
    lockAction("packWood");
    lockAction("packOre");
    hideElement(ui.packingSection);
    return;
  }

  if (gameState.expedition.distance > 0 || isTravelActivityActive()) {
    hideElement(ui.packingSection);
    return;
  }

  showElement(ui.packingSection, "flex");
  unlockAction("packFood");

  if (gameState.expedition.waterCapacity > 0 && gameState.expedition.water < gameState.expedition.waterCapacity) {
    unlockAction("packWater");
  } else {
    lockAction("packWater");
  }

  const trap = getResource("trap");

  if (trap.display && trap.display.style.display !== "none") {
    unlockAction("packTrap");
  }

  const leatherworking = getRecipe("leatherworking");
  const pelt = getResource("pelt");

  if (leatherworking && leatherworking.discovered && pelt.value > 0) {
    unlockAction("packPelt");
  } else {
    lockAction("packPelt");
  }

  const wood = getResource("wood");

  if (wood.value > 0) {
    unlockAction("packWood");
  } else {
    lockAction("packWood");
  }

  const ore = getResource("ore");

  if (ore.value > 0) {
    unlockAction("packOre");
  } else {
    lockAction("packOre");
  }
}

function enterExpeditionPreparation() {
  const expedition = gameState.expedition;

  expedition.active = true;
  expedition.returning = false;
  expedition.completed = false;
  expedition.distance = 0;
  if (expedition.destination) {
    const destination = getExpeditionLocation(expedition.destination);
    expedition.targetDistance = getLocationTravelDistance(destination);
  } else {
    expedition.targetDistance = getSelectedTravelDistance();
  }
  expedition.returnPenalty = 0;

  resetTrapSiteChecks();
  clearCurrentLocation();

  lockAction("beginExpedition");
  unlockAction("travel");
  unlockAction("returnToCamp");

  setCampActionsAvailable(false);
  setPackingActionsAvailable(true);
  updateCraftingUIForCurrentContext();
  updateRegionalMapVisibility();
}

function prepareOpenExpedition() {
  gameState.expedition.destination = null;
  gameState.expedition.regionId = gameState.world.selectedRegion || "outskirts";

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
  gameState.expedition.regionId = getLocationRegionId(location);

  enterExpeditionPreparation();
  renderDestinationActions();

  addStoryEntry("You prepare to travel to " + getLocationLabel(locationName) + ".");
  refreshExpeditionUI();
  updatePlacePanel();
}

function renderDestinationActions() {
  if (!ui.destinationActions) return;

  ui.destinationActions.innerHTML = "";

  if (gameState.expedition.active) return;

  const regionId = getSelectedTravelRegionId();
  const knownLocations = getRegionKnownLocations(regionId);

  knownLocations.forEach(function (locationName) {
    const location = getExpeditionLocation(locationName);

    if (!location) return;

    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("action-btn");
    button.textContent = "Travel to " + getLocationLabel(locationName) + " (" + formatDistance(getLocationTravelDistance(location)) + ")";

    button.addEventListener("click", function () {
      startActivity({
        kind: "instant",
        id: "destinationTravel",
        context: { locationName: locationName },
      });
    });

    ui.destinationActions.appendChild(button);
  });
}

function isTravelActivityActive() {
  return isActivityActive() && gameState.activity.kind === "travel";
}

function getSelectedTravelRegionId() {
  if (gameState.expedition.active && gameState.expedition.regionId) {
    return gameState.expedition.regionId;
  }

  return gameState.world.selectedRegion || "outskirts";
}

function getLocationRegionId(location) {
  if (!location || !location.region) return "outskirts";

  return location.region;
}

function getSelectedTravelDistance() {
  const regionId = getSelectedTravelRegionId();

  if (regionId === "outskirts") {
    return getOpenExpeditionTargetDistance();
  }

  const region = getRegionDefinition(regionId);

  if (!region) {
    return getOpenExpeditionTargetDistance();
  }

  return REGION_APPROACH_DISTANCE + region.maxProgress;
}

function getRegionKnownLocations(regionId) {
  const knownLocations = [];
  const locations = getExpeditionLocationDefinitions();

  for (let locationName in locations) {
    const location = locations[locationName];

    if (!location || !location.discovered) continue;
    if (getLocationRegionId(location) !== regionId) continue;

    knownLocations.push(locationName);
  }

  return knownLocations;
}

function getHuntData(locationName) {
  const location = getExpeditionLocation(locationName);

  if (!location || !location.hunt) return null;

  return location.hunt;
}

function canTrackGame(locationName) {
  const hunt = getHuntData(locationName);

  return !!hunt && !hunt.tracked;
}

function canHuntGame(locationName) {
  const hunt = getHuntData(locationName);

  return !!hunt && hunt.tracked;
}
