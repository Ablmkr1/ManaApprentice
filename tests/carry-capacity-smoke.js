require('./overhaul-harness')(`
  const equipment = ensureEquipmentCollection();
  equipment.equipped.pack = null;
  gameState.expedition.carryCapacity = 0;
  gameState.expedition.carriedItems = {};
  assert(getEffectiveCarryCapacity() === 5, 'an unequipped player retains five carry capacity');
  assert(hasCarrySpace('wood', 5), 'base capacity carries five wood');
  assert(!hasCarrySpace('wood', 6), 'base capacity does not exceed five wood');
  gameState.expedition.carriedItems = { wood: 5 };
  assert(equipmentFitReason({ ...equipment.equipped, pack: null }) === '', 'five carried items do not prevent unequipping a pack');
  console.log('Carry capacity checks passed:', passed);
`);
