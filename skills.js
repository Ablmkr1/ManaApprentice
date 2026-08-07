const HUMAN_ENERGY_CAP = 100;
const BASE_TOOL_GATHER_YIELDS = {
  food: 1,
  wood: 1,
  fiber: 1,
};

function getDefaultSkillState(skillName) {
  if (skillName === "conditioning") {
    return {
      rank: 0,
      distance: 0,
      pending: false,
      revealed: false,
    };
  }

  if (skillName === "concentration") {
    return {
      rank: 0,
      deepThought: 0,
      revealed: false,
    };
  }

  return {
    rank: 0,
    successfulCycles: 0,
    revealed: false,
  };
}

function ensureSkillsState() {
  if (!gameState.skills || typeof gameState.skills !== "object" || Array.isArray(gameState.skills)) {
    gameState.skills = {};
  }

  const definitions = getSkillDefinitions();

  for (let skillName in definitions) {
    const defaults = getDefaultSkillState(skillName);
    const saved = gameState.skills[skillName];

    if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
      gameState.skills[skillName] = defaults;
      continue;
    }

    for (let fieldName in defaults) {
      if (!Object.prototype.hasOwnProperty.call(saved, fieldName)) {
        saved[fieldName] = defaults[fieldName];
      }
    }
  }
}

function getSkillState(skillName) {
  ensureSkillsState();
  return gameState.skills[skillName];
}

function getSkillRankDefinition(skillName, rank) {
  const definition = getSkillDefinition(skillName);

  if (!definition || !Array.isArray(definition.ranks)) return null;

  return definition.ranks[Math.max(0, Math.min(rank, definition.ranks.length - 1))] || null;
}

function getSkillProgressValue(skillName) {
  const skill = getSkillState(skillName);

  if (skillName === "conditioning") return skill.distance || 0;
  if (skillName === "concentration") return skill.deepThought || 0;

  return skill.successfulCycles || 0;
}

function getSkillRankFromProgress(skillName, progress) {
  const definition = getSkillDefinition(skillName);
  let rank = 0;

  if (!definition || !Array.isArray(definition.ranks)) return rank;

  for (let i = 0; i < definition.ranks.length; i++) {
    if (progress >= definition.ranks[i].threshold) {
      rank = definition.ranks[i].rank;
    }
  }

  return rank;
}

function getSkillRankFromCapacity(skillName, capacity) {
  const definition = getSkillDefinition(skillName);
  let rank = 0;

  if (!definition || !Array.isArray(definition.ranks)) return rank;

  for (let i = 0; i < definition.ranks.length; i++) {
    if (capacity >= definition.ranks[i].capacity) {
      rank = definition.ranks[i].rank;
    }
  }

  return rank;
}

function getSkillThresholdForRank(skillName, rank) {
  const rankDefinition = getSkillRankDefinition(skillName, rank);

  return rankDefinition ? rankDefinition.threshold : 0;
}

function revealSkill(skillName, story) {
  const skill = getSkillState(skillName);

  if (!skill || skill.revealed) return;

  skill.revealed = true;

  if (story) {
    addStoryEntry(story);
  }

  updateTrainingUI();
}

function recordPhysicalTravelDistance(distance) {
  if (!Number.isFinite(distance) || distance <= 0) return;

  const skill = getSkillState("conditioning");
  const definition = getSkillDefinition("conditioning");

  skill.distance = Math.round(((skill.distance || 0) + distance) * 10) / 10;

  if (!skill.revealed && skill.distance >= definition.revealAt) {
    revealSkill("conditioning", "Your legs ache, but each trip feels slightly less punishing than the last.");
  }

  if (getSkillRankFromProgress("conditioning", skill.distance) > skill.rank) {
    skill.pending = true;
  }

  updateTrainingUI();
}

function applyPendingConditioningAtCamp() {
  const skill = getSkillState("conditioning");
  const newRank = getSkillRankFromProgress("conditioning", skill.distance || 0);

  if (newRank > skill.rank) {
    skill.rank = newRank;
    skill.pending = false;
    revealSkill("conditioning");
    addStoryEntry("The long miles are changing you. Your breathing settles faster, and the strain that once stopped you now feels manageable.");
    recalculateCharacterStats();
    updateTrainingUI();
    return;
  }

  skill.pending = false;
  updateTrainingUI();
}

