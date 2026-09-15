// Disposable-save browser coverage for the parchment control layer.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1360, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => {
      const interval = window.setInterval;
      window.setInterval = (fn, ...args) => fn.name === 'gameTick' ? 0 : interval(fn, ...args);
    });
    await page.goto('http://localhost:8765/tests/overhaul-preview.html');
    await page.waitForFunction(() => gameState.towerConstructionUnlocked);
    await page.addStyleTag({ content: '.popup,.notification-toast{display:none!important}' });
    await page.evaluate(() => {
      resetActivity(); resetCombatEncounter(); endExpedition('recall');
      gameState.phase = 'expedition'; gameState.towerConstructionUnlocked = false; gameState.oldMapFound = false;
      gameState.magic.sensedReveals.campFoundation = false;
      for (const id of ['towerFoundation','towerBasement','towerFloor1','towerFloor2']) {
        Object.assign(getProjectState(id), { completed: false, unlocked: false, work: 0, deposits: {}, level: 0 });
      }
      for (const l of Object.values(getExpeditionLocationDefinitions())) l.discovered = false;
      for (const r of ['outskirts','north','east','south','west']) getRegionState(r).unlocked = r === 'outskirts';
      for (const r of ['north','east','south','west']) Object.assign(getTowerNodeState(r), { built: false, activated: false, researchUnlocked: false });
      for (const id of ['smallFire','crudeLeanTo']) getCampUpgrade(id).purchased = true;
      for (const id of ['smallHut','framedShelter','lessCrudeShelter','stoneFirePit']) getCampUpgrade(id).purchased = false;
      getCampUpgrade('workbench').purchased = false;
      getCampUpgrade('manaCondenser').purchased = false;
      gameState.northernDisturbance.resolved = false;
      refreshExpeditionUI(); ExpeditionScene.render(); setMainView('expedition', { userSelected: true });
    });
    const map = page.locator('#expeditionWorldMap');
    const object = id => map.locator('[data-overlay="' + id + '"]');
    const select = async id => {
      const b = map.locator('[data-region="' + id + '"]');
      await b.focus(); await page.keyboard.press('Enter');
    };
    const shot = async name => {
      await map.scrollIntoViewIfNeeded();
      await map.screenshot({ path: 'tests/expedition-screenshots/parchment-' + name + '.png', style: '.top-bar, #mainViewTabs, .notification-stack { visibility: hidden !important; }' });
    };
    assert.equal(await map.isVisible(), false, 'parchment stays locked before the old map is found');
    assert.equal(await page.locator('#expeditionMapOpen').isVisible(), false, 'map control stays hidden before discovery');
    assert(await page.locator('#expeditionSurface').isVisible(), 'pre-map Expedition entry shows the Outskirts interface');
    assert.match(await page.locator('#expeditionSurface').getAttribute('data-scene'), /^outskirts:/);
    assert.match(await page.locator('#expeditionArt img').getAttribute('src'), /outskirts-map\.png$/);
    await page.evaluate(() => { gameState.oldMapFound = true; setMainView('expedition', { userSelected: true }); });
    assert(await map.isVisible(), 'Expedition opens map by default');
    assert.equal(await map.locator('.world-map-region').count(), 5);
    assert.equal(await map.locator('[data-location]').count(), 0);
    assert.equal(await object('camp').count(), 1);
    assert.equal(await object('camp-fire').count(), 1);
    assert.equal(await object('camp-shelter').count(), 1);
    assert.equal(await object('foundation').count(), 0);
    assert.equal(await object('tower-ground-floor').count(), 0);
    await select('north');
    assert.match(await map.locator('.world-map-detail').textContent(), /route fades/);
    assert.equal(await map.locator('.world-map-detail button').count(), 0);
    await select('outskirts'); await shot('early-desktop');
    const before = await page.evaluate(() => JSON.stringify(gameState));
    await select('east'); await select('outskirts');
    assert.equal(await page.evaluate(() => JSON.stringify(gameState)), before, 'inspection does not mutate save state');
    await page.evaluate(() => { gameState.magic.sensedReveals.campFoundation = true; ExpeditionMap.sync(); });
    assert.equal(await object('foundation').count(), 1);
    assert.equal(await object('camp').count(), 0);
    assert.equal(await object('camp-fire').count(), 0);
    await shot('foundation');
    await page.evaluate(() => { Object.assign(getProjectState('towerFoundation'), { unlocked: true, deposits: { stone: 1 } }); ExpeditionMap.sync(); });
    assert.equal(await object('foundation').count(), 0);
    assert.equal(await object('tower-ground-floor').count(), 1);
    assert.equal(await object('tower-ground-floor').evaluate(n => n.style.getPropertyValue('--x')), '50%');
    await shot('construction');
    await page.evaluate(() => { Object.assign(getProjectState('towerFloor2'), { unlocked: true, work: 1 }); ExpeditionMap.sync(); });
    assert.equal(await object('tower-expanded').count(), 0, 'finished roof waits for completed upper floor');
    await page.evaluate(() => { Object.assign(getProjectState('towerFloor2'), { unlocked: true, completed: true }); ExpeditionMap.sync(); });
    assert.equal(await object('tower-expanded').count(), 1);
    await page.evaluate(() => {
      for (const r of ['north','east','south','west']) getRegionState(r).unlocked = true;
      for (const id of ['foothillScree','stagRuns','wildHerbPatch','roadsideRuin']) Object.assign(getExpeditionLocation(id), { discovered: true, explored: false });
      ExpeditionMap.sync();
    });
    assert.deepEqual((await map.locator('[data-location]').evaluateAll(ns => ns.map(n => n.dataset.location))).sort(), ['foothillScree','roadsideRuin','stagRuns','wildHerbPatch']);
    for (const id of ['north-node','ironMine','huntersCabin','alchemistsHut','arcaneArchive','glass-antler-stag','western-condenser','north-elemental','roadsideRuin-dungeon']) assert.equal(await object(id).count(), 0, id + ' hidden');
    await shot('partial-desktop');
    await page.evaluate(() => {
      for (const id of ['minersCamp','quietGrove','arcaneArchive','ironMine']) Object.assign(getExpeditionLocation(id), { discovered: true, explored: false });
      getTowerNodeState('north').activated = true;
      getTowerNodeState('west').activated = true;
      gameState.archiveDoorOpened = false;
      ExpeditionMap.sync();
    });
    assert.equal(await object('north-node').count(), 1);
    assert.equal(await object('west-node').count(), 0);
    assert.equal(await object('glass-antler-stag').count(), 0);
    await page.evaluate(() => {
      getExpeditionLocation('quietGrove').explored = true;
      getExpeditionLocation('roadsideRuin').explored = true;
      getExpeditionLocation('arcaneArchive').explored = true;
      gameState.archiveDoorOpened = true;
      gameState.northernDisturbance.resolved = true;
      getCampUpgrade('manaCondenser').purchased = true;
      getTowerNodeState('north').built = true;
      ExpeditionMap.sync();
    });
    for (const id of ['glass-antler-stag','west-node','western-condenser','north-elemental','roadsideRuin-dungeon']) assert.equal(await object(id).count(), 1, id + ' revealed');
    assert.match(await object('north-node').getAttribute('aria-label'), /Built/);
    const anchor = object('north-node');
    await anchor.focus();
    await page.evaluate(() => { for (let i = 0; i < 4; i++) ExpeditionMap.sync(); });
    assert(await anchor.evaluate(n => n === document.activeElement), 'tick preserves focus');
    await shot('discovered-desktop');
    for (const width of [1360, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      for (const r of ['outskirts','north','east','south','west']) {
        await select(r);
        await map.getByRole('button', { name: 'Enter ' + ({outskirts:'Outskirts',north:'Northern Reach',east:'Eastern Wilds',south:'Southern Fen',west:'Western Ruins'}[r]), exact: true }).click();
        assert.equal(await map.isVisible(), false);
        assert.equal(await page.evaluate(() => gameState.world.selectedRegion), r);
        await page.locator('#expeditionMapOpen').click();
        assert(await map.isVisible());
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no page overflow ' + width);
      assert(await map.evaluate(n => n.scrollWidth <= n.clientWidth), 'panel fits ' + width);
      assert(await map.locator('.world-map-object').evaluateAll(ns => ns.every(n => { const b = n.getBoundingClientRect(); return b.width >= 44 && b.height >= 44; })), '44px objects');
      await shot('layout-' + width);
    }
    // Actual pointer taps pan into view and retain the percentage position on press.
    await object('ironMine').scrollIntoViewIfNeeded();
    await object('ironMine').click();
    assert.match(await map.locator('.world-map-detail h3').textContent(), /Iron Mine/);
    await map.getByRole('button', { name: 'Prepare travel here', exact: true }).click();
    await page.evaluate(() => processActivityTick());
    assert.equal(await page.evaluate(() => gameState.expedition.destination), 'ironMine');
    assert.equal(await page.evaluate(() => gameState.expedition.routeType === EXPEDITION_ROUTE_DESTINATION), true);
    await page.evaluate(() => {
      resetActivity(); Object.assign(gameState.expedition, { active: true, regionId: 'west', destination: null });
      gameState.phase = 'expedition';
      getExpeditionLocation('silentGearworks').discovered = true;
      setCurrentLocation('roadsideRuin'); updatePlacePanel();
      updateLocationActions(); refreshExpeditionUI(); updateAllActionButtons(); ExpeditionMap.open();
    });
    assert.equal(await object('roadsideRuin').getAttribute('aria-current'), 'location');
    await object('roadsideRuin').click();
    await map.getByRole('button', { name: 'Return to location scene', exact: true }).click();
    assert.equal(await page.locator('#expeditionArt img').getAttribute('src'), 'assets/expedition/roadside-ruin.png');
    await page.locator('#expeditionMapOpen').click();
    await object('silentGearworks').click();
    await map.locator('.world-map-detail button').click();
    assert.equal(await page.evaluate(() => gameState.expedition.destination), 'silentGearworks');
    assert.equal(await page.evaluate(() => gameState.expedition.routeType === EXPEDITION_ROUTE_INTRA_REGION), true);
    await page.locator('#expeditionMapOpen').click();
    await object('roadsideRuin').click();
    assert.match(await map.locator('.world-map-detail').textContent(), /Finish the current activity/);
    await page.keyboard.press('Escape');
    assert.equal(await map.isVisible(), false);
    await page.evaluate(() => setMainView('expedition', { userSelected: true }));
    assert(await map.isVisible(), 'tab re-entry resets navigation to map');
    await page.evaluate(async () => { await Promise.all([...document.querySelectorAll('#expeditionWorldMap img')].map(i => i.decode())); });
    assert.deepEqual(errors, []);
    console.log('Parchment map: progression gates, all regional flows at 1360/390/320, focus, current location, state safety and canonical travel passed.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });

