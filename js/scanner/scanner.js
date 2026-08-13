/* global fetchFromNexon */
/**
 * ============================================================================
 * 🎯 MAPLE OMNI V15 - js/scanner/scanner.js
 * 설명: 1:1 캐릭터 순수 내실, 6차 헥사 코어, 파츠별 장비 세부 대조 관제 스크립트입니다.
 * ============================================================================
 */

// ============================================================================
// 📦 [PART 1] 초기화, 데이터 캐싱 및 전역 상태 관리
// ============================================================================

let isScanningLock = false;

// 💡 [초보자 가이드] 스캐너 캐시 스토리지 (API 호출 부하 감소용)
window.cacheScannerData = {
    ttlMs: 10 * 60 * 1000, // 10분 유효기간
    save: function(charName, data) {
        try {
            const payload = { data: data, savedAt: Date.now() };
            localStorage.setItem(`omni_v14_scanner_cache_${charName}`, JSON.stringify(payload));
        } catch(e) {
            console.error("[OMNI SCANNER CACHE ERROR]:", e);
        }
    },
    load: function(charName) {
        try {
            const raw = localStorage.getItem(`omni_v14_scanner_cache_${charName}`);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object' || !('savedAt' in parsed)) {
                return parsed || null;
            }
            if (Date.now() - parsed.savedAt > this.ttlMs) {
                localStorage.removeItem(`omni_v14_scanner_cache_${charName}`);
                return null;
            }
            return parsed.data;
        } catch(e) {
            return null;
        }
    }
};

// 💡 [초보자 가이드] 스캐너 모듈 전역 상태 관리 객체
window.omniScannerState = {
    searchQuery: "",
    searchHistory: JSON.parse(localStorage.getItem('omniScannerHistory') || '[]'),
    compareMode: 'capsule',
    isSearched: false,
    isLoadingRivals: false, 
    myCharacter: null,      
    selectedTarget: null,   
    comparisonList: [], 
    equipPresetView: { my: 0, target: 0 },
    abilityPresetView: { my: 0, target: 0 },
    openedMetrics: {        
        starforce: true,
        union: true,
        arcane: true,
        authentic: true,
        ability: true,
        hexa: true,
        equipmentDetail: true,
        serverStat: true
    }
};

// ============================================================================
// 🛠️ [PART 2] API 통신 백오프 제어 및 데이터 변환 유틸리티
// ============================================================================

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 💡 [초보자 가이드] 넥슨 OpenAPI 호출 제어 (429 Rate Limit 방지)
async function fetchFromNexonWithRetry(url, params, retries = 3, delay = 250) {
    for (let i = 0; i < retries; i++) {
        try {
            const fetchFn = window.fetchFromNexon || (typeof fetchFromNexon !== 'undefined' ? fetchFromNexon : null);
            if (!fetchFn) throw new Error("fetchFromNexon 함수를 찾을 수 없습니다.");
            const result = await fetchFn(url, params);
            return result;
        } catch (err) {
            if (err && (err.status === 429 || String(err).includes("429")) && i < retries - 1) {
                console.warn(`[OMNI API RATE LIMIT WARNING] 429 감지 - ${delay}ms 후 재시도 (${i + 1}/${retries})...`);
                await sleep(delay);
                delay *= 1.5;
            } else {
                if (i === retries - 1) throw err;
                await sleep(delay);
            }
        }
    }
    return null;
}

