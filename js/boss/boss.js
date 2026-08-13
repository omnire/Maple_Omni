/**
 * ============================================================================
 * 👾 MAPLE OMNI V14 - js/boss/boss.js [REVERSE-ENGINEERED MULTIPLIER CORE]
 * 설명: 초보자도 쉽게 이해할 수 있는 매플스토리 보스 종합 관제 시스템입니다.
 *       추천 전투력, 포스(아케인/어센틱), 레벨(렙뻥) 기반의 직관적인 격파 판정과
 *       잡을 보스를 직접 체크하여 주간 결정석 수익을 자동 계산해주는 기능이 탑재되어 있습니다.
 * 
 * 주요 기능:
 * 1. NexOn Open API 기반 스탯(전투력, 방무, 보공, 최종뎀, 크뎀, 포스) 파싱
 * 2. 추천 전투력(reqCp) + 요구 포스(reqForce) + 레벨(level) 종합 격파 진단
 * 3. 체크박스 선택 방식의 실시간 주간 보스 수익 자동 합산 계산기
 * 4. 우측 상세 분석 도크 (상세 스탯 분석표 하단 도핑 세팅 가이드배치 지침 준수)
 * ============================================================================
 */

// 📂 브라우저 보안 규격을 완벽 통과하는 최적화 프로젝트 상대 경로 (보스 아이콘 이미지 폴더)
const OMNI_LOCAL_ICON_PATH = "icon/boss/";

