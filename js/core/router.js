/**
 * ============================================================================
 * 🧭 MAPLE OMNI V15 - js/core/router.js [SPA 강제 제어 엔진 - 안정성 강화판]
 * 설명: 인라인 display 스타일 제어 시 !important 플래그를 결착하여 외부 스타일시트와의
 * 우선순위 충돌로 인한 화면 전환 오류(깜빡임/미노출)를 원천 차단합니다.
 * 패치노트: 
 * - 서브 탭 라우팅 인터페이스(switchHuntTab)를 내장하여 사냥기록지 빈 화면 현상을 원천 차단합니다.
 * - 재로그인(키 파기) 프로세스 실행 시 스토리지 멸균 소거 후 물리 리다이렉션을 집행하여 크래시를 방어합니다.
 * 규칙: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 달아줍니다.
 * ============================================================================
 */

/**
 * 💡 [초보자 가이드] 사용자가 네비게이션 메뉴를 누를 때 목적지 ID를 받아 화면을 물리적으로 교체하는 핵심 라우터 커널입니다.
 */
window.omniSwitchPage = function(pageId) {
    // 1. 모든 메인 콘텐츠 뷰포트 영역의 active 클래스를 제거하고 display 속성을 강제 잠금 처리합니다.
    document.querySelectorAll('.page-section').forEach(page => {
        page.classList.remove('active');
        // 💡 외부 스타일시트의 !important 제어권을 이기기 위해 인라인으로 display none !important를 직접 주입합니다.
        page.style.setProperty('display', 'none', 'important');
    });

    // 2. 사용자가 요청한 타겟 페이지 엘리먼트가 실제로 존재하는지 먼저 확인합니다.
    const targetPage = document.getElementById(pageId);

    // 🛡️ 존재하지 않는 잘못된 pageId가 들어와 화면 전체가 백지가 되는 다운 현상을 차단하기 위한 예외 방어선
    if (!targetPage) {
        console.warn(`[ROUTER WARNING] 요청하신 페이지 ID(${pageId})를 찾을 수 없어 화면 전환을 취소했습니다.`);
        return;
    }

    // 3. 타겟 페이지 레이어만 활성화 선언 및 잠금 해제합니다.
    targetPage.classList.add('active');
    // 💡 최우선순위로 화면에 노출되도록 display block !important를 부여합니다.
    targetPage.style.setProperty('display', 'block', 'important');

    // 💡 [버그 패치] 렌더링 함수 실행 시 예기치 않은 오류가 발생해도 라우터가 멈추지 않도록 예외 처리를 추가합니다.
    if (pageId === 'page-hunt') {
        // 사냥 페이지 진입 시 로컬 스토리지에 백업된 마지막 하부 탭 브랜치(기본값: overview)를 안전하게 추적하여 띄웁니다.
        const savedSubTab = localStorage.getItem('omni_current_hunt_sub_tab') || 'overview';
        setTimeout(() => {
            if (typeof window.switchHuntTab === 'function') {
                window.switchHuntTab(savedSubTab);
            }
        }, 10);
    } else if (pageId === 'page-scanner' && typeof window.initOmniScanner === 'function') {
        try { window.initOmniScanner(); } catch(e) { console.error("스캐너 페이지 렌더링 오류:", e); }
    } else if (pageId === 'page-builder' && typeof window.initOmniBuilderTab === 'function') {
        try { window.initOmniBuilderTab(); } catch(e) { console.error("빌더 페이지 렌더링 오류:", e); }
    }

    // 4. 네비게이션 상단 탑 메뉴 버튼들의 액티브 가이드를 동기화합니다.
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const btnMap = {
        'page-dashboard': 'nav-btn-dashboard',
        'page-todo': 'nav-btn-todo',
        'page-search': 'nav-btn-search',
        'page-scanner': 'nav-btn-scanner',
        'page-builder': 'nav-btn-builder',
        'page-hunt': 'nav-btn-hunt',
        'page-mvp': 'nav-btn-mvp',
        'page-boss': 'nav-btn-boss'
    };

    const targetBtnId = btnMap[pageId];
    const targetBtn = document.getElementById(targetBtnId);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }

    // 5. [영구 보존] 현재 페이지 상태를 로컬 스토리지에 기록하여 새로고침 시에도 마지막 위치를 기억하게 합니다.
    localStorage.setItem('omni_current_page', pageId);
    console.log("SPA 관제 콘솔 인프라 라우팅 목적지 도달 완료: ", pageId);
};

