/**
 * ============================================================================
 * 🛠️ builder/logic.js - 코어 로직, 계산 및 이벤트 핸들러
 * ============================================================================
 */

window.clearAllCache = function() {
    localStorage.removeItem('maple_builder_data');
    localStorage.removeItem('maple_last_search');
    alert("캐시가 초기화되었습니다. 다시 검색해주세요.");
    location.reload();
};

window.triggerBuilderSearch = async function() {
    window.history.replaceState(null, '', window.location.href);

    const input = document.getElementById('builder_nick_input');
    if (!input || !input.value.trim()) {
        alert("닉네임을 입력해주세요!");
        return;
    }
    
    const nick = input.value.trim();
    const btn = input.nextElementSibling;
    if (btn) btn.innerText = "검색중...";
    
    try {
        if (typeof window.searchCharacter === 'function') {
            await window.searchCharacter(nick);
            window.builderCurrentData = window.currentSearchData;
            localStorage.setItem('maple_builder_data', JSON.stringify(window.builderCurrentData));
            
            if (!window.searchHistory.includes(nick)) {
                window.searchHistory.unshift(nick);
                if (window.searchHistory.length > 5) window.searchHistory.pop();
                localStorage.setItem('maple_search_history', JSON.stringify(window.searchHistory));
            }
            window.renderBuilderUI();

        } else if (typeof window.fetchMapleData === 'function') {
            const sidebarInput = document.getElementById('sidebarSearchInput');
            if (sidebarInput) sidebarInput.value = nick;
            await window.fetchMapleData();
            window.builderCurrentData = window.currentSearchData;
            localStorage.setItem('maple_builder_data', JSON.stringify(window.builderCurrentData));
            window.renderBuilderUI();
        } else {
            alert("검색 모듈을 찾을 수 없습니다.");
            if (btn) btn.innerText = "검색";
        }
    } catch (e) {
        console.error("검색 중 오류 발생:", e);
        alert("검색 중 오류가 발생했습니다. 다시 시도해주세요.");
        if (btn) btn.innerText = "검색";
    }
};

window.refreshBuilderData = async function() {
    if (!window.builderCurrentData || !window.builderCurrentData.basic) {
        alert("먼저 캐릭터를 검색해주세요.");
        return;
    }
    
    const nick = window.builderCurrentData.basic.character_name;
    const btn = event.target;
    btn.innerText = "갱신 중...";
    btn.disabled = true;

    try {
        await window.searchCharacter(nick, false, true, true);
        window.builderCurrentData = window.currentSearchData;
        localStorage.setItem('maple_builder_data', JSON.stringify(window.builderCurrentData));
        
        window.renderBuilderUI();
        window.calcBuilderStats();
        alert(`✅ ${nick} 데이터 갱신 완료!`);
    } catch (e) {
        alert("갱신 실패: 다시 시도해주세요.");
    } finally {
        btn.innerText = "🔄 API 데이터 갱신";
        btn.disabled = false;
    }
};



window.saveBossPreset = function() {
    const dataToSave = {
        items: window.builderEquippedItems,
        stats: window.activePresetStats
    };
    localStorage.setItem('builder_boss_preset', JSON.stringify(dataToSave));
    alert("✅ API 보스셋팅 기록이 저장되었습니다!");
};

