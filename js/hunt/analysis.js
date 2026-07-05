/**
 * ============================================================================
 * 📉 MAPLE OMNI V14 - features/hunt/analysis.js [완전판 수정 코어]
 * 설명: a is not defined 런타임 크래시 에러를 완전 패치하고 캐릭터 아바타를 복원합니다.
 * 패치노트: 문법 오타 수정 및 데이터 유효성 검증을 고도화하여 렌더링 무결성을 실현했습니다.
 * 규칙: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 달아줍니다.
 * ============================================================================
 */

// 💡 [초보자 가이드] 메모리 버퍼 초기 데이터 구조가 누락되었을 때 발생할 오류를 막기 위한 싱글톤 체크 가드입니다.
if (typeof window.analysisModel === 'undefined') {
    window.analysisModel = {
        currentAvatarUrl: "",
        chartCachedInstance: null
    };
}

/**
 * 💡 [초보자 가이드] 로컬스토리지에 저장되어 있던 특정 인덱스 캐릭터의 외형 아바타 URL 데이터를 파싱하여 복구합니다.
 */
window.renderOmniAvatar = function(charId) {
    const idx = parseInt(charId || window.currentIdx || 1);
    const avatarImgElement = document.getElementById(`v14AnalysisAvatar_${idx}`);
    
    if (!avatarImgElement) return;

    const savedMeta = JSON.parse(localStorage.getItem(`omni_char_meta_${idx}`) || '{}');
    
    if (savedMeta.character_image) {
        window.analysisModel.currentAvatarUrl = savedMeta.character_image;
    } else {
        window.analysisModel.currentAvatarUrl = "https://open.api.nexon.com/static/maplestory/Character/001.png";
    }

    avatarImgElement.src = window.analysisModel.currentAvatarUrl;
    avatarImgElement.style.display = "block";
    console.log(`[아바타 엔진] 캐릭터 ${idx}번 외형 복원 완료.`);
};

/**
 * 💡 [초보자 가이드] 사냥 기록 배열 상에서 수집된 주스탯 메소, 경험치, 젬스톤, 조각 데이터를 취합 연산 후 화면에 박아줍니다.
 */
window.processGrowthStats = function(charId) {
    const idx = parseInt(charId || window.currentIdx || 1);
    const records = JSON.parse(localStorage.getItem('maple_hunt_records') || '[]');
    
    const myRecords = records.filter(r => r.charId == idx);

    let totalMeso = 0;
    let totalExp = 0.0;
    let totalGem = 0;
    let totalFrag = 0;

    myRecords.forEach(recordItem => {
        totalMeso += parseInt(String(recordItem.meso).replace(/,/g, "")) || 0;
        totalExp += parseFloat(recordItem.exp) || 0;
        totalGem += parseInt(recordItem.gem) || 0;
        totalFrag += parseInt(recordItem.frag) || 0;
    });

    const viewMeso = document.getElementById(`v14_total_meso_${idx}`);
    const viewExp = document.getElementById(`v14_total_exp_${idx}`);
    const viewGem = document.getElementById(`v14_total_gem_${idx}`);
    const viewFrag = document.getElementById(`v14_total_frag_${idx}`);

    if (viewMeso) viewMeso.innerText = totalMeso.toLocaleString() + " 메소";
    if (viewExp)  viewExp.innerText = totalExp.toFixed(3) + "%";
    if (viewGem)  viewGem.innerText = totalGem.toLocaleString() + " 개";
    if (viewFrag) viewFrag.innerText = totalFrag.toLocaleString() + " 개";
};

/**
 * 💡 [초보자 가이드] 일별 순메소 수입 추이를 Chart.js 라인 차트로 드로잉하는 마스터 위젯 엔진 함수입니다.
 */
