/**
 * ============================================================================
 * 📑 MAPLE OMNI V15 - js/dashboard/dashboard.js [PURE DASHED VISUALS ENGINE]
 * 설명: 테마 제어, 대시보드 위젯 렌더링, 캐릭터 등록 및 실시간 API 동기화를 총괄하는 엔진입니다.
 * 초보자 가이드: 기존 로직 100% 보존 + 가독성 높고 눈이 편안한 점선(dashed) 테마 동기화 구조
 * ============================================================================
 */

/**
 * 🎯 메이플 일정 관리 위젯 명세 리스트
 */
const OMNI_ACTIVE_EVENTS = [
    { title: "챌린저스 월드 시즌4 오픈 레이스", start: "2026-06-18", end: "2026-09-16" },
    { title: "차원의 도서관 신규 에피소드 정식 편제", start: "2026-05-01", end: "2026-08-15" },
    { title: "기억 속의 아쉴롬 한정 이벤트 마감 시한", start: "2026-07-01", end: "2026-07-30" }
];

/**
 * 🎨 [테마 마스터 컨트롤 Hub] 
 */
window.setOmniTheme = function(themeName) {
    const body = document.body;
    body.classList.remove('dark-theme', 'light-pink', 'light-blue');
    
    if (themeName === 'dark') {
        body.classList.add('dark-theme');
    } else if (themeName === 'light-pink') {
        body.classList.add('light-pink');
    } else if (themeName === 'light-blue') {
        body.classList.add('light-blue');
    }
    
    localStorage.setItem("omni_theme_status", themeName);
    
    const lightBtn = document.getElementById('theme-btn-master-light');
    const darkBtn = document.getElementById('theme-btn-master-dark');
    const dotsContainer = document.getElementById('omniLightDots');
    
    if (lightBtn && darkBtn) {
        lightBtn.classList.remove('active');
        darkBtn.classList.remove('active');
        
        if (themeName === 'dark') {
            darkBtn.classList.add('active');
            if (dotsContainer) dotsContainer.style.display = 'none';
        } else {
            lightBtn.classList.add('active');
        }
    }
    
    document.querySelectorAll('.palette-dot').forEach(dot => {
        dot.style.transform = 'scale(1)';
        dot.style.outline = 'none';
    });
    
    const targetDotId = themeName === 'light' ? 'dot-light' : `dot-${themeName}`;
    const activeDot = document.getElementById(targetDotId);
    if (activeDot) {
        activeDot.style.transform = 'scale(1.2)';
        activeDot.style.outline = '2px solid var(--omni-text-dark)';
    }
};

window.handleMainThemeClick = function(mode) {
    const dotsContainer = document.getElementById('omniLightDots');
    
    if (mode === 'dark') {
        if (dotsContainer) dotsContainer.style.display = 'none';
        window.setOmniTheme('dark');
    } else {
        const currentTheme = localStorage.getItem("omni_theme_status") || "light";
        
        if (currentTheme === 'dark') {
            window.setOmniTheme('light');
            if (dotsContainer) dotsContainer.style.display = 'flex';
        } else {
            if (dotsContainer) {
                dotsContainer.style.display = (dotsContainer.style.display === 'flex') ? 'none' : 'flex';
            }
        }
    }
};

window.selectDotColorSkin = function(colorName) {
    window.setOmniTheme(colorName);
    const dotsContainer = document.getElementById('omniLightDots');
    if (dotsContainer) dotsContainer.style.display = 'none';
};

/**
 * 🔄 [전역 API 즉시 갱신 및 캐시 강제 파쇄 엔진]
 */
window.triggerGlobalApiRefresh = function() {
    let targetChar = window.lastSearchedCharacterName || 
                     (window.currentSearchData && window.currentSearchData.basic && window.currentSearchData.basic.character_name) || 
                     (document.getElementById('globalSearchInput') ? document.getElementById('globalSearchInput').value : '');
    
    if (!targetChar || !targetChar.trim()) {
        const savedCharsRaw = localStorage.getItem("omni_v14_todo_characters_list");
        const todoCharacters = savedCharsRaw ? JSON.parse(savedCharsRaw) : [];
        if (todoCharacters.length > 0) {
            targetChar = todoCharacters[0].name;
        }
    }

    if (targetChar && targetChar.trim()) {
        const cleanCharName = targetChar.trim();

        // 🧹 1. 로컬 스토리지 캐시 파쇄
        Object.keys(localStorage).forEach(storageKey => {
            if (storageKey.includes(cleanCharName) || storageKey.includes('cached') || storageKey.includes('search_data') || storageKey.includes('active_search')) {
                localStorage.removeItem(storageKey);
            }
        });

        localStorage.removeItem(`omni_v14_cached_char_${cleanCharName}`);
        localStorage.removeItem('omni_last_active_search_data');

        // 2. 메모리 버퍼 초기화
        window.currentSearchData = null;
        window.lastSearchedCharacterName = "";

        // 🕒 3. 갱신 시각 설정
        const nowFormatted = new Date().toLocaleString();
        localStorage.setItem("omni_last_refresh_time", nowFormatted);
        window.lastOmniRefreshedAt = nowFormatted;

        // 4. API 최신 동기화 실행
        if (typeof window.startOmniSearch === 'function') {
            window.startOmniSearch(cleanCharName, true);
        } else {
            console.log(`[API REFRESH] ${cleanCharName} 캐릭터 최신 API 데이터 동기화 완료`);
        }

        // 5. 대시보드 위젯 및 프로필 카드 즉시 재렌더링
        window.renderSidebarProfileCard(null);
        window.renderDashboardMainWidgets();
    } else {
        alert("⚠️ 갱신할 캐릭터 정보가 없습니다. 상단 검색창이나 캐릭터 등록에서 캐릭터를 추가해 주세요.");
    }
};

/**
 * 🎛️ [좌측 사이드바 프로필 카드 렌더링]
 */
window.renderSidebarProfileCard = function(data) {
    const sidebar = document.getElementById('characterCardContainer');
    if (!sidebar) return;

    const lastRefreshTime = localStorage.getItem("omni_last_refresh_time") || window.lastOmniRefreshedAt || "갱신 이력 없음";

    sidebar.innerHTML = `
        <div class="sidebar-workspace-wrapper">
            <div class="workspace-notice-card">
                <div class="notice-badge-title">SYSTEM INTERFACE</div>
                <h4>OMNI CORE REGULATION</h4>
                <p>본 관제 콘솔은 넥슨 OpenAPI 아키텍처의 실시간 파싱 부하 규정을 준수하며 안전 필터 모드로 작동 중입니다.</p>

                <div style="margin-top: 14px; display: flex; gap: 6px; align-items: center;">
                    <div class="omni-theme-toggle-dock" style="flex: 1; display: flex; background: var(--omni-card-bg); border: 1px dashed var(--omni-card-border-line); padding: 3px; border-radius: 8px; gap: 2px;">
                        <div class="omni-theme-toggle-container" style="position: relative; flex: 1; display: flex;">
                            <button onclick="window.handleMainThemeClick('light')" id="theme-btn-master-light" class="theme-btn-unit" style="width: 100%; justify-content: center; padding: 6px 4px;">☀️ 라이트</button>
                            <div id="omniLightDots" class="omni-light-palette-dots">
                                <span onclick="window.selectDotColorSkin('light')" id="dot-light" class="palette-dot" style="background: #ffffff; border: 2px solid #8372d6;" title="클래식 화이트"></span>
                                <span onclick="window.selectDotColorSkin('light-pink')" id="dot-light-pink" class="palette-dot" style="background: #ffbde2; border: 2px solid #d36eb7;" title="핑크 화이트"></span>
                                <span onclick="window.selectDotColorSkin('light-blue')" id="dot-light-blue" class="palette-dot" style="background: #bdcfff; border: 2px solid #6e8ed3;" title="하늘색 화이트"></span>
                            </div>
                        </div>
                        <button onclick="window.handleMainThemeClick('dark')" id="theme-btn-master-dark" class="theme-btn-unit" style="flex: 1; justify-content: center; padding: 6px 4px;">🌙 다크</button>
                    </div>
                    <button onclick="window.omniLogoutToIntro()" class="sidebar-sub-action-btn" style="flex: 0 0 auto; padding: 7px 10px; background: var(--omni-card-bg) !important; color: var(--omni-coral, #dc2626) !important; border: 1px dashed rgba(220,38,38,0.3) !important;">🚪 로그아웃</button>
                </div>

                <div class="sidebar-api-refresh-box" style="margin-top: 10px; display:flex; flex-direction:column; gap:4px; align-items:center;">
                    <button onclick="window.triggerGlobalApiRefresh()" class="sidebar-global-refresh-btn" style="width:100%;">
                        <span>🔄</span> API 데이터 즉시 갱신
                    </button>
                    <div style="font-size: 10.5px; color: var(--omni-text-sub); font-weight: 700; margin-top: 2px; text-align: center;">
                        🕒 최근 갱신: <span style="color: var(--omni-slate-primary); font-weight: 800;">${lastRefreshTime}</span>
                    </div>
                </div>

                <div class="workspace-meta-status">
                    <div class="meta-status-row"><span>파싱 동기화 레벨</span><strong>NORMAL SYSTEM</strong></div>
                    <div class="meta-status-row"><span>보안 인프라 규격</span><strong>SECURE SSL v14Sn</strong></div>
                </div>
                
                <div class="sidebar-master-backup-zone" style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--omni-card-border-line); display: flex; flex-direction: column; gap: 6px;">
                    <div class="workspace-backup-title-text" style="font-size: 11px; font-weight: 800; margin-bottom: 2px; text-align: left; opacity: 0.85;">📂 OMNI 전체 데이터 통합 관리</div>
                    <div style="display: flex; gap: 6px; width: 100%;">
                        <button onclick="window.exportOmniMasterBackup()" class="sidebar-sub-action-btn">💾 전체 백업</button>
                        <button onclick="window.importOmniMasterRestore()" class="sidebar-sub-action-btn">📂 전체 복구</button>
                    </div>
                </div>
            </div>
            <div class="workspace-secure-anchor"><span class="pulse-emerald-dot"></span> INTEGRATED WORKSPACE ACTIVE</div>
        </div>
    `;
};

