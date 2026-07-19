const ui = {};
let resourceElements = {};
let panelElements = {};

function hookDomToUI() {
  ui.introPopup = document.getElementById("introPopup");
  ui.continueBtn = document.getElementById("continueBtn");
  ui.restBtn = document.getElementById("restBtn");
  ui.campEstablishedPopup = document.getElementById("campEstablishedPopup");
  ui.campEstablishedContinueBtn = document.getElementById("campEstablishedContinueBtn");
  ui.campPanel = document.getElementById("campPanel");
  ui.waterAmount = document.getElementById("waterAmount");
  ui.foodAmount = document.getElementById("foodAmount");
  ui.woodAmount = document.getElementById("woodAmount");
  ui.smallFire = document.getElementById("smallFire");
  ui.crudeLeanTo = document.getElementById("crudeLeanTo");
  ui.smallFireBtn = document.getElementById("smallFireBtn");
  ui.crudeLeanToBtn = document.getElementById("crudeLeanToBtn");
  ui.expeditionPanel = document.getElementById("expeditionPanel");
  ui.expeditionDistanceAmount = document.getElementById("expeditionDistanceAmount");
  ui.fiberAmount = document.getElementById("fiberAmount");
  ui.storyLog = document.getElementById("storyLog");
  ui.trapAmount = document.getElementById("trapAmount");
  ui.peltAmount = document.getElementById("peltAmount");
  ui.carriedAmount = document.getElementById("carriedAmount");
  ui.carriedWaterAmount = document.getElementById("carriedWaterAmount");
  ui.characterEnergyAmount = document.getElementById("characterEnergyAmount");
  ui.campPanelTitle = document.getElementById("campPanelTitle");
  ui.gearSection = document.getElementById("gearSection");
  ui.crudeSatchel = document.getElementById("crudeSatchel");
  ui.crudeSatchelBtn = document.getElementById("crudeSatchelBtn");
  ui.campContent = document.getElementById("campContent");
  ui.locationContent = document.getElementById("locationContent");
  ui.locationDescription = document.getElementById("locationDescription");
  ui.stoneAmount = document.getElementById("stoneAmount");
  ui.inventorySection = document.getElementById("inventorySection");
  ui.storageSection = document.getElementById("storageSection");
  ui.trapSitesList = document.getElementById("trapSitesList");
  ui.locationObjectActions = document.getElementById("locationObjectActions");
  ui.expeditionDistanceBar = document.getElementById("expeditionDistanceBar");
  ui.expeditionDistanceFill = document.getElementById("expeditionDistanceFill");
  ui.saveGameBtn = document.getElementById("saveGameBtn");
  ui.loadGameBtn = document.getElementById("loadGameBtn");
  ui.resetSaveBtn = document.getElementById("resetSaveBtn");
  ui.destinationActions = document.getElementById("destinationActions");
  ui.craftingSection = document.getElementById("craftingSection");
  ui.outskirtsCompletePopup = document.getElementById("outskirtsCompletePopup");
  ui.outskirtsCompleteContinueBtn = document.getElementById("outskirtsCompleteContinueBtn");
  ui.currentGoalSection = document.getElementById("currentGoalSection");
  ui.currentGoalTitle = document.getElementById("currentGoalTitle");
  ui.currentGoalText = document.getElementById("currentGoalText");
  ui.journalEntries = document.getElementById("journalEntries");
  ui.torchSparkPopup = document.getElementById("torchSparkPopup");
  ui.torchSparkContinueBtn = document.getElementById("torchSparkContinueBtn");
  ui.manaAwakenedPopup = document.getElementById("manaAwakenedPopup");
  ui.manaAwakenedContinueBtn = document.getElementById("manaAwakenedContinueBtn");
  ui.regionalMapSection = document.getElementById("regionalMapSection");
  ui.regionalMap = document.getElementById("regionalMap");
  ui.regionDirection = document.getElementById("regionDirection");
  ui.regionName = document.getElementById("regionName");
  ui.regionStatus = document.getElementById("regionStatus");
  ui.regionDescription = document.getElementById("regionDescription");
  ui.regionProgressText = document.getElementById("regionProgressText");
  ui.regionProgressFill = document.getElementById("regionProgressFill");
  ui.regionTerrain = document.getElementById("regionTerrain");
  ui.regionKnownPlaceCount = document.getElementById("regionKnownPlaceCount");
  ui.packingSection = document.getElementById("packingSection");
  ui.gearSlotsGroup = document.getElementById("gearSlotsGroup");
  ui.gearSlots = document.getElementById("gearSlots");
  ui.toolSlotsGroup = document.getElementById("toolSlotsGroup");
  ui.toolSlots = document.getElementById("toolSlots");
  ui.carriedInventoryStrip = document.getElementById("carriedInventoryStrip");
  ui.campResourcesSection = document.getElementById("campResourcesSection");
  ui.campUpgradeSection = document.getElementById("campUpgradeSection");
}

