let lastRealTickTime = Date.now();
let gameClockTime = lastRealTickTime;
let devGameSpeedMultiplier = 1;
const DEV_GAME_SPEED_MULTIPLIERS = [1, 5, 10];
let devTierCheckpoint = null;
const DEV_TIER_CHECKPOINTS = [1, 2, 3, 4, 4.5];

const DEV_RESOURCE_BASE_MAX_VALUES = {
  energy: 10,
  mana: 10,
  focus: 3,
  ward: 10,
  manaCrystal: 100,
  water: 100,
  food: 100,
  wood: 100,
  fuel: 2000,
  imbuedWood: 500,
  fiber: 100,
  trap: 5,
  pelt: 100,
  stone: 100,
  leather: 100,
  ore: 100,
  iron: 100,
  steel: 100,
  ironRing: 20,
  earthElementalCore: 100,
  runedLeather: 100,
  naturalEssence: 100,
  nails: 100,
  herb: 100,
  glimmerleaf: 50,
  staminaTonic: 20,
  improvedStaminaTonic: 20,
  manaTonic: 20,
  majorManaTonic: 20,
  huntingLure: 10,
  staminaTonicBase: 20,
  manaTonicBase: 20,
  concentratedTonicBase: 20,
  concentratedManaTonicBase: 20,
  chargedCrystal: 100,
  crudeIronPickHead: 1,
  ironKnifeBlade: 1,
  ironAxeHead: 1,
};

const DEV_TIER_FLAGS = [
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
  "brokenWardenDefeated",
  "wardenCoreRecovered",
  "tierFourCompleted",
  "tierFiveUnlocked",
];

const DEV_OUTSKIRTS_LOCATIONS = ["mysteriousPlants", "strangeTrails", "creepyCave", "mysteriousTrail"];
const DEV_REGIONAL_LOCATIONS = [
  "stagRuns",
  "huntersCabin",
  "quietGrove",
  "foothillScree",
  "minersCamp",
  "ironMine",
  "wildHerbPatch",
  "alchemistsHut",
  "overgrownFields",
  "roadsideRuin",
  "silentGearworks",
  "arcaneArchive",
];
const DEV_REGIONS = ["north", "east", "south", "west"];

const DEV_T3_RESEARCH = [
  "cordage",
  "simpleTraps",
  "hideworking",
  "crudeBackpack",
  "smellyShoes",
  "scratchyClothes",
  "uncomfortableCot",
  "stoneTools",
  "ruinedTorch",
  "salvagedSheltercraft",
  "meditation",
  "manaCycling",
];
const DEV_T4_RESEARCH = [
  "leatherworking",
  "smelting",
  "crudeIronPick",
  "ironTools",
  "sturdyConstruction",
  "automationPrinciples",
  "alchemy",
  "manaTonics",
  "alchemyBelt2",
  "alchemyBelt3",
  "campTanning",
  "campSmelting",
  "campAlchemy",
  "ancientManaCondenser",
];

const DEV_T3_CAMP_UPGRADES = [
  "workbench",
  "smallFire",
  "crudeLeanTo",
  "lessCrudeShelter",
  "framedShelter",
  "uncomfortableCot",
  "stoneFirePit",
  "researchSpot",
  "meditationSpot",
];
const DEV_T4_CAMP_UPGRADES = [
  "smallFire",
  "crudeLeanTo",
  "lessCrudeShelter",
  "framedShelter",
  "smallHut",
  "uncomfortableCot",
  "warmCot",
  "stoneFirePit",
  "researchSpot",
  "researchBench",
  "meditationSpot",
  "lumberMill",
  "foragingLure",
  "campTannery",
  "campSmelterFoundation",
  "campSmelter",
  "campAlchemyStation",
  "manaCondenserFrame",
  "manaCondenser",
];

const DEV_T3_GEAR_UPGRADES = [
  "crudeSatchel",
  "scratchyShirt",
  "scratchyPants",
  "foragingBasket",
  "waterskin",
  "crudeBackpack",
  "smellyShoes",
  "stoneKnife",
  "stoneAxe",
  "patchedLeatherBackpack",
  "torch",
];
const DEV_T4_GEAR_UPGRADES = [
  "crudeSatchel",
  "scratchyShirt",
  "scratchyPants",
  "foragingBasket",
  "waterskin",
  "crudeBackpack",
  "smellyShoes",
  "stoneKnife",
  "stoneAxe",
  "patchedLeatherBackpack",
  "torch",
  "leatherShirt",
  "leatherPants",
  "reinforcedWaterskin",
  "travelBoots",
  "repairedLeatherBackpack",
  "ironKnife",
  "ironAxe",
  "crudeIronPick",
  "simpleTonicBelt",
  "tonicBelt",
  "reinforcedTonicBelt",
];

const DEV_T3_RESOURCE_CRAFTS = ["trap"];
const DEV_T4_RESOURCE_CRAFTS = ["trap", "leather", "iron", "staminaTonic", "manaTonicBase"];

const DEV_TIER_RESOURCE_NAMES = {
  1: ["energy", "focus", "water", "food", "wood"],
  2: ["energy", "focus", "water", "food", "wood", "fuel"],
  3: ["energy", "focus", "mana", "manaCrystal", "water", "food", "wood", "fuel", "fiber", "trap", "pelt", "stone"],
  4: [
    "energy",
    "focus",
    "mana",
    "manaCrystal",
    "water",
    "food",
    "wood",
    "fuel",
    "imbuedWood",
    "fiber",
    "trap",
    "pelt",
    "stone",
    "leather",
    "ore",
    "iron",
    "ironRing",
    "nails",
    "runedLeather",
    "naturalEssence",
    "herb",
    "glimmerleaf",
    "staminaTonic",
    "improvedStaminaTonic",
    "manaTonic",
    "majorManaTonic",
    "huntingLure",
    "staminaTonicBase",
    "manaTonicBase",
    "concentratedTonicBase",
    "concentratedManaTonicBase",
    "chargedCrystal",
    "crudeIronPickHead",
    "ironKnifeBlade",
    "ironAxeHead",
  ],
};

