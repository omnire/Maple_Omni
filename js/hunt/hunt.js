/**
 * ============================================================================
 * 🎮 js/hunt/hunt.js - 전역 환경 설정, 내부 서브 탭 라우팅 매핑 엔진
 * 설명: index.html에 장착된 내부 라우터 단추들과 서브 섹션 간의 스위칭을 관제합니다.
 * 규칙: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 달아줍니다.
 * ============================================================================
 */

/**
 * 💡 [초보자 가이드] 기록실, 달력, 분석 리포트 등의 서브 탭 버튼을 눌렀을 때 
 * 해당 레이어의 활성화 상태(active)를 가변 제어하고 화면을 새로 그려주는 핵심 라우터 기능입니다.
 * @param {string} tabId - 이동하고자 하는 대상 탭의 고유 ID (예: 'overview', 'record', 'history' 등)
 */
window.switchHuntTab = function(tabId) {
    const sections = document.querySelectorAll('#page-hunt .sub-section');
    sections.forEach(sec => {
        sec.classList.remove('active');
        sec.style.setProperty('display', 'none', 'important');
    });

    const buttons = document.querySelectorAll('#page-hunt .sub-tab-menu .tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    const targetSection = document.getElementById(`hunt-${tabId}`);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.setProperty('display', 'block', 'important');
    }

    const clickedButton = Array.from(buttons).find(btn => {
        const onclickAttr = btn.getAttribute('onclick');
        return onclickAttr && onclickAttr.includes(`'${tabId}'`);
    });
    if (clickedButton) {
        clickedButton.classList.add('active');
    }

    if (tabId === 'overview' && typeof window.renderHuntOverviewPage === 'function') {
        window.renderHuntOverviewPage();
    } else if (tabId === 'record' && typeof window.renderRecordPage === 'function') {
        window.renderRecordPage();
    } else if (tabId === 'expense' && typeof window.renderExpensePage === 'function') {
        window.renderExpensePage();
    } else if (tabId === 'analysis') {
        const idx = parseInt(window.currentIdx) || 1;
        if (typeof window.processGrowthStats === 'function') window.processGrowthStats(idx);
        if (typeof window.renderOmniAvatar === 'function') window.renderOmniAvatar(idx);
        if (typeof window.renderOmniGrowthChart === 'function') window.renderOmniGrowthChart(idx);
    } else if (tabId === 'history') {
        if (typeof window.renderHistoryPage === 'function') {
            window.renderHistoryPage();
        } else if (typeof window.renderAttendance === 'function') {
            window.renderAttendance();
        }
    }

    /* 💡 [초보자 주석] 기록실(record) 탭은 자체 상단바가 있으므로 중복 생성을 막고, 그 외 서브 탭에만 제어 대상 배지 바를 상단에 주입합니다. */
    if (tabId !== 'overview' && tabId !== 'record' && targetSection) {
        const activeIdx = window.overviewSelectedCharId || window.currentIdx || 1;
        const activeCharMeta = JSON.parse(localStorage.getItem(`maple_char_data_${activeIdx}`) || '{}');
        const targetCharName = activeCharMeta.name || `Slot-${activeIdx} 미등록`;
        
        const oldBar = targetSection.querySelector('.v14-internal-header-action-bar');
        if (oldBar) oldBar.remove();

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
    
    miniPanel.classList.toggle('hidden');
    
    if (!miniPanel.classList.contains('hidden')) {
        miniPanel.innerHTML = `
            <div class="v14-mini-monitor-label">PWA MINI MONITOR ACTIVE</div>
            <div class="v14-mini-monitor-time" id="miniTimerDisplay">00:00:00</div>
            <div class="v14-mini-monitor-desc">사냥 본진 탭에서 컨트롤 하세요</div>
        `;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.switchHuntTab('overview');
});