//Hook Ui Maps Functions
function hookUIMaps() {
  resourceElements = {
    water: ui.waterAmount,
    food: ui.foodAmount,
    wood: ui.woodAmount,
    fiber: ui.fiberAmount,
    trap: ui.trapAmount,
    pelt: ui.peltAmount,
    stone: ui.stoneAmount,
    mana: document.getElementById("manaAmount"),
  };

  panelElements = {
    camp: ui.campPanel,
    expedition: ui.expeditionPanel,
  };
}

//UI Safety Function
function safeSetText(el, text) {
  if (el) {
    el.textContent = text;
  }
}

//UI Show/Hide Helpers
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

//Hook to UI Function
function hookStatsToUI() {
  const resourceDefinitions = getResourceDefinitions();

  for (let resourceName in resourceDefinitions) {
    const resource = resourceDefinitions[resourceName];

    resource.display = document.getElementById(resourceName + "Amount");
    resource.perClickDisplay = document.getElementById(resourceName + "PerClickDisplay");
    resource.perSecondDisplay = document.getElementById(resourceName + "PerSecondDisplay");
  }
}

//Update Resource UI
function updateResource(resourceName) {
  const resource = getResource(resourceName);

  const text = resource.label + ": " + Math.floor(resource.value * 10) / 10 + " / " + resource.maxValue;

  safeSetText(resource.display, text);

  if (resourceName === "energy") {
    safeSetText(ui.characterEnergyAmount, text);
  }

  safeSetText(resource.perClickDisplay, "+" + resource.perClick + "/Click");
  safeSetText(resource.perSecondDisplay, "+" + resource.perSecond + "/Sec");
  updateAllActionButtons();
}

function updateAllActionButtons() {
  const actionDefinitions = getActionDefinitions();

  for (let actionName in actionDefinitions) {
    updateActionButton(actionName);
  }
}

//UI Unlock Resource and Panels
function unlockResource(resourceName) {
  const resourceElement = resourceElements[resourceName];

  if (!resourceElement) {
    console.warn("Unknown resource unlock:", resourceName);
    return;
  }

  showElement(resourceElement, "block");

  updateCampResourcesSectionVisibility();
}

function updateCampResourcesSectionVisibility() {
  if (!ui.campResourcesSection) return;

  const campResourceNames = ["food", "wood", "fiber", "trap", "pelt", "stone"];

  for (let i = 0; i < campResourceNames.length; i++) {
    const resourceElement = resourceElements[campResourceNames[i]];

    if (resourceElement && resourceElement.style.display !== "none") {
      showElement(ui.campResourcesSection, "flex");
      return;
    }
  }

  hideElement(ui.campResourcesSection);
}

function unlockPanel(panelName) {
  const panel = panelElements[panelName];

  if (!panel) {
    console.warn("Unknown panel unlock:", panelName);
    return;
  }

  showElement(panel);
}

//Discover Popup & Function & CampDisplay
function showCampEstablishedPopup() {
  ui.campEstablishedPopup.style.display = "flex";
}

function showCampPanel() {
  ui.campPanel.style.display = "flex";
}

