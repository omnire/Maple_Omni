/**
 * ============================================================================
 * 👤 MAPLE OMNI - js/search/search_skill.js [ALL-IN-ONE DATA RECOVERY & THEME ADAPTIVE]
 * 설명: 링크 스킬, 6차 헥사 매트릭스, 3중 스탯 코어, 5차 V-코어 실시간 정밀 동기화 모듈
 * 핵심 수정사항:
 *   1. currentSearchData 내의 link_skill, hexa_skill, hexa_stat, vmatrix, skill 키를 완벽 수집
 *   2. V-매트릭스 장착 노드 및 5차 스킬 룩업 아이콘 100% 매핑
 *   3. 6차 HEXA 스탯 코어 1~3번 슬롯 데이터 전수 수집 및 노출 보장
 *   4. 6차/5차 스킬 코어 박스 디자인 슬림화 및 그리드 간격 최적화
 * 규칙: 초보자도 이해하기 쉽도록 모든 탐색 로직과 수식에 친절한 주석을 서술합니다.
 * ============================================================================
 */

/**
 * 💡 [초보자 가이드] 6차 전직 코어 및 스탯 레벨 기반 누적 솔 에르다 / 에르다 조각 소모량 역산 수식
 */
window.calculateHexaSpends = function(hexaSkills, hexaStats) {
    let totalSolErda = 0;
    let totalFragments = 0;

    // 1️⃣ 6차 헥사 스킬 코어별 단계별 소모량 역산
    if (Array.isArray(hexaSkills)) {
        hexaSkills.forEach(core => {
            if (!core) return;
            const level = Number(core.hexa_core_level ?? core.hexa_skill_level ?? core.level ?? 0);
            const type = String(core.hexa_core_type || core.core_type || "스킬 코어");

            if (level <= 1) return;

            for (let i = 2; i <= level; i++) {
                let stepSolErda = 1;
                let stepFragments = 30;

                if (type.includes("스킬")) {
                    if (i === 2) { stepSolErda = 5; stepFragments = 125; }
                    else if (i === 10 || i === 20 || i === 30) { stepSolErda = 8; stepFragments = 225; }
                    else if (i % 5 === 0) { stepSolErda = 7; stepFragments = 175; }
                    else { stepSolErda = 2; stepFragments = 55; }
                } else if (type.includes("마스터리")) {
                    if (i === 2) { stepSolErda = 3; stepFragments = 65; }
                    else if (i === 10 || i === 20 || i === 30) { stepSolErda = 5; stepFragments = 115; }
                    else if (i % 5 === 0) { stepSolErda = 4; stepFragments = 95; }
                    else { stepSolErda = 1; stepFragments = 30; }
                } else if (type.includes("강화")) {
                    if (i === 2) { stepSolErda = 4; stepFragments = 90; }
                    else if (i === 10 || i === 20 || i === 30) { stepSolErda = 6; stepFragments = 150; }
                    else if (i % 5 === 0) { stepSolErda = 5; stepFragments = 125; }
                    else { stepSolErda = 1; stepFragments = 40; }
                } else { // 공용 코어 (솔 야누스 등)
                    if (i === 2) { stepSolErda = 7; stepFragments = 175; }
                    else if (i === 10 || i === 20 || i === 30) { stepSolErda = 10; stepFragments = 300; }
                    else if (i % 5 === 0) { stepSolErda = 9; stepFragments = 250; }
                    else { stepSolErda = 3; stepFragments = 80; }
                }

                totalSolErda += stepSolErda;
                totalFragments += stepFragments;
            }
        });
    }

    // 2️⃣ 6차 헥사 스탯 슬롯 개방 및 레벨업 비용 가산
    if (Array.isArray(hexaStats)) {
        hexaStats.forEach(stat => {
            if (!stat) return;
            const mainLvl = Number(stat.main_stat_level || 0);
            const sub1Lvl = Number(stat.sub_stat_level_1 || 0);
            const sub2Lvl = Number(stat.sub_stat_level_2 || 0);

            if (mainLvl + sub1Lvl + sub2Lvl > 0) {
                totalSolErda += 5; 
                totalFragments += (mainLvl * 95) + (sub1Lvl * 45) + (sub2Lvl * 45);
            }
        });
    }

    return {
        solErda: Math.floor(totalSolErda),
        fragments: Math.floor(totalFragments)
    };
};

/**
 * 💡 [초보자 가이드] 링크 스킬 프리셋 탭 전환 제어 엔진
 */