function recordDeepThought(amount, sourceLabel) {
  if (!Number.isFinite(amount) || amount <= 0) return;

  const skill = getSkillState("concentration");
  const definition = getSkillDefinition("concentration");
  const oldRank = skill.rank;

  skill.deepThought = (skill.deepThought || 0) + amount;

  if (!skill.revealed && skill.deepThought >= definition.revealAt) {
    revealSkill("concentration", "Holding complex ideas in your mind is becoming easier. Your thoughts no longer scatter as quickly.");
  }

  skill.rank = getSkillRankFromProgress("concentration", skill.deepThought);

  if (skill.rank > oldRank) {
    const label = sourceLabel ? " after " + sourceLabel : "";
    addStoryEntry("You hold the whole problem in your mind" + label + ". Complex thoughts are becoming easier to sustain.");
    recalculateCharacterStats();
  }

  updateTrainingUI();
}

function recordManaCycle() {
  const skill = getSkillState("manaCycling");
  const oldRank = skill.rank;

  skill.successfulCycles = (skill.successfulCycles || 0) + 1;
  skill.revealed = true;
  skill.rank = getSkillRankFromProgress("manaCycling", skill.successfulCycles);

  if (skill.rank > oldRank) {
    addStoryEntry("The cycle settles wider than before. More mana can move through you without breaking your control.");
    recalculateCharacterStats();
  }

  updateTrainingUI();
}

function isCampEstablishedForStats() {
  if (gameState.hasCamp || gameState.phase === "expedition") return true;

  if (typeof hasPurchasedCampUpgrade === "function") {
    return hasPurchasedCampUpgrade("smallFire") && hasPurchasedCampUpgrade("crudeLeanTo");
  }

  return false;
}

function getSurvivalEnergyMax() {
  let maxEnergy = 10;

  if (gameState.discoveredStream) maxEnergy = 20;
  if (gameState.discoveredBerryBush) maxEnergy = 30;
  if (isCampEstablishedForStats()) maxEnergy = 40;

  return maxEnergy;
}

function getSkillCapacity(skillName) {
  const skill = getSkillState(skillName);
  const rankDefinition = getSkillRankDefinition(skillName, skill.rank || 0);

  return rankDefinition ? rankDefinition.capacity : 0;
}

function setResourceMaxValue(resourceName, maxValue) {
  const resource = getResource(resourceName);

  if (!resource) return;

  resource.maxValue = maxValue;

  if (resource.value > resource.maxValue) {
    resource.value = resource.maxValue;
  }

  updateResource(resourceName);
}

function recalculateCharacterStats() {
  ensureSkillsState();

  let energyMax = getSurvivalEnergyMax();

  if (isCampEstablishedForStats()) {
    energyMax = Math.max(energyMax, getSkillCapacity("conditioning"));
  }

  setResourceMaxValue("energy", Math.min(energyMax, HUMAN_ENERGY_CAP));
  setResourceMaxValue("focus", getSkillCapacity("concentration"));
  setResourceMaxValue("mana", getSkillCapacity("manaCycling"));
  updateTrainingUI();
}

function getEnergyRecoveryPerSecond() {
  if (typeof hasPurchasedCampUpgrade === "function") {
    if (hasPurchasedCampUpgrade("smallHut")) return 12;
    if (hasPurchasedCampUpgrade("framedShelter")) return 8;
    if (hasPurchasedCampUpgrade("lessCrudeShelter")) return 4;
    if (hasPurchasedCampUpgrade("crudeLeanTo")) return 2;
  }

  return 1;
}

function recalculateCampEffects() {
  const energy = getResource("energy");

  if (energy) {
    energy.restPerSecond = getEnergyRecoveryPerSecond();
    updateResource("energy");
  }
}

function getFireFocusRecoveryAmount() {
  if (typeof hasPurchasedCampUpgrade === "function") {
    if (hasPurchasedCampUpgrade("stoneFirePit")) return 2;
    if (hasPurchasedCampUpgrade("smallFire")) return 1;
  }

  return 0;
}

