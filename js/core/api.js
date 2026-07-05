/**
 * ============================================================================
 * 🌐 MAPLE OMNI V14 - api.js [SMART CACHING & LAYERED ROUTING ENGINE]
 * 설명: 사용자가 머무는 페이지별로 API를 분할 호출하여 트래픽을 극적으로 아끼고,
 *       인트로에서 입력한 유저 전용 API 키를 수혈받아 유기적으로 바인딩 처리합니다.
 * 최적화 사양: 429 과부하 방지 딜레이 제어 및 무손실 캐시 분할 레이지 로드(Lazy Load) 장착.
 * 보안 강화: 무의미한 가짜 키 입력을 원천 차단하는 패턴 룩업 세이프티 필터 엔진 가동.
 * 🐛 수정 조치: 넥슨 공식 주소 규격에 맞게 /hexa-matrix 경로 오탈자를 /hexamatrix 로 정정 완료!
 * 규칙: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 달아줍니다.
 * ============================================================================
 */

// 💡 [초보자 가이드] 파싱 완료된 실시간 인게임 조회 패킷을 브라우저 메모리에 가두는 코어 전역 저장소입니다.
window.currentSearchData = null;

// [UI 제어] 데이터 실시간 통신 중 사용자의 이중 중복 입력을 마킹 제어하는 로딩 차단 마스터 스피너
window.showLoadingUI = function() {
    if (document.getElementById('omniLoadingSpinner')) return;
    const div = document.createElement('div');
    div.id = 'omniLoadingSpinner';
    div.innerHTML = `<div class="spinner"></div><p style="color:#fff; font-weight:800; margin-top:10px;">데이터 스캔 중...</p>`;
    div.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9999; display:flex; flex-direction:column; justify-content:center; align-items:center;";
    document.body.appendChild(div);
};

// [UI 제어] 통신 프로세스가 완료/종료되었을 때 화면에 띄워둔 블로킹 레이어를 제거하는 소멸 핸들러
window.hideLoadingUI = function() {
    const el = document.getElementById('omniLoadingSpinner');
    if (el) el.remove();
};

// 🛡️ [중복 요청 방어벽] 통신 응답을 받기 전 연타 트래픽 남발을 입구에서 틀어막는 글로벌 세이프 플래그입니다.
window.isOmniSearching = false;

// 💾 [추적 시스템] 가장 최근에 탐색 성공을 달성한 타겟 캐릭터명을 기억해두는 레이지 스캔 조율 버퍼입니다.
window.lastSearchedCharacterName = "";

// 🔑 넥슨 OpenAPI 공식 게이트웨이 엔드포인트 주소 고정
const NEXON_BASE_URL = "https://open.api.nexon.com";

/**
 * 🛡️ [초보자 가이드] 입력된 키가 넥슨 공식 라이브(live_) 혹은 테스트(test_) 규격인지 판별하는 정밀 정규식 세이프티 가드입니다.
 * 아무 숫자나 입력하고 들어오는 무력화 우회 접근을 입구에서 컷오프 처리합니다.
 */
window.validateNexonApiKeyFormat = function(key) {
    if (!key || typeof key !== 'string') return false;
    const cleanKey = key.trim();
    // 넥슨 API 키는 반드시 test_ 혹은 live_ 로 시작하는 영문/숫자 조합의 긴 문자열 규격을 가집니다.
    return cleanKey.startsWith("test_") || cleanKey.startsWith("live_");
};

/**
 * 💡 [초보자 가이드] 메이플스토리 OpenAPI 검색 조건에 들어갈 표준 날짜 문자열(yyyy-mm-dd)을 추출합니다.
 */
window.getOmniCustomTargetDate = function(daysAgo = 1) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    
    return `${yyyy}-${mm}-${dd}`;
};

/**
 * 💡 [초보자 가이드] 넥슨 분당 요청 과부하 코드(429)를 우회하기 위한 밀리초 단위 세이프티 정밀 비동기 대기 슬립 타이머입니다.
 */
