const ui = {};
let resourceElements = {};
let panelElements = {};
let tabButtons = {};
let tabPanels = {};
let activeTab = "camp";

function hookDomToUI() {
  ui.mainTabs = document.getElementById("mainTabs");
  ui.introPopup = document.getElementById("introPopup");
  ui.continueBtn = document.getElementById("continueBtn");
  ui.restBtn = document.getElementById("restBtn");
  ui.campEstablishedPopup = document.getElementById("campEstablishedPopup");
  ui.campEstablishedContinueBtn = document.getElementById("campEstablishedContinueBtn");
  ui.campEstablishedPopup = document.getElementById("campEstablishedPopup");
  ui.campEstablishedContinueBtn = document.getElementById("campEstablishedContinueBtn");
  ui.campPanel = document.getElementById("campPanel");
  ui.waterAmount = document.getElementById("waterAmount");
  ui.foodAmount = document.getElementById("foodAmount");
  ui.woodAmount = document.getElementById("woodAmount");
  ui.smallFire = document.getElementById("smallFire");
  ui.crudeLeanTo = document.getElementById("crudeLeanTo");
  ui.campEmptyState = document.getElementById("campEmptyState");
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
  ui.campCraftCategory = document.getElementById("campCraftCategory");
  ui.gearCraftCategory = document.getElementById("gearCraftCategory");
  ui.resourceCraftCategory = document.getElementById("resourceCraftCategory");
  ui.researchSection = document.getElementById("researchSection");
  ui.researchProjects = document.getElementById("researchProjects");
  ui.researchEmpty = document.getElementById("researchEmpty");
  ui.knownRoutesList = document.getElementById("knownRoutesList");
  ui.magicManaReadout = document.getElementById("magicManaReadout");
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

function hookTabNavigation() {
  tabButtons = {};
  tabPanels = {};

  document.querySelectorAll("[data-tab]").forEach((button) => {
    tabButtons[button.dataset.tab] = button;

    button.addEventListener("click", function () {
      setActiveTab(button.dataset.tab);
    });
  });

  document.querySelectorAll("[data-tab-panel]").forEach((panel) => {
    tabPanels[panel.dataset.tabPanel] = panel;
  });
}

function setActiveTab(tabId) {
  if (!tabPanels[tabId]) return;

  activeTab = isTabAvailable(tabId) ? tabId : getDefaultTabForState();
  refreshTabbedLayout();
}

function refreshTabbedLayout() {
  updateResourceGroupVisibility();
  refreshMapUI();
  refreshMagicUI();
  updateGearSlotVisibility();
  updateTabVisibility();
}

function updateTabVisibility() {
  const availableTabs = [];

  for (let tabId in tabButtons) {
    const available = isTabAvailable(tabId);
    tabButtons[tabId].hidden = !available;

    if (available) {
      availableTabs.push(tabId);
    }
  }

  if (!availableTabs.includes(activeTab)) {
    activeTab = getDefaultTabForState();
  }

  if (!availableTabs.includes(activeTab)) {
    activeTab = availableTabs[0] || "camp";
  }

  for (let tabId in tabButtons) {
    const isActive = tabId === activeTab;
    tabButtons[tabId].classList.toggle("is-active", isActive);
    tabButtons[tabId].setAttribute("aria-selected", isActive ? "true" : "false");
  }

  for (let tabId in tabPanels) {
    const isActive = tabId === activeTab;
    tabPanels[tabId].hidden = !isActive;
    tabPanels[tabId].style.display = isActive ? "" : "none";
    tabPanels[tabId].classList.toggle("is-active-tab", isActive);
  }
}

function getDefaultTabForState() {
  if (gameState.currentGoalId === "chooseRegion" && isTabAvailable("map")) return "map";
  if (gameState.expedition.active && isTabAvailable("expedition")) return "expedition";

  return "camp";
}

function isTabAvailable(tabId) {
  if (tabId === "camp" || tabId === "character" || tabId === "journal") return true;

  if (tabId === "expedition") {
    const beginExpedition = typeof getAction === "function" ? getAction("beginExpedition") : null;

    return gameState.phase === "expedition" || gameState.expedition.active || !!(beginExpedition && beginExpedition.unlocked);
  }

  if (tabId === "crafting") {
    return hasCraftingSurfaceContent();
  }

  if (tabId === "storage") {
    return hasStorageSurfaceContent();
  }

  if (tabId === "research") {
    return hasResearchSurfaceContent();
  }

  if (tabId === "map") {
    return !!(gameState.oldMapFound || gameState.tier3Unlocked);
  }

  if (tabId === "magic") {
    return !!gameState.magicUnlocked;
  }

  return false;
}

function hasCraftingSurfaceContent() {
  const hasCamp = typeof hasAvailableCampUpgrade === "function" && hasAvailableCampUpgrade();
  const hasGear = typeof hasAvailableGearUpgrade === "function" && hasAvailableGearUpgrade();
  const hasResources = typeof hasAvailableResourceCraft === "function" && hasAvailableResourceCraft();

  return hasCamp || hasGear || hasResources;
}

function hasStorageSurfaceContent() {
  if (typeof getStorageUpgradeDefinitions !== "function") return false;

  const upgrades = getStorageUpgradeDefinitions();

  for (let upgradeName in upgrades) {
    const upgrade = getStorageUpgrade(upgradeName);

    if (upgrade && (upgrade.unlocked || upgrade.tier > 0)) return true;
  }

  return false;
}

function hasResearchSurfaceContent() {
  if (gameState.researchUnlocked) return true;
  if (typeof getResearchDefinitions !== "function") return false;

  const researchDefinitions = getResearchDefinitions();

  for (let researchName in researchDefinitions) {
    const research = getResearch(researchName);

    if (research && (research.unlocked || research.completed)) return true;
  }

  return false;
}

function updateResourceGroupVisibility() {
  document.querySelectorAll("[data-resource-group]").forEach((group) => {
    const hasVisibleResource = Array.from(group.querySelectorAll(".resource-pill")).some((pill) => {
      return pill.style.display !== "none" && pill.textContent.trim() !== "";
    });

    group.hidden = !hasVisibleResource;
  });
}

function refreshMapUI() {
  if (!ui.knownRoutesList || typeof getExpeditionLocationDefinitions !== "function") return;

  ui.knownRoutesList.innerHTML = "";

  const locations = getExpeditionLocationDefinitions();
  let hasRoute = false;

  for (let locationName in locations) {
    const location = getExpeditionLocation(locationName);

    if (!location || !location.discovered) continue;

    hasRoute = true;

    const row = document.createElement("div");
    row.classList.add("route-row");

    const title = document.createElement("strong");
    title.textContent = getLocationLabel(locationName);

    const distance = typeof getLocationTravelDistance === "function" ? getLocationTravelDistance(location) : location.distance;
    const detail = document.createElement("span");
    detail.textContent = (location.explored ? "Explored" : "Discovered") + " - " + formatDistance(distance) + " distance";

    row.appendChild(title);
    row.appendChild(detail);
    ui.knownRoutesList.appendChild(row);
  }

  if (!hasRoute) {
    const empty = document.createElement("div");
    empty.classList.add("empty-state");
    empty.textContent = "No mapped routes yet.";
    ui.knownRoutesList.appendChild(empty);
  }
}

function refreshMagicUI() {
  if (!ui.magicManaReadout || typeof getResource !== "function") return;

  const mana = getResource("mana");

  if (!mana) return;

  safeSetText(ui.magicManaReadout, mana.label + ": " + Math.floor(mana.value * 10) / 10 + " / " + mana.maxValue);
}

function updateGearSlotVisibility() {
  document.querySelectorAll(".equipment-slot").forEach((slot) => {
    const hasGear = Array.from(slot.querySelectorAll(".gear-equipped-item")).some((item) => item.style.display !== "none");
    const empty = slot.querySelector(".slot-empty");

    if (empty) {
      empty.style.display = hasGear ? "none" : "block";
    }
  });
}

function updateCampBuildingVisibility() {
  if (!ui.campEmptyState) return;

  const hasBuilding = Array.from(document.querySelectorAll(".owned-marker")).some((marker) => marker.style.display !== "none");

  ui.campEmptyState.style.display = hasBuilding ? "none" : "block";
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

  if (resourceName === "mana") {
    refreshMagicUI();
  }

  safeSetText(resource.perClickDisplay, "+" + resource.perClick + "/Click");
  safeSetText(resource.perSecondDisplay, "+" + resource.perSecond + "/Sec");
  updateResourceGroupVisibility();
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
  refreshTabbedLayout();
}

function unlockPanel(panelName) {
  const panel = panelElements[panelName];

  if (!panel) {
    console.warn("Unknown panel unlock:", panelName);
    return;
  }

  showElement(panel);
  refreshTabbedLayout();
}

//Discover Popup & Function & CampDisplay
function showCampEstablishedPopup() {
  ui.campEstablishedPopup.style.display = "flex";
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

  updateCampBuildingVisibility();
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
    showElement(ui.inventorySection, "block");

    if (hasUnlockedOrPurchasedGear()) {
      showElement(ui.gearSection, "block");
    }
  } else {
    hideElement(ui.inventorySection);
    hideElement(ui.gearSection);
  }

  updateGearSlotVisibility();
  refreshTabbedLayout();
}

function hasUnlockedOrPurchasedGear() {
  const gearUpgradeDefinitions = getGearUpgradeDefinitions();

  for (let gearName in gearUpgradeDefinitions) {
    const gear = getGearUpgrade(gearName);

    if (gear.purchased || gear.unlocked) {
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
