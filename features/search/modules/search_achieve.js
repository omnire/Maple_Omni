/**
 * ============================================================================
 * 👤 MAPLE OMNI - search_achieve.js
 * 설명: 업적 탭을 눌렀을 때 실행될 코드를 작성할 전용 파일입니다.
 * ============================================================================
 */

window.renderAchievement = function() {
    const data = window.currentSearchData;
    // 💡 [초보자 가이드] 안전 연동을 위한 예외 체크문 가동
    if (!data || !data.basic) {
        return `<div style="padding:60px; text-align:center; color:#94a3b8; font-weight:700; background:white; border-radius:20px;">🏆 캐릭터 정보가 로드되지 않아 업적 데이터를 연동할 수 없습니다.</div>`;
    }

    // 💡 넥슨 API 데이터 연동 (구조 분석 매핑)
    // 일반적으로 메이플스토리 업적 점수는 스탯 필드 내부나 랭킹 정보의 업적 점수 데이터를 주 타겟으로 바인딩합니다.
    const score = data.ranking?.trophy_score || data.basic?.character_achievement_score || "데이터 준비 중";
    const grade = data.ranking?.trophy_grade || "마스터 랭크"; 

    return `
        <div style="background: white; border-radius: 20px; padding: 28px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); margin: 10px 0; display: flex; flex-direction: column; gap: 24px;">
            <div style="display: flex; align-items: center; gap: 20px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #bbf7d0; padding: 20px; border-radius: 16px;">
                <div style="font-size: 40px; background: white; width: 70px; height: 70px; display: flex; align-items: center; justify-content: center; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">🏆</div>
                <div>
                    <h3 style="margin: 0; font-size: 18px; font-weight: 900; color: #16a34a;">${data.basic.character_name} 님의 모험 업적</h3>
                    <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: 700; color: #166534;">현재 획득 등급 계급: <span style="background:#16a34a; color:white; padding:1px 6px; border-radius:4px; font-size:11px; font-weight:900;">${grade}</span></p>
                </div>
            </div>

            <div style="border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; background: #fafafa;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 13px; font-weight: 800; color: #475569;">🎖️ 종합 누적 업적 트로피 점수</span>
                    <span style="font-size: 16px; font-weight: 900; color: #1e293b;">${typeof score === 'number' ? score.toLocaleString() : score} Point</span>
                </div>
                
                <div style="width: 100%; height: 12px; background: #e2e8f0; border-radius: 6px; overflow: hidden; margin-top:14px;">
                    <div style="width: 78%; height: 100%; background: linear-gradient(90deg, #10b981, #059669); border-radius: 6px;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: #94a3b8; margin-top: 8px;">
                    <span>기본 여정 달성</span>
                    <span>최고 정점 대적자 (Max)</span>
                </div>
            </div>
        </div>
    `;
};