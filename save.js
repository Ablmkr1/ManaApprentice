const SAVE_KEY = "manaApprenticeSaveV1";
const SAVE_VERSION = 41;
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
      discovered: isResourceDiscovered(resourceName),
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

      const savedNode = {
        discovered: !!node.discovered,
        explored: !!node.explored,
        rewardClaimed: !!node.rewardClaimed,
        manaSenseCharges: node.manaSenseCharges || 0,
        spellCharges: structuredClone(getDungeonNodeSpellCharges(node)),
      };
      if (node.pendingReward) savedNode.pendingReward = structuredClone(node.pendingReward);
      savedDungeons[dungeonId].nodes[nodeId] = savedNode;
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
    if (saveData.version < 35 && !localStorage.getItem(SAVE_KEY + "BackupPre35")) localStorage.setItem(SAVE_KEY + "BackupPre35", rawSave);
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

  if (version <= 19) {
    migrateV19SaveDataToV20(normalizedSaveData);
  }

  if (version <= 20) {
    migrateV20SaveDataToV21(normalizedSaveData);
  }

  if (version <= 21) {
    migrateV21SaveDataToV22(normalizedSaveData);
  }

  if (version <= 22) {
    migrateV22SaveDataToV23(normalizedSaveData);
  }

  if (version <= 23) {
    migrateV23SaveDataToV24(normalizedSaveData);
  }

  if (version <= 24) {
    migrateV24SaveDataToV25(normalizedSaveData);
  }

  if (version <= 25) {
    migrateV25SaveDataToV26(normalizedSaveData);
  }

  if (version <= 26) {
    migrateV26SaveDataToV27(normalizedSaveData);
  }

  if (version <= 27) {
    migrateV27SaveDataToV28(normalizedSaveData);
  }

  if (version <= 28) {
    migrateV28SaveDataToV29(normalizedSaveData);
  }

  if (version <= 29) {
    migrateV29SaveDataToV30(normalizedSaveData);
  }

  if (version <= 30) {
    migrateV30SaveDataToV31(normalizedSaveData);
  }

  if (version <= 31) {
    migrateV31SaveDataToV32(normalizedSaveData);
  }

  if (version <= 32) {
    migrateV32SaveDataToV33(normalizedSaveData);
  }

  if (version <= 33) migrateV33SaveDataToV34(normalizedSaveData);

  if (version <= 34) migrateTowerEquipmentSave(normalizedSaveData);
  if (version <= 36) migrateV36SaveDataToV37(normalizedSaveData);
  if (version <= 37) migrateV37SaveDataToV38(normalizedSaveData);
  if (version <= 38) {
    normalizedSaveData.gameState.manaCondenserActivation = normalizedSaveData.campUpgrades?.manaCondenser?.purchased ? 3 : 0;
  }
  if (version <= 39) migrateV39SaveDataToV40(normalizedSaveData);
  if (version <= 40) migrateV40SaveDataToV41(normalizedSaveData);
  if (normalizedSaveData.resources.mana) normalizedSaveData.resources.mana.perSecond = 0;
  normalizedSaveData.version = SAVE_VERSION;

  return normalizedSaveData;
}

function migrateV40SaveDataToV41(saveData) {
  migrateTowerEquipmentSave(saveData);
  const savedGear = ensureObject(saveData.gearUpgrades);
  const highestBySlot = {};
  Object.keys(getGearUpgradeDefinitions()).forEach(function (id) {
    const definition = getGearUpgrade(id), saved = ensureObject(savedGear[id]);
    if (!definition?.slot || !saved.purchased) return;
    const key = definition.equipmentType + ":" + definition.slot;
    const current = highestBySlot[key];
    if (!current || (definition.slotRank || 0) > (getGearUpgrade(current)?.slotRank || 0)) highestBySlot[key] = id;
  });
  Object.keys(getGearUpgradeDefinitions()).forEach(function (id) {
    const definition = getGearUpgrade(id), saved = ensureObject(savedGear[id]);
    const highest = highestBySlot[definition.equipmentType + ":" + definition.slot];
    if (saved.purchased && highest && highest !== id) saved.purchased = false;
    savedGear[id] = saved;
  });
}

