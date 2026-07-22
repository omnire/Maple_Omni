/**
 * ============================================================================
 * 📑 MAPLE OMNI V14 - js/todo/js/todo_state.js [CORE ENGINE & ANTI-CRASH ARCHIVE]
 * 역할: 투두 시스템의 데이터 전역 관리, 공통 UI 컴포넌트 공급 및 캐시 소거/신규 API 채움 동기화
 * 수정사항: 스크립트 분할 환경에서 SAFE_FALLBACK_AVATAR를 window 속성으로 영구 승격하여 참조 유실 방지
 * 규칙: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 달아줍니다.
 * ============================================================================
 */

// [초보자 가이드] 모든 투두 서브 파일들이 공유할 전역 데이터 저장소(상태 구조체)를 선언합니다.
window.omniTodoState = {
    activeSubTab: "summary", // 기본적으로 최초 로딩 시 '요약' 탭이 활성화되도록 수정합니다.
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

    // HTML 코드 내부에 미리 박혀있거나 동적으로 유실된 메뉴 컴포넌트 틀 공간을 스캐닝합니다.
    let tabMenuWrapper = pageTodoSection.querySelector('.sub-tab-menu');
    if (!tabMenuWrapper) {
        tabMenuWrapper = document.createElement('div');
        tabMenuWrapper.className = 'sub-tab-menu';
    }

    // [강제 앵커링 교정 로직]: 타이틀(page-header)을 찾아서 바로 다음에 집어넣어 하단으로 가라앉는 버그를 파쇄합니다.
    const pageHeader = pageTodoSection.querySelector('.page-header');
    if (pageHeader) {
        pageTodoSection.insertBefore(tabMenuWrapper, pageHeader.nextSibling);
    } else {
        pageTodoSection.prepend(tabMenuWrapper);
    }

    // 5대 핵심 메뉴 단추 배열의 디자인 무대 소스를 마운트합니다.
    tabMenuWrapper.innerHTML = `
        <button class="tab-btn" onclick="window.switchTodoTab('summary')">📋 요약</button>
        <button class="tab-btn" onclick="window.switchTodoTab('planner')">📅 옴니 플래너</button>
        <button class="tab-btn" onclick="window.switchTodoTab('daily')">☀️ 일일 퀘스트</button>
        <button class="tab-btn" onclick="window.switchTodoTab('weekly')">📦 주간 퀘스트</button>
        <button class="tab-btn" onclick="window.switchTodoTab('boss')">😈 주간 보스</button>
    `;
    
    // 현재 전역 스토리지 상태에 기록된 활성화 서브 페이지로 강제 조율 스위칭합니다.
    window.switchTodoTab(window.omniTodoState.activeSubTab);
};

/**
 * 🔄 단일 웹 어플리케이션(SPA) 방식으로 하위 가변 서브 섹션을 투명하게 교체 토글하는 엔진입니다.
 */
window.switchTodoTab = function(tabId) {
    window.omniTodoState.activeSubTab = tabId;

    const pageTodoSection = document.getElementById('page-todo');
    if (pageTodoSection) {
        // 모든 메뉴 단추의 active 스타일 속성을 초기화한 후 선택된 단추에만 연보라색 포인트를 줍니다.
        pageTodoSection.querySelectorAll('.sub-tab-menu .tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(tabId)) {
                btn.classList.add('active');
            }
        });
    }

    // 전체 하위 컨테이너 방의 표출 클래스를 끄고 안의 돔 트리를 일시 클리어 파쇄합니다.
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

    // 선택 타겟이 된 전용 방을 전면 활성화 오픈합니다.
    const targetSection = document.getElementById(`todo-${tabId}`);
    if (targetSection) targetSection.classList.add('active');

    // 각 파일별 독립 모듈 렌더러 함수를 동적 호출 및 결합 연산합니다.
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

    // 등록된 모든 캐릭터 객체를 고속 선회하며 true 체크된 보스 결정석 시세를 실시간 연산 가산합니다.
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

    // 💡 갱신 버튼 클릭 시 저장된 갱신 시각을 즉시 불러와 UI에 적용합니다.
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
 * 🔲 단일 체크박스의 활성화 상태를 온오프 반전 토글 스위칭하는 공통 클릭 함수입니다.
 */
