const REGION_APPROACH_DISTANCE = 100;
const REGION_MASTERY_TRAVEL_MULTIPLIER = 1.2;
const EXPEDITION_ROUTE_OPEN = "open";
const EXPEDITION_ROUTE_DESTINATION = "destination";
const EXPEDITION_ROUTE_INTRA_REGION = "intraRegion";
const EXPEDITION_ROUTE_TOWER_NODE = "towerNode";

function setCurrentLocation(locationName) {
  clearTemporaryLocationSpellEffects(gameState.expedition.currentLocation);
  gameState.expedition.currentLocation = locationName;
  repairExpeditionLocationSpellEffects();

  updateLocationActions();
  updateCraftingUIForCurrentContext();
  updatePlacePanel();
}

function clearCurrentLocation() {
  resetTemporaryLocationObjectSpellCharges(gameState.expedition.currentLocation);
  clearTemporaryLocationSpellEffects(gameState.expedition.currentLocation);
  gameState.expedition.currentLocation = null;

  updateLocationActions();
  updateCraftingUIForCurrentContext();
  updatePlacePanel();
  updateRegionalMapVisibility();
}

function resetTemporaryLocationObjectSpellCharges(locationName) {
  const location = getExpeditionLocation(locationName);

  if (!location || !location.explorableObjects) return;

  for (let objectName in location.explorableObjects) {
    const object = location.explorableObjects[objectName];

    if (!object || !object.resetSpellChargesOnLeave || isLocationObjectComplete(object)) continue;

    object.spellCharges = {};
    object.manaSenseCharges = 0;
  }
}

function getExpeditionLocationSpellEffects() {
  const expedition = gameState.expedition;

  if (!expedition.locationSpellEffects || typeof expedition.locationSpellEffects !== "object" || Array.isArray(expedition.locationSpellEffects)) {
    expedition.locationSpellEffects = {};
  }

  return expedition.locationSpellEffects;
}

function clearTemporaryLocationSpellEffects(locationName) {
  const effects = getExpeditionLocationSpellEffects();

  for (let effectName in effects) {
    const effect = effects[effectName];

    if (!effect || !locationName || effect.locationName === locationName) {
      delete effects[effectName];
    }
  }
}

function repairExpeditionLocationSpellEffects() {
  const effects = getExpeditionLocationSpellEffects();
  const currentLocation = gameState.expedition.currentLocation;

  for (let effectName in effects) {
    const effect = effects[effectName];

    if (!effect || effect.locationName !== currentLocation) {
      delete effects[effectName];
    }
  }

  if (effects.stoneSense && currentLocation !== "foothillScree") {
    delete effects.stoneSense;
  }
}

function activateStoneSense() {
  if (gameState.expedition.currentLocation !== "foothillScree") return false;
  if (hasStoneSenseActive()) return false;

  getExpeditionLocationSpellEffects().stoneSense = {
    locationName: "foothillScree",
  };

  refreshExpeditionUI();
  updateLocationActions();
  return true;
}

function hasStoneSenseActive() {
  repairExpeditionLocationSpellEffects();

  const effect = getExpeditionLocationSpellEffects().stoneSense;

  return !!effect && effect.locationName === "foothillScree" && gameState.expedition.currentLocation === "foothillScree";
}

function activateSensePrey() {
  if (gameState.expedition.currentLocation !== "stagRuns") return false;

  const hunt = getHuntData("stagRuns");

  if (!hunt || hunt.tracked) return false;

  hunt.tracked = true;
  updateLocationActions();
  return true;
}

function hasSensePreyActive() {
  if (gameState.expedition.currentLocation !== "stagRuns") return false;

  const hunt = getHuntData("stagRuns");

  return !!hunt && !!hunt.tracked;
}

function getFoothillScreeOreFindChance() {
  if (!hasStoneSenseActive()) return 0.2;
  if (typeof getStoneSenseOreFindChance !== "function") return 0.2;

  return getStoneSenseOreFindChance();
}

function normalizeLocationLooseStone(location) {
  if (!location || !Number.isFinite(location.looseStoneMax)) return 0;

  const max = Math.max(0, Math.floor(location.looseStoneMax));

  if (!Number.isFinite(location.looseStoneRemaining)) {
    location.looseStoneRemaining = max;
  }

  location.looseStoneRemaining = Math.max(0, Math.min(max, Math.floor(location.looseStoneRemaining)));

  return location.looseStoneRemaining;
}

function getLocationLooseStoneRemaining(location) {
  return normalizeLocationLooseStone(location);
}

function canGatherStoneAtCurrentLocation() {
  const locationName = gameState.expedition.currentLocation;

  if (locationName === "creepyCave") {
    return getLocationLooseStoneRemaining(getExpeditionLocation(locationName)) > 0;
  }

  return locationName === "foothillScree";
}

function spendCurrentLocationLooseStone(amount) {
  const location = getExpeditionLocation(gameState.expedition.currentLocation);

  if (!location || !Number.isFinite(location.looseStoneMax)) return 0;

  const remaining = getLocationLooseStoneRemaining(location);
  location.looseStoneRemaining = Math.max(0, remaining - amount);

  return getLocationLooseStoneRemaining(location);
}

