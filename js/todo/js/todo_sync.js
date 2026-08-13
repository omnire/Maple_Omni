/**
 * ============================================================================
 * 📑 MAPLE OMNI V14 - js/todo/js/todo_sync.js [API SYNC & SCHEDULER HUB]
 * 역할: 넥슨 공식 OpenAPI 스케줄러 통신, 숙제 완료 상태 자동 검증 및 캐릭터 상태 동기화
 * 규칙: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 달아줍니다.
 * ============================================================================
 */

/**
 * 🛡️ [방어적 완료 여부 판별기]
 * 신규 스케줄러 API의 완료 플래그 필드 후보군을 다각도로 매칭하여 정밀 판단합니다.
 */
function isOmniContentCleared(obj) {
    if (!obj) return false;
    const name = obj.content_name || obj.quest_name || "";
    // 💡 [초보자 가이드] 하이마운틴, 앵글러 컴퍼니, 악몽선경 등 max_count가 0으로 내려오는 에픽 던전은 진행 횟수(now_count)가 0보다 크면 완료된 것으로 판정합니다.
    if (name.includes("에픽 던전")) {
        return typeof obj.now_count === "number" && obj.now_count > 0;
    }
    return (
        obj.complete_flag === true || String(obj.complete_flag).toLowerCase() === "true" ||
        obj.clear_yn === "Y" || obj.clear_yn === "y" || obj.clear_yn === true ||
        obj.clear_status === true || obj.clear_status === "clear" ||
        obj.is_clear === true || String(obj.is_clear).toLowerCase() === "true" ||
        String(obj.quest_state) === "2" || String(obj.quest_state) === 2 ||
        // 💡 [초보자 가이드] 현재 처치 수(now_count)가 목표 처치 수(max_count) 이상에 도달해야만 완료(true)로 정상 인정하도록 비교 연산자 오타를 정정합니다.
        (typeof obj.now_count === "number" && typeof obj.max_count === "number" && obj.max_count > 0 && obj.now_count >= obj.max_count)
    );
}

/**
 * 🛡️ [방어적 난이도 매칭기]
 * 영문 표기(normal/hard 등) 및 한글 표기(노말/하드 등) 난이도 별칭을 안전하게 흡수합니다.
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
 * 📡 [핵심 동기화 허브]
 * 넥슨 OpenAPI 스케줄러 데이터를 수신 받아 로컬 상태를 실시간 최신화합니다.
 */