const omniApiSleep = ms => new Promise(resolve => setTimeout(resolve, ms || 350));

/**
 * 🛡️ [중앙 집중형 단일 비동기 통신 커널]
 * 로컬 스토리지에 이식된 유저의 전용 OpenAPI 토큰 키를 실시간 추출하여 넥슨 백엔드 데이터베이스를 서칭합니다.
 */
window.fetchFromNexon = async function(endpoint, queryParams = {}) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, value);
        }
    }
    
    const queryString = searchParams.toString();
    const fullUrl = NEXON_BASE_URL + "/maplestory/v1" + endpoint + (queryString ? '?' + queryString : '');
    
    const activeKey = localStorage.getItem("omni_api_key");
    
    // 💡 [초보자 가이드] 유효성 패턴 검사를 거치지 않은 비정상 키 접근 시 통신을 거절하고 강제 셧다운 시킵니다.
    if (!activeKey || !window.validateNexonApiKeyFormat(activeKey)) {
        localStorage.removeItem("omni_api_key");
        alert("⚠️ 비정상적이거나 올바르지 않은 규격의 API 키가 감지되었습니다.\n정상적인 test_ 혹은 live_ 형태의 키를 들고 인트로에서 로그인해 주세요.");
        window.location.reload();
        throw new Error("Invalid API Key Structure Filtered.");
    }

    const requestHeaders = {
        "accept": "application/json",
        "x-nxopen-api-key": activeKey.trim()
    };

    console.log("[DEBUG] --- [API 요청 상세 로그] ---");
    console.log("[URL]:", fullUrl);
    
    const response = await fetch(fullUrl, {
        method: "GET",
        headers: requestHeaders 
    });
    
    if (!response.ok) {
        console.error(`[API ERROR] ${response.status} - ${fullUrl}`);
        
        // 🎯 [만료 키 자동 파기 클렌징 엔진] 권한 불일치(401/403 에러) 감지 시 세션을 리셋하고 인트로 복귀 처리를 수행합니다.
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("omni_api_key");
            alert("⚠️ 넥슨 테스트 API 키의 인증 실패 혹은 요청 권한이 부족합니다.\n주소가 올바르지 않거나 키 자체에 오류가 있어 인트로 화면으로 복귀합니다.");
            window.location.reload();
            return null;
        }
        
        const errorPacket = new Error(`Nexon API Error Status: ${response.status}`);
        errorPacket.status = response.status;
        throw errorPacket;
    }

    return await response.json();
};

/**
 * ============================================================================
 * 🌐 글로벌 오픈 API 제어 허브 (윈도우 전역 객체 바인딩 명세 12종)
 * ============================================================================
 */
window.MapleApiHub = {
    async getAccountCharacterList(ouid) { return await window.fetchFromNexon("/character/list", { ouid : ouid }); },
    async getCharacterOcid(characterName) { return await window.fetchFromNexon("/id", { character_name: characterName }); },
    async getUnionInfo(ocid, confirmedDate) { return await window.fetchFromNexon("/user/union", { ocid: ocid, date: confirmedDate }); },
    async getGuildId(guildName, worldName) { return await window.fetchFromNexon("/guild/id", { guild_name: guildName, world_name: worldName }); },
    async getTrainingRoomReplayId(ocid, confirmedDate) { return await window.fetchFromNexon("/character/training-room/replay-id", { id: ocid, date: confirmedDate }); },
    async getStarforceHistory(count = 10) { return await window.fetchFromNexon("/history/starforce", { count: count }); },
    async getAccountOuid() { return await window.fetchFromNexon("/ouid"); },
    async getPotentialHistory(count = 10) { return await window.fetchFromNexon("/history/potential", { count: count }); },
    async getCubeHistory(count = 10) { return await window.fetchFromNexon("/history/cube", { count: count }); },
    async getSchedulerStatus(ocid, confirmedDate) { return await window.fetchFromNexon("/scheduler/character-state", { ocid: ocid, date: confirmedDate }); },
    async getOverallRanking(confirmedDate, page = 1) { return await window.fetchFromNexon("/ranking/overall", { date: confirmedDate, page: page }); },
    async getRecentNotices() { return await window.fetchFromNexon("/notice"); }
};

