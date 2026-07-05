/**
 * ============================================================================
 * 👤 MAPLE OMNI - js/search/basic.js
 * 설명: 기본 캐릭터 내실 세부 데이터 파서 및 다차원 스텟 그리드 마운트 스크립트
 * 가이드: 초보도 실시간 스텟 배열에서 손쉽게 데이터를 수확하도록 설계된 완성판 패키지
 * ============================================================================
 */

/**
 * 💡 [초보자 가이드] 넥슨 API가 반환한 종합 스텟 배열 노드에서 원하는 항목명을 안전하게 탐색해오는 보정 함수입니다.
 * @param {Array} statList - 캐릭터 종합 파싱 결과 최종 스텟 데이터 리스트
 * @param {String} statName - 출력하길 원하는 스탯의 원래 한글 이름 (예: "방어율 무시")
 */
window.getSafeStatValue = function(statList, statName) {
    // 만약 전달받은 스텟 리스트 데이터가 올바른 배열 형식이 아니라면 에러를 방지하기 위해 대시(-) 문자를 즉시 반환합니다.
    if (!Array.isArray(statList)) return "-";
    
    // 배열 내부에서 stat_name 속성이 우리가 찾고자 하는 statName과 완벽히 일치하는 요소를 하나 찾아냅니다.
    const match = statList.find(s => s.stat_name === statName);
    
    // 일치하는 항목을 찾았다면 해당 항목의 실 수치값(stat_value)을 반환하고, 없으면 안전하게 대시(-)를 출력합니다.
    return match ? match.stat_value : "-";
};

/**
 * 💡 [초보자 가이드] 메인 레이아웃 내부에 추가로 삽입할 디테일 스텟 보정 그리드를 HTML 템플릿 코드로 구성해주는 함수입니다.
 * @param {Array} finalStat - 캐릭터가 보유한 최종 인게임 스텟 정보 노드 데이터
 */
window.generateAuxiliaryStatGrid = function(finalStat) {
    // 화면에 일목요연하게 모아서 보여줄 7가지 핵심 타겟 스탯과 노출용 이모지 타이틀을 정의합니다.
    const trackingTargets = [
        { title: "💥 크리티컬 데미지", key: "크리티컬 데미지" },
        { title: "😈 보스 공격 데미지", key: "보스 몬스터 공격 시 데미지" },
        { title: "🛡️ 방어율 무시 계수", key: "방어율 무시" },
        { title: "✨ 일반 데미지 비율", key: "데미지" },
        { title: "🎯 크리티컬 확률", key: "크리티컬 확률" },
        { title: "🍀 아이템 드롭 확률", key: "아이템 드롭률" },
        { title: "🪙 메소 획득량 계수", key: "메소 획득량" }
    ];

    // 스탯 행들을 차곡차곡 쌓아 올릴 최상위 부모 그리드 박스 태그의 아웃라인 구조를 선언합니다.
    let layoutHtml = `<div class="stat-grid-layout-box" style="display:flex; flex-direction:column; gap:8px; width:100%;">`;
    
    // 루프(for-each)를 돌면서 사전에 지정된 7종 스탯의 데이터를 매칭하여 가독성 높은 UI 로우(Row) 스킨을 합성합니다.
    trackingTargets.forEach(stat => {
        // 위에서 만들어둔 안전 검색 헬퍼 함수를 호출하여 넥슨 패킷 내 실제 수치 텍스트를 파싱해옵니다.
        const val = window.getSafeStatValue(finalStat, stat.key);
        
        // 1:1 대조 정렬 형태의 스타일 속성이 가미된 디바이스 박스 문자열을 연속 누적 결합합니다.
        layoutHtml += `
            <div class="stat-grid-item-row" style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; border:1px solid #e2e8f0; padding:6px 12px; border-radius:8px; font-size: 11.5px;">
                <span style="color: #475569; font-weight: 700;">${stat.title}</span>
                <span style="color: #0f172a; font-weight: 800;">${val}</span>
            </div>
        `;
    });

    // 안전하게 닫는 태그를 붙여 마무리한 뒤 합성 완료된 HTML 스트링 데이터를 최종 리턴합니다.
    layoutHtml += `</div>`;
    return layoutHtml;
};