window.onload = function () {
  hookDomToUI();
  enhanceGameShell();
  hookUIMaps();
  hookActionCompletions();
  ensureSkillsState();
  ensureProjectsState();
  ensureElementalState();
  recalculateCharacterStats();
  recalculateCampEffects();
  recalculateToolEffects();

  ui.campEstablishedContinueBtn.addEventListener("click", function () {
    ui.campEstablishedPopup.style.display = "none";
  });

  ui.outskirtsCompleteContinueBtn.addEventListener("click", function () {
    ui.outskirtsCompletePopup.style.display = "none";
  });

  ui.recallAwakenedContinueBtn.addEventListener("click", function () {
    ui.recallAwakenedPopup.style.display = "none";
  });

  ui.torchSparkContinueBtn.addEventListener("click", function () {
    ui.torchSparkPopup.style.display = "none";
  });

  ui.manaAwakenedContinueBtn.addEventListener("click", function () {
    ui.manaAwakenedPopup.style.display = "none";
  });

  ui.campFoundationContinueBtn.addEventListener("click", function () {
    ui.campFoundationPopup.style.display = "none";
  });

  ui.personalWardContinueBtn.addEventListener("click", function () {
    ui.personalWardPopup.style.display = "none";
    gameState.personalWardPopupShown = true;
    trySaveGame();
  });

  if (ui.northernDisturbanceContinueBtn) {
    ui.northernDisturbanceContinueBtn.addEventListener("click", function () {
      hideElement(ui.northernDisturbancePopup);
    });
  }

  if (ui.advancedRecallCloseBtn) {
    ui.advancedRecallCloseBtn.addEventListener("click", function () {
      hideAdvancedRecallPopup();
    });
  }

  hookStatsToUI();
  updateCurrentGoalUI();
  updateJournalUI();
  updateRegionalMapVisibility();
  updateAllResources();
  hookActionButtonsToUI(runAction);
  hookCampUpgradestoUI();
  hookGearUpgradesToUI();
  hookResourceCraftsToUI();
  hookSaveControls();
  hookDevSpeedControls();
  hookDevTierControls();
  hookCombatUI();
  hookWorkTabs();
  if (typeof hookHomeUI === "function") hookHomeUI();
  hookMainViewTabs();
  hookJournalViewTabs();

  ui.continueBtn.addEventListener("click", function () {
    ui.introPopup.style.display = "none";
  });

  ui.restBtn.addEventListener("click", function () {
    if (isActivityActive() && gameState.activity.kind === "rest") {
      stopResting();
    } else {
      startResting();
    }
  });

  tryLoadGame();
  if (typeof enableObjectiveAutoExpansion === "function") enableObjectiveAutoExpansion();
  setInterval(trySaveGame, 5000);
  window.addEventListener("beforeunload", trySaveGame);

  setInterval(gameTick, 50);
};

function hookSaveControls() {
  if (ui.saveGameBtn) {
    ui.saveGameBtn.addEventListener("click", function () {
      trySaveGame();
    });
  }

  if (ui.loadGameBtn) {
    ui.loadGameBtn.addEventListener("click", function () {
      tryLoadGame();
    });
  }

  if (ui.resetSaveBtn) {
    ui.resetSaveBtn.addEventListener("click", function () {
      if (!window.confirm("Reset your saved game?")) return;

      resetSave();
    });
  }
}

function hookWorkTabs() {
  if (ui.craftingTabBtn) {
    ui.craftingTabBtn.addEventListener("click", function () {
      showWorkPanel("crafting");
    });
  }

  if (ui.researchTabBtn) {
    ui.researchTabBtn.addEventListener("click", function () {
      showWorkPanel("research", { userSelected: true });
    });
  }

  if (ui.automationTabBtn) {
    ui.automationTabBtn.addEventListener("click", function () {
      showWorkPanel("automation", { userSelected: true });
    });
  }

}

function hookDevSpeedControls() {
  if (!Array.isArray(ui.devSpeedButtons)) return;

  ui.devSpeedButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      setDevGameSpeedMultiplier(Number(button.dataset.speed));
    });
  });

  updateDevSpeedControls();
}

function setDevGameSpeedMultiplier(multiplier) {
  if (!DEV_GAME_SPEED_MULTIPLIERS.includes(multiplier)) return;

  advanceGameClock(Date.now());
  devGameSpeedMultiplier = multiplier;
  updateDevSpeedControls();
}

function resetDevGameSpeedMultiplier() {
  const now = Date.now();

  lastRealTickTime = now;
  gameClockTime = now;
  devGameSpeedMultiplier = 1;
  updateDevSpeedControls();
}

function getDevGameSpeedMultiplier() {
  return devGameSpeedMultiplier;
}

function getGameTime() {
  return gameClockTime;
}

function advanceGameClock(now) {
  const realDeltaSeconds = Math.max(0, (now - lastRealTickTime) / 1000);
  const deltaSeconds = realDeltaSeconds * getDevGameSpeedMultiplier();

  lastRealTickTime = now;
  gameClockTime += deltaSeconds * 1000;

  return deltaSeconds;
}

function updateDevSpeedControls() {
  if (!Array.isArray(ui.devSpeedButtons)) return;

  ui.devSpeedButtons.forEach(function (button) {
    const speed = Number(button.dataset.speed);
    button.classList.toggle("active", speed === devGameSpeedMultiplier);
  });
}

function hookDevTierControls() {
  if (!Array.isArray(ui.devTierButtons)) return;

  ui.devTierButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      jumpToDevTier(Number(button.dataset.tier));
    });
  });

  updateDevTierControls();
}

function updateDevTierControls() {
  if (!Array.isArray(ui.devTierButtons)) return;

  ui.devTierButtons.forEach(function (button) {
    const tier = Number(button.dataset.tier);
    button.classList.toggle("active", tier === devTierCheckpoint);
  });
}

function jumpToDevTier(tier) {
  if (!DEV_TIER_CHECKPOINTS.includes(tier)) return false;

  resetDevTierBaseline();
  applyDevTier1();

  if (tier >= 2) applyDevTier2();
  if (tier >= 3) applyDevTier3();
  if (tier >= 4) applyDevTier4();
  if (tier >= 4.5) applyDevTier45();

  finalizeDevTierJump(tier);
  return true;
}

function resetDevTierBaseline() {
  resetDevTierActivityState();
  resetDevTierProgressFlags();
  resetDevTierResources();
  resetDevTierActions();
  resetDevTierResearch();
  resetDevTierBuildables();
  resetDevTierLocations();
  resetDevTierDungeons();
  resetDevTierWorld();
  resetDevTierMagic();
  resetDevTierProjectState();
  resetDevTierTowerNodes();

  gameState.phase = "lost";
  gameState.destination = null;
  gameState.hasCamp = false;
  gameState.selectedResearchEntry = null;
  gameState.currentGoalId = "surviveTheWoods";
  gameState.journal.entries = [];
  gameState.exploration.currentStage = "findClearing";
  gameState.exploration.count = 0;
}

