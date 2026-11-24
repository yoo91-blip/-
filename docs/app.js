/* 지도추출기 World — 하나의 지도에서 드래그·확대로 국가 › 도·주 › 시가 자동으로 나타남 */
(() => {
  "use strict";

  // ---------- 상수 ----------
  const CONT = {
    AS: { ko: "아시아", en: "Asia" }, EU: { ko: "유럽", en: "Europe" }, AF: { ko: "아프리카", en: "Africa" },
    NA: { ko: "북아메리카", en: "North America" }, SA: { ko: "남아메리카", en: "South America" },
    OC: { ko: "오세아니아", en: "Oceania" }, AN: { ko: "남극", en: "Antarctica" },
  };
  const WORLD_EXT = [-169, -57, 190, 80];
  const DEPTH = { c: 1, a1: 2, a2: 3 };
  const LV_KEY = { c: "lvContinent", a1: "lvCountry", a2: "lvRegion" };

  // ---------- 언어 ----------
  const T = {
    ko: {
      appName: "지도추출기", brandSub: "드래그·확대로 국가 › 도·주 › 시", crumbsAria: "현재 위치", tabList: "목록", tabStyle: "스타일",
      searchPh: "국가·지역 검색 후 이동 (한/영)", clearAll: "모두 해제", paintAll: "보이는 곳 모두 칠하기", language: "언어",
      shape: "끝단 모양", round: "둥글", angle: "각", detail: "디테일", precise: "정밀", normal: "보통", simple: "단순",
      paintColors: "칠하기 색", mapColors: "지도 색", preset: "프리셋", dark: "다크", light: "라이트", mono: "모노",
      baseFill: "기본 지역", stroke: "경계선", bg: "배경", strokeW: "선 두께", display: "표시", names: "이름",
      auto: "자동", painted: "칠한 곳", none: "없음", optAntarctica: "남극 표시", optBg: "다운로드에 배경색 포함",
      foot: "지도 데이터: Natural Earth (Public Domain) · geoBoundaries (CC BY 4.0) · 한국 시군구: 통계청 SGIS(공공누리 제1유형), vuski/admdongkor (CC BY 4.0)",
      tools: "도구", erase: "지우개", pin: "핀 꽂기", dlSel: "칠한 곳만", dlSelTitle: "칠한 지역만 SVG로", dlAll: "SVG 다운로드", more: "다른 형식",
      map: "지도", pickAria: "선택 단위", pickLabel: "선택", pickAuto: "자동", pickC: "국가", pickA1: "도·주", pickA2: "시",
      zoomGrp: "확대 축소", zin: "확대", zout: "축소", fit: "전체 보기", loading: "지도 불러오는 중…", lod: "세부 경계 불러오는 중…",
      export: "내보내기", close: "닫기", svgSel: "SVG · 칠한 곳만", png: "PNG 이미지 (고해상도)", pngSel: "PNG · 칠한 곳만", copy: "SVG 코드 복사",
      exportNote: "지금 화면에 보이는 범위 그대로 저장합니다.",
      pptNote: "PPT: 삽입 › 그림 › SVG 파일 선택 → 우클릭 <b>도형으로 변환</b> → <b>그룹 해제</b>하면 지역별로 쪼개집니다. (Microsoft 365 / PowerPoint 2019 이상)",
      size: "크기", border: "테두리", dup: "복제", del: "삭제", pickColor: "색 선택", custom: "직접 선택",
      world: "전세계", lvContinent: "국가", lvCountry: "도·주", lvRegion: "시·군·구", count: "{n}개", visible: "보이는 {lv} · {n}",
      jumpOther: "검색 결과", noMatch: "‘{q}’와 일치하는 지역이 없습니다.", goTo: "{n}(으)로 이동", showRegion: "이 지역으로 이동",
      unpick: "{n} 선택 해제", picked: "선택한 곳 · {n}", colorN: "{n}번 색", colorPick: "{n}번 색으로 선택",
      hintErase: "지우개: 누른 곳의 선택을 지웁니다", hintPin: "지도를 누르면 핀이 꽂힙니다", hintColor: "{n}번 색으로 선택합니다",
      hintPick: { auto: "자동: 지금 보이는 가장 작은 단위를 선택", c: "국가 단위로 선택", a1: "도·주 단위로 선택 (작으면 눌러서 확대)", a2: "시 단위로 선택 (작으면 눌러서 확대)" },
      loadFail: "지도 데이터를 불러오지 못했습니다. 연결을 확인해 주세요.",
      noSel: "먼저 지역을 선택해 주세요.", noExport: "내보낼 지역이 없습니다.", svgSaved: "SVG 저장됨 · PPT에서 도형으로 변환 후 그룹 해제",
      pngSaved: "PNG 저장됨", pngFail: "PNG 변환에 실패했습니다. SVG로 받아 주세요.", copied: "SVG 코드를 복사했습니다.",
      copyBlocked: "복사가 막혀 있습니다. SVG 다운로드를 사용해 주세요.", pinCopied: "핀 복사됨", loadFail2: "지도 데이터를 불러오지 못했습니다. 새로고침해 주세요.",
      sheetOpen: "목록 열기", sheetClose: "목록 닫기", pinColor: "핀 색 {n}", help: "사용법", helpOk: "시작하기",
      helpItems: [
        "<b>이동·확대</b> 드래그로 옮기고, 마우스 휠 또는 두 손가락으로 확대합니다. 나라가 크게 보이면 <b>도·주</b>, 도·주가 크게 보이면 <b>시·군·구</b> 경계가 자동으로 나타납니다.",
        "<b>선택</b> 누르면 지금 보이는 가장 작은 지역이 칠해지고, 다시 누르면 지워집니다. 위쪽 <b>색 동그라미</b>로 색을 바꾸고, <b>지우개</b>로 지웁니다.",
        "<b>선택 단위</b> 지도 왼쪽 위 <b>선택</b> 버튼에서 국가 / 도·주 / 시로 고정할 수 있습니다. 예: '국가'로 두면 확대해도 나라 전체가 칠해집니다.",
        "<b>찾기</b> 목록 탭 검색창에 나라 이름을 쓰면 그 나라로 바로 이동합니다. 목록에서 이름을 눌러 칠할 수도 있습니다.",
        "<b>핀</b> 핀 버튼을 누르고 지도를 누르면 핀이 꽂힙니다. 핀은 끌어서 옮기고, 색·크기를 바꿀 수 있습니다.",
        "<b>내보내기</b> 다운로드는 지금 화면에 보이는 그대로 저장됩니다. PowerPoint에 SVG를 넣고 <b>도형으로 변환 → 그룹 해제</b>하면 지역별로 편집할 수 있습니다.",
        "선택한 곳은 자동 저장되며, 목록 탭의 칩에서 이동하거나 해제할 수 있습니다.",
      ],
      gRegions: "지역", gPicked: "선택", gDots: "위치점", gNames: "이름", gPins: "핀", gBase: "바탕",
    },
    en: {
      appName: "Map Extractor", brandSub: "Drag & zoom: country › state › city", crumbsAria: "Current location", tabList: "List", tabStyle: "Style",
      searchPh: "Search a country or region", clearAll: "Clear all", paintAll: "Paint all visible", language: "Language",
      shape: "Corners", round: "Round", angle: "Sharp", detail: "Detail", precise: "Fine", normal: "Normal", simple: "Simple",
      paintColors: "Paint colors", mapColors: "Map colors", preset: "Preset", dark: "Dark", light: "Light", mono: "Mono",
      baseFill: "Land", stroke: "Borders", bg: "Background", strokeW: "Line width", display: "Display", names: "Names",
      auto: "Auto", painted: "Painted", none: "None", optAntarctica: "Show Antarctica", optBg: "Include background in downloads",
      foot: "Map data: Natural Earth (public domain) · geoBoundaries (CC BY 4.0) · Korea: Statistics Korea SGIS (KOGL Type 1), vuski/admdongkor (CC BY 4.0)",
      tools: "Tools", erase: "Eraser", pin: "Add pin", dlSel: "Painted only", dlSelTitle: "Download painted areas as SVG", dlAll: "Download SVG", more: "More formats",
      map: "Map", pickAria: "Selection level", pickLabel: "Select", pickAuto: "Auto", pickC: "Country", pickA1: "State", pickA2: "City",
      zoomGrp: "Zoom", zin: "Zoom in", zout: "Zoom out", fit: "Fit to view", loading: "Loading map…", lod: "Loading detailed borders…",
      export: "Export", close: "Close", svgSel: "SVG · painted only", png: "PNG image (high resolution)", pngSel: "PNG · painted only", copy: "Copy SVG code",
      exportNote: "Saves exactly what is visible on screen.",
      pptNote: "PowerPoint: Insert › Pictures › choose the SVG → right-click <b>Convert to Shape</b> → <b>Ungroup</b> to split it into regions. (Microsoft 365 / PowerPoint 2019+)",
      size: "Size", border: "Outline", dup: "Duplicate", del: "Delete", pickColor: "Choose a color", custom: "Custom",
      world: "World", lvContinent: "countries", lvCountry: "states", lvRegion: "cities", count: "{n}", visible: "Visible {lv} · {n}",
      jumpOther: "Search results", noMatch: "No area matches “{q}”.", goTo: "Go to {n}", showRegion: "Go to this area",
      unpick: "Remove {n}", picked: "Selected · {n}", colorN: "Color {n}", colorPick: "Select with color {n}",
      hintErase: "Eraser: tap an area to clear it", hintPin: "Tap the map to drop a pin", hintColor: "Selecting with color {n}",
      hintPick: { auto: "Auto: selects the smallest area you can see", c: "Selecting whole countries", a1: "Selecting states (tap a small country to zoom in)", a2: "Selecting cities (tap a small area to zoom in)" },
      loadFail: "Couldn't load map data. Check your connection.",
      noSel: "Select an area first.", noExport: "Nothing to export.", svgSaved: "SVG saved · in PowerPoint, Convert to Shape, then Ungroup",
      pngSaved: "PNG saved", pngFail: "PNG export failed. Download the SVG instead.", copied: "SVG code copied.",
      copyBlocked: "Copying is blocked here. Use Download SVG.", pinCopied: "Pin copied", loadFail2: "Couldn't load map data. Please reload.",
      sheetOpen: "Open list", sheetClose: "Close list", pinColor: "Pin color {n}", help: "How to use", helpOk: "Get started",
      helpItems: [
        "<b>Move & zoom</b> Drag to pan; zoom with the mouse wheel or two fingers. When a country gets large, its <b>states</b> appear; zoom further and <b>cities</b> appear.",
        "<b>Select</b> Tap to paint the smallest area you can see; tap again to clear it. Change the color with the <b>color dots</b> at the top, or clear with the <b>eraser</b>.",
        "<b>Selection level</b> Use <b>Select</b> at the top left to lock to Country / State / City. With Country, zooming in still paints the whole country.",
        "<b>Find</b> Type a country in the List tab search box to jump there. You can also tap names in the list to paint them.",
        "<b>Pins</b> Tap the pin button, then the map. Drag pins to move them and change their color or size.",
        "<b>Export</b> Downloads save exactly what you see. In PowerPoint, insert the SVG, then <b>Convert to Shape → Ungroup</b> to edit each region.",
        "Selections are saved automatically. Use the chips in the List tab to jump to or remove them.",
      ],
      gRegions: "Regions", gPicked: "Selected", gDots: "Markers", gNames: "Names", gPins: "Pins", gBase: "Base",
    },
  };
  const t = (k, vars) => { let v = (T[S.lang] || T.ko)[k] ?? T.ko[k] ?? k; if (vars && typeof v === "string") for (const x in vars) v = v.replace("{" + x + "}", vars[x]); return v; };
  const nm = (p) => (S.lang === "en" ? p.en || p.ko : p.ko || p.en);
  const alt = (p) => (S.lang === "en" ? p.ko : p.en);

  // 파스텔 30색(15개 색상 × 연한/중간) + 무채색 6색
  function hsl2hex(h, s, l) {
    s /= 100; l /= 100;
    const f = (n) => { const k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, "0"); };
    return "#" + f(0) + f(8) + f(4);
  }
  const HUES = [0, 16, 30, 42, 52, 70, 100, 140, 165, 182, 198, 212, 232, 262, 300];
  const PASTELS = HUES.map((h) => hsl2hex(h, 75, 86)).concat(HUES.map((h) => hsl2hex(h, 55, 70)));
  const NEUTRALS = ["#ffffff", "#f2f4f6", "#d5dbe1", "#8a96a3", "#3a4654", "#10161d"];
  const PRESETS = {
    dark: { bg: "#10161d", fill: "#f2f4f6", stroke: "#10161d", strokeW: 0.8 },
    light: { bg: "#ffffff", fill: "#d5dbe1", stroke: "#ffffff", strokeW: 1 },
    mono: { bg: "#ffffff", fill: "#ffffff", stroke: "#1f2937", strokeW: 0.8 },
  };
  const DEFAULT_PALETTE = [hsl2hex(182, 55, 62), hsl2hex(212, 60, 66), hsl2hex(30, 80, 66), hsl2hex(0, 65, 70), hsl2hex(262, 50, 72)];
  const PIN_COLORS = ["#e5484d", "#f5a524", "#f7d038", "#2bb5ad", "#3b82f6", "#8b5cf6", "#8a96a3", "#ffffff", "#111827"];
  const PIN_PATH = "M0,0C-2.2,-5.6 -9,-10.4 -9,-17.5A9,9 0 1 1 9,-17.5C9,-10.4 2.2,-5.6 0,0Z";
  const STORE_KEY = "mapx-world-v3";
  const SAVE_KEYS = ["lang", "pick", "shape", "detail", "labels", "labelsV2", "antarctica", "exportBg", "bg", "fill", "stroke", "strokeW", "preset", "palette", "tool", "seenHelp", "zoom"];

  // ---------- 상태 ----------
  const defaults = {
    lang: (navigator.language || "ko").toLowerCase().startsWith("ko") ? "ko" : "en", pick: "auto",
    shape: "angle", detail: 60, labels: "auto", labelsV2: true, antarctica: false, exportBg: false,
    ...PRESETS.dark, preset: "dark", palette: DEFAULT_PALETTE.slice(), tool: 0, seenHelp: false, zoom: null,
  };
  const saved = load();
  const S = Object.assign({}, defaults, saved.s || {});
  if (!Array.isArray(S.palette) || S.palette.length !== 5) S.palette = DEFAULT_PALETTE.slice();
  if (typeof S.tool !== "number" && S.tool !== "erase") S.tool = 0;
  if (!S.labelsV2 || S.labels === "all") { S.labels = "auto"; S.labelsV2 = true; }
  const sel = new Map((saved.sel || []).map((x) => [x.lv + ":" + x.id, x]));
  let pins = [], activePin = null, pinClipboard = null;
  let lastColor = typeof S.tool === "number" ? S.tool : 0;
  let model = null, projection = null, base = null;
  let zt = d3.zoomIdentity, baked = d3.zoomIdentity;
  const rel = () => { const r = zt.k / baked.k; return d3.zoomIdentity.translate(zt.x - r * baked.x, zt.y - r * baked.y).scale(r); };
  const effDetail = () => (S.detail >= 100 ? 100 : Math.round(Math.min(100, S.detail + (100 - S.detail) * Math.min(1, Math.log2(Math.max(1, zt.k)) / 3))));

  const $ = (id) => document.getElementById(id);
  const svg = $("map"), stage = $("stage"), listEl = $("list");
  const isPhone = () => matchMedia("(max-width: 760px)").matches;

  function load() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; } }
  function save() {
    try { const s = {}; SAVE_KEYS.forEach((k) => (s[k] = S[k])); localStorage.setItem(STORE_KEY, JSON.stringify({ s, sel: [...sel.values()] })); } catch { /* 저장 불가 */ }
  }

  // ---------- 데이터 ----------
  const data = { world: null, adm1: new Map(), adm2: new Map(), adm1Index: new Set(), adm2Index: new Set(), countries: [], byId: new Map() };
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
    const full = topojson.feature(topo, topo.objects[name]).features;
    return { topo, pre: null, name, weights: null, cache: new Map(), full, byId: new Map(full.map((f) => [f.properties.id, f])) };
  }
  function featuresAt(entry, detail) {
    const hit = entry.cache.get(detail);
    if (hit) return hit.f;
    let feats;
    if (detail >= 100) feats = entry.full;
    else {
      // 단순화용 가중치는 처음 필요할 때 한 번만 계산 (많이 확대하면 원본을 그대로 써서 생략됨)
      if (!entry.pre) {
        entry.pre = topojson.presimplify(entry.topo, topojson.sphericalTriangleArea);
        const w = [];
        for (const arc of entry.pre.arcs) for (const p of arc) if (isFinite(p[2])) w.push(p[2]);
        entry.weights = w.sort((a, b) => b - a);
      }
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
      const tp = { type: "Topology", bbox: entry.pre.bbox, objects: entry.pre.objects, arcs };
      feats = topojson.feature(tp, tp.objects[entry.name]).features;
      feats.forEach((x) => rewind(x.geometry));
    }
    if (entry.cache.size > 4) entry.cache.delete(entry.cache.keys().next().value);
    entry.cache.set(detail, { f: feats, byId: new Map(feats.map((x) => [x.properties.id, x])) });
    return feats;
  }
  const featAt = (entry, id, det = S.detail) => { featuresAt(entry, det); return entry.cache.get(det).byId.get(id); };

  async function loadJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(url + " " + r.status);
    return r.json();
  }
  const inflight = new Map();
  function cached(map, key, url) {
    if (map.has(key)) return Promise.resolve(map.get(key));
    if (inflight.has(url)) return inflight.get(url);
    const pr = loadJSON(url).then((j) => { const e = prepTopo(j); map.set(key, e); return e; }).finally(() => inflight.delete(url));
    inflight.set(url, pr);
    return pr;
  }
  const ensureAdm1 = (cc) => cached(data.adm1, cc, `data/adm1/${cc}.json`);
  const ensureAdm2 = (cc, a1) => cached(data.adm2, a1, `data/adm2/${cc}/${a1}.json`);
  const hasCities = (a1) => data.adm2Index.has(a1);

  // ---------- 지오메트리 도우미 ----------
  function polysOf(g) { return !g ? [] : g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []; }
  // 단순화로 링 방향이 뒤집히면 d3가 지구 반대편 전체를 칠하므로 바로잡는다
  function rewind(g) {
    for (const poly of polysOf(g)) poly.forEach((ring, i) => {
      if (ring.length < 4) return;
      const big = d3.geoArea({ type: "Polygon", coordinates: [ring] }) > 2 * Math.PI;
      if ((i === 0) === big) ring.reverse();
    });
  }
  function extentObj(ext) {
    const [w, s, e, n] = ext, pts = [];
    for (let i = 0; i <= 16; i++) { const x = w + ((e - w) * i) / 16; pts.push([x, s], [x, n]); }
    for (let i = 0; i <= 8; i++) { const y = s + ((n - s) * i) / 8; pts.push([w, y], [e, y]); }
    return { type: "MultiPoint", coordinates: pts.map(([x, y]) => [x > 180 ? x - 360 : x, y]) };
  }
  // 본토 + 가까운 섬 (해외영토 제외) — 나라로 이동할 때 화면 맞춤에 사용
  function bboxDist(a, b) {
    const norm = (bb) => { let [[w, s], [e, n]] = bb; if (e < w) e += 360; return [w, s, e, n]; };
    const A = norm(a), B = norm(b);
    const dy = Math.max(0, A[1] - B[3], B[1] - A[3]);
    const lat = Math.cos(((A[1] + A[3] + B[1] + B[3]) / 4) * Math.PI / 180);
    let best = Infinity;
    for (const sh of [-360, 0, 360]) best = Math.min(best, Math.hypot(Math.max(0, A[0] - (B[2] + sh), (B[0] + sh) - A[2]) * lat, dy));
    return best;
  }
  function mainland(geom) {
    const polys = polysOf(geom);
    if (polys.length <= 1) return geom;
    const items = polys.map((c) => { const g = { type: "Polygon", coordinates: c }; return { c, b: d3.geoBounds(g), a: d3.geoArea(g), in: false }; }).sort((x, y) => y.a - x.a);
    items[0].in = true;
    const inc = [items[0]];
    let changed = true;
    while (changed) { changed = false; for (const it of items) if (!it.in && inc.some((j) => bboxDist(it.b, j.b) < 3)) { it.in = true; inc.push(it); changed = true; } }
    return { type: "MultiPolygon", coordinates: inc.map((i) => i.c) };
  }

  // geoPath → 링 수집 → 각/둥글 path 문자열
  const rec = {
    rings: [], cur: null,
    moveTo(x, y) { this.cur = [[x, y]]; this.rings.push(this.cur); },
    lineTo(x, y) { this.cur.push([x, y]); },
    closePath() {}, arc() {}, beginPath() {},
  };
  let geoPath = null, gpArea = null;
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
      if (!round || r.length < 3) d += "M" + r.map(([x, y]) => f1(x) + "," + f1(y)).join("L") + "Z";
      else {
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
  // 기준 투영(확대 1배) 좌표에서 한 번만 계산해 두는 크기·위치 정보. 화면 좌표 = k·기준 + (x, y)
  let metricsCache = new Map();
  function metrics(key, geom) {
    let m = metricsCache.get(key);
    if (m) return m;
    const gp = d3.geoPath(base);
    const [[x0, y0], [x1, y1]] = gp.bounds(geom);
    let best = null, ba = -1;
    for (const c of polysOf(geom)) { const g = { type: "Polygon", coordinates: c }; const a = gp.area(g); if (a > ba) { ba = a; best = g; } }
    let bp = null;
    if (best && ba > 0) { const [[a0, b0], [a1, b1]] = gp.bounds(best), c = gp.centroid(best); if (isFinite(c[0])) bp = { x: c[0], y: c[1], w: a1 - a0, h: b1 - b0, area: ba }; }
    m = { x0, y0, x1, y1, area: gp.area(geom), bp };
    metricsCache.set(key, m);
    return m;
  }
  // 화면에 보이는 면적(대략): 경계상자가 화면에 걸친 비율로 보정
  function visArea(mt, W, H) {
    const k = zt.k, x0 = k * mt.x0 + zt.x, x1 = k * mt.x1 + zt.x, y0 = k * mt.y0 + zt.y, y1 = k * mt.y1 + zt.y;
    if (x1 < -2 || x0 > W + 2 || y1 < -2 || y0 > H + 2) return 0;
    const ov = (Math.min(x1, W) - Math.max(x0, 0)) * (Math.min(y1, H) - Math.max(y0, 0));
    const tot = Math.max(1e-9, (x1 - x0) * (y1 - y0));
    return mt.area * k * k * Math.max(0, Math.min(1, ov / tot));
  }
  function screenPoly(mt) {
    if (!mt || !mt.bp) return null;
    const k = zt.k, b = mt.bp;
    return { x: k * b.x + zt.x, y: k * b.y + zt.y, w: b.w * k, h: b.h * k, area: b.area * k * k };
  }
  function bestPoly(geom) {
    let best = null, ba = -1;
    for (const c of polysOf(geom)) { const g = { type: "Polygon", coordinates: c }; const a = gpArea.area(g); if (a > ba) { ba = a; best = g; } }
    if (!best || ba <= 0) return null;
    const [[x0, y0], [x1, y1]] = gpArea.bounds(best), c = gpArea.centroid(best);
    return isFinite(c[0]) ? { x: c[0], y: c[1], area: ba, w: x1 - x0, h: y1 - y0 } : null;
  }

  // ---------- 선택 ----------
  const skey = (lv, id) => lv + ":" + id;
  const selColor = (lv, id) => { const s = sel.get(skey(lv, id)); return s ? S.palette[s.ci] : null; };
  // 자기 색 → 도·주 색 → 국가 색 순으로 상속
  const fillFor = (lv, id, cc, a1) => selColor(lv, id) || (lv === "a2" && a1 && selColor("a1", a1)) || (lv !== "c" && cc && selColor("c", cc)) || null;
  const countryName = (cc) => (data.byId.get(cc) ? nm(data.byId.get(cc).properties) : cc);
  const a1Name = (cc, a1) => { const f = data.adm1.get(cc)?.byId.get(a1); return f ? nm(f.properties) : ""; };
  function toggleSel(info) {
    const k = skey(info.lv, info.id), cur = sel.get(k);
    if (S.tool === "erase") { if (!cur) return; sel.delete(k); }
    else {
      const ci = typeof S.tool === "number" ? S.tool : lastColor;
      if (cur && cur.ci === ci) sel.delete(k); else sel.set(k, { lv: info.lv, id: info.id, cc: info.cc, a1: info.a1 || null, name: info.name, ci });
    }
    save(); render(); renderChips();
  }
  function selGeom(s, det) {
    if (s.lv === "c") return featAt(data.world, s.id, det);
    if (s.lv === "a1") return data.adm1.has(s.cc) ? featAt(data.adm1.get(s.cc), s.id, det) : null;
    return data.adm2.has(s.a1) ? featAt(data.adm2.get(s.a1), s.id, det) : null;
  }

  // ---------- 렌더 (화면에 보이는 크기에 따라 도·주·시를 자동으로 펼침) ----------
  let lastW = 0, lastH = 0;
  function makeBase(W, H) {
    const pad = Math.round(Math.min(W, H) * 0.04);
    base = d3.geoMercator().rotate([-10, 0]).precision(0.3).fitExtent([[pad, pad], [W - pad, H - pad]], extentObj(WORLD_EXT));
    zoom.translateExtent([[-W * 0.6, -H * 0.6], [W * 1.6, H * 1.6]]).extent([[0, 0], [W, H]]);
    metricsCache = new Map();
  }
  function bakeProjection(W, H) {
    const [tx, ty] = base.translate();
    return d3.geoMercator().rotate([-10, 0]).precision(0.3).scale(base.scale() * zt.k)
      .translate([tx * zt.k + zt.x, ty * zt.k + zt.y]).clipExtent([[-2, -2], [W + 2, H + 2]]);
  }
  const want = new Set();
  let wantT = 0;
  function requestLoad(kind, cc, a1) {
    const key = kind + ":" + (a1 || cc);
    if (want.has(key)) return;
    want.add(key);
    clearTimeout(wantT);
    wantT = setTimeout(flushLoads, 30);
  }
  async function flushLoads() {
    const jobs = [...want].map((k) => {
      const [kind, id] = k.split(":");
      return (kind === "a1" ? ensureAdm1(id) : ensureAdm2(id.split("-")[0], id)).catch(() => null);
    });
    if (!jobs.length) return;
    $("lodBusy").textContent = t("lod"); $("lodBusy").hidden = false;
    await Promise.all(jobs);
    want.clear();
    $("lodBusy").hidden = true;
    render();
  }

  function render() {
    if (!data.world) return;
    const W = Math.max(200, stage.clientWidth), H = Math.max(160, stage.clientHeight);
    if (!base || W !== lastW || H !== lastH) { makeBase(W, H); lastW = W; lastH = H; }
    projection = bakeProjection(W, H);
    baked = zt;
    geoPath = d3.geoPath(projection, rec);
    gpArea = d3.geoPath(projection);
    const round = S.shape === "round", det = effDetail(), minDim = Math.min(W, H);
    const T1 = minDim * 0.3, T2 = minDim * 0.28; // 이 크기(√면적, px)보다 커지면 한 단계 펼침
    const units = [], under = [], openC = new Set(), openA = new Set();
    for (const f of featuresAt(data.world, det)) {
      const id = f.properties.id;
      if (!S.antarctica && f.properties.ct === "AN") continue;
      const mt = metrics("c:" + id, data.byId.get(id).geometry), area = visArea(mt, W, H);
      if (!(area > 0.05)) continue;
      const big = Math.sqrt(area) >= T1 && data.adm1Index.has(id);
      if (big && data.adm1.has(id)) {
        openC.add(id);
        under.push({ geom: f.geometry, color: selColor("c", id) });
        const e1 = data.adm1.get(id);
        for (const af of featuresAt(e1, det)) {
          const aid = af.properties.id, amt = metrics("a1:" + aid, e1.byId.get(aid).geometry), aa = visArea(amt, W, H);
          if (!(aa > 0.05)) continue;
          const bigA = Math.sqrt(aa) >= T2 && hasCities(aid);
          if (bigA && data.adm2.has(aid)) {
            openA.add(aid);
            under.push({ geom: af.geometry, color: fillFor("a1", aid, id) });
            const e2 = data.adm2.get(aid);
            for (const cf of featuresAt(e2, det)) {
              const cmt = metrics("a2:" + cf.properties.id, e2.byId.get(cf.properties.id).geometry), ca = visArea(cmt, W, H);
              if (ca > 0.02) units.push({ f: cf, lv: "a2", id: cf.properties.id, cc: id, a1: aid, area: ca, mt: cmt });
            }
          } else {
            if (bigA) requestLoad("a2", id, aid);
            units.push({ f: af, lv: "a1", id: aid, cc: id, area: aa, mt: amt });
          }
        }
      } else {
        if (big) requestLoad("a1", id);
        units.push({ f, lv: "c", id, cc: id, area, mt });
      }
    }
    const m = { W, H, round, units: [], under: [], ovl: [], openC, openA };
    for (const u of under) { const d = pathD(u.geom, round); if (d) m.under.push({ d, color: u.color }); }
    const drawn = new Set();
    for (const u of units) {
      const d = pathD(u.f.geometry, round);
      if (!d) continue;
      drawn.add(skey(u.lv, u.id));
      m.units.push({ ...u, d, geom: u.f.geometry, name: nm(u.f.properties), color: fillFor(u.lv, u.id, u.cc, u.a1) });
    }
    // 화면에 펼쳐지지 않은 더 깊은 단계의 선택은 위에 덮어 그림
    for (const s of [...sel.values()].sort((a, b) => DEPTH[a.lv] - DEPTH[b.lv])) {
      if (drawn.has(skey(s.lv, s.id)) || (s.lv === "c" && openC.has(s.id)) || (s.lv === "a1" && openA.has(s.id))) continue;
      const g = selGeom(s, det);
      if (!g) continue;
      const mt = metrics(skey(s.lv, s.id), g.geometry);
      if (!(visArea(mt, W, H) > 0)) continue;
      const d = pathD(g.geometry, round);
      if (d) m.ovl.push({ ...s, name: nm(g.properties), d, geom: g.geometry, mt, color: S.palette[s.ci] });
    }
    model = m;
    computeMarkers(); computeLabels(); paint();
    updateCrumbs(); renderList();
  }

  // 너무 작아 보이지 않는 선택 지역은 점으로 표시
  function computeMarkers() {
    const m = model;
    m.markers = [];
    const add = (mt, color, key) => { const p = screenPoly(mt); if (p) m.markers.push({ x: p.x, y: p.y, color, area: p.area, key }); };
    for (const u of m.units) if (selColor(u.lv, u.id)) add(u.mt, u.color, skey(u.lv, u.id));
    for (const o of m.ovl) add(o.mt, o.color, skey(o.lv, o.id));
  }
  const tiny = (mk, k) => mk.area * k * k < 40;
  const dotted = (key, k) => model.markers.some((mk) => mk.key === key && tiny(mk, k));
  const markerSVG = (mk, x, y) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="4.5" fill="${mk.color}" stroke="#ffffff" stroke-width="1.5"/>`;

  // 지도 위 이름은 짧게: 쉼표 뒤 행정 구분 제거
  const shortName = (n) => String(n).split(",")[0].replace(/^(Landkreis|Kreis|District of|Okres|Powiat|powiat|Bezirk|Municipality of|Município de)\s+/i, "").replace(/\s+(District|County|Municipality|Prefecture)$/i, "").trim() || n;
  const textW = (s, fs) => [...s].reduce((w, ch) => w + (ch.charCodeAt(0) > 0x2e80 ? fs : fs * 0.66), 0);
  // 이름표: 글자가 들어갈 만큼 커진 곳만, 큰 곳부터, 겹치면 생략
  function computeLabels() {
    const m = model;
    m.labels = [];
    if (S.labels === "none") return;
    const placed = [];
    const tryPlace = (mt, name, opt) => {
      const b = screenPoly(mt);
      if (!b) return;
      const text = shortName(name);
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
      m.labels.push({ x: b.x, y: b.y, text, color: opt.color || null, fs, area: b.area, key: opt.key });
    };
    const seen = new Set();
    for (const u of m.units) if (selColor(u.lv, u.id) && !seen.has(u.id)) { seen.add(u.id); tryPlace(u.mt, u.name, { fs: 13, color: u.color, key: skey(u.lv, u.id), force: true }); }
    for (const o of m.ovl) tryPlace(o.mt, o.name, { fs: 12, color: o.color, key: skey(o.lv, o.id), force: true });
    if (S.labels !== "auto") return;
    for (const u of m.units.filter((x) => !seen.has(x.id)).sort((a, b) => b.area - a.area)) {
      seen.add(u.id);
      tryPlace(u.mt, u.name, { fs: u.lv === "c" ? 13 : 12, color: u.color, key: skey(u.lv, u.id) });
    }
  }

  function lum(hex) { const n = parseInt(hex.slice(1), 16); return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; }
  const textOn = (hex) => (lum(hex) > 0.6 ? "#1b2430" : "#ffffff");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const joinAttr = () => `stroke-linejoin="${model.round ? "round" : "miter"}"`;
  const unitAttrs = (u) => `fill="${u.color || S.fill}" stroke="${S.stroke}" stroke-width="${S.strokeW}" ${joinAttr()}`;
  const ovlAttrs = (o) => `fill="${o.color}" stroke="${S.stroke}" stroke-width="${S.strokeW}" ${joinAttr()}`;
  function labelSVG(l, x, y) {
    const fill = textOn(l.color || S.fill), halo = fill === "#ffffff" ? "#1b2430" : "#ffffff";
    return `<text x="${f1(x)}" y="${f1(y)}" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-size="${l.fs}" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="${fill}" stroke="${halo}" stroke-width="2.4" stroke-opacity="0.5" paint-order="stroke">${esc(l.text)}</text>`;
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
    if (m.under.length) h += `<g id="under">` + m.under.map((u) => `<path class="ovl" d="${u.d}" fill="${u.color || S.fill}" stroke="none"/>`).join("") + `</g>`;
    h += `<g id="units">` + m.units.map((u, i) => `<path class="unit" data-i="${i}" d="${u.d}" ${unitAttrs(u)}><title>${esc(u.name)}</title></path>`).join("") + `</g>`;
    if (m.ovl.length) h += `<g id="ovl">` + m.ovl.map((o) => `<path class="ovl" d="${o.d}" ${ovlAttrs(o)}/>`).join("") + `</g>`;
    h += `</g><g id="labels" pointer-events="none"></g><g id="pins"></g>`;
    svg.innerHTML = h;
    applyZoom();
  }
  // 확대·이동 중에는 이미 그린 그림을 옮기기만 하고(가벼움), 이름표·핀은 화면 크기 유지
  function applyZoom() {
    const vp = svg.querySelector("#vp");
    if (!vp) return;
    const R = rel();
    vp.setAttribute("transform", R.toString());
    svg.querySelector("#labels").innerHTML = model.markers.filter((mk) => tiny(mk, R.k)).map((mk) => markerSVG(mk, R.applyX(mk.x), R.applyY(mk.y))).join("") +
      model.labels.map((l) => labelSVG(l, R.applyX(l.x), R.applyY(l.y) - (dotted(l.key, R.k) ? l.fs : 0))).join("");
    paintPins();
  }
  function paintPins() {
    const g = svg.querySelector("#pins");
    if (!g || !projection) return;
    const R = rel();
    g.innerHTML = pins.map((p) => {
      const xy = projection([p.lon, p.lat]);
      if (!xy) return "";
      const ring = p === activePin ? `<circle class="pin-ring" cx="0" cy="-12" r="15"/>` : "";
      return pinSVG(p, [R.applyX(xy[0]), R.applyY(xy[1])], `class="pin" data-pin="${p.id}"`).replace(/<\/g>$/, ring + "</g>");
    }).join("");
  }

  // ---------- 확대/이동 ----------
  let rebakeT = 0, saveZoomT = 0;
  const zoom = d3.zoom()
    .scaleExtent([1, 3000])
    .clickDistance(6)
    .filter((e) => !e.target.closest(".pin") && (!e.button || e.type === "wheel"))
    .on("zoom", (e) => { zt = e.transform; applyZoom(); })
    .on("end", () => {
      clearTimeout(rebakeT);
      if (zt.k !== baked.k || zt.x !== baked.x || zt.y !== baked.y) rebakeT = setTimeout(render, 80);
      clearTimeout(saveZoomT);
      saveZoomT = setTimeout(() => { S.zoom = [zt.x, zt.y, zt.k]; save(); }, 400);
    });
  const zoomBy = (k) => d3.select(svg).transition().duration(220).call(zoom.scaleBy, k);
  const resetZoom = () => d3.select(svg).transition().duration(350).call(zoom.transform, d3.zoomIdentity);
  // 지형지물을 화면에 맞춰 확대 (기준 투영 좌표로 계산)
  function zoomToGeom(geom, maxK = 3000) {
    if (!geom) return;
    const g = geom.type ? geom : geom.geometry;
    const [[x0, y0], [x1, y1]] = d3.geoPath(base).bounds(g.type === "MultiPolygon" || g.type === "Polygon" ? mainland(g) : g);
    const w = Math.max(x1 - x0, 0.01), h = Math.max(y1 - y0, 0.01);
    const k = Math.max(1, Math.min(maxK, 0.85 * Math.min(lastW / w, lastH / h)));
    const tr = d3.zoomIdentity.translate(lastW / 2 - k * (x0 + w / 2), lastH / 2 - k * (y0 + h / 2)).scale(k);
    d3.select(svg).transition().duration(550).ease(d3.easeCubicInOut).call(zoom.transform, tr);
  }

  // ---------- 누르기 ----------
  function selectUnit(u, force) {
    const pick = force ? "auto" : S.pick;
    if (pick === "auto") return toggleSel({ lv: u.lv, id: u.id, cc: u.cc, a1: u.a1, name: u.name });
    const pd = DEPTH[pick === "c" ? "c" : pick], ud = DEPTH[u.lv];
    if (ud > pd) {
      if (pick === "c") return toggleSel({ lv: "c", id: u.cc, cc: u.cc, name: countryName(u.cc) });
      return toggleSel({ lv: "a1", id: u.a1, cc: u.cc, name: a1Name(u.cc, u.a1) });
    }
    if (ud === pd) return toggleSel({ lv: u.lv, id: u.id, cc: u.cc, a1: u.a1, name: u.name });
    // 고정한 단위보다 큰 곳을 누르면 그곳으로 확대해서 세부 경계를 보여줌
    if (u.lv === "c" && !data.adm1Index.has(u.id)) return toggleSel({ lv: "c", id: u.id, cc: u.cc, name: u.name });
    if (u.lv === "a1" && !hasCities(u.id)) return toggleSel({ lv: "a1", id: u.id, cc: u.cc, name: u.name });
    zoomToGeom(u.geom);
  }

  // ---------- 위치 표시 · 목록 ----------
  const chevron = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
  // 화면 가운데에 있는 곳을 기준으로 '전세계 › 대륙 › 국가 › 도·주' 표시
  function updateCrumbs() {
    const el = $("crumbs");
    const r = svg.getBoundingClientRect();
    let hit = null;
    for (const node of document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2)) { if (node.classList && node.classList.contains("unit")) { hit = model.units[+node.dataset.i]; break; } }
    const parts = [{ label: t("world"), go: () => resetZoom() }];
    if (hit && zt.k > 1.4) {
      const cf = data.byId.get(hit.cc);
      if (cf && CONT[cf.properties.ct]) parts.push({ label: nm(CONT[cf.properties.ct]), go: null });
      if (hit.lv !== "c" || zt.k > 2.5) parts.push({ label: countryName(hit.cc), go: () => zoomToGeom(cf) });
      if (hit.a1) parts.push({ label: a1Name(hit.cc, hit.a1), go: () => zoomToGeom(data.adm1.get(hit.cc).byId.get(hit.a1)) });
    }
    el.innerHTML = "";
    parts.forEach((p, i) => {
      if (i) el.insertAdjacentHTML("beforeend", `<span class="sep">›</span>`);
      if (i === parts.length - 1 || !p.go) { el.insertAdjacentHTML("beforeend", `<span class="${i === parts.length - 1 ? "cur" : "crumb-txt"}">${esc(p.label)}</span>`); return; }
      const b = document.createElement("button");
      b.textContent = p.label;
      b.onclick = (e) => { e.stopPropagation(); p.go(); };
      el.appendChild(b);
    });
  }
  // 목록: 지금 화면에 보이는 가장 세부 단위
  function visibleList() {
    const lv = model.units.some((u) => u.lv === "a2") ? "a2" : model.units.some((u) => u.lv === "a1") ? "a1" : "c";
    const seen = new Set();
    return { lv, items: model.units.filter((u) => u.lv === lv && u.area > 4 && !seen.has(u.id) && seen.add(u.id)).sort((a, b) => a.name.localeCompare(b.name, S.lang)) };
  }
  function renderList() {
    if (!model) return;
    const q = $("search").value.trim().toLowerCase();
    if (q) {
      const hits = [];
      for (const f of data.countries) if (nm(f.properties).toLowerCase().includes(q) || alt(f.properties).toLowerCase().includes(q)) hits.push({ k: "c:" + f.properties.id, name: nm(f.properties), sub: nm(CONT[f.properties.ct] || { ko: "", en: "" }) });
      for (const [cc, e] of data.adm1) for (const f of e.full) if (nm(f.properties).toLowerCase().includes(q) || alt(f.properties).toLowerCase().includes(q)) hits.push({ k: "a1:" + cc + ":" + f.properties.id, name: nm(f.properties), sub: countryName(cc) });
      for (const [a1, e] of data.adm2) for (const f of e.full) if (nm(f.properties).toLowerCase().includes(q) || alt(f.properties).toLowerCase().includes(q)) hits.push({ k: "a2:" + a1 + ":" + f.properties.id, name: nm(f.properties), sub: countryName(a1.split("-")[0]) });
      $("listTitle").textContent = t("jumpOther");
      listEl.innerHTML = hits.slice(0, 60).map((h) => `<li class="item nobox" data-jump="${esc(h.k)}"><span class="nm">${esc(h.name)}<small>${esc(h.sub)}</small></span><button class="go" data-jump="${esc(h.k)}" aria-label="${esc(t("goTo", { n: h.name }))}">${chevron}</button></li>`).join("") ||
        `<li class="empty">${esc(t("noMatch", { q }))}</li>`;
      return;
    }
    const { lv, items } = visibleList();
    $("listTitle").textContent = t("visible", { lv: t(LV_KEY[lv]), n: items.length });
    listEl.innerHTML = items.slice(0, 400).map((u) => {
      const own = selColor(u.lv, u.id), c = own || u.color;
      return `<li class="item${own ? " painted" : ""}" data-i="${model.units.indexOf(u)}"><span class="box${!own && c ? " inh" : ""}"${c ? ` style="background:${c}"` : ""}></span><span class="nm">${esc(u.name)}${u.lv !== "c" ? `<small>${esc(u.lv === "a2" ? a1Name(u.cc, u.a1) : countryName(u.cc))}</small>` : ""}</span><button class="go" data-zoom="${model.units.indexOf(u)}" aria-label="${esc(t("goTo", { n: u.name }))}">${chevron}</button></li>`;
    }).join("");
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
  async function jumpTo(k) {
    const [lv, a, b] = k.split(":");
    try {
      if (lv === "c") return zoomToGeom(data.byId.get(a));
      if (lv === "a1") return zoomToGeom((await ensureAdm1(a)).byId.get(b));
      const e = await ensureAdm2(a.split("-")[0], a);
      zoomToGeom(e.byId.get(b));
    } catch { toast(t("loadFail")); }
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
    hint(tool === "erase" ? t("hintErase") : tool === "pin" ? t("hintPin") : t("hintColor", { n: tool + 1 }));
  }

  // ---------- 핀 ----------
  let pinSeq = 1;
  function addPin(lon, lat, b) {
    const p = { id: pinSeq++, lon, lat, color: b ? b.color : "#e5484d", size: b ? b.size : 1, border: b ? b.border : true };
    pins.push(p); setActivePin(p);
  }
  function setActivePin(p) {
    activePin = p;
    $("pinPanel").hidden = !p;
    if (p) {
      $("pinSize").value = p.size; $("pinBorder").checked = p.border;
      $("pinColors").querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.c === p.color));
    }
    paintPins();
  }
  function dupPin(p) {
    const xy = projection([p.lon, p.lat]), k = rel().k;
    const ll = projection.invert([xy[0] + 18 / k, xy[1] + 10 / k]);
    addPin(ll[0], ll[1], p);
  }

  // ---------- 내보내기 (지금 보이는 화면 그대로) ----------
  function bboxOf(els) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const el of els) { const b = el.getBBox(); x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height); }
    return isFinite(x0) ? [x0, y0, x1, y1] : null;
  }
  const usedIds = new Map();
  function idOf(name) {
    const b = String(name).replace(/[^\p{L}\p{N}_-]+/gu, "_") || "region";
    const n = (usedIds.get(b) || 0) + 1;
    usedIds.set(b, n);
    return n > 1 ? `${b}_${n}` : b;
  }
  function buildSVG(onlySel) {
    if (zt.k !== baked.k || zt.x !== baked.x || zt.y !== baked.y) render();
    const m = model;
    const units = onlySel ? m.units.filter((u) => u.color) : m.units;
    if (!units.length && !m.ovl.length) return null;
    let vb = [0, 0, m.W, m.H];
    if (onlySel) {
      const els = [...svg.querySelectorAll("#units .unit")].filter((el) => m.units[+el.dataset.i].color).concat([...svg.querySelectorAll("#ovl .ovl")]);
      const b = bboxOf(els);
      if (b) { const pd = 8 + S.strokeW; const x0 = Math.max(0, b[0] - pd), y0 = Math.max(0, b[1] - pd), x1 = Math.min(m.W, b[2] + pd), y1 = Math.min(m.H, b[3] + pd); vb = [Math.floor(x0), Math.floor(y0), Math.ceil(x1 - x0), Math.ceil(y1 - y0)]; }
    }
    const inView = (x, y) => x >= vb[0] && y >= vb[1] && x <= vb[0] + vb[2] && y <= vb[1] + vb[3];
    usedIds.clear();
    let o = `<svg xmlns="http://www.w3.org/2000/svg" width="${vb[2]}" height="${vb[3]}" viewBox="${vb.join(" ")}">\n`;
    if (S.exportBg) o += `<rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="${S.bg}"/>\n`;
    if (!onlySel && m.under.length) o += `<g id="${t("gBase")}">` + m.under.map((u) => `<path d="${u.d}" fill="${u.color || S.fill}"/>`).join("") + `</g>\n`;
    if (units.length) o += `<g id="${t("gRegions")}">` + units.map((u) => `<path id="${idOf(u.name)}" d="${u.d}" ${unitAttrs(u)}/>`).join("") + `</g>\n`;
    if (m.ovl.length) o += `<g id="${t("gPicked")}">` + m.ovl.map((x) => `<path id="${idOf(x.name)}" d="${x.d}" ${ovlAttrs(x)}/>`).join("") + `</g>\n`;
    const mks = m.markers.filter((mk) => tiny(mk, 1) && inView(mk.x, mk.y));
    if (mks.length) o += `<g id="${t("gDots")}">` + mks.map((mk) => markerSVG(mk, mk.x, mk.y)).join("") + `</g>\n`;
    const labels = m.labels.filter((l) => inView(l.x, l.y) && (!onlySel || l.color));
    if (labels.length) o += `<g id="${t("gNames")}">` + labels.map((l) => labelSVG(l, l.x, l.y - (dotted(l.key, 1) ? l.fs : 0))).join("") + `</g>\n`;
    const ps = pins.map((p) => [p, projection([p.lon, p.lat])]).filter(([, xy]) => xy && inView(xy[0], xy[1]));
    if (ps.length) o += `<g id="${t("gPins")}">` + ps.map(([p, xy]) => pinSVG(p, xy)).join("") + `</g>\n`;
    return { svg: o + `</svg>\n`, w: vb[2], h: vb[3] };
  }
  function fileBase(onlySel) {
    const parts = ["map"];
    const crumbs = [...$("crumbs").querySelectorAll("button, .cur, .crumb-txt")].map((x) => x.textContent);
    const hit = crumbs.length > 1 ? crumbs[crumbs.length - 1] : "World";
    parts.push(S.lang === "en" ? hit : "");
    if (onlySel) parts.push("selected");
    return parts.join("_").replace(/[^A-Za-z0-9_-]+/g, "").replace(/_+/g, "_").replace(/_$/, "") || "map";
  }
  function download(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  function exportSVG(onlySel) {
    closePanels();
    const r = buildSVG(onlySel);
    if (!r) return toast(onlySel ? t("noSel") : t("noExport"));
    download(new Blob([r.svg], { type: "image/svg+xml" }), fileBase(onlySel) + ".svg");
    toast(t("svgSaved"));
  }
  function exportPNG(onlySel) {
    closePanels();
    const r = buildSVG(onlySel);
    if (!r) return toast(onlySel ? t("noSel") : t("noExport"));
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
    closePanels();
    const r = buildSVG(false);
    if (!r) return;
    try { await navigator.clipboard.writeText(r.svg); toast(t("copied")); } catch { toast(t("copyBlocked")); }
  }

  // ---------- UI 공통 ----------
  let toastT, hintT;
  function toast(msg) { const el = $("toast"); el.textContent = msg; el.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("show"), 2600); }
  function hint(msg, ms = 2400) { const el = $("hint"); el.textContent = msg; el.classList.add("show"); clearTimeout(hintT); hintT = setTimeout(() => el.classList.remove("show"), ms); }
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
    $("helpBody").innerHTML = t("helpItems").map((x) => `<li>${x}</li>`).join("");
    $("pinColors").innerHTML = PIN_COLORS.map((c) => `<button data-c="${c}" style="background:${c}" aria-label="${t("pinColor", { n: c })}"></button>`).join("");
  }
  function setLang(lang) {
    if (lang === S.lang) return;
    S.lang = lang; save(); applyI18n(); renderTools(); syncControls();
    if (data.world) { render(); renderChips(); }
  }
  function openHelp() { closePanels(); $("helpModal").hidden = false; $("helpOk").focus(); }
  function closeHelp() { $("helpModal").hidden = true; if (!S.seenHelp) { S.seenHelp = true; save(); } }

  // 색 고르기 팝업
  let colorTarget = null;
  const getCV = (k) => (k.startsWith("pal") ? S.palette[+k.slice(3)] : S[k]);
  function setCV(k, c) {
    if (k.startsWith("pal")) { S.palette[+k.slice(3)] = c; renderTools(); renderChips(); }
    else { S[k] = c; S.preset = ""; }
    save(); syncControls(); render();
  }
  function openColor(btn) {
    colorTarget = btn.dataset.cv;
    const cur = (getCV(colorTarget) || "").toLowerCase();
    const sw = (c) => `<button data-c="${c}" style="background:${c}" class="${c === cur ? "on" : ""}" aria-label="${c}"></button>`;
    $("cgrid").innerHTML = PASTELS.map(sw).join("") + `<span class="sep"></span>` + NEUTRALS.map(sw).join("");
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
    $("optAntarctica").checked = S.antarctica; $("optBg").checked = S.exportBg;
  }
  function setOpt(k, v, rerender = true) { S[k] = v; save(); syncControls(); if (rerender) render(); }
  function setTab(which) {
    const list = which === "list";
    $("tabList").setAttribute("aria-selected", String(list)); $("tabStyle").setAttribute("aria-selected", String(!list));
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
    $("strokeW").oninput = (e) => { S.strokeW = +e.target.value; $("strokeOut").textContent = S.strokeW.toFixed(1); paint(); };
    $("strokeW").onchange = save;
    $("presets").onclick = (e) => { const p = e.target.dataset.preset; if (p) { Object.assign(S, PRESETS[p], { preset: p }); save(); syncControls(); render(); } };
    $("labelMode").onclick = (e) => { const v = e.target.dataset.label; if (v) setOpt("labels", v); };
    $("optAntarctica").onchange = (e) => setOpt("antarctica", e.target.checked);
    $("optBg").onchange = (e) => setOpt("exportBg", e.target.checked, false);

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
      S.pick = p; save(); syncControls(); hint(T[S.lang].hintPick[p]);
    };
    $("tools").onclick = (e) => { const b = e.target.closest(".tool"); if (b) setTool(/^\d$/.test(b.dataset.tool) ? +b.dataset.tool : b.dataset.tool); };
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
    $("helpBtn").onclick = openHelp; $("helpM").onclick = openHelp;
    $("helpClose").onclick = closeHelp; $("helpOk").onclick = closeHelp;
    $("helpModal").onclick = (e) => { if (e.target === $("helpModal")) closeHelp(); };

    $("zoomIn").onclick = () => zoomBy(2);
    $("zoomOut").onclick = () => zoomBy(0.5);
    $("zoomFit").onclick = resetZoom;

    $("pinColors").onclick = (e) => { const c = e.target.dataset.c; if (c && activePin) { activePin.color = c; setActivePin(activePin); } };
    $("pinSize").oninput = (e) => { if (activePin) { activePin.size = +e.target.value; paintPins(); } };
    $("pinBorder").onchange = (e) => { if (activePin) { activePin.border = e.target.checked; paintPins(); } };
    $("pinDel").onclick = () => { if (activePin) { pins = pins.filter((p) => p !== activePin); setActivePin(null); } };
    $("pinDup").onclick = () => { if (activePin) dupPin(activePin); };
    $("pinClose").onclick = () => setActivePin(null);

    // 목록: 행 = 칠하기, › = 그곳으로 확대
    listEl.onclick = (e) => {
      const jump = e.target.closest("[data-jump]");
      if (jump) { $("search").value = ""; if (isPhone()) openSheet(false); return jumpTo(jump.dataset.jump); }
      const z = e.target.closest("[data-zoom]");
      if (z) { if (isPhone()) openSheet(false); return zoomToGeom(model.units[+z.dataset.zoom].geom); }
      const it = e.target.closest("[data-i]");
      if (!it) return;
      const u = model.units[+it.dataset.i];
      const tool = S.tool;
      if (tool === "pin") S.tool = lastColor;
      toggleSel({ lv: u.lv, id: u.id, cc: u.cc, a1: u.a1, name: u.name });
      S.tool = tool;
    };
    let searchT = 0;
    $("search").oninput = () => { clearTimeout(searchT); searchT = setTimeout(renderList, 120); };
    $("search").onkeydown = (e) => { if (e.key === "Enter") { const first = listEl.querySelector("[data-jump]"); if (first) first.click(); } };
    $("selAll").onclick = () => {
      for (const u of visibleList().items) sel.set(skey(u.lv, u.id), { lv: u.lv, id: u.id, cc: u.cc, a1: u.a1 || null, name: u.name, ci: lastColor });
      save(); render(); renderChips();
    };
    $("pickedClear").onclick = () => { sel.clear(); save(); render(); renderChips(); };
    $("chips").onclick = (e) => {
      const rm = e.target.closest("[data-rm]");
      if (rm) { sel.delete(rm.dataset.rm); save(); render(); renderChips(); return; }
      const g = e.target.closest("[data-k]");
      if (!g || !sel.has(g.dataset.k)) return;
      const s = sel.get(g.dataset.k);
      if (isPhone()) openSheet(false);
      zoomToGeom(selGeom(s, S.detail) || data.byId.get(s.cc));
    };
    $("sheetBar").onclick = (e) => { if (!isPhone() || e.target.closest(".crumbs button")) return; openSheet(!$("side").classList.contains("open")); };

    // 지도: 드래그=이동, 휠/핀치=확대, 누르기=선택, 길게 누르기/Shift+클릭=보이는 단위 그대로 선택
    d3.select(svg).call(zoom).on("dblclick.zoom", null);
    let drag = null, press = null, suppressClick = false;
    const pt = (e) => { const r = svg.getBoundingClientRect(); return rel().invert([(e.clientX - r.left) * (model.W / r.width), (e.clientY - r.top) * (model.H / r.height)]); };
    svg.addEventListener("pointerdown", (e) => {
      const pg = e.target.closest(".pin");
      if (pg) {
        setActivePin(pins.find((x) => x.id === +pg.dataset.pin));
        drag = { p: activePin };
        svg.setPointerCapture(e.pointerId);
        e.preventDefault(); e.stopPropagation();
        return;
      }
      const u = e.target.closest(".unit");
      if (u && S.tool !== "pin") {
        press = { x: e.clientX, y: e.clientY, t: setTimeout(() => {
          press = null; suppressClick = true;
          selectUnit(model.units[+u.dataset.i], true);
          if (navigator.vibrate) navigator.vibrate(15);
        }, 550) };
      }
    });
    svg.addEventListener("pointermove", (e) => {
      if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 8) { clearTimeout(press.t); press = null; }
      if (drag) { const ll = projection.invert(pt(e)); if (ll) { drag.p.lon = ll[0]; drag.p.lat = ll[1]; paintPins(); } }
    });
    const endPress = () => { if (press) { clearTimeout(press.t); press = null; } drag = null; };
    svg.addEventListener("pointerup", endPress);
    svg.addEventListener("pointercancel", endPress);
    svg.addEventListener("contextmenu", (e) => e.preventDefault());
    svg.addEventListener("click", (e) => {
      if (suppressClick) { suppressClick = false; return; }
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
      const u = e.target.closest(".unit");
      if (u) selectUnit(model.units[+u.dataset.i], e.shiftKey || e.altKey);
    });

    document.addEventListener("keydown", (e) => {
      if (e.target.matches("input, textarea")) return;
      const mod = e.ctrlKey || e.metaKey;
      if (e.key === "Escape") { if (!$("helpModal").hidden) return closeHelp(); if (S.tool === "pin") setTool(toolBeforePin); setActivePin(null); closePanels(); closeColor(); }
      else if (mod && e.key.toLowerCase() === "c" && activePin) { pinClipboard = { ...activePin }; toast(t("pinCopied")); e.preventDefault(); }
      else if (mod && e.key.toLowerCase() === "v" && pinClipboard) { dupPin(pinClipboard); pinClipboard = { ...activePin }; e.preventDefault(); }
      else if ((e.key === "Delete" || e.key === "Backspace") && activePin) { pins = pins.filter((p) => p !== activePin); setActivePin(null); e.preventDefault(); }
      else if (!mod && /^[1-5]$/.test(e.key)) setTool(+e.key - 1);
      else if (!mod && e.key.toLowerCase() === "e") setTool("erase");
      else if (!mod && e.key.toLowerCase() === "p") setTool("pin");
      else if (!mod && (e.key === "+" || e.key === "=")) zoomBy(2);
      else if (!mod && e.key === "-") zoomBy(0.5);
      else if (!mod && e.key === "0") resetZoom();
      else if (!mod && e.key === "?") openHelp();
    });
    new ResizeObserver(schedule).observe(stage);
  }

  // ---------- 시작 ----------
  async function init() {
    applyI18n(); syncControls(); renderTools(); bind();
    $("loading").hidden = false;
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
    await Promise.all([...sel.values()].map(async (s) => {
      try { if (s.lv !== "c") await ensureAdm1(s.cc); if (s.lv === "a2") await ensureAdm2(s.cc, s.a1); } catch { /* 계속 */ }
    }));
    $("loading").hidden = true;
    render();
    // 마지막으로 보던 위치 복원
    if (Array.isArray(S.zoom) && S.zoom.length === 3) d3.select(svg).call(zoom.transform, d3.zoomIdentity.translate(S.zoom[0], S.zoom[1]).scale(S.zoom[2]));
    renderChips();
    if (!S.seenHelp) openHelp();
  }
  init();
})();
