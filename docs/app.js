/* 지도추출기 World — 세계 › 대륙 › 국가 › 도·주 › 시 */
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
  const WORLD_EXT = [-169, -57, 190, 80];
  const PRESETS = {
    dark: { bg: "#10161d", fill: "#f2f4f6", stroke: "#10161d", strokeW: 0.8 },
    light: { bg: "#ffffff", fill: "#d5dbe1", stroke: "#ffffff", strokeW: 1 },
    mono: { bg: "#ffffff", fill: "#ffffff", stroke: "#1f2937", strokeW: 0.8 },
  };
  const DEFAULT_PALETTE = ["#2bb5ad", "#3b82f6", "#f5a524", "#e5484d", "#8b5cf6"];
  const PIN_COLORS = ["#e5484d", "#f5a524", "#f7d038", "#2bb5ad", "#3b82f6", "#8b5cf6", "#8a96a3", "#ffffff", "#111827"];
  const PIN_PATH = "M0,0C-2.2,-5.6 -9,-10.4 -9,-17.5A9,9 0 1 1 9,-17.5C9,-10.4 2.2,-5.6 0,0Z";
  const STORE_KEY = "mapx-world-v3";
  const SAVE_KEYS = ["shape", "detail", "labels", "context", "overseas", "antarctica", "exportBg", "bg", "fill", "stroke", "strokeW", "preset", "palette", "tool", "seenIntro"];
  const LEVEL_NAME = { world: "대륙", continent: "국가", country: "도·주", region: "시·군·구" };
  const DEPTH = { c: 1, a1: 2, a2: 3 };

  // ---------- 상태 ----------
  const defaults = {
    shape: "angle", detail: 60, labels: "none", context: true, overseas: false, antarctica: false, exportBg: false,
    ...PRESETS.dark, preset: "dark", palette: DEFAULT_PALETTE.slice(), tool: 0, seenIntro: false,
  };
  const saved = load();
  const S = Object.assign({}, defaults, saved.s || {});
  if (!Array.isArray(S.palette) || S.palette.length !== 5) S.palette = DEFAULT_PALETTE.slice();
  if (typeof S.tool !== "number" && S.tool !== "erase") S.tool = 0;
  const view = { level: "world", ct: null, cc: null, a1: null };
  // 선택은 단계와 무관하게 전역: key = 단계:id
  const sel = new Map((saved.sel || []).map((x) => [x.lv + ":" + x.id, x]));
  let pins = [];
  let activePin = null;
  let pinClipboard = null;
  let lastColor = typeof S.tool === "number" ? S.tool : 0;
  let model = null;
  let projection = null;
  let zt = d3.zoomIdentity;
  let busy = false;

  const $ = (id) => document.getElementById(id);
  const svg = $("map"), stage = $("stage"), listEl = $("list");
  const isPhone = () => matchMedia("(max-width: 760px)").matches;

  function load() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; } }
  function save() {
    try {
      const s = {}; SAVE_KEYS.forEach((k) => (s[k] = S[k]));
      localStorage.setItem(STORE_KEY, JSON.stringify({ s, sel: [...sel.values()] }));
    } catch { /* 저장 불가 환경 */ }
  }

  // ---------- 데이터 ----------
  const data = { world: null, adm1: new Map(), adm2: new Map(), adm1Index: new Set(), adm2Index: new Set(), countries: [], byId: new Map() };

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
    const full = topojson.feature(topo, topo.objects[name]).features;
    return { topo, pre, name, weights: w, cache: null, full, byId: new Map(full.map((f) => [f.properties.id, f])) };
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
    entry.cache = { d: detail, f: feats, byId: new Map(feats.map((f) => [f.properties.id, f])) };
    return feats;
  }
  const featAt = (entry, id) => { featuresAt(entry, S.detail); return entry.cache.byId.get(id); };

  async function loadJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(url + " " + r.status);
    return r.json();
  }
  async function cached(map, key, url) {
    if (map.has(key)) return map.get(key);
    const t = setTimeout(() => showLoading(true), 150);
    try { const e = prepTopo(await loadJSON(url)); map.set(key, e); return e; }
    finally { clearTimeout(t); showLoading(false); }
  }
  const ensureAdm1 = (cc) => cached(data.adm1, cc, `data/adm1/${cc}.json`);
  const ensureAdm2 = (cc, a1) => cached(data.adm2, a1, `data/adm2/${cc}/${a1}.json`);
  const hasCities = (a1) => data.adm2Index.has(a1);

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
      if (maxx - minx < 0.3 && maxy - miny < 0.3) continue;
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
    if (!best || ba < 2) return null;
    const p = gp.centroid(best);
    return isFinite(p[0]) ? { x: p[0], y: p[1], area: ba } : null;
  }

  // ---------- 선택 ----------
  const skey = (lv, id) => lv + ":" + id;
  const unitLv = () => (view.level === "world" || view.level === "continent" ? "c" : view.level === "country" ? "a1" : "a2");
  function selColor(lv, id) { const s = sel.get(skey(lv, id)); return s ? S.palette[s.ci] : null; }
  // 자기 색 → 상위(도·주, 국가) 색 순으로 상속
  function fillFor(lv, id, cc, a1) {
    return selColor(lv, id) || (lv === "a2" && a1 && selColor("a1", a1)) || (lv !== "c" && cc && selColor("c", cc)) || null;
  }
  function toggleSel(info) {
    const k = skey(info.lv, info.id);
    const cur = sel.get(k);
    if (S.tool === "erase") { if (!cur) return; sel.delete(k); }
    else {
      const ci = typeof S.tool === "number" ? S.tool : lastColor;
      if (cur && cur.ci === ci) sel.delete(k);
      else sel.set(k, { ...info, ci });
    }
    save();
    afterSelChange();
  }
  function afterSelChange() { render(); renderList(); renderChips(); }

  // ---------- 뷰 ----------
  const hashKey = () => (view.level === "world" ? "" : view.level === "continent" ? "c-" + view.ct : view.level === "country" ? "k-" + view.cc : "r-" + view.a1);
  const countryName = (cc) => (data.byId.get(cc) ? data.byId.get(cc).properties.ko : cc);

  function units() {
    if (view.level === "world") {
      return CONT_ORDER.filter((c) => c !== "AN" || S.antarctica).map((c) => ({ id: c, ko: CONT[c].ko, en: CONT[c].en, drill: true, noSel: true }));
    }
    if (view.level === "continent") {
      return data.countries.filter((f) => f.properties.ct === view.ct)
        .map((f) => ({ id: f.properties.id, ko: f.properties.ko, en: f.properties.en, drill: data.adm1Index.has(f.properties.id), lv: "c", cc: f.properties.id }))
        .sort((a, b) => a.ko.localeCompare(b.ko, "ko"));
    }
    if (view.level === "country") {
      return data.adm1.get(view.cc).full.map((f) => ({ id: f.properties.id, ko: f.properties.ko, en: f.properties.en, sub: f.properties.t, drill: hasCities(f.properties.id), lv: "a1", cc: view.cc }))
        .sort((a, b) => a.ko.localeCompare(b.ko, "ko"));
    }
    return data.adm2.get(view.a1).full.map((f) => ({ id: f.properties.id, ko: f.properties.ko, en: f.properties.en, drill: false, lv: "a2", cc: view.cc, a1: view.a1 }))
      .sort((a, b) => a.ko.localeCompare(b.ko, "ko"));
  }
  function selInfo(u) {
    const a1n = u.a1 && data.adm1.get(u.cc) ? data.adm1.get(u.cc).byId.get(u.a1)?.properties.ko : null;
    return { lv: u.lv, id: u.id, cc: u.cc, a1: u.a1 || null, ct: data.byId.get(u.cc)?.properties.ct, name: u.ko, parent: [a1n, u.lv !== "c" ? countryName(u.cc) : null].filter(Boolean).join(" · ") };
  }

  // ---------- 렌더 ----------
  function render() {
    if (!data.world) return;
    const W = Math.max(200, stage.clientWidth), H = Math.max(160, stage.clientHeight);
    const pad = Math.round(Math.min(W, H) * 0.05);
    const ext = [[pad, pad], [W - pad, H - pad]];
    const round = S.shape === "round";
    const ctxDetail = Math.max(S.detail, 70);
    let unitFeats = [], ctxFeats = [];

    if (view.level === "world") {
      const feats = featuresAt(data.world, S.detail).filter((f) => S.antarctica || f.properties.ct !== "AN");
      projection = d3.geoMercator().rotate([-10, 0]).precision(0.3).fitExtent(ext, extentObj(WORLD_EXT));
      unitFeats = feats.map((f) => ({ f, lv: "c", id: f.properties.id, cc: f.properties.id, name: f.properties.ko, group: f.properties.ct }));
    } else if (view.level === "continent") {
      const worldF = featuresAt(data.world, S.detail);
      if (view.ct === "AN") {
        projection = d3.geoAzimuthalEqualArea().rotate([0, 90]).precision(0.3).fitExtent(ext, data.countries.find((f) => f.properties.ct === "AN"));
      } else {
        const fit = extentObj(CONT[view.ct].ext);
        projection = d3.geoMercator().rotate([-centerLon(fit), 0]).precision(0.3).fitExtent(ext, fit);
      }
      for (const f of worldF) {
        if (f.properties.ct === view.ct) unitFeats.push({ f, lv: "c", id: f.properties.id, cc: f.properties.id, name: f.properties.ko });
        else ctxFeats.push({ f, lv: "c", id: f.properties.id, cc: f.properties.id });
      }
    } else if (view.level === "country") {
      const cf = data.byId.get(view.cc);
      const fit = S.overseas ? cf.geometry : mainland(cf.geometry);
      projection = d3.geoMercator().rotate([-centerLon(fit), 0]).precision(0.3).fitExtent(ext, fit);
      unitFeats = featuresAt(data.adm1.get(view.cc), S.detail).map((f) => ({ f, lv: "a1", id: f.properties.id, cc: view.cc, name: f.properties.ko }));
      ctxFeats = featuresAt(data.world, ctxDetail).filter((f) => f.properties.id !== view.cc).map((f) => ({ f, lv: "c", id: f.properties.id, cc: f.properties.id }));
    } else {
      const a1f = data.adm1.get(view.cc).byId.get(view.a1);
      const fit = S.overseas ? a1f.geometry : mainland(a1f.geometry);
      projection = d3.geoMercator().rotate([-centerLon(fit), 0]).precision(0.3).fitExtent(ext, fit);
      unitFeats = featuresAt(data.adm2.get(view.a1), S.detail).map((f) => ({ f, lv: "a2", id: f.properties.id, cc: view.cc, a1: view.a1, name: f.properties.ko }));
      ctxFeats = featuresAt(data.adm1.get(view.cc), ctxDetail).filter((f) => f.properties.id !== view.a1).map((f) => ({ f, lv: "a1", id: f.properties.id, cc: view.cc }))
        .concat(featuresAt(data.world, ctxDetail).filter((f) => f.properties.id !== view.cc).map((f) => ({ f, lv: "c", id: f.properties.id, cc: f.properties.id })));
    }
    projection.clipExtent([[-2, -2], [W + 2, H + 2]]);
    geoPath = d3.geoPath(projection, rec);

    const m = { W, H, round, units: [], ctx: [], ovl: [], under: null };
    // 시 경계와 도·주 경계는 출처가 달라 틈이 생기므로 도·주 모양을 밑에 깔아 메운다
    if (view.level === "region") {
      const a1g = featuresAt(data.adm1.get(view.cc), ctxDetail).find((f) => f.properties.id === view.a1);
      if (a1g) m.under = { d: pathD(a1g.geometry, round), color: fillFor("a1", view.a1, view.cc) };
    }
    const shown = new Set();
    for (const u of unitFeats) {
      const d = pathD(u.f.geometry, round);
      if (!d) continue;
      shown.add(skey(u.lv, u.id));
      m.units.push({ ...u, d, geom: u.f.geometry, color: fillFor(u.lv, u.id, u.cc, u.a1) });
    }
    for (const c of ctxFeats) {
      const color = selColor(c.lv, c.id);
      if (!S.context && !color) continue;
      const d = pathD(c.f.geometry, round);
      if (!d) continue;
      shown.add(skey(c.lv, c.id));
      m.ctx.push({ ...c, d, name: c.f.properties.ko, color });
    }
    // 다른 단계에서 고른 곳(더 깊은 단계)을 위에 덮어 그림
    const ovl = [...sel.values()].filter((s) => !shown.has(skey(s.lv, s.id))).sort((a, b) => DEPTH[a.lv] - DEPTH[b.lv]);
    for (const s of ovl) {
      const g = selGeom(s);
      if (!g) continue;
      const d = pathD(g.geometry, round);
      if (d) m.ovl.push({ ...s, d, geom: g.geometry, color: S.palette[s.ci] });
    }
    model = m;
    computeMarkers();
    computeLabels();
    paint();
  }
  function selGeom(s) {
    if (s.lv === "c") return featAt(data.world, s.id);
    if (s.lv === "a1") return data.adm1.has(s.cc) ? featAt(data.adm1.get(s.cc), s.id) : null;
    return data.adm2.has(s.a1) ? featAt(data.adm2.get(s.a1), s.id) : null;
  }

  // 너무 작아 보이지 않는 선택 지역은 점으로 표시
  function computeMarkers() {
    const m = model;
    m.markers = [];
    const add = (geom, color, key) => { const p = labelPoint(geom); if (p) m.markers.push({ x: p.x, y: p.y, color, area: p.area, key }); else { const c = d3.geoPath(projection).centroid(geom); if (isFinite(c[0])) m.markers.push({ x: c[0], y: c[1], color, area: 0, key }); } };
    for (const u of m.units) if (u.color && selColor(u.lv, u.id)) add(u.geom, u.color, skey(u.lv, u.id));
    for (const c of m.ctx) if (c.color) add(c.f.geometry, c.color, skey(c.lv, c.id));
    for (const o of m.ovl) add(o.geom, o.color, skey(o.lv, o.id));
  }
  const tiny = (mk, k) => mk.area * k * k < 40;
  const dotted = (key, k) => model.markers.some((mk) => mk.key === key && tiny(mk, k));
  const markerSVG = (mk, x, y) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="4.5" fill="${mk.color}" stroke="#ffffff" stroke-width="1.5"/>`;

  function computeLabels() {
    const m = model;
    m.labels = [];
    if (S.labels === "none") return;
    const fs = Math.round(Math.max(10, Math.min(15, Math.min(m.W, m.H) * 0.02)));
    const push = (geom, text, color, key) => { const p = labelPoint(geom); if (p) m.labels.push({ x: p.x, y: p.y, text, color, fs, area: p.area, key }); };
    if (S.labels === "all") {
      if (view.level === "world") {
        const t = data.world.topo;
        for (const c of CONT_ORDER) {
          if (c === "AN" && !S.antarctica) continue;
          push(topojson.merge(t, t.objects[data.world.name].geometries.filter((g) => g.properties.ct === c)), CONT[c].ko, null, "ct:" + c);
        }
      } else {
        const seen = new Set();
        for (const u of m.units) { if (!seen.has(u.id)) { seen.add(u.id); push(u.geom, u.name, u.color, skey(u.lv, u.id)); } }
      }
    } else {
      const seen = new Set();
      for (const u of m.units) if (u.color && selColor(u.lv, u.id) && !seen.has(u.id)) { seen.add(u.id); push(u.geom, u.name, u.color, skey(u.lv, u.id)); }
      for (const c of m.ctx) if (c.color) push(c.f.geometry, c.name, c.color, skey(c.lv, c.id));
      for (const o of m.ovl) push(o.geom, o.name, o.color, skey(o.lv, o.id));
    }
  }

  function lum(hex) {
    const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }
  const textOn = (hex) => (lum(hex) > 0.6 ? "#1b2430" : "#ffffff");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const joinAttr = () => `stroke-linejoin="${model.round ? "round" : "miter"}"`;
  const unitAttrs = (u) => `fill="${u.color || S.fill}" stroke="${S.stroke}" stroke-width="${S.strokeW}" ${joinAttr()}`;
  const ctxAttrs = (c) => (c.color ? `fill="${c.color}"` : `fill="${S.fill}" fill-opacity="0.28"`) + ` stroke="${S.stroke}" stroke-width="${S.strokeW}" ${joinAttr()}`;
  const ovlAttrs = (o) => `fill="${o.color}" stroke="${S.stroke}" stroke-width="${S.strokeW}" ${joinAttr()}`;

  function labelSVG(l, x, y) {
    const fill = textOn(l.color || S.fill), halo = fill === "#ffffff" ? "#1b2430" : "#ffffff";
    return `<text x="${f1(x)}" y="${f1(y)}" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-size="${l.fs}" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="${fill}" stroke="${halo}" stroke-width="2.6" stroke-opacity="0.55" paint-order="stroke">${esc(l.text)}</text>`;
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
    if (m.ctx.length) h += `<g id="ctx">` + m.ctx.map((c, i) => `<path class="ctx" data-i="${i}" d="${c.d}" ${ctxAttrs(c)}><title>${esc(c.name)}</title></path>`).join("") + `</g>`;
    if (m.under) h += `<path class="ovl" d="${m.under.d}" fill="${m.under.color || S.fill}" stroke="none"/>`;
    h += `<g id="units">` + m.units.map((u, i) => `<path class="unit" data-i="${i}" data-g="${esc(view.level === "world" ? u.group : u.id)}" d="${u.d}" ${unitAttrs(u)}><title>${esc(u.name)}</title></path>`).join("") + `</g>`;
    if (m.ovl.length) h += `<g id="ovl">` + m.ovl.map((o) => `<path class="ovl" d="${o.d}" ${ovlAttrs(o)}/>`).join("") + `</g>`;
    h += `</g><g id="labels" pointer-events="none"></g><g id="pins"></g>`;
    svg.innerHTML = h;
    applyZoom();
  }

  // 확대 상태 반영: 지도는 변환, 이름표·핀은 화면 크기 유지
  function applyZoom() {
    const vp = svg.querySelector("#vp");
    if (!vp) return;
    vp.setAttribute("transform", zt.toString());
    svg.querySelector("#labels").innerHTML = model.markers.filter((mk) => tiny(mk, zt.k)).map((mk) => markerSVG(mk, zt.applyX(mk.x), zt.applyY(mk.y))).join("") + model.labels
      .filter((l) => S.labels !== "all" || l.area * zt.k * zt.k > l.text.length * l.fs * l.fs * 0.9)
      .map((l) => labelSVG(l, zt.applyX(l.x), zt.applyY(l.y) - (dotted(l.key, zt.k) ? l.fs : 0))).join("");
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

  // ---------- 확대/이동 ----------
  const zoom = d3.zoom()
    .scaleExtent([1, 60])
    .clickDistance(6)
    .filter((e) => !e.target.closest(".pin") && (!e.button || e.type === "wheel"))
    .on("zoom", (e) => { zt = e.transform; applyZoom(); });
  function resetZoom(animate) {
    const s = d3.select(svg);
    (animate ? s.transition().duration(250) : s).call(zoom.transform, d3.zoomIdentity);
  }
  function zoomBy(k) { d3.select(svg).transition().duration(200).call(zoom.scaleBy, k); }
  function bboxOf(els) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const el of els) { const b = el.getBBox(); x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height); }
    return isFinite(x0) ? [x0, y0, x1, y1] : null;
  }
  function transformFor(b, fill = 0.9, maxK = 60) {
    const w = Math.max(b[2] - b[0], 1), h = Math.max(b[3] - b[1], 1);
    const k = Math.max(1, Math.min(maxK, fill * Math.min(model.W / w, model.H / h)));
    return d3.zoomIdentity.translate(model.W / 2, model.H / 2).scale(k).translate(-(b[0] + w / 2), -(b[1] + h / 2));
  }
  // 누른 곳으로 확대한 뒤 한 단계 아래 지도로 교체
  function zoomInto(els, then) {
    const b = bboxOf(els);
    if (!b || busy) { then(); return; }
    busy = true;
    d3.select(svg).transition().duration(420).ease(d3.easeCubicInOut).call(zoom.transform, transformFor(b))
      .on("end interrupt", async () => { try { await then(); } finally { busy = false; } });
  }
  function zoomToSmall(id) {
    const els = [...svg.querySelectorAll(`#units .unit[data-g="${CSS.escape(id)}"]`)];
    const b = bboxOf(els);
    if (!b || (b[2] - b[0]) * zt.k > 30 || (b[3] - b[1]) * zt.k > 30) return;
    d3.select(svg).transition().duration(350).call(zoom.transform, transformFor(b, 0.3, 30));
  }

  // ---------- 탐색 ----------
  async function navigate(v, { push = true } = {}) {
    try {
      if (v.level === "country" || v.level === "region") {
        if (!data.adm1Index.has(v.cc)) { toast(`${countryName(v.cc)}: 도·주 구분 데이터가 없습니다.`); return; }
        await ensureAdm1(v.cc);
      }
      if (v.level === "region") await ensureAdm2(v.cc, v.a1);
    } catch { toast("지도 데이터를 불러오지 못했습니다. 연결을 확인해 주세요."); return; }
    view.level = v.level;
    view.cc = v.level === "country" || v.level === "region" ? v.cc : null;
    view.a1 = v.level === "region" ? v.a1 : null;
    view.ct = v.level === "world" ? null : v.ct || (view.cc && data.byId.get(view.cc).properties.ct);
    $("search").value = "";
    if (push) { const k = hashKey(); history.replaceState(null, "", k ? "#" + k : location.pathname + location.search); }
    zt = d3.zoomIdentity;
    d3.select(svg).interrupt().call(zoom.transform, d3.zoomIdentity);
    renderCrumbs(); renderList(); render();
  }
  function goUp() {
    if (view.level === "region") return navigate({ level: "country", cc: view.cc });
    if (view.level === "country") return navigate({ level: "continent", ct: view.ct });
    if (view.level === "continent") return navigate({ level: "world" });
  }
  function goCountry(cc) {
    if (data.adm1Index.has(cc)) return navigate({ level: "country", cc });
    const f = data.byId.get(cc);
    if (f) navigate({ level: "continent", ct: f.properties.ct });
  }
  // 단위를 눌렀을 때: 들어갈 수 있으면 확대하며 들어가고, 마지막 단계면 선택
  function onUnit(u, forceSelect, els) {
    if (view.level === "world") {
      const ct = u.group;
      return zoomInto(svg.querySelectorAll(`#units .unit[data-g="${ct}"]`), () => navigate({ level: "continent", ct }));
    }
    const drillable = view.level === "continent" ? data.adm1Index.has(u.id) : view.level === "country" ? hasCities(u.id) : false;
    if (drillable && !forceSelect) {
      if (view.level === "continent") return zoomInto(els, () => navigate({ level: "country", cc: u.id }));
      return zoomInto(els, () => navigate({ level: "region", cc: view.cc, a1: u.id }));
    }
    toggleSel(selInfo({ ...u, ko: u.name }));
  }
  function onCtx(c) {
    if (c.lv === "a1") { if (hasCities(c.id)) return navigate({ level: "region", cc: c.cc, a1: c.id }); return navigate({ level: "country", cc: c.cc }); }
    goCountry(c.id);
  }

  // ---------- 목록 / 경로 / 선택 칩 ----------
  const chevron = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;

  function renderCrumbs() {
    const parts = [{ label: "전세계", v: { level: "world" } }];
    if (view.ct) parts.push({ label: CONT[view.ct].ko, v: { level: "continent", ct: view.ct } });
    if (view.cc) parts.push({ label: countryName(view.cc), v: { level: "country", cc: view.cc } });
    if (view.a1) parts.push({ label: data.adm1.get(view.cc).byId.get(view.a1).properties.ko, v: null });
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
    $("listTitle").textContent = view.level === "world" ? "대륙" : `${LEVEL_NAME[view.level]} · ${n}개`;
    $("selAll").hidden = view.level === "world";
    $("zoomUp").disabled = view.level === "world";
  }

  function renderList() {
    const q = $("search").value.trim().toLowerCase();
    const us = units().filter((u) => !q || u.ko.toLowerCase().includes(q) || (u.en || "").toLowerCase().includes(q));
    let h = us.map(itemHTML).join("");
    if (q) {
      const here = new Set(us.map((u) => u.id));
      const extra = data.countries.filter((f) => !here.has(f.properties.id) && (f.properties.ko.toLowerCase().includes(q) || f.properties.en.toLowerCase().includes(q))).slice(0, 30);
      if (extra.length) {
        h += `<li class="group">다른 국가로 이동</li>` + extra.map((f) =>
          `<li class="item nobox" data-jump="${f.properties.id}"><span class="nm">${esc(f.properties.ko)}<small>${esc(CONT[f.properties.ct].ko)}</small></span><button class="go" data-jump="${f.properties.id}" aria-label="${esc(f.properties.ko)}로 이동">${chevron}</button></li>`).join("");
      }
    }
    if (!h) h = `<li class="empty">‘${esc(q)}’와 일치하는 지역이 없습니다.</li>`;
    listEl.innerHTML = h;
  }
  function itemHTML(u) {
    const sub = u.sub || (u.en && u.en !== u.ko ? u.en : "");
    const go = `<button class="go" data-drill="${esc(u.id)}" ${u.drill ? "" : "disabled"} aria-label="${esc(u.ko)} 들어가기" title="들어가기">${chevron}</button>`;
    if (u.noSel) return `<li class="item nobox" data-drill="${esc(u.id)}"><span class="nm">${esc(u.ko)}<small>${esc(sub)}</small></span>${go}</li>`;
    const own = selColor(u.lv, u.id), inh = !own && fillFor(u.lv, u.id, u.cc, u.a1);
    const c = own || inh;
    return `<li class="item${own ? " painted" : ""}" data-id="${esc(u.id)}"><span class="box${inh ? " inh" : ""}"${c ? ` style="background:${c}"` : ""}></span><span class="nm">${esc(u.ko)}${sub ? `<small>${esc(sub)}</small>` : ""}</span>${go}</li>`;
  }

  function renderChips() {
    const items = [...sel.values()];
    $("picked").hidden = !items.length;
    $("pickedTitle").textContent = `선택한 곳 · ${items.length}`;
    $("chips").innerHTML = items.map((s) =>
      `<span class="chip"><span class="dot" style="background:${S.palette[s.ci]}"></span><button class="go2" data-k="${esc(skey(s.lv, s.id))}" title="이 지역 보기">${esc(s.name)}${s.parent ? `<small>${esc(s.parent)}</small>` : ""}</button><button class="rm" data-rm="${esc(skey(s.lv, s.id))}" aria-label="${esc(s.name)} 선택 해제">×</button></span>`).join("");
  }
  // 칩을 누르면 그 지역이 보이는 단계로 이동
  function showSel(s) {
    if (s.lv === "c") { const f = data.byId.get(s.id); return navigate({ level: "continent", ct: f.properties.ct }); }
    if (s.lv === "a1") return navigate({ level: "country", cc: s.cc });
    return navigate({ level: "region", cc: s.cc, a1: s.a1 });
  }

  // ---------- 도구 ----------
  function renderTools() {
    $("paletteTools").innerHTML = S.palette.map((c, i) =>
      `<button class="tool" data-tool="${i}" title="${i + 1}번 색 (${i + 1})" aria-label="${i + 1}번 색으로 선택"><span class="dot" style="background:${c}"></span></button>`).join("");
    document.querySelectorAll("#tools .tool").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tool === String(S.tool))));
    svg.classList.toggle("pinning", S.tool === "pin");
    $("paletteEdit").innerHTML = S.palette.map((c, i) => `<input type="color" data-pi="${i}" value="${c}" aria-label="${i + 1}번 색">`).join("");
  }
  let toolBeforePin = 0;
  function setTool(t) {
    if (t === "pin" && S.tool !== "pin") toolBeforePin = S.tool;
    S.tool = t;
    if (typeof t === "number") lastColor = t;
    if (t !== "pin") save();
    renderTools();
    const msg = { erase: "지우개: 마지막 단계에서 누른 곳의 선택을 지웁니다", pin: "지도를 누르면 핀이 꽂힙니다" }[t];
    hint(msg || `${t + 1}번 색으로 선택합니다`);
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
    const m = model;
    const units = onlySel ? m.units.filter((u) => u.color) : m.units;
    const ctx = onlySel ? m.ctx.filter((c) => c.color) : m.ctx;
    const ovl = m.ovl;
    if (!units.length && !ovl.length && !(onlySel && ctx.length)) return null;
    const useFull = !onlySel && S.context && m.ctx.length > 0;
    let vb = [0, 0, m.W, m.H];
    if (!useFull) {
      const els = [];
      svg.querySelectorAll("#units .unit").forEach((el) => { if (units.includes(m.units[+el.dataset.i])) els.push(el); });
      if (onlySel) { svg.querySelectorAll("#ctx .ctx").forEach((el) => { if (ctx.includes(m.ctx[+el.dataset.i])) els.push(el); }); svg.querySelectorAll("#ovl .ovl").forEach((el) => els.push(el)); }
      const b = bboxOf(els);
      if (b) {
        const pd = 8 + S.strokeW;
        const x0 = Math.max(-2, b[0] - pd), y0 = Math.max(-2, b[1] - pd), x1 = Math.min(m.W + 2, b[2] + pd), y1 = Math.min(m.H + 2, b[3] + pd);
        vb = [Math.floor(x0), Math.floor(y0), Math.ceil(x1 - x0), Math.ceil(y1 - y0)];
      }
    }
    const inView = (x, y) => x >= vb[0] && y >= vb[1] && x <= vb[0] + vb[2] && y <= vb[1] + vb[3];
    let o = `<svg xmlns="http://www.w3.org/2000/svg" width="${vb[2]}" height="${vb[3]}" viewBox="${vb.join(" ")}">\n`;
    if (S.exportBg) o += `<rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="${S.bg}"/>\n`;
    const ctxOut = onlySel ? ctx : (S.context ? m.ctx : m.ctx.filter((c) => c.color));
    if (ctxOut.length) o += `<g id="주변">` + ctxOut.map((c) => `<path id="${idOf(c.name)}" d="${c.d}" ${ctxAttrs(c)}/>`).join("") + `</g>\n`;
    if (view.level === "world") {
      for (const c of CONT_ORDER) {
        const us = units.filter((u) => u.group === c);
        if (us.length) o += `<g id="${CONT[c].ko}">` + us.map((u) => `<path id="${idOf(u.name)}" d="${u.d}" ${unitAttrs(u)}/>`).join("") + `</g>\n`;
      }
    } else if (units.length) {
      if (m.under && !onlySel) o += `<path id="바탕" d="${m.under.d}" fill="${m.under.color || S.fill}"/>\n`;
      o += `<g id="지역">` + units.map((u) => `<path id="${idOf(u.name)}" d="${u.d}" ${unitAttrs(u)}/>`).join("") + `</g>\n`;
    }
    if (ovl.length) o += `<g id="선택">` + ovl.map((x) => `<path id="${idOf(x.name)}" d="${x.d}" ${ovlAttrs(x)}/>`).join("") + `</g>\n`;
    const mks = m.markers.filter((mk) => tiny(mk, 1) && inView(mk.x, mk.y));
    if (mks.length) o += `<g id="위치점">` + mks.map((mk) => markerSVG(mk, mk.x, mk.y)).join("") + `</g>\n`;
    const labels = m.labels.filter((l) => inView(l.x, l.y) && (S.labels !== "all" || l.area > l.text.length * l.fs * l.fs * 0.9));
    if (labels.length) o += `<g id="이름">` + labels.map((l) => labelSVG(l, l.x, l.y - (dotted(l.key, 1) ? l.fs : 0))).join("") + `</g>\n`;
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
    if (view.a1) parts.push(data.adm1.get(view.cc).byId.get(view.a1).properties.en);
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
    if (!r) { toast(onlySel ? "먼저 지역을 선택해 주세요." : "내보낼 지역이 없습니다."); return; }
    download(new Blob([r.svg], { type: "image/svg+xml" }), fileBase(onlySel) + ".svg");
    toast("SVG 저장됨 · PPT에서 도형으로 변환 후 그룹 해제");
  }
  function exportPNG(onlySel) {
    closePanels(); usedIds.clear();
    const r = buildSVG(onlySel);
    if (!r) { toast(onlySel ? "먼저 지역을 선택해 주세요." : "내보낼 지역이 없습니다."); return; }
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
      afterSelChange();
    };

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
    $("zoomUp").onclick = goUp;

    $("pinColors").innerHTML = PIN_COLORS.map((c) => `<button data-c="${c}" style="background:${c}" aria-label="핀 색 ${c}"></button>`).join("");
    $("pinColors").onclick = (e) => { const c = e.target.dataset.c; if (c && activePin) { activePin.color = c; setActivePin(activePin); } };
    $("pinSize").oninput = (e) => { if (activePin) { activePin.size = +e.target.value; paintPins(); } };
    $("pinBorder").onchange = (e) => { if (activePin) { activePin.border = e.target.checked; paintPins(); } };
    $("pinDel").onclick = () => { if (activePin) { pins = pins.filter((p) => p !== activePin); setActivePin(null); } };
    $("pinDup").onclick = () => { if (activePin) dupPin(activePin); };
    $("pinClose").onclick = () => setActivePin(null);

    // 목록: 행 = 이 단계에서 선택, › = 들어가기
    listEl.onclick = (e) => {
      const jump = e.target.closest("[data-jump]");
      if (jump) return goCountry(jump.dataset.jump);
      const go = e.target.closest("[data-drill]");
      if (go) {
        const id = go.dataset.drill;
        if (view.level === "world") return navigate({ level: "continent", ct: id });
        if (view.level === "continent") return navigate({ level: "country", cc: id });
        if (view.level === "country") return navigate({ level: "region", cc: view.cc, a1: id });
        return;
      }
      const it = e.target.closest("[data-id]");
      if (!it) return;
      const u = units().find((x) => x.id === it.dataset.id);
      if (!u) return;
      const tool = S.tool;
      if (tool === "pin") S.tool = lastColor;
      toggleSel(selInfo(u));
      S.tool = tool;
      zoomToSmall(u.id);
    };
    listEl.onmouseover = (e) => { const it = e.target.closest("[data-id]"); hoverUnit(it ? it.dataset.id : null); };
    listEl.onmouseleave = () => hoverUnit(null);
    $("search").oninput = renderList;
    $("selAll").onclick = () => {
      for (const u of units()) if (!u.noSel) sel.set(skey(u.lv, u.id), { ...selInfo(u), ci: lastColor });
      save(); afterSelChange();
    };
    $("pickedClear").onclick = () => { sel.clear(); save(); afterSelChange(); };
    $("chips").onclick = (e) => {
      const rm = e.target.closest("[data-rm]");
      if (rm) { sel.delete(rm.dataset.rm); save(); afterSelChange(); return; }
      const g = e.target.closest("[data-k]");
      if (g && sel.has(g.dataset.k)) showSel(sel.get(g.dataset.k));
    };

    $("sheetBar").onclick = (e) => { if (!isPhone() || e.target.closest(".crumbs button")) return; openSheet(!$("side").classList.contains("open")); };

    // 지도
    d3.select(svg).call(zoom).on("dblclick.zoom", null);
    let drag = null, press = null, suppressClick = false;
    const pt = (e) => { const r = svg.getBoundingClientRect(); return zt.invert([(e.clientX - r.left) * (model.W / r.width), (e.clientY - r.top) * (model.H / r.height)]); };
    svg.addEventListener("pointerdown", (e) => {
      const pg = e.target.closest(".pin");
      if (pg) {
        const p = pins.find((x) => x.id === +pg.dataset.pin);
        setActivePin(p);
        drag = { p };
        svg.setPointerCapture(e.pointerId);
        e.preventDefault(); e.stopPropagation();
        return;
      }
      // 길게 누르면 들어가지 않고 이 단계에서 바로 선택
      const u = e.target.closest(".unit");
      if (u && view.level !== "world" && S.tool !== "pin") {
        press = { x: e.clientX, y: e.clientY, t: setTimeout(() => {
          press = null; suppressClick = true;
          const m = model.units[+u.dataset.i];
          toggleSel(selInfo({ ...m, ko: m.name }));
          if (navigator.vibrate) navigator.vibrate(15);
        }, 550) };
      }
    });
    svg.addEventListener("pointermove", (e) => {
      if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 8) { clearTimeout(press.t); press = null; }
      if (drag) {
        const ll = projection.invert(pt(e));
        if (ll) { drag.p.lon = ll[0]; drag.p.lat = ll[1]; paintPins(); }
        return;
      }
      if (e.pointerType === "mouse" && !e.buttons) {
        const u = e.target.closest(".unit");
        hoverUnit(u ? u.dataset.g : null, true);
      }
    });
    const endPress = () => { if (press) { clearTimeout(press.t); press = null; } drag = null; };
    svg.addEventListener("pointerup", endPress);
    svg.addEventListener("pointercancel", endPress);
    svg.addEventListener("contextmenu", (e) => e.preventDefault());
    svg.addEventListener("click", (e) => {
      if (suppressClick) { suppressClick = false; return; }
      if (e.target.closest(".pin") || busy) return;
      closePanels();
      if (isPhone() && $("side").classList.contains("open")) openSheet(false);
      if (S.tool === "pin") {
        const ll = projection.invert(pt(e));
        if (ll) addPin(ll[0], ll[1], activePin);
        setTool(toolBeforePin === "pin" ? 0 : toolBeforePin);
        return;
      }
      setActivePin(null);
      const u = e.target.closest(".unit");
      if (u) return onUnit(model.units[+u.dataset.i], e.shiftKey || e.altKey, [u]);
      const c = e.target.closest(".ctx");
      if (c) return onCtx(model.ctx[+c.dataset.i]);
    });

    document.addEventListener("keydown", (e) => {
      if (e.target.matches("input, textarea")) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "c" && activePin) { pinClipboard = { ...activePin }; toast("핀 복사됨"); e.preventDefault(); }
      else if (mod && e.key.toLowerCase() === "v" && pinClipboard) { dupPin(pinClipboard); pinClipboard = { ...activePin }; e.preventDefault(); }
      else if ((e.key === "Delete" || e.key === "Backspace") && activePin) { pins = pins.filter((p) => p !== activePin); setActivePin(null); e.preventDefault(); }
      else if (e.key === "Escape") { if (S.tool === "pin") setTool(toolBeforePin); setActivePin(null); closePanels(); }
      else if (!mod && /^[1-5]$/.test(e.key)) setTool(+e.key - 1);
      else if (!mod && e.key.toLowerCase() === "e") setTool("erase");
      else if (!mod && e.key.toLowerCase() === "p") setTool("pin");
      else if (!mod && (e.key === "u" || e.key === "U")) goUp();
    });

    new ResizeObserver(schedule).observe(stage);
    window.addEventListener("hashchange", routeFromHash);
  }

  function hoverUnit(id, fromMap) {
    svg.querySelectorAll(".unit.hover").forEach((el) => el.classList.remove("hover"));
    listEl.querySelectorAll(".item.hover").forEach((el) => el.classList.remove("hover"));
    if (!id) return;
    svg.querySelectorAll(`.unit[data-g="${CSS.escape(id)}"]`).forEach((el) => el.classList.add("hover"));
    const li = listEl.querySelector(`.item[data-id="${CSS.escape(id)}"], .item[data-drill="${CSS.escape(id)}"]`);
    if (li) { li.classList.add("hover"); if (fromMap) li.scrollIntoView({ block: "nearest" }); }
  }

  async function routeFromHash() {
    const h = location.hash.slice(1);
    if (h.startsWith("c-") && CONT[h.slice(2)]) return navigate({ level: "continent", ct: h.slice(2) }, { push: false });
    if (h.startsWith("k-") && data.byId.has(h.slice(2))) return goCountry(h.slice(2));
    if (h.startsWith("r-")) {
      const a1 = h.slice(2), cc = a1.split("-")[0];
      if (data.byId.has(cc) && hasCities(a1)) return navigate({ level: "region", cc, a1 }, { push: false });
    }
    return navigate({ level: "world" }, { push: false });
  }

  // ---------- 시작 ----------
  async function init() {
    syncControls(); renderTools(); bind();
    showLoading(true);
    try {
      const [world, idx, idx2] = await Promise.all([loadJSON("data/world.json"), loadJSON("data/adm1-index.json"), loadJSON("data/adm2-index.json")]);
      data.world = prepTopo(world);
      data.countries = data.world.full;
      data.countries.forEach((f) => data.byId.set(f.properties.id, f));
      data.adm1Index = new Set(idx);
      data.adm2Index = new Set(Object.values(idx2).flat());
    } catch (err) {
      $("loading").textContent = "지도 데이터를 불러오지 못했습니다. 새로고침해 주세요.";
      console.error(err);
      return;
    }
    // 저장된 선택에 필요한 경계 미리 받기
    try {
      await Promise.all([...sel.values()].map(async (s) => {
        if (s.lv !== "c") await ensureAdm1(s.cc);
        if (s.lv === "a2") await ensureAdm2(s.cc, s.a1);
      }));
    } catch { /* 일부 실패해도 계속 */ }
    showLoading(false);
    renderChips();
    await routeFromHash();
    if (!S.seenIntro) {
      hint(isPhone() ? "누르면 확대되며 한 단계씩 들어가요 · 마지막 단계에서 누르면 선택 · 길게 누르면 그 단계에서 선택" : "클릭하면 확대되며 한 단계씩 들어가요 · 마지막 단계에서 클릭하면 선택 · Shift+클릭은 그 단계에서 선택", 7000);
      S.seenIntro = true; save();
    }
  }
  init();
})();
