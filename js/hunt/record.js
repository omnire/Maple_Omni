/**
 * ============================================================================
 * 🧠 MAPLE OMNI V14 - js/hunt/record.js [디자인 무결점 가독성 에디션]
 * 설명: 스크린샷 문자판독(OCR) 엔진, 실시간 스펙 계산 및 자동 정산 프로세서입니다.
 * [패치 반영] 
 *   - 투명도(Opacity) 제어 버그를 완벽히 격리 삭제하여 빈 화면(먹통 현상)을 원천 차단했습니다.
 *   - 홈페이지를 새로 키면 무조건 이 파일 내부의 자동 렌더링 기능을 차단하고 인트로 화면이 나오게 강제 제어합니다.
 *   - 이전에 로그인했던 API Key 문자열을 완벽하게 읽어내어 인트로 인풋 상자에 자동 바인딩 해줍니다.
 * 가이드: 초보자도 완벽하게 코드를 독학할 수 있도록 친절하고 상세한 주석을 달아 생략 없이 작성함
 * ============================================================================
 */

// 💡 [초보자 가이드] 숫자에 실시간 콤마를 찍어 회계 장부 가독성을 높이는 필터입니다.
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

// 브라우저 세션 영구 저장용 앵커 정렬 수립
if (typeof window.subHistory === 'undefined') {
    window.subHistory = JSON.parse(localStorage.getItem('omni_sub_history') || '{}');
}
if (typeof window.currentIdx === 'undefined') window.currentIdx = 1;

/**
 * [초보자용 주석] 0. OCR 문자해독 엔진 비동기 런타임 스크립트 온디맨드 로더
 */
function ensureOcrEngineLoaded(callback) {
    if (typeof Tesseract !== 'undefined') {
        callback();
        return;
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/tesseract.js@v4.0.1/dist/tesseract.min.js';
    script.onload = () => {
        console.log("OMNI V14 OCR 분석 커널이 정상 안착되었습니다.");
        callback();
    };
    document.head.appendChild(script);
}

/**
 * [초보자용 주석] 1. 클립보드 이미지 복사 붙여넣기 감지 리스너 (Ctrl+V)
 */
window.handleScreenshotPaste = function(event, charId) {
    const idx = parseInt(charId || window.currentIdx || 1);
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    const labelZone = document.getElementById(`v14OcrZoneText_${idx}`);

    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const imageBlob = items[i].getAsFile();
            if (labelZone) labelZone.innerHTML = "<b style='color:var(--hunt-primary);'>⏳ 이미지 문자 데이터 정렬 감지 중...</b>";

            ensureOcrEngineLoaded(() => {
                Tesseract.recognize(
                    imageBlob,
                    'kor+eng',
                    { logger: m => console.log("[스캔 로그]", m.status, Math.round(m.progress * 100) + "%") }
                ).then(({ data: { text } }) => {
                    window.parseMapleScreenshotText(text, idx);
                }).catch(err => {
                    console.error("문자 인지 실패 에러:", err);
                    if (labelZone) labelZone.innerText = "❌ 판독 오류. 단면 잘림 상태를 확인하세요.";
                });
            });
            event.preventDefault();
            break;
        }
    }
};

/**
 * [초보자용 주석] 2. 스크린샷 텍스트 룰러 기반 분할 추출기
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

    if (labelZone) labelZone.innerHTML = "<span style='color:var(--hunt-primary);'>✅ <b>문자 자동 대입 성공!</b></span>";
    window.refreshLiveDashboard(idx);
};

/**
 * [초보자용 주석] 3. 실시간 드랍률 / 메획률 연산부 
 */