window.showLinkPreset = function(index) {
    document.querySelectorAll('.link-preset-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.link-preset-tab').forEach(el => {
        el.style.background = 'var(--omni-card-bg)';
        el.style.color = 'var(--omni-text-sub)';
        el.style.borderColor = 'var(--omni-card-border-line)';
    });
    const targetContent = document.getElementById(`link-preset-content-${index}`);
    const targetTab = document.getElementById(`link-preset-tab-${index}`);
    if (targetContent) targetContent.style.display = 'block';
    if (targetTab) {
        targetTab.style.background = 'var(--omni-slate-primary)';
        targetTab.style.color = '#ffffff';
        targetTab.style.borderColor = 'var(--omni-slate-primary)';
    }
};

/**
 * 💡 [메인 렌더링 함수] 스킬 대시보드 마운터 (데이터 멸실 복구 알고리즘 탑재)
 */
window.renderSkill = function() {
    try {
        const data = window.currentSearchData;
        
        console.log("🔍 [MAPLE OMNI DEBUG] currentSearchData 패킷 검사:", data);

        if (!data) {
            return `<div style="padding:60px; text-align:center; color:var(--omni-text-muted); font-weight:700; background:var(--omni-card-bg); border-radius:20px; border:1px solid var(--omni-card-border-line);">🔮 검색 데이터 갱신 버튼을 눌러 스킬 정보를 불러와주세요.</div>`;
        }

        // =========================================================================
        // 🛠️ [1] 링크 스킬 데이터 복구 파이프라인 (스킬 레벨별 상세 수치 적용)
        // 💡 [초보자 가이드] 장착된 링크 스킬의 레벨(level)을 함께 전달받아, 메이플스토리 공식 수치에 맞는 정확한 퍼센트 효과를 반환합니다.
        // =========================================================================
        const getLinkSkillDesc = (name, level) => {
            const cleanName = (name || "").trim();
            const lvl = Number(level || 1);

            // 주요 링크 스킬별 레벨별 상세 수치 정의 맵
            if (cleanName.includes("엘프의 축복")) { // 메르세데스
                const val = lvl >= 3 ? 20 : (lvl === 2 ? 15 : 10);
                return `경험치 획득량 ${val}% 증가 (메르세데스)`;
            }
            if (cleanName.includes("불타는 투지")) { // 아란
                const val = lvl >= 3 ? 650 : (lvl === 2 ? 600 : 300);
                return `콤보킬 구슬 경험치 ${val}% 추가 획득 (아란)`;
            }
            if (cleanName.includes("법의 가르침")) { // 에반
                const val = lvl >= 2 ? 70 : 50;
                return `룬 지속 시간 ${val}% 증가 (에반)`;
            }
            if (cleanName.includes("와일드 레이지")) { // 데몬슬레이어
                const val = lvl >= 2 ? 15 : 10;
                return `데미지 ${val}% 증가 (데몬슬레이어)`;
            }
            if (cleanName.includes("퍼미에이트")) { // 루미너스
                const val = lvl >= 2 ? 15 : 10;
                return `방어율 무시 ${val}% 증가 (루미너스)`;
            }
            if (cleanName.includes("소울 컨트랙트")) { // 엔젤릭버스터
                const val = lvl >= 2 ? 45 : 30;
                return `10초 동안 데미지 ${val}% 증가 (엔젤릭버스터)`;
            }
            if (cleanName.includes("아이언 윌")) { // 카이저
                const val = lvl * 5; // 5% ~ 15%
                return `최대 HP ${val}% 증가 (카이저)`;
            }
            if (cleanName.includes("판단")) { // 제논
                const val = lvl * 5; // 5% 또는 10%
                return `모든 능력치 ${val}% 증가 (제논)`;
            }
            if (cleanName.includes("빛의 수호")) { // 미하일
                return `스탠스 확률 100% 증가 (미하일)`;
            }
            if (cleanName.includes("구사일생")) { // 은월
                const val = lvl * 1; 
                return `사망 위기 시 ${val}% 확률로 생존 (은월)`;
            }

            // 일반 폴백 및 키워드 기반 스마트 추론
            if (cleanName.includes("경험치") || cleanName.includes("축복")) return `성장 관련 보너스 효과 부여 (Lv.${lvl})`;
            if (cleanName.includes("데미지") || cleanName.includes("공격") || cleanName.includes("레이지")) return `전투력 및 공격 데미지 강화 효과 (Lv.${lvl})`;
            if (cleanName.includes("방어") || cleanName.includes("체력") || cleanName.includes("HP") || cleanName.includes("생존")) return `생존력 및 방어 능력 강화 효과 (Lv.${lvl})`;

            return `${cleanName} 고유의 링크 스킬 효과 (Lv.${lvl})를 부여합니다.`;
        };

        // 💡 [초보자 가이드] HTML 속성(title 등) 내부에 따옴표가 포함될 때 화면 깨짐을 막고 툴팁이 정상 표시되도록 돕는 이스케이프 헬퍼 함수
        const escapeAttr = (str) => String(str || "").replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\n/g, ' ');

        const linkObj = data.link_skill || data.linkSkill || data.link || {};
        const linkSets = [
            { name: "현재 장착", skills: linkObj.character_link_skill || linkObj.characterLinkSkill || (Array.isArray(linkObj) ? linkObj : []) },
            { name: "프리셋 1", skills: linkObj.character_link_skill_preset_1 || linkObj.characterLinkSkillPreset1 || [] },
            { name: "프리셋 2", skills: linkObj.character_link_skill_preset_2 || linkObj.characterLinkSkillPreset2 || [] },
            { name: "프리셋 3", skills: linkObj.character_link_skill_preset_3 || linkObj.characterLinkSkillPreset3 || [] }
        ];

        // =========================================================================
        // 🛠️ [2] 6차 HEXA 코어 데이터 복구 파이프라인
        // =========================================================================
        let hexaSkills = [];
        const hexaObj = data.hexa_skill || data.hexaSkill || data.hexa_matrix || data.hexaMatrix || {};
        
        if (Array.isArray(hexaObj)) {
            hexaSkills = hexaObj;
        } else if (typeof hexaObj === 'object') {
            hexaSkills = hexaObj.character_hexa_core_equipment || hexaObj.character_hexa_skill_core || hexaObj.hexa_core_equipment || [];
            if (hexaSkills.length === 0) {
                Object.values(hexaObj).forEach(val => {
                    if (Array.isArray(val) && val.length > 0 && hexaSkills.length === 0) {
                        hexaSkills = val;
                    }
                });
            }
        }

        // =========================================================================
        // 🛠️ [3] 6차 HEXA 스탯 코어 데이터 복구 파이프라인 (3개 슬롯 전수 수집 및 순차 무손실 매핑)
        // 💡 [초보자 가이드] API 응답 데이터 패킷 구조에서 HEXA 스탯 데이터를 광범위하게 수집한 뒤,
        // 슬롯 ID 매핑과 남은 슬롯 순차 배치를 병행하여 1, 2, 3번 슬롯 데이터가 유실 없이 전수 노출되도록 보장합니다.
        // =========================================================================
        let hexaStats = [null, null, null];
        let rawStatCores = [];

        const statSources = [
            data.hexa_stat,
            data.hexaStat,
            data.character_hexa_stat,
            data.character_hexa_stat_core,
            data.hexa_stat_core,
            data.hexaStatCore
        ];

        statSources.forEach(src => {
            if (!src) return;
            if (Array.isArray(src)) {
                rawStatCores.push(...src);
            } else if (typeof src === 'object') {
                [
                    src.character_hexa_stat_core,
                    src.hexa_stat_core,
                    src.characterHexaStatCore,
                    src.character_hexa_stat_core_2,
                    src.preset_hexa_stat_core_1,
                    src.preset_hexa_stat_core_2,
                    src.preset_hexa_stat_core_3
                ].forEach(arr => {
                    if (Array.isArray(arr)) rawStatCores.push(...arr);
                });

                if (src.slot_id !== undefined || src.slotId !== undefined || src.main_stat_name !== undefined || src.main_stat_level !== undefined) {
                    rawStatCores.push(src);
                }

                Object.values(src).forEach(val => {
                    if (Array.isArray(val)) {
                        rawStatCores.push(...val);
                    } else if (val && typeof val === 'object' && (val.slot_id !== undefined || val.main_stat_name !== undefined || val.main_stat_level !== undefined)) {
                        rawStatCores.push(val);
                    }
                });
            }
        });

        // 유효한 스탯 코어 필터링 (레벨이나 이름이 존재하는 경우)
        let validStatCores = rawStatCores.filter(slot => slot && typeof slot === 'object' && (slot.main_stat_name || slot.main_stat_level > 0 || slot.sub_stat_level_1 > 0 || slot.sub_stat_level_2 > 0));

        // 1단계: slot_id가 명시된 경우 우선 매핑
        validStatCores.forEach(slot => {
            const slotIdRaw = slot.slot_id ?? slot.slotId ?? slot.slot_no ?? slot.slotNo;
            if (slotIdRaw !== undefined && slotIdRaw !== null) {
                const num = parseInt(slotIdRaw, 10);
                let targetIdx = -1;
                if (num >= 1 && num <= 3) targetIdx = num - 1;
                else if (num >= 0 && num <= 2) targetIdx = num;

                if (targetIdx >= 0 && targetIdx <= 2) {
                    if (!hexaStats[targetIdx]) {
                        hexaStats[targetIdx] = slot;
                    }
                }
            }
        });

        // 2단계: 여전히 비어있는 슬롯이 있다면 남은 validStatCores를 순서대로 채워넣기 (3페이지 전수 노출 보장)
        let unassignedCores = validStatCores.filter(slot => !hexaStats.includes(slot));
        for (let i = 0; i < 3; i++) {
            if (!hexaStats[i] && unassignedCores.length > 0) {
                hexaStats[i] = unassignedCores.shift();
            }
        }

        // =========================================================================
        // 🛠️ [4] 5차 V-매트릭스 & 5차 스킬 통합 파이프라인 및 절대 무손실 아이콘 탐색 엔진
        // =========================================================================
        const vmatrixObj = data.vmatrix || data.v_matrix || {};
        const skillObj = data.skill || data.skill_5 || {};

        const vCoreEquipment = vmatrixObj.character_v_core_equipment || (Array.isArray(vmatrixObj) ? vmatrixObj : []);
        const skill5List = skillObj.character_skill || (Array.isArray(skillObj) ? skillObj : []);

        // 💡 [초보자 가이드] 스킬 이름의 특수문자, 공백, 슬래시, VI 등 방해 요소를 완전히 날려버리는 초강력 정규화 함수
        const normalize = (str) => String(str || "").replace(/[:\/\- ]|VI/gi, '').trim().toLowerCase();
        const iconMap = {};
        
        // 💡 [데이터 복구 알고리즘] 넥슨 API로 받은 거대한 전체 데이터(data)를 이 잡듯이 뒤져서 단 하나의 아이콘도 놓치지 않고 수집합니다.
        const collectIcons = (obj) => {
            if (!obj || typeof obj !== 'object') return;

            // 1. 배열인 경우 각 요소를 재귀 탐색
            if (Array.isArray(obj)) {
                obj.forEach(item => collectIcons(item));
                return;
            }

            // 2. 일반 객체인 경우 이름과 아이콘 필드가 있는지 확인
            const name = obj.skill_name || obj.v_core_name || obj.name;
            const icon = obj.skill_icon || obj.v_core_icon || obj.icon;

            // 이름과 아이콘이 둘 다 존재하면 사전에 등록 (원본 이름 및 찌꺼기를 제거한 순수 이름 두 가지 버전 모두)
            if (name && icon && typeof name === 'string' && typeof icon === 'string') {
                iconMap[name.trim()] = icon;
                iconMap[normalize(name)] = icon;
            }

            // 3. 객체 내부에 또 다른 객체가 숨어있을 수 있으므로 모든 키를 까서 다시 탐색
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    collectIcons(obj[key]);
                }
            }
        };
        // 데이터 전체를 함수에 던져넣어 실행
        collectIcons(data);

        const hexaFactNames = hexaSkills.map(h => h.hexa_core_name || h.hexa_skill_name || h.skill_name || "").filter(Boolean);
        const vCores = [];

        // 1차: V-매트릭스 장착 노드 기준 파싱
        if (Array.isArray(vCoreEquipment) && vCoreEquipment.length > 0) {
            vCoreEquipment.forEach(s => {
                if (!s) return;
                const sName = s.v_core_name || s.skill_name || s.name || "";
                if (!sName) return;

                const n = sName.toLowerCase();
                const level = Number(s.v_core_level || s.skill_level || s.level || 0);

                if (level <= 0) return;
                if (hexaFactNames.includes(sName) || n.endsWith("vi") || n.includes("솔 야누스") || n.includes("솔 헤카테")) return;

                const isEnhanceCore = n.includes("강화") || n.includes("2중") || n.includes("3중") || s.v_core_type === "강화 코어";
                // 💡 [데이터 복구] 넥슨 API가 제공하는 아이콘을 최우선으로, 없으면 아이콘 맵(원본/정규화)에서 탐색
                const icon = s.v_core_icon || s.skill_icon || s.icon || iconMap[sName.trim()] || iconMap[normalize(sName)] || "";

                vCores.push({
                    name: sName,
                    level: level,
                    icon: icon,
                    maxLevel: isEnhanceCore ? 60 : 30
                });
            });
        } else if (Array.isArray(skill5List) && skill5List.length > 0) {
            // 2차: 5차 스킬 정보 기준 폴백 파싱
            skill5List.forEach(s => {
                if (!s) return;
                const sName = s.skill_name || "";
                if (!sName) return;

                const n = sName.toLowerCase();
                const level = Number(s.skill_level || 0);

                if (level <= 0) return;
                if (hexaFactNames.includes(sName) || n.endsWith("vi") || n.includes("솔 야누스") || n.includes("솔 헤카테")) return;

                const isEnhanceCore = n.includes("강화") || n.includes("2중") || n.includes("3중");

                vCores.push({
                    name: sName,
                    level: level,
                    icon: s.skill_icon || "",
                    maxLevel: isEnhanceCore ? 60 : 30
                });
            });
        }

        // 수식 연산
        const spends = window.calculateHexaSpends(hexaSkills, hexaStats);

        // 💡 [컴팩트 진행바 컴포넌트] 코어 박스 슬림화 적용
        const buildProgressBar = (currentLevel, maxLevel, colorHex) => {
            const percent = Math.min(100, (currentLevel / maxLevel) * 100);
            const isMax = currentLevel >= maxLevel;
            const remaining = maxLevel - currentLevel;

            return `
                <div style="margin-top: 4px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 3px;">
                        <span style="font-size: 10px; font-weight: 800; color: ${isMax ? '#eab308' : 'var(--omni-text-sub)'};">
                            ${isMax ? '✨ MAX' : `🚀만렙까지 ${remaining}업`}
                        </span>
                        <span style="font-size: 11px; font-weight: 900; color: var(--omni-text-dark);">
                            Lv.${currentLevel} <span style="font-size: 9px; color: var(--omni-text-muted); font-weight: 700;">/${maxLevel}</span>
                        </span>
                    </div>
                    <div style="width: 100%; height: 6px; background: var(--omni-hover-point); border-radius: 3px; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);">
                        <div style="width: ${percent}%; height: 100%; background: ${isMax ? 'linear-gradient(90deg, #fde047, #eab308)' : colorHex}; border-radius: 3px; transition: width 0.5s ease-out;"></div>
                    </div>
                </div>
            `;
        };

        const boxStyle = "background: var(--omni-bg-clean, #ffffff); border: 1.5px dashed var(--omni-card-border-line, #d8cfea); border-radius: 20px; padding: 20px; box-shadow: 0 12px 32px -8px rgba(122, 110, 199, 0.06);";
        const titleStyle = "margin: 0 0 14px 0; font-size: 15px; font-weight: 900; color: var(--omni-text-dark); display: flex; align-items: center; gap: 8px;";
        // 💡 [그리드 레이아웃 컴팩트화] 박스 최적 최소 너비 200px 설정
        const gridScrollStyle = "max-height: 380px; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; padding-right: 6px;";

        return `
            <div style="display: flex; flex-direction: column; gap: 24px; width: 100%; box-sizing: border-box; padding: 10px 0;">
                
                <!-- 누적 소모 재화 위젯 -->
                <div style="display: flex; gap: 16px;">
                    <div style="flex: 1; background: var(--omni-bg-clean, #ffffff); border: 1.5px dashed var(--omni-card-border-line, #d8cfea); padding: 14px 18px; border-radius: 14px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 12px rgba(122,110,199,0.03);">
                        <span style="font-size: 12px; font-weight: 800; color: #c2410c;">🔥 누적 솔 에르다 소모량</span>
                        <span style="font-size: 14px; font-weight: 900; color: #9a3412;">${spends.solErda.toLocaleString()} 개</span>
                    </div>
                    <div style="flex: 1; background: var(--omni-bg-clean, #ffffff); border: 1.5px dashed var(--omni-card-border-line, #d8cfea); padding: 14px 18px; border-radius: 14px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 12px rgba(122,110,199,0.03);">
                        <span style="font-size: 12px; font-weight: 800; color: #4338ca;">💎 누적 에르다 조각 소모량</span>
                        <span style="font-size: 14px; font-weight: 900; color: #3730a3;">${spends.fragments.toLocaleString()} 개</span>
                    </div>
                </div>

                <!-- 6차 HEXA 코어 성장 현황 (컴팩트 카드 스타일) -->
                <div style="${boxStyle}">
                    <h3 style="${titleStyle}">
                        <span style="font-size: 18px;">🔷</span> 6차 HEXA 코어 성장 현황
                        <span style="font-size: 11px; color: #7e22ce; background: var(--omni-hover-point); padding: 2px 8px; border-radius: 10px; font-weight: 800; border: 1px solid var(--omni-card-border-line);">활성 ${hexaSkills.length}개</span>
                    </h3>
                    <div class="omni-skill-scroll-grid" style="${gridScrollStyle}">
                        ${hexaSkills.length > 0 ? hexaSkills.map(h => {
                            if (!h) return '';
                            const hName = h.hexa_core_name || h.hexa_skill_name || h.skill_name || "알 수 없는 코어";
                            const hType = h.hexa_core_type || h.core_type || "6차 코어";
                            const hLevel = Number(h.hexa_core_level !== undefined ? h.hexa_core_level : (h.hexa_skill_level || h.level || 0));

                            // 💡 [초강력 아이콘 복구 알고리즘] 
                            // 1. 넥슨 API 자체 제공 최우선 -> 2. 원본 및 정규화 이름 대조
                            let hIcon = h.hexa_skill_icon || h.hexa_core_icon || h.icon || iconMap[hName.trim()] || iconMap[normalize(hName)];
                            
                            // 2. (복합 마스터리 코어 처리) 슬래시('/')로 연결된 모든 스킬명을 개별 분리하여 순회하며 아이콘 탐색
                            if (!hIcon && hName.includes('/')) {
                                const parts = hName.split('/');
                                for (const part of parts) {
                                    const cleanPart = part.trim();
                                    hIcon = iconMap[cleanPart] || iconMap[normalize(cleanPart)];
                                    if (hIcon) break;
                                }
                            }

                            // 3. (스마트 퍼지 매칭) 정확한 일치가 안 될 경우 키워드 부분 일치 검사
                            if (!hIcon) {
                                const cleanCoreName = normalize(hName);
                                for (const [mapName, mapIcon] of Object.entries(iconMap)) {
                                    const cleanMapName = normalize(mapName);
                                    if (cleanCoreName && cleanMapName && cleanCoreName.length > 1 && cleanMapName.length > 1) {
                                        if (cleanCoreName.includes(cleanMapName) || cleanMapName.includes(cleanCoreName)) {
                                            hIcon = mapIcon;
                                            break;
                                        }
                                    }
                                }
                            }

                            // 찾지 못하면 빈칸 처리하여 아이콘 엑박 방지
                            hIcon = hIcon || '';
                            
                            return `
                            <div style="background: var(--omni-card-bg); border: 1px solid var(--omni-card-border-line); padding: 8px 10px; border-radius: 12px; display: flex; flex-direction: column; gap: 6px; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.05);">
                                <div style="display: flex; gap: 8px; align-items: center;">
                                    <div style="width: 32px; height: 32px; background: var(--omni-hover-point); border: 1px solid var(--omni-card-border-line); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden;">
                                        ${hIcon ? `<img src="${hIcon}" style="max-width: 85%; max-height: 85%; object-fit: contain;">` : '<div style="font-size: 14px;">💠</div>'}
                                    </div>
                                    <div style="display: flex; flex-direction: column; min-width: 0; text-align: left;">
                                        <span style="font-size: 11px; font-weight: 900; color: var(--omni-text-dark); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${hName}">${hName}</span>
                                        <span style="font-size: 8.5px; color: #6366f1; font-weight: 800;">${hType}</span>
                                    </div>
                                </div>
                                ${buildProgressBar(hLevel, 30, '#6366f1')}
                            </div>`;
                        }).join('') : `<div style="grid-column: 1/-1; padding: 20px; text-align: center; color: var(--omni-text-muted); font-size: 12px;">활성화된 6차 코어가 없습니다. (6차 미전직 또는 미개방)</div>`}
                    </div>
                </div>

                <!-- 5차 V-코어 & 강화 진행 현황 (컴팩트 카드 스타일) -->
                <div style="${boxStyle}">
                    <h3 style="${titleStyle}">
                        <span style="font-size: 18px;">🔶</span> 5차 V-코어 & 강화 진행 현황
                        <span style="font-size: 11px; color: #c2410c; background: var(--omni-hover-point); padding: 2px 8px; border-radius: 10px; font-weight: 800; border: 1px solid var(--omni-card-border-line);">주요 코어 ${vCores.length}개</span>
                    </h3>
                    <div class="omni-skill-scroll-grid" style="${gridScrollStyle}">
                        ${vCores.length > 0 ? vCores.map(v => `
                            <div style="background: var(--omni-card-bg); border: 1px solid var(--omni-card-border-line); padding: 8px 10px; border-radius: 12px; display: flex; flex-direction: column; gap: 6px; box-shadow: 0 2px 8px rgba(225, 29, 72, 0.05);">
                                <div style="display: flex; gap: 8px; align-items: center;">
                                    <div style="width: 32px; height: 32px; background: var(--omni-hover-point); border: 1px solid var(--omni-card-border-line); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden;">
                                        ${v.icon ? `<img src="${v.icon}" style="max-width: 80%; max-height: 80%; object-fit: contain;">` : '<div style="font-size: 14px;">🔥</div>'}
                                    </div>
                                    <div style="display: flex; flex-direction: column; min-width: 0; flex-grow: 1; text-align: left;">
                                        <span style="font-size: 11px; font-weight: 900; color: var(--omni-text-dark); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${v.name}">${v.name}</span>
                                        <span style="font-size: 8.5px; color: #ef4444; font-weight: 800;">${v.maxLevel === 60 ? '강화 코어' : '스킬 코어'}</span>
                                    </div>
                                </div>
                                ${buildProgressBar(v.level, v.maxLevel, '#e11d48')}
                            </div>
                        `).join('') : `<div style="grid-column: 1/-1; padding: 20px; text-align: center; color: var(--omni-text-muted); font-size: 12px;">주요 5차 코어 데이터가 없습니다.</div>`}
                    </div>
                </div>

                <!-- 하단 2열 배치 (HEXA 스탯 코어 & 링크 스킬) -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%; box-sizing: border-box;">
                    
                    <!-- 💡 [초보자 가이드] HEXA 스탯 코어 영역 (볼드 적용 및 부드러운 다이어그레이 톤 적용) -->
                    <div style="${boxStyle} display: flex; flex-direction: column; height: 100%; box-sizing: border-box;">
                        <h3 style="${titleStyle}">📊 HEXA 스탯 코어 (Max 20)</h3>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; flex-grow: 1;">
                            ${[0, 1, 2].map((idx) => {
                                const stat = hexaStats[idx];
                                // 슬롯 데이터가 비어있을 경우 미개방 상태 안내 박스 렌더링
                                if (!stat) {
                                    return `
                                        <div style="background: var(--omni-card-bg); border: 1px solid var(--omni-card-border-line); padding: 16px 10px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--omni-text-muted); height: 100%; box-sizing: border-box;">
                                            <span style="font-size: 13px; font-weight: 700;">슬롯 #${idx + 1}</span>
                                            <span style="font-size: 12px; margin-top:6px; font-weight: 500;">개방 안됨</span>
                                        </div>
                                    `;
                                }

                                const mainName = stat.main_stat_name || '미설정';
                                const mainLvl = Number(stat.main_stat_level || 0);
                                const sub1Lvl = Number(stat.sub_stat_level_1 || 0);
                                const sub2Lvl = Number(stat.sub_stat_level_2 || 0);
                                const sub1Name = stat.sub_stat_name_1 || '부가1';
                                const sub2Name = stat.sub_stat_name_2 || '부가2';

                                // 개방된 스탯 코어 정보 렌더링 (볼드 700 적용 및 부드러운 글자 색상 #4b5563 적용)
                                return `
                                    <div style="background: var(--omni-card-bg); border: 1px solid var(--omni-card-border-line); padding: 14px 10px; border-radius: 12px; display: flex; flex-direction: column; gap: 8px; box-sizing: border-box;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--omni-card-border-line); padding-bottom: 6px;">
                                            <span style="font-size: 12px; font-weight: 700; color: var(--omni-text-sub);">#${idx + 1} 슬롯</span>
                                            <span style="font-size: 10px; font-weight: 700; color: #7e22ce; background: var(--omni-hover-point); padding:2px 6px; border-radius:4px; border: 1px solid var(--omni-card-border-line);">확정</span>
                                        </div>
                                        <div style="display: flex; flex-direction: column; gap: 6px; text-align: left;">
                                            <div style="display: flex; justify-content: space-between; gap:4px;"><span style="font-size: 12px; font-weight: 700; color: #4b5563; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${mainName}">${mainName}</span><span style="font-size: 12px; font-weight: 700; color: #f97316; flex-shrink:0;">Lv.${mainLvl}</span></div>
                                            <div style="display: flex; justify-content: space-between; gap:4px;"><span style="font-size: 12px; font-weight: 700; color: #4b5563; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${sub1Name}">${sub1Name}</span><span style="font-size: 12px; font-weight: 700; color: #3b82f6; flex-shrink:0;">Lv.${sub1Lvl}</span></div>
                                            <div style="display: flex; justify-content: space-between; gap:4px;"><span style="font-size: 12px; font-weight: 700; color: #4b5563; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${sub2Name}">${sub2Name}</span><span style="font-size: 12px; font-weight: 700; color: #22c55e; flex-shrink:0;">Lv.${sub2Lvl}</span></div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--omni-card-border-line); display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 13px; font-weight: 700; color: var(--omni-text-sub);">현재 HEXA 스탯 레벨 총합</span>
                            <span style="font-size: 16px; font-weight: 700; color: #4b5563;">${hexaStats.reduce((acc, s) => acc + (s ? Number(s.main_stat_level || 0) + Number(s.sub_stat_level_1 || 0) + Number(s.sub_stat_level_2 || 0) : 0), 0)} Lv.</span>
                        </div>
                    </div>

                    <!-- 링크 스킬 (마우스 오버 시 전체 스킬명과 레벨을 띄우는 툴팁 기능 title 적용) -->
                    <div style="${boxStyle} display: flex; flex-direction: column; box-sizing: border-box;">
                        <h3 style="${titleStyle}">🔗 링크 스킬 장착 현황</h3>
                        <div style="display: flex; gap: 4px; margin-bottom: 16px; flex-wrap: wrap;">
                            ${linkSets.map((set, i) => `
                                <button id="link-preset-tab-${i}" class="link-preset-tab" onclick="window.showLinkPreset(${i})" style="cursor: pointer; padding: 6px 12px; border-radius: 8px; border: 1px solid var(--omni-card-border-line); font-size: 11px; font-weight: 800; transition: all 0.2s; ${i === 0 ? 'background: var(--omni-slate-primary); color: #ffffff; border-color: var(--omni-slate-primary);' : 'background: var(--omni-card-bg); color: var(--omni-text-sub);'}">
                                    ${set.name}
                                </button>
                            `).join('')}
                        </div>
                        <div style="flex-grow: 1;">
                            ${linkSets.map((set, i) => `
                                <div id="link-preset-content-${i}" class="link-preset-content" style="display: ${i === 0 ? 'block' : 'none'}; height: 100%;">
                                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(75px, 1fr)); gap: 8px; align-content: start;">
                                        ${set.skills.length > 0 ? set.skills.map(l => `
                                            <!-- 💡 [초보자 가이드] getLinkSkillDesc에 l.skill_level을 함께 넘겨주어 정확한 퍼센티지 수치가 툴팁에 표시되도록 설정 -->
                                        <div style="background: var(--omni-card-bg); border: 1px solid var(--omni-card-border-line); border-radius: 12px; padding: 8px; display: flex; flex-direction: column; align-items: center; gap: 6px; box-sizing: border-box; cursor: pointer;" title="${escapeAttr(`[${l.skill_name}] (Lv.${l.skill_level}) - 효과: ${getLinkSkillDesc(l.skill_name, l.skill_level)}`)}">
                                            ${l.skill_icon ? `<div title="${escapeAttr(`[${l.skill_name}] (Lv.${l.skill_level}) - 효과: ${getLinkSkillDesc(l.skill_name, l.skill_level)}`)}" style="width: 32px; height: 32px; background: var(--omni-hover-point); border-radius: 6px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--omni-card-border-line);"><img src="${l.skill_icon}" title="${escapeAttr(`[${l.skill_name}] (Lv.${l.skill_level}) - 효과: ${getLinkSkillDesc(l.skill_name, l.skill_level)}`)}" style="max-width: 90%; max-height: 90%; object-fit: contain;"></div>` : ''}
                                            <div title="${escapeAttr(`[${l.skill_name}] (Lv.${l.skill_level}) - 효과: ${getLinkSkillDesc(l.skill_name, l.skill_level)}`)}" style="font-size: 9px; font-weight: 800; color: var(--omni-text-dark); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; text-align: center;">${l.skill_name}</div>
                                            <div title="${escapeAttr(`[${l.skill_name}] (Lv.${l.skill_level}) - 효과: ${getLinkSkillDesc(l.skill_name, l.skill_level)}`)}" style="font-size: 8px; color: #4338ca; background: var(--omni-hover-point); padding: 1px 6px; border-radius: 4px; font-weight: 900; border: 1px solid var(--omni-card-border-line);">Lv.${l.skill_level}</div>
                                        </div>
                                        `).join('') : `<div style="grid-column: 1/-1; padding: 30px 0; text-align: center; color: var(--omni-text-muted); font-size: 11px; font-weight: 700;">비어 있음</div>`}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

            </div>
        `;
    } catch (err) {
        console.error("스킬 탭 렌더링 중 예외 에러 발생:", err);
        return `
            <div style="padding: 40px; text-align: center; background: var(--omni-card-bg); border-radius: 16px; border: 1px solid var(--omni-coral, #fda4af);">
                <div style="font-size: 40px; margin-bottom: 12px;">⚠️</div>
                <div style="color: var(--omni-coral, #e11d48); font-weight: 800; font-size: 15px;">스킬 모듈 데이터 매핑 도중 예외 에러가 일어났습니다.</div>
                <div style="color: var(--omni-text-muted); font-size: 12px; margin-top: 6px; font-family: monospace;">에러 사유: ${err.message}</div>
            </div>
        `;
    }
};