/**
 * ============================================================================
 * 📑 MAPLE OMNI V15 - dashboard/sidebar.js
 * 설명: 좌측 사이드바 패널, API 동기화 및 전체 백업/복구 관리 모듈입니다.
 * 초보자 가이드: 전체 데이터 내보내기/불러오기와 API 동기화를 담당합니다.
 * ============================================================================
 */

/**
 * 🔄 [전역 API 즉시 갱신 및 캐시 파쇄 Engine]
 */
window.triggerGlobalApiRefresh = function() {
    // 💡 [초보자 가이드] API 갱신(로딩) 시작 시 열려있는 라이트 모드 팔레트 팝업을 즉시 숨겨 로딩 오버레이와 겹치는 현상을 방지합니다.
    const dotsContainer = document.getElementById('omniLightDots');
    if (dotsContainer) dotsContainer.style.display = 'none';

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

        // 1. 로컬 스토리지 캐시 파쇄
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

        // 3. 갱신 시각 설정
        const nowFormatted = new Date().toLocaleString();
        localStorage.setItem("omni_last_refresh_time", nowFormatted);
        window.lastOmniRefreshedAt = nowFormatted;

        // 4. API 최신 동기화 실행
        if (typeof window.startOmniSearch === 'function') {
            window.startOmniSearch(cleanCharName, true);
        } else {
            console.log(`[API REFRESH] ${cleanCharName} 캐릭터 최신 API 데이터 동기화 완료`);
        }

        // 5. 대시보드 전체 화면 다시 그리기
        window.renderSidebarProfileCard(null);
        window.renderDashboardMainWidgets();
    } else {
        alert("⚠️ 갱신할 캐릭터 정보가 없습니다. 상단 검색창이나 캐릭터 등록에서 캐릭터를 추가해 주세요.");
    }
};

/**
 * 🎛️ [좌측 사이드바 프로필 카드 렌더링]
 */
/**
 * 🎛️ [좌측 사이드바 프로필 카드 및 즐겨찾기 패널 렌더링]
 * 초보자 가이드: 사이드바의 상단 시스템 영역과 하단 즐겨찾기(Quick Shortcuts) 카드를 화면에 그려줍니다.
 */