window.syncTodoCharacterOnSearch = async function(charName, basicInfo, apiHomework) {
    if (!charName || !charName.trim()) return;
    const cleanName = charName.trim();
    console.log(`[OMNI LINK V14] 캐시 소거 후 일퀘/주퀘/보스 무결점 동기화 가동 -> ${cleanName}`);

    // 🧹 1. [핵심 캐시 삭제] 전달받은 캐릭터의 이전 V15 및 V14 캐시를 스토리지에서 즉시 파쇄하여 항상 최신 넥슨 API 데이터로 채워지도록 보장합니다.
    localStorage.removeItem(`omni_v15_cached_char_${cleanName}`);
    localStorage.removeItem(`omni_v14_cached_char_${cleanName}`);

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
            console.error("[TODO SYNC] 캐시 방어 파싱 실패:", e);
        }
    }

    if (!window.omniTodoState) window.omniTodoState = { characters: [], checkData: {} };
    if (!window.omniTodoState.characters) window.omniTodoState.characters = [];
    if (!window.omniTodoState.checkData) window.omniTodoState.checkData = {};

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
    
    // 🧹 2. [기존 데이터 보존 및 초기화 방어] 기존에 체크해 둔 수동/자동 데이터가 API 갱신으로 인해 날아가지 않도록 안전하게 불러옵니다.
    if (!window.omniTodoState.checkData[resolvedName]) {
        window.omniTodoState.checkData[resolvedName] = {};
    }
    const d = window.omniTodoState.checkData[resolvedName];

    // 💡 [초보자 가이드] 넥슨 API가 daily/weekly/boss 콘텐츠를 필드명이 다르게 내려줄 수 있어(quest_list, weekly_quest_list, boss_list 등),
    // 어떤 데이터를 받든 먼저 표준 필드명(daily_contents/weekly_contents/boss_contents)으로 통일해주는 헬퍼입니다.
    const normalizeHomework = (raw) => {
        if (!raw) return null;
        return {
            daily_contents: raw.daily_contents || raw.quest_list || [],
            weekly_contents: raw.weekly_contents || raw.weekly_quest_list || raw.weekly_list || [],
            boss_contents: raw.boss_contents || raw.boss_list || []
        };
    };

    // 🔍 [진단용 로그] 넥슨 API가 실제로 어떤 필드명/구조로 데이터를 주는지 눈으로 직접 확인하기 위한 임시 로그입니다.
    // 개발자도구(F12) → Console 탭에서 "[진단]"으로 시작하는 로그를 펼쳐보시면 실제 daily/weekly/boss 필드명을 정확히 알 수 있습니다.
    if (apiHomework) {
        console.log(`[진단] "${cleanName}" 스케줄러 API 원본 응답:`, JSON.parse(JSON.stringify(apiHomework)));
    }

    let activeApiHomework = normalizeHomework(apiHomework) || { daily_contents: [], weekly_contents: [], boss_contents: [] };

    // 💡 [초보자 가이드] 예전엔 daily_contents가 하나라도 존재하면(설령 필드명이 우연히 맞아떨어진 것뿐이어도)
    // weekly/boss 필드명이 다른 경우까지 전부 재조회를 건너뛰어 버렸습니다.
    // 이제는 daily/weekly/boss를 각각 독립적으로 판단하여, 비어 있는 항목만 캐시 → ocid 직접 재조회 순으로 채웁니다.
    const needsDaily = activeApiHomework.daily_contents.length === 0;
    const needsWeekly = activeApiHomework.weekly_contents.length === 0;
    const needsBoss = activeApiHomework.boss_contents.length === 0;

    // 💡 [초보자 가이드] 새로운 API 데이터(apiHomework)가 전달된 경우에는 이전 검색 캐시(omni_last_active_search_data)를 가져와 구 데이터를 다시 복원하지 않도록 방어합니다.
    if (!apiHomework && (needsDaily || needsWeekly || needsBoss)) {
        try {
            const rawCache = localStorage.getItem(`omni_v14_cached_char_${cleanName}`) || localStorage.getItem('omni_last_active_search_data');
            if (rawCache) {
                const parsed = JSON.parse(rawCache);
                const cachedNormalized = normalizeHomework(parsed?.scheduler || parsed?.apiHomework || parsed?.homework || parsed);
                if (cachedNormalized) {
                    if (needsDaily && cachedNormalized.daily_contents.length > 0) activeApiHomework.daily_contents = cachedNormalized.daily_contents;
                    if (needsWeekly && cachedNormalized.weekly_contents.length > 0) activeApiHomework.weekly_contents = cachedNormalized.weekly_contents;
                    if (needsBoss && cachedNormalized.boss_contents.length > 0) activeApiHomework.boss_contents = cachedNormalized.boss_contents;
                }
            }

            const stillNeedsDaily = activeApiHomework.daily_contents.length === 0;
            const stillNeedsWeekly = activeApiHomework.weekly_contents.length === 0;
            const stillNeedsBoss = activeApiHomework.boss_contents.length === 0;

            if (stillNeedsDaily || stillNeedsWeekly || stillNeedsBoss) {
                let ocid = realBasic?.ocid;
                if (!ocid && window.currentSearchData && window.currentSearchData.ocid) {
                    ocid = window.currentSearchData.ocid;
                }

                if (ocid && typeof window.fetchFromNexon === 'function') {
                    const schedData = await window.fetchFromNexon('/scheduler/character-state', { ocid: ocid });
                    const fetchedNormalized = normalizeHomework(schedData);
                    if (fetchedNormalized) {
                        if (stillNeedsDaily) activeApiHomework.daily_contents = fetchedNormalized.daily_contents;
                        if (stillNeedsWeekly) activeApiHomework.weekly_contents = fetchedNormalized.weekly_contents;
                        if (stillNeedsBoss) activeApiHomework.boss_contents = fetchedNormalized.boss_contents;
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
    // 💡 [초보자 가이드] 주간 에픽 던전 상태 초기화 목록에 악몽선경(weekly_nightmare)을 추가합니다.
    ['weekly_mountain', 'weekly_angeler', 'weekly_nightmare'].forEach(k => { if (d[k] === undefined) d[k] = false; });

    const syncDailyKey = (keyword, objectKey) => {
        const target = dailyArr.find(c => (c.content_name && c.content_name.includes(keyword)) || (c.quest_name && c.quest_name.includes(keyword)));
        // 💡 [초보자 가이드] API 갱신 시점에 실제 완료 여부를 정확히 반영하며, 미완료 상태이거나 데이터가 없을 경우 false로 확실히 동기화합니다.
        if (target) {
            d[objectKey] = isOmniContentCleared(target);
        } else {
            d[objectKey] = false;
        }
    };
    
    syncDailyKey("세르니움", "daily_cernium");
    syncDailyKey("아르크스", "daily_arcus");
    syncDailyKey("오디움", "daily_odium");
    syncDailyKey("도원경", "daily_shangrila");
    syncDailyKey("아르테리아", "daily_arteria");
    syncDailyKey("카르시온", "daily_carcion");
    // 💡 [초보자 가이드] "daily_탈라하트" || "탈라하트" 는 자바스크립트 || 연산자 특성상 왼쪽 문자열이
    // 비어있지 않으면 항상 왼쪽 값("daily_탈라하트")으로 고정되는 버그였습니다. 그 결과 탈라하트 클리어
    // 상태가 화면과 초기화 로직이 실제로 참조하는 "daily_talhart" 키가 아닌, 존재하지 않는 엉뚱한
    // 한글 키에 저장되어 아무리 갱신해도 탈라하트 항목만 클리어로 표시되지 않았습니다.
    syncDailyKey("탈라하트", "daily_talhart");

    const mparkObj = dailyArr.find(c => (c.content_name && c.content_name.includes("몬스터파크")) || (c.quest_name && c.quest_name.includes("몬스터파크")));
    if (mparkObj) d.daily_m_park = mparkObj.now_count ?? mparkObj.count ?? 0;

    const syncWeeklyKey = (keyword, objectKey) => {
        // 💡 [초보자 가이드] 넥슨 API 응답 배열에서 content_name, quest_name 뿐만 아니라 관련 키워드를 유연하게 탐색하여 매칭률을 높입니다.
        const target = weeklyArr.find(c => {
            const nameStr = (c.content_name || c.quest_name || c.title || "").toLowerCase();
            return nameStr.includes(keyword.toLowerCase());
        });
        
        if (target) {
            d[objectKey] = isOmniContentCleared(target);
        } else {
            d[objectKey] = false;
        }
    };
    syncWeeklyKey("하이마운틴", "weekly_mountain");
    syncWeeklyKey("앵글러 컴퍼니", "weekly_angeler");
    syncWeeklyKey("악몽선경", "weekly_nightmare");

    const syncBossKey = (keyword, diff, objectKey) => {
        const target = bossArr.find(c => 
            ((c.content_name && c.content_name.includes(keyword)) || (c.boss_name && c.boss_name.includes(keyword))) && 
            omniMatchesDifficulty(c.difficulty || c.boss_difficulty, diff)
        );
        // 💡 [초보자 가이드] API 서버의 최신 판정 결과를 그대로 반영하며, 미완료이거나 데이터가 없으면 false로 확실히 동기화합니다.
        if (target) {
            d[`boss_${objectKey}`] = isOmniContentCleared(target);
        } else {
            d[`boss_${objectKey}`] = false;
        }
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

    // 3. [최신 데이터 보존 및 갱신 시각 반영]
    localStorage.setItem("omni_v14_todo_characters_list", JSON.stringify(charactersList));
    localStorage.setItem("omni_v14_todo_perfect_storage", JSON.stringify(window.omniTodoState.checkData));
    
    const nowFormatted = new Date().toLocaleString();
    localStorage.setItem("omni_last_refresh_time", nowFormatted);
    window.lastOmniRefreshedAt = nowFormatted;
    
    // 4. 재렌더링 호출
    if (typeof window.renderDashboardMainWidgets === 'function') {
        window.renderDashboardMainWidgets();
    }
    if (typeof window.switchTodoTab === 'function') {
        window.switchTodoTab(window.omniTodoState.activeSubTab);
    }
};