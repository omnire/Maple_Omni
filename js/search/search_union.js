/**
 * ============================================================================
 * 👤 MAPLE OMNI V15 - js/search/search_union.js [ALL-PACKET INTEGRATED RENDERER]
 * 역할: 제공해주신 패킷 데이터(union_level: 9248, union_grade: "그랜드 마스터 유니온 3",
 *       union_artifact_exp: 23480, union_artifact_level: 51, union_artifact_point: 17300,
 *       union_max_point: 168, union_raider_stat: 43개, union_state_stat: 6개 등)를
 *       단 하나도 빠짐없이 완벽하게 화면에 100% 매핑하여 시각화하는 통합 관제 모듈
 * 규칙: 코드를 작성할 때는 초보자도 쉽게 이해할 수 있도록 상세한 주석을 작성합니다.
 * ============================================================================
 */

window.renderUnion = function(unionData, hexaSkillData, hexaStatData) {
    try {
        // 💡 [초보자 가이드] 전역 데이터 세션 및 넥슨 유니온 API 응답 객체들을 안전하게 바인딩합니다.
        const globalSearchData = window.currentSearchData || {};
        
        const apiUnion = unionData || globalSearchData.union || {};
        const apiRaider = globalSearchData.union_raider || apiUnion.union_raider || {};
        const apiArtifact = globalSearchData.union_artifact || apiUnion.union_artifact || {};
        const apiChampion = globalSearchData.union_champion || apiUnion.union_champion || {};

        // 💡 [초보자 가이드] 전역 검색 데이터 루트와 개별 API 패킷들을 통합하여 데이터 유실을 방지합니다.
        const fullUnionPacket = Object.assign({}, globalSearchData, apiRaider, apiArtifact, apiChampion, apiUnion);

        // 1. 📊 유니온 요약 스펙 파싱 (레벨, 등급, 아티팩트 레벨/포인트/EXP/MaxPoint)
        const uLevel = fullUnionPacket.union_level ? Number(fullUnionPacket.union_level).toLocaleString() : "0";
        const uGrade = fullUnionPacket.union_grade ? String(fullUnionPacket.union_grade) : "일반 계정";
        const artifactLevel = fullUnionPacket.union_artifact_level || fullUnionPacket.artifact_level || "1";
        const artifactPoint = fullUnionPacket.union_artifact_point !== undefined ? Number(fullUnionPacket.union_artifact_point).toLocaleString() : "0";
        const artifactMaxPoint = fullUnionPacket.union_max_point !== undefined ? Number(fullUnionPacket.union_max_point).toLocaleString() : "0";
        const artifactExp = fullUnionPacket.union_artifact_exp !== undefined ? Number(fullUnionPacket.union_artifact_exp).toLocaleString() : "0";
        const artifactRemainAp = fullUnionPacket.union_artifact_remain_ap !== undefined ? fullUnionPacket.union_artifact_remain_ap : 0;

        // 2. 🔮 아티팩트 효과 파싱 (12종 전체)
        let artifactEffects = [];
        const rawArtifactData = fullUnionPacket.union_artifact_effect;
        if (rawArtifactData && Array.isArray(rawArtifactData)) {
            artifactEffects = rawArtifactData.map(eff => {
                if (!eff) return { name: "", level: 0 };
                return {
                    name: String(eff.name || eff.artifact_effect_name || ""),
                    level: parseInt(eff.level || eff.artifact_effect_level || 0) || 0
                };
            }).filter(e => e.name !== "");
        }

        // 3. 🔮 아티팩트 크리스탈 파싱 (8개 전체)
        let artifactCrystals = [];
        const rawCrystalData = fullUnionPacket.union_artifact_crystal;
        if (rawCrystalData && Array.isArray(rawCrystalData)) {
            artifactCrystals = rawCrystalData.map(cry => {
                if (!cry) return { name: "크리스탈", level: 0, opts: [] };
                let optsArray = [];
                if (cry.crystal_option_name_1) optsArray.push(String(cry.crystal_option_name_1));
                if (cry.crystal_option_name_2) optsArray.push(String(cry.crystal_option_name_2));
                if (cry.crystal_option_name_3) optsArray.push(String(cry.crystal_option_name_3));
                if (cry.artifact_crystal_effect_1) optsArray.push(String(cry.artifact_crystal_effect_1));
                if (cry.artifact_crystal_effect_2) optsArray.push(String(cry.artifact_crystal_effect_2));
                if (cry.artifact_crystal_effect_3) optsArray.push(String(cry.artifact_crystal_effect_3));
                
                return {
                    name: String(cry.name || cry.artifact_crystal_name || "크리스탈"),
                    level: parseInt(cry.level || cry.artifact_crystal_level || 0) || 0,
                    opts: optsArray
                };
            });
        }

        // 4. 🏆 [챔피언 공격대] 파싱 및 공식 블로그 기반 다음 등급 평가전 조건/스펙 매핑
        let championList = [];
        let rawChampData = fullUnionPacket.union_champion;
        if (rawChampData && !Array.isArray(rawChampData) && typeof rawChampData === 'object') {
            rawChampData = rawChampData.union_champion || rawChampData.champion_list || rawChampData.data || null;
        }

        if (Array.isArray(rawChampData) && rawChampData.length > 0) {
            championList = rawChampData.map(champ => {
                if (!champ) return null;
                let badgeStats = [];
                const rawBadges = champ.champion_badge_info || champ.badge_info || champ.champion_badge || champ.badge || [];
                if (Array.isArray(rawBadges)) {
                    badgeStats = rawBadges.map(b => {
                        if (!b) return "";
                        return String(b.stat || b.champion_badge_effect || b.badge_effect || b.effect || b.name || "");
                    }).filter(Boolean);
                }

                const currentGrade = String(champ.champion_grade || champ.grade || "C").toUpperCase();
                const gradeFlow = { 'C': 'B', 'B': 'A', 'A': 'S', 'S': 'SS', 'SS': 'SSS', 'SSS': 'MAX' };
                const nextGrade = String(champ.next_grade || gradeFlow[currentGrade] || 'MAX').toUpperCase();

                // 💡 [초보자 가이드] API가 제공하는 다음 등급(nextGrade)을 기준으로 공식 평가전 조건과 상승 스펙을 매핑합니다.
                let nextCondition = "";
                let nextEffectDesc = "";

                if (nextGrade === 'B') {
                    nextCondition = "스우 (하드) 챔피언 모드 격파";
                    nextEffectDesc = "올스탯 +20, 최대 HP/MP +1000 증가";
                } else if (nextGrade === 'A') {
                    nextCondition = "진 힐라 (하드) 챔피언 모드 격파";
                    nextEffectDesc = "공격력/마력 +10 증가";
                } else if (nextGrade === 'S') {
                    nextCondition = "검은 마법사 (하드) 챔피언 모드 격파";
                    nextEffectDesc = "보스 몬스터 공격 시 데미지 +5% 증가";
                } else if (nextGrade === 'SS') {
                    nextCondition = "선택받은 세렌 (하드) 챔피언 모드 격파";
                    nextEffectDesc = "크리티컬 데미지 +3.00% 증가";
                } else if (nextGrade === 'SSS') {
                    nextCondition = "감시자 칼로스 (노멀) 챔피언 모드 격파";
                    nextEffectDesc = "방어율 무시 +5% 증가";
                }

                return {
                    name: String(champ.champion_name || champ.name || champ.character_name || "챔피언"),
                    grade: currentGrade,
                    job: String(champ.champion_class || champ.job || champ.character_class || "미확인"),
                    effects: badgeStats,
                    nextGrade: nextGrade,
                    nextCondition: nextCondition,
                    nextEffectDesc: nextEffectDesc
                };
            }).filter(Boolean);
        }

        // 5. 🛡️ 유니온 공격대원 및 효과 (안전하고 완벽한 넥슨 OpenAPI 유니온 블록 파싱)
        let fullRaiderList = [];
        
        // 💡 [초보자 가이드] 수신된 모든 데이터 소스(apiRaider, apiUnion, globalSearchData)에서 유니온 블록과 스탯 정보를 안전하게 추출합니다.
        const targetRaiderData = apiRaider.union_raider || apiRaider || globalSearchData.union_raider || {};
        const targetUnionData = apiUnion.union || apiUnion || globalSearchData.union || {};
        
        const unionRaiderStats = fullUnionPacket.union_raider_stat || targetRaiderData.union_raider_stat || targetUnionData.union_raider_stat || [];
        const activePresetNo = Number(fullUnionPacket.use_preset_no || targetRaiderData.use_preset_no || targetUnionData.use_preset_no || 1);
        
        let rawRaiderBlocks = [];
        
        // 💡 [초보자 가이드] 최상위 유니온 블록 배열 후보군을 먼저 탐색합니다.
        const topLevelSources = [
            apiRaider.union_block,
            targetRaiderData.union_block,
            targetUnionData.union_block,
            fullUnionPacket.union_block,
            globalSearchData.union_block
        ];

        for (const src of topLevelSources) {
            if (Array.isArray(src) && src.length > 0) {
                rawRaiderBlocks = src;
                break;
            }
        }

        // 💡 [초보자 가이드] 최상위에 블록이 없다면 활성화된 프리셋 및 1~10번 프리셋 내부의 블록 배열을 정밀 탐색합니다.
        if (rawRaiderBlocks.length === 0) {
            const presetList = [
                targetRaiderData[`union_raider_preset_${activePresetNo}`],
                targetUnionData[`union_raider_preset_${activePresetNo}`],
                fullUnionPacket[`union_raider_preset_${activePresetNo}`],
                targetRaiderData.union_raider_preset_1,
                targetRaiderData.union_raider_preset_2,
                targetRaiderData.union_raider_preset_3,
                targetRaiderData.union_raider_preset_4,
                targetRaiderData.union_raider_preset_5,
                targetRaiderData.union_raider_preset_6,
                targetRaiderData.union_raider_preset_7,
                targetRaiderData.union_raider_preset_8,
                targetRaiderData.union_raider_preset_9,
                targetRaiderData.union_raider_preset_10
            ];

            for (const preset of presetList) {
                if (preset) {
                    const blockCandidate = preset.union_block || preset.block_list || preset.union_raider_block;
                    if (Array.isArray(blockCandidate) && blockCandidate.length > 0) {
                        rawRaiderBlocks = blockCandidate;
                        break;
                    }
                }
            }
        }

        // 💡 [초보자 가이드] 추출된 원본 블록 데이터를 가공하여 화면 출력용 리스트를 완성합니다.
        if (Array.isArray(rawRaiderBlocks) && rawRaiderBlocks.length > 0) {
            fullRaiderList = rawRaiderBlocks.map((raider, index) => {
                if (!raider) return null;
                const realJob = String(raider.block_class || raider.character_class || raider.job || raider.class || "공격대원");
                const realLevel = parseInt(raider.block_level || raider.character_level || raider.level) || 0;
                const realName = String(raider.character_name || raider.name || raider.block_name || `${realJob} 대원`);
                const realGrade = String(raider.block_type || raider.raider_grade || raider.grade || "SS");
                const realPower = (raider.raider_combat_power || raider.combat_power) 
                    ? Number(raider.raider_combat_power || raider.combat_power).toLocaleString() 
                    : "-";

                return {
                    name: realName,
                    job: realJob,
                    level: realLevel,
                    power: realPower,
                    grade: realGrade
                };
            }).filter(Boolean);
        } else {
            fullRaiderList = [];
        }

        const totalRaiderCombatPower = fullUnionPacket.union_raider_boot_power 
            ? Number(fullUnionPacket.union_raider_boot_power).toLocaleString() 
            : fullUnionPacket.union_raider_combat_power
                ? Number(fullUnionPacket.union_raider_combat_power).toLocaleString()
                : (fullRaiderList.reduce((acc, b) => {
                    const cleanPower = String(b.power || '0').replace(/,/g, '');
                    return acc + (parseInt(cleanPower) || 0);
                  }, 0).toLocaleString());

        let raiderEffects = [];
        if (Array.isArray(unionRaiderStats) && unionRaiderStats.length > 0) {
            raiderEffects = unionRaiderStats.map(v => String(v || ""));
        } else {
            raiderEffects = ["배치된 대원 시너지 정보를 동기화 중입니다."];
        }

        // 6. 🎯 유니온 보드판 점유 스탯 및 프리셋 (union_state_stat_preset 10개 및 union_state_stat 6종)
        let blockStatsHtml = "";
        const rawStateStatsPreset = fullUnionPacket.union_state_stat_preset || [];
        const safeStatePresetArray = Array.isArray(rawStateStatsPreset) ? rawStateStatsPreset : [];
        const stateStatsPreset = safeStatePresetArray.filter(p => p && Array.isArray(p.union_state_stat) && p.union_state_stat.length > 0);

        const directStateStats = fullUnionPacket.union_state_stat || [];
        const directInnerStats = fullUnionPacket.union_inner_stat || [];
        const directOccupiedStats = fullUnionPacket.union_occupied_stat || [];

        if (window.currentUnionPresetViewNo === undefined) {
            window.currentUnionPresetViewNo = activePresetNo;
        }

        // 💡 [초보자 가이드] 우측 아티팩트 코어와 완벽히 어울리는 무난하고 깔끔한 프리셋 버튼 및 폰트 밸런스로 개편합니다.
        if (stateStatsPreset.length > 0) {
            // 💡 [초보자 가이드] 과한 장식을 걷어내고 아티팩트 상단 배지와 유사한 정돈된 플랫 스타일의 프리셋 버튼을 생성합니다.
            let presetBtnsHtml = stateStatsPreset.map(preset => {
                if (!preset) return "";
                const pNo = Number(preset.preset_no || 1);
                const isSelected = pNo === window.currentUnionPresetViewNo;
                const isCurrentActive = pNo === activePresetNo;

                const tabBg = isSelected ? "var(--omni-slate-primary, #7a6ec7)" : "var(--omni-bg-clean, #ffffff)";
                const tabColor = isSelected ? "#ffffff" : "var(--omni-text-muted, #6a638c)";
                const tabBorder = isSelected ? "none" : "1.5px dashed var(--omni-card-border-line, #d8cfea)";
                const activeLabel = isCurrentActive ? ` <span style="font-size: 7.5px; opacity: 0.9; margin-left: 2px;">(ACTIVE)</span>` : "";

                return `
                    <button onclick="window.switchUnionPresetView(${pNo})" style="padding: 4px 10px; font-size: 10.5px; font-weight: 700; background: ${tabBg}; color: ${tabColor}; border: ${tabBorder}; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center;">
                        PRESET ${pNo}${activeLabel}
                    </button>
                `;
            }).join('');

            // 💡 [초보자 가이드] 현재 선택된 프리셋의 스탯 데이터를 안전하게 가져옵니다.
            const activePresetData = stateStatsPreset.find(p => Number(p.preset_no || 1) === window.currentUnionPresetViewNo) || stateStatsPreset[0];
            const activeStats = (activePresetData && Array.isArray(activePresetData.union_state_stat) && activePresetData.union_state_stat.length > 0) 
                ? activePresetData.union_state_stat 
                : directStateStats;
            const activePresetNoVal = Number(activePresetData?.preset_no || 1);
            const isViewingActive = activePresetNoVal === activePresetNo;

            // 💡 [초보자 가이드] 우측 아티팩트 크리스탈 코어와 폰트 크기 및 두께(볼드 완화)를 완전히 일치시켜 시각적 통일감을 줍니다.
            let statsContentHtml = "";
            if (Array.isArray(activeStats) && activeStats.length > 0) {
                statsContentHtml = `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; max-height: 250px; overflow-y: auto; padding-right: 4px;">
                        ${activeStats.map((statStr, idx) => {
                            const cleanStr = String(statStr || "").trim();
                            if (!cleanStr) return "";
                            const indexStr = String(idx + 1).padStart(2, '0');
                            return `
                                <div style="background: var(--omni-card-bg, #fbfaff); border: 1.5px dashed var(--omni-card-border-line, #d8cfea); border-radius: 12px; padding: 12px 14px; text-align: left; box-shadow: 0 4px 12px rgba(122,110,199,0.02);">
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                        <span style="font-size: 12.5px; font-weight: 900; color: var(--omni-slate-primary, #7a6ec7);">🎯 STAT #${indexStr}</span>
                                        <span style="font-size: 11px; font-weight: 900; color: var(--omni-slate-primary, #7a6ec7); background:var(--omni-bg-clean, #ffffff); padding: 2px 6px; border-radius:6px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea);">EFFECT</span>
                                    </div>
                                    <div style="font-size: 10.5px; font-weight: 700; color: var(--omni-text-muted, #6a638c); word-break: break-all;">
                                        • ${cleanStr}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            } else {
                statsContentHtml = `<div style="grid-column: span 2; text-align:center; color:var(--omni-text-muted, #6a638c); padding:20px 0; font-size:12px; font-weight:700;">설정된 점유 스탯이 없습니다.</div>`;
            }

            // 💡 [초보자 가이드] 메인 레이아웃 박스에 무난하고 깔끔한 헤더 구조를 적용합니다.
            blockStatsHtml = `
                <div style="background: transparent; border: none; padding: 0; display: flex; flex-direction: column; gap: 14px; box-shadow: none;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-size: 11px; color: var(--omni-slate-primary, #7a6ec7); background: var(--omni-card-bg, #fbfaff); padding: 3px 10px; border-radius: 6px; font-weight: 700; border: 1.5px dashed var(--omni-card-border-line, #d8cfea);">PRESET: ${activePresetNoVal}</span>
                            ${isViewingActive ? '<span style="font-size: 10px; background: #dcfce7; color: #15803d; padding: 3px 8px; border-radius: 6px; font-weight: 700; border: 1px solid #bbf7d0;">적용중</span>' : ''}
                        </div>
                        <div style="display: flex; gap: 4px; flex-wrap: wrap; background: var(--omni-card-bg, #fbfaff); padding: 3px; border-radius: 8px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea);">
                            ${presetBtnsHtml}
                        </div>
                    </div>
                    <div>
                        ${statsContentHtml}
                    </div>
                </div>
            `;
        } else if (directStateStats.length > 0) {
            blockStatsHtml = `
                <div style="background: transparent; border: none; padding: 0;">
                    <div style="font-size: 11.5px; font-weight: 900; color: var(--omni-slate-primary, #7a6ec7); margin-bottom: 12px;">🎯 현재 적용 중인 유니온 점유 스탯 (${directStateStats.length}종)</div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                        ${directStateStats.map(statStr => `
                            <div style="background: var(--omni-card-bg, #fbfaff); padding: 10px 14px; border-radius: 10px; text-align: left; border: 1.5px dashed var(--omni-card-border-line, #d8cfea);">
                                <span style="font-size: 12px; font-weight: 900; color: var(--omni-text-dark, #312e4b);">${statStr}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            blockStatsHtml = `
                <div style="padding: 24px 0; text-align: center; color: var(--omni-text-muted, #6a638c); font-size: 12px; font-weight: 800; background: transparent;">
                    점유 스탯이 설정되어 있는 유니온 프리셋이 존재하지 않습니다.
                </div>
            `;
        }

        // 7. 🧩 보조 스탯 (내부/영역 배치 스탯)
        let auxStatsHtml = "";
        const hasInner = Array.isArray(directInnerStats) && directInnerStats.length > 0;
        const hasOccupied = Array.isArray(directOccupiedStats) && directOccupiedStats.length > 0;

        if (hasInner || hasOccupied) {
            auxStatsHtml = `
                <h4 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 900; color: var(--omni-text-dark, #312e4b);">🧩 보드판 내부/영역 배치 스탯 명세</h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                    ${hasInner ? directInnerStats.map(s => `<div style="background:var(--omni-card-bg, #fbfaff); padding:8px 12px; border-radius:8px; font-size:11px; font-weight:800; color:var(--omni-text-dark, #312e4b); border:1.5px dashed var(--omni-card-border-line, #d8cfea);">🔹 ${s}</div>`).join('') : ''}
                    ${hasOccupied ? directOccupiedStats.map(s => `<div style="background:var(--omni-card-bg, #fbfaff); padding:8px 12px; border-radius:8px; font-size:11px; font-weight:800; color:var(--omni-text-dark, #312e4b); border:1.5px dashed var(--omni-card-border-line, #d8cfea);">🔸 ${s}</div>`).join('') : ''}
                </div>
            `;
        }

        // 8. 🏛️ 상단 요약 대시보드 카드
        const summaryHeaderHtml = `
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; width: 100%; box-sizing: border-box; font-family: 'Pretendard', sans-serif;">
                <div style="background: var(--omni-bg-clean, #ffffff); border-radius: 16px; padding: 18px 22px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea); box-shadow: 0 8px 24px -6px rgba(122, 110, 199, 0.05); text-align: left;">
                    <span style="font-size: 11px; font-weight: 800; color: var(--omni-text-muted, #6a638c); display: block; margin-bottom: 4px;">🎖️ 유니온 등급</span>
                    <span style="font-size: 14px; font-weight: 900; color: var(--omni-text-dark, #312e4b);">${uGrade}</span>
                </div>
                <div style="background: var(--omni-bg-clean, #ffffff); border-radius: 16px; padding: 18px 22px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea); box-shadow: 0 8px 24px -6px rgba(122, 110, 199, 0.05); text-align: left;">
                    <span style="font-size: 11px; font-weight: 800; color: var(--omni-text-muted, #6a638c); display: block; margin-bottom: 4px;">⚡ 공격대 총 레벨</span>
                    <span style="font-size: 14px; font-weight: 900; color: var(--omni-slate-primary, #7a6ec7);">Lv.${uLevel}</span>
                </div>
                <div style="background: var(--omni-bg-clean, #ffffff); border-radius: 16px; padding: 18px 22px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea); box-shadow: 0 8px 24px -6px rgba(122, 110, 199, 0.05); text-align: left;">
                    <span style="font-size: 11px; font-weight: 800; color: var(--omni-text-muted, #6a638c); display: block; margin-bottom: 4px;">🔮 아티팩트 레벨 / 포인트 (Max ${artifactMaxPoint})</span>
                    <span style="font-size: 14px; font-weight: 900; color: #16a34a;">Lv.${artifactLevel} <span style="font-size:11px; color:var(--omni-text-muted, #6a638c); font-weight:600;">(${artifactPoint} P)</span></span>
                    <span style="font-size: 10px; color: var(--omni-text-muted, #6a638c); display: block; margin-top: 2px;">EXP: ${artifactExp}</span>
                </div>
                <div style="background: var(--omni-bg-clean, #ffffff); border-radius: 16px; padding: 18px 22px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea); box-shadow: 0 8px 24px -6px rgba(122, 110, 199, 0.05); text-align: left;">
                    <span style="font-size: 11px; font-weight: 800; color: var(--omni-text-muted, #6a638c); display: block; margin-bottom: 4px;">⚔️ 공격대 총 전투력</span>
                    <span style="font-size: 14px; font-weight: 900; color: #ea580c;">${totalRaiderCombatPower}</span>
                </div>
            </div>
        `;

        // 9. 🏆 챔피언 공격대 HTML (정확한 다음 등급 평가전 조건 및 상승 스펙 표시)
        const championHtml = championList.length === 0
            ? `<div style="text-align:center; color:var(--omni-text-muted, #6a638c); padding:16px 0; font-size:11.5px; font-weight:700; background: var(--omni-card-bg, #fbfaff); border-radius: 12px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea);">현재 동기화된 유니온 챔피언 설정 내역이 없습니다.</div>`
            : championList.map(champ => `
                <div style="background: var(--omni-card-bg, #fbfaff); border: 1.5px dashed var(--omni-card-border-line, #d8cfea); border-radius: 12px; padding: 12px 14px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 6px; box-shadow: 0 4px 12px rgba(122,110,199,0.02);">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: baseline; gap: 6px;">
                            <span style="font-size: 13px; font-weight: 900; color: var(--omni-text-dark, #312e4b);">${champ.name}</span>
                            <span style="font-size: 10.5px; font-weight: 800; color: var(--omni-text-muted, #6a638c);">클래스: ${champ.job}</span>
                        </div>
                        <span style="font-size: 10px; font-weight: 900; color: #15803d; background: #dcfce7; padding: 2px 8px; border-radius: 6px; border: 1px solid #bbf7d0;">${champ.grade} 등급</span>
                    </div>
                    ${champ.effects && champ.effects.length > 0 ? `
                    <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 2px;">
                        ${champ.effects.map(fx => `<span style="font-size: 10.5px; font-weight: 700; color: var(--omni-text-muted, #6a638c); background: var(--omni-bg-clean, #ffffff); padding: 3px 8px; border-radius: 6px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea);">• ${fx}</span>`).join('')}
                    </div>` : ''}
                    
                    ${champ.nextGrade !== 'MAX' ? `
                    <div style="margin-top: 4px; padding-top: 8px; border-top: 1.5px dashed var(--omni-card-border-line, #d8cfea); display: flex; flex-direction: column; gap: 4px;">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <span style="font-size: 10.5px; font-weight: 800; color: var(--omni-slate-primary, #7a6ec7);">🚀 NEXT ${champ.nextGrade}등급 평가전</span>
                            <span style="font-size: 10.5px; font-weight: 800; color: #ea580c;">🎯 ${champ.nextCondition}</span>
                        </div>
                        <div style="font-size: 10px; font-weight: 700; color: #059669; background: #dcfce7; padding: 3px 8px; border-radius: 4px; display: inline-block; width: fit-content; border: 1px solid #a7f3d0;">
                            ✨ 승급 시 효과: ${champ.nextEffectDesc}
                        </div>
                    </div>
                    ` : `
                    <div style="margin-top: 4px; padding-top: 8px; border-top: 1.5px dashed var(--omni-card-border-line, #d8cfea); text-align: center;">
                        <span style="font-size: 10.5px; font-weight: 800; color: #ea580c;">🎉 최고 등급에 도달한 챔피언입니다.</span>
                    </div>
                    `}
                </div>
            `).join('');

        // 10. 🔮 아티팩트 크리스탈 및 결합 효과 HTML (폰트 크기를 아주 살짝 상향 조정)
        const artifactCrystalsHtml = artifactCrystals.length === 0
            ? `<div style="grid-column: span 2; text-align:center; color:var(--omni-text-muted, #6a638c); padding:20px 0; font-size:12px; font-weight:700;">활성화된 아티팩트 크리스탈이 없습니다.</div>`
            : artifactCrystals.map(c => `
                <div style="background: var(--omni-card-bg, #fbfaff); border: 1.5px dashed var(--omni-card-border-line, #d8cfea); border-radius: 12px; padding: 12px 14px; text-align: left; box-shadow: 0 4px 12px rgba(122,110,199,0.02);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <span style="font-size: 12.5px; font-weight: 900; color: var(--omni-slate-primary, #7a6ec7);">🔮 ${c.name.replace("크리스탈 : ", "")}</span>
                        <span style="font-size: 11.5px; font-weight: 900; color: var(--omni-slate-primary, #7a6ec7); background:var(--omni-bg-clean, #ffffff); padding: 2px 6px; border-radius:6px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea);">Lv.${c.level}</span>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:3px;">
                        ${c.opts.map(o => `<span style="font-size:10.5px; font-weight:700; color:var(--omni-text-muted, #6a638c); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">• ${o}</span>`).join('')}
                    </div>
                </div>
            `).join('');

        const artifactEffectsHtml = artifactEffects.length === 0
            ? `<div style="text-align:center; color:var(--omni-text-muted, #6a638c); padding:20px 0; font-size:12px; font-weight:700;">상시 적용 중인 아티팩트 효과 스펙이 비어 있습니다.</div>`
            : artifactEffects.map(ae => `
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--omni-card-bg, #fbfaff); border:1.5px dashed var(--omni-card-border-line, #d8cfea); padding:8px 12px; border-radius:8px;">
                    <span style="font-size:11.5px; font-weight:800; color:var(--omni-text-dark, #312e4b); text-align:left; word-break:break-all; padding-right:8px;">${ae.name}</span>
                    <span style="font-size:11px; font-weight:900; color:#15803d; white-space:nowrap;">Lv.${ae.level}</span>
                </div>
            `).join('');

        // 11. 🏛️ 최종 유니온 대시보드 레이아웃 동적 결합 반환 (좌우 대칭 및 하단 와이드 배너 적용)
        return `
            <div style="display: flex; flex-direction: column; gap: 20px; width: 100%; box-sizing: border-box; padding: 10px 0; font-family: 'Pretendard', sans-serif;">
                ${summaryHeaderHtml}

                <!-- 💡 [초보자 가이드] 상단 메인 2단 그리드 관제 영역 -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%; box-sizing: border-box; align-items: start;">
                    
                    <!-- 💡 [좌측 컬럼] 점유 스탯, 보조 스탯, 챔피언 배지, 전략 가이드 카드 -->
                    <div style="display: flex; flex-direction: column; gap: 20px; min-width: 0;">
                        <div style="background: var(--omni-bg-clean, #ffffff); border-radius: 20px; padding: 24px; border: 1.5px solid var(--omni-card-border-line, #d8cfea); box-shadow: 0 12px 32px -8px rgba(122, 110, 199, 0.06); text-align: left;">
                            <h4 style="margin: 0 0 14px 0; font-size: 13px; font-weight: 900; color: var(--omni-text-dark, #312e4b); display: flex; justify-content: space-between; align-items: center;">
                                <span>⚔️ 유니온 보드판 점유 배치 스탯</span>
                                <span style="font-size: 10px; font-weight: 800; color: var(--omni-slate-primary, #7a6ec7); background: var(--omni-card-bg, #fbfaff); padding: 3px 8px; border-radius: 6px; border: 1px solid var(--omni-card-border-line, #d8cfea);">Active Presets</span>
                            </h4>
                            ${blockStatsHtml}
                        </div>
                        
                        ${auxStatsHtml ? `
                        <div style="background: var(--omni-bg-clean, #ffffff); border-radius: 20px; padding: 24px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea); box-shadow: 0 12px 32px -8px rgba(122, 110, 199, 0.06); text-align: left;">
                            ${auxStatsHtml}
                        </div>` : ''}
                        
                        <div style="background: var(--omni-bg-clean, #ffffff); border-radius: 20px; padding: 24px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea); box-shadow: 0 12px 32px -8px rgba(122, 110, 199, 0.06); text-align: left;">
                            <h4 style="margin: 0 0 14px 0; font-size: 13px; font-weight: 900; color: var(--omni-text-dark, #312e4b); display: flex; align-items: center; gap: 6px;">🏆 챔피언 공격대 배치 배지 명세</h4>
                            <div style="width: 100%;">${championHtml}</div>
                        </div>

                        <!-- 💡 [디자인 리팩토링] 우측 공격대원 총괄표와 박스 크기(높이 420px)를 완벽히 일치시킨 프로페셔널 전략 가이드 위젯 -->
                        <div style="background: var(--omni-bg-clean, #ffffff); border-radius: 20px; padding: 24px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea); box-shadow: 0 12px 32px -8px rgba(122, 110, 199, 0.06); text-align: left; height: 420px; display: flex; flex-direction: column; box-sizing: border-box;">
                            <h4 style="margin: 0 0 14px 0; font-size: 13px; font-weight: 900; color: var(--omni-text-dark, #312e4b); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
                                <span style="display: flex; align-items: center; gap: 6px;">🚀 프로페셔널 유니온 육성 및 배치 전략</span>
                                <span style="font-size: 10px; font-weight: 800; color: var(--omni-slate-primary, #7a6ec7); background: var(--omni-card-bg, #fbfaff); padding: 3px 8px; border-radius: 6px; border: 1px solid var(--omni-card-border-line, #d8cfea);">STRATEGY</span>
                            </h4>
                            <div class="union-effect-scroll-area" style="flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-right: 4px;">
                                <div style="background: var(--omni-card-bg, #fbfaff); border: 1.5px dashed var(--omni-card-border-line, #d8cfea); padding: 14px; border-radius: 12px;">
                                    <div style="font-size: 11.5px; font-weight: 900; color: var(--omni-slate-primary, #7a6ec7); margin-bottom: 8px; display: flex; align-items: center; gap: 4px;">
                                        ⭐ 핵심 유니온 육성 우선순위 (필수 육성)
                                    </div>
                                    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px; color: var(--omni-text-muted, #6a638c); font-weight: 700;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; background: var(--omni-bg-clean, #ffffff); padding: 6px 10px; border-radius: 8px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea);">
                                            <span>• 크리티컬 데미지 (은월)</span>
                                            <span style="color: #15803d; font-weight: 900;">최대 6%</span>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; align-items: center; background: var(--omni-bg-clean, #ffffff); padding: 6px 10px; border-radius: 8px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea);">
                                            <span>• 스킬 쿨타임 감소 (메르세데스)</span>
                                            <span style="color: #15803d; font-weight: 900;">최대 6%</span>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; align-items: center; background: var(--omni-bg-clean, #ffffff); padding: 6px 10px; border-radius: 8px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea);">
                                            <span>• 보스 몬스터 데미지 (데몬어벤져)</span>
                                            <span style="color: #15803d; font-weight: 900;">최대 6%</span>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; align-items: center; background: var(--omni-bg-clean, #ffffff); padding: 6px 10px; border-radius: 8px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea);">
                                            <span>• 경험치 획득량 (제로)</span>
                                            <span style="color: #15803d; font-weight: 900;">최대 12%</span>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; align-items: center; background: var(--omni-bg-clean, #ffffff); padding: 6px 10px; border-radius: 8px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea);">
                                            <span>• 버프 지속 시간 (메카닉)</span>
                                            <span style="color: #15803d; font-weight: 900;">최대 25%</span>
                                        </div>
                                    </div>
                                </div>
                                <div style="background: var(--omni-card-bg, #fbfaff); border: 1.5px dashed var(--omni-card-border-line, #d8cfea); padding: 14px; border-radius: 12px;">
                                    <div style="font-size: 11.5px; font-weight: 900; color: #16a34a; margin-bottom: 8px; display: flex; align-items: center; gap: 4px;">
                                        🎯 보드판 점유 배치 및 재화 관리
                                    </div>
                                    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px; color: var(--omni-text-muted, #6a638c); font-weight: 700;">
                                        <div style="background: var(--omni-bg-clean, #ffffff); padding: 6px 10px; border-radius: 8px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea);">
                                            <span style="color: var(--omni-text-dark, #312e4b); font-weight: 900;">사냥 세팅:</span> 일몹뎀 ➔ 크리티컬 데미지 ➔ 추가 경험치 순 점령
                                        </div>
                                        <div style="background: var(--omni-bg-clean, #ffffff); padding: 6px 10px; border-radius: 8px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea);">
                                            <span style="color: var(--omni-text-dark, #312e4b); font-weight: 900;">보스 세팅:</span> 보스 데미지 ➔ 크리티컬 데미지 ➔ 방무/공마 순 점령
                                        </div>
                                        <div style="background: var(--omni-bg-clean, #ffffff); padding: 6px 10px; border-radius: 8px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea);">
                                            <span style="color: var(--omni-text-dark, #312e4b); font-weight: 900;">코인/AP 수급:</span> 일일 유니온 퀘스트 및 아티팩트 미션 상시 수행
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 💡 [우측 컬럼] 아티팩트 크리스탈 코어, 결합 누적 스펙, 공격대원 보유 효과 총괄표 카드 -->
                    <div style="display: flex; flex-direction: column; gap: 20px; min-width: 0;">
                        <div style="background: var(--omni-bg-clean, #ffffff); border-radius: 20px; padding: 24px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea); box-shadow: 0 12px 32px -8px rgba(122, 110, 199, 0.06); text-align: left;">
                            <h4 style="margin: 0 0 14px 0; font-size: 13px; font-weight: 900; color: var(--omni-text-dark, #312e4b); display:flex; justify-content:space-between; align-items:center;">
                                <span>🔮 유니온 아티팩트 활성 크리스탈 코어</span>
                                <span style="font-size:10.5px; color:var(--omni-slate-primary, #7a6ec7); background:var(--omni-card-bg, #fbfaff); padding:3px 10px; border-radius:6px; font-weight:800; border: 1.5px dashed var(--omni-card-border-line, #d8cfea);">AP 잔여: ${artifactRemainAp}</span>
                            </h4>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; max-height: 250px; overflow-y: auto; padding-right: 4px;">
                                ${artifactCrystalsHtml}
                            </div>
                        </div>
                        <div style="background: var(--omni-bg-clean, #ffffff); border-radius: 20px; padding: 24px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea); box-shadow: 0 12px 32px -8px rgba(122, 110, 199, 0.06); text-align: left;">
                            <h4 style="margin: 0 0 14px 0; font-size: 13px; font-weight: 900; color: var(--omni-text-dark, #312e4b);">✨ 아티팩트 결합 누적 활성화 스펙 (${artifactEffects.length}종)</h4>
                            <div class="union-effect-scroll-area" style="max-height: 310px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding-right: 4px;">
                                ${artifactEffectsHtml}
                            </div>
                        </div>
                        
                        <!-- 💡 [디자인 리팩토링] 좌측 전략 가이드와 박스 크기(높이 420px)를 완벽히 일치시킨 유니온 공격대원 보유 효과 총괄표 위젯 -->
                        <div style="background: var(--omni-bg-clean, #ffffff); border-radius: 20px; padding: 24px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea); box-shadow: 0 12px 32px -8px rgba(122, 110, 199, 0.06); text-align: left; height: 420px; display: flex; flex-direction: column; box-sizing: border-box;">
                            <h4 style="margin: 0 0 14px 0; font-size: 13px; font-weight: 900; color: var(--omni-text-dark, #312e4b); flex-shrink: 0;">🛡️ 유니온 공격대원 보유 효과 총괄표 (${raiderEffects.length}종)</h4>
                            <div class="union-effect-scroll-area" style="flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding-right: 4px;">
                                ${raiderEffects.map(fx => `
                                    <div style="background: var(--omni-card-bg, #fbfaff); border: 1.5px dashed var(--omni-card-border-line, #d8cfea); padding: 10px 14px; border-radius: 10px; font-size: 11px; font-weight: 800; color: var(--omni-text-dark, #312e4b); text-align:left;">
                                        🔷 ${fx}
                                    </div>`).join('')}
                            </div>
                        </div>
                    </div>

                </div>

                <!-- 🛒 [신규 배치] 하단 전체 폭(100%)을 가로로 시원하게 채우는 유니온 상점 효율 및 등급별 혜택 와이드 배너 카드 -->
                <div style="background: var(--omni-bg-clean, #ffffff); border-radius: 20px; padding: 24px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea); box-shadow: 0 12px 32px -8px rgba(122, 110, 199, 0.06); text-align: left; width: 100%; box-sizing: border-box;">
                    <h4 style="margin: 0 0 14px 0; font-size: 13px; font-weight: 900; color: var(--omni-text-dark, #312e4b); display: flex; justify-content: space-between; align-items: center;">
                        <span style="display: flex; align-items: center; gap: 6px;">🛒 유니온 상점 효율 및 등급별 혜택 가이드</span>
                        <span style="font-size: 10px; font-weight: 800; color: #16a34a; background: var(--omni-card-bg, #fbfaff); padding: 3px 8px; border-radius: 6px; border: 1.5px solid var(--omni-card-border-line, #d8cfea);">SHOP & PERKS</span>
                    </h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div style="background: var(--omni-card-bg, #fbfaff); border: 1.5px dashed var(--omni-card-border-line, #d8cfea); padding: 16px; border-radius: 12px;">
                            <div style="font-size: 11.5px; font-weight: 900; color: #16a34a; margin-bottom: 10px; display: flex; align-items: center; gap: 4px;">
                                🛍️ 유니온 코인샵 구매 우선순위 툴팁
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 11px; color: var(--omni-text-muted, #6a638c); font-weight: 700;">
                                <div style="display: flex; justify-content: space-between; align-items: center; background: var(--omni-bg-clean, #ffffff); padding: 8px 12px; border-radius: 8px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea);">
                                    <span>• 명예의 유니온 경험치 쿠폰 & 성장의 비약</span>
                                    <span style="color: #15803d; font-weight: 900;">1순위</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; background: var(--omni-bg-clean, #ffffff); padding: 8px 12px; border-radius: 8px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea);">
                                    <span>• 파워 엘릭서, 성향 비약, 심볼 교환권</span>
                                    <span style="color: #15803d; font-weight: 900;">2순위</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; background: var(--omni-bg-clean, #ffffff); padding: 8px 12px; border-radius: 8px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea);">
                                    <span>• 명예의 훈장 및 코인샵 전용 치장</span>
                                    <span style="color: #15803d; font-weight: 900;">3순위</span>
                                </div>
                            </div>
                        </div>
                        <div style="background: var(--omni-card-bg, #fbfaff); border: 1.5px dashed var(--omni-card-border-line, #d8cfea); padding: 16px; border-radius: 12px;">
                            <div style="font-size: 11.5px; font-weight: 900; color: var(--omni-slate-primary, #7a6ec7); margin-bottom: 10px; display: flex; align-items: center; gap: 4px;">
                                🎖️ 유니온 등급별 핵심 해금 혜택 툴팁
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 11px; color: var(--omni-text-muted, #6a638c); font-weight: 700;">
                                <div style="display: flex; justify-content: space-between; align-items: center; background: var(--omni-bg-clean, #ffffff); padding: 8px 12px; border-radius: 8px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea);">
                                    <span>• 그랜드 마스터 (배치수 대폭 확장)</span>
                                    <span style="color: var(--omni-slate-primary, #7a6ec7); font-weight: 900;">HIGH</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; background: var(--omni-bg-clean, #ffffff); padding: 8px 12px; border-radius: 8px; border: 1.5px dashed var(--omni-card-border-line, #d8cfea);">
                                    <span>• 슈프림 유니온 (최대 배치 & 효율 극대화)</span>
                                    <span style="color: var(--omni-slate-primary, #7a6ec7); font-weight: 900;">MAX</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        `;
    } catch (criticalError) {
        console.error("[CRITICAL SHIELD] 유니온 모듈 파싱 가드 가동됨:", criticalError);
        return `
            <div style="padding: 40px; text-align: center; background: var(--omni-card-bg, #181721); border: 1px solid var(--omni-card-border-line, #262438); border-radius: 16px;">
                <p style="color: var(--omni-slate-primary, #a78bfa); font-weight: 800; font-size: 14px; margin: 0 0 8px 0;">⚠️ 유니온 스펙 로드 일시 지연</p>
                <p style="color: var(--omni-text-muted, #747285); font-size: 12px; margin: 0;">데이터 가공 필터 오류가 감지되었습니다. 상단 탭의 다른 정보 조회가 선행 유지됩니다.</p>
            </div>
        `;
    }
};

// 💡 [초보자 가이드] 유니온 프리셋 탭 버튼 클릭 시 선택된 번호를 바꾸고 화면을 재렌더링하는 핸들러입니다.
window.switchUnionPresetView = function(presetNo) {
    window.currentUnionPresetViewNo = presetNo;
    const unionContainer = document.getElementById('searchTabContentContainer');
    if (unionContainer && window.currentSearchData && unionContainer.style.display !== 'none') {
        unionContainer.innerHTML = window.renderUnion(
            window.currentSearchData.union, 
            window.currentSearchData.hexa_skill, 
            window.currentSearchData.hexa_stat
        );
    }
};

document.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('search-tab-trigger-btn') && e.target.textContent.trim() === '유니온') {
        const unionContainer = document.getElementById('searchTabContentContainer');
        if (unionContainer && window.currentSearchData && unionContainer.style.display !== 'none') {
            unionContainer.innerHTML = window.renderUnion(
                window.currentSearchData.union, 
                window.currentSearchData.hexa_skill, 
                window.currentSearchData.hexa_stat
            );
        }
    }
});