const ui = {};
let resourceElements = {};
let panelElements = {};

function hookDomToUI() {
  ui.introPopup = document.getElementById("introPopup");
  ui.continueBtn = document.getElementById("continueBtn");
  ui.restBtn = document.getElementById("restBtn");
  ui.clearingPopup = document.getElementById("clearingPopup");
  ui.clearingContinueBtn = document.getElementById("clearingContinueBtn");
  ui.campPanel = document.getElementById("campPanel");
  ui.streamPopup = document.getElementById("streamPopup");
  ui.streamContinueBtn = document.getElementById("streamContinueBtn");
  ui.waterAmount = document.getElementById("waterAmount");
  ui.foodAmount = document.getElementById("foodAmount");
  ui.woodAmount = document.getElementById("woodAmount");
  ui.smallFire = document.getElementById("smallFire");
  ui.crudeLeanTo = document.getElementById("crudeLeanTo");
  ui.smallFireBtn = document.getElementById("smallFireBtn");
  ui.crudeLeanToBtn = document.getElementById("crudeLeanToBtn");
  ui.expeditionPanel = document.getElementById("expeditionPanel");
  ui.expeditionDistanceAmount = document.getElementById("expeditionDistanceAmount");
  ui.fiberAmount = document.getElementById("fiberAmount");
  ui.storyLog = document.getElementById("storyLog");
  ui.trapAmount = document.getElementById("trapAmount");
  ui.peltAmount = document.getElementById("peltAmount");
  ui.carriedAmount = document.getElementById("carriedAmount");
  ui.carriedWaterAmount = document.getElementById("carriedWaterAmount");
  ui.characterEnergyAmount = document.getElementById("characterEnergyAmount");
  ui.campPanelTitle = document.getElementById("campPanelTitle");
  ui.gearSection = document.getElementById("gearSection");
  ui.crudeSatchel = document.getElementById("crudeSatchel");
  ui.crudeSatchelBtn = document.getElementById("crudeSatchelBtn");
}

//Hook Ui Maps Functions
function hookUIMaps() {
  resourceElements = {
    water: ui.waterAmount,
    food: ui.foodAmount,
    wood: ui.woodAmount,
    fiber: ui.fiberAmount,
    trap: ui.trapAmount,
    pelt: ui.peltAmount,
  };

  panelElements = {
    camp: ui.campPanel,
    expedition: ui.expeditionPanel,
  };
}

//UI Safety Function
function safeSetText(el, text) {
  if (el) {
    el.textContent = text;
  }
}

//UI Show/Hide Helpers
function showElement(el, displayType = "flex") {
  if (el) {
    el.style.display = displayType;
  }
}

function hideElement(el) {
  if (el) {
    el.style.display = "none";
  }
}

//Hook to UI Function
function hookStatsToUI() {
  for (let resourceName in resources) {
    const resource = resources[resourceName];

    resource.display = document.getElementById(resourceName + "Amount");
    resource.perClickDisplay = document.getElementById(resourceName + "PerClickDisplay");
    resource.perSecondDisplay = document.getElementById(resourceName + "PerSecondDisplay");
  }
}

//Update Resource UI
function updateResource(resourceName) {
  const resource = resources[resourceName];

  const text = resource.label + ": " + Math.floor(resource.value * 10) / 10 + " / " + resource.maxValue;

  safeSetText(resource.display, text);

  if (resourceName === "energy") {
    safeSetText(ui.characterEnergyAmount, text);
  }

  safeSetText(resource.perClickDisplay, "+" + resource.perClick + "/Click");
  safeSetText(resource.perSecondDisplay, "+" + resource.perSecond + "/Sec");
}

//UI Unlock Resource and Panels
function unlockResource(resourceName) {
  const resourceElement = resourceElements[resourceName];

  if (!resourceElement) {
    console.warn("Unknown resource unlock:", resourceName);
    return;
  }

  showElement(resourceElement, "block");
}

function unlockPanel(panelName) {
  const panel = panelElements[panelName];

  if (!panel) {
    console.warn("Unknown panel unlock:", panelName);
    return;
  }

  showElement(panel);
}

//Discover Clearing Popup & Function & CampDisplay
function showClearingPopup() {
  ui.clearingPopup.style.display = "flex";
}

function showStreamPopup() {
  ui.streamPopup.style.display = "flex";
}

function showCampPanel() {
  ui.campPanel.style.display = "flex";
}

//Update Expedition UI
function updateExpeditionUI(carriedTotal, carriedSummary) {
  const expedition = gameState.expedition;

  safeSetText(ui.expeditionDistanceAmount, "Distance: " + expedition.distance + " / " + expedition.targetDistance);

  safeSetText(ui.carriedAmount, "Carried: " + carriedTotal + " / " + expedition.carryCapacity + " (" + carriedSummary + ")");
  safeSetText(ui.carriedWaterAmount, "Water: " + expedition.water + " / " + expedition.waterCapacity);
}

//Add story event helper
function addStoryEntry(text) {
  const entry = document.createElement("div");
  entry.classList.add("story-entry");
  entry.textContent = text;
  ui.storyLog.appendChild(entry);
  ui.storyLog.scrollTop = ui.storyLog.scrollHeight;
}

//Update Camp Upgrade UI
function updateCampUpgradeDisplay(upgrade) {
  if (!upgrade) return;

  if (upgrade.button) {
    upgrade.button.style.display = upgrade.unlocked && !upgrade.purchased ? "inline-block" : "none";
  }

  if (upgrade.display) {
    upgrade.display.style.display = upgrade.purchased ? "flex" : "none";
  }
}

function updateActionButton(actionName) {
  const action = actions[actionName];

  if (!action || !action.button) return;

  action.button.style.display = action.unlocked ? "inline-block" : "none";
}

function setProgressBar(action, progress) {
  if (action.progressBar) {
    action.progressBar.style.width = progress * 100 + "%";
  }
}

function resetProgressBar(action) {
  if (action.progressBar) {
    action.progressBar.style.width = "0%";
  }
}

function updateTravelButton(isTraveling) {
  const travelButton = actions.travel.button;

  if (!travelButton) return;

  const label = travelButton.querySelector("span");

  if (label) {
    label.textContent = isTraveling ? "Pause Travel" : "Travel";
  }
}

//Hook Action Button Function
function hookActionButtonsToUI(onActionClick) {
  const buttons = document.querySelectorAll(".action-btn");

  buttons.forEach((btn) => {
    const actionName = btn.dataset.action;
    const action = actions[actionName];

    if (!action) return;

    action.button = btn;
    action.progressBar = btn.querySelector(".progressFill");
    action.metaProgressBar = btn.querySelector(".metaProgressFill");
    updateActionButton(actionName);

    btn.addEventListener("click", function () {
      onActionClick(actionName);
    });
  });
}
