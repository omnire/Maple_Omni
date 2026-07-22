/**
 * ============================================================================
 * 👤 MAPLE OMNI - js/search/search.js [PREMIUM LAVENDER PRESTIGE V4 COMPLETE]
 * 설명: 인게임 상세 팁 엔진 내장 및 보스 포뻥 대응 아코디언 심볼 관제 허브
 * [패치 완수]
 * 1. 전달받은 ui-tooltip.js 코어 로직을 완벽 내장하여 전역 마우스 오버 이벤트 동기화 완료.
 * 2. [⚔️ 착용 슬롯 레이아웃] 및 [🎒 장비 세부 명세] 마우스 호버 시 인게임 스타일 툴팁 호출.
 * 3. 전달받은 ARCANE / AUTHENTIC / GRAND 심볼 토글 메뉴 및 비용 계산 테이블 완전 이식.
 * 4. 토글 레이어 내부 혹은 헤더에 컴팩트한 보스 포뻥(Force Damage Multiplier) 조건식 통합 임베딩.
 * 5. 우측 사이드바 폭(260px) 컴팩트 스케일 및 즐겨찾기 최상단 고정 배치 철저 엄수.
 * 6. [우측 정보 집약 패치] 장비 카드의 우측 여백에 세트명 및 몇 세트 효과인지 적용, 추옵 데코 제거 후 컴팩트화.
 * 7. [툴팁 보강] 인게임 스타일 상세 툴팁 내부에 업그레이드 횟수 및 가위 사용 가능 횟수 완벽 표기.
 * 8. [프로필 보정] 프로필 카드 내 캐릭터 아바타 이미지가 쏠림 없이 항상 정중앙에 위치하도록 수정.
 * 9. [명세서 보강] 장비 명세 우측 텍스트에 주문서 강화가 어떤 스탯 종류로 몇 회 되었는지 상세 수치 동적 결합.
 * 10.[API 완전체 정산] 업적 모듈 코드를 파일로 완전 격리하고, 부캐 목록을 넥슨 유니온 데이터로 100% 매핑!
 * 가이드: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 완벽하게 달아줍니다.
 * ============================================================================
 */

// 💡 [초보자 가이드] 테마 스위칭 시 실시간 동기화를 위해 고정 색상 대신 CSS 변수 시스템(var)을 연동했습니다.
const SEARCH_UI = {
    card: "background: var(--omni-bg-clean, #ffffff); border-radius: 20px; padding: 24px; border: 1px solid var(--omni-card-border-line, #ebdffc); box-shadow: 0 10px 25px -5px rgba(131, 114, 214, 0.02);",
    pointColor: "var(--omni-slate-primary, #7a6ec7)", 
    grayText: "var(--omni-text-muted, #6a638c)",
    mainText: "var(--omni-text-dark, #312e4b)",
    lightBg: "var(--omni-card-bg, #fbfaff)"
};

// 현재 활성화된 장비 프리셋 번호를 전역 보존하여 툴팁 연동에 실시간 맵핑합니다.
window.currentPresetNum = 1;

// ============================================================================
// 🔌 [PART 1] 유저 제공 ui-tooltip.js 엔진 전역 동기화 및 바인딩 파트
// ============================================================================

/**
 * 💡 [초보자 가이드] 아이템 데이터를 분석하여 실제 인게임 팝업과 동일한 비주얼 뼈대를 제작하는 빌더 함수입니다.
 */
window.generateInGameTooltipHtml = function(item, slotName) {
    const gradeColor = { "레전드리": "#73ff00", "유니크": "#ffcc00", "에픽": "#cc66ff", "레어": "#00ccff" };
    
    // 스타포스(별) 그리기 로직
    let starHtml = '';
    const sf = Number(item.starforce) || 0;
    const part = item.item_equipment_part || slotName;
    const noStarParts = ["훈장", "포켓 아이템", "배지", "뱃지", "성향 아이템", "칭호"];

    if (!noStarParts.includes(part) && sf > 0) {
        let r1 = '', r2 = '';
        for (let i = 0; i < 15; i++) {
            r1 += `<span style="color: ${i < sf ? '#ffcc00' : '#444444'}; text-shadow: 1px 1px 1px #000; font-size: 11px;">★</span>`;
            if ((i + 1) % 5 === 0 && i !== 14) r1 += '<span style="margin: 0 4px;"></span>';
        }
        for (let i = 15; i < 30; i++) {
            r2 += `<span style="color: ${i < sf ? '#ffcc00' : '#444444'}; text-shadow: 1px 1px 1px #000; font-size: 11px;">★</span>`;
            if ((i + 1) % 5 === 0 && i !== 29) r2 += '<span style="margin: 0 4px;"></span>';
        }
        starHtml = `<div style="text-align: center; margin-bottom: 8px; line-height: 1.2;"><div>${r1}</div><div>${r2}</div></div>`;
    }

    // 스탯(STR, DEX 등) 표시 로직
    const stats = [
        { name: 'STR', key: 'str' }, { name: 'DEX', key: 'dex' }, { name: 'INT', key: 'int' }, { name: 'LUK', key: 'luk' },
        { name: '최대 HP', key: 'max_hp' }, { name: '공격력', key: 'attack_power' }, { name: 'magic_power', key: 'magic_power' },
        { name: '보스 데미지', key: 'boss_damage', isPercent: true },
        { name: '방어율 무시', key: 'ignore_monster_armor', isPercent: true },
        { name: '올스탯', key: 'all_stat', isPercent: true }
    ];

    let statHtml = '';
    stats.forEach(s => {
        const b = Number(item.item_base_option?.[s.key]) || 0;
        const star = Number(item.item_starforce_option?.[s.key]) || 0;
        const add = Number(item.item_add_option?.[s.key]) || 0;
        const etc = Number(item.item_etc_option?.[s.key]) || 0;
        const total = b + star + add + etc;

        if (total > 0) {
            const unit = s.isPercent ? '%' : '';
            let detail = '';
            
            // Breakdown: Base + Add + Etc + Star 순서대로 표시
            if (star > 0 || add > 0 || etc > 0) {
                detail += ` <span style="color:#aaaaaa;">(${b}${unit}`;
                if (add > 0) detail += ` <span style="color:#66ffff;">+${add}${unit}</span>`;
                if (etc > 0) detail += ` <span style="color:#af48ff;">+${etc}${unit}</span>`;
                if (star > 0) detail += ` <span style="color:#ffcc00;">+${star}${unit}</span>`;
                detail += `)</span>`;
            }
            statHtml += `<div style="margin-bottom: 2px;">${s.name} : +${total}${unit}${detail}</div>`;
        }
    });

    // 💡 [초보자 가이드] 주문서 업그레이드 및 가위 횟수를 인게임 정보 필드에 맵핑합니다.
    let extraInfoHtml = '';
    const upCnt = Number(item.scroll_upgrade) || 0;
    if (upCnt > 0) {
        extraInfoHtml += `<div style="color: #ffcc00; margin-top: 2px;">업그레이드 횟수 : +${upCnt}</div>`;
    }
    
    // 넥슨 OpenAPI의 가위 횟수 키 검증 (255값은 무한 혹은 가위 사용 안 함 의미)
    const scissorCount = item.cut_table_change_allow_trade_count;
    if (scissorCount !== undefined && scissorCount !== null && Number(scissorCount) !== 255) {
        extraInfoHtml += `<div style="color: #ffffff; margin-top: 2px;">가위 사용 가능 횟수 : ${scissorCount}회</div>`;
    }

    const nameColor = gradeColor[item.potential_option_grade] || "#ffffff";
    return `
        ${starHtml}
        <div style="text-align: center; margin-bottom: 10px;">
            <div style="color: ${nameColor}; font-weight: bold; font-size: 15px; margin-bottom: 4px;">${item.item_name}</div>
            <div style="color: #aaa; font-size: 11px;">(${item.potential_option_grade || '일반'} 아이템)</div>
        </div>
        <div style="display: flex; gap: 12px; border-top: 1px dashed #555; border-bottom: 1px dashed #555; padding: 10px 0; margin-bottom: 10px;">
            <div style="width: 60px; height: 60px; background: #222; border: 1px solid #333; border-radius: 5px; display: flex; align-items: center; justify-content: center;">
                <img src="${item.item_icon}" style="max-width: 45px; max-height: 45px;">
            </div>
            <div style="display: flex; flex-direction: column; justify-content: center; font-size: 11px;">
                <div style="color: #ffcc00; font-weight: bold;">REQ LEV : ${item.item_base_option?.base_equipment_level || 0}</div>
                <div style="color: #aaa; margin-top: 3px;">장비분류 : ${part}</div>
                ${extraInfoHtml}
            </div>
        </div>
        <div style="font-size: 11px; color: #fff; line-height: 1.5; text-align: left;">
            ${statHtml}
        </div>
        <div style="border-top: 1px dashed #555; margin-top: 10px; padding-top: 10px; font-size: 11px; text-align: left;">
            <div style="color: #73ff00; font-weight: bold; margin-bottom: 4px;">● 잠재옵션</div>
            <div>${item.potential_option_1 || '옵션 없음'}</div>
            <div>${item.potential_option_2 || ''}</div>
            <div>${item.potential_option_3 || ''}</div>
            ${item.additional_potential_option_1 ? `
                <div style="color: #cc66ff; font-weight: bold; margin-top: 10px; margin-bottom: 4px;">● 에디셔널 잠재옵션</div>
                <div>${item.additional_potential_option_1}</div>
                <div>${item.additional_potential_option_2 || ''}</div>
                <div>${item.additional_potential_option_3 || ''}</div>
            ` : ''}
        </div>
    `;
};

