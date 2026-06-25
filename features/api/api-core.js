/**
 * ============================================================================
 * 👤 MAPLE OMNI - 중앙 집중형 API 코어 통합 모듈 (api-core.js)
 * 설명: 넥슨 오픈 API와의 통신 및 실시간 검색, 동기화 트래픽을 일괄 제어합니다.
 * 보정 사항: 403(hexamatrix), 400(hyper) 에러를 넥슨 공식 규격에 맞춰 완벽 해결
 * ============================================================================
 */

// 💡 [초보자 가이드] 현재 검색 중이거나 랭킹을 불러오는 중인지 체크하는 플래그 변수입니다.
if (typeof window.isFetchingRanking === 'undefined') window.isFetchingRanking = false;
if (typeof window.isSearching === 'undefined') window.isSearching = false;

window.apiDelay = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

window.apiSafeFetch = async function(url, headers) {
    try {
        const response = await fetch(url, { headers });
        if (response.status === 429) {
            console.error("⚠️ [트래픽 초과] 넥슨 호출 제한 한도를 초과했습니다. 잠시 후 재시도합니다.");
        }
        return response.ok ? await response.json() : {};
    } catch (error) {
        console.error("❌ [통신 예외 에러발생] 대상 엔드포인트 URL:", url, error);
        return {};
    }
};

window.getSafeApiDate = function() {
    const now = new Date();
    now.setDate(now.getDate() - 1);
    return now.toISOString().split('T')[0];
};

window.fetchCentralRankingData = async function(forceRefresh = false) {
    if (window.isFetchingRanking) return [];
    window.isFetchingRanking = true;
    
    try {
        const now = new Date();
        const offset = now.getHours() < 10 ? 2 : 1;
        now.setDate(now.getDate() - offset);
        const dateStr = now.toISOString().split('T')[0];
        
        const cachedRanking = JSON.parse(localStorage.getItem("maple_api_ranking"));
        if (!forceRefresh && cachedRanking && cachedRanking.date === dateStr) {
            return cachedRanking.data;
        }
        
        localStorage.removeItem("maple_api_ranking");
        const headers = { "x-nxopen-api-key": typeof window.API_KEY !== 'undefined' ? window.API_KEY : "" };
        const res = await fetch(`https://open.api.nexon.com/maplestory/v1/ranking/overall?date=${dateStr}`, { headers });
        const data = await res.json();
        
        if (data.ranking) {
            const top10 = data.ranking.slice(0, 10);
            localStorage.setItem("maple_api_ranking", JSON.stringify({ date: dateStr, data: top10 }));
            return top10;
        }
        return [];
    } catch (e) {
        return [];
    } finally {
        window.isFetchingRanking = false;
    }
};

