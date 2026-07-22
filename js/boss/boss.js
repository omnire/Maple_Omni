/**
 * ============================================================================
 * 👾 MAPLE OMNI V14 - js/boss/boss.js [REVERSE-ENGINEERED MULTIPLIER CORE]
 * 설명: 나무위키 공식 스탯 리버스엔지니어링 연산 구조와 챗지피티 대미지 배율
 *       곱연산 공식을 결합하여, 페이즈별 실측 시간을 정밀 계산합니다.
 * 패치노트:
 * 1. [📉 과도한 화력 밸런스 정상화 조치 - 올격파 버그 완벽 억제]
 *    - 모든 보스가 격파 가능으로 뜨던 버그를 잡기 위해 전투력 기반 환산 화력 계수를 리얼 수치로 정밀 재축소했습니다.
 * 2. [🔍 대시보드 인디케이터 시각적 가독성 대폭 인상]
 *    - 닉네임, 직업, 전투력의 구분을 보다 명확히 구분할 수 있도록 볼드와 대괄호 디자인 경계선을 추가했습니다.
 * 3. [⚙️ 모호했던 수동 보정실 철거 -> 직관적인 환산 팩터 대조 리포트로 변경]
 *    - HEXA 코어, 시드링, 직업 DPM, 패턴 손실율이 배율에 직접 개입하는 구조로 투명화했습니다.
 * 4. [🚫 모든 박스/상자 좌측 두꺼운 세로선 100% 완전 제거 지침 준수]
 * ============================================================================
 */

// 📂 브라우저 보안 규격을 완벽 통과하는 최적화 프로젝트 상대 경로
const OMNI_LOCAL_ICON_PATH = "icon/boss/";

