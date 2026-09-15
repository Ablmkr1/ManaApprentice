// Wearable ownership, recipes, gates and stacking are centralized here. Tools retain
// their established purchase/charge system. A timed operation reserves its target,
// validates again on completion, then pays and mutates in one synchronous commit.
const WEARABLE_SLOTS = ["chest", "legs", "feet", "pack", "belt"];
const EQUIPMENT_MESSAGES = {
  duplicate: "You see no reason to make another with the same enchantment.",
  blank: "You already have a piece ready to enchant.",
  full: "You see no reason to make more of this gear at this time.",
  rings: "You can equip no more than two identical rings. You see no reason to make another.",
};
const ENCHANTMENTS = {
  reservoirWeave: { slot: "chest", label: "Reservoir Weave", standard: { maxManaFlat: 10 }, greater: { maxManaFlat: 40 } },
  wardweave: { slot: "chest", label: "Wardweave", standard: { maxWardFlat: 10 }, greater: { maxWardFlat: 25 } },
  meditativeWeave: { slot: "legs", label: "Meditative Weave", standard: { meditationMultiplier: 1.25 }, greater: { meditationMultiplier: 1.5 } },
  resistingWeave: { slot: "legs", label: "Resisting Weave", standard: { basicDamageMultiplier: 0.9 }, greater: { basicDamageMultiplier: 0.8 } },
  swiftstep: { slot: "feet", label: "Swiftstep Binding", standard: { travelDistanceFlat: 0.5 }, greater: { travelDistanceFlat: 1 } },
  wayfarer: { slot: "feet", label: "Wayfarer Binding", standard: { travelEnergyMultiplier: 0.9 }, greater: { travelEnergyMultiplier: 0.8 } },
  expansive: { slot: "pack", label: "Expansive Weave", standard: { carryCapacityFlat: 15 }, greater: { carryCapacityFlat: 35 } },
  recall: { slot: "pack", label: "Recall Weave", standard: { inventoryRecallMultiplier: 0.75 }, greater: { inventoryRecallMultiplier: 0 } },
  potency: { slot: "belt", label: "Alchemical Potency", standard: { tonicMultiplier: 1.2 }, greater: { tonicMultiplier: 1.4 } },
  wardingClasp: { slot: "belt", label: "Warding Clasp", standard: { tonicWardFlat: 5 }, greater: { tonicWardFlat: 12 } },
  coreguard: { slot: "chest", label: "Northern Coreguard", region: "north", standard: { wardDamageMultiplier: 0.8 } },
  verdant: { slot: "legs", label: "Southern Verdant Renewal", region: "south", standard: { verdantRestCharge: 1 } },
  easternTrail: { slot: "feet", label: "Eastern Trailweave", region: "east", standard: { travelDistanceFlat: 0.5, travelEnergyMultiplier: 0.9 } },
  archivist: { slot: "pack", label: "Archivist’s Weave", region: "west", standard: { automaticSense: 1 } },
  fieldBrewer: { slot: "belt", label: "Southern Field Brewer’s Clasp", region: "south", standard: { freeExpeditionTonic: 1 } },
};
const RING_RUNES = {
  earth: { label: "Earth Rune", region: "north", effects: { lanceDamageBonus: 0.1 } },
  hunter: { label: "Hunter’s Rune", region: "east", effects: { missileSpeedBonus: 0.1 } },
  verdant: { label: "Verdant Rune", region: "south", effects: { boltWardFlat: 1 } },
  archive: { label: "Archive Rune", region: "west", effects: { manualSenseBonus: 1 } },
};
const EQUIPMENT_COSTS = {
  standard: { fiber: 12, leather: 4, manaCrystal: 2, mana: 15 },
  greater: { fiber: 20, leather: 6, manaCrystal: 5, chargedCrystal: 2, mana: 20 },
  regional: { manaCrystal: 4, chargedCrystal: 2, mana: 20 },
  rune: { manaCrystal: 2, mana: 15 },
  regionalMaterials: { north: { earthElementalCore: 1, stone: 20 }, east: { runedLeather: 2, leather: 6 }, south: { naturalEssence: 2, glimmerleaf: 6 }, west: { manaCrystal: 6, chargedCrystal: 2 } },
  ringMana: { ironRing: 1, manaCrystal: 2, mana: 10 },
  ringWarding: { ironRing: 1, manaCrystal: 3, stone: 10, mana: 12 },
  ringGreater: { manaCrystal: 5, chargedCrystal: 2, mana: 20 },
  mundaneSalvage: ["wood", "stone", "iron", "nails", "fiber", "leather", "pelt"],
};
const EQUIPMENT_EFFECT_LABELS = {
  explorationEnergyReduction: ["Explore Energy reduction", "flat"], carryCapacity: ["base carrying capacity", "flat"],
  tonicSlots: ["tonic slots", "flat"],
  maxManaFlat: ["maximum Mana", "flat"], maxWardFlat: ["maximum Ward", "flat"],
  carryCapacityFlat: ["capacity", "flat"], travelDistanceFlat: ["distance per step", "flat"],
  meditationMultiplier: ["Meditation / Bedroom mana", "multiplier"], basicDamageMultiplier: ["basic damage received", "multiplier"],
  wardDamageMultiplier: ["all Ward damage received", "multiplier"], travelEnergyMultiplier: ["travel Energy", "multiplier"],
  inventoryRecallMultiplier: ["inventory Recall mana", "multiplier"], tonicMultiplier: ["tonic payload", "multiplier"],
  tonicWardFlat: ["Ward per combat tonic", "flat"], lanceDamageBonus: ["Lance health / shell damage", "percent"],
  missileSpeedBonus: ["Missile casting speed", "percent"], boltWardFlat: ["Ward per damaging Bolt", "flat"],
  automaticSense: ["free Sense on first unexplored room entry", "flat"], manualSenseBonus: ["bonus Sense on first manual room cast", "flat"],
  verdantRestCharge: ["rest-prepared charge: +15 Ward when crossing 50% (nonlethal)", "flat"],
  freeExpeditionTonic: ["first tonic free per expedition", "flat"], wardRestoreMultiplier: ["Ward restoration (legacy)", "multiplier"],
};

