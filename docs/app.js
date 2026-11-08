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
    dark: { bg: "#10161d", fill: "#f2f4f6", sel: "#2bb5ad", stroke: "#10161d", strokeW: 0.8 },
    light: { bg: "#ffffff", fill: "#d5dbe1", sel: "#0b7f86", stroke: "#ffffff", strokeW: 1 },
    mono: { bg: "#ffffff", fill: "#ffffff", sel: "#1f2937", stroke: "#1f2937", strokeW: 0.8 },
  };
  const PIN_COLORS = ["#e5484d", "#f5a524", "#f7d038", "#2bb5ad", "#3b82f6", "#8b5cf6", "#8a96a3", "#ffffff", "#111827"];
  const PIN_PATH = "M0,0C-2.2,-5.6 -9,-10.4 -9,-17.5A9,9 0 1 1 9,-17.5C9,-10.4 2.2,-5.6 0,0Z";
  const STORE_KEY = "mapx-world-v1";

  // ---------- 상태 ----------
  const defaults = {
    shape: "angle", detail: 60, labels: "none",
    context: true, overseas: false, antarctica: false, exportBg: false,
    ...PRESETS.dark, preset: "dark",
  };
  const S = Object.assign({}, defaults, load());
  const view = { level: "world", ct: null, cc: null };
  const selections = new Map(); // viewKey -> Set
  let focus = null; // {id, name, drill}
  let pins = [];
  let activePin = null;
  let pinClipboard = null;
  let pinMode = false;
  let model = null; // 마지막 렌더 결과
  let projection = null;

  const $ = (id) => document.getElementById(id);
  const svg = $("map"), stage = $("stage"), listEl = $("list");

  function load() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; } }
  function save() {
    try {
      const { shape, detail, labels, context, overseas, antarctica, exportBg, bg, fill, sel, stroke, strokeW, preset } = S;
      localStorage.setItem(STORE_KEY, JSON.stringify({ shape, detail, labels, context, overseas, antarctica, exportBg, bg, fill, sel, stroke, strokeW, preset }));
    } catch { /* 저장 불가 환경 무시 */ }
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

  // 디테일(1~100) → 유지할 점 비율. 섬(닫힌 단일 arc)은 최소 형태 유지
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
    try {
      const e = prepTopo(await loadJSON(`data/adm1/${cc}.json`));
      data.adm1.set(cc, e);
      return e;
    } finally { showLoading(false); }
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
  function centerLon(geo) {
    let [[w], [e]] = d3.geoBounds(geo);
    if (e < w) e += 360;
    return (w + e) / 2;
  }
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
    closePath() { if (this.cur) this.cur.closed = true; },
    arc() {}, beginPath() {},
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
      if (maxx - minx < 0.6 && maxy - miny < 0.6) continue;
      const last = r[r.length - 1];
      if (last[0] === r[0][0] && last[1] === r[0][1]) r = r.slice(0, -1);
      if (!round || r.length < 3) {
        d += "M" + r.map(([x, y]) => f1(x) + "," + f1(y)).join("L") + "Z";
      } else {
        const n = r.length;
        d += "M" + f1(r[0][0]) + "," + f1(r[0][1]);
        for (let i = 0; i < n; i++) {
          const p0 = r[(i - 1 + n) % n], p1 = r[i], p2 = r[(i + 1) % n], p3 = r[(i + 2) % n];
          const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
          const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
          d += "C" + f1(c1x) + "," + f1(c1y) + " " + f1(c2x) + "," + f1(c2y) + " " + f1(p2[0]) + "," + f1(p2[1]);
        }
        d += "Z";
      }
    }
    return d;
  }

  function labelPoint(geom) {
    const polys = polysOf(geom);
    let best = null, ba = -1;
    for (const c of polys) {
      const g = { type: "Polygon", coordinates: c };
      const a = d3.geoPath(projection).area(g);
      if (a > ba) { ba = a; best = g; }
    }
    if (!best || ba < 60) return null;
    const p = d3.geoPath(projection).centroid(best);
    return isFinite(p[0]) ? { x: p[0], y: p[1], area: ba } : null;
  }

  // ---------- 뷰 정의 ----------
  const viewKey = () => (view.level === "world" ? "world" : view.level === "continent" ? "c-" + view.ct : "k-" + view.cc);
  function selSet() { const k = viewKey(); if (!selections.has(k)) selections.set(k, new Set()); return selections.get(k); }

  function units() {
    if (view.level === "world") {
      return CONT_ORDER.filter((c) => c !== "AN" || S.antarctica).map((c) => ({ id: c, ko: CONT[c].ko, en: CONT[c].en, drill: true }));
    }
    if (view.level === "continent") {
      return data.countries.filter((f) => f.properties.ct === view.ct)
        .map((f) => ({ id: f.properties.id, ko: f.properties.ko, en: f.properties.en, drill: data.adm1Index.has(f.properties.id) }))
        .sort((a, b) => a.ko.localeCompare(b.ko, "ko"));
    }
    const e = data.adm1.get(view.cc);
    return e.full.map((f) => ({ id: f.properties.id, ko: f.properties.ko, en: f.properties.en, sub: f.properties.t, drill: false }))
      .sort((a, b) => a.ko.localeCompare(b.ko, "ko"));
  }

  // ---------- 렌더 ----------
  function render() {
    if (!data.world) return;
    const W = Math.max(200, stage.clientWidth), H = Math.max(160, stage.clientHeight);
    const pad = Math.round(Math.min(W, H) * 0.05);
    const ext = [[pad, pad], [W - pad, H - pad]];
    const round = S.shape === "round";
    const sel = selSet();
    const worldF = view.level === "country" ? null : featuresAt(data.world, S.detail);
    let unitFeats = [], ctxFeats = [];

    if (view.level === "world") {
      const feats = worldF.filter((f) => S.antarctica || f.properties.ct !== "AN");
      projection = d3.geoNaturalEarth1().rotate([-10, 0]).precision(0.3);
      projection.fitExtent(ext, S.antarctica ? { type: "Sphere" } : { type: "FeatureCollection", features: feats });
      unitFeats = feats.map((f) => ({ f, uid: f.properties.ct, name: f.properties.ko, group: f.properties.ct }));
    } else if (view.level === "continent") {
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

    const m = { W, H, round, units: [], ctx: [], labels: [] };
    for (const u of unitFeats) {
      const d = pathD(u.f.geometry, round);
      if (!d) continue;
      m.units.push({ uid: u.uid, name: u.name, group: u.group, d, sel: sel.has(u.uid), geom: u.f.geometry });
    }
    if (S.context && view.level !== "world") {
      for (const f of ctxFeats) { const d = pathD(f.geometry, round); if (d) m.ctx.push({ name: f.properties.ko, d }); }
    }
    // 이름표
    if (S.labels !== "none") {
      const fs = Math.round(Math.max(10, Math.min(15, Math.min(W, H) * 0.02)));
      const items = [];
      if (view.level === "world") {
        const t = data.world.topo;
        for (const c of CONT_ORDER) {
          if (c === "AN" && !S.antarctica) continue;
          if (S.labels === "sel" && !sel.has(c)) continue;
          const geoms = t.objects[data.world.name].geometries.filter((g) => g.properties.ct === c);
          const p = labelPoint(topojson.merge(t, geoms));
          if (p) items.push({ x: p.x, y: p.y, text: CONT[c].ko, sel: sel.has(c) });
        }
      } else {
        for (const u of m.units) {
          if (S.labels === "sel" && !u.sel) continue;
          const p = labelPoint(u.geom);
          if (!p) continue;
          if (S.labels === "all" && p.area < u.name.length * fs * fs * 0.9) continue;
          items.push({ x: p.x, y: p.y, text: u.name, sel: u.sel });
        }
      }
      m.labels = items.map((it) => ({ ...it, fs, color: textOn(it.sel ? S.sel : S.fill) }));
    }
    model = m;
    paint();
  }

  function lum(hex) {
    const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }
  const textOn = (hex) => (lum(hex) > 0.6 ? "#1b2430" : "#ffffff");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function regionAttrs(u) {
    return `fill="${u.sel ? S.sel : S.fill}" stroke="${S.stroke}" stroke-width="${S.strokeW}" stroke-linejoin="${model.round ? "round" : "miter"}"`;
  }
  function ctxAttrs() {
    return `fill="${S.fill}" fill-opacity="0.28" stroke="${S.stroke}" stroke-width="${S.strokeW}" stroke-linejoin="${model.round ? "round" : "miter"}"`;
  }
  function labelSVG(l) {
    const halo = l.color === "#ffffff" ? "#1b2430" : "#ffffff";
    return `<text x="${f1(l.x)}" y="${f1(l.y)}" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-size="${l.fs}" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="${l.color}" stroke="${halo}" stroke-width="2.6" stroke-opacity="0.55" paint-order="stroke">${esc(l.text)}</text>`;
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
    let h = "";
    if (m.ctx.length) h += `<g id="ctx" pointer-events="none">` + m.ctx.map((c) => `<path d="${c.d}" ${ctxAttrs()}/>`).join("") + `</g>`;
    h += `<g id="units">` + m.units.map((u, i) => `<path class="unit" data-u="${esc(u.uid)}" data-i="${i}" d="${u.d}" ${regionAttrs(u)}><title>${esc(u.name)}</title></path>`).join("") + `</g>`;
    h += `<g id="labels" pointer-events="none">` + m.labels.map(labelSVG).join("") + `</g>`;
    h += `<g id="pins"></g>`;
    svg.innerHTML = h;
    paintPins();
  }

  function paintPins() {
    const g = svg.querySelector("#pins");
    if (!g || !projection) return;
    g.innerHTML = pins.map((p) => {
      const xy = projection([p.lon, p.lat]);
      if (!xy) return "";
      const ring = p === activePin ? `<circle class="pin-ring" cx="0" cy="-12" r="15"/>` : "";
      return pinSVG(p, xy, `class="pin${p === activePin ? " active" : ""}" data-pin="${p.id}"`).replace("</g>", ring + "</g>");
    }).join("");
  }

  // 선택 상태만 바뀔 때는 색만 갱신
  function repaintSelection() {
    const sel = selSet();
    for (const u of model.units) u.sel = sel.has(u.uid);
    svg.querySelectorAll("#units .unit").forEach((el) => {
      const u = model.units[+el.dataset.i];
      el.setAttribute("fill", u.sel ? S.sel : S.fill);
    });
    if (S.labels === "sel") render();
    renderList();
  }

  // ---------- 목록 / 경로 ----------
  const chevron = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;

  function renderCrumbs() {
    const parts = [{ label: "전세계", go: () => navigate({ level: "world" }), cur: view.level === "world" }];
    if (view.ct) parts.push({ label: CONT[view.ct].ko, go: () => navigate({ level: "continent", ct: view.ct }), cur: view.level === "continent" });
    if (view.cc) parts.push({ label: data.byId.get(view.cc).properties.ko, go: () => {}, cur: view.level === "country" });
    const el = $("crumbs");
    el.innerHTML = "";
    parts.forEach((p, i) => {
      if (i) el.insertAdjacentHTML("beforeend", `<span class="sep">›</span>`);
      const b = document.createElement("button");
      b.textContent = p.label;
      if (p.cur) b.setAttribute("aria-current", "true");
      b.onclick = p.go;
      el.appendChild(b);
    });
    $("sheetLabel").textContent = parts[parts.length - 1].label;
    $("listTitle").textContent = view.level === "world" ? "대륙" : view.level === "continent" ? `국가 · ${units().length}개국` : `도·주 · ${units().length}개`;
  }

  function renderList() {
    const q = $("search").value.trim().toLowerCase();
    const sel = selSet();
    const us = units().filter((u) => !q || u.ko.toLowerCase().includes(q) || (u.en || "").toLowerCase().includes(q));
    let h = us.map((u) => itemHTML(u, sel.has(u.id))).join("");
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
  function itemHTML(u, on) {
    const sub = u.sub || (u.en && u.en !== u.ko ? u.en : "");
    return `<li class="item" role="option" aria-selected="${on}" data-id="${esc(u.id)}"><span class="box"></span><span class="nm">${esc(u.ko)}${sub ? `<small>${esc(sub)}</small>` : ""}</span>` +
      `<button class="go" data-drill="${esc(u.id)}" ${u.drill ? "" : "disabled"} aria-label="${esc(u.ko)} 들어가기" title="${view.level === "country" ? "시 단위는 다음 업데이트" : "들어가기"}">${chevron}</button></li>`;
  }

  async function navigate(v, { push = true } = {}) {
    if (v.level === "country") {
      try { await ensureAdm1(v.cc); } catch { toast("이 국가의 도·주 데이터를 불러오지 못했습니다."); return; }
      v.ct = v.ct || data.byId.get(v.cc).properties.ct;
    }
    view.level = v.level; view.ct = v.level === "world" ? null : v.ct; view.cc = v.level === "country" ? v.cc : null;
    focus = null; updateFocus();
    $("search").value = "";
    if (push) { const k = viewKey(); history.replaceState(null, "", k === "world" ? location.pathname + location.search : "#" + k); }
    renderCrumbs(); renderList(); render();
  }

  function drill(id) {
    if (view.level === "world") navigate({ level: "continent", ct: id });
    else if (view.level === "continent") {
      if (data.adm1Index.has(id)) navigate({ level: "country", cc: id, ct: view.ct });
      else toast("이 국가는 도·주 구분 데이터가 없습니다.");
    } else toast("시 단위 지도는 다음 업데이트에서 추가됩니다.");
  }

  function toggleUnit(id) {
    const sel = selSet();
    sel.has(id) ? sel.delete(id) : sel.add(id);
    repaintSelection();
  }

  function setFocus(id) {
    const u = units().find((x) => x.id === id);
    focus = u || null;
    updateFocus();
  }
  function updateFocus() {
    const bar = $("focusbar");
    if (!focus || (!focus.drill && view.level !== "country")) { bar.hidden = true; return; }
    $("focusName").textContent = focus.ko;
    $("drillBtn").hidden = !focus.drill;
    bar.hidden = !focus.drill;
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
      $("pinSize").value = p.size; $("pinSizeOut").textContent = p.size.toFixed(1);
      $("pinBorder").checked = p.border;
      $("pinColors").querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.c === p.color));
    }
    paintPins();
  }
  function dupPin(p) {
    const xy = projection([p.lon, p.lat]);
    const ll = projection.invert([xy[0] + 18, xy[1] + 10]);
    addPin(ll[0], ll[1], p);
  }

  // ---------- 내보내기 ----------
  function buildSVG(onlySel) {
    const m = model;
    const units = onlySel ? m.units.filter((u) => u.sel) : m.units;
    if (!units.length) return null;
    const useCtx = !onlySel && m.ctx.length > 0;
    let vb = [0, 0, m.W, m.H];
    if (!useCtx) {
      const els = [...svg.querySelectorAll("#units .unit")].filter((el) => !onlySel || m.units[+el.dataset.i].sel);
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const el of els) { const b = el.getBBox(); x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height); }
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
    const keepNames = new Set(units.map((u) => u.name));
    const labels = m.labels.filter((l) => view.level === "world" || keepNames.has(l.text));
    if (labels.length) o += `<g id="이름">` + labels.map(labelSVG).join("") + `</g>\n`;
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
  function fileBase(onlySel) {
    // 일부 브라우저가 한글 파일명을 'download'로 바꾸므로 영문 사용
    const parts = ["map"];
    if (view.ct) parts.push(CONT[view.ct].en); else parts.push("World");
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
    usedIds.clear();
    const r = buildSVG(onlySel);
    if (!r) { toast(onlySel ? "먼저 지역을 선택하세요." : "내보낼 지역이 없습니다."); return; }
    download(new Blob([r.svg], { type: "image/svg+xml" }), fileBase(onlySel) + ".svg");
    toast("SVG 저장됨 · PPT에서 도형으로 변환 후 그룹 해제");
  }
  function exportPNG(onlySel) {
    usedIds.clear();
    const r = buildSVG(onlySel);
    if (!r) { toast(onlySel ? "먼저 지역을 선택하세요." : "내보낼 지역이 없습니다."); return; }
    const scale = Math.min(4, 6000 / Math.max(r.w, r.h));
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = Math.round(r.w * scale); c.height = Math.round(r.h * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => { download(b, fileBase(onlySel) + ".png"); toast("PNG 저장됨"); }, "image/png");
    };
    img.onerror = () => toast("PNG 변환에 실패했습니다. SVG로 받아주세요.");
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(r.svg);
  }
  async function copySVG() {
    usedIds.clear();
    const r = buildSVG(false);
    if (!r) return;
    try { await navigator.clipboard.writeText(r.svg); toast("SVG 코드를 복사했습니다."); }
    catch { toast("복사가 막혀 있습니다. SVG 다운로드를 사용하세요."); }
  }

  // ---------- UI 공통 ----------
  let toastT;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600);
  }
  let hintT;
  function hint(msg) {
    const h = $("hint");
    h.textContent = msg; h.classList.add("show");
    clearTimeout(hintT); hintT = setTimeout(() => h.classList.remove("show"), 2400);
  }
  function showLoading(on) { $("loading").hidden = !on; }

  function syncControls() {
    $("shapeRound").setAttribute("aria-checked", S.shape === "round");
    $("shapeAngle").setAttribute("aria-checked", S.shape === "angle");
    $("detail").value = S.detail; $("detailOut").textContent = S.detail;
    $("cFill").value = S.fill; $("cSel").value = S.sel; $("cStroke").value = S.stroke; $("cBg").value = S.bg;
    $("strokeW").value = S.strokeW; $("strokeOut").textContent = (+S.strokeW).toFixed(1);
    $("presets").querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.preset === S.preset));
    $("labelMode").querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.label === S.labels));
    $("optContext").checked = S.context; $("optOverseas").checked = S.overseas;
    $("optAntarctica").checked = S.antarctica; $("optBg").checked = S.exportBg;
  }
  function setOpt(k, v, rerender = true) { S[k] = v; save(); syncControls(); if (rerender) render(); }

  function togglePanel(id, btnId) {
    const p = $(id), open = p.hidden;
    ["stylePanel", "morePanel"].forEach((x) => { $(x).hidden = true; });
    $("styleBtn").setAttribute("aria-expanded", "false"); $("moreBtn").setAttribute("aria-expanded", "false");
    p.hidden = !open;
    $(btnId).setAttribute("aria-expanded", String(open));
  }

  function bind() {
    $("shapeRound").onclick = () => setOpt("shape", "round");
    $("shapeAngle").onclick = () => setOpt("shape", "angle");
    let raf = 0;
    $("detail").oninput = (e) => {
      S.detail = +e.target.value; $("detailOut").textContent = S.detail;
      cancelAnimationFrame(raf); raf = requestAnimationFrame(render);
    };
    $("detail").onchange = save;
    const colorIn = (id, k) => { $(id).oninput = (e) => { S[k] = e.target.value; S.preset = ""; save(); syncControls(); render(); }; };
    colorIn("cFill", "fill"); colorIn("cSel", "sel"); colorIn("cStroke", "stroke"); colorIn("cBg", "bg");
    $("strokeW").oninput = (e) => { S.strokeW = +e.target.value; $("strokeOut").textContent = S.strokeW.toFixed(1); paint(); };
    $("strokeW").onchange = save;
    $("presets").onclick = (e) => { const p = e.target.dataset.preset; if (p) { Object.assign(S, PRESETS[p], { preset: p }); save(); syncControls(); render(); } };
    $("labelMode").onclick = (e) => { const v = e.target.dataset.label; if (v) setOpt("labels", v); };
    $("optContext").onchange = (e) => setOpt("context", e.target.checked);
    $("optOverseas").onchange = (e) => setOpt("overseas", e.target.checked);
    $("optAntarctica").onchange = (e) => { setOpt("antarctica", e.target.checked); renderList(); };
    $("optBg").onchange = (e) => setOpt("exportBg", e.target.checked, false);
    $("styleBtn").onclick = () => togglePanel("stylePanel", "styleBtn");
    $("moreBtn").onclick = () => togglePanel("morePanel", "moreBtn");
    document.querySelectorAll("[data-close]").forEach((b) => { b.onclick = () => togglePanel(b.dataset.close, b.dataset.close === "stylePanel" ? "styleBtn" : "moreBtn"); });

    $("dlAll").onclick = () => exportSVG(false);
    $("dlSel").onclick = () => exportSVG(true);
    $("dlPng").onclick = () => exportPNG(false);
    $("dlSelPng").onclick = () => exportPNG(true);
    $("copySvg").onclick = copySVG;

    $("pinMode").onclick = () => {
      pinMode = !pinMode;
      $("pinMode").setAttribute("aria-pressed", String(pinMode));
      svg.classList.toggle("pinning", pinMode);
      if (pinMode) hint("지도를 누르면 핀이 꽂힙니다");
    };
    $("pinColors").innerHTML = PIN_COLORS.map((c) => `<button data-c="${c}" style="background:${c}" aria-label="핀 색 ${c}"></button>`).join("");
    $("pinColors").onclick = (e) => { const c = e.target.dataset.c; if (c && activePin) { activePin.color = c; setActivePin(activePin); } };
    $("pinSize").oninput = (e) => { if (activePin) { activePin.size = +e.target.value; $("pinSizeOut").textContent = activePin.size.toFixed(1); paintPins(); } };
    $("pinBorder").onchange = (e) => { if (activePin) { activePin.border = e.target.checked; paintPins(); } };
    $("pinDel").onclick = () => { if (activePin) { pins = pins.filter((p) => p !== activePin); setActivePin(null); } };
    $("pinDup").onclick = () => { if (activePin) dupPin(activePin); };
    $("pinClose").onclick = () => setActivePin(null);

    // 목록
    listEl.onclick = (e) => {
      const jump = e.target.closest("[data-jump]");
      if (jump) { const id = jump.dataset.jump; const f = data.byId.get(id); return data.adm1Index.has(id) ? navigate({ level: "country", cc: id, ct: f.properties.ct }) : navigate({ level: "continent", ct: f.properties.ct }); }
      const go = e.target.closest("[data-drill]");
      if (go) return drill(go.dataset.drill);
      const it = e.target.closest("[data-id]");
      if (it) { toggleUnit(it.dataset.id); setFocus(it.dataset.id); }
    };
    listEl.onmouseover = (e) => { const it = e.target.closest("[data-id]"); hoverUnit(it ? it.dataset.id : null); };
    listEl.onmouseleave = () => hoverUnit(null);
    $("search").oninput = renderList;
    $("selAll").onclick = () => { const s = selSet(); units().forEach((u) => s.add(u.id)); repaintSelection(); };
    $("selNone").onclick = () => { selSet().clear(); repaintSelection(); };
    $("drillBtn").onclick = () => focus && drill(focus.id);

    // 시트 (모바일)
    $("sheetToggle").onclick = () => {
      const open = !$("side").classList.contains("open");
      $("side").classList.toggle("open", open);
      $("sheetToggle").setAttribute("aria-expanded", String(open));
    };

    // 지도 상호작용
    let drag = null;
    const pt = (e) => { const r = svg.getBoundingClientRect(); return [(e.clientX - r.left) * (model.W / r.width), (e.clientY - r.top) * (model.H / r.height)]; };
    svg.addEventListener("pointerdown", (e) => {
      const pg = e.target.closest(".pin");
      if (pg) {
        const p = pins.find((x) => x.id === +pg.dataset.pin);
        setActivePin(p);
        drag = { p, moved: false };
        svg.setPointerCapture(e.pointerId);
        e.preventDefault();
      }
    });
    svg.addEventListener("pointermove", (e) => {
      if (drag) {
        const ll = projection.invert(pt(e));
        if (ll) { drag.p.lon = ll[0]; drag.p.lat = ll[1]; drag.moved = true; paintPins(); }
        return;
      }
      if (e.pointerType === "mouse") {
        const u = e.target.closest(".unit");
        hoverUnit(u ? u.dataset.u : null, true);
      }
    });
    svg.addEventListener("pointerup", () => { drag = null; });
    svg.addEventListener("click", (e) => {
      if (e.target.closest(".pin")) return;
      if (pinMode) {
        const ll = projection.invert(pt(e));
        if (ll) addPin(ll[0], ll[1], activePin);
        return;
      }
      const u = e.target.closest(".unit");
      if (u) { toggleUnit(u.dataset.u); setFocus(u.dataset.u); }
      else { focus = null; updateFocus(); setActivePin(null); }
    });
    svg.addEventListener("dblclick", (e) => {
      const u = e.target.closest(".unit");
      if (u && !pinMode) { e.preventDefault(); const id = u.dataset.u; toggleUnit(id); drill(id); }
    });

    document.addEventListener("keydown", (e) => {
      if (e.target.matches("input, textarea")) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "c" && activePin) { pinClipboard = { ...activePin }; toast("핀 복사됨"); e.preventDefault(); }
      else if (mod && e.key.toLowerCase() === "v" && pinClipboard) { dupPin(pinClipboard); pinClipboard = { ...activePin }; e.preventDefault(); }
      else if ((e.key === "Delete" || e.key === "Backspace") && activePin) { pins = pins.filter((p) => p !== activePin); setActivePin(null); e.preventDefault(); }
      else if (e.key === "Escape") {
        if (pinMode) $("pinMode").click();
        setActivePin(null);
        ["stylePanel", "morePanel"].forEach((x) => { $(x).hidden = true; });
      }
    });

    new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); }).observe(stage);
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
    syncControls();
    bind();
    showLoading(true);
    try {
      const [world, idx] = await Promise.all([loadJSON("data/world.json"), loadJSON("data/adm1-index.json")]);
      data.world = prepTopo(world);
      data.countries = data.world.full;
      data.countries.forEach((f) => data.byId.set(f.properties.id, f));
      data.adm1Index = new Set(idx);
    } catch (err) {
      $("loading").textContent = "지도 데이터를 불러오지 못했습니다. 새로고침 해주세요.";
      console.error(err);
      return;
    }
    showLoading(false);
    await routeFromHash();
    // 첫 화면 예시: 아무 선택이 없으면 아시아를 강조
    if (view.level === "world" && selSet().size === 0) { selSet().add("AS"); repaintSelection(); }
  }
  init();
})();
