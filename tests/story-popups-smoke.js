const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');

class FakeElement {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.style = { display: 'none' };
    this.hidden = false;
    this.dataset = {};
    this.children = [];
    this.attributes = {};
    this.textContent = '';
  }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren(...children) { this.children = children; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  removeAttribute(name) { delete this.attributes[name]; }
  focus() { document.activeElement = this; }
}

const storyPopup = new FakeElement();
const storyTitle = new FakeElement('h2');
const storyBody = new FakeElement();
const storyButton = new FakeElement('button');
const blocker = new FakeElement();
const popupElements = [storyPopup, blocker];
const document = {
  activeElement: null,
  createElement: tag => new FakeElement(tag),
  querySelectorAll: selector => selector === '.popup' ? popupElements : [],
  querySelector: () => null,
};
const context = {
  console,
  structuredClone,
  setTimeout,
  clearTimeout,
  Map,
  Set,
  WeakMap,
  document,
  storyPopup,
  storyTitle,
  storyBody,
  storyButton,
  blocker,
  window: { getComputedStyle: element => ({ display: element.style.display }) },
  requestAnimationFrame: callback => callback(),
};
const queueSource = ['state.js', 'expeditionData.js', 'content.js', 'definitions.js', 'ui.js']
  .map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
const queueTest = `
  let passed = 0;
  function assert(ok, message) { if (!ok) throw Error(message); passed++; }
  ui.storyPopup = storyPopup;
  ui.storyPopupTitle = storyTitle;
  ui.storyPopupBody = storyBody;
  ui.storyPopupContinueBtn = storyButton;
  ui.settingsOverlay = { hidden: true };
  ui.journalEntries = null;
  trySaveGame = function() {};
  storyPopup.style.display = 'none';
  blocker.style.display = 'flex';
  const ids = Object.keys(getStoryPopupDefinitions());
  assert(ids.length === 13, 'all thirteen story definitions exist');
  assert(ids.every(id => { const s=getStoryPopupDefinition(id); return s.id===id && s.once===true && s.title && s.paragraphs.length && s.continueLabel && s.journalTitle && s.journalText; }), 'definitions contain all required fields');
  triggerStoryPopup('fourAnchorsOneHeart');
  triggerStoryPopup('firstConnection');
  assert(storyPopup.style.display === 'none' && gameState.storyPopupQueue.join(',') === 'firstConnection,fourAnchorsOneHeart', 'blocked simultaneous stories queue in progression order');
  blocker.style.display = 'none';
  processStoryPopupQueue();
  assert(storyPopup.dataset.storyId === 'firstConnection' && storyTitle.textContent === 'The First Connection', 'first queued story opens');
  closeStoryPopup();
  assert(storyPopup.dataset.storyId === 'fourAnchorsOneHeart' && storyTitle.textContent === 'Four Anchors, One Heart', 'closing opens the next queued story');
  closeStoryPopup();
  assert(!triggerStoryPopup('firstConnection') && gameState.journal.entries.filter(id => id === 'firstConnection').length === 1, 'stories and Journal entries occur only once');
  gameState.combat.resolved = true;
  triggerStoryPopup('beyondTheFourRoads');
  assert(storyPopup.style.display === 'none', 'victory story waits behind combat result');
  gameState.combat.resolved = false;
  processStoryPopupQueue();
  assert(storyPopup.dataset.storyId === 'beyondTheFourRoads', 'victory story opens after combat is dismissed');
  closeStoryPopup();
  assert(renderStoryPopup('answerBeyondTheWoods') && storyBody.children.at(-1).className === 'story-popup-ending' && storyBody.children.at(-1).children.length === 3, 'finale renders one accessible ending status section');
  ids.forEach(id => assert(renderStoryPopup(id), 'debug preview renders '+id));
  console.log(JSON.stringify({queueChecks:passed}));
`;
vm.runInNewContext(queueSource + queueTest, context, { filename: 'story-popup-queue.vm.js' });

