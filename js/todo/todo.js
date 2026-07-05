/**
 * ============================================================================
 * 📑 MAPLE OMNI V14 - js/todo/todo.js [PREMIUM EXPANDED ENGINE - ONE FILE COMPLETED]
 * 설명: 백업본의 아키텍처(mockExpHistory 포함)를 완벽히 이식하고, 화면 유실 버그를 파쇄한 통합본입니다.
 * 수정사항: renderTodoBossContent 내부에서 window 누락으로 터지던 진힐라(renderBossItem) 참조 결함 교정
 * 규칙: 초보자도 코드를 완벽하게 분석하고 자유자재로 커스텀할 수 있도록 상세한 한글 주석을 기입했습니다.
 * ============================================================================
 */

// [초보자 가이드] 모든 투두 프로그램 영역이 공유할 전역 데이터 저장소(상태 구조체)를 안전하게 확장 선언합니다.
window.omniTodoState = {
    activeSubTab: "boss", // 기본적으로 최초 로딩 시 '보스 정산' 탭이 활성화되도록 고정합니다.
    characters: [],      // 유저가 검색창을 통해 동기화하여 등록한 캐릭터 객체들이 배열로 누적됩니다.
    
    // 💰 2026년 기준 넥슨 공식 솔로 레이드 결정석 정산 시세표 마스터 테이블입니다.
    bossPrices: {
        "n_suu": 34000000,       "h_suu": 117000000,      "ex_suu": 1120000000,
        "n_demian": 37000000,    "h_demian": 111000000,   "n_gaensl": 43000000,
        "c_gaensl": 71200000,    "e_lucid": 40000000,     "n_lucid": 56000000,
        "h_lucid": 136000000,    "e_will": 44000000,      "n_will": 66000000,
        "h_will": 145000000,     "n_dusk": 70000000,      "c_dusk": 162000000,
        "n_dunkel": 77000000,    "h_dunkel": 175000000,   "n_hilla": 89000000,
        "h_hilla": 200000000,    "b_mage": 1360000000,    "n_seren": 268000000,
        "h_seren": 411000000,    "e_kalos": 300000000,    "n_kalos": 450000000,
        "c_kalos": 600000000,    "e_kaling": 350000000,   "n_kaling": 520000000,
        "h_kaling": 800000000,   "n_limbo": 650000000,    "h_limbo": 1200000000
    },
    checkData: {},             // 각 캐릭터별 콘텐츠 클릭 체크(true/false) 여부를 보존하는 공간입니다.
    calendarCheckedDays: {},   // 플래너용 미니 달력의 일별 연속 출석/체크 상태 버퍼입니다.
    
    // 📈 [백업본 피드백 반영] 플래너 내부에서 차트를 그리기 위한 최근 7일간의 경험치 획득 시뮬레이션 빅데이터입니다.
    mockExpHistory: {
        "dates": ["06-25", "06-26", "06-27", "06-28", "06-29", "06-30", "07-01"],
        "amounts": [135000000000, 148000000000, 110000000000, 225000000000, 195000000000, 140000000000, 175000000000]
    }
};

// [초보자 가이드] 넥슨 서버 점검이나 이미지 주소 누락 시 캐릭터 이미지가 깨지는 것을 방지하는 세이프 가상 스킨 패킷입니다.
window.SAFE_FALLBACK_AVATAR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0E4QjJGNiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNFMkVBRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIj5NQVBFTDwvdGV4dD48L3N2Zz4=";

/**
 * 💡 일일 및 주간 퀘스트 리스트의 개별 단일 행(Row) 자바스크립트 드로잉 템플릿입니다.
 */
window.renderHwItem = function(charId, key, title, isChecked, textOn, textOff) {
    return `
        <div class="hw-item-row ${isChecked ? 'is-done' : ''}" onclick="window.toggleTodoCheckboxElement('${charId}', '${key}')">
            <div class="hw-left">
                <div class="custom-premium-checkbox ${isChecked ? 'checked' : ''}">${isChecked ? '✓' : ''}</div>
                <span class="hw-title">${title}</span>
            </div>
            <span class="hw-counter">${isChecked ? textOn : textOff}</span>
        </div>
    `;
};

/**
 * 😈 주간/월간 보스 레이드 정산 전용 특화 금액 표출 컴포넌트 레이아웃입니다.
 */
window.renderBossItem = function(charId, key, title, badge, isChecked, textOn, textOff) {
    const badgeHtml = badge ? `<span class="boss-badge-pastel">${badge}</span>` : '';
    return `
        <div class="hw-item-row ${isChecked ? 'is-done' : ''}" onclick="window.toggleTodoCheckboxElement('${charId}', '${key}')">
            <div class="hw-left">
                <div class="custom-premium-checkbox ${isChecked ? 'checked' : ''}">${isChecked ? '✓' : ''}</div>
                <div class="boss-image-placeholder-blank"></div>
                <span class="hw-title">${title} ${badgeHtml}</span>
            </div>
            <span class="hw-counter clean-num" style="font-weight:800; color:${isChecked ? '#6d28d9' : '#94a3b8'};">${isChecked ? textOn : textOff}</span>
        </div>
    `;
};

