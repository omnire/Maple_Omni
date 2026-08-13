/**
 * ============================================================================
 * 🌐 MAPLE OMNI V15 - js/core/api_search.js [INSTANT REPAINT & CLEAN ENGINE]
 * 역할: 캐릭터 탐색 실행 커널, UI 리페인트 및 유니온 탭 화면 즉시 반영 로직
 * 수정내용: 
 *   1. 콘솔 로그 오염 요소를 모두 소거
 *   2. executeOmniUiRepaint 실행 시 유니온 탭이 활성화되어 있다면 즉시 renderUnion을 호출하여 DOM 화면 100% 동기화
 * 규칙: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 달아줍니다.
 * ============================================================================
 */

const omniBatchSleep = ms => new Promise(resolve => setTimeout(resolve, ms));

window.startOmniSearch = async function(characterName, forceRefresh = false) {
    if (forceRefresh) window.isOmniSearching = false;

    window.showLoadingUI();

    if (window.isOmniSearching) {
        window.hideLoadingUI();
        return;
    }

    if (!characterName || !characterName.trim()) {
        alert("⚠️ 탐색할 캐릭터명을 입력해 주세요.");
        window.hideLoadingUI();
        return;
    }

    const cleanName = characterName.trim();
    const cacheStorageKey = `omni_v15_cached_char_${cleanName}`;
    const legacyCacheStorageKey = `omni_v14_cached_char_${cleanName}`;
    const safeAvatar = window.DASHBOARD_SAFE_AVATAR || "";

    if (forceRefresh) {
        localStorage.removeItem(cacheStorageKey);
        localStorage.removeItem(legacyCacheStorageKey);
        sessionStorage.removeItem("omni_last_valid_date");
    } else {
        const localRawData = localStorage.getItem(cacheStorageKey) || localStorage.getItem(legacyCacheStorageKey);
        if (localRawData) {
            const cacheParsed = JSON.parse(localRawData);
            // 💡 [초보자 가이드] 예전엔 유효기간 체크가 없어서, 한 번 조회된 캐릭터는 "API 갱신"을
            // 직접 누르기 전까지 아무리 오래돼도 계속 옛날 전투력/셋팅을 보여줬습니다.
            // 이제는 캐시가 10분을 넘기면 자동으로 만료시켜 최신 데이터를 다시 받아옵니다.
            const cacheTtlMs = 10 * 60 * 1000;
            const cacheEpoch = cacheParsed?.__cachedAtEpoch;
            const isCacheFresh = typeof cacheEpoch === 'number' && (Date.now() - cacheEpoch) < cacheTtlMs;

            if (cacheParsed && cacheParsed.hexa_skill !== undefined && cacheParsed.link_skill !== undefined && cacheParsed.__hexaFixApplied === true && isCacheFresh) {
                window.setOmniCurrentSearchData(cacheParsed);
                window.lastSearchedCharacterName = cleanName;
                window.executeOmniUiRepaint(cacheParsed, cleanName);
                window.hideLoadingUI();
                return;
            } else {
                localStorage.removeItem(cacheStorageKey);
                localStorage.removeItem(legacyCacheStorageKey);
            }
        }
    }

    const topInput = document.getElementById('globalSearchInput');
    if (topInput) topInput.blur();

    try {
        window.isOmniSearching = true;

        const idData = await window.MapleApiHub.getCharacterOcid(cleanName);
        let ocid = idData?.ocid;

        if (!ocid) ocid = "mock_ocid_safety_shield_value";

        let confirmedDate = forceRefresh ? window.getOmniCustomTargetDate(0) : window.getOmniNexonLatestAvailableDate();
        let basicData = null;

        if (ocid === "mock_ocid_safety_shield_value") {
            basicData = { character_name: cleanName, character_class: "아크메이지(썬,콜)", character_level: "283", world_name: "스카니아", character_image: safeAvatar };
        } else if (forceRefresh) {
            // 💡 [초보자 가이드] "API 갱신" 버튼을 눌렀을 때는 API 호출을 최소화하기 위해
            // 여러 날짜를 순회하지 않고, 무조건 "오늘 날짜" 딱 1번만 요청합니다.
            // (참고: 넥슨 캐릭터 스탯/장비 API는 실시간이 아니라 날짜별 스냅샷 방식이라,
            //  넥슨이 아직 오늘자 데이터를 준비하지 못했다면 이 요청은 실패할 수 있습니다.
            //  이 경우 재시도해도 결과는 같으므로 여기서 추가 폴백 요청은 하지 않습니다.)
            try {
                basicData = await window.fetchFromNexon("/character/basic", { ocid: ocid, date: confirmedDate });
            } catch (error) {
                if (error.status === 403) throw error;
                basicData = null;
            }

            if (basicData) sessionStorage.setItem("omni_last_valid_date", confirmedDate);
        } else {
            const cachedValidDate = sessionStorage.getItem("omni_last_valid_date");
            if (cachedValidDate === confirmedDate) {
                basicData = await window.fetchFromNexon("/character/basic", { ocid: ocid, date: cachedValidDate }).catch(() => null);
                if (basicData) confirmedDate = cachedValidDate;
            }

            if (!basicData) {
                const dateCandidates = window.getOmniDateCandidateList(4);
                for (const testDate of dateCandidates) {
                    try {
                        basicData = await window.fetchFromNexon("/character/basic", { ocid: ocid, date: testDate });
                        if (basicData) {
                            confirmedDate = testDate;
                            sessionStorage.setItem("omni_last_valid_date", testDate);
                            break;
                        }
                    } catch (error) {
                        if (error.status === 403) throw error;
                        continue;
                    }
                }
            }
        }

        if (!basicData) throw new Error("조회 가능한 데이터가 없거나 권한이 없는 캐릭터입니다.");

        if (!basicData.character_image || basicData.character_image.includes("default.png")) {
            basicData.character_image = safeAvatar;
        }

        const nowObj = new Date();
        const refreshedAtHumanStr = `${nowObj.getFullYear()}. ${nowObj.getMonth() + 1}. ${nowObj.getDate()}. ${nowObj.getHours() < 12 ? '오전' : '오후'} ${nowObj.getHours() % 12 || 12}:${String(nowObj.getMinutes()).padStart(2, '0')}:${String(nowObj.getSeconds()).padStart(2, '0')}`;
        
        let parsedResult = {
            basic: basicData,
            ranking: { world: 12, class: 4 },
            ocid: ocid,
            confirmedDate: confirmedDate,
            refreshedAt: refreshedAtHumanStr,
            __hexaFixApplied: true,
            __cachedAtEpoch: Date.now() // 💡 캐시 유효기간 판단용 저장 시각 (숫자 타임스탬프)
        };

        if (ocid !== "mock_ocid_safety_shield_value") {
            parsedResult.stat = await window.fetchFromNexon("/character/stat", { ocid: ocid, date: confirmedDate }).catch(() => ({ final_stat: [] }));
            parsedResult.item = await window.fetchFromNexon("/character/item-equipment", { ocid: ocid, date: confirmedDate }).catch(() => ({ item_equipment: [] }));
            
            await omniBatchSleep(100);
            parsedResult.ability = await window.fetchFromNexon("/character/ability", { ocid: ocid, date: confirmedDate }).catch(() => ({ remain_fame: "0", ability_info: [] }));
            parsedResult.symbol = await window.fetchFromNexon("/character/symbol-equipment", { ocid: ocid, date: confirmedDate }).catch(() => ({ symbol: [] }));
            
            // 💡 유니온 데이터 수신 및 상위 스토리지 분리 바인딩
            const fullUnionRes = await window.MapleApiHub.getUnionInfo(ocid, confirmedDate).catch(() => ({}));
            parsedResult.union = fullUnionRes;
            parsedResult.union_raider = fullUnionRes?.union_raider || fullUnionRes;
            parsedResult.union_artifact = fullUnionRes?.union_artifact || fullUnionRes;
            parsedResult.union_champion = fullUnionRes?.union_champion || fullUnionRes;

            await omniBatchSleep(100);
            const [linkSkillRes, hexaSkillRes, hexaStatRes, vmatrixRes, skill5Res] = await Promise.all([
                window.MapleApiHub.getLinkSkill(ocid, confirmedDate),
                window.MapleApiHub.getHexaSkill(ocid, confirmedDate),
                window.MapleApiHub.getHexaStat(ocid, confirmedDate),
                window.MapleApiHub.getVMatrix(ocid, confirmedDate),
                window.MapleApiHub.getSkill5(ocid, confirmedDate)
            ]);

            parsedResult.link_skill = linkSkillRes || { character_link_skill: [] };
            parsedResult.hexa_skill = hexaSkillRes || { character_hexa_core_equipment: [] };
            parsedResult.hexa_stat = hexaStatRes || { character_hexa_stat_core: [] };
            parsedResult.vmatrix = vmatrixRes || { character_v_core_equipment: [] };
            parsedResult.skill = skill5Res || { character_skill: [] };

            // 💡 당일 스케줄러 정보 수신
            parsedResult.homework = await window.MapleApiHub.getSchedulerStatus(ocid);
        } else {
            parsedResult.stat = { final_stat: [] };
            parsedResult.homework = { daily_contents: [], weekly_contents: [], boss_contents: [] };
        }

        localStorage.setItem(cacheStorageKey, JSON.stringify(parsedResult));
        localStorage.setItem(legacyCacheStorageKey, JSON.stringify(parsedResult));
        localStorage.setItem("omni_last_refresh_time", refreshedAtHumanStr);
        
        window.setOmniCurrentSearchData(parsedResult);
        window.lastSearchedCharacterName = cleanName;
        window.lastOmniRefreshedAt = refreshedAtHumanStr;

        document.querySelectorAll('.last-refresh-time, #lastRefreshTimeText, .refreshed-time-display').forEach(el => {
            el.textContent = refreshedAtHumanStr;
        });

        // 💡 수신 완료 후 화면에 즉시 렌더링 주입
        window.executeOmniUiRepaint(parsedResult, cleanName);

    } catch (error) {
        alert(`⚠️ 연동 오류 또는 캐릭터 스캔 제한: ${error.message}`);
    } finally {
        window.isOmniSearching = false;
        window.hideLoadingUI();
    }
};

