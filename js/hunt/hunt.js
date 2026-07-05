/**
 * ============================================================================
 * 🎮 js/hunt/hunt.js - 전역 환경 설정, 내부 서브 탭 라우팅 매핑 엔진
 * 설명: index.html에 장착된 내부 라우터 단추들과 서브 섹션 간의 스위칭을 관제합니다.
 * 가이드: 초보자도 완벽하게 코드를 독학할 수 있도록 친절하고 상세한 주석을 달아 생략 없이 작성함
 * ============================================================================
 */

/**
 * 💡 [초보자 가이드] 기록실, 달력, 분석 리포트 등의 서브 탭 버튼을 눌렀을 때 해당 레이어 클래스를 가변 제어하는 주 기능입니다.
 */
window.switchHuntTab = function(tabId) {
    // 1. 사냥 관제 섹션 하위의 모든 서브 섹션 레이어에서 활성화 클래스(active)를 걷어냅니다.
    const sections = document.querySelectorAll('#page-hunt .sub-section');
    sections.forEach(sec => sec.classList.remove('active'));

    // 2. 상단 네비게이션 탭 단추들에서도 일괄적으로 active 하이라이트 처리를 제거합니다.
    const buttons = document.querySelectorAll('#page-hunt .sub-tab-menu .tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    // 3. 사용자가 최종 클릭한 대상 서브 섹션의 ID 컴포넌트를 탐색하여 주입 노출시킵니다.
    const targetSection = document.getElementById(`hunt-${tabId}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // 4. 클릭 인터페이스 단추의 인라인 속성을 역추적하여 활성화 버튼에 어울리는 파란 스킨 스티커를 적용합니다.
    const clickedButton = Array.from(buttons).find(btn => btn.getAttribute('onclick').includes(`'${tabId}'`));
    if (clickedButton) {
        clickedButton.classList.add('active');
    }

    // 📈 분석 리포트 탭으로 이동했다면, 최신 데이터 정렬 연산 및 차트 리드로우 기믹을 순차 실행합니다.
    if (tabId === 'analysis') {
        const idx = parseInt(window.currentIdx) || 1;
        if (typeof window.processGrowthStats === 'function') window.processGrowthStats(idx);
        if (typeof window.renderOmniAvatar === 'function') window.renderOmniAvatar(idx);
        if (typeof window.renderOmniGrowthChart === 'function') window.renderOmniGrowthChart(idx);
    }
    
    // 🛠️ [버그 수정 공지] 존재하지 않던 테이블 드로잉 함수 대신 캘린더 실제 연동 함수인 renderAttendance를 지시합니다.
    if (tabId === 'history' && typeof window.renderAttendance === 'function') {
        window.renderAttendance();
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
            <div style="color: #94a3b8; font-size: 11px; font-weight: 800;">PWA MINI MONITOR ACTIVE</div>
            <div style="color: #38bdf8; font-weight: 900; font-size: 16px; font-variant-numeric: tabular-nums;" id="miniTimerDisplay">00:00:00</div>
            <div style="color: #64748b; font-size: 11px;">사냥 본진 탭에서 컨트롤 하세요</div>
        `;
    }
};

// 🗺️ 페이지 최초 진입 시 사냥기록 기입 콘솔('record') 창을 디폴트 기본 스펙 활성 상태로 라우팅 명령을 내립니다.
document.addEventListener('DOMContentLoaded', () => {
    window.switchHuntTab('record');
});