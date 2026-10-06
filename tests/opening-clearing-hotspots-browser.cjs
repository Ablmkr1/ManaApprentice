const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.clear();
      const interval = window.setInterval;
      window.setInterval = (fn, ...args) => fn.name === 'gameTick' ? 0 : interval(fn, ...args);
    });
    await page.goto('http://localhost:8765/');
    await page.waitForFunction(() => typeof updateHomeAreaAvailability === 'function' && typeof processActivityTick === 'function');
    for (let popup = 0; popup < 8 && await page.locator('.popup:visible button').count(); popup += 1) {
      await page.locator('.popup:visible button').last().click();
    }

    const finishActivity = () => page.evaluate(() => {
      gameState.activity.startTime -= gameState.activity.duration * 1000 + 1;
      processActivityTick();
    });

    await page.evaluate(() => setMainView('home', { userSelected: true }));
    assert.equal(await page.locator('#homeAreaPanel').isHidden(), true, 'the opening does not auto-open a mechanical panel');
    assert.equal(await page.locator('[data-home-direct-action="catchBreath"]').isVisible(), true);
    assert.equal(await page.locator('[data-home-direct-action="explore"]').isVisible(), true);

    const energyBeforeBreath = await page.evaluate(() => getResource('energy').value);
    await page.locator('.home-place-catch-breath').click();
    await finishActivity();
    assert(await page.evaluate(value => getResource('energy').value > value, energyBeforeBreath), 'Catch Breath uses the existing recovery action');
    for (let step = 0; step < 3; step += 1) {
      await page.evaluate(() => { getResource('energy').value = getResource('energy').maxValue; updateResource('energy'); updateAllActionButtons(); });
      await page.locator('[data-home-direct-action="explore"]').click();
      assert.deepEqual(await page.evaluate(() => [gameState.activity.kind, gameState.activity.id]), ['action', 'explore']);
      await finishActivity();
    }

    assert.equal(await page.evaluate(() => gameState.discoveredClearing), true);
    assert.equal(await page.locator('[data-home-direct-action="explore"]').isHidden(), true);
    assert.equal(await page.locator('#homeAreaPanel').isHidden(), true);
    assert.equal(await page.locator('.home-place-catch-breath strong').textContent(), 'Rest in Clearing');

    await page.evaluate(() => {
      getResource('energy').value = getResource('energy').maxValue;
      updateAllResources();
      updateAllActionButtons();
    });

    const wood = page.locator('[data-home-area="wood"]');
    assert.equal(await wood.isVisible(), true);
    assert.equal(await wood.locator('strong').textContent(), 'Search Dead Tree');
    await wood.click();
    assert.deepEqual(await page.evaluate(() => [gameState.activity.kind, gameState.activity.id]), ['locationObject', 'deadTree']);
    assert.equal(await page.locator('#homeAreaPanel').isHidden(), true);
    await finishActivity();
    assert.equal(await page.evaluate(() => gameState.discoveredDeadfall), true);
    assert.equal(await wood.locator('strong').textContent(), 'Gather Wood');

    const woodBefore = await page.evaluate(() => getResource('wood').value);
    await wood.click();
    assert.deepEqual(await page.evaluate(() => [gameState.activity.kind, gameState.activity.id]), ['action', 'gatherWood']);
    await finishActivity();
    assert(await page.evaluate(value => getResource('wood').value > value, woodBefore), 'direct gather uses the existing action reward');
    await page.evaluate(() => { stopAutoAction(); if (isActivityActive()) resetActivity(); updateAllActionButtons(); });

    for (const [area, object, flag] of [
      ['food', 'berryBush', 'discoveredBerryBush'],
      ['water', 'soundOfWater', 'discoveredStream'],
    ]) {
      await page.evaluate(() => { getResource('energy').value = getResource('energy').maxValue; updateResource('energy'); updateAllActionButtons(); });
      await page.locator('[data-home-area="' + area + '"]').click();
      assert.deepEqual(await page.evaluate(() => [gameState.activity.kind, gameState.activity.id]), ['locationObject', object]);
      await finishActivity();
      assert.equal(await page.evaluate(name => gameState[name], flag), true);
    }

    const workspot = page.locator('[data-home-area="workspot"]');
    assert.equal(await workspot.isVisible(), true);
    await workspot.click();
    assert.equal(await page.evaluate(() => getCampUpgrade('smallFire').unlocked && getCampUpgrade('crudeLeanTo').unlocked), true);
    assert.equal(await page.locator('#homeAreaPanel').isHidden(), true, 'declaring the work spot is direct');

    await page.evaluate(() => {
      getResource('wood').value = 30;
      getResource('energy').value = getResource('energy').maxValue;
      updateAllResources();
      updateCraftingButtons();
      updateHomeAreaAvailability();
    });
    const fire = page.locator('[data-home-area="campfire"]');
    const shelter = page.locator('[data-home-area="shelter"]');
    assert.equal(await fire.isVisible(), true);
    assert.equal(await shelter.isVisible(), true);
    assert.equal(await fire.evaluate(node => node.classList.contains('is-construction-site')), true);
    assert.equal(await shelter.evaluate(node => node.classList.contains('is-construction-site')), true);

    await fire.click();
    assert.deepEqual(await page.evaluate(() => [gameState.activity.kind, gameState.activity.type, gameState.activity.id]), ['craft', 'campUpgrade', 'smallFire']);
    await finishActivity();
    assert.equal(await page.evaluate(() => getCampUpgrade('smallFire').purchased), true);

    await shelter.click();
    assert.deepEqual(await page.evaluate(() => [gameState.activity.kind, gameState.activity.type, gameState.activity.id]), ['craft', 'campUpgrade', 'crudeLeanTo']);
    await finishActivity();
    assert.equal(await page.evaluate(() => gameState.hasCamp && gameState.phase === 'expedition'), true, 'normal established-camp progression takes over');
    assert.equal(await fire.evaluate(node => node.classList.contains('is-construction-site')), false);
    assert.equal(await page.locator('.home-place-catch-breath').isHidden(), true);
    assert.equal(await page.locator('.home-place-explore').isHidden(), true);
    assert.equal(errors.length, 0, errors.join('\n'));

    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => {
      gameState.phase = 'lost';
      gameState.hasCamp = false;
      gameState.discoveredClearing = false;
      getCampUpgrade('smallFire').purchased = false;
      getCampUpgrade('crudeLeanTo').purchased = false;
      updateHomeAreaAvailability();
    });
    const catchBox = await page.locator('[data-home-direct-action="catchBreath"]').boundingBox();
    const exploreBox = await page.locator('[data-home-direct-action="explore"]').boundingBox();
    assert(catchBox && exploreBox);
    assert(catchBox.x + catchBox.width <= exploreBox.x || exploreBox.x + exploreBox.width <= catchBox.x || catchBox.y + catchBox.height <= exploreBox.y || exploreBox.y + exploreBox.height <= catchBox.y, 'opening hotspots do not overlap at 390px');

    console.log('Opening clearing hotspots passed: direct actions, discovery, gathering, construction, camp handoff, and mobile spacing.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
