const COMBAT_CONFIG = {
  enemies: {
    brokenWarden: {
      label: "Broken Warden",
      regionId: "west",
      maxHealth: 850,
      attackIntervalSeconds: 4,
      attackDamage: 8,
      shellThreshold: 60,
      armorMultiplier: 0.25,
      repairSeconds: 5,
      sigilCount: 3,
      exposedSeconds: 12,
      ability: { id: "crushingBlow", label: "Crushing Blow", initialDelaySeconds: 0,
        intervalSeconds: 10, windupSeconds: 5, damage: 18 },
      reward: {},
    },
    minorEarthElemental: {
      label: "Minor Earth Elemental",
      earthAligned: true,
      maxHealth: 30,
      attackIntervalSeconds: 2.5,
      attackDamage: 3,
      reward: { earthElementalCore: elementalAutomationConfig.earth.coreDropQuantity },
    },
    thornfang: {
      label: "Thornfang",
      regionId: "east",
      maxHealth: 96,
      attackIntervalSeconds: 3,
      attackDamage: 4,
      ability: {
        id: "pounce",
        label: "Pounce",
        initialDelaySeconds: 4,
        intervalSeconds: 10,
        windupSeconds: 3,
        damage: 12,
      },
      reward: { leather: 2, runedLeather: 1 },
    },
    blightedBriar: {
      label: "Blighted Briar",
      regionId: "south",
      maxHealth: 200,
      attackIntervalSeconds: 4,
      attackDamage: 6,
      ability: {
        id: "regrowth",
        label: "Regrowth",
        initialDelaySeconds: 5,
        intervalSeconds: 14,
        windupSeconds: 5,
        healingPerBud: 10,
        budCount: 3,
      },
      reward: { herb: 4, naturalEssence: 1 },
    },
  },
  spells: {
    manaBolt: {
      label: "Mana Bolt",
      manaCost: 10,
      castTimeSeconds: 2,
      damage: 10,
      hits: 1,
    },
    manaMissile: {
      label: "Mana Missile",
      manaCost: 11,
      castTimeSeconds: 2.4,
      damage: 8,
      powerScaling: 0.25, // Quarter of Force Power growth: 8 base -> 12 per hit at cap.
      hits: 3,
      requiredRank: 2,
      requiredRankTwoLevel: 5,
    },
    manaLance: {
      label: "Mana Lance",
      manaCost: 16,
      castTimeSeconds: 3,
      damage: 24,
      hits: 1,
      requiredRank: 2,
      requiredRankTwoLevel: 10,
    },
  },
};
let lastCombatConsumablesSignature = "";

function isCombatActive() {
  return !!gameState.combat && gameState.combat.active && !gameState.combat.resolved;
}

function getCombatEnemy() {
  return gameState.combat.enemyId ? COMBAT_CONFIG.enemies[gameState.combat.enemyId] : null;
}

function isManaBoltUnlocked() {
  return typeof getArcaneForceLevel === "function" && getArcaneForceLevel() >= 5;
}

function isManaMissileUnlocked() {
  return typeof getArcaneForceRank === "function" && getArcaneForceRank() >= 2 &&
    typeof getArcaneForceRankTwoLevel === "function" && getArcaneForceRankTwoLevel() >= 5;
}

function isManaLanceUnlocked() {
  return typeof getArcaneForceRank === "function" && getArcaneForceRank() >= 2 &&
    typeof getArcaneForceRankTwoLevel === "function" && getArcaneForceRankTwoLevel() >= 10;
}

function isArcaneCombatTechniqueUnlocked(techniqueId) {
  if (techniqueId === "manaBolt") return isManaBoltUnlocked();
  if (techniqueId === "manaMissile") return isManaMissileUnlocked();
  if (techniqueId === "manaLance") return isManaLanceUnlocked();
  return false;
}

function getArcaneCombatManaCost(techniqueId) {
  const spell = COMBAT_CONFIG.spells[techniqueId];
  if (!spell) return 0;
  const arcaneCost = typeof getArcaneForceManaCost === "function" ? getArcaneForceManaCost(spell.manaCost) : spell.manaCost;
  const staffMultiplier = typeof getCombatStaffManaCostMultiplier === "function" ? getCombatStaffManaCostMultiplier() : 1;
  return spell.manaCost > 0 ? Math.max(1, roundResourceAmount(arcaneCost * staffMultiplier)) : 0;
}

function getArcaneCombatCastTime(techniqueId) {
  const spell = COMBAT_CONFIG.spells[techniqueId];
  if (!spell) return 0;
  const arcaneDuration = typeof getArcaneForceCastDuration === "function" ? getArcaneForceCastDuration(spell.castTimeSeconds) : spell.castTimeSeconds;
  const staffSpeed = typeof getCombatStaffCastSpeedMultiplier === "function" ? getCombatStaffCastSpeedMultiplier() : 1;
  return roundResourceAmount(arcaneDuration / staffSpeed);
}