/**
 * 💡 [초보자 가이드] 화면상에 툴팁 플레이트를 동적으로 할당하고 인라인 스타일 커널을 제어합니다.
 */
window.getOrCreateTooltip = function() {
    let tt = document.getElementById('itemTooltip');
    if (!tt) {
        tt = document.createElement('div');
        tt.id = 'itemTooltip';
        document.body.appendChild(tt);
    }
    tt.style.cssText = `display: none; position: fixed !important; background: rgba(17, 17, 17, 0.96); color: #fff; border: 1px solid #555; border-radius: 10px; padding: 15px; font-size: 12px; z-index: 99999; width: 280px; pointer-events: none; box-shadow: 0 10px 30px rgba(0,0,0,0.6); box-shadow: border-box; backdrop-filter: blur(10px); top: 0; left: 0; font-family: sans-serif;`;
    return tt;
};

window.hideTooltip = function() { 
    const tt = document.getElementById('itemTooltip'); 
    if (tt) tt.style.display = 'none'; 
};

window.hideOmniTooltip = function() {
    window.hideTooltip();
};

/**
 * 💡 [초보자 가이드] 착용 유닛 마우스 진입 시 현재 오픈된 데이터 스케일을 검증하여 명세서 툴팁을 트리거합니다.
 */
window.showTooltip = function(e, slotName, presetNum) {
    const data = window.currentSearchData;
    if (!data || !data.item) return;
    
    let list = data.item[`item_equipment_preset_${presetNum}`] || data.item.item_equipment;
    const item = list.find(eq => 
        eq.item_equipment_slot === slotName || 
        (slotName === "상의" && eq.item_equipment_slot === "한벌옷") || 
        (slotName === "펜던트1" && eq.item_equipment_slot === "펜던트") || 
        (slotName === "뱃지" && eq.item_equipment_slot === "배지")
    );
    
    if (!item) return;
    
    let tt = window.getOrCreateTooltip(); 
    tt.innerHTML = window.generateInGameTooltipHtml(item, slotName); 
    tt.style.display = 'block';
    window.moveTooltip(e); 
};

/**
 * 💡 [초보자 가이드] 마우스 커서의 동선 변화를 추적하여 정보창 위치를 자연스럽게 재할당합니다.
 */
window.moveTooltip = function(event) {
    const tooltip = document.getElementById('itemTooltip');
    if (tooltip && tooltip.style.display === 'block') {
        const ttWidth = tooltip.offsetWidth;
        const ttHeight = tooltip.offsetHeight;
        
        let posX = event.clientX + 15;
        let posY = event.clientY - ttHeight - 10;

        if (posX + ttWidth > window.innerWidth) posX = event.clientX - ttWidth - 20;
        if (posY < 10) {
            posY = event.clientY + 20; 
            if (posY + ttHeight > window.innerHeight) posY = 10; 
        }

        tooltip.style.left = posX + 'px'; 
        tooltip.style.top = posY + 'px';
    }
};

window.showOmniTooltip = function(e, item) {
    if (!item) return;
    let displayItem = { ...item };
    
    if (item.potentials && Array.isArray(item.potentials)) {
        displayItem.potential_option_1 = item.potentials[0]?.type && item.potentials[0].type !== 'none' ? `${item.potentials[0].type} +${item.potentials[0].value}` : "";
        displayItem.potential_option_2 = item.potentials[1]?.type && item.potentials[1].type !== 'none' ? `${item.potentials[1].type} +${item.potentials[1].value}` : "";
        displayItem.potential_option_3 = item.potentials[2]?.type && item.potentials[2].type !== 'none' ? `${item.potentials[2].type} +${item.potentials[2].value}` : "";
    }
    
    if (item.additional_potentials && Array.isArray(item.additional_potentials)) {
        displayItem.additional_potential_option_1 = item.additional_potentials[0]?.type && item.additional_potentials[0].type !== 'none' ? `${item.additional_potentials[0].type} +${item.additional_potentials[0].value}` : "";
        displayItem.additional_potential_option_2 = item.additional_potentials[1]?.type && item.additional_potentials[1].type !== 'none' ? `${item.additional_potentials[1].type} +${item.additional_potentials[1].value}` : "";
        displayItem.additional_potential_option_3 = item.additional_potentials[2]?.type && item.additional_potentials[2].type !== 'none' ? `${item.additional_potentials[2].type} +${item.additional_potentials[2].value}` : "";
    }

    displayItem.item_base_option = item.base_option;
    displayItem.item_add_option = item.add_option;
    displayItem.item_etc_option = item.etc_option;
    displayItem.starforce = item.starforce;
    displayItem.starforce_option = item.starforce_option;
    displayItem.scroll_upgrade = item.scroll_upgrade;
    displayItem.cut_table_change_allow_trade_count = item.cut_table_change_allow_trade_count;

    if (!displayItem.item_icon && item.item_name) {
        displayItem.item_icon = window.getLocalItemIconBase(item.item_name) + ".png";
    }

    let tt = window.getOrCreateTooltip();
    tt.innerHTML = window.generateInGameTooltipHtml(displayItem, item.item_equipment_slot || '장비');
    tt.style.display = 'block';
    
    if (typeof window.moveTooltip === 'function') {
        window.moveTooltip(e);
    }
};