function isWearableGear(id) { return WEARABLE_SLOTS.includes(getGearUpgrade(id)?.slot) && getGearUpgrade(id)?.equipmentType === "gear"; }
function newEquipmentCollection() { return { version: 1, nextId: 1, items: [], equipped: {}, triggers: { verdantItemId: null, expeditionTonicUsed: false, rooms: {} } }; }
function ensureEquipmentCollection() {
  if (!gameState.equipment) gameState.equipment = newEquipmentCollection();
  return gameState.equipment;
}
function ownedEquipment(id) { return ensureEquipmentCollection().items.find(item => item.id === id) || null; }
function equippedItems() { const c = ensureEquipmentCollection(); return Object.values(c.equipped).map(ownedEquipment).filter(Boolean); }
function equipmentSlot(item) { return item.core ? "ring" : getGearUpgrade(item.baseGearId)?.slot; }
function isItemEquipped(id) { return Object.values(ensureEquipmentCollection().equipped).includes(id); }
function itemEffects(item) {
  if (!item) return {};
  if (item.core) return { [item.core === "mana" ? "maxManaFlat" : "maxWardFlat"]: item.grade === "greater" ? 25 : 10, ...(RING_RUNES[item.rune]?.effects || {}) };
  return item.legacyEffects || ENCHANTMENTS[item.family]?.[item.grade || "standard"] || {};
}
function equipmentName(item) {
  if (!item) return "Empty";
  if (item.name) return item.name;
  if (item.core) return (item.grade === "greater" ? "Greater " : "") + "Ring of " + (item.core === "mana" ? "Mana" : "Warding") + (item.rune ? " · " + RING_RUNES[item.rune].label : "");
  const base = getGearUpgrade(item.baseGearId);
  return (base?.displayName || base?.label || item.baseGearId) + (item.family ? " · " + (item.grade === "greater" ? "Greater " : "") + (ENCHANTMENTS[item.family]?.label || item.legacyLabel || item.family) : " · Unenchanted");
}
function describeEquipmentEffects(effects) {
  return Object.entries(effects).map(([key, value]) => {
    const [label, type] = EQUIPMENT_EFFECT_LABELS[key] || [key, "flat"];
    return label + " " + (type === "multiplier" ? "×" + value : type === "percent" ? "+" + Math.round(value * 100) + "%" : "+" + value);
  }).join(" · ");
}
function regionalEquipmentUnlocked(region) {
  return region === "west" ? !!gameState.brokenWardenDefeated && !!gameState.archiveDoorOpened : !!getTowerNodeState(region)?.built;
}
function enchantmentGate(grade = "standard", region = null) {
  const level = region ? 9 : grade === "greater" ? 6 : 4;
  if (!isTowerRoomCompleted("enchantingStudy")) return "Requires functional Enchanting Study.";
  if ((grade === "greater" || region) && !isTowerRoomUpgraded("enchantingStudy")) return "Requires Grand Enchanting Study.";
  if (getImbueRank() < 2 || getImbueRankTwoLevel() < level) return "Requires Imbue Rank II level " + level + ".";
  if (region && !regionalEquipmentUnlocked(region)) return region === "west" ? "Requires Broken Warden victory and Archive door discovery." : "Requires built " + region + " Node.";
  return "";
}
function availableFamilies(baseGearId) { return Object.keys(ENCHANTMENTS).filter(id => ENCHANTMENTS[id].slot === getGearUpgrade(baseGearId)?.slot && !enchantmentGate("standard", ENCHANTMENTS[id].region)); }
function validateVariant(candidate, excludeId = null) {
  const items = ensureEquipmentCollection().items.filter(i => i.id !== excludeId);
  if (candidate.core) return items.filter(i => i.core === candidate.core && (i.rune || null) === (candidate.rune || null)).length >= 2 ? EQUIPMENT_MESSAGES.rings : "";
  return items.some(i => i.baseGearId === candidate.baseGearId && (i.family || null) === (candidate.family || null)) ? (candidate.family ? EQUIPMENT_MESSAGES.duplicate : EQUIPMENT_MESSAGES.blank) : "";
}
function gearCraftReason(baseGearId, predecessorId = null, ignoreReservation = false) {
  const c = ensureEquipmentCollection();
  if (!ignoreReservation && gameState.activity?.active && gameState.activity.kind === "equipment") return "Another equipment operation is in progress.";
  const predecessor = predecessorId ? ownedEquipment(predecessorId) : null;
  if (predecessorId && (!predecessor || predecessor.baseGearId !== getGearUpgrade(baseGearId)?.requiredGear)) return "Select the required predecessor item.";
  const candidate = { ...predecessor, baseGearId };
  const duplicate = validateVariant(candidate, predecessorId);
  if (duplicate) return duplicate;
  const existing = c.items.filter(i => i.baseGearId === baseGearId);
  if (existing.length && !predecessor?.family && !availableFamilies(baseGearId).some(f => !existing.some(i => i.family === f))) return EQUIPMENT_MESSAGES.full;
  return "";
}
function equipmentChangeReason() {
  if (typeof isCombatActive === "function" && isCombatActive()) return "Equipment cannot change during combat.";
  if (isActivityActive()) return "Finish or cancel the current action first.";
  return "";
}
function equipmentFitReason(equipped) {
  const items = Object.values(equipped).map(ownedEquipment).filter(Boolean);
  const pack = items.find(i => equipmentSlot(i) === "pack");
  const capacity = Math.max(
    typeof BASE_CARRY_CAPACITY === "number" ? BASE_CARRY_CAPACITY : 5,
    (getGearUpgrade(pack?.baseGearId)?.effects?.carryCapacity || 0) +
      items.reduce((n, i) => n + (itemEffects(i).carryCapacityFlat || 0), 0) +
      getActiveAttunementEffectTotal("carryCapacityFlat")
  );
  if (getCarriedTotal() > capacity) return "Unload carried inventory before reducing capacity.";
  const belt = items.find(i => equipmentSlot(i) === "belt");
  const slots = getGearUpgrade(belt?.baseGearId)?.effects?.tonicSlots || 0;
  if (getTonicSlots().filter(Boolean).length > slots) return "Unload tonic slots before changing this belt.";
  return "";
}
function equipOwnedItem(id, slot) {
  const c = ensureEquipmentCollection(), item = ownedEquipment(id);
  if (equipmentChangeReason()) return false;
  if (id && (!item || (equipmentSlot(item) === "ring" ? !["leftRing", "rightRing"].includes(slot) : equipmentSlot(item) !== slot))) return false;
  if (id && Object.entries(c.equipped).some(([s, value]) => s !== slot && value === id)) return false;
  const next = { ...c.equipped, [slot]: id || null };
  const reason = equipmentFitReason(next);
  if (reason) { announceUiStatus(reason); return false; }
  c.equipped = next;
  refreshEquipmentCollection();
  trySaveGame();
  return true;
}
function syncEquippedBaseStats() {
  const c = ensureEquipmentCollection();
  const pack = ownedEquipment(c.equipped.pack), belt = ownedEquipment(c.equipped.belt);
  gameState.expedition.carryCapacity = getGearUpgrade(pack?.baseGearId)?.effects?.carryCapacity || 0;
  const count = getGearUpgrade(belt?.baseGearId)?.effects?.tonicSlots || 0;
  const filled = getTonicSlots().filter(Boolean);
  // Validation prevents overflow. Keep occupied slots in place whenever possible.
  const slots = getTonicSlots();
  if (slots.length > count) gameState.expedition.tonicSlots = filled.concat(Array(Math.max(0, count - filled.length)).fill(null));
  else while (slots.length < count) slots.push(null);
}
function refreshEquipmentCollection() {
  syncEquippedBaseStats(); recalculateCharacterStats(); updateEquipmentSlotUI();
  checkResearchDiscoveries();
  if (typeof renderTowerDetailPanel === "function" && ui.projectList) renderTowerDetailPanel();
  refreshExpeditionUI(); updateCraftingButtons();
}
function operationCandidate(op) {
  const item = ownedEquipment(op.itemId);
  if (op.type === "craft") return { ...(ownedEquipment(op.predecessorId) || {}), baseGearId: op.baseGearId };
  if (op.type === "ring") return { core: op.core, grade: "standard", rune: null };
  if (!item) return null;
  if (op.type === "enchant") return { ...item, family: op.family, grade: "standard" };
  if (op.type === "greater") return { ...item, grade: "greater" };
  if (op.type === "rune") return { ...item, rune: op.rune };
  return item;
}
function equipmentOperationCost(op) {
  const item = ownedEquipment(op.itemId);
  if (op.type === "craft") return getGearUpgrade(op.baseGearId)?.cost || {};
  if (op.type === "ring") return EQUIPMENT_COSTS[op.core === "mana" ? "ringMana" : "ringWarding"];
  if (op.type === "greater") return item?.core ? EQUIPMENT_COSTS.ringGreater : EQUIPMENT_COSTS.greater;
  if (op.type === "enchant") { const region = ENCHANTMENTS[op.family]?.region; return region ? { ...EQUIPMENT_COSTS.regional, ...EQUIPMENT_COSTS.regionalMaterials[region] } : EQUIPMENT_COSTS.standard; }
  if (op.type === "rune") return { ...EQUIPMENT_COSTS.rune, ...EQUIPMENT_COSTS.regionalMaterials[RING_RUNES[op.rune]?.region] };
  return {};
}
function equipmentOperationReason(op, completing = false) {
  if (!completing && equipmentChangeReason()) return equipmentChangeReason();
  if (!isCampCraftingContext()) return "Return to the Tower to work on equipment.";
  const item = ownedEquipment(op.itemId), candidate = operationCandidate(op);
  if (!candidate) return "Select an owned item.";
  if (op.type === "craft") {
    const base = getGearUpgrade(op.baseGearId);
    if (!isWearableGear(op.baseGearId) || (!base.unlocked && !base.purchased) || !getActiveCraftContext(base)) return "Base gear recipe unavailable.";
    if (base.requiredGear && !op.predecessorId) return "Select the required predecessor item.";
    return gearCraftReason(op.baseGearId, op.predecessorId, completing);
  }
  if (op.type === "salvage") {
    if (!op.confirmed) return "Confirm salvage.";
    if (isItemEquipped(item.id)) return "Unequip this item before salvaging.";
    return item.family || item.core ? (isTowerRoomUpgraded("enchantingStudy") ? "" : "Requires Grand Enchanting Study.") : (isTowerRoomUpgraded("workshop") ? "" : "Requires Master Workshop.");
  }
  if (!["ring", "enchant", "greater", "rune"].includes(op.type)) return "Unknown equipment operation.";
  if (gameState.tower?.selectedId !== "room:enchantingStudy") return "Select the Enchanting Study.";
  let region = null;
  if (op.type === "ring" && !["mana", "warding"].includes(op.core)) return "Choose Mana or Warding.";
  if (op.type === "enchant") {
    const def = ENCHANTMENTS[op.family];
    if (!def || def.slot !== equipmentSlot(item) || item.core) return "This enchantment does not fit this item.";
    if (item.family) return "Binding is permanent. Craft another piece for a different family.";
    region = def.region;
  }
  if (op.type === "greater" && (item.grade === "greater" || (!item.core && !ENCHANTMENTS[item.family]?.greater))) return "Select a standard item with a greater upgrade.";
  if (op.type === "rune") {
    if (!item.core || item.rune || !RING_RUNES[op.rune]) return "Select a ring without a rune. Runes cannot be overwritten.";
    region = RING_RUNES[op.rune].region;
  }
  return enchantmentGate(op.type === "greater" ? "greater" : "standard", region) || validateVariant(candidate, item?.id);
}
function startEquipmentOperation(op) {
  const reason = equipmentOperationReason(op);
  if (reason) { announceUiStatus(reason); return false; }
  if (!canAffordCost(equipmentOperationCost(op))) return false;
  const c = ensureEquipmentCollection();
  const reserved = { ...structuredClone(op), transactionId: "operation-" + c.nextId++ };
  c.pending = reserved;
  if (!startActivity({ kind: "equipment", id: op.type, duration: op.type === "craft" ? getCraftDuration("gearUpgrade", op.baseGearId) : 3, context: reserved })) { c.pending = null; return false; }
  updateCraftingButtons();
  updateAllActionButtons();
  return true;
}
function autoEquipCompletedEquipment(item) {
  if (!item) return;

  const c = ensureEquipmentCollection();
  const itemSlot = equipmentSlot(item);
  let slot = itemSlot;

  if (itemSlot === "ring") {
    if (Object.values(c.equipped).includes(item.id)) return;
    slot = !c.equipped.leftRing ? "leftRing" : !c.equipped.rightRing ? "rightRing" : "leftRing";
  }

  const next = { ...c.equipped, [slot]: item.id };
  if (!equipmentFitReason(next)) c.equipped = next;
}
function completeEquipmentOperation(op) {
  const reservation = ensureEquipmentCollection().pending;
  if (!reservation || reservation.transactionId !== op?.transactionId || JSON.stringify(reservation) !== JSON.stringify(op)) return false;
  const reason = equipmentOperationReason(op, true);
  if (reason) { announceUiStatus(reason); return false; }
  const c = ensureEquipmentCollection(), item = ownedEquipment(op.itemId), candidate = operationCandidate(op);
  const cost = equipmentOperationCost(op);
  if (!canAffordCost(cost)) return false;
  if (op.type === "salvage") {
    const refund = equipmentSalvageRefund(item);
    if (Object.entries(refund).some(([id, amount]) => getResource(id).value + amount > getResource(id).maxValue)) return false;
    c.pending = null;
    c.items = c.items.filter(i => i.id !== item.id);
    Object.entries(refund).forEach(([id, amount]) => addResource(id, amount));
    syncGearOwnershipFlags(); return true;
  }
  c.pending = null;
  if (!spendCost(cost)) return false;
  let completedItem;
  if (op.type === "craft" && op.predecessorId) {
    completedItem = ownedEquipment(op.predecessorId);
    Object.assign(completedItem, candidate);
  } else if (item) {
    completedItem = item;
    Object.assign(completedItem, candidate);
  }
  else {
    candidate.id = "gear-" + c.nextId++;
    candidate.family = candidate.family || null;
    candidate.grade = candidate.grade || "standard";
    c.items.push(candidate);
    completedItem = candidate;
  }
  autoEquipCompletedEquipment(completedItem);
  syncGearOwnershipFlags();
  if (op.type !== "craft" && cost.mana) { recordImbueExperience(cost.mana); recordManaControl(cost.mana, "Equipment enchantment"); }
  return true;
}
function syncGearOwnershipFlags() {
  Object.keys(getGearUpgradeDefinitions()).filter(isWearableGear).forEach(id => {
    const base = getGearUpgrade(id), owned = ensureEquipmentCollection().items.some(i => i.baseGearId === id);
    if (base.purchased) base.unlocked = true;
    base.purchased = owned;
    if (owned) base.unlocked = true;
  });
}
function equipmentSalvageRefund(item) {
  const cost = item.core ? { iron: 2 } : getGearUpgrade(item.baseGearId)?.cost || {};
  return Object.fromEntries(Object.entries(cost).filter(([id, amount]) => EQUIPMENT_COSTS.mundaneSalvage.includes(id) && Math.floor(amount / 2) > 0).map(([id, amount]) => [id, Math.floor(amount / 2)]));
}

