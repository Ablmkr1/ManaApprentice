const ui = {};
let resourceElements = {};
let panelElements = {};
const MAIN_VIEW_NAMES = ["camp", "expedition", "magic", "tower", "journal"];
const UI_VITAL_RESOURCE_NAMES = ["energy", "mana", "focus", "ward"];
let currentMainView = null;
let mainViewUserSelected = false;
let shellEnhanced = false;
let activeUiModal = null;
let uiModalReturnFocus = null;
let uiActionRefreshFrame = null;
let lastInventorySummarySignature = "";
let lastShellContextSignature = "";
let lastActivitySignature = "";
let lastCampWorkVisible = null;
const resourceRenderCache = new Map();
const actionStateRenderCache = new Map();
const actionElementStateRenderCache = new WeakMap();

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
  ui.testCombatBtn = document.getElementById("testCombatBtn");
  ui.combatPanel = document.getElementById("combatPanel");
  ui.combatEnemyName = document.getElementById("combatEnemyName");
  ui.combatEnemyHealthText = document.getElementById("combatEnemyHealthText");
  ui.combatEnemyHealthFill = document.getElementById("combatEnemyHealthFill");
  ui.combatWardText = document.getElementById("combatWardText");
  ui.combatAttackTimer = document.getElementById("combatAttackTimer");
  ui.combatConsumables = document.getElementById("combatConsumables");
  ui.combatConsumablesList = document.getElementById("combatConsumablesList");
  ui.manaBoltBtn = document.getElementById("manaBoltBtn");
  ui.manaBoltProgressFill = document.getElementById("manaBoltProgressFill");
  ui.combatRecallBtn = document.getElementById("combatRecallBtn");
  ui.combatStatus = document.getElementById("combatStatus");
  ui.closeCombatBtn = document.getElementById("closeCombatBtn");
  ui.destinationActions = document.getElementById("destinationActions");
  ui.craftingSection = document.getElementById("craftingSection");
  ui.outskirtsCompletePopup = document.getElementById("outskirtsCompletePopup");
  ui.outskirtsCompleteContinueBtn = document.getElementById("outskirtsCompleteContinueBtn");
  ui.currentGoalSection = document.getElementById("currentGoalSection");
  ui.currentGoalTitle = document.getElementById("currentGoalTitle");
  ui.currentGoalText = document.getElementById("currentGoalText");
  ui.inventorySummary = document.getElementById("inventorySummary");
  ui.notificationStack = document.getElementById("notificationStack");
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
  ui.equipmentDetail = document.getElementById("equipmentDetail");
  ui.carriedInventoryStrip = document.getElementById("carriedInventoryStrip");
  ui.campResourcesSection = document.getElementById("campResourcesSection");
  ui.campUpgradeSection = document.getElementById("campUpgradeSection");
  ui.leatherAmount = document.getElementById("leatherAmount");
  ui.locationStorageSection = document.getElementById("locationStorageSection");
  ui.locationStorageList = document.getElementById("locationStorageList");
  ui.oreAmount = document.getElementById("oreAmount");
  ui.ironAmount = document.getElementById("ironAmount");
  ui.earthElementalCoreAmount = document.getElementById("earthElementalCoreAmount");
  ui.runedLeatherAmount = document.getElementById("runedLeatherAmount");
  ui.naturalEssenceAmount = document.getElementById("naturalEssenceAmount");
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
  ui.locationPrimaryActions = document.getElementById("locationPrimaryActions");
  ui.campContextualActions = document.getElementById("campContextualActions");
  ui.locationContextualActions = document.getElementById("locationContextualActions");
  ui.locationSpellActions = document.getElementById("locationSpellActions");
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
  ui.magicContextualActions = document.getElementById("magicContextualActions");
  ui.craftingSpellActions = document.getElementById("craftingSpellActions");
  ui.campFoundationPopup = document.getElementById("campFoundationPopup");
  ui.campFoundationContinueBtn = document.getElementById("campFoundationContinueBtn");
  ui.personalWardPopup = document.getElementById("personalWardPopup");
  ui.personalWardContinueBtn = document.getElementById("personalWardContinueBtn");
  ui.advancedRecallPopup = document.getElementById("advancedRecallPopup");
  ui.advancedRecallPopupText = document.getElementById("advancedRecallPopupText");
  ui.advancedRecallOptions = document.getElementById("advancedRecallOptions");
  ui.advancedRecallCloseBtn = document.getElementById("advancedRecallCloseBtn");
  ui.northernDisturbancePopup = document.getElementById("northernDisturbancePopup");
  ui.northernDisturbanceContinueBtn = document.getElementById("northernDisturbanceContinueBtn");
  ui.dungeonActions = document.getElementById("dungeonActions");
  ui.nailsAmount = document.getElementById("nailsAmount");
  ui.automationTabBtn = document.getElementById("automationTabBtn");
  ui.automationPanel = document.getElementById("automationPanel");
  ui.automationList = document.getElementById("automationList");
  ui.projectPanel = document.getElementById("projectPanel");
  ui.projectList = document.getElementById("projectList");
  ui.towerStructure = document.getElementById("towerStructure");
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
  ui.appShell = document.getElementById("appShell");
  ui.topBar = document.querySelector(".top-bar");
  ui.gameShell = document.querySelector(".game-shell");
  ui.shellStatusLine = document.getElementById("shellStatusLine");
  ui.shellViewEyebrow = document.getElementById("shellViewEyebrow");
  ui.settingsToggleBtn = document.getElementById("settingsToggleBtn");
  ui.settingsOverlay = document.getElementById("settingsOverlay");
  ui.settingsDrawer = document.getElementById("settingsDrawer");
  ui.settingsBackdrop = document.getElementById("settingsBackdrop");
  ui.settingsCloseBtn = document.getElementById("settingsCloseBtn");
  ui.developerSettings = document.getElementById("developerSettings");
  ui.storyPreviewSelect = document.getElementById("storyPreviewSelect");
  ui.storyPreviewBtn = document.getElementById("storyPreviewBtn");
  ui.uiLiveRegion = document.getElementById("uiLiveRegion");
  ui.activeTaskCard = document.getElementById("activeTaskCard");
  ui.activeTaskStatusText = document.getElementById("activeTaskStatusText");
  ui.activeTaskTitle = document.getElementById("activeTaskTitle");
  ui.activeTaskMeter = ui.activeTaskCard ? ui.activeTaskCard.querySelector(".active-task-meter") : null;
  ui.activeTaskProgressFill = document.getElementById("activeTaskProgressFill");
  ui.activeTaskProgressText = document.getElementById("activeTaskProgressText");
  ui.activeTaskRemainingText = document.getElementById("activeTaskRemainingText");
  ui.journalViewTabs = document.getElementById("journalViewTabs");
  ui.journalSwitchTabs = Array.from(document.querySelectorAll("[data-journal-view]"));
  ui.journalSubpanels = Array.from(document.querySelectorAll("[data-journal-panel]"));
  ui.storyLog = document.getElementById("storyLog");

  if (ui.inventorySummary) {
    ui.inventorySummary.addEventListener("click", function () {
      setMainView("camp", { userSelected: true });
      if (ui.campResourcesSection) {
        ui.campResourcesSection.open = true;
        ui.inventorySummary.setAttribute("aria-expanded", "true");
        ui.campResourcesSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  }
}

function enhanceGameShell() {
  if (shellEnhanced) return;

  shellEnhanced = true;
  syncDeveloperToolsVisibility();

  UI_VITAL_RESOURCE_NAMES.forEach(ensureVitalResourceMarkup);
  prepareUiActionButton(ui.restBtn);
  enhanceMainViewSemantics();
  enhanceJournalViewSemantics();
  enhanceWorkTabSemantics();
  enhancePopupSemantics();
  hookSettingsDrawer();

  if (ui.storyPreviewSelect && ui.storyPreviewBtn) {
    ui.storyPreviewBtn.addEventListener("click", openSelectedStoryPreview);
  }

  document.addEventListener("keydown", handleGlobalUiKeydown);
  updateShellContext();
  updateCampWorkVisibility();
  syncVisiblePopupModal();
}

function syncDeveloperToolsVisibility() {
  document.documentElement.dataset.debugUi = "true";

  if (ui.developerSettings) ui.developerSettings.hidden = false;
}

function ensureVitalResourceMarkup(resourceName) {
  const display = document.getElementById(resourceName + "Amount");

  if (!display || display.dataset.vitalEnhanced === "true") return;

  display.dataset.vitalEnhanced = "true";
  display.dataset.resource = resourceName;
  display.setAttribute("aria-label", resourceName + " status");
  display.textContent = "";

  const head = document.createElement("div");
  head.className = "vital-head";

  const name = document.createElement("span");
  name.className = "vital-name";

  const dot = document.createElement("i");
  dot.className = "vital-dot";
  dot.setAttribute("aria-hidden", "true");

  const label = document.createElement("span");
  label.className = "vital-label";
  label.textContent = resourceName;

  const value = document.createElement("strong");
  value.className = "vital-value";
  value.textContent = "0 / 0";

  const track = document.createElement("div");
  track.className = "resource-meter-track";
  track.setAttribute("role", "progressbar");
  track.setAttribute("aria-valuemin", "0");
  track.setAttribute("aria-valuemax", "0");
  track.setAttribute("aria-valuenow", "0");

  const fill = document.createElement("span");
  fill.className = "resource-meter-fill";

  name.append(dot, label);
  head.append(name, value);
  track.appendChild(fill);
  display.append(head, track);
}

function enhanceMainViewSemantics() {
  if (!ui.mainViewTabs) return;

  ui.mainViewTabs.setAttribute("role", "tablist");

  ui.mainViewButtons.forEach(function (button) {
    const viewName = button.dataset.mainViewTab;
    const panel = document.querySelector('[data-main-view-panel="' + viewName + '"]');

    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", panel ? panel.id : "");
    button.setAttribute("tabindex", button.classList.contains("active") ? "0" : "-1");
    button.addEventListener("keydown", handleMainViewTabKeydown);

    if (panel) {
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", button.id);
      panel.setAttribute("tabindex", "0");
    }
  });
}

function handleMainViewTabKeydown(event) {
  const availableTabs = ui.mainViewButtons.filter(function (button) {
    return button.style.display !== "none" && !button.hidden;
  });
  const currentIndex = availableTabs.indexOf(event.currentTarget);

  if (currentIndex < 0) return;

  const vertical = window.matchMedia("(min-width: 1180px)").matches;
  const previousKey = vertical ? "ArrowUp" : "ArrowLeft";
  const nextKey = vertical ? "ArrowDown" : "ArrowRight";
  let nextIndex = currentIndex;

  if (event.key === previousKey || event.key === "ArrowLeft" || event.key === "ArrowUp") {
    nextIndex = (currentIndex - 1 + availableTabs.length) % availableTabs.length;
  } else if (event.key === nextKey || event.key === "ArrowRight" || event.key === "ArrowDown") {
    nextIndex = (currentIndex + 1) % availableTabs.length;
  } else if (event.key === "Home") {
    nextIndex = 0;
  } else if (event.key === "End") {
    nextIndex = availableTabs.length - 1;
  } else {
    return;
  }

  event.preventDefault();
  const target = availableTabs[nextIndex];
  setMainView(target.dataset.mainViewTab, { userSelected: true });
  target.focus();
}

function enhanceJournalViewSemantics() {
  if (!ui.journalViewTabs) return;

  ui.journalViewTabs.setAttribute("role", "tablist");

  ui.journalSwitchTabs.forEach(function (button) {
    const panel = document.querySelector('[data-journal-panel="' + button.dataset.journalView + '"]');

    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", panel ? panel.id : "");
    button.setAttribute("aria-selected", button.classList.contains("active") ? "true" : "false");
    button.setAttribute("tabindex", button.classList.contains("active") ? "0" : "-1");
    button.addEventListener("keydown", handleJournalTabKeydown);

    if (panel) {
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", button.id);
      panel.setAttribute("tabindex", "0");
    }
  });
}

function handleJournalTabKeydown(event) {
  const tabs = ui.journalSwitchTabs.filter(function (button) {
    return button.style.display !== "none" && !button.hidden;
  });
  const index = tabs.indexOf(event.currentTarget);
  let nextIndex = index;

  if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    nextIndex = (index - 1 + tabs.length) % tabs.length;
  } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    nextIndex = (index + 1) % tabs.length;
  } else if (event.key === "Home") {
    nextIndex = 0;
  } else if (event.key === "End") {
    nextIndex = tabs.length - 1;
  } else {
    return;
  }

  event.preventDefault();
  setJournalSubView(tabs[nextIndex].dataset.journalView);
  tabs[nextIndex].focus();
}