// 📊 상위 하이엔드 레이드 스펙 및 결정석 가격 정밀 매핑 (이미지 표 기준 추천 전투력 정밀 반영)
const OMNI_PERFECT_BOSS_MAP = [
    // 🔹 주간 상위 레이드 구역 (공인 방어율 기본 300% 라인업)
    { id: "c_zakum", name: "카오스 자쿰", zone: "weekly", level: 180, def: 100, reqIED: 80, reqCp: 900000, price: 5200000, phases: [84000000000], img: "queen.png", tip: "종반부 떨어지는 토템 및 내려찍기 박수 기믹을 윗점/무적기로 무효화하세요." },
    { id: "h_magnus", name: "하드 매그너스", zone: "weekly", level: 190, def: 120, reqIED: 85, reqCp: 3000000, price: 7500000, phases: [120000000000], img: "magnus.png", tip: "푸른색 헬존 반경 안에서 안정적인 극딜 분배를 유지해야 물약 페널티를 받지 않습니다." },
    { id: "h_hilla", name: "하드 힐라", zone: "weekly", level: 170, def: 100, reqIED: 80, reqCp: 1000000, price: 5800000, phases: [16800000000], img: "hilla.png", tip: "흡혈 감옥 기믹 작동 타이밍에 맞추어 의지 혹은 무적 연계를 매핑하세요." },
    { id: "c_papulatus", name: "카오스 파풀라투스", zone: "weekly", level: 190, def: 200, reqIED: 88, reqCp: 6000000, price: 26000000, phases: [378000000000, 126000000000], img: "papu.png", tip: "좌우 레이저선 교차 오버랩 지점을 몸으로 막아 즉사 대폭발을 원천 제어하세요." },
    { id: "c_pierre", name: "카오스 피에르", zone: "weekly", level: 180, def: 100, reqIED: 80, reqCp: 3000000, price: 6200000, phases: [80000000000], img: "pierre.png", tip: "모자 색상 분열 스킵 컷라인 전 바인드 조율 후 폭딜 사출이 권장됩니다." },
    { id: "c_banban", name: "카오스 반반", zone: "weekly", level: 180, def: 100, reqIED: 80, reqCp: 3000000, price: 6200000, phases: [100000000000], img: "banban.png", tip: "내려찍는 즉사 파동 타이밍에 맞춰 가볍게 제자리 점프 혹은 윗점을 연계하세요." },
    { id: "c_queen", name: "카오스 블러디 퀸", zone: "weekly", level: 180, def: 100, reqIED: 80, reqCp: 3000000, price: 6200000, phases: [140000000000], img: "queen.png", tip: "특수 유혹 거울이 소환되면 화력을 점사하여 거울을 최우선 분쇄하십시오." },
    { id: "c_vellum", name: "카오스 벨룸", zone: "weekly", level: 190, def: 200, reqIED: 88, reqCp: 5000000, price: 32000000, phases: [200000000000], img: "vellum.png", tip: "깊은 숨결 종분기 알림 가동 시 반대편 끝 안전 구역으로 빠르게 대시 유도하세요." },
    { id: "c_gaensl", name: "카오스 가엔슬", zone: "weekly", level: 220, def: 300, reqIED: 90, reqForce: { type: "arcane", val: 360 }, reqCp: 40000000, price: 115000000, phases: [116000000000000], img: "gaen.png", tip: "마스코트 슬라임 정돈 유도 기믹을 성공시켜 10초간 열리는 프리 그로기 찬스를 활용하세요." },
    { id: "h_suu", name: "하드 스우", zone: "weekly", level: 250, def: 300, reqIED: 92, reqCp: 19000000, price: 56000000, phases: [5250000000000, 8750000000000, 19250000000000], img: "suu.png", tip: "발판 소환 시 고압 레이저 접촉을 우회하기 위해 무조건 발판 위 안착 포지션을 점유하십시오." },
    { id: "h_demian", name: "하드 데미안", zone: "weekly", level: 250, def: 300, reqIED: 92, reqCp: 20000000, price: 54000000, phases: [25200000000000, 10800000000000], img: "demian.png", tip: "초월석 구체가 캐릭터를 타격 유도할 때, 보스를 구석으로 끌어내어 딜로스를 차단하세요." },
    { id: "h_lucid", name: "하드 루시드", zone: "weekly", level: 250, def: 300, reqIED: 92, reqForce: { type: "arcane", val: 360 }, reqCp: 40000000, price: 145000000, phases: [33000000000000, 33000000000000, 45000000000000], img: "lucid.png", tip: "3페이즈는 45초 초고속 타임어택입니다. 입장 전 리레 및 모든 오리진 액티브를 장전하세요." },
    { id: "h_will", name: "하드 윌", zone: "weekly", level: 250, def: 300, reqIED: 92, reqForce: { type: "arcane", val: 760 }, reqCp: 40000000, price: 155000000, phases: [42000000000000, 31500000000000, 52500000000000], img: "will.png", tip: "3페이즈 독감염 전파를 막기 위해 파티원 간의 좌우 교차 정렬 거리 유격을 필수 유지하세요." },
    { id: "c_dusk", name: "카오스 더스크", zone: "weekly", level: 255, def: 300, reqIED: 94, reqForce: { type: "arcane", val: 730 }, reqCp: 40000000, price: 175000000, phases: [127500000000000], img: "dusk.png", tip: "공포 게이지 완전 잠식 상태 진입 시 에르다의 의지 유틸을 돌려 촉수 기절 콤보를 상쇄시키세요." },
    { id: "h_dunkel", name: "하드 듄켈", zone: "weekly", level: 265, def: 300, reqIED: 94, reqForce: { type: "arcane", val: 730 }, reqCp: 40000000, price: 185000000, phases: [157500000000000], img: "dunkel.png", tip: "엘리트 보스들의 연쇄 사선 발사와 하늘 운석 낙하 궤적을 숏블링크 체공으로 우회 회피하세요." },
    { id: "h_hilla_j", name: "하드 진 힐라", zone: "weekly", level: 250, def: 300, reqIED: 94, reqForce: { type: "arcane", val: 900 }, reqCp: 50000000, price: 215000000, phases: [176000000000000], img: "hilla.png", tip: "붉은 실에 고의 피격되어 해골 데스카운트 압류 주기를 조율하고 영혼 제단을 수동 파열시키세요." },
    { id: "h_mage", name: "하드 검은 마법사", zone: "weekly", level: 255, def: 300, reqIED: 95, reqForce: { type: "arcane", val: 1320 }, reqCp: 120000000, price: 780000000, phases: [63000000000000, 115500000000000, 157500000000000, 136500000000000], img: "black.png", tip: "창조/파괴 권능 주기에만 무적기를 배정하고 초당 극딜 동선 정렬에 주력하세요." },

    // 🔸 그란디스 신대륙 레이드 구역 (🔥 공인 방어율 380% 정밀 매립 라인업)
    { id: "h_seren", name: "하드 선택받은 세렌", zone: "grandis", level: 265, def: 380, reqIED: 95, reqForce: { type: "sacred", val: 200 }, reqCp: 180000000, price: 920000000, phases: [126000000000000, 357000000000000], img: "seren.png", tip: "석양/자정 페이즈 전환 기동에 맞춰 태양 게이지 한계치 돌파를 막기 위해 기둥 엄폐물 뒤로 이탈하세요." },
    { id: "h_seren_alt", name: "선택받은 세렌 (각성)", zone: "grandis", level: 265, def: 380, reqIED: 95, reqForce: { type: "sacred", val: 200 }, reqCp: 150000000, price: 950000000, phases: [126000000000000, 357000000000000], img: "hyung.gif", tip: "특수 페이즈의 융합 패널티를 억제하기 위해 보공 도핑 보정을 정밀하게 유지해야 합니다." },
    { id: "n_kalos", name: "노멀 감시자 칼로스", zone: "grandis", level: 270, def: 380, reqIED: 95, reqForce: { type: "sacred", val: 300 }, reqCp: 250000000, price: 1050000000, phases: [336000000000000, 720000000000000], img: "kalos.png", tip: "4개 외곽 런처 속박 기믹을 정밀 분담 타격하여 리얼 그로기 증폭 스위치를 가동하세요." },
    { id: "c_kalos", name: "카오스 감시자 칼로스", zone: "grandis", level: 275, def: 380, reqIED: 96, reqForce: { type: "sacred", val: 350 }, reqCp: 700000000, price: 1900000000, phases: [1066000000000000, 4016000000000000], img: "jupi.gif", tip: "강화 폭발 간섭 궤도를 숏대시나 무적 프레임으로 완전 상쇄 제어해 나가야 안정권 진입이 열립니다." },
    { id: "n_kaling", name: "노멀 카링", zone: "grandis", level: 275, def: 380, reqIED: 95, reqForce: { type: "sacred", val: 350 }, reqCp: 600000000, price: 1550000000, phases: [1200000000000000, 1200000000000000, 1446000000000000], img: "karing.png", tip: "사흉수 분리 공간 조화를 유기적으로 리드하여 게이지 대폭발 대미지를 원천 차단해 내십시오." },
    { id: "h_kaling", name: "하드 카링", zone: "grandis", level: 280, def: 380, reqIED: 96, reqForce: { type: "sacred", val: 400 }, reqCp: 1000000000, price: 3200000000, phases: [2760000000000000, 5058000000000000, 10182000000000000], img: "karing.png", tip: "3페이즈 통합 사흉수 난사 분기 진입 시 파티원 공동 무적기를 정렬하세요." },
    { id: "n_limbo", name: "노멀 림보", zone: "grandis", level: 285, def: 380, reqIED: 96, reqForce: { type: "sacred", val: 500 }, reqCp: 700000000, price: 2300000000, phases: [1944000000000000, 1944000000000000, 2592000000000000], img: "limbo.png", tip: "근원 왜곡 필드가 무작위 확장될 때 수동 대시 액티브 유틸리티로 외곽 사선을 우회 가드하세요." },

    /* 🔺 상위 최강 초월 및 익스트림 레이드 구역 */
    { id: "x_suu", name: "익스트림 스우", zone: "transcendent", level: 275, def: 300, reqIED: 95, reqForce: { type: "sacred", val: 250 }, reqCp: 340000000, price: 3500000000, phases: [435000000000000, 435000000000000, 580000000000000], img: "suu.png", tip: "강화형 분쇄 파편 낙하는 방어가 불가능하므로 풀 무적 오라 스위치를 즉시 켜야 합니다." },
    { id: "x_mage", name: "익스트림 검은 마법사", zone: "transcendent", level: 275, def: 300, reqIED: 96, reqForce: { type: "arcane", val: 1320 }, reqCp: 800000000, price: 4500000000, phases: [3500000000000000, 3500000000000000, 4200000000000000, 3700000000000000], img: "black.gif", tip: "체력 연산 스케일이 경 단위에 달하므로 파티원과의 시너지 버프 동기화 정렬이 선제 요구됩니다." },
    { id: "x_seren", name: "익스트림 선택받은 세렌", zone: "transcendent", level: 275, def: 380, reqIED: 96, reqForce: { type: "sacred", val: 250 }, reqCp: 1100000000, price: 5000000000, phases: [3650000000000000, 10850000000000000], img: "hyung.png", tip: "어센틱포스 증폭 비율 만족 여부를 최종 검증하고 순간 극딜 타이밍에 오리진을 연계하세요." },
    { id: "x_kalos", name: "익스트림 감시자 칼로스", zone: "transcendent", level: 280, def: 380, reqIED: 96, reqForce: { type: "sacred", val: 400 }, reqCp: 1600000000, price: 6000000000, phases: [5970000000000000, 15498000000000000], img: "kalos.png", tip: "2.14경에 달하는 한계 체력을 녹여내기 위해 6차 마스터리 코어 성장이 필수적으로 도킹되어야 합니다." },
    { id: "x_kaling", name: "익스트림 카링", zone: "transcendent", level: 285, def: 380, reqIED: 96, reqForce: { type: "sacred", val: 450 }, reqCp: 2500000000, price: 7500000000, phases: [18189000000000000, 22522000000000000, 34289000000000000], img: "karing.png", tip: "성향 한계치를 극복할 수 있도록 풀 수동 연계 도핑 버프 리스트를 전부 마운트하십시오." },
    { id: "h_adversary", name: "하드 최초의 대적자", zone: "transcendent", level: 285, def: 380, reqIED: 96, reqForce: { type: "sacred", val: 500 }, reqCp: 1200000000, price: 8500000000, phases: [3135000000000000, 3135000000000000, 4180000000000000], img: "daejeok.png", tip: "공간 파열 임팩트 가동 전 상위 6차 오리진 무적 홀딩 타임을 완벽 동기화 매칭하세요." },
    { id: "h_limbo", name: "하드 림보", zone: "transcendent", level: 285, def: 380, reqIED: 96, reqForce: { type: "sacred", val: 550 }, reqCp: 1400000000, price: 9500000000, phases: [3774000000000000, 3774000000000000, 4884000000000000], img: "limbo.png", tip: "초당 가변 페이즈 붕괴 데미지 축소 링크 및 최종 무적 리레 타이밍 극대화 설계를 안착 정돈합니다." },
    { id: "h_valdrix", name: "하드 발드릭스", zone: "transcendent", level: 290, def: 380, reqIED: 97, reqForce: { type: "sacred", val: 650 }, reqCp: 1700000000, price: 10500000000, phases: [5344000000000000, 5685000000000000, 9309000000000000], img: "bal.png", tip: "고대 정령 수호 낙하 궤적을 예측하여 맵 구석 유틸 버퍼 링크를 대기하세요." }
];

