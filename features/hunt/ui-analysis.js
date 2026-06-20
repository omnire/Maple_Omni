/**
 * ============================================================================
 * ⚔️ MAPLE OMNI - 성장 분석 모듈 (PRO MODE + MONTHLY WAGE)
 * 설명: 2x2 그리드 레이아웃을 유지하며, 우측 상단에 '이번 달 누적 사냥 월급' 카드가 포함됩니다.
 * ============================================================================
 */

window.renderGrowthChart = function() {
    // [초보자용 주석] 차트를 그릴 도화지(canvas)를 HTML에서 찾습니다.
    const canvas = document.getElementById('growthChart');
    if (!canvas) return; // 캔버스가 없으면 함수를 종료합니다.

    // 1. 데이터 수집 로직 (저장된 기록 + 현재 작성 중인 임시 기록 통합)
    const allRecords = JSON.parse(localStorage.getItem('maple_hunt_records') || '[]');
    const currentTabIdx = parseInt(window.currentIdx) || 1;
    const globalDateVal = document.getElementById('huntGlobalDate')?.value || new Date().toISOString().split('T')[0];

    // [초보자용 주석] 차트(최근 7일)에 넣을 데이터들을 담을 바구니를 만듭니다.
    const labels = []; 
    const mesoValues = []; 
    const mesoFullValues = []; // 7일간의 1원 단위 원본 저장용 (툴팁에서 정확한 숫자를 보여주기 위함)
    const expValues = []; 
    const fragValues = []; 
    const today = new Date();

    // [초보자용 주석] 이번 달(1일~오늘) 누적 메소 금액을 담을 변수를 만듭니다.
    let monthlySumMeso = 0;
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 자바스크립트는 0이 1월, 4가 5월을 뜻합니다.

    // ==========================================
    // 억 단위 7일 차트 데이터 및 이번 달 누적 데이터 추출 루프
    // ==========================================
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD 형식으로 변환
        labels.push(`${d.getMonth() + 1}/${d.getDate()}`);

        let dSumMeso = 0, dSumExp = 0, dSumFrag = 0;

        // 확정된 전체 기록에서 해당 날짜 데이터만 골라내어 합산
        allRecords.filter(r => r.charId == currentTabIdx && r.date === dateStr).forEach(r => {
            dSumMeso += parseInt(String(r.meso).replace(/,/g, "")) || 0;
            dSumExp += parseFloat(r.exp) || 0;
            dSumFrag += parseInt(r.frag) || 0;
        });

        // 임시 기록(subHistory)에서 아직 전송 안 된 데이터도 함께 합산
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

        // 최근 7일 그래프용 바구니에 데이터를 예쁘게 가공해서 주입
        mesoValues.push(dSumMeso / 100000000); 
        mesoFullValues.push(dSumMeso);         
        expValues.push(parseFloat(dSumExp.toFixed(3)));
        fragValues.push(dSumFrag);
    }

    // ==========================================
    // [초보자용 주석] 이번 달(1일~현재) 전체 누적 금액을 따로 긁어모읍니다.
    // ==========================================
    // 1) 확정 기록 중 이번 달 데이터 필터링
    allRecords.forEach(r => {
        const rDate = new Date(r.date);
        if (r.charId == currentTabIdx && rDate.getFullYear() === currentYear && rDate.getMonth() === currentMonth) {
            monthlySumMeso += parseInt(String(r.meso).replace(/,/g, "")) || 0;
        }
    });

    // 2) 임시 기록 중 이번 달 데이터 필터링
    if (window.subHistory) {
        Object.keys(window.subHistory).forEach(key => {
            const parts = key.split('_'); // [charId, YYYY-MM-DD] 형태로 분리됨
            if (parts[0] == currentTabIdx && parts[1]) {
                const rDate = new Date(parts[1]);
                if (rDate.getFullYear() === currentYear && rDate.getMonth() === currentMonth) {
                    window.subHistory[key].forEach(tempRec => {
                        if (!tempRec.isFinalized) {
                            monthlySumMeso += parseInt(String(tempRec.meso).replace(/,/g, "")) || 0;
                        }
                    });
                }
            }
        });
    }

    // 2. HTML 뼈대 만들기 (2x2 그리드 프레임워크 적용)
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
                <div style="color: #64748b; font-size: 11px; font-weight: 600;">
                    Updated: ${new Date().toLocaleDateString()}
                </div>
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

    // 📊 그래프 카드를 손쉽게 찍어내는 붕어빵 틀(함수)
    function renderProCard(title, value, unit, canvasId) {
        return `
            <div style="background: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; flex-direction: column; justify-content: space-between;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h4 style="margin: 0; font-size: 13px; color: #64748b; font-weight: 800; letter-spacing: 1px;">${title}</h4>
                    <div style="font-size: 22px; font-weight: 900; color: #1e293b;">
                        ${value}<span style="font-size: 14px; color: #94a3b8; margin-left: 4px; font-weight: 700;">${unit}</span>
                    </div>
                </div>
                <div style="height: 160px; width: 100%; position: relative;"><canvas id="${canvasId}"></canvas></div>
            </div>
        `;
    }

    // 💰 [신규 위젯] 이달의 누적 사냥 월급 정산 카드를 만드는 기능
    function renderMonthlySalaryCard(monthlyMesoFull) {
        const mesoRate = 2500; // 💡 1억당 현금 시세 (기본값 설정)
        
        // 이번 달 총 획득 메소 정수를 기반으로 실제 현금 가치 환산
        const cashValue = Math.floor((monthlyMesoFull / 100000000) * mesoRate);
        const chickenValue = (cashValue / 20000).toFixed(1); // 치킨 2만원 기준
        const coffeeValue = (cashValue / 4500).toFixed(1);   // 커피 4500원 기준

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
                    <div style="font-size: 13px; color: #64748b; font-weight: 500;">
                        이번 달 사냥을 통해 축적된 순수 자산 가치 명세입니다.
                    </div>
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

    // 3. 차트 엔진(그래프 그리는 도구) 설정 및 실행 함수
    const initProChart = (id, data, unit, fullData = null) => {
        const target = document.getElementById(id);
        if (!target) return;
        const ctx = target.getContext('2d');
        const proColor = '#475569'; 

        // 이전에 그려진 그래프가 남아있다면 깔끔하게 지우고 새로 그립니다. (오류 방지)
        if(window[id + '_instance']) window[id + '_instance'].destroy();

        window[id + '_instance'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    borderColor: proColor,
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: proColor,
                    pointBorderWidth: 2,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: proColor,
                    pointHoverBorderColor: "#fff",
                    pointHoverBorderWidth: 2,
                    tension: 0.1, 
                    fill: true,
                    backgroundColor: (context) => {
                        const gradient = ctx.createLinearGradient(0, 0, 0, 160);
                        gradient.addColorStop(0, 'rgba(71, 85, 105, 0.12)'); 
                        gradient.addColorStop(1, 'rgba(71, 85, 105, 0)');
                        return gradient;
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false }, // 마우스를 올렸을 때 반응속도 최적화
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                        padding: 12,
                        cornerRadius: 8,
                        titleColor: '#cbd5e1',
                        bodyColor: '#ffffff',
                        titleFont: { size: 12, weight: 'normal' },
                        bodyFont: { size: 14, weight: 'bold' },
                        displayColors: false,
                        callbacks: {
                            title: (tooltipItems) => '📅 날짜: ' + tooltipItems[0].label,
                            label: (context) => {
                                const idx = context.dataIndex; 
                                // 메소 차트일 경우 반올림 오차 없이 1원 단위 원본 배열 데이터를 툴팁에 정확히 표시합니다.
                                if (unit === '억' && fullData) {
                                    return ` 💰 수치: ${fullData[idx].toLocaleString()} 원`;
                                }
                                return ` 📈 수치: ${context.parsed.y.toLocaleString()} ${unit}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { display: false }, // 깔끔한 UI를 위해 가로 그리드 실선 제거
                        border: { display: false },
                        ticks: { color: '#94a3b8', font: { size: 10 }, maxTicksLimit: 5, callback: (v) => v + unit }
                    },
                    x: {
                        grid: { display: false }, // 세로 그리드 실선 제거
                        border: { display: false },
                        ticks: { color: '#94a3b8', font: { size: 10 } }
                    }
                }
            }
        });
    };

    // 4. 차트가 완전히 준비된 후 0.05초 뒤에 렌더링을 시작합니다. (안정성 강화)
    setTimeout(() => {
        initProChart('expChartCanvas', expValues, '%');
        initProChart('mesoChartCanvas', mesoValues, '억', mesoFullValues); // 메소는 원본 데이터(fullData)도 전달
        initProChart('fragChartCanvas', fragValues, '개');
    }, 50);
};