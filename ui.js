const ui = {};
let resourceElements = {};
let panelElements = {};
const MAIN_VIEW_NAMES = ["camp", "expedition", "magic", "tower", "journal"];
let currentMainView = null;
let mainViewUserSelected = false;

function hookDomToUI() {
  ui.introPopup = document.getElementById("introPopup");
  ui.continueBtn = document.getElementById("continueBtn");
  ui.restBtn = document.getElementById("restBtn");
  ui.campEstablishedPopup = document.getElementById("campEstablishedPopup");
  ui.campEstablishedContinueBtn = document.getElementById("campEstablishedContinueBtn");
  ui.campPanel = document.getElementById("campPanel");
  ui.waterAmount = document.getElementById("waterAmount");
  ui.foodAmount = document.getElementById("foodAmount");
  ui.woodAmount = document.getElementById("woodAmount");
  ui.fuelAmount = document.getElementById("fuelAmount");
  ui.imbuedWoodAmount = document.getElementById("imbuedWoodAmount");
  ui.smallFire = document.getElementById("smallFire");
  ui.crudeLeanTo = document.getElementById("crudeLeanTo");
  ui.smallFireBtn = document.getElementById("smallFireBtn");
  ui.crudeLeanToBtn = document.getElementById("crudeLeanToBtn");
  ui.expeditionPanel = document.getElementById("expeditionPanel");
  ui.expeditionPanelTitle = document.getElementById("expeditionPanelTitle");
  ui.expeditionDistanceAmount = document.getElementById("expeditionDistanceAmount");
  ui.fiberAmount = document.getElementById("fiberAmount");
  ui.storyLog = document.getElementById("storyLog");
  ui.trapAmount = document.getElementById("trapAmount");
  ui.peltAmount = document.getElementById("peltAmount");
  ui.carriedAmount = document.getElementById("carriedAmount");
  ui.carriedWaterAmount = document.getElementById("carriedWaterAmount");
  ui.trainingSection = document.getElementById("trainingSection");
  ui.trainingList = document.getElementById("trainingList");
  ui.campPanelTitle = document.getElementById("campPanelTitle");
  ui.gearSection = document.getElementById("gearSection");
  ui.crudeSatchel = document.getElementById("crudeSatchel");
  ui.crudeSatchelBtn = document.getElementById("crudeSatchelBtn");
  ui.campContent = document.getElementById("campContent");
  ui.locationContent = document.getElementById("locationContent");
  ui.locationDescription = document.getElementById("locationDescription");
  ui.stoneAmount = document.getElementById("stoneAmount");
  ui.inventorySection = document.getElementById("inventorySection");
  ui.trapSitesList = document.getElementById("trapSitesList");
  ui.campLocationObjectActionsSlot = document.getElementById("campLocationObjectActionsSlot");
  ui.expeditionLocationObjectActionsSlot = document.getElementById("expeditionLocationObjectActionsSlot");
  ui.locationObjectActions = document.getElementById("locationObjectActions");
  ui.expeditionDistanceBar = document.getElementById("expeditionDistanceBar");
  ui.expeditionDistanceFill = document.getElementById("expeditionDistanceFill");
  ui.saveGameBtn = document.getElementById("saveGameBtn");
  ui.loadGameBtn = document.getElementById("loadGameBtn");
  ui.resetSaveBtn = document.getElementById("resetSaveBtn");
  ui.devSpeedButtons = Array.from(document.querySelectorAll(".dev-speed-btn"));
  ui.devTierButtons = Array.from(document.querySelectorAll(".dev-tier-btn"));
  ui.destinationActions = document.getElementById("destinationActions");
  ui.craftingSection = document.getElementById("craftingSection");
  ui.outskirtsCompletePopup = document.getElementById("outskirtsCompletePopup");
  ui.outskirtsCompleteContinueBtn = document.getElementById("outskirtsCompleteContinueBtn");
  ui.currentGoalSection = document.getElementById("currentGoalSection");
  ui.currentGoalTitle = document.getElementById("currentGoalTitle");
  ui.currentGoalText = document.getElementById("currentGoalText");
  ui.journalEntries = document.getElementById("journalEntries");
  ui.torchSparkPopup = document.getElementById("torchSparkPopup");
  ui.torchSparkContinueBtn = document.getElementById("torchSparkContinueBtn");
  ui.manaAwakenedPopup = document.getElementById("manaAwakenedPopup");
  ui.manaAwakenedContinueBtn = document.getElementById("manaAwakenedContinueBtn");
  ui.regionalMapSection = document.getElementById("regionalMapSection");
  ui.regionalMap = document.getElementById("regionalMap");
  ui.regionDirection = document.getElementById("regionDirection");
  ui.regionName = document.getElementById("regionName");
  ui.regionStatus = document.getElementById("regionStatus");
  ui.regionDescription = document.getElementById("regionDescription");
  ui.regionProgressText = document.getElementById("regionProgressText");
  ui.regionProgressFill = document.getElementById("regionProgressFill");
  ui.regionTerrain = document.getElementById("regionTerrain");
  ui.regionKnownPlaceCount = document.getElementById("regionKnownPlaceCount");
  ui.packingSection = document.getElementById("packingSection");
  ui.gearSlotsGroup = document.getElementById("gearSlotsGroup");
  ui.gearSlots = document.getElementById("gearSlots");
  ui.toolSlotsGroup = document.getElementById("toolSlotsGroup");
  ui.toolSlots = document.getElementById("toolSlots");
  ui.carriedInventoryStrip = document.getElementById("carriedInventoryStrip");
  ui.campResourcesSection = document.getElementById("campResourcesSection");
  ui.campUpgradeSection = document.getElementById("campUpgradeSection");
  ui.leatherAmount = document.getElementById("leatherAmount");
  ui.locationStorageSection = document.getElementById("locationStorageSection");
  ui.locationStorageList = document.getElementById("locationStorageList");
  ui.oreAmount = document.getElementById("oreAmount");
  ui.ironAmount = document.getElementById("ironAmount");
  ui.herbAmount = document.getElementById("herbAmount");
  ui.glimmerleafAmount = document.getElementById("glimmerleafAmount");
  ui.staminaTonicBaseAmount = document.getElementById("staminaTonicBaseAmount");
  ui.manaTonicBaseAmount = document.getElementById("manaTonicBaseAmount");
  ui.concentratedTonicBaseAmount = document.getElementById("concentratedTonicBaseAmount");
  ui.concentratedManaTonicBaseAmount = document.getElementById("concentratedManaTonicBaseAmount");
  ui.huntingLureAmount = document.getElementById("huntingLureAmount");
  ui.locationTravelSection = document.getElementById("locationTravelSection");
  ui.tonicSlotsGroup = document.getElementById("tonicSlotsGroup");
  ui.tonicSlots = document.getElementById("tonicSlots");
  ui.manaCrystalAmount = document.getElementById("manaCrystalAmount");
  ui.chargedCrystalAmount = document.getElementById("chargedCrystalAmount");
  ui.dungeonSection = document.getElementById("dungeonSection");
  ui.dungeonTitle = document.getElementById("dungeonTitle");
  ui.dungeonMap = document.getElementById("dungeonMap");
  ui.dungeonRoomText = document.getElementById("dungeonRoomText");
  ui.locationContent = document.getElementById("locationContent");
  ui.locationDescription = document.getElementById("locationDescription");
  ui.towerNodePanel = document.getElementById("towerNodePanel");
  ui.dungeonSection = document.getElementById("dungeonSection");
  ui.dungeonTitle = document.getElementById("dungeonTitle");
  ui.dungeonMap = document.getElementById("dungeonMap");
  ui.dungeonRoomText = document.getElementById("dungeonRoomText");
  ui.workTabs = document.getElementById("workTabs");
  ui.craftingTabBtn = document.getElementById("craftingTabBtn");
  ui.researchTabBtn = document.getElementById("researchTabBtn");
  ui.craftingPanel = document.getElementById("craftingPanel");
  ui.researchPanel = document.getElementById("researchPanel");
  ui.researchList = document.getElementById("researchList");
  ui.researchDetails = document.getElementById("researchDetails");
  ui.focusAmount = document.getElementById("focusAmount");
  ui.campUpgradeSlots = document.getElementById("campUpgradeSlots");
  ui.spellSlotsGroup = document.getElementById("spellSlotsGroup");
  ui.spellSlots = document.getElementById("spellSlots");
  ui.spellTargetMenu = document.getElementById("spellTargetMenu");
  ui.campFoundationPopup = document.getElementById("campFoundationPopup");
  ui.campFoundationContinueBtn = document.getElementById("campFoundationContinueBtn");
  ui.personalWardPopup = document.getElementById("personalWardPopup");
  ui.personalWardContinueBtn = document.getElementById("personalWardContinueBtn");
  ui.advancedRecallPopup = document.getElementById("advancedRecallPopup");
  ui.advancedRecallPopupText = document.getElementById("advancedRecallPopupText");
  ui.advancedRecallOptions = document.getElementById("advancedRecallOptions");
  ui.advancedRecallCloseBtn = document.getElementById("advancedRecallCloseBtn");
  ui.dungeonActions = document.getElementById("dungeonActions");
  ui.nailsAmount = document.getElementById("nailsAmount");
  ui.automationTabBtn = document.getElementById("automationTabBtn");
  ui.automationPanel = document.getElementById("automationPanel");
  ui.automationList = document.getElementById("automationList");
  ui.projectPanel = document.getElementById("projectPanel");
  ui.projectList = document.getElementById("projectList");
  ui.recallAwakenedPopup = document.getElementById("recallAwakenedPopup");
  ui.recallAwakenedContinueBtn = document.getElementById("recallAwakenedContinueBtn");
  ui.mainViewTabs = document.getElementById("mainViewTabs");
  ui.mainViewButtons = Array.from(document.querySelectorAll("[data-main-view-tab]"));
  ui.mainViewPanels = Array.from(document.querySelectorAll("[data-main-view-panel]"));
  ui.magicPanel = document.getElementById("magicPanel");
  ui.towerPanel = document.getElementById("towerPanel");
  ui.expeditionWorkflowPanel = document.getElementById("expeditionWorkflowPanel");
  ui.magicWorkflowPanel = document.getElementById("magicWorkflowPanel");
  ui.magicProgressSection = document.getElementById("magicProgressSection");
  ui.spellProgressList = document.getElementById("spellProgressList");
  ui.towerStatusPanel = document.getElementById("towerStatusPanel");
  ui.journalSwitchTabs = Array.from(document.querySelectorAll("[data-journal-view]"));
  ui.journalSubpanels = Array.from(document.querySelectorAll("[data-journal-panel]"));
}

