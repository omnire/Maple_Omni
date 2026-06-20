/**
 * ============================================================================
 * ⚔️ MAPLE OMNI - 분석 및 정산 엔진
 * 파일명: features/hunt/hunt-analysis.js
 * 설명: 일주일 치 사냥 데이터를 분석해 차트를 그리고, 달력 출석 이벤트를 관리합니다.
 * ============================================================================
 */

// [초보자용 주석] 달력의 연도와 월을 기억하는 기본 메모리 설정입니다.
if (typeof window.attendanceYear === 'undefined') window.attendanceYear = new Date().getFullYear();
if (typeof window.attendanceMonth === 'undefined') window.attendanceMonth = new Date().getMonth();

// [초보자용 주석] 1. 수동 출석 체크 (달력을 직접 클릭했을 때)
window.toggleAttendance = function(dateStr, charId) {
    const targetIdx = charId || window.currentIdx || 1;
    let manualAttendance = JSON.parse(localStorage.getItem(`manual_attendance_${targetIdx}`) || '{}');
    
    // 클릭한 날짜의 출석 상태를 반대로 뒤집습니다 (체크 <-> 해제)
    manualAttendance[dateStr] = !manualAttendance[dateStr];
    localStorage.setItem(`manual_attendance_${targetIdx}`, JSON.stringify(manualAttendance));
    
    // 화면을 새로고침하여 바뀐 색상을 보여줍니다.
    if (typeof window.renderAttendance === 'function') window.renderAttendance();
    if (typeof showToast === 'function') {
        showToast(manualAttendance[dateStr] ? "출석 체크 완료! ✅" : "출석이 해제되었습니다.");
    }
};

// [초보자용 주석] 2. 출석 달력 월 변경 ( < , > 버튼 누를 때 )
window.changeMonth = function(offset) { 
    window.attendanceMonth += offset;
    
    // 1월에서 뒤로가면 작년 12월, 12월에서 앞으로 가면 내년 1월로 계산합니다.
    if (window.attendanceMonth < 0) { 
        window.attendanceMonth = 11; 
        window.attendanceYear -= 1; 
    } else if (window.attendanceMonth > 11) { 
        window.attendanceMonth = 0; 
        window.attendanceYear += 1; 
    }
    
    if (typeof window.renderAttendance === 'function') window.renderAttendance(); 
};

