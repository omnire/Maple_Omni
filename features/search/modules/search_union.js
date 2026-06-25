/**
 * ============================================================================
 * 👤 MAPLE OMNI - search_union.js (유니온 종합 렌더링 모듈)
 * 설명: 넥슨 오픈 API의 프리셋 스탯 데이터를 오차 없이 정밀 파싱하여 출력합니다.
 * 디자인: 미니멀 테크 라이트 시안 적용 (압축된 너비, 노보더 트랙 스타일)
 * 보정 사항: 넥슨 API의 리얼 한글 데이터 매칭 및 소수점 파싱 결함 완벽 해결
 * ============================================================================
 */

// 프리셋 스위칭 시 원본 데이터를 안전하게 재참조할 수 있도록 전역 저장소를 선언합니다.
window.lastRenderedUnion = null;

/**
 * 💡 [초보자 가이드] 유니온 등급 이름을 매개변수로 받아서 그에 맞는 테마 이미지 경로를 반환합니다.
 * @param {string} grade - 넥슨 API에서 제공하는 유니온 등급 명칭
 * @returns {string} 테마 이미지 파일 경로 주소
 */
window.getUnionGradeIcon = function(grade) {
    const gradeMap = {
        "노비스 유니온 1": "icon/Union/novice1.jpg", "노비스 유니온 2": "icon/Union/novice2.jpg", "노비스 유니온 3": "icon/Union/novice3.jpg", "노비스 유니온 4": "icon/Union/novice4.jpg", "노비스 유니온 5": "icon/Union/novice5.jpg",
        "베테랑 유니온 1": "icon/Union/veteran1.jpg", "베테랑 유니온 2": "icon/Union/veteran2.jpg", "베테랑 유니온 3": "icon/Union/veteran3.jpg", "베테랑 유니온 4": "icon/Union/veteran4.jpg", "베테랑 유니온 5": "icon/Union/veteran5.jpg",
        "마스터 유니온 1": "icon/Union/master1.jpg", "마스터 유니온 2": "icon/Union/master2.jpg", "마스터 유니온 3": "icon/Union/master3.jpg", "마스터 유니온 4": "icon/Union/master4.jpg", "마스터 유니온 5": "icon/Union/master5.jpg",
        "그랜드 마스터 유니온 1": "icon/Union/grandmaster1.jpg", "그랜드 마스터 유니온 2": "icon/Union/grandmaster2.jpg", "그랜드 마스터 유니온 3": "icon/Union/grandmaster3.jpg", "그랜드 마스터 유니온 4": "icon/Union/grandmaster4.jpg", "그랜드 마스터 유니온 5": "icon/Union/grandmaster5.jpg",
        "슈프림 유니온 1": "icon/Union/supreme1.jpg", "슈프림 유니온 2": "icon/Union/supreme2.jpg", "슈프림 유니온 3": "icon/Union/supreme3.jpg", "슈프림 유니온 4": "icon/Union/supreme4.jpg", "슈프림 유니온 5": "icon/Union/supreme5.jpg"
    };
    return gradeMap[grade] || "icon/Union/novice1.jpg";
};

/**
 * 💡 [초보자 가이드] 뱃지 텍스트 명칭을 확인하여 그에 어울리는 이미지 아이콘 경로 주소를 연결합니다.
 * @param {string} statText - 휘장 스탯 옵션 설명 문구
 * @returns {string} 아이콘 이미지 파일 주소
 */
window.getBadgeIcon = function(statText) {
    const iconPath = "icon/Badge/";
    if (statText.includes("올스탯")) return iconPath + "allstat.png";
    if (statText.includes("공격력") || statText.includes("마력")) return iconPath + "attack.png";
    if (statText.includes("보스")) return iconPath + "boss.png";
    if (statText.includes("방어율")) return iconPath + "def.png";
    if (statText.includes("크리티컬")) return iconPath + "crit.png";
    return iconPath + "default.png";
};

/**
 * 🌟 유니온 데이터 종합 화면 빌드 함수 (외곽 프레임 및 상단 요약)
 * 디자인: 미니멀 테크 라이트 컨테이너 및 텍스트 스펙 적용
 */