// 현재 사용자가 우측 분석 도크에서 선택해 보고 있는 보스의 ID (기본값: 하드 검은 마법사)
window.omniSelectedBossId = "h_mage"; 

// 💰 [주간 보스 수익 계산기 체크 상태 관리 집합]
// 초보자 설명: 사용자가 체크박스로 선택한 보스들의 ID를 중복 없이 모아두는 Set 객체입니다.
if (!window.omniCheckedBosses) {
    window.omniCheckedBosses = new Set();
}

// 🛡️ [실전 딜 연산 보정 계수]
window.omniHwansanModifiers = {
    hexaLevel: 15,        // HEXA 6차 스킬/코어 평균 강화 레벨
    seedRing: "rele4",    // 시드링 장전 기준 (리레 4레벨 기준)
    jobTierFactor: 1.0,   // DPM 가중 직업 계수 기본값
    patternLoss: 30       // 실전 보스 패턴으로 인한 딜 손실 평균 비율 (30%)
};

/**
 * 🛠️ [캐릭터 검색 동기화 및 전역 스탯 추출 모듈]
 * 설명: NexOn Open API 데이터를 스캔하여 캐릭터 스탯(전투력, 방무, 보공, 포스 등)을 파싱합니다.
 *       문자열에 쉼표(,)가 섞여있어도 파싱 오류가 발생하지 않도록 정규식 안전처리를 포함합니다.
 */
