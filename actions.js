function hookActionCompletions() {
  getAction("catchBreath").onComplete = function () {
    addResource("energy", getResource("energy").perClick);
  };

  getAction("meditate").onComplete = function () {
    addResource("mana", 1);

    if (getResource("mana").value >= getResource("mana").maxValue) {
      stopAutoAction();
    }
  };

  getAction("recover").onComplete = function () {
    addResource("focus", 1);

    if (getResource("focus").value >= getResource("focus").maxValue) {
      stopAutoAction();
    }
  };

  getAction("gatherWood").onComplete = function () {
    addResource("wood", getResource("wood").perClick);
  };

  getAction("gatherFood").onComplete = function () {
    addResource("food", getResource("food").perClick);
  };

  getAction("gatherWater").onComplete = function () {
    addResource("water", getResource("water").perClick);
  };

  getAction("exploreLocation").onComplete = function () {
    exploreCurrentLocation();
  };

  getAction("gatherFiber").onComplete = function () {
    const fiberCarried = addCarriedItemUpToCapacity("fiber", getResource("fiber").perClick);

    if (fiberCarried <= 0) {
      addStoryEntry("Your hands are full. You cannot carry more.");
    }
  };

  getAction("gatherFiber5").onComplete = function () {
    const fiberCarried = addCarriedItemUpToCapacity("fiber", getResource("fiber").perClick * 5);

    if (fiberCarried <= 0) {
      addStoryEntry("Your hands are full. You cannot carry more.");
    }
  };

  getAction("gatherStone").onComplete = function () {
    if (!addCarriedItem("stone", 1)) {
      addStoryEntry("The stones are too heavy to carry more.");
      return;
    }

    if (gameState.expedition.currentLocation === "foothillScree" && Math.random() < 0.2) {
      if (addCarriedItem("ore", 1)) {
        addStoryEntry("Among the loose stone, you find a chunk of ore.");
      } else {
        addStoryEntry("You spot ore among the scree, but your pack is too full to carry it.");
      }
    }
  };

  getAction("returnToCamp").onComplete = function () {
    beginReturnToCamp("manual");
  };

  getAction("travel").onComplete = function () {
    toggleTraveling();
  };

  getAction("beginExpedition").onComplete = function () {
    prepareOpenExpedition();
  };

  getAction("packTrap").onComplete = function () {
    if (!addCarriedItem("trap", 1)) {
      addResource("trap", 1);
      addStoryEntry("Your pack is too full to carry the trap.");
    }
  };

  getAction("scoutTrapSite").onComplete = function () {
    const locationName = gameState.expedition.currentLocation;
    const site = getFirstHiddenTrapSite(locationName);

    if (!site) {
      updateLocationActions();
      return;
    }

    site.discovered = true;

    addStoryEntry("You find a narrow trail suitable for a trap.");
    updateTrapSitesUI(getExpeditionLocation(locationName));
    updateLocationActions();
  };

  getAction("setTrap").onComplete = function () {
    const locationName = gameState.expedition.currentLocation;
    const location = getExpeditionLocation(locationName);
    const site = getFirstOpenTrapSite(locationName);

    if (!location || !site) {
      updateLocationActions();
      return;
    }

    if (!removeCarriedItem("trap", 1)) {
      addStoryEntry("You need to bring a trap from camp.");
      updateLocationActions();
      return;
    }

    site.installed = true;
    site.checkedThisVisit = true;

    updateTrapCapacityUI();
    addStoryEntry("You set a trap along the trail.");
    updateTrapSitesUI(location);
    updateLocationActions();
  };

  getAction("checkTrap").onComplete = function () {
    const locationName = gameState.expedition.currentLocation;
    const location = getExpeditionLocation(locationName);
    const trapSiteData = getTrapSiteData(locationName);
    const site = getFirstUncheckedInstalledTrapSite(locationName);

    if (!location || !trapSiteData || !site) {
      updateLocationActions();
      return;
    }

    site.checkedThisVisit = true;

    if (Math.random() < trapSiteData.successChance) {
      const peltsCarried = addCarriedItemUpToCapacity(trapSiteData.reward, 1);

      if (peltsCarried === 1) {
        addStoryEntry("You find a pelt in the trap.");
      } else {
        addStoryEntry("You find a pelt, but your hands are full.");
      }
    } else {
      addStoryEntry("The trap is empty.");
    }

    updateTrapSitesUI(location);
    updateLocationActions();
  };

  getAction("explore").onComplete = function () {
    const stage = getCurrentExploreStage();

    if (!stage) return;

    gameState.exploration.count++;

    const storyIndex = gameState.exploration.count - 1;

    if (stage.story[storyIndex]) {
      addStoryEntry(stage.story[storyIndex]);
    }

    if (gameState.exploration.count >= stage.required) {
      if (stage.unlocks) {
        applyUnlocks(stage.unlocks);
      }

      if (stage.onComplete) {
        stage.onComplete();
      }

      if (stage.nextStage) {
        resetExploreMetaProgress(stage.nextStage);
      } else {
        gameState.exploration.count = 0;

        if (getAction("explore").metaProgressBar) {
          getAction("explore").metaProgressBar.style.width = "0%";
        }

        lockAction("explore");
      }
    }
  };

  getAction("trackGame").onComplete = function () {
    const locationName = gameState.expedition.currentLocation;
    const hunt = getHuntData(locationName);

    if (!hunt) return;

    hunt.tracked = true;
    addStoryEntry("You find fresh sign and follow it deeper into the run.");
    updateLocationActions();
  };

  getAction("huntGame").onComplete = function () {
    const locationName = gameState.expedition.currentLocation;
    const hunt = getHuntData(locationName);

    if (!hunt) return;

    hunt.tracked = false;

    if (Math.random() < hunt.successChance) {
      const rewardAmount = hunt.rewardAmount || 1;
      const carriedAmount = addCarriedItemUpToCapacity(hunt.reward, rewardAmount);

      if (carriedAmount > 0) {
        addStoryEntry("The hunt succeeds. You carry " + formatCarryAmount(carriedAmount) + " pelts.");
      } else {
        addStoryEntry("The hunt succeeds, but your pack is too full for the pelts.");
      }
    } else {
      addStoryEntry("The trail breaks apart before you can close the distance.");
    }

    updateLocationActions();
  };

  getAction("packFood").onComplete = function () {
    if (!addCarriedItem("food", 1)) {
      addResource("food", 1);
    }
  };

  getAction("packPelt").onComplete = function () {
    if (!addCarriedItem("pelt", 1)) {
      addResource("pelt", 1);
    }
  };

  getAction("storePelt").onComplete = function () {
    const location = getExpeditionLocation(gameState.expedition.currentLocation);
    const peltAmount = gameState.expedition.carriedItems.pelt || 0;

    if (!location || !location.storage) return;
    if (peltAmount <= 0) return;
    if (!removeCarriedItem("pelt", peltAmount)) return;

    location.storage.pelt += peltAmount;
    addStoryEntry("You store " + formatCarryAmount(peltAmount) + " pelts at the cabin.");
    updateLocationActions();
    updatePlacePanel();
  };

  getAction("takeLeather").onComplete = function () {
    const location = getExpeditionLocation(gameState.expedition.currentLocation);

    if (!location || !location.storage || location.storage.leather <= 0) return;
    const leatherAmount = addCarriedItemUpToCapacity("leather", location.storage.leather);

    if (leatherAmount <= 0) return;

    location.storage.leather -= leatherAmount;
    addStoryEntry("You pack " + formatCarryAmount(leatherAmount) + " leather.");
    updateLocationActions();
    updatePlacePanel();
  };

  getAction("packWood").onComplete = function () {
    if (!addCarriedItem("wood", 1)) {
      addResource("wood", 1);
    }
  };

  getAction("storeWood").onComplete = function () {
    const location = getExpeditionLocation(gameState.expedition.currentLocation);
    const woodAmount = gameState.expedition.carriedItems.wood || 0;

    if (!location || !location.storage) return;
    if (woodAmount <= 0) return;
    if (!removeCarriedItem("wood", woodAmount)) return;

    location.storage.wood += woodAmount;
    addStoryEntry("You stack " + formatCarryAmount(woodAmount) + " wood at the miners' camp.");
    updateLocationActions();
    updatePlacePanel();
  };

  getAction("packOre").onComplete = function () {
    if (!addCarriedItem("ore", 1)) {
      addResource("ore", 1);
    }
  };

  getAction("storeOre").onComplete = function () {
    const location = getExpeditionLocation(gameState.expedition.currentLocation);
    const oreAmount = gameState.expedition.carriedItems.ore || 0;

    if (!location || !location.storage) return;
    if (oreAmount <= 0) return;
    if (!removeCarriedItem("ore", oreAmount)) return;

    location.storage.ore += oreAmount;
    addStoryEntry("You store " + formatCarryAmount(oreAmount) + " ore at the miners' camp.");
    updateLocationActions();
    updatePlacePanel();
  };

  getAction("takeIron").onComplete = function () {
    const location = getExpeditionLocation(gameState.expedition.currentLocation);

    if (!location || !location.storage || location.storage.iron <= 0) return;
    if (!addCarriedItem("iron", 1)) return;

    location.storage.iron--;
    addStoryEntry("You pack a bar of iron.");
    updateLocationActions();
    updatePlacePanel();
  };

  getAction("mineOre").onComplete = function () {
    if (addCarriedItem("ore", 2)) {
      addStoryEntry("You break ore from the mine wall.");
    } else {
      addStoryEntry("The ore is too heavy to carry more.");
    }
  };

  getAction("gatherHerbs").onComplete = function () {
    const herbAmount = Math.floor(Math.random() * 6);

    if (herbAmount <= 0) {
      addStoryEntry("You search the patch but find no usable herbs this time.");
    } else if (addCarriedItem("herb", herbAmount)) {
      addStoryEntry("You gather " + herbAmount + " useful herbs.");
    } else {
      addStoryEntry("You cannot carry more herbs.");
    }

    updateLocationActions();
    updatePlacePanel();
  };

  getAction("storeHerb").onComplete = function () {
    const location = getExpeditionLocation(gameState.expedition.currentLocation);

    if (!location || !location.storage) return;
    const herbAmount = gameState.expedition.carriedItems.herb || 0;

    if (herbAmount <= 0) return;

    if (!removeCarriedItem("herb", herbAmount)) return;

    location.storage.herb += herbAmount;
    addStoryEntry("You dry and store herbs at the alchemist's hut.");
    updateLocationActions();
    updatePlacePanel();
  };

  getAction("packHerb").onComplete = function () {
    const herb = getResource("herb");
    const amountToTry = Math.min(5, herb.value);
    const amountPacked = addCarriedItemUpToCapacity("herb", amountToTry);

    if (amountPacked <= 0) {
      addStoryEntry("Your pack is too full to carry more herbs.");
      return;
    }

    herb.value -= amountPacked;
    updateResource("herb");
    addStoryEntry("You pack " + amountPacked + " herbs.");
  };

  getAction("enterDungeon").onComplete = function () {
    enterCurrentLocationDungeon();
  };

  getAction("leaveDungeon").onComplete = function () {
    leaveCurrentDungeon();
  };

  getAction("packWater").onComplete = function () {
    const expedition = gameState.expedition;

    expedition.water = expedition.waterCapacity;
    refreshExpeditionUI();
  };
}

