/**
 * ============================================================================
 * 📑 MAPLE OMNI V14 - js/todo/js/todo_summary.js [📋 SUMMARY TAB RENDERER]
 * 역할: 캐릭터 명단 전체의 일일/주간 숙제 달성률 퍼센티지를 연산하여 실시간 그래픽 바 시각화
 * 수정사항: 멀티 스크립트 파일 환경에서 발생하던 아바타 상수 참조 오류(ReferenceError) 완전 보정
 * ============================================================================
 */

window.renderTodoSummaryContent = function() {
    // [초보자 가이드] 요약 데이터를 투사할 부모 컨테이너의 존재 여부를 가장 먼저 확인합니다.
    const container = document.getElementById('todo-summary');
    if (!container) return;
    
    // 명단에 캐릭터가 한 개도 등록 안 되어 있을 시 초기 안내 가이드 화면을 그리고 함수를 탈출 종료합니다.
    if (window.omniTodoState.characters.length === 0) {
        container.innerHTML = `${window.renderGlobalTodoSummary()}<div class="omni-empty-state">스케줄러 명단에 등록된 캐릭터 정보가 없습니다.</div>`;
        return;
    }

    let dailySummaryRows = "";
    let weeklySummaryRows = "";

    // [초보자 가이드] 고속 선회 루프문을 가동해 캐릭터별 진척도 데이터를 비율 환산 기입합니다.
    window.omniTodoState.characters.forEach(char => {
        const data = window.omniTodoState.checkData[char.id] || {};
        
        // 1. 일일 퀘스트 진척도 누적 스택 계산 연산 단락 (총 분모 8 기준)
        let dailyMax = 8; let dailyDone = 0;
        if (parseInt(data.daily_m_park || 0, 10) >= 7) dailyDone++; // 몬스터파크 7회 충족 시 1스택 가산
        ['daily_cernium', 'daily_arcus', 'daily_odium', 'daily_shangrila', 'daily_arteria', 'daily_carcion', 'daily_talhart'].forEach(k => { if(data[k]) dailyDone++; });
        let dailyPercent = Math.round((dailyDone / dailyMax) * 100);

        // 2. 주간 던전 및 주간 레이드 보스 진척도 연산 단락 (분모 최댓값 15 제한 캡 설정)
        let weeklyMax = 15; let weeklyDone = 0;
        if(data.weekly_mountain) weeklyDone++;
        if(data.weekly_angeler) weeklyDone++;
        Object.keys(window.omniTodoState.bossPrices).forEach(k => { if (data[`boss_${k}`]) weeklyDone++; });
        let weeklyPercent = Math.min(100, Math.round((weeklyDone / weeklyMax) * 100));

        // [초보자 가이드] 다른 파일에 정의된 이미지 텍스트 패킷을 안전하게 가져오기 위해 window 전역 객체에서 바인딩합니다.
        const avatarImg = char.image || window.SAFE_FALLBACK_AVATAR;

        // 일일 진척도 데이터 실시간 행 레이아웃 마크업을 동적 적재합니다.
        dailySummaryRows += `
            <div class="char-summary-row">
                <div class="char-summary-avatar-frame">
                    <img src="${avatarImg}" class="char-avatar">
                </div>
                <div class="char-summary-meta">
                    <div class="char-summary-name-line">
                        <span>${char.name} (Lv.${char.level || 280})</span>
                        <span class="percent-txt">${dailyPercent}%</span>
                    </div>
                    <div class="summary-progress-track"><div class="summary-progress-bar" style="width: ${dailyPercent}%;"></div></div>
                </div>
            </div>
        `;

        // 주간 및 보스 정산 진척도 데이터 실시간 행 레이아웃 마크업을 동적 적재합니다.
        weeklySummaryRows += `
            <div class="char-summary-row">
                <div class="char-summary-avatar-frame">
                    <img src="${avatarImg}" class="char-avatar">
                </div>
                <div class="char-summary-meta">
                    <div class="char-summary-name-line">
                        <span>${char.name} (${char.job || '모험가'})</span>
                        <span class="percent-txt" style="color:#8b5cf6;">${weeklyPercent}%</span>
                    </div>
                    <div class="summary-progress-track"><div class="summary-progress-bar" style="width: ${weeklyPercent}%; background:linear-gradient(90deg, #c4b5fd, #8b5cf6);"></div></div>
                </div>
            </div>
        `;
    });

    // 가변 데이터를 결합하여 최종 요약판 콘솔 화면을 브라우저에 투사 마운트합니다.
    container.innerHTML = `
        ${window.renderGlobalTodoSummary()}
        <div class="omni-weekly-summary-wrapper">
            <div class="summary-status-grid">
                <div class="summary-brief-card">
                    <div class="brief-card-title">☀️ 일일 콘텐츠 진행 현황 요약</div>
                    ${dailySummaryRows}
                </div>
                <div class="summary-brief-card">
                    <div class="brief-card-title">📦 주간 콘텐츠 & 보스 레이드 스태츠</div>
                    ${weeklySummaryRows}
                </div>
            </div>
        </div>
    `;
};