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
};
let openSpellMenuName = null;

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

  if (ward) {
    ward.maxValue = 10;
    ward.value = 10;
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
      ward.maxValue = 10;
      ward.value = Number.isFinite(ward.value) ? Math.max(0, Math.min(ward.maxValue, ward.value)) : ward.maxValue;
      unlockResource("ward");
      updateResource("ward");
    }

    return;
  }

  const foundation = getProjectState("towerFoundation");

  if (foundation && (foundation.completed || foundation.level > 5)) {
    unlockPersonalWard(showPopup);
  }
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

  if (researchName === "manaCycling") {
    revealSkill("manaCycling");
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

  prepareCraftButton(button);

  const nameEl = button.querySelector(".craft-name");
  const costEl = button.querySelector(".craft-cost");

  if (nameEl) {
    nameEl.textContent = name;
  }

  if (costEl) {
    costEl.textContent = costText || "";
    costEl.style.display = costText ? "block" : "none";
  }
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

    ui.restBtn.style.display = "inline-block";
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
  updateCharacterPanelLocks();

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
  renderEquipmentSlots(ui.gearSlotsGroup, ui.gearSlots, "gear");
  renderEquipmentSlots(ui.toolSlotsGroup, ui.toolSlots, "tool");
  renderSpellSlots();
  renderTonicSlots();
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
    const slotEl = document.createElement("div");
    slotEl.className = "equipment-slot";

    const boxEl = document.createElement("div");
    boxEl.className = "equipment-box";
    boxEl.textContent = slot.current.displayName || slot.current.label;

    const labelEl = document.createElement("div");
    labelEl.className = "equipment-slot-label";
    labelEl.textContent = slot.label;

    slotEl.appendChild(boxEl);
    slotEl.appendChild(labelEl);
    ui.campUpgradeSlots.appendChild(slotEl);
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

function renderEquipmentSlots(groupEl, containerEl, equipmentType) {
  if (!groupEl || !containerEl) return;

  const slots = getPurchasedEquipmentSlots(equipmentType);
  containerEl.innerHTML = "";

  if (slots.length === 0) {
    hideElement(groupEl);
    return;
  }

  showElement(groupEl, "flex");

  slots.forEach(function (slot) {
    const slotEl = document.createElement("div");
    slotEl.className = "equipment-slot";

    const boxEl = document.createElement("div");
    boxEl.className = "equipment-box";
    boxEl.textContent = slot.current.displayName || slot.current.label;

    const labelEl = document.createElement("div");
    labelEl.className = "equipment-slot-label";
    labelEl.textContent = slot.label;

    slotEl.appendChild(boxEl);
    slotEl.appendChild(labelEl);
    containerEl.appendChild(slotEl);
  });
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
    const slotEl = document.createElement("div");
    slotEl.className = "equipment-slot";

    const boxEl = document.createElement("div");
    boxEl.className = "equipment-box";

    if (tonicName) {
      const tonic = getConsumable(tonicName);
      boxEl.textContent = tonic ? tonic.label : tonicName;
      boxEl.title = "Use " + boxEl.textContent;
      boxEl.classList.add("tonic-filled");
      boxEl.setAttribute("role", "button");
      boxEl.setAttribute("tabindex", "0");

      boxEl.addEventListener("click", function () {
        useConsumableFromSlot(slotIndex);
      });

      boxEl.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          useConsumableFromSlot(slotIndex);
        }
      });
    } else {
      boxEl.textContent = "Empty";
    }

    const labelEl = document.createElement("div");
    labelEl.className = "equipment-slot-label";
    labelEl.textContent = "Tonic";

    slotEl.appendChild(boxEl);
    slotEl.appendChild(labelEl);
    ui.tonicSlots.appendChild(slotEl);
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
    const slotEl = document.createElement("div");
    slotEl.className = "equipment-slot spell-slot";

    const boxEl = document.createElement("div");
    boxEl.className = "equipment-box spell-box";
    boxEl.setAttribute("role", "button");
    boxEl.setAttribute("tabindex", "0");
    boxEl.setAttribute("aria-controls", "spellTargetMenu");
    boxEl.setAttribute("aria-expanded", String(openSpellMenuName === entry.id));

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

    boxEl.addEventListener("click", function () {
      toggleSpellTargetMenu(entry.id);
    });

    boxEl.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleSpellTargetMenu(entry.id);
      }
    });

    const labelEl = document.createElement("div");
    labelEl.className = "equipment-slot-label";
    labelEl.textContent = "Spell";

    slotEl.appendChild(boxEl);
    slotEl.appendChild(labelEl);
    ui.spellSlots.appendChild(slotEl);
  });

  renderOpenSpellTargetMenu();
}

