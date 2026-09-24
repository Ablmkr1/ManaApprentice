const { chromium } = require('playwright');
const assert = require('node:assert/strict');

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
      window.imageQA = {
        refresh() {
          updateLocationActions(); updateAllActionButtons(); updatePlacePanel();
          refreshExpeditionUI(); setMainView('expedition', { userSelected: true });
          ExpeditionMap.close(); ExpeditionScene.render();
          document.querySelectorAll('.popup').forEach(n => n.style.display = 'none');
        },
        location(id) {
          stopAutoAction(); resetActivity(); resetCombatEncounter();
          gameState.expedition.dungeon.active = false;
          gameState.phase = 'expedition';
          Object.assign(gameState.expedition, { active: true, regionId: getLocationRegionId(getExpeditionLocation(id)), destination: null });
          Object.assign(getExpeditionLocation(id), { discovered: true, explored: true, explorationProgress: 0 });
          setCurrentLocation(id); this.refresh();
        },
        finish() {
          gameState.activity.startTime = getGameTime() - gameState.activity.duration * 1000 - 1;
          processActivityTick(); stopAutoAction(); resetActivity(); this.refresh();
        },
      };
      getResource('energy').value = getResource('energy').maxValue;
      getResource('mana').value = getResource('mana').maxValue;
      gameState.expedition.carriedItems = {};
      imageQA.location('ironMine');
    });
    const marker = id => page.locator('[data-landmark="' + id + '"]');
    const action = id => page.locator('[data-direct-key="action:' + id + '"]');
    const spell = id => page.locator('[data-direct-key="spell:' + id + '"]');
    assert(await marker('mine').isVisible(), 'Stone Mining picture marker remains visible after exploration');
    assert(await marker('ore').isVisible(), 'Iron Ore picture marker is visible when the action is unlocked');
    await page.evaluate(() => { getAction('mineIron').unlocked = false; ExpeditionScene.render(); });
    assert.equal(await marker('ore').isVisible(), false);
    await page.evaluate(() => { getAction('mineIron').unlocked = true; imageQA.refresh(); });
    await page.evaluate(() => { getGearUpgrade('crudeIronPick').purchased = false; imageQA.refresh(); });
    assert(await marker('mine').isDisabled());
    assert(await marker('ore').isDisabled());
    assert(await action('mineIron').isDisabled());
    await page.evaluate(() => { getGearUpgrade('crudeIronPick').purchased = true; recalculateToolEffects(); imageQA.refresh(); });
    assert.equal(await marker('ore').isDisabled(), await action('mineIron').isDisabled());
    await page.setViewportSize({ width: 320, height: 844 });
    await marker('mine').click({ trial: true });
    await marker('ore').click({ trial: true });
    await page.setViewportSize({ width: 1360, height: 1000 });
    const mineBefore = await page.evaluate(() => ({ energy: getResource('energy').value, ore: gameState.expedition.carriedItems.ore || 0, cost: getActionCost('mineIron').energy }));
    await marker('ore').click();
    assert.equal(await page.evaluate(() => gameState.activity.id), 'mineIron');
    const imageDuration = await page.evaluate(() => gameState.activity.duration);
    assert.equal(imageDuration, await page.evaluate(() => getActivityDuration({ kind: 'action', id: 'mineIron', context: gameState.activity.context })));
    assert.equal(await page.evaluate(() => getResource('energy').value), mineBefore.energy - mineBefore.cost);
    await page.evaluate(() => imageQA.finish());
    assert.equal(await page.evaluate(() => gameState.expedition.carriedItems.ore), mineBefore.ore + await page.evaluate(() => getMineResourceAmount('ore')));
    await marker('mine').click();
    assert.equal(await page.evaluate(() => gameState.activity.id), 'mineStone');
    await page.evaluate(() => imageQA.finish());

    await page.evaluate(() => { imageQA.location('stagRuns'); getHuntData('stagRuns').tracked = false; imageQA.refresh(); });
    assert(await marker('tracks').isVisible());
    assert(await marker('hunt').isVisible());
    assert(await marker('sensePrey').isVisible());
    assert(await marker('lure').isVisible());
    await page.evaluate(() => { getAction('useHuntingLure').unlocked = false; ExpeditionScene.render(); });
    assert.equal(await marker('lure').isVisible(), false);
    await page.evaluate(() => { getAction('useHuntingLure').unlocked = true; imageQA.refresh(); });
    await page.evaluate(() => { getSpell('manaSense').unlocked = false; getResource('huntingLure').value = 0; imageQA.refresh(); });
    assert.equal(await marker('sensePrey').isVisible(), false);
    assert.equal(await marker('lure').isDisabled(), await action('useHuntingLure').isDisabled());
    await page.evaluate(() => { getSpell('manaSense').unlocked = true; getResource('mana').value = 0; imageQA.refresh(); });
    assert(await marker('sensePrey').isDisabled());
    assert(await spell('sensePrey').isDisabled());
    await page.evaluate(() => { getResource('mana').value = getResource('mana').maxValue; imageQA.refresh(); });
    await page.setViewportSize({ width: 320, height: 844 });
    await marker('sensePrey').click({ trial: true });
    await page.setViewportSize({ width: 1360, height: 1000 });
    await marker('sensePrey').click();
    assert.equal(await page.evaluate(() => gameState.activity.context.targetId), 'sensePrey');
    await page.evaluate(() => imageQA.finish());
    assert(await page.evaluate(() => getHuntData('stagRuns').tracked));

    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      assert(await marker('tracks').isVisible());
      assert(await marker('hunt').isVisible());
      assert(await marker('sensePrey').isVisible());
      assert(await marker('lure').isVisible());
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no horizontal overflow at ${width}px`);
    }
    await marker('hunt').click({ trial: true });
    await page.evaluate(() => { getHuntData('stagRuns').tracked = false; getResource('huntingLure').value = 1; imageQA.refresh(); });
    await marker('tracks').click({ trial: true });
    await marker('lure').click({ trial: true });
    await page.evaluate(() => { getHuntData('stagRuns').tracked = true; imageQA.refresh(); });
    await page.setViewportSize({ width: 1360, height: 1000 });
    assert(await marker('sensePrey').isDisabled());
    await marker('hunt').click();
    assert.equal(await page.evaluate(() => gameState.activity.id), 'huntGame');
    await page.evaluate(() => imageQA.finish());
    await marker('tracks').click();
    assert.equal(await page.evaluate(() => gameState.activity.id), 'trackGame');
    await page.evaluate(() => imageQA.finish());
    await page.evaluate(() => { getHuntData('stagRuns').tracked = false; getResource('huntingLure').value = 1; imageQA.refresh(); });
    await marker('lure').click();
    assert.equal(await page.evaluate(() => gameState.activity.id), 'useHuntingLure');
    await page.evaluate(() => imageQA.finish());
    assert(await page.evaluate(() => getHuntData('stagRuns').tracked));

    await page.evaluate(() => {
      getCampUpgrade('researchSpot').purchased = true;
      getCampUpgrade('researchBench').purchased = false;
      getCampUpgrade('researchBench').unlocked = true;
      updateHomeAreaAvailability();
    });
    const study = page.locator('button[data-home-area="study"]');
    assert.equal(await study.getAttribute('data-home-stage'), 'research-spot');
    await page.evaluate(() => selectHomeArea('study'));
    assert.equal(await page.locator('#homeAreaTitle').innerText(), 'Research Spot');
    await page.evaluate(() => completeCampUpgrade('researchBench'));
    assert.equal(await study.getAttribute('data-home-stage'), 'research-bench');
    assert.match(await study.innerText(), /Research Bench/);
    assert.equal(await page.locator('#homeAreaTitle').innerText(), 'Research Bench');
    assert.equal(await study.evaluate(n => getComputedStyle(n.querySelector('.home-place-art')).backgroundImage.includes('station-research-bench.png')), true);
    await page.evaluate(() => localStorage.setItem(SAVE_KEY, JSON.stringify(createSaveData())));
    await page.reload();
    await page.waitForFunction(() => typeof updateHomeAreaAvailability === 'function' && getCampUpgrade('researchBench').purchased);
    assert.equal(await study.getAttribute('data-home-stage'), 'research-bench');
    assert.deepEqual(errors, []);
    console.log('Location image hotspots and Research Bench save/reload passed.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
