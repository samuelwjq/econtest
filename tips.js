/* THE TOOLTIP DATABASE: the one place where hover/tap explanations on diagrams are written.
   Widgets refer to a tooltip by key, e.g. tip: 'eq.initial', so editing the wording here updates every widget.
   An entry is either fixed text, or a function for wording that depends on the diagram, called with values from
   the widget, e.g. tip: ['adjust.alongCurve', { rises: true, curve: 'demand', increases: false }].
   Keys are grouped by concept (curve., eq., price., qty., area., gap., adjust.) so other topics can reuse them. */
Object.assign(EW.tips, {

  /* ----- Curves ----- */
  'curve.demandInitial': 'Initial demand curve.',
  'curve.demandCurrent': 'Current demand curve.',
  'curve.supplyInitial': 'Initial supply curve.',
  'curve.supplyCurrent': 'Current supply curve.',

  'curve.named': ({ name }) => `The ${name} curve.`,
  'curve.perfectlyElastic': ({ curve }) => `Perfectly price elastic ${curve} at P₀.`,

  /* ----- Equilibrium points and values ----- */
  'eq.initial': 'Initial equilibrium E₀: quantity demanded equals quantity supplied at P₀ and Q₀.',
  'ref.curve': 'Reference curve: pivoted around E₀ with a different elasticity, so you can compare the effect of the same change.',
  'ref.eq': 'Equilibrium on the reference curve after the same change (E₂, P₂, Q₂).',
  'eq.new': 'New equilibrium E₁: the current demand and supply curves intersect at P₁ and Q₁.',
  'price.initial': 'Initial equilibrium price P₀.',
  'price.new': 'New equilibrium price P₁.',
  'qty.initial': 'Initial equilibrium quantity Q₀.',
  'qty.new': 'New equilibrium quantity Q₁.',
  'qty.demandedAtP0': 'Quantity demanded on the current demand curve at P₀.',
  'qty.suppliedAtP0': 'Quantity supplied on the current supply curve at P₀.',

  'change.price': ({ dir }) => `Equilibrium price ${dir}.`,
  'change.quantity': ({ dir }) => `Equilibrium quantity ${dir}.`,

  /* ----- Shaded areas ----- */
  'area.consumerSurplus': 'Consumer surplus (CS): for each unit up to Q₁, the demand curve shows what consumers are willing and able to pay. They actually pay P₁. The area below the current demand curve and above P₁ adds up these differences.',
  'area.producerSurplus': 'Producer surplus (PS): for each unit up to Q₁, the supply curve shows the minimum price producers are willing to accept. They receive P₁. The area above the current supply curve and below P₁ adds up these differences.',

  'tr.priceEffect': ({ gain }) => `Price effect: ${gain ? 'gain' : 'loss'} in total revenue/expenditure from the price change on the initial quantity Q₀.`,
  'tr.quantityEffect': ({ gain }) => `Quantity effect: ${gain ? 'gain' : 'loss'} in total revenue/expenditure from the quantity change valued at the new price P₁.`,

  /* ----- Shortage and surplus ----- */
  'gap.arrow': ({ shortage }) => shortage
    ? 'Shortage at P₀: quantity demanded exceeds quantity supplied. The arrow shows the horizontal gap between Qd and Qs.'
    : 'Surplus at P₀: quantity supplied exceeds quantity demanded. The arrow shows the horizontal gap between Qd and Qs.',
  'gap.label': 'This gap is measured on the current curves at P₀. Its arrow is placed near the quantity axis for clarity.',
  'gap.pointOnCurve': ({ curve }) => `At P₀, this point on the current ${curve} curve identifies quantity ${curve === 'demand' ? 'demanded (Qd)' : 'supplied (Qs)'}.`,

  /* ----- Production possibility curve ----- */
  'ppc.curve': ({ label }) => `${label}: maximum attainable output combinations.`,
  'ppc.capacityX': 'Maximum output of consumer goods when all resources produce consumer goods.',
  'ppc.capacityY': 'Maximum output of capital goods when all resources produce capital goods.',
  'ppc.point': ({ label, x, y }) => `${label}: output combination (${x}, ${y}).`,
  'ppc.start': 'A is the initial output. The change is always measured from A to B.',
  'ppc.reallocation': 'A → B along the same PPC: pure reallocation.',

  /* ----- Government intervention ----- */
  'gi.demand': 'Demand: the relationship between price and quantity demanded.',
  'gi.supply': 'Supply: the relationship between price and quantity supplied.',
  'gi.demandLabour': 'Demand for labour: employers are willing to hire more labour at lower wages.',
  'gi.supplyLabour': 'Supply of labour: workers are willing to supply more labour at higher wages.',
  'gi.specificCurve': 'Supply after specific tax. The vertical gap from S equals the tax per unit.',
  'gi.indirectCurve': 'Supply after indirect subsidy. The vertical gap below S equals the subsidy per unit.',
  'gi.advaloremCurve': 'Supply after ad valorem tax. Each original supply price is raised in proportion to the tax rate.',
  'gi.directCurve': 'Demand after the direct consumer subsidy. Consumers can offer their willingness to pay plus the subsidy to producers.',
  'gi.tr': 'Total revenue/expenditure: sellers’ receipts equal buyers’ expenditure. The rectangle is the actual transaction price × quantity actually traded, not unmet demand or unsold supply.',
  'gi.trLabour': 'Total revenue/expenditure: total wage receipts of employed workers equal employers’ total wage expenditure. The rectangle is the actual wage × actual employment, not the quantity of labour supplied.',
  'gi.cs': ({ k }) => `Consumer surplus: willingness to pay minus the effective price paid, summed over the units actually traded. How to identify the area: below the original demand curve and above ${['specific', 'advalorem', 'indirect', 'direct'].includes(k) ? 'Pc, the effective price paid by consumers' : 'P₁'}, from the quantity origin to Q₁.${k === 'direct' ? ' The consumer price is net of the direct subsidy.' : ''}`,
  'gi.ps': ({ k, fiscal }) => `Producer surplus: revenue received minus minimum acceptable revenue, summed over the units actually traded. How to identify the area: above the original supply curve and below ${['specific', 'advalorem', 'indirect', 'direct'].includes(k) ? 'Pp, the price received by producers' : 'P₁'}, from the quantity origin to Q₁.${k === 'indirect' ? ' The producer price includes the subsidy.' : fiscal === 'revenue' ? ' The producer price is after paying the tax.' : ''}${k === 'quota' ? ' This includes quota rent retained by producers.' : ''}`,
  'gi.fiscal': ({ fiscal }) => fiscal === 'revenue' ? 'Government revenue: tax per unit × quantity traded. Added to CS + PS when calculating total welfare.' : 'Government expenditure: subsidy per unit × quantity traded. Subtracted from CS + PS when calculating total welfare. The expenditure area overlaps parts of CS and PS; subtract it once.',
  'gi.dwl': ({ lab, under }) => 'Deadweight loss: ' + (lab ? 'gains from employment forgone as employment falls. How to identify the area: between the original demand for labour and supply of labour curves, over the reduction in employment from L₀ to L₁.'
    : under ? 'gains from trade forgone because too few units are traded. How to identify the area: between the original demand and supply curves, over the units between Q₁ and Q₀ that are no longer traded.'
    : 'for units beyond Q₀, marginal cost exceeds marginal benefit. How to identify the area: between the original demand and supply curves, over the additional units between Q₀ and Q₁.'),
  'gi.priceInitial': 'Price or wage at the initial no-policy equilibrium.',
  'gi.priceAfter': ({ k }) => k === 'quota' ? 'Producers set P₁ at the demand curve for Q quota: this is the highest market-clearing price at which consumers buy the restricted quantity. An ineffective quota leaves price at P₀.'
    : k === 'direct' ? 'P₁ is the price received by producers at the intersection of subsidised demand and supply.'
    : ['specific', 'advalorem', 'indirect'].includes(k) ? 'P₁ is the price paid by consumers at the intersection of demand and policy-adjusted supply.'
    : 'Price or wage after intervention. An effective control does not clear the market.',
  'gi.pc': 'Price paid by consumers per unit, after deducting any direct consumer subsidy.',
  'gi.pp': 'Price received by producers per unit, after paying any tax or including any producer subsidy.',
  'gi.pbm': 'Potential black market price: the demand-curve price at the quantity available under the ceiling. It is what buyers would pay if that restricted supply were resold at a market-clearing price. Actual illegal-market prices may differ. Legal-market welfare is still evaluated at P₁.',
  'gi.qty': ({ label, traded }) => `Quantity label: ${label}.${traded ? ' This is the quantity actually traded.' : ''}`,
  'gi.coincide': 'Initial and selected-policy outcomes coincide.',
  'gi.e0': 'No-policy equilibrium, where demand equals supply.',
  'gi.e1': ({ control }) => (control ? 'Policy trading outcome; an effective price control does not clear the market.' : 'Selected-policy equilibrium.') + ' Q₁ is the quantity actually traded.',
  'gi.wedge': 'The other side of the tax or subsidy price wedge.',
  'gi.priceChange': 'Change from the initial price or wage to the outcome after intervention.',
  'gi.qtyChange': 'Change from the initial quantity to the quantity actually traded after intervention.',
  'gi.retrenchment': 'Retrenchment: these are the units of labour (workers) that will be retrenched from their jobs if the minimum wage is implemented. The reduction in employment is from L₀ to L₁.',
  'gi.persistentGap': ({ k }) => k === 'wage' ? 'Unemployment: these are the units of labour (workers) that are willing to work at the minimum wage but are not employed. It is the difference between labour supplied and labour demanded at W₁.'
    : `Persistent ${k === 'ceiling' ? 'shortage: quantity demanded exceeds quantity supplied.' : 'surplus: quantity supplied exceeds quantity demanded.'} The gap is measured at the controlled price and placed near the quantity axis for clarity.`,
  'gi.temporaryGap': ({ shortage }) => `Immediately after the policy, at P₀, ${shortage ? 'quantity demanded exceeds quantity supplied' : 'quantity supplied exceeds quantity demanded'}. This temporary imbalance causes price adjustment.`,
  'gi.temporaryGapLabel': 'The temporary shortage or surplus is measured at P₀ on the policy-adjusted curves. The red arrow is placed near the quantity axis for clarity.',
  'gi.pressure': ({ shortage }) => `${shortage ? 'Shortage puts upward' : 'Excess supply puts downward'} pressure on the market price until the new equilibrium is reached.`,

  /* ----- Market failure: externalities ----- */
  'mf.qe': '<strong>Free market output (Q<sub>e</sub>)</strong><br>This is the output determined by <strong>MPB = MPC</strong>. It reflects the outcome produced by private market forces without government intervention.',
  'mf.qs': '<strong>Socially optimal output (Q<sub>s</sub>)</strong><br>This is the output level that maximises total social welfare, where <strong>MSB = MSC</strong>. At this point, allocative efficiency is achieved.',
  'mf.qsJoint': '<strong>Original social optimum (Q<sub>s</sub>)</strong><br>This is the benchmark before public provision. A new optimum requires public production-cost assumptions.',
  'mf.qsPrime': '<strong>New social optimum (Q<sub>s</sub>′)</strong><br>This is the allocatively efficient output under the reduced marginal external cost, where <strong>MSB = MSC′</strong>.',
  'mf.ee': '<strong>Market equilibrium (E<sub>e</sub>)</strong><br>Unregulated private market outcome where MPB = MPC.',
  'mf.es': '<strong>Social optimum (E<sub>s</sub>)</strong><br>Socially efficient outcome where MSB = MSC.',
  'mf.policyQ': '<strong>Policy output level</strong><br>• <strong>Quantity:</strong> the output resulting from government intervention.<br>• <strong>Effect:</strong> the welfare effect depends on the intervention. Too much or too little intervention can leave output away from the social optimum.',
  'mf.dwl': ({ over, word }) => over
    ? `<strong>Why is this DWL?</strong><br>• <strong>Horizontally:</strong> output is not at Q<sub>s</sub> (${word}).<br>• <strong>Vertically:</strong> MSB is not equal to MSC (MSC &gt; MSB for these units), representing net welfare loss from ${word}.`
    : `<strong>Why is this DWL?</strong><br>• <strong>Horizontally:</strong> output is not at Q<sub>s</sub> (${word}).<br>• <strong>Vertically:</strong> MSB is not equal to MSC (MSB &gt; MSC for these units), representing forgone net benefit to society.`,
  'mf.mec': '<strong>Marginal external cost (MEC)</strong><br>The additional uncompensated cost inflicted on third parties outside the market transaction from producing one extra unit.',
  'mf.meb': '<strong>Marginal external benefit (MEB)</strong><br>The uncompensated benefit enjoyed by third parties outside the market transaction from consuming or producing one extra unit.',
  'mf.gapOver': 'Output exceeds the socially optimal level Q<sub>s</sub>.',
  'mf.gapUnder': 'Output falls short of the socially optimal level Q<sub>s</sub>.',
  'mf.taxRevenue': '<strong>Total tax revenue</strong><br>This area represents total government tax revenue calculated as per-unit tax multiplied by output (Q<sub>t</sub>).',
  'mf.taxSize': 'The vertical gap between MPC + tax and MPC is the tax per unit.',
  'mf.subsidyCost': '<strong>Total cost of subsidy</strong><br>This area represents the total cost of subsidy because it is the subsidy amount multiplied by the units of output.',
  'mf.banFreeDwl': '<strong>Free-market DWL</strong><br>Without the ban, output remains Q<sub>e</sub>. The shaded area is the excess of MSC over MSB from Q<sub>s</sub> to Q<sub>e</sub>.',
  'mf.banDwl': '<strong>DWL caused by the ban</strong><br>Output is zero. The shaded area represents the net benefits forgone on units up to Q<sub>s</sub>, where MSB exceeds MSC.',
  'mf.banEe': '<strong>Unregulated market</strong><br>MPB = MPC. Q<sub>e</sub> remains unchanged as MEC varies because the external cost is not borne by these producers.',
  'mf.banEs': '<strong>Social optimum</strong><br>MSB = MSC at this positive output. A complete ban would also prevent the beneficial units below Q<sub>s</sub>.',
  'mf.banZeroOptimal': '<strong>Zero output is socially optimal</strong><br>MSC is at least MSB for every feasible positive quantity. A ban eliminates the output-related DWL in this model.',
  'mf.banOutput': '<strong>Output under a ban</strong><br>A ban sets the output quota at zero. There is no transaction price because no units are traded.',
  'mf.freeMarketDwl': '<strong>Free-market DWL</strong><br>The unregulated market under-consumes because consumers do not take MEB into account. The area measures social benefits forgone between Q<sub>e</sub> and Q<sub>s</sub>.',
  'mf.freeDwl': ({ over }) => over ? '<strong>DWL under free provision</strong><br>Output exceeds Q<sub>s</sub>. MSC exceeds MSB on the excess units.' : '<strong>DWL under free provision</strong><br>Output is below Q<sub>s</sub>. Further units would create net social benefits, even though their private benefit is negative in this stylised linear model.',
  'mf.freeSubsidy': '<strong>Government subsidy expenditure</strong><br>The subsidy reimburses producers while consumers pay no price. This payment is a transfer; resource costs are represented by MPC = MSC. Fiscal distortion and administration costs are excluded.',
  'mf.freeEe': '<strong>Free-market equilibrium</strong><br>MPB = MPC. Private curves and this output remain fixed as MEB changes.',
  'mf.freeEs': '<strong>Social optimum</strong><br>MSB = MSC. The socially optimal output rises as MEB increases.',
  'mf.freeEf': '<strong>Free provision</strong><br>Consumers pay no price. Producers receive P<sub>p</sub>, funded by the government. Output stays fixed at Q<sub>f</sub> while MEB varies.',

  /* ----- Market failure: imperfect information ----- */
  'ii.actualMpc': 'Actual marginal private cost equals marginal social cost. There are no external costs.',
  'ii.actualMpb': 'Actual marginal private benefit equals marginal social benefit. There are no external benefits.',
  'ii.perceived': ({ cost, under }) => `Perceived marginal private ${cost ? 'cost' : 'benefit'} is ${under ? 'below' : 'above'} its actual value. This is the curve used by decision-makers.`,
  'ii.dwl': 'Deadweight loss: the net social benefit lost on units between market output and socially efficient output, measured between actual MSB and MSC.',
  'ii.dwlRemaining': 'Remaining deadweight loss: the gap between actual MSB and MSC over units between current consumption and Q<sub>s</sub>.',
  'ii.dwlEliminated': 'Initial deadweight loss eliminated by requiring consumption at Q<sub>s</sub>. Perceptions have not changed.',
  'ii.merged': 'Market equilibrium and social optimum coincide.',
  'ii.market': 'Market equilibrium: perceived MPB equals perceived MPC.',
  'ii.efficient': 'Socially efficient outcome: actual MSB equals actual MSC.',
  'ii.qs': 'Socially efficient output (Q<sub>s</sub>): the quantity where actual MSB equals actual MSC, maximising society’s net benefit.',
  'ii.qe': 'Free-market equilibrium output (Q<sub>e</sub>): the quantity where perceived MPB equals perceived MPC. Decisions are based on perceived costs and benefits.',
  'ii.qMerged': 'Free-market equilibrium output (Q<sub>e</sub>) equals socially efficient output (Q<sub>s</sub>): with no mis-estimation, actual and perceived values coincide.',
  'ii.pointE': 'E<sub>e</sub>: initial free-market consumption, based on the original perceived costs and benefits.',
  'ii.pointS': 'E<sub>s</sub>: socially efficient consumption, where actual MSB equals actual MSC.',
  'ii.point1': 'E<sub>1</sub>: consumption after the selected policy, where the effective private curves intersect.',
  'ii.qInitial': 'Q<sub>e</sub>: initial free-market consumption, based on the original perceived costs and benefits.',
  'ii.q1': 'Q<sub>1</sub>: consumption after the selected policy, where the effective private curves intersect.',
  'ii.fiscalArea': ({ tax }) => tax ? 'Tax revenue: per-unit tax multiplied by current consumption. This is a transfer, not an additional social benefit.' : 'Subsidy expenditure: per-unit subsidy multiplied by current consumption. This is a transfer; financing costs are excluded.',

  /* ----- Macroeconomy (AD–AS) ----- */
  'macro.ad': ({ label }) => `${label}: planned expenditure on domestic output at each general price level.`,
  'macro.adUnchanged': 'The AD curve is unchanged.',
  'macro.adFixed': 'AD stays fixed at the selected initial state.',
  'macro.as': ({ label }) => `${label}: aggregate supply at each general price level.`,
  'macro.keynesianAs': 'Keynesian AS: spare capacity at low output, rising costs as capacity is approached, and a full-employment output limit.',
  'macro.equilibrium': 'An intersection of AD and AS: macroeconomic equilibrium.',
  'macro.pointOnAd': 'A position on AD; it need not be an equilibrium with AS.',
  'macro.pointOnAs': 'A position on AS; it need not be an equilibrium with AD.',
  'macro.adStageA': 'AD<sub>a</sub>: the initial spending change only, before further rounds of induced consumption.',
  'macro.adStageLater': 'A later, illustrative cumulative spending stage. Spending stages are not separate equilibria.',
  'macro.noFurtherRounds': 'Initial spending change only: no further rounds.',
  'macro.outputGap': 'Negative output gap: actual real national income is below productive capacity.',
  'macro.changeGPL': ({ dir }) => `General price level ${dir}.`,
  'macro.changeRNY': ({ dir }) => `Real national income ${dir}.`,

  /* ----- Price adjustment ----- */
  'adjust.alongCurve': ({ rises, curve, increases }) =>
    `As price ${rises ? 'rises' : 'falls'}, quantity ${curve === 'demand' ? 'demanded' : 'supplied'} ${increases ? 'increases' : 'decreases'} along the current ${curve} curve towards the new equilibrium.`,
  // ---- Topic 11: Firms and Decisions ----
  /* ----- Topic 11: costs and revenue ----- */
  'cost.mc': 'Marginal cost (MC): the extra cost of producing one more unit. It cuts AC and AVC at their minimum points.',
  'cost.ac': 'Average cost (AC) = TC ÷ Q. AC falls when MC is below it and rises when MC is above it.',
  'cost.avc': 'Average variable cost (AVC) = TVC ÷ Q. MC cuts it at its minimum point.',
  'cost.afc': 'Average fixed cost (AFC) = TFC ÷ Q. It falls as output rises because the fixed cost is spread over more units.',
  'cost.minAC': 'Minimum point of AC: MC = AC, so AC is neither rising nor falling.',
  'cost.minAVC': 'Minimum point of AVC: MC = AVC.',
  'scale.lrac': 'Long-run average cost (LRAC): the lowest average cost of each output when all factors are variable.',
  'scale.optimum': 'Optimum scale (Q₁): the output at which LRAC is lowest. Below Q₁ the firm enjoys internal economies of scale; above it, internal diseconomies.',
  'scale.ghost': 'The original LRAC₀, before the change in the size of the industry.',
  'scale.move': 'Movement along LRAC as the firm changes its scale of production.',
  'scale.start': 'Point A: the starting position, with its output and average cost.',
  'scale.now': 'Point B: the new position after the change.',
  'scale.qChange': 'Change in the firm’s output.',
  'scale.acChange': 'Change in average cost.',
  'rev.ar': 'Demand curve of the firm. It is also the average revenue (AR) curve, since AR = P.',
  'rev.arFlat': 'Perfectly price elastic demand: D = AR = MR at the market price P₀.',
  'rev.mr': 'Marginal revenue (MR): below AR when the firm faces a downward-sloping demand curve. A straight-line MR falls twice as fast as AR.',
  'rev.pivot': 'Original equilibrium: the firm’s demand curve pivots about this point as market power changes.',
  'rev.firms': 'Number of firms in the industry. It falls towards 1 as barriers to entry and market power rise.',
  'rev.mktD': 'Market demand curve.',
  'rev.mktS': 'Market supply curve.',
  'profit.mc': 'Marginal cost (MC). Profit is maximised only where MC = MR and MC cuts MR from below. Where MC cuts MR from above, producing more units still adds more to revenue than to cost.',
  'profit.cross': 'Profit-maximising output: MC = MR, with MC cutting MR from below.',
  'profit.q0': 'Profit-maximising output q₀, where MC = MR and MC cuts MR from below.',
  'profit.p0': 'P₀: the price consumers are willing to pay for q₀ units, read off the D = AR curve.',
  'profit.p0pc': 'P₀: the market price, which consumers pay for every unit. D = AR is horizontal at P₀.',
  'profit.mc0': 'MC₀: marginal cost at q₀, equal to MR at q₀. Compare it with P₀: P₀ = MC₀ for a price taker, and P₀ > MC₀ when the firm has market power.',
  'profit.ac0': 'AC₀: the average cost of producing q₀ units, read off the AC curve.',
  'profit.acNatural': 'Natural monopoly: AC falls over the whole range of output shown, because economies of scale are so large that one firm can supply the market at a lower average cost than two or more firms.',
  'profit.super': 'Supernormal profit: (P₀ − AC₀) × q₀. TR > TC.',
  'profit.sub': 'Subnormal profit (loss): (AC₀ − P₀) × q₀. TR < TC.',
  'profit.normal': 'Normal profit: P₀ = AC₀, so TR = TC. The firm earns just enough to stay in the industry.',
  'profit.tr': 'Total revenue (TR) = P₀ × q₀.',
  'profit.tc': 'Total costs (TC) = AC₀ × q₀.',
  'profit.cs': 'Consumer surplus: the area under the demand curve and above P₀, up to q₀.',
  'profit.ps': 'Producer surplus: the area above the MC curve and below P₀, up to q₀.',
  'rev.mktEq': 'Market equilibrium: price P₀ and quantity Q₀.',
});