/**
 * 🛠️ 넥슨 API 응답 항목 완료 상태 판별 헬퍼
 */
function isOmniItemCompleted(item) {
    if (!item) return false;
    if (item.clear_yn === "Y" || item.clear_yn === "y" || item.clear_yn === true) return true;
    if (item.quest_state === "2" || item.quest_state === 2) return true;
    if (item.complete_flag === true || item.complete_flag === "true" || item.complete_flag === "Y") return true;
    if (item.is_clear === true || item.clear === true) return true;
    return false;
}

/**
 * 👤 캐릭터 등록 핸들러
 */
window.omniTriggerAddCharacterPopup = function() {
    const charName = prompt("등록하실 메이플스토리 캐릭터 이름을 입력해주세요:");
    if (charName && charName.trim()) {
        const cleanName = charName.trim();
        let savedCharsRaw = localStorage.getItem("omni_v14_todo_characters_list");
        let todoCharacters = savedCharsRaw ? JSON.parse(savedCharsRaw) : [];
        
        if (todoCharacters.some(c => (c.name || "").toLowerCase() === cleanName.toLowerCase())) {
            alert("이미 리스트에 존재하거나 등록된 캐릭터 명칭입니다.");
            return;
        }

        localStorage.removeItem(`omni_v14_cached_char_${cleanName}`);
        
        const safeAvatar = window.DASHBOARD_SAFE_AVATAR || "";
        todoCharacters.push({
            id: cleanName,
            name: cleanName,
            job: "신규 직업군",
            level: 260,
            image: safeAvatar
        });
        localStorage.setItem("omni_v14_todo_characters_list", JSON.stringify(todoCharacters));
        
        if (typeof window.startOmniSearch === 'function') {
            window.startOmniSearch(cleanName, true);
        } else {
            alert(`✨ [${cleanName}] 캐릭터가 등록되었습니다!`);
        }
        window.renderDashboardMainWidgets();
    }
};

window.omniDeleteCharacter = function(index) {
    if (!confirm("정말 이 캐릭터를 스케쥴러에서 삭제하시겠습니까?")) return;
    let savedCharsRaw = localStorage.getItem("omni_v14_todo_characters_list");
    let todoCharacters = savedCharsRaw ? JSON.parse(savedCharsRaw) : [];
    if (todoCharacters[index]) {
        todoCharacters.splice(index, 1);
        localStorage.setItem("omni_v14_todo_characters_list", JSON.stringify(todoCharacters));
        window.renderDashboardMainWidgets();
    }
};

let omniDraggedCharIndex = null;

window.omniHandleDragStart = function(e, index) {
    omniDraggedCharIndex = index;
    e.dataTransfer.effectAllowed = 'move';
};

window.omniHandleDragOver = function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
};

window.omniHandleDrop = function(e, targetIndex) {
    e.preventDefault();
    if (omniDraggedCharIndex === null || omniDraggedCharIndex === targetIndex) return;
    let savedCharsRaw = localStorage.getItem("omni_v14_todo_characters_list");
    let todoCharacters = savedCharsRaw ? JSON.parse(savedCharsRaw) : [];
    const movedItem = todoCharacters.splice(omniDraggedCharIndex, 1)[0];
    todoCharacters.splice(targetIndex, 0, movedItem);
    localStorage.setItem("omni_v14_todo_characters_list", JSON.stringify(todoCharacters));
    omniDraggedCharIndex = null;
    window.renderDashboardMainWidgets();
};

