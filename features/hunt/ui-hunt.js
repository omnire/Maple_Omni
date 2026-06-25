/**
 * ============================================================================
 * 🏹 MAPLE OMNI - ui-hunt.js
 * 캐릭터 카드 및 각종 UI(툴바, 탭, 통합기록지)를 실질적으로 그려주는 핵심 모듈
 * ============================================================================
 */

/**
 * 1. 왼쪽 사이드바의 캐릭터 프로필 카드를 그려줍니다.
 * [초보자용 주석] 조회된 데이터가 없으면 기존 얼굴(잔상)을 지우고 '조회 필요'라는 빈 카드로 초기화시킵니다.
 */
window.renderHuntCharacterCard = function(data) {
    const charBox = document.getElementById('huntCharacterCard');
    if (!charBox) return;

    const slotIdx = window.currentIdx || 1;

    // [초보자용 주석] 외부로부터 진짜 새로운 검색 결과(data)가 넘어온 시점에만 해당 슬롯 스토리지에 격리 안전 저장을 진행합니다.
    if (data && data.basic && data.basic.character_name) {
        try {
            window.localStorage.setItem(`omni_searched_basic_${slotIdx}`, JSON.stringify(data.basic));
            if (data.stat) {
                window.localStorage.setItem(`omni_searched_stat_${slotIdx}`, JSON.stringify(data.stat));
            } else {
                window.localStorage.removeItem(`omni_searched_stat_${slotIdx}`);
            }
            window.localStorage.setItem('omni_last_searched_basic', JSON.stringify(data.basic));
            if (data.stat) window.localStorage.setItem('omni_last_searched_stat', JSON.stringify(data.stat));
        } catch(e) { console.error("데이터 로컬 캐싱 실패:", e); }
    }

    // [초보자용 주석] 랜더러가 돌 때는 전역 변수 오염을 방지하기 위해 언제나 현재 활성화된 슬롯 번호(slotIdx)의 저장 데이터를 강제로 다시 긁어옵니다.
    let slotBasicStr = window.localStorage.getItem(`omni_searched_basic_${slotIdx}`);
    let slotStatStr = window.localStorage.getItem(`omni_searched_stat_${slotIdx}`);

    // 💡 [수정] 데이터가 직접 들어오면 캐시보다 우선시하여 즉시 렌더링합니다.
    if (data && data.basic) {
        slotBasicStr = JSON.stringify(data.basic);
        slotStatStr = data.stat ? JSON.stringify(data.stat) : null;
    }

    // 1️⃣ 저장된 데이터가 전혀 없는 깨끗한 빈 슬롯 카드 출력 레이아웃
    if (!slotBasicStr) {
        window.currentSearchData = null;
        charBox.innerHTML = `
            <div class="char-card" style="padding: 20px; text-align: center; background: #fff; border-radius: 24px; border: 1px solid #eef2f6;">
                <div class="char-img-box" style="width: 120px; height: 120px; background: #f8fafc; border-radius: 50%; margin: 0 auto 15px; border: 1px dashed #cbd5e1; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 30px;">
                    👤
                </div>
                <div class="char-info" style="width: 100%; display: flex; flex-direction: column; align-items: center;">
                    <input type="text" id="sidebarSearchInput_${slotIdx}" placeholder="닉네임 입력 후 엔터" 
       oninput="const cfg = JSON.parse(localStorage.getItem('maple_config_${slotIdx}') || '{}'); cfg.name = this.value; localStorage.setItem('maple_config_${slotIdx}', JSON.stringify(cfg));"
       onkeypress="if(event.key === 'Enter') { fetchMapleData(${slotIdx}); }"
                           style="width: 100%; box-sizing: border-box; padding: 10px; margin-bottom: 8px; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 15px; font-weight: 900; text-align: center; outline: none; background: #f8fafc; color: #1e293b; transition: all 0.2s;"
                           onfocus="this.style.borderColor='#3b82f6'; this.style.background='#ffffff';"
                           onblur="this.style.borderColor='#e2e8f0'; this.style.background='#f8fafc';">
                    <h3 style="margin: 5px 0 0 0; font-size: 14px; font-weight: 800; color: #64748b;">캐릭터를 조회해주세요</h3>
                    <p style="margin: 5px 0; font-size: 12px; color: #94a3b8;">닉네임 입력 후 엔터를 눌러 동기화할 수 있습니다.</p>
                </div>
            </div>
        `;
        return;
    }

    // 2️⃣ 정상 캐싱 데이터가 존재하여 화면에 캐릭터 정보를 바인딩하는 레이아웃
    const basic = JSON.parse(slotBasicStr);
    const stat = slotStatStr ? JSON.parse(slotStatStr) : null;
    window.currentSearchData = { basic, stat };

    const power = stat?.final_stat?.find(s => s.stat_name === "전투력")?.stat_value || "0";
    const attack = stat?.final_stat?.find(s => s.stat_name === "스탯공격력")?.stat_value || "0";
    const damage = stat?.final_stat?.find(s => s.stat_name === "데미지")?.stat_value || "0";

    charBox.innerHTML = `
        <div class="char-card" style="padding: 20px; text-align: center; background: #fff; border-radius: 24px; border: 1px solid #eef2f6;">
            <div class="char-img-box" style="width: 160px; height: 160px; background: #f8fafc; border-radius: 50%; margin: 0 auto 15px; border: 1px solid #f1f5f9; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                <img src="${basic.character_image}" id="profileImg" referrerpolicy="no-referrer" style="display: block; width: 100%; height: 100%; object-fit: contain; transform: scale(1.8); margin-top: -25px; image-rendering: -webkit-optimize-contrast; opacity: 1 !important; visibility: visible !important;">
            </div>

            <div class="char-info" style="width: 100%; display: flex; flex-direction: column; align-items: center;">
                <input type="text" id="sidebarSearchInput_${slotIdx}" value="${basic.character_name}" placeholder="닉네임 입력 후 엔터" 
                       oninput="const cfg = JSON.parse(localStorage.getItem('maple_config_${slotIdx}') || '{}'); cfg.name = this.value; localStorage.setItem('maple_config_${slotIdx}', JSON.stringify(cfg));"
                       onkeypress="if(event.key === 'Enter') { fetchMapleData(${slotIdx}); }" 
                       style="width: 100%; box-sizing: border-box; padding: 10px; margin-bottom: 8px; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 15px; font-weight: 900; text-align: center; outline: none; background: #f8fafc; color: #1e293b; transition: all 0.2s;"
                       onfocus="this.style.borderColor='#3b82f6'; this.style.background='#ffffff';"
                       onblur="this.style.borderColor='#e2e8f0'; this.style.background='#f8fafc';">
                <p style="margin: 5px 0; font-size: 13px; color: #faa266; font-weight: 800;">${basic.world_name} | ${basic.character_guild_name || '길드 없음'}</p>
                <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 700;">Lv.${basic.character_level} <span style="color: #cbd5e1; margin-left: 4px;">${basic.character_class}</span></p>
            </div>

            <div style="margin-top: 20px; background: #f8fafc; padding: 15px; border-radius: 16px; border: 1px solid #f1f5f9; text-align: left;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-size: 11px; color: #64748b; font-weight: 700;">전투력</span>
                    <span style="font-size: 13px; color: #7aa3f5; font-weight: 900;">${isNaN(power) ? power : Number(power).toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-size: 11px; color: #64748b; font-weight: 700;">스탯공격력</span>
                    <span style="font-size: 11px; color: #1e293b; font-weight: 800;">${isNaN(attack) ? attack : Number(attack).toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="font-size: 11px; color: #64748b; font-weight: 700;">데미지</span>
                    <span style="font-size: 11px; color: #1e293b; font-weight: 800;">${String(damage).includes('%') ? damage : damage + '%'}</span>
                </div>
            </div>

            <button type="button" onclick="if(typeof window.renderHuntCharacterCard === 'function') window.renderHuntCharacterCard(); if(typeof showToast === 'function') showToast('캐릭터 정보가 실시간으로 동기화되었습니다! 🔄');" 
                    style="width: 100%; margin-top: 15px; padding: 10px; background: #f1f5f9; border: none; border-radius: 10px; color: #475569; font-weight: 800; font-size: 12px; cursor: pointer;">
                🔄 정보 동기화
            </button>
        </div>
    `;
};

