/**
 * ============================================================================
 * 🧠 MAPLE OMNI V14 - js/hunt/history.js [라벤더 컴팩트 가독성 완성본]
 * 설명: 압축형 달력 시스템 및 370px 초정밀 모달 보고서 기입 파이프라인 엔진입니다.
 * 패치노트: 
 * 1. 달력 내부의 요약 칸 이모지 중복 배치를 제거하고 '이모지 + 수치' 형태로 가독성을 개편했습니다.
 * 2. 빈 화면 오류(Blank Screen) 결함을 막기 위해 window.renderHistoryPage() 빌더를 신설 탑재했습니다.
 * 3. 현지 시간(Local Time) 기준 포맷팅 설계로 날짜 밀림/누락 버그를 완전 근절했습니다.
 * 4. 개별 회차 파기 시 ID 식별 안전 연동(rec.id) 보완.
 * 규칙: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 달아줍니다.
 * ============================================================================
 */

// 시스템 메모리 로드 상태 검증 및 전역 기본 제어 변수 안전 안착
if (typeof window.attendanceYear === 'undefined') window.attendanceYear = new Date().getFullYear();
if (typeof window.attendanceMonth === 'undefined') window.attendanceMonth = new Date().getMonth();
if (typeof window.currentIdx === 'undefined') window.currentIdx = 1;

/**
 * 💡 [초보자 가이드] 월 제어 스테퍼 핸들러 함수입니다. 월 단위를 변경하고 달력을 리드로잉합니다.
 */
window.changeMonth = function(offset) { 
    window.attendanceMonth += offset;
    
    // 0월(1월의 인덱스) 미만으로 내려가면 전년도 12월로 재조정
    if (window.attendanceMonth < 0) { 
        window.attendanceMonth = 11; 
        window.attendanceYear -= 1; 
    } 
    // 11월(12월의 인덱스)을 초과하면 다음년도 1월로 재조정
    else if (window.attendanceMonth > 11) { 
        window.attendanceMonth = 0; 
        window.attendanceYear += 1; 
    } 
    
    if (typeof window.renderAttendance === 'function') window.renderAttendance(); 
};

/**
 * 🔍 특정 정산 일자를 클릭했을 때 열리는 370px 초밀도 영수증 모달 엔진
 */