window.renderUnion = function(union) {
    if (!union) union = { union_grade: "데이터 없음", union_level: 0 };
    window.lastRenderedUnion = union;
    
    const activePresetNo = parseInt(union.use_preset_no) || 1;
    // 유니온 등급에 맞는 아이콘 경로를 가져옵니다.
    const gradeIconUrl = window.getUnionGradeIcon(union.union_grade);

    return `
    <div style="width: 100%; margin: 0; background: #ffffff; color: #1e293b; padding: 24px; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); box-sizing: border-box;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 16px;">
                <img src="${gradeIconUrl}" style="width: 52px; height: 52px; border-radius: 12px; border: 1px solid #e2e8f0; object-fit: cover;" onerror="this.src='icon/Union/novice1.jpg'">
                <div>
                    <div style="font-size: 11px; color: #64748b; font-weight: 800; letter-spacing: 0.05em;">UNION GRADE</div>
                    <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px;">${union.union_grade}</div>
                </div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 11px; color: #64748b; font-weight: 800; letter-spacing: 0.05em;">TOTAL LEVEL</div>
                <div style="font-size: 18px; font-weight: 800; color: #2563eb; margin-top: 4px;">Lv.${(union.union_level || 0).toLocaleString()}</div>
            </div>
        </div>

        <div style="display: flex; gap: 8px; margin-bottom: 24px;">
            ${[1, 2, 3, 4, 5].map(n => `
                <button class="union-preset-tab-btn" onclick="window.changeUnionPreset(${n})" style="flex:1; padding: 10px; border: 1px solid ${n === activePresetNo ? '#2563eb' : '#e2e8f0'}; background: ${n === activePresetNo ? '#eff6ff' : '#ffffff'}; color: ${n === activePresetNo ? '#2563eb' : '#64748b'}; font-weight: 800; border-radius: 10px; cursor: pointer; font-size: 12px; transition: all 0.2s;">PRESET ${n}</button>
            `).join('')}
        </div>
        
        <div id="dynamicUnionPresetContainer"></div>
    </div>`;
};

/**
 * 🌟 유니온 프리셋 동적 체인저 함수 (4x4 스탯 그리드 및 하단 정보)
 * 디자인: 경계선을 지우고 폰트 대비로만 깔끔하게 떨어지는 테크니컬 스펙 디자인 적용
 */
