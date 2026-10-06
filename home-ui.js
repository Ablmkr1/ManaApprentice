const HOME_AREA_DEFINITIONS = {
  opening: {
    title: "Lost in the Woods",
    description: "Catch your breath, then push through the mist until you understand the ground around you.",
    nodeIds: ["campActionsSection"],
  },
  wood: {
    title: "Deadfall",
    description: "A dead tree and its fallen limbs lie near the edge of the clearing.",
    nodeIds: ["campActionsSection", "campLocationObjectActionsSlot"],
    objectName: "deadTree",
    discoveryFlag: "discoveredDeadfall",
  },
  food: {
    title: "Berry Bush",
    description: "Dense brush at the clearing's edge may hide something edible.",
    nodeIds: ["campActionsSection", "campLocationObjectActionsSlot"],
    objectName: "berryBush",
    discoveryFlag: "discoveredBerryBush",
  },
  water: {
    title: "Sound of Water",
    description: "Running water can be heard beyond the lower edge of the clearing.",
    nodeIds: ["campActionsSection", "campLocationObjectActionsSlot"],
    objectName: "soundOfWater",
    discoveryFlag: "discoveredStream",
  },
  tower: {
    title: "The Tower",
    description: "The buried structure waits beneath the clearing.",
    nodeIds: [],
    destination: "tower",
  },
  trail: {
    title: "Trail",
    description: "The worn path leads beyond the shelter of the clearing.",
    nodeIds: [],
    destination: "expedition",
  },
  campfire: {
    title: "Campfire & Clearing",
    description: "Recover, gather nearby supplies, tend fuel, and use the contextual actions already available at camp.",
    nodeIds: ["campActionsSection", "campContextualActions", "campLocationObjectActionsSlot"],
  },
  workspot: {
    title: "Work Spot",
    description: "A stump, a flat stone, and a few crude tools are enough to begin crafting.",
    nodeIds: ["craftingSection"],
    workPanel: "crafting",
  },
  workbench: {
    title: "Workbench",
    description: "Use every currently available crafting recipe.",
    nodeIds: ["craftingSection"],
    workPanel: "crafting",
  },
  shelter: {
    title: "Shelter",
    description: "Rest beneath the crude lean-to.",
    nodeIds: [],
    directAction: "rest",
  },
  study: {
    title: "Research Spot",
    description: "Review discoveries and pursue currently available research.",
    nodeIds: ["craftingSection"],
    workPanel: "research",
    panelMode: "expanded",
  },
  processing: {
    title: "Processing Station",
    description: "Tan leather, smelt iron, and prepare the practical mixtures currently available at camp.",
    nodeIds: ["processingFuelSection", "craftingSection"],
    workPanel: "crafting",
  },
  meditation: {
    title: "Meditation Spot",
    description: "Settle into the prepared quiet and restore mana.",
    nodeIds: [],
    directAction: "meditate",
  },
  training: {
    title: "Practice Circle",
    description: "A marked space for practice. Training methods will gather here as you discover them.",
    nodeIds: ["trainingSection"],
  },
// RETIRED: Tower Heart controls replace this camp automation screen.
//   automation: {
//     title: "Runed Devices",
//     description: "Manage the same camp automation controls from their place in the clearing.",
//     nodeIds: ["craftingSection"],
//     workPanel: "automation",
//   },
  storage: {
    title: "Storage Cache",
    description: "Review the supplies currently stored at camp.",
    nodeIds: ["campResourcesSection"],
  },
};

const HOME_OPENING_RESOURCE_ACTIONS = {
  wood: "gatherWood",
  food: "gatherFood",
};

const HOME_OPENING_CONSTRUCTION = {
  campfire: "smallFire",
  shelter: "crudeLeanTo",
};

let selectedHomeArea = null;
let homeUiHooked = false;
let homeTowerSignature = "";
let homeSceneSignature = "";
const homeNodeAnchors = new Map();

function isTowerHomeRelocated() {
  return typeof hasRelocatedToTower === "function" && hasRelocatedToTower();
}

function hookHomeUI() {
  if (homeUiHooked) return;

  const scene = document.getElementById("homeScene");
  const closeButton = document.getElementById("homeAreaCloseBtn");
  if (!scene || !closeButton) return;

  homeUiHooked = true;
  scene.querySelectorAll("[data-home-direct-action]").forEach(function (button) {
    button.addEventListener("click", function () {
      activateHomeAction(button.dataset.homeDirectAction);
    });
  });
  scene.querySelectorAll("[data-home-area]").forEach(function (button) {
    button.addEventListener("click", function () {
      const areaName = button.dataset.homeArea;
      const definition = HOME_AREA_DEFINITIONS[areaName];
      if (isHomeOpeningSequence()) {
        if (areaName === "water" && gameState.discoveredStream) return;
        if (HOME_OPENING_RESOURCE_ACTIONS[areaName] || areaName === "water") {
          activateHomeOpeningResource(areaName);
          return;
        }
        if (areaName === "workspot" && areHomeResourcesDiscovered() && !isHomeWorkSpotDeclared()) {
          declareHomeWorkSpot();
          return;
        }
        if (HOME_OPENING_CONSTRUCTION[areaName] && !hasPurchasedCampUpgrade(HOME_OPENING_CONSTRUCTION[areaName])) {
          activateHomeConstruction(areaName);
          return;
        }
      }
      if (definition && definition.destination) {
        activateHomeDestination(definition.destination);
        return;
      }
      if (definition && definition.directAction) {
        activateHomeDirectAction(definition.directAction);
        return;
      }
      selectHomeArea(button.dataset.homeArea, { userSelected: true });
    });
  });

  closeButton.addEventListener("click", function () {
    selectHomeArea(isHomeCampEstablished() ? null : "opening");
  });
  window.addEventListener("scroll", positionHomeOverlay, { passive: true });
  window.addEventListener("resize", positionHomeOverlay);

  updateHomeAreaAvailability();
}

