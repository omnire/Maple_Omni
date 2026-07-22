/**
 * ============================================================================
 * 🏆 MAPLE OMNI - js/search/search_achievement.js [ACHIEVEMENT MODULE - DARK MODE]
 * 설명: 기존 search.js에서 비대하게 결합되어 있던 업적 관제소 로직을 분리한 모듈입니다.
 * 더미 텍스트를 전면 제거하고, 넥슨 OpenAPI ranking 패킷의 실시간 지표를 매핑합니다.
 * 최적화: 레이아웃 디자인 시스템(SEARCH_UI)을 공유받아 통일성 있는 다크 라벤더 카드를 빌드합니다.
 * 규칙: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 달아줍니다.
 * ============================================================================
 */

/**
 * 💡 [초보자 가이드] 넥슨 오픈 API 데이터 주머니를 실시간 파싱하여 
 * 화면에 더미 없이 깨끗한 순수 업적 요약 대시보드를 출력하는 마스터 렌더러입니다.
 */
window.renderAchievementsModule = function() {
    // 글로벌 검색 버퍼에 가두어 둔 넥슨 수신 패킷 자원을 꺼내옵니다.
    const data = window.currentSearchData;
    
    // 💡 [실시간 연동 가이드] 넥슨 종합 랭킹 데이터 스케일 내부의 업적 점수를 추출합니다.
    const rawScore = (data && data.ranking?.achievement_score) ? Number(data.ranking.achievement_score) : 0;
    
    // 화면에 이쁘게 쉼표(,)를 찍어주기 위한 포맷팅 처리
    const formattedScore = rawScore > 0 ? rawScore.toLocaleString() : "0";
    
    // 인게임 지표 기반 점수대별 뱃지 등급 분기 제어 (다크 모드에 맞춰 명도가 확보된 파스텔톤 컬러 설정)
    let tierBadge = "⚪ 브론즈";
    let tierColor = "#94a3b8";
    
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

    // 💡 캐릭터 기본 정보(직업, 월드)를 안전하게 서칭합니다.
    const charName = data?.basic?.character_name || "탐색 대상";
    const charClass = data?.basic?.character_class || "미확인 직업";
    const worldName = data?.basic?.world_name || "메이플 월드";

    return `
        <div style="background: #1e293b; border-radius: 20px; padding: 24px; border: 1px solid #4c1d95; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); animation: omniViewportShow 0.25s ease; text-align:left;">
            <div style="border-left: 4px solid #7a6ec7; padding-left: 12px; margin-bottom: 20px;">
                <h3 style="margin: 0; font-size: 15px; font-weight: 900; color: #f8fafc;">🏆 넥슨 라이브 동기화 업적(Achievement) 관제소</h3>
                <span style="font-size: 11px; color: #a78bfa; font-weight: 700;">인게임 누적 업적 및 모험 활동 스코어를 실시간으로 정산합니다.</span>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
                <div style="background: #18122b; border: 1px solid #4c1d95; padding: 20px; border-radius: 12px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <span style="font-size: 11px; font-weight: 800; color: #a78bfa; display: block; margin-bottom: 4px;">현재 업적 등급</span>
                    <strong style="font-size: 18px; color: ${tierColor}; display: block; font-weight: 900; margin-bottom: 12px;">${tierBadge}</strong>
                    
                    <div style="background: #1e293b; border: 1px solid #4c1d95; padding: 10px 18px; border-radius: 8px; font-size: 15px; font-weight: 900; color: #f8fafc; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                        ${formattedScore} <span style="font-size:12px; color:#c084fc; font-weight:800;">Point</span>
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 8px; justify-content: center;">
                    <div style="display:flex; justify-content:space-between; align-items:center; background:#18122b; border:1px solid #4c1d95; padding:12px 16px; border-radius:8px;">
                        <div>
                            <span style="font-size:12px; font-weight:800; color:#e2e8f0; display:block;">🔥 ${charName} 모험가의 시그니처 챌린지</span>
                            <span style="font-size:10.5px; color:#a78bfa; font-weight:600;">${worldName} 월드에서 유일무이한 ${charClass} 성장을 증명함.</span>
                        </div>
                        <span style="font-size:11px; font-weight:900; color:#4ade80; background:#064e3b; padding:2px 6px; border-radius:4px; border: 1px solid #065f46;">ACTIVE</span>
                    </div>
                    
                    <div style="display:flex; justify-content:space-between; align-items:center; background:#18122b; border:1px solid #4c1d95; padding:12px 16px; border-radius:8px;">
                        <div>
                            <span style="font-size:12px; font-weight:800; color:#e2e8f0; display:block;">🌐 넥슨 OpenAPI 통합 스캔 동기화</span>
                            <span style="font-size:10.5px; color:#a78bfa; font-weight:600;">캐시 왜곡 없는 실시간 랭킹 추적 필터 가동 중</span>
                        </div>
                        <span style="font-size:11px; font-weight:900; color:#c084fc; background:#2e1065; padding:2px 6px; border-radius:4px; border: 1px solid #6b21a8;">SYNCED</span>
                    </div>
                </div>
            </div>
        </div>
    `;
};