function isBedroomRestContext() { return isCampCraftingContext() && isTowerRoomCompleted("bedroom") && gameState.tower?.selectedId === "room:bedroom"; }
function needsExplicitRest(bedroom = isBedroomRestContext()) {
  return getResource("energy").value < getResource("energy").maxValue || (bedroom && isTowerRoomUpgraded("bedroom") && getResource("mana").value < getResource("mana").maxValue);
}
function completeExplicitRest(activity) {
  const bedroom = !!activity.context?.bedroom;
  const multiplier = isTowerRoomCompleted("bedroom") ? 1.25 : 1;
  const base = getResource("energy").restPerSecond / multiplier;
  addResource("energy", base * (bedroom ? multiplier : 1) * (bedroom && isTowerRoomUpgraded("bedroom") ? TOWER_ROOM_STAGES.bedroom.seconds : 1));
  if (bedroom && isTowerRoomUpgraded("bedroom")) addResource("mana", TOWER_ROOM_STAGES.bedroom.mana * getEquippedPermanentImbueEffectMultiplier("meditationMultiplier"));
  const legs = ownedEquipment(ensureEquipmentCollection().equipped.legs);
  if (bedroom && itemEffects(legs).verdantRestCharge) ensureEquipmentCollection().triggers.verdantItemId = legs.id;
}
function startLibraryStudy() {
  if (!isCampCraftingContext() || !isTowerRoomCompleted("library") || gameState.tower?.selectedId !== "room:library" || isActivityActive() || getResource("focus").value >= getResource("focus").maxValue) return false;
  if (!spendCost({ energy: TOWER_ROOM_STAGES.library.energy })) return false;
  return startActivity({ kind: "study", id: "study", duration: TOWER_ROOM_STAGES.library.seconds });
}
function equipmentRoomFlags(dungeonId, nodeId) {
  const rooms = ensureEquipmentCollection().triggers.rooms;
  return rooms[dungeonId + ":" + nodeId] ||= {};
}
function applyAutomaticEquipmentSense() {
  const d = getCurrentDungeonState(), node = getCurrentDungeonNode();
  if (!d?.active || !node?.search || node.explored) return;
  const flags = equipmentRoomFlags(d.dungeonId, d.nodeId);
  if (flags.entered) return;
  flags.entered = true;
  if (getEquippedPermanentImbueEffectTotal("automaticSense") && addManaSenseDungeonChargeForNode(d.dungeonId, d.nodeId)) {
    recordManaSenseExperience(getSpell("manaSense").cost.mana);
  }
}
function applyManualEquipmentSense(dungeonId, nodeId) {
  const flags = equipmentRoomFlags(dungeonId, nodeId);
  if (flags.manual) return;
  flags.manual = true;
  for (let i = 0; i < getEquippedPermanentImbueEffectTotal("manualSenseBonus"); i++) {
    if (addManaSenseDungeonChargeForNode(dungeonId, nodeId)) recordManaSenseExperience(getSpell("manaSense").cost.mana);
  }
}

