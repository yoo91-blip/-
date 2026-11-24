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

  // ---------- 언어 ----------
  const T = {
    ko: {
      appName: "지도추출기", brandSub: "대륙 › 국가 › 도·주 › 시", crumbsAria: "현재 위치", tabList: "목록", tabStyle: "스타일",
      searchPh: "국가·지역 검색 (한/영)", clearAll: "모두 해제", paintAll: "이 단계 모두 칠하기", language: "언어",
      shape: "끝단 모양", round: "둥글", angle: "각", detail: "디테일", precise: "정밀", normal: "보통", simple: "단순",
      paintColors: "칠하기 색", mapColors: "지도 색", preset: "프리셋", dark: "다크", light: "라이트", mono: "모노",
      baseFill: "기본 지역", stroke: "경계선", bg: "배경", strokeW: "선 두께", display: "표시", names: "이름",
      auto: "자동", painted: "칠한 곳", none: "없음", optContext: "주변 국가 표시", optOverseas: "해외 영토·원거리 섬 포함",
      optAntarctica: "세계지도에 남극 표시", optBg: "다운로드에 배경색 포함",
      foot: "지도 데이터: Natural Earth (Public Domain) · geoBoundaries (CC BY 4.0) · 한국 시군구: 통계청 SGIS(공공누리 제1유형), vuski/admdongkor (CC BY 4.0)",
      tools: "도구", erase: "지우개", pin: "핀 꽂기", dlSel: "칠한 곳만", dlSelTitle: "칠한 지역만 SVG로", dlAll: "SVG 다운로드", more: "다른 형식",
      map: "지도", pickAria: "선택 단위", pickLabel: "선택", pickAuto: "자동", pickC: "국가", pickA1: "도·주", pickA2: "시",
      zoomGrp: "확대 축소", up: "상위 단계로", zin: "확대", zout: "축소", fit: "전체 보기", loading: "지도 불러오는 중…",
      export: "내보내기", close: "닫기", svgSel: "SVG · 칠한 곳만", png: "PNG 이미지 (고해상도)", pngSel: "PNG · 칠한 곳만", copy: "SVG 코드 복사",
      exportNote: "지금 화면에 보이는 범위를 저장합니다. 다른 단계에서 고른 곳도 함께 들어갑니다.",
      pptNote: "PPT: 삽입 › 그림 › SVG 파일 선택 → 우클릭 <b>도형으로 변환</b> → <b>그룹 해제</b>하면 지역별로 쪼개집니다. (Microsoft 365 / PowerPoint 2019 이상)",
      size: "크기", border: "테두리", dup: "복제", del: "삭제", pickColor: "색 선택", custom: "직접 선택",
      world: "전세계", lvWorld: "대륙", lvContinent: "국가", lvCountry: "도·주", lvRegion: "시·군·구", count: "{n}개",
      jumpOther: "다른 국가로 이동", noMatch: "‘{q}’와 일치하는 지역이 없습니다.", enter: "{n} 들어가기", enterT: "들어가기",
      showRegion: "이 지역 보기", unpick: "{n} 선택 해제", picked: "선택한 곳 · {n}", colorN: "{n}번 색", colorPick: "{n}번 색으로 선택",
      hintErase: "지우개: 마지막 단계에서 누른 곳의 선택을 지웁니다", hintPin: "지도를 누르면 핀이 꽂힙니다", hintColor: "{n}번 색으로 선택합니다",
      hintPick: { auto: "자동: 누르면 한 단계씩 들어가고, 마지막 단계에서 선택", c: "국가 단위: 누르면 그 나라를 선택", a1: "도·주 단위: 국가까지 들어간 뒤 도·주를 선택", a2: "시 단위: 도·주까지 들어간 뒤 시를 선택" },
      noAdm1: "{n}: 도·주 구분 데이터가 없습니다.", loadFail: "지도 데이터를 불러오지 못했습니다. 연결을 확인해 주세요.",
      noSel: "먼저 지역을 선택해 주세요.", noExport: "내보낼 지역이 없습니다.", svgSaved: "SVG 저장됨 · PPT에서 도형으로 변환 후 그룹 해제",
      pngSaved: "PNG 저장됨", pngFail: "PNG 변환에 실패했습니다. SVG로 받아 주세요.", copied: "SVG 코드를 복사했습니다.",
      copyBlocked: "복사가 막혀 있습니다. SVG 다운로드를 사용해 주세요.", pinCopied: "핀 복사됨", loadFail2: "지도 데이터를 불러오지 못했습니다. 새로고침해 주세요.",
      introPhone: "누르면 확대되며 한 단계씩 들어가요 · 마지막 단계에서 누르면 선택 · 길게 누르면 그 단계에서 선택",
      introPC: "클릭하면 확대되며 한 단계씩 들어가요 · 마지막 단계에서 클릭하면 선택 · Shift+클릭은 그 단계에서 선택",
      sheetOpen: "목록 열기", sheetClose: "목록 닫기", pinColor: "핀 색 {n}",
      gNear: "주변", gRegions: "지역", gPicked: "선택", gDots: "위치점", gNames: "이름", gPins: "핀", gBase: "바탕",
    },
    en: {
      appName: "Map Extractor", brandSub: "Continent › Country › State › City", crumbsAria: "Current location", tabList: "List", tabStyle: "Style",
      searchPh: "Search countries & regions", clearAll: "Clear all", paintAll: "Paint all at this level", language: "Language",
      shape: "Corners", round: "Round", angle: "Sharp", detail: "Detail", precise: "Fine", normal: "Normal", simple: "Simple",
      paintColors: "Paint colors", mapColors: "Map colors", preset: "Preset", dark: "Dark", light: "Light", mono: "Mono",
      baseFill: "Land", stroke: "Borders", bg: "Background", strokeW: "Line width", display: "Display", names: "Names",
      auto: "Auto", painted: "Painted", none: "None", optContext: "Show neighboring areas", optOverseas: "Include overseas territories",
      optAntarctica: "Show Antarctica on world map", optBg: "Include background in downloads",
      foot: "Map data: Natural Earth (public domain) · geoBoundaries (CC BY 4.0) · Korea: Statistics Korea SGIS (KOGL Type 1), vuski/admdongkor (CC BY 4.0)",
      tools: "Tools", erase: "Eraser", pin: "Add pin", dlSel: "Painted only", dlSelTitle: "Download painted areas as SVG", dlAll: "Download SVG", more: "More formats",
      map: "Map", pickAria: "Selection level", pickLabel: "Select", pickAuto: "Auto", pickC: "Country", pickA1: "State", pickA2: "City",
      zoomGrp: "Zoom", up: "Up one level", zin: "Zoom in", zout: "Zoom out", fit: "Fit to view", loading: "Loading map…",
      export: "Export", close: "Close", svgSel: "SVG · painted only", png: "PNG image (high resolution)", pngSel: "PNG · painted only", copy: "Copy SVG code",
      exportNote: "Saves what is visible on screen, including areas picked at other levels.",
      pptNote: "PowerPoint: Insert › Pictures › choose the SVG → right-click <b>Convert to Shape</b> → <b>Ungroup</b> to split it into regions. (Microsoft 365 / PowerPoint 2019+)",
      size: "Size", border: "Outline", dup: "Duplicate", del: "Delete", pickColor: "Choose a color", custom: "Custom",
      world: "World", lvWorld: "Continents", lvContinent: "Countries", lvCountry: "States", lvRegion: "Cities", count: "{n}",
      jumpOther: "Go to another country", noMatch: "No area matches “{q}”.", enter: "Open {n}", enterT: "Open",
      showRegion: "Show this area", unpick: "Remove {n}", picked: "Selected · {n}", colorN: "Color {n}", colorPick: "Select with color {n}",
      hintErase: "Eraser: tap an area at the last level to clear it", hintPin: "Tap the map to drop a pin", hintColor: "Selecting with color {n}",
      hintPick: { auto: "Auto: tap to zoom in one level; tap at the last level to select", c: "Country: tap to select a country", a1: "State: open a country, then tap states", a2: "City: open a state, then tap cities" },
      noAdm1: "{n}: no state-level data.", loadFail: "Couldn't load map data. Check your connection.",
      noSel: "Select an area first.", noExport: "Nothing to export.", svgSaved: "SVG saved · in PowerPoint, Convert to Shape, then Ungroup",
      pngSaved: "PNG saved", pngFail: "PNG export failed. Download the SVG instead.", copied: "SVG code copied.",
      copyBlocked: "Copying is blocked here. Use Download SVG.", pinCopied: "Pin copied", loadFail2: "Couldn't load map data. Please reload.",
      introPhone: "Tap to zoom in one level at a time · tap at the last level to select · long-press to select at the current level",
      introPC: "Click to zoom in one level at a time · click at the last level to select · Shift+click selects at the current level",
      sheetOpen: "Open list", sheetClose: "Close list", pinColor: "Pin color {n}",
      gNear: "Neighbors", gRegions: "Regions", gPicked: "Selected", gDots: "Markers", gNames: "Names", gPins: "Pins", gBase: "Base",
    },
  };
  const t = (k, vars) => { let v = (T[S.lang] || T.ko)[k] ?? T.ko[k] ?? k; if (vars && typeof v === "string") for (const x in vars) v = v.replace("{" + x + "}", vars[x]); return v; };
  const nm = (p) => (S.lang === "en" ? p.en || p.ko : p.ko || p.en);
  const alt = (p) => (S.lang === "en" ? p.ko : p.en);

  // 파스텔 30색(15개 색상 × 연한/중간) + 무채색 6
  function hsl2hex(h, s, l) {
    s /= 100; l /= 100;
    const f = (n) => { const k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, "0"); };
    return "#" + f(0) + f(8) + f(4);
  }
  const HUES = [0, 16, 30, 42, 52, 70, 100, 140, 165, 182, 198, 212, 232, 262, 300];
  const PASTELS = HUES.map((h) => hsl2hex(h, 75, 86)).concat(HUES.map((h) => hsl2hex(h, 55, 70)));
  const NEUTRALS = ["#ffffff", "#f2f4f6", "#d5dbe1", "#8a96a3", "#3a4654", "#10161d"];
  const WORLD_EXT = [-169, -57, 190, 80];
  const PRESETS = {
    dark: { bg: "#10161d", fill: "#f2f4f6", stroke: "#10161d", strokeW: 0.8 },
    light: { bg: "#ffffff", fill: "#d5dbe1", stroke: "#ffffff", strokeW: 1 },
    mono: { bg: "#ffffff", fill: "#ffffff", stroke: "#1f2937", strokeW: 0.8 },
  };
  const DEFAULT_PALETTE = [hsl2hex(182, 55, 62), hsl2hex(212, 60, 66), hsl2hex(30, 80, 66), hsl2hex(0, 65, 70), hsl2hex(262, 50, 72)];
  const PIN_COLORS = ["#e5484d", "#f5a524", "#f7d038", "#2bb5ad", "#3b82f6", "#8b5cf6", "#8a96a3", "#ffffff", "#111827"];
  const PIN_PATH = "M0,0C-2.2,-5.6 -9,-10.4 -9,-17.5A9,9 0 1 1 9,-17.5C9,-10.4 2.2,-5.6 0,0Z";
  const STORE_KEY = "mapx-world-v3";
  const SAVE_KEYS = ["lang", "pick", "shape", "detail", "labels", "labelsV2", "context", "overseas", "antarctica", "exportBg", "bg", "fill", "stroke", "strokeW", "preset", "palette", "tool", "seenIntro"];
  const LEVEL_NAME = { world: "lvWorld", continent: "lvContinent", country: "lvCountry", region: "lvRegion" };
  const DEPTH = { c: 1, a1: 2, a2: 3 };

  // ---------- 상태 ----------
  const defaults = {
    lang: (navigator.language || "ko").toLowerCase().startsWith("ko") ? "ko" : "en", pick: "auto",
    shape: "angle", detail: 60, labels: "auto", labelsV2: true, context: true, overseas: false, antarctica: false, exportBg: false,
    ...PRESETS.dark, preset: "dark", palette: DEFAULT_PALETTE.slice(), tool: 0, seenIntro: false,
  };
  const saved = load();
  const S = Object.assign({}, defaults, saved.s || {});
  if (!Array.isArray(S.palette) || S.palette.length !== 5) S.palette = DEFAULT_PALETTE.slice();
  if (typeof S.tool !== "number" && S.tool !== "erase") S.tool = 0;
  if (!S.labelsV2 || S.labels === "all") { S.labels = "auto"; S.labelsV2 = true; }
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
  let baked = d3.zoomIdentity; // 경로를 마지막으로 계산한 시점의 확대 상태
  // 마지막 계산 이후 추가로 확대/이동한 만큼의 변환
  const rel = () => { const r = zt.k / baked.k; return d3.zoomIdentity.translate(zt.x - r * baked.x, zt.y - r * baked.y).scale(r); };
  const toAbs = (R) => d3.zoomIdentity.translate(R.k * baked.x + R.x, R.k * baked.y + R.y).scale(R.k * baked.k);
  // 확대할수록 경계를 더 정밀하게 (8배 확대 시 최고 정밀도)
  const effDetail = () => (S.detail >= 100 ? 100 : Math.round(Math.min(100, S.detail + (100 - S.detail) * Math.min(1, Math.log2(Math.max(1, zt.k)) / 3))));
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

  // 원본 데이터의 어색한 한국어 국가명 보정
  const EN_FIX = { USA: "United States", TUR: "Türkiye", CZE: "Czechia" };
  const NAME_FIX = { CHN: "중국", PRK: "북한", TUR: "튀르키예", TWN: "대만", AUS: "호주", NCL: "뉴칼레도니아", VAT: "바티칸" };
  function prepTopo(topo) {
    const name = Object.keys(topo.objects)[0];
    for (const g of topo.objects[name].geometries) {
      const p = g.properties || (g.properties = {});
      if (name === "countries" && NAME_FIX[p.id]) p.ko = NAME_FIX[p.id];
      if (name === "countries" && EN_FIX[p.id]) p.en = EN_FIX[p.id];
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
    if (!entry.cache) entry.cache = new Map();
    const hit = entry.cache.get(detail);
    if (hit) return hit.f;
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
    if (entry.cache.size > 4) entry.cache.delete(entry.cache.keys().next().value);
    entry.cache.set(detail, { f: feats, byId: new Map(feats.map((f) => [f.properties.id, f])) });
    return feats;
  }
  const featAt = (entry, id, det = S.detail) => { featuresAt(entry, det); return entry.cache.get(det).byId.get(id); };

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
  const countryName = (cc) => (data.byId.get(cc) ? nm(data.byId.get(cc).properties) : cc);
  const a1Name = (cc, a1) => { const f = data.adm1.get(cc)?.byId.get(a1); return f ? nm(f.properties) : ""; };
  const contName = (c) => nm(CONT[c]);
  const sortNm = (a, b) => a.ko.localeCompare(b.ko, S.lang);

  function units() {
    if (view.level === "world") {
      return CONT_ORDER.filter((c) => c !== "AN" || S.antarctica).map((c) => ({ id: c, ko: contName(c), en: alt(CONT[c]), drill: true, noSel: true }));
    }
    if (view.level === "continent") {
      return data.countries.filter((f) => f.properties.ct === view.ct)
        .map((f) => ({ id: f.properties.id, ko: nm(f.properties), en: alt(f.properties), drill: data.adm1Index.has(f.properties.id), lv: "c", cc: f.properties.id }))
        .sort(sortNm);
    }
    if (view.level === "country") {
      return data.adm1.get(view.cc).full.map((f) => ({ id: f.properties.id, ko: nm(f.properties), en: alt(f.properties), sub: f.properties.t, drill: hasCities(f.properties.id), lv: "a1", cc: view.cc }))
        .sort(sortNm);
    }
    return data.adm2.get(view.a1).full.map((f) => ({ id: f.properties.id, ko: nm(f.properties), en: alt(f.properties), drill: false, lv: "a2", cc: view.cc, a1: view.a1 }))
      .sort(sortNm);
  }
  function selInfo(u) {
    return { lv: u.lv, id: u.id, cc: u.cc, a1: u.a1 || null, ct: data.byId.get(u.cc)?.properties.ct, name: u.ko };
  }

  // ---------- 렌더 ----------
  function render() {
    if (!data.world) return;
    const W = Math.max(200, stage.clientWidth), H = Math.max(160, stage.clientHeight);
    const pad = Math.round(Math.min(W, H) * 0.05);
    const ext = [[pad, pad], [W - pad, H - pad]];
    const round = S.shape === "round";
    const det = effDetail();
    const ctxDetail = Math.max(det, 70);
    let unitFeats = [], ctxFeats = [];

    if (view.level === "world") {
      const feats = featuresAt(data.world, det).filter((f) => S.antarctica || f.properties.ct !== "AN");
      projection = d3.geoMercator().rotate([-10, 0]).precision(0.3).fitExtent(ext, extentObj(WORLD_EXT));
      unitFeats = feats.map((f) => ({ f, lv: "c", id: f.properties.id, cc: f.properties.id, name: nm(f.properties), group: f.properties.ct }));
    } else if (view.level === "continent") {
      const worldF = featuresAt(data.world, det);
      if (view.ct === "AN") {
        projection = d3.geoAzimuthalEqualArea().rotate([0, 90]).precision(0.3).fitExtent(ext, data.countries.find((f) => f.properties.ct === "AN"));
      } else {
        const fit = extentObj(CONT[view.ct].ext);
        projection = d3.geoMercator().rotate([-centerLon(fit), 0]).precision(0.3).fitExtent(ext, fit);
      }
      for (const f of worldF) {
        if (f.properties.ct === view.ct) unitFeats.push({ f, lv: "c", id: f.properties.id, cc: f.properties.id, name: nm(f.properties) });
        else ctxFeats.push({ f, lv: "c", id: f.properties.id, cc: f.properties.id });
      }
    } else if (view.level === "country") {
      const cf = data.byId.get(view.cc);
      const fit = S.overseas ? cf.geometry : mainland(cf.geometry);
      projection = d3.geoMercator().rotate([-centerLon(fit), 0]).precision(0.3).fitExtent(ext, fit);
      unitFeats = featuresAt(data.adm1.get(view.cc), det).map((f) => ({ f, lv: "a1", id: f.properties.id, cc: view.cc, name: nm(f.properties) }));
      ctxFeats = featuresAt(data.world, ctxDetail).filter((f) => f.properties.id !== view.cc).map((f) => ({ f, lv: "c", id: f.properties.id, cc: f.properties.id }));
    } else {
      const a1f = data.adm1.get(view.cc).byId.get(view.a1);
      const fit = S.overseas ? a1f.geometry : mainland(a1f.geometry);
      projection = d3.geoMercator().rotate([-centerLon(fit), 0]).precision(0.3).fitExtent(ext, fit);
      unitFeats = featuresAt(data.adm2.get(view.a1), det).map((f) => ({ f, lv: "a2", id: f.properties.id, cc: view.cc, a1: view.a1, name: nm(f.properties) }));
      const nb = new Set(view.nb);
      ctxFeats = view.nb.flatMap((a) => featuresAt(data.adm2.get(a), ctxDetail).map((f) => ({ f, lv: "a2", id: f.properties.id, cc: view.cc, a1: a })))
        .concat(featuresAt(data.adm1.get(view.cc), ctxDetail).filter((f) => f.properties.id !== view.a1 && !nb.has(f.properties.id)).map((f) => ({ f, lv: "a1", id: f.properties.id, cc: view.cc })))
        .concat(featuresAt(data.world, ctxDetail).filter((f) => f.properties.id !== view.cc).map((f) => ({ f, lv: "c", id: f.properties.id, cc: f.properties.id })))
        .reverse();
    }
    // 현재 확대 상태를 투영에 반영해, 보이는 범위만 확대 배율에 맞는 해상도로 그린다
    const [tx, ty] = projection.translate();
    projection.scale(projection.scale() * zt.k).translate([tx * zt.k + zt.x, ty * zt.k + zt.y]);
    baked = zt;
    projection.clipExtent([[-2, -2], [W + 2, H + 2]]);
    geoPath = d3.geoPath(projection, rec);

    const m = { W, H, round, units: [], ctx: [], ovl: [], under: null };
    // 시 경계와 도·주 경계는 출처가 달라 틈이 생기므로 도·주 모양을 밑에 깔아 메운다
    if (view.level === "region" && !view.nb.length) {
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
      m.ctx.push({ ...c, d, name: nm(c.f.properties), color });
    }
    // 다른 단계에서 고른 곳(더 깊은 단계)을 위에 덮어 그림
    const ovl = [...sel.values()].filter((s) => !shown.has(skey(s.lv, s.id))).sort((a, b) => DEPTH[a.lv] - DEPTH[b.lv]);
    for (const s of ovl) {
      const g = selGeom(s, det);
      if (!g) continue;
      const d = pathD(g.geometry, round);
      if (d) m.ovl.push({ ...s, name: nm(g.properties), d, geom: g.geometry, color: S.palette[s.ci] });
    }
    model = m;
    computeMarkers();
    computeLabels();
    paint();
  }
  function selGeom(s, det) {
    if (s.lv === "c") return featAt(data.world, s.id, det);
    if (s.lv === "a1") return data.adm1.has(s.cc) ? featAt(data.adm1.get(s.cc), s.id, det) : null;
    return data.adm2.has(s.a1) ? featAt(data.adm2.get(s.a1), s.id, det) : null;
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

  // 지도 위 이름은 짧게: 쉼표 뒤 행정 구분 제거 (예: "Dortmund, Kreisfreie Stadt" → "Dortmund")
  const shortName = (n) => String(n).split(",")[0].replace(/^(Landkreis|Kreis|District of|Okres|Powiat|powiat|Bezirk|Municipality of|Município de)\s+/i, "").replace(/\s+(District|County|Municipality|Prefecture)$/i, "").trim() || n;
  // 글자 폭 추정(한글·한자는 1em, 라틴 0.6em)
  const textW = (t, fs) => [...t].reduce((w, ch) => w + (ch.charCodeAt(0) > 0x2e80 ? fs : fs * 0.66), 0);
  function bestPoly(geom) {
    let best = null, ba = -1;
    const gp = d3.geoPath(projection);
    for (const c of polysOf(geom)) { const g = { type: "Polygon", coordinates: c }; const a = gp.area(g); if (a > ba) { ba = a; best = g; } }
    if (!best) return null;
    const [[x0, y0], [x1, y1]] = gp.bounds(best), c = gp.centroid(best);
    return isFinite(c[0]) ? { x: c[0], y: c[1], area: ba, w: x1 - x0, h: y1 - y0 } : null;
  }
  // 이름표: '자동'은 글자가 들어갈 만큼 커지면 표시(확대하면 더 많이 보임), 겹치면 생략
  function computeLabels() {
    const m = model;
    m.labels = [];
    if (S.labels === "none") return;
    const out = [], placed = [];
    const tryPlace = (geom, name, opt) => {
      const b = bestPoly(geom);
      if (!b) return;
      const text = shortName(name);
      // 큰 글자부터 시도해 들어가는 크기를 고른다
      let fs = 0, tw = 0;
      for (const f of opt.force ? [opt.fs] : [opt.fs, opt.fs - 1, opt.fs - 2]) {
        const w = textW(text, f);
        if (b.w >= w * 0.8 && b.h >= f * 1.2 && b.area >= w * f * 1.2) { fs = f; tw = w; break; }
      }
      if (!fs) { if (!opt.force) return; fs = opt.fs; tw = textW(text, fs); }
      const r = [b.x - tw / 2 - 2, b.y - fs / 2 - 1, b.x + tw / 2 + 2, b.y + fs / 2 + 1];
      if (r[2] < 0 || r[0] > m.W || r[3] < 0 || r[1] > m.H) return;
      if (placed.some((q) => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1])) return;
      placed.push(r);
      out.push({ x: b.x, y: b.y, text, color: opt.color || null, muted: !!opt.muted, fs, area: b.area, key: opt.key });
    };
    const seen = new Set();
    // 1) 선택한 곳은 항상 이름 표시
    for (const u of m.units) if (selColor(u.lv, u.id) && !seen.has(u.id)) { seen.add(u.id); tryPlace(u.geom, u.name, { fs: 13, color: u.color, key: skey(u.lv, u.id), force: true }); }
    for (const c of m.ctx) if (c.color) tryPlace(c.f.geometry, c.name, { fs: 12, color: c.color, key: skey(c.lv, c.id), force: true });
    for (const o of m.ovl) tryPlace(o.geom, o.name, { fs: 12, color: o.color, key: skey(o.lv, o.id), force: true });
    if (S.labels === "auto") {
      // 2) 현재 단계 지역(큰 곳부터), 3) 주변 지역은 흐리게
      const us = m.units.filter((u) => !seen.has(u.id) && (seen.add(u.id), true)).map((u) => ({ u, a: d3.geoPath(projection).area(u.geom) })).sort((x, y) => y.a - x.a);
      for (const { u } of us) tryPlace(u.geom, u.name, { fs: 12, color: u.color, key: skey(u.lv, u.id) });
      const cs = m.ctx.filter((c) => !c.color).map((c) => ({ c, a: d3.geoPath(projection).area(c.f.geometry) })).sort((x, y) => y.a - x.a);
      for (const { c } of cs) tryPlace(c.f.geometry, c.name, { fs: 11, muted: true, key: skey(c.lv, c.id) });
    }
    m.labels = out;
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
    const fill = l.muted ? textOn(S.bg) : textOn(l.color || S.fill), halo = fill === "#ffffff" ? "#1b2430" : "#ffffff";
    return `<text x="${f1(x)}" y="${f1(y)}" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-size="${l.fs}" font-weight="${l.muted ? 500 : 700}" text-anchor="middle" dominant-baseline="central" fill="${fill}"${l.muted ? ' fill-opacity="0.7"' : ""} stroke="${halo}" stroke-width="2.4" stroke-opacity="${l.muted ? 0.3 : 0.5}" paint-order="stroke">${esc(l.text)}</text>`;
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
    if (m.under) h += `<path class="ovl" d="${m.under.d}" fill="${m.under.color || S.fill}"${m.under.color ? "" : ' fill-opacity="0.28"'} stroke="none"/>`;
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
    const R = rel();
    vp.setAttribute("transform", R.toString());
    svg.querySelector("#labels").innerHTML = model.markers.filter((mk) => tiny(mk, R.k)).map((mk) => markerSVG(mk, R.applyX(mk.x), R.applyY(mk.y))).join("") + model.labels
      .map((l) => labelSVG(l, R.applyX(l.x), R.applyY(l.y) - (dotted(l.key, R.k) ? l.fs : 0))).join("");
    paintPins();
  }

  function paintPins() {
    const g = svg.querySelector("#pins");
    if (!g || !projection) return;
    g.innerHTML = pins.map((p) => {
      const xy = projection([p.lon, p.lat]);
      if (!xy) return "";
      const ring = p === activePin ? `<circle class="pin-ring" cx="0" cy="-12" r="15"/>` : "";
      const R = rel();
      return pinSVG(p, [R.applyX(xy[0]), R.applyY(xy[1])], `class="pin" data-pin="${p.id}"`).replace(/<\/g>$/, ring + "</g>");
    }).join("");
  }

  // ---------- 확대/이동 ----------
  const zoom = d3.zoom()
    .scaleExtent([1, 60])
    .clickDistance(6)
    .filter((e) => !e.target.closest(".pin") && (!e.button || e.type === "wheel"))
    .on("zoom", (e) => { zt = e.transform; applyZoom(); })
    .on("end", () => {
      clearTimeout(rebakeT);
      if (busy || (zt.k === baked.k && zt.x === baked.x && zt.y === baked.y)) return;
      rebakeT = setTimeout(() => { if (!busy) render(); }, 90);
    });
  let rebakeT = 0;
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
    const k = Math.max(1 / baked.k, Math.min(maxK / baked.k, fill * Math.min(model.W / w, model.H / h)));
    return d3.zoomIdentity.translate(model.W / 2, model.H / 2).scale(k).translate(-(b[0] + w / 2), -(b[1] + h / 2));
  }
  // 누른 곳으로 확대한 뒤 한 단계 아래 지도로 교체
  function zoomInto(els, then) {
    const b = bboxOf(els);
    if (!b || busy) { then(); return; }
    busy = true;
    d3.select(svg).transition().duration(420).ease(d3.easeCubicInOut).call(zoom.transform, toAbs(transformFor(b)))
      .on("end interrupt", async () => { try { await then(); } finally { busy = false; } });
  }
  function zoomToSmall(id) {
    const els = [...svg.querySelectorAll(`#units .unit[data-g="${CSS.escape(id)}"]`)];
    const b = bboxOf(els);
    const R = rel();
    if (!b || (b[2] - b[0]) * R.k > 30 || (b[3] - b[1]) * R.k > 30) return;
    d3.select(svg).transition().duration(350).call(zoom.transform, toAbs(transformFor(b, 0.3, 30)));
  }

  // ---------- 탐색 ----------
  async function navigate(v, { push = true } = {}) {
    try {
      if (v.level === "country" || v.level === "region") {
        if (!data.adm1Index.has(v.cc)) { toast(t("noAdm1", { n: countryName(v.cc) })); return; }
        await ensureAdm1(v.cc);
      }
      if (v.level === "region") {
        await ensureAdm2(v.cc, v.a1);
        // 이웃 도·주의 시 경계도 같은 출처로 받아 주변을 그린다 (경계 어긋남 방지)
        const a1e = data.adm1.get(v.cc), me = a1e.byId.get(v.a1);
        const [[w, s0], [e, n]] = d3.geoBounds(me.geometry), dx = (e - w) * 0.6 + 0.3, dy = (n - s0) * 0.6 + 0.3;
        v.nb = a1e.full.filter((f) => f.properties.id !== v.a1 && hasCities(f.properties.id)).filter((f) => {
          const [[w2, s2], [e2, n2]] = d3.geoBounds(f.geometry);
          return !(e2 < w - dx || w2 > e + dx || n2 < s0 - dy || s2 > n + dy);
        }).map((f) => f.properties.id).slice(0, 12);
        await Promise.all(v.nb.map((a) => ensureAdm2(v.cc, a).catch(() => null)));
      }
    } catch { toast(t("loadFail")); return; }
    view.level = v.level;
    view.cc = v.level === "country" || v.level === "region" ? v.cc : null;
    view.a1 = v.level === "region" ? v.a1 : null;
    view.nb = v.level === "region" ? (v.nb || []).filter((a) => data.adm2.has(a)) : [];
    view.ct = v.level === "world" ? null : v.ct || (view.cc && data.byId.get(view.cc).properties.ct);
    $("search").value = "";
    if (push) { const k = hashKey(); history.replaceState(null, "", k ? "#" + k : location.pathname + location.search); }
    zt = d3.zoomIdentity; baked = d3.zoomIdentity;
    clearTimeout(rebakeT);
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
  const PICK_DEPTH = { c: 1, a1: 2, a2: 3 };
  function onUnit(u, forceSelect, els) {
    const pick = S.pick;
    if (pick !== "auto" && !forceSelect) {
      const ud = DEPTH[u.lv], pd = PICK_DEPTH[pick];
      // 고정한 단위보다 깊은 곳을 누르면 그 상위(국가·도·주)를 선택
      if (ud > pd) {
        if (pick === "c") return toggleSel(selInfo({ lv: "c", id: u.cc, cc: u.cc, ko: countryName(u.cc) }));
        if (pick === "a1") return toggleSel(selInfo({ lv: "a1", id: u.a1, cc: u.cc, ko: a1Name(u.cc, u.a1) }));
      }
      if (ud === pd) return toggleSel(selInfo({ ...u, ko: u.name }));
    }
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
    if (c.lv === "a2") return navigate({ level: "region", cc: c.cc, a1: c.a1 });
    if (c.lv === "a1") { if (hasCities(c.id)) return navigate({ level: "region", cc: c.cc, a1: c.id }); return navigate({ level: "country", cc: c.cc }); }
    goCountry(c.id);
  }

  // ---------- 목록 / 경로 / 선택 칩 ----------
  const chevron = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;

  function renderCrumbs() {
    const parts = [{ label: t("world"), v: { level: "world" } }];
    if (view.ct) parts.push({ label: contName(view.ct), v: { level: "continent", ct: view.ct } });
    if (view.cc) parts.push({ label: countryName(view.cc), v: { level: "country", cc: view.cc } });
    if (view.a1) parts.push({ label: a1Name(view.cc, view.a1), v: null });
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
    $("listTitle").textContent = view.level === "world" ? t("lvWorld") : `${t(LEVEL_NAME[view.level])} · ${t("count", { n })}`;
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
        h += `<li class="group">${t("jumpOther")}</li>` + extra.map((f) =>
          `<li class="item nobox" data-jump="${f.properties.id}"><span class="nm">${esc(nm(f.properties))}<small>${esc(contName(f.properties.ct))}</small></span><button class="go" data-jump="${f.properties.id}" aria-label="${esc(t("enter", { n: nm(f.properties) }))}">${chevron}</button></li>`).join("");
      }
    }
    if (!h) h = `<li class="empty">${esc(t("noMatch", { q }))}</li>`;
    listEl.innerHTML = h;
  }
  function itemHTML(u) {
    const sub = u.sub || (u.en && u.en !== u.ko ? u.en : "");
    const go = `<button class="go" data-drill="${esc(u.id)}" ${u.drill ? "" : "disabled"} aria-label="${esc(t("enter", { n: u.ko }))}" title="${t("enterT")}">${chevron}</button>`;
    if (u.noSel) return `<li class="item nobox" data-drill="${esc(u.id)}"><span class="nm">${esc(u.ko)}<small>${esc(sub)}</small></span>${go}</li>`;
    const own = selColor(u.lv, u.id), inh = !own && fillFor(u.lv, u.id, u.cc, u.a1);
    const c = own || inh;
    return `<li class="item${own ? " painted" : ""}" data-id="${esc(u.id)}"><span class="box${inh ? " inh" : ""}"${c ? ` style="background:${c}"` : ""}></span><span class="nm">${esc(u.ko)}${sub ? `<small>${esc(sub)}</small>` : ""}</span>${go}</li>`;
  }

  function renderChips() {
    const items = [...sel.values()];
    $("picked").hidden = !items.length;
    $("pickedTitle").textContent = t("picked", { n: items.length });
    $("chips").innerHTML = items.map((s) => {
      const g = selGeom(s, S.detail), name = g ? nm(g.properties) : s.name;
      const parent = [s.lv === "a2" ? a1Name(s.cc, s.a1) : "", s.lv !== "c" ? countryName(s.cc) : ""].filter(Boolean).join(" · ");
      const k = esc(skey(s.lv, s.id));
      return `<span class="chip"><span class="dot" style="background:${S.palette[s.ci]}"></span><button class="go2" data-k="${k}" title="${t("showRegion")}">${esc(name)}${parent ? `<small>${esc(parent)}</small>` : ""}</button><button class="rm" data-rm="${k}" aria-label="${esc(t("unpick", { n: name }))}">×</button></span>`;
    }).join("");
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
      `<button class="tool" data-tool="${i}" title="${t("colorN", { n: i + 1 })} (${i + 1})" aria-label="${t("colorPick", { n: i + 1 })}"><span class="dot" style="background:${c}"></span></button>`).join("");
    document.querySelectorAll("#tools .tool").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tool === String(S.tool))));
    svg.classList.toggle("pinning", S.tool === "pin");
    $("paletteEdit").innerHTML = S.palette.map((c, i) => `<button class="cbtn" data-cv="pal${i}" aria-label="${t("colorN", { n: i + 1 })}"><span style="background:${c}"></span></button>`).join("");
  }
  let toolBeforePin = 0;
  function setTool(tool) {
    if (tool === "pin" && S.tool !== "pin") toolBeforePin = S.tool;
    S.tool = tool;
    if (typeof tool === "number") lastColor = tool;
    if (tool !== "pin") save();
    renderTools();
    const msg = { erase: T[S.lang].hintErase, pin: T[S.lang].hintPin }[tool];
    hint(msg || t("hintColor", { n: tool + 1 }));
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
    const ll = projection.invert([xy[0] + 18 / rel().k, xy[1] + 10 / rel().k]);
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
    if (ctxOut.length) o += `<g id="${t("gNear")}">` + ctxOut.map((c) => `<path id="${idOf(c.name)}" d="${c.d}" ${ctxAttrs(c)}/>`).join("") + `</g>\n`;
    if (view.level === "world") {
      for (const c of CONT_ORDER) {
        const us = units.filter((u) => u.group === c);
        if (us.length) o += `<g id="${contName(c)}">` + us.map((u) => `<path id="${idOf(u.name)}" d="${u.d}" ${unitAttrs(u)}/>`).join("") + `</g>\n`;
      }
    } else if (units.length) {
      if (m.under && !onlySel && m.under.color) o += `<path id="${t("gBase")}" d="${m.under.d}" fill="${m.under.color}"/>\n`;
      o += `<g id="${t("gRegions")}">` + units.map((u) => `<path id="${idOf(u.name)}" d="${u.d}" ${unitAttrs(u)}/>`).join("") + `</g>\n`;
    }
    if (ovl.length) o += `<g id="${t("gPicked")}">` + ovl.map((x) => `<path id="${idOf(x.name)}" d="${x.d}" ${ovlAttrs(x)}/>`).join("") + `</g>\n`;
    const mks = m.markers.filter((mk) => tiny(mk, 1) && inView(mk.x, mk.y));
    if (mks.length) o += `<g id="${t("gDots")}">` + mks.map((mk) => markerSVG(mk, mk.x, mk.y)).join("") + `</g>\n`;
    const labels = m.labels.filter((l) => inView(l.x, l.y));
    if (labels.length) o += `<g id="${t("gNames")}">` + labels.map((l) => labelSVG(l, l.x, l.y - (dotted(l.key, 1) ? l.fs : 0))).join("") + `</g>\n`;
    const ps = pins.map((p) => [p, projection([p.lon, p.lat])]).filter(([, xy]) => xy && inView(xy[0], xy[1]));
    if (ps.length) o += `<g id="${t("gPins")}">` + ps.map(([p, xy]) => pinSVG(p, xy)).join("") + `</g>\n`;
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
    if (!r) { toast(onlySel ? t("noSel") : t("noExport")); return; }
    download(new Blob([r.svg], { type: "image/svg+xml" }), fileBase(onlySel) + ".svg");
    toast(t("svgSaved"));
  }
  function exportPNG(onlySel) {
    closePanels(); usedIds.clear();
    const r = buildSVG(onlySel);
    if (!r) { toast(onlySel ? t("noSel") : t("noExport")); return; }
    const scale = Math.min(4, 6000 / Math.max(r.w, r.h));
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = Math.round(r.w * scale); c.height = Math.round(r.h * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => { download(b, fileBase(onlySel) + ".png"); toast(t("pngSaved")); }, "image/png");
    };
    img.onerror = () => toast(t("pngFail"));
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(r.svg);
  }
  async function copySVG() {
    closePanels(); usedIds.clear();
    const r = buildSVG(false);
    if (!r) return;
    try { await navigator.clipboard.writeText(r.svg); toast(t("copied")); }
    catch { toast(t("copyBlocked")); }
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

  function applyI18n() {
    document.documentElement.lang = S.lang;
    document.title = S.lang === "en" ? "Map Extractor World" : "지도추출기 World";
    document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => { el.title = t(el.dataset.i18nTitle); });
    document.querySelectorAll("[data-lang]").forEach((b) => b.classList.toggle("on", b.dataset.lang === S.lang));
  }
  function setLang(lang) {
    if (lang === S.lang) return;
    S.lang = lang; save(); applyI18n(); renderTools();
    $("pinColors").innerHTML = PIN_COLORS.map((c) => `<button data-c="${c}" style="background:${c}" aria-label="${t("pinColor", { n: c })}"></button>`).join("");
    if (data.world) { renderCrumbs(); renderList(); renderChips(); render(); }
  }

  // 색 고르기 팝업: 파스텔 30색 + 무채색 6색 + 직접 선택
  let colorTarget = null;
  const getCV = (k) => (k.startsWith("pal") ? S.palette[+k.slice(3)] : S[k]);
  function setCV(k, c) {
    if (k.startsWith("pal")) { S.palette[+k.slice(3)] = c; renderTools(); afterSelChange(); }
    else { S[k] = c; S.preset = ""; render(); }
    save(); syncControls();
  }
  function openColor(btn) {
    colorTarget = btn.dataset.cv;
    const cur = (getCV(colorTarget) || "").toLowerCase();
    $("cgrid").innerHTML = PASTELS.map((c) => `<button data-c="${c}" style="background:${c}" class="${c === cur ? "on" : ""}" aria-label="${c}"></button>`).join("") +
      `<span class="sep"></span>` + NEUTRALS.map((c) => `<button data-c="${c}" style="background:${c}" class="${c === cur ? "on" : ""}" aria-label="${c}"></button>`).join("");
    $("cCustom").value = cur || "#ffffff";
    const pop = $("colorPop"); pop.hidden = false;
    if (!isPhone()) {
      const r = btn.getBoundingClientRect();
      pop.style.left = Math.min(window.innerWidth - 284, r.right + 10) + "px";
      pop.style.top = Math.max(8, Math.min(window.innerHeight - pop.offsetHeight - 8, r.top - 40)) + "px";
    }
  }
  function closeColor() { $("colorPop").hidden = true; colorTarget = null; }

  function syncControls() {
    const on = (id, v) => $(id).classList.toggle("on", v);
    on("shapeRound", S.shape === "round"); on("shapeAngle", S.shape === "angle");
    $("detail").value = S.detail; $("detailOut").textContent = S.detail;
    $("detailPresets").querySelectorAll("button").forEach((b) => b.classList.toggle("on", +b.dataset.d === +S.detail));
    document.querySelectorAll(".cbtn[data-cv]").forEach((b) => { const c = getCV(b.dataset.cv); if (c) b.firstElementChild.style.background = c; });
    document.querySelectorAll("#pickMode button").forEach((b) => b.classList.toggle("on", b.dataset.pick === S.pick));
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
    $("sheetToggle").setAttribute("aria-label", open ? t("sheetClose") : t("sheetOpen"));
  }

  function bind() {
    $("shapeRound").onclick = () => setOpt("shape", "round");
    $("shapeAngle").onclick = () => setOpt("shape", "angle");
    let raf = 0;
    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); };
    $("detail").oninput = (e) => { S.detail = +e.target.value; syncControls(); schedule(); };
    $("detail").onchange = save;
    $("detailPresets").onclick = (e) => { const d = e.target.dataset.d; if (d) setOpt("detail", +d); };
    document.addEventListener("click", (e) => {
      const cb = e.target.closest(".cbtn[data-cv]");
      if (cb) { e.stopPropagation(); return colorTarget === cb.dataset.cv && !$("colorPop").hidden ? closeColor() : openColor(cb); }
      const lb = e.target.closest("[data-lang]");
      if (lb) return setLang(lb.dataset.lang);
      if (!$("colorPop").hidden && !e.target.closest("#colorPop")) closeColor();
    });
    $("cgrid").onclick = (e) => { const c = e.target.dataset.c; if (c && colorTarget) { setCV(colorTarget, c); closeColor(); } };
    $("cCustom").oninput = (e) => { if (colorTarget) setCV(colorTarget, e.target.value); };
    $("colorClose").onclick = closeColor;
    $("pickMode").onclick = (e) => {
      const p = e.target.closest("[data-pick]")?.dataset.pick;
      if (!p) return;
      S.pick = p; save(); syncControls();
      hint(T[S.lang].hintPick[p]);
    };
    $("strokeW").oninput = (e) => { S.strokeW = +e.target.value; $("strokeOut").textContent = S.strokeW.toFixed(1); paint(); };
    $("strokeW").onchange = save;
    $("presets").onclick = (e) => { const p = e.target.dataset.preset; if (p) { Object.assign(S, PRESETS[p], { preset: p }); save(); syncControls(); render(); } };
    $("labelMode").onclick = (e) => { const v = e.target.dataset.label; if (v) setOpt("labels", v); };
    $("optContext").onchange = (e) => setOpt("context", e.target.checked);
    $("optOverseas").onchange = (e) => setOpt("overseas", e.target.checked);
    $("optAntarctica").onchange = (e) => { setOpt("antarctica", e.target.checked); renderCrumbs(); renderList(); };
    $("optBg").onchange = (e) => setOpt("exportBg", e.target.checked, false);


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

    $("pinColors").innerHTML = PIN_COLORS.map((c) => `<button data-c="${c}" style="background:${c}" aria-label="${t("pinColor", { n: c })}"></button>`).join("");
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
    const pt = (e) => { const r = svg.getBoundingClientRect(); return rel().invert([(e.clientX - r.left) * (model.W / r.width), (e.clientY - r.top) * (model.H / r.height)]); };
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
      if (mod && e.key.toLowerCase() === "c" && activePin) { pinClipboard = { ...activePin }; toast(t("pinCopied")); e.preventDefault(); }
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
    applyI18n(); syncControls(); renderTools(); bind();
    showLoading(true);
    try {
      const [world, idx, idx2] = await Promise.all([loadJSON("data/world.json"), loadJSON("data/adm1-index.json"), loadJSON("data/adm2-index.json")]);
      data.world = prepTopo(world);
      data.countries = data.world.full;
      data.countries.forEach((f) => data.byId.set(f.properties.id, f));
      data.adm1Index = new Set(idx);
      data.adm2Index = new Set(Object.values(idx2).flat());
    } catch (err) {
      $("loading").textContent = t("loadFail2");
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
      hint(isPhone() ? t("introPhone") : t("introPC"), 7000);
      S.seenIntro = true; save();
    }
  }
  init();
})();
