/**
 * ============================================================================
 * 🎯 MAPLE OMNI V14 - js/simulator/simulator.js [COMPLETE LOGIC ENGINE]
 * 설명: 메이플 계정 내부 전체 캐릭터의 누적 재설정 수치 및 주문서/잠재 재획 비용 연산 스크립트입니다.
 * 패치 노트: 츄츄지지 스타일의 26종 모든 큐브 개수 출력 구조화 및 동적 리스트 렌더링 완성.
 * ============================================================================
 */

// ============================================================================
// 📦 [PART 1] 시뮬레이션 상태 보존 전역 매트릭스 센터
// ============================================================================
window.omniSimulatorState = {
    // 💡 OpenAPI 연동 모듈과 연동될 더미 재화 지표 데이터베이스 명세
    financeSummary: {
        totalMeso: 89030475000,      // 누적 사용한 전체 메소 (890억 3047만 5000메소)
        totalCash: 6600,             // 누적 소모 넥슨 캐시 수치
        totalAppraisal: 2448945500   // 잠재능력 봉인 해제 및 돋보기 감정에 소모된 누적 비용
    },
    
    // 💡 제공된 스크린샷의 순서와 종류를 100% 매핑한 메이플 실존 전체 큐브 자원 객체 배열
    cubeUsageData: [
        { id: "red", name: "레드 큐브", count: 1723, icon: "https://open.api.nexon.com/static/maplestory/item/cube/red.png" },
        { id: "black", name: "블랙 큐브", count: 700, icon: "https://open.api.nexon.com/static/maplestory/item/cube/black.png" },
        { id: "add", name: "에디셔널 큐브", count: 0, icon: "https://open.api.nexon.com/static/maplestory/item/cube/add.png" },
        { id: "artisan", name: "장인의 큐브", count: 4, icon: "https://open.api.nexon.com/static/maplestory/item/cube/artisan.png" },
        { id: "master", name: "명장의 큐브", count: 738, icon: "https://open.api.nexon.com/static/maplestory/item/cube/master.png" },
        { id: "karma_artisan", name: "카르마 장인의 큐브", count: 220, icon: "https://open.api.nexon.com/static/maplestory/item/cube/artisan_karma.png" },
        { id: "karma_master", name: "카르마 명장의 큐브", count: 0, icon: "https://open.api.nexon.com/static/maplestory/item/cube/master_karma.png" },
        { id: "strange_add", name: "수상한 에디셔널 큐브", count: 12, icon: "https://open.api.nexon.com/static/maplestory/item/cube/strange_add.png" },
        { id: "solid", name: "솔리드 큐브", count: 698, icon: "https://open.api.nexon.com/static/maplestory/item/cube/solid.png" },
        { id: "bright", name: "브라이트 큐브", count: 240, icon: "https://open.api.nexon.com/static/maplestory/item/cube/bright.png" },
        { id: "bonus", name: "화이트 에디셔널 큐브", count: 0, icon: "https://open.api.nexon.com/static/maplestory/item/cube/white_add.png" },
        { id: "miracle", name: "미라클 큐브", count: 10, icon: "https://open.api.nexon.com/static/maplestory/item/cube/miracle.png" },
        { id: "super_miracle", name: "최고급 미라클 큐브", count: 1473, icon: "https://open.api.nexon.com/static/maplestory/item/cube/super_miracle.png" },
        { id: "hyperpure", name: "초이스 큐브", count: 0, icon: "https://open.api.nexon.com/static/maplestory/item/cube/choice.png" },
        { id: "equality", name: "이퀄리티 큐브", count: 365, icon: "https://open.api.nexon.com/static/maplestory/item/cube/equality.png" },
        { id: "uni", name: "유니 큐브", count: 0, icon: "https://open.api.nexon.com/static/maplestory/item/cube/uni.png" },
        { id: "hex", name: "헥사 큐브", count: 243, icon: "https://open.api.nexon.com/static/maplestory/item/cube/hexa.png" },
        { id: "grand", name: "그랜드 미라클 큐브", count: 140, icon: "https://open.api.nexon.com/static/maplestory/item/cube/grand.png" },
        { id: "memorial", name: "메모리얼 큐브", count: 0, icon: "https://open.api.nexon.com/static/maplestory/item/cube/memorial.png" },
        { id: "black_add", name: "블랙 에디셔널 큐브", count: 101, icon: "https://open.api.nexon.com/static/maplestory/item/cube/black_add.png" },
        { id: "time", name: "타임 미라클 큐브", count: 0, icon: "https://open.api.nexon.com/static/maplestory/item/cube/time.png" },
        { id: "blessing", name: "축복의 큐브", count: 788, icon: "https://open.api.nexon.com/static/maplestory/item/cube/blessing.png" },
        { id: "premium", name: "프리미엄 큐브", count: 529, icon: "https://open.api.nexon.com/static/maplestory/item/cube/premium.png" },
        { id: "master_miracle", name: "마스터 미라클 큐브", count: 130, icon: "https://open.api.nexon.com/static/maplestory/item/cube/master_miracle.png" },
        { id: "glowing", name: "글로잉 큐브", count: 356, icon: "https://open.api.nexon.com/static/maplestory/item/cube/glowing.png" },
        { id: "bright_event", name: "명장 큐브 (이벤트)", count: 255, icon: "https://open.api.nexon.com/static/maplestory/item/cube/master_event.png" }
    ],

    // 💡 다차원 정밀 필터링을 제어하기 위한 실시간 액티브 변수 그룹
    activeCharacter: "전체 캐릭터",
    activeEquipment: "전체 장비",
    
    // 💡 드롭다운 메뉴를 형성할 전체 보유 대표 캐릭터 목록 배열
    characterList: ["전체 캐릭터", "자두잦", "홍시츠", "뽀우엉", "오지환"],
    // 💡 메이플스토리 인게임 장비 부위별 필터링 카테고리
    equipmentList: ["전체 장비", "무기", "보조무기", "엠블렘", "모자", "상의", "하의", "장갑", "신발", "반지1", "펜던트1"],

    // 💡 시뮬레이션 결과 표출용 5대 정밀 히스토리 로그 레코드 팩토리
    potentialLogs: [
        { date: "2026-07-15 14:22", charName: "자두잦", itemPart: "무기", cubeType: "브라이트 큐브", beforeGrade: "유니크", afterGrade: "레전드리", options: ["보스 몬스터 공격 시 데미지 +40%", "보스 몬스터 공격 시 데미지 +30%", "공격력 +9%"], cost: "메소 4,900,000" },
        { date: "2026-07-14 18:05", charName: "홍시츠", itemPart: "모자", cubeType: "레드 큐브", beforeGrade: "에픽", afterGrade: "유니크", options: ["올스탯 +9%", "최대 HP +6%", "DEX +6%"], cost: "메소 2,200,000" },
        { date: "2026-07-12 21:40", charName: "자두잦", itemPart: "엠블렘", cubeType: "블랙 큐브", beforeGrade: "레전드리", afterGrade: "레전드리", options: ["공격력 +12%", "공격력 +9%", "방어율 무시 +30%"], cost: "메소 5,400,000" },
        { date: "2026-07-10 11:12", charName: "뽀우엉", itemPart: "장갑", cubeType: "명장의 큐브", beforeGrade: "에픽", afterGrade: "에픽", options: ["크리티컬 데미지 +8%", "STR +6%", "LUK +6%"], cost: "재료 소모" },
        { date: "2026-07-09 03:50", charName: "오지환", itemPart: "보조무기", cubeType: "화이트 에디셔널", beforeGrade: "유니크", afterGrade: "레전드리", options: ["공격력 +12%", "공격력 +9%", "올스탯 +6%"], cost: "넥슨캐시 2,700" }
    ]
};

