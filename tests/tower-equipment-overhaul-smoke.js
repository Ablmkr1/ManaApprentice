require('./overhaul-harness')(`
  gameState.phase='expedition';
  gameState.expedition.active=false; gameState.expedition.currentLocation=null;
  getProjectState('towerFloor1').completed=true;
  room('bedroom',1); syncTowerStructureUnlocks();
  assert(getTowerFloorState('floor2').unlocked, 'One functional room opens Floor 2');
  Object.values(getTowerRoomDefinitions()).filter(r => !r.capstone).forEach(r => {
    const levels=getProjectDefinition(r.projectId).levels;
    assert(levels.length===2, r.id+' has exactly two stages');
    assert(levels[0].workRequired+levels[1].workRequired===r.legacyConstruction.workRequired, r.id+' preserves total work');
    Object.entries(r.legacyConstruction.materials).forEach(([id,n]) => assert((levels[0].materials[id]||0)+(levels[1].materials[id]||0)===n, r.id+' preserves '+id));
  });
  room('forge',1); getResearch('steelworking').unlocked=false;
  assert(!isResearchDiscoverable(getResearch('steelworking')), 'Functional Forge does not reveal Steelworking');
  room('forge',2); gameState.magic.arcaneForce.rank=1;
  assert(!areResearchStartRequirementsMet(getResearch('steelworking')), 'Forge upgrade preserves Arcane Force prerequisite');
  gameState.magic.arcaneForce.rank=2;
  assert(areResearchStartRequirementsMet(getResearch('steelworking')), 'Steelworking reachable after upgraded Forge and Rank II');
  room('library',1); assert(getTowerRoomEffectValue('researchDurationMultiplier',1)===0.85,'Functional Library duration');
  getResource('focus').maxValue=10; getResource('focus').value=0; getResource('energy').value=100; gameState.tower.selectedId='room:library';
  assert(startLibraryStudy(),'Study starts'); completeActivity(); resetActivity(); assert(getResource('focus').value===2,'Functional Study gives 2');
  room('library',2); getResource('focus').value=0; startLibraryStudy(); completeActivity(); resetActivity(); assert(getResource('focus').value===4,'Upgraded Study gives 4');
  room('bedroom',1); gameState.tower.selectedId='room:bedroom'; getResource('mana').value=0;
  completeExplicitRest({context:{bedroom:true}}); assert(getResource('mana').value===0,'Functional Bedroom has no mana');
  room('bedroom',2); getResource('mana').maxValue=100;
  assert(getRestDuration()===10,'Bedroom mana rest is 10 seconds');
  getResource('energy').value=getResource('energy').maxValue;
  assert(needsExplicitRest(),'Rest allowed at full Energy with missing mana');
  const before=getResource('mana').value; startActivity({kind:'rest',duration:10,context:{bedroom:true}}); resetActivity();
  assert(getResource('mana').value===before,'Canceled rest has no mana payout');
  completeExplicitRest({context:{bedroom:true}}); assert(getResource('mana').value===20,'Completed Bedroom rest gives 20');
  completeExplicitRest({context:{bedroom:false}}); assert(getResource('mana').value===20,'Camp rest does not give mana');
  const att=getAttunementState(); att.rank=2; att.rankTwoLevel=10; att.active=[{id:'manaConduit'}];
  getAttunementProgressState().xp=10000;
  assert(getAttunementBonusMultiplier()===4,'Generic attunement multiplier actually reaches four');
  assert(getActiveAttunementEffectTotal('maxManaFlat')===30,'Conduit contributes exactly 30');
  recalculateCharacterStats(); assert(getResource('mana').perSecond===0,'No passive mana rate');

  funds(); getCampUpgrade('workbench').purchased=true;
  gameState.magic.imbuement.rank=2; gameState.magic.imbuement.rankTwoLevel=4;
  getGearUpgrade('leatherShirt').unlocked=true;
  room('enchantingStudy',0);
  let result=finish({type:'craft',baseGearId:'leatherShirt'}); assert(result.ok,'First wearable works before enchanting');
  const shirt=ensureEquipmentCollection().items.find(i=>i.baseGearId==='leatherShirt');
  assert(gearCraftReason('leatherShirt')===EQUIPMENT_MESSAGES.full,'Normal gear cannot be duplicated');
  assert(!isGearCraftOptionNeeded('leatherShirt'),'Crafted normal gear recipe is hidden');
  assert(equipmentOperationReason({type:'enchant',itemId:shirt.id,family:'reservoirWeave'}).includes('Enchanting Study'),'Enchantments cannot be applied outside the selected Tower room');
  room('enchantingStudy',1); gameState.tower.selectedId='room:enchantingStudy';
  result=finish({type:'enchant',itemId:shirt.id,family:'reservoirWeave'}); assert(result.ok,'Standard enchant starts at II4');
  assert(!completeEquipmentOperation(result.paid),'Duplicate completion cannot spend or award');
  assert(equipmentOperationReason({type:'enchant',itemId:shirt.id,family:'reservoirWeave'})===EQUIPMENT_MESSAGES.duplicate,'Current enchantment cannot be reapplied');
  assert(!canApplyImbueRankTwoTarget(getImbueDefinition('rankTwoBackpack').permanentAction),'Global backpack pathway removed');
  funds(); ['fiber','leather','manaCrystal','mana'].forEach(id=>getResource(id).value=50); const beforeReplace={fiber:getResource('fiber').value,leather:getResource('leather').value,manaCrystal:getResource('manaCrystal').value,mana:getResource('mana').value};
  result=finish({type:'enchant',itemId:shirt.id,family:'wardweave'}); assert(result.ok&&shirt.family==='wardweave','A new family replaces the old enchantment');
  assert(beforeReplace.fiber-getResource('fiber').value===12&&beforeReplace.leather-getResource('leather').value===4&&beforeReplace.manaCrystal-getResource('manaCrystal').value===2&&equipmentOperationCost({type:'enchant',itemId:shirt.id,family:'wardweave'}).mana===15,'Replacement charges full new enchantment cost');
  shirt.name='Patient Light'; room('enchantingStudy',2); gameState.magic.imbuement.rankTwoLevel=6; funds();
  result=finish({type:'greater',itemId:shirt.id}); assert(result.ok&&shirt.grade==='greater'&&shirt.name==='Patient Light','Greater preserves identity and name');
  assert(ensureEquipmentCollection().equipped.chest===shirt.id,'Greater preserves equipped reference');
  getGearUpgrade('scratchyPants').unlocked=true; funds(); result=finish({type:'craft',baseGearId:'scratchyPants'}); const pants=ensureEquipmentCollection().items.find(i=>i.baseGearId==='scratchyPants');
  funds(); finish({type:'enchant',itemId:pants.id,family:'meditativeWeave'}); const oldPantsId=pants.id; getGearUpgrade('leatherPants').unlocked=true; funds(); result=finish({type:'craft',baseGearId:'leatherPants'});
  assert(result.ok&&pants.id===oldPantsId&&pants.family==='meditativeWeave'&&ensureEquipmentCollection().items.filter(i=>equipmentSlot(i)==='legs').length===1,'Gear upgrade replaces in place and preserves enchantment');
  getGearUpgrade('scratchyPants').unlocked=true; assert(gearCraftReason('scratchyPants')===EQUIPMENT_MESSAGES.full,'A lower tier cannot replace current gear');
  assert(!isGearCraftOptionNeeded('scratchyPants')&&!isGearCraftOptionNeeded('leatherPants'),'Current and obsolete normal gear recipes are hidden');

  funds(); result=finish({type:'ring',core:'mana'}); assert(result.ok,'First mana ring'); funds(); result=finish({type:'ring',core:'mana'}); assert(result.ok,'Second identical mana ring');
  assert(equipmentOperationReason({type:'ring',core:'mana'})===EQUIPMENT_MESSAGES.rings,'Third ring rejected');
  funds(); finish({type:'ring',core:'warding'}); funds(); finish({type:'ring',core:'warding'});
  const rings=ensureEquipmentCollection().items.filter(i=>i.core), manaRings=rings.filter(i=>i.core==='mana'), wardRings=rings.filter(i=>i.core==='warding');
  assert(manaRings.length===2&&wardRings.length===2,'Two Mana and two Warding rings coexist');
  assert(equipOwnedItem(manaRings[0].id,'leftRing'),'Left ring accepts Mana');
  assert(!equipOwnedItem(manaRings[0].id,'rightRing'),'Same instance cannot equip twice');
  assert(equipOwnedItem(manaRings[1].id,'rightRing'),'Matching second ring accepted');
  assert(getEquippedPermanentImbueEffectTotal('maxManaFlat')===20,'Two standard mana rings add 20');
  funds(); result=finish({type:'greater',itemId:manaRings[0].id}); assert(result.ok,'Greater ring upgrade');
  assert(equipmentOperationReason({type:'ring',core:'mana'})===EQUIPMENT_MESSAGES.rings,'Grade does not bypass ownership limit');
  gameState.magic.imbuement.rankTwoLevel=9; getTowerNodeState('north').built=true; funds();
  result=finish({type:'rune',itemId:manaRings[0].id,rune:'earth'}); assert(result.ok,'Rune separately applied');
  assert(equipmentOperationReason({type:'rune',itemId:manaRings[0].id,rune:'earth'})===EQUIPMENT_MESSAGES.duplicate,'Same ring rune cannot be reapplied');
  getTowerNodeState('east').built=true; funds(); result=finish({type:'rune',itemId:manaRings[0].id,rune:'hunter'}); assert(result.ok&&manaRings[0].rune==='hunter','Ring enchantment can be replaced');
  const ringName=manaRings[1].name='Twin'; funds(); finish({type:'rune',itemId:manaRings[1].id,rune:'earth'}); funds(); finish({type:'greater',itemId:manaRings[1].id});
  assert(manaRings[1].rune==='earth'&&manaRings[1].name===ringName,'Greater preserves rune/name');
  funds(); finish({type:'greater',itemId:wardRings[0].id}); assert(wardRings[0].grade==='greater'&&wardRings[1].grade==='standard','Each Ward ring upgrades independently');
  assert(near(getEquippedPermanentImbueEffectTotal('lanceDamageBonus'),0.1),'Each ring keeps its own enchantment');
  const ringSave=createSaveData(), loadedCollection=normalizeEquipmentCollection(structuredClone(ringSave.gameState.equipment));
  const loadedRings=loadedCollection.items.filter(i=>i.core);
  assert(loadedRings.length===4&&loadedRings.find(i=>i.id===manaRings[0].id).rune==='hunter'&&loadedRings.find(i=>i.id===manaRings[1].id).grade==='greater','Save/load preserves four independent ring identities, tiers, and enchantments');

  const duplicateCollection={version:1,nextId:8,equipped:{chest:'gear-1'},items:[
    {id:'gear-1',baseGearId:'scratchyShirt',family:'reservoirWeave',grade:'standard'},
    {id:'gear-2',baseGearId:'leatherShirt',family:null,grade:'standard'},
    {id:'gear-3',core:'mana',grade:'standard',rune:'earth'},
    {id:'gear-4',core:'mana',grade:'greater',rune:'hunter'},
    {id:'gear-5',core:'mana',grade:'standard',rune:null}
  ],triggers:{rooms:{}}};
  normalizeEquipmentCollection(duplicateCollection);
  const normalizedChest=duplicateCollection.items.find(i=>i.baseGearId==='leatherShirt');
  assert(duplicateCollection.version===2&&duplicateCollection.items.filter(i=>equipmentSlot(i)==='chest').length===1&&normalizedChest.family==='reservoirWeave','Migration keeps the highest normal tier and transfers a valid enchantment');
  assert(duplicateCollection.items.filter(i=>i.core==='mana').length===2,'Migration caps legacy rings at two per type without collapsing the pair');

  const old={version:34,gameState:{magic:{imbuement:{backpackImbued:true,craftedRings:{ringOfMana:true},equippedRing:'ringOfMana',equipmentEnchantments:{leatherPants:'restoringWeave'}}},projects:{towerRoomForge:{completed:true},towerRoomBedroom:{level:0,work:300,deposits:{wood:120,fiber:90,leather:20,nails:40}}}},resources:{mana:{value:4,perSecond:1}},gearUpgrades:{leatherPants:{purchased:true},repairedLeatherBackpack:{purchased:true}},campUpgrades:{},spells:{},actions:{},research:{},dungeons:{},expeditionLocations:{},resourceCrafts:{},automation:{}};
  const migrated=migrateSaveData(structuredClone(old)); const twice=migrateSaveData(structuredClone(migrated));
  assert(JSON.stringify(migrated)===JSON.stringify(twice),'Migration idempotent');
  assert(migrated.gameState.projects.towerRoomForge.level===2,'Paid rooms become upgraded');
  const bed=migrated.gameState.projects.towerRoomBedroom;
  assert(bed.level===1&&bed.work===170&&bed.deposits.wood===72,'Partial room work/materials carried into upgrade');
  assert(migrated.gameState.equipment.items.filter(i=>i.core).length===1,'Migration grants no second ring');
  assert(migrated.gameState.equipment.items.some(i=>i.family==='legacy:restoringWeave'&&i.legacyEffects.wardRestoreMultiplier===1.2),'Legacy Restoring keeps its real effect');
  assert(migrated.gameState.equipment.items.some(i=>i.family==='expansive')&&!migrated.gameState.magic.imbuement.backpackImbued,'Backpack global bonus replaced once');
  assert(migrated.resources.mana.perSecond===0&&migrated.resources.mana.value===4,'Loading does not award passive mana');
  assert(!Object.values(EQUIPMENT_COSTS.regionalMaterials).flatMap(Object.keys).some(id=>!getResource(id)),'Every recipe resource exists');
  console.log(JSON.stringify({passed}));
`);
