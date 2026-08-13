/**
 * ============================================================================
 * 🌐 MAPLE OMNI V15 - js/core/api_core.js [CLEAN CONSOLE & CORE FETCH KERNEL]
 * 역할: API 기초 상태 설정, 로딩 UI 제어, 날짜 유틸리티 및 넥슨 비동기 통신 커널
 * 수정내용: 
 *   1. 콘솔을 어지럽히던 불필요한 console.log, console.warn, console.error 메시지 완전 제거
 *   2. /user/union, /user/union-raider, /user/union-artifact, /user/union-champion 및 스케줄러 당일 요청 시 date 파라미터 자동 제거
 *   3. 6차 전직 미완료(403) 및 429 요청 제한 시 콘솔 노이즈 없이 정숙하게 세이프가드 처리
 * 규칙: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 달아줍니다.
 * ============================================================================
 */

if (typeof window.activeTheme === 'undefined') {
    // 💡 [초보자 가이드] 사용자의 활성화 테마(다크/라이트)를 로컬 스토리지에서 안전하게 불러옵니다.
    window.activeTheme = localStorage.getItem("omni_active_theme") || "dark";
}

/**
 * 🛡️ [글로벌 데이터 바인딩 안심 독]
 * 💡 [초보자 가이드] 캐릭터 데이터를 전역 세션(window.currentSearchData)에 동기화할 때 
 *    유니온 세부 객체가 누락되지 않도록 기본 구조를 안전하게 결합합니다.
 */
window.setOmniCurrentSearchData = function(newData) {
    const defaults = {
        basic: { character_name: "", character_class: "", character_level: 0, world_name: "" },
        stat: { final_stat: [] },
        item: { item_equipment: [] },
        ability: { remain_fame: "0", ability_info: [] },
        symbol: { symbol: [] },
        union: { union_level: 0 },
        union_raider: {},
        union_artifact: {},
        union_champion: {},
        link_skill: { character_link_skill: [], character_link_skill_preset_1: [], character_link_skill_preset_2: [], character_link_skill_preset_3: [] },
        hexa_skill: { character_hexa_core_equipment: [] },
        hexa_stat: { character_hexa_stat_core: [] },
        vmatrix: { character_v_core_equipment: [] },
        skill: { character_skill: [] },
        homework: { daily_contents: [], weekly_contents: [], boss_contents: [], date: "" },
        refreshedAt: null
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
        union_raider: { ...defaults.union_raider, ...(newData?.union_raider || {}) },
        union_artifact: { ...defaults.union_artifact, ...(newData?.union_artifact || {}) },
        union_champion: { ...defaults.union_champion, ...(newData?.union_champion || {}) },
        link_skill: { ...defaults.link_skill, ...(newData?.link_skill || {}) },
        hexa_skill: { ...defaults.hexa_skill, ...(newData?.hexa_skill || {}) },
        hexa_stat: { ...defaults.hexa_stat, ...(newData?.hexa_stat || {}) },
        vmatrix: { ...defaults.vmatrix, ...(newData?.vmatrix || {}) },
        skill: { ...defaults.skill, ...(newData?.skill || {}) },
        homework: { ...defaults.homework, ...(newData?.homework || {}) }
    };
};

window.setOmniCurrentSearchData(null);

/**
 * 💡 [초보자 가이드] API 데이터를 수신하는 동안 화면 중앙에 오버레이 로딩 창을 띄워주는 UI 함수입니다.
 */