window.parseOmniCurrentSpecs = function() {
    const data = window.currentSearchData;
    // 검색 전이거나 데이터가 유효하지 않을 때 사용하는 기본 가상 캐릭터 데이터입니다.
    const specs = { name: "조회 대기 캐릭터", class: "미등록 직업", level: 283, cp: 67980000, arcane: 1400, sacred: 370, ied: 95.14, bossDmg: 300, finalDmg: 65, critDmg: 82 };

    if (!data || !data.basic || !data.basic.character_level) return specs;

    specs.name = data.basic.character_name || "미등록";
    specs.class = data.basic.character_class || "일반직업";
    specs.level = parseInt(data.basic.character_level) || 200;

    if (data.stat && Array.isArray(data.stat.final_stat)) {
        data.stat.final_stat.forEach(item => {
            // 전투력 파싱: 문자열 내의 모든 쉼표(,)를 제거 후 숫자로 안전하게 바꿉니다.
            if (item.stat_name === "전투력") specs.cp = parseFloat(String(item.stat_value).replace(/,/g, '')) || 0;
            if (item.stat_name === "방어율 무시") specs.ied = parseFloat(item.stat_value) || 0;
            if (item.stat_name === "보스 공격력" || item.stat_name === "보스 몬스터 데미지") specs.bossDmg = parseFloat(item.stat_value) || 0;
            if (item.stat_name === "아케인포스") specs.arcane = parseInt(item.stat_value) || 0;
            if (item.stat_name === "어센틱포스") specs.sacred = parseInt(item.stat_value) || 0;
            if (item.stat_name === "최종 데미지") specs.finalDmg = parseFloat(item.stat_value) || 65;
            if (item.stat_name === "크리티컬 데미지") specs.critDmg = parseFloat(item.stat_value) || 82;
        });
    }
    return specs;
};