/**
 * 🛠️ [Omni] 화면 상단의 기능 툴바(타이머, 초기화 버튼 등)를 그려주는 함수입니다.
 */
window.renderTopToolbar = function() {
    const container = document.getElementById('omniTopToolbarContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="omni-top-toolbar" style="max-width: 100%; padding: 10px 20px !important; display: flex; align-items: center; justify-content: space-between;">
            <div id="tabContainer" class="toolbar-tabs"></div>
            
            <div class="toolbar-utils" style="display: flex; gap: 8px; align-items: center;">
                <button type="button" class="sys-btn-compact" onclick="if(typeof backToPortal === 'function') backToPortal()">🏠 홈</button>
                <button type="button" class="sys-btn-compact" onclick="if(typeof exportData === 'function') exportData()">💾 백업</button>
                <button type="button" class="sys-btn-compact" onclick="document.getElementById('fileInput').click()">📂 복구</button>
                
                <button type="button" class="sys-btn-compact" 
                        onclick="if(typeof resetCurrentHunt === 'function') resetCurrentHunt(window.currentIdx || 1)" 
                        style="background: #fff1f2; color: #f43f5e; border: 1px solid #fecdd3; font-weight: 800; transition: 0.2s;"
                        onmouseover="this.style.background='#fecaca'" onmouseout="this.style.background='#fff1f2'">
                    🔥 초기화
                </button>

                <button type="button" class="sys-btn-compact sys-btn-purple" onclick="if(typeof openMiniPopup === 'function') openMiniPopup()">📱 팝업</button>
                <input type="file" id="fileInput" style="display:none" onchange="if(typeof window.importData === 'function') window.importData(event);">
            </div>

            <div class="toolbar-timer" style="display: flex; gap: 10px; align-items: center;">
                <span class="timer-label" style="font-size: 12px; font-weight: 800; color: #f97316;">⏳ 30분 타이머</span>
                <span id="timerDisplay" class="timer-digit" style="font-family: monospace; font-size: 16px; font-weight: 900;">30:00</span>
                <div class="timer-btns" style="display: flex; gap: 4px;">
                    <button type="button" id="mainStartBtn" onclick="if(typeof startTimer === 'function') startTimer()" class="btn-omni-timer btn-blue">시작</button>
                    <button type="button" id="mainStopBtn" onclick="if(typeof handleStopClick === 'function') handleStopClick()" class="btn-omni-timer btn-blue">정지</button>
                    <button type="button" onclick="if(typeof resetTimer === 'function') resetTimer()" class="btn-omni-timer btn-reset">리셋</button>
                </div>
            </div>
        </div>
    `;

    // 툴바를 그린 직후 캐릭터 탭 버튼들도 바로 세팅해줍니다.
    if (typeof window.reRenderTabs === 'function') {
        window.reRenderTabs();
    }
};

/**
 * 🛠️ [Omni] 개별 캐릭터의 실시간 사냥 기록판(가운데 화면)을 통째로 그려내는 기능
 * [초보자용 주석] 요청하신 대로 도핑 리스트(💊)가 상세 스탯 설정 바로 아래에 위치하도록 렌더링 됩니다.
 */
window.renderHuntTabContent = function(i, savedConfig) {
    const dopingNames = ["VIP 버프", "경험치 쿠폰(50%)", "경험치 3배 쿠폰", "경험치 4배 쿠폰", "재물 획득의 비약", "경험 축적의 비약", "유니온의 행운", "유니온의 부", "익스트림 골드"];
    const statNames = ['장비 아이템', '유니온 공격대', '어빌리티', '아티팩트', '스킬'];
    
    // 현재 저장된 탭 이름이 '캐릭터 N' 같은 기본값이 아니면 가져오기
    const savedName = (savedConfig.name && !savedConfig.name.includes('캐릭터 ')) ? savedConfig.name : '';

    return `
    <div id="tab_${i}" class="content" style="display: ${i === window.currentIdx ? 'block' : 'none'}; width: 100%; padding: 0 5px;">
        
        <div style="background: #ffffff; padding: 15px 20px; border-radius: 18px; margin-top: 5px; margin-bottom: 12px; border: 1px solid #f1f5f9; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-weight: 800; color: #64748b; font-size: 12px;">🎯 GOAL TRACKER</span>
                <span id="goalPercent_${i}" style="color: #475569; font-weight: 900; font-size: 20px;">0.0%</span>
            </div>
            <div style="background: #f8fafc; height: 8px; border-radius: 10px; overflow: hidden; border: 1px solid #f1f5f9; position: relative;">
                <div id="progressBar_${i}" style="background: linear-gradient(90deg, #818cf8, #6366f1); height: 100%; width: 0%; transition: width 0.8s ease;"></div>
            </div>
            <div style="text-align: right; margin-top: 5px;">
                <small style="color: #94a3b8; font-weight: 700; font-size: 11px;">목표까지 <span id="remainMeso_${i}" style="color: #fbbf24; font-weight: 800;">0</span> 메소 남음</small>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 12px;">
            <div style="background: #fffbeb; padding: 12px 5px; border-radius: 15px; border: 1px solid #fef3c7; text-align: center;">
                <div style="font-size: 11px; color: #d97706; font-weight: 800; margin-bottom: 4px;">💰 누적 메소</div>
                <div id="profitMeso_${i}" style="font-size: 14px; color: #92400e; font-weight: 900;">0</div>
            </div>
            <div style="background: #f5f3ff; padding: 12px 5px; border-radius: 15px; border: 1px solid #ede9fe; text-align: center;">
                <div style="font-size: 11px; color: #7c3aed; font-weight: 800; margin-bottom: 4px;">📈 누적 EXP</div>
                <div id="profitExp_${i}" style="font-size: 14px; color: #5b21b6; font-weight: 900;">0%</div>
            </div>
            <div style="background: #f0fdf4; padding: 12px 5px; border-radius: 15px; border: 1px solid #dcfce7; text-align: center;">
                <div style="font-size: 11px; color: #16a34a; font-weight: 800; margin-bottom: 4px;">⚔️ 드랍 / 메획</div>
                <div id="currentStats_${i}" style="font-size: 14px; color: #166534; font-weight: 900;">0/0</div>
            </div>
            <div style="background: #f0f9ff; padding: 12px 5px; border-radius: 15px; border: 1px solid #e0f2fe; text-align: center;">
                <div style="font-size: 11px; color: #0284c7; font-weight: 800; margin-bottom: 4px;">💎 젬스톤 / 조각</div>
                <div id="netDrops_${i}" style="font-size: 14px; color: #075985; font-weight: 900;">0/0</div>
            </div>
        </div>

        <div style="padding: 15px 20px; background: #ffffff; border: 1px solid #f1f5f9; border-radius: 18px; margin-bottom: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
            <div style="font-size: 12px; font-weight: 800; color: #94a3b8; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                <span>⚙️</span> CHARACTER CONFIG (시작/목표 설정)
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                <input type="text" id="startMeso_${i}" placeholder="💰 시작 메소" value="${savedConfig.startMeso || ''}" onkeyup="if(typeof window.onMeso === 'function') window.onMeso(this);" oninput="if(typeof saveCharConfig === 'function') saveCharConfig(${i}); if(typeof updateAll === 'function') updateAll(${i});" style="width:100%; padding:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; font-size:12px; box-sizing: border-box; outline:none;">
                <input type="text" id="targetMeso_${i}" placeholder="🎯 목표 메소" value="${savedConfig.targetMeso || ''}" onkeyup="if(typeof window.onMeso === 'function') window.onMeso(this);" oninput="if(typeof saveCharConfig === 'function') saveCharConfig(${i}); if(typeof updateAll === 'function') updateAll(${i});" style="width:100%; padding:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; font-size:12px; box-sizing: border-box; outline:none;">
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 12px;">
                <input type="number" id="startExp_${i}" step="0.001" placeholder="📈 시작 EXP(%)" value="${savedConfig.startExp || ''}" oninput="if(typeof saveCharConfig === 'function') saveCharConfig(${i}); if(typeof updateAll === 'function') updateAll(${i});" style="width:100%; padding:8px 10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; font-size:12px; box-sizing: border-box; outline:none;">
                <input type="number" id="startGem_${i}" placeholder="🔮 시작 젬" value="${savedConfig.startGem || ''}" oninput="if(typeof saveCharConfig === 'function') saveCharConfig(${i}); if(typeof updateAll === 'function') updateAll(${i});" style="width:100%; padding:8px 10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; font-size:12px; box-sizing: border-box; outline:none;">
                <input type="number" id="startFrag_${i}" placeholder="🧩 시작 조각" value="${savedConfig.startFrag || ''}" oninput="if(typeof saveCharConfig === 'function') saveCharConfig(${i}); if(typeof updateAll === 'function') updateAll(${i});" style="width:100%; padding:8px 10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; font-size:12px; box-sizing: border-box; outline:none;">
            </div>

            <button onclick="if(typeof toggleDetails === 'function') toggleDetails(${i})" style="width:100%; padding:10px; background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; cursor:pointer; font-size:11px; font-weight:800; color:#64748b;">✨ 상세 능력치 및 도핑 설정 열기</button>
            
            <div id="details_${i}" style="display: none; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 16px; padding: 20px; margin-top: 10px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div>
                        <h4 style="font-size: 11px; color: #475569; margin-bottom: 10px; font-weight: 800;">💰 메소 획득량</h4>
                        ${statNames.map((s, idx) => `<div style="display: flex; justify-content: space-between; margin-bottom: 6px; align-items: center;"><span style="font-size: 10px; color: #64748b;">${s}</span><input type="number" id="m_stat_${idx}_${i}" oninput="if(typeof syncDopingStats === 'function') syncDopingStats(${i})" style="width: 45px; font-size: 11px; padding: 4px; border: 1px solid #e2e8f0; border-radius: 6px; outline:none;"></div>`).join('')}
                    </div>
                    <div>
                        <h4 style="font-size: 11px; color: #475569; margin-bottom: 10px; font-weight: 800;">🍀 드랍률</h4>
                        ${statNames.map((s, idx) => `<div style="display: flex; justify-content: space-between; margin-bottom: 6px; align-items: center;"><span style="font-size: 10px; color: #64748b;">${s}</span><input type="number" id="d_stat_${idx}_${i}" oninput="if(typeof syncDopingStats === 'function') syncDopingStats(${i})" style="width: 45px; font-size: 11px; padding: 4px; border: 1px solid #e2e8f0; border-radius: 6px; outline:none;"></div>`).join('')}
                    </div>
                </div>
                <div style="padding-top: 15px; border-top: 1px dashed #e2e8f0;">
                    <div style="font-weight: 800; font-size: 11px; color: #475569; margin-bottom: 10px;">💊 사냥 도핑 리스트</div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px;">
                        ${dopingNames.map((name, idx) => `<label style="display: flex; align-items: center; gap: 6px; font-size: 10px; color: #64748b; background: #ffffff; padding: 8px; border-radius: 8px; border: 1px solid #f1f5f9; cursor: pointer;"><input type="checkbox" id="chk_${idx}_${i}" onchange="if(typeof syncDopingStats === 'function') syncDopingStats(${i})"><span style="font-weight: 600;">${name}</span></label>`).join('')}
                    </div>
                </div>
            </div>
        </div>

        <div style="padding: 15px 20px; background: #ffffff; border: 1px solid #f1f5f9; border-radius: 18px; margin-bottom: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="margin: 0; font-size: 14px; font-weight: 900; color: #334155;">⚔️ 사냥 세션 기록</h4>
                <label style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: #0284c7; background: #f0f9ff; padding: 6px 12px; border-radius: 10px; cursor: pointer; border: 1px solid #e0f2fe;">
                    <input type="checkbox" id="isFullJaehoek_${i}" style="width: 13px; height: 13px; cursor: pointer;" onchange="if(typeof updateAll === 'function') updateAll(${i})">
                    <b style="font-weight: 800;">2시간(1재획) 기록</b>
                </label>
            </div>
            
            <div style="display: grid; grid-template-columns: 1.5fr 1fr 1fr 0.8fr 0.8fr; gap: 8px; margin-bottom: 15px;">
                <input type="text" id="map_${i}" placeholder="🏕️ 사냥터" value="${savedConfig.map || ''}" oninput="if(typeof saveCharConfig === 'function') saveCharConfig(${i});" style="width:100%; padding:8px 10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; font-size:12px; box-sizing: border-box; outline:none;">
                <input type="text" id="meso_${i}" placeholder="🪙 메소" onkeyup="if(typeof applyRealtimeComma === 'function') applyRealtimeComma(this);" style="width:100%; padding:8px 10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; font-size:12px; box-sizing: border-box; outline:none;">
                <input type="number" id="exp_${i}" step="0.001" placeholder="⚡ EXP%" style="width:100%; padding:8px 10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; font-size:12px; box-sizing: border-box; outline:none;">
                <input type="number" id="gem_${i}" placeholder="🔮 젬스톤" style="width:100%; padding:8px 10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; font-size:12px; box-sizing: border-box; outline:none;">
                <input type="number" id="frag_${i}" placeholder="✨ 조각" style="width:100%; padding:8px 10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; font-size:12px; box-sizing: border-box; outline:none;">
            </div>

            <div style="margin-bottom: 15px; padding-top: 12px; border-top: 1px dashed #e2e8f0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="font-size: 11px; font-weight: 800; color: #64748b; display: flex; align-items: center; gap: 6px;">
                        <span>🎁</span> 득템 및 판매 <span style="font-size: 9px; color: #94a3b8; font-weight: 600;">(선택)</span>
                    </div>
                    <button onclick="if(typeof addSellRow === 'function') addSellRow(${i})" style="background: #e0e7ff; color: #4f46e5; border: none; padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: bold; cursor: pointer;">+ 항목 추가</button>
                </div>
                <div id="sellListContainer_${i}" style="display: flex; flex-direction: column; gap: 4px;"></div>
            </div>
            
            <div id="subRecordList_${i}" class="sub-record-list" style="margin-bottom: 15px;"></div>
            
            <div style="display: flex; gap: 10px;">
                <button onclick="if(typeof recordSub === 'function') recordSub(${i})" style="flex: 2; background: #818cf8; color: white; padding: 12px; border-radius: 12px; font-size: 14px; font-weight: 900; border: none; cursor: pointer;">⏱️ 기록 임시 저장</button>
                <button onclick="if(typeof saveFinalRecord === 'function') saveFinalRecord(${i})" style="flex: 1.2; background: #38bdf8; color: white; border-radius: 12px; font-size: 14px; font-weight: 900; border: none; cursor: pointer;">📊 통합 기록지로 전송</button>
                <button onclick="if(typeof window.resetCurrentHunt === 'function') window.resetCurrentHunt(${i})" style="flex: 0.6; background: #ffffff; color: #fb7185; border: 1px solid #fecdd3; border-radius: 12px; font-weight: 800; cursor: pointer; font-size: 14px;">🗑️ 리셋</button>
            </div>
        </div>
    </div>`;
};

/**
 * ✅ [통합 기록지] 확정 저장된 데이터를 달력 형태로 예쁘게 나열해서 보여줍니다.
 */
window.renderHistory = function() {
    const recordTableBody = document.getElementById('recordTableBody');
    if (!recordTableBody) return;

    const outerContainer = recordTableBody.parentElement;
    if (outerContainer) {
        outerContainer.style.maxWidth = '1050px'; 
        outerContainer.style.margin = '5px auto 20px'; 
        outerContainer.style.padding = '25px 35px'; 
        outerContainer.style.background = '#ffffff';
        outerContainer.style.borderRadius = '30px';
        outerContainer.style.boxShadow = '0 10px 30px rgba(0,0,0,0.05)';
    }

    let allRecords = JSON.parse(localStorage.getItem('maple_hunt_records') || '[]');
    const currentHistChar = parseInt(window.currentHistChar) || 1;
    const selectedMonthVal = document.getElementById('monthFilter')?.value || new Date().toISOString().split('T')[0].slice(0,7);
    const [year, month] = selectedMonthVal.split('-').map(Number);

    let charRecords = allRecords.filter(rec => rec.charId == currentHistChar);
    const firstDay = new Date(year, month - 1, 1).getDay(); // 달력에서 1일이 시작하는 요일 파악
    const lastDate = new Date(year, month, 0).getDate();    // 그 달의 마지막 날짜 파악

    recordTableBody.style.display = 'grid';
    recordTableBody.style.gridTemplateColumns = 'repeat(7, 1fr)'; 
    recordTableBody.style.gap = '12px'; 
    recordTableBody.style.width = '100%';
    recordTableBody.style.padding = '15px 0';

    let html = '';
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    days.forEach(d => {
        html += `<div style="padding: 10px; font-size: 13px; font-weight: 900; color: #94a3b8; text-align: center;">${d}</div>`;
    });

    // 1일이 시작하기 전 빈칸을 투명한 상자로 채워줍니다.
    for (let i = 0; i < firstDay; i++) {
        html += `<div style="min-height: 110px; background: #f8fafc; border-radius: 18px; opacity: 0.4;"></div>`;
    }

    for (let d = 1; d <= lastDate; d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayRecords = charRecords.filter(rec => rec.date === dateStr);
        const hasRecord = dayRecords.length > 0;

        if (hasRecord) {
            let totalMeso = 0, totalExp = 0, totalGem = 0, totalFrag = 0;
            // 하루 동안 사냥한 여러 건의 데이터를 모두 합산합니다.
            dayRecords.forEach(rec => {
                totalMeso += parseInt(String(rec.meso).replace(/,/g, "")) || 0; 
                totalExp += parseFloat(rec.exp) || 0;
                totalGem += parseInt(rec.gem) || 0;
                totalFrag += parseInt(rec.frag) || 0;
            });

            // 1억이 넘으면 '억' 단위로, 안 넘으면 콤마(,)를 붙여서 출력합니다.
            let mesoDisplay = totalMeso >= 100000000 ? (totalMeso / 100000000).toFixed(2) + '억' : totalMeso.toLocaleString();

            html += `
                <div onclick="if(typeof openDayDetail === 'function') openDayDetail('${dateStr}', ${currentHistChar})"
                     style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 20px; min-height: 110px; padding: 12px; cursor: pointer; transition: 0.2s; position: relative;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div style="font-size: 15px; font-weight: 950; color: #334155;">${d}</div>
                        <button onclick="event.stopPropagation(); if(typeof deleteDayRecords === 'function') deleteDayRecords('${dateStr}', ${currentHistChar});" 
                        style="background: #fff1f2; border: 1px solid #fecdd3; color: #f43f5e; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px; cursor: pointer; transition: 0.2s;"
                        onmouseover="this.style.background='#fecaca'" onmouseout="this.style.background='#fff1f2'">
                        삭제
                        </button>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <div style="background: #fffbeb; padding: 4px 6px; border-radius: 7px; display: flex; justify-content: space-between; border: 1px solid #fef3c7;">
                            <span style="font-size: 10px; color: #b45309; font-weight: 800;">메소</span>
                            <b style="font-size: 11px; color: #92400e; font-weight: 900;">${mesoDisplay}</b>
                        </div>
                        <div style="background: #f5f3ff; padding: 4px 6px; border-radius: 7px; display: flex; justify-content: space-between; border: 1px solid #ede9fe;">
                            <span style="font-size: 10px; color: #7c3aed; font-weight: 800;">EXP</span>
                            <b style="font-size: 11px; color: #5b21b6; font-weight: 900;">${totalExp.toFixed(2)}%</b>
                        </div>
                        <div style="display: flex; gap: 4px;">
                            <div style="flex:1; background: #f0f9ff; padding: 4px; border-radius: 8px; text-align: center; border: 1px solid #e0f2fe; font-size: 10px; font-weight: 900; color: #0284c7;">💎 ${totalGem}</div>
                            <div style="flex:1; background: #fff1f2; padding: 4px; border-radius: 8px; text-align: center; border: 1px solid #ffe4e6; font-size: 10px; font-weight: 900; color: #e11d48;">🧊 ${totalFrag}</div>
                        </div>
                    </div>
                </div>`;
        } else {
            // 기록이 없는 날은 연한 상자로 표시합니다.
            html += `
                <div style="background: #f8fafc; border: 1.5px solid #edf2f7; border-radius: 20px; min-height: 110px; padding: 12px;">
                    <div style="font-size: 15px; font-weight: 900; color: #94a3b8;">${d}</div>
                </div>`;
        }
    }
    recordTableBody.innerHTML = html;
};


/**
 * 💰 [통합 기록지] 상세 팝업창에서 득템 판매 금액을 입력하면 즉시 반영하는 기능입니다.
 */
window.updateExtraPrice = function(timestamp, sellIdx, val, charId, dateStr) {
    try {
        let allRecords = JSON.parse(localStorage.getItem('maple_hunt_records') || '[]');
        let recIdx = allRecords.findIndex(r => r.timestamp === timestamp);
        if (recIdx === -1) return;

        let numPrice = parseInt(val.replace(/[^0-9]/g, "")) || 0;
        allRecords[recIdx].sellList[sellIdx].price = numPrice;
        
        let baseMeso = parseInt(String(allRecords[recIdx].huntMeso || allRecords[recIdx].meso).replace(/,/g, "")) || 0;
        let extraTotal = allRecords[recIdx].sellList.reduce((sum, item) => sum + (item.price || 0), 0);
        
        allRecords[recIdx].meso = (baseMeso + extraTotal).toLocaleString();
        localStorage.setItem('maple_hunt_records', JSON.stringify(allRecords));
        
        // 상세 팝업창의 숫자(해당 회차 총 메소)를 즉시 바꿉니다.
        let modalTotalEl = document.getElementById(`modal_total_meso_${timestamp}`);
        if (modalTotalEl) modalTotalEl.innerText = allRecords[recIdx].meso;
        
        const dayRecords = allRecords.filter(rec => rec.charId == charId && rec.date === dateStr);
        let totalDailyMeso = 0;
        dayRecords.forEach(r => totalDailyMeso += parseInt(String(r.meso).replace(/,/g, "")) || 0);
        
        let globalTotalEl = document.getElementById('modal_global_meso');
        if (globalTotalEl) globalTotalEl.innerText = totalDailyMeso.toLocaleString();
        
        // 🔥 배경 달력과 실시간 차트 수치도 0.1초 뒤에 갱신해줍니다.
        setTimeout(() => {
            if (typeof window.renderHistory === 'function') window.renderHistory();
            if (typeof window.updateAll === 'function') window.updateAll(charId);
            if (typeof window.refreshWeekly === 'function') window.refreshWeekly();
        }, 100);
    } catch (e) { console.error(e); }
};

/**
 * 🔍 [상세 팝업] 달력에서 날짜 상자를 클릭했을 때 띄워주는 세부 기록 팝업창입니다.
 */
window.openDayDetail = function(dateStr, charId) {
    try {
        let allRecords = JSON.parse(localStorage.getItem('maple_hunt_records') || '[]');
        const dayRecords = allRecords.filter(rec => rec.charId == charId && rec.date === dateStr);
        if(dayRecords.length === 0) return;

        let totalMinutes = 0;
        let totalDailyMeso = 0, totalDailyExp = 0, totalDailyGem = 0, totalDailyFrag = 0;

        // 하루 동안 사냥한 시간을 모두 더합니다 (1재획=120분, 30분=30분)
        dayRecords.forEach(r => {
            totalMinutes += (r.isFullJaehoek === true) ? 120 : 30;
            totalDailyMeso += parseInt(String(r.meso).replace(/,/g, "")) || 0;
            totalDailyExp += parseFloat(r.exp) || 0;
            totalDailyGem += parseInt(r.gem) || 0;
            totalDailyFrag += parseInt(r.frag) || 0;
        });

        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        const timeDisplay = h > 0 ? `${h}시간 ${m > 0 ? m + '분' : ''}` : `${m}분`;

        let modalHtml = `
            <div id="dayDetailModal" 
                 style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(30, 41, 59, 0.5); z-index: 100000; backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center;" 
                 onmousedown="if(event.target === this) window.isBackdropClick = true;" 
                 onmouseup="if(event.target === this && window.isBackdropClick) { this.remove(); window.isBackdropClick = false; } else { window.isBackdropClick = false; }">
                
                <div style="background: #f1f5f9; width: 360px; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.2); max-height: 85vh; overflow-y: auto; border: 1px solid #e2e8f0; display: flex; flex-direction: column;" 
                     onclick="event.stopPropagation()">
                    
                    <div style="background: white; padding: 18px 20px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; position: sticky; top: 0; z-index: 10;">
                        <div style="display: flex; align-items: baseline; gap: 10px; flex: 1;">
                            <h3 style="margin: 0; font-size: 17px; font-weight: 900; color: #334155;">📔 ${dateStr.replace(/-/g, '.')}</h3>
                            <span style="font-size: 11px; color: #6366f1; font-weight: 800; white-space: nowrap;">⏱️ ${timeDisplay}</span>
                        </div>
                        <button onclick="document.getElementById('dayDetailModal').remove()" 
                                style="background: #f8fafc; border: none; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; color: #94a3b8; font-weight: bold; border: 1px solid #e2e8f0; margin-left: 10px;">✕</button>
                    </div>
                    
                    <div style="padding: 15px; display: flex; flex-direction: column; gap: 10px;">
                        
                        <div style="background: #ffffff; border-radius: 12px; padding: 15px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                            <div style="font-size: 11px; font-weight: 800; color: #64748b; margin-bottom: 8px;">📊 하루 통합 데이터</div>
                            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 900; color: #334155; margin-bottom: 4px;">
                                <span>💰 총 획득 메소</span>
                                <span id="modal_global_meso" style="color: #92400e;">${totalDailyMeso.toLocaleString()}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 900; color: #334155; margin-bottom: 4px;">
                                <span>📈 획득 경험치</span>
                                <span style="color: #5b21b6;">${totalDailyExp.toFixed(3)}%</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 900; color: #334155;">
                                <span>💎 젬 / 🧊 조각</span>
                                <span><span style="color: #0284c7;">${totalDailyGem}</span> / <span style="color: #e11d48;">${totalDailyFrag}</span></span>
                            </div>
                        </div>
        `;

        dayRecords.forEach((rec, idx) => {
            const pureHuntMeso = rec.huntMeso || rec.meso; 
            let parsedSellList = [];
            if (rec.sellList && Array.isArray(rec.sellList)) {
                parsedSellList = rec.sellList.map(item => typeof item === 'string' ? {name: item, price: 0} : item);
            } else if (rec.sellItem && rec.sellItem.trim() !== '') {
                parsedSellList = [{name: rec.sellItem, price: 0}];
            }

            modalHtml += `
                <div style="background: white; border-radius: 10px; border: 1px solid #e2e8f0; padding: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); position: relative;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="background: #e2e8f0; color: #475569; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 800;"># ${idx + 1}회차</span>
                            <span style="font-size: 11px; color: #475569; font-weight: 700;">${rec.map || '미지정 사냥터'}</span>
                        </div>
                        <button type="button" onclick="if(typeof deleteSingleRecord === 'function') deleteSingleRecord(${rec.timestamp}, '${dateStr}', ${charId})" style="background: #fee2e2; border: 1px solid #fecaca; color: #ef4444; border-radius: 6px; padding: 4px 8px; font-size: 10px; font-weight: bold; cursor: pointer;">🗑️ 삭제</button>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; color: #64748b; background: #f8fafc; padding: 8px; border-radius: 6px;">
                        <div>사냥메소: <b style="color:#8c7b75">${pureHuntMeso}</b></div>
                        <div>총 합계: <b id="modal_total_meso_${rec.timestamp}" style="color:#d97706">${rec.meso}</b></div>
                        <div>경험치: <b style="color:#8a8191">${rec.exp}%</b></div>
                        <div>젬스톤: <b style="color:#0284c7">${rec.gem || 0}</b></div>
                        <div>조각: <b style="color:#e11d48">${rec.frag || 0}</b></div>
                    </div>
                    
                    ${parsedSellList.length > 0 ? `
                        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e2e8f0; display: flex; flex-direction: column; gap: 4px;">
                            <div style="font-size: 10px; font-weight: 800; color: #94a3b8; display: flex; gap: 4px; align-items: center;"><span>🎁</span> 득템 판매금액 입력</div>
                            ${parsedSellList.map((item, sIdx) => `
                                <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border: 1px solid #f1f5f9; padding: 4px 8px; border-radius: 6px;">
                                    <span style="font-size: 11px; color: #64748b; font-weight: 600;">▪ ${item.name}</span>
                                    <div style="display: flex; align-items: center; gap: 4px;">
                                        <input type="text" value="${item.price ? item.price.toLocaleString() : ''}" placeholder="금액 입력" 
                                            oninput="if(typeof applyRealtimeComma === 'function') applyRealtimeComma(this);" 
                                            onchange="if(typeof updateExtraPrice === 'function') updateExtraPrice(${rec.timestamp}, ${sIdx}, this.value, ${charId}, '${dateStr}')" 
                                            style="width: 80px; padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 11px; text-align: right; outline: none; font-weight: bold; color: #16a34a;">
                                        <span style="font-size: 10px; color: #94a3b8; font-weight: bold;">메소</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        });

        modalHtml += `</div></div></div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    } catch (err) {
        console.error("팝업 생성 중 에러:", err);
    }
};

window.addSellRow = function(i) {
    const container = document.getElementById(`sellListContainer_${i}`);
    if (!container) return;
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '6px';
    row.style.marginBottom = '6px';
    row.innerHTML = `
        <input type="text" class="sell-item-name" placeholder="득템 품목명 (예: 물방울석)" style="flex: 1; padding: 8px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 11px; outline: none;">
        <button type="button" onclick="this.parentElement.remove()" style="background: #fff1f2; color: #e11d48; border: 1px solid #ffe4e6; border-radius: 8px; width: 32px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center;">&times;</button>
    `;
    container.appendChild(row);
};

/**
 * 🗂️ 30분 단위 회차별로 작성한 기록을 예쁜 카드 형태로 찍어내는 화면 구성기입니다.
 */
window.renderSubRecords = function(i) {
    const charIdx = parseInt(i || 1);
    const listEl = document.getElementById(`subRecordList_${charIdx}`);
    if (!listEl) return;

    const dateInput = document.getElementById('huntGlobalDate');
    const selectedDate = (dateInput && dateInput.value) ? dateInput.value : new Date().toISOString().split('T')[0];
    const storageKey = `${charIdx}_${selectedDate}`;

    listEl.style.display = "grid";
    listEl.style.gridTemplateColumns = "repeat(auto-fill, minmax(140px, 1fr))";
    listEl.style.gap = "12px";
    
    let html = '';
    
    // 1️⃣ 확정 저장된 통합 기록지에서 이번 날짜 데이터만 긁어옵니다. (SENT 딱지가 붙음)
    const allStored = JSON.parse(localStorage.getItem('maple_hunt_records') || '[]');
    const finalizedLogs = allStored.filter(r => r.charId == i && r.date === selectedDate).map(l => ({ ...l, isFinalized: true }));
    
    // 2️⃣ 아직 저장하지 않고 바구니에 담아둔 임시 데이터를 가져옵니다.
    const tempLogs = (window.subHistory && window.subHistory[storageKey] ? window.subHistory[storageKey] : []).filter(r => !r.isFinalized);
    
    // 3️⃣ 임시 기록과 확정 기록을 한곳에 모아 순서대로 나열합니다.
    const combinedList = [...tempLogs, ...finalizedLogs];

    if(combinedList.length > 0) {
        combinedList.forEach((rec, idx) => {
            const cardBaseStyle = `background: white; border-radius: 14px; padding: 12px; position: relative; box-shadow: 0 2px 8px rgba(0,0,0,0.04); overflow: hidden; box-sizing: border-box; width: 100%; transition: 0.2s;`;
            const borderStyle = rec.isFinalized ? `border: 1.5px solid #3b82f6;` : `border: 1px solid #e2e8f0;`;

            html += `
            <div style="${cardBaseStyle} ${borderStyle}">
                ${rec.isFinalized ? `<div style="position: absolute; top: 8px; right: -25px; background: #3b82f6; color: white; font-size: 8px; font-weight: 900; padding: 3px 25px; transform: rotate(45deg); z-index: 1;">SENT</div>` : ''}
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <b style="font-size: 14px; color: #1e3a8a; font-weight: 900;">#${idx + 1}회차</b>
                    <span style="font-size: 10px; color: #94a3b8; font-weight: 600; ${rec.isFinalized ? 'margin-right: 12px;' : ''}">${rec.time || '전송됨'}</span>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 11px; color: #64748b; font-weight: 700;">메소</span>
                        <b style="font-size: 13px; color: #1e293b; font-weight: 900;">${rec.meso}</b>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 11px; color: #64748b; font-weight: 700;">경험치</span>
                        <b style="font-size: 13px; color: #1e293b; font-weight: 900;">${parseFloat(rec.exp).toFixed(3)}%</b>
                    </div>
                </div>

                <div style="margin-top: 10px; border-top: 1px dashed #f1f5f9; padding-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; gap: 6px;">
                        <span style="font-size: 11px; color: #0284c7; font-weight: 800;">💎 ${rec.gem}</span>
                        <span style="font-size: 11px; color: #e11d48; font-weight: 800;">🧊 ${rec.frag}</span>
                    </div>
                    <div style="display: flex; gap: 4px;">
                        ${!rec.isFinalized ? `
                            <button onclick="if(typeof editSubRecord === 'function') editSubRecord(${i}, ${idx})" style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; color: #475569; cursor: pointer; font-size: 10px; padding: 2px 6px; font-weight: bold;">수정</button>
                            <button onclick="if(typeof removeSubRecord === 'function') removeSubRecord(${i}, ${idx})" style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px; color: #e11d48; cursor: pointer; font-size: 10px; padding: 2px 6px; font-weight: bold;">삭제</button>
                        ` : ''}
                    </div>
                </div>
            </div>`;
        });
    } else {
        html = `<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: #cbd5e1; font-weight: 800;">[ ${selectedDate} ] 기록이 없습니다.</div>`;
    }
    listEl.innerHTML = html;
};