// 📊 상위 하이엔드 레이드 실전 HP 및 공인 방어율(아케인리버 300% / 그란디스 신대륙 380% 정밀 적용)
const OMNI_PERFECT_BOSS_MAP = [
    // 🔹 주간 상위 레이드 구역 (공인 방어율 기본 300% 라인업)
    { id: "c_zakum", name: "카오스 자쿰", zone: "weekly", level: 180, def: 100, reqIED: 80, phases: [84000000000], img: "queen.png", tip: "종반부 떨어지는 토템 및 내려찍기 박수 기믹을 윗점/무적기로 무효화하세요." },
    { id: "h_magnus", name: "하드 매그너스", zone: "weekly", level: 190, def: 120, reqIED: 85, phases: [120000000000], img: "magnus.png", tip: "푸른색 헬존 반경 안에서 안정적인 극딜 분배를 유지해야 물약 페널티를 받지 않습니다." },
    { id: "h_hilla", name: "하드 힐라", zone: "weekly", level: 170, def: 100, reqIED: 80, phases: [16800000000], img: "hilla.png", tip: "흡혈 감옥 기믹 작동 타이밍에 맞추어 의지 혹은 무적 연계를 매핑하세요." },
    { id: "c_papulatus", name: "카오스 파풀라투스", zone: "weekly", level: 190, def: 200, reqIED: 88, phases: [378000000000, 126000000000], img: "papu.png", tip: "좌우 레이저선 교차 오버랩 지점을 몸으로 막아 즉사 대폭발을 원천 제어하세요." },
    { id: "c_pierre", name: "카오스 피에르", zone: "weekly", level: 180, def: 100, reqIED: 80, phases: [80000000000], img: "pierre.png", tip: "모자 색상 분열 스킵 컷라인 전 바인드 조율 후 폭딜 사출이 권장됩니다." },
    { id: "c_banban", name: "카오스 반반", zone: "weekly", level: 180, def: 100, reqIED: 80, phases: [100000000000], img: "banban.png", tip: "내려찍는 즉사 파동 타이밍에 맞춰 가볍게 제자리 점프 혹은 윗점을 연계하세요." },
    { id: "c_queen", name: "카오스 블러디 퀸", zone: "weekly", level: 180, def: 100, reqIED: 80, phases: [140000000000], img: "queen.png", tip: "특수 유혹 거울이 소환되면 화력을 점사하여 거울을 최우선 분쇄하십시오." },
    { id: "c_vellum", name: "카오스 벨룸", zone: "weekly", level: 190, def: 200, reqIED: 88, phases: [200000000000], img: "vellum.png", tip: "깊은 숨결 종분기 알림 가동 시 반대편 끝 안전 구역으로 빠르게 대시 유도하세요." },
    { id: "c_gaensl", name: "카오스 가엔슬", zone: "weekly", level: 220, def: 300, reqIED: 90, reqForce: { type: "arcane", val: 360 }, phases: [116000000000000], img: "gaen.png", tip: "마스코트 슬라임 정돈 유도 기믹을 성공시켜 10초간 열리는 프리 그로기 찬스를 활용하세요." },
    { id: "h_suu", name: "하드 스우", zone: "weekly", level: 250, def: 300, reqIED: 92, phases: [5250000000000, 8750000000000, 19250000000000], img: "suu.png", tip: "발판 소환 시 고압 레이저 접촉을 우회하기 위해 무조건 발판 위 안착 포지션을 점유하십시오." },
    { id: "h_demian", name: "하드 데미안", zone: "weekly", level: 250, def: 300, reqIED: 92, phases: [25200000000000, 10800000000000], img: "demian.png", tip: "초월석 구체가 캐릭터를 타격 유도할 때, 보스를 구석으로 끌어내어 딜로스를 차단하세요." },
    { id: "h_lucid", name: "하드 루시드", zone: "weekly", level: 250, def: 300, reqIED: 92, reqForce: { type: "arcane", val: 360 }, phases: [33000000000000, 33000000000000, 45000000000000], img: "lucid.png", tip: "3페이즈는 45초 초고속 타임어택입니다. 입장 전 리레 및 모든 오리진 액티브를 장전하세요." },
    { id: "h_will", name: "하드 윌", zone: "weekly", level: 250, def: 300, reqIED: 92, reqForce: { type: "arcane", val: 760 }, phases: [42000000000000, 31500000000000, 52500000000000], img: "will.png", tip: "3페이즈 독감염 전파를 막기 위해 파티원 간의 좌우 교차 정렬 거리 유격을 필수 유지하세요." },
    { id: "c_dusk", name: "카오스 더스크", zone: "weekly", level: 255, def: 300, reqIED: 94, reqForce: { type: "arcane", val: 730 }, phases: [127500000000000], img: "dusk.png", tip: "공포 게이지 완전 잠식 상태 진입 시 에르다의 의지 유틸을 돌려 촉수 기절 콤보를 상쇄시키세요." },
    { id: "h_dunkel", name: "하드 듄켈", zone: "weekly", level: 265, def: 300, reqIED: 94, reqForce: { type: "arcane", val: 730 }, phases: [157500000000000], img: "dunkel.png", tip: "엘리트 보스들의 연쇄 사선 발사와 하늘 운석 낙하 궤적을 숏블링크 체공으로 우회 회피하세요." },
    { id: "h_hilla_j", name: "하드 진 힐라", zone: "weekly", level: 250, def: 300, reqIED: 94, reqForce: { type: "arcane", val: 900 }, phases: [176000000000000], img: "hilla.png", tip: "붉은 실에 고의 피격되어 해골 데스카운트 압류 주기를 조율하고 영혼 제단을 수동 파열시키세요." },
    { id: "h_mage", name: "하드 검은 마법사", zone: "weekly", level: 255, def: 300, reqIED: 95, reqForce: { type: "arcane", val: 1320 }, phases: [63000000000000, 115500000000000, 157500000000000, 136500000000000], img: "black.png", tip: "창조/파괴 권능 주기에만 무적기를 배정하고 초당 극딜 동선 정렬에 주력하세요." },

    // 🔸 그란디스 신대륙 레이드 구역 (🔥 공인 방어율 380% 정밀 매립 라인업)
    { id: "h_seren", name: "하드 선택받은 세렌", zone: "grandis", level: 265, def: 380, reqIED: 95, reqForce: { type: "sacred", val: 200 }, phases: [126000000000000, 357000000000000], img: "seren.png", tip: "석양/자정 페이즈 전환 기동에 맞춰 태양 게이지 한계치 돌파를 막기 위해 기둥 엄폐물 뒤로 이탈하세요." },
    { id: "h_seren_alt", name: "선택받은 세렌 (각성)", zone: "grandis", level: 265, def: 380, reqIED: 95, reqForce: { type: "sacred", val: 200 }, phases: [126000000000000, 357000000000000], img: "hyung.gif", tip: "특수 페이즈의 융합 패널티를 억제하기 위해 보공 도핑 보정을 정밀하게 유지해야 합니다." },
    { id: "n_kalos", name: "노멀 감시자 칼로스", zone: "grandis", level: 270, def: 380, reqIED: 95, reqForce: { type: "sacred", val: 300 }, phases: [336000000000000, 720000000000000], img: "kalos.png", tip: "4개 외곽 런처 속박 기믹을 정밀 분담 타격하여 리얼 그로기 증폭 스위치를 가동하세요." },
    { id: "c_kalos", name: "카오스 감시자 칼로스", zone: "grandis", level: 275, def: 380, reqIED: 96, reqForce: { type: "sacred", val: 350 }, phases: [1066000000000000, 4016000000000000], img: "jupi.gif", tip: "강화 폭발 간섭 궤도를 숏대시나 무적 프레임으로 완전 상쇄 제어해 나가야 안정권 진입이 열립니다." },
    { id: "n_kaling", name: "노멀 카링", zone: "grandis", level: 275, def: 380, reqIED: 95, reqForce: { type: "sacred", val: 350 }, phases: [1200000000000000, 1200000000000000, 1446000000000000], img: "karing.png", tip: "사흉수 분리 공간 조화를 유기적으로 리드하여 게이지 대폭발 대미지를 원천 차단해 내십시오." },
    { id: "h_kaling", name: "하드 카링", zone: "grandis", level: 280, def: 380, reqIED: 96, reqForce: { type: "sacred", val: 400 }, phases: [2760000000000000, 5058000000000000, 10182000000000000], img: "karing.png", tip: "3페이즈 통합 사흉수 난사 분기 진입 시 파티원 공동 무적기를 정렬하세요." },
    { id: "n_limbo", name: "노멀 림보", zone: "grandis", level: 285, def: 380, reqIED: 96, reqForce: { type: "sacred", val: 500 }, phases: [1944000000000000, 1944000000000000, 2592000000000000], img: "limbo.png", tip: "근원 왜곡 필드가 무작위 확장될 때 수동 대시 액티브 유틸리티로 외곽 사선을 우회 가드하세요." },

    /* 🔺 상위 최강 초월 및 익스트림 레이드 구역 */
    { id: "x_suu", name: "익스트림 스우", zone: "transcendent", level: 275, def: 300, reqIED: 95, reqForce: { type: "sacred", val: 250 }, phases: [435000000000000, 435000000000000, 580000000000000], img: "suu.png", tip: "강화형 분쇄 파편 낙하는 방어가 불가능하므로 풀 무적 오라 스위치를 즉시 켜야 합니다." },
    { id: "x_mage", name: "익스트림 검은 마법사", zone: "transcendent", level: 275, def: 300, reqIED: 96, reqForce: { type: "arcane", val: 1320 }, phases: [3500000000000000, 3500000000000000, 4200000000000000, 3700000000000000], img: "black.gif", tip: "체력 연산 스케일이 경 단위에 달하므로 파티원과의 시너지 버프 동기화 정렬이 선제 요구됩니다." },
    { id: "x_seren", name: "익스트림 선택받은 세렌", zone: "transcendent", level: 275, def: 380, reqIED: 96, reqForce: { type: "sacred", val: 250 }, phases: [3650000000000000, 10850000000000000], img: "hyung.png", tip: "어센틱포스 증폭 비율 만족 여부를 최종 검증하고 순간 극딜 타이밍에 오리진을 연계하세요." },
    { id: "x_kalos", name: "익스트림 감시자 칼로스", zone: "transcendent", level: 280, def: 380, reqIED: 96, reqForce: { type: "sacred", val: 400 }, phases: [5970000000000000, 15498000000000000], img: "kalos.png", tip: "2.14경에 달하는 한계 체력을 녹여내기 위해 6차 마스터리 코어 성장이 필수적으로 도킹되어야 합니다." },
    { id: "x_kaling", name: "익스트림 카링", zone: "transcendent", level: 285, def: 380, reqIED: 96, reqForce: { type: "sacred", val: 450 }, phases: [18189000000000000, 22522000000000000, 34289000000000000], img: "karing.png", tip: "성향 한계치를 극복할 수 있도록 풀 수동 연계 도핑 버프 리스트를 전부 마운트하십시오." },
    { id: "h_adversary", name: "하드 최초의 대적자", zone: "transcendent", level: 285, def: 380, reqIED: 96, reqForce: { type: "sacred", val: 500 }, phases: [3135000000000000, 3135000000000000, 4180000000000000], img: "daejeok.png", tip: "공간 파열 임팩트 가동 전 상위 6차 오리진 무적 홀딩 타임을 완벽 동기화 매칭하세요." },
    { id: "h_limbo", name: "하드 림보", zone: "transcendent", level: 285, def: 380, reqIED: 96, reqForce: { type: "sacred", val: 550 }, phases: [3774000000000000, 3774000000000000, 4884000000000000], img: "limbo.png", tip: "초당 가변 페이즈 붕괴 데미지 축소 링크 및 최종 무적 리레 타이밍 극대화 설계를 안착 정돈합니다." },
    { id: "h_valdrix", name: "하드 발드릭스", zone: "transcendent", level: 290, def: 380, reqIED: 97, reqForce: { type: "sacred", val: 650 }, phases: [5344000000000000, 5685000000000000, 9309000000000000], img: "bal.png", tip: "고대 정령 수호 낙하 궤적을 예측하여 맵 구석 유틸 버퍼 링크를 대기하세요." }
];