function resetDevTierActivityState() {
  if (typeof resetCombatEncounter === "function") {
    resetCombatEncounter();
  }

  if (typeof stopAutoAction === "function") {
    stopAutoAction();
  } else if (gameState.autoAction) {
    gameState.autoAction.actionName = null;
    gameState.autoAction.pausedForRest = false;
  }

  resetActivity();

  const actionDefinitions = getActionDefinitions();

  for (let actionName in actionDefinitions) {
    const action = actionDefinitions[actionName];
    action.running = false;

    if (action.progressBar) {
      action.progressBar.style.width = "0%";
    }

    if (action.metaProgressBar) {
      action.metaProgressBar.style.width = "0%";
    }
  }

  gameState.expedition.active = false;
  gameState.expedition.discoveredSomething = false;
  gameState.expedition.completed = false;
  gameState.expedition.currentLocation = null;
  gameState.expedition.regionId = "outskirts";
  gameState.expedition.routeType = "open";
  gameState.expedition.distance = 0;
  gameState.expedition.targetDistance = 100;
  gameState.expedition.destination = null;
  gameState.expedition.tonicSlots = [];
  gameState.expedition.locationSpellEffects = {};
  gameState.expedition.dungeon = {
    active: false,
    dungeonId: null,
    nodeId: null,
  };
  gameState.expedition.carriedItems = {};
  gameState.expedition.carryCapacity = 5;
  gameState.expedition.water = 0;
  gameState.expedition.waterCapacity = 0;
}

function resetDevTierProgressFlags() {
  DEV_TIER_FLAGS.forEach(function (flagName) {
    gameState[flagName] = false;
  });

  gameState.northernDisturbance = {
    triggered: false,
    resolved: false,
    popupShown: false,
  };

  gameState.regionalProgress = {
    unlocked: false,
    east: { disturbanceTriggered: false, disturbanceResolved: false, capabilityDiscovered: false },
    south: { disturbanceTriggered: false, disturbanceResolved: false, capabilityDiscovered: false },
  };

  gameState.elementals = {
    earth: getDefaultBoundEarthElementalState(),
  };
}

function resetDevTierResources() {
  const resourceDefinitions = getResourceDefinitions();

  for (let resourceName in resourceDefinitions) {
    const resource = resourceDefinitions[resourceName];
    resource.value = 0;
    resource.perSecond = 0;

    if (Number.isFinite(DEV_RESOURCE_BASE_MAX_VALUES[resourceName])) {
      resource.maxValue = DEV_RESOURCE_BASE_MAX_VALUES[resourceName];
    }

    hideElement(resource.display);

    if (resourceElements[resourceName]) {
      hideElement(resourceElements[resourceName]);
    }

    updateResource(resourceName);
  }
}

function resetDevTierActions() {
  const actionDefinitions = getActionDefinitions();

  for (let actionName in actionDefinitions) {
    const action = actionDefinitions[actionName];
    action.unlocked = actionName === "explore";
  }
}

function resetDevTierResearch() {
  const researchDefinitions = getResearchDefinitions();

  for (let researchName in researchDefinitions) {
    const research = researchDefinitions[researchName];
    research.unlocked = false;
    research.completed = false;
    research.unlockedAt = null;
  }
}

function resetDevTierBuildables() {
  const campUpgradeDefinitions = getCampUpgradeDefinitions();

  for (let upgradeName in campUpgradeDefinitions) {
    campUpgradeDefinitions[upgradeName].unlocked = false;
    campUpgradeDefinitions[upgradeName].purchased = false;
  }

  const gearUpgradeDefinitions = getGearUpgradeDefinitions();

  for (let upgradeName in gearUpgradeDefinitions) {
    gearUpgradeDefinitions[upgradeName].unlocked = false;
    gearUpgradeDefinitions[upgradeName].purchased = false;
  }

  const resourceCraftDefinitions = getResourceCraftDefinitions();

  for (let craftName in resourceCraftDefinitions) {
    resourceCraftDefinitions[craftName].unlocked = false;
  }

  const automationDefinitions = getAutomationDefinitions();

  for (let machineName in automationDefinitions) {
    const machine = automationDefinitions[machineName];
    machine.unlocked = false;
    machine.cycles = 0;
    machine.progress = 0;
  }
}

function resetDevTierLocations() {
  const locationDefinitions = getExpeditionLocationDefinitions();

  for (let locationName in locationDefinitions) {
    const location = locationDefinitions[locationName];
    location.discovered = false;
    location.explored = false;
    location.explorationProgress = 0;

    if (Number.isFinite(location.looseStoneMax)) {
      location.looseStoneRemaining = location.looseStoneMax;
    }

    resetDevTierStorage(location.storage);

    if (location.trapSites && Array.isArray(location.trapSites.sites)) {
      location.trapSites.sites.forEach(function (site) {
        site.discovered = false;
        site.installed = false;
        site.checkedThisVisit = false;
      });
    }

    if (location.hunt) {
      location.hunt.tracked = false;
    }

    resetDevTierExplorableObjects(location.explorableObjects);
  }

  resetDevTierExplorableObjects(clearingPlace.explorableObjects);
}

function resetDevTierStorage(storage) {
  if (!storage) return;

  for (let resourceName in storage) {
    storage[resourceName] = 0;
  }
}

function resetDevTierExplorableObjects(objects) {
  if (!objects) return;

  for (let objectName in objects) {
    const object = objects[objectName];
    object.progress = 0;
    object.spellCharges = {};
  }
}

function resetDevTierDungeons() {
  const dungeonDefinitions = getDungeonDefinitions();

  for (let dungeonId in dungeonDefinitions) {
    const dungeon = dungeonDefinitions[dungeonId];
    if (!dungeon.nodes) continue;

    for (let nodeId in dungeon.nodes) {
      const node = dungeon.nodes[nodeId];
      node.discovered = false;
      node.explored = false;
      node.rewardClaimed = false;
      node.manaSenseCharges = 0;
      node.spellCharges = {};
    }
  }
}

