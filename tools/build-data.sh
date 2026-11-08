#!/usr/bin/env bash
# Natural Earth 데이터를 받아 앱용 TopoJSON으로 가공한다.
# 사용법: bash tools/build-data.sh   (mapshaper 필요: npx 로 자동 실행)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="${WORK:-$ROOT/.build}"
OUT="$ROOT/docs/data"
NE=https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson
MS="npx --yes mapshaper@0.6"
mkdir -p "$WORK" "$OUT/adm1"

# 국가: 한국 시점(POV) 버전 사용
[ -f "$WORK/adm0.geojson" ] || curl -sSfL -o "$WORK/adm0.geojson" "$NE/ne_10m_admin_0_countries_kor.geojson"
[ -f "$WORK/adm1.geojson" ] || curl -sSfL -o "$WORK/adm1.geojson" "$NE/ne_10m_admin_1_states_provinces.geojson"

# 대륙 코드: AS EU AF NA SA OC AN. 'Seven seas' 섬들은 UN 지역으로 배정
$MS "$WORK/adm0.geojson" name=countries \
  -each 'id=ADM0_A3; ko=NAME_KO||NAME; en=NAME_EN||NAME; var c=CONTINENT; if(c=="Seven seas (open ocean)"){c={"Africa":"Africa","Asia":"Asia","Americas":"South America","Oceania":"Oceania","Europe":"Europe"}[REGION_UN]||"Africa"}; ct={"Asia":"AS","Europe":"EU","Africa":"AF","North America":"NA","South America":"SA","Oceania":"OC","Antarctica":"AN"}[c]' \
  -filter-fields id,ko,en,ct \
  -simplify 25% keep-shapes \
  -o format=topojson quantization=100000 "$OUT/world.json" force

# 1차 행정구역(도·주): 국가별 파일로 분리
$MS "$WORK/adm1.geojson" name=regions \
  -each 'id=adm1_code; ko=name_ko||name; en=name_en||name; t=type||type_en||""; cc=({CYN:"CYP",KAB:"KAZ",SOL:"SOM"})[adm0_a3]||adm0_a3' \
  -filter-fields id,ko,en,t,cc \
  -simplify 35% keep-shapes \
  -filter 'cc!="KAS"' \
  -split cc \
  -o format=topojson quantization=100000 singles "$OUT/adm1/" force

# 국가별 도·주 파일 목록(앱에서 드릴다운 가능 여부 판단용)
ls "$OUT/adm1" | sed 's/\.json$//' | sort | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{process.stdout.write(JSON.stringify(s.trim().split("\n")))})' > "$OUT/adm1-index.json"
echo "done: $(ls "$OUT/adm1" | wc -l) countries"; du -sh "$OUT/world.json" "$OUT/adm1"