function isLocationActionAvailable(actionName, locationName, location) {
  if (actionName === "investigateNorthernDisturbance") {
    return canInvestigateNorthernDisturbance();
  }

  if (actionName === "challengeEarthElemental") {
    return canChallengeNorthernEarthElemental();
  }

  if (actionName === "investigateEasternDisturbance") return canInvestigateRegionalDisturbance("east");
  if (actionName === "challengeThornfang") return canChallengeRegionalEnemy("east");
  if (actionName === "investigateSouthernDisturbance") return canInvestigateRegionalDisturbance("south");
  if (actionName === "challengeBlightedBriar") return canChallengeRegionalEnemy("south");

  if (actionName === "scoutTrapSite") {
    return !!getFirstHiddenTrapSite(locationName);
  }

  if (actionName === "setTrap") {
    return hasOpenTrapSite(locationName);
  }

  if (actionName === "gatherStone" && locationName === "creepyCave") {
    return getLocationLooseStoneRemaining(location) > 0;
  }

  return true;
}

function canInvestigateNorthernDisturbance() {
  const northNode = typeof getTowerNodeState === "function" ? getTowerNodeState("north") : null;
  const disturbance = gameState.northernDisturbance;

  return (
    gameState.expedition.currentLocation === "ironMine" &&
    !!northNode &&
    northNode.advancedRecallUnlocked &&
    !!disturbance &&
    disturbance.triggered &&
    !disturbance.resolved &&
    !(typeof isCombatActive === "function" && isCombatActive())
  );
}

function canChallengeNorthernEarthElemental() {
  const northNode = typeof getTowerNodeState === "function" ? getTowerNodeState("north") : null;
  const disturbance = gameState.northernDisturbance;

  return (
    gameState.expedition.currentLocation === "ironMine" &&
    !!northNode &&
    northNode.advancedRecallUnlocked &&
    !!disturbance &&
    disturbance.resolved &&
    !(typeof isCombatActive === "function" && isCombatActive())
  );
}

function getRegionalDisturbanceLocation(regionId) {
  return regionId === "east" ? "quietGrove" : regionId === "south" ? "overgrownFields" : null;
}

function canInvestigateRegionalDisturbance(regionId) {
  const progress = typeof getRegionalProgressState === "function" ? getRegionalProgressState(regionId) : null;
  return (
    !!progress &&
    progress.disturbanceTriggered &&
    !progress.disturbanceResolved &&
    gameState.expedition.currentLocation === getRegionalDisturbanceLocation(regionId) &&
    !(typeof isCombatActive === "function" && isCombatActive())
  );
}

function canChallengeRegionalEnemy(regionId) {
  const progress = typeof getRegionalProgressState === "function" ? getRegionalProgressState(regionId) : null;
  return (
    !!progress &&
    progress.disturbanceResolved &&
    gameState.expedition.currentLocation === getRegionalDisturbanceLocation(regionId) &&
    !(typeof isCombatActive === "function" && isCombatActive())
  );
}

function updateLocationActions() {
  const locationName = gameState.expedition.currentLocation;

  lockLocationActions();

  syncContextualActionPlacement();
  renderContextualLocationSpellActions();

  if (gameState.expedition.dungeon && gameState.expedition.dungeon.active) {
    unlockAction("leaveDungeon");
    syncContextualActionPlacement();
    renderContextualLocationSpellActions();
    return;
  }

  if (!locationName) return;

  const location = getExpeditionLocation(locationName);

  if (!location) return;

  if (!location.explored) {
    unlockAction("exploreLocation");
    syncContextualActionPlacement();
    renderContextualLocationSpellActions();
    return;
  }

  if (location.availableActions) {
    location.availableActions.forEach((actionName) => {
      if (!isLocationActionAvailable(actionName, locationName, location)) return;

      unlockAction(actionName);
    });
  }

  if (location.hunt) {
    unlockAction("useHuntingLure");
  }

  if (locationName === "creepyCave" && gameState.magicUnlocked) {
    unlockAction("meditate");
  }

  syncContextualActionPlacement();
  renderContextualLocationSpellActions();
}

function lockLocationActions() {
  getLocationActionNames().forEach((actionName) => {
    lockAction(actionName);
  });
}

function getLocationActionNames() {
  const actionNames = ["exploreLocation", "meditate", "leaveDungeon", "useHuntingLure", "concentrateTonicBase", "concentrateManaTonicBase"];

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
  glimmerleaf: 0.2,
  manaCrystal: 0.5,
  chargedCrystal: 0.5,
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
  const amountToCarry = Math.min(amount, Math.floor((availableSpace + RESOURCE_AFFORDABILITY_EPSILON) / itemWeight));

  if (amountToCarry <= 0) return 0;

  const carriedItems = gameState.expedition.carriedItems;

  if (!carriedItems[itemName]) {
    carriedItems[itemName] = 0;
  }

  carriedItems[itemName] += amountToCarry;
  refreshExpeditionUI();

  return amountToCarry;
}

const BATCH_PACKING_ITEMS = {
  packFood: { itemName: "food" },
  packTrap: { itemName: "trap" },
  packPelt: { itemName: "pelt" },
  packOre: { itemName: "ore" },
  packWood: { itemName: "wood" },
  packStone: { itemName: "stone" },
  packIron: { itemName: "iron" },
  packImbuedWood: { itemName: "imbuedWood" },
  packHerb: { itemName: "herb" },
  packGlimmerleaf: { itemName: "glimmerleaf" },
  packChargedCrystal: { itemName: "chargedCrystal" },
};

function getBatchPackingActionNames() {
  return Object.keys(BATCH_PACKING_ITEMS);
}

