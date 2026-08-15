const HUMAN_ENERGY_CAP = 100;
const BASE_TOOL_GATHER_YIELDS = {
  food: 1,
  wood: 1,
  fiber: 1,
};
const DEFAULT_SKILL_RANK = 1;
const RANK_TWO_SKILL_RANK = 2;
const CONDITIONING_RANK_TWO_UNLOCK_ENERGY = 100;
const MANA_CYCLING_MANA_PER_PROGRESS = 5;

function isManaControlSystemEnabled() {
  return typeof MANA_CONTROL_SYSTEM_ENABLED === "undefined" || MANA_CONTROL_SYSTEM_ENABLED;
}

function getDefaultSkillState(skillName) {
  const defaults = {
    rank: DEFAULT_SKILL_RANK,
    level: 0,
    revealed: false,
  };

  if (skillName === "conditioning") {
    return {
      ...defaults,
      distance: 0,
      reinforcedEnergyUnlockSpent: 0,
      reinforcedEnergySpent: 0,
      pending: false,
    };
  }

  if (skillName === "concentration") {
    return {
      ...defaults,
      deepThought: 0,
    };
  }

  if (skillName === "manaCycling") {
    return {
      ...defaults,
      successfulCycles: 0,
      deepCycles: 0,
    };
  }

  if (skillName === "meditation") {
    return {
      ...defaults,
      successfulMeditations: 0,
      attunedMeditations: 0,
    };
  }

  if (skillName === "manaControl") {
    return {
      ...defaults,
      manaSpent: 0,
    };
  }

  return defaults;
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

    saved.rank = normalizeSkillRank(skillName, saved.rank);
    saved.level = normalizeSkillLevel(skillName, saved.level, saved.rank);
  }
}

function getSkillState(skillName) {
  ensureSkillsState();
  return gameState.skills[skillName];
}

function getDefaultSkillRank(definition) {
  if (definition && Array.isArray(definition.ranks) && definition.ranks.length > 0) {
    return Number.isFinite(definition.ranks[0].rank) ? definition.ranks[0].rank : DEFAULT_SKILL_RANK;
  }

  return DEFAULT_SKILL_RANK;
}

function getSkillRankDefinition(skillName, rank = DEFAULT_SKILL_RANK) {
  const definition = getSkillDefinition(skillName);

  if (!definition || !Array.isArray(definition.ranks)) return null;

  return (
    definition.ranks.find(function (rankDefinition) {
      return rankDefinition.rank === rank;
    }) ||
    definition.ranks[0] ||
    null
  );
}

function hasSkillRankDefinition(skillName, rank) {
  const definition = getSkillDefinition(skillName);

  if (!definition || !Array.isArray(definition.ranks)) return false;

  return definition.ranks.some(function (rankDefinition) {
    return rankDefinition.rank === rank;
  });
}

function normalizeSkillRank(skillName, rank) {
  const definition = getSkillDefinition(skillName);
  const defaultRank = getDefaultSkillRank(definition);
  const normalizedRank = Number.isFinite(rank) ? Math.max(1, Math.floor(rank)) : defaultRank;

  return hasSkillRankDefinition(skillName, normalizedRank) ? normalizedRank : defaultRank;
}

function getSkillLevelDefinitions(skillName, rank = DEFAULT_SKILL_RANK) {
  const rankDefinition = getSkillRankDefinition(skillName, rank);

  return rankDefinition && Array.isArray(rankDefinition.levels) ? rankDefinition.levels : [];
}

function normalizeSkillLevel(skillName, level, rank = DEFAULT_SKILL_RANK) {
  const levels = getSkillLevelDefinitions(skillName, rank);
  const normalizedLevel = Number.isFinite(level) ? Math.max(0, Math.floor(level)) : 0;

  if (levels.length === 0) return normalizedLevel;

  const maxLevel = levels.reduce(function (highest, levelDefinition) {
    return Math.max(highest, Number.isFinite(levelDefinition.level) ? levelDefinition.level : 0);
  }, 0);

  return Math.min(normalizedLevel, maxLevel);
}