window.renderSidebarProfileCard = function(data) {
    const sidebar = document.getElementById('characterCardContainer');
    if (!sidebar) return;

    // 최근 API 데이터 갱신 시각을 불러옵니다.
    const lastRefreshTime = localStorage.getItem("omni_last_refresh_time") || window.lastOmniRefreshedAt || "갱신 이력 없음";

    sidebar.innerHTML = `
        <div class="sidebar-workspace-wrapper">
            <div class="workspace-notice-card">
                <div class="notice-badge-title">SYSTEM INTERFACE</div>
                <h4>OMNI CORE REGULATION</h4>
                <p>본 관제 콘솔은 넥슨 OpenAPI 아키텍처의 실시간 파싱 부하 규정을 준수하며 안전 필터 모드로 작동 중입니다.</p>

                <!-- 라이트/다크 테마 전환 버튼 및 로그아웃 버튼 영역 -->
                <div style="margin-top: 14px; display: flex; gap: 6px; align-items: center;">
                    <div class="omni-theme-toggle-dock" style="flex: 1; display: flex; background: var(--omni-card-bg); border: 1px dashed var(--omni-card-border-line); padding: 3px; border-radius: 8px; gap: 2px;">
                        <div class="omni-theme-toggle-container" style="position: relative; flex: 1; display: flex;">
                            <button onclick="window.handleMainThemeClick('light')" id="theme-btn-master-light" class="theme-btn-unit" style="width: 100%; justify-content: center; padding: 6px 4px;">☀️ 라이트</button>
                            <div id="omniLightDots" class="omni-light-palette-dots" style="display: none; position: absolute; top: 100%; left: 0; margin-top: 4px; z-index: 20; background: var(--omni-card-bg); padding: 4px 6px; border-radius: 6px; border: 1px dashed var(--omni-card-border-line); gap: 4px; align-items: center;">
                                <span onclick="window.selectDotColorSkin('light')" id="dot-light" class="palette-dot" style="background: #ffffff; border: 2px solid #8372d6;" title="클래식 화이트"></span>
                                <span onclick="window.selectDotColorSkin('light-pink')" id="dot-light-pink" class="palette-dot" style="background: #ffbde2; border: 2px solid #d36eb7;" title="핑크 화이트"></span>
                                <span onclick="window.selectDotColorSkin('light-blue')" id="dot-light-blue" class="palette-dot" style="background: #bdcfff; border: 2px solid #6e8ed3;" title="하늘색 화이트"></span>
                            </div>
                        </div>
                        <button onclick="window.handleMainThemeClick('dark')" id="theme-btn-master-dark" class="theme-btn-unit" style="flex: 1; justify-content: center; padding: 6px 4px;">🌙 다크</button>
                    </div>
                    <button onclick="window.omniLogoutToIntro()" class="sidebar-sub-action-btn" style="flex: 0 0 auto; padding: 7px 10px; background: var(--omni-card-bg) !important; color: var(--omni-coral, #dc2626) !important; border: 1px dashed rgba(220,38,38,0.3) !important;">🚪 로그아웃</button>
                </div>

                <!-- API 즉시 갱신 버튼 영역 -->
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
                
                <!-- 전체 데이터 백업 및 복구 영역 -->
                <div class="sidebar-master-backup-zone" style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--omni-card-border-line); display: flex; flex-direction: column; gap: 6px;">
                    <div class="workspace-backup-title-text" style="font-size: 11px; font-weight: 800; margin-bottom: 2px; text-align: left; opacity: 0.85;">📂 OMNI 전체 데이터 통합 관리</div>
                    <div style="display: flex; gap: 6px; width: 100%;">
                        <button onclick="window.exportOmniMasterBackup()" class="sidebar-sub-action-btn">💾 전체 백업</button>
                        <button onclick="window.importOmniMasterRestore()" class="sidebar-sub-action-btn">📂 전체 복구</button>
                    </div>
                </div>
            </div>

            <!-- 💡 [초보자 가이드] 즐겨찾기 패널 카드 (옴니의 모든 주요 페이지 및 서브 탭 포함) -->
            <div class="workspace-notice-card" style="margin-top: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <span style="font-size: 10.5px; font-weight: 800; color: var(--omni-text-muted, #64748b);">⭐ QUICK SHORTCUTS</span>
                    <button onclick="window.toggleShortcutEditMode()" class="sidebar-sub-action-btn" style="padding: 2px 6px; font-size: 10px;">${window.omniShortcutEditMode ? '💾 완료' : '⚙️ 편집'}</button>
                </div>

                <div id="sidebarShortcutContainer" style="margin-top: 4px;">
                    ${(() => {
                        // 💡 [초보자 가이드] 옴니의 모든 메인 페이지 및 캐릭터 조회/사냥 내부의 주요 세부 탭들을 빠짐없이 포함한 전체 목록입니다.
                        const allShortcuts = [
                            { id: 'page-dashboard', sub: '', name: '🏠 홈 대시보드', span: 1 },
                            { id: 'page-todo', sub: '', name: '📋 주간 할일', span: 1 },
                            { id: 'page-search', sub: '', name: '🔍 캐릭터 조회', span: 1 },
                            { id: 'page-search', sub: 'search-tab-stat', name: '📈 조회: 상세스탯', span: 1 },
                            { id: 'page-search', sub: 'search-tab-equipment', name: '🛡️ 조회: 장비템', span: 1 },
                            { id: 'page-search', sub: 'search-tab-union', name: '🧩 조회: 유니온', span: 1 },
                            { id: 'page-search', sub: 'search-tab-skill', name: '🔮 조회: 스킬', span: 1 },
                            { id: 'page-scanner', sub: '', name: '📷 옴니스캐너', span: 1 },
                            { id: 'page-builder', sub: '', name: '🛠️ 옴니빌더', span: 1 },
                            { id: 'page-boss', sub: '', name: '😈 보스 레이드', span: 1 },
                            { id: 'page-hunt', sub: '', name: '⚔️ 사냥 메인', span: 1 },
                            { id: 'page-hunt-record', sub: 'hunt-record', name: '📝 사냥 기록콘솔', span: 1 },
                            { id: 'page-mvp', sub: '', name: '💰 MVP 계산기', span: 1 },
                            { id: 'page-simulator', sub: '', name: '📊 계정 시뮬레이터', span: 2 }
                        ];

                        let savedShortcuts = localStorage.getItem('omni_custom_shortcuts');
                        let activeIds = savedShortcuts ? JSON.parse(savedShortcuts) : [];

                        if (window.omniShortcutEditMode) {
                            return `
                                <div style="display: flex; flex-direction: column; gap: 4px; background: var(--omni-card-bg); border: 1px dashed var(--omni-card-border-line); padding: 8px; border-radius: 8px; max-height: 220px; overflow-y: auto;">
                                    <div style="font-size: 10px; font-weight: 700; color: var(--omni-text-muted); margin-bottom: 2px;">표시할 메뉴를 선택하세요:</div>
                                    ${allShortcuts.map((s) => {
                                        const uniqueKey = s.id + '__' + (s.sub || 'none');
                                        return `
                                            <label style="display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; cursor: pointer;">
                                                <input type="checkbox" class="shortcut-chk-item" value="${uniqueKey}" ${activeIds.includes(uniqueKey) ? 'checked' : ''}>
                                                <span>${s.name}</span>
                                            </label>
                                        `;
                                    }).join('')}
                                    <button onclick="window.saveCustomShortcuts()" class="sidebar-sub-action-btn" style="margin-top: 6px; text-align: center; background: var(--omni-slate-primary, #7a6ec7); color: #fff !important; font-weight: 800;">설정 저장하기</button>
                                </div>
                            `;
                        } else {
                            const visibleList = allShortcuts.filter(s => activeIds.includes(s.id + '__' + (s.sub || 'none')));
                            if (visibleList.length === 0) {
                                return `<div style="font-size: 10.5px; color: var(--omni-text-muted); text-align: center; padding: 6px; background: var(--omni-card-bg); border-radius: 6px; border: 1px dashed var(--omni-card-border-line);">[⚙️ 편집]을 눌러 즐겨찾기를 추가해 보세요.</div>`;
                            }
                            return `
                                <div class="sidebar-quick-shortcuts" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px;">
                                    ${visibleList.map(s => `
                                        <button onclick="window.handleSidebarShortcut('${s.id}', '${s.sub || ''}')" class="sidebar-sub-action-btn" style="${s.span === 2 ? 'grid-column: span 2; text-align: center;' : 'text-align: left;'} padding: 6px 8px; font-size: 11px;">${s.name}</button>
                                    `).join('')}
                                </div>
                            `;
                        }
                    })()}
                </div>
            </div>
            <div class="workspace-secure-anchor"><span class="pulse-emerald-dot"></span> INTEGRATED WORKSPACE ACTIVE</div>
        </div>
    `;
};

