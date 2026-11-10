/* Topic 1: Production possibility curve. Points and capacities are set with sliders (no dragging).
   PPC: Y = b·(1 − (X/a)^n)^(1/n) with n = 1 + shape/85 (n = 1 is a straight line; n = 2 is the default bowed curve).
   Default capacity a = b = 100 on 0–150 axes. */
(() => {
  const round = v => String(Math.round(v));
  const power = st => 1 + (st.shape / 100) / 0.85;
  const frontier = (st, x, a = 100, b = 100) => { const u = x / a, n = power(st); return u < 0 || u > 1 ? 0 : b * Math.pow(Math.max(0, 1 - Math.pow(u, n)), 1 / n); };
  const position = (st, p) => { const n = power(st); return Math.pow(Math.pow(p.x / 100, n) + Math.pow(p.y / 100, n), 1 / n); };
  const SNAP = 3.2;   // a point within this many units of the PPC sits on it (about 8 px, as in the original drag snapping)
  const onPPC = (st, p, a, b) => Math.abs(p.y - frontier(st, p.x, a, b)) <= 0.1 && p.x <= a + 0.01;
  function classify(st, p, a = 100, b = 100) {
    if (p.x > a + 0.01 || p.y > b + 0.01 || p.y > frontier(st, p.x, a, b) + 0.1) return 'outside';
    return onPPC(st, p, a, b) ? 'frontier' : 'inside';
  }
  // Free point (production points): snaps onto the PPC when close. Growth points are also kept on or inside it.
  function freePoint(st, x, y) { const f = frontier(st, x); return x <= 100 && Math.abs(y - f) < SNAP ? { x, y: f } : { x, y }; }
  function boundPoint(st, x, y) { x = Math.min(100, x); const f = frontier(st, x); y = Math.min(y, f); return { x, y: f - y < SNAP ? f : y }; }

  function transition(st, A, B) {
    if (Math.abs(B.x - A.x) < 0.05 && Math.abs(B.y - A.y) < 0.05) return { type: 'none', heading: 'No change in output' };
    if (classify(st, A) === 'frontier' && classify(st, B) === 'frontier') return { type: 'reallocation', heading: 'Pure reallocation' };
    const move = position(st, B) - position(st, A);
    if (move > 0.0005) return { type: 'positive', heading: 'Actual growth' };
    if (move < -0.0005) return { type: 'negative', heading: 'Negative actual growth' };
    return { type: 'mixed', heading: 'Reallocation' };
  }

  function draw(P, st, C) {
    const potential = st.mode === 'potential', a = potential ? st.capX : 100, b = potential ? st.capY : 100;
    const shifted = potential && (a !== 100 || b !== 100);
    // Sampled by angle (x = a·cos^(2/n), y = b·sin^(2/n)) so the curve stays smooth where it turns steep near the X-axis.
    const curvePts = (aa, bb) => Array.from({ length: 121 }, (_, i) => { const th = Math.PI / 2 * i / 120, n = power(st);
      return [aa * Math.pow(Math.cos(th), 2 / n), bb * Math.pow(Math.sin(th), 2 / n)]; });
    P.axes('Capital Goods', 'Consumer Goods');
    if (shifted) {
      P.path(curvePts(100, 100), { color: C.demand0, tip: ['ppc.curve', { label: 'PPC₀' }] });
      P.pointLabel([82, frontier(st, 82)], 'PPC_0', { color: C.demand0 });
    }
    P.path(curvePts(a, b), { color: C.demand, tip: ['ppc.curve', { label: shifted ? 'PPC₁' : 'PPC' }] });
    P.pointLabel([a * 0.82, frontier(st, a * 0.82, a, b)], shifted ? 'PPC_1' : 'PPC', { color: C.demand });
    P.qLabel(a, round(a), { color: C.demand, tip: 'ppc.capacityX' });
    P.pLabel(b, round(b), { color: C.demand, tip: 'ppc.capacityY' });

    const msg = { inside: ['Attainable · productively inefficient', 'More of at least one good is possible without sacrificing the other.'],
      frontier: ['Attainable · productively efficient', 'More of one good requires sacrificing the other.'],
      outside: ['Currently unattainable', 'Beyond available resources and the present state of technology.'] };
    const mark = (p, label, color, tip) => {
      P.guide(p.x, p.y);
      P.dot([p.x, p.y], color, tip);
      P.pointLabel([p.x, p.y], `${label} (${round(p.x)}, ${round(p.y)})`, { color, tip });
      P.qLabel(p.x, round(p.x), { color });
      P.pLabel(p.y, round(p.y), { color });
    };
    let rows;

    if (st.mode === 'points') {
      const p = freePoint(st, st.ax, st.ay), status = classify(st, p);
      mark(p, 'A', C.ink, ['ppc.point', { label: 'A', x: round(p.x), y: round(p.y) }]);
      rows = [['Position of Point A', status === 'frontier' ? 'On PPC' : status === 'inside' ? 'Inside PPC' : 'Outside PPC'],
        ['Attainability', `${status === 'outside' ? 'Unattainable' : 'Attainable'} combination of goods`],
        status !== 'outside' && ['Productive Efficiency', status === 'frontier' ? 'Productively Efficient' : 'Productively Inefficient'],
        ['Implication', msg[status][1]]];
    } else if (st.mode === 'actual') {
      const A = boundPoint(st, st.bax, st.bay), B = boundPoint(st, st.bbx, st.bby), ch = transition(st, A, B);
      if (ch.type === 'none') {
        mark(B, 'A = B', C.ink, ['ppc.point', { label: 'A = B', x: round(B.x), y: round(B.y) }]);
      } else {
        mark(A, 'A', C.grey, 'ppc.start');
        if (ch.type === 'reallocation') {
          const pts = Array.from({ length: 61 }, (_, i) => { const x = A.x + (B.x - A.x) * i / 60; return [x, frontier(st, x)]; });
          P.path(pts, { color: C.red, width: 2.4, arrow: true, tip: 'ppc.reallocation' });
        } else P.line([A.x, A.y], [B.x, B.y], { color: C.red, width: 1.6, arrow: true });
        mark(B, 'B', C.ink, ['ppc.point', { label: 'B', x: round(B.x), y: round(B.y) }]);
      }
      const sub = { none: 'A and B show the same output combination', positive: 'A → B moves closer to or onto the PPC', negative: 'A → B moves towards the origin', reallocation: 'Both points on the same PPC · productively efficient', mixed: 'Output mix changes without moving closer to the PPC' };
      rows = [['Change from A to B', EW.tc(ch.heading)],
        ['Description', sub[ch.type]],
        ['PPC', 'Since the quality and quantity of resources and level of technology is unchanged, the economy’s productive capacity remains the same. Hence, PPC remains the same.']];
    } else {
      if (shifted) for (const u of [0, 0.5, 1]) {
        const from = [100 * u, frontier(st, 100 * u)], to = [a * u, frontier(st, a * u, a, b)];
        if (Math.hypot(to[0] - from[0], to[1] - from[1]) > 1) P.line(from, to, { color: C.red, width: 1.6, arrow: true });
      }
      const dx = a - 100, dy = b - 100, kind = !dx && !dy ? 'none' : dx >= 0 && dy >= 0 ? 'expansion' : dx <= 0 && dy <= 0 ? 'contraction' : 'mixed';
      rows = [['Productive Capacity', { expansion: 'Increases', contraction: 'Decreases', mixed: 'Mixed', none: 'Unchanged' }[kind]],
        ['Potential Growth', { expansion: 'Potential Growth', contraction: 'Negative Potential Growth', mixed: 'Mixed Capacity Changes', none: 'Zero' }[kind]],
        ['PPC', { expansion: 'Shifts Outwards', contraction: 'Shifts Inwards', mixed: 'One capacity increases while the other decreases', none: 'Unchanged' }[kind]]];
    }
    return {
      result: EW.summary(rows),
      desc: rows.filter(Boolean).map(r => r.join(': ')).join('. '),
    };
  }

  const isMode = m => st => st.mode === m;
  const yMax = key => st => Math.ceil(frontier(st, Math.min(100, st[key])));
  EW.register({
    id: 'ppc', title: 'Production Possibility Curve (PPC)', plot: { x: [0, 150], y: [0, 150], box: [90, 40, 490, 440] },
    glossary: ['scarcity', 'choice', 'resourceAllocation', 'productionPossibilityCurve', 'attainableOutputCombinations', 'unattainableOutputCombinations',
      'opportunityCost', 'rateOfOpportunityCostIncurred', 'constantOpportunityCost', 'lawOfIncreasingOpportunityCost', 'productiveCapacity', 'productiveEfficiency',
      'allocativeEfficiency', 'unemployment', 'underemployment', 'inefficiency', 'actualEconomicGrowth', 'negativeActualGrowth', 'potentialEconomicGrowth',
      'pureReallocationAlongThePpc', 'capitalGoodsProducerGoods', 'consumerGoods'],
    controls: [
      { type: 'radio', id: 'mode', label: 'Explore', options: [['points', 'Production points'], ['actual', 'Actual growth and reallocation'], ['potential', 'Potential growth']] },
      { type: 'slider', id: 'shape', label: 'PPC shape', min: 0, max: 85, value: 85, ends: ['Constant opportunity cost', 'Increasing opportunity cost'] },
      { type: 'slider', id: 'ax', label: 'Point A: consumer goods', min: 0, max: 140, value: 35, showIf: isMode('points') },
      { type: 'slider', id: 'ay', label: 'Point A: capital goods', min: 0, max: 140, value: 35, showIf: isMode('points'), hint: 'A point close to the PPC snaps onto it.' },
      { type: 'slider', id: 'bax', label: 'A (initial): consumer goods', min: 0, max: 100, value: 25, showIf: isMode('actual') },
      { type: 'slider', id: 'bay', label: 'A (initial): capital goods', min: 0, max: yMax('bax'), value: 25, showIf: isMode('actual') },
      { type: 'slider', id: 'bbx', label: 'B (final): consumer goods', min: 0, max: 100, value: 40, showIf: isMode('actual') },
      { type: 'slider', id: 'bby', label: 'B (final): capital goods', min: 0, max: yMax('bbx'), value: 40, showIf: isMode('actual'), hint: 'A and B stay on or inside the PPC. The change is always A → B.' },
      { type: 'slider', id: 'capX', label: 'Capacity for consumer goods', min: 40, max: 140, value: 100, showIf: isMode('potential') },
      { type: 'slider', id: 'capY', label: 'Capacity for capital goods', min: 40, max: 140, value: 100, showIf: isMode('potential'), hint: 'Move both sliders together to expand or contract the whole PPC.' },
    ],
    draw,
  });
})();
