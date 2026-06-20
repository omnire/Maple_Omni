/**
 * ============================================================================
 * 🐉 MAPLE OMNI - 주간 보스 수익 계산기 (boss.js - 매트 파스텔 프리미엄 에디션)
 * 설명: 상단 그리드형 보스 선택(칸칸칸 티어별 차등화) + 하단 정산 리스트
 * ============================================================================
 */

if (typeof window.myWeeklyBosses === 'undefined') window.myWeeklyBosses = {};

window.initBossPage = function() {
    const container = document.getElementById('bossPageContent');
    if (!container) return;

    container.innerHTML = `
        <div class="boss-container-wrap" style="max-width: 1000px; margin: 0 auto; font-family: 'Pretendard', sans-serif; user-select: none;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <button onclick="backToPortal()" style="padding: 10px 20px; border-radius: 12px; border: 1px solid #e2e8f0; background: white; cursor: pointer; font-weight: 800; color: #64748b; font-size: 12px; transition: all 0.2s;">⬅️ 메인 포탈로</button>
                <h2 style="margin: 0; font-size: 24px; font-weight: 900; color: #1e293b; letter-spacing: -0.5px;">😈 주간 보스 수익 정산소</h2>
                <div style="width: 130px;"></div>
            </div>

            <!-- 1. 보스 선택 구역 (그리드 타일형 개편) -->
            <div class="diary-card" style="padding: 24px; background: white; border-radius: 20px; border: 1px solid #eef2f6; margin-bottom: 25px; box-shadow: 0 4px 18px rgba(0,0,0,0.015);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; font-size: 16px; font-weight: 900; color: #334155;">⚔️ 보스 레이드 목록</h3>
                    <button onclick="window.resetAllBosses()" style="padding: 6px 14px; background: #fff1f2; border: 1px solid #fecdd3; color: #f43f5e; border-radius: 8px; font-size: 11px; font-weight: 800; cursor: pointer; transition: all 0.15s;">전체 초기화 🗑️</button>
                </div>
                
                <div style="font-size: 11px; font-weight: 800; color: #94a3b8; margin-bottom: 10px; letter-spacing: 0.3px; display: flex; align-items: center; gap: 4px;">🔵 주간 하위 보스 <span style="font-weight: 500; color: #cbd5e1;">(검은 마법사 미만)</span></div>
                <div id="gridBelowBlackMage" class="boss-grid" style="margin-bottom: 28px;"></div>
                
                <div style="font-size: 11px; font-weight: 800; color: #ea580c; margin-bottom: 10px; letter-spacing: 0.3px; display: flex; align-items: center; gap: 4px;">🟠 주간 상위 보스 <span style="font-weight: 500; color: #cbd5e1;">(검은 마법사 ~ 찬란한 흥성)</span></div>
                <div id="gridAboveMid" class="boss-grid" style="margin-bottom: 28px;"></div>

                <div style="font-size: 11px; font-weight: 800; color: #e11d48; margin-bottom: 10px; letter-spacing: 0.3px; display: flex; align-items: center; gap: 4px;">🔴 주간 최상위 보스 <span style="font-weight: 500; color: #cbd5e1;">(림보 이상 그랜드 티어)</span></div>
                <div id="gridAboveHigh" class="boss-grid"></div>
            </div>

            <!-- 2. 정산 리스트 구역 -->
            <div class="diary-card" style="padding: 24px; background: white; border-radius: 20px; border: 1px solid #eef2f6; box-shadow: 0 4px 18px rgba(0,0,0,0.015);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #f1f5f9;">
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <h3 style="margin: 0; font-size: 15px; font-weight: 800; color: #64748b;">💰 결정석 총 정산 수익</h3>
                        <div id="totalWeeklyProfit" style="font-size: 24px; font-weight: 900; color: #0284c7; transition: all 0.2s;">0 메소</div>
                    </div>
                    <div style="display: flex; gap: 6px; align-self: flex-end;">
                        <button class="preset-btn" onclick="window.saveBossPreset(1)">💾 1번 저장</button>
                        <button class="preset-btn" onclick="window.loadBossPreset(1)">📂 1번 로드</button>
                    </div>
                </div>
                <div id="selectedBossList" style="display: flex; flex-direction: column; gap: 10px;"></div>
            </div>
        </div>

        <style>
            .boss-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(112px, 1fr)); gap: 8px; }
            
            /* 💡 공통 기본 베이스 칩 스타일 */
            .boss-chip { padding: 10px 0; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; text-align: center; transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid transparent; }
            
            /* 1️⃣ 하위 티어 매트 파스텔 스타일 */
            .boss-chip.tier-low { background: #f1f5f9; color: #475569; }
            .boss-chip.tier-low:hover { background: #e2e8f0; color: #1e293b; }
            .boss-chip.tier-low.active { background: #3b82f6; color: #ffffff; font-weight: 900; box-shadow: 0 4px 12px rgba(59,130,246,0.25); }
            
            /* 2️⃣ 중/상위 티어 매트 파스텔 스타일 */
            .boss-chip.tier-mid { background: #fff7ed; color: #c2410c; }
            .boss-chip.tier-mid:hover { background: #ffedd5; color: #9a3412; }
            .boss-chip.tier-mid.active { background: #f97316; color: #ffffff; font-weight: 900; box-shadow: 0 4px 12px rgba(249,115,22,0.25); }
            
            /* 3️⃣ 최상위 그랜드 티어 매트 파스텔 스타일 */
            .boss-chip.tier-high { background: #fff1f2; color: #be123c; }
            .boss-chip.tier-high:hover { background: #ffe4e6; color: #9f1239; }
            .boss-chip.tier-high.active { background: #f43f5e; color: #ffffff; font-weight: 900; box-shadow: 0 4px 12px rgba(244,63,94,0.25); }

            .diff-box-group { display: flex; gap: 4px; margin-top: 6px; }
            .diff-box { padding: 3px 9px; font-size: 10px; font-weight: 800; border-radius: 6px; border: 1px solid #e2e8f0; color: #94a3b8; cursor: pointer; transition: all 0.1s; background: #fafafa; }
            .diff-box.active { background: #344155; color: #ffffff; border-color: #344155; font-weight: 900; }
            
            .preset-btn { padding: 7px 14px; border: 1px solid #e2e8f0; background: white; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; color: #475569; transition: all 0.15s; }
            .preset-btn:hover { background: #f8fafc; border-color: #cbd5e1; color: #1e293b; }
        </style>
    `;
    window.renderBossPresets();
    window.renderSelectedBossList();
};