function isHomeOpeningSequence() {
  return !isHomeCampEstablished() && !isTowerHomeRelocated();
}

function activateHomeAction(actionName) {
  if (actionName === "rest" && typeof ui !== "undefined" && ui.restBtn) {
    if (typeof updateRestButton === "function") updateRestButton();
    if (!ui.restBtn.disabled) ui.restBtn.click();
    return;
  }
  if (typeof getAction !== "function") return;
  const action = getAction(actionName);
  if (!action || !action.unlocked || !action.button) return;
  if (typeof updateActionButton === "function") updateActionButton(actionName);
  if (!action.button.disabled) action.button.click();
}

function activateHomeOpeningResource(areaName) {
  const definition = HOME_AREA_DEFINITIONS[areaName];
  if (!definition || !definition.objectName) return;

  if (gameState[definition.discoveryFlag]) {
    activateHomeAction(HOME_OPENING_RESOURCE_ACTIONS[areaName]);
    return;
  }

  if (typeof startLocationObjectExploration === "function") {
    startLocationObjectExploration(definition.objectName);
  }
}

function activateHomeConstruction(areaName) {
  const upgradeName = HOME_OPENING_CONSTRUCTION[areaName];
  const upgrade = typeof getCampUpgrade === "function" ? getCampUpgrade(upgradeName) : null;
  if (!upgrade || !upgrade.unlocked || upgrade.purchased || !upgrade.button) return;
  if (typeof updateCraftingButtons === "function") updateCraftingButtons();
  if (!upgrade.button.disabled) upgrade.button.click();
}

function activateHomeDirectAction(actionName) {
  if (actionName === "rest" && typeof ui !== "undefined" && ui.restBtn) {
    ui.restBtn.click();
    return;
  }

  if (actionName === "meditate" && typeof getAction === "function") {
    const meditation = getAction("meditate");
    if (meditation && meditation.button) meditation.button.click();
  }
}

function activateHomeDestination(viewName) {
  if (viewName === "tower" && !isHomeTowerDiscovered()) return;
  if (viewName === "expedition" && !isHomeTrailAvailable()) return;
  if (typeof setMainView === "function") setMainView(viewName, { userSelected: true, homeTowerEntry: viewName === "tower" });
}

function syncHomeView(isActive) {
  if (!homeUiHooked) hookHomeUI();
  if (!homeUiHooked) return;

  if (!isActive) {
    restoreHomeCampNodes();
    return;
  }

  updateHomeAreaAvailability();
  renderHomeTowerPlaceholder();

  if (selectedHomeArea) {
    const selectedButton = document.querySelector('[data-home-area="' + selectedHomeArea + '"]');
    if (selectedHomeArea !== "opening" && (!selectedButton || selectedButton.hidden)) selectHomeArea(null);
    else if (!isHomeAreaMounted(selectedHomeArea)) mountHomeArea(selectedHomeArea);
  }
}

function selectHomeArea(areaName, options = {}) {
  if (isTowerHomeRelocated() && ![null, "wood", "food", "water", "tower", "trail"].includes(areaName)) areaName = null;
  if (areaName !== null && !HOME_AREA_DEFINITIONS[areaName]) return;

  if (options.userSelected) markHomeAreaAttentionSeen(areaName);

  selectedHomeArea = areaName;
  restoreHomeCampNodes();
  updateHomeAreaSelection();

  if (areaName) mountHomeArea(areaName);
}

function isCraftVisibleInCurrentHomeArea(craft, areaName = selectedHomeArea) {
  if (typeof currentMainView !== "undefined" && currentMainView === "tower") return true;
  if (!craft || !craft.campHomeArea || typeof isCampCraftingContext !== "function" || !isCampCraftingContext()) return true;
  if (!["workspot", "workbench", "processing"].includes(areaName)) return true;

  return areaName === "processing"
    ? craft.campHomeArea === "processing"
    : craft.campHomeArea !== "processing";
}

function mountHomeArea(areaName) {
  const definition = HOME_AREA_DEFINITIONS[areaName];
  const panel = document.getElementById("homeAreaPanel");
  const content = document.getElementById("homeAreaContent");
  if (!definition || !panel || !content) return;

  restoreHomeCampNodes();
  content.replaceChildren();
  panel.scrollTop = 0;

  const copy = getHomeAreaCopy(areaName, definition);
  const kicker = document.getElementById("homeAreaKicker");
  const title = document.getElementById("homeAreaTitle");
  const description = document.getElementById("homeAreaDescription");
  const layout = panel.closest(".home-clearing-layout");
  const panelMode = definition.panelMode === "expanded" ? "expanded" : "standard";
  if (kicker) kicker.textContent = areaName === "opening" ? "First steps" : definition.objectName ? "Clearing discovery" : "Camp station";
  if (title) title.textContent = copy.title;
  if (description) description.textContent = copy.description;
  panel.dataset.homeArea = areaName;
  panel.dataset.panelMode = panelMode;
  if (definition.objectName) {
    panel.dataset.homeObject = definition.objectName;
    panel.dataset.homeDiscovered = String(!!gameState[definition.discoveryFlag]);
  } else {
    delete panel.dataset.homeObject;
    delete panel.dataset.homeDiscovered;
  }
  if (layout) {
    const selectedButton = document.querySelector('[data-home-area="' + areaName + '"]');
    const scene = document.getElementById("homeScene");
    layout.dataset.panelMode = panelMode;
    layout.dataset.panelSide = selectedButton && scene && selectedButton.offsetLeft + selectedButton.offsetWidth / 2 > scene.offsetWidth / 2
      ? "left"
      : "right";
  }

  const nodeIds = getHomeAreaNodeIds(areaName, definition);
  nodeIds.forEach(function (nodeId) {
    const node = document.getElementById(nodeId);
    if (!node) return;

    rememberHomeNodePosition(node);
    content.appendChild(node);

    if (node.tagName === "DETAILS") node.open = true;
  });

  if (definition.workPanel && typeof showWorkPanel === "function") {
    showWorkPanel(definition.workPanel, { userSelected: true });
  }
  if (typeof updateCraftingUIForCurrentContext === "function") updateCraftingUIForCurrentContext();
  if (areaName === "processing") updateProcessingFuelDisplay();
  if (typeof syncContextualActionPlacement === "function") syncContextualActionPlacement();

  if (areaName === "workspot" && !isHomeWorkSpotDeclared()) {
    const declareButton = typeof createUiActionButton === "function"
      ? createUiActionButton({ label: "Declare Work Spot", detail: "Establish a primitive building area", progress: false })
      : document.createElement("button");
    if (!declareButton.classList.contains("action-btn")) declareButton.className = "action-btn";
    if (!declareButton.textContent) declareButton.textContent = "Declare Work Spot";
    declareButton.type = "button";
    declareButton.addEventListener("click", declareHomeWorkSpot);
    content.appendChild(declareButton);
  }

  if (areaName === "water" && gameState.discoveredStream) {
    const note = document.createElement("p");
    note.className = "home-resource-note";
    note.textContent = "The narrow stream gives the clearing a dependable source of fresh water.";
    content.appendChild(note);
  }

  panel.hidden = false;
  requestAnimationFrame(positionHomeOverlay);
}