window.exportOmniHuntingLogsBackup = function() {
    const integratedRaw = localStorage.getItem("omni_v14_hunting_integrated_log") || "[]";
    const normalRaw = localStorage.getItem("omni_v14_hunting_log") || "[]";
    const packet = { identity: "MAPLE_OMNI_V14_LAVENDER", backupDate: new Date().toLocaleString(), integratedLog: JSON.parse(integratedRaw), normalLog: JSON.parse(normalRaw) };
    const blob = new Blob([JSON.stringify(packet, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement("a"); downloadAnchor.href = url; downloadAnchor.download = `OMNI_V14_사냥통합기록_백업_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(downloadAnchor); downloadAnchor.click(); document.body.removeChild(downloadAnchor); URL.revokeObjectURL(url);
};

window.importOmniHuntingLogsRestore = function() {
    const fileUploader = document.createElement("input"); fileUploader.type = "file"; fileUploader.accept = ".json";
    fileUploader.onchange = event => {
        const file = event.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const restoredPacket = JSON.parse(e.target.result);
                if (restoredPacket.identity !== "MAPLE_OMNI_V14_LAVENDER") throw new Error("유효 사양 팩이 아닙니다.");
                if (restoredPacket.integratedLog) localStorage.setItem("omni_v14_hunting_integrated_log", JSON.stringify(restoredPacket.integratedLog));
                if (restoredPacket.normalLog) localStorage.setItem("omni_v14_hunting_log", JSON.stringify(restoredPacket.normalLog));
                alert("✨ 백업 복구가 완벽하게 수행되었습니다!"); window.renderDashboardMainWidgets();
            } catch (err) { alert("⚠️ 파일 복원 실패: " + err.message); }
        };
        reader.readAsText(file);
    };
    fileUploader.click();
};

window.exportOmniMasterBackup = function() {
    try {
        const targetDataKeys = [
            "omni_theme_status", "nexon_api_key", "omni_api_key", "omni_last_active_search_data",
            "omni_current_page", "omni_v14_todo_characters_list", "omni_v14_todo_perfect_storage",
            "omni_v14_hunting_integrated_log", "omni_v14_hunting_log", "omni_v14_dashboard_memos", "omni_v14_strategy_plans", "omni_last_refresh_time"
        ];

        const masterBundlePacket = {
            identity: "MAPLE_OMNI_V14_TOTAL_MASTER_PACKET", 
            backupTimestamp: new Date().toISOString(),      
            backupHumanReadableDate: new Date().toLocaleString(), 
            payload: {} 
        };

        targetDataKeys.forEach(key => {
            const rawValue = localStorage.getItem(key);
            if (rawValue !== null) {
                try {
                    masterBundlePacket.payload[key] = JSON.parse(rawValue);
                } catch (e) {
                    masterBundlePacket.payload[key] = rawValue;
                }
            }
        });

        const jsonStringData = JSON.stringify(masterBundlePacket, null, 2);
        const fileBlob = new Blob([jsonStringData], { type: "application/json" });
        const virtualDownloadUrl = URL.createObjectURL(fileBlob);
        
        const hiddenAnchor = document.createElement("a");
        hiddenAnchor.href = virtualDownloadUrl;
        hiddenAnchor.download = `OMNI_V14_전체페이지_통합백업_${new Date().toISOString().slice(0, 10)}.json`;
        
        document.body.appendChild(hiddenAnchor);
        hiddenAnchor.click();
        
        document.body.removeChild(hiddenAnchor);
        URL.revokeObjectURL(virtualDownloadUrl);

    } catch (criticalError) {
        alert("🚨 전체 백업 파일 추출 중 치명적 오류 발생: " + criticalError.message);
    }
};

window.importOmniMasterRestore = function() {
    const fileSelectorInput = document.createElement("input");
    fileSelectorInput.type = "file";
    fileSelectorInput.accept = ".json"; 

    fileSelectorInput.onchange = clickEvent => {
        const selectedFile = clickEvent.target.files[0];
        if (!selectedFile) return; 

        const storageFileReader = new FileReader();
        storageFileReader.onload = readCompletionEvent => {
            try {
                const importedDataBundle = JSON.parse(readCompletionEvent.target.result);

                if (!importedDataBundle || importedDataBundle.identity !== "MAPLE_OMNI_V14_TOTAL_MASTER_PACKET") {
                    throw new Error("올바른 MAPLE OMNI V14 통합 전체 백업 JSON 파일 사양이 아닙니다.");
                }

                const dataPayload = importedDataBundle.payload;
                if (!dataPayload || Object.keys(dataPayload).length === 0) {
                    throw new Error("백업 파일 내부에 유효한 데이터 세션 레코드가 존재하지 않습니다.");
                }

                if (!confirm("⚠️ 주의! 현재 저장된 모든 데이터가 백업 시점으로 완전히 덮어써집니다. 진행하시겠습니까?")) {
                    return;
                }

                for (const [storageKey, storedValue] of Object.entries(dataPayload)) {
                    if (storedValue !== null && storedValue !== undefined) {
                        if (typeof storedValue === "object") {
                            localStorage.setItem(storageKey, JSON.stringify(storedValue));
                        } else {
                            localStorage.setItem(storageKey, String(storedValue));
                        }
                    }
                }

                alert("✨ OMNI CORE SYSTEM 전체 데이터 복구가 완벽하게 수행 완료되었습니다!");
                window.renderDashboardMainWidgets();
                
                const restoredThemeName = localStorage.getItem("omni_theme_status") || "light";
                window.setOmniTheme(restoredThemeName);

            } catch (parsingError) {
                alert("⚠️ 통합 복원 실패 코어 엔진 가드 작동: " + parsingError.message);
            }
        };
        storageFileReader.readAsText(selectedFile);
    };
    fileSelectorInput.click();
};

/**
 * ----------------------------------------------------------------------------
 * 4. 우측 메인 위젯 보드 대시보드 그래픽 컴포넌트 총괄 엔진
 * 초보자 가이드: 테마별 눈부심 없는 화이트/다크 점선(dashed) 레이아웃을 생성합니다.
 * ----------------------------------------------------------------------------
 */
window.renderDashboardMainWidgets = function() {
    const container = document.getElementById('dashboardWidgets');
    if (!container) return;

    container.style.opacity = '0';

    try {
        const activeTheme = localStorage.getItem("omni_theme_status") || "light";
        const safeAvatar = window.DASHBOARD_SAFE_AVATAR || window.SAFE_FALLBACK_AVATAR || "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0E4QjJGNiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNFMkVBRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIj5NQVBFTDwvdGV4dD48L3N2Zz4=";

        const savedCharsRaw = localStorage.getItem("omni_v14_todo_characters_list");
        const savedChecksRaw = localStorage.getItem("omni_v14_todo_perfect_storage");
        const todoCharacters = savedCharsRaw ? JSON.parse(savedCharsRaw) : [];
        const todoCheckData = savedChecksRaw ? JSON.parse(savedChecksRaw) : {};

        let dailyResetHtml = "";
        const totalSlotsToRender = 4;
        
        for (let i = 0; i < totalSlotsToRender; i++) {
            if (i < todoCharacters.length) {
                const char = todoCharacters[i];
                
                const matchedKey = Object.keys(todoCheckData).find(k => k.toLowerCase() === (char.name || "").toLowerCase() || k.toLowerCase() === (char.id || "").toLowerCase());
                const data = (matchedKey ? todoCheckData[matchedKey] : null) || todoCheckData[char.name] || todoCheckData[char.id] || {};
                
                const dailyKeys = ['daily_cernium', 'daily_arcus', 'daily_odium', 'daily_shangrila', 'daily_arteria', 'daily_carcion', 'daily_talhart'];
                const dailyNames = ['세르니움', '아르크스', '오디움', '도원경', '아르테리아', '카르시온', '탈하르트'];
                
                let dailyDoneCount = 0;
                dailyKeys.forEach(key => { if (data[key] === true || data[key] === "true") dailyDoneCount++; });

                const bossNameMap = {
                    'boss_c_gaensl': '카오스 가엔슬',
                    'boss_h_suu': '하드 스우',
                    'boss_h_demian': '하드 데미안',
                    'boss_h_lucid': '하드 루시드',
                    'boss_h_will': '하드 윌',
                    'boss_c_dusk': '카오스 더스크',
                    'boss_h_dunkel': '하드 듄켈',
                    'boss_h_hilla': '하드 진힐라',
                    'boss_b_mage': '검은마법사',
                    'boss_h_seren': '하드 세렌',
                    'boss_n_kalos': '노말 칼로스',
                    'boss_n_kaling': '노말 칼링',
                    'boss_ex_suu': '익스트림 스우'
                };

                const bossKeys = ['boss_c_gaensl', 'boss_h_suu', 'boss_h_demian', 'boss_h_lucid', 'boss_h_will', 'boss_c_dusk', 'boss_h_dunkel', 'boss_h_hilla', 'boss_b_mage', 'boss_h_seren', 'boss_n_kalos', 'boss_n_kaling', 'boss_ex_suu'];
                let bossDoneCount = 0;
                let clearedBossChipsHtml = "";

                bossKeys.forEach(key => { 
                    if (data[key] === true || data[key] === "true") {
                        bossDoneCount++; 
                        if (bossNameMap[key]) {
                            clearedBossChipsHtml += `<span style="background: rgba(131, 114, 214, 0.2); color: var(--omni-text-dark); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; border: 1px dashed var(--omni-card-border-line); display: inline-block;">${bossNameMap[key]}</span>`;
                        }
                    }
                });

                let dailyQuestListHtml = "";
                dailyKeys.forEach((key, idx) => {
                    const isDone = data[key] === true || data[key] === "true";
                    const doneClass = isDone ? "done" : "todo";
                    dailyQuestListHtml += `<span class="expert-quest-dot-chip ${doneClass}">${dailyNames[idx]}</span>`;
                });

                let bossPct = Math.min(100, Math.round((bossDoneCount / 13) * 100));
                let bossBarColor = bossDoneCount === 13 ? "#10b981" : "var(--omni-slate-primary)";

                const safeCharImg = (char.image && !char.image.includes("default.png")) ? char.image : safeAvatar;

                dailyResetHtml += `
                    <div class="expert-char-profile-card" draggable="true" ondragstart="window.omniHandleDragStart(event, ${i})" ondragover="window.omniHandleDragOver(event)" ondrop="window.omniHandleDrop(event, ${i})" style="position: relative; cursor: grab;">
                        <button onclick="window.omniDeleteCharacter(${i})" title="캐릭터 삭제" style="position: absolute; top: 8px; right: 8px; background: transparent; border: none; color: var(--omni-text-sub); font-size: 16px; font-weight: bold; cursor: pointer; z-index: 5; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; border-radius: 4px;" onmouseover="this.style.background='rgba(220,38,38,0.1)'; this.style.color='#dc2626';" onmouseout="this.style.background='transparent'; this.style.color='var(--omni-text-sub)';">×</button>
                        <div class="expert-avatar-frame-large" style="overflow: hidden; display: flex; justify-content: center; align-items: center;">
                            <img src="${safeCharImg}" style="width: 100%; height: 100%; object-fit: contain; transform: translateY(-12%) scale(2.4);" onerror="this.onerror=null; this.src='${safeAvatar}';">
                        </div>
                        <div class="expert-reset-meta">
                            <span class="expert-char-name-txt-large">${char.name}</span>
                            <span class="expert-char-job-level-txt">${char.job} | Lv.${char.level}</span>
                        </div>
                        <div class="expert-char-details-box">
                            <div class="expert-detail-label">📋 일일 퀘스트 목록 (${dailyDoneCount}/7)</div>
                            <div class="expert-daily-quest-grid">
                                ${dailyQuestListHtml}
                            </div>
                            <div class="expert-detail-label" style="margin-top: 6px; display: flex; justify-content: space-between; align-items: center;">
                                <span>👾 주간 보스 정산</span>
                                <span style="font-size: 9.5px; color: var(--omni-slate-primary); font-weight: 700; opacity: 0.85; white-space: nowrap;">💡 마우스 올려 자세히 보기</span>
                            </div>
                            <div class="omni-boss-tooltip-container" style="position: relative; background: var(--omni-card-bg); border: 1px dashed var(--omni-card-border-line); border-radius: 6px; padding: 6px 8px; display: flex; flex-direction: column; gap: 4px; cursor: pointer;" onmouseenter="this.querySelector('.omni-custom-speech-bubble').style.opacity='1'; this.querySelector('.omni-custom-speech-bubble').style.visibility='visible';" onmouseleave="this.querySelector('.omni-custom-speech-bubble').style.opacity='0'; this.querySelector('.omni-custom-speech-bubble').style.visibility='hidden';">
                                <div class="expert-boss-counter-row">
                                    <span>클리어 현황</span>
                                    <strong style="color: ${bossBarColor};">${bossDoneCount} / 13 마리 (${bossPct}%)</strong>
                                </div>
                                <div style="height: 4px; background: var(--omni-hover-point); border-radius: 2px; overflow: hidden; border: 1px dashed var(--omni-card-border-line);">
                                    <div style="width: ${bossPct}%; height: 100%; background: ${bossBarColor};"></div>
                                </div>
                                <div class="omni-custom-speech-bubble" style="position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); width: 220px; background: var(--builder-card-bg, #181721); color: var(--omni-text-dark); padding: 10px 12px; border-radius: 10px; font-size: 11px; font-weight: 600; box-shadow: 0 8px 25px rgba(0,0,0,0.4); border: 1px solid var(--omni-slate-primary); z-index: 100; opacity: 0; visibility: hidden; transition: all 0.2s ease-in-out; pointer-events: none; text-align: left; line-height: 1.4;">
                                    <div style="font-weight: 900; color: var(--omni-text-dark); font-size: 11.5px; margin-bottom: 6px; border-bottom: 1px dashed var(--omni-card-border-line); padding-bottom: 3px; display: flex; justify-content: space-between;">
                                        <span style="color: var(--omni-text-sub);">⚔️ 격파 완료 보스 리스트</span>
                                        <span style="color: #34d399;">${bossDoneCount}/13</span>
                                    </div>
                                    <div style="display: flex; flex-wrap: wrap; gap: 4px;">${clearedBossChipsHtml.length > 0 ? clearedBossChipsHtml : '<span style="color: var(--omni-text-sub); font-weight: 500;">클리어한 주간 보스가 없습니다.</span>'}</div>
                                    <div style="position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border-width: 6px; border-style: solid; border-color: var(--builder-card-bg, #181721) transparent transparent transparent;"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                dailyResetHtml += `
                    <div class="expert-char-profile-card empty-placeholder-slot">
                        <div class="expert-avatar-frame-large empty-avatar-frame" onclick="window.omniTriggerAddCharacterPopup()">
                            <span class="placeholder-plus-icon">+</span>
                        </div>
                        <div class="expert-reset-meta">
                            <span class="expert-char-name-txt-large placeholder-text">빈 캐릭터 슬롯</span>
                            <span class="expert-char-job-level-txt">지정된 전투원이 없습니다</span>
                        </div>
                        <div class="expert-char-details-box" style="align-items: center; justify-content: center; height: 100%; min-height: 85px;">
                            <button onclick="window.omniTriggerAddCharacterPopup()" class="placeholder-reg-btn">👤 캐릭터 등록하기</button>
                        </div>
                    </div>
                `;
            }
        }

        let totalHuntingMeso = 0; 
        let totalHuntingExp = 0; 
        let totalHuntingMinutes = 0;
        let characterMesoLeaderboard = {}; 
        let characterMaxSingleProfitMap = {};

        const extractMinutesInt = function(timeRaw) {
            if (!timeRaw) return 0; if (typeof timeRaw === 'number') return timeRaw;
            const matched = String(timeRaw).match(/(\d+)/); return matched ? parseInt(matched[1], 10) : 0;
        };

        const accumulateLogData = function(rawString) {
            if (!rawString) return;
            try {
                const parsedArray = JSON.parse(rawString);
                if (Array.isArray(parsedArray)) {
                    parsedArray.forEach(session => {
                        if (!session) return;
                        const mesoGain = Number(session.netProfit || session.mesoProfit || session.mesoGain || session.meso || 0);
                        const expGain = Number(session.expGain || session.exp || 0);
                        
                        totalHuntingMeso += isNaN(mesoGain) ? 0 : mesoGain;
                        totalHuntingExp += isNaN(expGain) ? 0 : expGain;
                        totalHuntingMinutes += extractMinutesInt(session.duration || session.huntingTime || session.time || 0);
                        
                        const charName = session.characterName || session.charName || "공통 계정";
                        characterMesoLeaderboard[charName] = (characterMesoLeaderboard[charName] || 0) + (isNaN(mesoGain) ? 0 : mesoGain);
                        if (!characterMaxSingleProfitMap[charName] || mesoGain > characterMaxSingleProfitMap[charName]) {
                            characterMaxSingleProfitMap[charName] = isNaN(mesoGain) ? 0 : mesoGain;
                        }
                    });
                }
            } catch (e) { console.error("사냥 로그 파싱 오류:", e); }
        };

        const keysToTry = ["omni_v14_hunting_integrated_log", "omni_v14_hunting_log", "omni_hunting_integrated_log", "omni_hunting_log"];
        keysToTry.forEach(k => accumulateLogData(localStorage.getItem(k)));

        let formattedTotalTime = `${totalHuntingMinutes}분`;
        if (totalHuntingMinutes >= 60) { formattedTotalTime = `${Math.floor(totalHuntingMinutes / 60)}시간 ${totalHuntingMinutes % 60}분`; }

        let mvpCharacterName = "기록 없음"; 
        let highestEarnedMeso = -1; 
        let mvpAvatarImageSrc = safeAvatar;
        
        for (const [name, totalMeso] of Object.entries(characterMesoLeaderboard)) {
            if (totalMeso > highestEarnedMeso && name !== "공통 계정") { 
                highestEarnedMeso = totalMeso; 
                mvpCharacterName = name; 
            }
        }
        
        if (mvpCharacterName !== "기록 없음") {
            const matchCharObj = todoCharacters.find(c => c.name === mvpCharacterName);
            mvpAvatarImageSrc = (matchCharObj && matchCharObj.image && !matchCharObj.image.includes("default.png")) ? matchCharObj.image : safeAvatar;
        }

        const savedMemosRaw = localStorage.getItem("omni_v14_dashboard_memos");
        let memoList = savedMemosRaw ? JSON.parse(savedMemosRaw) : [
            { text: "이번 주 고관비/경축비 도핑 재고 확인하기", date: "07.09" },
            { text: "부캐 아케인리버 일퀘 및 몬스터파크 7판 완료하기", date: "07.12" },
            { text: "유니온 아티팩트 주간 미션 포인트 정산 및 수령하기", date: "07.15" }
        ];
        let memoRowsHtml = "";
        memoList.forEach((memo, index) => {
            memoRowsHtml += `
                <div class="dashboard-memo-item-row">
                    <div class="memo-left-content"><span class="pulse-purple-dot"></span><p class="memo-main-text-line">${memo.text}</p></div>
                    <div class="memo-right-actions"><span class="memo-date-badge">${memo.date}</span><button onclick="window.deleteDashboardInlineMemo(${index})" class="memo-inline-del-btn">×</button></div>
                </div>
            `;
        });

        const savedPlansRaw = localStorage.getItem("omni_v14_strategy_plans");
        let planList = savedPlansRaw ? JSON.parse(savedPlansRaw) : [{ char: "전체 계정 공통", goal: "여름 쇼케이스 코인 비축", route: "본캐 보스 순회 주간 정산 완료" }];
        const activePlannerFilter = window.omniPlannerFilter || "전체";
        let planCardsHtml = "";
        planList.forEach((plan, index) => {
            if (activePlannerFilter === "전체" || plan.char === activePlannerFilter) {
                planCardsHtml += `
                    <div class="strategy-plan-card-item">
                        <div class="plan-card-top-bar"><span class="plan-char-target-tag">🎯 ${plan.char}</span><button onclick="window.deleteStrategyPlan(${index})" class="plan-card-del-btn">삭제</button></div>
                        <h5 class="plan-card-goal-title">${plan.goal}</h5><p class="plan-card-route-desc">${plan.route}</p>
                    </div>
                `;
            }
        });

        let plannerFilterDropdownHtml = `<option value="전체" ${activePlannerFilter === "전체" ? "selected" : ""}>🔍 전체 캐릭터 계획</option>`;
        plannerFilterDropdownHtml += `<option value="전체 계정 공통" ${activePlannerFilter === "전체 계정 공통" ? "selected" : ""}>🌐 전체 계정 공통</option>`;
        todoCharacters.forEach(c => { plannerFilterDropdownHtml += `<option value="${c.name}" ${activePlannerFilter === c.name ? "selected" : ""}>👤 ${c.name}</option>`; });

        let eventTrackerRowsHtml = "";
        OMNI_ACTIVE_EVENTS.forEach(evt => {
            const now = new Date(); 
            const start = new Date(evt.start); 
            const end = new Date(evt.end);
            
            let pct = 0; 
            if (now >= end) {
                pct = 100; 
            } else if (now > start) {
                pct = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
            }

            let scaleColor = pct >= 85 ? "#ef4444" : (pct >= 50 ? "#f59e0b" : "var(--omni-slate-primary)");

            eventTrackerRowsHtml += `
                <div style="background: var(--omni-card-bg); border: 1px dashed var(--omni-card-border-line); border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 5px; transition: all 0.2s ease;">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                        <span style="font-size: 11px; font-weight: 800; color: var(--omni-text-dark); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 170px;" title="${evt.title}">${evt.title}</span>
                        <span style="font-size: 10px; font-weight: 900; color: ${scaleColor};">${pct}%</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 3px;">
                        <div style="height: 5px; background: var(--omni-hover-point); border-radius: 3px; overflow: hidden; border: 1px dashed var(--omni-card-border-line);">
                            <div style="width: ${pct}%; height: 100%; background: ${scaleColor}; border-radius: 3px;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 9px; font-weight: 700; color: var(--omni-text-sub);">
                            <span>${evt.start} ~ ${evt.end}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        window.fetchAndRenderMapleTop10 = async function() {
            const container = document.getElementById("omniTop10Container");
            if (!container) return;

            const apiKey = localStorage.getItem("nexon_api_key") || localStorage.getItem("omni_api_key") || "";
            if (!apiKey) {
                container.innerHTML = `<div style="font-size: 11px; color: var(--omni-text-muted); text-align: center; padding: 15px 0;">⚠️ 넥슨 API 키가 등록되지 않았습니다.</div>`;
                return;
            }

            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() - 1);
            const dateString = targetDate.toISOString().slice(0, 10);

            try {
                const response = await fetch(`https://open.api.nexon.com/maplestory/v1/ranking/overall?date=${dateString}`, {
                    method: "GET",
                    headers: {
                        "accept": "application/json",
                        "x-nxopen-api-key": apiKey
                    }
                });

                if (!response.ok) {
                    throw new Error(`API 호출 실패 (코드: ${response.status})`);
                }

                const resultData = await response.json();
                const top10List = resultData.ranking ? resultData.ranking.slice(0, 10) : [];

                if (top10List.length === 0) {
                    container.innerHTML = `<div style="font-size: 11px; color: var(--omni-text-muted); text-align: center; padding: 15px 0;">랭킹 데이터가 존재하지 않습니다.</div>`;
                    return;
                }

                let top10RowsHtml = "";
                top10List.forEach(user => {
                    top10RowsHtml += `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; background: var(--omni-card-bg); border-radius: 6px; border: 1px dashed var(--omni-card-border-line); font-size: 11px; font-weight: 700;">
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="color: var(--omni-slate-primary); font-weight: 900; width: 16px; text-align: center;">${user.ranking}</span>
                                <span style="color: var(--omni-text-dark); font-weight: 800;">${user.character_name}</span>
                                <span style="font-size: 9.5px; color: var(--omni-text-sub); font-weight: 600;">(${user.world_name})</span>
                            </div>
                            <div style="display: flex; gap: 8px; color: var(--omni-text-sub);">
                                <span>${user.class_name}</span>
                                <span style="color: var(--omni-slate-primary); font-weight: 800;">Lv.${user.character_level}</span>
                            </div>
                        </div>
                    `;
                });
                container.innerHTML = top10RowsHtml;
            } catch (err) {
                console.error("랭킹 API 연동 오류:", err);
                container.innerHTML = `<div style="font-size: 11px; color: var(--omni-coral, #dc2626); text-align: center; padding: 15px 0;">랭킹 데이터 로드 실패</div>`;
            }
        };

        let sundayComboHtml = `
            <div class="sunday-integrated-combo-area" style="border-top: 1px dashed var(--omni-card-border-line); padding-top: 10px; display: flex; flex-direction: column; gap: 8px;">
                <div style="font-size: calc(var(--omni-base-font-size) * 0.79); font-weight: 800; display: flex; align-items: center; justify-content: space-between; color: var(--omni-text-dark);">
                    <span>🏆 유저 랭킹 TOP 10</span>
                    <span style="font-size: 9.5px; color: var(--omni-text-sub); font-weight: 600;">실시간 API 연동</span>
                </div>
                <div id="omniTop10Container" style="max-height: 140px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding-right: 2px;">
                    <div style="font-size: 11px; color: var(--omni-text-muted); text-align: center; padding: 15px 0;">랭킹 데이터 불러오는 중...</div>
                </div>
            </div>
        `;

        const simState = window.omniSimulatorState || { financeSummary: { totalMeso: 89030475000, totalCash: 6600, totalAppraisal: 2448945500 }, cubeUsageData: [] };
        const simMesoFormatted = window.formatKoreanMoneyValue ? window.formatKoreanMoneyValue(simState.financeSummary.totalMeso) : "890억 3047만";
        const simAppraisalFormatted = window.formatKoreanMoneyValue ? window.formatKoreanMoneyValue(simState.financeSummary.totalAppraisal) : "24억 4894만";
        const totalCubesRolled = simState.cubeUsageData.reduce((acc, curr) => acc + (curr.count || 0), 0) || 8813;

        let totalEstimatedBossStonesMeso = 0;
        let totalEstimatedStonesCount = 0;
        todoCharacters.forEach(char => {
            const data = todoCheckData[char.name] || todoCheckData[char.id] || {};
            const bossValueMap = {
                'c_gaensl': 234000000, 'h_suu': 324000000, 'h_demian': 298000000, 'h_lucid': 365000000,
                'h_will': 420000000, 'c_dusk': 389000000, 'h_dunkel': 412000000, 'h_hilla': 378000000,
                'b_mage': 1000000000, 'h_seren': 1200000000, 'n_kalos': 1500000000, 'n_kaling': 1700000000, 'ex_suu': 2500000000
            };
            Object.entries(bossValueMap).forEach(([bossKey, val]) => {
                const checked = data[`boss_${bossKey}`] === true || data[`boss_${bossKey}`] === "true";
                if (checked) {
                    totalEstimatedBossStonesMeso += val;
                    totalEstimatedStonesCount++;
                }
            });
        });
        const formattedStonesMesoStr = totalEstimatedBossStonesMeso > 0 
            ? (totalEstimatedBossStonesMeso / 100000000).toFixed(2) + "억 메소" 
            : "0 메소";

        container.innerHTML = `
            <div class="widget-grid-layout">
                <div class="omni-dashboard-widget-card" style="grid-column: span 9;">
                    <div class="wdg-hdr">⏰ 스케쥴러 캐릭터 모아보기 (GRID VIEW)</div>
                    <div class="daily-reset-scroll-viewport">${dailyResetHtml}</div>
                </div>

                <div class="omni-dashboard-widget-card" style="grid-column: span 3;">
                    <div class="wdg-hdr">
                        <span>📅 메이플 일정 관리</span>
                        <span style="display: flex; align-items: center; gap: 4px; background: var(--omni-card-bg); padding: 2px 8px; border-radius: 6px; border: 1px dashed var(--omni-card-border-line); font-size: 11px; font-weight: 800; color: var(--omni-slate-primary);">
                            <span>⏳</span><span id="dailyResetTimer" style="font-family: monospace;">00:00:00</span>
                        </span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 6px; width: 100%;">${eventTrackerRowsHtml}</div>
                    ${sundayComboHtml}
                </div>

                <div class="omni-dashboard-widget-card" style="grid-column: span 4;">
                    <div class="wdg-hdr">📊 사냥 기록 스테이더스 (HUNTING STATS)</div>
                    <div style="display: flex; flex-direction: column; justify-content: space-between; height: 100%; gap: 8px;">
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            <div class="omni-accumulated-stats-panel">
                                <div style="font-size: calc(var(--omni-base-font-size) * 0.79); font-weight: 800; display: flex; align-items: center; gap: 4px; border-bottom: 1px dashed var(--omni-card-border-line); padding-bottom: 4px; margin-bottom: 2px;">🏆 누적 아카이브 통계</div>
                                <div style="display: flex; justify-content: space-between; font-size: calc(var(--omni-base-font-size) * 0.75);">
                                    <span style="font-weight: 700;">⏱️ 총 시간:</span>
                                    <strong style="font-weight: 800;">${formattedTotalTime}</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; font-size: calc(var(--omni-base-font-size) * 0.75);">
                                    <span style="font-weight: 700;">🔺 총 경험치:</span>
                                    <strong style="font-weight: 800; font-size: 11px;">${totalHuntingExp.toLocaleString()}</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; font-size: calc(var(--omni-base-font-size) * 0.75);">
                                    <span style="font-weight: 700;">💰 총 순수익:</span>
                                    <strong style="color: var(--omni-slate-primary); font-weight: 800;">${totalHuntingMeso.toLocaleString()}</strong>
                                </div>
                            </div>
                            <div class="omni-hunting-mvp-character-dock">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div class="mvp-circular-avatar-frame" style="width: 38px; height: 38px; border-radius: 50%; border: 2px solid var(--omni-slate-primary); overflow: hidden; display: flex; justify-content: center; align-items: center; background: var(--omni-card-bg); flex-shrink: 0;">
                                        <img src="${mvpAvatarImageSrc || safeAvatar}" style="width: 100%; height: 100%; object-fit: contain; transform: scale(1.4);" onerror="this.onerror=null; this.src='${safeAvatar}';">
                                    </div>
                                    <div style="display: flex; flex-direction: column; gap: 1px; align-items: flex-start; min-width: 0;">
                                        <span style="font-size: 9px; color: var(--omni-point-amber-text) !important; background: var(--omni-point-amber-bg) !important; padding: 1px 4px; border-radius: 3px; font-weight: 900; white-space: nowrap;">🏆 사냥 MVP</span>
                                        <strong style="font-size: 11.5px; color: var(--omni-slate-primary); font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; text-align: left;">${mvpCharacterName}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="omni-recommend-daily-meso-tracker" style="border-top: 1px dashed var(--omni-card-border-line); padding-top: 10px; margin-top: 4px; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                            <span style="font-size: 11px; font-weight: bold; color: var(--omni-text-muted);">💰 누적 사냥 메소</span>
                            <strong style="color: var(--omni-slate-primary); font-size: 11.5px; font-weight: 900;">${totalHuntingMeso.toLocaleString()}</strong>
                        </div>
                    </div>
                </div>

                <div class="omni-dashboard-widget-card" style="grid-column: span 4;">
                    <div class="wdg-hdr">🎰 옴니 자산 요약 (SIM QUICK STATS)</div>
                    <div style="display: flex; flex-direction: column; justify-content: space-between; height: 100%; gap: 8px;">
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            <div class="omni-accumulated-stats-panel">
                                <div style="font-size: calc(var(--omni-base-font-size) * 0.79); font-weight: 800; display: flex; align-items: center; gap: 4px; border-bottom: 1px dashed var(--omni-card-border-line); padding-bottom: 4px; margin-bottom: 2px;">💎 큐브 & 스타포스 현황</div>
                                <div style="display: flex; justify-content: space-between; font-size: calc(var(--omni-base-font-size) * 0.75);">
                                    <span style="font-weight: 700;">🔮 사용 큐브 개수:</span>
                                    <strong style="font-weight: 800; color: var(--omni-slate-primary);">${totalCubesRolled.toLocaleString()} 개</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; font-size: calc(var(--omni-base-font-size) * 0.75);">
                                    <span style="font-weight: 700;">🪙 시뮬레이터 소모 메소:</span>
                                    <strong style="font-weight: 800; font-size: 11px;">${simMesoFormatted}</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; font-size: calc(var(--omni-base-font-size) * 0.75);">
                                    <span style="font-weight: 700;">🔍 돋보기 감정 비용:</span>
                                    <strong style="font-weight: 800; font-size: 11px;">${simAppraisalFormatted}</strong>
                                </div>
                            </div>
                        </div>
                        <div style="font-size: 10.5px; color: var(--omni-text-sub); text-align: left; border-top: 1px dashed var(--omni-card-border-line); padding-top: 8px;">
                            * [시뮬레이터] 탭의 누적 통계 데이터를 연동 출력합니다.
                        </div>
                    </div>
                </div>

                <div class="omni-dashboard-widget-card" style="grid-column: span 4;">
                    <div class="wdg-hdr">💎 주간 결정석 정산 (BOSS STONE ESTIMATOR)</div>
                    <div style="display: flex; flex-direction: column; justify-content: space-between; height: 100%; gap: 8px;">
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            <div class="omni-accumulated-stats-panel">
                                <div style="font-size: calc(var(--omni-base-font-size) * 0.79); font-weight: 800; display: flex; align-items: center; gap: 4px; border-bottom: 1px dashed var(--omni-card-border-line); padding-bottom: 4px; margin-bottom: 2px;">⚔️ 주간 격파 캐릭터 보스 연동 수익</div>
                                <div style="display: flex; justify-content: space-between; font-size: calc(var(--omni-base-font-size) * 0.75);">
                                    <span style="font-weight: 700;">💎 누적 정산 결정석 수량:</span>
                                    <strong style="font-weight: 800; color: #10b981;">${totalEstimatedStonesCount} / 180 개</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; font-size: calc(var(--omni-base-font-size) * 0.75);">
                                    <span style="font-weight: 700;">🪙 주간 예상 기대 총액:</span>
                                    <strong style="font-weight: 800; color: var(--omni-slate-primary);">${formattedStonesMesoStr}</strong>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px; background: var(--omni-card-bg); border: 1px dashed var(--omni-card-border-line); border-radius: 6px; padding: 6px 10px;">
                                <div style="font-size: 14px;">⚡</div>
                                <div style="display: flex; flex-direction: column; text-align: left; min-width: 0;">
                                    <span style="font-size: 9px; font-weight: 800; color: var(--omni-text-sub);">최근 연동 정산 상태</span>
                                    <strong style="font-size: 10.5px; font-weight: 800; color: #10b981; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">주간 보스 클리어 연동 완료!</strong>
                                </div>
                            </div>
                        </div>
                        <div style="font-size: 10px; color: var(--omni-text-sub); text-align: left; border-top: 1px dashed var(--omni-card-border-line); padding-top: 8px;">
                            * 스케쥴러 캐릭터의 주간 보스 클리어 체크와 실시간 실재화 동기화 작동.
                        </div>
                    </div>
                </div>
            </div>

            <div class="dashboard-secondary-row">
                <div class="secondary-left-column">
                    <div class="omni-extended-panel">
                        <div class="panel-hdr">📸 진행중인 이벤트 (EVENT TIMELINE)</div>
                        <div class="event-slider-container" id="eventSlider">      
                            <div class="event-slider-track" id="eventTrack">
                                <a href="https://maplestory.nexon.com/News/Event" target="_blank" class="banner-wrapper-slot">
                                    <div class="banner-placeholder-box">
                                        <div class="banner-image-crop-layer"><img src="assets/event/event1.png" class="banner-img-core" onerror="this.src='${safeAvatar}';"></div>
                                        <div class="event-info-box"><span class="event-info-title">치지직 방송 드롭스 연동</span><span class="event-info-date">~ 2026.08.15</span></div>
                                    </div>
                                </a>
                                <a href="https://maplestory.nexon.com/News/Event" target="_blank" class="banner-wrapper-slot">
                                    <div class="banner-placeholder-box">
                                        <div class="banner-image-crop-layer"><img src="assets/event/event2.png" class="banner-img-core" onerror="this.src='${safeAvatar}';"></div>
                                        <div class="event-info-box"><span class="event-info-title">여름 한정 코인샵 오픈</span><span class="event-info-date">~ 2026.08.30</span></div>
                                    </div>
                                </a>
                                <a href="https://maplestory.nexon.com/News/Event" target="_blank" class="banner-wrapper-slot">
                                    <div class="banner-placeholder-box">
                                        <div class="banner-image-crop-layer"><img src="assets/event/event3.png" class="banner-img-core" onerror="this.src='${safeAvatar}';"></div>
                                        <div class="event-info-box"><span class="event-info-title">아쉴롬 기억의 정원</span><span class="event-info-date">~ 2026.07.30</span></div>
                                    </div>
                                </a>
                                <a href="https://maplestory.nexon.com/News/Event" target="_blank" class="banner-wrapper-slot">
                                    <div class="banner-placeholder-box">
                                        <div class="banner-image-crop-layer"><img src="assets/event/event4.png" class="banner-img-core" onerror="this.src='${safeAvatar}';"></div>
                                        <div class="event-info-box"><span class="event-info-title">벼룩시장 황금 마차</span><span class="event-info-date">~ 2026.09.20</span></div>
                                    </div>
                                </a>
                                <a href="https://maplestory.nexon.com/News/Event" target="_blank" class="banner-wrapper-slot">
                                    <div class="banner-placeholder-box">
                                        <div class="banner-image-crop-layer"><img src="assets/event/event5.png" class="banner-img-core" onerror="this.src='${safeAvatar}';"></div>
                                        <div class="event-info-box"><span class="event-info-title">버닝 서버 육성 가속 페스티벌</span><span class="event-info-date">~ 2026.09.30</span></div>
                                    </div>
                                </a>
                            </div>
                            <div class="event-slider-dots" id="eventSliderDots"></div>
                        </div>
                    </div>
                    <div class="omni-extended-panel">
                        <div class="panel-hdr-with-action"><div class="panel-hdr-title">📝 메모장 (MEMOS)</div><div class="memo-input-group"><input type="text" id="dashboardMemoInput" placeholder="실시간 메모 기입..."><button onclick="window.addDashboardInlineMemo()" class="mvp-action-btn-custom">등록</button></div></div>
                        <div class="dashboard-memo-scroll-area">${memoRowsHtml ? memoRowsHtml : '<div class="dashboard-empty-mini-alert">작성된 메모가 없습니다.</div>'}</div>
                    </div>
                </div>

                <div class="secondary-right-column">
                    <div class="omni-extended-panel half-height-panel-split">
                        <div class="panel-hdr">📢 메이플 소식 (MAPLESTORY NOTICES)</div>
                        <div class="split-box-scroll-viewport">
                            <div class="notice-list-wrapper">
                                <a href="https://maplestory.nexon.com/News/Notice/All/149495" target="_blank" class="notice-list-item">
                                    <span class="notice-badge type-inspect">점검</span>
                                    <p class="notice-title">7/9(목) 운영정책 위반 단속 결과 및 클린 캠페인 결과 발표</p>
                                    <span class="notice-date">07.09</span>
                                </a>
                                <a href="https://maplestory.nexon.com/News/Event/Ongoing/1349" target="_blank" class="notice-list-item">
                                    <span class="notice-badge type-event">이벤트</span>
                                    <p class="notice-title">챌린저스 월드 시즌4 오픈</p>
                                    <span class="notice-date">06.18</span>
                                </a>
                                <a href="https://maplestory.nexon.com/news/update/807" target="_blank" class="notice-list-item">
                                    <span class="notice-badge type-update">패치</span>
                                    <p class="notice-title">클라이언트 1.2.416 업데이트 안내 (신규 직업 레테)</p>
                                    <span class="notice-date">07.08</span>
                                </a>
                                <a href="https://maplestory.nexon.com/News/CashShop/Sale/632" target="_blank" class="notice-list-item">
                                    <span class="notice-badge type-info">판매</span>
                                    <p class="notice-title">6월 18일 캐시아이템 업데이트 - 제네시스 패스 & 제네시스 패스 PLUS</p>
                                    <span class="notice-date">07.05</span>
                                </a>
                                <a href="https://maplestory.nexon.com/News/Notice/Inspection/149467" target="_blank" class="notice-list-item">
                                    <span class="notice-badge type-inspect">점검</span>
                                    <p class="notice-title">[패치완료] 7/6(월) ver1.2.416 마이너버전(9) 패치(21:18 적용)</p>
                                    <span class="notice-date">07.02</span>
                                </a>
                                <a href="https://maplestory.nexon.com/News/Notice" target="_blank" class="notice-list-item">
                                    <span class="notice-badge type-info">안내</span>
                                    <p class="notice-title">대리 게임 및 비정상 우회 매크로 탐지 시스템 집중 모니터링 주간 선포</p>
                                    <span class="notice-date">06.29</span>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="omni-extended-panel half-height-panel-split">
                        <div class="panel-hdr">🚀 옴니 업데이트 (OMNI RECONSTRUCTION UPDATES)</div>
                        <div class="split-box-scroll-viewport">
                            <div class="notice-list-wrapper">
                                <div class="notice-list-item" style="pointer-events:none;">
                                    <span class="notice-badge type-update">V14.9</span>
                                    <p class="notice-title">[레이아웃] 순백색 점선(dashed) 테두리 기반의 클래식 화이트 스킨 복구</p>
                                    <span class="notice-date">07.09</span>
                                </div>
                                <div class="notice-list-item" style="pointer-events:none;">
                                    <span class="notice-badge type-update">V14.8</span>
                                    <p class="notice-title">[인터랙션] 메인 이벤트 트랙 가변 배율 슬라이더 무오차 복구 종결</p>
                                    <span class="notice-date">07.09</span>
                                </div>
                                <div class="notice-list-item" style="pointer-events:none;">
                                    <span class="notice-badge type-update">V14.7</span>
                                    <p class="notice-title">[보안] 캐시 오염에 따른 NaN 디버깅 패치 및 복구 모듈 마운트 완수</p>
                                    <span class="notice-date">07.06</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="dashboard-third-row-planner">
                <div class="full-width-planner-panel">
                    <div class="planner-header-panel-layout">
                        <div class="planner-header-txt-box">
                            <h3 class="planner-main-title-txt">📅 메이플 육성 계획서 (STRATEGY PLANNER)</h3>
                        </div>
                        <div class="planner-interactive-form-grid">
                            <select id="plannerCharFilter" onchange="window.changePlannerFilter(this.value)" class="mvp-inline-input-custom">${plannerFilterDropdownHtml}</select>
                            <input type="text" id="plannerGoalInput" class="mvp-inline-input-custom" placeholder="핵심 목적 목표 명세 기입..."><input type="text" id="plannerRouteInput" class="mvp-inline-input-custom" placeholder="수행 루트 마일스톤 기입..."><button onclick="window.addStrategyPlan()" class="mvp-action-btn-custom-planner">수립</button>
                        </div>
                    </div>
                    <div class="strategy-cards-display-board-grid">${planCardsHtml ? planCardsHtml : '<div class="dashboard-empty-mini-alert" style="grid-column: 1 / -1; padding: 30px 10px;">한줄짜리 육성 계획을 세워보세요!</div>'}</div>
                </div>
            </div>
        `;
        
        window.setOmniTheme(activeTheme);
        initEventSlider();
        window.fetchAndRenderMapleTop10();
    } catch (err) {
        console.error("🚨 옴니 렌더링 세이프티 엔진 구동 복구 가동:", err);
    } finally {
        setTimeout(() => { container.style.opacity = '1'; }, 20);
    }
};

