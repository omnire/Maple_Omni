/**
 * ============================================================================
 * 👤 MAPLE OMNI - search_core.js (내실)
 * 설명: 기본 프로필 렌더링, 장비 슬롯, 프리셋, 심볼 계산, 어빌리티 기능 담당
 * ============================================================================
 * 💡 [초보자 가이드]
 * 이 파일은 검색 완료된 캐릭터 정보를 바탕으로 메인 스탯 대시보드 화면을 채워주며,
 * 사용자가 메뉴 안의 '내실' 이나 '유니온' 서브 탭을 클릭해 넘나들 수 있는 다리 역할을 수행합니다.
 * * 💡 [업데이트 내역]
 * 옴니 빌더(builder.js)와 완벽히 동일한 5x6 인게임 장비 슬롯 레이아웃과 
 * 빈 슬롯(비활성화 슬롯 포함) 디자인이 적용되었습니다.
 */

// ==========================================
// 1. 메인 렌더링 (검색 완료 후 데이터 적용)
// ==========================================
window.renderSearchDetail = function(basic, stat, item, ability, symbol, dojang, union, ranking) {
    const container = document.getElementById('charDetailContainer');
    if (!container) return; 

    const classRank = ranking?.class || 0;
    const worldRank = ranking?.world || 0;

    window.saveRecentSearch(basic.character_name);
    window.currentSearchData = { basic, stat, item, ability, symbol, dojang, union, ranking };

    const power = stat?.final_stat?.find(s => s.stat_name === "전투력")?.stat_value || "0";
    const mainStat = stat?.final_stat?.find(s => s.stat_name === "주스탯")?.stat_value || "-";
    const hp = stat?.final_stat?.find(s => s.stat_name === "HP")?.stat_value || "-";
    const worldGuildText = basic.character_guild_name ? `${basic.world_name} / ${basic.character_guild_name}` : basic.world_name;
    
    const tabs = ['내실', '유니온', '코디', '업적', '부캐'];
    const cardStyle = "background: white; border-radius: 20px; padding: 20px; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);";
    const h4Style = "margin: 0 0 16px 0; font-size: 14px; font-weight: 800; color: #1e293b; display: flex; align-items: center; gap: 8px;";

    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.backgroundColor = "#fcfcfd"; 
    container.style.padding = "20px";
    container.style.borderRadius = "24px";
    
    container.innerHTML = `
        <div style="background: white; border-radius: 20px; padding: 24px; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: 20px; display: flex; align-items: center; gap: 24px;">
            <div style="width: 120px; height: 120px; background: #f8fafc; border-radius: 16px; overflow:hidden; flex-shrink: 0; border: 1px solid #e2e8f0;">
                <img src="${basic.character_image}" class="char-profile-img">
            </div>
            <div style="flex-grow: 1;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                    <h3 id="res_profileName" style="margin: 0; font-size: 24px; font-weight: 800; color: #1e293b;">${basic?.character_name}</h3>
                    <span style="font-size: 11px; color: #64748b; display: flex; align-items: center; gap: 4px; margin-left: 4px;">
                        <span>🍀</span> 현재 아획/메획 셋팅입니다
                    </span>
                    <button type="button" id="btn_favorite" onclick="window.toggleFavorite()" style="margin-left: auto; background: #fff; border: 1px solid #e2e8f0; padding: 6px 16px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 700; color: #64748b;">⭐ 즐겨찾기</button>
                </div>
                
                <div style="font-size: 14px; font-weight: 700; color: #334155; margin-bottom: 4px;">
                    Lv.${basic.character_level} | ${basic.character_class}
                </div>
                
                <div style="display: flex; gap: 24px; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 20px;">
                    ${[
                        {l:'전투력', v: (power) ? Number(power).toLocaleString() : '-'},
                        {l:'주스탯', v: (mainStat) ? mainStat : '-'},
                        {l:'유니온', v: (union?.union_level) ? union.union_level : '-'},
                        {l:'무릉', v: (dojang?.dojang_best_floor) ? dojang.dojang_best_floor + '층' : '-'},
                        {l:'월드순위', v: (worldRank > 0) ? worldRank + '위' : '-'}
                    ].map(item => `
                        <div style="display: flex; align-items: baseline; gap: 6px;">
                            <span style="font-size: 11px; color: #94a3b8; font-weight: 700; letter-spacing: -0.2px;">${item.l}</span>
                            <span style="font-size: 14px; font-weight: 700; color: #1e293b;">${item.v}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div id="dopingListContainer" style="margin-top: 10px;">
                </div>
            </div>
        </div>

        <div style="display: flex; gap: 12px; margin-bottom: 20px; padding-left: 4px;">
            ${tabs.map(tab => `<button class="tab-btn" onclick="window.switchTab('${tab}')" style="padding: 8px 20px; border:none; background:white; border-radius:10px; font-weight:700; cursor:pointer; font-size:13px; color:#64748b; border:1px solid #e2e8f0;">${tab}</button>`).join('')}
        </div>
        
        <div id="tabContentContainer"></div>

        <div id="mainGridContent" style="display: grid; grid-template-columns: 250px 1fr 250px; gap: 20px; align-items: start; width: 100%;">
            <div style="display: flex; flex-direction: column; gap: 20px;">
                <div style="${cardStyle}">
                    <h4 style="${h4Style}">⚔️ 장비 착용 슬롯</h4>
                    <div id="res_equip_slot_grid" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px;"></div>
                </div>
                <div style="${cardStyle}">
                    <h4 style="${h4Style}">✨ 심볼 현황</h4>
                    <div id="res_symbol_info"></div>
                </div>
            </div>
            
            <div style="${cardStyle}">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h4 style="margin: 0; font-size: 15px; font-weight: 800;">🎒 장비 상세 및 프리셋</h4>
                    <div id="itemPresetBtns" style="display: flex; gap: 4px; background: #f1f5f9; padding: 4px; border-radius: 8px;">
                        ${[1,2,3].map(n => `<button class="preset-btn" onclick="window.switchItemPreset(${n})" style="padding: 4px 12px; font-size:12px; border:none; border-radius:6px; cursor:pointer;">${n}</button>`).join('')}
                    </div>
                </div>
                <div id="res_itemGrid"></div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 20px;">
                <div style="${cardStyle}">
                    <h4 style="${h4Style}">⭐ 즐겨찾기</h4>
                    <div id="favoriteListContainer"></div>
                </div>
                <div style="${cardStyle}">
                    <h4 style="${h4Style}">🧬 어빌리티</h4>
                    <div id="res_equip_ability"></div>
                </div>
            </div>
        </div>
    `;
    
    try {
        window.switchItemPreset(1);       
        window.switchAbilityPreset(1);    
        window.renderFavorites();         
        window.renderRecentSearchesMain();
        window.renderSymbols(symbol);     
        window.updateFavoriteBtnState(basic.character_name); 
        window.switchTab('내실'); // 처음 화면 로드 시 '내실' 내용을 활성화합니다.
    } catch (e) { 
        console.error("Rendering Error:", e);
    }
};


// ==========================================
// 2. 장비 및 어빌리티 프리셋 기능
// ==========================================
window.switchItemPreset = function(num) {
    document.querySelectorAll('#itemPresetBtns .preset-btn').forEach((btn, i) => { 
        btn.classList.toggle('active', i + 1 === num); 
        btn.style.background = (i + 1 === num) ? 'var(--point-orange)' : '#f1f5f9';
        btn.style.color = (i + 1 === num) ? 'white' : '#64748b';
    });

    const data = window.currentSearchData;
    if (!data || !data.item) return;
    const itemData = data.item;
    let presetData = itemData[`item_equipment_preset_${num}`];
    let equipList = (presetData && presetData.length > 0) ? presetData : itemData.item_equipment;
    
    const listGrid = document.getElementById('res_itemGrid');
    const slotBox = document.getElementById('res_equip_slot_grid'); 
    const borderGradeColor = { "레전드리": "#22c55e", "유니크": "#f59e0b", "에픽": "#a855f7", "레어": "#0ea5e9" };
    const gradeColor = { "레전드리": "#15803d", "유니크": "#b45309", "에픽": "#6b21a8", "레어": "#0369a1" };
    
    // 💡 [변경됨] builder.js 와 동일한 인게임 5x6 장비 슬롯 레이아웃 (총 30칸)
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
        return txt.replace("보스 몬스터 공격 시 데미지", "보공")
                  .replace("보스 몬스터 데미지", "보공")
                  .replace("몬스터 방어율 무시", "방무")
                  .replace("크리티컬 데미지", "크뎀")
                  .replace("아이템 드롭률", "아획")
                  .replace("메소 획득량", "메획")
                  .replace("최대 HP", "HP")
                  .replace(" : ", ":"); 
    };

    if (slotBox && equipList) {
        let gHtml = ""; 
        slotOrder.forEach(sName => {
            if (sName) {
                // 상의/한벌옷, 펜던트1, 뱃지 등 예외 매핑 처리 포함
                let item = equipList.find(eq => 
                    eq.item_equipment_slot === sName || 
                    (sName === "상의" && eq.item_equipment_slot === "한벌옷") || 
                    (sName === "펜던트1" && eq.item_equipment_slot === "펜던트") || 
                    (sName === "뱃지" && eq.item_equipment_slot === "배지")
                );

                if (item) { 
                    let bColor = borderGradeColor[item.potential_option_grade] || "#e2e8f0"; 
                    gHtml += `<div onmouseenter="window.showTooltip(event, '${sName}', ${num})" onmousemove="window.moveTooltip(event)" onmouseleave="window.hideTooltip()" style="background:#ffffff; border-radius:10px; border:1.5px solid ${bColor}; display:flex; align-items:center; justify-content:center; aspect-ratio:1/1; cursor:pointer; overflow:hidden;"><img src="${item.item_icon}" style="max-width:85%; max-height:85%; object-fit:contain; pointer-events:none;"></div>`; 
                } else { 
                    // 💡 장착되지 않은 유효 슬롯 (옴니 빌더 스타일 렌더링)
                    let shortName = sName.length > 3 ? sName.substring(0, 2) : sName;
                    if (sName === "포켓 아이템") shortName = "포켓";
                    if (sName === "기계 심장") shortName = "심장";

                    gHtml += `<div style="background:#f8fafc; border-radius:10px; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; aspect-ratio:1/1;">
                        <span style="font-size:9px; color:#cbd5e1; font-weight:800; text-align:center;">${shortName}</span>
                    </div>`; 
                }
            } else {
                // 💡 사용하지 않는 빈 공간(null) 슬롯 디자인
                gHtml += `<div style="background:#cbd5e1; border-radius:10px; border:1px dashed #94a3b8; opacity:0.15; aspect-ratio:1/1;"></div>`;
            }
        });
        slotBox.innerHTML = gHtml;
    }

    if (listGrid && equipList) {
        let listHtml = `<div style="display:grid !important; grid-template-columns: repeat(2, 1fr) !important; gap:12px; width:100%; box-sizing: border-box;">`;
        equipList.forEach(item => {
            let bColor = borderGradeColor[item.potential_option_grade] || "#e2e8f0";
            let starHtml = (parseInt(item.starforce) > 0) ? `<span style="color:#f59e0b; font-size:11px; font-weight:900; margin-left:5px;">★${item.starforce}</span>` : '';
            let potStr = "";
            const renderOptions = (grade, opt1, opt2, opt3) => { 
                if (!grade) return ""; 
                let options = [opt1, opt2, opt3].filter(Boolean).map(shortPot).join(' / '); 
                let color = gradeColor[grade] || "#64748b"; 
                return `<div style="color:${color}; font-size:11px; font-weight:700; margin-top:3px; word-break:break-all; line-height:1.4;"><span style="font-size:9px; background:#f8fafc; padding:1px 4px; border-radius:4px; margin-right:4px; border:1px solid ${color}33; display:inline-block; vertical-align:middle;">${grade.charAt(0)}</span><span style="vertical-align:middle;">${options}</span></div>`; 
            };
            potStr += renderOptions(item.potential_option_grade, item.potential_option_1, item.potential_option_2, item.potential_option_3);
            potStr += renderOptions(item.additional_potential_option_grade, item.additional_potential_option_1, item.additional_potential_option_2, item.additional_potential_option_3);
            
            listHtml += `
            <div onmouseenter="window.showTooltip(event, '${item.item_equipment_slot}', ${num})" onmousemove="window.moveTooltip(event)" onmouseleave="window.hideTooltip()" style="background:#fff; border:1px solid ${bColor}; border-radius:12px; padding:12px; display:flex; align-items:center; gap:12px; box-shadow:0 2px 6px rgba(0,0,0,0.02); cursor:pointer;">
                <div style="width:42px; height:42px; flex-shrink:0; background:#f8fafc; border-radius:10px; display:flex; align-items:center; justify-content:center; border:1px solid #e2e8f0; overflow:hidden;">
                    <img src="${item.item_icon}" style="max-width:85%; max-height:85%; object-fit:contain;">
                </div>
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:800; font-size:12px; color:#1e293b; margin-bottom:2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.item_name}${starHtml}</div>
                    ${potStr}
                </div>
            </div>`;
        });
        listGrid.innerHTML = listHtml + `</div>`;
    }

    window.switchAbilityPreset(num);
};

window.switchAbilityPreset = function(num) {
    document.querySelectorAll('#abilityPresetBtns .preset-btn').forEach((btn, i) => { 
        btn.classList.toggle('active', i + 1 === num);
        btn.style.background = (i + 1 === num) ? 'var(--point-blue)' : '#f1f5f9'; 
        btn.style.color = (i + 1 === num) ? '#fff' : '#64748b'; 
    });

    const data = window.currentSearchData;
    if (!data || !data.ability) return;
    const abiData = data.ability;
    let presetData = abiData[`ability_preset_${num}`];
    let targetPreset = (presetData && presetData.ability_info && presetData.ability_info.length > 0) ? presetData : abiData; 
    const abiList = document.getElementById('res_equip_ability');
    if (!abiList) return;
    
    const fame = abiData.remain_fame ? Number(abiData.remain_fame).toLocaleString() : '0';
    let html = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px dashed #e2e8f0; padding-bottom:10px;"><span style="color:#64748b; font-size:12px; font-weight:800;">보유 명성치</span><span style="color:#1e293b; font-size:14px; font-weight:900;">${fame}</span></div>`;
    
    if (targetPreset.ability_info) {
        html += targetPreset.ability_info.map(a => {
            let color = "#64748b"; 
            if(a.ability_grade === "레전드리") color = "#15803d"; 
            else if(a.ability_grade === "유니크") color = "#b45309"; 
            
            return `<div title="${a.ability_value}" style="display:flex; align-items:flex-start; gap:10px; margin-bottom:6px; background:#ffffff; padding:10px 14px; border-radius:10px; border:1px solid #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
                        <span style="color:${color}; font-weight:900; font-size:11px; min-width:60px; flex-shrink:0;">${a.ability_grade}</span>
                        <span style="color:#1e293b; font-size:11.5px; font-weight:700; line-height:1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-all;">${a.ability_value}</span>
                    </div>`;
        }).join('');
        abiList.innerHTML = html;
    }
};