function migrateTowerEquipmentSave(save) {
  const g = save.gameState;
  if (g.equipment?.version === 1) return;
  const c = newEquipmentCollection(), legacy = g.magic.imbuement || {};
  const add = item => { item.id = "gear-" + c.nextId++; c.items.push(item); return item; };
  Object.entries(save.gearUpgrades || {}).forEach(([baseGearId, saved]) => {
    if (!saved.purchased || !isWearableGear(baseGearId)) return;
    const family = legacy.equipmentEnchantments?.[baseGearId];
    const item = add({ baseGearId, family: family || null, grade: "standard" });
    if (family && !["swiftstep", "reservoirWeave"].includes(family)) {
      const old = getImbueRankTwoConfig().equipmentEnchantments[family];
      item.family = "legacy:" + family;
      item.legacyLabel = "Legacy " + (old?.label || family);
      item.legacyEffects = structuredClone(old?.effects || {});
    }
    const slot = equipmentSlot(item), previous = c.items.find(i => i.id === c.equipped[slot]);
    if (!previous || getGearUpgrade(baseGearId).slotRank > getGearUpgrade(previous.baseGearId).slotRank) c.equipped[slot] = item.id;
  });
  // Preserve orphaned unsupported legacy patterns as stored records, never delete.
  Object.entries(legacy.equipmentEnchantments || {}).forEach(([baseGearId, family]) => {
    if (c.items.some(i => i.baseGearId === baseGearId)) return;
    const old = getImbueRankTwoConfig().equipmentEnchantments[family];
    add({ baseGearId, family: "legacy:" + family, grade: "standard", legacyLabel: "Legacy " + (old?.label || family), legacyEffects: structuredClone(old?.effects || {}) });
  });
  Object.entries(legacy.craftedRings || {}).forEach(([ringId, owned]) => {
    if (!owned) return;
    const item = add({ core: ringId.toLowerCase().includes("warding") ? "warding" : "mana", grade: ringId.startsWith("greater") ? "greater" : "standard", rune: null });
    if (ringId === legacy.equippedRing) c.equipped.leftRing = item.id;
  });
  if (legacy.backpackImbued) {
    let pack = c.items.find(i => i.id === c.equipped.pack);
    if (!pack) pack = add({ baseGearId: "repairedLeatherBackpack", grade: "standard" });
    if (pack.family) pack = add({ baseGearId: pack.baseGearId, grade: "standard" });
    pack.family = "expansive";
    c.equipped.pack = pack.id;
  }
  c.migrationNotice = "Legacy rooms retain their full investment. Restoring Weave, Stoneward, Verdant and old Trailweave retain their original effects as named legacy variants; they cannot be overwritten. Backpack Imbue is now an equipped Expansive pack. No second ring was granted.";
  g.equipment = c;
  legacy.backpackImbued = false;
  legacy.equipmentEnchantments = {};
  legacy.craftedRings = Object.fromEntries(Object.keys(getImbueRankTwoConfig().rings).map(id => [id, false]));
  legacy.equippedRing = null;
  Object.values(getTowerRoomDefinitions()).forEach(room => {
    const p = g.projects?.[room.projectId];
    if (!p) return;
    if (p.completed) { p.level = 2; return; }
    const basic = getProjectDefinition(room.projectId).levels[0];
    const paid = p.deposits || {};
    const basicPaid = {}, upgradePaid = {};
    Object.entries(paid).forEach(([id, amount]) => {
      basicPaid[id] = Math.min(amount, basic.materials[id] || 0);
      if (amount > basicPaid[id]) upgradePaid[id] = amount - basicPaid[id];
    });
    const paidWork = p.work || 0;
    p.deposits = basicPaid;
    p.work = Math.min(paidWork, basic.workRequired);
    p.upgradeCredit = { deposits: upgradePaid, work: Math.max(0, paidWork - basic.workRequired) };
    if (p.work >= basic.workRequired && Object.entries(basic.materials).every(([id, n]) => basicPaid[id] >= n)) {
      p.level = 1;
      p.deposits = upgradePaid;
      p.work = p.upgradeCredit.work;
      delete p.upgradeCredit;
    }
  });
  if (save.resources?.mana) save.resources.mana.perSecond = 0;
  // Old activities paid up front. Refund a canceled legacy wearable binding once;
  // preserve the exact uncapped paid amounts rather than silently dropping them.
  const a = g.activity;
  if (a?.active && ((a.kind === "craft" && a.type === "gearUpgrade" && isWearableGear(a.id)) || (a.kind === "spell" && a.id === "imbue" && a.context?.targetId))) {
    const def = a.kind === "craft" ? getGearUpgrade(a.id) : getImbueDefinition(a.context.targetId);
    if (a.kind === "craft" || ["ring", "equipment", "backpack"].includes(def?.permanentAction?.type)) {
      Object.entries(def?.cost || {}).forEach(([id, n]) => { if (save.resources[id]) save.resources[id].value += n; });
      g.activity = { active: false };
    }
  }
}

