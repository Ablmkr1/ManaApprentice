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
  storageUpgrade: function (id) {
    unlockStorageUpgrade(id);
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
  if (!research.unlocked) return;
  if (!costAlreadyPaid && !spendCost(research.cost || {})) return;

  research.completed = true;
  research.unlocked = false;

  if (research.story) {
    addStoryEntry(research.story);
  }

  applyResearchUnlocks(researchName);

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

function hookStorageUpgradesToUI() {
  const storageUpgradeDefinitions = getStorageUpgradeDefinitions();

  for (let upgradeName in storageUpgradeDefinitions) {
    const upgrade = getStorageUpgrade(upgradeName);

    upgrade.button = document.getElementById(upgradeName + "Btn");
    upgrade.display = document.getElementById(upgradeName);

    if (upgrade.button) {
      prepareCraftButton(upgrade.button);

      upgrade.button.addEventListener("click", function () {
        buyStorageUpgrade(upgradeName);
      });
    }

    updateStorageUpgradeUI(upgradeName);
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

function updateStorageUpgradeUI(upgradeName) {
  const upgrade = getStorageUpgrade(upgradeName);

  if (!upgrade) return;

  if (upgrade.display) {
    upgrade.display.style.display = upgrade.tier > 0 ? "block" : "none";
    const currentTierName = getStorageCurrentTierName(upgrade);

    upgrade.display.textContent = currentTierName || upgrade.tier + "/" + upgrade.maxTier;
  }

  if (upgrade.button) {
    if (!isCraftContextAvailable(upgrade) || !upgrade.unlocked || upgrade.tier >= upgrade.maxTier) {
      upgrade.button.style.display = "none";
      updateStorageSectionVisibility();
      return;
    }
    upgrade.button.style.display = "inline-block";
    setCraftButtonLabel(upgrade.button, getStorageUpgradeButtonName(upgrade), getStorageUpgradeButtonCost(upgrade));
  }
  updateStorageSectionVisibility();
}

function updateStorageSectionVisibility() {
  if (!ui.storageSection) return;

  const storageUpgradeDefinitions = getStorageUpgradeDefinitions();

  for (let upgradeName in storageUpgradeDefinitions) {
    const upgrade = getStorageUpgrade(upgradeName);

    if (upgrade.tier > 0) {
      showElement(ui.storageSection, "flex");
      return;
    }
  }

  hideElement(ui.storageSection);
}

function getStorageUpgradeButtonName(upgrade) {
  const nextTier = upgrade.tier + 1;
  const nextTierName = getStorageNextTierName(upgrade);

  return nextTierName || upgrade.label + " " + nextTier + "/" + upgrade.maxTier;
}

function getStorageUpgradeButtonCost(upgrade) {
  return formatCost(upgrade.costs[upgrade.tier]);
}

function getBasicCraftButtonName(craft) {
  return craft.label;
}

function getBasicCraftButtonCost(craft) {
  const costs = [];
  const resourceCost = formatCost(craft.cost);
  const storageCost = formatStorageCost(craft.storageCost);

  if (resourceCost) costs.push(resourceCost);
  if (storageCost) costs.push(storageCost);

  return costs.join(", ");
}

function formatStorageCost(cost) {
  const costText = formatCost(cost);

  if (!costText) return "";

  return costText + " stored here";
}

function getStorageTierName(upgrade, tier) {
  if (!upgrade || !upgrade.tierNames) return null;

  return upgrade.tierNames[tier - 1] || null;
}

function getStorageCurrentTierName(upgrade) {
  return getStorageTierName(upgrade, upgrade.tier);
}

function getStorageNextTierName(upgrade) {
  return getStorageTierName(upgrade, upgrade.tier + 1);
}

function updateCraftButtonLabel(craftType, craftId) {
  const craft = getCraftDefinition(craftType, craftId);

  if (!craft || !craft.button) return;

  if (craftType === "storageUpgrade") {
    setCraftButtonLabel(craft.button, getStorageUpgradeButtonName(craft), getStorageUpgradeButtonCost(craft));
    return;
  }

  setCraftButtonLabel(craft.button, getBasicCraftButtonName(craft), getBasicCraftButtonCost(craft));
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
  if (!cost) return "";

  const parts = [];

  for (let resourceName in cost) {
    const resource = getResource(resourceName);
    const label = resource ? resource.label : resourceName;
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

  upgrade.onComplete();
  upgrade.purchased = true;
  upgrade.unlocked = false;

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

function unlockStorageUpgrade(upgradeName) {
  const upgrade = getStorageUpgrade(upgradeName);

  if (!upgrade) {
    console.warn("Unknown storage upgrade:", upgradeName);
    return;
  }

  if (upgrade.unlocked || upgrade.tier >= upgrade.maxTier) return;

  upgrade.unlocked = true;
  updateStorageUpgradeUI(upgradeName);
  updateCraftingSectionVisibility();
}

function buyStorageUpgrade(upgradeName) {
  startCrafting("storageUpgrade", upgradeName);
}

function completeStorageUpgrade(upgradeName) {
  const upgrade = getStorageUpgrade(upgradeName);

  if (!upgrade || !upgrade.unlocked || upgrade.tier >= upgrade.maxTier) return;

  upgrade.tier++;
  const resource = getResource(upgrade.resource);

  resource.maxValue += upgrade.maxValueIncrease;
  updateResource(upgrade.resource);
  updateStorageUpgradeUI(upgradeName);
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

  if (gameState.phase === "clearing" && hasSmallFire && hasCrudeLeanTo) {
    setPhase("expedition");
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
        if (entry.id === "attunement") {
          toggleAttunementTargetMenu();
          return;
        }

        castSpell(entry.id);
      });

      boxEl.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();

          if (entry.id === "attunement") {
            toggleAttunementTargetMenu();
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

  if (!spell || !spell.unlocked) return false;
  if (isActivityActive()) return false;
  if (!canAffordCost(spell.cost || {})) return false;

  if (spellName === "manaSense") {
    return !!getCurrentManaSenseReveal() || canAddManaSenseLocationObjectCharge() || canAddManaSenseDungeonCharge();
  }

  if (spellName === "attunement") {
    return hasAvailableAttunementTarget();
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

  if (!spell || !canCastSpell(spellName)) return;
  if (!spendCost(spell.cost || {})) return;

  if (!startActivity({ kind: "spell", id: spellName, context: context })) {
    refundCost(spell.cost || {});
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

function getCurrentManaSenseLocationObjectTarget() {
  const locationName = getCurrentObjectPlaceName();
  const place = getObjectPlace(locationName);

  if (!locationName || !place || !place.explorableObjects) return null;

  for (let objectName in place.explorableObjects) {
    const object = getLocationObject(locationName, objectName);

    if (!object || !object.manaSense) continue;
    if (isLocationObjectComplete(object)) continue;
    if (!isLocationObjectAvailable(object, { ignoreManaSenseCharges: true })) continue;

    const required = object.manaSense.required || 1;

    if ((object.manaSenseCharges || 0) >= required) continue;

    return {
      locationName,
      objectName,
    };
  }

  return null;
}

function canAddManaSenseLocationObjectCharge() {
  return !!getCurrentManaSenseLocationObjectTarget();
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

    const objectTarget = getCurrentManaSenseLocationObjectTarget();

    if (objectTarget) {
      return {
        type: "locationObjectCharge",
        locationName: objectTarget.locationName,
        objectName: objectTarget.objectName,
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

  return null;
}

function completeSpellCast(spellName, context) {
  if (spellName === "manaSense") {
    if (context && context.type === "reveal") {
      resolveManaSenseReveal(context);
    }

    if (context && context.type === "dungeonCharge") {
      addManaSenseDungeonChargeForNode(context.dungeonId, context.nodeId);
    }

    if (context && context.type === "locationObjectCharge") {
      addManaSenseLocationObjectCharge(context.locationName, context.objectName);
    }
  }

  if (spellName === "attunement") {
    if (context && context.type === "attunement") {
      applyAttunement(context.attunementId);
    }
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

function addManaSenseLocationObjectCharge(locationName, objectName) {
  const place = getObjectPlace(locationName);
  const object = getLocationObject(locationName, objectName);

  if (!place || !object || !object.manaSense) return false;

  const required = object.manaSense.required || 1;
  const currentCharges = object.manaSenseCharges || 0;

  if (currentCharges >= required) return false;

  object.manaSenseCharges = currentCharges + 1;

  const stories = object.manaSense.stories || [];
  const story = stories[currentCharges];

  if (story) {
    addStoryEntry(story);
  } else {
    addStoryEntry("Mana Sense sharpens your understanding of " + object.label + ".");
  }

  updateLocationObjectActionsUI(place);

  return true;
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

  upgrade.onComplete();
  upgrade.purchased = true;
  upgrade.unlocked = false;

  updateGearUpgradeUI(upgradeName);
  updateCharacterPanelLocks();
}

function updateCraftingSectionVisibility() {
  if (!ui.craftingSection) return;

  const hasCampCrafting = hasAvailableCampUpgrade();
  const hasGearCrafting = hasAvailableGearUpgrade();
  const hasResourceCrafting = hasAvailableResourceCraft();
  const hasStorageCrafting = hasAvailableStorageUpgrade();
  const hasResearchCrafting = hasAvailableResearch();
  const hasResearchWorkspace = isResearchSpotPurchased();

  if (hasCampCrafting || hasGearCrafting || hasStorageCrafting || hasResourceCrafting || hasResearchCrafting) {
    showElement(ui.craftingSection, "flex");
  } else {
    hideElement(ui.craftingSection);
  }
}

function getCraftDefinition(craftType, craftId) {
  if (craftType === "campUpgrade") return getCampUpgrade(craftId);
  if (craftType === "gearUpgrade") return getGearUpgrade(craftId);
  if (craftType === "storageUpgrade") return getStorageUpgrade(craftId);

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

function hasAvailableStorageUpgrade() {
  const upgrades = getStorageUpgradeDefinitions();

  for (let upgradeName in upgrades) {
    if (isCraftAvailable("storageUpgrade", upgradeName)) return true;
  }

  return false;
}

function getCraftCost(craftType, craftId) {
  const craft = getCraftDefinition(craftType, craftId);

  if (!craft) return null;

  if (craftType === "storageUpgrade") {
    return craft.costs[craft.tier];
  }

  return craft.cost;
}

function getCraftDuration(craftType, craftId) {
  const craft = getCraftDefinition(craftType, craftId);

  if (!craft) return 1;

  return craft.duration || 1;
}

function shouldContinueCrafting(craftType, craftId) {
  const craft = getCraftDefinition(craftType, craftId);
  const cost = getCraftCost(craftType, craftId);

  if (!craft || !craft.auto || !cost) return false;
  if (!isCraftAvailable(craftType, craftId)) return false;
  if (!canAffordCost(cost)) return false;
  if (!canAffordStorageCost(craft.storageCost)) return false;

  return true;
}

function startCrafting(craftType, craftId) {
  if (isActivityActive()) return;

  const craft = getCraftDefinition(craftType, craftId);
  const cost = getCraftCost(craftType, craftId);

  if (!craft || !cost) return;
  if (!isCraftAvailable(craftType, craftId)) return;
  if (!spendCost(cost)) return;
  if (!spendStorageCost(craft.storageCost)) {
    refundCost(cost);
    return;
  }

  updateLocationStorageUI(getExpeditionLocation(gameState.expedition.currentLocation));

  startActivity({
    kind: "craft",
    type: craftType,
    id: craftId,
  });

  updateCraftingButtons();
  updateAllActionButtons();

  if (craftType === "research") {
    updateSelectedResearchButtonState();
  }
}

function isCraftAvailable(craftType, craftId) {
  const craft = getCraftDefinition(craftType, craftId);

  if (!craft) return false;
  if (!isCraftContextAvailable(craft)) return false;
  if (!canAffordStorageCost(craft.storageCost)) return false;

  if (craft.producesConsumable && !hasConsumableSpace(craft.producesConsumable.resource, craft.producesConsumable.amount)) {
    return false;
  }

  if (craftType === "campUpgrade") {
    return craft.unlocked && !craft.purchased;
  }

  if (craftType === "gearUpgrade") {
    return craft.unlocked && !craft.purchased;
  }

  if (craftType === "storageUpgrade") {
    return craft.unlocked && craft.tier < craft.maxTier;
  }

  if (craftType === "resourceCraft") {
    return craft.unlocked;
  }

  if (craftType === "research") {
    return craft.unlocked && !craft.completed;
  }

  return false;
}

function updateCraftingButtons() {
  updateCraftButtonsForType("campUpgrade", getCampUpgradeDefinitions());
  updateCraftButtonsForType("gearUpgrade", getGearUpgradeDefinitions());
  updateCraftButtonsForType("storageUpgrade", getStorageUpgradeDefinitions());
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

  if (!craft || (!craft.produces && !craft.storageProduces && !craft.producesConsumable)) return;

  if (craft.storageProduces) {
    addStorageProduces(craft.storageProduces);
    updateLocationStorageUI(getExpeditionLocation(gameState.expedition.currentLocation));
  } else if (craft.producesConsumable) {
    for (let i = 0; i < craft.producesConsumable.amount; i++) {
      addConsumableToSlot(craft.producesConsumable.resource);
    }

    refreshExpeditionUI();
    updateEquipmentSlotUI();
  } else {
    addResource(craft.produces.resource, craft.produces.amount);
  }

  updateResourceCraftUI(craftName);
}

function hookResourceCraftsToUI() {
  const crafts = getResourceCraftDefinitions();

  for (let craftName in crafts) {
    const craft = getResourceCraft(craftName);

    craft.button = document.getElementById(craftName + "CraftBtn");

    if (craft.button) {
      prepareCraftButton(craft.button);
      craft.button.addEventListener("click", function () {
        startCrafting("resourceCraft", craftName);
      });
    }

    updateResourceCraftUI(craftName);
  }

  updateCraftingSectionVisibility();
}

function updateResourceCraftUI(craftName) {
  const craft = getResourceCraft(craftName);

  if (!craft || !craft.button) return;

  craft.button.style.display = isCraftContextAvailable(craft) && craft.unlocked ? "inline-block" : "none";
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
  if (!craft) return false;

  const requiredLocation = craft.requiredLocation || "camp";

  if (requiredLocation === "camp") {
    const expedition = gameState.expedition;

    return !expedition.active && !expedition.currentLocation;
  }

  return gameState.expedition.currentLocation === requiredLocation;
}

function updateCraftingUIForCurrentContext() {
  const campUpgrades = getCampUpgradeDefinitions();

  for (let upgradeName in campUpgrades) {
    updateCampUpgradeUI(upgradeName);
  }

  const storageUpgrades = getStorageUpgradeDefinitions();

  for (let upgradeName in storageUpgrades) {
    updateStorageUpgradeUI(upgradeName);
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
      status: research.completed ? "complete" : "available",
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
    status.textContent = entry.status === "complete" ? "Complete" : "Available";

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
  status.textContent = entry.status === "complete" ? "Complete" : "Available";

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

  if (entry.type === "research" && entry.status === "available") {
    const research = getResearch(entry.id);

    const costTitle = document.createElement("h5");
    costTitle.textContent = "Cost";
    ui.researchDetails.appendChild(costTitle);

    const costText = document.createElement("div");
    costText.classList.add("research-cost");
    costText.textContent = formatCost(research.cost || {});
    ui.researchDetails.appendChild(costText);

    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("action-btn", "research-complete-btn");
    button.dataset.research = entry.id;

    research.button = button;

    setCraftButtonLabel(button, "Research " + entry.label, formatCost(research.cost || {}));

    const researchName = entry.id;

    button.addEventListener("click", function (event) {
      event.preventDefault();

      startCrafting("research", researchName);
    });

    ui.researchDetails.appendChild(button);
    updateSelectedResearchButtonState();
  }
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

  const canStartResearch = isCraftAvailable("research", researchName) && canAffordCost(research.cost || {});

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

  if (unlock.type === "storageUpgrade") {
    const upgrade = getStorageUpgrade(unlock.id);
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
    details.textContent = "Cycles: " + machine.cycles;

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

    row.appendChild(title);
    row.appendChild(details);
    row.appendChild(progress);
    row.appendChild(button);
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

    if (!machine.unlocked || machine.cycles <= 0) continue;
    if (!canReceiveAutomationProduces(machine)) continue;

    machine.progress += deltaSeconds / machine.duration;

    while (machine.progress >= 1 && machine.cycles > 0) {
      if (!canReceiveAutomationProduces(machine)) break;

      addResource(machine.produces.resource, machine.produces.amount);
      machine.cycles--;
      machine.progress -= 1;
    }

    if (machine.cycles <= 0) {
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

    if (fill) {
      fill.style.width = Math.floor((machine.progress || 0) * 100) + "%";
    }

    if (details) {
      details.textContent = "Cycles: " + machine.cycles;
    }

    if (button) {
      button.disabled = !canImbueAutomation(machineName);
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

  if (!gameState.magic.attunements.capacity) {
    gameState.magic.attunements.capacity = 1;
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

function hideAttunementTargetMenu() {
  if (!ui.attunementTargetMenu) return;

  ui.attunementTargetMenu.innerHTML = "";
  hideElement(ui.attunementTargetMenu);
}

function toggleAttunementTargetMenu() {
  if (!ui.attunementTargetMenu) return;

  if (ui.attunementTargetMenu.style.display !== "none") {
    hideAttunementTargetMenu();
    return;
  }

  renderAttunementTargetMenu();
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
    const button = document.createElement("button");
    button.type = "button";
    button.className = "attunement-target-btn";

    const label = document.createElement("span");
    label.className = "attunement-target-label";
    label.textContent = definition.label;

    const description = document.createElement("span");
    description.className = "attunement-target-description";
    description.textContent = definition.description || "";

    button.appendChild(label);
    button.appendChild(description);

    button.disabled = !canApplyAttunement(attunementName);

    button.addEventListener("click", function () {
      castTargetedSpell("attunement", {
        type: "attunement",
        attunementId: attunementName,
      });
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

  if (!spendCost(cost)) return;

  if (!startActivity({ kind: "spell", id: spellName, context: context })) {
    refundCost(cost);
    return;
  }

  hideAttunementTargetMenu();
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

function isEquipmentSlotAttuned(equipmentType, slotName) {
  return getActiveAttunements().some(function (entry) {
    return entry.equipmentType === equipmentType && entry.slot === slotName;
  });
}
