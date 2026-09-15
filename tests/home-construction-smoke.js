const fs = require('fs');
const path = require('path');
const home = fs.readFileSync(path.join(__dirname, '..', 'home-ui.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const availability = home.match(/function updateHomeAreaAvailability\(\) \{[\s\S]*?\n\}/)[0];
if (!/id="practiceCircleBtn"/.test(html) || !/id="storageCacheBtn"/.test(html)) {
  throw new Error('Home facility construction buttons must be present in the crafting actions');
}
require('./overhaul-harness')(`
  updateCampUpgradeUI = function() {};
  updateCraftingSectionVisibility = function() {};
  gameState.hasCamp = false;
  syncHomeStructureUnlocks();
  assert(!getCampUpgrade('practiceCircle').unlocked, 'training project waits for camp');
  assert(!getCampUpgrade('storageCache').unlocked, 'storage project waits for camp');
  getCampUpgrade('smallFire').purchased = true;
  getCampUpgrade('crudeLeanTo').purchased = true;
  gameState.discoveredStream = true;
  gameState.discoveredBerryBush = true;
  assert(hasHomeFacilityConstructionUnlocked(), 'camp facilities require fire, shelter, stream, and berry bush');
  gameState.hasCamp = true;
  syncHomeStructureUnlocks();
  for (const id of ['practiceCircle', 'storageCache']) {
    const upgrade = getCampUpgrade(id);
    assert(upgrade.unlocked && !upgrade.purchased, id + ' unlocks without being built');
    assert(upgrade.duration > 0 && upgrade.cost.wood > 0, id + ' requires work and materials');
  }
  const visible = {};
  let homeSceneSignature = '', selectedHomeArea = null;
  function getHomeSceneState() { return 'established-camp'; }
  function getHomeExploreStep() { return 0; }
  function areHomeResourcesDiscovered() { return true; }
  function isHomeWorkSpotDeclared() { return true; }
  function hasVisibleHomeWork() { return true; }
  function isHomeNodeAvailable() { return false; }
  function setHomeAreaVisible(id, value) { visible[id] = !!value; }
  function updateHomeScenePresentation() {}
  function updateHomeResourceMarker() {}
  function updateHomeCampStructureVisuals() {}
  function updateHomeTowerVisibility() {}
  function updateHomeTrailVisibility() {}
  document.querySelector = () => null;
  ${availability}
  updateHomeAreaAvailability();
  assert(!visible.training && !visible.storage, 'available panels and recipes do not reveal unbuilt facilities');
  getCampUpgrade('meditationSpot').unlocked = true;
  updateHomeAreaAvailability();
  assert(!visible.meditation, 'research unlock alone does not reveal meditation');
  for (const [id, area] of [['practiceCircle', 'training'], ['storageCache', 'storage'], ['meditationSpot', 'meditation']]) {
    getCampUpgrade(id).purchased = true;
    getCampUpgrade(id).unlocked = false;
    updateHomeAreaAvailability();
    assert(visible[area], id + ' appears after construction');
  }
  assert(visible.training && visible.storage, 'built Home facilities appear even before their panels have content');
  syncHomeStructureUnlocks();
  assert(!getCampUpgrade('practiceCircle').unlocked && !getCampUpgrade('storageCache').unlocked, 'built projects are not unlocked again');
  console.log('Home construction checks passed:', passed);
`);
