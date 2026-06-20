/**
 * ============================================================================
 * 🏆 MAPLE OMNI - api-ranking.js
 * 메인 홈페이지의 종합 랭킹 조회를 담당하는 모듈
 * ============================================================================
 */

/**
 * 🌟 [중앙화 연동] 코어 모듈 파일에 정의된 전산 처리망을 경유하여 랭킹 TOP 10 데이터 리스트를 확보합니다.
 */
async function fetchRankingData(forceRefresh = false) {
    if (typeof window.fetchCentralRankingData === 'function') {
        return await window.fetchCentralRankingData(forceRefresh);
    }
    return [];
}

/**
 * 💡 [중앙화 연동] 캐릭터 상세 정보 페이지 내부 랭킹 보드를 갱신하기 위해 코어 안전 네트워크를 경유해 데이터를 확인합니다.
 */
async function fetchCharacterRanking(characterName) {
    try {
        const now = new Date();
        const offset = now.getHours() < 10 ? 2 : 1;
        now.setDate(now.getDate() - offset);
        const dateStr = now.toISOString().split('T')[0];

        const charRankCacheKey = `omni_rank_${characterName}_${dateStr}`;
        const cachedCharRank = JSON.parse(localStorage.getItem(charRankCacheKey));
        
        if (cachedCharRank) {
            console.log(`🛡️ ${characterName} 캐릭터 정보는 이미 오늘의 랭킹 캐시가 보존되어 있으므로 즉시 반환합니다.`);
            applyRankingToUI(cachedCharRank);
            return;
        }

        const headers = { "x-nxopen-api-key": typeof API_KEY !== 'undefined' ? API_KEY : "" };
        const data = await window.apiSafeFetch(`https://open.api.nexon.com/maplestory/v1/ranking/overall?date=${dateStr}&character_name=${encodeURIComponent(characterName)}`, headers);

        if (data.ranking && data.ranking.length > 0) {
            const info = data.ranking[0];
            localStorage.setItem(charRankCacheKey, JSON.stringify(info));
            applyRankingToUI(info);
        }
    } catch (e) {
        console.error("캐릭터 개별 랭킹 조회 도중 치명적 에러 발생:", e);
    }
}

function applyRankingToUI(info) {
    const overallElem = document.getElementById('res_ranking_overall');
    const worldElem = document.getElementById('res_ranking_world');
    const classElem = document.getElementById('res_ranking_class');

    if (overallElem) overallElem.innerText = `${Number(info.ranking).toLocaleString()}위`;
    if (worldElem) worldElem.innerText = `${Number(info.ranking).toLocaleString()}위`;
    if (classElem) classElem.innerText = info.class_name || "-";
}

window.renderMainRanking = async function() {
    const listEl = document.getElementById('rankingList');
    if (!listEl) return;

    const top10 = await fetchRankingData();

    if (!top10 || top10.length === 0) {
        listEl.innerHTML = `<div style="padding:40px; text-align:center; color:var(--text-sub); font-size:12px;">랭킹 데이터를 불러올 수 없습니다.</div>`;
        return;
    }

    let html = '';
    top10.forEach((user, idx) => {
        const rankColor = (idx === 0) ? '#fbbf24' : (idx === 1) ? '#94a3b8' : (idx === 2) ? '#b45309' : '#64748b';
        const className = user.class_name || "정보 없음";

        html += `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 10px; border-bottom: 1px solid #f1f5f9;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-weight: 900; color: ${rankColor}; width: 20px; text-align: center;">${user.ranking}</span>
                    <div style="display: flex; flex-direction: column;">
                        <b style="font-size: 13px; color: var(--text-main);">${user.character_name}</b>
                        <span style="font-size: 10px; color: var(--text-sub);">${user.world_name} | ${className}</span>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 12px; font-weight: 800; color: var(--text-main);">Lv.${user.character_level}</div>
                </div>
            </div>
        `;
    });

    listEl.innerHTML = html;
};

// 페이지 로드 시 실행
window.addEventListener('load', () => {
    if (document.getElementById('rankingList')) {
        setTimeout(window.renderMainRanking, 500);
    }
    
    // 💡 [안전 강화] 간섭 레이아웃 충돌 방지를 위해 search_main 내부 구조의 렌더만 최종 동기화합니다.
    setTimeout(() => {
        if (typeof window.renderRecentSearchesMain === 'function') {
            console.log("🛡️ [최종 복구] 검색 기록을 안전하게 단독 동기화합니다.");
            window.renderRecentSearchesMain();
        }
    }, 1000); 
});