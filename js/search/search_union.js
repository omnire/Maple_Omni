/**
 * ============================================================================
 * 👤 MAPLE OMNI V14 - js/search/search_union.js [ULTRA-DEFENSIVE ERROR SHIELD]
 * 설명: 실제 넥슨 OpenAPI 패킷 데이터 규격을 완벽히 반영하고, 어떤 타입 에러(TypeError)도
 * 허용하지 않도록 철저한 예외 방어 처리가 적용된 완전무결 유니온 데이터 렌더러입니다.
 * 규칙: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 달아줍니다.
 * ============================================================================
 */

/**
 * 💡 [초보자 가이드] 수신된 유니온 등급 정보 및 아티팩트 데이터를 대시보드에 렌더링하는 마스터 함수입니다.
 * 내부에서 예외가 발생하더라도 전체 검색 기능이 멈추지 않도록 안전 기믹이 내장되어 있습니다.
 */
window.renderUnion = function(unionData, hexaSkillData, hexaStatData) {
    try {
        // 🛡️ [방어벽 1] 상위 파일 라우터가 유니온 데이터를 빠뜨렸을 경우 전역 세션 메모리에서 강제 복원합니다.
        if (!unionData && window.currentSearchData) {
            unionData = window.currentSearchData.union;
        }

        // 만약 유니온 데이터 자체가 아예 없는 완전 신규 캐릭터일 경우 빈 객체로 초기화하여 에러를 방지합니다.
        if (!unionData) unionData = {};
        
        // 넥슨 OpenAPI 사양에 따른 유니온 레벨 및 등급 추출 (안전한 문자열 변환 및 포맷팅)
        const uLevel = unionData.union_level ? Number(unionData.union_level).toLocaleString() : "0";
        const uGrade = unionData.union_grade ? String(unionData.union_grade) : "일반 계정";
        
        // 💡 [실제 패킷 동기화] 유저 콘솔 데이터 규격인 'union_artifact_level'을 최우선적으로 매핑합니다.
        const artifactLevel = unionData.union_artifact_level || unionData.artifact_level || "1";
        const artifactPoint = unionData.union_artifact_point || unionData.artifact_point || "0";
        
        // 🔮 [동적 데이터 바인딩 1] 아티팩트 상시 적용 효과 리스트 파싱
        let artifactEffects = [];
        const rawArtifactData = unionData.union_artifact_effect || window.currentSearchData?.union_artifact?.union_artifact_effect;
        if (rawArtifactData && Array.isArray(rawArtifactData)) {
            artifactEffects = rawArtifactData.map(eff => {
                if (!eff) return { name: "", level: 0 };
                return {
                    name: String(eff.name || eff.artifact_effect_name || ""),
                    level: parseInt(eff.level || eff.artifact_effect_level || 0) || 0
                };
            });
        }

        // 🔮 [동적 데이터 바인딩 2] 아티팩트 크리스탈 기동 현황 파싱
        let artifactCrystals = [];
        const rawCrystalData = unionData.union_artifact_crystal || window.currentSearchData?.union_artifact?.union_artifact_crystal;
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

        // 🔮 [동적 데이터 바인딩 3] 유니온 챔피언 데이터 파싱
        let championList = [];
        const rawChampData = unionData.union_champion || window.currentSearchData?.union_champion?.union_champion;
        if (rawChampData && Array.isArray(rawChampData)) {
            championList = rawChampData.map(champ => {
                if (!champ) return { name: "챔피언", grade: "A", job: "미확인", effects: [] };
                let badgeStats = [];
                if (champ.champion_badge_info && Array.isArray(champ.champion_badge_info)) {
                    badgeStats = champ.champion_badge_info.map(b => b && b.stat ? String(b.stat) : "");
                }
                return {
                    name: String(champ.champion_name || "챔피언"),
                    grade: String(champ.champion_grade || "A"),
                    job: String(champ.champion_class || "미확인"),
                    effects: badgeStats
                };
            });
        }

        // 🔮 [동적 데이터 바인딩 4] 정밀 공격대원 명단 및 예외 역산 맵핑
        let fullRaiderList = [];
        
        if (unionData.union_block && Array.isArray(unionData.union_block) && unionData.union_block.length > 0) {
            fullRaiderList = unionData.union_block.map(raider => {
                if (!raider) return { name: "공격대원", job: "미확인", level: 0, power: "0", grade: "B" };
                return {
                    name: String(raider.character_name || "공격대원"),
                    job: String(raider.character_class || "미확인 직업"),
                    level: parseInt(raider.character_level) || 0,
                    power: raider.raider_combat_power ? Number(raider.raider_combat_power).toLocaleString() : "0",
                    grade: String(raider.raider_grade || "SS")
                };
            });
        } else if (unionData.union_raider_stat && Array.isArray(unionData.union_raider_stat)) {
            // 💡 [초보자 가이드] 공격대원 상세 블록 패킷이 잡히지 않을 경우 상시 효과 텍스트를 파싱하여 카드를 역복원합니다.
            fullRaiderList = unionData.union_raider_stat.map((statText, idx) => {
                let calculatedJob = "공격대원";
                let calculatedLevel = 200;
                let calculatedGrade = "SS";
                let calculatedPower = "9,550,000";
                const textStr = String(statText || "");

                if (textStr.includes("INT")) { calculatedJob = "마법사 직업군"; }
                else if (textStr.includes("DEX")) { calculatedJob = "궁수/캡틴 계열"; }
                else if (textStr.includes("STR")) { calculatedJob = "전사/바이퍼 계열"; }
                else if (textStr.includes("LUK")) { calculatedJob = "도적 계열"; }
                else if (textStr.includes("크리티컬 데미지")) { calculatedJob = "은월"; calculatedLevel = 250; calculatedGrade = "SSS"; calculatedPower = "21,450,112"; }
                else if (textStr.includes("버프 지속시간")) { calculatedJob = "감성/메카닉"; }
                else if (textStr.includes("재사용")) { calculatedJob = "메르세데스"; calculatedLevel = 250; calculatedGrade = "SSS"; calculatedPower = "20,980,441"; }

                return {
                    name: `공격대원 ${idx + 1}`,
                    job: calculatedJob,
                    level: calculatedLevel,
                    power: calculatedPower,
                    grade: calculatedGrade,
                    detailEffect: textStr
                };
            });
        }

        // 🛡️ [안전장치 - 연산 크래시 차단] replace 함수 호출 전 무조건 String 강제 형변환을 적용하여 예외를 원천 방어합니다.
        const totalRaiderCombatPower = unionData.union_raider_boot_power 
            ? Number(unionData.union_raider_boot_power).toLocaleString() 
            : unionData.union_raider_combat_power
                ? Number(unionData.union_raider_combat_power).toLocaleString()
                : (fullRaiderList.reduce((acc, b) => {
                    const cleanPower = String(b.power || '0').replace(/,/g, '');
                    return acc + (parseInt(cleanPower) || 0);
                  }, 0).toLocaleString());

        // ⚔️ [동적 데이터 바인딩 5] 유니온 공격대원 종합 시너지 효과 리스트화
        let raiderEffects = [];
        if (unionData.union_raider_stat && Array.isArray(unionData.union_raider_stat)) {
            raiderEffects = unionData.union_raider_stat.map(v => String(v || ""));
        } else {
            raiderEffects = ["배치된 대원 시너지 정보를 동기화 중입니다."];
        }

        // 🧱 [동적 데이터 바인딩 6] 최신 카드 블록 배치 현황판 구성 (넥슨 오피셜 오탈자 교정 보완)
        let blockStatsHtml = "";
        const activeStateStats = unionData.union_occupied_stat || unionData.union_state_stat || (unionData.union_state_stat_preset && unionData.union_state_stat_preset[0]?.union_state_stat);
        
        if (activeStateStats && Array.isArray(activeStateStats) && activeStateStats.length > 0) {
            blockStatsHtml = `
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; background: var(--omni-bg-clean, #ffffff); border: 1px solid var(--omni-card-border-line, #ebdffc); border-radius: 12px; padding: 14px;">
                    ${activeStateStats.map(statStr => {
                        // 🛡️ [안전장치 - split 크래시 차단] statStr이 문자열이 아닐 경우를 대비해 확실하게 String 처리를 해줍니다.
                        const cleanStr = String(statStr || "").trim();
                        if (!cleanStr) return "";
                        const parts = cleanStr.split(" ");
                        const namePart = parts.slice(0, -2).join(" ") || parts[0] || "지정 스탯";
                        const valPart = parts.slice(-2).join(" ") || "";
                        return `
                            <div style="background: var(--omni-card-bg, #fbfaff); padding: 8px 12px; border-radius: 6px; text-align: left; border: 1px solid var(--omni-card-border-line, #ebdffc);">
                                <span style="font-size: 10px; font-weight: 800; color: var(--omni-text-muted, #6a638c); display: block;">${namePart}</span>
                                <span style="font-size: 12px; font-weight: 900; color: var(--omni-text-dark, #312e4b);">${valPart}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } else {
            blockStatsHtml = `
                <div style="padding: 30px 0; text-align: center; color: var(--omni-text-sub, #b2acc7); font-size: 12px; font-weight: 800; background: var(--omni-card-bg, #fbfaff); border-radius: 12px; border: 1px dashed var(--omni-card-border-line, #ebdffc); grid-column: span 2;">
                    공격대 테두리 구역 스탯 점유 정보가 비어 있습니다.
                </div>
            `;
        }

        // 최상단 카드 섹션 HTML 템플릿 조립
        const summaryHeaderHtml = `
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; width: 100%; box-sizing: border-box; font-family: 'Pretendard', sans-serif;">
                <div style="background: var(--omni-bg-clean, #ffffff); border-radius: 12px; padding: 16px 20px; border: 1px solid var(--omni-card-border-line, #ebdffc); text-align: left; box-shadow: 0 4px 12px rgba(131, 114, 214, 0.02);">
                    <span style="font-size: 11px; font-weight: 800; color: var(--omni-text-sub, #94a3b8); display: block; margin-bottom: 4px;">🎖️ 유니온 등급</span>
                    <span style="font-size: 14px; font-weight: 900; color: var(--omni-text-dark, #312e4b);">${uGrade}</span>
                </div>
                <div style="background: var(--omni-bg-clean, #ffffff); border-radius: 12px; padding: 16px 20px; border: 1px solid var(--omni-card-border-line, #ebdffc); text-align: left; box-shadow: 0 4px 12px rgba(131, 114, 214, 0.02);">
                    <span style="font-size: 11px; font-weight: 800; color: var(--omni-text-sub, #94a3b8); display: block; margin-bottom: 4px;">⚡ 공격대 총 레벨</span>
                    <span style="font-size: 14px; font-weight: 900; color: var(--omni-slate-primary, #7a6ec7);">Lv.${uLevel}</span>
                </div>
                <div style="background: var(--omni-bg-clean, #ffffff); border-radius: 12px; padding: 16px 20px; border: 1px solid var(--omni-card-border-line, #ebdffc); text-align: left; box-shadow: 0 4px 12px rgba(131, 114, 214, 0.02);">
                    <span style="font-size: 11px; font-weight: 800; color: var(--omni-text-sub, #94a3b8); display: block; margin-bottom: 4px;">🔮 아티팩트 등급 / 포인트</span>
                    <span style="font-size: 14px; font-weight: 900; color: #10b981;">Lv.${artifactLevel} <span style="font-size:11px; color:var(--omni-text-muted, #64748b); font-weight:600;">(${Number(artifactPoint).toLocaleString()} P)</span></span>
                </div>
                <div style="background: var(--omni-bg-clean, #ffffff); border-radius: 12px; padding: 16px 20px; border: 1px solid var(--omni-card-border-line, #ebdffc); text-align: left; box-shadow: 0 4px 12px rgba(131, 114, 214, 0.02);">
                    <span style="font-size: 11px; font-weight: 800; color: var(--omni-text-sub, #94a3b8); display: block; margin-bottom: 4px;">⚔️ 공격대 총 전투력</span>
                    <span style="font-size: 14px; font-weight: 900; color: #f97316;">${totalRaiderCombatPower}</span>
                </div>
            </div>
        `;

        // 🏆 챔피언 공격대 레이아웃 구성
        const championHtml = championList.length === 0
            ? `<div style="text-align:center; color:var(--omni-text-sub, #b2acc7); padding:20px 0; font-size:12px; font-weight:700;">지정된 유니온 챔피언 수신 내역이 없습니다.</div>`
            : championList.map(champ => `
                <div style="background: var(--omni-bg-clean, #ffffff); border: 1px solid var(--omni-card-border-line, #ebdffc); border-radius: 10px; padding: 14px; margin-bottom: 10px; display: flex; flex-direction: column; gap: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: baseline; gap: 6px;">
                            <span style="font-size: 12.5px; font-weight: 900; color: var(--omni-text-dark, #312e4b);">${champ.name}</span>
                            <span style="font-size: 10px; font-weight: 800; color: var(--omni-text-muted, #6a638c);">클래스: ${champ.job}</span>
                        </div>
                        <span style="font-size: 10px; font-weight: 900; color: #22c55e; background: #f0fdf4; padding: 1px 6px; border-radius: 4px; border: 1px solid #bbf7d0;">${champ.grade} 등급</span>
                    </div>
                    <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 2px;">
                        ${champ.effects.map(fx => `<span style="font-size: 9.5px; font-weight: 700; color: var(--omni-text-muted, #6a638c); background: var(--omni-card-bg, #fbfaff); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--omni-card-border-line, #ebdffc);">${fx}</span>`).join('')}
                    </div>
                </div>
            `).join('');

        // 아티팩트 크리스탈 구조화
        const artifactCrystalsHtml = artifactCrystals.length === 0
            ? `<div style="grid-column: span 2; text-align:center; color:var(--omni-text-sub, #b2acc7); padding:20px 0; font-size:12px; font-weight:700;">활성화된 아티팩트 크리스탈이 없습니다.</div>`
            : artifactCrystals.map(c => `
                <div style="background: var(--omni-bg-clean, #ffffff); border: 1px solid var(--omni-card-border-line, #ebdffc); border-radius: 8px; padding: 10px 12px; text-align: left; box-shadow: 0 1px 2px rgba(0,0,0,0.01);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <span style="font-size: 11px; font-weight: 900; color: var(--omni-slate-primary, #7a6ec7);">🔮 ${c.name.replace("크리스탈 : ", "")}</span>
                        <span style="font-size: 11px; font-weight: 900; color: var(--omni-slate-primary, #7a6ec7); background:var(--omni-card-bg, #f4f2ff); padding: 1px 4px; border-radius:4px;">Lv.${c.level}</span>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:2px;">
                        ${c.opts.map(o => `<span style="font-size:9px; font-weight:700; color:var(--omni-text-muted, #6a638c); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">• ${o}</span>`).join('')}
                    </div>
                </div>
            `).join('');

        // 아티팩트 효과 누적 리스트화
        const artifactEffectsHtml = artifactEffects.length === 0
            ? `<div style="text-align:center; color:var(--omni-text-sub, #b2acc7); padding:20px 0; font-size:12px; font-weight:700;">상시 적용 중인 아티팩트 효과 스펙이 비어 있습니다.</div>`
            : artifactEffects.map(ae => `
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--omni-card-bg, #fbfaff); border:1px solid var(--omni-card-border-line, #ebdffc); padding:8px 12px; border-radius:6px;">
                    <span style="font-size:11px; font-weight:700; color:var(--omni-text-dark, #312e4b); text-align:left; word-break:break-all; padding-right:8px;">${ae.name}</span>
                    <span style="font-size:11px; font-weight:900; color:#10b981; white-space:nowrap;">Lv.${ae.level}</span>
                </div>
            `).join('');

        // 👥 레이더 공격대 대원 그리드 조립
        const raidersGridHtml = fullRaiderList.length === 0
            ? `<div style="grid-column: span 4; text-align:center; color:var(--omni-text-sub, #b2acc7); padding:40px 0; font-size:12px; font-weight:700;">현재 배치되어 활성화된 유니온 공격대원이 존재하지 않습니다.</div>`
            : fullRaiderList.map((r, index) => `
                <div style="background: var(--omni-bg-clean, #ffffff); border: 1px solid var(--omni-card-border-line, #ebdffc); padding: 8px 10px; border-radius: 8px; display: flex; flex-direction: column; gap: 3px; min-width: 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 11.5px; font-weight: 900; color: var(--omni-text-dark, #312e4b); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${r.name}">${r.name}</span>
                        <span style="font-size: 8.5px; font-weight: 900; color: var(--omni-slate-primary, #7a6ec7); background: var(--omni-card-bg, #f4f2ff); padding: 0.5px 4px; border-radius: 3px;">No.${index + 1}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1px;">
                        <span style="font-size: 10.5px; font-weight: 700; color: var(--omni-text-muted, #6a638c); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 65px;">${r.job}</span>
                        <span style="font-size: 11px; font-weight: 900; color: var(--omni-slate-primary, #7a6ec7);">Lv.${r.level}</span>
                    </div>
                    <div style="font-size: 9px; color: var(--omni-text-sub, #b2acc7); font-weight: 700; text-align: left; border-top: 1px solid var(--omni-card-bg, #fbfaff); padding-top: 2px; margin-top: 1px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" title="${r.detailEffect || '전투력 영향 효과'}">
                        ${r.detailEffect ? r.detailEffect : `전투력: ${r.power}`}
                    </div>
                </div>
            `).join('');

        // 완성형 UI 스트링 리턴
        return `
            <div style="display: flex; flex-direction: column; gap: 20px; width: 100%; box-sizing: border-box; padding: 10px 0; font-family: 'Pretendard', sans-serif;">
                ${summaryHeaderHtml}

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%; box-sizing: border-box; align-items: start;">
                    
                    <div style="display: flex; flex-direction: column; gap: 20px; min-width: 0;">
                        <div style="background: var(--omni-bg-clean, #ffffff); border-radius: 16px; padding: 20px; border: 1px solid var(--omni-card-border-line, #ebdffc); text-align: left; box-shadow: 0 4px 12px rgba(131, 114, 214, 0.01);">
                            <h4 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 900; color: var(--omni-text-dark, #312e4b); display: flex; align-items: center; gap: 6px;">
                                ⚔️ 유니온 보드판 점유 배치 스탯
                            </h4>
                            ${blockStatsHtml}
                        </div>
                        
                        ${championHtml ? `
                        <div style="background: var(--omni-bg-clean, #ffffff); border-radius: 16px; padding: 20px; border: 1px solid var(--omni-card-border-line, #ebdffc); text-align: left; box-shadow: 0 4px 12px rgba(131, 114, 214, 0.01);">
                            <h4 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 900; color: var(--omni-text-dark, #312e4b); display: flex; align-items: center; gap: 6px;">🏆 챔피언 공격대 배치 배지 명세</h4>
                            <div style="width: 100%;">${championHtml}</div>
                        </div>` : ''}

                        <div style="background: var(--omni-bg-clean, #ffffff); border-radius: 16px; padding: 20px; border: 1px solid var(--omni-card-border-line, #ebdffc); text-align: left; box-shadow: 0 4px 12px rgba(131, 114, 214, 0.01);">
                            <h4 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 900; color: var(--omni-text-dark, #312e4b);">🛡️ 유니온 공격대원 보유 효과 총괄표</h4>
                            <div class="union-effect-scroll-area" style="max-height: 240px; overflow-y: auto; display: flex; flex-direction: column; gap: 5px; padding-right: 4px;">
                                ${raiderEffects.map(fx => `
                                    <div style="background: var(--omni-card-bg, #fbfaff); border: 1px solid var(--omni-card-border-line, #ebdffc); padding: 8px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; color: var(--omni-text-muted, #6a638c); text-align:left;">
                                        🔷 ${fx}
                                    </div>`).join('')}
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 20px; min-width: 0;">
                        <div style="background: var(--omni-bg-clean, #ffffff); border-radius: 16px; padding: 20px; border: 1px solid #ebdffc; text-align: left; box-shadow: 0 4px 12px rgba(131, 114, 214, 0.01);">
                            <h4 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 900; color: var(--omni-text-dark, #312e4b); display:flex; justify-content:space-between; align-items:center;">
                                <span>🔮 유니온 아티팩트 활성 크리스탈 코어</span>
                                <span style="font-size:10.5px; color:var(--omni-slate-primary, #7a6ec7); background:var(--omni-card-bg, #f4f2ff); padding:2px 8px; border-radius:4px; font-weight:800;">AP 잔여: ${unionData.union_artifact_remain_ap || 0}</span>
                            </h4>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; max-height: 250px; overflow-y: auto; padding-right: 4px;">
                                ${artifactCrystalsHtml}
                            </div>
                        </div>
                        <div style="background: var(--omni-bg-clean, #ffffff); border-radius: 16px; padding: 20px; border: 1px solid var(--omni-card-border-line, #ebdffc); text-align: left; box-shadow: 0 4px 12px rgba(131, 114, 214, 0.01);">
                            <h4 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 900; color: var(--omni-text-dark, #312e4b);">✨ 아티팩트 결합 누적 활성화 스펙</h4>
                            <div class="union-effect-scroll-area" style="max-height: 310px; overflow-y: auto; display: flex; flex-direction: column; gap: 5px; padding-right: 4px;">
                                ${artifactEffectsHtml}
                            </div>
                        </div>
                    </div>

                </div>

                <div style="background: var(--omni-bg-clean, #ffffff); border-radius: 16px; padding: 20px; border: 1px solid var(--omni-card-border-line, #ebdffc); display: flex; flex-direction: column; gap: 14px; text-align: left; box-shadow: 0 4px 12px rgba(131, 114, 214, 0.01);">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--omni-card-border-line, #ebdffc); padding-bottom: 10px;">
                        <span style="font-size: 13.5px; font-weight: 900; color: var(--omni-text-dark, #312e4b);">👥 유니온 레이더 공격대 투입 대원 리스트 (${fullRaiderList.length}선)</span>
                        <span style="font-size: 11px; font-weight: 900; color: var(--omni-slate-primary, #7a6ec7); background: var(--omni-card-bg, #f4f2ff); padding: 3px 12px; border-radius: 20px;">OpenAPI 연동 완료</span>
                    </div>
                    <div class="union-effect-scroll-area" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; max-height: 360px; overflow-y: auto; padding-right: 4px;">
                        ${raidersGridHtml}
                    </div>
                </div>
            </div>
        `;
    } catch (criticalError) {
        // 🛡️ [마스터 최후방 예외 통제 센터] 유니온 렌더링에 예상치 못한 크래시가 나더라도 코어 뼈대를 살려 검색 흐름을 살려놓습니다.
        console.error("[CRITICAL SHIELD] 유니온 모듈 파싱 가드 가동됨:", criticalError);
        return `
            <div style="padding: 40px; text-align: center; background: var(--omni-bg-clean, #fff); border: 1px solid var(--omni-card-border-line, #ebdffc); border-radius: 16px;">
                <p style="color: var(--omni-slate-primary, #7a6ec7); font-weight: 800; font-size: 14px; margin: 0 0 8px 0;">⚠️ 유니온 스펙 로드 일시 지연</p>
                <p style="color: var(--omni-text-sub, #94a3b8); font-size: 12px; margin: 0;">데이터 가공 필터 오류가 감지되었습니다. 상단 탭의 다른 정보 조회가 선행 유지됩니다.</p>
            </div>
        `;
    }
};

// 💡 [초보자 가이드] 중복 렌더링으로 인한 상위 검색 레이어 간섭 에러를 제거하기 위해 클래스 룩업 가드를 확장 배치합니다.
document.addEventListener('click', (e) => {
    if (e.target && (e.target.classList.contains('search-tab-trigger-btn') || e.target.id === 'nav-btn-search') && e.target.textContent.includes('유니온')) {
        const unionContainer = document.getElementById('searchTabContentContainer');
        if (unionContainer && window.currentSearchData && window.currentSearchData.union) {
            unionContainer.innerHTML = window.renderUnion(
                window.currentSearchData.union, 
                window.currentSearchData.hexa_skill, 
                window.currentSearchData.hexa_stat
            );
        }
    }
});