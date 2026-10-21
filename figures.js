/* Live conceptual figures for the research section, plus the generated portrait mark.
 * Fig. 1  three cameras observe one object; a wall occludes one view, and the object is tracked through it.
 * Fig. 2  a car approaches an occluded crossing, keeping a particle belief over a possibly hidden car.
 * Fig. 3  two task losses; plain fine-tuning forgets task A, a consolidated update keeps it.
 * These are illustrations of research questions, not experimental results.
 */
(() => {
  "use strict";
  const still = window.matchMedia("(prefers-reduced-motion: reduce)");
  const TAU = Math.PI * 2;
  let P = null;

  function hex(value) {
    const h = (value || "").trim().replace("#", "");
    const full = h.length === 3 ? h.split("").map(c => c + c).join("") : h.padEnd(6, "8");
    const n = parseInt(full.slice(0, 6), 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }
  function readPalette() {
    const cs = getComputedStyle(document.documentElement);
    const get = name => hex(cs.getPropertyValue(name));
    P = { bg: get("--bg"), raise: get("--bg-raise"), text: get("--text"), muted: get("--muted"), faint: get("--faint"), accent: get("--accent"), cool: get("--cool"), violet: get("--violet"), light: document.documentElement.dataset.theme === "light" };
  }
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const words = {
    tracked: ["occluded · tracked", "遮挡 · 持续跟踪"], visible: ["visible", "可见"], occluded: ["occluded", "遮挡区"],
    trainA: ["training on task A", "在任务 A 上训练"], arrivesB: ["task B arrives →", "任务 B 到来 →"],
    finetune: ["fine-tune", "直接微调"], consolidate: ["consolidate", "巩固更新"], taskA: ["task A", "任务 A"], taskB: ["task B", "任务 B"],
    legend: ["▮ consolidate  ▯ fine-tune", "▮ 巩固更新  ▯ 直接微调"], portrait: ["latent portrait · z ~ p(z | name)", "潜空间肖像 · z ~ p(z | name)"]
  };
  const L = key => words[key][document.documentElement.lang === "zh-CN" ? 1 : 0];
  const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const mono = size => `${size}px "SF Mono", ui-monospace, Menlo, Consolas, monospace`;
  const serif = (size, italic = true) => `${italic ? "italic " : ""}${size}px "Instrument Serif", Georgia, serif`;

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function hatch(ctx, x, y, w, h, gap, color) {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.beginPath();
    for (let d = -h; d < w + h; d += gap) { ctx.moveTo(x + d, y + h); ctx.lineTo(x + d + h, y); }
    ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
  }
  function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
    const rX = bx - ax, rY = by - ay, sX = dx - cx, sY = dy - cy;
    const den = rX * sY - rY * sX;
    if (Math.abs(den) < 1e-9) return -1;
    const t = ((cx - ax) * sY - (cy - ay) * sX) / den;
    const u = ((cx - ax) * rY - (cy - ay) * rX) / den;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : -1;
  }
  function segmentHitsRect(x0, y0, x1, y1, r) {
    // Liang–Barsky clipping: does the segment pass through the rectangle?
    let t0 = 0, t1 = 1;
    const dx = x1 - x0, dy = y1 - y0;
    const p = [-dx, dx, -dy, dy], q = [x0 - r.x, r.x + r.w - x0, y0 - r.y, r.y + r.h - y0];
    for (let i = 0; i < 4; i++) {
      if (p[i] === 0) { if (q[i] < 0) return false; continue; }
      const t = q[i] / p[i];
      if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
      else { if (t < t0) return false; if (t < t1) t1 = t; }
    }
    return t0 < t1;
  }
  function gauss() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
  }

  /* ————————————————— Fig. 1: views ————————————————— */
  function views(f) {
    const { ctx } = f;
    const FOV = 52 * Math.PI / 180, TAN = Math.tan(FOV / 2);
    const cams = [18, 140, 258].map((deg, i) => {
      const a = deg * Math.PI / 180;
      const pos = { x: 2.25 * Math.cos(a), y: 0.55, z: 2.25 * Math.sin(a) };
      const n = Math.hypot(pos.x, pos.z);
      const fw = { x: -pos.x / n, z: -pos.z / n };
      return { name: "c" + (i + 1), pos, fw, rt: { x: -fw.z, z: fw.x }, occluded: false, hit: null };
    });
    const c1 = cams[0];
    const wc = { x: c1.pos.x + c1.fw.x * 0.72, z: c1.pos.z + c1.fw.z * 0.72 };
    const wall = { a: { x: wc.x - c1.rt.x * 0.22, z: wc.z - c1.rt.z * 0.22 }, b: { x: wc.x + c1.rt.x * 0.22, z: wc.z + c1.rt.z * 0.22 }, h: 0.8 };
    const obj = { x: 0, y: 0, z: 0, s: 0.19, rot: 0 };
    let k = 40, cx = 0, cy = 0;
    const s = { time: 3, stillAt: 3.2 };

    function layout() {
      k = Math.min(0.098 * f.W, 0.84 * f.H / 3.6);
      cx = 0.335 * f.W; cy = 0.44 * f.H;
    }
    const iso = (x, y, z) => [cx + (x - z) * k * 0.866, cy + (x + z) * k * 0.5 - y * k];

    function camView(cam, x, y, z) {
      const dx = x - cam.pos.x, dz = z - cam.pos.z;
      const depth = dx * cam.fw.x + dz * cam.fw.z;
      const lat = dx * cam.rt.x + dz * cam.rt.z;
      return { depth, u: lat / (depth * TAN), v: -(y - cam.pos.y) / (depth * TAN) };
    }

    s.update = () => {
      const t = s.time * 0.36;
      obj.x = 1.1 * Math.sin(t); obj.z = 0.68 * Math.sin(2 * t); obj.rot = s.time * 0.7;
      for (const cam of cams) {
        const hit = segmentsIntersect(cam.pos.x, cam.pos.z, obj.x, obj.z, wall.a.x, wall.a.z, wall.b.x, wall.b.z);
        cam.occluded = hit >= 0;
        cam.hit = cam.occluded ? { x: lerp(cam.pos.x, obj.x, hit), z: lerp(cam.pos.z, obj.z, hit) } : null;
      }
    };

    function drawCube(alpha) {
      const verts = [];
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        const c = Math.cos(obj.rot), si = Math.sin(obj.rot);
        const lx = sx * obj.s, lz = sz * obj.s;
        verts.push([obj.x + lx * c - lz * si, obj.z + lx * si + lz * c]);
      }
      const bottom = verts.map(([x, z]) => iso(x, 0, z)), top = verts.map(([x, z]) => iso(x, obj.s * 2, z));
      ctx.fillStyle = rgba(P.accent, 0.22 * alpha);
      ctx.beginPath(); top.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgba(P.accent, alpha); ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4;
        ctx.moveTo(...bottom[i]); ctx.lineTo(...bottom[j]);
        ctx.moveTo(...top[i]); ctx.lineTo(...top[j]);
        ctx.moveTo(...bottom[i]); ctx.lineTo(...top[i]);
      }
      ctx.stroke();
      const [lx, ly] = iso(obj.x, obj.s * 2 + 0.2, obj.z);
      ctx.fillStyle = rgba(P.accent, 0.95); ctx.font = mono(10); ctx.textAlign = "center";
      ctx.fillText("#1", lx, ly); ctx.textAlign = "left";
    }
    function drawWall() {
      const a0 = iso(wall.a.x, 0, wall.a.z), b0 = iso(wall.b.x, 0, wall.b.z), b1 = iso(wall.b.x, wall.h, wall.b.z), a1 = iso(wall.a.x, wall.h, wall.a.z);
      ctx.beginPath(); ctx.moveTo(...a0); ctx.lineTo(...b0); ctx.lineTo(...b1); ctx.lineTo(...a1); ctx.closePath();
      ctx.fillStyle = rgba(P.raise, 0.82); ctx.fill();
      ctx.save(); ctx.clip();
      ctx.beginPath();
      for (let i = -12; i < 12; i++) { ctx.moveTo(a0[0] + i * 6, a1[1] - 30); ctx.lineTo(a0[0] + i * 6 + 60, a1[1] + 60); }
      ctx.strokeStyle = rgba(P.muted, 0.22); ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
      ctx.beginPath(); ctx.moveTo(...a0); ctx.lineTo(...b0); ctx.lineTo(...b1); ctx.lineTo(...a1); ctx.closePath();
      ctx.strokeStyle = rgba(P.muted, 0.7); ctx.stroke();
    }
    function drawCamera(cam) {
      const apex = iso(cam.pos.x, cam.pos.y, cam.pos.z);
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => iso(
        cam.pos.x + cam.fw.x * 0.34 + cam.rt.x * 0.17 * a, cam.pos.y + 0.12 * b, cam.pos.z + cam.fw.z * 0.34 + cam.rt.z * 0.17 * a));
      ctx.fillStyle = rgba(P.cool, 0.12);
      ctx.beginPath(); corners.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgba(P.text, 0.75); ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath(); for (const p of corners) { ctx.moveTo(...apex); ctx.lineTo(...p); } ctx.stroke();
      ctx.fillStyle = rgba(P.text, 0.9); ctx.beginPath(); ctx.arc(apex[0], apex[1], 2.2, 0, TAU); ctx.fill();
      ctx.font = mono(10); ctx.fillStyle = rgba(P.text, 0.7);
      const away = iso(cam.pos.x * 1.13, cam.pos.y + 0.12, cam.pos.z * 1.13);
      ctx.textAlign = "center"; ctx.fillText(cam.name, away[0], away[1]); ctx.textAlign = "left";
    }
    function drawRay(cam) {
      const from = iso(cam.pos.x, cam.pos.y, cam.pos.z), to = iso(obj.x, obj.s, obj.z);
      ctx.lineWidth = 1.1;
      if (cam.occluded) {
        const hit = iso(cam.hit.x, lerp(cam.pos.y, obj.s, 0.5), cam.hit.z);
        ctx.strokeStyle = rgba(P.cool, 0.75);
        ctx.beginPath(); ctx.moveTo(...from); ctx.lineTo(...hit); ctx.stroke();
        ctx.setLineDash([2, 4]); ctx.strokeStyle = rgba(P.muted, 0.5);
        ctx.beginPath(); ctx.moveTo(...hit); ctx.lineTo(...to); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = rgba(P.text, 0.9);
        ctx.beginPath(); ctx.moveTo(hit[0] - 4, hit[1] - 4); ctx.lineTo(hit[0] + 4, hit[1] + 4); ctx.moveTo(hit[0] + 4, hit[1] - 4); ctx.lineTo(hit[0] - 4, hit[1] + 4); ctx.stroke();
      } else {
        ctx.setLineDash([5, 5]); ctx.lineDashOffset = -s.time * 18;
        ctx.strokeStyle = rgba(P.cool, 0.8);
        ctx.beginPath(); ctx.moveTo(...from); ctx.lineTo(...to); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    function drawTile(cam, x, y, w, h) {
      roundRect(ctx, x, y, w, h, 8);
      ctx.fillStyle = rgba(P.bg, P.light ? 0.6 : 0.55); ctx.fill();
      ctx.strokeStyle = rgba(cam.occluded ? P.muted : P.cool, cam.occluded ? 0.35 : 0.55); ctx.lineWidth = 1; ctx.stroke();
      ctx.save(); roundRect(ctx, x, y, w, h, 8); ctx.clip();
      const toX = u => x + (u + 1) / 2 * w, toY = v => y + h * 0.42 + v * w / 2;
      // ground plane in perspective
      ctx.strokeStyle = rgba(P.muted, 0.18);
      ctx.beginPath(); ctx.moveTo(x, toY(0)); ctx.lineTo(x + w, toY(0)); ctx.stroke();
      ctx.beginPath();
      for (let i = -3; i <= 3; i++) { ctx.moveTo(x + w / 2, toY(0)); ctx.lineTo(x + w / 2 + i * w * 0.4, y + h); }
      ctx.stroke();
      // wall, if in view
      const wa = camView(cam, wall.a.x, 0, wall.a.z), wb = camView(cam, wall.b.x, 0, wall.b.z);
      if (wa.depth > 0.05 && wb.depth > 0.05) {
        const ua = toX(wa.u), ub = toX(wb.u);
        const top = Math.min(toY(camView(cam, wall.a.x, wall.h, wall.a.z).v), toY(camView(cam, wall.b.x, wall.h, wall.b.z).v));
        const left = Math.min(ua, ub), width = Math.abs(ub - ua);
        ctx.fillStyle = rgba(P.raise, 0.95); ctx.fillRect(left, top, width, y + h - top);
        hatch(ctx, left, top, width, y + h - top, 6, rgba(P.muted, 0.25));
        ctx.strokeStyle = rgba(P.muted, 0.6); ctx.strokeRect(left, top, width, y + h - top);
      }
      // the object (or where the model believes it is)
      const o = camView(cam, obj.x, obj.s, obj.z);
      if (o.depth > 0.05) {
        const size = obj.s * 2 / (o.depth * TAN) * w / 2;
        const ox = toX(o.u), oy = toY(o.v);
        if (cam.occluded) {
          ctx.setLineDash([3, 3]); ctx.strokeStyle = rgba(P.accent, 0.85); ctx.lineWidth = 1.2;
          ctx.strokeRect(ox - size / 2, oy - size / 2, size, size); ctx.setLineDash([]);
        } else {
          ctx.fillStyle = rgba(P.accent, 0.28); ctx.fillRect(ox - size / 2, oy - size / 2, size, size);
          ctx.strokeStyle = rgba(P.accent, 1); ctx.lineWidth = 1.4; ctx.strokeRect(ox - size / 2, oy - size / 2, size, size);
        }
        ctx.fillStyle = rgba(P.accent, 0.95); ctx.font = mono(9.5); ctx.textAlign = "center";
        ctx.fillText("#1", ox, oy - size / 2 - 5); ctx.textAlign = "left";
      }
      ctx.restore();
      ctx.font = mono(9.5);
      ctx.fillStyle = rgba(P.text, 0.8); ctx.fillText(cam.name, x + 8, y + 14);
      ctx.fillStyle = rgba(cam.occluded ? P.accent : P.cool, 0.9); ctx.textAlign = "right";
      ctx.fillText(cam.occluded ? L("tracked") : L("visible"), x + w - 8, y + 14); ctx.textAlign = "left";
    }

    s.draw = () => {
      ctx.clearRect(0, 0, f.W, f.H);
      layout();
      // ground grid
      ctx.strokeStyle = rgba(P.muted, P.light ? 0.2 : 0.14); ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = -4; i <= 4; i++) {
        const v = i * 0.4;
        ctx.moveTo(...iso(v, 0, -1.6)); ctx.lineTo(...iso(v, 0, 1.6));
        ctx.moveTo(...iso(-1.6, 0, v)); ctx.lineTo(...iso(1.6, 0, v));
      }
      ctx.stroke();
      // the object's path
      ctx.setLineDash([1, 4]); ctx.strokeStyle = rgba(P.accent, 0.35);
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) { const t = i / 120 * TAU; const p = iso(1.1 * Math.sin(t), 0, 0.68 * Math.sin(2 * t)); i ? ctx.lineTo(...p) : ctx.moveTo(...p); }
      ctx.stroke(); ctx.setLineDash([]);
      for (const cam of cams) drawRay(cam);
      const wallFirst = (wc.x + wc.z) < (obj.x + obj.z);
      if (wallFirst) { drawWall(); drawCube(1); } else { drawCube(1); drawWall(); }
      for (const cam of cams) drawCamera(cam);
      const x0 = 0.675 * f.W, w = 0.3 * f.W, gap = 8, top = 0.05 * f.H, h = (0.9 * f.H - 2 * gap) / 3;
      cams.forEach((cam, i) => drawTile(cam, x0, top + i * (h + gap), w, h));
    };
    return s;
  }

  /* ————————————————— Fig. 2: belief ————————————————— */
  function belief(f) {
    const { ctx } = f;
    const N = 90, PRIOR = 0.6;
    const s = { time: 0, stillAt: 2.4 };
    let ego, other, particles, pCar, geo;

    function layout() {
      const W = f.W, H = f.H;
      geo = {
        roadY0: 0.56 * H, roadY1: 0.8 * H, roadX0: 0.56 * W, roadX1: 0.72 * W,
        laneEgo: 0.74 * H, laneOther: 0.6 * W, stopX: 0.535 * W,
        blocks: [
          { x: 0.03 * W, y: 0.05 * H, w: 0.5 * W, h: 0.48 * H, main: true },
          { x: 0.75 * W, y: 0.05 * H, w: 0.22 * W, h: 0.48 * H }
        ],
        carL: 0.075 * W, carW: 0.042 * W, range: 0.95 * W, vmax: 0.17 * W
      };
    }
    function reset() {
      layout();
      ego = { x: -0.1 * f.W, v: geo.vmax };
      other = Math.random() < PRIOR ? { y: -(0.15 + Math.random() * 0.5) * f.H, v: 0.12 * f.H, alive: true, seen: false } : null;
      particles = Array.from({ length: N }, () => ({ x: geo.laneOther + gauss() * 0.008 * f.W, y: (-0.7 + Math.random() * 1.15) * f.H, v: (0.09 + Math.random() * 0.06) * f.H }));
      pCar = PRIOR;
    }
    const front = () => ego.x + geo.carL / 2;
    const sensor = () => ({ x: front(), y: geo.laneEgo });
    function visible(x, y) {
      const e = sensor();
      if (Math.hypot(x - e.x, y - e.y) > geo.range) return false;
      if (y < 0) return false;
      return !segmentHitsRect(e.x, e.y, x, y, geo.blocks[0]);
    }

    s.update = dt => {
      if (!geo || !ego) reset();
      const H = f.H;
      if (other) { other.y += other.v * dt; if (other.y > 1.2 * H) other = null; }
      const seeOther = other && visible(geo.laneOther, other.y + geo.carL / 2);
      if (other && seeOther) other.seen = true;
      // propagate and weigh the hypotheses
      let removed = 0;
      for (const p of particles) {
        p.y += p.v * dt; p.x += gauss() * 0.0006 * f.W;
        if (p.dead) continue;
        if (p.y > 1.1 * H) { p.dead = true; continue; }
        if (visible(p.x, p.y)) {
          const explained = seeOther && Math.abs(p.y - other.y) < 0.12 * H;
          if (!explained) { p.dead = true; removed++; }
        }
      }
      const alive = particles.filter(p => !p.dead);
      if (seeOther) {
        pCar = 1;
        for (const p of particles) { if (p.dead || Math.abs(p.y - other.y) > 0.05 * H) { p.dead = false; p.y = other.y + gauss() * 0.012 * H; p.x = geo.laneOther + gauss() * 0.005 * f.W; p.v = other.v * (1 + gauss() * 0.04); } }
      } else if (alive.length === 0) {
        pCar = 0;
      } else if (removed) {
        const keep = 1 - removed / (alive.length + removed);
        pCar = pCar * keep / (pCar * keep + (1 - pCar));
        for (const p of particles) if (p.dead && p.y < 1.1 * H) {
          const src = alive[(Math.random() * alive.length) | 0];
          p.dead = false; p.x = src.x + gauss() * 0.004 * f.W; p.y = src.y + gauss() * 0.02 * H; p.v = src.v;
        }
      }
      // decide: P(the crossing is occupied within T)
      const T = 3.2;
      let inZone = 0, count = 0;
      for (const p of particles) {
        if (p.dead) continue;
        count++;
        if (p.y < geo.roadY1 + 0.04 * H && p.y + p.v * T > geo.roadY0 - 0.1 * H) inZone++;
      }
      s.pConflict = count ? pCar * inZone / count : 0;
      let target = geo.vmax * (1 - clamp(1.5 * s.pConflict, 0, 1));
      if (front() < geo.stopX + 2) {
        if (s.pConflict > 0.22) target = Math.min(target, Math.max(0, (geo.stopX - front()) * 1.4));
      } else target = geo.vmax;
      ego.v += clamp(target - ego.v, -0.5 * f.W * dt, 0.22 * f.W * dt);
      ego.x += ego.v * dt;
      s.pCar = pCar;
      if (ego.x > 1.12 * f.W) reset();
    };

    function car(x, y, w, h, horizontal, color, solid) {
      ctx.save(); ctx.translate(x, y); if (!horizontal) ctx.rotate(Math.PI / 2);
      roundRect(ctx, -w / 2, -h / 2, w, h, 3.5);
      if (solid) { ctx.fillStyle = rgba(color, 0.95); ctx.fill(); }
      else { ctx.setLineDash([3, 3]); ctx.strokeStyle = rgba(color, 0.55); ctx.lineWidth = 1.2; ctx.stroke(); ctx.setLineDash([]); }
      ctx.fillStyle = solid ? rgba(P.bg, 0.55) : rgba(color, 0.2);
      ctx.fillRect(w * 0.12, -h * 0.34, w * 0.16, h * 0.68);
      ctx.restore();
    }
    s.draw = () => {
      if (!geo || !ego) reset();
      const W = f.W, H = f.H;
      ctx.clearRect(0, 0, W, H);
      // roads
      ctx.fillStyle = rgba(P.muted, P.light ? 0.1 : 0.08);
      ctx.fillRect(0, geo.roadY0, W, geo.roadY1 - geo.roadY0);
      ctx.fillRect(geo.roadX0, 0, geo.roadX1 - geo.roadX0, H);
      ctx.strokeStyle = rgba(P.muted, 0.35); ctx.setLineDash([8, 8]); ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, (geo.roadY0 + geo.roadY1) / 2); ctx.lineTo(geo.roadX0, (geo.roadY0 + geo.roadY1) / 2);
      ctx.moveTo(geo.roadX1, (geo.roadY0 + geo.roadY1) / 2); ctx.lineTo(W, (geo.roadY0 + geo.roadY1) / 2);
      ctx.moveTo((geo.roadX0 + geo.roadX1) / 2, 0); ctx.lineTo((geo.roadX0 + geo.roadX1) / 2, geo.roadY0);
      ctx.moveTo((geo.roadX0 + geo.roadX1) / 2, geo.roadY1); ctx.lineTo((geo.roadX0 + geo.roadX1) / 2, H);
      ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = rgba(P.text, 0.5); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(geo.stopX, (geo.roadY0 + geo.roadY1) / 2 + 2); ctx.lineTo(geo.stopX, geo.roadY1 - 2); ctx.stroke();
      // what the car can see
      const e = sensor();
      const light = ctx.createRadialGradient(e.x, e.y, 4, e.x, e.y, geo.range);
      light.addColorStop(0, rgba(P.cool, P.light ? 0.16 : 0.14)); light.addColorStop(1, rgba(P.cool, 0));
      ctx.fillStyle = light; ctx.fillRect(0, 0, W, H);
      // shadow behind the occluding block
      const b = geo.blocks[0];
      const corners = [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]];
      const base = Math.atan2(b.y + b.h / 2 - e.y, b.x + b.w / 2 - e.x);
      let lo = corners[0], hi = corners[0], aLo = Infinity, aHi = -Infinity;
      for (const c of corners) {
        let a = Math.atan2(c[1] - e.y, c[0] - e.x) - base;
        a = Math.atan2(Math.sin(a), Math.cos(a));
        if (a < aLo) { aLo = a; lo = c; }
        if (a > aHi) { aHi = a; hi = c; }
      }
      const far = 6;
      ctx.beginPath();
      ctx.moveTo(lo[0], lo[1]); ctx.lineTo(hi[0], hi[1]);
      ctx.lineTo(hi[0] + (hi[0] - e.x) * far, hi[1] + (hi[1] - e.y) * far);
      ctx.lineTo(lo[0] + (lo[0] - e.x) * far, lo[1] + (lo[1] - e.y) * far);
      ctx.closePath();
      ctx.fillStyle = rgba(P.bg, P.light ? 0.55 : 0.62); ctx.fill();
      ctx.save(); ctx.clip(); hatch(ctx, 0, 0, W, H, 9, rgba(P.muted, 0.08)); ctx.restore();
      // buildings
      for (const block of geo.blocks) {
        roundRect(ctx, block.x, block.y, block.w, block.h, 7);
        ctx.fillStyle = rgba(P.raise, 1); ctx.fill();
        ctx.strokeStyle = rgba(P.muted, block.main ? 0.6 : 0.3); ctx.lineWidth = 1; ctx.stroke();
        if (block.main) hatch(ctx, block.x, block.y, block.w, block.h, 7, rgba(P.muted, 0.14));
      }
      ctx.font = mono(9.5); ctx.fillStyle = rgba(P.faint, 1);
      ctx.fillText(L("occluded"), geo.roadX0 - 4 - ctx.measureText(L("occluded")).width, 0.04 * H + 10);
      // belief particles
      const alpha = 0.25 + 0.65 * s.pCar;
      let mx = 0, my = 0, n = 0;
      ctx.fillStyle = rgba(P.violet, alpha);
      for (const p of particles) {
        if (p.dead || p.y < -10) continue;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, TAU); ctx.fill();
        mx += p.x; my += p.y; n++;
      }
      if (n && s.pCar > 0.02) {
        mx /= n; my = Math.max(my / n, 14);
        ctx.font = serif(16); ctx.fillStyle = rgba(P.violet, 0.9);
        ctx.fillText("b(s)", mx - 34, my);
      }
      // the hidden car (ground truth, drawn dashed while unseen)
      if (other) {
        const seen = visible(geo.laneOther, other.y + geo.carL / 2);
        car(geo.laneOther, other.y, geo.carL, geo.carW, false, P.violet, seen);
      }
      // ego car and its committed path
      const braking = ego.v < geo.vmax * 0.6 && front() < geo.stopX + 2;
      ctx.strokeStyle = rgba(P.accent, 0.55); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(front(), geo.laneEgo);
      ctx.lineTo(braking ? Math.max(front(), geo.stopX) : front() + ego.v * 1.2, geo.laneEgo); ctx.stroke();
      car(ego.x, geo.laneEgo, geo.carL, geo.carW, true, P.accent, true);
      // readout
      const x = W - 136, y = geo.roadY1 + 0.04 * H;
      ctx.font = mono(9.5);
      const rows = [["P(car)", s.pCar || 0, P.violet], ["P(cross)", s.pConflict || 0, P.violet], ["v / vmax", ego.v / geo.vmax, P.accent]];
      rows.forEach(([name, value, color], i) => {
        const yy = y + i * 15;
        ctx.fillStyle = rgba(P.muted, 1); ctx.fillText(name, x, yy + 8);
        ctx.fillStyle = rgba(P.muted, 0.18); ctx.fillRect(x + 58, yy + 2, 64, 6);
        ctx.fillStyle = rgba(color, 0.95); ctx.fillRect(x + 58, yy + 2, 64 * clamp(value, 0, 1), 6);
      });
    };
    s.resize = () => reset();
    return s;
  }

  /* ————————————————— Fig. 3: adapt ————————————————— */
  function adapt(f) {
    const { ctx } = f;
    const s = { time: 0, stillAt: 9 };
    // Quadratic task losses L(θ) = ½ (θ−m)ᵀ H (θ−m).
    function hessian(l1, l2, deg) {
      const a = deg * Math.PI / 180, c = Math.cos(a), si = Math.sin(a);
      return { xx: l1 * c * c + l2 * si * si, xy: (l1 - l2) * c * si, yy: l1 * si * si + l2 * c * c, l1, l2, a };
    }
    const A = { m: [-1.25, 0.15], H: hessian(0.035, 1.6, -8) };   // flat along the direction toward B
    const B = { m: [1.15, -0.95], H: hessian(0.9, 0.35, 35) };
    const loss = (T, x, y) => { const dx = x - T.m[0], dy = y - T.m[1]; return 0.5 * (T.H.xx * dx * dx + 2 * T.H.xy * dx * dy + T.H.yy * dy * dy); };
    const grad = (T, x, y) => { const dx = x - T.m[0], dy = y - T.m[1]; return [T.H.xx * dx + T.H.xy * dy, T.H.xy * dx + T.H.yy * dy]; };
    function path(lambda) {
      const pts = [];
      let x = A.m[0], y = A.m[1];
      for (let i = 0; i < 700; i++) {
        pts.push([x, y]);
        const g = grad(B, x, y), r = grad(A, x, y);
        x -= 0.035 * (g[0] + lambda * r[0]); y -= 0.035 * (g[1] + lambda * r[1]);
      }
      return pts;
    }
    const naive = path(0), kept = path(2.2);
    const CYCLE = 11;
    let ox = 0, oy = 0, unit = 1;
    const to = (x, y) => [ox + x * unit, oy - y * unit];

    function ellipses(T, color, alpha) {
      ctx.save();
      ctx.beginPath(); ctx.rect(0.05 * f.W, 0.04 * f.H, 0.66 * f.W, 0.82 * f.H); ctx.clip();
      for (const level of (T === A ? [0.03, 0.12, 0.32, 0.7] : [0.04, 0.16, 0.4, 0.8, 1.4])) {
        const rx = Math.sqrt(2 * level / T.H.l1), ry = Math.sqrt(2 * level / T.H.l2);
        const [cx, cy] = to(T.m[0], T.m[1]);
        ctx.beginPath(); ctx.ellipse(cx, cy, rx * unit, ry * unit, -T.H.a, 0, TAU);
        ctx.strokeStyle = rgba(color, alpha * (1.05 - level / 1.6)); ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.restore();
    }
    function trace(pts, upto, color, dashed, width) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, 0.72 * f.W, f.H); ctx.clip();
      ctx.beginPath();
      for (let i = 0; i <= upto; i++) { const p = to(...pts[i]); i ? ctx.lineTo(...p) : ctx.moveTo(...p); }
      if (dashed) ctx.setLineDash([4, 4]);
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
      ctx.restore();
      const p = to(...pts[upto]);
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p[0], p[1], dashed ? 3 : 4.5, 0, TAU); ctx.fill();
      return p;
    }
    s.update = () => {};
    s.draw = () => {
      const W = f.W, H = f.H;
      ctx.clearRect(0, 0, W, H);
      unit = Math.min(0.72 * W / 4.6, H / 3.1);
      ox = 0.36 * W; oy = 0.42 * H;
      const t = s.time % CYCLE;
      const fadeIn = clamp(t / 0.6, 0, 1), fadeOut = clamp((CYCLE - t) / 0.6, 0, 1), vis = Math.min(fadeIn, fadeOut);
      const bIn = clamp((t - 1.4) / 0.8, 0, 1);
      const progress = ease(clamp((t - 2.4) / 5.6, 0, 1));
      ctx.globalAlpha = vis;
      // axes
      ctx.strokeStyle = rgba(P.muted, 0.25); ctx.lineWidth = 1;
      const axY = 0.86 * H, axX = 0.05 * W;
      ctx.beginPath(); ctx.moveTo(axX, axY); ctx.lineTo(0.7 * W, axY); ctx.moveTo(axX, axY); ctx.lineTo(axX, 0.08 * H); ctx.stroke();
      ctx.font = serif(15); ctx.fillStyle = rgba(P.muted, 0.9);
      ctx.fillText("θ₁", 0.7 * W - 12, axY - 6); ctx.fillText("θ₂", axX + 6, 0.08 * H + 10);
      ellipses(A, P.cool, 0.85);
      if (bIn > 0) ellipses(B, P.accent, 0.75 * bIn);
      const [axp, ayp] = to(...A.m), [bxp, byp] = to(...B.m);
      ctx.font = serif(16);
      ctx.fillStyle = rgba(P.cool, 1); ctx.fillText("θ*", axp - 32, ayp - 10);
      ctx.font = mono(9); ctx.fillText("A", axp - 18, ayp - 6);
      if (bIn > 0) {
        ctx.font = serif(16); ctx.fillStyle = rgba(P.accent, bIn); ctx.fillText("θ*", bxp + 10, byp - 8);
        ctx.font = mono(9); ctx.fillText("B", bxp + 24, byp - 4);
      }
      ctx.font = mono(10);
      ctx.fillStyle = rgba(P.text, 0.8);
      ctx.fillText(t < 1.6 ? L("trainA") : L("arrivesB"), axX + 30, 0.08 * H + 8);
      let stepN = 0, stepK = 0;
      if (t > 2.4) {
        stepN = Math.floor(progress * (naive.length - 1)); stepK = Math.floor(progress * (kept.length - 1));
        const pn = trace(naive, stepN, rgba(P.muted, 0.85), true, 1.3);
        const pk = trace(kept, stepK, rgba(P.accent, 1), false, 2);
        ctx.font = mono(9.5);
        const away = Math.hypot(pn[0] - axp, pn[1] - ayp) > 60 ? 1 : 0;
        if (away) {
          ctx.fillStyle = rgba(P.muted, 0.95); ctx.textAlign = "right"; ctx.fillText(L("finetune"), pn[0] - 10, pn[1] + 4); ctx.textAlign = "left";
          ctx.fillStyle = rgba(P.accent, 1); ctx.fillText(L("consolidate"), pk[0] + 4, pk[1] - 12);
        }
      } else {
        ctx.fillStyle = rgba(P.accent, 1); ctx.beginPath(); ctx.arc(axp, ayp, 4.5, 0, TAU); ctx.fill();
      }
      // retention / adaptation readout
      const pn = naive[stepN], pk = kept[stepK];
      const perf = (T, p) => Math.exp(-loss(T, p[0], p[1]) * 1.6);
      const x0 = 0.76 * W, bw = 0.2 * W;
      const groups = [[L("taskA"), A, P.cool], [L("taskB"), B, P.accent]];
      ctx.font = mono(9.5);
      groups.forEach(([name, T, color], g) => {
        const y = 0.2 * H + g * 0.3 * H;
        ctx.fillStyle = rgba(P.text, 0.85); ctx.fillText(name, x0, y);
        const vk = t > 2.4 ? perf(T, pk) : (g === 0 ? 1 : perf(T, A.m));
        const vn = t > 2.4 ? perf(T, pn) : vk;
        ctx.fillStyle = rgba(P.muted, 0.15); ctx.fillRect(x0, y + 8, bw, 7); ctx.fillRect(x0, y + 22, bw, 7);
        ctx.fillStyle = rgba(color, 0.95); ctx.fillRect(x0, y + 8, bw * vk, 7);
        ctx.strokeStyle = rgba(P.muted, 0.9); ctx.lineWidth = 1; ctx.strokeRect(x0 + 0.5, y + 22.5, Math.max(bw * vn - 1, 0), 6);
      });
      ctx.fillStyle = rgba(P.faint, 1); ctx.font = mono(8.5);
      const [l1, l2] = L("legend").split("  ");
      ctx.fillText(l1, x0, 0.8 * H); ctx.fillText(l2, x0, 0.8 * H + 13);
      ctx.globalAlpha = 1;
    };
    return s;
  }

  /* ————————————————— portrait mark ————————————————— */
  function portrait(f) {
    const { ctx } = f;
    const s = { time: 0, done: false, stillAt: 0.1 };
    const sets = [[-1.4, 1.6, 1.0, 0.7], [1.7, 1.7, 0.6, 1.2], [1.5, -1.8, 1.6, 0.9], [-1.7, 1.3, -0.1, -1.21], [-1.8, -2.0, -0.5, -0.9]];
    const name = (window.ACADEMIC_PROFILE?.name?.en || "ltlangz1");
    let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const [a, b, c, d] = sets[h % sets.length];
    let dens = null, w = 0, hgt = 0, x = 0.1, y = 0.1, total = 0, maxD = 1;
    const TARGET = 1400000;
    function init() {
      w = Math.max(1, Math.round(f.W * f.dpr)); hgt = Math.max(1, Math.round(f.H * f.dpr));
      dens = new Float32Array(w * hgt); total = 0; maxD = 1; s.done = false;
    }
    function accumulate(n) {
      const sc = Math.min(w * 0.84 / (2 * (1 + Math.abs(c))), hgt * 0.78 / (2 * (1 + Math.abs(d)))), cx = w / 2, cy = hgt * 0.46;
      for (let i = 0; i < n; i++) {
        const nx = Math.sin(a * y) + c * Math.cos(a * x);
        const ny = Math.sin(b * x) + d * Math.cos(b * y);
        x = nx; y = ny;
        const px = (cx + x * sc) | 0, py = (cy + y * sc) | 0;
        if (px >= 0 && px < w && py >= 0 && py < hgt) { const k = py * w + px; const v = ++dens[k]; if (v > maxD) maxD = v; }
      }
      total += n;
      if (total >= TARGET) s.done = true;
    }
    s.update = () => { if (!dens) init(); if (!s.done) accumulate(70000); };
    s.draw = () => {
      if (!dens || dens.length !== Math.round(f.W * f.dpr) * Math.round(f.H * f.dpr)) { init(); }
      if (still.matches && !s.done) accumulate(TARGET);
      const img = ctx.createImageData(w, hgt);
      const data = img.data, lm = Math.log(1 + maxD);
      const c0 = P.cool, c1 = P.accent;
      for (let i = 0; i < dens.length; i++) {
        const v = dens[i];
        if (!v) continue;
        const t = Math.log(1 + v) / lm;
        const k = i * 4, m = Math.min(1, t * 1.25);
        data[k] = c0[0] + (c1[0] - c0[0]) * m; data[k + 1] = c0[1] + (c1[1] - c0[1]) * m; data[k + 2] = c0[2] + (c1[2] - c0[2]) * m;
        data[k + 3] = Math.min(255, 40 + 255 * Math.pow(t, 0.7));
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, hgt);
      ctx.putImageData(img, 0, 0);
      ctx.setTransform(f.dpr, 0, 0, f.dpr, 0, 0);
      ctx.font = mono(10); ctx.fillStyle = rgba(P.faint, 1);
      ctx.fillText(L("portrait"), 14, f.H - 16);
    };
    return s;
  }

  /* ————————————————— runtime ————————————————— */
  const scenes = { views, belief, adapt };
  const all = [];
  const active = new Set();
  let raf = 0, last = 0;

  function makeFigure(canvas, factory) {
    const ctx = canvas.getContext("2d");
    const f = { canvas, ctx, W: 0, H: 0, dpr: 1 };
    const scene = factory(f);
    const item = { f, scene };
    item.resize = () => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      if (r.width === f.W && r.height === f.H && f.dpr === Math.min(window.devicePixelRatio || 1, 2)) return;
      f.dpr = Math.min(window.devicePixelRatio || 1, 2);
      f.W = r.width; f.H = r.height;
      canvas.width = Math.round(f.W * f.dpr); canvas.height = Math.round(f.H * f.dpr);
      ctx.setTransform(f.dpr, 0, 0, f.dpr, 0, 0);
      scene.resize?.();
      scene.update(0); scene.draw();
    };
    all.push(item);
    new ResizeObserver(item.resize).observe(canvas);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) active.add(item); else active.delete(item);
        kick();
      }, { rootMargin: "80px" }).observe(canvas);
    } else active.add(item);
    if (still.matches) settle(item);
    return item;
  }
  function settle(item) {
    // Reduced motion: advance to an informative moment and show one frame.
    const { scene, f } = item;
    if (!f.W) item.resize();
    const target = scene.stillAt || 6;
    for (let t = 0; t < target; t += 1 / 30) { scene.time += 1 / 30; scene.update(1 / 30); }
    scene.draw();
  }
  function loop(now) {
    raf = 0;
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    for (const item of active) {
      if (!item.f.W) continue;
      item.scene.time += dt;
      item.scene.update(dt);
      item.scene.draw();
      if (item.scene.done) active.delete(item);
    }
    kick();
  }
  function kick() {
    if (raf || !active.size || still.matches || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  readPalette();
  document.querySelectorAll("canvas[data-figure]").forEach(canvas => {
    const factory = scenes[canvas.dataset.figure];
    if (!factory) return;
    makeFigure(canvas, factory);
  });
  const mark = document.getElementById("portrait-mark");
  if (mark) makeFigure(mark, portrait);

  document.addEventListener("visibilitychange", kick);
  document.addEventListener("languagechange", () => all.forEach(item => { if (item.f.W) item.scene.draw(); }));
  document.addEventListener("themechange", () => { readPalette(); all.forEach(item => { if (item.f.W) item.scene.draw(); }); });
  still.addEventListener?.("change", () => { if (still.matches) all.forEach(settle); else { all.forEach(item => { if (!item.scene.done) item.resize(); }); kick(); } });
})();
