// Run with tests/serve-preview.cjs and Playwright on NODE_PATH. All saves use
// the existing disposable QA key; the real player save is never loaded.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const output = path.join(__dirname, 'outskirts-screenshots');
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  let page;
  try {
    page = await browser.newPage({ viewport: { width: 1360, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    // Advance activity explicitly so interaction and progress assertions are deterministic.
    await page.addInitScript(() => {
      const interval = window.setInterval;
      window.setInterval = (callback, ...args) => callback.name === 'gameTick' ? 0 : interval(callback, ...args);
    });
    await page.goto('http://localhost:8765/tests/overhaul-preview.html');
    await page.waitForFunction(() => gameState.towerConstructionUnlocked);
    await page.evaluate(() => {
      window.expeditionQA = {
        refresh() {
          updateLocationActions(); updateCraftingUIForCurrentContext(); updatePlacePanel();
          updateAllActionButtons(); refreshExpeditionUI(); updateRegionalMapVisibility();
          setMainView('expedition', { userSelected: true }); ExpeditionScene.render(); ExpeditionMap.close();
          document.querySelectorAll('.popup').forEach(n => n.style.display = 'none');
        },
        camp() { resetCombatEncounter(); resetActivity(); endExpedition('recall'); gameState.phase = 'expedition'; this.refresh(); },
        location(id, explored = true) {
          resetCombatEncounter(); resetActivity();
          gameState.expedition.dungeon.active = false;
          gameState.expedition.active = true;
          gameState.expedition.regionId = getLocationRegionId(getExpeditionLocation(id));
          gameState.expedition.destination = null;
          Object.assign(getExpeditionLocation(id), { discovered: true, explored });
          setCurrentLocation(id); lockAction('travel'); unlockAction('returnToCamp'); setPackingActionsAvailable(false);
          this.refresh();
        },
        advance(fraction = 1) {
          gameState.activity.startTime = getGameTime() - Math.ceil(gameState.activity.duration * 1000 * fraction) - (fraction >= 1 ? 1 : 0);
          processActivityTick(); ExpeditionScene.render();
        },
      };
      expeditionQA.camp(); selectRegion('outskirts'); ExpeditionScene.render();
    });
    const root = page.locator('#expeditionPanel');
    const marker = id => page.locator('[data-landmark="' + id + '"]');
    const action = id => page.locator('[data-direct-key="action:' + id + '"]:visible, [data-action="' + id + '"]:visible');
    const panel = page.locator('#expeditionDetail');
    const chooseMarker = async id => {
      // The panel overlays the opposite side of the painting. Close it before
      // choosing another landmark, just as a pointer user does.
      if (await panel.isVisible()) await page.locator('#expeditionDetailClose').click();
      await marker(id).evaluate(n => n.scrollIntoView({ block: 'center' }));
      if (await marker(id).getAttribute('aria-controls') === 'expeditionDetail') {
        await marker(id).click(); await visible(panel);
      } else {
        // Direct actions need no inspection step. Focus here; the test clicks
        // the action below and verifies its actual gameplay result.
        await marker(id).focus(); assert.equal(await panel.isVisible(), false);
      }
    };
    const checkReadability = async () => {
      const failures = await page.locator('#expeditionDetail p, #expeditionDetail h3, #expeditionDetail h4, #expeditionDetail .ui-action-label, #expeditionDetail .ui-action-cost, #expeditionDetail .ui-action-reason, #expeditionDetail .resource-pill, .expedition-status span, .expedition-local-tools h3, .expedition-local-tools p, .expedition-direct-actions strong, .expedition-direct-actions small').evaluateAll(nodes => {
        const rgb = v => (v.match(/[\d.]+/g) || []).map(Number);
        const luminance = c => c.slice(0, 3).map(x => { x /= 255; return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }).reduce((sum, x, i) => sum + x * [.2126, .7152, .0722][i], 0);
        return nodes.filter(n => n.getBoundingClientRect().width && n.getBoundingClientRect().height && n.textContent.trim()).flatMap(n => {
          const layers = []; let base = [255, 255, 255];
          for (let p = n; p; p = p.parentElement) {
            const style = getComputedStyle(p);
            if (style.backgroundImage.includes('gradient')) { base = [234, 223, 202]; break; }
            const c = rgb(style.backgroundColor), alpha = c[3] ?? 1;
            if (alpha === 1) { base = c; break; }
            if (alpha) layers.push(c);
          }
          for (const c of layers.reverse()) base = base.map((v, i) => c[i] * c[3] + v * (1 - c[3]));
          const f = luminance(rgb(getComputedStyle(n).color)), b = luminance(base);
          const ratio = (Math.max(f, b) + .05) / (Math.min(f, b) + .05);
          return ratio >= 4.5 ? [] : [{ text: n.textContent.slice(0, 70), ratio }];
        });
      });
      assert.deepEqual(failures, [], 'ordinary panel/status text meets AA contrast');
    };
    const shot = async name => {
      await checkReadability();
      await page.locator('#expeditionArt img').evaluateAll(imgs => Promise.all(imgs.map(i => i.decode())));
      if (await panel.isVisible()) await panel.evaluate(n => n.scrollTop = 0);
      return root.screenshot({ path: path.join(output, name + '.png'), style: '.top-bar, #mainViewTabs, .notification-stack, .notification-toast { visibility: hidden !important; }' });
    };
    const snapshot = () => page.evaluate(() => JSON.stringify({ expedition: gameState.expedition, activity: gameState.activity, resources: Object.fromEntries(Object.entries(getResourceDefinitions()).map(([id, r]) => [id, r.value])) }));
    const visible = async locator => assert(await locator.isVisible(), 'visible: ' + locator);

    await page.evaluate(() => {
      gameState.tier3Unlocked = false;
      for (const id of ['mysteriousPlants','strangeTrails','creepyCave','mysteriousTrail']) getExpeditionLocation(id).discovered = false;
      Object.assign(getExpeditionLocation('mysteriousPlants'), {discovered:true,explored:false,explorationProgress:0});
      expeditionQA.refresh();
    });
    assert.equal(await page.locator('[data-landmark]').count(),1);
    await visible(action('beginExpedition'));
    const before=await snapshot(); await chooseMarker('mysteriousPlants'); assert.equal(await snapshot(),before);
    await shot('outskirts-map-early-desktop');
    await page.evaluate(()=>expeditionQA.location('mysteriousPlants',false));
    await chooseMarker('plants'); await visible(action('exploreLocation')); await shot('plants-before-desktop');
    for(let i=0;i<3;i++){await action('exploreLocation').click();await page.evaluate(()=>expeditionQA.advance());}
    assert(await page.evaluate(()=>getExpeditionLocation('mysteriousPlants').explored));
    assert.equal(await panel.isVisible(),false); await visible(action('gatherFiber')); await shot('plants-after-desktop');
    await action('gatherFiber').click();
    await page.evaluate(()=>{window.qaFocus=document.activeElement;window.qaPanel=document.getElementById('expeditionDetail');qaPanel.scrollTop=35;window.qaScroll=qaPanel.scrollTop;expeditionQA.advance(.5);});
    assert(await page.evaluate(()=>document.activeElement===qaFocus && qaPanel.scrollTop===qaScroll));
    assert(await action('gatherFiber').first().evaluate(button => {
      const track = button.querySelector('.direct-progress'), fill = track.querySelector('.progressFill');
      const t = track.getBoundingClientRect(), f = fill.getBoundingClientRect();
      return f.left >= t.left && f.right <= t.right + 1 && f.top >= t.top && f.bottom <= t.bottom + 1 && f.height <= 4;
    }), 'Gather Fiber progress remains inside its compact action track');
    await page.evaluate(()=>expeditionQA.advance()); assert.equal(await panel.isVisible(),false);
    await page.evaluate(()=>{expeditionQA.location('strangeTrails');getExpeditionLocation('strangeTrails').trapSites.sites.forEach((s,i)=>{s.discovered=i<3;s.installed=i===0;s.checkedThisVisit=false;});gameState.expedition.carriedItems.trap=5;expeditionQA.refresh();});
    await chooseMarker('trails');
    for(const id of ['scoutTrapSite','setTrap','checkTrap']) await visible(action(id));
    await visible(page.locator('#trapSitesList')); assert.equal(await page.locator('#trapSitesList .trap-site-row').count(),5);
    await shot('animal-trails-desktop');
    await action('setTrap').click();await page.evaluate(()=>expeditionQA.advance());await visible(panel);
    await action('checkTrap').click();await page.evaluate(()=>expeditionQA.advance());await visible(panel);
    const routeBefore=await snapshot();await page.locator('#expeditionBrowse').click();await chooseMarker('mysteriousPlants');
    assert.equal(await snapshot(),routeBefore);assert.equal(await action('gatherFiber').isVisible(),false);
    await page.locator('#expeditionBrowse').click();
    await page.evaluate(()=>{expeditionQA.location('creepyCave');getLocationObject('creepyCave','caveInterior').progress=0;expeditionQA.refresh();});
    await chooseMarker('stones');await visible(action('gatherStone'));await shot('cave-stone-desktop');
    await chooseMarker('caveInterior');await visible(page.locator('[data-location-object="caveInterior"]'));await shot('cave-interior-desktop');
    await page.evaluate(()=>{expeditionQA.location('mysteriousTrail');for(const obj of Object.values(getExpeditionLocation('mysteriousTrail').explorableObjects))obj.progress=0;expeditionQA.refresh();});
    await shot('camp-all-landmarks-desktop');
    for(const id of ['washedOutFirePit','shreddedPack','ruinedShelter']){await chooseMarker(id);await visible(page.locator('[data-location-object="'+id+'"]'));assert.equal(await page.locator('#locationObjectActions button:visible').count(),1);await shot('camp-'+id+'-desktop');}
    await chooseMarker('washedOutFirePit');await page.locator('[data-location-object="washedOutFirePit"]').click();await page.evaluate(()=>expeditionQA.advance());
    assert(await marker('washedOutFirePit').evaluate(n=>n.classList.contains('is-complete')));await visible(panel);
    await page.setViewportSize({width:390,height:844});
    await shot('camp-mobile');
    for(const [id,hotspot] of [['mysteriousPlants','plants'],['strangeTrails','trails'],['creepyCave','caveInterior']]){await page.evaluate(id=>expeditionQA.location(id),id);await chooseMarker(hotspot);await shot(id+'-mobile');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
    await page.evaluate(()=>{expeditionQA.camp();selectRegion('outskirts');for(const id of ['strangeTrails','creepyCave','mysteriousTrail'])getExpeditionLocation(id).discovered=false;expeditionQA.refresh();});
    await shot('outskirts-map-early-mobile');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.deepEqual(errors,[]); console.log('Outskirts checks passed: discovery, original actions, object filtering/completion, repeat focus/scroll, desktop/mobile, contrast, raster decode, overflow.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});