function getRecoverEnergyCost() {
  if (typeof hasPurchasedCampUpgrade === "function") {
    if (hasPurchasedCampUpgrade("warmCot")) return 2;
    if (hasPurchasedCampUpgrade("uncomfortableCot")) return 4;
  }

  return 5;
}

function getRecoverDuration() {
  if (typeof hasPurchasedCampUpgrade === "function") {
    if (hasPurchasedCampUpgrade("warmCot")) return 1.5;
    if (hasPurchasedCampUpgrade("uncomfortableCot")) return 2.5;
  }

  return 3;
}

function getManaCyclingCost() {
  return {
    energy: 10,
    focus: 1,
    mana: Math.ceil(getResource("mana").maxValue * 0.5),
  };
}

function getEquipmentEffectValue(equipmentType, slotName, effectName, fallback = 0) {
  if (typeof getPurchasedEquipmentForSlot !== "function") return fallback;

  const equipment = getPurchasedEquipmentForSlot(equipmentType, slotName);
  const effects = equipment ? equipment.effects || {} : {};

  if (Object.prototype.hasOwnProperty.call(effects, effectName)) {
    return effects[effectName];
  }

  return fallback;
}

function getToolEffectValue(slotName, effectName, fallback = 0) {
  return getEquipmentEffectValue("tool", slotName, effectName, fallback);
}

function getForageYieldBonus() {
  return getToolEffectValue("forage", "forageYieldFlat", 0);
}

function getCuttingYieldBonus() {
  return getToolEffectValue("knife", "cuttingYieldFlat", 0);
}

function getHuntingToolRewardBonus() {
  return getToolEffectValue("knife", "huntRewardFlat", 0);
}

function getChoppingYieldBonus() {
  return getToolEffectValue("axe", "choppingYieldFlat", 0);
}

function getMiningYieldBase() {
  return getToolEffectValue("pick", "miningYieldBase", 2);
}

function getGatherResourceYield(resourceName) {
  if (resourceName === "food") return BASE_TOOL_GATHER_YIELDS.food + getForageYieldBonus();
  if (resourceName === "wood") return BASE_TOOL_GATHER_YIELDS.wood + getChoppingYieldBonus();
  if (resourceName === "fiber") return BASE_TOOL_GATHER_YIELDS.fiber + getCuttingYieldBonus();

  return 1;
}

function getHerbGatherBonus() {
  return getForageYieldBonus();
}

function getHuntRewardAmount(baseAmount) {
  return baseAmount + getHuntingToolRewardBonus() + getActiveAttunementEffectTotal("huntRewardFlat");
}

function getMineOreAmount() {
  return getMiningYieldBase() + getActiveAttunementEffectTotal("mineOreFlat");
}

function recalculateToolEffects() {
  for (let resourceName in BASE_TOOL_GATHER_YIELDS) {
    const resource = getResource(resourceName);

    if (!resource) continue;

    resource.perClick = getGatherResourceYield(resourceName);

    if (resource.display) {
      updateResource(resourceName);
    }
  }
}

function getExplorationEnergyReduction() {
  return getEquipmentEffectValue("gear", "chest", "explorationEnergyReduction", 0);
}

function reduceEnergyCost(cost, reduction) {
  const adjusted = { ...(cost || {}) };

  if (adjusted.energy && reduction > 0) {
    adjusted.energy = Math.max(1, adjusted.energy - reduction);
  }

  return adjusted;
}

function getActionCost(actionName) {
  const action = getAction(actionName);

  if (!action) return {};

  if (actionName === "recover") {
    return {
      energy: getRecoverEnergyCost(),
      food: 1,
    };
  }

  if (actionName === "practiceManaCycling") {
    return getManaCyclingCost();
  }

  if (actionName === "explore" || actionName === "exploreLocation") {
    return reduceEnergyCost(action.cost || {}, getExplorationEnergyReduction());
  }

  return { ...(action.cost || {}) };
}

function getActionDuration(actionName) {
  const action = getAction(actionName);

  if (!action) return 0;

  if (actionName === "recover") return getRecoverDuration();
  if (actionName === "practiceManaCycling") return 5;

  return action.duration || 0;
}

