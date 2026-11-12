/* Topic 11: Firms and Decisions. Revenue curves and market power.
   One slider (barriers to entry / market power) pivots the firm's demand curve about the original equilibrium E₀ = (50, 50):
     AR(q) = 50 + b·(50 − q),  MR(q) = 50 + 50b − 2b·q,  with b = 0 (horizontal) up to b = 1 (the market demand curve P = 100 − Q).
   Market: D: P = 100 − Q, S: P = Q. Number of firms n = 100^(1 − s), falling from 100 to 1 (s = slider / 100).
   Stylised: the slider stands in for barriers to entry, number of firms and product differentiation together. */
(() => {
  const PC_BAND = 0.10, MC_BAND = 0.45;   // slider fractions where perfect competition ends, and monopolistic competition ends
  const trace = (f, a, b, n = 200) => { const pts = []; for (let i = 0; i <= n; i++) { const q = a + (b - a) * i / n, y = f(q); if (y >= 0 && y <= 100) pts.push([q, y]); } return pts; };

  function model(st) {
    const s = st.power / 100, b = Math.max(0, (s - PC_BAND) / (1 - PC_BAND)), n = s === 0 ? 100 : Math.max(1, Math.round(100 ** (1 - s)));
    const band = s <= PC_BAND ? 'pc' : n === 1 ? 'mono' : s <= MC_BAND ? 'mc' : 'oli';
    return { s, b, n, band, ar: q => 50 + b * (50 - q), mr: q => 50 + 50 * b - 2 * b * q };
  }
  const NAMES = { pc: 'Perfect Competition', mc: 'Monopolistic Competition', oli: 'Oligopoly', mono: 'Monopoly' };

  function draw(P, st, C) {
    const m = model(st), single = m.band === 'mono';
    // Market panel (left): shown beside the firm when requested, with market demand and supply.
    if (st.mkt) {
      const M = P.panel({ x: [0, 100], y: [0, 100], box: [80, 40, 420, 440] });
      M.axes('Price', 'Quantity');
      M.path([[0, 100], [100, 0]], { color: C.demand, tip: 'rev.mktD' });
      M.pointLabel([95, 5], 'D_{Market}', { color: C.demand, tip: 'rev.mktD', prefer: 'ne' });
      M.path([[0, 0], [100, 100]], { color: C.supply, tip: 'rev.mktS' });
      M.pointLabel([95, 95], 'S_{Market}', { color: C.supply, tip: 'rev.mktS', prefer: 'se' });
      M.guide(50, 50); M.dot([50, 50], C.ink, 'rev.mktEq');
      M.pLabel(50, 'P_0'); M.qLabel(50, 'Q_0');
      M.textAt(250, 506, 'Market');
      P.textAt(735, 506, 'Firm');
    }

    P.axes('Price / Revenue', 'Quantity');
    if (m.band === 'pc') {
      P.line([0, 50], [100, 50], { color: C.demand, tip: 'rev.arFlat' });
      P.pointLabel([100, 50], 'D=AR=MR', { color: C.demand, tip: 'rev.arFlat', prefer: 'ne' });
    } else {
      const ar = trace(m.ar, 0, 100), mr = trace(m.mr, 0, 100);
      P.path(ar, { color: C.demand, tip: 'rev.ar' });
      P.path(mr, { color: C.policy, tip: 'rev.mr' });
      P.pointLabel(ar[ar.length - 1], single ? 'D=AR' : 'D=AR', { color: C.demand, tip: 'rev.ar', prefer: 'e' });
      P.pointLabel(mr[mr.length - 1], 'MR', { color: C.policy, tip: 'rev.mr', prefer: 'e' });
    }
    P.guide(50, 50); P.dot([50, 50], C.ink, 'rev.pivot');
    P.pLabel(50, 'P_0'); P.qLabel(50, 'q_0');

    // Counter: number of firms in the industry.
    const counter = P.textAt(P.r - 4, P.t + 30, `Number of Firms: ${m.s === 0 ? '100+' : m.n}`, { anchor: 'end', size: '112%', tip: 'rev.firms' });
    counter.setAttribute('font-weight', '700');

    const rows = {
      pc: ['None', 'Horizontal: perfectly price elastic', 'Price taker: the firm accepts the market price, P_0', 'MR = AR'],
      mc: ['Low', 'Downward-sloping and highly price elastic', 'Price setter, with low market power', 'MR < AR (MR falls twice as fast as AR)'],
      oli: ['High', 'Downward-sloping and less price elastic', 'Price setter, with high market power', 'MR < AR (MR falls twice as fast as AR)'],
      mono: ['High', 'Downward-sloping: the same as the market demand curve', 'Price setter, with high market power', 'MR < AR (MR falls twice as fast as AR)'],
    }[m.band];
    const table = [
      ['Closest Market Structure', NAMES[m.band]],
      ['Number of Firms', m.s === 0 ? 'Many (100+)' : String(m.n)],
      ['Barriers to Entry', rows[0]],
      ['Firm’s Demand Curve (D = AR)', rows[1]],
      ['Pricing Power', rows[2]],
      ['MR Compared with AR', rows[3]],
    ];
    return { result: EW.summary(table), desc: table.map(r => r.join(': ')).join('. ') };
  }

  EW.register({
    id: 'revenue-curves', title: 'Revenue Curves and Market Power',
    plot: st => st.mkt ? { x: [0, 100], y: [0, 100], box: [570, 40, 900, 440] } : { x: [0, 100], y: [0, 100], box: [90, 40, 490, 440] },
    view: st => st.mkt ? [1000, 520] : [600, 520],
    glossary: ['totalRevenueExpenditure', 'averageRevenue', 'marginalRevenue', 'marketPower', 'barriersToEntry', 'priceTaker', 'priceSetter', 'perfectCompetition', 'monopolisticCompetition',
      'oligopoly', 'monopoly'],
    controls: [
      { type: 'slider', id: 'power', label: 'Barriers to entry / market power', min: 0, max: 100, value: 0, ends: ['Low', 'High'],
        hint: 'One slider stands in for barriers to entry, the number of firms and product differentiation together. The market structure shown is the closest match.' },
      { type: 'check', id: 'mkt', label: 'Show market demand and supply', value: false },
    ],
    draw,
  });
})();