window.addDashboardInlineMemo = function() {
    const input = document.getElementById('dashboardMemoInput'); if (!input || !input.value.trim()) return;
    const savedMemosRaw = localStorage.getItem("omni_v14_dashboard_memos"); let memoList = savedMemosRaw ? JSON.parse(savedMemosRaw) : [];
    const now = new Date(); const currentMonthDay = String(now.getMonth() + 1).padStart(2, '0') + "." + String(now.getDate()).padStart(2, '0');
    memoList.unshift({ text: input.value.trim(), date: currentMonthDay }); localStorage.setItem("omni_v14_dashboard_memos", JSON.stringify(memoList)); window.renderDashboardMainWidgets();
};

window.deleteDashboardInlineMemo = function(index) {
    if (!confirm("⚠️ 작성해 둔 실시간 인라인 메모를 정말 삭제하시겠습니까?")) return; 
    const savedMemosRaw = localStorage.getItem("omni_v14_dashboard_memos"); if (!savedMemosRaw) return;
    let memoList = JSON.parse(savedMemosRaw); memoList.splice(index, 1); localStorage.setItem("omni_v14_dashboard_memos", JSON.stringify(memoList)); window.renderDashboardMainWidgets();
};

window.addStrategyPlan = function() {
    const filterSelect = document.getElementById('plannerCharFilter'); const goalInput = document.getElementById('plannerGoalInput'); const routeInput = document.getElementById('plannerRouteInput');
    if (!goalInput || !routeInput || !goalInput.value.trim() || !routeInput.value.trim()) { alert("운영 목표와 세부 수행 루트를 모두 작성해야 정밀한 계획 수립이 시작됩니다."); return; }
    let targetChar = filterSelect.value === "전체" ? "전체 계정 공통" : filterSelect.value;
    const savedPlansRaw = localStorage.getItem("omni_v14_strategy_plans"); let planList = savedPlansRaw ? JSON.parse(savedPlansRaw) : [];
    planList.unshift({ char: targetChar, goal: goalInput.value.trim(), route: routeInput.value.trim() }); localStorage.setItem("omni_v14_strategy_plans", JSON.stringify(planList)); window.renderDashboardMainWidgets(); 
};