function unlockSpell(spellName) {
  const spell = getSpell(spellName);

  if (!spell) {
    console.warn("Unknown spell:", spellName);
    return;
  }

  spell.unlocked = true;
  updateEquipmentSlotUI();
  updateCharacterPanelLocks();
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
    upgrade.button.style.display = isCraftContextAvailable(upgrade) && upgrade.unlocked && !upgrade.purchased ? "inline-block" : "none";
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
  updateCharacterPanelLocks();
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
  updateCharacterPanelLocks();
}

function updateCraftingSectionVisibility() {
  if (!ui.craftingSection) return;

  const canUseCampWork = isCampWorkContextAvailable();
  const hasCampCrafting = hasAvailableCampUpgrade();
  const hasGearCrafting = hasAvailableGearUpgrade();
  const hasResourceCrafting = hasAvailableResourceCraft();
  const hasResearchCrafting = hasAvailableResearch();
  const hasResearchWorkspace = isResearchSpotPurchased();
  const hasProjects = canUseCampWork && hasVisibleProject();

  if (hasCampCrafting || hasGearCrafting || hasResourceCrafting || hasResearchCrafting || hasProjects) {
    showElement(ui.craftingSection, "flex");
  } else {
    hideElement(ui.craftingSection);
  }
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

  craft.button.style.display = context && isResourceCraftUnlockedForContext(craft, context) ? "inline-block" : "none";
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
  const hasResearch = canUseCampWork && isResearchSpotPurchased();
  const hasAutomation = canUseCampWork && hasUnlockedAutomation();
  const hasProjects = canUseCampWork && hasVisibleProject();

  if (hasResearch || hasAutomation || hasProjects) {
    showElement(ui.workTabs, "flex");
  } else {
    hideElement(ui.workTabs);
    showWorkPanel("crafting");
  }

  if (ui.researchTabBtn) {
    ui.researchTabBtn.style.display = hasResearch ? "inline-block" : "none";
  }

  if (ui.automationTabBtn) {
    ui.automationTabBtn.style.display = hasAutomation ? "inline-block" : "none";
  }

  if (ui.projectTabBtn) {
    ui.projectTabBtn.style.display = hasProjects ? "inline-block" : "none";
  }
}

