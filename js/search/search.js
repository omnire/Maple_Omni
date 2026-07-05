/**
 * ============================================================================
 * 👤 MAPLE OMNI - js/search/search.js [5:5 BALANCED CENTER GRID SYSTEM]
 * 설명: 장비 명세 세로형 정렬 및 5:5 분할 비율 우측 보스 레이드 진단기 마스터엔진
 * 가이드: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 달아줍니다.
 * ============================================================================
 */

// 💡 [초보자 가이드] UI 전반에 투입되는 연동 색상표 및 그림자 유닛 설정 객체입니다.
const SEARCH_UI = {
    card: "background: #ffffff; border-radius: 20px; padding: 24px; border: 1px solid rgba(15, 23, 42, 0.04); box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.02);",
    pointColor: "#7c3aed", 
    grayText: "#475569",
    mainText: "#0f172a"
};

/**
 * 💡 [초보자 가이드] 화면 구조 정합성을 훼손하는 잔여 구형 탑 메뉴 노드를 DOM 트리에서 완전히 제거합니다.
 */
function removeLegacyTopMenu() {
    const legacyMenu = document.querySelector('#page-search .sub-tab-menu');
    if (legacyMenu) {
        legacyMenu.style.display = 'none';
        legacyMenu.remove();
    }
}

/**
 * 💡 [초보자 가이드] 구형 탭 레이아웃에서 인입되는 인자를 내부 제어 인터페이스 분기점으로 연결해주는 가교 매퍼입니다.
 */
window.switchSearchTab = function(tabName) {
    if (tabName === 'basic') window.switchSearchInternalTab('내실');
    else if (tabName === 'skill') window.switchSearchInternalTab('헥사/스킬');
    else if (tabName === 'union') window.switchSearchInternalTab('유니온');
};

/**
 * 💡 [초보자 가이드] 최초 대시보드가 구동되기 전, 사용자가 마주할 탐색 컨트롤러와 플레이스홀더를 초기화하는 마스터 렌더러입니다.
 */
window.renderFullSearchPage = function() {
    const container = document.getElementById('search-basic');
    if (!container) return; 
    
    removeLegacyTopMenu();
    setTimeout(removeLegacyTopMenu, 20);
    
    container.innerHTML = `
        <div style="width: 100%; display: flex; flex-direction: column; gap: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border-radius: 16px; padding: 16px 24px; border: 1px solid rgba(15, 23, 42, 0.04);">
                <div style="display: flex; gap: 10px;">
                    <button id="refreshBtn" onclick="const nameEl = document.getElementById('res_profileName'); if(nameEl && typeof window.startOmniSearch === 'function') { window.startOmniSearch(nameEl.innerText.trim()); } else { alert('조회된 대상 캐릭터가 없습니다.'); }" 
                        style="background: #fafbfe; color: #7c3aed; border: 1px solid #decffd; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 800; transition: 0.2s;">
                        🔄 실시간 라이브 파싱 갱신
                    </button>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <div style="display: flex; align-items: center; width: 300px; border-radius: 10px; border: 1px solid #cbd5e1; background: #f8fafc; overflow: hidden;">
                        <input type="text" id="inlineSearchInput" placeholder="캐릭터명 입력 후 엔터..." style="flex: 1; border: none; outline: none; padding: 8px 14px; font-size: 13px; font-weight: 700; color: #0f172a; background: transparent;">
                        <button onclick="window.executeInlineSearch()" style="padding: 8px 16px; background: #7c3aed; color: white; border: none; cursor: pointer; font-weight: 800; font-size: 12px;">조회</button>
                    </div>
                    <div id="recentSearchList" style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; min-height: 20px;"></div>
                </div>
            </div>

            <div id="charDetailContainer" style="width: 100%;">
                <div id="searchPlaceholder" style="text-align: center; padding: 120px 0; color: #94a3b8; font-weight: 800; font-size: 14px; background: #ffffff; border-radius: 20px; border: 1px dashed #cbd5e1;">
                    🔍 캐릭터 이름을 입력하시면 프리미엄 통계 분석 대시보드가 로드됩니다.
                </div>
            </div>
        </div>
    `;
    window.renderRecentSearchesMain();
};

/**
 * 💡 [메인 핵심 렌더러 함수] 수신된 데이터를 바탕으로 프리미엄 3열 대통합 인프라 레이아웃을 생성합니다.
 */