window.syncEquipToBuilder = async function(presetNum = 1) {
    const data = window.builderCurrentData;
    if (!data || !data.item) return;
    
    window.currentSelectedSlotIndex = -1;
    const badge = document.getElementById('builder_edit_badge');
    if(badge) badge.style.display = 'none';

    let equipList = data.item[`item_equipment_preset_${presetNum}`] || data.item.item_equipment;
    const slots = document.querySelectorAll('#builder_current_grid .maple-slot');
    
    window.builderEquippedItems = Array(30).fill(null);
    
    for (let idx = 0; idx < slots.length; idx++) {
        const slot = slots[idx];
        const slotName = MAPLE_SLOT_NAMES[idx];
        if (!slotName) continue;
        
        const item = equipList.find(eq => eq.item_equipment_slot === slotName || 
            (slotName === "상의" && eq.item_equipment_slot === "한벌옷") || 
            (slotName === "펜던트1" && eq.item_equipment_slot === "펜던트") || 
            (slotName === "뱃지" && eq.item_equipment_slot === "배지"));
        
        if (item) {
            const baseStat = parseInt(item.item_base_option?.str) || parseInt(item.item_base_option?.int) || 0;
            const baseAtk = parseInt(item.item_base_option?.attack_power) || parseInt(item.item_base_option?.magic_power) || 0;
            
            const parsePot = (opt) => {
                if(!opt) return {type: 'none', value: 0};
                let type = 'none';
                
                if (opt.includes('STR') && opt.includes('%')) type = 'STR%';
                else if (opt.includes('DEX') && opt.includes('%')) type = 'DEX%';
                else if (opt.includes('INT') && opt.includes('%')) type = 'INT%';
                else if (opt.includes('LUK') && opt.includes('%')) type = 'LUK%';
                else if (opt.includes('올스탯')) type = '올스탯%';
                else if (opt.includes('공격력') && opt.includes('%')) type = '공격력%';
                else if (opt.includes('마력') && opt.includes('%')) type = '마력%';
                else if (opt.includes('보스 몬스터 공격 시 데미지')) type = '보스 데미지%';
                else if (opt.includes('크리티컬 데미지')) type = '크리티컬 데미지%';
                else if (opt.includes('아이템 드롭률')) type = '아이템 드롭률%';
                else if (opt.includes('메소 획득량')) type = '메소 획득량%';
                else if (opt.includes('데미지') && opt.includes('%')) type = '데미지%';
                else if (opt.includes('공격력')) type = '공격력';
                else if (opt.includes('마력')) type = '마력';
                else if (opt.includes('STR')) type = 'STR';
                else if (opt.includes('DEX')) type = 'DEX';
                else if (opt.includes('INT')) type = 'INT';
                else if (opt.includes('LUK')) type = 'LUK';

                return {type: type, value: parseInt(opt.replace(/[^0-9]/g, '')) || 0};
            };

            const parsedPots = [
                parsePot(item.potential_option_1),
                parsePot(item.potential_option_2),
                parsePot(item.potential_option_3)
            ];

            const parsedAddPots = [
                parsePot(item.additional_potential_option_1),
                parsePot(item.additional_potential_option_2),
                parsePot(item.additional_potential_option_3)
            ];

            window.builderEquippedItems[idx] = { 
                item_name: item.item_name,
                starforce: parseInt(item.starforce || 0),
                base_stat: baseStat,
                base_atk: baseAtk,
                level: parseInt(item.item_base_option?.base_equipment_level) || 140,
                base_option: item.item_base_option,
                add_option: item.item_add_option || { str:0, dex:0, int:0, luk:0, attack_power:0, magic_power:0, all_stat:0 },
                etc_option: item.item_etc_option,
                starforce_option: item.item_starforce_option,
                scrolls: [], 
                potentials: JSON.parse(JSON.stringify(parsedPots)),
                additional_potentials: JSON.parse(JSON.stringify(parsedAddPots)),
                original_potentials: JSON.parse(JSON.stringify(parsedPots)),
                original_add_option: JSON.parse(JSON.stringify(item.item_add_option || { str:0, dex:0, int:0, luk:0, attack_power:0, magic_power:0, all_stat:0 })) 
            };

            const iconUrl = item.item_icon;
            if (iconUrl && iconUrl !== "null" && iconUrl !== "") {
                slot.innerHTML = `
                    <img src="${iconUrl}" 
                         onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='block';" 
                         style="width: 32px; height: 32px; object-fit: contain;">
                    <div style="display:none; font-size:9px; color:#64748b; text-align:center; padding:1px; line-height:1.1;">${item.item_name.substring(0,4)}</div>
                `;
            } else {
                slot.innerHTML = `<div style="font-size:9px; color:#475569; text-align:center; padding:1px; font-weight:800; line-height:1.1;">${item.item_name.substring(0,4)}</div>`;
            }
            slot.style.borderColor = item.potential_option_1 ? '#c084fc' : '#60a5fa';
            slot.style.background = '#ffffff';
        } else {
            slot.innerHTML = "";
            slot.style.borderColor = '#e2e8f0';
            slot.style.background = '#f8fafc';
        }
    }
    window.renderSetEffects();
    window.calcBuilderStats();
};

