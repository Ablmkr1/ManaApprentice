const unlockHandlers = {
  resource: function (id) {
    unlockResource(id);
  },
  action: function (id) {
    unlockAction(id);
  },
  campUpgrade: function (id) {
    unlockCampUpgrade(id);
  },
  panel: function (id) {
    unlockPanel(id);
  },
  gearUpgrade: function (id) {
    unlockGearUpgrade(id);
  },
  location: function (id) {
    unlockLocation(id);
  },
  resourceCraft: function (id) {
    unlockResourceCraft(id);
  },
  flag: function (id) {
    unlockFlag(id);
  },
  research: function (id) {
    unlockResearch(id);
  },
  journal: function (id) {
    addJournalEntry(id);
  },
  region: function (id) {
    unlockRegion(id);
  },
  goal: function (id) {
    setCurrentGoal(id);
  },
  spell: function (id) {
    unlockSpell(id);
  },
  automation: function (id) {
    unlockAutomation(id);
  },
  project: function (id) {
    unlockProject(id);
  },
  towerNode: function (id) {
    unlockTowerNodeBuild(id);
  },
};

const SPELL_PROGRESS_DEFINITIONS = {
  manaSense: {
    maxLevel: 5,
    thresholds: [10, 30, 60, 100, 150],
  },
  attunement: {
    maxLevel: 5,
    thresholds: [10, 30, 60, 100, 150],
  },
  imbue: {
    maxLevel: 5,
    thresholds: [10, 30, 60, 100, 150],
  },
  arcaneForce: {
    maxLevel: 5,
    thresholds: [10, 30, 60, 100, 150],
  },
  ward: {
    maxLevel: 5,
    thresholds: [10, 30, 60, 100, 150],
  },
};

const WARD_RANK_1_PROGRESSION = [
  { maxWard: 10, restoreEfficiency: 1 },
  { maxWard: 15, restoreEfficiency: 1.5 },
  { maxWard: 20, restoreEfficiency: 2 },
  { maxWard: 30, restoreEfficiency: 2.5 },
  { maxWard: 40, restoreEfficiency: 3 },
  { maxWard: 50, restoreEfficiency: 4 },
];
let openSpellMenuName = null;
let selectedEquipmentDetailId = null;

function applyUnlock(unlock) {
  if (!unlock || !unlock.type || !unlock.id) {
    console.warn("Invalid unlock:", unlock);
    return;
  }

  const handler = unlockHandlers[unlock.type];

  if (!handler) {
    console.warn("Unknown unlock type:", unlock.type);
    return;
  }

  handler(unlock.id);
}

function applyUnlocks(unlocks) {
  if (!Array.isArray(unlocks)) return;

  unlocks.forEach(applyUnlock);
}

function unlockPersonalWard(showPopup = true) {
  const ward = getResource("ward");
  const wasUnlocked = !!gameState.personalWardUnlocked;

  gameState.personalWardUnlocked = true;
  unlockSpell("ward");
  ensureWardState();

  if (ward) {
    syncWardResourceState();
    unlockResource("ward");
    updateResource("ward");
  }

  if (!wasUnlocked) {
    addStoryEntry("The foundation's ward pattern answers your mana. You remember how to hold a personal ward around yourself.");
    addJournalEntry("personalWardRemembered");
  }

  if (showPopup && !gameState.personalWardPopupShown && typeof showPersonalWardPopup === "function") {
    showPersonalWardPopup();
  }

  updateEquipmentSlotUI();
  updateAllActionButtons();
}

function repairPersonalWardUnlockFromProject(showPopup = false) {
  if (gameState.personalWardUnlocked) {
    const ward = getResource("ward");

    if (ward) {
      unlockSpell("ward");
      ensureWardState();
      syncWardResourceState();
      unlockResource("ward");
      updateResource("ward");
    }

    return;
  }

  const foundation = getProjectState("towerFoundation");

  if (foundation && foundation.completed) {
    unlockPersonalWard(showPopup);
  }
}

function getWardState() {
  ensureWardState();
  return gameState.magic.ward;
}

function ensureWardState() {
  if (!gameState.magic || typeof gameState.magic !== "object") gameState.magic = {};
  if (!gameState.magic.ward || typeof gameState.magic.ward !== "object") {
    const ward = getResource("ward");
    gameState.magic.ward = {
      rank: 1,
      formed: !!ward && ward.value > 0,
      maintainEnabled: false,
    };
  }

  const state = gameState.magic.ward;
  state.rank = 1;
  state.formed = !!state.formed;
  state.maintainEnabled = !!state.maintainEnabled;
}

function getWardLevel() {
  return getSpellProgressState("ward").level || 0;
}

function getWardRankProgression() {
  return WARD_RANK_1_PROGRESSION[Math.max(0, Math.min(getWardLevel(), WARD_RANK_1_PROGRESSION.length - 1))];
}

function getWardMaximum() {
  return getWardRankProgression().maxWard;
}

function getWardRestoreEfficiency() {
  return getWardRankProgression().restoreEfficiency;
}

function formatWardRestoreEfficiency() {
  return formatResourceAmountForDisplay(getWardRestoreEfficiency());
}

function syncWardResourceState() {
  const ward = getResource("ward");
  if (!ward) return;

  ward.maxValue = getWardMaximum();
  ward.value = roundResourceAmount(Math.max(0, Math.min(ward.maxValue, Number(ward.value) || 0)));
}

function getWardRestorationPlan(maxMana = 5) {
  const ward = getResource("ward");
  const mana = getResource("mana");
  const state = getWardState();

  if (!ward || !mana || !gameState.personalWardUnlocked) return null;
  if (state.formed && ward.value >= ward.maxValue) return null;

  const missing = roundResourceAmount(ward.maxValue - ward.value);
  const efficiency = getWardRestoreEfficiency();
  const availableMana = Math.max(0, Math.min(Number(maxMana) || 0, mana.value));
  const manaSpent = roundResourceAmount(Math.min(availableMana, missing / efficiency));
  const wardRestored = roundResourceAmount(Math.min(missing, manaSpent * efficiency));

  return manaSpent > 0 && wardRestored > 0 ? { manaSpent, wardRestored } : null;
}

function restoreWard(plan, options = {}) {
  const ward = getResource("ward");
  const state = getWardState();

  if (!ward || !plan || plan.wardRestored <= 0) return 0;
  if (!state.formed && !options.forming) return 0;

  const actualRestored = roundResourceAmount(Math.min(plan.wardRestored, ward.maxValue - ward.value));
  if (actualRestored <= 0) return 0;

  if (options.forming) state.formed = true;
  ward.value = roundResourceAmount(ward.value + actualRestored);
  recordWardExperience(actualRestored);
  updateResource("ward");
  updateEquipmentSlotUI();
  updateAllActionButtons();
  return actualRestored;
}

function startWardChannel(action) {
  if (isActivityActive() || (typeof isCombatActive === "function" && isCombatActive())) return false;

  const state = getWardState();
  if ((action === "form" && state.formed) || (action === "restore" && !state.formed)) return false;

  const plan = getWardRestorationPlan(5);
  if (!plan || !spendCost({ mana: plan.manaSpent })) return false;

  if (!startActivity({
    kind: "spell",
    id: "ward",
    duration: getSpell("ward").duration,
    context: { type: "ward", action, plan },
  })) {
    refundCost({ mana: plan.manaSpent });
    return false;
  }

  updateAllResources();
  updateEquipmentSlotUI();
  updateAllActionButtons();
  return true;
}

function completeWardChannel(context) {
  if (!context || context.type !== "ward" || !context.plan) return false;

  const restored = restoreWard(context.plan, { forming: context.action === "form" });
  if (restored > 0) {
    addStoryEntry(context.action === "form" ? "A new Ward settles around you." : "Mana reinforces your Ward.");
  }
  return restored > 0;
}

function applyWardDamage(amount) {
  const ward = getResource("ward");
  const state = getWardState();
  const damage = roundResourceAmount(Math.max(0, Number(amount) || 0));

  if (!ward || !state.formed || damage <= 0) return 0;

  const absorbed = roundResourceAmount(Math.min(ward.value, damage));
  ward.value = roundResourceAmount(ward.value - absorbed);
  updateResource("ward");

  if (ward.value <= 0) {
    state.formed = false;
    state.maintainEnabled = false;
    if (!(typeof isCombatActive === "function" && isCombatActive()) && typeof beginReturnToCamp === "function") {
      beginReturnToCamp("wardBroken");
    }
    return absorbed;
  }

  if (state.maintainEnabled && !(typeof isCombatActive === "function" && isCombatActive())) {
    const plan = getWardRestorationPlan(getResource("mana").value);
    if (plan && spendCost({ mana: plan.manaSpent })) restoreWard(plan);
  }

  updateEquipmentSlotUI();
  return absorbed;
}

function toggleMaintainWard() {
  const state = getWardState();
  if (getWardLevel() < 3 || !state.formed || (typeof isCombatActive === "function" && isCombatActive())) return;

  state.maintainEnabled = !state.maintainEnabled;
  updateEquipmentSlotUI();
}

function getDefaultProjectState() {
  return {
    unlocked: false,
    completed: false,
    level: 0,
    work: 0,
    deposits: {},
  };
}

function ensureProjectsState() {
  if (!gameState.projects || typeof gameState.projects !== "object" || Array.isArray(gameState.projects)) {
    gameState.projects = {};
  }

  const definitions = getProjectDefinitions();

  for (let projectName in definitions) {
    const defaults = getDefaultProjectState();
    const saved = gameState.projects[projectName];

    if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
      gameState.projects[projectName] = defaults;
      continue;
    }

    for (let fieldName in defaults) {
      if (!Object.prototype.hasOwnProperty.call(saved, fieldName)) {
        saved[fieldName] = defaults[fieldName];
      }
    }

    if (!saved.deposits || typeof saved.deposits !== "object" || Array.isArray(saved.deposits)) {
      saved.deposits = {};
    }

    normalizeProjectState(projectName);
  }
}

function getProjectState(projectName) {
  ensureProjectsState();
  return gameState.projects[projectName];
}

function getDefaultTowerNodeDeposits(nodeName) {
  const definition = getTowerNodeDefinition(nodeName);
  const deposits = {};
  const materials = definition ? definition.materials || {} : {};

  for (let resourceName in materials) {
    deposits[resourceName] = 0;
  }

  return deposits;
}

function getDefaultTowerNodeState(nodeName) {
  return {
    activated: false,
    researchUnlocked: false,
    built: false,
    deposits: getDefaultTowerNodeDeposits(nodeName),
    imbueProgress: 0,
    threadSenseProgress: 0,
    threadSensed: false,
    advancedRecallUnlocked: false,
  };
}

function ensureTowerNodesState() {
  if (!gameState.towerNodes || typeof gameState.towerNodes !== "object" || Array.isArray(gameState.towerNodes)) {
    gameState.towerNodes = {};
  }

  const definitions = getTowerNodeDefinitions();

  for (let nodeName in definitions) {
    const defaults = getDefaultTowerNodeState(nodeName);
    const saved = gameState.towerNodes[nodeName];

    if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
      gameState.towerNodes[nodeName] = defaults;
      continue;
    }

    for (let fieldName in defaults) {
      if (!Object.prototype.hasOwnProperty.call(saved, fieldName)) {
        saved[fieldName] = structuredClone(defaults[fieldName]);
      }
    }

    normalizeTowerNodeState(nodeName);
  }
}

function getTowerNodeState(nodeName) {
  ensureTowerNodesState();
  return gameState.towerNodes[nodeName];
}

function normalizeTowerNodeState(nodeName) {
  const definition = getTowerNodeDefinition(nodeName);
  const state = gameState.towerNodes && gameState.towerNodes[nodeName];

  if (!definition || !state) return;

  state.activated = !!state.activated;
  state.researchUnlocked = !!state.researchUnlocked;
  state.built = !!state.built;
  state.imbueProgress = Math.max(0, Number.isFinite(state.imbueProgress) ? state.imbueProgress : 0);
  state.imbueProgress = Math.min(state.imbueProgress, definition.imbueRequired || 0);
  state.threadSenseProgress = Math.max(0, Number.isFinite(state.threadSenseProgress) ? state.threadSenseProgress : 0);
  state.threadSenseProgress = Math.min(state.threadSenseProgress, definition.threadSenseRequired || 0);
  const threadSenseRequired = definition.threadSenseRequired || 0;
  state.threadSensed = !!state.threadSensed || (threadSenseRequired > 0 && state.threadSenseProgress >= threadSenseRequired);
  state.advancedRecallUnlocked = !!state.advancedRecallUnlocked || state.threadSensed;

  if (!state.deposits || typeof state.deposits !== "object" || Array.isArray(state.deposits)) {
    state.deposits = {};
  }

  const materials = definition.materials || {};

  for (let resourceName in materials) {
    const requirement = materials[resourceName] || 0;
    const deposited = Number.isFinite(state.deposits[resourceName]) ? state.deposits[resourceName] : 0;
    state.deposits[resourceName] = Math.max(0, Math.min(deposited, requirement));
  }
}

function normalizeProjectState(projectName) {
  const definition = getProjectDefinition(projectName);
  const state = gameState.projects && gameState.projects[projectName];

  if (!definition || !state) return;

  const maxLevel = Array.isArray(definition.levels) ? definition.levels.length : 0;
  state.level = Math.max(0, Math.min(Number.isFinite(state.level) ? Math.floor(state.level) : 0, maxLevel));
  state.work = Math.max(0, Number.isFinite(state.work) ? state.work : 0);
  state.completed = !!state.completed || state.level >= maxLevel;

  if (state.completed) {
    state.level = maxLevel;
  }

  const level = getProjectLevelDefinition(projectName, state.level);

  if (level) {
    state.work = Math.min(state.work, level.workRequired || 0);
  } else {
    state.work = 0;
  }
}

function unlockProject(projectName) {
  const definition = getProjectDefinition(projectName);
  const state = getProjectState(projectName);

  if (!definition || !state) {
    console.warn("Unknown project:", projectName);
    return;
  }

  if (state.unlocked || state.completed) return;

  state.unlocked = true;
  updateProjectUI();
  updateCraftingSectionVisibility();
  updateWorkTabsVisibility();
  syncMainViewAvailability();
}

function hasVisibleProject() {
  ensureProjectsState();

  const definitions = getProjectDefinitions();

  for (let projectName in definitions) {
    const state = getProjectState(projectName);

    if (state && (state.unlocked || state.completed)) return true;
  }

  return false;
}

function unlockFlag(flagName) {
  if (!Object.prototype.hasOwnProperty.call(gameState, flagName)) {
    console.warn("Unknown flag:", flagName);
    return;
  }

  gameState[flagName] = true;

  if (flagName === "discoveredStream" || flagName === "discoveredBerryBush") {
    checkClearingComplete();
  }

  syncMainViewAvailability();
}

function unlockLocation(locationName) {
  const location = getExpeditionLocation(locationName);

  if (!location) {
    console.warn("Unknown location:", locationName);
    return;
  }

  if (location.discovered) return;

  location.discovered = true;
  updateDestinationActions();
}

function unlockResourceCraft(craftName) {
  const craft = getResourceCraft(craftName);

  if (!craft) {
    console.warn("Unknown resource craft:", craftName);
    return;
  }

  if (craft.unlocked) return;

  craft.unlocked = true;
  updateResourceCraftUI(craftName);
  updateCraftingSectionVisibility();
}

function unlockRegion(regionId) {
  if (!gameState.world || !gameState.world.regions || !gameState.world.regions[regionId]) {
    console.warn("Unknown region:", regionId);
    return;
  }

  gameState.world.regions[regionId].unlocked = true;
}

function applyResearchUnlocks(researchName) {
  const research = getResearch(researchName);

  if (!research || !Array.isArray(research.unlocks)) return;

  applyUnlocks(research.unlocks);
}

function unlockResearch(researchName) {
  const research = getResearch(researchName);

  if (!research) {
    console.warn("Unknown research:", researchName);
    return;
  }

  if (research.completed || research.unlocked) return;

  research.unlocked = true;
  research.unlockedAt = Date.now();

  if (research.discoveryStory) {
    addStoryEntry(research.discoveryStory);
  }

  updateCraftingSectionVisibility();
  updateWorkTabsVisibility();

  if (typeof updateResearchHistoryUI === "function") {
    updateResearchHistoryUI();
  }
}

function completeResearch(researchName, costAlreadyPaid = false) {
  const research = getResearch(researchName);

  if (!research || research.completed) return;
  if (research.blocked) return;
  if (!research.unlocked) return;
  if (!costAlreadyPaid && !spendCost(getResearchCost(researchName))) return;

  research.completed = true;
  research.unlocked = false;

  if (research.story) {
    addStoryEntry(research.story);
  }

  applyResearchUnlocks(researchName);
  recordDeepThought(research.deepThought || 1, research.label);

  if (typeof checkRank2SkillUnlocks === "function") {
    checkRank2SkillUnlocks();
  }

  gameState.selectedResearchEntry = "research:" + researchName;

  updateResearchHistoryUI();
  updateCraftingUIForCurrentContext();
  updateAllActionButtons();
  updateCurrentGoalUI();
}

function checkResearchDiscoveries() {
  const researchDefinitions = getResearchDefinitions();

  for (let researchName in researchDefinitions) {
    const research = getResearch(researchName);

    if (!isResearchDiscoverable(research)) continue;

    unlockResearch(researchName);
  }
}

function isResearchDiscoverable(research) {
  if (!research || research.completed || research.unlocked) return false;

  if (!research.requires) return false;

  if (!hasRequiredResearchLocations(research.requires.locationsExplored)) {
    return false;
  }

  if (!hasRequiredResearchResources(research.requires.resources)) {
    return false;
  }

  if (!hasRequiredResearchCampUpgrades(research.requires.campUpgradesPurchased)) {
    return false;
  }

  if (!hasRequiredResearchGear(research.requires.gearPurchased)) {
    return false;
  }

  if (!hasRequiredResearchCompleted(research.requires.researchCompleted)) {
    return false;
  }

  if (!hasRequiredResearchFlags(research.requires.flags)) {
    return false;
  }

  if (!hasRequiredResearchSkills(research.requires.skills)) {
    return false;
  }

  if (!hasRequiredResearchTowerNodes(research.requires.towerNodes)) {
    return false;
  }

  return true;
}

function hasRequiredResearchTowerNodes(requiredNodes) {
  if (!requiredNodes) return true;

  for (let nodeName in requiredNodes) {
    const state = getTowerNodeState(nodeName);
    const requirement = requiredNodes[nodeName] || {};

    if (!state) return false;

    for (let fieldName in requirement) {
      if (typeof requirement[fieldName] === "boolean") {
        if (!!state[fieldName] !== requirement[fieldName]) return false;
      } else if (Number.isFinite(requirement[fieldName])) {
        if (!Number.isFinite(state[fieldName]) || state[fieldName] < requirement[fieldName]) return false;
      } else if (state[fieldName] !== requirement[fieldName]) {
        return false;
      }
    }
  }

  return true;
}

function hasRequiredResearchSkills(requiredSkills) {
  if (!requiredSkills) return true;

  for (let skillName in requiredSkills) {
    const requirement = requiredSkills[skillName] || {};
    const skill = getSkillState(skillName);
    const requiredRank = Number.isFinite(requirement.rank) ? requirement.rank : DEFAULT_SKILL_RANK;
    const requiredLevel = Number.isFinite(requirement.level) ? requirement.level : 0;

    if (!skill || skill.rank < requiredRank || (skill.rank === requiredRank && skill.level < requiredLevel)) {
      return false;
    }
  }

  return true;
}

function hasRequiredResearchFlags(requiredFlags) {
  if (!requiredFlags) return true;

  for (let i = 0; i < requiredFlags.length; i++) {
    if (!gameState[requiredFlags[i]]) {
      return false;
    }
  }

  return true;
}

function hasRequiredResearchLocations(requiredLocations) {
  if (!requiredLocations) return true;

  for (let i = 0; i < requiredLocations.length; i++) {
    const location = getExpeditionLocation(requiredLocations[i]);

    if (!location || !location.explored) {
      return false;
    }
  }

  return true;
}

function hasRequiredResearchResources(requiredResources) {
  if (!requiredResources) return true;

  for (let resourceName in requiredResources) {
    const resource = getResource(resourceName);

    if (!resource || resource.value < requiredResources[resourceName]) {
      return false;
    }
  }

  return true;
}

function hasRequiredResearchCampUpgrades(requiredUpgrades) {
  if (!requiredUpgrades) return true;

  for (let i = 0; i < requiredUpgrades.length; i++) {
    const upgrade = getCampUpgrade(requiredUpgrades[i]);

    if (!upgrade || !upgrade.purchased) {
      return false;
    }
  }

  return true;
}

function hasRequiredResearchGear(requiredGear) {
  if (!requiredGear) return true;

  for (let i = 0; i < requiredGear.length; i++) {
    const gear = getGearUpgrade(requiredGear[i]);

    if (!gear || !gear.purchased) {
      return false;
    }
  }

  return true;
}

function hasRequiredResearchCompleted(requiredResearch) {
  if (!requiredResearch) return true;

  for (let i = 0; i < requiredResearch.length; i++) {
    const research = getResearch(requiredResearch[i]);

    if (!research || !research.completed) {
      return false;
    }
  }

  return true;
}

// Hook Camp Upgrades to UI
function hookCampUpgradestoUI() {
  const campUpgradeDefinitions = getCampUpgradeDefinitions();

  for (let upgradeName in campUpgradeDefinitions) {
    const upgrade = getCampUpgrade(upgradeName);

    upgrade.button = document.getElementById(upgradeName + "Btn");
    upgrade.display = document.getElementById(upgradeName);

    if (upgrade.button) {
      prepareCraftButton(upgrade.button);

      upgrade.button.addEventListener("click", function () {
        buyCampUpgrade(upgradeName);
      });
    }

    updateCampUpgradeUI(upgradeName);
  }
  updateCraftingSectionVisibility();
}

function updateCampUpgradeUI(upgradeName) {
  const upgrade = getCampUpgrade(upgradeName);

  updateCampUpgradeDisplay(upgrade);

  if (upgrade && upgrade.button && upgrade.unlocked && !upgrade.purchased) {
    updateCraftButtonLabel("campUpgrade", upgradeName);
  }
}

function ensureCraftingButton(buttonId) {
  let button = document.getElementById(buttonId);

  if (button) return button;

  const craftingActions = document.querySelector("#craftingPanel .crafting-actions");

  if (!craftingActions) return null;

  button = document.createElement("button");
  button.id = buttonId;
  button.type = "button";
  button.style.display = "none";

  craftingActions.appendChild(button);

  return button;
}

function hookGearUpgradesToUI() {
  const gearUpgradeDefinitions = getGearUpgradeDefinitions();

  for (let upgradeName in gearUpgradeDefinitions) {
    const upgrade = getGearUpgrade(upgradeName);

    upgrade.button = ensureCraftingButton(upgradeName + "Btn");
    upgrade.display = document.getElementById(upgradeName);

    if (upgrade.button) {
      prepareCraftButton(upgrade.button);

      if (!upgrade.button.dataset.gearHooked) {
        upgrade.button.addEventListener("click", function () {
          buyGearUpgrade(upgradeName);
        });

        upgrade.button.dataset.gearHooked = "true";
      }
    }

    updateGearUpgradeUI(upgradeName);
    updateEquipmentSlotUI();
  }
}

function getBasicCraftButtonName(craft) {
  return craft.label;
}

function isCampCraftingContext() {
  const expedition = gameState.expedition;

  return !expedition.active && !expedition.currentLocation;
}

function isCampEquipmentCraftContextAvailable(craft) {
  return !!craft && !!craft.campUpgradeRequired && isCampCraftingContext() && hasPurchasedCampUpgrade(craft.campUpgradeRequired);
}

function getActiveCraftContext(craft) {
  if (!craft) return null;

  if (isCampEquipmentCraftContextAvailable(craft)) {
    return {
      mode: "campEquipment",
      cost: craft.campCost || craft.cost || {},
      storageCost: null,
      produces: craft.campProduces || craft.produces || null,
      storageProduces: null,
      producesConsumable: craft.campProducesConsumable || craft.producesConsumable || null,
    };
  }

  const requiredLocation = craft.requiredLocation || "camp";

  if (requiredLocation === "camp") {
    if (!isCampCraftingContext()) return null;
  } else if (gameState.expedition.currentLocation !== requiredLocation) {
    return null;
  }

  return {
    mode: requiredLocation === "camp" ? "camp" : "location",
    cost: craft.cost || {},
    storageCost: craft.storageCost || null,
    produces: craft.produces || null,
    storageProduces: craft.storageProduces || null,
    producesConsumable: craft.producesConsumable || null,
  };
}

function getActiveCraftContextFor(craftType, craftId) {
  return getActiveCraftContext(getCraftDefinition(craftType, craftId));
}

function getCraftStorageCost(craftType, craftId) {
  const context = getActiveCraftContextFor(craftType, craftId);

  return context ? context.storageCost : null;
}

function isResourceCraftUnlockedForContext(craft, context) {
  if (!context) return false;
  if (craft.unlocked) return true;

  return context.mode === "campEquipment";
}

function getBasicCraftButtonCost(craft, craftType, craftId) {
  const costs = [];
  const resourceCost = formatCost(getCraftCost(craftType, craftId));
  const storageCost = formatStorageCost(getCraftStorageCost(craftType, craftId));

  if (resourceCost) costs.push(resourceCost);
  if (storageCost) costs.push(storageCost);

  return costs.join(", ");
}

function formatStorageCost(cost) {
  const costText = formatCost(cost);

  if (!costText) return "";

  return costText + " stored here";
}

function updateCraftButtonLabel(craftType, craftId) {
  const craft = getCraftDefinition(craftType, craftId);

  if (!craft || !craft.button) return;

  setCraftButtonLabel(craft.button, getBasicCraftButtonName(craft), getBasicCraftButtonCost(craft, craftType, craftId));
}

function setCraftButtonLabel(button, name, costText) {
  if (!button) return;

  setUiActionButtonLabel(button, {
    label: name,
    cost: costText || "",
    labelClass: "craft-name",
    costClass: "craft-cost",
  });
}

function formatCost(cost) {
  return formatFilteredCost(cost, function () {
    return true;
  });
}

function formatCostExcluding(cost, excludedResources) {
  return formatFilteredCost(cost, function (resourceName) {
    return !excludedResources.includes(resourceName);
  });
}

function formatFilteredCost(cost, shouldIncludeResource) {
  if (!cost) return "";

  const parts = [];

  for (let resourceName in cost) {
    if (!shouldIncludeResource(resourceName)) continue;

    const resource = getResource(resourceName);
    const label = resource ? resource.label : resourceName;

    if (resource && resource.hidden && resource.missingLabel && resource.value < cost[resourceName]) {
      parts.push(resource.missingLabel);
      continue;
    }

    parts.push(cost[resourceName] + " " + label);
  }

  return parts.join(", ");
}

function setCampActionsAvailable(available) {
  if (available) {
    if (gameState.discoveredDeadfall) {
      unlockAction("gatherWood");
      unlockAction("addWoodToFuel");
    } else {
      lockAction("addWoodToFuel");
    }

    const imbuedWood = getResource("imbuedWood");
    const imbuedWoodVisible = imbuedWood && imbuedWood.display && imbuedWood.display.style.display !== "none";
    const imbueSpell = getSpell("imbue");

    if ((imbuedWood && imbuedWood.value > 0) || imbuedWoodVisible || (imbueSpell && imbueSpell.unlocked)) {
      unlockAction("addImbuedWoodToFuel");
    } else {
      lockAction("addImbuedWoodToFuel");
    }

    if (gameState.discoveredBerryBush) {
      unlockAction("gatherFood");
    }

    if (gameState.discoveredStream) {
      unlockAction("gatherWater");
    }

    if (!gameState.discoveredClearing) {
      unlockAction("explore");
    } else {
      lockAction("explore");
    }

    if (gameState.phase === "expedition") {
      unlockAction("recover");
    }

    if (hasPurchasedCampUpgrade("meditationSpot")) {
      unlockAction("meditate");
    }

    if (hasPurchasedCampUpgrade("campAlchemyStation")) {
      unlockAction("concentrateTonicBase");
      unlockAction("concentrateManaTonicBase");
    } else {
      lockAction("concentrateTonicBase");
      lockAction("concentrateManaTonicBase");
    }

    ui.restBtn.style.display = canRestAtCurrentPlace() ? "grid" : "none";
  } else {
    lockAction("gatherWood");
    lockAction("addWoodToFuel");
    lockAction("addImbuedWoodToFuel");
    lockAction("gatherFood");
    lockAction("gatherWater");
    lockAction("explore");
    lockAction("recover");
    lockAction("meditate");
    lockAction("concentrateTonicBase");
    lockAction("concentrateManaTonicBase");
    ui.restBtn.style.display = "none";
  }
}

