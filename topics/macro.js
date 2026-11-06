/* Topics 7–9: the macroeconomy. All seven widgets share one AD–AS model and drawing.
   Keynesian AS: horizontal at the price level `level` up to 0.6 × full, a smooth intermediate section, then vertical at full.
   AD: GPL = intercept − RNY. Geometry is qualitative; the coordinates are not economic units. */
(() => {
  const near = (a, b) => Math.abs(a - b) < 1e-6;
  const word = v => near(v, 0) ? 'unchanged' : v > 0 ? 'increases' : 'decreases';
  const size = v => v === 0 ? 'none' : v < 34 ? 'small' : v < 67 ? 'medium' : 'large';

  // ---------- Shared model ----------
  const asPoint = (t, full, level) => ({ q: 0.6 * full + 0.4 * full * (2 * t - t * t), p: level + (70 - level) * t * t });
  function equilibrium(intercept, full, level) {
    if (intercept - level <= 0.6 * full) return { q: intercept - level, p: level, section: 'horizontal' };
    if (intercept - full >= 70) return { q: full, p: intercept - full, section: 'vertical' };
    let lo = 0, hi = 1;
    for (let i = 0; i < 64; i++) { const t = (lo + hi) / 2, a = asPoint(t, full, level); if (intercept - a.q > a.p) lo = t; else hi = t; }
    return { ...asPoint((lo + hi) / 2, full, level), section: 'intermediate' };
  }
  // Intercepts that start the economy on each section of AS (level 20, full 85):
  // horizontal needs intercept ≤ 71, vertical needs intercept ≥ 155.
  const initials = { horizontal: 70, intermediate: 110, vertical: 155 };
  const initialOptions = [['horizontal', 'Horizontal SRAS'], ['intermediate', 'Intermediate section'], ['vertical', 'Vertical LRAS']];

  // ---------- Shared drawing ----------
  const pmaxOf = P => P.y[1];
  function asCurve(P, C, full, level, label, color, tip, labelAt) {
    const pts = [[0, level], [0.6 * full, level]];
    for (let i = 1; i <= 100; i++) { const a = asPoint(i / 100, full, level); pts.push([a.q, a.p]); }
    pts.push([full, pmaxOf(P)]);
    P.path(pts, { color, tip: tip || ['macro.as', { label: label.replace('_', '') }] });
    // Label beside the vertical section, or beside the horizontal section when only costs (SRAS) changed.
    P.pointLabel(labelAt === 'horizontal' ? [0.24 * full, level] : [full, pmaxOf(P) * 0.88], label,
      { color: color === C.supply0 ? C.supply : color, prefer: labelAt === 'horizontal' ? 'n' : labelAt === 'left' ? 'w' : 'e' });
  }
  // AD line. side: which side of the line the label sits on ('ne' above-right, 'sw' below-left), so that the labels of
  // AD₀ and AD₁ sit on their outer sides; at: fraction along the line for the label (multiplier stages are spread out).
  function adCurve(P, C, intercept, label, color, { tip, width, early, side = 'ne', at, unlabelled } = {}) {
    const a = [Math.max(0, intercept - pmaxOf(P)), Math.min(intercept, pmaxOf(P))], b = [Math.min(P.x[1], intercept), intercept - Math.min(P.x[1], intercept)];
    P.line(a, b, { color, width, tip: tip || ['macro.ad', { label: label.replace('_', '') }] });
    if (unlabelled) return;
    if (at == null && side === 'sw' && !early) at = 0.45;   // a label below-left of the lower end would fall under the axis
    const q = at != null ? a[0] + (b[0] - a[0]) * at : early ? Math.min(b[0] - 6, a[0] + 20) : b[0] - 6;
    P.pointLabel([q, intercept - q], label, { color: color === C.demand0 ? C.demand : color, prefer: side, gap: [5, 10, 18, 28] });
  }
  // Equilibrium points with guides and axis labels (P₀/P₁ on the GPL axis, Y₀/Y₁ on the RNY axis).
  function points(P, C, a, b, { names = ['E_0', 'E_1'], tip = 'macro.equilibrium', shifted = true } = {}) {
    const same = near(a.q, b.q) && near(a.p, b.p);
    P.guide(a.q, a.p); if (!same && shifted) P.guide(b.q, b.p);
    P.pLabel(a.p, 'P_0', { color: shifted && !same ? C.grey : C.ink }); P.qLabel(a.q, 'Y_0', { color: shifted && !same ? C.grey : C.ink });
    if (shifted) { P.pLabel(b.p, 'P_1'); P.qLabel(b.q, 'Y_1'); }
    if (same || !shifted) { P.dot([a.q, a.p], C.ink, tip); P.pointLabel([a.q, a.p], shifted ? `${names[0]} = ${names[1]}` : names[0], { tip }); return; }
    P.dot([a.q, a.p], C.grey, tip); P.pointLabel([a.q, a.p], names[0], { color: C.grey, tip });
    P.dot([b.q, b.p], C.ink, tip); P.pointLabel([b.q, b.p], names[1], { tip });
    P.pChange(a.p, b.p, { tip: ['macro.changeGPL', { dir: word(b.p - a.p) }] });
    P.qChange(a.q, b.q, { tip: ['macro.changeRNY', { dir: word(b.q - a.q) }] });
  }
  const arrow = (P, C, a, b) => { if (Math.hypot(a.q - b.q, a.p - b.p) > 1e-7) P.line([a.q, a.p], [b.q, b.p], { color: C.red, width: 1.8, arrow: true }); };
  // AD shift arrow at a price level where both curves are on the plot.
  function adArrow(P, C, i0, i1) {
    let p = 55; const q = i0 - p;
    if (!(q >= 0 && q <= P.x[1] && q + (i1 - i0) >= 0 && q + (i1 - i0) <= P.x[1])) p = 100;
    arrow(P, C, { q: i0 - p, p }, { q: i1 - p, p });
  }
  // Capacity changes are shown between the vertical sections near the top; pure cost changes between the horizontal sections.
  const asArrow = (P, C, full, level, base) => full === base.full ? arrow(P, C, { q: 30, p: base.level }, { q: 30, p: level }) : arrow(P, C, { q: base.full, p: 95 }, { q: full, p: 95 });
  const asLabelPos = (full, level, base) => full !== base.full ? null : level !== base.level ? 'horizontal' : null;
  const table = rows => EW.summary(rows);
  // GPL and RNY rows, with the diagram symbols P₀ → P₁ and Y₀ → Y₁.
  const gplRny = (a, b) => [['GPL', EW.chg(b.p - a.p, 'P_0', 'P_1')], ['RNY', EW.chg(b.q - a.q, 'Y_0', 'Y_1')]];
  const AS = (v) => EW.chg(v, 'AS_0', 'AS_1'), AD = v => EW.chg(v, 'AD_0', 'AD_1');
  const plot = { x: [0, 120], y: [0, 120], box: [90, 40, 490, 440] };
  const coreGlossary = ['aggregateDemand', 'aggregateSupply', 'macroeconomicEquilibrium'];

  /* ---------- Topic 7: Aggregate demand factors ---------- */
  const components = { C: 'Consumption', I: 'Investment', G: 'Government expenditure', X: 'Exports', M: 'Imports' };
  EW.register({
    id: 'ad-factors', title: 'Factors Affecting Aggregate Demand', plot,
    glossary: ['aggregateDemand', 'aggregateSupply', 'consumption', 'investment', 'governmentExpenditure', 'exports', 'imports', 'netExportsXM', 'changeInAggregateDemand', 'changeInRealOutputDemanded', 'fullEmploymentOutput'],
    controls: [
      { type: 'radio', id: 'mode', label: 'Mode', options: [['movement', 'Movement along AD'], ['shift', 'Shift in AD']], onChange: st => { st.change = 0; st.price = 50; } },
      { type: 'slider', id: 'price', label: 'General price level', min: 20, max: 80, value: 50, ends: ['Lower', 'Higher'], showIf: st => st.mode === 'movement' },
      { type: 'radio', id: 'component', label: 'Component', options: Object.entries(components).map(([k, v]) => [k, `${v} (${k})`]), showIf: st => st.mode === 'shift', onChange: st => { st.change = 0; } },
      { type: 'slider', id: 'change', label: st => `Change in ${components[st.component].toLowerCase()}`, min: -30, max: 30, ends: ['Decrease', 'Increase'], showIf: st => st.mode === 'shift' },
      { type: 'check', id: 'showAS', label: 'Show AS', showIf: st => st.mode === 'shift' },
      { type: 'slider', id: 'steep', label: 'SRAS (price level of the horizontal section)', min: 10, max: 40, value: 20, ends: ['Down', 'Up'], showIf: st => st.mode === 'shift' && st.showAS },
      { type: 'slider', id: 'full', label: 'LRAS (full-employment output)', min: 45, max: 105, value: 85, ends: ['Left', 'Right'], showIf: st => st.mode === 'shift' && st.showAS },
    ],
    draw(P, st, C) {
      P.axes('GPL', 'RNY');
      if (st.mode === 'movement') {
        adCurve(P, C, 110, 'AD', C.demand, { tip: 'macro.adUnchanged' });
        const a = { q: 60, p: 50 }, b = { q: 110 - st.price, p: st.price };
        if (st.price !== 50) P.line([a.q + 1.5, a.p + 1.5], [b.q + 1.5, b.p + 1.5], { color: C.red, width: 1.8, arrow: true });
        points(P, C, a, b, { names: ['A', 'B'], tip: 'macro.pointOnAd' });
        return {
          result: table([['AD Curve', 'Unchanged'], ['GPL', EW.chg(st.price - 50, 'P_0', 'P_1')], ['RNY', EW.chg(50 - st.price, 'Y_0', 'Y_1')]]),
          notes: '<p>A change in the general price level causes a <strong>movement along the same AD curve</strong>. A lower price level increases real output demanded; a higher price level reduces it, <em>ceteris paribus</em>. C, I, G, X and M are held unchanged as autonomous determinants.</p><p>Points A and B are positions on AD. AS is hidden in this mode. Moving the selected point does not create a new AD–AS equilibrium.</p>',
          desc: `AD unchanged. GPL ${word(st.price - 50)}, RNY ${word(50 - st.price)}.`,
        };
      }
      const shift = st.component === 'M' ? -st.change : st.change, changed = shift !== 0;
      if (st.showAS) asCurve(P, C, st.full, st.steep, 'AS', C.supply, 'macro.keynesianAs');
      if (changed) adCurve(P, C, 110, 'AD_0', C.demand0, { early: Math.abs(shift) < 12, side: shift > 0 ? 'sw' : 'ne' });
      adCurve(P, C, 110 + shift, changed ? 'AD_1' : 'AD_0', C.demand, { side: shift < 0 ? 'sw' : 'ne' });
      if (changed) arrow(P, C, { q: 60, p: 50 }, { q: 60 + shift, p: 50 });
      const e0 = equilibrium(110, st.full, st.steep), e1 = equilibrium(110 + shift, st.full, st.steep);
      if (st.showAS) points(P, C, e0, e1);
      const name = components[st.component];
      const rows = [[`${name} (${st.component})`, EW.CHG(st.change)], ...(['X', 'M'].includes(st.component) ? [['Net Exports (X − M)', EW.CHG(shift)]] : []), ['AD', AD(shift)],
        ...(st.showAS ? gplRny(e0, e1) : [['GPL and RNY', 'Show AS to determine them']])];
      const reason = st.component === 'M' ? 'Imports are subtracted in AD = C + I + G + (X − M). Holding C, I, G and X constant, higher imports reduce net exports and demand for domestic output; lower imports increase them.'
        : st.component === 'X' ? 'Holding imports constant, higher exports increase net exports (X − M), while lower exports reduce net exports.'
        : `An autonomous change in ${name.toLowerCase()} changes planned expenditure on domestic output at every general price level, holding other determinants constant.`;
      return {
        result: table(rows),
        notes: `<p class="model-note">AD = C + I + G + (X − M)</p><p>${reason}</p><p>${shift === 0 ? 'The selected component is unchanged, so AD stays at AD₀.' : `This is a <strong>shift of AD</strong>: ${shift > 0 ? 'more' : 'less'} real output is demanded at every general price level. AD₀ is the initial curve and AD₁ is the new curve.`}</p><p>${st.showAS ? `The new equilibrium lies on the <strong>${e1.section} section of AS</strong>. On the horizontal section, output can change without a price-level change; on the vertical section, real output is fixed at full employment. In between, both can change.` : 'AS is hidden, so no equilibrium price-level or real-income outcome is inferred from the AD shift alone.'}</p><p class="model-note">Changes are qualitative and illustrative. No multiplier rounds are included. AS controls reshape a reference supply curve; both AD₀ and AD₁ are compared against the same AS.</p>`,
        desc: rows.map(r => `${r[0]} ${r[1]}`).join('. '),
      };
    },
  });

  /* ---------- Topic 7: Aggregate supply factors ---------- */
  const factors = { labour: 'Cost of labour', raw: 'Price of raw materials', exchange: 'Exchange rate', resources: 'Quantity of resources', productivity: 'Productivity' };
  function asParameters(factor, amount) {
    let full = 85, level = 20;
    if (['labour', 'raw'].includes(factor)) level += amount * 0.4;
    if (factor === 'exchange') level -= amount * 0.4;
    if (['resources', 'productivity'].includes(factor)) full += amount * 0.7;
    if (factor === 'productivity') level -= amount * 0.3;
    return { full, level };
  }
  function asPosition(u) { u = Math.max(0, Math.min(1, u)); if (u <= 1 / 3) return { q: 51 * u * 3, p: 20 }; if (u <= 2 / 3) return asPoint((u - 1 / 3) * 3, 85, 20); return { q: 85, p: 70 + (u - 2 / 3) * 150 }; }
  EW.register({
    id: 'as-factors', title: 'Factors Affecting Aggregate Supply', plot,
    glossary: ['aggregateDemand', 'aggregateSupply', 'shortRunAggregateSupply', 'longRunAggregateSupply', 'movementAlongAs', 'costOfLabour', 'priceOfRawMaterials', 'exchangeRate', 'productivity', 'quantityOfResources'],
    glossaryNotes: { aggregateDemand: 'AD is fixed to isolate AS changes.', exchangeRate: 'Only the imported-input channel is shown; AD is held fixed.' },
    controls: [
      { type: 'radio', id: 'mode', label: 'Mode', options: [['movement', 'Movement along AS'], ['shift', 'Shift in AS']], onChange: st => { st.amount = 0; st.movement = 0; } },
      { type: 'radio', id: 'start', label: 'Initial point (A)', options: initialOptions, showIf: st => st.mode === 'movement', onChange: st => { st.movement = 0; } },
      { type: 'slider', id: 'movement', label: 'Movement along AS', min: -100, max: 100, ends: ['Backward', 'Forward'], showIf: st => st.mode === 'movement' },
      { type: 'radio', id: 'factor', label: 'Factor', options: Object.entries(factors), showIf: st => st.mode === 'shift', onChange: st => { st.amount = 0; } },
      { type: 'slider', id: 'amount', label: st => ({ labour: 'Cost of labour', raw: 'Price of raw materials', exchange: 'Exchange rate', resources: 'Quantity of resources', productivity: 'Productivity' })[st.factor], min: -30, max: 30,
        ends: st => st.factor === 'exchange' ? ['Depreciation', 'Appreciation'] : ['Decrease', 'Increase'], showIf: st => st.mode === 'shift' },
      { type: 'check', id: 'showAD', label: 'Show AD', showIf: st => st.mode === 'shift' },
    ],
    draw(P, st, C) {
      P.axes('GPL', 'RNY');
      if (st.mode === 'movement') {
        asCurve(P, C, 85, 20, 'AS', C.supply);
        const start = { horizontal: 0.22, intermediate: 0.5, vertical: 0.8 }[st.start];
        const end = st.movement >= 0 ? start + (1 - start) * st.movement / 100 : start + start * st.movement / 100, a = asPosition(start), b = asPosition(end);
        if (st.movement) arrow(P, C, a, b);
        points(P, C, a, b, { names: ['A', 'B'], tip: 'macro.pointOnAs' });
        return {
          result: table([['AS Curve', 'Unchanged'], ...gplRny(a, b)]),
          notes: '<p>A stays fixed at the selected starting position. B moves along the same AS curve. The straight arrow connects A to B; the points may lie on different sections of the unchanged AS curve.</p><p>On horizontal SRAS, output varies at an unchanged price level. On the intermediate section, price and output vary together. On vertical LRAS, price varies at unchanged full-employment output.</p><p class="model-note">The slider selects a position along AS; price alone cannot uniquely locate a point on its horizontal section, and output alone cannot locate one on its vertical section. A and B are supply combinations, not necessarily equilibria.</p>',
          desc: `AS unchanged. GPL ${word(b.p - a.p)}, RNY ${word(b.q - a.q)}.`,
        };
      }
      const p = asParameters(st.factor, st.amount), base = { full: 85, level: 20 };
      if (st.showAD) adCurve(P, C, 110, 'AD', C.demand, { tip: 'macro.adFixed' });
      if (st.amount) asCurve(P, C, 85, 20, 'AS_0', C.supply0, null, p.full < 85 ? 'e' : asLabelPos(p.full, p.level, base) || 'left');
      asCurve(P, C, p.full, p.level, st.amount ? 'AS_1' : 'AS_0', C.supply, null, asLabelPos(p.full, p.level, base) || 'e');
      if (st.amount) {
        const a = st.factor === 'resources' ? { q: 85, p: 90 } : st.factor === 'productivity' ? asPoint(0.35, 85, 20) : { q: 30, p: 20 };
        let b = st.factor === 'resources' ? { q: p.full, p: 90 } : st.factor === 'productivity' ? asPoint(0.35, p.full, p.level) : { q: 30, p: p.level };
        if (st.factor === 'productivity') {   // a 45° arrow from AS₀ to AS₁
          const total = a.q + a.p; let lo = 0, hi = 1;
          for (let i = 0; i < 60; i++) { const t = (lo + hi) / 2, c = asPoint(t, p.full, p.level); if (c.q + c.p < total) lo = t; else hi = t; }
          b = asPoint((lo + hi) / 2, p.full, p.level);
        }
        arrow(P, C, a, b);
      }
      const rows = [[EW.tc(factors[st.factor]), st.factor === 'exchange' ? (st.amount ? (st.amount > 0 ? 'Appreciation' : 'Depreciation') : 'Unchanged') : EW.CHG(st.amount)]];
      if (st.factor === 'productivity') rows.push(['Cost of Production (COP)', EW.CHG(p.level - 20)], ['Productive Capacity', EW.CHG(p.full - 85)], ['SRAS and LRAS', AS(p.full - 85)]);
      else if (st.factor !== 'resources') rows.push(['Cost of Production (COP)', EW.CHG(p.level - 20)], ['SRAS', AS(BASE.level - p.level)]);
      if (st.factor === 'resources') rows.push(['Productive Capacity', EW.CHG(p.full - 85)], ['LRAS', AS(p.full - 85)]);
      if (st.showAD) { const a = equilibrium(110, 85, 20), b = equilibrium(110, p.full, p.level); points(P, C, a, b); rows.push(...gplRny(a, b)); }
      const reason = { labour: 'Labour costs change unit production costs, holding productivity constant.', raw: 'Raw-material prices change production costs.',
        exchange: 'An increase means domestic-currency appreciation: imported inputs become cheaper, lowering production costs. A decrease means depreciation and reverses the effect. Only the imported-input channel is shown; AD is fixed.',
        resources: 'The quantity of resources changes productive capacity. This case holds the horizontal SRAS price level fixed.',
        productivity: 'Higher productivity lowers unit production costs and raises productive capacity: SRAS moves down and LRAS moves right. Lower productivity reverses both changes.' }[st.factor];
      return {
        result: table(rows),
        notes: `<p>${reason}</p><p>The intermediate section adjusts smoothly between the horizontal and vertical sections. AS₀ remains fixed. AS₁ represents the changed costs and/or capacity.</p><p>${st.showAD ? 'AD is fixed. E₀ and E₁ show the initial and new macroeconomic equilibria.' : 'AD is hidden, so equilibrium price and income outcomes are not inferred from AS alone.'}</p><p class="model-note">Geometry is illustrative; no numerical calibration or multiplier rounds are included.</p>`,
        desc: rows.map(r => `${r[0]} ${r[1]}`).join('. '),
      };
    },
  });

  /* ---------- AD–AS equilibrium, fiscal and monetary policy share this drawing ---------- */
  const BASE = { full: 85, level: 20 };   // same baseline as the Topic 7 factor widgets
  function drawAdAs(P, st, C, r, { multiplierStages = 2 } = {}) {
    const adChanged = Math.abs(r.shift) > 1e-7, asChanged = r.full !== BASE.full || r.level !== BASE.level;
    P.axes('GPL', 'RNY');
    if (adChanged && st.showMultiplier && st.multiplier > 0) {
      const extra = r.shift - r.autonomous;
      // Stage lines closer than ~16 px to the next AD line are left unlabelled (their tooltip still names them).
      const side = r.shift > 0 ? 'ne' : 'sw', sx = (P.r - P.l) / (P.x[1] - P.x[0]), sy = (P.b - P.t) / (P.y[1] - P.y[0]), px = d => Math.abs(d) * sx * sy / Math.hypot(sx, sy);
      const stages = [r.initial + r.autonomous];
      for (let i = 1; i < multiplierStages; i++) stages.push(r.initial + r.autonomous + extra * (multiplierStages === 2 ? 0.6 : 1 - Math.pow(0.5, i)));
      stages.forEach((c, i) => {
        const neighbours = [r.initial, r.final, ...stages.filter((_, j) => j !== i)];
        adCurve(P, C, c, ['AD_a', 'AD_b', 'AD_c'][i], C.policy, { width: 1.5, tip: i ? 'macro.adStageLater' : 'macro.adStageA', at: [0.3, 0.5, 0.7][i], side,
          unlabelled: neighbours.some(n => px(n - c) < 16) });
      });
    }
    if (adChanged) adCurve(P, C, r.initial, 'AD_0', C.demand0, { early: true, side: r.shift > 0 ? 'sw' : 'ne' });
    adCurve(P, C, r.final, adChanged ? 'AD_1' : 'AD_0', C.demand, { side: r.shift < 0 ? 'sw' : 'ne', tip: st.showMultiplier && st.multiplier === 0 && adChanged ? 'macro.noFurtherRounds' : undefined });
    if (asChanged) asCurve(P, C, BASE.full, BASE.level, 'AS_0', C.supply0, null, r.full < BASE.full ? 'e' : asLabelPos(r.full, r.level, BASE) || 'left');
    asCurve(P, C, r.full, r.level, asChanged ? 'AS_1' : 'AS_0', C.supply, null, asChanged ? asLabelPos(r.full, r.level, BASE) || 'e' : 'e');
    if (adChanged && st.showShifts) adArrow(P, C, r.initial, r.final);
    if (asChanged && st.showShifts) asArrow(P, C, r.full, r.level, BASE);
    points(P, C, r.a, r.b);
    return { adChanged, asChanged };
  }
  const asWords = r => { const w = []; if (r.level !== BASE.level) w.push(`SRAS ${r.level < BASE.level ? 'increases (downwards shift)' : 'decreases (upwards shift)'}`); if (r.full !== BASE.full) w.push(`LRAS ${r.full > BASE.full ? 'increases (rightwards shift)' : 'decreases (leftwards shift)'}`); return w; };
  const multiplierSlider = { type: 'slider', id: 'multiplier', label: 'Size of multiplier', min: 0, max: 100, value: 50, ends: ['No further rounds', 'Large'] };
  const viewChecks = [{ type: 'check', id: 'showMultiplier', label: 'Show multiplier effect' }, { type: 'check', id: 'showShifts', label: 'Show shifts in AD/AS' }];

  EW.register({
    id: 'ad-as', title: 'AD–AS Equilibrium', plot,
    glossary: [...coreGlossary, 'multiplierEffect', 'initialSpendingChange', 'shortRunAggregateSupply', 'longRunAggregateSupply', 'initialStateOfTheEconomy', 'simultaneousChanges'],
    glossaryNotes: { shortRunAggregateSupply: 'This control holds productive capacity fixed.', longRunAggregateSupply: 'This control holds the horizontal section’s price level fixed.', multiplierEffect: 'The No further rounds–Large control is illustrative. No further rounds retains the initial spending change; larger settings add induced consumption.' },
    controls: [
      { type: 'radio', id: 'initial', label: 'Initial equilibrium', options: initialOptions },
      { type: 'slider', id: 'adShift', label: 'Initial AD change', min: -100, max: 100, ends: ['Decrease', 'Increase'], hint: 'Initial autonomous spending change before the multiplier effect.' },
      multiplierSlider,
      { type: 'slider', id: 'cop', label: 'Cost of production (COP)', min: -100, max: 100, ends: ['Decrease', 'Increase'] },
      { type: 'slider', id: 'capacity', label: 'Productive capacity', min: -100, max: 100, ends: ['Decrease', 'Increase'] },
      ...viewChecks,
    ],
    draw(P, st, C) {
      const initial = initials[st.initial], autonomous = 12 * st.adShift / 100;
      const full = BASE.full + 20 * st.capacity / 100, level = BASE.level + 10.8 * st.cop / 100;
      const shift = Math.max(level + 2 - initial, autonomous * (1 + st.multiplier / 100));
      const r = { initial, final: initial + shift, autonomous, shift, full, level, a: equilibrium(initial, BASE.full, BASE.level), b: equilibrium(initial + shift, full, level) };
      const { adChanged, asChanged } = drawAdAs(P, st, C, r);
      const ad = adChanged ? `AD ${r.shift > 0 ? 'increases (rightwards shift).' : 'decreases (leftwards shift).'}` : st.adShift !== 0 ? 'AD is unchanged because the initial spending change is zero.' : 'AD is unchanged.';
      const aw = asWords(r);
      return {
        result: table([['AD', AD(adChanged ? r.shift : 0)], ...(asChanged ? [...(r.level !== BASE.level ? [['SRAS', AS(BASE.level - r.level)]] : []), ...(r.full !== BASE.full ? [['LRAS', AS(r.full - BASE.full)]] : [])] : [['AS', 'Unchanged']]), ...gplRny(r.a, r.b)]),
        notes: `<p><strong>${ad} ${aw.length ? aw.join('; ') + '.' : 'AS is unchanged.'}</strong></p><p>E₀ starts on the ${r.a.section} section; E₁ lies on the ${r.b.section} section. The price level ${near(r.b.p, r.a.p) ? 'is unchanged' : r.b.p > r.a.p ? 'increases' : 'decreases'}; real national income ${near(r.b.q, r.a.q) ? 'is unchanged' : r.b.q > r.a.q ? 'increases' : 'decreases'}.</p><p>For the same initial spending change, a larger multiplier gives a larger total AD shift. The AS section determines how the equilibrium adjustment is divided between price and real national income. The controls are qualitative; the diagram is not a numerical forecast.</p>${st.showMultiplier ? '<p>The initial spending change generates income. Further rounds of induced consumption enlarge the total AD shift. AD<sub>a</sub> shows the initial change only; later violet curves show cumulative spending stages.</p>' : ''}`,
        desc: `${ad} GPL ${word(r.b.p - r.a.p)}, RNY ${word(r.b.q - r.a.q)}.`,
      };
    },
  });

  /* ---------- Topic 9: Fiscal policy ---------- */
  EW.register({
    id: 'fiscal-policy', title: 'Fiscal Policy', plot,
    glossary: [...coreGlossary, 'fiscalPolicy', 'expansionaryFiscalPolicy', 'contractionaryFiscalPolicy', 'taxes', 'multiplierEffect', 'initialSpendingChange', 'shortRunAggregateSupply', 'longRunAggregateSupply', 'initialStateOfTheEconomy'],
    glossaryNotes: { taxes: 'This scenario assumes personal and corporate taxes move together. Tax cuts raise disposable income and consumption (C), and raise after-tax profitability and investment (I); tax increases reverse these channels. The combined initial C/I response is smaller than an equally sized G change; only part of extra disposable income is spent and investment responsiveness is assumed. This is not a calibrated comparison of actual policies.', shortRunAggregateSupply: 'This control holds productive capacity fixed.', longRunAggregateSupply: 'This control holds the horizontal section’s price level fixed.', multiplierEffect: 'No further rounds retains the initial spending effect. Small and Large add further rounds of induced consumption; these settings are illustrative, not numerical estimates.' },
    about: '<p><strong>Policy limitations.</strong> Outcomes depend on spare capacity, leakages, confidence, timing and implementation. Crowding out, financing constraints and automatic price-adjustment dynamics are not modelled. Long-run capacity effects are possible scenarios, not automatic consequences.</p>',
    controls: [
      { type: 'radio', id: 'initial', label: 'Initial equilibrium', options: initialOptions },
      { type: 'radio', id: 'instrument', label: 'Instrument', options: [['G', 'Government expenditure (G)'], ['T', 'Taxes (T)']] },
      { type: 'slider', id: 'change', label: st => `Change in ${st.instrument}`, min: -100, max: 100, step: 5, ends: ['Decrease', 'Increase'] },
      multiplierSlider,
      { type: 'check', id: 'longRun', label: 'Possible long-run supply-side effects' },
      { type: 'slider', id: 'capacity', label: 'Possible long-run change to productive capacity', min: 0, max: 100, showIf: st => st.longRun,
        ends: st => { const stance = Math.sign(st.change) * (st.instrument === 'T' ? -1 : 1); return stance > 0 ? ['0', 'Increase'] : stance < 0 ? ['0', 'Decrease'] : ['0', 'none (neutral policy)']; } },
      ...viewChecks,
    ],
    draw(P, st, C) {
      const initial = initials[st.initial], stance = Math.sign(st.change) * (st.instrument === 'T' ? -1 : 1);
      const initialC = st.instrument === 'T' ? -12 * st.change / 100 * 0.45 : 0, initialI = st.instrument === 'T' ? -12 * st.change / 100 * 0.15 : 0;
      const autonomous = st.instrument === 'T' ? initialC + initialI : 12 * st.change / 100, shift = autonomous * (1 + st.multiplier / 100);
      const lras = st.longRun ? stance * st.capacity : 0;
      const r = { initial, final: initial + shift, autonomous, shift, full: BASE.full + 20 * lras / 100, level: BASE.level };
      r.a = equilibrium(initial, BASE.full, BASE.level); r.b = equilibrium(r.final, r.full, r.level);
      const { adChanged } = drawAdAs(P, st, C, r);
      const policy = stance === 0 ? 'Neutral fiscal policy' : stance > 0 ? 'Expansionary fiscal policy' : 'Contractionary fiscal policy';
      const immediate = equilibrium(r.final, BASE.full, BASE.level);
      const rows = [[st.instrument === 'G' ? 'Government Expenditure (G)' : 'Taxes (T)', EW.CHG(st.change)], ['Stance', EW.tc(policy)], ...(st.instrument === 'T' ? [['C and I', EW.CHG(initialC)]] : []),
        ['AD', AD(adChanged ? r.shift : 0)], ...(st.longRun ? [['LRAS', AS(r.full - BASE.full)]] : []), ...gplRny(r.a, r.b)];
      const longRun = st.longRun ? `<h2>Possible long-run supply-side effects</h2><p>For this widget, expansionary policy permits zero or positive capacity effects; contractionary policy permits zero or negative effects. This is a teaching assumption, not a universal rule. This is an assumed possible effect, not an automatic consequence of ${policy.toLowerCase()}. Productive infrastructure investment may increase capacity; weaker investment or inadequate maintenance can reduce capacity over time. A fall in investment alone need not imply an absolute decline in capacity. The slider compares capacity with the initial baseline, with other supply influences held constant. ${lras === 0 ? 'No capacity change is selected.' : lras > 0 ? 'Selected scenario: productive capacity increases and LRAS shifts right.' : 'Selected scenario: productive capacity decreases and LRAS shifts left.'} The immediate AD-only outcome would be P ${word(immediate.p - r.a.p)} and RNY ${word(immediate.q - r.a.q)}.</p>` : '';
      return {
        result: table(rows),
        notes: `<p><strong>${policy}: ${st.instrument} ${word(st.change)} → AD ${word(r.shift)}.</strong></p><p>${st.instrument === 'G' ? 'Government expenditure changes planned expenditure directly. ' : 'This tax scenario assumes personal and corporate taxes move together. Tax cuts raise disposable income and C, and after-tax profitability and I; tax increases reverse both effects. These are assumed responses, not automatic outcomes for every tax change. '}${st.multiplier === 0 ? 'No further rounds are selected; the initial effect is retained.' : 'Income changes generate further rounds of induced consumption. Saving, taxes and imports limit successive rounds.'}</p><p>E₀ is the initial equilibrium. E₁ shows ${st.longRun ? 'the selected possible longer-run outcome, combining the spending effect with the assumed capacity change.' : 'the immediate demand-side outcome, with AS held fixed.'} P ${word(r.b.p - r.a.p)}; RNY ${word(r.b.q - r.a.q)}.</p><p class="model-note">The initial spending stage AD<sub>a</sub> stays fixed when only multiplier size changes. AD<sub>b</sub>, when shown, represents an illustrative cumulative spending stage. The AS section determines how the final change divides between prices and real income.</p>${longRun}`,
        desc: rows.map(r => `${r[0]} ${r[1]}`).join('. '),
      };
    },
  });

  /* ---------- Topic 9: Monetary policy ---------- */
  EW.register({
    id: 'monetary-policy', title: 'Monetary Policy (Interest and Exchange Rates)', plot,
    glossary: [...coreGlossary, 'monetaryPolicy', 'interestRates', 'exchangeRate', 'marshallLernerCondition', 'importedInputCosts', 'multiplierEffect', 'initialSpendingChange', 'shortRunAggregateSupply', 'longRunAggregateSupply', 'initialStateOfTheEconomy'],
    glossaryNotes: { shortRunAggregateSupply: 'This control holds productive capacity fixed.', longRunAggregateSupply: 'This control holds the horizontal section’s price level fixed.', multiplierEffect: 'No further rounds retains the initial spending effect. Small and Large add further rounds of induced consumption; these settings are illustrative, not numerical estimates.' },
    about: '<p><strong>Policy limitations.</strong> The diagram is qualitative, with other influences held constant. It omits numerical policy calibration, adjustment lags, the J-curve, capital flows, feedback between interest and exchange rates, and automatic return to full employment. A fall in investment may slow capacity growth without reducing its absolute level.</p>',
    controls: [
      { type: 'radio', id: 'initial', label: 'Initial equilibrium', options: initialOptions },
      { type: 'radio', id: 'instrument', label: 'Instrument', options: [['IR', 'Interest rates'], ['ER', 'Exchange rates']] },
      { type: 'slider', id: 'change', label: st => st.instrument === 'ER' ? 'Exchange rate' : 'Interest rate', min: -100, max: 100, step: 5, ends: st => st.instrument === 'ER' ? ['Depreciation', 'Appreciation'] : ['Decrease', 'Increase'] },
      multiplierSlider,
      { type: 'check', id: 'mlHolds', label: 'Marshall–Lerner condition holds', value: true, showIf: st => st.instrument === 'ER' },
      { type: 'check', id: 'importCosts', label: 'Show imported input cost effects', showIf: st => st.instrument === 'ER' },
      { type: 'check', id: 'longRun', label: 'Possible long-run supply-side effects' },
      { type: 'slider', id: 'capacity', label: 'Possible long-run change to productive capacity', min: -100, max: 100, ends: ['Decrease', 'Increase'], showIf: st => st.longRun },
      ...viewChecks,
    ],
    draw(P, st, C) {
      const initial = initials[st.initial], er = st.instrument === 'ER';
      const autonomous = er ? -10 * st.change / 100 * (st.mlHolds ? 1 : -1) : -12 * st.change / 100, shift = autonomous * (1 + st.multiplier / 100);
      const lras = st.longRun && st.change !== 0 ? st.capacity : 0;
      const r = { initial, final: initial + shift, autonomous, shift, full: BASE.full + 20 * lras / 100, level: BASE.level - (er && st.importCosts ? 6 * st.change / 100 : 0) };
      r.a = equilibrium(initial, BASE.full, BASE.level); r.b = equilibrium(r.final, r.full, r.level);
      drawAdAs(P, st, C, r);
      const rows = [er ? ['Exchange Rate', st.change === 0 ? 'Unchanged' : st.change < 0 ? 'Depreciation' : 'Appreciation'] : ['Interest Rate', EW.CHG(st.change)], [er ? 'Net Exports (X − M)' : 'C and I', EW.CHG(r.autonomous)], ['AD', AD(r.shift)]];
      if (er && st.importCosts) rows.push(['Cost of Production (COP)', EW.CHG(r.level - BASE.level)], ['SRAS', AS(BASE.level - r.level)]);
      if (st.longRun) rows.push(['LRAS', AS(r.full - BASE.full)]);
      rows.push(...gplRny(r.a, r.b));
      const channel = er ? (st.mlHolds ? 'The Marshall–Lerner condition holds: depreciation raises (X − M) and AD; appreciation lowers them.' : 'The Marshall–Lerner condition does not hold: this case assumes the elasticity sum is below one. Depreciation lowers (X − M) and AD; appreciation raises them.')
        : 'A lower interest rate can raise C and I by reducing borrowing costs and the incentive to save. A higher rate can reduce C and I. The exchange-rate channel is excluded.';
      const adOnly = equilibrium(r.final, BASE.full, BASE.level);
      const longRun = st.longRun ? `<h2>Possible long-run supply-side effects</h2><p>${er ? 'Exchange-rate changes can affect export investment and the domestic-currency cost of imported capital equipment. These influences can work in opposite directions. ' : 'Interest-rate changes can affect investment in capital, technology and productivity. Confidence, credit conditions and other influences can alter the response. '}Choose a possible increase or decrease in capacity relative to the initial baseline; this is an assumption, not an automatic prediction. A fall in investment alone need not reduce the absolute level of productive capacity. ${st.change === 0 ? 'Select an interest-rate or exchange-rate change to explore a possible capacity effect. ' : lras === 0 ? 'No capacity change is selected. ' : lras > 0 ? 'Selected scenario: LRAS increases. ' : 'Selected scenario: LRAS decreases. '}The AD-only outcome would be GPL ${word(adOnly.p - r.a.p)} and RNY ${word(adOnly.q - r.a.q)}.</p>` : '';
      return {
        result: table(rows),
        notes: `<p>${channel}</p>${er ? `<p>${st.importCosts ? 'Imported input costs are included: appreciation lowers COP and increases SRAS; depreciation raises COP and decreases SRAS. This channel is separate from the Marshall–Lerner condition.' : 'Imported input cost effects are hidden; SRAS is held fixed.'} Initial trade balance is assumed. Equality, the J-curve and adjustment lags are excluded.</p>` : ''}<p>${st.multiplier === 0 ? 'No further rounds retains the initial spending response.' : 'The multiplier adds induced consumption to the initial spending response.'} AD<sub>a</sub> shows the initial spending stage; AD<sub>b</sub> is a later illustrative cumulative stage. They are spending stages, not separate equilibria.</p><p>E₀ is the initial equilibrium. E₁ combines the AD change with the selected supply effects. GPL ${word(r.b.p - r.a.p)}; RNY ${word(r.b.q - r.a.q)}. The AS section affects how adjustment divides between GPL and RNY. Geometry is illustrative.</p>${longRun}`,
        desc: rows.map(x => `${x[0]} ${x[1]}`).join('. '),
      };
    },
  });

  /* ---------- Topic 9: Supply-side policies ---------- */
  const sspPolicies = {
    education: { name: 'Education and training', label: 'Labour productivity gain', explanation: 'Education and skills training can help workers produce more per hour. Higher labour productivity lowers unit costs and raises productive capacity.' },
    research: { name: 'R&D grants', label: 'Productivity gain', explanation: 'R&D grants can support new technologies and production methods. Successful adoption can lower unit costs and raise productive capacity.' },
    'price-controls': { name: 'Factor price controls', label: 'Reduction in COP', explanation: 'If price controls lower factor prices and firms can still obtain the inputs they need, costs of production fall and SRAS increases. This scenario holds productive capacity fixed.' },
    entrepreneurship: { name: 'Entrepreneurship grants', label: 'Productivity gain', explanation: 'Grants can help entrepreneurs introduce better products and processes. Productivity gains can lower unit costs and raise productive capacity.' },
    goods: { name: 'Goods market competition', label: 'Productivity gain', explanation: 'Competition can encourage firms to improve efficiency and innovate. Productivity gains can lower unit costs and raise productive capacity.' },
    factors: { name: 'Factor market competition', label: 'Productivity gain', explanation: 'More competitive factor markets can help labour and capital move to more productive uses. This can lower unit costs and raise productive capacity.' },
  };
  const sspMenu = { education: 'Subsidising education and skills training', research: 'Providing R&D grants', 'price-controls': 'Price controls on factors of production', entrepreneurship: 'Encouraging entrepreneurship via grants', goods: 'Increasing competition in goods markets', factors: 'Increasing competition in factor markets' };
  EW.register({
    id: 'supply-side-policy', title: 'Supply-Side Policies', plot,
    glossary: [...coreGlossary, 'supplySidePolicy', 'interventionistPolicies', 'marketOrientedPolicies', 'productivity', 'costOfProduction', 'shortRunAggregateSupply', 'longRunAggregateSupply', 'initialStateOfTheEconomy'],
    controls: [
      { type: 'radio', id: 'initial', label: 'Initial equilibrium', options: initialOptions },
      { type: 'radio', id: 'policy', label: 'Policy', options: Object.entries(sspMenu) },
      { type: 'slider', id: 'impact', label: st => sspPolicies[st.policy].label, min: 0, max: 100, step: 5, ends: st => st.policy === 'price-controls' ? ['No reduction', 'Large reduction'] : ['No gain', 'Large gain'] },
      { type: 'check', id: 'showShifts', label: 'Show shifts in AS' },
    ],
    draw(P, st, C) {
      const intercept = initials[st.initial], strength = st.impact / 100, pol = sspPolicies[st.policy];
      const full = BASE.full + (st.policy === 'price-controls' ? 0 : 30 * strength), level = BASE.level - 10.8 * strength;
      const a = equilibrium(intercept, BASE.full, BASE.level), b = equilibrium(intercept, full, level), changed = st.impact > 0, capacityChanged = full > BASE.full;
      P.axes('GPL', 'RNY');
      adCurve(P, C, intercept, 'AD', C.demand, { tip: 'macro.adFixed' });
      if (changed) asCurve(P, C, BASE.full, BASE.level, 'AS_0', C.supply0, null, capacityChanged ? 'left' : 'horizontal');
      asCurve(P, C, full, level, changed ? 'AS_1' : 'AS_0', C.supply, null, changed && !capacityChanged ? 'horizontal' : 'e');
      if (changed && st.showShifts) capacityChanged ? arrow(P, C, { q: BASE.full, p: 95 }, { q: full, p: 95 }) : arrow(P, C, { q: 25, p: BASE.level }, { q: 25, p: level });
      points(P, C, a, b);
      const rows = [['Policy', EW.tc(pol.name)], [st.policy === 'price-controls' ? 'Cost of Production (COP)' : st.policy === 'education' ? 'Labour Productivity' : 'Productivity', changed ? (st.policy === 'price-controls' ? 'Decreases' : 'Increases') : 'Unchanged'],
        ...(changed ? [['SRAS', AS(BASE.level - level)], ['LRAS', AS(full - BASE.full)]] : [['AS', 'Unchanged']]), ...gplRny(a, b)];
      return {
        result: table(rows),
        notes: `<p>${pol.explanation} AD is fixed. ${changed ? 'E₁ shows the resulting equilibrium.' : 'E₀ and E₁ coincide at zero impact.'}</p>`,
        desc: rows.map(r => `${r[0]} ${r[1]}`).join('. '),
      };
    },
  });

  /* ---------- Topic 8: Macroeconomic issues and their causes (preset cases) ---------- */
  const categories = [
    { category: 'Actual growth', cases: [
      { title: 'AD increases', initial: 42, shift: { ad: 20 }, explanation: 'Higher consumption → AD increases → firms use idle resources to raise RNY at the same GPL.',
        equilibria: [{ label: 'Spare capacity', initial: 42 }, { label: 'Near capacity', initial: 140, explanation: 'Higher consumption → AD increases → RNY rises slightly and GPL rises as firms approach the capacity limit.' }] },
      { title: 'SRAS increases', initial: 112, shift: { costs: -9.6 }, explanation: 'Lower energy costs → SRAS increases → RNY rises and GPL falls. Productive capacity stays fixed.',
        equilibria: [{ label: 'Spare capacity', initial: 50 }, { label: 'Near capacity', initial: 112 }] }] },
    { category: 'Potential growth', cases: [
      { title: 'LRAS increases', initial: 56, shift: { capacity: 24 }, explanation: 'Better infrastructure → LRAS increases → productive capacity rises. AD still intersects the same horizontal section, so actual RNY and GPL stay unchanged.',
        equilibria: [{ label: 'Spare capacity', initial: 56 }, { label: 'At capacity', initial: 155, explanation: 'Better infrastructure → LRAS increases → productive capacity rises. The expansion eases the capacity constraint, so actual RNY also rises and GPL falls.' }, { label: 'Near capacity', initial: 112, explanation: 'Higher productive capacity shifts LRAS right. RNY rises and GPL falls as capacity constraints ease.' }] }] },
    { category: 'Sustained growth', cases: [
      { title: 'AD and LRAS increase', initial: 148, shift: { ad: 24, capacity: 24 }, explanation: 'Higher spending raises AD, while expanding productive capacity shifts LRAS to the right. Actual and potential output both rise. Sustained growth requires these gains to continue over time.',
        equilibria: [{ label: 'Spare capacity', initial: 48 }, { label: 'Near capacity', initial: 148 }, { label: 'At capacity', initial: 165 }] }] },
    { category: 'Negative growth', cases: [
      { title: 'AD decreases', initial: 68, shift: { ad: -27 }, explanation: 'Lower consumer confidence → consumption and AD fall → RNY falls. With spare capacity, GPL stays unchanged in this preset.',
        equilibria: [{ label: 'Spare capacity', initial: 68 }, { label: 'Near capacity', initial: 136, explanation: 'Lower consumer confidence → consumption and AD fall → both RNY and GPL fall. Productive capacity stays fixed.' }, { label: 'At capacity', initial: 165, explanation: 'Lower AD first reduces GPL while output stays at capacity. If AD falls far enough, RNY also falls.' }] },
      { title: 'SRAS decreases', initial: 112, shift: { costs: 10.2 }, explanation: 'Higher production costs → SRAS decreases → RNY falls and GPL rises. Productive capacity stays unchanged.',
        equilibria: [{ label: 'Spare capacity', initial: 55 }, { label: 'Near capacity', initial: 112 }] },
      { title: 'LRAS decreases', initial: 155, shift: { capacity: -14 }, explanation: 'A loss of productive resources → LRAS decreases → productive capacity falls. The economy starts at capacity, so actual RNY also falls and GPL rises.',
        equilibria: [{ label: 'Near capacity', initial: 130, explanation: 'A loss of productive resources shifts LRAS left. Productive capacity and actual RNY fall, while GPL rises.' }, { label: 'At capacity', initial: 155 }] }] },
    { category: 'Inflation', cases: [
      { title: 'Demand-pull (AD increases)', target: 'Demand-pull inflation', initial: 140, shift: { ad: 22 }, explanation: 'Higher spending → AD increases → GPL rises. With little spare capacity, RNY rises only slightly.',
        equilibria: [{ label: 'Near capacity', initial: 140 }, { label: 'At capacity', initial: 165, explanation: 'Higher spending → AD increases → GPL rises. RNY is already at productive capacity and stays unchanged.' }, { label: 'Spare capacity', initial: 68, explanation: 'Higher AD first raises RNY at the same GPL. If the shift reaches the upward-sloping portion of AS, GPL also rises.' }] },
      { title: 'Cost-push (SRAS decreases)', target: 'Cost-push inflation', initial: 112, shift: { costs: 10.2 }, explanation: 'Higher energy costs → SRAS decreases → GPL rises and RNY falls.', note: 'If inflation persists alongside weak output and high unemployment, the economy can experience stagflation.',
        equilibria: [{ label: 'Spare capacity', initial: 55 }, { label: 'Near capacity', initial: 112 }] }] },
    { category: 'Deflation', cases: [
      { title: 'AD decreases', initial: 127, shift: { ad: -31 }, explanation: 'Lower consumption and investment → AD decreases → both GPL and RNY fall.',
        equilibria: [{ label: 'Spare capacity', initial: 78, explanation: 'Lower AD reduces RNY. GPL stays unchanged because the economy remains on the flat portion of AS.' }, { label: 'Near capacity', initial: 127 }, { label: 'At capacity', initial: 165, explanation: 'Lower AD reduces GPL. RNY stays at capacity until AD falls enough to move the equilibrium below capacity.' }] },
      { title: 'SRAS increases', initial: 112, shift: { costs: -9.6 }, explanation: 'Lower production costs → SRAS increases → GPL falls and RNY rises.',
        equilibria: [{ label: 'Spare capacity', initial: 50 }, { label: 'Near capacity', initial: 112 }] },
      { title: 'LRAS increases', initial: 170, shift: { capacity: 24 }, explanation: 'Higher productive capacity → LRAS increases → GPL falls and RNY rises at the same AD.',
        equilibria: [{ label: 'Near capacity', initial: 130 }, { label: 'At capacity', initial: 170 }] }] },
    { category: 'Unemployment', cases: [
      { title: 'Demand-deficient (AD decreases)', target: 'Demand-deficient unemployment', initial: 68, shift: { ad: -24 }, outputGap: true, explanation: 'Lower investment → AD decreases → RNY falls further below productive capacity. Firms need fewer workers, so demand-deficient unemployment rises.',
        equilibria: [{ label: 'Spare capacity', initial: 68 }, { label: 'At capacity', initial: 165, explanation: 'A small fall in AD leaves RNY at capacity. A large enough fall takes RNY below capacity, opening a negative output gap and increasing demand-deficient unemployment.' }, { label: 'Near capacity', initial: 136 }] }] },
  ];
  const states = ['Spare capacity', 'Near capacity', 'At capacity'];
  const cat = st => categories.find(c => c.category === st.category) || categories[0];
  const caseOf = st => cat(st).cases[+st.case] || cat(st).cases[0];
  const entryOf = st => { const c = caseOf(st); return { ...c, ...(c.equilibria.find(e => e.label === st.start) || c.equilibria.find(e => e.initial === c.initial)) }; };
  const defaultStart = st => { const c = caseOf(st); return c.equilibria.find(e => e.initial === c.initial).label; };   // each cause opens at its own preset
  const shiftName = e => e.shift.ad && e.shift.capacity ? 'AD + LRAS' : e.shift.capacity ? 'LRAS' : e.shift.costs ? 'SRAS' : 'AD';
  const decreasing = e => e.shift.costs > 0 || e.shift.ad < 0 || e.shift.capacity < 0;

  EW.register({
    id: 'macro-issues', title: 'Macroeconomic Issues and Their Causes', plot,
    glossary: [...coreGlossary, 'generalPriceLevel', 'realNationalIncome', 'productiveCapacity', 'actualAndPotentialGrowth', 'inflationAndDeflation', 'demandDeficientUnemployment', 'negativeOutputGap'],
    controls: [
      { type: 'radio', id: 'category', label: 'Issue', options: categories.map(c => [c.category, c.category]), onChange: st => { st.case = '0'; st.start = defaultStart(st); st.amount = 0; } },
      { type: 'radio', id: 'case', label: 'Cause', options: st => cat(st).cases.map((c, i) => [String(i), c.title]), onChange: st => { st.start = defaultStart(st); st.amount = 0; } },
      { type: 'radio', id: 'start', label: 'Initial equilibrium', value: 'Spare capacity', options: st => { const c = caseOf(st); return states.filter(s => c.equilibria.some(e => e.label === s)).map(s => [s, s]); }, onChange: st => { st.amount = 0; } },
      { type: 'slider', id: 'amount', label: 'Size of shift', min: 0, max: 100, ends: ['0', 'Largest'], format: (v, st) => { const e = caseOf(st); return `${shiftName(e)} ${decreasing(e) ? 'decrease' : 'increase'}`; } },
      { type: 'check', id: 'showShifts', label: 'Show shifts in AD/AS' },
    ],
    draw(P, st, C) {
      const e = entryOf(st), scale = 0.014 * st.amount;
      const ad = (e.shift.ad ?? 0) * scale, costs = (e.shift.costs ?? 0) * scale, capacity = (e.shift.capacity ?? 0) * scale;
      const initial = e.initial, final = initial + ad, full = BASE.full + capacity, level = BASE.level + costs;
      const a = equilibrium(initial, BASE.full, BASE.level), b = equilibrium(final, full, level), asChanged = costs !== 0 || capacity !== 0;
      P.axes('GPL', 'RNY');
      if (ad) adCurve(P, C, initial, 'AD_0', C.demand0, { early: true, side: ad > 0 ? 'sw' : 'ne' });
      adCurve(P, C, final, ad ? 'AD_1' : 'AD_0', C.demand, { side: ad < 0 ? 'sw' : 'ne' });
      if (asChanged) asCurve(P, C, BASE.full, BASE.level, 'AS_0', C.supply0, null, full < BASE.full ? 'e' : asLabelPos(full, level, BASE) || 'left');
      asCurve(P, C, full, level, asChanged ? 'AS_1' : 'AS_0', C.supply, null, asChanged ? asLabelPos(full, level, BASE) || 'e' : 'e');
      if (st.showShifts) {
        if (ad) { const p = Math.max(Math.max(initial, final) - 108, Math.min(100, Math.min(initial, final) - 18)); arrow(P, C, { q: initial - p, p }, { q: final - p, p }); }
        if (asChanged) asArrow(P, C, full, level, BASE);
      }
      points(P, C, a, b, { shifted: st.amount > 0 });
      if (e.outputGap && full - b.q > 1e-6) P.qChange(b.q, full, { color: C.ink, both: true, label: 'Negative output gap', tip: 'macro.outputGap' });   // below the axis, as in the original
      const dp = b.p - a.p, dq = b.q - a.q, initialGap = Math.max(0, BASE.full - a.q), finalGap = Math.max(0, full - b.q), widens = finalGap - initialGap > 1e-6;
      const observed = { 'Actual growth': dq > 1e-6, 'Potential growth': capacity > 1e-6, 'Sustained growth': dq > 1e-6 && capacity > 1e-6, 'Negative growth': dq < -1e-6, Inflation: dp > 1e-6, Deflation: dp < -1e-6, Unemployment: widens }[cat(st).category];
      const target = e.target ?? cat(st).category;
      const driver = [];
      if (ad) driver.push(['AD', AD(ad)]);
      if (costs) driver.push(['SRAS', AS(-costs)]);
      if (capacity) driver.push(['LRAS', AS(capacity)]);
      const rows = st.amount === 0 ? [['Shift', 'None Yet (Initial Equilibrium)'], [EW.tc(target), 'Not Observed']]
        : [...driver, ...gplRny(a, b), ...(e.outputGap && widens ? [['Negative Output Gap', initialGap < 1e-6 ? 'Opens' : 'Widens']] : []), [EW.tc(target), observed ? 'Observed' : 'Not Observed']];
      return {
        result: table(rows),
        notes: `<p>${e.explanation}</p>${e.note ? `<p class="model-note">${e.note}</p>` : ''}`,
        desc: `${cat(st).category}, ${e.title}. ${rows.map(r => `${r[0]} ${r[1]}`).join('. ')}. ${target} ${observed ? 'observed' : 'not observed'}.`,
      };
    },
  });
})();
