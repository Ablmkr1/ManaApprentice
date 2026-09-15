// Real action handlers, deterministic time, and the disposable preview save.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1360, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      const interval = window.setInterval;
      window.setInterval = (fn, ...args) => fn.name === 'gameTick' ? 0 : interval(fn, ...args);
    });
    await page.goto('http://localhost:8765/tests/overhaul-preview.html');
    await page.waitForFunction(() => gameState.towerConstructionUnlocked);
    await page.evaluate(() => {
      window.directQA = {
        refresh() {
          updateLocationActions(); updateCraftingUIForCurrentContext(); updatePlacePanel();
          updateAllActionButtons(); refreshExpeditionUI();
          setMainView('expedition', { userSelected: true }); ExpeditionMap.close(); ExpeditionScene.render();
          document.querySelectorAll('.popup').forEach(n => n.style.display = 'none');
        },
        location(id, explored = true) {
          stopAutoAction(); resetActivity(); resetCombatEncounter();
          gameState.expedition.dungeon.active = false;
          gameState.phase = 'expedition';
          Object.assign(gameState.expedition, { active: true, regionId: getLocationRegionId(getExpeditionLocation(id)), destination: null });
          Object.assign(getExpeditionLocation(id), { discovered: true, explored, explorationProgress: 0 });
          setCurrentLocation(id); this.refresh();
        },
        finish() {
          gameState.activity.startTime = getGameTime() - gameState.activity.duration * 1000 - 1;
          processActivityTick(); this.refresh();
        },
      };
      directQA.location('stagRuns'); getHuntData('stagRuns').tracked = false; directQA.refresh();
    });
    const action = id => page.locator('[data-direct-key="action:' + id + '"]');
    const spell = id => page.locator('[data-direct-key="spell:' + id + '"]');
    const marker = id => page.locator('[data-landmark="' + id + '"]');
    const panel = page.locator('#expeditionDetail');
    const finish = () => page.evaluate(() => directQA.finish());
    await page.evaluate(() => { gameState.expedition.carriedItems = { fiber: 2, stone: 1 }; gameState.expedition.water = 3; gameState.expedition.waterCapacity = 10; directQA.refresh(); });
    assert.equal(await page.locator('#expeditionPackStatus').innerText(), await page.evaluate(() =>
      'Pack ' + formatCarryAmount(getCarriedTotal()) + ' / ' + formatCarryAmount(getEffectiveCarryCapacity()) + ' · ' + getCarriedSummary()
    ));
    assert.match(await page.locator('#expeditionPackStatus').innerText(), /Fiber: 2, Stone: 1/);
    assert.equal(await page.locator('#expeditionWaterStatus').innerText(), 'Water 3 / 10');
    assert(await page.locator('#expeditionWaterStatus').isVisible());
    assert.equal(await page.locator('#expeditionTaskStatus').count(), 0, 'redundant task status is absent');
    // Art markers invoke the exact existing handler, without an inspection click.
    const energy = await page.evaluate(() => getResource('energy').value);
    const cost = await page.evaluate(() => getActionCost('trackGame').energy);
    await marker('tracks').click();
    assert.equal(await page.evaluate(() => gameState.activity.id), 'trackGame');
    assert.equal(await page.evaluate(() => getResource('energy').value), energy - cost);
    assert.equal(await panel.isVisible(), false);
    assert(await action('huntGame').isDisabled());
    const beforeRepeat = await page.evaluate(() => [gameState.activity.startTime, getResource('energy').value]);
    await marker('tracks').evaluate(n => n.click());
    assert.deepEqual(await page.evaluate(() => [gameState.activity.startTime, getResource('energy').value]), beforeRepeat, 'second click cannot charge/start again');
    await finish();
    assert(await page.evaluate(() => getHuntData('stagRuns').tracked));
    await marker('hunt').focus(); await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => gameState.activity.id), 'huntGame');
    assert.equal(await panel.isVisible(), false);
    await finish();
    assert.equal(await page.evaluate(() => getHuntData('stagRuns').tracked), false);
    // Target binding, mana shortfall, busy gating, progress and stable focus.
    await page.evaluate(() => { getResource('mana').value = 0; directQA.refresh(); });
    assert(await spell('sensePrey').isDisabled());
    assert.match(await spell('sensePrey').innerText(), /Need .*Mana/i);
    await page.evaluate(() => { getResource('mana').value = getResource('mana').maxValue; directQA.refresh(); });
    const mana = await page.evaluate(() => getResource('mana').value);
    await spell('sensePrey').click();
    assert.equal(await page.evaluate(() => gameState.activity.context.targetId), 'sensePrey');
    assert.equal(await page.evaluate(() => getResource('mana').value), mana - 4);
    assert(await action('trackGame').isDisabled());
    await page.evaluate(() => {
      window.directFocus = document.activeElement; window.directScroll = scrollY;
      gameState.activity.startTime = getGameTime() - gameState.activity.duration * 500;
      for (let i = 0; i < 20; i++) ExpeditionScene.render();
    });
    assert(await page.evaluate(() => document.activeElement === directFocus && scrollY === directScroll));
    assert(parseFloat(await spell('sensePrey').locator('.progressFill').evaluate(n => n.style.width)) > 0);
    await finish();
    assert(await page.evaluate(() => getHuntData('stagRuns').tracked));
    assert(await spell('sensePrey').isDisabled());
    // A source becoming unavailable between paint and click must be rechecked.
    await page.evaluate(() => { getHuntData('stagRuns').tracked = false; directQA.refresh(); getResource('energy').value = 0; });
    await action('trackGame').evaluate(n => n.click());
    assert.equal(await page.evaluate(() => isActivityActive()), false);
    await page.evaluate(() => { getResource('energy').value = getResource('energy').maxValue; getResource('huntingLure').value = 1; directQA.refresh(); });
    await action('useHuntingLure').click();
    if (await page.evaluate(() => isActivityActive())) await finish();
    assert(await page.evaluate(() => getHuntData('stagRuns').tracked));
    // Direct exploration, separate Stone Sense, and unchanged repeat gathering.
    await page.evaluate(() => directQA.location('foothillScree', false));
    await marker('survey').click();
    assert.equal(await page.evaluate(() => gameState.activity.id), 'exploreLocation');
    await finish();
    assert(await marker('survey').isDisabled());
    await spell('stoneSense').click();
    assert.equal(await page.evaluate(() => gameState.activity.context.targetId), 'stoneSense');
    await finish();
    assert(await page.evaluate(() => hasStoneSenseActive()));
    await marker('scree').click();
    assert.equal(await page.evaluate(() => gameState.activity.id), 'gatherStone');
    assert.match(await page.locator('#expeditionDirectInfo').innerText(), /Ore find chance/);
    await page.evaluate(() => { stopAutoAction(); resetActivity(); directQA.refresh(); });
    // Utility sections stay reachable without selecting a panel.
    await page.evaluate(() => directQA.location('creepyCave'));
    assert(await page.locator('#expeditionLocalUtilities').isVisible());
    assert(await page.locator('#expeditionLocalUtilities [data-action="meditate"]').isVisible());
    await page.evaluate(() => {
      directQA.location('ironMine'); window.directPick = getGearUpgrade('crudeIronPick').purchased;
      getGearUpgrade('crudeIronPick').purchased = false; directQA.refresh();
    });
    assert(await action('mineStone').isDisabled());
    assert(await action('mineIron').isDisabled());
    assert.match(await action('mineStone').innerText(), /Requires Crude Iron Pick/);
    await page.evaluate(() => { getGearUpgrade('crudeIronPick').purchased = directPick; });
    await page.evaluate(() => directQA.location('stagRuns'));
    assert.equal(await page.evaluate(() => hasStoneSenseActive()), false);
    await page.evaluate(() => { getSpell('manaSense').unlocked = false; directQA.refresh(); });
    assert.equal(await spell('sensePrey').isVisible(), false);
    await page.evaluate(() => { getSpell('manaSense').unlocked = true; directQA.refresh(); });
    // Stable, accessible controls fit all supported viewport sizes.
    fs.mkdirSync('tests/expedition-screenshots', { recursive: true });
    for (const width of [1360, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.locator('#expeditionDirectActions').scrollIntoViewIfNeeded();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const boxes = await page.locator('#expeditionDirectActions > button:visible').evaluateAll(nodes => nodes.map(n => { const r = n.getBoundingClientRect(); return { x:r.x, y:r.y, right:r.right, bottom:r.bottom, height:r.height }; }));
      for (let i = 0; i < boxes.length; i++) {
        assert(boxes[i].height >= 44);
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i], b = boxes[j];
          assert(a.right <= b.x || b.right <= a.x || a.bottom <= b.y || b.bottom <= a.y);
        }
      }
      await page.locator('#expeditionPanel').screenshot({ path: 'tests/expedition-screenshots/direct-actions-' + width + '.png', style: '.top-bar, #mainViewTabs, .notification-stack, .notification-toast { visibility: hidden !important; }' });
    }
    assert.deepEqual(errors, []);
    console.log('Direct actions passed: one-click markers, keyboard, costs, repeat clicks, sensing, stale availability, lure, exploration, utilities, focus, progress and responsive layouts.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