function enhanceWorkTabSemantics() {
  if (!ui.workTabs) return;

  ui.workTabs.setAttribute("role", "tablist");
  const tabPairs = [
    [ui.craftingTabBtn, ui.craftingPanel],
    [ui.researchTabBtn, ui.researchPanel],
    [ui.automationTabBtn, ui.automationPanel],
  ];

  tabPairs.forEach(function (pair) {
    const button = pair[0];
    const panel = pair[1];

    if (!button || !panel) return;

    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", panel.id);
    button.setAttribute("aria-selected", button.classList.contains("active") ? "true" : "false");
    button.setAttribute("tabindex", button.classList.contains("active") ? "0" : "-1");
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", button.id);
    panel.setAttribute("tabindex", "0");
    button.addEventListener("keydown", handleWorkTabKeydown);
  });
}

function handleWorkTabKeydown(event) {
  const tabs = [ui.craftingTabBtn, ui.researchTabBtn, ui.automationTabBtn].filter(function (button) {
    return button && button.style.display !== "none" && !button.hidden;
  });
  const index = tabs.indexOf(event.currentTarget);
  let nextIndex = index;

  if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    nextIndex = (index - 1 + tabs.length) % tabs.length;
  } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    nextIndex = (index + 1) % tabs.length;
  } else if (event.key === "Home") {
    nextIndex = 0;
  } else if (event.key === "End") {
    nextIndex = tabs.length - 1;
  } else {
    return;
  }

  event.preventDefault();
  const panelName = tabs[nextIndex].id.replace("TabBtn", "").replace("Tab", "");
  showWorkPanel(panelName, { userSelected: true });
  tabs[nextIndex].focus();
}

