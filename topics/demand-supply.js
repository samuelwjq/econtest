/* Topic 2: Demand and supply. The single-shift, simultaneous-shift and guided widgets share one model and one drawing.
   Demand: P = 100 + d − Q.  Supply: P = Q − s.  Initial equilibrium E₀ is (50, 50). */
(() => {
  const near = (a, b) => Math.abs(a - b) < 1e-8;
  const change = v => near(v, 0) ? 'unchanged' : v > 0 ? 'increases' : 'decreases';
  const dir = (v, n) => v ? `${v > 0 ? 'Increase' : 'Decrease'} in ${n}` : `No Change in ${n}`;
  const outcome = v => change(v).replace('unchanged', 'remains unchanged');
  const bold = t => t.replace(/\b(?:increase|decrease) in (?:demand|supply)\b|\b(?:shortage|surplus)\b|\b(?:upward|downward) pressure on price\b|\bequilibrium (?:price|quantity) (?:increases|decreases)\b/gi, m => `<strong>${m}</strong>`);
  const model = (d, s) => ({ d, s, q: 50 + (d + s) / 2, p: 50 + (d - s) / 2, qd: 50 + d, qs: 50 + s, changed: d !== 0 || s !== 0 });

  // End points of each curve, clipped to the plot (prices 0–105).
  const demandEnds = (d, full) => { const k = 100 + d, a = Math.max(0, k - 105), b = Math.min(full ? 100 : 105, k); return [[a, k - a], [b, k - b]]; };
  const supplyEnds = (s, full) => { const a = Math.max(0, s), b = Math.min(full ? 100 : 105, 105 + s); return [[a, a - s], [b, b - s]]; };

  /* Draws the market. `show` switches features on: gap, adjust, cs, ps, newEq (E₁, P₁, Q₁), gapDots, shift (arrow showing
     the curve shift), qArrow (direction of the quantity change). Each feature is drawn as a named part so guided steps
     can highlight it. */
  function draw(P, C, m, show) {
    const { d, s, q, p, qd, qs, changed } = m, sameP = near(p, 50), sameQ = near(q, 50);
    const perPx = (P.y[1] - P.y[0]) / (P.b - P.t);   // price units per SVG pixel

    P.part('areas');
    if (show.cs) {
      const [[a, top]] = demandEnds(d);   // clip at the top of the plot when demand has shifted far right
      P.area([[0, p], [q, p], [a, top], [0, top]], C.demand, { hatch: 'diagonal', tip: 'area.consumerSurplus' });
      if (q > 14) P.pointLabel([q / 3, (Math.min(100 + d, 105) + 2 * p) / 3], 'CS', { color: C.demand, gap: [0, 10, 20, 30] });
    }
    if (show.ps) {
      P.area(s > 0 ? [[0, 0], [0, p], [q, p], [s, 0]] : [[0, -s], [0, p], [q, p]], C.supply, { hatch: 'horizontal', tip: 'area.producerSurplus' });
      if (q > 14) P.pointLabel([q / 3, (Math.max(0, -s) + 2 * p) / 3], 'PS', { color: C.supply, gap: [0, 10, 20, 30] });
    }

    P.part('axes');
    P.axes('Price', 'Quantity');
    P.part('initial');
    P.guide(50, 50);
    P.part('new');
    if (changed && show.newEq) P.guide(q, p);

    // Curves: initial curves are drawn lighter once they have shifted. Labels go at the far end of each curve.
    const curve = (part, ends, color, label, tip) => {
      const isD = label[0] === 'D';
      P.part(part);
      P.line(ends[0], ends[1], { color });
      P.pointLabel(ends[1], label, { color: isD ? C.demand : C.supply, prefer: isD ? 'ne' : 'e', tip });
    };
    if (d !== 0) curve('old', demandEnds(0, true), C.demand0, 'D_0', 'curve.demandInitial');
    if (s !== 0) curve('old', supplyEnds(0, true), C.supply0, 'S_0', 'curve.supplyInitial');
    curve('demand', demandEnds(d, d === 0), C.demand, d ? 'D_1' : 'D_0', 'curve.demandCurrent');
    curve('supply', supplyEnds(s, s === 0), C.supply, s ? 'S_1' : 'S_0', 'curve.supplyCurrent');

    if (show.shift && changed) {   // guided step 2: arrow showing the direction of the shift
      P.part('shift');
      const amount = d || s, at = d ? 70 : 30;
      P.span([30, at], [30 + amount, at], `${amount > 0 ? 'Increase' : 'Decrease'} in ${d ? 'demand' : 'supply'}`, { both: false });
    }

    P.part('adjust');
    if (show.adjust && !sameP)
      for (const [curve, start] of [['demand', qd], ['supply', qs]])
        P.chevrons([start, 50], [q, p], C.red, ['adjust.alongCurve', { rises: p > 50, curve, increases: q > start }]);

    P.part('gap');
    if (show.gap && !sameP) {
      const g = { color: C.guide, width: 1.2, dash: '5 4' };
      P.line([0, 50], [Math.max(qd, qs), 50], g);
      P.line([qd, 50], [qd, 0], g);
      P.line([qs, 50], [qs, 0], g);
      P.span([Math.min(qd, qs), 14 * perPx], [Math.max(qd, qs), 14 * perPx], `${qd > qs ? 'Shortage' : 'Surplus'} at P_0`,
        { tip: ['gap.arrow', { shortage: qd > qs }], labelTip: 'gap.label' });
      if (show.gapDots) {
        P.dot([qd, 50], C.demand, ['gap.pointOnCurve', { curve: 'demand' }]);
        P.dot([qs, 50], C.supply, ['gap.pointOnCurve', { curve: 'supply' }]);
      }
    }

    // Equilibrium points: initial values in grey, new values in ink. The engine places the labels clear of the curves.
    P.part('initial');
    const e0 = changed && show.newEq ? C.grey : C.ink;
    P.dot([50, 50], e0, 'eq.initial');
    P.pointLabel([50, 50], changed || !show.newEq ? 'E_0' : 'E_0 = E_1', { color: e0, tip: 'eq.initial' });
    P.pLabel(50, 'P_0', { color: e0, tip: 'price.initial' });
    P.qLabel(50, 'Q_0', { color: e0, tip: 'qty.initial' });
    if (show.newEq) {
      P.part('new');
      if (changed) {
        P.dot([q, p], C.ink, 'eq.new');
        P.pointLabel([q, p], 'E_1', { tip: 'eq.new' });
      }
      P.pLabel(p, 'P_1', { tip: 'price.new' });
      P.qLabel(q, 'Q_1', { tip: 'qty.new' });
      // Axis change arrows always shown when there is a new equilibrium (not gated by the adjustment checkbox).
      P.pChange(50, p, { tip: ['change.price', { dir: change(p - 50) }] });
      P.qChange(50, q, { tip: ['change.quantity', { dir: change(q - 50) }] });
    }
    // Axis values are joined when equal ("Q_s = Q_0") and spread out by the engine when crowded.
    if (show.gap && changed) {
      P.part('gap');
      P.qLabel(qd, 'Q_d', { color: C.demand, tip: 'qty.demandedAtP0' });
      P.qLabel(qs, 'Q_s', { color: C.supply, tip: 'qty.suppliedAtP0' });
    }
  }

  // The written price adjustment process (kept from the original widgets).
  function explain({ d, s, q, p, qd, qs, changed }, simultaneous = false) {
    const shifts = [];
    if (d) shifts.push(`${d > 0 ? 'an increase' : 'a decrease'} in demand`);
    if (s) shifts.push(`${s > 0 ? 'an increase' : 'a decrease'} in supply`);
    const lead = shifts.join(' and ').replace(/^./, c => c.toUpperCase());
    const steps = ['Assuming the market is initially in equilibrium at E₀.'];
    if (!changed) steps.push('There is no shift in demand or supply. The market remains in equilibrium: E₀ = E₁, with no shortage or surplus at P₀.', 'Thus, equilibrium price and equilibrium quantity remain unchanged.');
    else if (near(p, 50)) steps.push(`${lead} ${shifts.length > 1 ? 'leave' : 'leaves'} quantity demanded equal to quantity supplied at price P₀. There is no shortage or surplus.`,
      'There is no upward or downward pressure on price, so no price adjustment or movement along the curves is needed.',
      'The current curves meet at the new equilibrium E₁, where quantity demanded equals quantity supplied.',
      `Thus, equilibrium price remains unchanged and equilibrium quantity ${outcome(q - 50)}.`);
    else {
      const short = qd > qs;
      steps.push(`${lead} will lead to a ${short ? 'shortage' : 'surplus'} at price P₀.`,
        `This leads to ${short ? 'upward' : 'downward'} pressure on price as ${short ? 'frustrated consumers bid up the price' : 'producers reduce prices to clear excess stock'}.`,
        `As price ${short ? 'increases' : 'decreases'}, quantity demanded ${short ? 'decreases' : 'increases'} and quantity supplied ${short ? 'increases' : 'decreases'}.`,
        'This adjustment occurs until quantity demanded and quantity supplied are equal at the new equilibrium E₁.',
        `Thus, equilibrium price ${outcome(p - 50)} and equilibrium quantity ${outcome(q - 50)}.`);
    }
    return {
      result: EW.summary([
        ['Case', simultaneous ? `${dir(d, 'Demand')} and ${dir(s, 'Supply')}` : !changed ? 'No Shift in Demand or Supply' : d ? dir(d, 'Demand') : dir(s, 'Supply')],
        ['Shift', [d && 'D_0 to D_1', s && 'S_0 to S_1'].filter(Boolean).join(' and ') || 'None'],
        near(qd, qs) ? ['Shortage / Surplus at P_0', 'None (Q_d = Q_s)']
          : [`${qd > qs ? 'Shortage' : 'Surplus'} at P_0`, `${qd > qs ? 'Q_s to Q_d' : 'Q_d to Q_s'} units, leading to ${qd > qs ? 'upward' : 'downward'} pressure on price`],
        ['Equilibrium Price', EW.chg(p - 50, 'P_0', 'P_1')],
        ['Equilibrium Quantity', EW.chg(q - 50, 'Q_0', 'Q_1')]]),
      notes: `<ol>${steps.map(t => `<li>${bold(t)}</li>`).join('')}</ol>`,
      desc: `Equilibrium price ${change(p - 50)}, quantity ${change(q - 50)}. ${steps.join(' ')}`,
    };
  }

  const plot = { x: [0, 110], y: [0, 110], box: [90, 40, 490, 440] };
  const glossary = ['changeInDemand', 'changeInSupply', 'changeInQuantityDemanded', 'changeInQuantitySupplied', 'demand', 'quantityDemanded',
    'supply', 'quantitySupplied', 'shortage', 'surplus', 'marketEquilibrium', 'consumerSurplus', 'producerSurplus'];
  const options = [
    { type: 'check', id: 'gap', label: 'Shortage or surplus at P<sub>0</sub>', value: true },
    { type: 'check', id: 'adjust', label: 'Price adjustment arrows' },
    { type: 'check', id: 'cs', label: 'Consumer surplus' },
    { type: 'check', id: 'ps', label: 'Producer surplus' },
  ];
  const independent = (P, st, C, d, s, simultaneous) => {
    const m = model(d, s);
    draw(P, C, m, { ...st, newEq: true, pArrow: true, qArrow: true });
    return explain(m, simultaneous);
  };

  EW.register({
    id: 'ds-single', title: 'Demand and Supply: Single Shift', glossary, plot,
    controls: [
      { type: 'radio', id: 'curve', label: 'Curve to shift', options: [['d', 'Demand'], ['s', 'Supply']], onChange: st => { st.mag = 0; } },
      { type: 'slider', id: 'mag', label: 'Size of shift', min: -25, max: 25, ends: ['Decrease', 'Increase'] },
      ...options,
    ],
    draw: (P, st, C) => independent(P, st, C, st.curve === 'd' ? st.mag : 0, st.curve === 's' ? st.mag : 0),
  });

  EW.register({
    id: 'ds-simultaneous', title: 'Demand and Supply: Simultaneous Shifts', glossary, plot,
    controls: [
      { type: 'slider', id: 'd', label: 'Change in demand', min: -45, max: 45, ends: ['Decrease', 'Increase'] },
      { type: 'slider', id: 's', label: 'Change in supply', min: -45, max: 45, ends: ['Decrease', 'Increase'] },
      ...options,
    ],
    draw: (P, st, C) => independent(P, st, C, st.d, st.s, true),
  });

  /* ---------- Guided: price adjustment process in six steps ---------- */
  const cases = { di: [20, 0, 'Increase in demand'], dd: [-20, 0, 'Decrease in demand'], si: [0, 20, 'Increase in supply'], sd: [0, -20, 'Decrease in supply'] };
  const guidedModel = st => st.step >= 2 && cases[st.case] ? model(cases[st.case][0], cases[st.case][1]) : model(0, 0);
  const para = t => t.split('\n\n').map(x => `<p>${bold(x)}</p>`).join('');

  EW.register({
    id: 'ds-guided', title: 'Price Adjustment Process', guided: true, plot,
    glossary: ['demand', 'quantityDemanded', 'supply', 'quantitySupplied', 'shortage', 'surplus', 'marketEquilibrium'],
    controls: [
      { type: 'radio', id: 'case', label: 'Choose a case', value: '', options: Object.entries(cases).map(([k, c]) => [k, c[2]]),
        showIf: st => st.step >= 2, onChange: st => { st.step = 2; } },
    ],
    canAdvance: st => st.step !== 2 || !!st.case,
    blockedMessage: 'Choose a case first.',
    steps: [
      { title: 'Initial equilibrium', text: () => para('Assuming the market is initially in equilibrium at E₀, quantity demanded equals quantity supplied at P₀ and Q₀.') },
      { title: 'Choose a case', text: st => {
        if (!st.case) return para('Select one of the four cases to shift demand or supply. The initial equilibrium is held fixed.');
        const { d } = guidedModel(st), up = (cases[st.case][0] || cases[st.case][1]) > 0, curve = d ? 'demand' : 'supply';
        return para(`${up ? 'An increase' : 'A decrease'} in ${curve} shifts the ${curve} curve ${up ? 'rightwards' : 'leftwards'}, from ${d ? 'D₀ to D₁' : 'S₀ to S₁'}. The market price is still P₀ immediately after the shift.`) +
          '<p class="think"><strong>Think:</strong> after this shift, at the original price P<sub>0</sub>, will there be a shortage or a surplus? Which way will price be pushed?</p>';
      } },
      { title: 'Shortage or surplus', text: st => { const short = guidedModel(st).qd > guidedModel(st).qs;
        return para(`At P₀, ${short ? 'quantity demanded exceeds quantity supplied, creating a shortage' : 'quantity supplied exceeds quantity demanded, creating a surplus'}. The dashed guides identify Qd and Qs; the horizontal arrow shows their gap.`); } },
      { title: 'Price adjustment', text: st => { const short = guidedModel(st).qd > guidedModel(st).qs;
        return para(`This leads to ${short ? 'upward pressure on price as frustrated consumers bid up the price' : 'downward pressure on price as producers reduce prices to clear excess stock'}.\n\nAs price ${short ? 'increases' : 'decreases'}, quantity demanded ${short ? 'decreases' : 'increases'} and quantity supplied ${short ? 'increases' : 'decreases'} along the current curves.`); } },
      { title: 'New equilibrium', text: () => para('This adjustment occurs until quantity demanded and quantity supplied are equal at the new equilibrium E₁, at price P₁ and quantity Q₁.') },
      { title: 'Compare market outcomes', text: st => { const { p, q } = guidedModel(st);
        return para(`Thus, equilibrium price ${p > 50 ? 'increases' : 'decreases'} and equilibrium quantity ${q > 50 ? 'increases' : 'decreases'}. Compare E₀ with E₁ in the diagram and the table below.`); } },
    ],
    draw: (P, st, C) => {
      const m = guidedModel(st), step = st.step;
      draw(P, C, m, { shift: step === 2, gap: step >= 3, gapDots: step === 3, adjust: step >= 4, pArrow: step >= 4, newEq: step >= 5, qArrow: step >= 6 });
      const shifted = m.d ? 'demand' : 'supply';
      const focus = [null, ['demand', 'supply', 'initial'], m.changed ? [shifted, 'shift'] : ['demand', 'supply'], ['gap'], ['adjust'], ['new']][step];
      const out = explain(m);
      return step === 6 ? out : { focus, desc: `Step ${step}. ${out.desc}` };
    },
  });
})();
