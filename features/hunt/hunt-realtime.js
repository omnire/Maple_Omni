/**
 * ============================================================================
 * ⚔️ MAPLE OMNI - 실시간 기록 모듈 (사냥 기록 입력 및 도핑)
 * 파일명: features/hunt/hunt-realtime.js
 * 설명: 사용자가 30분 단위로 입력하는 수치를 읽어 임시로 보관하거나 삭제합니다.
 * script.js의 도핑 및 설정 저장 기능도 통합되었습니다.
 * ============================================================================
 */

/**
 * 📥 1. 기록 임시 저장 (30분 사냥 후 '기록하기' 버튼을 눌렀을 때)
 */
window.recordSub = function(idx) {
    const charIdx = parseInt(idx || 1);
    const selectedDate = document.getElementById('huntGlobalDate')?.value || new Date().toISOString().split('T')[0];
    const storageKey = `${charIdx}_${selectedDate}`; 

    const mesoEl = document.getElementById(`meso_${idx}`);
    const expEl = document.getElementById(`exp_${idx}`);
    const gemEl = document.getElementById(`gem_${idx}`);
    const fragEl = document.getElementById(`frag_${idx}`);
    const isJhk = document.getElementById(`isFullJaehoek_${idx}`)?.checked || false;

    const curM = parseInt(String(mesoEl?.value || "0").replace(/,/g, "")) || 0;
    const curE = parseFloat(expEl?.value) || 0;
    const curG = parseInt(String(gemEl?.value || "0").replace(/,/g, "")) || 0;
    const curF = parseInt(String(fragEl?.value || "0").replace(/,/g, "")) || 0;

    // 이전 회차까지 누적된 수치를 계산합니다. (시작 금액 + 1회차 + 2회차...)
    let prevM = 0, prevE = 0, prevG = 0, prevF = 0;
    if (window.subHistory[storageKey] && window.subHistory[storageKey].length > 0) {
        const lastLog = window.subHistory[storageKey][window.subHistory[storageKey].length - 1];
        prevM = lastLog.fullMeso || 0; 
        prevE = lastLog.fullExp || 0; 
        prevG = lastLog.fullGem || 0; 
        prevF = lastLog.fullFrag || 0;
    } else {
        prevM = parseInt(String(document.getElementById(`startMeso_${idx}`)?.value).replace(/,/g, "")) || 0;
        prevE = parseFloat(document.getElementById(`startExp_${idx}`)?.value) || 0;
        prevG = parseInt(String(document.getElementById(`startGem_${idx}`)?.value).replace(/,/g, "")) || 0;
        prevF = parseInt(String(document.getElementById(`startFrag_${idx}`)?.value).replace(/,/g, "")) || 0;
    }

    let sellListArray = [];
    const container = document.getElementById(`sellListContainer_${idx}`);
    if (container) {
        const names = container.querySelectorAll('.sell-item-name');
        for (let j = 0; j < names.length; j++) {
            let n = names[j].value.trim();
            if (n !== "") sellListArray.push({name: n, price: 0});
        }
    }

    const newRec = { 
        id: Date.now(), 
        timestamp: Date.now(),
        time: new Date().toLocaleTimeString('ko-KR', {hour: '2-digit', minute:'2-digit', hour12: false}), 
        meso: curM.toLocaleString(), 
        fullMeso: prevM + curM, 
        exp: curE.toFixed(3),        
        fullExp: prevE + curE, 
        gem: curG,                   
        fullGem: prevG + curG, 
        frag: curF,                  
        fullFrag: prevF + curF,
        sellList: sellListArray,
        isFullJaehoek: isJhk,
        isFinalized: false 
    };

    if(!window.subHistory[storageKey]) window.subHistory[storageKey] = [];
    window.subHistory[storageKey].push(newRec);
    localStorage.setItem(`maple_subHistory_${storageKey}`, JSON.stringify(window.subHistory[storageKey]));
    localStorage.setItem('omni_sub_history', JSON.stringify(window.subHistory));
    
    // 입력창 청소
    if(mesoEl) mesoEl.value = ""; 
    if(expEl) expEl.value = ""; 
    if(gemEl) gemEl.value = ""; 
    if(fragEl) fragEl.value = "";
    if(container) { 
        container.innerHTML = ''; 
        if (typeof window.addSellRow === 'function') window.addSellRow(idx); 
    }

    if (typeof window.renderSubRecords === 'function') window.renderSubRecords(idx); 
    if (typeof window.updateAll === 'function') window.updateAll(idx);
    if (typeof window.refreshWeekly === 'function') window.refreshWeekly(); 
    if (typeof window.renderAttendance === 'function') window.renderAttendance(); 

    if (document.activeElement) document.activeElement.blur();

    setTimeout(() => {
        if (typeof window.omniModal === 'function') {
            window.omniModal({ title: '기록 완료', desc: '해당 날짜의 기록으로 실시간 반영되었습니다!', icon: '✅' });
        } else {
            alert("기록 완료!");
        }
    }, 150);
};

