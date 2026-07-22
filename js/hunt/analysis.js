/**
 * ============================================================================
 * 📉 MAPLE OMNI V14 - features/hunt/analysis.js [4대 지표 격자 분할 차트 엔진]
 * 설명: [메소 / 경험치 / 젬스톤 / 조각]을 2x2 사각 칸 그리드 형태로 분석합니다.
 * 패치노트: 
 * 1. 기존 overview 슬롯 및 로컬스토리지 캐릭터 아바타 에셋 연동 완벽 동기화.
 * 2. 각 차트별 개별 인스턴스 소멸(Destroy) 장치를 마련하여 메모리 누수를 원천 차단.
 * 3. [테마 연동] 다크모드/화이트모드/핑크/블루 테마에 따라 글자 및 그리드 색상 완벽 가변 대응.
 * 규칙: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 달아줍니다.
 * ============================================================================
 */

// 1. 차트 인스턴스 전역 캐싱 및 상태 보존을 위한 마스터 버퍼 오브젝트 생성
// 브라우저 창(window)에 글로벌 변수가 설정되어 있지 않다면 안전하게 초기화합니다.
if (typeof window.analysisModel === 'undefined') {
    window.analysisModel = {
        currentAvatarUrl: "",
        charts: {
            meso: null,
            exp: null,
            gem: null,
            frag: null
        }
    };
}

/**
 * 💡 [초보자 가이드] 메인 슬롯에 동기화된 캐릭터 데이터를 추적하여 아바타 외형 이미지를 복원 바인딩합니다.
 * @param {number|string} charId - 선택된 캐릭터의 고유 슬롯 인덱스 번호
 */
window.renderOmniAvatar = function(charId) {
    const idx = parseInt(charId || window.currentIdx || 1);
    const avatarImgElement = document.getElementById(`v14AnalysisAvatar_${idx}`);
    const nameLabel = document.getElementById(`v14AnalysisCharName_${idx}`);
    const jobLabel = document.getElementById(`v14AnalysisCharJob_${idx}`);
    const subLabel = document.getElementById(`v14AnalysisCharSub_${idx}`);
    
    if (!avatarImgElement) return;

    // 로컬 스토리지에서 호환 가능한 캐릭터 메타 데이터를 불러옵니다. 비어있으면 빈 객체({}) 처리합니다.
    const savedMeta = JSON.parse(localStorage.getItem(`maple_char_data_${idx}`) || 
                                 localStorage.getItem(`omni_char_meta_${idx}`) || '{}');
    
    // 닉네임 및 직업 배지 세부 정보 연동 리프레시
    if (nameLabel) nameLabel.innerText = savedMeta.name || `Slot-${idx} 미등록`;
    if (jobLabel) {
        if (savedMeta.job) {
            jobLabel.innerText = savedMeta.job;
            jobLabel.style.display = "inline-block";
        } else {
            jobLabel.style.display = "none";
        }
    }
    if (subLabel) subLabel.innerText = savedMeta.level ? `Lv.${savedMeta.level} | ${savedMeta.server || '월드 미정'}` : 'NEXON 캐릭터 연동 필요';

    // 아바타 에셋 이미지 바인딩 처리 (이미지가 없으면 넥슨 기본 실루엣 아이콘으로 대체합니다)
    if (savedMeta.avatar || savedMeta.character_image) {
        window.analysisModel.currentAvatarUrl = savedMeta.avatar || savedMeta.character_image;
    } else {
        window.analysisModel.currentAvatarUrl = "https://open.api.nexon.com/static/maplestory/Character/001.png";
    }

    avatarImgElement.src = window.analysisModel.currentAvatarUrl;
    avatarImgElement.style.display = "block";
};

/**
 * 💡 [초보자 가이드] 사냥 기록 전체 원장을 스캔하여 4대 대형 상단 지표의 누적 총합량을 집계합니다.
 */
