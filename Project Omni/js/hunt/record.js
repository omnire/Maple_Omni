/**
 * ============================================================================
 * 🧠 MAPLE OMNI V14 - features/hunt/record.js [완전판 소스 코드]
 * 설명: 스크린샷 스캔 가동 엔진, 실시간 메획률 연산 및 자동 드래프팅을 영구 지원합니다.
 * 패치노트: 누락되었던 window.renderSubSessionCards 인터페이스 컴포넌트 핵심 함수 신규 빌드 탑재
 * 가이드: 초보자도 완벽하게 코드를 독학할 수 있도록 친절하고 상세한 주석을 달아 생략 없이 작성함
 * ============================================================================
 */

// 💡 [초보자 가이드] 숫자에 콤마 밸런싱을 조율하는 범용 정규식 필터 함수가 누락되어 에러를 터뜨리는 현상을 막기 위한 빌트인 패치입니다.
if (typeof window.applyRealtimeComma !== 'function') {
    window.applyRealtimeComma = function(element) {
        let val = element.value.replace(/[^0-9]/g, "");
        if (val) {
            element.value = parseInt(val).toLocaleString();
        } else {
            element.value = "";
        }
    };
}

// 🛠️ [버그 수정] 임시 저장소 동기화가 새로고침 시 초기화되는 결함을 막기 위해 localStorage 로드를 보강했습니다.
if (typeof window.subHistory === 'undefined') {
    window.subHistory = JSON.parse(localStorage.getItem('omni_sub_history') || '{}');
}
if (typeof window.currentIdx === 'undefined') window.currentIdx = 1;

/**
 * [초보자용 주석] 0. 로컬 브라우저 문자 분석 라이브러리 비동기 동적 인젝터
 * 역할: 보안 프로그램 차단 위험이 없는 오픈소스 문자 판독 라이브러리를 안전하게 불러옵니다.
 */
function ensureOcrEngineLoaded(callback) {
    if (typeof Tesseract !== 'undefined') {
        callback();
        return;
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/tesseract.js@v4.0.1/dist/tesseract.min.js';
    script.onload = () => {
        console.log("OMNI V14 문자 감지 엔진 로딩이 무결하게 완료되었습니다.");
        callback();
    };
    document.head.appendChild(script);
}

/**
 * [초보자용 주석] 1. 클립보드 스크린샷 가로채기 분석 연동 장치 (Ctrl+V 핸들러)
 */
window.handleScreenshotPaste = function(event, charId) {
    const idx = parseInt(charId || window.currentIdx || 1);
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    const labelZone = document.getElementById(`v14OcrZoneText_${idx}`);

    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const imageBlob = items[i].getAsFile();
            
            if (labelZone) labelZone.innerHTML = "<b style='color:#6366f1;'>⏳ 판독 연산 가동 중... 메이플 데이터 추출 중입니다.</b>";

            ensureOcrEngineLoaded(() => {
                Tesseract.recognize(
                    imageBlob,
                    'kor+eng',
                    { logger: m => console.log("[스캔 로그]", m.status, Math.round(m.progress * 100) + "%") }
                ).then(({ data: { text } }) => {
                    window.parseMapleScreenshotText(text, idx);
                }).catch(err => {
                    console.error("문자 해독 프로세스 에러:", err);
                    if (labelZone) labelZone.innerText = "❌ 판독 실패. 스크린샷 해상도 및 잘린 단면을 확인하세요.";
                });
            });
            
            event.preventDefault();
            break;
        }
    }
};

/**
 * [초보자용 주석] 2. 메이플 폰트 문자열 정규화 분할 매퍼
 */