window.changeUnionPreset = function(presetNo) {
    const union = window.lastRenderedUnion;
    if (!union) return;

    // 프리셋 트랙 버튼의 액티브 하이라이트 UI 즉각 제어
    document.querySelectorAll('.union-preset-tab-btn').forEach((btn, idx) => {
        const isTarget = (idx + 1) === presetNo;
        btn.style.background = isTarget ? '#ffffff' : 'transparent';
        btn.style.color = isTarget ? '#111827' : '#6b7280';
        btn.style.boxShadow = isTarget ? '0 1px 2px rgba(0,0,0,0.05)' : 'none';
    });

    // 선택한 프리셋 번호의 공격대 스탯 원본 로우 데이터(Array) 배열을 가져옵니다.
    let targetPreset = union[`union_raider_preset_${presetNo}`];
    let raiderStats = (targetPreset && Array.isArray(targetPreset.union_raider_stat)) ? targetPreset.union_raider_stat : [];
    
    // 타겟 프리셋이 비어있을 경우 현재 실시간 장착 중인 스탯 배열 노드를 폴백 백업으로 사용합니다.
    if (raiderStats.length === 0 && parseInt(union.use_preset_no) === presetNo) {
        raiderStats = Array.isArray(union.union_raider_stat) ? union.union_raider_stat : [];
    }

    // 💡 [정밀 추적 수정 핵심] 넥슨 API 리얼 로 데이터 스펙(순수 한글 명칭)에 맞춰 정규식 맵을 전면 재조정했습니다.
    const baseStats = [
        { name: "STR", regex: /힘|STR/, default: "+0" },
        { name: "DEX", regex: /민첩성|DEX/, default: "+0" },
        { name: "INT", regex: /지력|INT/, default: "+0" },
        { name: "LUK", regex: /운|LUK/, default: "+0" },
        { name: "공격력", regex: /공격력/, default: "+0" },
        { name: "마력", regex: /마력/, default: "+0" },
        { name: "최대 HP", regex: /최대\s*HP|최대HP/, default: "+0%" },
        { name: "최대 MP", regex: /최대\s*MP|최대MP/, default: "+0%" },
        { name: "크리티컬 데미지", regex: /크리티컬\s*데미지|크뎀/, default: "+0%" },
        { name: "보스 데미지", regex: /보스|보공/, default: "+0%" },
        { name: "방어율 무시", regex: /방어율|방무/, default: "+0%" },
        { name: "크리티컬 확률", regex: /크리티컬\s*확률|크확/, default: "+0%" },
        { name: "버프 지속시간", regex: /버프|벞지/, default: "+0%" },
        { name: "일반 데미지", regex: /일반|일뎀/, default: "+0%" },
        { name: "획득 경험치", regex: /경험치|경획/, default: "+0%" },
        { name: "상태 이상 내성", regex: /내성/, default: "+0" }
    ];

    // 💡 [소수점/단위 유실 버그 완벽 수정] 
    // 글자를 강제로 밀어버리거나 잘라내지 않고, 매칭된 옵션 문장에서 소수점(\.\d+) 및 퍼센트 기호(%)까지 온전히 파싱합니다.
    const gridStats = baseStats.map(b => {
        const foundStr = raiderStats.find(eff => b.regex.test(eff));
        if (foundStr) {
            // 정수, 소수점, 퍼센트 기호까지 깨짐 없이 온전히 사출해내는 정밀 캡처 정규식입니다.
            const match = foundStr.match(/(\d+(?:\.\d+)?%?)/);
            if (match) {
                let val = match[1] || match[0];
                if (!val.startsWith('+') && !val.startsWith('-')) val = '+' + val;
                return { name: b.name, val: val, active: true };
            }
        }
        return { name: b.name, val: b.default, active: false };
    });

    // 기존의 연동되던 챔피언 데이터 구조 사양을 유실 없이 그대로 승계 바인딩합니다.
    const champions = Array.isArray(union.union_champion) ? union.union_champion : [];
    const championBadges = Array.isArray(union.champion_badge_total_info) ? union.champion_badge_total_info : [];

    // 공통 콤팩트 서브 타이틀 가이드 스타일 선언
    const titleStyle = "color: #111827; margin: 0 0 10px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px;";

    const dynamicHtml = `
        <div class="union-artifact-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px 20px; margin-bottom: 24px; background: #f9fafb; padding: 20px; border-radius: 8px;">
            ${gridStats.map(s => `
                <div class="stat-cell" style="display: flex; flex-direction: column; align-items: flex-start;">
                    <div style="font-weight: 700; font-size: 11px; color: ${s.active ? '#111827' : '#9ca3af'}; text-transform: uppercase;">${s.name}</div>
                    <div style="font-weight: 800; font-size: 14px; margin-top: 2px; color: ${s.active ? '#2563eb' : '#d1d5db'};">${s.val}</div>
                </div>
            `).join('')}
        </div>

        <div class="union-split-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; border-top: 1px solid #f3f4f6; padding-top: 20px; margin-bottom: 20px; width: 100%;">
            
            <div class="union-compact-box">
                <h3 class="compact-title" style="${titleStyle}">🏆 Champions</h3>
                ${window.renderUnionChampion(champions)}
            </div>

            <div class="union-compact-box">
                <h3 class="compact-title" style="${titleStyle}">✨ Effects</h3>
                <div class="compact-scroll-list" style="max-height: 220px; overflow-y: auto;">
                    ${championBadges.length > 0 ? championBadges.map(b => `
                        <div class="compact-list-item" style="padding: 6px 0; font-size: 11.5px; color: #4b5563; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #f3f4f6;">
                            <span class="val-text" style="font-weight: 600;">⭐ ${b.stat || '설명 없음'}</span>
                        </div>
                    `).join('') : '<div class="no-data" style="color: #9ca3af; font-size: 11px; padding:20px 0;">장착된 휘장 데이터가 없습니다.</div>'}
                </div>
            </div>
        </div>

        <div class="union-compact-box" style="width: 100%; box-sizing: border-box; background: #f9fafb; padding: 16px; border-radius: 8px;">
            <h3 class="compact-title" style="${titleStyle}">🚩 Log: Raw Preset Effects</h3>
            <div class="compact-scroll-list" style="max-height: 180px; overflow-y: auto;">
                ${raiderStats.length > 0 ? raiderStats.map(s => `
                    <div class="compact-list-item" style="padding: 4px 0; font-size: 11px; color: #6b7280; font-weight: 600; font-family: monospace;">
                        ${s}
                    </div>
                `).join('') : '<div class="no-data" style="color: #9ca3af; font-size: 11px;">점령 효과 문구가 비어있습니다.</div>'}
            </div>
        </div>
    `;

    const targetContainer = document.getElementById('dynamicUnionPresetContainer');
    if (targetContainer) targetContainer.innerHTML = dynamicHtml;
};

