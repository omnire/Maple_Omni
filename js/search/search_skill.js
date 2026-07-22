/**
 * ============================================================================
 * 👤 MAPLE OMNI - search_skill.js [HEXA CORE & STAT MASTER FIX - DARK MODE]
 * 설명: 링크 스킬, 6차 헥사 매트릭스 코어, 3중 스탯 코어 정밀 데이터 동기화 모듈
 * 수정사양: 
 * 1. 유니온 탭과 스킬 탭 간의 재화 수식 불일치 결함 전면 동기화 보정 완료
 * 2. renderSkill 실행 시마다 전역 함수가 불필요하게 중복 재할당되던 스코프 누수 원천 제거
 * 3. 눈이 편안한 프리미엄 다크 모드 테마 적용 (눈부심 방지 가독성 업그레이드)
 * 규칙: 초보도 구조를 명확히 파악할 수 있도록 전체 알고리즘과 수식에 주석을 상세히 서술
 * ============================================================================
 */

/**
 * 💡 [초보자 가이드] 6차 전직 코어 장비의 실시간 단계를 기반으로 인게임 소모 누적 재화를 정확히 역산하는 통합 수식 공유 모델입니다.
 * @param {Array} hexaSkills - 캐릭터가 현재 장착 완료한 6차 헥사 스킬 코어 리스트
 * @param {Array} hexaStats - 3개 슬롯 매트릭스 내부의 스탯 코어 적재 현황 배열
 */
