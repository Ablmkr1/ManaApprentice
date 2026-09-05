(function () {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  let towerSceneSequence = 0;

  function svgElement(name, attributes, text) {
    const element = document.createElementNS(SVG_NS, name);

    Object.keys(attributes || {}).forEach(function (name) {
      const value = attributes[name];
      if (value !== undefined && value !== null) element.setAttribute(name, String(value));
    });

    if (text !== undefined && text !== null) element.textContent = text;
    return element;
  }

  function add(parent, name, attributes, text) {
    const element = svgElement(name, attributes, text);
    parent.appendChild(element);
    return element;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value) || 0));
  }

  function projectState(projectId) {
    return typeof getProjectState === "function" ? getProjectState(projectId) : null;
  }

  function constructionState(projectId) {
    return typeof getTowerConstructionState === "function" ? getTowerConstructionState(projectId) : "locked";
  }

  function projectStage(projectId) {
    const state = projectState(projectId);
    const definition = typeof getProjectDefinition === "function" ? getProjectDefinition(projectId) : null;

    if (!state || !definition) return 0;
    if (typeof getTowerProjectStageIndex === "function") return getTowerProjectStageIndex(definition, state);
    if (state.completed) return Math.max(0, (definition.visualStages || []).length - 1);
    return Math.max(0, Number(state.level) || 0);
  }

  function projectProgress(projectId) {
    const state = projectState(projectId);
    if (!state) return 0;
    if (state.completed) return 1;
    return typeof getTowerProjectVisualProgress === "function"
      ? clamp(getTowerProjectVisualProgress(projectId), 0, 1)
      : clamp(state.visualProgress, 0, 1);
  }

  function totalProjectProgress(projectId) {
    const state = projectState(projectId);
    const definition = typeof getProjectDefinition === "function" ? getProjectDefinition(projectId) : null;
    if (!state) return 0;
    if (state.completed) return 1;

    const stageCount = Math.max(1, ((definition && definition.visualStages) || []).length - 1);
    return clamp((projectStage(projectId) + projectProgress(projectId)) / stageCount, 0, 0.98);
  }

  function selectionVisible(selectedId) {
    return typeof isTowerSelectionVisible === "function" && isTowerSelectionVisible(selectedId);
  }

  function stateLabel(stateName) {
    return typeof getTowerStateLabel === "function" ? getTowerStateLabel(stateName) : stateName;
  }

  function addHitArea(group, attributes) {
    const hit = svgElement("rect", Object.assign({ class: "tower-unified-hit" }, attributes));
    group.insertBefore(hit, group.firstChild);
    return hit;
  }

  function addFocusRing(group, attributes) {
    return add(group, "rect", Object.assign({ class: "tower-unified-focus-ring" }, attributes));
  }

  function makeZone(group, selectedId, label, stateName, hitArea) {
    let zone = group;

    if (typeof makeTowerSvgZone === "function") {
      zone = makeTowerSvgZone(group, selectedId, label, stateName);
    } else {
      group.classList.add("tower-illustration-zone", "is-" + stateName);
      group.dataset.towerSelect = selectedId;
      group.setAttribute("role", "button");
      group.setAttribute("tabindex", "0");
      group.setAttribute("aria-label", label + ". " + stateLabel(stateName) + ".");
      group.setAttribute("aria-pressed", String(gameState.tower.selectedId === selectedId));
      if (gameState.tower.selectedId === selectedId) group.classList.add("is-selected");

      const activate = function (event) {
        event.stopPropagation();
        selectTowerEntity(selectedId);
      };
      group.addEventListener("click", activate);
      group.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        activate(event);
      });
    }

    addHitArea(zone, hitArea);
    return zone;
  }

  function focusElementalControls() {
    const panel = document.querySelector(".elemental-tower-panel");
    if (!panel) return;

    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    panel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });

    const control = panel.querySelector(
      "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex='-1'])"
    );

    if (control) {
      control.focus({ preventScroll: true });
    } else {
      panel.setAttribute("tabindex", "-1");
      panel.focus({ preventScroll: true });
    }
  }

  function activateGolemControl(event) {
    event.stopPropagation();
    selectTowerEntity("heart");
    document.dispatchEvent(new CustomEvent("mana-tower:golem-control", { bubbles: true }));
    window.setTimeout(focusElementalControls, 0);
  }

  function makeGolemZone(group, hitArea) {
    group.classList.add("tower-illustration-zone", "tower-golem-zone", "is-completed");
    group.dataset.towerSelect = "golem-control";
    group.setAttribute("role", "button");
    group.setAttribute("tabindex", "0");
    group.setAttribute("aria-label", "Golem Control. Open Bound Earth Elemental controls.");
    add(group, "title", null, "Golem Control — open Bound Earth Elemental controls");
    addHitArea(group, hitArea);
    group.addEventListener("click", activateGolemControl);
    group.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      activateGolemControl(event);
    });
    return group;
  }

  function sceneIds() {
    const suffix = ++towerSceneSequence;
    return {
      sky: "towerUnifiedSky" + suffix,
      soil: "towerUnifiedSoil" + suffix,
      stone: "towerUnifiedStone" + suffix,
      stoneDark: "towerUnifiedStoneDark" + suffix,
      room: "towerUnifiedRoom" + suffix,
      heart: "towerUnifiedHeart" + suffix,
      glow: "towerUnifiedGlow" + suffix,
      softGlow: "towerUnifiedSoftGlow" + suffix,
    };
  }

  function drawDefinitions(svg, ids) {
    const defs = add(svg, "defs");
    const sky = add(defs, "linearGradient", { id: ids.sky, x1: 0, x2: 0, y1: 0, y2: 1 });
    add(sky, "stop", { offset: 0, "stop-color": "#f6f0df" });
    add(sky, "stop", { offset: 0.7, "stop-color": "#eee5d1" });
    add(sky, "stop", { offset: 1, "stop-color": "#e5d8bd" });

    const soil = add(defs, "pattern", { id: ids.soil, width: 18, height: 14, patternUnits: "userSpaceOnUse" });
    add(soil, "rect", { width: 18, height: 14, fill: "#cdb58d" });
    add(soil, "path", { d: "M2 4h3 M10 10h4 M15 2h1", stroke: "#aa8c62", "stroke-width": 1, opacity: 0.52 });

    const stone = add(defs, "linearGradient", { id: ids.stone, x1: 0, x2: 1, y1: 0, y2: 1 });
    add(stone, "stop", { offset: 0, "stop-color": "#8f8a82" });
    add(stone, "stop", { offset: 0.5, "stop-color": "#6e6962" });
    add(stone, "stop", { offset: 1, "stop-color": "#514d48" });

    const darkStone = add(defs, "linearGradient", { id: ids.stoneDark, x1: 0, x2: 0, y1: 0, y2: 1 });
    add(darkStone, "stop", { offset: 0, "stop-color": "#4d4944" });
    add(darkStone, "stop", { offset: 1, "stop-color": "#393632" });

    const room = add(defs, "linearGradient", { id: ids.room, x1: 0, x2: 0, y1: 0, y2: 1 });
    add(room, "stop", { offset: 0, "stop-color": "#d8c7a4" });
    add(room, "stop", { offset: 1, "stop-color": "#bba47c" });

    const heart = add(defs, "radialGradient", { id: ids.heart, cx: "42%", cy: "34%" });
    add(heart, "stop", { offset: 0, "stop-color": "#f4ffff" });
    add(heart, "stop", { offset: 0.35, "stop-color": "#9ce9f1" });
    add(heart, "stop", { offset: 0.72, "stop-color": "#4db9d1" });
    add(heart, "stop", { offset: 1, "stop-color": "#477c99" });

    const glow = add(defs, "filter", { id: ids.glow, x: "-90%", y: "-90%", width: "280%", height: "280%" });
    add(glow, "feGaussianBlur", { stdDeviation: 8, result: "blur" });
    const glowMerge = add(glow, "feMerge");
    add(glowMerge, "feMergeNode", { in: "blur" });
    add(glowMerge, "feMergeNode", { in: "SourceGraphic" });

    const softGlow = add(defs, "filter", { id: ids.softGlow, x: "-60%", y: "-60%", width: "220%", height: "220%" });
    add(softGlow, "feGaussianBlur", { stdDeviation: 3.5, result: "blur" });
    const softMerge = add(softGlow, "feMerge");
    add(softMerge, "feMergeNode", { in: "blur" });
    add(softMerge, "feMergeNode", { in: "SourceGraphic" });
  }

  function drawLandscape(svg, ids) {
    add(svg, "rect", { class: "tower-unified-sky", x: 0, y: 0, width: 720, height: 840, fill: "url(#" + ids.sky + ")" });
    add(svg, "path", { class: "tower-unified-distant", d: "M0 510 Q85 471 164 506 T321 500 T486 502 T720 490 V560 H0Z" });
    add(svg, "path", { class: "tower-unified-haze", d: "M47 516 V445 M37 459 Q47 432 57 459 M674 518 V428 M663 445 Q674 416 685 445 M92 525 V475 M84 488 Q92 468 100 488" });
    add(svg, "rect", { x: 0, y: 556, width: 720, height: 284, fill: "url(#" + ids.soil + ")" });
    add(svg, "path", { class: "tower-unified-ground-line", d: "M0 556 C82 553 109 558 151 557 S252 552 312 556 S420 559 488 555 S628 553 720 556" });
    add(svg, "path", { class: "tower-unified-roots", d: "M67 557 q-25 18 -25 53 m25 -53 q20 18 27 53 M650 557 q-25 20 -28 56 m28 -56 q25 18 28 56" });
  }

  function excavationGeometry(stage) {
    if (stage <= 0) return null;
    if (stage === 1) return { left: 116, right: 604, bottom: 638, baseLeft: 176, baseRight: 544 };
    if (stage === 2) return { left: 94, right: 626, bottom: 708, baseLeft: 164, baseRight: 556 };
    return { left: 76, right: 644, bottom: 782, baseLeft: 132, baseRight: 588 };
  }

  function drawShoring(group, geometry, amount) {
    if (!geometry || amount <= 0) return;

    const leftX = geometry.baseLeft - 24;
    const rightX = geometry.baseRight + 24;
    const topY = 574;
    const bottomY = geometry.bottom - 18;
    const timber = add(group, "g", { class: "tower-unified-shoring", opacity: clamp(amount, 0.18, 1) });
    add(timber, "path", { d: "M" + leftX + " " + topY + " L" + (leftX + 17) + " " + bottomY + " M" + (leftX + 39) + " " + (topY + 8) + " L" + (leftX - 6) + " " + bottomY });
    add(timber, "path", { d: "M" + rightX + " " + topY + " L" + (rightX - 17) + " " + bottomY + " M" + (rightX - 39) + " " + (topY + 8) + " L" + (rightX + 6) + " " + bottomY });
    add(timber, "path", { d: "M" + (leftX - 5) + " 618 H" + (leftX + 42) + " M" + (leftX - 3) + " 688 H" + (leftX + 29) + " M" + (rightX - 42) + " 618 H" + (rightX + 5) + " M" + (rightX - 29) + " 688 H" + (rightX + 3) });
  }

  function drawFoundation(svg, ids, foundationStage, keepShoring) {
    const geometry = excavationGeometry(foundationStage);

    if (!geometry) {
      add(svg, "path", { class: "tower-unified-buried-trace", d: "M204 671 Q360 657 516 671 Q360 687 204 671Z" });
      add(svg, "path", { class: "tower-unified-buried-mana", d: "M210 655 Q360 641 510 655 M210 688 Q360 702 510 688" });
      add(svg, "path", { class: "tower-unified-buried-stones", d: "M222 671 h16 m10 0 h16 m10 0 h16 m10 0 h16 m10 0 h16 m10 0 h16 m10 0 h16 m10 0 h16 m10 0 h16 m10 0 h16" });
      return;
    }

    add(svg, "path", {
      class: "tower-unified-excavation",
      d: "M" + geometry.left + " 556 L" + geometry.baseLeft + " " + geometry.bottom + " Q360 " + (geometry.bottom + 10) + " " + geometry.baseRight + " " + geometry.bottom + " L" + geometry.right + " 556 Z",
    });
    add(svg, "path", {
      class: "tower-unified-cut-edge",
      d: "M" + geometry.left + " 556 L" + geometry.baseLeft + " " + geometry.bottom + " Q360 " + (geometry.bottom + 10) + " " + geometry.baseRight + " " + geometry.bottom + " L" + geometry.right + " 556",
    });

    if (foundationStage < 3) {
      const contactWidth = foundationStage === 1 ? 120 : 210;
      add(svg, "path", { class: "tower-unified-buried-trace", d: "M" + (360 - contactWidth) + " " + (geometry.bottom - 4) + " Q360 " + (geometry.bottom - 12) + " " + (360 + contactWidth) + " " + (geometry.bottom - 4) });
      return;
    }

    if (keepShoring) drawShoring(svg, geometry, foundationStage >= 3 ? 1 : 0);
    add(svg, "path", { class: "tower-unified-foundation-slab", d: "M132 754 Q360 745 588 754 L574 790 Q360 801 146 790Z", fill: "url(#" + ids.stone + ")" });
    add(svg, "path", { class: "tower-unified-foundation-seam", d: "M151 766 Q360 757 569 766 M169 784 Q360 776 551 784" });
  }

  function drawHeart(group, ids, awakened) {
    add(group, "path", { class: "tower-unified-plinth", d: "M318 744 L329 687 H391 L402 744 Z", fill: "url(#" + ids.stone + ")" });
    add(group, "path", { class: "tower-unified-plinth-rune", d: "M339 720 l12 12 m30 -12 l-12 12 M360 700 v35" });

    if (!awakened) {
      add(group, "circle", { class: "tower-unified-heart-dormant", cx: 360, cy: 660, r: 43 });
      add(group, "path", { class: "tower-unified-heart-dormant-mark", d: "M332 647 Q360 625 388 647 L382 678 Q360 692 338 678Z" });
      return;
    }

    add(group, "path", { class: "tower-unified-mana-channel", d: "M360 616 V559 M329 680 L298 711 M391 680 L422 711" });
    add(group, "circle", { class: "tower-unified-heart-halo", cx: 360, cy: 653, r: 54, filter: "url(#" + ids.glow + ")" });
    add(group, "circle", { class: "tower-unified-heart-ring outer", cx: 360, cy: 653, r: 48 });
    add(group, "circle", { class: "tower-unified-heart-ring inner", cx: 360, cy: 653, r: 39 });
    add(group, "circle", { class: "tower-unified-heart-core", cx: 360, cy: 653, r: 34, fill: "url(#" + ids.heart + ")", filter: "url(#" + ids.softGlow + ")" });
    add(group, "path", { class: "tower-unified-heart-facets", d: "M360 619 V687 M326 653 H394 M338 630 L382 676 M382 630 L338 676" });
    add(group, "path", { class: "tower-unified-heart-stand", d: "M326 689 L310 704 M394 689 L410 704 M360 702 V724" });
  }

  function drawGolem(svg) {
    const group = makeGolemZone(add(svg, "g", { class: "tower-unified-golem" }), { x: 438, y: 624, width: 104, height: 122, rx: 13 });
    add(group, "ellipse", { class: "tower-unified-golem-shadow", cx: 490, cy: 724, rx: 42, ry: 9 });
    add(group, "path", { class: "tower-unified-golem-body", d: "M460 711 L468 665 L480 654 L478 638 L489 626 L502 640 L500 655 L513 666 L521 711Z" });
    add(group, "circle", { class: "tower-unified-golem-eye", cx: 485, cy: 648, r: 2.4 });
    add(group, "circle", { class: "tower-unified-golem-eye", cx: 494, cy: 648, r: 2.4 });
    add(group, "path", { class: "tower-unified-golem-rune", d: "M476 676 L504 676 L499 699 H481Z M476 676 L490 687 L504 676 M490 687 V704" });
    add(group, "path", { class: "tower-unified-plaque", d: "M448 714 H532 L526 739 H454Z" });
    add(group, "text", { class: "tower-unified-plaque-label tower-unified-golem-label", x: 490, y: 730, "text-anchor": "middle" }, "Golem Control");
    addFocusRing(group, { x: 438, y: 624, width: 104, height: 122, rx: 13 });
  }

  function drawStorage(group) {
    add(group, "rect", { class: "tower-unified-cabinet", x: 160, y: 626, width: 73, height: 112, rx: 2 });
    add(group, "rect", { class: "tower-unified-cabinet-panel", x: 171, y: 638, width: 50, height: 39 });
    add(group, "rect", { class: "tower-unified-cabinet-panel", x: 171, y: 687, width: 50, height: 39 });
    add(group, "circle", { class: "tower-unified-cabinet-knob", cx: 215, cy: 682, r: 2.5 });
    add(group, "path", { class: "tower-unified-sack", d: "M251 733 Q244 704 258 693 Q273 705 266 733Z" });
  }

  function drawBasement(svg, ids, basementState) {
    if (basementState === "locked") return;

    const progress = totalProjectProgress("towerBasement");
    const group = makeZone(add(svg, "g", { class: "tower-unified-basement" }), "basement", "Tower Basement", basementState, {
      x: 116,
      y: 552,
      width: 488,
      height: 224,
      rx: 10,
    });

    if (basementState === "available") {
      add(group, "path", { class: "tower-unified-blueprint-fill", d: "M122 772 V560 H598 V772Z" });
      add(group, "path", { class: "tower-unified-blueprint", d: "M122 772 V560 H598 V772 M122 604 H598 M166 560 V772 M554 560 V772 M360 560 V772" });
      add(group, "text", { class: "tower-unified-blueprint-label", x: 360, y: 594, "text-anchor": "middle" }, "BASEMENT RING");
    } else {
      const wallTop = 772 - 212 * progress;
      const clipId = ids.stone + "BasementClip";
      const clip = add(svg.querySelector("defs"), "clipPath", { id: clipId });
      add(clip, "rect", { x: 110, y: wallTop, width: 500, height: 780 - wallTop });
      const masonry = add(group, "g", { "clip-path": "url(#" + clipId + ")" });
      add(masonry, "path", { class: "tower-unified-basement-shell", d: "M112 776 V552 H608 V776 H562 V594 H158 V776Z", fill: "url(#" + ids.stone + ")" });
      add(masonry, "rect", { class: "tower-unified-basement-interior", x: 158, y: 594, width: 404, height: 182, fill: "url(#" + ids.stoneDark + ")" });
      add(masonry, "path", { class: "tower-unified-stone-lines", d: "M112 620 H158 M112 681 H158 M112 738 H158 M562 620 H608 M562 681 H608 M562 738 H608 M134 552 V776 M584 552 V776" });
      add(masonry, "path", { class: "tower-unified-foundation-slab", d: "M130 761 Q360 754 590 761 L578 789 Q360 799 142 789Z", fill: "url(#" + ids.stone + ")" });

      if (progress < 0.98) {
        drawScaffolding(group, 94, 552, 532, 224, progress);
        add(group, "path", { class: "tower-unified-blueprint", d: "M112 552 H608 M158 594 H562 M360 552 V594" });
      }
      if (basementState === "completed") drawStorage(group);
    }

    addFocusRing(group, { x: 116, y: 552, width: 488, height: 224, rx: 10 });
  }

  function drawScaffolding(group, x, y, width, height, progress) {
    const scaffold = add(group, "g", { class: "tower-unified-scaffold", opacity: 0.72 + (1 - progress) * 0.22 });
    const left = x + 18;
    const right = x + width - 18;
    add(scaffold, "path", { d: "M" + left + " " + (y - 5) + " V" + (y + height) + " M" + (left + 24) + " " + (y + 8) + " V" + (y + height) + " M" + right + " " + (y - 5) + " V" + (y + height) + " M" + (right - 24) + " " + (y + 8) + " V" + (y + height) });
    add(scaffold, "path", { d: "M" + (left - 7) + " " + (y + 34) + " H" + (left + 34) + " M" + (left - 7) + " " + (y + 104) + " H" + (left + 34) + " M" + (left - 7) + " " + (y + 174) + " H" + (left + 34) + " M" + (right - 34) + " " + (y + 34) + " H" + (right + 7) + " M" + (right - 34) + " " + (y + 104) + " H" + (right + 7) + " M" + (right - 34) + " " + (y + 174) + " H" + (right + 7) });
  }

  function floorGeometry(floorNumber) {
    if (floorNumber === 1) return { x: 126, y: 354, width: 468, height: 202 };
    return { x: 150, y: 152, width: 420, height: 202 };
  }

  function roomGeometry(floor, roomIndex) {
    const shell = floorGeometry(floor.number);
    const inset = 17;
    const gap = 8;
    const width = (shell.width - inset * 2 - gap * 2) / 3;
    return {
      x: shell.x + inset + roomIndex * (width + gap),
      y: shell.y + 23,
      width,
      height: shell.height - 42,
    };
  }

  function drawFloor(svg, ids, floor) {
    const stateName = constructionState(floor.projectId);
    if (stateName === "locked") return;

    const geometry = floorGeometry(floor.number);
    const progress = totalProjectProgress(floor.projectId);
    const group = makeZone(add(svg, "g", { class: "tower-unified-floor", "data-floor": floor.id }), "floor:" + floor.id, floor.name + ", " + floor.subtitle, stateName, {
      x: geometry.x - 8,
      y: geometry.y - 9,
      width: geometry.width + 16,
      height: geometry.height + 18,
      rx: 9,
    });

    if (stateName === "available") {
      add(group, "path", { class: "tower-unified-blueprint-fill", d: "M" + geometry.x + " " + (geometry.y + geometry.height) + " V" + geometry.y + " H" + (geometry.x + geometry.width) + " V" + (geometry.y + geometry.height) + "Z" });
      add(group, "path", { class: "tower-unified-blueprint", d: "M" + geometry.x + " " + (geometry.y + geometry.height) + " V" + geometry.y + " H" + (geometry.x + geometry.width) + " V" + (geometry.y + geometry.height) + " M360 " + geometry.y + " V" + (geometry.y + geometry.height) });
      add(group, "text", { class: "tower-unified-blueprint-label", x: 360, y: geometry.y + geometry.height / 2, "text-anchor": "middle" }, floor.name.toUpperCase() + " READY");
    } else {
      const revealY = geometry.y + geometry.height * (1 - progress);
      const clipId = ids.stone + floor.id + "Clip";
      const clip = add(svg.querySelector("defs"), "clipPath", { id: clipId });
      add(clip, "rect", { x: geometry.x - 12, y: revealY, width: geometry.width + 24, height: geometry.y + geometry.height - revealY + 14 });
      const shell = add(group, "g", { "clip-path": "url(#" + clipId + ")" });
      add(shell, "path", { class: "tower-unified-floor-shell", d: "M" + geometry.x + " " + (geometry.y + geometry.height) + " L" + (geometry.x + 9) + " " + geometry.y + " H" + (geometry.x + geometry.width - 9) + " L" + (geometry.x + geometry.width) + " " + (geometry.y + geometry.height) + "Z", fill: "url(#" + ids.stone + ")" });
      add(shell, "rect", { class: "tower-unified-floor-interior", x: geometry.x + 15, y: geometry.y + 19, width: geometry.width - 30, height: geometry.height - 38, fill: "url(#" + ids.stoneDark + ")" });
      add(shell, "path", { class: "tower-unified-floor-beams", d: "M" + (geometry.x - 4) + " " + (geometry.y + geometry.height) + " H" + (geometry.x + geometry.width + 4) + " M" + (geometry.x - 2) + " " + geometry.y + " H" + (geometry.x + geometry.width + 2) });

      if (stateName !== "completed") {
        add(group, "path", { class: "tower-unified-blueprint", d: "M" + geometry.x + " " + geometry.y + " H" + (geometry.x + geometry.width) + " V" + (geometry.y + geometry.height) + " H" + geometry.x + "Z M360 " + geometry.y + " V" + (geometry.y + geometry.height) });
        drawScaffolding(group, geometry.x - 46, geometry.y, geometry.width + 92, geometry.height, progress);
      }
    }

    add(group, "path", { class: "tower-unified-floor-cornice", d: "M" + (geometry.x - 8) + " " + geometry.y + " H" + (geometry.x + geometry.width + 8) + " M" + (geometry.x - 13) + " " + (geometry.y + geometry.height) + " H" + (geometry.x + geometry.width + 13) });
    add(group, "path", { class: "tower-unified-floor-number-tab", d: "M" + (geometry.x + 3) + " " + (geometry.y + 70) + " L" + (geometry.x + 28) + " " + (geometry.y + 65) + " V" + (geometry.y + 105) + " L" + (geometry.x + 3) + " " + (geometry.y + 100) + "Z" });
    add(group, "text", { class: "tower-unified-floor-number", x: geometry.x + 16, y: geometry.y + 91, "text-anchor": "middle" }, floor.number);
    addFocusRing(group, { x: geometry.x - 8, y: geometry.y - 9, width: geometry.width + 16, height: geometry.height + 18, rx: 9 });

    if (stateName !== "completed") return;
    floor.rooms.forEach(function (roomId, roomIndex) {
      const room = typeof getTowerRoomDefinition === "function" ? getTowerRoomDefinition(roomId) : null;
      if (room && selectionVisible("room:" + room.id)) drawRoom(svg, ids, floor, room, roomIndex);
    });
  }

  function drawRoom(svg, ids, floor, room, roomIndex) {
    const stateName = constructionState(room.projectId);
    if (stateName === "locked") return;

    const geometry = roomGeometry(floor, roomIndex);
    const group = makeZone(add(svg, "g", { class: "tower-unified-room", "data-room": room.id }), "room:" + room.id, room.name, stateName, {
      x: geometry.x - 3,
      y: geometry.y - 4,
      width: geometry.width + 6,
      height: geometry.height + 9,
      rx: 14,
    });

    add(group, "rect", {
      class: "tower-unified-room-bay",
      x: geometry.x,
      y: geometry.y,
      width: geometry.width,
      height: geometry.height,
      rx: 14,
      style: stateName === "completed" ? "fill:url(#" + ids.room + ")" : undefined,
    });

    if (stateName === "available") {
      drawRoomBlueprint(group, room, geometry);
    } else if (stateName === "under-construction") {
      const progress = clamp(projectProgress(room.projectId), 0.08, 0.95);
      const clipId = ids.room + room.id + "Clip";
      const clip = add(svg.querySelector("defs"), "clipPath", { id: clipId });
      add(clip, "rect", { x: geometry.x, y: geometry.y + geometry.height * (1 - progress), width: geometry.width, height: geometry.height * progress });
      const art = add(group, "g", { "clip-path": "url(#" + clipId + ")" });
      drawRoomInterior(art, room.id, geometry, false);
      drawRoomBlueprint(group, room, geometry);
      add(group, "text", { class: "tower-unified-room-progress", x: geometry.x + geometry.width - 8, y: geometry.y + 15, "text-anchor": "end" }, Math.round(progress * 100) + "%");
    } else {
      drawRoomInterior(group, room.id, geometry, true);
      drawRoomPlaque(group, room, geometry);
    }

    add(group, "circle", { class: "tower-unified-room-mana-pin", cx: geometry.x + geometry.width - 11, cy: geometry.y + 11, r: 4.5 });
    addFocusRing(group, { x: geometry.x - 3, y: geometry.y - 4, width: geometry.width + 6, height: geometry.height + 9, rx: 14 });
  }

  function drawRoomBlueprint(group, room, geometry) {
    const left = geometry.x + 13;
    const right = geometry.x + geometry.width - 13;
    const top = geometry.y + 17;
    const bottom = geometry.y + geometry.height - 17;
    add(group, "path", { class: "tower-unified-room-plan", d: "M" + left + " " + bottom + " V" + top + " H" + right + " V" + bottom + " M" + left + " " + (top + 34) + " H" + right + " M" + (left + 17) + " " + top + " V" + bottom });
    add(group, "text", { class: "tower-unified-room-plan-label", x: geometry.x + geometry.width / 2, y: geometry.y + geometry.height / 2 + 5, "text-anchor": "middle" }, room.name.replace(" Room", "").toUpperCase());
  }

  function drawRoomPlaque(group, room, geometry) {
    const label = room.id === "alchemyRoom" ? "Alchemy" : room.id === "enchantingStudy" ? "Enchanting" : room.name;
    add(group, "path", { class: "tower-unified-plaque", d: "M" + (geometry.x + 8) + " " + (geometry.y + geometry.height - 25) + " H" + (geometry.x + geometry.width - 8) + " L" + (geometry.x + geometry.width - 14) + " " + (geometry.y + geometry.height - 5) + " H" + (geometry.x + 14) + "Z" });
    add(group, "text", { class: "tower-unified-plaque-label", x: geometry.x + geometry.width / 2, y: geometry.y + geometry.height - 11, "text-anchor": "middle" }, label);
  }

  function drawRoomInterior(group, roomId, geometry) {
    const x = geometry.x;
    const y = geometry.y;
    const w = geometry.width;
    const h = geometry.height;
    const floorY = y + h - 32;
    const furniture = { class: "tower-unified-furniture" };
    const detail = { class: "tower-unified-furniture-detail" };
    const magic = { class: "tower-unified-room-magic" };

    if (roomId === "bedroom") {
      add(group, "rect", Object.assign({ x: x + 13, y: floorY - 31, width: w - 27, height: 27, rx: 2 }, furniture));
      add(group, "rect", Object.assign({ x: x + 20, y: floorY - 25, width: w - 43, height: 14, rx: 7 }, { class: "tower-unified-linen" }));
      add(group, "ellipse", Object.assign({ cx: x + 36, cy: floorY - 18, rx: 14, ry: 6 }, { class: "tower-unified-pillow" }));
      add(group, "path", Object.assign({ d: "M" + (x + 13) + " " + (floorY - 31) + " V" + (floorY + 2) + " M" + (x + w - 14) + " " + (floorY - 31) + " V" + (floorY + 2) }, detail));
      add(group, "path", { class: "tower-unified-window", d: "M" + (x + w / 2 - 9) + " " + (y + 25) + " Q" + (x + w / 2 + 10) + " " + (y + 37) + " " + (x + w / 2 - 9) + " " + (y + 49) + "Z" });
    } else if (roomId === "library") {
      add(group, "path", Object.assign({ d: "M" + (x + 12) + " " + (y + 30) + " V" + (floorY - 10) + " M" + (x + w - 12) + " " + (y + 30) + " V" + (floorY - 10) + " M" + (x + 12) + " " + (y + 54) + " H" + (x + w - 12) + " M" + (x + 12) + " " + (y + 83) + " H" + (x + w - 12) }, furniture));
      const bookColors = ["#8a5b4c", "#476b69", "#a5814b", "#6c5872", "#876140"];
      for (let i = 0; i < 7; i++) add(group, "rect", { class: "tower-unified-book", x: x + 17 + i * 10, y: y + 34 + (i % 2) * 3, width: 7, height: 18 + (i % 3) * 3, fill: bookColors[i % bookColors.length] });
      add(group, "rect", Object.assign({ x: x + 16, y: floorY - 20, width: w - 32, height: 12 }, furniture));
      add(group, "path", Object.assign({ d: "M" + (x + 23) + " " + (floorY - 8) + " V" + (floorY + 3) + " M" + (x + w - 23) + " " + (floorY - 8) + " V" + (floorY + 3) }, detail));
      add(group, "path", { class: "tower-unified-open-book", d: "M" + (x + w / 2) + " " + (floorY - 19) + " q-14 -8 -27 0 q13 1 27 8 q14 -7 27 -8 q-13 -8 -27 0Z" });
    } else if (roomId === "workshop") {
      add(group, "rect", { class: "tower-unified-chalkboard", x: x + 17, y: y + 30, width: w - 34, height: 58, rx: 2 });
      add(group, "path", { class: "tower-unified-chalk", d: "M" + (x + 30) + " " + (y + 70) + " l11 -25 l7 33 m8 -29 q10 15 24 23 m-7 -18 l11 6" });
      add(group, "rect", Object.assign({ x: x + 13, y: floorY - 22, width: w - 26, height: 13 }, furniture));
      add(group, "path", Object.assign({ d: "M" + (x + 22) + " " + (floorY - 9) + " V" + (floorY + 4) + " M" + (x + w - 22) + " " + (floorY - 9) + " V" + (floorY + 4) }, detail));
      add(group, "path", { class: "tower-unified-gear", d: "M" + (x + w - 43) + " " + (floorY - 54) + " l7 5 l8 -3 l5 8 l8 2 l-1 9 l6 6 l-6 7 l1 9 l-9 2 l-5 8 l-8 -4 l-8 4 l-5 -8 l-9 -2 l2 -9 l-6 -7 l6 -6 l-2 -9 l9 -2 l5 -8 l8 3Z" });
    } else if (roomId === "alchemyRoom") {
      add(group, "rect", Object.assign({ x: x + 15, y: floorY - 13, width: w - 30, height: 10 }, furniture));
      add(group, "path", Object.assign({ d: "M" + (x + 24) + " " + (floorY - 3) + " V" + (floorY + 4) + " M" + (x + w - 24) + " " + (floorY - 3) + " V" + (floorY + 4) + " M" + (x + w - 34) + " " + (y + 34) + " V" + (floorY - 13) + " M" + (x + w - 34) + " " + (y + 45) + " H" + (x + w - 9) + " M" + (x + w - 34) + " " + (y + 69) + " H" + (x + w - 9) }, detail));
      add(group, "path", { class: "tower-unified-flask", d: "M" + (x + 43) + " " + (y + 45) + " v20 l-18 30 q18 18 36 0 l-18 -30 v-20 M" + (x + 35) + " " + (y + 45) + " h16" });
      add(group, "path", { class: "tower-unified-liquid", d: "M" + (x + 28) + " " + (y + 91) + " q15 10 30 0 q-1 19 -15 20 q-14 -1 -15 -20Z" });
      add(group, "path", Object.assign({ d: "M" + (x + 17) + " " + (y + 34) + " q14 16 0 36 m8 -36 q14 16 0 36" }, magic));
      add(group, "path", { class: "tower-unified-small-flask", d: "M" + (x + w - 25) + " " + (y + 56) + " v9 l-8 13 h16 l-8 -13" });
    } else if (roomId === "forge") {
      add(group, "path", { class: "tower-unified-forge", d: "M" + (x + 18) + " " + (floorY - 9) + " V" + (y + 60) + " Q" + (x + 41) + " " + (y + 33) + " " + (x + 64) + " " + (y + 60) + " V" + (floorY - 9) + "Z" });
      add(group, "path", { class: "tower-unified-fire", d: "M" + (x + 31) + " " + (floorY - 10) + " q-7 -15 8 -28 q-2 13 7 18 q9 -12 14 10 q-4 18 -15 18 q-10 0 -14 -18Z" });
      add(group, "path", Object.assign({ d: "M" + (x + w - 63) + " " + (y + 56) + " h43 l-8 14 h-13 v22 h-13 v-22 h-12Z" }, furniture));
      add(group, "path", Object.assign({ d: "M" + (x + w - 46) + " " + (y + 34) + " l-6 26 h18 l-4 -26Z" }, detail));
    } else if (roomId === "enchantingStudy") {
      add(group, "circle", { class: "tower-unified-enchant-circle", cx: x + w / 2, cy: y + 75, r: 36 });
      add(group, "path", { class: "tower-unified-enchant-runes", d: "M" + (x + w / 2 - 35) + " " + (y + 75) + " H" + (x + w / 2 + 35) + " M" + (x + w / 2) + " " + (y + 39) + " V" + (y + 111) });
      add(group, "path", { class: "tower-unified-enchant-crystal", d: "M" + (x + w / 2) + " " + (y + 37) + " L" + (x + w / 2 + 17) + " " + (y + 72) + " L" + (x + w / 2) + " " + (y + 99) + " L" + (x + w / 2 - 17) + " " + (y + 72) + "Z" });
      add(group, "path", Object.assign({ d: "M" + (x + 23) + " " + (floorY - 16) + " Q" + (x + w / 2) + " " + (floorY - 34) + " " + (x + w - 23) + " " + (floorY - 16) + " L" + (x + w - 17) + " " + (floorY - 4) + " H" + (x + 17) + "Z" }, furniture));
    }
  }

  function drawRoof(svg, ids) {
    const roof = add(svg, "g", { class: "tower-unified-roof" });
    add(roof, "path", { class: "tower-unified-roof-shadow", d: "M128 153 L360 31 L592 153 L575 167 H145Z" });
    add(roof, "path", { class: "tower-unified-roof-plane", d: "M133 151 L360 35 L587 151Z" });
    add(roof, "path", { class: "tower-unified-roof-trim", d: "M135 151 L360 35 L585 151 M360 35 V151 M126 157 H594" });
    add(roof, "path", { class: "tower-unified-spire", d: "M360 35 V20 M351 20 L360 3 L369 20 L360 36Z", filter: "url(#" + ids.softGlow + ")" });
  }

  function determineScene() {
    const foundation = projectState("towerFoundation");
    const basement = projectState("towerBasement");
    const floors = typeof getTowerFloorDefinitions === "function" ? Object.values(getTowerFloorDefinitions()) : [];
    const visibleFloors = floors.filter(function (floor) { return selectionVisible("floor:" + floor.id); });
    const highestFloor = visibleFloors.sort(function (a, b) { return b.number - a.number; })[0] || null;
    const foundationStage = foundation && foundation.completed ? 5 : projectStage("towerFoundation");
    const basementVisible = !!basement && (basement.unlocked || basement.completed);

    if (highestFloor && highestFloor.number >= 2) return { viewBox: "0 0 720 840", phase: "floor2", foundationStage: 5, visibleFloors };
    if (highestFloor) return { viewBox: "18 112 684 704", phase: "floor1", foundationStage: 5, visibleFloors };
    if (basementVisible || (foundation && foundation.completed)) return { viewBox: "35 245 650 570", phase: "heart-basement", foundationStage: 5, visibleFloors };
    return { viewBox: foundationStage <= 1 ? "70 340 580 410" : "45 305 630 510", phase: "foundation", foundationStage, visibleFloors };
  }

  function createUnifiedTowerVisual() {
    const scene = determineScene();
    const ids = sceneIds();
    const wrapper = document.createElement("div");
    wrapper.className = "tower-unified-stage tower-building-stage";
    wrapper.dataset.towerPhase = scene.phase;

    const svg = svgElement("svg", {
      class: "tower-unified-visual tower-building-visual",
      viewBox: scene.viewBox,
      preserveAspectRatio: "xMidYMid meet",
      role: "group",
      "aria-label": "Interactive Wizard Tower cutaway. Select a visible structure or room for details.",
    });

    drawDefinitions(svg, ids);
    drawLandscape(svg, ids);
    const foundation = projectState("towerFoundation");
    const foundationVisible = !!foundation && (foundation.unlocked || foundation.completed);
    const awakened = !!foundation && foundation.completed;
    const basementState = constructionState("towerBasement");
    drawFoundation(svg, ids, scene.foundationStage, basementState !== "completed");
    drawBasement(svg, ids, basementState);

    if (foundationVisible) {
      const heartState = awakened ? "completed" : constructionState("towerFoundation");
      const heart = makeZone(add(svg, "g", { class: "tower-unified-heart" }), "heart", awakened ? "Tower Heart" : "Tower foundation and dormant Heart", heartState, {
        x: 292,
        y: 590,
        width: 136,
        height: 166,
        rx: 20,
      });
      if (scene.foundationStage >= 4 || awakened) drawHeart(heart, ids, awakened);
      addFocusRing(heart, { x: 292, y: 590, width: 136, height: 166, rx: 20 });
    }

    if (awakened && typeof isBoundEarthElementalTowerUnlocked === "function" && isBoundEarthElementalTowerUnlocked()) {
      drawGolem(svg);
    }

    scene.visibleFloors
      .slice()
      .sort(function (a, b) { return a.number - b.number; })
      .forEach(function (floor) { drawFloor(svg, ids, floor); });

    if (constructionState("towerFloor2") === "completed") drawRoof(svg, ids);

    wrapper.appendChild(svg);
    return wrapper;
  }

  window.createUnifiedTowerVisual = createUnifiedTowerVisual;
  window.createTowerBuildingVisual = createUnifiedTowerVisual;
  window.createTowerEarlyStageVisual = createUnifiedTowerVisual;
})();