//Hook Ui Maps Functions
function hookUIMaps() {
  resourceElements = {
    water: ui.waterAmount,
    food: ui.foodAmount,
    wood: ui.woodAmount,
    fuel: ui.fuelAmount,
    imbuedWood: ui.imbuedWoodAmount,
    fiber: ui.fiberAmount,
    trap: ui.trapAmount,
    pelt: ui.peltAmount,
    stone: ui.stoneAmount,
    mana: document.getElementById("manaAmount"),
    ward: document.getElementById("wardAmount"),
    leather: ui.leatherAmount,
    ore: ui.oreAmount,
    iron: ui.ironAmount,
    herb: ui.herbAmount,
    glimmerleaf: ui.glimmerleafAmount,
    staminaTonicBase: ui.staminaTonicBaseAmount,
    manaTonicBase: ui.manaTonicBaseAmount,
    concentratedTonicBase: ui.concentratedTonicBaseAmount,
    concentratedManaTonicBase: ui.concentratedManaTonicBaseAmount,
    huntingLure: ui.huntingLureAmount,
    manaCrystal: ui.manaCrystalAmount,
    chargedCrystal: ui.chargedCrystalAmount,
    focus: ui.focusAmount,
    nails: ui.nailsAmount,
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

function appendUiText(parent, tagName, className, text) {
  if (!parent || text === undefined || text === null || text === "") return null;

  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  element.textContent = text;
  parent.appendChild(element);
  return element;
}

function createUiEmptyState(text) {
  const empty = document.createElement("div");
  empty.className = "ui-empty-state research-empty";
  empty.textContent = text;

  return empty;
}

function createUiProgressMeter(options = {}) {
  const current = Number.isFinite(options.current) ? options.current : 0;
  const max = Number.isFinite(options.max) ? options.max : 0;
  const explicitPercent = Number.isFinite(options.percent) ? options.percent : null;
  const percent = explicitPercent !== null ? explicitPercent : max > 0 ? current / max : 0;
  const clampedPercent = Math.min(Math.max(percent, 0), 1);

  const group = document.createElement("div");
  group.className = "ui-progress-meter";

  if (options.className) {
    group.className += " " + options.className;
  }

  const labelRow = document.createElement("div");
  labelRow.className = "ui-progress-labels training-progress-text";

  appendUiText(labelRow, "span", "", options.label || "Progress");

  if (options.valueText) {
    appendUiText(labelRow, "strong", "", options.valueText);
  } else if (max > 0) {
    appendUiText(labelRow, "strong", "", current + " / " + max);
  } else if (options.completeText) {
    appendUiText(labelRow, "strong", "", options.completeText);
  }

  const track = document.createElement("div");
  track.className = "ui-progress-track training-progress-track";

  const fill = document.createElement("div");
  fill.className = "ui-progress-fill training-progress-fill";
  fill.style.width = clampedPercent * 100 + "%";

  track.appendChild(fill);
  group.appendChild(labelRow);
  group.appendChild(track);

  return group;
}

function createUiSummaryCard(options = {}) {
  const card = document.createElement("div");
  card.className = "ui-summary-card";

  if (options.className) {
    card.className += " " + options.className;
  }

  const header = document.createElement("div");
  header.className = "ui-summary-card-header";

  appendUiText(header, "strong", "ui-summary-card-title", options.title || "");
  appendUiText(header, "span", "ui-summary-card-meta", options.meta || "");
  card.appendChild(header);

  appendUiText(card, "p", "ui-summary-card-body", options.body || "");

  if (options.progress) {
    card.appendChild(createUiProgressMeter(options.progress));
  }

  appendUiText(card, "div", "ui-summary-card-detail", options.detail || "");

  return card;
}

function createUiContextPanel(options = {}) {
  const panel = document.createElement("section");
  panel.className = "ui-context-panel";

  if (options.className) {
    panel.className += " " + options.className;
  }

  const header = document.createElement("div");
  header.className = "ui-context-panel-header";

  appendUiText(header, "h3", "ui-context-panel-title", options.title || "");
  appendUiText(header, "span", "ui-context-panel-status", options.status || "");
  panel.appendChild(header);

  appendUiText(panel, "p", "ui-context-panel-body", options.body || "");

  if (Array.isArray(options.meta) && options.meta.length > 0) {
    const metaList = document.createElement("div");
    metaList.className = "ui-context-meta-list";

    options.meta.forEach(function (item) {
      const metaItem = document.createElement("div");
      metaItem.className = "ui-context-meta-item";

      if (item && typeof item === "object") {
        appendUiText(metaItem, "span", "", item.label || "");
        appendUiText(metaItem, "strong", "", item.value || "");
      } else {
        metaItem.textContent = item;
      }

      metaList.appendChild(metaItem);
    });

    panel.appendChild(metaList);
  }

  if (Array.isArray(options.actions) && options.actions.length > 0) {
    const actions = document.createElement("div");
    actions.className = "ui-context-actions";

    options.actions.forEach(function (action) {
      if (action instanceof Node) {
        actions.appendChild(action);
      }
    });

    panel.appendChild(actions);
  }

  return panel;
}

function renderUiContextPanel(container, options = {}) {
  if (!container) return null;

  container.innerHTML = "";
  container.appendChild(createUiContextPanel(options));
  return container.firstElementChild;
}

function createUiSlot(options = {}) {
  const slot = document.createElement("div");
  slot.className = "ui-slot equipment-slot";

  if (options.className) {
    slot.className += " " + options.className;
  }

  const box = document.createElement("div");
  box.className = "ui-slot-box equipment-box";
  box.textContent = options.itemLabel || "Empty";

  if (options.title) {
    box.title = options.title;
  }

  if (options.interactive) {
    box.classList.add("ui-slot-interactive");
    box.setAttribute("role", "button");
    box.setAttribute("tabindex", "0");
  }

  if (typeof options.onActivate === "function") {
    box.addEventListener("click", function () {
      options.onActivate();
    });

    box.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        options.onActivate();
      }
    });
  }

  appendUiText(slot, "div", "ui-slot-label equipment-slot-label", options.slotLabel || "");
  slot.insertBefore(box, slot.firstChild);

  return {
    slot,
    box,
  };
}