// ============================================================================
// 🧱 [PART 2] 기존 검색 레이아웃 핵심 골격 라인 가동
// ============================================================================

function removeLegacyTopMenu() {
    const legacyMenu = document.querySelector('#page-search .sub-tab-menu');
    if (legacyMenu) {
        legacyMenu.style.display = 'none';
        legacyMenu.remove();
    }
}

window.renderFullSearchPage = function() {
    const container = document.getElementById('search-basic');
    if (!container) return; 
    
    removeLegacyTopMenu();
    setTimeout(removeLegacyTopMenu, 20);
    
    container.innerHTML = `
        <div style="width: 100%; display: flex; flex-direction: column; gap: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; background: var(--omni-bg-clean, #ffffff); border-radius: 16px; padding: 16px 24px; border: 1px solid var(--omni-card-border-line, #ebdffc);">
                <div style="display: flex; gap: 10px;">
                    <button id="refreshBtn" onclick="const nameEl = document.getElementById('res_profileName'); if(nameEl && typeof window.startOmniSearch === 'function') { window.startOmniSearch(nameEl.innerText.trim()); } else { alert('조회된 대상 캐릭터가 없습니다.'); }" 
                        style="background: var(--omni-card-bg, #f4f2ff); color: var(--omni-slate-primary, #7a6ec7); border: 1px solid var(--omni-card-border-line, #ebdffc); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 800; transition: 0.2s;">
                        🔄 실시간 라이브 파싱 갱신
                    </button>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <div style="display: flex; align-items: center; width: 300px; border-radius: 10px; border: 1px solid var(--omni-card-border-line, #ded9f3); background: var(--omni-card-bg, #fbfaff); overflow: hidden;">
                        <input type="text" id="inlineSearchInput" placeholder="캐릭터명 입력 후 엔터..." style="flex: 1; border: none; outline: none; padding: 8px 14px; font-size: 13px; font-weight: 700; color: var(--omni-text-dark, #312e4b); background: transparent;">
                        <button onclick="window.executeInlineSearch()" style="padding: 8px 16px; background: var(--omni-slate-primary, #7a6ec7); color: var(--omni-badge-text, white); border: none; cursor: pointer; font-weight: 800; font-size: 12px;">조회</button>
                    </div>
                    <div id="recentSearchList" style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; min-height: 20px;"></div>
                </div>
            </div>

            <div id="charDetailContainer" style="width: 100%;">
                <div id="searchPlaceholder" style="text-align: center; padding: 120px 0; color: var(--omni-text-sub, #b2acc7); font-weight: 800; font-size: 14px; background: var(--omni-bg-clean, #ffffff); border-radius: 20px; border: 1px dashed var(--omni-card-border-line, #ebdffc);">
                    🔍 캐릭터 이름을 입력하시면 프리미엄 통계 분석 대시보드가 로드됩니다.
                </div>
            </div>
        </div>
    `;
    window.renderRecentSearchesMain();
};

