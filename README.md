# AISIS Mobile Web

가계부 앱과 같은 방식의 모바일 웹앱입니다. 정적 파일은 GitHub Pages에 올리고, 입력 정보와 최근 분석 캐시는 Google Apps Script가 Google Drive의 `aisis-mobile-state.json`에 저장합니다.

## 파일 역할

- `index.html`, `styles.css`, `app.js`: 핸드폰에서 바로 여는 웹앱
- `manifest.webmanifest`, `sw.js`, `app-icon.svg`: 홈 화면 설치용 PWA 파일
- `google-drive-sync.gs`: Google Drive 저장과 현재가/분석 API를 담당하는 Apps Script

## 배포 순서

1. GitHub private repository에 `mobile_web` 폴더를 올립니다.
2. GitHub Pages의 publishing source를 `mobile_web` 폴더로 지정합니다.
3. <https://script.google.com/> 에서 새 Apps Script 프로젝트를 만듭니다.
4. `google-drive-sync.gs` 내용을 붙여 넣습니다.
5. `SYNC_TOKEN`을 긴 비밀번호로 바꿉니다.
6. 필요하면 Drive 폴더 ID를 `FOLDER_ID`에 입력합니다. 비워두면 내 드라이브 최상위에 저장됩니다.
7. Deploy > New deployment > Web app으로 배포합니다.
8. Execute as는 `Me`, access는 `Anyone with the link`로 둡니다.
9. 핸드폰에서 GitHub Pages 주소를 열고, 설정 탭에 Apps Script URL과 비밀번호를 입력합니다.

## 저장되는 정보

- 매수/매도 이력
- 관심종목
- 최근 종목 분석 캐시
- 코스피 점수 후보 캐시

동기화 URL과 비밀번호는 기기 localStorage에만 저장되고 Drive JSON에는 저장되지 않습니다.