function hookCombatUI() {
  if (ui.testCombatBtn) {
    ui.testCombatBtn.addEventListener("click", startTestCombat);
  }

  if (ui.manaBoltBtn) {
    ui.manaBoltBtn.addEventListener("click", startManaBoltCast);
  }

  if (ui.manaMissileBtn) {
    ui.manaMissileBtn.addEventListener("click", startManaMissileCast);
  }

  if (ui.manaLanceBtn) {
    ui.manaLanceBtn.addEventListener("click", startManaLanceCast);
  }

  if (ui.combatRecallBtn) {
    ui.combatRecallBtn.addEventListener("click", recallFromCombat);
  }

  if (ui.closeCombatBtn) {
    ui.closeCombatBtn.addEventListener("click", closeCombatEncounter);
  }

  if (ui.combatConsumablesList) {
    ui.combatConsumablesList.addEventListener("click", function (event) {
      const button = event.target.closest("[data-combat-consumable]");
      if (!button || button.disabled || !isCombatActive()) return;

      const consumableName = button.dataset.combatConsumable;
      const slotIndex = getTonicSlots().findIndex(function (slot) {
        return slot === consumableName;
      });

      if (slotIndex >= 0 && useConsumableFromSlot(slotIndex)) {
        renderCombatUI();
      }
    });
  }

  renderCombatUI();
}

function startCombatEncounter(enemyId, options = {}) {
  if (isCombatActive() || gameState.combat.resolved) return false;

  const enemy = COMBAT_CONFIG.enemies[enemyId];

  if (!enemy) return false;

  gameState.combat.active = true;
  gameState.combat.resolved = false;
  gameState.combat.enemyId = enemyId;
  gameState.combat.enemyHealth = enemy.maxHealth;
  gameState.combat.enemyMaxHealth = enemy.maxHealth;
  gameState.combat.nextAttackTime = getGameTime() + enemy.attackIntervalSeconds * 1000;
  gameState.combat.nextAbilityTime = enemy.ability ? getGameTime() + (enemy.ability.initialDelaySeconds || enemy.ability.intervalSeconds) * 1000 : null;
  gameState.combat.ability = null;
  gameState.combat.cast = null;
  gameState.combat.rewardGranted = false;
  gameState.combat.reward = options.reward || null;
  gameState.combat.storyEncounter = !!options.storyEncounter;
  gameState.combat.resultMessage = options.startMessage || "The elemental stirs. Keep your Ward intact.";
  clearCombatMechanics();
  gameState.combat.events = [];
  gameState.combat.eventSequence = 0;
  if (enemy.shellThreshold) restoreCombatShell(getGameTime());

  renderCombatUI();
  return true;
}

function startTestCombat() {
  if (typeof unlockPersonalWard === "function") {
    unlockPersonalWard(false);
  }

  return startCombatEncounter("minorEarthElemental", { reward: null });
}

// Final existing western room; no equipment/spell prerequisite or self-reward gate.
function canChallengeBrokenWarden() {
  const dungeon = gameState.expedition.dungeon;
  return !!dungeon?.active && dungeon.dungeonId === "arcaneArchiveDepths" &&
    dungeon.nodeId === "deepRepository" && !!getCurrentDungeonNode()?.explored &&
    !isActivityActive() && !isCombatActive() && !gameState.combat.resolved;
}

function startBrokenWardenCombat() {
  if (!canChallengeBrokenWarden()) return false;
  return startCombatEncounter("brokenWarden", {
    storyEncounter: !gameState.brokenWardenDefeated,
    reward: {},
    startMessage: "The repository's ancient guardian wakes. Break its shell, destroy its repair sigils, and strike the exposed core.",
  });
}

function startNorthernDisturbanceCombat() {
  if (typeof canInvestigateNorthernDisturbance === "function" && !canInvestigateNorthernDisturbance()) return false;

  return startCombatEncounter("minorEarthElemental", {
    storyEncounter: true,
    reward: COMBAT_CONFIG.enemies.minorEarthElemental.reward,
    startMessage: "Stone grinds against stone in the mine. A Minor Earth Elemental pulls itself from the wall.",
  });
}

function startRepeatNorthernEarthElementalCombat() {
  if (typeof canChallengeNorthernEarthElemental === "function" && !canChallengeNorthernEarthElemental()) return false;

  return startCombatEncounter("minorEarthElemental", {
    reward: COMBAT_CONFIG.enemies.minorEarthElemental.reward,
    startMessage: "The mine answers your challenge. Stone tears itself free from the wall as an Earth Elemental forms.",
  });
}

function getRegionalCombatEnemyId(regionId) {
  return regionId === "east" ? "thornfang" : regionId === "south" ? "blightedBriar" : null;
}