function migrateV39SaveDataToV40(saveData) {
  const state = ensureObject(saveData.gameState);
  const savedResources = ensureObject(saveData.resources);
  const savedResearch = ensureObject(saveData.research);
  const savedProjects = ensureObject(state.projects);
  const world = ensureObject(state.world);
  const territories = ensureObject(world.territories);
  const gate = ensureObject(savedProjects.towerRoomLongRangeGate);
  const floor = ensureObject(savedProjects.towerFloor3);
  const gateCompleted = !!gate.completed || Number(gate.level) >= 2;

  territories.home = { ...ensureObject(territories.home), label: "Home Territory", revealed: true, accessible: true, visited: true };
  territories.unknownTerritory1 = {
    ...ensureObject(territories.unknownTerritory1),
    label: "Unknown Territory",
    revealed: gateCompleted,
    accessible: gateCompleted,
    visited: !!ensureObject(territories.unknownTerritory1).visited,
  };
  world.territories = territories;
  state.world = world;

  if (state.brokenWardenDefeated) {
    state.wardenCoreRecovered = true;
    savedResources.wardenCore = {
      value: 1,
      maxValue: 1,
      perClick: 0,
      perSecond: 0,
      restPerSecond: 0,
      discovered: true,
      visible: true,
      ...ensureObject(savedResources.wardenCore),
    };
    savedResources.wardenCore.value = 1;
    savedResources.wardenCore.discovered = true;
    savedResources.wardenCore.visible = true;

    const network = ensureObject(savedResearch.longRangeNetwork);
    if (!network.completed) {
      network.unlocked = true;
      network.unlockedAt = Number.isFinite(network.unlockedAt) && network.unlockedAt > 0 ? network.unlockedAt : Date.now();
    }
    savedResearch.longRangeNetwork = network;
  }

  if (savedResearch.longRangeNetwork?.completed && ensureObject(savedProjects.towerFloor2).completed) floor.unlocked = true;
  if (floor.completed) gate.unlocked = true;
  savedProjects.towerFloor3 = floor;
  savedProjects.towerRoomLongRangeGate = gate;

  state.tierFourCompleted = gateCompleted;
  state.tierFiveUnlocked = gateCompleted;
  if (state.brokenWardenDefeated) {
    state.currentGoalId = gateCompleted
      ? "travelToFirstExternalTerritory"
      : Number(gate.level) >= 1
        ? "activateLongRangeGate"
        : floor.completed
          ? "buildLongRangeGate"
          : savedResearch.longRangeNetwork?.completed
            ? "buildGateChamber"
            : "researchLongRangeNetwork";
  }

  saveData.gameState = state;
  saveData.resources = savedResources;
  saveData.research = savedResearch;
}

function migrateV33SaveDataToV34(saveData) {
  const state = ensureObject(saveData.gameState);
  const elemental = ensureObject(ensureObject(state.elementals).earth);
  const capabilities = ensureObject(elemental.capabilities);
  const regional = ensureObject(state.regionalProgress);
  const skill = ensureObject(ensureObject(state.skills).manaCycling);
  saveData.research = ensureObject(saveData.research);
  const complete = function (id) { saveData.research[id] = { ...ensureObject(saveData.research[id]), completed: true, unlocked: false }; };
  const equipment = capabilities.equipmentUnlocked || Object.values(ensureObject(capabilities.harnesses)).some(n => n > 0) || regional.east?.capabilityDiscovered;
  const attunement = capabilities.attunementUnlocked || Object.values(ensureObject(capabilities.attunements)).some(n => n > 0) || regional.south?.capabilityDiscovered;
  if (elemental.owned > 0 || elemental.bindingDiscovered || equipment || attunement) complete("elementalBinding");
  if (equipment) complete("elementalHarnessing");
  if (attunement) complete("elementalAttunement");
  if (skill.revealed || skill.level > 0 || skill.rank > 1 || skill.manaXp > 0 || saveData.actions?.practiceManaCycling?.unlocked) complete("manaCycling");
  for (const resource of Object.values(ensureObject(saveData.resources))) resource.discovered = !!resource.discovered || !!resource.visible || resource.value > 0;
}

function migrateV36SaveDataToV37(saveData) {
  const controlDais = saveData.dungeons?.silentGearworksDepths?.nodes?.controlDais;
  const collection = saveData.gameState?.equipment;
  if (!controlDais?.rewardClaimed || !collection || !Array.isArray(collection.items)) return;
  if (collection.items.some(item => item.rewardId === "fadedArtificersRing")) return;

  const nextId = Math.max(1, Math.floor(Number(collection.nextId) || 1));
  collection.items.push({
    id: "gear-" + nextId,
    rewardId: "fadedArtificersRing",
    name: "Faded Artificer’s Ring",
    slot: "ring",
    effects: { maxManaFlat: 5 },
    description: "A narrow metal band, its inner surface covered in almost familiar markings. Most of its enchantment has faded, but a small reservoir remains.",
  });
  collection.nextId = nextId + 1;
}

function migrateV37SaveDataToV38(saveData) {
  const dungeons = ensureObject(saveData.dungeons);
  for (let dungeonId in dungeons) {
    const dungeon = ensureObject(dungeons[dungeonId]);
    const nodes = ensureObject(dungeon.nodes);
    for (let nodeId in nodes) {
      const node = nodes[nodeId];
      if (!node || typeof node !== "object") continue;
      if (node.rewardClaimed) {
        delete node.pendingReward;
        continue;
      }
      if (!node.pendingReward || typeof node.pendingReward !== "object" || Array.isArray(node.pendingReward)) continue;
      const carried = ensureObject(node.pendingReward.carried);
      node.pendingReward.carried = {};
      for (let itemName in carried) {
        const amount = Math.floor(Number(carried[itemName]) || 0);
        if (amount > 0) node.pendingReward.carried[itemName] = amount;
      }
      node.pendingReward.nonCarriedGranted = !!node.pendingReward.nonCarriedGranted;
    }
  }
}

