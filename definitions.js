const gameDefinitions = {
  resources,
  actions,
  explorationStages,
  expeditionLocations,
  campUpgrades,
  storageUpgrades,
  gearUpgrades,
  expeditionModifiers,
  recipes,
  resourceCrafts: resourceCrafts,
  researchDefinitions,
  goalDefinitions,
  journalDefinitions,
<<<<<<< HEAD
  regionDefinitions,
=======
>>>>>>> 86ac9513542bd256aa795f218e5db58adf7168cf
};

function getExpeditionLocationDefinitions() {
  return gameDefinitions.expeditionLocations;
}

function getExpeditionLocation(locationName) {
  return getExpeditionLocationDefinitions()[locationName];
}

function getResourceDefinitions() {
  return gameDefinitions.resources;
}

function getResource(resourceName) {
  return getResourceDefinitions()[resourceName];
}
function getActionDefinitions() {
  return gameDefinitions.actions;
}

function getAction(actionName) {
  return getActionDefinitions()[actionName];
}

function getExplorationStageDefinitions() {
  return gameDefinitions.explorationStages;
}

function getExplorationStage(stageName) {
  return getExplorationStageDefinitions()[stageName];
}

function getCampUpgradeDefinitions() {
  return gameDefinitions.campUpgrades;
}

function getCampUpgrade(upgradeName) {
  return getCampUpgradeDefinitions()[upgradeName];
}

function getStorageUpgradeDefinitions() {
  return gameDefinitions.storageUpgrades;
}

function getStorageUpgrade(upgradeName) {
  return getStorageUpgradeDefinitions()[upgradeName];
}

function getGearUpgradeDefinitions() {
  return gameDefinitions.gearUpgrades;
}

function getGearUpgrade(upgradeName) {
  return getGearUpgradeDefinitions()[upgradeName];
}

function getExpeditionModifierDefinitions() {
  return gameDefinitions.expeditionModifiers;
}

function getExpeditionModifier(modifierName) {
  return getExpeditionModifierDefinitions()[modifierName];
}

function getRecipeDefinitions() {
  return gameDefinitions.recipes;
}

function getRecipe(recipeName) {
  return getRecipeDefinitions()[recipeName];
}

function getResourceCraftDefinitions() {
  return gameDefinitions.resourceCrafts;
}

function getResourceCraft(craftName) {
  return getResourceCraftDefinitions()[craftName];
}

function getResearchDefinitions() {
  return gameDefinitions.researchDefinitions;
}

function getResearch(researchName) {
  return getResearchDefinitions()[researchName];
}

function getGoalDefinitions() {
  return gameDefinitions.goalDefinitions;
}

function getGoal(goalId) {
  return getGoalDefinitions()[goalId];
}

function getJournalDefinitions() {
  return gameDefinitions.journalDefinitions;
}

function getJournalEntryDefinition(entryId) {
  return getJournalDefinitions()[entryId];
}
<<<<<<< HEAD

function getRegionDefinitions() {
  return gameDefinitions.regionDefinitions;
}

function getRegionDefinition(regionId) {
  return getRegionDefinitions()[regionId];
}
=======
>>>>>>> 86ac9513542bd256aa795f218e5db58adf7168cf