// [초보자용 주석] 2. 개별 임시 기록 삭제
window.removeSubRecord = function(idx, recordIdx, force = false) {
    if (!force && !confirm("이 회차 기록을 삭제하시겠습니까?")) return;
    
    const selectedDate = document.getElementById('huntGlobalDate')?.value || new Date().toISOString().split('T')[0];
    const storageKey = `${idx}_${selectedDate}`;

    if (window.subHistory && window.subHistory[storageKey]) {
        window.subHistory[storageKey].splice(recordIdx, 1);
        
        localStorage.setItem(`maple_subHistory_${storageKey}`, JSON.stringify(window.subHistory[storageKey]));
        localStorage.setItem('omni_sub_history', JSON.stringify(window.subHistory));

        if (typeof window.renderSubRecords === 'function') window.renderSubRecords(idx); 
        if (typeof window.updateAll === 'function') window.updateAll(idx); 
        if (typeof window.refreshWeekly === 'function') window.refreshWeekly(); 
        if (typeof window.renderAttendance === 'function') window.renderAttendance();
    }
};

/**
 * 🔥 [초기화] 캐릭터 API 정보를 제외한 모든 설정 및 실시간 기록 리셋
 */
window.resetCurrentHunt = function(idx) { 
    const charIdx = parseInt(idx);
    const config = JSON.parse(localStorage.getItem(`maple_config_${charIdx}`) || '{}');
    const charName = (config.name && !config.name.includes("캐릭터 ")) ? config.name : `캐릭터 ${charIdx}`;

    if (confirm(`[${charName}] 의 모든 설정과 기록을 초기화하시겠습니까?\n\n※ 주의: 통합기록지로 이미 전송된 데이터는 삭제되지 않습니다.\n※ 캐릭터 동기화 정보는 유지됩니다.`)) {
        
        const targets = ['startMeso','targetMeso','startExp','startGem','startFrag','meso','exp','gem','frag','map'];
        targets.forEach(id => { 
            const el = document.getElementById(`${id}_${charIdx}`); 
            if(el) el.value = ""; 
        }); 

        for (let j = 0; j < 5; j++) {
            const mStat = document.getElementById(`m_stat_${j}_${charIdx}`);
            const dStat = document.getElementById(`d_stat_${j}_${charIdx}`);
            if (mStat) mStat.value = "";
            if (dStat) dStat.value = "";
        }

        for (let k = 0; k < 9; k++) {
            const chk = document.getElementById(`chk_${k}_${charIdx}`);
            if (chk) chk.checked = false;
        }

        const jhkChk = document.getElementById(`isFullJaehoek_${charIdx}`);
        if(jhkChk) jhkChk.checked = false;

        const defaultConfig = { name: charName }; 
        localStorage.setItem(`maple_config_${charIdx}`, JSON.stringify(defaultConfig));

        const sDate = document.getElementById('huntGlobalDate')?.value || new Date().toISOString().split('T')[0];
        const sKey = `${charIdx}_${sDate}`;

        if (window.subHistory) {
            window.subHistory[sKey] = []; 
            localStorage.removeItem(`maple_subHistory_${sKey}`); 
            localStorage.setItem('omni_sub_history', JSON.stringify(window.subHistory));
        }

        let manualAtt = JSON.parse(localStorage.getItem(`manual_attendance_${charIdx}`) || '{}');
        if (manualAtt[sDate]) {
            delete manualAtt[sDate]; 
            localStorage.setItem(`manual_attendance_${charIdx}`, JSON.stringify(manualAtt));
        }

        if (typeof window.renderSubRecords === 'function') window.renderSubRecords(charIdx); 
        if (typeof window.updateAll === 'function') window.updateAll(charIdx); 
        if (typeof window.refreshWeekly === 'function') window.refreshWeekly(); 
        if (typeof window.renderAttendance === 'function') window.renderAttendance(); 
        if (typeof window.reRenderTabs === 'function') window.reRenderTabs();

        alert(`[${charName}] 초기화가 완료되었습니다.`);
    }
};