function getSafeOffsetDate(offsetDays) {
    const date = new Date();
    date.setDate(date.getDate() - offsetDays);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function getSafeRankingDate() {
    return getSafeOffsetDate(2);
}

window.fetchFreshestCharacterBasic = async function(ocid) {
    for (let offset = 1; offset <= 7; offset++) {
        const tryDate = getSafeOffsetDate(offset);
        try {
            const bData = await fetchFromNexonWithRetry("/character/basic", { ocid: ocid, date: tryDate });
            if (bData && bData.character_name) {
                return { bData, finalUsedDate: tryDate };
            }
        } catch (e) {
            continue;
        }
    }
    return { bData: null, finalUsedDate: getSafeRankingDate() };
};

window.findAvatarUrl = function(charObj) {
    if (!charObj) return "";
    return charObj.character_image || charObj.character_avatar || "";
};

window.colorNum = function(numString) {
    return `<span style="color: var(--scanner-accent-num); font-weight: 800; font-family: 'Consolas', monospace; font-variant-numeric: tabular-nums;">${numString}</span>`;
};

window.getScannerStatValue = function(statList, statName) {
    if (!statList || !Array.isArray(statList)) return 0;
    const found = statList.find(s => s.stat_name === statName);
    return found ? parseFloat(found.stat_value) : 0;
};

window.calculateSymbolForce = function(symbolList, type) {
    if (!symbolList || !Array.isArray(symbolList)) return 0;
    return symbolList
        .filter(s => {
            if (!s || !s.symbol_name) return false;
            if (type === "어센틱") return s.symbol_name.includes("어센틱") || s.symbol_name.includes("그랜드");
            return s.symbol_name.includes(type);
        })
        .reduce((acc, cur) => acc + (parseInt(cur.symbol_force) || 0), 0);
};

window.findItemBySlot = function(equipList, slotName) {
    if (!equipList || !Array.isArray(equipList)) return null;
    const slotNameMap = { 
        "배지": "뱃지", 
        "뱃지": "배지",
        "한벌옷": "상의",
        "상의": "한벌옷"
    };
    return equipList.find(eq => {
        const slot = eq.item_equipment_slot;
        if (!slot) return false;
        if (slot === slotName) return true;
        if (slotNameMap[slot] === slotName) return true;
        if (slotNameMap[slotName] === slot) return true;
        if (slotName === "상의" && (slot === "한벌옷" || slot === "상의")) return true;
        return false;
    });
};

// ============================================================================
// 🔌 [PART 3] 어빌리티 파싱 및 인게임 표준 툴팁 모듈
// ============================================================================

window.getAbilityPresetSafe = function(abilityObj, num) {
    if (!abilityObj) return null;
    
    const activeNo = abilityObj.ability_preset_no || abilityObj.preset_no || 1;
    
    const presetKey = `ability_preset_${num}`;
    const presetObj = abilityObj[presetKey];
    if (presetObj) {
        const infoList = presetObj.ability_preset_info || presetObj.ability_info;
        const pGrade = presetObj.ability_preset_grade || presetObj.ability_grade || abilityObj.ability_grade || "미설정";
        if (Array.isArray(infoList) && infoList.length > 0) {
            return {
                ability_preset_grade: pGrade,
                ability_preset_info: infoList
            };
        }
    }

    if (Array.isArray(abilityObj.preset_ability_info)) {
        const arrItem = abilityObj.preset_ability_info[num - 1];
        if (arrItem) {
            const arrInfo = arrItem.ability_preset_info || arrItem.ability_info;
            const arrGrade = arrItem.ability_preset_grade || arrItem.ability_grade || abilityObj.ability_grade || "미설정";
            if (Array.isArray(arrInfo) && arrInfo.length > 0) {
                return {
                    ability_preset_grade: arrGrade,
                    ability_preset_info: arrInfo
                };
            }
        }
    }

    if ((num === activeNo || num === 1) && Array.isArray(abilityObj.ability_info) && abilityObj.ability_info.length > 0) {
        return {
            ability_preset_grade: abilityObj.ability_grade || "미설정",
            ability_preset_info: abilityObj.ability_info
        };
    }

    return null;
};

window.renderAbilityPresetTabButtons = function(side, abilityObj) {
    if (!abilityObj) return '';
    const activeNum = window.omniScannerState.abilityPresetView[side] || abilityObj.ability_preset_no || abilityObj.preset_no || 1;
    const tabs = [1, 2, 3].map(n => {
        const pData = window.getAbilityPresetSafe(abilityObj, n);
        return { num: n, has: !!pData && pData.ability_preset_info && pData.ability_preset_info.length > 0 };
    });

    return `
        <div style="display:flex; gap:3px; margin-bottom:5px;">
            ${tabs.map(t => {
                const isActive = activeNum === t.num;
                return `<button type="button" onclick="window.switchAbilityPresetTab('${side}', ${t.num})"
                    style="flex:1; padding:4px 0; font-size:9.5px; font-weight:800; border-radius:6px; cursor:pointer;
                    border:1px solid ${isActive ? 'var(--accent)' : 'var(--scanner-border)'};
                    background:${isActive ? 'var(--accent)' : 'var(--scanner-inner-bg)'};
                    color:${isActive ? '#fff' : (t.has ? 'var(--scanner-text-sub)' : 'var(--scanner-text-muted)')};">
                    프리셋${t.num}${t.has ? '' : ' ·'}
                </button>`;
            }).join('')}
        </div>
    `;
};

window.switchAbilityPresetTab = function(side, presetNum) {
    window.omniScannerState.abilityPresetView[side] = presetNum;
    window.renderOmniScannerUI();
};

window.renderAbilityPresetsInfo = function(abilityObj, activePresetNum) {
    if (!abilityObj) {
        return `<div style="font-size:12px; color: var(--scanner-text-muted);">어빌리티 정보 비공개</div>`;
    }
    const gradeColor = { "레전드리": "#16a34a", "유니크": "#d97706", "에픽": "#9333ea", "레어": "#0284c7" };
    const activeNo = abilityObj.ability_preset_no || abilityObj.preset_no || 1;
    const shownNum = activePresetNum || activeNo;
    const preset = window.getAbilityPresetSafe(abilityObj, shownNum);

    if (!preset || !preset.ability_preset_info || preset.ability_preset_info.length === 0) {
        return `<div style="font-size:10.5px; color:var(--scanner-text-muted); font-weight:700;">프리셋${shownNum}: 등록된 어빌리티 정보가 없습니다.</div>`;
    }

    const gColor = gradeColor[preset.ability_preset_grade] || 'var(--scanner-text-main)';
    const isActiveLoadout = (shownNum === activeNo);

    return `
        <div style="border-left:2px solid var(--accent); padding-left:7px; text-align:left;">
            <div style="font-weight:800; color:${gColor}; font-size:10.5px; margin-bottom:3px;">프리셋${shownNum}${isActiveLoadout ? ' (착용중)' : ''} [${preset.ability_preset_grade || '미설정'}]</div>
            ${preset.ability_preset_info.map(a => `<div style="font-size:10px; color:var(--scanner-text-sub); font-weight:600;">• ${a.ability_value}</div>`).join('')}
        </div>
    `;
};

window.generateInGameTooltipHtml = function(item, slotName) {
    if (!item) return '<div style="padding:10px;">아이템 정보가 없습니다.</div>';

    const gradeColor = { "레전드리": "#73ff00", "유니크": "#ffcc00", "에픽": "#cc66ff", "레어": "#00ccff" };
    
    let starHtml = '';
    const sf = Number(item.starforce) || 0;
    const part = item.item_equipment_part || slotName || "장비";
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

    const stats = [
        { name: 'STR', key: 'str' }, { name: 'DEX', key: 'dex' }, { name: 'INT', key: 'int' }, { name: 'LUK', key: 'luk' },
        { name: '최대 HP', key: 'max_hp' }, { name: '공격력', key: 'attack_power' }, { name: '마력', key: 'magic_power' },
        { name: '보스 데미지', key: 'boss_damage', isPercent: true },
        { name: '방어율 무시', key: 'ignore_monster_armor', isPercent: true },
        { name: '올스탯', key: 'all_stat', isPercent: true }
    ];

    let statHtml = '';
    const baseOpt = item.item_base_option || item.base_option || {};
    const starOpt = item.item_starforce_option || item.starforce_option || {};
    const addOpt = item.item_add_option || item.add_option || {};
    const etcOpt = item.item_etc_option || item.etc_option || {};

    stats.forEach(s => {
        const b = Number(baseOpt[s.key]) || 0;
        const star = Number(starOpt[s.key]) || 0;
        const add = Number(addOpt[s.key]) || 0;
        const etc = Number(etcOpt[s.key]) || 0;
        const total = b + star + add + etc;

        if (total > 0) {
            const unit = s.isPercent ? '%' : '';
            let detail = '';
            
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

    let extraInfoHtml = '';
    const upCnt = Number(item.scroll_upgrade) || 0;
    if (upCnt > 0) {
        extraInfoHtml += `<div style="color: #ffcc00; margin-top: 2px;">업그레이드 횟수 : +${upCnt}</div>`;
    }
    
    const scissorCount = item.cut_table_change_allow_trade_count;
    if (scissorCount !== undefined && scissorCount !== null && Number(scissorCount) !== 255) {
        extraInfoHtml += `<div style="color: #ffffff; margin-top: 2px;">가위 사용 가능 횟수 : ${scissorCount}회</div>`;
    }

    const nameColor = gradeColor[item.potential_option_grade] || "#ffffff";
    const reqLevel = baseOpt.base_equipment_level || 0;

    let addPotentialSectionHtml = '';
    if (item.additional_potential_option_1) {
        addPotentialSectionHtml = `
            <div style="color: #cc66ff; font-weight: bold; margin-top: 10px; margin-bottom: 4px;">● 에디셔널 잠재옵션</div>
            <div>${item.additional_potential_option_1}</div>
            <div>${item.additional_potential_option_2 || ''}</div>
            <div>${item.additional_potential_option_3 || ''}</div>
        `;
    }

    return `
        ${starHtml}
        <div style="text-align: center; margin-bottom: 10px;">
            <div style="color: ${nameColor}; font-weight: bold; font-size: 15px; margin-bottom: 4px;">${item.item_name || '알 수 없는 장비'}</div>
            <div style="color: #aaa; font-size: 11px;">(${item.potential_option_grade || '일반'} 아이템)</div>
        </div>
        <div style="display: flex; gap: 12px; border-top: 1px dashed #555; border-bottom: 1px dashed #555; padding: 10px 0; margin-bottom: 10px;">
            <div style="width: 60px; height: 60px; background: #222; border: 1px solid #333; border-radius: 5px; display: flex; align-items: center; justify-content: center; flex-shrink:0;">
                <img src="${item.item_icon || ''}" style="max-width: 45px; max-height: 45px; object-fit:contain;">
            </div>
            <div style="display: flex; flex-direction: column; justify-content: center; font-size: 11px; text-align:left;">
                <div style="color: #ffcc00; font-weight: bold;">REQ LEV : ${reqLevel}</div>
                <div style="color: #aaa; margin-top: 3px;">장비분류 : ${part}</div>
                ${extraInfoHtml}
            </div>
        </div>
        <div style="font-size: 11px; color: #fff; line-height: 1.5; text-align: left;">
            ${statHtml || '<div>기본 옵션 정보 없음</div>'}
        </div>
        <div style="border-top: 1px dashed #555; margin-top: 10px; padding-top: 10px; font-size: 11px; text-align: left;">
            <div style="color: #73ff00; font-weight: bold; margin-bottom: 4px;">● 잠재옵션</div>
            <div>${item.potential_option_1 || '옵션 없음'}</div>
            <div>${item.potential_option_2 || ''}</div>
            <div>${item.potential_option_3 || ''}</div>
            ${addPotentialSectionHtml}
        </div>
    `;
};

window.getOrCreateTooltip = function() {
    let tt = document.getElementById('itemTooltip');
    if (!tt) {
        tt = document.createElement('div');
        tt.id = 'itemTooltip';
        document.body.appendChild(tt);
    }
    tt.style.cssText = `display: none; position: fixed !important; background: rgba(17, 17, 17, 0.96); color: #fff; border: 1px solid #555; border-radius: 10px; padding: 12px; font-size: 11.5px; z-index: 99999; width: 240px; pointer-events: none; box-shadow: 0 10px 30px rgba(0,0,0,0.6); box-sizing: border-box; backdrop-filter: blur(10px); top: 0; left: 0; font-family: sans-serif;`;
    return tt;
};

window.hideTooltip = function() { const tt = document.getElementById('itemTooltip'); if (tt) tt.style.display = 'none'; };
window.hideOmniTooltip = function() { window.hideTooltip(); };

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

    displayItem.item_base_option = item.base_option || item.item_base_option;
    displayItem.item_add_option = item.add_option || item.item_add_option;
    displayItem.item_etc_option = item.etc_option || item.item_etc_option;
    displayItem.starforce = item.starforce;
    displayItem.item_starforce_option = item.starforce_option || item.item_starforce_option;
    displayItem.scroll_upgrade = item.scroll_upgrade;
    displayItem.cut_table_change_allow_trade_count = item.cut_table_change_allow_trade_count;

    let tt = window.getOrCreateTooltip();
    tt.innerHTML = window.generateInGameTooltipHtml(displayItem, item.item_equipment_slot || '장비');
    tt.style.display = 'block';
    
    if (typeof window.moveTooltip === 'function') {
        window.moveTooltip(e);
    }
};

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

// ============================================================================
// 🏛️ [PART 4] 내실, 헥사 코어 및 파츠별 장비 세부 대조 파서
// ============================================================================

// 💡 [수정] 탈라하트 및 어센틱 심볼 이름 정밀 파서 및 줄맞춤 모듈
window.renderSymbolDetailedInfo = function(symbolList, typeFilter) {
    if (!symbolList || symbolList.length === 0) return `<span style="color: var(--scanner-text-muted); font-size:11px;">데이터 부재</span>`;
    
    return `<div style="display:flex; flex-wrap:wrap; gap:6px;">` + symbolList
        .filter(s => {
            if (!s || !s.symbol_name) return false;
            if (typeFilter === "아케인") return s.symbol_name.includes("아케인");
            if (typeFilter === "어센틱") return s.symbol_name.includes("어센틱") || s.symbol_name.includes("그랜드");
            return s.symbol_name.includes(typeFilter);
        })
        .map(s => {
            let rawName = s.symbol_name.includes(":") ? s.symbol_name.split(":")[1].trim() : s.symbol_name;
            let shortName = rawName;
            
            if (rawName.includes("소멸")) shortName = "소멸의 여로";
            else if (rawName.includes("츄츄")) shortName = "츄츄 아일랜드";
            else if (rawName.includes("레헬른")) shortName = "레헬른";
            else if (rawName.includes("아르카")) shortName = "아르카나";
            else if (rawName.includes("모라스")) shortName = "모라스";
            else if (rawName.includes("에스페")) shortName = "에스페라";
            else if (rawName.includes("세르니")) shortName = "세르니움";
            else if (rawName.includes("아르크")) shortName = "호텔 아르크스";
            else if (rawName.includes("오디움")) shortName = "오디움";
            else if (rawName.includes("도원경")) shortName = "도원경";
            else if (rawName.includes("아르테")) shortName = "아르테리아";
            else if (rawName.includes("카르시")) shortName = "카르시온";
            else if (rawName.includes("탈라하")) shortName = "탈라하트";
            
            return `<div style="display:inline-flex; align-items:center; gap: 5px; font-size:11px; background: var(--scanner-card-bg); padding:5px 9px; border:1px solid var(--scanner-border); border-radius:6px; color: var(--scanner-text-main); font-weight:700; white-space:nowrap;">
                <img src="${s.symbol_icon || ''}" style="width:16px; height:16px; object-fit:contain;" onerror="this.style.display='none'">
                <span>${shortName} <b style="color:var(--accent); font-family:'Consolas';">Lv.${s.symbol_level || '1'}</b></span>
            </div>`;
        }).join('') + `</div>`;
};

// 💡 [복원] 6차 헥사 매트릭스 (HEXA) 1:1 대조 모듈
window.renderHexaComparisonInfo = function(myHexaList, targetHexaList) {
    const getHexaMap = (list) => {
        if (!list || !Array.isArray(list)) return [];
        return list.map(item => ({
            name: item.hexa_core_name || item.hexa_skill_name || "알 수 없는 코어",
            level: Number(item.hexa_core_level || item.hexa_skill_level || 0)
        }));
    };

    const myHexa = getHexaMap(myHexaList);
    const targetHexa = getHexaMap(targetHexaList);

    if (myHexa.length === 0 && targetHexa.length === 0) {
        return `<div style="font-size:11.5px; color:var(--scanner-text-muted); padding:10px;">6차 헥사 코어 데이터가 없습니다 (미전직 또는 비공개)</div>`;
    }

    const myTotalLv = myHexa.reduce((acc, cur) => acc + cur.level, 0);
    const targetTotalLv = targetHexa.reduce((acc, cur) => acc + cur.level, 0);

    const renderCoreList = (hexaArr) => {
        if (!hexaArr || hexaArr.length === 0) return `<div style="font-size:11px; color:var(--scanner-text-muted);">미개설 / 정보 없음</div>`;
        return hexaArr.map(c => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--scanner-card-bg); border:1px solid var(--scanner-border); padding:6px 10px; border-radius:6px; font-size:11px; font-weight:700;">
                <span style="color:var(--scanner-text-main); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:180px;">${c.name}</span>
                <span style="color:var(--accent); font-family:'Consolas'; font-weight:800; flex-shrink:0;">Lv.${c.level}</span>
            </div>
        `).join('');
    };

    return `
        <div style="display:flex; flex-direction:column; gap:10px; margin-top:8px;">
            <div style="display:flex; justify-content:space-between; font-size:11.5px; font-weight:800; color:var(--scanner-text-main); background:var(--scanner-card-bg); padding:8px 12px; border-radius:8px; border:1px solid var(--scanner-border);">
                <span>🔮 헥사 코어 총합 레벨</span>
                <div style="display:flex; gap:20px;">
                    <span>나: <b style="color:var(--accent); font-family:'Consolas';">${myTotalLv}</b></span>
                    <span>상대: <b style="color:var(--scanner-accent-num); font-family:'Consolas';">${targetTotalLv}</b></span>
                </div>
            </div>
            <div style="display:flex; gap:10px;">
                <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
                    <div style="font-size:10.5px; font-weight:800; color:var(--scanner-text-muted); margin-bottom:2px;">나 코어 목록 (${myHexa.length}개)</div>
                    ${renderCoreList(myHexa)}
                </div>
                <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
                    <div style="font-size:10.5px; font-weight:800; color:var(--scanner-text-muted); margin-bottom:2px;">상대 코어 목록 (${targetHexa.length}개)</div>
                    ${renderCoreList(targetHexa)}
                </div>
            </div>
        </div>
    `;
};

// 💡 [복원] 주요 장비 파츠별 1:1 정밀 세부 대조 모듈
window.renderEquipmentDetailComparison = function(myEquipList, targetEquipList) {
    const targetSlots = [
        "무기", "보조무기", "엠블렘", "모자", "상의", "하의", 
        "장갑", "신발", "망토", "어깨장식", "반지1", "반지2", "펜던트", "벨트"
    ];

    const gradeColors = {
        "레전드리": "#16a34a",
        "유니크": "#d97706",
        "에픽": "#9333ea",
        "레어": "#0284c7"
    };

    const getItemSummary = (equipList, slotName) => {
        const item = window.findItemBySlot(equipList, slotName);
        if (!item) return { name: "미착용", star: 0, grade: "", pot: "-" };
        
        const sf = Number(item.starforce) || 0;
        const grade = item.potential_option_grade || "";
        const pot1 = item.potential_option_1 || "";
        const pot2 = item.potential_option_2 || "";
        
        let summaryPot = pot1;
        if (pot2) summaryPot += ` / ${pot2}`;
        if (!summaryPot) summaryPot = "옵션 없음";

        return {
            name: item.item_name || slotName,
            icon: item.item_icon || "",
            star: sf,
            grade: grade,
            pot: summaryPot
        };
    };

    const rowsHtml = targetSlots.map(slot => {
        const myItem = getItemSummary(myEquipList, slot);
        const targetItem = getItemSummary(targetEquipList, slot);

        const myGradeColor = gradeColors[myItem.grade] || "var(--scanner-text-muted)";
        const targetGradeColor = gradeColors[targetItem.grade] || "var(--scanner-text-muted)";

        return `
            <div style="display:grid; grid-template-columns: 70px 1fr 1fr; gap:10px; align-items:center; padding:8px 10px; background:var(--scanner-inner-bg); border:1px solid var(--scanner-border); border-radius:8px; font-size:11px;">
                <div style="font-weight:800; color:var(--scanner-text-sub); text-align:center;">${slot}</div>
                
                <!-- 나 아이템 -->
                <div style="display:flex; align-items:center; gap:8px; background:var(--scanner-card-bg); padding:6px 8px; border-radius:6px; border:1px solid var(--scanner-border); min-width:0;">
                    ${myItem.icon ? `<img src="${myItem.icon}" style="width:22px; height:22px; object-fit:contain;">` : ''}
                    <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">
                        <div style="font-weight:800; color:var(--scanner-text-main); font-size:11px; overflow:hidden; text-overflow:ellipsis;">
                            ${myItem.star > 0 ? `<b style="color:#f59e0b; font-family:'Consolas';">★${myItem.star}</b> ` : ''}${myItem.name}
                        </div>
                        <div style="font-size:9.5px; color:${myGradeColor}; font-weight:700; overflow:hidden; text-overflow:ellipsis;">${myItem.pot}</div>
                    </div>
                </div>

                <!-- 상대 아이템 -->
                <div style="display:flex; align-items:center; gap:8px; background:var(--scanner-card-bg); padding:6px 8px; border-radius:6px; border:1px solid var(--scanner-border); min-width:0;">
                    ${targetItem.icon ? `<img src="${targetItem.icon}" style="width:22px; height:22px; object-fit:contain;">` : ''}
                    <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">
                        <div style="font-weight:800; color:var(--scanner-text-main); font-size:11px; overflow:hidden; text-overflow:ellipsis;">
                            ${targetItem.star > 0 ? `<b style="color:#f59e0b; font-family:'Consolas';">★${targetItem.star}</b> ` : ''}${targetItem.name}
                        </div>
                        <div style="font-size:9.5px; color:${targetGradeColor}; font-weight:700; overflow:hidden; text-overflow:ellipsis;">${targetItem.pot}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div style="display:flex; flex-direction:column; gap:6px; max-height:420px; overflow-y:auto; padding-right:4px; margin-top:8px;">
            ${rowsHtml}
        </div>
    `;
};

window.renderPresetTabButtons = function(side, character, activePresetNum) {
    const bossNum = character.bossPresetNumber || 1;
    const shownNum = activePresetNum || bossNum;
    const presets = [
        { num: 1, list: character.item_preset_1 },
        { num: 2, list: character.item_preset_2 },
        { num: 3, list: character.item_preset_3 }
    ];
    return `
        <div style="display:flex; gap:4px; margin-bottom:8px;">
            ${presets.map(p => {
                const isActive = shownNum === p.num;
                const isBoss = bossNum === p.num;
                const hasData = p.list && p.list.length > 0;
                return `<button type="button" onclick="window.switchEquipPresetTab('${side}', ${p.num})" ${hasData ? '' : 'disabled'}
                    style="flex:1; padding:5px 0; font-size:10.5px; font-weight:800; border-radius:6px; cursor:${hasData ? 'pointer' : 'default'};
                    border:1px solid ${isActive ? 'var(--accent)' : 'var(--scanner-border)'};
                    background:${isActive ? 'var(--accent)' : 'var(--scanner-inner-bg)'};
                    color:${isActive ? '#fff' : (hasData ? 'var(--scanner-text-sub)' : 'var(--scanner-text-muted)')};
                    opacity:${hasData ? '1' : '0.5'};">
                    프리셋${p.num}${isBoss ? ' 👑' : ''}
                </button>`;
            }).join('')}
        </div>
    `;
};

window.switchEquipPresetTab = function(side, presetNum) {
    window.omniScannerState.equipPresetView[side] = presetNum;
    window.renderOmniScannerUI();
};

window.renderScannerEquip = function(equipList, containerId, isMyCharacter) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    
    const wrapper = document.createElement('div');
    wrapper.className = "scanner-grid-container";
    container.appendChild(wrapper);

    const charBox = document.createElement('div');
    charBox.className = "scanner-char-container";
    wrapper.appendChild(charBox);

    let charImgUrl = isMyCharacter ? window.findAvatarUrl(window.omniScannerState.myCharacter) : window.findAvatarUrl(window.omniScannerState.selectedTarget);
    if (charImgUrl) {
        const charImg = document.createElement('img');
        charImg.src = charImgUrl;
        charImg.className = "scanner-char-img";
        charBox.appendChild(charImg);
    } else {
        charBox.innerHTML = `<div style="font-size:10px; color: var(--scanner-text-muted); font-weight:800; font-family:'Consolas';">AVATAR</div>`;
    }

    const iGameLayout = [
        { s: "반지4", r: 1, c: 1 }, { s: "반지3", r: 2, c: 1 }, { s: "반지2", r: 3, c: 1 }, { s: "반지1", r: 4, c: 1 }, { s: "펜던트2", r: 5, c: 1 }, { s: "포켓 아이템", r: 6, c: 1 },
        { s: "엠블렘", r: 1, c: 2 }, { s: "뱃지", r: 2, c: 2 }, { s: "훈장", r: 3, c: 2 }, { s: "얼굴장식", r: 4, c: 2 }, { s: "눈장식", r: 5, c: 2 }, { s: "귀고리", r: 6, c: 2 },
        { s: "무기", r: 6, c: 3 },
        { s: "모자", r: 1, c: 4 }, { s: "상의", r: 2, c: 4 }, { s: "하의", r: 3, c: 4 }, { s: "장갑", r: 4, c: 4 }, { s: "안드로이드", r: 5, c: 4 }, { s: "어깨장식", r: 6, c: 4 },
        { s: "망토", r: 1, c: 5 }, { s: "보조무기", r: 2, c: 5 }, { s: "신발", r: 3, c: 5 }, { s: "펜던트", r: 4, c: 5 }, { s: "기계 심장", r: 5, c: 5 }, { s: "벨트", r: 6, c: 5 }
    ];

    iGameLayout.forEach(slotData => {
        const slot = document.createElement('div');
        slot.className = "scanner-item-slot";
        slot.style.gridRow = slotData.r;
        slot.style.gridColumn = slotData.c;

        if (slotData.s === "안드로이드") {
            slot.innerHTML = `<span style="font-size: 8px; color: var(--scanner-text-muted); font-weight:800;">안드</span>`;
            wrapper.appendChild(slot);
            return;
        }

        let item = window.findItemBySlot(equipList, slotData.s);
        if (item && item.item_icon) {
            slot.style.background = "var(--scanner-inner-bg)";
            slot.innerHTML = `<img src="${item.item_icon}">`;
            slot.addEventListener('mouseenter', (e) => window.showOmniTooltip(e, item));
            slot.addEventListener('mousemove', (e) => window.moveTooltip(e));
            slot.addEventListener('mouseleave', () => window.hideOmniTooltip());
        } else {
            let shortName = slotData.s.length > 3 ? slotData.s.substring(0, 2) : slotData.s;
            slot.innerHTML = `<span style="font-size: 8.5px; color: var(--scanner-text-muted); font-weight:700;">${shortName}</span>`;
        }
        wrapper.appendChild(slot);
    });
};

// ============================================================================
// 🖥 [PART 5] 메인 UI 렌더링 코어
// ============================================================================

window.renderOmniScannerUI = function() {
    let container = document.getElementById('scannerContent');
    if (!container) {
        const pageScanner = document.getElementById('page-scanner');
        if (pageScanner) container = pageScanner.querySelector('.scanner-render-target') || pageScanner;
    }
    if (!container) return;

    try {
        const state = window.omniScannerState;
        if (!state.searchHistory) state.searchHistory = JSON.parse(localStorage.getItem('omniScannerHistory') || '[]');
        
        const savedMain = localStorage.getItem('omniMainCharacter') || state.searchQuery || '';
        const targetNameVal = state.selectedTarget?.name || '';

        let html = `
            <div class="scanner-search-center-wrapper">
                <div class="scanner-capsule-bar">
                    <div class="scanner-capsule-slot">
                        <span class="scanner-capsule-icon">👤</span>
                        <input type="text" id="scannerSearchInput" placeholder="내 캐릭터 닉네임" value="${savedMain}" class="scanner-capsule-input">
                    </div>
                    <div class="scanner-capsule-vs">VS</div>
                    <div class="scanner-capsule-slot">
                        <span class="scanner-capsule-icon">🎯</span>
                        <input type="text" id="targetSearchInput" placeholder="대조 상대 닉네임" value="${targetNameVal}" class="scanner-capsule-input">
                    </div>
                    <button type="button" id="scannerSearchBtn" onclick="window.triggerScannerManualSearch(false)" class="scanner-capsule-btn">
                        ⚡ 1:1 대조 스캔
                    </button>
                    <button type="button" id="scannerRefreshBtn" onclick="window.triggerScannerManualSearch(true)" class="scanner-capsule-btn" style="background: var(--scanner-inner-bg) !important; color: var(--scanner-text-sub) !important; border: 1px solid var(--scanner-border) !important; padding: 9px 12px !important; margin-left: 4px;" title="API 강제 갱신">
                        🔄
                    </button>
                </div>
            </div>
            <div style="width: 100% !important; display: flex !important; flex-direction: column !important; gap: 16px !important;">
        `;

        if (!state.myCharacter || !state.selectedTarget) {
            html += `
                <div style="padding: 24px 20px; background: var(--scanner-card-bg); border-radius: 12px; border: 1px dashed var(--scanner-border-dashed); color: var(--scanner-text-sub); line-height: 1.5; text-align: left; font-family: 'Pretendard';">
                    <div style="font-size: 13.5px; font-weight: 800; color: var(--scanner-text-main); margin-bottom: 6px;">🔮 OMNI 실시간 1:1 관제 가이드</div>
                    <div style="font-size: 12px; color: var(--scanner-text-sub);">상단 캡슐 바에 내 캐릭터와 비교할 상대 유저 닉네임을 입력하고 [1:1 대조 스캔] 버튼을 누르세요. 장비 스위칭 착시를 완벽히 분류하여 순수 고정 내실을 비교합니다.</div>
                </div>
            </div>
            `;
            container.innerHTML = html;
            return;
        }

        const myPower = window.getScannerStatValue(state.myCharacter.stats, "전투력");
        const targetPower = window.getScannerStatValue(state.selectedTarget.stats, "전투력");

        const myArcane = window.calculateSymbolForce(state.myCharacter.symbol, "아케인");
        const targetArcane = window.calculateSymbolForce(state.selectedTarget.symbol, "아케인");
        const myAuthentic = window.calculateSymbolForce(state.myCharacter.symbol, "어센틱");
        const targetAuthentic = window.calculateSymbolForce(state.selectedTarget.symbol, "어센틱");
        const myUnion = state.myCharacter.union?.union_level || 0;
        const targetUnion = state.selectedTarget.union?.union_level || 0;

        const myPureScore = (myArcane / 10) + (myAuthentic / 2) + (myUnion / 100);
        const targetPureScore = (targetArcane / 10) + (targetAuthentic / 2) + (targetUnion / 100);
        const scoreGap = (targetPureScore - myPureScore).toFixed(1);
        
        let pureVerdict = "";
        if (targetPureScore > myPureScore) {
            pureVerdict = `상대방의 순수 고정 내실이 <span style="color:var(--scanner-accent-num); font-weight:800;">+${Math.abs(scoreGap)}pt</span> 우세합니다.`;
        } else {
            pureVerdict = `내 순수 고정 내실이 <span style="color:var(--scanner-accent-num); font-weight:800;">+${Math.abs(scoreGap)}pt</span> 우세합니다.`;
        }

        html += `
            <div style="background: var(--scanner-card-bg); border: 1px solid var(--scanner-border); border-radius: 12px; padding: 16px; margin-bottom: 16px; font-family: 'Pretendard', sans-serif; text-align: left; box-shadow: var(--scanner-shadow);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dashed var(--scanner-border-dashed);">
                    <div style="font-size: 13.5px; font-weight: 800; color: var(--scanner-text-main); display: flex; align-items: center; gap: 6px;">
                        <span>🔱 1:1 순수 내실 체급 관제 매치업</span>
                    </div>
                    <span style="font-size: 11px; color: #10b981; font-weight: 800; background: var(--scanner-inner-bg); padding: 3px 8px; border-radius: 6px; border: 1px solid var(--scanner-border);">장비 스위칭 착시 제거 완료</span>
                </div>
                <div style="display: flex; gap: 12px; align-items: center;">
                    <div style="flex: 1; background: var(--scanner-inner-bg); padding: 12px 14px; border-radius: 8px; border: 1px solid var(--scanner-border);">
                        <span style="color: var(--accent); font-size: 10.5px; font-weight: 800; display: block; margin-bottom: 2px;">기준 유저 (나)</span>
                        <div style="font-size: 13.5px; font-weight: 800; color: var(--scanner-text-main);">${state.myCharacter.name} <span style="font-size: 11px; color: var(--scanner-text-muted); font-family:'Consolas'; font-weight:600;">Lv.${state.myCharacter.level} | ${state.myCharacter.world}</span></div>
                    </div>
                    <div style="font-size: 12px; font-weight: 900; color: var(--accent); font-family: 'Consolas'; background: var(--scanner-inner-bg); padding: 6px 10px; border-radius: 20px; border: 1px solid var(--scanner-border);">VS</div>
                    <div style="flex: 1; background: var(--scanner-inner-bg); padding: 12px 14px; border-radius: 8px; border: 1px solid var(--scanner-border);">
                        <span style="color: var(--scanner-accent-num); font-size: 10.5px; font-weight: 800; display: block; margin-bottom: 2px;">연동 대조군 (상대)</span>
                        <div style="font-size: 13.5px; font-weight: 800; color: var(--scanner-text-main);">${state.selectedTarget.name} <span style="font-size: 11px; color: var(--scanner-text-muted); font-family:'Consolas'; font-weight:600;">Lv.${state.selectedTarget.level} | ${state.selectedTarget.world}</span></div>
                    </div>
                </div>
            </div>

            <div style="display: flex; gap: 16px; margin-bottom: 16px; font-family: 'Pretendard', sans-serif;">
                <div style="flex: 1; background: var(--scanner-card-bg); padding: 16px; border-radius: 12px; border: 1px solid var(--scanner-border); box-shadow: var(--scanner-shadow); box-sizing: border-box;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <span style="font-size: 13px; font-weight: 800; color: var(--scanner-text-main);">👤 ${state.myCharacter.name} 장비 레이아웃</span>
                        <span style="font-size: 11.5px; font-weight: 800; background: var(--scanner-inner-bg); color: var(--accent); padding: 3px 8px; border-radius: 6px; border: 1px solid var(--scanner-border); font-family:'Consolas';">⚔ ${myPower.toLocaleString()}</span>
                    </div>
                    ${window.renderPresetTabButtons('my', state.myCharacter, state.equipPresetView.my)}
                    <div id="scanner_my_grid"></div>
                </div>
                <div style="flex: 1; background: var(--scanner-card-bg); padding: 16px; border-radius: 12px; border: 1px solid var(--scanner-border); box-shadow: var(--scanner-shadow); box-sizing: border-box;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <span style="font-size: 13px; font-weight: 800; color: var(--scanner-text-main);">🎯 ${state.selectedTarget.name} 장비 레이아웃</span>
                        <span style="font-size: 11.5px; font-weight: 800; background: var(--scanner-inner-bg); color: var(--scanner-accent-num); padding: 3px 8px; border-radius: 6px; border: 1px solid var(--scanner-border); font-family:'Consolas';">⚔ ${targetPower.toLocaleString()}</span>
                    </div>
                    ${window.renderPresetTabButtons('target', state.selectedTarget, state.equipPresetView.target)}
                    <div id="scanner_rival_grid"></div>
                </div>
            </div>
        `;

        let arcaneDetailRowHtml = "";
        if (state.openedMetrics.arcane) {
            arcaneDetailRowHtml = `
                <div style="background: var(--scanner-inner-bg); padding:10px 12px; border-radius:8px; margin-top:8px; border:1px dashed var(--scanner-border-dashed); font-size:11px; color: var(--scanner-text-sub);">
                    <div style="display:flex; gap:10px; flex-wrap:wrap;">
                        <div style="flex:1; min-width:170px;">• 나: ${window.renderSymbolDetailedInfo(state.myCharacter.symbol, "아케인")}</div>
                        <div style="flex:1; min-width:170px;">• 상대: ${window.renderSymbolDetailedInfo(state.selectedTarget.symbol, "아케인")}</div>
                    </div>
                </div>
            `;
        }

        let authenticDetailRowHtml = "";
        if (state.openedMetrics.authentic) {
            authenticDetailRowHtml = `
                <div style="background: var(--scanner-inner-bg); padding:10px 12px; border-radius:8px; margin-top:8px; border:1px dashed var(--scanner-border-dashed); font-size:11px; color: var(--scanner-text-sub);">
                    <div style="display:flex; gap:10px; flex-wrap:wrap;">
                        <div style="flex:1; min-width:170px;">• 나: ${window.renderSymbolDetailedInfo(state.myCharacter.symbol, "어센틱")}</div>
                        <div style="flex:1; min-width:170px;">• 상대: ${window.renderSymbolDetailedInfo(state.selectedTarget.symbol, "어센틱")}</div>
                    </div>
                </div>
            `;
        }

        let hexaDetailRowHtml = "";
        if (state.openedMetrics.hexa) {
            hexaDetailRowHtml = window.renderHexaComparisonInfo(state.myCharacter.hexa_skill, state.selectedTarget.hexa_skill);
        }

        let equipDetailRowHtml = "";
        if (state.openedMetrics.equipmentDetail) {
            equipDetailRowHtml = window.renderEquipmentDetailComparison(state.myCharacter.equipment, state.selectedTarget.equipment);
        }

        const arcaneToggleText = state.openedMetrics.arcane ? '▼ 닫기' : '▶ 상세';
        const authenticToggleText = state.openedMetrics.authentic ? '▼ 닫기' : '▶ 상세';
        const hexaToggleText = state.openedMetrics.hexa ? '▼ 닫기' : '▶ 상세';
        const equipDetailToggleText = state.openedMetrics.equipmentDetail ? '▼ 닫기' : '▶ 상세';

        html += `
            <div style="margin-bottom: 16px; padding: 16px; background: var(--scanner-card-bg); border: 1px solid var(--scanner-border); border-radius: 12px; font-family: 'Pretendard', sans-serif; text-align: left; box-shadow: var(--scanner-shadow);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dashed var(--scanner-border-dashed);">
                    <div style="font-size: 13.5px; font-weight: 800; color: var(--scanner-text-main);">
                        🛡️ 고정 내실 (심볼 / 유니온 / 어빌리티 / 헥사 / 장비파츠) 정밀 대조
                    </div>
                </div>
                <div style="background: var(--scanner-inner-bg); border: 1px solid var(--scanner-border); padding: 10px 14px; border-radius: 8px; font-size: 11.5px; font-weight: 800; color: var(--scanner-text-main); margin-bottom: 12px;">
                    🔮 종합 체급 판정: ${pureVerdict}
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <!-- 1. 아케인심볼 -->
                    <div style="background: var(--scanner-inner-bg); border: 1px solid var(--scanner-border); border-radius: 8px; padding: 10px 14px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 12px; font-weight: 800; color: var(--scanner-text-main);">🔮 아케인심볼 (포스)</span>
                            <div style="display: flex; gap: 20px; align-items: center; font-size: 12px;">
                                <span>나: <b style="color:var(--accent); font-family:'Consolas';">${window.colorNum(myArcane)}</b></span>
                                <span>상대: <b style="color:var(--scanner-accent-num); font-family:'Consolas';">${window.colorNum(targetArcane)}</b></span>
                                <span style="color: var(--accent); cursor:pointer; font-weight:800; font-size:11px; padding: 2px 6px; background: var(--scanner-card-bg); border:1px solid var(--scanner-border); border-radius: 4px;" onclick="window.toggleMetricAnalysis('arcane')">${arcaneToggleText}</span>
                            </div>
                        </div>
                        ${arcaneDetailRowHtml}
                    </div>

                    <!-- 2. 어센틱심볼 -->
                    <div style="background: var(--scanner-inner-bg); border: 1px solid var(--scanner-border); border-radius: 8px; padding: 10px 14px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 12px; font-weight: 800; color: var(--scanner-text-main);">🔮 어센틱심볼 (포스)</span>
                            <div style="display: flex; gap: 20px; align-items: center; font-size: 12px;">
                                <span>나: <b style="color:var(--accent); font-family:'Consolas';">${window.colorNum(myAuthentic)}</b></span>
                                <span>상대: <b style="color:var(--scanner-accent-num); font-family:'Consolas';">${window.colorNum(targetAuthentic)}</b></span>
                                <span style="color: var(--accent); cursor:pointer; font-weight:800; font-size:11px; padding: 2px 6px; background: var(--scanner-card-bg); border:1px solid var(--scanner-border); border-radius: 4px;" onclick="window.toggleMetricAnalysis('authentic')">${authenticToggleText}</span>
                            </div>
                        </div>
                        ${authenticDetailRowHtml}
                    </div>

                    <!-- 3. 유니온 -->
                    <div style="background: var(--scanner-inner-bg); border: 1px solid var(--scanner-border); border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 12px; font-weight: 800; color: var(--scanner-text-main);">🔮 유니온 총 레벨</span>
                        <div style="display: flex; gap: 20px; align-items: center; font-size: 12px;">
                            <span>나: <b style="color:var(--accent); font-family:'Consolas';">${window.colorNum("Lv." + myUnion)}</b></span>
                            <span>상대: <b style="color:var(--scanner-accent-num); font-family:'Consolas';">${window.colorNum("Lv." + targetUnion)}</b></span>
                            <span style="font-size: 11px; color: var(--scanner-text-muted); font-family:'Consolas'; font-weight:700;">격차 ${(targetUnion - myUnion) >= 0 ? '+' + (targetUnion - myUnion) : (targetUnion - myUnion)}</span>
                        </div>
                    </div>

                    <!-- 4. 어빌리티 -->
                    <div style="background: var(--scanner-inner-bg); border: 1px solid var(--scanner-border); border-radius: 8px; padding: 12px 14px;">
                        <div style="font-size: 12px; font-weight: 800; color: var(--scanner-text-main); margin-bottom: 8px;">📜 어빌리티 세팅 비교</div>
                        <div style="display: flex; gap: 10px;">
                            <div style="flex: 1; background: var(--scanner-card-bg); border: 1px solid var(--scanner-border); border-radius: 6px; padding: 8px;">
                                <div style="font-size: 10px; font-weight: 800; color: var(--scanner-text-muted); margin-bottom: 4px;">나 (${state.myCharacter.name})</div>
                                ${window.renderAbilityPresetTabButtons('my', state.myCharacter.ability)}
                                ${window.renderAbilityPresetsInfo(state.myCharacter.ability, state.abilityPresetView.my)}
                            </div>
                            <div style="flex: 1; background: var(--scanner-card-bg); border: 1px solid var(--scanner-border); border-radius: 6px; padding: 8px;">
                                <div style="font-size: 10px; font-weight: 800; color: var(--scanner-text-muted); margin-bottom: 4px;">상대방 (${state.selectedTarget.name})</div>
                                ${window.renderAbilityPresetTabButtons('target', state.selectedTarget.ability)}
                                ${window.renderAbilityPresetsInfo(state.selectedTarget.ability, state.abilityPresetView.target)}
                            </div>
                        </div>
                    </div>

                    <!-- 5. 6차 헥사 매트릭스 복원 -->
                    <div style="background: var(--scanner-inner-bg); border: 1px solid var(--scanner-border); border-radius: 8px; padding: 12px 14px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 12px; font-weight: 800; color: var(--scanner-text-main);">🔮 6차 헥사 매트릭스 (HEXA) 정밀 대조</span>
                            <span style="color: var(--accent); cursor:pointer; font-weight:800; font-size:11px; padding: 2px 6px; background: var(--scanner-card-bg); border:1px solid var(--scanner-border); border-radius: 4px;" onclick="window.toggleMetricAnalysis('hexa')">${hexaToggleText}</span>
                        </div>
                        ${hexaDetailRowHtml}
                    </div>

                    <!-- 6. 주요 장비 파츠별 세부 대조 복원 -->
                    <div style="background: var(--scanner-inner-bg); border: 1px solid var(--scanner-border); border-radius: 8px; padding: 12px 14px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 12px; font-weight: 800; color: var(--scanner-text-main);">⚔️ 주요 장비 파츠별 1:1 정밀 세부 대조</span>
                            <span style="color: var(--accent); cursor:pointer; font-weight:800; font-size:11px; padding: 2px 6px; background: var(--scanner-card-bg); border:1px solid var(--scanner-border); border-radius: 4px;" onclick="window.toggleMetricAnalysis('equipmentDetail')">${equipDetailToggleText}</span>
                        </div>
                        ${equipDetailRowHtml}
                    </div>

                </div>
            </div>
            </div>
        `;

        container.innerHTML = html;

        const myShownPresetNum = state.equipPresetView.my || state.myCharacter.bossPresetNumber || 1;
        const targetShownPresetNum = state.equipPresetView.target || state.selectedTarget.bossPresetNumber || 1;
        const myPresetMap = { 1: state.myCharacter.item_preset_1, 2: state.myCharacter.item_preset_2, 3: state.myCharacter.item_preset_3 };
        const targetPresetMap = { 1: state.selectedTarget.item_preset_1, 2: state.selectedTarget.item_preset_2, 3: state.selectedTarget.item_preset_3 };
        const myShownEquip = (myPresetMap[myShownPresetNum] && myPresetMap[myShownPresetNum].length > 0) ? myPresetMap[myShownPresetNum] : state.myCharacter.equipment;
        const targetShownEquip = (targetPresetMap[targetShownPresetNum] && targetPresetMap[targetShownPresetNum].length > 0) ? targetPresetMap[targetShownPresetNum] : state.selectedTarget.equipment;

        if (myShownEquip) {
            window.renderScannerEquip(myShownEquip, 'scanner_my_grid', true);
        }
        if (targetShownEquip) {
            window.renderScannerEquip(targetShownEquip, 'scanner_rival_grid', false);
        }

    } catch (crashErr) {
        console.error("[OMNI SCANNER 렌더링 실패!]:", crashErr);
        container.innerHTML = `
            <div style="padding: 16px; color: #ef4444; background: var(--scanner-card-bg); border: 1px solid #fca5a5; border-radius: 8px; font-family: sans-serif;">
                <div style="font-weight:800; margin-bottom:4px; font-size:13px;">🚨 렌더링 오류 발생</div>
                <div style="font-size: 11.5px; font-family: monospace;">${crashErr.message}</div>
            </div>
        `;
    }
};

// ============================================================================
// 🔌 [PART 6] 외부 실시간 API 연동 수집 코어
// ============================================================================

window.updateScannerContext = function(parsedResult) {
    if (!parsedResult || !parsedResult.basic) return;
    localStorage.setItem('omni_last_active_search_data', JSON.stringify({ data: parsedResult, savedAt: Date.now() }));
    
    const state = window.omniScannerState;
    state.searchQuery = parsedResult.basic.character_name;
    window.cacheScannerData.save(state.searchQuery, parsedResult);

    const rawHexaSkill = parsedResult.hexa_skill?.character_hexa_core_equipment || parsedResult.hexa_skill?.character_hexa_skill_equipment || [];
    const rawEquip = parsedResult.item?.item_equipment || [];
    const p1 = parsedResult.item?.item_equipment_preset_1 || [];
    const p2 = parsedResult.item?.item_equipment_preset_2 || [];
    const p3 = parsedResult.item?.item_equipment_preset_3 || [];
    const bossResult = window.findBestBossPreset(p1, p2, p3, rawEquip, parsedResult.basic.character_name);

    state.myCharacter = {
        name: parsedResult.basic.character_name,
        class: parsedResult.basic.character_class,
        level: parsedResult.basic.character_level,
        world: parsedResult.basic.world_name, 
        character_image: parsedResult.basic.character_image || "",
        stats: parsedResult.stat?.final_stat || [],
        equipment: bossResult.equip,
        item_preset_1: p1.length > 0 ? p1 : rawEquip,
        item_preset_2: p2,
        item_preset_3: p3,
        bossPresetNumber: bossResult.presetNumber,
        union: parsedResult.union || { union_level: 0 },
        symbol: parsedResult.symbol?.symbol || [],
        vmatrix: parsedResult.vmatrix?.character_v_core_equipment || [],
        hexa_skill: rawHexaSkill,
        ability: parsedResult.ability || null,
        confirmedDate: parsedResult.confirmedDate || getSafeRankingDate()
    };

    state.equipPresetView.my = 0;
    state.isSearched = true;

    const scannerContainer = document.getElementById('scannerContent') || document.getElementById('page-scanner');
    if (scannerContainer && scannerContainer.style.display !== 'none' && !scannerContainer.classList.contains('hidden')) {
        window.renderOmniScannerUI();
    }
};

window.countDropItemParts = function(equipList) {
    if (!equipList || !Array.isArray(equipList)) return 0;
    let count = 0;
    equipList.forEach(eq => {
        const options = [
            eq.potential_option_1, eq.potential_option_2, eq.potential_option_3,
            eq.additional_potential_option_1, eq.additional_potential_option_2, eq.additional_potential_option_3
        ];
        const hasDrop = options.some(opt => opt && opt.includes("아이템 획득 확률"));
        if (hasDrop) count++;
    });
    return count;
};

window.calculatePresetPowerScore = function(equipList) {
    if (!equipList || !Array.isArray(equipList)) return 0;
    let score = 0;
    equipList.forEach(eq => {
        const baseOpt = eq.item_base_option || {};
        const starOpt = eq.item_starforce_option || {};
        const addOpt = eq.item_add_option || {};
        const etcOpt = eq.item_etc_option || {};
        const sumKey = (key) => (Number(baseOpt[key]) || 0) + (Number(starOpt[key]) || 0) + (Number(addOpt[key]) || 0) + (Number(etcOpt[key]) || 0);
        score += sumKey('attack_power') * 4;
        score += sumKey('magic_power') * 4;
        score += sumKey('boss_damage') * 20;
        score += sumKey('ignore_monster_armor') * 20;
        score += sumKey('all_stat') * 15;
        score += sumKey('str') + sumKey('dex') + sumKey('int') + sumKey('luk');
    });
    return score;
};

window.getCachedBossPreset = function(charName) {
    try {
        const store = JSON.parse(localStorage.getItem('omni_v14_boss_preset_cache') || '{}');
        return store[charName] || null;
    } catch (e) {
        return null;
    }
};

window.saveCachedBossPreset = function(charName, presetNumber, equipList) {
    try {
        const store = JSON.parse(localStorage.getItem('omni_v14_boss_preset_cache') || '{}');
        store[charName] = { presetNumber, equip: equipList, savedAt: Date.now() };
        localStorage.setItem('omni_v14_boss_preset_cache', JSON.stringify(store));
    } catch (e) {
        console.error("[OMNI BOSS PRESET CACHE ERROR]:", e);
    }
};

window.findBestBossPreset = function(p1, p2, p3, currentEquip, charName) {
    if (charName) {
        const cached = window.getCachedBossPreset(charName);
        if (cached && cached.equip && cached.equip.length > 0) {
            return { equip: cached.equip, presetNumber: cached.presetNumber, fromCache: true };
        }
    }

    const presetList = [
        { num: 1, equip: p1 }, { num: 2, equip: p2 }, { num: 3, equip: p3 }
    ].filter(p => p.equip && p.equip.length > 0);

    if (presetList.length === 0) {
        return { equip: currentEquip || [], presetNumber: 0, fromCache: false };
    }

    let candidates = presetList.filter(p => window.countDropItemParts(p.equip) < 2);
    if (candidates.length === 0) candidates = presetList;

    candidates.sort((a, b) => window.calculatePresetPowerScore(b.equip) - window.calculatePresetPowerScore(a.equip));
    const chosen = candidates[0];

    if (charName) {
        window.saveCachedBossPreset(charName, chosen.num, chosen.equip);
    }

    return { equip: chosen.equip, presetNumber: chosen.num, fromCache: false };
};

window.verifyAndLoadBossTarget = async function(userName, targetDate, isForceReset = false) {
    try {
        if (!isForceReset) {
            try {
                const historyList = JSON.parse(localStorage.getItem('omniScannerBossHistory') || '{}');
                if (historyList[userName]) {
                    return historyList[userName];
                }
            } catch(e) {}
        }

        const idData = await fetchFromNexonWithRetry("/id", { character_name: userName }).catch(() => null);
        if (!idData || !idData.ocid) return null;
        const ocid = idData.ocid;

        const { bData, finalUsedDate } = await window.fetchFreshestCharacterBasic(ocid);
        if (!bData || !bData.character_name) return null;

        const [iData, sData] = await Promise.all([
            fetchFromNexonWithRetry("/character/item-equipment", { ocid: ocid, date: finalUsedDate }).catch(() => null),
            fetchFromNexonWithRetry("/character/stat", { ocid: ocid, date: finalUsedDate }).catch(() => null)
        ]);

        await sleep(150);

        const [vData, hData] = await Promise.all([
            fetchFromNexonWithRetry("/character/vmatrix", { ocid: ocid, date: finalUsedDate }).catch(() => null),
            fetchFromNexonWithRetry("/character/hexamatrix", { ocid: ocid, date: finalUsedDate }).catch(() => null)
        ]);

        await sleep(150);

        const [symData, uData, abData] = await Promise.all([
            fetchFromNexonWithRetry("/character/symbol-equipment", { ocid: ocid, date: finalUsedDate }).catch(() => null),
            fetchFromNexonWithRetry("/user/union", { ocid: ocid, date: finalUsedDate }).catch(() => null),
            fetchFromNexonWithRetry("/character/ability", { ocid: ocid, date: finalUsedDate }).catch(() => null)
        ]);

        const rawEquip = iData?.item_equipment || [];
        const p1 = iData?.item_equipment_preset_1 || [];
        const p2 = iData?.item_equipment_preset_2 || [];
        const p3 = iData?.item_equipment_preset_3 || [];

        const bossResult = window.findBestBossPreset(p1, p2, p3, rawEquip, userName);
        const bestBossEquip = bossResult.equip;

        const finalStats = (sData && sData.final_stat) ? sData.final_stat : [];
        const vmatrixList = (vData && vData.character_v_core_equipment) ? vData.character_v_core_equipment : [];
        
        let hexaSkillList = [];
        if (hData) {
            hexaSkillList = hData.character_hexa_core_equipment || hData.character_hexa_skill_equipment || [];
        }
        
        const realSymbolList = (symData && symData.symbol) ? symData.symbol : [];
        const unionData = uData || { union_level: 0 };

        const targetPayload = {
            name: userName,
            level: bData.character_level || 260,
            world: bData.world_name || "",
            class: bData.character_class || "직업 미상",
            character_image: bData.character_image || "",
            stats: finalStats,
            equipment: bestBossEquip,
            item_preset_1: p1.length > 0 ? p1 : rawEquip,
            item_preset_2: p2,
            item_preset_3: p3,
            bossPresetNumber: bossResult.presetNumber,
            hexa_skill: hexaSkillList,
            vmatrix: vmatrixList,
            union: unionData,
            symbol: realSymbolList,
            ability: abData || null
        };

        try {
            let historyList = JSON.parse(localStorage.getItem('omniScannerBossHistory') || '{}');
            historyList[userName] = targetPayload;
            localStorage.setItem('omniScannerBossHistory', JSON.stringify(historyList));
        } catch(err) {}

        return targetPayload;
    } catch (e) {
        console.error("[OMNI TARGET LOAD ERROR]:", e);
        return null;
    }
};

window.silentRefreshMyCharacter = async function(myName) {
    if (!myName || isScanningLock) return;
    try {
        const myIdData = await fetchFromNexonWithRetry("/id", { character_name: myName }).catch(() => null);
        if (!myIdData || !myIdData.ocid) return;
        const myOcid = myIdData.ocid;

        const { bData: myBasic, finalUsedDate: myFreshDate } = await window.fetchFreshestCharacterBasic(myOcid);
        if (!myBasic || !myBasic.character_name) return;

        const myStat = await fetchFromNexonWithRetry("/character/stat", { ocid: myOcid, date: myFreshDate }).catch(() => null);
        const myItem = await fetchFromNexonWithRetry("/character/item-equipment", { ocid: myOcid, date: myFreshDate }).catch(() => null);
        await sleep(150);

        const myUnion = await fetchFromNexonWithRetry("/user/union", { ocid: myOcid, date: myFreshDate }).catch(() => null);
        const mySymbol = await fetchFromNexonWithRetry("/character/symbol-equipment", { ocid: myOcid, date: myFreshDate }).catch(() => null);
        const myVmatrix = await fetchFromNexonWithRetry("/character/vmatrix", { ocid: myOcid, date: myFreshDate }).catch(() => null);
        const myHexamatrix = await fetchFromNexonWithRetry("/character/hexamatrix", { ocid: myOcid, date: myFreshDate }).catch(() => null);
        const myAbility = await fetchFromNexonWithRetry("/character/ability", { ocid: myOcid, date: myFreshDate }).catch(() => null);

        const myParsedResult = {
            basic: myBasic, stat: myStat, item: myItem, union: myUnion,
            symbol: mySymbol, vmatrix: myVmatrix, hexa_skill: myHexamatrix, ability: myAbility, confirmedDate: myFreshDate
        };

        window.updateScannerContext(myParsedResult);
    } catch (e) {
        console.error("[OMNI SILENT REFRESH ERROR]:", e);
    }
};

window.triggerScannerManualSearch = function(isForceReset = false) {
    if (isScanningLock) return;

    const myInputEl = document.getElementById('scannerSearchInput');
    const targetInputEl = document.getElementById('targetSearchInput');
    
    const myName = myInputEl?.value?.trim();
    const targetName = targetInputEl?.value?.trim();
    
    if (myName) localStorage.setItem('omniMainCharacter', myName);
    if (!myName) { alert("기준 캐릭터(나)의 닉네임을 입력해주세요."); return; }
    if (!localStorage.getItem("nexon_api_key")) { alert("API 키가 설정되지 않았습니다."); return; }

    isScanningLock = true;
    const targetDate = getSafeRankingDate();

    if (typeof window.showLoadingUI === 'function') {
        window.showLoadingUI();
    } else {
        if (!document.getElementById('omniLoadingSpinner')) {
            const div = document.createElement('div');
            div.id = 'omniLoadingSpinner';
            div.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(18,18,26,0.85); backdrop-filter:blur(5px); z-index:999999; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:16px;";
            div.innerHTML = `
                <div style="width:50px; height:50px; border:4px solid rgba(167,139,250,0.2); border-top:4px solid #a78bfa; border-radius:50%; animation:omniSpin 0.8s linear infinite;"></div>
                <p style="color:#ffffff; font-size:15px; font-weight:800; letter-spacing:-0.3px; margin:0; text-shadow:0 2px 4px rgba(0,0,0,0.5);">⚡ 최신 메이플 API 데이터 정밀 수집 중...</p>
            `;
            document.body.appendChild(div);
        }
    }

    (async () => {
        try {
            const searchStartTime = Date.now();
            const cachedMyData = !isForceReset ? window.cacheScannerData.load(myName) : null;
            
            if (cachedMyData) {
                window.updateScannerContext(cachedMyData);
            } else {
                const myIdData = await fetchFromNexonWithRetry("/id", { character_name: myName }).catch(() => null);
                if (!myIdData || !myIdData.ocid) { alert(`"${myName}" 기준 캐릭터를 찾을 수 없습니다.`); return; }
                const myOcid = myIdData.ocid;

                const { bData: myBasic, finalUsedDate: myFreshDate } = await window.fetchFreshestCharacterBasic(myOcid);
                if (!myBasic || !myBasic.character_name) { alert("기준 캐릭터 정보를 불러오지 못했습니다."); return; }

                const myStat = await fetchFromNexonWithRetry("/character/stat", { ocid: myOcid, date: myFreshDate }).catch(() => null);
                const myItem = await fetchFromNexonWithRetry("/character/item-equipment", { ocid: myOcid, date: myFreshDate }).catch(() => null);
                await sleep(150);

                const myUnion = await fetchFromNexonWithRetry("/user/union", { ocid: myOcid, date: myFreshDate }).catch(() => null);
                const mySymbol = await fetchFromNexonWithRetry("/character/symbol-equipment", { ocid: myOcid, date: myFreshDate }).catch(() => null);
                const myVmatrix = await fetchFromNexonWithRetry("/character/vmatrix", { ocid: myOcid, date: myFreshDate }).catch(() => null);
                const myHexamatrix = await fetchFromNexonWithRetry("/character/hexamatrix", { ocid: myOcid, date: myFreshDate }).catch(() => null);
                const myAbility = await fetchFromNexonWithRetry("/character/ability", { ocid: myOcid, date: myFreshDate }).catch(() => null);

                const myParsedResult = {
                    basic: myBasic, stat: myStat, item: myItem, union: myUnion,
                    symbol: mySymbol, vmatrix: myVmatrix, hexa_skill: myHexamatrix, ability: myAbility, confirmedDate: myFreshDate
                };

                window.updateScannerContext(myParsedResult);
            }

            if (targetName) {
                const manualTarget = await window.verifyAndLoadBossTarget(targetName, targetDate, isForceReset);
                if (manualTarget && manualTarget.stats && manualTarget.stats.length > 0) {
                    window.omniScannerState.selectedTarget = manualTarget;
                    window.omniScannerState.comparisonList = [manualTarget];
                    window.omniScannerState.equipPresetView.target = 0;
                } else {
                    alert(`"${targetName}" 상대 유저 정보를 불러오지 못했습니다.`);
                }
            }

            const elapsed = Date.now() - searchStartTime;
            if (elapsed < 800) {
                await sleep(800 - elapsed);
            }

        } catch (err) {
            console.error("[OMNI MANUAL SEARCH ERROR]:", err);
        } finally {
            if (typeof window.hideLoadingUI === 'function') {
                window.hideLoadingUI();
            } else {
                const el = document.getElementById('omniLoadingSpinner');
                if (el) el.remove();
            }
            window.omniScannerState.isLoadingRivals = false;
            window.renderOmniScannerUI();
            isScanningLock = false;
        }
    })();
};

window.toggleMetricAnalysis = function(metricKey) {
    const state = window.omniScannerState;
    if (state.openedMetrics[metricKey] !== undefined) {
        state.openedMetrics[metricKey] = !state.openedMetrics[metricKey];
        window.renderOmniScannerUI();
    }
};

window.initOmniScannerTab = function() {
    const runScanner = () => {
        const container = document.getElementById('scannerContent') || document.getElementById('page-scanner');
        if (!container) return false;
        
        if (!window.omniScannerState.myCharacter) {
            let restoredData = null;
            let isStale = false;
            try {
                const lastActiveRaw = localStorage.getItem('omni_last_active_search_data');
                if (lastActiveRaw) {
                    const parsed = JSON.parse(lastActiveRaw);
                    if (parsed && typeof parsed === 'object' && 'savedAt' in parsed) {
                        restoredData = parsed.data;
                        isStale = (Date.now() - parsed.savedAt) > window.cacheScannerData.ttlMs;
                    } else {
                        restoredData = parsed;
                        isStale = true;
                    }
                }
            } catch(e) {}

            if (restoredData && restoredData.basic) {
                window.updateScannerContext(restoredData);
                if (isStale) {
                    window.silentRefreshMyCharacter(restoredData.basic.character_name);
                }
                return true;
            }
        }
        window.renderOmniScannerUI();
        return true;
    };

    if (runScanner()) return;
    if (window.omniScannerIntervalId) clearInterval(window.omniScannerIntervalId);
    window.omniScannerIntervalId = setInterval(() => { if (runScanner()) clearInterval(window.omniScannerIntervalId); }, 200);
};

document.addEventListener('click', function(e) {
    const target = e.target;
    if (target && (target.id === 'scannerSearchBtn' || target.closest('#scannerSearchBtn'))) {
        window.triggerScannerManualSearch(false);
    }
    if (target && (target.id === 'scannerRefreshBtn' || target.closest('#scannerRefreshBtn'))) {
        window.triggerScannerManualSearch(true);
    }
});

if (document.getElementById('scannerContent') || document.getElementById('page-scanner')) {
    window.initOmniScannerTab();
}