// ============================================================================
// 🛠️ [PART 2] 한국형 억/만 단위 화폐 포맷 변경 및 배지 바인딩 유틸
// ============================================================================

/**
 * 💡 초보자 가이드: 천문학적인 메소 단위를 '억' 및 '만' 한글 표기로 가공하여 시각적 직관성을 향상시킵니다.
 */
window.formatKoreanMoneyValue = function(value) {
    if (value >= 100000000) {
        const eok = Math.floor(value / 100000000);
        const man = Math.floor((value % 100000000) / 10000);
        const remainder = value % 10000;
        
        let result = `${eok}억`;
        if (man > 0) result += ` ${man}만`;
        if (remainder > 0) result += ` ${remainder}`;
        return result;
    }
    return value.toLocaleString();
};

/**
 * 💡 초보자 가이드: 큐브 변동 등급명 텍스트를 인지하여 그에 알맞은 CSS 스킨 배지 클래스명을 동적으로 할당합니다.
 */
window.getGradeBadgeClassName = function(grade) {
    switch (grade) {
        case "레전드리": return "badge-grade grade-legendary";
        case "유니크": return "badge-grade grade-unique";
        case "에픽": return "badge-grade grade-epic";
        case "레어": return "badge-grade grade-rare";
        default: return "badge-grade";
    }
};

// ============================================================================
// 🖥️ [PART 3] 시뮬레이션 데이터 렌더링 스크립트 컴파일러
// ============================================================================

