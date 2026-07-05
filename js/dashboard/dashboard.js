/**
 * ============================================================================
 * 📑 MAPLE OMNI V14 - js/dashboard/dashboard.js [THEME 01: DEEP NAVY & ICE CLOUD]
 * 설명: 넥슨 OpenAPI(api.js) 실시간 데이터 및 메인 대시보드 레이아웃 동기화 관리 커널
 * 수정사양: 눈의 피로를 최소화하는 정밀 딥 네이비 & 소프트 아이스 블루 오버레이 콤비네이션
 * 가이드: 초보자도 완벽하게 코드를 독학할 수 있도록 친절하고 상세한 주석을 달아 생략 없이 작성함
 * ============================================================================
 */

// 💡 [초보자 가이드] 아바타 이미지를 불러오지 못할 때 대비하는 맑은 하늘빛 톤의 안전망 임베디드 그래픽 이미지입니다.
const DASHBOARD_SAFE_AVATAR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0YwRjlGRiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMwMjg0QzciIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIj5NQVBFTDwvdGV4dD48L3N2Zz4=";

/**
 * 🚪 [글로벌 액션] 로컬스토리지의 키를 파기하고 깔끔하게 인트로 첫 화면으로 강제 세션 셧다운하는 리로그 핸들러입니다.
 */
window.omniLogoutToIntro = function() {
    if (confirm("정말 로그아웃하고 인트로 화면으로 복귀하시겠습니까?")) {
        localStorage.removeItem("omni_api_key");
        window.location.reload();
    }
};

// ----------------------------------------------------------------------------
// 1. 좌측 사이드바 전용 시스템 관제탑 허브
// ----------------------------------------------------------------------------
window.renderSidebarProfileCard = function(data) {
    const sidebar = document.getElementById('characterCardContainer');
    if (!sidebar) return;

    if (data) return;

    sidebar.innerHTML = `
        <div class="sidebar-workspace-wrapper" style="background: #1E293B; border-radius: 12px; padding: 16px; border: 1px solid #334155;">
            <div class="workspace-notice-card">
                <div class="notice-badge-title" style="background: #0284C7; color: #fff; display: inline-block; padding: 2px 6px; font-size: 10px; font-weight: 800; border-radius: 4px; margin-bottom: 6px;">SYSTEM INTERFACE</div>
                <h4 style="color: #F8FAFC; margin: 0 0 6px 0; font-size: 14px; font-weight: 800;">OMNI CORE REGULATION</h4>
                <p style="color: #94A3B8; margin: 0; font-size: 12px; line-height: 1.5;">본 관제 콘솔은 넥슨 OpenAPI 아키텍처의 실시간 파싱 부하 규정을 준수하며 안전 필터 모드로 작동 중입니다.</p>
                
                <div class="workspace-meta-status" style="margin-top: 12px; display: flex; flex-direction: column; gap: 4px; border-top: 1px solid #334155; padding-top: 10px;">
                    <div class="meta-status-row" style="display: flex; justify-content: space-between; font-size: 11px;">
                        <span style="color: #64748B;">파싱 동기화 레벨</span>
                        <strong style="color: #38BDF8;">NORMAL SYSTEM</strong>
                    </div>
                    <div class="meta-status-row" style="display: flex; justify-content: space-between; font-size: 11px;">
                        <span style="color: #64748B;">보안 인프라 규격</span>
                        <strong style="color: #38BDF8;">SECURE SSL</strong>
                    </div>
                </div>
            </div>
            <div class="workspace-secure-anchor" style="margin-top: 12px; font-size: 11px; color: #38BDF8; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                <span class="pulse-emerald-dot" style="width: 6px; height: 6px; background: #10B981; border-radius: 50%; display: inline-block;"></span> INTEGRATED WORKSPACE ACTIVE
            </div>
        </div>
    `;
};

