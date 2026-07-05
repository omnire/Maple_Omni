/**
 * ============================================================================
 * 🧠 history.js - 📜 통합 기록지 달력 코어 작동 엔진
 * 설명: index.html의 #hunt-history 구역에 프리미엄 캘린더를 바인딩하고 데이터를 파싱합니다.
 * 가이드: 초보자도 완벽하게 코드를 독학할 수 있도록 친절하고 상세한 주석을 달아 생략 없이 작성함
 * ============================================================================
 */

// 💡 [초보자 가이드] 전역 변수가 중복 초기화되어 데이터가 증발하는 현상을 방지하는 안전망 설계 구역입니다.
if (typeof window.attendanceYear === 'undefined') window.attendanceYear = new Date().getFullYear();
if (typeof window.attendanceMonth === 'undefined') window.attendanceMonth = new Date().getMonth();
if (typeof window.currentIdx === 'undefined') window.currentIdx = 1;

/**
 * 💡 [초보자 가이드] 달력의 날짜 칸을 클릭했을 때 수동으로 출석(정산확인) 상태를 토글(참/거짓 변환)하는 함수입니다.
 */
window.toggleAttendance = function(dateStr, charId) {
    const targetIdx = charId || window.currentIdx || 1;
    let manualAttendance = JSON.parse(localStorage.getItem(`manual_attendance_${targetIdx}`) || '{}');
    
    // 현재 날짜의 출석 값을 반대로 뒤집습니다 (true였다면 false로, false였다면 true로)
    manualAttendance[dateStr] = !manualAttendance[dateStr];
    localStorage.setItem(`manual_attendance_${targetIdx}`, JSON.stringify(manualAttendance));
    
    // 달력 화면과 주간 요약 통계 화면을 실시간으로 새로고침합니다.
    if (typeof window.renderAttendance === 'function') window.renderAttendance();
    if (typeof window.refreshWeekly === 'function') window.refreshWeekly();
    
    if (typeof showToast === 'function') {
        showToast(manualAttendance[dateStr] ? "출석 체크 완료! ✅" : "출석이 해제되었습니다.");
    }
};

/**
 * 💡 [초보자 가이드] 달력 상단의 화살표(◀, ▶) 단추를 눌렀을 때 월 단위로 시간을 앞뒤로 이동시키는 연산 컨트롤러입니다.
 */
window.changeMonth = function(offset) { 
    window.attendanceMonth += offset;
    
    // 0월보다 작아지면 작년 12월로 연도를 빼주고 월을 보정합니다.
    if (window.attendanceMonth < 0) { 
        window.attendanceMonth = 11; 
        window.attendanceYear -= 1; 
    } else if (window.attendanceMonth > 11) { 
        // 11월(실제 12월)을 초과하면 내년 1월로 연도를 더해주고 월을 보정합니다.
        window.attendanceMonth = 0; 
        window.attendanceYear += 1; 
    }
    
    if (typeof window.renderAttendance === 'function') window.renderAttendance(); 
};

/**
 * 💡 [초보자 가이드] 로컬스토리지의 영구 원장 데이터와 임시 버퍼 데이터를 결합하여 실제 달력의 7열 격자판 구조를 드로잉합니다.
 */
