/**
 * ============================================================================
 * ⚔️ MAPLE OMNI - 통합 기록지 모듈
 * 파일명: features/hunt/hunt-history.js
 * 설명: 임시 기록을 확정(SENT) 지어 달력과 기록지에 영구 보관하는 기능입니다.
 * ============================================================================
 */

// [초보자용 주석] 아직 임시 상태(바구니에 담긴)인 30분 사냥 기록들을 완전 저장합니다.
window.saveFinalRecord = function(idx) {
    const charIdx = parseInt(idx || 1);
    const selectedDate = document.getElementById('huntGlobalDate')?.value || new Date().toISOString().split('T')[0];
    const storageKey = `${charIdx}_${selectedDate}`;

    // 임시 저장된 기록조차 없으면 돌려보냅니다.
    if (!window.subHistory[storageKey] || window.subHistory[storageKey].length === 0) {
        alert("전송할 임시 기록이 없습니다.");
        return;
    }

    // 이미 전송된(isFinalized) 기록을 빼고, 아직 전송 안 한 것들만 추립니다.
    const pendingLogs = window.subHistory[storageKey].filter(r => !r.isFinalized);
    if (pendingLogs.length === 0) {
        alert("이미 모든 기록이 전송되었습니다.");
        return;
    }

    if (!confirm(`${pendingLogs.length}개의 기록을 통합 기록지로 전송하시겠습니까?`)) return;

    let allRecords = JSON.parse(localStorage.getItem('maple_hunt_records') || '[]');

    pendingLogs.forEach(log => {
        // [핵심] 영구 보존용 데이터 패키지 만들기
        const finalRec = {
            charId: idx,
            date: selectedDate,
            timestamp: log.id, 
            map: document.getElementById(`map_${idx}`)?.value || '미지정 사냥터',
            meso: log.meso,
            huntMeso: log.meso,
            exp: log.exp,
            gem: log.gem,
            frag: log.frag,
            sellList: log.sellList || [],
            isFullJaehoek: log.isFullJaehoek === true, 
            isFinalized: true
        };
        allRecords.push(finalRec);
        // 바구니에 있던 원본 데이터에도 '전송 완료' 딱지를 붙여줍니다.
        log.isFinalized = true;
    });

    // 🔥 [핵심 추가] 데이터들을 시간순(timestamp)으로 정렬하여 회차가 꼬이지 않게 합니다.
    allRecords.sort((a, b) => a.timestamp - b.timestamp);

    localStorage.setItem('maple_hunt_records', JSON.stringify(allRecords));
    localStorage.setItem('omni_sub_history', JSON.stringify(window.subHistory));

    // 화면 갱신
    if (typeof window.renderSubRecords === 'function') window.renderSubRecords(idx);
    if (typeof window.renderHistory === 'function') window.renderHistory();
    if (typeof window.updateAll === 'function') window.updateAll(idx);

    alert("통합 기록지로 전송 완료되었습니다!");
};