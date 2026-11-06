/* Topic 5: Externalities and government measures. MPB: P = 120 − Q. MPC: P = Q. Axes 0–120.
   Negative externalities in production: MSC = MPC + MEC. Positive externalities in consumption: MSB = MPB + MEB. */
(() => {
  const EPS = 1e-9, near = (a, b) => Math.abs(a - b) < 1e-7;
  const plot = { x: [0, 120], y: [0, 120], box: [90, 40, 490, 440] };
  const yTitle = 'Price / costs / benefits';
  const baseGlossary = ['externality', 'marketFailure', 'allocativeEfficiency', 'internalisationOfExternalities', 'marginalPrivateBenefit', 'marginalPrivateCost'];

  // Shared drawing pieces --------------------------------------------------------------------------------------
  const curve = (P, a, b, color, label, tip, prefer = b[1] < a[1] ? 'ne' : 'e') => { const c = P.clip(a, b); if (!c) return; P.line(a, b, { color, tip }); P.pointLabel(c[1], label, { color, prefer }); };
  const vArrow = (P, q, from, to, color, label, tip) => {   // two-headed vertical arrow showing MEC, MEB, tax or subsidy size
    if (Math.abs(P.Y(from) - P.Y(to)) < 6) return;
    P.line([q, from], [q, to], { color, width: 2, both: true, tip });
    P.pointLabel([q, (from + to) / 2], label, { color, prefer: 'e', gap: [6, 14], tip });
  };
  const point = (P, q, p, label, color, tip) => { P.dot([q, p], color, tip); if (label) P.pointLabel([q, p], label, { color, tip }); };
  const guideTo = (P, q, p) => P.guide(q, p);
  const dwlTriangle = (P, C, a, b, c, tip) => {
    P.area([a, b, c], C.red, { tip, opacity: 0.25 });
    const area = Math.abs((P.X(b[0]) - P.X(a[0])) * (P.Y(c[1]) - P.Y(a[1])) - (P.X(c[0]) - P.X(a[0])) * (P.Y(b[1]) - P.Y(a[1]))) / 2;
    if (area > 700) P.pointLabel([(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3], 'DWL', { color: C.red, gap: [0, 8, 16], size: '78%', tip });
  };
  const gapSpan = (P, C, q1, q2, text, tip) => { if (Math.abs(q1 - q2) < 0.5) return; P.span([Math.min(q1, q2), 4], [Math.max(q1, q2), 4], text, { tip, labelTip: tip }); };
  const triArea = (q, qs, gap) => 0.5 * Math.abs(q - qs) * gap;   // DWL triangle with base |q − qs| and height = MSC−MSB gap at q

  // Summary rows shared with the guided externalities widget (shown at its last step).
  EW.tables.ne = zero => [['Marginal External Cost (MEC)', zero ? 'None (MEC = 0)' : 'Present (MEC > 0)'], ['MSC vs MPC', zero ? 'MSC = MPC' : 'MSC > MPC'],
    ['Free-Market Output', 'Q_e where MPB = MPC'], ['Socially Optimal Output', 'Q_s where MSB = MSC'],
    ['Compare Q_e vs Q_s', zero ? 'None' : 'Over-consumption / Over-production'],
    ['Deadweight Loss', zero ? 'None' : 'Present. For units between Q_s and Q_e, MSC > MSB leading to a loss in social welfare']];
  EW.tables.pe = zero => [['Marginal External Benefit (MEB)', zero ? 'None (MEB = 0)' : 'Present (MEB > 0)'], ['MSB vs MPB', zero ? 'MSB = MPB' : 'MSB > MPB'],
    ['Free-Market Output', 'Q_e where MPB = MPC'], ['Socially Optimal Output', 'Q_s where MSB = MSC'],
    ['Compare Q_e vs Q_s', zero ? 'None' : 'Under-consumption / Under-production'],
    ['Deadweight Loss', zero ? 'None' : 'Present. For units between Q_e and Q_s, MSB > MSC leading to a loss in social welfare']];

  /* ---------- Negative externalities ---------- */
  EW.register({
    id: 'negative-externalities', title: 'Negative Externalities', plot,
    glossary: [...baseGlossary, 'marginalExternalCost', 'marginalSocialCost', 'marginalSocialBenefit', 'deadweightLoss', 'freeMarketEquilibrium', 'sociallyOptimalOutput', 'overproduction'],
    about: '<p>This diagram illustrates negative externalities in production: MSC = MPC + MEC. External benefits are assumed absent (MEB = 0), so MSB = MPB.</p>',
    controls: [
      { type: 'slider', id: 'mec', label: 'MEC', min: 0, max: 80, value: 25, ends: ['None', 'High'] },
      { type: 'check', id: 'mecArrow', label: 'MEC label', value: true },
      { type: 'check', id: 'dwl', label: 'Deadweight loss', value: true },
      { type: 'check', id: 'gap', label: 'Over-consumption / over-production', value: true },
    ],
    draw(P, st, C) {
      const mec = st.mec, zero = mec === 0, qe = 60, pe = 60, qs = (120 - mec) / 2, ps = 120 - qs;
      P.axes(yTitle, 'Quantity');
      if (!zero && st.dwl) dwlTriangle(P, C, [qs, ps], [qe, pe], [qe, pe + mec], ['mf.dwl', { over: true, word: 'over-production' }]);
      curve(P, [0, 120], [120, 0], C.demand, 'MPB = MSB');
      curve(P, [0, 0], [120, 120], C.supply, zero ? 'MPC = MSC' : 'MPC');
      if (!zero) curve(P, [0, mec], [120, 120 + mec], C.social, 'MSC = MPC + MEC');
      guideTo(P, qe, pe);
      point(P, qe, pe, zero ? 'E_e = E_s' : 'E_e', C.ink, 'mf.qe');
      P.pLabel(pe, 'P_e', { tip: 'mf.qe' }); P.qLabel(qe, 'Q_e', { tip: 'mf.qe' });
      if (!zero) {
        guideTo(P, qs, ps);
        point(P, qs, ps, 'E_s', C.social, 'mf.qs');
        point(P, qe, pe + mec, 'A', C.social);
        P.pLabel(ps, 'P_s', { color: C.social, tip: 'mf.qs' }); P.qLabel(qs, 'Q_s', { color: C.social, tip: 'mf.qs' });
        if (st.mecArrow) vArrow(P, 22, 22, 22 + mec, C.red, 'MEC', 'mf.mec');
        if (st.gap) gapSpan(P, C, qs, qe, 'Over-consumption / Over-production', 'mf.gapOver');
      }
      const rows = EW.tables.ne(zero);
      return { result: EW.summary(rows), desc: rows.map(r => r.join(': ')).join('. ') };
    },
  });

  /* ---------- Positive externalities ---------- */
  EW.register({
    id: 'positive-externalities', title: 'Positive Externalities', plot,
    glossary: [...baseGlossary, 'marginalExternalBenefit', 'marginalSocialCost', 'marginalSocialBenefit', 'deadweightLoss', 'freeMarketEquilibrium', 'sociallyOptimalOutput', 'underconsumption'],
    about: '<p>This diagram illustrates positive externalities in consumption: MSB = MPB + MEB. External costs are assumed absent (MEC = 0), so MSC = MPC.</p>',
    controls: [
      { type: 'slider', id: 'meb', label: 'MEB', min: 0, max: 80, value: 15, ends: ['None', 'High'] },
      { type: 'check', id: 'mebArrow', label: 'MEB label', value: true },
      { type: 'check', id: 'dwl', label: 'Deadweight loss', value: true },
      { type: 'check', id: 'gap', label: 'Under-consumption / under-production', value: true },
    ],
    draw(P, st, C) {
      const meb = st.meb, zero = meb === 0, qe = 60, pe = 60, qs = 60 + meb / 2, ps = qs;
      P.axes(yTitle, 'Quantity');
      if (!zero && st.dwl && meb >= 1) dwlTriangle(P, C, [qs, ps], [qe, pe], [qe, pe + meb], ['mf.dwl', { over: false, word: 'under-consumption' }]);
      curve(P, [0, 0], [120, 120], C.supply, 'MPC = MSC');
      curve(P, [0, 120], [120, 0], C.demand, zero ? 'MPB = MSB' : 'MPB');
      if (!zero) curve(P, [0, 120 + meb], [120, meb], C.social, 'MSB = MPB + MEB');
      guideTo(P, qe, pe);
      point(P, qe, pe, zero ? 'E_e = E_s' : 'E_e', C.ink, 'mf.qe');
      P.pLabel(pe, 'P_e', { tip: 'mf.qe' }); P.qLabel(qe, 'Q_e', { tip: 'mf.qe' });
      if (!zero) {
        guideTo(P, qs, ps);
        point(P, qs, ps, 'E_s', C.social, 'mf.qs');
        point(P, qe, pe + meb, 'A', C.social);
        P.pLabel(ps, 'P_s', { color: C.social, tip: 'mf.qs' }); P.qLabel(qs, 'Q_s', { color: C.social, tip: 'mf.qs' });
        if (st.mebArrow) vArrow(P, 70, 50, 50 + meb, C.demand, 'MEB', 'mf.meb');
        if (st.gap) gapSpan(P, C, qe, qs, 'Under-consumption / Under-production', 'mf.gapUnder');
      }
      const rows = EW.tables.pe(zero);
      return { result: EW.summary(rows), desc: rows.map(r => r.join(': ')).join('. ') };
    },
  });

  /* ---------- Government measures: negative externalities (MEC fixed at 40) ---------- */
  const MEC = 40;
  const nePolicies = { none: 'No policy', tax: 'Tax', quota: 'Quota on output', ban: 'Ban (no output)', qpoll: 'Quota on pollutant', rd: 'Research and development', edu: 'Education and campaigns' };
  const neTerm = { tax: 'tax', quota: 'quotaOnOutput', ban: 'banAQuotaOfZero', qpoll: 'quotaOnPollutant', rd: 'researchAndDevelopmentForCleanerTechnology', edu: 'educationNegativeExternalities' };

  function drawBan(P, st, C) {
    const mec = st.banMec, qe = 60, qs = Math.max(0, (120 - mec) / 2), W = q => (120 - mec) * q - q * q;
    const freeDwl = Math.max(0, W(qs) - W(qe)), banDwl = Math.max(0, W(qs)), gain = freeDwl - banDwl;
    P.axes(yTitle, 'Quantity');
    if (st.banCompare && freeDwl > EPS) P.area([[qs, 120 - qs], [qe, 60], [qe, 60 + mec], [qs, qs + mec]], C.quantityEffect, { hatch: 'vertical', tip: 'mf.banFreeDwl' });
    if (st.dwl && banDwl > EPS) P.area([[0, 120], [0, mec], [qs, 120 - qs]], C.red, { opacity: 0.25, tip: 'mf.banDwl' });
    curve(P, [0, 120], [120, 0], C.demand, 'MPB = MSB');
    curve(P, [0, 0], [120, 120], C.supply, mec === 0 ? 'MPC = MSC' : 'MPC');
    if (mec > EPS) curve(P, [0, mec], [120, 120 + mec], C.social, 'MSC = MPC + MEC');
    P.line([0, 0], [0, 110], { color: C.policy, width: 3, dash: '6 4' });
    P.pointLabel([0, 104], 'Ban: no output', { color: C.policy, prefer: 'e', size: '78%' });
    P.line([qe, 0], [qe, 60], { color: C.guide, width: 1.2, dash: '5 4' });
    point(P, qe, 60, mec === 0 ? 'E_e = E_s' : 'E_e', C.ink, 'mf.banEe');
    P.qLabel(qe, mec === 0 ? 'Q_e = Q_s' : 'Q_e', { tip: 'mf.banFreeDwl' });
    if (qs > EPS && !near(qs, qe)) {
      P.line([qs, 0], [qs, 120 - qs], { color: C.guide, width: 1.2, dash: '5 4' });
      point(P, qs, 120 - qs, 'E_s', C.social, 'mf.banEs');
      P.qLabel(qs, 'Q_s', { color: C.social, tip: 'mf.banDwl' });
    }
    P.qLabel(0, qs <= EPS ? 'Q_b = Q_s' : 'Q_b', { color: C.policy, tip: qs <= EPS ? 'mf.banZeroOptimal' : 'mf.banOutput' });
    if (st.gap && qs > EPS) gapSpan(P, C, 0, qs, 'Under-production with ban', 'mf.banOutput');
    if (st.mecArrow && mec > EPS) vArrow(P, 15, 15, 15 + mec, C.red, 'MEC', 'mf.mec');
    let heading, reason;
    if (banDwl < EPS) { heading = 'Eliminated'; reason = 'MSC is at least MSB for every positive unit. The socially optimal quantity is zero.'; }
    else if (Math.abs(gain) < EPS) { heading = 'Equal to the Free Market'; reason = 'The ban prevents harmful units, but the forgone benefits of the beneficial units are equally large.'; }
    else if (gain > 0) { heading = 'Reduced but Not Eliminated'; reason = 'Avoiding the harmful units produces a net welfare gain, although some beneficial units are also prevented.'; }
    else { heading = 'Increased'; reason = 'The forgone benefits of preventing beneficial units exceed the welfare gain from avoiding harmful units.'; }
    return {
      result: EW.summary([['Policy', 'Ban (No Output)'], ['Deadweight Loss', heading], ['Reason', reason]]),
      notes: `<details><summary>When does a ban improve welfare?</summary><p>A ban <strong>reduces DWL</strong> when the welfare gain from preventing harmful output outweighs the net benefits forgone by preventing beneficial output.</p><p>It <strong>eliminates DWL</strong> only when no positive output is socially desirable: MSC is at least MSB for every feasible positive quantity. Reducing DWL does not necessarily mean eliminating it.</p><p>Compare the shaded areas at the <strong>same MEC</strong>. The model assumes a fully enforced ban, no illegal market or substitutes, and no enforcement costs. The private curves and graph scales stay fixed as MEC varies.</p></details>`,
      desc: `${heading} ${reason}`,
    };
  }

  EW.register({
    id: 'ne-measures', title: 'Government Measures: Negative Externalities', plot,
    glossary: st => [...(neTerm[st.policy] ? [neTerm[st.policy]] : []), 'marginalPrivateBenefit', 'marginalPrivateCost', 'marginalSocialCost', 'marginalSocialBenefit', 'marginalExternalCost',
      'externality', 'marketFailure', 'allocativeEfficiency', 'internalisationOfExternalities', 'sociallyOptimalOutput', 'deadweightLoss',
      ...Object.values(neTerm).filter(t => t !== neTerm[st.policy])],
    about: '<p>This diagram illustrates negative externalities in production: MSC = MPC + MEC. External benefits are assumed absent (MEB = 0), so MSB = MPB.</p>',
    controls: [
      { type: 'radio', id: 'policy', label: 'Government policy', options: Object.entries(nePolicies), onChange: st => { Object.assign(st, { tax: 0, quota: 75, qpoll: 0, rd: 0, edu: 0, banMec: MEC }); } },
      { type: 'slider', id: 'tax', label: 'Tax per unit', min: 0, max: 60, ends: ['None', 'High'], showIf: st => st.policy === 'tax' },
      { type: 'slider', id: 'quota', label: 'Maximum quantity', min: 20, max: 75, step: 0.5, value: 75, ends: ['Lower', 'Higher'], showIf: st => st.policy === 'quota' },
      { type: 'slider', id: 'qpoll', label: 'Pollutant quota', min: 0, max: 40, ends: ['No limit', 'Zero pollutant'], showIf: st => st.policy === 'qpoll' },
      { type: 'slider', id: 'rd', label: 'MEC reduction (R&D)', min: 0, max: 40, ends: ['Low', 'High'], showIf: st => st.policy === 'rd' },
      { type: 'slider', id: 'edu', label: 'Campaign effectiveness', min: 0, max: 60, ends: ['Zero', 'Highly effective'], showIf: st => st.policy === 'edu' },
      { type: 'slider', id: 'banMec', label: 'Marginal external cost (MEC)', min: 0, max: 120, value: MEC, ends: ['None', 'Very high'], showIf: st => st.policy === 'ban',
        hint: 'A ban fixes output at no output. Vary MEC to compare a ban with the unregulated market at the same MEC.' },
      { type: 'check', id: 'banCompare', label: 'Show free-market DWL for comparison', value: true, showIf: st => st.policy === 'ban' },
      { type: 'check', id: 'dwl', label: 'Deadweight loss', value: true },
      { type: 'check', id: 'gap', label: 'Over-production', value: true },
      { type: 'check', id: 'mecArrow', label: 'MEC label', value: true },
      { type: 'check', id: 'taxRev', label: 'Tax revenue', showIf: st => st.policy === 'tax' },
      { type: 'check', id: 'taxSize', label: 'Tax per unit', value: true, showIf: st => st.policy === 'tax' },
    ],
    draw(P, st, C) {
      const k = st.policy;
      if (k === 'ban') return drawBan(P, st, C);
      const qe = 60, pe = 60, qs = (120 - MEC) / 2, ps = 120 - qs;
      let q = qe, pc = pe, pp = pe, mecEff = MEC;
      if (k === 'tax') { q = Math.max(0, (120 - st.tax) / 2); pc = 120 - q; pp = q; }
      if (k === 'quota') { q = Math.min(qe, st.quota); pc = 120 - q; pp = q; }
      if (k === 'qpoll') mecEff = Math.max(0, MEC - st.qpoll);
      if (k === 'rd') mecEff = Math.max(0, MEC - st.rd);
      if (k === 'edu') { q = Math.max(0, (120 - st.edu) / 2); pc = pp = q; }   // MPB* = MPB − campaign effect; the new equilibrium is on MPC
      const qsA = (120 - mecEff) / 2, psA = 120 - qsA;

      P.axes(yTitle, 'Quantity');
      if (k === 'tax' && st.tax > 0 && q > 0 && st.taxRev) P.area([[0, pc], [q, pc], [q, pp], [0, pp]], C.policy, { hatch: 'cross', tip: 'mf.taxRevenue' });
      if (st.dwl && !near(q, qsA)) dwlTriangle(P, C, [qsA, psA], [q, mecEff + q], [q, 120 - q], ['mf.dwl', { over: q > qsA, word: q > qsA ? 'over-production' : 'under-production' }]);
      curve(P, [0, 120], [120, 0], C.demand, 'MPB = MSB');
      curve(P, [0, 0], [120, 120], C.supply, 'MPC');
      curve(P, [0, MEC], [120, 120 + MEC], C.social, 'MSC = MPC + MEC');
      if (k === 'tax' && st.tax > 0) curve(P, [0, st.tax], [120, 120 + st.tax], C.policy, 'MPC + tax');
      if ((k === 'qpoll' || k === 'rd') && mecEff !== MEC) curve(P, [0, mecEff], [120, 120 + mecEff], C.policy, k === 'qpoll' ? 'MSC* (pollutant quota)' : 'MSC* (R&D)');
      if (k === 'edu' && st.edu > 0) curve(P, [0, 120 - st.edu], [120, -st.edu], C.policy, 'MPB* (education)');
      if (k === 'quota') { P.line([st.quota, 0], [st.quota, 118], { color: C.policy, width: 2.5 }); P.pointLabel([st.quota, 114], 'Quota', { color: C.policy, prefer: 'e', size: '78%' }); }

      // Points and axis values. Equal values are merged into one label by the engine ("Q_s = Q_t").
      guideTo(P, qe, pe); point(P, qe, pe, 'E_e', C.ink, 'mf.ee');
      P.pLabel(pe, 'P_e'); P.qLabel(qe, 'Q_e', { tip: 'mf.qe' });
      guideTo(P, qs, ps); point(P, qs, ps, 'E_s', C.social, 'mf.es');
      P.pLabel(ps, 'P_s', { color: C.social }); P.qLabel(qs, 'Q_s', { color: C.social, tip: 'mf.qs' });
      if (mecEff !== MEC) { guideTo(P, qsA, psA); point(P, qsA, psA, "E_s'", C.policy, 'mf.qsPrime'); P.pLabel(psA, "P_s'", { color: C.policy }); P.qLabel(qsA, "Q_s'", { color: C.policy, tip: 'mf.qsPrime' }); }
      if (k !== 'none' && !near(q, qe)) {
        P.line([q, 0], [q, Math.max(pc, mecEff + q)], { color: C.guide, width: 1.2, dash: '5 4' });
        point(P, q, pc, null, C.policy, 'mf.policyQ');
        if (k === 'tax' && st.tax > 0) point(P, q, pp, null, C.supply);
        if (k !== 'quota' || st.quota <= qe) P.qLabel(q, { tax: 'Q_t', quota: 'Q_quota', edu: "Q_e'" }[k] || 'Q_e', { color: C.policy, tip: 'mf.policyQ' });
        if (k === 'quota') { P.guide(q, pc, { toX: false }); P.pLabel(pc, 'P_quota', { color: C.policy }); }
      }
      if (st.mecArrow && mecEff > 1) vArrow(P, 22, 22, 22 + mecEff, C.red, 'MEC', 'mf.mec');
      if (k === 'tax' && st.tax > 0 && st.taxSize) vArrow(P, q, q, q + st.tax, C.policy, 'Tax', 'mf.taxSize');
      if (st.gap && Math.abs(P.X(q) - P.X(qsA)) > 8) gapSpan(P, C, q, qsA, q < qsA ? 'Under-production' : 'Over-production', q < qsA ? 'mf.gapUnder' : 'mf.gapOver');

      const dwl0 = triArea(qe, qs, MEC), dwl1 = triArea(q, qsA, Math.abs(mecEff + q - (120 - q)));
      const dwlText = dwl1 < 1e-6 ? 'Eliminated' : near(dwl1, dwl0) ? 'Unchanged' : dwl1 < dwl0 ? 'Reduced' : 'Increased';
      const qLabel = { tax: 'Q_t', quota: 'Q_quota', edu: 'Q_e′' }[k];
      const benefits = { none: '', tax: st.tax > 0 ? 'MPC Increases' : 'No Change', quota: 'No Change in MPB, MPC or MEC (output is capped)',
        qpoll: st.qpoll > 0 ? 'MEC Decreases' : 'No Change', rd: st.rd > 0 ? 'MEC Decreases' : 'No Change', edu: st.edu > 0 ? 'MPB Decreases' : 'No Change' }[k];
      const impact = !near(q, qe) ? `Q_e ${EW.chg(q - qe, 'Q_e', qLabel)}` : mecEff !== MEC ? `Q_s ${EW.chg(qsA - qs, 'Q_s', 'Q_s′')}` : 'No Change';
      const rows = [['Policy', EW.tc(nePolicies[k])], ['Impact on Benefits/Costs', benefits], ['Impact on Q_e/Q_s', impact], ['Deadweight Loss', `${dwlText} compared with no policy`]];
      const summary = rows.map(r => r.join(': ')).join('. ');
      return { result: k === 'none' ? '' : EW.summary(rows), desc: summary };
    },
  });

  /* ---------- Government measures: positive externalities (MEB fixed at 40) ---------- */
  const MEB = 40;
  const pePolicies = { none: 'None (uncorrected market failure)', indirect: 'Indirect subsidy (to producers)', direct: 'Direct subsidy (to consumers)', free: 'Free provision (no consumer price)', joint: 'Joint provision (public and private supply)', education: 'Education and campaigns' };
  const peTerm = { indirect: 'indirectSubsidy', direct: 'directSubsidy', free: 'freeProvision', joint: 'jointProvision', education: 'educationPositiveExternalities' };

  function drawFree(P, st, C) {
    const qf = 120, qe = 60, meb = st.freeMeb, qs = (120 + meb) / 2, pp = qf, social = q => 120 - q + meb;
    const freeLoss = (qf - qs) ** 2, marketLoss = (qe - qs) ** 2, e = 1e-7;
    const area = (q, color, tip, hatch) => P.area([[qs, qs], [q, q], [q, social(q)]], color, { tip, hatch, opacity: 0.25 });
    P.axes(yTitle, 'Quantity');
    if (st.subsidyCost) P.area([[0, 0], [qf, 0], [qf, pp], [0, pp]], C.policy, { hatch: 'cross', opacity: 0.12, tip: 'mf.freeSubsidy' });
    if (st.freeCompare && marketLoss > e) area(qe, C.quantityEffect, 'mf.freeMarketDwl', 'vertical');
    if (st.dwl && freeLoss > e) area(qf, C.red, ['mf.freeDwl', { over: qf > qs }], 'diagonal');
    P.line([0, 120], [qf, 0], { color: C.demand }); P.pointLabel([105, 15], 'MPB', { color: C.demand, prefer: 'ne' });
    curve(P, [0, 0], [190, 190], C.supply, 'MPC = MSC');
    curve(P, [0, social(0)], [Math.min(190, 120 + meb), social(Math.min(190, 120 + meb))], C.social, meb > e ? 'MSB' : 'MPB = MSB');
    curve(P, [qf, 0], [190, 190 - qf], C.policy, 'MPC*');
    P.line([qf, 0], [qf, pp], { color: C.guide, width: 1.2, dash: '5 4' });
    P.guide(qe, qe); point(P, qe, qe, meb < e ? 'E_e = E_s' : 'E_e', C.ink, 'mf.freeEe'); P.pLabel(qe, 'P_e'); P.qLabel(qe, 'Q_e');
    if (meb > e) { P.line([qs, 0], [qs, qs], { color: C.guide, width: 1.2, dash: '5 4' }); point(P, qs, qs, 'E_s', C.social, 'mf.freeEs'); P.qLabel(qs, 'Q_s', { color: C.social }); }
    point(P, qf, 0, 'E_f', C.policy, 'mf.freeEf'); P.qLabel(qf, 'Q_f', { color: C.policy });
    P.guide(qf, pp, { toX: false }); P.pLabel(pp, 'P_p', { color: C.policy });
    if (st.mebArrow && meb > e) { const q = Math.max(20, meb - 20); vArrow(P, q, 120 - q, social(q), C.demand, 'MEB', 'mf.meb'); }
    if (st.gap && Math.abs(qf - qs) > e) gapSpan(P, C, qf, qs, qf > qs ? 'Over-consumption / Over-production' : 'Under-consumption / Under-production', qf > qs ? 'mf.gapOver' : 'mf.gapUnder');
    const state = Math.abs(qf - qs) < e ? 'Socially optimal provision' : qf > qs ? 'Excessive provision' : 'Insufficient provision';
    const comparison = freeLoss < e ? 'Free provision <strong>eliminates DWL</strong>.' : Math.abs(freeLoss - marketLoss) < e ? 'Free provision and the free market have <strong>the same DWL</strong>.' : freeLoss < marketLoss ? 'Free provision <strong>reduces DWL</strong>, but some loss remains.' : 'Free provision <strong>increases DWL</strong> relative to the free market.';
    const why = qf > qs + e ? 'MEB is too low to justify all the units consumed for free.' : qs > qf + e ? 'MEB is high enough that some socially beneficial units remain unprovided.' : 'MEB exactly offsets the gap between social cost and private benefit at the free-provision output.';
    return {
      result: EW.summary([['Provision', EW.tc(state)], ['Reason', why],
        ['Deadweight Loss', freeLoss < e ? 'Eliminated' : Math.abs(freeLoss - marketLoss) < e ? 'The Same as the Free Market' : freeLoss < marketLoss ? 'Reduced, but Some Loss Remains' : 'Increased Relative to the Free Market']]),
      notes: '<p><strong>Mechanism:</strong> the government reimburses producers through a full subsidy. MPC* is MPC less the subsidy; the consumer price is zero. Producers receive P<sub>p</sub>. The subsidy is fixed as MEB changes.</p><p class="model-note"><strong>Assumptions:</strong> linear private curves, constant MEB, no rationing, and no administration or tax-financing distortion costs. Negative private benefits beyond the demand intercept represent unwillingness to consume additional units without compensation. The full-subsidy outcome is socially optimal only at the matching MEB level.</p>',
      desc: `${state}. ${why} ${comparison.replace(/<[^>]*>/g, '')}`,
    };
  }

  EW.register({
    id: 'pe-measures', title: 'Government Measures: Positive Externalities', plot,
    glossary: st => [...(peTerm[st.policy] ? [peTerm[st.policy]] : []), 'marginalPrivateBenefit', 'marginalPrivateCost', 'marginalSocialCost', 'marginalSocialBenefit', 'marginalExternalBenefit',
      'externality', 'marketFailure', 'allocativeEfficiency', 'internalisationOfExternalities', 'deadweightLoss', 'freeMarketEquilibrium', 'sociallyOptimalOutput',
      'directGovernmentProvision', 'legislationCompulsoryConsumption', ...Object.values(peTerm).filter(t => t !== peTerm[st.policy])],
    glossaryNotes: {
      indirectSubsidy: 'Here the subsidy is paid to producers when producing the good, which lowers their marginal private cost of production.',
      directSubsidy: 'Here the payment is linked to purchasing the good. It raises the effective willingness to pay received by producers by the subsidy amount; it does not itself change the underlying benefit from consumption.',
    },
    about: '<p>This diagram illustrates positive externalities in consumption: MSB = MPB + MEB. External costs are assumed absent (MEC = 0), so MSC = MPC.</p>',
    controls: [
      { type: 'radio', id: 'policy', label: 'Government policy', options: Object.entries(pePolicies), onChange: st => { st.level = 0; st.subsidyCost = false; st.freeMeb = 60; } },
      { type: 'slider', id: 'level', label: 'Intervention level', min: 0, max: 60, ends: ['None', 'High'], showIf: st => !['none', 'free'].includes(st.policy),
        format: (v, st) => ({ indirect: 'subsidy per unit', direct: 'subsidy per unit', joint: 'government output (Q<sub>g</sub>)', education: 'campaign effectiveness' })[st.policy] || '' },
      { type: 'slider', id: 'freeMeb', label: 'MEB', min: 0, max: 120, value: 60, ends: ['None', 'High'], showIf: st => st.policy === 'free' },
      { type: 'check', id: 'freeCompare', label: 'Compare free-market DWL', value: true, showIf: st => st.policy === 'free' },
      { type: 'check', id: 'dwl', label: 'Deadweight loss', value: true, showIf: st => st.policy !== 'joint' },
      { type: 'check', id: 'gap', label: 'Under/over-consumption', value: true },
      { type: 'check', id: 'mebArrow', label: 'MEB label', value: true },
      { type: 'check', id: 'subsidyCost', label: 'Total cost of subsidy', showIf: st => ['indirect', 'direct', 'free'].includes(st.policy) },
    ],
    draw(P, st, C) {
      const k = st.policy;
      if (k === 'free') return drawFree(P, st, C);
      const v = k === 'none' ? 0 : st.level, qe = 60, pe = 60, qs = (120 + MEB) / 2, ps = qs;
      let q = qe;
      if (k === 'indirect' || k === 'direct' || k === 'education') q = 60 + v / 2;
      if (k === 'joint') q = 60 + v / 2;
      P.axes(yTitle, 'Quantity');
      if ((k === 'indirect' || k === 'direct') && st.subsidyCost && v > 0) P.area([[0, 120 - q], [q, 120 - q], [q, q], [0, q]], C.policy, { hatch: 'cross', tip: 'mf.subsidyCost' });
      if (k !== 'joint' && st.dwl && Math.abs(q - qs) > 0.1) dwlTriangle(P, C, [qs, ps], [q, q], [q, 120 + MEB - q], ['mf.dwl', { over: q > qs, word: q > qs ? 'over-consumption' : 'under-consumption' }]);
      curve(P, [0, 0], [120, 120], C.supply, 'MPC = MSC');
      curve(P, [0, 120], [120, 0], C.demand, 'MPB');
      const msbLabel = k === 'direct' && near(v, MEB) ? 'MSB = MPB + subsidy' : k === 'education' && near(v, MEB) ? 'MSB = MPB*' : 'MSB = MPB + MEB';
      curve(P, [0, 120 + MEB], [120, MEB], C.social, msbLabel);
      if (k === 'indirect' && v > 0) {
        curve(P, [0, -v], [120, 120 - v], C.policy, 'MPC − subsidy');
        const qa = Math.max(35, v + 10); P.line([qa, qa], [qa, qa - v], { color: C.policy, width: 1.6, arrow: true }); P.pointLabel([qa, qa - v / 2], 'Subsidy', { color: C.policy, prefer: 'e', size: '78%' });
      }
      if ((k === 'direct' || k === 'education') && v > 0 && !near(v, MEB)) curve(P, [0, 120 + v], [120, v], C.policy, k === 'direct' ? 'MPB + subsidy' : 'MPB* (education)');
      if (k === 'direct' && v > 0) { P.line([35, 85], [35, 85 + v], { color: C.policy, width: 1.6, arrow: true }); P.pointLabel([35, 85 + v / 2], 'Subsidy', { color: C.policy, prefer: 'w', size: '78%' }); }

      guideTo(P, qe, pe); point(P, qe, pe, 'E_e', C.ink, 'mf.qe');
      P.pLabel(pe, 'P_e'); P.qLabel(qe, 'Q_e', { tip: 'mf.qe' });
      guideTo(P, qs, ps); point(P, qs, ps, 'E_s', C.social, k === 'joint' ? 'mf.qsJoint' : 'mf.qs');
      P.pLabel(ps, 'P_s', { color: C.social }); P.qLabel(qs, 'Q_s', { color: C.social, tip: k === 'joint' ? 'mf.qsJoint' : 'mf.qs' });
      if (k !== 'joint') point(P, qe, pe + MEB, 'A', C.social);
      if (st.mebArrow) vArrow(P, qe - 4, 120 - (qe - 4), 120 - (qe - 4) + MEB, C.demand, 'MEB', 'mf.meb');   // between MPB and MSB, just left of Q_e
      let notes = '';
      if (v > 0 && k !== 'joint') {
        const pPol = k === 'indirect' ? q - v : k === 'direct' || k === 'education' ? 120 + v - q : q;
        P.line([q, 0], [q, Math.max(pPol, q)], { color: C.guide, width: 1.2, dash: '5 4' });
        point(P, q, pPol, null, C.policy, 'mf.policyQ');
        P.qLabel(q, k === 'education' ? 'Q_edu' : 'Q_sub', { color: C.policy, tip: 'mf.policyQ' });
      }
      if (k === 'joint') {
        const qp = q - v, price = 120 - q;
        P.line([qp, 0], [qp, price], { color: C.guide, width: 1.2, dash: '5 4' });
        P.dot([qp, price], C.supply);
        P.qLabel(qp, 'Q_private', { color: C.supply });
        P.guide(q, price, { toX: false }); P.pLabel(price, 'P_joint', { color: C.policy });
        if (v > 0) { P.line([q, 0], [q, price], { color: C.guide, width: 1.2, dash: '5 4' }); point(P, q, price, null, C.policy); P.qLabel(q, 'Q_total', { color: C.policy }); }
        notes = `<h2>Public output and the change in market output are different.</h2><p>${v > 0 ? 'Government provision <strong>increases total supply</strong>. Private output <strong>falls</strong>, while total output <strong>rises</strong>. Some government output replaces private output, so the increase in total output is smaller than government output.' : 'With <strong>no government provision</strong>, private output and total output remain at the original market outcome.'}</p><p><strong>Total output</strong> combines government and private output.</p><p class="model-note"><strong>Scope:</strong> fixed government output, sold at the market price, is added horizontally to private supply. Q<sub>s</sub> marks the <em>original</em> social optimum. Government production costs are unspecified, so this branch does not determine a new social optimum or DWL.</p>`;
      }
      if (k !== 'joint' && st.gap && Math.abs(q - qs) > 0.1) gapSpan(P, C, q, qs, q < qs ? 'Under-consumption' : 'Over-consumption', q < qs ? 'mf.gapUnder' : 'mf.gapOver');
      const dwl0 = triArea(qe, qs, MEB), dwl1 = k === 'joint' ? null : triArea(q, qs, Math.abs(120 + MEB - q - q));
      let rows;
      if (k === 'joint') rows = [['Policy', 'Joint Provision (Public and Private Supply)'], ['Total Output (Q)', `${EW.chg(q - qe, 'Q_e', 'Q_total')} compared with the free market`]];
      else {
        const dwlText = dwl1 < 1e-6 ? 'Eliminated' : near(dwl1, dwl0) ? 'Unchanged' : dwl1 < dwl0 ? 'Reduced' : 'Increased';
        const benefits = { indirect: v > 0 ? 'MPC Decreases' : 'No Change', direct: v > 0 ? 'MPB Increases' : 'No Change', education: v > 0 ? 'MPB Increases' : 'No Change' }[k];
        const qLabel = k === 'education' ? 'Q_edu' : 'Q_sub';
        rows = [['Policy', EW.tc(pePolicies[k].replace(/ \(.*\)$/, ''))], ['Impact on Benefits/Costs', benefits],
          ['Impact on Q_e/Q_s', !near(q, qe) ? `Q_e ${EW.chg(q - qe, 'Q_e', qLabel)}` : 'No Change'], ['Deadweight Loss', `${dwlText} compared with no policy`]];
      }
      return { result: k === 'none' ? '' : EW.summary(rows), notes, desc: rows.map(r => r.join(': ')).join('. ') };
    },
  });
})();
