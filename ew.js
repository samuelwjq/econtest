/* Shared engine for all economics widgets: drawing helpers, label placement, controls, tooltips, glossary, export.
   Each widget is a plain object passed to EW.register() from a file in topics/.
   Definitions live only in glossary.js and tooltip wording only in tips.js; widgets refer to them by key. */
const EW = (() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const FONT = "Cambria, 'Times New Roman', Times, serif";

  // One palette for every widget, so a concept always has the same colour.
  const C = {
    ink: '#1b1b1b', grey: '#6b6b6b', guide: '#9a9a9a', red: '#e0301e',
    demand: '#1a6fe0', demand0: '#a9c8f2', supply: '#1f9d45', supply0: '#a3d9b3',
    priceEffect: '#7b4fd6', quantityEffect: '#e0a01a',
    policy: '#7b4fd6',   // curves and lines created by a government policy (also government revenue/expenditure areas)
    perceived: '#e07b00',   // perceived (mis-estimated) private curves under imperfect information
    social: '#e0301e',   // marginal social cost/benefit curves and the social optimum (red, as in the original widgets)
  };
  const BG = '#faf8f3';   // diagram background; also used as the halo behind labels

  const $ = (sel, root = document) => root.querySelector(sel);
  const html = (tag, attrs = {}, inner) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) if (v != null && v !== false) e.setAttribute(k, v === true ? '' : v);
    if (inner != null) e.innerHTML = inner;
    return e;
  };
  const svgEl = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) if (v != null && v !== false) e.setAttribute(k, v);
    if (parent) parent.append(e);
    return e;
  };
  // "P_0", "Q_d", "E_{1}" -> subscripted SVG/HTML text.
  const sub = (t, svg = true) => String(t).replace(/_(\{[^}]*\}|[A-Za-z0-9]+)/g, (m, g) => {
    g = g.replace(/[{}]/g, '');
    return svg ? `<tspan baseline-shift="sub" font-size="72%">${g}</tspan>` : `<sub>${g}</sub>`;
  });

  /* ---------- Tooltip text comes from the shared database in tips.js ---------- */
  // A tip is a key ('eq.initial') or [key, values] for entries that are functions.
  function tipText(ref) {
    const [key, values] = Array.isArray(ref) ? ref : [ref, {}];
    const entry = EW.tips[key];
    if (entry == null) { console.warn(`Tooltip "${key}" is missing from tips.js`); return key; }
    return typeof entry === 'function' ? entry(values) : entry;
  }

  /* ---------- Geometry for label placement ---------- */
  const boxesOverlap = (a, b, pad = 0) => a.x < b.x + b.width + pad && a.x + a.width + pad > b.x && a.y < b.y + b.height + pad && a.y + a.height + pad > b.y;
  function segHitsBox([x1, y1, x2, y2], b, pad = 2) {
    const L = b.x - pad, R = b.x + b.width + pad, T = b.y - pad, B = b.y + b.height + pad;
    let t0 = 0, t1 = 1;
    const dx = x2 - x1, dy = y2 - y1;
    for (const [p, q] of [[-dx, x1 - L], [dx, R - x1], [-dy, y1 - T], [dy, B - y1]]) {   // Liang–Barsky clipping
      if (p === 0) { if (q < 0) return false; continue; }
      const r = q / p;
      if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
    }
    return true;
  }
  // Pushes 1-D labels apart (keeping their order) until none overlap, staying as close to their targets as possible.
  function spread(items, gap, { min = -Infinity, max = Infinity } = {}) {
    const need = (a, b) => (a.size + b.size) / 2 + gap;
    for (const it of items) it.pos = Math.min(Math.max(it.pos, min + it.size / 2), max - it.size / 2);
    for (let k = 0; k < 60; k++) for (let i = 0; i + 1 < items.length; i++) {
      const over = need(items[i], items[i + 1]) - (items[i + 1].pos - items[i].pos);
      if (over > 0) { items[i].pos -= over / 2; items[i + 1].pos += over / 2; }
    }
    if (items.length) items[0].pos = Math.max(items[0].pos, min + items[0].size / 2);
    for (let i = 0; i + 1 < items.length; i++) items[i + 1].pos = Math.max(items[i + 1].pos, items[i].pos + need(items[i], items[i + 1]));
    const last = items[items.length - 1], over = last ? last.pos + last.size / 2 - max : 0;
    if (over > 0) for (let i = items.length - 1; i >= 0; i--) items[i].pos = i === items.length - 1 ? items[i].pos - over : Math.min(items[i].pos, items[i + 1].pos - need(items[i], items[i + 1]));
  }

  /* ---------- Plot: maps economic values to the SVG and draws in data coordinates ---------- */
  class Plot {
    constructor(svg, { x = [0, 100], y = [0, 100], box = [80, 30, 500, 450] } = {}) {
      this.svg = svg; this.x = x; this.y = y;
      [this.l, this.t, this.r, this.b] = box;
      this.defs = svgEl('defs', {}, svg);
      this.g = svgEl('g', {}, svg);
      this.segs = [];     // drawn lines that labels must not cross: {seg, kind: 'curve' | 'guide'}
      this.boxes = [];    // text already on the diagram
      this.axisQueue = { p: [], q: [] };
      this.pointQueue = [];
      this.spanQueue = [];
      this.changeQueue = [];
      this.dots = [];   // marked points; a label must stay nearer its own point than any other
      this.partName = null;
    }
    // Guided widgets: everything drawn after part('gap') is tagged as part of the "gap" so steps can highlight it.
    part(name) { this.partName = name; }
    X(q) { return this.l + (q - this.x[0]) / (this.x[1] - this.x[0]) * (this.r - this.l); }
    Y(p) { return this.b - (p - this.y[0]) / (this.y[1] - this.y[0]) * (this.b - this.t); }
    pt([q, p]) { return [this.X(q), this.Y(p)]; }
    add(tag, attrs, tip) { const e = svgEl(tag, { ...attrs, 'data-part': this.partName }, this.g); if (tip) this.tip(e, tip); return e; }
    tip(e, ref, text = tipText(ref)) { e.dataset.tip = text; e.setAttribute('aria-label', text.replace(/<[^>]*>/g, '')); e.setAttribute('tabindex', '0'); e.classList.add('has-tip'); return e; }
    marker(color) {
      const id = 'arrow' + color.replace('#', '-');
      if (!this.defs.querySelector('#' + id)) {
        const m = svgEl('marker', { id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, this.defs);
        svgEl('path', { d: 'M1 1.5L9 5L1 8.5z', fill: color }, m);
      }
      return `url(#${id})`;
    }
    // Straight segment. px: true means a and b are already SVG pixel positions (for marks outside the plot area).
    line(a, b, { color = C.ink, width = 2.5, dash, tip, arrow, both, px } = {}) {
      if (!px) { const c = this.clip(a, b); if (!c) return null; [a, b] = c; }
      const [x1, y1] = px ? a : this.pt(a), [x2, y2] = px ? b : this.pt(b);
      const m = arrow || both ? this.marker(color) : null;
      this.segs.push({ seg: [x1, y1, x2, y2], kind: dash ? 'guide' : 'curve' });
      return this.add('line', { x1, y1, x2, y2, stroke: color, 'stroke-width': width, 'stroke-dasharray': dash,
        'stroke-linecap': m ? 'butt' : 'round', 'marker-end': m, 'marker-start': both ? m : null }, tip);
    }
    // Clips the segment a–b (data values) to the plot area; null when it lies entirely outside.
    clip(a, b) {
      let t0 = 0, t1 = 1;
      const dx = b[0] - a[0], dy = b[1] - a[1];
      for (const [p, q] of [[-dx, a[0] - this.x[0]], [dx, this.x[1] - a[0]], [-dy, a[1] - this.y[0]], [dy, this.y[1] - a[1]]]) {
        if (Math.abs(p) < 1e-12) { if (q < -1e-9) return null; continue; }
        const r = q / p;
        if (p < 0) { if (r > t1) return null; if (r > t0) t0 = r; } else { if (r < t0) return null; if (r < t1) t1 = r; }
      }
      return [[a[0] + t0 * dx, a[1] + t0 * dy], [a[0] + t1 * dx, a[1] + t1 * dy]];
    }
    // Smooth curve through many data points (PPC, cost curves). Labels avoid it like any other curve.
    path(points, { color = C.ink, width = 2.5, dash, tip, arrow } = {}) {
      const px = points.map(p => this.pt(p));
      for (let i = 1; i < px.length; i++) this.segs.push({ seg: [...px[i - 1], ...px[i]], kind: dash ? 'guide' : 'curve' });
      return this.add('path', { d: 'M' + px.map(p => p.join(',')).join('L'), fill: 'none', stroke: color, 'stroke-width': width,
        'stroke-dasharray': dash, 'stroke-linejoin': 'round', 'marker-end': arrow ? this.marker(color) : null }, tip);
    }
    // Shaded region (surplus, revenue, deadweight loss). hatch is used in the greyscale export.
    area(points, color, { tip, hatch = 'diagonal', opacity = 0.2 } = {}) {
      const d = 'M' + points.map(p => this.pt(p).join(',')).join('L') + 'Z';
      return this.add('path', { d, fill: color, 'fill-opacity': opacity, stroke: 'none', 'data-hatch': hatch }, tip);
    }
    // Fixed-position text. Every label gets a thin halo in the background colour so lines behind it don't cut through.
    textAt(x, y, str, { color = C.ink, anchor = 'middle', size, tip } = {}) {
      const e = this.add('text', { x, y, fill: color, 'text-anchor': anchor, 'font-size': size,
        stroke: BG, 'stroke-width': 4, 'stroke-linejoin': 'round', 'paint-order': 'stroke' }, tip);
      e.innerHTML = str;
      this.boxes.push(e.getBBox());
      return e;
    }
    text(at, str, { dx = 0, dy = 0, ...o } = {}) { const [x, y] = this.pt(at); return this.textAt(x + dx, y + dy, sub(str), o); }
    dot(at, color = C.ink, tip) { const [cx, cy] = this.pt(at); this.boxes.push({ x: cx - 4, y: cy - 4, width: 8, height: 8 }); this.dots.push([cx, cy]); return this.add('circle', { cx, cy, r: 4, fill: color }, tip); }
    // Dashed lines from a point to both axes.
    guide(q, p, { toX = true, toY = true } = {}) {
      const o = { color: C.guide, width: 1.2, dash: '5 4' };
      if (toY) this.line([this.x[0], p], [q, p], o);
      if (toX) this.line([q, p], [q, this.y[0]], o);
    }
    axes(yTitle = 'Price', xTitle = 'Quantity') {
      const o = { color: C.ink, width: 1.8, arrow: true };
      this.line([this.x[0], this.y[0]], [this.x[0], this.y[1]], o);
      this.line([this.x[0], this.y[0]], [this.x[1], this.y[0]], o);
      const yt = this.text([this.x[0], this.y[1]], yTitle, { dy: -12 }), yb = yt.getBBox();
      if (yb.x < 4) { yt.setAttribute('x', +yt.getAttribute('x') + 4 - yb.x); this.boxes[this.boxes.length - 1] = yt.getBBox(); }   // long titles stay inside the frame
      this.text([this.x[1], this.y[0]], xTitle, { dx: 10, dy: 6, anchor: 'start' });
      this.text([this.x[0], this.y[0]], '0', { dx: -12, dy: 24, anchor: 'end' });
    }
    // Repeated arrowheads along a path, e.g. movement along a curve towards equilibrium.
    chevrons(a, b, color, tip) {
      const [x1, y1] = this.pt(a), [x2, y2] = this.pt(b), dx = x2 - x1, dy = y2 - y1;
      const size = Math.min(12, Math.hypot(dx, dy) * 0.2), angle = Math.atan2(dy, dx) * 180 / Math.PI;
      this.segs.push({ seg: [x1, y1, x2, y2], kind: 'curve' });
      const g = this.add('g', {}, tip);
      for (const t of [0, 0.33, 0.66]) svgEl('polygon', { points: `${size},0 0,${-size * 0.42} 0,${size * 0.42}`, fill: color,
        transform: `translate(${x1 + t * dx} ${y1 + t * dy}) rotate(${angle})` }, g);
      return g;
    }

    /* Labels placed after everything else is drawn (see finish). */
    // Axis value labels: prices in one column left of the axis, quantities in one row below it.
    // Labels with the same value are joined ("Q_0 = Q_1"); crowded labels are spread out with a grey leader line.
    pLabel(v, str, { color = C.ink, tip } = {}) { this.axisQueue.p.push({ v, str, color, tip, part: this.partName }); }
    qLabel(v, str, { color = C.ink, tip } = {}) { this.axisQueue.q.push({ v, str, color, tip, part: this.partName }); }
    // Arrows beside the axes showing the direction of a price or quantity change. Placed after the axis labels,
    // just outside the label column (prices) or below the label row (quantities), so they never cut through a label.
    pChange(from, to, { color = C.red, tip } = {}) { if (Math.abs(to - from) > 1e-7) this.changeQueue.push({ axis: 'p', from, to, color, tip, part: this.partName }); }
    qChange(from, to, { color = C.red, tip, label, both } = {}) { if (Math.abs(to - from) > 1e-7) this.changeQueue.push({ axis: 'q', from, to, color, tip, label, both, part: this.partName }); }
    placeChanges() {
      const pBoxes = this.boxes.filter(b => b.x + b.width <= this.l - 4 && b.y > this.t - 10 && b.y < this.b);
      const qBoxes = this.boxes.filter(b => b.y >= this.b + 2 && b.x > this.l - 20);
      const x = Math.max(10, Math.min(this.l - 50, ...pBoxes.map(b => b.x)) - 14);
      const y = Math.max(this.b + 44, ...qBoxes.map(b => b.y + b.height)) + 10;
      for (const c of this.changeQueue) {
        this.partName = c.part;
        if (c.axis === 'p') this.line([x, this.Y(c.from)], [x, this.Y(c.to)], { color: c.color, width: 1.5, arrow: true, px: true, tip: c.tip });
        else {
          this.line([this.X(c.from), y], [this.X(c.to), y], { color: c.color, width: 1.5, arrow: !c.both, both: c.both, px: true, tip: c.tip });
          if (c.label) this.textAt((this.X(c.from) + this.X(c.to)) / 2, y + 18, sub(c.label), { color: c.color, size: '78%', tip: c.tip });   // e.g. "Retrenchment"
        }
      }
      return y;
    }
    // Labels for points, curve ends and shaded areas: tried at several spots around `at` (preferred direction first,
    // nearest first) and put wherever they cross no curve and touch no other label.
    // gap: distances to try in px; 0 allows the label to sit centred on the point (used for areas).
    pointLabel(at, str, { color = C.ink, tip, prefer = 'ne', gap = [7, 16, 28, 44, 62], size } = {}) { this.pointQueue.push({ at, str, color, tip, prefer, gap, size, part: this.partName }); }
    // Phenomenon labels ("Shortage at P_0", "Unemployment", "Increase in demand"): an arrow from a to b with a smaller
    // label centred over it. The label never moves sideways; it only rises further above the arrow to clear curves.
    span(a, b, str, { color = C.red, tip, labelTip, both = true } = {}) {
      this.line(a, b, { color, width: 2, both, arrow: !both, tip });
      this.spanQueue.push({ a: this.pt(a), b: this.pt(b), str, color, tip: labelTip, part: this.partName });
    }

    layoutAxis(axis) {
      const isP = axis === 'p', groups = [];
      for (const it of this.axisQueue[axis]) {
        const g = groups.find(g => Math.abs(g.v - it.v) < 1e-6);
        g ? g.parts.push(it) : groups.push({ v: it.v, parts: [it] });
      }
      const colX = this.l - 16, rowY = this.b + 26;
      const items = groups.map(g => {
        const target = isP ? this.Y(g.v) : this.X(g.v);
        const str = g.parts.map(p => `<tspan fill="${p.color}"${p.part ? ` data-part="${p.part}"` : ''}>${sub(p.str)}</tspan>`).join(' = ');
        const tips = g.parts.map(p => p.tip).filter(Boolean);
        const e = this.add('text', { x: isP ? colX : target, y: isP ? target + 6 : rowY, 'text-anchor': isP ? 'end' : 'middle',
          stroke: BG, 'stroke-width': 4, 'stroke-linejoin': 'round', 'paint-order': 'stroke' });
        if (tips.length) this.tip(e, null, tips.map(tipText).join(' '));
        e.innerHTML = str;
        const bb = e.getBBox();
        return { e, target, pos: target, size: isP ? bb.height : bb.width };
      }).sort((a, b) => a.pos - b.pos);
      // Keep price labels above the origin and quantity labels right of it.
      spread(items, isP ? 2 : 12, isP ? { max: this.b - 12 } : { min: this.l + 14 });
      for (const it of items) {
        it.e.setAttribute(isP ? 'y' : 'x', isP ? it.pos + 6 : it.pos);
        if (Math.abs(it.pos - it.target) > 1) {   // displaced: grey leader back to the true value on the axis
          const leader = isP ? [colX + 2, it.pos, this.l - 2, it.target] : [it.pos, rowY - 18, it.target, this.b + 2];
          svgEl('line', { x1: leader[0], y1: leader[1], x2: leader[2], y2: leader[3], stroke: C.guide, 'stroke-width': 1 }, this.g);
        }
        this.boxes.push(it.e.getBBox());
      }
    }
    placePoints() {
      const [, , W, H] = this.svg.getAttribute('viewBox').split(' ').map(Number);
      const D = { ne: [1, -1], nw: [-1, -1], se: [1, 1], sw: [-1, 1], e: [1, 0], w: [-1, 0], n: [0, -1], s: [0, 1] };
      for (const lab of this.pointQueue) {
        this.partName = lab.part;
        const dirs = [D[lab.prefer], ...Object.values(D).filter(v => v !== D[lab.prefer])];
        const [px, py] = this.pt(lab.at);
        const e = this.textAt(px, py, sub(lab.str), { color: lab.color, tip: lab.tip, size: lab.size });
        this.boxes.pop();
        const bb = e.getBBox(), w = bb.width, h = bb.height, baseline = bb.y + h / 2 - py;
        let best = null;
        dirs.forEach(([ux, uy], i) => lab.gap.forEach((d, j) => {
          const cx = px + ux * (d + (d ? w / 2 : 0)), cy = py + uy * (d + (d ? h / 2 : 0));
          const box = { x: cx - w / 2, y: cy - h / 2, width: w, height: h };
          let score = i * 0.5 + j * 4;
          if (box.x < 0 || box.y < 0 || box.x + w > W || box.y + h > H) score += 1000;
          if (box.y > this.b - 2 || box.x + w < this.l + 2) score += 25;   // below the quantity axis or left of the price axis: reserved for axis values
          for (const s of this.segs) if (segHitsBox(s.seg, box)) score += s.kind === 'curve' ? 100 : 6;
          for (const b of this.boxes) if (boxesOverlap(box, b, 2)) score += 100;
          const own = Math.hypot(cx - px, cy - py);
          if (this.dots.some(([dx, dy]) => (Math.abs(dx - px) > 1 || Math.abs(dy - py) > 1) && Math.hypot(cx - dx, cy - dy) < own)) score += 60;
          if (!best || score < best.score) best = { score, cx, cy, box };
        }));
        e.setAttribute('x', best.cx);
        e.setAttribute('y', best.cy - baseline);
        this.boxes.push(best.box);
      }
    }
    placeSpans() {
      for (const lab of this.spanQueue) {
        this.partName = lab.part;
        const cx = (lab.a[0] + lab.b[0]) / 2, top = Math.min(lab.a[1], lab.b[1]);
        const e = this.textAt(cx, top, sub(lab.str), { color: lab.color, size: '78%', tip: lab.tip });
        this.boxes.pop();
        const bb = e.getBBox(), h = bb.height, baseline = bb.y + h / 2 - top;
        let best = null;
        for (const [j, d] of [6, 14, 24, 36, 50, 66].entries()) {
          const cy = top - d - h / 2, box = { x: cx - bb.width / 2, y: cy - h / 2, width: bb.width, height: h };
          let score = j * 4;
          for (const s of this.segs) if (segHitsBox(s.seg, box)) score += s.kind === 'curve' ? 100 : 6;
          for (const b of this.boxes) if (boxesOverlap(box, b, 2)) score += 100;
          if (!best || score < best.score) best = { score, cy, box };
        }
        e.setAttribute('y', best.cy - baseline);
        this.boxes.push(best.box);
      }
    }
    finish() {
      this.partName = null;
      this.layoutAxis('p'); this.layoutAxis('q'); this.changeY = this.placeChanges(); this.placeSpans(); this.placePoints();
      this.partName = null;
    }
    // Greys out every part not named in focus (used by guided steps).
    mute(focus) {
      const grey = '#bdb8ac', greyText = '#a8a397', m = this.marker(grey);
      for (const el of this.g.querySelectorAll('[data-part]')) {
        if (focus.includes(el.dataset.part) || el.dataset.part === 'axes') continue;
        for (const n of [el, ...el.querySelectorAll('*')]) {
          const st = n.getAttribute('stroke'), fill = n.getAttribute('fill');
          if (st && st !== 'none' && st !== BG) n.setAttribute('stroke', grey);
          if (fill && fill !== 'none') n.setAttribute('fill', n.tagName === 'text' || n.tagName === 'tspan' ? greyText : grey);
          for (const a of ['marker-start', 'marker-end']) if (n.hasAttribute(a)) n.setAttribute(a, m);
        }
      }
    }
  }

  /* ---------- Widget registry, page shell and controls ---------- */
  const widgets = {};
  let def, state, svg;
  const register = d => { widgets[d.id] = d; };

  // Controls. Any of label, ends (slider end captions) and options (radio choices) may be a function of the state,
  // for controls whose wording or choices depend on other settings; they are refreshed on every change.
  const val = (v, ...args) => typeof v === 'function' ? v(...args) : v;
  function controlEl(c) {
    const id = 'c-' + c.id;
    if (c.type === 'check') return html('label', { class: 'check' }, `<input type="checkbox" id="${id}"> <span class="lbl"></span>`);
    if (c.type === 'radio') return html('fieldset', { class: 'radio' }, '<legend class="lbl"></legend><div class="opts"></div>');
    // Sliders: ticks = [[value, 'label'], ...] marks points on the scale; otherwise the two ends (and 0) are captioned.
    // max may be a function of the state; format(value, state) shows a live readout beside the label.
    const max = typeof c.max === 'function' ? 100 : c.max, at = v => (v - c.min) / (max - c.min) * 100;
    const ticks = c.ticks ? c.ticks.map(([v, t]) => `<span class="tick" style="left:${at(v)}%">${t}</span>`).join('')
      : `<span class="end-min"></span>${c.min < 0 && max > 0 ? `<span class="tick" style="left:${at(0)}%">0</span>` : ''}<span class="end-max"></span>`;
    return html('div', { class: 'slider' }, `<label for="${id}"><span class="lbl"></span>${c.format ? ` <span class="readout" id="r-${c.id}"></span>` : ''}</label>
      <input type="range" id="${id}" min="${c.min}" max="${max}" step="${c.step || 1}">
      <div class="ends${c.ticks ? ' ticked' : ''}">${ticks}</div>`);
  }
  function syncControls() {
    for (const c of def.controls) {
      const box = $('#ctl-' + c.id);
      box.querySelector('.lbl').innerHTML = val(c.label, state);
      if (c.type === 'radio') {
        const opts = val(c.options, state), key = JSON.stringify(opts), holder = box.querySelector('.opts');
        if (holder.dataset.key !== key) {
          holder.dataset.key = key;
          holder.innerHTML = opts.map(([v, t]) => `<label><input type="radio" name="c-${c.id}" value="${v}"> ${t}</label>`).join('');
        }
        if (!opts.some(([v]) => v === state[c.id]) && state[c.id] !== '') state[c.id] = opts[0][0];
        box.querySelectorAll('input').forEach(r => { r.checked = r.value === state[c.id]; });
      } else if (c.type === 'check') $('#c-' + c.id).checked = state[c.id];
      else {
        const input = $('#c-' + c.id);
        let m = c.max;
        if (typeof c.max === 'function') {
          m = c.max(state);
          input.max = m;
          state[c.id] = Math.min(state[c.id], m);
        }
        if (!c.ticks) {
          const ends = val(c.ends, state) || [c.min, m];
          box.querySelector('.end-min').innerHTML = val(ends[0], m);
          box.querySelector('.end-max').innerHTML = val(ends[1] ?? m, m);
        }
        input.value = state[c.id];
        if (c.format) $('#r-' + c.id).innerHTML = c.format(state[c.id], state);
      }
      const hint = $('#h-' + c.id);
      if (hint) hint.innerHTML = val(c.hint, state);
    }
    $('#c-tips').checked = state.tips;
  }
  function readControl(c, e) {
    state[c.id] = c.type === 'check' ? e.target.checked : c.type === 'radio' ? e.target.value : +e.target.value;
    c.onChange?.(state);
    syncControls();
    render();
  }
  function reset() {
    state = { tips: true, step: 1 };
    for (const c of def.controls) state[c.id] = c.value ?? (c.type === 'check' ? false : c.type === 'radio' ? val(c.options, state)[0][0] : 0);
    syncControls();
    render();
  }

  function render() {
    hideTip();
    svg.querySelectorAll(':scope > :not(title, desc)').forEach(e => e.remove());
    const plot = new Plot(svg, def.plot);
    const out = def.draw(plot, state, C) || {};
    plot.finish();
    if (out.focus) plot.mute(out.focus);
    for (const c of def.controls) $('#ctl-' + c.id).hidden = c.showIf ? !c.showIf(state) : false;
    $('#controls').hidden = def.controls.every(c => $('#ctl-' + c.id).hidden);
    if (def.steps) renderStep(out);
    buildGlossary();
    $('#result').innerHTML = out.result || '';
    $('#notes').innerHTML = out.notes || '';
    $('#diagram-desc').textContent = (out.desc || '').replace(/_(\{[^}]*\}|[A-Za-z0-9]+)/g, '$1');   // plain text for screen readers: P_0 -> P0
  }

  /* ---------- Guided widgets: def.steps = [{ title, text(state) }] ---------- */
  function renderStep(out) {
    const n = def.steps.length, step = def.steps[state.step - 1];
    $('#step-count').textContent = `Step ${state.step} of ${n}`;
    $('#step-title').textContent = step.title;
    $('#step-text').innerHTML = step.text(state);
    $('#step-back').disabled = state.step === 1;
    $('#step-next').textContent = state.step === n ? 'Start again' : 'Next';
    $('#step-msg').textContent = '';
  }
  function goStep(delta) {
    if (!def.steps) return;
    const n = def.steps.length;
    if (delta > 0 && state.step === n) { reset(); return; }
    if (delta > 0 && def.canAdvance && !def.canAdvance(state)) { $('#step-msg').textContent = def.blockedMessage || ''; return; }
    state.step = Math.min(n, Math.max(1, state.step + delta));
    render();
  }

  function openWidget(id) {
    def = widgets[id];
    document.title = def.title + ' · Economics diagrams';
    $('#w-title').textContent = def.title;
    $('#w-guided').hidden = !def.guided;
    $('#diagram-title').textContent = def.title;
    const box = $('#controls');
    box.replaceChildren();
    $('#stepper').hidden = !def.steps;
    glossaryShown = null;
    $('#controls').hidden = false;
    for (const c of def.controls) {
      const n = controlEl(c);
      n.id = 'ctl-' + c.id;
      if (c.hint) n.append(html('p', { class: 'hint', id: 'h-' + c.id }));
      n.addEventListener('input', e => readControl(c, e));
      box.append(n);
    }

    $('#about').hidden = !def.about;
    $('#about-text').innerHTML = def.about || '';
    $('#glossary-btn').hidden = !def.glossary;
    showGlossary(false);
    reset();
  }

  /* ---------- Tooltips ---------- */
  function showTip(target, e) {
    if (!state.tips || !target?.dataset?.tip) return;
    const tip = $('#tip'), stage = $('#stage').getBoundingClientRect();
    tip.innerHTML = target.dataset.tip;   // tips.js is trusted teacher-written content; simple HTML such as <strong> is allowed
    tip.hidden = false;
    const r = target.getBoundingClientRect();
    const x = (e?.clientX ?? r.x + r.width / 2) - stage.left, y = (e?.clientY ?? r.y) - stage.top;
    tip.style.left = Math.max(8, Math.min(x + 14, stage.width - tip.offsetWidth - 8)) + 'px';
    tip.style.top = Math.max(8, Math.min(y + 14, stage.height - tip.offsetHeight - 8)) + 'px';
  }
  function hideTip() { const t = $('#tip'); if (t) t.hidden = true; }

  /* ---------- Glossary panel ---------- */
  // def.glossary is a list of keys, or a function of the state for widgets whose relevant terms change.
  let glossaryShown = '';
  function buildGlossary() {
    const keys = (typeof def.glossary === 'function' ? def.glossary(state) : def.glossary || []).filter(k => EW.glossary[k]);
    if (keys.join() === glossaryShown) return;
    glossaryShown = keys.join();
    $('#glossary-list').innerHTML = keys.map(k => `<details><summary>${EW.glossary[k].term}</summary>${EW.glossary[k].def}${def.glossaryNotes?.[k] ? `<p class="note">In this diagram: ${def.glossaryNotes[k]}</p>` : ''}</details>`).join('');
  }
  function showGlossary(on) {
    $('#glossary').hidden = !on;
    $('#panel-main').hidden = on;
    $('#glossary-btn').setAttribute('aria-pressed', on);
  }

  /* ---------- Export (PNG, colour or greyscale for printing) ---------- */
  const grey = hex => {
    const n = parseInt(hex.slice(1), 16), l = Math.round(0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255));
    return '#' + l.toString(16).padStart(2, '0').repeat(3);
  };
  function snapshot(greyscale) {
    const clone = svg.cloneNode(true);
    clone.setAttribute('xmlns', NS);
    clone.querySelectorAll('[tabindex]').forEach(e => e.removeAttribute('tabindex'));
    clone.prepend(svgEl('rect', { width: '100%', height: '100%', fill: '#fff' }));
    if (greyscale) {
      const defs = clone.querySelector('defs');
      for (const [id, d] of [['diagonal', 'M0 8L8 0'], ['horizontal', 'M0 4H8'], ['vertical', 'M4 0V8'], ['cross', 'M0 8L8 0M0 0L8 8']]) {
        const p = svgEl('pattern', { id: 'hatch-' + id, width: 8, height: 8, patternUnits: 'userSpaceOnUse' }, defs);
        svgEl('path', { d, stroke: '#555', 'stroke-width': 1 }, p);
      }
      clone.querySelectorAll('*').forEach(e => {
        for (const a of ['fill', 'stroke']) { const v = e.getAttribute(a); if (/^#[0-9a-f]{6}$/i.test(v || '')) e.setAttribute(a, grey(v)); }
        if (e.dataset?.hatch) { e.setAttribute('fill', `url(#hatch-${e.dataset.hatch})`); e.setAttribute('fill-opacity', 1); }
      });
    }
    const [, , w, h] = svg.getAttribute('viewBox').split(' ').map(Number);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const cv = html('canvas', { width: w * 2, height: h * 2 });
        const ctx = cv.getContext('2d');
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0, w, h);
        cv.toBlob(resolve, 'image/png');
      };
      img.onerror = reject;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
    });
  }
  const isGrey = () => $('input[name="img-style"]:checked').value === 'grey';
  async function download() {
    const blob = await snapshot(isGrey());
    const a = html('a', { href: URL.createObjectURL(blob), download: `${def.id}${isGrey() ? '-greyscale' : ''}.png` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  async function copy() {
    const status = $('#save-status');
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': snapshot(isGrey()) })]);
      status.textContent = 'Copied. Paste it into your slides or worksheet.';
    } catch {
      status.textContent = 'Copying isn’t allowed in this browser or embed. Use Download instead.';
    }
  }

  /* ---------- Topic menu and routing ---------- */
  function buildMenu(menu) {
    $('#menu-list').innerHTML = menu.map(([topic, items]) => `<section><h2>${topic}</h2><ul>${items.map(([ref, name, guided]) =>
      `<li><a href="${ref.endsWith('.html') ? ref : '#' + ref}">${name}</a>${guided ? ' <span class="tag">Guided</span>' : ''}</li>`).join('')}</ul></section>`).join('');
  }
  function route() {
    const id = location.hash.slice(1);
    const inWidget = !!widgets[id];
    document.body.classList.toggle('in-widget', inWidget);
    $('#menu').hidden = inWidget;
    $('#app').hidden = !inWidget;
    if (inWidget) openWidget(id); else document.title = 'Economics diagrams';
  }

  // Flags glossary keys a widget asks for that are missing from glossary.js.
  function checkGlossary() {
    for (const w of Object.values(widgets)) for (const k of [...(Array.isArray(w.glossary) ? w.glossary : []), ...Object.keys(w.glossaryNotes || {})])
      if (!EW.glossary[k]) console.warn(`Widget "${w.id}" lists glossary term "${k}", which is missing from glossary.js`);
  }

  function start(menu) {
    checkGlossary();
    svg = $('#diagram');
    svg.setAttribute('font-family', FONT);
    svg.setAttribute('font-size', 18);
    buildMenu(menu);
    svg.addEventListener('pointerover', e => showTip(e.target.closest('[data-tip]'), e));
    svg.addEventListener('pointerout', e => { if (e.pointerType === 'mouse') hideTip(); });
    svg.addEventListener('click', e => { const t = e.target.closest('[data-tip]'); t ? showTip(t, e) : hideTip(); });
    svg.addEventListener('focusin', e => showTip(e.target));
    svg.addEventListener('focusout', hideTip);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { hideTip(); showGlossary(false); } });
    $('#c-tips').addEventListener('input', e => { state.tips = e.target.checked; hideTip(); });
    $('#reset').onclick = reset;
    $('#step-back').onclick = () => goStep(-1);
    $('#step-next').onclick = () => goStep(1);
    // Presentation clickers and arrow keys move through guided steps (unless a slider has focus).
    document.addEventListener('keydown', e => {
      if (!def?.steps || $('#app').hidden || e.target.matches('input, select, textarea')) return;
      if (['ArrowRight', 'PageDown'].includes(e.key)) { e.preventDefault(); goStep(1); }
      if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); goStep(-1); }
    });
    $('#download').onclick = download;
    $('#copy').onclick = copy;
    $('#glossary-btn').onclick = () => showGlossary($('#glossary').hidden);
    $('#glossary-close').onclick = () => showGlossary(false);
    addEventListener('hashchange', route);
    route();
  }

  /* ---------- Summary table (#result): two columns, label | result. Rows are [label, value]; falsy rows are skipped. ---------- */
  const near0 = v => Math.abs(v) < 1e-8;
  const CHG = v => near0(v) ? 'Unchanged' : v > 0 ? 'Increases' : 'Decreases';   // Increases / Decreases / Unchanged
  const chg = (v, a, b) => `${CHG(v)} (${a} ${near0(v) ? '=' : '→'} ${b})`;     // e.g. "Increases (P_0 → P_1)"
  const summary = rows => `<table class="summary"><tbody>${rows.filter(Boolean).map(([k, v]) => `<tr><th scope="row">${sub(k, false)}</th><td>${sub(v, false)}</td></tr>`).join('')}</tbody></table>`;
  // Title Case for short categorical values ("Research and development" -> "Research and Development").
  const SMALL = new Set(['and', 'or', 'of', 'the', 'to', 'in', 'on', 'a', 'an', 'for', 'vs', 'by', 'at']);
  const tc = t => String(t).replace(/[A-Za-z][A-Za-z’'-]*/g, (w, i) => i > 0 && SMALL.has(w) ? w : w[0].toUpperCase() + w.slice(1));
  return { register, start, C, sub, summary, CHG, chg, tc, tables: {}, glossary: {}, tips: {} };
})();
