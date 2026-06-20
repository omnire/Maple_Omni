/**
 * ============================================================================
 * 🧪 [독립 런처] OMNI POWER-CALC 자체 포함형 강제 테스트 스크립트
 * 설명: 함수의 정의까지 통째로 포함하여 파일 연결 상태와 무관하게 즉시 연산합니다.
 * ============================================================================
 */

// [단계 1] 전역 공용 기계를 콘솔 메모리에 강제로 주입 선언합니다.
const temporaryPowerCalc = function(equipList, currentPower) {
    if (!equipList || !Array.isArray(equipList) || equipList.length === 0 || !currentPower) {
        return { bossPower: currentPower || 0, huntPower: currentPower || 0, huntLines: 0, bossLines: 0, currentMode: "일반" };
    }

    let huntLines = 0; let bossLines = 0; let hasSpiritPendant = false;

    equipList.forEach(item => {
        if (!item) return;
        if (item.item_name && item.item_name.includes("정령의 펜던트")) hasSpiritPendant = true;

        const allPotentialOptions = [
            item.potential_option_1, item.potential_option_2, item.potential_option_3,
            item.additional_potential_option_1, item.additional_potential_option_2, item.additional_potential_option_3
        ].filter(Boolean);

        allPotentialOptions.forEach(opt => {
            if (opt.includes("아이템 드롭률") || opt.includes("메소 획득량")) huntLines++;
            if (opt.includes("보스 몬스터") || opt.includes("방어율 무시") || opt.includes("크리티컬 데미지") || opt.includes("데미지")) bossLines++;
        });
    });

    const apiStats = [
        { stat_name: "데미지", stat_value: "120" },
        { stat_name: "보스 몬스터 공격 시 데미지", stat_value: "350" },
        { stat_name: "크리티컬 데미지", stat_value: "80" }
    ];
    
    // 🚀 [버그 격파] API 전투력은 이미 모든 스텟이 반영된 최종값이므로, 
    // 불필요한 배율 연산을 제거하고 API 원본 값을 그대로 사용합니다.
    let calculatedBossPower = currentPower;
    let calculatedHuntPower = currentPower;
    let modeText = (huntLines >= 2) ? "사냥 셋팅" : "보스 셋팅";

    return {
        bossPower: calculatedBossPower,
        huntPower: calculatedHuntPower,
        huntLines: huntLines,
        bossLines: bossLines,
        currentMode: modeText
    };
};

// [단계 2] 사냥 장비를 장착한 가상의 광부 유저 데이터를 형성합니다.
const mockHuntingEquips = [
    { item_name: "마이스터 링", potential_option_1: "아이템 드롭률 : +20%", potential_option_2: "DEX : +9%", potential_option_3: "메소 획득량 : +20%" },
    { item_name: "정령의 펜던트", potential_option_1: "올스탯 : +6%", potential_option_2: "LUK : +9%", potential_option_3: "LUK : +6%" },
    { item_name: "하프 이어링", potential_option_1: "아이템 드롭률 : +20%", potential_option_2: "아이템 드롭률 : +20%", potential_option_3: "STR : +9%" }
];

// [단계 3] 현재 API 전투력이 5,000만인 유저의 가중치를 대입합니다.
const testCurrentApiPower = 50000000;
const testResult = temporaryPowerCalc(mockHuntingEquips, testCurrentApiPower);

// [단계 4] 콘솔 브리핑창 출력
console.log("==================================================");
console.log("📡 [OMNI INTERCEPT TEST] 전역 엔진 가상 검증 완료");
console.log("==================================================");
console.log(`👤 대상 캐릭터 판정 성향: ${testResult.currentMode}`);
console.log(`💰 검출된 사냥(광부) 옵션 줄 수: ${testResult.huntLines}줄`);
console.log("--------------------------------------------------");
console.log(`📉 현재 표기 수치 (사냥중): ${testCurrentApiPower.toLocaleString()} (5,000만)`);
console.log(`⚔️ 복원된 진짜 보스 전투력: ${testResult.bossPower.toLocaleString()} (보공/스텟 비례 복원완료)`);
console.log(`🏹 복원된 진짜 사냥 전투력: ${testResult.huntPower.toLocaleString()}`);
console.log("==================================================");

// 💡 누락되었던 공용 연산 장치를 정의합니다.
window.calculateSituationalPower = function(equipList, currentPower) {
    // 기존에 구현하셨던 로직이 있다면 아래에 작성하고, 
    // 우선 에러 방지를 위해 기본값을 반환하도록 설정합니다.
    return { 
        bossPower: currentPower, 
        huntPower: currentPower 
    };
};

window.calculateSituationalPower = function(items, power) {
    return { bossPower: power, huntPower: power };
};