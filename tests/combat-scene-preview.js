/* Disposable browser fixture: actual app UI and combat logic, no save access. */
tryLoadGame = function () {};
trySaveGame = function () {};
let previewTime = 0;
getGameTime = () => previewTime;
window.addEventListener('load', () => {
  document.querySelectorAll('.popup').forEach(node => node.style.display = 'none');
  const controls = document.createElement('div');
  controls.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;padding:6px;background:#18231c;color:#e7ddc5;font:12px sans-serif';
  controls.innerHTML = '<label>Enemy <select id="previewEnemy"><option value="minorEarthElemental">Earth Elemental</option><option value="thornfang">Thornfang</option><option value="blightedBriar">Blighted Briar</option><option value="brokenWarden">Broken Warden</option></select></label><button id="previewStep">Advance 1s</button><button id="previewResolve">Finish cast</button><button id="previewReset">Restart</button><button id="previewWard">Low Ward</button><button id="previewMana">Empty Mana</button><button id="previewVictory">Victory</button><button id="previewDefeat">Defeat</button><label><input id="previewMotion" type="checkbox">Reduced motion</label>';
  document.body.prepend(controls);
  const disclosure = document.createElement('details');
  disclosure.style.cssText = 'position:fixed;top:0;right:0;z-index:2147483000;max-width:100%;background:#18231c';
  disclosure.innerHTML = '<summary style="min-height:20px;padding:4px;color:#cfc3a2;font:10px sans-serif">Preview controls · no saves</summary>';
  controls.before(disclosure); disclosure.append(controls);
  const originalMatchMedia = window.matchMedia.bind(window);
  window.matchMedia = query => query === '(prefers-reduced-motion: reduce)' && document.getElementById('previewMotion').checked ? { matches: true } : originalMatchMedia(query);
  function start() {
    resetCombatEncounter(); previewTime = 0;
    getArcaneForceProgressState().xp = 150;
    const force = ensureArcaneForceRankTwoState();
    Object.assign(force, { rank: 2, rankTwoLevel: 10, rankTwoXp: 500 });
    getResource('mana').maxValue = getResource('mana').value = 100;
    getResource('ward').maxValue = getResource('ward').value = 80;
    getResource('ward').unlocked = getResource('mana').unlocked = true;
    startCombatEncounter(document.getElementById('previewEnemy').value, { startMessage: 'Keep your Ward intact. Recall is always a safe exit.' });
    processCombatTick();
  }
  document.getElementById('previewEnemy').onchange = start;
  document.getElementById('previewReset').onclick = start;
  document.getElementById('previewStep').onclick = () => { previewTime += 1000; processCombatTick(); };
  document.getElementById('previewResolve').onclick = () => { if (gameState.combat.cast) previewTime = gameState.combat.cast.endTime + 200; processCombatTick(); };
  document.getElementById('previewWard').onclick = () => { getResource('ward').value = 12; renderCombatUI(); };
  document.getElementById('previewMana').onclick = () => { getResource('mana').value = 0; renderCombatUI(); };
  document.getElementById('previewVictory').onclick = () => { gameState.combat.enemyHealth = 0; resolveCombatVictory(); };
  document.getElementById('previewDefeat').onclick = () => resolveCombatDefeat();
  document.getElementById('previewMotion').onchange = () => renderCombatUI();
  start();
});
