require('./overhaul-harness')(`
  updatePlacePanel = function() {};
  updateAllActionButtons = function() {};
  updateCraftingButtons = function() {};
  const node = getDungeon('roadsideRuinDepths').nodes.crackedHall;
  const resetNode = function () {
    node.explored = true;
    node.rewardClaimed = false;
    delete node.pendingReward;
    gameState.expedition.carriedItems = {};
    gameState.expedition.carryCapacity = 5;
  };

  // A full pack keeps every carried reward attached to the searched room.
  resetNode();
  node.explored = false;
  gameState.expedition.carriedItems = { wood: 5 };
  const originalRandom = Math.random;
  Math.random = function () { return 0; };
  completeDungeonRoomSearch('roadsideRuinDepths', 'crackedHall');
  Math.random = originalRandom;
  assert((gameState.expedition.carriedItems.manaCrystal || 0) === 0, 'full pack receives no crystal');
  assert(node.explored && !node.rewardClaimed && node.pendingReward.carried.manaCrystal === 1, 'full-pack searched reward remains on its node');

  // The exact amount that fits is collected; the rest remains pending.
  resetNode();
  node.search.reward.carried.manaCrystal = 2;
  gameState.expedition.carriedItems = { wood: 4 };
  claimDungeonNodeReward(node);
  assert(gameState.expedition.carriedItems.manaCrystal === 2, 'partial space carries the fitting crystals');
  assert(node.rewardClaimed && !node.pendingReward, 'a fully fitting reward is immediately claimed');

  // Use a three-crystal reward to exercise a real fractional-capacity remainder.
  resetNode();
  node.search.reward.carried.manaCrystal = 3;
  gameState.expedition.carriedItems = { wood: 4 };
  claimDungeonNodeReward(node);
  assert(gameState.expedition.carriedItems.manaCrystal === 2, 'partial space takes only two crystals');
  assert(node.pendingReward.carried.manaCrystal === 1, 'one crystal remains on the room');
  const pendingSave = createSaveData();
  applyDungeonSaveData(pendingSave.dungeons);
  assert(node.pendingReward.carried.manaCrystal === 1, 'pending loot survives reload before collection');
  gameState.expedition.carriedItems = {};
  claimDungeonNodeReward(node);
  assert(gameState.expedition.carriedItems.manaCrystal === 1 && node.rewardClaimed && !node.pendingReward, 'later collection takes only the retained remainder without a new roll');
  const claimedSave = createSaveData();
  applyDungeonSaveData(claimedSave.dungeons);
  claimDungeonNodeReward(node);
  assert(gameState.expedition.carriedItems.manaCrystal === 1, 'reload after collection cannot duplicate loot');

  // Legacy fully claimed rooms stay claimed and never gain pending loot during migration/load.
  resetNode();
  const legacySave = createSaveData();
  legacySave.version = 37;
  legacySave.dungeons.roadsideRuinDepths.nodes.crackedHall = { rewardClaimed: true, explored: true };
  const migrated = migrateSaveData(legacySave);
  applyDungeonSaveData(migrated.dungeons);
  assert(node.rewardClaimed && !node.pendingReward, 'legacy claimed reward remains fully claimed');
  claimDungeonNodeReward(node);
  assert((gameState.expedition.carriedItems.manaCrystal || 0) === 0, 'legacy claimed reward is not duplicated');
  console.log('Dungeon reward capacity checks passed:', passed);
`);
