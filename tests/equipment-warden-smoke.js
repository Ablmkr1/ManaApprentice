require('./overhaul-harness')(`
  gameState.phase='expedition';gameState.personalWardUnlocked=true;
  getArcaneForceProgressState().xp=150;
  Object.assign(ensureArcaneForceRankTwoState(),{rank:2,rankTwoLevel:10,rankTwoXp:500});
  Object.assign(getSkillState('manaCycling'),{rank:2,level:10,manaXp:500});
  Object.assign(getSpellProgressState('ward'),{level:5,xp:10000});
  getAttunementProgressState().xp=10000;
  Object.assign(getAttunementState(),{rank:2,rankTwoLevel:10,active:[{id:'manaConduit'},{id:'hardenedWard'}]});
  getGearUpgrade('steelStaff').purchased=true;
  const results=[];
  for (const strategy of ['bolt exposure','lance exposure']) for(const [label,chest,rings,runes] of [
    ['balanced','reservoirWeave',['mana','warding'],[null,null]],
    ['mana specialist','reservoirWeave',['mana','mana'],['earth','earth']],
    ['defensive specialist','coreguard',['warding','warding'],['hunter','hunter']]
  ]) {
    resetCombatEncounter();testGameTime=0;gameState.equipment=newEquipmentCollection();
    const c=ensureEquipmentCollection();
    for(const [slot,base,family,grade] of [['chest','leatherShirt',chest,chest==='coreguard'?'standard':'greater'],['legs','leatherPants','resistingWeave','greater'],['belt','reinforcedTonicBelt','potency','greater']]) {
      const item=seed(base,family,grade);c.equipped[slot]=item.id;
    }
    c.equipped.leftRing=ring(rings[0],runes[0],'greater').id;c.equipped.rightRing=ring(rings[1],runes[1],'greater').id;
    syncEquippedBaseStats();recalculateCharacterStats();
    const mana=getResource('mana'),ward=getResource('ward');mana.value=mana.maxValue;ward.value=ward.maxValue;
    getTonicSlots().fill('majorManaTonic');
    const initialMana=mana.value,initialWard=ward.value;
    assert(startCombatEncounter('brokenWarden'),'Start Warden with '+label);
    let casts=0,tonics=0,spent=0;
    while(isCombatActive()&&casts++<100) {
      const combat=gameState.combat;
      const id=combat.phase==='armored'?'manaLance':combat.conditions.repairSigils?.count?'manaMissile':strategy==='lance exposure'&&combat.enemyHealth>getArcaneCombatDamage('manaBolt')?'manaLance':'manaBolt';
      if(mana.value<getArcaneCombatManaCost(id)) {
        const slot=getTonicSlots().findIndex(Boolean);
        if(slot<0||!useConsumableFromSlot(slot)) break;
        tonics++;continue;
      }
      const before=mana.value;
      if(!startArcaneCombatCast(id)) break;
      testGameTime=gameState.combat.cast.endTime;processCombatTick();
      if(id==='manaMissile'){testGameTime+=200;processCombatTick();}
      spent+=before-mana.value;
    }
    results.push({label,strategy,mana:initialMana,ward:initialWard,win:gameState.combat.enemyHealth===0,enemyHealth:gameState.combat.enemyHealth,manaSpent:Math.round(spent*100)/100,wardRemaining:ward.value,tonics,seconds:Math.round(testGameTime)/1000});
    assert(initialMana===(label==='balanced'?195:label==='mana specialist'?220:130),'Actual derived Mana for '+label);
    assert(initialWard===(label==='balanced'?115:label==='mana specialist'?90:140),'Actual derived Ward for '+label);
  }
  assert(results[1].win,'Mana specialist can defeat unchanged Warden');
  assert(results.filter(result=>result.strategy==='lance exposure').every(result=>result.win),'All three builds win with mana-efficient exposed Lance strategy');
  assert(COMBAT_CONFIG.enemies.brokenWarden.maxHealth===850,'Warden remains unchanged');
  console.log(JSON.stringify({passed,results}));
`);
