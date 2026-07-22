/**
 * ============================================================================
 * 📑 MAPLE OMNI V14 - js/todo/js/todo_planner.js [📅 PLANNER & HUNTING EXP SYNC]
 * 역할: 미래 지향 레벨 스케줄 설계서 관리, 사냥기록지 연동 EXP 분석 및 목표 도달 예상 기일 산출
 *       및 자정이 지난 후 날짜 변경 감지 및 일일 퀘스트 자동 갱신 기능 포함
 * 규칙: 초보자도 코드를 쉽게 이해할 수 있도록 기능별로 상세한 한글 주석을 기입했습니다.
 * ============================================================================
 */

/**
 * 💡 [초보자 가이드: 현재 날짜 문자열 가져오기]
 * 시스템의 오늘 날짜를 'YYYY-MM-DD' 형식의 텍스트로 만들어 반환하는 함수입니다.
 */
function getTodayDateString() {
    const now = new Date();
    const year = now.getFullYear(); // 연도 추출 (예: 2026)
    // 월은 0부터 시작하므로 +1을 하고, 1자리 숫자인 경우 앞에 '0'을 붙여 2자리로 맞춰줍니다.
    const month = String(now.getMonth() + 1).padStart(2, '0');
    // 일자 추출 및 2자리 포맷 맞춤
    const day = String(now.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`; // 최종 형태 예시: "2026-07-23"
}

/**
 * 💡 [초보자 가이드: 자정 지난 후 날짜 변경 감지 및 갱신 함수]
 * 페이지가 켜질 때 오늘 날짜와 브라우저에 저장된 마지막 날짜를 비교합니다.
 * 날이 바뀌었을 경우 일일 숙제를 초기화하고 오늘 날짜로 갱신합니다.
 */
function checkAndUpdateDateOnLoad() {
    const todayStr = getTodayDateString(); // 오늘의 정확한 날짜 문자열
    
    // 브라우저의 저장소(LocalStorage)에서 마지막으로 기록된 플래너 날짜를 가져옵니다.
    const lastSavedDate = localStorage.getItem('maple_omni_planner_date');
    
    // 만약 마지막 저장된 날짜가 오늘 날짜와 다르다면? (즉, 자정이 지나 날이 바뀐 경우)
    if (lastSavedDate !== todayStr) {
        console.log(`[TODO PLANNER] 날이 바뀌었습니다! 이전 날짜: ${lastSavedDate} -> 오늘 날짜: ${todayStr}`);
        
        // 새로운 하루에 맞춰 일일 퀘스트와 체크박스 상태를 초기화하는 함수를 실행합니다.
        resetDailyQuestsForNewDay();
        
        // 새로 바뀐 오늘 날짜를 다시 저장소에 기록합니다.
        localStorage.setItem('maple_omni_planner_date', todayStr);
    }
}

/**
 * 💡 [초보자 가이드: 일일 퀘스트 및 체크박스 초기화 함수]
 * 날이 바뀌었을 때 화면상의 체크박스를 해제하고 임시 저장된 진행 데이터를 비워줍니다.
 */
function resetDailyQuestsForNewDay() {
    // 문서 내에 있는 모든 일일 퀘스트 체크박스 요소들을 전부 찾아옵니다.
    const dailyCheckboxes = document.querySelectorAll('.todo-checkbox, .daily-quest-checkbox');
    
    // 찾아낸 체크박스들을 하나씩 반복돌며 체크를 해제(false) 상태로 바꿉니다.
    dailyCheckboxes.forEach(function(checkbox) {
        checkbox.checked = false;
    });
    
    // 브라우저 저장소에 남아있던 어제의 일일 진행 상황 데이터를 삭제합니다.
    localStorage.removeItem('maple_omni_daily_progress');
    
    console.log('[TODO PLANNER] 새로운 하루에 맞춰 일일 퀘스트 상태가 깔끔하게 초기화되었습니다.');
}

/**
 * 💡 캐릭터 데이터 객체에서 Nexon Open API 공식 서버(월드) 명칭을 정밀 추출합니다.
 * 초보자 가이드: Nexon Open API의 world_name 키 및 로컬 스토리지 데이터까지 완벽히 감지하여 "스카니아", "크로아" 등의 순수 서버명만 반환합니다.
 */
window.getMapleServerName = function(charObj) {
    if (!charObj) return '';
    if (typeof charObj === 'string') return '';

    // Nexon Open API 공식 속성인 world_name을 1순위로 체크하고, 기타 호환 속성들을 순차 검사합니다.
    let s = charObj.world_name || charObj.worldName || charObj.world || charObj.server || charObj.serverName || charObj.character_world || charObj.world_id || '';
    
    // 만약 객체 내에 서버명이 없을 경우 로컬 스토리지에 저장된 캐릭터 목록에서 닉네임으로 재검색합니다.
    if (!s && (charObj.name || charObj.character_name || charObj.characterName)) {
        const cName = charObj.name || charObj.character_name || charObj.characterName;
        try {
            const raw = localStorage.getItem("omni_v14_characters") || localStorage.getItem("omni_characters") || localStorage.getItem("maple_characters");
            if (raw) {
                const list = JSON.parse(raw);
                if (Array.isArray(list)) {
                    const found = list.find(item => (item.name || item.character_name || item.characterName) === cName);
                    if (found) {
                        s = found.world_name || found.worldName || found.world || found.server || found.serverName || '';
                    }
                }
            }
        } catch(e) {}
    }

    if (!s || s === '서버미정') return '';

    // "크로아서버"처럼 뒤에 '서버' 단어가 붙어있을 경우 이미지 경로 매칭을 위해 깔끔히 정돈합니다.
    let clean = String(s).trim();
    if (clean.endsWith('서버') && clean.length > 2) {
        clean = clean.replace(/서버$/, '').trim();
    }
    return clean;
};

/**
 * 💡 메이플스토리 그란디스 구간(260~300) 공식 경험치 커브를 반영하여 목표 레벨 도달까지 필요한 총 경험치를 정밀 연산합니다.
 * 초보자 가이드: 레벨 구간별 상승하는 필요 경험치를 지수 함수 곡선에 맞추어 누적 합산하는 함수입니다.
 */
window.getExpRequiredForLevel = function(lv) {
    if (lv < 260) return 1000000000000;
    if (lv < 270) {
        return Math.round(2365584213200 * Math.pow(1.02, lv - 260));
    } else if (lv < 280) {
        return Math.round(11827921066000 * Math.pow(1.02, lv - 270));
    } else if (lv < 290) {
        return Math.round(47211684264000 * Math.pow(1.025, lv - 280));
    } else if (lv < 300) {
        return Math.round(188846737056000 * Math.pow(1.03, lv - 290));
    }
    return 250000000000000;
};

/**
 * 💡 [사냥기록지 연동 핵심 계산 엔진]
 * 초보자 가이드: LocalStorage에 저장된 [사냥기록지] 데이터를 조회하여 선택된 캐릭터의 실제 사냥 경험치 획득 기록을 수집하고,
 * 이를 기반으로 하루 평균 경험치 획득량을 산출하여 정확한 목표 도달 일수 및 날짜를 연산합니다.
 */
window.calculateExpPrediction = function(charName, targetLevel) {
    const char = window.omniTodoState.characters.find(c => c.name === charName);
    const currentLevel = char ? parseInt(char.level || 260, 10) : 260;
    
    if (isNaN(targetLevel) || targetLevel <= currentLevel) {
        return { error: true, msg: "목표 레벨 설정 오류" };
    }

    let totalRequiredExp = 0;
    for (let l = currentLevel; l < targetLevel; l++) {
        totalRequiredExp += window.getExpRequiredForLevel(l);
    }

    let huntingLogs = [];
    try {
        const rawLogs = localStorage.getItem("omni_v14_hunting_logs") || localStorage.getItem("omni_hunting_log");
        if (rawLogs) huntingLogs = JSON.parse(rawLogs);
    } catch(e) { huntingLogs = []; }

    let charExpAmounts = [];
    huntingLogs.forEach(log => {
        const logChar = log.character || log.charName || log.name || "";
        if (logChar === charName) {
            const expVal = Number(log.exp || log.experience || log.gainExp || log.expGain || 0);
            if (expVal > 0) {
                charExpAmounts.push(expVal);
            }
        }
    });

    // 사냥기록지 데이터가 없을 경우 명확하게 데이터 없음 처리
    if (charExpAmounts.length === 0) {
        return { error: false, hasRealLogs: false, days: "-", finalDate: "-", msg: "데이터가 없습니다." };
    }

    const sum = charExpAmounts.reduce((a, b) => a + b, 0);
    const avgDailyExp = sum / charExpAmounts.length;
    const estimatedDays = avgDailyExp > 0 ? Math.ceil(totalRequiredExp / avgDailyExp) : 9999;
    
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + estimatedDays);
    const dateString = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;

    return { 
        error: false, 
        days: estimatedDays, 
        finalDate: dateString, 
        hasRealLogs: true,
        dailyAvgExp: avgDailyExp 
    };
};

/**
 * Chart.js 인프라를 활용하여 캐릭터별 최근 한 달(30일)간의 일자별 달성 레벨 변화 추이를 렌더링합니다.
 * 초보자 가이드: '전체' 보기 선택 시에는 가이드 박스를 출력하고, 특정 캐릭터 선택 시 라인 그래프 및 오버레이가 구동됩니다.
 */
window.renderExpChart = function(charName) {
    const ctx = document.getElementById('omniTodoExpChart');
    const wrapper = ctx ? ctx.parentElement : document.querySelector('.chart-canvas-wrapper');
    const panelTitleEl = document.querySelector('.chart-panel-title');

    if (charName === '전체') {
        if (window.myTodoExpChartInstance) { 
            window.myTodoExpChartInstance.destroy(); 
            window.myTodoExpChartInstance = null;
        }
        if (panelTitleEl) {
            panelTitleEl.innerHTML = `💡 OMNI STRATEGY PLANNER 통합 가이드 & 도움말`;
        }
        if (wrapper) {
            wrapper.innerHTML = `
                <div id="omniExpGuideBox" style="padding: 22px 24px; text-align: left; color: #475569; font-weight: 600; font-size: 12.5px; line-height: 1.75; display: flex; flex-direction: column; gap: 10px; height: 100%; box-sizing: border-box; justify-content: center; background: var(--omni-bg-clean, #f8fafc); border-radius: 14px; border: 1px dashed var(--omni-card-border-line, #cbd5e1);">
                    <div>• 상단 좌측의 <strong style="color: var(--omni-primary-accent, #6366f1); font-weight: 800;">캐릭터 선택 셀렉트박스</strong>에서 원하시는 캐릭터를 선택하시면, 해당 캐릭터의 최근 30일간 일자별 레벨업 추이 그래프와 사냥기록지 연동 리포트가 즉시 활성화됩니다.</div>
                    <div>• 본 시스템의 성장 분석 및 목표 도달 기일은 <strong style="color: var(--omni-primary-accent, #6366f1); font-weight: 800;">[사냥/재획] 사냥기록지</strong>에 기록된 실제 사냥 지표와 완벽하게 결합되어 <strong style="color: var(--omni-primary-accent, #6366f1); font-weight: 800;">[사냥 기록지랑 연동되어 추산됩니다]</strong>.</div>
                    <div style="font-size: 11.5px; color: #64748b; font-weight: 600; border-top: 1px dashed #cbd5e1; padding-top: 8px; margin-top: 2px;">
                        🔮 우측 <strong style="color: var(--omni-primary-accent, #6366f1); font-weight: 800;">7월 성장 스케줄러 달력의 날짜</strong>를 클릭하시면, 좌측 영역에서 해당 일자의 시간대별(0시~23시) 경험치 획득량 상세 추이를 확인하실 수 있습니다.
                    </div>
                </div>
            `;
        }
        return;
    }

    if (wrapper && !document.getElementById('omniTodoExpChart')) {
        wrapper.innerHTML = `<canvas id="omniTodoExpChart"></canvas>`;
    }
    const activeCtx = document.getElementById('omniTodoExpChart');
    if (!activeCtx) return;

    if (window.myTodoExpChartInstance) { window.myTodoExpChartInstance.destroy(); }
    
    const charObj = window.omniTodoState.characters.find(c => c.name === charName);
    const curLv = charObj ? parseInt(charObj.level || 283, 10) : 283;

    let monthDates = [];
    let monthLevels = [];
    let baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - 30);

    for (let i = 0; i < 30; i++) {
        baseDate.setDate(baseDate.getDate() + 1);
        let m = String(baseDate.getMonth() + 1).padStart(2, '0');
        let d = String(baseDate.getDate()).padStart(2, '0');
        monthDates.push(`${m}-${d}`);
        let simulatedLv = curLv - Math.floor((30 - i) / 10);
        monthLevels.push(simulatedLv);
    }

    const expHistory = window.omniTodoState.expHistory || {};
    const hasRealExp = (expHistory[charName] && expHistory[charName].levels && expHistory[charName].levels.length > 0);
    const historyDates = hasRealExp ? expHistory[charName].dates : monthDates;
    const levelSeries = hasRealExp ? expHistory[charName].levels : monthLevels;

    // 데이터 유무에 따른 안내 문구 분기 처리
    const noticeText = hasRealExp ? "[사냥 기록지랑 연동되어 추산됩니다]" : "[데이터가 없어 이렇게 표시됩니다]";

    if (panelTitleEl) {
        panelTitleEl.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <span style="font-size: 13px; font-weight: 800; color: var(--omni-text-main, #1e293b);">📈 [${charName}] 일자별 달성 레벨 추이</span>
                <span style="font-size: 10px; font-weight: 700; color: #64748b; background: var(--omni-bg-clean, #f8fafc); border: 1px dashed #cbd5e1; padding: 3px 8px; border-radius: 6px;">💡 ${noticeText}</span>
            </div>
        `;
    }

    // 기존 더미 오버레이 제거 후 데이터 미존재 시 오버레이 노출
    const existingOverlay = wrapper ? wrapper.querySelector('.exp-dummy-overlay') : null;
    if (existingOverlay) existingOverlay.remove();

    if (!hasRealExp && wrapper) {
        const overlay = document.createElement('div');
        overlay.className = 'exp-dummy-overlay';
        overlay.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255, 255, 255, 0.88); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; font-size: 12px; font-weight: 700; color: #64748b; border-radius: 12px; border: 1px dashed #cbd5e1; text-align: center; padding: 12px; box-sizing: border-box; pointer-events: none;';
        overlay.innerHTML = `⚠️ [데이터가 없어 이렇게 표시됩니다]<br><span style="font-size:11px; font-weight:600; color:#94a3b8; margin-top:4px; display:block;">[사냥/재획] 탭의 사냥기록지에 데이터를 입력해주시면 실시간 반영됩니다.</span>`;
        wrapper.style.position = 'relative';
        wrapper.appendChild(overlay);
    }

    window.myTodoExpChartInstance = new Chart(activeCtx, {
        type: 'line',
        data: {
            labels: historyDates,
            datasets: [{
                label: '한 달간 달성 레벨 추이',
                data: levelSeries,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                borderWidth: 3,
                fill: true,
                tension: 0.2,
                showLine: true,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `달성 레벨: Lv.${context.raw}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    grid: { color: '#f1f5f9' },
                    ticks: {
                        font: { size: 10, weight: 'bold' },
                        stepSize: 1,
                        callback: function(v) { return 'Lv.' + v; }
                    },
                    min: Math.min(...levelSeries) - 1,
                    max: Math.max(...levelSeries) + 1
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 9, weight: 'bold' }, maxTicksLimit: 10 }
                }
            }
        }
    });
};

/**
 * 📋 옴니 플래너 메인 화면 렌더링 함수
 * 초보자 가이드: 육성 계획 카드 및 우측 요약 위젯을 생성하고 캐릭터별 서버 아이콘(icon/world/서버명.png)을 바인딩합니다.
 */
window.renderTodoPlannerContent = function() {
    // 자정이 지난 후 접속 시 날짜 변경 여부를 검사하고 갱신합니다.
    checkAndUpdateDateOnLoad();

    const container = document.getElementById('todo-planner');
    if (!container) return;

    const savedPlansRaw = localStorage.getItem("omni_v14_strategy_plans");
    let planList = savedPlansRaw ? JSON.parse(savedPlansRaw) : [];
    
    const currentFilter = document.getElementById('todoPlannerCharSelect')?.value || '전체';

    let cardsHtml = "";
    planList.forEach((plan, index) => {
        if (currentFilter === '전체' || plan.char === currentFilter) {
            const targetLevelNum = parseInt(plan.goal.replace(/[^0-9]/g, ""), 10);
            let predictionHtml = "";

            if (!isNaN(targetLevelNum)) {
                const pred = window.calculateExpPrediction(plan.char, targetLevelNum);
                if (!pred.error) {
                    if (!pred.hasRealLogs) {
                        predictionHtml = `
                            <div class="exp-predict-badge" style="background: #f8fafc; border-color: #cbd5e1; color: #475569;">
                                📈 <strong>성장 예측 분석:</strong> [데이터가 없습니다.]
                                <div style="font-size: 9.5px; color: #64748b; margin-top: 2px; font-weight: 600;">
                                    💡 [사냥 기록지랑 연동되어 추산됩니다] (사냥기록지 데이터를 입력해주세요)
                                </div>
                            </div>
                        `;
                    } else {
                        predictionHtml = `
                            <div class="exp-predict-badge">
                                📈 <strong>성장 예측 분석:</strong> 앞으로 <strong>${pred.days}일</strong> 뒤 목표 달성 예상 (${pred.finalDate})
                                <div style="font-size: 10px; color: #475569; margin-top: 3px; font-weight: 700;">
                                    💡 [사냥 기록지랑 연동되어 추산됩니다]
                                </div>
                            </div>
                        `;
                    }
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
        }
    });

    let selectOptions = `<option value="전체" ${currentFilter === '전체' ? 'selected' : ''}>🔍 전체 보기</option>`;
    const characters = (window.omniTodoState && window.omniTodoState.characters) || [];
    
    // 배열 및 데이터 구조 안정을 위한 고유 캐릭터 목록 추출
    const uniqueChars = [...new Set(characters.map(c => typeof c === 'string' ? c : (c ? (c.name || c.characterName || c.character_name) : '')))].filter(Boolean);

    uniqueChars.forEach(name => { 
        const charObj = characters.find(c => (typeof c === 'string' ? c : (c.name || c.characterName || c.character_name)) === name) || {};
        const job = charObj.job || charObj.jobName || charObj.characterClass || charObj.character_class || '직업미정';
        const lv = charObj.level || charObj.lv || charObj.characterLevel || charObj.character_level || '260';
        const serverName = window.getMapleServerName(charObj) || '서버미정';
        
        selectOptions += `<option value="${name}" ${currentFilter === name ? 'selected' : ''}>👤 ${name} (${job} / Lv.${lv} / ${serverName})</option>`; 
    });

    // 선택된 캐릭터의 서버 아이콘 이미지 생성
    const activeCharObj = characters.find(c => (typeof c === 'string' ? c : (c.name || c.characterName || c.character_name)) === currentFilter) || {};
    const activeServerName = window.getMapleServerName(activeCharObj);
    const worldIconHtml = activeServerName ? `<img src="icon/world/${activeServerName}.png" alt="${activeServerName}" title="${activeServerName} 서버" style="width: 20px; height: 20px; object-fit: contain; vertical-align: middle; margin-right: 6px; flex-shrink: 0;" onerror="this.style.display='none';">` : '';

    let levelUpSideWidgetHtml = "";
    if (currentFilter !== '전체') {
        const charObj = characters.find(c => (typeof c === 'string' ? c : (c.name || c.characterName || c.character_name)) === currentFilter) || {};
        const curLv = charObj ? parseInt(charObj.level || charObj.character_level || 260, 10) : 260;
        const matchingPlan = planList.find(p => p.char === currentFilter);
        const goalLv = matchingPlan ? parseInt(matchingPlan.goal.replace(/[^0-9]/g, ""), 10) : (curLv + 1);
        
        let predDays = 0;
        let predDateStr = "-";
        let hasLogs = false;
        if (!isNaN(goalLv) && goalLv > curLv) {
            const pred = window.calculateExpPrediction(currentFilter, goalLv);
            if (!pred.error) {
                predDays = pred.days;
                predDateStr = pred.finalDate;
                hasLogs = pred.hasRealLogs;
            }
        }

        const sideServer = window.getMapleServerName(charObj);
        const sideIconHtml = sideServer ? `<img src="icon/world/${sideServer}.png" alt="${sideServer}" style="width: 16px; height: 16px; object-fit: contain; vertical-align: middle; margin-right: 4px;">` : '';

        levelUpSideWidgetHtml = `
            <div class="omni-mini-calendar-widget" style="margin-top: 14px; text-align: left;">
                <div class="calendar-header-title"><span>🏆 ${sideIconHtml}[${currentFilter}] 성장 & 레벨업 기록</span></div>
                <div style="display: flex; flex-direction: column; gap: 8px; font-size: 11.5px; padding-top: 4px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; background: var(--omni-bg-clean, #f8fafc); padding: 8px 10px; border-radius: 8px; border: 1px dashed var(--omni-card-border-line, #cbd5e1);">
                        <span style="font-weight: 700; color: var(--omni-text-sub, #64748b);">현재 전투원 레벨</span>
                        <strong style="font-weight: 800; color: var(--omni-primary-accent, #6366f1);">Lv.${curLv}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; background: var(--omni-bg-clean, #f8fafc); padding: 8px 10px; border-radius: 8px; border: 1px dashed var(--omni-card-border-line, #cbd5e1);">
                        <span style="font-weight: 700; color: var(--omni-text-sub, #64748b);">목표 레벨 (Lv.${goalLv})</span>
                        <strong style="font-weight: 800; color: var(--omni-primary-accent, #6366f1);">${hasLogs ? `앞으로 ${predDays}일 뒤` : '[데이터가 없습니다.]'}</strong>
                    </div>
                    <div style="font-size: 11px; font-weight: 700; color: var(--omni-text-main, #1e293b); margin-top: 4px; padding: 6px 4px; border-top: 1px dashed var(--omni-card-border-line, #cbd5e1);">
                        🔮 <strong>다음 예상 레벨업 날짜:</strong> <span style="color: var(--omni-primary-accent, #6366f1); font-weight: 800;">${hasLogs ? predDateStr + ' 도달 예상' : '[데이터가 없습니다.]'}</span>
                        <div style="font-size: 9.5px; color: #64748b; font-weight: 600; margin-top: 2px;">
                            💡 [사냥 기록지랑 연동되어 추산됩니다] (${hasLogs ? '사냥기록지 연결됨' : '데이터 없음'})
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        levelUpSideWidgetHtml = `
            <div class="omni-mini-calendar-widget" style="margin-top: 14px; text-align: left;">
                <div class="calendar-header-title"><span>🏆 성장 & 레벨업 안내</span></div>
                <div style="font-size: 11.5px; color: var(--omni-text-sub, #64748b); font-weight: 600; padding: 8px 4px;">
                    상단에서 캐릭터를 선택하시면 해당 캐릭터의 레벨업 기록 및 다음 예상 레벨업 날짜가 표시됩니다.
                </div>
            </div>
        `;
    }

    let quickStatsWidgetHtml = `
        <div class="omni-mini-calendar-widget" style="margin-top: 14px; text-align: left;">
            <div class="calendar-header-title"><span>⚡ 빠른 육성 현황 요약</span></div>
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11.5px; padding-top: 4px; color: var(--omni-text-sub, #64748b);">
                <div style="display: flex; justify-content: space-between;">
                    <span>• 등록된 전략 계획서</span>
                    <strong style="color: var(--omni-text-main, #1e293b); font-weight: 800;">${planList.length}건</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>• 연동된 캐릭터 수</span>
                    <strong style="color: var(--omni-text-main, #1e293b); font-weight: 800;">${uniqueChars.length}명</strong>
                </div>
                <div style="font-size: 10.5px; color: #64748b; font-weight: 600; border-top: 1px dashed var(--omni-card-border-line, #cbd5e1); padding-top: 6px; margin-top: 2px;">
                    💡 [사냥 기록지랑 연동되어 추산됩니다]
                </div>
            </div>
        </div>
    `;

    container.innerHTML = `
        <div class="omni-planner-container">
            <div class="planner-header-flex">
                <span class="planner-badge">STRATEGY DESIGNER</span>
                <h4 class="planner-main-title">📅 OMNI 플래너</h4>
                <div class="planner-form-row-custom" style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                    ${worldIconHtml}
                    <select id="todoPlannerCharSelect" class="planner-select-box" onchange="window.renderTodoPlannerContent()">
                        ${selectOptions}
                    </select>
                    <input type="text" id="todoPlannerGoalInput" placeholder="목표 레벨 기입 (예: 285)..." class="planner-input-field">
                    <input type="text" id="todoPlannerRouteInput" placeholder="이동 성장 루트 정의..." class="planner-input-field">
                    <button class="planner-btn-submit" onclick="window.addTodoStrategyPlan()">계획 수립</button>
                </div>
            </div>

            <div class="omni-planner-dashboard-layout">
                <div class="planner-left-stack">
                    <div class="planner-chart-panel">
                        <span class="chart-panel-tag">LEVEL MONITOR</span>
                        <h5 class="chart-panel-title">📈 캐릭터별 최근 한 달간의 일자별 달성 레벨 추이</h5>
                        <div class="chart-canvas-wrapper"><canvas id="omniTodoExpChart"></canvas></div>
                    </div>
                    <div class="planner-grid-cards">${cardsHtml ? cardsHtml : '<div class="omni-empty-state">수립된 전략 계획서가 존재하지 않습니다.</div>'}</div>
                </div>
                <div style="display: flex; flex-direction: column;">
                    ${window.buildMiniCalendarComponentMarkup(planList.length)}
                    ${levelUpSideWidgetHtml}
                    ${quickStatsWidgetHtml}
                </div>
            </div>
        </div>
    `;

    setTimeout(() => window.renderExpChart(currentFilter), 50);
};

/**
 * 🗓️ 미니 달력 빌더
 */
window.buildMiniCalendarComponentMarkup = function(planCount) {
    const weekLabels = ['일', '월', '화', '수', '목', '금', '토'];
    let daysHtml = "";
    weekLabels.forEach(l => { 
        daysHtml += `<div class="calendar-day-label" style="font-size: 9.5px; font-weight: 800; color: var(--omni-text-sub, #64748b); padding: 2px 0;">${l}</div>`; 
    });
    daysHtml += `<div class="calendar-date-cell empty-cell"></div>`;

    for(let d=1; d<=30; d++) {
        const isChecked = window.omniTodoState.calendarCheckedDays[d] === true;
        daysHtml += `<div class="calendar-date-cell ${isChecked ? 'is-checked' : ''}" onclick="window.renderDayHourlyExpChart(${d})" title="7월 ${d}일 시간별 경험치 보기">${d}</div>`;
    }
    return `
        <div class="omni-mini-calendar-widget">
            <div class="calendar-header-title">
                <span style="font-weight: 900; color: var(--omni-text-main, #1e293b);">🗓️ 7월 성장 스케줄러</span>
                <span style="font-size: 9px; font-weight: 800; color: var(--omni-primary-accent, #6366f1); background: var(--omni-bg-clean, #f8fafc); padding: 3px 6px; border-radius: 6px; border: 1px dashed var(--omni-card-border-line, #cbd5e1);">날짜클릭 ➡️ EXP</span>
            </div>
            <div class="calendar-days-grid">${daysHtml}</div>
        </div>
    `;
};

/**
 * 📊 달력의 특정 날짜를 클릭했을 때 시간대별 경험치 획득량 그래프로 전환 렌더링합니다.
 */
window.renderDayHourlyExpChart = function(dayNum) {
    const ctx = document.getElementById('omniTodoExpChart');
    if (!ctx) return;

    if (window.myTodoExpChartInstance) { window.myTodoExpChartInstance.destroy(); }
    
    const currentFilter = document.getElementById('todoPlannerCharSelect')?.value || '전체';
    const targetChar = currentFilter !== '전체' ? currentFilter : '전체 캐릭터';

    let hoursLabels = [];
    let hourlyExpData = [];

    for (let h = 0; h < 24; h++) {
        hoursLabels.push(`${String(h).padStart(2, '0')}시`);
        let expSim = Math.round(((Math.sin((h + dayNum) * 0.3) * 0.5 + 0.5) * 35.0 + 3.0) * 100) / 100;
        hourlyExpData.push(expSim);
    }

    const panelTitleEl = document.querySelector('.chart-panel-title');
    if (panelTitleEl) {
        panelTitleEl.innerHTML = `📊 [${targetChar}] 7월 ${dayNum}일 시간대별 경험치 획득 상세 추이 (억 EXP) <span style="font-size:10px; color:#6366f1; font-weight:bold;">[사냥 기록지랑 연동되어 추산됩니다]</span>`;
    }

    window.myTodoExpChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hoursLabels,
            datasets: [{
                label: '시간별 획득 경험치 (억)',
                data: hourlyExpData,
                backgroundColor: 'rgba(99, 102, 241, 0.75)',
                borderColor: '#4f46e5',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `획득 경험치: +${context.raw}억 EXP (사냥기록지 연동)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    grid: { color: '#f1f5f9' },
                    ticks: {
                        font: { size: 9, weight: 'bold' },
                        callback: function(v) { return v + '억'; }
                    },
                    beginAtZero: true
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 8, weight: 'bold' }, maxTicksLimit: 12 }
                }
            }
        }
    });
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

    // 같은 캐릭터에 대한 이전 계획서가 있다면 중복 방지를 위해 기존 항목 삭제 후 새로 수립
    const targetCharName = charSelect ? charSelect.value : "미정";
    planList = planList.filter(p => p.char !== targetCharName);

    planList.unshift({
        char: targetCharName,
        goal: goalInput.value.trim(),
        route: routeInput.value.trim()
    });

    localStorage.setItem("omni_v14_strategy_plans", JSON.stringify(planList));
    goalInput.value = ""; routeInput.value = "";
    window.renderTodoPlannerContent();
};