window.calculateLiveStats = function(charId) {
    const idx = parseInt(charId || window.currentIdx || 1);
    
    let addedMesoRate = 0; 
    let addedDropRate = 0;

    for (let i = 0; i < 5; i++) {
        const inputM = document.getElementById(`v14_m_stat_${i}_${idx}`);
        const inputD = document.getElementById(`v14_d_stat_${i}_${idx}`);
        if (inputM) addedMesoRate += parseInt(inputM.value) || 0;
        if (inputD) addedDropRate += parseInt(inputD.value) || 0;
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
            addedMesoRate += item.meso;
            addedDropRate += item.drop;
        }
    });

    const statWidget = document.getElementById(`v14LiveStatsValue_${idx}`);
    if (statWidget) {
        statWidget.innerText = `${addedDropRate}% / ${addedMesoRate}%`;
    }

    window.executePureEngineCalculations(idx);
};

/**
 * [초보자용 주석] 4. 당일치 누적 통계치 동적 리컴파일 마운트
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
    window.executePureEngineCalculations(idx);
};

/**
 * 💎 PURE AUDIT STATEMENT ENGINE (역산 공식 모듈)
 */
window.executePureEngineCalculations = function(idx) {
    const inputMesoEl = document.getElementById(`v14_meso_${idx}`);
    const inputExpEl = document.getElementById(`v14_exp_${idx}`);

    const rawMeso = inputMesoEl ? (parseInt(inputMesoEl.value.replace(/,/g, '')) || 0) : 0;
    const rawExp = inputExpEl ? (parseFloat(inputExpEl.value) || 0.0) : 0.0;

    let extraMesoSum = 0; 
    let extraExpSum = 0;  
    let hasMesoPotion = false;

    for (let i = 0; i < 5; i++) {
        const inputM = document.getElementById(`v14_m_stat_${i}_${idx}`);
        if (inputM) extraMesoSum += parseInt(inputM.value) || 0;
    }

    if (document.getElementById(`v14_chk_0_${idx}`)?.checked) extraExpSum += 15;
    if (document.getElementById(`v14_chk_1_${idx}`)?.checked) extraExpSum += 50;
    if (document.getElementById(`v14_chk_2_${idx}`)?.checked) extraExpSum += 200;
    if (document.getElementById(`v14_chk_3_${idx}`)?.checked) extraExpSum += 300;
    if (document.getElementById(`v14_chk_5_${idx}`)?.checked) extraExpSum += 10;
    if (document.getElementById(`v14_chk_8_${idx}`)?.checked) extraExpSum += 10;
    if (document.getElementById(`v14_chk_7_${idx}`)?.checked) extraMesoSum += 30;

    if (document.getElementById(`v14_chk_4_${idx}`)?.checked) {
        hasMesoPotion = true;
    }

    let baseMesoClear = rawMeso;
    if (hasMesoPotion) baseMesoClear = baseMesoClear / 1.2;
    
    const finalMesoRatio = (extraMesoSum + 100) / 100; 
    const pureOriginalMeso = finalMesoRatio > 0 ? Math.floor(baseMesoClear / finalMesoRatio) : 0;

    const finalExpRatio = (extraExpSum + 100) / 100;
    const pureOriginalExp = finalExpRatio > 0 ? (rawExp / finalExpRatio) : 0.0;

    const auditRawMeso = document.getElementById(`v14_audit_raw_meso_${idx}`);
    const auditMesoRate = document.getElementById(`v14_audit_meso_rate_${idx}`);
    const auditMesoPot = document.getElementById(`v14_audit_meso_pot_${idx}`);
    const auditRawExp = document.getElementById(`v14_audit_raw_exp_${idx}`);
    const auditExpRate = document.getElementById(`v14_audit_exp_rate_${idx}`);
    const auditExpAdd = document.getElementById(`v14_audit_exp_add_${idx}`);

    if (auditRawMeso) auditRawMeso.innerText = `${rawMeso.toLocaleString()} 획득`;
    if (auditMesoRate) auditMesoRate.innerText = `+${extraMesoSum}%`;
    if (auditMesoPot) auditMesoPot.innerText = hasMesoPotion ? "O (1.2배 복리)" : "X (1.0배)";
    if (auditRawExp) auditRawExp.innerText = `${rawExp.toFixed(3)}% 획득`;
    if (auditExpRate) auditExpRate.innerText = `+${extraExpSum}%`;
    if (auditExpAdd) auditExpAdd.innerText = `총 ${extraExpSum + 100}% 배율`;

    const pureMesoLbl = document.getElementById(`v14_pure_meso_statement_${idx}`);
    const pureExpLbl = document.getElementById(`v14_pure_exp_statement_${idx}`);
    if (pureMesoLbl) pureMesoLbl.innerText = `${pureOriginalMeso.toLocaleString()} Meso`;
    if (pureExpLbl) pureExpLbl.innerText = `${pureOriginalExp.toFixed(4)}%`;

    const targetMesoInput = document.getElementById(`v14_targetMeso_${idx}`);
    const cleanTargetMeso = targetMesoInput ? (parseInt(targetMesoInput.value.replace(/,/g, '')) || 0) : 0;
    
    const liveMesoEl = document.getElementById(`v14LiveMeso_${idx}`);
    const currentAccumMeso = liveMesoEl ? (parseInt(liveMesoEl.innerText.replace(/,/g, '')) || 0) : 0;

    let progressPercent = 0;
    if (cleanTargetMeso > 0) {
        progressPercent = Math.min(Math.round((currentAccumMeso / cleanTargetMeso) * 100), 100);
    }

    const fillBar = document.getElementById(`v14_gauge_fill_bar_${idx}`);
    const percentTxt = document.getElementById(`v14_gauge_percent_text_${idx}`);
    const subTxt = document.getElementById(`v14_gauge_sub_text_${idx}`);

    if (fillBar) fillBar.style.width = `${progressPercent}%`;
    if (percentTxt) percentTxt.innerText = `${progressPercent}%`;
    if (subTxt) subTxt.innerText = `누적 순익: ${currentAccumMeso.toLocaleString()} / 목표: ${cleanTargetMeso.toLocaleString()} Meso`;
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

    const finalMapName = (fMap && fMap.value.trim() !== "") ? fMap.value.trim() : "미지정 사냥터";

    const newLogNode = {
        id: Date.now(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        map: finalMapName,
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

window.deleteSubSession = function(charId, sessionId) {
    const idx = parseInt(charId);
    const dateInput = document.getElementById('huntGlobalDate');
    const selectedDate = (dateInput && dateInput.value) ? dateInput.value : new Date().toISOString().split('T')[0];
    const storageKey = `${idx}_${selectedDate}`;

    if (!window.subHistory[storageKey]) return;
    window.subHistory[storageKey] = window.subHistory[storageKey].filter(node => node.id !== sessionId);
    localStorage.setItem('omni_sub_history', JSON.stringify(window.subHistory));

    window.refreshLiveDashboard(idx);
    window.renderSubSessionCards(idx);
};

window.editSubSession = function(charId, sessionId) {
    const idx = parseInt(charId);
    const dateInput = document.getElementById('huntGlobalDate');
    const selectedDate = (dateInput && dateInput.value) ? dateInput.value : new Date().toISOString().split('T')[0];
    const storageKey = `${idx}_${selectedDate}`;

    if (!window.subHistory[storageKey]) return;
    const targetItem = window.subHistory[storageKey].find(node => node.id === sessionId);
    if (!targetItem) return;

    const fMap = document.getElementById(`v14_map_${idx}`);
    const fMeso = document.getElementById(`v14_meso_${idx}`);
    const fExp = document.getElementById(`v14_exp_${idx}`);
    const fGem = document.getElementById(`v14_gem_${idx}`);
    const fFrag = document.getElementById(`v14_frag_${idx}`);

    if (fMap) fMap.value = targetItem.map === "미지정 사냥터" ? "" : targetItem.map;
    if (fMeso) fMeso.value = targetItem.meso;
    if (fExp) fExp.value = targetItem.exp;
    if (fGem) fGem.value = targetItem.gem;
    if (fFrag) fFrag.value = targetItem.frag;

    window.subHistory[storageKey] = window.subHistory[storageKey].filter(node => node.id !== sessionId);
    localStorage.setItem('omni_sub_history', JSON.stringify(window.subHistory));

    window.refreshLiveDashboard(idx);
    window.renderSubSessionCards(idx);
    alert("📝 해당 회차 데이터가 상단 기입창으로 호출되었습니다. 수정 후 다시 저장버튼을 누르세요.");
};

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
        targetGrid.innerHTML = `<div class="v14-no-session-msg">당일 추가된 임시 회차 스케줄 내역이 없습니다.</div>`;
        return;
    }

    items.forEach(node => {
        const badge = document.createElement('div');
        badge.className = 'v14-session-badge-card';
        if (node.isFinalized) badge.style.opacity = '0.55';

        const cleanMeso = parseInt(String(node.meso).replace(/,/g, "")) || 0;
        const mesoLabel = cleanMeso >= 100000000 ? (cleanMeso / 100000000).toFixed(1) + '억' : (cleanMeso / 10000).toFixed(0) + '만';

        badge.innerHTML = `
            <div class="v14-badge-top-flex">
                <span class="v14-badge-time">⏱️ ${node.time}</span>
                <span class="v14-badge-status ${node.isFinalized ? 'done' : 'wait'}">${node.isFinalized ? '전송완료' : '대기중'}</span>
            </div>
            <div class="v14-badge-map-tag">📍 ${node.map}</div>
            <div class="v14-badge-metrics-box">
                <div class="v14-badge-value-row row-meso"><span>메소:</span> <span>+${mesoLabel}</span></div>
                <div class="v14-badge-value-row row-exp"><span>경험치:</span> <span>+${parseFloat(node.exp).toFixed(3)}%</span></div>
                <div class="v14-badge-value-row row-items"><span>전리품:</span> <span>💎${node.gem} / ✨${node.frag}</span></div>
            </div>
            ${!node.isFinalized ? `
                <div class="v14-badge-btn-row">
                    <button type="button" class="v14-badge-control-btn edit-trigger" onclick="window.editSubSession(${idx}, ${node.id})">수정</button>
                    <button type="button" class="v14-badge-control-btn delete-trigger" onclick="window.deleteSubSession(${idx}, ${node.id})">삭제</button>
                </div>
            ` : ''}
        `;
        targetGrid.appendChild(badge);
    });
};

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
    window.refreshLiveDashboard(idx);
    window.renderSubSessionCards(idx);
};