function getSkillLevelDefinition(skillName, level, rank = DEFAULT_SKILL_RANK) {
  const normalizedRank = normalizeSkillRank(skillName, rank);
  const normalizedLevel = normalizeSkillLevel(skillName, level, normalizedRank);
  const levels = getSkillLevelDefinitions(skillName, normalizedRank);

  return (
    levels.find(function (levelDefinition) {
      return levelDefinition.level === normalizedLevel;
    }) ||
    levels[0] ||
    null
  );
}

function getSkillProgressValue(skillName) {
  const skill = getSkillState(skillName);

  if (skill.rank === RANK_TWO_SKILL_RANK) {
    if (skillName === "conditioning") return skill.reinforcedEnergySpent || 0;
    if (skillName === "manaCycling") return skill.deepCycles || 0;
    if (skillName === "meditation") return skill.attunedMeditations || 0;
  }

  if (skillName === "conditioning") return skill.distance || 0;
  if (skillName === "concentration") return skill.deepThought || 0;
  if (skillName === "manaCycling") return skill.successfulCycles || 0;
  if (skillName === "meditation") return skill.successfulMeditations || 0;
  if (skillName === "manaControl") return skill.manaSpent || 0;

  return 0;
}

function getSkillLevelFromProgress(skillName, progress, rank = DEFAULT_SKILL_RANK) {
  const normalizedRank = normalizeSkillRank(skillName, rank);
  const levels = getSkillLevelDefinitions(skillName, normalizedRank);
  let level = 0;

  if (levels.length === 0) return level;

  for (let i = 0; i < levels.length; i++) {
    if (progress >= levels[i].threshold) {
      level = levels[i].level;
    }
  }

  return normalizeSkillLevel(skillName, level, normalizedRank);
}

function getSkillLevelFromCapacity(skillName, capacity, rank = DEFAULT_SKILL_RANK) {
  const normalizedRank = normalizeSkillRank(skillName, rank);
  const levels = getSkillLevelDefinitions(skillName, normalizedRank);
  let level = 0;

  if (levels.length === 0) return level;

  for (let i = 0; i < levels.length; i++) {
    if (capacity >= levels[i].capacity) {
      level = levels[i].level;
    }
  }

  return normalizeSkillLevel(skillName, level, normalizedRank);
}

function getSkillThresholdForLevel(skillName, level, rank = DEFAULT_SKILL_RANK) {
  const levelDefinition = getSkillLevelDefinition(skillName, level, rank);

  return levelDefinition ? levelDefinition.threshold : 0;
}

function getSkillMaxLevel(skillName, rank = DEFAULT_SKILL_RANK) {
  const levels = getSkillLevelDefinitions(skillName, rank);

  return levels.reduce(function (maxLevel, levelDefinition) {
    return Math.max(maxLevel, Number.isFinite(levelDefinition.level) ? levelDefinition.level : 0);
  }, 0);
}

function isSkillAtRankLevel(skillName, rank, level) {
  const skill = getSkillState(skillName);

  return !!skill && skill.rank === rank && skill.level >= level;
}

function isSkillRankMax(skillName, rank = DEFAULT_SKILL_RANK) {
  return isSkillAtRankLevel(skillName, rank, getSkillMaxLevel(skillName, rank));
}

function isHeartRestoredForRankTwoSkills() {
  if (gameState.towerConstructionUnlocked) return true;

  if (typeof getProjectState === "function") {
    const foundation = getProjectState("towerFoundation");
    return !!foundation && !!foundation.completed;
  }

  return false;
}

function getRankTwoPromotionStory(skillName) {
  if (skillName === "meditation") {
    return "The attuned meditation spot steadies around the restored Heart. Meditation opens into a deeper rhythm.";
  }

  if (skillName === "manaCycling") {
    return "The restored Heart gives your inner cycle a deeper path. Mana can move through you in a wider current.";
  }

  if (skillName === "conditioning") {
    return "Reinforced mana starts moving with your body instead of against it. Your warded strength can grow past its first shape.";
  }

  return "";
}

function getSkillRankNumeral(rank) {
  if (rank === 1) return "I";
  if (rank === 2) return "II";
  if (rank === 3) return "III";

  return String(rank);
}

