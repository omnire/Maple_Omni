/**
 * ============================================================================
 * 📑 MAPLE OMNI V14 - js/todo/js/todo_weekly.js [📦 WEEKLY EPISODIC]
 * 역할: 하이마운틴 및 앵글러 컴퍼니와 같은 주간 최상위 에픽 던전 정산 마스터리 보드
 * 수정사항: 아바타 대체값 널참조 및 default.png 404 방어 가드 보완 완수
 * 규칙: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 달아줍니다.
 * ============================================================================
 */

window.renderTodoWeeklyContent = function() {
    const container = document.getElementById('todo-weekly');
    if (!container) return;
    
    // 예외 에러 세이프티 가드라인
    if (window.omniTodoState.characters.length === 0) {
        container.innerHTML = `<div class="omni-empty-state">캐릭터 카드가 등록되어있지 않습니다.</div>`;
        return;
    }

    let html = `<div class="omni-character-grid">`;
    
    // 주간 대형 어센틱 에픽 콘텐츠 카드 행렬을 반복 드로잉 축적 처리합니다.
    window.omniTodoState.characters.forEach(char => {
        const data = window.omniTodoState.checkData[char.id] || {};
        
        // [초보자 가이드] default.png 404 차단 가드가 적용된 안전 아바타 이미지 주소 지정
        const fallbackImg = window.SAFE_FALLBACK_AVATAR || "";
        const safeCharAvatar = (char.image && !char.image.includes("default.png")) ? char.image : fallbackImg;

        html += `
            <div class="omni-char-card">
                <div class="char-header">
                    <div class="char-avatar-wrapper">
                        <img src="${safeCharAvatar}" class="char-avatar" onerror="this.src='${fallbackImg}';">
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