require('./overhaul-harness')(`
  updateCampUpgradeDisplay = function() {};
  updateHomeAreaAvailability = function() {};
  setCampActionsAvailable = function() {};
  updatePlacePanel = function() {};
  updateBoundEarthElementalLiveUI = function() {};
  updateLocationActions = function() {};
  setCurrentGoal = id => { gameState.currentGoalId = id; };
  let triggered = [];
  triggerStoryPopup = id => { triggered.push(id); return true; };
  unlockFlag('oldMapFound'); unlockFlag('archiveDoorOpened'); unlockFlag('partialTowerPlansFound');
  assert(triggered.join(',') === 'fourRoads,familiarQuestion,plansBeneathTheDust', 'flag milestones use exact story hooks');
  triggered = [];
  const workbench = getCampUpgrade('workbench'), shelter = getCampUpgrade('framedShelter');
  Object.assign(workbench,{unlocked:true,purchased:false}); Object.assign(shelter,{unlocked:true,purchased:false});
  completeCampUpgrade('workbench'); assert(triggered.length === 0, 'one camp upgrade is insufficient');
  completeCampUpgrade('framedShelter'); assert(triggered.join() === 'moreThanARefuge', 'compound camp trigger works when shelter completes last');
  triggered = []; Object.assign(workbench,{unlocked:true,purchased:false}); Object.assign(shelter,{unlocked:true,purchased:false});
  completeCampUpgrade('framedShelter'); completeCampUpgrade('workbench');
  assert(triggered.join() === 'moreThanARefuge', 'compound camp trigger is order-independent');
  triggered = [];
  gameState.personalWardUnlocked=false; gameState.personalWardPopupShown=false;
  getProjectDefinition('towerFoundation').levels.at(-1).onComplete();
  assert(gameState.personalWardUnlocked && gameState.personalWardPopupShown && triggered.join() === 'heartRemembers', 'Heart completion unlocks Ward and only queues Heart Remembers');
  triggered = []; gameState.elementalUsefulCycleCompleted=false;
  const earth=getBoundEarthElementalState(); earth.owned=1; earth.assignments.nodes.local.food=1;
  gameState.discoveredBerryBush=true; gameState.towerConstructionUnlocked=true; getResearch('elementalBinding').completed=true; getResource('food').discovered=true; getBoundEarthElementalCycle('local','food').remaining=20;
  processBoundEarthElementalAutomation(1); assert(triggered.length===0, 'assignment start does not trigger Hands of Stone');
  getBoundEarthElementalCycle('local','food').remaining=.1; getResource('food').value=0; getResource('food').maxValue=100;
  processBoundEarthElementalAutomation(1); processBoundEarthElementalAutomation(100);
  assert(triggered.join() === 'handsOfStone', 'first productive cycle triggers Hands of Stone once');
  triggered=[];
  ['north','east','south','west'].forEach(id => Object.assign(getTowerNodeState(id), {built:false,researchUnlocked:true,imbueProgress:0,deposits:getDefaultTowerNodeDeposits(id)}));
  function finishNode(id) { const d=getTowerNodeDefinition(id), s=getTowerNodeState(id); s.deposits={...d.materials}; s.imbueProgress=d.imbueRequired-d.imbueYield; gameState.expedition.currentLocation=d.locationName; completeTowerNodeImbue(id); }
  finishNode('west'); finishNode('south'); finishNode('east'); finishNode('north');
  assert(triggered.join() === 'firstConnection,fourAnchorsOneHeart', 'Northern completion and order-independent four-node completion use ordered story hooks');
  triggered=[];
  Object.assign(gameState.northernDisturbance,{resolved:true});
  Object.assign(getRegionalProgressState('east'),{disturbanceResolved:true});
  Object.assign(getRegionalProgressState('south'),{disturbanceResolved:true});
  getExpeditionLocation('arcaneArchive').explored=true; gameState.expedition.active=true; gameState.expedition.dungeon.active=false; gameState.brokenWardenDefeated=false;
  setCurrentLocation('arcaneArchive');
  assert(triggered.join() === 'lastWarden', 'Last Warden queues on Archive exterior arrival before combat');
  triggered=[];
  Object.assign(gameState.combat,{active:true,resolved:false,enemyId:'brokenWarden',enemyHealth:0,enemyMaxHealth:850,rewardGranted:false,reward:{},storyEncounter:true});
  gameState.brokenWardenDefeated=false; gameState.wardenCoreRecovered=false;
  resolveCombatVictory();
  assert(gameState.combat.resolved && gameState.wardenCoreRecovered && triggered.join() === 'beyondTheFourRoads', 'first Broken Warden victory queues its scene after awarding the Core');
  triggered=[]; gameState.wardenCoreRecovered=true; const network=getResearch('longRangeNetwork'); Object.assign(network,{unlocked:true,completed:false});
  completeResearch('longRangeNetwork',true);
  assert(network.completed && triggered.join() === 'towerBuiltToReach', 'Long-Range Network completion queues its story');
  triggered=[]; gameState.tierFourCompleted=false; completeTierFourFinale(true);
  assert(gameState.tierFiveUnlocked && getTerritoryProgress().unknownTerritory1.accessible && triggered.join() === 'answerBeyondTheWoods', 'Gate finale queues one ending and unlocks Tier 5');
  const legacy=createSaveData(); legacy.version=44; legacy.gameState.storyPopupsSeen={}; legacy.gameState.storyPopupQueue=[];
  legacy.gameState.oldMapFound=true; legacy.gameState.archiveDoorOpened=true; legacy.gameState.partialTowerPlansFound=false;
  legacy.gameState.northernDisturbance.resolved=true; legacy.gameState.regionalProgress.east.disturbanceResolved=true; legacy.gameState.regionalProgress.south.disturbanceResolved=true;
  legacy.gameState.brokenWardenDefeated=false; legacy.gameState.brokenWardenEncountered=false; legacy.gameState.towerHome.relocated=false;
  legacy.gameState.projects.towerRoomLongRangeGate.completed=false;
  const migrated=migrateSaveData(legacy);
  assert(migrated.gameState.storyPopupsSeen.fourRoads && migrated.gameState.storyPopupsSeen.familiarQuestion, 'migration marks completed milestones seen');
  assert(!migrated.gameState.storyPopupsSeen.plansBeneathTheDust && !migrated.gameState.storyPopupsSeen.lastWarden && !migrated.gameState.storyPopupsSeen.homeAtLast, 'migration leaves future, unencountered Warden, and unrelocated Home stories unseen');
  assert(migrated.gameState.storyPopupQueue.length===0, 'migration never creates a popup backlog');
  applyGameStateSaveData(migrated.gameState); triggered=[]; unlockFlag('partialTowerPlansFound');
  assert(triggered.join() === 'plansBeneathTheDust', 'future scenes still trigger after an existing save is loaded');
  gameState.storyPopupsSeen={fourRoads:true}; gameState.storyPopupQueue=['plansBeneathTheDust']; gameState.elementalUsefulCycleCompleted=true; gameState.brokenWardenEncountered=true;
  const saved=createSaveData(); gameState.storyPopupsSeen={}; gameState.storyPopupQueue=[]; gameState.elementalUsefulCycleCompleted=false; gameState.brokenWardenEncountered=false;
  applyGameStateSaveData(saved.gameState);
  assert(gameState.storyPopupsSeen.fourRoads && gameState.storyPopupQueue[0]==='plansBeneathTheDust' && gameState.elementalUsefulCycleCompleted && gameState.brokenWardenEncountered, 'save and reload preserve story state');
  console.log(JSON.stringify({milestoneChecks:passed}));
`);