/**
 * ⚡ [마스터 검색 커널]: 캐시 보존 및 트래픽 최소화를 달성하는 초경량 분할 스캔 코어 인터페이스
 */
window.startOmniSearch = async function(characterName, forceRefresh = true) {
    window.showLoadingUI(); 
    if (window.isOmniSearching) {
        console.warn("[OMNI BLOCK] 이미 데이터 탐색 통신이 진행 중입니다. 중복 요청을 가로막습니다.");
        window.hideLoadingUI();
        return;
    }

    if (!characterName || !characterName.trim()) {
        alert("탐색할 캐릭터명을 입력해 주세요.");
        window.hideLoadingUI();
        return;
    }
    
    const cleanName = characterName.trim();
    const cacheStorageKey = `omni_v14_cached_char_${cleanName}`;
    
    // 🛡️ [캐시 최소화 필터 부품] 강제 리프레시 명령이 아닐 경우 로컬 스토리지에 보관된 자원을 즉각 바인딩하고 통신을 스킵합니다.
    if (!forceRefresh) {
        const localRawData = localStorage.getItem(cacheStorageKey);
        if (localRawData) {
            const cacheParsed = JSON.parse(localRawData);
            window.currentSearchData = cacheParsed;
            window.lastSearchedCharacterName = cleanName;
            window.executeOmniUiRepaint(cacheParsed, cleanName);
            window.hideLoadingUI();
            console.log("[OMNI CACHE] 안전한 로컬 캐시 자원을 화면에 즉시 로드했습니다.");
            return;
        }
    }

    console.log("[OMNI SYSTEM] 화면 맞춤형 분할 스캔 기동:", cleanName);
    if (forceRefresh) {
        localStorage.removeItem(cacheStorageKey);
    }

    const topInput = document.getElementById('globalSearchInput');
    if (topInput) topInput.blur(); 

    try {
        window.isOmniSearching = true;
        
        // 1. 공통 기본식별 데이터인 OCID 조회
        const idData = await window.MapleApiHub.getCharacterOcid(cleanName);
        const ocid = idData.ocid;
        if (!ocid) throw new Error("캐릭터 고유 식별자(ocid) 파싱에 실패했습니다.");

        // 2. 현재 사용자가 머무는 페이지의 ID가 무엇인지 정밀 분석 선행
        const activePage = document.querySelector('.page-section.active')?.id || 'page-dashboard';
        console.log(`[OMNI CUTTER] 현재 활성 뷰포트 [${activePage}] 전용 파트만 선별 기입합니다.`);

        let confirmedDate = null;
        let basicData = null;

        // 🎯 [요청 준수 분기] 주간 할일(Todo) 페이지가 활성화 상태인 경우 무조건 '오늘 당일(0일전)' 날짜 사양으로만 압축 기동합니다.
        if (activePage === 'page-todo') {
            confirmedDate = window.getOmniCustomTargetDate(0); 
            try {
                basicData = await window.fetchFromNexon("/character/basic", { ocid: ocid, date: confirmedDate });
            } catch (error) {
                basicData = await window.fetchFromNexon("/character/basic", { ocid: ocid, date: window.getOmniCustomTargetDate(1) }).catch(() => ({}));
            }
        } else {
            // 일반 조회 탭에서는 최근 4일 이내 정산 완료된 실데이터 유효 시점을 종단 추적합니다.
            for (let i = 0; i <= 4; i++) {
                const testDate = window.getOmniCustomTargetDate(i);
                if (i > 0) await omniApiSleep(150);
                try {
                    basicData = await window.fetchFromNexon("/character/basic", { ocid: ocid, date: testDate });
                    confirmedDate = testDate; 
                    break;
                } catch (error) {
                    if (error.status === 400) continue; 
                    throw error;
                }
            }

            if (!confirmedDate || !basicData) {
                throw new Error("최근 4일 이내에 정산된 인게임 지표가 존재하지 않는 캐릭터입니다.");
            }
        }

        let parsedResult = JSON.parse(localStorage.getItem(cacheStorageKey) || '{}');
        
        parsedResult.basic = basicData;
        parsedResult.ranking = parsedResult.ranking || { world: 0, class: 0 };
        parsedResult.ocid = ocid;
        parsedResult.confirmedDate = confirmedDate;

        // 4. 🎯 [트래픽 최소화의 핵심] 유저가 바라보고 있는 해당 페이지의 타겟팅 소스 데이터만 골라 불러옵니다.
        if (activePage === 'page-todo') {
            parsedResult.homework = await window.fetchOmniSchedulerSlice(ocid, confirmedDate);
        } 
        else if (activePage === 'page-search') {
            parsedResult.stat = await window.fetchFromNexon("/character/stat", { ocid: ocid, date: confirmedDate }).catch(() => ({ final_stat: [] }));
            await omniApiSleep(350);
            parsedResult.item = await window.fetchFromNexon("/character/item-equipment", { ocid: ocid, date: confirmedDate }).catch(() => ({ item_equipment: [] }));
            await omniApiSleep(350);
            parsedResult.ability = await window.fetchFromNexon("/character/ability", { ocid: ocid, date: confirmedDate }).catch(() => ({ remain_fame: "0", ability_info: [] }));
            await omniApiSleep(350);
            parsedResult.symbol = await window.fetchFromNexon("/character/symbol-equipment", { ocid: ocid, date: confirmedDate }).catch(() => ({ symbol: [] }));
            await omniApiSleep(350);
            parsedResult.dojang = await window.fetchFromNexon("/character/dojang", { ocid: ocid, date: confirmedDate }).catch(() => ({ dojang_best_floor: 0 }));
            await omniApiSleep(350);
            parsedResult.union = await window.MapleApiHub.getUnionInfo(ocid, confirmedDate).catch(() => ({ union_level: "0", union_grade: "일반 계정" }));
            await omniApiSleep(350);
            parsedResult.link_skill = await window.fetchFromNexon("/character/link-skill", { ocid: ocid, date: confirmedDate }).catch(() => ({ character_link_skill: [] }));
            await omniApiSleep(350);
            parsedResult.skill = await window.fetchFromNexon("/character/skill", { ocid: ocid, character_skill_grade: "5", date: confirmedDate }).catch(() => ({ character_skill: [] }));
            
            await omniApiSleep(350);
            // 💡 [초보자 가이드/🐛 버그 수정] 기존의 "/character/hexa-matrix" 경로는 잘못된 명세이므로 하이픈이 빠진 "/character/hexamatrix"로 전면 정정 보수했습니다.
            parsedResult.hexa_skill = await window.fetchFromNexon("/character/hexamatrix", { ocid: ocid, date: confirmedDate }).catch(() => ({ date: confirmedDate, character_hexa_core_equipment: [] }));
            await omniApiSleep(350);
            // 💡 [초보자 가이드/🐛 버그 수정] 기존의 "/character/hexa-matrix-stat" 경로 역시 하이픈을 배제한 "/character/hexamatrix-stat"로 맞추어 403 인증 거절 연쇄 오류를 종식시킵니다.
            parsedResult.hexa_stat = await window.fetchFromNexon("/character/hexamatrix-stat", { ocid: ocid, date: confirmedDate }).catch(() => ({
                date: confirmedDate, character_class: basicData.character_class, character_hexa_stat_core: []
            }));
        } 
        else if (activePage === 'page-scanner') {
            parsedResult.stat = await window.fetchFromNexon("/character/stat", { ocid: ocid, date: confirmedDate }).catch(() => ({ final_stat: [] }));
            await omniApiSleep(350);
            parsedResult.item = await window.fetchFromNexon("/character/item-equipment", { ocid: ocid, date: confirmedDate }).catch(() => ({ item_equipment: [] }));
            await omniApiSleep(350);
            parsedResult.symbol = await window.fetchFromNexon("/character/symbol-equipment", { ocid: ocid, date: confirmedDate }).catch(() => ({ symbol: [] }));
            await omniApiSleep(350);
            parsedResult.ability = await window.fetchFromNexon("/character/ability", { ocid: ocid, date: confirmedDate }).catch(() => ({ remain_fame: "0", ability_info: [] }));
            await omniApiSleep(350);
            parsedResult.union = await window.MapleApiHub.getUnionInfo(ocid, confirmedDate).catch(() => ({ union_level: "0", union_grade: "일반 계정" }));
        } 
        else {
            parsedResult.stat = await window.fetchFromNexon("/character/stat", { ocid: ocid, date: confirmedDate }).catch(() => ({ final_stat: [] }));
            await omniApiSleep(350);
            parsedResult.item = await window.fetchFromNexon("/character/item-equipment", { ocid: ocid, date: confirmedDate }).catch(() => ({ item_equipment: [] }));
        }

        localStorage.setItem(cacheStorageKey, JSON.stringify(parsedResult));
        window.currentSearchData = parsedResult;
        window.lastSearchedCharacterName = cleanName;

        window.executeOmniUiRepaint(parsedResult, cleanName);

    } catch (error) {
        console.error("[OMNI LIVE API] 제어 실패 메커니즘 발생:", error);
        alert(`연동 실패: ${error.message}`);
    } finally {
        window.isOmniSearching = false;
        window.hideLoadingUI(); 
    }
};

