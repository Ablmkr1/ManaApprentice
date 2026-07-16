let lastTickTime = Date.now();

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

  ui.outskirtsCompleteContinueBtn.addEventListener("click", function () {
    ui.outskirtsCompletePopup.style.display = "none"
  })

  hookStatsToUI();
  updateResource("energy");
  hookActionButtonsToUI(runAction);
  hookCampUpgradestoUI();
  hookStorageUpgradesToUI();
  hookGearUpgradesToUI();
  hookResourceCraftsToUI();
  hookSaveControls();

  ui.continueBtn.addEventListener("click", function () {
    ui.introPopup.style.display = "none";

    addStoryEntry(getExplorationStage("findClearing").story[3]);
  });

  ui.restBtn.addEventListener("click", function () {
    if (isActivityActive() && gameState.activity.kind === "rest") {
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
  const isResting = isActivityActive() && gameState.activity.kind === "rest";

  if (isResting) {
    ui.restBtn.classList.add("running");
  } else {
    ui.restBtn.classList.remove("running");
  }
}

// Passive Interval Function - Drives the passive resource updates
function gameTick() {
  const now = Date.now();
  const deltaSeconds = (now - lastTickTime) / 1000;
  lastTickTime = now;

  const resourceDefinitions = getResourceDefinitions();

  for (let resourceName in resourceDefinitions) {
    addResource(resourceName, resourceDefinitions[resourceName].perSecond * deltaSeconds);
  }

  processActivityTick();
}

function startResting() {
  if (getResource("energy").value >= getResource("energy").maxValue) return;
  if (isActivityActive()) return;

  startActivity({
    kind: "rest",
    id: "rest",
    duration: 1,
    interval: true,
  });

  updateRestButton();
  updateAllActionButtons();
  updateCraftingButtons();
}

function stopResting() {
  if (isActivityActive() && gameState.activity.kind === "rest") {
    resetActivity();
  }

  const restProgressFill = ui.restBtn.querySelector(".progressFill");

  if (restProgressFill) {
    restProgressFill.style.width = "0%";
  }

  updateRestButton();
  updateAllActionButtons();
  updateCraftingButtons();
}
