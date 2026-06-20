/**
 * ============================================================================
 * 🛠️ MAPLE OMNI - 옴니 빌더 전용 모듈 (builder.js - 최종 완결본 V3)
 * [업데이트 반영 내역]
 * 1. 툴팁 UI 인게임 스타일 완벽 이식 (디자인/색상/폰트 최적화)
 * 2. 아이템 옵션 Breakdown (Base +Add +Etc +Star) 로직 적용
 * ============================================================================
 */

window.clearAllCache = function() {
    localStorage.removeItem('maple_builder_data');
    localStorage.removeItem('maple_last_search');
    alert("캐시가 초기화되었습니다. 다시 검색해주세요.");
    location.reload();
};

window.builderCurrentData = null;
window.currentSelectedSlotIndex = -1; 
window.currentSlotBaseStar = 0;
window.currentSlotBaseScrollStat = 0;
window.currentSlotBaseScrollAtk = 0;

let simStar = 17;     
let simScrollStat = 0; 
let simScrollAtk = 0;  
let currentPreset = 1; 
window.builderEquippedItems = Array(30).fill(null);

window.searchHistory = JSON.parse(localStorage.getItem('maple_search_history') || '[]');
window.builderCurrentData = JSON.parse(localStorage.getItem('maple_builder_data') || 'null');
window.diffPower = 0; 
window.diffStat = 0;
window.diffAtk = 0;

window.activePresetStats = null;
window.SCROLL_PRESETS = {}; 

window.formatMapleCP = function(num) {
    let cleanStr = String(num).replace(/,/g, ''); 
    let n = Math.abs(Number(cleanStr));
    let sign = Number(cleanStr) < 0 ? "-" : "";
    if (n === 0) return "0";
    
    let eok = Math.floor(n / 100000000);
    let man = Math.floor((n % 100000000) / 10000);
    let rest = Math.floor(n % 10000);
    
    let res = [];
    if (eok > 0) res.push(eok.toString() + "억");
    if (man > 0) res.push(man.toString() + "만");
    if (rest > 0 || (eok === 0 && man === 0)) res.push(rest.toString());
    
    return sign + res.join(" ");
};

const CATEGORY_MAP = {
    "장비/hat": ["모자", "햇", "캡", "헬름", "후드", "티아라"],
    "장비/armor": ["상의", "하의", "한벌옷", "아머", "슈트", "코트", "메일"],
    "장비/gloves": ["장갑", "글러브"],
    "장비/shoes": ["신발", "슈즈", "부츠"],
    "장비/cape": ["망토", "케이프"],
    "장신구/face": ["얼굴장식"],
    "장신구/ear": ["귀고리", "이어링"],
    "장신구/ring": ["반지", "링"],
    "장신구/shoulder": ["어깨장식", "숄더", "견장"],
    "장신구/pocket": ["포켓", "성배"]
};

window.getLocalItemIconBase = function(itemName) {
    if (!itemName) return null;
    const cleanName = itemName.trim();
    const fileName = window.getCorrectFileName(cleanName);

    if (window.ITEM_REGISTRY && window.ITEM_REGISTRY[cleanName]) {
        return `${window.ITEM_REGISTRY[cleanName]}/${fileName}`;
    }

    if (cleanName.includes("링") && ["리스트레인트", "웨폰퍼프", "크라이시스", "리스크 테이커"].some(k => cleanName.includes(k))) return `icon/시드링/${fileName}`;

    for (const [folder, keywords] of Object.entries(CATEGORY_MAP)) {
        if (keywords.some(k => cleanName.includes(k))) return `icon/${folder}/${fileName}`;
    }

    const bossKeywords = ["루즈 컨트롤", "마력이 깃든", "거대한 공포", "고통의 근원", "커맨더 포스", "몽환의", "창세의", "저주받은", "트와일라이트", "에스텔라", "데이브레이크", "가디언 엔젤", "혼테일", "핑크빛", "영생의"];
    if (bossKeywords.some(k => cleanName.includes(k))) return `icon/boss/${fileName}`;

    return `icon/장비/weapon/${fileName}`; 
};

window.getCorrectFileName = function(itemName) {
    const cleanName = itemName.trim();
    const job = window.builderCurrentData?.basic?.character_class || "";
    
    if (cleanName.includes("미트라") || cleanName.includes("엠블렘")) {
        let suffix = "";
        if (job.includes("전사")) suffix = "-전사";
        else if (job.includes("마법사")) suffix = "-마법사";
        else if (job.includes("궁수")) suffix = "-궁수";
        else if (job.includes("도적")) suffix = "-도적";
        else if (job.includes("해적")) suffix = "-해적";
        return cleanName + suffix;
    }
    return cleanName;
};

