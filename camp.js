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
};

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

    ui.restBtn.style.display = "inline-block";
  } else {
    lockAction("gatherWood");
    lockAction("gatherFood");
    lockAction("gatherWater");
    lockAction("explore");
    lockAction("recover");
    lockAction("meditate");
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

    if (isEquipmentSlotAttuned(equipmentType, slot.current.slot)) {
      boxEl.classList.add("attuned");

      const starEl = document.createElement("span");
      starEl.className = "attunement-star";
      starEl.textContent = "*";
      boxEl.appendChild(starEl);
    }

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
    hideElement(ui.spellSlotsGroup);
    return;
  }

  showElement(ui.spellSlotsGroup, "flex");

  unlockedSpells.forEach(function (entry) {
    const slotEl = document.createElement("div");
    slotEl.className = "equipment-slot";

    const boxEl = document.createElement("div");
    boxEl.className = "equipment-box";

    const nameEl = document.createElement("span");
    nameEl.className = "spell-slot-name";
    nameEl.textContent = entry.spell.label;

    const progressFill = document.createElement("div");
    progressFill.classList.add("progressFill");

    boxEl.appendChild(nameEl);
    boxEl.appendChild(progressFill);
    entry.spell.button = boxEl;

    if (entry.id === "attunement") {
      renderAttunementPips(boxEl);
    }

    const isActiveSpell = isActivityActive() && gameState.activity.kind === "spell" && gameState.activity.id === entry.id;

    if (isActiveSpell) {
      boxEl.classList.add("tonic-filled");
      boxEl.title = "Casting " + entry.spell.label;
    } else if (canCastSpell(entry.id)) {
      boxEl.classList.add("tonic-filled");
      boxEl.title = "Cast " + entry.spell.label;
      boxEl.setAttribute("role", "button");
      boxEl.setAttribute("tabindex", "0");

      boxEl.addEventListener("click", function () {
        if (canAddLocationObjectSpellCharge(entry.id)) {
          castSpell(entry.id);
          return;
        }

        if (entry.id === "attunement") {
          toggleAttunementTargetMenu();
          return;
        }

        if (isProductionSpell(entry.id)) {
          toggleProductionSpellTargetMenu(entry.id);
          return;
        }

        castSpell(entry.id);
      });

      boxEl.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();

          if (canAddLocationObjectSpellCharge(entry.id)) {
            castSpell(entry.id);
            return;
          }

          if (entry.id === "attunement") {
            toggleAttunementTargetMenu();
            return;
          }

          if (isProductionSpell(entry.id)) {
            toggleProductionSpellTargetMenu(entry.id);
            return;
          }

          castSpell(entry.id);
        }
      });
    } else if (isActivityActive()) {
      boxEl.title = "Something else is in progress.";
    } else {
      boxEl.title = "Nothing nearby answers this spell.";
    }

    const labelEl = document.createElement("div");
    labelEl.className = "equipment-slot-label";
    labelEl.textContent = "Spell";

    slotEl.appendChild(boxEl);
    slotEl.appendChild(labelEl);
    ui.spellSlots.appendChild(slotEl);
  });
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
    return !!context;
  }

  if (context && context.type === "locationObjectSpellCharge") {
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
    if (isAttunementTargetAvailable(attunementName)) {
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

  if (spellName === "attunement" && context && context.type === "attunement") {
    const definition = getAttunementDefinition(context.attunementId);

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
  const actualSpellName = context && context.type === "locationObjectSpellCharge" && context.spellName ? context.spellName : spellName;
  const spell = getSpell(actualSpellName);

  return spell ? spell.label : actualSpellName;
}

function recordCompletedSpellManaControl(spellName, context, manaSpent) {
  if (!Number.isFinite(manaSpent) || manaSpent <= 0) return;
  if (typeof recordManaControl !== "function") return;

  recordManaControl(manaSpent, getCompletedSpellManaControlLabel(spellName, context));
}

function completeSpellCast(spellName, context) {
  const manaSpent = getCompletedSpellManaSpent(spellName, context);
  let completedSuccessfully = false;

  if (context && context.type === "locationObjectSpellCharge") {
    addLocationObjectSpellCharge(context.locationName, context.objectName, context.spellName);
    recordCompletedSpellManaControl(spellName, context, manaSpent);
    updateEquipmentSlotUI();
    updateAllActionButtons();
    updateCraftingButtons();
    return;
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
    recordCompletedSpellManaControl(spellName, context, manaSpent);
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

  const hasCampCrafting = hasAvailableCampUpgrade();
  const hasGearCrafting = hasAvailableGearUpgrade();
  const hasResourceCrafting = hasAvailableResourceCraft();
  const hasResearchCrafting = hasAvailableResearch();
  const hasResearchWorkspace = isResearchSpotPurchased();

  if (hasCampCrafting || hasGearCrafting || hasResourceCrafting || hasResearchCrafting) {
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

function updateWorkTabsVisibility() {
  if (!ui.workTabs) return;

  const hasResearch = isResearchSpotPurchased();
  const hasAutomation = hasUnlockedAutomation();

  if (hasResearch || hasAutomation) {
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
}

function showWorkPanel(panelName) {
  const showingResearch = panelName === "research" && isResearchSpotPurchased();
  const showingAutomation = panelName === "automation" && hasUnlockedAutomation();
  const showingCrafting = !showingResearch && !showingAutomation;

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
  }

  if (ui.researchTabBtn) {
    ui.researchTabBtn.classList.toggle("active", showingResearch);
  }

  if (ui.automationTabBtn) {
    ui.automationTabBtn.classList.toggle("active", showingAutomation);
  }

  if (showingResearch) updateResearchHistoryUI();
  if (showingAutomation) updateAutomationUI();
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

  if (!machine || !machine.unlocked) return false;

  return canAffordCost(machine.fuelCost);
}

function imbueAutomation(machineName) {
  const machine = getAutomation(machineName);

  if (!machine || !machine.unlocked) return;
  if (!spendCost(machine.fuelCost)) return;

  machine.cycles += machine.cyclesPerMana;
  updateAutomationUI();
}

function canChargeAutomationWithCrystal(machineName) {
  const machine = getAutomation(machineName);

  if (!machine || !machine.unlocked) return false;

  return canAffordCost({ chargedCrystal: 1 });
}

function chargeAutomationWithCrystal(machineName) {
  const machine = getAutomation(machineName);

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

function getAttunementState() {
  if (!gameState.magic.attunements) {
    gameState.magic.attunements = {
      capacity: 1,
      active: [],
    };
  }

  if (!Array.isArray(gameState.magic.attunements.active)) {
    gameState.magic.attunements.active = [];
  }

  const derivedCapacity =
    typeof getAttunementCapacityFromManaControl === "function" ? getAttunementCapacityFromManaControl() : gameState.magic.attunements.capacity || 1;

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
    const effects = definition ? definition.effects || {} : {};

    return total + (effects[effectName] || 0);
  }, 0);
}

function clearActiveAttunements() {
  getAttunementState().active = [];
  updateEquipmentSlotUI();
}

function hideSpellTargetMenu() {
  if (!ui.attunementTargetMenu) return;

  ui.attunementTargetMenu.innerHTML = "";
  hideElement(ui.attunementTargetMenu);
}

function hideAttunementTargetMenu() {
  hideSpellTargetMenu();
}

function toggleAttunementTargetMenu() {
  if (!ui.attunementTargetMenu) return;

  if (ui.attunementTargetMenu.style.display !== "none") {
    hideSpellTargetMenu();
    return;
  }

  renderAttunementTargetMenu();
}

function toggleImbueTargetMenu() {
  toggleProductionSpellTargetMenu("imbue");
}

function toggleProductionSpellTargetMenu(spellName) {
  if (!ui.attunementTargetMenu) return;

  if (ui.attunementTargetMenu.style.display !== "none") {
    hideSpellTargetMenu();
    return;
  }

  renderProductionSpellTargetMenu(spellName);
}

function renderAttunementTargetMenu() {
  if (!ui.attunementTargetMenu) return;

  ui.attunementTargetMenu.innerHTML = "";

  const definitions = getAttunementDefinitions();
  let hasTargets = false;

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
    description.textContent = definition.description || "";

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

    ui.attunementTargetMenu.appendChild(button);
  }

  if (!hasTargets) {
    ui.attunementTargetMenu.textContent = "No available targets.";
  }

  showElement(ui.attunementTargetMenu, "block");
}

function renderImbueTargetMenu() {
  renderProductionSpellTargetMenu("imbue");
}

function renderProductionSpellTargetMenu(spellName) {
  if (!ui.attunementTargetMenu) return;

  ui.attunementTargetMenu.innerHTML = "";

  const definitions = getProductionSpellDefinitions(spellName);
  let hasTargets = false;

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

    ui.attunementTargetMenu.appendChild(button);
  }

  if (!hasTargets) {
    ui.attunementTargetMenu.textContent = "No available targets.";
  }

  showElement(ui.attunementTargetMenu, "block");
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
  if (hasActiveAttunement(attunementName)) return false;

  return !!getPurchasedEquipmentForSlot(definition.equipmentType, definition.slot);
}

function getProductionSpellDefinitions(spellName) {
  if (spellName === "imbue") return getImbueDefinitions();
  if (spellName === "arcaneHeat") return getArcaneHeatDefinitions();

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
    produces: definition.campProduces || definition.produces || null,
    storageProduces: null,
    producesConsumable: definition.campProducesConsumable || definition.producesConsumable || null,
  };
}

function getLocationProductionSpellTargetContext(definition) {
  if (!definition) return null;

  const requiredLocation = definition.requiredLocation || "camp";

  if (requiredLocation === "camp") {
    if (!isCampCraftingContext()) return null;
  } else if (gameState.expedition.currentLocation !== requiredLocation) {
    return null;
  }

  return {
    mode: requiredLocation === "camp" ? "camp" : "location",
    cost: definition.cost || {},
    storageCost: definition.storageCost || null,
    produces: definition.produces || null,
    storageProduces: definition.storageProduces || null,
    producesConsumable: definition.producesConsumable || null,
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

  if (context && context.type === "productionSpell" && context.spellName === spellName) {
    const definition = getProductionSpellDefinition(spellName, context.targetId);

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
  const cost = targetContext ? targetContext.cost : definition ? definition.cost : {};
  const storageCost = targetContext ? targetContext.storageCost : definition ? definition.storageCost : null;

  return [
    "Mana: " + getSpellOptionManaCost(cost),
    "Time: " + formatSpellDuration(getSpellCastDuration(spellName, context)),
    "Materials: " + getSpellOptionMaterialCost(cost, storageCost),
  ].join(" | ");
}

function getSpellOptionManaCost(cost) {
  if (!cost || !Number.isFinite(cost.mana)) {
    return 0;
  }

  return cost.mana;
}

function getSpellOptionMaterialCost(cost, storageCostDefinition) {
  const materials = [];
  const resourceCost = formatCostExcluding(cost, ["mana"]);
  const storageCost = formatStoredSpellMaterialCost(storageCostDefinition);

  if (resourceCost) materials.push(resourceCost);
  if (storageCost) materials.push(storageCost);

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

function isProductionSpellTargetAvailable(spellName, targetName) {
  const definition = getProductionSpellDefinition(spellName, targetName);
  const targetContext = getProductionSpellTargetContext(spellName, targetName);

  if (!definition) return false;
  if (!targetContext) return false;

  if (!areProductionSpellTargetRequirementsMet(definition.requires)) return false;

  if (!canAffordStorageCost(targetContext.storageCost)) return false;
  if (!canReceiveProductionProduces(targetContext.produces)) return false;
  if (!canReceiveStorageProduces(targetContext.storageProduces)) return false;

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

  return canAffordCost(targetContext.cost || {});
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

  hideSpellTargetMenu();
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

  const equipment = getPurchasedEquipmentForSlot(definition.equipmentType, definition.slot);

  if (!equipment) return false;

  state.active.push({
    id: attunementName,
    equipmentType: definition.equipmentType,
    slot: definition.slot,
  });

  addStoryEntry("You attune to " + (equipment.displayName || equipment.label) + ".");
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
  if (!isProductionSpellTargetAvailable(spellName, targetName)) return false;
  if (!spendStorageCost(targetContext.storageCost)) return false;

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

function isEquipmentSlotAttuned(equipmentType, slotName) {
  return getActiveAttunements().some(function (entry) {
    return entry.equipmentType === equipmentType && entry.slot === slotName;
  });
}