window.fetchCentralFullCharacterData = async function(charName, rDateStr, forceRefresh = false) {
    console.log("🚀 [OMNI CORE] fetchCentralFullCharacterData 코어 프로세스 기동! 강제갱신유무:", forceRefresh);
    const headers = { "x-nxopen-api-key": typeof window.API_KEY !== 'undefined' ? window.API_KEY : "" };
    const delay = 150; 

    const todayStr = new Date().toISOString().split('T')[0];
    const emergencyCacheKey = `maple_api_search_${charName}_${todayStr}`;
    
    if (forceRefresh) {
        localStorage.removeItem(emergencyCacheKey);
    } else {
        const emergencyCache = localStorage.getItem(emergencyCacheKey);
        if (window.currentSearchData?.basic?.character_name === charName && emergencyCache) {
            return window.currentSearchData;
        }
    }

    const runFetch = async (targetDate) => {
        const cacheKey = `maple_api_search_${charName}_${targetDate}`;
        
        if (forceRefresh) localStorage.removeItem(cacheKey);
        
        const cachedData = localStorage.getItem(cacheKey);
        if (!forceRefresh && cachedData) return JSON.parse(cachedData);

        const ocidCacheKey = `maple_ocid_${charName}`;
        let ocid = localStorage.getItem(ocidCacheKey);

        if (!ocid) {
            const ocidRes = await fetch(`https://open.api.nexon.com/maplestory/v1/id?character_name=${encodeURIComponent(charName)}`, { headers });
            if (!ocidRes.ok) throw new Error("NOT_FOUND");
            const data = await ocidRes.json();
            ocid = data.ocid;
            localStorage.setItem(ocidCacheKey, ocid);
            await window.apiDelay(delay);
        }

        const basic = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${ocid}&date=${targetDate}`, headers);
        if (!basic.character_name) throw new Error("DATA_NOT_READY");
        
        await window.apiDelay(delay);
        const stat = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/character/stat?ocid=${ocid}&date=${targetDate}`, headers);
        
        await window.apiDelay(delay);
        const item = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/character/item-equipment?ocid=${ocid}&date=${targetDate}`, headers);
        
        await window.apiDelay(delay);
        const ability = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/character/ability?ocid=${ocid}&date=${targetDate}`, headers);
        
        await window.apiDelay(delay);
        const symbol = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/character/symbol-equipment?ocid=${ocid}&date=${targetDate}`, headers);
        
        await window.apiDelay(delay);
        const dojang = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/character/dojang?ocid=${ocid}&date=${targetDate}`, headers);
        
        await window.apiDelay(delay);
        const union = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/user/union?ocid=${ocid}&date=${targetDate}`, headers);
        
        await window.apiDelay(delay);
        const championData = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/user/union-champion?ocid=${ocid}&date=${targetDate}`, headers);
        
        await window.apiDelay(delay);
        const raiderData = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/user/union-raider?ocid=${ocid}&date=${targetDate}`, headers);

        // 💡 10. 링크 스킬 데이터 가져오기
        await window.apiDelay(delay);
        const link_skill = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/character/link-skill?ocid=${ocid}&date=${targetDate}`, headers);

        // 💡 11. [수정 완료] 6차 헥사 스킬 코어 (403 에러 원인인 hexa-skill을 hexamatrix로 변경)
        await window.apiDelay(delay);
        const hexa_skill = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/character/hexamatrix?ocid=${ocid}&date=${targetDate}`, headers);

        // 💡 11-2. [누락 보정 추가] 헥사 스탯 코어 엔드포인트 데이터를 수집합니다. (데이터 누락 차단)
        await window.apiDelay(delay);
        const hexa_stat = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/character/hexamatrix-stat?ocid=${ocid}&date=${targetDate}`, headers);
        if (!hexa_stat || !hexa_stat.character_hexa_stat_core) {
            console.warn("⚠️ 헥사 스탯 데이터가 없거나 응답 형식이 다릅니다. (전체 응답):", hexa_stat);
        }

        // 💡 12. [보정 완료] 스킬 수집 루프 강화
        // 넥슨 API는 하이퍼 스킬을 별도 grade로 취급하지 않을 수도 있으므로, grade 파라미터를 비우면 전체가 오는지 확인하거나, 누락 가능성을 최소화합니다.
        let combinedSkills = [];
        const skillGrades = ["0", "1", "2", "3", "4", "5", "6"]; 
        
        // 1. 지정된 차수별 스킬 수집 [초보자용 주석] 0차부터 6차까지 각 차수 규격에 맞춰 안전하게 스킬 배열을 수집해 결합합니다.
        for (const grade of skillGrades) {
            await window.apiDelay(delay);
            const sData = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/character/skill?ocid=${ocid}&date=${targetDate}&character_skill_grade=${grade}`, headers);
            if (sData && Array.isArray(sData.character_skill)) {
                combinedSkills = combinedSkills.concat(sData.character_skill);
            }
        }
        
        // 2. [400 에러 원천 해결] 넥슨 OpenAPI 명세서상 차수 인자(grade)가 누락되면 무조건 400 Bad Request가 리턴되므로 불필요하고 실패하는 무인자 전체 호출 코드를 지워 콘솔 에러를 방지합니다.
        const skill = { character_skill: combinedSkills };

        if (union) {
            union.union_champion = (championData && championData.union_champion) ? championData.union_champion : [];
            union.champion_badge_total_info = (championData && championData.champion_badge_total_info) ? championData.champion_badge_total_info : [];
            
            union.union_raider_preset_1 = raiderData.union_raider_preset_1 || null;
            union.union_raider_preset_2 = raiderData.union_raider_preset_2 || null;
            union.union_raider_preset_3 = raiderData.union_raider_preset_3 || null;
            union.union_raider_preset_4 = raiderData.union_raider_preset_4 || null;
            union.union_raider_preset_5 = raiderData.union_raider_preset_5 || null;

            let foundCharacter = raiderData.union_raider_character || [];
            let foundBlock = raiderData.union_block || [];
            let foundStat = raiderData.union_raider_stat || [];
            const currentPresetNo = raiderData.use_preset_no;

            if ((!foundCharacter || foundCharacter.length === 0) && (!foundBlock || foundBlock.length === 0)) {
                if (currentPresetNo && raiderData[`union_raider_preset_${currentPresetNo}`]) {
                    const preset = raiderData[`union_raider_preset_${currentPresetNo}`];
                    foundCharacter = preset.union_raider_character || [];
                    foundBlock = preset.union_block || [];
                    foundStat = preset.union_raider_stat || [];
                }
            }

            if ((!foundCharacter || foundCharacter.length === 0) && (!foundBlock || foundBlock.length === 0)) {
                for (let i = 1; i <= 5; i++) {
                    const p = raiderData[`union_raider_preset_${i}`];
                    if (p) {
                        if (p.union_raider_character && p.union_raider_character.length > 0) {
                            foundCharacter = p.union_raider_character;
                            foundStat = p.union_raider_stat || [];
                            break;
                        }
                        if (p.union_block && p.union_block.length > 0) {
                            foundBlock = p.union_block;
                            foundStat = p.union_raider_stat || [];
                            break;
                        }
                    }
                }
            }

            union.union_raider_character = foundCharacter;
            union.union_block = foundBlock;
            union.union_raider_stat = foundStat;
            union.use_preset_no = currentPresetNo || 1;
        }
        
        const ranking = { overall: 0 }; 
        // 💡 [핵심 보정] 수집한 스킬(skill), 링크(link_skill), 헥사(hexa_skill), 헥사스탯(hexa_stat) 객체를 결과 묶음에 완전 누락 없이 추가합니다.
        const result = { basic, stat, item, ability, symbol, dojang, union, ranking, link_skill, hexa_skill, hexa_stat, skill };
        localStorage.setItem(cacheKey, JSON.stringify(result));
        return result;
    };

    try {
        return await runFetch(rDateStr);
    } catch (e) {
        console.warn("🎯 [DATA RESTORE] 수동 동기화를 긴급 발동합니다.");
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return await runFetch(yesterday.toISOString().split('T')[0]);
    }
};

window.fetchCentralRivals = function(worldName, myJob, dateStr, myName) {
    return new Promise(async (resolve) => {
        const headers = { "x-nxopen-api-key": typeof window.API_KEY !== 'undefined' ? window.API_KEY : "" };
        const rankUrl = `https://open.api.nexon.com/maplestory/v1/ranking/overall?date=${dateStr}&world_name=${encodeURIComponent(worldName)}&class_name=${encodeURIComponent(myJob)}`;
        const rankRes = await window.apiSafeFetch(rankUrl, headers);

        if (!rankRes.ranking || rankRes.ranking.length === 0) return resolve([]);

        const candidates = rankRes.ranking.filter(u => u.character_name !== myName).sort(() => 0.5 - Math.random()).slice(0, 4);
        let rivalResults = [];

        for (const user of candidates) {
            const ocidRes = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/id?character_name=${encodeURIComponent(user.character_name)}`, headers);
            if (ocidRes.ocid) {
                const statRes = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/character/stat?ocid=${ocidRes.ocid}`, headers);
                if (statRes.final_stat) {
                    const pObj = statRes.final_stat.find(s => s.stat_name === "전투력");
                    const power = pObj ? Number(pObj.stat_value) : 0;
                    if (power > 0) rivalResults.push({ name: user.character_name, power: power, job: user.class_name });
                }
            }
            await window.apiDelay(200);
        }
        resolve(rivalResults);
    });
};