window.renderSearchDetail = function(basic, stat, item, ability, symbol, dojang, union, ranking, link_skill, hexa_skill, skill, hexa_stat) {
    const container = document.getElementById('charDetailContainer');
    if (!container) return; 

    if (!basic || !basic.character_name) {
        container.innerHTML = `<div style="text-align: center; padding: 80px 0; color: #64748b; font-weight: 800; font-size: 14px; background: #ffffff; border-radius: 20px;">⏳ 넥슨 OpenAPI로부터 보안 암호화 테이블을 수신 중입니다...</div>`;
        return;
    }

    removeLegacyTopMenu();
    window.saveRecentSearch(basic.character_name);
    window.currentSearchData = { basic, stat, item, ability, symbol, dojang, union, ranking, link_skill, hexa_skill, skill, hexa_stat };

    const power = stat?.final_stat?.find(s => s.stat_name === "전투력")?.stat_value || "0";
    const mainStat = stat?.final_stat?.find(s => s.stat_name === "주스탯")?.stat_value || "-";
    const tabs = ['내실', '유니온', '헥사/스킬', '업적', '부캐'];

    container.style.display = 'block';
    
    container.innerHTML = `
        <div style="width: 100%; display: flex; flex-direction: column; gap: 20px;">
            
            <div style="background: #ffffff; border-radius: 20px; padding: 26px; border: 1px solid rgba(15, 23, 42, 0.04); display: flex; align-items: center; gap: 24px;">
                <div style="width: 90px; height: 90px; background: #f8fafc; border-radius: 16px; overflow:hidden; flex-shrink: 0; border: 1px solid #e2e8f0; display:flex; align-items:center; justify-content:center;">
                    <img src="${basic.character_image || ''}" style="width:300%; height:300%; object-fit:contain; object-position: 50% 80%;">
                </div>
                <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 6px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <h3 id="res_profileName" style="margin: 0; font-size: 19px; font-weight: 900; color: #0f172a;">${basic.character_name}</h3>
                        <span style="font-size: 10.5px; color: #7c3aed; font-weight: 800; background: #f3f0ff; padding: 2px 8px; border-radius: 6px;">🍀 아획/메획 실시간 동기화 완료</span>
                    </div>
                    <div style="font-size: 13px; font-weight: 700; color: #475569; text-align:left;">
                        월드: ${basic.world_name} | 레벨: ${basic.character_level} | 직업군: ${basic.character_class} | 길드: ${basic.character_guild_name || '미가입'}
                    </div>
                    <div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: center; border-top: 1px dashed #e2e8f0; padding-top: 10px; margin-top: 4px;">
                        ${[
                            {l:'전투력', v: Number(power).toLocaleString(), c: '#7c3aed'},
                            {l:'주스탯', v: mainStat},
                            {l:'유니온', v: (union?.union_level) ? union.union_level : '-'},
                            {l:'무릉', v: (dojang?.dojang_best_floor) ? dojang.dojang_best_floor + '층' : '-'}
                        ].map(itm => `
                            <div style="display: flex; align-items: baseline; gap: 4px;">
                                <span style="font-size: 10.5px; color: #64748b; font-weight: 800;">${itm.l}</span>
                                <span style="font-size: 12.5px; font-weight: 900; color: ${itm.c || '#0f172a'};">${itm.v}</span>
                            </div>
                         `).join('')}
                    </div>
                </div>
            </div>

            <div style="display: flex; gap: 6px; background: #ffffff; padding: 6px; border-radius: 12px; border: 1px solid rgba(15, 23, 42, 0.04);">
                ${tabs.map(tab => `<button class="search-tab-trigger-btn" onclick="window.switchSearchInternalTab('${tab}')" style="padding: 8px 20px; border:none; background:transparent; border-radius:8px; font-weight:800; cursor:pointer; font-size:12.5px; color:#475569; transition:all 0.2s;">${tab}</button>`).join('')}
            </div>
            
            <div id="searchTabContentContainer" style="margin-bottom: 4px; display: none; width:100%;"></div>

            <!-- 📊 [거시적 3열 대통합 인프라 프레임 정렬 메인 격자선] -->
            <div id="searchMainGridContent" style="display: grid; grid-template-columns: 240px 1fr 290px; gap: 20px; align-items: start; width: 100%; box-sizing: border-box;">
                
                <!-- 🟥 [1열 - 좌측]: 장비 슬롯 레이아웃 그리드 및 코어 심볼 관리 구역 -->
                <div style="display: flex; flex-direction: column; gap: 20px; min-width: 0;">
                    <div style="${SEARCH_UI.card}; padding: 16px;">
                        <h4 style="margin: 0 0 14px 0; font-size: 12.5px; font-weight: 900; color: #0f172a; text-align:left;">⚔️ 착용 슬롯 레이아웃</h4>
                        <div id="res_equip_slot_grid" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px;"></div>
                    </div>
                    <div style="${SEARCH_UI.card}; padding: 16px;">
                        <h4 style="margin: 0 0 14px 0; font-size: 12.5px; font-weight: 900; color: #0f172a; text-align:left;">✨ 어센틱/아케인 심볼 현황</h4>
                        <div id="res_symbol_info"></div>
                    </div>
                </div>
                
                <!-- 🟩 [2열 - 중앙]: 상단 요약 바 정착 및 하단 5:5 완벽 수평 균형 정렬 트랙 -->
                <div style="display: flex; flex-direction: column; gap: 20px; min-width: 0;">
                    <div style="${SEARCH_UI.card}; padding: 20px; background: #fafbfe; border: 1px solid #e0e7ff;">
                        <h4 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 900; color: #1e1b4b; text-align:left;">📊 프리셋 옵션 정산 요약</h4>
                        <div id="res_gear_total_summary"></div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; width: 100%; box-sizing: border-box;">
                        <!-- [중앙-좌측]: 장비 세부 명세 창 -->
                        <div style="${SEARCH_UI.card}; padding: 20px; display: flex; flex-direction: column; min-width: 0;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-shrink: 0;">
                                <h4 style="margin: 0; font-size: 13.5px; font-weight: 900; color:#0f172a;">🎒 장비 세부 명세</h4>
                                <div id="itemPresetBtns" style="display: flex; gap: 4px; background: #f1f5f9; padding: 3px; border-radius: 6px;">
                                    ${[1,2,3].map(n => `<button class="preset-toggle-btn" onclick="window.switchItemPreset(${n})" style="padding: 3px 10px; font-size:11px; border:none; border-radius:4px; cursor:pointer; font-weight:800; background:transparent; color:#475569;">${n}번</button>`).join('')}
                                </div>
                            </div>
                            <div id="res_itemGrid" style="max-height: 560px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding-right: 2px;"></div>
                        </div>

                        <!-- [중앙-우측]: 실시간 보드 기반 레이드 진입 컷 분석 및 스펙 진단기 -->
                        <div style="${SEARCH_UI.card}; padding: 20px; display: flex; flex-direction: column; min-width: 0;">
                            <h4 style="margin: 0 0 16px 0; font-size: 13.5px; font-weight: 900; color: #0f172a; text-align:left;">👑 보스 레이드 매칭 & 스펙 진단기</h4>
                            <div id="res_boss_spec_analyzer" style="max-height: 560px; overflow-y: auto; padding-right: 2px;"></div>
                        </div>
                    </div>
                </div>

                <!-- 🟨 [3열 - 우측]: 세부 관제창, 실시간 레전드리 어빌리티, 워크스페이스 즐겨찾기 기둥 -->
                <div style="display: flex; flex-direction: column; gap: 20px; min-width: 0;">
                    <div style="${SEARCH_UI.card}; padding: 20px; max-height: 250px; display: flex; flex-direction: column;">
                        <h4 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 900; color: #0f172a; text-align:left;">📊 캐릭터 세부 스탯 관제창</h4>
                        <div id="res_detailed_spec_window" class="omni-spec-scroll-area" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 5px; padding-right: 4px;"></div>
                    </div>
                    <div style="${SEARCH_UI.card}; padding: 20px;">
                        <h4 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 900; color: #0f172a; text-align:left;">🧬 레전드리 어빌리티</h4>
                        <div id="res_equip_ability"></div>
                    </div>
                    <div style="${SEARCH_UI.card}; padding: 20px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                            <h4 style="margin:0; font-size: 13px; font-weight: 900; color: #0f172a; text-align:left;">⭐ 워크스페이스 즐겨찾기</h4>
                            <button type="button" id="btn_favorite" onclick="window.toggleFavorite()" style="background: #ffffff; border: 1px solid #cbd5e1; padding: 3px 8px; border-radius: 4px; cursor: pointer; font-size: 10.5px; font-weight: 800; color: #475569;">⭐ 등록</button>
                        </div>
                        <div id="favoriteListContainer"></div>
                    </div>
                </div>

            </div>
        </div>
    `;
    
    try {
        window.switchItemPreset(1);       
        window.renderFavorites();         
        window.renderRecentSearchesMain();
        window.renderSymbols(symbol);     
        window.updateFavoriteBtnState(basic.character_name); 
        window.renderSideDetailedStats(stat?.final_stat);
        window.switchSearchInternalTab('내실'); 
    } catch (e) { 
        console.error("Internal Component Drawing Error:", e);
    }
};

