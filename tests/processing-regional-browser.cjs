// Uses the preview server's disposable save key.
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
      resetActivity();
      gameState.expedition.active = false;
      gameState.expedition.currentLocation = null;
      getResource('fuel').value = 8;
      getResource('wood').value = 10;
      getResource('imbuedWood').value = 10;
      getCampUpgrade('campSmelter').purchased = true;
      getCampUpgrade('campAlchemyStation').purchased = true;
      ensureImbueRankTwoState().furnaceTier = 0;
      ensureImbueRankTwoState().alchemyTier = 0;
      setMainView('home', { userSelected: true });
      setCampActionsAvailable(true);
      selectHomeArea('processing', { userSelected: true });
      updateResource('fuel');
      updateAllActionButtons();
    });
    const station = page.locator('#homeAreaPanel[data-home-area="processing"]');
    assert(await station.isVisible());
    const display = station.locator('#processingFuelAmount');
    await assertFuel('Fuel: 8');
    assert.equal(await page.locator('[data-action="addWoodToFuel"]').count(), 1);
    assert.equal(await page.locator('[data-action="addImbuedWoodToFuel"]').count(), 1);
    assert.equal(await page.locator('[data-action="storeWood"]').count(), 0);
    await station.locator('[data-action="addWoodToFuel"]').click();
    await page.evaluate(() => {
      gameState.activity.startTime = getGameTime() - gameState.activity.duration * 1000 - 1;
      processActivityTick();
    });
    await assertFuel('Fuel: 9');
    await page.evaluate(() => {
      getResource('energy').value = 100;
      getResource('ore').value = 10;
      getResource('herb').value = 100;
      getResource('iron').value = 0;
      getResource('staminaTonicBase').value = 0;
      if (!spendCost(getCraftCost('resourceCraft', 'iron'))) throw Error('Smelt fuel was unavailable');
    });
    await assertFuel('Fuel: 4');
    await page.evaluate(() => {
      if (!spendCost(getCraftCost('resourceCraft', 'staminaTonic'))) throw Error('Alchemy fuel was unavailable');
    });
    await assertFuel('Fuel: 1');
    await page.evaluate(() => {
      saveSuppressed = false;
      saveGame();
      getResource('fuel').value = 0;
      updateResource('fuel');
      loadGame();
      setMainView('home', { userSelected: true });
      selectHomeArea('processing', { userSelected: true });
    });
    await assertFuel('Fuel: 1');
    assert.deepEqual(errors, []);
    console.log('Processing Station browser flow passed: add, two recipes, live display, reload, one add-fuel location.');

    async function assertFuel(expected) {
      assert.equal((await display.innerText()).trim(), expected);
      assert.equal(await page.evaluate(() => getResource('fuel').value), Number(expected.split(': ')[1]));
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
