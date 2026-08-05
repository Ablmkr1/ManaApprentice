const REGION_APPROACH_DISTANCE = 100;
const INSTANT_MANUAL_RETURN_TO_CAMP = true;

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

  if (gameState.expedition.dungeon && gameState.expedition.dungeon.active) {
    unlockAction("leaveDungeon");
    return;
  }

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

  if (location.hunt) {
    unlockAction("useHuntingLure");
  }

  if (locationName === "creepyCave" && gameState.magicUnlocked) {
    unlockAction("meditate");
  }
}

function lockLocationActions() {
  getLocationActionNames().forEach((actionName) => {
    lockAction(actionName);
  });
}

function getLocationActionNames() {
  const actionNames = ["exploreLocation", "meditate", "leaveDungeon", "useHuntingLure"];

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
  herb: 0.2,
  manaCrystal: 0.5,
};

function getCarriedItemWeight(itemName) {
  return carriedItemWeights[itemName] || 1;
}

function hasCarrySpace(itemName, amount) {
  return getCarriedTotal() + amount * getCarriedItemWeight(itemName) <= getEffectiveCarryCapacity();
}

function getEffectiveCarryCapacity() {
  return gameState.expedition.carryCapacity + getActiveAttunementEffectTotal("carryCapacityFlat");
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
  const availableSpace = getEffectiveCarryCapacity() - getCarriedTotal();
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

function getConsumableCapacity(consumableName) {
  return getTonicSlots().length;
}

function getCarriedConsumableAmount(consumableName) {
  return getTonicSlots().filter(function (slot) {
    return slot === consumableName;
  }).length;
}

function hasConsumableSpace(consumableName, amount) {
  return getEmptyTonicSlotCount() >= amount;
}

function getTonicSlots() {
  if (!Array.isArray(gameState.expedition.tonicSlots)) {
    gameState.expedition.tonicSlots = [];
  }

  return gameState.expedition.tonicSlots;
}

function getEmptyTonicSlotCount() {
  return getTonicSlots().filter(function (slot) {
    return !slot;
  }).length;
}

function addConsumableToSlot(consumableName) {
  const slots = getTonicSlots();

  for (let i = 0; i < slots.length; i++) {
    if (!slots[i]) {
      slots[i] = consumableName;
      refreshExpeditionUI();
      return true;
    }
  }

  return false;
}

function useConsumableFromSlot(slotIndex) {
  const slots = getTonicSlots();
  const consumableName = slots[slotIndex];

  if (!consumableName) return false;

  const consumable = getConsumable(consumableName);

  if (!consumable || typeof consumable.use !== "function") return false;

  consumable.use();
  slots[slotIndex] = null;

  if (consumable.effectText) {
    addStoryEntry(consumable.effectText);
  }

  refreshExpeditionUI();
  updateEquipmentSlotUI();
  updateCraftingButtons();

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
    updateResource(itemName);

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
// Deeper equipment/camp discoveries should live in research.
const expeditionReturnUnlocks = {
  fiber: [{ type: "storageUpgrade", id: "fiberStorage" }],

  stone: [
    { type: "campUpgrade", id: "stoneFirePit" },
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
  const travelBoots = getGearUpgrade("travelBoots");

  if (travelBoots && travelBoots.purchased) {
    step.distance += 1.0;
  } else if (smellyShoes && smellyShoes.purchased) {
    step.distance += 0.5;
  }

  step.distance += getActiveAttunementEffectTotal("travelDistanceFlat");

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

  step.energyCost *= getTravelEnergyMultiplier();

  const finalEnergyCost = Math.max(0.1, Math.round(step.energyCost * 10) / 10);
  step.energyCost = finalEnergyCost;

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
  const traveledDistance = expedition.returning ? Math.min(step.distance, expedition.distance) : step.distance;

  recordPhysicalTravelDistance(traveledDistance);

  if (expedition.returning) {
    expedition.distance = Math.max(0, expedition.distance - step.distance);
    return;
  }

  const regionId = expedition.regionId || "outskirts";
  const previousDistance = expedition.distance;

  expedition.distance += step.distance;

  if (regionId !== "outskirts") {
    const currentRegionalDistance = Math.max(0, expedition.distance - REGION_APPROACH_DISTANCE);

    setRegionProgressAtLeast(regionId, currentRegionalDistance);
  }
}

function setRegionProgressAtLeast(regionId, progress) {
  if (regionId === "outskirts") return;

  const region = getRegionDefinition(regionId);
  const regionState = gameState.world.regions[regionId];

  if (!region || !regionState || !regionState.unlocked) return;

  regionState.progress = Math.min(Math.max(regionState.progress, progress), region.maxProgress);

  if (regionState.progress >= region.maxProgress) {
    regionState.mastered = true;
  }

  updateRegionalMapVisibility();
}

function beginReturnToCamp(reason) {
  const expedition = gameState.expedition;

  if (!expedition.active) return;

  if (shouldReturnToCampInstantly(reason)) {
    const awakened = unlockRecallMagic();

    if (!awakened) {
      addStoryEntry("You pluck the faint thread leading back to camp and the camp appears.");
    }

    expedition.distance = 0;
    expedition.destination = null;
    expedition.currentLocation = null;
    expedition.returning = false;
    expedition.returnPenalty = 0;
    endExpedition("recalled");
    return;
  }

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
    addStoryEntry("Your strength gives out. You pluck the faint thread and the camp appears.");
  }

  refreshExpeditionUI();
  updatePlacePanel();
}

function shouldReturnToCampInstantly(reason) {
  return INSTANT_MANUAL_RETURN_TO_CAMP && (reason === "manual" || reason === "exhausted");
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

  setRegionProgressAtLeast(regionId, region.maxProgress);

  addStoryEntry("You complete a long route through " + region.label + ".");
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

  clearActiveAttunements();

  applyReturnPenalty();
  transferCarriedItemsToCamp();
  applyPendingConditioningAtCamp();
  updateTrapCapacityUI();
  checkResearchDiscoveries();
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

    checkResearchDiscoveries();
    updateCraftingUIForCurrentContext();
    updateLocationActions();
  }
}

function toggleTraveling() {
  const expedition = gameState.expedition;

  if (!expedition.active) return;

  if (expedition.currentLocation) {
    updateTravelButton(false);
    updateAllActionButtons();
    updateCraftingButtons();
    updatePlacePanel();
    return;
  }

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

  if (expedition.distance >= expedition.targetDistance) {
    expedition.distance = expedition.targetDistance;
    setCurrentLocation(expedition.destination);
    expedition.destination = null;
    refreshExpeditionUI();

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
  renderLocationTravelActions(null);
  updateDungeonUI();
  updateEquipmentSlotUI();

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

  if (expedition.dungeon && expedition.dungeon.active) {
    const dungeon = getCurrentDungeon();

    safeSetText(ui.campPanelTitle, dungeon ? dungeon.label : "Dungeon");
    safeSetText(ui.locationDescription, "You are beneath the roadside ruin.");

    hideElement(ui.campContent);
    showElement(ui.locationContent, "block");

    renderLocationTravelActions(null);
    updateTrapSitesUI(null);
    updateLocationObjectActionsUI(null);
    updateLocationStorageUI(null);
    updateDungeonUI();

    return;
  }

  if (expedition.currentLocation) {
    const location = getExpeditionLocation(expedition.currentLocation);

    renderLocationTravelActions(expedition.currentLocation);

    updateTrapSitesUI(location);
    updateLocationObjectActionsUI(location);
    updateLocationStorageUI(location);
    updateDungeonUI();

    safeSetText(ui.campPanelTitle, getLocationLabel(expedition.currentLocation));
    safeSetText(ui.locationDescription, getLocationPanelText(location));
    hideElement(ui.campContent);
    showElement(ui.locationContent, "block");
    return;
  }

  const restLabel = ui.restBtn ? ui.restBtn.querySelector("span") : null;
  setCampActionsAvailable(true);

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

  if (gameState.phase === "clearing" && gameState.discoveredClearing) {
    updateLocationObjectActionsUI(getClearingPlace());
  } else {
    updateLocationObjectActionsUI(null);
  }
}

function getObjectPlace(placeName) {
  if (placeName === "clearing") {
    return getClearingPlace();
  }

  return getExpeditionLocation(placeName);
}

function getCurrentObjectPlaceName() {
  if (gameState.expedition.currentLocation) {
    return gameState.expedition.currentLocation;
  }

  if (gameState.phase === "clearing" && gameState.discoveredClearing) {
    return "clearing";
  }

  return null;
}

function getLocationObject(locationName, objectName) {
  const place = getObjectPlace(locationName);

  if (!place || !place.explorableObjects) return null;

  return place.explorableObjects[objectName] || null;
}

function getLocationObjectSpellCharges(object) {
  if (!object) return {};

  if (!object.spellCharges || typeof object.spellCharges !== "object" || Array.isArray(object.spellCharges)) {
    object.spellCharges = {};
  }

  if (object.manaSenseCharges && !object.spellCharges.manaSense) {
    object.spellCharges.manaSense = object.manaSenseCharges;
  }

  return object.spellCharges;
}

function getLocationObjectSpellCharge(object, spellName) {
  const charges = getLocationObjectSpellCharges(object);

  return charges[spellName] || 0;
}

function setLocationObjectSpellCharge(object, spellName, amount) {
  const charges = getLocationObjectSpellCharges(object);

  charges[spellName] = amount;

  if (spellName === "manaSense") {
    object.manaSenseCharges = amount;
  }
}

function shouldIgnoreLocationObjectSpellChargeRequirement(options, spellName) {
  if (!options) return false;
  if (options.ignoreSpellCharges === true) return true;
  if (options.ignoreSpellChargesFor === spellName) return true;
  if (Array.isArray(options.ignoreSpellChargesFor) && options.ignoreSpellChargesFor.includes(spellName)) return true;

  return false;
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
  if (object.flag && gameState[object.flag]) return true;

  return getLocationObjectProgress(object) >= getLocationObjectStages(object).length;
}

function getCurrentLocationObjectStage(object) {
  const stages = getLocationObjectStages(object);
  const progress = getLocationObjectProgress(object);

  return stages[progress] || null;
}

function startLocationObjectExploration(objectName) {
  const locationName = getCurrentObjectPlaceName();

  if (!locationName) return;

  const place = getObjectPlace(locationName);
  const object = getLocationObject(locationName, objectName);

  if (!object || isLocationObjectComplete(object)) return;
  if (!isLocationObjectAvailable(object)) return;

  if (isActivityActive()) return;
  if (!spendCost(getLocationObjectCost(object))) return;

  startActivity({
    kind: "locationObject",
    id: objectName,
    duration: object.duration || 1,
    context: {
      locationName: locationName,
      objectName: objectName,
    },
  });

  updateLocationObjectActionsUI(place);
  updateAllActionButtons();
  updateCraftingButtons();
}

function completeLocationObjectExploration(locationName, objectName) {
  const place = getObjectPlace(locationName);
  const object = getLocationObject(locationName, objectName);

  if (!place || !object || isLocationObjectComplete(object)) return;

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

  if (isLocationObjectComplete(object) && object.onComplete) {
    object.onComplete();
  }

  if (isLocationObjectComplete(object) && object.deepThought) {
    recordDeepThought(object.deepThought, object.label);
  }

  checkResearchDiscoveries();
  updateLocationActions();
  updateLocationObjectActionsUI(place);
  updateCurrentGoalUI();
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

    const isAvailable = isLocationObjectAvailable(object);
    const spellRequirementText = getLocationObjectSpellRequirementText(object);
    const isSpellLocked =
      !isAvailable &&
      !!spellRequirementText &&
      isLocationObjectAvailable(object, {
        ignoreManaSenseCharges: true,
        ignoreSpellCharges: true,
      });

    if (!isAvailable && !isSpellLocked) continue;

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

    if (isSpellLocked) {
      label.textContent = object.label + " (" + spellRequirementText + ")";
    } else if (stages.length > 1) {
      label.textContent = object.label + " (" + (progress + 1) + "/" + stages.length + ")";
    } else {
      label.textContent = object.label;
    }

    button.appendChild(progressFill);
    button.appendChild(label);

    const isCurrentObjectActivity =
      isActivityActive() && gameState.activity.kind === "locationObject" && gameState.activity.context.objectName === objectName;

    button.disabled = isSpellLocked || (!isCurrentObjectActivity && (isActivityActive() || !canAffordCost(getLocationObjectCost(object))));

    if (!isSpellLocked) {
      button.addEventListener("click", function () {
        startLocationObjectExploration(objectName);
      });
    }

    ui.locationObjectActions.appendChild(button);
  }

  if (hasVisibleObject) {
    showElement(ui.locationObjectActions, "block");
  } else {
    hideElement(ui.locationObjectActions);
  }
}

function getLocationObjectSpellRequirementText(object) {
  if (!object || !object.requires) return "";

  const requirements = [];

  if (object.requires.manaSenseCharges !== undefined) {
    const current = getLocationObjectSpellCharge(object, "manaSense");
    const required = object.requires.manaSenseCharges;

    if (current < required) {
      requirements.push(getLocationObjectSpellRequirementPart("manaSense", current, required));
    }
  }

  if (object.requires.spellCharges) {
    for (let spellName in object.requires.spellCharges) {
      const current = getLocationObjectSpellCharge(object, spellName);
      const required = object.requires.spellCharges[spellName];

      if (current < required) {
        requirements.push(getLocationObjectSpellRequirementPart(spellName, current, required));
      }
    }
  }

  return requirements.join(", ");
}

function getLocationObjectSpellRequirementPart(spellName, current, required) {
  const spell = getSpell(spellName);
  const label = spell ? spell.label : spellName;

  return label + " " + current + "/" + required;
}

function isLocationObjectAvailable(object, options = {}) {
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

  if (object.requires.locationsExplored) {
    for (let i = 0; i < object.requires.locationsExplored.length; i++) {
      const requiredLocation = getExpeditionLocation(object.requires.locationsExplored[i]);

      if (!requiredLocation || !requiredLocation.explored) {
        return false;
      }
    }
  }

  if (object.requires.locationsDiscovered) {
    for (let i = 0; i < object.requires.locationsDiscovered.length; i++) {
      const requiredLocation = getExpeditionLocation(object.requires.locationsDiscovered[i]);

      if (!requiredLocation || !requiredLocation.discovered) {
        return false;
      }
    }
  }

  if (
    !options.ignoreManaSenseCharges &&
    !shouldIgnoreLocationObjectSpellChargeRequirement(options, "manaSense") &&
    object.requires.manaSenseCharges !== undefined
  ) {
    if (getLocationObjectSpellCharge(object, "manaSense") < object.requires.manaSenseCharges) {
      return false;
    }
  }

  if (object.requires.spellCharges) {
    for (let spellName in object.requires.spellCharges) {
      if (shouldIgnoreLocationObjectSpellChargeRequirement(options, spellName)) continue;

      if (getLocationObjectSpellCharge(object, spellName) < object.requires.spellCharges[spellName]) {
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

function areAllTrapSitesInstalled() {
  const locations = getExpeditionLocationDefinitions();
  let hasTrapSites = false;

  for (let locationName in locations) {
    const sites = getTrapSites(locationName);

    if (!sites || sites.length === 0) continue;

    hasTrapSites = true;

    for (let i = 0; i < sites.length; i++) {
      if (!sites[i].installed) {
        return false;
      }
    }
  }

  return hasTrapSites;
}

function updateTrapCapacityUI() {
  if (!areAllTrapSitesInstalled()) return;

  const trap = getResource("trap");
  const trapCraft = getResourceCraft("trap");

  trap.value = 0;
  updateResource("trap");

  if (trap.display) {
    hideElement(trap.display);
  }

  if (trapCraft) {
    trapCraft.unlocked = false;
    updateResourceCraftUI("trap");
  }

  lockAction("packTrap");
  updateCampResourcesSectionVisibility();
  updateCraftingSectionVisibility();
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

    const locationDistance = getLocationTravelDistance(location);

    if (expedition.distance >= locationDistance) {
      expedition.distance = locationDistance;
      location.discovered = true;
      setCurrentLocation(locationName);
      refreshExpeditionUI();

      addStoryEntry(location.onDiscoverStory);

      updateDestinationActions();

      return true;
    }
  }

  return false;
}

function getDisplayedExpeditionDistance() {
  const expedition = gameState.expedition;

  if (!expedition.active || expedition.returning || expedition.currentLocation) {
    return expedition.distance;
  }

  const nextLocationDistance = getNextDiscoverableLocationDistance();

  if (nextLocationDistance !== null && expedition.distance >= nextLocationDistance) {
    return nextLocationDistance;
  }

  return expedition.distance;
}

function getNextDiscoverableLocationDistance() {
  const regionId = getSelectedTravelRegionId();
  const locations = getExpeditionLocationDefinitions();
  let nextDistance = null;

  for (let locationName in locations) {
    const location = locations[locationName];

    if (getLocationRegionId(location) !== regionId) continue;
    if (!isLocationDiscoverable(location)) continue;

    const locationDistance = getLocationTravelDistance(location);

    if (gameState.expedition.distance >= locationDistance) {
      if (nextDistance === null || locationDistance < nextDistance) {
        nextDistance = locationDistance;
      }
    }
  }

  return nextDistance;
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
    lockAction("packHerb");
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

  if (trap.display && trap.display.style.display !== "none" && !areAllTrapSitesInstalled()) {
    unlockAction("packTrap");
  } else {
    lockAction("packTrap");
  }

  const leatherworking = getResearch("leatherworking");
  const pelt = getResource("pelt");

  if (leatherworking && leatherworking.completed && pelt.value > 0) {
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

  const herb = getResource("herb");

  if (herb.value > 0) {
    unlockAction("packHerb");
  } else {
    lockAction("packHerb");
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

  return knownLocations.sort(function (a, b) {
    const locationA = getExpeditionLocation(a);
    const locationB = getExpeditionLocation(b);

    return getLocationTravelDistance(locationA) - getLocationTravelDistance(locationB);
  });
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

function canUseHuntingLure(locationName) {
  const hunt = getHuntData(locationName);
  const lure = getResource("huntingLure");

  return !!hunt && !hunt.tracked && !!lure && lure.value > 0;
}

function renderLocationTravelActions(locationName) {
  if (!ui.locationTravelSection) return;

  ui.locationTravelSection.innerHTML = "";

  const currentLocation = getExpeditionLocation(locationName);

  if (!currentLocation) {
    hideElement(ui.locationTravelSection);
    return;
  }

  const currentRegionId = getLocationRegionId(currentLocation);
  const knownLocations = getRegionKnownLocations(currentRegionId);

  knownLocations.forEach(function (targetLocationName) {
    if (targetLocationName === locationName) return;

    const targetLocation = getExpeditionLocation(targetLocationName);

    if (!targetLocation) return;

    const distance = getLocationToLocationTravelDistance(currentLocation, targetLocation);

    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("action-btn");
    button.textContent = "Travel to " + getLocationLabel(targetLocationName) + " (" + formatDistance(distance) + ")";

    button.addEventListener("click", function () {
      beginLocationToLocationTravel(locationName, targetLocationName);
    });

    ui.locationTravelSection.appendChild(button);
  });

  if (ui.locationTravelSection.children.length > 0) {
    showElement(ui.locationTravelSection, "flex");
  } else {
    hideElement(ui.locationTravelSection);
  }
}

function beginLocationToLocationTravel(fromLocationName, targetLocationName) {
  const fromLocation = getExpeditionLocation(fromLocationName);
  const targetLocation = getExpeditionLocation(targetLocationName);

  if (!fromLocation || !targetLocation || !targetLocation.discovered) return;
  if (getLocationRegionId(fromLocation) !== getLocationRegionId(targetLocation)) return;

  const distance = getLocationToLocationTravelDistance(fromLocation, targetLocation);

  gameState.expedition.destination = targetLocationName;
  gameState.expedition.regionId = getLocationRegionId(targetLocation);
  gameState.expedition.distance = 0;
  gameState.expedition.targetDistance = distance;
  gameState.expedition.returning = false;
  gameState.expedition.currentLocation = null;

  clearCurrentLocation();
  unlockAction("travel");
  unlockAction("returnToCamp");
  setPackingActionsAvailable(false);

  addStoryEntry("You set out toward " + getLocationLabel(targetLocationName) + ".");
  toggleTraveling();
  refreshExpeditionUI();
  updatePlacePanel();
}

function getLocationToLocationTravelDistance(fromLocation, targetLocation) {
  if (!fromLocation || !targetLocation) {
    return 0;
  }

  return Math.abs(getLocationTravelDistance(targetLocation) - getLocationTravelDistance(fromLocation));
}

//Dungeon Helpers
function getDungeonDefinitions() {
  return dungeonDefinitions;
}

function getDungeon(dungeonId) {
  return dungeonDefinitions[dungeonId];
}

function getDungeonNode(dungeonId, nodeId) {
  const dungeon = getDungeon(dungeonId);

  if (!dungeon || !dungeon.nodes) return null;

  return dungeon.nodes[nodeId] || null;
}

function getDungeonNodes(dungeonId) {
  const dungeon = getDungeon(dungeonId);

  if (!dungeon || !dungeon.nodes) return {};

  return dungeon.nodes;
}

function getDungeonNodeExit(node, targetNodeId) {
  if (!node || !Array.isArray(node.exits)) return null;

  return node.exits.find(function (exit) {
    return exit.to === targetNodeId;
  });
}

function getCurrentDungeonState() {
  return gameState.expedition.dungeon;
}

function getCurrentDungeon() {
  const dungeonState = getCurrentDungeonState();

  if (!dungeonState || !dungeonState.active) return null;

  return getDungeon(dungeonState.dungeonId);
}

function getCurrentDungeonNode() {
  const dungeonState = getCurrentDungeonState();

  if (!dungeonState || !dungeonState.active) return null;

  return getDungeonNode(dungeonState.dungeonId, dungeonState.nodeId);
}

function updateDungeonUI() {
  if (!ui.dungeonSection || !ui.dungeonMap || !ui.dungeonTitle || !ui.dungeonRoomText) return;

  const dungeonState = getCurrentDungeonState();
  const dungeon = getCurrentDungeon();
  const currentNode = getCurrentDungeonNode();

  ui.dungeonMap.innerHTML = "";

  if (ui.dungeonActions) {
    ui.dungeonActions.innerHTML = "";
  }

  if (!dungeonState || !dungeonState.active || !dungeon || !currentNode) {
    hideElement(ui.dungeonSection);
    return;
  }

  showElement(ui.dungeonSection, "flex");
  hideElement(ui.dungeonTitle);
  safeSetText(ui.dungeonRoomText, currentNode.description || "");

  const nodes = getDungeonNodes(dungeonState.dungeonId);

  for (let nodeId in nodes) {
    const node = nodes[nodeId];

    const isCurrentNode = nodeId === dungeonState.nodeId;
    const hasExitFromCurrentNode = !!getDungeonNodeExit(currentNode, nodeId);
    const shouldShowNode = node.discovered || hasExitFromCurrentNode;
    const isLocked = !canEnterDungeonNode(dungeonState.dungeonId, nodeId);
    const requirementText = getDungeonRequirementText(node.requires);

    if (!shouldShowNode) continue;

    const roomButton = document.createElement("button");
    roomButton.type = "button";
    roomButton.className = "dungeon-room";
    roomButton.dataset.node = nodeId;

    const progressFill = document.createElement("div");
    progressFill.classList.add("progressFill");

    const label = document.createElement("span");
    label.textContent = node.discovered ? node.label : "?";

    roomButton.appendChild(progressFill);
    roomButton.appendChild(label);

    roomButton.style.gridColumn = node.x + 2;
    roomButton.style.gridRow = node.y + 1;

    if (isCurrentNode) {
      roomButton.classList.add("current");
    }

    if (node.explored) {
      roomButton.classList.add("explored");
    } else {
      roomButton.classList.add("discovered");
    }

    if (isLocked) {
      roomButton.classList.add("locked");
      roomButton.title = requirementText || "You are not ready to enter this room.";

      if (hasExitFromCurrentNode) {
        roomButton.disabled = false;

        roomButton.addEventListener("click", function () {
          safeSetText(ui.dungeonRoomText, requirementText || "Something blocks the way.");
        });
      } else if (nodeId !== dungeonState.nodeId) {
        roomButton.disabled = true;
      }
    } else if (canMoveToDungeonNode(nodeId)) {
      roomButton.classList.add("available");
      roomButton.disabled = false;

      roomButton.addEventListener("click", function () {
        moveToDungeonNode(nodeId);
      });
    } else if (nodeId !== dungeonState.nodeId) {
      roomButton.disabled = true;
    }

    if (!node.discovered) {
      roomButton.classList.add("unknown");
    }

    ui.dungeonMap.appendChild(roomButton);
  }

  renderDungeonActions(currentNode);
}

function renderDungeonActions(node) {
  if (!ui.dungeonActions) return;

  ui.dungeonActions.innerHTML = "";

  if (!node || !node.search || node.explored) {
    hideElement(ui.dungeonActions);
    return;
  }

  showElement(ui.dungeonActions, "flex");

  const button = document.createElement("button");
  button.type = "button";
  button.className = "action-btn";
  button.dataset.dungeonAction = "exploreRoom";

  const progressFill = document.createElement("div");
  progressFill.className = "progressFill";

  const label = document.createElement("span");
  const chance = getDungeonSearchChance(node);
  const charges = node.manaSenseCharges || 0;

  label.textContent = charges > 0 ? "Explore Room (" + chance + "%, Sense " + charges + ")" : "Explore Room (" + chance + "%)";

  button.appendChild(progressFill);
  button.appendChild(label);

  const isCurrentSearch =
    isActivityActive() &&
    gameState.activity.kind === "dungeonSearch" &&
    gameState.activity.context &&
    gameState.activity.context.nodeId === getCurrentDungeonState().nodeId;

  button.classList.toggle("running", isCurrentSearch);
  button.disabled = !isCurrentSearch && (isActivityActive() || !canAffordCost(getDungeonSearchCost(node)));

  button.addEventListener("click", function () {
    if (!isCurrentSearch) {
      startDungeonRoomSearch();
    }
  });

  ui.dungeonActions.appendChild(button);
}

function getDungeonActionButton(actionName) {
  if (!ui.dungeonActions) return null;

  return ui.dungeonActions.querySelector('[data-dungeon-action="' + actionName + '"]');
}

function startDungeonRoomSearch() {
  const dungeonState = getCurrentDungeonState();
  const node = getCurrentDungeonNode();

  if (!dungeonState || !dungeonState.active || !node || !node.search) return;
  if (node.explored) return;
  if (isActivityActive()) return;
  if (!spendCost(getDungeonSearchCost(node))) return;

  startActivity({
    kind: "dungeonSearch",
    id: "exploreRoom",
    duration: node.search.duration || 1,
    context: {
      dungeonId: dungeonState.dungeonId,
      nodeId: dungeonState.nodeId,
    },
  });

  updateDungeonUI();
  updateAllActionButtons();
  updateCraftingButtons();
}

function getDungeonSearchChance(node) {
  if (!node || !node.search) return 0;

  const baseChance = node.search.baseChance ?? 100;
  const spell = getSpell("manaSense");
  const bonusPerCharge = spell && spell.effects ? spell.effects.dungeonSearchBonus || 0 : 0;
  const charges = node.manaSenseCharges || 0;

  return Math.min(100, baseChance + charges * bonusPerCharge);
}

function rollDungeonSearchSuccess(node) {
  const chance = getDungeonSearchChance(node);

  return Math.random() * 100 < chance;
}

function canEnterDungeonNode(dungeonId, nodeId) {
  const node = getDungeonNode(dungeonId, nodeId);

  if (!node) return false;

  return meetsDungeonRequirements(node.requires);
}

function meetsDungeonRequirements(requires) {
  if (!requires) return true;

  if (requires.gearPurchased) {
    for (let i = 0; i < requires.gearPurchased.length; i++) {
      if (!hasPurchasedGear(requires.gearPurchased[i])) {
        return false;
      }
    }
  }

  return true;
}

function getDungeonRequirementText(requires) {
  if (!requires) return "";

  const missingRequirements = [];

  if (requires.gearPurchased) {
    requires.gearPurchased.forEach(function (gearName) {
      if (!hasPurchasedGear(gearName)) {
        const gear = getGearUpgrade(gearName);
        missingRequirements.push(gear ? gear.displayName || gear.label || gearName : gearName);
      }
    });
  }

  if (missingRequirements.length === 0) return "";

  return "Requires " + missingRequirements.join(", ") + ".";
}

function enterCurrentLocationDungeon() {
  const locationName = gameState.expedition.currentLocation;
  const location = getExpeditionLocation(locationName);

  if (!location || !location.dungeon) return;

  const dungeon = getDungeon(location.dungeon);

  if (!dungeon) return;

  gameState.expedition.dungeon = {
    active: true,
    dungeonId: location.dungeon,
    nodeId: dungeon.startNode,
  };

  addStoryEntry("You descend into " + dungeon.label + ".");
  updateLocationActions();
  updateDungeonUI();
  updatePlacePanel();
}

function leaveCurrentDungeon() {
  const dungeonState = getCurrentDungeonState();

  if (!dungeonState || !dungeonState.active) return;

  gameState.expedition.dungeon.active = false;
  gameState.expedition.dungeon.dungeonId = null;
  gameState.expedition.dungeon.nodeId = null;

  addStoryEntry("You return to the ruin entrance.");
  updateLocationActions();
  updateDungeonUI();
  updatePlacePanel();
}

function canMoveToDungeonNode(targetNodeId) {
  const dungeonState = getCurrentDungeonState();
  const currentNode = getCurrentDungeonNode();

  if (!dungeonState || !dungeonState.active || !currentNode) return false;

  const targetNode = getDungeonNode(dungeonState.dungeonId, targetNodeId);

  if (!targetNode) return false;
  if (!getDungeonNodeExit(currentNode, targetNodeId)) return false;
  if (!canEnterDungeonNode(dungeonState.dungeonId, targetNodeId)) return false;

  return true;
}

function moveToDungeonNode(targetNodeId) {
  if (!canMoveToDungeonNode(targetNodeId)) return;

  const dungeonState = getCurrentDungeonState();
  const targetNode = getDungeonNode(dungeonState.dungeonId, targetNodeId);

  gameState.expedition.dungeon.nodeId = targetNodeId;

  if (!targetNode.discovered) {
    targetNode.discovered = true;
    addStoryEntry("You enter " + targetNode.label + ".");
  } else {
    addStoryEntry("You move to " + targetNode.label + ".");
  }

  updateDungeonUI();
  updatePlacePanel();
  updateAllActionButtons();
  updateCraftingButtons();
}

function completeDungeonRoomSearch(dungeonId, nodeId) {
  const node = getDungeonNode(dungeonId, nodeId);

  if (!node || !node.search || node.explored) return;

  if (!rollDungeonSearchSuccess(node)) {
    addStoryEntry(node.search.failureText || "You search the room, but find nothing useful yet.");
    updateDungeonUI();
    updatePlacePanel();
    updateAllActionButtons();
    updateCraftingButtons();
    return;
  }

  node.explored = true;
  node.manaSenseCharges = 0;

  addStoryEntry(node.search.successText || "You finish exploring the room.");
  recordDeepThought(node.search.deepThought || 0, node.label);

  claimDungeonNodeReward(node);

  updateDungeonUI();
  updatePlacePanel();
  updateAllActionButtons();
  updateCraftingButtons();
}

function claimDungeonNodeReward(node) {
  if (!node || node.rewardClaimed) return;

  const reward = node.search && node.search.reward ? node.search.reward : node.reward;

  if (!reward) return;

  if (reward.carried) {
    for (let itemName in reward.carried) {
      const amount = reward.carried[itemName];
      const carriedAmount = addCarriedItemUpToCapacity(itemName, amount);

      if (carriedAmount > 0) {
        addStoryEntry("You collect " + carriedAmount + " " + itemName + ".");
        unlockResource(itemName);
      }

      if (carriedAmount < amount) {
        addStoryEntry("You cannot carry everything you found.");
      }
    }
  }

  if (reward.unlocks) {
    applyUnlocks(reward.unlocks);
  }

  node.rewardClaimed = true;
}

function getDungeonSearchCost(node) {
  const cost = { ...(node.search.cost || {}) };

  if (cost.energy) {
    cost.energy = Math.max(1, cost.energy - getExplorationEnergyReduction());
  }

  return cost;
}

function unlockRecallMagic() {
  if (gameState.recallUnlocked) return false;

  gameState.recallUnlocked = true;
  showRecallAwakenedPopup();
  updateReturnToCampButtonLabel();

  return true;
}
