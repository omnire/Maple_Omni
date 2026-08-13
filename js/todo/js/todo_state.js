/**
 * ============================================================================
 * 📑 MAPLE OMNI V14 - js/todo/js/todo_state.js [CORE STATE & UI ENGINE]
 * 역할: 투두 시스템 전역 데이터 상태 관리, UI 템플릿 공급, 탭 전환 및 초기화
 * 규칙: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 달아줍니다.
 * ============================================================================
 */

// [초보자 가이드] 모든 투두 서브 파일들이 공유할 전역 데이터 저장소(상태 구조체)를 선언합니다.
window.omniTodoState = {
    activeSubTab: "summary", // 기본적으로 최초 로딩 시 '요약' 탭이 활성화되도록 설정합니다.
    characters: [],          // 유저가 검색창을 통해 동기화하여 등록한 캐릭터 객체들이 배열로 누적됩니다.
    
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
    
    // 📈 플래너 내부에서 차트를 그리기 위한 최근 7일간의 경험치 획득 시뮬레이션 빅데이터입니다.
    mockExpHistory: {
        "dates": ["06-25", "06-26", "06-27", "06-28", "06-29", "06-30", "07-01"],
        "amounts": [135000000000, 148000000000, 110000000000, 225000000000, 195000000000, 140000000000, 175000000000]
    }
};

// [초보자 가이드] 다른 독립 스크립트에서도 두루 참조할 수 있게 window 영역에 동적으로 주입 선언합니다.
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

    // 💡 [타이틀 전용 디자인] 본문 내 서브 메뉴를 제거하고 깔끔한 타이틀 카드만 주입합니다.
    let pageHeader = pageTodoSection.querySelector('.page-header');
    if (!pageHeader) {
        pageHeader = document.createElement('div');
        pageHeader.className = 'page-header';
        pageHeader.style.cssText = "display: flex; align-items: center; gap: 8px; background: #ffffff; padding: 10px 16px; border-radius: 12px; margin-bottom: 12px; border: 1px dashed #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.02);";
        pageHeader.innerHTML = `
            <div style="width: 28px; height: 28px; border-radius: 6px; background: #f3e8ff; display: flex; align-items: center; justify-content: center; font-size: 13px;">📋</div>
            <div>
                <h2 style="margin: 0; font-size: 13.5px; font-weight: 800; color: var(--omni-text-main, #1e293b); letter-spacing: -0.3px;">주간 숙제 및 보스 정산 시스템</h2>
                <p style="margin: 1px 0 0 0; font-size: 10.5px; font-weight: 500; color: var(--omni-text-sub, #64748b);">캐릭터별 숙제 수행 현황 및 보스 결정석 정산을 한눈에 관리하세요.</p>
            </div>
        `;
        pageTodoSection.prepend(pageHeader);
    }

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
 * ✨ [메뉴 통합 및 완벽 방어형 트래킹 제어 기능] 
 * 일체형으로 합쳐진 상단 카드 내부의 서브 메뉴 탭 버튼 레이아웃을 구성합니다.
 */
window.renderTodoSubTabHeaders = function() {
    const pageTodoSection = document.getElementById('page-todo');
    if (!pageTodoSection) return;

    // 상단 드롭다운 메뉴 시스템으로 이관되어 활성 서브 탭 스위칭만 실행합니다.
    window.switchTodoTab(window.omniTodoState.activeSubTab);
};

/**
 * 🔄 단일 웹 어플리케이션(SPA) 방식으로 하위 가변 서브 섹션을 투명하게 교체 토글하는 엔진입니다.
 */