function getUiActionLabelElement(button) {
  if (!button) return null;

  const existingLabel = button.querySelector(".ui-action-label");

  if (existingLabel) return existingLabel;

  const craftLabel = button.querySelector(".craft-name");

  if (craftLabel) return craftLabel;

  const spans = Array.from(button.querySelectorAll("span"));

  return (
    spans.find(function (span) {
      return !span.classList.contains("ui-action-cost") && !span.classList.contains("ui-action-detail") && !span.classList.contains("craft-cost");
    }) || null
  );
}

function getDirectButtonText(button) {
  if (!button) return "";

  return Array.from(button.childNodes)
    .filter(function (node) {
      return node.nodeType === Node.TEXT_NODE && node.textContent.trim();
    })
    .map(function (node) {
      return node.textContent.trim();
    })
    .join(" ");
}

function clearDirectButtonText(button) {
  if (!button) return;

  Array.from(button.childNodes).forEach(function (node) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      button.removeChild(node);
    }
  });
}

function prepareUiActionButton(button, options = {}) {
  if (!button) return null;

  const shouldAddActionClass = options.actionClass !== false;
  const shouldEnsureProgress = options.progress !== false;
  const labelClass = options.labelClass || "ui-action-label";
  const costClass = options.costClass || "ui-action-cost";
  const detailClass = options.detailClass || "ui-action-detail";
  const directText = getDirectButtonText(button);

  if (shouldAddActionClass) {
    button.classList.add("action-btn");
  }

  button.classList.add("ui-action-button");
  clearDirectButtonText(button);

  let progressFill = button.querySelector(".progressFill");

  if (!progressFill && shouldEnsureProgress) {
    progressFill = document.createElement("div");
    progressFill.className = "progressFill";
    button.prepend(progressFill);
  }

  let label = getUiActionLabelElement(button);

  if (!label) {
    label = document.createElement("span");
    button.appendChild(label);
  }

  label.classList.add("ui-action-label");

  if (labelClass !== "ui-action-label") {
    label.classList.add(labelClass);
  }

  if (directText && !label.textContent.trim()) {
    label.textContent = directText;
  }

  let cost = button.querySelector("." + costClass) || button.querySelector(".ui-action-cost");

  if (!cost) {
    cost = document.createElement("span");
    button.appendChild(cost);
  }

  cost.classList.add("ui-action-cost");

  if (costClass !== "ui-action-cost") {
    cost.classList.add(costClass);
  }

  let detail = button.querySelector("." + detailClass) || button.querySelector(".ui-action-detail");

  if (!detail) {
    detail = document.createElement("span");
    button.appendChild(detail);
  }

  detail.classList.add("ui-action-detail");

  if (detailClass !== "ui-action-detail") {
    detail.classList.add(detailClass);
  }

  if (!cost.textContent.trim()) {
    cost.style.display = "none";
  }

  if (!detail.textContent.trim()) {
    detail.style.display = "none";
  }

  return {
    progressFill,
    label,
    cost,
    detail,
  };
}