function resetDevTierWorld() {
  gameState.world.selectedRegion = "outskirts";
  gameState.world.territories = {
    home: { label: "Home Territory", revealed: true, accessible: true, visited: true },
    unknownTerritory1: { label: "Unknown Territory", revealed: false, accessible: false, visited: false },
  };

  for (let regionId in gameState.world.regions) {
    const region = gameState.world.regions[regionId];
    region.unlocked = regionId === "outskirts";
    region.progress = regionId === "outskirts" ? 100 : 0;
    region.mastered = regionId === "outskirts";
    region.locations = regionId === "outskirts" ? ["Fibrous Plants", "Animal Trails", "Creepy Cave", "Abandoned Camp"] : [];
  }
}

function resetDevTierMagic() {
  gameState.magic.sensedReveals = {};
  gameState.magic.toolCharges = { knife: 0, axe: 0, pick: 0 };
  gameState.magic.spellProgress = {};
  gameState.magic.ward = {
    rank: 1,
    formed: false,
    maintainEnabled: false,
  };
  gameState.magic.attunements = {
    capacity: 1,
    active: [],
    rank: 1,
    rankTwoLevel: 0,
    rankTwoXp: 0,
    breakthroughs: {},
    persistentResonanceCompleted: false,
    rankTwoComplete: false,
  };
  gameState.magic.imbuement = {
    rank: 1,
    rankTwoLevel: 0,
    rankTwoXp: 0,
    breakthroughs: {},
    permanentBindingCompleted: false,
    rankTwoComplete: false,
    craftedRings: {},
    equippedRing: null,
    backpackImbued: false,
    equipmentEnchantments: {},
    furnaceTier: 0,
    alchemyTier: 0,
    controlMatrixStage: 0,
    controlCapacity: 5,
  };
  gameState.magic.arcaneForce = {
    rank: 1,
    rankTwoLevel: 0,
    rankTwoXp: 0,
    breakthroughs: {},
    forceAmplificationCompleted: false,
    rankTwoComplete: false,
  };

  const spellDefinitions = getSpellDefinitions();

  for (let spellName in spellDefinitions) {
    spellDefinitions[spellName].unlocked = false;
  }
}

function resetDevTierProjectState() {
  ensureProjectsState();
  ensureTowerStructureState();
  gameState.tower.selectedId = "heart";

  const definitions = getProjectDefinitions();

  for (let projectName in definitions) {
    const project = getProjectState(projectName);

    if (!project) continue;

    project.unlocked = false;
    project.completed = false;
    project.level = 0;
    project.work = 0;
    project.deposits = {};
  }
}

function resetDevTierTowerNodes() {
  ensureTowerNodesState();

  const definitions = getTowerNodeDefinitions();

  for (let nodeName in definitions) {
    gameState.towerNodes[nodeName] = getDefaultTowerNodeState(nodeName);
  }
}

function applyDevTier1() {
  gameState.phase = "clearing";
  gameState.discoveredClearing = true;
  gameState.currentGoalId = "buildCamp";

  unlockPanel("camp");
  markClearingObjectComplete("soundOfWater");
  markClearingObjectComplete("berryBush");
  markClearingObjectComplete("deadTree");
  unlockCampUpgradeForDev("smallFire");
  unlockCampUpgradeForDev("crudeLeanTo");
  setCampActionsAvailable(true);
}

function applyDevTier2() {
  purchaseCampUpgradeForDev("smallFire");
  purchaseCampUpgradeForDev("crudeLeanTo");

  gameState.hasCamp = true;
  gameState.phase = "expedition";
  gameState.currentGoalId = "exploreOutskirts";
  gameState.expedition.regionId = "outskirts";
  gameState.expedition.routeType = "open";
  gameState.expedition.targetDistance = 100;

  unlockPanel("expedition");
  unlockAction("beginExpedition");
  unlockAction("recover");
  addJournalEntry("campEstablished");
  setCampActionsAvailable(true);
}

function applyDevTier3() {
  DEV_OUTSKIRTS_LOCATIONS.forEach(markLocationComplete);

  gameState.tier2Complete = true;
  gameState.knownOutskirtsPathsUnlocked = true;
  gameState.oldMapFound = true;
  gameState.tier3Unlocked = true;
  gameState.magicUnlocked = true;
  gameState.currentGoalId = "chooseRegion";

  DEV_REGIONS.forEach(function (regionId) {
    setRegionUnlockedForDev(regionId);
  });

  unlockSpellForDev("manaSense");
  setResourceVisibleAndFull("mana");
  setResourceVisibleAndFull("manaCrystal");

  DEV_T3_RESEARCH.forEach(completeResearchForDev);
  DEV_T3_CAMP_UPGRADES.forEach(purchaseCampUpgradeForDev);
  DEV_T3_GEAR_UPGRADES.forEach(purchaseGearUpgradeForDev);
  DEV_T3_RESOURCE_CRAFTS.forEach(unlockResourceCraftForDev);

  addJournalEntry("outskirtsMastered");
  addJournalEntry("oldMapFound");
  addJournalEntry("manaAwakened");
}

function applyDevTier4() {
  DEV_REGIONAL_LOCATIONS.forEach(markLocationComplete);
  DEV_REGIONS.forEach(markRegionMasteredForDev);

  markDungeonCompleteForDev("roadsideRuinDepths");
  markDungeonCompleteForDev("silentGearworksDepths");
  markDungeonCompleteForDev("arcaneArchiveDepths");

  gameState.archiveDoorOpened = true;
  gameState.campAlchemyPlansFound = true;
  gameState.campTanningPlansFound = true;
  gameState.campSmeltingPlansFound = true;
  gameState.manaCondenserPlansFound = true;
  gameState.partialTowerPlansFound = true;
  gameState.manaCrystalImbuingUnlocked = true;

  unlockSpellForDev("attunement");
  unlockSpellForDev("arcaneForce");
  unlockSpellForDev("imbue");
  unlockPersonalWard(false);

  DEV_T4_RESEARCH.forEach(completeResearchForDev);
  DEV_T4_CAMP_UPGRADES.forEach(purchaseCampUpgradeForDev);
  DEV_T4_GEAR_UPGRADES.forEach(purchaseGearUpgradeForDev);
  DEV_T4_RESOURCE_CRAFTS.forEach(unlockResourceCraftForDev);
  maxRankOneSkillsForDev();
  maxSpellProgressForDev();
  unlockOnlyResearchForDev("towerFoundations");

  resetDevTierProjectState();

  gameState.currentGoalId = "chooseRegion";
  addJournalEntry("arcaneArchiveOpened");
  addJournalEntry("campAlchemyPlansFound");
  addJournalEntry("campTanningPlansFound");
  addJournalEntry("campSmeltingPlansFound");
  addJournalEntry("manaCondenserPlansFound");
  addJournalEntry("partialTowerPlansFound");
}

