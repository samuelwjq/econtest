/* Topic 11: Firms and Decisions. Costs of production.
   1. Short-run costs. Stylised, with no numbers on the axes.
      AVC(q) = h + k·(q − Qv)²          (minimum h at output Qv)
      MC(q)  = d(q·AVC)/dq = h + k·(q − Qv)(3q − Qv)   (always cuts AVC at its minimum)
      AFC(q) = F / q,  AC = AVC + AFC   (MC cuts AC at its minimum, which lies to the right of Qv when F > 0)
      With fixed costs hidden, AC = AVC.
   2. Economies and diseconomies of scale. LRAC = m + a·(q − Q1)², with a = AL left of the minimum and AR right of it: a smooth U with
      one minimum at Q1 (the optimum scale). Internal cases move along the curve; external cases shift the whole curve (parallel). */
(() => {
  /* Points of f(q) for q in [a, b], keeping only those on the plot (0 ≤ y ≤ top), so a curve enters and leaves at the frame. */
  const trace = (f, a, b, top = 118, n = 320) => {
    const pts = [];
    for (let i = 0; i <= n; i++) { const q = a + (b - a) * i / n, y = f(q); if (y >= 0 && y <= top) pts.push([q, y]); }
    return pts;
  };
  const last = pts => pts[pts.length - 1];

  /* ---------------- 1. Short-run costs ---------------- */
  function srModel(st) {
    const Qv = st.qv, h = st.hmin, k = st.k / 1000, F = st.fc ? st.fcAmt : 0;
    const avc = q => h + k * (q - Qv) ** 2;
    const mc = q => h + k * (q - Qv) * (3 * q - Qv);
    const afc = q => F / q;
    const ac = q => avc(q) + (F ? F / q : 0);
    let qac = Qv;
    if (F > 0) {   // AC is lowest where 2k(q − Qv) = F/q²; the left side minus the right side rises with q, so bisect
      let lo = Qv, hi = Qv + 400;
      for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; (2 * k * (mid - Qv) - F / (mid * mid) < 0 ? lo = mid : hi = mid); }
      qac = (lo + hi) / 2;
    }
    return { Qv, h, k, F, avc, mc, afc, ac, qac, acMin: ac(qac) };
  }

  function drawSR(P, st, C) {
    const m = srModel(st), showFC = st.fc && m.F > 0, zeroFC = st.fc && m.F === 0, XMAX = 120;
    P.axes('Cost', 'Output');
    const col = { mc: C.red, ac: C.supply, avc: C.perceived, afc: C.quantityEffect };
    if (showFC) {
      const afc = trace(m.afc, 0.5, XMAX);
      P.path(afc, { color: col.afc, tip: 'cost.afc' });
      P.pointLabel([95, m.afc(95)], 'AFC', { color: col.afc, tip: 'cost.afc', prefer: 'n' });
      const avc = trace(m.avc, 0.5, XMAX);
      P.path(avc, { color: col.avc, tip: 'cost.avc' });
      P.pointLabel(last(avc), 'AVC', { color: col.avc, tip: 'cost.avc', prefer: 'e' });
    }
    const ac = trace(m.ac, 0.5, XMAX), mc = trace(m.mc, 0.5, XMAX);
    P.path(ac, { color: col.ac, tip: 'cost.ac' });
    P.path(mc, { color: col.mc, tip: 'cost.mc' });
    P.pointLabel(last(ac), zeroFC ? 'AC = AVC' : 'AC', { color: col.ac, tip: 'cost.ac', prefer: 'e' });
    if (zeroFC) P.pointLabel([95, 0], 'AFC = 0', { color: col.afc, tip: 'cost.afc', prefer: 'n' });
    P.pointLabel(last(mc), 'MC', { color: col.mc, tip: 'cost.mc', prefer: 'e' });

    // Where MC cuts the minimum of AC (and of AVC when fixed costs are shown).
    P.guide(m.qac, m.acMin);
    P.dot([m.qac, m.acMin], C.ink, 'cost.minAC');
    const qMin = showFC ? 'Q_2' : 'Q_1';   // as in the notes: Q₁ is where AVC is lowest, Q₂ where AC is lowest once fixed costs are included
    P.qLabel(m.qac, qMin, { tip: 'cost.minAC' });
    P.pLabel(m.acMin, 'AC_{min}', { tip: 'cost.minAC' });
    if (showFC) {
      P.guide(m.Qv, m.h);
      P.dot([m.Qv, m.h], C.ink, 'cost.minAVC');
      P.qLabel(m.Qv, 'Q_1', { tip: 'cost.minAVC' });
      P.pLabel(m.h, 'AVC_{min}', { tip: 'cost.minAVC' });
    }

    const rows = [
      ['Rule', 'MC cuts AC from below at the minimum point of AC'],
      [`Output Below ${qMin}`, 'MC < AC, so AC falls'],
      [`Output at ${qMin}`, 'MC = AC, so AC is at its minimum'],
      [`Output Above ${qMin}`, 'MC > AC, so AC rises'],
      showFC ? ['AC', 'AC = AVC + AFC'] : ['Fixed Costs', zeroFC ? 'None, so AC = AVC and AFC = 0' : 'Not shown, so AC = AVC'],
      showFC && ['AFC', 'Falls as output rises, since the fixed cost is spread over more units'],
      showFC && ['Gap Between AC and AVC', 'Equals AFC, so it narrows as output rises'],
      showFC && ['Minimum Points', 'MC cuts AVC at its minimum (Q_1) and AC at its minimum (Q_2). Q_2 is at a higher output than Q_1'],
    ];
    return { result: EW.summary(rows), desc: rows.filter(Boolean).map(r => r.join(': ')).join('. ') };
  }

  const fixed = st => st.fc && st.fcAmt > 0;   // fixed costs actually in the picture, so AVC is a separate curve from AC
  EW.register({
    id: 'sr-costs', title: 'Short-Run Costs', plot: { x: [0, 120], y: [0, 120], box: [90, 40, 490, 440] },
    glossary: ['shortRun', 'fixedCost', 'variableCost', 'averageCost', 'averageFixedCost', 'averageVariableCost', 'marginalCost'],
    controls: [
      { type: 'slider', id: 'qv', label: st => fixed(st) ? 'Output at minimum AVC' : 'Output at minimum AC', min: 30, max: 80, value: 50, ends: ['Lower', 'Higher'] },
      { type: 'slider', id: 'hmin', label: st => fixed(st) ? 'Cost at minimum AVC' : 'Cost at minimum AC', min: 15, max: 60, value: 40, ends: ['Lower', 'Higher'] },
      { type: 'slider', id: 'k', label: 'Steepness of MC', min: 4, max: 30, value: 12, ends: ['Flatter', 'Steeper'], hint: 'A steeper MC means diminishing marginal returns set in more strongly. It also makes AC more sharply U-shaped.' },
      { type: 'check', id: 'fc', label: 'Show fixed costs', value: false },
      { type: 'slider', id: 'fcAmt', label: 'Size of fixed cost', min: 0, max: 2400, value: 1000, step: 100, ends: ['None', 'Significant'], showIf: st => st.fc },
    ],
    draw: drawSR,
  });

  /* ---------------- 2. Economies and diseconomies of scale ---------------- */
  const Q1 = 50, MIN = 30, AL = 0.0344, AR = 0.028, XMAX = 98, YTOP = 118;
  const lrac = (q, shift = 0) => MIN + (q < Q1 ? AL : AR) * (q - Q1) ** 2 + shift;
  const CASES = {
    ie: { name: 'Internal Economies of Scale', internal: true },
    id: { name: 'Internal Diseconomies of Scale', internal: true },
    ee: { name: 'External Economies of Scale', internal: false },
    ed: { name: 'External Diseconomies of Scale', internal: false },
  };
  const cause = {
    ie: 'Spreading of fixed costs, productivity improvements and greater buying power over inputs as the firm expands',
    id: 'Fall in productivity from greater complexity and lower labour motivation, and more resources used to manage these problems',
    ee: 'Industry expansion: sharing of common resources and outsourcing of production processes to supporting firms',
    ed: 'Industry expansion: infrastructure bottlenecks and increased competition for common inputs',
  };

  function drawScale(P, st, C) {
    const kind = CASES[st.case], t = st.scale / 100;
    let qa, qb, shift = 0;
    if (st.case === 'ie') { qa = 15; qb = 15 + (Q1 - 15) * t; }
    else if (st.case === 'id') { qa = Q1; qb = Q1 + (97 - Q1) * t; }
    else { qa = qb = st.qout; shift = (st.case === 'ee' ? -1 : 1) * t * 25; }
    const moved = kind.internal ? qb - qa > 0.05 : Math.abs(shift) > 0.05;
    const newName = st.case === 'ee' ? 'LRAC_1' : 'LRAC_2';
    const ac0 = lrac(qa), ac1 = lrac(qb, shift);

    P.axes('Cost', 'Output');
    // Curves. External cases keep the original LRAC₀ as a faint ghost.
    if (!kind.internal && moved) {
      const g = trace(q => lrac(q), 6, XMAX, YTOP);
      P.path(g, { color: C.supply0, tip: 'scale.ghost' });
      P.pointLabel(last(g), 'LRAC_0', { color: C.supply0, tip: 'scale.ghost', prefer: 'e' });
      const c = trace(q => lrac(q, shift), 6, XMAX, YTOP);
      P.path(c, { color: C.supply, tip: 'scale.lrac' });
      P.pointLabel(last(c), newName, { color: C.supply, tip: 'scale.lrac', prefer: 'e' });
    } else {
      const c = trace(q => lrac(q), 6, XMAX, YTOP);
      P.path(c, { color: C.supply, tip: 'scale.lrac' });
      P.pointLabel(last(c), kind.internal ? 'LRAC' : 'LRAC_0', { color: C.supply, tip: 'scale.lrac', prefer: 'e' });
    }
    // The single minimum of LRAC: the optimum scale, Q₁ (always marked on the original curve).
    P.guide(Q1, MIN, { toY: false });
    P.qLabel(Q1, 'Q_1', { tip: 'scale.optimum' });

    // The firm's output and average cost.
    if (kind.internal && moved) {
      P.path(trace(q => lrac(q), qa, qb, YTOP, 80), { color: C.red, width: 2.4, arrow: true, tip: 'scale.move' });
      P.guide(qa, ac0); P.dot([qa, ac0], C.grey, 'scale.start');
      P.qLabel(qa, 'Q_a', { color: C.grey }); P.pLabel(ac0, 'AC_a', { color: C.grey, tip: 'scale.start' });
      P.guide(qb, ac1); P.dot([qb, ac1], C.ink, 'scale.now');
      P.qLabel(qb, 'Q_b'); P.pLabel(ac1, 'AC_b', { tip: 'scale.now' });
      P.pointLabel([qa, ac0], 'A', { color: C.grey, tip: 'scale.start', prefer: 'nw' });
      P.pointLabel([qb, ac1], 'B', { tip: 'scale.now', prefer: 'nw' });
      P.qChange(qa, qb, { tip: 'scale.qChange' });
      P.pChange(ac0, ac1, { tip: 'scale.acChange' });
    } else if (!kind.internal && moved) {
      P.guide(qa, ac0); P.dot([qa, ac0], C.grey, 'scale.start');
      P.guide(qa, ac1); P.dot([qa, ac1], C.ink, 'scale.now');
      P.qLabel(qa, 'Q_0');
      P.pLabel(ac0, 'AC_a', { color: C.grey, tip: 'scale.start' });
      P.pLabel(ac1, 'AC_b', { tip: 'scale.now' });
      P.pointLabel([qa, ac0], 'A', { color: C.grey, tip: 'scale.start', prefer: 'se' });
      P.pointLabel([qa, ac1], 'B', { tip: 'scale.now', prefer: 'nw' });
      P.pChange(ac0, ac1, { tip: 'scale.acChange' });
    } else {
      P.guide(qa, ac0); P.dot([qa, ac0], C.ink, 'scale.now');
      P.qLabel(qa, kind.internal ? 'Q_a' : 'Q_0'); P.pLabel(ac0, 'AC_a', { tip: 'scale.start' });
      P.pointLabel([qa, ac0], 'A', { tip: 'scale.start', prefer: 'nw' });
    }

    const rows = [['Case', kind.name]];
    if (kind.internal) {
      rows.push(['Movement', `Along the ${st.case === 'ie' ? 'downward' : 'upward'}-sloping portion of LRAC`]);
      rows.push(['Output', EW.chg(qb - qa, 'Q_a', 'Q_b')]);
      rows.push(['Average Cost', EW.chg(ac1 - ac0, 'AC_a', 'AC_b')]);
    } else {
      rows.push(['LRAC Curve', moved ? `Shifts ${shift < 0 ? 'Downward' : 'Upward'} (LRAC_0 → ${newName})` : 'Unchanged']);
      rows.push(['Output', 'Unchanged (Q_0)']);
      rows.push(['Average Cost at Q_0', EW.chg(ac1 - ac0, 'AC_a', 'AC_b')]);
      if (moved) rows.push(['Effect of the Shift', 'The change in average cost is the same at every level of output, since the whole curve moves']);
    }
    rows.push(['Cause', cause[st.case]]);
    return { result: EW.summary(rows), desc: rows.map(r => r.join(': ')).join('. ') };
  }

  const external = st => !CASES[st.case].internal;
  EW.register({
    id: 'scale-economies', title: 'Economies and Diseconomies of Scale', plot: { x: [0, 100], y: [0, 120], box: [90, 40, 490, 440] },
    glossary: ['longRun', 'longRunAverageCost', 'economiesOfScale', 'internalEconomiesOfScale', 'internalDiseconomiesOfScale', 'externalEconomiesOfScale',
      'externalDiseconomiesOfScale'],
    controls: [
      { type: 'radio', id: 'case', label: 'Case', options: Object.entries(CASES).map(([k, v]) => [k, v.name]) },
      { type: 'slider', id: 'scale', label: st => external(st) ? 'Scale of industry' : 'Scale of firm', min: 0, max: 100, value: 50, ends: ['Smaller', 'Larger'],
        hint: st => external(st) ? 'A larger industry shifts the whole LRAC.' : st.case === 'ie' ? 'A larger firm moves along the falling part of LRAC.' : 'A larger firm moves along the rising part of LRAC.' },
      { type: 'slider', id: 'qout', label: 'Output of the firm (Q<sub>0</sub>)', min: 12, max: 90, value: 30, ends: ['Lower output', 'Higher output'], showIf: external,
        hint: 'The shift changes average cost at every level of output.' },
    ],
    draw: drawScale,
  });
})();