/**
 * 🧹 [기능] 특정 캐릭터 탭의 모든 설정과 기록을 완전히 싹 지웁니다.
 */
window.resetCurrentHunt = function(i) {
    if (!confirm(`${i}번 탭의 캐릭터 설정과 사냥 기록을 완전히 초기화하시겠습니까?`)) return;

    localStorage.removeItem(`maple_config_${i}`); // 저장된 설정을 날려버립니다.

    const fields = ['startMeso', 'targetMeso', 'startExp', 'startGem', 'startFrag', 'map', 'meso', 'exp', 'gem', 'frag'];
    fields.forEach(f => {
        const el = document.getElementById(`${f}_${i}`);
        if (el) el.value = ''; // 입력창의 글씨들을 모두 지웁니다.
    });

    if (typeof window.reRenderTabs === 'function') window.reRenderTabs();
    if (typeof window.resetSidebarUI === 'function') window.resetSidebarUI();
    if (typeof window.updateAll === 'function') window.updateAll(i);
    
    window.showToast("캐릭터 정보와 설정이 초기화되었습니다.");
};

/**
 * 🔄 툴바 내부의 캐릭터 버튼(탭)을 새로 그립니다.
 */
window.reRenderTabs = function() {
    const tabContainer = document.getElementById('tabContainer');
    const historyTabContainer = document.getElementById('historyTabContainer');
    if(!tabContainer) return;

    tabContainer.innerHTML = "";
    if (historyTabContainer) historyTabContainer.innerHTML = "";

    const currentTab = parseInt(window.currentIdx) || 1;
    const currentHistTab = parseInt(window.currentHistChar) || 1;

    for(let i=1; i<=4; i++) {
        const savedConfig = JSON.parse(localStorage.getItem(`maple_config_${i}`) || '{}');
        const savedName = savedConfig.name || `캐릭터 ${i}`;
        
        // [초보자용 주석] 캐릭터 상단 탭 버튼 클릭 시, 전역 인덱스 변수(window.currentIdx)와 세션 백업 공간을 즉시 선택한 번호(i)로 치환합니다.
        // 그리고 빈 탭으로 이동 시 이전 탭 캐릭터의 캐시 정보 잔상이 남지 않도록 완벽하게 데이터를 격리합니다.
        tabContainer.innerHTML += `<button class="tab-btn ${i === currentTab ? 'active' : ''}" id="tab_btn_${i}" onclick="window.currentIdx=${i}; sessionStorage.setItem('omni_current_tab_idx', ${i}); if(typeof openTab === 'function') openTab(${i}); if(typeof window.renderHuntCharacterCard === 'function') window.renderHuntCharacterCard(null); if(typeof window.renderAttendance === 'function') window.renderAttendance(); if(typeof window.reRenderTabs === 'function') window.reRenderTabs();">${savedName}</button>`;
        if (historyTabContainer) {
            historyTabContainer.innerHTML += `<button type="button" class="nav-btn ${i === currentHistTab ? 'active' : ''}" id="hist_tab_btn_${i}" onclick="window.currentHistChar=${i}; if(typeof openHistTab === 'function') openHistTab(${i}); if(typeof window.renderHistory === 'function') window.renderHistory(); if(typeof window.reRenderTabs === 'function') window.reRenderTabs();">${savedName}</button>`;
        }
    }
};