// T4 remains the handoff point into Tower construction. T4.5 is intentionally
// definition-driven: it represents a completed save containing every feature
// that exists in the current build, including content added after T4.
function applyDevTier45() {
  for (let locationName in getExpeditionLocationDefinitions()) {
    markLocationComplete(locationName);
  }

  for (let dungeonId in getDungeonDefinitions()) {
    markDungeonCompleteForDev(dungeonId);
  }

  for (let regionId in gameState.world.regions) {
    markRegionMasteredForDev(regionId);
  }

  DEV_TIER_FLAGS.forEach(function (flagName) {
    gameState[flagName] = true;
  });

  gameState.hasCamp = true;
  gameState.phase = "expedition";
  gameState.combatVictories = Math.max(1, Number(gameState.combatVictories) || 0);
  gameState.northernDisturbance = { triggered: true, resolved: true, popupShown: true };
  gameState.regionalProgress = {
    unlocked: true,
    east: { disturbanceTriggered: true, disturbanceResolved: true, capabilityDiscovered: true },
    south: { disturbanceTriggered: true, disturbanceResolved: true, capabilityDiscovered: true },
  };

  for (let researchName in getResearchDefinitions()) {
    completeResearchForDev(researchName);
  }

  for (let upgradeName in getCampUpgradeDefinitions()) {
    purchaseCampUpgradeForDev(upgradeName);
  }

  for (let upgradeName in getGearUpgradeDefinitions()) {
    purchaseGearUpgradeForDev(upgradeName);
  }

  for (let craftName in getResourceCraftDefinitions()) {
    unlockResourceCraftForDev(craftName);
  }

  for (let machineName in getAutomationDefinitions()) {
    unlockAutomationForDev(machineName);
  }

  for (let actionName in getActionDefinitions()) {
    unlockAction(actionName);
  }

  for (let spellName in getSpellDefinitions()) {
    unlockSpellForDev(spellName);
  }

  completeAllProjectsForDev();
  completeTierFourFinale(false);
  completeAllTowerNodesForDev();
  maxAllSkillsForDev();
  maxAllSpellProgressForDev();
  completeAllPermanentImbuementsForDev();
  maxBoundElementalInventoryForDev();

  for (let journalName in getJournalDefinitions()) {
    addJournalEntry(journalName);
  }

  gameState.currentGoalId = "travelToFirstExternalTerritory";
}

function completeAllProjectsForDev() {
  ensureProjectsState();

  const definitions = getProjectDefinitions();

  for (let projectName in definitions) {
    const definition = definitions[projectName];
    const project = getProjectState(projectName);

    project.unlocked = true;
    project.completed = true;
    project.level = Array.isArray(definition.levels) ? definition.levels.length : 0;
    project.work = 0;
    project.deposits = {};
  }

  gameState.towerConstructionUnlocked = true;
  gameState.towerBasementCompleted = true;
  applyBasementStorageUpgrade();
  syncTowerStructureUnlocks(false);
}

function completeAllTowerNodesForDev() {
  ensureTowerNodesState();

  const definitions = getTowerNodeDefinitions();

  for (let nodeName in definitions) {
    const definition = definitions[nodeName];
    const state = getTowerNodeState(nodeName);

    state.activated = true;
    state.researchUnlocked = true;
    state.built = true;
    state.deposits = { ...(definition.materials || {}) };
    state.imbueProgress = definition.imbueRequired || 0;
    state.threadSenseProgress = definition.threadSenseRequired || 0;
    state.threadSensed = true;
    state.advancedRecallUnlocked = true;
    state.permanentImbued = true;
  }
}

function maxAllSkillsForDev() {
  ensureSkillsState();

  const definitions = getSkillDefinitions();

  for (let skillName in definitions) {
    const ranks = Array.isArray(definitions[skillName].ranks) ? definitions[skillName].ranks : [];
    const highestRank = ranks.reduce(function (highest, rankDefinition) {
      return !highest || rankDefinition.rank > highest.rank ? rankDefinition : highest;
    }, null);

    if (!highestRank || !Array.isArray(highestRank.levels) || !highestRank.levels.length) continue;

    const highestLevel = highestRank.levels.reduce(function (highest, levelDefinition) {
      return !highest || levelDefinition.level > highest.level ? levelDefinition : highest;
    }, null);
    const skill = getSkillState(skillName);

    skill.rank = highestRank.rank;
    skill.level = highestLevel.level;
    skill.revealed = true;

    if (skillName === "conditioning") {
      skill.distance = getSkillThresholdForLevel(skillName, getSkillMaxLevel(skillName, 1), 1);
      skill.reinforcedEnergyUnlockSpent = CONDITIONING_RANK_TWO_UNLOCK_ENERGY;
      skill.reinforcedEnergySpent = highestLevel.threshold || 0;
      skill.pending = false;
    } else if (skillName === "meditation") {
      skill.successfulMeditations = getSkillThresholdForLevel(skillName, getSkillMaxLevel(skillName, 1), 1);
      skill.attunedMeditations = highestLevel.threshold || 0;
    } else {
      setSkillProgressForDev(skillName, highestLevel.threshold || 0);
    }
  }
}