function showWorkPanel(panelName) {
  const canUseCampWork = isCampWorkContextAvailable();
  const showingResearch = canUseCampWork && panelName === "research" && isResearchSpotPurchased();
  const showingAutomation = canUseCampWork && panelName === "automation" && hasUnlockedAutomation();
  const showingProjects = canUseCampWork && panelName === "projects" && hasVisibleProject();
  const showingCrafting = !showingResearch && !showingAutomation && !showingProjects;

  if (ui.craftingPanel) {
    ui.craftingPanel.style.display = showingCrafting ? "block" : "none";
  }

  if (ui.researchPanel) {
    ui.researchPanel.style.display = showingResearch ? "block" : "none";
  }

  if (ui.automationPanel) {
    ui.automationPanel.style.display = showingAutomation ? "block" : "none";
  }

  if (ui.projectPanel) {
    ui.projectPanel.style.display = showingProjects ? "block" : "none";
  }

  if (ui.craftingTabBtn) {
    ui.craftingTabBtn.classList.toggle("active", showingCrafting);
  }

  if (ui.researchTabBtn) {
    ui.researchTabBtn.classList.toggle("active", showingResearch);
  }

  if (ui.automationTabBtn) {
    ui.automationTabBtn.classList.toggle("active", showingAutomation);
  }

  if (ui.projectTabBtn) {
    ui.projectTabBtn.classList.toggle("active", showingProjects);
  }

  if (showingResearch) updateResearchHistoryUI();
  if (showingAutomation) updateAutomationUI();
  if (showingProjects) updateProjectUI();
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

function getProjectWorkCost(projectName) {
  const definition = getProjectDefinition(projectName);

  return definition ? definition.workCost || {} : {};
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

function canWorkOnProject(projectName) {
  const state = getProjectState(projectName);
  const level = getProjectCurrentLevel(projectName);

  if (!isCampWorkContextAvailable()) return false;
  if (!state || !level) return false;
  if (!state.unlocked || state.completed) return false;
  if (getProjectWorkRemaining(projectName) <= 0) return false;

  return canAffordCost(getProjectWorkCost(projectName));
}

function startProjectWork(projectName) {
  if (isActivityActive()) return;
  if (!canWorkOnProject(projectName)) return;

  const cost = getProjectWorkCost(projectName);

  if (!spendCost(cost)) return;

  if (!startActivity({
    kind: "projectWork",
    id: projectName,
    duration: getProjectWorkDuration(projectName),
  })) {
    refundCost(cost);
    return;
  }

  updateProjectButtons();
  updateAllActionButtons();
}

function completeProjectWork(projectName) {
  const definition = getProjectDefinition(projectName);
  const state = getProjectState(projectName);
  const level = getProjectCurrentLevel(projectName);

  if (!definition || !state || !level) return;

  const workGain = Math.min(level.workYield || 0, getProjectWorkRemaining(projectName));
  state.work = roundResourceAmount((state.work || 0) + workGain);

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
    gameState.towerConstructionUnlocked = true;

    if (definition.completedStory) {
      addStoryEntry(definition.completedStory);
    }

    addJournalEntry("towerFoundationAwakened");
  }

  updateProjectUI();
  updateCraftingSectionVisibility();
  updateWorkTabsVisibility();
}

function getVisibleProjectEntries() {
  const entries = [];
  const definitions = getProjectDefinitions();

  ensureProjectsState();

  for (let projectName in definitions) {
    const state = getProjectState(projectName);

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
    const empty = document.createElement("div");
    empty.classList.add("research-empty");
    empty.textContent = "No projects started yet.";
    ui.projectList.appendChild(empty);
    return;
  }

  entries.forEach(function (entry) {
    ui.projectList.appendChild(createProjectEntry(entry.id, entry.definition, entry.state));
  });

  updateProjectButtons();
}

function createProjectEntry(projectName, definition, state) {
  const level = getProjectCurrentLevel(projectName);
  const entry = document.createElement("div");
  entry.className = "project-entry";

  const header = document.createElement("div");
  header.className = "project-entry-header";

  const title = document.createElement("strong");
  title.textContent = definition.label + " - Level " + state.level;

  const status = document.createElement("span");
  status.textContent = state.completed ? definition.completedLabel || "Complete" : level.name;

  header.appendChild(title);
  header.appendChild(status);
  entry.appendChild(header);

  const description = document.createElement("p");
  description.className = "project-description";
  description.textContent = state.completed ? definition.completedDescription : level.description || definition.description || "";
  entry.appendChild(description);

  entry.appendChild(createProjectWorkProgress(projectName, level, state));
  entry.appendChild(createProjectMaterialList(projectName, level, state));
  entry.appendChild(createProjectActions(projectName, definition, state));

  return entry;
}

function createProjectWorkProgress(projectName, level, state) {
  const group = document.createElement("div");
  group.className = "project-progress-group";

  const text = document.createElement("div");
  text.className = "training-progress-text";

  if (level) {
    text.textContent = "Work: " + formatTrainingNumber(state.work || 0) + " / " + formatTrainingNumber(level.workRequired || 0);
  } else {
    text.textContent = "Work: complete";
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
    const empty = document.createElement("div");
    empty.className = "training-detail";
    empty.textContent = "Materials: complete";
    list.appendChild(empty);
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

  const button = document.createElement("button");
  button.type = "button";
  button.className = "project-deposit-btn";
  button.dataset.projectDeposit = projectName;
  button.dataset.resource = resourceName;
  button.textContent = "Deposit";

  button.addEventListener("click", function () {
    depositProjectResource(projectName, resourceName);
  });

  row.appendChild(label);
  row.appendChild(button);

  return row;
}

function createProjectActions(projectName, definition, state) {
  const actions = document.createElement("div");
  actions.className = "project-actions";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "action-btn project-work-btn";
  button.dataset.projectWork = projectName;

  const fill = document.createElement("div");
  fill.className = "progressFill";

  const label = document.createElement("span");
  label.textContent = state.completed ? "Project Complete" : definition.actionLabel || "Work";

  button.appendChild(fill);
  button.appendChild(label);
  button.addEventListener("click", function () {
    startProjectWork(projectName);
  });

  definition.workButton = button;
  actions.appendChild(button);

  return actions;
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

  const state = getProjectState(projectName);
  const isActiveProjectWork = isActivityActive() && gameState.activity.kind === "projectWork" && gameState.activity.id === projectName;
  const canStart = canWorkOnProject(projectName);
  const label = definition.workButton.querySelector("span");

  definition.workButton.classList.toggle("running", isActiveProjectWork);
  definition.workButton.disabled = state.completed || (!isActiveProjectWork && (isActivityActive() || !canStart));

  if (label) {
    if (state.completed) {
      label.textContent = "Project Complete";
    } else if (getProjectWorkRemaining(projectName) <= 0) {
      label.textContent = "Work Complete";
    } else {
      label.textContent = (definition.actionLabel || "Work") + " - " + formatCost(getProjectWorkCost(projectName));
    }
  }
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
    button.textContent = remaining <= 0 ? "Done" : "Deposit " + formatTrainingNumber(amount);
  });
}