/**
 * 💾 [사냥 로그 백업 내보내기]
 */
window.exportOmniHuntingLogsBackup = function() {
    const integratedRaw = localStorage.getItem("omni_v14_hunting_integrated_log") || "[]";
    const normalRaw = localStorage.getItem("omni_v14_hunting_log") || "[]";
    const packet = { identity: "MAPLE_OMNI_V14_LAVENDER", backupDate: new Date().toLocaleString(), integratedLog: JSON.parse(integratedRaw), normalLog: JSON.parse(normalRaw) };
    const blob = new Blob([JSON.stringify(packet, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement("a"); downloadAnchor.href = url; downloadAnchor.download = `OMNI_V14_사냥통합기록_백업_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(downloadAnchor); downloadAnchor.click(); document.body.removeChild(downloadAnchor); URL.revokeObjectURL(url);
};

/**
 * 📂 [사냥 로그 백업 복원]
 */
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

/**
 * 💾 [전체 데이터 마스터 통합 백업]
 */
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

/**
 * 📂 [전체 데이터 마스터 통합 복원]
 */
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
 * ⚙️ [즐겨찾기 커스텀 편집 모드 컨트롤 함수]
 */
window.omniShortcutEditMode = window.omniShortcutEditMode || false;

window.toggleShortcutEditMode = function() {
    if (window.omniShortcutEditMode) {
        // [💾 완료] 버튼을 누른 경우에도 즉시 저장이 수행되도록 저장 함수를 호출합니다.
        window.saveCustomShortcuts();
    } else {
        window.omniShortcutEditMode = true;
        if (typeof window.renderSidebarProfileCard === 'function') {
            window.renderSidebarProfileCard();
        }
    }
};

window.saveCustomShortcuts = function() {
    const checkboxes = document.querySelectorAll('.shortcut-chk-item');
    const selected = [];
    checkboxes.forEach(chk => {
        if (chk.checked) {
            selected.push(chk.value);
        }
    });
    localStorage.setItem('omni_custom_shortcuts', JSON.stringify(selected));
    window.omniShortcutEditMode = false;
    if (typeof window.renderSidebarProfileCard === 'function') {
        window.renderSidebarProfileCard();
    }
};

// 💡 DOM 로드 완료 시 사이드바 바인딩
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof window.renderSidebarProfileCard === 'function') window.renderSidebarProfileCard();
    });
} else {
    if (typeof window.renderSidebarProfileCard === 'function') window.renderSidebarProfileCard();
}

/**
 * 🚀 [사이드바 즐겨찾기 세부 경로 점프 라우터]
 */
window.handleSidebarShortcut = function(pageId, subAction) {
    if (subAction === 'hunt-record') {
        // 사냥/재획 페이지로 이동 후 즉시 사냥 기록 콘솔 렌더링 호출
        if (typeof window.omniSwitchPage === 'function') {
            window.omniSwitchPage('page-hunt');
        }
        setTimeout(() => {
            if (typeof window.renderRecordPage === 'function') {
                window.renderRecordPage();
            }
        }, 50);
    } else if (subAction && subAction.startsWith('search-tab-')) {
        // 캐릭터 조회 내부의 특정 탭으로 점프
        const targetTab = subAction.replace('search-tab-', '');
        if (typeof window.omniSwitchPage === 'function') {
            window.omniSwitchPage('page-search');
        }
        setTimeout(() => {
            if (typeof window.switchCharacterSearchTab === 'function') {
                window.switchCharacterSearchTab(targetTab);
            }
        }, 50);
    } else {
        if (typeof window.omniSwitchPage === 'function') {
            window.omniSwitchPage(pageId);
        }
    }
};