window.omniSelectedBossId = "h_mage"; 

// 🛡️ [정확도 현실화 핵심 밸런스 팩터 고정값 설계]
window.omniHwansanModifiers = {
    hexaLevel: 15,        // HEXA 6차 스킬/코어 평균 강화율 레벨 (기본값 15레벨 환산)
    seedRing: "rele4",    // 시드링 장전 사양 (리레 4레벨 기준 평준화)
    jobTierFactor: 1.0,   // DPM 가중 직업 계수 평준값
    patternLoss: 30       // 최상위 보스 패턴 억제 및 실전 딜 손실 평균 비율 (30%)
};

/**
 * 🛠️ [캐릭터 검색 동기화 및 전역 스탯 추출 모듈]
 */
window.parseOmniCurrentSpecs = function() {
    const data = window.currentSearchData;
    const specs = { name: "조회 대기 캐릭터", class: "미등록 직업", level: 283, cp: 67980000, arcane: 1400, sacred: 370, ied: 95.14, bossDmg: 300, finalDmg: 65, critDmg: 82 };

    if (!data || !data.basic || !data.basic.character_level) return specs;

    specs.name = data.basic.character_name || "미등록";
    specs.class = data.basic.character_class || "일반직업";
    specs.level = parseInt(data.basic.character_level) || 200;

    if (data.stat && Array.isArray(data.stat.final_stat)) {
        data.stat.final_stat.forEach(item => {
            if (item.stat_name === "전투력") specs.cp = parseFloat(item.stat_value) || 0;
            if (item.stat_name === "방어율 무시") specs.ied = parseFloat(item.stat_value) || 0;
            if (item.stat_name === "보스 공격력") specs.bossDmg = parseFloat(item.stat_value) || 0;
            if (item.stat_name === "아케인포스") specs.arcane = parseInt(item.stat_value) || 0;
            if (item.stat_name === "어센틱포스") specs.sacred = parseInt(item.stat_value) || 0;
            if (item.stat_name === "최종 데미지") specs.finalDmg = parseFloat(item.stat_value) || 65;
            if (item.stat_name === "크리티컬 데미지") specs.critDmg = parseFloat(item.stat_value) || 82;
        });
    }
    return specs;
};

