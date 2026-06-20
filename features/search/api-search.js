/**
 * ============================================================================
 * 🔍 MAPLE OMNI - api-search.js (안전 최적화본)
 * 설명: 넥슨 API 과부하(429 에러)를 방지하기 위해 0.15초 딜레이를 두고 순차 통신합니다.
 * ============================================================================
 */

if (typeof window.isSearching === 'undefined') window.isSearching = false;

window.searchCharacter = async function(directName = null, isSyncOnly = false, shouldRedirect = true, forceRefresh = false) {
    if (window.isSearching) return;
    
    // 💡 [강제 초기화] 갱신 시에는 메모리의 잔상을 즉시 지워버립니다.
    if (forceRefresh) window.currentSearchData = null; 

    let input = (directName?.trim() ||
                document.getElementById('sidebarSearchInput')?.value?.trim() || 
                document.getElementById('portalSearchInput')?.value?.trim() || "").toLowerCase();
    
    if (!input || input === "undefined" || input === "null" || input.includes("캐릭터 ")) return;

    // [api-search.js 내 searchCharacter 함수 내부의 캐시 로직]
    
    const cacheKey = `maple_api_search_${input}`;
    const cachedData = localStorage.getItem(cacheKey);
    // 💡 [수정] 장비 데이터 누락 방지를 위해 항상 하루 전 날짜를 캐시 기준으로 삼습니다.
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() - 1);
    const todayStr = dateObj.toISOString().split('T')[0];

    if (!isSyncOnly && !forceRefresh && cachedData) {
        try {
            const parsedCache = JSON.parse(cachedData);
            // 💡 [수정] 날짜(parsedCache.date)와 캐릭터명이 오늘 날짜/이름과 모두 일치할 때만 캐시를 사용합니다.
            if (parsedCache.basic?.character_name === input && parsedCache.date === todayStr) {
                console.log(`🛡️ 캐시 로드 성공: ${input}`);
                
                window.currentSearchData = parsedCache; 
                
                // 캐시 사용 시 UI 즉시 갱신
                if (typeof window.updateSidebarCard === 'function') window.updateSidebarCard(input);
                if (typeof window.updateWeeklySummary === 'function') window.updateWeeklySummary(); 
                
                if (typeof window.renderSearchDetail === 'function') {
                    window.renderSearchDetail(
                        parsedCache.basic, 
                        parsedCache.stat, 
                        parsedCache.item, 
                        parsedCache.ability, 
                        parsedCache.symbol, 
                        parsedCache.dojang, 
                        parsedCache.union, 
                        parsedCache.ranking
                    );
                }
                return parsedCache; 
            } else {
                console.log("📅 캐시 날짜 만료 혹은 데이터 불일치. 새로 조회합니다.");
                // 날짜가 지났거나 다른 캐릭터라면 캐시를 버리고 새로고침 준비
                localStorage.removeItem(cacheKey);
            }
        } catch (e) { 
            console.error("캐시 오류:", e); 
            localStorage.removeItem(cacheKey);
        }
    }
    
    // 🌟 2. API 통신 시작
    localStorage.setItem('maple_last_search', input); 
    
    if (forceRefresh) {
        window.currentSearchData = null;
        localStorage.removeItem(cacheKey);
    }
    
    window.isSearching = true;
    if(typeof window.toggleLoading === 'function') window.toggleLoading(true);

    try {
        // 💡 [중앙화 연동 포인트] 무수히 얽혀있던 11개의 연속 패치 호출문 단계를 하나의 단일 코어 비즈니스 함수로 위임 전달합니다.
        // 데이터 누락 방지를 위해 확실하게 하루 전 날짜를 기준으로 호출합니다.
        const d = new Date();
        d.setDate(d.getDate() - 1);
        const rDateStr = d.toISOString().split('T')[0];
        console.log("🎯 [OMNI SYSTEM] 통합 관리 코어를 통한 캐릭터 종합 패키지 정보 일괄 조회 위임 개시:", rDateStr);

        const { basic, stat, item, ability, symbol, dojang, union, ranking } = await window.fetchCentralFullCharacterData(input, rDateStr);

        // 🌟 6. 중앙 모듈에서 조립 완료된 순수 객체본 스토리지 영구 영수증 캐시 처리
        // 💡 [수정] 유니온 데이터가 없는 캐릭터를 위해 필수(basic) 데이터 위주로 검증 로직을 완화합니다.
        if (!basic || !basic.character_name) {
            console.warn("⚠️ [OMNI] 필수 캐릭터 데이터가 수신되지 않아 캐시 저장을 건너뜁니다.");
        } else {
            const finalResult = { date: todayStr, basic, stat, item, ability, symbol, dojang, union, ranking };
            localStorage.setItem(cacheKey, JSON.stringify(finalResult));
            window.currentSearchData = finalResult; 

            // 💡 [사이드바 동기화 안착] 수신에 최종 성공한 경우 UI의 사이드바 프로필 카드를 실시간 갱신 처리합니다.
            if (typeof window.updateSidebarUI === 'function') window.updateSidebarUI(finalResult);

            // [연동] 사냥 기록지 데이터 연동
            window.syncCharacterToHunt({
                name: basic.character_name,
                world: basic.world_name,
                job: basic.character_class,
                level: basic.character_level
            });
        }

        // 🌟 [통합 동기화] 조회 완료 시 모든 곳에 즉시 반영 (Sidebar, Hunt, Builder, Scanner)
        if (typeof window.globalSync === 'function') window.globalSync(input);

        if (shouldRedirect && typeof window.omniSwitchPage === 'function') window.omniSwitchPage('searchPageContent');
        
        // 💡 UI 상세 렌더링
        if (typeof window.renderSearchDetail === 'function') {
            window.renderSearchDetail(basic, stat, item, ability, symbol, dojang, union, ranking);
        }
        
        return window.currentSearchData || { basic, stat, item, ability, symbol, dojang, union, ranking };

    } catch (e) {
        console.error("검색 오류:", e);
        let errorMsg = e.message === "NOT_FOUND" ? "존재하지 않는 캐릭터명입니다." : 
                       e.message === "API_KEY_INVALID" ? "API 키 오류입니다." : "데이터 준비 중입니다.";
        
        if (typeof window.omniModal === 'function') window.omniModal({ title: '조회 실패', desc: errorMsg, icon: '❌' });
        else alert(errorMsg);
        return false; 
    } finally {
        window.isSearching = false;
        if(typeof window.toggleLoading === 'function') window.toggleLoading(false);
    }
};