// ----------------------------------------------------------------------------
// [핵심] 출석부 및 로딩 이벤트 관리
// ----------------------------------------------------------------------------
window.renderAttendance = function() {
    const grid = document.getElementById('attendanceGrid');
    const monthLabel = document.getElementById('currentMonth');
    if (!grid) return;

    const charId = parseInt(window.currentIdx) || 1;
    const y = window.attendanceYear || new Date().getFullYear();
    const m = (window.attendanceMonth !== undefined) ? window.attendanceMonth : new Date().getMonth();

    if (monthLabel) monthLabel.innerText = `${y}년 ${m + 1}월`;

    const allRecords = JSON.parse(localStorage.getItem('maple_hunt_records') || '[]');
    const charRecords = allRecords.filter(rec => rec.charId == charId);
    const huntDates = [...new Set(charRecords.map(rec => rec.date))]; // 사냥한 날짜들의 중복을 제거해서 목록을 만듭니다.

    const manualAttendance = JSON.parse(localStorage.getItem(`manual_attendance_${charId}`) || '{}');
    const tempHistory = JSON.parse(localStorage.getItem('omni_sub_history')) || window.subHistory || {}; 
    
    let todayStr;
    if (typeof _getSafeTodayStr === 'function') {
        todayStr = _getSafeTodayStr();
    } else {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000; // 한국 시간 등 타임존 차이를 보정합니다.
        todayStr = (new Date(now - offset)).toISOString().split('T')[0];
    }
    
    const firstDay = new Date(y, m, 1).getDay();
    const lastDate = new Date(y, m + 1, 0).getDate();

    let html = '';
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    days.forEach(d => {
        html += `<div style="font-size: 11px; color: #94a3b8; font-weight: 800; padding-bottom: 8px; text-align:center;">${d}</div>`;
    });

    for (let i = 0; i < firstDay; i++) html += `<div></div>`;

    for (let d = 1; d <= lastDate; d++) {
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const hasHunt = huntDates.includes(dateStr); 
        const hasManual = manualAttendance[dateStr] === true; 
        
        const sKey = `${charId}_${dateStr}`;
        const isSessionActive = !!(tempHistory[sKey] && tempHistory[sKey].length > 0);
        
        // 사냥 기록이 있거나, 수동 출석했거나, 현재 작성 중인 세션이 있다면 출석으로 인정!
        const isAttended = hasHunt || hasManual || isSessionActive;
        const isToday = (dateStr === todayStr);

        let classNames = ['calendar-day'];
        if (isAttended) {
            classNames.push('active');
            classNames.push('today'); // 출석 도장 효과
        } else if (isToday) {
            classNames.push('today'); // 오늘 날짜 표시 효과
        }

        html += `<div class="${classNames.join(' ')}" onclick="if(typeof toggleAttendance === 'function') toggleAttendance('${dateStr}', ${charId})" style="cursor:pointer; text-align:center;">${d}</div>`;
    }
    grid.innerHTML = html;
};

