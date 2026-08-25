const COMBAT_CONFIG = {
  enemies: {
    minorEarthElemental: {
      label: "Minor Earth Elemental",
      maxHealth: 20,
      attackIntervalSeconds: 2,
      attackDamage: { min: 2, max: 3 },
      reward: { earthElementalCore: 1 },
    },
  },
  spells: {
    manaBolt: {
      label: "Mana Bolt",
      manaCost: 10,
      castTimeSeconds: 1,
      damage: { min: 8, max: 12 },
    },
  },
};

function isCombatActive() {
  return !!gameState.combat && gameState.combat.active && !gameState.combat.resolved;
}

function getCombatEnemy() {
  return gameState.combat.enemyId ? COMBAT_CONFIG.enemies[gameState.combat.enemyId] : null;
}

function hookCombatUI() {
  if (ui.testCombatBtn) {
    ui.testCombatBtn.addEventListener("click", startTestCombat);
  }

  if (ui.manaBoltBtn) {
    ui.manaBoltBtn.addEventListener("click", startManaBoltCast);
  }

  if (ui.combatRecallBtn) {
    ui.combatRecallBtn.addEventListener("click", recallFromCombat);
  }

  if (ui.closeCombatBtn) {
    ui.closeCombatBtn.addEventListener("click", closeCombatEncounter);
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

function canStartManaBoltCast() {
  const spell = COMBAT_CONFIG.spells.manaBolt;

  return (
    isCombatActive() &&
    gameState.combat.enemyHealth > 0 &&
    !gameState.combat.cast &&
    getResource("mana").value + RESOURCE_AFFORDABILITY_EPSILON >= spell.manaCost
  );
}

function startManaBoltCast() {
  if (!canStartManaBoltCast()) return false;

  const spell = COMBAT_CONFIG.spells.manaBolt;
  const now = getGameTime();

  gameState.combat.cast = {
    startTime: now,
    endTime: now + spell.castTimeSeconds * 1000,
    manaSpent: 0,
  };
  gameState.combat.resultMessage = "Gathering mana for Mana Bolt…";
  renderCombatUI();
  return true;
}

function spendManaBoltProgress(now) {
  const cast = gameState.combat.cast;
  const spell = COMBAT_CONFIG.spells.manaBolt;

  if (!cast) return;

  const elapsed = Math.max(0, now - cast.startTime);
  const targetSpent = roundResourceAmount(Math.min(1, elapsed / (spell.castTimeSeconds * 1000)) * spell.manaCost);
  const amountToSpend = roundResourceAmount(targetSpent - cast.manaSpent);

  if (amountToSpend <= 0) return;

  // A cast only begins with the full cost available. Combat blocks other mana
  // actions while it is active, so this reaches exactly the configured total.
  spendCost({ mana: amountToSpend });
  cast.manaSpent = targetSpent;
}

function processCombatTick() {
  if (!isCombatActive()) return;

  const now = getGameTime();
  const cast = gameState.combat.cast;

  // Resolve the player's completed cast before a same-tick enemy attack.
  if (cast) {
    spendManaBoltProgress(now);

    if (now >= cast.endTime) {
      completeManaBoltCast();
    }
  }

  if (!isCombatActive()) return;

  const enemy = getCombatEnemy();

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

function completeManaBoltCast() {
  const spell = COMBAT_CONFIG.spells.manaBolt;

  if (!isCombatActive() || !gameState.combat.cast) return;

  gameState.combat.cast = null;
  const damage = rollCombatRange(spell.damage);
  gameState.combat.enemyHealth = Math.max(0, gameState.combat.enemyHealth - damage);
  gameState.combat.resultMessage = "Mana Bolt hits for " + damage + " damage.";

  if (gameState.combat.enemyHealth <= 0) {
    resolveCombatVictory();
  }
}

function rollCombatRange(range) {
  return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

function resolveCombatVictory() {
  if (!isCombatActive() || gameState.combat.enemyHealth > 0) return;

  gameState.combat.cast = null;
  gameState.combat.resolved = true;

  if (!gameState.combat.rewardGranted) {
    const reward = gameState.combat.reward || {};

    for (let resourceName in reward) {
      addResource(resourceName, reward[resourceName]);
      unlockResource(resourceName);
    }

    gameState.combat.rewardGranted = true;
  }

  if (gameState.combat.storyEncounter) {
    resolveNorthernDisturbanceVictory();
    gameState.combat.resultMessage = "Victory — the elemental collapses, leaving an Earth Elemental Core behind.";
  } else {
    gameState.combat.resultMessage = "Victory — the elemental crumbles.";
  }
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
  ui.manaBoltProgressFill.style.width = castProgress * 100 + "%";
  ui.manaBoltBtn.disabled = !canStartManaBoltCast();
  ui.manaBoltBtn.style.display = combat.resolved ? "none" : "block";
  ui.combatRecallBtn.style.display = isCombatActive() ? "block" : "none";
  ui.combatRecallBtn.disabled = !isCombatActive();
  ui.closeCombatBtn.style.display = combat.resolved ? "inline-block" : "none";

  if (combat.resolved) {
    safeSetText(ui.combatAttackTimer, "");
  } else {
    const seconds = Math.max(0, (combat.nextAttackTime - getGameTime()) / 1000);
    safeSetText(ui.combatAttackTimer, "Next attack in " + seconds.toFixed(1) + "s");
  }

  safeSetText(ui.combatStatus, combat.resultMessage);
}
