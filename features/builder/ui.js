/**
 * ============================================================================
 * 🛠️ builder/ui.js - 화면 렌더링 및 UI 업데이트
 * ============================================================================
 */

window.renderBuilderUI = function() {
    const builder = document.getElementById('omniBuilderSection');
    if (!builder) return;
    
    if (window.currentSearchData) window.builderCurrentData = window.currentSearchData;
    builder.style.display = 'block';
    
    const data = window.builderCurrentData;
    const hasData = data && data.basic;

    const jobGroup = window.getJobGroup(data?.basic?.character_class);
    const atkLabel = (jobGroup === "마법사") ? "마력" : "공격력";
    const statLabel = window.getJobMainStatName(data?.basic?.character_class);

    window.SCROLL_PRESETS = {
        '무기 주문서': {
            'w_15': `무기 15% (${atkLabel}+9, ${statLabel}+4)`,
            'w_30': `무기 30% (${atkLabel}+7, ${statLabel}+3)`,
            'w_70': `무기 70% (${atkLabel}+5, ${statLabel}+2)`,
            'w_100': `무기 100% (${atkLabel}+3, ${statLabel}+1)`
        },
        '방어구 주문서': {
            'a_30': `방어구 30% (${statLabel}+7)`,
            'a_70': `방어구 70% (${statLabel}+4)`,
            'a_100': `방어구 100% (${statLabel}+3)`
        },
        '기타/악세서리': {
            'c_heart': `카르마 스페셜 하트 (${atkLabel}+9, 올스탯+3)`,
            'acc_p': `프리미엄 악세사리 ${atkLabel} 주문서 (+4)`,
            'acc_n': `악세서리 일반 혼줌 (+2)`,
            'sp_good': `놀라운 긍정의 혼돈 주문서 (${atkLabel}+3, 스탯+3)`
        },
        '장비 업그레이드': {
            'd_shard': `비틀린 시간의 파편 (${atkLabel}+3, 올스탯+3)`,
            'custom': '직접 설정 (자유 입력)'
        }
    };

    const titleSection = `
        <div class="omni-title-container" style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9; display: flex; justify-content: center; align-items: center; gap: 8px;">
            <span style="font-size: 36px; font-weight: 900; color: #0f172a; letter-spacing: -1px;">OMNI</span>
            <span style="font-size: 36px; font-weight: 900; color: #2563eb; letter-spacing: -1px;">BUILDER</span>
            <span style="font-size: 10px; background: #eff6ff; color: #2563eb; padding: 4px 10px; border-radius: 20px; font-weight: 800; border: 1px solid #bfdbfe; transform: translateY(-10px);">V1.0 PRO</span>
        </div>
    `;

    let headerSection = '';
    if (hasData) {
        const charName = data.basic.character_name || "이름 없음";
        const charImage = data.basic.character_image || "";
        const charWorld = data.basic.world_name || "-";
        const charClass = data.basic.character_class || "-";
        const charLevel = data.basic.character_level || "0";

        let avatarTag = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:20px;">👤</div>`;
        if (charImage && charImage !== "null") {
            avatarTag = `<img src="${charImage}" onerror="this.style.display='none';" style="width: 700%; height: 700%; object-fit: cover; object-position: 50% 0%; image-rendering: pixelated; display: block;">`;
        }

        headerSection = `
        <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 14px 20px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);">
            <div style="display: flex; gap: 16px; align-items: center; justify-content: space-between; flex-wrap: wrap;">
                <div class="builder-char-card" style="display: flex; align-items: center; gap: 16px;">
                    <div style="width: 48px; height: 48px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center; position: relative;">
                        ${avatarTag}
                    </div>
                    <div>
                        <div style="font-size: 15px; font-weight: 900; color: #0f172a; margin-bottom: 3px; letter-spacing: -0.3px;">${charName}</div>
                        <div style="font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 4px;">Lv.${charLevel} · ${charWorld} · ${charClass}</div>
                        <div id="status_display" style="display: flex; align-items: center; min-height: 20px;"></div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <div style="position: relative; height: 32px; display: flex; align-items: center;">
                        <button onclick="window.saveBossPreset()" style="padding: 8px 14px; background: #ffffff; color: #334155; border: 1px solid #e2e8f0; border-radius: 8px; font-weight: 900; font-size: 11px; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                            💾 API 보스셋팅 기록
                        </button>
                        <span style="position: absolute; top: 100%; left: 0; margin-top: 4px; font-size: 10px; color: #64748b; font-weight: 800; display: flex; align-items: center; gap: 2px; white-space: nowrap;">
                            💡 사냥셋팅 시에도 호출가능
                        </span>
                    </div>
                    <button onclick="window.refreshBuilderData()" style="padding: 8px 14px; background: #2563eb; color: #ffffff; border: none; border-radius: 8px; font-weight: 800; font-size: 11px; cursor: pointer; box-shadow: 0 2px 4px rgba(37,99,235,0.2);">
                        🔄 API 데이터 갱신
                    </button>
                    <div style="display: flex; gap: 8px; align-items: center; background: #f8fafc; padding: 6px 6px 6px 14px; border: 1px solid #e2e8f0; border-radius: 8px; margin-left: 10px;">
                        <span style="font-size: 14px; color: #94a3b8;">🔍</span>
                        <input type="text" id="builder_nick_input" placeholder="다른 캐릭터 변경" onkeypress="if(event.key === 'Enter') window.triggerBuilderSearch()" style="border: none; background: transparent; outline: none; font-size: 12px; font-weight: 700; width: 130px; color: #334155;">
                        <button onclick="window.triggerBuilderSearch()" style="padding: 6px 14px; background: #2563eb; color: #ffffff; border: none; border-radius: 8px; font-weight: 800; font-size: 11px; cursor: pointer;">검색</button>
                    </div>
                </div>
            </div>
        </div>
        `;
    } else {
        headerSection = `
            <div style="margin-bottom: 24px; padding: 20px; background: #ffffff; border: 2px solid #3b82f6; border-radius: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1); display: flex; align-items: center; gap: 12px; max-width: 500px; margin-left: auto; margin-right: auto;">
                <div style="font-size: 20px;">🔍</div>
                <input type="text" id="builder_nick_input" placeholder="시뮬레이션을 시작할 캐릭터 닉네임 입력" onkeypress="if(event.key === 'Enter') window.triggerBuilderSearch()" style="flex: 1; border: none; outline: none; font-size: 14px; font-weight: 800; color: #1e293b; background: transparent;">
                <button onclick="window.triggerBuilderSearch()" style="padding: 10px 24px; background: #2563eb; color: #ffffff; border: none; border-radius: 12px; font-weight: 900; cursor: pointer;">검색하기</button>
            </div>
        `;
    }

    const bodySection = `
        <div class="omni-builder-container" style="display: flex; gap: 20px; align-items: start; opacity: ${hasData ? '1' : '0.5'}; pointer-events: ${hasData ? 'all' : 'none'};">
            
            <div class="builder-sidebar-panel" style="flex: 1.1; display: flex; flex-direction: column; gap: 16px;">
                <div class="builder-panel" style="background: #ffffff; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0;">
                    <div class="panel-title" style="font-weight: 900; font-size: 13px; color: #1e293b; margin-bottom: 12px;">📈 상세 스탯 분석</div>
                    <div id="detailedStatsList" class="omni-scroll" style="font-size: 12px; color: #475569; font-weight: 700; max-height: 400px; overflow-y: auto; padding-right: 6px;"></div>
                    
                    <div style="border-top: 1px dashed #e2e8f0; padding-top: 16px; margin-top: 16px;">
                        <div class="panel-title" style="font-weight: 900; font-size: 12px; color: #334155; margin-bottom: 10px;">🧪 실시간 적용 도핑</div>
                        <div id="dopingList" class="doping-container" style="display: flex; flex-direction: column; gap: 6px; font-size: 11.5px; color: #334155; font-weight: 700;"></div>
                    </div>
                </div>
                <div class="builder-panel" style="background: #ffffff; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0;">
                    <div class="panel-title" style="font-weight: 900; font-size: 13px; color: #1e293b; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">✨ 실시간 세트 효과 매칭</div>
                    <div id="setEffectsList" class="omni-scroll" style="font-size: 12px; color: #475569; font-weight: 700; max-height: 250px; overflow-y: auto; padding-right: 6px;"></div>
                </div>
            </div>

            <div class="inventory-center-box" style="flex: 1.4; background: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; align-items: center;">
                <div class="panel-title" style="font-weight: 900; font-size: 14px; color: #1e293b; margin-bottom: 16px; width: 100%; text-align: left;">🎒 인벤토리 장착 보드</div>
                <div id="builder_current_grid" class="maple-inventory-grid" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px;"></div>
                <div id="preset_btns" style="margin-top: 24px; display: flex; gap: 8px;"></div>
                <div id="spec_diff_container" style="margin-top: 25px; width: 100%; border-top: 2px solid #f1f5f9; padding-top: 15px;">
                    <div class="panel-title" style="font-weight: 900; font-size: 12px; color: #0284c7; margin-bottom: 12px; letter-spacing: 0.5px;">📊 SPEC DIFF ANALYSIS</div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span style="font-size: 12px; color: #64748b; font-weight: 800;">추정 전투력 증감</span>
                        <span id="builderFinalPower" style="font-size: 16px; color: #0284c7; font-weight: 900;">+0</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span style="font-size: 12px; color: #64748b; font-weight: 800;">추정 주스탯 증감</span>
                        <span id="builderFinalStat" style="font-size: 16px; color: #d97706; font-weight: 900;">+0</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 12px; color: #64748b; font-weight: 800;">추정 공/마 증감</span>
                        <span id="builderFinalAtk" style="font-size: 16px; color: #ea580c; font-weight: 900;">+0</span>
                    </div>
                </div>
            </div>

            <div class="builder-right-panel" id="editor_form" style="flex: 1.1; display: flex; flex-direction: column; gap: 16px;">
                <div class="builder-panel" style="background: #ffffff; padding: 18px; border-radius: 16px; border: 1px solid #e2e8f0;">
                    <div class="panel-title" id="edit_slot_name" style="font-weight: 900; font-size: 13px; color: #1e293b; margin-bottom: 14px;">✨ 슬롯 설정을 선택하세요</div>
                    
                    <div id="edit_item_icon" style="width: 64px; height: 64px; margin: 0 auto 14px auto; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: #f8fafc; font-size: 20px;">🖱️</div>
                    
                    <input type="text" id="item_search_filter" placeholder="🔍 아이템 이름 검색 후 목록을 여세요." onkeyup="window.filterItemList()" style="box-sizing: border-box; width: 100%; padding: 8px 10px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 8px; outline: none; background: #ffffff;">
                    
                    <select id="edit_base_item" onchange="window.updateBuilderPreview()" style="width: 100%; padding: 8px 10px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 16px; outline: none; background: #f8fafc;"></select>
                    
                    <div style="background: #ffffff; padding: 14px; border-radius: 12px; font-size: 12px; margin-bottom: 16px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
    ${(() => {
        const className = data?.basic?.character_class || "";
        const jobGroup = window.getJobGroup(className);
        const koreanStat = window.getJobMainStatName(className);
        
        const mapping = { "힘": "STR", "덱": "DEX", "인": "INT", "럭": "LUK" };
        const mainStatKey = mapping[koreanStat] || "STR";
        const mainAtkKey = (jobGroup === "마법사") ? "MATK" : "ATK";

        const activeStyle = "box-sizing: border-box; width: 100%; padding:6px; border:1px solid #fbcfe8; border-radius:6px; background:#fff1f2; color:#be185d; font-size:12px; font-weight:bold; text-align:center; transition: all 0.2s;";
        const normalStyle = "box-sizing: border-box; width: 100%; padding:6px; border:1px solid #cbd5e1; border-radius:6px; background:#f8fafc; color:#334155; font-size:12px; font-weight:bold; text-align:center; transition: all 0.2s;";

        const getStyle = (key) => {
            const isActive = (mainStatKey === key || mainAtkKey === key);
            return isActive ? activeStyle : normalStyle;
        };

        return `
            <div style="font-weight: 900; color: #be185d; margin-bottom: 12px; text-align: center; font-size: 13px; letter-spacing: -0.5px;">🔥 추가옵션 (추옵) 상세 설정</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div style="display:flex; flex-direction:column; gap:3px;"><span style="font-weight:700; color:#64748b; font-size:10px;">STR</span><input type="number" id="addOptStr" onchange="window.updateAddOption('str', this.value)" style="${getStyle('STR')}"></div>
                <div style="display:flex; flex-direction:column; gap:3px;"><span style="font-weight:700; color:#64748b; font-size:10px;">DEX</span><input type="number" id="addOptDex" onchange="window.updateAddOption('dex', this.value)" style="${getStyle('DEX')}"></div>
                <div style="display:flex; flex-direction:column; gap:3px;"><span style="font-weight:700; color:#64748b; font-size:10px;">INT</span><input type="number" id="addOptInt" onchange="window.updateAddOption('int', this.value)" style="${getStyle('INT')}"></div>
                <div style="display:flex; flex-direction:column; gap:3px;"><span style="font-weight:700; color:#64748b; font-size:10px;">LUK</span><input type="number" id="addOptLuk" onchange="window.updateAddOption('luk', this.value)" style="${getStyle('LUK')}"></div>
                <div style="display:flex; flex-direction:column; gap:3px;"><span style="font-weight:700; color:#64748b; font-size:10px;">공격력</span><input type="number" id="addOptAtk" onchange="window.updateAddOption('attack_power', this.value)" style="${getStyle('ATK')}"></div>
                <div style="display:flex; flex-direction:column; gap:3px;"><span style="font-weight:700; color:#64748b; font-size:10px;">마력</span><input type="number" id="addOptMatk" onchange="window.updateAddOption('magic_power', this.value)" style="${getStyle('MATK')}"></div>
                <div style="grid-column: span 2; display:flex; flex-direction:column; gap:3px;"><span style="font-weight:700; color:#be185d; font-size:10px;">올스탯%</span><input type="number" id="addOptAll" onchange="window.updateAddOption('all_stat', this.value)" style="${activeStyle}"></div>
            </div>
        `;
    })()}
                    </div>

                    <div style="background: rgb(248, 250, 252); padding: 14px; border-radius: 10px; font-size: 12px; margin-bottom: 16px; border: 1px solid #e2e8f0;">
                        <div style="margin-bottom: 10px; text-align: center; font-weight: 700; color: #475569;">
                            스타포스: 
                            <button onclick="window.changeBuilderStar(-1)" style="padding: 2px 6px; font-weight: 900; border: 1px solid #cbd5e1; background: #ffffff; border-radius: 6px; cursor: pointer; margin-left: 6px;">-</button>
                            <span id="builderValStar" style="margin: 0 10px; color: #2563eb; font-weight: 900; font-size: 14px;">17성</span>
                            <button onclick="window.changeBuilderStar(1)" style="padding: 2px 6px; font-weight: 900; border: 1px solid #cbd5e1; background: #ffffff; border-radius: 6px; cursor: pointer;">+</button>
                        </div>
                        <button id="btn_scroll_popup" onclick="window.openScrollPopup()" style="width:100%; padding: 8px; cursor: pointer; border: 1px solid #cbd5e1; border-radius: 8px; background: #ffffff; font-weight:800; color: #1e293b;">주문서 상세 설정 ⚙️</button>
                    </div>

                    <div style="border-top: 2px dashed #e2e8f0; padding-top: 16px;">
                        <div class="panel-title" style="font-weight: 900; font-size: 12px; color: #1e293b; margin-bottom: 12px;">✨ 잠재능력 설정</div>
                        <div id="potential_lines_container" style="display:flex; flex-direction:column; gap: 8px;"></div>
                    </div>
                    <div style="border-top: 2px dashed #e2e8f0; padding-top: 16px; margin-top: 16px;">
                        <div class="panel-title" style="font-weight: 900; font-size: 12px; color: #1e293b; margin-bottom: 12px;">🛡️ 에디셔널 잠재능력</div>
                        <div id="additional_potential_lines_container" style="display:flex; flex-direction:column; gap: 8px;"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const modalSection = `
        <div id="scrollPopupModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9999; align-items:center; justify-content:center;">
            <div style="background:#ffffff; padding:28px; border-radius:20px; width:360px; border: 1px solid #e2e8f0;">
                <h3 style="margin:0 0 20px 0; font-size:18px; font-weight:900;">📜 주문서 설정</h3>
                <div style="font-size:12px; font-weight:800; color: #475569; margin-bottom: 8px;">적용된 목록</div>
                <div id="appliedScrollList" style="margin-bottom:20px; max-height:100px; overflow-y:auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; background: #f8fafc;"></div>
                <div style="border-top: 1px solid #e2e8f0; padding-top: 15px;">
                    <select id="scrollPresetSelect" onchange="window.updateScrollPresetInputs()" style="width:100%; padding:10px; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:8px; font-size: 12px; font-weight:700;"></select>
                    <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                        <input type="number" id="manualScrollStat" placeholder="스탯" style="flex:1; padding:8px; border:1px solid #e2e8f0; border-radius:8px;">
                        <input type="number" id="manualScrollAtk" placeholder="공/마" style="flex:1; padding:8px; border:1px solid #e2e8f0; border-radius:8px;">
                    </div>
                    <button onclick="window.addScrollToList()" style="width:100%; padding:10px; border-radius:8px; background:#e0e7ff; color:#4338ca; border:none; font-weight:900; cursor:pointer; margin-bottom: 20px;">+ 목록에 추가</button>
                </div>
                <button onclick="window.applyScrollAndClose()" style="width:100%; padding:14px; border-radius:12px; background:#2563eb; color:#ffffff; border:none; font-weight:900; cursor:pointer;">설정 완료 및 적용</button>
            </div>
        </div>
    `;

    builder.innerHTML = `
        <div style="max-width: 1200px; margin: 0 auto; padding: 10px;">
            ${titleSection}
            ${headerSection}
            ${bodySection}
            ${modalSection}
        </div>
    `;

    document.getElementById('preset_btns').innerHTML = [1,2,3].map(i => `
        <button class="preset-btn" id="p_btn_${i}" onclick="window.changeBuilderPreset(${i})" style="padding: 6px 14px; border: 1px solid #e2e8f0; background: #ffffff; border-radius: 8px; font-size: 11px; font-weight: 900; cursor: pointer; color: #475569; transition: all 0.2s;">프리셋 ${i}</button>
    `).join('');
    
    window.renderDoping();
    window.renderDetailedStats();
    window.initBuilderGrids();
    
    if (hasData) {
        window.changeBuilderPreset(2); 
    }
};

window.renderDetailedStats = function() {
    const container = document.getElementById('detailedStatsList');
    if (!container || !window.activePresetStats) return;
    
    let stats = [...window.activePresetStats];
    const powerIndex = stats.findIndex(s => s.stat_name === "전투력");
    
    if (powerIndex > -1) {
        const powerStat = stats.splice(powerIndex, 1)[0];
        stats.unshift(powerStat); 
    }

    let html = '';
    stats.forEach(s => {
        const safeId = "stat_val_" + s.stat_name.replace(/[^a-zA-Z0-9가-힣]/g, '');
        const isImportant = s.stat_name === "전투력" || s.stat_name === "최대 스탯공격력";
        const valColor = isImportant ? '#0f172a' : '#334155';
        const displayValue = isImportant ? window.formatMapleCP(s.stat_value) : s.stat_value.toLocaleString();
        
        html += `
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
            <span style="color:#64748b; font-weight:800;">${s.stat_name}</span>
            <span style="color:${valColor}; font-weight:900; font-size:12.5px;" id="${safeId}" data-base="${s.stat_value}">${displayValue}</span>
        </div>`;
    });
    
    container.innerHTML = html;
};

window.initBuilderGrids = function() {
    const currentGrid = document.getElementById('builder_current_grid');
    if (!currentGrid) return;
    currentGrid.innerHTML = ''; 
    
    MAPLE_SLOT_NAMES.forEach((slotName, i) => {
        const slot = document.createElement('div');
        slot.className = 'maple-slot';
        slot.style.width = '44px';
        slot.style.height = '44px';
        slot.style.border = '1px solid #e2e8f0';
        slot.style.borderRadius = '10px';
        slot.style.display = 'flex';
        slot.style.alignItems = 'center';
        slot.style.justifyContent = 'center';
        slot.style.cursor = 'pointer';
        slot.style.background = '#f8fafc';
        slot.style.transition = 'all 0.15s ease-in-out';

        if (slotName) {
            slot.onclick = () => window.selectBuilderSlot(i);
            slot.onmouseenter = (e) => {
                if(window.currentSelectedSlotIndex !== i) slot.style.borderColor = '#94a3b8';
                const item = window.builderEquippedItems[i];
                if (item && window.showOmniTooltip) window.showOmniTooltip(e, item); 
            };
            slot.onmouseleave = () => {
                if(window.currentSelectedSlotIndex !== i) slot.style.borderColor = '#e2e8f0';
                if(window.hideOmniTooltip) window.hideOmniTooltip(); 
            }
            
            if (!window.builderCurrentData) {
                slot.innerHTML = `<span style="font-size:9px; color:#cbd5e1; font-weight:800;">${slotName.substring(0,2)}</span>`;
            }
        } else {
            slot.style.opacity = '0.15';
            slot.style.cursor = 'default';
            slot.style.background = '#cbd5e1';
            slot.style.border = '1px dashed #94a3b8';
        }
        currentGrid.appendChild(slot);
    });
};

window.renderDoping = function() {
    const container = document.getElementById('dopingList');
    if (!container) return;
    
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(6, 1fr)';
    container.style.gap = '6px';
    container.style.marginTop = '10px';

    container.innerHTML = Object.keys(DOPING_DATA).map(name => {
        const item = DOPING_DATA[name];
        return `
            <label class="doping-item" style="display: flex; flex-direction: column; align-items: center; border: 1px solid #e2e8f0; border-radius: 8px; padding: 4px; background: #fff; cursor: pointer; transition: 0.2s;" title="${name}">
                <img src="icon/doping/${item.icon}" style="width: 28px; height: 28px; object-fit: contain;" onerror="this.src='icon/placeholder.png'">
                <input type="checkbox" data-name="${name}" onchange="window.calcBuilderStats()" style="margin-top: 4px; cursor:pointer;">
            </label>
        `;
    }).join('');
};

window.renderSetEffects = function() {
    const container = document.getElementById('setEffectsList');
    if (!container) return;
    container.innerHTML = '';

    const setDetails = {
        "보스 장신구 세트": { items: [] },
        "칠흑의 보스 세트": { items: [] },
        "여명의 보스 세트": { items: [] },
        "루타비스 세트": { items: [] },
        "앱솔랩스 세트": { items: [] },
        "아케인셰이드 세트": { items: [] },
        "에테르넬 세트": { items: [] },
    };

    if (!window.builderEquippedItems) return;

    window.builderEquippedItems.forEach(item => {
        if (!item || !item.item_name) return;
        const name = item.item_name;

        if (["응축된 힘", "아쿠아틱", "데아 시두스", "골든 클로버", "분노한 자쿰", "실버블라썸", "고귀한 이피아", "지옥의 불꽃", "매커네이터", "도미네이터", "카오스 혼테일", "핑크빛 성배", "크리스탈 웬투스", "블랙빈 마크", "반 레온의 벨트", "반 레온의 목걸이"].some(k => name.includes(k))) {
            setDetails["보스 장신구 세트"].items.push(name);
        } else if (["마력이 깃든 안대", "루즈 컨트롤", "거대한 공포", "커맨더 포스", "고통의 근원", "몽환의 벨트", "저주받은 마도서", "창세의 뱃지", "미트라의 분노"].some(k => name.includes(k))) {
            setDetails["칠흑의 보스 세트"].items.push(name);
        } else if (["트와일라이트", "에스텔라", "데이브레이크", "가디언 엔젤"].some(k => name.includes(k))) {
            setDetails["여명의 보스 세트"].items.push(name);
        } else if (["하이네스", "이글아이", "트릭스터"].some(k => name.includes(k))) {
            setDetails["루타비스 세트"].items.push(name);
        } else if (name.includes("앱솔랩스")) {
            setDetails["앱솔랩스 세트"].items.push(name);
        } else if (name.includes("아케인셰이드")) {
            setDetails["아케인셰이드 세트"].items.push(name);
        } else if (name.includes("에테르넬")) {
            setDetails["에테르넬 세트"].items.push(name);
        }
    });

    let hasAnySet = false;
    Object.keys(setDetails).forEach(setName => {
        const items = setDetails[setName].items;
        if (items.length > 0) {
            hasAnySet = true;
            const uniqueItems = [...new Set(items)]; 
            container.innerHTML += `
                <div style="margin-bottom: 10px; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span style="font-weight: 900; color: #1e293b;">• ${setName}</span>
                        <span style="color: #2563eb; font-weight: 900; font-size: 12px;">${uniqueItems.length}세트 적용</span>
                    </div>
                    <div style="font-size: 11px; color: #64748b; font-weight: 700; line-height: 1.4; word-break: keep-all;">
                        [ ${uniqueItems.join(', ')} ]
                    </div>
                </div>`;
        }
    });

    if (!hasAnySet) {
        container.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 10px 0; font-weight: 700;">현재 적용 중인 세트 효과가<br>존재하지 않습니다.</div>`;
    }
};