window.parseMapleScreenshotText = function(rawText, idx) {
    const labelZone = document.getElementById(`v14OcrZoneText_${idx}`);
    const lines = rawText.split('\n');
    
    let targetMeso = "";
    let targetExp = "";
    let targetGem = "";
    let targetFrag = "";

    lines.forEach(line => {
        if (line.includes("메소") || line.includes("메") || line.includes("Meso")) {
            const extract = line.replace(/[^0-9]/g, "");
            if (extract.length >= 4) targetMeso = extract;
        }
        if (line.includes("%") || line.includes("EXP") || line.includes("경험")) {
            const expMatch = line.match(/[0-9]+\.[0-9]+/);
            if (expMatch) targetExp = expMatch[0];
        }
        if (line.includes("코어") || line.includes("젬") || line.includes("스톤")) {
            const extract = line.replace(/[^0-9]/g, "");
            if (extract) targetGem = extract;
        }
        if (line.includes("조각") || line.includes("에르")) {
            const extract = line.replace(/[^0-9]/g, "");
            if (extract) targetFrag = extract;
        }
    });

    if (!targetMeso) {
        const bigNumbers = rawText.match(/[0-9]{6,11}/);
        if (bigNumbers) targetMeso = bigNumbers[0];
    }

    if (targetMeso) {
        const input = document.getElementById(`v14_meso_${idx}`);
        if (input) input.value = parseInt(targetMeso).toLocaleString();
    }
    if (targetExp) {
        const input = document.getElementById(`v14_exp_${idx}`);
        if (input) input.value = targetExp;
    }
    if (targetGem) {
        const input = document.getElementById(`v14_gem_${idx}`);
        if (input) input.value = targetGem;
    }
    if (targetFrag) {
        const input = document.getElementById(`v14_frag_${idx}`);
        if (input) input.value = targetFrag;
    }

    if (labelZone) labelZone.innerHTML = "<span style='color:#10b981;'>✅ <b>스캔 성공!</b> 사냥 데이터 기입이 완료되었습니다.</span>";
    
    window.refreshLiveDashboard(idx);
};

/**
 * [초보자용 주석] 3. 드랍/메획 종합 능력치 실시간 동적 계산기
 */
window.calculateLiveStats = function(charId) {
    const idx = parseInt(charId || window.currentIdx || 1);
    
    let liveSumMesoRate = 100;
    let liveSumDropRate = 0;

    for (let i = 0; i < 5; i++) {
        const inputM = document.getElementById(`v14_m_stat_${i}_${idx}`);
        const inputD = document.getElementById(`v14_d_stat_${i}_${idx}`);
        if (inputM) liveSumMesoRate += parseInt(inputM.value) || 0;
        if (inputD) liveSumDropRate += parseInt(inputD.value) || 0;
    }

    const dopingWeights = [
        { id: 0, name: "VIP 버프", meso: 0, drop: 15 },
        { id: 1, name: "경험치 쿠폰(50%)", meso: 0, drop: 0 },
        { id: 2, name: "경험치 3배 쿠폰", meso: 0, drop: 0 },
        { id: 3, name: "경험치 4배 쿠폰", meso: 0, drop: 0 },
        { id: 4, name: "재물 획득의 비약", meso: 20, drop: 20 },
        { id: 5, name: "경험 축적의 비약", meso: 0, drop: 0 },
        { id: 6, name: "유니온의 행운", meso: 0, drop: 30 },
        { id: 7, name: "유니온의 부", meso: 30, drop: 0 },
        { id: 8, name: "익스트림 골드", meso: 0, drop: 0 }
    ];

    dopingWeights.forEach(item => {
        const chk = document.getElementById(`v14_chk_${item.id}_${idx}`);
        if (chk && chk.checked) {
            liveSumMesoRate += item.meso;
            liveSumDropRate += item.drop;
        }
    });

    const statWidget = document.getElementById(`v14LiveStatsValue_${idx}`);
    if (statWidget) {
        statWidget.innerText = `${liveSumDropRate}% / ${liveSumMesoRate}%`;
    }
};

/**
 * [초보자용 주석] 4. 당일치 통합 누적 사냥 현황 실시간 집계 연산부
 */