function showOutskirtsCompletePopup() {
  ui.outskirtsCompletePopup.style.display = "flex";
}

function showTorchSparkPopup() {
  ui.torchSparkPopup.style.display = "flex";
}

function showManaAwakenedPopup() {
  ui.manaAwakenedPopup.style.display = "flex";
}

//Update Expedition UI
function updateExpeditionUI(carriedTotal, carriedSummary) {
  const expedition = gameState.expedition;

  safeSetText(ui.expeditionDistanceAmount, "Distance: " + formatDistance(expedition.distance) + " / " + formatDistance(expedition.targetDistance));

  const distanceProgress = expedition.targetDistance > 0 ? expedition.distance / expedition.targetDistance : 0;
  const clampedDistanceProgress = Math.min(Math.max(distanceProgress, 0), 1);

  if (ui.expeditionDistanceFill) {
    ui.expeditionDistanceFill.style.width = clampedDistanceProgress * 100 + "%";
  }

  safeSetText(ui.carriedAmount, "Carried: " + carriedTotal + " / " + expedition.carryCapacity + " (" + carriedSummary + ")");
  safeSetText(ui.carriedWaterAmount, "Water: " + expedition.water + " / " + expedition.waterCapacity);
}

function formatDistance(distance) {
  return Math.round(distance * 10) / 10;
}

//Add story event helper
function addStoryEntry(text) {
  const entry = document.createElement("div");
  entry.classList.add("story-entry");
  entry.textContent = text;

  ui.storyLog.appendChild(entry);

  while (ui.storyLog.children.length > 30) {
    ui.storyLog.removeChild(ui.storyLog.firstChild);
  }

  ui.storyLog.scrollTop = ui.storyLog.scrollHeight;
}

//Update Camp Upgrade UI
function updateCampUpgradeDisplay(upgrade) {
  if (!upgrade) return;

  if (upgrade.button) {
    upgrade.button.style.display = upgrade.unlocked && !upgrade.purchased ? "inline-block" : "none";
  }

  if (upgrade.display) {
    upgrade.display.style.display = upgrade.purchased ? "flex" : "none";
  }

  updateCampUpgradeSectionVisibility();
}

function updateCampUpgradeSectionVisibility() {
  const campUpgradeDefinitions = getCampUpgradeDefinitions();

  for (let upgradeName in campUpgradeDefinitions) {
    const upgrade = getCampUpgrade(upgradeName);

    if (upgrade.purchased) {
      showElement(ui.campUpgradeSection, "flex");
      return;
    }
  }

  hideElement(ui.campUpgradeSection);
}

function updateActionButton(actionName) {
  const action = getAction(actionName);

  if (!action || !action.button) return;

  action.button.style.display = action.unlocked ? "inline-block" : "none";

  if (!action.unlocked) {
    action.button.disabled = true;
    return;
  }

  const isCurrentActivity =
    isActivityActive() &&
    ((gameState.activity.kind === "action" && gameState.activity.id === actionName) ||
      (gameState.activity.kind === "travel" && actionName === "travel"));

  action.button.disabled = !action.unlocked || (!isCurrentActivity && isActivityActive()) || !canUseAction(actionName);
}

function canUseAction(actionName) {
  const action = getAction(actionName);

  if (!action) return false;

  if (action.running) return true;

  if (!canAffordCost(action.cost)) return false;

  if (!isActionContextAvailable(actionName)) return false;

  return true;
}

function isActionContextAvailable(actionName) {
  const locationName = gameState.expedition.currentLocation;

  if (actionName === "scoutTrapSite") {
    return !!locationName && !!getFirstHiddenTrapSite(locationName);
  }

  if (actionName === "setTrap") {
    return !!locationName && hasOpenTrapSite(locationName) && gameState.expedition.carriedItems.trap > 0;
  }

  if (actionName === "checkTrap") {
    return !!locationName && hasUncheckedInstalledTrapSite(locationName);
  }

  return true;
}