window.calculateHexaSpends = function(hexaSkills, hexaStats) {
    let totalSolErda = 0;
    let totalFragments = 0;

    // 1️⃣ 6차 헥사 스킬 코어별 단계별 소모량 역산 루프 가동 (search_union.js의 인게임 정밀 수식과 완벽 동기화)
    if (Array.isArray(hexaSkills)) {
        hexaSkills.forEach(core => {
            if (!core) return;
            // OpenAPI 사양 다변화에 대응하기 위해 널 병합 연산자(??)로 현재 활성 단계를 교정 파싱합니다.
            const level = parseInt(core.hexa_core_level ?? core.hexa_skill_level ?? 0);
            const type = String(core.hexa_core_type || "스킬 코어");

            if (level <= 1) return; // 1레벨은 활성화 기본 단계이므로 스킵합니다.

            // 2레벨 업그레이드 단계부터 최종 달성 레벨까지 순회하며 메이플 공식 필요 재화 수치 테이블을 정밀 가산합니다.
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
                } else { // 공용 코어 (솔 야누스 메타 계열 노드 등)
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

    // 2️⃣ 6차 헥사 스탯 슬롯 투자 상태를 정밀 스캔하여 코어 개방 및 파츠 조각 누적 비용을 결합 산출합니다.
    if (Array.isArray(hexaStats)) {
        hexaStats.forEach(stat => {
            if (!stat) return;
            const mainLvl = Number(stat.main_stat_level || 0);
            const sub1Lvl = Number(stat.sub_stat_level_1 || 0);
            const sub2Lvl = Number(stat.sub_stat_level_2 || 0);

            // 단 한 줄의 스탯이라도 개방 흔적이 포착되면 기본 개방 에르다 5개 및 레벨당 조각 가중치를 자동 합산합니다.
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
 * 💡 [초보자 가이드] 다크모드 대응 프리셋 탭 스위칭 엔진입니다.
 */
window.showLinkPreset = function(index) {
    document.querySelectorAll('.link-preset-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.link-preset-tab').forEach(el => {
        el.style.background = '#1e293b';
        el.style.color = '#94a3b8';
        el.style.borderColor = '#334155';
    });
    
    const targetContent = document.getElementById(`link-preset-content-${index}`);
    const targetTab = document.getElementById(`link-preset-tab-${index}`);
    if (targetContent) targetContent.style.display = 'block';
    if (targetTab) {
        targetTab.style.background = '#2e1065';
        targetTab.style.color = '#c084fc';
        targetTab.style.borderColor = '#6b21a8';
    }
};

/**
 * 💡 [메인 렌더링 함수] 스킬 탭 대시보드 그리기 브릿지 본체 내부 코어 수복판 (다크모드 전용 서식 설계)
 */
window.renderSkill = function() {
    try {
        const data = window.currentSearchData;
        if (!data) {
            return `<div style="padding:60px; text-align:center; color:#64748b; font-weight:700; background:#1e293b; border-radius:20px; border: 1px solid #334155;">🔮 검색 데이터 갱신 버튼을 눌러 스킬 정보를 불러와주세요.</div>`;
        }

        // 1️⃣ 데이터 버퍼 레이어 로드 및 구조 분해 바인딩 진행
        const linkData = data.link_skill || {};
        const hexaData = data.hexa_skill || {};
        const hexaStatData = data.hexa_stat || {};
        const skillData = data.skill || {}; 

        const linkSets = [
            { name: "현재 장착", skills: linkData.character_link_skill || [] },
            { name: "프리셋 1", skills: linkData.character_link_skill_preset_1 || [] },
            { name: "프리셋 2", skills: linkData.character_link_skill_preset_2 || [] },
            { name: "프리셋 3", skills: linkData.character_link_skill_preset_3 || [] }
        ];

        // 2️⃣ 6차 코어 데이터 자동 감지 및 추출 파이프라인 가동
        let hexaSkills = [];
        Object.keys(hexaData).forEach(key => {
            if (Array.isArray(hexaData[key])) {
                hexaSkills = hexaData[key];
            } else if (hexaData[key] && typeof hexaData[key] === 'object') {
                Object.values(hexaData[key]).forEach(val => {
                    if (Array.isArray(val)) hexaSkills = val;
                });
            }
        });

        // 3️⃣ [중요 교정 패치] 6차 헥사 스탯 코어 슬롯 데이터 매핑 전면 재구조화 (3개 인덱스 트랙 완벽 복원)
        const rawStatCoreData = hexaStatData.character_hexa_stat_core;
        let hexaStats = [null, null, null];
        
        if (Array.isArray(rawStatCoreData)) {
            rawStatCoreData.forEach(slot => {
                const slotId = parseInt(slot.slot_id ?? 0);
                if (slotId >= 0 && slotId <= 2) {
                    hexaStats[slotId] = slot;
                }
            });
        } else if (rawStatCoreData && typeof rawStatCoreData === 'object') {
            const slotId = parseInt(rawStatCoreData.slot_id ?? 0);
            if (slotId >= 0 && slotId <= 2) {
                hexaStats[slotId] = rawStatCoreData;
            }
        }

        // 4️⃣ 사전에 정의된 재화 정산 수식 헬퍼 함수를 통한 최종 통계 연산 (유니온 페이지와 완벽 일치)
        const spends = window.calculateHexaSpends(hexaSkills, hexaStats);

        // 5️⃣ 전체 스킬 테이블로부터 성장이 수반되는 핵심 5차 V코어 필터링 전수조사
        const rawSkills = Array.isArray(skillData.character_skill) ? skillData.character_skill : [];
        const hexaFactNames = hexaSkills.map(h => h.hexa_core_name || h.hexa_skill_name).filter(Boolean);
        
        const vCores = [];
        rawSkills.forEach(s => {
            const n = (s.skill_name || "").toLowerCase();
            const level = Number(s.skill_level || 0);
            
            if (hexaFactNames.includes(s.skill_name) || n.endsWith("vi") || n.includes("솔 야누스") || n.includes("솔 헤카테")) return;
            
            const isEnhanceCore = n.includes("강화");
            const isCommonVCore = ["쓸만한", "에르다", "스파이더 인 미러", "크레스트 오브 더 솔라", "여신의 축복", "로프 커넥트", "블링크", "오버로드 마나", "에테리얼 폼"].some(k => n.includes(k.toLowerCase()));
            
            if (level > 0 && (isEnhanceCore || isCommonVCore)) {
                vCores.push({
                    name: s.skill_name,
                    level: level,
                    icon: s.skill_icon,
                    maxLevel: isEnhanceCore ? 60 : 30 
                });
            }
        });

        // 6️⃣ 반응형 진행바 컴포넌트 마크업 구조 생성기 선언 (다크모드 최적화 색상 반영)
        const buildProgressBar = (currentLevel, maxLevel, colorHex) => {
            const percent = Math.min(100, (currentLevel / maxLevel) * 100);
            const isMax = currentLevel >= maxLevel;
            const remaining = maxLevel - currentLevel;

            return `
                <div style="margin-top: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 4px;">
                        <span style="font-size: 11px; font-weight: 800; color: ${isMax ? '#f59e0b' : '#94a3b8'};">
                            ${isMax ? '✨ MAX 달성' : `🚀 만렙까지 ${remaining}업 남음`}
                        </span>
                        <span style="font-size: 12px; font-weight: 900; color: ${isMax ? '#fbbf24' : '#e2e8f0'};">
                            Lv. ${currentLevel} <span style="font-size: 10px; color: #64748b; font-weight: 700;">/ ${maxLevel}</span>
                        </span>
                    </div>
                    <div style="width: 100%; height: 8px; background: #334155; border-radius: 4px; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,0.2);">
                        <div style="width: ${percent}\%; height: 100\%; background:${isMax ? 'linear-gradient(90deg, #fbbf24, #f59e0b)' : colorHex}; border-radius: 4px; transition: width 0.5s ease-out;"></div>
                    </div>
                </div>
            `;
        };

        const boxStyle = "background: #1e293b; border: 1px solid #334155; border-radius: 20px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);";
        const titleStyle = "margin: 0 0 16px 0; font-size: 15px; font-weight: 900; color: #f8fafc; display: flex; align-items: center; gap: 8px;";
        const gridScrollStyle = "max-height: 400px; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; padding-right: 6px;";

        return `
            <div style="display: flex; flex-direction: column; gap: 24px; width: 100%; box-sizing: border-box; padding: 10px 0;">
                
                <div style="display: flex; gap: 12px;">
                    <div style="flex: 1; background: #2a1b10; border: 1px solid #45220f; padding: 12px 16px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between;">
                        <span style="font-size: 12px; font-weight: 800; color: #ea580c;">🔥 누적 솔 에르다 소모량</span>
                        <span style="font-size: 14px; font-weight: 900; color: #ff9800;">${spends.solErda.toLocaleString()} 개</span>
                    </div>
                    <div style="flex: 1; background: #131836; border: 1px solid #1e295d; padding: 12px 16px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between;">
                        <span style="font-size: 12px; font-weight: 800; color: #818cf8;">💎 누적 에르다 조각 소모량</span>
                        <span style="font-size: 14px; font-weight: 900; color: #a5b4fc;">${spends.fragments.toLocaleString()} 개</span>
                    </div>
                </div>

                <div style="${boxStyle}">
                    <h3 style="${titleStyle}">
                        <span style="font-size: 18px;">🔷</span> 6차 HEXA 코어 성장 현황
                        <span style="font-size: 11px; color: #c084fc; background: #2e1065; padding: 2px 8px; border-radius: 10px; font-weight: 800; border: 1px solid #6b21a8;">활성 ${hexaSkills.length}개</span>
                    </h3>
                    <div class="omni-skill-scroll-grid" style="${gridScrollStyle}">
                        ${hexaSkills.length > 0 ? hexaSkills.map(h => {
                            if (!h) return '';
                            const hName = h.hexa_core_name || h.hexa_skill_name || "알 수 없는 코어";
                            const hType = h.hexa_core_type || "6차 코어";
                            const hLevel = Number(h.hexa_core_level !== undefined ? h.hexa_core_level : (h.hexa_skill_level || 0));

                            const skillMatch = rawSkills.find(s => 
                                (s.skill_name || "").trim() === hName.trim() || 
                                (s.skill_name || "").toLowerCase().includes(hName.toLowerCase().replace("vi", "").trim()) ||
                                hName.toLowerCase().includes((s.skill_name || "").toLowerCase().replace("vi", "").trim())
                            );
                            const hIcon = (skillMatch ? skillMatch.skill_icon : null) || h.hexa_core_icon || '';
                            
                            return `
                            <div style="background: #111827; border: 1px solid #1f2937; padding: 12px; border-radius: 16px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);">
                                <div style="display: flex; gap: 10px; align-items: center;">
                                    <div style="width: 40px; height: 40px; background: #1f2937; border: 1px solid #374151; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden;">
                                        ${hIcon ? `<img src="${hIcon}" style="max-width: 85%; max-height: 85%; object-fit: contain;">` : '<div style="font-size: 16px;">💠</div>'}
                                    </div>
                                    <div style="display: flex; flex-direction: column; min-width: 0; text-align: left;">
                                        <span style="font-size: 12px; font-weight: 900; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${hName}">${hName}</span>
                                        <span style="font-size: 9px; color: #818cf8; font-weight: 800;">${hType}</span>
                                    </div>
                                </div>
                                ${buildProgressBar(hLevel, 30, '#6366f1')}
                            </div>`;
                        }).join('') : `<div style="grid-column: 1/-1; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">활성화된 6차 코어가 없습니다.</div>`}
                    </div>
                </div>

                <div style="${boxStyle}">
                    <h3 style="${titleStyle}">
                        <span style="font-size: 18px;">🔶</span> 5차 V-코어 & 강화 진행 현황
                        <span style="font-size: 11px; color: #f87171; background: #4c0519; padding: 2px 8px; border-radius: 10px; font-weight: 800; border: 1px solid #991b1b;">주요 코어 ${vCores.length}개</span>
                    </h3>
                    <div class="omni-skill-scroll-grid" style="${gridScrollStyle}">
                        ${vCores.length > 0 ? vCores.map(v => `
                            <div style="background: #111827; border: 1px solid #27272a; padding: 12px; border-radius: 16px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);">
                                <div style="display: flex; gap: 10px; align-items: center;">
                                    ${v.icon ? `<div style="width: 40px; height: 40px; background: #1f2937; border: 1px solid #374151; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow:hidden;"><img src="${v.icon}" style="max-width: 80%; max-height: 80%; object-fit: contain;"></div>` : ''}
                                    <div style="display: flex; flex-direction: column; min-width: 0; flex-grow: 1; text-align: left;">
                                        <span style="font-size: 12px; font-weight: 900; color: #fecaca; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${v.name}">${v.name}</span>
                                        <span style="font-size: 9px; color: #f87171; font-weight: 800;">${v.maxLevel === 60 ? '강화 코어' : '스킬 코어'}</span>
                                    </div>
                                </div>
                                ${buildProgressBar(v.level, v.maxLevel, '#e11d48')}
                            </div>
                        `).join('') : `<div style="grid-column: 1/-1; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">주요 5차 코어 데이터가 없습니다.</div>`}
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%; box-sizing: border-box;">
                    
                    <div style="${boxStyle} display: flex; flex-direction: column; height: 100%; box-sizing: border-box;">
                        <h3 style="${titleStyle}">📊 HEXA 스탯 코어 (Max 20)</h3>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; flex-grow: 1;">
                            ${[0, 1, 2].map((idx) => {
                                const stat = hexaStats[idx];
                                if (!stat) {
                                    return `
                                        <div style="background: #111827; border: 1px solid #1f2937; padding: 12px 8px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #4b5563; height: 100%; box-sizing: border-box;">
                                            <span style="font-size: 11px; font-weight: 800;">슬롯 #${idx + 1}</span>
                                            <span style="font-size: 10px; margin-top:4px;">개방 안됨</span>
                                        </div>
                                    `;
                                }

                                const mainName = stat.main_stat_name || '미설정';
                                const mainLvl = Number(stat.main_stat_level || 0);
                                const sub1Lvl = Number(stat.sub_stat_level_1 || 0);
                                const sub2Lvl = Number(stat.sub_stat_level_2 || 0);
                                const sub1Name = stat.sub_stat_name_1 || '부가1';
                                const sub2Name = stat.sub_stat_name_2 || '부가2';

                                return `
                                    <div style="background: #111827; border: 1px solid #1f2937; padding: 12px 8px; border-radius: 12px; display: flex; flex-direction: column; gap: 6px; box-sizing: border-box;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1f2937; padding-bottom: 4px;">
                                            <span style="font-size: 10px; font-weight: 900; color: #94a3b8;">#${idx + 1} 슬롯</span>
                                            <span style="font-size: 8.5px; font-weight: 800; color: #c084fc; background:#2e1065; padding:1px 4px; border-radius:4px; border: 1px solid #6b21a8;">확정</span>
                                        </div>
                                        <div style="display: flex; flex-direction: column; gap: 3px; text-align: left;">
                                            <div style="display: flex; justify-content: space-between; gap:4px;"><span style="font-size: 9px; color: #cbd5e1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${mainName}</span><span style="font-size: 9px; font-weight: 900; color: #fb923c; flex-shrink:0;">Lv.${mainLvl}</span></div>
                                            <div style="display: flex; justify-content: space-between; gap:4px;"><span style="font-size: 9px; color: #cbd5e1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${sub1Name}</span><span style="font-size: 9px; font-weight: 900; color: #60a5fa; flex-shrink:0;">Lv.${sub1Lvl}</span></div>
                                            <div style="display: flex; justify-content: space-between; gap:4px;"><span style="font-size: 9px; color: #cbd5e1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${sub2Name}</span><span style="font-size: 9px; font-weight: 900; color: #4ade80; flex-shrink:0;">Lv.${sub2Lvl}</span></div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #334155; display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 11px; font-weight: 800; color: #94a3b8;">현재 HEXA 스탯 레벨 총합</span>
                            <span style="font-size: 13px; font-weight: 900; color: #f8fafc;">${hexaStats.reduce((acc, s) => acc + (s ? Number(s.main_stat_level || 0) + Number(s.sub_stat_level_1 || 0) + Number(s.sub_stat_level_2 || 0) : 0), 0)} Lv.</span>
                        </div>
                    </div>

                    <div style="${boxStyle} display: flex; flex-direction: column; box-sizing: border-box;">
                        <h3 style="${titleStyle}">🔗 링크 스킬 장착 현황</h3>
                        <div style="display: flex; gap: 4px; margin-bottom: 16px; flex-wrap: wrap;">
                            ${linkSets.map((set, i) => `
                                <button id="link-preset-tab-${i}" class="link-preset-tab" onclick="window.showLinkPreset(${i})" style="cursor: pointer; padding: 6px 12px; border-radius: 8px; border: 1px solid #334155; font-size: 11px; font-weight: 800; transition: all 0.2s; ${i === 0 ? 'background: #2e1065; color: #c084fc; border-color: #6b21a8;' : 'background: #1e293b; color: #94a3b8;'}">
                                    ${set.name}
                                </button>
                            `).join('')}
                        </div>
                        <div style="flex-grow: 1;">
                            ${linkSets.map((set, i) => `
                                <div id="link-preset-content-${i}" class="link-preset-content" style="display: ${i === 0 ? 'block' : 'none'}; height: 100%;">
                                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 8px; align-content: start;">
                                        ${set.skills.length > 0 ? set.skills.map(l => `
                                            <div style="background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 8px; display: flex; flex-direction: column; align-items: center; gap: 6px; box-sizing: border-box;">
                                                ${l.skill_icon ? `<div style="width: 32px; height: 32px; background: #1f2937; border-radius: 6px; display: flex; align-items: center; justify-content: center; border: 1px solid #374151;"><img src="${l.skill_icon}" style="max-width: 90%; max-height: 90%; object-fit: contain;"></div>` : ''}
                                                <div style="font-size: 9px; font-weight: 800; color: #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; text-align: center;" title="${l.skill_name}">${l.skill_name}</div>
                                                <div style="font-size: 8px; color: #c084fc; background: #2e1065; padding: 1px 6px; border-radius: 4px; font-weight: 900; border: 1px solid #6b21a8;">Lv.${l.skill_level}</div>
                                            </div>
                                        `).join('') : `<div style="grid-column: 1/-1; padding: 30px 0; text-align: center; color: #64748b; font-size: 11px; font-weight: 700;">비어 있음</div>`}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

            </div>
        `;
    } catch (err) {
        console.error("스킬 탭 렌더링 중 크리티컬 에러 확인:", err);
        return `
            <div style="padding: 40px; text-align: center; background: #1e293b; border-radius: 16px; border: 1px solid #f43f5e;">
                <div style="font-size: 40px; margin-bottom: 12px;">⚠️</div>
                <div style="color: #f43f5e; font-weight: 800; font-size: 15px;">스킬 모듈 데이터 매핑 도중 예외 에러가 일어났습니다.</div>
                <div style="color: #94a3b8; font-size: 12px; margin-top: 6px; font-family: monospace;">에러 사유: ${err.message}</div>
            </div>
        `;
    }
};