function updateProcessingFuelDisplay() {
  const display = document.getElementById("processingFuelAmount");
  if (!display || typeof getResource !== "function") return;
  display.textContent = "Fuel: " + formatResourceAmountForDisplay(getResource("fuel").value);
}

function positionHomeOverlay() {
  const panel = document.getElementById("homeAreaPanel");
  const scene = document.getElementById("homeScene");
  if (!panel || !scene || panel.hidden) return;

  if (window.matchMedia && window.matchMedia("(max-width: 900px)").matches) {
    panel.style.removeProperty("--home-panel-top");
    return;
  }

  const sceneRect = scene.getBoundingClientRect();
  const edge = 16;
  const viewportInset = 84;
  const maxTop = Math.max(edge, scene.offsetHeight - panel.offsetHeight - edge);
  const top = Math.max(edge, Math.min(maxTop, viewportInset - sceneRect.top));
  panel.style.setProperty("--home-panel-top", top + "px");
}

function getHomeAreaCopy(areaName, definition) {
  if (areaName === "study" && typeof hasPurchasedCampUpgrade === "function" && hasPurchasedCampUpgrade("researchBench")) {
    return { title: "Research Bench", description: definition.description };
  }
  if (areaName === "opening" && gameState.discoveredClearing) {
    return {
      title: "The Clearing",
      description: "Rest here whenever you need strength for another careful search of the clearing's edges.",
    };
  }

  if (!definition || !definition.discoveryFlag || !gameState[definition.discoveryFlag]) {
    return { title: definition.title, description: definition.description };
  }

  if (areaName === "wood") return { title: "Deadfall", description: "The fallen limbs provide a ready source of firewood." };
  if (areaName === "food") return { title: "Berry Bush", description: "The bitter berries are edible and can be gathered as needed." };
  if (areaName === "water") return { title: "The Stream", description: "A narrow stream runs just beyond the clearing." };
  return { title: definition.title, description: definition.description };
}

function getHomeAreaNodeIds(areaName, definition) {
  if (areaName === "workspot" && !isHomeWorkSpotDeclared()) return [];
  return definition.nodeIds;
}

function rememberHomeNodePosition(node) {
  if (homeNodeAnchors.has(node)) return;

  const anchor = document.createComment("home-return:" + node.id);
  node.parentNode.insertBefore(anchor, node);
  homeNodeAnchors.set(node, anchor);
}

function isHomeAreaMounted(areaName) {
  const definition = HOME_AREA_DEFINITIONS[areaName];
  const content = document.getElementById("homeAreaContent");
  if (!definition || !content) return false;
  const nodeIds = getHomeAreaNodeIds(areaName, definition);
  if (nodeIds.length === 0) return !document.getElementById("homeAreaPanel").hidden;

  return nodeIds.every(function (nodeId) {
    const node = document.getElementById(nodeId);
    return !!node && node.parentNode === content && homeNodeAnchors.has(node);
  });
}

function restoreHomeCampNodes() {
  homeNodeAnchors.forEach(function (anchor, node) {
    if (anchor.parentNode) anchor.parentNode.insertBefore(node, anchor.nextSibling);
  });
  homeNodeAnchors.clear();
}

function updateHomeAreaSelection() {
  const panel = document.getElementById("homeAreaPanel");
  const closeButton = document.getElementById("homeAreaCloseBtn");
  const layout = panel ? panel.closest(".home-clearing-layout") : null;

  document.querySelectorAll("[data-home-area]").forEach(function (button) {
    const isSelected = button.dataset.homeArea === selectedHomeArea;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-expanded", String(isSelected));
  });

  if (panel) panel.hidden = !selectedHomeArea;
  if (closeButton) closeButton.hidden = !selectedHomeArea || selectedHomeArea === "opening";
  if (!selectedHomeArea) {
    if (panel) {
      panel.dataset.panelMode = "standard";
      panel.style.removeProperty("--home-panel-top");
    }
    if (layout) {
      layout.dataset.panelMode = "standard";
      delete layout.dataset.panelSide;
    }
  }
}