function setProgressBar(action, progress) {
  if (action.progressBar) {
    action.progressBar.style.width = progress * 100 + "%";
  }
}

function resetProgressBar(action) {
  if (action.progressBar) {
    action.progressBar.style.width = "0%";
  }
}

function updateTravelButton(isTraveling) {
  const travelButton = getAction("travel").button;

  if (!travelButton) return;

  const label = travelButton.querySelector("span");

  if (label) {
    label.textContent = isTraveling ? "Pause Travel" : "Travel";
  }
}

//Hook Action Button Function
function hookActionButtonsToUI(onActionClick) {
  const buttons = document.querySelectorAll(".action-btn");

  buttons.forEach((btn) => {
    const actionName = btn.dataset.action;
    const action = getAction(actionName);

    if (!action) return;

    action.button = btn;
    action.progressBar = btn.querySelector(".progressFill");
    action.metaProgressBar = btn.querySelector(".metaProgressFill");
    updateActionButton(actionName);

    btn.addEventListener("click", function () {
      onActionClick(actionName);
    });
  });
}

function updateCharacterPanelLocks() {
  const campUnlocked = gameState.phase === "expedition";

  if (campUnlocked) {
    showElement(ui.carriedInventoryStrip, "flex");

    if (hasUnlockedOrPurchasedGear()) {
      showElement(ui.gearSection, "block");
    }
  } else {
    hideElement(ui.carriedInventoryStrip);
    hideElement(ui.gearSection);
  }
}

function hasUnlockedOrPurchasedGear() {
  const gearUpgradeDefinitions = getGearUpgradeDefinitions();

  for (let gearName in gearUpgradeDefinitions) {
    const gear = getGearUpgrade(gearName);

    if (gear.purchased) {
      return true;
    }
  }

  return false;
}

function prepareCraftButton(button) {
  if (!button) return;

  let progressFill = button.querySelector(".progressFill");

  if (!progressFill) {
    progressFill = document.createElement("div");
    progressFill.classList.add("progressFill");
    button.prepend(progressFill);
  }

  let name = button.querySelector(".craft-name");

  if (!name) {
    name = document.createElement("span");
    name.classList.add("craft-name");
    button.appendChild(name);
  }

  let cost = button.querySelector(".craft-cost");

  if (!cost) {
    cost = document.createElement("span");
    cost.classList.add("craft-cost");
    button.appendChild(cost);
  }
}

function updateCurrentGoalUI() {
  const goal = getGoal(gameState.currentGoalId);

  if (!goal) {
    hideElement(ui.currentGoalSection);
    return;
  }

  showElement(ui.currentGoalSection, "block");
  safeSetText(ui.currentGoalTitle, goal.title);
  safeSetText(ui.currentGoalText, goal.text);
}

function setCurrentGoal(goalId) {
  if (!getGoal(goalId)) {
    console.warn("Unknown goal:", goalId);
    return;
  }

  gameState.currentGoalId = goalId;
  updateCurrentGoalUI();
}

function addJournalEntry(entryId) {
  if (gameState.journal.entries.includes(entryId)) return;

  const entry = getJournalEntryDefinition(entryId);

  if (!entry) {
    console.warn("Unknown journal entry:", entryId);
    return;
  }

  gameState.journal.entries.push(entryId);
  updateJournalUI();
}