// Get Explore Function
function getCurrentExploreStage() {
  const stage = getExplorationStage(gameState.exploration.currentStage);

  if (!stage) {
    console.warn("Unknown exploration stage:", gameState.exploration.currentStage);
    return null;
  }

  return stage;
}

function resetExploreMetaProgress(nextStageName) {
  gameState.exploration.currentStage = nextStageName;
  gameState.exploration.count = 0;

  if (getAction("explore").metaProgressBar) {
    getAction("explore").metaProgressBar.style.width = "0%";
  }
}

function unlockAction(actionName) {
  const action = getAction(actionName);

  if (!action) {
    console.warn("Unknown Action:", actionName);
    return;
  }

  action.unlocked = true;
  updateActionButton(actionName);
  updateCraftingSectionVisibility();
}

function lockAction(actionName) {
  const action = getAction(actionName);

  if (!action) {
    console.warn("Unknown Action:", actionName);
    return;
  }

  action.unlocked = false;
  updateActionButton(actionName);
  updateCraftingSectionVisibility();
}

//Action Helpers
function isAutoAction(actionName) {
  return !!getAction(actionName) && !!getAction(actionName).auto;
}

function isAutoActionActive(actionName) {
  return gameState.autoAction.actionName === actionName;
}

function shouldStopAutoAction(actionName) {
  const action = getAction(actionName);

  if (!action || !action.auto) return true;

  const targetResource = getResource(action.auto.resource);

  if (targetResource && targetResource.value >= targetResource.maxValue) {
    return true;
  }

  return false;
}