window.changeBuilderPreset = async function(num) {
    window.history.replaceState(null, '', window.location.href);

    window.currentPreset = num;
    await window.syncEquipToBuilder(num);

    const setupName = window.getAutoPresetName();
    const isBoss = (setupName === "보스 세팅");
    
    const statusEl = document.getElementById('status_display');
    if (statusEl) {
        const dotColor = isBoss ? "#ef4444" : "#10b981"; 
        statusEl.innerHTML = `
            <div style="display:flex; align-items:center; gap:6px; padding: 3px 8px; border-radius: 4px; background: #f8fafc; color: #475569; font-weight: 700; font-size: 11px; border: 1px solid #e2e8f0; letter-spacing: -0.2px;">
                <div style="width: 6px; height: 6px; border-radius: 50%; background: ${dotColor}; box-shadow: 0 0 4px ${dotColor}80;"></div>
                ${setupName}
            </div>
        `;
    }

    if (window.builderCurrentData && window.builderCurrentData.stat) {
        const presetKey = `stat_preset_${num}`;
        window.activePresetStats = window.builderCurrentData.stat[presetKey] || window.builderCurrentData.stat.final_stat;
    }

    const isHunting = (setupName === "사냥 세팅");

    [1,2,3].forEach(i => {
        const btn = document.getElementById(`p_btn_${i}`);
        if(btn) {
            const isActive = (i === num);
            if (isActive) {
                const activeBg = isBoss ? "#ef4444" : "#10b981";
                btn.style.background = activeBg;
                btn.style.color = "#ffffff";
                btn.style.borderColor = activeBg;
                btn.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
            } else {
                btn.style.background = "#ffffff";
                btn.style.color = "#94a3b8";
                btn.style.borderColor = "#e2e8f0";
                
                if (isHunting && i === 2) {
                    btn.style.borderColor = "#cbd5e1";
                    btn.style.color = "#64748b";
                } else {
                    btn.style.borderColor = "#e2e8f0";
                }
            }
        }
    });
    
    window.renderDetailedStats(); 
    window.calcBuilderStats();
};

