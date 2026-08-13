/**
 * ============================================================================
 * 📑 MAPLE OMNI V14 - js/todo/js/todo_boss.js [😈 BOSS RENDER PANEL]
 * 역할: 다클래스 주간 보스 결정석 순수익 계산 및 등급별 티어 인디케이터 라인 시각 배정
 * 규칙: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 달아줍니다.
 * ============================================================================
 */

window.renderTodoBossContent = function() {
    const container = document.getElementById('todo-boss');
    if (!container) return;
    
    if (window.omniTodoState.characters.length === 0) {
        container.innerHTML = `<div class="omni-empty-state">보스 명단이 비어있습니다.</div>`; 
        return;
    }

    let html = `<div class="omni-character-grid">`;
    const prices = window.omniTodoState.bossPrices;

    window.omniTodoState.characters.forEach(char => {
        const data = window.omniTodoState.checkData[char.id] || {};
        let charMeso = 0;
        
        Object.keys(prices).forEach(key => { 
            if (data[`boss_${key}`] === true) {
                charMeso += prices[key]; 
            }
        });

        const fallbackImg = window.SAFE_FALLBACK_AVATAR || "";

        html += `
            <div class="omni-char-card" style="min-width:320px;">
                <div class="char-header">
                    <div class="char-avatar-wrapper">
                        <img src="${char.image || fallbackImg}" class="char-avatar" onerror="this.src='${fallbackImg}';">
                    </div>
                    <div class="char-info">
                        <div class="char-name">${char.name}</div>
                        <div class="char-spec" style="color:#6d28d9; font-weight:800;">누적 정산: ${charMeso.toLocaleString()} Meso</div>
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