// Run against tests/serve-preview.cjs with Playwright available on NODE_PATH.
// Uses a disposable browser context and the preview's separate save key.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1360, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://localhost:8765/tests/overhaul-preview.html');
    await page.waitForFunction(() => gameState.towerConstructionUnlocked);
    await page.evaluate(() => {
      gameState.elementals = {};
      getBoundEarthElementalState().owned = 6;
      getResearch('elementalBinding').completed = true;
      for (const resource of ['food', 'wood', 'fiber']) {
        getResource(resource).discovered = true;
        getResource(resource).value = 0;
      }
      gameState.discoveredBerryBush = true;
      gameState.discoveredDeadfall = true;
      getExpeditionLocation('mysteriousPlants').explored = true;
      for (const action of ['gatherFood','gatherWood','gatherFiber']) getAction(action).unlocked = true;
      getResearch('simpleTraps').completed = true;
      getExpeditionLocation('strangeTrails').explored = true;
      Object.assign(getTrapSites('strangeTrails')[0], { discovered: true, installed: true, checkedThisVisit: true });
      getTrapSites('strangeTrails').forEach(site => { site.checkedThisVisit = true; });
      getResource('pelt').value = 0;
      Object.assign(getTowerNodeState('west'), { activated: true, built: true });
      changeBoundEarthElementalAssignment({type:'node',nodeName:'local',jobName:'food'});
      changeBoundEarthElementalAssignment({type:'node',nodeName:'local',jobName:'traps'});
      selectTowerEntity('heart');
    });
    await page.locator('#towerViewTab').click();
    const heart = page.locator('.elemental-tower-panel:visible');
    assert.equal(await heart.count(), 1, 'one Heart management panel');
    const text = await heart.innerText();
    assert.match(text, /Camp & Outskirts/);
    assert.match(text, /Waiting: next expedition resets traps/);
    assert.match(text, /Western Node/);
    assert.equal(await page.locator('#automationTabBtn').count(), 0);
    assert.equal(await page.locator('#automationPanel').count(), 0);
    const screenshotStyle = 'header, nav, .notification-toast { visibility: hidden !important; }';
    await heart.screenshot({ path: path.join(os.tmpdir(), 'lost-wizard-golems-desktop.png'), style: screenshotStyle });
    await page.setViewportSize({ width: 390, height: 844 });
    await heart.scrollIntoViewIfNeeded();
    await heart.screenshot({ path: path.join(os.tmpdir(), 'lost-wizard-golems-mobile.png'), style: screenshotStyle });
    const overflow = await heart.evaluate(panel => panel.scrollWidth > panel.clientWidth + 1);
    assert.equal(overflow, false, 'Heart panel fits mobile width');
    await heart.getByRole('button', { name: 'Assign one elemental to Gather Food', exact: true }).click();
    assert.equal(await page.evaluate(() => getBoundEarthElementalAssignmentCount({type:'node',nodeName:'local',jobName:'food'})), 2);
    // Hide undiscovered local content even with regional nodes already available.
    await page.evaluate(() => {
      getResource('fiber').discovered = false; getResource('fiber').value = 0;
      getResource('fiber').display.style.display = 'none';
      getExpeditionLocation('mysteriousPlants').explored = false;
      refreshBoundEarthElementalUI();
    });
    assert.equal(await heart.getByText('Gather Fiber', { exact: true }).count(), 0);
    // Exercise the real load pipeline, not only migration helpers.
    const reloadResult = await page.evaluate(() => {
      saveSuppressed = false;
      const saved = createSaveData();
      saved.version = 35;
      saved.savedAt = Date.now() - 60000;
      saved.resources.food.value = 0;
      saved.resources.manaCrystal.value = 3;
      saved.automation.manaCondenser = { unlocked:true,cycles:100,progress:12 };
      saved.gameState.elementals.earth.cycles.nodes.local.food.remaining = 60;
      localStorage.setItem(SAVE_KEY, JSON.stringify(saved));
      const loaded = loadGame();
      const food = getResource('food').value;
      const expected = 2 * 5 * getGatherResourceYield('food');
      const crystal = getResource('manaCrystal').value;
      const charge = getAutomation('manaCondenser').cycles;
      const persisted = JSON.parse(localStorage.getItem(SAVE_KEY));
      const loadedAgain = loadGame();
      saveSuppressed = true;
      return {loaded,loadedAgain,food,expected,crystal,charge,persistedFood:persisted.resources.food.value,foodAgain:getResource('food').value};
    });
    assert(reloadResult.loaded && reloadResult.loadedAgain);
    assert.equal(reloadResult.food, reloadResult.expected);
    assert.equal(reloadResult.foodAgain, reloadResult.food, 'reload does not duplicate offline deliveries');
    assert.equal(reloadResult.persistedFood, reloadResult.food);
    assert.equal(reloadResult.crystal, 3, 'retired crystal machine cannot produce offline');
    assert.equal(reloadResult.charge, 100, 'retired machine data survives full load');
    // Verify the actual construction and manual production controls move together.
    const locations = await page.evaluate(() => {
      gameState.expedition.currentLocation = 'roadsideRuin';
      gameState.expedition.active = true;
      gameState.manaCrystalImbuingUnlocked = true;
      getSpellProgressState('imbue').xp = 100000;
      getSpell('imbue').unlocked = true;
      getCampUpgrade('manaCondenserFrame').purchased = false;
      getCampUpgrade('manaCondenserFrame').unlocked = true;
      updateCraftingUIForCurrentContext();
      renderContextualCraftingSpellActions();
      return {parent:getCampUpgrade('manaCondenserFrame').button.parentElement.id,display:getCampUpgrade('manaCondenserFrame').button.style.display,manual:ui.craftingSpellActions.innerText};
    });
    assert.equal(locations.parent, 'locationPrimaryActions');
    assert.equal(locations.display, 'grid');
    assert.match(locations.manual, /Hand-Condense Mana Crystal/);
    const camp = await page.evaluate(() => {
      gameState.expedition.currentLocation = null;gameState.expedition.active = false;
      updateCraftingUIForCurrentContext();renderContextualCraftingSpellActions();
      return {display:getCampUpgrade('manaCondenserFrame').button.style.display,manual:ui.craftingSpellActions.innerText};
    });
    assert.equal(camp.display, 'none');
    assert(!camp.manual.includes('Hand-Condense Mana Crystal'));
    const manualReload = await page.evaluate(() => {
      saveSuppressed = false;
      const save = createSaveData();
      save.gameState.activity = { active: true, kind: 'spell', id: 'imbue', duration: 3, startTime: save.savedAt - 1000,
        context: { type: 'productionSpell', spellName: 'imbue', targetId: 'manaCrystal', mode: 'camp', costPaid: true } };
      save.resources.manaCrystal.value = 0;
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
      loadGame();
      const pendingElapsed = gameState.pendingCondenserActivity?.elapsed;
      gameState.expedition.currentLocation = 'roadsideRuin'; gameState.expedition.active = true;
      updateCraftingUIForCurrentContext();
      const manaBefore = getResource('mana').value;
      const focusBefore = getResource('focus').value;
      gameState.activity.startTime = getGameTime() - 4000;
      processActivityTick();
      const result = { pendingElapsed, crystals: getResource('manaCrystal').value,
        manaDelta: getResource('mana').value-manaBefore, focusDelta: getResource('focus').value-focusBefore };
      saveSuppressed = true;
      return result;
    });
    assert.equal(manualReload.pendingElapsed, 1);
    assert.equal(manualReload.crystals, 1, 'paid legacy manual production finishes once');
    assert.equal(manualReload.manaDelta, 0);
    assert.equal(manualReload.focusDelta, 0);
    // The condenser uses the live production-spell, worker and save interfaces.
    const condenser = await page.evaluate(() => {
      gameState.elementals = {}; getBoundEarthElementalState().owned = 5;
      getCampUpgrade('manaCondenserFrame').purchased = true;
      getCampUpgrade('manaCondenser').purchased = true;
      gameState.manaCondenserActivation = 0;
      gameState.expedition.active = true; gameState.expedition.currentLocation = 'roadsideRuin';
      getResource('mana').maxValue = 100; getResource('mana').value = 30;
      for (let i=0;i<3;i++) {
        castTargetedSpell('imbue',{type:'productionSpell',spellName:'imbue',targetId:'activateManaCondenser',mode:'location'});
        completeActivity();
      }
      const costs = ['roadsideRuin','silentGearworks','arcaneArchive'].map(id => {
        gameState.expedition.currentLocation = id;
        return getProductionSpellTargetContext('imbue','manaCrystal').cost;
      });
      gameState.expedition.currentLocation = 'roadsideRuin';
      updatePlacePanel(); setMainView('expedition',{userSelected:true}); ExpeditionScene.render();
      const job={type:'node',nodeName:'west',jobName:'manaCondenser'};
      changeBoundEarthElementalAssignment(job); changeBoundEarthElementalAssignment(job);
      getResource('manaCrystal').value=0;
      saveSuppressed=false;
      const save=createSaveData();save.savedAt=Date.now()-120000;
      localStorage.setItem(SAVE_KEY,JSON.stringify(save));loadGame();
      const first=getResource('manaCrystal').value;
      loadGame();const second=getResource('manaCrystal').value;
      saveSuppressed=true;
      return {costs,first,second,activation:getManaCondenserActivation(),workers:getBoundEarthElementalNodeAssignments('west').manaCondenser};
    });
    assert.deepEqual(condenser.costs,[{mana:16,focus:4},{mana:20,focus:4},{mana:20,focus:4}]);
    assert.equal(condenser.activation,3);assert.equal(condenser.workers,2);
    assert.equal(condenser.first,2);assert.equal(condenser.second,2,'condenser offline reload is idempotent');
    await page.evaluate(() => {
      resetActivity();resetCombatEncounter();gameState.phase='expedition';
      gameState.expedition.dungeon.active=false;gameState.expedition.active=true;
      gameState.expedition.regionId='west';gameState.expedition.destination=null;
      Object.assign(getExpeditionLocation('roadsideRuin'),{discovered:true,explored:true});
      setCurrentLocation('roadsideRuin');lockAction('travel');unlockAction('returnToCamp');setPackingActionsAvailable(false);
      updatePlacePanel();updateCraftingUIForCurrentContext();refreshExpeditionUI();updateRegionalMapVisibility();setMainView('expedition',{userSelected:true});ExpeditionScene.render();ExpeditionMap.close();
      document.querySelectorAll('.popup').forEach(n=>n.style.display='none');
    });
    await page.getByRole('button',{name:'Inspect Mana Condenser',exact:true}).click();
    assert.equal(await page.locator('.expedition-condenser-machinery').count(),1,'restored machinery appears after lattice');
    assert.match(await page.locator('#expeditionDetailInfo').innerText(),/16 Mana \+ 4 Focus/);
    await page.screenshot({path:path.join(os.tmpdir(),'mana-condenser-mobile.png')});
    await page.setViewportSize({width:1360,height:1000});
    await page.screenshot({path:path.join(os.tmpdir(),'mana-condenser-desktop.png')});
    await page.evaluate(() => {getCampUpgrade('manaCondenser').purchased=false;ExpeditionScene.render();});
    assert.equal(await page.locator('.expedition-condenser-machinery').count(),0,'machinery stays hidden before installation');
    assert.deepEqual(errors, []);
    console.log('Browser checks passed: desktop/mobile Heart controls, discovery gating, full save reload/offline idempotence, Western construction/manual controls, no runtime errors.');
    console.log(path.join(os.tmpdir(), 'lost-wizard-golems-desktop.png'));
    console.log(path.join(os.tmpdir(), 'lost-wizard-golems-mobile.png'));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
