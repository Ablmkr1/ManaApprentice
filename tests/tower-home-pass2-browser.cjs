const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      const interval = window.setInterval;
      window.setInterval = (fn, ...args) => fn.name === 'gameTick' ? 0 : interval(fn, ...args);
    });
    await page.goto('http://localhost:8765/tests/overhaul-preview.html');
    await page.waitForFunction(() => gameState.towerConstructionUnlocked);
    await page.evaluate(() => {
      resetActivity(); resetCombatEncounter(); endExpedition('recall');
      gameState.towerHome = { relocated: false };
      gameState.wardenCoreRecovered = true;
      getResearch('longRangeNetwork').unlocked = true;
      getProjectState('towerFoundation').completed = true;
      getProjectState('towerBasement').completed = true;
      for (const id of ['bedroom','workshop','forge','library','alchemyRoom','enchantingStudy']) Object.assign(getTowerRoomState(id), { unlocked:true, level:1, completed:false });
      getTowerRoomState('bedroom').level = 0;
      refreshGameUIAfterLoad();
    });
    assert(await page.locator('#towerMoveInObjective').isVisible(), 'parallel objective visible');
    assert(await page.getByRole('button', { name: /^Move Into the Tower/ }).isDisabled(), 'missing functional room blocks move');
    await page.locator('#towerMoveInObjective').getByRole('button', { name:'Functional Bedroom', exact:true }).click();
    assert.equal(await page.evaluate(() => gameState.tower.selectedId), 'room:bedroom', 'unfinished requirement links to room');
    await page.evaluate(() => { getTowerRoomState('bedroom').level = 1; updateAllActionButtons(); });
    const goal = await page.evaluate(() => gameState.currentGoalId);
    await page.getByRole('button', { name:/^Move Into the Tower/ }).click();
    assert.equal(await page.evaluate(() => gameState.activity.kind), 'towerMoveIn');
    await page.evaluate(() => { gameState.activity.startTime = getGameTime() - 6000; processActivityTick(); });
    assert.equal(await page.evaluate(() => currentMainView), 'tower');
    assert.equal(await page.evaluate(() => gameState.currentGoalId), goal, 'objective not replaced');
    assert(!await page.locator('#towerMoveInObjective').isVisible(), 'one-time objective retires');
    if (await page.locator('#towerEstablishedPopup').isVisible()) await page.locator('#towerEstablishedContinueBtn').click();
    await page.getByRole('button', { name:'Visit Tower Grounds', exact:true }).click();
    assert.equal(await page.evaluate(() => currentMainView), 'home');
    assert.equal(await page.locator('#homeClearingTitle').innerText(), 'Tower Grounds');
    assert(!await page.locator('[data-home-area="workbench"]').isVisible(), 'indoor workbench retired');
    assert(await page.locator('[data-home-area="wood"]').isVisible(), 'outdoor wood retained');
    await page.locator('[data-home-area="wood"]').click();
    assert(await page.locator('#homeAreaContent [data-action="gatherWood"]').isVisible(), 'gathering reachable');
    await page.locator('[data-home-area="water"]').click();
    assert(await page.locator('#homeAreaContent [data-action="gatherWater"]').isVisible(), 'water gathering reachable');
    await page.locator('[data-home-area="tower"]').click();
    assert.equal(await page.evaluate(() => currentMainView), 'tower', 'grounds links directly home');
    await page.evaluate(() => { selectTowerEntity('room:forge'); getResource('fuel').value = 0; updateAllResources(); });
    assert(!await page.locator('#processingFuelSection').isVisible(), 'fuel controls retired');
    assert(!await page.locator('#fuelAmount').isVisible(), 'stored fuel hidden');
    for (const reason of ['manual','recall','forced']) {
      const result = await page.evaluate(reason => {
        resetActivity(); resetCombatEncounter();
        gameState.expedition.active = true; gameState.expedition.currentLocation = 'minersCamp';
        setMainView('home', { userSelected:true });
        const awayDenied = !hasHomeStation('workbench') && !getActiveCraftContext(getResourceCraft('leather'));
        if (reason === 'forced') {
          Object.assign(gameState.combat, {active:true, resolved:false, enemyId:'minorEarthElemental'});
          resolveCombatDefeat();
        } else beginReturnToCamp(reason);
        return {awayDenied, view:currentMainView, active:gameState.expedition.active};
      }, reason);
      assert.deepEqual(result, {awayDenied:true, view:'tower', active:false}, reason + ' arrival routes home');
    }
    await page.evaluate(() => {
      resetCombatEncounter();
      localStorage.setItem(SAVE_KEY, JSON.stringify(createSaveData()));
      gameState.towerHome.relocated = false;
      loadGame(); setMainView('home', {userSelected:true});
    });
    assert.equal(await page.evaluate(() => currentMainView), 'tower', 'saved home routing restored');
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(() => setMainView('grounds', {userSelected:true}));
    assert(await page.locator('[data-home-area="tower"]').isVisible(), 'mobile grounds has tower navigation');
    assert.deepEqual(errors, []);
    console.log('Tower home pass 2 browser checks passed');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