function pauseAutoActionForRest(actionName) {
  gameState.autoAction.actionName = actionName;
  gameState.autoAction.pausedForRest = true;
  startResting();
}

function stopAutoAction() {
  gameState.autoAction.actionName = null;
  gameState.autoAction.pausedForRest = false;
}

function resumeAutoActionAfterRest() {
  const actionName = gameState.autoAction.actionName;

  if (!actionName || !gameState.autoAction.pausedForRest) return;

  gameState.autoAction.pausedForRest = false;

  if (shouldStopAutoAction(actionName)) {
    stopAutoAction();
    return;
  }

  startActionExecution(actionName);
}

// Progress Function
function runAction(actionName) {
  const action = getAction(actionName);

  if (!action || !action.unlocked || !canUseAction(actionName)) return;

  if (actionName === "travel" && isTravelActivityActive()) {
    toggleTraveling();
    return;
  }

  if (isAutoAction(actionName)) {
    if (isAutoActionActive(actionName) && !gameState.autoAction.pausedForRest) {
      stopAutoAction();
      return;
    }

    gameState.autoAction.actionName = actionName;
    gameState.autoAction.pausedForRest = false;
  }

  startActionExecution(actionName);
}

// Meta Progress Function
function updateMetaProgress(action, progress) {
  let target = 1;
  let current = 0;

  if (action === getAction("explore")) {
    const stage = getCurrentExploreStage();

    if (!stage) return;

    target = stage.required;
    current = gameState.exploration.count;
  }

  if (action === getAction("exploreLocation")) {
    const locationName = gameState.expedition.currentLocation;
    const location = getExpeditionLocation(locationName);

    if (!location) return;

    target = location.explorationRequired;
    current = location.explorationProgress;
  }

  const interpolated = (current + progress) / target;

  if (action.metaProgressBar) {
    action.metaProgressBar.style.width = interpolated * 100 + "%";
  }
}