window.renderSideDetailedStats = function(finalStatList) {
    const specContainer = document.getElementById('res_detailed_spec_window');
    if (!specContainer) return;

    if (!Array.isArray(finalStatList) || finalStatList.length === 0) {
        specContainer.innerHTML = `<div style="font-size:11px; color:#94a3b8; text-align:center; padding:20px 0;">스탯 정보를 불러올 수 없습니다.</div>`;
        return;
    }

    const focusStats = ["스탯 공격력", "데미지", "보스 몬스터 데미지", "방어율 무시", "크리티컬 확률", "크리티컬 데미지", "재사용대기시간 감소 (%)", "아이템 드롭률", "메소 획득량"];

    let html = "";
    focusStats.forEach(targetName => {
        const match = finalStatList.find(s => s.stat_name === targetName);
        if (match) {
            let valueStr = match.stat_value;
            if (targetName === "스탯 공격력") {
                valueStr = Number(valueStr).toLocaleString();
            } else if (!valueStr.includes('%') && !isNaN(valueStr)) {
                valueStr = (targetName.includes('개수') || targetName.includes('레벨')) ? valueStr : valueStr + "%";
            }
            
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 6px 10px; border-radius: 6px; border: 1px solid #f1f5f9;">
                    <span style="font-size: 11px; font-weight: 800; color: #475569;">${targetName.replace(" 몬스터 ", " ")}</span>
                    <span style="font-size: 11.5px; font-weight: 900; color: #0f172a;">${valueStr}</span>
                </div>
            `;
        }
    });

    specContainer.innerHTML = html;
};

window.renderDynamicBossAndSpecAdvisor = function(totalStarforce, legendCount, uniqueCount, epicCount) {
    const targetBox = document.getElementById('res_boss_spec_analyzer');
    if (!targetBox) return;

    let numericPower = 37962118; 
    const originalPowerStr = window.currentSearchData?.stat?.final_stat?.find(s => s.stat_name === "전투력")?.stat_value;
    if (originalPowerStr && !isNaN(originalPowerStr)) {
        numericPower = Number(originalPowerStr);
    }

    const bossList = [
        { name: "검은 마법사 (파티)", cut: 65000000 },
        { name: "하드 세렌 / 진 힐라", cut: 50000000 },
        { name: "하드 루시드 / 윌", cut: 30000000 },
        { name: "노멀 루시드 / 윌 / 하드스우", cut: 18000000 },
        { name: "노멀 가엔슬 / 이지 루시드", cut: 8000000 }
    ];

    let bossHtml = `<div style="display:flex; flex-direction:column; gap:5px; margin-bottom:14px;">`;
    bossList.forEach(b => {
        let statusBadge = "";
        if (numericPower >= b.cut) {
            statusBadge = `<span style="font-size:9.5px; font-weight:900; color:#16a34a; background:#dcfce7; padding:2px 6px; border-radius:4px; border:1px solid #bbf7d0;">🟢 안정 클리어</span>`;
        } else if (numericPower >= b.cut * 0.75) {
            statusBadge = `<span style="font-size:9.5px; font-weight:900; color:#d97706; background:#fef3c7; padding:2px 6px; border-radius:4px; border:1px solid #fde68a;">🟡 최소 컷 도전</span>`;
        } else {
            statusBadge = `<span style="font-size:9.5px; font-weight:900; color:#dc2626; background:#fee2e2; padding:2px 6px; border-radius:4px; border:1px solid #fecaca;">🔴 스펙업 필요</span>`;
        }

        bossHtml += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.01);">
                <span style="font-size: 11.5px; font-weight: 800; color: #1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:140px;">${b.name}</span>
                ${statusBadge}
            </div>
        `;
    });
    bossHtml += `</div>`;

    let adviceText = "현재 장비 밸런스가 고르게 정돈되어 있습니다. ";
    if (epicCount > 0) {
        adviceText = `현재 프리셋에 에픽 등급 장비가 <span style="color:#7c3aed; font-weight:900;">${epicCount}개</span> 포착되었습니다. 주스탯 % 효율 향상을 위해 에픽 부위의 유니크 등급업 전환을 최우선적으로 권장합니다.`;
    } else if (totalStarforce < 300) {
        adviceText = `잠재능력 대비 순수 스타포스 총합(<span style="color:#f59e0b; font-weight:900;">★${totalStarforce}</span>)이 소폭 정체되어 있습니다. 확정적 전투력 지표 상승을 위해 17성 부위의 18성 확정 강화를 추천해 드립니다.`;
    } else {
        adviceText = "전반적인 부위가 최고 등급 안정권에 근접했습니다. 에디셔널 잠재능력 세부 한 줄 최적화 혹은 V-블록 성장을 병행하는 단계를 지향해 보세요.";
    }

    targetBox.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; box-sizing: border-box;">
                <span style="font-size:11px; font-weight:900; color:#475569; display:block; margin-bottom:8px; text-align:left;">🎯 실시간 전투력 기반 레이드 진입 지표</span>
                ${bossHtml}
            </div>
            <div style="background: #fdfbf7; border: 1px solid #fef3c7; border-radius: 12px; padding: 14px; text-align: left; box-sizing: border-box;">
                <span style="font-size:11.5px; font-weight:900; color:#b45309; display:flex; align-items:center; gap:4px; margin-bottom:6px;">🛠️ 스펙업 최우선 권장 리포트</span>
                <p style="margin:0; font-size:11px; color:#475569; font-weight:700; line-height:1.6; word-break:keep-all;">
                    ${adviceText}
                </p>
            </div>
        </div>
    `;
};

window.switchItemPreset = function(num) {
    document.querySelectorAll('#itemPresetBtns .preset-toggle-btn').forEach((btn, i) => { 
        if (i + 1 === num) {
            btn.style.background = '#ffffff'; btn.style.color = '#0f172a'; btn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
        } else {
            btn.style.background = 'transparent'; btn.style.color = '#475569'; btn.style.boxShadow = 'none';
        }
    });

    const data = window.currentSearchData;
    if (!data || !data.item) return;
    const itemData = data.item;
    let presetData = itemData[`item_equipment_preset_${num}`];
    let equipList = (presetData && presetData.length > 0) ? presetData : (itemData.item_equipment || []);
    
    const listGrid = document.getElementById('res_itemGrid');
    const slotBox = document.getElementById('res_equip_slot_grid'); 
    const borderGradeColor = { "레전드리": "#22c55e", "유니크": "#f59e0b", "에픽": "#a855f7", "레어": "#0ea5e9" };
    const gradeColor = { "레전드리": "#15803d", "유니크": "#b45309", "에픽": "#6b21a8", "레어": "#0369a1" };
    
    const slotOrder = [
        "반지1", "눈장식", null, "모자", "망토",
        "반지2", "얼굴장식", null, "상의", "장갑",
        "반지3", "귀고리", null, "하의", "신발",
        "반지4", "펜던트1", null, "어깨장식", "훈장",
        "벨트", "펜던트2", null, "안드로이드", "기계 심장",
        "포켓 아이템", "무기", "보조무기", "엠블렘", "뱃지"
    ];
    
    const shortPot = (txt) => { 
        if (!txt) return ""; 
        return txt.replace("보스 몬스터 공격 시 데미지", "보공").replace("보스 몬스터 데미지", "보공").replace("몬스터 방어율 무시", "방무").replace("크리티컬 데미지", "크뎀").replace("아이템 드롭률", "아획").replace("메소 획득량", "메획").replace("최대 HP", "HP"); 
    };

    let totalStarforce = 0;
    let legendCount = 0;
    let uniqueCount = 0;
    let epicCount = 0;

    if (slotBox) {
        let gHtml = ""; 
        slotOrder.forEach(sName => {
            if (sName) {
                let itemMatch = equipList.find(eq => eq.item_equipment_slot === sName || (sName === "상의" && eq.item_equipment_slot === "한벌옷") || (sName === "펜던트1" && eq.item_equipment_slot === "펜던트") || (sName === "뱃지" && eq.item_equipment_slot === "배지"));
                if (itemMatch) { 
                    let bColor = borderGradeColor[itemMatch.potential_option_grade] || "#cbd5e1"; 
                    gHtml += `<div style="background:#ffffff; border-radius:6px; border:1.5px solid ${bColor}; display:flex; align-items:center; justify-content:center; aspect-ratio:1/1; overflow:hidden;"><img src="${itemMatch.item_icon}" style="width:85%; height:85%; object-fit:contain;"></div>`; 
                } else { 
                    let shortName = sName.length > 3 ? sName.substring(0, 2) : sName;
                    gHtml += `<div style="background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; aspect-ratio:1/1;"><span style="font-size:8.5px; color:#94a3b8; font-weight:800;">${shortName}</span></div>`; 
                }
            } else {
                gHtml += `<div style="background:transparent; aspect-ratio:1/1;"></div>`;
            }
        });
        slotBox.innerHTML = gHtml;
    }

    if (listGrid) {
        if (equipList.length === 0) {
            listGrid.innerHTML = '<div style="font-size:12px; color:#94a3b8; padding:30px 0; font-weight:700;">장착 장비 리스트 명세가 비어 있습니다.</div>';
            return;
        }
        
        let listHtml = "";
        equipList.forEach(itemInfo => {
            let sf = parseInt(itemInfo.starforce) || 0;
            totalStarforce += sf;

            if(itemInfo.potential_option_grade === "레전드리") legendCount++;
            else if(itemInfo.potential_option_grade === "유니크") uniqueCount++;
            else if(itemInfo.potential_option_grade === "에픽") epicCount++;

            let bColor = borderGradeColor[itemInfo.potential_option_grade] || "#cbd5e1";
            let starHtml = (sf > 0) ? `<span style="color:#f59e0b; font-size:10.5px; font-weight:900; margin-left:4px;">★${sf}</span>` : '';
            let potStr = "";
            const renderOptions = (grade, opt1, opt2, opt3) => { 
                if (!grade) return ""; 
                let options = [opt1, opt2, opt3].filter(Boolean).map(shortPot).join('/'); 
                let color = gradeColor[grade] || "#475569"; 
                return `<div style="color:${color}; font-size:9.5px; font-weight:700; margin-top:2px; text-align:left;"><span style="font-size:8px; background:#f8fafc; padding:0px 2px; border-radius:3px; margin-right:3px; border:1px solid ${color}33;">${grade.charAt(0)}</span>${options}</div>`; 
            };
            potStr += renderOptions(itemInfo.potential_option_grade, itemInfo.potential_option_1, itemInfo.potential_option_2, itemInfo.potential_option_3);
            potStr += renderOptions(itemInfo.additional_potential_option_grade, itemInfo.additional_potential_option_1, itemInfo.additional_potential_option_2, itemInfo.additional_potential_option_3);
            
            listHtml += `
            <div style="background:#ffffff; border:1px solid ${bColor}; border-radius:10px; padding:8px 12px; display:flex; align-items:center; gap:10px; box-shadow:0 1px 3px rgba(0,0,0,0.01); box-sizing:border-box; width:100%; min-width:0; flex-shrink:0;">
                <div style="width:32px; height:32px; flex-shrink:0; background:#f8fafc; border-radius:8px; display:flex; align-items:center; justify-content:center; border:1px solid #e2e8f0; overflow:hidden;">
                    <img src="${itemInfo.item_icon}" style="max-width:90%; max-height:90%; object-fit:contain;">
                </div>
                <div style="flex:1; min-width:0; text-align:left;">
                    <div style="font-weight:800; font-size:11px; color:#0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${itemInfo.item_name}${starHtml}</div>
                    ${potStr}
                </div>
            </div>`;
        });
        listGrid.innerHTML = listHtml;
    }

    const summaryBox = document.getElementById('res_gear_total_summary');
    if (summaryBox) {
        summaryBox.innerHTML = `
            <div style="display:grid; grid-template-columns:1fr 1.5fr; gap:12px;">
                <div style="background:white; border:1px solid #e2e8f0; padding:8px 12px; border-radius:8px; text-align:left;">
                    <span style="font-size:10.5px; font-weight:800; color:#475569; display:block; margin-bottom:2px;">★ 스타포스 총합</span>
                    <span style="font-size:14px; font-weight:900; color:#f97316;">★ ${totalStarforce}개</span>
                </div>
                <div style="background:white; border:1px solid #e2e8f0; padding:8px 12px; border-radius:8px; text-align:left; display:flex; gap:12px; align-items:center;">
                    <div>
                        <span style="font-size:10.5px; font-weight:800; color:#475569; display:block; margin-bottom:2px;">🧬 윗잠 등급 분포</span>
                        <div style="display:flex; gap:8px; font-size:10px; font-weight:800; margin-top:2px;">
                            <span style="color:#15803d;">레전 ${legendCount}</span>
                            <span style="color:#b45309;">유니 ${uniqueCount}</span>
                            <span style="color:#6b21a8;">에픽 ${epicCount}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    window.renderDynamicBossAndSpecAdvisor(totalStarforce, legendCount, uniqueCount, epicCount);
    window.switchAbilityPreset(num);
};

window.switchAbilityPreset = function(num) {
    const data = window.currentSearchData;
    if (!data || !data.ability) return;
    const abiData = data.ability;
    let presetData = abiData[`ability_preset_${num}`];
    let targetPreset = (presetData && presetData.ability_info && presetData.ability_info.length > 0) ? presetData : abiData; 
    const abiList = document.getElementById('res_equip_ability');
    if (!abiList) return;
    
    const fame = abiData.remain_fame ? Number(abiData.remain_fame).toLocaleString() : '0';
    let html = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px dashed #e2e8f0; padding-bottom:6px;"><span style="color:#475569; font-size:11px; font-weight:800;">보유 명성치</span><span style="color:#0f172a; font-size:12px; font-weight:900;">${fame}</span></div>`;
    
    if (targetPreset.ability_info) {
        html += targetPreset.ability_info.map(a => {
            let color = "#475569"; 
            if(a.ability_grade === "레전드리") color = "#15803d"; 
            else if(a.ability_grade === "유니크") color = "#b45309"; 
            return `<div style="display:flex; align-items:center; gap:6px; margin-bottom:4px; background:#f8fafc; padding:6px 10px; border-radius:6px; border:1px solid #f1f5f9; text-align:left;">
                        <span style="color:${color}; font-weight:900; font-size:10px; min-width:44px; flex-shrink:0;">${a.ability_grade.substring(0,3)}</span>
                        <span style="color:#0f172a; font-size:11px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;">${a.ability_value}</span>
                    </div>`;
        }).join('');
    } else {
        html += '<div style="font-size:11px; color:#94a3b8; padding:5px 0; font-weight:700;">어빌리티 정보가 없습니다.</div>';
    }
    abiList.innerHTML = html;
};

window.renderSymbols = function(symbolData) {
    const symbolBox = document.getElementById('res_symbol_info');
    if (!symbolBox) return;
    if (!symbolData || !symbolData.symbol || symbolData.symbol.length === 0) {
        symbolBox.innerHTML = '<div style="font-size:11.5px; color:#94a3b8; padding:20px 0; font-weight:700;">장착 완료된 심볼이 없습니다.</div>';
        return;
    }
    
    let html = `<div style="display:flex; flex-direction:column; gap:5px; max-height:220px; overflow-y:auto; padding-right:4px;">`;
    symbolData.symbol.forEach(s => {
        const name = s.symbol_name.includes(' : ') ? s.symbol_name.split(' : ')[1] : s.symbol_name;
        html += `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:6px 10px; display:flex; align-items:center; justify-content:space-between;">
                <div style="display:flex; align-items:center; gap:6px;">
                    <img src="${s.symbol_icon || ''}" style="width:16px; height:16px;" onerror="this.style.display='none'">
                    <span style="font-size:11px; font-weight:800; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:110px;">${name}</span>
                </div>
                <span style="font-size:11px; font-weight:900; color:#7c3aed;">Lv.${s.symbol_level}</span>
            </div>
        `;
    });
    symbolBox.innerHTML = html + `</div>`;
};

window.switchSearchInternalTab = function(tabName) {
    const contentBox = document.getElementById('searchTabContentContainer');
    const mainGrid = document.getElementById('searchMainGridContent');
    if (!contentBox || !mainGrid) return;

    document.querySelectorAll('.search-tab-trigger-btn').forEach(btn => {
        if (btn.innerText.trim() === tabName) {
            btn.style.background = '#7c3aed';
            btn.style.color = '#ffffff';
        } else {
            btn.style.background = 'transparent';
            btn.style.color = '#475569';
        }
    });

    const data = window.currentSearchData;
    if (!data) return;

    if (tabName === '유니온') {
        contentBox.style.display = 'block';
        mainGrid.style.display = 'none'; 
        contentBox.innerHTML = typeof window.renderUnion === 'function' ? window.renderUnion(data.union, data.hexa_skill, data.hexa_stat) : '';
    } else if (tabName === '내실') {
        contentBox.style.display = 'none';
        mainGrid.style.display = 'grid'; 
    } else if (tabName === '헥사/스킬') {
        contentBox.style.display = 'block';
        mainGrid.style.display = 'none';
        contentBox.innerHTML = typeof window.renderSkill === 'function' ? window.renderSkill() : '';
    } else {
        contentBox.style.display = 'block';
        mainGrid.style.display = 'none';
        contentBox.innerHTML = `<div style="padding: 60px; text-align: center; color: #94a3b8; font-weight: 800; font-size:13px; background:white; border-radius:16px; border:1px solid rgba(15, 23, 42, 0.04);">🚧 [${tabName}] 상세 서브 지표 릴리즈 패키지 동적 준비 중입니다.</div>`;
    }
};

window.saveRecentSearch = function(charName) {
    if (!charName || charName === '-' || charName === '테스트캐릭') return;
    let history = JSON.parse(localStorage.getItem('maple_recent_chars') || '[]');
    history = history.filter(char => char.name !== charName);
    history.unshift({ name: charName }); 
    if (history.length > 4) history = history.slice(0, 4);
    localStorage.setItem('maple_recent_chars', JSON.stringify(history));
    window.renderRecentSearchesMain();
};

window.deleteRecentSearch = function(event, charName) {
    if (event) event.stopPropagation(); 
    let history = JSON.parse(localStorage.getItem('maple_recent_chars') || '[]');
    history = history.filter(char => char.name !== charName);
    localStorage.setItem('maple_recent_chars', JSON.stringify(history));
    window.renderRecentSearchesMain();
};

window.renderRecentSearchesMain = function() {
    const container = document.getElementById('recentSearchList');
    if (!container) return;

    let history = JSON.parse(localStorage.getItem('maple_recent_chars') || '[]');
    container.innerHTML = ''; 

    history.forEach(char => {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = "display: inline-flex; align-items: center; background: #f1f5f9; padding: 4px 10px; border-radius: 6px; border: 1px solid #cbd5e1; margin: 2px; cursor: pointer; height: 26px; box-sizing: border-box;";
        wrapper.innerHTML = `
            <span style="color: #334155; font-weight: 800; font-size: 11.5px; white-space: nowrap;">${char.name}</span>
            <span onclick="window.deleteRecentSearch(event, '${char.name}')" style="display: inline-flex; align-items: center; justify-content: center; margin-left: 6px; width: 14px; height: 14px; background: #fee2e2; color: #ef4444; border-radius: 4px; font-size: 9px; font-weight: 900; cursor: pointer;">✕</span>
        `;
        wrapper.onclick = () => {
            if(typeof window.startOmniSearch === 'function') window.startOmniSearch(char.name);
        };
        container.appendChild(wrapper);
    });
};

window.toggleFavorite = function() {
    const nameEl = document.getElementById('res_profileName');
    if (!nameEl) return;
    const charName = nameEl.innerText.trim();
    if (charName === '-' || !charName) return;

    let favorites = JSON.parse(localStorage.getItem('maple_favorites') || '[]');
    if (favorites.includes(charName)) { 
        favorites = favorites.filter(n => n !== charName); 
    } else { 
        favorites.push(charName); 
    }
    localStorage.setItem('maple_favorites', JSON.stringify(favorites));
    window.updateFavoriteBtnState(charName); 
    window.renderFavorites();
};

window.updateFavoriteBtnState = function(charName) {
    const btn = document.getElementById('btn_favorite');
    if (!btn) return;
    let favorites = JSON.parse(localStorage.getItem('maple_favorites') || '[]');
    if (favorites.includes(charName)) { 
        btn.style.background = '#7c3aed'; btn.style.color = 'white'; btn.innerText = '★ 즐겨찾기 해제'; 
    } else { 
        btn.style.background = '#ffffff'; btn.style.color = '#475569'; btn.innerText = '⭐ 즐겨찾기 등록'; 
    }
};

window.renderFavorites = function() {
    const favBox = document.getElementById('favoriteListContainer');
    if (!favBox) return;
    let favorites = JSON.parse(localStorage.getItem('maple_favorites') || '[]');
    
    favBox.innerHTML = favorites.length === 0 
        ? '<div style="font-size:11.5px; color:#94a3b8; text-align:center; padding:15px 0; font-weight:700;">등록된 즐겨찾기가 없습니다.</div>' 
        : favorites.map(name => `
            <div onclick="if(typeof window.startOmniSearch === 'function') window.startOmniSearch('${name}');" style="background:#f8fafc; border:1px solid #e2e8f0; padding:10px 14px; border-radius:10px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; transition:all 0.15s;">
                <span style="font-weight:800; color:#0f172a; font-size:12.5px;">${name}</span>
                <span style="font-size:11px; color:#7c3aed; font-weight:900;">➔</span>
            </div>
        `).join('');
};

window.executeInlineSearch = function() {
    const inputField = document.getElementById('inlineSearchInput');
    const charName = inputField?.value?.trim();
    if (charName && typeof window.startOmniSearch === 'function') {
        window.startOmniSearch(charName);
        inputField.value = ''; 
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.renderFullSearchPage();
});