/**
 * 💡 초보자 가이드: `index.html` 상단 내비게이션 바에서 [시뮬레이터] 탭이 호출될 시 구동되는 전역 초기화 함수입니다.
 */
window.initOmniSimulatorTab = function() {
    console.log("[OMNI V14] 시뮬레이터 라우터 통계 파이프라인 엔진 가동");
    
    // 메인 콘솔의 최상위 루트 테마 설정값(dark/light)을 안전하게 추적 로드합니다.
    const activeGlobalTheme = localStorage.getItem('omni-theme') || 'dark';
    const simulatorSection = document.getElementById('page-simulator');
    if (simulatorSection) {
        // 읽어들인 테마 속성을 시뮬레이터 섹션 루트 노드에 직접 할당하여 색상 스킨을 즉각 반영시킵니다.
        simulatorSection.setAttribute('data-theme', activeGlobalTheme);
    }
    
    window.renderOmniSimulatorUI();
};

/**
 * 💡 초보자 가이드: 상태 머신 객체에 기록된 데이터를 기반으로 `index.html` 내 지정 영역에 UI 요소를 출력하는 핵심 컴파일러입니다.
 */
window.renderOmniSimulatorUI = function() {
    // index.html 본문에 설계된 시뮬레이터 전용 렌더링 컨테이너 ID를 조준합니다.
    const viewContainer = document.getElementById('simulatorContent');
    if (!viewContainer) return;

    const state = window.omniSimulatorState;

    // 츄츄지지 통계 레이아웃 규격을 준수하여 3단 대시보드 및 리스트 테이블 골격을 마크업합니다.
    let layoutTemplateHtml = `
        <div class="sim-summary-grid">
            <div class="sim-summary-card">
                <div class="sim-card-label">🪙 누적 최적화 사용 메소</div>
                <div class="sim-card-value">${window.formatKoreanMoneyValue(state.financeSummary.totalMeso)}</div>
            </div>
            <div class="sim-summary-card">
                <div class="sim-card-label">💎 누적 소모 넥슨 캐시</div>
                <div class="sim-card-value">${state.financeSummary.totalCash.toLocaleString()} 원</div>
            </div>
            <div class="sim-summary-card">
                <div class="sim-card-label">🔍 누적 돋보기 잠재 감정 비용</div>
                <div class="sim-card-value">${window.formatKoreanMoneyValue(state.financeSummary.totalAppraisal)}</div>
            </div>
        </div>

        <div class="sim-main-box">
            <div class="sim-box-title">🎰 전체 캐릭터 큐브 재설정 누적 카운터 통계</div>
            <div class="sim-cube-grid" id="simCubeGridTarget"></div>
        </div>

        <div class="sim-main-box">
            <div class="sim-box-title">📜 전역 캐릭터 파츠별 실시간 옵션 변동 내역 레코드</div>
            
            <div class="sim-filter-bar">
                <select id="simCharFilter" class="sim-select-input" onchange="window.handleSimFilterChange()">
                    ${state.characterList.map(c => `<option value="${c}" ${state.activeCharacter === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
                
                <select id="simEquipFilter" class="sim-select-input" onchange="window.handleSimFilterChange()">
                    ${state.equipmentList.map(e => `<option value="${e}" ${state.activeEquipment === e ? 'selected' : ''}>${e}</option>`).join('')}
                </select>
            </div>

            <table class="sim-log-table">
                <thead>
                    <tr>
                        <th>스캔 타임</th>
                        <th>캐릭터 닉네임</th>
                        <th>장비 파츠</th>
                        <th>사용 재료</th>
                        <th>잠재 등급 변동</th>
                        <th>최종 획득 잠재 옵션 내역 명세</th>
                        <th>소모된 재화</th>
                    </tr>
                </thead>
                <tbody id="simLogTableTarget"></tbody>
            </table>
        </div>
    `;

    // 조합된 완성형 HTML 골격을 실시간 뷰포트에 최종 마운트 주입합니다.
    viewContainer.innerHTML = layoutTemplateHtml;

    // 하부 컴포넌트 데이터 바인딩 로직을 순차 연쇄 가동합니다.
    window.renderCubeGrid();
    window.renderPotentialLogs();
};

/**
 * 💡 초보자 가이드: 26종 메이플 전체 큐브 사용 누적치를 그리드 레이아웃 홀더 내부에 매핑하는 함수입니다.
 */
window.renderCubeGrid = function() {
    const targetGrid = document.getElementById('simCubeGridTarget');
    if (!targetGrid) return;

    const state = window.omniSimulatorState;
    
    // 26개 요소 데이터를 순회하여 각 아이콘 이미지와 카운팅 수치를 결합합니다.
    let gridInnerHtml = state.cubeUsageData.map(cube => `
        <div class="sim-cube-slot" title="${cube.name}">
            <img src="${cube.icon}" onerror="this.src='https://open.api.nexon.com/static/maplestory/item/default.png'">
            <div class="sim-cube-count">${cube.count.toLocaleString()}</div>
        </div>
    `).join('');

    targetGrid.innerHTML = gridInnerHtml;
};

/**
 * 💡 초보자 가이드: 설정된 캐릭터명 및 장비 부위 필터링 규격에 맞춰 테이블 결과 레코드를 고속으로 갱신하는 서브 컴파일러입니다.
 */
window.renderPotentialLogs = function() {
    const targetTableBody = document.getElementById('simLogTableTarget');
    if (!targetTableBody) return;

    const state = window.omniSimulatorState;

    // 활성화된 필터 조건 데이터를 분석하여 일치하는 로그 레코드만 여과합니다.
    const filteredResults = state.potentialLogs.filter(log => {
        const checkChar = (state.activeCharacter === "전체 캐릭터" || log.charName === state.activeCharacter);
        const checkEquip = (state.activeEquipment === "전체 장비" || log.itemPart === state.activeEquipment);
        return checkChar && checkEquip;
    });

    // 만약 필터링된 결과 데이터가 공석일 경우 표현될 예외 방어 프레임 주입
    if (filteredResults.length === 0) {
        targetTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--sim-text-sub); padding:40px;">설정된 다차원 필터 조건에 부합하는 잠재능력 재설정 로그 레코드가 존재하지 않습니다.</td></tr>`;
        return;
    }

    // 여과가 완료된 데이터를 루프 처리하여 최종 테이블 행 레코드로 컴파일합니다.
    let tableRowsInnerHtml = filteredResults.map(log => `
        <tr>
            <td style="color: var(--sim-text-sub); font-family: 'Consolas';">${log.date}</td>
            <td style="font-weight: 800; color: var(--sim-text-white);">${log.charName}</td>
            <td><span style="background: var(--sim-inner-bg); padding:4px 8px; border-radius:4px; border: 1px solid var(--sim-border);">${log.itemPart}</span></td>
            <td>${log.cubeType}</td>
            <td>
                <span class="${window.getGradeBadgeClassName(log.beforeGrade)}">${log.beforeGrade}</span>
                <span style="color: var(--sim-text-sub); margin: 0 5px;">→</span>
                <span class="${window.getGradeBadgeClassName(log.afterGrade)}">${log.afterGrade}</span>
            </td>
            <td>
                <div class="sim-option-box">
                    ${log.options.map(opt => `• ${opt}`).join('<br>')}
                </div>
            </td>
            <td style="font-family: 'Consolas'; color: var(--sim-text-white); font-weight: 800;">${log.cost}</td>
        </tr>
    `).join('');

    targetTableBody.innerHTML = tableRowsInnerHtml;
};

