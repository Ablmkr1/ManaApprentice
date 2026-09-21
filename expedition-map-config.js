/* Read-only map projection. Coordinates are percentages of the immutable base. */
const ExpeditionMapConfig = (() => {
  const regions = [
    { id: "outskirts", label: "Outskirts", x: 50, y: 50 },
    { id: "north", label: "Northern Reach", x: 38, y: 16 },
    { id: "east", label: "Eastern Wilds", x: 79, y: 31 },
    { id: "south", label: "Southern Fen", x: 67, y: 76 },
    { id: "west", label: "Western Ruins", x: 21, y: 30 },
  ];
  const home = name => "assets/home/station-" + name + ".png";
  const art = name => "assets/expedition/map/" + name + ".webp";
  const started = id => ["under-construction", "completed"].includes(getTowerConstructionState(id));
  function centerVariant() {
    if (getProjectState("towerFloor2")?.completed) return "tower-expanded";
    if (started("towerFoundation") || gameState.towerConstructionUnlocked) return "tower-ground-floor";
    return gameState.magic?.sensedReveals?.campFoundation ? "foundation" : "camp";
  }
  const overlays = [];
  function add(id, region, x, y, asset, label, displayCondition, destination = {}) {
    overlays.push({ id, region, x, y, asset, label, displayCondition, destination: { region, ...destination } });
  }
  const camp = () => centerVariant() === "camp";
  add("camp", "outskirts", 50, 50, home("workspot"), "Camp workspot", () => camp() && isHomeWorkSpotDeclared() && !hasPurchasedCampUpgrade("workbench"), { camp: true });
  add("camp-fire", "outskirts", 46, 54, home("campfire-small"), "Camp fire", () => camp() && hasPurchasedCampUpgrade("smallFire"), { camp: true });
  add("camp-shelter", "outskirts", 54, 48, home("shelter"), "Crude shelter", () => camp() && hasPurchasedCampUpgrade("crudeLeanTo"), { camp: true });
  add("camp-workbench", "outskirts", 50, 50, home("workbench"), "Camp workbench", () => camp() && hasPurchasedCampUpgrade("workbench"), { camp: true });
  const fire = overlays.find(o => o.id === "camp-fire");
  fire.asset = () => home(hasPurchasedCampUpgrade("stoneFirePit") ? "campfire" : "campfire-small");
  fire.label = () => hasPurchasedCampUpgrade("stoneFirePit") ? "Stone fire pit" : "Small camp fire";
  const shelter = overlays.find(o => o.id === "camp-shelter");
  const shelterStages = [["smallHut", "shelter-hut", "Small hut"], ["framedShelter", "shelter-framed", "Framed shelter"], ["lessCrudeShelter", "shelter-less-crude", "Improved shelter"], ["crudeLeanTo", "shelter", "Crude shelter"]];
  shelter.asset = () => home(shelterStages.find(s => hasPurchasedCampUpgrade(s[0]))?.[1] || "shelter");
  shelter.label = () => shelterStages.find(s => hasPurchasedCampUpgrade(s[0]))?.[2] || "Crude shelter";
  for (const [variant, asset, label] of [["foundation", "foundation", "Discovered foundation"], ["tower-ground-floor", "tower", "Tower construction"], ["tower-expanded", "tower-expanded", "Expanded tower"]]) {
    add(variant, "outskirts", 50, 50, art(asset), label, () => centerVariant() === variant, { camp: true });
  }
  // These illustrations identify discovered destinations without exposing interiors,
  // creatures, machinery or secondary discoveries contained in regional paintings.
  const places = [
    ["mysteriousPlants", "outskirts", 39, 40, "icon-basket-foraging"],
    ["strangeTrails", "outskirts", 61, 40, "icon-boots-travel"],
    ["creepyCave", "outskirts", 39, 62, "icon-torch"],
    ["mysteriousTrail", "outskirts", 61, 62, "icon-boots-travel"],
    ["foothillScree", "north", 46, 33, "icon-pick-stone"],
    ["minersCamp", "north", 53, 24, home("shelter")],
    ["ironMine", "north", 61, 13, "icon-pick-iron"],
    ["stagRuns", "east", 70, 48, "icon-boots-travel"],
    ["huntersCabin", "east", 80, 43, home("shelter")],
    ["quietGrove", "east", 91, 57, "icon-boots-travel"],
    ["wildHerbPatch", "south", 43, 81, "icon-basket-foraging"],
    ["alchemistsHut", "south", 50, 71, home("shelter")],
    ["overgrownFields", "south", 57, 91, "icon-basket-foraging"],
    ["roadsideRuin", "west", 30, 45, art("foundation")],
    ["silentGearworks", "west", 20, 53, art("foundation")],
    ["arcaneArchive", "west", 9, 65, art("foundation")],
  ];
  const known = (region, id) => getRegionState(region).unlocked && getRegionKnownLocations(region).includes(id);
  for (const [id, region, x, y, asset] of places) {
    add(id, region, x, y, asset.includes("/") ? asset : "assets/icons/" + asset + ".png", () => getLocationLabel(id), () => known(region, id), { id });
    add(id + "-dungeon", region, x + 5, y + 4, "assets/icons/icon-torch.png", () => getDungeon(getExpeditionLocation(id).dungeon)?.label + " entrance", () => known(region, id) && !!getExpeditionLocation(id).explored && !!getExpeditionLocation(id).dungeon, { id });
  }
  for (const region of ["north", "east", "south", "west"]) {
    const place = places.find(p => p[0] === getTowerNodeDefinition(region).locationName);
    add(region + "-node", region, place[2] - 5, place[3] + 7, "assets/expedition/northern-node.webp", () => getTowerNodeDefinition(region).label + (getTowerNodeState(region).built ? " · Built" : " · Discovered"), () => {
      const node = getTowerNodeState(region);
      return known(region, place[0]) && (node.built || node.researchUnlocked || node.activated) && (region !== "west" || (gameState.archiveDoorOpened && getExpeditionLocation(place[0]).explored));
    }, { id: place[0] });
  }
  const sprites = { mysteriousPlants: 0, strangeTrails: 1, creepyCave: 2, mysteriousTrail: 1, foothillScree: 4, minersCamp: 3, ironMine: 5, stagRuns: 1, huntersCabin: 6, quietGrove: 7, wildHerbPatch: 8, alchemistsHut: 9, overgrownFields: 10, roadsideRuin: 11, silentGearworks: 12, arcaneArchive: 13 };
  for (const overlay of overlays) {
    if (Object.hasOwn(sprites, overlay.id)) {
      overlay.asset = art("landmarks"); overlay.sprite = sprites[overlay.id];
    }
  }
  add("western-condenser", "west", 29, 55, art("landmarks"), "Mana Condenser", () => known("west", "roadsideRuin") && hasPurchasedCampUpgrade("manaCondenser"), { id: "roadsideRuin" });
  overlays.at(-1).sprite = 14;
  add("north-elemental", "north", 69, 15, art("landmarks"), "Earth Elemental encounter", () => known("north", "ironMine") && !!gameState.northernDisturbance?.resolved, { id: "ironMine" });
  overlays.at(-1).sprite = 15;
  add("glass-antler-stag", "east", 86, 66, art("stag"), "Glass-Antler Stag", () => known("east", "quietGrove") && !!getExpeditionLocation("quietGrove").explored, { id: "quietGrove" });
  return { regions, overlays, centerVariant, base: art("parchment"), label: overlay => typeof overlay.label === "function" ? overlay.label() : overlay.label, asset: overlay => typeof overlay.asset === "function" ? overlay.asset() : overlay.asset };
})();