// ----------------------------------------------------------------------------
// 2. 🌐 [중요] api.js 실시간 인게임 데이터 동기화 브릿지 커널
// ----------------------------------------------------------------------------
window.syncTodoCharacterOnSearch = function(characterName, basic, homework) {
    console.log(`[OMNI LOG REGULATED] 수신 및 통합 완료 -> ${characterName}`);

    let savedCharsRaw = localStorage.getItem("omni_v14_todo_characters_list");
    let todoCharacters = savedCharsRaw ? JSON.parse(savedCharsRaw) : [];

    let existingChar = todoCharacters.find(c => c.name === characterName);
    
    if (existingChar) {
        existingChar.image = basic.character_image || existingChar.image;
        if (basic.character_level) existingChar.level = basic.character_level;
        if (basic.character_class) existingChar.job = basic.character_class;
    } else {
        todoCharacters.push({
            id: characterName,
            name: characterName,
            job: basic.character_class || "아델",
            level: basic.character_level || 280,
            image: basic.character_image || DASHBOARD_SAFE_AVATAR
        });
    }
    localStorage.setItem("omni_v14_todo_characters_list", JSON.stringify(todoCharacters));

    if (window.omniTodoState && window.omniTodoState.characters) {
        window.omniTodoState.characters = todoCharacters;
    }

    let savedChecksRaw = localStorage.getItem("omni_v14_todo_perfect_storage");
    let todoCheckData = savedChecksRaw ? JSON.parse(savedChecksRaw) : {};

    if (!todoCheckData[characterName]) {
        todoCheckData[characterName] = {};
    }
    const tgt = todoCheckData[characterName];

    tgt.daily_m_park = (homework && homework.daily_m_park !== undefined) ? homework.daily_m_park : (tgt.daily_m_park || 0);
    
    const dailyListKeys = ['daily_cernium', 'daily_arcus', 'daily_odium', 'daily_shangrila', 'daily_arteria', 'daily_carcion', 'daily_talhart'];
    dailyListKeys.forEach(k => {
        if (homework && homework[k] !== undefined) tgt[k] = !!homework[k];
        else if (tgt[k] === undefined) tgt[k] = false;
    });

    const bossListKeys = ["c_gaensl", "h_suu", "h_demian", "h_lucid", "h_will", "c_dusk", "h_dunkel", "h_hilla", "b_mage", "h_seren", "n_kalos", "n_kaling", "ex_suu"];
    bossListKeys.forEach(k => {
        const bKey = `boss_${k}`;
        const apiValue = (homework && (homework[bKey] !== undefined ? homework[bKey] : homework[k]));
        if (apiValue !== undefined) tgt[bKey] = !!apiValue;
        else if (tgt[bKey] === undefined) tgt[bKey] = false;
    });

    localStorage.setItem("omni_v14_todo_perfect_storage", JSON.stringify(todoCheckData));

    if (window.omniTodoState && window.omniTodoState.checkData) {
        window.omniTodoState.checkData = todoCheckData;
    }

    window.renderDashboardMainWidgets();
    if (window.omniTodoState && typeof window.switchTodoTab === 'function') {
        window.switchTodoTab(window.omniTodoState.activeSubTab);
    }

    const nameBadge = document.getElementById('lblLiveAttendanceCharBadge');
    if (nameBadge) nameBadge.innerText = characterName;
};