function canRestAtCurrentPlace() {
  if (gameState.phase !== "clearing" && gameState.phase !== "expedition") return false;
  if (gameState.expedition.active || gameState.expedition.currentLocation) return false;

  return true;
}

// Buy Camp Upgrade Function
function buyCampUpgrade(upgradeName) {
  startCrafting("campUpgrade", upgradeName);
}

function completeCampUpgrade(upgradeName) {
  const upgrade = getCampUpgrade(upgradeName);

  if (!upgrade || !upgrade.unlocked || upgrade.purchased) return;

  upgrade.purchased = true;
  upgrade.unlocked = false;
  upgrade.onComplete();

  updateCampUpgradeUI(upgradeName);
  updateCraftingSectionVisibility();
  updateWorkTabsVisibility();
  updatePlacePanel();

  if (upgradeName === "researchSpot") {
    showWorkPanel("research");
  }

  if (typeof checkRank2SkillUnlocks === "function") {
    checkRank2SkillUnlocks();
  }

  checkResearchDiscoveries();
  updateCurrentGoalUI();
  checkClearingComplete();
}

// Unlock Camp Upgrade Function
function unlockCampUpgrade(upgradeName) {
  const upgrade = getCampUpgrade(upgradeName);

  if (!upgrade) {
    console.warn("Unknown camp upgrade:", upgradeName);
    return;
  }

  if (upgrade.purchased || upgrade.unlocked) return;

  upgrade.unlocked = true;
  updateCampUpgradeUI(upgradeName);
  updateCraftingSectionVisibility();
}

// Lock Camp Upgrade Function
function lockCampUpgrade(upgradeName) {
  const upgrade = getCampUpgrade(upgradeName);

  if (!upgrade) {
    console.warn("Unknown camp upgrade:", upgradeName);
    return;
  }

  upgrade.unlocked = false;
  updateCampUpgradeUI(upgradeName);
}

// Phase Helper
function setPhase(phaseName) {
  gameState.phase = phaseName;
  updateExpeditionLoadoutVisibility();

  if (phaseName === "expedition") {
    lockAction("explore");

    applyUnlocks([
      { type: "panel", id: "expedition" },
      { type: "action", id: "beginExpedition" },
    ]);

    refreshExpeditionUI();
    updateDestinationActions();
  }
}

// Camp Upgrade Purchase Checker
function hasPurchasedCampUpgrade(upgradeName) {
  const upgrade = getCampUpgrade(upgradeName);

  return !!upgrade && upgrade.purchased;
}

// Check Clearing Complete Phase Helper
function checkClearingComplete() {
  const hasSmallFire = hasPurchasedCampUpgrade("smallFire");
  const hasCrudeLeanTo = hasPurchasedCampUpgrade("crudeLeanTo");
  const hasStream = gameState.discoveredStream;
  const hasBerryBush = gameState.discoveredBerryBush;

  if (gameState.phase === "clearing" && hasStream && hasBerryBush && hasSmallFire && hasCrudeLeanTo) {
    setPhase("expedition");
    gameState.hasCamp = true;
    recalculateCharacterStats();
    unlockAction("recover");
    setCurrentGoal("exploreOutskirts");
    addJournalEntry("campEstablished");
    showCampEstablishedPopup();
    updatePlacePanel();
    addStoryEntry("With fire and shelter established, the clearing feels less like a refuge and more like a camp. It is time to range farther.");
  }
}

function updateEquipmentSlotUI() {
  renderPaperDollEquipment();
  renderSpellSlots();
  renderTonicSlots();
  renderMagicWorkflowPanel();
  renderSpellProgressSummary();
  syncContextualActionPlacement();
  renderContextualLocationSpellActions();
  syncMainViewAvailability();
}

// Actions retain their original owners, but the active place decides where the
// player uses them. Moving the existing button preserves its action handler,
// progress bar, and availability state.
function syncContextualActionPlacement() {
  const meditation = typeof getAction === "function" ? getAction("meditate") : null;
  const meditationButton = meditation && meditation.button;

  if (!meditationButton) return;

  const atLocation = !!gameState.expedition.currentLocation && isActionContextAvailable("meditate");
  const atCamp = !gameState.expedition.active && !gameState.expedition.currentLocation && isActionContextAvailable("meditate");
  const target = atLocation ? ui.locationContextualActions : atCamp ? ui.campContextualActions : ui.magicContextualActions;

  if (target && meditationButton.parentElement !== target) {
    target.appendChild(meditationButton);
  }

  [ui.locationContextualActions, ui.campContextualActions].forEach(function (container) {
    if (!container) return;

    const hasAction = container.contains(meditationButton);
    container.style.display = hasAction ? "flex" : "none";
  });
}

function renderContextualLocationSpellActions() {
  const container = ui.locationSpellActions;

  if (!container) return;

  container.innerHTML = "<h3>Available magic</h3>";

  if (!gameState.expedition.currentLocation || (typeof isCombatActive === "function" && isCombatActive())) {
    hideElement(container);
    return;
  }

  let hasActions = false;
  const manaSense = getSpell("manaSense");

  if (manaSense && manaSense.unlocked) {
    const definitions = getManaSenseDefinitions();

    for (let targetName in definitions) {
      if (!canApplyManaSenseTarget(targetName)) continue;
      appendManaSenseTargetOption(targetName, container);
      hasActions = true;
    }

    const context = getSpellCastContext("manaSense");
    if (context && canCastSpell("manaSense")) {
      appendSpellCastOption("manaSense", context, container);
      hasActions = true;
    }
  }

  const arcaneForce = getSpell("arcaneForce");
  const forceContext = arcaneForce && arcaneForce.unlocked ? getSpellCastContext("arcaneForce") : null;

  if (forceContext && canCastSpell("arcaneForce")) {
    appendSpellCastOption("arcaneForce", forceContext, container);
    hasActions = true;
  }

  if (hasActions) {
    showElement(container, "flex");
  } else {
    hideElement(container);
  }
}

function renderContextualCraftingSpellActions() {
  const container = ui.craftingSpellActions;

  if (!container) return;

  container.innerHTML = "<h3>Magic for this work</h3>";

  if (isActivityActive()) {
    hideElement(container);
    return;
  }

  let hasActions = false;

  ["imbue", "arcaneForce"].forEach(function (spellName) {
    const spell = getSpell(spellName);
    const definitions = getProductionSpellDefinitions(spellName) || {};

    if (!spell || !spell.unlocked) return;

    for (let targetName in definitions) {
      if (!isProductionSpellTargetAvailable(spellName, targetName)) continue;

      const definition = getProductionSpellDefinition(spellName, targetName);
      const targetContext = getProductionSpellTargetContext(spellName, targetName);
      const context = {
        type: "productionSpell",
        spellName,
        targetId: targetName,
        mode: targetContext ? targetContext.mode : null,
      };
      const button = document.createElement("button");
      button.type = "button";
      button.className = "attunement-target-btn";
      appendProductionSpellOptionContent(button, spellName, definition, context);
      const usable = canApplyProductionSpellTarget(spellName, targetName);
      button.disabled = !usable;
      applyUiSpellOptionState(button, targetContext ? targetContext.cost : {}, usable);
      button.addEventListener("click", function () {
        castTargetedSpell(spellName, context);
      });
      container.appendChild(button);
      hasActions = true;
    }
  });

  if (hasActions) {
    showElement(container, "flex");
  } else {
    hideElement(container);
  }
}

function renderCampUpgradeSlots() {
  if (!ui.campUpgradeSlots) return;

  const slots = getPurchasedCampUpgradeSlots();
  ui.campUpgradeSlots.innerHTML = "";

  if (slots.length === 0) {
    hideElement(ui.campUpgradeSection);
    return;
  }

  showElement(ui.campUpgradeSection, "flex");

  slots.forEach(function (slot) {
    const renderedSlot = createUiSlot({
      itemLabel: slot.current.displayName || slot.current.label,
      slotLabel: slot.label,
    });

    ui.campUpgradeSlots.appendChild(renderedSlot.slot);
  });
}

function getPurchasedCampUpgradeSlots() {
  const upgrades = getCampUpgradeDefinitions();
  const slots = {};

  for (let upgradeName in upgrades) {
    const upgrade = getCampUpgrade(upgradeName);

    if (!upgrade || !upgrade.campSlot || !upgrade.purchased) continue;

    if (!slots[upgrade.campSlot]) {
      slots[upgrade.campSlot] = {
        label: upgrade.campSlotLabel,
        order: upgrade.campSlotOrder || 99,
        current: upgrade,
      };
    }

    if ((upgrade.campSlotRank || 0) > (slots[upgrade.campSlot].current.campSlotRank || 0)) {
      slots[upgrade.campSlot].current = upgrade;
    }
  }

  return Object.values(slots).sort(function (a, b) {
    return a.order - b.order;
  });
}

function renderPaperDollEquipment() {
  if (!ui.gearSlotsGroup || !ui.gearSlots || !ui.toolSlotsGroup || !ui.toolSlots) return;

  const gearSlots = getPurchasedEquipmentSlots("gear");
  const toolSlots = getPurchasedEquipmentSlots("tool");
  const availableItems = gearSlots.map(function (slot) { return slot.current; }).concat(toolSlots.map(function (slot) { return slot.current; }));

  if (!availableItems.some(function (item) { return item === selectedEquipmentDetailId; })) {
    selectedEquipmentDetailId = availableItems[0] || null;
  }

  ui.gearSlots.innerHTML = "";
  ui.toolSlots.innerHTML = "";

  if (gearSlots.length > 0) {
    showElement(ui.gearSlotsGroup, "flex");
    gearSlots.forEach(function (slot) {
      ui.gearSlots.appendChild(createPaperDollItemButton(slot.current));
    });
  } else {
    hideElement(ui.gearSlotsGroup);
  }

  if (toolSlots.length > 0) {
    showElement(ui.toolSlotsGroup, "flex");
    toolSlots.forEach(function (slot) {
      ui.toolSlots.appendChild(createToolItemButton(slot.current));
    });
  } else {
    hideElement(ui.toolSlotsGroup);
  }

  updateEquipmentDetail(availableItems);
}

function createPaperDollItemButton(item) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "paper-doll-item slot-" + item.slot + (item.iconVariant ? " icon-" + item.iconVariant : "");
  button.setAttribute("aria-label", (item.displayName || item.label) + ": " + getEquipmentEffectText(item));
  button.title = item.displayName || item.label;
  button.textContent = item.icon || "✦";
  button.classList.toggle("is-selected", item === selectedEquipmentDetailId);
  button.addEventListener("click", function () {
    selectedEquipmentDetailId = item;
    renderPaperDollEquipment();
  });
  return button;
}

function createToolItemButton(item) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "tool-icon-item" + (item.iconVariant ? " icon-" + item.iconVariant : "");
  button.setAttribute("aria-label", (item.displayName || item.label) + ": " + getEquipmentEffectText(item));
  button.title = item.displayName || item.label;
  button.classList.toggle("is-selected", item === selectedEquipmentDetailId);

  const icon = document.createElement("span");
  icon.className = "tool-item-icon";
  icon.textContent = item.icon || "✦";
  const effect = document.createElement("span");
  effect.className = "tool-item-effect";
  effect.textContent = getEquipmentEffectText(item);
  button.append(icon, effect);
  button.addEventListener("click", function () {
    selectedEquipmentDetailId = item;
    renderPaperDollEquipment();
  });
  return button;
}

function updateEquipmentDetail(availableItems) {
  if (!ui.equipmentDetail) return;
  const item = selectedEquipmentDetailId && availableItems.indexOf(selectedEquipmentDetailId) !== -1 ? selectedEquipmentDetailId : availableItems[0];
  ui.equipmentDetail.textContent = item ? (item.displayName || item.label) + "  " + getEquipmentEffectText(item) : "";
}

function getEquipmentEffectText(item) {
  const effects = item.effects || {};
  const parts = [];
  if (effects.carryCapacity !== undefined) parts.push("Carry " + effects.carryCapacity);
  if (effects.waterCapacity !== undefined) parts.push("Water " + effects.waterCapacity);
  if (effects.explorationEnergyReduction !== undefined) parts.push("Explore Energy −" + effects.explorationEnergyReduction);
  if (effects.travelEnergyMultiplier !== undefined) parts.push("Travel Energy −" + Math.round((1 - effects.travelEnergyMultiplier) * 100) + "%");
  if (effects.travelDistanceFlat !== undefined) parts.push("Travel +" + Math.round(effects.travelDistanceFlat * 100) + "%");
  if (effects.tonicSlots !== undefined) parts.push("Tonics " + effects.tonicSlots);
  if (effects.forageYieldFlat !== undefined) parts.push("Food +" + effects.forageYieldFlat, "Herb +" + effects.forageYieldFlat);
  if (effects.cuttingYieldFlat !== undefined) parts.push("Fiber +" + effects.cuttingYieldFlat);
  if (effects.huntRewardFlat !== undefined) parts.push("Pelts +" + effects.huntRewardFlat);
  if (effects.choppingYieldFlat !== undefined) parts.push("Wood +" + effects.choppingYieldFlat);
  if (effects.miningYieldBase !== undefined) parts.push("Ore " + effects.miningYieldBase);
  if (effects.darkExploration) parts.push("Dark places");
  return parts.join(" · ");
}

function renderTonicSlots() {
  if (!ui.tonicSlotsGroup || !ui.tonicSlots) return;

  ui.tonicSlots.innerHTML = "";

  const slots = getTonicSlots();

  if (slots.length <= 0) {
    hideElement(ui.tonicSlotsGroup);
    return;
  }

  showElement(ui.tonicSlotsGroup, "flex");

  slots.forEach(function (tonicName, slotIndex) {
    const tonic = tonicName ? getConsumable(tonicName) : null;
    const itemLabel = tonic ? tonic.label : tonicName || "Empty";
    const renderedSlot = createUiSlot({
      itemLabel,
      slotLabel: "Tonic",
      title: tonicName ? "Use " + itemLabel : "",
      interactive: !!tonicName,
      onActivate: tonicName
        ? function () {
            useConsumableFromSlot(slotIndex);
          }
        : null,
    });

    if (tonicName) {
      renderedSlot.box.classList.add("tonic-filled");
    }

    ui.tonicSlots.appendChild(renderedSlot.slot);
  });
}

function renderSpellSlots() {
  if (!ui.spellSlotsGroup || !ui.spellSlots) return;

  ui.spellSlots.innerHTML = "";

  const spells = getSpellDefinitions();
  const unlockedSpells = [];

  for (let spellName in spells) {
    const spell = getSpell(spellName);

    if (spell && spell.unlocked) {
      unlockedSpells.push({
        id: spellName,
        spell: spell,
      });
    }
  }

  if (unlockedSpells.length === 0) {
    hideSpellTargetMenu();
    hideElement(ui.spellSlotsGroup);
    renderMagicWorkflowPanel();
    renderSpellProgressSummary();
    return;
  }

  showElement(ui.spellSlotsGroup, "flex");

  if (
    openSpellMenuName &&
    !unlockedSpells.some(function (entry) {
      return entry.id === openSpellMenuName;
    })
  ) {
    openSpellMenuName = null;
  }

  unlockedSpells.forEach(function (entry) {
    const renderedSlot = createUiSlot({
      itemLabel: entry.spell.label,
      slotLabel: "Spell",
      interactive: true,
      className: "spell-slot",
      onActivate: function () {
        toggleSpellTargetMenu(entry.id);
      },
    });
    const boxEl = renderedSlot.box;
    boxEl.classList.add("spell-box");
    boxEl.setAttribute("role", "button");
    boxEl.setAttribute("tabindex", "0");
    boxEl.setAttribute("aria-controls", "spellTargetMenu");
    boxEl.setAttribute("aria-expanded", String(openSpellMenuName === entry.id));
    boxEl.textContent = "";

    const nameEl = document.createElement("span");
    nameEl.className = "spell-slot-name";
    nameEl.textContent = entry.spell.label;

    const progressFill = document.createElement("div");
    progressFill.classList.add("progressFill", "spell-cast-progress");

    boxEl.appendChild(nameEl);
    boxEl.appendChild(progressFill);
    entry.spell.button = boxEl;

    if (entry.id === "attunement") {
      renderAttunementPips(boxEl);
    }

    renderSpellExperienceBar(entry.id, boxEl);

    const isActiveSpell = isActivityActive() && gameState.activity.kind === "spell" && gameState.activity.id === entry.id;
    const canCastCurrentSpell = canCastSpell(entry.id);

    if (isActiveSpell) {
      boxEl.classList.add("tonic-filled");
      boxEl.title = "Casting " + entry.spell.label;
    } else if (canCastCurrentSpell) {
      boxEl.classList.add("tonic-filled");
      boxEl.title = "Open " + entry.spell.label + " options";
    } else if (isActivityActive()) {
      boxEl.title = "Open " + entry.spell.label + " details. Something else is in progress.";
    } else {
      boxEl.title = "Open " + entry.spell.label + " details.";
    }

    ui.spellSlots.appendChild(renderedSlot.slot);
  });

  renderOpenSpellTargetMenu();
  renderMagicWorkflowPanel();
  renderSpellProgressSummary();
}

function getUnlockedSpellEntries() {
  const spells = getSpellDefinitions();
  const entries = [];

  for (let spellName in spells) {
    const spell = getSpell(spellName);

    if (spell && spell.unlocked) {
      entries.push({
        id: spellName,
        spell,
      });
    }
  }

  return entries;
}

function renderMagicWorkflowPanel() {
  if (!ui.magicWorkflowPanel) return;

  const unlockedSpells = getUnlockedSpellEntries();
  const magicActions = ["meditate", "concentrateTonicBase", "concentrateManaTonicBase"].filter(function (actionName) {
    const action = getAction(actionName);

    return action && action.unlocked && isActionContextAvailable(actionName);
  });
  const activeSpell = isActivityActive() && gameState.activity.kind === "spell" ? getSpell(gameState.activity.id) : null;
  const mana = getResource("mana");
  const meta = [
    {
      label: "Mana",
      value: mana ? formatResourceAmountForDisplay(mana.value) + " / " + mana.maxValue : "0",
    },
    {
      label: "Spells",
      value: String(unlockedSpells.length),
    },
  ];

  if (typeof getAttunementActiveSummaryText === "function" && getSpell("attunement") && getSpell("attunement").unlocked) {
    meta.push({
      label: "Attunement",
      value: getAttunementActiveSummaryText(),
    });
  }

  renderUiContextPanel(ui.magicWorkflowPanel, {
    title: activeSpell ? activeSpell.label : unlockedSpells.length > 0 ? "Spellwork" : "Mana Practice",
    status: activeSpell ? "Casting" : magicActions.length > 0 || unlockedSpells.length > 0 ? "Ready" : "Quiet",
    body:
      unlockedSpells.length > 0
        ? "Open a spell slot to choose a target, or use practice actions below."
        : "Practice magic as new methods become available.",
    meta,
    className: "magic-workflow-summary",
  });
}

function renderSpellProgressSummary() {
  if (!ui.magicProgressSection || !ui.spellProgressList) return;

  ui.spellProgressList.innerHTML = "";

  const entries = getUnlockedSpellEntries().filter(function (entry) {
    return !!getSpellProgressDefinition(entry.id);
  });

  if (entries.length === 0) {
    hideElement(ui.magicProgressSection);
    return;
  }

  showElement(ui.magicProgressSection, "block");

  entries.forEach(function (entry) {
    const progressEntry = createSpellProgressEntry(entry.id);

    if (progressEntry) {
      ui.spellProgressList.appendChild(progressEntry);
    }
  });
}

function createSpellProgressEntry(spellName) {
  if (spellName === "manaSense") return createManaSenseExperienceEntry();
  if (spellName === "attunement") return createAttunementExperienceEntry();
  if (spellName === "imbue") return createImbueExperienceEntry();
  if (spellName === "arcaneForce") return createArcaneForceExperienceEntry();
  if (spellName === "ward") return createWardExperienceEntry();

  return null;
}

function unlockSpell(spellName) {
  const spell = getSpell(spellName);

  if (!spell) {
    console.warn("Unknown spell:", spellName);
    return;
  }

  spell.unlocked = true;
  updateEquipmentSlotUI();
  updateExpeditionLoadoutVisibility();
}

function getCurrentManaSenseReveal() {
  const place = getCurrentManaSensePlace();

  if (!place || !place.manaSenseReveal) return null;

  const reveal = place.manaSenseReveal;

  if (gameState.magic.sensedReveals[reveal.id]) return null;

  return reveal;
}

function getCurrentManaSensePlace() {
  if (gameState.expedition.currentLocation) {
    return getExpeditionLocation(gameState.expedition.currentLocation);
  }

  if (gameState.discoveredClearing) {
    return getClearingPlace();
  }

  return null;
}

function canCastSpell(spellName) {
  if (typeof isCombatActive === "function" && isCombatActive()) return false;
  const spell = getSpell(spellName);
  const context = getSpellCastContext(spellName);

  if (!spell || !spell.unlocked) return false;
  if (isActivityActive()) return false;
  if (context && !canAffordCost(getSpellCastCost(spellName, context))) return false;

  if (spellName === "manaSense") {
    return !!context || hasAvailableManaSenseTarget();
  }

  if (context && context.type === "locationObjectSpellCharge") {
    return true;
  }

  if (context && context.type === "dungeonSpellCharge") {
    return true;
  }

  if (spellName === "attunement") {
    return hasAvailableAttunementTarget();
  }

  if (isProductionSpell(spellName)) {
    return hasAvailableProductionSpellTarget(spellName);
  }

  return false;
}

function hasAvailableAttunementTarget() {
  const definitions = getAttunementDefinitions();

  for (let attunementName in definitions) {
    if (canApplyAttunement(attunementName)) {
      return true;
    }
  }

  return false;
}

function castSpell(spellName) {
  const spell = getSpell(spellName);
  const context = getSpellCastContext(spellName);
  const cost = getSpellCastCost(spellName, context);

  if (!spell || !canCastSpell(spellName)) return;
  if (!spendCost(cost)) return;

  if (!startActivity({ kind: "spell", id: spellName, context: context })) {
    refundCost(cost);
    return;
  }

  updateAllResources();
  updateEquipmentSlotUI();
  updateAllActionButtons();
  updateCraftingButtons();
}

function canAddManaSenseDungeonCharge() {
  const node = getCurrentDungeonNode();
  const spell = getSpell("manaSense");

  if (!node || !node.search || node.explored) return false;

  const maxCharges = spell.effects.maxDungeonCharges || 0;

  return (node.manaSenseCharges || 0) < maxCharges;
}

function getLocationObjectSpellInteraction(object, spellName) {
  if (!object) return null;

  if (object.spellInteractions && object.spellInteractions[spellName]) {
    return object.spellInteractions[spellName];
  }

  if (spellName === "manaSense" && object.manaSense) {
    return object.manaSense;
  }

  return null;
}

function getCurrentLocationObjectSpellTarget(spellName) {
  const locationName = getCurrentObjectPlaceName();
  const place = getObjectPlace(locationName);

  if (!locationName || !place || !place.explorableObjects) return null;

  for (let objectName in place.explorableObjects) {
    const object = getLocationObject(locationName, objectName);
    const interaction = getLocationObjectSpellInteraction(object, spellName);

    if (!object || !interaction) continue;
    if (isLocationObjectComplete(object)) continue;
    if (!isLocationObjectAvailable(object, { ignoreSpellCharges: true, ignoreManaSenseCharges: true })) continue;

    const required = interaction.required || 1;

    if (getLocationObjectSpellCharge(object, spellName) >= required) continue;

    return {
      locationName,
      objectName,
    };
  }

  return null;
}

function getCurrentManaSenseLocationObjectTarget() {
  return getCurrentLocationObjectSpellTarget("manaSense");
}

function canAddLocationObjectSpellCharge(spellName) {
  return !!getCurrentLocationObjectSpellTarget(spellName);
}

function canAddManaSenseLocationObjectCharge() {
  return canAddLocationObjectSpellCharge("manaSense");
}

function getManaSenseTargetContext(targetName) {
  const definition = getManaSenseDefinition(targetName);

  if (!definition) return null;

  return {
    type: "manaSenseTarget",
    targetId: targetName,
  };
}

function hasAvailableManaSenseTarget() {
  const definitions = getManaSenseDefinitions();

  for (let targetName in definitions) {
    if (canApplyManaSenseTarget(targetName)) return true;
  }

  return false;
}

function isManaSenseTargetVisible(targetName) {
  const definition = getManaSenseDefinition(targetName);

  if (!definition) return false;
  if (getManaSenseLevel() < (definition.requiredManaSenseLevel || 0)) return false;
  if (definition.requiredLocation && gameState.expedition.currentLocation !== definition.requiredLocation) return false;

  return true;
}

function isManaSenseTargetActive(targetName) {
  if (targetName === "stoneSense" && typeof hasStoneSenseActive === "function") {
    return hasStoneSenseActive();
  }

  if (targetName === "sensePrey" && typeof hasSensePreyActive === "function") {
    return hasSensePreyActive();
  }

  return false;
}

function canApplyManaSenseTarget(targetName) {
  const definition = getManaSenseDefinition(targetName);

  if (!definition) return false;
  if (!getSpell("manaSense")?.unlocked) return false;
  if (isActivityActive()) return false;
  if (!isManaSenseTargetVisible(targetName)) return false;
  if (isManaSenseTargetActive(targetName)) return false;

  return canAffordCost(definition.cost || {});
}

function getDungeonNodeSpellInteraction(node, spellName) {
  if (!node || !node.spellInteractions) return null;

  return node.spellInteractions[spellName] || null;
}

function getCurrentDungeonSpellTarget(spellName) {
  const dungeonState = getCurrentDungeonState();
  const currentNode = getCurrentDungeonNode();

  if (!dungeonState || !dungeonState.active || !currentNode || !currentNode.exits) return null;

  for (let i = 0; i < currentNode.exits.length; i++) {
    const targetNodeId = currentNode.exits[i].to;
    const node = getDungeonNode(dungeonState.dungeonId, targetNodeId);
    const interaction = getDungeonNodeSpellInteraction(node, spellName);

    if (!node || !interaction) continue;
    if (canEnterDungeonNode(dungeonState.dungeonId, targetNodeId)) continue;

    if (spellName === "arcaneForce" && getArcaneForceLevel() < (interaction.requiredForceLevel || 0)) continue;

    const required = interaction.required || 1;

    if (getDungeonNodeSpellCharge(node, spellName) >= required) continue;

    return {
      dungeonId: dungeonState.dungeonId,
      nodeId: targetNodeId,
      spellName,
    };
  }

  return null;
}

function getSpellCastContext(spellName) {
  if (spellName === "manaSense") {
    const reveal = getCurrentManaSenseReveal();

    if (reveal) {
      return {
        type: "reveal",
        revealId: reveal.id,
        story: reveal.story,
        journal: reveal.journal,
        popup: reveal.popup,
      };
    }

    const objectTarget = getCurrentLocationObjectSpellTarget("manaSense");

    if (objectTarget) {
      return {
        type: "locationObjectSpellCharge",
        locationName: objectTarget.locationName,
        objectName: objectTarget.objectName,
        spellName: "manaSense",
      };
    }

    const dungeonState = getCurrentDungeonState();
    const node = getCurrentDungeonNode();

    if (dungeonState && dungeonState.active && node && canAddManaSenseDungeonCharge()) {
      return {
        type: "dungeonCharge",
        dungeonId: dungeonState.dungeonId,
        nodeId: dungeonState.nodeId,
      };
    }
  }

  const dungeonTarget = getCurrentDungeonSpellTarget(spellName);

  if (dungeonTarget) {
    return {
      type: "dungeonSpellCharge",
      dungeonId: dungeonTarget.dungeonId,
      nodeId: dungeonTarget.nodeId,
      spellName: dungeonTarget.spellName,
    };
  }

  const objectTarget = getCurrentLocationObjectSpellTarget(spellName);

  if (objectTarget) {
    return {
      type: "locationObjectSpellCharge",
      locationName: objectTarget.locationName,
      objectName: objectTarget.objectName,
      spellName: spellName,
    };
  }

  return null;
}