// [초보자용 주석] 3. 이달의 정산 및 그래프 분석 (성장 분석 화면용)
window.renderGrowthAnalysis = function(monthMeso = 0) {
    const root = document.getElementById('growthAnalysisRoot');
    if (!root) return;

    const allRecords = JSON.parse(localStorage.getItem('maple_hunt_records') || '[]');
    const currentTabIdx = parseInt(window.currentIdx) || 1;
    const now = new Date();
    
    const labels = [], expValues = [], mesoValues = [], fragValues = [];

    // 최근 7일치 트렌드 데이터를 차곡차곡 수집합니다.
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        labels.push(`${d.getMonth() + 1}/${d.getDate()}`);

        let dSumExp = 0, dSumMeso = 0, dSumFrag = 0;
        
        allRecords.filter(r => r.charId == currentTabIdx && r.date === dateStr).forEach(r => {
            dSumExp += parseFloat(r.exp) || 0;
            dSumMeso += parseInt(String(r.meso).replace(/,/g, "")) || 0;
            dSumFrag += parseInt(r.frag) || 0;
        });

        expValues.push(dSumExp);
        mesoValues.push(dSumMeso / 100000000); // 메소를 '억' 단위로 보기 좋게 압축합니다.
        fragValues.push(dSumFrag);
    }

    // 환산 가치 (1억당 2500원 기준)
    const mesoRate = 2500; 
    const monthCash = Math.floor((monthMeso / 100000000) * mesoRate);

    root.innerHTML = `
        <div style="margin-bottom: 30px;">
            <div style="font-weight: 900; font-size: 24px; color: #1e293b; letter-spacing: -1px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    ANALYTICS & VALUE
                    <div style="font-size: 13px; color: #94a3b8; font-weight: 600; margin-top: 5px;">최근 7일 지표 및 이달의 누적 정산 현황</div>
                </div>
            </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; width: 100%;">
            <div style="background: #ffffff; border-radius: 24px; border: 1px solid #eef2f6; padding: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                    <div style="font-size: 12px; color: #64748b; font-weight: 800; letter-spacing: 0.5px;">EXPERIENCE</div>
                    <div style="font-size: 24px; font-weight: 900; color: #1e293b;">${expValues[6].toFixed(3)} <span style="font-size: 16px; color: #94a3b8;">%</span></div>
                </div>
                <div style="height: 180px;"><canvas id="expGrowthChart"></canvas></div>
            </div>
            <div style="background: #ffffff; border-radius: 24px; border: 1px solid #eef2f6; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.02); display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div style="font-size: 12px; color: #64748b; font-weight: 800; letter-spacing: 0.5px;">MONTHLY SALARY (이달의 정산)</div>
                    <span style="background: #fff9db; color: #f59f00; font-size: 10px; font-weight: 800; padding: 3px 10px; border-radius: 8px;">이번 달 누적</span>
                </div>
                <div style="margin-bottom: 8px;">
                    <span style="font-size: 42px; font-weight: 900; color: #1e293b;">${monthCash.toLocaleString()}</span>
                    <span style="font-size: 18px; font-weight: 800; color: #94a3b8; margin-left: 5px;">KRW</span>
                </div>
                <div style="font-size: 13px; color: #94a3b8; font-weight: 600; margin-bottom: 30px; line-height: 1.5;">이번 달 사냥을 통해 축적된 순수 자산 가치 명세입니다.</div>
                
                <div style="border-top: 1px dashed #eef2f6; padding-top: 25px; display: flex; flex-direction: column; gap: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 14px; color: #475569; font-weight: 700;">🍗 누적 치킨값</span>
                        <b style="color: #f59f00; font-size: 16px;">${(monthCash / 20000).toFixed(1)} <span style="font-size: 12px; color: #94a3b8; font-weight: 600;">마리분</span></b>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 14px; color: #475569; font-weight: 700;">☕ 누적 커피값</span>
                        <b style="color: #6366f1; font-size: 16px;">${(monthCash / 4500).toFixed(1)} <span style="font-size: 12px; color: #94a3b8; font-weight: 600;">잔분</span></b>
                    </div>
                </div>
            </div>
            <div style="background: #ffffff; border-radius: 24px; border: 1px solid #eef2f6; padding: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                    <div style="font-size: 12px; color: #64748b; font-weight: 800; letter-spacing: 0.5px;">DAILY MESO PROFIT</div>
                    <div style="font-size: 24px; font-weight: 900; color: #1e293b;">${mesoValues[6].toFixed(2)} <span style="font-size: 16px; color: #94a3b8;">억</span></div>
                </div>
                <div style="height: 180px;"><canvas id="mesoGrowthChart"></canvas></div>
            </div>
            <div style="background: #ffffff; border-radius: 24px; border: 1px solid #eef2f6; padding: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                    <div style="font-size: 12px; color: #64748b; font-weight: 800; letter-spacing: 0.5px;">DAILY FRAGMENTS</div>
                    <div style="font-size: 24px; font-weight: 900; color: #1e293b;">${fragValues[6]} <span style="font-size: 16px; color: #94a3b8;">개</span></div>
                </div>
                <div style="height: 180px;"><canvas id="fragGrowthChart"></canvas></div>
            </div>
        </div>
    `;

    setTimeout(() => {
        initChart('expGrowthChart', labels, expValues, '#475569');
        initChart('mesoGrowthChart', labels, mesoValues, '#0284c7');
        initChart('fragGrowthChart', labels, fragValues, '#8b5cf6');
    }, 100);
};