function setUiActionButtonLabel(button, options = {}) {
  const parts = prepareUiActionButton(button, options);

  if (!parts) return null;

  if (options.label !== undefined) {
    parts.label.textContent = options.label || "";
  }

  if (options.cost !== undefined) {
    parts.cost.textContent = options.cost || "";
    parts.cost.style.display = options.cost ? "block" : "none";
  }

  if (options.detail !== undefined) {
    parts.detail.textContent = options.detail || "";
    parts.detail.style.display = options.detail ? "block" : "none";
  }

  return parts;
}

function createUiActionButton(options = {}) {
  const button = document.createElement("button");
  button.type = options.type || "button";
  button.className = "action-btn";

  if (options.className) {
    button.className += " " + options.className;
  }

  if (options.dataset) {
    Object.keys(options.dataset).forEach(function (key) {
      button.dataset[key] = options.dataset[key];
    });
  }

  setUiActionButtonLabel(button, {
    label: options.label || "",
    cost: options.cost || "",
    detail: options.detail || "",
    progress: options.progress !== false,
  });

  if (typeof options.onClick === "function") {
    button.addEventListener("click", options.onClick);
  }

  return button;
}

function getUiActionCostText(actionName) {
  if (typeof getActionCost !== "function" || typeof formatCost !== "function") return "";

  return formatCost(getActionCost(actionName));
}

function hookMainViewTabs() {
  if (!Array.isArray(ui.mainViewButtons)) return;

  ui.mainViewButtons.forEach(function (button) {
    if (button.dataset.mainViewHooked) return;

    button.addEventListener("click", function () {
      setMainView(button.dataset.mainViewTab, { userSelected: true });
    });

    button.dataset.mainViewHooked = "true";
  });

  syncMainViewAvailability();
}

function hookJournalViewTabs() {
  if (!Array.isArray(ui.journalSwitchTabs) || !Array.isArray(ui.journalSubpanels)) return;

  ui.journalSwitchTabs.forEach(function (button) {
    if (button.dataset.journalViewHooked) return;

    button.addEventListener("click", function () {
      setJournalSubView(button.dataset.journalView);
    });

    button.dataset.journalViewHooked = "true";
  });

  setJournalSubView("entries");
}

function setJournalSubView(viewName) {
  if (!Array.isArray(ui.journalSwitchTabs) || !Array.isArray(ui.journalSubpanels)) return;

  const targetView = viewName === "world" ? "world" : "entries";

  ui.journalSwitchTabs.forEach(function (button) {
    const active = button.dataset.journalView === targetView;

    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });

  ui.journalSubpanels.forEach(function (panel) {
    panel.classList.toggle("active", panel.dataset.journalPanel === targetView);
  });
}

function setMainView(viewName, options = {}) {
  if (!MAIN_VIEW_NAMES.includes(viewName)) return;

  const targetView = isMainViewAvailable(viewName) ? viewName : getDefaultMainView();

  currentMainView = targetView;

  if (options.userSelected) {
    mainViewUserSelected = true;
  }

  updateMainViewTabStates();
}

function syncMainViewAvailability() {
  if (!Array.isArray(ui.mainViewButtons) || !Array.isArray(ui.mainViewPanels)) return;

  syncContextPanelVisibility();

  const defaultView = getDefaultMainView();
  const shouldUseDefault = !currentMainView || !isMainViewAvailable(currentMainView) || (!mainViewUserSelected && currentMainView !== defaultView);

  setMainView(shouldUseDefault ? defaultView : currentMainView);
}

function syncContextPanelVisibility() {
  showElement(ui.campPanel, "flex");

  if (isMainViewAvailable("expedition")) {
    showElement(ui.expeditionPanel, "flex");
  } else {
    hideElement(ui.expeditionPanel);
  }

  if (isMainViewAvailable("magic")) {
    showElement(ui.magicPanel, "flex");
  } else {
    hideElement(ui.magicPanel);
  }

  if (isMainViewAvailable("tower")) {
    showElement(ui.towerPanel, "flex");
  } else {
    hideElement(ui.towerPanel);
  }
}