window.selectBuilderSlot = function(index) {
    window.currentSelectedSlotIndex = index;
    const slotName = MAPLE_SLOT_NAMES[index] || "장비 슬롯";
    const titleEl = document.getElementById('edit_slot_name');
    if (titleEl) titleEl.innerText = "✨ " + slotName + " 설정";
    
    const slots = document.querySelectorAll('#builder_current_grid .maple-slot');
    slots.forEach(s => s.style.boxShadow = 'none');
    if(slots[index]) slots[index].style.boxShadow = '0 0 0 3px #3b82f6';
    
    const badge = document.getElementById('builder_edit_badge');
    if(badge) badge.style.display = 'flex';

    const eqItem = window.builderEquippedItems[index];
    if (eqItem) {
        window.currentSlotBaseStar = eqItem.starforce || 0;
        window.currentSlotBaseScrollStat = 0; 
        window.currentSlotBaseScrollAtk = 0;
        
        window.simStar = window.currentSlotBaseStar;
        window.simScrollStat = window.currentSlotBaseScrollStat;
        window.simScrollAtk = window.currentSlotBaseScrollAtk;

        document.getElementById('addOptStr').value = eqItem.add_option?.str || '';
        document.getElementById('addOptDex').value = eqItem.add_option?.dex || '';
        document.getElementById('addOptInt').value = eqItem.add_option?.int || '';
        document.getElementById('addOptLuk').value = eqItem.add_option?.luk || '';
        document.getElementById('addOptAtk').value = eqItem.add_option?.attack_power || '';
        document.getElementById('addOptMatk').value = eqItem.add_option?.magic_power || '';
        document.getElementById('addOptAll').value = eqItem.add_option?.all_stat || '';
    } else {
        window.currentSlotBaseStar = 0;
        window.currentSlotBaseScrollStat = 0;
        window.currentSlotBaseScrollAtk = 0;
        window.simStar = 0;
        window.simScrollStat = 0;
        window.simScrollAtk = 0;

        document.getElementById('addOptStr').value = '';
        document.getElementById('addOptDex').value = '';
        document.getElementById('addOptInt').value = '';
        document.getElementById('addOptLuk').value = '';
        document.getElementById('addOptAtk').value = '';
        document.getElementById('addOptMatk').value = '';
        document.getElementById('addOptAll').value = '';
    }
    
    document.getElementById('builderValStar').innerText = window.simStar + '성';
    
    const scrollBtn = document.getElementById('btn_scroll_popup');
    if (scrollBtn) {
        const isSpecialSlot = ['엠블렘', '뱃지', '훈장', '안드로이드', '기계 심장'].some(s => slotName.includes(s));
        scrollBtn.style.display = isSpecialSlot ? 'none' : 'block';
    }

    const searchInput = document.getElementById('item_search_filter');
    if(searchInput) searchInput.value = ""; 

    window.showItemSelectionList(slotName);
    window.renderPotentialInputs();
};

window.showItemSelectionList = function(slotName) {
    const name = slotName.replace('✨ ', '').replace(' 설정', '');
    const listContainer = document.getElementById('edit_base_item');
    if (!listContainer) return;
    
    listContainer.innerHTML = '<option value="none">아이템을 선택하세요</option>';
    
    const data = window.builderCurrentData;
    let jobGroup = "공통";
    if (data && data.basic) {
        jobGroup = window.getJobGroup(data.basic.character_class);
    }
    
    let dbSlotName = name.replace(/[0-9]/g, "").trim();
    let mergedItems = [];
    let mergedCategories = {};

    const addItemsFromDB = (dbGroup) => {
        if (!window.COMMON_ARMOR_DB || !window.COMMON_ARMOR_DB[dbGroup]) return;
        const items = window.COMMON_ARMOR_DB[dbGroup][dbSlotName];
        if (!items) return;

        if (Array.isArray(items)) {
            mergedItems = mergedItems.concat(items);
        } else if (typeof items === 'object') {
            Object.keys(items).forEach(category => {
                if (!mergedCategories[category]) mergedCategories[category] = [];
                mergedCategories[category] = mergedCategories[category].concat(items[category]);
            });
        }
    };

    if (typeof window.COMMON_ARMOR_DB !== 'undefined') {
        addItemsFromDB("공통");
        if (jobGroup !== "공통") addItemsFromDB(jobGroup);

        if (mergedItems.length > 0) {
            [...new Set(mergedItems)].forEach(i => {
                listContainer.innerHTML += `<option value="${i}">${i}</option>`;
            });
        }
        Object.keys(mergedCategories).forEach(category => {
            listContainer.innerHTML += `<option disabled style="font-weight:900; background:#e2e8f0; color:#475569;">[${category}]</option>`;
            [...new Set(mergedCategories[category])].forEach(i => {
                listContainer.innerHTML += `<option value="${i}">&nbsp;&nbsp;${i}</option>`;
            });
        });
    }

    const eqItem = window.builderEquippedItems[window.currentSelectedSlotIndex];
    if (eqItem && eqItem.item_name) {
        if (!listContainer.querySelector(`option[value="${eqItem.item_name}"]`)) {
            listContainer.innerHTML += `<option value="${eqItem.item_name}">${eqItem.item_name}</option>`;
        }
        listContainer.value = eqItem.item_name;
    } else {
        listContainer.value = "none";
    }

    window.filterItemList();
    window.updateBuilderPreview();
};

