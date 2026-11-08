# 지도추출기 World

대륙 › 국가 › 도·주 단위로 세계지도를 골라 **SVG / PNG**로 내려받아 PPT에 바로 넣는 웹앱입니다. PC와 모바일 모두 지원합니다(화면 크기에 따라 자동 전환).

## 기능 (1차)
- 계층 탐색: 전세계 → 대륙 → 국가 → 도·주 (시 단위는 2차 예정)
- 지역 선택·강조, 검색(한글/영문), 전체선택/해제
- 끝단 모양(둥글/각), 디테일(단순화) 슬라이더. 이웃 지역 경계가 어긋나지 않는 토폴로지 기반 단순화
- 핀 추가·드래그·색/크기/테두리, Ctrl+C / Ctrl+V 복제, Delete 삭제
- 스타일 프리셋(다크/라이트/모노) + 색상 직접 지정, 이름 표시, 주변국 표시, 해외 영토 포함 여부
- 내보내기: SVG(전체/선택만), 고해상도 PNG, SVG 코드 복사

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
```

## 배포 (GitHub Pages)
저장소 Settings › Pages › Source: *Deploy from a branch* › Branch: `main` / 폴더: `/docs` 선택 후 저장.

## 로컬 실행
```
cd docs && python3 -m http.server 8000
```

## 데이터
- [Natural Earth](https://www.naturalearthdata.com/) 1:10m (Public Domain). 국가 경계는 한국 시점(POV) 버전 사용.
- 데이터 재생성: `bash tools/build-data.sh`