window.fetchMapleData = function(idx) {
    const targetIdx = (typeof idx !== 'object' && idx) ? parseInt(idx) : (window.currentIdx || 1);
    const charName = JSON.parse(localStorage.getItem(`maple_config_${targetIdx}`) || '{}').name || 
                     document.getElementById('sidebarSearchInput')?.value || 
                     document.getElementById('portalSearchInput')?.value;

    if (!charName || charName.trim() === "" || charName.includes("캐릭터 ")) {
        alert("동기화할 캐릭터의 닉네임을 먼저 검색해주세요!");
        return;
    }

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) { refreshBtn.disabled = true; refreshBtn.innerText = '갱신 중...'; }

    window.currentIdx = targetIdx;
    
    if (typeof window.searchCharacter === 'function') {
        window.searchCharacter(charName, true, false).finally(() => {
            if (refreshBtn) { refreshBtn.disabled = false; refreshBtn.innerText = '🔄 정보 갱신'; }
        });
    }
};

window.syncCharacterToHunt = function(charData) {
    if (!charData || !charData.name) return;
    
    let history = JSON.parse(localStorage.getItem('maple_hunt_history') || '[]');
    
    // 이미 있으면 삭제 후 맨 앞으로 (최신순 정렬)
    history = history.filter(c => c.name !== charData.name);
    history.unshift(charData);
    
    // 💡 [수정] 10개만 유지
    if (history.length > 10) history = history.slice(0, 10);
    
    localStorage.setItem('maple_hunt_history', JSON.stringify(history));
    
    if (typeof window.renderSingleCharacterTab === 'function') {
        window.renderSingleCharacterTab(charData.name);
    }
};