function animateMetaBar(bar, target) {
  let current = parseFloat(bar.style.width) || 0;

  const interval = setInterval(() => {
    current += (target * 100 - current) * 0.01;
    bar.style.width = current + "%";
    if (Math.abs(current - target * 100) < 0.5) {
      bar.style.width = target * 100 + "%";
      clearInterval(interval);
    }
  }, 16);
}

function startActionExecution(actionName) {
  const action = getAction(actionName);

  if (!action || !action.unlocked || action.running || isActivityActive()) return;

  if (isAutoAction(actionName) && shouldStopAutoAction(actionName)) {
    stopAutoAction();
    return;
  }

  if (!spendCost(action.cost)) {
    if (isAutoAction(actionName) && action.auto.resumeAfterRest) {
      pauseAutoActionForRest(actionName);
    }

    return;
  }

  action.running = true;

  if (action.onStart) {
    action.onStart();
  }

  startActivity({
    kind: "action",
    id: actionName,
  });

  updateAllActionButtons();
  updateCraftingButtons();
}

function resetActivity() {
  gameState.activity.active = false;
  gameState.activity.kind = null;
  gameState.activity.type = null;
  gameState.activity.id = null;
  gameState.activity.label = null;
  gameState.activity.startTime = null;
  gameState.activity.duration = 0;
  gameState.activity.interval = false;
  gameState.activity.context = null;
}

function isActivityActive() {
  return gameState.activity && gameState.activity.active;
}

function getActivityButton(activity) {
  if (!activity) return null;

  if (activity.kind === "action") {
    const action = getAction(activity.id);
    return action ? action.button : null;
  }

  if (activity.kind === "craft") {
    const craft = getCraftDefinition(activity.type, activity.id);
    return craft ? craft.button : null;
  }

  if (activity.kind === "travel") {
    const action = getAction("travel");
    return action ? action.button : null;
  }

  if (activity.kind === "locationObject") {
    return getLocationObjectButton(activity.context.objectName);
  }

  if (activity.kind === "spell") {
    const spell = getSpell(activity.id);
    return spell ? spell.button : null;
  }

  if (activity.kind === "dungeonSearch") {
    return getDungeonActionButton("exploreRoom");
  }

  return null;
}