// [초보자용 주석] 4. 차트 생성기 (이전 차트가 남아있다면 부수고 새로 그려 겹침 오류를 막습니다)
function initChart(id, labels, data, color) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if(window[id + '_instance']) window[id + '_instance'].destroy();
    
    window[id + '_instance'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                borderColor: color,
                backgroundColor: color + '15',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10, weight: '700' } } },
                y: { grid: { color: '#f1f5f9' }, ticks: { display: false } }
            }
        }
    });
}

// [초보자용 주석] 5. 우측 주간 요약 데이터 갱신 (목요일 자정 기준 초기화 반영)
window.refreshWeekly = function() {
    let allRecords = JSON.parse(localStorage.getItem('maple_hunt_records') || '[]');
    const currentTabIdx = parseInt(window.currentIdx) || 1;
    
    let mSum = 0; // 이달 전체 메소
    let wMeso = 0, wExp = 0, wFrag = 0; // 이번 주 메소, 경험치, 조각

    const now = new Date();
    const lastThursday = new Date();
    lastThursday.setDate(now.getDate() - ((now.getDay() + 3) % 7));
    lastThursday.setHours(0, 0, 0, 0);

    allRecords.forEach(rec => {
        if (rec.charId != currentTabIdx) return;
        
        const d = new Date(rec.date);
        const m = parseInt(String(rec.meso).replace(/,/g, "")) || 0;
        
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
            mSum += m;
        }
        
        if (d >= lastThursday) {
            wMeso += m;
            wExp += parseFloat(rec.exp) || 0;
            wFrag += parseInt(rec.frag) || 0;
        }
    });

    const elMeso = document.getElementById('weekly-hunt-meso');
    const elExp = document.getElementById('weekly-hunt-exp');
    const elFrag = document.getElementById('weekly-hunt-frag');
    const elTotal = document.getElementById('weekly-total-sum');

    if (elMeso) elMeso.innerText = (wMeso / 100000000).toFixed(2) + " 억";
    if (elExp) elExp.innerText = wExp.toFixed(3) + " %";
    if (elFrag) elFrag.innerText = wFrag.toLocaleString() + " 개";
    if (elTotal) elTotal.innerText = (wMeso / 100000000).toFixed(2) + " 억";

    if (typeof window.renderGrowthAnalysis === 'function') window.renderGrowthAnalysis(mSum);
    if (typeof window.renderAttendance === 'function') window.renderAttendance();
};

// [초보자용 주석] 6. script.js에서 이관된 주간 요약 동기화 함수
window.updateWeeklySummary = function() {
    if (typeof window.refreshWeekly === 'function') {
        window.refreshWeekly();
    }
};