function getSkillRankLabel(rank) {
  return "Rank " + getSkillRankNumeral(rank);
}

function promoteSkillToRank(skillName, rank = RANK_TWO_SKILL_RANK, story) {
  const skill = getSkillState(skillName);

  if (!skill || skill.rank >= rank) return false;
  if (!hasSkillRankDefinition(skillName, rank)) return false;

  skill.rank = rank;
  skill.level = 0;
  skill.revealed = true;

  if (skillName === "conditioning") {
    skill.pending = false;
  }

  const storyText = story !== undefined ? story : getRankTwoPromotionStory(skillName);

  if (storyText) {
    addStoryEntry(storyText);
  }

  recalculateCharacterStats();
  updateTrainingUI();
  return true;
}

function hasAttunedMeditationSpot() {
  return typeof hasPurchasedCampUpgrade === "function" && hasPurchasedCampUpgrade("attunedMeditationSpot");
}

function checkRank2SkillUnlocks() {
  ensureSkillsState();

  if (!isHeartRestoredForRankTwoSkills()) return;

  if (isSkillRankMax("manaCycling", DEFAULT_SKILL_RANK)) {
    promoteSkillToRank("manaCycling", RANK_TWO_SKILL_RANK);
  }

  if (hasAttunedMeditationSpot() && isSkillRankMax("meditation", DEFAULT_SKILL_RANK)) {
    promoteSkillToRank("meditation", RANK_TWO_SKILL_RANK);
  }

  const conditioning = getSkillState("conditioning");

  if (
    conditioning &&
    conditioning.rank === DEFAULT_SKILL_RANK &&
    isSkillRankMax("conditioning", DEFAULT_SKILL_RANK) &&
    (conditioning.reinforcedEnergyUnlockSpent || 0) >= CONDITIONING_RANK_TWO_UNLOCK_ENERGY
  ) {
    promoteSkillToRank("conditioning", RANK_TWO_SKILL_RANK);
  }
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

  if (skill.rank === DEFAULT_SKILL_RANK && getSkillLevelFromProgress("conditioning", skill.distance, DEFAULT_SKILL_RANK) > skill.level) {
    skill.pending = true;
  }

  updateTrainingUI();
}

function applyPendingConditioningAtCamp() {
  const skill = getSkillState("conditioning");

  if (skill.rank !== DEFAULT_SKILL_RANK) {
    skill.pending = false;
    updateTrainingUI();
    checkRank2SkillUnlocks();
    return;
  }

  const newLevel = getSkillLevelFromProgress("conditioning", skill.distance || 0, DEFAULT_SKILL_RANK);

  if (newLevel > skill.level) {
    skill.level = newLevel;
    skill.pending = false;
    revealSkill("conditioning");
    addStoryEntry("The long miles are changing you. Your breathing settles faster, and the strain that once stopped you now feels manageable.");
    recalculateCharacterStats();
    updateTrainingUI();
    checkRank2SkillUnlocks();
    if (typeof checkResearchDiscoveries === "function") {
      checkResearchDiscoveries();
    }
    return;
  }

  skill.pending = false;
  updateTrainingUI();
  checkRank2SkillUnlocks();
}

function recordDeepThought(amount, sourceLabel) {
  if (!Number.isFinite(amount) || amount <= 0) return;

  const skill = getSkillState("concentration");
  const definition = getSkillDefinition("concentration");
  const oldLevel = skill.level;

  skill.deepThought = (skill.deepThought || 0) + amount;

  if (!skill.revealed && skill.deepThought >= definition.revealAt) {
    revealSkill("concentration", "Holding complex ideas in your mind is becoming easier. Your thoughts no longer scatter as quickly.");
  }

  skill.level = getSkillLevelFromProgress("concentration", skill.deepThought, skill.rank);

  if (skill.level > oldLevel) {
    const label = sourceLabel ? " after " + sourceLabel : "";
    addStoryEntry("You hold the whole problem in your mind" + label + ". Complex thoughts are becoming easier to sustain.");
    recalculateCharacterStats();
  }

  updateTrainingUI();
}

