const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1360, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://localhost:8765/tests/overhaul-preview.html');
    await page.waitForFunction(() => gameState.towerConstructionUnlocked);
    await page.locator('#characterViewTab').click();
    await page.locator('.notification-toast').evaluateAll(nodes => nodes.forEach(node => node.remove()));
    assert(await page.locator('#characterView').isVisible());
    assert(!(await page.locator('#campViewTab').isVisible()));
    assert.equal(await page.locator('#characterView #gearSection').count(), 1);
    assert.equal(await page.locator('#characterView #packingSection').count(), 1);
    assert.equal(await page.locator('#expeditionView #gearSection, .expedition-kit').count(), 0);
    const item = page.locator('#gearSlots button').first();
    await item.click();
    assert((await page.locator('#equipmentDetail').innerText()).length > 0);
    assert.equal(Math.round((await item.boundingBox()).width), 56);
    await page.screenshot({ path: 'tests/character-desktop.png', fullPage: true });
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      assert(await item.isVisible());
      const nav = await page.locator('#mainViewTabs').boundingBox();
      const journal = await page.locator('#journalViewTab').boundingBox();
      assert(journal.y + journal.height <= nav.y + nav.height, 'all tabs fit inside mobile navigation');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow at ' + width);
      await page.screenshot({ path: 'tests/character-' + width + '.png', fullPage: true });
    }
    await page.locator('#expeditionViewTab').click();
    assert(!(await page.locator('#gearSection').isVisible()));
    await page.locator('#characterViewTab').click();
    assert(await item.isVisible());
    await page.locator('#characterViewTab').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#expeditionViewTab').getAttribute('aria-selected'), 'true');
    assert.deepEqual(errors, []);
    console.log('Character tab passed: navigation, hidden Camp, equipment inspection, ownership, desktop and mobile layouts.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