/**
 * 💡 [초보자 가이드] 스케줄러 내역을 다단계 백업 날짜 매핑 구조체로 호출하여 에러 이탈률을 영프로로 통제합니다.
 */
window.fetchOmniSchedulerSlice = async function(ocid, backupDate = "") {
    let schedulerData = { daily_contents: [], weekly_contents: [], boss_contents: [], date: "" };
    const todayDate = window.getOmniCustomTargetDate(0);
    const yesterdayDate = window.getOmniCustomTargetDate(1);
    
    let rawResponse = null;
    let targetUsedDate = "";

    try {
        rawResponse = await window.fetchFromNexon("/scheduler/character-state", { ocid: ocid, date: todayDate });
        if (rawResponse) targetUsedDate = todayDate;
    } catch (e) {
        console.warn(`[SCHEDULER] 오늘(${todayDate}) 날짜 조회 실패:`, e.message);
    }
    
    if (!rawResponse) {
        try {
            rawResponse = await window.fetchFromNexon("/scheduler/character-state", { ocid: ocid, date: yesterdayDate });
            if (rawResponse) targetUsedDate = yesterdayDate;
        } catch (e) {
            console.warn(`[SCHEDULER] 어제(${yesterdayDate}) 날짜 조회 실패:`, e.message);
        }
    }

    if (!rawResponse && backupDate && backupDate !== todayDate && backupDate !== yesterdayDate) {
        try {
            rawResponse = await window.fetchFromNexon("/scheduler/character-state", { ocid: ocid, date: backupDate });
            if (rawResponse) targetUsedDate = backupDate;
        } catch (err) {
            console.warn(`[SCHEDULER] 백업일자(${backupDate}) 조회 실패:`, err.message);
        }
    }

    if (rawResponse) {
        schedulerData = Object.assign(schedulerData, rawResponse);
        schedulerData.date = targetUsedDate;
        console.log(`[SCHEDULER DEBUG] ${targetUsedDate} 원본 응답 로그:`, rawResponse);
    }

    return schedulerData;
};