function getCompletedSpellManaControlCost(spellName, context) {
  if (context && context.type === "locationObjectSpellCharge") {
    return getSpellCastCost(spellName, context);
  }

  if (context && context.type === "dungeonSpellCharge") {
    return getSpellCastCost(spellName, context);
  }

  if (spellName === "attunement" && context && context.type === "attunement") {
    const definition = getAttunementDefinition(context.attunementId);

    return definition ? definition.cost || {} : {};
  }

  if (spellName === "manaSense" && context && context.type === "manaSenseTarget") {
    const definition = getManaSenseDefinition(context.targetId);

    return definition ? definition.cost || {} : {};
  }

  if (isProductionSpell(spellName) && context && context.type === "productionSpell" && context.spellName === spellName) {
    const targetContext = getProductionSpellTargetContext(spellName, context.targetId, context);

    return targetContext ? targetContext.cost || {} : {};
  }

  return getSpellCastCost(spellName, context);
}

function getCompletedSpellManaSpent(spellName, context) {
  const cost = getCompletedSpellManaControlCost(spellName, context);

  if (!cost || !Number.isFinite(cost.mana)) return 0;

  return roundResourceAmount(cost.mana);
}

function getCompletedSpellManaControlLabel(spellName, context) {
  if (spellName === "manaSense" && context && context.type === "manaSenseTarget") {
    const definition = getManaSenseDefinition(context.targetId);

    return definition ? definition.label : context.targetId;
  }

  const actualSpellName =
    context && (context.type === "locationObjectSpellCharge" || context.type === "dungeonSpellCharge") && context.spellName
      ? context.spellName
      : spellName;
  const spell = getSpell(actualSpellName);

  return spell ? spell.label : actualSpellName;
}

function recordCompletedSpellManaControl(spellName, context, manaSpent) {
  if (!Number.isFinite(manaSpent) || manaSpent <= 0) return;
  if (typeof recordManaControl !== "function") return;

  recordManaControl(manaSpent, getCompletedSpellManaControlLabel(spellName, context));
}

function completeSpellCast(spellName, context) {
  const manaControlEnabled = typeof isManaControlSystemEnabled !== "function" || isManaControlSystemEnabled();
  const manaSpent = getCompletedSpellManaSpent(spellName, context);
  const manaControlManaSpent = manaControlEnabled ? manaSpent : 0;
  let completedSuccessfully = false;

  if (spellName === "ward" && context && context.type === "ward") {
    completeWardChannel(context);
    return;
  }

  if (context && context.type === "locationObjectSpellCharge") {
    const addedCharge = addLocationObjectSpellCharge(context.locationName, context.objectName, context.spellName);

    if (addedCharge) {
      recordCompletedSpellManaControl(spellName, context, manaControlManaSpent);
      recordSpellProgressExperience(context.spellName, manaSpent);
    }

    updateEquipmentSlotUI();
    updateAllActionButtons();
    updateCraftingButtons();
    return;
  }

  if (context && context.type === "dungeonSpellCharge") {
    completedSuccessfully = addDungeonNodeSpellCharge(context.dungeonId, context.nodeId, context.spellName) || completedSuccessfully;
  }

  if (spellName === "manaSense") {
    if (context && context.type === "reveal") {
      resolveManaSenseReveal(context);
      completedSuccessfully = true;
    }

    if (context && context.type === "dungeonCharge") {
      addManaSenseDungeonChargeForNode(context.dungeonId, context.nodeId);
      completedSuccessfully = true;
    }

    if (context && context.type === "locationObjectCharge") {
      addLocationObjectSpellCharge(context.locationName, context.objectName, "manaSense");
      completedSuccessfully = true;
    }

    if (context && context.type === "manaSenseTarget") {
      completedSuccessfully = applyManaSenseTarget(context.targetId) || completedSuccessfully;
    }
  }

  if (spellName === "attunement") {
    if (context && context.type === "attunement") {
      completedSuccessfully = applyAttunement(context.attunementId) || completedSuccessfully;
    }
  }

  if (isProductionSpell(spellName)) {
    if (context && context.type === "productionSpell" && context.spellName === spellName) {
      completedSuccessfully = applyProductionSpellTarget(spellName, context.targetId, context) || completedSuccessfully;
    }

    if (spellName === "imbue" && context && context.type === "imbue") {
      completedSuccessfully = applyImbue(context.imbueId) || completedSuccessfully;
    }
  }

  if (completedSuccessfully) {
    recordCompletedSpellManaControl(spellName, context, manaControlManaSpent);

    recordSpellProgressExperience(spellName, manaSpent);
  }

  updateEquipmentSlotUI();
  updateAllActionButtons();
  updateCraftingButtons();
}

function addManaSenseDungeonChargeForNode(dungeonId, nodeId) {
  const node = getDungeonNode(dungeonId, nodeId);
  const spell = getSpell("manaSense");

  if (!node || !node.search || node.explored) return false;

  const maxCharges = spell.effects.maxDungeonCharges || 0;
  const currentCharges = node.manaSenseCharges || 0;

  if (currentCharges >= maxCharges) return false;

  node.manaSenseCharges = currentCharges + 1;

  addStoryEntry("Mana Sense sharpens the shape of " + node.label + " in your mind.");

  updateDungeonUI();

  return true;
}

function addDungeonNodeSpellCharge(dungeonId, nodeId, spellName) {
  const node = getDungeonNode(dungeonId, nodeId);
  const interaction = getDungeonNodeSpellInteraction(node, spellName);

  if (!node || !interaction) return false;

  const required = interaction.required || 1;
  const currentCharges = getDungeonNodeSpellCharge(node, spellName);

  if (currentCharges >= required) return false;

  setDungeonNodeSpellCharge(node, spellName, currentCharges + 1);

  const stories = interaction.stories || [];
  const story = stories[Math.min(currentCharges, stories.length - 1)];
  const spell = getSpell(spellName);

  addStoryEntry(story || (spell ? spell.label : spellName) + " shifts the lock on " + node.label + ".");
  updateDungeonUI();

  return true;
}

function addLocationObjectSpellCharge(locationName, objectName, spellName) {
  const place = getObjectPlace(locationName);
  const object = getLocationObject(locationName, objectName);
  const interaction = getLocationObjectSpellInteraction(object, spellName);
  const spell = getSpell(spellName);

  if (!place || !object || !interaction) return false;

  const required = interaction.required || 1;
  const currentCharges = getLocationObjectSpellCharge(object, spellName);

  if (currentCharges >= required) return false;

  setLocationObjectSpellCharge(object, spellName, currentCharges + 1);

  const stories = interaction.stories || [];
  const story = stories[currentCharges];

  if (story) {
    addStoryEntry(story);
  } else {
    const spellLabel = spell ? spell.label : spellName;
    addStoryEntry(spellLabel + " sharpens your understanding of " + object.label + ".");
  }

  updateLocationObjectActionsUI(place);

  return true;
}

function addManaSenseLocationObjectCharge(locationName, objectName) {
  return addLocationObjectSpellCharge(locationName, objectName, "manaSense");
}

function resolveManaSenseReveal(revealContext) {
  const reveal = revealContext || getCurrentManaSenseReveal();

  if (!reveal) return;

  const revealId = reveal.revealId || reveal.id;

  if (!revealId || gameState.magic.sensedReveals[revealId]) return;

  gameState.magic.sensedReveals[revealId] = true;

  if (reveal.story) {
    addStoryEntry(reveal.story);
  }

  if (reveal.journal) {
    addJournalEntry(reveal.journal);
  }

  if (reveal.popup === "campFoundation") {
    showCampFoundationPopup();
  }
}

function repairSpellUnlocksFromFlags() {
  const spells = getSpellDefinitions();

  for (let spellName in spells) {
    const spell = getSpell(spellName);

    if (spell && spell.unlockFlag && gameState[spell.unlockFlag]) {
      spell.unlocked = true;
    }
  }
}

function getPurchasedEquipmentSlots(equipmentType) {
  const gearDefinitions = getGearUpgradeDefinitions();
  const slots = {};

  for (let gearName in gearDefinitions) {
    const gear = getGearUpgrade(gearName);

    if (!gear || gear.equipmentType !== equipmentType || !gear.slot || !gear.purchased) continue;

    if (!slots[gear.slot]) {
      slots[gear.slot] = {
        label: gear.slotLabel,
        order: gear.slotOrder || 99,
        current: gear,
      };
    }

    if ((gear.slotRank || 0) > (slots[gear.slot].current.slotRank || 0)) {
      slots[gear.slot].current = gear;
    }
  }

  return Object.values(slots).sort(function (a, b) {
    return a.order - b.order;
  });
}

function updateGearUpgradeUI(upgradeName) {
  const upgrade = getGearUpgrade(upgradeName);

  if (!upgrade) return;

  if (gameState.phase === "expedition") {
    showElement(ui.gearSection);
  }

  if (upgrade.button) {
    upgrade.button.style.display = isCraftContextAvailable(upgrade) && upgrade.unlocked && !upgrade.purchased ? "grid" : "none";
    if (upgrade.unlocked && !upgrade.purchased) {
      updateCraftButtonLabel("gearUpgrade", upgradeName);
    }
  }

  updateEquipmentSlotUI();
  updateCraftingSectionVisibility();
}

function unlockGearUpgrade(upgradeName) {
  const upgrade = getGearUpgrade(upgradeName);

  if (!upgrade) {
    console.warn("Unknown gear upgrade:", upgradeName);
    return;
  }

  if (upgrade.purchased || upgrade.unlocked) return;

  upgrade.unlocked = true;
  updateGearUpgradeUI(upgradeName);
  updateExpeditionLoadoutVisibility();
  updateCraftingSectionVisibility();
}

function buyGearUpgrade(upgradeName) {
  startCrafting("gearUpgrade", upgradeName);
}

function completeGearUpgrade(upgradeName) {
  const upgrade = getGearUpgrade(upgradeName);

  if (!upgrade || !upgrade.unlocked || upgrade.purchased) return;

  upgrade.purchased = true;
  upgrade.unlocked = false;
  upgrade.onComplete();

  updateGearUpgradeUI(upgradeName);
  updateExpeditionLoadoutVisibility();
}

function updateCraftingSectionVisibility() {
  if (!ui.craftingSection) return;

  if (hasDiscoveredCraftingContent()) {
    showElement(ui.craftingSection, "flex");
  } else {
    hideElement(ui.craftingSection);
  }
}

function hasDiscoveredCraftingContent() {
  const craftGroups = [getCampUpgradeDefinitions(), getGearUpgradeDefinitions(), getResourceCraftDefinitions(), getResearchDefinitions()];

  return craftGroups.some(function (definitions) {
    return Object.keys(definitions).some(function (entryName) {
      const entry = definitions[entryName];
      return !!entry && (!!entry.unlocked || !!entry.purchased || !!entry.completed);
    });
  });
}

function getCraftDefinition(craftType, craftId) {
  if (craftType === "campUpgrade") return getCampUpgrade(craftId);
  if (craftType === "gearUpgrade") return getGearUpgrade(craftId);

  if (craftType === "resourceCraft") {
    return getResourceCraft(craftId);
  }

  if (craftType === "research") {
    return getResearch(craftId);
  }

  console.warn("Unknown craft type:", craftType);
  return null;
}

function hasAvailableResearch() {
  const researchDefinitions = getResearchDefinitions();

  for (let researchName in researchDefinitions) {
    if (isCraftAvailable("research", researchName)) return true;
  }

  return false;
}

function hasAvailableResourceCraft() {
  const crafts = getResourceCraftDefinitions();

  for (let craftName in crafts) {
    if (isCraftAvailable("resourceCraft", craftName)) return true;
  }

  return false;
}

function getCraftCost(craftType, craftId) {
  const craft = getCraftDefinition(craftType, craftId);

  if (!craft) return null;

  if (craftType === "research") {
    return getResearchCost(craftId);
  }

  if (craftType === "resourceCraft") {
    const context = getActiveCraftContext(craft);

    return context ? context.cost : craft.cost;
  }

  return craft.cost;
}

function getCraftDuration(craftType, craftId) {
  const craft = getCraftDefinition(craftType, craftId);

  if (!craft) return 1;

  if (craftType === "research") {
    return getResearchDuration(craftId);
  }

  return craft.duration || 1;
}

function shouldContinueCrafting(craftType, craftId) {
  const craft = getCraftDefinition(craftType, craftId);
  const cost = getCraftCost(craftType, craftId);
  const storageCost = getCraftStorageCost(craftType, craftId);

  if (!craft || !craft.auto || !cost) return false;
  if (!isCraftAvailable(craftType, craftId)) return false;
  if (!canAffordCost(cost)) return false;
  if (!canAffordStorageCost(storageCost)) return false;

  return true;
}

function startCrafting(craftType, craftId) {
  if (isActivityActive()) return;

  const craft = getCraftDefinition(craftType, craftId);
  const cost = getCraftCost(craftType, craftId);
  const craftContext = getActiveCraftContext(craft);
  const storageCost = craftContext ? craftContext.storageCost : null;

  if (!craft || !cost) return;
  if (!isCraftAvailable(craftType, craftId)) return;
  if (!spendCost(cost)) return;
  if (!spendStorageCost(storageCost)) {
    refundCost(cost);
    return;
  }

  updateLocationStorageUI(getExpeditionLocation(gameState.expedition.currentLocation));

  startActivity({
    kind: "craft",
    type: craftType,
    id: craftId,
    context: craftContext ? { mode: craftContext.mode } : null,
  });

  updateCraftingButtons();
  updateAllActionButtons();

  if (craftType === "research") {
    updateSelectedResearchButtonState();
  }
}

function isCraftAvailable(craftType, craftId) {
  const craft = getCraftDefinition(craftType, craftId);
  const context = getActiveCraftContext(craft);

  if (!craft) return false;
  if (!context) return false;
  if (!canAffordStorageCost(context.storageCost)) return false;

  if (context.producesConsumable && !hasConsumableSpace(context.producesConsumable.resource, context.producesConsumable.amount)) {
    return false;
  }

  if (craftType === "campUpgrade") {
    return craft.unlocked && !craft.purchased;
  }

  if (craftType === "gearUpgrade") {
    return craft.unlocked && !craft.purchased;
  }

  if (craftType === "resourceCraft") {
    return isResourceCraftUnlockedForContext(craft, context);
  }

  if (craftType === "research") {
    if (!isCampWorkContextAvailable()) return false;

    return craft.unlocked && !craft.completed && !craft.blocked;
  }

  return false;
}

function updateCraftingButtons() {
  updateCraftButtonsForType("campUpgrade", getCampUpgradeDefinitions());
  updateCraftButtonsForType("gearUpgrade", getGearUpgradeDefinitions());
  updateCraftButtonsForType("resourceCraft", getResourceCraftDefinitions());
  updateCraftButtonsForType("research", getResearchDefinitions());
}

function updateCraftButtonsForType(craftType, definitions) {
  for (let craftId in definitions) {
    const craft = getCraftDefinition(craftType, craftId);

    if (!craft || !craft.button) continue;

    const isActiveCraft =
      isActivityActive() && gameState.activity.kind === "craft" && gameState.activity.type === craftType && gameState.activity.id === craftId;

    const available = isCraftAvailable(craftType, craftId);
    const cost = getCraftCost(craftType, craftId);

    craft.button.disabled = !isActiveCraft && (!available || isActivityActive() || !canAffordCost(cost));

    let uiAvailability = { state: "ready", reason: "" };

    if (isActiveCraft) {
      uiAvailability = { state: "running", reason: "Workbench task in progress" };
    } else if (isActivityActive()) {
      uiAvailability = { state: "busy", reason: "Another task is in progress" };
    } else if (!available) {
      uiAvailability = { state: "wrong-context", reason: "Requirements are not met for this work" };
    } else if (!canAffordCost(cost)) {
      uiAvailability = { state: "unaffordable", reason: getUiCostShortfall(cost) || "Insufficient resources" };
    }

    if (typeof applyUiActionState === "function") {
      applyUiActionState(craft.button, uiAvailability, "craft:" + craftType + ":" + craftId);
    }

    if (isActiveCraft) {
      craft.button.classList.add("running");
    } else {
      craft.button.classList.remove("running");
    }
  }
}

function completeResourceCraft(craftName) {
  const craft = getResourceCraft(craftName);
  const context = getActiveCraftContext(craft);

  if (!craft || !context || (!context.produces && !context.storageProduces && !context.producesConsumable)) return;

  if (context.storageProduces) {
    addStorageProduces(context.storageProduces);
    updateLocationStorageUI(getExpeditionLocation(gameState.expedition.currentLocation));
  } else if (context.producesConsumable) {
    for (let i = 0; i < context.producesConsumable.amount; i++) {
      addConsumableToSlot(context.producesConsumable.resource);
    }

    refreshExpeditionUI();
    updateEquipmentSlotUI();
  } else {
    addResource(context.produces.resource, context.produces.amount);

    if (typeof unlockResource === "function") {
      unlockResource(context.produces.resource);
    }
  }

  updateResourceCraftUI(craftName);
}

function hookResourceCraftsToUI() {
  const crafts = getResourceCraftDefinitions();

  for (let craftName in crafts) {
    const craft = getResourceCraft(craftName);

    craft.button = ensureCraftingButton(craftName + "CraftBtn");

    if (craft.button) {
      prepareCraftButton(craft.button);

      if (!craft.button.dataset.resourceCraftHooked) {
        craft.button.addEventListener("click", function () {
          startCrafting("resourceCraft", craftName);
        });

        craft.button.dataset.resourceCraftHooked = "true";
      }
    }

    updateResourceCraftUI(craftName);
  }

  updateCraftingSectionVisibility();
}

function updateResourceCraftUI(craftName) {
  const craft = getResourceCraft(craftName);
  const context = getActiveCraftContext(craft);

  if (!craft || !craft.button) return;

  craft.button.style.display = context && isResourceCraftUnlockedForContext(craft, context) ? "grid" : "none";
  updateCraftButtonLabel("resourceCraft", craftName);
  updateCraftingButtons();
}

function updateResourceCraftsUI() {
  const crafts = getResourceCraftDefinitions();

  for (let craftName in crafts) {
    updateResourceCraftUI(craftName);
  }

  updateCraftingSectionVisibility();
}

function setCraftButtonProgress(button, progress) {
  const progressFill = button.querySelector(".progressFill");

  if (progressFill) {
    progressFill.style.width = progress * 100 + "%";
  }
}

function resetCraftButtonProgress(button) {
  setCraftButtonProgress(button, 0);
}

function hasAvailableCampUpgrade() {
  const upgrades = getCampUpgradeDefinitions();

  for (let upgradeName in upgrades) {
    if (isCraftAvailable("campUpgrade", upgradeName)) return true;
  }

  return false;
}

function hasAvailableGearUpgrade() {
  const upgrades = getGearUpgradeDefinitions();

  for (let upgradeName in upgrades) {
    if (isCraftAvailable("gearUpgrade", upgradeName)) return true;
  }

  return false;
}

function isCraftContextAvailable(craft) {
  return !!getActiveCraftContext(craft);
}

function updateCraftingUIForCurrentContext() {
  const campUpgrades = getCampUpgradeDefinitions();

  for (let upgradeName in campUpgrades) {
    updateCampUpgradeUI(upgradeName);
  }

  const gearUpgrades = getGearUpgradeDefinitions();

  for (let upgradeName in gearUpgrades) {
    updateGearUpgradeUI(upgradeName);
  }

  updateResourceCraftsUI();

  updateCraftingButtons();
  updateCraftingSectionVisibility();
  updateWorkTabsVisibility();
  renderContextualCraftingSpellActions();

  if (ui.researchPanel && ui.researchPanel.style.display !== "none") {
    updateResearchHistoryUI();
  }
}

function getCurrentCraftLocationStorage() {
  const location = getExpeditionLocation(gameState.expedition.currentLocation);

  if (!location || !location.storage) return null;

  return location.storage;
}

function canAffordStorageCost(cost) {
  if (!cost) return true;

  const storage = getCurrentCraftLocationStorage();

  if (!storage) return false;

  for (let resourceName in cost) {
    if (!storage[resourceName] || storage[resourceName] < cost[resourceName]) {
      return false;
    }
  }

  return true;
}

function spendStorageCost(cost) {
  if (!cost) return true;
  if (!canAffordStorageCost(cost)) return false;

  const storage = getCurrentCraftLocationStorage();

  for (let resourceName in cost) {
    storage[resourceName] -= cost[resourceName];
  }

  return true;
}

function addStorageProduces(produces) {
  if (!produces) return;

  const storage = getCurrentCraftLocationStorage();

  if (!storage) return;

  for (let resourceName in produces) {
    if (!storage[resourceName]) {
      storage[resourceName] = 0;
    }

    storage[resourceName] += produces[resourceName];
  }
}

function isResearchSpotPurchased() {
  return hasPurchasedCampUpgrade("researchSpot");
}

function isCampWorkContextAvailable() {
  return !gameState.expedition.active && !gameState.expedition.currentLocation;
}

function updateWorkTabsVisibility() {
  if (!ui.workTabs) return;

  const canUseCampWork = isCampWorkContextAvailable();
  const hasCrafting = hasDiscoveredCraftingContent();
  const hasResearch = canUseCampWork && isResearchSpotPurchased();
  const hasAutomation = canUseCampWork && hasUnlockedAutomation();

  if (hasCrafting || hasResearch || hasAutomation) {
    showElement(ui.workTabs, "flex");
  } else {
    hideElement(ui.workTabs);
    showWorkPanel("crafting");
  }

  if ((!hasResearch && ui.researchPanel && ui.researchPanel.style.display !== "none") || (!hasAutomation && ui.automationPanel && ui.automationPanel.style.display !== "none")) {
    showWorkPanel("crafting");
  }

  if (ui.craftingTabBtn) {
    ui.craftingTabBtn.style.display = hasCrafting ? "inline-block" : "none";
  }

  if (ui.researchTabBtn) {
    ui.researchTabBtn.style.display = hasResearch ? "inline-block" : "none";
  }

  if (ui.automationTabBtn) {
    ui.automationTabBtn.style.display = hasAutomation ? "inline-block" : "none";
  }

  if (typeof syncMajorSystemUnlocks === "function") {
    syncMajorSystemUnlocks();
  }
}

function showWorkPanel(panelName, options = {}) {
  const canUseCampWork = isCampWorkContextAvailable();
  const showingResearch = canUseCampWork && panelName === "research" && isResearchSpotPurchased();
  const showingAutomation = canUseCampWork && panelName === "automation" && hasUnlockedAutomation();
  const showingCrafting = !showingResearch && !showingAutomation;

  if (options.userSelected && typeof markMajorSystemSeen === "function") {
    if (showingResearch) markMajorSystemSeen("research");
    if (showingAutomation) markMajorSystemSeen("automation");
  }

  if (ui.craftingPanel) {
    ui.craftingPanel.style.display = showingCrafting ? "block" : "none";
  }

  if (ui.researchPanel) {
    ui.researchPanel.style.display = showingResearch ? "block" : "none";
  }

  if (ui.automationPanel) {
    ui.automationPanel.style.display = showingAutomation ? "block" : "none";
  }

  if (ui.craftingTabBtn) {
    ui.craftingTabBtn.classList.toggle("active", showingCrafting);
    ui.craftingTabBtn.setAttribute("aria-selected", String(showingCrafting));
    ui.craftingTabBtn.setAttribute("tabindex", showingCrafting ? "0" : "-1");
  }

  if (ui.researchTabBtn) {
    ui.researchTabBtn.classList.toggle("active", showingResearch);
    ui.researchTabBtn.setAttribute("aria-selected", String(showingResearch));
    ui.researchTabBtn.setAttribute("tabindex", showingResearch ? "0" : "-1");
  }

  if (ui.automationTabBtn) {
    ui.automationTabBtn.classList.toggle("active", showingAutomation);
    ui.automationTabBtn.setAttribute("aria-selected", String(showingAutomation));
    ui.automationTabBtn.setAttribute("tabindex", showingAutomation ? "0" : "-1");
  }

  if (ui.craftingPanel) ui.craftingPanel.setAttribute("aria-hidden", String(!showingCrafting));
  if (ui.researchPanel) ui.researchPanel.setAttribute("aria-hidden", String(!showingResearch));
  if (ui.automationPanel) ui.automationPanel.setAttribute("aria-hidden", String(!showingAutomation));

  if (showingResearch) updateResearchHistoryUI();
  if (showingAutomation) updateAutomationUI();
}

const PROJECT_WORK_MODE_ENERGY = "energy";
const PROJECT_WORK_MODE_ARCANE_FORCE = "arcaneForce";
const PROJECT_WORK_MODE_IMBUE_HEART = "imbueHeart";
const TOWER_PROJECT_SEQUENCE = ["towerFoundation", "towerBasement"];

function isTowerFoundationProject(projectName) {
  return projectName === "towerFoundation";
}

function isTowerProject(projectName) {
  return TOWER_PROJECT_SEQUENCE.indexOf(projectName) !== -1;
}

function isProjectArcaneForceWorkMode(projectName, mode) {
  return isTowerProject(projectName) && mode === PROJECT_WORK_MODE_ARCANE_FORCE;
}

function isProjectImbueHeartWorkMode(projectName, mode) {
  return isTowerProject(projectName) && isTowerFoundationHeartActivationLevel(projectName) && mode === PROJECT_WORK_MODE_IMBUE_HEART;
}

function isTowerFoundationHeartActivationLevel(projectName) {
  const level = getProjectCurrentLevel(projectName);

  return isTowerProject(projectName) && !!(level && level.activationSpell === "imbue");
}

function getNormalizedProjectWorkMode(projectName, mode) {
  if (isProjectImbueHeartWorkMode(projectName, mode)) return PROJECT_WORK_MODE_IMBUE_HEART;
  if (isProjectArcaneForceWorkMode(projectName, mode)) return PROJECT_WORK_MODE_ARCANE_FORCE;

  return PROJECT_WORK_MODE_ENERGY;
}

function getProjectLevelWorkYield(projectName, mode) {
  const definition = getProjectDefinition(projectName);
  const level = getProjectCurrentLevel(projectName);

  if (!definition || !level) return 0;

  if (isProjectImbueHeartWorkMode(projectName, mode)) {
    return Number.isFinite(level.activationYield) ? level.activationYield : 0;
  }

  const baseYield = Number.isFinite(level.workYield) ? level.workYield : 0;

  if (isProjectArcaneForceWorkMode(projectName, mode)) {
    const multiplier = Number.isFinite(definition.arcaneForceWorkMultiplier) ? definition.arcaneForceWorkMultiplier : 3;
    return baseYield * multiplier;
  }

  return baseYield;
}

function getProjectLevelWorkCost(projectName, mode = PROJECT_WORK_MODE_ENERGY) {
  const definition = getProjectDefinition(projectName);
  const level = getProjectCurrentLevel(projectName);

  if (!definition) return {};

  if (isProjectImbueHeartWorkMode(projectName, mode)) {
    return (level && level.activationCost) || { mana: 10 };
  }

  if (isProjectArcaneForceWorkMode(projectName, mode)) {
    return definition.arcaneForceWorkCost || { mana: 10 };
  }

  return definition.workCost || {};
}

function getProjectLevelWorkButton(projectName, mode = PROJECT_WORK_MODE_ENERGY) {
  const definition = getProjectDefinition(projectName);
  const normalizedMode = getNormalizedProjectWorkMode(projectName, mode);

  if (!definition) return null;

  if (definition.workButtons && definition.workButtons[normalizedMode]) {
    return definition.workButtons[normalizedMode];
  }

  return definition.workButton || null;
}

function recordCompletedProjectWorkMode(projectName, mode) {
  const cost = getProjectLevelWorkCost(projectName, mode);
  const manaSpent = cost && Number.isFinite(cost.mana) ? cost.mana : 0;

  if (manaSpent <= 0) return;

  if (isProjectArcaneForceWorkMode(projectName, mode)) {
    recordSpellProgressExperience("arcaneForce", manaSpent);

    if (typeof recordManaControl === "function") {
      recordManaControl(manaSpent, "Arcane Force");
    }

    return;
  }

  if (isProjectImbueHeartWorkMode(projectName, mode)) {
    recordSpellProgressExperience("imbue", manaSpent);

    if (typeof recordManaControl === "function") {
      recordManaControl(manaSpent, "Imbue Heart");
    }
  }
}

function getProjectLevelDefinition(projectName, levelIndex) {
  const definition = getProjectDefinition(projectName);

  if (!definition || !Array.isArray(definition.levels)) return null;

  return definition.levels[levelIndex] || null;
}

function getProjectCurrentLevel(projectName) {
  const state = getProjectState(projectName);

  return state ? getProjectLevelDefinition(projectName, state.level) : null;
}

function getProjectWorkCost(projectName, mode = PROJECT_WORK_MODE_ENERGY) {
  return getProjectLevelWorkCost(projectName, mode);
}

