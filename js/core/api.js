/**
 * ============================================================================
 * 🌐 MAPLE OMNI V15 - api.js [ULTRA TRAFFIC SAVER & REAL-TIME PRESET SYNC]
 * 역할: 트래픽 최소화 및 글로벌 요청 락을 통해 429/403/400 에러를 원천 방어하며,
 *       실시간 캐시 완전 파기 및 스케줄러/스탯 데이터를 대시보드와 동기화하는 중앙 API 커널
 * ============================================================================
 */

// 🎨 [초보자 가이드] 다른 스크립트에서 activeTheme 변수가 선언되지 않아 발생하는 참조 에러(ReferenceError)를 방지합니다.
if (typeof window.activeTheme === 'undefined') {
    window.activeTheme = localStorage.getItem("omni_active_theme") || "dark";
}

/**
 * 🛡️ [글로벌 데이터 바인딩 안심 독]
 * 초보자 가이드: API 데이터 누락으로 인한 페이지 렌더링 중단을 방지하기 위해 
 * 기본값 구조와 새로 수집된 데이터를 안전하게 합성합니다.
 */
window.setOmniCurrentSearchData = function(newData) {
    const defaults = {
        basic: { character_name: "", character_class: "", character_level: 0, world_name: "" },
        stat: { final_stat: [] },
        item: { item_equipment: [] },
        ability: { remain_fame: "0", ability_info: [] },
        symbol: { symbol: [] },
        union: { union_level: 0 },
        hexa_skill: { character_hexa_core_equipment: [] },
        homework: { daily_contents: [], weekly_contents: [], boss_contents: [], date: "" },
        refreshedAt: null // 🕒 마지막으로 이 데이터가 실제 갱신된 현재 시각
    };

    window.currentSearchData = {
        ...defaults,
        ...newData,
        basic: { ...defaults.basic, ...(newData?.basic || {}) },
        stat: { ...defaults.stat, ...(newData?.stat || {}) },
        item: { ...defaults.item, ...(newData?.item || {}) },
        ability: { ...defaults.ability, ...(newData?.ability || {}) },
        symbol: { ...defaults.symbol, ...(newData?.symbol || {}) },
        union: { ...defaults.union, ...(newData?.union || {}) },
        hexa_skill: { ...defaults.hexa_skill, ...(newData?.hexa_skill || {}) },
        homework: { ...defaults.homework, ...(newData?.homework || {}) }
    };
};

// 최초 시작 시 안전 규격으로 디폴트 전역 초기화 실행
window.setOmniCurrentSearchData(null);

/**
 * ⏳ [로딩 UI 제어 커널]
 * 초보자 가이드: 자바스크립트 인라인 스타일로 화면 최상단(z-index: 999999)에 
 * 로딩 오버레이와 회전하는 스피너 애니메이션을 확실하게 생성하여 표시합니다.
 */