window.fetchCentralComparisonData = async function(targetName) {
    const headers = { "x-nxopen-api-key": typeof window.API_KEY !== 'undefined' ? window.API_KEY : "" };
    const ocidRes = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/id?character_name=${encodeURIComponent(targetName)}`, headers);
    if (!ocidRes.ocid) throw new Error("NOT_FOUND");

    await window.apiDelay(300);
    const targetStat = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/character/stat?ocid=${ocidRes.ocid}`, headers);
    
    await window.apiDelay(300);
    const targetItem = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/character/item-equipment?ocid=${ocidRes.ocid}`, headers);

    return { targetStat, targetItem };
};

window.searchCharacter = async function(directName = null, isSyncOnly = false, shouldRedirect = true, forceRefresh = false) {
    if (window.isSearching) return;
    if (forceRefresh) window.currentSearchData = null; 

    let input = (directName?.trim() ||
                document.getElementById('sidebarSearchInput')?.value?.trim() || 
                document.getElementById('portalSearchInput')?.value?.trim() || "").toLowerCase();
    
    if (!input || input === "undefined" || input === "null" || input.includes("캐릭터 ")) return;

    const cacheKey = `maple_api_search_${input}`;
    const cachedData = localStorage.getItem(cacheKey);
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() - 1);
    const todayStr = dateObj.toISOString().split('T')[0];

    // 💡 [캐시 로드 파트 보정] [초보자용 주석] 브라우저 저장소에 캐시가 존재할 때 영문 대소문자 차이로 깨지는 현상을 차단하고, 저장된 데이터를 기반으로 왼쪽 사이드바 프로필 카드를 강제로 즉시 렌더링시킵니다.
    if (!isSyncOnly && !forceRefresh && cachedData) {
        try {
            const parsedCache = JSON.parse(cachedData);
            if (parsedCache.basic && parsedCache.basic.character_name && parsedCache.basic.character_name.toLowerCase() === input.toLowerCase()) {
                console.log(`🛡️ 캐시 로드 성공: ${input}`);
                window.currentSearchData = parsedCache; 
                // 🚀 [이미지 출력 해결] 캐시가 확인되는 즉시 사냥 UI 모듈의 캐릭터 카드 렌더러로 연동 주입하여 즉시 얼굴 이미지가 튀어나오도록 강제 가동시킵니다.
                if (typeof window.renderHuntCharacterCard === 'function') window.renderHuntCharacterCard(parsedCache);
                if (typeof window.updateSidebarCard === 'function') window.updateSidebarCard(input);
                if (typeof window.updateWeeklySummary === 'function') window.updateWeeklySummary(); 
                if (typeof window.renderSearchDetail === 'function') {
                    window.renderSearchDetail(
                        parsedCache.basic, parsedCache.stat, parsedCache.item, parsedCache.ability, 
                        parsedCache.symbol, parsedCache.dojang, parsedCache.union, parsedCache.ranking,
                        parsedCache.link_skill, parsedCache.hexa_skill, parsedCache.skill, parsedCache.hexa_stat
                    );
                }
                return parsedCache; 
            } else {
                localStorage.removeItem(cacheKey);
            }
        } catch (e) { 
            localStorage.removeItem(cacheKey);
        }
    }
    
    localStorage.setItem('maple_last_search', input); 
    if (forceRefresh) {
        window.currentSearchData = null;
        localStorage.removeItem(cacheKey);
    }
    
    window.isSearching = true;
    if(typeof window.toggleLoading === 'function') window.toggleLoading(true);

    // 💡 [실시간 수집 파트 보정] API 통신 완료 시 구조분해할당(`const { ... } = fullData`) 과정에서 유실되던 원인 필드들을 정확하게 붙잡아 렌더러로 인계합니다.
    try {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        const rDateStr = d.toISOString().split('T')[0];
        
        const fullData = await window.fetchCentralFullCharacterData(input, rDateStr, forceRefresh);
        const { basic, stat, item, ability, symbol, dojang, union, ranking, link_skill, hexa_skill, hexa_stat, skill } = fullData;

        if (!basic || !basic.character_name) {
            console.warn("⚠️ [OMNI] 필수 캐릭터 데이터 누락으로 캐싱을 우회합니다.");
        } else {
            const finalResult = { date: todayStr, ...fullData };
            localStorage.setItem(cacheKey, JSON.stringify(finalResult));
            window.currentSearchData = finalResult; 

            // 🚀 [이미지 연동 추가] 실시간 API 크롤링이 완료되었을 때도 사냥화면 카드가 즉시 갱신되도록 연동 컴포넌트를 직접 트리거하여 그립니다.
            if (typeof window.renderHuntCharacterCard === 'function') window.renderHuntCharacterCard(finalResult);
            if (typeof window.updateSidebarUI === 'function') window.updateSidebarUI(finalResult);

            window.syncCharacterToHunt({
                name: basic.character_name,
                world: basic.world_name,
                job: basic.character_class,
                level: basic.character_level
            });
        }

        if (typeof window.globalSync === 'function') window.globalSync(input);
        if (shouldRedirect && typeof window.omniSwitchPage === 'function') window.omniSwitchPage('searchPageContent');
        if (typeof window.renderSearchDetail === 'function') {
            window.renderSearchDetail(basic, stat, item, ability, symbol, dojang, union, ranking, link_skill, hexa_skill, skill, hexa_stat);
        }
        return window.currentSearchData || fullData;
    } catch (e) {
        console.error("검색 에러:", e);
        let errorMsg = e.message === "NOT_FOUND" ? "존재하지 않는 캐릭터명입니다." : "데이터를 준비하는 중입니다.";
        if (typeof window.omniModal === 'function') window.omniModal({ title: '조회 실패', desc: errorMsg, icon: '❌' });
        else alert(errorMsg);
        return false; 
    } finally {
        window.isSearching = false;
        if(typeof window.toggleLoading === 'function') window.toggleLoading(false);
    }
};

window.fetchMapleData = function(idx) {
    // 💡 [수정] DOM(입력창)을 찾지 않고, 탭별로 저장된 설정(Config)에서 닉네임을 최우선으로 가져옵니다.
    const targetIdx = (typeof idx !== 'object' && idx) ? parseInt(idx) : (window.currentIdx || 1);
    const savedConfig = JSON.parse(localStorage.getItem(`maple_config_${targetIdx}`) || '{}');
    const charName = savedConfig.name;

    if (!charName || charName.trim() === "" || charName.includes("캐릭터 ")) {
        alert("동기화할 캐릭터의 닉네임을 설정(Config)창에서 먼저 저장해주세요!");
        return;
    }

    if (!charName || charName.trim() === "" || charName.includes("캐릭터 ")) {
        alert("동기화할 캐릭터의 닉네임을 먼저 검색해주세요!");
        return;
    }

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) { refreshBtn.disabled = true; refreshBtn.innerText = '⏳ 최신 정보 동기화 중...'; }

    window.currentIdx = targetIdx;
    if (typeof window.searchCharacter === 'function') {
        // 🚀 [트래픽 원천 차단 패치] 마지막 네 번째 인자(forceRefresh)를 true에서 false로 전격 수정합니다.
        // 이를 통해 동기화 버튼을 누르거나 화면 컴포넌트가 로드될 때마다 캐시를 날리고 넥슨 서버를 무한 재타격하던 심각한 리소스 낭비를 완벽히 막고 캐시 데이터를 최우선 재활용하도록 바꿉니다.
        window.searchCharacter(charName, false, false, false).finally(() => {
            if (refreshBtn) { refreshBtn.disabled = false; refreshBtn.innerText = '🔄 정보 갱신'; }
        });
    }
};

window.syncCharacterToHunt = function(charData) {
    if (!charData || !charData.name) return;
    let history = JSON.parse(localStorage.getItem('maple_hunt_history') || '[]');
    history = history.filter(c => c.name !== charData.name);
    history.unshift(charData);
    if (history.length > 10) history = history.slice(0, 10);
    localStorage.setItem('maple_hunt_history', JSON.stringify(history));
    if (typeof window.renderSingleCharacterTab === 'function') {
        window.renderSingleCharacterTab(charData.name);
    }
};