window.renderAttendance = function() {
    const matrixRoot = document.getElementById('omniCalendarMatrixRoot');
    const labelYearMonth = document.getElementById('omniCalendarYearMonthText');
    if (!matrixRoot) return;

    if (labelYearMonth) {
        labelYearMonth.textContent = `${window.attendanceYear}년 ${String(window.attendanceMonth + 1).padStart(2, '0')}월`;
    }

    // 기존에 그려져 있던 달력 엘리먼트들을 깨끗하게 지워내 중복 생성을 방지합니다.
    matrixRoot.innerHTML = '';

    // 이번 달의 1일이 무슨 요일(0:일요일 ~ 6:토요일)에 시작하는지 계산합니다.
    const startDayIdx = new Date(window.attendanceYear, window.attendanceMonth, 1).getDay();
    // 이번 달의 총 일수(28일 ~ 31일)가 며칠인지 마지막 날짜 판정을 통해 계산합니다.
    const totalDaysCount = new Date(window.attendanceYear, window.attendanceMonth + 1, 0).getDate();

    const currentTabIdx = parseInt(window.currentIdx) || 1;
    const allRecords = JSON.parse(localStorage.getItem('maple_hunt_records') || '[]');
    const manualAttendance = JSON.parse(localStorage.getItem(`manual_attendance_${currentTabIdx}`) || '{}');

    // 1일이 시작하기 전 빈칸 매칭 구간만큼 투명 보정 박스(.calendar-day-blank-space)를 채워 넣습니다.
    for (let i = 0; i < startDayIdx; i++) {
        const blankBox = document.createElement('div');
        blankBox.className = 'calendar-day-blank-space';
        matrixRoot.appendChild(blankBox);
    }

    // 1일부터 말일까지 순회하며 날짜 카드 엘리먼트를 동적으로 빌드합니다.
    for (let day = 1; day <= totalDaysCount; day++) {
        const thisDateObj = new Date(window.attendanceYear, window.attendanceMonth, day);
        // 연-월-일 형식의 로컬 문자열 키를 매핑합니다 (ex: "2026-07-05")
        const dateKeyStr = thisDateObj.toISOString().split('T')[0];

        let daySumMeso = 0;
        let daySumCores = 0;
        let daySumFrags = 0;

        // 1) 영구 사냥 원장 파일(maple_hunt_records)에서 현재 캐릭터와 날짜가 같은 데이터를 매칭하여 스택을 합산합니다.
        allRecords.filter(r => r.charId == currentTabIdx && r.date === dateKeyStr).forEach(r => {
            daySumMeso += parseInt(String(r.meso).replace(/,/g, "")) || 0;
            daySumCores += parseInt(r.gem || 0);
            daySumFrags += parseInt(r.frag || 0);
        });

        // 2) 아직 확정되지 않은 세션 임시 보관소(subHistory) 데이터도 유연하게 결합하여 합산 처리합니다.
        const sKey = `${currentTabIdx}_${dateKeyStr}`;
        if (window.subHistory && window.subHistory[sKey]) {
            window.subHistory[sKey].forEach(tempRec => {
                if (!tempRec.isFinalized) { 
                    daySumMeso += parseInt(String(tempRec.meso).replace(/,/g, "")) || 0;
                    daySumCores += parseInt(tempRec.gem || 0);
                    daySumFrags += parseInt(tempRec.frag || 0);
                }
            });
        }

        const cellCard = document.createElement('div');
        const isAttended = manualAttendance[dateKeyStr] === true;
        
        cellCard.className = `calendar-day-box-item ${isAttended ? 'is-attended-active' : ''}`;
        cellCard.setAttribute('onclick', `window.toggleAttendance('${dateKeyStr}', ${currentTabIdx})`);

        // 당일 획득한 재화가 단 하나라도 존재한다면 가독성이 뛰어난 억/만 단위 포맷으로 출력 템플릿을 생성합니다.
        let innerSummaryHtml = '';
        if (daySumMeso > 0 || daySumCores > 0 || daySumFrags > 0) {
            const mesoTextForm = daySumMeso >= 100000000 
                ? (daySumMeso / 100000000).toFixed(1) + '억' 
                : (daySumMeso / 10000).toFixed(0) + '만';

            innerSummaryHtml = `
                <div class="day-summary-data-container">
                    <div class="day-summary-text-row color-meso-text">💰 ${mesoTextForm}</div>
                    <div class="day-summary-text-row color-item-text">💎 젬 ${daySumCores} / 조각 ${daySumFrags}</div>
                </div>
            `;
        }

        cellCard.innerHTML = `
            <div class="day-number-label">${day}</div>
            ${isAttended ? '<div class="day-stamped-check-icon">✅</div>' : ''}
            ${innerSummaryHtml}
        `;

        matrixRoot.appendChild(cellCard);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const historyWorkspace = document.getElementById('hunt-history');
    if (!historyWorkspace) return;

    // 대시보드 캘린더 기본 레이아웃 프레임을 완전하게 마운트합니다.
    historyWorkspace.innerHTML = `
        <div class="omni-calendar-card">
            <div class="calendar-top-flex">
                <div>
                    <h2 class="calendar-main-title">사냥 통합 기록지</h2>
                    <p class="calendar-sub-title">나의 사냥 데이터를 한눈에 확인하세요!</p>
                </div>
                <div class="char-name-badge-pill" id="lblLiveAttendanceCharBadge">캐릭터 선택</div>
            </div>

            <div class="calendar-action-bar">
                <div class="month-stepper-container">
                    <button class="month-step-btn" onclick="window.changeMonth(-1)">◀</button>
                    <span class="month-center-text" id="omniCalendarYearMonthText">2026년 06월</span>
                    <button class="month-step-btn" onclick="window.changeMonth(1)">▶</button>
                </div>
                <button class="btn-all-logs-shortcut" onclick="window.switchHuntTab('history')">새로고침</button>
            </div>

            <div class="calendar-weekdays-grid">
                <div class="weekday-header-cell" style="color: #ef4444;">일</div>
                <div class="weekday-header-cell">월</div>
                <div class="weekday-header-cell">화</div>
                <div class="weekday-header-cell">수</div>
                <div class="weekday-header-cell">목</div>
                <div class="weekday-header-cell">금</div>
                <div class="weekday-header-cell">토</div>
            </div>

            <div class="calendar-days-matrix-grid" id="omniCalendarMatrixRoot"></div>
        </div>
    `;

    window.renderAttendance();
});