window.renderBossPresets = function() {
    if (typeof window.bossData === 'undefined') return setTimeout(window.renderBossPresets, 200);
    const gridBelow = document.getElementById('gridBelowBlackMage');
    const gridAboveMid = document.getElementById('gridAboveMid');
    const gridAboveHigh = document.getElementById('gridAboveHigh');
    if (!gridBelow || !gridAboveMid || !gridAboveHigh) return;
    
    let belowHtml = '', aboveMidHtml = '', aboveHighHtml = '';
    
    window.bossData.forEach(boss => {
        const isSelected = window.myWeeklyBosses[boss.id] !== undefined;
        const activeClass = isSelected ? 'active' : '';
        
        let tierClass = 'tier-low';
        let targetGrid = 'below';

        if (boss.group === 'above') {
            // 검은 마법사부터 찬란한 흥성까지는 중상위 티어 오렌지 처리
            if (['a_seren', 'a_kalos', 'a_karing', 'a_daejeok', 'a_suu_x', 'a_hyung', 'a_black'].includes(boss.id)) {
                tierClass = 'tier-mid';
                targetGrid = 'mid';
            } else {
                // 림보, 발드릭스, 유피테르 등 완전 초 임계점 최상위 보스는 로즈레드 처리
                tierClass = 'tier-high';
                targetGrid = 'high';
            }
        }
        
        const chipHtml = `<div class="boss-chip ${tierClass} ${activeClass}" onclick="window.toggleBossInList('${boss.id}')">${boss.name}</div>`;
        
        if (targetGrid === 'below') belowHtml += chipHtml;
        else if (targetGrid === 'mid') aboveMidHtml += chipHtml;
        else aboveHighHtml += chipHtml;
    });
    
    gridBelow.innerHTML = belowHtml;
    gridAboveMid.innerHTML = aboveMidHtml;
    gridAboveHigh.innerHTML = aboveHighHtml;
};

window.toggleBossInList = function(bossId) {
    if (window.myWeeklyBosses[bossId] !== undefined) delete window.myWeeklyBosses[bossId];
    else window.myWeeklyBosses[bossId] = { selectedDiffIndex: 0, partySize: 1 };
    window.renderBossPresets(); 
    window.renderSelectedBossList(); 
};

window.changeDifficulty = function(bossId, idx) {
    if (window.myWeeklyBosses[bossId]) { 
        window.myWeeklyBosses[bossId].selectedDiffIndex = idx; 
        window.renderSelectedBossList(); 
    }
};