const DOPING_DATA = {
    "마슈르의 선물": { power: 300, stat: 0, icon: "마슈르의 선물.png" },
    "MVP 슈퍼 파워 버프": { power: 300, stat: 0, icon: "MVP 슈퍼 파워 버프.png" },
    "Lv.250의 축복": { power: 500, stat: 0, icon: "Lv.250의 축복.png" },
    "유니온의 힘": { power: 300, stat: 0, icon: "유니온의 힘.png" },
    "향상된 10단계 물약": { power: 0, stat: 30, icon: "향상된 10단계 물약.png" },
    "붕어빵 뿌리기": { power: 300, stat: 0, icon: "붕어빵 뿌리기.png" },
    "익스트림 레드": { power: 300, stat: 0, icon: "익스트림 레드.png" },
    "고급 보스 킬러": { power: 500, stat: 0, icon: "고급 보스 킬러.png" },
    "고급 관통의 비약": { power: 0, stat: 0, icon: "고급 관통의 비약.png" },
    "반짝이는 빨간 별 물약": { power: 0, stat: 0, icon: "반짝이는 빨간 별 물약.png" },
    "영롱한 달빛 포션": { power: 200, stat: 0, icon: "영롱한 달빛 포션.png" },
    "VIP 버프": { power: 150, stat: 15, icon: "VIP버프.png" },
    "챔피언의 가호": { power: 200, stat: 10, icon: "챔피언의 가호.png" },
    "명예의 영약": { power: 600, stat: 0, icon: "명예의 영약.png" },
    "알레리아의 영약": { power: 0, stat: 0, icon: "알레리아의 영약.png" },
    "세이람 영약": { power: 500, stat: 0, icon: "세이람 영약.png" },
    "콜렉터의 영약": { power: 100, stat: 30, icon: "콜렉터의 영약.png" }
};

const MAPLE_SLOT_NAMES = [
    "반지1", "눈장식", null, "모자", "망토",
    "반지2", "얼굴장식", null, "상의", "장갑",
    "반지3", "귀고리", null, "하의", "신발",
    "반지4", "펜던트1", null, "어깨장식", "훈장",
    "벨트", "펜던트2", null, "안드로이드", "기계 심장",
    "포켓 아이템", "무기", "보조무기", "엠블렘", "뱃지"
];



// ------------------------------------

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

    const styleInjection = `
        <style>
            @keyframes spinGear { 100% { transform: rotate(360deg); } }
            @keyframes pulseAlert { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
            .omni-scroll::-webkit-scrollbar { width: 5px; }
            .omni-scroll::-webkit-scrollbar-track { background: transparent; }
            .omni-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
            .pot-row { display:flex; gap:8px; align-items:center; background:#f8fafc; padding:8px 10px; border-radius:10px; border:1px solid #e2e8f0; transition:all 0.2s; box-shadow:inset 0 1px 2px rgba(0,0,0,0.02); }
            .pot-row:focus-within { border-color:#3b82f6; background:#ffffff; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
            .pot-num { width:22px; height:22px; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:900; color:#fff; }
            .opt-input { flex:1; padding:6px; border:1px solid #cbd5e1; border-radius:6px; font-size:11px; font-weight:800; text-align:center; color:#334155; }
        </style>
    `;

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
            // image-rendering: pixelated를 추가하여 픽셀이 뭉개지지 않고 뚜렷하게 보이게 합니다.
            // transform: scale(3.0)을 통해 원하는 만큼 확대하고, object-position으로 위치를 조정합니다.
            // width와 height를 300%로 설정하여 확대하고, 