// [초보자용 주석] 4. 실시간 대시보드 누적 스탯 업데이트
window.updateAll = function(idx) {
    let totalMeso = 0, totalExp = 0, totalGem = 0, totalFrag = 0;
    
    const allRecords = JSON.parse(localStorage.getItem('maple_hunt_records') || '[]');
    allRecords.filter(r => r.charId == idx).forEach(rec => {
        totalMeso += parseInt(String(rec.meso).replace(/,/g, "")) || 0;
        totalExp += parseFloat(rec.exp) || 0;
        totalGem += parseInt(String(rec.gem).replace(/,/g, "")) || 0;
        totalFrag += parseInt(String(rec.frag).replace(/,/g, "")) || 0;
    });

    const sDate = document.getElementById('huntGlobalDate')?.value || new Date().toISOString().split('T')[0];
    const sKey = `${idx}_${sDate}`;

    if (window.subHistory && window.subHistory[sKey]) {
        window.subHistory[sKey].forEach(rec => {
            if (!rec.isFinalized) { 
                totalMeso += parseInt(String(rec.meso).replace(/,/g, "")) || 0;
                totalExp += parseFloat(rec.exp) || 0;
                totalGem += parseInt(String(rec.gem).replace(/,/g, "")) || 0;
                totalFrag += parseInt(String(rec.frag).replace(/,/g, "")) || 0;
            }
        });
    }

    if (document.getElementById(`profitMeso_${idx}`)) document.getElementById(`profitMeso_${idx}`).innerText = totalMeso.toLocaleString();
    if (document.getElementById(`profitExp_${idx}`)) document.getElementById(`profitExp_${idx}`).innerText = totalExp.toFixed(3) + "%";

    if (typeof window.syncDopingStats === 'function') {
        window.syncDopingStats(idx);
    }
};

// [초보자용 주석] 5. 도핑 체크박스 선택 시 자동 계산
window.updateHuntStats = function() {
    let totalDrop = 0;
    let totalMeso = 0;
    let totalExp = 0;

    const activeDopings = document.querySelectorAll('.doping-check:checked');

    activeDopings.forEach(cb => {
        const itemName = cb.getAttribute('data-name'); 
        const buffData = buffs.find(b => b.name === itemName);

        if (buffData) {
            totalDrop += (buffData.d || 0);
            totalMeso += (buffData.m || 0);
            totalExp += (buffData.e || 0); 
        }
    });

    const dropMesoDisplay = document.getElementById('displayDropMeso');
    if (dropMesoDisplay) {
        dropMesoDisplay.innerText = `${totalDrop} / ${totalMeso}`;
    }

    window.currentDopingExp = totalExp;
    console.log(`[도핑 업데이트] 드랍: ${totalDrop}%, 메획: ${totalMeso}%, 경험치: ${totalExp}%`);
};

