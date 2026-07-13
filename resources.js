// Add Resource Function
function addResource(resourceName, amount) {
  const resource = getResource(resourceName);

  resource.value += amount;
  if (resource.value >= resource.maxValue) {
    resource.value = resource.maxValue;
  }

  updateResource(resourceName);

  if (typeof updateCraftingButtons === "function") {
    updateCraftingButtons();
  }
}

// Can Afford Cost Function
function canAffordCost(cost) {
  for (let resourceName in cost) {
    const resource = getResource(resourceName);

    if (!resource) {
      console.warn("unknown resource", resourceName);
      return false;
    }

    if (resource.value < cost[resourceName]) {
      return false;
    }
  }
  return true;
}

// Spend Resource Cost Function
function spendCost(cost) {
  if (!canAffordCost(cost)) return false;

  for (let resourceName in cost) {
    getResource(resourceName).value -= cost[resourceName];
    updateResource(resourceName);
  }

  if (typeof updateCraftingButtons === "function") {
    updateCraftingButtons();
  }

  return true;
}
