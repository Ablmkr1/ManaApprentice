require('./overhaul-harness')(`
  gameState.phase='expedition'; gameState.personalWardUnlocked=true;
  getArcaneForceProgressState().xp=10000;
  Object.assign(ensureArcaneForceRankTwoState(),{rank:2,rankTwoLevel:10,rankTwoXp:500});
  getGearUpgrade('steelStaff').purchased=true;
  const c=ensureEquipmentCollection();
  const base={chest:'leatherShirt',legs:'leatherPants',feet:'travelBoots',pack:'repairedLeatherBackpack',belt:'reinforcedTonicBelt'};
  const gear={};
  for(const [slot,id] of Object.entries(base)) { gear[slot]=seed(id); c.equipped[slot]=gear[slot].id; }
  function cleanGear() { Object.values(gear).forEach(i=>{i.family=null;i.grade='standard';}); c.equipped.leftRing=null;c.equipped.rightRing=null; }
  // Every standard and greater effect is independently read from equipped state.
  for(const [family,definition] of Object.entries(ENCHANTMENTS)) {
    if(definition.region) continue;
    for(const grade of ['standard','greater']) {
      cleanGear(); const item=gear[definition.slot]; item.family=family; item.grade=grade;
      for(const [effect,value] of Object.entries(definition[grade])) {
        assert(near(effect.endsWith('Multiplier')?getEquippedPermanentImbueEffectMultiplier(effect):getEquippedPermanentImbueEffectTotal(effect), value), family+' '+grade+' exact equipped effect');
        c.equipped[definition.slot]=null;
        assert((effect.endsWith('Multiplier')?getEquippedPermanentImbueEffectMultiplier(effect):getEquippedPermanentImbueEffectTotal(effect))===(effect.endsWith('Multiplier')?1:0),family+' inactive in storage');
        c.equipped[definition.slot]=item.id;
      }
    }
  }
  cleanGear(); gear.legs.family='meditativeWeave';
  const raw=getMeditationManaRestoreForLevel(getCurrentSkillLevelDefinition('meditation'));
  assert(getMeditationManaRestoreAmount()===raw*1.25,'Meditative modifies actual Meditation');
  room('bedroom',2); getResource('mana').maxValue=100; getResource('mana').value=0;
  completeExplicitRest({context:{bedroom:true}}); assert(getResource('mana').value===25,'Standard Meditative Bedroom 25 mana');
  gear.legs.grade='greater'; completeExplicitRest({context:{bedroom:true}}); assert(getResource('mana').value===55,'Greater Meditative Bedroom 30 mana');
  cleanGear(); gear.pack.family='expansive'; syncEquippedBaseStats();
  assert(getEffectiveCarryCapacity()===65,'Expansive adds 15 to actual pack'); gear.pack.grade='greater'; assert(getEffectiveCarryCapacity()===85,'Greater Expansive adds 35');
  gear.pack.family='recall'; gear.pack.grade='standard'; assert(getAdvancedRecallCost('north').mana===3.75,'Standard Recall only discounts inventory cost');
  gear.pack.grade='greater'; assert(getAdvancedRecallCost('north').mana===0,'Greater Recall sends inventory free');
  assert(getTowerNodeJumpCost('north').mana===10,'Recall does not discount Node travel');
  cleanGear(); gear.chest.family='coreguard'; gear.legs.family='resistingWeave'; gear.legs.grade='greater';
  getResource('ward').maxValue=100; getResource('ward').value=100;
  assert(near(applyWardDamage(10,'basicAttack'),6.4),'Coreguard and Greater Resisting multiply to 0.64');
  assert(near(applyWardDamage(10,'specialAttack'),8),'Coreguard reduces special damage, Resisting does not');
  assert(near(applyWardDamage(1,'basicAttack'),0.64),'Small hits retain fractional final damage');
  assert(near(applyWardDamage(10),8),'Coreguard shared damage handles non-combat sources');
  cleanGear(); gear.legs.family='verdant';
  completeExplicitRest({context:{bedroom:true}});
  const charge=c.triggers.verdantItemId;
  startCombatEncounter('thornfang'); getResource('ward').maxValue=100; getResource('ward').value=52;
  applyWardDamage(5,'basicAttack'); assert(getResource('ward').value===62&&!c.triggers.verdantItemId,'First crossing restores 15 once');
  applyWardDamage(15,'basicAttack'); assert(getResource('ward').value===47,'Charge does not accumulate');
  c.triggers.verdantItemId=charge; getResource('ward').value=52; applyWardDamage(60,'special'); assert(getResource('ward').value===0,'Verdant does not revive broken Ward');
  resetCombatEncounter(); c.triggers.verdantItemId=null; assert(startCombatEncounter('thornfang')&&!c.triggers.verdantItemId,'Combat restart does not prepare charge'); resetCombatEncounter();

  cleanGear(); const r1=ring('mana'), r2=ring('warding'); c.equipped.leftRing=r1.id;c.equipped.rightRing=r2.id;
  const baselineLance=getArcaneCombatDamage('manaLance'), baselineMissile=getArcaneCombatCastTime('manaMissile'), baselineBolt=getArcaneCombatCastTime('manaBolt');
  r1.rune=r2.rune='earth'; assert(near(getArcaneCombatDamage('manaLance'),baselineLance*1.2),'Earth duplicates multiply Lance once');
  startCombatEncounter('brokenWarden');
  const lance=getArcaneCombatDamage('manaLance'); resolveCombatSpellHit({techniqueId:'manaLance',castId:'lance',hitIndex:1,time:1000,damage:lance});
  assert(near(gameState.combat.shellBreakDamage,lance),'Earth shell progress receives one bonus, not double'); resetCombatEncounter();
  r1.rune=r2.rune='hunter'; assert(near(getArcaneCombatCastTime('manaMissile'),baselineMissile/1.2),'Hunter speed is a divisor');
  assert(getArcaneCombatCastTime('manaBolt')===baselineBolt,'Hunter never speeds Bolt');
  r1.rune=r2.rune='verdant'; startCombatEncounter('brokenWarden'); getResource('ward').maxValue=100; getResource('ward').value=30;
  resolveCombatSpellHit({techniqueId:'manaBolt',castId:'bolt1',hitIndex:1,time:1000,damage:30}); assert(getResource('ward').value===32,'Reduced positive Bolt health damage heals two Ward');
  resolveCombatSpellHit({techniqueId:'manaBolt',castId:'bolt1',hitIndex:1,time:1000,damage:30}); assert(getResource('ward').value===32,'Repeated callback cannot repeat Bolt Ward');
  gameState.combat.conditions.buds={count:3};
  resolveCombatSpellHit({techniqueId:'manaBolt',castId:'bolt2',hitIndex:1,time:1000,damage:30}); assert(getResource('ward').value===32,'Absorbed Bolt awards no Ward');
  resetCombatEncounter(); resolveCombatSpellHit({techniqueId:'manaBolt',castId:'bolt3',hitIndex:1,time:1000,damage:30}); assert(getResource('ward').value===32,'No out-of-combat Bolt heal');

  cleanGear(); gear.belt.family='potency'; gear.belt.grade='greater'; syncEquippedBaseStats();
  getResource('mana').maxValue=100; getResource('mana').value=0; getResource('ward').maxValue=100; getResource('ward').value=20;
  getTonicSlots()[0]='majorManaTonic'; startCombatEncounter('thornfang');
  assert(useConsumableFromSlot(0)&&getResource('mana').value===14,'Greater Potency boosts actual tonic payload 40%');
  assert(getResource('ward').value===20,'Potency has no separate Ward trigger');
  gear.belt.family='wardingClasp'; getTonicSlots()[0]='majorManaTonic'; useConsumableFromSlot(0);
  assert(getResource('mana').value===24&&getResource('ward').value===32,'Clasp restores exactly 12 independent of Potency');
  assert(!useConsumableFromSlot(0)&&getResource('ward').value===32,'Failed tonic attempt does not trigger Clasp');
  resetCombatEncounter(); gear.belt.family='fieldBrewer'; gear.belt.grade='standard'; gameState.expedition.active=true; c.triggers.expeditionTonicUsed=false;
  getTonicSlots()[0]='majorManaTonic'; const manaBefore=getResource('mana').value;
  assert(useConsumableFromSlot(0)&&getTonicSlots()[0]==='majorManaTonic'&&getResource('mana').value===manaBefore+10,'First expedition tonic kept in exact slot, effect once');
  startCombatEncounter('thornfang'); resetCombatEncounter();
  const saved=createSaveData(); applyGameStateSaveData(saved.gameState);
  assert(ensureEquipmentCollection().triggers.expeditionTonicUsed,'Expedition trigger persists loading');
  assert(useConsumableFromSlot(0)&&!getTonicSlots()[0],'Second tonic consumed after combat restart/load');

  // Dungeon cap and XP follow actual successful charge application.
  gameState.equipment=c; cleanGear(); gear.pack.family='archivist'; r1.rune=r2.rune='archive'; c.equipped.leftRing=r1.id;c.equipped.rightRing=r2.id;
  const dungeon=getDungeon('arcaneArchiveDepths'); const entry=Object.entries(dungeon.nodes).find(([,node])=>node.search); const nodeId=entry[0], node=entry[1];
  node.explored=false;node.manaSenseCharges=0;
  gameState.expedition.dungeon={active:true,dungeonId:'arcaneArchiveDepths',nodeId};
  let xp=getManaSenseProgressState().xp, manaXp=getSkillState('manaControl').manaSpent, mana=getResource('mana').value;
  applyAutomaticEquipmentSense();
  assert(node.manaSenseCharges===1&&getManaSenseProgressState().xp===xp+getSpell('manaSense').cost.mana,'Archivist awards XP for one free charge');
  assert(getResource('mana').value===mana&&getSkillState('manaControl').manaSpent===manaXp,'Automatic sense spends no mana / Mana Control XP');
  applyAutomaticEquipmentSense(); assert(node.manaSenseCharges===1,'Re-entering never farms automatic charges');
  xp=getManaSenseProgressState().xp;
  completeSpellCast('manaSense',{type:'dungeonCharge',dungeonId:'arcaneArchiveDepths',nodeId});
  const cap=getSpell('manaSense').effects.maxDungeonCharges;
  assert(node.manaSenseCharges===Math.min(4,cap),'Auto, manual and two rune charges respect cap');
  assert(getManaSenseProgressState().xp===xp+(Math.min(4,cap)-1)*getSpell('manaSense').cost.mana,'Bonus XP counts only charges actually added');
  const roomSave=createSaveData(); applyGameStateSaveData(roomSave.gameState);
  xp=getManaSenseProgressState().xp; node.manaSenseCharges=0;
  applyAutomaticEquipmentSense(); applyManualEquipmentSense('arcaneArchiveDepths',nodeId);
  assert(node.manaSenseCharges===0&&getManaSenseProgressState().xp===xp,'Room trigger flags survive saves and depleted charges');
  console.log(JSON.stringify({passed}));
`);
