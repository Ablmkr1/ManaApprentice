const SAVE_KEY = "manaApprenticeSaveV1";
const SAVE_VERSION = 5;
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
    research: createUpgradeSaveData(getResearchDefinitions(), ["unlocked", "completed"]),
    expeditionLocations: createExpeditionLocationSaveData(),
    dungeons: createDungeonSaveData(),
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
      unlocked: recipe.unlocked,
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

    if (location.hunt) {
      savedLocations[locationName].hunt = {
        tracked: location.hunt.tracked,
      };
    }

    if (location.storage) {
      savedLocations[locationName].storage = structuredClone(location.storage);
    }

    if (location.explorableObjects) {
      savedLocations[locationName].explorableObjects = createLocationObjectSaveData(location.explorableObjects);
    }
  }

  return savedLocations;
}

function createLocationObjectSaveData(explorableObjects) {
  const savedObjects = {};

  for (let objectName in explorableObjects) {
    savedObjects[objectName] = {
      progress: explorableObjects[objectName].progress || 0,
    };
  }

  return savedObjects;
}

function createDungeonSaveData() {
  const savedDungeons = {};
  const dungeonDefinitions = getDungeonDefinitions();

  for (let dungeonId in dungeonDefinitions) {
    const dungeon = getDungeon(dungeonId);

    if (!dungeon || !dungeon.nodes) continue;

    savedDungeons[dungeonId] = {
      nodes: {},
    };

    for (let nodeId in dungeon.nodes) {
      const node = dungeon.nodes[nodeId];

      savedDungeons[dungeonId].nodes[nodeId] = {
        discovered: !!node.discovered,
        explored: !!node.explored,
        rewardClaimed: !!node.rewardClaimed,
      };
    }
  }

  return savedDungeons;
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
  if (version === 4) return migrateV4ToV5;

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

function migrateV4ToV5(saveData) {
  if (saveData.gameState) {
    delete saveData.gameState.resting;
    delete saveData.gameState.restStartTime;
    delete saveData.gameState.crafting;

    if (saveData.gameState.expedition) {
      delete saveData.gameState.expedition.traveling;
      delete saveData.gameState.expedition.travelStartTime;
    }
  }

  saveData.version = 5;
}

function normalizeSaveData(saveData) {
  saveData.savedAt = Number.isFinite(saveData.savedAt) ? saveData.savedAt : Date.now();

  saveData.gameState = ensureObject(saveData.gameState);
  saveData.gameState.exploration = ensureObject(saveData.gameState.exploration);
  saveData.gameState.expedition = ensureObject(saveData.gameState.expedition);
  saveData.gameState.expedition.carriedItems = ensureObject(saveData.gameState.expedition.carriedItems);
  saveData.recipes = ensureObject(saveData.recipes);
  saveData.gameState.world = ensureObject(saveData.gameState.world);
  saveData.gameState.world.regions = ensureObject(saveData.gameState.world.regions);

  saveData.resources = ensureObject(saveData.resources);
  saveData.actions = ensureObject(saveData.actions);
  saveData.campUpgrades = ensureObject(saveData.campUpgrades);
  saveData.storageUpgrades = ensureObject(saveData.storageUpgrades);
  saveData.gearUpgrades = ensureObject(saveData.gearUpgrades);
  saveData.resourceCrafts = ensureObject(saveData.resourceCrafts);
  saveData.research = ensureObject(saveData.research);
  saveData.expeditionLocations = ensureObject(saveData.expeditionLocations);
  saveData.dungeons = ensureObject(saveData.dungeons);
  saveData.gameState.journal = ensureObject(saveData.gameState.journal);
  if (!Array.isArray(saveData.gameState.journal.entries)) {
    saveData.gameState.journal.entries = [];
  }

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

    applySavedFields(recipe, savedRecipe, ["discovered", "unlocked"]);
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

  updateCampResourcesSectionVisibility();
}

function applyGameStateSaveData(savedGameState) {
  if (!savedGameState) return;

  applySavedFields(gameState, savedGameState, [
    "phase",
    "currentGoalId",
    "discoveredClearing",
    "discoveredStream",
    "discoveredBerryBush",
    "discoveredDeadfall",
    "tier2Complete",
    "knownOutskirtsPathsUnlocked",
    "oldMapFound",
    "tier3Unlocked",
    "ruinedTorchFound",
    "ruinedJournalFound",
    "researchUnlocked",
    "torchResearched",
    "magicUnlocked",
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
      "regionId",
      "tonicSlots",
      "dungeon",
    ]);

    if (savedGameState.expedition.carriedItems) {
      gameState.expedition.carriedItems = structuredClone(savedGameState.expedition.carriedItems);
    }

    if (!Array.isArray(gameState.expedition.tonicSlots)) {
      gameState.expedition.tonicSlots = [];
    }

    if (!gameState.expedition.dungeon || typeof gameState.expedition.dungeon !== "object" || Array.isArray(gameState.expedition.dungeon)) {
      gameState.expedition.dungeon = {
        active: false,
        dungeonId: null,
        nodeId: null,
      };
    }
  }

  if (savedGameState.journal && Array.isArray(savedGameState.journal.entries)) {
    gameState.journal.entries = [...savedGameState.journal.entries];
  }

  if (savedGameState.world) {
    if (savedGameState.world.selectedRegion) {
      gameState.world.selectedRegion = savedGameState.world.selectedRegion;
    }

    if (savedGameState.world.regions) {
      for (let regionId in gameState.world.regions) {
        const savedRegion = savedGameState.world.regions[regionId];

        if (!savedRegion) continue;

        applySavedFields(gameState.world.regions[regionId], savedRegion, ["unlocked", "progress", "mastered", "locations"]);
      }
    }
  }

  resetActivity();
  gameState.autoAction.actionName = null;
  gameState.autoAction.pausedForRest = false;
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

    if (location.hunt && savedLocation.hunt) {
      applySavedFields(location.hunt, savedLocation.hunt, ["tracked"]);
    }

    if (location.storage && savedLocation.storage) {
      for (let resourceName in savedLocation.storage) {
        location.storage[resourceName] = savedLocation.storage[resourceName];
      }
    }

    if (location.explorableObjects && savedLocation.explorableObjects) {
      applyLocationObjectSaveData(location.explorableObjects, savedLocation.explorableObjects);
    }
  }
}