window.toggleTodoCheckboxElement = function(charId, objectKey) {
    const targetData = window.omniTodoState.checkData[charId];
    if (!targetData) return;
    targetData[objectKey] = !targetData[objectKey];
    localStorage.setItem("omni_v14_todo_perfect_storage", JSON.stringify(window.omniTodoState.checkData));
    window.switchTodoTab(window.omniTodoState.activeSubTab);
};

/**
 * ❌ 스케줄러 보드판에서 불필요해진 캐릭터 카드를 안전하게 필터링 삭제 제거하는 트래킹 파쇄기입니다.
 */
window.removeTodoCharacter = function(event, charId) {
    event.stopPropagation(); // 부모 엘리먼트로 클릭 이벤트가 퍼져나가는 현상을 락 차단합니다.
    if (!confirm("해당 캐릭터를 스케줄러 명단에서 제거하시겠습니까?")) return;
    localStorage.removeItem(`omni_v14_cached_char_${charId}`);
    window.omniTodoState.characters = window.omniTodoState.characters.filter(c => c.id !== charId);
    delete window.omniTodoState.checkData[charId];
    localStorage.setItem("omni_v14_todo_characters_list", JSON.stringify(window.omniTodoState.characters));
    localStorage.setItem("omni_v14_todo_perfect_storage", JSON.stringify(window.omniTodoState.checkData));
    window.switchTodoTab(window.omniTodoState.activeSubTab);
};

/**
 * 🛡️ [방어적 완료 여부 판별기] 신규 스케줄러 API의 정확한 완료 플래그 필드명이 아직 충분히
 *    검증되지 않아, 가능성 있는 필드명 후보들을 모두 확인합니다.
 */
function isOmniContentCleared(obj) {
    if (!obj) return false;
    return (
        obj.complete_flag === true || String(obj.complete_flag).toLowerCase() === "true" ||
        obj.clear_yn === "Y" || obj.clear_yn === "y" || obj.clear_yn === true ||
        obj.clear_status === true || obj.clear_status === "clear" ||
        obj.is_clear === true || String(obj.is_clear).toLowerCase() === "true" ||
        String(obj.quest_state) === "2" || String(obj.quest_state) === 2 ||
        (typeof obj.now_count === "number" && typeof obj.max_count === "number" && obj.max_count > 0 && obj.now_count >= obj.max_count)
    );
}

/**
 * 🛡️ [방어적 난이도 매칭기] "normal"/"hard" 같은 영문 값 외에 "노말"/"하드" 같은 한글 값,
 *    대소문자 차이까지 흡수하여 매칭합니다.
 */
const OMNI_DIFFICULTY_ALIASES = {
    easy: ['easy', 'e', '이지'],
    normal: ['normal', 'n', '노말'],
    hard: ['hard', 'h', '하드'],
    chaos: ['chaos', 'c', '카오스'],
    extreme: ['extreme', 'ex', '익스트림']
};
function omniMatchesDifficulty(rawDiff, targetDiff) {
    if (!rawDiff) return false;
    const norm = String(rawDiff).toLowerCase().trim();
    const aliases = OMNI_DIFFICULTY_ALIASES[targetDiff] || [targetDiff];
    return aliases.some(a => norm === a.toLowerCase());
}

/**
 * 📡 [핵심 수정] 넥슨 OpenAPI 통신 수급 완료 시 캐시를 파쇄하고 최신 데이터를 투두 원장 메모리에 채워넣는 연동 허브입니다.
 * 초보자 가이드:
 *  - 검색 또는 등록 시 apiHomework 데이터가 전달되지 않더라도, 넥슨 공식 스케줄러 API(/scheduler/character-state)를 
 *    자동으로 비동기 호출하여 일일/주간 퀘스트 및 보스 클리어 상태를 무결하게 동기화합니다.
 */