function startRegionalDisturbanceCombat(regionId) {
  if (typeof canInvestigateRegionalDisturbance === "function" && !canInvestigateRegionalDisturbance(regionId)) return false;
  const enemyId = getRegionalCombatEnemyId(regionId);
  const enemy = enemyId ? COMBAT_CONFIG.enemies[enemyId] : null;
  if (!enemy) return false;

  return startCombatEncounter(enemyId, {
    storyEncounter: true,
    reward: enemy.reward,
    startMessage: regionId === "east"
      ? "Briars snap behind you. Thornfang lowers its rune-scarred shoulders and rushes."
      : "The old field convulses as a Blighted Briar tears its roots free and begins to advance.",
  });
}

function startRepeatRegionalCombat(regionId) {
  if (typeof canChallengeRegionalEnemy === "function" && !canChallengeRegionalEnemy(regionId)) return false;
  const enemyId = getRegionalCombatEnemyId(regionId);
  const enemy = enemyId ? COMBAT_CONFIG.enemies[enemyId] : null;
  if (!enemy) return false;

  return startCombatEncounter(enemyId, {
    reward: enemy.reward,
    startMessage: regionId === "east"
      ? "A familiar growl rolls through the Quiet Grove. Thornfang is hunting again."
      : "The overgrown rows knot together. Another Blighted Briar rises from the field.",
  });
}

function canStartManaBoltCast() {
  return canStartArcaneCombatCast("manaBolt");
}

function startManaBoltCast() {
  return startArcaneCombatCast("manaBolt");
}

function spendManaBoltProgress(now) {
  spendArcaneCombatCastProgress(now);
}

function canStartManaMissileCast() {
  return canStartArcaneCombatCast("manaMissile");
}

function startManaMissileCast() {
  return startArcaneCombatCast("manaMissile");
}

function canStartManaLanceCast() {
  return canStartArcaneCombatCast("manaLance");
}

function startManaLanceCast() {
  return startArcaneCombatCast("manaLance");
}

function canStartArcaneCombatCast(techniqueId) {
  const spell = COMBAT_CONFIG.spells[techniqueId];
  if (!spell) return false;
  return (
    isArcaneCombatTechniqueUnlocked(techniqueId) &&
    isCombatActive() &&
    gameState.combat.enemyHealth > 0 &&
    !gameState.combat.cast &&
    getResource("mana").value + RESOURCE_AFFORDABILITY_EPSILON >= getArcaneCombatManaCost(techniqueId)
  );
}

function startArcaneCombatCast(techniqueId) {
  if (!canStartArcaneCombatCast(techniqueId)) return false;
  const spell = COMBAT_CONFIG.spells[techniqueId];
  const now = getGameTime();
  gameState.combat.cast = {
    techniqueId: techniqueId,
    startTime: now,
    endTime: now + getArcaneCombatCastTime(techniqueId) * 1000,
    manaCost: getArcaneCombatManaCost(techniqueId),
    manaSpent: 0,
  };
  gameState.combat.resultMessage = "Gathering mana for " + spell.label + "…";
  combatEvent("castStarted", now, { techniqueId, endTime: gameState.combat.cast.endTime });
  renderCombatUI();
  return true;
}

function spendArcaneCombatCastProgress(now) {
  const cast = gameState.combat.cast;
  if (!cast) return;
  const techniqueId = cast.techniqueId || "manaBolt";
  const spell = COMBAT_CONFIG.spells[techniqueId];

  if (!spell || !isArcaneCombatTechniqueUnlocked(techniqueId)) {
    gameState.combat.cast = null;
    gameState.combat.resultMessage = spell ? spell.label + " is not unlocked." : "That Arcane Force technique is unavailable.";
    return;
  }

  const elapsed = Math.max(0, now - cast.startTime);
  const castDuration = Math.max(1, cast.endTime - cast.startTime);
  const manaCost = Number.isFinite(cast.manaCost) ? cast.manaCost : getArcaneCombatManaCost(techniqueId);
  const targetSpent = roundResourceAmount(Math.min(1, elapsed / castDuration) * manaCost);
  const amountToSpend = roundResourceAmount(targetSpent - cast.manaSpent);

  if (amountToSpend <= 0) return;

  // A cast only begins with the full cost available. Combat blocks other mana
  // actions while it is active, so this reaches exactly the configured total.
  if (!spendCost({ mana: amountToSpend })) return;

  cast.manaSpent = targetSpent;

  if (typeof recordSpellProgressExperience === "function") {
    recordSpellProgressExperience("arcaneForce", amountToSpend);
  }

  if (typeof recordManaControl === "function") {
    recordManaControl(amountToSpend, spell.label);
  }
}

