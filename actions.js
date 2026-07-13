function hookActionCompletions() {
  getAction("catchBreath").onComplete = function () {
    addResource("energy", getResource("energy").perClick);
  };

  getAction("gatherWood").onComplete = function () {
    addResource("wood", 1);
  };

  getAction("gatherFood").onComplete = function () {
    addResource("food", 1);
  };

  getAction("gatherWater").onComplete = function () {
    addResource("water", 1);
  };

  getAction("exploreLocation").onComplete = function () {
    exploreCurrentLocation();
  };

  getAction("gatherFiber").onComplete = function () {
    if (!addCarriedItem("fiber", 1)) {
      addStoryEntry("Your hands are full. You cannot carry more.");
    }
  };

  getAction("gatherStone").onComplete = function () {
    if (!addCarriedItem("stone", 1)) {
      addStoryEntry("The stones are too heavy to carry more.");
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

  getAction("packFood").onComplete = function () {
    if (!addCarriedItem("food", 1)) {
      addResource("food", 1);
    }
  };

  getAction("packWater").onComplete = function () {
    const expedition = gameState.expedition;

    if (expedition.water >= expedition.waterCapacity) {
      addResource("water", 1);
      return;
    }

    expedition.water++;
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
  updateCraftingSectionVisibility()
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

  if (!action || !action.unlocked || action.running) return;

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

  const duration = action.duration * 1000;
  const startTime = Date.now();

  if (action.onStart) {
    action.onStart();
  }

  const interval = setInterval(() => {
    let elapsed = Date.now() - startTime;
    let progress = Math.min(elapsed / duration, 1);

    setProgressBar(action, progress);

    if (action.metaProgressBar) {
      updateMetaProgress(action, progress);
    }

    if (progress >= 1) {
      clearInterval(interval);

      action.running = false;
      resetProgressBar(action);

      if (action.onComplete) {
        action.onComplete();
      }

      checkRecipeDiscoveries();
      continueAutoAction(actionName);
    }
  }, 50);
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