window.switchTodoTab = function(tabId) {
    window.omniTodoState.activeSubTab = tabId;

    const pageTodoSection = document.getElementById('page-todo');
    if (pageTodoSection) {
        // 💡 [일일 퀘스트 페이지 전용 예외 처리] 'daily' 탭일 때는 상단 공통 타이틀 박스를 숨기고, 다른 탭에서는 정상 노출합니다.
        const globalHeader = pageTodoSection.querySelector(':scope > .page-header');
        if (globalHeader) {
            globalHeader.style.display = (tabId === 'daily') ? 'none' : 'flex';
        }

        document.querySelectorAll('#todoDropdownMenu button').forEach(btn => {
            btn.style.background = 'transparent';
            btn.style.color = '#475569';
            if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(tabId)) {
                btn.style.background = '#f3e8ff';
                btn.style.color = '#7c3aed';
            }
        });
    }

    ['summary', 'planner', 'daily', 'weekly', 'boss'].forEach(t => {
        let sect = document.getElementById(`todo-${t}`);
        if (!sect) {
            sect = document.createElement('div');
            sect.id = `todo-${t}`;
            sect.className = 'sub-section';
            if (pageTodoSection) pageTodoSection.appendChild(sect);
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

    const lastRefreshed = localStorage.getItem("omni_last_refresh_time") || "갱신 기록 없음";

    return `
        <div class="workspace-notice-card" style="width: 100%; margin-bottom: 16px; border-left: 5px solid #8b5cf6; background: #fdfbfe; padding: 14px 18px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="font-weight: 800; color: #6d28d9; font-size: 13px; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                <span>💡 실시간 스케줄러 동기화 패널 <span style="font-size: 11px; color: #8b5cf6; margin-left: 4px;">(최근 갱신: ${lastRefreshed})</span></span>
            </div>
            <p style="margin: 0; font-size: 12px; color: #4b5563; line-height: 1.5; font-weight: 500;">
                인게임 숙제 수행 후 <strong style="color: #8b5cf6;">[API 데이터 즉시 갱신]</strong> 버튼을 누르면 기존 캐시 데이터를 완전히 소거한 후 최신 API 응답 데이터로 자동 재구성되어 정밀 반영됩니다!
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
 * ☀️ 몬스터파크의 일일 수행 횟수(최대 7회)를 마우스 클릭 방식으로 누적 가산하는 인터랙션 제어문입니다.
 * 초보자 가이드: 셀프 체크모드가 꺼져있을 경우 수동 조작을 차단하고 안내창을 띄웁니다.
 */
window.incrementMonsterParkCounter = function(charId) {
    const targetData = window.omniTodoState.checkData[charId];
    if (!targetData) return;

    // 💡 [셀프 체크모드 보안 가이드] 편집모드가 활성화된 캐릭터만 수동으로 몬스터파크 횟수를 변경할 수 있습니다.
    if (!targetData.selfCheckMode) {
        alert("⚠️ [자동 연동 모드] 본 페이지는 API 자동 연동이 원칙입니다.\n수동으로 횟수를 변경하시려면 캐릭터 카드 우측 상단의 [⚙️ 편집모드] 버튼을 눌러 셀프 체크모드를 켜주세요.");
        return;
    }

    let current = parseInt(targetData.daily_m_park || 0, 10);
    current++; if (current > 7) current = 0; 
    targetData.daily_m_park = current;
    localStorage.setItem("omni_v14_todo_perfect_storage", JSON.stringify(window.omniTodoState.checkData));
    window.switchTodoTab(window.omniTodoState.activeSubTab);
};

/**
 * 🔲 단일 체크박스의 활성화 상태를 온오프 반전 토글 스위칭하는 공통 클릭 함수입니다.
 * 초보자 가이드: 셀프 체크모드 플래그를 검사하여 수동 체크 허용 여부를 결정합니다.
 */
window.toggleTodoCheckboxElement = function(charId, objectKey) {
    const targetData = window.omniTodoState.checkData[charId];
    if (!targetData) return;

    // 💡 [셀프 체크모드 보안 가이드] 편집모드가 켜져있지 않으면 체크박스 수동 조작을 차단합니다.
    if (!targetData.selfCheckMode) {
        alert("⚠️ [자동 연동 모드] 본 페이지는 API 자동 연동이 원칙입니다.\n수동으로 체크를 변경하시려면 캐릭터 카드 우측 상단의 [⚙️ 편집모드] 버튼을 눌러 셀프 체크모드를 켜주세요.");
        return;
    }

    targetData[objectKey] = !targetData[objectKey];
    localStorage.setItem("omni_v14_todo_perfect_storage", JSON.stringify(window.omniTodoState.checkData));
    window.switchTodoTab(window.omniTodoState.activeSubTab);
};

/**
 * ❌ 스케줄러 보드판에서 불필요해진 캐릭터 카드를 안전하게 필터링 삭제 제거하는 트래킹 파쇄기입니다.
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

// [초보자 가이드] DOM 로드가 완료되면 초기화 및 창을 열 때마다 로딩창 없이 자동 API 갱신을 백그라운드에서 실행합니다.
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.initOmniTodoTab === 'function') window.initOmniTodoTab();
    
    // 💡 [초보자 가이드] 첫 접속 및 새로고침 시 false를 전달하여 화면 가림(로딩 UI) 없이 백그라운드에서 최신 API 데이터를 갱신합니다.
    if (typeof window.triggerOmniApiRefresh === 'function') {
        window.triggerOmniApiRefresh(false);
    }
});