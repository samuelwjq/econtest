/* Topic 4: Government intervention in markets. Demand P = 100 − Q, supply P = Q; E₀ at (50, 50).
   Prices are inverse demand/supply values; the ad valorem tax is a percentage of the pre-tax producer price. */
(() => {
  const near = (a, b) => Math.abs(a - b) < 1e-7;
  const D = q => 100 - q, S = q => q;
  const policies = {
    none: { name: 'No policy' },
    ceiling: { name: 'Price ceiling', label: 'Maximum price', min: 20, max: 80, value: 45, term: 'priceCeiling' },
    floor: { name: 'Price floor', label: 'Minimum price', min: 20, max: 80, value: 75, term: 'priceFloor' },
    wage: { name: 'Minimum wage', label: 'Minimum wage', min: 20, max: 80, value: 75, term: 'minimumWage' },
    quota: { name: 'Quota', label: 'Maximum quantity', min: 0, max: 100, value: 25, term: 'quota' },
    specific: { name: 'Indirect specific tax', label: 'Tax per unit', min: 0, max: 60, value: 20, term: 'specificTax' },
    advalorem: { name: 'Indirect ad valorem tax', label: 'Tax rate', min: 0, max: 300, value: 30, term: 'adValoremTax', unit: '%' },
    indirect: { name: 'Indirect subsidy (specific)', label: 'Subsidy per unit', min: 0, max: 60, value: 20, term: 'indirectSubsidy' },
    direct: { name: 'Direct subsidy', label: 'Subsidy per unit', min: 0, max: 60, value: 20, term: 'directSubsidy' },
  };
  const controlsPolicy = k => ['ceiling', 'floor', 'wage'].includes(k);
  const taxOrSubsidy = k => ['specific', 'advalorem', 'indirect', 'direct'].includes(k);

  function calculate(policy, v) {
    let q = 50, pc = 50, pp = 50, qd = 50, qs = 50, g = 0, binding = false, fiscal = '';
    if (policy === 'ceiling' && v < 50) { binding = true; pc = pp = v; qd = 100 - v; qs = v; q = qs; }
    if ((policy === 'floor' || policy === 'wage') && v > 50) { binding = true; pc = pp = v; qd = 100 - v; qs = v; q = qd; }
    if (policy === 'quota' && v < 50) { binding = true; q = v; pc = pp = D(q); qd = qs = q; }
    if (policy === 'specific') { q = (100 - v) / 2; pc = D(q); pp = S(q); g = v * q; fiscal = 'revenue'; }
    if (policy === 'advalorem') { const r = v / 100; q = 100 / (2 + r); pc = D(q); pp = S(q); g = (pc - pp) * q; fiscal = 'revenue'; }
    if (policy === 'indirect' || policy === 'direct') { q = (100 + v) / 2; pc = D(q); pp = S(q); g = -v * q; fiscal = 'expenditure'; }
    if (!controlsPolicy(policy)) qd = qs = q;
    const cs = (100 - pc) * q - q * q / 2, ps = pp * q - q * q / 2, tw = cs + ps + g;
    return { q, pc, pp, qd, qs, cs, ps, g, tw, dwl: Math.max(0, 2500 - tw), binding, fiscal };
  }
  const direction = n => near(n, 0) ? 'unchanged' : n > 0 ? 'increases' : 'decreases';
  const level = n => near(n, 0) ? 'unchanged' : n > 0 ? 'higher' : 'lower';
  function policyLevel(k, v) {
    const p = policies[k];
    if (k === 'ceiling') return v < 50 ? 'effective' : 'not effective';
    if (k === 'floor' || k === 'wage') return v > 50 ? 'effective' : 'not effective';
    if (k === 'quota') return v === 0 ? 'no output' : v < 50 ? 'effective' : 'not effective';
    if (v === 0) return ['indirect', 'direct'].includes(k) ? 'no subsidy' : 'no tax';
    const t = (v - p.min) / (p.max - p.min);
    return t < 0.34 ? 'low' : t < 0.67 ? 'moderate' : 'high';
  }

  function draw(P, st, C) {
    const k = st.policy, pol = policies[k], v = k === 'none' ? 0 : st[k], m = calculate(k, v), lab = k === 'wage';
    const ts = taxOrSubsidy(k), showPrices = ts && st.prices, p1 = k === 'direct' ? m.pp : m.pc, perPx = 120 / (P.b - P.t);
    const W = lab ? 'W' : 'P', Qn = lab ? 'L' : 'Q';

    // Shaded areas; a label is added only where the area is big enough to hold it.
    const shade = (pts, color, label, tip, hatch) => {
      P.area(pts, color, { tip, hatch });
      const px = pts.map(p => P.pt(p));
      let a2 = 0, cx = 0, cy = 0;
      px.forEach((p, i) => { const n = px[(i + 1) % px.length], c = p[0] * n[1] - n[0] * p[1]; a2 += c; cx += (p[0] + n[0]) * c; cy += (p[1] + n[1]) * c; });
      if (label && Math.abs(a2) / 2 > 1400) {
        const at = [(cx / (3 * a2) - P.l) / (P.r - P.l) * 120, (P.b - cy / (3 * a2)) / (P.b - P.t) * 120];
        P.pointLabel(at, label, { color, gap: [0, 8, 16], size: '78%' });
      }
    };
    if (controlsPolicy(k) && st.tr && m.q > 0 && m.pc > 0) shade([[0, 0], [m.q, 0], [m.q, m.pc], [0, m.pc]], C.quantityEffect, 'TR/TE', lab ? 'gi.trLabour' : 'gi.tr', 'vertical');
    if (!lab && st.cs && m.q > 0) shade([[0, 100], [m.q, D(m.q)], [m.q, m.pc], [0, m.pc]], C.demand, 'CS', ['gi.cs', { k }], 'diagonal');
    if (!lab && st.ps && m.q > 0) shade([[0, 0], [m.q, S(m.q)], [m.q, m.pp], [0, m.pp]], C.supply, 'PS', ['gi.ps', { k, fiscal: m.fiscal }], 'horizontal');
    if (m.fiscal && st.g && !near(m.g, 0)) shade([[0, m.pc], [m.q, m.pc], [m.q, m.pp], [0, m.pp]], C.priceEffect, null, ['gi.fiscal', { fiscal: m.fiscal }], 'cross');
    if (st.dwl && m.dwl > 1e-7) shade([[50, 50], [m.q, D(m.q)], [m.q, S(m.q)]], C.red, 'DWL', ['gi.dwl', { lab, under: m.q < 50 }], 'diagonal');

    P.axes(lab ? 'Wage' : 'Price', lab ? 'Quantity of labour' : 'Quantity');
    P.line([0, 100], [100, 0], { color: C.demand, tip: lab ? 'gi.demandLabour' : 'gi.demand' });
    P.pointLabel([100, 0], 'D_0', { color: C.demand, prefer: 'ne' });
    P.line([0, 0], [100, 100], { color: C.supply, tip: lab ? 'gi.supplyLabour' : 'gi.supply' });
    P.pointLabel([100, 100], 'S_0', { color: C.supply, prefer: 'e' });
    const policyCurve = (a, b, label, tip, atStart) => { P.line(a, b, { color: C.policy, tip }); P.pointLabel(atStart ? a : b, label, { color: C.policy, prefer: atStart ? 'ne' : 'e' }); };
    if (v > 0 && k === 'specific') policyCurve([0, v], [120 - v, 120], 'S_1 (tax)', 'gi.specificCurve');
    if (v > 0 && k === 'indirect') policyCurve([v, 0], [120, 120 - v], 'S_1 (subsidy)', 'gi.indirectCurve');
    if (v > 0 && k === 'advalorem') policyCurve([0, 0], [120 / (1 + v / 100), 120], 'S_1 (tax)', 'gi.advaloremCurve');
    if (v > 0 && k === 'direct') { const a0 = Math.max(0, v - 20), b0 = Math.min(120, 100 + v); policyCurve([a0, 100 + v - a0], [b0, 100 + v - b0], 'D_1 (subsidy)', 'gi.directCurve', true); }
    if (controlsPolicy(k)) {
      P.line([0, v], [120, v], { color: C.policy });
      P.pointLabel([112, v], lab ? 'Minimum wage' : k === 'ceiling' ? 'Price ceiling' : 'Price floor', { color: C.policy, prefer: v > 50 ? 'n' : 's', gap: [6, 14], size: '78%' });
    }
    if (k === 'quota') { P.line([v, 0], [v, 120], { color: C.policy }); P.pointLabel([v, 116], 'Quota', { color: C.policy, prefer: 'e', size: '78%' }); }

    // Axis values with dashed guides.
    const prices = [[50, `${W}_0`, 'gi.priceInitial'], [p1, `${W}_1`, ['gi.priceAfter', { k }]]];
    if (showPrices) prices.push([m.pc, 'P_c', 'gi.pc'], [m.pp, 'P_p', 'gi.pp']);
    if (k === 'ceiling' && m.binding) prices.push([D(m.q), 'P_bm', 'gi.pbm']);
    for (const [val, label, tip] of prices) {
      const toQ = near(val, 50) ? 50 : m.q;
      P.guide(toQ, val, { toX: false });
      P.pLabel(val, label, { color: label.endsWith('0') && !near(val, p1) ? C.grey : C.ink, tip });
    }
    const qs = k === 'quota' ? (v <= 50 ? [[v, 'Q_quota'], [50, 'Q_0']] : [[50, 'Q_0']]) : [[50, `${Qn}_0`], [m.q, `${Qn}_1`]];
    if (controlsPolicy(k) && m.binding) qs.push([m.qd, lab ? 'L_dd' : 'Q_dd'], [m.qs, lab ? 'L_ss' : 'Q_ss']);
    for (const [val, label] of qs) {
      P.line([val, 0], [val, Math.max(D(val), S(val), controlsPolicy(k) ? v : 0)], { color: C.guide, width: 1.2, dash: '5 4' });
      P.qLabel(val, label, { color: label.endsWith('0') && !near(val, m.q) ? C.grey : C.ink, tip: ['gi.qty', { label: label.replace('_', ''), traded: near(val, m.q) }] });
    }

    if (near(m.q, 50) && near(m.pc, 50)) { P.dot([50, 50], C.ink, 'gi.coincide'); P.pointLabel([50, 50], 'E_0 = E_1', { tip: 'gi.coincide' }); }
    else {
      P.dot([50, 50], C.grey, 'gi.e0'); P.pointLabel([50, 50], 'E_0', { color: C.grey, tip: 'gi.e0' });
      const name = controlsPolicy(k) ? 'A_1' : 'E_1', tip = ['gi.e1', { control: controlsPolicy(k) }];
      P.dot([m.q, k === 'direct' ? m.pp : m.pc], C.policy, tip); P.pointLabel([m.q, k === 'direct' ? m.pp : m.pc], name, { color: C.policy, tip });
      if (showPrices && !near(m.pc, m.pp)) P.dot([m.q, k === 'direct' ? m.pc : m.pp], C.policy, 'gi.wedge');
    }

    // Changes along the axes.
    P.pChange(50, p1, { tip: 'gi.priceChange' });
    P.qChange(50, m.q, { tip: lab ? 'gi.retrenchment' : 'gi.qtyChange', label: lab && m.binding ? 'Retrenchment' : null });
    if (m.binding && controlsPolicy(k))
      P.span([Math.min(m.qd, m.qs), 14 * perPx], [Math.max(m.qd, m.qs), 14 * perPx], lab ? 'Unemployment' : k === 'ceiling' ? 'Shortage' : 'Surplus',
        { tip: ['gi.persistentGap', { k }], labelTip: ['gi.persistentGap', { k }] });
    if (st.adjust && !controlsPolicy(k) && !near(m.q, 50)) {
      let oldQd = 50, oldQs = 50;
      if (k === 'specific') oldQs = Math.max(0, 50 - v);
      if (k === 'advalorem') oldQs = Math.max(0, 50 / (1 + v / 100));
      if (k === 'indirect') oldQs = 50 + v;
      if (k === 'direct') oldQd = 50 + v;
      if (k === 'quota') oldQs = Math.min(50, v);
      const shortage = oldQd > oldQs;
      P.span([Math.min(oldQd, oldQs), 14 * perPx], [Math.max(oldQd, oldQs), 14 * perPx], `${shortage ? 'Shortage' : 'Surplus'} at P_0`,
        { tip: ['gi.temporaryGap', { shortage }], labelTip: 'gi.temporaryGapLabel' });
      if (k !== 'quota') P.line([P.r + 40, P.Y(50)], [P.r + 40, P.Y(k === 'direct' ? m.pp : m.pc)], { color: C.grey, width: 1.5, arrow: true, px: true, tip: ['gi.pressure', { shortage }] });
    }


    // Summary table: not shown for "No policy".
    const eff = m.binding ? 'Effective' : 'Not Effective', CHG = EW.CHG, chg = EW.chg;
    const rows = k === 'none' ? [] : [];
    if (k === 'quota') rows.push(['Quota', eff]);
    if (k === 'ceiling' || k === 'floor') rows.push([k === 'ceiling' ? 'Price Ceiling' : 'Price Floor', eff]);
    if (lab) rows.push(['Minimum Wage', eff]);
    if (k !== 'none') rows.push([lab ? 'Labour Employed' : 'Quantity Traded', chg(m.q - 50, `${Qn}_0`, `${Qn}_1`)], [lab ? 'Wage' : 'Price', chg(p1 - 50, `${W}_0`, `${W}_1`)]);
    if (controlsPolicy(k)) {
      const gap = m.qd - m.qs, short = gap > 1e-7, surplus = gap < -1e-7, d = lab ? 'L' : 'Q';
      rows.push(lab ? ['Surplus of Labour', surplus ? 'Surplus (Unemployment), L_s > L_d' : 'None, L_d = L_s']
        : [short ? 'Shortage' : surplus ? 'Surplus' : 'Shortage / Surplus', short ? 'Shortage, Q_d > Q_s' : surplus ? 'Surplus, Q_s > Q_d' : 'None, Q_d = Q_s']);
    }
    if (k !== 'none') rows.push([lab ? 'Employers’ Surplus' : 'Consumer Surplus', CHG(m.cs - 1250)], [lab ? 'Workers’ Surplus' : 'Producer Surplus', CHG(m.ps - 1250)]);
    if (m.fiscal) rows.push([`Government ${m.fiscal === 'revenue' ? 'Revenue' : 'Expenditure'}`, near(m.g, 0) ? 'None' : m.g > 0 ? 'Revenue Collected' : 'Expenditure Incurred']);
    if (k !== 'none') rows.push(['Deadweight Loss', m.dwl > 1e-7 ? 'Increases' : 'None'], ['Total Welfare', m.tw < 2500 - 1e-7 ? 'Decreases' : 'Unchanged']);
    return {
      result: rows.length ? EW.summary(rows) : '',
      desc: `${pol.name}. ${rows.map(r => r.join(': ')).join('. ')}`,
    };
  }

  const isPolicy = k => st => st.policy === k;
  const sliders = Object.entries(policies).filter(([k]) => k !== 'none').map(([k, p]) => ({
    type: 'slider', id: k, label: p.label, min: p.min, max: p.max, value: p.value, showIf: isPolicy(k),
    ends: taxOrSubsidy(k) ? ['None', 'High'] : ['Lower', 'Higher'], format: v => `${v}${p.unit || ''} · ${policyLevel(k, v)}`,
  }));
  // Glossary: the selected policy's term first, then terms relevant to it (as in the original widget).
  const contextual = { quantityTraded: null, shortage: ['ceiling', 'quota', 'specific', 'advalorem', 'direct'], surplus: ['floor', 'indirect'],
    unemploymentMinimumWage: ['wage'], retrenchment: ['wage'], blackMarketPrice: ['ceiling'], governmentRevenue: ['specific', 'advalorem'], subsidyExpenditure: ['indirect', 'direct'] };
  const allTerms = ['priceCeiling', 'priceFloor', 'minimumWage', 'quota', 'taxes', 'indirectTaxes', 'specificTax', 'adValoremTax', 'subsidies', 'indirectSubsidy', 'directSubsidy',
    'quantityTraded', 'shortage', 'surplus', 'unemploymentMinimumWage', 'retrenchment', 'blackMarketPrice', 'governmentRevenue', 'subsidyExpenditure',
    'consumerSurplus', 'producerSurplus', 'totalWelfare', 'deadweightLoss'];

  EW.register({
    id: 'government-intervention', title: 'Government Intervention in Markets', plot: { x: [0, 120], y: [0, 120], box: [90, 40, 490, 440] },
    glossary: st => {
      const relevant = allTerms.filter(t => !contextual[t] || contextual[t].includes(st.policy));
      const first = policies[st.policy].term;
      return first ? [first, ...relevant.filter(t => t !== first)] : relevant;
    },
    glossaryNotes: {
      shortage: 'An effective ceiling makes this shortage persistent. With taxes, a consumer subsidy or an effective quota, the shortage at the initial price is temporary as the market price adjusts.',
      surplus: 'An effective price floor makes this surplus persistent. With a producer subsidy, the surplus at the initial price is temporary as the market price adjusts.',
      consumerSurplus: 'In the labour market, this is the surplus received by employers.',
      producerSurplus: 'In the labour market, this is the surplus received by workers.',
      deadweightLoss: 'Here, the reduction in total welfare relative to the efficient no-policy equilibrium. With no externalities, both under-trading and over-trading can reduce total welfare.',
      adValoremTax: 'In this widget, the percentage is applied to the pre-tax price received by producers: P<sub>c</sub> = (1 + tax rate) × P<sub>p</sub>.',
      directSubsidy: 'This widget models a fixed subsidy per unit bought.',
    },
    controls: [
      { type: 'select', id: 'policy', label: 'Government policy', options: Object.entries(policies).map(([k, p]) => [k, p.name]),
        onChange: st => { st.cs = st.ps = st.g = false; } },
      ...sliders,
      { type: 'check', id: 'cs', label: 'Consumer surplus', showIf: st => st.policy !== 'wage' },
      { type: 'check', id: 'ps', label: 'Producer surplus', showIf: st => st.policy !== 'wage' },
      { type: 'check', id: 'dwl', label: 'Deadweight loss', value: true },
      { type: 'check', id: 'g', label: 'Government revenue or expenditure', showIf: st => taxOrSubsidy(st.policy) },
      { type: 'check', id: 'prices', label: 'Consumer and producer prices', showIf: st => taxOrSubsidy(st.policy) },
      { type: 'check', id: 'tr', label: 'Total revenue/expenditure', showIf: st => controlsPolicy(st.policy) },
      { type: 'check', id: 'adjust', label: 'Price adjustment', showIf: st => !controlsPolicy(st.policy) && st.policy !== 'none' },
    ],
    draw,
  });
})();