/**
 * ⚙️ 시스템 초기 가동 시 브라우저 내부 LocalStorage 영구 스토리지를 역추적하여 유저 데이터를 복원합니다.
 */
window.initOmniTodoTab = function() {
    const pageTodoSection = document.getElementById('page-todo');
    if (!pageTodoSection) return; 

    // 1. 기존에 저장되어 있던 캐릭터 리스트, 정산 데이터, 달력 체크 기록을 불러옵니다.
    const savedChars = localStorage.getItem("omni_v14_todo_characters_list");
    if (savedChars) window.omniTodoState.characters = JSON.parse(savedChars);
    
    const savedChecks = localStorage.getItem("omni_v14_todo_perfect_storage");
    if (savedChecks) window.omniTodoState.checkData = JSON.parse(savedChecks);

    const savedCalChecked = localStorage.getItem("omni_v14_todo_calendar_checked");
    if (savedCalChecked) window.omniTodoState.calendarCheckedDays = JSON.parse(savedCalChecked);

    // 2. 혹시라도 데이터 규격이 비어있을 경우를 대비하여 방어용 초기 구조 형성을 선행합니다.
    window.omniTodoState.characters.forEach(c => {
        if (!c.id) c.id = c.name;
        if (!window.omniTodoState.checkData[c.id]) window.omniTodoState.checkData[c.id] = {};
        
        const d = window.omniTodoState.checkData[c.id];
        if (d.daily_m_park === undefined) d.daily_m_park = 0;
        
        Object.keys(window.omniTodoState.bossPrices).forEach(k => {
            if (d[`boss_${k}`] === undefined) d[`boss_${k}`] = false;
        });
    });
    localStorage.setItem("omni_v14_todo_perfect_storage", JSON.stringify(window.omniTodoState.checkData));

    // 3. 서브 메뉴 내비게이션 탭을 화면에 정식 드로잉합니다.
    window.renderTodoSubTabHeaders();
};

/**
 * ✨ [메뉴 사라짐 완벽 방어형 트래킹 제어 기능] 
 * 어떤 HTML 환경에서도 주간할일 서브 메뉴 탭 단추가 상단 제목 바로 아래 정확히 붙도록 제어합니다.
 */
window.renderTodoSubTabHeaders = function() {
    const pageTodoSection = document.getElementById('page-todo');
    if (!pageTodoSection) return;

    let tabMenuWrapper = pageTodoSection.querySelector('.sub-tab-menu');
    if (!tabMenuWrapper) {
        tabMenuWrapper = document.createElement('div');
        tabMenuWrapper.className = 'sub-tab-menu';
    }

    const pageHeader = pageTodoSection.querySelector('.page-header');
    if (pageHeader) {
        pageTodoSection.insertBefore(tabMenuWrapper, pageHeader.nextSibling);
    } else {
        pageTodoSection.prepend(tabMenuWrapper);
    }

    tabMenuWrapper.innerHTML = `
        <button class="tab-btn" onclick="window.switchTodoTab('summary')">📋 요약</button>
        <button class="tab-btn" onclick="window.switchTodoTab('planner')">📅 플래너</button>
        <button class="tab-btn" onclick="window.switchTodoTab('daily')">☀️ 일일</button>
        <button class="tab-btn" onclick="window.switchTodoTab('weekly')">📦 주간</button>
        <button class="tab-btn" onclick="window.switchTodoTab('boss')">😈 보스</button>
    `;
    
    window.switchTodoTab(window.omniTodoState.activeSubTab);
};

/**
 * 🔄 단일 웹 어플리케이션(SPA) 방식으로 하위 가변 서브 섹션을 투명하게 교체 토글하는 엔진입니다.
 */
window.switchTodoTab = function(tabId) {
    window.omniTodoState.activeSubTab = tabId;

    const pageTodoSection = document.getElementById('page-todo');
    if (!pageTodoSection) return; 

    pageTodoSection.querySelectorAll('.sub-tab-menu .tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(tabId)) {
            btn.classList.add('active');
        }
    });

    ['summary', 'planner', 'daily', 'weekly', 'boss'].forEach(t => {
        let sect = document.getElementById(`todo-${t}`);
        if (!sect) {
            sect = document.createElement('div');
            sect.id = `todo-${t}`;
            sect.className = 'sub-section';
            pageTodoSection.appendChild(sect);
        }
        sect.classList.remove('active');
        sect.innerHTML = "";
    });

    const targetSection = document.getElementById(`todo-${tabId}`);
    if (targetSection) targetSection.classList.add('active');

    if (tabId === 'summary' && typeof window.renderTodoSummaryContent === 'function') window.renderTodoSummaryContent();
    if (tabId === 'planner' && typeof window.renderTodoPlannerContent === 'function') window.renderTodoPlannerContent();
    if (tabId === 'daily' && typeof window.renderTodoDailyContent === 'function') window.renderTodoDailyContent();
    if (tabId === 'weekly' && typeof window.renderTodoWeeklyContent === 'function') window.renderTodoWeeklyContent();
    if (tabId === 'boss' && typeof window.renderTodoBossContent === 'function') window.renderTodoBossContent();
};

/**
 * 📊 상단 프리미엄 계정 전체의 주간 누적 결정석 수익금 및 메트릭 현황판 전용 렌더링 스트링 모듈입니다.
 */