window.renderSearchDetail = function(basic, stat, item, ability, symbol, dojang, union, ranking, link_skill, hexa_skill, skill, hexa_stat) {
    const container = document.getElementById('charDetailContainer');
    if (!container) return; 

    if (!basic || !basic.character_name) {
        container.innerHTML = `<div style="text-align: center; padding: 80px 0; color: var(--omni-text-muted, #6a638c); font-weight: 800; font-size: 14px; background: var(--omni-bg-clean, #ffffff); border-radius: 20px;">⏳ 넥슨 OpenAPI로부터 보안 암호화 테이블을 수신 중입니다...</div>`;
        return;
    }

    removeLegacyTopMenu();
    window.saveRecentSearch(basic.character_name);
    window.currentSearchData = { basic, stat, item, ability, symbol, dojang, union, ranking, link_skill, hexa_skill, skill, hexa_stat };
    
    // 💡 [초보자 가이드] 페이지 새로고침 시에도 기존 데이터를 그대로 복구할 수 있도록 브라우저 캐시에 데이터를 자동 동기화합니다.
    localStorage.setItem('omni_last_data', JSON.stringify(window.currentSearchData));

    const power = stat?.final_stat?.find(s => s.stat_name === "전투력")?.stat_value || "0";
    const mainStat = stat?.final_stat?.find(s => s.stat_name === "주스탯")?.stat_value || "-";
    const tabs = ['내실', '유니온', '헥사/스킬', '업적', '부캐'];

    container.style.display = 'block';
    
    container.innerHTML = `
        <div style="width: 100%; display: flex; flex-direction: column; gap: 20px;">
            
            <div style="background: var(--omni-bg-clean, #ffffff); border-radius: 20px; padding: 26px; border: 1px solid var(--omni-card-border-line, #ebdffc); display: flex; align-items: center; gap: 24px;">
                <div style="width: 90px; height: 90px; background: var(--omni-card-bg, #fbfaff); border-radius: 16px; overflow:hidden; flex-shrink: 0; border: 1px solid var(--omni-card-border-line, #ebdffc); display:flex; align-items:center; justify-content:center;">
                    <img src="${basic.character_image || ''}" style="width:280%; height:280%; object-fit:contain; object-position: 50% 45%; transform: translateY(-10px);">
                </div>
                <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 6px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <h3 id="res_profileName" style="margin: 0; font-size: 19px; font-weight: 900; color: var(--omni-text-dark, #312e4b);">${basic.character_name}</h3>
                        <span style="font-size: 10.5px; color: var(--omni-slate-primary, #7a6ec7); font-weight: 800; background: var(--omni-card-bg, #f4f2ff); padding: 2px 8px; border-radius: 6px;">🍀 캐릭터 상세 명세 동기화 완료</span>
                    </div>
                    <div style="font-size: 13px; font-weight: 700; color: var(--omni-text-muted, #6a638c); text-align:left;">
                        월드: ${basic.world_name} | 레벨: ${basic.character_level} | 직업군: ${basic.character_class} | 길드: ${basic.character_guild_name || '미가입'}
                    </div>
                    <div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: center; border-top: 1px dashed var(--omni-card-border-line, #ebdffc); padding-top: 10px; margin-top: 4px;">
                        ${[
                            {l:'전투력', v: Number(power).toLocaleString(), c: 'var(--omni-slate-primary, #7a6ec7)'},
                            {l:'주스탯', v: mainStat},
                            {l:'유니온', v: (union?.union_level) ? union.union_level : '-'},
                            {l:'무릉', v: (dojang?.dojang_best_floor) ? dojang.dojang_best_floor + '층' : '-'}
                        ].map(itm => `
                            <div style="display: flex; align-items: baseline; gap: 4px;">
                                <span style="font-size: 10.5px; color: var(--omni-text-sub, #b2acc7); font-weight: 800;">${itm.l}</span>
                                <span style="font-size: 12.5px; font-weight: 900; color: ${itm.c || 'var(--omni-text-dark, #312e4b)'};">${itm.v}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div style="display: flex; gap: 6px; background: var(--omni-bg-clean, #ffffff); padding: 6px; border-radius: 12px; border: 1px solid var(--omni-card-border-line, #ebdffc);">
                ${tabs.map(tab => `<button class="search-tab-trigger-btn" onclick="window.switchSearchInternalTab('${tab}')" style="padding: 8px 20px; border:none; background:transparent; border-radius:8px; font-weight:800; cursor:pointer; font-size:12.5px; color:var(--omni-text-muted, #6a638c); transition:all 0.2s;">${tab}</button>`).join('')}
            </div>
            
            <div id="searchTabContentContainer" style="margin-bottom: 4px; display: none; width:100%;"></div>

            <div id="searchMainGridContent" style="display: grid; grid-template-columns: 240px 1fr 260px; gap: 20px; align-items: start; width: 100%; box-sizing: border-box;">
                
                <div style="display: flex; flex-direction: column; gap: 20px; min-width: 0;">
                    <div style="${SEARCH_UI.card} padding: 16px;">
                        <h4 style="margin: 0 0 14px 0; font-size: 12.5px; font-weight: 900; color: var(--omni-text-dark, #312e4b); text-align:left;">⚔️ 착용 슬롯 레이아웃</h4>
                        <div id="res_equip_slot_grid" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px;"></div>
                    </div>
                    <div style="${SEARCH_UI.card} padding: 16px;">
                        <h4 style="margin: 0 0 12px 0; font-size: 12.5px; font-weight: 900; color: var(--omni-text-dark, #312e4b); text-align:left;">👑 어센틱/아케인 심볼 통합창</h4>
                        <div id="res_symbol_info"></div>
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 20px; min-width: 0;">
                    <div style="${SEARCH_UI.card} padding: 20px; background: var(--omni-card-bg, #f4f2ff); border: 1px solid var(--omni-card-border-line, #ebdffc);">
                        <h4 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 900; color: var(--omni-slate-primary, #7a6ec7); text-align:left;">📊 프리셋 옵션 정산 요약</h4>
                        <div id="res_gear_total_summary"></div>
                    </div>
                    
                    <div style="${SEARCH_UI.card} padding: 20px; display: flex; flex-direction: column; min-width: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-shrink: 0;">
                            <h4 style="margin: 0; font-size: 13.5px; font-weight: 900; color:var(--omni-text-dark, #312e4b);">🎒 장비 세부 명세</h4>
                            <div id="itemPresetBtns" style="display: flex; gap: 4px; background: var(--omni-card-bg, #fbfaff); padding: 3px; border-radius: 6px; border:1px solid var(--omni-card-border-line, #ebdffc);">
                                ${[1,2,3].map(n => `<button class="preset-toggle-btn" onclick="window.switchItemPreset(${n})" style="padding: 3px 10px; font-size:11px; border:none; border-radius:4px; cursor:pointer; font-weight:800; background:transparent; color:var(--omni-text-muted, #6a638c);">${n}번</button>`).join('')}
                            </div>
                        </div>
                        <div id="res_itemGrid" style="max-height: 560px; overflow-y: auto; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding-right: 2px; box-sizing: border-box;"></div>
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 20px; min-width: 0;">
                    <div style="${SEARCH_UI.card} padding: 20px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                            <h4 style="margin:0; font-size: 13px; font-weight: 900; color: var(--omni-text-dark, #312e4b); text-align:left;">⭐ 워크스페이스 즐겨찾기</h4>
                            <button type="button" id="btn_favorite" onclick="window.toggleFavorite()" style="background: var(--omni-bg-clean, #ffffff); border: 1px solid var(--omni-card-border-line, #ebdffc); padding: 3px 8px; border-radius: 4px; cursor: pointer; font-size: 10.5px; font-weight: 800; color: var(--omni-text-muted, #6a638c);">⭐ 등록</button>
                        </div>
                        <div id="favoriteListContainer"></div>
                    </div>

                    <div style="${SEARCH_UI.card} padding: 20px; max-height: 250px; display: flex; flex-direction: column;">
                        <h4 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 900; color: var(--omni-text-dark, #312e4b); text-align:left;">📊 캐릭터 세부 스탯 관제창</h4>
                        <div id="res_detailed_spec_window" class="omni-spec-scroll-area" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 5px; padding-right: 4px;"></div>
                    </div>

                    <div style="${SEARCH_UI.card} padding: 20px;">
                        <h4 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 900; color: var(--omni-text-dark, #312e4b); text-align:left;">🧬 레전드리 어빌리티</h4>
                        <div id="res_equip_ability"></div>
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
        specContainer.innerHTML = `<div style="font-size:11px; color:var(--omni-text-sub, #b2acc7); text-align:center; padding:20px 0;">스탯 정보를 불러올 수 없습니다.</div>`;
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
                <div style="display: flex; justify-content: space-between; align-items: center; background: var(--omni-card-bg, #fbfaff); padding: 6px 10px; border-radius: 6px; border: 1px solid var(--omni-card-border-line, #ebdffc);">
                    <span style="font-size: 11px; font-weight: 800; color: var(--omni-text-muted, #6a638c);">${targetName.replace(" 몬스터 ", " ")}</span>
                    <span style="font-size: 11.5px; font-weight: 900; color: var(--omni-text-dark, #312e4b);">${valueStr}</span>
                </div>
            `;
        }
    });

    specContainer.innerHTML = html;
};

/**
 * 💡 [초보자 가이드 - 장비 프리셋 전역 변환 스위처]
 */
window.switchItemPreset = function(num) {
    window.currentPresetNum = num; 
    
    document.querySelectorAll('#itemPresetBtns .preset-toggle-btn').forEach((btn, i) => { 
        if (i + 1 === num) {
            btn.style.background = 'var(--omni-bg-clean, #ffffff)'; btn.style.color = 'var(--omni-text-dark, #312e4b)'; btn.style.boxShadow = '0 1px 3px rgba(131,114,199,0.08)';
        } else {
            btn.style.background = 'transparent'; btn.style.color = 'var(--omni-text-muted, #6a638c)'; btn.style.boxShadow = 'none';
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
    
    // 💡 테마별 다크모드 가독성을 고려한 잠재 등급 컬러맵 가변화 연동
    const gradeColor = { 
        "레전드리": "var(--omni-emerald, #15803d)", 
        "유니크": "var(--omni-amber, #b45309)", 
        "에픽": "var(--omni-slate-primary, #6b21a8)", 
        "레어": "var(--omni-sky-highlight, #0369a1)" 
    };
    
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

    let setItemCounts = {};
    equipList.forEach(eq => {
        if (eq.set_item_name) {
            setItemCounts[eq.set_item_name] = (setItemCounts[eq.set_item_name] || 0) + 1;
        }
    });

    if (slotBox) {
        let gHtml = ""; 
        slotOrder.forEach(sName => {
            if (sName) {
                let itemMatch = equipList.find(eq => eq.item_equipment_slot === sName || (sName === "상의" && eq.item_equipment_slot === "한벌옷") || (sName === "펜던트1" && eq.item_equipment_slot === "펜던트") || (sName === "뱃지" && eq.item_equipment_slot === "배지"));
                if (itemMatch) { 
                    let bColor = borderGradeColor[itemMatch.potential_option_grade] || "var(--omni-card-border-line, #ded9f3)"; 
                    gHtml += `<div onmouseover="window.showTooltip(event, '${itemMatch.item_equipment_slot || sName}', window.currentPresetNum)" onmousemove="window.moveTooltip(event)" onmouseout="window.hideTooltip()" style="background:var(--omni-bg-clean, #ffffff); border-radius:6px; border:1.5px solid ${bColor}; display:flex; align-items:center; justify-content:center; aspect-ratio:1/1; overflow:hidden; cursor:pointer;"><img src="${itemMatch.item_icon}" style="width:70%; height:70%; object-fit:contain;"></div>`;
                } else { 
                    let shortName = sName.length > 3 ? sName.substring(0, 2) : sName;
                    gHtml += `<div style="background:var(--omni-card-bg, #fbfaff); border-radius:6px; border:1px solid var(--omni-card-border-line, #ebdffc); display:flex; align-items:center; justify-content:center; aspect-ratio:1/1;"><span style="font-size:8.5px; color:var(--omni-text-sub, #b2acc7); font-weight:800;">${shortName}</span></div>`; 
                }
            } else {
                gHtml += `<div style="background:transparent; aspect-ratio:1/1;"></div>`;
            }
        });
        slotBox.innerHTML = gHtml;
    }

    if (listGrid) {
        if (equipList.length === 0) {
            listGrid.innerHTML = '<div style="font-size:12px; color:var(--omni-text-sub, #b2acc7); padding:30px 0; font-weight:700; grid-column: span 2; text-align:center;">장착 장비 리스트 명세가 비어 있습니다.</div>';
            return;
        }
        
        let listHtml = "";
        equipList.forEach(itemInfo => {
            let sf = parseInt(itemInfo.starforce) || 0;
            totalStarforce += sf;

            if(itemInfo.potential_option_grade === "레전드리") legendCount++;
            else if(itemInfo.potential_option_grade === "유니크") uniqueCount++;
            else if(itemInfo.potential_option_grade === "에픽") epicCount++;

            let bColor = borderGradeColor[itemInfo.potential_option_grade] || "var(--omni-card-border-line, #ded9f3)";
            let starHtml = (sf > 0) ? `<span style="color:#f59e0b; font-size:10.5px; font-weight:900; margin-left:4px;">★${sf}</span>` : '';
            let potStr = "";
            
            const renderOptions = (grade, opt1, opt2, opt3) => { 
                if (!grade) return ""; 
                let options = [opt1, opt2, opt3].filter(Boolean).map(shortPot).join(' / '); 
                let color = gradeColor[grade] || "var(--omni-text-muted, #6a638c)"; 
                return `<div style="color:${color}; font-size:11px; font-weight:600; margin-top:2px; text-align:left; word-break:break-all; white-space:normal;"><span style="font-size:9px; background:var(--omni-card-bg, #fbfaff); padding:1px 3px; border-radius:3px; margin-right:4px; border:1px solid ${color}33; display:inline-block; font-weight:700;">${grade.charAt(0)}</span>${options}</div>`; 
            };
            potStr += renderOptions(itemInfo.potential_option_grade, itemInfo.potential_option_1, itemInfo.potential_option_2, itemInfo.potential_option_3);
            potStr += renderOptions(itemInfo.additional_potential_option_grade, itemInfo.additional_potential_option_1, itemInfo.additional_potential_option_2, itemInfo.additional_potential_option_3);
            
            let setTag = "";
            if (itemInfo.set_item_name) {
                let setNameClean = itemInfo.set_item_name.replace(" 세트", "").trim();
                let setSetCount = setItemCounts[itemInfo.set_item_name] || 1;
                setTag = `<span style="background:var(--omni-card-bg, #f4f2ff); color:var(--omni-slate-primary, #7a6ec7); padding:2px 6px; border-radius:4px; font-size:9.5px; font-weight:700; white-space:nowrap; max-width:110px; overflow:hidden; text-overflow:ellipsis; display:inline-block;">${setNameClean} ${setSetCount}셋</span>`;
            }

            let addOptStr = "";
            if (itemInfo.item_add_option) {
                let ao = itemInfo.item_add_option;
                let pieces = [];
                let maxBaseStat = Math.max(Number(ao.str)||0, Number(ao.dex)||0, Number(ao.int)||0, Number(ao.luk)||0);
                if (maxBaseStat > 0) pieces.push(`스탯+${maxBaseStat}`);
                let maxAttStat = Math.max(Number(ao.attack_power)||0, Number(ao.magic_power)||0);
                if (maxAttStat > 0) pieces.push(`공/마+${maxAttStat}`);
                if (Number(ao.all_stat) > 0) pieces.push(`올스탯+${ao.all_stat}%`);
                
                if (pieces.length > 0) {
                    addOptStr = `<div style="color:#16a34a; font-size:10px; font-weight:600; white-space:normal; word-break:keep-all; line-height:1.2;">추옵: ${pieces.join(' ')}</div>`;
                }
            }

            let soulStr = "";
            if (itemInfo.soul_name) {
                let sName = itemInfo.soul_name.replace("의 소울", "").trim();
                soulStr = `<div style="color:#ea580c; font-size:10px; font-weight:600; white-space:normal; word-break:keep-all; line-height:1.2;" title="${itemInfo.soul_name}">✨ ${sName}</div>`;
            }

            let upgradeStr = "";
            if (itemInfo.scroll_upgrade !== undefined && itemInfo.scroll_upgrade !== null) {
                let upCnt = Number(itemInfo.scroll_upgrade) || 0;
                let etcParts = [];
                if (itemInfo.item_etc_option) {
                    const eo = itemInfo.item_etc_option;
                    if (Number(eo.str) > 0) etcParts.push(`STR+${eo.str}`);
                    if (Number(eo.dex) > 0) etcParts.push(`DEX+${eo.dex}`);
                    if (Number(eo.int) > 0) etcParts.push(`INT+${eo.int}`);
                    if (Number(eo.luk) > 0) etcParts.push(`LUK+${eo.luk}`);
                    if (Number(eo.attack_power) > 0) etcParts.push(`공+${eo.attack_power}`);
                    if (Number(eo.magic_power) > 0) etcParts.push(`마+${eo.magic_power}`);
                }
                let scrollDetail = etcParts.length > 0 ? ` (${etcParts.join(',')})` : '';
                upgradeStr = `<div style="color:var(--omni-text-muted, #6a638c); font-size:10px; font-weight:500; white-space:normal; word-break:keep-all; line-height:1.2;">주문서: +${upCnt}${scrollDetail}</div>`;
            }

            listHtml += `
            <div onmouseover="window.showTooltip(event, '${itemInfo.item_equipment_slot}', window.currentPresetNum)" onmousemove="window.moveTooltip(event)" onmouseout="window.hideTooltip()" style="background:var(--omni-bg-clean, #ffffff); border:1px solid ${bColor}; border-radius:12px; padding:10px 12px; display:flex; justify-content:space-between; gap:12px; box-shadow:0 2px 6px rgba(131,114,199,0.02); box-sizing:border-box; width:100%; min-width:0; cursor:pointer;">
                <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:6px;">
                    <div style="display:flex; align-items:center; gap:8px; border-bottom:1px solid var(--omni-card-border-line, #f4f2ff); padding-bottom:6px; width:100%;">
                        <div style="width:28px; height:28px; flex-shrink:0; background:var(--omni-card-bg, #fbfaff); border-radius:6px; display:flex; align-items:center; justify-content:center; border:1px solid var(--omni-card-border-line, #ebdffc); overflow:hidden;">
                            <img src="${itemInfo.item_icon}" style="max-width:90%; max-height:90%; object-fit:contain;">
                        </div>
                        <div style="font-weight:700; font-size:13px; color:var(--omni-text-dark, #312e4b); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex:1; text-align:left;">
                            ${itemInfo.item_name}${starHtml}
                        </div>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:4px; width:100%;">
                        ${potStr ? potStr : '<div style="color:var(--omni-text-sub, #b2acc7); font-size:11px; text-align:left; padding-left:2px;">옵션 없음</div>'}
                    </div>
                </div>
                <div style="width:115px; flex-shrink:0; display:flex; flex-direction:column; align-items:flex-end; justify-content:flex-start; gap:5px; border-left:1px dashed var(--omni-card-border-line, #ded9f3); padding-left:10px; text-align:right; white-space:normal; word-break:keep-all;">
                    ${setTag}
                    ${addOptStr}
                    ${soulStr}
                    ${upgradeStr}
                </div>
            </div>`;
        });
        listGrid.innerHTML = listHtml;
    }

    const summaryBox = document.getElementById('res_gear_total_summary');
    if (summaryBox) {
        summaryBox.innerHTML = `
            <div style="display:grid; grid-template-columns:1fr 1.5fr; gap:12px;">
                <div style="background:var(--omni-bg-clean, white); border:1px solid var(--omni-card-border-line, #ebdffc); padding:8px 12px; border-radius:8px; text-align:left;">
                    <span style="font-size:10.5px; font-weight:800; color:var(--omni-text-muted, #6a638c); display:block; margin-bottom:2px;">★ 스타포스 총합</span>
                    <span style="font-size:14px; font-weight:900; color:#f97316;">★ ${totalStarforce}개</span>
                </div>
                <div style="background:var(--omni-bg-clean, white); border:1px solid var(--omni-card-border-line, #ebdffc); padding:8px 12px; border-radius:8px; text-align:left; display:flex; gap:12px; align-items:center;">
                    <div>
                        <span style="font-size:10.5px; font-weight:800; color:var(--omni-text-muted, #6a638c); display:block; margin-bottom:2px;">🧬 잠재 등급 분포</span>
                        <div style="display:flex; gap:8px; font-size:10px; font-weight:800; margin-top:2px;">
                            <span style="color:var(--omni-emerald, #15803d);">레전 ${legendCount}</span>
                            <span style="color:var(--omni-amber, #b45309);">유니 ${uniqueCount}</span>
                            <span style="color:var(--omni-slate-primary, #6b21a8);">에픽 ${epicCount}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    window.switchAbilityPreset(num);
};

// ============================================================================
// 🧪 [PART 3] 고도화된 아코디언 심볼 엔진
// ============================================================================

window.calculateSymbolCosts = function(currentLevel, symbolName) {
    if (!currentLevel || currentLevel <= 0) return { next: "0원", total: "0원", spent: "0원" };
    const isAuth = symbolName.includes("어센틱");
    const costMap = {
        "세르니움": [36500000, 91200000, 160700000, 241900000, 331500000, 426200000, 522900000, 618200000, 709000000, 792000000],
        "아르크스": [41700000, 104800000, 186100000, 282200000, 390000000, 506100000, 627400000, 750700000, 872600000, 990000000],
        "오디움": [46900000, 118500000, 211500000, 322500000, 448500000, 586000000, 732000000, 883200000, 1036200000, 1188000000],
        "도원경": [52200000, 132200000, 236800000, 362800000, 507000000, 666000000, 836600000, 1015600000, 1199800000, 1386000000],
        "아르테리아": [57400000, 145900000, 262200000, 403200000, 565500000, 745900000, 941200000, 1148100000, 1363500000, 1584000000],
        "카르시온": [62600000, 159600000, 287600000, 443500000, 624000000, 825800000, 1045800000, 1280600000, 1527100000, 1782000000],
        "탈라하트": [67800000, 173400000, 313000000, 484300000, 682000000, 905000000, 1149000000, 1409000000, 1682000000, 1963000000],
        "기어드락": [73000000, 187200000, 338400000, 524500000, 740000000, 985000000, 1253000000, 1541000000, 1842000000, 2155000000]
    };

    let nextCost = 0; 
    let totalCost = 0; 
    let spentCost = 0;

    if (isAuth) {
        const nameKey = Object.keys(costMap).find(k => symbolName.includes(k)) || "세르니움";
        const costs = costMap[nameKey];
        
        for (let i = 0; i < currentLevel - 1; i++) {
            spentCost += (costs[i] || 0);
        }
        
        if (currentLevel < 11) {
            nextCost = costs[currentLevel - 1] || 0;
            for (let i = currentLevel - 1; i < 10; i++) totalCost += (costs[i] || 0);
        } else {
            totalCost = spentCost;
        }
    } else {
        for (let i = 1; i < currentLevel; i++) {
            spentCost += (i * 2800000);
        }
        
        if (currentLevel < 20) {
            nextCost = currentLevel * 2800000; 
            for (let i = currentLevel; i < 20; i++) totalCost += (i * 2800000);
        } else {
            totalCost = spentCost;
        }
    }

    const fmt = (v) => (v ? (v / 100000000 >= 1 ? (v / 100000000).toFixed(1) + "억" : (v / 10000).toLocaleString() + "만") + " 메소" : "0원");
    return { 
        next: fmt(nextCost), 
        total: fmt(totalCost),
        spent: fmt(spentCost)
    };
};

window.renderSymbols = function(symbolData) {
    const symbolBox = document.getElementById('res_symbol_info');
    if (!symbolBox) return;
    if (!symbolData) symbolData = { symbol: [] };

    const allGrand = [
        { name: "탈라하트", icon: "https://open.api.nexon.com/static/maplestory/Mvp/Symbol_Grand_Talahrth.png" },
        { name: "기어드락", icon: "https://open.api.nexon.com/static/maplestory/Mvp/Symbol_Grand_Geardrak.png" }
    ];

    if (!symbolData.symbol) symbolData.symbol = [];
    
    allGrand.forEach(item => {
        if (!symbolData.symbol.some(s => s.symbol_name.includes(item.name))) {
            symbolData.symbol.push({
                symbol_name: "그랜드 어센틱심볼 : " + item.name,
                symbol_level: 0,
                symbol_force: 0,
                symbol_icon: item.icon
            });
        }
    });

    const effects = {
        "세르니움": "세렌 격파 댐증 +20% / 경+10%",
        "아르크스": "칼로스 격파 댐증 +20% / 경+10%",
        "오디움": "감시자 격파 댐증 +20% / 경+10%",
        "도원경": "카링 격파 댐증 +20% / 경+10%",
        "아르테리아": "림보 격파 댐증 +20% / 경+10%",
        "카르시온": "근원 공격 댐증 +20% / 경+10%",
        "탈라하트": "댐증+20%/경+10%/아획+5%/메획+5%",
        "기어드락": "댐증+20%/경+10%/아획+5%/메획+5%"
    };

    let totalArcaneForce = 0;
    let totalAuthForce = 0;

    symbolData.symbol.forEach(s => {
        const fv = Number(s.symbol_force) || 0;
        if (s.symbol_name.includes("어센틱")) totalAuthForce += fv;
        else totalArcaneForce += fv;
    });

    const arcanePops = totalArcaneForce >= 1320 ? "🔴 최상위 150% 포뻥 완수" : totalArcaneForce >= 1100 ? "🟡 하드 보스 130% 라인 확보" : "⚪ 일반 100% 구간";
    const authPops = totalAuthForce >= 500 ? "🔴 카르시온 125% 만능 포뻥" : totalAuthForce >= 300 ? "🟡 에픽레이드 110% 가동선" : "⚪ 성장 스펙 필요";

    const arcaneList = symbolData.symbol.filter(s => !s.symbol_name.includes("어센틱"));
    const authList = symbolData.symbol.filter(s => s.symbol_name.includes("어센틱") && !s.symbol_name.includes("그랜드"));
    const grandList = symbolData.symbol.filter(s => s.symbol_name.includes("그랜드"));

    const renderItem = (s) => {
        const isAuth = s.symbol_name.includes("어센틱");
        const isMax = isAuth ? (s.symbol_level >= 11) : (s.symbol_level >= 20);
        const costs = window.calculateSymbolCosts(s.symbol_level, s.symbol_name);
        const name = s.symbol_name.split(' : ')[1] || s.symbol_name;
        
        let goalHtml = "";
        if (s.symbol_level > 0 && isAuth) {
            const effectStr = effects[name] || "효과 없음";
            goalHtml = `<div style="margin-top:5px; font-weight:700; border-top:1px solid var(--omni-card-border-line, #ebdffc); padding-top:4px; font-size:10px;"><span style="color:var(--omni-slate-primary, #7a6ec7);">${s.symbol_level >= 11 ? "효과:" : "11렙 달성 시:"}</span> <span style="color:var(--omni-text-muted, #6a638c);">${effectStr}</span></div>`;
        }

        return `
            <div style="background: var(--omni-bg-clean, #ffffff); border: 1px solid var(--omni-card-border-line, #ebdffc); border-radius: 10px; padding: 10px; margin-bottom: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <img src="${s.symbol_icon}" style="width:18px; height:18px;" onerror="this.style.display='none'">
                        <span style="font-size: 12px; font-weight: 800; color: var(--omni-text-dark, #312e4b);">${name}</span>
                    </div>
                    <span style="color:var(--omni-slate-primary, #7a6ec7); font-weight:900; font-size:11px;">Lv.${s.symbol_level}</span>
                </div>
                <div style="font-size: 10.5px; font-weight: 700; color: var(--omni-text-muted, #6a638c); display: flex; flex-direction: column; gap: 3px; text-align: left;">
                    <div style="display:flex; justify-content:space-between;"><span>포스 능력치:</span> <span style="color:var(--omni-text-dark, #312e4b); font-weight:900;">+${s.symbol_force}</span></div>
                    ${s.symbol_level > 0 ? (!isMax ? `
                        <div style="display:flex; justify-content:space-between;"><span>다음 레벨업:</span> <span style="color:#f59e0b;">${costs.next}</span></div>
                        <div style="display:flex; justify-content:space-between;"><span>여태 쓴 비용:</span> <span style="color:var(--omni-text-muted, #6a638c); font-weight:800;">${costs.spent}</span></div>
                        <div style="display:flex; justify-content:space-between;"><span>만렙 총 비용:</span> <span style="color:var(--omni-text-dark, #312e4b); font-weight:900;">${costs.total}</span></div>` 
                        : `<div style="color:var(--omni-emerald, #16a34a); font-weight:900; background:var(--omni-card-bg, #dcfce7); padding:2px 6px; border-radius:4px; text-align:center; margin-top:2px;">🏆 만렙 달성 (총 ${costs.total} 소모됨)</div>`) 
                        : '<div style="color:var(--omni-text-sub, #b2acc7); text-align:center;">미개방 심볼 영역</div>'}
                    ${goalHtml}
                </div>
            </div>
        `;
    };

    const buildSection = (title, id, list, popInfo) => {
        if (list.length === 0) return "";
        return `
            <div style="margin-bottom: 8px;">
                <div onclick="window.toggleSymbolSection('${id}')" style="cursor:pointer; display:flex; justify-content:space-between; align-items:center; background:var(--omni-card-bg, #fbfaff); padding:9px 12px; border-radius:10px; font-size:11px; font-weight:900; color:var(--omni-slate-primary, #7a6ec7); border:1px solid var(--omni-card-border-line, #ebdffc); transition: 0.2s;">
                    <div style="display:flex; flex-direction:column; align-items:flex-start; gap:2px;">
                        <span>${title}</span>
                        ${popInfo ? `<span style="font-size:8.5px; color:var(--omni-text-muted, #6a638c); font-weight:700;">${popInfo}</span>` : ''}
                    </div>
                    <span id="icon-${id}" style="font-size:9px; color:var(--omni-text-sub, #b2acc7);">▼</span>
                </div>
                <div id="content-${id}" style="display:none; padding:8px 2px 0 2px;">
                    ${list.map(renderItem).join('')}
                </div>
            </div>
        `;
    };

    symbolBox.innerHTML = buildSection("🔮 ARCANE AREA", "arcane", arcaneList, arcanePops) + 
                          buildSection("🔺 AUTHENTIC AREA", "auth", authList, authPops) + 
                          buildSection("👑 GRAND AUTHENTIC", "grand", grandList, "신규 그란디스 심볼");
};

window.toggleSymbolSection = function(id) {
    const content = document.getElementById('content-' + id);
    const icon = document.getElementById('icon-' + id);
    if (!content || !icon) return;
    
    if (content.style.display === "none") {
        content.style.display = "block";
        icon.innerText = "▲";
        icon.style.color = "var(--omni-slate-primary, #7a6ec7)";
    } else {
        content.style.display = "none";
        icon.innerText = "▼";
        icon.style.color = "var(--omni-text-sub, #b2acc7)";
    }
};

// ============================================================================
// 👥 [PART 4] 내장 탭 및 즐겨찾기 서브 모듈 시스템
// ============================================================================

window.switchAbilityPreset = function(num) {
    const data = window.currentSearchData;
    if (!data || !data.ability) return;
    const abiData = data.ability;
    let presetData = abiData[`ability_preset_${num}`];
    let targetPreset = (presetData && presetData.ability_info && presetData.ability_info.length > 0) ? presetData : abiData; 
    const abiList = document.getElementById('res_equip_ability');
    if (!abiList) return;
    
    const fame = abiData.remain_fame ? Number(abiData.remain_fame).toLocaleString() : '0';
    let html = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px dashed var(--omni-card-border-line, #ebdffc); padding-bottom:6px;"><span style="color:var(--omni-text-muted, #6a638c); font-size:11px; font-weight:800;">보유 명성치</span><span style="color:var(--omni-text-dark, #312e4b); font-size:12px; font-weight:900;">${fame}</span></div>`;
    
    if (targetPreset.ability_info) {
        html += targetPreset.ability_info.map(a => {
            let color = "var(--omni-text-muted, #6a638c)"; 
            if(a.ability_grade === "레전드리") color = "var(--omni-emerald, #15803d)"; 
            else if(a.ability_grade === "유니크") color = "var(--omni-amber, #b45309)"; 
            return `<div style="display:flex; align-items:center; gap:6px; margin-bottom:4px; background:var(--omni-card-bg, #fbfaff); padding:6px 10px; border-radius:6px; border:1px solid var(--omni-card-border-line, #ebdffc); text-align:left;">
                        <span style="color:${color}; font-weight:900; font-size:10px; min-width:44px; flex-shrink:0;">${a.ability_grade.substring(0,3)}</span>
                        <span style="color:var(--omni-text-dark, #312e4b); font-size:11px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;">${a.ability_value}</span>
                    </div>`;
        }).join('');
    } else {
        html += '<div style="font-size:11px; color:var(--omni-text-sub, #b2acc7); padding:5px 0; font-weight:700;">어빌리티 정보가 없습니다.</div>';
    }
    abiList.innerHTML = html;
};

window.switchSearchInternalTab = function(tabName) {
    const contentBox = document.getElementById('searchTabContentContainer');
    const mainGrid = document.getElementById('searchMainGridContent');
    if (!contentBox || !mainGrid) return;

    document.querySelectorAll('.search-tab-trigger-btn').forEach(btn => {
        if (btn.innerText.trim() === tabName) {
            btn.style.background = 'var(--omni-slate-primary, #7a6ec7)';
            btn.style.color = 'var(--omni-badge-text, #ffffff)';
        } else {
            btn.style.background = 'transparent';
            btn.style.color = 'var(--omni-text-muted, #6a638c)';
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
    } else if (tabName === '업적') {
        contentBox.style.display = 'block';
        mainGrid.style.display = 'none';
        // 💡 [코드 분리 가이드] 신설 파일 search_achievement.js에 위치한 넥슨 동기화 모듈을 트래거링합니다.
        contentBox.innerHTML = typeof window.renderAchievementsModule === 'function' ? window.renderAchievementsModule() : ''; 
    } else if (tabName === '부캐') {
        contentBox.style.display = 'block';
        mainGrid.style.display = 'none';
        contentBox.innerHTML = window.renderSubCharactersModule(); 
    }
};

/**
 * 💡 [초보자 가이드 - 100% 라이브 부캐 정산 매너]
 * 기존의 더미 계정을 완전히 추방하고, api.js에서 합산해 온 유니온 레이더(`union_block`) 패킷의 
 * 전체 월드 공격대원 명단을 루프 처리하여 스캔 출력합니다.
 */
window.renderSubCharactersModule = function() {
    const data = window.currentSearchData;
    
    // 💡 [핵심 연동] 넥슨 OpenAPI의 공격대원 블록 배열 수집 (`union.union_block`)
    const raiderList = data?.union?.union_block || [];
    const currentMainChar = data?.basic?.character_name || "";
    
    let listHtml = "";

    // 💡 공격대원 명단이 비어있지 않다면, 100% 실시간 오픈 API 데이터로 카드를 렌더링합니다.
    if (raiderList.length > 0) {
        raiderList.forEach(c => {
            // 현재 상세 조회 중인 본캐릭터 닉네임은 부캐 리스트 명단에서 제외 처리합니다.
            if (c.character_name === currentMainChar) return;

            listHtml += `
                <div onclick="if(typeof window.startOmniSearch === 'function') window.startOmniSearch('${c.character_name}')" 
                     style="background: var(--omni-bg-clean, #ffffff); border: 1px solid var(--omni-card-border-line, #ebdffc); border-radius: 12px; padding: 14px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: 0.15s; box-shadow: 0 2px 6px rgba(122,110,199,0.01);" 
                     onmouseenter="this.style.borderColor='var(--omni-slate-primary, #7a6ec7)'; this.style.background='var(--omni-hover-point, #fbfaff)';" 
                     onmouseleave="this.style.borderColor='var(--omni-card-border-line, #ebdffc)'; this.style.background='var(--omni-bg-clean, #ffffff)';">
                    <div style="text-align: left; width: 100%;">
                        <strong style="font-size: 13px; color: var(--omni-text-dark, #312e4b); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${c.character_name}</strong>
                        <div style="font-size: 11px; color: var(--omni-text-muted, #6a638c); margin-top: 4px; display: flex; justify-content: space-between;">
                            <span>Lv.${c.character_level}</span>
                            <span style="color: var(--omni-slate-primary, #7a6ec7); font-weight: 700;">${c.character_class}</span>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    // 공격대원 리스트가 아예 잡히지 않거나 본캐 외에 부캐가 존재하지 않을 때의 가드 레이아웃
    if (!listHtml) {
        listHtml = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px 0; color: var(--omni-text-sub, #b2acc7); font-weight: 700; font-size: 12.5px;">
                📡 현재 캐릭터가 포함된 유니온 공격대원(부캐릭터) 식별 패킷이 존재하지 않습니다.
            </div>
        `;
    }

    return `
        <div style="background: var(--omni-bg-clean, #ffffff); border-radius: 20px; padding: 24px; border: 1px solid var(--omni-card-border-line, #ebdffc); box-shadow: 0 10px 25px -5px rgba(122, 110, 199, 0.02); animation: omniViewportShow 0.25s ease; text-align:left;">
            <div style="border-left: 4px solid var(--omni-slate-primary, #7a6ec7); padding-left: 12px; margin-bottom: 16px;">
                <h3 style="margin: 0; font-size: 15px; font-weight: 900; color: var(--omni-text-dark, #312e4b);">👥 계정 공유 유니온 공격대 실시간 부캐 명세표</h3>
                <span style="font-size: 11px; color: var(--omni-text-muted, #6a638c); font-weight: 700;">넥슨 유니온 데이터베이스에서 추출한 월드 내 공격대 배치 명단입니다. (클릭 시 해당 캐릭터로 스캔 전환)</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
                ${listHtml}
            </div>
        </div>
    `;
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
        wrapper.style.cssText = "display: inline-flex; align-items: center; background: var(--omni-card-bg, #fbfaff); padding: 4px 10px; border-radius: 6px; border: 1px solid var(--omni-card-border-line, #ebdffc); margin: 2px; cursor: pointer; height: 26px; box-sizing: border-box;";
        wrapper.innerHTML = `
            <span style="color: var(--omni-text-muted, #6a638c); font-weight: 800; font-size: 11.5px; white-space: nowrap;">${char.name}</span>
            <span onclick="window.deleteRecentSearch(event, '${char.name}')" style="display: inline-flex; align-items: center; justify-content: center; margin-left: 6px; width: 14px; height: 14px; background: #fff1f2; color: #e11d48; border-radius: 4px; font-size: 9px; font-weight: 900; cursor: pointer;">✕</span>
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
        btn.style.background = 'var(--omni-slate-primary, #7a6ec7)'; btn.style.color = 'white'; btn.innerText = '★ 즐겨찾기 해제'; 
    } else { 
        btn.style.background = 'var(--omni-bg-clean, #ffffff)'; btn.style.color = 'var(--omni-text-muted, #6a638c)'; btn.innerText = '⭐ 즐겨찾기 등록'; 
    }
};

window.renderFavorites = function() {
    const favBox = document.getElementById('favoriteListContainer');
    if (!favBox) return;
    let favorites = JSON.parse(localStorage.getItem('maple_favorites') || '[]');
    
    favBox.innerHTML = favorites.length === 0 
        ? '<div style="font-size:11.5px; color:var(--omni-text-sub, #b2acc7); text-align:center; padding:15px 0; font-weight:700;">등록된 즐겨찾기가 없습니다.</div>' 
        : favorites.map(name => `
            <div onclick="if(typeof window.startOmniSearch === 'function') window.startOmniSearch('${name}');" style="background:var(--omni-card-bg, #fbfaff); border:1px solid var(--omni-card-border-line, #ebdffc); padding:10px 14px; border-radius:10px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; transition:all 0.15s;" onmouseenter="this.style.borderColor='var(--omni-slate-primary, #7a6ec7)'" onmouseleave="this.style.borderColor='var(--omni-card-border-line, #ebdffc)'">
                <span style="font-weight:800; color:var(--omni-text-dark, #312e4b); font-size:12.5px;">${name}</span>
                <span style="font-size:11px; color:var(--omni-slate-primary, #7a6ec7); font-weight:900;">➔</span>
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
    
    setTimeout(() => {
        const lastData = localStorage.getItem('omni_last_data');
        if (lastData) {
            try {
                const d = JSON.parse(lastData);
                window.renderSearchDetail(d.basic, d.stat, d.item, d.ability, d.symbol, d.dojang, d.union, d.ranking, d.link_skill, d.hexa_skill, d.skill, d.hexa_stat);
            } catch(e) { console.error("인트로 간섭 우회 캐시 로드 실패:", e); }
        }
    }, 150);
});