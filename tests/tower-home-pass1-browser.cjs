const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => {
      const interval = window.setInterval;
      window.setInterval = (fn, ...args) => fn.name === 'gameTick' ? 0 : interval(fn, ...args);
    });
    await page.goto('http://localhost:8765/tests/overhaul-preview.html');
    await page.waitForFunction(() => gameState.towerConstructionUnlocked);
    await page.evaluate(() => {
      resetActivity(); resetCombatEncounter(); endExpedition('recall');
      for (const id of ['bedroom', 'library', 'workshop', 'forge', 'alchemyRoom']) Object.assign(getTowerRoomState(id), { level: 1, completed: false, unlocked: true });
      for (const id of ['workbench', 'campTannery', 'campSmelter', 'campAlchemyStation', 'meditationSpot', 'researchBench']) getCampUpgrade(id).purchased = false;
      refreshGameUIAfterLoad();
      setMainView('tower', { userSelected: true });
    });
    async function room(id) {
      await page.evaluate(id => {
        gameState.tower.selectedId = id === 'basement' ? id : 'room:' + id;
        renderTowerDetailPanel(); updateCraftingUIForCurrentContext(); updateAllActionButtons();
      }, id);
    }
    await room('library');
    assert(await page.locator('#towerHomeFunctions #researchPanel').isVisible(), 'research mounted');
    assert(await page.locator('#towerHomeFunctions #trainingSection').isVisible(), 'training mounted');
    await room('bedroom');
    assert(await page.locator('#towerHomeFunctions [data-action="meditate"]').isVisible(), 'meditation mounted');
    assert(await page.evaluate(() => isActionContextAvailable('meditate')), 'bedroom meditation without camp spot');
    await room('workshop');
    assert(await page.evaluate(() => Object.keys(getGearUpgradeDefinitions()).filter(id => !isWearableGear(id)).every(id => getGearUpgrade(id).button?.parentElement.id === 'towerHomeFunctions')), 'all ordinary gear definitions mounted');
    assert(await page.evaluate(() => getActiveCraftContext(getResourceCraft('leather')).cost.pelt === 3), 'home leather');
    assert(await page.locator('#towerHomeFunctions #craftingSpellActions').count() === 1, 'context magic mounted');
    const batchStart = await page.evaluate(() => {
      getResource('leather').value = 0; getResource('pelt').value = 20; getResource('energy').value = 100;
      if (!startTowerBatch('resource', 'leather', 1)) throw Error('Cannot start leather');
      return gameState.activity.startTime;
    });
    await room('library');
    await page.evaluate(() => setMainView('character', { userSelected: true }));
    await page.evaluate(() => setMainView('tower', { userSelected: true }));
    assert.equal(await page.evaluate(() => gameState.activity.startTime), batchStart, 'navigation preserves activity');
    assert(await page.evaluate(() => {
      completeActivity(); resetActivity();
      return getResource('leather').value === 1 && getResource('pelt').value === 17;
    }), 'navigation preserves production and exact costs');
    for (const id of ['forge', 'alchemyRoom']) {
      await room(id);
      assert(await page.locator('#towerHomeFunctions #processingFuelSection').isVisible(), id + ' fuel');
    }
    await room('basement');
    assert(await page.locator('#towerHomeFunctions #campResourcesSection').isVisible(), 'stockpile mounted');
    await page.getByRole('button', { name: 'Prepare and pack here', exact: true }).click();
    assert(await page.locator('#towerHomeFunctions #packingSection').isVisible(), 'packing mounted');
    await page.evaluate(() => setMainView('home', { userSelected: true }));
    assert(await page.locator('#towerHomeFunctions #campResourcesSection').count() === 0, 'stockpile restored');
    await page.evaluate(() => setMainView('tower', { userSelected: true }));
    assert(await page.locator('#towerHomeFunctions #campResourcesSection').isVisible(), 'stockpile remounted');
    const persisted = await page.evaluate(() => {
      endExpedition('recall'); resetActivity();
      gameState.tower.selectedId = 'room:workshop';
      getResource('leather').value = 7; getResource('fuel').value = 11;
      localStorage.setItem(SAVE_KEY, JSON.stringify(createSaveData()));
      getResource('leather').value = 0; getResource('fuel').value = 0;
      const loaded = loadGame();
      return { loaded, leather: getResource('leather').value, fuel: getResource('fuel').value, workshop: isTowerRoomCompleted('workshop'), tannery: hasPurchasedCampUpgrade('campTannery') };
    });
    assert.deepEqual(persisted, { loaded: true, leather: 7, fuel: 11, workshop: true, tannery: false });
    const early = await browser.newPage();
    await early.goto('http://localhost:8765/');
    assert(await early.evaluate(() => {
      localStorage.setItem(SAVE_KEY, JSON.stringify(createSaveData()));
      return loadGame() && gameState.phase === 'lost' && !hasHomeStation('workbench') && getAction('explore').unlocked;
    }), 'early save loads without tower access');
    assert.deepEqual(errors, []);
    console.log('Tower home browser checks passed');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
