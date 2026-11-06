/* Topic 5: Imperfect information (independent and policy widgets) and the two guided market-failure walkthroughs.
   Actual MPB: P = 100 − Q (= MSB). Actual MPC: P = Q (= MSC). Social optimum E_s at (50, 50). Axes 0–120. */
(() => {
  const near = (a, b) => Math.abs(a - b) < 1e-7;
  const plot = { x: [0, 120], y: [0, 120], box: [90, 40, 490, 440] };
  const yTitle = 'Price / costs / benefits';

  // A perceived curve is a parallel shift of the actual curve, at most 100 units long (as long as the actual curves).
  function shifted(cost, shift) {
    const a = cost ? shift : 100 + shift, b = cost ? 1 : -1, pts = [];
    for (const q of [0, 120]) { const p = a + b * q; if (p >= 0 && p <= 120) pts.push([q, p]); }
    for (const p of [0, 120]) { const q = (p - a) / b; if (q >= 0 && q <= 120) pts.push([q, p]); }
    const u = pts.sort((m, n) => m[0] - n[0])[0], v = pts[pts.length - 1];
    if (v[0] - u[0] > 100) { v[0] = u[0] + 100; v[1] = a + b * v[0]; }
    return [u, v];
  }
  // Curve with its label at the far end; labels of downward-sloping curves go above the end so they stay off the quantity axis.
  const line = (P, ends, color, label, tip) => { P.line(ends[0], ends[1], { color, tip }); P.pointLabel(ends[1], label, { color, prefer: ends[1][1] < ends[0][1] ? 'ne' : 'e' }); };
  const point = (P, q, p, label, color, tip) => { P.guide(q, p); P.dot([q, p], color, tip); P.pointLabel([q, p], label, { color, tip }); };
  const dwl = (P, C, q, tip) => {
    P.area([[50, 50], [q, q], [q, 100 - q]], C.red, { opacity: 0.25, tip });
    if (Math.abs(q - 50) > 9) P.pointLabel([(50 + 2 * q) / 3, 50], 'DWL', { color: C.red, gap: [0, 8], size: '78%', tip });
  };
  const gap = (P, q1, q2, text, tip) => { if (Math.abs(q1 - q2) > 0.5) P.span([Math.min(q1, q2), 4], [Math.max(q1, q2), 4], text, { tip, labelTip: tip }); };
  const actualLabels = (cost, zero) => ({
    mpc: cost ? `MPC_{${zero ? 'actual = perceived' : 'actual'}} = MSC` : 'MPC = MSC',
    mpb: !cost ? `MPB_{${zero ? 'actual = perceived' : 'actual'}} = MSB` : 'MPB = MSB',
  });
  const notes = {
    marginalPrivateCost: 'In this widget, MPC represents the consumer-side private costs relevant to the decision, including perceived harms.',
    marginalSocialBenefit: 'With no external benefits in this model, MSB equals actual MPB.',
    marginalSocialCost: 'With no external costs in this model, MSC equals actual MPC.',
  };
  const infoGlossary = ['imperfectInformation', 'actualAndPerceivedValues', 'marketEquilibriumImperfectInformation', 'marginalPrivateBenefit', 'marginalPrivateCost',
    'marginalSocialBenefit', 'marginalSocialCost', 'sociallyEfficientOutput', 'overconsumptionAndUnderconsumption', 'deadweightLoss'];

  // Summary rows for the imperfect information table (also shown at the last step of the guided walkthrough).
  const infoRows = (title, zero, cost, under, over) => [['Information Failure', title],
    ['Free-Market Output', zero ? 'Q_e where MPB = MPC' : cost ? 'Q_e where MPB_actual = MPC_perceived' : 'Q_e where MPB_perceived = MPC_actual'],
    ['Socially Optimal Output', 'Q_s where MSB = MSC'],
    ['Compare Q_e vs Q_s', zero ? 'None' : over ? 'Overconsumption' : 'Underconsumption'],
    ['Deadweight Loss', zero ? 'None' : over ? 'Present. For units between Q_s and Q_e, MSC > MSB leading to a loss in social welfare' : 'Present. For units between Q_e and Q_s, MSB > MSC leading to a loss in social welfare']];

  /* ---------- Imperfect information: two types ---------- */
  EW.register({
    id: 'imperfect-information', title: 'Imperfect Information', plot, glossary: infoGlossary,
    glossaryNotes: { marginalSocialBenefit: notes.marginalSocialBenefit, marginalSocialCost: notes.marginalSocialCost },
    about: '<p>No externalities, market power or other distortions. Only one private curve is mis-estimated at a time. The information error is a constant vertical gap, so curves shift in parallel. Curves are straight lines with equal axis scales. Output is traded at the perceived market equilibrium.</p>',
    controls: [
      { type: 'radio', id: 'type', label: 'Imperfect information about', options: [['mpc', 'MPC'], ['mpb', 'MPB']] },
      { type: 'slider', id: 'mag', label: 'Size of mis-estimation', min: -80, max: 80, ticks: [[-80, 'Underestimate'], [0, 'None'], [80, 'Overestimate']] },
      { type: 'check', id: 'dwl', label: 'Deadweight loss', value: true },
      { type: 'check', id: 'gap', label: 'Over-/underconsumption', value: true },
      { type: 'check', id: 'divergence', label: 'Mis-estimation gap', value: true },
    ],
    draw(P, st, C) {
      const cost = st.type === 'mpc', shift = st.mag, under = shift < 0, mag = Math.abs(shift), zero = mag === 0;
      const q = 50 + (cost ? -shift : shift) / 2, p = cost ? 100 - q : q, over = q > 50;
      const title = zero ? 'No mis-estimation' : `${under ? 'Underestimating' : 'Overestimating'} ${cost ? 'MPC' : 'MPB'}`;
      P.axes(yTitle, 'Quantity');
      if (st.dwl && !zero) dwl(P, C, q, 'ii.dwl');
      const L = actualLabels(cost, zero);
      line(P, [[0, 0], [100, 100]], C.supply, L.mpc, 'ii.actualMpc');
      line(P, [[0, 100], [100, 0]], C.demand, L.mpb, 'ii.actualMpb');
      if (!zero) line(P, shifted(cost, shift), C.perceived, `${cost ? 'MPC' : 'MPB'}_{perceived}`, ['ii.perceived', { cost, under }]);
      if (st.divergence && !zero) {
        const gq = under ? (cost ? mag + 10 : (100 - mag) / 2) : 25, gp = cost ? gq : 100 - gq;
        P.line([gq, gp], [gq, gp + shift], { color: C.perceived, width: 1.5, both: true });
      }
      if (zero) { point(P, 50, 50, 'E_e = E_s', C.ink, 'ii.merged'); P.pLabel(50, 'P_e = P_s'); P.qLabel(50, 'Q_e = Q_s', { tip: 'ii.qMerged' }); }
      else {
        point(P, 50, 50, 'E_s', C.ink, 'ii.efficient'); P.pLabel(50, 'P_s'); P.qLabel(50, 'Q_s', { tip: 'ii.qs' });
        point(P, q, p, 'E_e', C.perceived, 'ii.market'); P.pLabel(p, 'P_e', { color: C.perceived }); P.qLabel(q, 'Q_e', { color: C.perceived, tip: 'ii.qe' });
        if (st.gap) gap(P, 50, q, over ? 'Overconsumption' : 'Underconsumption');
      }
      const kind = cost ? 'costs' : 'benefits';
      const rows = infoRows(title, zero, cost, under, over);
      const explanation = zero ? '<p>With <strong>no mis-estimation</strong>, perceived values equal actual values. Consumption occurs where <strong>MSB = MSC</strong>. There is no deadweight loss.</p>'
        : `<p>Decision-makers <strong>${under ? 'underestimate' : 'overestimate'} private ${kind}</strong>, so perceived ${cost ? 'MPC' : 'MPB'} lies ${under ? 'below' : 'above'} its actual curve.</p><p>The market chooses E<sub>e</sub>, where <strong>perceived MPB = perceived MPC</strong>. Market output is ${over ? 'greater' : 'lower'} than the socially efficient output at E<sub>s</sub>, resulting in <strong>${over ? 'overconsumption' : 'underconsumption'}</strong>.</p><p>${over ? 'For the excess units, actual MSC exceeds actual MSB.' : 'For the missing units, actual MSB exceeds actual MSC, so potential net benefits are forgone.'} The area between actual MSB and MSC over these units is the <strong>deadweight loss</strong>.</p>`;
      return {
        result: EW.summary(rows),
        notes: `<h2>How imperfect information causes market failure</h2>${explanation}`,
        desc: `${title}. ${zero ? 'No information error; market and efficient outcomes coincide.' : (over ? 'Overconsumption' : 'Underconsumption') + ' relative to socially efficient output.'}`,
      };
    },
  });

  /* ---------- Government measures: imperfect information ---------- */
  const cases = { 'under-mpc': 'Underestimating MPC', 'over-mpc': 'Overestimating MPC', 'under-mpb': 'Underestimating MPB', 'over-mpb': 'Overestimating MPB' };
  const policyNames = { education: 'Education and campaigns', information: 'Providing accurate information (legislation)', compulsory: 'Compulsory consumption (underconsumption only)', fiscal: 'Taxes and subsidies' };
  const allowsCompulsory = c => c === 'over-mpc' || c === 'under-mpb';
  function policyModel(type, policy, correction, fiscal) {
    const cost = type.endsWith('mpc'), under = type.startsWith('under'), initialShift = under ? -40 : 40;
    const qe = 50 + (cost ? -initialShift : initialShift) / 2, pe = cost ? 100 - qe : qe;
    const compulsory = policy === 'compulsory', information = policy === 'education' || policy === 'information';
    const shift = information ? initialShift * (1 - correction / 100) : policy === 'fiscal' ? initialShift + (cost ? fiscal : -fiscal) : initialShift;
    const q = compulsory ? 50 : 50 + (cost ? -shift : shift) / 2, p = cost ? 100 - q : q;
    return { cost, under, initialShift, shift, qe, pe, q, p, compulsory, information, fiscal, correction, changed: !near(q, qe), efficient: near(q, 50),
      transfer: policy === 'fiscal' ? Math.abs(fiscal) * q : 0, dwl: (q - 50) ** 2, initialDwl: (qe - 50) ** 2, over: q > 50 };
  }

  EW.register({
    id: 'imperfect-information-measures', title: 'Government Measures: Imperfect Information', plot,
    glossary: [...infoGlossary, 'educationImperfectInformation', 'accurateInformationThroughLegislation', 'compulsoryConsumption', 'taxesAndSubsidies', 'taxRevenueAndSubsidyExpenditure'],
    glossaryNotes: notes,
    about: '<p>No externalities, market power or other distortions. Only one private curve is mis-estimated at a time, with the same initial error size in each case. MPC is interpreted as a consumer-side private cost. Information policies correct perceptions; fiscal policies alter incentives without correcting beliefs. Tax revenue and subsidy expenditure are transfers; implementation costs and financing distortions are excluded. The information error is a constant vertical gap, so curves shift in parallel. Curves are straight lines with equal axis scales. Output is traded at the perceived market equilibrium.</p>',
    controls: [
      { type: 'radio', id: 'case', label: 'Case', options: Object.entries(cases), onChange: st => { if (st.policy === 'compulsory' && !allowsCompulsory(st.case)) st.policy = 'education'; } },
      { type: 'radio', id: 'policy', label: 'Policy', options: Object.entries(policyNames), onChange: st => { if (st.policy === 'compulsory' && !allowsCompulsory(st.case)) st.policy = 'education'; },
        hint: st => allowsCompulsory(st.case) ? '' : 'Compulsory consumption applies only to underconsumption cases (overestimating MPC or underestimating MPB).' },
      { type: 'slider', id: 'correction', label: 'Extent of correction', min: 0, max: 100, ends: ['None', 'Full'], showIf: st => st.policy === 'education' || st.policy === 'information' },
      { type: 'slider', id: 'fiscal', label: 'Tax or subsidy', min: -60, max: 60, ticks: [[-60, 'Subsidy'], [0, 'None'], [60, 'Tax']], showIf: st => st.policy === 'fiscal' },
      { type: 'check', id: 'dwl', label: 'Deadweight loss', value: true },
      { type: 'check', id: 'gap', label: 'Over-/underconsumption', value: true },
      { type: 'check', id: 'fiscalArea', label: 'Tax revenue / subsidy expenditure', showIf: st => st.policy === 'fiscal' },
    ],
    draw(P, st, C) {
      const m = policyModel(st.case, st.policy, st.correction, st.fiscal), own = m.cost ? 'MPC' : 'MPB';
      P.axes(yTitle, 'Quantity');
      if (st.policy === 'fiscal' && st.fiscalArea && m.transfer > 1e-7) {
        const original = m.cost ? m.q + m.initialShift : 100 - m.q + m.initialShift, adjusted = m.cost ? m.q + m.shift : 100 - m.q + m.shift;
        P.area([[0, original], [m.q, original], [m.q, adjusted], [0, adjusted]], C.policy, { hatch: 'cross', tip: ['ii.fiscalArea', { tax: m.fiscal > 0 }] });
      }
      if (st.dwl) {
        if (m.compulsory) P.path([[50, 50], [m.qe, m.qe], [m.qe, 100 - m.qe], [50, 50]], { color: C.red, width: 1.2, dash: '4 4', tip: 'ii.dwlEliminated' });
        else if (!m.efficient) dwl(P, C, m.q, 'ii.dwlRemaining');
      }
      const L = actualLabels(m.cost, false);
      const tag = st.policy === 'fiscal' ? (m.fiscal > 0 ? (m.cost ? ' + tax' : ' − tax') : (m.cost ? ' − subsidy' : ' + subsidy')) : '';
      const adjusted = m.changed && !m.compulsory, onActual = adjusted && near(m.shift, 0);   // full correction: the adjusted curve lies on the actual one
      const ownKey = m.cost ? 'mpc' : 'mpb';
      if (onActual) L[ownKey] = `${own}*_{perceived}${tag} = ${L[ownKey]}`;
      line(P, [[0, 0], [100, 100]], onActual && m.cost ? C.policy : C.supply, L.mpc);
      line(P, [[0, 100], [100, 0]], onActual && !m.cost ? C.policy : C.demand, L.mpb);
      line(P, shifted(m.cost, m.initialShift), C.perceived, `${own}_{perceived}`);
      if (adjusted && !onActual) line(P, shifted(m.cost, m.shift), C.policy, `${own}*_{perceived}${tag}`);
      // Points (equal points are merged by the engine's labels).
      const pts = [[m.qe, m.pe, 'e', C.perceived, 'ii.pointE'], [50, 50, 's', C.ink, 'ii.pointS']];
      if (m.changed && !m.compulsory) pts.push([m.q, m.p, '1', C.policy, 'ii.point1']);
      const merged = [];
      for (const pt of pts) { const same = merged.find(x => near(x[0], pt[0]) && near(x[1], pt[1])); same ? same[2] += ' = ' + pt[2] : merged.push([...pt]); }
      for (const [q, p, s, color, tip] of merged) {
        point(P, q, p, `E_{${s}}`, color, tip);
        for (const part of s.split(' = ')) { P.pLabel(p, `P_${part}`, { color }); P.qLabel(q, `Q_${part}`, { color, tip: { e: 'ii.qInitial', s: 'ii.qs', 1: 'ii.q1' }[part] }); }
      }
      if (m.compulsory) {
        P.line([50, 0], [50, 112], { color: C.policy, width: 1.5 });
        P.pointLabel([50, 112], 'Compulsory consumption level', { color: C.policy, prefer: 'e', size: '78%' });
        P.qChange(m.qe, 50, { color: C.policy, label: 'Compulsory consumption' });   // below the quantity axis, clear of the Q_s line
      } else if (st.gap && !m.efficient) gap(P, 50, m.q, m.over ? 'Overconsumption' : 'Underconsumption');

      const outcome = m.efficient ? 'socially efficient consumption' : m.over ? 'overconsumption' : 'underconsumption';
      const comparison = m.dwl < m.initialDwl - 1e-7 ? 'reduced' : m.dwl > m.initialDwl + 1e-7 ? 'increased' : 'unchanged';
      const pname = st.policy === 'fiscal' ? (m.fiscal === 0 ? 'No tax or subsidy' : m.fiscal > 0 ? 'Tax' : 'Subsidy') : policyNames[st.policy];
      const T = EW.tc, own2 = m.cost ? 'MPC' : 'MPB';
      const benefits = m.compulsory ? 'Not Applicable (perceptions and curves are unchanged)'
        : m.information ? (m.correction === 0 ? 'No Change' : `Perceived ${own2} ${m.initialShift < 0 ? 'Increases' : 'Decreases'}, moving ${m.correction === 100 ? 'to' : 'closer to'} actual ${own2}`)
        : m.fiscal === 0 ? 'No Change' : m.fiscal > 0 ? (m.cost ? 'MPC Increases' : 'MPB Decreases') : (m.cost ? 'MPC Decreases' : 'MPB Increases');
      const rows = [['Initial Case', `${cases[st.case]} → ${m.qe > 50 ? 'Overconsumption' : 'Underconsumption'}`], ['Policy', T(pname)],
        ['Impact on Benefits/Costs', benefits],
        ['Impact on Q_e/Q_s', `${T(outcome)}${m.compulsory ? ' — required at Q_s' : m.changed ? ' — Q_1 compared with Q_s' : ' — original market outcome'}`],
        ['Deadweight Loss', m.efficient ? 'Eliminated' : `${T(comparison)} relative to no intervention`],
        ['Perceptions', m.information ? (m.correction === 100 ? 'Fully Corrected' : m.correction === 0 ? 'Unchanged' : 'Partially Corrected') : 'Unchanged']];
      let explanation;
      if (m.information) explanation = `<p>${st.policy === 'education' ? 'Education and campaigns improve consumers’ understanding.' : 'Legislation requires accurate disclosure, labels or warnings; the slider represents how far consumers incorporate this information.'} Perceived ${own} moves towards actual ${own}.</p><p>The initial perceived curve and E<sub>e</sub> remain as references. As the error is corrected, consumption approaches Q<sub>s</sub> and <strong>DWL decreases</strong>. Full correction makes perceived and actual values coincide.</p>`;
      else if (m.compulsory) explanation = '<p><strong>Compulsory consumption</strong> requires the socially efficient quantity Q<sub>s</sub>. The arrow starts at voluntary consumption Q<sub>e</sub> and ends at Q<sub>s</sub>.</p><p>Perceptions remain unchanged, so the original perceived curves and E<sub>e</sub> remain. The outline shows the <strong>DWL eliminated</strong>. Q<sub>s</sub> is a required quantity, not a new voluntary market equilibrium. Full compliance is assumed.</p>';
      else explanation = `<p>A <strong>tax discourages consumption</strong>; a <strong>subsidy encourages consumption</strong>. In this ${own} case, the policy ${m.cost ? 'adds to or subtracts from perceived private cost' : 'subtracts from or adds to perceived private benefit'}.</p><p>The original perceived curve stays fixed. The effective private curve (violet) includes the tax or subsidy; <strong>beliefs and actual MSB/MSC remain unchanged</strong>. The corrective intervention is a <strong>${m.qe > 50 ? 'tax' : 'subsidy'}</strong>. Too much correction can move consumption past Q<sub>s</sub>, creating DWL on the other side; the wrong intervention makes the initial failure worse.</p><p>Tax revenue and subsidy expenditure are optional transfer areas, hidden by default. They are not included in the DWL calculation.</p>`;
      return {
        result: EW.summary(rows),
        notes: `<h2>How the policy works</h2>${explanation}`,
        desc: `${cases[st.case]}. ${pname}. Consumption: ${outcome}.`,
      };
    },
  });

  /* ---------- Guided walkthroughs (six steps each) ---------- */
  const stepTitles = (first) => [first, 'Explain the diagram', 'Explain market equilibrium', 'Explain socially optimal output', 'Compare Q<sub>e</sub> and Q<sub>s</sub>', 'Explain deadweight loss'];
  const fixCase = t => t.replace(/<sub>PERCEIVED<\/sub>/g, '<sub>perceived</sub>').replace(/<sub>ACTUAL<\/sub>/g, '<sub>actual</sub>');
  const guidedSteps = (titles, texts) => titles.map((title, i) => ({ title: title.replace(/<[^>]*>/g, ''), text: st => `<p>${fixCase(texts[st.mode][i])}</p>` }));

  const extTexts = { negative: [
    'There are <strong>negative externalities in consumption</strong> in the market for cigarettes. This is because in the consumption of cigarettes, the secondhand smoke that is produced causes lung damage to <strong>passive smokers</strong> who are the third parties. These <strong>passive smokers</strong> <strong>incur medical costs</strong> which are <strong>not compensated</strong> by the smokers.</p><p class="think"><em>The third party and the external cost or benefit must be clearly identified.</em>',
    'The negative externalities (MEC) cause <strong>MSC to diverge from MPC</strong> in the figure as MSC = MPC + MEC. We assume that there are no positive externalities in the cigarette market, i.e., MEB = 0. Thus, MSB = MPB.',
    'The <strong>market equilibrium quantity will be at Qe where MPB = MPC</strong>. This is because self-interested consumers and producers will only consider their <strong>private benefits and costs</strong> in their consumption and production decisions.',
    'However, the <strong>socially optimal output where social welfare is maximised is at Qs where MSB = MSC</strong>. This is because if MSB &gt; MSC, social welfare can be increased by consuming (producing) more, while if MSB &lt; MSC, social welfare can be increased by consuming (producing) less.',
    'Since <strong>Qe exceeds Qs</strong>, there is <strong>overconsumption of cigarettes</strong>. We say “over<u>consumption</u>” here because the negative externality arises from consumption.',
    'For the quantity between <strong>Qs and Qe</strong>, <strong>MSC is greater than MSB</strong>. This causes a <strong>deadweight loss</strong> of the shaded area as social welfare is not maximised. Hence, the market fails due to <strong>allocative inefficiency</strong>.',
  ], positive: [
    'There are <strong>positive externalities in consumption</strong> in the market for vaccinations. This is because when one person is vaccinated, he also benefits the <strong>entire community that he lives in</strong> by <strong>preventing the spread of contagious diseases</strong>. Since the other members of the community do not pay the vaccination costs, there is an <strong>external benefit</strong> for them.</p><p class="think"><em>The third party and the external cost or benefit must be clearly identified.</em>',
    'The positive externalities (MEB) cause <strong>MSB to diverge from MPB</strong> in the figure as MSB = MPB + MEB. We assume that there are no negative externalities in the vaccination market, i.e., MEC = 0. Thus, MSC = MPC.',
    'The <strong>market equilibrium quantity will be at Qe where MPB = MPC</strong>. This is because self-interested consumers and producers will only consider their <strong>private benefits and costs</strong> in their consumption and production decisions.',
    'However, the <strong>socially optimal output where social welfare is maximised is at Qs where MSB = MSC</strong>. This is because if MSB &gt; MSC, social welfare can be increased by consuming (producing) more, while if MSB &lt; MSC, social welfare can be increased by consuming (producing) less.',
    'Since <strong>Qe is less than Qs</strong>, there is <strong>underconsumption of vaccinations</strong>. We say “under<u>consumption</u>” here because the positive externality arises from consumption.',
    'For the quantity between <strong>Qe and Qs</strong>, <strong>MSB is greater than MSC</strong>. This causes a <strong>deadweight loss</strong> of the shaded area because these additional units, whose social benefits exceed their social costs, are not consumed. Hence, the market fails due to <strong>allocative inefficiency</strong>.',
  ] };

  EW.register({
    id: 'guided-externalities', title: 'Externalities as a Source of Market Failure', guided: true, plot,
    glossary: ['externality', 'marginalPrivateBenefit', 'marginalPrivateCost', 'marginalExternalCost', 'marginalExternalBenefit', 'marginalSocialCost', 'marginalSocialBenefit', 'freeMarketEquilibrium', 'sociallyOptimalOutput', 'deadweightLoss', 'allocativeEfficiency'],
    about: '<p>Marginal external costs or benefits are constant. Curves are illustrative; axis values and the externality magnitude are not quantified.</p><p>Negative (cigarettes): this example follows the cost-side representation, MSC = MPC + MEC. External benefits are absent, so MSB = MPB. The external harm arises from consumption.</p><p>Positive (vaccinations): MSB = MPB + MEB. External costs are absent, so MSC = MPC.</p>',
    controls: [{ type: 'radio', id: 'mode', label: 'Example', options: [['negative', 'Negative externalities'], ['positive', 'Positive externalities']], onChange: st => { st.step = 1; } }],
    steps: guidedSteps(stepTitles('Explain the externality'), extTexts),
    draw(P, st, C) {
      const n = st.mode === 'negative', step = st.step, qs = n ? 30 : 70;
      P.axes(yTitle, 'Quantity');
      P.part('dwl');
      if (step === 6) {
        const pts = n ? [[30, 70], [50, 50], [50, 90]] : [[50, 50], [50, 90], [70, 70]];
        P.area(pts, C.red, { opacity: 0.25, tip: ['mf.dwl', { over: n, word: n ? 'overconsumption' : 'underconsumption' }] });
        P.pointLabel([(pts[0][0] + pts[1][0] + pts[2][0]) / 3, (pts[0][1] + pts[1][1] + pts[2][1]) / 3], 'DWL', { color: C.red, gap: [0, 8], size: '78%' });
      }
      P.part('mpb'); line(P, [[0, 100], [100, 0]], C.demand, n ? 'MSB = MPB' : 'MPB');
      P.part('mpc'); line(P, [[0, 0], [100, 100]], C.supply, n ? 'MPC' : 'MSC = MPC');
      P.part('social'); line(P, n ? [[0, 40], [80, 120]] : [[20, 120], [120, 20]], C.social, n ? 'MSC = MPC + MEC' : 'MSB = MPB + MEB');
      if (step === 2) {
        P.part('extGap');
        const q = n ? 78 : 22, low = n ? q : 100 - q;
        P.line([q, low], [q, low + 40], { color: C.demand, width: 1.8, both: true, tip: n ? 'mf.mec' : 'mf.meb' });
        P.pointLabel([q, low + 20], n ? 'MEC' : 'MEB', { color: C.demand, prefer: 'e', gap: [6, 12] });
      }
      if (step >= 3) { P.part('ee'); point(P, 50, 50, 'E_e', C.ink, 'mf.ee'); P.pLabel(50, 'P_e'); P.qLabel(50, 'Q_e', { tip: 'mf.qe' }); }
      if (step >= 4) { P.part('es'); point(P, qs, 70, 'E_s', C.social, 'mf.es'); P.pLabel(70, 'P_s', { color: C.social }); P.qLabel(qs, 'Q_s', { color: C.social, tip: 'mf.qs' }); }
      if (step >= 5) { P.part('qgap'); gap(P, 50, qs, n ? 'Overconsumption' : 'Underconsumption'); }
      const own = n ? 'mpb' : 'mpc';
      const focus = [null, [], ['mpb', 'mpc', 'social', 'extGap'], ['mpb', 'mpc', 'ee'], ['social', 'es', own], ['ee', 'es', 'qgap'], ['social', 'es', 'ee', 'qgap', 'dwl', own]][step];
      const out = { focus, desc: `${n ? 'Negative' : 'Positive'} externalities in consumption, step ${step}.` };
      if (step === 6) out.result = EW.summary(n ? EW.tables.ne(false) : EW.tables.pe(false));   // same table as the independent widget, at the last step
      return out;
    },
  });

  const infoTexts = {
    'under-mpc': ['Consumers may <strong>underestimate the harm of some goods to themselves</strong>. For example, cigarette smokers may not be fully aware of the <strong>health risks of smoking</strong>, or they may have <strong>myopic views of the long-term health risks</strong>. It is difficult for consumers to <strong>accurately estimate the long-term health costs</strong> associated with smoking because these costs arise in the future and are uncertain.', 'As such, <strong>MPC<sub>PERCEIVED</sub> is lower than MPC<sub>ACTUAL</sub></strong>. Assuming no externalities, MPC<sub>ACTUAL</sub> = MSC and MPB<sub>ACTUAL</sub> = MSB.', 'The <strong>market equilibrium quantity will be at Qe where MPB<sub>ACTUAL</sub> = MPC<sub>PERCEIVED</sub></strong>. Consumers make consumption decisions based on their <strong>perceived benefits and costs</strong>.', 'However, the <strong>socially optimal output where social welfare is maximised is at Qs where MSB = MSC</strong>.', 'Since <strong>Qe exceeds Qs</strong>, there is <strong>overconsumption of cigarettes</strong>. We say “over<u>consumption</u>” here because consumers consume too much due to imperfect information.', 'For the quantity between <strong>Qs and Qe</strong>, <strong>MSC is greater than MSB</strong>. This causes a <strong>deadweight loss</strong> of the shaded area as social welfare is not maximised. Hence, the market fails due to <strong>allocative inefficiency</strong>.'],
    'over-mpc': ['Consumers may <strong>overestimate the cost of some goods to themselves</strong>. For example, some parents wrongly believe that vaccinations cause their children to develop autism. Exposure to <strong>false or misleading information</strong> may cause consumers to form inaccurate beliefs about the health risks, leading them to overestimate the harm of vaccinations.', 'As such, <strong>MPC<sub>PERCEIVED</sub> is higher than MPC<sub>ACTUAL</sub></strong>. Assuming no externalities, MPC<sub>ACTUAL</sub> = MSC and MPB<sub>ACTUAL</sub> = MSB.', 'The <strong>market equilibrium quantity will be at Qe where MPB<sub>ACTUAL</sub> = MPC<sub>PERCEIVED</sub></strong>. Consumers make consumption decisions based on their <strong>perceived benefits and costs</strong>.', 'However, the <strong>socially optimal output where social welfare is maximised is at Qs where MSB = MSC</strong>.', 'Since <strong>Qe is less than Qs</strong>, there is <strong>underconsumption of vaccinations</strong>. We say “under<u>consumption</u>” here because consumers consume too little due to imperfect information.', 'For the quantity between <strong>Qe and Qs</strong>, <strong>MSB is greater than MSC</strong>. This causes a <strong>deadweight loss</strong> of the shaded area as social welfare is not maximised. Hence, the market fails due to <strong>allocative inefficiency</strong>.'],
    'under-mpb': ['Consumers may <strong>underestimate the benefits of some goods and services to themselves</strong>. For example, education increases individuals’ productivity and raises their future salaries. However, these benefits arise in the long term, making them <strong>difficult to estimate accurately in the present</strong>. Consumers may take a <strong>myopic view</strong> and hence underestimate these benefits.', 'As such, <strong>MPB<sub>PERCEIVED</sub> is lower than MPB<sub>ACTUAL</sub></strong>. Assuming no externalities, MPC<sub>ACTUAL</sub> = MSC and MPB<sub>ACTUAL</sub> = MSB.', 'The <strong>market equilibrium quantity will be at Qe where MPB<sub>PERCEIVED</sub> = MPC<sub>ACTUAL</sub></strong>. Consumers make consumption decisions based on their <strong>perceived benefits and costs</strong>.', 'However, the <strong>socially optimal output where social welfare is maximised is at Qs where MSB = MSC</strong>.', 'Since <strong>Qe is less than Qs</strong>, there is <strong>underconsumption of education</strong>. We say “under<u>consumption</u>” here because consumers consume too little due to imperfect information.', 'For the quantity between <strong>Qe and Qs</strong>, <strong>MSB is greater than MSC</strong>. This causes a <strong>deadweight loss</strong> of the shaded area as social welfare is not maximised. Hence, the market fails due to <strong>allocative inefficiency</strong>.'],
    'over-mpb': ['Consumers may <strong>overestimate the benefits of some goods to themselves</strong> due to <strong>aggressive or misleading advertising</strong>. For example, companies may advertise benefits of formula milk powder in improving children’s development. Consumers may <strong>lack the information or expertise to assess these claims accurately</strong>, causing them to believe misleading claims and overestimate the benefits.', 'As such, <strong>MPB<sub>PERCEIVED</sub> is higher than MPB<sub>ACTUAL</sub></strong>. Assuming no externalities, MPC<sub>ACTUAL</sub> = MSC and MPB<sub>ACTUAL</sub> = MSB.', 'The <strong>market equilibrium quantity will be at Qe where MPB<sub>PERCEIVED</sub> = MPC<sub>ACTUAL</sub></strong>. Consumers make consumption decisions based on their <strong>perceived benefits and costs</strong>.', 'However, the <strong>socially optimal output where social welfare is maximised is at Qs where MSB = MSC</strong>.', 'Since <strong>Qe exceeds Qs</strong>, there is <strong>overconsumption of formula milk powder</strong>. We say “over<u>consumption</u>” here because consumers consume too much due to imperfect information.', 'For the quantity between <strong>Qs and Qe</strong>, <strong>MSC is greater than MSB</strong>. This causes a <strong>deadweight loss</strong> of the shaded area as social welfare is not maximised. Hence, the market fails due to <strong>allocative inefficiency</strong>.'],
  };

  EW.register({
    id: 'guided-imperfect-information', title: 'Imperfect Information as a Source of Market Failure', guided: true, plot,
    glossary: ['imperfectInformation', 'perceivedMpb', 'actualMpb', 'perceivedMpc', 'actualMpc', 'myopia', 'marketEquilibriumImperfectInformation', 'sociallyOptimalOutput', 'overconsumptionAndUnderconsumption', 'deadweightLoss', 'allocativeEfficiency'],
    about: '<p>Only one private curve is misestimated at a time. The information error is a fixed parallel shift. The other private curve is correctly estimated. Curves are illustrative; axis values are not quantified.</p><p>No externalities: MPB<sub>actual</sub> = MSB and MPC<sub>actual</sub> = MSC. Market decisions use perceived values; social welfare depends on actual values. The examples isolate imperfect information even where externalities may also exist in practice.</p>',
    controls: [{ type: 'radio', id: 'mode', label: 'Case', options: Object.entries(cases), onChange: st => { st.step = 1; } }],
    steps: guidedSteps(stepTitles('Explain the imperfect information'), infoTexts),
    draw(P, st, C) {
      const step = st.step, cost = st.mode.endsWith('mpc'), under = st.mode.startsWith('under'), shift = under ? -40 : 40;
      const qe = 50 + (cost ? -shift : shift) / 2, pe = cost ? 100 - qe : qe, over = qe > 50;
      P.axes(yTitle, 'Quantity');
      P.part('dwl'); if (step === 6) dwl(P, C, qe, 'ii.dwl');
      const L = actualLabels(cost, false);
      P.part('mpb'); line(P, [[0, 100], [100, 0]], C.demand, L.mpb, 'ii.actualMpb');
      P.part('mpc'); line(P, [[0, 0], [100, 100]], C.supply, L.mpc, 'ii.actualMpc');
      P.part('perceived'); line(P, shifted(cost, shift), C.perceived, `${cost ? 'MPC' : 'MPB'}_{perceived}`, ['ii.perceived', { cost, under }]);
      if (step === 2) {
        P.part('infoGap');
        const q = cost ? 78 : 22, actual = cost ? q : 100 - q;
        P.line([q, actual], [q, actual + shift], { color: C.perceived, width: 1.8, both: true });
      }
      if (step >= 3) { P.part('ee'); point(P, qe, pe, 'E_e', C.perceived, 'ii.market'); P.pLabel(pe, 'P_e', { color: C.perceived }); P.qLabel(qe, 'Q_e', { color: C.perceived, tip: 'ii.qe' }); }
      if (step >= 4) { P.part('es'); point(P, 50, 50, 'E_s', C.ink, 'ii.efficient'); P.pLabel(50, 'P_s'); P.qLabel(50, 'Q_s', { tip: 'ii.qs' }); }
      if (step >= 5) { P.part('qgap'); gap(P, 50, qe, over ? 'Overconsumption' : 'Underconsumption'); }
      const focus = [null, [], ['mpb', 'mpc', 'perceived', 'infoGap'], ['perceived', cost ? 'mpb' : 'mpc', 'ee'], ['mpb', 'mpc', 'es'], ['ee', 'es', 'qgap'], ['mpb', 'mpc', 'es', 'ee', 'qgap', 'dwl']][step];
      const out = { focus, desc: `${cases[st.mode]}, step ${step}.` };
      if (step === 6) out.result = EW.summary(infoRows(cases[st.mode], false, cost, under, over));
      return out;
    },
  });
})();