// pixelated를 제거하여 브라우저의 부드러운 스케일링을 사용합니다.
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
                    
                    <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 16px;">
                        <div class="panel-title" style="font-weight: 900; font-size: 12px; color: #334155; margin-bottom: 10px;">🧪 실시간 적용 도핑</div>
                        <div id="dopingList" class="doping-container" style="display: flex; flex-direction: column; gap: 6px; font-size: 11.5px; color: #334155; font-weight: 700;"></div>
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
        
        // 1. 주스텟/주공격력 키 매핑
        const mapping = { "힘": "STR", "덱": "DEX", "인": "INT", "럭": "LUK" };
        const mainStatKey = mapping[koreanStat] || "STR";
        const mainAtkKey = (jobGroup === "마법사") ? "MATK" : "ATK";

        // 2. 스타일 정의 (올스탯 박스와 디자인 통일)
        const activeStyle = "box-sizing: border-box; width: 100%; padding:6px; border:1px solid #fbcfe8; border-radius:6px; background:#fff1f2; color:#be185d; font-size:12px; font-weight:bold; text-align:center; transition: all 0.2s;";
        const normalStyle = "box-sizing: border-box; width: 100%; padding:6px; border:1px solid #cbd5e1; border-radius:6px; background:#f8fafc; color:#334155; font-size:12px; font-weight:bold; text-align:center; transition: all 0.2s;";

        const getStyle = (key) => {
            // 직업의 주스텟이거나 주력 공격/마력 옵션이면 active 스타일 적용
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
        ${styleInjection}
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

window.getJobMainStatName = function(jobName) {
    const jobGroup = window.getJobGroup(jobName);
    if (jobGroup === "전사") return "힘";
    if (jobGroup === "궁수") return "덱";
    if (jobGroup === "마법사") return "인";
    if (jobGroup === "도적") return "럭";
    if (jobGroup === "해적") return "힘";
    return "주스탯";
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
            // 💡 툴팁 이벤트 리스너 추가
slot.onmouseenter = (e) => {
    if(window.currentSelectedSlotIndex !== i) slot.style.borderColor = '#94a3b8';
    const item = window.builderEquippedItems[i];
    if (item) window.showOmniTooltip(e, item); // 공용 함수로 변경!
};
slot.onmouseleave = () => {
    if(window.currentSelectedSlotIndex !== i) slot.style.borderColor = '#e2e8f0';
    window.hideOmniTooltip(); // 공용 함수로 변경!
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
                
                // 💡 [개선] 옥션 기준 상세 잠재능력 파싱
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
    // [개선] 프리셋 변경 시 브라우저 뒤로가기 역사 기록 차단
    window.history.replaceState(null, '', window.location.href);

    currentPreset = num;
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

window.getAutoPresetName = function() {
    let dropMesoCount = 0;
    window.builderEquippedItems.forEach(item => {
        if (item && item.potentials) {
            item.potentials.forEach(p => {
                if (p.type === '아이템 드롭률%' || p.type === '메소 획득량%') {
                    dropMesoCount++;
                }
            });
        }
    });
    const isHunting = dropMesoCount >= 2;
    return isHunting ? "사냥 세팅" : "보스 세팅";
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
        
        simStar = window.currentSlotBaseStar;
        simScrollStat = window.currentSlotBaseScrollStat;
        simScrollAtk = window.currentSlotBaseScrollAtk;

        // 추옵 UI 바인딩
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
        simStar = 0;
        simScrollStat = 0;
        simScrollAtk = 0;

        document.getElementById('addOptStr').value = '';
        document.getElementById('addOptDex').value = '';
        document.getElementById('addOptInt').value = '';
        document.getElementById('addOptLuk').value = '';
        document.getElementById('addOptAtk').value = '';
        document.getElementById('addOptMatk').value = '';
        document.getElementById('addOptAll').value = '';
    }
    
    document.getElementById('builderValStar').innerText = simStar + '성';
    
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

    // 💡 [수정] 아이콘 경로 우선순위: 1. API 데이터(item_icon) 2. 로컬 기본 아이콘
    let apiItem = window.builderCurrentData?.item?.item_equipment?.find(i => i.item_name === itemName);
    const iconUrl = (apiItem && apiItem.item_icon) ? apiItem.item_icon : (window.getLocalItemIconBase(itemName) + ".png");
    
    if (window.currentSelectedSlotIndex !== -1) {
        if (!window.builderEquippedItems[window.currentSelectedSlotIndex]) {
            window.builderEquippedItems[window.currentSelectedSlotIndex] = {};
        }
        window.builderEquippedItems[window.currentSelectedSlotIndex].item_name = itemName;
        window.builderEquippedItems[window.currentSelectedSlotIndex].item_icon = iconUrl;
    }
    
    // 렌더링
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

window.changeBuilderStar = function(val) { 
    if(window.currentSelectedSlotIndex === -1) {
        alert("장착 보드에서 장비를 먼저 클릭해주세요!");
        return;
    }
    simStar = Math.max(0, Math.min(25, simStar + val)); 
    document.getElementById('builderValStar').innerText = simStar + '성'; 
    if (window.builderEquippedItems[window.currentSelectedSlotIndex]) {
        window.builderEquippedItems[window.currentSelectedSlotIndex].starforce = simStar;
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
            
            // 💡 [Breakdown 로직] Base + Add + Etc + Star
            const base = item.base_option || {};
            const add = item.add_option || {};
            const etc = item.etc_option || {};
            const starforce = item.starforce || 0;

            const baseVal = Number(base[sKey] || 0);
            const addVal = Number(add[sKey] || 0);
            const etcVal = Number(etc[sKey] || 0);
            const starStats = getOfficialStarforceStats(Number(base[aKey] || 0), starforce, item.level || 140);
            
            diffStat = baseVal + addVal + etcVal + starStats.stat;
            diffAtk = Number(base[aKey] || 0) + Number(add[aKey] || 0) + Number(etc[aKey] || 0) + starStats.atk;
            diffPower = (diffStat * 1) + (diffAtk * 4);
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

    diffPower += dopingPower;
    diffStat += dopingStat;
    
    const formatDiff = (num) => (num >= 0 ? '+' : '') + Math.floor(num).toLocaleString();
    
    const powerEl = document.getElementById('builderFinalPower');
    const statEl = document.getElementById('builderFinalStat');
    const atkEl = document.getElementById('builderFinalAtk');

    if (powerEl) {
        powerEl.innerText = formatDiff(diffPower);
        powerEl.style.color = diffPower >= 0 ? '#ef4444' : '#3b82f6'; 
    }
    if (statEl) {
        statEl.innerText = formatDiff(diffStat);
        statEl.style.color = diffStat >= 0 ? '#ef4444' : '#3b82f6';
    }
    if (atkEl) {
        atkEl.innerText = formatDiff(diffAtk);
        atkEl.style.color = diffAtk >= 0 ? '#ef4444' : '#3b82f6';
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

    updateActualStatUI("전투력", findStatVal("전투력"), diffPower);
    updateActualStatUI("최대 스탯공격력", findStatVal("최대 스탯공격력"), diffPower * 0.8);

    let mainStatName = "STR";
    let maxVal = 0;
    ["STR", "DEX", "INT", "LUK"].forEach(s => {
        let val = findStatVal(s);
        if(val > maxVal) { maxVal = val; mainStatName = s; }
    });
    updateActualStatUI(mainStatName, findStatVal(mainStatName), diffStat);

    const tooltip = document.getElementById('maple_tooltip');
    if (tooltip && tooltip.style.display === 'block' && window.currentSelectedSlotIndex !== -1) {
        const dummyEvent = { clientX: parseInt(tooltip.style.left) - 15, clientY: parseInt(tooltip.style.top) + 10 };
        window.showOmniTooltip(dummyEvent, window.builderEquippedItems[window.currentSelectedSlotIndex]);
    }
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

window.getJobGroup = function(jobName) {
    if (!jobName) return "공통";
    const warrior = ["히어로", "팔라딘", "다크나이트", "소울마스터", "미하일", "블래스터", "데몬", "아란", "카이저", "아델", "제로", "전사", "렌"];
    const magician = ["비숍", "아크메이지", "불독", "썬콜", "플레임위자드", "배틀메이지", "에반", "루미너스", "일륨", "라라", "키네시스", "마법사"];
    const bowman = ["보우마스터", "신궁", "패스파인더", "윈드브레이커", "와일드헌터", "메르세데스", "카인", "궁수"];
    const thief = ["나이트로드", "섀도어", "듀얼블레이드", "나이트워커", "팬텀", "카데나", "호영", "칼리", "도적"];
    const pirate = ["바이퍼", "캡틴", "캐논슈터", "스트라이커", "메카닉", "은월", "엔젤릭버스터", "아크", "해적"];
    if (warrior.some(job => jobName.includes(job))) return "전사";
    if (magician.some(job => jobName.includes(job))) return "마법사";
    if (bowman.some(job => jobName.includes(job))) return "궁수";
    if (thief.some(job => jobName.includes(job))) return "도적";
    if (pirate.some(job => jobName.includes(job))) return "해적";
    return "공통";
};

window.saveBossPreset = function() {
    const dataToSave = {
        items: window.builderEquippedItems,
        stats: window.activePresetStats
    };
    localStorage.setItem('builder_boss_preset', JSON.stringify(dataToSave));
    alert("✅ API 보스셋팅 기록이 저장되었습니다!");
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