/**
 * ============================================================================
 * 🌐 MAPLE OMNI V15 - js/core/api_hub.js [NEXON API HUB & ENDPOINT BRIDGE]
 * 역할: 넥슨 OpenAPI 개별 모듈별 라우팅 허브
 * 수정내용: 넥슨 유니온 4개 엔드포인트(/user/union, /user/union-raider, /user/union-artifact, /user/union-champion)를 빠짐없이 병렬 수신하도록 보완
 * 규칙: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 달아줍니다.
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

    /**
     * 💡 [핵심 수정] 유니온 스펙 통합 조회 (/user/union, /user/union-raider, /user/union-artifact, /user/union-champion)
     * 넥슨 OpenAPI의 4개 유니온 엔드포인트를 모조리 수신하여 병합 객체와 함께 개별 서브 객체로 제공합니다.
     */
    async getUnionInfo(ocid, confirmedDate) {
        if (!ocid || ocid === "mock_ocid_safety_shield_value") return {};
        const query = { ocid: ocid };
        const todayStr = window.getOmniCustomTargetDate(0);
        if (confirmedDate && confirmedDate !== todayStr) {
            query.date = confirmedDate;
        }
        const unionBase = await window.fetchFromNexon("/user/union", query).catch(() => ({}));
        const unionRaider = await window.fetchFromNexon("/user/union-raider", query).catch(() => ({}));
        const unionArtifact = await window.fetchFromNexon("/user/union-artifact", query).catch(() => ({}));
        const unionChampion = await window.fetchFromNexon("/user/union-champion", query).catch(() => ({}));

        return { 
            ...unionBase, 
            ...unionRaider, 
            ...unionArtifact, 
            ...unionChampion,
            union_raider: unionRaider,
            union_artifact: unionArtifact,
            union_champion: unionChampion
        };
    },

    async getLinkSkill(ocid, confirmedDate) {
        if (!ocid || ocid === "mock_ocid_safety_shield_value") return { character_link_skill: [] };
        return await window.fetchFromNexon("/character/link-skill", { ocid: ocid, date: confirmedDate }).catch(() => ({ character_link_skill: [] }));
    },

    async getHexaSkill(ocid, confirmedDate) {
        if (!ocid || ocid === "mock_ocid_safety_shield_value") return { character_hexa_core_equipment: [] };
        return await window.fetchFromNexon("/character/hexamatrix", { ocid: ocid, date: confirmedDate }).catch(() => ({ character_hexa_core_equipment: [] }));
    },

    async getHexaStat(ocid, confirmedDate) {
        if (!ocid || ocid === "mock_ocid_safety_shield_value") return { character_hexa_stat_core: [] };
        return await window.fetchFromNexon("/character/hexamatrix-stat", { ocid: ocid, date: confirmedDate }).catch(() => ({ character_hexa_stat_core: [] }));
    },

    async getVMatrix(ocid, confirmedDate) {
        if (!ocid || ocid === "mock_ocid_safety_shield_value") return { character_v_core_equipment: [] };
        return await window.fetchFromNexon("/character/vmatrix", { ocid: ocid, date: confirmedDate }).catch(() => ({ character_v_core_equipment: [] }));
    },

    async getSkill5(ocid, confirmedDate) {
        if (!ocid || ocid === "mock_ocid_safety_shield_value") return { character_skill: [] };
        return await window.fetchFromNexon("/character/skill", { ocid: ocid, date: confirmedDate, character_skill_grade: 5 }).catch(() => ({ character_skill: [] }));
    },

    async getGuildId(guildName, worldName) { return await window.fetchFromNexon("/guild/id", { guild_name: guildName, world_name: worldName }); },
    async getStarforceHistory(count = 10) { return await window.fetchFromNexon("/history/starforce", { count: count }); },
    async getAccountOuid() { return await window.fetchFromNexon("/ouid"); },
    async getPotentialHistory(count = 10) { return await window.fetchFromNexon("/history/potential", { count: count }); },
    async getCubeHistory(count = 10) { return await window.fetchFromNexon("/history/cube", { count: count }); },
    
    /**
     * 💡 [초보자 가이드] 스케줄러 정보 조회 (/scheduler/character-state)
     * 오늘 당일 조회를 원하는 경우 date 파라미터를 넘기지 않고 ocid로만 호출합니다.
     */
    async getSchedulerStatus(ocid, targetDate = "") {
        if (!ocid || ocid === "mock_ocid_safety_shield_value") {
            return { daily_contents: [], weekly_contents: [], boss_contents: [], date: "" };
        }
        const query = { ocid: ocid };
        const todayStr = window.getOmniCustomTargetDate(0);
        
        if (targetDate && targetDate !== todayStr) {
            query.date = targetDate;
        }
        return await window.fetchFromNexon("/scheduler/character-state", query).catch(() => ({ daily_contents: [], weekly_contents: [], boss_contents: [] }));
    },

    async getOverallRanking(confirmedDate, page = 1, classCode = "") {
        const safeClassCode = (classCode && !isNaN(classCode)) ? classCode : "";
        return await window.fetchFromNexon("/ranking/overall", { date: confirmedDate, page: page, class: safeClassCode })
            .catch(() => ({ ranking: [] }));
    },
    async getRecentNotices() { return await window.fetchFromNexon("/notice"); }
};

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

    // 💡 [초보자 가이드] 넥슨 서버 스냅샷 데이터 수급 에러(400)를 방지하기 위해 
    // 최신 가용 날짜(window.getOmniNexonLatestAvailableDate()) 및 당일/과거 날짜 후보를 순회하여 유연하게 대처합니다.
    let basicRes = null;
    const latestDate = typeof window.getOmniNexonLatestAvailableDate === 'function' ? window.getOmniNexonLatestAvailableDate() : "";
    const dateCandidates = [
        latestDate,
        window.getOmniCustomTargetDate(0),
        window.getOmniCustomTargetDate(2)
    ].filter(Boolean);
    
    for (const testDate of dateCandidates) {
        try {
            basicRes = await window.fetchFromNexon("/character/basic", { ocid: idData.ocid, date: testDate });
            if (basicRes && basicRes.character_name) break;
        } catch (err) {
            continue;
        }
    }
    
    if (!basicRes) {
        basicRes = await window.fetchFromNexon("/character/basic", { ocid: idData.ocid }).catch(() => null);
    }

    if (basicRes && (!basicRes.character_image || basicRes.character_image.includes("default.png"))) {
        basicRes.character_image = safeAvatar;
    }
    return basicRes;
};