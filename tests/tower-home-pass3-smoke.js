const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

require('./overhaul-harness')(`
  setCampActionsAvailable = function() {};
  gameState.phase = 'expedition';
  gameState.expedition.active = false;
  gameState.expedition.currentLocation = null;
  gameState.wardenCoreRecovered = true;
  getResearch('longRangeNetwork').unlocked = true;
  getProjectState('towerFoundation').completed = true;
  getProjectState('towerBasement').completed = true;
  ['bedroom','workshop','forge','library','alchemyRoom','enchantingStudy'].forEach(id => room(id, 1));

  let stories = [];
  addStoryEntry = text => stories.push(text);
  let storyPopups = [];
  triggerStoryPopup = id => storyPopups.push(id);
  let presentations = 0;
  showTowerEstablishedPresentation = function() {
    if (gameState.towerHome.establishmentPresented) return;
    gameState.towerHome.establishmentPresented = true;
    presentations++;
    triggerStoryPopup('homeAtLast');
  };
  assert(startTowerMoveIn(), 'Move-in remains available');
  completeActivity();
  assert(hasRelocatedToTower(), 'Tower becomes Home');
  assert(gameState.towerHome.establishmentPresented, 'One-time establishment presentation is persisted');
  assert(stories.length === 0 && storyPopups.length === 1 && storyPopups[0] === 'homeAtLast', 'Relocation uses the approved one-time story popup');
  const saved = createSaveData();
  applyGameStateSaveData(saved.gameState);
  showTowerEstablishedPresentation();
  assert(presentations === 1, 'Reload cannot repeat the completion presentation');
  assert(getTowerVisualCaption().title === 'Your Tower' && getTowerVisualCaption().status === 'Permanent Home', 'Relocated tower presents as home');
  console.log(JSON.stringify({passed}));
`);

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'ui.js'), 'utf8');
const home = fs.readFileSync(path.join(root, 'home-ui.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'home-ui.css'), 'utf8');
const style = fs.readFileSync(path.join(root, 'style.css'), 'utf8');

if (!html.includes('id="towerRoomNav"') || !html.includes('id="towerExpeditionBtn"')) throw new Error('Tower home navigation markup missing');
if (!html.includes('id="storyPopup"') || !html.includes('story:homeAtLast')) throw new Error('Reusable relocation story dialog missing');
if (!ui.includes('button.textContent = hasRelocatedToTower() ? "Tower Home" : "Home"')) throw new Error('Primary Home label does not change');
if (!home.includes('return "tower-grounds"') || !css.includes('station-campfire-small.png') || !css.includes('station-shelter.png')) throw new Error('Tower Grounds traces missing');
if (!style.includes('.tower-room-nav') || !style.includes('.tower-heart-power-note')) throw new Error('Tower home presentation styles missing');
