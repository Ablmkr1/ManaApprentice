const SAVE_KEY = "manaApprenticeSaveV1";
const SAVE_VERSION = 19;
let saveSuppressed = false;

function createSaveData() {
  const savedGameState = createGameStateSaveData();

  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),

    gameState: savedGameState,

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

    if (Number.isFinite(location.looseStoneMax) && typeof getLocationLooseStoneRemaining === "function") {
      savedLocations[locationName].looseStoneRemaining = getLocationLooseStoneRemaining(location);
    }

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
        spellCharges: structuredClone(getDungeonNodeSpellCharges(node)),
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

  if (version < 6 || version > SAVE_VERSION) {
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

  if (version <= 8) {
    migrateV8SaveDataToV9(normalizedSaveData);
  }

  if (version <= 9) {
    migrateV9SaveDataToV10(normalizedSaveData);
  }

  if (version <= 10) {
    migrateV10SaveDataToV11(normalizedSaveData);
  }

  if (version <= 11) {
    migrateV11SaveDataToV12(normalizedSaveData);
  }

  if (version <= 12) {
    migrateV12SaveDataToV13(normalizedSaveData);
  }

  if (version <= 13) {
    migrateV13SaveDataToV14(normalizedSaveData);
  }

  if (version <= 14) {
    migrateV14SaveDataToV15(normalizedSaveData);
  }

  if (version <= 15) {
    migrateV15SaveDataToV16(normalizedSaveData);
  }

  if (version <= 16) {
    migrateV16SaveDataToV17(normalizedSaveData);
  }

  if (version <= 17) {
    migrateV17SaveDataToV18(normalizedSaveData);
  }

  if (version <= 18) {
    migrateV18SaveDataToV19(normalizedSaveData);
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
  saveData.gameState.projects = ensureObject(saveData.gameState.projects);
  saveData.gameState.towerNodes = ensureObject(saveData.gameState.towerNodes);
  saveData.gameState.magic = ensureObject(saveData.gameState.magic);
  saveData.gameState.magic.sensedReveals = ensureObject(saveData.gameState.magic.sensedReveals);
  saveData.gameState.magic.spellProgress = ensureObject(saveData.gameState.magic.spellProgress);
  saveData.gameState.magic.spellProgress.manaSense = normalizeSavedSpellProgress(saveData.gameState.magic.spellProgress.manaSense);
  saveData.gameState.magic.spellProgress.attunement = normalizeSavedSpellProgress(saveData.gameState.magic.spellProgress.attunement);
  saveData.gameState.magic.spellProgress.imbue = normalizeSavedSpellProgress(saveData.gameState.magic.spellProgress.imbue);
  saveData.gameState.magic.spellProgress.arcaneForce = normalizeSavedSpellProgress(saveData.gameState.magic.spellProgress.arcaneForce);
  saveData.gameState.magic.attunements = ensureObject(saveData.gameState.magic.attunements);

  if (!Array.isArray(saveData.gameState.magic.attunements.active)) {
    saveData.gameState.magic.attunements.active = [];
  }

  saveData.gameState.magic.attunements.active = normalizeSavedActiveAttunements(saveData.gameState.magic.attunements.active);

  if (!Number.isFinite(saveData.gameState.magic.attunements.capacity) || saveData.gameState.magic.attunements.capacity <= 0) {
    saveData.gameState.magic.attunements.capacity = 1;
  }
  normalizeSavedExpeditionLocationSpellEffects(saveData.gameState.expedition);

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
  normalizeSavedFuelLocationStorage(saveData.expeditionLocations);
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

function migrateV8SaveDataToV9(saveData) {
  const savedResearch = ensureObject(saveData.research);
  const savedProjects = ensureObject(saveData.gameState.projects);
  const towerFoundation = ensureObject(savedProjects.towerFoundation);
  const towerResearch = ensureObject(savedResearch.towerFoundations);

  if (towerResearch.completed) {
    towerFoundation.unlocked = true;
  }

  towerFoundation.completed = !!towerFoundation.completed;
  towerFoundation.level = Number.isFinite(towerFoundation.level) ? towerFoundation.level : 0;
  towerFoundation.work = Number.isFinite(towerFoundation.work) ? towerFoundation.work : 0;
  towerFoundation.deposits = ensureObject(towerFoundation.deposits);

  savedProjects.towerFoundation = towerFoundation;
  saveData.gameState.projects = savedProjects;
}

function migrateV9SaveDataToV10(saveData) {
  saveData.gameState.magic = ensureObject(saveData.gameState.magic);
  saveData.gameState.magic.spellProgress = ensureObject(saveData.gameState.magic.spellProgress);
  saveData.gameState.magic.spellProgress.attunement = normalizeSavedSpellProgress(saveData.gameState.magic.spellProgress.attunement);
}

function migrateV10SaveDataToV11(saveData) {
  saveData.gameState.magic = ensureObject(saveData.gameState.magic);
  saveData.gameState.magic.spellProgress = ensureObject(saveData.gameState.magic.spellProgress);

  migrateSavedSpellUnlock(saveData.spells, "arcaneHeat", "arcaneForce");
  migrateSavedSpellProgress(saveData.gameState.magic.spellProgress, "arcaneHeat", "arcaneForce");
  migrateSavedJournalEntry(saveData.gameState.journal, "arcaneHeatLearned", "arcaneForceLearned");
  migrateSavedLocationSpellCharges(saveData.expeditionLocations, "arcaneHeat", "arcaneForce");
  migrateSavedDungeonSpellCharges(saveData.dungeons, "arcaneHeat", "arcaneForce");

  saveData.gameState.magic.spellProgress.arcaneForce = normalizeSavedSpellProgress(saveData.gameState.magic.spellProgress.arcaneForce);
}

function migrateV11SaveDataToV12(saveData) {
  saveData.gameState.magic = ensureObject(saveData.gameState.magic);
  saveData.gameState.magic.spellProgress = ensureObject(saveData.gameState.magic.spellProgress);
  saveData.gameState.magic.attunements = ensureObject(saveData.gameState.magic.attunements);

  saveData.gameState.magic.spellProgress.manaSense = normalizeSavedSpellProgress(saveData.gameState.magic.spellProgress.manaSense);
  saveData.gameState.magic.attunements.active = normalizeSavedActiveAttunements(saveData.gameState.magic.attunements.active);
  normalizeSavedExpeditionLocationSpellEffects(saveData.gameState.expedition);
}

function migrateV12SaveDataToV13(saveData) {
  saveData.gameState.magic = ensureObject(saveData.gameState.magic);
  saveData.gameState.magic.spellProgress = ensureObject(saveData.gameState.magic.spellProgress);
  saveData.gameState.magic.spellProgress.imbue = normalizeSavedSpellProgress(saveData.gameState.magic.spellProgress.imbue);
}

function migrateV13SaveDataToV14(saveData) {
  normalizeSavedFuelLocationStorage(saveData.expeditionLocations);
}

function migrateV14SaveDataToV15(saveData) {
  const savedGameState = ensureObject(saveData.gameState);
  const savedProjects = ensureObject(savedGameState.projects);
  const towerFoundation = ensureObject(savedProjects.towerFoundation);
  const hasCompletedFoundation = !!towerFoundation.completed;

  savedGameState.personalWardUnlocked = !!savedGameState.personalWardUnlocked || hasCompletedFoundation;
  savedGameState.personalWardPopupShown = !!savedGameState.personalWardPopupShown;

  if (savedGameState.personalWardUnlocked) {
    const savedResources = ensureObject(saveData.resources);
    const ward = ensureObject(savedResources.ward);
    const journal = ensureObject(savedGameState.journal);

    ward.value = Number.isFinite(ward.value) ? Math.max(0, Math.min(10, ward.value)) : 10;
    ward.maxValue = 10;
    ward.perClick = Number.isFinite(ward.perClick) ? ward.perClick : 0;
    ward.perSecond = Number.isFinite(ward.perSecond) ? ward.perSecond : 0;
    ward.visible = true;
    savedResources.ward = ward;
    saveData.resources = savedResources;

    if (!Array.isArray(journal.entries)) {
      journal.entries = [];
    }

    if (!journal.entries.includes("personalWardRemembered")) {
      journal.entries.push("personalWardRemembered");
    }

    savedGameState.journal = journal;
  }

  saveData.gameState = savedGameState;
}

function migrateV15SaveDataToV16(saveData) {
  const savedGameState = ensureObject(saveData.gameState);
  const savedSkills = ensureObject(savedGameState.skills);
  const definitions = getSkillDefinitions();

  for (let skillName in definitions) {
    const savedSkill = ensureObject(savedSkills[skillName]);
    const oldProgressionRank = Number.isFinite(savedSkill.rank) ? Math.max(0, Math.floor(savedSkill.rank)) : 0;
    const level = Number.isFinite(savedSkill.level) ? Math.max(0, Math.floor(savedSkill.level)) : oldProgressionRank;

    savedSkills[skillName] = {
      ...getDefaultSkillState(skillName),
      ...savedSkill,
      rank: DEFAULT_SKILL_RANK,
      level: normalizeSkillLevel(skillName, level, DEFAULT_SKILL_RANK),
    };
  }

  savedGameState.skills = savedSkills;
  saveData.gameState = savedGameState;
}

function migrateV16SaveDataToV17(saveData) {
  const savedGameState = ensureObject(saveData.gameState);
  const savedSkills = ensureObject(savedGameState.skills);

  savedSkills.conditioning = {
    ...getDefaultSkillState("conditioning"),
    ...ensureObject(savedSkills.conditioning),
  };
  savedSkills.manaCycling = {
    ...getDefaultSkillState("manaCycling"),
    ...ensureObject(savedSkills.manaCycling),
  };
  savedSkills.meditation = {
    ...getDefaultSkillState("meditation"),
    ...ensureObject(savedSkills.meditation),
  };

  savedSkills.conditioning.reinforcedEnergyUnlockSpent = Number.isFinite(savedSkills.conditioning.reinforcedEnergyUnlockSpent)
    ? Math.max(0, savedSkills.conditioning.reinforcedEnergyUnlockSpent)
    : 0;
  savedSkills.conditioning.reinforcedEnergySpent = Number.isFinite(savedSkills.conditioning.reinforcedEnergySpent)
    ? Math.max(0, savedSkills.conditioning.reinforcedEnergySpent)
    : 0;
  savedSkills.manaCycling.deepCycles = Number.isFinite(savedSkills.manaCycling.deepCycles) ? Math.max(0, savedSkills.manaCycling.deepCycles) : 0;
  savedSkills.meditation.attunedMeditations = Number.isFinite(savedSkills.meditation.attunedMeditations)
    ? Math.max(0, savedSkills.meditation.attunedMeditations)
    : 0;

  savedGameState.skills = savedSkills;
  saveData.gameState = savedGameState;
}

function migrateV17SaveDataToV18(saveData) {
  const savedGameState = ensureObject(saveData.gameState);
  const savedProjects = ensureObject(savedGameState.projects);
  const towerFoundation = ensureObject(savedProjects.towerFoundation);
  const towerCompleted = !!savedGameState.towerConstructionUnlocked || !!towerFoundation.completed;

  savedGameState.towerNodes = normalizeSavedTowerNodes(savedGameState.towerNodes, towerCompleted);
  saveData.gameState = savedGameState;
}

function migrateV18SaveDataToV19(saveData) {
  const savedGameState = ensureObject(saveData.gameState);

  savedGameState.towerNodes = normalizeSavedTowerNodes(savedGameState.towerNodes, false);
  saveData.gameState = savedGameState;
}

function normalizeSavedTowerNodes(savedTowerNodes, towerCompleted = false) {
  const towerNodes = ensureObject(savedTowerNodes);
  const definitions = typeof getTowerNodeDefinitions === "function" ? getTowerNodeDefinitions() : {};
  const normalized = {};

  for (let nodeName in definitions) {
    const definition = definitions[nodeName];
    const savedNode = ensureObject(towerNodes[nodeName]);
    const savedDeposits = ensureObject(savedNode.deposits);
    const deposits = {};

    for (let resourceName in definition.materials || {}) {
      const requirement = definition.materials[resourceName] || 0;
      const deposited = Number.isFinite(savedDeposits[resourceName]) ? savedDeposits[resourceName] : 0;
      deposits[resourceName] = Math.max(0, Math.min(deposited, requirement));
    }

    const imbueProgress = Number.isFinite(savedNode.imbueProgress) ? savedNode.imbueProgress : 0;
    const threadSenseRequired = definition.threadSenseRequired || 0;
    const threadSenseProgress = Number.isFinite(savedNode.threadSenseProgress) ? savedNode.threadSenseProgress : 0;
    const normalizedThreadSenseProgress = Math.max(0, Math.min(threadSenseProgress, threadSenseRequired));
    const threadSensed =
      !!savedNode.threadSensed ||
      !!savedNode.advancedRecallUnlocked ||
      (threadSenseRequired > 0 && normalizedThreadSenseProgress >= threadSenseRequired);

    normalized[nodeName] = {
      activated: !!savedNode.activated || (nodeName === "north" && towerCompleted),
      researchUnlocked: !!savedNode.researchUnlocked,
      built: !!savedNode.built,
      deposits,
      imbueProgress: Math.max(0, Math.min(imbueProgress, definition.imbueRequired || 0)),
      threadSenseProgress: normalizedThreadSenseProgress,
      threadSensed: threadSensed || (threadSenseRequired > 0 && normalizedThreadSenseProgress >= threadSenseRequired),
      advancedRecallUnlocked: !!savedNode.advancedRecallUnlocked || threadSensed,
    };
  }

  return normalized;
}

function normalizeSavedFuelLocationStorage(savedLocations) {
  const locations = ensureObject(savedLocations);
  const fuelLocations = ["minersCamp", "alchemistsHut"];

  fuelLocations.forEach(function (locationName) {
    const location = locations[locationName];

    if (!location || typeof location !== "object") return;

    const storage = ensureObject(location.storage);
    const fuel = Number.isFinite(storage.fuel) ? storage.fuel : 0;
    const woodFuel = Number.isFinite(storage.wood) ? storage.wood : 0;
    const imbuedWoodFuel = Number.isFinite(storage.imbuedWood) ? storage.imbuedWood * 4 : 0;

    storage.fuel = roundResourceAmount(Math.max(0, fuel + woodFuel + imbuedWoodFuel));
    delete storage.wood;
    delete storage.imbuedWood;
    location.storage = storage;
  });
}

function migrateSavedSpellUnlock(savedSpells, oldSpellName, newSpellName) {
  const spells = ensureObject(savedSpells);
  const oldSpell = ensureObject(spells[oldSpellName]);
  const newSpell = ensureObject(spells[newSpellName]);

  if (oldSpell.unlocked) {
    newSpell.unlocked = true;
  }

  delete spells[oldSpellName];
  spells[newSpellName] = newSpell;
}

function migrateSavedSpellProgress(savedProgress, oldSpellName, newSpellName) {
  const progress = ensureObject(savedProgress);
  const oldProgress = progress[oldSpellName];
  const currentProgress = progress[newSpellName];

  if (oldProgress) {
    const current = normalizeSavedSpellProgress(currentProgress);

    if (!currentProgress || (current.xp <= 0 && current.level <= 0)) {
      progress[newSpellName] = oldProgress;
    }
  }

  delete progress[oldSpellName];
}

function migrateSavedJournalEntry(savedJournal, oldEntryId, newEntryId) {
  const journal = ensureObject(savedJournal);

  if (!Array.isArray(journal.entries)) return;

  journal.entries = journal.entries.map(function (entryId) {
    return entryId === oldEntryId ? newEntryId : entryId;
  });

  journal.entries = journal.entries.filter(function (entryId, index) {
    return journal.entries.indexOf(entryId) === index;
  });
}

function migrateSavedLocationSpellCharges(savedLocations, oldSpellName, newSpellName) {
  const locations = ensureObject(savedLocations);

  for (let locationName in locations) {
    const location = locations[locationName];

    if (!location || !location.explorableObjects) continue;

    for (let objectName in location.explorableObjects) {
      const object = location.explorableObjects[objectName];

      migrateSavedSpellChargeMap(object, oldSpellName, newSpellName);
    }
  }
}

function migrateSavedDungeonSpellCharges(savedDungeons, oldSpellName, newSpellName) {
  const dungeons = ensureObject(savedDungeons);

  for (let dungeonId in dungeons) {
    const dungeon = dungeons[dungeonId];

    if (!dungeon || !dungeon.nodes) continue;

    for (let nodeId in dungeon.nodes) {
      const node = dungeon.nodes[nodeId];

      migrateSavedSpellChargeMap(node, oldSpellName, newSpellName);
    }
  }
}

function migrateSavedSpellChargeMap(savedEntry, oldSpellName, newSpellName) {
  if (!savedEntry || typeof savedEntry !== "object") return;

  savedEntry.spellCharges = ensureObject(savedEntry.spellCharges);

  if (savedEntry.spellCharges[oldSpellName] !== undefined) {
    savedEntry.spellCharges[newSpellName] = Math.max(savedEntry.spellCharges[newSpellName] || 0, savedEntry.spellCharges[oldSpellName] || 0);
    delete savedEntry.spellCharges[oldSpellName];
  }
}

function normalizeSavedSpellProgress(savedProgress) {
  const progress = ensureObject(savedProgress);

  return {
    xp: Number.isFinite(progress.xp) ? Math.max(0, progress.xp) : 0,
    level: Number.isFinite(progress.level) ? Math.max(0, Math.min(5, Math.floor(progress.level))) : 0,
  };
}

function normalizeSavedActiveAttunements(savedActiveAttunements) {
  if (!Array.isArray(savedActiveAttunements)) return [];

  return savedActiveAttunements.filter(function (entry) {
    return entry && entry.id && typeof getAttunementDefinition === "function" && !!getAttunementDefinition(entry.id);
  });
}

function normalizeSavedExpeditionLocationSpellEffects(savedExpedition) {
  const expedition = ensureObject(savedExpedition);
  const effects = ensureObject(expedition.locationSpellEffects);
  const normalizedEffects = {};

  if (effects.stoneSense && expedition.currentLocation === "foothillScree") {
    normalizedEffects.stoneSense = {
      locationName: "foothillScree",
    };
  }

  expedition.locationSpellEffects = normalizedEffects;
}

function createGameStateSaveData() {
  const savedGameState = structuredClone(gameState);
  const activity = savedGameState.activity;

  if (activity && activity.active && Number.isFinite(activity.startTime) && typeof getGameTime === "function") {
    const elapsedGameMs = Math.max(0, getGameTime() - activity.startTime);
    activity.startTime = Date.now() - elapsedGameMs;
  }

  return savedGameState;
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
  const savedLevel = Number.isFinite(savedSkill.level) ? savedSkill.level : Number.isFinite(savedSkill.rank) ? savedSkill.rank : 0;
  const level = Math.max(Math.max(0, Math.floor(savedLevel)), getSkillLevelFromCapacity(skillName, maxValue, DEFAULT_SKILL_RANK));
  const threshold = getSkillThresholdForLevel(skillName, level, DEFAULT_SKILL_RANK);

  const migratedSkill = {
    ...getDefaultSkillState(skillName),
    ...savedSkill,
    rank: DEFAULT_SKILL_RANK,
    level,
    [progressField]: Math.max(Number.isFinite(savedSkill[progressField]) ? savedSkill[progressField] : 0, threshold),
    revealed: !!savedSkill.revealed || level > 0,
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

function applyProjectSaveData(savedProjects) {
  ensureProjectsState();

  if (!savedProjects) return;

  const projectDefinitions = getProjectDefinitions();

  for (let projectName in projectDefinitions) {
    const state = getProjectState(projectName);
    const savedProject = ensureObject(savedProjects[projectName]);

    applySavedFields(state, savedProject, ["unlocked", "completed", "level", "work"]);
    state.deposits = structuredClone(ensureObject(savedProject.deposits));
    normalizeProjectState(projectName);

    if (projectName === "towerFoundation" && state.completed) {
      gameState.towerConstructionUnlocked = true;
    }

    if (projectName === "towerBasement" && state.completed) {
      gameState.towerBasementCompleted = true;
    }
  }
}

function applyTowerNodeSaveData(savedTowerNodes) {
  ensureTowerNodesState();

  if (!savedTowerNodes) return;

  const towerNodeDefinitions = getTowerNodeDefinitions();

  for (let nodeName in towerNodeDefinitions) {
    const state = getTowerNodeState(nodeName);
    const savedNode = ensureObject(savedTowerNodes[nodeName]);

    applySavedFields(state, savedNode, [
      "activated",
      "researchUnlocked",
      "built",
      "imbueProgress",
      "threadSenseProgress",
      "threadSensed",
      "advancedRecallUnlocked",
    ]);
    state.deposits = structuredClone(ensureObject(savedNode.deposits));
    normalizeTowerNodeState(nodeName);
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
    "manaCrystalImbuingUnlocked",
    "archiveDoorOpened",
    "campAlchemyPlansFound",
    "campTanningPlansFound",
    "campSmeltingPlansFound",
    "manaCondenserPlansFound",
    "partialTowerPlansFound",
    "towerConstructionUnlocked",
    "towerBasementCompleted",
    "personalWardUnlocked",
    "personalWardPopupShown",
    "destination",
    "hasCamp",
  ]);

  applySavedFields(gameState.exploration, savedGameState.exploration, ["currentStage", "count"]);

  if (savedGameState.magic) {
    gameState.magic.sensedReveals = structuredClone(ensureObject(savedGameState.magic.sensedReveals));
    gameState.magic.spellProgress = structuredClone(ensureObject(savedGameState.magic.spellProgress));

    const savedAttunements = ensureObject(savedGameState.magic.attunements);

    gameState.magic.attunements = {
      capacity: Number.isFinite(savedAttunements.capacity) && savedAttunements.capacity > 0 ? savedAttunements.capacity : 1,
      active: Array.isArray(savedAttunements.active) ? structuredClone(savedAttunements.active) : [],
    };
  }

  ensureSpellProgressState();
  getAttunementState();

  if (savedGameState.expedition) {
    applySavedFields(gameState.expedition, savedGameState.expedition, [
      "active",
      "discoveredSomething",
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
      "locationSpellEffects",
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

    if (typeof repairExpeditionLocationSpellEffects === "function") {
      repairExpeditionLocationSpellEffects();
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
    applySavedFields(gameState.skills.conditioning, savedGameState.skills.conditioning, [
      "rank",
      "level",
      "distance",
      "reinforcedEnergyUnlockSpent",
      "reinforcedEnergySpent",
      "pending",
      "revealed",
    ]);
    applySavedFields(gameState.skills.concentration, savedGameState.skills.concentration, ["rank", "level", "deepThought", "revealed"]);
    applySavedFields(gameState.skills.manaCycling, savedGameState.skills.manaCycling, ["rank", "level", "successfulCycles", "deepCycles", "revealed"]);
    applySavedFields(gameState.skills.meditation, savedGameState.skills.meditation, [
      "rank",
      "level",
      "successfulMeditations",
      "attunedMeditations",
      "revealed",
    ]);
    applySavedFields(gameState.skills.manaControl, savedGameState.skills.manaControl, ["rank", "level", "manaSpent", "revealed"]);
    ensureSkillsState();

    if (typeof syncSpellUpgradeEffects === "function") {
      syncSpellUpgradeEffects();
    }
  }

  applyProjectSaveData(savedGameState.projects);
  applyTowerNodeSaveData(savedGameState.towerNodes);

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

    if (Number.isFinite(location.looseStoneMax)) {
      if (Number.isFinite(savedLocation.looseStoneRemaining)) {
        location.looseStoneRemaining = savedLocation.looseStoneRemaining;
      }

      if (typeof getLocationLooseStoneRemaining === "function") {
        getLocationLooseStoneRemaining(location);
      }
    }

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
        if (Object.prototype.hasOwnProperty.call(location.storage, resourceName)) {
          location.storage[resourceName] = savedLocation.storage[resourceName];
        }
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

      applySavedFields(node, savedNode, ["discovered", "explored", "rewardClaimed", "manaSenseCharges", "spellCharges"]);
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
  hideElement(ui.personalWardPopup);
  hideElement(ui.advancedRecallPopup);

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
  updateProjectUI();
  updateCurrentGoalUI();
  updateJournalUI();
  updateRegionalMapVisibility();
  updateEquipmentSlotUI();
  updateExpeditionLoadoutVisibility();
  updateDestinationActions();
  updateLocationActions();
  checkResearchDiscoveries();
  updateCraftingUIForCurrentContext();
  updateTrapCapacityUI();
  updateTrainingUI();
  const canPackAfterLoad =
    gameState.expedition.active && !gameState.expedition.currentLocation && gameState.expedition.distance <= 0;

  setPackingActionsAvailable(canPackAfterLoad);
  updateAllActionButtons();
  updateRestButton();
  refreshExpeditionUI();
  updateTravelButton(isTravelActivityActive());
  updatePlacePanel();
  syncMainViewAvailability();

  if (gameState.personalWardUnlocked && !gameState.personalWardPopupShown && typeof showPersonalWardPopup === "function") {
    showPersonalWardPopup();
  }
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
  repairTowerNodeResearchFromCompletedResearch();
  applyAutomationSaveData(saveData.automation);
  ensureSkillsState();
  ensureProjectsState();
  ensureTowerNodesState();
  repairPersonalWardUnlockFromProject(false);
  repairTowerNodeActivationFromHeart(false);
  if (typeof checkRank2SkillUnlocks === "function") {
    checkRank2SkillUnlocks();
  }
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
    const loaded = loadGame();

    if (loaded && typeof resetDevGameSpeedMultiplier === "function") {
      resetDevGameSpeedMultiplier();
    } else if (loaded && typeof setDevGameSpeedMultiplier === "function") {
      setDevGameSpeedMultiplier(1);
    }

    return loaded;
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