function getBatchPackingItemName(actionName) {
  return BATCH_PACKING_ITEMS[actionName] ? BATCH_PACKING_ITEMS[actionName].itemName : null;
}

function canUseBatchPackingAction(actionName) {
  const definition = BATCH_PACKING_ITEMS[actionName];
  const action = typeof getAction === "function" ? getAction(actionName) : null;
  const expedition = gameState.expedition;

  if (!definition || !action || !action.unlocked || !expedition.active || expedition.currentLocation || expedition.distance > 0) return false;
  if (isActivityActive() || (typeof isCombatActive === "function" && isCombatActive())) return false;

  const resource = getResource(definition.itemName);
  return !!resource && resource.value > 0 && addCarriedItemUpToCapacityPreview(definition.itemName, 1) > 0;
}

function addCarriedItemUpToCapacityPreview(itemName, amount) {
  const itemWeight = getCarriedItemWeight(itemName);
  const availableSpace = getEffectiveCarryCapacity() - getCarriedTotal();
  return Math.max(0, Math.min(amount, Math.floor((availableSpace + RESOURCE_AFFORDABILITY_EPSILON) / itemWeight)));
}

function packExpeditionItem(actionName, requestedAmount, options = {}) {
  const definition = BATCH_PACKING_ITEMS[actionName];
  if (!definition) return 0;

  const resource = getResource(definition.itemName);
  const requested = Math.max(0, Math.floor(Number(requestedAmount) || 0));
  const prepaid = Math.max(0, Math.min(requested, Math.floor(Number(options.prepaidAmount) || 0)));

  if (!resource || requested <= 0) return 0;

  const available = Math.max(0, Math.floor(resource.value + RESOURCE_AFFORDABILITY_EPSILON)) + prepaid;
  const amountToTry = Math.min(requested, available);
  const amountPacked = addCarriedItemUpToCapacity(definition.itemName, amountToTry);
  const resourceSpent = Math.max(0, amountPacked - prepaid);
  const refund = Math.max(0, prepaid - amountPacked);

  if (resourceSpent > 0) {
    resource.value = roundResourceAmount(Math.max(0, resource.value - resourceSpent));
    updateResource(definition.itemName);
  }

  if (refund > 0) addResource(definition.itemName, refund);

  if (amountPacked > 0) {
    setPackingActionsAvailable(true);
    updateAllActionButtons();
  }

  return amountPacked;
}

function packExpeditionAmount(actionName, amount) {
  if (!canUseBatchPackingAction(actionName)) return 0;
  return packExpeditionItem(actionName, amount);
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
      const resource = getResource(itemName);
      const label = resource ? resource.label : itemName;

      parts.push(label + ": " + formatCarryAmount(carriedItems[itemName]));
    }
  }

  if (parts.length === 0) return "empty";

  return parts.join(", ");
}

function getPackedExpeditionSummaryParts() {
  const expedition = gameState.expedition;
  const parts = [];

  for (let itemName in expedition.carriedItems) {
    if (itemName === "water") continue;

    const amount = expedition.carriedItems[itemName];
    if (!(amount > 0)) continue;

    const resource = getResource(itemName);
    const label = resource ? resource.label : itemName;
    parts.push(label + " " + formatCarryAmount(amount));
  }

  return parts;
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
  stone: [{ type: "campUpgrade", id: "stoneFirePit" }],
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

  step.distance += getEquipmentEffectValue("gear", "feet", "travelDistanceFlat", 0);

  step.distance += getActiveAttunementEffectTotal("travelDistanceFlat");

  step.distance *= getRouteTravelDistanceMultiplier();

  const affordableModifiers = getAffordableExpeditionModifiers();

  for (let i = 0; i < affordableModifiers.length; i++) {
    const modifierName = affordableModifiers[i];
    const modifier = getExpeditionModifier(modifierName);

    modifier.apply(step);
    step.modifiersUsed.push(modifierName);
  }

  step.energyCost *= getTravelEnergyMultiplier();

  const finalEnergyCost = Math.max(0.01, roundResourceAmount(step.energyCost));
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

  recordPhysicalTravelDistance(step.distance);

  const regionId = expedition.regionId || "outskirts";

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
  if (typeof endCombatForRecall === "function") {
    endCombatForRecall();
  }

  const expedition = gameState.expedition;

  if (!expedition.active) return;

  const awakened = unlockRecallMagic();

  if (!awakened) {
    if (reason === "exhausted") {
      addStoryEntry("Your strength gives out. You pluck the faint thread leading back to camp and the camp appears.");
    } else {
      addStoryEntry("You pluck the faint thread leading back to camp and the camp appears.");
    }
  }

  expedition.distance = 0;
  expedition.destination = null;
  resetTemporaryLocationObjectSpellCharges(expedition.currentLocation);
  expedition.currentLocation = null;
  endExpedition("recalled");
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
  if (typeof endCombatForRecall === "function") {
    endCombatForRecall();
  }

  const expedition = gameState.expedition;

  stopTraveling();

  expedition.active = false;

  clearActiveAttunements();

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

  updateRegionalMapVisibility();
  refreshExpeditionUI();
  updatePlacePanel();

  // Physical state, rather than the previously selected information tab,
  // determines what the player sees after a return or recall.
  if (typeof setMainView === "function") {
    setMainView("camp");
  }
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
    updateCurrentGoalUI();
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
  if (!expedition.active) return false;
  if (getExpeditionRouteType(expedition) === EXPEDITION_ROUTE_INTRA_REGION) return false;

  if (!expedition.destination) return false;

  const location = getExpeditionLocation(expedition.destination);

  return !!location && getLocationRegionId(location) === "outskirts" && !!location.knownPathDistance;
}