function updateHomeAreaAvailability() {
  const relocated = typeof hasRelocatedToTower === "function" && hasRelocatedToTower();
  const sceneState = getHomeSceneState();
  const exploreStep = getHomeExploreStep();
  const resourcesDiscovered = areHomeResourcesDiscovered();
  const workSpotDeclared = isHomeWorkSpotDeclared();
  const established = sceneState === "established-camp";
  const workbenchBuilt = typeof hasPurchasedCampUpgrade === "function" && hasPurchasedCampUpgrade("workbench");
  const researchBenchBuilt = typeof hasPurchasedCampUpgrade === "function" && hasPurchasedCampUpgrade("researchBench");
  const smallFireBuilt = typeof hasPurchasedCampUpgrade === "function" && hasPurchasedCampUpgrade("smallFire");
  const shelterBuilt = typeof hasPurchasedCampUpgrade === "function" && hasPurchasedCampUpgrade("crudeLeanTo");
  const showResources = relocated || (sceneState !== "fogged" && !established);
  const signature = [sceneState, exploreStep, gameState.discoveredDeadfall, gameState.discoveredBerryBush, gameState.discoveredStream, workSpotDeclared, workbenchBuilt, researchBenchBuilt, smallFireBuilt, shelterBuilt].join("|");
  const sceneChanged = signature !== homeSceneSignature;
  homeSceneSignature = signature;

  updateHomeScenePresentation(sceneState, exploreStep);
  if (typeof updateHomeOpeningActionHotspots === "function") updateHomeOpeningActionHotspots(sceneState);
  setHomeAreaVisible("wood", showResources);
  setHomeAreaVisible("food", showResources);
  setHomeAreaVisible("water", showResources);
  updateHomeResourceMarker("wood", gameState.discoveredDeadfall, "Gather firewood");
  updateHomeResourceMarker("food", gameState.discoveredBerryBush, "Gather berries");
  updateHomeResourceMarker("water", gameState.discoveredStream, "");

  const showPrimitiveWorkSpot = resourcesDiscovered && !established && !workSpotDeclared;
  setHomeAreaVisible("workspot", showPrimitiveWorkSpot || (established && hasVisibleHomeWork() && !workbenchBuilt));
  setHomeAreaVisible("workbench", established && hasVisibleHomeWork() && workbenchBuilt);
  setHomeAreaVisible("campfire", sceneState === "primitive-camp" || smallFireBuilt);
  setHomeAreaVisible("shelter", sceneState === "primitive-camp" || shelterBuilt);
  setHomeAreaVisible("study", established && typeof isResearchSpotPurchased === "function" && isResearchSpotPurchased());
  const processingBuilt = typeof hasPurchasedCampUpgrade === "function" && (
    hasPurchasedCampUpgrade("campTannery") ||
    hasPurchasedCampUpgrade("campSmelter") ||
    hasPurchasedCampUpgrade("campAlchemyStation")
  );
  setHomeAreaVisible("processing", established && processingBuilt);
  setHomeAreaVisible("meditation", established && typeof hasPurchasedCampUpgrade === "function" && (
    hasPurchasedCampUpgrade("meditationSpot") ||
    hasPurchasedCampUpgrade("attunedMeditationSpot") ||
    hasPurchasedCampUpgrade("greaterMeditationSpot")
  ));
  // A completed structure always has a place in Home. Its contents may still be
  // empty until the player discovers the relevant skill or resource systems.
  setHomeAreaVisible("training", established && typeof hasPurchasedCampUpgrade === "function" && hasPurchasedCampUpgrade("practiceCircle"));
  // RETIRED: setHomeAreaVisible("automation", established && hasUnlockedAutomation());
  setHomeAreaVisible("automation", false);
  setHomeAreaVisible("storage", established && typeof hasPurchasedCampUpgrade === "function" && hasPurchasedCampUpgrade("storageCache"));

  const workSpot = document.querySelector('[data-home-area="workspot"]');
  if (workSpot) {
    const workSpotHint = workSpot.querySelector(".home-place-label small");
    workSpot.classList.toggle("has-new-system", sceneState === "workspot-available");
    if (workSpotHint) {
      workSpotHint.textContent = established
        ? "Improvise and craft"
        : workSpotDeclared
          ? "Build shelter and fire"
          : "Declare this place";
    }
  }

  updateHomeCampStructureVisuals();
  if (typeof updateHomeAttentionIndicators === "function") updateHomeAttentionIndicators();
  updateHomeTowerVisibility();
  updateHomeTrailVisibility();

  if (established && selectedHomeArea === "opening") {
    selectHomeArea(null);
  }

  if (sceneChanged && selectedHomeArea === "opening") {
    mountHomeArea("opening");
  } else if (selectedHomeArea && selectedHomeArea !== "opening") {
    const selectedButton = document.querySelector('[data-home-area="' + selectedHomeArea + '"]');
    if (!selectedButton || selectedButton.hidden) selectHomeArea(null);
    else if (sceneChanged && (HOME_AREA_DEFINITIONS[selectedHomeArea].objectName || selectedHomeArea === "workspot" || selectedHomeArea === "study")) mountHomeArea(selectedHomeArea);
  }
}

function updateHomeOpeningActionHotspots(sceneState = getHomeSceneState()) {
  document.querySelectorAll("[data-home-direct-action]").forEach(function (button) {
    const isRestSpot = button.classList.contains("home-place-catch-breath");
    const visible = sceneState === "fogged" || (isRestSpot && isHomeOpeningSequence() && !hasPurchasedCampUpgrade("crudeLeanTo"));
    button.hidden = !visible;
    if (!visible) return;
    if (isRestSpot && sceneState !== "fogged") {
      button.dataset.homeDirectAction = "rest";
      updateHomeRestHotspot(button);
      return;
    }
    if (isRestSpot) button.dataset.homeDirectAction = "catchBreath";
    const actionName = button.dataset.homeDirectAction;
    if (typeof getAction !== "function") return;
    updateHomeActionHotspot(button, actionName);
  });
}

function updateHomeRestHotspot(button) {
  const source = typeof ui !== "undefined" ? ui.restBtn : null;
  const running = typeof isActivityActive === "function" && isActivityActive() && gameState.activity.kind === "rest";
  const name = button.querySelector(".home-place-label strong");
  const hint = button.querySelector(".home-place-label small");
  const fill = button.querySelector(".progressFill");
  if (typeof updateRestButton === "function") updateRestButton();
  if (name) name.textContent = "Rest in Clearing";
  if (hint) hint.textContent = running ? "Recovering energy" : "Recover your strength";
  if (fill) fill.style.width = source?.querySelector(".progressFill")?.style.width || "0%";
  button.disabled = !source || source.disabled;
  button.dataset.uiState = running ? "running" : button.disabled ? "blocked" : "ready";
  button.setAttribute("aria-label", "Rest in Clearing");
}