/**
 * 🎯 [요구사항 1] 보스 격파 가능 여부 판정 코어 함수
 * 설명: 추천 전투력(reqCp), 요구 포스(reqForce), 레벨 제한(level) 3가지 기준으로 격파 여부를 정밀 진단합니다.
 */
window.checkBossClearable = function(boss, u) {
    // 1. 전투력 검사: 캐릭터 전투력 >= 보스 추천 전투력
    const cpOk = u.cp >= (boss.reqCp || 0);

    // 2. 포스(아케인/어센틱) 검사
    let forceOk = true;
    let forceMsg = "포스 요구 없음";
    if (boss.reqForce) {
        if (boss.reqForce.type === 'arcane') {
            forceOk = u.arcane >= boss.reqForce.val;
            forceMsg = `아케인포스 ${u.arcane} / ${boss.reqForce.val}`;
        } else if (boss.reqForce.type === 'sacred') {
            forceOk = u.sacred >= boss.reqForce.val;
            forceMsg = `어센틱포스 ${u.sacred} / ${boss.reqForce.val}`;
        }
    }

    // 3. 레벨 페널티(렙뻥) 검사: 캐릭터 레벨이 보스 레벨보다 15 이상 낮으면 스펙 미달로 판정
    const levelDiff = u.level - boss.level;
    const levelOk = levelDiff >= -15;

    // 전투력, 포스, 레벨 3가지 조건을 모두 충족해야만 최종 격파 가능으로 간주합니다.
    const isSuccess = cpOk && forceOk && levelOk;

    return {
        isSuccess: isSuccess,
        cpOk: cpOk,
        forceOk: forceOk,
        levelOk: levelOk,
        forceMsg: forceMsg,
        reqCpFormatted: boss.reqCp >= 100000000 ? `${(boss.reqCp / 100000000).toFixed(1)}억` : `${(boss.reqCp / 10000).toLocaleString()}만`
    };
};

/**
 * 💰 [요구사항 2] 주간 보스 수익 자동 계산기 연산 함수
 * 설명: 사용자가 체크박스로 선택해 놓은 보스들의 결정석 가격을 모두 더해 총 메소 금액을 산출합니다.
 */
window.calculateTotalBossRevenue = function() {
    let totalMeso = 0;
    OMNI_PERFECT_BOSS_MAP.forEach(boss => {
        if (window.omniCheckedBosses.has(boss.id) && boss.price) {
            totalMeso += boss.price;
        }
    });
    return totalMeso;
};

/**
 * 🧮 메소 단위 가독성 변환 포맷터
 * 설명: 숫자로 전달된 메소 금액을 "X억 Y만 메소" 형태의 한국어 단위로 정돈합니다.
 */
window.formatMesoUnit = function(meso) {
    if (!meso || meso === 0) return "0 메소";
    const eok = Math.floor(meso / 100000000);
    const man = Math.floor((meso % 100000000) / 10000);
    
    let result = "";
    if (eok > 0) result += `${eok}억 `;
    if (man > 0) result += `${man.toLocaleString()}만 `;
    return result.trim() + " 메소";
};

