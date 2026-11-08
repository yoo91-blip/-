// 시 단위 경계를 받아 Natural Earth 도·주에 공간 결합한 뒤
// docs/data/adm2/<ISO3>/<도·주 id>.json (TopoJSON)으로 나눠 저장한다.
//  - 대부분: geoBoundaries gbOpen (CC BY 4.0) 원본 해상도
//  - 한국: vuski/admdongkor 행정동(2025.7)을 시군구로 합쳐 한글 이름 사용
// 사용법: (cd tools && npm i) && node tools/build-cities.mjs [ISO3 ...]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const d3 = require("d3-geo");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORK = path.join(ROOT, ".build", "gb");
const OUT = path.join(ROOT, "docs", "data", "adm2");
const NE_ADM1 = path.join(ROOT, ".build", "adm1.geojson");
const GB = "https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/main/releaseData/gbOpen";
const KR_DONG = "https://raw.githubusercontent.com/vuski/admdongkor/master/ver20250701/HangJeongDong_ver20250701.geojson";
const MS = ["--yes", "mapshaper@0.6"];

// 국가별로 '시' 에 해당하는 행정 단계
export const LEVELS = {
  AUT: 2, BEL: 3, CHE: 2, CHN: 2, CZE: 2, DEU: 3, ESP: 3, FRA: 3, HUN: 2, IND: 2, JPN: 2,
  KOR: 2, MEX: 2, NLD: 2, POL: 2, PRT: 2, ROU: 2, SVK: 2, SWE: 2, TUR: 2, USA: 2,
};
// 원본이 너무 큰 나라는 geoBoundaries 단순화본 사용
const USE_SIMPLIFIED = new Set(["ESP", "IND", "ROU", "MEX"]);
const INTERVAL_M = 80; // 단순화 허용 오차(미터)

const only = process.argv.slice(2);
const countries = Object.keys(LEVELS).filter((c) => !only.length || only.includes(c));
fs.mkdirSync(WORK, { recursive: true });

const readJSON = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
function fetchTo(url, file) {
  if (fs.existsSync(file) && fs.statSync(file).size > 1000) return;
  execFileSync("curl", ["-sSfL", "-m", "900", "-o", file, url], { stdio: "inherit" });
}
const mapshaper = (args) => execFileSync("npx", [...MS, ...args], { stdio: ["ignore", "ignore", "inherit"] });

// d3는 시계 방향 외곽선을 기대하므로 GeoJSON(반시계) 방향을 맞춘다
function rewind(g) {
  if (!g) return g;
  const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
  for (const poly of polys) poly.forEach((ring, i) => {
    const big = d3.geoArea({ type: "Polygon", coordinates: [ring] }) > 2 * Math.PI;
    if ((i === 0) === big) ring.reverse();
  });
  return g;
}
// 도형 안의 격자 표본점
function samplePoints(geom, n) {
  const [[w, s], [e, n2]] = d3.geoBounds(geom);
  const E = e < w ? e + 360 : e;
  const k = Math.ceil(Math.sqrt(n * 2));
  const out = [];
  for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) {
    let x = w + ((i + 0.5) / k) * (E - w); if (x > 180) x -= 360;
    const y = s + ((j + 0.5) / k) * (n2 - s);
    if (d3.geoContains(geom, [x, y])) out.push([x, y]);
  }
  if (!out.length) out.push(d3.geoCentroid(geom));
  return out;
}
const overlaps = (a, b) => !(a[0][1] > b[1][1] + 0.2 || a[1][1] < b[0][1] - 0.2);
function vote(geom, cands, n) {
  const votes = new Map();
  for (const q of samplePoints(geom, n)) {
    const a = cands.find((a) => d3.geoContains(a.geom, q));
    if (a) votes.set(a, (votes.get(a) || 0) + 1);
  }
  let best = null, bv = 0;
  for (const [a, v] of votes) if (v > bv) { bv = v; best = a; }
  if (!best) {
    const c = d3.geoCentroid(geom);
    let bd = Infinity;
    for (const a of cands) { const d = d3.geoDistance(c, a.c); if (d < bd) { bd = d; best = a; } }
  }
  return best;
}

// 한국: 행정동 → 시군구(일반구는 시로 합침), 시도
function prepareKorea() {
  const src = path.join(WORK, "kr-dong.geojson");
  fetchTo(KR_DONG, src);
  const l2 = path.join(WORK, "KOR-2.src.geojson"), l1 = path.join(WORK, "KOR-1.src.geojson");
  if (!fs.existsSync(l2)) mapshaper([src, "-each", 'shapeID=sgg.slice(0,4)+"0"; var m=sggnm.replace(/ /g,"").match(/^(.+?시)(.+구)$/); shapeName=m?m[1]:sggnm',
    "-dissolve", "shapeID", "copy-fields=shapeName", "-o", "format=geojson", l2]);
  if (!fs.existsSync(l1)) mapshaper([src, "-each", "shapeID=sido; shapeName=sidonm",
    "-dissolve", "shapeID", "copy-fields=shapeName", "-o", "format=geojson", l1]);
  return { l2, l1 };
}

