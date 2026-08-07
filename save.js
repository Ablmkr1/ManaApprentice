const SAVE_KEY = "manaApprenticeSaveV1";
const SAVE_VERSION = 8;
let saveSuppressed = false;

function createSaveData() {
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),

    gameState: structuredClone(gameState),

    resources: createResourceSaveData(),
    actions: createActionSaveData(),
    campUpgrades: createUpgradeSaveData(getCampUpgradeDefinitions(), ["unlocked", "purchased"]),
    gearUpgrades: createUpgradeSaveData(getGearUpgradeDefinitions(), ["unlocked", "purchased"]),
    spells: createUpgradeSaveData(getSpellDefinitions(), ["unlocked"]),
    resourceCrafts: createUpgradeSaveData(getResourceCraftDefinitions(), ["unlocked"]),
    expeditionLocations: createExpeditionLocationSaveData(),
    dungeons: createDungeonSaveData(),
    research: createResearchSaveData(),
    automation: createAutomationSaveData(),
  };
}

function createResourceSaveData() {
  const savedResources = {};

  const resourceDefinitions = getResourceDefinitions();

  for (let resourceName in resourceDefinitions) {
    const resource = getResource(resourceName);

    savedResources[resourceName] = {
      value: roundResourceAmount(resource.value),
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

function createResearchSaveData() {
  const savedResearch = {};
  const researchDefinitions = getResearchDefinitions();

  for (let researchName in researchDefinitions) {
    const research = getResearch(researchName);

    savedResearch[researchName] = {
      completed: research.completed,
      unlocked: research.unlocked,
      unlockedAt: research.unlockedAt || 0,
    };
  }

  return savedResearch;
}

function createAutomationSaveData() {
  const savedAutomation = {};
  const machines = getAutomationDefinitions();

  for (let machineName in machines) {
    const machine = getAutomation(machineName);

    savedAutomation[machineName] = {
      unlocked: machine.unlocked,
      cycles: machine.cycles || 0,
      progress: machine.progress || 0,
    };
  }

  return savedAutomation;
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
      manaSenseCharges: explorableObjects[objectName].manaSenseCharges || 0,
      spellCharges: structuredClone(getLocationObjectSpellCharges(explorableObjects[objectName])),
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
        manaSenseCharges: node.manaSenseCharges || 0,
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

  const version = Number.isInteger(saveData.version) ? saveData.version : 0;

  if (version !== 6 && version !== 7 && version !== SAVE_VERSION) {
    console.warn("Save version is not compatible with this update:", version);
    return null;
  }

  const normalizedSaveData = normalizeSaveData(saveData);

  if (version === 6) {
    migrateV6SaveDataToV7(normalizedSaveData);
  }

  if (version <= 7) {
    migrateV7SaveDataToV8(normalizedSaveData);
  }

  normalizedSaveData.version = SAVE_VERSION;

  return normalizedSaveData;
}

function normalizeSaveData(saveData) {
  saveData.savedAt = Number.isFinite(saveData.savedAt) ? saveData.savedAt : Date.now();

  saveData.gameState = ensureObject(saveData.gameState);
  saveData.gameState.exploration = ensureObject(saveData.gameState.exploration);
  saveData.gameState.expedition = ensureObject(saveData.gameState.expedition);
  saveData.gameState.expedition.carriedItems = ensureObject(saveData.gameState.expedition.carriedItems);
  saveData.gameState.skills = ensureObject(saveData.gameState.skills);
  saveData.gameState.magic = ensureObject(saveData.gameState.magic);
  saveData.gameState.magic.sensedReveals = ensureObject(saveData.gameState.magic.sensedReveals);
  saveData.gameState.magic.attunements = ensureObject(saveData.gameState.magic.attunements);

  if (!Array.isArray(saveData.gameState.magic.attunements.active)) {
    saveData.gameState.magic.attunements.active = [];
  }

  if (!Number.isFinite(saveData.gameState.magic.attunements.capacity) || saveData.gameState.magic.attunements.capacity <= 0) {
    saveData.gameState.magic.attunements.capacity = 1;
  }
  saveData.research = ensureObject(saveData.research);
  saveData.gameState.world = ensureObject(saveData.gameState.world);
  saveData.gameState.world.regions = ensureObject(saveData.gameState.world.regions);

  saveData.resources = ensureObject(saveData.resources);
  saveData.actions = ensureObject(saveData.actions);
  saveData.campUpgrades = ensureObject(saveData.campUpgrades);
  saveData.gearUpgrades = ensureObject(saveData.gearUpgrades);
  saveData.spells = ensureObject(saveData.spells);
  saveData.resourceCrafts = ensureObject(saveData.resourceCrafts);
  saveData.expeditionLocations = ensureObject(saveData.expeditionLocations);
  saveData.dungeons = ensureObject(saveData.dungeons);
  saveData.automation = ensureObject(saveData.automation);
  saveData.gameState.journal = ensureObject(saveData.gameState.journal);
  if (!Array.isArray(saveData.gameState.journal.entries)) {
    saveData.gameState.journal.entries = [];
  }

  return saveData;
}

function migrateV6SaveDataToV7(saveData) {
  seedSavedSkillFromResourceCapacity(saveData, "conditioning", "energy", "distance");
  seedSavedSkillFromResourceCapacity(saveData, "concentration", "focus", "deepThought");
  seedSavedSkillFromResourceCapacity(saveData, "manaCycling", "mana", "successfulCycles");
}

function migrateV7SaveDataToV8(saveData) {
  resetSavedDerivedGatherPerClick(saveData);
}

function resetSavedDerivedGatherPerClick(saveData) {
  const basePerClick = {
    food: 1,
    wood: 1,
    fiber: 1,
  };

  const savedResources = ensureObject(saveData.resources);

  for (let resourceName in basePerClick) {
    const savedResource = ensureObject(savedResources[resourceName]);

    savedResource.perClick = basePerClick[resourceName];
    savedResources[resourceName] = savedResource;
  }

  saveData.resources = savedResources;
}

function seedSavedSkillFromResourceCapacity(saveData, skillName, resourceName, progressField) {
  const savedResources = ensureObject(saveData.resources);
  const savedResource = ensureObject(savedResources[resourceName]);
  const savedSkills = ensureObject(saveData.gameState.skills);
  const savedSkill = ensureObject(savedSkills[skillName]);
  const maxValue = Number.isFinite(savedResource.maxValue) ? savedResource.maxValue : getResource(resourceName).maxValue;
  const rank = Math.max(Number.isFinite(savedSkill.rank) ? savedSkill.rank : 0, getSkillRankFromCapacity(skillName, maxValue));
  const threshold = getSkillThresholdForRank(skillName, rank);

  const migratedSkill = {
    ...getDefaultSkillState(skillName),
    ...savedSkill,
    rank,
    [progressField]: Math.max(Number.isFinite(savedSkill[progressField]) ? savedSkill[progressField] : 0, threshold),
    revealed: !!savedSkill.revealed || rank > 0,
  };

  if (skillName === "conditioning") {
    migratedSkill.pending = false;
  }

  savedSkills[skillName] = migratedSkill;
  saveData.gameState.skills = savedSkills;
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

function applyResearchSaveData(savedResearch) {
  if (!savedResearch) return;

  const researchDefinitions = getResearchDefinitions();

  for (let researchName in researchDefinitions) {
    const research = getResearch(researchName);
    const savedEntry = savedResearch[researchName];

    applySavedFields(research, savedEntry, ["completed", "unlocked", "unlockedAt"]);
  }
}

function applyAutomationSaveData(savedAutomation) {
  if (!savedAutomation) return;

  const machines = getAutomationDefinitions();

  for (let machineName in machines) {
    const machine = getAutomation(machineName);
    const savedMachine = savedAutomation[machineName];

    applySavedFields(machine, savedMachine, ["unlocked", "cycles", "progress"]);
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
    resource.value = Math.min(roundResourceAmount(resource.value), resource.maxValue);

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
    "recallUnlocked",
    "archiveDoorOpened",
    "campAlchemyPlansFound",
    "campTanningPlansFound",
    "campSmeltingPlansFound",
    "manaCondenserPlansFound",
    "partialTowerPlansFound",
    "destination",
    "hasCamp",
  ]);

  applySavedFields(gameState.exploration, savedGameState.exploration, ["currentStage", "count"]);

  if (savedGameState.magic) {
    gameState.magic.sensedReveals = structuredClone(ensureObject(savedGameState.magic.sensedReveals));

    const savedAttunements = ensureObject(savedGameState.magic.attunements);

    gameState.magic.attunements = {
      capacity: Number.isFinite(savedAttunements.capacity) && savedAttunements.capacity > 0 ? savedAttunements.capacity : 1,
      active: Array.isArray(savedAttunements.active) ? structuredClone(savedAttunements.active) : [],
    };
  }

  getAttunementState();

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
      "routeType",
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

  if (savedGameState.skills) {
    ensureSkillsState();
    applySavedFields(gameState.skills.conditioning, savedGameState.skills.conditioning, ["rank", "distance", "pending", "revealed"]);
    applySavedFields(gameState.skills.concentration, savedGameState.skills.concentration, ["rank", "deepThought", "revealed"]);
    applySavedFields(gameState.skills.manaCycling, savedGameState.skills.manaCycling, ["rank", "successfulCycles", "revealed"]);
    ensureSkillsState();
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

    applySavedFields(object, savedObject, ["progress", "manaSenseCharges", "spellCharges"]);
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

      applySavedFields(node, savedNode, ["discovered", "explored", "rewardClaimed", "manaSenseCharges"]);
    }
  }
}

function refreshGameUIAfterLoad() {
  hideElement(ui.introPopup);
  hideElement(ui.campEstablishedPopup);
  hideElement(ui.outskirtsCompletePopup);
  hideElement(ui.recallAwakenedPopup);
  hideElement(ui.torchSparkPopup);
  hideElement(ui.manaAwakenedPopup);
  hideElement(ui.campFoundationPopup);

  const resourceDefinitions = getResourceDefinitions();

  for (let resourceName in resourceDefinitions) {
    updateResource(resourceName);
  }

  const campUpgradeDefinitions = getCampUpgradeDefinitions();

  for (let upgradeName in campUpgradeDefinitions) {
    updateCampUpgradeUI(upgradeName);
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

  updateWorkTabsVisibility();
  updateReturnToCampButtonLabel();
  updateAutomationUI();
  updateCurrentGoalUI();
  updateJournalUI();
  updateRegionalMapVisibility();
  updateEquipmentSlotUI();
  updateCharacterPanelLocks();
  updateDestinationActions();
  updateLocationActions();
  checkResearchDiscoveries();
  updateCraftingUIForCurrentContext();
  updateTrapCapacityUI();
  updateTrainingUI();
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
  applyUpgradeSaveData(getGearUpgradeDefinitions(), saveData.gearUpgrades, ["unlocked", "purchased"], updateGearUpgradeUI);
  applyUpgradeSaveData(getSpellDefinitions(), saveData.spells, ["unlocked"]);
  repairSpellUnlocksFromFlags();
  repairExpeditionTonicSlots();
  applyUpgradeSaveData(getResourceCraftDefinitions(), saveData.resourceCrafts, ["unlocked"], updateResourceCraftUI);
  applyExpeditionLocationSaveData(saveData.expeditionLocations);
  applyDungeonSaveData(saveData.dungeons);
  applyResearchSaveData(saveData.research);
  applyAutomationSaveData(saveData.automation);
  ensureSkillsState();
  recalculateCharacterStats();
  recalculateCampEffects();
  recalculateToolEffects();
  checkResearchDiscoveries();
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