function maxAllSpellProgressForDev() {
  maxSpellProgressForDev();

  const attunements = getAttunementState();
  const attunementMaximum = ATTUNEMENT_RANK_TWO_PROGRESSION[ATTUNEMENT_RANK_TWO_PROGRESSION.length - 1];
  attunements.rank = 2;
  attunements.rankTwoLevel = attunementMaximum.level;
  attunements.rankTwoXp = attunementMaximum.threshold;
  attunements.breakthroughs = {
    persistentResonance: ATTUNEMENT_BREAKTHROUGH_DEFINITIONS.persistentResonance.requiredMana,
    harmonicStability: ATTUNEMENT_BREAKTHROUGH_DEFINITIONS.harmonicStability.requiredMana,
    harmonicAttunement: ATTUNEMENT_BREAKTHROUGH_DEFINITIONS.harmonicAttunement.requiredMana,
  };
  attunements.persistentResonanceCompleted = true;
  attunements.rankTwoComplete = true;
  attunements.capacity = getAttunementCapacityFromLevel();
  attunements.active = Object.keys(getAttunementDefinitions())
    .slice(0, attunements.capacity)
    .map(function (id) { return { id }; });

  const imbuement = ensureImbueRankTwoState();
  const imbueProgression = getImbueRankTwoConfig().progression;
  const imbueMaximum = imbueProgression[imbueProgression.length - 1];
  imbuement.rank = 2;
  imbuement.rankTwoLevel = imbueMaximum.level;
  imbuement.rankTwoXp = imbueMaximum.threshold;
  imbuement.breakthroughs.permanentBinding = getImbueRankTwoConfig().permanentBindingManaRequired;
  imbuement.permanentBindingCompleted = true;
  imbuement.rankTwoComplete = true;

  const arcaneForce = ensureArcaneForceRankTwoState();
  const forceProgression = ARCANE_FORCE_RANK_TWO_CONFIG.progression;
  const forceMaximum = forceProgression[forceProgression.length - 1];
  arcaneForce.rank = 2;
  arcaneForce.rankTwoLevel = forceMaximum.level;
  arcaneForce.rankTwoXp = forceMaximum.threshold;
  arcaneForce.breakthroughs.forceAmplification = ARCANE_FORCE_RANK_TWO_CONFIG.breakthroughManaRequired;
  arcaneForce.forceAmplificationCompleted = true;
  arcaneForce.rankTwoComplete = true;

  gameState.magic.ward.rank = 1;
  gameState.magic.ward.formed = true;
  gameState.magic.ward.maintainEnabled = true;

  const maxToolCharges = getImbueToolMaxCharges();
  gameState.magic.toolCharges = { knife: maxToolCharges, axe: maxToolCharges, pick: maxToolCharges };
  syncSpellUpgradeEffects();
}

function completeAllPermanentImbuementsForDev() {
  const state = ensureImbueRankTwoState();
  const config = getImbueRankTwoConfig();
  const collection = normalizeEquipmentCollection(ensureEquipmentCollection());

  Object.keys(config.rings).forEach(function (ringId) {
    state.craftedRings[ringId] = true;
  });
  state.equippedRing = Object.keys(config.rings)[Object.keys(config.rings).length - 1] || null;
  state.backpackImbued = true;
  state.furnaceTier = 2;
  state.alchemyTier = 2;
  state.controlMatrixStage = Object.keys(config.controlMatrix).length;
  state.controlCapacity = config.controlMatrix[state.controlMatrixStage].capacity;

  Object.keys(config.equipmentEnchantments).forEach(function (enchantmentId) {
    const enchantment = config.equipmentEnchantments[enchantmentId];
    const item = getPurchasedEquipmentForSlot("gear", enchantment.slot, false);
    const gearId = item ? getGearUpgradeIdByDefinition(item) : null;
    if (gearId) state.equipmentEnchantments[gearId] = enchantmentId;
  });

  const highestWearableBySlot = {};
  Object.entries(getGearUpgradeDefinitions()).forEach(function ([id, gear]) {
    if (!isWearableGear(id) || !gear.purchased) return;
    const current = highestWearableBySlot[gear.slot];
    if (!current || (gear.slotRank || 0) > (getGearUpgrade(current)?.slotRank || 0)) highestWearableBySlot[gear.slot] = id;
  });
  Object.entries(highestWearableBySlot).forEach(function ([slot, baseGearId]) {
    let item = collection.items.find(entry => !entry.core && equipmentSlot(entry) === slot);
    if (!item) {
      item = { id: "gear-" + collection.nextId++, baseGearId, family: null, grade: "standard" };
      collection.items.push(item);
    }
    item.baseGearId = baseGearId;
    item.family = Object.keys(ENCHANTMENTS).find(id => ENCHANTMENTS[id].slot === slot) || item.family;
    item.grade = ENCHANTMENTS[item.family]?.greater ? "greater" : "standard";
    collection.equipped[slot] = item.id;
  });
  const runeIds = Object.keys(RING_RUNES);
  ["mana", "warding"].forEach(function (core, coreIndex) {
    while (collection.items.filter(item => item.core === core).length < 2) {
      const index = collection.items.filter(item => item.core).length;
      const item = { id: "gear-" + collection.nextId++, core, grade: "greater", rune: runeIds[(coreIndex * 2 + index) % runeIds.length] || null };
      collection.items.push(item);
      autoEquipCompletedEquipment(item);
    }
  });
  normalizeEquipmentCollection(collection);
  syncGearOwnershipFlags();
}

function maxBoundElementalInventoryForDev() {
  ensureElementalState();

  const elemental = getBoundEarthElementalState();
  const capacity = getTowerHeartElementalControlCapacity();

  elemental.owned = capacity;
  elemental.bindingDiscovered = true;
  elemental.capabilities.equipmentUnlocked = true;
  elemental.capabilities.attunementUnlocked = true;

  Object.keys(getElementalHarnessDefinitions()).forEach(function (harnessName) {
    elemental.capabilities.harnesses[harnessName] = capacity;
  });
  Object.keys(getElementalWorkerAttunementDefinitions()).forEach(function (attunementName) {
    elemental.capabilities.attunements[attunementName] = capacity;
  });
}

function markClearingObjectComplete(objectName) {
  markExplorableObjectComplete(clearingPlace.explorableObjects[objectName]);
}

function markLocationComplete(locationName) {
  const location = getExpeditionLocation(locationName);

  if (!location) return;

  location.discovered = true;
  location.explored = true;
  location.explorationProgress = location.explorationRequired || location.explorationProgress || 0;

  if (Number.isFinite(location.looseStoneMax)) {
    location.looseStoneRemaining = location.looseStoneMax;
  }

  if (location.unlocks) {
    applyDevUnlocks(location.unlocks);
  }

  if (location.trapSites && Array.isArray(location.trapSites.sites)) {
    location.trapSites.sites.forEach(function (site) {
      site.discovered = true;
      site.installed = true;
      site.checkedThisVisit = false;
    });
  }

  if (location.hunt) {
    location.hunt.tracked = true;
  }

  if (location.explorableObjects) {
    for (let objectName in location.explorableObjects) {
      markExplorableObjectComplete(location.explorableObjects[objectName]);
    }
  }
}