/**
 * 🌟 유니온 챔피언 현황 세부 내부 렌더링 함수
 * 디자인: 테크 라이트 컨셉에 밀착되도록 불필요한 카드 보더를 비우고 세련된 플랫 블록 테마로 변경
 */
window.renderUnionChampion = function(champions) {
    const getGradeColor = (grade) => {
        if (grade === 'SSS') return '#ea580c';
        if (grade === 'S') return '#7e22ce';
        if (grade === 'A') return '#15803d';
        return '#64748b';
    };

    // 💡 강조 효과 헬퍼 함수 수정: 키워드와 뒤의 숫자/퍼센트까지 한 번에 묶어서 강조
    const highlightEffect = (text) => {
        // (키워드) + (공백/숫자/+/./% 포함된 값/증가) 패턴을 찾아 전체를 감싸줍니다.
        return text.replace(/(크뎀|올스탯|보공|방무|공\/마)(\s?[\d\+\.\%\s]+(?:증가)?)/g, '<span style="color: #2563eb; font-weight: 800;">$1$2</span>');
    };

    const rankUpData = {
        'C': { next: 'B', boss: '스우(하드)', cond: '20분', effect: '올스탯 20, HP/MP 1000' },
        'B': { next: 'A', boss: '진 힐라(하드)', cond: '20분', effect: '공/마 10 증가' },
        'A': { next: 'S', boss: '검은 마법사(하드)', cond: '45분', effect: '보공 5%' },
        'S': { next: 'SS', boss: '선택받은 세렌(하드)', cond: '20분', effect: '크뎀 3%' },
        'SS': { next: 'SSS', boss: '감시자 칼로스(노멀)', cond: '20분', effect: '방무 5%' }
    };

    return `
    <div class="compact-scroll-list" style="max-height: 280px; overflow-y: auto;">
        ${champions.length > 0 ? champions.map(c => {
            const gradeColor = getGradeColor(c.champion_grade);
            const info = rankUpData[c.champion_grade];
            const isMax = c.champion_grade === 'SSS';
            
            return `
            <div class="champ-mini-card" style="background: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px; padding: 12px; margin-bottom: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-weight: 800; font-size: 13px; color: #1e293b;">${c.champion_name}</span>
                        <span style="font-weight: 600; font-size: 10px; color: #64748b; background: #f8fafc; padding: 2px 6px; border-radius: 4px;">Lv.${c.champion_level || 0}</span>
                        <span style="font-weight: 600; font-size: 10px; color: #64748b; background: #f8fafc; padding: 2px 6px; border-radius: 4px;">${c.champion_class}</span>
                    </div>
                    <span style="color: #ffffff; background: ${gradeColor}; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 6px;">${c.champion_grade || 'C'}</span>
                </div>
                
                ${isMax ? `
                <div style="background: #fef3c7; padding: 6px; border-radius: 6px; border: 1px solid #fcd34d; font-size: 11px; text-align: center; color: #92400e; font-weight: 800;">
                    ⭐ 유니온 챔피언 등급 MAX
                </div>
                ` : `
                <div style="background: #fef3c7; padding: 6px 8px; border-radius: 6px; border: 1px solid #fcd34d; font-size: 11px; color: #92400e; font-weight: 700;">
                    다음 등급(${info.next}) : ${info.boss} (${info.cond}) | 효과 : ${highlightEffect(info.effect)}
                </div>
                `}

                <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px;">
                    ${(c.champion_badge_info || []).map(b => `<span style="background: #ffffff; color: #475569; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">${b.stat}</span>`).join('')}
                </div>
            </div>`;
        }).join('') : '<div style="color: #9ca3af; font-size: 12px; text-align: center; padding: 20px 0;">등록된 유니온 챔피언이 없습니다.</div>'}
    </div>`;
};

