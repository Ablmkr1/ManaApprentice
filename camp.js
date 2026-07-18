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
  recipe: function (id) {
    unlockRecipe(id);
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
<<<<<<< HEAD
  region: function (id) {
    unlockRegion(id);
  },
=======
>>>>>>> 86ac9513542bd256aa795f218e5db58adf7168cf
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
  refreshTabbedLayout();
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
  refreshTabbedLayout();
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

function applyRecipeUnlocks(recipeName) {
  const recipe = getRecipe(recipeName);

  if (!recipe || !Array.isArray(recipe.unlocks)) return;

  applyUnlocks(recipe.unlocks);
}

function unlockRecipe(recipeName) {
  const recipe = getRecipe(recipeName);

  if (!recipe) {
    console.warn("Unknown recipe:", recipeName);
    return;
  }

  if (recipe.discovered) return;

  recipe.discovered = true;

  if (recipe.story) {
    addStoryEntry(recipe.story);
  }

  applyRecipeUnlocks(recipeName);
}

function checkRecipeDiscoveries() {
  const recipeDefinitions = getRecipeDefinitions();

  for (let recipeName in recipeDefinitions) {
    const recipe = getRecipe(recipeName);

    if (!isRecipeDiscoverable(recipe)) continue;

    unlockRecipe(recipeName);
  }
}

function isRecipeDiscoverable(recipe) {
  if (!recipe || recipe.discovered) return false;

  if (!recipe.requires) return false;

  if (!hasRequiredRecipeLocations(recipe.requires.locationsExplored)) {
    return false;
  }

  if (!hasRequiredRecipeResources(recipe.requires.resources)) {
    return false;
  }

  if (!hasRequiredRecipeCampUpgrades(recipe.requires.campUpgradesPurchased)) {
    return false;
  }

  if (!hasRequiredRecipeGear(recipe.requires.gearPurchased)) {
    return false;
  }

  if (!hasRequiredRecipeRecipes(recipe.requires.recipesDiscovered)) {
    return false;
  }

  return true;
}

function hasRequiredRecipeLocations(requiredLocations) {
  if (!requiredLocations) return true;

  for (let i = 0; i < requiredLocations.length; i++) {
    const location = getExpeditionLocation(requiredLocations[i]);

    if (!location || !location.explored) {
      return false;
    }
  }

  return true;
}

function hasRequiredRecipeResources(requiredResources) {
  if (!requiredResources) return true;

  for (let resourceName in requiredResources) {
    const resource = getResource(resourceName);

    if (!resource || resource.value < requiredResources[resourceName]) {
      return false;
    }
  }

  return true;
}

function hasRequiredRecipeCampUpgrades(requiredUpgrades) {
  if (!requiredUpgrades) return true;

  for (let i = 0; i < requiredUpgrades.length; i++) {
    const upgrade = getCampUpgrade(requiredUpgrades[i]);

    if (!upgrade || !upgrade.purchased) {
      return false;
    }
  }

  return true;
}

function hasRequiredRecipeGear(requiredGear) {
  if (!requiredGear) return true;

  for (let i = 0; i < requiredGear.length; i++) {
    const gear = getGearUpgrade(requiredGear[i]);

    if (!gear || !gear.purchased) {
      return false;
    }
  }

  return true;
}

function hasRequiredRecipeRecipes(requiredRecipes) {
  if (!requiredRecipes) return true;

  for (let i = 0; i < requiredRecipes.length; i++) {
    const recipe = getRecipe(requiredRecipes[i]);

    if (!recipe || !recipe.discovered) {
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

  updateStorageSectionVisibility();
}

function hookGearUpgradesToUI() {
  const gearUpgradeDefinitions = getGearUpgradeDefinitions();

  for (let upgradeName in gearUpgradeDefinitions) {
    const upgrade = getGearUpgrade(upgradeName);

    upgrade.button = document.getElementById(upgradeName + "Btn");
    upgrade.display = document.getElementById(upgradeName);

    if (upgrade.button) {
      upgrade.button.addEventListener("click", function () {
        buyGearUpgrade(upgradeName);
      });
    }

    updateGearUpgradeUI(upgradeName);
  }
}

function updateStorageUpgradeUI(upgradeName) {
  const upgrade = getStorageUpgrade(upgradeName);

  if (!upgrade) return;

  if (upgrade.display) {
    const currentTierName = getStorageCurrentTierName(upgrade);

    upgrade.display.style.display = "block";
    upgrade.display.textContent = currentTierName || "Unbuilt";
  }

  if (upgrade.button) {
    if (!upgrade.unlocked || upgrade.tier >= upgrade.maxTier) {
      upgrade.button.style.display = "none";
      updateStorageCardUI(upgradeName);
      updateStorageSectionVisibility();
      return;
    }

    upgrade.button.style.display = "flex";
    setCraftButtonLabel(upgrade.button, getStorageUpgradeButtonName(upgrade), getStorageUpgradeButtonCost(upgrade));
  }

  updateStorageCardUI(upgradeName);
  updateStorageSectionVisibility();
}

function updateStorageSectionVisibility() {
  if (!ui.storageSection) return;

  if (hasStorageSurfaceContent()) {
    showElement(ui.storageSection, "block");
  } else {
    hideElement(ui.storageSection);
  }

  refreshTabbedLayout();
}

function updateStorageCardUI(upgradeName) {
  const upgrade = getStorageUpgrade(upgradeName);
  const card = document.querySelector('[data-storage-card="' + upgradeName + '"]');

  if (!upgrade || !card) return;

  const visible = upgrade.unlocked || upgrade.tier > 0;
  card.style.display = visible ? "grid" : "none";

  const capacity = card.querySelector('[data-storage-capacity="' + upgradeName + '"]');
  const resource = getResource(upgrade.resource);

  if (capacity && resource) {
    capacity.textContent = "Capacity: " + resource.maxValue + " - Tier " + upgrade.tier + "/" + upgrade.maxTier;
  }
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
  return formatCost(craft.cost);
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

    if (gameState.phase === "clearing") {
      unlockAction("explore");
    }

    ui.restBtn.style.display = "inline-block";
  } else {
    lockAction("gatherWood");
    lockAction("gatherFood");
    lockAction("gatherWater");
    lockAction("explore");
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
    setCurrentGoal("exploreOutskirts");
    addJournalEntry("campEstablished");
    showCampEstablishedPopup();
    updatePlacePanel();
    addStoryEntry("With fire and shelter established, the clearing feels less like a refuge and more like a camp. It is time to range farther.");
  }
}

function updateGearUpgradeUI(upgradeName) {
  const upgrade = getGearUpgrade(upgradeName);

  if (!upgrade) return;

  if (gameState.phase === "expedition") {
    showElement(ui.gearSection);
  }

  if (upgrade.button) {
    upgrade.button.style.display = upgrade.unlocked && !upgrade.purchased ? "inline-block" : "none";
    if (upgrade.unlocked && !upgrade.purchased) {
      updateCraftButtonLabel("gearUpgrade", upgradeName);
    }
  }

  if (upgrade.display) {
    upgrade.display.style.display = upgrade.purchased ? "block" : "none";
  }
  updateGearSlotVisibility();
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
  refreshTabbedLayout();
}

function updateCraftingSectionVisibility() {
  if (!ui.craftingSection) return;

  const hasCampCrafting = hasAvailableCampUpgrade();
  const hasGearCrafting = hasAvailableGearUpgrade();
  const hasResourceCrafting = hasAvailableResourceCraft();

  setCraftCategoryVisibility(ui.campCraftCategory, hasCampCrafting);
  setCraftCategoryVisibility(ui.gearCraftCategory, hasGearCrafting);
  setCraftCategoryVisibility(ui.resourceCraftCategory, hasResourceCrafting);

  if (hasCampCrafting || hasGearCrafting || hasResourceCrafting) {
    showElement(ui.craftingSection, "grid");
  } else {
    hideElement(ui.craftingSection);
  }

  refreshTabbedLayout();
}

function setCraftCategoryVisibility(category, visible) {
  if (!category) return;

  if (visible) {
    showElement(category, "flex");
  } else {
    hideElement(category);
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
    const research = getResearch(researchName);

    if (research.unlocked && !research.completed) return true;
  }

  return false;
}

function hasAvailableResourceCraft() {
  const crafts = getResourceCraftDefinitions();

  for (let craftName in crafts) {
    const craft = getResourceCraft(craftName);

    if (craft.unlocked) return true;
  }

  return false;
}

function hasAvailableStorageUpgrade() {
  const upgrades = getStorageUpgradeDefinitions();

  for (let upgradeName in upgrades) {
    const upgrade = getStorageUpgrade(upgradeName);

    if (upgrade.unlocked && upgrade.tier < upgrade.maxTier) return true;
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

function startCrafting(craftType, craftId) {
  if (isActivityActive()) return;

  const craft = getCraftDefinition(craftType, craftId);
  const cost = getCraftCost(craftType, craftId);

  if (!craft || !cost) return;
  if (!isCraftAvailable(craftType, craftId)) return;
  if (!spendCost(cost)) return;

  startActivity({
    kind: "craft",
    type: craftType,
    id: craftId,
  });

  updateCraftingButtons();
  updateAllActionButtons();
}

function isCraftAvailable(craftType, craftId) {
  const craft = getCraftDefinition(craftType, craftId);

  if (!craft) return false;

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

  if (!craft || !craft.produces) return;

  addResource(craft.produces.resource, craft.produces.amount);
  updateResourceCraftUI(craftName);
}

function completeResearch(researchName) {
  const research = getResearch(researchName);

  if (!research || research.completed) return;

  research.completed = true;
  research.unlocked = false;

  if (research.onComplete) {
    research.onComplete();
  }

  updateResearchUI(researchName);
  updateCraftingSectionVisibility();
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

function hookResearchToUI() {
  const researchDefinitions = getResearchDefinitions();

  for (let researchName in researchDefinitions) {
    const research = getResearch(researchName);

    research.button = document.getElementById(researchName + "ResearchBtn");

    if (research.button) {
      prepareCraftButton(research.button);
      research.button.addEventListener("click", function () {
        startCrafting("research", researchName);
      });
    }

    updateResearchUI(researchName);
  }

  updateResearchSectionVisibility();
}

function updateResearchUI(researchName) {
  const research = getResearch(researchName);

  if (!research || !research.button) return;

  research.button.style.display = research.unlocked && !research.completed ? "flex" : "none";
  updateCraftButtonLabel("research", researchName);
  updateCraftingButtons();
  updateResearchSectionVisibility();
}

function unlockResearch(researchName) {
  const research = getResearch(researchName);

  if (!research) {
    console.warn("Unknown research:", researchName);
    return;
  }

  if (research.completed || research.unlocked) return;
  if (!isResearchRequirementMet(research)) return;

  research.unlocked = true;
  updateResearchUI(researchName);
  updateCraftingSectionVisibility();
  updateResearchSectionVisibility();
}

function updateResearchSectionVisibility() {
  if (!ui.researchSection) return;

  if (hasResearchSurfaceContent()) {
    showElement(ui.researchSection, "grid");
  } else {
    hideElement(ui.researchSection);
  }

  if (ui.researchEmpty) {
    ui.researchEmpty.style.display = hasResearchSurfaceContent() && !hasAvailableResearch() ? "block" : "none";
  }

  refreshTabbedLayout();
}

function isResearchRequirementMet(research) {
  if (!research.requires || !research.requires.flags) return true;

  for (let i = 0; i < research.requires.flags.length; i++) {
    if (!gameState[research.requires.flags[i]]) {
      return false;
    }
  }

  return true;
}

function updateResourceCraftUI(craftName) {
  const craft = getResourceCraft(craftName);

  if (!craft || !craft.button) return;

  craft.button.style.display = craft.unlocked ? "inline-block" : "none";
  updateCraftButtonLabel("resourceCraft", craftName);
  updateCraftingButtons();
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
    const upgrade = getCampUpgrade(upgradeName);

    if (upgrade.unlocked && !upgrade.purchased) return true;
  }

  return false;
}

function hasAvailableGearUpgrade() {
  const upgrades = getGearUpgradeDefinitions();

  for (let upgradeName in upgrades) {
    const upgrade = getGearUpgrade(upgradeName);

    if (upgrade.unlocked && !upgrade.purchased) return true;
  }

  return false;
}