function updateHomeActionHotspot(button, actionName) {
  const action = getAction(actionName);
  const source = action && action.button;
  const availability = typeof getUiActionAvailability === "function"
    ? getUiActionAvailability(actionName)
    : { state: source && source.disabled ? "blocked" : "ready", reason: "" };
  const label = source?.querySelector(".ui-action-label")?.textContent || action?.label || actionName;
  const cost = source?.querySelector(".ui-action-cost")?.textContent || "";
  const detail = source?.querySelector(".ui-action-detail")?.textContent || "";
  const name = button.querySelector(".home-place-label strong");
  const hint = button.querySelector(".home-place-label small");
  const fill = button.querySelector(".progressFill");

  if (name) name.textContent = label;
  if (hint) hint.textContent = [cost, detail, availability.reason].filter(Boolean).join(" · ") || (actionName === "catchBreath" ? "Recover your strength" : "Push into the mist");
  if (fill) fill.style.width = action?.progressBar?.style.width || "0%";
  button.disabled = !action?.unlocked || !source || source.disabled;
  button.dataset.uiState = availability.state;
  button.setAttribute("aria-label", label + (availability.reason ? ", " + availability.reason : ""));
}

function updateHomeOpeningResourceHotspots() {
  if (!isHomeOpeningSequence()) return;
  Object.keys(HOME_OPENING_RESOURCE_ACTIONS).forEach(function (areaName) {
    const definition = HOME_AREA_DEFINITIONS[areaName];
    const button = document.querySelector('[data-home-area="' + areaName + '"]');
    if (!definition || !button || button.hidden) return;

    const discovered = !!gameState[definition.discoveryFlag];
    if (discovered) {
      updateHomeActionHotspot(button, HOME_OPENING_RESOURCE_ACTIONS[areaName]);
      button.removeAttribute("aria-controls");
      button.removeAttribute("aria-expanded");
      return;
    }

    const object = typeof getLocationObject === "function" ? getLocationObject("clearing", definition.objectName) : null;
    const cost = object && typeof getLocationObjectCost === "function" ? getLocationObjectCost(object) : {};
    const canAfford = typeof canAffordCost !== "function" || canAffordCost(cost);
    const isCurrent = typeof isActivityActive === "function" && isActivityActive() && gameState.activity.kind === "locationObject" && gameState.activity.context?.objectName === definition.objectName;
    const name = button.querySelector(".home-place-label strong");
    const hint = button.querySelector(".home-place-label small");
    const fill = button.querySelector(".progressFill");
    button.disabled = !object || (!isCurrent && ((typeof isActivityActive === "function" && isActivityActive()) || !canAfford));
    button.dataset.uiState = isCurrent ? "running" : button.disabled ? "blocked" : "ready";
    if (name && object) name.textContent = object.label;
    if (hint && object) hint.textContent = [object.label, typeof formatCost === "function" ? formatCost(cost) : ""].filter(Boolean).join(" · ");
    if (fill) fill.style.width = isCurrent && gameState.activity.duration ? Math.min(100, Math.max(0, (getGameTime() - gameState.activity.startTime) / (gameState.activity.duration * 10))) + "%" : "0%";
    button.setAttribute("aria-label", object ? object.label : definition.title);
    button.removeAttribute("aria-controls");
    button.removeAttribute("aria-expanded");
  });
}

function updateHomeConstructionHotspots() {
  if (!isHomeOpeningSequence()) return;
  Object.keys(HOME_OPENING_CONSTRUCTION).forEach(function (areaName) {
    const upgradeName = HOME_OPENING_CONSTRUCTION[areaName];
    const upgrade = typeof getCampUpgrade === "function" ? getCampUpgrade(upgradeName) : null;
    const button = document.querySelector('[data-home-area="' + areaName + '"]');
    if (!upgrade || !button || upgrade.purchased || button.hidden) return;
    const source = upgrade.button;
    const name = button.querySelector(".home-place-label strong");
    const hint = button.querySelector(".home-place-label small");
    const fill = button.querySelector(".progressFill");
    const label = upgrade.displayName || upgrade.label;
    const cost = source?.querySelector(".ui-action-cost")?.textContent || (typeof formatCost === "function" ? formatCost(upgrade.cost) : "");
    const running = typeof isActivityActive === "function" && isActivityActive() && gameState.activity.kind === "craft" && gameState.activity.type === "campUpgrade" && gameState.activity.id === upgradeName;
    if (name) name.textContent = label;
    if (hint) hint.textContent = ["Build here", cost].filter(Boolean).join(" · ");
    if (fill) fill.style.width = source?.querySelector(".progressFill")?.style.width || "0%";
    button.classList.add("is-construction-site");
    button.disabled = !running && (!upgrade.unlocked || !source || source.disabled);
    button.dataset.uiState = running ? "running" : button.disabled ? "blocked" : "ready";
    button.setAttribute("aria-label", "Build " + label + (cost ? ", " + cost : ""));
    button.removeAttribute("aria-controls");
    button.removeAttribute("aria-expanded");
  });
}

function getHomeAttentionState() {
  if (!gameState.homeAttention || typeof gameState.homeAttention !== "object") gameState.homeAttention = {};
  if (!gameState.homeAttention.seen || typeof gameState.homeAttention.seen !== "object") gameState.homeAttention.seen = {};

  ["crafting", "research", "training"].forEach(function (category) {
    if (!Array.isArray(gameState.homeAttention.seen[category])) gameState.homeAttention.seen[category] = [];
  });

  return gameState.homeAttention;
}

