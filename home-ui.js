const HOME_AREA_DEFINITIONS = {
  tower: {
    title: "The Tower",
    description: "The buried structure remains a landmark for now. Tower work is still available through the existing Tower tab.",
    nodeIds: [],
  },
  campfire: {
    title: "Campfire & Clearing",
    description: "Recover, gather nearby supplies, tend fuel, and use the contextual actions already available at camp.",
    nodeIds: ["campActionsSection", "campContextualActions", "campLocationObjectActionsSlot"],
  },
  workspot: {
    title: "Workspot",
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
    description: "Continue the skills and training currently available in Camp.",
    nodeIds: ["trainingSection"],
  },
  automation: {
    title: "Runed Devices",
    description: "Manage the same camp automation controls from their place in the clearing.",
    nodeIds: ["craftingSection"],
    workPanel: "automation",
  },
  storage: {
    title: "Storage Cache",
    description: "Review the supplies currently stored at camp.",
    nodeIds: ["campResourcesSection"],
  },
};

let selectedHomeArea = null;
let homeUiHooked = false;
let homeTowerSignature = "";
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
      if (definition && definition.directAction) {
        activateHomeDirectAction(definition.directAction);
        return;
      }
      selectHomeArea(button.dataset.homeArea);
    });
  });

  closeButton.addEventListener("click", function () {
    selectHomeArea(null);
  });

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
    if (!selectedButton || selectedButton.hidden) selectHomeArea(null);
    else if (!isHomeAreaMounted(selectedHomeArea)) mountHomeArea(selectedHomeArea);
  }
}

function selectHomeArea(areaName) {
  if (areaName !== null && !HOME_AREA_DEFINITIONS[areaName]) return;

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

  const title = document.getElementById("homeAreaTitle");
  const description = document.getElementById("homeAreaDescription");
  const layout = panel.closest(".home-clearing-layout");
  const panelMode = definition.panelMode === "expanded" ? "expanded" : "standard";
  if (title) title.textContent = definition.title;
  if (description) description.textContent = definition.description;
  panel.dataset.homeArea = areaName;
  panel.dataset.panelMode = panelMode;
  if (layout) layout.dataset.panelMode = panelMode;

  definition.nodeIds.forEach(function (nodeId) {
    const node = document.getElementById(nodeId);
    if (!node) return;

    rememberHomeNodePosition(node);
    content.appendChild(node);

    if (node.tagName === "DETAILS") node.open = true;
  });

  if (definition.workPanel && typeof showWorkPanel === "function") {
    showWorkPanel(definition.workPanel, { userSelected: true });
  }

  panel.hidden = false;
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
  if (definition.nodeIds.length === 0) return !document.getElementById("homeAreaPanel").hidden;

  return definition.nodeIds.every(function (nodeId) {
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
  if (closeButton) closeButton.hidden = !selectedHomeArea;
  if (!selectedHomeArea) {
    if (panel) panel.dataset.panelMode = "standard";
    if (layout) layout.dataset.panelMode = "standard";
  }
}

function updateHomeAreaAvailability() {
  const workbenchBuilt = typeof hasPurchasedCampUpgrade === "function" && hasPurchasedCampUpgrade("workbench");
  setHomeAreaVisible("workspot", hasVisibleHomeWork() && !workbenchBuilt);
  setHomeAreaVisible("workbench", hasVisibleHomeWork() && workbenchBuilt);
  setHomeAreaVisible("shelter", typeof hasPurchasedCampUpgrade === "function" && hasPurchasedCampUpgrade("crudeLeanTo"));
  setHomeAreaVisible("study", typeof isResearchSpotPurchased === "function" && isResearchSpotPurchased());
  setHomeAreaVisible("processing", typeof hasPurchasedCampUpgrade === "function" && hasPurchasedCampUpgrade("campAlchemyStation"));
  setHomeAreaVisible("meditation", typeof hasPurchasedCampUpgrade === "function" && (hasPurchasedCampUpgrade("meditationSpot") || hasPurchasedCampUpgrade("attunedMeditationSpot")));
  setHomeAreaVisible("training", isHomeNodeAvailable("trainingSection"));
  setHomeAreaVisible("automation", typeof hasUnlockedAutomation === "function" && hasUnlockedAutomation());
  setHomeAreaVisible("storage", isHomeNodeAvailable("campResourcesSection"));
  updateHomeCampStructureVisuals();
  updateHomeTowerVisibility();
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

function updateHomeTowerVisibility() {
  const towerButton = document.querySelector('[data-home-area="tower"]');
  const scene = document.getElementById("homeScene");
  const firstFloor = typeof getProjectState === "function" ? getProjectState("towerFloor1") : null;
  const secondFloor = typeof getProjectState === "function" ? getProjectState("towerFloor2") : null;
  const towerBuilt = !!((firstFloor && firstFloor.completed) || (secondFloor && secondFloor.completed));

  if (towerButton) towerButton.hidden = !towerBuilt;
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
