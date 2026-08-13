/**
 * ============================================================================
 * 🏆 MAPLE OMNI - js/search/search_achievement.js [ACHIEVEMENT MODULE - THEME ADAPTIVE]
 * 설명: 기존 search.js에서 분리된 업적 관제소 모듈입니다.
 * 수정내용: 넥슨 오픈API 규격 패킷에서 업적 점수를 추출하는 다중 폴백 세이프티 가드 적용
 * 규칙: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 달아줍니다.
 * ============================================================================
 */

window.renderAchievementsModule = function() {
    const data = window.currentSearchData || {};
    
    // 💡 [초보자 가이드] 넥슨 API 패킷 위치 차이에 대응하는 다중 업적 점수 탐색
    const rawScore = Number(
        data?.ranking?.achievement_score || 
        data?.achievement?.achievement_score || 
        data?.user_achievement?.achievement_score ||
        data?.achievement_score || 
        data?.ranking?.ranking?.[0]?.achievement_score ||
        0
    );
    
    const formattedScore = rawScore > 0 ? rawScore.toLocaleString() : "0";
    
    let tierBadge = "⚪ 브론즈";
    let tierColor = "var(--omni-text-sub)";
    
    if (rawScore >= 30000) {
        tierBadge = "✨ 신화적 레전드";
        tierColor = "#fb923c";
    } else if (rawScore >= 20000) {
        tierBadge = "👑 마스터";
        tierColor = "#c084fc";
    } else if (rawScore >= 10000) {
        tierBadge = "💎 다이아";
        tierColor = "#38bdf8";
    } else if (rawScore >= 5000) {
        tierBadge = "🥇 골드";
        tierColor = "#fbbf24";
    } else if (rawScore > 0) {
        tierBadge = "🥈 실버";
        tierColor = "#4ade80";
    }

    const charName = data?.basic?.character_name || "탐색 대상";
    const charClass = data?.basic?.character_class || "미확인 직업";
    const worldName = data?.basic?.world_name || "메이플 월드";

    return `
        <div style="background: var(--omni-card-bg); border-radius: 20px; padding: 24px; border: 1px solid var(--omni-card-border-line); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); animation: omniViewportShow 0.25s ease; text-align:left;">
            <div style="border-left: 4px solid var(--omni-slate-primary); padding-left: 12px; margin-bottom: 20px;">
                <h3 style="margin: 0; font-size: 15px; font-weight: 900; color: var(--omni-text-dark);">🏆 넥슨 라이브 동기화 업적(Achievement) 관제소</h3>
                <span style="font-size: 11px; color: var(--omni-text-sub); font-weight: 700;">인게임 누적 업적 및 모험 활동 스코어를 실시간으로 정산합니다.</span>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
                <div style="background: var(--omni-hover-point); border: 1px solid var(--omni-card-border-line); padding: 20px; border-radius: 12px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <span style="font-size: 11px; font-weight: 800; color: var(--omni-text-sub); display: block; margin-bottom: 4px;">현재 업적 등급</span>
                    <strong style="font-size: 18px; color: ${tierColor}; display: block; font-weight: 900; margin-bottom: 12px;">${tierBadge}</strong>
                    
                    <div style="background: var(--omni-card-bg); border: 1px solid var(--omni-card-border-line); padding: 10px 18px; border-radius: 8px; font-size: 15px; font-weight: 900; color: var(--omni-text-dark); box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                        ${formattedScore} <span style="font-size:12px; color:var(--omni-slate-primary); font-weight:800;">Point</span>
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 8px; justify-content: center;">
                    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--omni-hover-point); border:1px solid var(--omni-card-border-line); padding:12px 16px; border-radius:8px;">
                        <div>
                            <span style="font-size:12px; font-weight:800; color:var(--omni-text-dark); display:block;">🔥 ${charName} 모험가의 시그니처 챌린지</span>
                            <span style="font-size:10.5px; color:var(--omni-text-sub); font-weight:600;">${worldName} 월드에서 유일무이한 ${charClass} 성장을 증명함.</span>
                        </div>
                        <span style="font-size:11px; font-weight:900; color:#4ade80; background:rgba(6,78,59,0.15); padding:2px 6px; border-radius:4px; border: 1px solid #065f46;">ACTIVE</span>
                    </div>
                    
                    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--omni-hover-point); border:1px solid var(--omni-card-border-line); padding:12px 16px; border-radius:8px;">
                        <div>
                            <span style="font-size:12px; font-weight:800; color:var(--omni-text-dark); display:block;">🌐 넥슨 OpenAPI 통합 스캔 동기화</span>
                            <span style="font-size:10.5px; color:var(--omni-text-sub); font-weight:600;">캐시 왜곡 없는 실시간 랭킹 추적 필터 가동 중</span>
                        </div>
                        <span style="font-size:11px; font-weight:900; color:var(--omni-slate-primary); background:var(--omni-card-bg); padding:2px 6px; border-radius:4px; border: 1px solid var(--omni-card-border-line);">SYNCED</span>
                    </div>
                </div>
            </div>
        </div>
    `;
};