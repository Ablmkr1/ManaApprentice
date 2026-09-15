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
    nodeIds: ["craftingSection"],
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

let selectedHomeArea = null;
let homeUiHooked = false;
let homeTowerSignature = "";
let homeSceneSignature = "";
const homeNodeAnchors = new Map();

function hookHomeUI() {
  if (homeUiHooked) return;

  const scene = document.getElementById("homeScene");
  const closeButton = document.getElementById("homeAreaCloseBtn");
  if (!scene || !closeButton) return;

  homeUiHooked = true;
  scene.querySelectorAll("[data-home-area]").forEach(function (button) {
    button.addEventListener("click", function () {
      const definition = HOME_AREA_DEFINITIONS[button.dataset.homeArea];
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
  if (areaName !== null && !HOME_AREA_DEFINITIONS[areaName]) return;

  if (options.userSelected) markHomeAreaAttentionSeen(areaName);

  selectedHomeArea = areaName;
  restoreHomeCampNodes();
  updateHomeAreaSelection();

  if (areaName) mountHomeArea(areaName);
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
  const sceneState = getHomeSceneState();
  const exploreStep = getHomeExploreStep();
  const resourcesDiscovered = areHomeResourcesDiscovered();
  const workSpotDeclared = isHomeWorkSpotDeclared();
  const established = sceneState === "established-camp";
  const workbenchBuilt = typeof hasPurchasedCampUpgrade === "function" && hasPurchasedCampUpgrade("workbench");
  const smallFireBuilt = typeof hasPurchasedCampUpgrade === "function" && hasPurchasedCampUpgrade("smallFire");
  const shelterBuilt = typeof hasPurchasedCampUpgrade === "function" && hasPurchasedCampUpgrade("crudeLeanTo");
  const showResources = sceneState !== "fogged" && !established;
  const signature = [sceneState, exploreStep, gameState.discoveredDeadfall, gameState.discoveredBerryBush, gameState.discoveredStream, workSpotDeclared, smallFireBuilt, shelterBuilt].join("|");
  const sceneChanged = signature !== homeSceneSignature;
  homeSceneSignature = signature;

  updateHomeScenePresentation(sceneState, exploreStep);
  setHomeAreaVisible("wood", showResources);
  setHomeAreaVisible("food", showResources);
  setHomeAreaVisible("water", showResources);
  updateHomeResourceMarker("wood", gameState.discoveredDeadfall, "Gather firewood");
  updateHomeResourceMarker("food", gameState.discoveredBerryBush, "Gather berries");
  updateHomeResourceMarker("water", gameState.discoveredStream, "Fresh water found");

  const showPrimitiveWorkSpot = resourcesDiscovered && !established;
  setHomeAreaVisible("workspot", showPrimitiveWorkSpot || (established && hasVisibleHomeWork() && !workbenchBuilt));
  setHomeAreaVisible("workbench", established && hasVisibleHomeWork() && workbenchBuilt);
  setHomeAreaVisible("campfire", smallFireBuilt);
  setHomeAreaVisible("shelter", shelterBuilt);
  setHomeAreaVisible("study", established && typeof isResearchSpotPurchased === "function" && isResearchSpotPurchased());
  setHomeAreaVisible("processing", established && typeof hasPurchasedCampUpgrade === "function" && hasPurchasedCampUpgrade("campAlchemyStation"));
  setHomeAreaVisible("meditation", established && typeof hasPurchasedCampUpgrade === "function" && (hasPurchasedCampUpgrade("meditationSpot") || hasPurchasedCampUpgrade("attunedMeditationSpot")));
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

  if (!established && !selectedHomeArea) {
    selectHomeArea("opening");
  } else if (established && selectedHomeArea === "opening") {
    selectHomeArea(null);
  }

  if (sceneChanged && selectedHomeArea === "opening") {
    mountHomeArea("opening");
  } else if (selectedHomeArea && selectedHomeArea !== "opening") {
    const selectedButton = document.querySelector('[data-home-area="' + selectedHomeArea + '"]');
    if (!selectedButton || selectedButton.hidden) selectHomeArea(null);
    else if (sceneChanged && (HOME_AREA_DEFINITIONS[selectedHomeArea].objectName || selectedHomeArea === "workspot")) mountHomeArea(selectedHomeArea);
  }
}

function getHomeAttentionState() {
  if (!gameState.homeAttention || typeof gameState.homeAttention !== "object") gameState.homeAttention = {};
  if (!gameState.homeAttention.seen || typeof gameState.homeAttention.seen !== "object") gameState.homeAttention.seen = {};

  ["crafting", "research", "training"].forEach(function (category) {
    if (!Array.isArray(gameState.homeAttention.seen[category])) gameState.homeAttention.seen[category] = [];
  });

  return gameState.homeAttention;
}

function getAvailableHomeCraftKeys(craftType, definitions) {
  if (!definitions || typeof isCraftAvailable !== "function") return [];

  return Object.keys(definitions).filter(function (craftId) {
    return isCraftAvailable(craftType, craftId);
  }).map(function (craftId) {
    return craftType + ":" + craftId;
  });
}

function getHomeAttentionKeys(category) {
  if (category === "crafting") {
    return []
      .concat(getAvailableHomeCraftKeys("campUpgrade", typeof getCampUpgradeDefinitions === "function" ? getCampUpgradeDefinitions() : null))
      .concat(getAvailableHomeCraftKeys("gearUpgrade", typeof getGearUpgradeDefinitions === "function" ? getGearUpgradeDefinitions() : null))
      .concat(getAvailableHomeCraftKeys("resourceCraft", typeof getResourceCraftDefinitions === "function" ? getResourceCraftDefinitions() : null));
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

function getHomeAttentionCategory(areaName) {
  if (areaName === "workspot" || areaName === "workbench") return "crafting";
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
  const craftingKeys = getHomeAttentionKeys("crafting");
  setHomeAttentionIndicator("workspot", "crafting", craftingKeys);
  setHomeAttentionIndicator("workbench", "crafting", craftingKeys);
  setHomeAttentionIndicator("study", "research", getHomeAttentionKeys("research"));
  setHomeAttentionIndicator("training", "training", getHomeAttentionKeys("training"));
}

function markHomeAreaAttentionSeen(areaName) {
  const category = getHomeAttentionCategory(areaName);
  if (!category) return;

  const state = getHomeAttentionState();
  const previous = new Set(state.seen[category]);
  const keys = getHomeAttentionKeys(category);
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
}

function updateHomeResourceMarker(areaName, discovered, discoveredHint) {
  const marker = document.querySelector('[data-home-area="' + areaName + '"]');
  if (!marker) return;
  const hint = marker.querySelector(".home-place-label small");
  marker.classList.toggle("has-new-system", !discovered);
  marker.classList.toggle("is-discovered", discovered);
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
  mountHomeArea("workspot");
  if (typeof trySaveGame === "function") trySaveGame();
}

function updateHomeCampStructureVisuals() {
  const campfire = document.querySelector('[data-home-area="campfire"]');
  const shelter = document.querySelector('[data-home-area="shelter"]');
  const meditation = document.querySelector('[data-home-area="meditation"]');

  if (campfire) {
    const stoneFireBuilt = typeof hasPurchasedCampUpgrade === "function" && hasPurchasedCampUpgrade("stoneFirePit");
    setHomeStructureStage(campfire, stoneFireBuilt ? "stone-fire-pit" : "small-fire", stoneFireBuilt ? "Stone Fire Pit" : "Small Fire");
  }

  if (shelter) {
    let stage = "crude-lean-to";
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
    const shelterHint = shelter.querySelector(".home-place-label small");
    if (shelterHint) shelterHint.textContent = stage === "small-hut" ? "Rest in the hut" : "Rest beneath the shelter";
    shelter.setAttribute("aria-label", "Rest at " + label);
  }

  if (meditation) {
    const attuned = typeof hasPurchasedCampUpgrade === "function" && hasPurchasedCampUpgrade("attunedMeditationSpot");
    const stage = attuned ? "attuned-meditation-spot" : "meditation-spot";
    const label = attuned ? "Attuned Meditation Spot" : "Meditation Spot";
    setHomeStructureStage(meditation, stage, label);
    meditation.setAttribute("aria-label", "Meditate at " + label);
  }
}

function setHomeStructureStage(button, stage, label) {
  button.dataset.homeStage = stage;
  const name = button.querySelector(".home-place-label strong");
  if (name) name.textContent = label;
}

function isHomeTowerDiscovered() {
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
  const towerBuilt = !!((firstFloor && firstFloor.completed) || (secondFloor && secondFloor.completed));

  if (towerButton) {
    towerButton.hidden = !towerDiscovered;
    towerButton.disabled = !towerDiscovered;
    if (typeof updateSystemNewIndicator === "function") updateSystemNewIndicator(towerButton, "tower");
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
    "towerFoundation", "towerBasement", "towerFloor1", "towerFloor2",
    "towerRoomBedroom", "towerRoomForge", "towerRoomWorkshop",
    "towerRoomAlchemyRoom", "towerRoomLibrary", "towerRoomEnchantingStudy",
  ];
  const progress = typeof getProjectState === "function"
    ? projectIds.map(function (id) {
        const state = getProjectState(id);
        return state ? [id, state.unlocked, state.completed, state.level, state.visualProgress] : null;
      })
    : [];
  const signature = JSON.stringify([caption.title, caption.status, progress]);

  if (status) status.textContent = caption.status || "Tower work remains separate";
  if (signature === homeTowerSignature) return;
  homeTowerSignature = signature;

  mount.replaceChildren();
  if (typeof window.createUnifiedTowerVisual !== "function") return;

  const visual = window.createUnifiedTowerVisual();
  visual.setAttribute("inert", "");
  visual.setAttribute("aria-hidden", "true");
  mount.appendChild(visual);
}