// [초보자용 주석] 6. 회차 기록 수정 전용 모달
window.editSubRecord = function(charIdx, logIdx) {
    const dateInput = document.getElementById('huntGlobalDate');
    const selectedDate = (dateInput && dateInput.value) ? dateInput.value : new Date().toISOString().split('T')[0];
    const storageKey = `${charIdx}_${selectedDate}`;
    
    if (!window.subHistory || !window.subHistory[storageKey]) return;
    const log = window.subHistory[storageKey][logIdx]; 
    if (!log) return;

    const editModalHtml = `
        <div id="editLogModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1000000; backdrop-filter:blur(4px);">
            <div style="background:white; width:340px; border-radius:24px; padding:25px; box-shadow:0 20px 40px rgba(0,0,0,0.2);">
                <h3 style="margin:0 0 20px; font-size:18px; font-weight:900; text-align:center; color:#1e293b;">#${logIdx + 1}회차 기록 수정</h3>
                
                <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px;">
                    <div>
                        <label style="font-size:11px; font-weight:800; color:#64748b; margin-left:5px;">💰 메소</label>
                        <input type="text" id="editMeso" value="${log.meso}" onkeyup="if(typeof window.onMeso === 'function') window.onMeso(this);" style="width:100%; padding:12px; border:1px solid #e2e8f0; border-radius:12px; font-size:14px; font-weight:700; outline:none; box-sizing:border-box;">
                    </div>
                    <div>
                        <label style="font-size:11px; font-weight:800; color:#64748b; margin-left:5px;">📈 경험치(%)</label>
                        <input type="number" id="editExp" value="${log.exp}" step="0.001" style="width:100%; padding:12px; border:1px solid #e2e8f0; border-radius:12px; font-size:14px; font-weight:700; outline:none; box-sizing:border-box;">
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                        <div>
                            <label style="font-size:11px; font-weight:800; color:#64748b; margin-left:5px;">💎 젬스톤</label>
                            <input type="number" id="editGem" value="${log.gem}" style="width:100%; padding:12px; border:1px solid #e2e8f0; border-radius:12px; font-size:14px; font-weight:700; outline:none; box-sizing:border-box;">
                        </div>
                        <div>
                            <label style="font-size:11px; font-weight:800; color:#64748b; margin-left:5px;">🧊 조각</label>
                            <input type="number" id="editFrag" value="${log.frag}" style="width:100%; padding:12px; border:1px solid #e2e8f0; border-radius:12px; font-size:14px; font-weight:700; outline:none; box-sizing:border-box;">
                        </div>
                    </div>
                </div>

                <div style="display:flex; gap:10px;">
                    <button onclick="document.getElementById('editLogModal').remove();" style="flex:1; padding:14px; background:#f1f5f9; color:#475569; border:none; border-radius:15px; font-weight:800; cursor:pointer;">취소</button>
                    <button id="saveEditBtn" style="flex:2; padding:14px; background:#8b5cf6; color:white; border:none; border-radius:15px; font-weight:800; cursor:pointer;">수정 완료</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', editModalHtml); 

    document.getElementById('saveEditBtn').onclick = function() {
        const newMeso = document.getElementById('editMeso').value;
        const newExp = document.getElementById('editExp').value;
        const newGem = document.getElementById('editGem').value;
        const newFrag = document.getElementById('editFrag').value;

        log.meso = newMeso;
        log.exp = parseFloat(newExp).toFixed(3);
        log.gem = parseInt(newGem) || 0;
        log.frag = parseInt(newFrag) || 0;

        localStorage.setItem(`maple_subHistory_${storageKey}`, JSON.stringify(window.subHistory[storageKey]));
        localStorage.setItem('omni_sub_history', JSON.stringify(window.subHistory));

        document.getElementById('editLogModal').remove();
        if (typeof window.renderSubRecords === 'function') window.renderSubRecords(charIdx);
        if (typeof window.updateAll === 'function') window.updateAll(charIdx);

        if (typeof window.omniModal === 'function') {
            window.omniModal({ title: '수정 완료', desc: '기록이 성공적으로 변경되었습니다.', icon: '✍️' });
        }
    };
};

// ==========================================
// [초보자용 주석] script.js에서 이관된 캐릭터 설정 및 도핑 동기화
// ==========================================
window.syncDopingStats = function(i) {
    let totalMStat = 0, totalDStat = 0, totalEStat = 0;
    
    for(let j = 0; j < 5; j++) {
        const mInput = document.getElementById(`m_stat_${j}_${i}`);
        const dInput = document.getElementById(`d_stat_${j}_${i}`);
        
        totalMStat += parseInt(mInput?.value) || 0;
        totalDStat += parseInt(dInput?.value) || 0;
    }
    
    const currentStatsEl = document.getElementById(`currentStats_${i}`);
    if (currentStatsEl) {
        const resultText = `${totalDStat} / ${totalMStat}`;
        currentStatsEl.innerText = resultText;
        
        if (totalDStat > 0 || totalMStat > 0) {
            setTimeout(() => {
                if(currentStatsEl.innerText === "0 / 0") {
                    currentStatsEl.innerText = resultText;
                }
            }, 50); 
        }
    }
    
    window.currentDopingMeso = totalMStat;
    window.currentDopingExp = totalEStat;
    
    window.saveCharConfig(i); 
};

window.saveCharConfig = function(i) {
    const existingConfig = JSON.parse(localStorage.getItem(`maple_config_${i}`) || '{}');
    
    const config = {
        name: existingConfig.name || `캐릭터 ${i}`, 
        startMeso: document.getElementById(`startMeso_${i}`)?.value || "",
        targetMeso: document.getElementById(`targetMeso_${i}`)?.value || "",
        startExp: document.getElementById(`startExp_${i}`)?.value || "",
        startGem: document.getElementById(`startGem_${i}`)?.value || "",
        startFrag: document.getElementById(`startFrag_${i}`)?.value || "",
        map: document.getElementById(`map_${i}`)?.value || "",
        mStats: [], dStats: [], chks: []
    };
    
    for(let j = 0; j < 5; j++) {
        config.mStats.push(document.getElementById(`m_stat_${j}_${i}`)?.value || "");
        config.dStats.push(document.getElementById(`d_stat_${j}_${i}`)?.value || "");
    }
    for(let j = 0; j < 9; j++) {
        config.chks.push(document.getElementById(`chk_${j}_${i}`)?.checked || false);
    }
    
    localStorage.setItem(`maple_config_${i}`, JSON.stringify(config));
};

window.restoreCharConfig = function() {
    for (let i = 1; i <= 4; i++) {
        const conf = JSON.parse(localStorage.getItem(`maple_config_${i}`) || '{}');
        if (!conf.name) continue;

        const fields = ['startMeso', 'targetMeso', 'startExp', 'startGem', 'startFrag', 'map'];
        fields.forEach(f => {
            const el = document.getElementById(`${f}_${i}`);
            if (el && document.activeElement !== el) el.value = conf[f] || "";
        });

        for(let j=0; j<5; j++) {
            const m = document.getElementById(`m_stat_${j}_${i}`);
            const d = document.getElementById(`d_stat_${j}_${i}`);
            if (m && document.activeElement !== m) m.value = conf.mStats?.[j] || "";
            if (d && document.activeElement !== d) d.value = conf.dStats?.[j] || "";
        }

        for(let j=0; j<9; j++) {
            const chk = document.getElementById(`chk_${j}_${i}`);
            if (chk) chk.checked = conf.chks?.[j] || false;
        }

        if (typeof window.syncDopingStats === 'function') {
            window.syncDopingStats(i);
        }
    }
};