window.updateBuilderPreview = function() {
    const itemName = document.getElementById('edit_base_item')?.value;
    const iconContainer = document.getElementById('edit_item_icon');
    if (!iconContainer) return;
    
    const slots = document.querySelectorAll('#builder_current_grid .maple-slot');
    
    if (!itemName || itemName === "none") { 
        iconContainer.innerHTML = '🖱️'; 
        if (window.currentSelectedSlotIndex !== -1) {
            slots[window.currentSelectedSlotIndex].innerHTML = "";
            window.builderEquippedItems[window.currentSelectedSlotIndex] = null;
        }
        window.renderSetEffects();
        window.calcBuilderStats();
        return; 
    }

    let apiItem = window.builderCurrentData?.item?.item_equipment?.find(i => i.item_name === itemName);
    const iconUrl = (apiItem && apiItem.item_icon) ? apiItem.item_icon : (window.getLocalItemIconBase(itemName) + ".png");
    
    if (window.currentSelectedSlotIndex !== -1) {
        if (!window.builderEquippedItems[window.currentSelectedSlotIndex]) {
            window.builderEquippedItems[window.currentSelectedSlotIndex] = {};
        }
        window.builderEquippedItems[window.currentSelectedSlotIndex].item_name = itemName;
        window.builderEquippedItems[window.currentSelectedSlotIndex].item_icon = iconUrl;
    }
    
    iconContainer.innerHTML = `
        <img src="${iconUrl}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'; this.parentElement.style.background='#f1f5f9';" style="width: 40px; height: 40px; object-fit: contain;">
        <div style="display:none; font-size:11px; font-weight:800; text-align:center; color:#334155; padding:4px;">${itemName}</div>
    `;
    
    if (window.currentSelectedSlotIndex !== -1) {
        slots[window.currentSelectedSlotIndex].innerHTML = `
            <img src="${iconUrl}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" style="width: 32px; height: 32px; object-fit: contain;">
            <div style="display:none; font-size:9px; color:#475569; text-align:center; padding:1px; font-weight:800; line-height:1.1;">${itemName.substring(0,4)}</div>
        `;
    }
    
    window.renderSetEffects();
    window.calcBuilderStats();
};

window.filterItemList = function() {
    const keyword = document.getElementById('item_search_filter').value.toLowerCase();
    const select = document.getElementById('edit_base_item');
    if(!select) return;
    const options = select.getElementsByTagName('option');
    
    for(let i=0; i<options.length; i++) {
        if(options[i].disabled) continue; 
        const text = options[i].innerText.toLowerCase();
        if(text.includes(keyword)) {
            options[i].style.display = '';
        } else {
            options[i].style.display = 'none';
        }
    }
};

window.changeBuilderStar = function(val) { 
    if(window.currentSelectedSlotIndex === -1) {
        alert("장착 보드에서 장비를 먼저 클릭해주세요!");
        return;
    }
    window.simStar = Math.max(0, Math.min(25, window.simStar + val)); 
    document.getElementById('builderValStar').innerText = window.simStar + '성'; 
    if (window.builderEquippedItems[window.currentSelectedSlotIndex]) {
        window.builderEquippedItems[window.currentSelectedSlotIndex].starforce = window.simStar;
    }
    window.calcBuilderStats(); 
};

