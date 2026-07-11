function hookActionCompletions() {
  actions.catchBreath.onComplete = function () {
    addResource("energy", resources.energy.perClick);
  };

  actions.gatherWood.onComplete = function () {
    addResource("wood", 1);
  };

  actions.gatherFood.onComplete = function () {
    addResource("food", 1);
  };

  actions.gatherWater.onComplete = function () {
    addResource("water", 1);
  };

  actions.exploreLocation.onComplete = function () {
    exploreCurrentLocation();
  };

  actions.gatherFiber.onComplete = function () {
    if (!addCarriedItem("fiber", 1)) {
      addStoryEntry("Your hands are full. You cannot carry more.");
    }
  };

  actions.gatherStone.onComplete = function () {
    if (!addCarriedItem("stone", 1)) {
      addStoryEntry("The stones are too heavy to carry more.");
    }
  };

  actions.returnToCamp.onComplete = function () {
    endExpedition("returned");
  };

  actions.travelToMysteriousPlants.onComplete = function () {
    prepareDestinationTravel("mysteriousPlants");
  };

  actions.travelToStrangeTrails.onComplete = function () {
    prepareDestinationTravel("strangeTrails");
  };

  actions.travelToCreepyCave.onComplete = function () {
    prepareDestinationTravel("creepyCave");
  };

  actions.travel.onComplete = function () {
    toggleTraveling();
  };

  actions.beginExpedition.onComplete = function () {
    prepareExpedition();
  };

  actions.makeTrap.onComplete = function () {
    addResource("trap", 1);
  };

  actions.packTrap.onComplete = function () {
    if (!addCarriedItem("trap", 1)) {
      addResource("trap", 1);
      addStoryEntry("Your pack is too full to carry the trap.");
    }
  };

  actions.setTrap.onComplete = function () {
    const location = expeditionLocations.strangeTrails;

    if (!removeCarriedItem("trap", 1)) {
      addStoryEntry("You need to bring a trap from camp.");
      updateLocationActions();
      return;
    }

    location.traps.installed++;
    addStoryEntry("You set the trap along the animal trails.");

    updateLocationActions();
  };

  actions.checkTrap.onComplete = function () {
    const location = expeditionLocations.strangeTrails;
    const traps = location.traps;

    let peltsFound = 0;

    for (let i = 0; i < traps.installed; i++) {
      if (Math.random() < traps.successChance) {
        peltsFound++;
      }
    }

    if (peltsFound > 0) {
      const peltsCarried = addCarriedItemUpToCapacity(traps.reward, peltsFound);

      if (peltsCarried === peltsFound) {
        addStoryEntry("You found " + peltsFound + " pelt" + (peltsFound === 1 ? "" : "s") + " in your traps.");
      } else if (peltsCarried > 0) {
        addStoryEntry("You found " + peltsFound + " pelts, but could only carry " + peltsCarried + ".");
      } else {
        addStoryEntry("You found " + peltsFound + " pelts, but your hands are full.");
      }
    }

    updateLocationActions();
  };

  actions.explore.onComplete = function () {
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

        if (actions.explore.metaProgressBar) {
          actions.explore.metaProgressBar.style.width = "0%";
        }

        lockAction("explore");
      }
    }
  };

  actions.packFood.onComplete = function () {
    if (!addCarriedItem("food", 1)) {
      addResource("food", 1);
    }
  };

  actions.packWater.onComplete = function () {
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
  const stage = explorationStages[gameState.exploration.currentStage];

  if (!stage) {
    console.warn("Unknown exploration stage:", gameState.exploration.currentStage);
    return null;
  }

  return stage;
}

function resetExploreMetaProgress(nextStageName) {
  gameState.exploration.currentStage = nextStageName;
  gameState.exploration.count = 0;

  if (actions.explore.metaProgressBar) {
    actions.explore.metaProgressBar.style.width = "0%";
  }
}

function unlockAction(actionName) {
  const action = actions[actionName];

  if (!action) {
    console.warn("Unknown Action:", actionName);
    return;
  }

  action.unlocked = true;
  updateActionButton(actionName);
}

function lockAction(actionName) {
  const action = actions[actionName];

  if (!action) {
    console.warn("Unknown Action:", actionName);
    return;
  }

  action.unlocked = false;
  updateActionButton(actionName);
}

//Action Helpers
function isAutoAction(actionName) {
  return !!actions[actionName] && !!actions[actionName].auto;
}

function isAutoActionActive(actionName) {
  return gameState.autoAction.actionName === actionName;
}

function shouldStopAutoAction(actionName) {
  const action = actions[actionName];

  if (!action || !action.auto) return true;

  const targetResource = resources[action.auto.resource];

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
  const action = actions[actionName];

  if (!action || !action.unlocked) return;

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

  if (action === actions.explore) {
    const stage = getCurrentExploreStage();

    if (!stage) return;

    target = stage.required;
    current = gameState.exploration.count;
  }

  if (action === actions.exploreLocation) {
    const locationName = gameState.expedition.currentLocation;
    const location = expeditionLocations[locationName];

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
  const action = actions[actionName];

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

  if (!canAffordCost(actions[actionName].cost)) {
    pauseAutoActionForRest(actionName);
    return;
  }

  startActionExecution(actionName);
}