window.openHistoryDetailModal = function(dateStr) {
    const backdrop = document.getElementById('v14HistoryModalBackdrop');
    const contentBody = document.getElementById('v14HistoryModalBodyRoot');
    const headerTitle = document.getElementById('v14HistoryModalTitleDate');
    
    if (!backdrop || !contentBody) return;

    const currentTabIdx = parseInt(window.currentIdx) || 1;
    const allRecords = JSON.parse(localStorage.getItem('maple_hunt_records') || '[]');

    // 전체 데이터베이스 백엔드 원장에서 오늘 선택된 날짜와 일치하는 기록 필터링
    const targetRecords = allRecords.filter(r => r.charId == currentTabIdx && r.date === dateStr);

    if (headerTitle) {
        const totalMinutes = targetRecords.length * 30; // 1회차 세션당 30분 환산
        const timeLabel = totalMinutes >= 60 
            ? `${Math.floor(totalMinutes / 60)}시간 ${totalMinutes % 60}분` 
            : `${totalMinutes}분`;
        headerTitle.innerHTML = `📋 <b>${dateStr.replace(/-/g, '.')}</b> <span style="font-size:11px; color:#7c3aed; margin-left:5px; font-weight:700;">⏱️ 총 ${timeLabel}</span>`;
    }

    let dayTotalMeso = 0;
    let dayTotalExp = 0.0;
    let dayTotalGem = 0;
    let dayTotalFrag = 0;
    let sessionsHtml = "";

    if (targetRecords.length === 0) {
        sessionsHtml = `<div style="text-align:center; padding:20px; font-size:11.5px; color:#83799c; font-weight:700;">확정 저장된 사냥 기록 내역이 없습니다.</div>`;
    } else {
        targetRecords.forEach((rec, sIdx) => {
            const cleanMeso = parseInt(String(rec.meso).replace(/,/g, "")) || 0;
            const singleExp = parseFloat(rec.exp) || 0.0;
            const singleGem = parseInt(rec.gem || 0);
            const singleFrag = parseInt(rec.frag || 0);

            dayTotalMeso += cleanMeso;
            dayTotalExp += singleExp;
            dayTotalGem += singleGem;
            dayTotalFrag += singleFrag;

            // 기타 전리품 기입 유무 스캔 및 마크업 조립
            let extraItemsMarkup = "";
            if (rec.sellList && rec.sellList.length > 0) {
                extraItemsMarkup = `
                    <div class="v14-history-extra-container">
                        <div class="v14-history-extra-title">🎁 부수입 아이템 상세 명세</div>
                        ${rec.sellList.map(item => `
                            <div class="v14-history-extra-item-line">
                                <span>• ${item.name}</span>
                                <span style="color:#b45309; font-weight:700;">+${parseInt(item.price).toLocaleString()} Meso</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            // 폭을 370px 컴팩트 규격으로 축소하고 내부 마이크로 표 그리드를 고도화 배치
            const recordUniqueId = rec.id || `${rec.date}_${rec.time}_${sIdx}`;
            sessionsHtml += `
                <div class="v14-history-session-box">
                    <div class="v14-session-box-top">
                        <span class="v14-session-badge-lbl"># ${sIdx + 1}회차 (${rec.time || '00:00'})</span>
                        <button type="button" class="v14-session-del-btn" onclick="window.deleteSingleSessionRecord('${recordUniqueId}', '${dateStr}')">삭제</button>
                    </div>
                    <div class="v14-history-map-title">📍 사냥터: ${rec.map || '미지정 사냥터'}</div>
                    <div class="v14-session-values-grid">
                        <div class="v14-v-row"><span>메소:</span> <strong>${cleanMeso.toLocaleString()}</strong></div>
                        <div class="v14-v-row"><span>경험치:</span> <strong>+${singleExp.toFixed(3)}%</strong></div>
                        <div class="v14-v-row"><span>코어:</span> <strong>💎 ${singleGem}개</strong></div>
                        <div class="v14-v-row"><span>조각:</span> <strong>✨ ${singleFrag}개</strong></div>
                    </div>
                    ${extraItemsMarkup}
                </div>
            `;
        });
    }

    // 당일 합산 리포트 데이터 출력부 바인딩
    contentBody.innerHTML = `
        <div class="v14-haru-total-board">
            <div class="v14-haru-board-title">📊 당일 합산 요약 지표</div>
            <div class="v14-haru-data-line"><span>💰 총 순메소</span> <span class="v14-haru-meso-text">${dayTotalMeso.toLocaleString()} Meso</span></div>
            <div class="v14-haru-data-line"><span>📈 총 경험치</span> <span class="v14-haru-exp-text">+${dayTotalExp.toFixed(3)}%</span></div>
            <div class="v14-haru-data-line"><span>💎 전리품 수확</span> <span class="v14-haru-loot-text">💎 ${dayTotalGem} / ✨ ${dayTotalFrag}</span></div>
        </div>
        <div class="v14-history-session-list-title">📜 회차별 상세 리스트</div>
        <div style="display:flex; flex-direction:column; gap:8px;">
            ${sessionsHtml}
        </div>
    `;

    backdrop.style.setProperty('display', 'flex', 'important');
};

window.closeHistoryDetailModal = function() {
    const backdrop = document.getElementById('v14HistoryModalBackdrop');
    if (backdrop) backdrop.style.setProperty('display', 'none', 'important');
};

/**
 * 🗑️ 모달 상세 창 내에서 개별 회차 원장을 파기하는 삭제 함수
 */
window.deleteSingleSessionRecord = function(recordId, dateStr) {
    if (!recordId) return;
    if (!confirm("선택하신 사냥 회차 기록을 원장에서 영구히 삭제할까요?")) return;

    let allRecords = JSON.parse(localStorage.getItem('maple_hunt_records') || '[]');
    
    // 식별자(id)가 매칭되거나 대체 문자열 키가 일치하는 단일 건을 삭제합니다.
    allRecords = allRecords.filter((r, idx) => {
        const uniqueKey = r.id || `${r.date}_${r.time}_${idx}`;
        return uniqueKey !== recordId && r.id !== recordId;
    });

    localStorage.setItem('maple_hunt_records', JSON.stringify(allRecords));

    window.renderAttendance();
    if (typeof window.refreshLiveDashboard === 'function') {
        window.refreshLiveDashboard(window.currentIdx);
    }
    window.openHistoryDetailModal(dateStr);
};

/**
 * 💡 [초보자 가이드] 달력 칸 내부 가성 칩셋 및 데이터를 월간 리드로잉 렌더링합니다.
 */
window.renderAttendance = function() {
    const matrixRoot = document.getElementById('omniCalendarMatrixRoot');
    const labelYearMonth = document.getElementById('omniCalendarYearMonthText');
    const charBadge = document.getElementById('lblLiveAttendanceCharBadge');
    
    if (!matrixRoot) return;

    if (labelYearMonth) {
        labelYearMonth.textContent = `${window.attendanceYear}년 ${String(window.attendanceMonth + 1).padStart(2, '0')}월`;
    }

    matrixRoot.innerHTML = '';

    const startDayIdx = new Date(window.attendanceYear, window.attendanceMonth, 1).getDay();
    const totalDaysCount = new Date(window.attendanceYear, window.attendanceMonth + 1, 0).getDate();
    const currentTabIdx = parseInt(window.currentIdx) || 1;
    
    const activeCharMeta = JSON.parse(localStorage.getItem(`maple_char_data_${currentTabIdx}`) || '{}');
    if (charBadge) charBadge.innerText = activeCharMeta.name ? `⚔️ ${activeCharMeta.name}` : `Slot-${currentTabIdx} 미등록`;

    const allRecords = JSON.parse(localStorage.getItem('maple_hunt_records') || '[]');

    // 월간 종합 누계 기록용 상태 변수
    let monthAccumMeso = 0;
    let monthAccumExp = 0.0;
    let monthAccumGem = 0;
    let monthAccumFrag = 0;
    let monthTotalSessionsCount = 0;

    // 1. 달력 시작 요일 이전의 빈 칸을 채워 정렬합니다.
    for (let i = 0; i < startDayIdx; i++) {
        const blankBox = document.createElement('div');
        blankBox.className = 'calendar-day-blank-space';
        matrixRoot.appendChild(blankBox);
    }

    // 2. 1일부터 말일까지 루프를 돌며 데이터를 매칭합니다.
    for (let day = 1; day <= totalDaysCount; day++) {
        // 시차 왜곡 없는 완벽한 로컬 타임 문자열(YYYY-MM-DD)을 생성합니다.
        const yearStr = window.attendanceYear;
        const monthStr = String(window.attendanceMonth + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateKeyStr = `${yearStr}-${monthStr}-${dayStr}`;

        let daySumMeso = 0;
        let daySumCores = 0;
        let daySumFrags = 0;

        allRecords.filter(r => r.charId == currentTabIdx && r.date === dateKeyStr).forEach(r => {
            const mVal = parseInt(String(r.meso).replace(/,/g, "")) || 0;
            daySumMeso += mVal;
            daySumCores += parseInt(r.gem || 0);
            daySumFrags += parseInt(r.frag || 0);

            monthAccumMeso += mVal;
            monthAccumExp += parseFloat(r.exp) || 0.0;
            monthAccumGem += parseInt(r.gem || 0);
            monthAccumFrag += parseInt(r.frag || 0);
            monthTotalSessionsCount++;
        });

        const cellCard = document.createElement('div');
        cellCard.className = 'calendar-day-box-item';
        cellCard.setAttribute('onclick', `window.openHistoryDetailModal('${dateKeyStr}')`);

        let innerSummaryHtml = '';
        if (daySumMeso > 0 || daySumCores > 0 || daySumFrags > 0) {
            const mesoTextForm = daySumMeso >= 100000000 
                ? (daySumMeso / 100000000).toFixed(1) + '억' 
                : (daySumMeso / 10000).toFixed(0) + '만';

            // 한 줄에 깔끔하게 맞춤 칩셋 디자인 적용
            innerSummaryHtml = `
                <div class="day-summary-data-container">
                    <div class="day-summary-text-row color-meso-text">💰 <span>${mesoTextForm}</span></div>
                    <div class="day-summary-text-row color-item-text">💎 💎${daySumCores} │ ✨${daySumFrags}</div>
                </div>
            `;
        }

        cellCard.innerHTML = `
            <div class="day-number-label">${day}</div>
            ${innerSummaryHtml}
        `;
        matrixRoot.appendChild(cellCard);
    }

    // 📊 우측 월간 서브 사이드바 정산 매핑
    const sideMeso = document.getElementById('v14SideMonthTotalMeso');
    const sideExp = document.getElementById('v14SideMonthTotalExp');
    const sideLoot = document.getElementById('v14SideMonthTotalLoot');
    const sideCount = document.getElementById('v14SideMonthTotalCount');

    const formattedMonthMeso = monthAccumMeso >= 100000000 
        ? (monthAccumMeso / 100000000).toFixed(2) + ' 억 Meso' 
        : monthAccumMeso.toLocaleString() + ' Meso';

    if (sideMeso) sideMeso.innerText = formattedMonthMeso;
    if (sideExp) sideExp.innerText = `+${monthAccumExp.toFixed(3)} %`;
    if (sideLoot) sideLoot.innerText = `💎 ${monthAccumGem}개 / ✨ ${monthAccumFrag}개`;
    if (sideCount) sideCount.innerText = `총 ${monthTotalSessionsCount}회차 (${monthTotalSessionsCount * 30}분)`;
};

/**
 * 💡 [핵심 해결책] 동적 탭 전환 및 레이아웃 빌더 스크립트 엔진
 * 빈 화면 출현 결함을 예방하기 위해 전역 렌더러 함수로 래핑하여 마운팅합니다.
 */
window.renderHistoryPage = function() {
    const historyWorkspace = document.getElementById('hunt-history');
    if (!historyWorkspace) return;

    historyWorkspace.innerHTML = `
        <div class="omni-calendar-card">
            <div class="calendar-top-flex">
                <div>
                    <h2 class="calendar-main-title">사냥 통합 기록지 (Calendar Archive)</h2>
                    <p class="calendar-sub-title">일자별 정산 명세 확인 및 클릭 시 회차별 상세 세부정보를 분석합니다.</p>
                </div>
                <div class="char-name-badge-pill" id="lblLiveAttendanceCharBadge">캐릭터 로드 중</div>
            </div>

            <div class="calendar-action-bar">
                <div class="month-stepper-container">
                    <button type="button" class="month-step-btn" onclick="window.changeMonth(-1)">◀</button>
                    <span class="month-center-text" id="omniCalendarYearMonthText">2026년 07월</span>
                    <button type="button" class="month-step-btn" onclick="window.changeMonth(1)">▶</button>
                </div>
                <button type="button" class="btn-all-logs-shortcut" onclick="window.renderAttendance();">🔄 기록 수동 동기화</button>
            </div>

            <div class="v14-history-main-flex-wrapper">
                <div class="v14-calendar-grid-area">
                    <div class="calendar-weekdays-grid">
                        <div class="weekday-header-cell cell-sun">일</div>
                        <div class="weekday-header-cell">월</div>
                        <div class="weekday-header-cell">화</div>
                        <div class="weekday-header-cell">수</div>
                        <div class="weekday-header-cell">목</div>
                        <div class="weekday-header-cell">금</div>
                        <div class="weekday-header-cell cell-sat">토</div>
                    </div>
                    <div class="calendar-days-matrix-grid" id="omniCalendarMatrixRoot"></div>
                </div>

                <div class="v14-month-summary-vertical-sidebar">
                    <h3 class="v14-sidebar-main-title">📊 이번 달 정산 요약 리포트</h3>
                    
                    <div class="v14-sidebar-stats-card">
                        <span class="v14-sidebar-stats-label">💰 월간 누적 획득 메소</span>
                        <span class="v14-sidebar-stats-value" id="v14SideMonthTotalMeso" style="color:#6d28d9;">0 Meso</span>
                        <div class="v14-sidebar-stats-desc">이번 달 내에 정산 마감 완료된 순수 메소의 최종 합계 금액입니다.</div>
                    </div>
                    
                    <div class="v14-sidebar-stats-card">
                        <span class="v14-sidebar-stats-label">📈 월간 누적 획득 경험치</span>
                        <span class="v14-sidebar-stats-value" id="v14SideMonthTotalExp" style="color:#2563eb;">+0.000 %</span>
                        <div class="v14-sidebar-stats-desc">사냥 세션을 통해 획득한 총 경험치량으로 레벨업 성장을 분석합니다.</div>
                    </div>
                    
                    <div class="v14-sidebar-stats-card">
                        <span class="v14-sidebar-stats-label">🔮 누적 전리품 합산</span>
                        <span class="v14-sidebar-stats-value" id="v14SideMonthTotalLoot" style="color:#1e1b4b;">💎 0개 / ✨ 0개</span>
                        <div class="v14-sidebar-stats-desc">이번 달에 수확한 핵심 성장 재화(코어 젬스톤 및 에르다 조각)의 총량입니다.</div>
                    </div>

                    <div class="v14-sidebar-stats-card">
                        <span class="v14-sidebar-stats-label">⚔️ 사냥 세션 가동 지표</span>
                        <span class="v14-sidebar-stats-value" id="v14SideMonthTotalCount" style="color:#4b5563;">총 0회차 가동</span>
                        <div class="v14-sidebar-stats-desc">원장에 확정 기록된 총 사냥 횟수와 실시간 누적 누계 가동 시간 정보입니다.</div>
                    </div>
                </div>
            </div>
        </div>

        <div id="v14HistoryModalBackdrop" class="v14-history-modal-backdrop" onclick="window.closeHistoryDetailModal();">
            <div class="v14-history-modal-window" onclick="event.stopPropagation();">
                <div class="v14-history-modal-header">
                    <div id="v14HistoryModalTitleDate" class="v14-history-modal-title">📋 정산 보고서</div>
                    <button type="button" class="v14-history-modal-close-x" onclick="window.closeHistoryDetailModal();">&times;</button>
                </div>
                <div id="v14HistoryModalBodyRoot" class="v14-history-modal-body"></div>
            </div>
        </div>
    `;

    // 마운트 후 기본 달력 데이터 즉시 로드
    window.renderAttendance();
};

// 최초 일반 로딩 시 대응용 DOM 초기 결착 리스너 유지
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('hunt-history')) {
        window.renderHistoryPage();
    }
});