function getAvailableHomeCraftKeys(craftType, definitions, areaName) {
  if (!definitions || typeof isCraftAvailable !== "function") return [];

  return Object.keys(definitions).filter(function (craftId) {
    return isCraftAvailable(craftType, craftId) && isCraftVisibleInCurrentHomeArea(definitions[craftId], areaName);
  }).map(function (craftId) {
    return craftType + ":" + craftId;
  });
}

function getHomeAttentionKeys(category, areaName) {
  if (category === "crafting") {
    return []
      .concat(getAvailableHomeCraftKeys("campUpgrade", typeof getCampUpgradeDefinitions === "function" ? getCampUpgradeDefinitions() : null, areaName))
      .concat(getAvailableHomeCraftKeys("gearUpgrade", typeof getGearUpgradeDefinitions === "function" ? getGearUpgradeDefinitions() : null, areaName))
      .concat(getAvailableHomeCraftKeys("resourceCraft", typeof getResourceCraftDefinitions === "function" ? getResourceCraftDefinitions() : null, areaName));
  }

  if (category === "research") {
    return getAvailableHomeCraftKeys("research", typeof getResearchDefinitions === "function" ? getResearchDefinitions() : null);
  }

  if (category === "training" && typeof isManaCyclingBreakthroughReady === "function" && isManaCyclingBreakthroughReady()) {
    const skill = typeof getSkillState === "function" ? getSkillState("manaCycling") : null;
    return skill ? ["manaCycling:" + (skill.rank || 1) + ":" + (skill.level || 0)] : [];
  }

  return [];
}

function getTowerRoomAttentionCount(roomId) {
  if (roomId !== "library") return 0;
  const state = getHomeAttentionState();
  const research = getHomeAttentionKeys("research").filter(function (key) { return !state.seen.research.includes(key); });
  const training = getHomeAttentionKeys("training").filter(function (key) { return !state.seen.training.includes(key); });
  return research.length + training.length;
}

function markTowerRoomAttentionSeen(roomId) {
  if (roomId !== "library") return;
  const state = getHomeAttentionState();
  ["research", "training"].forEach(function (category) {
    const seen = new Set(state.seen[category]);
    getHomeAttentionKeys(category).forEach(function (key) { seen.add(key); });
    state.seen[category] = [...seen];
  });
  updateHomeAttentionIndicators();
  if (typeof trySaveGame === "function") trySaveGame();
}

function getHomeAttentionCategory(areaName) {
  if (areaName === "workspot" || areaName === "workbench" || areaName === "processing") return "crafting";
  if (areaName === "study") return "research";
  if (areaName === "training") return "training";
  return null;
}

function setHomeAttentionIndicator(areaName, category, keys) {
  const button = document.querySelector('[data-home-area="' + areaName + '"]');
  if (!button) return;

  const seen = new Set(getHomeAttentionState().seen[category]);
  const unseenCount = keys.filter(function (key) { return !seen.has(key); }).length;
  const label = button.querySelector(".home-place-label strong");
  const baseLabel = label ? label.textContent.trim() : HOME_AREA_DEFINITIONS[areaName].title;

  button.classList.toggle("has-camp-attention", unseenCount > 0);
  button.dataset.homeAttentionCount = String(unseenCount);
  button.setAttribute("aria-label", baseLabel + (unseenCount > 0 ? ", new activity available" : ""));
}

function updateHomeAttentionIndicators() {
  setHomeAttentionIndicator("workspot", "crafting", getHomeAttentionKeys("crafting", "workspot"));
  setHomeAttentionIndicator("workbench", "crafting", getHomeAttentionKeys("crafting", "workbench"));
  setHomeAttentionIndicator("processing", "crafting", getHomeAttentionKeys("crafting", "processing"));
  setHomeAttentionIndicator("study", "research", getHomeAttentionKeys("research"));
  setHomeAttentionIndicator("training", "training", getHomeAttentionKeys("training"));
  if (typeof updateTowerRoomNavigation === "function") updateTowerRoomNavigation();
}

function markHomeAreaAttentionSeen(areaName) {
  const category = getHomeAttentionCategory(areaName);
  if (!category) return;

  const state = getHomeAttentionState();
  const previous = new Set(state.seen[category]);
  const keys = getHomeAttentionKeys(category, areaName);
  keys.forEach(function (key) { previous.add(key); });
  if (previous.size === state.seen[category].length) return;

  state.seen[category] = [...previous];
  updateHomeAttentionIndicators();
  if (typeof trySaveGame === "function") trySaveGame();
}

function getHomeExploreStep() {
  if (gameState.discoveredClearing) return 3;
  const count = gameState.exploration && Number.isFinite(gameState.exploration.count) ? gameState.exploration.count : 0;
  return Math.max(0, Math.min(2, count));
}

function areHomeResourcesDiscovered() {
  return !!(gameState.discoveredDeadfall && gameState.discoveredBerryBush && gameState.discoveredStream);
}

function isHomeWorkSpotDeclared() {
  if (isHomeCampEstablished()) return true;
  if (typeof getCampUpgrade !== "function") return false;
  const fire = getCampUpgrade("smallFire");
  const shelter = getCampUpgrade("crudeLeanTo");
  return !!((fire && (fire.unlocked || fire.purchased)) || (shelter && (shelter.unlocked || shelter.purchased)));
}

function isHomeCampEstablished() {
  if (gameState.hasCamp || gameState.phase === "expedition") return true;
  if (typeof hasPurchasedCampUpgrade !== "function") return false;
  return hasPurchasedCampUpgrade("smallFire") && hasPurchasedCampUpgrade("crudeLeanTo");
}

function getHomeSceneState() {
  if (isTowerHomeRelocated()) return "tower-grounds";
  if (isHomeCampEstablished()) return "established-camp";
  if (!gameState.discoveredClearing) return "fogged";
  if (!areHomeResourcesDiscovered()) return "clearing";
  if (!isHomeWorkSpotDeclared()) return "workspot-available";
  return "primitive-camp";
}

