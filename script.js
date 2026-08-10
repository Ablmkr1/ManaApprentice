let lastRealTickTime = Date.now();
let gameClockTime = lastRealTickTime;
let devGameSpeedMultiplier = 1;
const DEV_GAME_SPEED_MULTIPLIERS = [1, 5, 10];

window.onload = function () {
  hookDomToUI();
  hookUIMaps();
  hookActionCompletions();
  ensureSkillsState();
  ensureProjectsState();
  recalculateCharacterStats();
  recalculateCampEffects();
  recalculateToolEffects();

  ui.campEstablishedContinueBtn.addEventListener("click", function () {
    ui.campEstablishedPopup.style.display = "none";
  });

  ui.outskirtsCompleteContinueBtn.addEventListener("click", function () {
    ui.outskirtsCompletePopup.style.display = "none";
  });

  ui.recallAwakenedContinueBtn.addEventListener("click", function () {
    ui.recallAwakenedPopup.style.display = "none";
  });

  ui.torchSparkContinueBtn.addEventListener("click", function () {
    ui.torchSparkPopup.style.display = "none";
  });

  ui.manaAwakenedContinueBtn.addEventListener("click", function () {
    ui.manaAwakenedPopup.style.display = "none";
  });

  ui.campFoundationContinueBtn.addEventListener("click", function () {
    ui.campFoundationPopup.style.display = "none";
  });

  hookStatsToUI();
  updateCurrentGoalUI();
  updateJournalUI();
  updateRegionalMapVisibility();
  updateAllResources();
  hookActionButtonsToUI(runAction);
  hookCampUpgradestoUI();
  hookGearUpgradesToUI();
  hookResourceCraftsToUI();
  hookSaveControls();
  hookDevSpeedControls();
  hookWorkTabs();

  ui.continueBtn.addEventListener("click", function () {
    ui.introPopup.style.display = "none";
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

function hookWorkTabs() {
  if (ui.craftingTabBtn) {
    ui.craftingTabBtn.addEventListener("click", function () {
      showWorkPanel("crafting");
    });
  }

  if (ui.researchTabBtn) {
    ui.researchTabBtn.addEventListener("click", function () {
      showWorkPanel("research");
    });
  }

  if (ui.automationTabBtn) {
    ui.automationTabBtn.addEventListener("click", function () {
      showWorkPanel("automation");
    });
  }

  if (ui.projectTabBtn) {
    ui.projectTabBtn.addEventListener("click", function () {
      showWorkPanel("projects");
    });
  }
}

function hookDevSpeedControls() {
  if (!Array.isArray(ui.devSpeedButtons)) return;

  ui.devSpeedButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      setDevGameSpeedMultiplier(Number(button.dataset.speed));
    });
  });

  updateDevSpeedControls();
}

function setDevGameSpeedMultiplier(multiplier) {
  if (!DEV_GAME_SPEED_MULTIPLIERS.includes(multiplier)) return;

  advanceGameClock(Date.now());
  devGameSpeedMultiplier = multiplier;
  updateDevSpeedControls();
}

function resetDevGameSpeedMultiplier() {
  const now = Date.now();

  lastRealTickTime = now;
  gameClockTime = now;
  devGameSpeedMultiplier = 1;
  updateDevSpeedControls();
}

function getDevGameSpeedMultiplier() {
  return devGameSpeedMultiplier;
}

function getGameTime() {
  return gameClockTime;
}

function advanceGameClock(now) {
  const realDeltaSeconds = Math.max(0, (now - lastRealTickTime) / 1000);
  const deltaSeconds = realDeltaSeconds * getDevGameSpeedMultiplier();

  lastRealTickTime = now;
  gameClockTime += deltaSeconds * 1000;

  return deltaSeconds;
}

function updateDevSpeedControls() {
  if (!Array.isArray(ui.devSpeedButtons)) return;

  ui.devSpeedButtons.forEach(function (button) {
    const speed = Number(button.dataset.speed);
    button.classList.toggle("active", speed === devGameSpeedMultiplier);
  });
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
  const deltaSeconds = advanceGameClock(now);

  const resourceDefinitions = getResourceDefinitions();

  for (let resourceName in resourceDefinitions) {
    const amount = resourceDefinitions[resourceName].perSecond * deltaSeconds;

    if (amount !== 0) {
      addResource(resourceName, amount);
    }
  }

  processAutomation(deltaSeconds);
  processActivityTick();
}

function startResting() {
  if (getResource("energy").value >= getResource("energy").maxValue) return;
  if (isActivityActive()) return;

  startActivity({
    kind: "rest",
    id: "rest",
    duration: getRestDuration(),
    interval: true,
  });

  updateRestButton();
  updateAllActionButtons();
  updateCraftingButtons();
  updatePlacePanel();
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
  updatePlacePanel();
}