window.addV14ExtraRow = function(charId) {
    const idx = parseInt(charId || window.currentIdx || 1);
    const container = document.getElementById(`v14ExtraContainer_${idx}`);
    if (!container) return;

    const row = document.createElement('div');
    row.className = `v14-extra-row-${idx} v14-extra-input-row-flex`;
    row.innerHTML = `
        <input type="text" class="v14-input-base v14-extra-name-input" placeholder="품목명">
        <input type="text" class="v14-input-base v14-extra-price-input" placeholder="메소 수입" onkeyup="if(typeof window.applyRealtimeComma === 'function') window.applyRealtimeComma(this);">
        <button type="button" class="v14-extra-delete-btn" onclick="this.parentElement.remove()">&times;</button>
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

window.goBackToIntro = function() {
    if (!confirm("사냥 정산을 중단하고 인트로 메인 화면으로 복귀하시겠습니까?")) return;

    localStorage.setItem('omni_current_tab', 'intro');

    const huntContainer = document.getElementById('hunt-record');
    const introContainer = document.getElementById('intro-page') || document.getElementById('intro-container') || document.getElementById('main-intro');

    if (huntContainer) huntContainer.style.display = 'none';
    if (introContainer) introContainer.style.display = 'block';

    if (typeof window.renderIntroPage === 'function') {
        window.renderIntroPage();
    } else {
        location.reload();
    }
};

/**
 * [초보자용 주석] 9. 대시보드 메인 뷰포트 마스터 드로잉 렌더러 [💡 오파시티 버그 전면 격리 조치 완료]
 */
window.renderRecordPage = function() {
    const container = document.getElementById('hunt-record');
    if (!container) return;

    // 🛡️ 기존 충돌 요소 완전 방지: 투명도 조작 없이 순수 가시화 디렉션 부여
    container.style.display = 'block';

    try {
        const currentTabIdx = parseInt(window.currentIdx) || 1;
        const dopingNames = ["VIP 버프", "경험치 쿠폰(50%)", "경험치 3배 쿠폰", "경험치 4배 쿠폰", "재물 획득의 비약", "경험 축적의 비약", "유니온의 행운", "유니온의 부", "익스트림 골드"];
        const statNames = ['장비 아이템', '유니온 공격대', '어빌리티', '아티팩트', '스킬'];

        let savedConfig = {};
        try {
            savedConfig = JSON.parse(localStorage.getItem(`v14_active_cache_${currentTabIdx}`) || '{}');
        } catch (e) {
            console.warn("캐시 데이터 파싱 오류 복구 가동", e);
        }

        container.innerHTML = `
            <div class="v14-record-wrapper">
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 2px 4px;">
                    <button type="button" class="v14-btn-back" onclick="window.goBackToIntro()">◀ 인트로 화면으로 (뒤로가기)</button>
                    <span style="font-size: 13px; font-weight: 800; color: var(--hunt-primary); letter-spacing: -0.3px;">사냥 및 재획 통합 관리 콘솔</span>
                </div>
                
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
                        <div class="v14-dash-title stats">⚔️ 추가 드랍 / 메획</div>
                        <div class="v14-dash-value" id="v14LiveStatsValue_${currentTabIdx}">0% / 0%</div>
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
                            <div class="v14-config-grid-2col">
                                <input type="text" id="v14_startMeso_${currentTabIdx}" class="v14-input-base" placeholder="💰 시작 보유 메소" value="${savedConfig.startMeso || ''}" onkeyup="if(typeof window.applyRealtimeComma === 'function') window.applyRealtimeComma(this);" oninput="window.saveActiveInputsToCache(${currentTabIdx}); window.executePureEngineCalculations(${currentTabIdx});">
                                <input type="text" id="v14_targetMeso_${currentTabIdx}" class="v14-input-base" placeholder="🎯 목표 달성 메소" value="${savedConfig.targetMeso || ''}" onkeyup="if(typeof window.applyRealtimeComma === 'function') window.applyRealtimeComma(this);" oninput="window.saveActiveInputsToCache(${currentTabIdx}); window.executePureEngineCalculations(${currentTabIdx});">
                            </div>
                            <div class="v14-config-grid-3col">
                                <input type="number" id="v14_startExp_${currentTabIdx}" step="0.001" class="v14-input-base" placeholder="⚡ 시작 EXP" value="${savedConfig.startExp || ''}" oninput="window.saveActiveInputsToCache(${currentTabIdx})">
                                <input type="number" id="v14_startGem_${currentTabIdx}" class="v14-input-base" placeholder="🔮 시작 젬스톤" value="${savedConfig.startGem || ''}" oninput="window.saveActiveInputsToCache(${currentTabIdx})">
                                <input type="number" id="v14_startFrag_${currentTabIdx}" class="v14-input-base" placeholder="✨ 시작 조각" value="${savedConfig.startFrag || ''}" oninput="window.saveActiveInputsToCache(${currentTabIdx})">
                            </div>
                            
                            <div class="v14-gauge-card-zone">
                                <div class="v14-gauge-info-text">
                                    <span>🎯 사냥 목표 메소 달성률</span>
                                    <span id="v14_gauge_percent_text_${currentTabIdx}">0%</span>
                                </div>
                                <div class="v14-gauge-track">
                                    <div class="v14-gauge-fill" id="v14_gauge_fill_bar_${currentTabIdx}"></div>
                                </div>
                                <div class="v14-gauge-sub-text" id="v14_gauge_sub_text_${currentTabIdx}">누적 순익: 0 / 목표: 0 Meso</div>
                            </div>
                        </div>

                        <div class="v14-plate-card">
                            <div class="v14-plate-header">⚡ *SPECIFICATION CONFIG (상세 능력치 입력)*</div>
                            <div class="v14-stat-split-box">
                                <div>
                                    <h4 class="v14-stat-section-title-meso">💰 메획 추가 세팅 (%)</h4>
                                    ${statNames.map((s, idxLoop) => `
                                        <div class="v14-stat-row">
                                            <span class="v14-stat-label">${s}</span>
                                            <input type="number" id="v14_m_stat_${idxLoop}_${currentTabIdx}" class="v14-input-stat-digit" placeholder="0" oninput="window.calculateLiveStats(${currentTabIdx})">
                                        </div>
                                    `).join('')}
                                </div>
                                <div>
                                    <h4 class="v14-stat-section-title-drop">🍀 드랍률 추가 세팅 (%)</h4>
                                    ${statNames.map((s, idxLoop) => `
                                        <div class="v14-stat-row">
                                            <span class="v14-stat-label">${s}</span>
                                            <input type="number" id="v14_d_stat_${idxLoop}_${currentTabIdx}" class="v14-input-stat-digit" placeholder="0" oninput="window.calculateLiveStats(${currentTabIdx})">
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <div class="v14-doping-divider-zone">
                                <div class="v14-plate-header" style="margin-bottom: 6px;">💊 *사냥 도핑 리스트 (실시간 스펙 계산 연동)*</div>
                                <div class="v14-doping-grid">
                                    ${dopingNames.map((name, idxLoop) => `
                                        <label class="v14-doping-label">
                                            <input type="checkbox" id="v14_chk_${idxLoop}_${currentTabIdx}" onchange="window.calculateLiveStats(${currentTabIdx})">
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

                            <div class="v14-console-input-grid">
                                <input type="text" id="v14_map_${currentTabIdx}" class="v14-input-base" placeholder="🏕️ 사냥터 명칭" value="${savedConfig.map || ''}">
                                <input type="text" id="v14_meso_${currentTabIdx}" class="v14-input-base" placeholder="🪙 획득 순메소" onkeyup="if(typeof window.applyRealtimeComma === 'function') window.applyRealtimeComma(this);">
                                <input type="number" id="v14_exp_${currentTabIdx}" step="0.001" class="v14-input-base" placeholder="⚡ 수확 EXP%">
                                <input type="number" id="v14_gem_${currentTabIdx}" class="v14-input-base" placeholder="🔮 젬스톤">
                                <input type="number" id="v14_frag_${currentTabIdx}" class="v14-input-base" placeholder="✨ 에르다 조각">
                            </div>

                            <div class="v14-extra-loot-box">
                                <div class="v14-extra-loot-header">
                                    <span class="v14-extra-loot-title">🎁 회차별 기타 전리품 부수입 기입 창 (선택사항)</span>
                                    <button type="button" class="v14-extra-add-btn" onclick="window.addV14ExtraRow(${currentTabIdx})">+ 항목 추가</button>
                                </div>
                                <div id="v14ExtraContainer_${currentTabIdx}"></div>
                            </div>

                            <div id="v14SubRecordList_${currentTabIdx}" class="v14-sub-records-grid"></div>

                            <div class="v14-action-btn-group">
                                <button type="button" class="v14-btn v14-btn-save" onclick="window.recordOneSession(${currentTabIdx})">⏱️ 1소재(임시) 기록 저장</button>
                                <button type="button" class="v14-btn v14-btn-send" onclick="if(typeof window.saveFinalRecord === 'function') { window.saveFinalRecord(${currentTabIdx}); } else { alert('통합 원장 코드 파이프라인이 누락되었습니다.'); }">📊 통합 기록지로 전송</button>
                                <button type="button" class="v14-btn v14-btn-reset" onclick="window.resetCurrentV14RecordForm(${currentTabIdx})">🗑️ 리셋</button>
                            </div>
                        </div>

                        <div class="v14-pure-statement-plate">
                            <div class="v14-pure-audit-header">
                                ⚖️ PURE REVENUE FINANCIAL AUDIT (도핑/어빌 제외 순수 원금 명세서)
                            </div>
                            <div class="v14-pure-detailed-grid">
                                <div class="v14-pure-audit-card">
                                    <div class="v14-audit-type-title">🪙 순수 메소 역산</div>
                                    <div class="v14-audit-line"><span>입력 메소</span> <span id="v14_audit_raw_meso_${currentTabIdx}">0 획득</span></div>
                                    <div class="v14-audit-line"><span>추가 메획</span> <span id="v14_audit_meso_rate_${currentTabIdx}">+0%</span></div>
                                    <div class="v14-audit-line"><span>재획비 여부</span> <span id="v14_audit_meso_pot_${currentTabIdx}">X (1.0배)</span></div>
                                    <div class="v14-audit-divider"></div>
                                    <div class="v14-audit-total-line"><span>순수 원금 메소</span> <span id="v14_pure_meso_statement_${currentTabIdx}" class="v14-pure-highlight">0 Meso</span></div>
                                </div>
                                <div class="v14-pure-audit-card">
                                    <div class="v14-audit-type-title">⚡ 순수 EXP 역산</div>
                                    <div class="v14-audit-line"><span>입력 EXP</span> <span id="v14_audit_raw_exp_${currentTabIdx}">0.000%</span></div>
                                    <div class="v14-audit-line"><span>추가 EXP</span> <span id="v14_audit_exp_rate_${currentTabIdx}">+0%</span></div>
                                    <div class="v14-audit-line"><span>쿠폰 보정</span> <span id="v14_audit_exp_add_${currentTabIdx}">총 100% 배율</span></div>
                                    <div class="v14-audit-divider"></div>
                                    <div class="v14-audit-total-line"><span>순수 원금 EXP</span> <span id="v14_pure_exp_statement_${currentTabIdx}" class="v14-pure-highlight">0.0000 %</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const inputsToWatch = [`v14_meso_${currentTabIdx}`, `v14_exp_${currentTabIdx}`, `v14_gem_${currentTabIdx}`, `v14_frag_${currentTabIdx}`];
        inputsToWatch.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', () => window.executePureEngineCalculations(currentTabIdx));
        });

        window.calculateLiveStats(currentTabIdx);
        window.refreshLiveDashboard(currentTabIdx);
        window.renderSubSessionCards(currentTabIdx);
    } catch (criticalError) {
        console.error("🚨 사냥기록지 엔진 드로잉 에러 무력화 세이프 가드 작동:", criticalError);
    }
};