function updateHomeScenePresentation(sceneState, exploreStep) {
  const scene = document.getElementById("homeScene");
  const layout = scene ? scene.closest(".home-clearing-layout") : null;
  const kicker = document.getElementById("homeClearingKicker");
  const title = document.getElementById("homeClearingTitle");
  const description = document.getElementById("homeClearingDescription");
  const copy = {
    fogged: ["Home · Unknown woods", "A Clearing in the Mist", "Catch your breath, then explore. Each careful look reveals more of the ground around you."],
    clearing: ["Home · Revealed clearing", "The Clearing", "The fog has lifted. Investigate the deadfall, brush, and sound of running water around the clearing."],
    "workspot-available": ["Home · Revealed clearing", "The Clearing", "The essentials are close at hand. Choose an open place to establish a primitive work area."],
    "primitive-camp": ["Home · Primitive camp", "The Clearing", "Build a Small Fire and Crude Lean-To here. Each completed structure takes its place in the clearing."],
    "established-camp": ["Home · Clearing exterior", "The Clearing", "The fire and lean-to have made this a camp. Practice Circle and Storage Cache plans are now ready to build; each will appear here when finished."],
    "tower-grounds": ["Home exterior", "Tower Grounds", "Gather outdoor supplies, check the trails and traps, or return inside your tower."],
  }[sceneState];

  if (scene) {
    scene.dataset.homeState = sceneState;
    scene.dataset.exploreStep = String(exploreStep);
    scene.setAttribute("aria-label", sceneState === "established-camp" ? "Interactive camp clearing" : "Interactive wilderness clearing");
  }
  if (layout) layout.dataset.homeState = sceneState;
  if (kicker) kicker.textContent = copy[0];
  if (title) title.textContent = copy[1];
  if (description) description.textContent = copy[2];
  if (isTowerHomeRelocated() && scene) scene.setAttribute("aria-label", "Interactive Tower Grounds");
  const closeButton = document.getElementById("homeAreaCloseBtn");
  if (closeButton) {
    closeButton.textContent = isTowerHomeRelocated() ? "Return to grounds" : "Return to clearing";
    closeButton.setAttribute("aria-label", closeButton.textContent);
  }
}

function updateHomeResourceMarker(areaName, discovered, discoveredHint) {
  const marker = document.querySelector('[data-home-area="' + areaName + '"]');
  if (!marker) return;
  const hint = marker.querySelector(".home-place-label small");
  const label = marker.querySelector(".home-place-label strong");
  marker.classList.toggle("has-new-system", !discovered);
  marker.classList.toggle("is-discovered", discovered);
  if (areaName === "water" && discovered) {
    if (label) label.textContent = "Water";
    if (hint) hint.textContent = "";
    marker.disabled = true;
    marker.removeAttribute("aria-controls");
    marker.removeAttribute("aria-expanded");
    marker.setAttribute("aria-label", "Water");
    return;
  }
  marker.disabled = false;
  if (hint && discovered) hint.textContent = discoveredHint;
  marker.setAttribute("aria-label", (marker.querySelector("strong")?.textContent || areaName) + (discovered ? ", discovered" : ", new discovery"));
}

function declareHomeWorkSpot() {
  if (!areHomeResourcesDiscovered() || isHomeWorkSpotDeclared()) return;
  if (typeof unlockCampUpgrade !== "function") return;

  unlockCampUpgrade("smallFire");
  unlockCampUpgrade("crudeLeanTo");
  if (typeof addStoryEntry === "function") addStoryEntry("You clear a central patch of ground and declare it your work spot. Here, you can begin shaping the clearing into a camp.");
  if (typeof updatePlacePanel === "function") updatePlacePanel();
  updateHomeAreaAvailability();
  selectHomeArea(null);
  if (typeof trySaveGame === "function") trySaveGame();
}

function updateHomeCampStructureVisuals() {
  const campfire = document.querySelector('[data-home-area="campfire"]');
  const shelter = document.querySelector('[data-home-area="shelter"]');
  const meditation = document.querySelector('[data-home-area="meditation"]');
  const study = document.querySelector('[data-home-area="study"]');

  if (study) {
    const benchBuilt = typeof hasPurchasedCampUpgrade === "function" && hasPurchasedCampUpgrade("researchBench");
    setHomeStructureStage(study, benchBuilt ? "research-bench" : "research-spot", benchBuilt ? "Research Bench" : "Research Spot");
  }

  if (campfire) {
    const smallFireBuilt = typeof hasPurchasedCampUpgrade === "function" && hasPurchasedCampUpgrade("smallFire");
    const stoneFireBuilt = typeof hasPurchasedCampUpgrade === "function" && hasPurchasedCampUpgrade("stoneFirePit");
    campfire.classList.toggle("is-construction-site", !smallFireBuilt);
    setHomeStructureStage(campfire, !smallFireBuilt ? "fire-site" : stoneFireBuilt ? "stone-fire-pit" : "small-fire", !smallFireBuilt ? "Small Fire" : stoneFireBuilt ? "Stone Fire Pit" : "Small Fire");
  }

  if (shelter) {
    const crudeShelterBuilt = typeof hasPurchasedCampUpgrade === "function" && hasPurchasedCampUpgrade("crudeLeanTo");
    let stage = crudeShelterBuilt ? "crude-lean-to" : "shelter-site";
    let label = "Crude Lean-To";

    if (typeof hasPurchasedCampUpgrade === "function") {
      if (hasPurchasedCampUpgrade("smallHut")) {
        stage = "small-hut";
        label = "Small Hut";
      } else if (hasPurchasedCampUpgrade("framedShelter")) {
        stage = "framed-shelter";
        label = "Framed Shelter";
      } else if (hasPurchasedCampUpgrade("lessCrudeShelter")) {
        stage = "less-crude-shelter";
        label = "Less Crude Shelter";
      }
    }

    setHomeStructureStage(shelter, stage, label);
    shelter.classList.toggle("is-construction-site", !crudeShelterBuilt);
    const shelterHint = shelter.querySelector(".home-place-label small");
    if (shelterHint) shelterHint.textContent = !crudeShelterBuilt ? "Build here" : stage === "small-hut" ? "Rest in the hut" : "Rest beneath the shelter";
    shelter.setAttribute("aria-label", crudeShelterBuilt ? "Rest at " + label : "Build " + label);
  }

  if (meditation) {
    const greater = typeof hasPurchasedCampUpgrade === "function" && hasPurchasedCampUpgrade("greaterMeditationSpot");
    const improved = typeof hasPurchasedCampUpgrade === "function" && hasPurchasedCampUpgrade("attunedMeditationSpot");
    const stage = greater ? "greater-meditation-spot" : improved ? "improved-meditation-spot" : "meditation-spot";
    const label = greater ? "Greater Meditation Spot" : improved ? "Improved Meditation Spot" : "Meditation Spot";
    setHomeStructureStage(meditation, stage, label);
    const meditationHint = meditation.querySelector(".home-place-label small");
    if (meditationHint) meditationHint.textContent = greater ? "Restore 50% more mana" : improved ? "Restore 25% more mana" : "Meditate and restore mana";
    meditation.setAttribute("aria-label", "Meditate at " + label);
  }

  updateHomeOpeningResourceHotspots();
  updateHomeConstructionHotspots();
}

