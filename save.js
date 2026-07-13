const SAVE_KEY = "manaApprenticeSaveV1";
const SAVE_VERSION = 4;
const FIRST_SAVE_VERSION = 1;
let saveSuppressed = false;

function createSaveData() {
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),

    gameState: structuredClone(gameState),

    resources: createResourceSaveData(),
    actions: createActionSaveData(),
    campUpgrades: createUpgradeSaveData(getCampUpgradeDefinitions(), ["unlocked", "purchased"]),
    storageUpgrades: createUpgradeSaveData(getStorageUpgradeDefinitions(), ["unlocked", "tier"]),
    gearUpgrades: createUpgradeSaveData(getGearUpgradeDefinitions(), ["unlocked", "purchased"]),
    resourceCrafts: createUpgradeSaveData(getResourceCraftDefinitions(), ["unlocked"]),
    expeditionLocations: createExpeditionLocationSaveData(),
    recipes: createRecipeSaveData(),
  };
}

function createResourceSaveData() {
  const savedResources = {};

  const resourceDefinitions = getResourceDefinitions();

  for (let resourceName in resourceDefinitions) {
    const resource = getResource(resourceName);

    savedResources[resourceName] = {
      value: resource.value,
      maxValue: resource.maxValue,
      perClick: resource.perClick,
      perSecond: resource.perSecond,
      restPerSecond: resource.restPerSecond,
      visible: resource.display ? resource.display.style.display !== "none" : false,
    };
  }

  return savedResources;
}

function createActionSaveData() {
  const savedActions = {};

  const actionDefinitions = getActionDefinitions();

  for (let actionName in actionDefinitions) {
    savedActions[actionName] = {
      unlocked: getAction(actionName).unlocked,
    };
  }

  return savedActions;
}

function createUpgradeSaveData(upgrades, fields) {
  const savedUpgrades = {};

  for (let upgradeName in upgrades) {
    savedUpgrades[upgradeName] = {};

    fields.forEach((fieldName) => {
      savedUpgrades[upgradeName][fieldName] = upgrades[upgradeName][fieldName];
    });
  }

  return savedUpgrades;
}

function createRecipeSaveData() {
  const savedRecipes = {};
  const recipeDefinitions = getRecipeDefinitions();

  for (let recipeName in recipeDefinitions) {
    const recipe = getRecipe(recipeName);

    savedRecipes[recipeName] = {
      discovered: recipe.discovered,
    };
  }

  return savedRecipes;
}

function createExpeditionLocationSaveData() {
  const savedLocations = {};
  const locations = getExpeditionLocationDefinitions();

  for (let locationName in locations) {
    const location = locations[locationName];

    savedLocations[locationName] = {
      discovered: location.discovered,
      explored: location.explored,
      explorationProgress: location.explorationProgress || 0,
    };

    if (location.trapSites) {
      savedLocations[locationName].trapSites = {
        sites: location.trapSites.sites.map((site) => ({
          discovered: site.discovered,
          installed: site.installed,
          checkedThisVisit: site.checkedThisVisit,
        })),
      };
    }
  }

  return savedLocations;
}

function saveGame() {
  const saveData = createSaveData();

  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));

  return saveData;
}

function trySaveGame() {
  if (saveSuppressed) return null;

  try {
    return saveGame();
  } catch (error) {
    console.warn("Save failed:", error);
    return null;
  }
}

function readSaveData() {
  const rawSave = localStorage.getItem(SAVE_KEY);

  if (!rawSave) return null;

  try {
    const saveData = JSON.parse(rawSave);

    return migrateSaveData(saveData);
  } catch (error) {
    console.warn("Could not read save:", error);
    return null;
  }
}

function migrateSaveData(saveData) {
  if (!saveData || typeof saveData !== "object") {
    console.warn("Invalid save data.");
    return null;
  }

  const version = Number.isInteger(saveData.version) ? saveData.version : FIRST_SAVE_VERSION;

  if (version > SAVE_VERSION) {
    console.warn("Save was created by a newer version of Mana Apprentice.");
    return null;
  }

  if (version < FIRST_SAVE_VERSION) {
    console.warn("Unsupported save version:", version);
    return null;
  }

  saveData.version = version;

  while (saveData.version < SAVE_VERSION) {
    const migration = getSaveMigration(saveData.version);

    if (!migration) {
      console.warn("Missing save migration for version:", saveData.version);
      return null;
    }

    const previousVersion = saveData.version;

    migration(saveData);

    if (!Number.isInteger(saveData.version) || saveData.version <= previousVersion || saveData.version > SAVE_VERSION) {
      console.warn("Save migration produced invalid version:", saveData.version);
      return null;
    }
  }

  return normalizeSaveData(saveData);
}

