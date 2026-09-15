// Presentation metadata only. Mechanics and persisted room state stay in content.js.
const DungeonScene = (() => {
  const art = name => "assets/dungeons/roadside-ruin/" + name + ".png";
  const scenes = {
    roadsideRuinDepths: {
      entryStair: { image: art("hall"), alt: "Daylit entry stairs beside two passages in a weathered stone hall.", passages: { crackedHall: [83, 52], sideChamber: [39, 54] }, exit: [17, 29] },
      crackedHall: { image: art("hall"), alt: "Cracked vaults and pale blue mineral flecks along a stone hall.", passages: { entryStair: [18, 40], collapsedPassage: [83, 52] }, search: [59, 76] },
      sideChamber: { image: art("chamber"), alt: "Broken shelves and scattered furniture between two stone doorways.", passages: { entryStair: [15, 47], emptyRoom: [85, 49] }, search: [51, 62] },
      emptyRoom: { image: art("chamber"), alt: "A ruined chamber with debris and broken furniture across the floor.", passages: { sideChamber: [15, 47] }, search: [56, 73] },
      collapsedPassage: { image: art("alcove"), alt: "Fallen masonry narrows a passage into a crystal-lined alcove.", passages: { crackedHall: [19, 44], crystalBindingAlcove: [69, 39] }, search: [48, 76] },
      crystalBindingAlcove: { image: art("alcove"), alt: "An ordered lattice of pale crystal facets set into an intact stone alcove.", passages: { collapsedPassage: [19, 44] }, search: [65, 54], important: true },
    },
  };
  let refs, active = false, roomKey = "", focusNode = null;
  const homes = [];
  const byId = id => document.getElementById(id);
  const text = (node, value) => { if (node.textContent !== value) node.textContent = value; };
  function relocate(node, destination) {
    const marker = document.createComment("dungeon presentation return point");
    node.before(marker); homes.push({ node, marker }); destination.append(node);
  }
  function init() {
    const layout = document.createElement("div");
    layout.className = "dungeon-scene-layout";
    layout.innerHTML = '<section class="dungeon-current-room" aria-labelledby="dungeonSceneTitle"><header class="dungeon-scene-heading"><div><span class="dungeon-eyebrow">Current room</span><h3 id="dungeonSceneTitle" tabindex="-1"></h3></div><span id="dungeonSceneState"></span></header><div class="dungeon-painting"><img id="dungeonSceneImage" width="1536" height="1024" decoding="async"><div id="dungeonHotspots" role="group" aria-label="Room landmarks and passages"></div></div><section id="dungeonContext" aria-label="Current room actions"><p id="dungeonSceneHint"></p><p id="dungeonSceneNotice" role="status"></p><div id="dungeonUtilities"></div></section></section><details class="dungeon-map-panel" open><summary>Room map <span id="dungeonMapProgress"></span></summary><p class="dungeon-map-help">Follow connected rooms. Unseen passages stay unnamed.</p><div class="dungeon-map-scroll" tabindex="0" role="region" aria-label="Room topology; scroll horizontally to see more rooms"><div class="dungeon-map-canvas"><svg class="dungeon-connections" aria-hidden="true"></svg></div></div><p class="dungeon-map-legend">◆ Here · ✓ Explored · ◌ Visited<br>? Unseen · ⊘ Locked · ↗ Entrance<br>Solid path: open · Dashed: locked</p></details>';
    ui.dungeonSection.append(layout);
    refs = { layout, title: byId("dungeonSceneTitle"), state: byId("dungeonSceneState"), image: byId("dungeonSceneImage"), hotspots: byId("dungeonHotspots"), context: byId("dungeonContext"), hint: byId("dungeonSceneHint"), notice: byId("dungeonSceneNotice"), utilities: byId("dungeonUtilities"), progress: byId("dungeonMapProgress"), canvas: layout.querySelector(".dungeon-map-canvas"), lines: layout.querySelector("svg"), details: layout.querySelector("details") };
    // Reuse actual controls: action timing, progress fills, costs and spell menus survive.
    relocate(ui.dungeonMap, refs.canvas);
    relocate(ui.dungeonRoomText, refs.context);
    refs.context.prepend(ui.dungeonRoomText);
    relocate(ui.dungeonActions, refs.context);
    relocate(byId("locationSpellActions"), refs.context);
    relocate(ui.craftingSpellActions, refs.context);
    relocate(getAction("leaveDungeon").button, refs.utilities);
    relocate(ui.dungeonSection, ui.locationContent);
    ui.locationContent.prepend(ui.dungeonSection);
    refs.details.open = !matchMedia("(max-width: 700px)").matches;
  }
  function prepare() {
    const state = getCurrentDungeonState();
    const enabled = !!(state?.active && scenes[state.dungeonId]?.[state.nodeId]);
    focusNode = ui.dungeonMap.contains(document.activeElement) ? document.activeElement.dataset.node : null;
    if (enabled && !active) { init(); active = true; }
    if (!enabled && active) {
      // Restore the original DOM for every other dungeon and Expedition location.
      for (const { node, marker } of homes.reverse()) { marker.replaceWith(node); }
      homes.length = 0;
      refs.layout.remove(); refs = null; roomKey = ""; active = false;
      ui.dungeonRoomText.removeAttribute("aria-live");
    }
    ui.dungeonSection.classList.toggle("dungeon-illustrated", enabled);
    ui.locationContent.classList.toggle("has-dungeon-scene", enabled);
    byId("expeditionPanel").classList.toggle("dungeon-room-view", enabled);
  }
  function hotspot(id, position, label, detail, handler) {
    const button = document.createElement("button");
    button.type = "button"; button.className = "dungeon-hotspot"; button.dataset.hotspot = id;
    button.style.setProperty("--x", position[0] + "%"); button.style.setProperty("--y", position[1] + "%");
    const title = document.createElement("strong"), subtitle = document.createElement("small");
    title.textContent = label; subtitle.textContent = detail; button.append(title, subtitle);
    button.addEventListener("click", handler); refs.hotspots.append(button);
    return button;
  }
  function render() {
    if (!active) return;
    const state = getCurrentDungeonState(), dungeon = getCurrentDungeon(), node = getCurrentDungeonNode();
    const scene = scenes[state.dungeonId][state.nodeId], key = state.dungeonId + ":" + state.nodeId;
    const changedRoom = key !== roomKey;
    const focusedHotspot = refs.hotspots.contains(document.activeElement) ? document.activeElement.dataset.hotspot : null;
    text(refs.title, node.label);
    text(refs.state, isDungeonRoomFullyExplored(node) ? "✓ Explored" : "Search incomplete");
    refs.image.setAttribute("src", scene.image); refs.image.alt = scene.alt;
    refs.layout.dataset.room = state.nodeId;
    const known = Object.values(dungeon.nodes).filter(n => n.discovered);
    const complete = Object.values(dungeon.nodes).every(isDungeonRoomFullyExplored);
    text(refs.progress, complete ? "All rooms explored" : known.filter(isDungeonRoomFullyExplored).length + " / " + known.length + " visited rooms explored");
    text(refs.hint, complete ? "Every room has been explored. You can retrace your path or leave the ruin." : node.search && !node.explored ? "Explore this room to open the way forward. Available magic can help your search." : node.rewardClaimed ? "This room’s reward has already been claimed. Choose a passage to continue." : "Choose a passage to continue exploring.");
    if (changedRoom) text(refs.notice, "");
    refs.hotspots.replaceChildren();
    for (const exit of node.exits || []) {
      const target = dungeon.nodes[exit.to], mapButton = ui.dungeonMap.querySelector('[data-node="' + exit.to + '"]');
      if (!target || !mapButton) continue;
      const blocked = mapButton.classList.contains("locked");
      const position = scene.passages?.[exit.to];
      // Missing artwork metadata leaves the canonical map navigation available.
      if (!position) continue;
      const button = hotspot(exit.to, position, target.discovered ? target.label : "Unexplored passage", blocked ? "⊘ Locked · inspect" : target.discovered ? "Follow passage →" : "Enter →", () => {
        const currentButton = ui.dungeonMap.querySelector('[data-node="' + exit.to + '"]');
        if (currentButton?.classList.contains("locked")) text(refs.notice, currentButton.title);
        currentButton?.click();
      });
      button.classList.toggle("is-locked", blocked);
      button.setAttribute("aria-controls", "dungeonRoomText");
    }
    if (scene.search && node.search && !node.explored) {
      const source = getDungeonActionButton("exploreRoom");
      const search = hotspot("search", scene.search, "Explore room", source?.disabled ? source.querySelector(".ui-action-reason")?.textContent || "Search unavailable" : "Search this room", () => {
        const current = getDungeonActionButton("exploreRoom");
        if (current && !current.disabled) current.click();
      });
      search.disabled = !source || source.disabled;
    }
    if (scene.exit) hotspot("exit", scene.exit, "Leave ruin", "Return to the surface ↗", () => getAction("leaveDungeon").button.click());
    decorateMap(dungeon, node, state);
    roomKey = key;
    if (changedRoom && (focusNode || focusedHotspot)) refs.title.focus({ preventScroll: true });
    else if (focusNode) ui.dungeonMap.querySelector('[data-node="' + focusNode + '"]')?.focus({ preventScroll: true });
    else if (focusedHotspot) refs.hotspots.querySelector('[data-hotspot="' + focusedHotspot + '"]')?.focus({ preventScroll: true });
  }
  function decorateMap(dungeon, current, state) {
    const buttons = [...ui.dungeonMap.querySelectorAll("[data-node]")];
    const visible = new Set(buttons.map(b => b.dataset.node));
    // Coordinates come directly from the original room definitions. Strip only the empty margin column.
    const nodes = buttons.map(b => dungeon.nodes[b.dataset.node]);
    const minX = Math.min(...nodes.map(n => n.x)), minY = Math.min(...nodes.map(n => n.y));
    const cols = Math.max(...nodes.map(n => n.x)) - minX + 1, rows = Math.max(...nodes.map(n => n.y)) - minY + 1;
    refs.canvas.style.width = (cols * 84 - 12) + "px";
    ui.dungeonMap.style.gridTemplateColumns = "repeat(" + cols + ", 72px)";
    refs.lines.setAttribute("viewBox", "0 0 " + (cols * 84 - 12) + " " + (rows * 84 - 12));
    refs.lines.replaceChildren();
    for (const button of buttons) {
      const id = button.dataset.node, node = dungeon.nodes[id], here = id === state.nodeId;
      const status = here ? "Here" : !node.discovered ? "Unseen" : node.explored ? "Explored" : "Visited";
      const icon = here ? "◆" : button.classList.contains("locked") ? "⊘" : id === dungeon.startNode ? "↗" : node.explored ? "✓" : node.discovered ? "◌" : "?";
      button.style.gridColumn = node.x - minX + 1; button.style.gridRow = node.y - minY + 1;
      button.querySelector("span").textContent = icon + " " + (node.discovered ? node.label : "?");
      button.setAttribute("aria-label", (node.discovered ? node.label : "Unseen room") + ", " + status + (button.classList.contains("locked") ? ", locked. " + button.title : "") + (id === dungeon.startNode ? ", entrance" : ""));
      if (button.classList.contains("locked")) button.addEventListener("click", () => {
        text(ui.dungeonRoomText, current.description || "");
        text(refs.notice, button.title);
      });
      if (here) button.setAttribute("aria-current", "location");
      button.classList.toggle("important", !!(node.discovered && scenes[state.dungeonId][id]?.important));
      for (const exit of node.exits || []) {
        if (!visible.has(exit.to) || id > exit.to) continue;
        const target = dungeon.nodes[exit.to];
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        for (const [attr, value] of Object.entries({ x1: (node.x - minX) * 84 + 36, y1: (node.y - minY) * 84 + 36, x2: (target.x - minX) * 84 + 36, y2: (target.y - minY) * 84 + 36 })) line.setAttribute(attr, value);
        const adjacentId = id === state.nodeId ? exit.to : exit.to === state.nodeId ? id : null;
        const locked = adjacentId ? !canMoveToDungeonNode(adjacentId) : !canEnterDungeonNode(state.dungeonId, id) || !canEnterDungeonNode(state.dungeonId, exit.to);
        line.classList.toggle("locked", locked); refs.lines.append(line);
      }
    }
    ui.dungeonRoomText.setAttribute("aria-live", "polite");
  }
  return { prepare, render };
})();