// All scheduled work uses encounter timestamps, so coarse ticks preserve ordering.
function combatEvent(type, time, data = {}) {
  const c = gameState.combat;
  if (!c.events) c.events = [];
  c.eventSequence = (c.eventSequence || 0) + 1;
  c.events.push({ id: c.eventSequence, type, time, ...data });
}

function clearCombatMechanics() {
  Object.assign(gameState.combat, { conditions: {}, intent: null, ability: null,
    pendingHits: [], phase: null, phaseEndTime: null, staggerEndTime: null,
    shellBreakDamage: 0 });
}

function setCombatIntent(id, label, now, durationSeconds, interruptible) {
  const intent = { id, label, startTime: now, durationSeconds,
    resolveTime: now + durationSeconds * 1000, interruptible, missileHits: {} };
  gameState.combat.intent = intent;
  gameState.combat.ability = intent; // Compatibility with the existing combat panel.
  combatEvent("intentStarted", now, { intentId: id, resolveTime: intent.resolveTime });
}

function restoreCombatShell(now) {
  const c = gameState.combat;
  const enemy = getCombatEnemy();
  c.phase = "armored";
  c.phaseEndTime = null;
  c.shellBreakDamage = 0;
  c.conditions = { armored: { damageMultiplier: enemy.armorMultiplier }, shellBreak: { value: 0, maximum: enemy.shellThreshold } };
  c.intent = c.ability = null;
  c.nextAbilityTime = now;
  combatEvent("shellRestored", now);
}

function interruptCombatAbility(now) {
  const c = gameState.combat;
  if (!c.intent) return;
  combatEvent("abilityInterrupted", now, { intentId: c.intent.id });
  delete c.conditions[c.intent.id + "Preparing"];
  c.intent = c.ability = null;
  c.nextAttackTime = now + getCombatEnemy().attackIntervalSeconds * 1000;
}

function dealCombatWardDamage(damage, source, now) {
  applyWardDamage(damage);
  combatEvent("wardDamage", now, { source, damage });
  gameState.combat.resultMessage = getCombatEnemy().label + " uses " + source + " for " + damage + " Ward damage.";
  if (getResource("ward").value <= 0) resolveCombatDefeat();
}

function processCombatTick() {
  if (!isCombatActive()) return;
  const c = gameState.combat;
  const now = getGameTime();
  const enemy = getCombatEnemy();
  if (!c.conditions) c.conditions = {};
  if (!c.pendingHits) c.pendingHits = [];
  while (isCombatActive()) {
    const times = [c.cast?.endTime, c.pendingHits[0]?.time, c.intent?.resolveTime,
      c.phaseEndTime, c.staggerEndTime, c.nextAbilityTime, c.nextAttackTime]
      .filter(Number.isFinite);
    const time = Math.min(...times);
    if (time > now) break;
    const castCompletes = c.cast && c.cast.endTime === time;
    // Account for mana already committed before an enemy event can end combat.
    if (c.cast) spendArcaneCombatCastProgress(time);
    // Player completions/hits win ties with enemy attacks and phase deadlines.
    if (castCompletes) {
      completeArcaneCombatCast(undefined, time);
    } else if (c.pendingHits[0]?.time === time) {
      resolveCombatSpellHit(c.pendingHits.shift());
    } else if (c.intent?.resolveTime === time) {
      resolveEnemyCombatAbility(enemy, time);
    } else if (c.phaseEndTime === time) {
      restoreCombatShell(time);
    } else if (c.staggerEndTime === time) {
      delete c.conditions.staggered;
      c.staggerEndTime = null;
    } else if (c.nextAbilityTime === time) {
      startEnemyCombatAbility(enemy, time);
    } else {
      c.nextAttackTime = time + enemy.attackIntervalSeconds * 1000;
      // An attack warning replaces normal attacks until the special resolves.
      if (!c.conditions.staggered && !["pounce", "crushingBlow"].includes(c.intent?.id)) {
        dealCombatWardDamage(enemy.attackDamage, "basicAttack", time);
      }
    }
  }
  if (isCombatActive() && c.cast) spendArcaneCombatCastProgress(now);
  renderCombatUI();
}

function startEnemyCombatAbility(enemy, now) {
  const c = gameState.combat;
  const a = enemy.ability;
  c.nextAbilityTime = null;
  if (!a || (enemy.shellThreshold && c.phase !== "armored")) return;
  c.nextAbilityTime = now + a.intervalSeconds * 1000;
  if (a.id === "regrowth") {
    c.conditions.buds = { count: a.budCount };
    combatEvent("budsCreated", now, { count: a.budCount });
  }
  c.conditions[a.id + "Preparing"] = {};
  setCombatIntent(a.id, a.label, now, a.windupSeconds, a.id !== "regrowth");
  c.resultMessage = enemy.label + " prepares " + a.label + "!";
}