/**
 * 🔄 보스 체크박스 상태 토글 이벤트 핸들러
 * 설명: 사용자가 타일 카드의 체크박스를 눌렀을 때 실행되며, 선택 상태 변경 후 수익 표시 UI를 즉시 업데이트합니다.
 */
window.toggleBossCheck = function(bossId) {
    if (window.omniCheckedBosses.has(bossId)) {
        window.omniCheckedBosses.delete(bossId);
    } else {
        window.omniCheckedBosses.add(bossId);
    }
    window.updateRevenueDisplayUI();
};

/**
 * ⚡ [스마트 원클릭 기능] 격파 가능 보스 자동 선택 처리 함수
 * 설명: 현재 스펙으로 격파 가능한 모든 보스를 한 번에 자동으로 선택 상태로 지정합니다.
 */
window.autoSelectClearableBosses = function() {
    const u = window.parseOmniCurrentSpecs();
    OMNI_PERFECT_BOSS_MAP.forEach(boss => {
        const status = window.checkBossClearable(boss, u);
        if (status.isSuccess) {
            window.omniCheckedBosses.add(boss.id);
        } else {
            window.omniCheckedBosses.delete(boss.id);
        }
    });
    window.renderOmniBossPageFramework();
};

/**
 * 💵 실시간 주간 보스 수익 계산기 UI 상단 갱신 전용 함수
 */
window.updateRevenueDisplayUI = function() {
    const totalMeso = window.calculateTotalBossRevenue();
    const count = window.omniCheckedBosses.size;
    const mesoTextElem = document.getElementById('omniTotalRevenueText');
    const countTextElem = document.getElementById('omniCheckedCountText');

    if (mesoTextElem) mesoTextElem.innerText = window.formatMesoUnit(totalMeso);
    if (countTextElem) countTextElem.innerText = `${count}개`;
};

/**
 * 🧱 [보스 관제소 프레임워크 빌더]
 * 설명: 좌측 레이아웃(유저 정보, 주간 수익 계산기 상단바, 보스 격자)과 우측 상세 도크를 조립합니다.
 */
window.renderOmniBossPageFramework = function() {
    const targetBody = document.getElementById('bossContent');
    if (!targetBody) return;

    const u = window.parseOmniCurrentSpecs();
    const formattedCp = (u.cp >= 100000000) ? `${(u.cp / 100000000).toFixed(1)}억` : `${(u.cp / 10000).toLocaleString()}만`;

    const initialTotalMeso = window.calculateTotalBossRevenue();
    const initialCount = window.omniCheckedBosses.size;

    targetBody.innerHTML = `
        <div class="omni-ultra-boss-layout expanded-view">
            <!-- 🎰 [좌측 분할 영역] 구역별 보스 관제 매트릭스 보드 -->
            <div class="omni-boss-grid-panel enlarged">
                
                <!-- 🔍 스캔 캐릭터 정보 대시보드 바 -->
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

                <!-- 💰 [요구사항 2] 주간 보스 수익 통합 자동 계산기 렌더링 박스 -->
                <div class="omni-revenue-calculator-box" style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); border-radius: 8px; padding: 12px 16px; margin: 10px 0; color: #ffffff; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
                    <div>
                        <div style="font-size: 11px; color: #a5b4fc; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">💰 주간 보스 결정석 수익 계산기</div>
                        <div style="font-size: 16px; font-weight: 900; color: #38bdf8; margin-top: 2px;">
                            선택 보스 합산 수익: <span id="omniTotalRevenueText" style="color: #facc15; font-size: 18px;">${window.formatMesoUnit(initialTotalMeso)}</span>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 12px; color: #c7d2fe;">선택됨: <b id="omniCheckedCountText" style="color: #ffffff;">${initialCount}개</b></span>
                        <button onclick="window.autoSelectClearableBosses()" style="background: #4f46e5; hover:background: #4338ca; border: none; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s;">
                            ⚡ 격파가능 보스 자동선택
                        </button>
                    </div>
                </div>

                <div class="omni-grid-header-bar">
                    <span class="live-pulse-dot"></span>
                    <strong class="omni-panel-title-text">실시간 보스 격자 매트릭스 관제소 (추천전투력/포스/렙뻥 판정)</strong>
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

            <!-- 📂 [우측 분할 영역] 보스 상세 분석 및 진단 리포트 도크 -->
            <div class="omni-boss-detail-dock-panel" id="omniBossDetailDockPanel"></div>
        </div>
    `;

    window.buildCompactBossGridItems(u);
    window.updateSelectedBossDetailDock(window.omniSelectedBossId, u);
};