function getSaveMigration(version) {
  if (version === 1) return migrateV1ToV2;
  if (version === 2) return migrateV2ToV3;
  if (version === 3) return migrateV3ToV4;

  return null;
}

function migrateV1ToV2(saveData) {
  saveData.version = 2;
}

function migrateV2ToV3(saveData) {
  saveData.recipes = {};
  saveData.version = 3;
}

function migrateV3ToV4(saveData) {
  saveData.resourceCrafts = {};

  if (saveData.actions && saveData.actions.makeTrap && saveData.actions.makeTrap.unlocked) {
    saveData.resourceCrafts.trap = {
      unlocked: true,
    };
  }

  saveData.version = 4;
}

function normalizeSaveData(saveData) {
  saveData.savedAt = Number.isFinite(saveData.savedAt) ? saveData.savedAt : Date.now();

  saveData.gameState = ensureObject(saveData.gameState);
  saveData.gameState.exploration = ensureObject(saveData.gameState.exploration);
  saveData.gameState.expedition = ensureObject(saveData.gameState.expedition);
  saveData.gameState.expedition.carriedItems = ensureObject(saveData.gameState.expedition.carriedItems);
  saveData.recipes = ensureObject(saveData.recipes);

  saveData.resources = ensureObject(saveData.resources);
  saveData.actions = ensureObject(saveData.actions);
  saveData.campUpgrades = ensureObject(saveData.campUpgrades);
  saveData.storageUpgrades = ensureObject(saveData.storageUpgrades);
  saveData.gearUpgrades = ensureObject(saveData.gearUpgrades);
  saveData.resourceCrafts = ensureObject(saveData.resourceCrafts);
  saveData.expeditionLocations = ensureObject(saveData.expeditionLocations);

  return saveData;
}

function ensureObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value;
}

function applySavedFields(target, savedData, fields) {
  if (!target || !savedData) return;

  fields.forEach((fieldName) => {
    if (Object.prototype.hasOwnProperty.call(savedData, fieldName)) {
      target[fieldName] = savedData[fieldName];
    }
  });
}

function applyRecipeSaveData(savedRecipes) {
  if (!savedRecipes) return;

  const recipeDefinitions = getRecipeDefinitions();

  for (let recipeName in recipeDefinitions) {
    const recipe = getRecipe(recipeName);
    const savedRecipe = savedRecipes[recipeName];

    applySavedFields(recipe, savedRecipe, ["discovered"]);
  }
}

function applyResourceSaveData(savedResources) {
  if (!savedResources) return;

  const resourceDefinitions = getResourceDefinitions();

  for (let resourceName in resourceDefinitions) {
    const resource = getResource(resourceName);
    const savedResource = savedResources[resourceName];

    if (!resource || !savedResource) continue;

    applySavedFields(resource, savedResource, ["value", "maxValue", "perClick", "perSecond", "restPerSecond"]);

    if (resource.display) {
      if (savedResource.visible || resourceName === "energy") {
        showElement(resource.display, "block");
      } else {
        hideElement(resource.display);
      }
    }

    updateResource(resourceName);
  }
}

function applyGameStateSaveData(savedGameState) {
  if (!savedGameState) return;

  applySavedFields(gameState, savedGameState, [
    "phase",
    "discoveredClearing",
    "discoveredStream",
    "discoveredBerryBush",
    "discoveredDeadfall",
    "destination",
    "hasCamp",
  ]);

  applySavedFields(gameState.exploration, savedGameState.exploration, ["currentStage", "count"]);

  if (savedGameState.expedition) {
    applySavedFields(gameState.expedition, savedGameState.expedition, [
      "active",
      "discoveredSomething",
      "returning",
      "returnPenalty",
      "completed",
      "currentLocation",
      "destination",
      "distance",
      "targetDistance",
      "carryCapacity",
      "water",
      "waterCapacity",
    ]);

    if (savedGameState.expedition.carriedItems) {
      gameState.expedition.carriedItems = structuredClone(savedGameState.expedition.carriedItems);
    }
  }

  gameState.resting = false;
  gameState.restStartTime = null;
  gameState.autoAction.actionName = null;
  gameState.autoAction.pausedForRest = false;
  gameState.expedition.traveling = false;
  gameState.expedition.travelStartTime = null;
}

