/**
 * ============================================================================
 * 👤 MAPLE OMNI - js/search/basic.js [THEME ADAPTIVE]
 * 설명: 기본 캐릭터 내실 세부 데이터 파서 및 다차원 스탯 그리드 마운트 스크립트
 * 수정사항: 스탯 배열 유효성 검사 강화 및 초보자용 상세 주석 보완
 * 규칙: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 달아줍니다.
 * ============================================================================
 */

/**
 * 💡 [초보자 가이드] 넥슨 API 스탯 배열 노드에서 원하는 항목명을 안전하게 탐색해오는 보정 함수입니다.
 * @param {Array} statList - 넥슨 API에서 수신한 final_stat 배열
 * @param {string} statName - 찾고자 하는 스탯 이름 (예: "보스 몬스터 공격 시 데미지")
 */
window.getSafeStatValue = function(statList, statName) {
    if (!Array.isArray(statList)) return "-";
    const match = statList.find(s => s && s.stat_name === statName);
    return match ? match.stat_value : "-";
};

/**
 * 💡 [초보자 가이드] 메인 레이아웃 내부에 추가로 삽입할 디테일 스탯 보정 그리드를 HTML 템플릿 코드로 구성해주는 함수입니다.
 * @param {Array} finalStat - 캐릭터의 최종 스탯 목록 데이터
 */
window.generateAuxiliaryStatGrid = function(finalStat) {
    // 안전 장치: finalStat이 배열이 아닌 경우 빈 배열로 처리하여 크래시 방지
    const safeStats = Array.isArray(finalStat) ? finalStat : [];

    const trackingTargets = [
        { title: "💥 크리티컬 데미지", key: "크리티컬 데미지" },
        { title: "😈 보스 공격 데미지", key: "보스 몬스터 공격 시 데미지" },
        { title: "🛡️ 방어율 무시 계수", key: "방어율 무시" },
        { title: "✨ 일반 데미지 비율", key: "데미지" },
        { title: "🎯 크리티컬 확률", key: "크리티컬 확률" },
        { title: "🍀 아이템 드롭 확률", key: "아이템 드롭률" },
        { title: "🪙 메소 획득량 계수", key: "메소 획득량" }
    ];

    let layoutHtml = `<div class="stat-grid-layout-box" style="display:flex; flex-direction:column; gap:8px; width:100%;">`;
    
    trackingTargets.forEach(stat => {
        const val = window.getSafeStatValue(safeStats, stat.key);
        layoutHtml += `
            <div class="stat-grid-item-row" style="display:flex; justify-content:space-between; align-items:center; background: var(--omni-card-bg); border:1px solid var(--omni-card-border-line); padding:6px 12px; border-radius:8px; font-size: 11.5px;">
                <span style="color: var(--omni-text-muted); font-weight: 700;">${stat.title}</span>
                <span style="color: var(--omni-text-dark); font-weight: 800;">${val}</span>
            </div>
        `;
    });

    layoutHtml += `</div>`;
    return layoutHtml;
};