const krNorm = (s) => { const t = String(s || "").replace(/(특별자치도|특별자치시|특별시|광역시|도)$/, ""); return { 전북: "전라북", 강원: "강원" }[t] || t; };

console.log("Natural Earth 도·주 읽는 중…");
const remap = { CYN: "CYP", KAB: "KAZ", SOL: "SOM" };
const neBy = new Map();
for (const f of readJSON(NE_ADM1).features) {
  const cc = remap[f.properties.adm0_a3] || f.properties.adm0_a3;
  if (!neBy.has(cc)) neBy.set(cc, []);
  rewind(f.geometry);
  neBy.get(cc).push({ ko: f.properties.name_ko, id: f.properties.adm1_code, geom: f.geometry, c: d3.geoCentroid(f.geometry), b: d3.geoBounds(f.geometry) });
}

const idxFile = path.join(ROOT, "docs/data/adm2-index.json");
const index = fs.existsSync(idxFile) ? readJSON(idxFile) : {};

for (const cc of countries) {
  const lvl = LEVELS[cc];
  let srcL, srcP;
  if (cc === "KOR") ({ l2: srcL, l1: srcP } = prepareKorea());
  else {
    const simplified = USE_SIMPLIFIED.has(cc);
    srcL = path.join(WORK, `${cc}-${lvl}${simplified ? "" : ".full"}.geojson`);
    srcP = path.join(WORK, `${cc}-${lvl - 1}.geojson`);
    console.log(`[${cc}] ADM${lvl}${simplified ? " (단순화본)" : ""} 받는 중…`);
    fetchTo(`${GB}/${cc}/ADM${lvl}/geoBoundaries-${cc}-ADM${lvl}${simplified ? "_simplified" : ""}.geojson`, srcL);
    fetchTo(`${GB}/${cc}/ADM${lvl - 1}/geoBoundaries-${cc}-ADM${lvl - 1}_simplified.geojson`, srcP);
  }

  // 1) 먼저 단순화(이웃 경계 유지)
  const simp = path.join(WORK, `${cc}-simp.geojson`);
  mapshaper([srcL, "-simplify", `interval=${INTERVAL_M}`, "keep-shapes", "-o", "format=geojson", "precision=0.00001", simp]);

  // 2) 같은 출처의 상위 경계를 Natural Earth 도·주에 투표로 대응
  const neParents = neBy.get(cc) || [];
  const parents = [];
  for (const pf of readJSON(srcP).features) {
    if (!pf.geometry) continue;
    rewind(pf.geometry);
    const b = d3.geoBounds(pf.geometry);
    const near = neParents.filter((a) => overlaps(a.b, b));
    // 한국은 시도 이름으로 정확히 대응 (광역시 경계가 거칠어 투표가 빗나감)
    const byName = cc === "KOR" ? neParents.find((a) => krNorm(a.ko) === krNorm(pf.properties.shapeName)) : null;
    const ne = byName || vote(pf.geometry, near.length ? near : neParents, 120);
    if (ne) parents.push({ id: ne.id, geom: pf.geometry, c: d3.geoCentroid(pf.geometry), b });
  }

  // 3) 시 → 상위 경계(정확히 포개짐) → 도·주
  const out = [];
  readJSON(simp).features.forEach((f, i) => {
    if (!f.geometry) return;
    rewind(f.geometry);
    const b = d3.geoBounds(f.geometry);
    const cands = parents.filter((a) => overlaps(a.b, b));
    const p = vote(f.geometry, cands.length ? cands : parents, 36);
    if (!p) return;
    const name = f.properties.shapeName || `#${i}`;
    out.push({ type: "Feature", properties: { id: `${cc}-${f.properties.shapeID || i}`, ko: name, en: name, p: p.id }, geometry: f.geometry });
  });
  console.log(`  ${cc}: ${out.length}개`);

  const joined = path.join(WORK, `${cc}-joined.geojson`);
  fs.writeFileSync(joined, JSON.stringify({ type: "FeatureCollection", features: out }));
  const dir = path.join(OUT, cc);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  mapshaper([joined, "name=cities", "-split", "p", "-o", "format=topojson", "quantization=200000", "singles", dir + "/"]);
  index[cc] = fs.readdirSync(dir).map((f) => f.replace(/\.json$/, "")).sort();
  fs.writeFileSync(idxFile, JSON.stringify(index));
}
console.log("완료:", Object.keys(index).length, "개국");
