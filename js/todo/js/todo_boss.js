/**
 * ============================================================================
 * 📑 MAPLE OMNI V14 - js/todo/js/todo_boss.js [😈 BOSS RENDER PANEL]
 * 역할: 다클래스 주간 보스 결정석 순수익 계산 및 등급별 티어 인디케이터 라인 시각 배정
 * 수정사항: 외부 스코프 아바타 변수를 window.SAFE_FALLBACK_AVATAR로 안전하게 바인딩 교정
 * ============================================================================
 */

window.renderTodoBossContent = function() {
    const container = document.getElementById('todo-boss');
    // [초보자 가이드] 출력을 담당할 부모 컨테이너 돔(DOM) 요소가 없다면 실행을 즉시 중단하여 에러를 예방합니다.
    if (!container) return;
    
    // [초보자 가이드] 등록된 캐릭터가 하나도 없을 때 보여줄 빈 화면 예외 처리 구역입니다.
    if (window.omniTodoState.characters.length === 0) {
        container.innerHTML = `${window.renderGlobalTodoSummary()}<div class="omni-empty-state">보스 명단이 비어있습니다.</div>`; 
        return;
    }

    // [초보자 가이드] 상단 대시보드 요약 화면을 먼저 그리고, 캐릭터 카드가 배치될 그리드 레이아웃의 문을 엽니다.
    let html = window.renderGlobalTodoSummary() + `<div class="omni-character-grid">`;
    const prices = window.omniTodoState.bossPrices;

    // 등록된 각 캐릭터 단 단위별로 누적 획득 결정석 상한 총액 연산을 수행합니다.
    window.omniTodoState.characters.forEach(char => {
        const data = window.omniTodoState.checkData[char.id] || {};
        let charMeso = 0;
        
        // 개별 캐릭터 방 내부에서 true 마킹 처리된 레이드 보스 몸값을 합산 가산 처리합니다.
        Object.keys(prices).forEach(key => { 
            if (data[`boss_${key}`] === true) {
                charMeso += prices[key]; 
            }
        });

        // [초보자 가이드] 전역 변수 참조 오류를 차단하기 위해 window 오브젝트의 안전 아바타 경로를 명확히 호출합니다.
        const fallbackImg = window.SAFE_FALLBACK_AVATAR || "";

        html += `
            <div class="omni-char-card" style="min-width:320px;">
                <div class="char-header">
                    <div class="char-avatar-wrapper">
                        <img src="${char.image || fallbackImg}" class="char-avatar" onerror="this.src='${fallbackImg}';">
                    </div>
                    <div class="char-info">
                        <div class="char-name">${char.name}</div>
                        <div class="char-spec" style="color:#6d28d9; font-weight:800;">누적 정산: ${charMeso.toLocaleString()}</div>
                    </div>
                    <button class="btn-delete-char" onclick="window.removeTodoCharacter(event, '${char.id}')">×</button>
                </div>
                <div class="hw-scroll-list" style="max-height:450px; overflow-y:auto; padding-right:4px;">
                    <!-- 1티어 단락: 주간 메이저 보스 라인 조립 코어 구역 -->
                    <div class="boss-tier-indicator-row">⚔️ 검밑솔 ~ 주간 레이드 세분화 라인</div>
                    ${window.renderBossItem(char.id, 'boss_n_suu', '노말 스우 수입', '', data.boss_n_suu, prices.n_suu.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_h_suu', '하드 스우 수입', '', data.boss_h_suu, prices.h_suu.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_n_demian', '노말 데미안 수입', '', data.boss_n_demian, prices.n_demian.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_h_demian', '하드 데미안 수입', '', data.boss_h_demian, prices.h_demian.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_n_gaensl', '노말 가엔슬 수입', '', data.boss_n_gaensl, prices.n_gaensl.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_c_gaensl', '카오스 가엔슬 수입', '', data.boss_c_gaensl, prices.c_gaensl.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_e_lucid', '이지 루시드 수입', '', data.boss_e_lucid, prices.e_lucid.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_n_lucid', '노말 루시드 수입', '', data.boss_n_lucid, prices.n_lucid.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_h_lucid', '하드 루시드 수입', '', data.boss_h_lucid, prices.h_lucid.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_e_will', '이지 윌 수입', '', data.boss_e_will, prices.e_will.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_n_will', '노말 윌 수입', '', data.boss_n_will, prices.n_will.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_h_will', '하드 윌 수입', '', data.boss_h_will, prices.h_will.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_n_dusk', '노말 더스크 수입', '', data.boss_n_dusk, prices.n_dusk.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_c_dusk', '카오스 더스크 수입', '', data.boss_c_dusk, prices.c_dusk.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_n_dunkel', '노말 듄켈 수입', '', data.boss_n_dunkel, prices.n_dunkel.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_h_dunkel', '하드 듄켈 수입', '', data.boss_h_dunkel, prices.h_dunkel.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_n_hilla', '노말 진힐라 수입', '', data.boss_n_hilla, prices.n_hilla.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_h_hilla', '하드 진힐라 수입', '', data.boss_h_hilla, prices.h_hilla.toLocaleString(), '0')}
                    
                    <!-- 2티어 단락: 프리미엄 하이엔드 레이드 배지 특화 구역 -->
                    <div class="boss-tier-indicator-row-high">👑 검윗솔 ~ 최상위 하이엔드 레이드 라인</div>
                    ${window.renderBossItem(char.id, 'boss_b_mage', '검은 마법사', 'HARD', data.boss_b_mage, prices.b_mage.toLocaleString(), '대기')}
                    ${window.renderBossItem(char.id, 'boss_n_seren', '노말 세렌 수입', 'NORMAL', data.boss_n_seren, prices.n_seren.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_h_seren', '하드 세렌 수입', 'HARD', data.boss_h_seren, prices.h_seren.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_e_kalos', '이지 칼로스 수입', 'EASY', data.boss_e_kalos, prices.e_kalos.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_n_kalos', '노말 칼로스 수입', 'NORMAL', data.boss_n_kalos, prices.n_kalos.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_c_kalos', '카오스 칼로스 수입', 'CHAOS', data.boss_c_kalos, prices.c_kalos.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_e_kaling', '이지 카링 수입', 'EASY', data.boss_e_kaling, prices.e_kaling.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_n_kaling', '노말 카링 수입', 'NORMAL', data.boss_n_kaling, prices.n_kaling.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_h_kaling', '하드 카링 수입', 'HARD', data.boss_h_kaling, prices.h_kaling.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_n_limbo', '노말 림보 수입', 'NORMAL', data.boss_n_limbo, prices.n_limbo.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_h_limbo', '하드 림보 수입', 'HARD', data.boss_h_limbo, prices.h_limbo.toLocaleString(), '0')}
                    ${window.renderBossItem(char.id, 'boss_ex_suu', '익스트림 스우', 'EX', data.boss_ex_suu, prices.ex_suu.toLocaleString(), '대기')}
                </div>
            </div>
        `;
    });
    html += `</div>`;
    container.innerHTML = html;
};