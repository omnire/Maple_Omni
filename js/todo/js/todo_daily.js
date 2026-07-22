/**
 * ============================================================================
 * 📑 MAPLE OMNI V14 - js/todo/js/todo_daily.js [☀️ DAILY QUEST]
 * 역할: 각 캐릭터별 그란디스 전역 심볼 일일 퀘스트 및 심볼 동기화 카드 보드판 렌더링
 * 수정사항: 스케줄러 일퀘 체크 시 즉시 상태 보존 및 리페인트 동기화 처리
 * 규칙: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 달아줍니다.
 * ============================================================================
 */

window.renderTodoDailyContent = function() {
    const container = document.getElementById('todo-daily');
    if (!container) return;
    
    // 예외 처리 가드벨트: 스케줄 대상 캐릭터가 없을 때 진입 차단 가이드라인 송출
    if (window.omniTodoState.characters.length === 0) {
        container.innerHTML = `<div class="omni-empty-state">캐릭터를 검색창에 탐색하여 스케줄러 명단에 편입시켜 주십시오.</div>`; 
        return;
    }

    let html = `<div class="omni-character-grid">`;
    
    // 캐릭터 명단 고속 루프 처리를 가동해 개별 컴포넌트 숙제 카드를 슬라이싱 드로잉합니다.
    window.omniTodoState.characters.forEach(char => {
        const data = window.omniTodoState.checkData[char.id] || {};
        let currentMparkCount = data.daily_m_park || 0;
        
        const fallbackImg = window.SAFE_FALLBACK_AVATAR || "";
        const safeCharAvatar = (char.image && !char.image.includes("default.png")) ? char.image : fallbackImg;

        html += `
            <div class="omni-char-card">
                <div class="char-header">
                    <button class="btn-delete-char" onclick="window.removeTodoCharacter(event, '${char.id}')">×</button>
                    <div class="char-avatar-wrapper">
                        <img src="${safeCharAvatar}" class="char-avatar" onerror="this.src='${fallbackImg}';">
                    </div>
                    <div class="char-info">
                        <div class="char-name">${char.name}</div>
                        <div class="char-spec">Lv.${char.level || 280} · ${char.job || '모험가'}</div>
                    </div>
                </div>
                <div class="hw-scroll-list">
                    <!-- 몬스터파크 카운터 클릭 체크 컴포넌트 바인딩 링크 -->
                    <div class="hw-item-row ${currentMparkCount >= 7 ? 'is-done' : ''}" onclick="window.incrementMonsterParkCounter('${char.id}')">
                        <div class="hw-left">
                            <div class="custom-premium-checkbox ${currentMparkCount >= 7 ? 'checked' : ''}">${currentMparkCount >= 7 ? '✓' : ''}</div>
                            <span class="hw-title">몬스터파크</span>
                        </div>
                        <span class="hw-counter">${currentMparkCount} / 7</span>
                    </div>

                    <!-- 🔮 아케인 심볼 구간 -->
                    <div class="hw-section-title">🔮 아케인 심볼</div>
                    ${window.renderHwItem(char.id, 'daily_vanishing', '소멸의 여로', data.daily_vanishing, '완료', '미완료')}
                    ${window.renderHwItem(char.id, 'daily_chuchu', '츄츄 아이랜드', data.daily_chuchu, '완료', '미완료')}
                    ${window.renderHwItem(char.id, 'daily_lachelein', '레헬른', data.daily_lachelein, '완료', '미완료')}
                    ${window.renderHwItem(char.id, 'daily_arcana', '아르카나', data.daily_arcana, '완료', '미완료')}
                    ${window.renderHwItem(char.id, 'daily_morass', '모라스', data.daily_morass, '완료', '미완료')}
                    ${window.renderHwItem(char.id, 'daily_esfera', '에스페라', data.daily_esfera, '완료', '미완료')}

                    <!-- 🛡️ 어센틱 심볼 구간 -->
                    <div class="hw-section-title">🛡️ 어센틱 심볼</div>
                    ${window.renderHwItem(char.id, 'daily_cernium', '세르니움', data.daily_cernium, '완료', '미완료')}
                    ${window.renderHwItem(char.id, 'daily_arcus', '호텔 아르크스', data.daily_arcus, '완료', '미완료')}
                    ${window.renderHwItem(char.id, 'daily_odium', '오디움', data.daily_odium, '완료', '미완료')}
                    ${window.renderHwItem(char.id, 'daily_shangrila', '도원경', data.daily_shangrila, '완료', '미완료')}

                    <!-- ⚡ 그랜드 어센틱 심볼 구간 -->
                    <div class="hw-section-title">⚡ 그랜드 어센틱 심볼</div>
                    ${window.renderHwItem(char.id, 'daily_arteria', '아르테리아', data.daily_arteria, '완료', '미완료')}
                    ${window.renderHwItem(char.id, 'daily_carcion', '카르시온', data.daily_carcion, '완료', '미완료')}
                    ${window.renderHwItem(char.id, 'daily_talhart', '탈라하트', data.daily_talhart, '완료', '미완료')}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html + `</div>`;
};