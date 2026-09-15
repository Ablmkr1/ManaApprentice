/* Read-only presentation; original controls own travel and gameplay. */
const ExpeditionMap = (() => {
  let dialog, opener, root, geography, viewport, panel;
  let selected = { region: "outskirts" }, signature = "", showing = true;
  const config = ExpeditionMapConfig;
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function isUnlocked() { return !!gameState.oldMapFound; }
  function close() {
    showing = false; sync();
    if (opener && !opener.hidden) opener.focus({ preventScroll: true });
  }
  function open() {
    if (!isUnlocked()) {
      showing = false; sync();
      return;
    }
    showing = true; signature = ""; sync();
    const target = geography?.querySelector('[data-region="' + selected.region + '"]');
    target?.focus({ preventScroll: true });
    if (target) viewport.scrollLeft = target.offsetLeft - viewport.clientWidth / 2;
  }
  function init() {
    root = document.getElementById("expeditionPanel");
    const heading = root?.querySelector(".expedition-view-heading");
    if (!heading) return;
    opener = element("button", "Return to Map", "expedition-map-toggle");
    opener.type = "button"; opener.id = "expeditionMapOpen"; opener.onclick = open;
    heading.append(opener);
    dialog = element("section", "", "expedition-world-map");
    dialog.id = "expeditionWorldMap"; dialog.setAttribute("aria-labelledby", "expeditionMapTitle");
    const header = element("header"), title = element("h2", "Expedition Map");
    title.id = "expeditionMapTitle";
    const resume = element("button", "Return to expedition"); resume.type = "button"; resume.onclick = close;
    header.append(title, resume);
    viewport = element("div", "", "world-map-viewport");
    viewport.tabIndex = 0; viewport.setAttribute("aria-label", "World parchment. Scroll horizontally to explore the map.");
    geography = element("div", "", "world-map-geography");
    const base = element("img", "", "map-base"); base.src = config.base;
    base.alt = "Parchment trails radiate from the central Outskirts toward northern mountains, eastern woods, southern marsh and western ruins.";
    geography.append(base, element("div", "", "map-overlays")); viewport.append(geography);
    panel = element("section", "", "world-map-detail"); panel.id = "worldMapDetail";
    dialog.append(header, element("p", "Choose a region, then enter its scene. Scroll the parchment sideways on a small screen.", "world-map-legend"), element("p", "", "world-map-current"), viewport, panel);
    root.prepend(dialog);
    dialog.addEventListener("keydown", event => { if (event.key === "Escape") { event.preventDefault(); close(); } });
  }
  function entrance(id) {
    const location = getExpeditionLocation(id);
    return location?.explored && location.dungeon ? getDungeon(location.dungeon) : null;
  }
  function choose(destination) { selected = destination; updateSelection(); detail(); }
  function updateSelection() {
    geography.querySelectorAll("[data-region]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.region === selected.region)));
    geography.querySelectorAll("[data-overlay]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.overlay === selected.overlay)));
  }
  function render() {
    const e = gameState.expedition;
    dialog.querySelector(".world-map-current").textContent = "Current location: " + (e.currentLocation ? getLocationLabel(e.currentLocation) : e.active ? getPreparedExpeditionTitle() : "Outskirts camp") + (isTravelActivityActive() ? " · Traveling" : "");
    const layer = geography.querySelector(".map-overlays");
    const focusKey = document.activeElement?.dataset.overlay || document.activeElement?.dataset.region;
    layer.replaceChildren();
    const currentRegion = e.active ? e.regionId : "outskirts";
    for (const region of config.regions) {
      const b = element("button", "", "world-map-region"); b.type = "button"; b.dataset.region = region.id;
      b.style.setProperty("--x", region.x + "%"); b.style.setProperty("--y", region.y + "%");
      const unlocked = getRegionState(region.id).unlocked;
      b.classList.toggle("is-locked", !unlocked); b.classList.toggle("is-current-region", currentRegion === region.id);
      b.setAttribute("aria-label", region.label + (unlocked ? ", select region" : ", unexplored route"));
      b.setAttribute("aria-controls", panel.id);
      b.append(element("span", region.label, "world-map-region-label"));
      b.onclick = () => choose({ region: region.id }); layer.append(b);
    }
    for (const overlay of config.overlays.filter(o => o.displayCondition())) {
      const label = config.label(overlay), b = element("button", "", "world-map-object"); b.type = "button";
      b.dataset.overlay = overlay.id;
      if (overlay.destination.id && overlay.id === overlay.destination.id) b.dataset.location = overlay.destination.id;
      b.style.setProperty("--x", overlay.x + "%"); b.style.setProperty("--y", overlay.y + "%");
      b.setAttribute("aria-label", label); b.setAttribute("aria-controls", panel.id);
      if (e.currentLocation && overlay.id === e.currentLocation) b.setAttribute("aria-current", "location");
      const img = element(overlay.sprite === undefined ? "img" : "span");
      if (overlay.sprite === undefined) { img.src = config.asset(overlay); img.alt = ""; }
      else {
        img.className = "world-map-sprite"; img.setAttribute("aria-hidden", "true");
        img.style.backgroundImage = 'url("' + config.asset(overlay) + '")';
        img.style.backgroundPosition = (overlay.sprite % 4 * 100 / 3) + "% " + (Math.floor(overlay.sprite / 4) * 100 / 3) + "%";
      }
      b.append(img, element("span", label, "world-map-tooltip"));
      b.onclick = () => choose({ ...overlay.destination, overlay: overlay.id }); layer.append(b);
    }
    if (selected.overlay && !layer.querySelector('[data-overlay="' + selected.overlay + '"]')) selected = { region: selected.region };
    updateSelection(); detail();
    if (focusKey) layer.querySelector('[data-overlay="' + focusKey + '"], [data-region="' + focusKey + '"]')?.focus({ preventScroll: true });
  }
  function sync() {
    if (!dialog) init();
    if (!dialog) return;
    const blocked = isCombatActive() || !!gameState.expedition.dungeon?.active;
    const unlocked = isUnlocked();
    const visible = showing && unlocked && !blocked;
    root.classList.toggle("is-world-map", visible); dialog.hidden = !visible; opener.hidden = blocked || !unlocked;
    if (!visible) return;
    const e = gameState.expedition;
    const next = JSON.stringify([e.currentLocation, e.active, e.regionId, isActivityActive(), config.centerVariant(), config.regions.map(r => getRegionState(r.id).unlocked), config.overlays.filter(o => o.displayCondition()).map(o => [o.id, config.label(o), config.asset(o)]), isTravelActivityActive()]);
    if (next !== signature) { signature = next; render(); }
  }
  function detail() {
    const panel = dialog.querySelector(".world-map-detail"); panel.replaceChildren();
    panel.hidden = !selected;
    if (!selected) return;
    const e = gameState.expedition, { region, id, camp } = selected;
    panel.append(element("h3", selected.overlay ? config.label(config.overlays.find(o => o.id === selected.overlay)) : camp ? "Outskirts camp" : id ? getLocationLabel(id) : config.regions.find(r => r.id === region).label));
    const explain = message => panel.append(element("p", message));
    if (!camp && !id) {
      if (!getRegionState(region).unlocked) {
        explain("The route fades beyond your charts. Follow the Outskirts discoveries and recover a map of the wider wilderness.");
        return;
      }
      const known = config.overlays.filter(o => o.region === region && o.displayCondition()).map(config.label);
      explain(known.length ? "Known highlights: " + known.join(" · ") : "The route is open. Its landmarks remain unexplored.");
      if (isActivityActive() && !e.active) { explain("Finish the current activity before preparing another route."); return; }
      if (e.active && region !== e.regionId) {
        explain("Return to camp before preparing a different regional route.");
        return;
      }
      const enter = element("button", "Enter " + config.regions.find(r => r.id === region).label);
      enter.type = "button";
      enter.onclick = () => {
        if (!getRegionState(region).unlocked || (e.active && region !== e.regionId) || (isActivityActive() && !e.active)) { detail(); return; }
        if (!e.active) selectRegion(region);
        close();
      };
      panel.append(enter); return;
    }
    // Re-read the original controls when clicked. They own costs and action dispatch.
    function action(label, resolve, reason = "This action is not available right now.") {
      const source = resolve();
      if (!source || source.disabled) { explain(source?.querySelector(".ui-action-reason")?.textContent || reason); return; }
      const button = element("button", label || source.textContent.trim()); button.type = "button";
      button.onclick = () => {
        const live = resolve();
        if (!live || live.disabled || isActivityActive()) { detail(); return; }
        close(); live.click();
      };
      panel.append(button);
    }
    if (isActivityActive() || isCombatActive() || e.dungeon?.active) { explain("Finish the current activity or leave the dungeon before changing routes."); return; }
    if (camp) {
      if (!e.active) {
        explain("You are here.");
        const tower = selected.overlay === "foundation" || selected.overlay?.startsWith("tower-");
        const home = element("button", tower ? "Inspect tower site" : "Visit camp"); home.type = "button";
        home.onclick = () => setMainView(tower ? "tower" : "home", { userSelected: true, homeTowerEntry: tower }); panel.append(home);
      }
      else action(null, () => getAction("returnToCamp").button, getUiActionAvailability("returnToCamp").reason);
      return;
    }
    if (id === e.currentLocation) {
      explain("You are here.");
      const back = element("button", "Return to location scene"); back.type = "button"; back.onclick = close; panel.append(back);
      if (entrance(id)) action("Enter " + entrance(id).label, () => getAction("enterDungeon").unlocked ? getAction("enterDungeon").button : null, getUiActionAvailability("enterDungeon").reason || "The entrance is sealed.");
      return;
    }
    if (e.active && (!e.currentLocation || region !== e.regionId || !id)) {
      explain("Return to Camp before preparing a different regional route. Known places in your current region can be reached from its location scenes."); return;
    }
    explain("Travel distance: " + formatDistance(e.currentLocation ? getLocationToLocationTravelDistance(getExpeditionLocation(e.currentLocation), getExpeditionLocation(id)) : getLocationTravelDistance(getExpeditionLocation(id))));
    if (entrance(id)) explain(entrance(id).label + " entrance · Travel here to inspect it.");
    if (!e.active) {
      // Region selection uses the existing planner only when committing travel.
      const button = element("button", "Prepare travel here"); button.type = "button";
      button.onclick = () => {
        if (gameState.expedition.active || isActivityActive()) { detail(); return; }
        selectRegion(region);
        const source = ui.destinationActions.querySelector('[data-expedition-destination="' + id + '"]');
        if (source && !source.disabled) { close(); source.click(); }
        else explain(source?.querySelector(".ui-action-reason")?.textContent || "This route cannot be prepared right now. Check your expedition supplies.");
      }; panel.append(button);
      const node = getBuiltTowerNodeForLocation(id);
      if (node && canPrepareTowerNodeJump(node, id)) {
        const jump = element("button", "Prepare node jump"); jump.type = "button";
        jump.onclick = () => { if (!canPrepareTowerNodeJump(node, id) || isActivityActive()) { detail(); return; } close(); startActivity({ kind: "instant", id: "towerNodeJumpPreparation", context: { nodeName: node } }); };
        panel.append(jump);
      }
    } else action(null, () => ui.locationTravelSection.querySelector('[data-expedition-destination="' + id + '"]'));
  }


  return { sync, open, close };
})();