/**
 * 🗑️ [통합 기록지] 개별 회차 기록을 삭제하는 기능입니다.
 */
window.deleteSingleRecord = function(timestamp, dateStr, charId) {
    if(!confirm("해당 회차 기록을 통합 기록지에서 삭제하시겠습니까?\n(사냥 세션 기록의 SENT 상태가 해제됩니다.)")) return;
    
    let allRecords = JSON.parse(localStorage.getItem('maple_hunt_records') || '[]');
    allRecords = allRecords.filter(r => r.timestamp !== timestamp); // 지우려는 시간표 데이터만 쏙 빼고 다시 저장합니다.
    localStorage.setItem('maple_hunt_records', JSON.stringify(allRecords));
    
    const sKey = `${charId}_${dateStr}`;
    if (!window.subHistory) {
        window.subHistory = JSON.parse(localStorage.getItem('omni_sub_history') || '{}');
    }

    if (window.subHistory[sKey]) {
        const sessionRec = window.subHistory[sKey].find(r => r.timestamp === timestamp || r.id === timestamp);
        if (sessionRec) {
            sessionRec.isFinalized = false; // "SENT" 딱지를 뗍니다.
            
            localStorage.setItem(`maple_subHistory_${sKey}`, JSON.stringify(window.subHistory[sKey]));
            localStorage.setItem('omni_sub_history', JSON.stringify(window.subHistory));
            
            if (typeof window.renderSubRecords === 'function') window.renderSubRecords(charId);
        }
    }

    if (typeof window.renderHistory === 'function') window.renderHistory();
    if (typeof window.refreshWeekly === 'function') window.refreshWeekly();
    if (typeof window.updateAll === 'function') window.updateAll(charId);
    
    const existingModal = document.getElementById('dayDetailModal');
    if(existingModal) existingModal.remove(); 
    
    // 만약 지우고 나서도 남은 기록이 있으면 팝업창을 다시 열어줍니다.
    const remaining = allRecords.filter(r => r.charId == charId && r.date === dateStr);
    if (remaining.length > 0) {
        if (typeof window.openDayDetail === 'function') window.openDayDetail(dateStr, charId);
    }
};

