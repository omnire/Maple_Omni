// main.js - 옴니 프로그램의 두뇌 역할을 하는 메인 실행 파일입니다.

// 프로그램 창을 띄우기 위해 일렉트론(Electron)에서 필요한 기능들을 불러옵니다.
const { app, BrowserWindow } = require('electron');

// 컴퓨터 내의 파일 경로를 오류 없이 정확하게 연결해 주는 컴퓨터 내장 모듈을 불러옵니다.
const path = require('path');

function createWindow() {
  // 사용자의 컴퓨터 화면에 보여줄 새로운 프로그램 창을 생성합니다.
  const win = new BrowserWindow({
    // ⭐ [여기서 창 크기를 마음대로 조절하세요!]
    width: 2000,  // 프로그램 창의 처음 '가로' 크기 (원하는 숫자로 자유롭게 변경 가능)
    height: 1500,  // 프로그램 창의 처음 '세로' 크기 (원하는 숫자로 자유롭게 변경 가능)
    
    webPreferences: {
      // 기존 옴니 웹 스크립트가 앱 환경과 충돌하여 흰 화면이 뜨는 것을 완벽하게 방지하기 위해 
      // 설정을 일반 크롬 브라우저와 동일한 안전한 상태로 맞춤 정렬합니다.
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // 캡처 화면에 나왔던 보기 싫은 상단 기본 메뉴바(File, Edit, View 등)를 완전히 제거합니다.
  win.setMenu(null);

  // 웹용 캐싱 엔진(sw.js)이 작동하여 로컬 CSS 파일들을 404로 가로채는 현상을 원천 봉쇄합니다.
  win.webContents.session.webRequest.onBeforeRequest({ urls: ['*://*/*', 'file://*/*'] }, (details, callback) => {
    // 불러오려는 대상 파일의 주소가 'sw.js'로 끝나면 캐싱 엔진의 구동 파일이므로 차단 처리를 집행합니다.
    if (details.url.endsWith('sw.js')) {
      callback({ cancel: true }); // 서비스 워커 실행 차단!
    } else {
      callback({ cancel: false }); // 일반 CSS, JS 파일들은 정상적으로 통과시켜 정상 로드되게 합니다.
    }
  });

  // 💡 [핵심 패치] 로그인 정보(API 키)가 들어있는 저장소는 보존하고, 방해되는 서비스 워커와 캐시만 골라서 청소합니다.
  win.webContents.session.clearStorageData({
    storages: ['serviceworkers', 'cachestorage'] // API 키가 저장되는 'localstorage'는 빼고 청소하도록 범위를 지정했습니다.
  }).then(() => {
    // 청소가 완료되면 메인 폴더 상단에 있는 index.html 파일을 안전하게 불러옵니다.
    win.loadFile(path.join(__dirname, 'index.html'));
  });

  // 💡 [개발자 도구 미표시 패치 완료]
  // 프로그램이 켜질 때 우측에 복잡하게 같이 켜지던 코드 진단 창(openDevTools) 명령어를 완전히 삭제했습니다.
  // 이제 옴니 프로그램이 켜질 때 오직 옴니 홈페이지 화면만 깨끗하고 쾌적하게 열립니다.
}

// 일렉트론 엔진이 컴퓨터 내부에서 구동될 준비를 끝마치면, 위의 createWindow 함수를 실행하여 창을 켭니다.
app.whenReady().then(createWindow);

// 사용자가 프로그램 창을 완전히 다 닫았을 때, 컴퓨터 백그라운드에서도 프로그램이 안전하게 종료되도록 처리합니다.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});