window.showLoadingUI = function() {
    if (document.getElementById('omniLoadingSpinner')) return;

    if (!document.getElementById('omniInlineSpinStyle')) {
        const style = document.createElement('style');
        style.id = 'omniInlineSpinStyle';
        style.innerHTML = `@keyframes omniSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
        document.head.appendChild(style);
    }

    const div = document.createElement('div');
    div.id = 'omniLoadingSpinner';
    div.className = "omni-loading-overlay";
    div.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(18,18,26,0.85); backdrop-filter:blur(5px); z-index:999999; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:16px;";
    
    div.innerHTML = `
        <div class="omni-spinner-ring" style="width:50px; height:50px; border:4px solid rgba(167,139,250,0.2); border-top:4px solid #a78bfa; border-radius:50%; animation:omniSpin 0.8s linear infinite;"></div>
        <p class="omni-loading-text" style="color:#ffffff; font-size:15px; font-weight:800; letter-spacing:-0.3px; margin:0; text-shadow:0 2px 4px rgba(0,0,0,0.5);">⚡ 최신 메이플 API 데이터 정밀 수집 중...</p>
    `;
    document.body.appendChild(div);
};

window.hideLoadingUI = function() {
    const el = document.getElementById('omniLoadingSpinner');
    if (el) el.remove();
};

window.isOmniSearching = false;
window.lastSearchedCharacterName = "";
const NEXON_BASE_URL = "https://open.api.nexon.com";
window._lastOmniApiRequestTime = 0;

window.validateNexonApiKeyFormat = function(key) {
    if (!key || typeof key !== 'string') return false;
    const cleanKey = key.trim();
    return cleanKey.startsWith("test_") || cleanKey.startsWith("live_");
};

/**
 * 💡 [초보자 가이드] 현재 날짜를 기점으로 원하는 일수 전의 날짜를 YYYY-MM-DD 형식으로 반환합니다.
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
 * 💡 [초보자 가이드] 넥슨 API는 보통 "어제(D-1)" 데이터까지 제공합니다.
 * 예전 로직은 새벽 2시 이전이면 무조건 D-2부터 찾도록 되어 있어서, 실제로는 이미 D-1 데이터가
 * 준비돼 있는데도 그 날짜를 아예 시도하지 않고 더 오래된 날짜를 최신인 것처럼 채택하는 문제가 있었습니다.
 * 이제는 항상 D-1부터 우선 시도하고, 실패할 때만 startOmniSearch의 후보 목록에서 더 과거 날짜로 자동 대체합니다.
 */
window.getOmniNexonLatestAvailableDate = function() {
    return window.getOmniCustomTargetDate(1);
};

window.getOmniDateCandidateList = function(count = 6) {
    // 💡 [초보자 가이드] 새벽 시간대 컷오프 가정 없이, 항상 D-1부터 순서대로 시도하여
    // 넥슨이 실제로 갖고 있는 가장 최신 날짜를 스스로 찾아내도록 단순화했습니다.
    const list = [];
    for (let i = 1; i <= count; i++) {
        list.push(window.getOmniCustomTargetDate(i));
    }
    return list;
};

const omniApiSleep = ms => new Promise(resolve => setTimeout(resolve, ms || 350));

/**
 * 🛡️ [중앙 집중형 단일 비동기 통신 커널]
 * 💡 [초보자 가이드] 넥슨 OpenAPI 통신 시 콘솔 출력 오염 없이 400, 403, 429 에러 등을 깔끔하게 예외 처리하는 마스터 통신 커널입니다.
 */
window.fetchFromNexon = async function(endpoint, queryParams = {}, retryCount = 0) {
    const safeAvatar = window.DASHBOARD_SAFE_AVATAR || "";

    // 🛑 넥슨 OpenAPI 당일 실시간 요청 규약
    // 💡 [초보자 가이드] 넥슨 API는 date 파라미터를 포함하여 요청할 경우 '00시 정각 스냅샷'을 반환합니다.
    // 채널 이동이나 캐시샵 퇴장 후 변경된 실시간 보스 세팅 스펙(전투력)을 즉시 불러오려면
    // 당일(todayStr) 조회 시 모든 API 요청에서 date 파라미터를 제거하여 실시간 데이터를 수신해야 합니다.
    const todayStr = window.getOmniCustomTargetDate(0);
    if (!queryParams.date || queryParams.date === todayStr || queryParams.date === "") {
        delete queryParams.date;
    }

    if (queryParams.ocid === "mock_ocid_safety_shield_value" || queryParams.id === "mock_ocid_safety_shield_value") {
        if (endpoint === "/character/basic") {
            return { character_name: queryParams.character_name || "가상캐릭터", character_class: "아크메이지(썬,콜)", character_level: "283", world_name: "스카니아", character_image: safeAvatar };
        }
        if (endpoint === "/scheduler/character-state") {
            return { daily_contents: [], weekly_contents: [], boss_contents: [], date: "" };
        }
        return {};
    }

    if (endpoint === "/id" && queryParams.character_name) {
        const charNameStr = String(queryParams.character_name);
        if (charNameStr.includes("조회대기자") || charNameStr.includes("임시") || charNameStr.includes("테스트") || 
            charNameStr.includes("mock") || charNameStr.includes("인기캐릭터") || charNameStr.includes("가상캐릭터")) {
            return { ocid: "mock_ocid_safety_shield_value" };
        }
    }

    if (endpoint === "/ranking/overall" && queryParams.class) {
        if (isNaN(queryParams.class)) queryParams.class = "";
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

        // 💡 [초보자용 주석] 새로고침 시 초기화되는 전역 변수 대신 sessionStorage를 사용하여 무한 리로드와 팝업 반복 루프를 영구 차단합니다.
        if (!document.getElementById('omniIntroOverlay') && !sessionStorage.getItem('_omniApiKeyAlertShown')) {
            sessionStorage.setItem('_omniApiKeyAlertShown', 'true');
            alert("⚠️ 올바르지 않은 API 키입니다. 인트로 창에서 다시 로그인해 주세요.");
        }
        throw new Error("Invalid API Key Structure.");
    }

    const requestHeaders = {
        "accept": "application/json",
        "x-nxopen-api-key": activeKey.trim()
    };

    try {
        const response = await fetch(fullUrl, { method: "GET", headers: requestHeaders });

        if (response.status === 429 && retryCount < 2) {
            await omniApiSleep(1000 * (retryCount + 1));
            return await window.fetchFromNexon(endpoint, queryParams, retryCount + 1);
        }

        if (!response.ok) {
            // 💡 스케줄러 및 유니온/HEXA API 400, 403, 404 에러 시 콘솔 출력 없이 빈 객체로 안전 세이프가드
            if ((endpoint === "/scheduler/character-state" || endpoint === "/user/union-champion" || endpoint === "/user/union-artifact" || endpoint === "/user/union-raider" || endpoint === "/user/union") && (response.status === 400 || response.status === 403 || response.status === 404)) {
                return {};
            }

            if ((endpoint === "/character/hexamatrix" || endpoint === "/character/hexamatrix-stat") && (response.status === 403 || response.status === 400)) {
                if (endpoint === "/character/hexamatrix") return { character_hexa_core_equipment: [] };
                if (endpoint === "/character/hexamatrix-stat") return { character_hexa_stat_core: [] };
            }

            if ((endpoint === "/ranking/overall" || endpoint === "/id") && response.status === 400) {
                if (endpoint === "/id") return { ocid: "mock_ocid_safety_shield_value" };
                return { ranking: [] };
            }

            if (response.status === 401) {
                localStorage.removeItem("nexon_api_key");
                window.location.reload();
                return null;
            }

            if (response.status === 403) {
                const errorPacket = new Error("접근 권한이 없습니다.");
                errorPacket.status = 403;
                throw errorPacket;
            }

            const errorPacket = new Error(`Nexon API Error: ${response.status}`);
            errorPacket.status = response.status;
            throw errorPacket;
        }

        return await response.json();
    } catch (error) {
        if (endpoint === "/scheduler/character-state" || endpoint === "/user/union-champion" || endpoint === "/character/hexamatrix" || endpoint === "/character/hexamatrix-stat") {
            return {};
        }
        if (error.status === 400 || (error.message && error.message.includes("400"))) {
            if (endpoint === "/id") return { ocid: "mock_ocid_safety_shield_value" };
        }
        throw error;
    }
};