function resolveEnemyCombatAbility(enemy, now = getGameTime()) {
  const c = gameState.combat;
  const intent = c.intent;
  if (!intent || !isCombatActive()) return;
  c.intent = c.ability = null;
  delete c.conditions[intent.id + "Preparing"];
  if (intent.id === "repair") {
    restoreCombatShell(now);
  } else if (intent.id === "regrowth") {
    const buds = c.conditions.buds?.count || 0;
    const healing = Math.min(c.enemyMaxHealth - c.enemyHealth, buds * enemy.ability.healingPerBud);
    c.enemyHealth += healing;
    delete c.conditions.buds;
    combatEvent("healing", now, { healing, survivingBuds: buds });
    c.resultMessage = "Regrowth restores " + healing + " Health.";
  } else {
    c.nextAttackTime = now + enemy.attackIntervalSeconds * 1000;
    dealCombatWardDamage(enemy.ability.damage, intent.id, now);
  }
}

function getArcaneCombatDamage(techniqueId) {
  const spell = COMBAT_CONFIG.spells[techniqueId];
  const scaled = typeof scaleArcaneForceDamage === "function" ? scaleArcaneForceDamage(spell.damage) : spell.damage;
  let damage = Math.round(spell.damage + (scaled - spell.damage) * (spell.powerScaling ?? 1));
  if (getCombatEnemy()?.earthAligned && typeof getActiveAttunementEffectTotal === "function") {
    damage = Math.round(damage * (1 + getActiveAttunementEffectTotal("earthDamageBonus")));
  }
  return damage;
}

function resolveCombatSpellHit(hit) {
  if (!isCombatActive()) return;
  const c = gameState.combat;
  const enemy = getCombatEnemy();
  const { techniqueId, time, damage } = hit;
  if (c.intent?.id === "pounce" && techniqueId === "manaMissile") {
    const hits = (c.intent.missileHits[hit.castId] || 0) + 1;
    c.intent.missileHits[hit.castId] = hits;
    if (hits === 3) {
      interruptCombatAbility(time);
      c.conditions.staggered = { endTime: time + 1500 };
      c.staggerEndTime = time + 1500;
      combatEvent("staggered", time, { durationSeconds: 1.5 });
    }
  }
  const target = c.conditions.buds?.count > 0 ? "buds" : c.conditions.repairSigils?.count > 0 ? "repairSigils" : null;
  if (target) {
    const remaining = --c.conditions[target].count;
    combatEvent("absorbedHit", time, { ...hit, target, remaining });
    combatEvent(target === "buds" ? "budDestroyed" : "sigilDestroyed", time, { remaining });
    c.resultMessage = COMBAT_CONFIG.spells[techniqueId].label + " destroys a " + (target === "buds" ? "Protective Bud" : "Repair Sigil") + "; " + remaining + " remain.";
    if (!remaining) {
      delete c.conditions[target];
      if (target === "repairSigils") {
        c.intent = c.ability = null;
        c.phase = "exposed";
        c.phaseEndTime = time + enemy.exposedSeconds * 1000;
        c.conditions.coreExposed = { endTime: c.phaseEndTime };
        combatEvent("coreExposed", time, { endTime: c.phaseEndTime });
      }
    }
    return;
  }
  const armored = c.phase === "armored";
  const healthDamage = damage * (armored ? enemy.armorMultiplier : 1);
  c.enemyHealth = Math.max(0, c.enemyHealth - healthDamage);
  combatEvent("hit", time, { ...hit, damage: healthDamage, rawDamage: damage });
  c.resultMessage = COMBAT_CONFIG.spells[techniqueId].label + " hit " + hit.hitIndex + " deals " + healthDamage + " damage.";
  if (c.enemyHealth <= 0) { resolveCombatVictory(); return; }
  if (armored) {
    c.shellBreakDamage += techniqueId === "manaLance" ? damage : healthDamage;
    c.conditions.shellBreak.value = c.shellBreakDamage;
    if (c.shellBreakDamage >= enemy.shellThreshold) {
      interruptCombatAbility(time);
      c.phase = "repair";
      c.conditions = { repairSigils: { count: enemy.sigilCount } };
      c.nextAbilityTime = null;
      combatEvent("shellBroken", time, { shellBreakDamage: c.shellBreakDamage });
      combatEvent("sigilsCreated", time, { count: enemy.sigilCount });
      setCombatIntent("repair", "Repair Sigils", time, enemy.repairSeconds, true);
      c.resultMessage = "Shell broken! Destroy the three Repair Sigils.";
    }
  }
}

function completeManaBoltCast() {
  return completeArcaneCombatCast("manaBolt");
}

function completeManaMissileCast() {
  return completeArcaneCombatCast("manaMissile");
}

function completeManaLanceCast() {
  return completeArcaneCombatCast("manaLance");
}