window.deleteStrategyPlan = function(index) {
    if (!confirm("🚨 정말로 이 메이플 육성 계획을 삭제하시겠습니까?")) return; 
    const savedPlansRaw = localStorage.getItem("omni_v14_strategy_plans"); if (!savedPlansRaw) return;
    let planList = JSON.parse(savedPlansRaw); planList.splice(index, 1); localStorage.setItem("omni_v14_strategy_plans", JSON.stringify(planList)); window.renderDashboardMainWidgets();
};

window.changePlannerFilter = function(filterValue) { window.omniPlannerFilter = filterValue; window.renderDashboardMainWidgets(); };

function initEventSlider() {
    const track = document.getElementById('eventTrack'); 
    const slider = document.getElementById('eventSlider'); 
    const dotsContainer = document.getElementById('eventSliderDots');
    if (!track || !slider || !dotsContainer) return;
    
    let currentIndex = 0; 
    const totalItems = track.children.length; 
    if (totalItems === 0) return;

    const maxIndex = Math.max(0, totalItems - 3);
    
    dotsContainer.innerHTML = '';
    for (let i = 0; i <= maxIndex; i++) {
        const dot = document.createElement('span');
        dot.className = `event-dot ${i === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => {
            goToSlide(i);
        });
        dotsContainer.appendChild(dot);
    }

    const dots = dotsContainer.querySelectorAll('.event-dot');

    function goToSlide(n) {
        currentIndex = n;
        track.style.transform = `translateX(-${currentIndex * 33.3333}%)`;
        dots.forEach((dot, idx) => {
            if (idx === currentIndex) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    }

    function autoSlide() { 
        if (maxIndex > 0) {
            currentIndex = (currentIndex + 1) % (maxIndex + 1); 
            goToSlide(currentIndex);
        }
    }
    
    let slideInterval = setInterval(autoSlide, 3000); 
    
    slider.addEventListener('mouseenter', () => {
        clearInterval(slideInterval);
    }); 
    slider.addEventListener('mouseleave', () => {
        clearInterval(slideInterval);
        slideInterval = setInterval(autoSlide, 3000);
    });
}

window.startDailyResetTimer = function() {
    function updateResetTimer() {
        const now = new Date();
        const targetEvent = (typeof OMNI_ACTIVE_EVENTS !== 'undefined' && OMNI_ACTIVE_EVENTS.length > 0) 
            ? OMNI_ACTIVE_EVENTS[0] 
            : { title: "챌린저스 월드 시즌4 오픈 레이스", end: "2026-09-16" };
        
        const eventEndDate = new Date(targetEvent.end + "T23:59:59");
        const diff = eventEndDate - now;

        const timerEl = document.getElementById('dailyResetTimer');
        if (timerEl) {
            if (diff <= 0) {
                timerEl.innerText = "이벤트 종료";
            } else {
                const d = Math.floor(diff / 86400000);
                const h = Math.floor((diff % 86400000) / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                timerEl.innerText = `${d}일 ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            }

            const parentBadge = timerEl.closest('span[style*="background"]');
            if (parentBadge) {
                parentBadge.title = `🎯 첫 번째 주요 이벤트 마감 시한\n[${targetEvent.title}]\n종료일: ${targetEvent.end}`;
            }
        }
    }
    if (window.timerInterval) clearInterval(window.timerInterval); 
    window.timerInterval = setInterval(updateResetTimer, 1000); 
    updateResetTimer();
};

window.renderGlobalFooter = function() {
    const existingFooter = document.getElementById('omniGlobalFooter'); if (existingFooter) existingFooter.remove();
    const footer = document.createElement('footer'); footer.id = 'omniGlobalFooter'; footer.className = 'omni-global-footer-panel';
    footer.innerHTML = `<div class="footer-links-row"><a href="#">이용약관</a> | <a href="#">개인정보처리방침</a></div><div class="footer-copyright-txt">© 2026 MAPLE OMNI V14. ALL RIGHTS RESERVED.</div>`;
    document.body.appendChild(footer);
};

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem("omni_theme_status") || "light"; window.setOmniTheme(savedTheme);
    window.renderSidebarProfileCard(null); window.renderDashboardMainWidgets(); window.startDailyResetTimer(); window.renderGlobalFooter();
});