// ============================================================================
// 🔌 [PART 4] 실시간 필터 인터페이스 대응 핸들러 & 라우터 리스너 커널
// ============================================================================

/**
 * 💡 초보자 가이드: 유저가 캐릭터 혹은 장비 부위 드롭다운 메뉴를 변경 조작했을 때 감지하여 즉각 테이블 뷰만 연동 갱신시키는 이벤트 가드입니다.
 */
window.handleSimFilterChange = function() {
    const charSelectDOM = document.getElementById('simCharFilter');
    const equipSelectDOM = document.getElementById('simEquipFilter');

    if (charSelectDOM && equipSelectDOM) {
        // 선택된 드롭다운의 실제 value 값을 글로벌 상태 매트릭스에 즉시 동기화 보존합니다.
        window.omniSimulatorState.activeCharacter = charSelectDOM.value;
        window.omniSimulatorState.activeEquipment = equipSelectDOM.value;
        
        // 전체 레이아웃 리프레시 없이 하부 테이블 컴포넌트만 부분 렌더링 파이프라인으로 초고속 갱신합니다.
        window.renderPotentialLogs();
    }
};

/**
 * 💡 V14 전역 라우터 스위칭 체인 이벤트 바인딩 리스너
 * 내비게이션 바 메뉴 내 `nav-btn-simulator` ID 버튼 클릭을 트리거하여 탭 진입 시 초기화 구문을 연동 작동시킵니다.
 */
window.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'nav-btn-simulator') {
        setTimeout(function() {
            if (typeof window.initOmniSimulatorTab === 'function') {
                window.initOmniSimulatorTab();
            }
        }, 50); // 라우터 변환 인터벌 싱크 조율용 50ms 안심 마진 타이머 가동
    }
});