# 지도추출기 World

대륙 › 국가 › 도·주 단위로 세계지도를 골라 **SVG / PNG**로 내려받아 PPT에 바로 넣는 웹앱입니다. PC와 모바일 모두 지원합니다(화면 크기에 따라 자동 전환).

## 기능
- **단계별 좁히기**: 지도를 누르면 확대되며 세계 → 대륙 → 국가 → 도·주 → 시·군·구 순서로 들어감. 마지막 단계에서 누르면 선택
- **어느 단계에서든 선택**: 목록 행 클릭, PC는 Shift+클릭, 폰은 길게 누르기
- **멀티 선택**: 선택은 단계와 무관하게 유지되어 줌아웃해도 함께 보임(작으면 색 점으로 표시). 선택 목록 칩에서 이동·해제. 브라우저에 자동 저장
- 5가지 색 팔레트(색 변경 가능) + 지우개, 핀(드래그·색·크기·복제)
- 확대·이동(휠/핀치/버튼), 상위 단계 버튼(↑), 끝단 둥글/각, 디테일 정밀/보통/단순
- 내보내기: SVG(전체/칠한 곳만), 고해상도 PNG, SVG 코드 복사
- 단축키: 1~5 색, E 지우개, P 핀, U 상위 단계, Esc 취소

### 시·군·구 단위 지원 국가 (21개국)
오스트리아, 벨기에, 스위스, 중국, 체코, 독일, 스페인, 프랑스, 헝가리, 인도, 일본, 한국, 멕시코, 네덜란드, 폴란드, 포르투갈, 루마니아, 슬로바키아, 스웨덴, 튀르키예, 미국.
영국·이탈리아·슬로베니아 등은 도·주 데이터가 이미 시/카운티 수준이라 그 단계에서 바로 선택합니다.
한국 외 국가의 시 이름은 현지/영문 표기입니다.

## PPT에서 쓰는 법
1. SVG 다운로드
2. PowerPoint: 삽입 › 그림 › 파일 선택
3. 그림 우클릭 › **도형으로 변환** → **그룹 해제** → 지역별 도형으로 분리됨
   (Microsoft 365 / PowerPoint 2019 이상)

## 구조
```
docs/            웹앱 (GitHub Pages 배포 폴더)
  index.html, style.css, app.js
  vendor/        d3, topojson-client, topojson-simplify
  data/world.json         국가 경계 (TopoJSON)
  data/adm1/<ISO3>.json   국가별 도·주 경계
tools/build-data.sh       Natural Earth → TopoJSON 가공 스크립트
tools/build-cities.mjs    시·군·구 데이터 가공(도·주별 분할)
  data/adm2/<ISO3>/<도·주 id>.json  시·군·구 경계
```

## 배포 (GitHub Pages)
저장소 Settings › Pages › Source: *Deploy from a branch* › Branch: `main` / 폴더: `/docs` 선택 후 저장.

## 로컬 실행
```
cd docs && python3 -m http.server 8000
```

## 데이터
- [Natural Earth](https://www.naturalearthdata.com/) 1:10m (Public Domain): 국가(한국 시점 POV)·도·주
- [geoBoundaries](https://www.geoboundaries.org/) gbOpen (CC BY 4.0): 시·군·구
- 한국 시군구: 통계청 SGIS 행정동 경계(공공누리 제1유형) 가공본 [vuski/admdongkor](https://github.com/vuski/admdongkor) (CC BY 4.0), 2025.07 행정동을 시군구로 병합
- 데이터 재생성: `bash tools/build-data.sh` 후 `(cd tools && npm i) && node tools/build-cities.mjs`