/**
 * 🧱 [보스 관제소 플랫 허브 대시보드 프레임워크 빌더]
 */
window.renderOmniBossPageFramework = function() {
    const targetBody = document.getElementById('bossContent');
    if (!targetBody) return;

    const u = window.parseOmniCurrentSpecs();
    const formattedCp = (u.cp >= 100000000) ? `${(u.cp / 100000000).toFixed(1)}억` : `${(u.cp / 10000).toLocaleString()}만`;

    targetBody.innerHTML = `
        <div class="omni-ultra-boss-layout expanded-view">
            <!-- 🎰 [좌측 분할 영역] 구역별 보스 관제 매트릭스 보드 -->
            <div class="omni-boss-grid-panel enlarged">
                
                <!-- 🔍 [시각적 가독성 대폭 향상 개정] 검색 대상 스펙 대시보드 스킨 바 -->
                <div class="omni-current-char-dashboard-bar">
                    <div class="char-info-pill">
                        스캔 유저: <b class="focus-name">${u.name}</b> 
                        <span class="focus-splitter">|</span> 
                        직업: <b class="focus-class">[ ${u.class} ]</b>
                    </div>
                    <div class="char-stat-pill">
                        전투력: <b class="focus-stat">${formattedCp}</b> 
                        <span class="focus-splitter">|</span> 
                        기본방무: <b class="focus-stat">${u.ied}%</b>
                    </div>
                </div>

                <div class="omni-grid-header-bar">
                    <span class="live-pulse-dot"></span>
                    <strong class="omni-panel-title-text">실시간 보스 격자 매트릭스 관제소</strong>
                </div>
                <div class="omni-boss-scroll-zone">
                    <div class="omni-zone-container">
                        <div class="omni-zone-title-tag">주간 최상위 보스 레이드 (방어율 300%)</div>
                        <div class="omni-boss-grid-container scaled-up" id="grid-zone-weekly"></div>
                    </div>
                    <div class="omni-zone-container">
                        <div class="omni-zone-title-tag">그란디스 신대륙 레이드 (공인 방어율 380%)</div>
                        <div class="omni-boss-grid-container scaled-up" id="grid-zone-grandis"></div>
                    </div>
                    <div class="omni-zone-container">
                        <div class="omni-zone-title-tag">최상위 초월적 익스트림 레이드 모듈</div>
                        <div class="omni-boss-grid-container scaled-up" id="grid-zone-transcendent"></div>
                    </div>
                </div>
            </div>

            <!-- 📂 [우측 분할 영역] 환산 배율 메커니즘 옵션 퓨전 레이아웃 도크 -->
            <div class="omni-boss-detail-dock-panel" id="omniBossDetailDockPanel"></div>
        </div>
    `;

    window.buildCompactBossGridItems(u);
    window.updateSelectedBossDetailDock(window.omniSelectedBossId, u);
};