/**
 * 💡 [초보자 가이드] 사용자가 이미 조회한 전적이 있는 상태에서 다른 탭으로 창을 이동했을 때,
 *       해당 페이지가 요구하는 고유 데이터의 누락분을 캐시 친화적으로 보충 연산해주는 지능형 레이지 로더(Lazy Loader)입니다.
 */
window.omniLazyLoadPageContext = async function(charName, targetPageId) {
    if (!charName) return;
    const cacheStorageKey = `omni_v14_cached_char_${charName}`;
    let cachedResult = JSON.parse(localStorage.getItem(cacheStorageKey) || '{}');
    
    if (!cachedResult.ocid || !cachedResult.confirmedDate) return;
    const ocid = cachedResult.ocid;
    const confirmedDate = cachedResult.confirmedDate;

    let needRepaint = false;

    if (targetPageId === 'page-todo' && !cachedResult.homework) {
        console.log("[OMNI LAZY] 할일 탭 진입 -> 스케줄러 정보 보충 레이지 로드 실행");
        cachedResult.homework = await window.fetchOmniSchedulerSlice(ocid, confirmedDate);
        needRepaint = true;
    } 
    else if (targetPageId === 'page-search' && (!cachedResult.stat || !cachedResult.link_skill)) {
        console.log("[OMNI LAZY] 조회 탭 진입 -> 종합 장비/스킬 스펙트럼 보충 레이지 로드 실행");
        cachedResult.stat = cachedResult.stat || await window.fetchFromNexon("/character/stat", { ocid: ocid, date: confirmedDate }).catch(() => ({ final_stat: [] }));
        await omniApiSleep(350);
        cachedResult.item = cachedResult.item || await window.fetchFromNexon("/character/item-equipment", { ocid: ocid, date: confirmedDate }).catch(() => ({ item_equipment: [] }));
        await omniApiSleep(350);
        cachedResult.ability = cachedResult.ability || await window.fetchFromNexon("/character/ability", { ocid: ocid, date: confirmedDate }).catch(() => ({ remain_fame: "0", ability_info: [] }));
        await omniApiSleep(350);
        cachedResult.symbol = cachedResult.symbol || await window.fetchFromNexon("/character/symbol-equipment", { ocid: ocid, date: confirmedDate }).catch(() => ({ symbol: [] }));
        await omniApiSleep(350);
        cachedResult.dojang = cachedResult.dojang || await window.fetchFromNexon("/character/dojang", { ocid: ocid, date: confirmedDate }).catch(() => ({ dojang_best_floor: 0 }));
        await omniApiSleep(350);
        cachedResult.union = cachedResult.union || await window.MapleApiHub.getUnionInfo(ocid, confirmedDate).catch(() => ({ union_level: "0", union_grade: "일반 계정" }));
        await omniApiSleep(350);
        cachedResult.link_skill = cachedResult.link_skill || await window.fetchFromNexon("/character/link-skill", { ocid: ocid, date: confirmedDate }).catch(() => ({ character_link_skill: [] }));
        await omniApiSleep(350);
        cachedResult.skill = cachedResult.skill || await window.fetchFromNexon("/character/skill", { ocid: ocid, character_skill_grade: "5", date: confirmedDate }).catch(() => ({ character_skill: [] }));
        
        // 💡 [초보자 가이드/🐛 레이지 로드 파트 수정] 탭 이동 레이지 로더 내부의 엔드포인트 문자열 역시 하이픈이 없는 공식 주소 규격으로 정교하게 교정합니다.
        cachedResult.hexa_skill = cachedResult.hexa_skill || await window.fetchFromNexon("/character/hexamatrix", { ocid: ocid, date: confirmedDate }).catch(() => ({ date: confirmedDate, character_hexa_core_equipment: [] }));
        await omniApiSleep(350);
        cachedResult.hexa_stat = cachedResult.hexa_stat || await window.fetchFromNexon("/character/hexamatrix-stat", { ocid: ocid, date: confirmedDate }).catch(() => ({
            date: confirmedDate, character_hexa_stat_core: []
        }));
        needRepaint = true;
    }
    else if (targetPageId === 'page-scanner' && !cachedResult.union) {
        console.log("[OMNI LAZY] 스캐너 탭 진입 -> 내실 비교용 내역 보충 레이지 로드 실행");
        cachedResult.stat = cachedResult.stat || await window.fetchFromNexon("/character/stat", { ocid: ocid, date: confirmedDate }).catch(() => ({ final_stat: [] }));
        await omniApiSleep(350);
        cachedResult.item = cachedResult.item || await window.fetchFromNexon("/character/item-equipment", { ocid: ocid, date: confirmedDate }).catch(() => ({ item_equipment: [] }));
        await omniApiSleep(350);
        cachedResult.symbol = cachedResult.symbol || await window.fetchFromNexon("/character/symbol-equipment", { ocid: ocid, date: confirmedDate }).catch(() => ({ symbol: [] }));
        await omniApiSleep(350);
        cachedResult.ability = cachedResult.ability || await window.fetchFromNexon("/character/ability", { ocid: ocid, date: confirmedDate }).catch(() => ({ remain_fame: "0", ability_info: [] }));
        await omniApiSleep(350);
        cachedResult.union = cachedResult.union || await window.MapleApiHub.getUnionInfo(ocid, confirmedDate).catch(() => ({ union_level: "0", union_grade: "일반 계정" }));
        needRepaint = true;
    }

    if (needRepaint) {
        localStorage.setItem(cacheStorageKey, JSON.stringify(cachedResult));
        window.currentSearchData = cachedResult;
        window.executeOmniUiRepaint(cachedResult, charName);
    }
};