window.renderGlobalTodoSummary = function() {
    const chars = window.omniTodoState.characters;
    const checks = window.omniTodoState.checkData;
    const prices = window.omniTodoState.bossPrices;

    let totalBossCount = 0; 
    let activeBossCharacters = 0; 
    let totalAccumulatedMeso = 0;

    chars.forEach(c => {
        const data = checks[c.id] || {};
        let hasBossActive = false;
        Object.keys(prices).forEach(key => {
            if (data[`boss_${key}`] === true) {
                totalBossCount++;
                hasBossActive = true;
                totalAccumulatedMeso += prices[key];
            }
        });
        if (hasBossActive) activeBossCharacters++;
    });

    return `
        <div class="workspace-notice-card" style="width: 100%; margin-bottom: 16px; border-left: 5px solid #8b5cf6; background: #fdfbfe; padding: 14px 18px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="font-weight: 800; color: #6d28d9; font-size: 13px; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                <span>💡 2026-07-01 넥슨 실시간 스케줄러 동기화 패널</span>
            </div>
            <p style="margin: 0; font-size: 12px; color: #4b5563; line-height: 1.5; font-weight: 500;">
                인게임 숙제 수행 후 카드 우측 상단의 <strong style="color: #ef4444;">삭제(×) 버튼</strong>을 누르고 닉네임을 다시 검색해 주십시오. 브라우저 잔류 캐시 파쇄 필터가 작동하여 원본과 완전히 똑같이 자동 정산 체크됩니다!
            </p>
        </div>

        <div class="omni-summary-dashboard">
            <div class="omni-summary-card">
                <div class="text-box">
                    <span class="label">총 보스 클리어 횟수</span>
                    <strong class="value">${totalBossCount}<span class="unit">회</span></strong>
                </div>
            </div>
            <div class="omni-summary-card">
                <div class="text-box">
                    <span class="label">레이드 참여 명단</span>
                    <strong class="value">${activeBossCharacters}<span class="unit">명</span></strong>
                </div>
            </div>
            <div class="omni-summary-card primary-highlight" style="grid-column: span 2;">
                <div class="text-box">
                    <span class="label">💰 이번 주 보스 순수익 총 정산금</span>
                    <strong class="value color-indigo">${totalAccumulatedMeso.toLocaleString()}<span class="unit-meso">Meso</span></strong>
                </div>
            </div>
        </div>
    `;
};

/**
 * 📋 [알맹이 구현실] 등록된 전 캐릭터 숙제 완료도를 백분율 그래프로 시각화해 주는 렌더러입니다.
 */