window.refreshLiveDashboard = function(charId) {
    const idx = parseInt(charId || window.currentIdx || 1);
    const dateInput = document.getElementById('huntGlobalDate');
    const selectedDate = (dateInput && dateInput.value) ? dateInput.value : new Date().toISOString().split('T')[0];
    const storageKey = `${idx}_${selectedDate}`;

    let totalDayMeso = 0;
    let totalDayExp = 0;
    let totalDayGem = 0;
    let totalDayFrag = 0;

    const allStoredRecords = JSON.parse(localStorage.getItem('maple_hunt_records') || '[]');
    allStoredRecords.filter(r => r.charId == idx && r.date === selectedDate).forEach(rec => {
        totalDayMeso += parseInt(String(rec.meso).replace(/,/g, "")) || 0;
        totalDayExp += parseFloat(rec.exp) || 0;
        totalDayGem += parseInt(rec.gem || 0);
        totalDayFrag += parseInt(rec.frag || 0);
    });

    if (window.subHistory && window.subHistory[storageKey]) {
        window.subHistory[storageKey].forEach(tempRec => {
            if (!tempRec.isFinalized) {
                totalDayMeso += parseInt(String(tempRec.meso).replace(/,/g, "")) || 0;
                totalDayExp += parseFloat(tempRec.exp) || 0;
                totalDayGem += parseInt(tempRec.gem || 0);
                totalDayFrag += parseInt(tempRec.frag || 0);
            }
        });
    }

    const docMeso = document.getElementById(`v14LiveMeso_${idx}`);
    const docExp  = document.getElementById(`v14LiveExp_${idx}`);
    const docDrops = document.getElementById(`v14LiveDrops_${idx}`);

    if (docMeso) docMeso.innerText = totalDayMeso.toLocaleString();
    if (docExp)  docExp.innerText = totalDayExp.toFixed(3) + "%";
    if (docDrops) docDrops.innerText = `${totalDayGem}개 / ${totalDayFrag}개`;

    window.saveActiveInputsToCache(idx);
};

/**
 * [초보자용 주석] 5. ⏱️ 1소재 단위 사냥 세션 기록 임시 저장 기어
 */