function updateMainViewTabStates() {
  if (!Array.isArray(ui.mainViewButtons) || !Array.isArray(ui.mainViewPanels)) return;

  ui.mainViewButtons.forEach(function (button) {
    const viewName = button.dataset.mainViewTab;
    const available = isMainViewAvailable(viewName);
    const isActive = viewName === currentMainView;

    button.style.display = available ? "inline-block" : "none";
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  ui.mainViewPanels.forEach(function (panel) {
    const isActive = panel.dataset.mainViewPanel === currentMainView;

    panel.classList.toggle("active", isActive);
  });
}

function getDefaultMainView() {
  if (isMainViewAvailable("expedition") && (gameState.expedition.active || gameState.expedition.currentLocation)) {
    return "expedition";
  }

  return "camp";
}

function isMainViewAvailable(viewName) {
  if (viewName === "camp" || viewName === "journal") return true;

  if (viewName === "expedition") {
    return gameState.phase === "expedition" || !!gameState.expedition.active || !!gameState.expedition.currentLocation;
  }

  if (viewName === "magic") {
    return hasMagicViewContent();
  }

  if (viewName === "tower") {
    return typeof hasVisibleProject === "function" && hasVisibleProject();
  }

  return false;
}

function hasMagicViewContent() {
  if (gameState.magicUnlocked) return true;
  if (typeof hasUnlockedSpell === "function" && hasUnlockedSpell()) return true;

  if (typeof getAction === "function") {
    const magicActionNames = ["meditate", "concentrateTonicBase", "concentrateManaTonicBase"];

    for (let i = 0; i < magicActionNames.length; i++) {
      const action = getAction(magicActionNames[i]);

      if (action && action.unlocked) return true;
    }
  }

  return false;
}

//Hook to UI Function
function hookStatsToUI() {
  const resourceDefinitions = getResourceDefinitions();

  for (let resourceName in resourceDefinitions) {
    const resource = resourceDefinitions[resourceName];

    resource.display = document.getElementById(resourceName + "Amount");
    resource.perClickDisplay = document.getElementById(resourceName + "PerClickDisplay");
    resource.perSecondDisplay = document.getElementById(resourceName + "PerSecondDisplay");
  }
}

//Update Resource UI
function updateResource(resourceName) {
  const resource = getResource(resourceName);

  const text = resource.label + ": " + formatResourceAmountForDisplay(resource.value) + " / " + resource.maxValue;

  safeSetText(resource.display, text);

  safeSetText(resource.perClickDisplay, "+" + resource.perClick + "/Click");
  safeSetText(resource.perSecondDisplay, "+" + resource.perSecond + "/Sec");
  updateAllActionButtons();
}

function updateAllResources() {
  const resourceDefinitions = getResourceDefinitions();

  for (let resourceName in resourceDefinitions) {
    updateResource(resourceName);
  }
}

function updateAllActionButtons() {
  const actionDefinitions = getActionDefinitions();

  for (let actionName in actionDefinitions) {
    updateActionButton(actionName);
  }

  if (typeof updateProjectButtons === "function") {
    updateProjectButtons();
  }

  if (typeof updateTowerNodeButtons === "function") {
    updateTowerNodeButtons();
  }

  if (typeof syncMainViewAvailability === "function") {
    syncMainViewAvailability();
  }

  updateWorkflowPanels();
}

//UI Unlock Resource and Panels
function unlockResource(resourceName) {
  const resource = getResource(resourceName);
  const resourceElement = resourceElements[resourceName];

  if (!resourceElement) {
    if (resource) return;

    console.warn("Unknown resource unlock:", resourceName);
    return;
  }

  showElement(resourceElement, "block");

  updateCampResourcesSectionVisibility();
}

function updateCampResourcesSectionVisibility() {
  if (!ui.campResourcesSection) return;

  const campResourceNames = [
    "food",
    "wood",
    "fuel",
    "imbuedWood",
    "fiber",
    "trap",
    "pelt",
    "stone",
    "leather",
    "ore",
    "iron",
    "herb",
    "glimmerleaf",
    "staminaTonicBase",
    "manaTonicBase",
    "concentratedTonicBase",
    "concentratedManaTonicBase",
    "huntingLure",
    "manaCrystal",
    "chargedCrystal",
    "nails",
  ];

  for (let i = 0; i < campResourceNames.length; i++) {
    const resourceElement = resourceElements[campResourceNames[i]];

    if (resourceElement && resourceElement.style.display !== "none") {
      showElement(ui.campResourcesSection, "block");
      return;
    }
  }

  hideElement(ui.campResourcesSection);
}

function unlockPanel(panelName) {
  const panel = panelElements[panelName];

  if (!panel) {
    console.warn("Unknown panel unlock:", panelName);
    return;
  }

  showElement(panel);

  if (typeof syncMainViewAvailability === "function") {
    syncMainViewAvailability();
  }
}

//Discover Popup & Function & CampDisplay
function showCampEstablishedPopup() {
  ui.campEstablishedPopup.style.display = "flex";
}

function showCampPanel() {
  ui.campPanel.style.display = "flex";
}

function showOutskirtsCompletePopup() {
  ui.outskirtsCompletePopup.style.display = "flex";
}

function showRecallAwakenedPopup() {
  ui.recallAwakenedPopup.style.display = "flex";
}

function showTorchSparkPopup() {
  ui.torchSparkPopup.style.display = "flex";
}

function showManaAwakenedPopup() {
  ui.manaAwakenedPopup.style.display = "flex";
}

function showCampFoundationPopup() {
  ui.campFoundationPopup.style.display = "flex";
}

function showPersonalWardPopup() {
  ui.personalWardPopup.style.display = "flex";
}

//Update Expedition UI
function updateExpeditionUI(carriedTotal, carriedSummary) {
  const expedition = gameState.expedition;
  const travelTargetDistance = expedition.active ? expedition.targetDistance : getSelectedTravelDistance();
  const travelDistance = expedition.active ? getDisplayedExpeditionDistance() : 0;

  safeSetText(ui.expeditionDistanceAmount, "Distance: " + formatDistance(travelDistance) + " / " + formatDistance(travelTargetDistance));

  const distanceProgress = travelTargetDistance > 0 ? travelDistance / travelTargetDistance : 0;
  const clampedDistanceProgress = Math.min(Math.max(distanceProgress, 0), 1);

  if (ui.expeditionDistanceFill) {
    ui.expeditionDistanceFill.style.width = clampedDistanceProgress * 100 + "%";
  }

  updateBeginExpeditionButtonLabel();

  safeSetText(ui.carriedAmount, "Carried: " + carriedTotal + " / " + getEffectiveCarryCapacity() + " (" + carriedSummary + ")");
  safeSetText(ui.carriedWaterAmount, "Water: " + expedition.water + " / " + expedition.waterCapacity);
}

function formatDistance(distance) {
  return Math.round(distance * 10) / 10;
}

//Add story event helper
function addStoryEntry(text) {
  const entry = document.createElement("div");
  entry.classList.add("story-entry");
  entry.textContent = text;

  ui.storyLog.appendChild(entry);

  while (ui.storyLog.children.length > 30) {
    ui.storyLog.removeChild(ui.storyLog.firstChild);
  }

  ui.storyLog.scrollTop = ui.storyLog.scrollHeight;
}

//Update Camp Upgrade UI
function updateCampUpgradeDisplay(upgrade) {
  if (!upgrade) return;

  if (upgrade.button) {
    upgrade.button.style.display = isCraftContextAvailable(upgrade) && upgrade.unlocked && !upgrade.purchased ? "inline-block" : "none";
  }

  if (typeof renderCampUpgradeSlots === "function") {
    renderCampUpgradeSlots();
  } else {
    updateCampUpgradeSectionVisibility();
  }
}

function updateCampUpgradeSectionVisibility() {
  const campUpgradeDefinitions = getCampUpgradeDefinitions();

  for (let upgradeName in campUpgradeDefinitions) {
    const upgrade = getCampUpgrade(upgradeName);

    if (upgrade.purchased) {
      showElement(ui.campUpgradeSection, "flex");
      return;
    }
  }

  hideElement(ui.campUpgradeSection);
}

function updateActionButton(actionName) {
  const action = getAction(actionName);

  if (!action || !action.button) return;

  prepareUiActionButton(action.button);
  action.button.style.display = action.unlocked ? "inline-block" : "none";
  updateDynamicActionButtonLabel(actionName, action);
  setUiActionButtonLabel(action.button, {
    cost: getUiActionCostText(actionName),
  });

  if (!action.unlocked) {
    action.button.disabled = true;
    return;
  }

  const isCurrentActivity =
    isActivityActive() &&
    ((gameState.activity.kind === "action" && gameState.activity.id === actionName) ||
      (gameState.activity.kind === "travel" && actionName === "travel"));

  action.button.disabled = !action.unlocked || (!isCurrentActivity && isActivityActive()) || !canUseAction(actionName);
}

function updateDynamicActionButtonLabel(actionName, action) {
  if (!action || !action.button) return;

  const label = getUiActionLabelElement(action.button);

  if (!label) return;

  if (actionName === "practiceManaCycling" && typeof getManaCyclingActionLabel === "function") {
    setUiActionButtonLabel(action.button, {
      label: getManaCyclingActionLabel(),
    });
  }
}

function canUseAction(actionName) {
  const action = getAction(actionName);

  if (!action) return false;

  if (action.running) return true;

  if (!canAffordCost(getActionCost(actionName))) return false;

  if (!isActionContextAvailable(actionName)) return false;

  return true;
}

function isCampMeditationContext() {
  return (
    !gameState.expedition.active &&
    !gameState.expedition.currentLocation &&
    (hasPurchasedCampUpgrade("meditationSpot") || hasPurchasedCampUpgrade("attunedMeditationSpot"))
  );
}

function isActionContextAvailable(actionName) {
  const locationName = gameState.expedition.currentLocation;

  if (actionName === "catchBreath") {
    return gameState.phase === "lost" && !gameState.discoveredClearing;
  }

  if (actionName === "travel") {
    const expedition = gameState.expedition;

    return !!expedition.active && !expedition.currentLocation;
  }

  if (actionName === "gatherStone") {
    return typeof canGatherStoneAtCurrentLocation === "function" && canGatherStoneAtCurrentLocation();
  }

  if (actionName === "scoutTrapSite") {
    return !!locationName && !!getFirstHiddenTrapSite(locationName);
  }

  if (actionName === "setTrap") {
    return !!locationName && hasOpenTrapSite(locationName) && gameState.expedition.carriedItems.trap > 0;
  }

  if (actionName === "checkTrap") {
    return !!locationName && hasUncheckedInstalledTrapSite(locationName);
  }

  if (actionName === "trackGame") {
    return !!locationName && canTrackGame(locationName);
  }

  if (actionName === "huntGame") {
    return !!locationName && canHuntGame(locationName);
  }

  if (actionName === "useHuntingLure") {
    return !!locationName && canUseHuntingLure(locationName);
  }

  if (actionName === "storePelt") {
    const location = getExpeditionLocation(locationName);
    return !!location && !!location.storage && location.storage.pelt !== undefined && gameState.expedition.carriedItems.pelt > 0;
  }

  if (actionName === "packStone") {
    return typeof canPackTowerNodeMaterial === "function" && canPackTowerNodeMaterial("stone");
  }

  if (actionName === "packIron") {
    return typeof canPackTowerNodeMaterial === "function" && canPackTowerNodeMaterial("iron");
  }

  if (actionName === "packChargedCrystal") {
    return typeof canPackTowerNodeMaterial === "function" && canPackTowerNodeMaterial("chargedCrystal");
  }

  if (actionName === "takeLeather") {
    const location = getExpeditionLocation(locationName);
    return !!location && !!location.storage && location.storage.leather > 0 && hasCarrySpace("leather", 1);
  }

  if (actionName === "storeWood") {
    const location = getExpeditionLocation(locationName);
    const carriedItems = gameState.expedition.carriedItems;
    const carriedFuelValue = (carriedItems.wood || 0) + (carriedItems.imbuedWood || 0) * 4;

    return !!location && !!location.storage && location.storage.fuel !== undefined && carriedFuelValue > 0;
  }

  if (actionName === "storeOre") {
    const location = getExpeditionLocation(locationName);
    return !!location && !!location.storage && location.storage.ore !== undefined && gameState.expedition.carriedItems.ore > 0;
  }

  if (actionName === "takeIron") {
    const location = getExpeditionLocation(locationName);
    return !!location && !!location.storage && location.storage.iron > 0 && hasCarrySpace("iron", 1);
  }

  if (actionName === "mineOre") {
    return locationName === "ironMine" && hasPurchasedGear("crudeIronPick");
  }

  if (actionName === "storeHerb") {
    const location = getExpeditionLocation(locationName);
    return !!location && !!location.storage && location.storage.herb !== undefined && gameState.expedition.carriedItems.herb > 0;
  }

  if (actionName === "storeGlimmerleaf") {
    const location = getExpeditionLocation(locationName);
    return !!location && !!location.storage && location.storage.glimmerleaf !== undefined && gameState.expedition.carriedItems.glimmerleaf > 0;
  }

  if (actionName === "enterDungeon") {
    return canEnterLocationDungeon(locationName) && (!gameState.expedition.dungeon || !gameState.expedition.dungeon.active);
  }

  if (actionName === "leaveDungeon") {
    return !!gameState.expedition.dungeon && gameState.expedition.dungeon.active;
  }

  if (actionName === "recover") {
    return gameState.phase === "expedition" && !gameState.expedition.active && getRecoverFocusAmount() > 0;
  }

  if (actionName === "meditate") {
    const cave = getExpeditionLocation("creepyCave");
    const canMeditateAtCamp = isCampMeditationContext();
    const canMeditateAtCave =
      gameState.expedition.currentLocation === "creepyCave" && !!cave && cave.explored && gameState.magicUnlocked;

    return canMeditateAtCamp || canMeditateAtCave;
  }

  if (actionName === "concentrateTonicBase") {
    return typeof canUseConcentrateTonicBaseAction === "function" && canUseConcentrateTonicBaseAction();
  }

  if (actionName === "concentrateManaTonicBase") {
    return typeof canUseConcentrateManaTonicBaseAction === "function" && canUseConcentrateManaTonicBaseAction();
  }

  if (actionName === "addWoodToFuel") {
    return !gameState.expedition.active && !gameState.expedition.currentLocation && getResource("wood").value > 0;
  }

  if (actionName === "addImbuedWoodToFuel") {
    return !gameState.expedition.active && !gameState.expedition.currentLocation && getResource("imbuedWood").value > 0;
  }

  if (actionName === "practiceManaCycling") {
    return (
      !gameState.expedition.active &&
      !gameState.expedition.currentLocation &&
      getSkillState("manaCycling").revealed &&
      (typeof canPracticeManaCycling !== "function" || canPracticeManaCycling())
    );
  }

  return true;
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
  const travelButton = getAction("travel").button;

  if (!travelButton) return;

  if (!isTraveling && typeof isTowerNodeJumpExpedition === "function" && isTowerNodeJumpExpedition()) {
    const nodeName = typeof getPreparedTowerNodeName === "function" ? getPreparedTowerNodeName() : null;
    const definition = nodeName && typeof getTowerNodeDefinition === "function" ? getTowerNodeDefinition(nodeName) : null;

    setUiActionButtonLabel(travelButton, {
      label: "Jump to " + ((definition && definition.destinationLabel) || "Tower Node"),
      cost: getUiActionCostText("travel"),
    });
    return;
  }

  setUiActionButtonLabel(travelButton, {
    label: isTraveling ? "Pause Travel" : "Travel",
    cost: isTraveling ? "" : getUiActionCostText("travel"),
  });
}

function updateBeginExpeditionButtonLabel() {
  const action = getAction("beginExpedition");

  if (!action || !action.button) return;

  const regionId = getSelectedTravelRegionId();
  const region = getRegionDefinition(regionId);

  if (!region || regionId === "outskirts") {
    setUiActionButtonLabel(action.button, {
      label: "Prepare for Expedition",
      cost: getUiActionCostText("beginExpedition"),
    });
    return;
  }

  setUiActionButtonLabel(action.button, {
    label: "Prepare for " + region.label + " Expedition",
    cost: getUiActionCostText("beginExpedition"),
  });
}

//Hook Action Button Function
function hookActionButtonsToUI(onActionClick) {
  const buttons = document.querySelectorAll(".action-btn");

  buttons.forEach((btn) => {
    const actionName = btn.dataset.action;
    const action = getAction(actionName);

    if (!action) return;

    prepareUiActionButton(btn);
    action.button = btn;
    action.progressBar = btn.querySelector(".progressFill");
    action.metaProgressBar = btn.querySelector(".metaProgressFill");
    updateActionButton(actionName);

    btn.addEventListener("click", function () {
      onActionClick(actionName);
    });
  });
  updateReturnToCampButtonLabel();
}

function updateExpeditionLoadoutVisibility() {
  const campUnlocked = gameState.phase === "expedition";

  if (campUnlocked) {
    showElement(ui.carriedInventoryStrip, "flex");

    if (hasUnlockedOrPurchasedGear()) {
      showElement(ui.gearSection, "flex");
    } else {
      hideElement(ui.gearSection);
    }
  } else {
    hideElement(ui.carriedInventoryStrip);
    hideElement(ui.gearSection);
  }
}

function hasUnlockedOrPurchasedGear() {
  const gearUpgradeDefinitions = getGearUpgradeDefinitions();

  for (let gearName in gearUpgradeDefinitions) {
    const gear = getGearUpgrade(gearName);

    if (gear.purchased) {
      return true;
    }
  }

  return false;
}

function hasUnlockedSpell() {
  const spells = getSpellDefinitions();

  for (let spellName in spells) {
    const spell = getSpell(spellName);

    if (spell && spell.unlocked) {
      return true;
    }
  }

  return false;
}

function prepareCraftButton(button) {
  if (!button) return;

  prepareUiActionButton(button, {
    labelClass: "craft-name",
    costClass: "craft-cost",
  });
}

function updateCurrentGoalUI() {
  const goal = getGoal(gameState.currentGoalId);

  if (!goal) {
    hideElement(ui.currentGoalSection);
    return;
  }

  showElement(ui.currentGoalSection, "flex");
  safeSetText(ui.currentGoalTitle, goal.title);
  ui.currentGoalText.innerHTML = "";

  if (goal.text) {
    const text = document.createElement("div");
    text.textContent = goal.text;
    ui.currentGoalText.appendChild(text);
  }

  if (Array.isArray(goal.items)) {
    const list = document.createElement("ul");
    list.classList.add("goal-checklist");

    goal.items.forEach(function (item) {
      if (item.isVisible && !item.isVisible()) return;

      const isComplete = item.isComplete ? item.isComplete() : false;
      const listItem = document.createElement("li");
      listItem.classList.toggle("complete", isComplete);

      const status = document.createElement("span");
      status.classList.add("goal-check");
      status.textContent = isComplete ? "[x]" : "[ ]";

      const label = document.createElement("span");
      label.textContent = item.getLabel ? item.getLabel() : item.label;

      listItem.appendChild(status);
      listItem.appendChild(label);
      list.appendChild(listItem);
    });

    ui.currentGoalText.appendChild(list);
  }

  renderCampActivityLine();
  updateWorkflowPanels();
}

function setCurrentGoal(goalId) {
  if (!getGoal(goalId)) {
    console.warn("Unknown goal:", goalId);
    return;
  }

  gameState.currentGoalId = goalId;
  updateCurrentGoalUI();
}

function getCurrentActivitySummaryText() {
  if (!isActivityActive()) return "";

  const activity = gameState.activity;

  if (activity.label) return activity.label;

  if (activity.kind === "action") {
    const action = typeof getAction === "function" ? getAction(activity.id) : null;
    return action ? action.label : activity.id || "Action";
  }

  if (activity.kind === "travel") return "Travel";

  if (activity.kind === "projectWork") {
    const project = typeof getProjectDefinition === "function" ? getProjectDefinition(activity.id) : null;
    return project ? project.label : "Project work";
  }

  if (activity.kind === "craft") {
    const craft = typeof getCraftDefinition === "function" ? getCraftDefinition(activity.type, activity.id) : null;
    return craft ? craft.label : "Crafting";
  }

  if (activity.kind === "spell") {
    const spell = typeof getSpell === "function" ? getSpell(activity.id) : null;
    return spell ? "Casting " + spell.label : "Casting spell";
  }

  if (activity.kind === "locationObject") return "Exploring";
  if (activity.kind === "dungeonSearch") return "Exploring room";
  if (activity.kind === "towerNodeImbue") return "Activating tower node";
  if (activity.kind === "towerNodeThreadSense") return "Sensing node thread";
  if (activity.kind === "rest") return "Resting";

  return "In progress";
}

function renderCampActivityLine() {
  if (!ui.currentGoalText) return;

  const existing = ui.currentGoalText.querySelector(".current-goal-activity");

  if (existing) {
    existing.remove();
  }

  const activityText = getCurrentActivitySummaryText();
  const activity = document.createElement("div");
  activity.className = "current-goal-activity";
  activity.classList.toggle("empty", !activityText);
  activity.textContent = activityText ? "In progress: " + activityText : "";
  ui.currentGoalText.appendChild(activity);
}

function updateWorkflowPanels() {
  if (typeof renderCampActivityLine === "function") {
    renderCampActivityLine();
  }

  if (typeof renderExpeditionWorkflowPanel === "function") {
    renderExpeditionWorkflowPanel();
  }

  if (typeof renderMagicWorkflowPanel === "function") {
    renderMagicWorkflowPanel();
  }

  if (typeof renderSpellProgressSummary === "function") {
    renderSpellProgressSummary();
  }

  if (typeof renderTowerStatusPanel === "function") {
    renderTowerStatusPanel();
  }
}

function addJournalEntry(entryId) {
  if (gameState.journal.entries.includes(entryId)) return;

  const entry = getJournalEntryDefinition(entryId);

  if (!entry) {
    console.warn("Unknown journal entry:", entryId);
    return;
  }

  gameState.journal.entries.push(entryId);
  updateJournalUI();
}

function updateJournalUI() {
  if (!ui.journalEntries) return;

  ui.journalEntries.innerHTML = "";

  if (gameState.journal.entries.length === 0) {
    const empty = document.createElement("div");
    empty.classList.add("journal-empty");
    empty.textContent = "No lasting discoveries recorded yet.";
    ui.journalEntries.appendChild(empty);
    return;
  }

  gameState.journal.entries.forEach((entryId) => {
    const entry = getJournalEntryDefinition(entryId);

    if (!entry) return;

    const row = document.createElement("article");
    row.classList.add("journal-entry");

    const title = document.createElement("h3");
    title.textContent = entry.title;

    const text = document.createElement("p");
    text.textContent = entry.text;

    row.appendChild(title);
    row.appendChild(text);
    ui.journalEntries.appendChild(row);
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getRegionState(regionId) {
  return gameState.world.regions[regionId];
}

function getRegionStatus(regionId) {
  const definition = getRegionDefinition(regionId);
  const state = getRegionState(regionId);

  if (!state.unlocked) return "Locked";
  if (state.mastered || state.progress >= definition.maxProgress) {
    return regionId === "outskirts" ? "Mastered" : "Mastered (+20% travel here)";
  }
  if (state.progress <= 0) return "Unexplored";
  if (state.progress < definition.maxProgress * 0.25) return "Surveying";
  if (state.progress < definition.maxProgress * 0.75) return "Known route";
  return "Nearly mastered";
}

function getNextRegionMilestone(regionId) {
  const definition = getRegionDefinition(regionId);
  const state = getRegionState(regionId);
  const next = definition.milestones.find((milestone) => state.progress < milestone.at);

  return next ? "Next at " + next.at + ": " + next.text : "All regional milestones completed.";
}

function updateRegionalMapVisibility() {
  if (!ui.regionalMapSection) return;

  const shouldShowRegionMap =
    gameState.tier3Unlocked &&
    gameState.phase === "expedition" &&
    !gameState.expedition.active &&
    !gameState.expedition.currentLocation;

  if (shouldShowRegionMap) {
    showElement(ui.regionalMapSection, "block");
    renderRegionalMap();
    renderSelectedRegion();
  } else {
    hideElement(ui.regionalMapSection);
  }
}

function renderRegionalMap() {
  if (!ui.regionalMap) return;

  ui.regionalMap.innerHTML = "";

  const regionDefinitions = getRegionDefinitions();

  for (let regionId in regionDefinitions) {
    const definition = regionDefinitions[regionId];
    const state = getRegionState(regionId);
    const percent = clamp((state.progress / definition.maxProgress) * 100, 0, 100);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "region-node";
    button.dataset.region = regionId;
    button.disabled = !state.unlocked;
    button.setAttribute("aria-pressed", String(gameState.world.selectedRegion === regionId));

    const direction = document.createElement("span");
    direction.className = "region-node-direction";
    direction.textContent = definition.direction;

    const name = document.createElement("span");
    name.className = "region-node-name";
    name.textContent = state.unlocked ? definition.label : "Unknown";

    const status = document.createElement("span");
    status.className = "region-node-status";
    status.textContent = state.unlocked ? Math.floor(state.progress) + " / " + definition.maxProgress : "Locked";

    const track = document.createElement("span");
    track.className = "region-node-progress";

    const fill = document.createElement("span");
    fill.className = "region-node-progress-fill";
    fill.style.width = percent + "%";

    track.appendChild(fill);
    button.append(direction, name, status, track);

    button.addEventListener("click", function () {
      selectRegion(regionId);
    });

    ui.regionalMap.appendChild(button);
  }
}

function renderSelectedRegion() {
  const regionId = gameState.world.selectedRegion;
  const definition = getRegionDefinition(regionId);
  const state = getRegionState(regionId);

  if (!definition || !state) return;

  const percent = clamp((state.progress / definition.maxProgress) * 100, 0, 100);

  safeSetText(ui.regionDirection, definition.direction);
  safeSetText(ui.regionName, definition.label);
  safeSetText(ui.regionStatus, getRegionStatus(regionId));
  safeSetText(ui.regionDescription, definition.description);
  safeSetText(ui.regionProgressText, Math.floor(state.progress) + " / " + definition.maxProgress);
  safeSetText(ui.regionTerrain, definition.terrain);
  safeSetText(ui.regionKnownPlaceCount, String(getRegionKnownLocations(regionId).length));

  if (ui.regionProgressFill) {
    ui.regionProgressFill.style.width = percent + "%";
  }
}

function selectRegion(regionId) {
  const state = getRegionState(regionId);

  if (!state || !state.unlocked) return;

  gameState.world.selectedRegion = regionId;
  renderRegionalMap();
  updateDestinationActions();
  refreshExpeditionUI();
  renderSelectedRegion();
  trySaveGame();
}

function updateLocationStorageUI(location) {
  if (!ui.locationStorageSection || !ui.locationStorageList) return;

  ui.locationStorageList.innerHTML = "";

  if (!location || !location.storage) {
    hideElement(ui.locationStorageSection);
    return;
  }

  for (let resourceName in location.storage) {
    const resource = getResource(resourceName);
    const label = resource ? resource.label : resourceName;

    const item = document.createElement("div");
    item.classList.add("resource-pill");
    item.textContent = label + ": " + location.storage[resourceName];

    ui.locationStorageList.appendChild(item);
  }

  showElement(ui.locationStorageSection, "block");
}

function updateReturnToCampButtonLabel() {
  const action = getAction("returnToCamp");

  if (!action || !action.button) return;

  setUiActionButtonLabel(action.button, {
    label: gameState.recallUnlocked ? "Recall" : "Return to Camp",
    cost: getUiActionCostText("returnToCamp"),
  });
}