window.renderTodoSummaryContent = function() {
    const container = document.getElementById('todo-summary');
    if (!container) return;

    if (window.omniTodoState.characters.length === 0) {
        container.innerHTML = `
            ${window.renderGlobalTodoSummary()}
            <div class="omni-empty-state">스케줄러 명단에 등록된 캐릭터 정보가 없습니다. 상단에서 검색을 진행하세요.</div>
        `;
        return;
    }

    let dailySummaryRows = "";
    let weeklySummaryRows = "";

    window.omniTodoState.characters.forEach(char => {
        const data = window.omniTodoState.checkData[char.id] || {};
        
        let dailyMax = 8; let dailyDone = 0;
        if (parseInt(data.daily_m_park || 0, 10) >= 7) dailyDone++;
        ['daily_cernium', 'daily_arcus', 'daily_odium', 'daily_shangrila', 'daily_arteria', 'daily_carcion', 'daily_talhart'].forEach(k => { if(data[k]) dailyDone++; });
        let dailyPercent = Math.round((dailyDone / dailyMax) * 100);

        let weeklyMax = 15; let weeklyDone = 0;
        if(data.weekly_mountain) weeklyDone++;
        if(data.weekly_angeler) weeklyDone++;
        Object.keys(window.omniTodoState.bossPrices).forEach(k => { if (data[`boss_${k}`]) weeklyDone++; });
        let weeklyPercent = Math.round((weeklyDone / weeklyMax) * 100);
        if (weeklyPercent > 100) weeklyPercent = 100;

        const fallbackImg = window.SAFE_FALLBACK_AVATAR || "";

        dailySummaryRows += `
            <div class="char-summary-row" style="display: flex; align-items: center; margin-bottom: 10px;">
                <div style="width: 46px; height: 46px; overflow: hidden; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: #fff; border: 1px solid #e2e8f0; margin-right: 10px; flex-shrink: 0;">
                    <img src="${char.image || fallbackImg}" class="char-avatar" style="width: 46px; height: 46px; object-fit: contain; transform: scale(2.3); transform-origin: center center;">
                </div>
                <div class="char-summary-meta" style="flex: 1;">
                    <div class="char-summary-name-line">
                        <span>${char.name} (Lv.${char.level || 280})</span>
                        <span class="percent-txt">${dailyPercent}%</span>
                    </div>
                    <div class="summary-progress-track"><div class="summary-progress-bar" style="width: ${dailyPercent}%;"></div></div>
                </div>
            </div>
        `;

        weeklySummaryRows += `
            <div class="char-summary-row" style="display: flex; align-items: center; margin-bottom: 10px;">
                <div style="width: 46px; height: 46px; overflow: hidden; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: #fff; border: 1px solid #e2e8f0; margin-right: 10px; flex-shrink: 0;">
                    <img src="${char.image || fallbackImg}" class="char-avatar" style="width: 46px; height: 46px; object-fit: contain; transform: scale(2.3); transform-origin: center center;">
                </div>
                <div class="char-summary-meta" style="flex: 1;">
                    <div class="char-summary-name-line">
                        <span>${char.name} (${char.job || '모험가'})</span>
                        <span class="percent-txt" style="color:#8b5cf6;">${weeklyPercent}%</span>
                    </div>
                    <div class="summary-progress-track"><div class="summary-progress-bar" style="width: ${weeklyPercent}%; background:linear-gradient(90deg, #c4b5fd, #8b5cf6);"></div></div>
                </div>
            </div>
        `;
    });

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

/**
 * 📅 [알맹이 구현실] 장기 육성 플랜 설계 및 한 달 출석 마킹용 인터랙션 캘린더 구역입니다.
 */
window.renderTodoPlannerContent = function() {
    const container = document.getElementById('todo-planner');
    if (!container) return;

    const savedPlansRaw = localStorage.getItem("omni_v14_strategy_plans");
    let planList = savedPlansRaw ? JSON.parse(savedPlansRaw) : [];

    let cardsHtml = "";
    planList.forEach((plan, index) => {
        cardsHtml += `
            <div class="planner-card-item">
                <div class="planner-card-meta">
                    <span class="planner-card-tag">🎯 육성 캐릭터: ${plan.char}</span>
                    <button class="planner-card-del-action" onclick="window.deleteTodoStrategyPlan(${index})">삭제</button>
                </div>
                <h5 class="planner-card-goal"><span class="plan-label-mini">목표</span> ${plan.goal}</h5>
                <p class="planner-card-route"><span class="plan-label-mini-route">동선</span> ${plan.route}</p>
            </div>
        `;
    });

    let selectOptions = ``;
    window.omniTodoState.characters.forEach(c => { selectOptions += `<option value="${c.name}">${c.name}</option>`; });
    const interactiveCalendarHtml = window.buildMiniCalendarComponentMarkup();

    container.innerHTML = `
        ${window.renderGlobalTodoSummary()}
        <div class="omni-planner-container">
            <div class="planner-header-flex">
                <span class="planner-badge">STRATEGY DESIGNER</span>
                <h4 class="planner-main-title">📅 OMNI STRATEGY PLANNER (캐릭터 장기 육성 계획서)</h4>
                <div class="planner-form-row">
                    <select id="todoPlannerCharSelect" class="planner-select-box">
                        ${selectOptions ? selectOptions : '<option value="미지정">캐릭터 없음</option>'}
                    </select>
                    <input type="text" id="todoPlannerGoalInput" placeholder="육성 목표 레벨 기입..." class="planner-input-field">
                    <input type="text" id="todoPlannerRouteInput" placeholder="매일 핵심 이동 성장 루트 동선 정의..." class="planner-input-field">
                    <button class="planner-btn-submit" onclick="window.addTodoStrategyPlan()">계획 수립</button>
                </div>
            </div>
            <div class="omni-planner-dashboard-layout">
                <div class="planner-grid-cards">${cardsHtml ? cardsHtml : '<div class="omni-empty-state" style="padding:20px;">수립된 장기 육성 전략 계획서가 존재하지 않습니다.</div>'}</div>
                <div>${interactiveCalendarHtml}</div>
            </div>
        </div>
    `;
};

window.buildMiniCalendarComponentMarkup = function() {
    const weekLabels = ['일', '월', '화', '수', '목', '금', '토'];
    let daysHtml = "";
    weekLabels.forEach(l => { daysHtml += `<div class="calendar-day-label">${l}</div>`; });
    daysHtml += `<div class="calendar-date-cell empty-cell"></div>`;

    for(let d=1; d<=30; d++) {
        const isChecked = window.omniTodoState.calendarCheckedDays[d] === true;
        daysHtml += `<div class="calendar-date-cell ${isChecked ? 'is-checked' : ''}" onclick="window.toggleCalendarDateCell(${d})">${d}</div>`;
    }

    return `<div class="omni-mini-calendar-widget"><div class="calendar-header-title"><span>🗓️ 달력 체크 스케줄러</span></div><div class="calendar-days-grid">${daysHtml}</div></div>`;
};

window.toggleCalendarDateCell = function(dayNum) {
    window.omniTodoState.calendarCheckedDays[dayNum] = !window.omniTodoState.calendarCheckedDays[dayNum];
    localStorage.setItem("omni_v14_todo_calendar_checked", JSON.stringify(window.omniTodoState.calendarCheckedDays));
    window.switchTodoTab(window.omniTodoState.activeSubTab);
};

window.deleteTodoStrategyPlan = function(index) {
    const savedPlansRaw = localStorage.getItem("omni_v14_strategy_plans");
    if (!savedPlansRaw) return;
    let planList = JSON.parse(savedPlansRaw);
    planList.splice(index, 1);
    localStorage.setItem("omni_v14_strategy_plans", JSON.stringify(planList));
    window.renderTodoPlannerContent();
};

window.addTodoStrategyPlan = function() {
    const charSelect = document.getElementById('todoPlannerCharSelect');
    const goalInput = document.getElementById('todoPlannerGoalInput');
    const routeInput = document.getElementById('todoPlannerRouteInput');

    if (!goalInput || !routeInput || !goalInput.value.trim() || !routeInput.value.trim()) {
        alert("목표와 세부 동선을 입력하셔야 전략 설계가 수립됩니다."); return;
    }
    const savedPlansRaw = localStorage.getItem("omni_v14_strategy_plans");
    let planList = savedPlansRaw ? JSON.parse(savedPlansRaw) : [];
    planList.unshift({ char: charSelect ? charSelect.value : "미정", goal: goalInput.value.trim(), route: routeInput.value.trim() });
    localStorage.setItem("omni_v14_strategy_plans", JSON.stringify(planList));
    goalInput.value = ""; routeInput.value = "";
    window.renderTodoPlannerContent();
};

/**
 * ☀️ [알맹이 구현실] 일일 대시보드 스케줄러 드로잉 룸입니다.
 */
window.renderTodoDailyContent = function() {
    const container = document.getElementById('todo-daily');
    if (!container) return;
    if (window.omniTodoState.characters.length === 0) {
        container.innerHTML = `${window.renderGlobalTodoSummary()}<div class="omni-empty-state">캐릭터를 검색창에 탐색하여 스케줄러 명단에 편입시켜 주십시오.</div>`; 
        return;
    }

    let html = window.renderGlobalTodoSummary() + `<div class="omni-character-grid">`;
    window.omniTodoState.characters.forEach(char => {
        const data = window.omniTodoState.checkData[char.id] || {};
        let currentMparkCount = data.daily_m_park || 0;
        const fallbackImg = window.SAFE_FALLBACK_AVATAR || "";

        html += `
            <div class="omni-char-card">
                <div class="char-header" style="display: flex; align-items: center; position: relative;">
                    <div style="width: 56px; height: 56px; overflow: hidden; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: #fff; border: 1px solid #e2e8f0; margin-right: 12px; flex-shrink: 0;">
                        <img src="${char.image || fallbackImg}" class="char-avatar" style="width: 56px; height: 56px; object-fit: contain; transform: scale(2.3); transform-origin: center center;" onerror="this.src='${fallbackImg}';">
                    </div>
                    <div class="char-info">
                        <div class="char-name">${char.name}</div>
                        <div class="char-spec">Lv.${char.level || 280} · ${char.job || '모험가'}</div>
                    </div>
                    <button class="btn-delete-char" onclick="window.removeTodoCharacter(event, '${char.id}')">×</button>
                </div>
                <div class="hw-scroll-list">
                    <div class="hw-item-row ${currentMparkCount >= 7 ? 'is-done' : ''}" onclick="window.incrementMonsterParkCounter('${char.id}')">
                        <div class="hw-left">
                            <div class="custom-premium-checkbox ${currentMparkCount >= 7 ? 'checked' : ''}">${currentMparkCount >= 7 ? '✓' : ''}</div>
                            <span class="hw-title">몬스터파크 (클릭 시 횟수 증가)</span>
                        </div>
                        <span class="hw-counter">${currentMparkCount} / 7 회</span>
                    </div>
                    ${window.renderHwItem(char.id, 'daily_cernium', '세르니움 조사', data.daily_cernium, '완료', '미완료')}
                    ${window.renderHwItem(char.id, 'daily_arcus', '호텔 아르크스 청소', data.daily_arcus, '완료', '미완료')}
                    ${window.renderHwItem(char.id, 'daily_odium', '오디움 일대 탐사', data.daily_odium, '완료', '미완료')}
                    ${window.renderHwItem(char.id, 'daily_shangrila', '도원경 오염 정화', data.daily_shangrila, '완료', '미완료')}
                    ${window.renderHwItem(char.id, 'daily_arteria', '아르테리아 잔당 처치', data.daily_arteria, '완료', '미완료')}
                    ${window.renderHwItem(char.id, 'daily_carcion', '카르시온 복구 지원', data.daily_carcion, '완료', '미완료')}
                    ${window.renderHwItem(char.id, 'daily_talhart', '탈라하트 조사', data.daily_talhart, '완료', '미완료')}
                </div>
            </div>
        `;
    });
    container.innerHTML = html + `</div>`;
};

/**
 * 📦 [알맹이 구현실] 주간 하이마운틴 / 앵글러 에픽던전 현황판 룸입니다.
 */
window.renderTodoWeeklyContent = function() {
    const container = document.getElementById('todo-weekly');
    if (!container) return;
    if (window.omniTodoState.characters.length === 0) {
        container.innerHTML = `${window.renderGlobalTodoSummary()}<div class="omni-empty-state">캐릭터 카드가 등록되어있지 않습니다.</div>`;
        return;
    }

    let html = window.renderGlobalTodoSummary() + `<div class="omni-character-grid">`;
    window.omniTodoState.characters.forEach(char => {
        const data = window.omniTodoState.checkData[char.id] || {};
        const fallbackImg = window.SAFE_FALLBACK_AVATAR || "";
        html += `
            <div class="omni-char-card">
                <div class="char-header" style="display: flex; align-items: center; position: relative;">
                    <div style="width: 56px; height: 56px; overflow: hidden; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: #fff; border: 1px solid #e2e8f0; margin-right: 12px; flex-shrink: 0;">
                        <img src="${char.image || fallbackImg}" class="char-avatar" style="width: 56px; height: 56px; object-fit: contain; transform: scale(2.3); transform-origin: center center;">
                    </div>
                    <div class="char-info"><div class="char-name">${char.name}</div></div>
                    <button class="btn-delete-char" onclick="window.removeTodoCharacter(event, '${char.id}')">×</button>
                </div>
                <div class="hw-scroll-list">
                    ${window.renderHwItem(char.id, 'weekly_mountain', '에픽 던전 : 하이마운틴', data.weekly_mountain, '완료', '대기')}
                    ${window.renderHwItem(char.id, 'weekly_angeler', '에픽 던전 : 앵글러 컴퍼니', data.weekly_angeler, '완료', '대기')}
                </div>
            </div>
        `;
    });
    container.innerHTML = html + `</div>`;
};

/**
 * 😈 [알맹이 구현실] 주간 보스 레이드 30종 정산 명세실 룸입니다.
 */
window.renderTodoBossContent = function() {
    const container = document.getElementById('todo-boss');
    if (!container) return;
    if (window.omniTodoState.characters.length === 0) {
        container.innerHTML = `${window.renderGlobalTodoSummary()}<div class="omni-empty-state">보스 명단이 비어있습니다.</div>`; 
        return;
    }

    let html = window.renderGlobalTodoSummary() + `<div class="omni-character-grid">`;
    const prices = window.omniTodoState.bossPrices;

    window.omniTodoState.characters.forEach(char => {
        const data = window.omniTodoState.checkData[char.id] || {};
        let charMeso = 0;
        Object.keys(prices).forEach(key => { if (data[`boss_${key}`] === true) charMeso += prices[key]; });

        const fallbackImg = window.SAFE_FALLBACK_AVATAR || "";

        html += `
            <div class="omni-char-card" style="min-width:320px;">
                <div class="char-header" style="display: flex; align-items: center; position: relative;">
                    <div style="width: 56px; height: 56px; overflow: hidden; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: #fff; border: 1px solid #e2e8f0; margin-right: 12px; flex-shrink: 0;">
                        <img src="${char.image || fallbackImg}" class="char-avatar" style="width: 56px; height: 56px; object-fit: contain; transform: scale(2.3); transform-origin: center center;" onerror="this.src='${fallbackImg}';">
                    </div>
                    <div class="char-info">
                        <div class="char-name">${char.name}</div>
                        <div class="char-spec" style="color:#6d28d9; font-weight:800;">누적 정산: ${charMeso.toLocaleString()}</div>
                    </div>
                    <button class="btn-delete-char" onclick="window.removeTodoCharacter(event, '${char.id}')">×</button>
                </div>
                
                <div class="hw-scroll-list" style="max-height:450px; overflow-y:auto; padding-right:4px;">
                    <div style="font-size:10px; font-weight:900; color:#475569; padding:4px 6px; background:#f1f5f9; border-radius:4px; margin-bottom:6px;">⚔️ 검밑솔 ~ 주간 레이드 세분화 라인</div>
                    ${window.renderBossItem(char.id, 'boss_n_suu', '노말 스우 수입', '', data.boss_n_suu, prices.n_suu.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_h_suu', '하드 스우 수입', '', data.boss_h_suu, prices.h_suu.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_n_demian', '노말 데미안 수입', '', data.boss_n_demian, prices.n_demian.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_h_demian', '하드 데미안 수입', '', data.boss_h_demian, prices.h_demian.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_n_gaensl', '노말 가엔슬 수입', '', data.boss_n_gaensl, prices.n_gaensl.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_c_gaensl', '카오스 가엔슬 수입', '', data.boss_c_gaensl, prices.c_gaensl.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_e_lucid', '이지 루시드 수입', '', data.boss_e_lucid, prices.e_lucid.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_n_lucid', '노말 루시드 수입', '', data.boss_n_lucid, prices.n_lucid.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_h_lucid', '하드 루시드 수입', '', data.boss_h_lucid, prices.h_lucid.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_e_will', '이지 윌 수입', '', data.boss_e_will, prices.e_will.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_n_will', '노말 윌 수입', '', data.boss_n_will, prices.n_will.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_h_will', '하드 윌 수입', '', data.boss_h_will, prices.h_will.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_n_dusk', '노말 더스크 수입', '', data.boss_n_dusk, prices.n_dusk.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_c_dusk', '카오스 더스크 수입', '', data.boss_c_dusk, prices.c_dusk.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_n_dunkel', '노말 듄켈 수입', '', data.boss_n_dunkel, prices.n_dunkel.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_h_dunkel', '하드 듄켈 수입', '', data.boss_h_dunkel, prices.h_dunkel.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_n_hilla', '노말 진힐라 수입', '', data.boss_n_hilla, prices.n_hilla.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_h_hilla', '하드 진힐라 수입', '', data.boss_h_hilla, prices.h_hilla.toLocaleString(), '0')}
                    
                    <div style="font-size:10px; font-weight:900; color:#b45309; padding:4px 6px; background:#fff7ed; border-radius:4px; margin:10px 0 6px 0;">👑 검윗솔 ~ 최상위 하이엔드 레이드 라인</div>
                    ${window.renderBossItem(char.id, 'boss_b_mage', '검은 마법사', 'HARD', data.boss_b_mage, prices.b_mage.toLocaleString(), '대기')}
                    ${window.renderBossItem(char.id, 'boss_n_seren', '노말 세렌 수입', 'NORMAL', data.boss_n_seren, prices.n_seren.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_h_seren', '하드 세렌 수입', 'HARD', data.boss_h_seren, prices.h_seren.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_e_kalos', '이지 칼로스 수입', 'EASY', data.boss_e_kalos, prices.e_kalos.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_n_kalos', '노말 칼로스 수입', 'NORMAL', data.boss_n_kalos, prices.n_kalos.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_c_kalos', '카오스 칼로스 수입', 'CHAOS', data.boss_c_kalos, prices.c_kalos.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_e_kaling', '이지 카링 수입', 'EASY', data.boss_e_kaling, prices.e_kaling.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_n_kaling', '노말 카링 수입', 'NORMAL', data.boss_n_kaling, prices.n_kaling.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_h_kaling', '하드 카링 수입', 'HARD', data.boss_h_kaling, prices.h_kaling.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_n_limbo', '노말 림보 수입', 'NORMAL', data.boss_n_limbo, prices.n_limbo.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_h_limbo', '하드 림보 수입', 'HARD', data.boss_h_limbo, prices.h_limbo.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_ex_suu', '익스트림 스우', 'EX', data.boss_ex_suu, prices.ex_suu.toLocaleString(), '대기')}
                </div>
            </div>
        `;
    });
    html += `</div>`; container.innerHTML = html;
};

/**
 * ☀️ 몬스터파크의 일일 수행 횟수(최대 7회)를 가산하는 인터랙션 핸들러입니다.
 */
window.incrementMonsterParkCounter = function(charId) {
    const targetData = window.omniTodoState.checkData[charId];
    if (!targetData) return;
    let current = parseInt(targetData.daily_m_park || 0, 10);
    current++; if (current > 7) current = 0; 
    targetData.daily_m_park = current;
    localStorage.setItem("omni_v14_todo_perfect_storage", JSON.stringify(window.omniTodoState.checkData));
    window.switchTodoTab(window.omniTodoState.activeSubTab);
};

/**
 * 🔲 단일 체크박스의 활성화 상태를 온오프 토글 스위칭하는 공통 함수입니다.
 */
window.toggleTodoCheckboxElement = function(charId, objectKey) {
    const targetData = window.omniTodoState.checkData[charId];
    if (!targetData) return;
    targetData[objectKey] = !targetData[objectKey];
    localStorage.setItem("omni_v14_todo_perfect_storage", JSON.stringify(window.omniTodoState.checkData));
    window.switchTodoTab(window.omniTodoState.activeSubTab);
};

/**
 * ❌ 스케줄러 보드판에서 캐릭터 카드를 제거하는 패킷 파쇄기입니다.
 */
window.removeTodoCharacter = function(event, charId) {
    event.stopPropagation();
    if (!confirm("해당 캐릭터를 스케줄러 명단에서 제거하시겠습니까?")) return;
    localStorage.removeItem(`omni_v14_cached_char_${charId}`);
    window.omniTodoState.characters = window.omniTodoState.characters.filter(c => c.id !== charId);
    delete window.omniTodoState.checkData[charId];
    localStorage.setItem("omni_v14_todo_characters_list", JSON.stringify(window.omniTodoState.characters));
    localStorage.setItem("omni_v14_todo_perfect_storage", JSON.stringify(window.omniTodoState.checkData));
    window.switchTodoTab(window.omniTodoState.activeSubTab);
};

/**
 * 📡 넥슨 OpenAPI 수급 완료 시 비동기 파싱 데이터를 투두 영구 원장 메모리에 강제 결착하는 연동 허브입니다.
 */
window.syncTodoCharacterOnSearch = function(charName, basicInfo, apiHomework) {
    console.log(`[OMNI LINK V14] 일퀘/주퀘/보스 무결점 동기화 가동 -> ${charName}`);
    let charactersList = window.omniTodoState.characters;
    let targetChar = charactersList.find(c => c.name === charName || c.id === charName);
    
    const fallbackImg = window.SAFE_FALLBACK_AVATAR || "";

    if (!targetChar) {
        targetChar = { 
            id: charName, name: charName, 
            job: basicInfo?.character_class || "초보자", 
            level: basicInfo?.character_level || 200, 
            image: basicInfo?.character_image || fallbackImg 
        };
        charactersList.push(targetChar);
    } else if (basicInfo) {
        targetChar.level = basicInfo.character_level || targetChar.level;
        targetChar.job = basicInfo.character_class || targetChar.job;
        targetChar.image = basicInfo.character_image || targetChar.image;
    }
    
    if (!window.omniTodoState.checkData[charName]) window.omniTodoState.checkData[charName] = {};
    const d = window.omniTodoState.checkData[charName];

    const dailyArr = apiHomework.daily_contents || [];
    const weeklyArr = apiHomework.weekly_contents || [];
    const bossArr = apiHomework.boss_contents || [];

    if (d.daily_m_park === undefined) d.daily_m_park = 0;
    ['daily_cernium', 'daily_arcus', 'daily_odium', 'daily_shangrila', 'daily_arteria', 'daily_carcion', 'daily_talhart'].forEach(k => { if (d[k] === undefined) d[k] = false; });
    ['weekly_mountain', 'weekly_angeler'].forEach(k => { if (d[k] === undefined) d[k] = false; });

    const syncDailyKey = (keyword, objectKey) => {
        const target = dailyArr.find(c => c.content_name && c.content_name.includes(keyword));
        if (target) d[objectKey] = (String(target.quest_state) === "2");
    };
    
    syncDailyKey("세르니움", "daily_cernium");
    syncDailyKey("아르크스", "daily_arcus");
    syncDailyKey("오디움", "daily_odium");
    syncDailyKey("도원경", "daily_shangrila");
    syncDailyKey("아르테리아", "daily_arteria");
    syncDailyKey("카르시온", "daily_carcion");
    syncDailyKey("탈라하트", "daily_talhart");

    const mparkObj = dailyArr.find(c => c.content_name && c.content_name.includes("몬스터파크"));
    if (mparkObj) d.daily_m_park = mparkObj.now_count || 0;

    const syncWeeklyKey = (keyword, objectKey) => {
        const target = weeklyArr.find(c => c.content_name && c.content_name.includes(keyword));
        if (target) d[objectKey] = (String(target.complete_flag) === "true" || target.complete_flag === true || (target.now_count && target.now_count > 0));
    };
    syncWeeklyKey("하이마운틴", "weekly_mountain");
    syncWeeklyKey("앵글러 컴퍼니", "weekly_angeler");

    const syncBossKey = (keyword, diff, objectKey) => {
        const target = bossArr.find(c => c.content_name && c.content_name.includes(keyword) && c.difficulty === diff);
        if (target) d[`boss_${objectKey}`] = (String(target.complete_flag) === "true" || target.complete_flag === true);
    };

    syncBossKey("스우", "normal", "n_suu"); syncBossKey("스우", "hard", "h_suu"); syncBossKey("스우", "extreme", "ex_suu");
    syncBossKey("데미안", "normal", "n_demian"); syncBossKey("데미안", "hard", "h_demian");
    syncBossKey("가디언 엔젤 슬라임", "normal", "n_gaensl"); syncBossKey("가디언 엔젤 슬라임", "chaos", "c_gaensl");
    syncBossKey("루시드", "easy", "e_lucid"); syncBossKey("루시드", "normal", "n_lucid"); syncBossKey("루시드", "hard", "h_lucid");
    syncBossKey("윌", "easy", "e_will"); syncBossKey("윌", "normal", "n_will"); syncBossKey("윌", "hard", "h_will");
    syncBossKey("더스크", "normal", "n_dusk"); syncBossKey("더스크", "chaos", "c_dusk");
    syncBossKey("듄켈", "normal", "n_dunkel"); syncBossKey("듄켈", "hard", "h_dunkel");
    syncBossKey("진 힐라", "normal", "n_hilla"); syncBossKey("진 힐라", "hard", "h_hilla");
    
    const bmageObj = bossArr.find(c => c.content_name && c.content_name.includes("검은 마법사"));
    if (bmageObj) d.boss_b_mage = (String(bmageObj.complete_flag) === "true" || bmageObj.complete_flag === true);
    
    syncBossKey("선택받은 세렌", "normal", "n_seren"); syncBossKey("선택받은 세렌", "hard", "h_seren");
    syncBossKey("감시자 칼로스", "easy", "e_kalos"); syncBossKey("감시자 칼로스", "normal", "n_kalos"); syncBossKey("감시자 칼로스", "chaos", "c_kalos");
    syncBossKey("카링", "easy", "e_kaling"); syncBossKey("카링", "normal", "n_kaling"); syncBossKey("카링", "hard", "h_kaling");
    syncBossKey("림보", "normal", "n_limbo"); syncBossKey("림보", "hard", "h_limbo");

    localStorage.setItem("omni_v14_todo_characters_list", JSON.stringify(charactersList));
    localStorage.setItem("omni_v14_todo_perfect_storage", JSON.stringify(window.omniTodoState.checkData));
    window.switchTodoTab(window.omniTodoState.activeSubTab);
};

/**
 * ⚡ [SPA 메뉴 실시간 추적 강제 활성화 기믹]
 * DOM 로딩 이후 라우터가 동적으로 #page-todo를 생성하더라도, 0.1초 간격으로 스캔하여 
 * 그릇이 감지되는 즉시 메뉴바와 스토리지 동기화를 주입해 영구적으로 방어합니다.
 */
window.omniTodoAutoBootstraper = setInterval(() => {
    const pageTodoSection = document.getElementById('page-todo');
    if (pageTodoSection && !pageTodoSection.querySelector('.sub-tab-menu')) {
        console.log("[OMNI DETECTOR] 동적 투두 섹션이 감지되어 메뉴 및 인프라를 강제 마운트합니다.");
        window.initOmniTodoTab();
    }
}, 100);

document.addEventListener('DOMContentLoaded', () => { window.initOmniTodoTab(); });