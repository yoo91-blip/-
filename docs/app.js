/* 지도추출기 World — 대륙 › 국가 › 도·주 (› 시: 2차) */
(() => {
  "use strict";

  // ---------- 상수 ----------
  const CONT = {
    AS: { ko: "아시아", en: "Asia", ext: [25, -12, 150, 56] },
    EU: { ko: "유럽", en: "Europe", ext: [-25, 34, 60, 72] },
    AF: { ko: "아프리카", en: "Africa", ext: [-26, -36, 58, 38] },
    NA: { ko: "북아메리카", en: "North America", ext: [-170, 6, -50, 76] },
    SA: { ko: "남아메리카", en: "South America", ext: [-83, -56, -33, 13] },
    OC: { ko: "오세아니아", en: "Oceania", ext: [110, -48, 185, 2] },
    AN: { ko: "남극", en: "Antarctica", ext: null },
  };
  const CONT_ORDER = ["AS", "EU", "AF", "NA", "SA", "OC", "AN"];
  const PRESETS = {
    dark: { bg: "#10161d", fill: "#f2f4f6", stroke: "#10161d", strokeW: 0.8 },
    light: { bg: "#ffffff", fill: "#d5dbe1", stroke: "#ffffff", strokeW: 1 },
    mono: { bg: "#ffffff", fill: "#ffffff", stroke: "#1f2937", strokeW: 0.8 },
  };
  const DEFAULT_PALETTE = ["#2bb5ad", "#3b82f6", "#f5a524", "#e5484d", "#8b5cf6"];
  const PIN_COLORS = ["#e5484d", "#f5a524", "#f7d038", "#2bb5ad", "#3b82f6", "#8b5cf6", "#8a96a3", "#ffffff", "#111827"];
  const PIN_PATH = "M0,0C-2.2,-5.6 -9,-10.4 -9,-17.5A9,9 0 1 1 9,-17.5C9,-10.4 2.2,-5.6 0,0Z";
  const STORE_KEY = "mapx-world-v2";
  const SAVE_KEYS = ["shape", "detail", "labels", "context", "overseas", "antarctica", "exportBg", "bg", "fill", "stroke", "strokeW", "preset", "palette", "worldUnit", "tool", "seenIntro"];

  // ---------- 상태 ----------
  const defaults = {
    shape: "angle", detail: 60, labels: "none", context: true, overseas: false, antarctica: false, exportBg: false,
    ...PRESETS.dark, preset: "dark", palette: DEFAULT_PALETTE.slice(), worldUnit: "country", tool: 0, seenIntro: false,
  };
  const S = Object.assign({}, defaults, load());
  if (!Array.isArray(S.palette) || S.palette.length !== 5) S.palette = DEFAULT_PALETTE.slice();
  if (S.tool === "pin") S.tool = 0;
  const view = { level: "world", ct: null, cc: null };
  const paints = new Map(); // viewKey -> Map(uid -> 색 번호)
  let focus = null;
  let pins = [];
  let activePin = null;
  let pinClipboard = null;
  let lastColor = typeof S.tool === "number" ? S.tool : 0;
  let model = null;
  let projection = null;
  let zt = d3.zoomIdentity;

  const $ = (id) => document.getElementById(id);
  const svg = $("map"), stage = $("stage"), listEl = $("list");
  const isPhone = () => matchMedia("(max-width: 760px)").matches;

  function load() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; } }
  function save() {
    try { const o = {}; SAVE_KEYS.forEach((k) => (o[k] = S[k])); localStorage.setItem(STORE_KEY, JSON.stringify(o)); } catch { /* 무시 */ }
  }

  // ---------- 데이터 ----------
  const data = { world: null, adm1: new Map(), adm1Index: new Set(), countries: [], byId: new Map() };

  function prepTopo(topo) {
    const name = Object.keys(topo.objects)[0];
    for (const g of topo.objects[name].geometries) {
      const p = g.properties || (g.properties = {});
      p.ko = p.ko || p.en || p.id || "?";
      p.en = p.en || p.ko;
    }
    const pre = topojson.presimplify(topo, topojson.sphericalTriangleArea);
    const w = [];
    for (const arc of pre.arcs) for (const p of arc) if (isFinite(p[2])) w.push(p[2]);
    w.sort((a, b) => b - a);
    return { topo, pre, name, weights: w, cache: null, full: topojson.feature(topo, topo.objects[name]).features };
  }

  function featuresAt(entry, detail) {
    if (entry.cache && entry.cache.d === detail) return entry.cache.f;
    let feats;
    if (detail >= 100) feats = entry.full;
    else {
      const f = Math.max(0.002, Math.pow(detail / 100, 2));
      const n = entry.weights.length;
      const minW = n ? entry.weights[Math.min(n - 1, Math.floor(f * (n - 1)))] : 0;
      const arcs = entry.pre.arcs.map((arc) => {
        let out = arc.filter((p) => p[2] >= minW);
        const L = arc.length;
        if (out.length < 5 && L >= 5 && arc[0][0] === arc[L - 1][0] && arc[0][1] === arc[L - 1][1]) {
          const keep = new Set(arc.slice(1, -1).sort((a, b) => b[2] - a[2]).slice(0, 4));
          out = arc.filter((p, i) => i === 0 || i === L - 1 || keep.has(p));
        }
        return out.map((p) => [p[0], p[1]]);
      });
      const t = { type: "Topology", bbox: entry.pre.bbox, objects: entry.pre.objects, arcs };
      feats = topojson.feature(t, t.objects[entry.name]).features;
      feats.forEach((f) => rewind(f.geometry));
    }
    entry.cache = { d: detail, f: feats };
    return feats;
  }

  async function loadJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(url + " " + r.status);
    return r.json();
  }
  async function ensureAdm1(cc) {
    if (data.adm1.has(cc)) return data.adm1.get(cc);
    showLoading(true);
    try { const e = prepTopo(await loadJSON(`data/adm1/${cc}.json`)); data.adm1.set(cc, e); return e; }
    finally { showLoading(false); }
  }

  // ---------- 지오메트리 도우미 ----------
  function polysOf(g) {
    if (!g) return [];
    return g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
  }
  // 단순화로 링 방향이 뒤집히면 d3가 지구 반대편 전체를 칠하므로 바로잡는다
  function rewind(g) {
    for (const poly of polysOf(g)) {
      poly.forEach((ring, i) => {
        if (ring.length < 4) return;
        const big = d3.geoArea({ type: "Polygon", coordinates: [ring] }) > 2 * Math.PI;
        if ((i === 0) === big) ring.reverse();
      });
    }
  }
  function bboxDist(a, b) {
    const norm = (bb) => { let [[w, s], [e, n]] = bb; if (e < w) e += 360; return [w, s, e, n]; };
    const A = norm(a), B = norm(b);
    const dy = Math.max(0, A[1] - B[3], B[1] - A[3]);
    const lat = Math.cos(((A[1] + A[3] + B[1] + B[3]) / 4) * Math.PI / 180);
    let best = Infinity;
    for (const sh of [-360, 0, 360]) {
      const dx = Math.max(0, A[0] - (B[2] + sh), (B[0] + sh) - A[2]) * lat;
      best = Math.min(best, Math.hypot(dx, dy));
    }
    return best;
  }
  // 본토 + 가까운 섬만 (해외영토·원거리 섬 제외)
  function mainland(geom) {
    const polys = polysOf(geom);
    if (polys.length <= 1) return geom;
    const items = polys.map((c) => { const g = { type: "Polygon", coordinates: c }; return { c, b: d3.geoBounds(g), a: d3.geoArea(g), in: false }; })
      .sort((x, y) => y.a - x.a);
    items[0].in = true;
    const inc = [items[0]];
    let changed = true;
    while (changed) {
      changed = false;
      for (const it of items) if (!it.in && inc.some((j) => bboxDist(it.b, j.b) < 3)) { it.in = true; inc.push(it); changed = true; }
    }
    return { type: "MultiPolygon", coordinates: inc.map((i) => i.c) };
  }
  function centerLon(geo) { let [[w], [e]] = d3.geoBounds(geo); if (e < w) e += 360; return (w + e) / 2; }
  function extentObj(ext) {
    const [w, s, e, n] = ext, pts = [];
    for (let i = 0; i <= 16; i++) { const x = w + ((e - w) * i) / 16; pts.push([x, s], [x, n]); }
    for (let i = 0; i <= 8; i++) { const y = s + ((n - s) * i) / 8; pts.push([w, y], [e, y]); }
    return { type: "MultiPoint", coordinates: pts.map(([x, y]) => [x > 180 ? x - 360 : x, y]) };
  }

  // geoPath → 링 수집 → 각/둥글 path 문자열
  const rec = {
    rings: [], cur: null,
    moveTo(x, y) { this.cur = [[x, y]]; this.rings.push(this.cur); },
    lineTo(x, y) { this.cur.push([x, y]); },
    closePath() {}, arc() {}, beginPath() {},
  };
  let geoPath = null;
  const f1 = (v) => Math.round(v * 10) / 10;

  function pathD(geom, round) {
    rec.rings = []; rec.cur = null;
    geoPath(geom);
    let d = "";
    for (let r of rec.rings) {
      if (r.length < 3) continue;
      let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
      for (const [x, y] of r) { if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
      if (maxx - minx < 0.4 && maxy - miny < 0.4) continue;
      const last = r[r.length - 1];
      if (last[0] === r[0][0] && last[1] === r[0][1]) r = r.slice(0, -1);
      if (!round || r.length < 3) {
        d += "M" + r.map(([x, y]) => f1(x) + "," + f1(y)).join("L") + "Z";
      } else {
        const n = r.length;
        d += "M" + f1(r[0][0]) + "," + f1(r[0][1]);
        for (let i = 0; i < n; i++) {
          const p0 = r[(i - 1 + n) % n], p1 = r[i], p2 = r[(i + 1) % n], p3 = r[(i + 2) % n];
          d += "C" + f1(p1[0] + (p2[0] - p0[0]) / 6) + "," + f1(p1[1] + (p2[1] - p0[1]) / 6) + " " +
            f1(p2[0] - (p3[0] - p1[0]) / 6) + "," + f1(p2[1] - (p3[1] - p1[1]) / 6) + " " + f1(p2[0]) + "," + f1(p2[1]);
        }
        d += "Z";
      }
    }
    return d;
  }

  function labelPoint(geom) {
    let best = null, ba = -1;
    const gp = d3.geoPath(projection);
    for (const c of polysOf(geom)) {
      const g = { type: "Polygon", coordinates: c };
      const a = gp.area(g);
      if (a > ba) { ba = a; best = g; }
    }
    if (!best || ba < 4) return null;
    const p = gp.centroid(best);
    return isFinite(p[0]) ? { x: p[0], y: p[1], area: ba } : null;
  }

  // ---------- 뷰 ----------
  const viewKey = () => (view.level === "world" ? "world-" + S.worldUnit : view.level === "continent" ? "c-" + view.ct : "k-" + view.cc);
  const hashKey = () => (view.level === "world" ? "" : view.level === "continent" ? "c-" + view.ct : "k-" + view.cc);
  function paintMap() { const k = viewKey(); if (!paints.has(k)) paints.set(k, new Map()); return paints.get(k); }
  const colorOf = (uid) => { const p = paintMap(); return p.has(uid) ? S.palette[p.get(uid)] : null; };

  function units() {
    if (view.level === "world") {
      if (S.worldUnit === "country") {
        return data.countries.filter((f) => S.antarctica || f.properties.ct !== "AN")
          .map((f) => ({ id: f.properties.id, ko: f.properties.ko, en: f.properties.en, ct: f.properties.ct, drill: true }))
          .sort((a, b) => a.ko.localeCompare(b.ko, "ko"));
      }
      return CONT_ORDER.filter((c) => c !== "AN" || S.antarctica).map((c) => ({ id: c, ko: CONT[c].ko, en: CONT[c].en, drill: true }));
    }
    if (view.level === "continent") {
      return data.countries.filter((f) => f.properties.ct === view.ct)
        .map((f) => ({ id: f.properties.id, ko: f.properties.ko, en: f.properties.en, drill: true }))
        .sort((a, b) => a.ko.localeCompare(b.ko, "ko"));
    }
    return data.adm1.get(view.cc).full.map((f) => ({ id: f.properties.id, ko: f.properties.ko, en: f.properties.en, sub: f.properties.t, drill: false }))
      .sort((a, b) => a.ko.localeCompare(b.ko, "ko"));
  }

  // ---------- 렌더 ----------
  function render() {
    if (!data.world) return;
    const W = Math.max(200, stage.clientWidth), H = Math.max(160, stage.clientHeight);
    const pad = Math.round(Math.min(W, H) * 0.05);
    const ext = [[pad, pad], [W - pad, H - pad]];
    const round = S.shape === "round";
    let unitFeats = [], ctxFeats = [];

    if (view.level === "world") {
      const feats = featuresAt(data.world, S.detail).filter((f) => S.antarctica || f.properties.ct !== "AN");
      projection = d3.geoNaturalEarth1().rotate([-10, 0]).precision(0.3);
      projection.fitExtent(ext, S.antarctica ? { type: "Sphere" } : { type: "FeatureCollection", features: feats });
      const byCountry = S.worldUnit === "country";
      unitFeats = feats.map((f) => ({ f, uid: byCountry ? f.properties.id : f.properties.ct, name: f.properties.ko, group: f.properties.ct }));
    } else if (view.level === "continent") {
      const worldF = featuresAt(data.world, S.detail);
      if (view.ct === "AN") {
        projection = d3.geoAzimuthalEqualArea().rotate([0, 90]).precision(0.3);
        projection.fitExtent(ext, data.countries.find((f) => f.properties.ct === "AN"));
      } else {
        const fit = extentObj(CONT[view.ct].ext);
        projection = d3.geoMercator().rotate([-centerLon(fit), 0]).precision(0.3).fitExtent(ext, fit);
      }
      for (const f of worldF) {
        if (f.properties.ct === view.ct) unitFeats.push({ f, uid: f.properties.id, name: f.properties.ko });
        else ctxFeats.push(f);
      }
    } else {
      const cf = data.byId.get(view.cc);
      const fit = S.overseas ? cf.geometry : mainland(cf.geometry);
      projection = d3.geoMercator().rotate([-centerLon(fit), 0]).precision(0.3).fitExtent(ext, fit);
      unitFeats = featuresAt(data.adm1.get(view.cc), S.detail).map((f) => ({ f, uid: f.properties.id, name: f.properties.ko }));
      ctxFeats = featuresAt(data.world, Math.max(S.detail, 70)).filter((f) => f.properties.id !== view.cc);
    }
    projection.clipExtent([[-2, -2], [W + 2, H + 2]]);
    geoPath = d3.geoPath(projection, rec);

    const m = { W, H, round, units: [], ctx: [] };
    for (const u of unitFeats) {
      const d = pathD(u.f.geometry, round);
      if (d) m.units.push({ uid: u.uid, name: u.name, group: u.group, d, geom: u.f.geometry });
    }
    if (S.context && view.level !== "world") {
      for (const f of ctxFeats) { const d = pathD(f.geometry, round); if (d) m.ctx.push({ id: f.properties.id, name: f.properties.ko, d }); }
    }
    model = m;
    computeLabels();
    paint();
  }

  function computeLabels() {
    const m = model;
    m.labels = [];
    if (S.labels === "none") return;
    const pm = paintMap();
    const fs = Math.round(Math.max(10, Math.min(15, Math.min(m.W, m.H) * 0.02)));
    if (view.level === "world" && S.worldUnit === "continent") {
      const t = data.world.topo;
      for (const c of CONT_ORDER) {
        if (c === "AN" && !S.antarctica) continue;
        if (S.labels === "sel" && !pm.has(c)) continue;
        const p = labelPoint(topojson.merge(t, t.objects[data.world.name].geometries.filter((g) => g.properties.ct === c)));
        if (p) m.labels.push({ x: p.x, y: p.y, text: CONT[c].ko, uid: c, fs, area: p.area });
      }
    } else {
      const seen = new Set();
      for (const u of m.units) {
        if (seen.has(u.uid)) continue;
        if (S.labels === "sel" && !pm.has(u.uid)) continue;
        const p = labelPoint(u.geom);
        if (!p) continue;
        seen.add(u.uid);
        m.labels.push({ x: p.x, y: p.y, text: u.name, uid: u.uid, fs, area: p.area });
      }
    }
  }

  function lum(hex) {
    const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }
  const textOn = (hex) => (lum(hex) > 0.6 ? "#1b2430" : "#ffffff");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const joinAttr = () => `stroke-linejoin="${model.round ? "round" : "miter"}"`;
  const unitFill = (u) => colorOf(u.uid) || S.fill;
  const regionAttrs = (u) => `fill="${unitFill(u)}" stroke="${S.stroke}" stroke-width="${S.strokeW}" ${joinAttr()}`;
  const ctxAttrs = () => `fill="${S.fill}" fill-opacity="0.28" stroke="${S.stroke}" stroke-width="${S.strokeW}" ${joinAttr()}`;

  function labelSVG(l, x, y, fs) {
    const fill = textOn(colorOf(l.uid) || S.fill), halo = fill === "#ffffff" ? "#1b2430" : "#ffffff";
    return `<text x="${f1(x)}" y="${f1(y)}" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-size="${fs}" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="${fill}" stroke="${halo}" stroke-width="2.6" stroke-opacity="0.55" paint-order="stroke">${esc(l.text)}</text>`;
  }
  function pinSVG(p, xy, extra = "") {
    const s = p.size * 1.25;
    return `<g ${extra} transform="translate(${f1(xy[0])},${f1(xy[1])}) scale(${f1(s * 100) / 100})">` +
      `<ellipse cx="0" cy="0" rx="4.5" ry="1.6" fill="#000000" fill-opacity="0.28"/>` +
      `<path d="${PIN_PATH}" fill="${p.color}"${p.border ? ' stroke="#ffffff" stroke-width="1.6"' : ""}/>` +
      `<circle cx="0" cy="-17.5" r="3.6" fill="${lum(p.color) > 0.85 ? "#1b2430" : "#ffffff"}"/></g>`;
  }

  function paint() {
    const m = model;
    stage.style.setProperty("--map-bg", S.bg);
    svg.setAttribute("viewBox", `0 0 ${m.W} ${m.H}`);
    let h = `<rect x="0" y="0" width="${m.W}" height="${m.H}" fill="transparent"/><g id="vp">`;
    if (m.ctx.length) h += `<g id="ctx">` + m.ctx.map((c) => `<path class="ctx" data-c="${esc(c.id)}" d="${c.d}" ${ctxAttrs()}><title>${esc(c.name)}</title></path>`).join("") + `</g>`;
    h += `<g id="units">` + m.units.map((u, i) => `<path class="unit" data-u="${esc(u.uid)}" data-i="${i}" d="${u.d}" ${regionAttrs(u)}><title>${esc(u.name)}</title></path>`).join("") + `</g>`;
    h += `</g><g id="labels" pointer-events="none"></g><g id="pins"></g>`;
    svg.innerHTML = h;
    applyZoom();
  }

  // 확대 상태 반영: 지도는 변환, 이름표·핀은 화면 크기 유지
  function applyZoom() {
    const vp = svg.querySelector("#vp");
    if (!vp) return;
    vp.setAttribute("transform", zt.toString());
    svg.querySelector("#labels").innerHTML = model.labels
      .filter((l) => S.labels !== "all" || l.area * zt.k * zt.k > l.text.length * l.fs * l.fs * 0.9)
      .map((l) => labelSVG(l, zt.applyX(l.x), zt.applyY(l.y), l.fs)).join("");
    paintPins();
  }

  function paintPins() {
    const g = svg.querySelector("#pins");
    if (!g || !projection) return;
    g.innerHTML = pins.map((p) => {
      const xy = projection([p.lon, p.lat]);
      if (!xy) return "";
      const ring = p === activePin ? `<circle class="pin-ring" cx="0" cy="-12" r="15"/>` : "";
      return pinSVG(p, [zt.applyX(xy[0]), zt.applyY(xy[1])], `class="pin" data-pin="${p.id}"`).replace(/<\/g>$/, ring + "</g>");
    }).join("");
  }

  function repaintFills() {
    svg.querySelectorAll("#units .unit").forEach((el) => el.setAttribute("fill", unitFill(model.units[+el.dataset.i])));
    if (S.labels !== "none") { computeLabels(); applyZoom(); }
    renderList();
  }

  // ---------- 확대/이동 ----------
  const zoom = d3.zoom()
    .scaleExtent([1, 60])
    .clickDistance(6)
    .filter((e) => !e.target.closest(".pin") && (!e.button || e.type === "wheel"))
    .on("zoom", (e) => { zt = e.transform; applyZoom(); });
  function resetZoom(animate) {
    const sel = d3.select(svg);
    (animate ? sel.transition().duration(250) : sel).call(zoom.transform, d3.zoomIdentity);
  }
  function zoomBy(k) { d3.select(svg).transition().duration(200).call(zoom.scaleBy, k); }
  // 목록에서 고른 지역이 너무 작으면 그 지역으로 확대
  function zoomToUid(uid) {
    const els = [...svg.querySelectorAll(`#units .unit[data-u="${CSS.escape(uid)}"]`)];
    if (!els.length) return;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const el of els) { const b = el.getBBox(); x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height); }
    const w = Math.max(x1 - x0, 1), h = Math.max(y1 - y0, 1);
    if ((w * zt.k > 30 || h * zt.k > 30)) return;
    const k = Math.min(30, 0.3 * Math.min(model.W / w, model.H / h));
    const t = d3.zoomIdentity.translate(model.W / 2, model.H / 2).scale(k).translate(-(x0 + w / 2), -(y0 + h / 2));
    d3.select(svg).transition().duration(350).call(zoom.transform, t);
  }

  // ---------- 목록 / 경로 ----------
  const chevron = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;

  function renderCrumbs() {
    const parts = [{ label: "전세계", v: { level: "world" } }];
    if (view.ct) parts.push({ label: CONT[view.ct].ko, v: { level: "continent", ct: view.ct } });
    if (view.cc) parts.push({ label: data.byId.get(view.cc).properties.ko, v: null });
    const el = $("crumbs");
    el.innerHTML = "";
    parts.forEach((p, i) => {
      if (i) el.insertAdjacentHTML("beforeend", `<span class="sep">›</span>`);
      if (i === parts.length - 1) { el.insertAdjacentHTML("beforeend", `<span class="cur" aria-current="page">${esc(p.label)}</span>`); return; }
      const b = document.createElement("button");
      b.textContent = p.label;
      b.onclick = (e) => { e.stopPropagation(); navigate(p.v); };
      el.appendChild(b);
    });
    const n = units().length;
    $("listTitle").textContent = view.level === "world" ? (S.worldUnit === "country" ? `국가 · ${n}개` : "대륙") : view.level === "continent" ? `국가 · ${n}개` : `도·주 · ${n}개`;
    $("unitSwitch").hidden = view.level !== "world";
  }

  function renderList() {
    const q = $("search").value.trim().toLowerCase();
    const pm = paintMap();
    const us = units().filter((u) => !q || u.ko.toLowerCase().includes(q) || (u.en || "").toLowerCase().includes(q));
    let h = "";
    if (view.level === "world" && S.worldUnit === "country" && !q) {
      for (const c of CONT_ORDER) {
        const g = us.filter((u) => u.ct === c);
        if (g.length) h += `<li class="group">${CONT[c].ko}</li>` + g.map((u) => itemHTML(u, pm)).join("");
      }
    } else h = us.map((u) => itemHTML(u, pm)).join("");
    if (q) {
      const here = new Set(us.map((u) => u.id));
      const extra = data.countries.filter((f) => !here.has(f.properties.id) && (f.properties.ko.toLowerCase().includes(q) || f.properties.en.toLowerCase().includes(q))).slice(0, 30);
      if (extra.length) {
        h += `<li class="group">다른 국가로 이동</li>` + extra.map((f) =>
          `<li class="item" data-jump="${f.properties.id}"><span></span><span class="nm">${esc(f.properties.ko)}<small>${esc(CONT[f.properties.ct].ko)}</small></span><button class="go" data-jump="${f.properties.id}" aria-label="${esc(f.properties.ko)}로 이동">${chevron}</button></li>`).join("");
      }
    }
    if (!h) h = `<li class="empty">‘${esc(q)}’와 일치하는 지역이 없습니다.</li>`;
    listEl.innerHTML = h;
  }
  function itemHTML(u, pm) {
    const c = pm.has(u.id) ? S.palette[pm.get(u.id)] : null;
    const sub = u.sub || (u.en && u.en !== u.ko ? u.en : "");
    const tip = view.level === "country" ? "시 단위는 다음 업데이트" : "들어가기";
    return `<li class="item${c ? " painted" : ""}" data-id="${esc(u.id)}"><span class="box"${c ? ` style="background:${c}"` : ""}></span><span class="nm">${esc(u.ko)}${sub ? `<small>${esc(sub)}</small>` : ""}</span>` +
      `<button class="go" data-drill="${esc(u.id)}" ${u.drill ? "" : "disabled"} aria-label="${esc(u.ko)} 들어가기" title="${tip}">${chevron}</button></li>`;
  }

  async function navigate(v, { push = true } = {}) {
    if (v.level === "country") {
      if (!data.adm1Index.has(v.cc)) { toast("이 지역은 도·주 구분 데이터가 없습니다."); return; }
      try { await ensureAdm1(v.cc); } catch { toast("도·주 데이터를 불러오지 못했습니다. 연결을 확인해 주세요."); return; }
      v.ct = v.ct || data.byId.get(v.cc).properties.ct;
    }
    view.level = v.level; view.ct = v.level === "world" ? null : v.ct; view.cc = v.level === "country" ? v.cc : null;
    focus = null; updateFocus();
    $("search").value = "";
    if (push) { const k = hashKey(); history.replaceState(null, "", k ? "#" + k : location.pathname + location.search); }
    zt = d3.zoomIdentity;
    d3.select(svg).call(zoom.transform, d3.zoomIdentity);
    renderCrumbs(); renderList(); render();
  }

  // 한 단계 아래로. 세계(국가 단위)에서는 바로 그 나라로
  function drill(id) {
    if (view.level === "world") {
      if (S.worldUnit === "continent") return navigate({ level: "continent", ct: id });
      return goCountry(id);
    }
    if (view.level === "continent") return goCountry(id);
    toast("시 단위 지도는 다음 업데이트에서 추가됩니다.");
  }
  function goCountry(id) {
    const f = data.byId.get(id);
    if (!f) return;
    if (data.adm1Index.has(id)) return navigate({ level: "country", cc: id, ct: f.properties.ct });
    toast(`${f.properties.ko}: 도·주 구분 데이터가 없습니다.`);
  }

  // 칠하기: 같은 색이면 지우고, 아니면 그 색으로
  function applyTool(uid) {
    const pm = paintMap();
    if (S.tool === "erase") pm.delete(uid);
    else {
      const ci = typeof S.tool === "number" ? S.tool : lastColor;
      pm.get(uid) === ci ? pm.delete(uid) : pm.set(uid, ci);
    }
    repaintFills();
  }

  function setFocus(f) { focus = f; updateFocus(); }
  function updateFocus() {
    const bar = $("focusbar");
    if (!focus) { bar.hidden = true; return; }
    $("focusName").textContent = focus.ko;
    $("drillBtn").textContent = focus.ctx ? "이동 ›" : "들어가기 ›";
    $("drillBtn").hidden = !focus.drill;
    bar.hidden = false;
  }

  // ---------- 도구 ----------
  function renderTools() {
    $("paletteTools").innerHTML = S.palette.map((c, i) =>
      `<button class="tool" data-tool="${i}" title="${i + 1}번 색으로 칠하기 (${i + 1})" aria-label="${i + 1}번 색으로 칠하기"><span class="dot" style="background:${c}"></span></button>`).join("");
    document.querySelectorAll("#tools .tool").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tool === String(S.tool))));
    svg.classList.toggle("pinning", S.tool === "pin");
    $("paletteEdit").innerHTML = S.palette.map((c, i) => `<input type="color" data-pi="${i}" value="${c}" aria-label="${i + 1}번 칠하기 색">`).join("");
  }
  let toolBeforePin = 0;
  function setTool(t) {
    if (t === "pin" && S.tool !== "pin") toolBeforePin = S.tool;
    S.tool = t;
    if (typeof t === "number") lastColor = t;
    save(); renderTools();
    if (t !== "nav") setFocus(null);
    const msg = { nav: "탐색: 지역을 누르면 들어갈 수 있어요", erase: "지우개: 누른 지역의 색을 지웁니다", pin: "지도를 누르면 핀이 꽂힙니다" }[t];
    hint(msg || `${t + 1}번 색: 누르면 칠하고, 다시 누르면 지워집니다`);
  }

  // ---------- 핀 ----------
  let pinSeq = 1;
  function addPin(lon, lat, base) {
    const p = { id: pinSeq++, lon, lat, color: base ? base.color : "#e5484d", size: base ? base.size : 1, border: base ? base.border : true };
    pins.push(p);
    setActivePin(p);
    return p;
  }
  function setActivePin(p) {
    activePin = p;
    $("pinPanel").hidden = !p;
    if (p) {
      $("pinSize").value = p.size;
      $("pinBorder").checked = p.border;
      $("pinColors").querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.c === p.color));
    }
    paintPins();
  }
  function dupPin(p) {
    const xy = projection([p.lon, p.lat]);
    const ll = projection.invert([xy[0] + 18 / zt.k, xy[1] + 10 / zt.k]);
    addPin(ll[0], ll[1], p);
  }

  // ---------- 내보내기 ----------
  function buildSVG(onlySel) {
    const m = model, pm = paintMap();
    const units = onlySel ? m.units.filter((u) => pm.has(u.uid)) : m.units;
    if (!units.length) return null;
    const useCtx = !onlySel && m.ctx.length > 0;
    let vb = [0, 0, m.W, m.H];
    if (!useCtx) {
      const keep = new Set(units);
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      svg.querySelectorAll("#units .unit").forEach((el) => {
        if (!keep.has(m.units[+el.dataset.i])) return;
        const b = el.getBBox(); x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height);
      });
      const pd = 8 + S.strokeW;
      vb = [Math.floor(x0 - pd), Math.floor(y0 - pd), Math.ceil(x1 - x0 + pd * 2), Math.ceil(y1 - y0 + pd * 2)];
    }
    const inView = (x, y) => x >= vb[0] && y >= vb[1] && x <= vb[0] + vb[2] && y <= vb[1] + vb[3];
    let o = `<svg xmlns="http://www.w3.org/2000/svg" width="${vb[2]}" height="${vb[3]}" viewBox="${vb.join(" ")}">\n`;
    if (S.exportBg) o += `<rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="${S.bg}"/>\n`;
    if (useCtx) o += `<g id="주변국가">` + m.ctx.map((c) => `<path id="${idOf(c.name)}" d="${c.d}" ${ctxAttrs()}/>`).join("") + `</g>\n`;
    if (view.level === "world") {
      for (const c of CONT_ORDER) {
        const us = units.filter((u) => u.group === c);
        if (us.length) o += `<g id="${CONT[c].ko}">` + us.map((u) => `<path id="${idOf(u.name)}" d="${u.d}" ${regionAttrs(u)}/>`).join("") + `</g>\n`;
      }
    } else {
      o += `<g id="지역">` + units.map((u) => `<path id="${idOf(u.name)}" d="${u.d}" ${regionAttrs(u)}/>`).join("") + `</g>\n`;
    }
    const keepUids = new Set(units.map((u) => u.uid));
    const labels = m.labels.filter((l) => keepUids.has(l.uid) && (S.labels !== "all" || l.area > l.text.length * l.fs * l.fs * 0.9));
    if (labels.length) o += `<g id="이름">` + labels.map((l) => labelSVG(l, l.x, l.y, l.fs)).join("") + `</g>\n`;
    const ps = pins.map((p) => [p, projection([p.lon, p.lat])]).filter(([, xy]) => xy && inView(xy[0], xy[1]));
    if (ps.length) o += `<g id="핀">` + ps.map(([p, xy]) => pinSVG(p, xy)).join("") + `</g>\n`;
    return { svg: o + `</svg>\n`, w: vb[2], h: vb[3] };
  }
  const usedIds = new Map();
  function idOf(name) {
    const base = String(name).replace(/[^\p{L}\p{N}_-]+/gu, "_") || "region";
    const n = (usedIds.get(base) || 0) + 1;
    usedIds.set(base, n);
    return n > 1 ? `${base}_${n}` : base;
  }
  // 일부 브라우저가 한글 파일명을 'download'로 바꾸므로 영문 사용
  function fileBase(onlySel) {
    const parts = ["map", view.ct ? CONT[view.ct].en : "World"];
    if (view.cc) parts.push(data.byId.get(view.cc).properties.en);
    if (onlySel) parts.push("selected");
    return parts.join("_").replace(/[^A-Za-z0-9_-]+/g, "");
  }
  function download(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  function exportSVG(onlySel) {
    closePanels(); usedIds.clear();
    const r = buildSVG(onlySel);
    if (!r) { toast(onlySel ? "먼저 지역을 칠해 주세요." : "내보낼 지역이 없습니다."); return; }
    download(new Blob([r.svg], { type: "image/svg+xml" }), fileBase(onlySel) + ".svg");
    toast("SVG 저장됨 · PPT에서 도형으로 변환 후 그룹 해제");
  }
  function exportPNG(onlySel) {
    closePanels(); usedIds.clear();
    const r = buildSVG(onlySel);
    if (!r) { toast(onlySel ? "먼저 지역을 칠해 주세요." : "내보낼 지역이 없습니다."); return; }
    const scale = Math.min(4, 6000 / Math.max(r.w, r.h));
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = Math.round(r.w * scale); c.height = Math.round(r.h * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => { download(b, fileBase(onlySel) + ".png"); toast("PNG 저장됨"); }, "image/png");
    };
    img.onerror = () => toast("PNG 변환에 실패했습니다. SVG로 받아 주세요.");
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(r.svg);
  }
  async function copySVG() {
    closePanels(); usedIds.clear();
    const r = buildSVG(false);
    if (!r) return;
    try { await navigator.clipboard.writeText(r.svg); toast("SVG 코드를 복사했습니다."); }
    catch { toast("복사가 막혀 있습니다. SVG 다운로드를 사용해 주세요."); }
  }

  // ---------- UI 공통 ----------
  let toastT, hintT;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600);
  }
  function hint(msg, ms = 2400) {
    const h = $("hint");
    h.textContent = msg; h.classList.add("show");
    clearTimeout(hintT); hintT = setTimeout(() => h.classList.remove("show"), ms);
  }
  function showLoading(on) { $("loading").hidden = !on; }
  function closePanels() { $("morePanel").hidden = true; $("moreBtn").setAttribute("aria-expanded", "false"); }

  function syncControls() {
    const on = (id, v) => $(id).classList.toggle("on", v);
    on("shapeRound", S.shape === "round"); on("shapeAngle", S.shape === "angle");
    on("wuCont", S.worldUnit === "continent"); on("wuCountry", S.worldUnit === "country");
    $("detail").value = S.detail; $("detailOut").textContent = S.detail;
    $("detailPresets").querySelectorAll("button").forEach((b) => b.classList.toggle("on", +b.dataset.d === +S.detail));
    $("cFill").value = S.fill; $("cStroke").value = S.stroke; $("cBg").value = S.bg;
    $("strokeW").value = S.strokeW; $("strokeOut").textContent = (+S.strokeW).toFixed(1);
    $("presets").querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.preset === S.preset));
    $("labelMode").querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.label === S.labels));
    $("optContext").checked = S.context; $("optOverseas").checked = S.overseas;
    $("optAntarctica").checked = S.antarctica; $("optBg").checked = S.exportBg;
  }
  function setOpt(k, v, rerender = true) { S[k] = v; save(); syncControls(); if (rerender) render(); }

  function setTab(which) {
    const list = which === "list";
    $("tabList").setAttribute("aria-selected", String(list));
    $("tabStyle").setAttribute("aria-selected", String(!list));
    $("paneList").hidden = !list; $("paneStyle").hidden = list;
    if (isPhone()) openSheet(true);
  }
  function openSheet(open) {
    $("side").classList.toggle("open", open);
    $("sheetToggle").setAttribute("aria-expanded", String(open));
    $("sheetToggle").setAttribute("aria-label", open ? "목록 닫기" : "목록 열기");
  }

  function bind() {
    $("shapeRound").onclick = () => setOpt("shape", "round");
    $("shapeAngle").onclick = () => setOpt("shape", "angle");
    let raf = 0;
    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); };
    $("detail").oninput = (e) => { S.detail = +e.target.value; syncControls(); schedule(); };
    $("detail").onchange = save;
    $("detailPresets").onclick = (e) => { const d = e.target.dataset.d; if (d) setOpt("detail", +d); };
    const colorIn = (id, k) => { $(id).oninput = (e) => { S[k] = e.target.value; S.preset = ""; save(); syncControls(); render(); }; };
    colorIn("cFill", "fill"); colorIn("cStroke", "stroke"); colorIn("cBg", "bg");
    $("strokeW").oninput = (e) => { S.strokeW = +e.target.value; $("strokeOut").textContent = S.strokeW.toFixed(1); paint(); };
    $("strokeW").onchange = save;
    $("presets").onclick = (e) => { const p = e.target.dataset.preset; if (p) { Object.assign(S, PRESETS[p], { preset: p }); save(); syncControls(); render(); } };
    $("labelMode").onclick = (e) => { const v = e.target.dataset.label; if (v) setOpt("labels", v); };
    $("optContext").onchange = (e) => setOpt("context", e.target.checked);
    $("optOverseas").onchange = (e) => setOpt("overseas", e.target.checked);
    $("optAntarctica").onchange = (e) => { setOpt("antarctica", e.target.checked); renderCrumbs(); renderList(); };
    $("optBg").onchange = (e) => setOpt("exportBg", e.target.checked, false);
    $("paletteEdit").oninput = (e) => {
      const i = e.target.dataset.pi;
      if (i == null) return;
      S.palette[+i] = e.target.value; save();
      $("paletteTools").querySelectorAll(".dot")[+i].style.background = e.target.value;
      repaintFills();
    };
    $("wuCont").onclick = () => { setOpt("worldUnit", "continent", false); renderCrumbs(); renderList(); render(); };
    $("wuCountry").onclick = () => { setOpt("worldUnit", "country", false); renderCrumbs(); renderList(); render(); };

    $("tools").onclick = (e) => {
      const b = e.target.closest(".tool");
      if (!b) return;
      const t = b.dataset.tool;
      setTool(/^\d$/.test(t) ? +t : t);
    };
    $("tabList").onclick = () => setTab("list");
    $("tabStyle").onclick = () => setTab("style");

    $("dlAll").onclick = () => exportSVG(false);
    $("dlSel").onclick = () => exportSVG(true);
    $("dlSelM").onclick = () => exportSVG(true);
    $("dlPng").onclick = () => exportPNG(false);
    $("dlSelPng").onclick = () => exportPNG(true);
    $("copySvg").onclick = copySVG;
    $("moreBtn").onclick = () => { const p = $("morePanel"); p.hidden = !p.hidden; $("moreBtn").setAttribute("aria-expanded", String(!p.hidden)); };
    document.querySelectorAll("[data-close]").forEach((b) => { b.onclick = closePanels; });

    $("zoomIn").onclick = () => zoomBy(1.6);
    $("zoomOut").onclick = () => zoomBy(1 / 1.6);
    $("zoomFit").onclick = () => resetZoom(true);

    $("pinColors").innerHTML = PIN_COLORS.map((c) => `<button data-c="${c}" style="background:${c}" aria-label="핀 색 ${c}"></button>`).join("");
    $("pinColors").onclick = (e) => { const c = e.target.dataset.c; if (c && activePin) { activePin.color = c; setActivePin(activePin); } };
    $("pinSize").oninput = (e) => { if (activePin) { activePin.size = +e.target.value; paintPins(); } };
    $("pinBorder").onchange = (e) => { if (activePin) { activePin.border = e.target.checked; paintPins(); } };
    $("pinDel").onclick = () => { if (activePin) { pins = pins.filter((p) => p !== activePin); setActivePin(null); } };
    $("pinDup").onclick = () => { if (activePin) dupPin(activePin); };
    $("pinClose").onclick = () => setActivePin(null);

    // 목록: 행 = 칠하기(현재 색), › = 들어가기
    listEl.onclick = (e) => {
      const jump = e.target.closest("[data-jump]");
      if (jump) { const id = jump.dataset.jump; const f = data.byId.get(id); return data.adm1Index.has(id) ? goCountry(id) : navigate({ level: "continent", ct: f.properties.ct }); }
      const go = e.target.closest("[data-drill]");
      if (go) return drill(go.dataset.drill);
      const it = e.target.closest("[data-id]");
      if (!it) return;
      const id = it.dataset.id;
      if (S.tool === "nav" || S.tool === "pin") {
        const pm = paintMap();
        pm.get(id) === lastColor ? pm.delete(id) : pm.set(id, lastColor);
        repaintFills();
      } else applyTool(id);
      zoomToUid(id);
    };
    listEl.onmouseover = (e) => { const it = e.target.closest("[data-id]"); hoverUnit(it ? it.dataset.id : null); };
    listEl.onmouseleave = () => hoverUnit(null);
    $("search").oninput = renderList;
    $("selAll").onclick = () => { const pm = paintMap(); units().forEach((u) => pm.set(u.id, lastColor)); repaintFills(); };
    $("selNone").onclick = () => { paintMap().clear(); repaintFills(); };
    $("drillBtn").onclick = () => {
      if (!focus) return;
      if (focus.ctx) goCountry(focus.id); else drill(focus.id);
    };

    $("sheetBar").onclick = (e) => { if (!isPhone() || e.target.closest(".crumbs button")) return; openSheet(!$("side").classList.contains("open")); };

    // 지도
    d3.select(svg).call(zoom).on("dblclick.zoom", null);
    let drag = null;
    const pt = (e) => { const r = svg.getBoundingClientRect(); return zt.invert([(e.clientX - r.left) * (model.W / r.width), (e.clientY - r.top) * (model.H / r.height)]); };
    svg.addEventListener("pointerdown", (e) => {
      const pg = e.target.closest(".pin");
      if (!pg) return;
      const p = pins.find((x) => x.id === +pg.dataset.pin);
      setActivePin(p);
      drag = { p };
      svg.setPointerCapture(e.pointerId);
      e.preventDefault(); e.stopPropagation();
    });
    svg.addEventListener("pointermove", (e) => {
      if (drag) {
        const ll = projection.invert(pt(e));
        if (ll) { drag.p.lon = ll[0]; drag.p.lat = ll[1]; paintPins(); }
        return;
      }
      if (e.pointerType === "mouse" && !e.buttons) {
        const u = e.target.closest(".unit");
        hoverUnit(u ? u.dataset.u : null, true);
      }
    });
    svg.addEventListener("pointerup", () => { drag = null; });
    svg.addEventListener("click", (e) => {
      if (e.target.closest(".pin")) return;
      closePanels();
      if (isPhone() && $("side").classList.contains("open")) openSheet(false);
      if (S.tool === "pin") {
        const ll = projection.invert(pt(e));
        if (ll) addPin(ll[0], ll[1], activePin);
        setTool(toolBeforePin === "pin" ? 0 : toolBeforePin);
        return;
      }
      setActivePin(null);
      const u = e.target.closest(".unit"), c = e.target.closest(".ctx");
      if (S.tool === "nav") {
        if (u) { const it = units().find((x) => x.id === u.dataset.u); setFocus(it ? { ...it } : null); }
        else if (c) { const f = data.byId.get(c.dataset.c); setFocus(f ? { id: f.properties.id, ko: f.properties.ko, drill: true, ctx: true } : null); }
        else setFocus(null);
        return;
      }
      if (u) applyTool(u.dataset.u);
    });
    svg.addEventListener("dblclick", (e) => {
      const u = e.target.closest(".unit");
      if (u && S.tool !== "pin") { e.preventDefault(); drill(u.dataset.u); }
    });

    document.addEventListener("keydown", (e) => {
      if (e.target.matches("input, textarea")) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "c" && activePin) { pinClipboard = { ...activePin }; toast("핀 복사됨"); e.preventDefault(); }
      else if (mod && e.key.toLowerCase() === "v" && pinClipboard) { dupPin(pinClipboard); pinClipboard = { ...activePin }; e.preventDefault(); }
      else if ((e.key === "Delete" || e.key === "Backspace") && activePin) { pins = pins.filter((p) => p !== activePin); setActivePin(null); e.preventDefault(); }
      else if (e.key === "Escape") { if (S.tool === "pin") setTool(toolBeforePin); setActivePin(null); closePanels(); setFocus(null); }
      else if (!mod && /^[1-5]$/.test(e.key)) setTool(+e.key - 1);
      else if (!mod && e.key.toLowerCase() === "e") setTool("erase");
      else if (!mod && e.key.toLowerCase() === "h") setTool("nav");
      else if (!mod && e.key.toLowerCase() === "p") setTool("pin");
    });

    new ResizeObserver(schedule).observe(stage);
    window.addEventListener("hashchange", routeFromHash);
  }

  function hoverUnit(id, fromMap) {
    svg.querySelectorAll(".unit.hover").forEach((el) => el.classList.remove("hover"));
    listEl.querySelectorAll(".item.hover").forEach((el) => el.classList.remove("hover"));
    if (!id) return;
    svg.querySelectorAll(`.unit[data-u="${CSS.escape(id)}"]`).forEach((el) => el.classList.add("hover"));
    const li = listEl.querySelector(`.item[data-id="${CSS.escape(id)}"]`);
    if (li) { li.classList.add("hover"); if (fromMap) li.scrollIntoView({ block: "nearest" }); }
  }

  function routeFromHash() {
    const h = location.hash.slice(1);
    if (h.startsWith("c-") && CONT[h.slice(2)]) return navigate({ level: "continent", ct: h.slice(2) }, { push: false });
    if (h.startsWith("k-") && data.byId.has(h.slice(2))) {
      const id = h.slice(2), f = data.byId.get(id);
      return data.adm1Index.has(id) ? navigate({ level: "country", cc: id, ct: f.properties.ct }, { push: false }) : navigate({ level: "continent", ct: f.properties.ct }, { push: false });
    }
    return navigate({ level: "world" }, { push: false });
  }

  // ---------- 시작 ----------
  async function init() {
    syncControls(); renderTools(); bind();
    showLoading(true);
    try {
      const [world, idx] = await Promise.all([loadJSON("data/world.json"), loadJSON("data/adm1-index.json")]);
      data.world = prepTopo(world);
      data.countries = data.world.full;
      data.countries.forEach((f) => data.byId.set(f.properties.id, f));
      data.adm1Index = new Set(idx);
    } catch (err) {
      $("loading").textContent = "지도 데이터를 불러오지 못했습니다. 새로고침해 주세요.";
      console.error(err);
      return;
    }
    showLoading(false);
    await routeFromHash();
    if (!S.seenIntro) {
      hint(isPhone() ? "지역을 누르면 칠해져요 · 두 손가락으로 확대 · ✋로 들어가기" : "지역을 클릭하면 칠해져요 · 휠로 확대 · 더블클릭으로 들어가기", 6000);
      S.seenIntro = true; save();
    }
  }
  init();
})();
