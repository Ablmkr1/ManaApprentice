const vm = require("vm");
const { browserStubs, source } = require("./combat-content-smoke.js");

const tests = String.raw`
(() => {
  let passed = 0;
  updateCraftingUIForCurrentContext = function () {};
  updateResearchHistoryUI = function () {};
  function assert(value, message) {
    if (!value) throw new Error(message);
    passed += 1;
    console.log("PASS: " + message);
  }
  function finishProjectLevel(projectId) {
    const state = getProjectState(projectId);
    const level = getProjectCurrentLevel(projectId);
    state.work = level.workRequired;
    state.deposits = { ...(level.materials || {}) };
    assert(checkProjectLevelCompletion(projectId), projectId + " level completes");
  }
  function roundTrip() {
    const saved = createSaveData();
    applyGameStateSaveData(saved.gameState);
    applyResourceSaveData(saved.resources);
    applyResearchSaveData(saved.research);
    syncTierFourFinaleProgression();
    return saved;
  }

  ensureProjectsState();
  gameState.brokenWardenDefeated = true;
  grantWardenCore(false);
  checkResearchDiscoveries();
  assert(gameState.wardenCoreRecovered && getResource("wardenCore").value === 1, "Warden Core is granted outside carried inventory");
  assert(getResearch("longRangeNetwork").unlocked, "Warden Core unlocks Long-Range Network research");
  grantWardenCore(false);
  assert(getResource("wardenCore").value === 1, "repeat Warden reward cannot duplicate the Core");
  roundTrip();
  assert(gameState.wardenCoreRecovered && getResearch("longRangeNetwork").unlocked, "Core and research unlock survive reload");

  const priorFloor = getProjectState("towerFloor2");
  priorFloor.unlocked = true;
  priorFloor.completed = true;
  priorFloor.level = getProjectDefinition("towerFloor2").levels.length;
  completeResearch("longRangeNetwork", true);
  assert(getResearch("longRangeNetwork").completed && getProjectState("towerFloor3").unlocked, "research unlocks the Gate Chamber project");
  assert(!gameState.tierFourCompleted, "research completion does not complete Tier 4");
  roundTrip();
  assert(getProjectState("towerFloor3").unlocked && !getProjectState("towerFloor3").completed, "Gate Chamber unlock survives reload");

  finishProjectLevel("towerFloor3");
  assert(getProjectState("towerFloor3").completed && getProjectState("towerRoomLongRangeGate").unlocked, "Gate Chamber completion unlocks Long-Range Gate construction");
  assert(gameState.currentGoalId === "buildLongRangeGate", "Gate Chamber completion updates the objective");
  roundTrip();
  assert(getProjectState("towerRoomLongRangeGate").unlocked, "gate construction unlock survives reload");

  finishProjectLevel("towerRoomLongRangeGate");
  assert(isLongRangeGateBuilt() && !getProjectState("towerRoomLongRangeGate").completed, "Long-Range Gate is built but inactive after construction");
  assert(gameState.currentGoalId === "activateLongRangeGate", "gate construction exposes the activation objective");
  assert(Object.keys(getProjectWorkCost("towerRoomLongRangeGate")).length === 0, "activation has no second resource payment");
  assert(getProjectWorkDuration("towerRoomLongRangeGate") === 12, "activation uses a twelve-second major-action timer");
  roundTrip();
  assert(isLongRangeGateBuilt() && !gameState.tierFourCompleted, "inactive gate state survives reload without completing Tier 4");

  assert(startProjectWork("towerRoomLongRangeGate") === undefined && gameState.activity.active, "activation starts through the existing Tower project activity system");
  testGameTime += 12000;
  processActivityTick();
  assert(getProjectState("towerRoomLongRangeGate").completed, "activation completes the Long-Range Gate project");
  assert(gameState.tierFourCompleted && gameState.tierFiveUnlocked, "gate activation completes Tier 4 and begins Tier 5");
  assert(gameState.world.territories.unknownTerritory1.revealed && gameState.world.territories.unknownTerritory1.accessible, "activation reveals one external Territory hook");
  assert(gameState.currentGoalId === "travelToFirstExternalTerritory", "Tier 5 objective points to the external Territory");
  roundTrip();
  assert(gameState.tierFourCompleted && gameState.world.territories.unknownTerritory1.revealed, "Tier transition and destination survive reload");

  const legacy = createSaveData();
  legacy.version = 39;
  legacy.gameState.brokenWardenDefeated = true;
  legacy.gameState.tierFourCompleted = true;
  delete legacy.gameState.wardenCoreRecovered;
  delete legacy.gameState.tierFiveUnlocked;
  delete legacy.gameState.world.territories;
  delete legacy.resources.wardenCore;
  delete legacy.research.longRangeNetwork;
  delete legacy.gameState.projects.towerFloor3;
  delete legacy.gameState.projects.towerRoomLongRangeGate;
  const migrated = migrateSaveData(legacy);
  assert(migrated.gameState.wardenCoreRecovered && migrated.resources.wardenCore.value === 1, "v39 boss saves backfill the Warden Core");
  assert(migrated.research.longRangeNetwork.unlocked, "v39 boss saves unlock Long-Range Network without another kill");
  assert(!migrated.gameState.tierFourCompleted && !migrated.gameState.tierFiveUnlocked, "legacy boss completion is moved to gate activation");
  assert(migrated.gameState.currentGoalId === "researchLongRangeNetwork", "legacy boss saves resume at the correct objective");

  console.log(JSON.stringify({ passed }));
})();
`;

vm.runInNewContext(browserStubs + "\n" + source + "\n" + tests, { console, structuredClone, setTimeout, clearTimeout });