function normalizeSaveData(saveData) {
  saveData.savedAt = Number.isFinite(saveData.savedAt) ? saveData.savedAt : Date.now();

  saveData.gameState = ensureObject(saveData.gameState);
  saveData.gameState.exploration = ensureObject(saveData.gameState.exploration);
  saveData.gameState.expedition = ensureObject(saveData.gameState.expedition);
  saveData.gameState.expedition.carriedItems = ensureObject(saveData.gameState.expedition.carriedItems);
  saveData.gameState.skills = ensureObject(saveData.gameState.skills);
  saveData.gameState.projects = ensureObject(saveData.gameState.projects);
  saveData.gameState.tower = ensureObject(saveData.gameState.tower);
  saveData.gameState.towerNodes = ensureObject(saveData.gameState.towerNodes);
  saveData.gameState.elementals = ensureObject(saveData.gameState.elementals);
  saveData.gameState.regionalProgress = ensureObject(saveData.gameState.regionalProgress);
  saveData.gameState.magic = ensureObject(saveData.gameState.magic);
  saveData.gameState.systemUnlocks = ensureObject(saveData.gameState.systemUnlocks);
  saveData.gameState.magic.sensedReveals = ensureObject(saveData.gameState.magic.sensedReveals);
  saveData.gameState.magic.spellProgress = ensureObject(saveData.gameState.magic.spellProgress);
  saveData.gameState.magic.spellProgress.manaSense = normalizeSavedSpellProgress(saveData.gameState.magic.spellProgress.manaSense);
  saveData.gameState.magic.spellProgress.attunement = normalizeSavedSpellProgress(saveData.gameState.magic.spellProgress.attunement);
  saveData.gameState.magic.spellProgress.imbue = normalizeSavedSpellProgress(saveData.gameState.magic.spellProgress.imbue);
  saveData.gameState.magic.spellProgress.arcaneForce = normalizeSavedSpellProgress(saveData.gameState.magic.spellProgress.arcaneForce);
  saveData.gameState.magic.spellProgress.ward = normalizeSavedSpellProgress(saveData.gameState.magic.spellProgress.ward);
  normalizeSavedImbueToolCharges(saveData.gameState.magic);
  normalizeSavedImbueRankTwoState(saveData.gameState);
  normalizeSavedArcaneForceRankTwoState(saveData.gameState);
  saveData.gameState.magic.attunements = ensureObject(saveData.gameState.magic.attunements);

  if (!Array.isArray(saveData.gameState.magic.attunements.active)) {
    saveData.gameState.magic.attunements.active = [];
  }

  saveData.gameState.magic.attunements.active = normalizeSavedActiveAttunements(saveData.gameState.magic.attunements.active);
  saveData.gameState.magic.attunements.rank = saveData.gameState.magic.attunements.rank >= 2 ? 2 : 1;
  saveData.gameState.magic.attunements.rankTwoLevel = Math.max(0, Math.min(10, Math.floor(Number(saveData.gameState.magic.attunements.rankTwoLevel) || 0)));
  saveData.gameState.magic.attunements.rankTwoXp = Math.max(0, Number(saveData.gameState.magic.attunements.rankTwoXp) || 0);
  saveData.gameState.magic.attunements.breakthroughs = ensureObject(saveData.gameState.magic.attunements.breakthroughs);
  saveData.gameState.magic.attunements.persistentResonanceCompleted = !!saveData.gameState.magic.attunements.persistentResonanceCompleted;
  saveData.gameState.magic.attunements.rankTwoComplete = !!saveData.gameState.magic.attunements.rankTwoComplete;

  if (!Number.isFinite(saveData.gameState.magic.attunements.capacity) || saveData.gameState.magic.attunements.capacity <= 0) {
    saveData.gameState.magic.attunements.capacity = 1;
  }
  normalizeSavedExpeditionLocationSpellEffects(saveData.gameState.expedition);

  saveData.research = ensureObject(saveData.research);
  saveData.gameState.world = ensureObject(saveData.gameState.world);
  saveData.gameState.world.regions = ensureObject(saveData.gameState.world.regions);
  saveData.gameState.world.territories = ensureObject(saveData.gameState.world.territories);

  saveData.resources = ensureObject(saveData.resources);
  saveData.actions = ensureObject(saveData.actions);
  saveData.campUpgrades = ensureObject(saveData.campUpgrades);
  saveData.gearUpgrades = ensureObject(saveData.gearUpgrades);
  normalizeSavedCombatProgress(saveData);
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

function normalizeSavedImbueToolCharges(magic) {
  magic.toolCharges = ensureObject(magic.toolCharges);
  ["knife", "axe", "pick"].forEach(function (tool) {
    const charge = Number(magic.toolCharges[tool]);
    magic.toolCharges[tool] = Number.isFinite(charge) ? Math.max(0, Math.floor(charge)) : 0;
  });
}

function normalizeSavedImbueRankTwoState(savedGameState) {
  savedGameState.magic = ensureObject(savedGameState.magic);
  const state = ensureObject(savedGameState.magic.imbuement);
  const config = getImbueRankTwoConfig();
  const maxStage = Object.keys(config.controlMatrix).length;
  state.rank = state.rank >= 2 ? 2 : 1;
  state.rankTwoLevel = Math.max(0, Math.min(10, Math.floor(Number(state.rankTwoLevel) || 0)));
  state.rankTwoXp = Math.max(0, Number(state.rankTwoXp) || 0);
  state.breakthroughs = ensureObject(state.breakthroughs);
  state.breakthroughs.permanentBinding = Math.max(0, Number(state.breakthroughs.permanentBinding) || 0);
  state.permanentBindingCompleted = !!state.permanentBindingCompleted || state.rank >= 2;
  state.rankTwoComplete = !!state.rankTwoComplete || state.rankTwoLevel >= 10;
  state.craftedRings = ensureObject(state.craftedRings);
  Object.keys(config.rings).forEach(function (ringId) {
    state.craftedRings[ringId] = !!state.craftedRings[ringId];
  });
  state.equippedRing = typeof state.equippedRing === "string" && state.craftedRings[state.equippedRing] && config.rings[state.equippedRing]
    ? state.equippedRing
    : Object.keys(config.rings).find(function (ringId) { return state.craftedRings[ringId]; }) || null;
  state.backpackImbued = !!state.backpackImbued;
  state.equipmentEnchantments = ensureObject(state.equipmentEnchantments);
  state.furnaceTier = Math.max(0, Math.min(2, Math.floor(Number(state.furnaceTier) || 0)));
  state.alchemyTier = Math.max(0, Math.min(2, Math.floor(Number(state.alchemyTier) || 0)));
  state.controlMatrixStage = Math.max(0, Math.min(maxStage, Math.floor(Number(state.controlMatrixStage) || 0)));

  if (!Number.isFinite(state.controlCapacity) || state.controlCapacity <= 0) {
    const savedTower = ensureObject(savedGameState.tower);
    const savedEarth = ensureObject(ensureObject(savedGameState.elementals).earth);
    const legacyCapacity = [savedTower.elementalControlCapacity, savedTower.controlCapacity, savedEarth.controlCapacity]
      .find(function (value) { return Number.isFinite(value) && value > 0; });
    const matrix = config.controlMatrix[state.controlMatrixStage];
    state.controlCapacity = legacyCapacity || (matrix ? matrix.capacity : getElementalAutomationConfig().towerHeart.startingElementalControlCapacity);
  }

  state.controlCapacity = Math.max(1, Math.floor(state.controlCapacity));
  savedGameState.magic.imbuement = state;
}

function normalizeSavedArcaneForceRankTwoState(savedGameState) {
  savedGameState.magic = ensureObject(savedGameState.magic);
  const state = ensureObject(savedGameState.magic.arcaneForce);
  state.rank = state.rank >= 2 ? 2 : 1;
  state.rankTwoLevel = Math.max(0, Math.min(10, Math.floor(Number(state.rankTwoLevel) || 0)));
  state.rankTwoXp = Math.max(0, Number(state.rankTwoXp) || 0);
  state.breakthroughs = ensureObject(state.breakthroughs);
  state.breakthroughs.forceAmplification = Math.max(0, Number(state.breakthroughs.forceAmplification) || 0);
  state.forceAmplificationCompleted = !!state.forceAmplificationCompleted || state.rank >= 2;
  state.rankTwoComplete = !!state.rankTwoComplete || state.rankTwoLevel >= 10;
  savedGameState.magic.arcaneForce = state;
}

function normalizeSavedCombatProgress(saveData) {
  const savedGameState = ensureObject(saveData.gameState);
  const northernVictory = !!ensureObject(savedGameState.northernDisturbance).resolved;
  const regional = ensureObject(savedGameState.regionalProgress);
  const regionalVictory = !!ensureObject(regional.east).disturbanceResolved || !!ensureObject(regional.south).disturbanceResolved;
  const savedGear = ensureObject(saveData.gearUpgrades);
  const staffVictory = !!ensureObject(savedGear.ironStaff).purchased || !!ensureObject(savedGear.steelStaff).purchased;
  const explicitVictories = Math.max(0, Math.floor(Number(savedGameState.combatVictories) || 0));
  savedGameState.combatVictories = Math.max(explicitVictories, northernVictory || regionalVictory || staffVictory ? 1 : 0);
  saveData.gameState = savedGameState;
}

function migrateV31SaveDataToV32(saveData) {
  normalizeSavedCombatProgress(saveData);
}

function migrateV32SaveDataToV33(saveData) {
  const savedResources = ensureObject(saveData.resources);
  const savedCampUpgrades = ensureObject(saveData.campUpgrades);
  const savedStone = ensureObject(savedResources.stone);
  const savedWorkbench = ensureObject(savedCampUpgrades.workbench);
  const stoneReturnedToCamp = !!savedStone.visible || (Number.isFinite(savedStone.value) && savedStone.value > 0);

  if (!savedWorkbench.purchased) {
    savedWorkbench.unlocked = stoneReturnedToCamp;
  }

  savedCampUpgrades.workbench = savedWorkbench;
  saveData.campUpgrades = savedCampUpgrades;

  const savedGameState = ensureObject(saveData.gameState);
  const savedTowerNodes = ensureObject(savedGameState.towerNodes);
  const savedRegionalProgress = ensureObject(savedGameState.regionalProgress);
  const savedResearch = ensureObject(saveData.research);

  [
    { regionId: "east", researchName: "easternTowerNode" },
    { regionId: "south", researchName: "southernTowerNode" },
  ].forEach(function (entry) {
    const savedNode = ensureObject(savedTowerNodes[entry.regionId]);
    const savedRegion = ensureObject(savedRegionalProgress[entry.regionId]);
    const savedNodeResearch = ensureObject(savedResearch[entry.researchName]);
    const hasDeposits = Object.values(ensureObject(savedNode.deposits)).some(function (amount) { return Number(amount) > 0; });
    const constructionAlreadyAvailable = !!savedNode.researchUnlocked || !!savedNode.built || hasDeposits || Number(savedNode.imbueProgress) > 0;

    if (constructionAlreadyAvailable) {
      savedNode.activated = true;
      savedNode.researchUnlocked = true;
      savedNodeResearch.completed = true;
      savedNodeResearch.unlocked = false;
    } else if (savedRegion.disturbanceResolved) {
      savedNode.activated = true;
      savedNode.researchUnlocked = false;
      savedNodeResearch.completed = false;
      savedNodeResearch.unlocked = true;
      savedNodeResearch.unlockedAt = Number.isFinite(savedNodeResearch.unlockedAt) ? savedNodeResearch.unlockedAt : Date.now();
    }

    savedTowerNodes[entry.regionId] = savedNode;
    savedResearch[entry.researchName] = savedNodeResearch;
  });

  savedGameState.towerNodes = savedTowerNodes;
  saveData.gameState = savedGameState;
  saveData.research = savedResearch;
}

function migrateV30SaveDataToV31(saveData) {
  normalizeSavedArcaneForceRankTwoState(saveData.gameState);
}

function migrateV29SaveDataToV30(saveData) {
  normalizeSavedImbueRankTwoState(saveData.gameState);
  saveData.gameState.towerNodes = normalizeSavedTowerNodes(saveData.gameState.towerNodes, !!ensureObject(ensureObject(saveData.gameState).projects).towerFoundation?.completed);
}

function migrateV28SaveDataToV29(saveData) {
  saveData.gameState.magic = ensureObject(saveData.gameState.magic);
  normalizeSavedImbueToolCharges(saveData.gameState.magic);
}

function migrateV25SaveDataToV26(saveData) {
  const savedGameState = ensureObject(saveData.gameState);
  const savedProjects = ensureObject(savedGameState.projects);
  const tower = ensureObject(savedGameState.tower);

  tower.selectedId = typeof tower.selectedId === "string" ? tower.selectedId : "heart";

  Object.values(getTowerFloorDefinitions())
    .concat(Object.values(getTowerRoomDefinitions()))
    .forEach(function (entity) {
      if (!savedProjects[entity.projectId] || typeof savedProjects[entity.projectId] !== "object") {
        savedProjects[entity.projectId] = {
          unlocked: false,
          completed: false,
          level: 0,
          work: 0,
          deposits: {},
        };
      }
    });

  savedGameState.tower = tower;
  savedGameState.projects = savedProjects;
  saveData.gameState = savedGameState;
}

function migrateV26SaveDataToV27(saveData) {
  const savedGameState = ensureObject(saveData.gameState);
  const regionalProgress = ensureObject(savedGameState.regionalProgress);
  regionalProgress.unlocked = !!regionalProgress.unlocked;
  regionalProgress.east = ensureObject(regionalProgress.east);
  regionalProgress.south = ensureObject(regionalProgress.south);
  savedGameState.regionalProgress = regionalProgress;
  savedGameState.elementals = ensureObject(savedGameState.elementals);
  saveData.gameState = savedGameState;
  saveData.resources = ensureObject(saveData.resources);
}

function migrateV27SaveDataToV28(saveData) {
  const savedGameState = ensureObject(saveData.gameState);
  savedGameState.magic = ensureObject(savedGameState.magic);
  const attunements = ensureObject(savedGameState.magic.attunements);
  attunements.rank = 1;
  attunements.rankTwoLevel = 0;
  attunements.rankTwoXp = 0;
  attunements.breakthroughs = {};
  attunements.persistentResonanceCompleted = false;
  attunements.rankTwoComplete = false;
  savedGameState.magic.attunements = attunements;
  saveData.gameState = savedGameState;
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

function migrateV19SaveDataToV20(saveData) {
  const savedGameState = ensureObject(saveData.gameState);
  const northNode = ensureObject(ensureObject(savedGameState.towerNodes).north);

  savedGameState.northernDisturbance = {
    triggered: !!northNode.advancedRecallUnlocked,
    resolved: false,
    popupShown: !!northNode.advancedRecallUnlocked,
  };
  saveData.gameState = savedGameState;
}

function migrateV20SaveDataToV21(saveData) {
  const savedGameState = ensureObject(saveData.gameState);
  const savedSkills = ensureObject(savedGameState.skills);
  const manaCycling = ensureObject(savedSkills.manaCycling);
  const rank = Number.isFinite(manaCycling.rank) ? manaCycling.rank : DEFAULT_SKILL_RANK;
  const level = Number.isFinite(manaCycling.level) ? manaCycling.level : 0;
  const legacyProgress = rank === RANK_TWO_SKILL_RANK ? manaCycling.deepCycles : manaCycling.successfulCycles;
  const legacyManaXp = Math.max(0, Number.isFinite(legacyProgress) ? legacyProgress * 5 : 0);
  const levelThreshold = getSkillThresholdForLevel("manaCycling", level, rank);

  manaCycling.manaXp = Math.max(legacyManaXp, levelThreshold);
  manaCycling.breakthroughReady = false;
  savedSkills.manaCycling = manaCycling;
  savedGameState.skills = savedSkills;
  saveData.gameState = savedGameState;
}

function migrateV21SaveDataToV22(saveData) {
  const savedGameState = ensureObject(saveData.gameState);
  const savedResources = ensureObject(saveData.resources);
  const savedMana = ensureObject(savedResources.mana);
  const hasMana = !!savedGameState.magicUnlocked || !!savedMana.visible;

  if (!hasMana) return;

  const savedSkills = ensureObject(savedGameState.skills);
  const manaCycling = {
    ...getDefaultSkillState("manaCycling"),
    ...ensureObject(savedSkills.manaCycling),
  };
  let rank = normalizeSkillRank("manaCycling", manaCycling.rank);
  let level = normalizeSkillLevel("manaCycling", manaCycling.level, rank);
  const savedManaMax = Number.isFinite(savedMana.maxValue) ? savedMana.maxValue : 0;
  let preservedCapacity = getSkillLevelDefinition("manaCycling", level, rank).capacity || 0;

  // Capacity is derived from this skill. Match an existing saved cap to its
  // corresponding defined level before stats are recalculated.
  getSkillDefinition("manaCycling").ranks.forEach(function (rankDefinition) {
    rankDefinition.levels.forEach(function (levelDefinition) {
      if (levelDefinition.capacity > savedManaMax || levelDefinition.capacity <= preservedCapacity) return;

      rank = rankDefinition.rank;
      level = levelDefinition.level;
      preservedCapacity = levelDefinition.capacity;
    });
  });

  manaCycling.rank = rank;
  manaCycling.level = level;
  manaCycling.revealed = true;
  manaCycling.manaXp = Math.max(
    0,
    Number.isFinite(manaCycling.manaXp) ? manaCycling.manaXp : 0,
    getSkillThresholdForLevel("manaCycling", level, rank)
  );
  manaCycling.breakthroughReady = false;

  // Automatic levels are caught up here, but a required breakthrough is never
  // skipped just because an old save already has enough cumulative mana XP.
  while (true) {
    const next = getSkillLevelDefinition("manaCycling", level + 1, rank);

    if (!next || manaCycling.manaXp < next.threshold) break;
    if (next.breakthrough) {
      manaCycling.breakthroughReady = true;
      break;
    }

    level = next.level;
    manaCycling.level = level;
  }

  savedSkills.manaCycling = manaCycling;
  savedGameState.skills = savedSkills;
  saveData.gameState = savedGameState;
  saveData.actions = ensureObject(saveData.actions);
  saveData.actions.practiceManaCycling = {
    ...ensureObject(saveData.actions.practiceManaCycling),
    unlocked: true,
  };
}

function migrateV22SaveDataToV23(saveData) {
  const savedGameState = ensureObject(saveData.gameState);
  const magic = ensureObject(savedGameState.magic);
  const spellProgress = ensureObject(magic.spellProgress);
  const savedWard = ensureObject(ensureObject(saveData.resources).ward);

  spellProgress.ward = normalizeSavedSpellProgress(spellProgress.ward);
  magic.spellProgress = spellProgress;
  magic.ward = {
    rank: 1,
    formed: Number(savedWard.value) > 0,
    maintainEnabled: false,
    ...ensureObject(magic.ward),
  };
  magic.ward.rank = 1;
  magic.ward.formed = !!magic.ward.formed;
  magic.ward.maintainEnabled = !!magic.ward.maintainEnabled;
  savedGameState.magic = magic;
  saveData.gameState = savedGameState;
}

function migrateV23SaveDataToV24(saveData) {
  const savedGameState = ensureObject(saveData.gameState);
  const savedExpedition = ensureObject(savedGameState.expedition);
  const savedProjects = ensureObject(savedGameState.projects);
  const savedSpells = ensureObject(saveData.spells);
  const savedCampUpgrades = ensureObject(saveData.campUpgrades);
  const savedAutomation = ensureObject(saveData.automation);
  const announced = {};
  const seen = {};
  const markExistingSystemSeen = function (systemName, isAvailable) {
    if (!isAvailable) return;
    announced[systemName] = true;
    seen[systemName] = true;
  };
  const hasUnlockedSavedSpell = Object.keys(savedSpells).some(function (spellName) {
    return !!ensureObject(savedSpells[spellName]).unlocked;
  });
  const hasVisibleSavedProject = Object.keys(savedProjects).some(function (projectName) {
    const project = ensureObject(savedProjects[projectName]);
    return !!project.unlocked || !!project.completed;
  });
  const hasUnlockedSavedAutomation = Object.keys(savedAutomation).some(function (machineName) {
    return !!ensureObject(savedAutomation[machineName]).unlocked;
  });

  markExistingSystemSeen(
    "expedition",
    savedGameState.phase === "expedition" || !!savedExpedition.active || !!savedExpedition.currentLocation
  );
  markExistingSystemSeen("magic", !!savedGameState.magicUnlocked || hasUnlockedSavedSpell);
  markExistingSystemSeen("research", !!ensureObject(savedCampUpgrades.researchSpot).purchased);
  markExistingSystemSeen("tower", hasVisibleSavedProject);
  markExistingSystemSeen("automation", hasUnlockedSavedAutomation);

  savedGameState.systemUnlocks = {
    initialized: true,
    announced,
    seen,
  };
  saveData.gameState = savedGameState;
}

function migrateV24SaveDataToV25(saveData) {
  const savedGameState = ensureObject(saveData.gameState);
  const savedResources = ensureObject(saveData.resources);
  const savedCore = ensureObject(savedResources.earthElementalCore);

  savedGameState.elementals = ensureObject(savedGameState.elementals);
  // Version 24 introduced the Core as a one-slot story item. Repeat combat
  // requires it to retain additional drops after existing saves are loaded.
  savedCore.maxValue = Math.max(100, Number.isFinite(savedCore.maxValue) ? savedCore.maxValue : 0);
  savedResources.earthElementalCore = savedCore;
  saveData.gameState = savedGameState;
  saveData.resources = savedResources;
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
      permanentImbued: !!savedNode.permanentImbued,
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
  // Active combat is never persisted. Reloading safely returns to normal play.
  delete savedGameState.combat;
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
    state.upgradeCredit = savedProject.upgradeCredit ? structuredClone(savedProject.upgradeCredit) : null;
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
      "permanentImbued",
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
    resource.discovered = !!savedResource.discovered || !!savedResource.visible || savedResource.value > 0;
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
  gameState.equipment = normalizeEquipmentCollection(savedGameState.equipment ? structuredClone(savedGameState.equipment) : newEquipmentCollection());
  // Timed jobs do not advance offline; unpaid equipment reservations are canceled.
  gameState.equipment.pending = null;

  // Older saves predate the western capstone; never inherit another save's win.
  gameState.brokenWardenDefeated = !!savedGameState.brokenWardenDefeated;
  gameState.wardenCoreRecovered = !!savedGameState.wardenCoreRecovered;
  gameState.tierFourCompleted = !!savedGameState.tierFourCompleted;
  gameState.tierFiveUnlocked = !!savedGameState.tierFiveUnlocked;

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
    "combatVictories",
    "brokenWardenDefeated",
    "wardenCoreRecovered",
    "tierFourCompleted",
    "tierFiveUnlocked",
    "destination",
    "hasCamp",
  ]);

  const savedSystemUnlocks = ensureObject(savedGameState.systemUnlocks);
  gameState.systemUnlocks = {
    initialized: !!savedSystemUnlocks.initialized,
    announced: structuredClone(ensureObject(savedSystemUnlocks.announced)),
    seen: structuredClone(ensureObject(savedSystemUnlocks.seen)),
  };

  const savedHomeAttention = ensureObject(savedGameState.homeAttention);
  const savedHomeAttentionSeen = ensureObject(savedHomeAttention.seen);
  gameState.homeAttention = {
    seen: {
      crafting: Array.isArray(savedHomeAttentionSeen.crafting) ? [...new Set(savedHomeAttentionSeen.crafting.filter(value => typeof value === "string"))] : [],
      research: Array.isArray(savedHomeAttentionSeen.research) ? [...new Set(savedHomeAttentionSeen.research.filter(value => typeof value === "string"))] : [],
      training: Array.isArray(savedHomeAttentionSeen.training) ? [...new Set(savedHomeAttentionSeen.training.filter(value => typeof value === "string"))] : [],
    },
  };

  const savedTower = ensureObject(savedGameState.tower);
  gameState.tower = {
    selectedId: typeof savedTower.selectedId === "string" ? savedTower.selectedId : "heart",
    lastAutoSelectedProject: typeof savedTower.lastAutoSelectedProject === "string" ? savedTower.lastAutoSelectedProject : "",
  };

  const savedDisturbance = ensureObject(savedGameState.northernDisturbance);
  gameState.northernDisturbance = {
    triggered: !!savedDisturbance.triggered,
    resolved: !!savedDisturbance.resolved,
    popupShown: !!savedDisturbance.popupShown,
  };

  const savedRegionalProgress = ensureObject(savedGameState.regionalProgress);
  gameState.regionalProgress = {
    unlocked: !!savedRegionalProgress.unlocked,
    east: {
      disturbanceTriggered: !!ensureObject(savedRegionalProgress.east).disturbanceTriggered,
      disturbanceResolved: !!ensureObject(savedRegionalProgress.east).disturbanceResolved,
      capabilityDiscovered: !!ensureObject(savedRegionalProgress.east).capabilityDiscovered,
    },
    south: {
      disturbanceTriggered: !!ensureObject(savedRegionalProgress.south).disturbanceTriggered,
      disturbanceResolved: !!ensureObject(savedRegionalProgress.south).disturbanceResolved,
      capabilityDiscovered: !!ensureObject(savedRegionalProgress.south).capabilityDiscovered,
    },
  };

  applySavedFields(gameState.exploration, savedGameState.exploration, ["currentStage", "count"]);

  if (savedGameState.magic) {
    gameState.magic.sensedReveals = structuredClone(ensureObject(savedGameState.magic.sensedReveals));
    gameState.magic.spellProgress = structuredClone(ensureObject(savedGameState.magic.spellProgress));
    gameState.magic.toolCharges = structuredClone(ensureObject(savedGameState.magic.toolCharges));
    normalizeSavedImbueToolCharges(gameState.magic);
    gameState.magic.imbuement = structuredClone(ensureObject(savedGameState.magic.imbuement));
    gameState.magic.arcaneForce = structuredClone(ensureObject(savedGameState.magic.arcaneForce));

    const savedAttunements = ensureObject(savedGameState.magic.attunements);

    gameState.magic.attunements = {
      capacity: Number.isFinite(savedAttunements.capacity) && savedAttunements.capacity > 0 ? savedAttunements.capacity : 1,
      active: Array.isArray(savedAttunements.active) ? structuredClone(savedAttunements.active) : [],
      rank: savedAttunements.rank >= 2 ? 2 : 1,
      rankTwoLevel: Math.max(0, Math.min(10, Math.floor(Number(savedAttunements.rankTwoLevel) || 0))),
      rankTwoXp: Math.max(0, Number(savedAttunements.rankTwoXp) || 0),
      breakthroughs: structuredClone(ensureObject(savedAttunements.breakthroughs)),
      persistentResonanceCompleted: !!savedAttunements.persistentResonanceCompleted,
      rankTwoComplete: !!savedAttunements.rankTwoComplete,
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
    const savedTerritories = ensureObject(savedGameState.world.territories);
    gameState.world.territories = {
      home: { ...ensureObject(savedTerritories.home), label: "Home Territory", revealed: true, accessible: true, visited: true },
      unknownTerritory1: { label: "Unknown Territory", revealed: false, accessible: false, visited: false, ...ensureObject(savedTerritories.unknownTerritory1) },
    };
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
    applySavedFields(gameState.skills.manaCycling, savedGameState.skills.manaCycling, [
      "rank",
      "level",
      "manaXp",
      "breakthroughReady",
      "successfulCycles",
      "deepCycles",
      "revealed",
    ]);
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
  gameState.elementals = structuredClone(ensureObject(savedGameState.elementals));
  ensureElementalState();
  ensureImbueRankTwoState();
  ensureArcaneForceRankTwoState();

  if (typeof repairNorthernDisturbanceFromNorthNode === "function") {
    repairNorthernDisturbanceFromNorthNode();
  }
  if (typeof repairRegionalProgressionFromNorthNode === "function") {
    repairRegionalProgressionFromNorthNode();
  }

  resetActivity();
  gameState.pendingCondenserActivity = structuredClone(savedGameState.pendingCondenserActivity || null);
  gameState.pendingCondenserActivities = structuredClone(Array.isArray(savedGameState.pendingCondenserActivities) ? savedGameState.pendingCondenserActivities : []);
  gameState.manaCondenserActivation = Math.max(0, Math.min(3, Math.floor(Number(savedGameState.manaCondenserActivation) || 0)));
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

      applySavedFields(node, savedNode, ["discovered", "explored", "rewardClaimed", "pendingReward", "manaSenseCharges", "spellCharges"]);
      if (node.rewardClaimed) delete node.pendingReward;
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
  hideElement(ui.northernDisturbancePopup);

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

  resetCombatEncounter();

  applyGameStateSaveData(saveData.gameState);
  applyResourceSaveData(saveData.resources);
  applyActionSaveData(saveData.actions);
  applyUpgradeSaveData(getCampUpgradeDefinitions(), saveData.campUpgrades, ["unlocked", "purchased"], updateCampUpgradeUI);
  syncHomeStructureUnlocks();
  applyUpgradeSaveData(getGearUpgradeDefinitions(), saveData.gearUpgrades, ["unlocked", "purchased"], updateGearUpgradeUI);
  applyUpgradeSaveData(getSpellDefinitions(), saveData.spells, ["unlocked"]);
  repairSpellUnlocksFromFlags();
  repairExpeditionTonicSlots();
  applyUpgradeSaveData(getResourceCraftDefinitions(), saveData.resourceCrafts, ["unlocked"], updateResourceCraftUI);
  syncIronStaffUnlockFromCombatHistory();
  applyExpeditionLocationSaveData(saveData.expeditionLocations);
  applyDungeonSaveData(saveData.dungeons);
  applyResearchSaveData(saveData.research);
  syncEquippedBaseStats();
  repairTowerNodeResearchFromCompletedResearch();
  applyAutomationSaveData(saveData.automation);
  ensureSkillsState();
  ensureProjectsState();
  ensureTowerStructureState();
  syncTowerStructureUnlocks(false);
  repairLegacySteelworkingResearch();
  syncSteelworkingUnlocks();
  ensureTowerNodesState();
  ensureElementalState();
  repairPersonalWardUnlockFromProject(false);
  repairTowerNodeActivationFromHeart(false);
  if (typeof checkRank2SkillUnlocks === "function") {
    checkRank2SkillUnlocks();
  }
  recalculateCharacterStats();
  recalculateCampEffects();
  applyBasementStorageUpgrade();
  recalculateToolEffects();
  checkResearchDiscoveries();
  syncTierFourFinaleProgression();
  repairWesternCondenserSave(saveData);
  applyGolemOfflineProgress(saveData);
  refreshGameUIAfterLoad();
  trySaveGame(); // Commit deliveries and the new timestamp before another reload.

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

function repairWesternCondenserSave(saveData) {
  // The alcove already unlocked manual production before the archive machine.
  // Preserve that distinction, including saves made before location discovery
  // was persisted. Do not open the archive door or activate any regional node.
  const accessible = gameState.manaCrystalImbuingUnlocked || gameState.manaCondenserPlansFound ||
    ["manaCondenserFrame", "manaCondenser"].some(id => getCampUpgrade(id).unlocked || getCampUpgrade(id).purchased);
  if (accessible) {
    gameState.world.regions.west.unlocked = true;
    const location = getExpeditionLocation("roadsideRuin");
    location.discovered = true;
    location.explored = true;
  }
  const savedActivity = saveData.gameState?.activity;
  if (isWesternCondenserActivity(savedActivity)) {
    if (gameState.pendingCondenserActivity) {
      if (!Array.isArray(gameState.pendingCondenserActivities)) gameState.pendingCondenserActivities = [];
      gameState.pendingCondenserActivities.push(gameState.pendingCondenserActivity);
    }
    const elapsed = Math.max(0, (saveData.savedAt - savedActivity.startTime) / 1000);
    gameState.pendingCondenserActivity = {
      activity: structuredClone(savedActivity),
      elapsed: Math.min(savedActivity.duration || 0, Number.isFinite(elapsed) ? elapsed : 0),
    };
  }
  resumeWesternCondenserActivity();
}

function applyGolemOfflineProgress(saveData, now = Date.now()) {
  const elapsed = Number.isFinite(saveData.savedAt) ? Math.max(0, (now - saveData.savedAt) / 1000) : 0;
  // Shared worker engine: no standalone automation and no synthetic trap resets.
  processBoundEarthElementalAutomation(elapsed);
}

function getPurchasedTonicSlotCapacity() {
  if (gameState.equipment) return getGearUpgrade(ownedEquipment(gameState.equipment.equipped.belt)?.baseGearId)?.effects?.tonicSlots || 0;
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
