/**
 * ============================================================================
 * 👤 MAPLE OMNI - search_skill.js (스킬 종합 및 6차 재화 계산 모듈)
 * 설명: 링크 스킬, 6차 헥사 매트릭스 코어/스탯 데이터 파싱 및 실시간 재화 소모량 추적 시스템
 * 업데이트: 5차/6차 핵심 스펙업 코어 진행도(Progress) 추적 UI 전면 개편
 * ============================================================================
 */

/**
 * 💡 [내부 헬퍼] 6차 전직 코어 및 스탯 레벨을 기반으로 현재까지 소모한 솔 에르다/조각 계산
 */
window.calculateHexaSpends = function(hexaSkills, hexaStats) {
    let totalSolErda = 0;
    let totalFragments = 0;

    if (Array.isArray(hexaSkills)) {
        hexaSkills.forEach(core => {
            if (!core) return;
            const level = Number(core.hexa_core_level ?? core.hexa_skill_level ?? 0);
            const type = String(core.hexa_core_type || "");

            if (level <= 0) return;

            if (type.includes("스킬")) {
                totalSolErda += Math.floor(level * 4.8); 
                totalFragments += Math.floor(level * 143.3);
            } else if (type.includes("마스터리")) {
                totalSolErda += Math.floor(level * 1.9);
                totalFragments += Math.floor(level * 75.0);
            } else if (type.includes("강화")) {
                totalSolErda += Math.floor(level * 3.1);
                totalFragments += Math.floor(level * 112.7);
            } else {
                totalSolErda += Math.floor(level * 5.7);
                totalFragments += Math.floor(level * 163.3);
            }
        });
    }

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
 * 💡 [메인 렌더링 함수] 스킬 탭 대시보드 그리기
 */
window.renderSkill = function() {
    try {
        const data = window.currentSearchData;
        if (!data) {
            return `<div style="padding:60px; text-align:center; color:#94a3b8; font-weight:700; background:white; border-radius:20px;">🔮 검색 데이터 갱신 버튼을 눌러 스킬 정보를 불러와주세요.</div>`;
        }

        // 1️⃣ 링크 스킬 세팅
        const linkData = data.link_skill || {};
        const linkSets = [
            { name: "현재 장착", skills: linkData.character_link_skill || [] },
            { name: "프리셋 1", skills: linkData.character_link_skill_preset_1 || [] },
            { name: "프리셋 2", skills: linkData.character_link_skill_preset_2 || [] },
            { name: "프리셋 3", skills: linkData.character_link_skill_preset_3 || [] }
        ];

        window.showLinkPreset = function(index) {
            document.querySelectorAll('.link-preset-content').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.link-preset-tab').forEach(el => {
                el.style.background = '#f1f5f9';
                el.style.color = '#64748b';
                el.style.borderColor = '#e2e8f0';
            });
            const targetContent = document.getElementById(`link-preset-content-${index}`);
            const targetTab = document.getElementById(`link-preset-tab-${index}`);
            if (targetContent) targetContent.style.display = 'block';
            if (targetTab) {
                targetTab.style.background = '#eff6ff';
                targetTab.style.color = '#2563eb';
                targetTab.style.borderColor = '#bfdbfe';
            }
        };

        // 2️⃣ 6차 헥사 코어 세팅
        const hexaData = data.hexa_skill || {};
        const hexaSkills = Array.isArray(hexaData.character_hexa_core_equipment) ? hexaData.character_hexa_core_equipment : 
                           (Array.isArray(hexaData.character_hexa_skill_core) ? hexaData.character_hexa_skill_core : []); 

        // 3️⃣ 6차 헥사 스탯 세팅
        const hexaStatData = data.hexa_stat || {};
        const s1 = hexaStatData.character_hexa_stat_core;
        const s2 = hexaStatData.character_hexa_stat_core_2;
        const s3 = hexaStatData.character_hexa_stat_core_3;
        const hexaStats = [
            s1 ? (Array.isArray(s1) ? s1[0] : s1) : null,
            s2 ? (Array.isArray(s2) ? s2[0] : s2) : null,
            s3 ? (Array.isArray(s3) ? s3[0] : s3) : null
        ];

        // 4️⃣ 재화 소모량 계산
        const spends = window.calculateHexaSpends(hexaSkills, hexaStats);

        // 5️⃣ 전체 스킬에서 5차(V코어) 필터링 (불필요한 0~4차 제외, 오직 성장이 필요한 핵심 코어만 추출)
        const skillData = data.skill || {};
        const rawSkills = Array.isArray(skillData.character_skill) ? skillData.character_skill : [];
        const hexaFactNames = hexaSkills.map(h => h.hexa_core_name || h.hexa_skill_name).filter(Boolean);
        
        const vCores = [];
        rawSkills.forEach(s => {
            const n = (s.skill_name || "").toLowerCase();
            const level = Number(s.skill_level || 0);
            
            // 6차 스킬 제외 (헥사 배열에 있거나 VI 포함)
            if (hexaFactNames.includes(s.skill_name) || n.endsWith("vi") || n.includes("솔 야누스") || n.includes("솔 헤카테")) return;
            
            // 5차 코어 추출 조건: '강화'가 붙어있거나, 쓸만한/에르다/여신의축복 등 주요 5차 공용 키워드
            const isEnhanceCore = n.includes("강화");
            const isCommonVCore = ["쓸만한", "에르다", "스파이더 인 미러", "크레스트 오브 더 솔라", "여신의 축복", "로프 커넥트", "블링크", "오버로드 마나", "에테리얼 폼"].some(k => n.includes(k.toLowerCase()));
            
            if (level > 0 && (isEnhanceCore || isCommonVCore)) {
                vCores.push({
                    name: s.skill_name,
                    level: level,
                    icon: s.skill_icon,
                    // 5차 '강화' 코어는 만렙 60, 그 외 5차 액티브는 만렙 30
                    maxLevel: isEnhanceCore ? 60 : 30 
                });
            }
        });

        // ============================================================================
        // 🎨 [UI 스타일 가이드 & 렌더링 헬퍼]
        // ============================================================================
        const boxStyle = "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.02);";
        const titleStyle = "margin: 0 0 16px 0; font-size: 15px; font-weight: 900; color: #0f172a; display: flex; align-items: center; gap: 8px;";
        const scrollStyle = "max-height: 400px; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; padding-right: 6px;";

        // ✨ 핵심: 성장 진행도(Progress) 바 생성기
        const buildProgressBar = (currentLevel, maxLevel, colorHex) => {
            const percent = Math.min(100, (currentLevel / maxLevel) * 100);
            const isMax = currentLevel >= maxLevel;
            const remaining = maxLevel - currentLevel;

            return `
                <div style="margin-top: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 4px;">
                        <span style="font-size: 11px; font-weight: 800; color: ${isMax ? '#eab308' : '#64748b'};">
                            ${isMax ? '✨ MAX 달성' : `🚀 만렙까지 ${remaining}업 남음`}
                        </span>
                        <span style="font-size: 12px; font-weight: 900; color: ${isMax ? '#ca8a04' : '#0f172a'};">
                            Lv. ${currentLevel} <span style="font-size: 10px; color: #94a3b8; font-weight: 700;">/ ${maxLevel}</span>
                        </span>
                    </div>
                    <div style="width: 100%; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);">
                        <div style="width: ${percent}%; height: 100%; background: ${isMax ? 'linear-gradient(90deg, #fde047, #eab308)' : colorHex}; border-radius: 4px; transition: width 0.5s ease-out;"></div>
                    </div>
                </div>
            `;
        };

        // ============================================================================
        // 🏛️ [대시보드 메인 뷰 컴포넌트 마운트]
        // ============================================================================
        return `
            <div style="display: flex; flex-direction: column; gap: 24px; width: 100%; box-sizing: border-box; padding: 10px 0;">
                
                <div style="display: flex; gap: 12px;">
                    <div style="flex: 1; background: #fff7ed; border: 1px solid #ffedd5; padding: 12px 16px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between;">
                        <span style="font-size: 12px; font-weight: 800; color: #c2410c;">🔥 누적 솔 에르다</span>
                        <span style="font-size: 14px; font-weight: 900; color: #9a3412;">${spends.solErda.toLocaleString()} 개</span>
                    </div>
                    <div style="flex: 1; background: #eef2ff; border: 1px solid #e0e7ff; padding: 12px 16px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between;">
                        <span style="font-size: 12px; font-weight: 800; color: #4338ca;">💎 누적 에르다 조각</span>
                        <span style="font-size: 14px; font-weight: 900; color: #3730a3;">${spends.fragments.toLocaleString()} 개</span>
                    </div>
                </div>

                <div style="${boxStyle}">
                    <h3 style="${titleStyle}">
                        <span style="font-size: 18px;">🔷</span> 6차 HEXA 코어 성장 현황
                        <span style="font-size: 11px; color: #7e22ce; background: #f3e8ff; padding: 2px 8px; border-radius: 10px; font-weight: 800;">활성 ${hexaSkills.length}개</span>
                    </h3>
                    <div class="compact-scroll-list" style="${scrollStyle.replace('grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));', 'grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));')}">
                        ${hexaSkills.length > 0 ? hexaSkills.map(h => {
                            if (!h) return '';
                            const hName = h.hexa_core_name || h.hexa_skill_name || "알 수 없는 코어";
                            const hType = h.hexa_core_type || "6차 코어";
                            const hLevel = Number(h.hexa_core_level !== undefined ? h.hexa_core_level : (h.hexa_skill_level || 0));

                            // 💡 핵심 수정: 이름 공백/대소문자/부분 일치를 허용하여 아이콘 매칭률 강화
                            const skillMatch = rawSkills.find(s => 
                                (s.skill_name || "").trim() === hName.trim() || 
                                (s.skill_name || "").toLowerCase().includes(hName.toLowerCase().replace("vi", "").trim()) ||
                                hName.toLowerCase().includes((s.skill_name || "").toLowerCase().replace("vi", "").trim())
                            );
                            const hIcon = (skillMatch ? skillMatch.skill_icon : null) || h.hexa_core_icon || '';
                            
                            return `
                            <div style="background: #ffffff; border: 1px solid #e0e7ff; padding: 12px; border-radius: 16px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.05);">
                                <div style="display: flex; gap: 10px; align-items: center;">
                                    <div style="width: 40px; height: 40px; background: #f5f3ff; border: 1px solid #c7d2fe; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden;">
                                        ${hIcon ? `<img src="${hIcon}" style="max-width: 85%; max-height: 85%; object-fit: contain;">` : '<div style="font-size: 16px;">💠</div>'}
                                    </div>
                                    <div style="display: flex; flex-direction: column; min-width: 0;">
                                        <span style="font-size: 12px; font-weight: 900; color: #312e81; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${hName}">${hName}</span>
                                        <span style="font-size: 9px; color: #6366f1; font-weight: 800;">${hType}</span>
                                    </div>
                                </div>
                                ${buildProgressBar(hLevel, 30, '#6366f1')}
                            </div>`;
                        }).join('') : `<div style="grid-column: 1/-1; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">활성화된 6차 코어가 없습니다.</div>`}
                    </div>
                </div>

                <div style="${boxStyle}">
                    <h3 style="${titleStyle}">
                        <span style="font-size: 18px;">🔶</span> 5차 V-코어 & 강화 진행 현황
                        <span style="font-size: 11px; color: #c2410c; background: #ffedd5; padding: 2px 8px; border-radius: 10px; font-weight: 800;">주요 코어 ${vCores.length}개</span>
                    </h3>
                    <div class="compact-scroll-list" style="${scrollStyle.replace('grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));', 'grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));')}">
                        ${vCores.length > 0 ? vCores.map(v => `
                            <div style="background: #ffffff; border: 1px solid #fecaca; padding: 12px; border-radius: 16px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 2px 8px rgba(225, 29, 72, 0.05);">
                                <div style="display: flex; gap: 10px; align-items: center;">
                                    ${v.icon ? `<div style="width: 40px; height: 40px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"><img src="${v.icon}" style="max-width: 80%; max-height: 80%; object-fit: contain;"></div>` : ''}
                                    <div style="display: flex; flex-direction: column; min-width: 0; flex-grow: 1;">
                                        <span style="font-size: 12px; font-weight: 900; color: #991b1b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${v.name}">${v.name}</span>
                                        <span style="font-size: 9px; color: #ef4444; font-weight: 800;">${v.maxLevel === 60 ? '강화 코어' : '스킬 코어'}</span>
                                    </div>
                                </div>
                                ${buildProgressBar(v.level, v.maxLevel, '#e11d48')}
                            </div>
                        `).join('') : `<div style="grid-column: 1/-1; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">주요 5차 코어 데이터가 없습니다.</div>`}
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div style="${boxStyle} display: flex; flex-direction: column; height: 100%;">
                        <h3 style="${titleStyle}">📊 HEXA 스탯 코어 (Max 20)</h3>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; flex-grow: 1;">
                            ${[0, 1, 2].map((idx) => {
                                const stat = hexaStats[idx];
                                if (!stat) {
                                    return `
                                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 8px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; height: 100%; box-sizing: border-box;">
                                            <span style="font-size: 11px; font-weight: 800;">슬롯 #${idx + 1}</span>
                                            <span style="font-size: 10px;">데이터 없음</span>
                                        </div>
                                    `;
                                }

                                const grade = stat.stat_grade || '-';
                                const mainName = stat.main_stat_name || '미설정';
                                const mainLvl = Number(stat.main_stat_level || 0);
                                const sub1Lvl = Number(stat.sub_stat_level_1 || 0);
                                const sub2Lvl = Number(stat.sub_stat_level_2 || 0);
                                const sub1Name = stat.sub_stat_name_1 || '부가1';
                                const sub2Name = stat.sub_stat_name_2 || '부가2';

                                return `
                                    <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 12px 8px; border-radius: 12px; display: flex; flex-direction: column; gap: 6px; box-sizing: border-box;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
                                            <span style="font-size: 10px; font-weight: 900; color: #334155;">#${idx + 1}</span>
                                            <span style="font-size: 9px; font-weight: 800; color: #7e22ce;">${grade}</span>
                                        </div>
                                        <div style="display: flex; flex-direction: column; gap: 3px;">
                                            <div style="display: flex; justify-content: space-between;"><span style="font-size: 9px; color: #475569;">${mainName}</span><span style="font-size: 9px; font-weight: 900; color: #f97316;">Lv.${mainLvl}</span></div>
                                            <div style="display: flex; justify-content: space-between;"><span style="font-size: 9px; color: #475569;">${sub1Name}</span><span style="font-size: 9px; font-weight: 900; color: #3b82f6;">Lv.${sub1Lvl}</span></div>
                                            <div style="display: flex; justify-content: space-between;"><span style="font-size: 9px; color: #475569;">${sub2Name}</span><span style="font-size: 9px; font-weight: 900; color: #22c55e;">Lv.${sub2Lvl}</span></div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 11px; font-weight: 800; color: #64748b;">현재 HEXA 스탯 총합</span>
                            <span style="font-size: 13px; font-weight: 900; color: #0f172a;">${hexaStats.reduce((acc, s) => acc + (s ? Number(s.main_stat_level || 0) + Number(s.sub_stat_level_1 || 0) + Number(s.sub_stat_level_2 || 0) : 0), 0)} Lv.</span>
                        </div>
                    </div>

                    <div style="${boxStyle} display: flex; flex-direction: column;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <h3 style="${titleStyle.replace('margin: 0 0 16px 0;', 'margin: 0;')}">🔗 링크 스킬 장착 현황</h3>
                        </div>
                        <div style="display: flex; gap: 4px; margin-bottom: 16px; flex-wrap: wrap;">
                            ${linkSets.map((set, i) => `
                                <button id="link-preset-tab-${i}" class="link-preset-tab" onclick="window.showLinkPreset(${i})" style="cursor: pointer; padding: 6px 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 11px; font-weight: 800; transition: all 0.2s; ${i === 0 ? 'background: #eff6ff; color: #2563eb; border-color: #bfdbfe;' : 'background: #f8fafc; color: #64748b;'}">
                                    ${set.name}
                                </button>
                            `).join('')}
                        </div>
                        <div style="flex-grow: 1;">
                            ${linkSets.map((set, i) => `
                                <div id="link-preset-content-${i}" class="link-preset-content" style="display: ${i === 0 ? 'block' : 'none'}; height: 100%;">
                                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 8px; align-content: start;">
                                        ${set.skills.length > 0 ? set.skills.map(l => `
                                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                                                ${l.skill_icon ? `<div style="width: 32px; height: 32px; background: white; border-radius: 6px; display: flex; align-items: center; justify-content: center;"><img src="${l.skill_icon}" style="max-width: 90%; max-height: 90%; object-fit: contain;"></div>` : ''}
                                                <div style="font-size: 9px; font-weight: 800; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; text-align: center;" title="${l.skill_name}">${l.skill_name}</div>
                                                <div style="font-size: 8px; color: #4338ca; background: #e0e7ff; padding: 1px 6px; border-radius: 4px; font-weight: 900;">Lv.${l.skill_level}</div>
                                            </div>
                                        `).join('') : `<div style="grid-column: 1/-1; padding: 30px 0; text-align: center; color: #94a3b8; font-size: 11px; font-weight: 700;">비어 있음</div>`}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

            </div>
        `;
    } catch (err) {
        console.error("스킬 탭 렌더링 중 에러 발생:", err);
        return `
            <div style="padding: 40px; text-align: center; background: white; border-radius: 16px; border: 1px solid #fda4af;">
                <div style="font-size: 40px; margin-bottom: 12px;">⚠️</div>
                <div style="color: #e11d48; font-weight: 800; font-size: 15px;">스킬 모듈 데이터 매핑 도중 예외 에러가 일어났습니다.</div>
                <div style="color: #64748b; font-size: 12px; margin-top: 6px; font-family: monospace;">에러 사유: ${err.message}</div>
            </div>
        `;
    }
};