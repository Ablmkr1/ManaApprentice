const SAVE_KEY = "manaApprenticeSaveV1";
const SAVE_VERSION = 1;

function createSaveData() {
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),

    gameState: structuredClone(gameState),

    resources: createResourceSaveData(),
    actions: createActionSaveData(),
    campUpgrades: createUpgradeSaveData(campUpgrades, ["unlocked", "purchased"]),
    storageUpgrades: createUpgradeSaveData(storageUpgrades, ["unlocked", "tier"]),
    gearUpgrades: createUpgradeSaveData(gearUpgrades, ["unlocked", "purchased"]),
    expeditionLocations: createExpeditionLocationSaveData(),
  };
}

function createResourceSaveData() {
  const savedResources = {};

  for (let resourceName in resources) {
    const resource = resources[resourceName];

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

  for (let actionName in actions) {
    savedActions[actionName] = {
      unlocked: actions[actionName].unlocked,
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

function createExpeditionLocationSaveData() {
  const savedLocations = {};

  for (let locationName in expeditionLocations) {
    const location = expeditionLocations[locationName];

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

    if (!saveData || saveData.version !== SAVE_VERSION) {
      console.warn("Save version mismatch or invalid save data.");
      return null;
    }

    return saveData;
  } catch (error) {
    console.warn("Could not read save:", error);
    return null;
  }
}

function applySavedFields(target, savedData, fields) {
  if (!target || !savedData) return;

  fields.forEach((fieldName) => {
    if (Object.prototype.hasOwnProperty.call(savedData, fieldName)) {
      target[fieldName] = savedData[fieldName];
    }
  });
}

function applyResourceSaveData(savedResources) {
  if (!savedResources) return;

  for (let resourceName in savedResources) {
    const resource = resources[resourceName];
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
  for (let actionName in actions) {
    const action = actions[actionName];
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

  for (let upgradeName in savedUpgrades) {
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

  for (let locationName in savedLocations) {
    const location = expeditionLocations[locationName];
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

  for (let resourceName in resources) {
    updateResource(resourceName);
  }

  for (let upgradeName in campUpgrades) {
    updateCampUpgradeUI(upgradeName);
  }

  for (let upgradeName in storageUpgrades) {
    updateStorageUpgradeUI(upgradeName);
  }

  for (let upgradeName in gearUpgrades) {
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
  applyUpgradeSaveData(campUpgrades, saveData.campUpgrades, ["unlocked", "purchased"], updateCampUpgradeUI);
  applyUpgradeSaveData(storageUpgrades, saveData.storageUpgrades, ["unlocked", "tier"], updateStorageUpgradeUI);
  applyUpgradeSaveData(gearUpgrades, saveData.gearUpgrades, ["unlocked", "purchased"], updateGearUpgradeUI);
  applyExpeditionLocationSaveData(saveData.expeditionLocations);
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
  localStorage.removeItem(SAVE_KEY);
  window.location.reload();
}