window.renderPotentialInputs = function() {
    const container = document.getElementById('potential_lines_container');
    const addContainer = document.getElementById('additional_potential_lines_container');
    if (!container || !addContainer) return;
    
    const item = window.builderEquippedItems[window.currentSelectedSlotIndex];
    const potentials = item?.potentials || [{}, {}, {}];
    const addPotentials = item?.additional_potentials || [{}, {}, {}];

    const POT_LIST = ['STR%', 'DEX%', 'INT%', 'LUK%', '올스탯%', '공격력%', '마력%', '보스 데미지%', '데미지%', '크리티컬 데미지%', '아이템 드롭률%', '메소 획득량%'];
    const ADD_POT_LIST = ['공격력', '마력', '공격력%', '마력%', 'STR', 'DEX', 'INT', 'LUK', '올스탯%', '데미지', '데미지%', '크리티컬 데미지%'];

    const labelStyle = "color:#475569; font-weight:800; font-size:11px; margin-bottom:8px; border-bottom:1px solid #e2e8f0; padding-bottom:4px;";
    const rowStyle = "display:flex; align-items:center; margin-bottom:4px;";
    const selectStyle = "flex:1; padding:5px; border:1px solid #cbd5e1; border-radius:6px; font-size:11px; background:#fff; color:#334155; margin-right:4px; outline:none; cursor:pointer;";
    const inputStyle = "width:50px; padding:5px; border:1px solid #cbd5e1; border-radius:6px; font-size:11px; background:#fff; color:#334155; text-align:center; outline:none;";

    container.innerHTML = `<div style="${labelStyle}">● 잠재옵션</div>` + potentials.map((p, i) => `
        <div style="${rowStyle}">
            <div style="width:20px; color:#64748b; font-weight:bold; font-size:10px;">${i+1}</div>
            <select onchange="window.updateSlotPotential(${i}, 'type', this.value, false)" style="${selectStyle}">
                <option value="none" style="color:#94a3b8;">옵션 선택</option>
                ${POT_LIST.map(t => `<option value="${t}" ${p.type === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
            <input type="number" value="${p.value || 0}" onchange="window.updateSlotPotential(${i}, 'value', this.value, false)" style="${inputStyle}">
        </div>
    `).join('');

    addContainer.innerHTML = `<div style="${labelStyle}">● 에디셔널</div>` + addPotentials.map((p, i) => `
        <div style="${rowStyle}">
            <div style="width:20px; color:#64748b; font-weight:bold; font-size:10px;">${i+1}</div>
            <select onchange="window.updateSlotPotential(${i}, 'type', this.value, true)" style="${selectStyle}">
                <option value="none" style="color:#94a3b8;">옵션 선택</option>
                ${ADD_POT_LIST.map(t => `<option value="${t}" ${p.type === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
            <input type="number" value="${p.value || 0}" onchange="window.updateSlotPotential(${i}, 'value', this.value, true)" style="${inputStyle}">
        </div>
    `).join('');
};