function equipmentView(item, slot) {
  const base = item?.core ? getImbueRingDefinition((item.grade === "greater" ? "greaterRingOf" : "ringOf") + (item.core === "mana" ? "Mana" : "Warding")) : getGearUpgrade(item?.baseGearId);
  const slotLabel = slot === "leftRing" ? "Left Ring" : slot === "rightRing" ? "Right Ring" : base?.slotLabel || slot.charAt(0).toUpperCase() + slot.slice(1);
  const fallback = slot.endsWith("Ring") ? emptyImbueRingSlot : Object.values(getGearUpgradeDefinitions()).find(gear => gear.slot === slot) || {};
  return { ...(base || fallback), slot, slotLabel,
    instanceId: item?.id, baseGearId: item?.baseGearId, displayName: item ? equipmentName(item) : slotLabel + " · Empty",
    label: item ? equipmentName(item) : "Empty", effects: item?.core ? {} : base?.effects || {}, collectionItem: true };
}
function getCollectionEquipmentSlots(includeRings = true) {
  const c = ensureEquipmentCollection();
  return [...WEARABLE_SLOTS, ...(includeRings && (getImbueRank() >= 2 || c.items.some(i => i.core)) ? ["leftRing", "rightRing"] : [])].filter(slot => c.equipped[slot] || slot.endsWith("Ring") || c.items.some(i => equipmentSlot(i) === slot)).map((slot, order) => ({ label: slot, order, current: equipmentView(ownedEquipment(c.equipped[slot]), slot) }));
}

