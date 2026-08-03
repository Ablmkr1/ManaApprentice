const gameDefinitions = {
  resources,
  actions,
  explorationStages,
  expeditionLocations,
  campUpgrades,
  storageUpgrades,
  gearUpgrades,
  expeditionModifiers,
  researchDefinitions,
  resourceCrafts: resourceCrafts,
  goalDefinitions,
  journalDefinitions,
  regionDefinitions,
  consumables,
  clearingPlace,
  spellDefinitions,
  automationDefinitions,
  attunementDefinitions,
};

function getClearingPlace() {
  return gameDefinitions.clearingPlace;
}

function getClearingObjects() {
  return getClearingPlace().explorableObjects;
}

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

function getResearchDefinitions() {
  return gameDefinitions.researchDefinitions;
}

function getResearch(researchName) {
  return getResearchDefinitions()[researchName];
}

function getResourceCraftDefinitions() {
  return gameDefinitions.resourceCrafts;
}

function getResourceCraft(craftName) {
  return getResourceCraftDefinitions()[craftName];
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

function getRegionDefinitions() {
  return gameDefinitions.regionDefinitions;
}

function getRegionDefinition(regionId) {
  return getRegionDefinitions()[regionId];
}

function getConsumable(consumableName) {
  return consumables[consumableName];
}

function getConsumableDefinitions() {
  return consumables;
}

function getSpellDefinitions() {
  return gameDefinitions.spellDefinitions;
}

function getSpell(spellName) {
  return getSpellDefinitions()[spellName];
}

function getAutomationDefinitions() {
  return gameDefinitions.automationDefinitions;
}

function getAutomation(machineName) {
  return getAutomationDefinitions()[machineName];
}

function getAttunementDefinitions() {
  return gameDefinitions.attunementDefinitions;
}

function getAttunementDefinition(attunementName) {
  return getAttunementDefinitions()[attunementName];
}