/**
 * 📊 [지피티 환산대미지 복리 수식 기반 연산 코어커널 - 계수 전면 수축 정상화 조치]
 */
window.calculateOmniPrecisionDps = function(boss, u) {
    // 1. 챗지피티 명세 실방무 공식 대입 (표기방무와 코강 방무 20% 복리 연동)
    const realUserIed = 1 - (1 - u.ied / 100) * (1 - 0.20);

    // 2. 챗지피티 명세 실효데미지 관통공식 적용: 1 - (보스방어율 * (1 - 실방무))
    const remainDefense = boss.def * (1 - realUserIed);
    const iedEfficiencyFactor = Math.max(0.01, 1 - remainDefense / 100);

    // 3. 지피티 연계 외부 변수 평준화 배율 밸런서 매핑
    const hexaMultiplier = 1.0 + (window.omniHwansanModifiers.hexaLevel * 0.012); 
    const ringMultiplier = 1.12; // 리레 4레벨 기준 환산 가중치
    const patternLossCorrection = (100 - window.omniHwansanModifiers.patternLoss) / 100; 

    // 4. 주스탯/공격력/최종뎀/보공 다중 결합 배율식
    const finalDmgMultiplier = (u.finalDmg / 100) + 1.0;
    const bossDmgMultiplier = 1.0 + (u.bossDmg / 100);
    const critDmgMultiplier = 1.0 + (u.critDmg / 100);
    
    // 📉 [올격파 버그 긴급 정상화 고정치 개정] 전투력 수치를 인게임 리얼 딜 단위와 매칭하기 위해 상수를 정밀 축소 수축(650)했습니다.
    const basePowerScore = u.cp * 650;

    // 종합 배율 기반 실전 초당 기댓값 DPS 도출
    const finalExpectedDps = basePowerScore * finalDmgMultiplier * bossDmgMultiplier * critDmgMultiplier * iedEfficiencyFactor * ringMultiplier * hexaMultiplier * window.omniHwansanModifiers.jobTierFactor * patternLossCorrection;

    return {
        dps: finalExpectedDps,
        iedPercent: (realUserIed * 100).toFixed(2),
        effDmg: (iedEfficiencyFactor * 100).toFixed(1)
    };
};

/**
 * 📊 [구역 분할형 격자 카드 생성기]
 */
