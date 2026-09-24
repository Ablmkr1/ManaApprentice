const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.resolve(__dirname, '..');
const stubs = fs.readFileSync(path.join(__dirname, 'steelworking-smoke.js'), 'utf8').split('const browserStubs = `')[1].split('`;')[0];
const files = ['state.js','expeditionData.js','content.js','definitions.js','resources.js','skills.js','camp.js','equipment.js','expedition.js','actions.js','combat.js','save.js'];
const test = `
let passed=0;
function assert(ok,message){if(!ok)throw Error(message);passed++;}
document.querySelectorAll=()=>[];
setCampActionsAvailable=updateRegionalMapVisibility=updateActionButton=updatePlacePanel=updateTravelButton=updateCampUpgradeDisplay=updateCraftingUIForCurrentContext=updateDungeonUI=updateBoundEarthElementalLiveUI=refreshBoundEarthElementalUI=updateLocationActions=refreshGameUIAfterLoad=trySaveGame=function(){};
ensureEquipmentCollection(); hookActionCompletions();
for(const r of Object.values(getResourceDefinitions())){r.maxValue=1000;r.value=100;r.discovered=true;}
getSpell('imbue').unlocked=true; getSpellProgressState('imbue').xp=100000;
gameState.manaCrystalImbuingUnlocked=true; gameState.expedition.active=true;
for(const id of ['roadsideRuin','silentGearworks','arcaneArchive']) {
 gameState.expedition.currentLocation=id;
 const c=getProductionSpellTargetContext('imbue','manaCrystal');
 assert(c.cost.mana===20 && c.cost.focus===2 && isProductionSpellTargetAvailable('imbue','manaCrystal'),id+' hand condensation available at exact cost');
}
gameState.expedition.currentLocation='roadsideRuin';
getResource('focus').value=4; getResource('mana').value=40; getResource('manaCrystal').value=0;
for(let i=0;i<2;i++){castTargetedSpell('imbue',{type:'productionSpell',spellName:'imbue',targetId:'manaCrystal',mode:'location'});assert(isActivityActive(),'paid manual cast starts');completeActivity();}
assert(getResource('manaCrystal').value===2 && getResource('focus').value===0 && getResource('mana').value===0,'4 Focus creates two crystals with no machinery');
const research=getResearch('ancientManaCondenser'), frame=getCampUpgrade('manaCondenserFrame'), lattice=getCampUpgrade('manaCondenser');
assert(JSON.stringify(research.cost)===JSON.stringify({energy:40,focus:4}),'exact research cost');
assert(!isResearchDiscoverable(research),'plans gate research');gameState.manaCondenserPlansFound=true;
assert(isResearchDiscoverable(research),'Archive plans reveal research');
assert(!isCraftAvailable('campUpgrade','manaCondenserFrame'),'frame gated before research');
research.completed=true;applyResearchUnlocks('ancientManaCondenser');
getExpeditionLocation('roadsideRuin').explored=true;
assert(isCraftAvailable('campUpgrade','manaCondenserFrame'),'research unlocks frame');
assert(JSON.stringify(frame.cost)===JSON.stringify({energy:40,stone:40,wood:20,iron:5,nails:20}),'exact frame cost');
assert(!isCraftAvailable('campUpgrade','manaCondenser'),'lattice gated before frame');
startCrafting('campUpgrade','manaCondenserFrame');
assert(isActivityActive(),'frame paid construction starts');
const stone=getResource('stone').value;
pauseWesternCondenserActivity(); const partial=createSaveData();
assert(partial.gameState.pendingCondenserActivity.activity.id==='manaCondenserFrame','paid frame survives save');
resumeWesternCondenserActivity();completeActivity();
assert(frame.purchased && getResource('stone').value===stone,'frame finishes without charging twice');
assert(JSON.stringify(lattice.cost)===JSON.stringify({energy:40,manaCrystal:2,chargedCrystal:2}),'exact lattice cost');
assert(!isProductionSpellTargetAvailable('imbue','activateManaCondenser'),'activation gated before lattice');
startCrafting('campUpgrade','manaCondenser');completeActivity();
assert(lattice.purchased && !isManaCondenserActive(),'installed lattice still needs activation');
getResource('mana').value=30;
for(let i=1;i<=3;i++){
 castTargetedSpell('imbue',{type:'productionSpell',spellName:'imbue',targetId:'activateManaCondenser',mode:'location'});
 assert(isActivityActive(),'activation starts separately');
 if(i===2){pauseWesternCondenserActivity();const save=createSaveData();assert(save.gameState.manaCondenserActivation===1,'completed activation persists alongside paid pending activation');resumeWesternCondenserActivity();}
 completeActivity(); assert(getManaCondenserActivation()===i,'activation advances once');
}
assert(getResource('mana').value===0 && isManaCondenserActive(),'three actions spend exactly 30 Mana');
assert(!isProductionSpellTargetAvailable('imbue','activateManaCondenser'),'no fourth activation');
for(const id of ['roadsideRuin','silentGearworks','arcaneArchive']){gameState.expedition.currentLocation=id;const c=getProductionSpellTargetContext('imbue','manaCrystal');assert(c.cost.mana===(id==='roadsideRuin'?16:20)&&c.cost.focus===2,'discount only at Roadside Ruin');}
assert(getManaCondenserStatus().includes('awaiting a Tower connection'),'restored status before node');
gameState.towerConstructionUnlocked=true;getResearch('elementalBinding').completed=true;
gameState.elementals={};getBoundEarthElementalState().owned=6;
const job={type:'node',nodeName:'west',jobName:'manaCondenser'};
assert(!validateBoundEarthElementalAssignment(job).valid,'node required for assignment');
getResource('manaCrystal').value=0;processBoundEarthElementalAutomation(1000);assert(getResource('manaCrystal').value===0,'no passive machine');
Object.assign(getTowerNodeState('west'),{built:true,activated:true});
gameState.manaCondenserActivation=2;
assert(!validateBoundEarthElementalAssignment(job).valid,'active node cannot operate an unactivated condenser');
gameState.manaCondenserActivation=3;
assert(getManaCondenserStatus().includes('Ready for an Earth Elemental operator'),'ready without assignment');
assert(changeBoundEarthElementalAssignment(job),'assign first operator');
processBoundEarthElementalAutomation(119.5);assert(getResource('manaCrystal').value===0,'one operator waits full interval');
applyGolemOfflineProgress({savedAt:0},500);assert(getResource('manaCrystal').value===1,'fractional live plus offline produces once at 120s');
assert(changeBoundEarthElementalAssignment(job),'assign second operator');assert(!validateBoundEarthElementalAssignment(job).valid,'Western cap two');
processBoundEarthElementalAutomation(60);assert(getResource('manaCrystal').value===2,'two operators produce one per minute');
applyGolemOfflineProgress({savedAt:0},120000);assert(getResource('manaCrystal').value===4,'two operators offline rate');
const crystal=getResource('manaCrystal');crystal.maxValue=5;
processBoundEarthElementalAutomation(3600);assert(crystal.value===5,'long gap capped');
const remaining=getBoundEarthElementalCycle('west','manaCondenser').remaining;
processBoundEarthElementalAutomation(3600);assert(getBoundEarthElementalCycle('west','manaCondenser').remaining===remaining,'full storage pauses timer');
crystal.value=4;processBoundEarthElementalAutomation(59);assert(crystal.value===4,'no banked overflow');processBoundEarthElementalAutomation(1);assert(crystal.value===5,'resumes exactly after one minute');
unassignBoundEarthElemental(job);unassignBoundEarthElemental(job);assert(getBoundEarthElementalCycle('west','manaCondenser').remaining===0,'empty assignment resets unfinished cycle');
crystal.maxValue=1000;crystal.value=0;changeBoundEarthElementalAssignment(job);
processBoundEarthElementalAutomation(30);const saved=createSaveData();
gameState.elementals=structuredClone(saved.gameState.elementals);ensureElementalState();
assert(getBoundEarthElementalCycle('west','manaCondenser').remaining===90,'reload normalization keeps partial production');
gameState.expedition.active=true;endExpedition('recalled');processBoundEarthElementalAutomation(90);
assert(crystal.value===1 && getBoundEarthElementalNodeAssignments('west').manaCondenser===1,'Recall preserves remote operation');
const legacy=createSaveData();legacy.version=38;legacy.gameState.elementals={};delete legacy.gameState.manaCondenserActivation;
const migrated=migrateSaveData(legacy);assert(migrated.gameState.manaCondenserActivation===3,'legacy completed condenser fully activated');
assert(!migrated.gameState.elementals.earth?.nodes?.west?.manaCondenser,'migration never assigns a worker');
assert(migrateSaveData(migrated).gameState.manaCondenserActivation===3,'migration idempotent');
legacy.version=38;legacy.campUpgrades.manaCondenser.purchased=false;assert(migrateSaveData(legacy).gameState.manaCondenserActivation===0,'legacy partial condenser not activated');
assert(migrated.gameState.manaCrystalImbuingUnlocked && migrated.gameState.manaCondenserPlansFound,'manual unlock and plans preserved');
const workshop=JSON.stringify(getDungeon('silentGearworksDepths'));
assert(workshop.includes('fadedArtificersRing')&&!workshop.includes('manaCondenserPlansFound'),'Workshop ring independent of Archive plans');
assert(workshop.includes('"maxManaFlat":5'),'ring still grants five maximum Mana');
gameState.pendingCondenserActivity=null;gameState.pendingCondenserActivities=[];
Object.assign(gameState.activity,{active:true,kind:'craft',type:'campUpgrade',id:'manaCondenserFrame',duration:10,startTime:getGameTime(),context:{mode:'location'}});
pauseWesternCondenserActivity();
Object.assign(gameState.activity,{active:true,kind:'spell',id:'imbue',duration:3,startTime:getGameTime(),context:{type:'productionSpell',spellName:'imbue',targetId:'manaCrystal',mode:'location',costPaid:true}});
pauseWesternCondenserActivity();
assert(gameState.pendingCondenserActivities.length===1,'second paused activity preserves earlier paid construction');
gameState.expedition.currentLocation='silentGearworks';resumeWesternCondenserActivity();
assert(gameState.activity.context.targetId==='manaCrystal'&&gameState.pendingCondenserActivity.activity.id==='manaCondenserFrame','manual work resumes elsewhere without consuming pending construction');
crystal.value=crystal.maxValue;completeActivity();assert(!isActivityActive()&&gameState.pendingCondenserActivity.activity.context.targetId==='manaCrystal','storage filled during paid spell preserves pending crystal');
resumeWesternCondenserActivity();assert(!isActivityActive(),'full storage keeps paid crystal paused');
crystal.value--;resumeWesternCondenserActivity();completeActivity();assert(crystal.value===crystal.maxValue,'pending paid crystal delivers exactly once after space opens');
gameState.expedition.currentLocation='roadsideRuin';resumeWesternCondenserActivity();assert(gameState.activity.id==='manaCondenserFrame','earlier construction still resumes');resetActivity();
console.log('Mana Condenser: '+passed+' focused checks passed.');
`;
vm.runInNewContext(stubs+files.map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n')+test,{console,structuredClone,setTimeout,clearTimeout,Date,Math,Map,Set},{filename:'mana-condenser.vm.js'});
