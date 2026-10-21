/* Fig. 0 — a small model-predictive agent.
 * Each planning step, the agent imagines K action sequences in a (coarse) model of a time-varying flow
 * field, scores them by goal distance and obstacle cost, refits the sampling distribution to the elites
 * (cross-entropy method), and executes the first action of the mean plan. The cursor is the goal.
 */
(() => {
  "use strict";
  const canvas = document.getElementById("world");
  const hero = document.getElementById("top");
  if (!canvas || !hero || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const still = window.matchMedia("(prefers-reduced-motion: reduce)");
  const hudCost = document.getElementById("hud-cost");
  const hudT = document.getElementById("hud-t");

  const K = 24, HORIZON = 40, ELITES = 5, ITERS = 2, SUB = 3;
  const SPEED = 2.0, TURN = 0.07, FLOW_GAIN = 0.6, GRID = 28;

  let W = 0, H = 0, dpr = 1, S = 1, wide = true;
  let palette = null;
  let frame = 0, clock = 0, last = 0, running = false, onScreen = true, raf = 0;
  const agent = { x: 0, y: 0, th: 0, lastA: 0 };
  const goal = { x: 0, y: 0 }, shownGoal = { x: 0, y: 0 };
  let pointer = null, pointerUntil = 0;
  let obstacles = [];
  const trail = [];
  let memory = new Float32Array(0), cols = 0, rows = 0;
  const mean = new Float32Array(HORIZON), std = new Float32Array(HORIZON).fill(0.6);
  const samples = Array.from({ length: ITERS }, () => Array.from({ length: K }, () => ({ a: new Float32Array(HORIZON), p: new Float32Array(2 * HORIZON + 2), c: 0, elite: false })));
  const planPts = new Float32Array(2 * HORIZON + 2);
  let planCost = 0;
  const ghost = document.createElement("canvas");
  const gctx = ghost.getContext("2d");
  const tmp = { x: 0, y: 0 };

  /* ——— colours from CSS custom properties ——— */
  function hex(value) {
    const h = (value || "").trim().replace("#", "");
    const full = h.length === 3 ? h.split("").map(c => c + c).join("") : h.padEnd(6, "8");
    const n = parseInt(full.slice(0, 6), 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }
  function readPalette() {
    const cs = getComputedStyle(document.documentElement);
    palette = {
      text: hex(cs.getPropertyValue("--text")), muted: hex(cs.getPropertyValue("--muted")), faint: hex(cs.getPropertyValue("--faint")),
      accent: hex(cs.getPropertyValue("--accent")), cool: hex(cs.getPropertyValue("--cool")),
      light: document.documentElement.dataset.theme === "light"
    };
  }
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  /* ——— world: divergence-free flow from a sum of travelling waves ——— */
  const waves = [
    { a: 1.0, kx: 0.0046, ky: 0.0029, w: 0.0040, p: 0.3 },
    { a: 0.8, kx: -0.0026, ky: 0.0052, w: -0.0031, p: 1.7 },
    { a: 0.6, kx: 0.0068, ky: -0.0021, w: 0.0045, p: 2.9 },
    { a: 0.5, kx: -0.0057, ky: -0.0061, w: 0.0026, p: 4.1 }
  ];
  function flow(x, y, t, out) {
    let dx = 0, dy = 0;
    const u = x / S, v = y / S;
    for (let i = 0; i < waves.length; i++) {
      const w = waves[i];
      const c = w.a * Math.cos(w.kx * u + w.ky * v + w.w * t + w.p);
      dx += c * w.kx; dy += c * w.ky;
    }
    out.x = dy * 95; out.y = -dx * 95;
    return out;
  }

  /* ——— layout ——— */
  function region() {
    // Where the action happens: the right side on wide screens, the upper part on narrow ones.
    return wide ? { x0: 0.5 * W, x1: 0.94 * W, y0: 0.16 * H, y1: 0.84 * H } : { x0: 0.08 * W, x1: 0.92 * W, y0: 0.14 * H, y1: 0.5 * H };
  }
  function layoutObstacles() {
    const r = region();
    const spots = wide
      ? [[0.62, 0.34, 58], [0.8, 0.62, 74], [0.9, 0.24, 44], [0.56, 0.74, 46]]
      : [[0.3, 0.26, 40], [0.72, 0.38, 50], [0.52, 0.12, 30]];
    obstacles = spots.map(([fx, fy, rad], i) => ({
      bx: wide ? fx * W : r.x0 + (fx * (r.x1 - r.x0)) / 1, by: wide ? fy * H : fy * H + 0.08 * H,
      r: rad * S, x: 0, y: 0, phase: i * 1.9, amp: 18 * S
    }));
    moveObstacles();
  }
  function moveObstacles() {
    for (const o of obstacles) {
      o.x = o.bx + Math.sin(clock * 0.0045 + o.phase) * o.amp;
      o.y = o.by + Math.cos(clock * 0.0037 + o.phase * 1.3) * o.amp;
    }
  }
  function clearOf(x, y, pad) {
    return obstacles.every(o => Math.hypot(x - o.x, y - o.y) > o.r + pad);
  }
  function newWaypoint() {
    const r = region();
    for (let i = 0; i < 40; i++) {
      const x = r.x0 + Math.random() * (r.x1 - r.x0), y = r.y0 + Math.random() * (r.y1 - r.y0);
      if (clearOf(x, y, 30 * S) && Math.hypot(x - agent.x, y - agent.y) > 180 * S) { goal.x = x; goal.y = y; return; }
    }
    goal.x = (r.x0 + r.x1) / 2; goal.y = (r.y0 + r.y1) / 2;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const firstTime = W === 0;
    const oldW = W, oldH = H;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    wide = W > 720;
    S = Math.max(0.7, Math.min(1.25, Math.min(W, H) / 820));
    for (const c of [canvas, ghost]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(W / GRID) + 1; rows = Math.ceil(H / GRID) + 1;
    memory = new Float32Array(cols * rows);
    layoutObstacles();
    const r = region();
    if (firstTime || agent.x > W || agent.y > H) {
      agent.x = r.x0 + 0.25 * (r.x1 - r.x0); agent.y = (r.y0 + r.y1) / 2 + 40 * S; agent.th = -0.4;
      newWaypoint(); shownGoal.x = goal.x; shownGoal.y = goal.y;
      trail.length = 0;
    } else if (oldW && oldH) {
      agent.x *= W / oldW; agent.y *= H / oldH; goal.x *= W / oldW; goal.y *= H / oldH;
      trail.length = 0;
    }
    plan(); paintImagination();
    if (!running) draw();
  }

  /* ——— planning (cross-entropy method in the coarse model) ——— */
  function gauss() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function rollout(actions, pts) {
    let x = agent.x, y = agent.y, th = agent.th, prev = agent.lastA, cost = 0;
    const margin = 18 * S;
    pts[0] = x; pts[1] = y;
    for (let h = 0; h < HORIZON; h++) {
      const a = actions[h];
      th += a * TURN * SUB;
      flow(x, y, clock + h * SUB, tmp);
      x += (Math.cos(th) * SPEED + tmp.x * FLOW_GAIN) * S * SUB;
      y += (Math.sin(th) * SPEED + tmp.y * FLOW_GAIN) * S * SUB;
      pts[2 * h + 2] = x; pts[2 * h + 3] = y;
      for (let i = 0; i < obstacles.length; i++) {
        const o = obstacles[i];
        const d = Math.hypot(x - o.x, y - o.y) - o.r - margin;
        if (d < 0) cost += 30 + (d * d) / (S * S) * 0.25;
      }
      if (x < margin || x > W - margin || y < margin || y > H - margin) cost += 25;
      cost += Math.hypot(x - goal.x, y - goal.y) / S * 0.03;
      cost += (a - prev) * (a - prev) * 1.2;
      prev = a;
    }
    return cost + Math.hypot(x - goal.x, y - goal.y) / S * 0.5;
  }
  function plan() {
    for (let h = 0; h < HORIZON - 1; h++) { mean[h] = mean[h + 1]; std[h] = Math.max(std[h + 1], 0.45); }
    mean[HORIZON - 1] = mean[HORIZON - 2]; std[HORIZON - 1] = 0.6;
    for (let it = 0; it < ITERS; it++) {
      const set = samples[it];
      for (let k = 0; k < K; k++) {
        const s = set[k];
        let n = gauss();
        for (let h = 0; h < HORIZON; h++) {
          n = 0.82 * n + 0.57 * gauss(); // temporally correlated exploration noise
          const a = k === 0 ? mean[h] : mean[h] + std[h] * n;
          s.a[h] = a < -1 ? -1 : a > 1 ? 1 : a;
        }
        s.c = rollout(s.a, s.p);
        s.elite = false;
      }
      const order = set.slice().sort((p, q) => p.c - q.c);
      for (let e = 0; e < ELITES; e++) order[e].elite = true;
      for (let h = 0; h < HORIZON; h++) {
        let m = 0;
        for (let e = 0; e < ELITES; e++) m += order[e].a[h];
        m /= ELITES;
        let v = 0;
        for (let e = 0; e < ELITES; e++) v += (order[e].a[h] - m) ** 2;
        mean[h] = m; std[h] = Math.max(Math.sqrt(v / ELITES), 0.06);
      }
    }
    planCost = rollout(mean, planPts);
  }

  /* ——— simulation ——— */
  function step() {
    clock += 1; frame += 1;
    moveObstacles();
    const r = region();
    const now = performance.now();
    if (pointer && now < pointerUntil) { goal.x = pointer.x; goal.y = pointer.y; }
    else {
      pointer = null;
      if (Math.hypot(agent.x - goal.x, agent.y - goal.y) < 34 * S || !clearOf(goal.x, goal.y, 10 * S) || goal.x < r.x0 - 40 || goal.x > r.x1 + 40 || goal.y < r.y0 - 40 || goal.y > r.y1 + 40) newWaypoint();
    }
    shownGoal.x += (goal.x - shownGoal.x) * 0.12;
    shownGoal.y += (goal.y - shownGoal.y) * 0.12;

    if (frame % SUB === 0) { plan(); paintImagination(); }
    const a = mean[0];
    agent.lastA = a;
    agent.th += a * TURN;
    flow(agent.x, agent.y, clock, tmp);
    agent.x += (Math.cos(agent.th) * SPEED + tmp.x * FLOW_GAIN) * S;
    agent.y += (Math.sin(agent.th) * SPEED + tmp.y * FLOW_GAIN) * S;
    // Obstacles are solid: slide along the boundary if the plan was not good enough.
    for (const o of obstacles) {
      const d = Math.hypot(agent.x - o.x, agent.y - o.y);
      if (d < o.r + 4 * S) { const k = (o.r + 4 * S) / d; agent.x = o.x + (agent.x - o.x) * k; agent.y = o.y + (agent.y - o.y) * k; }
    }
    if (agent.x < -60 || agent.x > W + 60 || agent.y < -60 || agent.y > H + 60) {
      agent.x = (r.x0 + r.x1) / 2; agent.y = (r.y0 + r.y1) / 2; trail.length = 0; mean.fill(0);
    }
    trail.push(agent.x, agent.y);
    if (trail.length > 2 * 220) trail.splice(0, 2);

    // Observation updates the memory map; memory slowly fades.
    const R = 130 * S;
    const c0 = Math.max(0, Math.floor((agent.x - R) / GRID)), c1 = Math.min(cols - 1, Math.ceil((agent.x + R) / GRID));
    const r0 = Math.max(0, Math.floor((agent.y - R) / GRID)), r1 = Math.min(rows - 1, Math.ceil((agent.y + R) / GRID));
    for (let j = r0; j <= r1; j++) for (let i = c0; i <= c1; i++) {
      const d = Math.hypot(i * GRID - agent.x, j * GRID - agent.y);
      if (d < R) { const idx = j * cols + i; memory[idx] = Math.max(memory[idx], 1 - d / R); }
    }
    for (let i = 0; i < memory.length; i++) memory[i] *= 0.9982;
  }

  function paintImagination() {
    // Ghost layer: imagined futures leave a short afterglow.
    gctx.globalCompositeOperation = "destination-out";
    gctx.fillStyle = "rgba(0,0,0,0.42)";
    gctx.fillRect(0, 0, W, H);
    gctx.globalCompositeOperation = "source-over";
    gctx.lineCap = "round"; gctx.lineJoin = "round";
    for (let it = 0; it < ITERS; it++) {
      for (const s of samples[it]) {
        gctx.beginPath();
        gctx.moveTo(s.p[0], s.p[1]);
        for (let h = 1; h <= HORIZON; h++) gctx.lineTo(s.p[2 * h], s.p[2 * h + 1]);
        const strong = it === ITERS - 1 && s.elite;
        gctx.strokeStyle = rgba(palette.cool, strong ? (palette.light ? 0.5 : 0.42) : (palette.light ? 0.2 : 0.14));
        gctx.lineWidth = strong ? 1.2 : 0.8;
        gctx.stroke();
        if (strong) {
          gctx.fillStyle = rgba(palette.cool, 0.55);
          gctx.beginPath(); gctx.arc(s.p[2 * HORIZON], s.p[2 * HORIZON + 1], 1.6, 0, Math.PI * 2); gctx.fill();
        }
      }
    }
  }

  /* ——— drawing ——— */
  function drawField() {
    const buckets = 5;
    const paths = Array.from({ length: buckets }, () => new Path2D());
    const dots = new Path2D();
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = i * GRID, y = j * GRID;
        const m = memory[j * cols + i];
        if (m < 0.06) { dots.rect(x - 0.7, y - 0.7, 1.4, 1.4); continue; }
        flow(x, y, clock, tmp);
        const L = 7.5;
        const b = Math.min(buckets - 1, Math.floor(m * buckets));
        paths[b].moveTo(x - tmp.x * L, y - tmp.y * L);
        paths[b].lineTo(x + tmp.x * L, y + tmp.y * L);
        paths[b].rect(x + tmp.x * L - 0.8, y + tmp.y * L - 0.8, 1.6, 1.6);
      }
    }
    ctx.fillStyle = rgba(palette.muted, palette.light ? 0.26 : 0.2);
    ctx.fill(dots);
    ctx.lineWidth = 1;
    for (let b = 0; b < buckets; b++) {
      ctx.strokeStyle = rgba(palette.cool, (palette.light ? 0.16 : 0.12) + 0.55 * (b + 1) / buckets);
      ctx.stroke(paths[b]);
    }
  }
  function drawObstacles() {
    for (const o of obstacles) {
      ctx.save();
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fillStyle = rgba(palette.muted, palette.light ? 0.08 : 0.06);
      ctx.fill();
      ctx.clip();
      ctx.beginPath();
      for (let d = -o.r * 2; d < o.r * 2; d += 7) { ctx.moveTo(o.x + d - o.r, o.y - o.r); ctx.lineTo(o.x + d + o.r, o.y + o.r); }
      ctx.strokeStyle = rgba(palette.muted, palette.light ? 0.22 : 0.16);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = rgba(palette.muted, palette.light ? 0.5 : 0.38);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  function label(base, sub, x, y, color) {
    ctx.fillStyle = color;
    ctx.font = 'italic 17px "Instrument Serif", Georgia, serif';
    ctx.fillText(base, x, y);
    if (sub) {
      const w = ctx.measureText(base).width;
      ctx.font = '11px "SF Mono", ui-monospace, Menlo, monospace';
      ctx.fillText(sub, x + w + 1, y + 4);
    }
  }
  function drawPlan() {
    // committed plan: amber, fading toward the horizon
    ctx.lineCap = "round";
    for (let h = 0; h < HORIZON; h++) {
      const a = 0.95 * (1 - h / HORIZON) + 0.1;
      ctx.strokeStyle = rgba(palette.accent, a);
      ctx.lineWidth = 2.4 - 1.4 * h / HORIZON;
      ctx.beginPath();
      ctx.moveTo(planPts[2 * h], planPts[2 * h + 1]);
      ctx.lineTo(planPts[2 * h + 2], planPts[2 * h + 3]);
      ctx.stroke();
    }
    ctx.fillStyle = rgba(palette.accent, 0.9);
    for (let h = 4; h <= HORIZON; h += 6) { ctx.beginPath(); ctx.arc(planPts[2 * h], planPts[2 * h + 1], 1.7, 0, Math.PI * 2); ctx.fill(); }
    const ex = planPts[2 * HORIZON], ey = planPts[2 * HORIZON + 1];
    ctx.strokeStyle = rgba(palette.accent, 0.6); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(ex, ey, 4, 0, Math.PI * 2); ctx.stroke();
    if (Math.hypot(ex - shownGoal.x, ey - shownGoal.y) > 46) label("ŝ", "t+H", ex + 8, ey - 8, rgba(palette.accent, 0.85));
  }
  function drawTrail() {
    const n = trail.length / 2;
    if (n < 2) return;
    ctx.lineWidth = 1.4;
    for (let i = 1; i < n; i++) {
      ctx.strokeStyle = rgba(palette.text, 0.42 * i / n);
      ctx.beginPath();
      ctx.moveTo(trail[2 * i - 2], trail[2 * i - 1]);
      ctx.lineTo(trail[2 * i], trail[2 * i + 1]);
      ctx.stroke();
    }
  }
  function drawAgent() {
    const R = 130 * S;
    ctx.save();
    ctx.setLineDash([2, 6]);
    ctx.lineDashOffset = -clock * 0.25;
    ctx.strokeStyle = rgba(palette.cool, palette.light ? 0.4 : 0.3);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(agent.x, agent.y, R, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    const pulse = 0.5 + 0.5 * Math.sin(clock * 0.08);
    ctx.fillStyle = rgba(palette.accent, 0.12 + 0.1 * pulse);
    ctx.beginPath(); ctx.arc(agent.x, agent.y, 13 + 4 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = rgba(palette.accent, 1);
    ctx.beginPath(); ctx.arc(agent.x, agent.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = rgba(palette.accent, 1); ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(agent.x, agent.y); ctx.lineTo(agent.x + Math.cos(agent.th) * 14, agent.y + Math.sin(agent.th) * 14); ctx.stroke();
    label("s", "t", agent.x - 22, agent.y + 24, rgba(palette.text, 0.85));
  }
  function drawGoal() {
    const x = shownGoal.x, y = shownGoal.y;
    const spin = clock * 0.01;
    ctx.strokeStyle = rgba(palette.text, 0.85); ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = spin + i * Math.PI / 2;
      ctx.moveTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14);
      ctx.lineTo(x + Math.cos(a) * 20, y + Math.sin(a) * 20);
    }
    ctx.stroke();
    ctx.fillStyle = rgba(palette.text, 0.9);
    ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
    label("g", "", x + 16, y - 14, rgba(palette.text, 0.85));
  }
  function draw() {
    if (!palette || !W) return;
    ctx.clearRect(0, 0, W, H);
    drawField();
    drawObstacles();
    ctx.drawImage(ghost, 0, 0, W, H);
    drawPlan();
    drawTrail();
    drawGoal();
    drawAgent();
    if (frame % 10 === 0) {
      if (hudCost) hudCost.textContent = (planCost / 100).toFixed(3);
      if (hudT) hudT.textContent = String(frame).padStart(6, "0");
    }
  }

  /* ——— loop control ——— */
  function loop(now) {
    raf = 0;
    if (!running) return;
    // Fixed-rate simulation (60 Hz) independent of the display refresh rate.
    const elapsed = Math.min(now - last, 100);
    let steps = Math.round(elapsed / (1000 / 60));
    if (steps > 0) { last = now; while (steps-- > 0) step(); draw(); }
    raf = requestAnimationFrame(loop);
  }
  function start() {
    if (running || still.matches || !onScreen || document.hidden) return;
    running = true; last = performance.now();
    raf = requestAnimationFrame(loop);
  }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  function stillFrame() {
    // Reduced motion: settle the scene, then show a single frame.
    for (let i = 0; i < 150; i++) step();
    draw();
  }

  readPalette();
  resize();
  if (still.matches) stillFrame(); else start();

  new ResizeObserver(() => resize()).observe(canvas);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(entries => { onScreen = entries[0].isIntersecting; if (onScreen) start(); else stop(); }, { threshold: 0 }).observe(hero);
  }
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); else start(); });
  still.addEventListener?.("change", () => { if (still.matches) { stop(); stillFrame(); } else start(); });
  document.addEventListener("themechange", () => { readPalette(); gctx.clearRect(0, 0, W, H); if (!running) draw(); });

  function setPointer(event, ms) {
    const rect = canvas.getBoundingClientRect();
    pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    pointerUntil = performance.now() + ms;
  }
  hero.addEventListener("pointermove", event => { if (event.pointerType === "mouse") setPointer(event, 4000); });
  hero.addEventListener("pointerdown", event => { if (event.pointerType !== "mouse" && !event.target.closest("a,button")) setPointer(event, 6000); });
  hero.addEventListener("pointerleave", event => { if (event.pointerType === "mouse") pointerUntil = performance.now() + 900; });
})();