// ----------------------------------------------------------------------------
// 3. 우측 대시보드 위젯 통합 배치 엔진 (전체 레이아웃 마운터)
// ----------------------------------------------------------------------------
window.renderDashboardMainWidgets = function() {
    const container = document.getElementById('dashboardWidgets');
    if (!container) return;

    container.style.opacity = '0';

    const savedCharsRaw = localStorage.getItem("omni_v14_todo_characters_list");
    const savedChecksRaw = localStorage.getItem("omni_v14_todo_perfect_storage");
    
    const todoCharacters = savedCharsRaw ? JSON.parse(savedCharsRaw) : [];
    const todoCheckData = savedChecksRaw ? JSON.parse(savedChecksRaw) : {};

    let dailyResetHtml = "";

    if (todoCharacters.length === 0) {
        dailyResetHtml = `<div class="dashboard-empty-mini-alert" style="color: #64748B; font-size: 12px; text-align: center; padding: 20px 0;">등록된 캐릭터 내역이 없습니다.</div>`;
    } else {
        todoCharacters.forEach(char => {
            const data = todoCheckData[char.name] || todoCheckData[char.id] || {};

            const dailyKeys = ['daily_cernium', 'daily_arcus', 'daily_odium', 'daily_shangrila', 'daily_arteria', 'daily_carcion', 'daily_talhart'];
            let dailyDoneCount = 0;
            dailyKeys.forEach(key => { if (data[key] === true || data[key] === "true") dailyDoneCount++; });

            let mparkDoneCount = (data.daily_m_park === true || data.daily_m_park === "true" || parseInt(data.daily_m_park) >= 7) ? 1 : 0;

            const bossKeys = ['boss_c_gaensl', 'boss_h_suu', 'boss_h_demian', 'boss_h_lucid', 'boss_h_will', 'boss_c_dusk', 'boss_h_dunkel', 'boss_h_hilla', 'boss_b_mage', 'boss_h_seren', 'boss_n_kalos', 'boss_n_kaling', 'boss_ex_suu'];
            let bossDoneCount = 0;
            bossKeys.forEach(key => { if (data[key] === true || data[key] === "true") bossDoneCount++; });

            const dailyColor = dailyDoneCount === 7 ? '#10B981' : (dailyDoneCount > 0 ? '#F59E0B' : '#64748B');
            const mparkColor = mparkDoneCount === 1 ? '#10B981' : '#64748B';
            const bossColor = bossDoneCount === 13 ? '#10B981' : (bossDoneCount > 0 ? '#F59E0B' : '#64748B');

            let finalImageSrc = char.image || DASHBOARD_SAFE_AVATAR;
            if (window.currentSearchData && window.currentSearchData.basic) {
                if (window.currentSearchData.basic.character_name === char.name) {
                    finalImageSrc = window.currentSearchData.basic.character_image || finalImageSrc;
                }
            }

            dailyResetHtml += `
                <div class="daily-reset-char-row" style="display: flex; align-items: center; margin-bottom: 12px; background: #F8FAFC; padding: 8px; border-radius: 8px; border: 1px solid #E2E8F0;">
                    <div style="width: 44px; height: 44px; overflow: hidden; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: #fff; border: 1px solid #CBD5E1; flex-shrink: 0; margin-right: 12px;">
                        <img src="${finalImageSrc}" style="width: 44px; height: 44px; object-fit: contain; transform: scale(2.2); transform-origin: center center;" onerror="this.onerror=null; this.src='${DASHBOARD_SAFE_AVATAR}';">
                    </div>
                    <div style="flex: 1;">
                        <span style="font-weight: 800; font-size: 13px; color: #1E293B; display: block; margin-bottom: 4px;">${char.name}</span>
                        <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                            <span style="font-size: 10px; font-weight: 700; background: #fff; border: 1px solid ${dailyColor}; color: ${dailyColor}; padding: 1px 5px; border-radius: 4px;">일퀘 ${dailyDoneCount}/7</span>
                            <span style="font-size: 10px; font-weight: 700; background: #fff; border: 1px solid ${mparkColor}; color: ${mparkColor}; padding: 1px 5px; border-radius: 4px;">몬파 ${mparkDoneCount}/1</span>
                            <span style="font-size: 10px; font-weight: 700; background: #fff; border: 1px solid ${bossColor}; color: ${bossColor}; padding: 1px 5px; border-radius: 4px;">보스 ${bossDoneCount}/13</span>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    const huntingLogIntegrated = localStorage.getItem("omni_v14_hunting_integrated_log");
    const huntingLogNormal = localStorage.getItem("omni_v14_hunting_log");
    const targetSourceRaw = huntingLogIntegrated || huntingLogNormal;
    
    let livePureProfitMeso = 0;
    let liveHuntingTotalTime = "0분";

    if (targetSourceRaw) {
        try {
            const parsedLog = JSON.parse(targetSourceRaw);
            if (Array.isArray(parsedLog) && parsedLog.length > 0) {
                const currentSession = parsedLog[parsedLog.length - 1];
                livePureProfitMeso = currentSession.netProfit || currentSession.mesoProfit || 0;
                liveHuntingTotalTime = currentSession.duration || currentSession.huntingTime || "0분";
            } else if (parsedLog.today) {
                livePureProfitMeso = parsedLog.today.netProfit || 0;
                liveHuntingTotalTime = parsedLog.today.duration || "0분";
            }
        } catch (e) {
            console.error("[OMNI LIVE STATS] 스토리지 바인딩 에러 제어:", e);
        }
    }

    let liveItemDropRate = "0%";
    let liveMesoAcqRate = "0%";
    if (window.currentSearchData && window.currentSearchData.stat && window.currentSearchData.stat.final_stat) {
        const statsArray = window.currentSearchData.stat.final_stat;
        const dropData = statsArray.find(s => s.stat_name.includes("드롭"));
        const mesoData = statsArray.find(s => s.stat_name.includes("메소 획득"));
        if (dropData) liveItemDropRate = dropData.stat_value;
        if (mesoData) liveMesoAcqRate = mesoData.stat_value;
    }

    const savedMemosRaw = localStorage.getItem("omni_v14_dashboard_memos");
    let memoList = savedMemosRaw ? JSON.parse(savedMemosRaw) : [
        { text: "이번 주 고관비/경축비 도핑 재고 확인하기", date: "06.28" },
        { text: "목요일 리셋 전 결정석 정산 마감 필수", date: "06.27" }
    ];

    let memoRowsHtml = "";
    memoList.forEach((memo, index) => {
        memoRowsHtml += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; background: #F8FAFC; border-radius: 6px; margin-bottom: 6px; border: 1px solid #E2E8F0;">
                <div style="display: flex; align-items: center; gap: 6px; overflow: hidden; flex: 1;">
                    <span style="width: 4px; height: 4px; background: #0F172A; border-radius: 50%; flex-shrink: 0;"></span>
                    <p style="margin: 0; font-size: 12px; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${memo.text}</p>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0; margin-left: 8px;">
                    <span style="font-size: 10px; color: #94A3B8; background: #E2E8F0; padding: 1px 4px; border-radius: 3px;">${memo.date}</span>
                    <button onclick="window.deleteDashboardInlineMemo(${index})" style="background: none; border: none; color: #94A3B8; cursor: pointer; font-size: 14px; padding: 0 2px; font-weight: bold;">×</button>
                </div>
            </div>
        `;
    });

    const savedPlansRaw = localStorage.getItem("omni_v14_strategy_plans");
    let planList = savedPlansRaw ? JSON.parse(savedPlansRaw) : [
        { char: "전체 계정 공통", goal: "7월 대규모 여름 쇼케이스 전까지 50억 메소 비축", route: "본캐 일일 재획 및 부캐 카루타 라인 결정석 주간 풀 정산" },
        { char: "자두달", goal: "어센틱 심볼 세금 비축 및 275레벨 달성 계획", route: "카르시온 일일 퀘스트 및 하루 몬스터파크 익스프레스 7회 충전 판정 고정" }
    ];

    let planCardsHtml = "";
    planList.forEach((plan, index) => {
        planCardsHtml += `
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px; position: relative;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span style="font-size: 11px; font-weight: 800; background: #1E3A8A; color: #fff; padding: 2px 6px; border-radius: 4px;">🎯 ${plan.char}</span>
                    <button onclick="window.deleteStrategyPlan(${index})" style="background: none; border: 1px solid #CBD5E1; color: #64748B; font-size: 10px; padding: 2px 6px; border-radius: 4px; cursor: pointer; font-weight: 700;">삭제</button>
                </div>
                <h5 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 800; color: #1E293B;">${plan.goal}</h5>
                <p style="margin: 0; font-size: 11px; color: #64748B; line-height: 1.4;">${plan.route}</p>
            </div>
        `;
    });

    let charSelectOptions = `<option value="전체 계정 공통">전체 계정 공통</option>`;
    todoCharacters.forEach(c => {
        charSelectOptions += `<option value="${c.name}">${c.name}</option>`;
    });

    // 🧱 마스터 레이아웃 조립 (딥 네이비 피그먼트 스킨 사양)
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #1E3A8A; padding-left: 15px; margin-bottom: 25px; margin-top: -10px;">
            <h2 style="margin: 0; font-size: 20px; font-weight: 900; color: #0F172A; letter-spacing: -0.5px;">실시간 현황 대시보드</h2>
            <div style="display: flex; gap: 8px;">
                <button onclick="window.renderDashboardMainWidgets()" style="padding: 8px 14px; font-weight: 700; border-radius: 6px; cursor: pointer; border: 1px solid #1E3A8A; background: #F0F4FF; color: #1E3A8A; transition: all 0.2s; font-size: 12px;">
                    🔄 모듈 상태 새로고침
                </button>
                <button onclick="window.omniLogoutToIntro()" style="padding: 8px 14px; font-weight: 700; border-radius: 6px; cursor: pointer; border: 1px solid #FDA4AF; background: #FFF1F2; color: #E11D48; transition: all 0.2s; font-size: 12px;">
                    🚪 재로그인하기 (키 파기)
                </button>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;">
            <!-- 위젯 1: 이벤트 트래커 -->
            <div style="border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                <div style="padding-bottom: 10px; font-size: 12px; font-weight: 800; border-bottom: 1px solid #F1F5F9; margin-bottom: 12px; color: #1E3A8A; letter-spacing: 0.5px;">📅 EVENT TRACKER</div>
                <div style="margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px;">
                        <span style="font-weight: 700; color: #334155;">챌린저스 월드 시즌4</span>
                        <span style="font-size: 11px; color: #64748B;">~ 09.16</span>
                    </div>
                    <div style="height: 6px; background: #F1F5F9; border-radius: 4px; overflow: hidden;"><div style="width: 8%; height: 100%; background: #1E3A8A;"></div></div>
                </div>
                <div style="margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px;">
                        <span style="font-weight: 700; color: #334155;">몬스터파크 핸즈</span>
                        <span style="font-size: 11px; color: #0284C7;">~ 07.23</span>
                    </div>
                    <div style="height: 6px; background: #F1F5F9; border-radius: 4px; overflow: hidden;"><div style="width: 8%; height: 100%; background: #38BDF8;"></div></div>
                </div>
                <div style="border: 1px dashed #1E3A8A; padding: 10px; border-radius: 8px; background: #F5F8FF;">
                    <span style="margin-bottom: 2px; color: #1E3A8A; font-weight: 700; font-size: 11px; display: block;">⏳ 주간 초기화 잔여 시간</span>
                    <div id="dailyResetTimer" style="font-size: 15px; font-weight: 900; color: #334155; font-family: monospace;">00:00:00</div>
                </div>
            </div>

            <!-- 위젯 2: 초기화 현황 -->
            <div style="border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                <div style="padding-bottom: 10px; font-size: 12px; font-weight: 800; border-bottom: 1px solid #F1F5F9; margin-bottom: 12px; color: #1E3A8A; letter-spacing: 0.5px;">⏰ DAILY RESET STATUS</div>
                <div style="max-height: 145px; overflow-y: auto; padding-right: 2px;">
                    ${dailyResetHtml}
                </div>
            </div>

            <!-- 위젯 3: 라이브 스태츠 -->
            <div style="border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                <div style="padding-bottom: 10px; font-size: 12px; font-weight: 800; border-bottom: 1px solid #F1F5F9; margin-bottom: 12px; color: #1E3A8A; letter-spacing: 0.5px;">📊 OMNI LIVE STATS</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                    <div style="background: #F8FAFC; padding: 8px; border-radius: 6px; border: 1px solid #F1F5F9;">
                        <span style="font-size: 10px; color: #64748B; display: block; margin-bottom: 2px;">금일 파밍 순수익</span>
                        <div style="color: #1E3A8A; font-size: 13px; font-weight: 800;">+ ${livePureProfitMeso.toLocaleString()}</div>
                    </div>
                    <div style="background: #F8FAFC; padding: 8px; border-radius: 6px; border: 1px solid #F1F5F9;">
                        <span style="font-size: 10px; color: #64748B; display: block; margin-bottom: 2px;">오늘 누적 재획</span>
                        <div style="color: #475569; font-size: 13px; font-weight: 800;">${liveHuntingTotalTime}</div>
                    </div>
                </div>
                <div style="background: #F0F4FF; border: 1px solid #DDBDF8; padding: 8px; border-radius: 8px; display: flex; flex-direction: column; gap: 4px;">
                    <div style="font-size: 11px; color: #1E3A8A; font-weight: 700;">✨ 아이템 드롭율: <span style="font-weight: 800;">${liveItemDropRate}</span></div>
                    <div style="font-size: 11px; color: #1E3A8A; font-weight: 700;">💰 메소 획득량: <span style="font-weight: 800;">${liveMesoAcqRate}</span></div>
                </div>
            </div>
        </div>

        <div style="display: flex; gap: 14px; margin-top: 14px;">
            <!-- 서브 섹션 1: 이벤트 및 메모장 -->
            <div style="flex: 1.2; display: flex; flex-direction: column; gap: 14px;">
                <div style="border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; background: #fff;">
                    <div style="font-weight: 800; color: #1E3A8A; margin-bottom: 10px; font-size: 12px; letter-spacing: 0.5px;">📸 CURRENT EVENTS</div>
                    <div id="eventSlider" style="position: relative; overflow: hidden; width: 100%;">      
                        <div id="eventTrack" style="display: flex; transition: transform 0.4s ease-in-out; width: 100%;">
                            <a href="https://maplestory.nexon.com/News/Event/Ongoing/1353" target="_blank" style="flex: 0 0 25%; max-width: 25%; padding: 0 4px; box-sizing: border-box; text-decoration: none;">
                                <div style="border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; background: #F8FAFC;">
                                    <div style="height: 65px; overflow: hidden;"><img src="assets/event/event1.png" style="width: 100%; height: 100%; object-fit: cover;"></div>
                                    <div style="padding: 6px;"><div style="font-size: 11px; font-weight: 800; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">치지직 드롭스</div></div>
                                </div>
                            </a>
                            <a href="https://maplestory.nexon.com/News/Event" target="_blank" style="flex: 0 0 25%; max-width: 25%; padding: 0 4px; box-sizing: border-box; text-decoration: none;">
                                <div style="border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; background: #F8FAFC;">
                                    <div style="height: 65px; overflow: hidden;"><img src="assets/event/event2.png" style="width: 100%; height: 100%; object-fit: cover;"></div>
                                    <div style="padding: 6px;"><div style="font-size: 11px; font-weight: 800; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">챌린저스 월드4</div></div>
                                </div>
                            </a>
                            <a href="https://maplestory.nexon.com/News/Event" target="_blank" style="flex: 0 0 25%; max-width: 25%; padding: 0 4px; box-sizing: border-box; text-decoration: none;">
                                <div style="border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; background: #F8FAFC;">
                                    <div style="height: 65px; overflow: hidden;"><img src="assets/event/event3.png" style="width: 100%; height: 100%; object-fit: cover;"></div>
                                    <div style="padding: 6px;"><div style="font-size: 11px; font-weight: 800; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">메이린 격파</div></div>
                                </div>
                            </a>
                            <a href="https://maplestory.nexon.com/News/Event" target="_blank" style="flex: 0 0 25%; max-width: 25%; padding: 0 4px; box-sizing: border-box; text-decoration: none;">
                                <div style="border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; background: #F8FAFC;">
                                    <div style="height: 65px; overflow: hidden;"><img src="assets/event/event4.png" style="width: 100%; height: 100%; object-fit: cover;"></div>
                                    <div style="padding: 6px;"><div style="font-size: 11px; font-weight: 800; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">버닝 PLUS</div></div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
                
                <div style="border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; background: #fff;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div style="color: #475569; font-weight: 800; font-size: 12px; letter-spacing: 0.5px;">📝 USER IMPORTANT MEMOS</div>
                        <div style="display: flex; gap: 4px;">
                            <input type="text" id="dashboardMemoInput" placeholder="중요 메모 사항 입력..." style="border: 1px solid #CBD5E1; padding: 4px 8px; border-radius: 4px; font-size: 12px; outline: none; width: 170px;">
                            <button onclick="window.addDashboardInlineMemo()" style="background: #1E3A8A; border: none; color: #fff; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-weight: 700; font-size: 12px;">등록</button>
                        </div>
                    </div>
                    <div style="max-height: 105px; overflow-y: auto;">
                        ${memoRowsHtml ? memoRowsHtml : '<div class="dashboard-empty-mini-alert" style="font-size:11px; color:#94A3B8; text-align:center;">등록된 중요 메모가 없습니다.</div>'}
                    </div>
                </div>
            </div>

            <!-- 서브 섹션 2: 인게임 공지 및 패치 공지 -->
            <div style="flex: 1; display: flex; flex-direction: column; gap: 14px;">
                <div style="border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; background: #fff; flex: 1;">
                    <div style="font-weight: 800; color: #475569; margin-bottom: 10px; font-size: 12px; letter-spacing: 0.5px;">📢 MAPLESTORY NOTICES</div>
                    <div style="max-height: 100px; overflow-y: auto;">
                        <a href="https://maplestory.nexon.com/News/Notice" target="_blank" style="display: flex; align-items: center; gap: 6px; padding: 5px 0; text-decoration: none; font-size: 11px; border-bottom: 1px solid #F1F5F9;">
                            <span style="background: #FEE2E2; color: #EF4444; padding: 2px 6px; border-radius: 4px; font-weight: 700;">점검</span>
                            <p style="margin: 0; color: #334155; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">정기 데이터 인프라 안정화 점검 안내</p>
                        </a>
                        <a href="https://maplestory.nexon.com/News/Event" target="_blank" style="display: flex; align-items: center; gap: 6px; padding: 5px 0; text-decoration: none; font-size: 11px;">
                            <span style="background: #FEF3C7; color: #D97706; padding: 2px 6px; border-radius: 4px; font-weight: 700;">이벤트</span>
                            <p style="margin: 0; color: #334155; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">여름 시즌 '솔 에르다의 축복' 재화 정산 공지</p>
                        </a>
                    </div>
                </div>

                <div style="border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; background: #fff; flex: 1;">
                    <div style="font-weight: 800; color: #1E3A8A; margin-bottom: 10px; font-size: 12px; letter-spacing: 0.5px;">🚀 OMNI SYSTEM UPDATES</div>
                    <div style="max-height: 100px; overflow-y: auto;">
                        <div style="display: flex; align-items: center; gap: 6px; padding: 5px 0; font-size: 11px; border-bottom: 1px solid #F1F5F9;">
                            <span style="background: #E0F2FE; color: #0369A1; padding: 2px 6px; border-radius: 4px; font-weight: 700;">V14.8</span>
                            <p style="margin: 0; color: #334155; flex: 1;">[인증] 유효 규격 외 우회 필터 엔진 추가 탑재</p>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px; padding: 5px 0; font-size: 11px;">
                            <span style="background: #E0F2FE; color: #0369A1; padding: 2px 6px; border-radius: 4px; font-weight: 700;">V14.7</span>
                            <p style="margin: 0; color: #334155; flex: 1;">[테마] 고가독성 프리미엄 네이비 커스텀 아키텍처 활성화</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 하단 장기 계획 플래너 섹션 -->
        <div style="margin-top: 14px;">
            <div style="border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; background: #fff;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; border-bottom: 1px solid #F1F5F9; padding-bottom: 12px; margin-bottom: 12px;">
                    <div>
                        <div style="background: #F0F4FF; color: #1E3A8A; border: 1px solid #1E3A8A; display: inline-block; padding: 2px 6px; font-size: 10px; font-weight: 800; border-radius: 4px; margin-bottom: 4px;">GROWTH ENGINE</div>
                        <h3 style="margin: 0; font-size: 14px; font-weight: 800; color: #1E293B;">📅 OMNI STRATEGY PLANNER (캐릭터 장기 운영 계획서)</h3>
                    </div>
                    
                    <div style="display: flex; gap: 6px; align-items: center;">
                        <select id="plannerCharSelect" style="border: 1px solid #CBD5E1; padding: 5px; border-radius: 6px; outline: none; background: #fff; font-weight: 700; color: #475569; font-size: 12px;">
                            ${charSelectOptions}
                        </select>
                        <input type="text" id="plannerGoalInput" placeholder="운영 목표 입력" style="border: 1px solid #CBD5E1; padding: 5px; border-radius: 6px; outline: none; font-size: 12px; width: 140px;">
                        <input type="text" id="plannerRouteInput" placeholder="수행 루트 입력" style="border: 1px solid #CBD5E1; padding: 5px; border-radius: 6px; outline: none; font-size: 12px; width: 210px;">
                        <button onclick="window.addStrategyPlan()" style="padding: 6px 12px; font-weight: 700; border: none; color: #fff; background: #1E3A8A; border-radius: 6px; cursor: pointer; font-size: 12px;">계획 수립</button>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    ${planCardsHtml}
                </div>
            </div>
        </div>
    `;

    setTimeout(() => { container.style.opacity = '1'; }, 50);
};

// ----------------------------------------------------------------------------
// 4. 인라인 메모 및 플래너 데이터 제어 엔진
// ----------------------------------------------------------------------------
window.addDashboardInlineMemo = function() {
    const input = document.getElementById('dashboardMemoInput');
    if (!input || !input.value.trim()) return;
    const savedMemosRaw = localStorage.getItem("omni_v14_dashboard_memos");
    let memoList = savedMemosRaw ? JSON.parse(savedMemosRaw) : [];
    const now = new Date();
    const currentMonthDay = String(now.getMonth() + 1).padStart(2, '0') + "." + String(now.getDate()).padStart(2, '0');
    memoList.unshift({ text: input.value.trim(), date: currentMonthDay });
    localStorage.setItem("omni_v14_dashboard_memos", JSON.stringify(memoList));
    window.renderDashboardMainWidgets();
};

window.deleteDashboardInlineMemo = function(index) {
    const savedMemosRaw = localStorage.getItem("omni_v14_dashboard_memos");
    if (!savedMemosRaw) return;
    let memoList = JSON.parse(savedMemosRaw);
    memoList.splice(index, 1);
    localStorage.setItem("omni_v14_dashboard_memos", JSON.stringify(memoList));
    window.renderDashboardMainWidgets();
};

window.addStrategyPlan = function() {
    const charSelect = document.getElementById('plannerCharSelect');
    const goalInput = document.getElementById('plannerGoalInput');
    const routeInput = document.getElementById('plannerRouteInput');
    if (!goalInput || !routeInput || !goalInput.value.trim() || !routeInput.value.trim()) {
        alert("운영 목표와 세부 수행 루트를 모두 작성해야 정밀한 계획 수립이 시작됩니다.");
        return;
    }
    const savedPlansRaw = localStorage.getItem("omni_v14_strategy_plans");
    let planList = savedPlansRaw ? JSON.parse(savedPlansRaw) : [];
    planList.unshift({ char: charSelect.value, goal: goalInput.value.trim(), route: routeInput.value.trim() });
    localStorage.setItem("omni_v14_strategy_plans", JSON.stringify(planList));
    window.renderDashboardMainWidgets(); 
};

window.deleteStrategyPlan = function(index) {
    const savedPlansRaw = localStorage.getItem("omni_v14_strategy_plans");
    if (!savedPlansRaw) return;
    let planList = JSON.parse(savedPlansRaw);
    planList.splice(index, 1);
    localStorage.setItem("omni_v14_strategy_plans", JSON.stringify(planList));
    window.renderDashboardMainWidgets();
};

function initEventSlider() {
    const track = document.getElementById('eventTrack');
    const slider = document.getElementById('eventSlider');
    if (!track || !slider) return;
    let index = 0;
    const totalItems = track.children.length;
    const visibleItems = 4;
    if (totalItems <= visibleItems) return;
    function autoSlide() {
        index = index + 1;
        if (index > totalItems - visibleItems) { index = 0; }
        track.style.transform = `translateX(-${index * 25}%)`;
    }
    let slideInterval = setInterval(autoSlide, 3000);
    slider.addEventListener('mouseenter', () => clearInterval(slideInterval));
    slider.addEventListener('mouseleave', () => slideInterval = setInterval(autoSlide, 3000));
}

window.startDailyResetTimer = function() {
    function updateResetTimer() {
        const now = new Date();
        const nextThursday = new Date();
        nextThursday.setDate(now.getDate() + (4 + 7 - now.getDay()) % 7);
        nextThursday.setHours(0, 0, 0, 0);
        if (now.getDay() === 4 && now.getHours() >= 0) { nextThursday.setDate(nextThursday.getDate() + 7); }
        const diff = nextThursday - now;
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        const timerEl = document.getElementById('dailyResetTimer');
        if (timerEl) { timerEl.innerText = `${d}일 ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; }
    }
    if (window.timerInterval) clearInterval(window.timerInterval);
    window.timerInterval = setInterval(updateResetTimer, 1000);
    updateResetTimer();
};

document.addEventListener('DOMContentLoaded', () => {
    const activeKey = localStorage.getItem("omni_api_key");
    if (activeKey && typeof window.validateNexonApiKeyFormat === 'function') {
        if (!window.validateNexonApiKeyFormat(activeKey)) {
            localStorage.removeItem("omni_api_key");
            alert("⚠️ 비정상 키 접근 감지: 인트로로 리라우팅됩니다.");
            window.location.reload();
            return;
        }
    }
    window.renderSidebarProfileCard(null);
    window.renderDashboardMainWidgets();
    initEventSlider();
    window.startDailyResetTimer();
});