function resetProjectWorkButtonProgress(projectName) {
  const definition = getProjectDefinition(projectName);
  const button = definition ? definition.workButton : null;
  const progressFill = button ? button.querySelector(".progressFill") : null;

  if (progressFill) {
    progressFill.style.width = "0%";
  }
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
    const empty = document.createElement("div");
    empty.classList.add("research-empty");
    empty.textContent = "No research recorded yet.";
    ui.researchList.appendChild(empty);
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
    button.classList.add("research-list-item");
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
    const empty = document.createElement("div");
    empty.classList.add("research-empty");
    empty.textContent = "Select research to view details.";
    ui.researchDetails.appendChild(empty);
    return;
  }

  const title = document.createElement("h4");
  title.textContent = entry.label;

  const status = document.createElement("div");
  status.classList.add("research-detail-status");
  status.textContent = getResearchStatusLabel(entry.status);

  const story = document.createElement("p");
  story.textContent = entry.story || "No notes recorded.";

  ui.researchDetails.appendChild(title);
  ui.researchDetails.appendChild(status);
  ui.researchDetails.appendChild(story);

  const unlockTitle = document.createElement("h5");
  unlockTitle.textContent = "Unlocks";
  ui.researchDetails.appendChild(unlockTitle);

  if (!entry.unlocks || entry.unlocks.length === 0) {
    const none = document.createElement("div");
    none.classList.add("research-empty");
    none.textContent = "No unlocks recorded.";
    ui.researchDetails.appendChild(none);
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
    const blocked = document.createElement("div");
    blocked.classList.add("research-empty");
    blocked.textContent = entry.lockedReason || "More information is needed before this research can begin.";
    ui.researchDetails.appendChild(blocked);
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

    const button = document.createElement("button");
    button.className = "action-btn automation-imbue-btn";
    button.type = "button";
    button.textContent = "Imbue Mana";
    button.disabled = !canImbueAutomation(machineName);
    button.addEventListener("click", function () {
      imbueAutomation(machineName);
    });

    const crystalButton = document.createElement("button");
    crystalButton.className = "action-btn automation-crystal-btn";
    crystalButton.type = "button";
    crystalButton.textContent = "Use Charged Crystal";
    crystalButton.disabled = !canChargeAutomationWithCrystal(machineName);
    crystalButton.addEventListener("click", function () {
      chargeAutomationWithCrystal(machineName);
    });

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

function getArcaneForceLevelRewardText(level) {
  const rewards = [
    "Shape Nails",
    "Shape tool parts",
    "Force-open dungeon doors",
    "Bulk harvest herbs and glimmerleaf",
    "Detonate ore nodes",
    "Ward research ready, story gated",
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
  const multiplier = getAttunementBonusMultiplier();

  return getActiveAttunements().reduce(function (total, entry) {
    const definition = getAttunementDefinition(entry.id);
    const effects = definition ? definition.effects || {} : {};

    return total + (effects[effectName] || 0) * multiplier;
  }, 0);
}

function getAttunementScaledEffectValue(definition, effectName) {
  const effects = definition ? definition.effects || {} : {};

  return (effects[effectName] || 0) * getAttunementBonusMultiplier();
}

function getAttunementTargetDescription(attunementName, definition, options = {}) {
  const effects = definition ? definition.effects || {} : {};
  const parts = [];

  if (effects.travelDistanceFlat) {
    parts.push("+" + formatAttunementEffectNumber(getAttunementScaledEffectValue(definition, "travelDistanceFlat")) + " travel distance per step");
  }

  if (effects.carryCapacityFlat) {
    parts.push("+" + formatAttunementEffectNumber(getAttunementScaledEffectValue(definition, "carryCapacityFlat")) + " carry capacity");
  }

  if (effects.maxEnergyFlat) {
    parts.push("+" + formatAttunementEffectNumber(getAttunementScaledEffectValue(definition, "maxEnergyFlat")) + " max energy");
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

    button.disabled = !canApplyAttunement(attunementName);

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

    const label = document.createElement("span");
    label.className = "attunement-target-label";
    label.textContent = definition.label;

    const description = document.createElement("span");
    description.className = "attunement-target-description";
    description.textContent = definition.description || "";

    const details = document.createElement("span");
    details.className = "attunement-target-details";
    details.textContent = formatSpellOptionDetails(spellName, definition, context);

    button.appendChild(label);
    button.appendChild(description);
    button.appendChild(details);

    button.disabled = !canApplyProductionSpellTarget(spellName, targetName);

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

  button.disabled = isActive || !canApplyManaSenseTarget(targetName);

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

  button.disabled = !canCastSpell(spellName);

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
    detail.textContent = "Current: " + getArcaneForceLevelRewardText(progress.level) + ". Ward research ready, story gated.";
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

