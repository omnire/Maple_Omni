/**
 * ============================================================================
 * 🌐 MAPLE OMNI - 중앙 집중형 API 코어 모듈 (api-core.js)
 * 설명: 넥슨 오픈 API와의 통신을 한 곳에서 안전하게 제어합니다.
 * ============================================================================
 * 💡 [초보자 가이드] 
 * 이 파일은 넥슨 서버에 직접 대화를 시도하여 캐릭터, 스탯, 유니온 등의 데이터를
 * 안전하게 긁어오는 '심장부' 역할을 합니다. 서버 과부하를 막는 안전장치가 들어있습니다.
 */

// 통신 상태 제어용 전역 변수 설정 (중복 실행 방지)
if (typeof window.isFetchingRanking === 'undefined') window.isFetchingRanking = false;
if (typeof window.isSearching === 'undefined') window.isSearching = false;

// ⏰ [초보자용 주석] 넥슨 서버가 봇(Bot)으로 오해해서 차단하지 않도록 ms(밀리초) 단위로 잠깐 쉬어가는 기능입니다.
window.apiDelay = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

// 🛡️ [초보자용 주석] 통신 중 에러가 나도 웹사이트 전체가 멈추지 않고, 안전하게 빈 상자({})를 반환하는 방어용 함수입니다.
window.apiSafeFetch = async function(url, headers) {
    try {
        const response = await fetch(url, { headers });
        if (response.status === 429) {
            console.error("⚠️ [API 과부하 발생] 요청 한도가 초과되었습니다. 잠시 후 시도해주세요.");
        }
        return response.ok ? await response.json() : {};
    } catch (error) {
        console.error("❌ [통신 실패] 주소:", url, error);
        return {};
    }
};

// 📅 [초보자용 주석] 넥슨 API는 오늘 날짜 데이터를 당일 바로 제공하지 않으므로, 안전하게 어제 날짜를 계산해주는 함수입니다.
window.getSafeApiDate = function() {
    const now = new Date();
    now.setDate(now.getDate() - 1);
    return now.toISOString().split('T')[0];
};

// 🏆 종합 랭킹 데이터를 가져오는 함수
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
        const headers = { "x-nxopen-api-key": typeof API_KEY !== 'undefined' ? API_KEY : "" };
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