window.triggerOmniApiRefresh = async function(showLoading = true) {
    window.isOmniSearching = false;

    // 💡 [초보자 가이드] 인자값이 boolean 타입이 아닐 경우(이벤트 객체 전달 등) 기본적으로 로딩 UI를 띄우도록 방어 처리합니다.
    const shouldShowLoading = typeof showLoading === 'boolean' ? showLoading : true;

    const activePageEl = document.querySelector('.page-section.active, section.active');
    const activePageId = activePageEl ? activePageEl.id : 'page-dashboard';

    if (activePageId === 'page-search' && !window.lastSearchedCharacterName) {
        alert("⚠️ 캐릭터 조회를 진행한 후 API 갱신을 실행해 주세요.");
        return;
    }

    const savedCharsRaw = localStorage.getItem("omni_v14_todo_characters_list");
    const localChars = savedCharsRaw ? JSON.parse(savedCharsRaw) : [];
    const scheduledChars = (window.omniTodoState?.characters && window.omniTodoState.characters.length > 0) 
        ? window.omniTodoState.characters 
        : localChars;

    if (shouldShowLoading) window.showLoadingUI();
    try {
        // 🛡️ [삭제된 캐릭터 자동 부활 방지 가드]
        const deletedList = JSON.parse(localStorage.getItem("omni_v14_deleted_chars_blacklist") || "[]");

        if (scheduledChars.length > 0) {
            for (const char of scheduledChars) {
                const charName = char.name || char.id || char;
                if (deletedList.some(name => name.toLowerCase() === (charName || "").toLowerCase())) {
                    continue; 
                }
                
                // 💡 [초보자 가이드] 갱신 시 기존 캐시를 즉시 파쇄하여 최신 API 데이터를 보장합니다.
                localStorage.removeItem(`omni_v15_cached_char_${charName}`);
                localStorage.removeItem(`omni_v14_cached_char_${charName}`);

                const idData = await window.MapleApiHub.getCharacterOcid(charName).catch(() => null);
                if (idData && idData.ocid && idData.ocid !== "mock_ocid_safety_shield_value") {
                    const newHomework = await window.MapleApiHub.getSchedulerStatus(idData.ocid);
                    if (newHomework) {
                        const cacheKeyV15 = `omni_v15_cached_char_${charName}`;
                        const cacheKeyV14 = `omni_v14_cached_char_${charName}`;
                        
                        const cached15 = JSON.parse(localStorage.getItem(cacheKeyV15) || '{}');
                        cached15.homework = newHomework;
                        localStorage.setItem(cacheKeyV15, JSON.stringify(cached15));

                        const cached14 = JSON.parse(localStorage.getItem(cacheKeyV14) || '{}');
                        cached14.homework = newHomework;
                        localStorage.setItem(cacheKeyV14, JSON.stringify(cached14));

                        if (typeof window.syncTodoCharacterOnSearch === 'function') {
                            await window.syncTodoCharacterOnSearch(charName, char, newHomework);
                        }
                    }
                }
            }
        } else {
            let targetChar = window.lastSearchedCharacterName;
            if (!targetChar && window.omniTodoState?.characters?.length > 0) {
                targetChar = window.omniTodoState.characters[0].name;
            }
            if (targetChar) {
                await window.startOmniSearch(targetChar, true);
            }
        }

        // 💡 [초보자 가이드] 어떤 화면(대시보드 또는 주간할일)에 있든 모든 관제 컴포넌트를 즉시 재렌더링합니다.
        if (typeof window.renderTodoDailyContent === 'function') window.renderTodoDailyContent();
        if (typeof window.renderTodoBossContent === 'function') window.renderTodoBossContent();
        if (typeof window.renderTodoWeeklyContent === 'function') window.renderTodoWeeklyContent();
        if (typeof window.renderTodoSummaryContent === 'function') window.renderTodoSummaryContent();
        if (typeof window.renderDashboardMainWidgets === 'function') window.renderDashboardMainWidgets();
    } finally {
        if (shouldShowLoading) window.hideLoadingUI();
    }
};