function applyActionSaveData(savedActions) {
  const actionDefinitions = getActionDefinitions();

  for (let actionName in actionDefinitions) {
    const action = getAction(actionName);
    const savedAction = savedActions ? savedActions[actionName] : null;

    applySavedFields(action, savedAction, ["unlocked"]);
    action.running = false;
    resetProgressBar(action);

    if (action.metaProgressBar) {
      action.metaProgressBar.style.width = "0%";
    }
  }
}

function applyUpgradeSaveData(upgrades, savedUpgrades, fields, updateUI) {
  if (!savedUpgrades) return;

  for (let upgradeName in upgrades) {
    const upgrade = upgrades[upgradeName];
    const savedUpgrade = savedUpgrades[upgradeName];

    if (!upgrade || !savedUpgrade) continue;

    applySavedFields(upgrade, savedUpgrade, fields);

    if (updateUI) {
      updateUI(upgradeName);
    }
  }
}

function applyExpeditionLocationSaveData(savedLocations) {
  if (!savedLocations) return;

  const locations = getExpeditionLocationDefinitions();

  for (let locationName in locations) {
    const location = locations[locationName];
    const savedLocation = savedLocations[locationName];

    if (!location || !savedLocation) continue;

    applySavedFields(location, savedLocation, ["discovered", "explored", "explorationProgress"]);

    if (location && location.trapSites && savedLocation.trapSites && savedLocation.trapSites.sites) {
      savedLocation.trapSites.sites.forEach((savedSite, index) => {
        const site = location.trapSites.sites[index];

        applySavedFields(site, savedSite, ["discovered", "installed", "checkedThisVisit"]);
      });
    }
  }
}

function refreshGameUIAfterLoad() {
  hideElement(ui.introPopup);
  hideElement(ui.clearingPopup);
  hideElement(ui.streamPopup);

  const resourceDefinitions = getResourceDefinitions();

  for (let resourceName in resourceDefinitions) {
    updateResource(resourceName);
  }

  const campUpgradeDefinitions = getCampUpgradeDefinitions();

  for (let upgradeName in campUpgradeDefinitions) {
    updateCampUpgradeUI(upgradeName);
  }

  const storageUpgradeDefinitions = getStorageUpgradeDefinitions();

  for (let upgradeName in storageUpgradeDefinitions) {
    updateStorageUpgradeUI(upgradeName);
  }

  const gearUpgradeDefinitions = getGearUpgradeDefinitions();

  for (let upgradeName in gearUpgradeDefinitions) {
    updateGearUpgradeUI(upgradeName);
  }

  if (gameState.phase === "expedition" || gameState.expedition.active) {
    showElement(ui.expeditionPanel);
  } else {
    hideElement(ui.expeditionPanel);
  }

  if (gameState.phase === "clearing" || (gameState.phase === "expedition" && !gameState.expedition.active)) {
    showElement(ui.restBtn, "inline-block");
  } else {
    hideElement(ui.restBtn);
  }

  updateCharacterPanelLocks();
  updateDestinationActions();
  updateLocationActions();
  updateAllActionButtons();
  updateRestButton();
  refreshExpeditionUI();
  updateTravelButton(gameState.expedition.traveling);
  updatePlacePanel();
}

function loadGame() {
  const saveData = readSaveData();

  if (!saveData) return false;

  applyGameStateSaveData(saveData.gameState);
  applyResourceSaveData(saveData.resources);
  applyActionSaveData(saveData.actions);
  applyUpgradeSaveData(getCampUpgradeDefinitions(), saveData.campUpgrades, ["unlocked", "purchased"], updateCampUpgradeUI);
  applyUpgradeSaveData(getStorageUpgradeDefinitions(), saveData.storageUpgrades, ["unlocked", "tier"], updateStorageUpgradeUI);
  applyUpgradeSaveData(getGearUpgradeDefinitions(), saveData.gearUpgrades, ["unlocked", "purchased"], updateGearUpgradeUI);
  applyUpgradeSaveData(getResourceCraftDefinitions(), saveData.resourceCrafts, ["unlocked"], updateResourceCraftUI);
  applyExpeditionLocationSaveData(saveData.expeditionLocations);
  applyRecipeSaveData(saveData.recipes);
  checkRecipeDiscoveries();
  refreshGameUIAfterLoad();

  return true;
}

function tryLoadGame() {
  try {
    return loadGame();
  } catch (error) {
    console.warn("Load failed:", error);
    return false;
  }
}

function resetSave() {
  saveSuppressed = true;
  localStorage.removeItem(SAVE_KEY);
  window.location.reload();
}
