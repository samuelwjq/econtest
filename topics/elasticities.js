/* Topic 3: Elasticities. PED, PES, XED and YED share one model, drawing and explanation.
   Straight curves with the initial equilibrium E₀ at (50, 50); the chosen elasticity is measured at E₀.
   PED/PES: the other curve shifts by 25 units. XED/YED: demand shifts by e × (size of change)% of Q₀. */
(() => {
  const zero = v => Math.abs(v) < 1e-8;
  const dirWord = v => zero(v) ? 'unchanged' : v > 0 ? 'increases' : 'decreases';

  // Slider position t (0–2) to |PED| or PES: 0 → 0, 1 → 1, 2 → ∞.
  const toE = (kind, t) => kind === 'PED' || kind === 'PES' ? (t >= 2 ? Infinity : t / (2 - t)) : t;

  function classify(kind, e) {
    const curve = kind === 'PED' ? 'demand' : 'supply';
    if (kind === 'PED' || kind === 'PES') {
      if (e === Infinity) return `Perfectly price elastic ${curve}`;
      return zero(e) ? `Perfectly price inelastic ${curve}` : zero(e - 1) ? `Unit elastic ${curve}` : `${e < 1 ? 'Price inelastic' : 'Price elastic'} ${curve}`;
    }
    if (kind === 'XED') return zero(e) ? 'Unrelated goods' : `${zero(Math.abs(e) - 1) ? 'Unit XED:' : Math.abs(e) < 1 ? 'Weak' : 'Strong'} ${e < 0 ? 'complements' : 'substitutes'}`;
    return e < 0 ? 'Inferior good' : zero(e) ? 'No income response' : e < 1 ? 'Normal good (necessity)' : zero(e - 1) ? 'Normal good (unit income elastic)' : 'Normal good (luxury)';
  }

  function model(kind, st) {
    const price = kind === 'PED' || kind === 'PES', e = toE(kind, st.el);
    const shock = price ? +st.dir : +st.dir * st.size;
    const delta = price ? shock * 25 : 50 * e * shock / 100;
    let p, q, qd, qs;   // qd(P), qs(P): quantity demanded/supplied on the current curves
    if (price && e === Infinity) {
      p = 50; q = 50 + delta;
      qd = kind === 'PED' ? () => q : P0 => 50 - (P0 - 50) + delta;
      qs = kind === 'PES' ? () => q : P0 => 50 + (P0 - 50) + delta;
    } else if (kind === 'PED') { p = 50 - delta / (1 + e); q = 50 + e * delta / (1 + e); qd = P0 => 50 - e * (P0 - 50); qs = P0 => 50 + (P0 - 50) + delta; }
    else if (kind === 'PES') { p = 50 + delta / (1 + e); q = 50 + e * delta / (1 + e); qd = P0 => 50 - (P0 - 50) + delta; qs = P0 => 50 + e * (P0 - 50); }
    else { p = 50 + delta / 2; q = 50 + delta / 2; qd = P0 => 50 - (P0 - 50) + delta; qs = P0 => 50 + (P0 - 50); }
    return { kind, price, e, shock, delta, p, q, qd, qs, tr0: 2500, tr1: p * q, priceEffect: (p - 50) * 50, quantityEffect: (q - 50) * p };
  }

  // End points of a straight curve given as Q = fn(P), clipped to the plot (0–110 on both axes).
  function ends(fn, horizontal) {
    if (horizontal) return [[0, 50], [110, 50]];
    const k = (fn(51) - fn(49)) / 2, b = fn(50) - k * 50;
    let lo = 0, hi = 110;
    if (Math.abs(k) > 1e-12) { const a = -b / k, z = (110 - b) / k; lo = Math.max(lo, Math.min(a, z)); hi = Math.min(hi, Math.max(a, z)); }
    return [lo, hi].map(P => [Math.max(0, Math.min(110, fn(P))), P]);
  }

  const ped = kind => kind === 'PED';
  // Default reference elasticity: the reciprocal of the main one (slider position 2 − t). Unit elasticity has no different mirror, so use 0.5.
  const mirror = t => Math.abs(t - 1) < 0.03 ? 0.67 : Math.round((2 - t) * 100) / 100;
  function draw(P, st, C, kind) {
    const m = model(kind, st), { e, delta, p, q } = m, changed = !zero(delta), sameP = zero(p - 50);
    const curveKey = kind === 'PED' ? 'demand' : 'supply';

    // Total revenue/expenditure: ΔTR = Q₀(P₁ − P₀) + P₁(Q₁ − Q₀), shaded as two rectangles.
    if (m.price && st.tr && changed) {
      if (!zero(m.priceEffect)) P.area([[0, 50], [50, 50], [50, p], [0, p]], C.priceEffect, { hatch: 'diagonal', tip: ['tr.priceEffect', { gain: m.priceEffect > 0 }] });
      if (!zero(m.quantityEffect)) P.area([[50, 0], [q, 0], [q, p], [50, p]], C.quantityEffect, { hatch: 'vertical', tip: ['tr.quantityEffect', { gain: m.quantityEffect > 0 }] });
    }
    P.axes('Price', 'Quantity');
    P.guide(50, 50);
    if (changed) P.guide(q, p);

    const curve = (fn, label, color, horizontal) => {
      const [a, b] = ends(fn, horizontal), end = a[0] > b[0] + 0.01 || (Math.abs(a[0] - b[0]) <= 0.01 && a[1] > b[1]) ? a : b;
      P.line(a, b, { color });
      P.pointLabel(end, label, { color: label[0] === 'D' ? C.demand : C.supply, prefer: 'e',
        tip: horizontal ? ['curve.perfectlyElastic', { curve: curveKey }] : ['curve.named', { name: label.replace('_', '') }] });
    };
    const oldD = P0 => 50 - (kind === 'PED' ? e : 1) * (P0 - 50), oldS = P0 => 50 + (kind === 'PES' ? e : 1) * (P0 - 50);
    if (changed) kind === 'PED' ? curve(oldS, 'S_0', C.supply0) : curve(oldD, 'D_0', C.demand0);
    curve(m.qd, changed && kind !== 'PED' ? 'D_1' : 'D_0', C.demand, kind === 'PED' && e === Infinity);
    curve(m.qs, changed && kind === 'PED' ? 'S_1' : 'S_0', C.supply, kind === 'PES' && e === Infinity);

    // Reference curve (PED: demand D_2; PES: supply S_2): pivoted around E_0 with a different elasticity, facing the same shift.
    // Visual only: the Summary table describes the main curve.
    if (m.price && st.ref) {
      const m2 = model(kind, { ...st, el: st.refEl }), col = ped(kind) ? C.demand : C.supply, lab = ped(kind) ? 'D_2' : 'S_2';
      const fn = ped(kind) ? m2.qd : m2.qs, horizontal = m2.e === Infinity;
      const [a, b] = ends(fn, horizontal), end = a[0] > b[0] + 0.01 || (Math.abs(a[0] - b[0]) <= 0.01 && a[1] > b[1]) ? a : b;
      P.line(a, b, { color: col, width: 2, dash: '7 5' });
      P.pointLabel(end, lab, { color: col, prefer: 'e', tip: 'ref.curve' });
      if (changed && !(zero(m2.p - p) && zero(m2.q - q))) {
        P.guide(m2.q, m2.p);
        P.dot([m2.q, m2.p], col, 'ref.eq');
        P.pointLabel([m2.q, m2.p], 'E_2', { color: col, tip: 'ref.eq' });
        P.pLabel(m2.p, 'P_2', { color: col, tip: 'ref.eq' });
        P.qLabel(m2.q, 'Q_2', { color: col, tip: 'ref.eq' });
      }
      if (!changed) P.textAt((P.l + P.r) / 2 + 30, P.t - 18, `Choose a change in ${ped(kind) ? 'supply' : 'demand'} to compare the reference curve.`, { color: C.red, size: '78%' });
    }

    if (st.adjust && changed) {
      const qd = m.qd(50), qs = m.qs(50), perPx = 110 / (P.b - P.t);
      if (!sameP) {
        const g = { color: C.guide, width: 1.2, dash: '5 4' };
        P.line([qd, 50], [qd, 0], g);
        P.line([qs, 50], [qs, 0], g);
        P.span([Math.min(qd, qs), 14 * perPx], [Math.max(qd, qs), 14 * perPx], `${qd > qs ? 'Shortage' : 'Surplus'} at P_0`,
          { tip: ['gap.arrow', { shortage: qd > qs }], labelTip: 'gap.label' });
        for (const [c, start] of [['demand', qd], ['supply', qs]]) if (!zero(start - q))
          P.chevrons([start, 50], [q, p], C.red, ['adjust.alongCurve', { rises: p > 50, curve: c, increases: q > start }]);
      } else P.textAt((P.l + P.r) / 2 + 30, P.t - 18, 'No price adjustment: equilibrium price is unchanged.', { color: C.red, size: '78%' });   // above the plot, clear of curves
    }

    P.dot([50, 50], changed ? C.grey : C.ink, 'eq.initial');
    P.pointLabel([50, 50], changed ? 'E_0' : 'E_0 = E_1', { color: changed ? C.grey : C.ink, tip: 'eq.initial' });
    P.pLabel(50, 'P_0', { color: changed ? C.grey : C.ink, tip: 'price.initial' });
    P.qLabel(50, 'Q_0', { color: changed ? C.grey : C.ink, tip: 'qty.initial' });
    if (changed) {
      P.dot([q, p], C.ink, 'eq.new');
      P.pointLabel([q, p], 'E_1', { tip: 'eq.new' });
    }
    P.pLabel(p, 'P_1', { tip: 'price.new' });
    P.qLabel(q, 'Q_1', { tip: 'qty.new' });
    if (st.adjust && changed && !sameP) {
      P.qLabel(m.qd(50), 'Q_d', { color: C.demand, tip: 'qty.demandedAtP0' });
      P.qLabel(m.qs(50), 'Q_s', { color: C.supply, tip: 'qty.suppliedAtP0' });
    }
    P.pChange(50, p, { tip: ['change.price', { dir: dirWord(p - 50) }] });
    P.qChange(50, q, { tip: ['change.quantity', { dir: dirWord(q - 50) }] });

    const T = t => t.replace(/(^|[\s(])([a-z])/g, (_, x, y) => x + y.toUpperCase());
    const ae = Math.abs(e), dp = p - 50, art = up => up ? 'An increase' : 'A decrease';
    const prop = zero(ae - 1) ? 'an equally proportionate' : ae < 1 ? 'a less than proportionate' : 'a more than proportionate';
    // Extent wording: dropped when nothing changes; "the same proportion" for unit elasticity.
    const extent = (v, largeWhenInelastic) => zero(v) ? '' : zero(ae - 1) ? ' by the same proportion' : ` by a relatively ${(ae < 1) === largeWhenInelastic ? 'large' : 'small'} extent`;
    let implication;
    if (m.price) {
      const own = ped(kind) ? 'quantity demanded' : 'quantity supplied', sameDir = !ped(kind);
      if (zero(e)) implication = `A change in price of the good leads to no change in ${own} of the good itself, ceteris paribus.`;
      else if (e === Infinity) implication = `${ped(kind) ? 'An increase' : 'A decrease'} in price of the good leads to ${own} falling to zero, ceteris paribus.`;
      else { const up = dp !== 0 ? dp > 0 : true; implication = `${art(up)} in price of the good leads to ${prop} ${up === sameDir ? 'increase' : 'decrease'} in ${own} of the good itself, ceteris paribus.`; }
    } else {
      const xed = kind === 'XED', driver = xed ? 'the price of the related good' : 'income', up = !zero(m.shock) ? m.shock > 0 : true;
      implication = zero(e) ? `A change in ${driver} leads to no change in demand for the good, ceteris paribus.`
        : `${art(up)} in ${driver} leads to ${prop} ${(e > 0) === up ? 'increase' : 'decrease'} in demand for the good, ceteris paribus.`;
    }
    const tr = ['Total Revenue / Expenditure (TR/TE)', EW.chg(m.tr1 - m.tr0, 'P_0 × Q_0', 'P_1 × Q_1')];
    const rowsT = m.price ? [
      ['Elasticity', T(classify(kind, e))], ['Implication', implication],
      [ped(kind) ? 'Supply Shift' : 'Demand Shift', `${ped(kind) ? 'Supply' : 'Demand'} ${EW.chg(m.shock, ped(kind) ? 'S_0' : 'D_0', ped(kind) ? 'S_1' : 'D_1')}`],
      ['Price', EW.chg(dp, 'P_0', 'P_1') + extent(dp, true)], ['Quantity', EW.chg(q - 50, 'Q_0', 'Q_1') + extent(q - 50, false)], tr
    ] : [
      ['Elasticity', T(classify(kind, e))], ['Implication', implication],
      [kind === 'XED' ? 'Change in Price of Related Good' : 'Change in Income', EW.CHG(m.shock)],
      ['Shift in Demand', EW.chg(delta, 'D_0', 'D_1') + extent(delta, false)],
      ['Price', EW.chg(dp, 'P_0', 'P_1')], ['Quantity', EW.chg(q - 50, 'Q_0', 'Q_1')], tr
    ];
    return {
      result: EW.summary(rowsT),
      desc: rowsT.map(r => r.join(': ')).join('. '),
    };
  }

  // Largest change size that keeps quantity demanded at P₀ nonnegative (XED/YED).
  const sizeMax = (e, sign) => e * sign < 0 ? Math.min(50, Math.floor((100 / Math.abs(e) + 1e-8) / 5) * 5) : 50;

  const base = ['demand', 'supply', 'marketEquilibrium'];
  const widgets = {
    PED: { id: 'ped', title: 'Price Elasticity of Demand (PED)', other: 'Supply',
      glossary: [...base, 'priceElasticityOfDemand', 'perfectlyPriceInelasticDemand', 'priceInelasticDemand', 'unitElasticDemand', 'priceElasticDemand', 'perfectlyPriceElasticDemand', 'totalRevenueExpenditure', 'priceEffect', 'quantityEffect'] },
    PES: { id: 'pes', title: 'Price Elasticity of Supply (PES)', other: 'Demand',
      glossary: [...base, 'priceElasticityOfSupply', 'perfectlyPriceInelasticSupply', 'priceInelasticSupply', 'unitElasticSupply', 'priceElasticSupply', 'perfectlyPriceElasticSupply', 'totalRevenueExpenditure', 'priceEffect', 'quantityEffect'] },
    XED: { id: 'xed', title: 'Cross Elasticity of Demand (XED)', driver: 'Related-good price',
      glossary: [...base, 'crossPriceElasticityOfDemand', 'substituteGoods', 'complementaryGoods', 'unrelatedGoods'] },
    YED: { id: 'yed', title: 'Income Elasticity of Demand (YED)', driver: 'Income',
      glossary: [...base, 'incomeElasticityOfDemand', 'normalGoods', 'normalGoodsNecessities', 'normalGoodsLuxury', 'inferiorGoods', 'zeroIncomeElasticity'] },
  };
  const plot = { x: [0, 110], y: [0, 110], box: [90, 40, 490, 440] };
  for (const [kind, w] of Object.entries(widgets)) {
    const price = kind === 'PED' || kind === 'PES';
    const controls = price ? [
      { type: 'slider', id: 'el', label: kind === 'PED' ? '|PED|' : 'PES', min: 0, max: 2, step: 0.01, value: 1, ticks: [[0, '0'], [1, '1'], [2, '∞']], format: v => classify(kind, toE(kind, v)),
        onChange: st => { if (!st.refMoved) st.refEl = mirror(st.el); } },
      { type: 'radio', id: 'dir', label: `Change in ${w.other.toLowerCase()}`, value: '0', options: [['0', 'None'], ['-1', 'Decrease'], ['1', 'Increase']] },
      { type: 'check', id: 'adjust', label: 'Price adjustment' },
      { type: 'check', id: 'tr', label: 'Change in total revenue/expenditure', value: true },
      { type: 'check', id: 'ref', label: 'Reference curve', value: false },
      { type: 'slider', id: 'refEl', label: kind === 'PED' ? 'Reference |PED|' : 'Reference PES', min: 0, max: 2, step: 0.01, value: 0.67, ticks: [[0, '0'], [1, '1'], [2, '∞']],
        format: v => classify(kind, toE(kind, v)), showIf: st => st.ref, onChange: st => { st.refMoved = true; } },
    ] : [
      { type: 'slider', id: 'el', label: kind, min: -3, max: 3, step: 0.1, value: 1, ticks: [[-3, '−3'], [-1, '−1'], [0, '0'], [1, '1'], [3, '3']], format: v => `${(+v).toFixed(1).replace('-', '−')} · ${classify(kind, v)}` },
      { type: 'radio', id: 'dir', label: w.driver, value: '1', options: [['-1', 'Decrease'], ['1', 'Increase']], onChange: st => { if (!st.size) st.size = 25; } },
      { type: 'slider', id: 'size', label: 'Size of change', min: 0, max: st => sizeMax(st.el, +st.dir), step: 5, ends: ['0%', m => m + '%'], format: v => v + '%' },
      { type: 'check', id: 'adjust', label: 'Price adjustment' },
    ];
    EW.register({ id: w.id, title: w.title, glossary: w.glossary, plot, controls, draw: (P, st, C) => draw(P, st, C, kind) });
  }
})();