window.updatePartySize = function(bossId, size) {
    if (window.myWeeklyBosses[bossId]) { 
        window.myWeeklyBosses[bossId].partySize = parseInt(size); 
        window.renderSelectedBossList(); 
    }
};

window.resetAllBosses = function() {
    if (Object.keys(window.myWeeklyBosses).length === 0) return;
    if (confirm("모든 보스 정산 내역을 초기화하시겠습니까?")) { 
        window.myWeeklyBosses = {}; 
        window.renderBossPresets(); 
        window.renderSelectedBossList(); 
    }
};

window.formatMesoText = function(num) {
    if (num >= 100000000) return `${Math.floor(num/100000000)}억 ${Math.floor((num%100000000)/10000)}만`;
    return `${num/10000}만`;
};

window.renderSelectedBossList = function() {
    const listArea = document.getElementById('selectedBossList');
    const totalDisplay = document.getElementById('totalWeeklyProfit');
    if (!listArea || !totalDisplay) return;
    
    let total = 0, html = '';
    Object.keys(window.myWeeklyBosses).forEach(id => {
        const b = window.bossData.find(x => x.id === id);
        if (!b) return;
        const my = window.myWeeklyBosses[id];
        const v = b.variants[my.selectedDiffIndex];
        const share = Math.floor(v.price / my.partySize);
        total += share;
        
        html += `
        <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; padding: 14px 16px; border-radius: 12px; border: 1px solid #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
            <div style="flex: 1;">
                <div style="font-weight: 800; font-size: 13.5px; color: #334155; display: flex; align-items: center; gap: 6px;">
                    ${b.name} 
                    <span style="font-weight: 500; font-size: 10.5px; color: #94a3b8;">(원가: ${window.formatMesoText(v.price)})</span>
                </div>
                <div class="diff-box-group">${b.variants.map((variant, i) => `<div class="diff-box ${i === my.selectedDiffIndex ? 'active' : ''}" onclick="window.changeDifficulty('${id}', ${i})">${variant.diff}</div>`).join('')}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 16px;">
                <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">분배</span>
                    <select onchange="window.updatePartySize('${id}', this.value)" style="padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 11px; font-weight: 700; color: #475569; background: #fff; cursor: pointer; outline: none;">
                        ${[1,2,3,4,5,6].map(n => `<option value="${n}" ${n === my.partySize ? 'selected' : ''}>${n}명</option>`).join('')}
                    </select>
                </div>
                <div style="text-align: right; min-width: 100px; border-left: 1px solid #f1f5f9; padding-left: 14px;">
                    <div style="font-size: 9px; color: #cbd5e1; font-weight: 700; tracking-spacing: 0.5px;">개인 수익</div>
                    <div style="font-weight: 900; font-size: 14.5px; color: #1e293b; margin-top: 1px;">${share.toLocaleString()}</div>
                </div>
                <button onclick="window.toggleBossInList('${id}')" style="border: none; background: none; color: #cbd5e1; cursor: pointer; font-size: 14px; padding: 4px; transition: all 0.15s;" onmouseover="this.style.color='#f43f5e'" onmouseout="this.style.color='#cbd5e1'">✕</button>
            </div>
        </div>`;
    });
    
    if (html === '') {
        listArea.innerHTML = `<div style="text-align: center; color: #cbd5e1; font-size: 12px; padding: 40px 0; border: 1px dashed #e2e8f0; border-radius: 12px; background: #fdfdfd;">위에서 보스 카드를 클릭하여 정산표를 구성해 주세요. 🍁</div>`;
    } else {
        listArea.innerHTML = html;
    }
    totalDisplay.innerText = total.toLocaleString() + " 메소";
};

window.saveBossPreset = (num) => { 
    localStorage.setItem('maple_expert_boss_preset_' + num, JSON.stringify(window.myWeeklyBosses)); 
    if (window.showToast) window.showToast(`프리셋 ${num}번 저장 완료!`); 
};

window.loadBossPreset = (num) => {
    const saved = JSON.parse(localStorage.getItem('maple_expert_boss_preset_' + num));
    if (saved) { 
        window.myWeeklyBosses = saved; 
        window.renderBossPresets(); 
        window.renderSelectedBossList(); 
        if (window.showToast) window.showToast(`프리셋 ${num}번을 불러왔습니다!`);
    } else {
        if (window.showAlert) window.showAlert(`저장된 ${num}번 프리셋이 없습니다.`);
    }
};

document.addEventListener('DOMContentLoaded', () => { setTimeout(window.initBossPage, 100); });