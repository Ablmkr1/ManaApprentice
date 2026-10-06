require('./overhaul-harness')(`
  updateCampUpgradeUI = function() {};
  updateCraftingSectionVisibility = function() {};
  updateWorkTabsVisibility = function() {};
  updatePlacePanel = function() {};
  updateHomeAreaAvailability = function() {};
  updateHomeAttentionIndicators = function() {};
  updateCurrentGoalUI = function() {};
  updateActionButton = function() {};
  checkClearingComplete = function() {};

  const manaUnlocks = getExpeditionLocation('creepyCave').explorableObjects.caveInterior.stages[2].unlocks;
  assert(manaUnlocks.some(unlock => unlock.type === 'campUpgrade' && unlock.id === 'meditationSpot'),
    'Mana awakening is the canonical base Meditation Spot unlock');
  applyUnlocks(manaUnlocks);
  assert(gameState.magicUnlocked && getCampUpgrade('meditationSpot').unlocked,
    'Mana awakening immediately exposes the base Meditation Spot');
  assert(!('manaCrystal' in getCampUpgrade('meditationSpot').cost),
    'Base Meditation Spot can be built before reaching Roadside Ruin');

  completeCampUpgrade('meditationSpot');
  assert(getCampUpgrade('meditationSpot').purchased && getAction('meditate').unlocked,
    'building the base spot exposes the existing meditation interaction');
  assert(getMeditationSpotManaMultiplier() === 1, 'base meditation keeps the original recovery rate');

  const roadsideResearch = getResearch('meditation');
  assert(roadsideResearch.unlocks.length === 1 && roadsideResearch.unlocks[0].id === 'attunedMeditationSpot',
    'the former base reward now unlocks Improved Meditation Spot');
  roadsideResearch.completed = true;
  applyResearchUnlocks('meditation');
  completeCampUpgrade('attunedMeditationSpot');
  assert(getCampUpgrade('attunedMeditationSpot').purchased && !getCampUpgrade('attunedMeditationSpot').unlocked,
    'Improved Meditation Spot replaces the base tier and cannot be repurchased');
  assert(getMeditationSpotManaMultiplier() === 1.25 && getSkillState('meditation').rank === 1,
    'Improved Meditation provides a modest benefit without bypassing the Rank II skill gate');

  const greaterResearch = getResearch('attunedMeditation');
  assert(greaterResearch.requires.campUpgradesPurchased[0] === 'attunedMeditationSpot' &&
    greaterResearch.requires.skills.meditation.level === 5 &&
    greaterResearch.unlocks[0].id === 'greaterMeditationSpot',
    'the former Improved unlock point now gates Greater Meditation behind the existing skill requirement');
  getSkillState('meditation').level = 5;
  gameState.towerConstructionUnlocked = true;
  greaterResearch.completed = true;
  applyResearchUnlocks('attunedMeditation');
  completeCampUpgrade('greaterMeditationSpot');
  assert(getCampUpgrade('greaterMeditationSpot').purchased && getMeditationSpotManaMultiplier() === 1.5,
    'Greater Meditation is the third and strongest state of the same station');
  assert(getSkillState('meditation').rank === 2,
    'Greater Meditation preserves the former upgraded spot Rank II benefit');
  applyResearchUnlocks('meditation');
  applyResearchUnlocks('attunedMeditation');
  assert(!getCampUpgrade('attunedMeditationSpot').unlocked && !getCampUpgrade('greaterMeditationSpot').unlocked,
    'completed rewards cannot unlock either meditation upgrade twice');

  const blankLegacy = {
    version: 45, gameState: { magicUnlocked: true },
    resources: { mana: { visible: true, discovered: true } }, actions: {}, campUpgrades: {},
    gearUpgrades: {}, spells: {}, resourceCrafts: {}, expeditionLocations: {}, dungeons: {}, research: {}, automation: {},
  };
  const manaLegacy = migrateSaveData(structuredClone(blankLegacy));
  assert(manaLegacy.campUpgrades.meditationSpot.unlocked,
    'legacy saves with Mana receive the newly early base spot unlock');

  const baseLegacy = structuredClone(blankLegacy);
  baseLegacy.campUpgrades.meditationSpot = { purchased: true, unlocked: false };
  baseLegacy.research.meditation = { completed: true };
  const baseMigrated = migrateSaveData(baseLegacy);
  assert(baseMigrated.campUpgrades.meditationSpot.purchased && baseMigrated.campUpgrades.attunedMeditationSpot.unlocked,
    'legacy base owners retain it and receive the moved Improved reward');

  const improvedLegacy = structuredClone(blankLegacy);
  improvedLegacy.campUpgrades.meditationSpot = { purchased: true, unlocked: false };
  improvedLegacy.campUpgrades.attunedMeditationSpot = { purchased: true, unlocked: false };
  improvedLegacy.research.meditation = { completed: true };
  improvedLegacy.research.attunedMeditation = { completed: true };
  const improvedMigrated = migrateSaveData(improvedLegacy);
  assert(improvedMigrated.campUpgrades.meditationSpot.purchased &&
    improvedMigrated.campUpgrades.attunedMeditationSpot.purchased &&
    improvedMigrated.campUpgrades.greaterMeditationSpot.purchased &&
    improvedMigrated.actions.meditate.unlocked,
    'legacy upgraded owners migrate to Greater Meditation without losing access or progress');

  console.log('Meditation progression checks passed:', passed);
`);
