# 지도추출기 World

대륙 › 국가 › 도·주 단위로 세계지도를 골라 **SVG / PNG**로 내려받아 PPT에 바로 넣는 웹앱입니다. PC와 모바일 모두 지원합니다(화면 크기에 따라 자동 전환).

## 기능
- 계층 탐색: 전세계 → 대륙 → 국가 → 도·주 (시 단위는 2차 예정)
- 세계지도 선택 단위 전환: 대륙 / 국가
- 칠하기 도구: 5가지 색 팔레트(색 변경 가능) + 지우개. 누르면 칠하고 다시 누르면 지움
- 탐색 도구(✋): 지역을 눌러 들어가기, 주변 국가로 이동. PC는 더블클릭으로도 들어감
- 확대·이동: 휠/핀치 줌, 드래그 이동, +/−/전체 보기 버튼. 목록에서 고른 작은 나라는 자동 확대
- 끝단 모양(둥글/각), 디테일 정밀/보통/단순 + 세부 슬라이더
- 핀: 꽂기(한 번 꽂으면 도구 자동 해제), 드래그, 색/크기/테두리, Ctrl+C/V 복제, Delete 삭제
- 단축키: 1~5 색, E 지우개, H 탐색, P 핀, Esc 취소
- 내보내기: SVG(전체/칠한 곳만), 고해상도 PNG, SVG 코드 복사
- 모바일: 한 줄 도구막대 + 하단 시트(목록/스타일 탭)

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