window.renderOmniGrowthChart = function(charId) {
    const idx = parseInt(charId || window.currentIdx || 1);
    const canvas = document.getElementById(`omniGrowthChart_${idx}`);
    if (!canvas || typeof Chart === 'undefined') return;

    const allRecords = JSON.parse(localStorage.getItem('maple_hunt_records') || '[]');
    const myRecords = allRecords.filter(r => r.charId == idx);

    // 최근 14일 날짜 라벨(MM-DD)을 오늘 기준으로 오래된 순 → 최신 순 생성합니다.
    const dateLabels = [];
    for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dateLabels.push(`${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }

    // 날짜별(MM-DD 기준) 순메소 총합을 집계합니다.
    const mesoByDate = {};
    myRecords.forEach(r => {
        if (!r.date) return;
        const shortLabel = r.date.slice(5); // "YYYY-MM-DD" -> "MM-DD"
        mesoByDate[shortLabel] = (mesoByDate[shortLabel] || 0) + (parseInt(String(r.meso).replace(/,/g, "")) || 0);
    });

    const dataPoints = dateLabels.map(label => mesoByDate[label] || 0);

    // 💡 [안전 메모리 해제]: 이전에 그려져 메모리를 점유하던 구형 차트 인스턴스를 날려 잔상과 팅김을 예방합니다.
    if (window.omniGrowthChartInstance) { window.omniGrowthChartInstance.destroy(); }

    window.omniGrowthChartInstance = new Chart(canvas, {
        type: 'line',
        data: {
            labels: dateLabels,
            datasets: [{
                label: '일별 순메소 수입',
                data: dataPoints,
                borderColor: '#0284c7',
                backgroundColor: 'rgba(2, 132, 199, 0.08)',
                borderWidth: 3,
                fill: true,
                tension: 0.3,
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 9 }, callback: v => (v / 100000000).toLocaleString() + '억' } },
                x: { grid: { display: false }, ticks: { font: { size: 9 } } }
            }
        }
    });
};

/**
 * 💡 [초보자 가이드] 수동 새로고침 버튼에 대한 클릭 시그널을 안전 필터 트래킹 처리하는 바인더 리스너입니다.
 */
window.initAnalysisLayoutListeners = function(charId) {
    const idx = parseInt(charId || window.currentIdx || 1);
    const actionBox = document.getElementById(`v14AnalysisRefreshBtn_${idx}`);

    if (!actionBox) return;

    actionBox.addEventListener('click', function(event) {
        if (event && event.preventDefault) {
            event.preventDefault();
        }
        
        console.log("[분석엔진] 유저 수동 리프레시 시그널 감지. 데이터 재정렬을 시작합니다.");
        
        window.processGrowthStats(idx);
        window.renderOmniAvatar(idx);
        window.renderOmniGrowthChart(idx);
    });
};

/**
 * 💡 [초보자 가이드] 2x2 플레이트 카드 형식 및 캔버스 프레임을 동적으로 드로잉 후 종합 모듈 함수를 연쇄 가동시킵니다.
 */
window.renderAnalysisPage = function() {
    const container = document.getElementById('hunt-analysis');
    if (!container) return;

    const currentTabIdx = parseInt(window.currentIdx) || 1;

    container.innerHTML = `
        <div class="v14-plate-card" style="margin: 10px;">
            <div class="v14-plate-header" style="justify-content: space-between;">
                <span>📊 누적 성장분석 리포트</span>
                <button type="button" id="v14AnalysisRefreshBtn_${currentTabIdx}" style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:6px; padding:3px 8px; font-size:10px; font-weight:bold; cursor:pointer;">🔄 동기화 새로고침</button>
            </div>
            
            <div style="display: flex; gap: 20px; align-items: center; background: #f8fafc; border-radius: 14px; padding: 15px;">
                <div style="width: 90px; height: 90px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    <img id="v14AnalysisAvatar_${currentTabIdx}" src="" alt="Character Avatar" style="width: 100%; height: auto; display: none;" />
                </div>
                
                <div style="flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 11px;">
                    <div>💰 총 누적 메소: <b id="v14_total_meso_${currentTabIdx}" style="font-size:12px; color:#b45309;">0 메소</b></div>
                    <div>📈 총 누적 경험치: <b id="v14_total_exp_${currentTabIdx}" style="font-size:12px; color:#6d28d9;">0.000%</b></div>
                    <div>🔮 총 누적 젬스톤: <b id="v14_total_gem_${currentTabIdx}" style="font-size:12px; color:#0369a1;">0 개</b></div>
                    <div>✨ 총 누적 에르다 조각: <b id="v14_total_frag_${currentTabIdx}" style="font-size:12px; color:#be123c;">0 개</b></div>
                </div>
            </div>

            <div class="analysis-chart-container" style="margin-top: 16px; height: 260px; background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; padding:12px; box-sizing:border-box;">
                <canvas id="omniGrowthChart_${currentTabIdx}"></canvas>
            </div>
        </div>
    `;

    window.processGrowthStats(currentTabIdx);
    window.renderOmniAvatar(currentTabIdx);
    window.renderOmniGrowthChart(currentTabIdx);
    window.initAnalysisLayoutListeners(currentTabIdx);
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('hunt-analysis')) {
        window.renderAnalysisPage();
    }
});