// ==========================================
// [초보자용 주석] 7. 성장 분석 모듈 (PRO MODE + MONTHLY WAGE) 통합
// ==========================================
window.renderGrowthChart = function() {
    const canvas = document.getElementById('growthChart');
    if (!canvas) return;

    const allRecords = JSON.parse(localStorage.getItem('maple_hunt_records') || '[]');
    const currentTabIdx = parseInt(window.currentIdx) || 1;
    const globalDateVal = document.getElementById('huntGlobalDate')?.value || new Date().toISOString().split('T')[0];

    const labels = [], mesoValues = [], mesoFullValues = [], expValues = [], fragValues = [];
    const today = new Date();
    let monthlySumMeso = 0;
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); 

    // 최근 7일 데이터 수집 (임시 기록 포함)
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        labels.push(`${d.getMonth() + 1}/${d.getDate()}`);

        let dSumMeso = 0, dSumExp = 0, dSumFrag = 0;

        allRecords.filter(r => r.charId == currentTabIdx && r.date === dateStr).forEach(r => {
            dSumMeso += parseInt(String(r.meso).replace(/,/g, "")) || 0;
            dSumExp += parseFloat(r.exp) || 0;
            dSumFrag += parseInt(r.frag) || 0;
        });

        const sKey = `${currentTabIdx}_${dateStr}`;
        if (window.subHistory && window.subHistory[sKey]) {
            window.subHistory[sKey].forEach(tempRec => {
                if (!tempRec.isFinalized) { 
                    dSumMeso += parseInt(String(tempRec.meso).replace(/,/g, "")) || 0;
                    dSumExp += parseFloat(tempRec.exp) || 0;
                    dSumFrag += parseInt(tempRec.frag) || 0;
                }
            });
        }

        mesoValues.push(dSumMeso / 100000000); 
        mesoFullValues.push(dSumMeso);         
        expValues.push(parseFloat(dSumExp.toFixed(3)));
        fragValues.push(dSumFrag);
    }

    // 이번 달 전체 누적 데이터
    allRecords.forEach(r => {
        const rDate = new Date(r.date);
        if (r.charId == currentTabIdx && rDate.getFullYear() === currentYear && rDate.getMonth() === currentMonth) {
            monthlySumMeso += parseInt(String(r.meso).replace(/,/g, "")) || 0;
        }
    });

    if (window.subHistory) {
        Object.keys(window.subHistory).forEach(key => {
            const parts = key.split('_');
            if (parts[0] == currentTabIdx && parts[1]) {
                const rDate = new Date(parts[1]);
                if (rDate.getFullYear() === currentYear && rDate.getMonth() === currentMonth) {
                    window.subHistory[key].forEach(tempRec => {
                        if (!tempRec.isFinalized) monthlySumMeso += parseInt(String(tempRec.meso).replace(/,/g, "")) || 0;
                    });
                }
            }
        });
    }

    const chartWrapper = canvas.parentElement;
    chartWrapper.style.backgroundColor = "#f8fafc"; 
    chartWrapper.style.padding = "30px 15px 60px 15px"; 
    chartWrapper.style.width = "100%";
    chartWrapper.style.minHeight = "100vh"; 

    chartWrapper.innerHTML = `
        <div style="width: 100%; max-width: 1000px; margin: 0 auto;">
            <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px;">
                <div>
                    <h2 style="margin: 0; font-size: 18px; color: #0f172a; font-weight: 800; letter-spacing: 0.5px;">ANALYTICS & VALUE</h2>
                    <p style="margin: 4px 0 0; color: #64748b; font-size: 12px;">최근 7일 지표 및 이달의 누적 정산 현황</p>
                </div>
                <div style="color: #64748b; font-size: 11px; font-weight: 600;">Updated: ${new Date().toLocaleDateString()}</div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                ${renderProCard("EXPERIENCE", expValues[6].toFixed(3), "%", "expChartCanvas")}
                ${renderMonthlySalaryCard(monthlySumMeso)} 
                ${renderProCard("DAILY MESO PROFIT", mesoValues[6].toFixed(2), "억", "mesoChartCanvas")}
                ${renderProCard("DAILY FRAGMENTS", fragValues[6].toLocaleString(), "개", "fragChartCanvas")}
            </div>
            <div style="margin-top: 30px; text-align: center;">
                <p style="margin: 0; color: #94a3b8; font-size: 11px; letter-spacing: 1px;">© 2026 MAPLE OMNI. All Rights Reserved. Hosted by PlayXP Inc.</p>
            </div>
        </div>
    `;

    function renderProCard(title, value, unit, canvasId) {
        return `
            <div style="background: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; flex-direction: column; justify-content: space-between;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h4 style="margin: 0; font-size: 13px; color: #64748b; font-weight: 800; letter-spacing: 1px;">${title}</h4>
                    <div style="font-size: 22px; font-weight: 900; color: #1e293b;">${value}<span style="font-size: 14px; color: #94a3b8; margin-left: 4px; font-weight: 700;">${unit}</span></div>
                </div>
                <div style="height: 160px; width: 100%; position: relative;"><canvas id="${canvasId}"></canvas></div>
            </div>
        `;
    }

    function renderMonthlySalaryCard(monthlyMesoFull) {
        const mesoRate = 2500; 
        const cashValue = Math.floor((monthlyMesoFull / 100000000) * mesoRate);
        const chickenValue = (cashValue / 20000).toFixed(1); 
        const coffeeValue = (cashValue / 4500).toFixed(1);   

        return `
            <div style="background: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h4 style="margin: 0; font-size: 13px; color: #64748b; font-weight: 800; letter-spacing: 1px;">MONTHLY SALARY (이달의 정산)</h4>
                        <span style="background: #fef3c7; color: #d97706; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 800;">이번 달 누적</span>
                    </div>
                    <div style="font-size: 32px; font-weight: 900; color: #0f172a; margin-bottom: 5px; letter-spacing: -0.5px;">
                        ${cashValue.toLocaleString()}<span style="font-size: 16px; color: #94a3b8; margin-left: 6px; font-weight: 700;">KRW</span>
                    </div>
                    <div style="font-size: 13px; color: #64748b; font-weight: 500;">이번 달 사냥을 통해 축적된 순수 자산 가치 명세입니다.</div>
                </div>
                <div style="margin-top: 20px; padding-top: 16px; border-top: 1px dashed #e2e8f0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 14px;">
                        <span style="color: #475569; font-weight: 700;">🍗 누적 치킨값</span>
                        <span style="font-weight: 900; color: #d97706; font-size: 16px;">${chickenValue} <span style="font-size: 12px; color: #94a3b8;">마리분</span></span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 14px;">
                        <span style="color: #475569; font-weight: 700;">☕ 누적 커피값</span>
                        <span style="font-weight: 900; color: #6366f1; font-size: 16px;">${coffeeValue} <span style="font-size: 12px; color: #94a3b8;">잔분</span></span>
                    </div>
                </div>
            </div>
        `;
    }

    const initProChart = (id, data, unit, fullData = null) => {
        const target = document.getElementById(id);
        if (!target) return;
        const ctx = target.getContext('2d');
        const proColor = '#475569'; 

        if(window[id + '_instance']) window[id + '_instance'].destroy();

        window[id + '_instance'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    data: data, borderColor: proColor, borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#ffffff',
                    pointBorderColor: proColor, pointBorderWidth: 2, pointHoverRadius: 6, pointHoverBackgroundColor: proColor,
                    pointHoverBorderColor: "#fff", pointHoverBorderWidth: 2, tension: 0.1, fill: true,
                    backgroundColor: (context) => {
                        const gradient = ctx.createLinearGradient(0, 0, 0, 160);
                        gradient.addColorStop(0, 'rgba(71, 85, 105, 0.12)'); 
                        gradient.addColorStop(1, 'rgba(71, 85, 105, 0)');
                        return gradient;
                    }
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true, backgroundColor: 'rgba(15, 23, 42, 0.95)', padding: 12, cornerRadius: 8,
                        titleColor: '#cbd5e1', bodyColor: '#ffffff', titleFont: { size: 12, weight: 'normal' },
                        bodyFont: { size: 14, weight: 'bold' }, displayColors: false,
                        callbacks: {
                            title: (tooltipItems) => '📅 날짜: ' + tooltipItems[0].label,
                            label: (context) => {
                                const idx = context.dataIndex; 
                                if (unit === '억' && fullData) return ` 💰 수치: ${fullData[idx].toLocaleString()} 원`;
                                return ` 📈 수치: ${context.parsed.y.toLocaleString()} ${unit}`;
                            }
                        }
                    }
                },
                scales: {
                    y: { beginAtZero: true, grid: { display: false }, border: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 }, maxTicksLimit: 5, callback: (v) => v + unit } },
                    x: { grid: { display: false }, border: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } }
                }
            }
        });
    };

    // [초보자용 주석] 수정된 마지막 부분
    setTimeout(() => {
        initProChart('expChartCanvas', expValues, '%');
        initProChart('mesoGrowthChart', mesoValues, '억', mesoFullValues);
        initProChart('fragGrowthChart', fragValues, '개');
    }, 50);
};