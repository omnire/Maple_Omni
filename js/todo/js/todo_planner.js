/**
 * ============================================================================
 * 📑 MAPLE OMNI V14 - js/todo/js/todo_planner.js [📅 PLANNER & EXP SYSTEM]
 * 역할: 미래 지향 레벨 스케줄 설계서 관리, 경험치 데이터 기반 목표 도달 예상 기일 산출
 * 수정사항: 일평균 경험치가 0일 때 발생 가능한 분모 0 나누기 오류(EstimatedDays = Infinity) 방어 장치 추가
 * ============================================================================
 */

/**
 * 💡 캐릭터의 현 레벨과 7일간의 사냥 지표 평값 데이터를 조합하여 미래 목표 도달 일수를 계측 연산합니다.
 */
window.calculateExpPrediction = function(charName, targetLevel) {
    const char = window.omniTodoState.characters.find(c => c.name === charName);
    const currentLevel = char ? parseInt(char.level || 260, 10) : 260;
    
    // 예외 방어선 설정: 현재 레벨보다 낮은 목표치 입력 검출 시 연산을 즉각 락 세이프 가드 종료합니다.
    if (isNaN(targetLevel) || targetLevel <= currentLevel) {
        return { error: true, msg: "목표 레벨 설정 오류" };
    }

    let totalRequiredExp = 0;
    // 구간별 레벨업 요구 필요량 가상 가중치 누계 루프문을 처리합니다.
    for (let l = currentLevel; l < targetLevel; l++) {
        if (l < 270) totalRequiredExp += 1200000000000;
        else if (l < 280) totalRequiredExp += 3500000000000;
        else if (l < 290) totalRequiredExp += 9800000000000;
        else totalRequiredExp += 25000000000000;
    }

    const amounts = window.omniTodoState.mockExpHistory.amounts;
    
    // [초보자 가이드] 배열의 길이를 안전하게 보정하여 0 나누기 스크립트 셧다운 현상을 사전 차단합니다.
    const divisor = amounts.length || 1;
    const avgDailyExp = amounts.reduce((a, b) => a + b, 0) / divisor;
    
    // [초보자 가이드] 만약 최근 누적 경험치 평값이 0 이하라면 연산 불능 상태를 판단해 9999일로 예외 제어 처리합니다.
    const estimatedDays = avgDailyExp > 0 ? Math.ceil(totalRequiredExp / avgDailyExp) : 9999;
    
    // 현재 리얼 타임 일시를 기반으로 정확한 달력 도달 정산 기일을 시뮬레이트 산출합니다.
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + estimatedDays);
    const dateString = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;

    return { error: false, days: estimatedDays, finalDate: dateString };
};

/**
 * 외부 Chart.js 인프라를 거치 결착하여 최근 일주일 경험치 누적 기하 곡선 통계 그래프를 렌더 드로잉합니다.
 */
window.renderExpChart = function() {
    const ctx = document.getElementById('omniTodoExpChart');
    if (!ctx) return;

    // 메모리 누수를 방지하기 위해 잔류 가동 중이던 구형 그래프 메모리 인스턴스를 소멸 파쇄합니다.
    if (window.myTodoExpChartInstance) { window.myTodoExpChartInstance.destroy(); }
    const history = window.omniTodoState.mockExpHistory;

    window.myTodoExpChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: history.dates,
            datasets: [{
                label: '일일 EXP 수급량',
                data: history.amounts,
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.05)',
                borderWidth: 3,
                fill: true,
                tension: 0.3,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 9 }, callback: function(v) { return (v / 100000000).toLocaleString() + '억'; } } },
                x: { grid: { display: false }, ticks: { font: { size: 9 } } }
            }
        }
    });
};