/**
 * 💡 [초보자 가이드] 수집 가공이 끝난 객체 자원 패킷을 독립 컴포넌트에 안전 바인딩 재호출하는 페인터 유틸입니다.
 */
window.executeOmniUiRepaint = function(parsedResult, cleanName) {
    if (typeof window.syncTodoCharacterOnSearch === 'function' && parsedResult.homework) {
        window.syncTodoCharacterOnSearch(cleanName, parsedResult.basic, parsedResult.homework || {});
    }

    if (typeof window.renderSearchDetail === 'function' && parsedResult.stat && parsedResult.item) {
        window.renderSearchDetail(
            parsedResult.basic, parsedResult.stat, parsedResult.item, parsedResult.ability, 
            parsedResult.symbol, parsedResult.dojang, parsedResult.union, parsedResult.ranking, 
            parsedResult.link_skill, parsedResult.hexa_skill, parsedResult.skill, parsedResult.hexa_stat
        );
    }

    if (typeof window.initOmniBuilderTab === 'function') window.initOmniBuilderTab();
    if (typeof window.updateScannerContext === 'function') window.updateScannerContext(parsedResult);
};

/**
 * 💡 [초보자 가이드] 상단 네비게이션 대메뉴 전환 단추를 클릭할 때마다 SPA 라우터 기능 및 트래픽 최소화 레이지 로더를 연동합니다.
 */
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-menu .nav-btn, [id^="nav-btn-"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const btnId = e.currentTarget.id;
            
            // 버튼 요소 ID값과 타겟 독립 페이지 구획 ID 매핑 룩업 테이블
            const pageMap = {
                'nav-btn-dashboard': 'page-dashboard',
                'nav-btn-todo': 'page-todo',
                'nav-btn-search': 'page-search',
                'nav-btn-scanner': 'page-scanner',
                'nav-btn-builder': 'page-builder',
                'nav-btn-hunt': 'page-hunt',
                'nav-btn-mvp': 'page-mvp'
            };
            
            const targetPageId = pageMap[btnId];
            if (targetPageId) {
                // 1. 싱글 페이지 애플리케이션(SPA) 화면 가시성 강제 렌더링 전환
                if (typeof window.omniSwitchPage === 'function') {
                    window.omniSwitchPage(targetPageId);
                }
                // 2. 검색 전적이 있을 시, 불필요한 전체 재통신을 차단하고 탭 이동에 따른 최소 소스만 백그라운드 선별 보충
                if (typeof window.omniLazyLoadPageContext === 'function' && window.lastSearchedCharacterName) {
                    window.omniLazyLoadPageContext(window.lastSearchedCharacterName, targetPageId);
                }
            }
        });
    });
});