function markExplorableObjectComplete(object) {
  if (!object) return;

  const stages = Array.isArray(object.stages) ? object.stages : [];
  object.progress = stages.length;

  if (object.flag) {
    gameState[object.flag] = true;
  }

  stages.forEach(function (stage) {
    if (stage.unlocks) {
      applyDevUnlocks(stage.unlocks);
    }
  });

  if (object.spellCharges) {
    object.spellCharges = {};
  }

  if (typeof object.onComplete === "function") {
    object.onComplete();
  }
}

function markDungeonCompleteForDev(dungeonId) {
  const dungeon = getDungeon(dungeonId);

  if (!dungeon || !dungeon.nodes) return;

  for (let nodeId in dungeon.nodes) {
    const node = dungeon.nodes[nodeId];
    node.discovered = true;
    node.explored = true;
    node.rewardClaimed = true;
    node.manaSenseCharges = 0;
    node.spellCharges = {};
    applyRewardUnlocksForDev(node.search && node.search.reward);
    applyRewardUnlocksForDev(node.reward);
  }
}

function applyRewardUnlocksForDev(reward) {
  if (!reward || !reward.unlocks) return;

  applyDevUnlocks(reward.unlocks);
}

function applyDevUnlocks(unlocks) {
  if (!Array.isArray(unlocks)) return;

  unlocks.forEach(applyDevUnlock);
}

function applyDevUnlock(unlock) {
  if (!unlock || !unlock.type || !unlock.id) return;

  if (unlock.type === "resource") {
    unlockResource(unlock.id);
    return;
  }

  if (unlock.type === "action") {
    unlockAction(unlock.id);
    return;
  }

  if (unlock.type === "campUpgrade") {
    unlockCampUpgradeForDev(unlock.id);
    return;
  }

  if (unlock.type === "panel") {
    unlockPanel(unlock.id);
    return;
  }

  if (unlock.type === "gearUpgrade") {
    unlockGearUpgradeForDev(unlock.id);
    return;
  }

  if (unlock.type === "location") {
    const location = getExpeditionLocation(unlock.id);
    if (location) location.discovered = true;
    return;
  }

  if (unlock.type === "resourceCraft") {
    unlockResourceCraftForDev(unlock.id);
    return;
  }

  if (unlock.type === "flag") {
    gameState[unlock.id] = true;
    return;
  }

  if (unlock.type === "research") {
    unlockOnlyResearchForDev(unlock.id);
    return;
  }

  if (unlock.type === "journal") {
    addJournalEntry(unlock.id);
    return;
  }

  if (unlock.type === "region") {
    setRegionUnlockedForDev(unlock.id);
    return;
  }

  if (unlock.type === "goal") {
    setCurrentGoal(unlock.id);
    return;
  }

  if (unlock.type === "spell") {
    unlockSpellForDev(unlock.id);
    return;
  }

  if (unlock.type === "automation") {
    unlockAutomationForDev(unlock.id);
    return;
  }

  if (unlock.type === "project") {
    const project = getProjectState(unlock.id);
    if (project) project.unlocked = true;
    return;
  }

  if (unlock.type === "towerNode") {
    const node = getTowerNodeState(unlock.id);
    if (node) node.researchUnlocked = true;
  }
}

function completeResearchForDev(researchName) {
  const research = getResearch(researchName);

  if (!research) return;

  research.completed = true;
  research.unlocked = false;
  research.unlockedAt = null;
  applyDevUnlocks(research.unlocks);

  if (researchName === "manaCycling") {
    unlockResearchSystem("manaCycling");
  }
}

function unlockOnlyResearchForDev(researchName) {
  const research = getResearch(researchName);

  if (!research || research.completed) return;

  research.unlocked = true;
  research.unlockedAt = Date.now();
}

function unlockCampUpgradeForDev(upgradeName) {
  const upgrade = getCampUpgrade(upgradeName);

  if (!upgrade || upgrade.purchased) return;

  upgrade.unlocked = true;
}

function purchaseCampUpgradeForDev(upgradeName) {
  const upgrade = getCampUpgrade(upgradeName);

  if (!upgrade) return;
  if (upgrade.purchased) return;

  upgrade.unlocked = false;
  upgrade.purchased = true;

  if (typeof upgrade.onComplete === "function") {
    upgrade.onComplete();
  }
}

function unlockGearUpgradeForDev(upgradeName) {
  const upgrade = getGearUpgrade(upgradeName);

  if (!upgrade || upgrade.purchased) return;

  upgrade.unlocked = true;
}

function purchaseGearUpgradeForDev(upgradeName) {
  const upgrade = getGearUpgrade(upgradeName);

  if (!upgrade) return;
  if (upgrade.purchased) return;

  upgrade.unlocked = false;
  upgrade.purchased = true;

  if (typeof upgrade.onComplete === "function") {
    upgrade.onComplete();
  }
}

function unlockResourceCraftForDev(craftName) {
  const craft = getResourceCraft(craftName);

  if (!craft) return;

  craft.unlocked = true;
}

function unlockAutomationForDev(machineName) {
  const machine = getAutomation(machineName);

  if (!machine) return;

  machine.unlocked = true;
}

function unlockSpellForDev(spellName) {
  const spell = getSpell(spellName);

  if (!spell) return;

  spell.unlocked = true;
}

function maxRankOneSkillsForDev() {
  ensureSkillsState();

  const skillDefinitions = getSkillDefinitions();

  for (let skillName in skillDefinitions) {
    const skill = getSkillState(skillName);
    const rank = typeof DEFAULT_SKILL_RANK === "number" ? DEFAULT_SKILL_RANK : 1;
    const levels = getSkillLevelDefinitions(skillName, rank);

    if (!skill || !levels.length) continue;

    const maxLevelDefinition = levels.reduce(function (highest, levelDefinition) {
      return !highest || levelDefinition.level > highest.level ? levelDefinition : highest;
    }, null);

    if (!maxLevelDefinition) continue;

    skill.rank = rank;
    skill.level = maxLevelDefinition.level;
    skill.revealed = skillName !== "manaControl" || isManaControlSystemEnabled();

    setSkillProgressForDev(skillName, maxLevelDefinition.threshold || 0);
  }

  const conditioning = getSkillState("conditioning");

  if (conditioning) {
    conditioning.pending = false;
  }
}