window.syncTodoCharacterOnSearch = async function(charName, basicInfo, apiHomework) {
    if (!charName || !charName.trim()) return;
    const cleanName = charName.trim();
    console.log(`[OMNI LINK V14] 캐시 소거 후 일퀘/주퀘/보스 무결점 동기화 가동 -> ${cleanName}`);

    // 🧹 1. [핵심 캐시 삭제] 전달받은 캐릭터의 이전 찌꺼기 캐시를 스토리지에서 즉시 파쇄합니다.
    localStorage.removeItem(`omni_v14_cached_char_${cleanName}`);

    // [초보자 가이드] basicInfo 매개변수가 다채로운 객체 구조로 전달될 수 있으므로 완벽히 방어 추출합니다.
    let realBasic = null;
    if (basicInfo && basicInfo.character_class) {
        realBasic = basicInfo;
    } else if (basicInfo && basicInfo.basic && basicInfo.basic.character_class) {
        realBasic = basicInfo.basic;
    } else if (window.currentSearchData && window.currentSearchData.basic) {
        realBasic = window.currentSearchData.basic;
    } else {
        try {
            const rawCache = localStorage.getItem(`omni_v14_cached_char_${cleanName}`) || localStorage.getItem('omni_last_active_search_data');
            if (rawCache) {
                const parsed = JSON.parse(rawCache);
                if (parsed && parsed.basic) realBasic = parsed.basic;
            }
        } catch(e) {
            console.error("[TODO STATE] 캐시 방어 파싱 실패:", e);
        }
    }

    // 전역 투두 상태 구조체 안전 보장
    if (!window.omniTodoState) window.omniTodoState = { characters: [], checkData: {} };
    if (!window.omniTodoState.characters) window.omniTodoState.characters = [];
    if (!window.omniTodoState.checkData) window.omniTodoState.checkData = {};

    // 💡 [중복 데이터 정리] 스케줄러 명단에 동일한 캐릭터가 중복으로 존재할 경우 완벽히 사전 정리(Deduplication)합니다.
    window.omniTodoState.characters = window.omniTodoState.characters.filter((char, index, self) =>
        index === self.findIndex((t) => (
            t.name.toLowerCase() === char.name.toLowerCase()
        ))
    );

    let charactersList = window.omniTodoState.characters;
    let targetChar = charactersList.find(c => (c.name || "").toLowerCase() === cleanName.toLowerCase() || (c.id || "").toLowerCase() === cleanName.toLowerCase());
    
    const fallbackImg = window.SAFE_FALLBACK_AVATAR || window.DASHBOARD_SAFE_AVATAR || "";

    const resolvedName = realBasic?.character_name || cleanName;
    const resolvedJob = realBasic?.character_class || "초보자";
    const resolvedLevel = realBasic?.character_level || 260;
    const resolvedImg = (realBasic?.character_image && !realBasic.character_image.includes("default.png")) ? realBasic.character_image : fallbackImg;

    if (!targetChar) {
        targetChar = { 
            id: resolvedName, 
            name: resolvedName, 
            job: resolvedJob, 
            level: resolvedLevel, 
            image: resolvedImg 
        };
        charactersList.push(targetChar);
        console.log(`[OMNI LINK V14] ✨ 새로 검색된 캐릭터 [${resolvedName}] 스케줄러 명단에 자동 등록 완료!`);
    } else {
        targetChar.name = resolvedName;
        targetChar.level = resolvedLevel || targetChar.level;
        targetChar.job = resolvedJob || targetChar.job;
        if (resolvedImg) targetChar.image = resolvedImg;
        console.log(`[OMNI LINK V14] 기존 캐릭터 [${resolvedName}] 최신 데이터 연동 동기화 완료`);
    }
    
    // 🧹 2. [기존 데이터 초기화 및 보존] 새 API 데이터를 채우기 전 해당 캐릭터의 완수 상태 객체를 완전히 초기화(새로운 캐시로 덮어쓰기)합니다.
    window.omniTodoState.checkData[resolvedName] = {}; 
    const d = window.omniTodoState.checkData[resolvedName];

    // 만약 apiHomework가 전달되지 않았거나 비어있다면, 캐시 또는 넥슨 공식 스케줄러 API를 통해 채웁니다.
    let activeApiHomework = apiHomework;
    if (!activeApiHomework || (!activeApiHomework.daily_contents && !activeApiHomework.weekly_contents && !activeApiHomework.boss_contents && !activeApiHomework.quest_list)) {
        try {
            // 1. 이미 저장되어 있는 검색 캐시 데이터에서 스케줄러 데이터나 ocid가 있는지 먼저 색인합니다.
            const rawCache = localStorage.getItem(`omni_v14_cached_char_${cleanName}`) || localStorage.getItem('omni_last_active_search_data');
            if (rawCache) {
                const parsed = JSON.parse(rawCache);
                if (parsed && (parsed.scheduler || parsed.apiHomework || parsed.quest_list)) {
                    activeApiHomework = parsed.scheduler || parsed.apiHomework || parsed;
                }
            }

            // 2. 캐시에 없다면 CORS 에러 방지를 위해 window.fetchFromNexon 게이트웨이를 사용하여 안전하게 스케줄러 API를 호출합니다.
            if (!activeApiHomework || (!activeApiHomework.daily_contents && !activeApiHomework.quest_list)) {
                let ocid = realBasic?.ocid;
                if (!ocid && window.currentSearchData && window.currentSearchData.ocid) {
                    ocid = window.currentSearchData.ocid;
                }
                
                if (ocid && typeof window.fetchFromNexon === 'function') {
                    const schedData = await window.fetchFromNexon('/scheduler/character-state', { ocid: ocid });
                    if (schedData) {
                        activeApiHomework = {
                            daily_contents: schedData.quest_list || schedData.daily_contents || [],
                            weekly_contents: schedData.weekly_quest_list || schedData.weekly_list || schedData.weekly_contents || [],
                            boss_contents: schedData.boss_list || schedData.boss_contents || []
                        };
                        console.log(`[OMNI LINK V14] 🔌 [${resolvedName}] API 게이트웨이를 통해 스케줄러 데이터를 성공적으로 수신했습니다.`);
                    }
                }
            }
        } catch (err) {
            console.error("[OMNI LINK V14] 스케줄러 API 자동 페치 중 예외 발생:", err);
        }
    }

    const dailyArr = activeApiHomework?.daily_contents || [];
    const weeklyArr = activeApiHomework?.weekly_contents || [];
    const bossArr = activeApiHomework?.boss_contents || [];

    if (dailyArr.length === 0 && weeklyArr.length === 0 && bossArr.length === 0) {
        console.warn(`[OMNI LINK V14] "${resolvedName}" 스케줄러 API 응답 데이터가 존재하지 않습니다. 기본 수동 체크 모드가 유지 연동됩니다.`);
    }

    if (d.daily_m_park === undefined) d.daily_m_park = 0;
    ['daily_cernium', 'daily_arcus', 'daily_odium', 'daily_shangrila', 'daily_arteria', 'daily_carcion', 'daily_talhart'].forEach(k => { if (d[k] === undefined) d[k] = false; });
    ['weekly_mountain', 'weekly_angeler'].forEach(k => { if (d[k] === undefined) d[k] = false; });

    const syncDailyKey = (keyword, objectKey) => {
        const target = dailyArr.find(c => (c.content_name && c.content_name.includes(keyword)) || (c.quest_name && c.quest_name.includes(keyword)));
        if (target) d[objectKey] = isOmniContentCleared(target);
    };
    
    syncDailyKey("세르니움", "daily_cernium");
    syncDailyKey("아르크스", "daily_arcus");
    syncDailyKey("오디움", "daily_odium");
    syncDailyKey("도원경", "daily_shangrila");
    syncDailyKey("아르테리아", "daily_arteria");
    syncDailyKey("카르시온", "daily_carcion");
    syncDailyKey("탈라하트", "daily_talhart");

    const mparkObj = dailyArr.find(c => (c.content_name && c.content_name.includes("몬스터파크")) || (c.quest_name && c.quest_name.includes("몬스터파크")));
    if (mparkObj) d.daily_m_park = mparkObj.now_count ?? mparkObj.count ?? 0;

    const syncWeeklyKey = (keyword, objectKey) => {
        const target = weeklyArr.find(c => (c.content_name && c.content_name.includes(keyword)) || (c.quest_name && c.quest_name.includes(keyword)));
        if (target) d[objectKey] = isOmniContentCleared(target) || (target.now_count && target.now_count > 0);
    };
    syncWeeklyKey("하이마운틴", "weekly_mountain");
    syncWeeklyKey("앵글러 컴퍼니", "weekly_angeler");

    const syncBossKey = (keyword, diff, objectKey) => {
        const target = bossArr.find(c => 
            ((c.content_name && c.content_name.includes(keyword)) || (c.boss_name && c.boss_name.includes(keyword))) && 
            omniMatchesDifficulty(c.difficulty || c.boss_difficulty, diff)
        );
        if (target) d[`boss_${objectKey}`] = isOmniContentCleared(target);
    };

    syncBossKey("스우", "normal", "n_suu");
    syncBossKey("스우", "hard", "h_suu");
    syncBossKey("스우", "extreme", "ex_suu");
    syncBossKey("데미안", "normal", "n_demian");
    syncBossKey("데미안", "hard", "h_demian");
    syncBossKey("가디언 엔젤 슬라임", "normal", "n_gaensl");
    syncBossKey("가디언 엔젤 슬라임", "chaos", "c_gaensl");
    syncBossKey("루시드", "easy", "e_lucid");
    syncBossKey("루시드", "normal", "n_lucid");
    syncBossKey("루시드", "hard", "h_lucid");
    syncBossKey("윌", "easy", "e_will");
    syncBossKey("윌", "normal", "n_will");
    syncBossKey("윌", "hard", "h_will");
    syncBossKey("더스크", "normal", "n_dusk");
    syncBossKey("더스크", "chaos", "c_dusk");
    syncBossKey("듄켈", "normal", "n_dunkel");
    syncBossKey("듄켈", "hard", "h_dunkel");
    syncBossKey("진 힐라", "normal", "n_hilla");
    syncBossKey("진 힐라", "hard", "h_hilla");
    
    const bmageObj = bossArr.find(c => (c.content_name && c.content_name.includes("검은 마법사")) || (c.boss_name && c.boss_name.includes("검은 마법사")));
    if (bmageObj) d.boss_b_mage = isOmniContentCleared(bmageObj);
    
    syncBossKey("선택받은 세렌", "normal", "n_seren");
    syncBossKey("선택받은 세렌", "hard", "h_seren");
    syncBossKey("감시자 칼로스", "easy", "e_kalos");
    syncBossKey("감시자 칼로스", "normal", "n_kalos");
    syncBossKey("감시자 칼로스", "chaos", "c_kalos");
    syncBossKey("카링", "easy", "e_kaling");
    syncBossKey("카링", "normal", "n_kaling");
    syncBossKey("카링", "hard", "h_kaling");
    syncBossKey("림보", "normal", "n_limbo");
    syncBossKey("림보", "hard", "h_limbo");

    // 3. [최신 데이터로 스토리지 보존 및 갱신 시각 즉시 반영]
    localStorage.setItem("omni_v14_todo_characters_list", JSON.stringify(charactersList));
    localStorage.setItem("omni_v14_todo_perfect_storage", JSON.stringify(window.omniTodoState.checkData));
    
    const nowFormatted = new Date().toLocaleString();
    localStorage.setItem("omni_last_refresh_time", nowFormatted); // 현재 갱신 시각 즉시 저장
    window.lastOmniRefreshedAt = nowFormatted;
    
    // 4. 대시보드 위젯 및 스케줄러 UI 실시간 재렌더링 호출
    if (typeof window.renderDashboardMainWidgets === 'function') {
        window.renderDashboardMainWidgets();
    }
    if (typeof window.switchTodoTab === 'function') {
        window.switchTodoTab(window.omniTodoState.activeSubTab);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.initOmniTodoTab === 'function') window.initOmniTodoTab();
});