function appendEquipmentCollectionUI(container, selectedSlot) {
  const c = ensureEquipmentCollection();
  const slot = selectedSlot.endsWith("Ring") ? "ring" : selectedSlot;
  if (!WEARABLE_SLOTS.includes(slot) && slot !== "ring") return;
  const section = document.createElement("div"); section.className = "equipment-collection";
  const select = document.createElement("select"); select.setAttribute("aria-label", "Owned " + selectedSlot + " collection");
  const items = c.items.filter(i => equipmentSlot(i) === slot);
  for (const item of items) { const option = document.createElement("option"); option.value = item.id; option.textContent = equipmentName(item) + (isItemEquipped(item.id) ? " · Equipped" : " · Stored"); select.appendChild(option); }
  select.value = c.equipped[selectedSlot] || items[0]?.id || "";
  const preview = document.createElement("p"), controls = document.createElement("div");
  const render = () => {
    const item = ownedEquipment(select.value), current = ownedEquipment(c.equipped[selectedSlot]);
    preview.textContent = item ? equipmentComparison(current, item) : "No owned items.";
    controls.replaceChildren();
    const equip = document.createElement("button"); equip.textContent = "Equip"; equip.disabled = !item || isItemEquipped(item.id) || !!equipmentChangeReason(); equip.onclick = () => equipOwnedItem(item.id, selectedSlot); controls.appendChild(equip);
    if (current) { const off = document.createElement("button"); off.textContent = "Unequip"; off.disabled = !!equipmentChangeReason(); off.onclick = () => equipOwnedItem(null, selectedSlot); controls.appendChild(off); }
    // Rename and Salvage controls are intentionally hidden for now.
  };
  select.onchange = render; section.append(select, preview, controls); container.appendChild(section); render();
}
function equipmentComparison(current, candidate) {
  const baseA = getGearUpgrade(current?.baseGearId)?.effects || {}, baseB = getGearUpgrade(candidate?.baseGearId)?.effects || {};
  const a = { ...baseA, ...itemEffects(current) }, b = { ...baseB, ...itemEffects(candidate) };
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  return keys.map(key => { const defaultValue = key.endsWith("Multiplier") ? 1 : 0; return (EQUIPMENT_EFFECT_LABELS[key]?.[0] || key) + ": " + (a[key] ?? defaultValue) + " → " + (b[key] ?? defaultValue); }).join(" · ") || "No stat change.";
}
function appendEquipmentOperationButton(container, label, op) {
  const row = document.createElement("div"); row.className = "equipment-recipe-row";
  const button = document.createElement("button"), detail = document.createElement("span");
  const reason = equipmentOperationReason(op), cost = equipmentOperationCost(op);
  button.textContent = label;
  button.disabled = !!reason || !canAffordCost(cost);
  detail.textContent = [formatCost(cost), reason || (!canAffordCost(cost) ? "Missing materials or resources." : "Available"), describeEquipmentEffects(itemEffects(operationCandidate(op)))].filter(Boolean).join(" · ");
  button.onclick = () => { startEquipmentOperation(op); renderTowerDetailPanel(); };
  row.append(button, detail); container.appendChild(row);
}
function appendTowerEquipmentActions(container, roomId) {
  appendTowerBatchRecipes(container, roomId);
  if (roomId === "bedroom") {
    const button = document.createElement("button"); button.textContent = "Bedroom Rest"; button.disabled = isActivityActive() || !needsExplicitRest(true); button.onclick = () => startResting(); container.appendChild(button);
  }
  if (roomId === "library") {
    const button = document.createElement("button"); button.textContent = "Study · " + (isTowerRoomUpgraded(roomId) ? 4 : 2) + " Focus / 3s · 5 Energy"; button.disabled = isActivityActive(); button.onclick = startLibraryStudy; container.appendChild(button);
  }
  if (roomId === "workshop") {
    const note = document.createElement("p"); note.textContent = "Manage and salvage individual items in Equipment. Additional copies require a currently available missing enchantment family."; container.appendChild(note);
    Object.keys(getGearUpgradeDefinitions()).filter(id => isWearableGear(id) && (getGearUpgrade(id).unlocked || getGearUpgrade(id).purchased)).forEach(id => {
      const base = getGearUpgrade(id);
      if (!base.requiredGear) return appendEquipmentOperationButton(container, "Craft " + (base.displayName || id), { type: "craft", baseGearId: id });
      const select = document.createElement("select"); select.setAttribute("aria-label", "Predecessor for " + (base.displayName || id));
      ensureEquipmentCollection().items.filter(item => item.baseGearId === base.requiredGear).forEach(item => {
        const option = document.createElement("option"); option.value = item.id; option.textContent = equipmentName(item); select.appendChild(option);
      });
      const row = document.createElement("div");
      const render = () => { row.replaceChildren(); appendEquipmentOperationButton(row, "Craft " + (base.displayName || id), { type: "craft", baseGearId: id, predecessorId: select.value || null }); };
      select.onchange = render; container.append(select, row); render();
    });
  }
  if (roomId === "enchantingStudy") {
    if (ensureEquipmentCollection().migrationNotice) { const note = document.createElement("p"); note.textContent = ensureEquipmentCollection().migrationNotice; container.appendChild(note); }
    appendEquipmentOperationButton(container, "Bind Ring of Mana", { type: "ring", core: "mana" });
    appendEquipmentOperationButton(container, "Bind Ring of Warding", { type: "ring", core: "warding" });
    const select = document.createElement("select"); select.setAttribute("aria-label", "Item to enchant or upgrade");
    ensureEquipmentCollection().items.forEach(item => { const option = document.createElement("option"); option.value = item.id; option.textContent = equipmentName(item) + (isItemEquipped(item.id) ? " · Equipped" : " · Stored"); select.appendChild(option); });
    const list = document.createElement("div");
    const render = () => {
      list.replaceChildren(); const item = ownedEquipment(select.value); if (!item) return;
      if (item.core) {
        appendEquipmentOperationButton(list, "Upgrade to Greater (same item)", { type: "greater", itemId: item.id });
        Object.keys(RING_RUNES).forEach(rune => appendEquipmentOperationButton(list, RING_RUNES[rune].label, { type: "rune", itemId: item.id, rune }));
      } else if (item.family) appendEquipmentOperationButton(list, "Upgrade to Greater (same item)", { type: "greater", itemId: item.id });
      else Object.keys(ENCHANTMENTS).filter(f => ENCHANTMENTS[f].slot === equipmentSlot(item)).forEach(family => appendEquipmentOperationButton(list, ENCHANTMENTS[family].label, { type: "enchant", itemId: item.id, family }));
    };
    select.onchange = render; container.append(select, list); render();
  }
}