/**
 * 📊 [지피티 환산대미지 복리 수식 기반 연산 코어커널]
 * 설명: 상세스텟 분석표 출력을 위한 실방무 및 실효 관통 비율 연산 모듈입니다.
 */
window.calculateOmniPrecisionDps = function(boss, u) {
    const realUserIed = 1 - (1 - u.ied / 100) * (1 - 0.20);
    const remainDefense = boss.def * (1 - realUserIed);
    const iedEfficiencyFactor = Math.max(0.01, 1 - remainDefense / 100);

    const hexaMultiplier = 1.0 + (window.omniHwansanModifiers.hexaLevel * 0.012); 
    const ringMultiplier = 1.12; 
    const patternLossCorrection = (100 - window.omniHwansanModifiers.patternLoss) / 100; 

    const finalDmgMultiplier = (u.finalDmg / 100) + 1.0;
    const bossDmgMultiplier = 1.0 + (u.bossDmg / 100);
    const critDmgMultiplier = 1.0 + (u.critDmg / 100);
    
    const basePowerScore = u.cp * 650;
    const finalExpectedDps = basePowerScore * finalDmgMultiplier * bossDmgMultiplier * critDmgMultiplier * iedEfficiencyFactor * ringMultiplier * hexaMultiplier * window.omniHwansanModifiers.jobTierFactor * patternLossCorrection;

    return {
        dps: finalExpectedDps,
        iedPercent: (realUserIed * 100).toFixed(2),
        effDmg: (iedEfficiencyFactor * 100).toFixed(1)
    };
};

/**
 * 📊 [구역 분할형 격자 카드 생성기]
 * 설명: 각 구역별 보스 카드를 생성할 때 추천 전투력/포스/레벨에 따라 '격파 가능' / '스펙/포스 부족' 카드를 렌더링하고,
 *       체크박스를 탑재하여 사용자가 체크 시 보스 수익 계산에 반영되도록 연결합니다.
 */