/**
 * 📊 [핵심 초기화 안정장치]
 * 홈페이지를 새로 열면 무조건 사냥 화면을 격리하고 intro 화면으로 유도합니다.
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. 🔑 기존 로그인했던 API Key 자동 인풋 완성 파이프라인
    const cachedApiKey = localStorage.getItem('omni_api_key') || localStorage.getItem('maple_api_token') || '';
    const apiInputElement = document.getElementById('omni-api-input') || document.getElementById('apiKeyInput') || document.querySelector('.api-input-field') || document.getElementById('api_key');
    
    if (apiInputElement && cachedApiKey) {
        apiInputElement.value = cachedApiKey;
        console.log("🔒 기존 로그인 API 키 복원 후 완료 상자에 탑재했습니다.");
    }

    // 2. 🚫 [무조건 인트로 화면 강제 런타임]
    localStorage.setItem('omni_current_tab', 'intro');

    const huntContainer = document.getElementById('hunt-record');
    const introContainer = document.getElementById('intro-page') || document.getElementById('intro-container') || document.getElementById('main-intro') || document.getElementById('overview');

    if (huntContainer) {
        huntContainer.style.display = 'none';
    }
    
    if (introContainer) {
        introContainer.style.display = 'block';
    }
    
    if (typeof window.renderIntroPage === 'function') {
        window.renderIntroPage();
    }
});