window.renderTodoPlannerContent = function() {
    const container = document.getElementById('todo-planner');
    if (!container) return;

    const savedPlansRaw = localStorage.getItem("omni_v14_strategy_plans");
    let planList = savedPlansRaw ? JSON.parse(savedPlansRaw) : [];

    let cardsHtml = "";
    planList.forEach((plan, index) => {
        const targetLevelNum = parseInt(plan.goal.replace(/[^0-9]/g, ""), 10);
        let predictionHtml = "";

        // 빅데이터 성장 분석 타겟 수치가 정수 포맷일 경우에 한해 지능형 타임라인 배지를 연동 표출합니다.
        if (!isNaN(targetLevelNum)) {
            const pred = window.calculateExpPrediction(plan.char, targetLevelNum);
            if (!pred.error) {
                predictionHtml = `
                    <div class="exp-predict-badge">
                        📈 <strong>성장 예측 분석:</strong> 앞으로 <strong>${pred.days}일</strong> 뒤 목표 달성 예상 (${pred.finalDate})
                    </div>
                `;
            }
        }

        cardsHtml += `
            <div class="planner-card-item">
                <div class="planner-card-meta">
                    <span class="planner-card-tag">🎯 캐릭터: ${plan.char}</span>
                    <button class="planner-card-del-action" onclick="window.deleteTodoStrategyPlan(${index})">삭제</button>
                </div>
                <h5 class="planner-card-goal"><span class="plan-label-mini">목표</span>Lv.${plan.goal}</h5>
                <p class="planner-card-route"><span class="plan-label-mini-route">동선</span>${plan.route}</p>
                ${predictionHtml}
            </div>
        `;
    });

    let selectOptions = ``;
    window.omniTodoState.characters.forEach(c => { selectOptions += `<option value="${c.name}">${c.name}</option>`; });

    container.innerHTML = `
        ${window.renderGlobalTodoSummary()}
        <div class="omni-planner-container">
            <div class="planner-header-flex">
                <span class="planner-badge">STRATEGY DESIGNER</span>
                <h4 class="planner-main-title">📅 OMNI STRATEGY PLANNER (장기 육성 계획서)</h4>
                <div class="planner-form-row-custom">
                    <select id="todoPlannerCharSelect" class="planner-select-box">
                        ${selectOptions ? selectOptions : '<option value="미지정">캐릭터 없음</option>'}
                    </select>
                    <input type="text" id="todoPlannerGoalInput" placeholder="목표 레벨 기입 (예: 285)..." class="planner-input-field">
                    <input type="text" id="todoPlannerRouteInput" placeholder="이동 성장 루트 정의..." class="planner-input-field">
                    <button class="planner-btn-submit" onclick="window.addTodoStrategyPlan()">계획 수립</button>
                </div>
            </div>

            <div class="omni-planner-dashboard-layout">
                <div class="planner-left-stack">
                    <div class="planner-chart-panel">
                        <span class="chart-panel-tag">EXP MONITOR</span>
                        <h5 class="chart-panel-title">📈 최근 7일간의 경험치 누적 지표</h5>
                        <div class="chart-canvas-wrapper"><canvas id="omniTodoExpChart"></canvas></div>
                    </div>
                    <div class="planner-grid-cards">${cardsHtml ? cardsHtml : '<div class="omni-empty-state">수립된 전략 계획서가 존재하지 않습니다.</div>'}</div>
                </div>
                <div>${window.buildMiniCalendarComponentMarkup(planList.length)}</div>
            </div>
        </div>
    `;

    // 돔 그리기가 끝난 직후 비동기 딜레이를 주어 라인 그래프를 안전하게 주입 드로잉 처리합니다.
    setTimeout(window.renderExpChart, 50);
};

/**
 * 🗓️ 플래너 우측에 거치될 고성능 미니 출석 격자판 캘린더 컴포넌트 돔을 조합 빌드합니다.
 */
window.buildMiniCalendarComponentMarkup = function(planCount) {
    const weekLabels = ['일', '월', '화', '수', '목', '금', '토'];
    let daysHtml = "";
    weekLabels.forEach(l => { daysHtml += `<div class="calendar-day-label">${l}</div>`; });
    daysHtml += `<div class="calendar-date-cell empty-cell"></div>`;

    // 1일부터 30일까지 한 달 분량의 단일 날짜 세드를 루프 빌드 생성합니다.
    for(let d=1; d<=30; d++) {
        const isChecked = window.omniTodoState.calendarCheckedDays[d] === true;
        daysHtml += `<div class="calendar-date-cell ${isChecked ? 'is-checked' : ''}" onclick="window.toggleCalendarDateCell(${d})">${d}</div>`;
    }
    return `<div class="omni-mini-calendar-widget"><div class="calendar-header-title"><span>🗓️ 달력 체크 스케줄러</span></div><div class="calendar-days-grid">${daysHtml}</div></div>`;
};

window.toggleCalendarDateCell = function(dayNum) {
    window.omniTodoState.calendarCheckedDays[dayNum] = !window.omniTodoState.calendarCheckedDays[dayNum];
    localStorage.setItem("omni_v14_todo_calendar_checked", JSON.stringify(window.omniTodoState.calendarCheckedDays));
    window.switchTodoTab(window.omniTodoState.activeSubTab);
};

window.deleteTodoStrategyPlan = function(index) {
    const savedPlansRaw = localStorage.getItem("omni_v14_strategy_plans");
    if (!savedPlansRaw) return;
    let planList = JSON.parse(savedPlansRaw);
    planList.splice(index, 1);
    localStorage.setItem("omni_v14_strategy_plans", JSON.stringify(planList));
    window.renderTodoPlannerContent();
};

window.addTodoStrategyPlan = function() {
    const charSelect = document.getElementById('todoPlannerCharSelect');
    const goalInput = document.getElementById('todoPlannerGoalInput');
    const routeInput = document.getElementById('todoPlannerRouteInput');

    if (!goalInput || !routeInput || !goalInput.value.trim() || !routeInput.value.trim()) {
        alert("목표와 세부 동선을 모두 채워주셔야 계획서가 작성됩니다."); return;
    }

    const savedPlansRaw = localStorage.getItem("omni_v14_strategy_plans");
    let planList = savedPlansRaw ? JSON.parse(savedPlansRaw) : [];

    planList.unshift({
        char: charSelect ? charSelect.value : "미정",
        goal: goalInput.value.trim(),
        route: routeInput.value.trim()
    });

    localStorage.setItem("omni_v14_strategy_plans", JSON.stringify(planList));
    goalInput.value = ""; routeInput.value = "";
    window.renderTodoPlannerContent();
};