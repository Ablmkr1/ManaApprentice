/* Combat presentation only. Consume the encounter's ordered events without
   mutating them or scheduling gameplay. Art can be replaced in ACTORS below. */
const CombatScene = (() => {
  const ACTORS = {
    minorEarthElemental: { region: "north", place: "North · Stone chamber", art: '<path class="creature-limb" d="M42 60 L17 77 9 118 29 125 49 95Z"/><path d="M59 109 L48 163 72 168 87 118 104 163 130 163 115 105Z"/><path d="M40 61 L65 47 101 47 128 74 112 119 60 120 40 92Z M62 17 L89 12 105 32 98 53 69 54 56 35Z M116 66 L143 81 151 122 130 131 111 95Z"/><path class="creature-detail" d="M48 75 L76 86 67 111 M98 56 L91 80 113 98 M68 25 L89 30"/><path class="creature-core" d="M77 69 L91 65 98 82 85 98 76 83Z"/>' },
    thornfang: { region: "east", place: "East · Quiet Grove", art: '<path class="creature-body" d="M33 91 Q64 62 112 87 L140 73 149 78 131 102 123 115 113 151 101 154 105 116 82 121 60 113 51 151 38 155 46 118 26 110Z"/><path d="M40 88 L26 70 22 90 10 102 7 113 29 120 48 101Z M77 117 L72 149 61 149 64 110 M123 115 L135 147 122 147 109 115"/><path class="creature-detail" d="M48 91 L60 105 66 88 M78 87 L85 99 93 90"/><path class="creature-core" d="M19 100 L29 97 26 103Z"/><path class="creature-fang" d="M13 115 L17 126 20 116Z"/>' },
    blightedBriar: { region: "south", place: "South · Overgrown field", art: '<path class="briar-branches" d="M80 148 Q39 101 54 58 L36 36 M55 72 L27 64 20 41 M72 128 Q108 92 99 51 L114 28 M99 78 L134 62 139 36"/><path class="briar-leaf" d="M52 61 Q19 58 29 25 Q55 27 52 61Z"/><path class="briar-branches" d="M79 152 L76 69 86 40"/><path d="M64 111 L78 79 94 107 89 145 118 160 146 167 106 169 79 155 60 167 13 169 50 151Z"/><path class="creature-core" d="M70 103 L79 97 89 104 81 120Z"/><path class="briar-leaf" d="M105 70 Q111 39 137 43 Q138 65 105 70Z"/>' },
    brokenWarden: { region: "west", place: "West · Deep Repository", art: '<path d="M49 107 L39 163 70 166 80 124 92 165 124 164 115 103Z"/><path class="creature-limb" d="M42 49 L13 59 7 107 30 119 51 84Z"/><path d="M117 49 L146 60 151 113 130 123 108 84Z"/><path class="creature-body" d="M40 53 L60 40 105 40 126 56 112 119 50 119Z"/><path d="M60 12 L101 12 107 39 82 51 57 37Z"/><path class="creature-detail" d="M50 60 L72 75 61 106 M113 60 L93 75 104 106"/><path class="creature-core" d="M81 62 L95 83 82 106 68 83Z"/><path class="warden-shell" d="M49 55 L81 66 113 55 106 110 83 119 57 110Z"/><path class="warden-crack" d="M82 61 L70 78 91 86 75 100 83 117"/>' },
  };
  // Keep the art data strictly local; no remote assets or enemy prose in gameplay.
  const intentLabels = { pounce: "Pounce", crushingBlow: "Crushing Blow", regrowth: "Regrowth", repair: "Repair Sigils", basicAttack: "Attack" };
  let refs = null, eventSource = null, cursor = 0, actorId = null, finished = false;
  let history = [], effects = [], lastEffectTime = 0, recallAnimation = null;
  const seconds = (end, now) => Math.max(0, (end - now) / 1000).toFixed(1) + "s";
  const number = value => Number(Number(value || 0).toFixed(2));
  const percent = (value, maximum) => maximum > 0 ? Math.max(0, Math.min(100, value / maximum * 100)) : 0;
  function elements() {
    if (refs) return refs;
    if (typeof document.getElementById !== "function" || !document.getElementById("combatScene")) return null;
    refs = {};
    for (const id of ["Scene", "Region", "PlayerActor", "EnemyActor", "EnemyArt", "Defenses", "Effects", "Conditions", "Intent", "IntentLabel", "IntentTime", "IntentFill", "IntentHint", "WardFill", "ManaFill", "ManaText", "WardCondition", "CastLabel", "CastTime", "CastMeter", "CastFill", "ActorCast", "EventLog", "Announcement", "Outcome", "AttackTimer"]) refs[id] = document.getElementById("combat" + id);
    return refs;
  }
  function setText(element, value) { if (element.textContent !== value) element.textContent = value; }
  function clearEffects() {
    effects.forEach(effect => effect.node.remove());
    effects = []; lastEffectTime = 0;
    if (refs) refs.Effects.replaceChildren();
  }
  function reset() {
    clearEffects(); history = []; cursor = 0; finished = false; actorId = null;
    if (!refs) return;
    refs.EventLog.replaceChildren(); refs.Defenses.replaceChildren(); refs.Conditions.replaceChildren();
    delete refs.Defenses.dataset.signature; delete refs.Conditions.dataset.signature;
    refs.Scene.className = "combat-scene";
    refs.PlayerActor.className = "duel-actor duel-wizard";
    refs.EnemyActor.className = "duel-actor duel-enemy";
    refs.Intent.hidden = true;
    setText(refs.Announcement, ""); setText(refs.Outcome, ""); setText(refs.ActorCast, "");
  }
  function conditions(c, now) {
    const list = [], states = c.conditions || {};
    if (states.armored) list.push("Armored Shell");
    if (states.shellBreak) list.push("Shell break " + number(states.shellBreak.value) + "/" + number(states.shellBreak.maximum));
    if (states.buds) list.push(states.buds.count + " Protective Buds");
    if (states.repairSigils) list.push(states.repairSigils.count + " Repair Sigils");
    if (states.coreExposed) list.push("Core Exposed — " + seconds(states.coreExposed.endTime, now));
    if (states.staggered) list.push("Staggered — " + seconds(states.staggered.endTime, now));
    return list;
  }
  function describe(event) {
    const spell = COMBAT_CONFIG.spells[event.techniqueId]?.label || "Spell";
    const ability = intentLabels[event.intentId] || "Ability";
    switch (event.type) {
      case "hit": return spell + (event.techniqueId === "manaMissile" ? " · " + event.hitIndex + "/3" : "") + " dealt " + number(event.damage) + " damage" + (event.rawDamage > event.damage ? " (armor reduced the hit)." : ".");
      case "absorbedHit": return spell + (event.techniqueId === "manaMissile" ? " · " + event.hitIndex + "/3" : "") + " destroyed a " + (event.target === "buds" ? "Protective Bud" : "Repair Sigil") + ". Hit absorbed; " + event.remaining + " remain.";
      case "wardDamage": return (intentLabels[event.source] || event.source) + ": Ward absorbed " + number(event.damage) + " damage.";
      case "intentStarted": return ability + " prepares — " + seconds(event.resolveTime, event.time) + ".";
      case "abilityInterrupted": return ability + " interrupted.";
      case "healing": return "Regrowth restored " + number(event.healing) + " Health.";
      case "shellBroken": return "Broken Warden’s shell shattered.";
      case "shellRestored": return "Armored Shell restored.";
      case "coreExposed": return "Core exposed — " + seconds(event.endTime, event.time) + ".";
      default: return ""; // Destruction companion events duplicate absorbedHit.
    }
  }
  function log(text) {
    history.push(text); history = history.slice(-6);
    const items = history.map(line => { const item = document.createElement("li"); item.textContent = line; return item; });
    refs.EventLog.replaceChildren(...items);
  }
  function effect(event, now, reduced) {
    const hit = ["hit", "absorbedHit"].includes(event.type);
    if (!hit && !["wardDamage", "healing", "abilityInterrupted", "shellBroken", "coreExposed"].includes(event.type)) return;
    // Catch-up ticks can deliver several hits at once. Space only their visuals;
    // resources, conditions and the durable log always reflect current state.
    const starts = hit ? Math.max(now, Math.min(lastEffectTime + 170, now + 680)) : now;
    if (hit) lastEffectTime = starts;
    const node = document.createElement("div");
    node.className = "duel-effect fx-" + event.type + (hit ? " spell-" + event.techniqueId : "") + (reduced ? " is-static" : "");
    node.dataset.eventId = String(event.id);
    node.style.setProperty("--delay", (starts - now) + "ms");
    node.style.setProperty("--lane", String((event.hitIndex || 1) - 1));
    if (hit) {
      const projectile = document.createElement("i"); projectile.className = "duel-projectile";
      const impact = document.createElement("i"); impact.className = "duel-impact";
      node.append(projectile, impact);
      if (event.type === "absorbedHit") {
        const fragment = document.createElement("i"); fragment.className = "duel-defense-fragment " + event.target;
        fragment.style.setProperty("--slot", String(event.remaining)); node.append(fragment);
      }
    }
    const feedback = document.createElement("span"); feedback.className = "duel-feedback";
    feedback.textContent = event.type === "hit" ? "−" + number(event.damage) : event.type === "absorbedHit" ? (event.target === "buds" ? "Bud" : "Sigil") + " broken · absorbed" : event.type === "wardDamage" ? "Ward −" + number(event.damage) : event.type === "healing" ? "+" + number(event.healing) + " Health" : event.type === "abilityInterrupted" ? "Interrupted" : event.type === "shellBroken" ? "Shell Broken" : "Core Exposed";
    node.append(feedback);
    refs.Effects.append(node);
    const entry = { node, expires: starts + 1500 }; effects.push(entry);
    node.addEventListener("animationend", e => { if (e.target === node) { node.remove(); effects = effects.filter(item => item !== entry); } });
  }
  function render() {
    if (!elements()) return;
    const c = gameState.combat;
    if (eventSource !== c.events) {
      reset(); eventSource = c.events;
      if (c.active && recallAnimation) { recallAnimation.cancel(); recallAnimation = null; }
    }
    if ((!c.active && !c.resolved) || !getCombatEnemy()) { reset(); return; }
    const now = getGameTime(), wallNow = Date.now();
    const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const actor = ACTORS[c.enemyId] || ACTORS.minorEarthElemental;
    if (actorId !== c.enemyId) {
      actorId = c.enemyId;
      refs.EnemyArt.innerHTML = '<svg viewBox="0 0 160 180" focusable="false"><ellipse class="actor-shadow" cx="80" cy="168" rx="65" ry="8"/>' + actor.art + '</svg>';
    }
    refs.Scene.className = "combat-scene arena-" + actor.region + (c.resolved ? " is-resolved" : "") + (reduced ? " reduced-motion" : "");
    setText(refs.Region, actor.place);
    const ward = getResource("ward"), mana = getResource("mana");
    const wardPercent = percent(ward.value, ward.maxValue);
    const wardState = wardPercent <= 0 ? "broken" : wardPercent <= 20 ? "critical" : wardPercent <= 45 ? "low" : "healthy";
    refs.PlayerActor.className = "duel-actor duel-wizard ward-" + wardState + (c.cast ? " is-casting cast-" + c.cast.techniqueId : "");
    refs.WardFill.style.width = wardPercent + "%"; refs.ManaFill.style.width = percent(mana.value, mana.maxValue) + "%";
    setText(refs.ManaText, "Mana: " + number(mana.value) + " / " + number(mana.maxValue));
    setText(refs.WardCondition, { broken: "Ward broken", critical: "Ward near breaking", low: "Ward weakened", healthy: "Ward stable" }[wardState]);
    refs.EnemyActor.className = "duel-actor duel-enemy enemy-" + c.enemyId + " phase-" + (c.phase || "normal") + (c.intent ? " preparing-" + c.intent.id : "") + (c.conditions?.staggered ? " is-staggered" : "") + (!c.resolved && !c.intent && c.nextAttackTime - now < 650 ? " preparing-attack" : "");
    const chips = conditions(c, now);
    if (refs.Conditions.dataset.signature !== chips.join("|")) {
      refs.Conditions.dataset.signature = chips.join("|");
      refs.Conditions.replaceChildren(...chips.map(text => { const chip = document.createElement("span"); chip.className = "duel-chip"; chip.textContent = text; return chip; }));
    }
    const defenses = c.conditions?.buds || c.conditions?.repairSigils;
    const defenseType = c.conditions?.buds ? "buds" : "repairSigils";
    const defenseSignature = defenseType + ":" + (defenses?.count || 0);
    if (refs.Defenses.dataset.signature !== defenseSignature) {
      refs.Defenses.dataset.signature = defenseSignature;
      refs.Defenses.replaceChildren(...Array.from({ length: defenses?.count || 0 }, (_, slot) => {
        const bud = document.createElement("i"); bud.className = "duel-defense " + defenseType; bud.style.setProperty("--slot", String(slot)); return bud;
      }));
    }
    refs.Intent.hidden = !c.intent;
    if (c.intent) {
      refs.Intent.className = "duel-intent" + (c.intent.interruptible ? " is-interruptible" : "");
      setText(refs.IntentLabel, c.intent.id === "repair" ? "Repair Sigils" : "Preparing " + c.intent.label);
      setText(refs.IntentTime, seconds(c.intent.resolveTime, now));
      refs.IntentFill.style.width = percent(c.intent.resolveTime - now, c.intent.durationSeconds * 1000) + "%";
      const hints = { pounce: "Interrupt: land all 3 Missiles", crushingBlow: "Interrupt: break the shell", regrowth: "Destroy buds to prevent healing", repair: "Destroy all sigils to expose core" };
      setText(refs.IntentHint, hints[c.intent.id] || (c.intent.interruptible ? "Interruptible" : "Cannot interrupt"));
    }
    // Special intent owns the prominent timer; normal cadence stays subdued.
    refs.AttackTimer.hidden = !!c.intent || c.resolved;
    const cast = c.cast, progress = cast ? percent(now - cast.startTime, cast.endTime - cast.startTime) : 0;
    const castName = cast ? COMBAT_CONFIG.spells[cast.techniqueId || "manaBolt"].label : "";
    setText(refs.CastLabel, c.resolved ? "Encounter ended" : cast ? "Casting " + castName : "Ready to cast");
    setText(refs.CastTime, cast ? seconds(cast.endTime, now) : "");
    setText(refs.ActorCast, castName ? "Gathering · " + castName : "");
    refs.CastFill.style.width = progress + "%"; refs.CastMeter.setAttribute("aria-valuenow", String(Math.round(progress)));
    refs.CastMeter.setAttribute("aria-valuetext", cast ? castName + ", " + seconds(cast.endTime, now) + " remaining" : "No active cast");
    effects = effects.filter(entry => { if (entry.expires <= wallNow) { entry.node.remove(); return false; } return true; });
    const pending = (c.events || []).slice(cursor); cursor = (c.events || []).length;
    let announcement = "";
    for (const event of pending) {
      const text = describe(event); if (text) log(text);
      if (!c.resolved) effect(event, wallNow, reduced);
      if (["intentStarted", "abilityInterrupted", "shellBroken", "coreExposed"].includes(event.type)) announcement = text;
    }
    if (c.resolved && !finished) {
      finished = true; clearEffects();
      const outcome = c.enemyHealth <= 0 ? "Victory" : ward.value <= 0 ? "Ward broken · Recalled" : "Recalled to Camp";
      setText(refs.Outcome, outcome); log(c.resultMessage); announcement = c.resultMessage;
      refs.Scene.classList.add("duel-ending");
    }
    if (announcement) setText(refs.Announcement, announcement);
  }
  function recallFlash() {
    if (!elements() || typeof refs.Scene.animate !== "function") return;
    const host = document.querySelector(".primary-play");
    if (!host) return;
    if (recallAnimation) recallAnimation.cancel();
    const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    recallAnimation = host.animate([{ filter: "brightness(1.35)" }, { filter: "brightness(1)" }], { duration: reduced ? 1 : 240 });
    const current = recallAnimation;
    current.finished.catch(() => {}).then(() => { if (recallAnimation === current) recallAnimation = null; });
  }
  return { render, recallFlash, conditions, describe };
})();
function renderCombatScene() { CombatScene.render(); }
function flashCombatRecall() { CombatScene.recallFlash(); }