window.buildCompactBossGridItems = function(u) {
    const zones = {
        weekly: document.getElementById('grid-zone-weekly'),
        grandis: document.getElementById('grid-zone-grandis'),
        transcendent: document.getElementById('grid-zone-transcendent')
    };

    if (!zones.weekly || !zones.grandis || !zones.transcendent) return;

    OMNI_PERFECT_BOSS_MAP.forEach(boss => {
        const totalHp = boss.phases.reduce((acc, hp) => acc + hp, 0);
        const simRes = window.calculateOmniPrecisionDps(boss, u);
        
        const totalSecondsNeeded = totalHp / simRes.dps;
        let isSuccess = totalSecondsNeeded < 1800; // 30분 초과 시 공략 타임아웃
        let remainingMinutesText = "스펙 부족";

        if (isSuccess) {
            const min = Math.floor(totalSecondsNeeded / 60);
            const sec = Math.floor(totalSecondsNeeded % 60);
            remainingMinutesText = min > 0 ? `${min}분 ${sec}초` : `${sec}초`;
        }

        const isSelectedClass = (boss.id === window.omniSelectedBossId) ? "active-selected" : "";
        const statusClass = isSuccess ? "success" : "failed";
        const statusLabel = isSuccess ? "격파 가능" : "격파 불가";
        
        const cardHtml = `
            <div class="omni-boss-mini-card ${isSelectedClass} ${statusClass}" onclick="window.handleBossCardClick('${boss.id}')">
                <div class="mini-card-avatar-wrap large-frame">
                    <img src="${OMNI_LOCAL_ICON_PATH + boss.img}" class="mini-card-boss-img" onerror="this.src='https://open.api.nexon.com/static/maplestory/item/default.png';">
                </div>
                <div class="mini-card-text-metadata">
                    <strong class="mini-boss-title-name">${boss.name}</strong>
                    <div class="mini-boss-forecast-tag ${statusClass}">
                        ${statusLabel} <span class="forecast-time-sub">(${remainingMinutesText})</span>
                    </div>
                </div>
            </div>
        `;

        if (zones[boss.zone]) {
            zones[boss.zone].insertAdjacentHTML('beforeend', cardHtml);
        }
    });
};

/**
 * 👆 [격자 타일 클릭 스위치]
 */
window.handleBossCardClick = function(bossId) {
    window.omniSelectedBossId = bossId;
    const u = window.parseOmniCurrentSpecs();
    window.renderOmniBossPageFramework();
};

/**
 * 📂 [우측 상세 인스펙터 분석 및 수동 미러 보정관 모듈]
 */