function hookJournalViewTabs() {
  if (!Array.isArray(ui.journalSwitchTabs)) return;

  ui.journalSwitchTabs.forEach(function (button) {
    if (button.dataset.journalViewHooked === "true") return;

    button.addEventListener("click", function () {
      setJournalSubView(button.dataset.journalView);
    });
    button.dataset.journalViewHooked = "true";
  });

  setJournalSubView("entries");
}

function setJournalSubView(viewName) {
  if (!Array.isArray(ui.journalSwitchTabs) || !Array.isArray(ui.journalSubpanels)) return;

  ui.journalSwitchTabs.forEach(function (button) {
    const active = button.dataset.journalView === viewName;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
    button.setAttribute("tabindex", active ? "0" : "-1");
  });

  ui.journalSubpanels.forEach(function (panel) {
    const active = panel.dataset.journalPanel === viewName;
    panel.classList.toggle("active", active);
    panel.setAttribute("aria-hidden", String(!active));
  });
}

function hookSettingsDrawer() {
  if (!ui.settingsToggleBtn || !ui.settingsOverlay) return;

  ui.settingsToggleBtn.addEventListener("click", openSettingsDrawer);
  ui.settingsCloseBtn.addEventListener("click", closeSettingsDrawer);
  ui.settingsBackdrop.addEventListener("click", closeSettingsDrawer);
}

function openSettingsDrawer() {
  if (!ui.settingsOverlay || !ui.settingsDrawer) return;

  uiModalReturnFocus = document.activeElement;
  ui.settingsOverlay.hidden = false;
  ui.settingsToggleBtn.setAttribute("aria-expanded", "true");
  ui.topBar.setAttribute("inert", "");
  ui.gameShell.setAttribute("inert", "");
  activeUiModal = ui.settingsDrawer;
  requestAnimationFrame(function () {
    ui.settingsCloseBtn.focus();
  });
}

function closeSettingsDrawer() {
  if (!ui.settingsOverlay || ui.settingsOverlay.hidden) return;

  ui.settingsOverlay.hidden = true;
  ui.settingsToggleBtn.setAttribute("aria-expanded", "false");
  ui.topBar.removeAttribute("inert");
  ui.gameShell.removeAttribute("inert");
  activeUiModal = null;
  restoreUiModalFocus();
}

function enhancePopupSemantics() {
  document.querySelectorAll(".popup").forEach(function (popup) {
    const dialog = popup.querySelector(".popup-content");
    const heading = dialog ? dialog.querySelector("h2") : null;

    if (!dialog || !heading) return;

    if (!heading.id) heading.id = popup.id + "Title";
    heading.setAttribute("tabindex", "-1");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", heading.id);
    const visible = isPopupVisible(popup);
    popup.setAttribute("aria-hidden", visible ? "false" : "true");
    popup.toggleAttribute("inert", !visible);

    if (popup.id === "advancedRecallPopup") {
      dialog.dataset.escapeClose = "true";
    }

    dialog.querySelectorAll("button").forEach(function (button) {
      button.addEventListener("click", function (event) {
        if (popup.dataset.uiPreview !== "true") return;

        event.preventDefault();
        event.stopImmediatePropagation();
        delete popup.dataset.uiPreview;
        popup.style.display = "none";
      }, true);
    });

    const observer = new MutationObserver(function () {
      syncPopupModalState(popup);
    });
    observer.observe(popup, { attributes: true, attributeFilter: ["style", "class", "hidden"] });
  });
}

function openSelectedStoryPreview() {
  if (document.documentElement.dataset.debugUi !== "true") return;
  const popup = ui.storyPreviewSelect ? document.getElementById(ui.storyPreviewSelect.value) : null;

  if (!popup || document.documentElement.dataset.debugUi !== "true") return;

  popup.dataset.uiPreview = "true";
  popup.style.display = "flex";
}

function isPopupVisible(popup) {
  return !!popup && !popup.hidden && window.getComputedStyle(popup).display !== "none";
}

function syncVisiblePopupModal() {
  const visiblePopup = Array.from(document.querySelectorAll(".popup")).find(isPopupVisible);

  if (visiblePopup) syncPopupModalState(visiblePopup);
}

function syncPopupModalState(popup) {
  const dialog = popup.querySelector(".popup-content");
  const visible = isPopupVisible(popup);

  if (visible) {
    popup.removeAttribute("inert");
    popup.setAttribute("aria-hidden", "false");
    if (activeUiModal === dialog) return;
    if (activeUiModal === ui.settingsDrawer) closeSettingsDrawer();

    uiModalReturnFocus = document.activeElement;
    activeUiModal = dialog;
    ui.appShell.setAttribute("inert", "");
    requestAnimationFrame(function () {
      const heading = dialog.querySelector("h2");
      const primary = dialog.querySelector("button:not([disabled])");
      (heading || primary || dialog).focus();
    });
    return;
  }

  if (activeUiModal === dialog) {
    activeUiModal = null;
    ui.appShell.removeAttribute("inert");
    restoreUiModalFocus();
  }

  moveFocusOutsidePopup(popup);
  popup.setAttribute("inert", "");
  popup.setAttribute("aria-hidden", "true");
}

function moveFocusOutsidePopup(popup) {
  if (!popup || !popup.contains(document.activeElement)) return;

  const fallback = document.querySelector(".main-view-tab.active") || ui.settingsToggleBtn || ui.appShell;

  if (fallback && !popup.contains(fallback) && typeof fallback.focus === "function") {
    const hadTabindex = fallback.hasAttribute("tabindex");
    if (!hadTabindex) fallback.setAttribute("tabindex", "-1");
    fallback.focus({ preventScroll: true });
    if (!hadTabindex) fallback.removeAttribute("tabindex");
  }

  if (popup.contains(document.activeElement) && typeof document.activeElement.blur === "function") {
    document.activeElement.blur();
  }
}