window.recordOneSession = function(charId) {
    const idx = parseInt(charId || window.currentIdx || 1);
    const dateInput = document.getElementById('huntGlobalDate');
    const selectedDate = (dateInput && dateInput.value) ? dateInput.value : new Date().toISOString().split('T')[0];
    const storageKey = `${idx}_${selectedDate}`;

    const fMap = document.getElementById(`v14_map_${idx}`);
    const fMeso = document.getElementById(`v14_meso_${idx}`);
    const fExp = document.getElementById(`v14_exp_${idx}`);
    const fGem = document.getElementById(`v14_gem_${idx}`);
    const fFrag = document.getElementById(`v14_frag_${idx}`);

    if (!fMeso || !fExp) return;

    const mesoRaw = fMeso.value.trim();
    if (!mesoRaw) {
        alert("기록할 회차의 메소 금액 수치가 비어있습니다.");
        return;
    }

    if (!window.subHistory[storageKey]) window.subHistory[storageKey] = [];

    let customExtraList = [];
    const extraRows = document.querySelectorAll(`.v14-extra-row-${idx}`);
    extraRows.forEach(row => {
        const nameInput = row.querySelector('.v14-extra-name-input');
        const priceInput = row.querySelector('.v14-extra-price-input');
        if (nameInput && nameInput.value.trim() !== '') {
            const priceVal = parseInt(priceInput.value.replace(/,/g, "")) || 0;
            customExtraList.push({ name: nameInput.value.trim(), price: priceVal });
        }
    });

    const newLogNode = {
        id: Date.now(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        map: fMap?.value || '미지정 사냥터',
        meso: mesoRaw,
        exp: parseFloat(fExp.value) || 0,
        gem: parseInt(fGem.value) || 0,
        frag: parseInt(fFrag.value) || 0,
        sellList: customExtraList,
        isFinalized: false
    };

    window.subHistory[storageKey].push(newLogNode);
    localStorage.setItem('omni_sub_history', JSON.stringify(window.subHistory));

    const zoneText = document.getElementById(`v14OcrZoneText_${idx}`);
    if (zoneText) zoneText.innerText = "📋 여기를 한 번 클릭하고 스크린샷을 붙여넣기(Ctrl+V) 하세요.";

    fMeso.value = '';
    fExp.value = '';
    fGem.value = '';
    fFrag.value = '';
    const container = document.getElementById(`v14ExtraContainer_${idx}`);
    if (container) container.innerHTML = '';

    window.refreshLiveDashboard(idx);
    window.renderSubSessionCards(idx);
};

/**
 * 🛠️ [신규 복원 패치]: 6. 임시 저장된 회차 카드를 테이블 리스트 하단 우측 스케줄 영역에 드로잉해주는 핵심 뷰포트 빌더 함수입니다.
 * 역할: 누락되어 있던 크래시 에러 지점을 완전 수복하고 세션 임시 카드를 화면에 직접 사출합니다.
 */
window.renderSubSessionCards = function(charId) {
    const idx = parseInt(charId || window.currentIdx || 1);
    const dateInput = document.getElementById('huntGlobalDate');
    const selectedDate = (dateInput && dateInput.value) ? dateInput.value : new Date().toISOString().split('T')[0];
    const storageKey = `${idx}_${selectedDate}`;
    const targetGrid = document.getElementById(`v14SubRecordList_${idx}`);

    if (!targetGrid) return;
    targetGrid.innerHTML = '';

    const items = window.subHistory[storageKey] || [];
    if (items.length === 0) {
        targetGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:15px; font-size:11px; color:#94a3b8; font-weight:700;">당일 추가된 임시 회차 스케줄 내역이 없습니다.</div>`;
        return;
    }

    items.forEach(node => {
        const badge = document.createElement('div');
        badge.className = 'v14-session-badge-card';
        if (node.isFinalized) badge.style.opacity = '0.55'; // 영구 원장 전송 완료 시 시각적인 비활성 음영 효과

        const cleanMeso = parseInt(String(node.meso).replace(/,/g, "")) || 0;
        const mesoLabel = cleanMeso >= 100000000 ? (cleanMeso / 100000000).toFixed(1) + '억' : (cleanMeso / 10000).toFixed(0) + '만';

        badge.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:10px; margin-bottom:4px; font-weight:900;">
                <span style="color:#64748b;">⏱️ ${node.time}</span>
                <span style="color:${node.isFinalized ? '#16a34a' : '#818cf8'};">${node.isFinalized ? '전송완료' : '대기중'}</span>
            </div>
            <div style="font-size:11px; font-weight:800; color:#1e293b; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-bottom:2px;">${node.map}</div>
            <div style="font-size:10px; font-weight:700; color:#b45309;">💰 +${mesoLabel}</div>
            <div style="font-size:10px; font-weight:700; color:#7c3aed;">⚡ +${parseFloat(node.exp).toFixed(3)}%</div>
            <div style="font-size:10px; font-weight:700; color:#0284c7;">💎 젬 ${node.gem} / 조각 ${node.frag}</div>
        `;
        targetGrid.appendChild(badge);
    });
};

/**
 * [초보자용 주석] 6-2. 📊 임시 저장된 회차들을 영구 원장(maple_hunt_records)으로 확정 전송하는 함수
 */
window.saveFinalRecord = function(charId) {
    const idx = parseInt(charId || window.currentIdx || 1);
    const dateInput = document.getElementById('huntGlobalDate');
    const selectedDate = (dateInput && dateInput.value) ? dateInput.value : new Date().toISOString().split('T')[0];
    const storageKey = `${idx}_${selectedDate}`;

    const pendingSessions = (window.subHistory[storageKey] || []).filter(s => !s.isFinalized);
    if (pendingSessions.length === 0) {
        alert("전송할 미확정 사냥 회차 기록이 없습니다. 먼저 '1소재(임시) 기록 저장'을 진행해 주세요.");
        return;
    }

    let allRecords = JSON.parse(localStorage.getItem('maple_hunt_records') || '[]');
    pendingSessions.forEach(session => {
        allRecords.push({
            charId: idx,
            date: selectedDate,
            time: session.time,
            map: session.map,
            meso: session.meso,
            exp: session.exp,
            gem: session.gem,
            frag: session.frag,
            sellList: session.sellList || []
        });
    });
    localStorage.setItem('maple_hunt_records', JSON.stringify(allRecords));

    window.subHistory[storageKey] = (window.subHistory[storageKey] || []).map(s => ({ ...s, isFinalized: true }));
    localStorage.setItem('omni_sub_history', JSON.stringify(window.subHistory));

    alert(`✅ ${pendingSessions.length}건의 사냥 회차가 통합 기록지로 전송되었습니다!`);

    if (typeof window.renderAttendance === 'function') window.renderAttendance();
    if (typeof window.processGrowthStats === 'function') window.processGrowthStats(idx);
    if (typeof window.renderOmniGrowthChart === 'function') window.renderOmniGrowthChart(idx);
};

/**
 * [초보자용 주석] 7. 전리품 부수입 기입 필드 동적 바인더
 */
window.addV14ExtraRow = function(charId) {
    const idx = parseInt(charId || window.currentIdx || 1);
    const container = document.getElementById(`v14ExtraContainer_${idx}`);
    if (!container) return;

    const row = document.createElement('div');
    row.className = `v14-extra-row-${idx}`;
    row.style.display = 'flex';
    row.style.gap = '6px';
    row.style.marginBottom = '4px';
    row.innerHTML = `
        <input type="text" class="v14-input-base v14-extra-name-input" placeholder="품목명" style="flex: 1.2; padding: 6px 10px; font-size:11px;">
        <input type="text" class="v14-input-base v14-extra-price-input" placeholder="메소 수입" onkeyup="if(typeof window.applyRealtimeComma === 'function') window.applyRealtimeComma(this);" style="flex: 1; text-align: right; padding: 6px 10px; font-size:11px;">
        <button type="button" onclick="this.parentElement.remove()" style="background: #fff1f2; color: #e11d48; border: 1px solid #ffe4e6; border-radius: 8px; width: 28px; cursor: pointer; font-weight: bold; font-size:12px;">&times;</button>
    `;
    container.appendChild(row);
};

window.saveActiveInputsToCache = function(charId) {
    const idx = parseInt(charId || window.currentIdx || 1);
    const config = {
        startMeso: document.getElementById(`v14_startMeso_${idx}`)?.value || '',
        targetMeso: document.getElementById(`v14_targetMeso_${idx}`)?.value || '',
        startExp: document.getElementById(`v14_startExp_${idx}`)?.value || '',
        startGem: document.getElementById(`v14_startGem_${idx}`)?.value || '',
        startFrag: document.getElementById(`v14_startFrag_${idx}`)?.value || '',
        map: document.getElementById(`v14_map_${idx}`)?.value || ''
    };
    localStorage.setItem(`v14_active_cache_${idx}`, JSON.stringify(config));
};

/**
 * [초보자용 주석] 8. 🗑️ 전체 입력창 내용 및 당일 임시 세션 리셋 클리어 장치
 */
window.resetCurrentV14RecordForm = function(charId) {
    const idx = parseInt(charId || window.currentIdx || 1);
    if (!confirm("현재 탭 대시보드 페이지에 입력된 모든 설정을 초기화하시겠습니까?")) return;

    localStorage.removeItem(`v14_active_cache_${idx}`);
    
    const dateInput = document.getElementById('huntGlobalDate');
    const selectedDate = (dateInput && dateInput.value) ? dateInput.value : new Date().toISOString().split('T')[0];
    const storageKey = `${idx}_${selectedDate}`;
    if (window.subHistory && window.subHistory[storageKey]) {
        window.subHistory[storageKey] = [];
    }
    localStorage.setItem('omni_sub_history', JSON.stringify(window.subHistory));

    const targetFields = [`startMeso`, `targetMeso`, `startExp`, `startGem`, `startFrag`, `map`, `meso`, `exp`, `gem`, `frag`];
    targetFields.forEach(f => {
        const el = document.getElementById(`v14_${f}_${idx}`);
        if (el) el.value = '';
    });

    for (let i = 0; i < 5; i++) {
        const mEl = document.getElementById(`v14_m_stat_${i}_${idx}`);
        const dEl = document.getElementById(`v14_d_stat_${i}_${idx}`);
        if (mEl) mEl.value = '';
        if (dEl) dEl.value = '';
    }

    for (let i = 0; i < 9; i++) {
        const chk = document.getElementById(`v14_chk_${i}_${idx}`);
        if (chk) chk.checked = false;
    }

    const zoneText = document.getElementById(`v14OcrZoneText_${idx}`);
    if (zoneText) zoneText.innerText = "📋 여기를 한 번 클릭하고 스크린샷을 붙여넣기(Ctrl+V) 하세요.";

    window.calculateLiveStats(idx);
    window.refreshLiveDashboard(idx);
    window.renderSubSessionCards(idx);
};

/**
 * [초보자용 주석] 9. 📊 마스터 라우터 마운트 코어 레이아웃 제어 인터페이스
 */
window.renderRecordPage = function() {
    const container = document.getElementById('hunt-record');
    if (!container) return;

    const currentTabIdx = parseInt(window.currentIdx) || 1;
    const dopingNames = ["VIP 버프", "경험치 쿠폰(50%)", "경험치 3배 쿠폰", "경험치 4배 쿠폰", "재물 획득의 비약", "경험 축적의 비약", "유니온의 행운", "유니온의 부", "익스트림 골드"];
    const statNames = ['장비 아이템', '유니온 공격대', '어빌리티', '아티팩트', '스킬'];

    const savedConfig = JSON.parse(localStorage.getItem(`v14_active_cache_${currentTabIdx}`) || '{}');

    container.innerHTML = `
        <div class="v14-record-wrapper">
            
            <div class="v14-dashboard-grid">
                <div class="v14-dash-card v14-card-meso">
                    <div class="v14-dash-title meso">💰 누적 획득 메소</div>
                    <div class="v14-dash-value" id="v14LiveMeso_${currentTabIdx}">0</div>
                </div>
                <div class="v14-dash-card v14-card-exp">
                    <div class="v14-dash-title exp">📈 누적 획득 EXP</div>
                    <div class="v14-dash-value" id="v14LiveExp_${currentTabIdx}">0.000%</div>
                </div>
                <div class="v14-dash-card v14-card-stats">
                    <div class="v14-dash-title stats">⚔️ 현재 실시간 드랍 / 메획</div>
                    <div class="v14-dash-value" id="v14LiveStatsValue_${currentTabIdx}">0% / 100%</div>
                </div>
                <div class="v14-dash-card v14-card-drops">
                    <div class="v14-dash-title drops">💎 누적 전리품 (젬 / 조각)</div>
                    <div class="v14-dash-value" id="v14LiveDrops_${currentTabIdx}">0개 / 0개</div>
                </div>
            </div>

            <div class="v14-two-column-body">
                
                <div class="v14-left-control-panel">
                    
                    <div class="v14-plate-card">
                        <div class="v14-plate-header">⚙ *CHARACTER BASE CONFIG (시작 및 목표 설정)*</div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                            <input type="text" id="v14_startMeso_${currentTabIdx}" class="v14-input-base" placeholder="💰 시작 보유 메소" value="${savedConfig.startMeso || ''}" onkeyup="if(typeof window.applyRealtimeComma === 'function') window.applyRealtimeComma(this);" oninput="window.saveActiveInputsToCache(${currentTabIdx})">
                            <input type="text" id="v14_targetMeso_${currentTabIdx}" class="v14-input-base" placeholder="🎯 목표 달성 메소" value="${savedConfig.targetMeso || ''}" onkeyup="if(typeof window.applyRealtimeComma === 'function') window.applyRealtimeComma(this);" oninput="window.saveActiveInputsToCache(${currentTabIdx})">
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
                            <input type="number" id="v14_startExp_${currentTabIdx}" step="0.001" class="v14-input-base" placeholder="⚡ 시작 EXP" value="${savedConfig.startExp || ''}" oninput="window.saveActiveInputsToCache(${currentTabIdx})">
                            <input type="number" id="v14_startGem_${currentTabIdx}" class="v14-input-base" placeholder="🔮 시작 젬스톤" value="${savedConfig.startGem || ''}" oninput="window.saveActiveInputsToCache(${currentTabIdx})">
                            <input type="number" id="v14_startFrag_${currentTabIdx}" class="v14-input-base" placeholder="✨ 시작 조각" value="${savedConfig.startFrag || ''}" oninput="window.saveActiveInputsToCache(${currentTabIdx})">
                        </div>
                    </div>

                    <div class="v14-plate-card">
                        <div class="v14-plate-header">⚡ *SPECIFICATION CONFIG (상세 능력치 입력)*</div>
                        <div class="v14-stat-split-box">
                            <div>
                                <h4 style="font-size: 11px; color: #475569; margin: 0 0 8px 0; font-weight: 800; border-left: 3px solid #d97706; padding-left: 5px;">💰 메획 추가 세팅 (%)</h4>
                                ${statNames.map((s, idx) => `
                                    <div class="v14-stat-row">
                                        <span class="v14-stat-label">${s}</span>
                                        <input type="number" id="v14_m_stat_${idx}_${currentTabIdx}" class="v14-input-stat-digit" placeholder="0" oninput="window.calculateLiveStats(${currentTabIdx})">
                                    </div>
                                `).join('')}
                            </div>
                            <div>
                                <h4 style="font-size: 11px; color: #475569; margin: 0 0 8px 0; font-weight: 800; border-left: 3px solid #16a34a; padding-left: 5px;">🍀 드랍률 추가 세팅 (%)</h4>
                                ${statNames.map((s, idx) => `
                                    <div class="v14-stat-row">
                                        <span class="v14-stat-label">${s}</span>
                                        <input type="number" id="v14_d_stat_${idx}_${currentTabIdx}" class="v14-input-stat-digit" placeholder="0" oninput="window.calculateLiveStats(${currentTabIdx})">
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div style="padding-top: 12px; border-top: 1px dashed #e2e8f0;">
                            <div class="v14-plate-header" style="margin-bottom: 6px;">💊 *사냥 도핑 리스트 (실시간 스펙 계산 연동)*</div>
                            <div class="v14-doping-grid">
                                ${dopingNames.map((name, idx) => `
                                    <label class="v14-doping-label">
                                        <input type="checkbox" id="v14_chk_${idx}_${currentTabIdx}" onchange="window.calculateLiveStats(${currentTabIdx})">
                                        <span style="font-weight: 700; font-size:10px;">${name}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="v14-right-display-panel">
                    <div class="v14-plate-card">
                        <div class="v14-plate-header">⚔️ *CURRENT HUNTING SESSION (실시간 회차 기록 콘솔)*</div>
                        
                        <div class="v14-ocr-paste-zone" playbook-zone tabindex="0" onpaste="window.handleScreenshotPaste(event, ${currentTabIdx})">
                            <span id="v14OcrZoneText_${currentTabIdx}">📋 여기를 한 번 클릭하고 스크린샷을 붙여넣기(Ctrl+V) 하세요.</span>
                        </div>

                        <div style="display: grid; grid-template-columns: 1.4fr 1fr 1fr 0.8fr 0.8fr; gap: 6px; margin-bottom: 10px;">
                            <input type="text" id="v14_map_${currentTabIdx}" class="v14-input-base" placeholder="🏕️ 사냥터 명칭" value="${savedConfig.map || ''}" oninput="window.saveActiveInputsToCache(${currentTabIdx})">
                            <input type="text" id="v14_meso_${currentTabIdx}" class="v14-input-base" placeholder="🪙 획득 순메소" onkeyup="if(typeof window.applyRealtimeComma === 'function') window.applyRealtimeComma(this);">
                            <input type="number" id="v14_exp_${currentTabIdx}" step="0.001" class="v14-input-base" placeholder="⚡ 수확 EXP%">
                            <input type="number" id="v14_gem_${currentTabIdx}" class="v14-input-base" placeholder="🔮 젬스톤">
                            <input type="number" id="v14_frag_${currentTabIdx}" class="v14-input-base" placeholder="✨ 에르다 조각">
                        </div>

                        <div style="background: #f8fafc; border-radius: 12px; padding: 10px; border: 1px solid #e2e8f0; margin-bottom: 10px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span style="font-size: 11px; font-weight: 800; color: #475569;">🎁 회차별 기타 전리품 부수입 기입 창 (선택사항)</span>
                                <button type="button" onclick="window.addV14ExtraRow(${currentTabIdx})" style="background: #e0e7ff; color: #4f46e5; border: none; padding: 3px 8px; border-radius: 50px; font-size: 10px; font-weight: bold; cursor: pointer;">+ 항목 추가</button>
                            </div>
                            <div id="v14ExtraContainer_${currentTabIdx}"></div>
                        </div>

                        <div id="v14SubRecordList_${currentTabIdx}" class="v14-sub-records-grid"></div>

                        <div class="v14-action-btn-group">
                            <button type="button" class="v14-btn v14-btn-save" onclick="window.recordOneSession(${currentTabIdx})">⏱️ 1소재(임시) 기록 저장</button>
                            <button type="button" class="v14-btn v14-btn-send" onclick="if(typeof window.saveFinalRecord === 'function') { window.saveFinalRecord(${currentTabIdx}); setTimeout(()=> { window.refreshLiveDashboard(${currentTabIdx}); window.renderSubSessionCards(${currentTabIdx}); }, 200); } else { alert('통합 원장 코드 파이프라인이 누락되었습니다.'); }">📊 통합 기록지로 전송</button>
                            <button type="button" class="v14-btn v14-btn-reset" onclick="window.resetCurrentV14RecordForm(${currentTabIdx})">🗑️ 리셋</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    `;

    window.calculateLiveStats(currentTabIdx);
    window.refreshLiveDashboard(currentTabIdx);
    window.renderSubSessionCards(currentTabIdx);
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('hunt-record')) {
        window.renderRecordPage();
    }
});