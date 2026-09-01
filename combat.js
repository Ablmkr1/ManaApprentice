const COMBAT_CONFIG = {
  enemies: {
    minorEarthElemental: {
      label: "Minor Earth Elemental",
      earthAligned: true,
      maxHealth: 20,
      attackIntervalSeconds: 2,
      attackDamage: { min: 2, max: 3 },
      reward: { earthElementalCore: elementalAutomationConfig.earth.coreDropQuantity },
    },
    thornfang: {
      label: "Thornfang",
      regionId: "east",
      maxHealth: 18,
      attackIntervalSeconds: 1.3,
      attackDamage: { min: 1, max: 2 },
      ability: {
        id: "pounce",
        label: "Pounce",
        initialDelaySeconds: 1.4,
        intervalSeconds: 7,
        windupSeconds: 1.25,
        damage: { min: 8, max: 10 },
      },
      reward: { leather: 2, runedLeather: 1 },
    },
    blightedBriar: {
      label: "Blighted Briar",
      regionId: "south",
      maxHealth: 32,
      attackIntervalSeconds: 3,
      attackDamage: { min: 3, max: 4 },
      ability: {
        id: "regrowth",
        label: "Regrowth",
        initialDelaySeconds: 2,
        intervalSeconds: 8,
        windupSeconds: 1.5,
        healing: 7,
      },
      reward: { herb: 4, naturalEssence: 1 },
    },
  },
  spells: {
    manaBolt: {
      label: "Mana Bolt",
      manaCost: 10,
      castTimeSeconds: 1,
      damage: { min: 8, max: 12 },
      hits: 1,
    },
    manaMissile: {
      label: "Mana Missile",
      manaCost: 12,
      castTimeSeconds: 1.25,
      damage: { min: 3, max: 4 },
      hits: 3,
      requiredRank: 2,
      requiredRankTwoLevel: 5,
    },
    manaLance: {
      label: "Mana Lance",
      manaCost: 20,
      castTimeSeconds: 1.75,
      damage: { min: 18, max: 24 },
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

  renderCombatUI();
  return true;
}

function startTestCombat() {
  if (typeof unlockPersonalWard === "function") {
    unlockPersonalWard(false);
  }

  return startCombatEncounter("minorEarthElemental", { reward: null });
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

function processCombatTick() {
  if (!isCombatActive()) return;

  const now = getGameTime();
  const cast = gameState.combat.cast;

  // Resolve the player's completed cast before a same-tick enemy attack.
  if (cast) {
    spendArcaneCombatCastProgress(now);

    if (now >= cast.endTime) {
      completeArcaneCombatCast();
    }
  }

  if (!isCombatActive()) return;

  const enemy = getCombatEnemy();

  if (gameState.combat.ability && now >= gameState.combat.ability.resolveTime) {
    resolveEnemyCombatAbility(enemy);
  }

  if (isCombatActive() && enemy.ability && !gameState.combat.ability && now >= gameState.combat.nextAbilityTime) {
    startEnemyCombatAbility(enemy, now);
  }

  while (isCombatActive() && now >= gameState.combat.nextAttackTime) {
    const damage = rollCombatRange(enemy.attackDamage);
    applyWardDamage(damage);
    gameState.combat.resultMessage = enemy.label + " strikes your Ward for " + damage + ".";
    gameState.combat.nextAttackTime += enemy.attackIntervalSeconds * 1000;

    if (getResource("ward").value <= 0) {
      resolveCombatDefeat();
    }
  }

  renderCombatUI();
}

function startEnemyCombatAbility(enemy, now) {
  const ability = enemy && enemy.ability;
  if (!ability) return;

  gameState.combat.ability = {
    id: ability.id,
    label: ability.label,
    resolveTime: now + ability.windupSeconds * 1000,
  };
  gameState.combat.resultMessage = enemy.label + " prepares " + ability.label + "!";
}

function resolveEnemyCombatAbility(enemy) {
  const activeAbility = gameState.combat.ability;
  const ability = enemy && enemy.ability;
  if (!activeAbility || !ability) return;

  gameState.combat.ability = null;
  gameState.combat.nextAbilityTime = getGameTime() + ability.intervalSeconds * 1000;
  gameState.combat.nextAttackTime = Math.max(gameState.combat.nextAttackTime || 0, getGameTime() + 500);

  if (ability.id === "pounce") {
    const damage = rollCombatRange(ability.damage);
    applyWardDamage(damage);
    gameState.combat.resultMessage = enemy.label + " lands Pounce for " + damage + " Ward damage.";
    if (getResource("ward").value <= 0) resolveCombatDefeat();
    return;
  }

  if (ability.id === "regrowth") {
    const previousHealth = gameState.combat.enemyHealth;
    gameState.combat.enemyHealth = Math.min(gameState.combat.enemyMaxHealth, previousHealth + ability.healing);
    const restored = gameState.combat.enemyHealth - previousHealth;
    gameState.combat.resultMessage = enemy.label + " completes Regrowth and restores " + restored + " Health.";
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

function completeArcaneCombatCast(expectedTechniqueId) {
  if (!isCombatActive() || !gameState.combat.cast) return;
  const cast = gameState.combat.cast;
  const techniqueId = cast.techniqueId || expectedTechniqueId || "manaBolt";
  const spell = COMBAT_CONFIG.spells[techniqueId];

  if (!spell || (expectedTechniqueId && techniqueId !== expectedTechniqueId) || !isArcaneCombatTechniqueUnlocked(techniqueId)) {
    gameState.combat.cast = null;
    gameState.combat.resultMessage = spell ? spell.label + " is not unlocked." : "That Arcane Force technique is unavailable.";
    return;
  }

  const manaCost = Number.isFinite(cast.manaCost) ? cast.manaCost : getArcaneCombatManaCost(techniqueId);
  if ((cast.manaSpent || 0) + RESOURCE_AFFORDABILITY_EPSILON < manaCost) {
    gameState.combat.cast = null;
    gameState.combat.resultMessage = spell.label + " breaks before the full mana cost is gathered.";
    return;
  }

  gameState.combat.cast = null;
  const enemy = getCombatEnemy();
  const hitDamages = [];
  const hitCount = Math.max(1, Math.floor(spell.hits) || 1);

  for (let hit = 0; hit < hitCount; hit++) {
    let damage = rollCombatRange(spell.damage);
    damage = typeof scaleArcaneForceDamage === "function" ? scaleArcaneForceDamage(damage) : damage;
    if (enemy && enemy.earthAligned && typeof getActiveAttunementEffectTotal === "function") {
      damage = Math.round(damage * (1 + getActiveAttunementEffectTotal("earthDamageBonus")));
    }
    hitDamages.push(damage);
  }

  const totalDamage = hitDamages.reduce(function (sum, damage) { return sum + damage; }, 0);
  gameState.combat.enemyHealth = Math.max(0, gameState.combat.enemyHealth - totalDamage);
  gameState.combat.resultMessage = hitCount > 1
    ? spell.label + " strikes " + hitCount + " times for " + hitDamages.join(", ") + " damage (" + totalDamage + " total)."
    : spell.label + " hits for " + totalDamage + " damage.";

  if (gameState.combat.enemyHealth <= 0) {
    resolveCombatVictory();
  }

  return totalDamage;
}

function rollCombatRange(range) {
  return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

function resolveCombatVictory() {
  if (!isCombatActive() || gameState.combat.enemyHealth > 0) return;

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
  if (gameState.combat.storyEncounter && enemy && enemy.regionId) {
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
  addStoryEntry("The elemental collapses into still stone. At its center, a mana-bearing core remains, shaped with a precision that feels deliberate rather than natural.");
  updateCurrentGoalUI();
  updateLocationActions();
  updatePlacePanel();
}

function endCombatForRecall() {
  if (!isCombatActive()) return;

  gameState.combat.cast = null;
  gameState.combat.resolved = true;
  gameState.combat.resultMessage = "The encounter ended as you recalled to camp.";
  renderCombatUI();
}

function recallFromCombat() {
  if (!isCombatActive()) return false;

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

  if (!visible || !enemy) return;

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
    const abilitySeconds = enemy.ability ? Math.max(0, (combat.nextAbilityTime - getGameTime()) / 1000) : null;
    safeSetText(ui.combatAttackTimer, "Next attack in " + attackSeconds.toFixed(1) + "s" + (abilitySeconds !== null ? " · " + enemy.ability.label + " in " + abilitySeconds.toFixed(1) + "s" : ""));
  }

  safeSetText(ui.combatStatus, combat.resultMessage);
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
      const hitText = spell.hits > 1 ? spell.hits + " × " + spell.damage.min + "–" + spell.damage.max : spell.damage.min + "–" + spell.damage.max;
      details.textContent = getArcaneCombatManaCost(techniqueId) + " Mana · " + hitText + " base damage · " + getArcaneCombatCastTime(techniqueId) + " sec";
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
