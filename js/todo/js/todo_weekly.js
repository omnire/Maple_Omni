/**
 * ============================================================================
 * 📑 MAPLE OMNI V14 - js/todo/js/todo_weekly.js [📦 WEEKLY EPISODIC]
 * 역할: 하이마운틴 및 앵글러 컴퍼니와 같은 주간 최상위 에픽 던전 정산 마스터리 보드
 * 수정사항: 아바타 대체값 널참조 가드를 window 시스템 전역 변수로 세이프티 이식 완료
 * ============================================================================
 */

window.renderTodoWeeklyContent = function() {
    const container = document.getElementById('todo-weekly');
    if (!container) return;
    
    // 예외 에러 세이프티 가드라인
    if (window.omniTodoState.characters.length === 0) {
        container.innerHTML = `${window.renderGlobalTodoSummary()}<div class="omni-empty-state">캐릭터 카드가 등록되어있지 않습니다.</div>`;
        return;
    }

    let html = window.renderGlobalTodoSummary() + `<div class="omni-character-grid">`;
    
    // 주간 대형 어센틱 에픽 콘텐츠 카드 행렬을 반복 드로잉 축적 처리합니다.
    window.omniTodoState.characters.forEach(char => {
        const data = window.omniTodoState.checkData[char.id] || {};
        
        // [초보자 가이드] 분리된 파일 구조상 전역에 안착한 투두 공통 백색 마스크 이미지를 안전하게 로드합니다.
        const fallbackImg = window.SAFE_FALLBACK_AVATAR || "";

        html += `
            <div class="omni-char-card">
                <div class="char-header">
                    <div class="char-avatar-wrapper">
                        <img src="${char.image || fallbackImg}" class="char-avatar" onerror="this.src='${fallbackImg}';">
                    </div>
                    <div class="char-info"><div class="char-name">${char.name}</div></div>
                    <button class="btn-delete-char" onclick="window.removeTodoCharacter(event, '${char.id}')">×</button>
                </div>
                <div class="hw-scroll-list">
                    <!-- 하이마운틴 및 앵글러 컴퍼니 클리어 플래그 동기화 행 주입 -->
                    ${window.renderHwItem(char.id, 'weekly_mountain', '에픽 던전 : 하이마운틴', data.weekly_mountain, '완료', '대기')}
                    ${window.renderHwItem(char.id, 'weekly_angeler', '에픽 던전 : 앵글러 컴퍼니', data.weekly_angeler, '완료', '대기')}
                </div>
            </div>
        `;
    });
    container.innerHTML = html + `</div>`;
};