function getProjectWorkDuration(projectName) {
  const definition = getProjectDefinition(projectName);

  return definition ? definition.workDuration || 1 : 1;
}

function getProjectWorkRemaining(projectName) {
  const state = getProjectState(projectName);
  const level = getProjectCurrentLevel(projectName);

  if (!state || !level) return 0;

  return Math.max(0, (level.workRequired || 0) - (state.work || 0));
}

function canWorkOnProject(projectName, mode = PROJECT_WORK_MODE_ENERGY) {
  const state = getProjectState(projectName);
  const level = getProjectCurrentLevel(projectName);
  const normalizedMode = getNormalizedProjectWorkMode(projectName, mode);
  const isHeartActivation = isTowerFoundationHeartActivationLevel(projectName);

  if (!isCampWorkContextAvailable()) return false;
  if (!state || !level) return false;
  if (!state.unlocked || state.completed) return false;
  if (getProjectWorkRemaining(projectName) <= 0) return false;
  if (isHeartActivation && normalizedMode !== PROJECT_WORK_MODE_IMBUE_HEART) return false;
  if (!isHeartActivation && normalizedMode === PROJECT_WORK_MODE_IMBUE_HEART) return false;

  if (isProjectArcaneForceWorkMode(projectName, normalizedMode)) {
    const spell = typeof getSpell === "function" ? getSpell("arcaneForce") : null;

    if (!spell || !spell.unlocked) return false;
  }

  if (isProjectImbueHeartWorkMode(projectName, normalizedMode)) {
    const spell = typeof getSpell === "function" ? getSpell("imbue") : null;

    if (!spell || !spell.unlocked) return false;
    if (!areProjectMaterialsComplete(projectName)) return false;
  }

  return canAffordCost(getProjectWorkCost(projectName, normalizedMode));
}

function startProjectWork(projectName, mode = PROJECT_WORK_MODE_ENERGY) {
  if (isActivityActive()) return;
  const normalizedMode = getNormalizedProjectWorkMode(projectName, mode);

  if (!canWorkOnProject(projectName, normalizedMode)) return;

  const cost = getProjectWorkCost(projectName, normalizedMode);

  if (!spendCost(cost)) return;

  if (!startActivity({
    kind: "projectWork",
    id: projectName,
    mode: normalizedMode,
    duration: getProjectWorkDuration(projectName),
  })) {
    refundCost(cost);
    return;
  }

  updateProjectButtons();
  updateAllActionButtons();
}

function completeProjectWork(projectName, mode = PROJECT_WORK_MODE_ENERGY) {
  const definition = getProjectDefinition(projectName);
  const state = getProjectState(projectName);
  const level = getProjectCurrentLevel(projectName);
  const normalizedMode = getNormalizedProjectWorkMode(projectName, mode);

  if (!definition || !state || !level) return;

  const workGain = Math.min(getProjectLevelWorkYield(projectName, normalizedMode), getProjectWorkRemaining(projectName));
  state.work = roundResourceAmount((state.work || 0) + workGain);
  recordCompletedProjectWorkMode(projectName, normalizedMode);

  checkProjectLevelCompletion(projectName);
  updateProjectUI();
  updateCurrentGoalUI();
}

function getProjectMaterialRequirement(projectName, resourceName) {
  const level = getProjectCurrentLevel(projectName);
  const materials = level ? level.materials || {} : {};

  return materials[resourceName] || 0;
}

function getProjectMaterialDeposited(projectName, resourceName) {
  const state = getProjectState(projectName);

  if (!state || !state.deposits) return 0;

  return state.deposits[resourceName] || 0;
}

function getProjectMaterialRemaining(projectName, resourceName) {
  return Math.max(0, getProjectMaterialRequirement(projectName, resourceName) - getProjectMaterialDeposited(projectName, resourceName));
}

function areProjectMaterialsComplete(projectName) {
  const level = getProjectCurrentLevel(projectName);
  const materials = level ? level.materials || {} : {};

  for (let resourceName in materials) {
    if (getProjectMaterialRemaining(projectName, resourceName) > 0) return false;
  }

  return true;
}

function isProjectLevelComplete(projectName) {
  return getProjectWorkRemaining(projectName) <= 0 && areProjectMaterialsComplete(projectName);
}

function depositProjectResource(projectName, resourceName) {
  if (isActivityActive()) return;
  if (!isCampWorkContextAvailable()) return;

  const state = getProjectState(projectName);
  const resource = getResource(resourceName);
  const remaining = getProjectMaterialRemaining(projectName, resourceName);

  if (!state || !resource || state.completed || remaining <= 0 || resource.value <= 0) return;

  const amount = Math.min(resource.value, remaining);
  const cost = {};
  cost[resourceName] = amount;

  if (!spendCost(cost)) return;

  state.deposits[resourceName] = roundResourceAmount(getProjectMaterialDeposited(projectName, resourceName) + amount);

  checkProjectLevelCompletion(projectName);
  updateProjectUI();
  updateCurrentGoalUI();
}

function unlockTowerNodeBuild(nodeName) {
  const definition = getTowerNodeDefinition(nodeName);
  const state = getTowerNodeState(nodeName);

  if (!definition || !state || state.researchUnlocked) return;

  state.researchUnlocked = true;
  updateTowerNodePanel();
  updateDestinationActions();
}

function activateTowerNode(nodeName, showStory = true) {
  const definition = getTowerNodeDefinition(nodeName);
  const state = getTowerNodeState(nodeName);

  if (!definition || !state || state.activated) return;

  state.activated = true;

  if (showStory) {
    addStoryEntry("The restored Heart answers northward. Somewhere beyond the ridge, an old tower node has begun to stir.");
    addJournalEntry("northernTowerNodeActivated");
  }

  checkResearchDiscoveries();
}

function repairTowerNodeActivationFromHeart(showStory = false) {
  const foundation = getProjectState("towerFoundation");

  if (gameState.towerConstructionUnlocked || (foundation && foundation.completed)) {
    activateTowerNode("north", showStory);
  }
}

function repairTowerNodeResearchFromCompletedResearch() {
  const definitions = getTowerNodeDefinitions();

  for (let nodeName in definitions) {
    const definition = definitions[nodeName];
    const research = definition.researchName ? getResearch(definition.researchName) : null;

    if (research && research.completed) {
      unlockTowerNodeBuild(nodeName);
    }
  }
}

function getTowerNodeMaterialRequirement(nodeName, resourceName) {
  const definition = getTowerNodeDefinition(nodeName);
  const materials = definition ? definition.materials || {} : {};

  return materials[resourceName] || 0;
}

function getTowerNodeMaterialDeposited(nodeName, resourceName) {
  const state = getTowerNodeState(nodeName);

  if (!state || !state.deposits) return 0;

  return state.deposits[resourceName] || 0;
}

function getTowerNodeMaterialRemaining(nodeName, resourceName) {
  return Math.max(0, getTowerNodeMaterialRequirement(nodeName, resourceName) - getTowerNodeMaterialDeposited(nodeName, resourceName));
}

function areTowerNodeMaterialsComplete(nodeName) {
  const definition = getTowerNodeDefinition(nodeName);
  const materials = definition ? definition.materials || {} : {};

  for (let resourceName in materials) {
    if (getTowerNodeMaterialRemaining(nodeName, resourceName) > 0) return false;
  }

  return true;
}

function getTowerNodeImbueRemaining(nodeName) {
  const definition = getTowerNodeDefinition(nodeName);
  const state = getTowerNodeState(nodeName);

  if (!definition || !state) return 0;

  return Math.max(0, (definition.imbueRequired || 0) - (state.imbueProgress || 0));
}

function hasTowerNodeMaterialNeed(resourceName) {
  const definitions = getTowerNodeDefinitions();

  for (let nodeName in definitions) {
    const state = getTowerNodeState(nodeName);

    if (!state || !state.researchUnlocked || state.built) continue;
    if (getTowerNodeMaterialRemaining(nodeName, resourceName) > 0) return true;
  }

  return false;
}

function canPackTowerNodeMaterial(resourceName) {
  const resource = getResource(resourceName);

  return !!resource && resource.value > 0 && hasCarrySpace(resourceName, 1) && hasTowerNodeMaterialNeed(resourceName);
}

function depositTowerNodeResource(nodeName, resourceName) {
  const definition = getTowerNodeDefinition(nodeName);
  const state = getTowerNodeState(nodeName);
  const carriedItems = gameState.expedition.carriedItems;

  if (isActivityActive()) return;
  if (!definition || !state || !state.researchUnlocked || state.built) return;
  if (gameState.expedition.currentLocation !== definition.locationName) return;

  const remaining = getTowerNodeMaterialRemaining(nodeName, resourceName);
  const carriedAmount = carriedItems[resourceName] || 0;
  const amount = Math.min(carriedAmount, remaining);

  if (amount <= 0) return;
  if (!removeCarriedItem(resourceName, amount)) return;

  state.deposits[resourceName] = roundResourceAmount(getTowerNodeMaterialDeposited(nodeName, resourceName) + amount);
  normalizeTowerNodeState(nodeName);
  updateTowerNodePanel();
  refreshExpeditionUI();
}

function canImbueTowerNode(nodeName) {
  const definition = getTowerNodeDefinition(nodeName);
  const state = getTowerNodeState(nodeName);
  const spell = typeof getSpell === "function" ? getSpell("imbue") : null;

  if (!definition || !state) return false;
  if (gameState.expedition.currentLocation !== definition.locationName) return false;
  if (!state.researchUnlocked || state.built) return false;
  if (!areTowerNodeMaterialsComplete(nodeName)) return false;
  if (!spell || !spell.unlocked) return false;
  if (getTowerNodeImbueRemaining(nodeName) <= 0) return false;

  return canAffordCost(definition.imbueCost || {});
}

function startTowerNodeImbue(nodeName) {
  const definition = getTowerNodeDefinition(nodeName);

  if (isActivityActive()) return;
  if (!definition || !canImbueTowerNode(nodeName)) return;

  const cost = definition.imbueCost || {};

  if (!spendCost(cost)) return;

  if (!startActivity({
    kind: "towerNodeImbue",
    id: nodeName,
    duration: definition.imbueDuration || 1,
  })) {
    refundCost(cost);
    return;
  }

  updateTowerNodeButtons();
  updateAllActionButtons();
}

function completeTowerNodeImbue(nodeName) {
  const definition = getTowerNodeDefinition(nodeName);
  const state = getTowerNodeState(nodeName);

  if (!definition || !state || state.built) return;

  const manaSpent = definition.imbueCost && Number.isFinite(definition.imbueCost.mana) ? definition.imbueCost.mana : 0;
  const gain = Math.min(definition.imbueYield || 0, getTowerNodeImbueRemaining(nodeName));

  state.imbueProgress = roundResourceAmount((state.imbueProgress || 0) + gain);

  if (manaSpent > 0) {
    recordSpellProgressExperience("imbue", manaSpent);

    if (typeof recordManaControl === "function") {
      recordManaControl(manaSpent, "Imbue Northern Node");
    }
  }

  if (getTowerNodeImbueRemaining(nodeName) <= 0) {
    state.built = true;
    state.imbueProgress = definition.imbueRequired || state.imbueProgress;
    addStoryEntry("The northern node locks into the Heart's rhythm. The path to Miners' Camp can now be crossed in a single mana jump.");
    addJournalEntry("northernTowerNodeBuilt");
    updateDestinationActions();
  }

  updateTowerNodePanel();
  updateAllActionButtons();
}

function getTowerNodeImbueButton(nodeName) {
  const definition = getTowerNodeDefinition(nodeName);

  return definition ? definition.imbueButton || null : null;
}

function getTowerNodeJumpCost(nodeName) {
  const definition = getTowerNodeDefinition(nodeName);

  return { ...((definition && definition.jumpCost) || {}) };
}

function getBuiltTowerNodeForLocation(locationName) {
  const definitions = getTowerNodeDefinitions();

  for (let nodeName in definitions) {
    const definition = definitions[nodeName];
    const state = getTowerNodeState(nodeName);

    if (definition.locationName === locationName && state && state.built) return nodeName;
  }

  return null;
}

function canPrepareTowerNodeJump(nodeName, locationName) {
  const definition = getTowerNodeDefinition(nodeName);
  const state = getTowerNodeState(nodeName);
  const location = getExpeditionLocation(locationName);

  return !!definition && !!state && state.built && definition.locationName === locationName && !!location && location.discovered;
}

function getTowerNodeThreadSenseRequired(nodeName) {
  const definition = getTowerNodeDefinition(nodeName);

  return definition ? definition.threadSenseRequired || 0 : 0;
}

function getTowerNodeThreadSenseRemaining(nodeName) {
  const state = getTowerNodeState(nodeName);

  return Math.max(0, getTowerNodeThreadSenseRequired(nodeName) - (state ? state.threadSenseProgress || 0 : 0));
}

function getTowerNodeThreadSenseCost(nodeName) {
  const definition = getTowerNodeDefinition(nodeName);

  return { ...((definition && definition.threadSenseCost) || (getSpell("manaSense") ? getSpell("manaSense").cost || {} : {})) };
}

function canSenseTowerNodeThread(nodeName) {
  const definition = getTowerNodeDefinition(nodeName);
  const state = getTowerNodeState(nodeName);
  const spell = getSpell("manaSense");

  if (!definition || !state || !spell || !spell.unlocked) return false;
  if (!state.built || state.advancedRecallUnlocked) return false;
  if (gameState.expedition.currentLocation !== definition.locationName) return false;
  if (getTowerNodeThreadSenseRemaining(nodeName) <= 0) return false;
  if (isActivityActive()) return false;

  return canAffordCost(getTowerNodeThreadSenseCost(nodeName));
}

function startTowerNodeThreadSense(nodeName) {
  const definition = getTowerNodeDefinition(nodeName);

  if (!definition || !canSenseTowerNodeThread(nodeName)) return;

  const cost = getTowerNodeThreadSenseCost(nodeName);

  if (!spendCost(cost)) return;

  if (!startActivity({
    kind: "towerNodeThreadSense",
    id: nodeName,
    duration: definition.threadSenseDuration || (getSpell("manaSense") ? getSpell("manaSense").duration || 1 : 1),
  })) {
    refundCost(cost);
    return;
  }

  updateTowerNodeButtons();
  updateAllActionButtons();
}

function completeTowerNodeThreadSense(nodeName) {
  const definition = getTowerNodeDefinition(nodeName);
  const state = getTowerNodeState(nodeName);

  if (!definition || !state || !state.built || state.advancedRecallUnlocked) return;

  const cost = getTowerNodeThreadSenseCost(nodeName);
  const manaSpent = cost && Number.isFinite(cost.mana) ? cost.mana : 0;
  const currentProgress = state.threadSenseProgress || 0;
  const stories = definition.threadSenseStories || [];
  const story = stories[Math.min(currentProgress, stories.length - 1)];

  state.threadSenseProgress = Math.min(currentProgress + 1, getTowerNodeThreadSenseRequired(nodeName));

  if (story) {
    addStoryEntry(story);
  } else {
    addStoryEntry("Mana Sense follows the node thread a little farther toward the Tower.");
  }

  if (manaSpent > 0) {
    recordSpellProgressExperience("manaSense", manaSpent);

    if (typeof recordManaControl === "function") {
      recordManaControl(manaSpent, "Sense Node Thread");
    }
  }

  if (getTowerNodeThreadSenseRemaining(nodeName) <= 0) {
    state.threadSensed = true;
    state.advancedRecallUnlocked = true;
    addStoryEntry("The node thread settles into a pattern you can use. You can now recall carried supplies through the northern node.");
    addJournalEntry("advancedRecallUnlocked");

    if (nodeName === "north") {
      triggerNorthernDisturbance(true);
    }
  }

  updateTowerNodePanel();
  updateAllActionButtons();
}

function getNorthernDisturbanceState() {
  if (!gameState.northernDisturbance || typeof gameState.northernDisturbance !== "object") {
    gameState.northernDisturbance = { triggered: false, resolved: false, popupShown: false };
  }

  return gameState.northernDisturbance;
}

function triggerNorthernDisturbance(showPopup) {
  const disturbance = getNorthernDisturbanceState();

  if (disturbance.triggered) return false;

  disturbance.triggered = true;
  addStoryEntry("As the northern node settles, mana shifts across the ridge. A low tremor rolls out from somewhere near the Iron Mine.");
  setCurrentGoal("investigateNorthernDisturbance");

  if (showPopup) {
    disturbance.popupShown = true;
    showNorthernDisturbancePopup();
  }

  updateLocationActions();
  updatePlacePanel();
  return true;
}

function repairNorthernDisturbanceFromNorthNode() {
  const northNode = getTowerNodeState("north");
  const disturbance = getNorthernDisturbanceState();

  if (northNode && northNode.advancedRecallUnlocked && !disturbance.triggered && !disturbance.resolved) {
    triggerNorthernDisturbance(false);
  }
}

function getTowerNodeThreadSenseButton(nodeName) {
  const definition = getTowerNodeDefinition(nodeName);

  return definition ? definition.threadSenseButton || null : null;
}

function getAdvancedRecallButton(nodeName) {
  const definition = getTowerNodeDefinition(nodeName);

  return definition ? definition.advancedRecallButton || null : null;
}

function getAdvancedRecallCost(nodeName) {
  const definition = getTowerNodeDefinition(nodeName);

  return { ...((definition && definition.advancedRecallCost) || { mana: 5 }) };
}

function getAdvancedRecallCarriedItems() {
  const carriedItems = gameState.expedition.carriedItems || {};
  const items = [];

  for (let itemName in carriedItems) {
    const amount = carriedItems[itemName] || 0;
    const resource = getResource(itemName);

    if (amount > 0 && resource) {
      items.push({
        itemName,
        amount,
        storableAmount: getAdvancedRecallItemStorableAmount(itemName),
        label: resource.label || itemName,
      });
    }
  }

  return items.sort(function (a, b) {
    return a.label.localeCompare(b.label);
  });
}

function getAdvancedRecallItemStorableAmount(itemName) {
  const resource = getResource(itemName);
  const carriedAmount = gameState.expedition.carriedItems[itemName] || 0;

  if (!resource || carriedAmount <= 0) return 0;

  return Math.max(0, Math.min(carriedAmount, roundResourceAmount(resource.maxValue - resource.value)));
}

function hasAdvancedRecallCarriedItems() {
  return getAdvancedRecallCarriedItems().length > 0;
}

function canUseAdvancedRecallAtNode(nodeName) {
  const definition = getTowerNodeDefinition(nodeName);
  const state = getTowerNodeState(nodeName);

  if (!definition || !state || !state.advancedRecallUnlocked) return false;
  if (gameState.expedition.currentLocation !== definition.locationName) return false;
  if (isActivityActive()) return false;

  return hasAdvancedRecallCarriedItems();
}

function canAdvancedRecallItem(nodeName, itemName) {
  const definition = getTowerNodeDefinition(nodeName);
  const state = getTowerNodeState(nodeName);
  const carriedAmount = gameState.expedition.carriedItems[itemName] || 0;

  if (!definition || !state || !state.advancedRecallUnlocked) return false;
  if (gameState.expedition.currentLocation !== definition.locationName) return false;
  if (carriedAmount <= 0 || !getResource(itemName)) return false;
  if (getAdvancedRecallItemStorableAmount(itemName) <= 0) return false;

  return canAffordCost(getAdvancedRecallCost(nodeName));
}

function showAdvancedRecallPopup(nodeName) {
  if (!ui.advancedRecallPopup || !ui.advancedRecallOptions) return;
  if (!canUseAdvancedRecallAtNode(nodeName)) return;

  ui.advancedRecallPopup.dataset.nodeName = nodeName;
  renderAdvancedRecallPopupOptions(nodeName);
  showElement(ui.advancedRecallPopup, "flex");
}

function hideAdvancedRecallPopup() {
  if (!ui.advancedRecallPopup) return;

  ui.advancedRecallPopup.dataset.nodeName = "";
  hideElement(ui.advancedRecallPopup);
}

function renderAdvancedRecallPopupOptions(nodeName) {
  if (!ui.advancedRecallOptions) return;

  const items = getAdvancedRecallCarriedItems();
  const cost = getAdvancedRecallCost(nodeName);

  ui.advancedRecallOptions.innerHTML = "";

  if (ui.advancedRecallPopupText) {
    ui.advancedRecallPopupText.textContent = items.length
      ? "Send one carried stack back to the Tower through the northern node."
      : "Your pack is empty.";
  }

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "advanced-recall-empty";
    empty.textContent = "Nothing in your pack answers the thread.";
    ui.advancedRecallOptions.appendChild(empty);
    return;
  }

  items.forEach(function (item) {
    const button = createUiActionButton({
      label: item.storableAmount > 0 ? "Send " + item.label : item.label + " Storage Full",
      cost: item.storableAmount > 0 ? formatCost(cost) : "",
      detail: item.storableAmount > 0 ? formatTrainingNumber(item.storableAmount) : "",
      className: "advanced-recall-option",
      progress: false,
      onClick: function () {
        advancedRecallItem(nodeName, item.itemName);
      },
    });
    button.disabled = !canAdvancedRecallItem(nodeName, item.itemName);

    ui.advancedRecallOptions.appendChild(button);
  });
}

function advancedRecallItem(nodeName, itemName) {
  const amount = getAdvancedRecallItemStorableAmount(itemName);
  const cost = getAdvancedRecallCost(nodeName);

  if (amount <= 0) return;
  if (!canAdvancedRecallItem(nodeName, itemName)) return;
  if (!spendCost(cost)) return;
  if (!removeCarriedItem(itemName, amount)) {
    refundCost(cost);
    return;
  }

  addResource(itemName, amount);

  const resource = getResource(itemName);
  const manaSpent = cost && Number.isFinite(cost.mana) ? cost.mana : 0;

  if (manaSpent > 0 && typeof recordManaControl === "function") {
    recordManaControl(manaSpent, "Advanced Recall");
  }

  addStoryEntry("The node thread tightens. " + formatTrainingNumber(amount) + " " + (resource ? resource.label : itemName) + " reaches the Tower.");
  refreshExpeditionUI();
  updateTowerNodePanel();
  updateAllActionButtons();

  if (hasAdvancedRecallCarriedItems()) {
    renderAdvancedRecallPopupOptions(nodeName);
  } else {
    hideAdvancedRecallPopup();
  }
}

function renderTowerNodePanel(locationName) {
  if (!ui.towerNodePanel) return;

  ui.towerNodePanel.innerHTML = "";
  hideElement(ui.towerNodePanel);

  if (!locationName) return;

  const definitions = getTowerNodeDefinitions();

  for (let nodeName in definitions) {
    const definition = definitions[nodeName];
    const state = getTowerNodeState(nodeName);

    if (!definition || !state) continue;
    if (definition.locationName !== locationName) continue;
    if (!state.researchUnlocked && !state.built) continue;

    ui.towerNodePanel.appendChild(createTowerNodePanel(nodeName, definition, state));
    showElement(ui.towerNodePanel, "block");
    updateTowerNodeButtons();
    return;
  }
}

function updateTowerNodePanel() {
  renderTowerNodePanel(gameState.expedition.currentLocation);
}

function createTowerNodePanel(nodeName, definition, state) {
  const entry = document.createElement("div");
  entry.className = "project-entry tower-project-entry tower-node-entry";

  const header = document.createElement("div");
  header.className = "project-entry-header tower-project-header";

  const title = document.createElement("strong");
  title.textContent = definition.label;

  header.appendChild(title);
  entry.appendChild(header);

  const layout = document.createElement("div");
  layout.className = "tower-project-layout tower-node-layout";

  const visualPanel = document.createElement("section");
  visualPanel.className = "tower-visual-panel";
  visualPanel.setAttribute("aria-label", definition.label + " visual");

  const visualWrap = document.createElement("div");
  visualWrap.className = "tower-visual-wrap tower-node-visual-wrap";
  visualWrap.appendChild(createTowerNodeVisual(nodeName, state.built));
  visualPanel.appendChild(visualWrap);

  const detailPanel = document.createElement("aside");
  detailPanel.className = "tower-stage-panel";

  const details = document.createElement("div");
  details.className = "tower-stage-details";

  const heading = document.createElement("h4");
  heading.textContent = state.built ? definition.completeTitle : definition.incompleteTitle;

  const description = document.createElement("p");
  description.textContent = state.built ? definition.completeDescription : definition.incompleteDescription;

  details.appendChild(heading);
  details.appendChild(description);
  detailPanel.appendChild(details);

  if (!state.built) {
    definition.threadSenseButton = null;
    definition.advancedRecallButton = null;
    detailPanel.appendChild(createTowerNodeMaterialList(nodeName, definition));
    detailPanel.appendChild(createTowerNodeActivationProgress(nodeName, definition, state));
    detailPanel.appendChild(createTowerNodeActions(nodeName, definition));
  } else {
    definition.imbueButton = null;
    detailPanel.appendChild(createTowerNodeThreadProgress(nodeName, definition, state));
    detailPanel.appendChild(createTowerNodeUtilityActions(nodeName, definition, state));
  }

  layout.appendChild(visualPanel);
  layout.appendChild(detailPanel);
  entry.appendChild(layout);

  return entry;
}

function createTowerNodeVisual(nodeName, built) {
  const svg = createSvgElement("svg", {
    class: "tower-visual tower-node-visual",
    viewBox: "0 0 600 300",
    role: "img",
    "aria-label": built ? "Completed northern tower node with a small static mana orb." : "Bare ground where the northern tower node can be built.",
  });

  const defs = appendSvgElement(svg, "defs");
  const patternId = "towerNodeSoilPattern-" + nodeName;
  const gradientId = "towerNodeHeartGradient-" + nodeName;
  const glowId = "towerNodeHeartGlow-" + nodeName;
  const pattern = appendSvgElement(defs, "pattern", {
    id: patternId,
    width: "18",
    height: "18",
    patternUnits: "userSpaceOnUse",
  });

  appendSvgElement(pattern, "rect", { width: "18", height: "18", fill: "#c8ad82" });
  appendSvgElement(pattern, "path", {
    d: "M2 4h4M12 9h3M5 15h5",
    stroke: "#ad8f64",
    "stroke-width": "1.2",
    "stroke-linecap": "round",
    opacity: "0.58",
  });

  const gradient = appendSvgElement(defs, "linearGradient", {
    id: gradientId,
    x1: "0",
    x2: "1",
    y1: "0",
    y2: "1",
  });

  appendSvgElement(gradient, "stop", { offset: "0", "stop-color": "#e5fdff" });
  appendSvgElement(gradient, "stop", { offset: "0.48", "stop-color": "#8be1ef" });
  appendSvgElement(gradient, "stop", { offset: "1", "stop-color": "#5d7fd1" });

  const filter = appendSvgElement(defs, "filter", {
    id: glowId,
    x: "-80%",
    y: "-80%",
    width: "260%",
    height: "260%",
  });
  appendSvgElement(filter, "feGaussianBlur", { stdDeviation: "4", result: "blur" });
  appendSvgElement(filter, "feFlood", { "flood-color": "#8deaff", "flood-opacity": "0.72", result: "color" });
  appendSvgElement(filter, "feComposite", { in: "color", in2: "blur", operator: "in", result: "glow" });
  const merge = appendSvgElement(filter, "feMerge");
  appendSvgElement(merge, "feMergeNode", { in: "glow" });
  appendSvgElement(merge, "feMergeNode", { in: "SourceGraphic" });

  appendSvgElement(svg, "path", { class: "tower-node-soil-fill", d: "M0 104 H600 V300 H0 Z", fill: "url(#" + patternId + ")" });
  appendSvgElement(svg, "path", { class: "tower-ground-edge", d: "M0 104 H600" });

  if (!built) {
    return svg;
  }

  appendSvgElement(svg, "path", { class: "tower-node-foundation", d: "M206 214 H394" });
  appendSvgElement(svg, "path", { class: "tower-node-base", d: "M238 214 L258 166 H342 L362 214 Z" });
  appendSvgElement(svg, "path", { class: "tower-node-cap", d: "M254 166 L268 144 H332 L346 166 Z" });
  appendSvgElement(svg, "path", { class: "tower-node-channel", d: "M300 144 V188 M268 176 L222 202 M332 176 L378 202" });
  appendSvgElement(svg, "circle", {
    class: "tower-node-heart",
    cx: "300",
    cy: "118",
    r: "20",
    fill: "url(#" + gradientId + ")",
    filter: "url(#" + glowId + ")",
  });
  appendSvgElement(svg, "circle", { class: "tower-node-facet", cx: "300", cy: "118", r: "10" });
  appendSvgElement(svg, "path", { class: "tower-node-facet", d: "M300 100 V136 M282 118 H318 M290 108 L310 128 M310 108 L290 128" });

  return svg;
}