function updateJournalUI() {
  if (!ui.journalEntries) return;

  ui.journalEntries.innerHTML = "";

  if (gameState.journal.entries.length === 0) {
    const empty = document.createElement("div");
    empty.classList.add("journal-empty");
    empty.textContent = "No lasting discoveries recorded yet.";
    ui.journalEntries.appendChild(empty);
    return;
  }

  gameState.journal.entries.forEach((entryId) => {
    const entry = getJournalEntryDefinition(entryId);

    if (!entry) return;

    const row = document.createElement("article");
    row.classList.add("journal-entry");

    const title = document.createElement("h3");
    title.textContent = entry.title;

    const text = document.createElement("p");
    text.textContent = entry.text;

    row.appendChild(title);
    row.appendChild(text);
    ui.journalEntries.appendChild(row);
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getRegionState(regionId) {
  return gameState.world.regions[regionId];
}

function getRegionStatus(regionId) {
  const definition = getRegionDefinition(regionId);
  const state = getRegionState(regionId);

  if (!state.unlocked) return "Locked";
  if (state.mastered || state.progress >= definition.maxProgress) return "Mastered";
  if (state.progress <= 0) return "Unexplored";
  if (state.progress < definition.maxProgress * 0.25) return "Surveying";
  if (state.progress < definition.maxProgress * 0.75) return "Known route";
  return "Nearly mastered";
}

function getNextRegionMilestone(regionId) {
  const definition = getRegionDefinition(regionId);
  const state = getRegionState(regionId);
  const next = definition.milestones.find((milestone) => state.progress < milestone.at);

  return next ? "Next at " + next.at + ": " + next.text : "All regional milestones completed.";
}

function updateRegionalMapVisibility() {
  if (!ui.regionalMapSection) return;

  const shouldShowRegionMap =
    gameState.tier3Unlocked &&
    gameState.phase === "expedition" &&
    !gameState.expedition.active &&
    !gameState.expedition.currentLocation &&
    !gameState.expedition.returning;

  if (shouldShowRegionMap) {
    showElement(ui.regionalMapSection, "block");
    renderRegionalMap();
    renderSelectedRegion();
  } else {
    hideElement(ui.regionalMapSection);
  }
}

function renderRegionalMap() {
  if (!ui.regionalMap) return;

  ui.regionalMap.innerHTML = "";

  const regionDefinitions = getRegionDefinitions();

  for (let regionId in regionDefinitions) {
    const definition = regionDefinitions[regionId];
    const state = getRegionState(regionId);
    const percent = clamp((state.progress / definition.maxProgress) * 100, 0, 100);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "region-node";
    button.dataset.region = regionId;
    button.disabled = !state.unlocked;
    button.setAttribute("aria-pressed", String(gameState.world.selectedRegion === regionId));

    const direction = document.createElement("span");
    direction.className = "region-node-direction";
    direction.textContent = definition.direction;

    const name = document.createElement("span");
    name.className = "region-node-name";
    name.textContent = state.unlocked ? definition.label : "Unknown";

    const status = document.createElement("span");
    status.className = "region-node-status";
    status.textContent = state.unlocked ? Math.floor(state.progress) + " / " + definition.maxProgress : "Locked";

    const track = document.createElement("span");
    track.className = "region-node-progress";

    const fill = document.createElement("span");
    fill.className = "region-node-progress-fill";
    fill.style.width = percent + "%";

    track.appendChild(fill);
    button.append(direction, name, status, track);

    button.addEventListener("click", function () {
      selectRegion(regionId);
    });

    ui.regionalMap.appendChild(button);
  }
}

function renderSelectedRegion() {
  const regionId = gameState.world.selectedRegion;
  const definition = getRegionDefinition(regionId);
  const state = getRegionState(regionId);

  if (!definition || !state) return;

  const percent = clamp((state.progress / definition.maxProgress) * 100, 0, 100);

  safeSetText(ui.regionDirection, definition.direction);
  safeSetText(ui.regionName, definition.label);
  safeSetText(ui.regionStatus, getRegionStatus(regionId));
  safeSetText(ui.regionDescription, definition.description);
  safeSetText(ui.regionProgressText, Math.floor(state.progress) + " / " + definition.maxProgress);
  safeSetText(ui.regionTerrain, definition.terrain);
  safeSetText(ui.regionKnownPlaceCount, String(state.locations.length));

  if (ui.regionProgressFill) {
    ui.regionProgressFill.style.width = percent + "%";
  }
}

function selectRegion(regionId) {
  const state = getRegionState(regionId);

  if (!state || !state.unlocked) return;

  gameState.world.selectedRegion = regionId;
  renderRegionalMap();
  renderSelectedRegion();
  trySaveGame();
}