window.processGrowthStats = function(charId) {
    const idx = parseInt(charId || window.currentIdx || 1);
    const records = JSON.parse(localStorage.getItem('maple_hunt_records') || '[]');
    
    // 현재 선택된 캐릭터 고유 코드로 데이터 필터링 수행
    const myRecords = records.filter(r => r.charId == idx);

    let totalMeso = 0;
    let totalExp = 0.0;
    let totalGem = 0;
    let totalFrag = 0;

    // 필터링된 데이터를 순회하며 문자열 콤마(,)를 제거하고 숫자로 변환하여 더해줍니다.
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

    // 단위 포맷팅 후 화면 UI에 렌더링
    if (viewMeso) viewMeso.innerText = totalMeso.toLocaleString() + " 메소";
    if (viewExp)  viewExp.innerText = totalExp.toFixed(3) + "%";
    if (viewGem)  viewGem.innerText = totalGem.toLocaleString() + " 개";
    if (viewFrag) viewFrag.innerText = totalFrag.toLocaleString() + " 개";
};

/**
 * 💡 [초보자 가이드] 14일 추이 타임라인 레이블 어레이 배열 생성 도우미 함수
 */
window.getAnalysisDateLabels = function() {
    const dateLabels = [];
    for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dateLabels.push(`${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
    return dateLabels;
};

/**
 * 💡 [초보자 가이드] 4개의 그리드 영역에 라벤더 스타일 프리미엄 라인 그래프들을 독립적으로 드로잉 렌더링합니다.
 */
window.renderOmniGrowthChart = function(charId) {
    const idx = parseInt(charId || window.currentIdx || 1);
    if (typeof Chart === 'undefined') return;

    // 14일 관제 타임라인 스케일 구성
    const dateLabels = window.getAnalysisDateLabels();
    const allRecords = JSON.parse(localStorage.getItem('maple_hunt_records') || '[]');
    const myRecords = allRecords.filter(r => r.charId == idx);

    // 각 지표별 수집용 해시 테이블 초기화
    const mesoByDate = {}, expByDate = {}, gemByDate = {}, fragByDate = {};

    myRecords.forEach(r => {
        if (!r.date) return;
        const shortLabel = r.date.slice(5); // "YYYY-MM-DD" -> "MM-DD" 포맷 커팅
        
        mesoByDate[shortLabel] = (mesoByDate[shortLabel] || 0) + (parseInt(String(r.meso).replace(/,/g, "")) || 0);
        expByDate[shortLabel]  = (expByDate[shortLabel] || 0) + (parseFloat(r.exp) || 0);
        gemByDate[shortLabel]  = (gemByDate[shortLabel] || 0) + (parseInt(r.gem) || 0);
        fragByDate[shortLabel] = (fragByDate[shortLabel] || 0) + (parseInt(r.frag) || 0);
    });

    // 캘린더 일자 레이블 기준 배열 가공 배정
    const mesoPoints = dateLabels.map(label => mesoByDate[label] || 0);
    const expPoints  = dateLabels.map(label => expByDate[label] || 0);
    const gemPoints  = dateLabels.map(label => gemByDate[label] || 0);
    const fragPoints = dateLabels.map(label => fragByDate[label] || 0);

    // 💥 [메모리 누수 완전 방어] 기존 인스턴스 4종 존재 여부 체크 후 파괴 리셋
    if (window.analysisModel.charts.meso) { window.analysisModel.charts.meso.destroy(); }
    if (window.analysisModel.charts.exp)  { window.analysisModel.charts.exp.destroy(); }
    if (window.analysisModel.charts.gem)  { window.analysisModel.charts.gem.destroy(); }
    if (window.analysisModel.charts.frag) { window.analysisModel.charts.frag.destroy(); }

    // 🎨 [색상 테마 감지 엔진 연동] 
    // 브라우저 body 클래스를 판별하여 눈이 편안하고 가독성이 극대화된 차트 전용 텍스트/그리드 색상을 지정합니다.
    const isDark = document.body.classList.contains('dark-theme');
    const isPink = document.body.classList.contains('light-pink');
    const isBlue = document.body.classList.contains('light-blue');

    let gridColor = '#f5f3ff';   // 기본 연한 화이트/라벤더 그리드 선
    let yTickColor = '#6d28d9';  // 기본 Y축 보라색 글자
    let xTickColor = '#83799c';  // 기본 X축 회보라색 글자

    if (isDark) {
        gridColor = '#2d2a45';   // 다크모드 전용 톤다운 격자선
        yTickColor = '#c084fc';  // 다크모드에서 눈에 잘 띄는 연보라색
        xTickColor = '#94a3b8';  // 가독성 좋은 밝은 회색
    } else if (isPink) {
        gridColor = '#ffe4e6';
        yTickColor = '#db2777';
        xTickColor = '#f472b6';
    } else if (isBlue) {
        gridColor = '#e0f2fe';
        yTickColor = '#0284c7';
        xTickColor = '#38bdf8';
    }

    // 공통 차트 시각 디자인 제어 옵션 팩토리 모듈
    const getCommonOptions = (tickCallback) => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { 
                grid: { color: gridColor }, 
                ticks: { font: { size: 9, weight: '600' }, color: yTickColor, callback: tickCallback } 
            },
            x: { 
                grid: { display: false }, 
                ticks: { font: { size: 9, weight: '600' }, color: xTickColor } 
            }
        }
    });

    // 📉 1. 순메소 획득 추이 그래프 (라벤더 바이올렛 에디션)
    const ctxMeso = document.getElementById(`omniMesoChart_${idx}`);
    if (ctxMeso) {
        window.analysisModel.charts.meso = new Chart(ctxMeso, {
            type: 'line',
            data: {
                labels: dateLabels,
                datasets: [{ data: mesoPoints, borderColor: '#7c3aed', backgroundColor: 'rgba(124, 58, 237, 0.05)', borderWidth: 2.5, fill: true, tension: 0.3, pointRadius: 2.5 }]
            },
            options: getCommonOptions(v => v >= 100000000 ? (v / 100000000).toFixed(1) + '억' : (v / 10000).toFixed(0) + '만')
        });
    }

    // 📉 2. 사냥 경험치 축적 그래프 (로열 퍼플 에디션)
    const ctxExp = document.getElementById(`omniExpChart_${idx}`);
    if (ctxExp) {
        window.analysisModel.charts.exp = new Chart(ctxExp, {
            type: 'line',
            data: {
                labels: dateLabels,
                datasets: [{ data: expPoints, borderColor: '#9333ea', backgroundColor: 'rgba(147, 51, 234, 0.05)', borderWidth: 2.5, fill: true, tension: 0.3, pointRadius: 2.5 }]
            },
            options: getCommonOptions(v => v.toFixed(2) + '%')
        });
    }

    // 📉 3. 코어 젬스톤 수확 그래프 (딥 오키드 에디션)
    const ctxGem = document.getElementById(`omniGemChart_${idx}`);
    if (ctxGem) {
        window.analysisModel.charts.gem = new Chart(ctxGem, {
            type: 'line',
            data: {
                labels: dateLabels,
                datasets: [{ data: gemPoints, borderColor: '#6d28d9', backgroundColor: 'rgba(109, 40, 217, 0.05)', borderWidth: 2.5, fill: true, tension: 0.3, pointRadius: 2.5 }]
            },
            options: getCommonOptions(v => v + ' 개')
        });
    }

    // 📉 4. 에르다 조각 획득 그래프 (소프트 라벤더 에디션)
    const ctxFrag = document.getElementById(`omniFragChart_${idx}`);
    if (ctxFrag) {
        window.analysisModel.charts.frag = new Chart(ctxFrag, {
            type: 'line',
            data: {
                labels: dateLabels,
                datasets: [{ data: fragPoints, borderColor: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.05)', borderWidth: 2.5, fill: true, tension: 0.3, pointRadius: 2.5 }]
            },
            options: getCommonOptions(v => v + ' 개')
        });
    }
};

/**
 * 💡 [초보자 가이드] 새로고침 이벤트 바인딩 액션 리스너 허브
 */
window.initAnalysisLayoutListeners = function(charId) {
    const idx = parseInt(charId || window.currentIdx || 1);
    const refreshBtn = document.getElementById(`v14AnalysisRefreshBtn_${idx}`);

    if (!refreshBtn) return;

    // 중복 바인딩을 방지하기 위해 이벤트를 새로 주입합니다.
    refreshBtn.onclick = function(event) {
        if (event && event.preventDefault) event.preventDefault();
        
        window.processGrowthStats(idx);
        window.renderOmniAvatar(idx);
        window.renderOmniGrowthChart(idx);
        
        console.log(`[관제 기어] 캐릭터 슬롯 ${idx}번 다차원 그래프 동기화 완수.`);
    };
};

/**
 * 💡 [초보자 가이드] 아바타 프로필 플레이트 및 2x2 사각 그리드 보드를 마운팅 빌드합니다.
 */
window.renderAnalysisPage = function() {
    const container = document.getElementById('hunt-analysis');
    if (!container) return;

    const currentTabIdx = parseInt(window.currentIdx) || 1;

    container.innerHTML = `
        <div class="v14-plate-card-wrapper">
            <div class="v14-plate-header v14-analysis-top-flex">
                <div class="v14-analysis-title-text">📊 누적 다차원 성장분석 리포트</div>
                <button type="button" id="v14AnalysisRefreshBtn_${currentTabIdx}" class="v14-analysis-sync-btn">🔄 지표 실시간 동기화</button>
            </div>
            
            <div class="v14-analysis-profile-flex">
                <div class="v14-analysis-avatar-frame">
                    <img id="v14AnalysisAvatar_${currentTabIdx}" src="" alt="Character Avatar" class="v14-analysis-avatar-img" />
                </div>
                
                <div class="v14-analysis-meta-details-box">
                    <div id="v14AnalysisCharName_${currentTabIdx}" class="v14-analysis-text-name">캐릭터명 로딩 중</div>
                    <span id="v14AnalysisCharJob_${currentTabIdx}" class="v14-analysis-badge-job">직업군</span>
                    <div id="v14AnalysisCharSub_${currentTabIdx}" class="v14-analysis-text-sub">레벨 및 서버 연동 스캔</div>
                </div>
                
                <div class="v14-analysis-metrics-summary-grid">
                    <div class="v14-metrics-bento-item">💰 누적 순메소 수입<b id="v14_total_meso_${currentTabIdx}" class="v14-analysis-b-meso">0 메소</b></div>
                    <div class="v14-metrics-bento-item">📈 누적 획득 경험치<b id="v14_total_exp_${currentTabIdx}" class="v14-analysis-b-exp">0.000%</b></div>
                    <div class="v14-metrics-bento-item">🔮 누적 코어 젬스톤<b id="v14_total_gem_${currentTabIdx}" class="v14-analysis-b-gem">0 개</b></div>
                    <div class="v14-metrics-bento-item">✨ 누적 에르다 조각<b id="v14_total_frag_${currentTabIdx}" class="v14-analysis-b-frag">0 개</b></div>
                </div>
            </div>

            <div class="omni-analysis-pro-grid">
                <div class="analysis-metric-card-plate">
                    <div class="v14-chart-inner-title">💰 일별 순메소 획득 수입 추이 (Meso Flow)</div>
                    <div class="chart-canvas-container-box">
                        <canvas id="omniMesoChart_${currentTabIdx}"></canvas>
                    </div>
                </div>

                <div class="analysis-metric-card-plate">
                    <div class="v14-chart-inner-title">📈 일별 사냥 경험치 가속 추이 (EXP Growth)</div>
                    <div class="chart-canvas-container-box">
                        <canvas id="omniExpChart_${currentTabIdx}"></canvas>
                    </div>
                </div>

                <div class="analysis-metric-card-plate">
                    <div class="v14-chart-inner-title">🔮 일별 코어 젬스톤 파밍 수확량 (Gemstones)</div>
                    <div class="chart-canvas-container-box">
                        <canvas id="omniGemChart_${currentTabIdx}"></canvas>
                    </div>
                </div>

                <div class="analysis-metric-card-plate">
                    <div class="v14-chart-inner-title">✨ 일별 에르다 조각 드롭 컴파일 (Erda Fragments)</div>
                    <div class="chart-canvas-container-box">
                        <canvas id="omniFragChart_${currentTabIdx}"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 서브 엔진 시퀀스 가동
    window.processGrowthStats(currentTabIdx);
    window.renderOmniAvatar(currentTabIdx);
    window.renderOmniGrowthChart(currentTabIdx);
    window.initAnalysisLayoutListeners(currentTabIdx);
};

// DOM 로드 완료 시 컨테이너 존재 유무 판별 후 렌더링 결착
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('hunt-analysis')) {
        window.renderAnalysisPage();
    }
});