// ==========================================
// 3. 심볼 계산 및 렌더링
// ==========================================
window.calculateSymbolCosts = function(currentLevel, symbolName) {
    if (!currentLevel || currentLevel <= 0) return { next: "0원", total: "0원" };
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

    let nextCost = 0; let totalCost = 0;
    if (isAuth) {
        const nameKey = Object.keys(costMap).find(k => symbolName.includes(k)) || "세르니움";
        const costs = costMap[nameKey];
        if (currentLevel < 11) {
            nextCost = costs[currentLevel - 1] || 0;
            for (let i = currentLevel - 1; i < 10; i++) totalCost += (costs[i] || 0);
        }
    } else {
        nextCost = currentLevel * 2800000; 
        for (let i = currentLevel; i < 20; i++) totalCost += (i * 2800000);
    }
    const fmt = (v) => (v ? v.toLocaleString('ko-KR') + "원" : "0원");
    return { next: fmt(nextCost), total: fmt(totalCost) };
};

window.renderSymbols = function(symbolData) {
    const symbolBox = document.getElementById('res_symbol_info');
    if (!symbolBox) return;

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
        "세르니움": "세렌 공격 시 데미지 +20% / 경+10%",
        "아르크스": "칼로스 공격 시 데미지 +20% / 경+10%",
        "오디움": "최초의 대적자 공격 시 데미지 +20% / 경+10%",
        "도원경": "카링 공격 시 데미지 +20% / 경+10%",
        "아르테리아": "찬란한 흉성 공격 시 데미지 +20% / 경+10%",
        "카르시온": "림보 공격 시 데미지 +20% / 경+10%",
        "탈라하트": "발드릭스 공격 시 데미지 +20% / 경+10% / 아획+5% / 메획+5%",
        "기어드락": "유피테르 공격 시 데미지 +20% / 경+10% / 아획+5% / 메획+5%"
    };

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
            goalHtml = `<div style="margin-top:6px; font-weight:700; border-top:1px solid #f1f5f9; padding-top:4px;"><span style="color:#e11d48;">${s.symbol_level >= 11 ? "효과:" : "11레벨 달성 시:"}</span> <span style="color:#475569;">${effectStr}</span></div>`;
        }

        return `
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 6px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <img src="${s.symbol_icon}" style="width:20px; height:20px;">
                    <span style="font-size: 13px; font-weight: 800; color: #1e293b;">${name} <span style="color:#64748b; font-weight:600;">Lv.${s.symbol_level}</span></span>
                </div>
                <div style="font-size: 11px; font-weight: 700; color: #475569; display: flex; flex-direction: column; gap: 4px;">
                    <div>포스: +${s.symbol_force}</div>
                    ${s.symbol_level > 0 ? (!isMax ? `
                        <div>렙업비용: <span style="color:#f59e0b;">${costs.next}</span></div>
                        <div>총 합 비용: <span style="color:#1e293b;">${costs.total}</span></div>` 
                        : '<div style="color:#10b981;">만렙 달성</div>') 
                        : '<div style="color:#94a3b8;">미보유</div>'}
                    ${goalHtml}
                </div>
            </div>
        `;
    };

    const buildSection = (title, id, list) => {
        if (list.length === 0) return "";
        return `
            <div style="margin-bottom: 10px;">
                <div onclick="window.toggleSymbolSection('${id}')" style="cursor:pointer; display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:8px 12px; border-radius:6px; font-size:11px; font-weight:800; color:#475569; border:1px solid #e2e8f0; margin-bottom:5px;">
                    ${title} <span id="icon-${id}">▼</span>
                </div>
                <div id="content-${id}" style="display:none;">
                    ${list.map(renderItem).join('')}
                </div>
            </div>
        `;
    };

    symbolBox.innerHTML = buildSection("ARCANE FORCE", "arcane", arcaneList) + 
                          buildSection("AUTHENTIC FORCE", "auth", authList) + 
                          buildSection("GRAND AUTHENTIC", "grand", grandList);
};

window.toggleSymbolSection = function(id) {
    const content = document.getElementById('content-' + id);
    const icon = document.getElementById('icon-' + id);
    if (!content || !icon) return;
    
    if (content.style.display === "none") {
        content.style.display = "block";
        icon.innerText = "▲";
    } else {
        content.style.display = "none";
        icon.innerText = "▼";
    }
};