function completeArcaneCombatCast(expectedTechniqueId, now = getGameTime()) {
  if (!isCombatActive() || !gameState.combat.cast) return;
  const c = gameState.combat;
  const cast = c.cast;
  const techniqueId = cast.techniqueId || expectedTechniqueId || "manaBolt";
  const spell = COMBAT_CONFIG.spells[techniqueId];
  if (!spell || (expectedTechniqueId && techniqueId !== expectedTechniqueId) || !isArcaneCombatTechniqueUnlocked(techniqueId)) {
    c.cast = null;
    return;
  }
  if (now < cast.endTime) return;
  const cost = cast.manaCost ?? getArcaneCombatManaCost(techniqueId);
  if ((cast.manaSpent || 0) + RESOURCE_AFFORDABILITY_EPSILON < cost) {
    c.cast = null;
    c.resultMessage = spell.label + " breaks before the full mana cost is gathered.";
    return;
  }
  c.cast = null;
  const damage = getArcaneCombatDamage(techniqueId);
  combatEvent("castCompleted", cast.endTime, { techniqueId });
  const castId = c.eventSequence;
  if (!c.pendingHits) c.pendingHits = [];
  for (let i = 0; i < spell.hits; i++) {
    c.pendingHits.push({ time: cast.endTime + i * 100, techniqueId, castId, hitIndex: i + 1, damage });
  }
  c.pendingHits.sort((a, b) => a.time - b.time);
  return damage * spell.hits;
}

function resolveCombatVictory() {
  if (!isCombatActive() || gameState.combat.enemyHealth > 0) return;

  clearCombatMechanics();
  gameState.combat.nextAttackTime = gameState.combat.nextAbilityTime = null;
  gameState.combat.cast = null;
  gameState.combat.resolved = true;
  gameState.combatVictories = Math.max(0, Math.floor(Number(gameState.combatVictories) || 0)) + 1;
  if (typeof syncIronStaffUnlockFromCombatHistory === "function") {
    const unlockedStaff = syncIronStaffUnlockFromCombatHistory();
    if (unlockedStaff) addStoryEntry("Victory teaches you what bare-handed spellwork lacks. You can now craft an Iron Staff for combat casting.");
  }

  if (!gameState.combat.rewardGranted) {
    const reward = gameState.combat.reward || {};

    for (let resourceName in reward) {
      addResource(resourceName, reward[resourceName]);
      unlockResource(resourceName);
    }

    gameState.combat.rewardGranted = true;
  }

  const enemy = getCombatEnemy();
  if (enemy && enemy.regionId === "west") {
    if (!gameState.brokenWardenDefeated) {
      gameState.brokenWardenDefeated = true;
      gameState.tierFourCompleted = true;
      addStoryEntry("The Broken Warden falls. Its final memory names the archive's builders as the makers of your Tower: a network built to shelter and teach, now waiting for a new keeper. Your mastery of the four roads completes this chapter.");
    }
    gameState.combat.resultMessage = "Victory — Broken Warden defeated. Tier 4 complete: the archive and Tower share the same makers.";
  } else if (gameState.combat.storyEncounter && enemy && enemy.regionId) {
    if (typeof resolveRegionalDisturbanceVictory === "function") resolveRegionalDisturbanceVictory(enemy.regionId);
    gameState.combat.resultMessage = enemy.regionId === "east"
      ? "Victory — Thornfang falls, leaving leather traced with stable runes."
      : "Victory — the briar collapses, leaving concentrated Natural Essence among its roots.";
  } else if (gameState.combat.storyEncounter) {
    resolveNorthernDisturbanceVictory();
    gameState.combat.resultMessage = "Victory — the elemental collapses, leaving an Earth Elemental Core behind.";
  } else {
    if (enemy && enemy.regionId === "east") {
      gameState.combat.resultMessage = "Victory — you recover Leather and Runed Leather from Thornfang.";
    } else if (enemy && enemy.regionId === "south") {
      gameState.combat.resultMessage = "Victory — the roots yield Herbs and Natural Essence.";
    } else {
      gameState.combat.resultMessage = gameState.combat.reward && gameState.combat.reward.earthElementalCore
        ? "Victory — the elemental crumbles, leaving an Earth Elemental Core behind."
        : "Victory — the elemental crumbles.";
    }
  }
  if (typeof refreshBoundEarthElementalUI === "function") refreshBoundEarthElementalUI();
  renderCombatUI();
}

function resolveCombatDefeat() {
  if (!isCombatActive()) return;

  const ward = getResource("ward");
  if (ward) {
    ward.value = 0;
    updateResource("ward");
  }
  if (typeof getWardState === "function") {
    getWardState().formed = false;
    getWardState().maintainEnabled = false;
  }
  clearCombatMechanics();
  gameState.combat.nextAttackTime = gameState.combat.nextAbilityTime = null;
  gameState.combat.cast = null;
  gameState.combat.resolved = true;
  gameState.combat.resultMessage = "Your Ward broke. The tower connection recalled you to camp.";

  // This is the established return-to-camp path; it also handles active travel.
  beginReturnToCamp("wardBroken");
  renderCombatUI();
}