function getActivityDuration(activityRequest) {
  if (activityRequest.duration !== undefined) return activityRequest.duration;

  if (activityRequest.kind === "action") {
    const action = getAction(activityRequest.id);
    return action ? action.duration : 0;
  }

  if (activityRequest.kind === "craft") {
    return getCraftDuration(activityRequest.type, activityRequest.id);
  }

  if (activityRequest.kind === "spell") {
    const spell = getSpell(activityRequest.id);
    return spell ? spell.duration || 0 : 0;
  }

  return 0;
}

function processActivityTick() {
  if (!isActivityActive()) return;

  const activity = gameState.activity;
  const durationMs = activity.duration * 1000;

  if (durationMs <= 0) {
    completeActivity();
    return;
  }

  const elapsed = Date.now() - activity.startTime;
  const progress = Math.min(elapsed / durationMs, 1);
  const button = getActivityButton(activity);

  if (activity.kind === "action") {
    const action = getAction(activity.id);

    if (action) {
      setProgressBar(action, progress);

      if (action.metaProgressBar) {
        updateMetaProgress(action, progress);
      }
    }
  }

  if (activity.kind === "craft" && button) {
    setCraftButtonProgress(button, progress);
  }

  if (activity.kind === "travel") {
    const travelAction = getAction("travel");

    if (travelAction) {
      setProgressBar(travelAction, progress);
    }
  }

  if (activity.kind === "locationObject" && button) {
    const progressFill = button.querySelector(".progressFill");

    if (progressFill) {
      progressFill.style.width = progress * 100 + "%";
    }
  }

  if (activity.kind === "spell" && button) {
    const progressFill = button.querySelector(".progressFill");

    if (progressFill) {
      progressFill.style.width = progress * 100 + "%";
    }
  }

  if (activity.kind === "rest") {
    const restProgressFill = ui.restBtn.querySelector(".progressFill");

    if (restProgressFill) {
      restProgressFill.style.width = progress * 100 + "%";
    }
  }

  if (activity.kind === "dungeonSearch" && button) {
    const progressFill = button.querySelector(".progressFill");

    if (progressFill) {
      progressFill.style.width = progress * 100 + "%";
    }
  }

  if (progress < 1) return;

  completeActivity();
}