function getResearchCost(researchName) {
  const research = getResearch(researchName);
  const cost = { ...((research && research.cost) || {}) };

  if (typeof hasPurchasedCampUpgrade === "function" && hasPurchasedCampUpgrade("researchBench") && cost.focus) {
    cost.focus = Math.max(1, cost.focus - 1);
  }

  return cost;
}

function getResearchDuration(researchName) {
  const research = getResearch(researchName);
  let duration = research ? research.duration || 1 : 1;

  if (typeof hasPurchasedCampUpgrade === "function" && hasPurchasedCampUpgrade("researchBench")) {
    duration *= 0.75;
  }

  return duration;
}

function getLocationObjectCost(object) {
  return reduceEnergyCost((object && object.cost) || {}, getExplorationEnergyReduction());
}

function getTravelEnergyMultiplier() {
  return getEquipmentEffectValue("gear", "legs", "travelEnergyMultiplier", 1);
}

function formatTrainingNumber(value) {
  if (Math.abs(value - Math.round(value)) < 0.01) {
    return String(Math.round(value));
  }

  return String(Math.round(value * 10) / 10);
}

function createTrainingEntry(skillName) {
  const definition = getSkillDefinition(skillName);
  const skill = getSkillState(skillName);
  const rankDefinition = getSkillRankDefinition(skillName, skill.rank || 0);
  const nextRankDefinition = getSkillRankDefinition(skillName, (skill.rank || 0) + 1);
  const progressValue = getSkillProgressValue(skillName);

  const entry = document.createElement("div");
  entry.className = "training-entry";

  const header = document.createElement("div");
  header.className = "training-entry-header";

  const title = document.createElement("strong");
  title.textContent = definition.label + " - Rank " + skill.rank;

  const capacity = document.createElement("span");
  capacity.textContent = definition.capacityLabel + " " + rankDefinition.capacity;

  header.appendChild(title);
  header.appendChild(capacity);
  entry.appendChild(header);

  const progressText = document.createElement("div");
  progressText.className = "training-progress-text";

  if (nextRankDefinition) {
    progressText.textContent =
      definition.progressLabel + ": " + formatTrainingNumber(progressValue) + " / " + formatTrainingNumber(nextRankDefinition.threshold);
  } else {
    progressText.textContent = definition.progressLabel + ": complete";
  }

  entry.appendChild(progressText);

  const progressTrack = document.createElement("div");
  progressTrack.className = "training-progress-track";

  const progressFill = document.createElement("div");
  progressFill.className = "training-progress-fill";

  if (nextRankDefinition) {
    const currentThreshold = rankDefinition.threshold || 0;
    const required = nextRankDefinition.threshold - currentThreshold;
    const current = Math.max(0, progressValue - currentThreshold);
    progressFill.style.width = Math.min(Math.max(current / required, 0), 1) * 100 + "%";
  } else {
    progressFill.style.width = "100%";
  }

  progressTrack.appendChild(progressFill);
  entry.appendChild(progressTrack);

  const detail = document.createElement("div");
  detail.className = "training-detail";

  if (skillName === "conditioning" && skill.pending) {
    detail.textContent = "Pending rank-up when you return to camp.";
  } else if (nextRankDefinition) {
    detail.textContent = "Next: " + definition.capacityLabel + " " + nextRankDefinition.capacity;
  } else {
    detail.textContent = "Fully developed for now.";
  }

  entry.appendChild(detail);

  return entry;
}

function updateTrainingUI() {
  ensureSkillsState();

  if (!ui.trainingSection || !ui.trainingList) return;

  const skillNames = ["conditioning", "concentration", "manaCycling"];
  const visibleSkills = skillNames.filter(function (skillName) {
    return getSkillState(skillName).revealed;
  });

  if (visibleSkills.length === 0) {
    hideElement(ui.trainingSection);
    return;
  }

  showElement(ui.trainingSection, "flex");
  ui.trainingList.innerHTML = "";

  visibleSkills.forEach(function (skillName) {
    ui.trainingList.appendChild(createTrainingEntry(skillName));
  });
}
