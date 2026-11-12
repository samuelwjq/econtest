/* Topic 11: Firms and Decisions. Profit maximisation: an unguided widget and a guided "draw the diagram" walkthrough.
   Stylised model (no numbers on the axes).
     Costs:    AVC(q) = h + k(q − Qv)²,  MC(q) = h + k(q − Qv)(3q − Qv),  AC = AVC + F/q,  with k = 0.9h/Qv² (see firms-costs.js).
     Revenue:  AR(q) = d + b(60 − q),  MR(q) = d + 60b − 2bq. The slope b depends on the market structure; d is the demand level.
   q₀ is the output at which MC = MR and MC cuts MR from below (the last crossing, scanning from the right). The demand-level slider only
   covers demand levels for which such a crossing exists on the plot. */
(() => {
  const XMAX = 120, YTOP = 118, QCAP = 240, PIV = 60, QLIM = 112;
  const COL = { tr: '#1a6fe0', tc: '#e0a01a', profit: '#4f8a1c', profitDark: '#2f5a0f', cs: '#d94f93', ps: '#8a7560', lead: '#b9b5ab' };   // TR blue, TC yellow, profit = their blend (green), CS pink, PS grey-brown
  const NAMES = { pc: 'Perfect Competition', mc: 'Monopolistic Competition', oli: 'Oligopoly', mono: 'Monopoly' };
  const SLOPE = { pc: 0, mc: 0.25, oli: 0.6, mono: 1.0 };
  const STRUCTURES = Object.entries(NAMES);
  const trace = (f, a, b, n = 320) => {
    const pts = [];
    for (let i = 0; i <= n; i++) { const q = a + (b - a) * i / n, y = f(q); if (y >= 0 && y <= YTOP) pts.push([q, y]); }
    return pts;
  };
  const last = pts => pts[pts.length - 1];
  const bisect = (f, lo, hi) => { for (let i = 0; i < 45; i++) { const mid = (lo + hi) / 2; (f(mid) ? hi = mid : lo = mid); } return (lo + hi) / 2; };   // smallest x in [lo, hi] with f(x) true (f monotone: false then true)

  /* ---------- Model ---------- */
  function costModel(Qv, h, F) {
    const k = 0.9 * h / (Qv * Qv);
    const avc = q => h + k * (q - Qv) ** 2, mc = q => h + k * (q - Qv) * (3 * q - Qv), ac = q => avc(q) + (F ? F / q : 0);
    let qac = Qv;
    if (F > 0) qac = bisect(q => 2 * k * (q - Qv) - F / (q * q) > 0, Qv, Qv + 600);
    return { Qv, h, F, avc, mc, ac, qac, natural: qac >= XMAX - 1 };
  }
  // Profit-maximising output for AR/MR with demand level d: the last q (below QCAP) where MC ≤ MR, refined to the crossing. null if there is none.
  function q0Of(c, b, d) {
    const g = q => c.mc(q) - (d + PIV * b - 2 * b * q);
    for (let q = QCAP; q > 0.2; q -= 0.25) {
      if (g(q) <= 0) { if (q >= QCAP) return QCAP; let lo = q, hi = q + 0.25; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; (g(m) <= 0 ? lo = m : hi = m); } return (lo + hi) / 2; }
    }
    return null;
  }
  function outcome(c, b, d) {
    const q0 = q0Of(c, b, d);
    if (q0 == null) return null;
    const P0 = d + b * (PIV - q0), AC0 = c.ac(q0), AVC0 = c.avc(q0);
    return { q0, P0, AC0, AVC0, mr0: d + PIV * b - 2 * b * q0, profit: (P0 - AC0) * q0 };
  }
  function solve(structure, Qv, h, F, dIn) {
    const c = costModel(Qv, h, F), b = SLOPE[structure];
    const dLo = bisect(d => q0Of(c, b, d) != null, 0, 300) + 1.5;
    const okHi = d => { const o = outcome(c, b, d); return o && o.q0 <= QLIM && o.P0 <= QLIM; };
    let dHi = dLo + 0.5;
    if (okHi(dLo)) { let lo = dLo, hi = 300; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; (okHi(m) ? lo = m : hi = m); } dHi = Math.max(lo, dLo + 0.5); }
    // Demand levels where profit is exactly zero (normal profit) and where P₀ = AVC₀ (the shut-down point), if they lie in the feasible range.
    const cross = f => (f(dLo) || !f(dHi)) ? null : bisect(f, dLo, dHi);   // f false at the bottom and true at the top
    const dN = cross(d => outcome(c, b, d).profit > 0), dS = cross(d => { const o = outcome(c, b, d); return o.P0 - o.AVC0 >= 0; });
    const d = Math.min(dHi, Math.max(dLo, dIn));   // the demand level is kept inside the range where MC = MR exists on the plot
    const o = outcome(c, b, d), eps = 1e-4 * Math.max(1, o.P0);
    const kind = Math.abs(o.P0 - o.AC0) < eps ? 'normal' : o.P0 > o.AC0 ? 'super' : 'sub';
    return { structure, c, b, d, dLo, dHi, dN, dS, ...o, kind, shut: o.P0 < o.AVC0 - 1e-7, F, natural: c.natural };
  }
  const fromState = st => solve(st.structure, st.qv, st.hmin, st.fcAmt, st.dem);

  /* ---------- Drawing (shared by both widgets) ---------- */
  // o.step: guided step (1–7), or undefined for the unguided widget, which draws everything. o.tr / o.cs: optional overlays.
  function paint(P, C, m, o = {}) {
    const guided = o.step != null, at = n => !guided || o.step >= n, { c, b, q0, P0, AC0, mr0 } = m, pc = m.structure === 'pc';
    const hasAVC = m.F > 0, normal = m.kind === 'normal';
    const part = name => { if (guided) P.part(name); };
    const showProfit = guided ? at(7) : o.profit;
    P.axes('Price / Costs / Revenue', 'Output');

    // Shaded areas first, so the curves sit on top. Their word labels sit outside the areas, to the right of q₀, joined to the area by a light grey line.
    part('profit');
    const tags = [];   // {y, text, color, tip, ax, ay}: label height, text, and the point inside the area the line points to
    if (showProfit && !normal) {
      const prof = m.kind === 'super', lo = Math.min(P0, AC0), hi = Math.max(P0, AC0), tip = prof ? 'profit.super' : 'profit.sub', box = [[0, lo], [q0, lo], [q0, hi], [0, hi]];
      P.area(box, COL.profit, { opacity: 0.4, hatch: 'cross', tip });
      P.path([...box, box[0]], { color: COL.profitDark, width: 1.5, tip });
      tags.push({ text: prof ? 'Supernormal Profit' : 'Subnormal Profit', color: COL.profitDark, tip, ax: q0 * 0.8, ay: (lo + hi) / 2 });
    }
    if (o.tr) {
      P.area([[0, 0], [q0, 0], [q0, P0], [0, P0]], COL.tr, { opacity: 0.16, hatch: 'vertical', tip: 'profit.tr' });
      tags.push({ text: 'TR', color: COL.tr, tip: 'profit.tr', ax: q0 * 0.9, ay: P0 - 3 });
    }
    if (o.tc) {
      P.area([[0, 0], [q0, 0], [q0, AC0], [0, AC0]], COL.tc, { opacity: 0.22, hatch: 'horizontal', tip: 'profit.tc' });
      tags.push({ text: 'TC', color: '#a86f00', tip: 'profit.tc', ax: q0 * 0.9, ay: AC0 - 3 });
    }
    if (o.cs && !pc) {
      const ar0 = m.d + b * PIV, pts = [[0, P0]];
      if (ar0 > YTOP) pts.push([0, YTOP], [(ar0 - YTOP) / b, YTOP]); else pts.push([0, ar0]);
      pts.push([q0, P0]);
      P.area(pts, COL.cs, { opacity: 0.25, hatch: 'diagonal', tip: 'profit.cs' });
      const x = q0 * 0.1;
      tags.push({ text: 'CS', color: COL.cs, tip: 'profit.cs', ax: x, ay: P0 + (Math.min(m.d + b * (PIV - x), YTOP) - P0) * 0.4 });
    }
    if (o.ps) {
      const pts = [];
      for (let i = 0; i <= 120; i++) { const q = q0 * i / 120, y = c.mc(q); if (y <= P0) pts.push([q, y]); }
      if (pts.length > 1) {
        P.area([[pts[0][0], P0], ...pts, [q0, P0]], COL.ps, { opacity: 0.3, hatch: 'diagonal', tip: 'profit.ps' });
        tags.push({ text: 'PS', color: COL.ps, tip: 'profit.ps', ax: q0 * 0.9, ay: (P0 + c.mc(q0 * 0.9)) / 2 });
      }
    }

    // Revenue curves.
    if (at(2)) {
      part('ar');
      if (pc) { P.line([0, P0], [XMAX, P0], { color: C.demand, tip: 'rev.arFlat' }); P.pointLabel([XMAX, P0], 'D=AR=MR', { color: C.demand, tip: 'rev.arFlat', prefer: 'ne' }); }
      else {
        const ar = trace(q => m.d + b * (PIV - q), 0, XMAX);
        P.path(ar, { color: C.demand, tip: 'rev.ar' });
        P.pointLabel(last(ar), 'D=AR', { color: C.demand, tip: 'rev.ar', prefer: 'e' });
        part('mr');
        const mr = trace(q => m.d + PIV * b - 2 * b * q, 0, XMAX);
        P.path(mr, { color: C.policy, tip: 'rev.mr' });
        if (mr.length) P.pointLabel(last(mr), 'MR', { color: C.policy, tip: 'rev.mr', prefer: 'e' });
      }
    }
    // Cost curves.
    if (at(3)) {
      part('ac');
      const ac = trace(c.ac, 0.5, XMAX);
      P.path(ac, { color: C.supply, tip: m.natural ? 'profit.acNatural' : 'cost.ac' });
      P.pointLabel(last(ac), hasAVC ? 'AC' : 'AC = AVC', { color: C.supply, tip: m.natural ? 'profit.acNatural' : 'cost.ac', prefer: 'e' });
      if (hasAVC) {
        part('avc');
        const avc = trace(c.avc, 0.5, XMAX);
        P.path(avc, { color: C.perceived, tip: 'cost.avc' });
        P.pointLabel(last(avc), 'AVC', { color: C.perceived, tip: 'cost.avc', prefer: 'e' });
      }
      part('mc');
      const mc = trace(c.mc, 0.5, XMAX);
      P.path(mc, { color: C.red, tip: 'profit.mc' });
      P.pointLabel(last(mc), 'MC', { color: C.red, tip: 'profit.mc', prefer: 'e' });
    }

    // q₀, with P₀, MC₀ and AC₀ on the vertical axis (equal values share one label) and dashed guides.
    const dash = { color: C.guide, width: 1.2, dash: '5 4' };
    const topOf = Math.max(at(4) ? mr0 : 0, at(5) ? P0 : 0, at(6) ? AC0 : 0);
    if (at(4)) {
      part('q0');
      P.line([q0, 0], [q0, topOf], dash);
      P.dot([q0, mr0], C.ink, 'profit.cross');
      P.qLabel(q0, 'q_0', { tip: 'profit.q0' });
    }
    const ent = [];
    if (at(5)) ent.push({ v: P0, n: 'P_0', part: 'p0', tip: pc ? 'profit.p0pc' : 'profit.p0' });
    if (at(4)) ent.push({ v: mr0, n: 'MC_0', part: 'q0', tip: 'profit.mc0' });
    if (at(6)) ent.push({ v: AC0, n: 'AC_0', part: 'ac0', tip: 'profit.ac0' });
    const groups = [];
    for (const e of ent) { const g = groups.find(x => Math.abs(x.v - e.v) < 0.8); g ? g.names.push(e.n) : groups.push({ v: e.v, names: [e.n], part: e.part, tip: e.tip }); }
    for (const g of groups) {
      part(g.part);
      P.line([0, g.v], [q0, g.v], dash);
      P.pLabel(g.v, g.names.join(' = '), { tip: g.tip });
    }
    if (at(5)) { part('p0'); P.dot([q0, P0], C.demand, pc ? 'profit.p0pc' : 'profit.p0'); }
    if (at(6)) { part('ac0'); P.dot([q0, AC0], C.supply, 'profit.ac0'); }
    if (showProfit && normal) {
      part('profit');
      P.pointLabel([q0, P0], 'Normal Profit', { color: C.ink, tip: 'profit.normal', prefer: 'ne' });
    }
    // Area labels: each goes outside the areas (right of q₀) at the nearest spot that touches no curve, dot or other label, joined to its area by a solid light grey line.
    part('profit');
    const segHitsRect = ([x1, y1, x2, y2], r) => {
      let t0 = 0, t1 = 1; const dx = x2 - x1, dy = y2 - y1;
      for (const [pp, qq] of [[-dx, x1 - r.x], [dx, r.x + r.w - x1], [-dy, y1 - r.y], [dy, r.y + r.h - y1]]) {
        if (Math.abs(pp) < 1e-9) { if (qq < 0) return false; continue; }
        const t = qq / pp; if (pp < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
      }
      return true;
    };
    for (const t of tags.sort((u, v) => v.ay - u.ay)) {
      const e = P.text([q0 + 5, t.ay], t.text, { anchor: 'start', color: t.color, tip: t.tip, size: '85%', dy: 4 }), idx = P.boxes.length - 1;
      const x0 = +e.getAttribute('x'), y0 = +e.getAttribute('y'), bb = e.getBBox(), ox = bb.x - x0, oy = bb.y - y0, pad = 3;
      const [gx, gy] = P.pt([q0 + 5, t.ay]), cands = [];
      for (let qx = q0 + 3; qx <= 118; qx += 2) for (let py = 3; py <= 117; py += 2) { const [cx, cy] = P.pt([qx, py]); cands.push([cx, cy, (cx - gx) ** 2 + (cy - gy) ** 2]); }
      cands.sort((u, v) => u[2] - v[2]);
      const others = P.boxes.filter((_, i) => i !== idx);
      let best = null;
      for (const [cx, cy] of cands) {
        const r = { x: cx + ox - pad, y: cy + oy - pad, w: bb.width + 2 * pad, h: bb.height + 2 * pad };
        if (r.x + r.w > 588) continue;
        if (P.segs.some(sg => sg.kind === 'curve' && segHitsRect(sg.seg, r))) continue;
        if (others.some(k => k.x < r.x + r.w && k.x + k.width > r.x && k.y < r.y + r.h && k.y + k.height > r.y)) continue;
        best = [cx, cy]; break;
      }
      const [cx, cy] = best || [x0, y0];
      e.setAttribute('x', cx); e.setAttribute('y', cy);
      P.boxes[idx] = { x: cx + ox, y: cy + oy, width: bb.width, height: bb.height };
      P.line([cx + ox - 2, cy + oy + bb.height / 2], P.pt([t.ax, t.ay]), { px: true, color: COL.lead, width: 1.2 });
    }
  }

  /* ---------- Summary table ---------- */
  const SR = m => m.kind !== 'sub' ? 'Continue Producing (TR ≥ TVC, since AR ≥ AVC)' : m.shut ? 'Shut Down to Prevent Further Losses (TR < TVC, since AR < AVC)' : 'Continue Producing to Minimise Losses (TR ≥ TVC, since AR ≥ AVC)';
  const LR = m => {
    if (m.kind === 'normal') return 'Stay in the Industry (TR = TC)';
    if (m.kind === 'sub') return 'Exit the Industry (TR < TC)';
    return ['pc', 'mc'].includes(m.structure)
      ? 'Stay in the Industry (TR > TC). New firms enter, so supernormal profit falls to normal profit in the long run'
      : 'Stay in the Industry (TR > TC). High barriers to entry let supernormal profit persist in the long run';
  };
  const PRICE_MC = {
    pc: 'P_0 = MC, no market power',
    mc: 'P_0 > MC, some market power',
    oli: 'P_0 > MC, so some to high market power, depending on barriers to entry and the degree of collusion',
    mono: 'P_0 >> MC, high market power',
  };
  function summaryRows(m, o = {}) {
    const pc = m.structure === 'pc', kind = m.kind;
    return [
      ['Market Structure', NAMES[m.structure]],
      ['Demand Curve (D = AR)', pc ? 'Horizontal: D = AR = MR = P_0' : 'Downward-sloping, with MR below AR'],
      ['Profit-Maximising Output', 'q_0, where MC = MR and MC cuts MR from below'],
      ['Price', pc ? 'P_0, the market price, which consumers pay for every unit (D = AR is horizontal at P_0)' : 'P_0, the price consumers are willing to pay for q_0 units (a point on the D = AR curve)'],
      ['Price vs MC', PRICE_MC[m.structure]],
      ['Average Cost at q_0', 'AC_0'],
      ['TR vs TC', kind === 'super' ? 'TR > TC' : kind === 'normal' ? 'TR = TC' : 'TR < TC'],
      ['Profit', kind === 'super' ? 'Supernormal profit, (P_0 − AC_0) × q_0' : kind === 'normal' ? 'Normal profit, zero economic profit' : 'Subnormal profit (loss), (AC_0 − P_0) × q_0'],
      ['Short-Run Decision', SR(m)],
      ['Long-Run Decision', LR(m)],
      m.natural && ['Cost Structure', 'Natural Monopoly: AC Falls over the Whole Range of Output Shown'],
      o.cs && ['Consumer Surplus', pc ? 'Not shown: a price taker faces horizontal demand, so there is no area between D and P_0' : 'Area under D and above P_0, up to q_0'],
      o.ps && ['Producer Surplus', 'Area above MC and below P_0, up to q_0'],
    ];
  }
  const describe = (m, rows) => `${NAMES[m.structure]}. ${rows.filter(Boolean).map(r => r.join(': ')).join('. ')}`;

  /* ---------- Unguided widget ---------- */
  const plot = { x: [0, XMAX], y: [0, XMAX], box: [90, 40, 490, 440] };
  const hasFixed = st => st.fcAmt > 0;
  const fit = st => { st.dem = fromState(st).d; };   // keep the demand level inside the range where MC = MR exists on the plot
  const fitSnap = st => { fit(st); const m = fromState(st); if (m.dN != null && Math.abs(m.d - m.dN) < 0.03 * (m.dHi - m.dLo)) st.dem = m.dN; };   // dragging Demand snaps onto normal profit
  const glossary = ['profitMaximisingOutput', 'marginalRevenue', 'averageRevenue', 'marginalCost', 'averageCost', 'averageVariableCost', 'totalRevenueExpenditure', 'totalCost',
    'supernormalProfit', 'normalProfit', 'subnormalProfit', 'shutDownCondition', 'naturalMonopoly', 'perfectCompetition', 'monopolisticCompetition', 'oligopoly', 'monopoly'];

  EW.register({
    id: 'profit-max', title: 'Profit Maximisation', plot,
    glossary: [...glossary, 'consumerSurplusFirm', 'producerSurplusFirm'],
    controls: [
      { type: 'radio', id: 'structure', label: 'Market structure', options: STRUCTURES, value: 'pc', onChange: fit },
      { type: 'slider', id: 'dem', label: 'Demand', min: 10, max: 112, step: 0.5, value: 50, ends: ['Lower', 'Higher'], onChange: fitSnap,
        hint: 'Demand stays where you set it when you change costs, unless that level is out of range for the new cost curves.' },
      { type: 'slider', id: 'qv', label: st => hasFixed(st) ? 'Output at minimum AVC' : 'Output at minimum AC', min: 30, max: 120, value: 60, ends: ['Lower', 'Higher'], onChange: fit,
        hint: 'At the highest setting the minimum point of AC lies at the edge of the diagram, which is the case of a natural monopoly.' },
      { type: 'slider', id: 'hmin', label: st => hasFixed(st) ? 'Cost at minimum AVC' : 'Cost at minimum AC', min: 15, max: 60, value: 40, ends: ['Lower', 'Higher'], onChange: fit },
      { type: 'slider', id: 'fcAmt', label: 'Size of fixed cost', min: 0, max: 2400, value: 0, step: 100, ends: ['None', 'Significant'], onChange: fit },
      { type: 'check', id: 'profit', label: 'Show Profits', value: true },
      { type: 'check', id: 'tr', label: 'Show Total Revenue', value: false },
      { type: 'check', id: 'tc', label: 'Show Total Costs', value: false },
      { type: 'check', id: 'cs', label: 'Show Consumer Surplus', value: false },
      { type: 'check', id: 'ps', label: 'Show Producer Surplus', value: false },
    ],
    draw(P, st, C) {
      const m = fromState(st);
      paint(P, C, m, { profit: st.profit, tr: st.tr, tc: st.tc, cs: st.cs, ps: st.ps });
      const rows = summaryRows(m, { cs: st.cs, ps: st.ps });
      return { result: EW.summary(rows), desc: describe(m, rows) };
    },
  });

  /* ---------- Guided widget ---------- */
  const CASES = [['super', 'Supernormal Profit'], ['normal', 'Normal Profit'], ['cont', 'Subnormal Profit: Continue Producing'], ['shut', 'Subnormal Profit: Shut Down']];
  const G = { Qv: 55, h: 40, F: 1200 };
  // Demand level for the chosen case, using the same model as the unguided widget (with a fixed cost, so AVC is a separate curve).
  function guidedModel(st) {
    const { dLo, dHi, dN, dS } = solve(st.structure, G.Qv, G.h, G.F, 50);
    let d;
    if (st.case === 'normal') d = dN;
    else if (st.case === 'super') d = dN + 0.45 * (dHi - dN);
    else if (st.case === 'cont') d = (dN + dS) / 2;
    else d = Math.max(dLo + 0.2 * (dS - dLo), dS - 0.4 * (dN - dS));
    return solve(st.structure, G.Qv, G.h, G.F, d);
  }
  const SUB = { super: 'supernormal profit', normal: 'normal profit', cont: 'subnormal profit (loss) with AR ≥ AVC', shut: 'subnormal profit (loss) with AR < AVC' };
  const stepTexts = [
    st => ['Draw the axes. Label the vertical axis “Price / Costs / Revenue” and the horizontal axis “Output”.',
      'Revenue, cost and price are all measured per unit on the vertical axis, and the firm’s own output (q) is on the horizontal axis.',
      'Writing “Quantity” or “Q” for a single firm’s output. Use lower-case q for a firm, because Q stands for the whole industry.'],
    st => [st.structure === 'pc'
      ? 'Draw a horizontal line at the market price, labelled D = AR = MR. The firm is a price taker.'
      : `Draw a downward-sloping demand curve, labelled D = AR${st.structure === 'mc' ? ' (gently sloping, highly price elastic)' : st.structure === 'oli' ? ' (steeper, less price elastic)' : ' (the steepest, since the firm is the only seller)'}. Then draw MR below it, starting at the same point on the vertical axis and falling twice as fast.`,
      st.structure === 'pc' ? 'A price taker sells every extra unit at the same price, so the extra revenue from one more unit equals the price: MR = AR.' : 'To sell more, the firm must lower its price on all units, so the extra revenue from one more unit is less than the price: MR < AR.',
      st.structure === 'pc' ? 'Drawing a downward-sloping demand curve for a price taker.' : 'Drawing MR on top of AR, or with the same slope as AR. MR must fall twice as fast.'],
    st => ['Draw the U-shaped AC and AVC curves, and the MC curve. MC falls at first, then rises, and cuts AVC and AC at their lowest points. AC is above AVC, and the gap between them is AFC.',
      'Diminishing marginal returns make MC rise. MC pulls average cost down when MC < average cost and pulls it up when MC > average cost, so it must cut the average curves at their minimum points.',
      'Drawing MC so that it does not cut AC at its minimum point.'],
    st => ['Mark the point where MC = MR, and where MC cuts MR from below. Draw a dashed line down to the horizontal axis and label the output q₀.'.replace('q₀', 'q<sub>0</sub>'),
      'Up to q₀, each extra unit adds more to revenue than to cost (MR > MC), so profit rises. Beyond q₀, each extra unit adds more to cost than to revenue (MC > MR), so profit falls. Profit is maximised at q₀.'.replace(/q₀/g, 'q<sub>0</sub>'),
      'Choosing a point where MC = MR on the falling part of MC. There, MC cuts MR from above, and producing more units still raises profit.'.replace(/q₀/g, 'q<sub>0</sub>')],
    st => ['From q₀, go up to the D = AR curve, then across to the vertical axis. Label this price P₀.'.replace('q₀', 'q<sub>0</sub>').replace('P₀', 'P<sub>0</sub>'),
      st.structure === 'pc' ? 'The price is read from D = AR. For a price taker this is the market price, which is the same for every unit.' : 'Price is what consumers are willing to pay for q₀ units, so it is read from the D = AR curve, not from the MR curve.'.replace('q₀', 'q<sub>0</sub>'),
      'Reading the price across from the point where MC = MR. That height is MR, not the price.'],
    st => ['From q₀, go up to the AC curve, then across to the vertical axis. Label this cost AC₀.'.replace('q₀', 'q<sub>0</sub>').replace('AC₀', 'AC<sub>0</sub>'),
      'AC₀ is the cost per unit when the firm produces q₀ units, so it is read from the AC curve.'.replace('q₀', 'q<sub>0</sub>').replace('AC₀', 'AC<sub>0</sub>'),
      'Reading the cost per unit from the MC curve instead of the AC curve.'],
    st => [{ super: 'Shade the rectangle between P₀ and AC₀, from 0 to q₀. This is supernormal profit, equal to (P₀ − AC₀) × q₀.', normal: 'P₀ and AC₀ are at the same height, so there is no profit rectangle to shade. Label the outcome normal profit.', cont: 'Shade the rectangle between AC₀ and P₀, from 0 to q₀. This is subnormal profit (a loss), equal to (AC₀ − P₀) × q₀.', shut: 'Shade the rectangle between AC₀ and P₀, from 0 to q₀. This is subnormal profit (a loss), equal to (AC₀ − P₀) × q₀.' }[st.case]
      .replace(/q₀/g, 'q<sub>0</sub>').replace(/P₀/g, 'P<sub>0</sub>').replace(/AC₀/g, 'AC<sub>0</sub>'),
      { super: 'P₀ > AC₀ means that revenue per unit is more than cost per unit, so TR > TC.', normal: 'P₀ = AC₀ means that TR = TC, so the firm earns just enough to stay in the industry.', cont: 'P₀ < AC₀ means that TR < TC. However, P₀ ≥ AVC₀, so TR ≥ TVC and the firm still covers its variable costs.', shut: 'P₀ < AC₀ means that TR < TC. Also, P₀ < AVC₀, so TR < TVC and the firm cannot even cover its variable costs.' }[st.case]
      .replace(/q₀/g, 'q<sub>0</sub>').replace(/P₀/g, 'P<sub>0</sub>').replace(/AC₀/g, 'AC<sub>0</sub>').replace(/AVC₀/g, 'AVC<sub>0</sub>'),
      'Shading the area under the price line (that is TR) or the whole area between MC and AR. Profit is the rectangle between P₀ and AC₀ only.'.replace(/P₀/g, 'P<sub>0</sub>').replace(/AC₀/g, 'AC<sub>0</sub>')],
  ];
  const STEP_TITLES = ['Draw the axes', 'Draw the revenue curves', 'Draw the cost curves', 'Find the profit-maximising output', 'Find the price', 'Find the average cost', 'Shade the profit or loss'];
  const FOCUS = [[], ['ar', 'mr'], ['mc', 'ac', 'avc'], ['mc', 'mr', 'ar', 'q0'], ['ar', 'q0', 'p0'], ['ac', 'q0', 'p0', 'ac0'], ['profit', 'ar', 'ac', 'q0', 'p0', 'ac0']];

  EW.register({
    id: 'profit-guided', title: 'Draw the Profit Diagram', guided: true, plot, glossary,
    controls: [
      { type: 'radio', id: 'structure', label: 'Market structure', options: STRUCTURES, value: 'pc', onChange: st => { st.step = 1; if (st.structure === 'mono' && st.case === 'shut') st.case = 'cont'; } },
      { type: 'select', id: 'case', label: 'Profit case', options: st => st.structure === 'mono' ? CASES.slice(0, 3) : CASES, value: 'super', onChange: st => { st.step = 1; },
        hintVisible: true, hint: st => st.structure === 'mono' ? 'The shut-down case is not shown for Monopoly: with demand this steep, price stays above AVC wherever MC = MR in this diagram.' : '' },
    ],
    steps: STEP_TITLES.map((title, i) => ({ title, text: st => { const [what, why, mistake] = stepTexts[i](st);
      return `<p><strong>What to draw:</strong> ${sub(what)}</p><p><strong>Why:</strong> ${sub(why)}</p><p class="think"><em><strong>Common mistake:</strong> ${sub(mistake)}</em></p>`; } })),
    draw(P, st, C) {
      const m = guidedModel(st), step = st.step;
      paint(P, C, m, { step });
      const out = { focus: FOCUS[step - 1], desc: `${NAMES[st.structure]}, ${SUB[st.case]}, step ${step}.` };
      if (step === 7) { const rows = summaryRows(m); out.result = EW.summary(rows); out.desc += ' ' + describe(m, rows); }
      return out;
    },
  });
  function sub(t) { return t.replace(/\b(q|P|AC|AVC)₀/g, '$1<sub>0</sub>'); }
})();