/**
 * 🗑️ [통합 기록지] 특정 날짜의 모든 사냥 기록을 하루 통째로 날려버리는 기능입니다.
 */
window.deleteDayRecords = function(dateStr, charId) {
    if (!confirm(`${dateStr}의 모든 사냥 기록과 출석 정보를 삭제하시겠습니까?`)) return;

    let allRecords = JSON.parse(localStorage.getItem('maple_hunt_records') || '[]');
    const filteredRecords = allRecords.filter(rec => !(rec.date === dateStr && rec.charId == charId));
    localStorage.setItem('maple_hunt_records', JSON.stringify(filteredRecords));

    // 수동 출석 도장도 찍혀있다면 지웁니다.
    let manualAtt = JSON.parse(localStorage.getItem(`manual_attendance_${charId}`) || '{}');
    if (manualAtt[dateStr]) {
        delete manualAtt[dateStr];
        localStorage.setItem(`manual_attendance_${charId}`, JSON.stringify(manualAtt));
    }

    const sKey = `${charId}_${dateStr}`;
    if (window.subHistory && window.subHistory[sKey]) {
        window.subHistory[sKey] = [];
        localStorage.removeItem(`maple_subHistory_${sKey}`); 
        localStorage.setItem('omni_sub_history', JSON.stringify(window.subHistory));
        
        if (typeof window.renderSubRecords === 'function') window.renderSubRecords(charId); 
    }

    // 변경된 내역이 화면에 바로 보이도록 각종 새로고침 함수들을 실행합니다.
    if (typeof window.renderHistory === 'function') window.renderHistory();         
    if (typeof window.renderAttendance === 'function') window.renderAttendance();     
    if (typeof window.refreshWeekly === 'function') window.refreshWeekly();           
    if (typeof window.updateAll === 'function') window.updateAll(charId);             
    
    const existingModal = document.getElementById('dayDetailModal');
    if (existingModal) existingModal.remove();

    if (typeof window.showToast === 'function') {
        window.showToast("기록과 출석 정보가 삭제되었습니다.");
    } else {
        alert("기록과 출석 정보가 삭제되었습니다.");
    }
};

// 🚀 [초기화] 페이지가 로드될 때 마지막으로 저장된 데이터를 불러옵니다.
window.addEventListener('DOMContentLoaded', () => {
    window.currentIdx = parseInt(sessionStorage.getItem('omni_current_tab_idx')) || 1;
    window.renderHuntCharacterCard();
});