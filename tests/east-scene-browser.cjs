// Run with tests/serve-preview.cjs and Playwright on NODE_PATH. All saves use
// the existing disposable QA key; the real player save is never loaded.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const output = path.join(__dirname, 'east-screenshots');
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
          Object.assign(getExpeditionLocation(id), { discovered: true, explored, explorationProgress: explored ? getExpeditionLocation(id).explorationRequired : 0 });
          setCurrentLocation(id); lockAction('travel'); unlockAction('returnToCamp'); setPackingActionsAvailable(false);
          this.refresh();
        },
        advance(fraction = 1) {
          gameState.activity.startTime = getGameTime() - Math.ceil(gameState.activity.duration * 1000 * fraction) - (fraction >= 1 ? 1 : 0);
          processActivityTick(); ExpeditionScene.render();
        },
      };
      expeditionQA.camp(); selectRegion('east'); ExpeditionScene.render();
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
      await page.evaluate(()=>window.scrollTo(0,0));
      return root.screenshot({ path: path.join(output, name + '.png'), style: '.top-bar, #mainViewTabs, .notification-stack, .notification-toast { visibility: hidden !important; }' });
    };
    const snapshot = () => page.evaluate(() => JSON.stringify({ expedition: gameState.expedition, activity: gameState.activity, resources: Object.fromEntries(Object.entries(getResourceDefinitions()).map(([id, r]) => [id, r.value])) }));
    const visible = async locator => assert(await locator.isVisible(), 'visible: ' + locator);

    await page.evaluate(() => {
      for (const id of ['stagRuns','huntersCabin','quietGrove']) getExpeditionLocation(id).discovered = false;
      Object.assign(getExpeditionLocation('stagRuns'), {discovered:true,explored:false,explorationProgress:0});
      expeditionQA.refresh();
    });
    assert.equal(await marker('stagRuns').count(),1); assert.equal(await marker('huntersCabin').count(),0);
    await visible(action('beginExpedition'));
    const before=await snapshot(); await chooseMarker('stagRuns'); assert.equal(await snapshot(),before);
    assert.equal(await action('trackGame').isVisible(),false);
    await shot('east-map-early-desktop');
    await page.setViewportSize({width:390,height:844}); await shot('east-map-early-mobile');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.setViewportSize({width:1360,height:1000});
    await page.evaluate(()=>{getHuntData('stagRuns').tracked=false;expeditionQA.location('stagRuns',false);});
    await chooseMarker('tracks'); await visible(action('exploreLocation')); await shot('stag-runs-before');
    await action('exploreLocation').click(); await page.evaluate(()=>expeditionQA.advance());
    assert(await page.evaluate(()=>getExpeditionLocation('stagRuns').explored));
    assert(await page.locator('[data-direct-key="action:exploreLocation"]').isDisabled());
    await shot('stag-runs-after');
    await action('trackGame').click();await page.locator('#expeditionDirectActions').scrollIntoViewIfNeeded();
    const trackingScroll=await page.evaluate(()=>scrollY);
    await page.evaluate(()=>{window.eastFocused=document.activeElement;expeditionQA.advance(.5);for(let i=0;i<20;i++)ExpeditionScene.render();});
    assert(await page.evaluate(()=>document.activeElement===window.eastFocused));assert.equal(await page.evaluate(()=>scrollY),trackingScroll);
    await page.evaluate(()=>expeditionQA.advance());assert(await page.evaluate(()=>getHuntData('stagRuns').tracked));
    await chooseMarker('hunt'); await shot('stag-runs-hunt');await action('huntGame').click();await page.evaluate(()=>expeditionQA.advance());assert.equal(await page.evaluate(()=>getHuntData('stagRuns').tracked),false);
    await page.evaluate(()=>{Object.assign(getTowerNodeState('east'),getDefaultTowerNodeState('east')); expeditionQA.location('huntersCabin',false);});
    assert.equal(await marker('node').count(),0);assert.equal(await page.locator('.expedition-node-overlay').count(),0);
    await chooseMarker('survey'); await shot('cabin-before');
    await action('exploreLocation').click();await page.evaluate(()=>expeditionQA.advance());
    await action('exploreLocation').click();await page.evaluate(()=>expeditionQA.advance());
    assert(await page.evaluate(()=>getExpeditionLocation('huntersCabin').explored));
    await page.evaluate(()=>{gameState.expedition.carriedItems.pelt=3;getExpeditionLocation('huntersCabin').storage.leather=2;expeditionQA.refresh();});
    await chooseMarker('hides');await visible(action('storePelt'));await visible(action('takeLeather'));await shot('cabin-storage');
    await action('storePelt').click();await page.evaluate(()=>{if(isActivityActive())expeditionQA.advance();});
    await visible(panel);assert.equal(await marker('hides').getAttribute('aria-pressed'),'true');
    await action('takeLeather').click();await page.evaluate(()=>{if(isActivityActive())expeditionQA.advance();});
    for(const [state,flags] of [['discovered',{activated:true,researchUnlocked:false,built:false}],['unbuilt',{activated:true,researchUnlocked:true,built:false}],['built',{activated:true,researchUnlocked:true,built:true}]]){
      await page.evaluate(flags=>{Object.assign(getTowerNodeState('east'),flags);if(flags.built){const n=getTowerNodeState('east');n.deposits={...getTowerNodeDefinition('east').materials};n.imbueProgress=getTowerNodeDefinition('east').imbueRequired;}expeditionQA.refresh();},flags);
      await chooseMarker('node'); if(state!=='discovered') await visible(panel.locator('#towerNodePanel'));
      assert.equal(await page.locator('#expeditionSurface').getAttribute('data-node-state'),state);
      await shot('cabin-node-'+state);
    }
    await page.evaluate(()=>{getRegionalProgressState('east').disturbanceTriggered=false;const o=getLocationObject('quietGrove','observeGlassAntlerStag');o.progress=0;o.spellCharges={};o.manaSenseCharges=0;expeditionQA.location('quietGrove',false);});
    assert.equal(await marker('node').count(),0);assert.equal(await marker('disturbance').count(),0);assert.equal(await marker('observation').count(),0);
    await chooseMarker('survey');await shot('grove-before');
    for(let i=0;i<2;i++){await action('exploreLocation').click();await page.evaluate(()=>expeditionQA.advance());}
    await page.evaluate(()=>expeditionQA.refresh());await chooseMarker('observation');await visible(panel.locator('[data-location-object="observeGlassAntlerStag"]'));await shot('grove-observation-locked');

    for(let i=0;i<3;i++){await page.locator('#expeditionLocalUtilities').getByRole('button',{name:/Cast Mana Sense/}).click();await page.evaluate(()=>{expeditionQA.advance();expeditionQA.refresh();});assert.equal(await page.evaluate(()=>getLocationObjectSpellCharge(getLocationObject('quietGrove','observeGlassAntlerStag'),'manaSense')),i+1);if(i===0)await shot('grove-mana-sense-progress');}
    await shot('grove-mana-sense-ready');
    const observe=panel.locator('[data-location-object="observeGlassAntlerStag"]');
    for(let i=0;i<3;i++){await observe.click();await page.evaluate(()=>expeditionQA.advance());}
    assert(await page.evaluate(()=>isLocationObjectComplete(getLocationObject('quietGrove','observeGlassAntlerStag'))));
    assert((await marker('observation').getAttribute('class')).includes('is-complete'));await shot('grove-observation-complete');
    await page.evaluate(()=>{Object.assign(getRegionalProgressState('east'),{disturbanceTriggered:true,disturbanceResolved:false});expeditionQA.refresh();});
    await chooseMarker('disturbance');await visible(action('investigateEasternDisturbance'));await shot('grove-disturbance');
    await action('investigateEasternDisturbance').click();await page.evaluate(()=>{if(isActivityActive())expeditionQA.advance();ExpeditionScene.render();});
    assert.equal(await page.evaluate(()=>ExpeditionScene.mode()),'combat');await visible(page.locator('#combatScene'));
    await page.evaluate(()=>{gameState.combat.enemyHealth=0;resolveCombatVictory();expeditionQA.refresh();});
    await page.locator('#closeCombatBtn').click();await page.evaluate(()=>ExpeditionScene.render());
    await chooseMarker('disturbance');await visible(action('challengeThornfang'));assert((await marker('disturbance').getAttribute('class')).includes('is-complete'));await shot('grove-challenge');
    await page.setViewportSize({width:390,height:844});await shot('grove-challenge-mobile');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await action('challengeThornfang').click();await page.evaluate(()=>{if(isActivityActive())expeditionQA.advance();ExpeditionScene.render();});
    assert.equal(await page.evaluate(()=>ExpeditionScene.mode()),'combat');
    await page.evaluate(()=>{endCombatForRecall();expeditionQA.location('huntersCabin');});
    await chooseMarker('hides');await shot('cabin-storage-mobile');
    await chooseMarker('node');await shot('cabin-node-mobile');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.evaluate(()=>expeditionQA.location('stagRuns'));await chooseMarker('tracks');await shot('stag-runs-mobile');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    const localBefore=await snapshot();await page.locator('#expeditionBrowse').click();await chooseMarker('huntersCabin');assert.equal(await snapshot(),localBefore);assert.equal(await action('storePelt').isVisible(),false);
    assert.deepEqual(errors,[]);console.log('East focused checks passed');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

