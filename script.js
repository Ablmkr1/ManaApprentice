window.onload = function () {
  hookDomToUI();
  hookUIMaps();
  hookActionCompletions();

  ui.clearingContinueBtn.addEventListener("click", function () {
    ui.clearingPopup.style.display = "none";

    lockAction("catchBreath");

    ui.restBtn.style.display = "inline-block";
    updateRestButton();
  });

  ui.streamContinueBtn.addEventListener("click", function () {
    ui.streamPopup.style.display = "none";
  });

  hookStatsToUI();
  updateResource("energy");
  hookActionButtonsToUI(runAction);
  hookCampUpgradestoUI();
  hookStorageUpgradesToUI();
  hookGearUpgradesToUI();
  hookSaveControls();

  ui.continueBtn.addEventListener("click", function () {
    ui.introPopup.style.display = "none";

    addStoryEntry(explorationStages.findClearing.story[3]);
  });

  ui.restBtn.addEventListener("click", function () {
    if (gameState.resting) {
      stopResting();
    } else {
      startResting();
    }
  });

  tryLoadGame();
  setInterval(trySaveGame, 5000);
  window.addEventListener("beforeunload", trySaveGame);

  setInterval(gameTick, 50);
};

function hookSaveControls() {
  if (ui.saveGameBtn) {
    ui.saveGameBtn.addEventListener("click", function () {
      trySaveGame();
    });
  }

  if (ui.loadGameBtn) {
    ui.loadGameBtn.addEventListener("click", function () {
      tryLoadGame();
    });
  }

  if (ui.resetSaveBtn) {
    ui.resetSaveBtn.addEventListener("click", function () {
      if (!window.confirm("Reset your saved game?")) return;

      resetSave();
    });
  }
}

// Rest Button Text Toggle
function updateRestButton() {
  if (gameState.resting) {
    ui.restBtn.classList.add("running");
  } else {
    ui.restBtn.classList.remove("running");
  }
}

// Passive Interval Function - Drives the passive resource updates
function gameTick() {
  for (let resourceName in resources) {
    addResource(resourceName, resources[resourceName].perSecond / 20);
  }

  if (gameState.resting) {
    const restDuration = 1000;
    const restProgressFill = ui.restBtn.querySelector(".restProgressFill");

    if (resources.energy.value >= resources.energy.maxValue) {
      stopResting();
      resumeAutoActionAfterRest();
      return;
    }

    const elapsed = Date.now() - gameState.restStartTime;
    const progress = Math.min(elapsed / restDuration, 1);

    restProgressFill.style.width = progress * 100 + "%";

    if (progress >= 1) {
      addResource("energy", resources.energy.restPerSecond);
      gameState.restStartTime = Date.now();
      restProgressFill.style.width = "0%";
    }
  }
  processTravelTick();
}

function startResting() {
  if (resources.energy.value >= resources.energy.maxValue) return;

  gameState.resting = true;
  gameState.restStartTime = Date.now();
  updateRestButton();
}

function stopResting() {
  gameState.resting = false;
  gameState.restStartTime = null;

  const restProgressFill = ui.restBtn.querySelector(".restProgressFill");

  if (restProgressFill) {
    restProgressFill.style.width = "0%";
  }

  updateRestButton();
}