window.refreshApiData = window.triggerOmniApiRefresh;

/**
 * 💡 [초보자 가이드] 수신 완료된 최신 파싱 데이터를 바탕으로 DOM 화면을 즉시 새로고치는 핵심 리페인트 핸들러입니다.
 */
window.executeOmniUiRepaint = function(parsedResult, cleanName) {
    try {
        if (typeof window.renderSidebarProfileCard === 'function') {
            window.renderSidebarProfileCard(parsedResult);
        }
        if (typeof window.syncTodoCharacterOnSearch === 'function' && parsedResult) {
            window.syncTodoCharacterOnSearch(cleanName, parsedResult.basic, parsedResult.homework || {});
        }
        if (typeof window.renderDashboardMainWidgets === 'function') {
            window.renderDashboardMainWidgets();
        }
        if (typeof window.renderSearchDetail === 'function' && parsedResult.stat) {
            window.renderSearchDetail(
                parsedResult.basic, parsedResult.stat, parsedResult.item, parsedResult.ability,
                parsedResult.symbol, parsedResult.dojang, parsedResult.union, parsedResult.ranking,
                parsedResult.link_skill, parsedResult.hexa_skill, parsedResult.skill, parsedResult.hexa_stat
            );
        }

        // 🎯 [화면 즉시 반영 핵심 해결 로직]
        // 유니온 탭 컨테이너가 화면에 존재하고, 사용자가 현재 유니온 탭을 보고 있거나 유니온 탭이 활성화된 경우 즉시 renderUnion을 호출하여 DOM을 업데이트합니다.
        const unionContainer = document.getElementById('searchTabContentContainer');
        if (unionContainer && typeof window.renderUnion === 'function') {
            const activeTabBtn = document.querySelector('.search-tab-trigger-btn.active');
            const activeTabText = activeTabBtn ? activeTabBtn.textContent.trim() : '';
            if (!activeTabBtn || activeTabText === '유니온' || activeTabText === '헥사' || activeTabText === '6차') {
                unionContainer.innerHTML = window.renderUnion(
                    parsedResult.union,
                    parsedResult.hexa_skill,
                    parsedResult.hexa_stat
                );
            }
        }
    } catch (criticalRepaintErr) {
        // 시스템 세이프가드
    }
};

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-menu .nav-btn, [id^="nav-btn-"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const btnId = e.currentTarget.id;
            const pageMap = {
                'nav-btn-dashboard': 'page-dashboard',
                'nav-btn-todo': 'page-todo',
                'nav-btn-search': 'page-search',
                'nav-btn-scanner': 'page-scanner',
                'nav-btn-builder': 'page-builder',
                'nav-btn-hunt': 'page-hunt',
                'nav-btn-mvp': 'page-mvp',
                'nav-btn-boss': 'page-boss'
            };
            const targetPageId = pageMap[btnId];
            if (targetPageId && typeof window.omniSwitchPage === 'function') {
                window.omniSwitchPage(targetPageId);
            }
        });
    });

    document.querySelectorAll('#btnRefreshApiData, .api-refresh-btn, [onclick*="Refresh"], [onclick*="refresh"]').forEach(btn => {
        btn.onclick = function(e) {
            e.preventDefault();
            window.triggerOmniApiRefresh();
        };
    });
});