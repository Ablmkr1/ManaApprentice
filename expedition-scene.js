/* Presentation only. Selection lives here, never in saves or activity state.
   Existing DOM controls retain their owners, availability checks and handlers. */
const ExpeditionScene = (() => {
  const scenes = {
    roadsideRuin: {
      artwork: "assets/expedition/roadside-ruin.png",
      description: "A sunken, moss-covered ruin sits beside the broken western road.",
      landmarks: [
        { id: "survey", title: "Weathered ruin", description: "Explore the fallen walls and discover the stair below.", x: 28, y: 34, actions: ["exploreLocation"], investigation: true },
        { id: "entrance", title: "Dark stair", description: "Inspect the existing entrance to Roadside Ruin.", x: 75, y: 44, actions: ["enterDungeon"] },
      ],
    },
    silentGearworks: {
      artwork: "assets/expedition/silent-gearworks.png",
      description: "Weathered metalwork rests against a stone structure sunk into the hillside.",
      landmarks: [
        { id: "survey", title: "Silent metalwork", description: "Explore the old structure and its motionless mechanisms.", x: 33, y: 34, actions: ["exploreLocation"], investigation: true },
        { id: "entrance", title: "Cracked entrance", description: "Inspect the existing entrance to Silent Gearworks.", x: 75, y: 43, actions: ["enterDungeon"] },
      ],
    },
    arcaneArchive: {
      artwork: "assets/expedition/arcane-archive.png",
      nodeRegion: "west",
      nodeOverlay: { left: "67%", top: "34%" },
      description: "A pale, windowless archive stands at the end of the western road.",
      landmarks: [
        { id: "survey", title: "Pale archive walls", description: "Explore the archive and study the sealed entrance.", x: 36, y: 25, actions: ["exploreLocation"], investigation: true },
        { id: "door", title: "Archive door", description: "Inspect the four-part door ritual and enter the ruin when unlocked.", x: 49, y: 36, actions: ["enterDungeon"], object: "sealedArchiveDoor", sections: ["expeditionLocationObjectActionsSlot", "locationSpellActions", "craftingSpellActions"] },
        { id: "node", title: "Western Tower Node", description: "Inspect the western anchor and its available local functions.", x: 75, y: 47, actions: [], sections: ["towerNodePanel", "locationContextualActions", "locationSpellActions", "craftingSpellActions"], visible: () => gameState.archiveDoorOpened && getExpeditionLocation("arcaneArchive").explored && !!nodeStatus() },
      ],
    },
    wildHerbPatch: {
      artwork: "assets/expedition/herb-patch.png",
      description: "Useful herbs brighten the grass and tangled southern growth.",
      landmarks: [
        { id: "survey", title: "Wild growth", description: "Explore the unfamiliar plants and discover their use.", x: 70, y: 35, actions: ["exploreLocation"], investigation: true },
        { id: "herbs", title: "Herb clusters", description: "Gather useful herbs when their properties are understood.", x: 28, y: 44, actions: ["gatherHerbs"], sections: ["locationSpellActions", "craftingSpellActions"] },
      ],
    },
    alchemistsHut: {
      artwork: "assets/expedition/alchemists-hut.png",
      nodeRegion: "south",
      nodeOverlay: { left: "71%", top: "35%" },
      description: "Vines cover the crooked hut and its weathered alchemy workshop.",
      landmarks: [
        { id: "survey", title: "Abandoned hut", description: "Explore the old workshop and its remains.", x: 32, y: 24, actions: ["exploreLocation"], investigation: true },
        { id: "study", title: "Study Infusion Pattern", description: "Study the patterns in the stained bowls and workshop notes.", x: 28, y: 43, actions: [], object: "studyInfusionPattern", sections: ["expeditionLocationObjectActionsSlot", "locationSpellActions", "craftingSpellActions"] },
        { id: "stores", title: "Stores", description: "Inspect local supplies, transfer resources and concentrate tonic bases when available.", x: 57, y: 33, actions: ["storeWood", "storeHerb", "storeGlimmerleaf", "concentrateTonicBase", "concentrateManaTonicBase"], sections: ["locationStorageSection", "locationSpellActions", "craftingSpellActions"], crafts: true },
        { id: "node", title: "Southern Tower Node", description: "Inspect the southern anchor and its available local functions.", x: 77, y: 45, actions: [], sections: ["towerNodePanel", "locationContextualActions", "locationSpellActions", "craftingSpellActions"], gated: "node" },
      ],
    },
    overgrownFields: {
      artwork: "assets/expedition/overgrown-fields.png",
      description: "Waist-high growth follows the fading rows of abandoned fields.",
      landmarks: [
        { id: "leaves", title: "Cultivation rows", description: "Explore the old rows and gather Glimmerleaf when available.", x: 28, y: 43, actions: ["exploreLocation", "gatherGlimmerleaf"], investigation: true, sections: ["locationSpellActions", "craftingSpellActions"] },
        { id: "disturbance", title: "Tangled briars", description: "Investigate the southern disturbance and challenge Blighted Briar when available.", x: 72, y: 44, actions: ["investigateSouthernDisturbance", "challengeBlightedBriar"], visible: () => getRegionalProgressState("south").disturbanceTriggered, complete: () => getRegionalProgressState("south").disturbanceResolved },
      ],
    },
    stagRuns: {
      artwork: "assets/expedition/stag-runs.png",
      description: "Heavy tracks cross the broken undergrowth of the deepwood.",
      landmarks: [
        { id: "tracks", title: "Track Game", description: "Inspect the tracks and follow the game trails.", x: 28, y: 42, actions: ["exploreLocation", "trackGame"], investigation: true, sections: ["locationSpellActions", "craftingSpellActions"] },
        { id: "hunt", title: "Hunt Game", description: "Hunt along the marked trails when your equipment and tracking allow it.", x: 72, y: 38, actions: ["huntGame"], sections: ["locationSpellActions", "craftingSpellActions"] },
      ],
    },
    huntersCabin: {
      artwork: "assets/expedition/hunters-cabin.png",
      nodeRegion: "east",
      nodeOverlay: { left: "66%", top: "31%" },
      description: "A low weathered cabin shelters ruined hide-working tools beneath old trees.",
      landmarks: [
        { id: "survey", title: "Weathered cabin", description: "Explore the cabin and discover what its old tools can teach you.", x: 32, y: 31, actions: ["exploreLocation"], investigation: true },
        { id: "hides", title: "Hide-working & stores", description: "Inspect the local pelt and leather stores and available leather work.", x: 26, y: 46, actions: ["storePelt", "takeLeather"], sections: ["locationStorageSection", "locationSpellActions", "craftingSpellActions"], crafts: true },
        { id: "node", title: "Eastern Tower Node", description: "Inspect the eastern anchor and its available local functions.", x: 72, y: 41, actions: [], sections: ["towerNodePanel", "locationContextualActions", "locationSpellActions", "craftingSpellActions"], gated: "node" },
      ],
    },
    quietGrove: {
      artwork: "assets/expedition/quiet-grove.png",
      description: "Soft woodland light falls across a still, open grove.",
      landmarks: [
        { id: "survey", title: "Quiet clearing", description: "Explore the still grove and the traces among its old trees.", x: 50, y: 30, actions: ["exploreLocation"], investigation: true },
        { id: "observation", title: "Observe Glass-Antler Stag", description: "Wait and watch the grove. Follow the patterns around the stag with Mana Sense.", x: 28, y: 45, actions: [], object: "observeGlassAntlerStag", sections: ["expeditionLocationObjectActionsSlot", "locationSpellActions", "craftingSpellActions"], visible: () => getExpeditionLocation("quietGrove").explored },
        { id: "disturbance", title: "Disturbed roots", description: "Investigate the eastern disturbance and challenge Thornfang when available.", x: 73, y: 47, actions: ["investigateEasternDisturbance", "challengeThornfang"], visible: () => getRegionalProgressState("east").disturbanceTriggered, complete: () => getRegionalProgressState("east").disturbanceResolved },
      ],
    },
    mysteriousPlants: {
      artwork: "assets/expedition/outskirts-forest.png",
      description: "Pale stems grow beside the woodland path.",
      landmarks: [
        { id: "plants", title: "Pale plants", description: "Inspect the unfamiliar stems and gather fiber once their use is understood.", x: 24, y: 50, actions: ["exploreLocation", "gatherFiber"], sections: ["locationSpellActions", "craftingSpellActions"] },
      ],
    },
    strangeTrails: {
      artwork: "assets/expedition/outskirts-forest.png",
      description: "Narrow tracks wind through grass, brush and fallen wood.",
      landmarks: [
        { id: "trails", title: "Grass & brush", description: "Investigate the tracks, scout trap sites, and place or check traps along the trails.", x: 71, y: 46, actions: ["exploreLocation", "scoutTrapSite", "setTrap", "checkTrap"], sections: ["trapSitesList", "locationSpellActions", "craftingSpellActions"] },
      ],
    },
    creepyCave: {
      artwork: "assets/expedition/creepy-cave.png",
      description: "Loose stone lies around a dark opening in the wooded hillside.",
      landmarks: [
        { id: "stones", title: "Loose stone", description: "Gather the loose stone around the cave mouth.", x: 27, y: 53, actions: ["gatherStone"], sections: ["locationSpellActions", "craftingSpellActions"] },
        { id: "caveInterior", title: "Cave entrance", description: "Inspect the entrance and explore the interior with the required equipment.", x: 63, y: 41, actions: [], object: "caveInterior", sections: ["expeditionLocationObjectActionsSlot", "locationSpellActions", "craftingSpellActions"] },
      ],
    },
    mysteriousTrail: {
      artwork: "assets/expedition/abandoned-camp.png",
      description: "A ruined camp sits quiet beneath the trees.",
      landmarks: [
        { id: "washedOutFirePit", title: "Washed Out Fire Pit", description: "Inspect the cold mud and scattered ash.", x: 28, y: 44, actions: [], object: "washedOutFirePit", sections: ["expeditionLocationObjectActionsSlot"] },
        { id: "shreddedPack", title: "Shredded Pack", description: "Investigate the remains of the old pack.", x: 72, y: 48, actions: [], object: "shreddedPack", sections: ["expeditionLocationObjectActionsSlot"] },
        { id: "ruinedShelter", title: "Ruined Shelter", description: "Search the collapsed shelter.", x: 66, y: 29, actions: [], object: "ruinedShelter", sections: ["expeditionLocationObjectActionsSlot"] },
      ],
    },
    foothillScree: {
      artwork: "assets/expedition/foothill-scree.webp",
      description: "Wind crosses the loose rock below the northern ridge.",
      landmarks: [
        { id: "scree", title: "Loose scree", description: "Pry useful stone from the slope. Traces of ore lie among the loose rock.", x: 29, y: 55, actions: ["gatherStone"], sections: ["locationSpellActions", "craftingSpellActions"] },
        { id: "survey", title: "Rocky slope", description: "Find a safe footing and investigate the scattered stone.", x: 68, y: 36, actions: ["exploreLocation"], investigation: true },
      ],
    },
    minersCamp: {
      artwork: "assets/expedition/miners-camp.webp",
      description: "A cold stream passes an abandoned worksite beneath the ridge.",
      landmarks: [
        { id: "smelter", title: "Smelter & stores", description: "The old furnace, fuel pile and ore crates share a sheltered work area.", x: 28, y: 46, actions: ["storeWood", "storeOre", "takeIron"], sections: ["locationStorageSection", "expeditionLocationObjectActionsSlot", "locationSpellActions", "craftingSpellActions"], crafts: true },
        { id: "survey", title: "Abandoned worksite", description: "Investigate the stream and the remains of the miners’ shelter.", x: 75, y: 54, actions: ["exploreLocation"], investigation: true },
        { id: "node", title: "Northern Node", description: "Inspect the northern anchor and its available local functions.", x: 72, y: 30, actions: [], sections: ["towerNodePanel", "locationContextualActions", "locationSpellActions", "craftingSpellActions"], gated: "node" },
      ],
    },
    ironMine: {
      artwork: "assets/expedition/iron-mine.webp",
      description: "Rust-colored veins trace a dark opening in the northern ridge.",
      landmarks: [
        { id: "mine", title: "Mine entrance", description: "Inspect the old workings, then mine exposed stone and iron ore with the appropriate pick.", x: 27, y: 39, actions: ["exploreLocation", "mineStone", "mineIron"], sections: ["locationSpellActions", "craftingSpellActions"] },
        { id: "disturbance", title: "Disturbed rock", description: "Follow the tremors through the exposed rock.", x: 72, y: 50, actions: ["investigateNorthernDisturbance", "challengeEarthElemental"], gated: "disturbance" },
      ],
    },
  };
  const mapPositions = { stagRuns: [28, 51], huntersCabin: [78, 40], quietGrove: [52, 25], foothillScree: [30, 57], minersCamp: [57, 44], ironMine: [81, 26], mysteriousPlants: [25, 49], strangeTrails: [70, 51], creepyCave: [29, 24], mysteriousTrail: [77, 24] };
  // Explicit interaction policy: temporary availability never turns a work area
  // into a different kind of control. Additional actions use the wrapping tray.
  const directGroups = {
    roadsideRuin: ["survey", "entrance"], silentGearworks: ["survey", "entrance"],
    arcaneArchive: ["survey"], wildHerbPatch: ["survey", "herbs"],
    alchemistsHut: ["survey"], overgrownFields: ["leaves", "disturbance"],
    stagRuns: ["tracks", "hunt"], huntersCabin: ["survey"],
    quietGrove: ["survey", "disturbance"], mysteriousPlants: ["plants"],
    creepyCave: ["stones"], foothillScree: ["scree", "survey"],
    minersCamp: ["survey"], ironMine: ["mine", "disturbance"],
  };
  for (const [place, scene] of Object.entries(scenes)) {
    for (const landmark of scene.landmarks) {
      landmark.interaction = directGroups[place]?.includes(landmark.id) ? "action" : "details";
    }
  }
  Object.assign(mapPositions, { wildHerbPatch: [28, 51], alchemistsHut: [74, 40], overgrownFields: [51, 25] });
  Object.assign(mapPositions, { roadsideRuin: [28, 47], silentGearworks: [75, 37], arcaneArchive: [53, 19] });
  const routeLandmark = { id: "route", title: "Trail & travel", y: 62, route: true };
  let refs, surfaceKey = "", selected = null, browsing = false, physicalKey = "", queued = false;
  const byId = id => document.getElementById(id);
  const text = (node, value) => { if (node && node.textContent !== value) node.textContent = value; };
  function mode() {
    const e = gameState.expedition;
    if (isCombatActive() || gameState.combat?.resolved) return "combat";
    if (e.dungeon && e.dungeon.active) return "dungeon";
    if (isTravelActivityActive()) return "traveling";
    if (e.currentLocation) return "location";
    if (e.active) return e.distance > 0 ? "paused" : "preparing";
    return "planning";
  }
  function init() {
    const root = byId("expeditionPanel");
    if (!root) return false;
    root.classList.add("expedition-frame");
    const frame = document.createElement("div");
    frame.className = "expedition-presentation";
    frame.innerHTML = '<div class="expedition-view-heading"><p id="expeditionSceneCaption"></p><button type="button" id="expeditionBrowse">Inspect routes</button></div><div id="expeditionSurface" class="expedition-surface" hidden><div id="expeditionSceneWindow" class="expedition-scene-window"><div id="expeditionArt" class="expedition-art" aria-hidden="true"></div><div class="expedition-map-key" aria-hidden="true">N ↑<br><small>Northern reach</small></div><div id="expeditionLandmarks" class="expedition-landmarks" role="group" aria-label="Physical landmarks"></div></div><aside id="expeditionDetail" class="expedition-detail" aria-labelledby="expeditionDetailTitle" hidden><header><div><span id="expeditionDetailKicker"></span><h3 id="expeditionDetailTitle" tabindex="-1"></h3></div><button type="button" id="expeditionDetailClose" aria-label="Close location details">Close</button></header><p id="expeditionDetailDescription"></p><p id="expeditionDetailInfo"></p><div id="expeditionDetailBody"></div></aside></div><div id="expeditionRetained" class="expedition-retained"></div>';
    root.append(frame);
    refs = { root, frame, surface: byId("expeditionSurface"), art: byId("expeditionArt"), markers: byId("expeditionLandmarks"), panel: byId("expeditionDetail"), body: byId("expeditionDetailBody"), retained: byId("expeditionRetained"), browse: byId("expeditionBrowse") };
    ui.locationContent.prepend(ui.locationStorageSection);
    refs.viewport = byId("expeditionSceneWindow");
    refs.local = document.createElement("section");
    refs.local.className = "expedition-local-tools";
    refs.local.innerHTML = '<h3>Location actions</h3><div id="expeditionDirectActions" class="expedition-direct-actions"></div><p id="expeditionDirectInfo"></p><div id="expeditionLocalUtilities"></div>';
    refs.surface.after(refs.local);
    refs.direct = byId("expeditionDirectActions");
    refs.utilities = byId("expeditionLocalUtilities");
    new ResizeObserver(sizeArtwork).observe(refs.viewport);
    refs.travel = root.querySelector(".travel-section");
    refs.travel.querySelector("h3").textContent = "Open exploration & travel";
    root.insertBefore(byId("regionalMapSection"), frame);
    const knowledge = document.createElement("details");
    knowledge.className = "expedition-region-knowledge";
    knowledge.innerHTML = '<summary>Regional familiarity & terrain</summary>';
    knowledge.append(root.querySelector(".region-details"));
    byId("regionalMapSection").append(knowledge);
    const details = document.createElement("details");
    details.className = "expedition-kit";
    details.innerHTML = '<summary>Pack & equipment</summary>';
    details.append(byId("gearSection"));
    root.append(details);
    byId("expeditionWorkflowPanel").innerHTML = '<div class="expedition-status"><span id="expeditionPackStatus"></span><span id="expeditionWaterStatus"></span></div>';
    refs.browse.addEventListener("click", () => { browsing = !browsing; selected = null; render(); });
    byId("expeditionDetailClose").addEventListener("click", close);
    root.addEventListener("keydown", event => {
      if (event.key === "Escape" && !refs.panel.hidden) { event.preventDefault(); event.stopPropagation(); close(); }
    });
    return true;
  }
  function close() {
    const marker = refs.markers.querySelector('[data-landmark="' + selected + '"]');
    selected = null;
    render();
    (marker && !marker.hidden ? marker : refs.browse).focus({ preventScroll: true });
  }
  function move(node, target) { if (node && node.parentElement !== target) target.append(node); }
  function nodeStatus() {
    const node = getTowerNodeState(scenes[gameState.expedition.currentLocation]?.nodeRegion || "north");
    return node.built ? "Built" : node.researchUnlocked ? "Unbuilt" : node.activated ? "Discovered" : "";
  }
  function landmarkVisible(landmark) {
    if (landmark.visible) return landmark.visible();
    if (landmark.gated === "node") return !!nodeStatus();
    if (landmark.gated === "disturbance") return !!gameState.northernDisturbance?.triggered;
    return true;
  }
  function choose(id) {
    selected = id;
    render();
    refs.panel.scrollTop = 0;
    byId("expeditionDetailTitle").focus({ preventScroll: true });
    if (matchMedia("(max-width: 900px)").matches) refs.panel.scrollIntoView({ block: "start" });
  }
  function activateAction(id) {
    const action = getAction(id);
    updateActionButton(id);
    if (mode() !== "location" || !action?.unlocked || !action.button || action.button.disabled) return;
    action.button.click();
  }
  function primaryAction(landmark) {
    return landmark.actions.find(id => getAction(id)?.unlocked) || landmark.actions[0];
  }
  function updateDirectButton(button, id, completed = false) {
    const action = getAction(id), source = action?.button;
    const availability = getUiActionAvailability(id);
    const label = source?.querySelector(".ui-action-label")?.textContent || action?.label || id;
    text(button.querySelector("strong"), label);
    const cost = source?.querySelector(".ui-action-cost")?.textContent || "";
    const detail = source?.querySelector(".ui-action-detail")?.textContent || "";
    const progress = action?.progressBar?.style.width;
    let reason = availability.reason;
    if (availability.state === "wrong-context") {
      if (id === "trackGame" || id === "useHuntingLure") reason = "Prey already tracked. Hunt Game to follow the trail.";
      if (id === "huntGame") reason = "Track Game, Sense Prey, or use a hunting lure first.";
      if ((id === "mineStone" || id === "mineIron") && !hasPurchasedGear("crudeIronPick")) reason = "Requires Crude Iron Pick.";
    }
    // Keep artwork captions clear of adjacent landmarks; full requirements
    // remain alongside the corresponding button in the action tray.
    if (button.classList.contains("expedition-landmark") && reason) {
      if (id === "trackGame" && availability.state === "wrong-context") reason = "Prey already tracked";
      else if (id === "huntGame" && availability.state === "wrong-context") reason = "Track prey first";
      else if (availability.state === "busy") reason = "Busy";
    }
    text(button.querySelector("small"), completed ? "Exploration complete" : [cost, detail, reason, availability.state === "running" && progress ? progress : ""].filter(Boolean).join(" · "));
    button.disabled = completed || !action?.unlocked || !source || source.disabled;
    button.dataset.uiState = completed ? "complete" : availability.state;
    button.setAttribute("aria-label", label + (completed ? ", complete" : ""));
    const description = button.querySelector("small");
    description.id = "expedition-action-info-" + (button.dataset.directKey || "landmark-" + button.dataset.landmark).replace(/:/g, "-");
    button.setAttribute("aria-describedby", description.id);
    button.removeAttribute("aria-controls");
    button.removeAttribute("aria-expanded");
    button.removeAttribute("aria-pressed");
    const fill = button.querySelector(".progressFill");
    if (fill) fill.style.width = progress || "0%";
  }
  function renderLocalTools(scene) {
    const sections = [ui.locationContextualActions, ui.locationSpellActions, ui.craftingSpellActions];
    refs.local.hidden = !scene;
    for (const section of sections) {
      if (scene) { move(section, refs.utilities); section.classList.remove("expedition-filtered"); }
      else if (section.parentElement === refs.utilities) { move(section, ui.locationContent); section.classList.remove("expedition-filtered"); }
    }
    if (!scene) return;
    const ids = [...new Set(scene.landmarks.filter(l => l.interaction === "action" && landmarkVisible(l)).flatMap(l => l.actions))];
    if (gameState.expedition.currentLocation === "stagRuns") ids.push("useHuntingLure");
    const target = gameState.expedition.currentLocation === "stagRuns" ? "sensePrey" : gameState.expedition.currentLocation === "foothillScree" ? "stoneSense" : null;
    const keys = ids.map(id => "action:" + id).concat(target ? ["spell:" + target] : []);
    for (const button of [...refs.direct.children]) if (!keys.includes(button.dataset.directKey)) button.remove();
    for (const [index, key] of keys.entries()) {
      const [kind, id] = key.split(":");
      let button = [...refs.direct.children].find(b => b.dataset.directKey === key);
      if (!button) {
        button = document.createElement("button"); button.type = "button";
        button.dataset.directKey = key; button.innerHTML = '<strong></strong><small></small><span class="direct-progress" aria-hidden="true"><span class="progressFill"></span></span>';
        button.addEventListener("click", () => {
          if (kind === "action") activateAction(id);
          else if (mode() === "location" && canApplyManaSenseTarget(id)) castTargetedSpell("manaSense", getManaSenseTargetContext(id));
        });
        refs.direct.append(button);
      }
      if (refs.direct.children[index] !== button) refs.direct.insertBefore(button, refs.direct.children[index] || null);
      if (kind === "action") {
        const complete = id === "exploreLocation" && getExpeditionLocation(gameState.expedition.currentLocation).explored;
        button.hidden = !getAction(id)?.unlocked && !complete;
        updateDirectButton(button, id, complete);
      } else {
        const definition = getManaSenseDefinition(id), active = isManaSenseTargetActive(id);
        const running = isActivityActive() && gameState.activity.kind === "spell" && gameState.activity.context?.targetId === id;
        button.hidden = !getSpell("manaSense")?.unlocked || !isManaSenseTargetVisible(id);
        button.disabled = !canApplyManaSenseTarget(id);
        text(button.querySelector("strong"), definition.label);
        text(button.querySelector("small"), [formatSpellOptionDetails("manaSense", definition, getManaSenseTargetContext(id)), active ? definition.activeDescription : running ? "Casting" : isActivityActive() ? "Another task is in progress" : getUiCostShortfall(definition.cost)].filter(Boolean).join(" · "));
        button.dataset.uiState = running ? "running" : active ? "complete" : button.disabled ? "blocked" : "ready";
        button.querySelector(".progressFill").style.width = running ? Math.min(100, Math.max(0, (getGameTime() - gameState.activity.startTime) / (gameState.activity.duration * 10))) + "%" : "0%";
      }
    }
    for (const option of refs.utilities.querySelectorAll("[data-mana-sense-target]")) option.hidden = option.dataset.manaSenseTarget === target;
    ui.locationSpellActions.classList.toggle("expedition-filtered", ![...ui.locationSpellActions.querySelectorAll("button")].some(button => !button.hidden && button.style.display !== "none"));
    let info = "";
    const place = gameState.expedition.currentLocation;
    if (place === "foothillScree") info = "Per gathering cycle: " + getGatherStoneAmount() + " Stone. Ore find chance: " + Math.round(getFoothillScreeOreFindChance() * 100) + "%. Stone Sense: " + (hasStoneSenseActive() ? "active" : "inactive") + ".";
    if (place === "creepyCave") info = "Loose stone remaining: " + getExpeditionLocation(place).looseStoneRemaining + ". Per gathering cycle: " + getGatherStoneAmount() + " Stone.";
    if (place === "ironMine" && getExpeditionLocation(place).explored) info = "Per mining cycle: " + getMineResourceAmount("stone") + " Stone or " + getMineResourceAmount("iron") + " Iron.";
    text(byId("expeditionDirectInfo"), info); byId("expeditionDirectInfo").hidden = !info;
    const hasDirectActions = [...refs.direct.children].some(button => !button.hidden);
    refs.local.querySelector("h3").hidden = !hasDirectActions;
    refs.direct.hidden = !hasDirectActions;
    refs.local.hidden = !hasDirectActions && !info && !sections.some(section => section.style.display !== "none" && !section.hidden && !section.classList.contains("expedition-filtered"));
  }
  function buildSurface(key, landmarks) {
    surfaceKey = key;
    refs.surface.dataset.scene = key;
    const place = key.split(":")[0];
    refs.art.replaceChildren();
    const background = document.createElement("img");
    background.className = "expedition-background";
    background.src = place === "north" ? "assets/expedition/north.webp" : place === "outskirts" ? "assets/expedition/outskirts-map.png" : place === "east" ? "assets/expedition/east-map.png" : place === "south" ? "assets/expedition/south-map.png" : place === "west" ? "assets/expedition/west-map.png" : scenes[place].artwork;
    background.alt = "";
    background.width = 1122; background.height = 1402;
    background.decoding = "async";
    refs.art.append(background);
    if (place === getTowerNodeDefinition(scenes[place]?.nodeRegion || "north").locationName && landmarks.some(l => l.id === "node")) {
      const overlay = document.createElement("img");
      overlay.className = "expedition-node-overlay";
      overlay.src = "assets/expedition/northern-node.webp";
      overlay.alt = "";
      if (scenes[place]?.nodeOverlay) Object.assign(overlay.style, scenes[place].nodeOverlay);
      refs.art.append(overlay);
    }
    refs.markers.replaceChildren();
    for (const landmark of landmarks) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "expedition-landmark";
      button.dataset.landmark = landmark.id;
      button.style.setProperty("--x", landmark.x + "%");
      button.style.setProperty("--y", landmark.y + "%");
      button.setAttribute("aria-controls", landmark.route ? "regionalMapSection" : "expeditionDetail");
      button.setAttribute("aria-label", landmark.route ? "Inspect routes from this location" : "Inspect " + landmark.title);
      const label = document.createElement("strong"), state = document.createElement("small");
      label.textContent = landmark.title;
      const caption = document.createElement("span");
      caption.className = "expedition-landmark-label";
      caption.append(label, state);
      button.append(caption);
      button.addEventListener("click", () => landmark.route ? refs.browse.click() : landmark.interaction === "action" ? activateAction(primaryAction(landmark)) : choose(landmark.id));
      refs.markers.append(button);
    }
    sizeArtwork();
  }
  // One cover transform shared by the raster and percentage-based hit areas.
  // This preserves landmark alignment through desktop/mobile cropping.
  function sizeArtwork() {
    const width = refs.viewport.clientWidth, height = refs.viewport.clientHeight;
    if (!width || !height) return;
    const scale = Math.max(width / 1122, height / 1402);
    for (const plane of [refs.art, refs.markers]) {
      plane.style.width = 1122 * scale + "px";
      plane.style.height = 1402 * scale + "px";
      plane.style.left = (width - 1122 * scale) / 2 + "px";
      plane.style.top = (height - 1402 * scale) * .38 + "px";
    }
  }
  function render() {
    if (typeof ui === "undefined" || !ui.expeditionPanelTitle) return;
    if (!refs && !init()) return;
    if (byId("westArchiveRitual")) byId("westArchiveRitual").hidden = true;
    const e = gameState.expedition, state = mode();
    if (typeof ExpeditionMap !== "undefined") ExpeditionMap.sync();
    const physical = state + ":" + (e.currentLocation || "");
    if (physical !== physicalKey) { physicalKey = physical; selected = null; browsing = false; }
    const regionId = getSelectedTravelRegionId();
    const north = gameState.tier3Unlocked && getRegionState("north").unlocked && regionId === "north";
    const outskirts = regionId === "outskirts";
    const east = regionId === "east" && getRegionState("east").unlocked;
    const south = regionId === "south" && getRegionState("south").unlocked;
    const west = regionId === "west" && getRegionState("west").unlocked;
    const local = state === "location" && !!scenes[e.currentLocation];
    const map = (north || outskirts || east || south || west) && ((state === "planning") || (browsing && ["location", "preparing", "traveling", "paused"].includes(state)));
    const scene = local && !map ? scenes[e.currentLocation] : null;
    renderLocalTools(scene);
    refs.root.dataset.expeditionState = state;
    getAction("travel").button.hidden = ["location", "dungeon", "combat"].includes(state);
    getAction("beginExpedition").button.hidden = state !== "planning";
    ui.destinationActions.hidden = state !== "planning";
    refs.travel.querySelector(".expedition-stats").hidden = ["location", "dungeon", "combat"].includes(state);
    text(refs.travel.querySelector("h3"), state === "planning" ? "Open exploration & travel" : "Expedition controls");
    const heading = state === "dungeon" ? getCurrentDungeon()?.label : e.currentLocation ? getLocationLabel(e.currentLocation) : getPreparedExpeditionTitle();
    text(ui.expeditionPanelTitle, (heading || "Expedition") + " · " + state[0].toUpperCase() + state.slice(1));
    const carriedSummary = getCarriedSummary();
    text(byId("expeditionPackStatus"), "Pack " + formatCarryAmount(getCarriedTotal()) + " / " + formatCarryAmount(getEffectiveCarryCapacity()) + " · " + (carriedSummary || "Empty"));
    text(byId("expeditionWaterStatus"), "Water " + formatCarryAmount(e.water || 0) + " / " + formatCarryAmount(e.waterCapacity || 0));
    refs.browse.hidden = !(north || outskirts || east || south || west) || state === "planning" || state === "combat" || state === "dungeon";
    text(refs.frame.querySelector(".expedition-map-key small"), south ? "Southern overgrowth" : outskirts ? "Outskirts" : east ? "Eastern deepwood" : "Northern reach");
    if (west) text(refs.frame.querySelector(".expedition-map-key small"), "Western road");
    text(refs.browse, map ? (local ? "Back to location" : "Back to expedition") : "Inspect routes");
    text(byId("expeditionSceneCaption"), map ? "North · Known places — select a landmark to inspect its route." : scene ? scene.description : state === "traveling" ? getCurrentTravelDescription() : state === "paused" ? "Travel is paused. Resume or return using the controls above." : state === "preparing" ? "Pack supplies, then start the prepared route." : state === "planning" ? "Choose open exploration or a known destination." : "");
    refs.surface.hidden = !map && !scene;
    refs.frame.hidden = state === "combat";
    refs.root.classList.toggle("expedition-illustrated", !!map || !!scene);
    refs.root.classList.toggle("expedition-map-open", !!map);
    move(ui.locationContent, scene ? refs.body : refs.retained);
    ui.locationContent.classList.toggle("expedition-local-controls", !!scene);
    // Browsing never substitutes a destination for the player's location.
    refs.retained.hidden = !!map;
    move(ui.destinationActions, map ? refs.body : refs.travel.querySelector(".travel-actions"));
    move(ui.locationTravelSection, map ? refs.body : refs.travel.querySelector(".travel-actions"));
    ui.locationTravelSection.hidden = !!scene;
    if (!scene && !map) {
      refs.panel.hidden = true;
      clearFilter();
      filterRoutes(false);
      return;
    }
    if (map && south) text(byId("expeditionSceneCaption"), "South · Known places — select a landmark to inspect its route.");
    if (map && west) text(byId("expeditionSceneCaption"), "West · Known places — select a landmark to inspect its route.");
    if (map && east) text(byId("expeditionSceneCaption"), "East · Known places — select a landmark to inspect its route.");
    if (map && outskirts) text(byId("expeditionSceneCaption"), "Outskirts · Known places — select a landmark to inspect its route.");
    const landmarks = map ? getRegionKnownLocations(regionId).filter(id => mapPositions[id]).map(id => ({ id, title: getLocationLabel(id), x: mapPositions[id][0], y: mapPositions[id][1] })) : [...scene.landmarks.filter(landmarkVisible), { ...routeLandmark, x: e.currentLocation === "foothillScree" ? 60 : 40 }];
    const key = (map ? regionId : e.currentLocation) + ":" + landmarks.map(l => l.id).join(",");
    if (surfaceKey !== key) {
      if (!landmarks.some(l => l.id === selected)) selected = null;
      buildSurface(key, landmarks);
    }
    refs.surface.dataset.nodeState = local && e.currentLocation === getTowerNodeDefinition(scene?.nodeRegion || "north").locationName ? nodeStatus().toLowerCase() : "";
    refs.surface.classList.toggle("stone-sense-active", !!scene && e.currentLocation === "foothillScree" && hasStoneSenseActive());
    const chosen = landmarks.find(l => l.id === selected);
    for (const button of refs.markers.children) {
      const landmark = landmarks.find(l => l.id === button.dataset.landmark);
      if (landmark.route) { text(button.querySelector("small"), "Inspect routes"); continue; }
      if (landmark.interaction === "action") {
        const id = primaryAction(landmark);
        const complete = id === "exploreLocation" && getExpeditionLocation(e.currentLocation).explored;
        button.hidden = !getAction(id)?.unlocked && !complete;
        button.classList.toggle("is-complete", complete || !!landmark.complete?.());
        updateDirectButton(button, id, complete);
        continue;
      }
      const isSelected = selected === landmark.id;
      text(button.querySelector("strong"), landmark.title);
      button.setAttribute("aria-label", "Inspect " + landmark.title);
      button.setAttribute("aria-expanded", String(isSelected));
      button.setAttribute("aria-pressed", String(isSelected));
      const current = map && landmark.id === e.currentLocation;
      button.classList.toggle("is-current", current);
      if (current) button.setAttribute("aria-current", "location"); else button.removeAttribute("aria-current");
      const complete = !map && (landmark.complete ? landmark.complete() : landmark.object ? isLocationObjectComplete(getLocationObject(e.currentLocation, landmark.object)) : landmark.investigation && getExpeditionLocation(e.currentLocation).explored);
      button.classList.toggle("is-complete", !!complete);
      text(button.querySelector("small"), current ? "You are here" : complete ? "Survey complete" + (isSelected ? " · Selected" : "") : isSelected ? "Selected" : landmark.id === "node" ? nodeStatus() : map ? "Known place" : "Inspect");
      if (!map && landmark.object) {
        const object = getLocationObject(e.currentLocation, landmark.object);
        text(button.querySelector("small"), complete ? "Complete" : isSelected ? "Selected" : getLocationObjectProgress(object) === 0 ? "New · Inspect" : "Investigating");
      }
    }
    refs.surface.dataset.panelSide = chosen && chosen.x > 50 ? "left" : "right";
    refs.panel.hidden = !chosen;
    refs.surface.classList.toggle("has-detail", !!chosen);
    if (!chosen) { filterLocal(null); filterRoutes(map); return; }
    text(byId("expeditionDetailTitle"), chosen.title);
    text(byId("expeditionDetailKicker"), map ? "Route overview" : "At your location");
    text(byId("expeditionDetailDescription"), map ? getLocationPanelText(getExpeditionLocation(selected)) : chosen.description);
    let info = "";
    if (map) {
      const location = getExpeditionLocation(selected);
      const distance = e.currentLocation ? getLocationToLocationTravelDistance(getExpeditionLocation(e.currentLocation), location) : getLocationTravelDistance(location);
      info = selected === e.currentLocation ? "You are here. Return to the location scene to work here." : "Travel distance: " + formatDistance(distance) + (e.currentLocation ? " from your location." : " from camp.");
      if (e.active && !e.currentLocation) info += " Finish or return from your current route before preparing another destination.";
      filterRoutes(true);
    } else {
      filterLocal(chosen);
      if (e.currentLocation === "arcaneArchive" && chosen.id === "door") syncArchiveRitual();
      filterRoutes(false);
      if (chosen.id === "scree" && isManaSenseTargetVisible("stoneSense") && getSpell("manaSense").unlocked) info = "Stone Sense: " + (hasStoneSenseActive() ? "active" : "inactive") + " · Ore find chance " + Math.round(getFoothillScreeOreFindChance() * 100) + "%.";
      if (chosen.id === "scree") info = "Per gathering cycle: " + getGatherStoneAmount() + " Stone." + (info ? " " + info : "");
      if (chosen.id === "mine" && getExpeditionLocation(e.currentLocation).explored) info = "Per mining cycle: " + getMineResourceAmount("stone") + " Stone or " + getMineResourceAmount("iron") + " Iron, when the required pick is equipped and your pack has room.";
      if (chosen.id === "smelter" && getResourceCraft("iron").button?.style.display !== "none") {
        const produces = getActiveCraftContext(getResourceCraft("iron"))?.storageProduces;
        if (produces) info = "Per smelting cycle: " + Object.entries(produces).map(([id, amount]) => amount + " " + getResource(id).label).join(", ") + " added to the stores here.";
        info += " Pack: " + (e.carriedItems.wood || 0) + " Wood, " + (e.carriedItems.imbuedWood || 0) + " Imbued Wood, " + (e.carriedItems.ore || 0) + " Ore. Store Fuel and Store Ore require supplies in your pack.";
      }
      if (!getExpeditionLocation(e.currentLocation).explored && chosen.id === "scree") info += (info ? " " : "") + "Investigate the rocky slope to unlock gathering.";
      if (chosen.investigation && getExpeditionLocation(e.currentLocation).explored) info = "Investigation complete.";
      if (chosen.object) {
        const object = getLocationObject(e.currentLocation, chosen.object);
        info = isLocationObjectComplete(object) ? "Investigation complete." : getLocationObjectRequirementText(object) || "Investigation progress: " + getLocationObjectProgress(object) + " / " + getLocationObjectStages(object).length + ".";
      }
      if (chosen.id === "stones") info = "Loose stone remaining: " + getExpeditionLocation(e.currentLocation).looseStoneRemaining + ". Per gathering cycle: " + getGatherStoneAmount() + " Stone.";
      if (chosen.id === "plants" || chosen.id === "trails") {
        const location = getExpeditionLocation(e.currentLocation);
        info = location.explored ? "Investigation complete. " + getLocationPanelText(location) : "Investigation progress: " + location.explorationProgress + " / " + location.explorationRequired + ".";
      }
      if (chosen.id === "node") {
        const label = scene.nodeRegion === "west" ? "Western" : scene.nodeRegion === "south" ? "Southern" : scene.nodeRegion === "east" ? "Eastern" : "Northern";
        info = label + " Node · " + nodeStatus() + (nodeStatus() === "Discovered" ? ". Research the " + label + " Tower Node to reveal its construction controls." : "");
      }
    }
    text(byId("expeditionDetailInfo"), info);
    byId("expeditionDetailInfo").hidden = !info;
  }
  // West's door uses the existing spell option component for all four charges.
  // Keep its controls mounted while the ordinary location spell lists refresh.
  function syncArchiveRitual() {
    let container = byId("westArchiveRitual");
    if (!container) {
      container = document.createElement("div");
      container.id = "westArchiveRitual";
      ui.locationContent.append(container);
    }
    container.classList.remove("expedition-filtered");
    container.hidden = false;
    ui.locationSpellActions.classList.add("expedition-filtered");
    ui.craftingSpellActions.classList.add("expedition-filtered");
    for (const spellName of ["manaSense", "arcaneForce", "imbue", "attunement"]) {
      const spell = getSpell(spellName), activeContext = getSpellCastContext(spellName);
      const object = getLocationObject("arcaneArchive", "sealedArchiveDoor");
      const context = { type: "locationObjectSpellCharge", locationName: "arcaneArchive", objectName: "sealedArchiveDoor", spellName };
      let button = container.querySelector('[data-archive-spell="' + spellName + '"]');
      const visible = spell?.unlocked && getExpeditionLocation("arcaneArchive").explored;
      if (!button && visible) {
        appendSpellCastOption(spellName, context, container);
        button = container.lastElementChild;
        button.dataset.archiveSpell = spellName;
      }
      if (!button) continue;
      button.hidden = !visible;
      if (!visible) continue;
      text(button.querySelector(".attunement-target-description"), getSpellContextDescription(context) + " · " + getLocationObjectSpellCharge(object, spellName) + " / " + getLocationObjectSpellInteraction(object, spellName).required);
      text(button.querySelector(".attunement-target-details"), formatSpellOptionDetails(spellName, spell, context));
      const usable = activeContext?.type === context.type && activeContext.objectName === context.objectName && canCastSpell(spellName);
      button.disabled = !usable;
      applyUiSpellOptionState(button, getSpellCastCost(spellName, context), usable, {
        unavailableReason: getLocationObjectSpellCharge(object, spellName) >= getLocationObjectSpellInteraction(object, spellName).required ? "Charge complete" : getLocationObjectRequirementText(object),
      });
    }
  }
  function filterRoutes(active) {
    for (const container of [ui.destinationActions, ui.locationTravelSection]) {
      for (const button of container.children) button.classList.toggle("expedition-filtered", active && button.dataset.expeditionDestination !== selected);
    }
  }
  function clearFilter() {
    ui.locationContent.querySelectorAll(".expedition-filtered").forEach(node => node.classList.remove("expedition-filtered"));
  }
  function filterLocal(landmark) {
    if (!ui.locationContent.classList.contains("expedition-local-controls")) { clearFilter(); return; }
    const sections = landmark?.sections || [], actions = landmark?.actions || [];
    for (const section of ui.locationContent.children) {
      section.classList.toggle("expedition-filtered", section.id !== "locationPrimaryActions" && !sections.includes(section.id));
    }
    for (const button of ui.locationPrimaryActions.querySelectorAll("button")) {
      const allowed = actions.includes(button.dataset.action) || (landmark?.crafts && !button.dataset.action);
      button.classList.toggle("expedition-filtered", !allowed);
    }
    for (const button of ui.locationContent.querySelectorAll("[data-location-object]")) {
      button.classList.toggle("expedition-filtered", !!landmark?.object && button.dataset.locationObject !== landmark.object);
    }
    // Shared legitimate utilities remain reachable alongside each selected work area.
    if (landmark) ui.locationContextualActions.classList.remove("expedition-filtered");
  }
  function schedule() {
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; render(); });
  }

  return { render, schedule, mode };
})();
