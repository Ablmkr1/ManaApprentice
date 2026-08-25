const RESOURCE_AMOUNT_PRECISION = 100;
const RESOURCE_AFFORDABILITY_EPSILON = 0.000001;

function roundResourceAmount(value) {
  if (!Number.isFinite(value)) return 0;

  return Math.round(value * RESOURCE_AMOUNT_PRECISION) / RESOURCE_AMOUNT_PRECISION;
}

function formatResourceAmountForDisplay(value) {
  return Math.floor(roundResourceAmount(value) * 10) / 10;
}

// Add Resource Function
function addResource(resourceName, amount) {
  const resource = getResource(resourceName);

  resource.value = roundResourceAmount(resource.value + amount);
  resource.value = Math.min(resource.value, resource.maxValue);

  updateResource(resourceName);

  if (typeof updateSelectedResearchButtonState === "function") {
    updateSelectedResearchButtonState();
  }

  if (typeof updateCraftingButtons === "function") {
    updateCraftingButtons();
  }
}

// Can Afford Cost Function
function canAffordCost(cost) {
  for (let resourceName in cost) {
    const resource = getResource(resourceName);
    const requiredAmount = roundResourceAmount(cost[resourceName]);

    if (!resource) {
      console.warn("unknown resource", resourceName);
      return false;
    }

    if (roundResourceAmount(resource.value) + RESOURCE_AFFORDABILITY_EPSILON < requiredAmount) {
      return false;
    }
  }
  return true;
}

// Spend Resource Cost Function
function spendCost(cost) {
  if (!canAffordCost(cost)) return false;

  for (let resourceName in cost) {
    const resource = getResource(resourceName);
    const costAmount = roundResourceAmount(cost[resourceName]);

    resource.value = Math.max(0, roundResourceAmount(roundResourceAmount(resource.value) - costAmount));
    updateResource(resourceName);

    if (resourceName === "energy" && typeof recordReinforcedEnergySpent === "function") {
      recordReinforcedEnergySpent(costAmount);
    }

    if (resourceName === "mana" && typeof recordManaCyclingManaSpent === "function") {
      recordManaCyclingManaSpent(costAmount);
    }
  }

  if (typeof updateSelectedResearchButtonState === "function") {
    updateSelectedResearchButtonState();
  }

  if (typeof updateCraftingButtons === "function") {
    updateCraftingButtons();
  }

  return true;
}

function refundCost(cost) {
  for (let resourceName in cost) {
    addResource(resourceName, cost[resourceName]);
  }
}