/**
 * 💡 [초보자 가이드] 사냥 서브 탭(종합현황, 기록하기, 지출기록 등)을 스위칭하는 통합 관제 서브 라우터입니다.
 * 각 서브 섹션의 display 속성을 !important 플래그와 함께 강제 제어하여 빈 화면 오류를 원천 복구합니다.
 */
window.switchHuntTab = function(tabId) {
    const sections = ['overview', 'record', 'expense', 'history', 'analysis'];
    
    // 1. 모든 사냥 하위 섹션을 완전히 숨겨서 레이아웃이 겹치거나 꼬이지 않게 클렌징합니다.
    sections.forEach(s => {
        const el = document.getElementById(`hunt-${s}`);
        if (el) {
            el.style.setProperty('display', 'none', 'important');
            el.classList.remove('active');
        }
    });
    
    // 2. 선택한 특정 서브 탭 레이어만 최우선 가시성(block !important)을 주어 화면에 띄웁니다.
    const targetEl = document.getElementById(`hunt-${tabId}`);
    if (targetEl) {
        targetEl.style.setProperty('display', 'block', 'important');
        targetEl.classList.add('active');
    }
    
    // 3. ✍️ [핵심 트리거] '사냥 기록하기' 탭이 활성화될 때 마스터 렌더러 함수를 강제 즉시 실행시킵니다.
    if (tabId === 'record' && typeof window.renderRecordPage === 'function') {
        try {
            window.renderRecordPage();
        } catch (err) {
            console.error("사냥 기록지 동적 컴파일 실패 가드 가동:", err);
        }
    }
    
    // 4. 하부 서브 탭 버튼들의 시각적 포커스(active 클래스) 상태를 동기화 제어합니다.
    const tabButtons = document.querySelectorAll('.sub-tab-menu .tab-btn');
    tabButtons.forEach(btn => {
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${tabId}'`)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // 5. 현재 선택한 서브 탭의 앵커 상태를 캐싱하여 안정성을 보장합니다.
    localStorage.setItem('omni_current_hunt_sub_tab', tabId);
    console.log(`[HUNT SUB-ROUTER] 서브 시스템 네비게이션 제어 완료: hunt-${tabId}`);
};

/**
 * 💡 [초보자 가이드] 사용자가 대시보드나 탑바에서 '재로그인(키 파기)' 버튼을 눌렀을 때 작동하는 만능 강제 탈출 커널입니다.
 */
window.omniLogoutToIntro = function() {
    try {
        console.warn("🚪 [시큐리티 관제센터] 유저 요청에 의한 API 토큰 분쇄 및 세션 초기화 집행");

        // 1. 브라우저 내부의 모든 로그인 세션 정보, API Key, 캐시 버퍼를 완전히 멸균 소거합니다.
        localStorage.removeItem('nexon_api_key');
        localStorage.removeItem('omni_api_key');
        localStorage.removeItem('omni_last_active_search_data');
        localStorage.removeItem('omni_last_refresh_time');
        localStorage.setItem('omni_current_page', 'page-dashboard'); // 라우터 기본값 원복
        
        // 2. 세션 플래그까지 완벽하게 파기하여 인트로 스킵 가드를 원천 무력화합니다.
        sessionStorage.removeItem('omni_session_active');
        window.NEXON_API_KEY = "";

        // 3. [물리 가드 리다이렉션] 브라우저 주소창을 루트 페이지로 새로고침 이동시켜 안전하게 인트로 오버레이를 유도합니다.
        const targetCleanUri = window.location.origin + window.location.pathname;
        window.location.href = targetCleanUri;

    } catch (err) {
        console.error("🚨 로그아웃 엔진 크래시 방어선 가동:", err);
        window.location.reload();
    }
};

/**
 * 💡 [초보자 가이드] 브라우저가 첫 DOM 트리를 완성하는 즉시 스토리지에 백업된 마지막 페이지 상태를 역산하여 복원합니다.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 만약 API 키 정보가 로컬 스토리지에 아예 없다면 라우팅 복구를 차단하여 인트로 화면을 확보합니다.
    if (!localStorage.getItem('nexon_api_key')) {
        console.log("[ROUTER INFO] 인증 토큰 부재로 자동 라우팅 복구를 홀딩합니다.");
        return;
    }

    // 💡 [안정화 패치] 모든 스크립트와 DOM이 완전히 준비될 수 있도록 0.1초의 여유를 두고 페이지를 복구합니다.
    setTimeout(() => {
        const savedPage = localStorage.getItem('omni_current_page') || 'page-dashboard';
        const isValidTarget = document.getElementById(savedPage);
        window.omniSwitchPage(isValidTarget ? savedPage : 'page-dashboard');
    }, 100);
});