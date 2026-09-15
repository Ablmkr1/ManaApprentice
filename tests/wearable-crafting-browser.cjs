// Disposable-save regression coverage for wearable recipe completion state.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      const interval = window.setInterval;
      window.setInterval = (fn, ...args) => fn.name === 'gameTick' ? 0 : interval(fn, ...args);
    });
    await page.goto('http://localhost:8765/tests/overhaul-preview.html');
    await page.waitForFunction(() => gameState.towerConstructionUnlocked);
    await page.evaluate(() => {
      resetActivity(); resetCombatEncounter(); endExpedition('recall');
      gameState.phase = 'expedition';
      gameState.equipment = newEquipmentCollection();
      const recipe = getGearUpgrade('scratchyPants');
      Object.assign(recipe, { unlocked: true, purchased: false });
      for (const resource of Object.values(getResourceDefinitions())) {
        resource.maxValue = Math.max(resource.maxValue, 1000);
        resource.value = Math.max(resource.value, 500);
      }
      syncGearOwnershipFlags();
      recipe.unlocked = true;
      updateCraftingUIForCurrentContext();
      setMainView('camp', { userSelected: true });
    });
    const button = page.locator('#scratchyPantsBtn');
    assert(await button.isVisible());
    assert.equal(await button.isEnabled(), true);
    await button.click();
    assert.equal(await page.evaluate(() => gameState.activity.kind), 'equipment');
    assert.equal(await button.getAttribute('data-ui-state'), 'running');
    assert.match(await button.innerText(), /Crafting in progress/);
    await page.evaluate(() => {
      gameState.activity.startTime = getGameTime() - gameState.activity.duration * 500;
      processActivityTick();
    });
    assert(parseFloat(await button.locator('.progressFill').evaluate(node => node.style.width)) > 0);
    await page.evaluate(() => {
      gameState.activity.startTime = getGameTime() - gameState.activity.duration * 1000 - 1;
      processActivityTick();
    });
    assert.equal(await page.evaluate(() => isActivityActive()), false);
    assert(await page.evaluate(() => ensureEquipmentCollection().items.some(item => item.baseGearId === 'scratchyPants')));
    assert.equal(await button.isVisible(), false, 'completed wearable recipe is removed from available crafting');
    assert.equal(await button.locator('.progressFill').evaluate(node => node.style.width), '0%');
    assert.equal(await page.getByText('Requirements are not met for this work', { exact: true }).evaluateAll(nodes => nodes.some(node => node.getClientRects().length > 0)), false);
    assert.deepEqual(errors, []);
    console.log('Wearable crafting refresh passed: running state, progress, completion, ownership and recipe removal.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
