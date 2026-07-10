function hookActionCompletions() {
  actions.catchBreath.onComplete = function () {
    addResource("energy", resources.energy.perClick);
  };

  actions.gatherWood.onComplete = function () {
    addResource("wood", 1);
  };

  actions.exploreLocation.onComplete = function () {
    exploreCurrentLocation();
  };

  actions.gatherFiber.onComplete = function () {
    if (!addCarriedItem("fiber", 1)) {
      addStoryEntry("Your hands are full. You cannot carry more.");
    }
  };

  actions.returnToCamp.onComplete = function () {
    endExpedition("returned");
  };

  actions.travelToMysteriousPlants.onComplete = function () {
    startDestinationTravel("mysteriousPlants");
  };

  actions.travel.onComplete = function () {
    toggleTraveling();
  };

  actions.beginExpedition.onComplete = function () {
    startExpedition();
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

// Progress Function
function runAction(actionName) {
  const action = actions[actionName];

  // alert("Action triggered: " + actionName);
  if (!action || !action.unlocked || action.running) return;

  // Check and Pay Cost
  if (!spendCost(action.cost)) return;

  action.running = true;

  const duration = action.duration * 1000;
  const startTime = Date.now();

  if (action.onStart) {
    action.onStart();
  }

  const interval = setInterval(() => {
    let elapsed = Date.now() - startTime;
    let progress = Math.min(elapsed / duration, 1);

    // 1. Main progress bar
    setProgressBar(action, progress);

    // 2. Meta progress (if exists)
    if (action.metaProgressBar) {
      updateMetaProgress(action, progress);
    }

    // 3. Finish
    if (progress >= 1) {
      clearInterval(interval);

      action.running = false;

      resetProgressBar(action);

      if (action.onComplete) {
        action.onComplete();
      }
    }
  }, 50);
}

// Meta Progress Function
function updateMetaProgress(action, progress) {
  const stage = getCurrentExploreStage();

  const target = stage.required;

  const current = gameState.exploration.count;

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