window.buildCompactBossGridItems = function(u) {
    const zones = {
        weekly: document.getElementById('grid-zone-weekly'),
        grandis: document.getElementById('grid-zone-grandis'),
        transcendent: document.getElementById('grid-zone-transcendent')
    };

    if (!zones.weekly || !zones.grandis || !zones.transcendent) return;

    OMNI_PERFECT_BOSS_MAP.forEach(boss => {
        // [요구사항 1 적용] 추천 전투력, 포스, 레벨 기준 격파 진단 수행
        const status = window.checkBossClearable(boss, u);
        const isSelectedClass = (boss.id === window.omniSelectedBossId) ? "active-selected" : "";
        const statusClass = status.isSuccess ? "success" : "failed";
        const statusLabel = status.isSuccess ? "격파 가능" : "스펙/포스 부족";
        const isChecked = window.omniCheckedBosses.has(boss.id);

        const cardHtml = `
            <div class="omni-boss-mini-card ${isSelectedClass} ${statusClass}" onclick="window.handleBossCardClick('${boss.id}')" style="position: relative;">
                <!-- 💰 [요구사항 2] 보스 체크박스 (클릭 시 수익 합산 토글) -->
                <div style="position: absolute; top: 6px; right: 6px; z-index: 10;" onclick="event.stopPropagation();">
                    <input type="checkbox" id="chk_${boss.id}" ${isChecked ? 'checked' : ''} onchange="window.toggleBossCheck('${boss.id}')" style="width: 16px; height: 16px; cursor: pointer; accent-color: #6366f1;">
                </div>

                <div class="mini-card-avatar-wrap large-frame">
                    <img src="${OMNI_LOCAL_ICON_PATH + boss.img}" class="mini-card-boss-img" onerror="this.src='https://open.api.nexon.com/static/maplestory/item/default.png';">
                </div>
                <div class="mini-card-text-metadata">
                    <strong class="mini-boss-title-name">${boss.name}</strong>
                    <div class="mini-boss-forecast-tag ${statusClass}">
                        ${statusLabel} <span class="forecast-time-sub">(추천: ${status.reqCpFormatted})</span>
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
 * 설명: 카드 클릭 시 선택된 보스를 우측 도크에 노출합니다.
 */
window.handleBossCardClick = function(bossId) {
    window.omniSelectedBossId = bossId;
    const u = window.parseOmniCurrentSpecs();
    window.renderOmniBossPageFramework();
};

/**
 * 📂 [우측 상세 분석 도크 리포트 출력 모듈]
 * 설명: 선택 보스 스펙 매칭 리포트, 페이즈 정보, 상세스텟 분석표,
 *       그리고 지침에 따라 상세스텟 설정 분석표 바로 아래에 도핑 세팅 가이드를 배치하여 렌더링합니다.
 */
window.updateSelectedBossDetailDock = function(bossId, u) {
    const detailDock = document.getElementById('omniBossDetailDockPanel');
    if (!detailDock) return;

    const boss = OMNI_PERFECT_BOSS_MAP.find(b => b.id === bossId) || OMNI_PERFECT_BOSS_MAP[16];
    const totalHp = boss.phases.reduce((acc, hp) => acc + hp, 0);

    // 격파 매칭 상태 및 DPS 관통치 계산
    const status = window.checkBossClearable(boss, u);
    const calc = window.calculateOmniPrecisionDps(boss, u);

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

            <!-- 🎯 선택 보스 스펙 매칭 진단 리포트 -->
            <div class="dock-content-section-box">
                <h4 class="dock-section-sub-title">🎯 선택 보스 스펙 매칭 진단 리포트</h4>
                <div class="omni-hwansan-static-report-list">
                    <div class="report-row-item">✔ <b>전투력 커트라인:</b> <span>추천 ${status.reqCpFormatted} / 내 전투력 ${u.cp >= 100000000 ? (u.cp/100000000).toFixed(1)+'억' : (u.cp/10000).toLocaleString()+'만'} (${status.cpOk ? '🟢 충족' : '🔴 미달'})</span></div>
                    <div class="report-row-item">✔ <b>심볼/어센틱 포스:</b> <span>${boss.reqForce ? status.forceMsg : '포스 요구 없음'} (${status.forceOk ? '🟢 충족' : '🔴 미달'})</span></div>
                    <div class="report-row-item">✔ <b>레벨 렙뻥 페널티:</b> <span>캐릭터 Lv.${u.level} vs 보스 Lv.${boss.level} (${status.levelOk ? '🟢 정상' : '🔴 레벨 차이 과다'})</span></div>
                    <div class="report-row-item">✔ <b>결정석 예상 판매가:</b> <span style="color: #059669; font-weight: 900;">${window.formatMesoUnit(boss.price || 0)}</span></div>
                </div>
            </div>

            <!-- ⏱️ 보스 페이즈별 HP 정보 -->
            <div class="dock-content-section-box">
                <h4 class="dock-section-sub-title">보스 페이즈별 HP 정보 및 레이드 규격</h4>
                <div class="total-hp-master-badge">레이드 총 HP 규모: <span>${formattedTotalHp}</span></div>
                <div class="phase-time-vertical-stack">
                    ${boss.phases.map((hp, idx) => `
                        <div class="phase-time-row-item">
                            <div class="phase-badge-label">${idx + 1}페이즈</div>
                            <div class="phase-hp-value">HP ${hp >= 1000000000000 ? (hp/1000000000000).toFixed(1)+'조' : (hp/100000000).toLocaleString()}억</div>
                            <div class="phase-predicted-time">${status.isSuccess ? '🟢 격파 안정권' : '🔴 스펙 보강 필요'}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- 📈 [상세스텟 설정 분석표 및 도핑 리스트] 섹션 -->
            <div class="dock-content-section-box">
                <h4 class="dock-section-sub-title">환산 배율 곱연산 실전 가중치 분석표 (상세스텟 설정)</h4>
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
                
                <!-- 💊 [지침 준수] 도핑리스트는 항상 상세스텟 설정 분석표 바로 밑에 위치합니다. -->
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

            <!-- 💡 공략 팁 섹션 -->
            <div class="dock-content-section-box">
                <h4 class="dock-section-sub-title">💡 실전 레이드 통합 관제 공략 가이드</h4>
                <div class="dock-premium-tips-paragraph-box">
                    ${boss.tip}
                </div>
            </div>
        </div>
    `;
};

// 🔍 검색 완료 및 페이지 전환 시 실시간 UI 리페인트 체인 연결 후크
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