/**
 * 💡 [초보자 가이드] 직업 명칭 문자열을 받아 로컬에 매핑된 png 아이콘 파일 주소를 연결합니다. (기존 스펙 100% 영구 보존)
 */
window.getJobIcon = function(jobName) {
    const jobIconMap = {
        "히어로": "icon/Jobs/히어로.png", "팔라딘": "icon/Jobs/팔라딘.png", "다크나이트": "icon/Jobs/다크나이트.png",
        "비숍": "icon/Jobs/비숍.png", "아크메이지(불,독)": "icon/Jobs/불독.png", "아크메이지(썬,콜)": "icon/Jobs/썬콜.png",
        "보우마스터": "icon/Jobs/보우마스터.png", "신궁": "icon/Jobs/신궁.png", "패스파인더": "icon/Jobs/패스파인더.png",
        "나이트로드": "icon/Jobs/나이트로드.png", "섀도어": "icon/Jobs/섀도어.png", "듀얼블레이더": "icon/Jobs/듀얼블레이더.png",
        "바이퍼": "icon/Jobs/바이퍼.png", "캡틴": "icon/Jobs/캡틴.png", "캐논마스터": "icon/Jobs/캐논마스터.png",
        "미하일": "icon/Jobs/미하일.png", "소울마스터": "icon/Jobs/소울마스터.png", "플레임위자드": "icon/Jobs/플레임위자드.png", "윈드브레이커": "icon/Jobs/윈드브레이커.png", "나이트워커": "icon/Jobs/나이트워커.png", "스트라이커": "icon/Jobs/스트라이커.png",
        "아란": "icon/Jobs/아란.png", "에반": "icon/Jobs/에반.png", "메르세데스": "icon/Jobs/메르세데스.png", "팬텀": "icon/Jobs/팬텀.png", "은월": "icon/Jobs/은월.png",
        "데몬슬레이어": "icon/Jobs/데몬슬레이어.png", "데몬어벤져": "icon/Jobs/데몬어벤져.png", "블래스터": "icon/Jobs/블래스터.png", "배틀메이지": "icon/Jobs/배틀메이지.png", "와일드헌터": "icon/Jobs/와일드헌ter.png", "메카닉": "icon/Jobs/메카닉.png", "제논": "icon/Jobs/제논.png", "제로": "icon/Jobs/제로.png", "키네시스": "icon/Jobs/키네시스.png",
        "카이저": "icon/Jobs/카이저.png", "엔젤릭버스터": "icon/Jobs/엔젤릭버스터.png", "카데나": "icon/Jobs/카데나.png", "아크": "icon/Jobs/아크.png", "일리움": "icon/Jobs/일리움.png", "호영": "icon/Jobs/호영.png", "아델": "icon/Jobs/아델.png", "카인": "icon/Jobs/카인.png", "라라": "icon/Jobs/라라.png", "칼리": "icon/Jobs/칼리.png", "렌": "icon/Jobs/렌.png"
    };
    return jobIconMap[jobName] || "icon/Jobs/default.png";
};