function resolveNorthernDisturbanceVictory() {
  const disturbance = gameState.northernDisturbance;

  if (!disturbance || disturbance.resolved) return;

  disturbance.resolved = true;
  checkResearchDiscoveries();
  addStoryEntry("The elemental collapses into still stone. At its center, a mana-bearing core remains, shaped with a precision that feels deliberate rather than natural.");
  updateCurrentGoalUI();
  updateLocationActions();
  updatePlacePanel();
}

function endCombatForRecall() {
  if (!isCombatActive()) return;

  clearCombatMechanics();
  gameState.combat.nextAttackTime = gameState.combat.nextAbilityTime = null;
  gameState.combat.cast = null;
  gameState.combat.resolved = true;
  gameState.combat.resultMessage = "The encounter ended as you recalled to camp.";
  renderCombatUI();
}

function recallFromCombat() {
  if (!isCombatActive()) return false;

  if (typeof flashCombatRecall === "function") flashCombatRecall();

  // Clear combat first so the normal expedition recall path cannot leave the
  // combat screen covering the camp after the player escapes.
  resetCombatEncounter();

  if (gameState.expedition && gameState.expedition.active) {
    beginReturnToCamp("combatRecall");
  } else if (typeof setMainView === "function") {
    setMainView("camp");
  }

  return true;
}

function closeCombatEncounter() {
  if (isCombatActive()) return false;

  resetCombatEncounter();
  return true;
}

function resetCombatEncounter() {
  clearCombatMechanics();
  gameState.combat.events = [];
  gameState.combat.eventSequence = 0;
  gameState.combat.active = false;
  gameState.combat.resolved = false;
  gameState.combat.enemyId = null;
  gameState.combat.enemyHealth = 0;
  gameState.combat.enemyMaxHealth = 0;
  gameState.combat.nextAttackTime = null;
  gameState.combat.nextAbilityTime = null;
  gameState.combat.ability = null;
  gameState.combat.cast = null;
  gameState.combat.rewardGranted = false;
  gameState.combat.reward = null;
  gameState.combat.storyEncounter = false;
  gameState.combat.resultMessage = "";
  renderCombatUI();
}

function renderCombatUI() {
  if (!ui.combatPanel || !gameState.combat) return;

  const combat = gameState.combat;
  const enemy = getCombatEnemy();
  const visible = combat.active || combat.resolved;
  ui.combatPanel.style.display = visible ? "block" : "none";

  const primaryPlay = document.querySelector(".primary-play");
  if (primaryPlay) primaryPlay.classList.toggle("combat-active", visible);

  if (ui.testCombatBtn) {
    ui.testCombatBtn.disabled = isCombatActive() || combat.resolved;
  }

  if (!visible || !enemy) {
    if (typeof renderCombatScene === "function") renderCombatScene();
    return;
  }

  const healthPercent = combat.enemyMaxHealth > 0 ? (combat.enemyHealth / combat.enemyMaxHealth) * 100 : 0;
  safeSetText(ui.combatEnemyName, enemy.label);
  safeSetText(ui.combatEnemyHealthText, combat.enemyHealth + " / " + combat.enemyMaxHealth + " Health");
  ui.combatEnemyHealthFill.style.width = healthPercent + "%";
  const ward = getResource("ward");
  if (ui.combatWardText && ward) {
    safeSetText(ui.combatWardText, "Ward: " + formatResourceAmountForDisplay(ward.value) + " / " + formatResourceAmountForDisplay(ward.maxValue));
  }

  const cast = combat.cast;
  const castProgress = cast ? Math.min(1, Math.max(0, (getGameTime() - cast.startTime) / (cast.endTime - cast.startTime))) : 0;
  renderArcaneCombatTechnique("manaBolt", ui.manaBoltBtn, ui.manaBoltProgressFill, canStartManaBoltCast, isManaBoltUnlocked, cast, castProgress, combat.resolved);
  renderArcaneCombatTechnique("manaMissile", ui.manaMissileBtn, ui.manaMissileProgressFill, canStartManaMissileCast, isManaMissileUnlocked, cast, castProgress, combat.resolved);
  renderArcaneCombatTechnique("manaLance", ui.manaLanceBtn, ui.manaLanceProgressFill, canStartManaLanceCast, isManaLanceUnlocked, cast, castProgress, combat.resolved);
  ui.combatRecallBtn.style.display = isCombatActive() ? "block" : "none";
  ui.combatRecallBtn.disabled = !isCombatActive();
  ui.closeCombatBtn.style.display = combat.resolved ? "inline-block" : "none";
  renderCombatConsumables();

  if (combat.resolved) {
    ui.combatAttackTimer.classList.remove("is-warning");
    safeSetText(ui.combatAttackTimer, "");
  } else if (combat.ability) {
    ui.combatAttackTimer.classList.add("is-warning");
    const seconds = Math.max(0, (combat.ability.resolveTime - getGameTime()) / 1000);
    safeSetText(ui.combatAttackTimer, combat.ability.label + " incoming in " + seconds.toFixed(1) + "s!");
  } else {
    ui.combatAttackTimer.classList.remove("is-warning");
    const attackSeconds = Math.max(0, (combat.nextAttackTime - getGameTime()) / 1000);
    const abilitySeconds = enemy.ability && Number.isFinite(combat.nextAbilityTime) ? Math.max(0, (combat.nextAbilityTime - getGameTime()) / 1000) : null;
    const phaseText = combat.phase === "exposed" ? " · Core exposed for " + Math.max(0, (combat.phaseEndTime - getGameTime()) / 1000).toFixed(1) + "s" : "";
    safeSetText(ui.combatAttackTimer, "Next attack in " + attackSeconds.toFixed(1) + "s" + (abilitySeconds !== null ? " · " + enemy.ability.label + " in " + abilitySeconds.toFixed(1) + "s" : "") + phaseText);
  }

  const conditions = combat.conditions || {};
  safeSetText(ui.combatStatus, combat.resultMessage +
    (conditions.shellBreak ? " · Shell: " + conditions.shellBreak.value + "/" + conditions.shellBreak.maximum : "") +
    (conditions.buds ? " · Buds: " + conditions.buds.count : "") +
    (conditions.repairSigils ? " · Sigils: " + conditions.repairSigils.count : "") +
    (conditions.staggered ? " · Staggered" : ""));
  if (typeof renderCombatScene === "function") renderCombatScene();
}