function getManaCyclingAvailableMana() {
  const mana = getResource("mana");

  return mana ? Math.max(0, roundResourceAmount(mana.value || 0)) : 0;
}

function getManaCyclingProgressFromMana(manaSpent) {
  const normalizedManaSpent = Number.isFinite(manaSpent) ? Math.max(0, manaSpent) : MANA_CYCLING_MANA_PER_PROGRESS;

  return roundResourceAmount(normalizedManaSpent / MANA_CYCLING_MANA_PER_PROGRESS);
}

function canPracticeManaCycling() {
  return getManaCyclingAvailableMana() > 0;
}

function recordManaCycle(manaSpent) {
  checkRank2SkillUnlocks();

  const skill = getSkillState("manaCycling");
  const oldLevel = skill.level;
  const progressField = skill.rank === RANK_TWO_SKILL_RANK ? "deepCycles" : "successfulCycles";
  const progressGain = getManaCyclingProgressFromMana(manaSpent);

  if (progressGain <= 0) {
    updateTrainingUI();
    return;
  }

  skill[progressField] = roundResourceAmount((skill[progressField] || 0) + progressGain);
  skill.revealed = true;
  skill.level = getSkillLevelFromProgress("manaCycling", skill[progressField], skill.rank);

  if (skill.level > oldLevel) {
    const story =
      skill.rank === RANK_TWO_SKILL_RANK
        ? "The deep cycle opens wider. The restored Heart gives your mana more room to move."
        : "The cycle settles wider than before. More mana can move through you without breaking your control.";

    addStoryEntry(story);
    recalculateCharacterStats();
  }

  updateTrainingUI();
  checkRank2SkillUnlocks();
}

function recordMeditation() {
  const skill = getSkillState("meditation");
  const oldLevel = skill.level;
  const progressField = skill.rank === RANK_TWO_SKILL_RANK ? "attunedMeditations" : "successfulMeditations";

  skill[progressField] = (skill[progressField] || 0) + 1;
  skill.revealed = true;
  skill.level = getSkillLevelFromProgress("meditation", skill[progressField], skill.rank);

  if (skill.level > oldLevel) {
    const story =
      skill.rank === RANK_TWO_SKILL_RANK
        ? "The attuned quiet deepens. More mana returns before the rhythm breaks."
        : "The quiet settles faster now. You find the meditative rhythm with less strain and less wasted motion.";

    addStoryEntry(story);
  }

  updateTrainingUI();
  if (typeof checkResearchDiscoveries === "function") {
    checkResearchDiscoveries();
  }
}

function recordReinforcedEnergySpent(amount) {
  if (!Number.isFinite(amount) || amount <= 0) return;
  if (!isHeartRestoredForRankTwoSkills()) return;
  if (typeof hasActiveAttunement !== "function" || !hasActiveAttunement("reinforcedBody")) return;

  const skill = getSkillState("conditioning");

  if (!skill) return;

  if (skill.rank === DEFAULT_SKILL_RANK) {
    if (!isSkillRankMax("conditioning", DEFAULT_SKILL_RANK)) return;

    const previous = skill.reinforcedEnergyUnlockSpent || 0;
    const remaining = Math.max(0, CONDITIONING_RANK_TWO_UNLOCK_ENERGY - previous);
    const appliedToUnlock = Math.min(amount, remaining);
    const overflow = Math.max(0, amount - appliedToUnlock);

    skill.reinforcedEnergyUnlockSpent = roundResourceAmount(previous + appliedToUnlock);

    if (skill.reinforcedEnergyUnlockSpent >= CONDITIONING_RANK_TWO_UNLOCK_ENERGY) {
      promoteSkillToRank("conditioning", RANK_TWO_SKILL_RANK);

      if (overflow > 0) {
        recordReinforcedEnergySpent(overflow);
      }
    }

    updateTrainingUI();
    return;
  }

  if (skill.rank !== RANK_TWO_SKILL_RANK) return;

  const oldLevel = skill.level;

  skill.reinforcedEnergySpent = roundResourceAmount((skill.reinforcedEnergySpent || 0) + amount);
  skill.revealed = true;
  skill.level = getSkillLevelFromProgress("conditioning", skill.reinforcedEnergySpent, skill.rank);

  if (skill.level > oldLevel) {
    addStoryEntry("Mana reinforcement settles deeper into your movement. Reinforced Body can hold more strength.");
    recalculateCharacterStats();
  }

  updateTrainingUI();
}