function createTowerNodeMaterialList(nodeName, definition) {
  const list = document.createElement("div");
  list.className = "project-material-list tower-node-material-list";
  const materials = definition.materials || {};

  for (let resourceName in materials) {
    list.appendChild(createTowerNodeMaterialRow(nodeName, resourceName));
  }

  return list;
}

function createTowerNodeMaterialRow(nodeName, resourceName) {
  const resource = getResource(resourceName);
  const row = document.createElement("div");
  row.className = "project-material-row tower-node-material-row";

  const label = document.createElement("span");
  label.textContent =
    (resource ? resource.label : resourceName) +
    ": " +
    formatTrainingNumber(getTowerNodeMaterialDeposited(nodeName, resourceName)) +
    " / " +
    formatTrainingNumber(getTowerNodeMaterialRequirement(nodeName, resourceName));

  const button = createUiActionButton({
    label: "Deposit",
    className: "project-deposit-btn",
    progress: false,
    dataset: {
      towerNodeDeposit: nodeName,
      resource: resourceName,
    },
    onClick: function () {
      depositTowerNodeResource(nodeName, resourceName);
    },
  });

  row.appendChild(label);
  row.appendChild(button);

  return row;
}

function createTowerNodeActivationProgress(nodeName, definition, state) {
  const group = document.createElement("div");
  group.className = "project-progress-group tower-node-activation-progress";

  const text = document.createElement("div");
  text.className = "training-progress-text";
  text.textContent =
    "Activation: " +
    formatTrainingNumber(state.imbueProgress || 0) +
    " / " +
    formatTrainingNumber(definition.imbueRequired || 0) +
    " Mana";

  const track = document.createElement("div");
  track.className = "training-progress-track";

  const fill = document.createElement("div");
  fill.className = "training-progress-fill";
  fill.style.width = Math.min(Math.max((state.imbueProgress || 0) / (definition.imbueRequired || 1), 0), 1) * 100 + "%";

  track.appendChild(fill);
  group.appendChild(text);
  group.appendChild(track);

  return group;
}

function createTowerNodeActions(nodeName, definition) {
  const actions = document.createElement("div");
  actions.className = "project-actions tower-project-actions tower-node-actions";

  const actionName = document.createElement("div");
  actionName.className = "tower-project-action-name";
  actionName.textContent = "Activate Northern Node";

  const button = createUiActionButton({
    label: "Imbue Northern Node",
    cost: formatCost(definition.imbueCost || {}),
    className: "project-work-btn tower-project-work-btn",
    dataset: {
      towerNodeImbue: nodeName,
    },
    onClick: function () {
      startTowerNodeImbue(nodeName);
    },
  });

  definition.imbueButton = button;
  actions.appendChild(actionName);
  actions.appendChild(button);

  return actions;
}

function createTowerNodeThreadProgress(nodeName, definition, state) {
  const group = document.createElement("div");
  group.className = "project-progress-group tower-node-thread-progress";

  const text = document.createElement("div");
  text.className = "training-progress-text";

  const required = definition.threadSenseRequired || 0;
  const progress = Math.min(state.threadSenseProgress || 0, required);

  text.textContent = state.advancedRecallUnlocked
    ? "Thread sensed"
    : "Thread sensed: " + formatTrainingNumber(progress) + " / " + formatTrainingNumber(required);

  const track = document.createElement("div");
  track.className = "training-progress-track";

  const fill = document.createElement("div");
  fill.className = "training-progress-fill";
  fill.style.width = required > 0 ? Math.min(Math.max(progress / required, 0), 1) * 100 + "%" : "100%";

  track.appendChild(fill);
  group.appendChild(text);
  group.appendChild(track);

  return group;
}

function createTowerNodeUtilityActions(nodeName, definition, state) {
  const actions = document.createElement("div");
  actions.className = "project-actions tower-project-actions tower-node-actions";

  const actionName = document.createElement("div");
  actionName.className = "tower-project-action-name";
  actionName.textContent = state.advancedRecallUnlocked ? "Advanced Recall" : "Sense Node Thread";

  if (state.advancedRecallUnlocked) {
    const button = createUiActionButton({
      label: "Advanced Recall Pack",
      className: "project-work-btn tower-project-work-btn",
      progress: false,
      dataset: {
        towerNodeAdvancedRecall: nodeName,
      },
      onClick: function () {
        showAdvancedRecallPopup(nodeName);
      },
    });

    definition.advancedRecallButton = button;
    definition.threadSenseButton = null;
    actions.appendChild(actionName);
    actions.appendChild(button);
  } else {
    const button = createUiActionButton({
      label: "Sense Node Thread",
      cost: formatCost(getTowerNodeThreadSenseCost(nodeName)),
      className: "project-work-btn tower-project-work-btn",
      dataset: {
        towerNodeThreadSense: nodeName,
      },
      onClick: function () {
        startTowerNodeThreadSense(nodeName);
      },
    });

    definition.threadSenseButton = button;
    definition.advancedRecallButton = null;
    actions.appendChild(actionName);
    actions.appendChild(button);
  }

  return actions;
}

function updateTowerNodeButtons() {
  const definitions = getTowerNodeDefinitions();

  for (let nodeName in definitions) {
    updateTowerNodeButtonState(nodeName);
    updateTowerNodeThreadSenseButtonState(nodeName);
    updateAdvancedRecallButtonState(nodeName);
    updateTowerNodeDepositButtonStates(nodeName);
  }
}

function updateTowerNodeButtonState(nodeName) {
  const definition = getTowerNodeDefinition(nodeName);
  const state = getTowerNodeState(nodeName);
  const button = definition ? definition.imbueButton : null;

  if (!definition || !state || !button) return;

  const isActive = isActivityActive() && gameState.activity.kind === "towerNodeImbue" && gameState.activity.id === nodeName;

  button.classList.toggle("running", isActive);
  button.disabled = state.built || (!isActive && (isActivityActive() || !canImbueTowerNode(nodeName)));

  if (state.built || getTowerNodeImbueRemaining(nodeName) <= 0) {
    setUiActionButtonLabel(button, {
      label: "Activation Complete",
      cost: "",
    });
  } else {
    setUiActionButtonLabel(button, {
      label: "Imbue Northern Node",
      cost: formatCost(definition.imbueCost || {}),
    });
  }
}

function updateTowerNodeThreadSenseButtonState(nodeName) {
  const definition = getTowerNodeDefinition(nodeName);
  const state = getTowerNodeState(nodeName);
  const button = definition ? definition.threadSenseButton : null;

  if (!definition || !state || !button) return;

  const isActive = isActivityActive() && gameState.activity.kind === "towerNodeThreadSense" && gameState.activity.id === nodeName;

  button.classList.toggle("running", isActive);
  button.disabled = state.advancedRecallUnlocked || (!isActive && (isActivityActive() || !canSenseTowerNodeThread(nodeName)));

  setUiActionButtonLabel(button, {
    label: state.advancedRecallUnlocked || getTowerNodeThreadSenseRemaining(nodeName) <= 0 ? "Thread Sensed" : "Sense Node Thread",
    cost: state.advancedRecallUnlocked || getTowerNodeThreadSenseRemaining(nodeName) <= 0 ? "" : formatCost(getTowerNodeThreadSenseCost(nodeName)),
  });
}

function updateAdvancedRecallButtonState(nodeName) {
  const definition = getTowerNodeDefinition(nodeName);
  const state = getTowerNodeState(nodeName);
  const button = definition ? definition.advancedRecallButton : null;

  if (!definition || !state || !button) return;

  const hasItems = hasAdvancedRecallCarriedItems();
  const canUse = canUseAdvancedRecallAtNode(nodeName);

  button.disabled = !canUse;

  setUiActionButtonLabel(button, {
    label: hasItems ? "Advanced Recall Pack" : "Pack Empty",
    cost: "",
  });
}

function updateTowerNodeDepositButtonStates(nodeName) {
  if (!ui.towerNodePanel) return;

  const state = getTowerNodeState(nodeName);
  const buttons = ui.towerNodePanel.querySelectorAll('[data-tower-node-deposit="' + nodeName + '"]');

  buttons.forEach(function (button) {
    const resourceName = button.dataset.resource;
    const carriedAmount = gameState.expedition.carriedItems[resourceName] || 0;
    const remaining = getTowerNodeMaterialRemaining(nodeName, resourceName);
    const amount = Math.min(carriedAmount, remaining);

    button.disabled = !state || state.built || isActivityActive() || remaining <= 0 || amount <= 0;
    setUiActionButtonLabel(button, {
      label: remaining <= 0 ? "Done" : "Deposit",
      detail: remaining <= 0 ? "" : formatTrainingNumber(amount),
      progress: false,
    });
  });
}

function checkProjectLevelCompletion(projectName) {
  const state = getProjectState(projectName);

  if (!state || state.completed || !isProjectLevelComplete(projectName)) return false;

  advanceProjectLevel(projectName);
  return true;
}

function advanceProjectLevel(projectName) {
  const definition = getProjectDefinition(projectName);
  const state = getProjectState(projectName);
  const completedLevel = getProjectCurrentLevel(projectName);

  if (!definition || !state || !completedLevel) return;

  if (completedLevel.completionStory) {
    addStoryEntry(completedLevel.completionStory);
  }

  if (completedLevel.unlocks) {
    applyUnlocks(completedLevel.unlocks);
  }

  if (typeof completedLevel.onComplete === "function") {
    completedLevel.onComplete(projectName, completedLevel);
  }

  state.level += 1;
  state.work = 0;
  state.deposits = {};

  if (state.level >= definition.levels.length) {
    state.completed = true;
    state.unlocked = true;
    completeProject(projectName, definition);
  }

  updateProjectUI();
  updateCraftingSectionVisibility();
  updateWorkTabsVisibility();
}

function completeProject(projectName, definition) {
  if (definition.completedStory) {
    addStoryEntry(definition.completedStory);
  }

  if (projectName === "towerFoundation") {
    gameState.towerConstructionUnlocked = true;
    addJournalEntry("towerFoundationAwakened");
    activateTowerNode("north", true);

    if (typeof checkRank2SkillUnlocks === "function") {
      checkRank2SkillUnlocks();
    }
  } else if (projectName === "towerBasement") {
    gameState.towerBasementCompleted = true;
    addJournalEntry("towerBasementCompleted");
  }

  checkResearchDiscoveries();
  updateCurrentGoalUI();
}

function getVisibleTowerProjectEntry() {
  const definitions = getProjectDefinitions();

  for (let i = TOWER_PROJECT_SEQUENCE.length - 1; i >= 0; i--) {
    const projectName = TOWER_PROJECT_SEQUENCE[i];
    const state = getProjectState(projectName);

    if (!state || (!state.unlocked && !state.completed)) continue;

    return {
      id: projectName,
      definition: definitions[projectName],
      state,
    };
  }

  return null;
}

function getVisibleProjectEntries() {
  const entries = [];
  const definitions = getProjectDefinitions();
  const towerEntry = getVisibleTowerProjectEntry();
  let towerEntryAdded = false;

  ensureProjectsState();

  for (let projectName in definitions) {
    const state = getProjectState(projectName);

    if (isTowerProject(projectName)) {
      if (!towerEntryAdded && towerEntry) {
        entries.push(towerEntry);
        towerEntryAdded = true;
      }

      continue;
    }

    if (!state || (!state.unlocked && !state.completed)) continue;

    entries.push({
      id: projectName,
      definition: definitions[projectName],
      state,
    });
  }

  return entries;
}

function updateProjectUI() {
  if (!ui.projectList) return;

  ensureProjectsState();
  ui.projectList.innerHTML = "";

  const entries = getVisibleProjectEntries();

  if (entries.length === 0) {
    ui.projectList.appendChild(createUiEmptyState("No projects started yet."));
    renderTowerStatusPanel();
    syncMainViewAvailability();
    return;
  }

  entries.forEach(function (entry) {
    ui.projectList.appendChild(createProjectEntry(entry.id, entry.definition, entry.state));
  });

  updateProjectButtons();
  renderTowerStatusPanel();
  syncMainViewAvailability();
}

function renderTowerStatusPanel() {
  if (!ui.towerStatusPanel) return;

  const entries = getVisibleProjectEntries();

  if (entries.length === 0) {
    renderUiContextPanel(ui.towerStatusPanel, {
      title: "Tower",
      status: "No project",
      body: "No tower project is visible yet.",
      className: "tower-status-summary",
    });
    return;
  }

  const activeEntry =
    entries.find(function (entry) {
      return !entry.state.completed;
    }) || entries[0];
  const level = getProjectCurrentLevel(activeEntry.id);
  const workRemaining = getProjectWorkRemaining(activeEntry.id);
  const materialText = getProjectMaterialStatusText(activeEntry.id, level);
  const status = activeEntry.state.completed ? activeEntry.definition.completedLabel || "Complete" : level ? level.name : "Complete";
  const meta = [
    {
      label: "Work",
      value: activeEntry.state.completed || !level ? "complete" : formatTrainingNumber(workRemaining) + " remaining",
    },
    {
      label: "Materials",
      value: materialText,
    },
  ];

  renderUiContextPanel(ui.towerStatusPanel, {
    title: activeEntry.definition.label || "Tower",
    status,
    body: activeEntry.state.completed
      ? activeEntry.definition.completedDescription || "This project is complete."
      : level && level.description
        ? level.description
        : activeEntry.definition.description || "",
    meta,
    className: "tower-status-summary",
  });
}

function getProjectMaterialStatusText(projectName, level) {
  if (!level || !level.materials || Object.keys(level.materials).length === 0) return "complete";

  const missing = [];

  for (let resourceName in level.materials) {
    const remaining = getProjectMaterialRemaining(projectName, resourceName);

    if (remaining <= 0) continue;

    const resource = getResource(resourceName);
    missing.push(formatTrainingNumber(remaining) + " " + (resource ? resource.label : resourceName));
  }

  return missing.length > 0 ? missing.join(", ") : "complete";
}

function getProjectWorkActionLabel(projectName) {
  const definition = getProjectDefinition(projectName);
  const level = getProjectCurrentLevel(projectName);

  return (level && level.actionLabel) || (definition && definition.actionLabel) || "Work";
}

function createProjectEntry(projectName, definition, state) {
  if (isTowerProject(projectName)) {
    return createTowerProjectEntry(projectName, definition, state);
  }

  const level = getProjectCurrentLevel(projectName);
  const entry = createUiSummaryCard({
    title: definition.label + " - Level " + state.level,
    meta: state.completed ? definition.completedLabel || "Complete" : level.name,
    body: state.completed ? definition.completedDescription : level.description || definition.description || "",
    className: "project-entry",
  });

  entry.appendChild(createProjectWorkProgress(projectName, level, state));
  entry.appendChild(createProjectMaterialList(projectName, level, state));
  entry.appendChild(createProjectActions(projectName, definition, state));

  return entry;
}

function getTowerProjectStageIndex(definition, state) {
  const stages = definition && Array.isArray(definition.visualStages) ? definition.visualStages : [];
  const maxStage = Math.max(0, stages.length - 1);

  if (!state) return 0;
  if (state.completed) return maxStage;

  return Math.max(0, Math.min(Number.isFinite(state.level) ? Math.floor(state.level) : 0, maxStage));
}

function getTowerProjectStage(definition, stageIndex) {
  const stages = definition && Array.isArray(definition.visualStages) ? definition.visualStages : [];

  return stages[stageIndex] || stages[0] || {
    title: definition ? definition.label || "Tower" : "Tower",
    description: definition ? definition.description || "" : "",
    additions: "",
    read: "",
    aria: "Tower project.",
  };
}

function createTowerProjectEntry(projectName, definition, state) {
  const level = getProjectCurrentLevel(projectName);
  const stageIndex = getTowerProjectStageIndex(definition, state);
  const stage = getTowerProjectStage(definition, stageIndex);
  const entry = document.createElement("div");
  entry.className = "project-entry tower-project-entry";

  const header = document.createElement("div");
  header.className = "project-entry-header tower-project-header";

  const title = document.createElement("strong");
  title.textContent = definition.towerPhaseTitle || definition.label || "Tower";

  header.appendChild(title);
  entry.appendChild(header);

  const layout = document.createElement("div");
  layout.className = "tower-project-layout";

  const visualPanel = document.createElement("section");
  visualPanel.className = "tower-visual-panel";
  visualPanel.setAttribute("aria-label", (definition.label || "Tower") + " visual");

  const visualWrap = document.createElement("div");
  visualWrap.className = "tower-visual-wrap";
  visualWrap.appendChild(createTowerProjectVisual(projectName, stageIndex, stage));

  visualPanel.appendChild(visualWrap);

  const detailPanel = document.createElement("aside");
  detailPanel.className = "tower-stage-panel";

  const details = document.createElement("div");
  details.className = "tower-stage-details";

  const heading = document.createElement("h4");
  heading.textContent = state.completed ? definition.completedLabel || "Heart Restored" : getProjectWorkActionLabel(projectName);

  const description = document.createElement("p");
  description.textContent = getTowerProjectDetailDescription(projectName, definition, state, level, stage);

  details.appendChild(heading);
  details.appendChild(description);

  detailPanel.appendChild(details);

  if (state.completed) {
    definition.workButton = null;
    definition.workButtons = {};
  } else {
    if (isTowerFoundationHeartActivationLevel(projectName)) {
      detailPanel.appendChild(createProjectMaterialList(projectName, level, state));
      detailPanel.appendChild(createTowerFoundationActivationProgress(projectName, level, state));
    } else {
      detailPanel.appendChild(createProjectWorkProgress(projectName, level, state));
      detailPanel.appendChild(createProjectMaterialList(projectName, level, state));
    }

    detailPanel.appendChild(createTowerProjectActions(projectName, definition, state));
  }

  layout.appendChild(visualPanel);
  layout.appendChild(detailPanel);
  entry.appendChild(layout);

  return entry;
}

function getTowerProjectDetailDescription(projectName, definition, state, level, stage) {
  if (state.completed) return definition.completedDescription;
  if (isTowerFoundationHeartActivationLevel(projectName) && level && level.description) return level.description;

  return stage.description;
}

