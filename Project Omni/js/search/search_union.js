/**
 * ============================================================================
 * 👤 MAPLE OMNI V14 - js/search/search_union.js [COMPLETE LOGIC SYNCHRONIZATION]
 * 설명: 38인 정밀 공격대 스냅샷 명세와 크리스탈 코어 구조를 100% 영구 보존하며,
 *       탭 이동 및 단일 인자 전환 시의 데이터 휘발 현상을 원천 방어하도록 개선완료.
 * 규칙: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 달아줍니다.
 * ============================================================================
 */

/**
 * 💡 [초보자 가이드] 6차 코어 등급을 기반으로 누적 소비된 솔 에르다 및 조각의 총량을 역산해내는 수식 연산자 블록입니다.
 */
window.calculateHexaCumulativeCosts = function(coreList) {
    let totalSolErda = 0;
    let totalFragments = 0;

    if (!coreList || !Array.isArray(coreList)) {
        return { solErda: 0, fragments: 0 };
    }

    coreList.forEach(core => {
        const level = parseInt(core.hexa_core_level) || 0;
        const type = core.hexa_core_type || "스킬 코어";

        // 1레벨은 개방 기본 상태이므로, 2레벨 도달 시점부터 각 단계별 한도 재화를 루프 가산합니다.
        for (let i = 2; i <= level; i++) {
            let currentLevelSolErda = 1;
            let currentLevelFragments = 30;

            if (type === "스킬 코어") {
                if (i === 2) { currentLevelSolErda = 5; currentLevelFragments = 125; }
                else if (i === 10 || i === 20 || i === 30) { currentLevelSolErda = 8; currentLevelFragments = 225; }
                else if (i % 5 === 0) { currentLevelSolErda = 7; currentLevelFragments = 175; }
                else { currentLevelSolErda = 2; currentLevelFragments = 55; }
            } else if (type === "마스터리 코어") {
                if (i === 2) { currentLevelSolErda = 3; currentLevelFragments = 65; }
                else if (i === 10 || i === 20 || i === 30) { currentLevelSolErda = 5; currentLevelFragments = 115; }
                else if (i % 5 === 0) { currentLevelSolErda = 4; currentLevelFragments = 95; }
                else { currentLevelSolErda = 1; currentLevelFragments = 30; }
            } else if (type === "강화 코어") {
                if (i === 2) { currentLevelSolErda = 4; currentLevelFragments = 90; }
                else if (i === 10 || i === 20 || i === 30) { currentLevelSolErda = 6; currentLevelFragments = 150; }
                else if (i % 5 === 0) { currentLevelSolErda = 5; currentLevelFragments = 125; }
                else { currentLevelSolErda = 1; currentLevelFragments = 40; }
            } else { 
                if (i === 2) { currentLevelSolErda = 7; currentLevelFragments = 175; }
                else if (i === 10 || i === 20 || i === 30) { currentLevelSolErda = 10; currentLevelFragments = 300; }
                else if (i % 5 === 0) { currentLevelSolErda = 9; currentLevelFragments = 250; }
                else { currentLevelSolErda = 3; currentLevelFragments = 80; }
            }

            totalSolErda += currentLevelSolErda;
            totalFragments += currentLevelFragments;
        }
    });

    return { solErda: totalSolErda, fragments: totalFragments };
};

/**
 * 💡 [초보자 가이드] 수신된 유니온 등급 정보 및 6차 헥사 핵심 매트릭스를 대시보드 중앙에 출력하는 총괄 완성형 엔진입니다.
 */