function recordManaControl(amount, sourceLabel) {
  if (!isManaControlSystemEnabled()) return;
  if (!Number.isFinite(amount) || amount <= 0) return;

  const skill = getSkillState("manaControl");
  const oldLevel = skill.level;

  skill.manaSpent = roundResourceAmount((skill.manaSpent || 0) + amount);

  if (!skill.revealed) {
    revealSkill("manaControl", "The spell leaves a shape behind in your hands. Mana is becoming something you can steer, not just spend.");
  }

  skill.level = getSkillLevelFromProgress("manaControl", skill.manaSpent, skill.rank);

  if (skill.level > oldLevel) {
    const label = sourceLabel ? " after " + sourceLabel : "";
    addStoryEntry("Your spellwork steadies" + label + ". " + getManaControlRewardText(skill.level) + ".");
    syncSpellUpgradeEffects();
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
  const levelDefinition = getSkillLevelDefinition(skillName, skill.level || 0, skill.rank || DEFAULT_SKILL_RANK);

  return levelDefinition ? levelDefinition.capacity : 0;
}

function getMeditationSpeedBonusPercent() {
  return getSkillCapacity("meditation");
}

function getMeditationDurationMultiplier() {
  return Math.max(0.1, 1 - getMeditationSpeedBonusPercent() / 100);
}

function getCurrentSkillLevelDefinition(skillName) {
  const skill = getSkillState(skillName);

  return skill ? getSkillLevelDefinition(skillName, skill.level || 0, skill.rank || DEFAULT_SKILL_RANK) : null;
}

function getMeditationManaRestoreAmount() {
  const levelDefinition = getCurrentSkillLevelDefinition("meditation");

  return levelDefinition && Number.isFinite(levelDefinition.manaRestore) ? levelDefinition.manaRestore : 1;
}

function getMeditationManaRestoreForLevel(levelDefinition) {
  return levelDefinition && Number.isFinite(levelDefinition.manaRestore) ? levelDefinition.manaRestore : 1;
}

function getMeditationBaseEnergyCost() {
  const action = getAction("meditate");

  return action && action.cost && Number.isFinite(action.cost.energy) ? action.cost.energy : 10;
}

function getMeditationEnergyCostForLevel(levelDefinition, rank) {
  const baseCost = getMeditationBaseEnergyCost();

  if (rank === RANK_TWO_SKILL_RANK && levelDefinition && Number.isFinite(levelDefinition.energyCost)) {
    return Math.max(1, levelDefinition.energyCost);
  }

  return Math.max(1, roundResourceAmount(baseCost - (levelDefinition ? levelDefinition.level || 0 : 0)));
}

function getMeditationEnergyCostAmount() {
  const skill = getSkillState("meditation");
  const levelDefinition = getCurrentSkillLevelDefinition("meditation");

  return getMeditationEnergyCostForLevel(levelDefinition, skill ? skill.rank : DEFAULT_SKILL_RANK);
}

function getMeditationEnergyCostReduction() {
  return Math.max(0, roundResourceAmount(getMeditationBaseEnergyCost() - getMeditationEnergyCostAmount()));
}

function getMeditationCost() {
  const action = getAction("meditate");
  const cost = { ...((action && action.cost) || {}) };

  if (Number.isFinite(cost.energy)) {
    cost.energy = getMeditationEnergyCostAmount();
  }

  return cost;
}

function getManaControlLevel() {
  if (!isManaControlSystemEnabled()) return 0;

  const skill = getSkillState("manaControl");

  return skill ? skill.level || 0 : 0;
}

function getAttunementCapacityFromManaControl() {
  const level = getManaControlLevel();

  if (level >= 2) return 3;
  if (level >= 1) return 2;

  return 1;
}

function getManaSenseDungeonSearchBonus() {
  const spell = getSpell("manaSense");

  return spell && spell.effects ? spell.effects.dungeonSearchBonus || 25 : 25;
}

function syncSpellUpgradeEffects() {
  if (typeof getAttunementState !== "function") return;

  const state = getAttunementState();
  const capacity = typeof getAttunementCapacityFromLevel === "function" ? getAttunementCapacityFromLevel() : getAttunementCapacityFromManaControl();

  state.capacity = capacity;

  if (Array.isArray(state.active) && state.active.length > capacity) {
    state.active = state.active.slice(0, capacity);
  }
}

function getManaControlRewardText(level) {
  if (level >= 3) return "Mana Sense adds 35% search chance per dungeon charge";
  if (level >= 2) return "Attunement capacity 3";
  if (level >= 1) return "Attunement capacity 2";

  return "No spell upgrade yet";
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

function getActiveMaxEnergyAttunementBonus() {
  if (typeof getActiveAttunementEffectTotal !== "function") return 0;

  return getActiveAttunementEffectTotal("maxEnergyFlat");
}

function getReinforcedBodyMaxEnergyBonus() {
  const skill = getSkillState("conditioning");
  const levelDefinition = skill ? getSkillLevelDefinition("conditioning", skill.level || 0, skill.rank || DEFAULT_SKILL_RANK) : null;

  if (skill && skill.rank === RANK_TWO_SKILL_RANK && levelDefinition && Number.isFinite(levelDefinition.reinforcedBodyBonus)) {
    return levelDefinition.reinforcedBodyBonus;
  }

  return 25;
}

function recalculateCharacterStats() {
  ensureSkillsState();

  let energyMax = getSurvivalEnergyMax();

  if (isCampEstablishedForStats()) {
    energyMax = Math.max(energyMax, getSkillCapacity("conditioning"));
  }

  const cappedEnergyMax = Math.min(energyMax, HUMAN_ENERGY_CAP);
  const temporaryEnergyMaxBonus = getActiveMaxEnergyAttunementBonus();

  setResourceMaxValue("energy", roundResourceAmount(cappedEnergyMax + temporaryEnergyMaxBonus));
  setResourceMaxValue("focus", getSkillCapacity("concentration"));
  setResourceMaxValue("mana", getSkillCapacity("manaCycling"));
  syncSpellUpgradeEffects();
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

function getFireRecoveryDurationMultiplier() {
  if (typeof hasPurchasedCampUpgrade === "function") {
    if (hasPurchasedCampUpgrade("stoneFirePit")) return 0.8;
    if (hasPurchasedCampUpgrade("smallFire")) return 0.9;
  }

  return 1;
}

function getRestDuration() {
  return roundResourceAmount(1 * getFireRecoveryDurationMultiplier());
}

function getRecoverFocusAmount() {
  if (typeof hasPurchasedCampUpgrade === "function") {
    if (hasPurchasedCampUpgrade("warmCot")) return 3;
    if (hasPurchasedCampUpgrade("uncomfortableCot")) return 2;
  }

  return 1;
}

function getRecoverEnergyCost() {
  return 5;
}

function getRecoverDuration() {
  return roundResourceAmount(3 * getFireRecoveryDurationMultiplier());
}

function getManaCyclingCost() {
  const skill = getSkillState("manaCycling");

  return {
    energy: 10,
    focus: skill && skill.rank === RANK_TWO_SKILL_RANK ? 3 : 1,
    mana: getManaCyclingAvailableMana(),
  };
}

function getManaCyclingActionLabel() {
  const skill = getSkillState("manaCycling");

  return skill && skill.rank === RANK_TWO_SKILL_RANK ? "Practice Deep Mana Cycling" : "Practice Mana Cycling";
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

function hasHunterEyeAttunement() {
  return typeof hasActiveAttunement === "function" && hasActiveAttunement("knifeHunting");
}

function getHunterEyeDefinition() {
  return typeof getAttunementDefinition === "function" ? getAttunementDefinition("knifeHunting") : null;
}

function getHunterEyeHuntSuccessChanceBonus() {
  if (!hasHunterEyeAttunement()) return 0;

  const definition = getHunterEyeDefinition();
  const effects = definition ? definition.effects || {} : {};
  const bonusPerLevel = effects.huntSuccessChancePerLevel || 0;

  return getAttunementLevel() * bonusPerLevel;
}

function getHunterEyeHuntRewardBonus() {
  if (!hasHunterEyeAttunement()) return 0;
  if (getAttunementLevel() < 5) return 0;

  const definition = getHunterEyeDefinition();
  const effects = definition ? definition.effects || {} : {};

  return effects.maxLevelHuntRewardFlat || 0;
}

function getHuntSuccessChance(baseChance) {
  return Math.min(1, Math.max(0, (baseChance || 0) + getHunterEyeHuntSuccessChanceBonus()));
}

function getHuntRewardAmount(baseAmount) {
  return Math.max(0, Math.floor(baseAmount + getHuntingToolRewardBonus() + getHunterEyeHuntRewardBonus()));
}

function getMineOreAmount() {
  return getMiningYieldBase();
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

  if (actionName === "meditate") {
    return getMeditationCost();
  }

  if (actionName === "travel" && typeof isTowerNodeJumpExpedition === "function" && isTowerNodeJumpExpedition()) {
    const nodeName = typeof getPreparedTowerNodeName === "function" ? getPreparedTowerNodeName() : null;

    return nodeName && typeof getTowerNodeJumpCost === "function" ? getTowerNodeJumpCost(nodeName) : { mana: 10 };
  }

  if (actionName === "concentrateTonicBase" && typeof getConcentrateTonicBaseActionCost === "function") {
    return getConcentrateTonicBaseActionCost();
  }

  if (actionName === "concentrateManaTonicBase" && typeof getConcentrateManaTonicBaseActionCost === "function") {
    return getConcentrateManaTonicBaseActionCost();
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
  if (actionName === "meditate") return roundResourceAmount((action.duration || 0) * getMeditationDurationMultiplier());
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

function formatSkillCapacity(definition, levelDefinition) {
  if (!levelDefinition) return "";

  const suffix = definition.capacitySuffix || "";

  return String(levelDefinition.capacity) + suffix;
}

function getSkillProgressLabel(skillName, definition, skill) {
  if (skill && skill.rank === RANK_TWO_SKILL_RANK && definition.rank2ProgressLabel) {
    return definition.rank2ProgressLabel;
  }

  return definition.progressLabel;
}

function getSkillCapacityDisplayText(skillName, definition, levelDefinition, skill) {
  if (!levelDefinition) return "";

  if (skillName === "conditioning" && skill && skill.rank === RANK_TWO_SKILL_RANK) {
    return "Reinforced Body +" + formatTrainingNumber(levelDefinition.reinforcedBodyBonus || 0) + " max Energy";
  }

  if (skillName === "meditation" && skill && skill.rank === RANK_TWO_SKILL_RANK) {
    return (
      definition.capacityLabel +
      " " +
      formatSkillCapacity(definition, levelDefinition) +
      ", Mana +" +
      formatTrainingNumber(getMeditationManaRestoreForLevel(levelDefinition))
    );
  }

  return definition.capacityLabel + " " + formatSkillCapacity(definition, levelDefinition);
}

function createTrainingEntry(skillName) {
  const definition = getSkillDefinition(skillName);
  const skill = getSkillState(skillName);
  const levelDefinition = getSkillLevelDefinition(skillName, skill.level || 0, skill.rank || DEFAULT_SKILL_RANK);
  const nextLevelDefinition = getSkillLevelDefinition(skillName, (skill.level || 0) + 1, skill.rank || DEFAULT_SKILL_RANK);
  const progressValue = getSkillProgressValue(skillName);
  const progressLabel = getSkillProgressLabel(skillName, definition, skill);

  const entry = document.createElement("div");
  entry.className = "training-entry";

  const header = document.createElement("div");
  header.className = "training-entry-header";

  const title = document.createElement("strong");
  title.textContent = definition.label + " - " + getSkillRankLabel(skill.rank) + " Level " + skill.level;

  const capacity = document.createElement("span");
  if (skillName === "manaControl") {
    capacity.textContent = getManaControlRewardText(skill.level || 0);
  } else {
    capacity.textContent = getSkillCapacityDisplayText(skillName, definition, levelDefinition, skill);
  }

  header.appendChild(title);
  header.appendChild(capacity);
  entry.appendChild(header);

  const progressText = document.createElement("div");
  progressText.className = "training-progress-text";

  if (nextLevelDefinition && nextLevelDefinition.level > skill.level) {
    progressText.textContent =
      progressLabel + ": " + formatTrainingNumber(progressValue) + " / " + formatTrainingNumber(nextLevelDefinition.threshold);
  } else {
    progressText.textContent = progressLabel + ": complete";
  }

  entry.appendChild(progressText);

  const progressTrack = document.createElement("div");
  progressTrack.className = "training-progress-track";

  const progressFill = document.createElement("div");
  progressFill.className = "training-progress-fill";

  if (nextLevelDefinition && nextLevelDefinition.level > skill.level) {
    const currentThreshold = levelDefinition.threshold || 0;
    const required = nextLevelDefinition.threshold - currentThreshold;
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
    detail.textContent = "Pending level-up when you return to camp.";
  } else if (
    skillName === "conditioning" &&
    skill.rank === DEFAULT_SKILL_RANK &&
    isHeartRestoredForRankTwoSkills() &&
    isSkillRankMax("conditioning", DEFAULT_SKILL_RANK)
  ) {
    detail.textContent =
      "Reinforced Body energy: " +
      formatTrainingNumber(skill.reinforcedEnergyUnlockSpent || 0) +
      " / " +
      formatTrainingNumber(CONDITIONING_RANK_TWO_UNLOCK_ENERGY) +
      " to unlock " +
      getSkillRankLabel(RANK_TWO_SKILL_RANK) +
      ".";
  } else if (skillName === "meditation") {
    const currentCost = getMeditationEnergyCostForLevel(levelDefinition, skill.rank || DEFAULT_SKILL_RANK);
    const currentRestore = getMeditationManaRestoreForLevel(levelDefinition);

    if (nextLevelDefinition && nextLevelDefinition.level > skill.level) {
      const nextCost = getMeditationEnergyCostForLevel(nextLevelDefinition, skill.rank || DEFAULT_SKILL_RANK);
      const nextRestore = getMeditationManaRestoreForLevel(nextLevelDefinition);

      detail.textContent =
        "Energy cost " +
        currentCost +
        ". Mana restored +" +
        formatTrainingNumber(currentRestore) +
        ". Next: " +
        getSkillCapacityDisplayText(skillName, definition, nextLevelDefinition, skill) +
        ", Energy cost " +
        nextCost +
        ", Mana restored +" +
        formatTrainingNumber(nextRestore) +
        ".";
    } else {
      detail.textContent = "Energy cost " + currentCost + ". Mana restored +" + formatTrainingNumber(currentRestore) + ". Fully developed for now.";
    }
  } else if (skillName === "manaControl") {
    if (nextLevelDefinition && nextLevelDefinition.level > skill.level) {
      detail.textContent =
        "Current: " + getManaControlRewardText(skill.level || 0) + ". Next: " + getManaControlRewardText(nextLevelDefinition.level) + ".";
    } else {
      detail.textContent = "Current: " + getManaControlRewardText(skill.level || 0) + ". Fully developed for now.";
    }
  } else if (nextLevelDefinition && nextLevelDefinition.level > skill.level) {
    detail.textContent = "Next: " + getSkillCapacityDisplayText(skillName, definition, nextLevelDefinition, skill);
  } else {
    detail.textContent = "Fully developed for now.";
  }

  entry.appendChild(detail);

  return entry;
}

function updateTrainingUI() {
  ensureSkillsState();

  if (!ui.trainingSection || !ui.trainingList) return;

  const skillNames = ["conditioning", "concentration", "manaCycling", "meditation"];

  if (isManaControlSystemEnabled()) {
    skillNames.push("manaControl");
  }

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