function applyLocationObjectSaveData(explorableObjects, savedObjects) {
  for (let objectName in explorableObjects) {
    const object = explorableObjects[objectName];
    const savedObject = savedObjects[objectName];

    applySavedFields(object, savedObject, ["progress"]);
  }
}

function applyDungeonSaveData(savedDungeons) {
  if (!savedDungeons) return;

  const dungeonDefinitions = getDungeonDefinitions();

  for (let dungeonId in dungeonDefinitions) {
    const dungeon = getDungeon(dungeonId);
    const savedDungeon = savedDungeons[dungeonId];

    if (!dungeon || !dungeon.nodes || !savedDungeon || !savedDungeon.nodes) continue;

    for (let nodeId in dungeon.nodes) {
      const node = dungeon.nodes[nodeId];
      const savedNode = savedDungeon.nodes[nodeId];

      applySavedFields(node, savedNode, ["discovered", "explored", "rewardClaimed"]);
    }
  }
}

function refreshGameUIAfterLoad() {
  hideElement(ui.introPopup);
  hideElement(ui.campEstablishedPopup);
  hideElement(ui.outskirtsCompletePopup);
  hideElement(ui.torchSparkPopup);
  hideElement(ui.manaAwakenedPopup);

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

  updateStorageSectionVisibility();

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

  updateWorkTabsVisibility();
  updateCurrentGoalUI();
  updateJournalUI();
  updateRegionalMapVisibility();
  updateCharacterPanelLocks();
  updateDestinationActions();
  updateLocationActions();
  checkRecipeDiscoveries();
  updateCraftingUIForCurrentContext();
  updateTrapCapacityUI();
  const canPackAfterLoad =
    gameState.expedition.active && !gameState.expedition.returning && !gameState.expedition.currentLocation && gameState.expedition.distance <= 0;

  setPackingActionsAvailable(canPackAfterLoad);
  updateAllActionButtons();
  updateRestButton();
  refreshExpeditionUI();
  updateTravelButton(isTravelActivityActive());
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
  repairExpeditionTonicSlots();
  applyUpgradeSaveData(getResourceCraftDefinitions(), saveData.resourceCrafts, ["unlocked"], updateResourceCraftUI);
  applyUpgradeSaveData(getResearchDefinitions(), saveData.research, ["unlocked", "completed"], updateResearchUI);
  applyExpeditionLocationSaveData(saveData.expeditionLocations);
  applyDungeonSaveData(saveData.dungeons);
  applyRecipeSaveData(saveData.recipes);
  checkRecipeDiscoveries();
  refreshGameUIAfterLoad();

  return true;
}

function repairExpeditionTonicSlots() {
  const expedition = gameState.expedition;
  const existingSlots = Array.isArray(expedition.tonicSlots) ? expedition.tonicSlots : [];
  const capacity = getPurchasedTonicSlotCapacity();
  const repairedSlots = existingSlots.filter(Boolean).slice(0, capacity);

  while (repairedSlots.length < capacity) {
    repairedSlots.push(null);
  }

  expedition.tonicSlots = repairedSlots;
}

function getPurchasedTonicSlotCapacity() {
  if (getGearUpgrade("reinforcedTonicBelt")?.purchased) return 3;
  if (getGearUpgrade("tonicBelt")?.purchased) return 2;
  if (getGearUpgrade("simpleTonicBelt")?.purchased) return 1;

  return 0;
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