// 🔍 캐릭터의 모든 상세 정보(기본정보, 스탯, 장비, 유니온, 챔피언 포함)를 일괄적으로 가져오는 핵심 함수
window.fetchCentralFullCharacterData = async function(charName, rDateStr) {
    console.log("🚀 [시동] fetchCentralFullCharacterData 함수 실행됨!");
    const headers = { "x-nxopen-api-key": typeof API_KEY !== 'undefined' ? API_KEY : "" };
    const delay = 300; // API 요청 간격 대기 시간 (0.3초)

    // 🛡️ [절대 방어 캐시] 당일 이미 조회한 내역이 완벽히 존재하면 서버에 다시 묻지 않고 즉시 반환합니다.
    const todayStr = new Date().toISOString().split('T')[0];
    const emergencyCache = localStorage.getItem(`maple_api_search_${charName}_${todayStr}`);
    if (window.currentSearchData?.basic?.character_name === charName && emergencyCache) {
        return window.currentSearchData;
    }

    const runFetch = async (targetDate) => {
        const cacheKey = `maple_api_search_${charName}_${targetDate}`;
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) return JSON.parse(cachedData);

        // 💡 [최적화] 고유 식별 번호(OCID)를 먼저 브라우저에 저장하여 중복 조회를 방지합니다.
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

        // 1. 캐릭터 기본 정보 호출
        const basic = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${ocid}&date=${targetDate}`, headers);
        if (!basic.character_name) throw new Error("DATA_NOT_READY");
        
        // 2. 캐릭터 상세 스탯 호출
        await window.apiDelay(delay);
        const stat = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/character/stat?ocid=${ocid}&date=${targetDate}`, headers);
        
        // 3. 장착 장비 정보 호출
        await window.apiDelay(delay);
        const item = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/character/item-equipment?ocid=${ocid}&date=${targetDate}`, headers);
        
        // 4. 어빌리티 정보 호출
        await window.apiDelay(delay);
        const ability = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/character/ability?ocid=${ocid}&date=${targetDate}`, headers);
        
        // 5. 아케인/어센틱 심볼 정보 호출
        await window.apiDelay(delay);
        const symbol = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/character/symbol-equipment?ocid=${ocid}&date=${targetDate}`, headers);
        
        // 6. 무릉도장 최고 기록 호출
        await window.apiDelay(delay);
        const dojang = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/character/dojang?ocid=${ocid}&date=${targetDate}`, headers);
        
        // 7. 유니온 기본 정보 호출 (등급, 아티팩트 등)
        await window.apiDelay(delay);
        const union = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/user/union?ocid=${ocid}&date=${targetDate}`, headers);
        
        // 8. 💡 유니온 챔피언 및 공격대원 정보 별도 호출
        await window.apiDelay(delay);
        const championData = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/user/union-champion?ocid=${ocid}&date=${targetDate}`, headers);
        
        await window.apiDelay(delay);
        const raiderData = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/user/union-raider?ocid=${ocid}&date=${targetDate}`, headers);

        console.log("🔥 [디버그] 넥슨 API가 뱉어낸 원시 데이터 (raiderData):", raiderData);
        
        // 🎯 넥슨 공식 API 데이터 통합: 챔피언과 레이더 데이터를 유니온 객체에 병합
        if (union) {
            // 1. 챔피언 정보 통합
            union.union_champion = (championData && championData.union_champion) ? championData.union_champion : [];
            union.champion_badge_total_info = (championData && championData.champion_badge_total_info) ? championData.champion_badge_total_info : [];
            
            // 2. 레이더 정보 통합 (루트 및 모든 프리셋 강제 탐색)
            let foundPreset = null;
            for (let i = 1; i <= 5; i++) {
                const p = raiderData[`union_raider_preset_${i}`];
                if (p && p.union_block && p.union_block.length > 0) {
                    foundPreset = p;
                    console.log(`✅ [자동 검색] 프리셋 ${i}에서 데이터 발견!`);
                    break;
                }
            }

            // 데이터가 있는 곳을 최우선으로 매핑 (루트 > 프리셋 > 빈배열)
            union.union_block = (raiderData.union_block && raiderData.union_block.length > 0) ? raiderData.union_block 
                              : (foundPreset ? foundPreset.union_block : []);

            union.union_raider_stat = (raiderData.union_raider_stat && raiderData.union_raider_stat.length > 0) ? raiderData.union_raider_stat 
                                    : (foundPreset ? foundPreset.union_raider_stat : []);
            
            union.use_preset_no = raiderData.use_preset_no || (foundPreset ? "프리셋에서 발견됨" : "데이터없음");
            
            console.log("🛠️ [최종 병합] union_block 데이터 길이:", union.union_block.length);
            console.log("🛠️ [최종 병합] 결과물:", union.union_block);
        }
        
        const ranking = { overall: 0 }; 

        const result = { basic, stat, item, ability, symbol, dojang, union, ranking };
        localStorage.setItem(cacheKey, JSON.stringify(result));
        return result;
    };

    try {
        return await runFetch(rDateStr);
    } catch (e) {
        console.warn("데이터 준비 미흡(400)으로 어제 날짜 재시도합니다:", e);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return await runFetch(yesterday.toISOString().split('T')[0]);
    }
};

// 라이벌(경쟁자) 데이터를 무작위로 추출하여 가져오는 함수
window.fetchCentralRivals = function(worldName, myJob, dateStr, myName) {
    return new Promise(async (resolve) => {
        const headers = { "x-nxopen-api-key": typeof API_KEY !== 'undefined' ? API_KEY : "" };
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
            await window.apiDelay(400);
        }
        resolve(rivalResults);
    });
};

// 두 캐릭터 스탯 및 장비를 비교하기 위해 상대방 데이터를 가져오는 함수
window.fetchCentralComparisonData = async function(targetName) {
    const headers = { "x-nxopen-api-key": typeof API_KEY !== 'undefined' ? API_KEY : "" };
    const ocidRes = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/id?character_name=${encodeURIComponent(targetName)}`, headers);
    if (!ocidRes.ocid) throw new Error("NOT_FOUND");

    await window.apiDelay(600);
    const targetStat = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/character/stat?ocid=${ocidRes.ocid}`, headers);
    
    await window.apiDelay(600);
    const targetItem = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/character/item-equipment?ocid=${ocidRes.ocid}`, headers);

    return { targetStat, targetItem };
};