function isOutskirtsTravelActive() {
  const expedition = gameState.expedition;

  if (!gameState.knownOutskirtsPathsUnlocked) return false;
  if (!expedition.active) return false;
  if (getExpeditionRouteType(expedition) === EXPEDITION_ROUTE_INTRA_REGION) return false;

  if (!expedition.regionId || expedition.regionId === "outskirts") return true;

  return expedition.distance < REGION_APPROACH_DISTANCE;
}

function getExpeditionRouteType(expedition) {
  if (!expedition) return EXPEDITION_ROUTE_OPEN;

  if (
    expedition.routeType === EXPEDITION_ROUTE_OPEN ||
    expedition.routeType === EXPEDITION_ROUTE_DESTINATION ||
    expedition.routeType === EXPEDITION_ROUTE_INTRA_REGION
  ) {
    return expedition.routeType;
  }

  return expedition.destination ? EXPEDITION_ROUTE_DESTINATION : EXPEDITION_ROUTE_OPEN;
}

function getRouteTravelDistanceMultiplier() {
  if (getCurrentTravelBonusSource()) {
    return REGION_MASTERY_TRAVEL_MULTIPLIER;
  }

  return 1;
}

function isRegionalMasteryTravelActive() {
  const expedition = gameState.expedition;

  if (!expedition.active) return false;

  const regionId = expedition.regionId || "outskirts";

  if (regionId === "outskirts") return false;
  if (!isRegionMastered(regionId)) return false;

  if (getExpeditionRouteType(expedition) === EXPEDITION_ROUTE_INTRA_REGION) return true;

  return expedition.distance >= REGION_APPROACH_DISTANCE;
}

function isRegionMastered(regionId) {
  const definition = getRegionDefinition(regionId);
  const state = gameState.world.regions[regionId];

  return !!definition && !!state && (state.mastered || state.progress >= definition.maxProgress);
}

function getCurrentTravelBonusSource() {
  if (isKnownPathTravelActive() || isOutskirtsTravelActive()) {
    return "outskirts";
  }

  if (isRegionalMasteryTravelActive()) {
    return "regionalMastery";
  }

  return null;
}

function getCurrentTravelSegmentRegionId() {
  const expedition = gameState.expedition;
  const regionId = expedition.regionId || "outskirts";
  const routeType = getExpeditionRouteType(expedition);

  if (routeType === EXPEDITION_ROUTE_INTRA_REGION || regionId === "outskirts") {
    return regionId;
  }

  return expedition.distance < REGION_APPROACH_DISTANCE ? "outskirts" : regionId;
}

function getCurrentTravelSegmentInfo() {
  const regionId = getCurrentTravelSegmentRegionId();
  const region = getRegionDefinition(regionId);
  const bonusSource = getCurrentTravelBonusSource();

  return {
    regionId,
    label: region ? region.label : "Unknown Territory",
    bonusActive: !!bonusSource,
    bonusSource,
  };
}

