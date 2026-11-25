/* Topic 11: Firms and Decisions. Efficiency and welfare of the four market structures.
   Long-run firm diagram on the cost model of firms-profit.js (AC = AVC, minimum 40 at q = 60), with the revenue model of firms-revenue.js:
     AR(q) = d + b(60 − q), b = (s − 0.10)/0.90 from the Barriers to Entry slider s.
   Perfect competition: AR horizontal at minimum AC. Monopolistic competition: AR tangent to AC (normal profit).
   Oligopoly and monopoly: AR above AC, with a margin that grows with the barriers (supernormal profit persists).
   The efficient point E_s is where AR (the demand curve) meets MC (P = MC). */
(() => {
  const { costModel, solveB, bisect, trace, last, placeTags, COL, NAMES } = EW.firms;
  const XMAX = 120, YTOP = 118, PIV = 60, PC_BAND = 0.10, MC_BAND = 0.45;
  const C0 = costModel(60, 40, 0);   // long-run cost curves: AC = AVC, minimum 40 at output 60

  function structure(st) {
    const s = st.bte / 100, n = s === 0 ? 100 : Math.max(1, Math.round(100 ** (1 - s)));
    return { s, n, band: s <= PC_BAND ? 'pc' : n === 1 ? 'mono' : s <= MC_BAND ? 'mc' : 'oli' };
  }

  function model(st) {
    const { s, n, band } = structure(st), b = Math.max(0, (s - PC_BAND) / (1 - PC_BAND));
    const base = solveB(C0, b, 50, band, 0);
    let d = base.dN ?? base.dLo;   // normal profit: AR touches AC at q₀
    if (band === 'oli' || band === 'mono') {   // barriers let a margin of supernormal profit persist; it grows with the barriers
      const f = 0.25 + 0.75 * Math.min(1, Math.max(0, (s - MC_BAND) / 0.45));
      d += f * 0.5 * (base.dHi - d);
    }
    const m = solveB(C0, b, d, band, 0), ar = q => m.d + b * (PIV - q), mc = C0.mc;
    // Efficient point: where AR meets MC, to the right of q₀ (equal to q₀ when P = MC).
    let qs = m.q0;
    const gap = q => ar(q) - mc(q);
    if (gap(m.q0) > 1e-6) {
      let q = m.q0; while (q < YTOP && gap(q + 0.25) > 0) q += 0.25;
      if (q >= YTOP) qs = YTOP; else { let lo = q, hi = q + 0.25; for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; (gap(mid) > 0 ? lo = mid : hi = mid); } qs = (lo + hi) / 2; }
    }
    const mc0 = mc(m.q0), efficient = qs - m.q0 < 1e-4;
    const xi = st.xi && (band === 'oli' || band === 'mono'), xgap = xi ? Math.min(st.xgap, 0.9 * (m.P0 - m.AC0)) : 0;
    return { ...m, s, n, band, b, ar, mc, qs, Ps: ar(qs), mc0, efficient, xi: xi && xgap >= 1, AC1: m.AC0 + xgap, xgap };
  }

  function draw(P, st, C) {
    const m = model(st), { q0, P0, AC0, mc0, qs, Ps, band, b, ar, mc } = m, pc = band === 'pc', market = st.mkt && band !== 'mono';
    const tags = [];
    // ---- Market panel (optional, left) ----
    if (market) {
      const M = P.panel({ x: [0, 100], y: [0, 120], box: [80, 40, 420, 440] });
      M.axes('Price', 'Quantity');
      if (pc) {
        const k = P0 / 50;
        if (st.cs) M.area([[0, P0], [0, 2 * P0], [50, P0]], COL.cs, { opacity: 0.25, hatch: 'diagonal', tip: 'eff.cs' });
        if (st.ps) M.area([[0, 0], [0, P0], [50, P0]], COL.ps, { opacity: 0.3, hatch: 'diagonal', tip: 'eff.ps' });
        M.path(trace(q => 2 * P0 - k * q, 0, 100, 120), { color: C.demand, tip: 'rev.mktD' });
        M.pointLabel([95, 2 * P0 - k * 95], 'D_{Market}', { color: C.demand, tip: 'rev.mktD', prefer: 'ne' });
        M.path(trace(q => k * q, 0, 100, 120), { color: C.supply, tip: 'rev.mktS' });
        M.pointLabel([95, k * 95], 'S_{Market}', { color: C.supply, tip: 'rev.mktS', prefer: 'se' });
        if (st.cs) M.text([8, P0 + 6], 'CS', { color: COL.cs, tip: 'eff.cs' });
        if (st.ps) M.text([8, P0 - 12], 'PS', { color: COL.ps, tip: 'eff.ps' });
      } else {
        M.path(trace(q => P0 + (50 - q), 0, 100, 120), { color: C.demand, tip: 'rev.mktD' });
        M.pointLabel([95, P0 - 45], 'D_{Market}', { color: C.demand, tip: 'rev.mktD', prefer: 'ne' });
      }
      M.guide(50, P0); M.dot([50, P0], C.ink, 'rev.mktEq');
      M.pLabel(P0, 'P_0'); M.qLabel(50, 'Q_0');
      M.textAt(250, 506, 'Market');
      P.textAt(735, 506, 'Firm');
    }

    P.axes('Price / Costs / Revenue', 'Output');
    // ---- Shaded areas (firm diagram) ----
    if (st.cs && !pc) {
      const ar0 = m.d + b * PIV, pts = [[0, P0]];
      if (ar0 > YTOP) pts.push([0, YTOP], [(ar0 - YTOP) / b, YTOP]); else pts.push([0, ar0]);
      pts.push([q0, P0]);
      P.area(pts, COL.cs, { opacity: 0.25, hatch: 'diagonal', tip: 'eff.cs' });
      const x = q0 * 0.1;
      tags.push({ text: 'CS', color: COL.cs, tip: 'eff.cs', ax: x, ay: P0 + (Math.min(m.d + b * (PIV - x), YTOP) - P0) * 0.4 });
    }
    if (st.ps && !pc) {
      const pts = [];
      for (let i = 0; i <= 120; i++) { const q = q0 * i / 120, y = mc(q); if (y <= P0) pts.push([q, y]); }
      if (pts.length > 1) {
        P.area([[pts[0][0], P0], ...pts, [q0, P0]], COL.ps, { opacity: 0.3, hatch: 'diagonal', tip: 'eff.ps' });
        tags.push({ text: 'PS', color: COL.ps, tip: 'eff.ps', ax: q0 * 0.9, ay: (P0 + mc(q0 * 0.9)) / 2 });
      }
    }
    if (st.dwl && !m.efficient) {   // between D = AR and MC, from q₀ to q_s
      const top = [], bottom = [];
      for (let i = 0; i <= 40; i++) { const q = q0 + (qs - q0) * i / 40; top.push([q, ar(q)]); bottom.push([q, mc(q)]); }
      P.area([...top, ...bottom.reverse()], C.red, { opacity: 0.3, hatch: 'cross', tip: 'eff.dwl' });
      const qm = q0 + (qs - q0) * 0.3;
      tags.push({ text: 'DWL', color: C.red, tip: 'eff.dwl', ax: qm, ay: (ar(qm) + mc(qm)) / 2, minX: qs });
    }
    if (m.xi) {
      P.area([[0, AC0], [q0, AC0], [q0, m.AC1], [0, m.AC1]], C.perceived, { opacity: 0.3, hatch: 'horizontal', tip: 'eff.xi' });
      tags.push({ text: 'Excess Cost', color: '#a85a00', tip: 'eff.xi', ax: q0 * 0.6, ay: (AC0 + m.AC1) / 2 });
    }
    // Benchmark: the efficient point, and the consumer surplus there (dashed outline).
    if (st.bench && !pc) {
      if (st.cs) {
        const ar0 = m.d + b * PIV, pts = [[0, Ps]];
        if (ar0 > YTOP) pts.push([0, YTOP], [(ar0 - YTOP) / b, YTOP]); else pts.push([0, ar0]);
        pts.push([qs, Ps]);
        P.path([...pts, pts[0]], { color: COL.cs, width: 1.5, dash: '5 4', tip: 'eff.csMax' });
        const x = qs * 0.12;
        tags.push({ text: 'Maximum CS', color: COL.cs, tip: 'eff.csMax', ax: x, ay: Ps + (Math.min(m.d + b * (PIV - x), YTOP) - Ps) * 0.5, minX: qs });
      }
    }

    // ---- Curves ----
    if (pc) { P.line([0, P0], [XMAX, P0], { color: C.demand, tip: 'rev.arFlat' }); P.pointLabel([XMAX, P0], 'D=AR=MR', { color: C.demand, tip: 'rev.arFlat', prefer: 'ne' }); }
    else {
      const arT = trace(ar, 0, XMAX, 320), mr = trace(q => m.d + PIV * b - 2 * b * q, 0, XMAX, 320);
      P.path(arT, { color: C.demand, tip: 'rev.ar' });
      P.pointLabel(last(arT), 'D=AR', { color: C.demand, tip: 'rev.ar', prefer: 'e' });
      P.path(mr, { color: C.policy, tip: 'rev.mr' });
      if (mr.length) P.pointLabel(last(mr), 'MR', { color: C.policy, tip: 'rev.mr', prefer: 'e' });
    }
    const acT = trace(C0.ac, 0.5, XMAX), mcT = trace(mc, 0.5, XMAX);
    P.path(acT, { color: C.supply, tip: 'cost.ac' });
    P.pointLabel(last(acT), 'AC', { color: C.supply, tip: 'cost.ac', prefer: 'e' });
    P.path(mcT, { color: C.red, tip: 'profit.mc' });
    P.pointLabel(last(mcT), 'MC', { color: C.red, tip: 'profit.mc', prefer: 'e' });

    // ---- Points and axis labels ----
    const dash = { color: C.guide, width: 1.2, dash: '5 4' };
    P.line([q0, 0], [q0, Math.max(P0, AC0, mc0, m.xi ? m.AC1 : 0)], dash);
    const efficientShown = st.bench && !pc;
    P.dot([q0, P0], C.demand, pc ? 'profit.p0pc' : 'profit.p0');
    P.dot([q0, mc0], C.ink, 'profit.cross');
    P.dot([q0, AC0], C.supply, 'profit.ac0');
    const ent = [{ v: P0, n: 'P_0', tip: pc ? 'profit.p0pc' : 'profit.p0' }, { v: mc0, n: 'MC_0', tip: 'profit.mc0' }, { v: AC0, n: 'AC_0', tip: 'profit.ac0' }];
    if (m.xi) { P.dot([q0, m.AC1], C.perceived, 'eff.xi'); ent.push({ v: m.AC1, n: 'AC_1', tip: 'eff.xi' }); }
    const groups = [];
    for (const e of ent) { const g = groups.find(x => Math.abs(x.v - e.v) < 0.8); g ? g.names.push(e.n) : groups.push({ v: e.v, names: [e.n], tip: e.tip }); }
    for (const g of groups) { P.line([0, g.v], [q0, g.v], dash); P.pLabel(g.v, g.names.join(' = '), { tip: g.tip }); }
    P.qLabel(q0, efficientShown && m.efficient ? 'q_0 = q_s' : 'q_0', { tip: 'profit.q0' });
    if (efficientShown && !m.efficient) {
      P.guide(qs, Ps); P.dot([qs, Ps], C.ink, 'eff.efficient');
      P.pLabel(Ps, 'P_s', { tip: 'eff.efficient' }); P.qLabel(qs, 'q_s', { tip: 'eff.efficient' });
    }
    // Number of firms.
    const counter = P.textAt(P.r - 4, P.t - 8, `Number of Firms: ${m.s === 0 ? '100+' : m.n}`, { anchor: 'end', size: '112%', tip: 'rev.firms' });
    counter.setAttribute('font-weight', '700');
    placeTags(P, tags, q0);

    // ---- Summary ----
    const sup = band === 'oli' || band === 'mono';
    const rows = [
      ['Market Structure', NAMES[band]],
      ['Barriers to Entry and Contestability', { pc: 'No barriers to entry, so the market is highly contestable', mc: 'Low barriers to entry, so the market is highly contestable',
        oli: 'High barriers to entry, so the market is not very contestable', mono: 'High barriers to entry, so the market is not very contestable' }[band]],
      ['Allocative Efficiency', pc ? 'Achieved: P_0 = MC_0, so output q_0 is the socially optimal output' : 'Not achieved: P_0 > MC_0, so output q_0 is below the socially optimal output q_s (underproduction)'],
      ['Productive Efficiency', m.xi ? 'Not achieved: the firm operates at AC_1 > AC_0 at q_0 (x-inefficiency)'
        : sup ? 'Depends: lack of competitive pressure may lead to x-inefficiency (AC above the lowest possible AC_0), but a large firm may reap economies of scale and have a lower average cost'
        : 'Achieved: the firm produces on the LRAC'],
      ['Dynamic Efficiency', { pc: 'Not achieved: no incentive and no ability for R&D', mc: 'Not achieved: has the incentive but no ability for R&D', oli: 'Achieved: has the incentive and ability for R&D', mono: 'Depends' }[band]],
      ['Consumer Surplus and Equity', { pc: 'CS is maximised. Firms make normal profit in the long run. Equitable', mc: 'Reduction in CS. Firms make only normal profit in the long run. Equitable',
        oli: 'Reduction in CS. Firms can make supernormal profit in the long run. Inequitable', mono: 'Reduction in CS. Firms can make supernormal profit in the long run. Inequitable' }[band]],
      ['Variety and Consumer Choice', { pc: 'Products are homogeneous, so no consumer choice', mc: 'Products are differentiated, so consumers have choices',
        oli: 'Products can be homogeneous or differentiated, so consumers have choices', mono: 'Products are unique' }[band]],
      st.dwl && ['Deadweight Loss', m.efficient ? 'None: P_0 = MC_0' : 'Present: the area between D = AR and MC from q_0 to q_s'],
      st.cs && ['Consumer Surplus', pc ? (market ? 'Maximised: the area under market demand and above P_0, up to Q_0' : 'Maximised (tick “Show market diagram” to see it)') : 'Smaller than under Perfect Competition: the area under D = AR and above P_0, up to q_0'],
      st.ps && ['Producer Surplus', pc ? (market ? 'The area above market supply and below P_0, up to Q_0' : 'Tick “Show market diagram” to see it') : 'The area above MC and below P_0, up to q_0, including the supernormal profit'],
    ];
    return { result: EW.summary(rows), desc: `${NAMES[band]}. ` + rows.filter(Boolean).map(r => r.join(': ')).join('. ') };
  }

  const isBand = (...bands) => st => bands.includes(structure(st).band);
  EW.register({
    id: 'efficiency-welfare', title: 'Efficiency and Welfare of Market Structures',
    plot: st => structure(st).band !== 'mono' && st.mkt ? { x: [0, XMAX], y: [0, XMAX], box: [570, 40, 900, 440] } : { x: [0, XMAX], y: [0, XMAX], box: [90, 40, 490, 440] },
    view: st => structure(st).band !== 'mono' && st.mkt ? [1000, 520] : [600, 520],
    glossary: ['allocativeEfficiencyFirm', 'productiveEfficiencyFirm', 'dynamicEfficiency', 'xInefficiency', 'contestableMarkets', 'deadweightLossFirm', 'consumerSurplusFirm', 'producerSurplusFirm',
      'marketPower', 'barriersToEntry', 'perfectCompetition', 'monopolisticCompetition', 'oligopoly', 'monopoly'],
    controls: [
      { type: 'slider', id: 'bte', label: 'Barriers to entry', min: 0, max: 100, value: 0, ends: ['Low', 'High'],
        hint: 'One slider stands in for barriers to entry, the number of firms, product differentiation and how contestable the market is. The market structure shown is the closest match. Higher barriers mean less contestability: the threat of entry disciplines price and cost less.' },
      { type: 'check', id: 'mkt', label: 'Show market diagram', value: false, showIf: isBand('pc', 'mc', 'oli') },
      { type: 'check', id: 'bench', label: 'Compare with Perfect Competition', value: false, showIf: isBand('mc', 'oli', 'mono') },
      { type: 'check', id: 'cs', label: 'Show Consumer Surplus', value: false },
      { type: 'check', id: 'ps', label: 'Show Producer Surplus', value: false },
      { type: 'check', id: 'dwl', label: 'Show Deadweight Loss', value: true },
      { type: 'check', id: 'xi', label: 'Show x-inefficiency', value: false, showIf: isBand('oli', 'mono') },
      { type: 'slider', id: 'xgap', label: 'Size of x-inefficiency', min: 3, max: 20, value: 10, ends: ['Small', 'Large'], showIf: st => st.xi && isBand('oli', 'mono')(st),
        hint: 'The excess cost cannot exceed the supernormal profit margin in this diagram.' },
    ],
    draw,
  });
})();