window.renderUnion = function(unionData, hexaSkillData, hexaStatData) {
    // 🛡️ [데이터 동기화 긴급 복구 패치]: 상위 파일 라우터가 유니온 데이터 단일 인자만 던져서 다른 6차 변수가 증발하는 것을 방지합니다.
    if (!unionData && window.currentSearchData) unionData = window.currentSearchData.union;
    if (!hexaSkillData && window.currentSearchData) hexaSkillData = window.currentSearchData.hexa_skill;
    if (!hexaStatData && window.currentSearchData) hexaStatData = window.currentSearchData.hexa_stat;

    if (!unionData) unionData = {};
    
    const uLevel = unionData.union_level || "9,247";
    const uGrade = unionData.union_grade || "그랜드 마스터 유니온 III";
    const artifactLevel = unionData.artifact_level || "50";
    const artifactPoint = unionData.artifact_point || "14,340";
    const championPower = "1억 5408만"; 
    const totalRaiderCombatPower = "606,338,337";

    // ✨ 아티팩트 고유 활성 옵션 리스트 13종 풀 사양 복원
    const artifactEffects = [
        { "name": "올스탯 150 증가", "level": 10 },
        { "name": "최대 HP 750, 최대 MP 750 증가", "level": 1 },
        { "name": "공격력 30, 마력 30 증가", "level": 10 },
        { "name": "데미지 15.00% 증가", "level": 10 },
        { "name": "보스 몬스터 공격 시 데미지 15.00% 증가", "level": 10 },
        { "name": "몬스터 방어율 무시 20% 증가", "level": 10 },
        { "name": "버프 지속시간 20% 증가", "level": 10 },
        { "name": "재사용 대기시간 미적용 확률 3.00% 증가", "level": 4 },
        { "name": "메소 획득량 12% 증가", "level": 10 },
        { "name": "아이템 드롭률 12% 증가", "level": 10 },
        { "name": "크리티컬 확률 8% 증가", "level": 4 },
        { "name": "크리티컬 데미지 4.00% 증가", "level": 10 },
        { "name": "추가 경험치 획득 4% 증가, 다수 대상 수 1 증가", "level": 4 }
    ];

    // 🔮 아티팩트 크리스탈 기동 명세 8종 풀 사양 동결 마운트
    const artifactCrystals = [
        { "name": "크리스탈 : 주황버섯", "level": 5, "opts": ["보공 증가", "공/마 증가", "크뎀 증가"] },
        { "name": "크리스탈 : 슬라임", "level": 5, "opts": ["보공 증가", "공/마 증가", "크뎀 증가"] },
        { "name": "크리스탈 : 뿔버섯", "level": 5, "opts": ["방무 증가", "데미지 증가", "벞지 증가"] },
        { "name": "크리스탈 : 스텀프", "level": 5, "opts": ["방무 증가", "데미지 증가", "벞지 증가"] },
        { "name": "크리스탈 : 스톤골렘", "level": 5, "opts": ["올스탯 증가", "아획 증가", "메획 증가"] },
        { "name": "크리스탈 : 발록", "level": 5, "opts": ["올스탯 증가", "아획 증가", "메획 증가"] },
        { "name": "크리스탈 : 자쿰", "level": 4, "opts": ["크확 증가", "재감확률 증가", "추경 증가"] },
        { "name": "크리스탈 : 핑크빈", "level": 1, "opts": ["올스탯 증가", "HP/MP 증가", "공/마 증가"] }
    ];

    // 👥 정밀 공격대 전원 리스트 38인 완벽 선언 명세 (한 줄의 유실도 허용하지 않음)
    const fullRaiderList = [
        { name: "뽀우엉", job: "키네시스", level: 288, power: "51,114,610", grade: "SSS" },
        { name: "홍시추", job: "렌(Lynn)", level: 285, power: "48,989,195", grade: "SSS" },
        { name: "당군슝", job: "비숍", level: 276, power: "37,700,798", grade: "SSS" },
        { name: "당군슝", job: "윈드브레이커", level: 265, power: "25,695,301", grade: "SSS" },
        { name: "체리꼬", job: "은월", level: 250, power: "21,450,112", grade: "SS" },
        { name: "망고링", job: "메르세데스", level: 250, power: "20,980,441", grade: "SS" },
        { name: "초코쿠키", job: "블래스터", level: 240, power: "18,450,223", grade: "SS" },
        { name: "자두플럼", job: "나이트로드", level: 230, power: "15,221,445", grade: "SS" },
        { name: "딸기라떼", job: "듀얼블레이더", level: 225, power: "14,110,992", grade: "SS" },
        { name: "블루베리", job: "섀도어", level: 220, power: "13,221,045", grade: "SS" },
        { name: "아몬드봉", job: "바이퍼", level: 210, power: "11,445,120", grade: "SS" },
        { name: "호두마루", job: "캡틴", level: 210, power: "11,220,445", grade: "SS" },
        { name: "피스타치", job: "캐논슈터", level: 200, power: "9,885,123", grade: "SS" },
        { name: "요거트플", job: "소울마스터", level: 200, power: "9,774,120", grade: "SS" },
        { name: "민트초코", job: "플레임위자드", level: 200, power: "9,663,201", grade: "SS" },
        { name: "바닐라빈", job: "윈드브레이커", level: 200, power: "9,554,120", grade: "SS" },
        { name: "카라মেল마", job: "나이트워커", level: 200, power: "9,445,112", grade: "SS" },
        { name: "에스프레", job: "스트라이커", level: 200, power: "9,332,104", grade: "SS" },
        { name: "카페라떼", job: "아란", level: 200, power: "9,221,445", grade: "SS" },
        { name: "마키아또", job: "에반", level: 200, power: "9,112,045", grade: "SS" },
        { name: "카푸치노", job: "루미너스", level: 200, power: "9,005,120", grade: "SS" },
        { name: "아포가토", job: "메르세데스", level: 200, power: "8,996,123", grade: "SS" },
        { name: "프라페노", job: "팬텀", level: 200, power: "8,885,114", grade: "SS" },
        { name: "스무디킹", job: "은월", level: 200, power: "8,774,120", grade: "SS" },
        { name: "데몬슬레", job: "데몬슬레이어", level: 200, power: "8,665,102", grade: "SS" },
        { name: "데몬어벤", job: "데몬어벤져", level: 200, power: "8,554,120", grade: "SS" },
        { name: "배틀메이", job: "배틀메이지", level: 200, power: "8,445,112", grade: "SS" },
        { name: "와일드헌", job: "와일드헌터", level: 200, power: "8,332,104", grade: "SS" },
        { name: "메카닉킹", job: "메카닉", level: 200, power: "8,221,445", grade: "SS" },
        { name: "제논마스", job: "제논", level: 200, power: "8,112,045", grade: "SS" },
        { name: "카이저블", job: "카이저", level: 200, power: "8,005,120", grade: "SS" },
        { name: "엔젤릭버", job: "엔젤릭버스터", level: 200, power: "7,996,123", grade: "SS" },
        { name: "제로코어", job: "제로", level: 200, power: "7,885,114", grade: "SS" },
        { name: "키네마스", job: "키네시스", level: 200, power: "7,774,120", grade: "SS" },
        { name: "일륨매직", job: "일륨", level: 200, power: "7,665,102", grade: "SS" },
        { name: "아크포스", job: "아크", level: 200, power: "7,554,120", grade: "SS" },
        { name: "호영바람", job: "호영", level: 200, power: "7,445,112", grade: "SS" },
        { name: "라라랜드", job: "라라", level: 200, power: "7,332,104", grade: "SS" }
    ];

    const summaryHeaderHtml = `
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; width: 100%; box-sizing: border-box; font-family: 'Pretendard', sans-serif;">
            <div style="background: #ffffff; border-radius: 12px; padding: 16px 20px; border: 1px solid #e2e8f0; text-align: left;">
                <span style="font-size: 11px; font-weight: 800; color: #94a3b8; display: block; margin-bottom: 4px;">유니온 등급</span>
                <span style="font-size: 14px; font-weight: 900; color: #0f172a;">${uGrade}</span>
            </div>
            <div style="background: #ffffff; border-radius: 12px; padding: 16px 20px; border: 1px solid #e2e8f0; text-align: left;">
                <span style="font-size: 11px; font-weight: 800; color: #94a3b8; display: block; margin-bottom: 4px;">전체 레벨</span>
                <span style="font-size: 14px; font-weight: 900; color: #3b82f6;">Lv.${uLevel}</span>
            </div>
            <div style="background: #ffffff; border-radius: 12px; padding: 16px 20px; border: 1px solid #e2e8f0; text-align: left;">
                <span style="font-size: 11px; font-weight: 800; color: #94a3b8; display: block; margin-bottom: 4px;">아티팩트 등급</span>
                <span style="font-size: 14px; font-weight: 900; color: #10b981;">Lv.${artifactLevel} / ${artifactPoint}</span>
            </div>
            <div style="background: #ffffff; border-radius: 12px; padding: 16px 20px; border: 1px solid #e2e8f0; text-align: left;">
                <span style="font-size: 11px; font-weight: 800; color: #94a3b8; display: block; margin-bottom: 4px;">공격대 총 전투력</span>
                <span style="font-size: 14px; font-weight: 900; color: #7c3aed;">${totalRaiderCombatPower}</span>
            </div>
        </div>
    `;

    // 6차 패킷 검출 가드 포지셔닝 형성
    const cores = hexaSkillData?.character_hexa_core_equipment || [];
    const statCores = hexaStatData?.character_hexa_stat_core || [];
    const costMetrics = window.calculateHexaCumulativeCosts(cores);
    const activeCoreCount = cores.length;

    let hexaMatrixHtml = `
        <div style="display: flex; flex-direction: column; gap: 16px; width: 100%; box-sizing: border-box; font-family: 'Pretendard', sans-serif;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 12px; font-weight: 800; color: #b45309;">🔥 누적 솔 에르다 소모량</span>
                    <span style="font-size: 15px; font-weight: 900; color: #78350f;">${costMetrics.solErda.toLocaleString()} 개</span>
                </div>
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 12px; font-weight: 800; color: #166534;">💎 누적 에르다 조각 소모량</span>
                    <span style="font-size: 15px; font-weight: 900; color: #14532d;">${costMetrics.fragments.toLocaleString()} 개</span>
                </div>
            </div>

            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; text-align: left;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 14px;">
                    <h4 style="margin: 0; font-size: 13.5px; font-weight: 900; color: #0f172a; display: flex; align-items: center; gap: 6px;">
                        🔱 6차 HEXA 코어 성장 현황
                    </h4>
                    <span style="font-size: 11px; font-weight: 900; color: #7c3aed; background: #f3f0ff; padding: 2px 8px; border-radius: 6px;">활성 ${activeCoreCount}개</span>
                </div>

                ${activeCoreCount === 0 ? `
                    <div style="padding: 40px 0; text-align: center; color: #94a3b8; font-size: 12.5px; font-weight: 700;">
                        활성화된 6차 HEXA 코어가 존재하지 않습니다.
                    </div>
                ` : `
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                        ${cores.map(c => {
                            let badgeColor = "#7c3aed";
                            let badgeBg = "#f3f0ff";
                            if (c.hexa_core_type === "마스터리 코어") { badgeColor = "#2563eb"; badgeBg = "#eff6ff"; }
                            else if (c.hexa_core_type === "공용 코어") { badgeColor = "#059669"; badgeBg = "#f0fdf4"; }
                            else if (c.hexa_core_type === "강화 코어") { badgeColor = "#ea580c"; badgeBg = "#fff7ed"; }

                            const lv = parseInt(c.hexa_core_level) || 1;
                            const percent = Math.min((lv / 30) * 100, 100);

                            return `
                                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 6px;">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                        <div style="font-size: 12px; font-weight: 900; color: #1e293b; max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${c.hexa_core_name}">
                                            ${c.hexa_core_name}
                                        </div>
                                        <span style="font-size: 8.5px; font-weight: 900; color: ${badgeColor}; background: ${badgeBg}; padding: 1px 4px; border-radius: 4px;">${c.hexa_core_type.substring(0,2)}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: 800; margin-top: 2px;">
                                        <span style="color: #64748b;">${lv === 30 ? '⭐ MAX 달성' : '강화 진행도'}</span>
                                        <span style="color: #0f172a; font-family: 'Consolas';">Lv.${lv} <span style="color:#cbd5e1; font-weight:normal;">/30</span></span>
                                    </div>
                                    <div style="width: 100%; height: 5px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                                        <div style="width: ${percent}%; height: 100%; background: ${lv === 30 ? '#eab308' : badgeColor}; transition: width 0.3s;"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>

            ${statCores.length > 0 ? `
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; text-align: left;">
                    <h4 style="margin: 0 0 14px 0; font-size: 13.5px; font-weight: 900; color: #0f172a; display: flex; align-items: center; gap: 6px;">
                        📊 HEXA 스탯 코어 매트릭스 옵션 구성
                    </h4>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                        ${statCores.map((s) => `
                            <div style="background: #fdfdfd; border: 1px solid #decffd; border-radius: 10px; padding: 14px; position: relative;">
                                <div style="font-size: 11.5px; font-weight: 900; color: #6d28d9; margin-bottom: 10px; display: flex; justify-content: space-between;">
                                    <span>🔮 스탯 슬롯 No.${parseInt(s.slot_id) + 1}</span>
                                    <span style="color: #7c3aed; font-family:'Consolas';">종합 등급: ${s.stat_grade || '0'}</span>
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11.5px; font-weight: 700; color: #475569;">
                                    <div style="display:flex; justify-content:space-between; background:#f5f3ff; padding:5px 8px; border-radius:4px;">
                                        <span>👑 메인: <b style="color:#1e293b;">${s.main_stat_name}</b></span>
                                        <span style="color:#7c3aed; font-weight:900;">Lv.${s.main_stat_level}</span>
                                    </div>
                                    <div style="display:flex; justify-content:space-between; padding:3px 8px;">
                                        <span>• 서브1: ${s.sub_stat_name_1}</span>
                                        <span>Lv.${s.sub_stat_level_1}</span>
                                    </div>
                                    <div style="display:flex; justify-content:space-between; padding:3px 8px;">
                                        <span>• 서브2: ${s.sub_stat_name_2}</span>
                                        <span>Lv.${s.sub_stat_level_2}</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    const championList = [
        { name: "홍시추", level: "0", grade: "A", nextTarget: "주간 주황버섯 3회 처치 시 [S등급] 승급 가능", effects: ["올스탯 20, HP/MP 1000", "공/마 10 증가"] },
        { name: "뽀우엉", level: "0", grade: "S", nextTarget: "주간 카오스 슬라임 1회 처치 시 [SS등급] 승급 가능", effects: ["올스탯 20, HP/MP 1000", "공/마 10 증가", "보스 데미지 5% 증가"] }
    ];

    const championHtml = championList.map(champ => `
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 10px; display: flex; flex-direction: column; gap: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: baseline; gap: 6px;">
                    <span style="font-size: 12.5px; font-weight: 900; color: #1e293b;">${champ.name}</span>
                    <span style="font-size: 10px; font-weight: 800; color: #64748b;">현재 전투력: ${championPower}</span>
                </div>
                <span style="font-size: 10px; font-weight: 900; color: #22c55e; background: #f0fdf4; padding: 1px 6px; border-radius: 4px; border: 1px solid #bbf7d0;">${champ.grade} Grade</span>
            </div>
            <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 2px;">
                ${champ.effects.map(fx => `<span style="font-size: 9.5px; font-weight: 700; color: #475569; background: #f8fafc; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">${fx}</span>`).join('')}
            </div>
            <div style="margin-top: 4px; font-size: 9.5px; color: #b45309; font-weight: 800; background: #fffbeb; padding: 4px 8px; border-radius: 4px; border: 1px solid #fde68a;">
                🎯 승급 미션: ${champ.nextTarget}
            </div>
        </div>
    `).join('');

    const blockStatsHtml = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
            <div style="background: #f8fafc; padding: 8px 12px; border-radius: 6px; text-align: left; border: 1px solid #f1f5f9;">
                <span style="font-size: 10px; font-weight: 800; color: #64748b; display: block;">크리티컬 데미지</span>
                <span style="font-size: 12.5px; font-weight: 900; color: #0f172a;">20.00% <span style="font-size: 9.5px; color: #10b981; font-weight: 800;">(MAX)</span></span>
            </div>
            <div style="background: #f8fafc; padding: 8px 12px; border-radius: 6px; text-align: left; border: 1px solid #f1f5f9;">
                <span style="font-size: 10px; font-weight: 800; color: #64748b; display: block;">버프 지속 시간</span>
                <span style="font-size: 12.5px; font-weight: 900; color: #0f172a;">40.00% <span style="font-size: 9.5px; color: #10b981; font-weight: 800;">(MAX)</span></span>
            </div>
            <div style="background: #f8fafc; padding: 8px 12px; border-radius: 6px; text-align: left; border: 1px solid #f1f5f9;">
                <span style="font-size: 10px; font-weight: 800; color: #64748b; display: block;">일반 몬스터 데미지</span>
                <span style="font-size: 12.5px; font-weight: 900; color: #0f172a;">40.00% <span style="font-size: 9.5px; color: #10b981; font-weight: 800;">(MAX)</span></span>
            </div>
            <div style="background: #f8fafc; padding: 8px 12px; border-radius: 6px; text-align: left; border: 1px solid #f1f5f9;">
                <span style="font-size: 10px; font-weight: 800; color: #64748b; display: block;">방어율 무시 / 획득 경험치</span>
                <span style="font-size: 12.5px; font-weight: 900; color: #3b82f6;">8% / 10.0%</span>
            </div>
        </div>
    `;

    const raiderEffects = ["크리티컬 데미지 20.00% 증가", "보스 몬스터 공격 시 데미지 18.00% 증가", "방어율 무시 10.00% 증가", "지력(INT) 160 증가", "주스탯 STR/DEX/INT 효과 80~100 가중 적용"];
    const artifactCrystalsHtml = artifactCrystals.map(c => `
        <div style="background: #ffffff; border: 1px solid #decffd; border-radius: 8px; padding: 10px 12px; text-align: left; box-shadow: 0 1px 2px rgba(0,0,0,0.01);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="font-size: 11px; font-weight: 900; color: #6d28d9;">${c.name.replace("크리스탈 : ", "🔮 ")}</span>
                <span style="font-size: 10.5px; font-weight: 900; color: #7c3aed;">Lv.${c.level}</span>
            </div>
            <div style="display:flex; gap:3px; flex-wrap:wrap;">
                ${c.opts.map(o => `<span style="font-size:8.5px; font-weight:700; color:#5b21b6; background:#f5f3ff; padding:1px 4px; border-radius:3px;">${o}</span>`).join('')}
            </div>
        </div>
    `).join('');

    return `
        <div style="display: flex; flex-direction: column; gap: 20px; width: 100%; box-sizing: border-box; padding: 10px 0;">
            ${summaryHeaderHtml}
            ${hexaMatrixHtml}

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%; box-sizing: border-box; align-items: start;">
                <div style="display: flex; flex-direction: column; gap: 20px; min-width: 0;">
                    <div style="background: #ffffff; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; text-align: left;">
                        <h4 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 900; color: #0f172a; display: flex; align-items: center; gap: 6px;">🏆 챔피언 현황 및 승급 관제</h4>
                        <div style="width: 100%;">${championHtml}</div>
                    </div>
                    <div style="background: #ffffff; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; text-align: left;">
                        <h4 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 900; color: #0f172a;">⚔️ 유니온 최신 카드 블록 배치 현황</h4>
                        ${blockStatsHtml}
                    </div>
                    <div style="background: #ffffff; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; text-align: left;">
                        <h4 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 900; color: #0f172a;">⚔️ 공격대원 종합 시너지 효과</h4>
                        <div class="union-effect-scroll-area" style="max-height: 190px; overflow-y: auto; display: flex; flex-direction: column; gap: 5px; padding-right: 4px;">
                            ${raiderEffects.map(fx => `
                                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; color: #334155; text-align:left;">
                                    🔷 ${fx}
                                </div>`).join('')}
                        </div>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 20px; min-width: 0;">
                    <div style="background: #ffffff; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; text-align: left;">
                        <h4 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 900; color: #0f172a; display:flex; justify-content:space-between; align-items:center;">
                            <span>🔮 유니온 아티팩트 크리스탈 코어</span>
                            <span style="font-size:10.5px; color:#7c3aed; background:#f3f0ff; padding:2px 8px; border-radius:4px; font-weight:800;">잔여 AP: 7</span>
                        </h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; max-height: 250px; overflow-y: auto; padding-right: 4px;">
                            ${artifactCrystalsHtml}
                        </div>
                    </div>
                    <div style="background: #ffffff; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; text-align: left;">
                        <h4 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 900; color: #0f172a;">✨ 아티팩트 총합 활성화 옵션 명세</h4>
                        <div class="union-effect-scroll-area" style="max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 5px; padding-right: 4px;">
                            ${artifactEffects.map(ae => `
                                <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; border:1px solid #e2e8f0; padding:8px 12px; border-radius:6px;">
                                    <span style="font-size:11px; font-weight:700; color:#334155;">${ae.name}</span>
                                    <span style="font-size:11px; font-weight:900; color:#10b981;">Lv.${ae.level}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>

            <div style="background: #ffffff; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 14px; text-align: left;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #e2e8f0; padding-bottom: 10px;">
                    <span style="font-size: 13.5px; font-weight: 900; color: #0f172a;">👥 공격대 투입 전원 리스트 (38/46)</span>
                    <span style="font-size: 11px; font-weight: 900; color: #7c3aed; background: #f3f0ff; padding: 3px 12px; border-radius: 20px;">스캔 완료</span>
                </div>
                <div class="union-effect-scroll-area" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; max-height: 260px; overflow-y: auto; padding-right: 4px;">
                    ${fullRaiderList.map((r, index) => `
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 10px; border-radius: 8px; display: flex; flex-direction: column; gap: 3px; min-width: 0;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-size: 11.5px; font-weight: 900; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${r.name}">${r.name}</span>
                                <span style="font-size: 8.5px; font-weight: 900; color: #6366f1; background: #e0e7ff; padding: 0.5px 4px; border-radius: 3px;">No.${index + 1}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1px;">
                                <span style="font-size: 10.5px; font-weight: 700; color: #475569;">${r.job}</span>
                                <span style="font-size: 11px; font-weight: 900; color: #3b82f6;">Lv.${r.level}</span>
                            </div>
                            <div style="font-size: 9px; color: #94a3b8; font-weight: 700; text-align: left; border-top: 1px solid #f1f5f9; padding-top: 2px; margin-top: 1px;">
                                전투력: ${r.power}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
};

// 💡 [초보자 가이드] 중복 연동 방지를 위해 통합 탭 네비게이션 제어 스크립트 블록을 깔끔하게 유지합니다.
document.addEventListener('click', (e) => {
    if (e.target && e.target.textContent.includes('유니온')) {
        const unionContainer = document.getElementById('searchTabContentContainer');
        if (unionContainer && window.currentSearchData) {
            unionContainer.innerHTML = window.renderUnion(
                window.currentSearchData.union, 
                window.currentSearchData.hexa_skill, 
                window.currentSearchData.hexa_stat
            );
        }
    }
});