function getCurrentTravelDescription() {
  const segment = getCurrentTravelSegmentInfo();
  let description = "Traveling through " + segment.label + ".";

  if (segment.bonusActive) {
    description += " +20% mastered travel bonus active.";
  }

  return description;
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
  renderTowerNodePanel(null);
  renderLocationTravelActions(null);
  updateDungeonUI();
  updateEquipmentSlotUI();
  renderExpeditionWorkflowPanel();

  if (isTravelActivityActive()) {
    safeSetText(ui.expeditionPanelTitle, "Traveling");
    safeSetText(ui.locationDescription, getCurrentTravelDescription());

    hideElement(ui.campContent);
    showElement(ui.locationContent, "block");
    updateTrapSitesUI(null);
    updateLocationObjectActionsUI(null);
    return;
  }

  if (expedition.dungeon && expedition.dungeon.active) {
    const dungeon = getCurrentDungeon();

    safeSetText(ui.expeditionPanelTitle, dungeon ? dungeon.label : "Dungeon");
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

    safeSetText(ui.expeditionPanelTitle, getLocationLabel(expedition.currentLocation));
    safeSetText(ui.locationDescription, getLocationPanelText(location));
    renderTowerNodePanel(expedition.currentLocation);
    hideElement(ui.campContent);
    showElement(ui.locationContent, "block");
    return;
  }

  setCampActionsAvailable(true);

  if (gameState.phase === "expedition") {
    safeSetText(ui.campPanelTitle, "Camp");
    safeSetText(ui.expeditionPanelTitle, "Expedition");
    setUiActionButtonLabel(ui.restBtn, {
      label: "Rest at Camp",
      cost: getUiActionCostText("rest"),
    });
  } else if (gameState.phase === "clearing") {
    safeSetText(ui.campPanelTitle, "Clearing");
    safeSetText(ui.expeditionPanelTitle, "Expedition");
    setUiActionButtonLabel(ui.restBtn, {
      label: "Rest in Clearing",
      cost: getUiActionCostText("rest"),
    });
  } else {
    safeSetText(ui.campPanelTitle, "Lost in the Woods");
    safeSetText(ui.expeditionPanelTitle, "Expedition");
    setUiActionButtonLabel(ui.restBtn, {
      label: "Rest",
      cost: getUiActionCostText("rest"),
    });
  }

  showElement(ui.campContent, "block");
  hideElement(ui.locationContent);

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

function syncLocationObjectActionsPlacement(locationName) {
  if (!ui.locationObjectActions) return;

  const shouldUseCampSlot = locationName === "clearing" && gameState.phase === "clearing" && gameState.discoveredClearing;
  const targetSlot = shouldUseCampSlot ? ui.campLocationObjectActionsSlot : ui.expeditionLocationObjectActionsSlot;

  if (targetSlot && ui.locationObjectActions.parentElement !== targetSlot) {
    targetSlot.appendChild(ui.locationObjectActions);
  }
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

  const currentPlaceName = getCurrentObjectPlaceName();
  syncLocationObjectActionsPlacement(currentPlaceName);
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
    const requirementText = getLocationObjectRequirementText(object);
    const isRequirementLocked =
      !isAvailable &&
      !!requirementText &&
      isLocationObjectAvailable(object, {
        ignoreManaSenseCharges: true,
        ignoreSpellCharges: true,
        ignoreResourceMaximums: true,
      });

    if (!isAvailable && !isRequirementLocked) continue;

    hasVisibleObject = true;

    const stages = getLocationObjectStages(object);
    const progress = getLocationObjectProgress(object);
    let label = object.label;
    let detail = "";

    if (isRequirementLocked) {
      detail = requirementText;
    } else if (stages.length > 1) {
      detail = "Step " + (progress + 1) + " / " + stages.length;
    }

    const button = createUiActionButton({
      label,
      cost: isRequirementLocked ? "" : formatCost(getLocationObjectCost(object)),
      detail,
      dataset: {
        locationObject: objectName,
      },
    });

    const isCurrentObjectActivity =
      isActivityActive() && gameState.activity.kind === "locationObject" && gameState.activity.context.objectName === objectName;

    button.disabled = isRequirementLocked || (!isCurrentObjectActivity && (isActivityActive() || !canAffordCost(getLocationObjectCost(object))));

    if (!isRequirementLocked) {
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

function getLocationObjectRequirementText(object) {
  if (!object || !object.requires) return "";

  const requirements = [];

  if (object.requires.resourceMaximums) {
    for (let resourceName in object.requires.resourceMaximums) {
      const resource = getResource(resourceName);
      const required = object.requires.resourceMaximums[resourceName];

      if (!resource || resource.maxValue < required) {
        const label = resource ? resource.label : resourceName;
        const current = resource ? resource.maxValue : 0;

        requirements.push("Maximum " + label + " " + current + "/" + required);
      }
    }
  }

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

  if (!options.ignoreResourceMaximums && object.requires.resourceMaximums) {
    for (let resourceName in object.requires.resourceMaximums) {
      const resource = getResource(resourceName);

      if (!resource || resource.maxValue < object.requires.resourceMaximums[resourceName]) {
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

  let text = location.onDiscoverStory || "";

  if (location.panelText) {
    if (location.explored && location.panelText.explored) {
      text = location.panelText.explored;
    } else if (location.panelText.discovered) {
      text = location.panelText.discovered;
    }
  }

  if (Number.isFinite(location.looseStoneMax)) {
    const remaining = getLocationLooseStoneRemaining(location);

    if (remaining <= 0) {
      return "The loose stone around the cave mouth has been picked clean. More stone will have to come from the foothills. Loose stone remaining: 0";
    }

    return text + " Loose stone remaining: " + remaining;
  }

  return text;
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
      updateCurrentGoalUI();

      return true;
    }
  }

  return false;
}

function getDisplayedExpeditionDistance() {
  const expedition = gameState.expedition;

  if (!expedition.active || expedition.currentLocation) {
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
  renderExpeditionWorkflowPanel();
}

function renderExpeditionWorkflowPanel() {
  if (!ui.expeditionWorkflowPanel) return;

  const expedition = gameState.expedition;
  const packedParts = getPackedExpeditionSummaryParts();
  const packCapacity = formatCarryAmount(getCarriedTotal()) + " / " + formatCarryAmount(getEffectiveCarryCapacity());
  const meta = [
    {
      label: "Pack",
      value: packCapacity + (packedParts.length > 0 ? " · " + packedParts.join(" · ") : " · Empty"),
    },
    {
      label: "Water",
      value: formatCarryAmount(expedition.water || 0) + " / " + formatCarryAmount(expedition.waterCapacity || 0),
    },
  ];
  let title = "Choose an expedition";
  let status = "Ready";
  let body = "Select a route, pack supplies, then prepare to leave camp.";

  if (expedition.dungeon && expedition.dungeon.active) {
    const dungeon = getCurrentDungeon();
    const node = getCurrentDungeonNode();

    title = dungeon ? dungeon.label : "Dungeon";
    status = "Dungeon";
    body = node ? "Current room: " + node.label : "Move through the ruin and search rooms when it is safe.";
  } else if (expedition.currentLocation) {
    const location = getExpeditionLocation(expedition.currentLocation);

    title = getLocationLabel(expedition.currentLocation);
    status = "Location";
    body = getLocationPanelText(location);
  } else if (expedition.active) {
    title = getPreparedExpeditionTitle();

    if (isTravelActivityActive()) {
      status = "Traveling";
      body = getCurrentTravelDescription();
    } else if (expedition.distance > 0) {
      status = "Paused";
      body = "Travel is paused. Continue onward or return to camp.";
    } else {
      status = "Preparing";
      body = "Pack supplies, then start travel when you are ready.";
    }
  } else if (gameState.phase === "expedition") {
    const regionId = getSelectedTravelRegionId();
    const region = getRegionDefinition(regionId);
    const knownCount = getRegionKnownLocations(regionId).length;

    title = region ? region.label : "Expedition";
    status = getRegionStatus(regionId);
    body = "Choose open travel or a known place in this region.";
    meta.push(
      {
        label: "Known places",
        value: String(knownCount),
      },
      {
        label: "Open route",
        value: formatDistance(getSelectedTravelDistance()),
      }
    );
  } else {
    meta.push({
      label: "Camp",
      value: gameState.phase === "lost" ? "Lost" : "Clearing",
    });
  }

  renderUiContextPanel(ui.expeditionWorkflowPanel, {
    title,
    status,
    body,
    meta,
    className: "expedition-workflow-summary",
  });
}

function getPreparedExpeditionTitle() {
  const expedition = gameState.expedition;

  if (isTowerNodeJumpExpedition()) {
    const nodeName = getPreparedTowerNodeName();
    const definition = nodeName ? getTowerNodeDefinition(nodeName) : null;

    return (definition && definition.destinationLabel) || "Tower Node Jump";
  }

  if (expedition.destination) {
    return getLocationLabel(expedition.destination);
  }

  const region = getRegionDefinition(getSelectedTravelRegionId());

  return region ? region.label : "Open Expedition";
}

//Helper to Toggle Packing Buttons
function setPackingActionsAvailable(available) {
  if (!available) {
    lockAction("packFood");
    lockAction("packWater");
    lockAction("packTrap");
    lockAction("packPelt");
    lockAction("packWood");
    lockAction("packStone");
    lockAction("packIron");
    lockAction("packImbuedWood");
    lockAction("packOre");
    lockAction("packHerb");
    lockAction("packGlimmerleaf");
    lockAction("packChargedCrystal");
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

  if (typeof canPackTowerNodeMaterial === "function" && canPackTowerNodeMaterial("stone")) {
    unlockAction("packStone");
  } else {
    lockAction("packStone");
  }

  if (typeof canPackTowerNodeMaterial === "function" && canPackTowerNodeMaterial("iron")) {
    unlockAction("packIron");
  } else {
    lockAction("packIron");
  }

  const imbuedWood = getResource("imbuedWood");

  if (imbuedWood.value > 0) {
    unlockAction("packImbuedWood");
  } else {
    lockAction("packImbuedWood");
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

  const glimmerleaf = getResource("glimmerleaf");

  if (glimmerleaf.value > 0) {
    unlockAction("packGlimmerleaf");
  } else {
    lockAction("packGlimmerleaf");
  }

  if (typeof canPackTowerNodeMaterial === "function" && canPackTowerNodeMaterial("chargedCrystal")) {
    unlockAction("packChargedCrystal");
  } else {
    lockAction("packChargedCrystal");
  }
}

function enterExpeditionPreparation() {
  const expedition = gameState.expedition;

  expedition.active = true;
  expedition.completed = false;
  expedition.distance = 0;
  if (expedition.destination) {
    const destination = getExpeditionLocation(expedition.destination);
    expedition.targetDistance = getLocationTravelDistance(destination);
  } else {
    expedition.targetDistance = getSelectedTravelDistance();
  }
  resetTrapSiteChecks();
  clearCurrentLocation();

  lockAction("beginExpedition");
  unlockAction("travel");
  unlockAction("returnToCamp");

  setCampActionsAvailable(false);
  setPackingActionsAvailable(true);
  updateCraftingUIForCurrentContext();
  updateRegionalMapVisibility();

  if (typeof setMainView === "function") {
    setMainView("expedition");
  }
}

function prepareOpenExpedition() {
  gameState.expedition.destination = null;
  gameState.expedition.regionId = gameState.world.selectedRegion || "outskirts";
  gameState.expedition.routeType = EXPEDITION_ROUTE_OPEN;

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
  gameState.expedition.routeType = EXPEDITION_ROUTE_DESTINATION;

  enterExpeditionPreparation();
  renderDestinationActions();

  addStoryEntry("You prepare to travel to " + getLocationLabel(locationName) + ".");
  refreshExpeditionUI();
  updatePlacePanel();
}

function prepareTowerNodeJump(nodeName) {
  const definition = getTowerNodeDefinition(nodeName);

  if (!definition || !canPrepareTowerNodeJump(nodeName, definition.locationName)) return;

  gameState.expedition.destination = definition.locationName;
  gameState.expedition.regionId = definition.regionId || getLocationRegionId(getExpeditionLocation(definition.locationName));
  gameState.expedition.routeType = EXPEDITION_ROUTE_TOWER_NODE;

  enterExpeditionPreparation();
  gameState.expedition.targetDistance = 0;
  renderDestinationActions();

  addStoryEntry("You prepare to jump to the " + definition.destinationLabel + ".");
  refreshExpeditionUI();
  updateTravelButton(false);
  updatePlacePanel();
}

function getPreparedTowerNodeName() {
  const expedition = gameState.expedition;

  if (!expedition.active || expedition.routeType !== EXPEDITION_ROUTE_TOWER_NODE || !expedition.destination) return null;

  return typeof getBuiltTowerNodeForLocation === "function" ? getBuiltTowerNodeForLocation(expedition.destination) : null;
}

function isTowerNodeJumpExpedition() {
  return !!getPreparedTowerNodeName();
}

function startTowerNodeJump() {
  const nodeName = getPreparedTowerNodeName();
  const definition = nodeName ? getTowerNodeDefinition(nodeName) : null;

  if (!definition || !canPrepareTowerNodeJump(nodeName, definition.locationName)) return;
  if (!spendCost(getTowerNodeJumpCost(nodeName))) return;

  resetActivity();
  gameState.expedition.distance = 0;
  gameState.expedition.targetDistance = 0;
  gameState.expedition.destination = null;
  gameState.expedition.routeType = EXPEDITION_ROUTE_DESTINATION;

  setCurrentLocation(definition.locationName);
  lockAction("travel");
  unlockAction("returnToCamp");
  setPackingActionsAvailable(false);

  addStoryEntry("Mana folds through the Heart's northern path. You arrive at the " + getLocationLabel(definition.locationName) + " with your pack intact.");
  updateResource("mana");
  refreshExpeditionUI();
  updateTravelButton(false);
  updateAllActionButtons();
  updateCraftingButtons();
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

    const button = createUiActionButton({
      label: "Travel to " + getLocationLabel(locationName),
      detail: formatDistance(getLocationTravelDistance(location)),
      progress: false,
      onClick: function () {
        startActivity({
          kind: "instant",
          id: "destinationTravel",
          context: { locationName: locationName },
        });
      },
    });

    ui.destinationActions.appendChild(button);

    const nodeName = typeof getBuiltTowerNodeForLocation === "function" ? getBuiltTowerNodeForLocation(locationName) : null;

    if (nodeName && canPrepareTowerNodeJump(nodeName, locationName)) {
      const nodeDefinition = getTowerNodeDefinition(nodeName);
      const nodeButton = createUiActionButton({
        label: "Prepare " + ((nodeDefinition && nodeDefinition.destinationLabel) || "Tower Node") + " Jump",
        progress: false,
        onClick: function () {
          startActivity({
            kind: "instant",
            id: "towerNodeJumpPreparation",
            context: { nodeName: nodeName },
          });
        },
      });

      ui.destinationActions.appendChild(nodeButton);
    }
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

    const button = createUiActionButton({
      label: "Travel to " + getLocationLabel(targetLocationName),
      detail: formatDistance(distance),
      progress: false,
      onClick: function () {
        beginLocationToLocationTravel(locationName, targetLocationName);
      },
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
  gameState.expedition.routeType = EXPEDITION_ROUTE_INTRA_REGION;
  gameState.expedition.distance = 0;
  gameState.expedition.targetDistance = distance;

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

function getDungeonNodeLayer(node) {
  return node && node.layer ? node.layer : "main";
}

function getDungeonLayerLabel(dungeon, layerId) {
  if (!dungeon || !dungeon.layers || !layerId) return "";

  return dungeon.layers[layerId] || "";
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
  const currentLayer = getDungeonNodeLayer(currentNode);
  const layerLabel = getDungeonLayerLabel(dungeon, currentLayer);

  safeSetText(ui.dungeonTitle, layerLabel ? dungeon.label + " - " + layerLabel : dungeon.label);
  showElement(ui.dungeonTitle, "block");
  safeSetText(ui.dungeonRoomText, currentNode.description || "");

  const nodes = getDungeonNodes(dungeonState.dungeonId);

  for (let nodeId in nodes) {
    const node = nodes[nodeId];

    const isCurrentNode = nodeId === dungeonState.nodeId;
    const hasExitFromCurrentNode = !!getDungeonNodeExit(currentNode, nodeId);
    const isCurrentLayerNode = getDungeonNodeLayer(node) === currentLayer;
    const shouldShowNode = (isCurrentLayerNode && node.discovered) || hasExitFromCurrentNode;
    const requirementText = getDungeonRequirementText(node.requires, node);
    const movementBlockedText = getDungeonMovementBlockedText(nodeId);
    const isRequirementLocked = !canEnterDungeonNode(dungeonState.dungeonId, nodeId);
    const isMovementLocked = !isRequirementLocked && !!movementBlockedText;
    const isLocked = isRequirementLocked || isMovementLocked;
    const lockedText = isRequirementLocked ? requirementText || "You are not ready to enter this room." : movementBlockedText;

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
      roomButton.title = lockedText;

      if (hasExitFromCurrentNode) {
        roomButton.disabled = false;

        roomButton.addEventListener("click", function () {
          safeSetText(ui.dungeonRoomText, lockedText || "Something blocks the way.");
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

  const chance = getDungeonSearchChance(node);
  const charges = node.manaSenseCharges || 0;
  const button = createUiActionButton({
    label: "Explore Room",
    cost: formatCost(getDungeonSearchCost(node)),
    detail: charges > 0 ? chance + "%, Sense " + charges : chance + "%",
    dataset: {
      dungeonAction: "exploreRoom",
    },
  });

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

function getDungeonNodeSpellCharges(node) {
  if (!node) return {};

  if (!node.spellCharges || typeof node.spellCharges !== "object" || Array.isArray(node.spellCharges)) {
    node.spellCharges = {};
  }

  if (node.manaSenseCharges && !node.spellCharges.manaSense) {
    node.spellCharges.manaSense = node.manaSenseCharges;
  }

  return node.spellCharges;
}

function getDungeonNodeSpellCharge(node, spellName) {
  const charges = getDungeonNodeSpellCharges(node);

  return charges[spellName] || 0;
}

function setDungeonNodeSpellCharge(node, spellName, amount) {
  const charges = getDungeonNodeSpellCharges(node);

  charges[spellName] = amount;

  if (spellName === "manaSense") {
    node.manaSenseCharges = amount;
  }
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
  const fallbackBonus = spell && spell.effects ? spell.effects.dungeonSearchBonus || 0 : 0;
  const bonusPerCharge = typeof getManaSenseDungeonSearchBonus === "function" ? getManaSenseDungeonSearchBonus() : fallbackBonus;
  const hiddenDiscoveryBonus =
    typeof getManaSenseHiddenDiscoveryBonusChance === "function" ? getManaSenseHiddenDiscoveryBonusChance() : 0;
  const charges = node.manaSenseCharges || 0;

  return Math.min(100, baseChance + hiddenDiscoveryBonus + charges * bonusPerCharge);
}

function rollDungeonSearchSuccess(node) {
  const chance = getDungeonSearchChance(node);

  return Math.random() * 100 < chance;
}

function canEnterDungeonNode(dungeonId, nodeId) {
  const node = getDungeonNode(dungeonId, nodeId);

  if (!node) return false;

  return meetsDungeonRequirements(node.requires, node);
}

function meetsDungeonRequirements(requires, node) {
  if (!requires) return true;

  if (requires.gearPurchased) {
    for (let i = 0; i < requires.gearPurchased.length; i++) {
      if (!hasPurchasedGear(requires.gearPurchased[i])) {
        return false;
      }
    }
  }

  if (requires.spellCharges) {
    for (let spellName in requires.spellCharges) {
      if (getDungeonNodeSpellCharge(node, spellName) < requires.spellCharges[spellName]) {
        return false;
      }
    }
  }

  return true;
}

function getDungeonRequirementText(requires, node) {
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

  if (requires.spellCharges) {
    for (let spellName in requires.spellCharges) {
      const current = getDungeonNodeSpellCharge(node, spellName);
      const required = requires.spellCharges[spellName];

      if (current < required) {
        missingRequirements.push(getLocationObjectSpellRequirementPart(spellName, current, required));
      }
    }
  }

  if (missingRequirements.length === 0) return "";

  return "Requires " + missingRequirements.join(", ") + ".";
}

function isDungeonRoomFullyExplored(node) {
  if (!node) return false;

  return !!node.explored || !node.search;
}

function getDungeonMovementBlockedText(targetNodeId) {
  const dungeonState = getCurrentDungeonState();
  const currentNode = getCurrentDungeonNode();

  if (!dungeonState || !dungeonState.active || !currentNode) return "";

  const targetNode = getDungeonNode(dungeonState.dungeonId, targetNodeId);

  if (!targetNode) return "";
  if (targetNode.discovered) return "";
  if (!getDungeonNodeExit(currentNode, targetNodeId)) return "";
  if (isDungeonRoomFullyExplored(currentNode)) return "";

  return "Explore this room before moving deeper.";
}

function canEnterLocationDungeon(locationName) {
  const location = getExpeditionLocation(locationName);

  if (!location || !location.explored || !location.dungeon) return false;
  const lightTool = getPurchasedEquipmentForSlot("tool", "tool");
  if (!lightTool || !lightTool.effects || !lightTool.effects.darkExploration) return false;
  if (location.dungeonUnlockedFlag && !gameState[location.dungeonUnlockedFlag]) return false;
  if (!getDungeon(location.dungeon)) return false;

  return true;
}

function enterCurrentLocationDungeon() {
  const locationName = gameState.expedition.currentLocation;
  const location = getExpeditionLocation(locationName);

  if (!canEnterLocationDungeon(locationName)) return;

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
  if (getDungeonMovementBlockedText(targetNodeId)) return false;

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
  setDungeonNodeSpellCharge(node, "manaSense", 0);

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
      const rewardAmount = getFoundCarriedRewardAmount(itemName, reward.carried[itemName]);
      const amount = rewardAmount.amount;
      const carriedAmount = addCarriedItemUpToCapacity(itemName, amount);

      if (carriedAmount > 0) {
        addStoryEntry("You collect " + carriedAmount + " " + itemName + ".");
        unlockResource(itemName);
      }

      if (rewardAmount.bonus > 0 && carriedAmount > reward.carried[itemName]) {
        const bonusCarried = Math.min(rewardAmount.bonus, carriedAmount - reward.carried[itemName]);

        addStoryEntry("Mana Sense reveals " + bonusCarried + " extra mana crystal" + (bonusCarried === 1 ? "" : "s") + ".");
      }

      if (carriedAmount < amount) {
        addStoryEntry("You cannot carry everything you found.");
      }
    }
  }

  if (reward.unlocks) {
    applyUnlocks(reward.unlocks);
    checkResearchDiscoveries();
  }

  node.rewardClaimed = true;
}

function getFoundCarriedRewardAmount(itemName, amount) {
  const baseAmount = Math.max(0, Math.floor(amount || 0));
  const bonus =
    itemName === "manaCrystal" && getSpell("manaSense")?.unlocked && typeof rollManaSenseBonusManaCrystals === "function"
      ? rollManaSenseBonusManaCrystals()
      : 0;

  return {
    amount: baseAmount + bonus,
    bonus,
  };
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