function completeActivity() {
  const activity = gameState.activity;

  if (activity.kind === "rest") {
    const restProgressFill = ui.restBtn.querySelector(".progressFill");

    if (restProgressFill) {
      restProgressFill.style.width = "0%";
    }

    addResource("energy", getResource("energy").restPerSecond);

    if (getResource("energy").value >= getResource("energy").maxValue) {
      resetActivity();
      updateRestButton();
      updateAllActionButtons();
      updateCraftingButtons();
      updatePlacePanel();
      resumeAutoActionAfterRest();
      return;
    }

    gameState.activity.startTime = Date.now();
    return;
  }

  if (activity.kind === "travel") {
    const travelAction = getAction("travel");
    const expedition = gameState.expedition;

    if (travelAction) {
      resetProgressBar(travelAction);
    }

    const result = resolveExpeditionStep();

    updateResource("energy");

    if (!result.success && result.reason === "notEnoughEnergy") {
      if (!expedition.returning) {
        resetActivity();
        updateTravelButton(false);
        beginReturnToCamp("exhausted");
        updateAllActionButtons();
        updateCraftingButtons();
        return;
      }

      applyExpeditionStep(result.step);
      refreshExpeditionUI();

      if (expedition.distance <= 0) {
        resetActivity();
        updateTravelButton(false);
        endExpedition("returned");
        return;
      }

      gameState.activity.startTime = Date.now();
      updateTravelButton(true);
      updateAllActionButtons();
      updateCraftingButtons();
      return;
    }

    if (!result.success) {
      resetActivity();
      updateTravelButton(false);
      updateAllActionButtons();
      updateCraftingButtons();
      return;
    }

    applyExpeditionStep(result.step);
    refreshExpeditionUI();

    if (expedition.returning && expedition.distance <= 0) {
      resetActivity();
      updateTravelButton(false);
      endExpedition("returned");
      return;
    }

    if (checkDestinationArrival()) {
      resetActivity();
      updateTravelButton(false);
      updateAllActionButtons();
      updateCraftingButtons();
      updatePlacePanel();
      return;
    }

    if (checkExpeditionDiscovery()) {
      resetActivity();
      updateTravelButton(false);
      updateAllActionButtons();
      updateCraftingButtons();
      updatePlacePanel();
      return;
    }

    if (!expedition.returning && expedition.distance >= expedition.targetDistance) {
      resetActivity();
      updateTravelButton(false);
      endExpedition("completed");
      return;
    }

    gameState.activity.startTime = Date.now();
    updateTravelButton(true);
    updateAllActionButtons();
    updateCraftingButtons();
    return;
  }

  if (activity.kind === "locationObject") {
    const context = activity.context;
    const button = getActivityButton(activity);

    if (button) {
      const progressFill = button.querySelector(".progressFill");

      if (progressFill) {
        progressFill.style.width = "0%";
      }
    }

    resetActivity();

    completeLocationObjectExploration(context.locationName, context.objectName);
    updatePlacePanel();

    return;
  }

  if (activity.kind === "spell") {
    const spellName = activity.id;
    const context = activity.context;
    const button = getActivityButton(activity);

    if (button) {
      const progressFill = button.querySelector(".progressFill");

      if (progressFill) {
        progressFill.style.width = "0%";
      }
    }

    resetActivity();
    completeSpellCast(spellName, context);
    return;
  }

  if (activity.kind === "dungeonSearch") {
    const context = activity.context;
    const button = getActivityButton(activity);

    if (button) {
      const progressFill = button.querySelector(".progressFill");

      if (progressFill) {
        progressFill.style.width = "0%";
      }
    }

    resetActivity();

    completeDungeonRoomSearch(context.dungeonId, context.nodeId);
    updatePlacePanel();

    return;
  }

  if (activity.kind === "instant") {
    const instantId = activity.id;
    const context = activity.context;

    resetActivity();

    if (instantId === "destinationTravel") {
      prepareDestinationTravel(context.locationName);
    }

    updateAllActionButtons();
    updateCraftingButtons();
    return;
  }

  if (activity.kind === "action") {
    const action = getAction(activity.id);
    const completedActionName = activity.id;

    if (action) {
      action.running = false;
      resetProgressBar(action);

      resetActivity();

      if (action.onComplete) {
        action.onComplete();
      }

      checkResearchDiscoveries();

      updateAllActionButtons();
      updateCraftingButtons();

      continueAutoAction(completedActionName);
      return;
    }
  }

  if (activity.kind === "craft") {
    const craftType = activity.type;
    const craftId = activity.id;
    const button = getActivityButton(activity);

    if (button) {
      resetCraftButtonProgress(button);
    }

    if (craftType === "campUpgrade") {
      completeCampUpgrade(craftId);
    }

    if (craftType === "gearUpgrade") {
      completeGearUpgrade(craftId);
    }

    if (craftType === "storageUpgrade") {
      completeStorageUpgrade(craftId);
    }

    if (craftType === "resourceCraft") {
      completeResourceCraft(craftId);
    }

    if (craftType === "research") {
      completeResearch(craftId, true);
    }

    resetActivity();
    checkResearchDiscoveries();

    if (shouldContinueCrafting(craftType, craftId)) {
      startCrafting(craftType, craftId);
      return;
    }

    updateCraftingButtons();
    updateCraftingSectionVisibility();
    updateAllActionButtons();
    return;
  }

  resetActivity();
}

function startActivity(activityRequest) {
  if (isActivityActive()) return false;

  const duration = getActivityDuration(activityRequest);

  gameState.activity.active = true;
  gameState.activity.kind = activityRequest.kind;
  gameState.activity.type = activityRequest.type || null;
  gameState.activity.id = activityRequest.id || null;
  gameState.activity.label = activityRequest.label || null;
  gameState.activity.startTime = Date.now();
  gameState.activity.duration = duration;
  gameState.activity.interval = !!activityRequest.interval;
  gameState.activity.context = activityRequest.context || null;

  return true;
}

function continueAutoAction(actionName) {
  if (!isAutoActionActive(actionName)) return;

  if (shouldStopAutoAction(actionName)) {
    stopAutoAction();
    return;
  }

  if (!canAffordCost(getAction(actionName).cost)) {
    pauseAutoActionForRest(actionName);
    return;
  }

  startActionExecution(actionName);
}
