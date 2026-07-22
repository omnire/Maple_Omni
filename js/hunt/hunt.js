/**
 * ============================================================================
 * 🎮 js/hunt/hunt.js - 전역 환경 설정, 내부 서브 탭 라우팅 매핑 엔진
 * 설명: index.html에 장착된 내부 라우터 단추들과 서브 섹션 간의 스위칭을 관제합니다.
 * 패치노트: 
 * 1. overview.js와의 함수 충돌을 방지하기 위해 모든 서브 탭(기록, 달력, 분석 등)의 
 * 렌더링 생명주기를 통합 제어하는 철벽 안전 라우터 함수를 구축했습니다.
 * 2. 색상 테마 전환 시 실시간으로 테마 스킨 요소들과 자연스럽게 매칭되도록 설계되었습니다.
 * 규칙: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 달아줍니다.
 * ============================================================================
 */

/**
 * 💡 [초보자 가이드] 기록실, 달력, 분석 리포트 등의 서브 탭 버튼을 눌렀을 때 
 * 해당 레이어의 활성화 상태(active)를 가변 제어하고 화면을 새로 그려주는 핵심 라우터 기능입니다.
 * @param {string} tabId - 이동하고자 하는 대상 탭의 고유 ID (예: 'overview', 'record', 'history' 등)
 */
window.switchHuntTab = function(tabId) {
    // 1. 사냥 관제 섹션 하위의 모든 서브 섹션 레이어(.sub-section)를 탐색하여 활성화 클래스를 걷어내고 숨깁니다.
    const sections = document.querySelectorAll('#page-hunt .sub-section');
    sections.forEach(sec => {
        sec.classList.remove('active');
        sec.style.setProperty('display', 'none', 'important');
    });

    // 2. 상단 네비게이션 탭 메뉴의 모든 단추들에서도 일괄적으로 active 하이라이트 스타일 처리를 제거합니다.
    const buttons = document.querySelectorAll('#page-hunt .sub-tab-menu .tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    // 3. 사용자가 최종 클릭한 대상 서브 섹션의 ID 컴포넌트를 찾아서 활성화하고 화면에 노출시킵니다.
    const targetSection = document.getElementById(`hunt-${tabId}`);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.setProperty('display', 'block', 'important');
    }

    // 4. 클릭 인터페이스 단추의 속성을 역추적하여 매칭되는 버튼에 활성화 하이라이트 스킨을 적용합니다.
    const clickedButton = Array.from(buttons).find(btn => {
        const onclickAttr = btn.getAttribute('onclick');
        return onclickAttr && onclickAttr.includes(`'${tabId}'`);
    });
    if (clickedButton) {
        clickedButton.classList.add('active');
    }

    // 5. [빈 화면 오류 원천 차단] 탭 전환 시점에 맞춰 각 서브 페이지의 실제 데이터 드로잉 함수들을 안전하게 호출합니다.
    if (tabId === 'overview' && typeof window.renderHuntOverviewPage === 'function') {
        window.renderHuntOverviewPage();
    } else if (tabId === 'record' && typeof window.renderRecordPage === 'function') {
        window.renderRecordPage();
    } else if (tabId === 'expense' && typeof window.renderExpensePage === 'function') {
        window.renderExpensePage();
    } else if (tabId === 'analysis') {
        // 분석 리포트 탭인 경우 상단 4대 누적 지표 및 라벤더 2x2 차트 인스턴스를 즉시 갱신합니다.
        const idx = parseInt(window.currentIdx) || 1;
        if (typeof window.processGrowthStats === 'function') window.processGrowthStats(idx);
        if (typeof window.renderOmniAvatar === 'function') window.renderOmniAvatar(idx);
        if (typeof window.renderOmniGrowthChart === 'function') window.renderOmniGrowthChart(idx);
    } else if (tabId === 'history') {
        // 사냥 기록지(달력) 탭인 경우 빈 화면으로 나오지 않도록 페이지 마운트 및 달력 그리기를 순차 진행합니다.
        if (typeof window.renderHistoryPage === 'function') {
            window.renderHistoryPage();
        } else if (typeof window.renderAttendance === 'function') {
            window.renderAttendance();
        }
    }

    // 6. 대시보드 메인으로 돌아가는 것이 아닌 서브 페이지 작동 중일 때, 상단에 '현재 제어 대상 캐릭터 바'를 동적으로 구성합니다.
    if (tabId !== 'overview' && targetSection) {
        const activeIdx = window.overviewSelectedCharId || window.currentIdx || 1;
        const activeCharMeta = JSON.parse(localStorage.getItem(`maple_char_data_${activeIdx}`) || '{}');
        const targetCharName = activeCharMeta.name || `Slot-${activeIdx} 미등록`;
        
        // 중복 생성을 막기 위해 기존에 존재하던 바를 깔끔하게 지워줍니다.
        const oldBar = targetSection.querySelector('.v14-internal-header-action-bar');
        if (oldBar) oldBar.remove();

        // 테마와 가독성을 고려한 구조화된 액션 헤더바 컴포넌트를 조립하여 최상단에 주입합니다.
        const headerBar = document.createElement('div');
        headerBar.className = 'v14-internal-header-action-bar';
        headerBar.innerHTML = `
            <div class="v14-header-control-badge">
                <span class="v14-badge-title">⚔️ 현재 제어 대상</span>
                <span class="v14-badge-name">${targetCharName}</span>
            </div>
            <button type="button" class="v14-back-list-btn" onclick="window.switchHuntTab('overview');">
                ← 메인 대시보드로 복귀
            </button>
        `;
        targetSection.insertBefore(headerBar, targetSection.firstChild);
    }
};

/**
 * 💡 [초보자 가이드] 미니 타이머 모드 창 토글 시 내부 모니터 패널 마크업 구조를 동적으로 그려주는 스위칭 핸들러입니다.
 */
window.toggleMiniTimerMode = function() {
    const miniPanel = document.getElementById('miniTimerContainer');
    if (!miniPanel) return;
    
    // hidden 클래스가 있으면 제거하고, 없으면 추가하는 편리한 토글 스위치입니다.
    miniPanel.classList.toggle('hidden');
    
    // 화면에 미니 타이머가 켜진 상태라면 안내 문구 및 디스플레이 레이아웃 뼈대를 채워줍니다.
    if (!miniPanel.classList.contains('hidden')) {
        miniPanel.innerHTML = `
            <div class="v14-mini-monitor-label">PWA MINI MONITOR ACTIVE</div>
            <div class="v14-mini-monitor-time" id="miniTimerDisplay">00:00:00</div>
            <div class="v14-mini-monitor-desc">사냥 본진 탭에서 컨트롤 하세요</div>
        `;
    }
};

// 🗺️ 페이지 최초 진입 시 사냥기록 기입 콘솔('overview') 창을 디폴트 기본 활성 상태로 라우팅 명령을 내립니다.
document.addEventListener('DOMContentLoaded', () => {
    window.switchHuntTab('overview');
});