function createSvgElement(name, attrs, text) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", name);

  if (attrs) {
    Object.keys(attrs).forEach(function (attrName) {
      const attrValue = attrs[attrName];

      if (attrValue !== undefined && attrValue !== null) {
        element.setAttribute(attrName, attrValue);
      }
    });
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

function appendSvgElement(parent, name, attrs, text) {
  const element = createSvgElement(name, attrs, text);
  parent.appendChild(element);
  return element;
}

function createTowerProjectVisual(projectName, stageIndex, stage) {
  if (projectName === "towerBasement") {
    return createTowerBasementVisual(stageIndex, stage);
  }

  return createTowerFoundationVisual(stageIndex, stage);
}

function createTowerFoundationVisual(stageIndex, stage) {
  const svg = createSvgElement("svg", {
    class: "tower-visual",
    viewBox: "0 0 600 300",
    role: "img",
    "aria-label": stage.aria || stage.title,
  });

  const defs = appendSvgElement(svg, "defs");
  const pattern = appendSvgElement(defs, "pattern", {
    id: "towerFoundationSoilPattern",
    width: "18",
    height: "18",
    patternUnits: "userSpaceOnUse",
  });

  appendSvgElement(pattern, "rect", { width: "18", height: "18", fill: "#c8ad82" });
  appendSvgElement(pattern, "path", {
    d: "M2 4h4M12 9h3M5 15h5",
    stroke: "#ad8f64",
    "stroke-width": "1.2",
    "stroke-linecap": "round",
    opacity: "0.58",
  });
  appendSvgElement(pattern, "circle", { cx: "14", cy: "3", r: "1.1", fill: "#9d7f58", opacity: "0.5" });

  const gradient = appendSvgElement(defs, "linearGradient", {
    id: "towerFoundationHeartGradient",
    x1: "0",
    x2: "1",
    y1: "0",
    y2: "1",
  });

  appendSvgElement(gradient, "stop", { offset: "0", "stop-color": "#e5fdff" });
  appendSvgElement(gradient, "stop", { offset: "0.45", "stop-color": "#8be1ef" });
  appendSvgElement(gradient, "stop", { offset: "1", "stop-color": "#5d7fd1" });

  const filter = appendSvgElement(defs, "filter", {
    id: "towerFoundationHeartGlow",
    x: "-80%",
    y: "-80%",
    width: "260%",
    height: "260%",
  });
  appendSvgElement(filter, "feGaussianBlur", { stdDeviation: "5", result: "blur" });
  appendSvgElement(filter, "feFlood", { "flood-color": "#8deaff", "flood-opacity": "0.82", result: "color" });
  appendSvgElement(filter, "feComposite", { in: "color", in2: "blur", operator: "in", result: "glow" });
  const merge = appendSvgElement(filter, "feMerge");
  appendSvgElement(merge, "feMergeNode", { in: "glow" });
  appendSvgElement(merge, "feMergeNode", { in: "SourceGraphic" });

  appendSvgElement(svg, "line", { x1: "38", y1: "90", x2: "562", y2: "90", class: "tower-guide-line" });
  appendSvgElement(svg, "text", { x: "42", y: "80", class: "tower-depth-label" }, "Ground");
  appendSvgElement(svg, "line", { x1: "38", y1: "198", x2: "562", y2: "198", class: "tower-guide-line" });
  appendSvgElement(svg, "text", { x: "42", y: "218", class: "tower-depth-label" }, "Foundation depth");

  const art = appendSvgElement(svg, "g", { class: "tower-stage-art", "data-tower-stage": stageIndex });
  appendTowerFoundationStageArt(art, stageIndex);

  return svg;
}

function appendTowerFoundationStageArt(group, stageIndex) {
  if (stageIndex <= 0) {
    appendSvgElement(group, "path", { class: "tower-soil-fill", d: "M0 90 H600 V300 H0 Z" });
    appendSvgElement(group, "path", { class: "tower-ground-edge", d: "M0 90 H600" });
    appendSvgElement(group, "path", { class: "tower-hidden-foundation", d: "M182 198 H418" });
    return;
  }

  if (stageIndex === 1) {
    appendSvgElement(group, "path", {
      class: "tower-soil-fill",
      d: "M0 90 H158 C196 90 213 107 246 119 C278 131 322 131 354 119 C387 107 404 90 442 90 H600 V300 H0 Z",
    });
    appendSvgElement(group, "path", {
      class: "tower-ground-edge",
      d: "M0 90 H158 C196 90 213 107 246 119 C278 131 322 131 354 119 C387 107 404 90 442 90 H600",
    });
    appendSvgElement(group, "path", { class: "tower-hidden-foundation", d: "M182 198 H418" });
    return;
  }

  if (stageIndex === 2) {
    appendSvgElement(group, "path", {
      class: "tower-soil-fill",
      d: "M0 90 H146 C185 90 203 112 231 140 C259 168 270 198 300 198 C330 198 341 168 369 140 C397 112 415 90 454 90 H600 V300 H0 Z",
    });
    appendSvgElement(group, "path", {
      class: "tower-ground-edge",
      d: "M0 90 H146 C185 90 203 112 231 140 C259 168 270 198 300 198 C330 198 341 168 369 140 C397 112 415 90 454 90 H600",
    });
    appendSvgElement(group, "path", { class: "tower-hidden-foundation", d: "M182 198 H418" });
    appendSvgElement(group, "circle", { cx: "300", cy: "198", r: "5", fill: "#fffaf0", stroke: "#6f604a", "stroke-width": "2" });
    return;
  }

  appendTowerFoundationShoredSite(group);

  if (stageIndex >= 4) {
    appendTowerFoundationPlinth(group);
  }

  if (stageIndex >= 5) {
    appendTowerFoundationHeart(group);
  }
}

function appendTowerFoundationShoredSite(group) {
  appendSvgElement(group, "path", {
    class: "tower-soil-fill",
    d: "M0 90 H128 C151 90 158 104 166 126 L190 198 H410 L434 126 C442 104 449 90 472 90 H600 V300 H0 Z",
  });
  appendSvgElement(group, "path", {
    class: "tower-ground-edge",
    d: "M0 90 H128 C151 90 158 104 166 126 L190 198",
  });
  appendSvgElement(group, "path", {
    class: "tower-ground-edge",
    d: "M410 198 L434 126 C442 104 449 90 472 90 H600",
  });
  appendSvgElement(group, "path", { class: "tower-exposed-foundation", d: "M190 198 H410" });
  appendSvgElement(group, "path", { class: "tower-foundation-highlight", d: "M194 195 H406" });

  const bracing = appendSvgElement(group, "g", { "aria-label": "Wooden excavation supports" });
  appendSvgElement(bracing, "path", {
    class: "tower-timber-shadow",
    d: "M150 190 L178 112 M184 190 L136 138 M450 190 L422 112 M416 190 L464 138 M142 150 H180 M420 150 H458",
  });
  appendSvgElement(bracing, "path", {
    class: "tower-timber",
    d: "M150 190 L178 112 M184 190 L136 138 M450 190 L422 112 M416 190 L464 138 M142 150 H180 M420 150 H458",
  });
  appendSvgElement(bracing, "path", {
    class: "tower-timber-grain",
    d: "M152 187 L176 116 M182 187 L139 141 M448 187 L424 116 M418 187 L461 141 M148 147 H176 M424 147 H452",
  });
}

function appendTowerFoundationPlinth(group) {
  appendSvgElement(group, "path", { class: "tower-plinth-base", d: "M260 198 L270 164 H330 L340 198 Z" });
  appendSvgElement(group, "path", { class: "tower-plinth-top", d: "M267 164 L276 148 H324 L333 164 Z" });
  appendSvgElement(group, "path", { class: "tower-plinth-line", d: "M274 160 H326 M278 153 H322" });
}

function appendTowerFoundationHeart(group) {
  appendSvgElement(group, "path", { class: "tower-mana-channel", d: "M300 160 V185 M278 174 L242 190 M322 174 L358 190" });
  appendSvgElement(group, "circle", {
    class: "tower-mana-heart",
    cx: "300",
    cy: "123",
    r: "25",
    fill: "url(#towerFoundationHeartGradient)",
    filter: "url(#towerFoundationHeartGlow)",
  });
  appendSvgElement(group, "circle", { class: "tower-mana-facet", cx: "300", cy: "123", r: "14" });
  appendSvgElement(group, "path", { class: "tower-mana-facet", d: "M300 99 V147 M276 123 H324 M286 109 L314 137 M314 109 L286 137" });
}

function createTowerBasementVisual(stageIndex, stage) {
  const svg = createSvgElement("svg", {
    class: "tower-visual tower-basement-visual",
    viewBox: "0 0 600 300",
    role: "img",
    "aria-label": stage.aria || stage.title,
  });

  const defs = appendSvgElement(svg, "defs");
  const pattern = appendSvgElement(defs, "pattern", {
    id: "towerFoundationSoilPattern",
    width: "18",
    height: "18",
    patternUnits: "userSpaceOnUse",
  });

  appendSvgElement(pattern, "rect", { width: "18", height: "18", fill: "#c8ad82" });
  appendSvgElement(pattern, "path", {
    d: "M2 4h4M12 9h3M5 15h5",
    stroke: "#ad8f64",
    "stroke-width": "1.2",
    "stroke-linecap": "round",
    opacity: "0.58",
  });
  appendSvgElement(pattern, "circle", { cx: "14", cy: "3", r: "1.1", fill: "#9d7f58", opacity: "0.5" });

  const gradient = appendSvgElement(defs, "linearGradient", {
    id: "towerFoundationHeartGradient",
    x1: "0",
    x2: "1",
    y1: "0",
    y2: "1",
  });

  appendSvgElement(gradient, "stop", { offset: "0", "stop-color": "#e5fdff" });
  appendSvgElement(gradient, "stop", { offset: "0.45", "stop-color": "#8be1ef" });
  appendSvgElement(gradient, "stop", { offset: "1", "stop-color": "#5d7fd1" });

  const filter = appendSvgElement(defs, "filter", {
    id: "towerFoundationHeartGlow",
    x: "-80%",
    y: "-80%",
    width: "260%",
    height: "260%",
  });
  appendSvgElement(filter, "feGaussianBlur", { stdDeviation: "5", result: "blur" });
  appendSvgElement(filter, "feFlood", { "flood-color": "#8deaff", "flood-opacity": "0.82", result: "color" });
  appendSvgElement(filter, "feComposite", { in: "color", in2: "blur", operator: "in", result: "glow" });
  const merge = appendSvgElement(filter, "feMerge");
  appendSvgElement(merge, "feMergeNode", { in: "glow" });
  appendSvgElement(merge, "feMergeNode", { in: "SourceGraphic" });

  appendSvgElement(svg, "line", { x1: "38", y1: "90", x2: "562", y2: "90", class: "tower-guide-line" });
  appendSvgElement(svg, "text", { x: "42", y: "80", class: "tower-depth-label" }, "Ground");
  appendSvgElement(svg, "line", { x1: "38", y1: "198", x2: "562", y2: "198", class: "tower-guide-line" });
  appendSvgElement(svg, "text", { x: "42", y: "218", class: "tower-depth-label" }, "Foundation depth");

  const art = appendSvgElement(svg, "g", { class: "tower-stage-art", "data-tower-stage": stageIndex });
  appendTowerBasementStageArt(art, stageIndex);

  return svg;
}

function appendTowerBasementStageArt(group, stageIndex) {
  if (stageIndex <= 0) {
    appendTowerFoundationShoredSite(group);
    appendTowerFoundationPlinth(group);
    appendTowerFoundationHeart(group);
    return;
  }

  const wallTops = [198, 180, 154, 130, 104, 82];
  const wallTop = wallTops[Math.max(1, Math.min(stageIndex, wallTops.length - 1))];

  appendTowerBasementExcavation(group, stageIndex, wallTop);
  appendTowerBasementWalls(group, stageIndex, wallTop);

  if (stageIndex === 3) {
    appendTowerBasementBracing(group, wallTop);
  }

  appendTowerFoundationPlinth(group);
  appendTowerFoundationHeart(group);
}

function appendTowerBasementExcavation(group, stageIndex, wallTop) {
  if (stageIndex >= 5) {
    appendSvgElement(group, "path", {
      class: "tower-soil-fill",
      d: "M0 90 H198 V198 H402 V90 H600 V300 H0 Z",
    });
    appendSvgElement(group, "path", { class: "tower-ground-edge", d: "M0 90 H198 M402 90 H600" });
  } else {
    appendSvgElement(group, "path", {
      class: "tower-soil-fill",
      d: "M0 90 H128 C151 90 158 104 166 126 L190 198 H410 L434 126 C442 104 449 90 472 90 H600 V300 H0 Z",
    });
    appendSvgElement(group, "path", {
      class: "tower-ground-edge",
      d: "M0 90 H128 C151 90 158 104 166 126 L190 198",
    });
    appendSvgElement(group, "path", {
      class: "tower-ground-edge",
      d: "M410 198 L434 126 C442 104 449 90 472 90 H600",
    });
  }

  appendSvgElement(group, "path", { class: "tower-exposed-foundation", d: "M190 198 H410" });
  appendSvgElement(group, "path", { class: "tower-foundation-highlight", d: "M194 195 H406" });

  if (stageIndex >= 4) {
    appendSvgElement(group, "path", { class: "tower-basement-cap", d: "M198 " + wallTop + " H402" });
  }
}

function appendTowerBasementWalls(group, stageIndex, wallTop) {
  const leftWall = "M198 198 H240 V" + wallTop + " H202 Z";
  const rightWall = "M360 198 H402 L398 " + wallTop + " H360 Z";

  appendSvgElement(group, "path", { class: "tower-basement-wall-shadow", d: leftWall + " " + rightWall });
  appendSvgElement(group, "path", { class: "tower-basement-wall", d: leftWall });
  appendSvgElement(group, "path", { class: "tower-basement-wall", d: rightWall });
  appendSvgElement(group, "path", { class: "tower-basement-wall-highlight", d: "M207 194 V" + (wallTop + 5) + " M393 194 V" + (wallTop + 5) });

  const courseGap = stageIndex <= 1 ? 16 : 18;
  let courseY = 190;
  const courses = [];

  while (courseY > wallTop + 8) {
    courses.push("M202 " + courseY + " H239 M361 " + courseY + " H398");
    courseY -= courseGap;
  }

  if (courses.length > 0) {
    appendSvgElement(group, "path", { class: "tower-basement-stone-line", d: courses.join(" ") });
  }
}

function appendTowerBasementBracing(group, wallTop) {
  const bracing = appendSvgElement(group, "g", { "aria-label": "Temporary outer wall staging" });
  const bracingPath =
    "M174 198 V" +
    (wallTop + 6) +
    " M426 198 V" +
    (wallTop + 6) +
    " M170 178 H196 M404 178 H430 M176 196 L198 " +
    (wallTop + 10) +
    " M424 196 L402 " +
    (wallTop + 10);

  appendSvgElement(bracing, "path", {
    class: "tower-timber-shadow",
    d: bracingPath,
  });
  appendSvgElement(bracing, "path", {
    class: "tower-timber",
    d: bracingPath,
  });
  appendSvgElement(bracing, "path", {
    class: "tower-timber-grain",
    d:
      "M177 194 V" +
      (wallTop + 10) +
      " M423 194 V" +
      (wallTop + 10) +
      " M174 175 H193 M407 175 H426",
  });
}

function createProjectWorkProgress(projectName, level, state) {
  if (level) {
    return createUiProgressMeter({
      label: "Work",
      current: state.work || 0,
      max: level.workRequired || 0,
      valueText: formatTrainingNumber(state.work || 0) + " / " + formatTrainingNumber(level.workRequired || 0),
      className: "project-progress-group",
    });
  }

  return createUiProgressMeter({
    label: "Work",
    current: 1,
    max: 1,
    valueText: "complete",
    className: "project-progress-group",
  });
}

function createTowerFoundationActivationProgress(projectName, level, state) {
  const group = document.createElement("div");
  group.className = "project-progress-group tower-activation-progress-group";

  const text = document.createElement("div");
  text.className = "training-progress-text";

  if (level) {
    text.textContent =
      "Activation: " +
      formatTrainingNumber(state.work || 0) +
      " / " +
      formatTrainingNumber(level.workRequired || 0) +
      " Mana";
  } else {
    text.textContent = "Activation: complete";
  }

  const track = document.createElement("div");
  track.className = "training-progress-track";

  const fill = document.createElement("div");
  fill.className = "training-progress-fill";

  if (level && level.workRequired > 0) {
    fill.style.width = Math.min(Math.max((state.work || 0) / level.workRequired, 0), 1) * 100 + "%";
  } else {
    fill.style.width = "100%";
  }

  track.appendChild(fill);
  group.appendChild(text);
  group.appendChild(track);

  return group;
}

function createProjectMaterialList(projectName, level) {
  const list = document.createElement("div");
  list.className = "project-material-list";

  if (!level || !level.materials || Object.keys(level.materials).length === 0) {
    list.appendChild(createUiEmptyState("Materials: complete"));
    return list;
  }

  for (let resourceName in level.materials) {
    list.appendChild(createProjectMaterialRow(projectName, resourceName));
  }

  return list;
}

function createProjectMaterialRow(projectName, resourceName) {
  const resource = getResource(resourceName);
  const row = document.createElement("div");
  row.className = "project-material-row";

  const label = document.createElement("span");
  label.textContent =
    (resource ? resource.label : resourceName) +
    ": " +
    formatTrainingNumber(getProjectMaterialDeposited(projectName, resourceName)) +
    " / " +
    formatTrainingNumber(getProjectMaterialRequirement(projectName, resourceName));

  const button = createUiActionButton({
    label: "Deposit",
    className: "project-deposit-btn",
    progress: false,
    dataset: {
      projectDeposit: projectName,
      resource: resourceName,
    },
    onClick: function () {
      depositProjectResource(projectName, resourceName);
    },
  });

  row.appendChild(label);
  row.appendChild(button);

  return row;
}

function createProjectActions(projectName, definition, state) {
  const actions = document.createElement("div");
  actions.className = "project-actions";

  const button = createUiActionButton({
    label: state.completed ? "Project Complete" : getProjectWorkActionLabel(projectName),
    cost: state.completed ? "" : formatCost(getProjectWorkCost(projectName)),
    className: "project-work-btn",
    dataset: {
      projectWork: projectName,
    },
    onClick: function () {
      startProjectWork(projectName);
    },
  });

  definition.workButton = button;
  actions.appendChild(button);

  return actions;
}

function createTowerProjectActions(projectName, definition, state) {
  const actions = document.createElement("div");
  actions.className = "project-actions tower-project-actions";

  const actionName = document.createElement("div");
  actionName.className = "tower-project-action-name";
  actionName.textContent = state.completed ? "Project Complete" : getProjectWorkActionLabel(projectName);

  const buttonGroup = document.createElement("div");
  buttonGroup.className = "tower-project-action-buttons";

  definition.workButtons = {};

  if (isTowerFoundationHeartActivationLevel(projectName)) {
    const imbueButton = createTowerProjectWorkButton(projectName, PROJECT_WORK_MODE_IMBUE_HEART);

    definition.workButton = imbueButton;
    definition.workButtons[PROJECT_WORK_MODE_IMBUE_HEART] = imbueButton;
    buttonGroup.appendChild(imbueButton);
  } else {
    const energyButton = createTowerProjectWorkButton(projectName, PROJECT_WORK_MODE_ENERGY);
    const arcaneForceButton = createTowerProjectWorkButton(projectName, PROJECT_WORK_MODE_ARCANE_FORCE);

    definition.workButton = energyButton;
    definition.workButtons[PROJECT_WORK_MODE_ENERGY] = energyButton;
    definition.workButtons[PROJECT_WORK_MODE_ARCANE_FORCE] = arcaneForceButton;
    buttonGroup.appendChild(energyButton);
    buttonGroup.appendChild(arcaneForceButton);
  }

  actions.appendChild(actionName);
  actions.appendChild(buttonGroup);

  return actions;
}

function createTowerProjectWorkButton(projectName, mode) {
  return createUiActionButton({
    label: getProjectWorkModeActionLabel(projectName, mode),
    cost: formatCost(getProjectWorkCost(projectName, mode)),
    className: "project-work-btn tower-project-work-btn",
    dataset: {
      projectWork: projectName,
      projectWorkMode: mode,
    },
    onClick: function () {
      startProjectWork(projectName, mode);
    },
  });
}

function getProjectWorkModeActionLabel(projectName, mode) {
  if (isProjectImbueHeartWorkMode(projectName, mode)) {
    const level = getProjectCurrentLevel(projectName);

    return (level && (level.activationLabel || level.actionLabel)) || "Imbue Heart";
  }

  if (isProjectArcaneForceWorkMode(projectName, mode)) {
    return "Arcane Force";
  }

  return getProjectWorkActionLabel(projectName);
}

function getProjectWorkModeButtonLabel(projectName, mode) {
  if (isProjectImbueHeartWorkMode(projectName, mode)) {
    const level = getProjectCurrentLevel(projectName);
    const label = (level && (level.activationLabel || level.actionLabel)) || "Imbue Heart";

    return label + " - " + formatCost(getProjectWorkCost(projectName, mode));
  }

  if (isProjectArcaneForceWorkMode(projectName, mode)) {
    return "Arcane Force - " + formatCost(getProjectWorkCost(projectName, mode));
  }

  return formatCost(getProjectWorkCost(projectName, mode));
}

function updateProjectButtons() {
  if (!ui.projectList) return;

  const definitions = getProjectDefinitions();

  for (let projectName in definitions) {
    updateProjectWorkButtonState(projectName);
    updateProjectDepositButtonStates(projectName);
  }
}

function updateProjectWorkButtonState(projectName) {
  const definition = getProjectDefinition(projectName);

  if (!definition || !definition.workButton) return;

  if (isTowerProject(projectName)) {
    updateTowerProjectWorkButtonStates(projectName, definition);
    return;
  }

  const state = getProjectState(projectName);
  const isActiveProjectWork = isActivityActive() && gameState.activity.kind === "projectWork" && gameState.activity.id === projectName;
  const canStart = canWorkOnProject(projectName);

  definition.workButton.classList.toggle("running", isActiveProjectWork);
  definition.workButton.disabled = state.completed || (!isActiveProjectWork && (isActivityActive() || !canStart));

  if (state.completed) {
    setUiActionButtonLabel(definition.workButton, {
      label: "Project Complete",
      cost: "",
    });
  } else if (getProjectWorkRemaining(projectName) <= 0) {
    setUiActionButtonLabel(definition.workButton, {
      label: "Work Complete",
      cost: "",
    });
  } else {
    setUiActionButtonLabel(definition.workButton, {
      label: getProjectWorkActionLabel(projectName),
      cost: formatCost(getProjectWorkCost(projectName)),
    });
  }

  renderTowerStatusPanel();
}

function updateTowerProjectWorkButtonStates(projectName, definition) {
  const state = getProjectState(projectName);
  const isActiveProjectWork = isActivityActive() && gameState.activity.kind === "projectWork" && gameState.activity.id === projectName;
  const activeMode = isActiveProjectWork ? getNormalizedProjectWorkMode(projectName, gameState.activity.mode) : null;

  if (!state || !definition.workButtons) return;

  Object.keys(definition.workButtons).forEach(function (mode) {
    const button = definition.workButtons[mode];
    const isActiveMode = isActiveProjectWork && activeMode === mode;
    const canStart = canWorkOnProject(projectName, mode);

    if (!button) return;

    button.classList.toggle("running", isActiveMode);
    button.disabled = state.completed || (!isActiveMode && (isActivityActive() || !canStart));

    if (state.completed) {
      setUiActionButtonLabel(button, {
        label: "Project Complete",
        cost: "",
      });
    } else if (getProjectWorkRemaining(projectName) <= 0) {
      setUiActionButtonLabel(button, {
        label: isProjectImbueHeartWorkMode(projectName, mode) ? "Activation Complete" : "Work Complete",
        cost: "",
      });
    } else {
      setUiActionButtonLabel(button, {
        label: getProjectWorkModeActionLabel(projectName, mode),
        cost: formatCost(getProjectWorkCost(projectName, mode)),
      });
    }
  });

  renderTowerStatusPanel();
}

function updateProjectDepositButtonStates(projectName) {
  if (!ui.projectList) return;

  const state = getProjectState(projectName);
  const buttons = ui.projectList.querySelectorAll('[data-project-deposit="' + projectName + '"]');

  buttons.forEach(function (button) {
    const resourceName = button.dataset.resource;
    const resource = getResource(resourceName);
    const remaining = getProjectMaterialRemaining(projectName, resourceName);
    const amount = resource ? Math.min(resource.value, remaining) : 0;

    button.disabled = state.completed || isActivityActive() || remaining <= 0 || amount <= 0;
    setUiActionButtonLabel(button, {
      label: remaining <= 0 ? "Done" : "Deposit",
      detail: remaining <= 0 ? "" : formatTrainingNumber(amount),
      progress: false,
    });
  });

  renderTowerStatusPanel();
}

function resetProjectWorkButtonProgress(projectName) {
  const definition = getProjectDefinition(projectName);
  const buttons = definition && definition.workButtons ? Object.values(definition.workButtons) : [definition ? definition.workButton : null];

  buttons.forEach(function (button) {
    const progressFill = button ? button.querySelector(".progressFill") : null;

    if (progressFill) {
      progressFill.style.width = "0%";
    }
  });
}

function getVisibleResearchEntries() {
  const entries = [];

  const researchDefinitions = getResearchDefinitions();

  for (let researchName in researchDefinitions) {
    const research = getResearch(researchName);

    if (!research.unlocked && !research.completed) continue;

    entries.push({
      id: researchName,
      type: "research",
      label: research.label,
      story: research.story || "",
      unlocks: research.unlocks || [],
      status: research.completed ? "complete" : research.blocked ? "blocked" : "available",
      lockedReason: research.lockedReason || "",
      unlockedAt: research.unlockedAt || 0,
    });
  }

  entries.sort(function (a, b) {
    return (b.unlockedAt || 0) - (a.unlockedAt || 0);
  });

  return entries;
}

function getResearchEntry(entryType, entryId) {
  return getVisibleResearchEntries().find(function (entry) {
    return entry.type === entryType && entry.id === entryId;
  });
}

function getResearchEntryKey(entry) {
  return entry.type + ":" + entry.id;
}

function updateResearchHistoryUI() {
  if (!ui.researchList || !ui.researchDetails) return;

  const entries = getVisibleResearchEntries();

  ui.researchList.innerHTML = "";

  if (entries.length === 0) {
    ui.researchList.appendChild(createUiEmptyState("No research recorded yet."));
    renderResearchDetails(null);
    return;
  }

  if (!gameState.selectedResearchEntry) {
    gameState.selectedResearchEntry = getResearchEntryKey(entries[0]);
  }

  let selectedEntry = null;

  entries.forEach(function (entry) {
    const key = getResearchEntryKey(entry);

    if (key === gameState.selectedResearchEntry) {
      selectedEntry = entry;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("research-list-item", "ui-summary-list-item");
    button.classList.toggle("active", key === gameState.selectedResearchEntry);

    const title = document.createElement("span");
    title.textContent = entry.label;

    const status = document.createElement("span");
    status.classList.add("research-status");
    status.textContent = getResearchStatusLabel(entry.status);

    button.appendChild(title);
    button.appendChild(status);

    button.addEventListener("click", function () {
      gameState.selectedResearchEntry = key;
      updateResearchHistoryUI();
    });

    ui.researchList.appendChild(button);
  });

  if (!selectedEntry) {
    selectedEntry = entries[0];
    gameState.selectedResearchEntry = getResearchEntryKey(selectedEntry);
  }

  renderResearchDetails(selectedEntry);
}

function renderResearchDetails(entry) {
  if (!ui.researchDetails) return;

  ui.researchDetails.innerHTML = "";

  if (!entry) {
    ui.researchDetails.appendChild(createUiEmptyState("Select research to view details."));
    return;
  }

  ui.researchDetails.appendChild(
    createUiSummaryCard({
      title: entry.label,
      meta: getResearchStatusLabel(entry.status),
      body: entry.story || "No notes recorded.",
      className: "research-detail-summary",
    })
  );

  const unlockTitle = document.createElement("h5");
  unlockTitle.textContent = "Unlocks";
  ui.researchDetails.appendChild(unlockTitle);

  if (!entry.unlocks || entry.unlocks.length === 0) {
    ui.researchDetails.appendChild(createUiEmptyState("No unlocks recorded."));
  } else {
    const list = document.createElement("ul");
    list.classList.add("research-unlock-list");

    entry.unlocks.forEach(function (unlock) {
      const item = document.createElement("li");
      item.textContent = getUnlockDisplayText(unlock);
      list.appendChild(item);
    });

    ui.researchDetails.appendChild(list);
  }

  if (entry.type === "research" && entry.status === "blocked") {
    ui.researchDetails.appendChild(createUiEmptyState(entry.lockedReason || "More information is needed before this research can begin."));
  }

  if (entry.type === "research" && entry.status === "available") {
    const research = getResearch(entry.id);

    const costTitle = document.createElement("h5");
    costTitle.textContent = "Cost";
    ui.researchDetails.appendChild(costTitle);

    const costText = document.createElement("div");
    costText.classList.add("research-cost");
    costText.textContent = formatCost(getCraftCost("research", entry.id));
    ui.researchDetails.appendChild(costText);

    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("action-btn", "research-complete-btn");
    button.dataset.research = entry.id;

    research.button = button;

    setCraftButtonLabel(button, "Research " + entry.label, formatCost(getCraftCost("research", entry.id)));

    const researchName = entry.id;

    button.addEventListener("click", function (event) {
      event.preventDefault();

      startCrafting("research", researchName);
    });

    ui.researchDetails.appendChild(button);
    updateSelectedResearchButtonState();
  }
}

function getResearchStatusLabel(status) {
  if (status === "complete") return "Complete";
  if (status === "blocked") return "Incomplete";

  return "Available";
}

function updateSelectedResearchButtonState() {
  if (!ui.researchDetails) return;

  const button = ui.researchDetails.querySelector(".research-complete-btn");

  if (!button || !button.dataset.research) return;

  const researchName = button.dataset.research;
  const research = getResearch(researchName);

  if (!research) return;

  const isActiveResearch =
    isActivityActive() && gameState.activity.kind === "craft" && gameState.activity.type === "research" && gameState.activity.id === researchName;

  const canStartResearch = isCraftAvailable("research", researchName) && canAffordCost(getCraftCost("research", researchName));

  button.disabled = !isActiveResearch && (isActivityActive() || !canStartResearch);
  button.classList.toggle("running", isActiveResearch);
}

function getUnlockDisplayText(unlock) {
  if (!unlock) return "Unknown";

  if (unlock.type === "gearUpgrade") {
    const gear = getGearUpgrade(unlock.id);
    return gear ? gear.displayName || gear.label : unlock.id;
  }

  if (unlock.type === "campUpgrade") {
    const upgrade = getCampUpgrade(unlock.id);
    return upgrade ? upgrade.label : unlock.id;
  }

  if (unlock.type === "resourceCraft") {
    const craft = getResourceCraft(unlock.id);
    return craft ? craft.label : unlock.id;
  }

  if (unlock.type === "resource") {
    const resource = getResource(unlock.id);
    return resource ? resource.label : unlock.id;
  }

  if (unlock.type === "action") {
    const action = getAction(unlock.id);
    return action ? action.label : unlock.id;
  }

  if (unlock.type === "research") {
    const research = getResearch(unlock.id);
    return research ? research.label : unlock.id;
  }

  if (unlock.type === "region") {
    const region = getRegionDefinition(unlock.id);
    return region ? region.label : unlock.id;
  }

  if (unlock.type === "journal") {
    const journal = getJournalEntryDefinition(unlock.id);
    return journal ? journal.title : unlock.id;
  }

  if (unlock.type === "spell") {
    const spell = getSpell(unlock.id);
    return spell ? spell.label : unlock.id;
  }

  if (unlock.type === "goal") {
    const goal = getGoal(unlock.id);
    return goal ? goal.title : unlock.id;
  }

  if (unlock.type === "project") {
    const project = getProjectDefinition(unlock.id);
    return project ? project.label : unlock.id;
  }

  return unlock.id;
}

function unlockAutomation(machineName) {
  const machine = getAutomation(machineName);

  if (!machine) {
    console.warn("Unknown automation:", machineName);
    return;
  }

  if (machine.unlocked) return;

  machine.unlocked = true;

  if (typeof updateAutomationUI === "function") {
    updateAutomationUI();
  }

  updateWorkTabsVisibility();
}

function hasUnlockedAutomation() {
  const machines = getAutomationDefinitions();

  for (let machineName in machines) {
    if (machines[machineName].unlocked) return true;
  }

  return false;
}

function updateAutomationUI() {
  if (!ui.automationList) return;

  ui.automationList.innerHTML = "";

  const machines = getAutomationDefinitions();

  for (let machineName in machines) {
    const machine = machines[machineName];

    if (!machine.unlocked) continue;

    const row = document.createElement("div");
    row.className = "automation-row";
    row.dataset.automation = machineName;

    const title = document.createElement("strong");
    title.textContent = machine.label;

    const details = document.createElement("div");
    details.className = "automation-details";
    details.textContent = getAutomationDetailsText(machine);

    const progress = document.createElement("div");
    progress.className = "automation-progress";

    const fill = document.createElement("div");
    fill.className = "progressFill";
    fill.style.width = Math.floor((machine.progress || 0) * 100) + "%";

    progress.appendChild(fill);

    const button = createUiActionButton({
      label: "Imbue Mana",
      cost: formatCost(machine.fuelCost || {}),
      className: "automation-imbue-btn",
      progress: false,
      onClick: function () {
        imbueAutomation(machineName);
      },
    });
    button.disabled = !canImbueAutomation(machineName);

    const crystalButton = createUiActionButton({
      label: "Use Charged Crystal",
      cost: "1 Charged Mana Crystal",
      className: "automation-crystal-btn",
      progress: false,
      onClick: function () {
        chargeAutomationWithCrystal(machineName);
      },
    });
    crystalButton.disabled = !canChargeAutomationWithCrystal(machineName);

    row.appendChild(title);
    row.appendChild(details);
    row.appendChild(progress);
    row.appendChild(button);
    row.appendChild(crystalButton);
    ui.automationList.appendChild(row);
  }
}

function canImbueAutomation(machineName) {
  const machine = getAutomation(machineName);

  if (!isCampWorkContextAvailable()) return false;
  if (!machine || !machine.unlocked) return false;

  return canAffordCost(machine.fuelCost);
}

function imbueAutomation(machineName) {
  const machine = getAutomation(machineName);

  if (!isCampWorkContextAvailable()) return;
  if (!machine || !machine.unlocked) return;
  if (!spendCost(machine.fuelCost)) return;

  machine.cycles += machine.cyclesPerMana;
  updateAutomationUI();
}

function canChargeAutomationWithCrystal(machineName) {
  const machine = getAutomation(machineName);

  if (!isCampWorkContextAvailable()) return false;
  if (!machine || !machine.unlocked) return false;

  return canAffordCost({ chargedCrystal: 1 });
}

function chargeAutomationWithCrystal(machineName) {
  const machine = getAutomation(machineName);

  if (!isCampWorkContextAvailable()) return;
  if (!machine || !machine.unlocked) return;
  if (!spendCost({ chargedCrystal: 1 })) return;

  machine.cycles += 100;
  updateAutomationUI();
}

function getAutomationCyclesPerOutput(machine) {
  return machine && Number.isFinite(machine.cyclesPerOutput) && machine.cyclesPerOutput > 0 ? machine.cyclesPerOutput : 1;
}

function getAutomationDetailsText(machine) {
  const cyclesPerOutput = getAutomationCyclesPerOutput(machine);
  const parts = ["Cycles: " + (machine.cycles || 0)];

  if (cyclesPerOutput > 1) {
    parts.push("Output: " + cyclesPerOutput + " cycles");
  }

  return parts.join(" | ");
}

function canReceiveAutomationProduces(machine) {
  if (!machine || !machine.produces) return false;

  const resource = getResource(machine.produces.resource);

  if (!resource) return false;

  return resource.value + machine.produces.amount <= resource.maxValue;
}

function processAutomation(deltaSeconds) {
  const machines = getAutomationDefinitions();

  for (let machineName in machines) {
    const machine = machines[machineName];
    const cyclesPerOutput = getAutomationCyclesPerOutput(machine);

    if (!machine.unlocked || machine.cycles < cyclesPerOutput) continue;
    if (!canReceiveAutomationProduces(machine)) continue;

    machine.progress += deltaSeconds / machine.duration;

    while (machine.progress >= 1 && machine.cycles >= cyclesPerOutput) {
      if (!canReceiveAutomationProduces(machine)) break;

      addResource(machine.produces.resource, machine.produces.amount);
      machine.cycles -= cyclesPerOutput;
      machine.progress -= 1;
    }

    if (machine.cycles < cyclesPerOutput) {
      machine.progress = 0;
    }
  }

  updateAutomationProgressUI();
}

function updateAutomationProgressUI() {
  if (!ui.automationList || !ui.automationPanel || ui.automationPanel.style.display === "none") return;

  const machines = getAutomationDefinitions();

  for (let machineName in machines) {
    const row = ui.automationList.querySelector('[data-automation="' + machineName + '"]');
    const machine = machines[machineName];

    if (!row || !machine) continue;

    const fill = row.querySelector(".progressFill");
    const details = row.querySelector(".automation-details");
    const button = row.querySelector(".automation-imbue-btn");
    const crystalButton = row.querySelector(".automation-crystal-btn");

    if (fill) {
      fill.style.width = Math.floor((machine.progress || 0) * 100) + "%";
    }

    if (details) {
      details.textContent = getAutomationDetailsText(machine);
    }

    if (button) {
      button.disabled = !canImbueAutomation(machineName);
    }

    if (crystalButton) {
      crystalButton.disabled = !canChargeAutomationWithCrystal(machineName);
    }
  }
}

function getSpellProgressDefinition(spellName) {
  return SPELL_PROGRESS_DEFINITIONS[spellName] || null;
}

function getDefaultSpellProgressState() {
  return {
    xp: 0,
    level: 0,
  };
}

function ensureSpellProgressState() {
  if (!gameState.magic || typeof gameState.magic !== "object" || Array.isArray(gameState.magic)) {
    gameState.magic = {};
  }

  if (!gameState.magic.spellProgress || typeof gameState.magic.spellProgress !== "object" || Array.isArray(gameState.magic.spellProgress)) {
    gameState.magic.spellProgress = {};
  }

  for (let spellName in SPELL_PROGRESS_DEFINITIONS) {
    normalizeSpellProgressState(spellName);
  }
}

function normalizeSpellProgressState(spellName) {
  const definition = getSpellProgressDefinition(spellName);
  const saved = gameState.magic.spellProgress[spellName];

  if (!definition) return;

  if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
    gameState.magic.spellProgress[spellName] = getDefaultSpellProgressState();
  }

  const progress = gameState.magic.spellProgress[spellName];
  progress.xp = Number.isFinite(progress.xp) ? Math.max(0, progress.xp) : 0;
  progress.level = getSpellLevelFromXp(spellName, progress.xp);
}

function getSpellProgressState(spellName) {
  ensureSpellProgressState();
  return gameState.magic.spellProgress[spellName] || getDefaultSpellProgressState();
}

function getSpellLevelFromXp(spellName, xp) {
  const definition = getSpellProgressDefinition(spellName);
  let level = 0;

  if (!definition || !Array.isArray(definition.thresholds)) return level;

  for (let i = 0; i < definition.thresholds.length; i++) {
    if (xp >= definition.thresholds[i]) {
      level = i + 1;
    }
  }

  return Math.min(level, definition.maxLevel || level);
}

function getAttunementProgressState() {
  return getSpellProgressState("attunement");
}

function getManaSenseProgressState() {
  return getSpellProgressState("manaSense");
}

function getManaSenseLevel() {
  return getManaSenseProgressState().level || 0;
}

function getManaSenseHiddenDiscoveryBonusChance() {
  const spell = getSpell("manaSense");

  if (!spell || !spell.unlocked) return 0;

  return 5 + getManaSenseLevel() * 5;
}

function getManaSenseCrystalBonusRolls(level = getManaSenseLevel()) {
  if (level >= 5) {
    return [0.8, 0.5];
  }

  if (level >= 4) {
    return [0.8, 0.35];
  }

  if (level >= 3) {
    return [0.7, 0.2];
  }

  if (level >= 2) {
    return [0.6];
  }

  if (level >= 1) {
    return [0.5];
  }

  return [];
}

function rollManaSenseBonusManaCrystals() {
  const chances = getManaSenseCrystalBonusRolls();
  let amount = 0;

  for (let i = 0; i < chances.length; i++) {
    if (Math.random() < chances[i]) {
      amount += 1;
    }
  }

  return amount;
}

function getManaSenseCrystalBonusText(level = getManaSenseLevel()) {
  const chances = getManaSenseCrystalBonusRolls(level);

  if (chances.length === 0) return "No bonus crystal sensing yet";

  if (chances.length === 1) {
    return Math.round(chances[0] * 100) + "% chance for +1 bonus mana crystal";
  }

  return (
    Math.round(chances[0] * 100) +
    "% chance for +1 bonus mana crystal, then " +
    Math.round(chances[1] * 100) +
    "% chance for +1 more"
  );
}

function getManaSenseLevelRewardText(level) {
  const rewards = [
    "Original Mana Sense, +5% hidden discovery",
    "Stone Sense, +10% hidden discovery, " + getManaSenseCrystalBonusText(1),
    "+15% hidden discovery, " + getManaSenseCrystalBonusText(2),
    "+20% hidden discovery, " + getManaSenseCrystalBonusText(3),
    "+25% hidden discovery, " + getManaSenseCrystalBonusText(4) + ", Advanced Recall prerequisite",
    "+30% hidden discovery, " + getManaSenseCrystalBonusText(5) + ", Rank 2 research ready",
  ];

  return rewards[Math.max(0, Math.min(level, rewards.length - 1))];
}

function getStoneSenseOreFindChance() {
  return Math.min(1, 0.2 + getManaSenseLevel() * 0.16);
}

function recordManaSenseExperience(amount) {
  if (!Number.isFinite(amount) || amount <= 0) return;

  const progress = getManaSenseProgressState();
  const oldLevel = progress.level || 0;

  progress.xp = roundResourceAmount((progress.xp || 0) + amount);
  progress.level = getSpellLevelFromXp("manaSense", progress.xp);

  if (progress.level > oldLevel) {
    addStoryEntry("Mana Sense reaches deeper. " + getManaSenseLevelRewardText(progress.level) + ".");
  }

  updateEquipmentSlotUI();
}

function getAttunementLevel() {
  return getAttunementProgressState().level || 0;
}

function getAttunementBonusMultiplier() {
  return 1 + getAttunementLevel() * 0.2;
}

function getAttunementCapacityFromLevel() {
  const level = getAttunementLevel();

  if (level >= 4) return 3;
  if (level >= 2) return 2;

  return 1;
}

function getAttunementLevelRewardText(level) {
  const capacity = level >= 4 ? 3 : level >= 2 ? 2 : 1;
  const bonusPercent = level * 20;
  let rewardText = "Attunement bonuses +" + bonusPercent + "%, " + capacity + " attunement slot" + (capacity === 1 ? "" : "s");

  if (level >= 5) {
    rewardText += ", Reinforced Body";
  }

  return rewardText;
}

function recordAttunementExperience(amount) {
  if (!Number.isFinite(amount) || amount <= 0) return;

  const progress = getAttunementProgressState();
  const oldLevel = progress.level || 0;

  progress.xp = roundResourceAmount((progress.xp || 0) + amount);
  progress.level = getSpellLevelFromXp("attunement", progress.xp);

  if (progress.level > oldLevel) {
    addStoryEntry("Your attunement settles deeper. " + getAttunementLevelRewardText(progress.level) + ".");
  }

  getAttunementState();
  updateEquipmentSlotUI();
}

function getArcaneForceProgressState() {
  return getSpellProgressState("arcaneForce");
}

function getImbueProgressState() {
  return getSpellProgressState("imbue");
}

function getImbueLevel() {
  return getImbueProgressState().level || 0;
}

function getImbueCapacity() {
  const capacities = [2, 5, 8, 12, 16, 20];

  return capacities[Math.max(0, Math.min(getImbueLevel(), capacities.length - 1))];
}

function getImbueLevelRewardText(level) {
  const rewards = [
    "2 mana capacity: Imbue Wood, Hunting Lure, and Weak Stamina Tonic",
    "5 mana capacity: Charge Mana Crystal and Concentrated Stamina Tonic",
    "8 mana capacity: Minor Mana Tonic",
    "12 mana capacity: Major Mana Tonic",
    "16 mana capacity: Charge Crystal Cluster",
    "20 mana capacity: Imbue 10 Wood, Create Mana Crystal; Rank 2 research ready",
  ];

  return rewards[Math.max(0, Math.min(level, rewards.length - 1))];
}

function recordImbueExperience(amount) {
  if (!Number.isFinite(amount) || amount <= 0) return;

  const progress = getImbueProgressState();
  const oldLevel = progress.level || 0;

  progress.xp = roundResourceAmount((progress.xp || 0) + amount);
  progress.level = getSpellLevelFromXp("imbue", progress.xp);

  if (progress.level > oldLevel) {
    addStoryEntry("Imbue holds more of the pattern. " + getImbueLevelRewardText(progress.level) + ".");
  }

  updateEquipmentSlotUI();
}

function getArcaneForceLevel() {
  return getArcaneForceProgressState().level || 0;
}

function getWardLevelRewardText(level) {
  const progression = WARD_RANK_1_PROGRESSION[Math.max(0, Math.min(level, WARD_RANK_1_PROGRESSION.length - 1))];
  const maintainText = level >= 3 ? ", Maintain Ward" : "";
  return progression.maxWard + " maximum Ward · " + formatResourceAmountForDisplay(progression.restoreEfficiency) + " Ward per mana" + maintainText;
}

function recordWardExperience(amount) {
  if (!Number.isFinite(amount) || amount <= 0) return;

  const progress = getSpellProgressState("ward");
  const oldLevel = progress.level || 0;
  progress.xp = roundResourceAmount((progress.xp || 0) + amount);
  progress.level = getSpellLevelFromXp("ward", progress.xp);
  syncWardResourceState();

  if (progress.level > oldLevel) {
    addStoryEntry("Your Ward strengthens. " + getWardLevelRewardText(progress.level) + ".");
  }
}

function getArcaneForceLevelRewardText(level) {
  const rewards = [
    "Shape Nails",
    "Shape tool parts",
    "Force-open dungeon doors",
    "Bulk harvest herbs and glimmerleaf",
    "Detonate ore nodes",
    "Rank 2 research ready, story gated",
  ];

  return rewards[Math.max(0, Math.min(level, rewards.length - 1))];
}

function recordArcaneForceExperience(amount) {
  if (!Number.isFinite(amount) || amount <= 0) return;

  const progress = getArcaneForceProgressState();
  const oldLevel = progress.level || 0;

  progress.xp = roundResourceAmount((progress.xp || 0) + amount);
  progress.level = getSpellLevelFromXp("arcaneForce", progress.xp);

  if (progress.level > oldLevel) {
    addStoryEntry("Arcane Force answers with more precision. " + getArcaneForceLevelRewardText(progress.level) + ".");
  }

  updateEquipmentSlotUI();
}

function recordSpellProgressExperience(spellName, amount) {
  if (spellName === "manaSense") {
    recordManaSenseExperience(amount);
    return;
  }

  if (spellName === "attunement") {
    recordAttunementExperience(amount);
    return;
  }

  if (spellName === "imbue") {
    recordImbueExperience(amount);
    return;
  }

  if (spellName === "arcaneForce") {
    recordArcaneForceExperience(amount);
    return;
  }

  if (spellName === "ward") {
    recordWardExperience(amount);
  }
}

function getAttunementState() {
  ensureSpellProgressState();

  if (!gameState.magic.attunements) {
    gameState.magic.attunements = {
      capacity: 1,
      active: [],
    };
  }

  if (!Array.isArray(gameState.magic.attunements.active)) {
    gameState.magic.attunements.active = [];
  }

  gameState.magic.attunements.active = gameState.magic.attunements.active.filter(function (entry) {
    return entry && entry.id && !!getAttunementDefinition(entry.id);
  });

  const derivedCapacity = getAttunementCapacityFromLevel();

  gameState.magic.attunements.capacity = derivedCapacity;

  if (gameState.magic.attunements.active.length > derivedCapacity) {
    gameState.magic.attunements.active = gameState.magic.attunements.active.slice(0, derivedCapacity);
  }

  return gameState.magic.attunements;
}

function getActiveAttunements() {
  return getAttunementState().active;
}

function hasActiveAttunement(attunementName) {
  return getActiveAttunements().some(function (entry) {
    return entry.id === attunementName;
  });
}

function getActiveAttunementEffectTotal(effectName) {
  return getActiveAttunements().reduce(function (total, entry) {
    const definition = getAttunementDefinition(entry.id);

    return total + getAttunementScaledEffectValue(entry.id, definition, effectName);
  }, 0);
}

function getAttunementScaledEffectValue(attunementName, definition, effectName) {
  const effects = definition ? definition.effects || {} : {};

  if (attunementName === "reinforcedBody" && effectName === "maxEnergyFlat" && typeof getReinforcedBodyMaxEnergyBonus === "function") {
    return getReinforcedBodyMaxEnergyBonus();
  }

  return (effects[effectName] || 0) * getAttunementBonusMultiplier();
}

function getAttunementTargetDescription(attunementName, definition, options = {}) {
  const effects = definition ? definition.effects || {} : {};
  const parts = [];

  if (effects.travelDistanceFlat) {
    parts.push(
      "+" + formatAttunementEffectNumber(getAttunementScaledEffectValue(attunementName, definition, "travelDistanceFlat")) + " travel distance per step"
    );
  }

  if (effects.carryCapacityFlat) {
    parts.push("+" + formatAttunementEffectNumber(getAttunementScaledEffectValue(attunementName, definition, "carryCapacityFlat")) + " carry capacity");
  }

  if (effects.maxEnergyFlat) {
    parts.push("+" + formatAttunementEffectNumber(getAttunementScaledEffectValue(attunementName, definition, "maxEnergyFlat")) + " max energy");
  }

  if (effects.huntSuccessChancePerLevel) {
    const chanceBonus = getAttunementLevel() * effects.huntSuccessChancePerLevel;
    parts.push("+" + formatAttunementEffectPercent(chanceBonus) + " hunt success chance");

    if (effects.maxLevelHuntRewardFlat) {
      const rewardText = "+" + formatAttunementEffectNumber(effects.maxLevelHuntRewardFlat) + " pelt";
      parts.push(getAttunementLevel() >= 5 ? rewardText + " from successful hunts" : rewardText + " at level 5");
    }
  }

  if (parts.length === 0) return definition.description || "";

  return (options.prefix === false ? "" : "Current bonus: ") + parts.join("; ");
}

function formatAttunementEffectNumber(value) {
  const rounded = Math.round(value * 10) / 10;

  if (Math.abs(rounded - Math.round(rounded)) < 0.01) {
    return String(Math.round(rounded));
  }

  return String(rounded);
}

function formatAttunementEffectPercent(value) {
  return formatAttunementEffectNumber(value * 100) + "%";
}

function clearActiveAttunements() {
  getAttunementState().active = [];
  recalculateCharacterStats();
  updateEquipmentSlotUI();
}

function hideSpellTargetMenu() {
  openSpellMenuName = null;

  if (ui.spellTargetMenu) {
    ui.spellTargetMenu.innerHTML = "";
    hideElement(ui.spellTargetMenu);
  }

  if (!ui.spellSlots) return;

  const spellBoxes = ui.spellSlots.querySelectorAll("[aria-controls='spellTargetMenu']");
  spellBoxes.forEach(function (box) {
    box.setAttribute("aria-expanded", "false");
  });
}

function hideAttunementTargetMenu() {
  hideSpellTargetMenu();
}

function toggleAttunementTargetMenu() {
  toggleSpellTargetMenu("attunement");
}

function toggleImbueTargetMenu() {
  toggleProductionSpellTargetMenu("imbue");
}

function toggleProductionSpellTargetMenu(spellName) {
  toggleSpellTargetMenu(spellName);
}

function toggleSpellTargetMenu(spellName) {
  openSpellMenuName = openSpellMenuName === spellName ? null : spellName;
  updateEquipmentSlotUI();
}

function renderOpenSpellTargetMenu() {
  if (!ui.spellTargetMenu) return;

  ui.spellTargetMenu.innerHTML = "";

  if (!openSpellMenuName) {
    hideElement(ui.spellTargetMenu);
    return;
  }

  renderSpellTargetMenu(openSpellMenuName, ui.spellTargetMenu);
}

function renderSpellTargetMenu(spellName, menuEl) {
  if (!menuEl) return;

  menuEl.innerHTML = "";

  if (spellName === "attunement") {
    renderAttunementTargetMenu(menuEl);
  } else if (spellName === "ward") {
    renderWardTargetMenu(menuEl);
  } else if (isProductionSpell(spellName)) {
    renderProductionSpellTargetMenu(spellName, menuEl);
  } else {
    renderBasicSpellTargetMenu(spellName, menuEl);
  }

  showElement(menuEl, "flex");
}

function renderAttunementTargetMenu(menuEl) {
  if (!menuEl) return;

  menuEl.appendChild(createAttunementExperienceEntry());

  const definitions = getAttunementDefinitions();
  let hasTargets = renderContextualSpellCastOption("attunement", menuEl);

  for (let attunementName in definitions) {
    if (!isAttunementTargetAvailable(attunementName)) continue;

    hasTargets = true;

    const definition = getAttunementDefinition(attunementName);
    const context = {
      type: "attunement",
      attunementId: attunementName,
    };
    const button = document.createElement("button");
    button.type = "button";
    button.className = "attunement-target-btn";

    const label = document.createElement("span");
    label.className = "attunement-target-label";
    label.textContent = definition.label;

    const description = document.createElement("span");
    description.className = "attunement-target-description";
    description.textContent = getAttunementTargetDescription(attunementName, definition);

    const details = document.createElement("span");
    details.className = "attunement-target-details";
    details.textContent = formatSpellOptionDetails("attunement", definition, context);

    button.appendChild(label);
    button.appendChild(description);
    button.appendChild(details);

    const usable = canApplyAttunement(attunementName);
    button.disabled = !usable;
    applyUiSpellOptionState(button, definition.cost || {}, usable);

    button.addEventListener("click", function () {
      castTargetedSpell("attunement", context);
    });

    menuEl.appendChild(button);
  }

  if (!hasTargets) {
    menuEl.appendChild(createSpellMenuMessage("No available targets."));
  }
}

function renderImbueTargetMenu(menuEl) {
  renderProductionSpellTargetMenu("imbue", menuEl);
}

function renderProductionSpellTargetMenu(spellName, menuEl) {
  if (!menuEl) return;

  if (spellName === "imbue") {
    menuEl.appendChild(createImbueExperienceEntry());
  }

  if (spellName === "arcaneForce") {
    menuEl.appendChild(createArcaneForceExperienceEntry());
  }

  const definitions = getProductionSpellDefinitions(spellName) || {};
  let hasTargets = renderContextualSpellCastOption(spellName, menuEl);

  for (let targetName in definitions) {
    if (!isProductionSpellTargetAvailable(spellName, targetName)) continue;

    hasTargets = true;

    const definition = getProductionSpellDefinition(spellName, targetName);
    const targetContext = getProductionSpellTargetContext(spellName, targetName);
    const context = {
      type: "productionSpell",
      spellName,
      targetId: targetName,
      mode: targetContext ? targetContext.mode : null,
    };
    const button = document.createElement("button");
    button.type = "button";
    button.className = "attunement-target-btn";

    appendProductionSpellOptionContent(button, spellName, definition, context, true);

    const usable = canApplyProductionSpellTarget(spellName, targetName);
    button.disabled = !usable;
    applyUiSpellOptionState(button, targetContext ? targetContext.cost : {}, usable);

    button.addEventListener("click", function () {
      castTargetedSpell(spellName, context);
    });

    menuEl.appendChild(button);
  }

  if (!hasTargets) {
    menuEl.appendChild(createSpellMenuMessage("No available targets."));
  }
}

function renderBasicSpellTargetMenu(spellName, menuEl) {
  const spell = getSpell(spellName);
  const context = getSpellCastContext(spellName);

  if (!spell) return;

  if (spellName === "manaSense") {
    renderManaSenseTargetMenu(menuEl, context);
    return;
  }

  if (!context) {
    menuEl.appendChild(createSpellMenuMessage(isActivityActive() ? "Something else is in progress." : "Nothing nearby answers this spell."));
    return;
  }

  appendSpellCastOption(spellName, context, menuEl);
}

function renderWardTargetMenu(menuEl) {
  const ward = getResource("ward");
  const state = getWardState();
  const plan = getWardRestorationPlan(5);

  menuEl.appendChild(createWardExperienceEntry());

  const status = document.createElement("div");
  status.className = "training-detail";
  status.textContent =
    "Ward: " +
    formatResourceAmountForDisplay(ward.value) +
    " / " +
    formatResourceAmountForDisplay(ward.maxValue) +
    " · " +
    formatWardRestoreEfficiency() +
    " Ward per mana.";
  menuEl.appendChild(status);

  const action = state.formed ? "restore" : "form";
  const actionButton = createUiActionButton({
    label: state.formed ? "Restore Ward" : "Form Ward",
    detail: state.formed ? "Channel mana into your existing Ward." : "Establish a collapsed Ward with mana.",
    cost: plan ? formatResourceAmountForDisplay(plan.manaSpent) + " Mana" : "",
    progress: false,
  });
  actionButton.disabled = !plan || isActivityActive() || (typeof isCombatActive === "function" && isCombatActive());
  applyUiSpellOptionState(actionButton, {}, !!plan, {
    unavailableReason: state.formed ? "Ward is full or insufficient mana" : "Insufficient mana to form Ward",
  });
  actionButton.addEventListener("click", function () {
    startWardChannel(action);
  });
  menuEl.appendChild(actionButton);

  if (getWardLevel() >= 3) {
    const maintainButton = createUiActionButton({
      label: state.maintainEnabled ? "Maintain Ward: On" : "Maintain Ward: Off",
      detail: "Outside combat, automatically restore Ward after it takes damage.",
      progress: false,
    });
    maintainButton.disabled = !state.formed || (typeof isCombatActive === "function" && isCombatActive());
    maintainButton.addEventListener("click", toggleMaintainWard);
    menuEl.appendChild(maintainButton);
  }
}

function renderManaSenseTargetMenu(menuEl, context) {
  let hasTargets = false;

  menuEl.appendChild(createManaSenseExperienceEntry());

  if (context) {
    appendSpellCastOption("manaSense", context, menuEl);
    hasTargets = true;
  }

  const definitions = getManaSenseDefinitions();

  for (let targetName in definitions) {
    if (!isManaSenseTargetVisible(targetName)) continue;

    appendManaSenseTargetOption(targetName, menuEl);
    hasTargets = true;
  }

  if (!hasTargets) {
    menuEl.appendChild(createSpellMenuMessage(isActivityActive() ? "Something else is in progress." : "Nothing nearby answers Mana Sense."));
  }
}

function appendManaSenseTargetOption(targetName, menuEl) {
  const definition = getManaSenseDefinition(targetName);

  if (!definition) return;

  const context = getManaSenseTargetContext(targetName);
  const isActive = isManaSenseTargetActive(targetName);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "attunement-target-btn";

  const label = document.createElement("span");
  label.className = "attunement-target-label";
  label.textContent = definition.label;

  const description = document.createElement("span");
  description.className = "attunement-target-description";
  description.textContent = isActive
    ? definition.activeDescription || "Active until you leave " + getLocationLabel(definition.requiredLocation) + "."
    : definition.description || "";

  const details = document.createElement("span");
  details.className = "attunement-target-details";
  details.textContent = isActive ? "Active" : formatSpellOptionDetails("manaSense", definition, context);

  button.appendChild(label);
  button.appendChild(description);
  button.appendChild(details);

  const usable = !isActive && canApplyManaSenseTarget(targetName);
  button.disabled = !usable;
  applyUiSpellOptionState(button, definition.cost || {}, usable, { active: isActive });

  if (!isActive) {
    button.addEventListener("click", function () {
      castTargetedSpell("manaSense", context);
    });
  }

  menuEl.appendChild(button);
}

function renderContextualSpellCastOption(spellName, menuEl) {
  const context = getSpellCastContext(spellName);

  if (!context || context.type === "productionSpell") return false;
  if (spellName === "manaSense" && context.type === "reveal") return false;

  appendSpellCastOption(spellName, context, menuEl);
  return true;
}

function appendSpellCastOption(spellName, context, menuEl) {
  const spell = getSpell(spellName);

  if (!spell) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "attunement-target-btn";

  const label = document.createElement("span");
  label.className = "attunement-target-label";
  label.textContent = "Cast " + spell.label;

  const description = document.createElement("span");
  description.className = "attunement-target-description";
  description.textContent = getSpellContextDescription(context);

  const details = document.createElement("span");
  details.className = "attunement-target-details";
  details.textContent = formatSpellOptionDetails(spellName, spell, context);

  button.appendChild(label);
  button.appendChild(description);
  button.appendChild(details);

  const usable = canCastSpell(spellName);
  const cost = getSpellCastCost(spellName, context);
  button.disabled = !usable;
  applyUiSpellOptionState(button, cost, usable);

  button.addEventListener("click", function () {
    castSpell(spellName);
  });

  menuEl.appendChild(button);
}

function getSpellContextDescription(context) {
  if (context && context.type === "locationObjectSpellCharge") {
    const object = getLocationObject(context.locationName, context.objectName);

    return object ? "Charge " + object.label + "." : "Charge the current magical pattern.";
  }

  if (context && context.type === "dungeonSpellCharge") {
    const node = getDungeonNode(context.dungeonId, context.nodeId);

    return node ? "Open the way to " + node.label + "." : "Open the nearby force lock.";
  }

  if (context && context.type === "dungeonCharge") {
    return "Sharpen your read of this room.";
  }

  return "Use this spell on the current target.";
}

function createSpellMenuMessage(text) {
  const message = document.createElement("div");
  message.className = "spell-menu-message";
  message.textContent = text;

  return message;
}

function createManaSenseExperienceEntry() {
  const progress = getManaSenseProgressState();
  const definition = getSpellProgressDefinition("manaSense");
  const thresholds = definition.thresholds;
  const maxLevel = definition.maxLevel;
  const nextThreshold = thresholds[progress.level] || null;

  const entry = document.createElement("div");
  entry.className = "training-entry spell-experience-entry";

  const header = document.createElement("div");
  header.className = "training-entry-header";

  const title = document.createElement("strong");
  title.textContent = "Mana Sense - Level " + progress.level;

  const bonus = document.createElement("span");
  bonus.textContent = "+" + getManaSenseHiddenDiscoveryBonusChance() + "% hidden discovery";

  header.appendChild(title);
  header.appendChild(bonus);
  entry.appendChild(header);

  const crystalText = document.createElement("div");
  crystalText.className = "training-detail";
  crystalText.textContent = getManaSenseCrystalBonusText(progress.level);
  entry.appendChild(crystalText);

  const progressText = document.createElement("div");
  progressText.className = "training-progress-text";

  if (progress.level >= maxLevel || nextThreshold === null) {
    progressText.textContent = "Mana spent: complete";
  } else {
    progressText.textContent = "Mana spent: " + formatTrainingNumber(progress.xp) + " / " + formatTrainingNumber(nextThreshold);
  }

  entry.appendChild(progressText);

  const progressTrack = document.createElement("div");
  progressTrack.className = "training-progress-track";

  const progressFill = document.createElement("div");
  progressFill.className = "training-progress-fill";
  progressFill.style.width = getSpellProgressPercent("manaSense") * 100 + "%";

  progressTrack.appendChild(progressFill);
  entry.appendChild(progressTrack);

  const detail = document.createElement("div");
  detail.className = "training-detail";

  if (progress.level >= maxLevel || nextThreshold === null) {
    detail.textContent = "Current: " + getManaSenseLevelRewardText(progress.level) + ". Rank 2 research ready, story gated.";
  } else {
    detail.textContent =
      "Current: " + getManaSenseLevelRewardText(progress.level) + ". Next: " + getManaSenseLevelRewardText(progress.level + 1) + ".";
  }

  entry.appendChild(detail);

  return entry;
}

function createAttunementExperienceEntry() {
  const progress = getAttunementProgressState();
  const definition = getSpellProgressDefinition("attunement");
  const thresholds = definition.thresholds;
  const maxLevel = definition.maxLevel;
  const nextThreshold = thresholds[progress.level] || null;

  const entry = document.createElement("div");
  entry.className = "training-entry spell-experience-entry";

  const header = document.createElement("div");
  header.className = "training-entry-header";

  const title = document.createElement("strong");
  title.textContent = "Attunement - Level " + progress.level;

  const capacity = document.createElement("span");
  capacity.textContent = formatAttunementMultiplier() + " bonus";

  header.appendChild(title);
  header.appendChild(capacity);
  entry.appendChild(header);

  const activeText = document.createElement("div");
  activeText.className = "training-detail";
  activeText.textContent = getAttunementActiveSummaryText();
  entry.appendChild(activeText);

  const progressText = document.createElement("div");
  progressText.className = "training-progress-text";

  if (progress.level >= maxLevel || nextThreshold === null) {
    progressText.textContent = "Mana spent: complete";
  } else {
    progressText.textContent = "Mana spent: " + formatTrainingNumber(progress.xp) + " / " + formatTrainingNumber(nextThreshold);
  }

  entry.appendChild(progressText);

  const progressTrack = document.createElement("div");
  progressTrack.className = "training-progress-track";

  const progressFill = document.createElement("div");
  progressFill.className = "training-progress-fill";
  progressFill.style.width = getSpellProgressPercent("attunement") * 100 + "%";

  progressTrack.appendChild(progressFill);
  entry.appendChild(progressTrack);

  const detail = document.createElement("div");
  detail.className = "training-detail";

  if (progress.level >= maxLevel || nextThreshold === null) {
    detail.textContent = getAttunementLevelRewardText(progress.level) + ". Rank 2 research ready, story gated.";
  } else {
    detail.textContent =
      "Current: " + getAttunementLevelRewardText(progress.level) + ". Next: " + getAttunementLevelRewardText(progress.level + 1) + ".";
  }

  entry.appendChild(detail);

  return entry;
}

function createImbueExperienceEntry() {
  const progress = getImbueProgressState();
  const definition = getSpellProgressDefinition("imbue");
  const thresholds = definition.thresholds;
  const maxLevel = definition.maxLevel;
  const nextThreshold = thresholds[progress.level] || null;

  const entry = document.createElement("div");
  entry.className = "training-entry spell-experience-entry";

  const header = document.createElement("div");
  header.className = "training-entry-header";

  const title = document.createElement("strong");
  title.textContent = "Imbue - Level " + progress.level;

  const capacity = document.createElement("span");
  capacity.textContent = getImbueCapacity() + " mana capacity";

  header.appendChild(title);
  header.appendChild(capacity);
  entry.appendChild(header);

  const progressText = document.createElement("div");
  progressText.className = "training-progress-text";

  if (progress.level >= maxLevel || nextThreshold === null) {
    progressText.textContent = "Mana spent: complete";
  } else {
    progressText.textContent = "Mana spent: " + formatTrainingNumber(progress.xp) + " / " + formatTrainingNumber(nextThreshold);
  }

  entry.appendChild(progressText);

  const progressTrack = document.createElement("div");
  progressTrack.className = "training-progress-track";

  const progressFill = document.createElement("div");
  progressFill.className = "training-progress-fill";
  progressFill.style.width = getSpellProgressPercent("imbue") * 100 + "%";

  progressTrack.appendChild(progressFill);
  entry.appendChild(progressTrack);

  const detail = document.createElement("div");
  detail.className = "training-detail";

  if (progress.level >= maxLevel || nextThreshold === null) {
    detail.textContent = "Current: " + getImbueLevelRewardText(progress.level) + ". Rank 2 research ready, story gated.";
  } else {
    detail.textContent = "Current: " + getImbueLevelRewardText(progress.level) + ". Next: " + getImbueLevelRewardText(progress.level + 1) + ".";
  }

  entry.appendChild(detail);

  return entry;
}

function createArcaneForceExperienceEntry() {
  const progress = getArcaneForceProgressState();
  const definition = getSpellProgressDefinition("arcaneForce");
  const thresholds = definition.thresholds;
  const maxLevel = definition.maxLevel;
  const nextThreshold = thresholds[progress.level] || null;

  const entry = document.createElement("div");
  entry.className = "training-entry spell-experience-entry";

  const header = document.createElement("div");
  header.className = "training-entry-header";

  const title = document.createElement("strong");
  title.textContent = "Arcane Force - Level " + progress.level;

  const capacity = document.createElement("span");
  capacity.textContent = getArcaneForceLevelRewardText(progress.level);

  header.appendChild(title);
  header.appendChild(capacity);
  entry.appendChild(header);

  const progressText = document.createElement("div");
  progressText.className = "training-progress-text";

  if (progress.level >= maxLevel || nextThreshold === null) {
    progressText.textContent = "Mana spent: complete";
  } else {
    progressText.textContent = "Mana spent: " + formatTrainingNumber(progress.xp) + " / " + formatTrainingNumber(nextThreshold);
  }

  entry.appendChild(progressText);

  const progressTrack = document.createElement("div");
  progressTrack.className = "training-progress-track";

  const progressFill = document.createElement("div");
  progressFill.className = "training-progress-fill";
  progressFill.style.width = getSpellProgressPercent("arcaneForce") * 100 + "%";

  progressTrack.appendChild(progressFill);
  entry.appendChild(progressTrack);

  const detail = document.createElement("div");
  detail.className = "training-detail";

  if (progress.level >= maxLevel || nextThreshold === null) {
    detail.textContent = "Current: " + getArcaneForceLevelRewardText(progress.level) + ".";
  } else {
    detail.textContent =
      "Current: " + getArcaneForceLevelRewardText(progress.level) + ". Next: " + getArcaneForceLevelRewardText(progress.level + 1) + ".";
  }

  entry.appendChild(detail);

  if (gameState.personalWardUnlocked) {
    const wardDetail = document.createElement("div");
    wardDetail.className = "training-detail";
    wardDetail.textContent = "Personal Ward remembered: Recharge Ward available.";
    entry.appendChild(wardDetail);
  }

  return entry;
}

function createWardExperienceEntry() {
  const progress = getSpellProgressState("ward");
  const definition = getSpellProgressDefinition("ward");
  const nextThreshold = definition.thresholds[progress.level] || null;
  const state = getWardState();
  const entry = document.createElement("div");
  entry.className = "training-entry spell-experience-entry";

  const header = document.createElement("div");
  header.className = "training-entry-header";
  const title = document.createElement("strong");
  title.textContent = "Ward - Rank " + state.rank + " Level " + progress.level;
  const capacity = document.createElement("span");
  capacity.textContent = getWardLevelRewardText(progress.level);
  header.append(title, capacity);
  entry.appendChild(header);

  const progressText = document.createElement("div");
  progressText.className = "training-progress-text";
  progressText.textContent = nextThreshold === null ? "Ward restored: complete" : "Ward restored: " + formatTrainingNumber(progress.xp) + " / " + formatTrainingNumber(nextThreshold);
  entry.appendChild(progressText);

  const progressTrack = document.createElement("div");
  progressTrack.className = "training-progress-track";
  const progressFill = document.createElement("div");
  progressFill.className = "training-progress-fill";
  progressFill.style.width = getSpellProgressPercent("ward") * 100 + "%";
  progressTrack.appendChild(progressFill);
  entry.appendChild(progressTrack);

  const detail = document.createElement("div");
  detail.className = "training-detail";
  detail.textContent =
    "Current: " +
    getWardLevelRewardText(progress.level) +
    (nextThreshold === null ? "." : ". Next: " + getWardLevelRewardText(progress.level + 1) + ".");
  entry.appendChild(detail);
  return entry;
}

function renderSpellExperienceBar(spellName, boxEl) {
  if (!getSpellProgressDefinition(spellName)) return;

  boxEl.classList.add("has-spell-xp");

  const track = document.createElement("div");
  track.className = "spell-xp-progress-track";

  const fill = document.createElement("div");
  fill.className = "spell-xp-progress-fill";
  fill.style.width = getSpellProgressPercent(spellName) * 100 + "%";

  track.appendChild(fill);
  boxEl.appendChild(track);
}

function getSpellProgressPercent(spellName) {
  const progress = getSpellProgressState(spellName);
  const definition = getSpellProgressDefinition(spellName);

  if (!definition || !Array.isArray(definition.thresholds)) return 0;
  if (progress.level >= definition.maxLevel) return 1;

  const nextThreshold = definition.thresholds[progress.level];
  const currentThreshold = progress.level > 0 ? definition.thresholds[progress.level - 1] : 0;
  const required = nextThreshold - currentThreshold;
  const current = Math.max(0, progress.xp - currentThreshold);

  if (required <= 0) return 1;

  return Math.min(Math.max(current / required, 0), 1);
}

function formatAttunementMultiplier() {
  return "x" + getAttunementBonusMultiplier().toFixed(1);
}

function getAttunementActiveSummaryText() {
  const state = getAttunementState();
  const names = state.active
    .map(function (entry) {
      const definition = getAttunementDefinition(entry.id);
      if (!definition) return entry.id;

      return definition.label + " (" + getAttunementTargetDescription(entry.id, definition, { prefix: false }) + ")";
    })
    .filter(Boolean);

  return "Active: " + (names.length ? names.join(", ") : "None") + " (" + state.active.length + "/" + state.capacity + " slots)";
}

function renderAttunementPips(boxEl) {
  const state = getAttunementState();

  const pipRow = document.createElement("div");
  pipRow.className = "attunement-pips";

  for (let i = 0; i < state.capacity; i++) {
    const pip = document.createElement("span");
    pip.className = "attunement-pip";

    if (i < state.active.length) {
      pip.classList.add("filled");
    }

    pipRow.appendChild(pip);
  }

  boxEl.appendChild(pipRow);
}

function getPurchasedEquipmentForSlot(equipmentType, slotName) {
  const slots = getPurchasedEquipmentSlots(equipmentType);

  for (let i = 0; i < slots.length; i++) {
    if (slots[i].current && slots[i].current.slot === slotName) {
      return slots[i].current;
    }
  }

  return null;
}

function isAttunementTargetAvailable(attunementName) {
  const definition = getAttunementDefinition(attunementName);

  if (!definition) return false;
  if (definition.requiredAttunementLevel && getAttunementLevel() < definition.requiredAttunementLevel) return false;
  if (hasActiveAttunement(attunementName)) return false;

  return true;
}

function getProductionSpellDefinitions(spellName) {
  if (spellName === "imbue") return getImbueDefinitions();
  if (spellName === "arcaneForce") return getArcaneForceDefinitions();

  return null;
}

function getProductionSpellDefinition(spellName, targetName) {
  const definitions = getProductionSpellDefinitions(spellName);

  if (!definitions) return null;

  return definitions[targetName];
}

function getProductionSpellTargetContext(spellName, targetName, requestedContext) {
  const definition = getProductionSpellDefinition(spellName, targetName);

  if (!definition) return null;

  if (requestedContext && requestedContext.mode === "campEquipment") {
    return getCampEquipmentProductionSpellTargetContext(definition);
  }

  if (requestedContext && requestedContext.mode === "location") {
    return getLocationProductionSpellTargetContext(definition);
  }

  if (requestedContext && (requestedContext.mode === "camp" || requestedContext.mode === "field")) {
    return getLocationProductionSpellTargetContext(definition, requestedContext);
  }

  return getCampEquipmentProductionSpellTargetContext(definition) || getLocationProductionSpellTargetContext(definition);
}

function getCampEquipmentProductionSpellTargetContext(definition) {
  if (!definition || !definition.campUpgradeRequired) return null;
  if (!isCampCraftingContext()) return null;
  if (!hasPurchasedCampUpgrade(definition.campUpgradeRequired)) return null;

  return {
    mode: "campEquipment",
    cost: definition.campCost || definition.cost || {},
    storageCost: null,
    carriedCost: null,
    produces: definition.campProduces || definition.produces || null,
    storageProduces: null,
    producesConsumable: definition.campProducesConsumable || definition.producesConsumable || null,
    carriedProduces: null,
  };
}

function getLocationProductionSpellTargetContext(definition, requestedContext) {
  if (!definition) return null;

  const requiredLocations = Array.isArray(definition.requiredLocations)
    ? definition.requiredLocations
    : [definition.requiredLocation || "camp"];
  const canUseAnywhere = requiredLocations.includes("any");
  let mode = null;

  if (requestedContext && requestedContext.mode === "camp") {
    if (!canUseAnywhere && !requiredLocations.includes("camp")) return null;
    if (!isCampCraftingContext()) return null;

    mode = "camp";
  } else if (requestedContext && requestedContext.mode === "location") {
    if (!gameState.expedition.currentLocation) return null;
    if (!canUseAnywhere && !requiredLocations.includes(gameState.expedition.currentLocation)) return null;

    mode = "location";
  } else if (requestedContext && requestedContext.mode === "field") {
    if (!canUseAnywhere) return null;
    if (!gameState.expedition.active || gameState.expedition.currentLocation) return null;

    mode = "field";
  } else if (canUseAnywhere && isCampCraftingContext()) {
    mode = "camp";
  } else if (canUseAnywhere && gameState.expedition.currentLocation) {
    mode = "location";
  } else if (canUseAnywhere && gameState.expedition.active) {
    mode = "field";
  } else if (requiredLocations.includes("camp") && isCampCraftingContext()) {
    mode = "camp";
  } else if (gameState.expedition.currentLocation && requiredLocations.includes(gameState.expedition.currentLocation)) {
    mode = "location";
  } else {
    return null;
  }

  const isLocationMode = mode === "location";

  return {
    mode: mode,
    cost: isLocationMode ? definition.locationCost || definition.cost || {} : definition.cost || {},
    storageCost: isLocationMode ? definition.storageCost || null : null,
    carriedCost: isLocationMode ? definition.carriedCost || null : null,
    produces: isLocationMode ? definition.locationProduces || null : definition.produces || null,
    storageProduces: isLocationMode ? definition.storageProduces || null : null,
    producesConsumable: definition.producesConsumable || null,
    carriedProduces: isLocationMode ? definition.carriedProduces || null : null,
  };
}

function getSpellCastCost(spellName, context) {
  if (context && context.type === "locationObjectSpellCharge") {
    const object = getLocationObject(context.locationName, context.objectName);
    const interaction = getLocationObjectSpellInteraction(object, context.spellName);

    if (interaction && interaction.cost) {
      return interaction.cost;
    }
  }

  if (context && context.type === "dungeonSpellCharge") {
    const node = getDungeonNode(context.dungeonId, context.nodeId);
    const interaction = getDungeonNodeSpellInteraction(node, context.spellName);

    if (interaction && interaction.cost) {
      return interaction.cost;
    }
  }

  if (context && context.type === "manaSenseTarget") {
    const definition = getManaSenseDefinition(context.targetId);

    if (definition && definition.cost) {
      return definition.cost;
    }
  }

  const spell = getSpell(spellName);

  return spell ? spell.cost || {} : {};
}

function getSpellCastDuration(spellName, context) {
  const spell = getSpell(spellName);

  if (context && context.type === "locationObjectSpellCharge") {
    const object = getLocationObject(context.locationName, context.objectName);
    const interaction = getLocationObjectSpellInteraction(object, context.spellName);

    if (interaction && Number.isFinite(interaction.duration)) {
      return interaction.duration;
    }
  }

  if (context && context.type === "dungeonSpellCharge") {
    const node = getDungeonNode(context.dungeonId, context.nodeId);
    const interaction = getDungeonNodeSpellInteraction(node, context.spellName);

    if (interaction && Number.isFinite(interaction.duration)) {
      return interaction.duration;
    }
  }

  if (context && context.type === "productionSpell" && context.spellName === spellName) {
    const definition = getProductionSpellDefinition(spellName, context.targetId);

    if (definition && Number.isFinite(definition.duration)) {
      return definition.duration;
    }
  }

  if (context && context.type === "manaSenseTarget") {
    const definition = getManaSenseDefinition(context.targetId);

    if (definition && Number.isFinite(definition.duration)) {
      return definition.duration;
    }
  }

  return spell ? spell.duration || 0 : 0;
}

function formatSpellDuration(duration) {
  if (Math.abs(duration - Math.round(duration)) < 0.01) {
    return Math.round(duration) + "s";
  }

  return duration + "s";
}

function formatSpellOptionDetails(spellName, definition, context) {
  const targetContext =
    context && context.type === "productionSpell" ? getProductionSpellTargetContext(spellName, context.targetId, context) : null;
  const cost =
    targetContext || (context && context.type !== "attunement")
      ? targetContext
        ? targetContext.cost
        : getSpellCastCost(spellName, context)
      : definition
        ? definition.cost
        : {};
  const storageCost = targetContext ? targetContext.storageCost : definition ? definition.storageCost : null;
  const carriedCost = targetContext ? targetContext.carriedCost : null;

  return [
    "Mana: " + getSpellOptionManaCost(cost),
    "Time: " + formatSpellDuration(getSpellCastDuration(spellName, context)),
    "Materials: " + getSpellOptionMaterialCost(cost, storageCost, carriedCost),
  ].join(" | ");
}

function appendProductionSpellOptionContent(button, spellName, definition, context, includeDescription) {
  const isImbueTonic = spellName === "imbue" && getProductionSpellConsumable(definition);
  const label = document.createElement("span");
  label.className = "attunement-target-label";
  label.textContent = getProductionSpellOptionLabel(spellName, definition);

  const details = document.createElement("span");
  details.className = "attunement-target-details";
  details.textContent = formatProductionSpellOptionDetails(spellName, definition, context);

  if (isImbueTonic) {
    button.classList.add("imbue-tonic-option");
  }

  button.appendChild(label);

  if (includeDescription && !isImbueTonic) {
    const description = document.createElement("span");
    description.className = "attunement-target-description";
    description.textContent = definition.description || "";
    button.appendChild(description);
  }

  button.appendChild(details);
}

function getProductionSpellConsumable(definition) {
  if (!definition || !definition.producesConsumable) return null;

  const resourceName = definition.producesConsumable.resource;
  return resourceName ? getResource(resourceName) : null;
}

function getProductionSpellOptionLabel(spellName, definition) {
  const consumable = getProductionSpellConsumable(definition);

  if (spellName === "imbue" && consumable) {
    return "Imbue: " + consumable.label;
  }

  return definition ? definition.label : "";
}

function formatProductionSpellOptionDetails(spellName, definition, context) {
  const consumable = getProductionSpellConsumable(definition);

  if (spellName !== "imbue" || !consumable) {
    return formatSpellOptionDetails(spellName, definition, context);
  }

  const targetContext = getProductionSpellTargetContext(spellName, context.targetId, context);
  const cost = targetContext ? targetContext.cost : definition.cost || {};
  const materialCost = formatProductionSpellMaterials(
    cost,
    targetContext ? targetContext.storageCost : definition.storageCost,
    targetContext ? targetContext.carriedCost : null
  );

  return [
    getSpellOptionManaCost(cost) + " Mana",
    formatSpellDuration(getSpellCastDuration(spellName, context)),
    materialCost,
  ]
    .filter(Boolean)
    .join(" · ");
}

function formatProductionSpellMaterials(cost, storageCost, carriedCost) {
  const totals = {};

  [cost, storageCost, carriedCost].forEach(function (source) {
    if (!source) return;

    for (let resourceName in source) {
      if (resourceName === "mana") continue;

      const amount = source[resourceName];
      if (!Number.isFinite(amount) || amount <= 0) continue;

      totals[resourceName] = (totals[resourceName] || 0) + amount;
    }
  });

  return Object.keys(totals)
    .map(function (resourceName) {
      const resource = getResource(resourceName);
      return totals[resourceName] + " " + (resource ? resource.label : resourceName);
    })
    .join(" · ");
}

function getSpellOptionManaCost(cost) {
  if (!cost || !Number.isFinite(cost.mana)) {
    return 0;
  }

  return cost.mana;
}

function getSpellOptionMaterialCost(cost, storageCostDefinition, carriedCostDefinition) {
  const materials = [];
  const resourceCost = formatCostExcluding(cost, ["mana"]);
  const storageCost = formatStoredSpellMaterialCost(storageCostDefinition);
  const carriedCost = formatCarriedSpellMaterialCost(carriedCostDefinition);

  if (resourceCost) materials.push(resourceCost);
  if (storageCost) materials.push(storageCost);
  if (carriedCost) materials.push(carriedCost);

  return materials.length > 0 ? materials.join(", ") : "None";
}

function formatStoredSpellMaterialCost(cost) {
  if (!cost) return "";

  const parts = [];

  for (let resourceName in cost) {
    const resource = getResource(resourceName);
    const label = resource ? resource.label : resourceName;
    const amount = cost[resourceName];

    if (resource && resource.hidden && resource.missingLabel && resource.value < amount) {
      parts.push(resource.missingLabel);
      continue;
    }

    parts.push(amount + " stored " + label);
  }

  return parts.join(", ");
}

function formatCarriedSpellMaterialCost(cost) {
  if (!cost) return "";

  const parts = [];

  for (let resourceName in cost) {
    const resource = getResource(resourceName);
    const label = resource ? resource.label : resourceName;

    parts.push(cost[resourceName] + " carried " + label);
  }

  return parts.join(", ");
}

function isProductionSpell(spellName) {
  return !!getProductionSpellDefinitions(spellName);
}

function hasAvailableImbueTarget() {
  return hasAvailableProductionSpellTarget("imbue");
}

function hasAvailableProductionSpellTarget(spellName) {
  const definitions = getProductionSpellDefinitions(spellName);

  if (!definitions) return false;

  for (let targetName in definitions) {
    if (canApplyProductionSpellTarget(spellName, targetName)) return true;
  }

  return false;
}

function isImbueTargetAvailable(imbueName) {
  return isProductionSpellTargetAvailable("imbue", imbueName);
}

function isProductionSpellTargetAvailable(spellName, targetName, requestedContext) {
  const definition = getProductionSpellDefinition(spellName, targetName);
  const targetContext = getProductionSpellTargetContext(spellName, targetName, requestedContext);

  if (!definition) return false;
  if (!targetContext) return false;

  if (spellName === "arcaneForce" && getArcaneForceLevel() < (definition.requiredForceLevel || 0)) return false;
  if (spellName === "imbue" && getSpellOptionManaCost(targetContext.cost) > getImbueCapacity()) return false;

  if (!areProductionSpellTargetRequirementsMet(definition.requires)) return false;

  if (!canAffordProductionSpellMaterialCost(targetContext.cost)) return false;
  if (!canAffordStorageCost(targetContext.storageCost)) return false;
  if (targetContext.carriedCost && !canAffordCarriedCost(targetContext.carriedCost)) return false;
  if (!canReceiveProductionProduces(targetContext.produces)) return false;
  if (!canReceiveStorageProduces(targetContext.storageProduces)) return false;
  if (!canReceiveCarriedProduces(targetContext.carriedProduces, targetContext.carriedCost)) return false;

  if (
    targetContext.producesConsumable &&
    !hasConsumableSpace(targetContext.producesConsumable.resource, targetContext.producesConsumable.amount)
  ) {
    return false;
  }

  if (typeof definition.canApply === "function" && !definition.canApply(spellName, targetName)) {
    return false;
  }

  return true;
}

function canAffordProductionSpellMaterialCost(cost) {
  if (!cost) return true;

  for (let resourceName in cost) {
    if (resourceName === "mana") continue;

    const resource = getResource(resourceName);

    if (!resource || resource.value < cost[resourceName]) return false;
  }

  return true;
}

function canReceiveProductionProduces(produces) {
  if (!produces) return true;

  const resource = getResource(produces.resource);

  if (!resource) return false;

  return resource.value + produces.amount <= resource.maxValue;
}

function canReceiveStorageProduces(produces) {
  if (!produces) return true;

  const storage = getCurrentCraftLocationStorage();

  if (!storage) return false;

  for (let resourceName in produces) {
    const resource = getResource(resourceName);
    const current = storage[resourceName] || 0;

    if (resource && Number.isFinite(resource.maxValue) && current + produces[resourceName] > resource.maxValue) {
      return false;
    }
  }

  return true;
}

function canReceiveCarriedProduces(produces, carriedCost) {
  if (!produces) return true;

  const producedWeight = produces.amount * getCarriedItemWeight(produces.resource);
  let freedWeight = 0;

  if (carriedCost) {
    for (let itemName in carriedCost) {
      freedWeight += carriedCost[itemName] * getCarriedItemWeight(itemName);
    }
  }

  return getCarriedTotal() - freedWeight + producedWeight <= getEffectiveCarryCapacity();
}

function areProductionSpellTargetRequirementsMet(requires) {
  if (!requires) return true;

  if (requires.researchCompleted) {
    for (let i = 0; i < requires.researchCompleted.length; i++) {
      const research = getResearch(requires.researchCompleted[i]);

      if (!research || !research.completed) return false;
    }
  }

  if (requires.flags) {
    for (let i = 0; i < requires.flags.length; i++) {
      if (!gameState[requires.flags[i]]) return false;
    }
  }

  if (requires.notPurchasedGear) {
    for (let i = 0; i < requires.notPurchasedGear.length; i++) {
      if (hasPurchasedGear(requires.notPurchasedGear[i])) return false;
    }
  }

  if (requires.resourcesBelowMax) {
    for (let resourceName in requires.resourcesBelowMax) {
      const resource = getResource(resourceName);
      const max = requires.resourcesBelowMax[resourceName];

      if (!resource || resource.value >= max) return false;
    }
  }

  return true;
}

function canApplyImbue(imbueName) {
  return canApplyProductionSpellTarget("imbue", imbueName);
}

function canApplyProductionSpellTarget(spellName, targetName) {
  const definition = getProductionSpellDefinition(spellName, targetName);
  const targetContext = getProductionSpellTargetContext(spellName, targetName);
  const spell = getSpell(spellName);

  if (!definition) return false;
  if (!targetContext) return false;
  if (!spell || !spell.unlocked) return false;
  if (isActivityActive()) return false;
  if (!isProductionSpellTargetAvailable(spellName, targetName)) return false;

  if (!canAffordCost(targetContext.cost || {})) return false;
  if (targetContext.carriedCost && !canAffordCarriedCost(targetContext.carriedCost)) return false;

  return true;
}

function canApplyAttunement(attunementName) {
  const state = getAttunementState();
  const definition = getAttunementDefinition(attunementName);

  if (!definition) return false;
  if (!getSpell("attunement") || !getSpell("attunement").unlocked) return false;
  if (isActivityActive()) return false;
  if (state.active.length >= state.capacity) return false;
  if (!isAttunementTargetAvailable(attunementName)) return false;

  return canAffordCost(definition.cost || {});
}

function castTargetedSpell(spellName, context) {
  const spell = getSpell(spellName);

  if (!spell || !spell.unlocked) return;
  if (isActivityActive()) return;

  let cost = spell.cost || {};

  if (spellName === "attunement") {
    if (!context || context.type !== "attunement") return;
    if (!canApplyAttunement(context.attunementId)) return;

    const definition = getAttunementDefinition(context.attunementId);
    cost = definition.cost || {};
  }

  if (spellName === "manaSense") {
    if (!context || context.type !== "manaSenseTarget") return;
    if (!canApplyManaSenseTarget(context.targetId)) return;

    const definition = getManaSenseDefinition(context.targetId);
    cost = definition.cost || {};
  }

  if (isProductionSpell(spellName)) {
    if (!context || context.type !== "productionSpell" || context.spellName !== spellName) return;
    if (!canApplyProductionSpellTarget(spellName, context.targetId)) return;

    const targetContext = getProductionSpellTargetContext(spellName, context.targetId, context);
    if (!targetContext) return;

    context = { ...context, mode: targetContext.mode };
    cost = targetContext.cost || {};
  }

  if (!spendCost(cost)) return;

  if (!startActivity({ kind: "spell", id: spellName, context: context })) {
    refundCost(cost);
    return;
  }

  updateAllResources();
  updateEquipmentSlotUI();
  updateAllActionButtons();
  updateCraftingButtons();
}

function applyAttunement(attunementName) {
  const state = getAttunementState();
  const definition = getAttunementDefinition(attunementName);

  if (!definition) return false;
  if (hasActiveAttunement(attunementName)) return false;
  if (state.active.length >= state.capacity) return false;

  state.active.push({
    id: attunementName,
  });

  recalculateCharacterStats();
  addStoryEntry("You attune yourself to " + definition.label + ".");
  return true;
}

function applyManaSenseTarget(targetName) {
  const definition = getManaSenseDefinition(targetName);

  if (!definition) return false;

  if (targetName === "stoneSense") {
    if (typeof activateStoneSense !== "function") return false;
    if (!activateStoneSense()) return false;
  } else if (targetName === "sensePrey") {
    if (typeof activateSensePrey !== "function") return false;
    if (!activateSensePrey()) return false;
  } else {
    return false;
  }

  if (definition.story) {
    addStoryEntry(definition.story);
  }

  updateEquipmentSlotUI();
  updateAllActionButtons();
  updateCraftingButtons();
  refreshExpeditionUI();
  return true;
}

function applyImbue(imbueName) {
  return applyProductionSpellTarget("imbue", imbueName);
}

function applyProductionSpellTarget(spellName, targetName, requestedContext) {
  const definition = getProductionSpellDefinition(spellName, targetName);
  const targetContext = getProductionSpellTargetContext(spellName, targetName, requestedContext);

  if (!definition) return false;
  if (!targetContext) return false;
  if (!isProductionSpellTargetAvailable(spellName, targetName, requestedContext)) return false;
  if (!spendStorageCost(targetContext.storageCost)) return false;
  if (targetContext.carriedCost && !spendCarriedCost(targetContext.carriedCost)) return false;

  if (targetContext.produces) {
    addResource(targetContext.produces.resource, targetContext.produces.amount);

    if (typeof unlockResource === "function") {
      unlockResource(targetContext.produces.resource);
    }
  }

  if (targetContext.storageProduces) {
    addStorageProduces(targetContext.storageProduces);
  }

  if (targetContext.producesConsumable) {
    for (let i = 0; i < targetContext.producesConsumable.amount; i++) {
      addConsumableToSlot(targetContext.producesConsumable.resource);
    }
  }

  if (targetContext.carriedProduces) {
    const carriedAmount = addCarriedItemUpToCapacity(targetContext.carriedProduces.resource, targetContext.carriedProduces.amount);

    if (carriedAmount > 0) {
      const resource = getResource(targetContext.carriedProduces.resource);
      const label = resource ? resource.label : targetContext.carriedProduces.resource;

      unlockResource(targetContext.carriedProduces.resource);
      addStoryEntry("You gather " + carriedAmount + " " + label + ".");
    }

    if (carriedAmount < targetContext.carriedProduces.amount) {
      addStoryEntry(definition.partialStory || "You cannot carry everything the spell frees.");
    }
  }

  if (typeof definition.apply === "function") {
    definition.apply(spellName, targetName);
  }

  if (definition.story) {
    addStoryEntry(definition.story);
  }

  if (gameState.expedition.currentLocation) {
    updateLocationStorageUI(getExpeditionLocation(gameState.expedition.currentLocation));
  }

  refreshExpeditionUI();
  updateEquipmentSlotUI();
  updateAllResources();
  updateAllActionButtons();
  updateCraftingButtons();

  return true;
}

