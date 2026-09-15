// Disposable-save browser coverage for Camp's new-work indicators.
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
    await page.waitForFunction(() => typeof updateHomeAttentionIndicators === 'function');

    await page.evaluate(() => {
      window.__availableHomeWork = new Set(['campUpgrade:smallFire']);
      window.__originalIsCraftAvailable = isCraftAvailable;
      isCraftAvailable = (type, id) => window.__availableHomeWork.has(type + ':' + id);
      gameState.homeAttention = { seen: { crafting: [], research: [], training: [] } };
      getSkillState('manaCycling').breakthroughReady = false;
      for (const area of ['workbench', 'study', 'training']) {
        document.querySelector('[data-home-area="' + area + '"]').hidden = false;
      }
      updateHomeAttentionIndicators();
    });

    const workbench = page.locator('button[data-home-area="workbench"]');
    const study = page.locator('button[data-home-area="study"]');
    const training = page.locator('button[data-home-area="training"]');

    assert(await workbench.evaluate(node => node.classList.contains('has-camp-attention')));
    assert.match(await workbench.getAttribute('aria-label'), /new activity available/);
    assert.equal(await workbench.evaluate(node => getComputedStyle(node, '::before').content), '"NEW"');

    await workbench.click();
    assert.equal(await workbench.evaluate(node => node.classList.contains('has-camp-attention')), false);
    assert.deepEqual(await page.evaluate(() => gameState.homeAttention.seen.crafting), ['campUpgrade:smallFire']);

    await page.evaluate(() => {
      window.__availableHomeWork.add('gearUpgrade:scratchyPants');
      updateHomeAttentionIndicators();
    });
    assert(await workbench.evaluate(node => node.classList.contains('has-camp-attention')), 'a newly available recipe restores the crafting marker');

    await page.evaluate(() => {
      window.__availableHomeWork.add('research:manaCycling');
      updateHomeAttentionIndicators();
    });
    assert(await study.evaluate(node => node.classList.contains('has-camp-attention')), 'available research marks the Research Spot');
    await study.click();
    assert.equal(await study.evaluate(node => node.classList.contains('has-camp-attention')), false);

    await page.evaluate(() => {
      const skill = getSkillState('manaCycling');
      skill.revealed = true;
      skill.level = 1;
      skill.breakthroughReady = true;
      updateHomeAttentionIndicators();
    });
    assert(await training.evaluate(node => node.classList.contains('has-camp-attention')), 'a Mana Cycling breakthrough marks the Practice Circle');
    await training.click();
    assert.equal(await training.evaluate(node => node.classList.contains('has-camp-attention')), false);
    await page.evaluate(() => {
      getSkillState('manaCycling').level = 2;
      updateHomeAttentionIndicators();
    });
    assert(await training.evaluate(node => node.classList.contains('has-camp-attention')), 'a later breakthrough restores the Practice Circle marker');

    const savedSeen = await page.evaluate(() => createSaveData().gameState.homeAttention.seen);
    assert(savedSeen.crafting.includes('campUpgrade:smallFire'));
    assert(savedSeen.research.includes('research:manaCycling'));
    assert(savedSeen.training.some(key => key.startsWith('manaCycling:')), 'acknowledged breakthrough is persisted');
    assert.deepEqual(errors, []);
    console.log('Camp attention indicators passed: crafting, research, training, acknowledgement, recurrence and save persistence.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