function setHomeStructureStage(button, stage, label) {
  button.dataset.homeStage = stage;
  const name = button.querySelector(".home-place-label strong");
  if (name) name.textContent = label;
}

function isHomeTowerDiscovered() {
  if (isTowerHomeRelocated()) return true;
  return !!(gameState.magic && gameState.magic.sensedReveals && gameState.magic.sensedReveals.campFoundation);
}

function isHomeTrailAvailable() {
  return typeof isMainViewAvailable === "function" && isMainViewAvailable("expedition");
}

function updateHomeTrailVisibility() {
  const trailButton = document.querySelector('[data-home-area="trail"]');
  const trailAvailable = isHomeTrailAvailable();

  if (!trailButton) return;

  trailButton.hidden = !trailAvailable;
  if (typeof updateSystemNewIndicator === "function") updateSystemNewIndicator(trailButton, "expedition");
}

function updateHomeTowerVisibility() {
  const towerButton = document.querySelector('[data-home-area="tower"]');
  const scene = document.getElementById("homeScene");
  const towerDiscovered = isHomeTowerDiscovered();
  const firstFloor = typeof getProjectState === "function" ? getProjectState("towerFloor1") : null;
  const secondFloor = typeof getProjectState === "function" ? getProjectState("towerFloor2") : null;
  const thirdFloor = typeof getProjectState === "function" ? getProjectState("towerFloor3") : null;
  const towerBuilt = !!((firstFloor && firstFloor.completed) || (secondFloor && secondFloor.completed) || (thirdFloor && thirdFloor.completed));

  if (towerButton) {
    towerButton.hidden = !towerDiscovered;
    towerButton.disabled = !towerDiscovered;
    if (typeof updateSystemNewIndicator === "function") updateSystemNewIndicator(towerButton, "tower");
    const towerHint = typeof towerButton.querySelector === "function" ? towerButton.querySelector(".home-place-label small") : null;
    if (towerHint && isTowerHomeRelocated()) towerHint.textContent = "Enter your home";
    if (typeof towerButton.setAttribute === "function") towerButton.setAttribute("aria-label", isTowerHomeRelocated() ? "Enter Tower Home" : "Enter the Tower");
  }
  if (scene) scene.classList.toggle("has-built-tower", towerBuilt);
}

function hasVisibleHomeWork() {
  const improvements = document.getElementById("campContent");
  const crafting = document.getElementById("craftingSection");
  return !!((improvements && !improvements.hidden) || isHomeNodeAvailable(crafting));
}

function isHomeNodeAvailable(nodeOrId) {
  const node = typeof nodeOrId === "string" ? document.getElementById(nodeOrId) : nodeOrId;
  if (!node || node.hidden) return false;
  return node.style.display !== "none";
}

function setHomeAreaVisible(areaName, visible) {
  if (isTowerHomeRelocated() && !["wood", "food", "water", "tower", "trail"].includes(areaName)) visible = false;
  const button = document.querySelector('[data-home-area="' + areaName + '"]');
  if (button) button.hidden = !visible;
}

function renderHomeTowerPlaceholder() {
  const mount = document.getElementById("homeTowerVisual");
  const status = document.getElementById("homeTowerStatus");
  if (!mount) return;

  const caption = typeof getTowerVisualCaption === "function"
    ? getTowerVisualCaption()
    : { title: "The Tower Site", status: "Beyond the camp" };
  const projectIds = [
    "towerFoundation", "towerBasement", "towerFloor1", "towerFloor2", "towerFloor3",
    "towerRoomBedroom", "towerRoomForge", "towerRoomWorkshop",
    "towerRoomAlchemyRoom", "towerRoomLibrary", "towerRoomEnchantingStudy", "towerRoomLongRangeGate",
  ];
  const progress = typeof getProjectState === "function"
    ? projectIds.map(function (id) {
        const state = getProjectState(id);
        return state ? [id, state.unlocked, state.completed, state.level, state.visualProgress] : null;
      })
    : [];
  const signature = JSON.stringify([caption.title, caption.status, progress]);

  if (status) status.textContent = isTowerHomeRelocated() ? "Enter Tower" : caption.status || "Tower work remains separate";
  if (signature === homeTowerSignature) return;
  homeTowerSignature = signature;

  mount.replaceChildren();
  if (typeof window.createUnifiedTowerVisual !== "function") return;

  const visual = window.createUnifiedTowerVisual();
  visual.setAttribute("inert", "");
  visual.setAttribute("aria-hidden", "true");
  mount.appendChild(visual);
}