function setSkillProgressForDev(skillName, progress) {
  const skill = getSkillState(skillName);

  if (!skill) return;

  if (skillName === "conditioning") {
    skill.distance = progress;
    skill.reinforcedEnergyUnlockSpent = 0;
    skill.reinforcedEnergySpent = 0;
  } else if (skillName === "concentration") {
    skill.deepThought = progress;
  } else if (skillName === "manaCycling") {
    skill.manaXp = progress;
    skill.breakthroughReady = false;
    skill.successfulCycles = 0;
    skill.deepCycles = 0;
  } else if (skillName === "meditation") {
    skill.successfulMeditations = progress;
    skill.attunedMeditations = 0;
  } else if (skillName === "manaControl") {
    skill.manaSpent = progress;
  }
}

function maxSpellProgressForDev() {
  if (!gameState.magic.spellProgress) {
    gameState.magic.spellProgress = {};
  }

  const spellDefinitions = getSpellDefinitions();

  for (let spellName in spellDefinitions) {
    const progressDefinition = getSpellProgressDefinition(spellName);

    if (!progressDefinition) continue;

    const progress = getSpellProgressState(spellName);
    const maxLevel = progressDefinition.maxLevel || 0;
    const thresholds = Array.isArray(progressDefinition.thresholds) ? progressDefinition.thresholds : [];
    const thresholdIndex = Math.min(Math.max(maxLevel - 1, 0), Math.max(thresholds.length - 1, 0));

    progress.level = maxLevel;
    progress.xp = thresholds.length ? thresholds[thresholdIndex] : 0;
  }

  syncSpellUpgradeEffects();
}

function setRegionUnlockedForDev(regionId) {
  const region = gameState.world.regions[regionId];

  if (!region) return;

  region.unlocked = true;
  region.progress = 0;
  region.mastered = false;
  region.locations = [];
}

function markRegionMasteredForDev(regionId) {
  const region = gameState.world.regions[regionId];
  const definition = getRegionDefinition(regionId);

  if (!region || !definition) return;

  region.unlocked = true;
  region.progress = definition.maxProgress || 100;
  region.mastered = true;
  region.locations = getRegionLocationLabelsForDev(regionId);
}

function getRegionLocationLabelsForDev(regionId) {
  const labels = [];
  const locationDefinitions = getExpeditionLocationDefinitions();

  for (let locationName in locationDefinitions) {
    const location = locationDefinitions[locationName];

    if (location.region !== regionId) continue;

    labels.push(location.exploredLabel || location.label || locationName);
  }

  return labels;
}

function setResourceVisibleAndFull(resourceName) {
  const resource = getResource(resourceName);

  if (!resource) return;

  unlockResource(resourceName);
  showElement(resource.display, "block");
  resource.value = resource.maxValue;
  updateResource(resourceName);
}

function fillDevTierResources(tier) {
  const resourceNames = tier === 4.5 ? Object.keys(getResourceDefinitions()) : DEV_TIER_RESOURCE_NAMES[tier] || [];

  resourceNames.forEach(setResourceVisibleAndFull);

  gameState.expedition.water = gameState.expedition.waterCapacity;
  refreshExpeditionUI();
}

function finalizeDevTierJump(tier) {
  const devSave = createSaveData();
  delete devSave.gameState.equipment;
  migrateTowerEquipmentSave(devSave);
  gameState.equipment = devSave.gameState.equipment;
  syncEquippedBaseStats();
  recalculateCharacterStats();
  recalculateCampEffects();
  recalculateToolEffects();
  repairExpeditionTonicSlots();
  syncHomeStructureUnlocks();
  fillDevTierResources(tier);
  setCampActionsAvailable(gameState.phase === "clearing" || gameState.phase === "expedition");
  setPackingActionsAvailable(false);
  refreshGameUIAfterLoad();
  fillDevTierResources(tier);
  hideDevTierPopups();
  devTierCheckpoint = tier;
  updateDevTierControls();
  trySaveGame();
}

function hideDevTierPopups() {
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
}

// Rest Button Text Toggle
function updateRestButton() {
  const isResting = isActivityActive() && gameState.activity.kind === "rest";
  const energy = getResource("energy");
  let availability = { state: "ready", reason: "" };

  if (isResting) {
    ui.restBtn.classList.add("running");
    availability = { state: "running", reason: "Resting now" };
  } else {
    ui.restBtn.classList.remove("running");

    if (isActivityActive()) {
      availability = { state: "busy", reason: "Another task is in progress" };
    } else if (!needsExplicitRest()) {
      availability = { state: "wrong-context", reason: "Energy is already full" };
    } else if (typeof canRestAtCurrentPlace === "function" && !canRestAtCurrentPlace()) {
      availability = { state: "wrong-context", reason: "Rest is unavailable here" };
    }
  }

  ui.restBtn.disabled = availability.state !== "ready" && availability.state !== "running";

  if (typeof applyUiActionState === "function") {
    applyUiActionState(ui.restBtn, availability, "rest");
  }
}

// Passive Interval Function - Drives the passive resource updates
function gameTick() {
  const now = Date.now();
  const deltaSeconds = advanceGameClock(now);

  const resourceDefinitions = getResourceDefinitions();

  for (let resourceName in resourceDefinitions) {
    if (resourceName === "mana") continue;
    const amount = resourceDefinitions[resourceName].perSecond * deltaSeconds;

    if (amount !== 0) {
      addResource(resourceName, amount);
    }
  }

  // RETIRED: processAutomation(deltaSeconds); Tower Heart workers replace standalone devices.
  processBoundEarthElementalAutomation(deltaSeconds);
  processActivityTick();
  processCombatTick();
  if (typeof ExpeditionScene !== "undefined") ExpeditionScene.render();
}

function startResting() {
  if (typeof canRestAtCurrentPlace === "function" && !canRestAtCurrentPlace()) return;
  if (!needsExplicitRest()) return;
  if (isActivityActive()) return;

  startActivity({
    kind: "rest",
    id: "rest",
    context: { bedroom: isBedroomRestContext() },
    duration: getRestDuration(),
    interval: true,
  });

  updateRestButton();
  updateAllActionButtons();
  updateCraftingButtons();
  updatePlacePanel();
}

function stopResting() {
  if (isActivityActive() && gameState.activity.kind === "rest") {
    resetActivity();
  }

  const restProgressFill = ui.restBtn.querySelector(".progressFill");

  if (restProgressFill) {
    restProgressFill.style.width = "0%";
  }

  updateRestButton();
  updateAllActionButtons();
  updateCraftingButtons();
  updatePlacePanel();
}