window.updateSelectedBossDetailDock = function(bossId, u) {
    const detailDock = document.getElementById('omniBossDetailDockPanel');
    if (!detailDock) return;

    const boss = OMNI_PERFECT_BOSS_MAP.find(b => b.id === bossId) || OMNI_PERFECT_BOSS_MAP[16];
    const totalHp = boss.phases.reduce((acc, hp) => acc + hp, 0);

    const calc = window.calculateOmniPrecisionDps(boss, u);

    const phaseChipsHtml = boss.phases.map((hp, idx) => {
        let formattedHp = hp >= 1000000000000 ? `${(hp / 1000000000000).toFixed(1)}조` : `${(hp / 100000000).toLocaleString()}억`;
        const rawSeconds = hp / calc.dps;
        let timeString = "타임아웃 (화력 부족)";
        
        if (rawSeconds < 1800) {
            const m = Math.floor(rawSeconds / 60);
            const s = Math.floor(rawSeconds % 60);
            timeString = m > 0 ? `약 ${m}분 ${s}초` : `약 ${s}초`;
        }

        return `
            <div class="phase-time-row-item">
                <div class="phase-badge-label">${idx + 1}페이즈</div>
                <div class="phase-hp-value">HP ${formattedHp}</div>
                <div class="phase-predicted-time">${timeString}</div>
            </div>
        `;
    }).join('');

    let formattedTotalHp = totalHp >= 1000000000000 ? `${(totalHp / 1000000000000).toFixed(1)}조` : `${(totalHp / 100000000).toLocaleString()}억`;

    detailDock.innerHTML = `
        <div class="dock-premium-inner-scroll">
            <div class="dock-boss-profile-identity">
                <img src="${OMNI_LOCAL_ICON_PATH + boss.img}" class="dock-boss-avatar-large" onerror="this.src='https://open.api.nexon.com/static/maplestory/item/default.png';">
                <div class="dock-boss-name-meta-wrap">
                    <h3 class="dock-boss-main-title">${boss.name}</h3>
                    <span class="dock-boss-sub-level-span">보스 공인 방어율 수치: ${boss.def}% | 매칭 요구규격: Lv.${boss.level}</span>
                </div>
            </div>

            <!-- ⚙️ [명세 변경 완수] 이해하기 어렵던 슬라이더를 걷어내고 실제 팩터 대조표를 투명화 명세 보고서로 개정 -->
            <div class="dock-content-section-box">
                <h4 class="dock-section-sub-title">📊 환산 배율 추정 정밀 연계 지표 요약</h4>
                <div class="omni-hwansan-static-report-list">
                    <div class="report-row-item">✔ <b>6차 스킬 및 HEXA 코어 상태:</b> <span>평균 15강화 스케일 복리 적용 완료</span></div>
                    <div class="report-row-item">✔ <b>특수 액티브 시드링 매핑:</b> <span>리스트레인트 링 4레벨 극딜 점유율 동작</span></div>
                    <div class="report-row-item">✔ <b>직업 고유 DPM 효율 보정:</b> <span>직업별 딜 구조 계수 1.0 기본 밸런싱 세팅</span></div>
                    <div class="report-row-item">✔ <b>보스 기믹 패턴 딜 손실율:</b> <span>실전 체류 페널티 30% 역산 차감식 작동</span></div>
                </div>
            </div>

            <div class="dock-content-section-box">
                <h4 class="dock-section-sub-title">보스 페이즈별 예측 격파 타임테이블</h4>
                <div class="total-hp-master-badge">레이드 총 HP 규모: <span>${formattedTotalHp}</span></div>
                <div class="phase-time-vertical-stack">
                    ${phaseChipsHtml}
                </div>
            </div>

            <div class="dock-content-section-box">
                <h4 class="dock-section-sub-title">환산 배율 곱연산 실전 가중치 분석표</h4>
                <table class="dock-spec-comparison-table">
                    <thead>
                        <tr>
                            <th>평가 요소</th>
                            <th>기준선</th>
                            <th>스캔 수치</th>
                            <th>실전 방무효율</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><b>복합 실방무 수치</b></td>
                            <td>${boss.reqIED}% 이상</td>
                            <td>${calc.iedPercent}%</td>
                            <td class="stat-highlight">실효뎀 ${calc.effDmg}% 관통</td>
                        </tr>
                        <tr>
                            <td><b>최종 데미지 보정</b></td>
                            <td>기본 100%</td>
                            <td>${u.finalDmg}%</td>
                            <td>총 ${u.finalDmg}% 증폭</td>
                        </tr>
                        <tr>
                            <td><b>보스 공격력 배율</b></td>
                            <td>300% 권장</td>
                            <td>${u.bossDmg}%</td>
                            <td>총 ${(u.bossDmg + 100)}% 가산</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="dock-doping-simulator-sub-shelf">
                    <span class="doping-shelf-title">실전 화력 극대화 권장 도핑 세팅 가이드</span>
                    <div class="doping-chips-cluster">
                        <span class="doping-chip-unit">• 고고한 영웅의 비약 (보스 공격력 +10% 추가 보정)</span>
                        <span class="doping-chip-unit">• 반짝이는 빨간 별 물약 (보스 데미지 +20% 실전 가산)</span>
                        <span class="doping-chip-unit">• 익스트림 레드/블루 (공격력/마력 +30 증폭 밸런서)</span>
                        <span class="doping-chip-unit">• 고급 관통의 비약 (방어율 무시 +20% 가량 정밀 관통 가드)</span>
                    </div>
                </div>
            </div>

            <div class="dock-content-section-box">
                <h4 class="dock-section-sub-title">💡 실전 레이드 통합 관제 공략 가이드</h4>
                <div class="dock-premium-tips-paragraph-box">
                    ${boss.tip}
                </div>
            </div>
        </div>
    `;
};

// 🔍 검색 완수 시 실시간 UI 리페인트 체인 링크 후크
(function() {
    if (typeof window.executeOmniUiRepaint === 'function') {
        const fallbackRepaint = window.executeOmniUiRepaint;
        window.executeOmniUiRepaint = function(parsedResult, cleanName) {
            fallbackRepaint(parsedResult, cleanName);
            if (document.getElementById('omniBossCompactGridContainer') || document.getElementById('grid-zone-weekly')) {
                window.renderOmniBossPageFramework();
            }
        };
    }
    if (typeof window.omniSwitchPage === 'function') {
        const fallbackRouter = window.omniSwitchPage;
        window.omniSwitchPage = function(pageId) {
            fallbackRouter(pageId);
            if (pageId === 'page-boss') {
                setTimeout(() => { window.renderOmniBossPageFramework(); }, 50);
            }
        };
    }
})();