function handleGlobalUiKeydown(event) {
  if (!activeUiModal) return;

  if (event.key === "Escape") {
    if (activeUiModal === ui.settingsDrawer) {
      event.preventDefault();
      closeSettingsDrawer();
    } else if (activeUiModal.dataset.escapeClose === "true") {
      const closeButton = activeUiModal.querySelector("button[id*='Close']");

      if (closeButton) {
        event.preventDefault();
        closeButton.click();
      }
    }

    return;
  }

  if (event.key !== "Tab") return;

  const focusable = getUiFocusableElements(activeUiModal);

  if (focusable.length === 0) {
    event.preventDefault();
    activeUiModal.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const activeIndex = focusable.indexOf(document.activeElement);

  if (activeIndex === -1) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
    return;
  }

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function getUiFocusableElements(container) {
  return Array.from(container.querySelectorAll("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])")).filter(function (element) {
    return !element.hidden && window.getComputedStyle(element).display !== "none" && window.getComputedStyle(element).visibility !== "hidden";
  });
}

function restoreUiModalFocus() {
  const target = uiModalReturnFocus;
  uiModalReturnFocus = null;

  if (target && target.isConnected && typeof target.focus === "function") {
    target.focus();
  }
}

function announceUiStatus(message) {
  if (!ui.uiLiveRegion || !message || ui.uiLiveRegion.textContent === message) return;

  ui.uiLiveRegion.textContent = message;
}

function getUiTierLabel() {
  if (gameState.personalWardUnlocked || gameState.towerConstructionUnlocked || gameState.partialTowerPlansFound) return "Tier IV Apprentice";
  if (gameState.tier3Unlocked || gameState.magicUnlocked) return "Tier III Apprentice";
  if (gameState.tier2Complete || gameState.phase === "expedition") return "Tier II Apprentice";
  return "Tier I Apprentice";
}

function getUiLocationLabel() {
  if (gameState.expedition && gameState.expedition.currentLocation && typeof getLocationLabel === "function") {
    return getLocationLabel(gameState.expedition.currentLocation);
  }

  if (gameState.expedition && gameState.expedition.active) return "Expedition Trail";
  if (gameState.discoveredClearing || gameState.hasCamp || gameState.phase === "clearing" || gameState.phase === "expedition") return "Camp Clearing";
  return "Unknown Woods";
}

function getUiViewCopy(viewName) {
  const location = getUiLocationLabel();
  const copies = {
    camp: {
      eyebrow: location,
      title: location === "Unknown Woods" ? "Survive, recover, and find your bearings." : "Prepare, learn, and push outward.",
      description:
        location === "Unknown Woods"
          ? "Recover enough strength to explore and find a defensible place."
          : "Your camp is the anchor. Recover, build what you need, and choose the next useful step.",
    },
    expedition: {
      eyebrow: location,
      title: "Prepare, travel, and return with purpose.",
      description: "Pack deliberately, follow known routes, and keep the current destination clear.",
    },
    magic: {
      eyebrow: "Arcane practice",
      title: "Shape mana with deliberate practice.",
      description: "Keep current mana and learned spellwork close to the choices they enable.",
    },
    tower: {
      eyebrow: "The buried tower",
      title: "Restore what the forest tried to forget.",
      description: "Track the present stage, materials, and work beside the tower itself.",
    },
    journal: {
      eyebrow: "Apprentice journal",
      title: "Read the trail you have already walked.",
      description: "Lasting discoveries and recent world events remain separate and easy to scan.",
    },
  };

  return copies[viewName] || copies.camp;
}

function updateShellContext() {
  const viewCopy = getUiViewCopy(currentMainView || "camp");
  const signature = [currentMainView || "camp", viewCopy.eyebrow].join("|");

  if (signature === lastShellContextSignature) return;

  lastShellContextSignature = signature;
  safeSetText(ui.shellViewEyebrow, viewCopy.eyebrow);
}

function updateCampWorkVisibility() {
  if (!ui.campContent) return;

  const canShowCampWork = Boolean(gameState.discoveredClearing || gameState.hasCamp || gameState.phase === "clearing" || gameState.phase === "expedition");

  if (lastCampWorkVisible === canShowCampWork) return;

  lastCampWorkVisible = canShowCampWork;
  ui.campContent.hidden = !canShowCampWork;

  if (!canShowCampWork) {
    ui.campContent.open = false;
  }
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
    earthElementalCore: ui.earthElementalCoreAmount,
    runedLeather: ui.runedLeatherAmount,
    naturalEssence: ui.naturalEssenceAmount,
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

  if (options.compact) group.classList.add("is-compact");
  if (options.state) group.dataset.uiState = options.state;

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
  track.setAttribute("role", "progressbar");
  track.setAttribute("aria-valuemin", "0");
  track.setAttribute("aria-valuemax", String(max > 0 ? max : 100));
  track.setAttribute("aria-valuenow", String(max > 0 ? Math.min(Math.max(current, 0), max) : Math.round(clampedPercent * 100)));

  if (options.label) track.setAttribute("aria-label", options.label);

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

  if (options.state) card.dataset.uiState = options.state;

  appendUiText(card, "span", "ui-summary-card-eyebrow", options.eyebrow || "");

  const header = document.createElement("div");
  header.className = "ui-summary-card-header";

  if (options.icon instanceof Node) {
    const iconSlot = document.createElement("span");
    iconSlot.className = "ui-summary-card-icon";
    iconSlot.setAttribute("aria-hidden", "true");
    iconSlot.appendChild(options.icon);
    header.appendChild(iconSlot);
  }

  appendUiText(header, "strong", "ui-summary-card-title", options.title || "");
  appendUiText(header, "span", "ui-summary-card-meta", options.meta || "");
  card.appendChild(header);

  appendUiText(card, "p", "ui-summary-card-body", options.body || "");

  if (options.progress) {
    card.appendChild(createUiProgressMeter(options.progress));
  }

  appendUiText(card, "div", "ui-summary-card-detail", options.detail || "");

  if (Array.isArray(options.actions) && options.actions.length > 0) {
    const actions = document.createElement("div");
    actions.className = "ui-summary-card-actions";
    options.actions.forEach(function (action) {
      if (action instanceof Node) actions.appendChild(action);
    });
    card.appendChild(actions);
  }

  return card;
}

function createUiContextPanel(options = {}) {
  const panel = document.createElement("section");
  panel.className = "ui-context-panel";

  if (options.className) {
    panel.className += " " + options.className;
  }

  if (options.state) panel.dataset.uiState = options.state;

  appendUiText(panel, "span", "ui-context-panel-label", options.label || "");

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

  let icon = button.querySelector(".ui-action-icon");

  if (!icon) {
    icon = document.createElement("span");
    icon.className = "ui-action-icon";
    icon.setAttribute("aria-hidden", "true");
    label.before(icon);
  }

  if (options.icon !== undefined) {
    icon.textContent = options.icon || "";
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

  let reason = button.querySelector(".ui-action-reason");

  if (!reason) {
    reason = document.createElement("span");
    reason.className = "ui-action-reason";
    button.appendChild(reason);
  }

  if (!reason.textContent.trim()) {
    reason.style.display = "none";
  }

  if (!button.querySelector(".action-result-feedback")) {
    const result = document.createElement("span");
    result.className = "action-result-feedback";
    result.setAttribute("aria-hidden", "true");
    button.appendChild(result);
  }

  return {
    progressFill,
    label,
    icon,
    cost,
    detail,
    reason,
  };
}

// Completion feedback lives inside the action's existing footprint so it never moves controls.
function showActionResult(button, result) {
  if (!button || !result || !result.primary) return;

  let feedback = button.querySelector(".action-result-feedback");
  if (!feedback) {
    feedback = document.createElement("span");
    feedback.className = "action-result-feedback";
    feedback.setAttribute("aria-hidden", "true");
    button.appendChild(feedback);
  }

  clearTimeout(Number(feedback.dataset.dismissTimer));
  feedback.textContent = result.secondary ? result.primary + " · " + result.secondary : result.primary;
  feedback.classList.toggle("is-meaningful", result.importance === "meaningful");
  feedback.classList.remove("is-visible");
  void feedback.offsetWidth;
  feedback.classList.add("is-visible");
  feedback.dataset.dismissTimer = String(setTimeout(function () {
    feedback.classList.remove("is-visible");
  }, result.importance === "meaningful" ? 2600 : 1900));
}

function emphasizeResource(resourceName) {
  const resource = getResource(resourceName);
  const display = resource && resource.display;
  if (!display) return;

  clearTimeout(Number(display.dataset.emphasisTimer));
  display.classList.remove("resource-gained");
  void display.offsetWidth;
  display.classList.add("resource-gained");
  display.dataset.emphasisTimer = String(setTimeout(function () {
    display.classList.remove("resource-gained");
  }, 850));
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

  if (options.reason !== undefined) {
    parts.reason.textContent = options.reason || "";
    parts.reason.style.display = options.reason ? "block" : "none";
  }

  if (options.icon !== undefined) {
    parts.icon.textContent = options.icon || "";
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
    reason: options.reason || "",
    icon: options.icon || "",
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

function setMainView(viewName, options = {}) {
  if (!MAIN_VIEW_NAMES.includes(viewName)) return;

  const targetView = isMainViewAvailable(viewName) ? viewName : getDefaultMainView();

  currentMainView = targetView;

  if (options.userSelected) {
    mainViewUserSelected = true;
    markMajorSystemSeen(targetView);
  }

  updateMainViewTabStates();
}

function syncMainViewAvailability() {
  if (!Array.isArray(ui.mainViewButtons) || !Array.isArray(ui.mainViewPanels)) return;

  syncContextPanelVisibility();
  syncMajorSystemUnlocks();

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

    button.style.display = available ? "flex" : "none";
    button.classList.toggle("active", isActive);
    updateSystemNewIndicator(button, viewName);
    button.setAttribute("aria-selected", String(isActive));
    button.setAttribute("tabindex", isActive ? "0" : "-1");
  });

  ui.mainViewPanels.forEach(function (panel) {
    const isActive = panel.dataset.mainViewPanel === currentMainView;

    panel.classList.toggle("active", isActive);
    panel.setAttribute("aria-hidden", String(!isActive));
  });

  updateShellContext();
  updatePrimaryActionEmphasis();
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

const MAJOR_SYSTEM_UNLOCKS = {
  expedition: {
    title: "EXPEDITION UNLOCKED",
    description: "Prepare journeys beyond the safety of camp.",
    isAvailable: function () { return isMainViewAvailable("expedition"); },
  },
  magic: {
    title: "MAGIC UNLOCKED",
    description: "Mana can now be shaped into spells.",
    isAvailable: function () { return hasMagicViewContent(); },
  },
  research: {
    title: "RESEARCH UNLOCKED",
    description: "Study new principles to advance your camp.",
    isAvailable: function () { return typeof isResearchSpotPurchased === "function" && isResearchSpotPurchased(); },
  },
  tower: {
    title: "TOWER UNLOCKED",
    description: "A new path of long-term advancement is available.",
    isAvailable: function () { return isMainViewAvailable("tower"); },
  },
  automation: {
    title: "AUTOMATION UNLOCKED",
    description: "Build machines that keep working with mana.",
    isAvailable: function () { return typeof hasUnlockedAutomation === "function" && hasUnlockedAutomation(); },
  },
};

function getMajorSystemUnlockState() {
  if (!gameState.systemUnlocks || typeof gameState.systemUnlocks !== "object") {
    gameState.systemUnlocks = { initialized: false, announced: {}, seen: {} };
  }

  const state = gameState.systemUnlocks;
  if (!state.announced || typeof state.announced !== "object") state.announced = {};
  if (!state.seen || typeof state.seen !== "object") state.seen = {};
  state.initialized = !!state.initialized;
  return state;
}

function syncMajorSystemUnlocks() {
  const state = getMajorSystemUnlockState();
  const systems = Object.keys(MAJOR_SYSTEM_UNLOCKS);

  if (!state.initialized) {
    systems.forEach(function (systemName) {
      if (!MAJOR_SYSTEM_UNLOCKS[systemName].isAvailable()) return;
      state.announced[systemName] = true;
      state.seen[systemName] = true;
    });
    state.initialized = true;
    updateMajorSystemNewIndicators();
    return;
  }

  systems.forEach(function (systemName) {
    const system = MAJOR_SYSTEM_UNLOCKS[systemName];
    if (!system.isAvailable() || state.announced[systemName]) return;

    state.announced[systemName] = true;
    state.seen[systemName] = false;
    showMajorSystemUnlockEvent(system);
  });

  updateMajorSystemNewIndicators();
}

function markMajorSystemSeen(systemName) {
  const state = getMajorSystemUnlockState();
  if (!MAJOR_SYSTEM_UNLOCKS[systemName] || !state.announced[systemName] || state.seen[systemName]) return;

  state.seen[systemName] = true;
  updateMajorSystemNewIndicators();
}

function updateSystemNewIndicator(button, systemName) {
  if (!button || !MAJOR_SYSTEM_UNLOCKS[systemName]) return;

  const state = getMajorSystemUnlockState();
  const isNew = !!state.announced[systemName] && !state.seen[systemName];
  button.classList.toggle("has-new-system", isNew);
  button.setAttribute("data-system-new", String(isNew));
  button.setAttribute("aria-label", button.textContent.trim() + (isNew ? ", new" : ""));
}

function updateMajorSystemNewIndicators() {
  if (Array.isArray(ui.mainViewButtons)) {
    ui.mainViewButtons.forEach(function (button) {
      updateSystemNewIndicator(button, button.dataset.mainViewTab);
    });
  }

  updateSystemNewIndicator(ui.automationTabBtn, "automation");
  updateSystemNewIndicator(ui.researchTabBtn, "research");
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

  if (!resource) return;

  if (UI_VITAL_RESOURCE_NAMES.includes(resourceName) && resource.display && resource.display.dataset.vitalEnhanced === "true") {
    renderVitalResource(resourceName, resource);
  } else {
    const text = resource.label + ": " + formatResourceAmountForDisplay(resource.value) + " / " + resource.maxValue;
    const cached = resourceRenderCache.get(resourceName) || {};

    if (cached.text !== text) {
      safeSetText(resource.display, text);
      cached.text = text;
      resourceRenderCache.set(resourceName, cached);
    }
  }

  setUiTextIfChanged(resource.perClickDisplay, "+" + resource.perClick + "/Click");
  setUiTextIfChanged(resource.perSecondDisplay, "+" + resource.perSecond + "/Sec");
  updateInventorySummary();
  scheduleActionUiRefresh();
}

function renderVitalResource(resourceName, resource) {
  const display = resource.display;
  const valueElement = display.querySelector(".vital-value");
  const meter = display.querySelector(".resource-meter-track");
  const fill = display.querySelector(".resource-meter-fill");
  const current = formatResourceAmountForDisplay(resource.value);
  const max = resource.maxValue;
  const percent = max > 0 ? Math.min(Math.max(resource.value / max, 0), 1) : 0;
  const percentText = Math.round(percent * 1000) / 10 + "%";
  const signature = [current, max, percentText].join("|");

  if (resourceRenderCache.get(resourceName) === signature) return;

  resourceRenderCache.set(resourceName, signature);
  setUiTextIfChanged(valueElement, current + " / " + max);

  if (meter) {
    meter.setAttribute("aria-valuemax", String(max));
    meter.setAttribute("aria-valuenow", String(current));
    meter.setAttribute("aria-valuetext", current + " of " + max + " " + resource.label);
  }

  if (fill && fill.style.width !== percentText) {
    fill.style.width = percentText;
  }
}

function setUiTextIfChanged(element, text) {
  if (element && element.textContent !== text) element.textContent = text;
}

function scheduleActionUiRefresh() {
  if (uiActionRefreshFrame !== null) return;

  uiActionRefreshFrame = requestAnimationFrame(function () {
    uiActionRefreshFrame = null;
    updateAllActionButtons();
  });
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

  updateLocationPrimaryActionsVisibility();

  if (typeof updateProjectButtons === "function") {
    updateProjectButtons();
  }

  if (typeof updateTowerNodeButtons === "function") {
    updateTowerNodeButtons();
  }

  if (typeof syncMainViewAvailability === "function") {
    syncMainViewAvailability();
  }

  if (typeof updateRestButton === "function") {
    updateRestButton();
  }

  updateWorkflowPanels();
  updatePrimaryActionEmphasis();
  updateShellContext();
  updateCampWorkVisibility();
}

function updateLocationPrimaryActionsVisibility() {
  if (!ui.locationPrimaryActions) return;

  const hasVisibleAction = Array.from(ui.locationPrimaryActions.querySelectorAll(".action-btn")).some(function (button) {
    return button.style.display !== "none";
  });
  ui.locationPrimaryActions.style.display = hasVisibleAction ? "grid" : "none";
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

  if (resourceName === "mana" && typeof unlockManaCyclingForManaAccess === "function") {
    unlockManaCyclingForManaAccess();
  }

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
    "earthElementalCore",
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

function updateInventorySummary() {
  if (!ui.inventorySummary) return;

  const resourceNames = ["food", "water", "wood", "stone", "iron", "leather", "herb", "manaCrystal", "chargedCrystal"];
  const visibleResources = resourceNames.filter(function (resourceName) {
    const resource = getResource(resourceName);
    return resource && resource.display && resource.display.style.display !== "none";
  });

  if (visibleResources.length === 0) {
    lastInventorySummarySignature = "";
    hideElement(ui.inventorySummary);
    return;
  }

  const shown = visibleResources.slice(0, 4);
  const parts = shown.map(function (resourceName) {
    const resource = getResource(resourceName);
    return resource.label + " " + formatResourceAmountForDisplay(resource.value);
  });
  const remaining = visibleResources.length - shown.length;

  if (remaining > 0) parts.push("+" + remaining);
  const summary = parts.join(" · ");

  if (summary !== lastInventorySummarySignature) {
    lastInventorySummarySignature = summary;
    safeSetText(ui.inventorySummary, summary);
  }

  ui.inventorySummary.title = "Open storage";
  showElement(ui.inventorySummary, "inline-flex");
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

function showNorthernDisturbancePopup() {
  if (ui.northernDisturbancePopup) ui.northernDisturbancePopup.style.display = "flex";
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

// Routine feedback is transient; lasting discoveries are written to the Journal separately.
function addStoryEntry(text) {
  if (!text) return;

  appendWorldLogEntry(text);

  if (!ui.notificationStack) return;

  const previous = ui.notificationStack.lastElementChild;
  if (previous && previous.dataset.message === text) {
    const count = Number(previous.dataset.count || 1) + 1;
    previous.dataset.count = String(count);
    previous.textContent = text + (count > 1 ? " ×" + count : "");
    clearTimeout(Number(previous.dataset.dismissTimer));
    previous.dataset.dismissTimer = String(scheduleNotificationDismissal(previous));
    return;
  }

  const entry = document.createElement("div");
  entry.className = "notification-toast";
  entry.dataset.message = text;
  entry.dataset.count = "1";
  entry.textContent = text;
  ui.notificationStack.appendChild(entry);

  while (ui.notificationStack.children.length > 4) {
    ui.notificationStack.removeChild(ui.notificationStack.firstChild);
  }

  entry.dataset.dismissTimer = String(scheduleNotificationDismissal(entry));
}

function showMajorSystemUnlockEvent(system) {
  if (!ui.notificationStack || !system) return;

  const entry = document.createElement("div");
  entry.className = "notification-toast notification-toast--system";
  entry.setAttribute("role", "status");

  const title = document.createElement("strong");
  title.textContent = system.title;
  const description = document.createElement("span");
  description.textContent = system.description;
  entry.append(title, description);
  ui.notificationStack.appendChild(entry);

  while (ui.notificationStack.children.length > 4) {
    ui.notificationStack.removeChild(ui.notificationStack.firstChild);
  }

  entry.dataset.dismissTimer = String(scheduleNotificationDismissal(entry, 6800));
}

function appendWorldLogEntry(text) {
  if (!ui.storyLog || !text) return;

  const entry = document.createElement("article");
  entry.className = "story-entry";

  const marker = document.createElement("span");
  marker.className = "story-entry-marker";
  marker.setAttribute("aria-hidden", "true");

  const copy = document.createElement("p");
  copy.textContent = text;

  entry.append(marker, copy);
  ui.storyLog.appendChild(entry);

  while (ui.storyLog.children.length > 40) {
    ui.storyLog.removeChild(ui.storyLog.firstChild);
  }

  ui.storyLog.scrollTop = ui.storyLog.scrollHeight;
}

function scheduleNotificationDismissal(entry, delay = 4200) {
  return setTimeout(function () {
    entry.classList.add("is-dismissing");
    setTimeout(function () {
      if (entry.parentElement) entry.remove();
    }, 220);
  }, delay);
}

//Update Camp Upgrade UI
function updateCampUpgradeDisplay(upgrade) {
  if (!upgrade) return;

  if (upgrade.button) {
    upgrade.button.style.display = isCraftContextAvailable(upgrade) && upgrade.unlocked && !upgrade.purchased ? "grid" : "none";
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
  const shouldShow =
    action.unlocked &&
    (actionName !== "practiceManaCycling" ||
      (typeof isManaCyclingBreakthroughReady === "function" && isManaCyclingBreakthroughReady()));
  action.button.style.display = shouldShow ? "grid" : "none";
  updateDynamicActionButtonLabel(actionName, action);
  setUiActionButtonLabel(action.button, {
    cost: getUiActionCostText(actionName),
  });

  if (!action.unlocked) {
    action.button.disabled = true;
    applyUiActionState(action.button, { state: "locked", reason: "Not yet discovered" }, actionName);
    syncPackingControlGroupState(actionName);
    return;
  }

  const isCurrentActivity =
    isActivityActive() &&
    ((gameState.activity.kind === "action" && gameState.activity.id === actionName) ||
      (gameState.activity.kind === "travel" && actionName === "travel"));

  action.button.disabled = !action.unlocked || (!isCurrentActivity && isActivityActive()) || !canUseAction(actionName);
  applyUiActionState(action.button, getUiActionAvailability(actionName), actionName);
  syncPackingControlGroupState(actionName);
}

function getUiActionAvailability(actionName) {
  const action = getAction(actionName);

  if (!action || !action.unlocked) {
    return { state: "locked", reason: "Not yet discovered" };
  }

  const isCurrentActivity =
    isActivityActive() &&
    ((gameState.activity.kind === "action" && gameState.activity.id === actionName) ||
      (gameState.activity.kind === "travel" && actionName === "travel"));

  if (isCurrentActivity || action.running) {
    return { state: "running", reason: "Task in progress" };
  }

  if (isActivityActive()) {
    return { state: "busy", reason: "Another task is in progress" };
  }

  const cost = getActionCost(actionName);

  if (!canAffordCost(cost)) {
    return { state: "unaffordable", reason: getUiCostShortfall(cost) || "Insufficient resources" };
  }

  if (!isActionContextAvailable(actionName)) {
    return { state: "wrong-context", reason: getUiActionContextReason(actionName) };
  }

  return { state: "ready", reason: "" };
}

function getUiCostShortfall(cost) {
  if (!cost || typeof cost !== "object") return "";

  const missing = [];

  Object.keys(cost).forEach(function (resourceName) {
    const resource = getResource(resourceName);
    const required = Number(cost[resourceName]) || 0;
    const available = resource ? Number(resource.value) || 0 : 0;
    const shortfall = Math.max(0, roundResourceAmount(required - available));

    if (shortfall <= 0) return;
    missing.push(formatResourceAmountForDisplay(shortfall) + " more " + (resource ? resource.label : resourceName));
  });

  if (missing.length === 0) return "";
  return "Need " + missing.slice(0, 2).join(" · ");
}

function applyUiSpellOptionState(button, cost, usable, options = {}) {
  if (!button) return;

  prepareUiActionButton(button, {
    progress: false,
    labelClass: options.labelClass || "attunement-target-label",
    detailClass: options.detailClass || "attunement-target-description",
    costClass: options.costClass || "attunement-target-details",
  });

  let availability = { state: "ready", reason: "" };

  if (options.active) {
    availability = { state: "locked", reason: "Already active" };
  } else if (isActivityActive()) {
    availability = { state: "busy", reason: "Another task is in progress" };
  } else if (!canAffordCost(cost || {})) {
    availability = { state: "unaffordable", reason: getUiCostShortfall(cost) || "Insufficient resources" };
  } else if (!usable) {
    availability = {
      state: "wrong-context",
      reason: options.unavailableReason || "Requirements or materials are not ready",
    };
  }

  applyUiActionState(button, availability, button);
}

function getUiActionContextReason(actionName) {
  const campActions = ["catchBreath", "recover", "gatherWood", "gatherFood", "addWoodToFuel", "addImbuedWoodToFuel", "practiceManaCycling"];
  const packingActions = [
    "packFood",
    "packWater",
    "packTrap",
    "packPelt",
    "packOre",
    "packWood",
    "packStone",
    "packIron",
    "packImbuedWood",
    "packHerb",
    "packGlimmerleaf",
    "packChargedCrystal",
  ];
  const locationActions = [
    "exploreLocation",
    "gatherFiber",
    "gatherHerbs",
    "gatherGlimmerleaf",
    "scoutTrapSite",
    "setTrap",
    "checkTrap",
    "gatherStone",
    "mineOre",
    "trackGame",
    "useHuntingLure",
    "huntGame",
    "storePelt",
    "storeWood",
    "storeOre",
    "storeHerb",
    "storeGlimmerleaf",
    "takeLeather",
    "takeIron",
    "enterDungeon",
    "leaveDungeon",
    "investigateNorthernDisturbance",
    "challengeEarthElemental",
    "investigateEasternDisturbance",
    "challengeThornfang",
    "investigateSouthernDisturbance",
    "challengeBlightedBriar",
  ];

  if (campActions.includes(actionName)) return "Available at Camp";
  if (packingActions.includes(actionName)) return "Prepare an expedition first";
  if (locationActions.includes(actionName)) return "Available at a matching location";
  if (actionName === "beginExpedition") return "Choose a route at Camp";
  if (actionName === "travel") return "Prepare an expedition first";
  if (actionName === "returnToCamp") return "Available while exploring";
  if (actionName === "meditate") return "Available at a meditation place";
  if (actionName.indexOf("concentrate") === 0) return "Available at the alchemy workbench";
  return "Requirements are not met in this context";
}

function applyUiActionState(button, availability, cacheKey) {
  if (!button || !availability) return;

  // Being busy is a temporary global state, not an action-specific failure.
  // Keep the visual busy treatment, but do not add a reason line to every
  // button because that changes their height and shifts the interface.
  const visibleReason = availability.state === "busy" ? "" : availability.reason || "";
  const signature = availability.state + "|" + visibleReason;
  const key = cacheKey || button;
  const cache = typeof key === "object" && key !== null ? actionElementStateRenderCache : actionStateRenderCache;

  if (cache.get(key) === signature) return;

  cache.set(key, signature);
  button.dataset.uiState = availability.state;
  button.classList.toggle("is-running", availability.state === "running");
  button.classList.toggle("is-unaffordable", availability.state === "unaffordable");
  button.classList.toggle("is-busy-blocked", availability.state === "busy");
  button.classList.toggle("is-context-blocked", availability.state === "wrong-context");
  button.classList.toggle("is-locked", availability.state === "locked");
  setUiActionButtonLabel(button, { reason: visibleReason });
  button.setAttribute("aria-disabled", String(button.disabled));
}

function updatePrimaryActionEmphasis() {
  const activePanel = document.querySelector(".main-view-panel.active");

  document.querySelectorAll(".is-primary").forEach(function (button) {
    button.classList.remove("is-primary");
  });

  if (!activePanel) return;

  const selectors = [
    ".camp-actions-list .action-btn[data-ui-state='ready']",
    ".travel-actions .action-btn[data-ui-state='ready']",
    ".location-object-actions .action-btn[data-ui-state='ready']",
    ".shared-actions-list .action-btn[data-ui-state='ready']",
    ".project-work-btn:not([disabled])",
  ];

  for (let i = 0; i < selectors.length; i++) {
    const candidate = activePanel.querySelector(selectors[i]);

    if (candidate && candidate.style.display !== "none") {
      candidate.classList.add("is-primary");
      return;
    }
  }
}

function updateDynamicActionButtonLabel(actionName, action) {
  if (!action || !action.button) return;

  const label = getUiActionLabelElement(action.button);

  if (!label) return;

  if (actionName === "practiceManaCycling" && typeof getManaCyclingActionLabel === "function") {
    setUiActionButtonLabel(action.button, {
      label: getManaCyclingActionLabel(),
      cost: getUiActionCostText(actionName),
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

  if (actionName === "investigateNorthernDisturbance") {
    return typeof canInvestigateNorthernDisturbance === "function" && canInvestigateNorthernDisturbance();
  }

  if (actionName === "challengeEarthElemental") {
    return typeof canChallengeNorthernEarthElemental === "function" && canChallengeNorthernEarthElemental();
  }

  if (actionName === "investigateEasternDisturbance") {
    return typeof canInvestigateRegionalDisturbance === "function" && canInvestigateRegionalDisturbance("east");
  }

  if (actionName === "challengeThornfang") {
    return typeof canChallengeRegionalEnemy === "function" && canChallengeRegionalEnemy("east");
  }

  if (actionName === "investigateSouthernDisturbance") {
    return typeof canInvestigateRegionalDisturbance === "function" && canInvestigateRegionalDisturbance("south");
  }

  if (actionName === "challengeBlightedBriar") {
    return typeof canChallengeRegionalEnemy === "function" && canChallengeRegionalEnemy("south");
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
  enhancePackingControls();
  updateReturnToCampButtonLabel();
}

function enhancePackingControls() {
  if (typeof getBatchPackingActionNames !== "function") return;

  getBatchPackingActionNames().forEach(function (actionName) {
    const action = getAction(actionName);
    const button = action && action.button;

    if (!button || button.closest(".packing-control-group")) return;

    const group = document.createElement("div");
    group.className = "packing-control-group";
    button.parentElement.insertBefore(group, button);
    group.appendChild(button);

    [5, 10].forEach(function (amount) {
      const batchButton = document.createElement("button");
      batchButton.type = "button";
      batchButton.className = "packing-batch-btn";
      batchButton.dataset.packAction = actionName;
      batchButton.dataset.packAmount = String(amount);
      batchButton.textContent = "+" + amount;
      const item = getResource(getBatchPackingItemName(actionName));
      batchButton.setAttribute("aria-label", "Pack up to " + amount + " " + (item ? item.label : "items"));
      batchButton.addEventListener("click", function () {
        packExpeditionAmount(actionName, amount);
      });
      group.appendChild(batchButton);
    });

    syncPackingControlGroupState(actionName);
  });
}

function syncPackingControlGroupState(actionName) {
  const action = typeof getAction === "function" ? getAction(actionName) : null;
  const button = action && action.button;
  const group = button && button.closest(".packing-control-group");

  if (!group) return;

  group.style.display = button.style.display === "none" ? "none" : "grid";
  const usable = typeof canUseBatchPackingAction === "function" && canUseBatchPackingAction(actionName);
  group.querySelectorAll(".packing-batch-btn").forEach(function (batchButton) {
    batchButton.disabled = !usable;
  });
}

function updateExpeditionLoadoutVisibility() {
  const campUnlocked = gameState.phase === "expedition";

  if (campUnlocked) {
    if (hasUnlockedOrPurchasedGear()) {
      showElement(ui.gearSection, "flex");
    } else {
      hideElement(ui.gearSection);
    }
  } else {
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
  if (!ui.activeTaskCard) return;

  const activityText = getCurrentActivitySummaryText();

  if (!activityText) {
    if (lastActivitySignature) announceUiStatus("The current task has ended.");
    lastActivitySignature = "";
    ui.activeTaskCard.dataset.active = "false";
    ui.activeTaskCard.setAttribute("aria-label", "Activity: ready");
    setUiTextIfChanged(ui.activeTaskStatusText, "Activity");
    setUiTextIfChanged(ui.activeTaskTitle, "Ready");
    updateActiveTaskProgress(0, 0);
    return;
  }

  const activity = gameState.activity;
  const signature = [activity.kind, activity.type, activity.id, activity.mode, activityText].join("|");
  ui.activeTaskCard.dataset.active = "true";
  ui.activeTaskCard.setAttribute("aria-label", "Activity: " + activityText);
  setUiTextIfChanged(ui.activeTaskStatusText, "Activity");

  if (signature !== lastActivitySignature) {
    lastActivitySignature = signature;
    setUiTextIfChanged(ui.activeTaskTitle, activityText);
    announceUiStatus("Task started: " + activityText);
  }

  const durationMs = Math.max(0, Number(activity.duration) || 0) * 1000;
  const elapsed = durationMs > 0 && activity.startTime ? Math.max(0, getGameTime() - activity.startTime) : 0;
  const progress = durationMs > 0 ? Math.min(elapsed / durationMs, 1) : 0;
  updateActiveTaskProgress(progress, Math.max(0, durationMs - elapsed) / 1000);
}

function updateActiveTaskProgress(progress, remainingSeconds) {
  if (!ui.activeTaskProgressFill || !ui.activeTaskMeter) return;

  const clamped = Math.min(Math.max(Number(progress) || 0, 0), 1);
  const percent = Math.round(clamped * 100);
  const bucket = String(percent);

  if (ui.activeTaskProgressFill.dataset.progressBucket !== bucket) {
    ui.activeTaskProgressFill.dataset.progressBucket = bucket;
    ui.activeTaskProgressFill.style.width = percent + "%";
    ui.activeTaskMeter.setAttribute("aria-valuenow", bucket);
    setUiTextIfChanged(ui.activeTaskProgressText, percent + "%");
  }

  const remaining = remainingSeconds > 0 ? Math.ceil(remainingSeconds * 10) / 10 + "s" : "";
  setUiTextIfChanged(ui.activeTaskRemainingText, remaining);
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