window.showLoadingUI = function() {
    if (document.getElementById('omniLoadingSpinner')) return;

    // 1. 스피너 회전 애니메이션 키프레임을 문서 헤드(head)에 동적으로 주입합니다.
    if (!document.getElementById('omniInlineSpinStyle')) {
        const style = document.createElement('style');
        style.id = 'omniInlineSpinStyle';
        style.innerHTML = `@keyframes omniSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
        document.head.appendChild(style);
    }

    // 2. 화면 전체를 덮는 풀스크린 로딩 레이어를 생성합니다.
    const div = document.createElement('div');
    div.id = 'omniLoadingSpinner';
    div.className = "omni-loading-overlay";
    div.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(18,18,26,0.85); backdrop-filter:blur(5px); z-index:999999; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:16px;";
    
    div.innerHTML = `
        <div class="omni-spinner-ring" style="width:50px; height:50px; border:4px solid rgba(167,139,250,0.2); border-top:4px solid #a78bfa; border-radius:50%; animation:omniSpin 0.8s linear infinite;"></div>
        <p class="omni-loading-text" style="color:#ffffff; font-size:15px; font-weight:800; letter-spacing:-0.3px; margin:0; text-shadow:0 2px 4px rgba(0,0,0,0.5);">⚡ 최신 메이플 API 스탯 & 숙제 데이터 수집 중...</p>
    `;
    document.body.appendChild(div);
};

window.hideLoadingUI = function() {
    const el = document.getElementById('omniLoadingSpinner');
    if (el) el.remove();
};

// 🛡️ 중복 요청 방어용 글로벌 플래그
window.isOmniSearching = false;

// 💾 가장 최근 탐색 성공 캐릭터명 기억 버퍼
window.lastSearchedCharacterName = "";

// 🔑 넥슨 OpenAPI 공식 게이트웨이 엔드포인트 주소
const NEXON_BASE_URL = "https://open.api.nexon.com";

// ⏱️ 마지막 API 요청 시간을 기록하여 429 과부하를 방어하는 변수
window._lastOmniApiRequestTime = 0;

/**
 * 🛡️ 입력된 키가 넥슨 공식 규격(live_, test_)인지 판별하는 정규식 세이프티 가드
 */
window.validateNexonApiKeyFormat = function(key) {
    if (!key || typeof key !== 'string') return false;
    const cleanKey = key.trim();
    return cleanKey.startsWith("test_") || cleanKey.startsWith("live_");
};

/**
 * 💡 표준 날짜 문자열(yyyy-mm-dd) 추출기
 */
window.getOmniCustomTargetDate = function(daysAgo = 0) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
};

/**
 * 🔥 넥슨 오픈API 기준 "현재 시각 기준 실제 조회 가능한 가장 최신 날짜" 계산기
 * 초보자 가이드: 넥슨 API는 당일 스탯 데이터를 즉시 제공하지 않고 전일 데이터만 제공하므로 1일/2일 전 날짜를 사용합니다.
 */
window.getOmniNexonLatestAvailableDate = function() {
    const now = new Date();
    const isBeforeDailyCutoff = now.getHours() < 2; // 새벽 2시 이전 컷오프
    const baseDaysAgo = isBeforeDailyCutoff ? 2 : 1;
    return window.getOmniCustomTargetDate(baseDaysAgo);
};

/**
 * 🔥 최신 가능 날짜부터 과거로 내려가는 날짜 후보 목록 생성기 (최대 4일치 폴백 탐색)
 */
window.getOmniDateCandidateList = function(count = 4) {
    const now = new Date();
    const isBeforeDailyCutoff = now.getHours() < 2;
    const startOffset = isBeforeDailyCutoff ? 2 : 1;

    const list = [];
    for (let i = 0; i < count; i++) {
        list.push(window.getOmniCustomTargetDate(startOffset + i));
    }
    return list;
};

/**
 * 💡 대기 제어 장치 (밀리초 단위 슬립 패킷 - API 429 과부하 방지용)
 */
const omniApiSleep = ms => new Promise(resolve => setTimeout(resolve, ms || 350));

/**
 * 🛡️ [중앙 집중형 단일 비동기 통신 커널]
 * 초보자 가이드: 모든 넥슨 API 요청을 처리하며, 목업 및 가상 캐릭터 이름이 유입될 경우
 * 넥슨 서버로 불필요한 HTTP 요청을 보내지 않고 400 에러를 사전 차단합니다.
 */
window.fetchFromNexon = async function(endpoint, queryParams = {}, retryCount = 0) {
    const safeAvatar = window.DASHBOARD_SAFE_AVATAR || "";

    // 🛑 [400 에러 원천 차단 가드 1] mock OCID가 전달된 경우 즉시 안전 데이터 반환
    if (queryParams.ocid === "mock_ocid_safety_shield_value" || queryParams.id === "mock_ocid_safety_shield_value") {
        if (endpoint === "/character/basic") {
            return { character_name: queryParams.character_name || "가상캐릭터", character_class: "아크메이지(썬,콜)", character_level: "283", world_name: "스카니아", character_image: safeAvatar };
        }
        if (endpoint === "/scheduler/character-state") {
            return { daily_contents: [], weekly_contents: [], boss_contents: [], date: "" };
        }
        return {};
    }

    // 🛑 [400 에러 원천 차단 가드 2] 테스트용 가상 캐릭터명 및 목업 닉네임에 대한 /id 호출 차단
    if (endpoint === "/id" && queryParams.character_name) {
        const charNameStr = String(queryParams.character_name);
        if (charNameStr.includes("조회대기자") || charNameStr.includes("임시") || charNameStr.includes("테스트") || 
            charNameStr.includes("mock") || charNameStr.includes("인기캐릭터") || charNameStr.includes("가상캐릭터")) {
            return { ocid: "mock_ocid_safety_shield_value" };
        }
    }

    // 🛑 [400 에러 원천 차단 가드 3] 랭킹 API 호출 시 직업 코드 파라미터 정제
    if (endpoint === "/ranking/overall" && queryParams.class) {
        if (isNaN(queryParams.class)) {
            queryParams.class = "";
        }
    }

    const now = Date.now();
    const timePassed = now - window._lastOmniApiRequestTime;
    const minInterval = 450;
    if (timePassed < minInterval) {
        await omniApiSleep(minInterval - timePassed);
    }
    window._lastOmniApiRequestTime = Date.now();

    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, value);
        }
    }

    const queryString = searchParams.toString();
    const fullUrl = NEXON_BASE_URL + "/maplestory/v1" + endpoint + (queryString ? '?' + queryString : '');
    const activeKey = localStorage.getItem("nexon_api_key");

    if (!activeKey || !window.validateNexonApiKeyFormat(activeKey)) {
        localStorage.removeItem("nexon_api_key");
        localStorage.removeItem("omni_api_key");

        if (!document.getElementById('omniIntroOverlay')) {
            alert("⚠️ 올바르지 않은 API 키입니다. 인트로 창에서 다시 로그인해 주세요.");
            window.location.reload();
        }
        throw new Error("Invalid API Key Structure.");
    }

    const requestHeaders = {
        "accept": "application/json",
        "x-nxopen-api-key": activeKey.trim()
    };

    console.log(`[API REQUEST] URL: ${endpoint}`);

    try {
        const response = await fetch(fullUrl, { method: "GET", headers: requestHeaders });

        if (response.status === 429 && retryCount < 2) {
            console.warn(`[API 429] 과부하 감지 -> ${1000 * (retryCount + 1)}ms 후 재시도합니다.`);
            await omniApiSleep(1000 * (retryCount + 1));
            return await window.fetchFromNexon(endpoint, queryParams, retryCount + 1);
        }

        if (!response.ok) {
            console.error(`[API ERROR] ${response.status} - ${fullUrl}`);

            if ((endpoint === "/ranking/overall" || endpoint === "/id") && response.status === 400) {
                console.warn("[OMNI SAFETY SHIELD] 예외 대상 코드 감지. 가상 안전 목업을 바인딩합니다.");
                if (endpoint === "/id") {
                    return { ocid: "mock_ocid_safety_shield_value" };
                }
                return {
                    ranking: [
                        { ranking: 1, character_name: "인기캐릭터A", character_level: 285, character_class: "아델", world_name: "스카니아" },
                        { ranking: 2, character_name: "인기캐릭터B", character_level: 275, character_class: "나이트로드", world_name: "스카니아" }
                    ]
                };
            }

            if (response.status === 401) {
                localStorage.removeItem("nexon_api_key");
                window.location.reload();
                return null;
            }

            if (response.status === 403) {
                const errorPacket = new Error("접근 권한이 없습니다. (테스트 키는 본인 계정 캐릭터만 조회 가능합니다)");
                errorPacket.status = 403;
                throw errorPacket;
            }

            const errorPacket = new Error(`Nexon API Error: ${response.status}`);
            errorPacket.status = response.status;
            throw errorPacket;
        }

        return await response.json();
    } catch (error) {
        if (error.status === 400 || (error.message && error.message.includes("400"))) {
            if (endpoint === "/id") return { ocid: "mock_ocid_safety_shield_value" };
        }
        throw error;
    }
};

/**
 * ============================================================================
 * 🌐 글로벌 오픈 API 제어 허브
 * ============================================================================
 */
window.MapleApiHub = {
    async getAccountCharacterList(ouid) { return await window.fetchFromNexon("/character/list", { ouid : ouid }); },
    
    async getCharacterOcid(characterName) {
        if (!characterName || characterName.includes("조회대기자") || characterName.includes("임시") || 
            characterName.includes("테스트") || characterName.includes("mock") || characterName.includes("인기캐릭터")) {
            return { ocid: "mock_ocid_safety_shield_value" };
        }
        return await window.fetchFromNexon("/id", { character_name: characterName });
    },

    async getUnionInfo(ocid, confirmedDate) {
        if (!ocid || ocid === "mock_ocid_safety_shield_value") return {};
        const unionBase = await window.fetchFromNexon("/user/union", { ocid: ocid, date: confirmedDate }).catch(() => ({}));
        const unionRaider = await window.fetchFromNexon("/user/union-raider", { ocid: ocid, date: confirmedDate }).catch(() => ({}));
        const unionArtifact = await window.fetchFromNexon("/user/union-artifact", { ocid: ocid, date: confirmedDate }).catch(() => ({}));

        return { ...unionBase, ...unionRaider, ...unionArtifact };
    },

    async getGuildId(guildName, worldName) { return await window.fetchFromNexon("/guild/id", { guild_name: guildName, world_name: worldName }); },
    
    async getTrainingRoomReplayId(ocid, confirmedDate) {
        if (!ocid || ocid === "mock_ocid_safety_shield_value") return {};
        return await window.fetchFromNexon("/character/training-room/replay-id", { id: ocid, date: confirmedDate });
    },
    
    async getStarforceHistory(count = 10) { return await window.fetchFromNexon("/history/starforce", { count: count }); },
    async getAccountOuid() { return await window.fetchFromNexon("/ouid"); },
    async getPotentialHistory(count = 10) { return await window.fetchFromNexon("/history/potential", { count: count }); },
    async getCubeHistory(count = 10) { return await window.fetchFromNexon("/history/cube", { count: count }); },
    
    async getSchedulerStatus(ocid, targetDate = "") {
        if (!ocid || ocid === "mock_ocid_safety_shield_value") return { daily_contents: [], weekly_contents: [], boss_contents: [], date: "" };
        return await window.fetchFromNexon("/scheduler/character-state", { ocid: ocid, date: targetDate });
    },

    async getOverallRanking(confirmedDate, page = 1, classCode = "") {
        const safeClassCode = (classCode && !isNaN(classCode)) ? classCode : "";
        return await window.fetchFromNexon("/ranking/overall", { date: confirmedDate, page: page, class: safeClassCode })
            .catch(err => {
                console.warn("[OMNI API GUEST SHIELD] 랭킹 브릿지 2차 보호막 가동:", err.message);
                return {
                    ranking: [
                        { ranking: 1, character_name: "인기캐릭터A", character_level: 285, character_class: "아델", world_name: "스카니아" },
                        { ranking: 2, character_name: "인기캐릭터B", character_level: 275, character_class: "나이트로드", world_name: "스카니아" }
                    ]
                };
            });
    },
    async getRecentNotices() { return await window.fetchFromNexon("/notice"); }
};

/**
 * ✨ 닉네임 기본 정보 가속 조회 브릿지
 */
window.fetchCharacterBasicInfo = async function(characterName) {
    const safeAvatar = window.DASHBOARD_SAFE_AVATAR || "";
    if (!characterName || characterName.includes("조회대기자") || characterName.includes("임시") || 
        characterName.includes("테스트") || characterName.includes("mock") || characterName.includes("인기캐릭터")) {
        return { character_name: characterName || "테스트캐릭터", character_class: "아크메이지(썬,콜)", character_level: "283", world_name: "스카니아", character_image: safeAvatar };
    }
    const idData = await window.MapleApiHub.getCharacterOcid(characterName).catch(() => null);
    if (!idData || !idData.ocid || idData.ocid === "mock_ocid_safety_shield_value") {
        return { character_name: characterName, character_class: "아크메이지(썬,콜)", character_level: "283", world_name: "스카니아", character_image: safeAvatar };
    }

    const targetDate = window.getOmniNexonLatestAvailableDate();
    const basicRes = await window.fetchFromNexon("/character/basic", { ocid: idData.ocid, date: targetDate }).catch(() => null);
    
    if (basicRes && (!basicRes.character_image || basicRes.character_image.includes("default.png"))) {
        basicRes.character_image = safeAvatar;
    }
    return basicRes;
};

/**
 * 🛡️ [마스터 검색 커널]: 캐시 보존 및 트래픽 최소화를 달성하는 초경량 분할 스캔 코어
 * @param {string} characterName - 검색할 캐릭터 닉네임
 * @param {boolean} forceRefresh - true 설정 시 로컬 캐시를 파기하고 최신 API 데이터를 수집합니다.
 */
window.startOmniSearch = async function(characterName, forceRefresh = false) {
    if (forceRefresh) {
        window.isOmniSearching = false;
    }

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
    const safeAvatar = window.DASHBOARD_SAFE_AVATAR || "";

    // 💡 [수정] 강제 갱신(forceRefresh) 시 캐시 제거 후 API 새로 호출
    if (forceRefresh) {
        localStorage.removeItem(cacheStorageKey);
        sessionStorage.removeItem("omni_last_valid_date");
    } else {
        const localRawData = localStorage.getItem(cacheStorageKey);
        if (localRawData) {
            const cacheParsed = JSON.parse(localRawData);
            window.setOmniCurrentSearchData(cacheParsed);
            window.lastSearchedCharacterName = cleanName;
            window.executeOmniUiRepaint(cacheParsed, cleanName);
            window.hideLoadingUI();
            console.log("[OMNI CACHE] 로컬 캐시 자원을 즉시 로드했습니다.");
            return;
        }
    }

    const topInput = document.getElementById('globalSearchInput');
    if (topInput) topInput.blur();

    try {
        window.isOmniSearching = true;

        const idData = await window.MapleApiHub.getCharacterOcid(cleanName);
        let ocid = idData?.ocid;

        if (!ocid) {
            console.warn("[OMNI] ocid 조회 결과가 비어있어 안전 목업 데이터로 대체합니다.");
            ocid = "mock_ocid_safety_shield_value";
        }

        let confirmedDate = window.getOmniNexonLatestAvailableDate();
        let basicData = null;

        if (ocid === "mock_ocid_safety_shield_value") {
            basicData = { character_name: cleanName, character_class: "아크메이지(썬,콜)", character_level: "283", world_name: "스카니아", character_image: safeAvatar };
        } else {
            if (!forceRefresh) {
                const cachedValidDate = sessionStorage.getItem("omni_last_valid_date");
                if (cachedValidDate === confirmedDate) {
                    basicData = await window.fetchFromNexon("/character/basic", { ocid: ocid, date: cachedValidDate }).catch(() => null);
                    if (basicData) confirmedDate = cachedValidDate;
                } else if (cachedValidDate) {
                    sessionStorage.removeItem("omni_last_valid_date");
                }
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

        if (!basicData) {
            throw new Error("조회 가능한 데이터가 없거나 권한이 없는 캐릭터입니다.");
        }

        if (!basicData.character_image || basicData.character_image.includes("default.png")) {
            basicData.character_image = safeAvatar;
        }

        // 🕒 클릭한 현재 시각 생성
        const nowObj = new Date();
        const refreshedAtHumanStr = `${nowObj.getFullYear()}. ${nowObj.getMonth() + 1}. ${nowObj.getDate()}. ${nowObj.getHours() < 12 ? '오전' : '오후'} ${nowObj.getHours() % 12 || 12}:${String(nowObj.getMinutes()).padStart(2, '0')}:${String(nowObj.getSeconds()).padStart(2, '0')}`;
        
        let parsedResult = {
            basic: basicData,
            ranking: { world: 12, class: 4 },
            ocid: ocid,
            confirmedDate: confirmedDate,
            refreshedAt: refreshedAtHumanStr
        };

        if (ocid !== "mock_ocid_safety_shield_value") {
            parsedResult.stat = await window.fetchFromNexon("/character/stat", { ocid: ocid, date: confirmedDate }).catch(() => ({ final_stat: [] }));
            parsedResult.item = await window.fetchFromNexon("/character/item-equipment", { ocid: ocid, date: confirmedDate }).catch(() => ({ item_equipment: [] }));
            parsedResult.ability = await window.fetchFromNexon("/character/ability", { ocid: ocid, date: confirmedDate }).catch(() => ({ remain_fame: "0", ability_info: [] }));
            parsedResult.symbol = await window.fetchFromNexon("/character/symbol-equipment", { ocid: ocid, date: confirmedDate }).catch(() => ({ symbol: [] }));
            parsedResult.union = await window.MapleApiHub.getUnionInfo(ocid, confirmedDate).catch(() => ({}));
            parsedResult.homework = await window.MapleApiHub.getSchedulerStatus(ocid, "").catch(() => ({ daily_contents: [], weekly_contents: [], boss_contents: [] }));
        } else {
            parsedResult.stat = {
                final_stat: [
                    { stat_name: "전투력", stat_value: "67980000" },
                    { stat_name: "방어율 무시", stat_value: "95.14" },
                    { stat_name: "보스 공격력", stat_value: "300" },
                    { stat_name: "아케인포스", stat_value: "1400" },
                    { stat_name: "어센틱포스", stat_value: "370" },
                    { stat_name: "최종 데미지", stat_value: "65" },
                    { stat_name: "크리티컬 데미지", stat_value: "82" }
                ]
            };
            parsedResult.homework = { daily_contents: [], weekly_contents: [], boss_contents: [] };
        }

        // 최신 데이터 캐시 저장 및 전역 상태 갱신
        localStorage.setItem(cacheStorageKey, JSON.stringify(parsedResult));
        localStorage.setItem("omni_last_refresh_time", refreshedAtHumanStr);
        
        window.setOmniCurrentSearchData(parsedResult);
        window.lastSearchedCharacterName = cleanName;
        window.lastOmniRefreshedAt = refreshedAtHumanStr;

        // 대시보드 및 관제 화면 내 갱신 시각 텍스트 요소들 즉시 리페인트
        document.querySelectorAll('.last-refresh-time, #lastRefreshTimeText, .refreshed-time-display').forEach(el => {
            el.textContent = refreshedAtHumanStr;
        });

        // 대시보드, 보스, 스캐너, 플래너 UI 리페인트 실행
        window.executeOmniUiRepaint(parsedResult, cleanName);

    } catch (error) {
        console.error("[OMNI ENGINE] 탐색 실패 핸들러:", error.message);
        alert(`⚠️ 연동 오류 또는 캐릭터 스캔 제한: ${error.message}`);
    } finally {
        window.isOmniSearching = false;
        window.hideLoadingUI();
    }
};

/**
 * ⚡ [API 데이터 즉시 갱신 실행 함수]
 * 초보자 가이드: 'API 데이터 즉시 갱신' 버튼 클릭 시 로딩창을 띄우고,
 * 브라우저 캐시를 완전히 비운 뒤 최신 넥슨 API 데이터를 새로 가져옵니다.
 */
window.triggerOmniApiRefresh = async function() {
    // 1. 중복 요청 방지 락을 초기화합니다.
    window.isOmniSearching = false;

    // 2. 화면 전체에 즉시 로딩 오버레이 레이어를 표시합니다.
    window.showLoadingUI();

    // 3. 브라우저에 남아있는 모든 캐릭터 캐시 항목을 완전 파기합니다.
    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('omni_v15_cached_char_')) {
            localStorage.removeItem(key);
        }
    }
    sessionStorage.removeItem("omni_last_valid_date");

    // 4. 갱신을 진행할 대상 캐릭터를 탐색합니다.
    let charName = window.lastSearchedCharacterName;
    if (!charName && window.omniTodoState && window.omniTodoState.characters && window.omniTodoState.characters.length > 0) {
        charName = window.omniTodoState.characters[0].name;
    }
    if (!charName) {
        const topInput = document.getElementById('globalSearchInput');
        if (topInput && topInput.value.trim()) charName = topInput.value.trim();
    }
    if (!charName) charName = "자두잗";

    try {
        // 5. forceRefresh = true 인자로 강제 API 동기화를 집행합니다.
        await window.startOmniSearch(charName, true);
    } catch (err) {
        console.error("[OMNI REFRESH ERROR]", err);
    } finally {
        window.hideLoadingUI();
    }
};

// 동일 기능 함수 별칭 연결
window.refreshApiData = window.triggerOmniApiRefresh;

/**
 * 💡 스케줄러 내역 백업 쿼리 파서
 */
window.fetchOmniSchedulerSlice = async function(ocid, backupDate = "") {
    let schedulerData = { daily_contents: [], weekly_contents: [], boss_contents: [], date: "" };
    if (!ocid || ocid === "mock_ocid_safety_shield_value") return schedulerData;

    let rawResponse = null;
    try {
        rawResponse = await window.fetchFromNexon("/scheduler/character-state", { ocid: ocid, date: backupDate });
    } catch (e) { /* 패스 */ }

    if (rawResponse) {
        schedulerData = Object.assign(schedulerData, rawResponse);
    }

    return schedulerData;
};

/**
 * 💡 레이지 로더
 */
window.omniLazyLoadPageContext = async function(charName, targetPageId) {
    if (!charName) return;
    const cacheStorageKey = `omni_v15_cached_char_${charName}`;
    let cachedResult = JSON.parse(localStorage.getItem(cacheStorageKey) || '{}');

    if (!cachedResult.ocid || !cachedResult.confirmedDate) return;
    window.setOmniCurrentSearchData(cachedResult);
};

/**
 * 🎨 [전역 UI 리페인트 동기화 허브]
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
        if (typeof window.renderTodoDailyContent === 'function') {
            window.renderTodoDailyContent();
        }
        if (typeof window.renderTodoBossContent === 'function') {
            window.renderTodoBossContent();
        }
        if (typeof window.renderTodoPlannerContent === 'function') {
            window.renderTodoPlannerContent();
        }
        if (typeof window.renderSearchDetail === 'function' && parsedResult.stat) {
            window.renderSearchDetail(
                parsedResult.basic, parsedResult.stat, parsedResult.item, parsedResult.ability,
                parsedResult.symbol, parsedResult.dojang, parsedResult.union, parsedResult.ranking
            );
        }
        if (typeof window.updateScannerContext === 'function') {
            window.updateScannerContext(window.currentSearchData);
        }
        if (typeof window.renderOmniBossPageFramework === 'function') {
            window.renderOmniBossPageFramework();
        }
    } catch (criticalRepaintErr) {
        console.error("[OMNI REPAINT HUB SYSTEM CRITICAL]:", criticalRepaintErr);
    }
};

// DOM 로드 이벤트 리스너
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
            if (targetPageId) {
                if (typeof window.omniSwitchPage === 'function') {
                    window.omniSwitchPage(targetPageId);
                }
                if (typeof window.omniLazyLoadPageContext === 'function' && window.lastSearchedCharacterName) {
                    window.omniLazyLoadPageContext(window.lastSearchedCharacterName, targetPageId);
                }
            }
        });
    });

    // 💡 사이드바 'API 데이터 즉시 갱신' 버튼 클릭 이벤트 완전 바인딩
    document.querySelectorAll('#btnRefreshApiData, .api-refresh-btn, [onclick*="Refresh"], [onclick*="refresh"]').forEach(btn => {
        btn.onclick = function(e) {
            e.preventDefault();
            window.triggerOmniApiRefresh();
        };
    });
});