/**
 * ============================================================================
 * 🛠️ MAPLE OMNI V15 - builder.js [PREMIUM INTEGRATED CORE ENGINE - VERIFIED]
 * 설명: 직업별 스탯 자동 대응, 일반/에디셔널 잠재능력 수치 기입 방식 통합 개조,
 *       공식 곱연산 전투력 추옵 보정, 캐릭터 정보창 추가 및 디테일 세트 효과 구현 코어.
 * 규칙: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 달아줍니다.
 * ============================================================================
 */

// 💡 [초보자 가이드 - 테마 동기화 세이프 가드]
// 탭을 전환하거나 페이지가 리로드될 때 테마 설정이 풀려버리는 현상을 완벽히 차단합니다.
(function() {
    const savedTheme = localStorage.getItem('omni_theme_status') || localStorage.getItem('omni-theme') || 'light';
    localStorage.setItem('omni_theme_status', savedTheme);
    localStorage.setItem('omni-theme', savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
})();

// ============================================================================
// 📦 [PART 1] 통합 장비 데이터 레지스트리 (item_db.js 연동 로더 및 슬롯 매퍼)
// ============================================================================

window.SLOT_CATEGORY_MAP = {
    "모자": "hat", "상의": "armor", "하의": "pants", "무기": "weapon",
    "눈장식": "eye", "얼굴장식": "face", "귀고리": "ear", "펜던트": "pendant",
    "펜던트2": "pendant", "벨트": "belt", 
    "반지1": "ring", "반지2": "ring", "반지3": "ring", "반지4": "ring", 
    "장갑": "gloves", "신발": "shoes", "망토": "cape", "어깨장식": "shoulder", 
    "엠블렘": "emblem", "뱃지": "badge", "포켓 아이템": "pocket", 
    "훈장": "decoration", "기계 심장": "heart", "안드로이드": "android", "보조무기": "sub"
};

// 🛡️ [초보자 가이드 - 슬롯 매칭 세이프 가드]
// Nexon API 장비 부위와 빌더 그리드 슬롯의 텍스트가 일치하는지 정밀 가공하여 비교합니다.
window.isSlotMatching = function(slotA, slotB) {
    if (!slotA || !slotB) return false;
    const clean = s => s.replace(/\s+/g, "").replace("배지", "뱃지").replace("펜던트1", "펜던트").replace("한벌옷", "상의").trim();
    return clean(slotA) === clean(slotB);
};

// 💡 [초보자 가이드 - 경로 자동 한글명화]
// 영어 폴더 내에 정확한 한글 띄어쓰기 PNG 파일이 들어있으므로, 이를 완전 자동 조립해 줍니다.
window.getEquipmentImagePath = function(slotName, itemName) {
    if (!itemName) return "";
    const folder = window.SLOT_CATEGORY_MAP[slotName] || "weapon";
    // 예: icon/장비/hat/하이네스 던위치햇.png
    return `icon/장비/${folder}/${itemName}.png`;
};

// 💡 [초보자 가이드] 수동으로 기어를 교체할 때 현재 슬롯과 직업군에 정확히 매칭되는 아이템 목록만 선별합니다.
window.getGearForSlot = function(slotName) {
    const registry = window.ITEM_REGISTRY || {};
    const myClass = window.currentSearchData?.basic?.character_class || "전사"; 
    let items = [];
    
    for (let name in registry) {
        let isMatched = false;

        if (slotName === "모자") {
            isMatched = name.includes("모자") || name.includes("헬름") || name.includes("햇") || name.includes("크라운") || name.includes("서클릿") || name.includes("가발") || name.includes("후드");
        } else if (slotName === "상의") {
            isMatched = name.includes("상의") || name.includes("아머") || name.includes("로브") || name.includes("메일") || name.includes("재킷") || name.includes("수트");
        } else if (slotName === "하의") {
            isMatched = name.includes("하의") || name.includes("팬츠") || name.includes("트라우저") || name.includes("치마") || name.includes("스커트");
        } else if (slotName === "무기") {
            isMatched = name.includes("소드") || name.includes("스태프") || name.includes("완드") || name.includes("보우") || name.includes("건") || name.includes("너클") || name.includes("창") || name.includes("폴암") || name.includes("데스페라도") || name.includes("체인") || name.includes("부채") || name.includes("튜너") || name.includes("가디언") || name.includes("클레이모어") || name.includes("해머") || name.includes("건틀렛") || name.includes("아대");
        } else if (slotName.includes("반지") || slotName.includes("ring")) {
            isMatched = name.includes("링") || name.includes("반지") || name.includes("서클");
        } else if (slotName.includes("펜던트")) {
            isMatched = name.includes("펜던트") || name.includes("목걸이");
        } else if (slotName === "눈장식") {
            isMatched = name.includes("눈장식") || name.includes("안경") || name.includes("마크") || name.includes("글래스");
        } else if (slotName === "얼굴장식") {
            isMatched = name.includes("얼굴장식") || name.includes("가면") || name.includes("마스크") || name.includes("페인팅");
        } else if (slotName === "귀고리") {
            isMatched = name.includes("귀고리") || name.includes("이어링");
        } else if (slotName === "벨트") {
            isMatched = name.includes("벨트") || name.includes("버클");
        } else if (slotName === "장갑") {
            isMatched = name.includes("장갑") || name.includes("글러브") || name.includes("손목보호대");
        } else if (slotName === "신발") {
            isMatched = name.includes("신발") || name.includes("슈즈") || name.includes("부츠");
        } else if (slotName === "망토") {
            isMatched = name.includes("망토") || name.includes("숄더패치") || name.includes("케이프") || name.includes("윙");
        } else if (slotName === "어깨장식") {
            isMatched = name.includes("어깨장식") || name.includes("숄더");
        } else if (slotName === "엠블렘") {
            isMatched = name.includes("엠블렘");
        } else if (slotName === "뱃지") {
            isMatched = name.includes("뱃지") || name.includes("배지");
        } else if (slotName === "포켓 아이템") {
            isMatched = name.includes("포켓") || name.includes("성배") || name.includes("인형") || name.includes("서적");
        } else if (slotName === "훈장") {
            isMatched = name.includes("훈장");
        } else if (slotName === "기계 심장") {
            isMatched = name.includes("하트") || name.includes("심장");
        } else if (slotName === "안드로이드") {
            isMatched = name.includes("안드로이드") || name.includes("로이드");
        } else if (slotName === "보조무기") {
            isMatched = name.includes("보조무기") || name.includes("실드") || name.includes("방패") || name.includes("블레이드") || name.includes("로자리오") || name.includes("매직포스") || name.includes("체스피스") || name.includes("오브") || name.includes("소울링") || name.includes("컨트롤러") || name.includes("카르트") || name.includes("체인") || name.includes("탄창") || name.includes("수호부") || name.includes("화약통");
        } else {
            isMatched = name.includes(slotName);
        }

        if (isMatched) {
            const isWarriorGear = name.includes("워리어") || name.includes("전사") || name.includes("나이트");
            const isMageGear = name.includes("메이지") || name.includes("마법사") || name.includes("리추얼") || name.includes("로브");
            const isArcherGear = name.includes("아처") || name.includes("궁수") || name.includes("센티널");
            const isThiefGear = name.includes("시프") || name.includes("도적") || name.includes("섀도우");
            const isPirateGear = name.includes("바이퍼") || name.includes("해적") || name.includes("스키퍼");

            const classKeywordCheck = isWarriorGear || isMageGear || isArcherGear || isThiefGear || isPirateGear;

            if (!classKeywordCheck || name.includes(myClass) || 
                (myClass === "키네시스" && name.includes("메이지")) || 
                (myClass === "아델" && name.includes("나이트"))) {
                items.push({ name: name, icon: window.getEquipmentImagePath(slotName, name) });
            }
        }
    }
    return items;
};

// ============================================================================
// 🧪 [PART 2] 메이플스토리 실전 도핑 레지스트리
// ============================================================================
window.omniDopingRegistry = [
    { id: "dop_chair", name: "Lv.250의 축복", icon: "icon/doping/Lv.250의 축복.png", type: "atk_matk", value: 40, desc: "공격력/마력 +40 증가 버프 (의자 효과)" },
    { id: "dop_mvp", name: "MVP 슈퍼 파워 버프", icon: "icon/doping/MVP 슈퍼 파워 버프.png", type: "atk_matk", value: 30, desc: "공격력/마력 +30 증가 버프" },
    { id: "dop_vip", name: "VIP 버프", icon: "icon/doping/VIP버프.png", type: "atk_matk", value: 15, desc: "공격력/마력 +15 증가 버프" },
    { id: "dop_pierce", name: "고급 관통의 비약", icon: "icon/doping/고급 관통의 비약.png", type: "boss_dmg", value: 10, desc: "보스 몬스터 데미지 +10% 가중 적용" },
    { id: "dop_boss_killer", name: "고급 보스 킬러", icon: "icon/doping/고급 보스 킬러.png", type: "boss_dmg", value: 20, desc: "보스 몬스터 데미지 +20% 증가 비약" },
    { id: "dop_masur", name: "마슈르의 선물", icon: "icon/doping/마슈르의 선물.png", type: "atk_matk", value: 30, desc: "공격력/마력 +30 증가 기상 버프" },
    { id: "dop_honor", name: "명예의 영약", icon: "icon/doping/명예의 영약.png", type: "main_stat", value: 50, desc: "핵심 주스탯 +50 증가 비약" },
    { id: "dop_star", name: "반짝이는 빨간 별 물약", icon: "icon/doping/반짝이는 빨간 별 물약.png", type: "boss_dmg", value: 20, desc: "보스 몬스터 데미지 +20% 증가 물약" },
    { id: "dop_taiyaki", name: "붕어빵 뿌리기", icon: "icon/doping/붕어빵 뿌리기.png", type: "atk_matk", value: 30, desc: "공격력/마력 +30 증가 기상 버프" },
    { id: "dop_seiram", name: "세이람 영약", icon: "icon/doping/세이람 영약.png", type: "main_stat", value: 80, desc: "핵심 주스탯 +80 증가 비약" },
    { id: "dop_aleria", name: "알레리아의 영약", icon: "icon/doping/알레리아의 영약.png", type: "atk_matk", value: 20, desc: "공격력/마력 +20 증가 비약" },
    { id: "dop_moonlight", name: "영롱한 달빛 포션", icon: "icon/doping/영롱한 달빛 포션.png", type: "main_stat", value: 100, desc: "핵심 주스탯 +100 증가 포션" },
    { id: "dop_union_power", name: "유니온의 힘", icon: "icon/doping/유니온의 힘.png", type: "atk_matk", value: 30, desc: "공격력/마력 +30 증가 버프" },
    { id: "dop_mpe", name: "익스트림 레드", icon: "icon/doping/익스트림 레드.png", type: "atk_matk", value: 30, desc: "공격력/마력 +30 증가 (몬파 대표 물약)" },
    { id: "dop_champion", name: "챔피언의 가호", icon: "icon/doping/챔피언의 가호.png", type: "atk_matk", value: 25, desc: "공격력/마력 +25 증가 버프" },
    { id: "dop_collector", name: "콜렉터의 영약", icon: "icon/doping/콜렉터의 영약.png", type: "main_stat", value: 60, desc: "핵심 주스탯 +60 증가 비약" },
    { id: "dop_potion", name: "향상된 10단계 물약", icon: "icon/doping/향상된 10단계 물약.png", type: "main_stat", value: 120, desc: "핵심 주스탯 +120 정밀 증가 물약" }
];

// ============================================================================
// 📦 [PART 3] 시뮬레이션 엔진 상태 가상 메모리 코어
// ============================================================================
window.omniSimMemory = {
    selectedSlot: null,      
    selectedItem: null,      
    activePreset: 2,         
    initialLoaded: false, 
    customStats: {
        starforce: 0,
        str: 0, dex: 0, int: 0, luk: 0,
        atk: 0, matk: 0, allStat: 0,
        potentialGrade: "일반",
        additionalPotentialGrade: "일반"
    }
};

window.findOptimalBossPreset = function(itemData) {
    if (!itemData) return { presetNum: 2, list: [] };
    const presetSlots = [
        { num: 1, data: itemData.item_equipment_preset_1 || [] },
        { num: 2, data: itemData.item_equipment_preset_2 || [] },
        { num: 3, data: itemData.item_equipment_preset_3 || [] }
    ];
    let fallbackPreset = null;
    for (let i = 0; i < presetSlots.length; i++) {
        const slot = presetSlots[i];
        if (slot.data.length === 0) continue;
        if (!fallbackPreset) fallbackPreset = slot;

        let farmingItemCount = 0; 
        slot.data.forEach(gear => {
            const allPotentials = [
                gear.potential_option_1, gear.potential_option_2, gear.potential_option_3
            ].join(' ');
            if (allPotentials.includes("아이템 드롭률") || allPotentials.includes("메소 획득량")) {
                farmingItemCount++;
            }
        });
        if (farmingItemCount < 2) return { presetNum: slot.num, list: slot.data };
    }
    if (fallbackPreset) return { presetNum: fallbackPreset.num, list: fallbackPreset.data };
    return { presetNum: 2, list: itemData.item_equipment || [] };
};

// 💡 [초보자 가이드] 직업군에 따라 주스탯과 마법 공격 타입을 정밀 감지하는 코어 매핑 함수입니다.
window.getClassMainStatAndAtkType = function() {
    const className = window.currentSearchData?.basic?.character_class || "전사";
    let mainStat = "str";
    let subStat = "dex";
    let atkType = "atk";
    
    if (["메이지", "마법사", "썬콜", "불독", "비숍", "플레임위자드", "에반", "루미너스", "일리움", "배틀메이지", "키네시스", "라라"].some(k => className.includes(k))) {
        mainStat = "int";
        subStat = "luk";
        atkType = "matk";
    } else if (["도적", "나이트로드", "섀도어", "듀얼블레이드", "카데나", "호영", "팬텀", "칼리"].some(k => className.includes(k))) {
        mainStat = "luk";
        subStat = "dex";
        atkType = "atk";
    } else if (["궁수", "보우마스터", "신궁", "윈드브레이커", "메르세데스", "와일드헌터", "패스파인더", "카인"].some(k => className.includes(k))) {
        mainStat = "dex";
        subStat = "str";
        atkType = "atk";
    } else if (["해적", "바이퍼", "캡틴", "캐논슈터", "스트라이커", "은월", "메카닉", "블래스터", "엔젤릭버스터", "아크"].some(k => className.includes(k))) {
        if (["메카닉", "엔젤릭버스터"].some(k => className.includes(k))) {
            mainStat = "dex";
            subStat = "str";
        } else {
            mainStat = "str";
            subStat = "dex";
        }
        atkType = "atk";
    } else {
        mainStat = "str";
        subStat = "dex";
        atkType = "atk";
    }
    return { mainStat, subStat, atkType };
};

window.getJobStatLabel = function() {
    return window.getClassMainStatAndAtkType().mainStat.toUpperCase();
};

// ============================================================================
// 🏛️ [PART 4] 메인 화면 레이아웃 초기화 및 테마 동기화 엔진 규칙 적용
// ============================================================================
window.initOmniBuilderTab = function() {
    const rootBox = document.getElementById('builderContent');
    if (!rootBox) return;

    if (!window.currentSearchData && localStorage.getItem('omni_builder_last_active_search_data')) {
        try {
            window.currentSearchData = JSON.parse(localStorage.getItem('omni_builder_last_active_search_data'));
        } catch(e) {
            console.error("[OMNI BUILDER LOCALSTORAGE LOAD ERROR]:", e);
        }
    }

    const searchContext = window.currentSearchData;
    
    if (!searchContext || !searchContext.stat || searchContext.stat.final_stat.length <= 1) {
        window.currentSearchData = {
            basic: { character_name: "임시 캐릭터", character_level: 260, world_name: "리부트", character_class: "초보자", character_image: "", character_guild_name: "길드 없음", popularity: "0" },
            union: { union_level: "0" },
            dojo: { dojo_best_floor: "0" },
            stat: { 
                final_stat: [
                    { stat_name: "전투력", stat_value: "10,000,000" },
                    { stat_name: "최소 스탯공격력", stat_value: "8,000,000" },
                    { stat_name: "최대 스탯공격력", stat_value: "10,000,000" },
                    { stat_name: "데미지", stat_value: "50" },
                    { stat_name: "보스 몬스터 데미지", stat_value: "200%" },
                    { stat_name: "최종 데미지", stat_value: "50.00" },
                    { stat_name: "방어율 무시", stat_value: "90.00" },
                    { stat_name: "크리티컬 확률", stat_value: "100" },
                    { stat_name: "크리티컬 데미지", stat_value: "50" },
                    { stat_name: "상태이상 내성", stat_value: "50" },
                    { stat_name: "스탠스", stat_value: "100" },
                    { stat_name: "방어력", stat_value: "10,000" },
                    { stat_name: "이동속도", stat_value: "140" },
                    { stat_name: "점프력", stat_value: "120" },
                    { stat_name: "스타포스", stat_value: "150" },
                    { stat_name: "아케인포스", stat_value: "600" },
                    { stat_name: "어센틱포스", stat_value: "0" },
                    { stat_name: "STR", stat_value: "2,000" },
                    { stat_name: "DEX", stat_value: "2,000" },
                    { stat_name: "INT", stat_value: "2,000" },
                    { stat_name: "LUK", stat_value: "2,000" },
                    { stat_name: "HP", stat_value: "30,000" },
                    { stat_name: "MP", stat_value: "30,000" },
                    { stat_name: "AP 배분 STR", stat_value: "102" }
                ]
            },
            item: { item_equipment: [] }
        };
    }

    const itemContext = window.currentSearchData.item || {};
    
    if (!window.omniSimMemory.initialLoaded) {
        const optimalPresetResult = window.findOptimalBossPreset(itemContext);
        window.omniSimMemory.activePreset = optimalPresetResult.presetNum;
        window.omniSimMemory.initialLoaded = true;
    }

    if (!window.builderCurrentList || window.builderCurrentList.length === 0) {
        const currentActiveNum = window.omniSimMemory.activePreset;
        const targetPresetKey = `item_equipment_preset_${currentActiveNum}`;
        const sourceList = itemContext[targetPresetKey] || itemContext.item_equipment || [];
        
        if (sourceList.length === 0 && window.omniGearRegistry) {
            const defaultSetup = [];
            const label = window.getJobStatLabel();
            window.omniGearRegistry.forEach(reg => {
                const autoIconPath = window.getEquipmentImagePath(reg.slot, reg.name);
                defaultSetup.push({
                    item_name: reg.name,
                    item_equipment_slot: reg.slot,
                    starforce: "22",
                    potential_option_grade: "레전드리",
                    potential_option_1: `${label} +12%`,
                    potential_option_2: `${label} +9%`,
                    potential_option_3: "공격력 +9%",
                    additional_potential_option_grade: "에픽",
                    additional_potential_option_1: "올스탯 +6%",
                    additional_potential_option_2: "올스탯 +6%",
                    additional_potential_option_3: "공격력 +9%",
                    item_icon: autoIconPath,
                    item_base_option: { str: reg.base.str, dex: reg.base.dex, int: reg.base.int, luk: reg.base.luk, attack_power: reg.base.atk, magic_power: reg.base.matk },
                    item_starforce_option: { str: 45, dex: 45, int: 45, luk: 45, attack_power: 35, magic_power: 35 },
                    item_add_option: { str: 40, dex: 40, int: 40, luk: 40, attack_power: 20, magic_power: 20 },
                    item_etc_option: { str: 15, dex: 15, int: 15, luk: 15, attack_power: 8, magic_power: 8 }
                });
            });
            window.builderCurrentList = defaultSetup;
            window.builderOriginalList = JSON.parse(JSON.stringify(defaultSetup));
        } else {
            // API에서 불러온 데이터는 그대로 유지하고, 아이콘 정보가 없는 경우에만 한글/영문 폴더 이미지 경로로 변환하여 적용시킵니다.
            const parsedList = sourceList.map(item => {
                const autoIconPath = window.getEquipmentImagePath(item.item_equipment_slot, item.item_name);
                return { ...item, item_icon: item.item_icon || autoIconPath };
            });
            window.builderCurrentList = parsedList;
            window.builderOriginalList = JSON.parse(JSON.stringify(parsedList));
        }
    } else {
        if (!window.builderOriginalList) {
            const currentActiveNum = window.omniSimMemory.activePreset;
            const targetPresetKey = `item_equipment_preset_${currentActiveNum}`;
            const sourceList = itemContext[targetPresetKey] || itemContext.item_equipment || [];
            if (sourceList.length > 0) {
                const parsedList = sourceList.map(item => {
                    const autoIconPath = window.getEquipmentImagePath(item.item_equipment_slot, item.item_name);
                    return { ...item, item_icon: autoIconPath };
                });
                window.builderOriginalList = JSON.parse(JSON.stringify(parsedList));
            } else {
                window.builderOriginalList = JSON.parse(JSON.stringify(window.builderCurrentList));
            }
        }
    }

    const userAvatarUrl = window.currentSearchData?.basic?.character_image || 'https://open.nexon.com/static/image/maplestory/char/default.png';

    // 💡 [초보자 가이드 - 캐릭터 정보 연동 바인딩]
    const charGuild = window.currentSearchData?.basic?.character_guild_name || "길드 없음";
    const charPopularity = window.currentSearchData?.basic?.popularity || "0";
    const charUnion = window.currentSearchData?.union?.union_level ? `Lv.${window.currentSearchData.union.union_level}` : "-";
    const charDojo = window.currentSearchData?.dojo?.dojo_best_floor ? `${window.currentSearchData.dojo.dojo_best_floor}층` : "-";

    rootBox.innerHTML = `
        <div style="background: var(--builder-card-bg); border-radius: 12px; padding: 18px 24px; border: 1px solid var(--builder-border); display: flex; justify-content: space-between; align-items: center; width: 100%; box-sizing: border-box; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);">
            <div style="display: flex; align-items: center; gap: 16px;">
                <!-- 🖼️ [프로필 캐릭터 위치] scale 및 top 수치는 CSS 변수(--profile-avatar-top, --profile-avatar-scale)에 바인딩되어 완벽하게 조정 가능합니다. -->
                <div class="builder-profile-avatar-circle">
                    <img src="${userAvatarUrl}" style="width: 100%; height: 100%; object-fit: contain; position: absolute; top: var(--profile-avatar-top); left: 50%; transform: translateX(-50%) scale(var(--profile-avatar-scale)); transform-origin: center center;" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%237c3aed%22><path d=%22M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z%22/></svg>';">
                </div>
                <div>
                    <div style="font-size: 15px; font-weight: 900; color: var(--builder-text-main); display: flex; align-items: center; gap: 6px;">
                        <span>${window.currentSearchData.basic.character_name}</span>
                        <span style="font-size: 10px; background: var(--builder-input-bg); color: var(--builder-text-accent); padding: 2px 6px; border-radius: 4px; font-weight: 800; border: 1px solid var(--builder-border);">● LIVE SPEC PRESET</span>
                    </div>
                    <div style="font-size: 12px; color: var(--builder-text-sub); font-weight: 700; margin-top: 4px;">
                        Lv.${window.currentSearchData.basic.character_level || 282} · ${window.currentSearchData.basic.world_name || '엘리시움'} · ${window.currentSearchData.basic.character_class || '초보자'}
                    </div>
                </div>
            </div>

            <!-- 👥 [프로필 중앙 우측 - 캐릭터 상세 메타 정보 배지 패널] -->
            <div style="display: flex; gap: 12px; align-items: center; flex: 1; justify-content: center; margin: 0 20px;">
                <div style="background: var(--builder-input-bg); border: 1px solid var(--builder-border); padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; text-align: center; min-width: 70px;">
                    <div style="color: var(--builder-text-sub); font-size: 9px; font-weight: 800;">길드</div>
                    <div style="color: var(--builder-text-main); font-weight: 900; margin-top: 2px;">${charGuild}</div>
                </div>
                <div style="background: var(--builder-input-bg); border: 1px solid var(--builder-border); padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; text-align: center; min-width: 70px;">
                    <div style="color: var(--builder-text-sub); font-size: 9px; font-weight: 800;">인기도</div>
                    <div style="color: var(--builder-text-main); font-weight: 900; margin-top: 2px;">${charPopularity}</div>
                </div>
                <div style="background: var(--builder-input-bg); border: 1px solid var(--builder-border); padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; text-align: center; min-width: 70px;">
                    <div style="color: var(--builder-text-sub); font-size: 9px; font-weight: 800;">유니온 레벨</div>
                    <div style="color: var(--builder-text-main); font-weight: 900; margin-top: 2px;">${charUnion}</div>
                </div>
                <div style="background: var(--builder-input-bg); border: 1px solid var(--builder-border); padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; text-align: center; min-width: 70px;">
                    <div style="color: var(--builder-text-sub); font-size: 9px; font-weight: 800;">무릉 최고기록</div>
                    <div style="color: var(--builder-text-main); font-weight: 900; margin-top: 2px;">${charDojo}</div>
                </div>
            </div>

            <div style="display: flex; gap: 8px; align-items: center;">
                <button onclick="window.omniSimMemory.initialLoaded = false; window.builderCurrentList = null; window.builderOriginalList = null; window.initOmniBuilderTab();" style="background: var(--builder-input-bg); color: var(--builder-text-accent); border: 1px solid var(--builder-border); padding: 8px 14px; border-radius: 6px; font-size: 11.5px; font-weight: 800; cursor: pointer; transition: all 0.2s;">🔄 API 데이터 동기화 및 초기화 (보스셋 기준)</button>
            </div>
        </div>

        <div class="builder-three-column-grid">
            
            <div style="display: flex; flex-direction: column; gap: 20px; width: 100%;">
                <div class="builder-master-card" style="background: var(--builder-card-bg); border: 1px solid var(--builder-border); border-radius: 10px; padding: 20px;">
                    <div style="font-size: 13px; font-weight: 900; color: var(--builder-text-main); margin-bottom: 14px; display: flex; align-items: center; gap: 6px; border-bottom: 1px solid var(--builder-border); padding-bottom: 8px;">
                        <span>📊 상세 스탯 분석 현황판</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 6px; overflow: hidden;" id="accordion_stats_container">
                        ${window.getBuilderStatRowsHtml()}
                    </div>
                </div>

                <!-- 💡 도핑리스트는 상세 스탯 설정 패널의 수직 하단에 완벽히 배치됩니다 -->
                <div class="builder-master-card" style="background: var(--builder-card-bg); border: 1px solid var(--builder-border); border-radius: 10px; padding: 20px;">
                    <div style="font-size: 12.5px; font-weight: 900; color: var(--builder-text-accent); margin-bottom: 14px; display: flex; align-items: center; gap: 4px;">
                        <span>🧪 버프 도핑 시뮬레이팅 활성화</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${window.getDopingSelectorIconsHtml()}
                    </div>
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 20px; width: 100%;">
                <div class="builder-master-card" style="text-align: center; background: var(--builder-card-bg); border: 1px solid var(--builder-border); border-radius: 10px; padding: 20px;">
                    <div style="font-size: 13px; font-weight: 900; color: var(--builder-text-main); text-align: left; margin-bottom: 14px; display: flex; align-items: center; gap: 6px;">
                        <span>💼 인게임 프리셋 장비 장착 매트릭스 슬롯</span>
                    </div>
                    
                    <div id="builder_inventory_grid" class="builder-inventory-grid-container"></div>

                    <div style="display: inline-flex; background: var(--builder-input-bg); padding: 4px; border-radius: 8px; margin-top: 16px; gap: 4px; border: 1px solid var(--builder-border);">
                        <button onclick="window.switchBuilderPreset(1)" id="btn_preset_1" class="builder-preset-pill ${window.omniSimMemory.activePreset === 1 ? 'active' : ''}">프리셋 1</button>
                        <button onclick="window.switchBuilderPreset(2)" id="btn_preset_2" class="builder-preset-pill ${window.omniSimMemory.activePreset === 2 ? 'active' : ''}">프리셋 2</button>
                        <button onclick="window.switchBuilderPreset(3)" id="btn_preset_3" class="builder-preset-pill ${window.omniSimMemory.activePreset === 3 ? 'active' : ''}">프리셋 3</button>
                    </div>

                    <div style="margin-top: 20px; border-top: 1px solid var(--builder-border); padding-top: 16px; width: 100%; text-align: left;">
                        <div style="font-size: 12px; font-weight: 800; color: var(--builder-text-main); margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                            <span>💾 나만의 커스텀 프리셋 저장 및 불러오기</span>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${[1, 2, 3].map(slot => `
                                <div style="display: flex; align-items: center; justify-content: space-between; background: var(--builder-bg-sub); border: 1px solid var(--builder-border); padding: 8px 12px; border-radius: 8px; box-sizing: border-box;">
                                    <span style="font-size: 11.5px; font-weight: 800; color: var(--builder-text-main);">CUSTOM PRESET SLOT 0${slot}</span>
                                    <div style="display: flex; gap: 6px;">
                                        <button onclick="window.saveCustomPreset(${slot})" style="background: var(--builder-card-bg); color: var(--builder-text-main); border: 1px solid var(--builder-border); padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='var(--builder-accent)'" onmouseout="this.style.borderColor='var(--builder-border)'">💾 저장</button>
                                        <button onclick="window.loadCustomPreset(${slot})" style="background: var(--builder-accent); color: #fff; border: none; padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">📂 로드</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div style="border-top: 1px dashed var(--builder-border-dashed); margin-top: 20px; padding-top: 16px; text-align: left;">
                        <div style="font-size: 12px; font-weight: 900; color: var(--builder-text-accent); letter-spacing: 0.5px; margin-bottom: 12px;">📊 SPEC DIFF REAL-TIME ANALYSIS</div>
                        <div style="display: flex; flex-direction: column; gap: 10px; font-size: 12px; font-weight: 800; color: var(--builder-text-sub);">
                            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                                <span>추정 전투력 변동치</span>
                                <span id="delta_power_text" style="color: var(--builder-text-accent); font-weight: 900; font-family: 'Consolas'; font-size: 13px;">+0</span>
                            </div>
                        </div>
                    </div>

                    <!-- 👑 [세트 효과 패널] 폰트 크기가 전체 밸런스에 맞도록 변수로 바인딩되어 완벽 조절 가능합니다 -->
                    <div style="border-top: 1px dashed var(--builder-border-dashed); margin-top: 12px; padding-top: 12px; text-align: left;">
                        <div class="builder-set-effect-title">👑 활성화 장비 세트 효과</div>
                        <div id="equipped_set_effects_list" style="display: flex; flex-direction: column; gap: 4px; font-size: 11px; font-weight: 800; color: var(--builder-text-sub);">
                        </div>
                    </div>
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 20px; width: 100%;">
                <div class="builder-master-card" id="builder_right_control_card" style="background: var(--builder-card-bg); border: 1px solid var(--builder-border); border-radius: 10px; padding: 20px;">
                    <div id="builder_right_empty_view" style="text-align: center; padding: 120px 0; color: var(--builder-text-sub); font-weight: 700; font-size: 12px; line-height: 1.6;">
                        <div style="font-size: 28px; margin-bottom: 10px;">🖱️</div>
                        인벤토리 장착 보드에서<br>강화 시뮬레이션을 진행할<br>장비 슬롯 파츠를 선택해 주세요.
                    </div>
                    
                    <div id="builder_right_interactive_view" style="display: none; flex-direction: column; gap: 16px;">
                        <div style="font-size: 12.5px; font-weight: 900; color: var(--builder-text-main); border-bottom: 1px solid var(--builder-border); padding-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
                            <span>🛠️ 실시간 파츠 속성 제어 패널</span>
                            <button onclick="window.resetCurrentGearToOriginal()" style="background: var(--builder-input-bg); color: #ef4444; border: 1px solid #ef4444; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; cursor: pointer; transition: all 0.15s;">↩️ 파츠 원본 복구</button>
                        </div>
                        
                        <div style="display: flex; align-items: center; gap: 10px; background: var(--builder-input-bg); padding: 10px; border-radius: 8px; border: 1px solid var(--builder-border);">
                            <div id="control_item_icon_frame" style="width: 36px; height: 36px; background: var(--builder-card-bg); border: 1.5px solid var(--builder-border-dashed); border-radius: 6px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                                <img src="" id="control_item_icon_img" style="max-width: 90%; max-height: 90%; object-fit: contain;">
                            </div>
                            <div style="min-width: 0; flex: 1;">
                                <div id="control_item_name_text" style="font-size: 12px; font-weight: bold; color: var(--builder-text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">-</div>
                                <div id="control_item_slot_text" style="font-size: 10px; color: var(--builder-text-accent); font-weight: 700; margin-top: 1px;">부위: -</div>
                            </div>
                        </div>

                        <div>
                            <div style="font-size: 11px; font-weight: 800; color: var(--builder-text-sub); margin-bottom: 4px;">🔄 대중적 메인 기어 교체 셀렉터 :</div>
                            <select id="builder_item_registry_selector" onchange="window.onBuilderRegistryItemChange(this.value)" style="width: 100%; border: 1px solid var(--builder-border); border-radius: 6px; padding: 8px; font-size: 11.5px; background: var(--builder-input-bg); color: var(--builder-text-main); font-weight: 700; outline: none;">
                            </select>
                        </div>

                        <div style="border: 1px solid var(--builder-border-dashed); background: var(--builder-input-bg); border-radius: 10px; padding: 12px;">
                            <div style="font-size: 11.5px; font-weight: 900; color: var(--builder-text-accent); margin-bottom: 8px; text-align: center; border-bottom: 1px dashed var(--builder-border-dashed); padding-bottom: 4px;">
                                🔎 장비 옵션 세부 분해 브레이크다운
                            </div>
                            <div id="interactive_item_stat_breakdown" style="font-size: 11px; font-weight: 800; color: var(--builder-text-sub); line-height: 1.6; font-family:'Consolas', monospace;">
                            </div>
                        </div>

                        <div style="border: 1px solid var(--builder-border-dashed); background: var(--builder-input-bg); border-radius: 10px; padding: 12px;">
                            <div style="font-size: 11.5px; font-weight: 900; color: var(--builder-text-main); margin-bottom: 8px; display: flex; align-items: center; gap: 4px; justify-content: center;">
                                <span>🔥 추가옵션 (추옵) 인자 정밀 설계 보드</span>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; font-weight: bold; color: var(--builder-text-sub);">
                                <div>STR <input type="number" id="input_add_str" class="builder-mini-input" value="0" oninput="window.runLiveCalculationLoop();" onchange="window.runLiveCalculationLoop();" style="width: 50px; background: var(--builder-card-bg); color: var(--builder-text-main); border: 1px solid var(--builder-border); border-radius: 4px; padding: 2px; text-align:center;"></div>
                                <div>DEX <input type="number" id="input_add_dex" class="builder-mini-input" value="0" oninput="window.runLiveCalculationLoop();" onchange="window.runLiveCalculationLoop();" style="width: 50px; background: var(--builder-card-bg); color: var(--builder-text-main); border: 1px solid var(--builder-border); border-radius: 4px; padding: 2px; text-align:center;"></div>
                                <div>INT <input type="number" id="input_add_int" class="builder-mini-input" value="0" oninput="window.runLiveCalculationLoop();" onchange="window.runLiveCalculationLoop();" style="width: 50px; background: var(--builder-card-bg); color: var(--builder-text-main); border: 1px solid var(--builder-border); border-radius: 4px; padding: 2px; text-align:center;"></div>
                                <div>LUK <input type="number" id="input_add_luk" class="builder-mini-input" value="0" oninput="window.runLiveCalculationLoop();" onchange="window.runLiveCalculationLoop();" style="width: 50px; background: var(--builder-card-bg); color: var(--builder-text-main); border: 1px solid var(--builder-border); border-radius: 4px; padding: 2px; text-align:center;"></div>
                                <div>공격력 <input type="number" id="input_add_atk" class="builder-mini-input" value="0" oninput="window.runLiveCalculationLoop();" onchange="window.runLiveCalculationLoop();" style="width: 50px; background: var(--builder-card-bg); color: var(--builder-text-main); border: 1px solid var(--builder-border); border-radius: 4px; padding: 2px; text-align:center;"></div>
                                <div>마력 <input type="number" id="input_add_matk" class="builder-mini-input" value="0" oninput="window.runLiveCalculationLoop();" onchange="window.runLiveCalculationLoop();" style="width: 50px; background: var(--builder-card-bg); color: var(--builder-text-main); border: 1px solid var(--builder-border); border-radius: 4px; padding: 2px; text-align:center;"></div>
                            </div>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; background: var(--builder-card-bg); border: 1px solid var(--builder-border); padding: 10px; border-radius: 8px;">
                            <span style="font-size: 11.5px; font-weight: 800; color: var(--builder-text-sub);">스타포스 수치 조정:</span>
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <button onclick="window.adjustStarforceStep(-1)" style="width:24px; height:24px; background:var(--builder-input-bg); border:1px solid var(--builder-border); color:var(--builder-text-main); font-weight:bold; cursor:pointer; border-radius:4px;">-</button>
                                <span id="interactive_sf_label" style="font-size: 12px; font-weight: 900; color: var(--builder-text-accent); min-width: 40px; text-align: center; font-family:'Consolas';">0성</span>
                                <button onclick="window.adjustStarforceStep(1)" style="width:24px; height:24px; background:var(--builder-input-bg); border:1px solid var(--builder-border); color:var(--builder-text-main); font-weight:bold; cursor:pointer; border-radius:4px;">+</button>
                            </div>
                        </div>

                        <!-- 🔮 [일반 잠재능력 설정 및 수정 (윗잠)] -->
                        <div id="pot_grade_panel_container" class="potential-grade-card" style="border: 1px solid var(--builder-border-dashed); background: var(--builder-input-bg); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 8px; transition: all 0.25s ease-in-out;">
                            <div style="font-size: 11.5px; font-weight: 900; color: var(--builder-text-accent); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--builder-border-dashed); padding-bottom: 4px;">
                                <span>🔮 잠재능력 설정 및 수정 (윗잠)</span>
                                <select id="input_pot_grade" onchange="window.onPotentialGradeChange(this.value)" style="padding: 2px 4px; font-size: 11px; font-weight: bold; border-radius: 4px; background: var(--builder-card-bg); color: var(--builder-text-main); border: 1px solid var(--builder-border); outline: none;">
                                    <option value="레전드리">레전드리</option>
                                    <option value="유니크">유니크</option>
                                    <option value="에픽">에픽</option>
                                    <option value="레어">레어</option>
                                    <option value="일반">일반</option>
                                </select>
                            </div>
                            <div id="potential_lines_container" style="display: flex; flex-direction: column; gap: 6px;"></div>
                        </div>

                        <!-- 🧬 [에디셔널 잠재능력 설정 (아랫잠)] -->
                        <div id="add_pot_grade_panel_container" class="potential-grade-card" style="border: 1px solid var(--builder-border-dashed); background: var(--builder-input-bg); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 8px; transition: all 0.25s ease-in-out;">
                            <div style="font-size: 11.5px; font-weight: 900; color: var(--builder-text-accent); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--builder-border-dashed); padding-bottom: 4px;">
                                <span>🧬 에디셔널 잠재능력 설정 (아랫잠)</span>
                                <select id="input_add_pot_grade" onchange="window.onAdditionalPotentialGradeChange(this.value)" style="padding: 2px 4px; font-size: 11px; font-weight: bold; border-radius: 4px; background: var(--builder-card-bg); color: var(--builder-text-main); border: 1px solid var(--builder-border); outline: none;">
                                    <option value="레전드리">레전드리</option>
                                    <option value="유니크">유니크</option>
                                    <option value="에픽">에픽</option>
                                    <option value="레어">레어</option>
                                    <option value="일반">일반</option>
                                </select>
                            </div>
                            <div id="additional_potential_lines_container" style="display: flex; flex-direction: column; gap: 6px;"></div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    `;

    window.renderBuilderInventoryGrid();
    window.runLiveCalculationLoop();
};

// ============================================================================
// 📊 [PART 5] 상세스텟 전체 동적 로드 컴파일러
// ============================================================================
window.getBuilderStatRowsHtml = function() {
    const searchContext = window.currentSearchData;
    if (!searchContext || !searchContext.stat || !searchContext.stat.final_stat) {
        return '<div style="padding:20px; color:var(--builder-text-sub); font-size:12px; text-align:center;">API 데이터를 불러오는 중입니다...</div>';
    }

    const allStats = searchContext.stat.final_stat;
    const powerStat = allStats.find(s => s.stat_name === "전투력");
    let powerHtml = '';
    if (powerStat) {
        powerHtml = `
            <div style="display: flex; justify-content: space-between; background: var(--builder-input-bg); padding: 10px 12px; font-size: 12.5px; font-weight: 900; color: var(--builder-text-accent); border: 1px solid var(--builder-border); border-radius: 6px; margin-bottom: 8px; align-items: center;">
                <span>🔱 실시간 현재 전투력</span>
                <div>
                    <span id="live_stat_power" style="font-family:'Consolas', monospace; letter-spacing: 0.2px;">${powerStat.stat_value}</span>
                    <span id="live_stat_power_delta" style="font-family:'Consolas', monospace; font-size: 10px; font-weight: 900; margin-left: 4px;"></span>
                </div>
            </div>
        `;
    }

    const categories = [
        { name: "⚔️ 공격 및 데미지 관련 지표", keywords: ["공격력", "마력", "데미지", "최종", "보스", "방어율", "크리티컬"] },
        { name: "💎 핵심 능력치 스탯 지표", keywords: ["STR", "DEX", "INT", "LUK", "HP", "MP", "스탯공격력"] },
        { name: "🛡️ 컨텐츠 및 기타 부가 지표", keywords: ["스타포스", "아케인포스", "어센틱포스", "내성", "스탠스", "방어력", "이동속도", "점프력"] }
    ];

    let categoriesHtml = '';
    const legacyIdMap = { "보스 몬스터 데미지": "live_stat_boss_dmg", "STR": "live_stat_str", "INT": "live_stat_int", "공격력": "live_stat_atk" };

    categories.forEach((cat) => {
        const matchedItems = allStats.filter(s => {
            if (s.stat_name === "전투력") return false; 
            return cat.keywords.some(kw => s.stat_name.includes(kw));
        });

        if (matchedItems.length === 0) return;

        let rowsHtml = '';
        matchedItems.forEach(s => {
            const safeCleanKey = s.stat_name.replace(/[^a-zA-Z0-9가-힣]/g, '');
            const targetId = legacyIdMap[s.stat_name] || `live_stat_${safeCleanKey}`;
            
            rowsHtml += `
                <div style="display: flex; justify-content: space-between; background: var(--builder-card-bg); padding: 7px 12px; font-size: 11px; font-weight: bold; color: var(--builder-text-sub); border-bottom: 1px solid var(--builder-border); align-items: center;">
                    <span>• ${s.stat_name}</span>
                    <div>
                        <span id="${targetId}" style="font-family:'Consolas', monospace; color: var(--builder-text-main); font-weight: 800;">${s.stat_value}</span>
                        <span id="${targetId}_delta" style="font-family:'Consolas', monospace; font-size: 10px; font-weight: 900; margin-left: 4px;"></span>
                    </div>
                </div>
            `;
        });

        const isDefaultOpen = cat.name.includes("공격 및 데미지");

        categoriesHtml += `
            <div style="margin-bottom: 4px; border: 1px solid var(--builder-border); border-radius: 6px; overflow:hidden;">
                <div onclick="let s = this.nextElementSibling.style; s.display = (s.display === 'none' ? 'block' : 'none');" 
                     style="background: var(--builder-input-bg); padding: 6px 12px; font-size: 11px; font-weight: 900; color: var(--builder-text-main); cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none;">
                    <span>${cat.name}</span>
                    <span style="font-size: 9px; color: var(--builder-text-accent);">▼ 접기/펴기</span>
                </div>
                <div style="display: ${isDefaultOpen ? 'block' : 'none'}; background: var(--builder-card-bg);">
                    ${rowsHtml}
                </div>
            </div>
        `;
    });

    return powerHtml + categoriesHtml;
};

window.getDopingSelectorIconsHtml = function() {
    const categories = [
        { name: "⚔️ 공격력 / 마력 버프", types: ["atk_matk"] },
        { name: "🔥 보스 데미지 비약", types: ["boss_dmg"] },
        { name: "🧪 주스탯 / 영약 버프", types: ["main_stat"] }
    ];

    let html = '';
    categories.forEach((cat) => {
        const filteredDopings = window.omniDopingRegistry.filter(d => d.type === cat.types[0]);
        if (filteredDopings.length === 0) return;

        let itemsHtml = '';
        filteredDopings.forEach(d => {
            itemsHtml += `
                <div style="display: flex; align-items: center; justify-content: space-between; background: var(--builder-card-bg); border: 1px solid var(--builder-border); padding: 6px 12px; border-radius: 8px; gap: 8px; width: 100%; box-sizing: border-box; margin-bottom: 4px;">
                    <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
                        <span style="background: var(--builder-input-bg); padding: 4px; border-radius: 6px; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid var(--builder-border);">
                            <img src="${d.icon}" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.style.display='none'; this.parentNode.innerHTML='🧪';">
                        </span>
                        <div style="min-width: 0;">
                            <div style="font-size: 11px; font-weight: 800; color: var(--builder-text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${d.name}</div>
                            <div style="font-size: 9.5px; color: var(--builder-text-accent); font-weight: 600;">${d.desc}</div>
                        </div>
                    </div>
                    <input type="checkbox" id="dop_check_${d.id}" onchange="window.runLiveCalculationLoop()" style="width: 14px; height: 14px; cursor: pointer;">
                </div>
            `;
        });

        html += `
            <div style="margin-bottom: 6px; border: 1px solid var(--builder-border); border-radius: 6px; overflow:hidden;">
                <div onclick="let s = this.nextElementSibling.style; s.display = (s.display === 'none' ? 'block' : 'none');" 
                     style="background: var(--builder-input-bg); padding: 6px 12px; font-size: 11px; font-weight: 900; color: var(--builder-text-main); cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none;">
                    <span>${cat.name}</span>
                    <span style="font-size: 9px; color: var(--builder-text-accent);">▼ 접기/펴기</span>
                </div>
                <div style="display: none; background: var(--builder-card-bg); padding: 6px;">
                    ${itemsHtml}
                </div>
            </div>
        `;
    });

    return html;
};

// ============================================================================
// 🎒 [PART 6] 인게임 배치 규격슬롯 인벤토리 그리드 렌더러
// ============================================================================
window.renderBuilderInventoryGrid = function() {
    const gridContainer = document.getElementById('builder_inventory_grid');
    if (!gridContainer) return;
    gridContainer.innerHTML = "";

    const avatarBox = document.createElement('div');
    avatarBox.className = "builder-avatar-frame";
    avatarBox.style.overflow = "hidden";
    avatarBox.style.position = "relative";
    avatarBox.style.background = "var(--builder-bg-sub)";

    const rawImgUrl = window.currentSearchData?.basic?.character_image || "";
    if (rawImgUrl) {
        avatarBox.innerHTML = `<img src="${rawImgUrl}" style="width: 100%; height: 100%; object-fit: contain; transform: scale(var(--inventory-avatar-scale)); transform-origin: center center; position: absolute; top: var(--inventory-avatar-top);">`;
    } else {
        avatarBox.innerHTML = `<span style="font-size:32px; color:var(--builder-text-sub);">👦</span>`;
    }
    gridContainer.appendChild(avatarBox);

    const mapLayout = [
        { slot: "반지4", r: 1, c: 1 }, { slot: "반지3", r: 2, c: 1 }, { slot: "반지2", r: 3, c: 1 }, { slot: "반지1", r: 4, c: 1 }, { slot: "펜던트2", r: 5, c: 1 }, { slot: "포켓 아이템", r: 6, c: 1 },
        { slot: "엠블렘", r: 1, c: 2 }, { slot: "뱃지", r: 2, c: 2 }, { slot: "훈장", r: 3, c: 2 }, { slot: "얼굴장식", r: 4, c: 2 }, { slot: "눈장식", r: 5, c: 2 }, { slot: "귀고리", r: 6, c: 2 },
        { slot: "무기", r: 6, c: 3 },
        { slot: "모자", r: 1, c: 4 }, { slot: "상의", r: 2, c: 4 }, { slot: "하의", r: 3, c: 4 }, { slot: "장갑", r: 4, c: 4 }, { slot: "안드로이드", r: 5, c: 4 }, { slot: "어깨장식", r: 6, c: 4 },
        { slot: "망토", r: 1, c: 5 }, { slot: "보조무기", r: 2, c: 5 }, { slot: "신발", r: 3, c: 5 }, { slot: "펜던트", r: 4, c: 5 }, { slot: "기계 심장", r: 5, c: 5 }, { slot: "벨트", r: 6, c: 5 }
    ];

    const tierBorders = { "레전드리": "#22c55e", "유니크": "#f59e0b", "에픽": "#3b82f6", "레어": "#94a3b8" };

    mapLayout.forEach(cell => {
        const itemSlotNode = document.createElement('div');
        itemSlotNode.className = "builder-item-slot-node";
        itemSlotNode.style.gridRow = cell.r;
        itemSlotNode.style.gridColumn = cell.c;
        itemSlotNode.style.background = "var(--builder-input-bg)";
        itemSlotNode.style.border = "1px solid var(--builder-border)";

        if (window.omniSimMemory.selectedSlot === cell.slot) {
            itemSlotNode.style.borderColor = "var(--builder-text-accent)";
            itemSlotNode.style.boxShadow = "0 0 8px rgba(167, 139, 250, 0.4)";
        }

        let matchGear = window.builderCurrentList.find(g => window.isSlotMatching(g.item_equipment_slot, cell.slot));

        if (matchGear && (matchGear.item_icon || matchGear.item_name)) {
            const borderTint = tierBorders[matchGear.potential_option_grade] || "var(--builder-border)";
            itemSlotNode.style.borderColor = borderTint;
            
            // API 데이터(item_icon)를 우선적으로 사용하고, 실패 시 로컬 경로 폴더 이미지를 시도합니다.
            const apiPath = matchGear.item_icon;
            const localPath = window.getEquipmentImagePath(cell.slot, matchGear.item_name);
            
            itemSlotNode.innerHTML = `<img src="${apiPath || localPath}" style="max-width:85%; max-height:85%; object-fit:contain;" onerror="this.src='${localPath}'; this.onerror=function(){ this.style.display='none'; this.parentNode.innerHTML='<span style=\\'font-size:9px;color:var(--builder-text-sub);\\'>⚔️</span>'; };">`;
        } else {
            const labelText = cell.slot.length > 3 ? cell.slot.substring(0, 2) : cell.slot;
            itemSlotNode.innerHTML = `<span style="font-size:8.5px; color: var(--builder-text-sub); font-weight:800;">${labelText}</span>`;
        }

        itemSlotNode.onclick = () => window.loadBuilderSlotControlPanel(cell.slot, matchGear);
        gridContainer.appendChild(itemSlotNode);
    });
};

// ============================================================================
// 🛠️ [PART 7] 제어 패널 유저 오리지널 수식 주입 및 잠재능력 선택창 파트
// ============================================================================
window.loadBuilderSlotControlPanel = function(slotName, itemObj) {
    window.omniSimMemory.selectedSlot = slotName;
    
    const cleanItemObj = itemObj ? JSON.parse(JSON.stringify(itemObj)) : {
        item_name: `순수 기본형 ${slotName}`, item_equipment_slot: slotName, starforce: 0,
        item_base_option: { str: 10, dex: 10, int: 10, luk: 10, attack_power: 5, magic_power: 5 },
        item_add_option: { str: 0, dex: 0, int: 0, luk: 0, attack_power: 0, magic_power: 0 },
        potential_option_grade: "일반",
        potential_option_1: "옵션없음", potential_option_2: "옵션없음", potential_option_3: "옵션없음",
        additional_potential_option_grade: "일반",
        additional_potential_option_1: "옵션없음", additional_potential_option_2: "옵션없음", additional_potential_option_3: "옵션없음"
    };

    window.omniSimMemory.selectedItem = cleanItemObj;
    const targetItem = window.omniSimMemory.selectedItem;

    window.omniSimMemory.customStats.starforce = parseInt(targetItem.starforce || 0);

    document.getElementById('builder_right_empty_view').style.display = 'none';
    document.getElementById('builder_right_interactive_view').style.display = 'flex';

    document.getElementById('control_item_name_text').innerText = targetItem.item_name;
    document.getElementById('control_item_slot_text').innerText = `부위: ${slotName}`;
    document.getElementById('interactive_sf_label').innerText = `${window.omniSimMemory.customStats.starforce}성`;

    const iconImg = document.getElementById('control_item_icon_img');
    // API 데이터 우선 참조
    const itemPath = targetItem.item_icon || window.getEquipmentImagePath(slotName, targetItem.item_name);
    
    if (itemPath) {
        iconImg.src = itemPath;
        iconImg.style.display = 'block';
        iconImg.onerror = function() {
            this.src = window.getEquipmentImagePath(slotName, targetItem.item_name);
            this.onerror = function() { this.style.display = 'none'; };
        };
    } else {
        iconImg.style.display = 'none';
    }

    const registrySelector = document.getElementById('builder_item_registry_selector');
    registrySelector.innerHTML = `<option value="DEFAULT_PRO">--- 장비 명칭 변경 교체 ---</option>`;
    
    const availableGears = window.getGearForSlot(slotName);
    availableGears.forEach(g => {
        registrySelector.innerHTML += `<option value="${g.name}">${g.name}</option>`;
    });

    document.getElementById('input_add_str').value = targetItem.item_add_option?.str || 0;
    document.getElementById('input_add_dex').value = targetItem.item_add_option?.dex || 0;
    document.getElementById('input_add_int').value = targetItem.item_add_option?.int || 0;
    document.getElementById('input_add_luk').value = targetItem.item_add_option?.luk || 0;
    document.getElementById('input_add_atk').value = targetItem.item_add_option?.attack_power || targetItem.item_add_option?.atk || 0;
    document.getElementById('input_add_matk').value = targetItem.item_add_option?.magic_power || targetItem.item_add_option?.matk || 0;

    const gradeSelect = document.getElementById('input_pot_grade');
    if (gradeSelect) gradeSelect.value = targetItem.potential_option_grade || "일반";

    const addGradeSelect = document.getElementById('input_add_pot_grade');
    if (addGradeSelect) addGradeSelect.value = targetItem.additional_potential_option_grade || "일반";

    window.syncPotentialInputsHTML();
    window.syncAdditionalPotentialInputsHTML(); 
    window.syncPotentialGradeCSSClasses();

    window.renderBuilderInventoryGrid();
    window.runLiveCalculationLoop(); 
};

window.resetCurrentGearToOriginal = function() {
    const memory = window.omniSimMemory;
    if (!memory.selectedSlot || !window.builderOriginalList) return;
    
    const originalGear = window.builderOriginalList.find(g => window.isSlotMatching(g.item_equipment_slot, memory.selectedSlot));
    let listIndex = window.builderCurrentList.findIndex(g => window.isSlotMatching(g.item_equipment_slot, memory.selectedSlot));
    
    if (originalGear) {
        if (listIndex !== -1) {
            window.builderCurrentList[listIndex] = JSON.parse(JSON.stringify(originalGear));
            window.loadBuilderSlotControlPanel(memory.selectedSlot, window.builderCurrentList[listIndex]);
        }
    } else {
        if (listIndex !== -1) {
            window.builderCurrentList.splice(listIndex, 1);
            window.loadBuilderSlotControlPanel(memory.selectedSlot, null);
        }
    }
    alert(`✨ [${memory.selectedSlot}] 장비 파츠가 원래 스펙 상태로 복구되었습니다.`);
};

// ============================================================================
// 🔮 [일반 & 에디셔널 문자열 고정 정밀 분리 브릿지 파서 유틸리티]
// 설명: 아이템 데이터를 연동할 때 기존 장비들의 수치를 역추적 파싱하여 타입과 수치로 완벽 분배합니다.
// ============================================================================
window.parsePotentialString = function(optStr) {
    if (!optStr || optStr === "옵션없음") return { type: "옵션없음", value: 0 };
    const statLabel = window.getJobStatLabel();
    
    let cleanStr = optStr.replace("직업별 스텟", statLabel).replace("주스탯", statLabel);
    const isPercent = cleanStr.includes("%");
    
    const numMatch = cleanStr.match(/\+(\d+)/);
    const value = numMatch ? parseInt(numMatch[1]) : 0;
    
    let typeKey = "옵션없음";
    if (cleanStr.includes("올스탯")) typeKey = "올스탯 %";
    else if (cleanStr.includes("크리티컬 데미지")) typeKey = "크리티컬 데미지 %";
    else if (cleanStr.includes("보스 몬스터 데미지")) typeKey = "보스 몬스터 데미지 %";
    else if (cleanStr.includes("최종 데미지")) typeKey = "최종 데미지 %";
    else if (cleanStr.includes("데미지")) typeKey = "데미지 %";
    else if (cleanStr.includes("아이템 드롭률")) typeKey = "아이템 드롭률 %";
    else if (cleanStr.includes("메소 획득량")) typeKey = "메소 획득량 %";
    else if (cleanStr.includes("공격력")) typeKey = isPercent ? "공격력 %" : "공격력";
    else if (cleanStr.includes("마력")) typeKey = isPercent ? "마력 %" : "마력";
    else if (cleanStr.includes("STR")) typeKey = isPercent ? "STR %" : "STR";
    else if (cleanStr.includes("DEX")) typeKey = isPercent ? "DEX %" : "DEX";
    else if (cleanStr.includes("INT")) typeKey = isPercent ? "INT %" : "INT";
    else if (cleanStr.includes("LUK")) typeKey = isPercent ? "LUK %" : "LUK";
    
    return { type: typeKey, value: value };
};

window.buildPotentialString = function(type, value) {
    if (type === "옵션없음" || !type) return "옵션없음";
    
    if (type.endsWith(" %")) {
        const baseName = type.replace(" %", "");
        return `${baseName} +${value}%`;
    } else {
        return `${type} +${value}`;
    }
};

// 💡 [초보자 가이드 - 등급 카드 클래스 자동 싱크]
// 윗잠 및 아랫잠의 테두리 컬러 스타일링을 위해 등급에 어울리는 CSS 클래스를 실시간 강제 적용시킵니다.
window.syncPotentialGradeCSSClasses = function() {
    const targetItem = window.omniSimMemory.selectedItem;
    if (!targetItem) return;

    const potContainer = document.getElementById('pot_grade_panel_container');
    const addPotContainer = document.getElementById('add_pot_grade_panel_container');

    const gradeClassMap = {
        "레전드리": "grade-legendary",
        "유니크": "grade-unique",
        "에픽": "grade-epic",
        "레어": "grade-rare",
        "일반": "grade-normal"
    };

    if (potContainer) {
        potContainer.className = "potential-grade-card " + (gradeClassMap[targetItem.potential_option_grade] || "grade-normal");
    }
    if (addPotContainer) {
        addPotContainer.className = "potential-grade-card " + (gradeClassMap[targetItem.additional_potential_option_grade] || "grade-normal");
    }
};

// 💡 [초보자 가이드 - 윗잠 스탯 매핑 최적화]
// 윗잠에도 [종류 선택 Select 박스] + [정수 숫자 입력 칸] 구조를 대입하여 컴팩트하고 유연하게 조율이 가능하도록 했습니다.
window.syncPotentialInputsHTML = function() {
    const pContainer = document.getElementById('potential_lines_container');
    if (!pContainer || !window.omniSimMemory.selectedItem) return;

    const targetItem = window.omniSimMemory.selectedItem;
    let html = '';
    
    const pool = [
        "옵션없음", 
        "STR %", "DEX %", "INT %", "LUK %", "올스탯 %", 
        "공격력 %", "마력 %", "보스 몬스터 데미지 %", "최종 데미지 %", "크리티컬 데미지 %", 
        "아이템 드롭률 %", "메소 획득량 %",
        "STR", "DEX", "INT", "LUK", "공격력", "마력"
    ];
    
    for (let i = 1; i <= 3; i++) {
        const currentOption = targetItem[`potential_option_${i}`] || "옵션없음";
        const parsed = window.parsePotentialString(currentOption);
        
        if (!pool.includes(parsed.type) && parsed.type !== "옵션없음") {
            pool.push(parsed.type);
        }

        html += `
            <div style="display: flex; gap: 6px; align-items: center; justify-content: space-between; margin-bottom: 4px; width: 100%;">
                <span style="font-size: 11px; font-weight: 800; min-width: 52px; color: var(--builder-text-sub);">${i}줄옵션:</span>
                <select id="pot_type_${i}" onchange="window.updatePotentialLine(${i})" style="flex: 2; border: 1px solid var(--builder-border-dashed); border-radius: 6px; padding: 5px; font-size: 11px; background: var(--builder-card-bg); color: var(--builder-text-main); font-weight: 700; outline: none;">
                    ${pool.map(opt => `<option value="${opt}" ${parsed.type === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                </select>
                <input type="number" id="pot_val_${i}" value="${parsed.value}" oninput="window.updatePotentialLine(${i})" style="width: 55px; border: 1px solid var(--builder-border-dashed); border-radius: 6px; padding: 4px; font-size: 11px; text-align: center; background: var(--builder-card-bg); color: var(--builder-text-main); font-weight: 700; outline: none; box-sizing: border-box;">
            </div>
        `;
    }
    pContainer.innerHTML = html;
};

window.updatePotentialLine = function(lineIndex) {
    const typeEl = document.getElementById(`pot_type_${lineIndex}`);
    const valEl = document.getElementById(`pot_val_${lineIndex}`);
    if (!typeEl || !valEl || !window.omniSimMemory.selectedItem) return;
    
    let type = typeEl.value;
    let value = parseInt(valEl.value) || 0;
    
    if (type.includes('%') && value > 13) {
        value = 13;
        valEl.value = 13;
    }
    
    const optionString = window.buildPotentialString(type, value);
    
    window.omniSimMemory.selectedItem[`potential_option_${lineIndex}`] = optionString;
    
    let listIndex = window.builderCurrentList.findIndex(g => window.isSlotMatching(g.item_equipment_slot, window.omniSimMemory.selectedSlot));
    if (listIndex !== -1) {
        window.builderCurrentList[listIndex][`potential_option_${lineIndex}`] = optionString;
    }
    window.runLiveCalculationLoop();
};

window.syncAdditionalPotentialInputsHTML = function() {
    const apContainer = document.getElementById('additional_potential_lines_container');
    if (!apContainer || !window.omniSimMemory.selectedItem) return;

    const targetItem = window.omniSimMemory.selectedItem;
    let html = '';
    
    const pool = [
        "옵션없음", 
        "STR %", "DEX %", "INT %", "LUK %", "올스탯 %", 
        "공격력 %", "마력 %", "보스 몬스터 데미지 %", "최종 데미지 %", "크리티컬 데미지 %", 
        "아이템 드롭률 %", "메소 획득량 %",
        "STR", "DEX", "INT", "LUK", "공격력", "마력"
    ];
    
    for (let i = 1; i <= 3; i++) {
        const currentOption = targetItem[`additional_potential_option_${i}`] || "옵션없음";
        const parsed = window.parsePotentialString(currentOption);
        
        if (!pool.includes(parsed.type) && parsed.type !== "옵션없음") {
            pool.push(parsed.type);
        }

        html += `
            <div style="display: flex; gap: 6px; align-items: center; justify-content: space-between; margin-bottom: 4px; width: 100%;">
                <span style="font-size: 11px; font-weight: 800; min-width: 52px; color: var(--builder-text-sub);">${i}줄에디:</span>
                <select id="add_pot_type_${i}" onchange="window.updateAdditionalPotentialLine(${i})" style="flex: 2; border: 1px solid var(--builder-border-dashed); border-radius: 6px; padding: 5px; font-size: 11px; background: var(--builder-card-bg); color: var(--builder-text-main); font-weight: 700; outline: none;">
                    ${pool.map(opt => `<option value="${opt}" ${parsed.type === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                </select>
                <input type="number" id="add_pot_val_${i}" value="${parsed.value}" oninput="window.updateAdditionalPotentialLine(${i})" style="width: 55px; border: 1px solid var(--builder-border-dashed); border-radius: 6px; padding: 4px; font-size: 11px; text-align: center; background: var(--builder-card-bg); color: var(--builder-text-main); font-weight: 700; outline: none; box-sizing: border-box;">
            </div>
        `;
    }
    apContainer.innerHTML = html;
};

window.updateAdditionalPotentialLine = function(lineIndex) {
    const typeEl = document.getElementById(`add_pot_type_${lineIndex}`);
    const valEl = document.getElementById(`add_pot_val_${lineIndex}`);
    if (!typeEl || !valEl || !window.omniSimMemory.selectedItem) return;
    
    let type = typeEl.value;
    let value = parseInt(valEl.value) || 0;

    if (type.includes('%') && value > 13) {
        value = 13;
        valEl.value = 13;
    }

    const optionString = window.buildPotentialString(type, value); 
    
    window.omniSimMemory.selectedItem[`additional_potential_option_${lineIndex}`] = optionString;
    
    let listIndex = window.builderCurrentList.findIndex(g => window.isSlotMatching(g.item_equipment_slot, window.omniSimMemory.selectedSlot));
    if (listIndex !== -1) {
        window.builderCurrentList[listIndex][`additional_potential_option_${lineIndex}`] = optionString;
    }
    window.runLiveCalculationLoop();
};

window.onPotentialLineChange = function(lineIndex, optionValue) {
    const memory = window.omniSimMemory;
    if (!memory.selectedItem) return;

    memory.selectedItem[`potential_option_${lineIndex}`] = optionValue;
    let listIndex = window.builderCurrentList.findIndex(g => window.isSlotMatching(g.item_equipment_slot, memory.selectedSlot));
    if (listIndex !== -1) {
        window.builderCurrentList[listIndex][`potential_option_${lineIndex}`] = optionValue;
    }
    window.runLiveCalculationLoop();
};

window.onPotentialGradeChange = function(gradeValue) {
    const memory = window.omniSimMemory;
    if (!memory.selectedItem) return;
    
    memory.selectedItem.potential_option_grade = gradeValue;
    let listIndex = window.builderCurrentList.findIndex(g => window.isSlotMatching(g.item_equipment_slot, memory.selectedSlot));
    if (listIndex !== -1) {
        window.builderCurrentList[listIndex].potential_option_grade = gradeValue;
    }
    window.syncPotentialGradeCSSClasses();
    window.renderBuilderInventoryGrid();
    window.runLiveCalculationLoop();
};

window.onAdditionalPotentialGradeChange = function(gradeValue) {
    const memory = window.omniSimMemory;
    if (!memory.selectedItem) return;
    
    memory.selectedItem.additional_potential_option_grade = gradeValue;
    let listIndex = window.builderCurrentList.findIndex(g => window.isSlotMatching(g.item_equipment_slot, memory.selectedSlot));
    if (listIndex !== -1) {
        window.builderCurrentList[listIndex].additional_potential_option_grade = gradeValue;
    }
    window.syncPotentialGradeCSSClasses();
    window.renderBuilderInventoryGrid();
    window.runLiveCalculationLoop();
};

window.onBuilderRegistryItemChange = function(itemName) {
    const memory = window.omniSimMemory;
    if (!memory.selectedSlot || itemName === "DEFAULT_PRO") return;

    let listIndex = window.builderCurrentList.findIndex(g => window.isSlotMatching(g.item_equipment_slot, memory.selectedSlot));
    const iconPath = window.getEquipmentImagePath(memory.selectedSlot, itemName);
    
    const replacementItem = {
        item_name: itemName,
        item_equipment_slot: memory.selectedSlot,
        starforce: 0,
        potential_option_grade: "일반",
        additional_potential_option_grade: "일반",
        item_icon: iconPath,
        item_base_option: { str: 10, dex: 10, int: 10, luk: 10, attack_power: 5, magic_power: 5 },
        item_add_option: { str: 0, dex: 0, int: 0, luk: 0, attack_power: 0, magic_power: 0 },
        potential_option_1: "옵션없음", potential_option_2: "옵션없음", potential_option_3: "옵션없음",
        additional_potential_option_1: "옵션없음", additional_potential_option_2: "옵션없음", additional_potential_option_3: "옵션없음"
    };

    memory.selectedItem = replacementItem;
    if (listIndex !== -1) {
        window.builderCurrentList[listIndex] = replacementItem;
    } else {
        window.builderCurrentList.push(replacementItem);
    }

    memory.customStats.starforce = 0;
    document.getElementById('control_item_name_text').innerText = memory.selectedItem.item_name;
    document.getElementById('interactive_sf_label').innerText = `0성`;
    
    const iconImg = document.getElementById('control_item_icon_img');
    if (iconPath) {
        iconImg.src = iconPath;
        iconImg.style.display = 'block';
    } else {
        iconImg.style.display = 'none';
    }

    window.syncPotentialInputsHTML();
    window.syncAdditionalPotentialInputsHTML();
    window.syncPotentialGradeCSSClasses();
    window.renderBuilderInventoryGrid();
    window.runLiveCalculationLoop();
};

window.adjustStarforceStep = function(offset) {
    const stats = window.omniSimMemory.customStats;
    let nextSf = stats.starforce + offset;
    if (nextSf < 0) nextSf = 0;
    if (nextSf > 25) nextSf = 25;
    stats.starforce = nextSf;
    document.getElementById('interactive_sf_label').innerText = `${nextSf}성`;
    
    if (window.omniSimMemory.selectedItem) {
        window.omniSimMemory.selectedItem.starforce = nextSf;
        let listIndex = window.builderCurrentList.findIndex(g => window.isSlotMatching(g.item_equipment_slot, window.omniSimMemory.selectedSlot));
        if (listIndex !== -1) {
            window.builderCurrentList[listIndex].starforce = nextSf;
        }
    }
    window.runLiveCalculationLoop();
};

window.saveCustomPreset = function(slotNumber) {
    if (!window.builderCurrentList || window.builderCurrentList.length === 0) {
        alert("저장할 장비 세팅 데이터가 존재하지 않습니다.");
        return;
    }
    const charName = window.currentSearchData?.basic?.character_name || "default";
    const saveKey = `omni_custom_preset_${charName}_slot_${slotNumber}`;
    localStorage.setItem(saveKey, JSON.stringify(window.builderCurrentList));
    alert(`💾 [커스텀 프리셋 슬롯 ${slotNumber}] 현재 설계하신 장비 강화 세팅이 안전하게 저장되었습니다.`);
};

window.loadCustomPreset = function(slotNumber) {
    const charName = window.currentSearchData?.basic?.character_name || "default";
    const saveKey = `omni_custom_preset_${charName}_slot_${slotNumber}`;
    const rawData = localStorage.getItem(saveKey);
    if (!rawData) {
        alert(`⚠️ [슬롯 ${slotNumber}] 저장된 내역이 없습니다. 장비를 커스텀 조율한 후 저장을 먼저 실행하세요.`);
        return;
    }
    try {
        window.builderCurrentList = JSON.parse(rawData);
        
        window.renderBuilderInventoryGrid();
        window.runLiveCalculationLoop();
        
        window.omniSimMemory.selectedSlot = null;
        window.omniSimMemory.selectedItem = null;
        document.getElementById('builder_right_empty_view').style.display = 'block';
        document.getElementById('builder_right_interactive_view').style.display = 'none';
        
        alert(`📂 [커스텀 프리셋 슬롯 ${slotNumber}] 나만의 장비 커스텀 빌드를 성공적으로 빌드 보드에 대입했습니다.`);
    } catch (e) {
        console.error("[CUSTOM PRESET LOAD CRITICAL ERROR]:", e);
        alert("장비 세팅을 분석하여 역대입하는 과정에서 치명적인 에러가 발생했습니다.");
    }
};

window.calculateEquippedSetEffects = function() {
    const list = window.builderCurrentList || [];
    const counts = { pitched: 0, dawn: 0, bossAcc: 0, eternal: 0, arcane: 0, absolab: 0, rootAbyss: 0, meister: 0 };

    const pitchedItems = ["루즈 컨트롤 머신 마크", "마력 깃든 안대", "몽환의 벨트", "고통의 근원", "거대한 공포", "커맨더 포스 이어링", "창세의 뱃지", "미트라의 분노", "파멸의 마도서"];
    const dawnItems = ["데이브레이크 펜던트", "에스텔라 이어링", "트와일라이트 마크", "가디언 엔젤 링"];
    const bossAccItems = ["지옥의 불꽃", "데아 시두스 이어링", "실버블라썸 링", "고귀한 이피아의 링", "아쿠아틱 레터 눈장식", "응축된 힘의 결정석", "골든 클로버 벨트", "분노한 자쿰의 벨트", "핑크빛 성배", "매커네이터 펜던트", "도미네이터 펜던트"];

    list.forEach(item => {
        if (!item || !item.item_name) return;
        const name = item.item_name;
        if (pitchedItems.some(pi => name.includes(pi))) counts.pitched++;
        else if (dawnItems.some(di => name.includes(di))) counts.dawn++;
        else if (bossAccItems.some(bi => name.includes(bi))) counts.bossAcc++;
        else if (name.includes("에테르넬")) counts.eternal++;
        else if (name.includes("아케인셰이드")) counts.arcane++;
        else if (name.includes("앱솔랩스")) counts.absolab++;
        else if (name.includes("하이네스") || name.includes("이글아이") || name.includes("트릭스터") || name.includes("파프니르")) counts.rootAbyss++;
        else if (name.includes("마이스터")) counts.meister++;
    });

    const activeSets = [];
    if (counts.pitched > 0) activeSets.push({ name: "칠흑의 보스 세트", count: counts.pitched });
    if (counts.dawn > 0) activeSets.push({ name: "여명의 보스 세트", count: counts.dawn });
    if (counts.bossAcc > 0) activeSets.push({ name: "보스 장신구 세트", count: counts.bossAcc });
    if (counts.eternal > 0) activeSets.push({ name: "에테르넬 세트", count: counts.eternal });
    if (counts.arcane > 0) activeSets.push({ name: "아케인셰이드 세트", count: counts.arcane });
    if (counts.absolab > 0) activeSets.push({ name: "앱솔랩스 세트", count: counts.absolab });
    if (counts.rootAbyss > 0) activeSets.push({ name: "루타비스 세트", count: counts.rootAbyss });
    if (counts.meister > 0) activeSets.push({ name: "마이스터 세트", count: counts.meister });

    return activeSets;
};

// 💡 [초보자 가이드] 장착중인 구체적인 부위 이름들을 추출하여 사용자에게 보여주는 함수입니다.
window.getEquippedPartsNames = function(setName) {
    const list = window.builderCurrentList || [];
    const matchedNames = [];

    const pitchedItems = ["루즈 컨트롤 머신 마크", "마력 깃든 안대", "몽환의 벨트", "고통의 근원", "거대한 공포", "커맨더 포스 이어링", "창세의 뱃지", "미트라의 분노", "파멸의 마도서"];
    const dawnItems = ["데이브레이크 펜던트", "에스텔라 이어링", "트와일라이트 마크", "가디언 엔젤 링"];
    const bossAccItems = ["지옥의 불꽃", "데아 시두스 이어링", "실버블라썸 링", "고귀한 이피아의 링", "아쿠아틱 레터 눈장식", "응축된 힘의 결정석", "골든 클로버 벨트", "분노한 자쿰의 벨트", "핑크빛 성배", "매커네이터 펜던트", "도미네이터 펜던트"];

    list.forEach(item => {
        if (!item || !item.item_name) return;
        const name = item.item_name;
        if (setName.includes("칠흑") && pitchedItems.some(pi => name.includes(pi))) matchedNames.push(name);
        else if (setName.includes("여명") && dawnItems.some(di => name.includes(di))) matchedNames.push(name);
        else if (setName.includes("보스 장신구") && bossAccItems.some(bi => name.includes(bi))) matchedNames.push(name);
        else if (setName.includes("에테르넬") && name.includes("에테르넬")) matchedNames.push(name);
        else if (setName.includes("아케인") && name.includes("아케인셰이드")) matchedNames.push(name);
        else if (setName.includes("앱솔랩스") && name.includes("앱솔랩스")) matchedNames.push(name);
        else if (setName.includes("루타비스") && (name.includes("하이네스") || name.includes("이글아이") || name.includes("트릭스터") || name.includes("파프니르"))) matchedNames.push(name);
        else if (setName.includes("마이스터") && name.includes("마이스터")) matchedNames.push(name);
    });

    return matchedNames.length > 0 ? matchedNames.join(', ') : '없음';
};

// 💡 [초보자 가이드 - 세트 효과 정밀 디테일 맵핑 함수]
// 활성화된 세트 이름과 장착 수량에 따라 적용 중인 실제 혜택 정보를 매우 상세하게 문자열로 변환합니다.
window.getDetailedSetEffectDescription = function(setName, count) {
    let stats = [];
    if (setName.includes("칠흑")) {
        if (count >= 2) stats.push("올스탯 +10, MaxHP +250, 공/마 +10, 방무 +10%");
        if (count >= 3) stats.push("올스탯 +10, MaxHP +250, 공/마 +10, 방무 +10%, 보공 +10%");
        if (count >= 4) stats.push("올스탯 +15, MaxHP +375, 공/마 +15, 방무 +10%, 크데 +5%");
        if (count >= 5) stats.push("올스탯 +15, MaxHP +375, 공/마 +15, 보공 +10%");
        if (count >= 6) stats.push("올스탯 +15, MaxHP +375, 공/마 +15, 방무 +10%, 보공 +10%");
        if (count >= 7) stats.push("올스탯 +15, MaxHP +375, 공/마 +15, 크데 +5%");
        if (count >= 8) stats.push("올스탯 +15, MaxHP +375, 공/마 +15, 보공 +10%");
        if (count >= 9) stats.push("올스탯 +15, MaxHP +375, 공/마 +15, 보공 +10%");
    } else if (setName.includes("여명")) {
        if (count >= 2) stats.push("올스탯 +10, MaxHP +250, 공/마 +10, 보공 +10%");
        if (count >= 3) stats.push("올스탯 +10, MaxHP +250, 공/마 +10, 방무 +10%");
        if (count >= 4) stats.push("올스탯 +20, MaxHP +500, 공/마 +20, 보공 +10%");
    } else if (setName.includes("보스 장신구")) {
        if (count >= 3) stats.push("올스탯 +10, MaxHP/MP +5%, 공/마 +5");
        if (count >= 5) stats.push("올스탯 +10, MaxHP/MP +5%, 공/마 +5");
        if (count >= 7) stats.push("올스탯 +10, 공/마 +10, 방무 +10%");
        if (count >= 9) stats.push("올스탯 +15, 공/마 +10, 보공 +10%");
    } else if (setName.includes("에테르넬")) {
        if (count >= 2) stats.push("올스탯 +40, 공/마 +40, 방무 +10%");
        if (count >= 3) stats.push("올스탯 +50, 공/마 +50, 보공 +30%");
        if (count >= 4) stats.push("올스탯 +60, 공/마 +60, 방무 +10%");
    } else if (setName.includes("아케인셰이드")) {
        if (count >= 2) stats.push("MaxHP/MP +2000, 공/마 +30");
        if (count >= 3) stats.push("올스탯 +50, 공/마 +35");
        if (count >= 4) stats.push("공/마 +40, 방무 +10%, 보공 +30%");
        if (count >= 5) stats.push("올스탯 +30, 공/마 +30");
    } else if (setName.includes("앱솔랩스")) {
        if (count >= 2) stats.push("MaxHP/MP +1500, 공/마 +20");
        if (count >= 3) stats.push("올스탯 +30, 공/마 +25, 방무 +10%");
        if (count >= 4) stats.push("공/마 +30, 보공 +30%");
        if (count >= 5) stats.push("올스탯 +20, 공/마 +20");
    } else if (setName.includes("루타비스")) {
        if (count >= 2) stats.push("올스탯 +20, MaxHP/MP +1000");
        if (count >= 3) stats.push("공/마 +50");
        if (count >= 4) stats.push("보공 +30%");
    }
    return stats.length > 0 ? stats[stats.length - 1] : "기본 세트 속성 정보 없음";
};

// ============================================================================
// 🧮 [PART 10] 메이플스토리 공식 곱연산 보정 전투력 산출 계산 루프
// ============================================================================
window.runLiveCalculationLoop = function() {
    const memory = window.omniSimMemory;
    if (!window.currentSearchData) {
        console.warn("[OMNI BUILDER] 계산 엔진: 검색 데이터가 로드되지 않아 계산을 중단합니다.");
        return;
    }

    let dopingStatBonus = 0; let dopingAtkBonus = 0; let dopingBossDmgBonus = 0;
    window.omniDopingRegistry.forEach(d => {
        const chk = document.getElementById(`dop_check_${d.id}`);
        if (chk && chk.checked) {
            if (d.type === "main_stat") dopingStatBonus += d.value;
            else if (d.type === "atk_matk") dopingAtkBonus += d.value;
            else if (d.type === "boss_dmg") dopingBossDmgBonus += d.value;
        }
    });

    // 💡 [추옵 변경 즉시 전투력 반영 및 메모리 연동 완치]
    // 사용자가 입력한 추가옵션 수치들을 실시간 감지하여 메모리와 라이브 목록에 완벽하게 박아 넣습니다.
    if (memory.selectedSlot && memory.selectedItem) {
        if (!memory.selectedItem.item_add_option) memory.selectedItem.item_add_option = {};
        
        const addStrEl = document.getElementById('input_add_str');
        const addDexEl = document.getElementById('input_add_dex');
        const addIntEl = document.getElementById('input_add_int');
        const addLukEl = document.getElementById('input_add_luk');
        const addAtkEl = document.getElementById('input_add_atk');
        const addMatkEl = document.getElementById('input_add_matk');

        memory.selectedItem.item_add_option.str = addStrEl ? (parseInt(addStrEl.value) || 0) : 0;
        memory.selectedItem.item_add_option.dex = addDexEl ? (parseInt(addDexEl.value) || 0) : 0; 
        memory.selectedItem.item_add_option.int = addIntEl ? (parseInt(addIntEl.value) || 0) : 0;
        memory.selectedItem.item_add_option.luk = addLukEl ? (parseInt(addLukEl.value) || 0) : 0;
        memory.selectedItem.item_add_option.attack_power = addAtkEl ? (parseInt(addAtkEl.value) || 0) : 0;
        memory.selectedItem.item_add_option.magic_power = addMatkEl ? (parseInt(addMatkEl.value) || 0) : 0;
        memory.selectedItem.starforce = memory.customStats.starforce;
        
        if (!memory.selectedItem.item_starforce_option) memory.selectedItem.item_starforce_option = {};
        memory.selectedItem.item_starforce_option.str = memory.customStats.starforce * 2.5;
        memory.selectedItem.item_starforce_option.dex = memory.customStats.starforce * 2.5;
        memory.selectedItem.item_starforce_option.int = memory.customStats.starforce * 2.5;
        memory.selectedItem.item_starforce_option.luk = memory.customStats.starforce * 2.5;
        memory.selectedItem.item_starforce_option.attack_power = memory.customStats.starforce * 2;
        memory.selectedItem.item_starforce_option.magic_power = memory.customStats.starforce * 2;

        let listIndex = window.builderCurrentList.findIndex(g => window.isSlotMatching(g.item_equipment_slot, memory.selectedSlot));
        if (listIndex !== -1) {
            window.builderCurrentList[listIndex] = JSON.parse(JSON.stringify(memory.selectedItem));
        } else {
            window.builderCurrentList.push(JSON.parse(JSON.stringify(memory.selectedItem)));
        }

        const item = window.builderCurrentList[listIndex] || memory.selectedItem;
        const schema = [
            { key: 'str', name: 'STR' }, { key: 'dex', name: 'DEX' },
            { key: 'int', name: 'INT' }, { key: 'luk', name: 'LUK' },
            { key: 'attack_power', name: '공격력' }, { key: 'magic_power', name: '마력' }
        ];

        let statHtml = '';
        schema.forEach(s => {
            const b = Number(item.item_base_option?.[s.key]) || 0;
            const star = Number(item.item_starforce_option?.[s.key]) || 0;
            const add = Number(item.item_add_option?.[s.key]) || 0;
            const etc = Number(item.item_etc_option?.[s.key]) || 0;
            const total = b + star + add + etc;

            if (total > 0) {
                let detail = '';
                if (star > 0 || add > 0 || etc > 0) {
                    detail += ` <span style="color:var(--builder-text-sub); font-size:10px;">(${b}`;
                    if (add > 0) detail += ` <span style="color:#00c4ff;">+${add}</span>`;
                    if (etc > 0) detail += ` <span style="color:#af48ff;">+${etc}</span>`;
                    if (star > 0) detail += ` <span style="color:#f59e0b;">+${star}</span>`;
                    detail += `)</span>`;
                }
                statHtml += `<div style="margin-bottom: 3px;">• ${s.name} : +${total}${detail}</div>`;
            }
        });
        
        const statBreakdownEl = document.getElementById('interactive_item_stat_breakdown');
        if (statBreakdownEl) statBreakdownEl.innerHTML = statHtml || '옵션 데이터 부재';
    }

    const classInfo = window.getClassMainStatAndAtkType();
    const activeLabel = window.getJobStatLabel();

    const getItemListStatSum = function(itemList) {
        let sum = { str: 0, dex: 0, int: 0, luk: 0, atk: 0, matk: 0, bossDmg: 0, mainStatP: 0, allStatP: 0, atkP: 0, matkP: 0, critDmg: 0, finalDmg: 0 };
        if (!itemList || !Array.isArray(itemList)) return sum;
        
        itemList.forEach(item => {
            if (!item) return;
            sum.str += Number(item.item_base_option?.str || 0) + Number(item.item_add_option?.str || 0) + Number(item.item_etc_option?.str || 0);
            sum.dex += Number(item.item_base_option?.dex || 0) + Number(item.item_add_option?.dex || 0) + Number(item.item_etc_option?.dex || 0);
            sum.int += Number(item.item_base_option?.int || 0) + Number(item.item_add_option?.int || 0) + Number(item.item_etc_option?.int || 0);
            sum.luk += Number(item.item_base_option?.luk || 0) + Number(item.item_add_option?.luk || 0) + Number(item.item_etc_option?.luk || 0);
            sum.atk += Number(item.item_base_option?.attack_power || item.item_base_option?.atk || 0) + Number(item.item_add_option?.attack_power || item.item_add_option?.atk || 0) + Number(item.item_etc_option?.attack_power || item.item_etc_option?.atk || 0);
            sum.matk += Number(item.item_base_option?.magic_power || item.item_base_option?.matk || 0) + Number(item.item_add_option?.magic_power || item.item_add_option?.matk || 0) + Number(item.item_etc_option?.magic_power || item.item_etc_option?.matk || 0);
            
            const sfValue = parseInt(item.starforce || 0);
            sum.str += sfValue * 2.5; sum.dex += sfValue * 2.5; sum.int += sfValue * 2.5; sum.luk += sfValue * 2.5;
            sum.atk += sfValue * 2; sum.matk += sfValue * 2;
            
            for (let i = 1; i <= 3; i++) {
                const potOption = item[`potential_option_${i}`] || "";
                const addPotOption = item[`additional_potential_option_${i}`] || "";
                
                [potOption, addPotOption].forEach(optStr => {
                    if (!optStr || optStr === "옵션없음") return;
                    
                    ["str", "dex", "int", "luk"].forEach(sKey => {
                        const targetLabel = sKey.toUpperCase();
                        if (optStr.includes(targetLabel) || (sKey === classInfo.mainStat && (optStr.includes("직업별 스텟") || optStr.includes("주스탯")))) {
                            const m = optStr.match(/\+(\d+)%/);
                            if (m) {
                                if (sKey === classInfo.mainStat) sum.mainStatP += parseInt(m[1]);
                                else sum[sKey] += parseInt(m[1]) * 26; 
                            } else {
                                const f = optStr.match(/\+(\d+)/);
                                if (f) sum[sKey] += parseInt(f[1]);
                            }
                        }
                    });

                    if (optStr.includes("올스탯")) {
                        const m = optStr.match(/\+(\d+)%/); if (m) sum.allStatP += parseInt(m[1]);
                        else {
                            const f = optStr.match(/\+(\d+)/); if (f) {
                                sum.str += parseInt(f[1]); sum.dex += parseInt(f[1]); sum.int += parseInt(f[1]); sum.luk += parseInt(f[1]);
                            }
                        }
                    } else if (optStr.includes("공격력")) {
                        const m = optStr.match(/\+(\d+)%/); if (m) sum.atkP += parseInt(m[1]);
                        else { const f = optStr.match(/\+(\d+)/); if (f) sum.atk += parseInt(f[1]); }
                    } else if (optStr.includes("마력")) {
                        const m = optStr.match(/\+(\d+)%/); if (m) sum.matkP += parseInt(m[1]);
                        else { const f = optStr.match(/\+(\d+)/); if (f) sum.matk += parseInt(f[1]); }
                    } else if (optStr.includes("보스 몬스터 데미지")) {
                        const m = optStr.match(/\+(\d+)%/); if (m) sum.bossDmg += parseInt(m[1]);
                    } else if (optStr.includes("크리티컬 데미지")) {
                        const m = optStr.match(/\+(\d+)%/); if (m) sum.critDmg += parseInt(m[1]);
                    } else if (optStr.includes("최종 데미지")) {
                        const m = optStr.match(/\+(\d+)%/); if (m) sum.finalDmg += parseInt(m[1]);
                    }
                });
            }
        });
        return sum;
    };

    const currentSum = getItemListStatSum(window.builderCurrentList);
    const originalSum = getItemListStatSum(window.builderOriginalList);

    const allStats = window.currentSearchData?.stat?.final_stat || [];
    const basePower = parseFloat(allStats.find(s => s.stat_name === "전투력")?.stat_value.replace(/,/g, '')) || 10000000;
    const baseDmg = parseFloat(allStats.find(s => s.stat_name === "데미지")?.stat_value) || 40;
    const baseBossDmg = parseFloat(allStats.find(s => s.stat_name === "보스 몬스터 데미지")?.stat_value) || 200;
    const baseCritDmg = parseFloat(allStats.find(s => s.stat_name === "크리티컬 데미지")?.stat_value) || 50;
    const baseFinalDmg = parseFloat(allStats.find(s => s.stat_name === "최종 데미지")?.stat_value) || 0;
    
    const baseMainStatVal = parseFloat(allStats.find(s => s.stat_name === activeLabel)?.stat_value.replace(/,/g, '')) || 2000;
    const baseSubStatVal = parseFloat(allStats.find(s => s.stat_name === classInfo.subStat.toUpperCase())?.stat_value.replace(/,/g, '')) || 1000;

    const isAtk = classInfo.atkType === "atk";
    let basePureAtkFactor = 600; 
    let originalAtkTotal = (basePureAtkFactor + (isAtk ? originalSum.atk : originalSum.matk)) * (1 + (isAtk ? originalSum.atkP : originalSum.matkP) / 100);
    let currentAtkTotal = (basePureAtkFactor + (isAtk ? currentSum.atk : currentSum.matk) + dopingAtkBonus) * (1 + (isAtk ? currentSum.atkP : currentSum.matkP) / 100);

    let deltaMainFlat = currentSum[classInfo.mainStat] - originalSum[classInfo.mainStat] + dopingStatBonus;
    let deltaSubFlat = currentSum[classInfo.subStat] - originalSum[classInfo.subStat];
    let deltaMainP = currentSum.mainStatP - originalSum.mainStatP;
    let deltaAllP = currentSum.allStatP - originalSum.allStatP;

    let originalStatFactor = (baseMainStatVal * 4) + baseSubStatVal;
    let currentStatFactor = ((baseMainStatVal + deltaMainFlat) * 4) * (1 + (deltaMainP + deltaAllP) / 100) + (baseSubStatVal + deltaSubFlat) * (1 + deltaAllP / 100);

    let originalDmgFactor = 1 + (baseDmg + baseBossDmg) / 100;
    let currentDmgFactor = 1 + (baseDmg + baseBossDmg + (currentSum.bossDmg - originalSum.bossDmg) + dopingBossDmgBonus) / 100;

    let originalCritFactor = 1 + (baseCritDmg / 100);
    let currentCritFactor = 1 + ((baseCritDmg + (currentSum.critDmg - originalSum.critDmg)) / 100);
    
    let originalFinalFactor = 1 + (baseFinalDmg / 100) * (1 + originalSum.finalDmg / 100);
    let currentFinalFactor = 1 + (baseFinalDmg / 100) * (1 + currentSum.finalDmg / 100);

    let originalFormulaValue = originalAtkTotal * originalStatFactor * originalDmgFactor * originalCritFactor * originalFinalFactor;
    let currentFormulaValue = currentAtkTotal * currentStatFactor * currentDmgFactor * currentCritFactor * currentFinalFactor;
    
    let calculatedPower = basePower * (currentFormulaValue / originalFormulaValue);
    let deltaPower = calculatedPower - basePower;

    const legacyIdMap = { "전투력": "live_stat_power", "보스 몬스터 데미지": "live_stat_boss_dmg", "STR": "live_stat_str", "INT": "live_stat_int", "공격력": "live_stat_atk" };

    const deltaStrFlat = (currentSum.str - originalSum.str);
    const deltaDexFlat = (currentSum.dex - originalSum.dex);
    const deltaIntFlat = (currentSum.int - originalSum.int);
    const deltaLukFlat = (currentSum.luk - originalSum.luk);
    const deltaAtkFlat = (currentSum.atk - originalSum.atk);
    const deltaMatkFlat = (currentSum.matk - originalSum.matk);

    if (window.currentSearchData && window.currentSearchData.stat && window.currentSearchData.stat.final_stat) {
        window.currentSearchData.stat.final_stat.forEach(s => {
            const safeCleanKey = s.stat_name.replace(/[^a-zA-Z0-9가-힣]/g, '');
            const targetDomId = legacyIdMap[s.stat_name] || `live_stat_${safeCleanKey}`;
            
            const valEl = document.getElementById(targetDomId);
            const deltaEl = document.getElementById(targetDomId + "_delta");
            if (!valEl) return;

            let rawValueStr = s.stat_value.replace(/,/g, '').replace(/%/g, '');
            let baseVal = parseFloat(rawValueStr) || 0;
            let isPercent = s.stat_value.includes('%');

            let changeVal = 0;
            if (s.stat_name === "전투력") {
                changeVal = deltaPower;
            } else if (s.stat_name === "보스 몬스터 데미지") {
                changeVal = (currentSum.bossDmg - originalSum.bossDmg) + dopingBossDmgBonus;
            } else if (s.stat_name === "STR") {
                changeVal = (classInfo.mainStat === "str") ? (currentStatFactor/4 - baseMainStatVal) : deltaStrFlat;
            } else if (s.stat_name === "DEX") {
                changeVal = (classInfo.mainStat === "dex") ? (currentStatFactor/4 - baseMainStatVal) : deltaDexFlat;
            } else if (s.stat_name === "INT") {
                changeVal = (classInfo.mainStat === "int") ? (currentStatFactor/4 - baseMainStatVal) : deltaIntFlat;
            } else if (s.stat_name === "LUK") {
                changeVal = (classInfo.mainStat === "luk") ? (currentStatFactor/4 - baseMainStatVal) : deltaLukFlat;
            } else if (s.stat_name === "공격력") {
                changeVal = isAtk ? (currentAtkTotal - originalAtkTotal) : deltaAtkFlat;
            } else if (s.stat_name === "마력") {
                changeVal = !isAtk ? (currentAtkTotal - originalAtkTotal) : deltaMatkFlat;
            }

            let finalVal = baseVal + changeVal;
            valEl.innerHTML = isPercent ? finalVal.toFixed(2) + "%" : Math.max(0, Math.floor(finalVal)).toLocaleString();

            if (deltaEl) {
                if (changeVal > 0) {
                    deltaEl.innerHTML = ` (+${Math.floor(changeVal).toLocaleString()}${isPercent ? '%' : ''})`;
                    deltaEl.style.color = '#ef4444';
                } else if (changeVal < 0) {
                    deltaEl.innerHTML = ` (${Math.floor(changeVal).toLocaleString()}${isPercent ? '%' : ''})`;
                    deltaEl.style.color = '#3b82f6';
                } else {
                    deltaEl.innerHTML = '';
                }
            }
        });
    }

    const powerTextEl = document.getElementById('delta_power_text');
    if (powerTextEl) {
        powerTextEl.innerText = (deltaPower >= 0 ? '+' : '') + Math.floor(deltaPower).toLocaleString();
        powerTextEl.style.color = deltaPower >= 0 ? "var(--builder-text-accent)" : "#3b82f6";
    }

    // 💡 [세트 장비 디테일 리뉴얼]
    // 세트 장비 이름, 활성화 개수, 상세 장착한 부위 목록, 상세 혜택 수치를 완벽하게 바인딩하여 출력합니다.
    const setListEl = document.getElementById('equipped_set_effects_list');
    if (setListEl) {
        const activeSets = window.calculateEquippedSetEffects();
        if (activeSets.length === 0) {
            setListEl.innerHTML = `<div style="color: var(--builder-text-sub); font-size: 10.5px; text-align: center; padding: 4px 0;">활성화된 장비 세트 효과가 없습니다.</div>`;
        } else {
            setListEl.innerHTML = activeSets.map(set => `
                <div style="display: flex; flex-direction: column; background: var(--builder-input-bg); padding: 10px 14px; border-radius: 8px; border: 1px solid var(--builder-border); margin-bottom: 6px; text-align: left; box-sizing: border-box;">
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <span style="font-weight: 800; color: var(--builder-text-main); font-size: 11.5px;">✨ ${set.name}</span>
                        <span style="color: var(--builder-text-accent); font-weight: 900; font-family: 'Consolas'; font-size: 11.5px;">${set.count}세트</span>
                    </div>
                    <div style="font-size: 9.5px; color: var(--builder-text-accent); margin-top: 4px; font-weight: 800;">
                        • 장착 파츠: <span style="color: var(--builder-text-main); font-weight: 600;">${window.getEquippedPartsNames(set.name)}</span>
                    </div>
                    <div style="font-size: 9.5px; color: var(--builder-text-sub); margin-top: 5px; line-height: 1.4; border-top: 1px dashed var(--builder-border-dashed); padding-top: 5px;">
                        ${window.getDetailedSetEffectDescription(set.name, set.count)}
                    </div>
                </div>
            `).join('');
        }
    }
};

window.switchBuilderPreset = function(presetNumber) {
    window.omniSimMemory.activePreset = presetNumber;
    window.builderCurrentList = null; 
    window.builderOriginalList = null; 
    document.querySelectorAll('.builder-preset-pill').forEach(btn => btn.classList.remove('active'));
    const targetBtn = document.getElementById(`btn_preset_${presetNumber}`);
    if (targetBtn) targetBtn.classList.add('active');
    window.initOmniBuilderTab();
};

document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.initOmniBuilderTab === 'function') window.initOmniBuilderTab();
});