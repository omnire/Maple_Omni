/**
 * ============================================================================
 * 📑 MAPLE OMNI V14 - js/todo/js/todo_daily.js [☀️ DAILY QUEST]
 * 역할: 각 캐릭터별 그란디스 전역 심볼 일일 퀘스트 및 심볼 동기화 카드 보드판 렌더링
 * 수정사항: 스코프 에러 원천 방지를 위해 SAFE_FALLBACK_AVATAR 호출 규격을 전역 스케일로 정합화
 * ============================================================================
 */

window.renderTodoDailyContent = function() {
    const container = document.getElementById('todo-daily');
    if (!container) return;
    
    // 예외 처리 가드벨트: 스케줄 대상 캐릭터가 없을 때 진입 차단 가이드라인 송출
    if (window.omniTodoState.characters.length === 0) {
        container.innerHTML = `${window.renderGlobalTodoSummary()}<div class="omni-empty-state">캐릭터를 검색창에 탐색하여 스케줄러 명단에 편입시켜 주십시오.</div>`; 
        return;
    }

    let html = window.renderGlobalTodoSummary() + `<div class="omni-character-grid">`;
    
    // 캐릭터 명단 고속 루프 처리를 가동해 개별 컴포넌트 숙제 카드를 슬라이싱 드로잉합니다.
    window.omniTodoState.characters.forEach(char => {
        const data = window.omniTodoState.checkData[char.id] || {};
        let currentMparkCount = data.daily_m_park || 0;
        
        // [초보자 가이드] 다른 파일과의 통일성을 유지하면서 전역 안전 이미지 경로를 확보합니다.
        const fallbackImg = window.SAFE_FALLBACK_AVATAR || "";

        html += `
            <div class="omni-char-card">
                <div class="char-header">
                    <div class="char-avatar-wrapper">
                        <img src="${char.image || fallbackImg}" class="char-avatar" onerror="this.src='${fallbackImg}';">
                    </div>
                    <div class="char-info">
                        <div class="char-name">${char.name}</div>
                        <div class="char-spec">Lv.${char.level || 280} · ${char.job || '모험가'}</div>
                    </div>
                    <button class="btn-delete-char" onclick="window.removeTodoCharacter(event, '${char.id}')">×</button>
                </div>
                <div class="hw-scroll-list">
                    <!-- 몬스터파크 카운터 클릭 체크 컴포넌트 바인딩 링크 -->
                    <div class="hw-item-row ${currentMparkCount >= 7 ? 'is-done' : ''}" onclick="window.incrementMonsterParkCounter('${char.id}')">
                        <div class="hw-left">
                            <div class="custom-premium-checkbox ${currentMparkCount >= 7 ? 'checked' : ''}">${currentMparkCount >= 7 ? '✓' : ''}</div>
                            <span class="hw-title">몬스터파크 (클릭 시 횟수 증가)</span>
                        </div>
                        <span class="hw-counter">${currentMparkCount} / 7 회</span>
                    </div>
                    <!-- 코어에 위임된 일퀘 매핑 헬퍼 함수를 통한 심볼 콘텐츠 행들 순차 조립 -->
                    ${window.renderHwItem(char.id, 'daily_cernium', '세르니움 조사', data.daily_cernium, '완료', '미완료')}
                    ${window.renderHwItem(char.id, 'daily_arcus', '호텔 아르크스 청소', data.daily_arcus, '완료', '미완료')}
                    ${window.renderHwItem(char.id, 'daily_odium', '오디움 일대 탐사', data.daily_odium, '완료', '미완료')}
                    ${window.renderHwItem(char.id, 'daily_shangrila', '도원경 오염 정화', data.daily_shangrila, '완료', '미완료')}
                    ${window.renderHwItem(char.id, 'daily_arteria', '아르테리아 잔당 처치', data.daily_arteria, '완료', '미완료')}
                    ${window.renderHwItem(char.id, 'daily_carcion', '카르시온 복구 지원', data.daily_carcion, '완료', '미완료')}
                    ${window.renderHwItem(char.id, 'daily_talhart', '탈라하트 조사', data.daily_talhart, '완료', '미완료')}
                </div>
            </div>
        `;
    });
    
    // 열려있던 하우징 그리드 단락 마크업을 결착 종결합니다.
    container.innerHTML = html + `</div>`;
};