window.updateAddOption = function(key, val) {
    if (window.currentSelectedSlotIndex === -1) return;
    let item = window.builderEquippedItems[window.currentSelectedSlotIndex];
    if (!item) return;
    
    if (!item.add_option) item.add_option = { str:0, dex:0, int:0, luk:0, attack_power:0, magic_power:0, all_stat:0 };
    item.add_option[key] = val ? parseInt(val) : 0;
    
    window.calcBuilderStats();
};

window.updateSlotPotential = function(idx, key, val, isAdd = false) {
    if (window.currentSelectedSlotIndex === -1) return;
    
    let item = window.builderEquippedItems[window.currentSelectedSlotIndex];
    if (!item) return;

    if (isAdd) {
        if (!item.additional_potentials) item.additional_potentials = [{}, {}, {}];
        item.additional_potentials[idx][key] = key === 'value' ? parseInt(val) || 0 : val;
    } else {
        if (!item.potentials) item.potentials = [{}, {}, {}];
        item.potentials[idx][key] = key === 'value' ? parseInt(val) || 0 : val;
    }
    
    window.calcBuilderStats();
};

window.calcBuilderStats = function() {
    if (!window.activePresetStats || (window.currentSelectedSlotIndex === -1 && !window.builderEquippedItems)) {
        return;
    }

    const getOfficialStarforceStats = (baseAtk, star, level) => {
        let stat = 0;
        let atk = 0;
        if (star > 0) stat += Math.min(star, 5) * 2;
        if (star > 5) stat += Math.min(star - 5, 10) * 3;
        if (star > 15) stat += (star - 15) * 4;
        
        if (star > 0) {
            let levelBonus = 1; 
            if (level >= 200) levelBonus = 1.2;
            else if (level >= 160) levelBonus = 1.1;
            else if (level >= 150) levelBonus = 1.05;
            let perStar = Math.floor((Math.ceil(baseAtk / 50) + 1) * levelBonus);
            atk = perStar * Math.min(star, 15);
            if (star > 15) atk += perStar * (star - 15);
        }
        return { stat, atk };
    };

    window.diffPower = 0;
    window.diffStat = 0;
    window.diffAtk = 0;

    if (window.currentSelectedSlotIndex !== -1) {
        const item = window.builderEquippedItems[window.currentSelectedSlotIndex];
        if (item) {
            const isMage = window.getJobGroup(window.builderCurrentData?.basic?.character_class) === "마법사";
            const jobMainStat = window.getJobMainStatName(window.builderCurrentData?.basic?.character_class);
            const sKey = (jobMainStat === "힘" ? "str" : jobMainStat === "덱" ? "덱" : jobMainStat === "인" ? "int" : "luk");
            const aKey = (isMage ? "magic_power" : "attack_power");
            
            const base = item.base_option || {};
            const add = item.add_option || {};
            const etc = item.etc_option || {};
            const starforce = item.starforce || 0;

            const baseVal = Number(base[sKey] || 0);
            const addVal = Number(add[sKey] || 0);
            const etcVal = Number(etc[sKey] || 0);
            const starStats = getOfficialStarforceStats(Number(base[aKey] || 0), starforce, item.level || 140);
            
            window.diffStat = baseVal + addVal + etcVal + starStats.stat;
            window.diffAtk = Number(base[aKey] || 0) + Number(add[aKey] || 0) + Number(etc[aKey] || 0) + starStats.atk;
            window.diffPower = (window.diffStat * 1) + (window.diffAtk * 4);
        }
    }

    let dopingPower = 0; 
    let dopingStat = 0;
    document.querySelectorAll('#dopingList input:checked').forEach(cb => {
        const name = cb.getAttribute('data-name');
        if(DOPING_DATA[name]) { 
            dopingPower += DOPING_DATA[name].power; 
            dopingStat += DOPING_DATA[name].stat; 
        }
    });

    window.diffPower += dopingPower;
    window.diffStat += dopingStat;
    
    const formatDiff = (num) => (num >= 0 ? '+' : '') + Math.floor(num).toLocaleString();
    
    const powerEl = document.getElementById('builderFinalPower');
    const statEl = document.getElementById('builderFinalStat');
    const atkEl = document.getElementById('builderFinalAtk');

    if (powerEl) {
        powerEl.innerText = formatDiff(window.diffPower);
        powerEl.style.color = window.diffPower >= 0 ? '#ef4444' : '#3b82f6'; 
    }
    if (statEl) {
        statEl.innerText = formatDiff(window.diffStat);
        statEl.style.color = window.diffStat >= 0 ? '#ef4444' : '#3b82f6';
    }
    if (atkEl) {
        atkEl.innerText = formatDiff(window.diffAtk);
        atkEl.style.color = window.diffAtk >= 0 ? '#ef4444' : '#3b82f6';
    }

    const updateActualStatUI = (statName, baseValue, diffValue) => {
        const targetId = "stat_val_" + statName.replace(/[^a-zA-Z0-9가-힣]/g, '');
        const el = document.getElementById(targetId);
        if (el) {
            const newVal = baseValue + diffValue;
            if (diffValue === 0) {
                el.innerHTML = (statName === "전투력" || statName === "최대 스탯공격력") ? window.formatMapleCP(baseValue) : baseValue.toLocaleString();
                el.style.color = (statName === "전투력" || statName === "최대 스탯공격력") ? '#0f172a' : '#334155';
            } else {
                const diffText = diffValue > 0 ? `▲ ${Math.floor(diffValue).toLocaleString()}` : `▼ ${Math.abs(Math.floor(diffValue)).toLocaleString()}`;
                const color = diffValue > 0 ? '#ef4444' : '#3b82f6';
                const finalValText = (statName === "전투력" || statName === "최대 스탯공격력") ? window.formatMapleCP(newVal) : Math.floor(newVal).toLocaleString();
                el.innerHTML = `${finalValText} <span style="color:${color}; font-size:11.5px; font-weight:900; margin-left:6px;">${diffText}</span>`;
            }
        }
    };

    const findStatVal = (name) => {
        const found = window.activePresetStats.find(s => s.stat_name === name);
        return found ? Number(String(found.stat_value).replace(/,/g, '')) : 0;
    };

    updateActualStatUI("전투력", findStatVal("전투력"), window.diffPower);
    updateActualStatUI("최대 스탯공격력", findStatVal("최대 스탯공격력"), window.diffPower * 0.8);

    let mainStatName = "STR";
    let maxVal = 0;
    ["STR", "DEX", "INT", "LUK"].forEach(s => {
        let val = findStatVal(s);
        if(val > maxVal) { maxVal = val; mainStatName = s; }
    });
    updateActualStatUI(mainStatName, findStatVal(mainStatName), window.diffStat);

    const tooltip = document.getElementById('maple_tooltip');
    if (tooltip && tooltip.style.display === 'block' && window.currentSelectedSlotIndex !== -1) {
        const dummyEvent = { clientX: parseInt(tooltip.style.left) - 15, clientY: parseInt(tooltip.style.top) + 10 };
        if(window.showOmniTooltip) window.showOmniTooltip(dummyEvent, window.builderEquippedItems[window.currentSelectedSlotIndex]);
    }
};