function renderArcaneCombatTechnique(techniqueId, button, progressFill, canStart, isUnlocked, cast, castProgress, resolved) {
  if (!button) return;
  const activeTechnique = cast && (cast.techniqueId || "manaBolt") === techniqueId;
  if (progressFill) progressFill.style.width = (activeTechnique ? castProgress : 0) * 100 + "%";
  button.disabled = !canStart();
  button.style.display = !resolved && isUnlocked() ? "block" : "none";

  if (typeof button.querySelector === "function") {
    const details = button.querySelector("small");
    const spell = COMBAT_CONFIG.spells[techniqueId];
    if (details && spell) {
      const damage = getArcaneCombatDamage(techniqueId);
      const hitText = spell.hits > 1 ? spell.hits + " × " + damage : String(damage);
      details.textContent = getArcaneCombatManaCost(techniqueId) + " Mana · " + Number(getArcaneCombatCastTime(techniqueId).toFixed(2)) + "s · " + hitText + " damage";
      const availability = button.querySelector(".duel-spell-state");
      if (availability) availability.textContent = activeTechnique ? "Casting…" : cast ? "Cast in progress" :
        !canStart() && !resolved ? "Needs " + getArcaneCombatManaCost(techniqueId) + " Mana" : "Ready";
    }
  }
}

function renderCombatConsumables() {
  if (!ui.combatConsumables || !ui.combatConsumablesList) return;

  const counts = {};

  getTonicSlots().forEach(function (consumableName) {
    const consumable = consumableName ? getConsumable(consumableName) : null;
    if (!consumable || typeof consumable.use !== "function") return;
    counts[consumableName] = (counts[consumableName] || 0) + 1;
  });

  const consumableNames = Object.keys(counts);
  const visible = consumableNames.length > 0 && isCombatActive();
  const signature = consumableNames.map(function (name) {
    return name + ":" + counts[name];
  }).join("|") + "|" + visible;

  ui.combatConsumables.style.display = visible ? "flex" : "none";
  if (signature === lastCombatConsumablesSignature) return;

  lastCombatConsumablesSignature = signature;
  ui.combatConsumablesList.innerHTML = "";

  consumableNames.forEach(function (consumableName) {
    const consumable = getConsumable(consumableName);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "combat-consumable-btn";
    button.dataset.combatConsumable = consumableName;
    button.disabled = !isCombatActive();
    button.setAttribute("aria-label", "Use " + consumable.label + ", " + counts[consumableName] + " available");

    const icon = document.createElement("span");
    icon.className = "combat-consumable-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = consumableName.toLowerCase().includes("mana") ? "✦" : "◆";

    const name = document.createElement("span");
    name.className = "combat-consumable-name";
    name.textContent = consumable.label;

    const quantity = document.createElement("strong");
    quantity.className = "combat-consumable-quantity";
    quantity.textContent = "×" + counts[consumableName];
    button.append(icon, name, quantity);
    ui.combatConsumablesList.appendChild(button);
  });
}
