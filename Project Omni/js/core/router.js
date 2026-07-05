/**
 * ============================================================================
 * 🧭 MAPLE OMNI V14 - js/core/router.js [SPA 강제 제어 엔진 - 안정성 강화판]
 * 설명: 인라인 display 스타일 제어 시 !important 플래그를 결착하여 외부 스타일시트와의
 *         우선순위 충돌로 인한 화면 전환 오류(깜빡임/미노출)를 원천 차단합니다.
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
        'page-mvp': 'nav-btn-mvp'
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
 * 💡 [초보자 가이드] 브라우저가 첫 DOM 트리를 완성하는 즉시 스토리지에 백업된 마지막 페이지 상태를 역산하여 복원합니다.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 저장된 페이지 명세를 복구하며, 완전 첫 진입이거나 유실된 경우 홈/대시보드를 기본 포트로 지정합니다.
    const savedPage = localStorage.getItem('omni_current_page') || 'page-dashboard';

    // 🛡️ 저장된 페이지 ID가 개편 등으로 더 이상 존재하지 않는 파츠일 때 기본값인 대시보드로 우회 대체시켜 백업을 보장합니다.
    const isValidTarget = document.getElementById(savedPage);
    window.omniSwitchPage(isValidTarget ? savedPage : 'page-dashboard');
});