function towerBatchPlan(type, id, quantity) {
  if (!(type === "brew" ? [1, 2, 3] : [1, 5, 10]).includes(quantity) || !isCampCraftingContext()) return null;
  let def, context, duration;
  if (type === "brew") {
    if (!isTowerRoomUpgraded("alchemyRoom") || gameState.tower?.selectedId !== "room:alchemyRoom") return null;
    def = getImbueDefinition(id);
    if (!def?.producesConsumable || !["improvedStaminaTonic", "majorManaTonic"].includes(def.producesConsumable.resource)) return null;
    context = getProductionSpellTargetContext("imbue", id);
    if (!context || getSpellOptionManaCost(context.cost) > getImbueCapacity() || !areProductionSpellTargetRequirementsMet(def.requires)) return null;
    duration = (def.duration || 3) * 0.75;
  } else {
    def = getResourceCraft(id);
    context = def && getActiveCraftContext(def);
    if (!def || id === "steel" || !context || !isResourceCraftUnlockedForContext(def, context)) return null;
    const room = def.imbueInfrastructure === "alchemy" ? "alchemyRoom" : def.imbueInfrastructure === "furnace" ? "forge" : "workshop";
    if (gameState.tower?.selectedId !== "room:" + room || !isTowerRoomCompleted(room)) return null;
    if (room === "workshop" && quantity > 1 && !isTowerRoomUpgraded(room)) return null;
    if (room === "forge" && quantity > 1) return null;
    duration = getCraftDuration("resourceCraft", id);
  }
  if (!context || context.storageCost || context.carriedCost || (!context.produces && !context.producesConsumable)) return null;
  const cost = Object.fromEntries(Object.entries(context.cost || {}).map(([key, n]) => [key, n * quantity]));
  const output = context.produces || context.producesConsumable;
  const amount = output.amount * quantity;
  const fits = context.producesConsumable ? hasConsumableSpace(output.resource, amount) : getResource(output.resource).value + amount <= getResource(output.resource).maxValue;
  return { cost, output: { resource: output.resource, amount }, consumable: !!context.producesConsumable, duration: duration * quantity, fits };
}
function startTowerBatch(type, id, quantity) {
  if (equipmentChangeReason()) return false;
  const plan = towerBatchPlan(type, id, quantity);
  if (!plan?.fits || !canAffordCost(plan.cost)) return false;
  return startActivity({ kind: "towerBatch", id, duration: plan.duration, context: { type, id, quantity } });
}
function completeTowerBatch(context) {
  const plan = towerBatchPlan(context.type, context.id, context.quantity);
  if (!plan?.fits || !canAffordCost(plan.cost)) return false;
  if (!spendCost(plan.cost)) return false;
  if (plan.consumable) for (let i = 0; i < plan.output.amount; i++) addConsumableToSlot(plan.output.resource);
  else addResource(plan.output.resource, plan.output.amount);
  if (context.type === "brew") { recordImbueExperience(plan.cost.mana || 0); recordManaControl(plan.cost.mana || 0, "Tonic imbuement"); }
  return true;
}
function appendTowerBatchRecipes(container, roomId) {
  if (!["forge", "workshop", "alchemyRoom"].includes(roomId)) return;
  const recipes = Object.entries(getResourceCraftDefinitions()).filter(([id, def]) => id !== "steel" && (def.imbueInfrastructure === "alchemy" ? roomId === "alchemyRoom" : def.imbueInfrastructure === "furnace" ? roomId === "forge" : roomId === "workshop") && (def.unlocked || getActiveCraftContext(def)?.mode === "towerRoom"));
  for (const [id, def] of recipes) appendTowerBatchRow(container, "resource", id, def.label, roomId);
  if (roomId === "alchemyRoom") for (const id of ["improvedStaminaTonic", "majorManaTonic"]) {
    const target = Object.entries(getImbueDefinitions()).find(([, d]) => d.producesConsumable?.resource === id);
    if (target) appendTowerBatchRow(container, "brew", target[0], target[1].label, roomId);
  }
}
function appendTowerBatchRow(container, type, id, label, roomId) {
  const row = document.createElement("div"); row.className = "equipment-recipe-row";
  const title = document.createElement("span"); title.textContent = label; row.appendChild(title);
  for (const n of roomId === "forge" ? [1] : type === "brew" ? [1, 2, 3] : [1, 5, 10]) {
    const plan = towerBatchPlan(type, id, n), button = document.createElement("button");
    button.textContent = "×" + n;
    button.title = plan ? formatCost(plan.cost) + " · " + plan.duration + "s" : type === "brew" ? "Requires Grand Alchemy Laboratory and the tonic’s Imbue level" : "Requires Master Workshop for batches";
    button.disabled = !plan?.fits || !!equipmentChangeReason() || !canAffordCost(plan.cost);
    button.onclick = () => startTowerBatch(type, id, n); row.appendChild(button);
  }
  container.appendChild(row);
}