window.openScrollPopup = function() {
    const modal = document.getElementById('scrollPopupModal');
    if(!modal) return;

    const slotName = MAPLE_SLOT_NAMES[window.currentSelectedSlotIndex];
    const isWeapon = (slotName === "무기");
    const presetSelect = document.getElementById('scrollPresetSelect');
    
    let optionsHtml = '<option value="custom">직접 설정 (자유 입력)</option>';
    for (const [group, items] of Object.entries(window.SCROLL_PRESETS)) {
        if (isWeapon && group === "방어구 주문서") continue;
        if (!isWeapon && group === "무기 주문서") continue;
        
        optionsHtml += `<optgroup label="${group}">`;
        for (const [k, v] of Object.entries(items)) {
            optionsHtml += `<option value="${k}">${v}</option>`;
        }
        optionsHtml += `</optgroup>`;
    }
    presetSelect.innerHTML = optionsHtml;
    
    const item = window.builderEquippedItems[window.currentSelectedSlotIndex];
    const scrollList = item ? (item.scrolls || []) : [];
    
    let listHtml = scrollList.map((s, idx) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:6px; font-size:11px; background:#f8fafc; border-bottom:1px solid #e2e8f0;">
            <span style="font-weight:700; color:#334155;">${s.name} (S:${s.stat} A:${s.atk})</span>
            <button onclick="window.removeScroll(${idx})" style="border:none; background:#fee2e2; color:#ef4444; border-radius:4px; cursor:pointer;">삭제</button>
        </div>
    `).join('');

    const listContainer = document.getElementById('appliedScrollList');
    if(listContainer) listContainer.innerHTML = listHtml || '<div style="text-align:center; color:#94a3b8; font-size:11px; padding:10px;">적용된 주문서 없음</div>';

    modal.style.display = 'flex';
};

window.closeScrollPopup = function() {
    const modal = document.getElementById('scrollPopupModal');
    if(modal) modal.style.display = 'none';
};

window.updateScrollPresetInputs = function() {
    const type = document.getElementById('scrollPresetSelect').value;
    const isMagician = window.getJobGroup(window.builderCurrentData?.basic?.character_class) === "마법사";
    let stat = 0, atk = 0;
    
    switch(type) {
        case 'w_15': stat = 4; atk = 9; break;
        case 'w_30': stat = 3; atk = 7; break;
        case 'w_70': stat = 2; atk = 5; break;
        case 'w_100': stat = 1; atk = 3; break;
        case 'a_30': stat = 7; atk = 0; break;
        case 'a_70': stat = 4; atk = 0; break;
        case 'a_100': stat = 3; atk = 0; break;
        case 'c_heart': stat = 3; atk = 9; break;
        case 'd_shard': stat = 3; atk = 3; break;
        case 'acc_p': stat = 0; atk = 4; break; 
        case 'acc_n': stat = 0; atk = 2; break;
        case 'sp_good': stat = 3; atk = 3; break;
    }
    
    if (type !== 'custom') {
        document.getElementById('manualScrollStat').value = Math.floor(stat);
        document.getElementById('manualScrollAtk').value = (isMagician && type.startsWith('w_')) ? 0 : Math.floor(atk);
    }
};

window.addScrollToList = function() {
    const stat = parseInt(document.getElementById('manualScrollStat').value) || 0;
    const atk = parseInt(document.getElementById('manualScrollAtk').value) || 0;
    const select = document.getElementById('scrollPresetSelect');
    const name = select.value === 'custom' ? '직접 설정' : select.options[select.selectedIndex].text;

    if (window.currentSelectedSlotIndex !== -1) {
        if (!window.builderEquippedItems[window.currentSelectedSlotIndex]) {
            window.builderEquippedItems[window.currentSelectedSlotIndex] = { scrolls: [] };
        }
        if (!window.builderEquippedItems[window.currentSelectedSlotIndex].scrolls) {
            window.builderEquippedItems[window.currentSelectedSlotIndex].scrolls = [];
        }
        window.builderEquippedItems[window.currentSelectedSlotIndex].scrolls.push({name, stat, atk});
    }
    
    document.getElementById('manualScrollStat').value = 0;
    document.getElementById('manualScrollAtk').value = 0;
    
    window.openScrollPopup();
};

window.applyScrollAndClose = function() {
    window.calcBuilderStats();
    window.closeScrollPopup();
};

window.removeScroll = function(idx) {
    if (window.currentSelectedSlotIndex !== -1) {
        window.builderEquippedItems[window.currentSelectedSlotIndex].scrolls.splice(idx, 1);
    }
    window.openScrollPopup(); 
    window.calcBuilderStats();
};