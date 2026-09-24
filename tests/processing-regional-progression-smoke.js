const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const stubs = fs.readFileSync(path.join(__dirname, 'steelworking-smoke.js'), 'utf8').split('const browserStubs = `')[1].split('`;')[0];
const files = ['state.js', 'expeditionData.js', 'content.js', 'definitions.js', 'resources.js', 'skills.js', 'camp.js', 'equipment.js', 'expedition.js', 'actions.js', 'combat.js', 'save.js'];
const checks = `
let passed = 0;
function assert(ok, label) { if (!ok) throw Error(label); passed++; }
updateLocationActions = updatePlacePanel = updateCraftingUIForCurrentContext = updateDungeonUI = updateBoundEarthElementalLiveUI = refreshBoundEarthElementalUI = setCurrentGoal = trySaveGame = function () {};
hookActionCompletions();

const old = createSaveData();
old.version = 42;
old.resources.fuel.value = 7;
old.expeditionLocations.minersCamp.storage.fuel = 5;
old.expeditionLocations.minersCamp.storage.wood = 2;
old.expeditionLocations.minersCamp.storage.imbuedWood = 1;
old.expeditionLocations.alchemistsHut.storage.fuel = 4;
const migrated = migrateSaveData(old);
assert(migrated.resources.fuel.value === 22, 'legacy fuel pools and stored wood transfer once into shared fuel');
assert(!('fuel' in migrated.expeditionLocations.minersCamp.storage) && !('fuel' in migrated.expeditionLocations.alchemistsHut.storage), 'legacy location fuel fields are removed');
assert(!('wood' in migrated.expeditionLocations.minersCamp.storage) && !('imbuedWood' in migrated.expeditionLocations.minersCamp.storage), 'legacy fuel inputs are removed');
assert(migrateSaveData(migrated).resources.fuel.value === 22, 'migration is idempotent');

getResource('fuel').value = 0;
getAction('addWoodToFuel').onComplete();
getAction('addImbuedWoodToFuel').onComplete();
assert(getResource('fuel').value === 5, 'both station inputs add to one fuel resource');
getCampUpgrade('campSmelter').purchased = true;
getCampUpgrade('campAlchemyStation').purchased = true;
gameState.expedition.active = false;
gameState.expedition.currentLocation = null;
const ironCost = getCraftCost('resourceCraft', 'iron');
const tonicCost = getCraftCost('resourceCraft', 'staminaTonic');
assert(ironCost.fuel === 5 && tonicCost.fuel === 3, 'different recipes use their original fuel amounts');
getResource('fuel').value = 10;
getResource('energy').value = 100;
getResource('ore').value = 10;
getResource('herb').value = 100;
assert(spendCost(ironCost) && getResource('fuel').value === 5, 'smelting spends shared fuel');
assert(spendCost(tonicCost) && getResource('fuel').value === 2, 'alchemy sees and spends the same remainder');
gameState.expedition.active = true;
gameState.expedition.currentLocation = 'minersCamp';
getExpeditionLocation('minersCamp').explored = true;
const remote = getActiveCraftContext(getResourceCraft('iron'));
assert(remote.cost.fuel === 5 && !('fuel' in remote.storageCost), 'remote smelting draws from the same shared fuel');

gameState.expedition.currentLocation = 'arcaneArchive';
getExpeditionLocation('arcaneArchive').explored = true;
gameState.expedition.dungeon.active = false;
resetCombatEncounter();
gameState.northernDisturbance.resolved = false;
gameState.regionalProgress.east.disturbanceResolved = false;
gameState.regionalProgress.south.disturbanceResolved = false;
assert(!canChallengeBrokenWarden(), 'zero regional victories keep capstone hidden');
gameState.northernDisturbance.resolved = true;
assert(!canChallengeBrokenWarden(), 'one regional victory keeps capstone hidden');
gameState.regionalProgress.east.disturbanceResolved = true;
assert(!canChallengeBrokenWarden(), 'two regional victories keep capstone hidden');
gameState.regionalProgress.south.disturbanceResolved = true;
assert(canChallengeBrokenWarden(), 'third regional victory reveals capstone at archive');
const savedVictories = createGameStateSaveData();
gameState.northernDisturbance.resolved = false;
gameState.regionalProgress.east.disturbanceResolved = false;
gameState.regionalProgress.south.disturbanceResolved = false;
applyGameStateSaveData(savedVictories);
assert(canChallengeBrokenWarden(), 'saved regional victories restore the archive encounter');
gameState.expedition.dungeon.active = true;
assert(!canChallengeBrokenWarden(), 'capstone does not appear inside the dungeon');
gameState.expedition.dungeon.active = false;

gameState.expedition.active = false;
gameState.expedition.currentLocation = null;
getTowerNodeState('north').built = true;
triggerRegionalProgression();
assert(gameState.regionalProgress.east.disturbanceTriggered && gameState.regionalProgress.south.disturbanceTriggered && getTowerNodeState('west').activated, 'north completion opens east, south, and west progression together');
assert(getTowerNodeDefinition('west').materials.stone === 30 && getTowerNodeDefinition('west').imbueRequired === 60, 'western construction requirements are preserved');
assert(!getResearch('westernTowerNode').requires.flags && getResearch('westernTowerNode').requires.towerNodes.west.activated, 'western research uses the regional node gate');

const heart = getProjectState('towerFoundation');
heart.unlocked = true;
heart.level = 4;
heart.work = 0;
heart.deposits = { manaCrystal: 8, chargedCrystal: 8 };
getSpell('imbue').unlocked = true;
getResource('mana').maxValue = 100;
assert(getProjectWorkCost('towerFoundation', 'imbueHeart').mana === 25, 'heart UI and action cost comes from 25 Mana definition');
getResource('mana').value = 24;
assert(!canWorkOnProject('towerFoundation', 'imbueHeart'), '24 Mana cannot imbue Heart');
getResource('mana').value = 25;
assert(canWorkOnProject('towerFoundation', 'imbueHeart'), '25 Mana can imbue Heart');
assert(spendCost(getProjectWorkCost('towerFoundation', 'imbueHeart')) && getResource('mana').value === 0, 'Heart payment consumes exactly 25 Mana');
assert(getProjectLevelWorkYield('towerFoundation', 'imbueHeart') === 100, 'one 25 Mana imbuement finishes the existing 100 work requirement');
console.log('Processing and regional progression: ' + passed + ' checks passed.');
`;

vm.runInNewContext(stubs + files.map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n') + checks,
  { console, structuredClone, setTimeout, clearTimeout, Date, Math, Map, Set },
  { filename: 'processing-regional-progression.vm.js' });

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assertHtml(html);
function assertHtml(source) {
  const station = source.match(/<section id="processingFuelSection"[\s\S]*?<\/section>/)?.[0] || '';
  if (!station.includes('processingFuelAmount') || !station.includes('data-action="addWoodToFuel"') || !station.includes('data-action="addImbuedWoodToFuel"')) throw Error('Processing Station must show fuel and own both add-fuel buttons');
  if ((source.match(/data-action="addWoodToFuel"/g) || []).length !== 1 || (source.match(/data-action="addImbuedWoodToFuel"/g) || []).length !== 1 || source.includes('data-action="storeWood"')) throw Error('Redundant Add Fuel buttons remain');
}
