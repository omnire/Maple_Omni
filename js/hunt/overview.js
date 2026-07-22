/**
 * ============================================================================
 * 🧠 MAPLE OMNI V14 - js/hunt/overview.js [라벤더 엘리트 통합 엔진 코어]
 * 설명: 메인 슬롯 라우팅 및 캘린더 엔진을 전담하는 중앙 분배 코어 모듈입니다.
 * 패치노트:
 * 1. window.switchHuntTab 라우팅 중복 정의 로직을 일원화하여 탭 이동 시 화면 깨짐이나
 * 빈 화면 노출 버그를 완전 근절했습니다.
 * 2. 7일 및 30일 데이터 파싱 주기를 브라우저 로컬 타임존(Local Time)에 맞춰 포맷팅하여 
 * 새벽 시간대 데이터 누락 현상을 해결했습니다.
 * 규칙: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 달아줍니다.
 * ============================================================================
 */

// 1. 메모리 상에 상태 관리 필드가 부재할 경우를 고려한 원자적 앵커 인프라 수립
if (typeof window.overviewMainTab === 'undefined') window.overviewMainTab = 'hunt';
if (typeof window.overviewIntegratedSubView === 'undefined') window.overviewIntegratedSubView = 'list';
if (typeof window.overviewSelectedCharId === 'undefined') window.overviewSelectedCharId = null;

if (typeof window.attendanceYear === 'undefined') window.attendanceYear = new Date().getFullYear();
if (typeof window.attendanceMonth === 'undefined') window.attendanceMonth = new Date().getMonth();

/**
 * 🛡️ [초보자 주석] 아바타 이미지 로드 에러 백업 필터
 * 역할: 넥슨 서버 점검 등으로 이미지가 터졌을 때 단정하게 귀여운 단풍잎 아이콘으로 우회 치환합니다.
 */
window.handleAvatarLoadError = function(imgElement) {
    if (!imgElement) return;
    imgElement.style.display = 'none';
    const fallbackSpan = imgElement.nextElementSibling;
    if (fallbackSpan) fallbackSpan.style.setProperty('display', 'inline', 'important');
};

/**
 * 🔄 내부 코어 탭 세션 전환기 (개별 대시보드 <-> 전체 통합기록지)
 */
window.switchOverviewInnerTab = function(tabMode) {
    window.overviewMainTab = tabMode;
    if (tabMode === 'integrated') window.overviewSelectedCharId = null;
    window.renderHuntOverviewPage();
};

/**
 * 🔄 통합 기록지 하부 서브 명세 컴포넌트 스위처 (리스트 뷰 <-> 달력 뷰)
 */
window.switchIntegratedSubView = function(viewMode) {
    window.overviewIntegratedSubView = viewMode;
    window.renderHuntOverviewPage();
};

/**
 * 📅 통합 달력 수동 체크인 스탬프 토글러
 */
window.toggleIntegratedAttendance = function(dateStr) {
    let manualAttendance = JSON.parse(localStorage.getItem(`manual_attendance_integrated`) || '{}');
    manualAttendance[dateStr] = !manualAttendance[dateStr];
    localStorage.setItem(`manual_attendance_integrated`, JSON.stringify(manualAttendance));
    window.renderHuntOverviewPage();
};

/**
 * 📅 통합 달력 스태퍼 조절 핸들러 (이전달 / 다음달 제어)
 */
window.changeIntegratedMonth = function(offset) {
    window.attendanceMonth += offset;
    if (window.attendanceMonth < 0) {
        window.attendanceMonth = 11;
        window.attendanceYear -= 1;
    } else if (window.attendanceMonth > 11) {
        window.attendanceMonth = 0;
        window.attendanceYear += 1;
    }
    window.renderHuntOverviewPage();
};

/**
 * 📥 캐릭터 연동용 실시간 오픈 API 검색 팝업 모달 개방
 */
window.openCharRegisterModal = function(slotId, event) {
    if (event) event.stopPropagation();
    window.overviewTargetRegisterSlot = slotId;
    const modalOverlay = document.getElementById('v14RegModalOverlay');
    if (modalOverlay) {
        modalOverlay.style.setProperty('display', 'flex', 'important');
        const existingData = JSON.parse(localStorage.getItem(`maple_char_data_${slotId}`) || '{}');
        document.getElementById('v14_modal_search_name').value = existingData.name || '';
    }
};

/**
 * 📥 캐릭터 연동 모달 창 해제 종료
 */
window.closeCharRegisterModal = function() {
    const modalOverlay = document.getElementById('v14RegModalOverlay');
    if (modalOverlay) modalOverlay.style.setProperty('display', 'none', 'important');
    window.overviewTargetRegisterSlot = null;
};

/**
 * ❌ 캐릭터 슬롯 연동 데이터 전면 초기화 리셋
 */
window.deleteCharRegisterData = function(slotId, event) {
    if (event) event.stopPropagation();
    if (confirm(`⚠️ [슬롯 초기화] Slot-${slotId}번 캐릭터의 연동 자원을 원장에서 영구 삭제할까요?`)) {
        localStorage.removeItem(`maple_char_data_${slotId}`);
        if (window.overviewSelectedCharId === slotId) window.overviewSelectedCharId = null;
        window.renderHuntOverviewPage();
    }
};

/**
 * 넥슨 오픈 API 커널 동기화 모듈 스캔 및 마운트 프로세서
 */
window.saveCharRegisterDataFromApi = async function() {
    const slotId = window.overviewTargetRegisterSlot;
    if (!slotId) return;

    const searchName = document.getElementById('v14_modal_search_name').value.trim();
    if (!searchName) { alert("조회할 캐릭터 닉네임을 정확히 입력하세요."); return; }

    const saveBtn = document.getElementById('v14ModalSaveBtn');
    if (saveBtn) { saveBtn.innerText = "⏳ 넥슨 서버 실시간 스캔 중..."; saveBtn.disabled = true; }

    try {
        if (typeof window.fetchCharacterBasicInfo === 'function') {
            const apiRes = await window.fetchCharacterBasicInfo(searchName);
            if (apiRes && apiRes.character_name) {
                let characterDataNode = {
                    name: apiRes.character_name,
                    job: apiRes.character_class,
                    level: apiRes.character_level,
                    server: apiRes.world_name,
                    avatar: apiRes.character_image || `https://avatar.maplestory.nexon.com/Character/${searchName}/Preview`
                };
                localStorage.setItem(`maple_char_data_${slotId}`, JSON.stringify(characterDataNode));
                window.closeCharRegisterModal();
                window.renderHuntOverviewPage();
            } else {
                alert("❌ 검색된 캐릭터 닉네임이 없거나 정보 수신에 실패했습니다.");
            }
        }
    } catch (err) {
        alert("API 호출 제한 도달 혹은 만료된 토큰입니다.");
    } finally {
        if (saveBtn) { saveBtn.innerText = "🔍 API 실시간 동기화 및 등록"; saveBtn.disabled = false; }
    }
};

/**
 * 캐릭터 개별 사냥 관제 대시보드 스위칭 인터페이스
 */
window.selectCharOverviewDetail = function(charId) {
    window.overviewSelectedCharId = charId;
    window.currentIdx = charId;
    window.renderHuntOverviewPage();
};

/**
 * 캐릭터 선택 메인 그리드로 빠져나오는 복귀 핸들러
 */
window.resetCharOverviewToGrid = function() {
    window.overviewSelectedCharId = null;
    window.renderHuntOverviewPage();
};

/**
 * 📊 [대시보드 메인 컴파일 렌더러]
 */
window.renderHuntOverviewPage = function() {
    const container = document.getElementById('hunt-overview');
    if (!container) return;

    const legacyTopSubMenu = document.querySelector('#page-hunt .sub-tab-menu');
    if (legacyTopSubMenu) legacyTopSubMenu.style.setProperty('display', 'none', 'important');

    const allStoredRecords = JSON.parse(localStorage.getItem('maple_hunt_records') || '[]');

    const innerTabBarHtml = `
        <div class="v14-inner-tab-bar">
            <button type="button" class="v14-inner-tab-btn ${window.overviewMainTab === 'hunt' ? 'active' : ''}" onclick="window.switchOverviewInnerTab('hunt')">🎯 개별 사냥기록 대시보드</button>
            <button type="button" class="v14-inner-tab-btn ${window.overviewMainTab === 'integrated' ? 'active' : ''}" onclick="window.switchOverviewInnerTab('integrated')">📊 전 캐릭터 통합기록지</button>
        </div>
    `;

    // ==========================================
    // 1️⃣ [TAB CHOICE A]: 개별 사냥기록 대시보드 스크린 세션
    // ==========================================
    if (window.overviewMainTab === 'hunt') {
        
        if (window.overviewSelectedCharId === null) {
            let gridCardsHtml = "";

            for (let slot = 1; slot <= 5; slot++) {
                const charMeta = JSON.parse(localStorage.getItem(`maple_char_data_${slot}`) || '{}');
                const hasData = !!charMeta.name;
                
                const cName = charMeta.name || `비어있는 슬롯 Slot-${slot}`;
                const cJob = charMeta.job || "데이터 미등록";
                const cLevel = charMeta.level ? `Lv.${charMeta.level}` : "Lv.---";
                const cServer = charMeta.server || "월드 미정";
                const cAvatar = charMeta.avatar || "";

            let slotMesoSum = 0;
            const slotRecords = allStoredRecords.filter(r => r.charId == slot);
            slotRecords.forEach(rec => {
                slotMesoSum += parseInt(String(rec.meso).replace(/,/g, "")) || 0;
            });

            let slotTotalMinutes = slotRecords.length * 30;
            let slotTimeStr = slotTotalMinutes >= 60 
                ? `${Math.floor(slotTotalMinutes / 60)}시간 ${slotTotalMinutes % 60}분`
                : `${slotTotalMinutes}분`;

            const avatarGraphic = cAvatar
                ? `<img src="${cAvatar}" alt="avatar" class="v14-safe-avatar" onerror="window.handleAvatarLoadError(this);">
                   <span class="v14-fallback-maple" style="display:none; font-size:28px; color:#c0b2f0;">🍁</span>`
                : `<span style="font-size:28px; color:#cbd5e1;">➕</span>`;

            const deleteButtonMarkup = hasData
                ? `<button type="button" class="v14-slot-delete-btn" onclick="window.deleteCharRegisterData(${slot}, event)">❌ 삭제</button>`
                : '';

            gridCardsHtml += `
                <div class="v14-selector-card" onclick="${hasData ? `window.selectCharOverviewDetail(${slot})` : `window.openCharRegisterModal(${slot}, event)`}">
                    ${deleteButtonMarkup}
                    <button type="button" class="v14-slot-edit-btn" onclick="window.openCharRegisterModal(${slot}, event)">${hasData ? "🔄 갱신" : "📥 등록"}</button>
                    
                    <div class="v14-avatar-square-box" style="width:120px; height:120px; margin-bottom:8px; border-radius:8px;">
                        ${avatarGraphic}
                    </div>
                    <div class="v14-char-meta-name">${cName}</div>
                    <div class="v14-char-meta-job">${cJob}</div>
                    <div class="v14-char-meta-minimal-info">${cLevel} | ${cServer}</div>
                    
                    <div class="v14-card-metric-divider">
                        <div style="display:flex; justify-content:space-between; width:100%;"><span>⏱️ 누적 사냥시간:</span><span class="v14-card-stat-val">${slotTimeStr}</span></div>
                        <div style="display:flex; justify-content:space-between; width:100%;"><span>💰 누적 획득메소:</span><span class="v14-card-stat-val">${slotMesoSum.toLocaleString()}</span></div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="v14-overview-wrapper">
                ${innerTabBarHtml}
                <div class="v14-char-selector-grid">
                    ${gridCardsHtml}
                </div>
            </div>

            <div id="v14RegModalOverlay" class="v14-reg-modal-overlay" onclick="window.closeCharRegisterModal();">
                <div class="v14-reg-modal-window" onclick="event.stopPropagation();">
                    <div class="v14-modal-title">🔍 넥슨 API 실시간 캐릭터 검색 동기화</div>
                    <div class="v14-modal-subtitle">검색할 메이플 캐릭터 닉네임</div>
                    <input type="text" id="v14_modal_search_name" class="v14-modal-input" placeholder="닉네임 기입 후 등록 클릭" onkeypress="if(event.key === 'Enter') window.saveCharRegisterDataFromApi();">
                    <div class="v14-modal-notice-lbl">💡 닉네임을 입력하면 캐릭터 정보 및 아바타 에셋이 원장에 실시간 안착 마운트됩니다.</div>
                    <div class="v14-modal-btn-row">
                        <button type="button" class="v14-mbtn v14-mbtn-close" onclick="window.closeCharRegisterModal();">취소</button>
                        <button type="button" id="v14ModalSaveBtn" class="v14-mbtn v14-mbtn-save" onclick="window.saveCharRegisterDataFromApi();">🔍 API 실시간 동기화 및 등록</button>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    const targetIdx = window.overviewSelectedCharId;
    const charMeta = JSON.parse(localStorage.getItem(`maple_char_data_${targetIdx}`) || '{}');
    
    const characterName = charMeta.name || `Slot-${targetIdx}`;
    const characterJob = charMeta.job || "미지정 직군";
    const characterLevel = charMeta.level ? `${charMeta.level}` : "---";
    const characterServer = charMeta.server || "월드 미정";
    const characterAvatarUrl = charMeta.avatar || "";

    const finalAvatarMarkup = characterAvatarUrl
        ? `<img src="${characterAvatarUrl}" alt="Avatar" onerror="window.handleAvatarLoadError(this);"><span style="display:none; font-size:26px; color:#c0b2f0;">🍁</span>`
        : `<span style="font-size:26px; color:#cbd5e1;">🍁</span>`;

    let tableRowsHtml = "";
    let accumulatedMeso7Days = 0;
    let validHuntingDaysCount = 0;
    let accumulatedGemCount = 0;
    let accumulatedFragCount = 0;

    for (let i = 0; i < 7; i++) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - i);
        // [시차 왜곡 방지 패치] 한국 시간대 로컬 기준의 완벽한 YYYY-MM-DD 문자열 생성
        const yearStr = targetDate.getFullYear();
        const monthStr = String(targetDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(targetDate.getDate()).padStart(2, '0');
        const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
        
        const dayRecords = allStoredRecords.filter(r => r.charId == targetIdx && r.date === dateStr);
        if (dayRecords.length === 0) continue;
        
        let dayMesoSum = 0, dayGemSum = 0, dayFragSum = 0;
        let daySubIncome = 0, dayExpPercent = "0.000%";
        let currentDayLevel = characterLevel;
        
        let rawMaps = dayRecords.map(r => r.map).filter(Boolean);
        let uniqueMaps = [...new Set(rawMaps)].join(', ') || '미지정 사냥터';

        let totalMinutes = dayRecords.length * 30;
        let timeString = totalMinutes >= 60
            ? `${Math.floor(totalMinutes / 60)}시간 ${totalMinutes % 60}분 (${dayRecords.length}재획)`
            : `${totalMinutes}분 (${dayRecords.length}재획)`;

        dayRecords.forEach(rec => {
            dayMesoSum += parseInt(String(rec.meso).replace(/,/g, "")) || 0;
            dayGemSum += parseInt(rec.gem || 0);
            dayFragSum += parseInt(rec.frag || 0);
            if (rec.subIncome) daySubIncome += parseInt(String(rec.subIncome).replace(/,/g, "")) || 0;
            if (rec.expPercent) dayExpPercent = rec.expPercent;
            if (rec.endLevel) currentDayLevel = rec.endLevel;
        });
        
        let hourlyMesoRate = totalMinutes > 0 ? Math.floor((dayMesoSum / totalMinutes) * 60) : 0;
        let hourlyMesoForm = hourlyMesoRate >= 100000000
            ? (hourlyMesoRate / 100000000).toFixed(1) + '억/h'
            : (hourlyMesoRate / 10000).toFixed(0) + '만/h';
        
        validHuntingDaysCount++;
        accumulatedMeso7Days += dayMesoSum;
        accumulatedGemCount += dayGemSum;
        accumulatedFragCount += dayFragSum;

        tableRowsHtml += `
            <tr class="v14-interactive-row">
                <td class="v14-td-date">
                    <div>${dateStr}</div>
                    <div class="v14-table-subtext">⏱️ ${timeString}</div>
                </td>
                <td style="text-align: left;">
                    <span class="v14-map-badge">📍 ${uniqueMaps}</span>
                </td>
                <td class="v14-td-meso">
                    <div>+ ${dayMesoSum.toLocaleString()}</div>
                    <div class="v14-table-subtext-purple">📈 효율: ${hourlyMesoForm}</div>
                </td>
                <td class="v14-td-gem">💎 ${dayGemSum}개</td>
                <td class="v14-td-frag">✨ ${dayFragSum}개</td>
                <td class="v14-td-subincome">+ ${daySubIncome.toLocaleString()}</td>
                <td>
                    <div style="font-weight:700;" class="v14-level-main-lbl">Lv.${currentDayLevel}</div>
                    <div class="v14-table-subtext view-exp-subtext">${dayExpPercent}</div>
                </td>
                <td>
                    <button type="button" class="v14-action-mini-btn" onclick="window.switchHuntTab('history'); setTimeout(() => { if(typeof window.openHistoryDetailModal === 'function') window.openHistoryDetailModal('${dateStr}'); }, 150);">
                        🔍 정산서
                    </button>
                </td>
            </tr>
        `;
    }

    if (tableRowsHtml === "") {
        tableRowsHtml = `
            <tr>
                <td colspan="8" class="v14-empty-table-notice">
                    📡 최근 7일 동안 기록된 활성 사냥 세션 데이터가 원장에 존재하지 않습니다.
                </td>
            </tr>
        `;
    }

    const averageDailyMeso = validHuntingDaysCount > 0 ? Math.floor(accumulatedMeso7Days / validHuntingDaysCount) : 0;

    container.innerHTML = `
        <div class="v14-overview-wrapper">
            ${innerTabBarHtml}
            
            <button type="button" class="v14-back-list-btn" style="margin-top: 2px; width: fit-content;" onclick="window.resetCharOverviewToGrid()">
                ← 캐릭터 선택 그리드 목록으로 이동
            </button>
            
            <div class="v14-top-flex-zone">
                <div class="v14-char-profile-card">
                    <div class="v14-avatar-square-box" style="width:120px; height:120px;">${finalAvatarMarkup}</div>
                    <div class="v14-char-meta-name">${characterName}</div>
                    <div class="v14-char-meta-job">${characterJob}</div>
                    <div class="v14-char-meta-minimal-info">Lv.${characterLevel} | ${characterServer}</div>
                    
                    <div class="v14-char-embedded-action-row">
                        <button type="button" class="v14-action-trigger-btn" onclick="window.switchHuntTab('record')">✍ Pres 사냥기록</button>
                        <button type="button" class="v14-action-trigger-btn" onclick="window.switchHuntTab('expense')">💰 지출기입</button>
                        <button type="button" class="v14-action-trigger-btn" onclick="window.switchHuntTab('history')">📜 정산센터</button>
                        <button type="button" class="v14-action-trigger-btn" onclick="window.switchHuntTab('analysis')">📈 분석리포트</button>
                    </div>
                </div>
                
                <div class="v14-timeline-data-card">
                    <div class="v14-section-title-bar">⚔️ RECENT 7 DAYS TIMELINE LOG (최근 7일 상세 관제 내역)</div>
                    <div style="max-height: 254px; overflow-y: auto; border-radius:8px; border:1px solid #eeeaff;" class="v14-table-overflow-frame">
                        <table class="v14-timeline-table">
                            <thead>
                                <tr>
                                    <th style="width: 14%;">정산기준일</th>
                                    <th style="width: 22%; text-align: left;">주요 활동 사냥터</th>
                                    <th style="width: 18%; text-align: right; padding-right:16px;">획득 순메소액</th>
                                    <th style="width: 10%;">코어 젬스톤</th>
                                    <th style="width: 10%;">에르다 조각</th>
                                    <th style="width: 12%; text-align: right; padding-right:12px;">💵 부수입 순익</th>
                                    <th style="width: 14%;">성장 스케일</th>
                                    <th style="width: 10%;">관제</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRowsHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div style="width: 100%;">
                <div class="v14-section-title-bar">📋 PERFORMANCE INTENSITY SUMMARY (통합 정산 요약 리포트)</div>
                <div class="v14-bottom-summary-grid">
                    <div class="v14-summary-bento-box"><div class="v14-bento-label">💰 7일 합산 메소 총액</div><div class="v14-bento-value total-meso-color">${accumulatedMeso7Days.toLocaleString()}</div></div>
                    <div class="v14-summary-bento-box"><div class="v14-bento-label">📈 가동일 기준 하루 평균</div><div class="v14-bento-value total-avg-color">${averageDailyMeso.toLocaleString()}</div></div>
                    <div class="v14-summary-bento-box"><div class="v14-bento-label">💎 누적 획득 코어 젬스톤</div><div class="v14-bento-value total-gem-color">+ ${accumulatedGemCount} EA</div></div>
                    <div class="v14-summary-bento-box"><div class="v14-bento-label">✨ 누적 획득 에르다 조각</div><div class="v14-bento-value total-frag-color">+ ${accumulatedFragCount} EA</div></div>
                </div>
            </div>
        </div>
    `;
    return;
}

// ==========================================
// 2️⃣ [TAB CHOICE B]: 전 캐릭터 통합기록지 스크린
// ==========================================
if (window.overviewMainTab === 'integrated') {
    
    let totalMeso7 = 0, totalGem7 = 0, totalFrag7 = 0, totalSub7 = 0, totalSessions7 = 0;
    let totalMeso30 = 0, totalGem30 = 0, totalFrag30 = 0, totalSub30 = 0, totalSessions30 = 0;
    
    let mvpDataMap = {};
    for (let slot = 1; slot <= 5; slot++) {
        mvpDataMap[slot] = { id: slot, mesoSum: 0, subSum: 0, totalMin: 0, recordsCount: 0 };
    }

    for (let i = 0; i < 30; i++) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - i);
        const yearStr = targetDate.getFullYear();
        const monthStr = String(targetDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(targetDate.getDate()).padStart(2, '0');
        const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

        const dayRecords = allStoredRecords.filter(r => r.date === dateStr);
        let dayMeso = 0, dayGem = 0, dayFrag = 0, daySub = 0;
        
        dayRecords.forEach(rec => {
            let m = parseInt(String(rec.meso).replace(/,/g, "")) || 0;
            let gem = parseInt(rec.gem || 0);
            let frag = parseInt(rec.frag || 0);
            let sub = rec.subIncome ? parseInt(String(rec.subIncome).replace(/,/g, "")) || 0 : 0;
            
            dayMeso += m; dayGem += gem; dayFrag += frag; daySub += sub;

            if (rec.charId && mvpDataMap[rec.charId]) {
                let mapNode = mvpDataMap[rec.charId];
                mapNode.mesoSum += m;
                mapNode.subSum += sub;
                mapNode.totalMin += 30;
                mapNode.recordsCount += 1;
            }
        });

        if (i < 7) {
            totalMeso7 += dayMeso; totalGem7 += dayGem; totalFrag7 += dayFrag; totalSub7 += daySub;
            totalSessions7 += dayRecords.length;
        }
        totalMeso30 += dayMeso; totalGem30 += dayGem; totalFrag30 += dayFrag; totalSub30 += daySub;
        totalSessions30 += dayRecords.length;
    }

    let totalHours7 = (totalSessions7 * 30 / 60).toFixed(1);
    let totalHours30 = (totalSessions30 * 30 / 60).toFixed(1);
    let hourlyMesoRate7 = totalSessions7 > 0 ? Math.floor(totalMeso7 / (totalSessions7 * 0.5)) : 0;
    let hourlyMesoRate30 = totalSessions30 > 0 ? Math.floor(totalMeso30 / (totalSessions30 * 0.5)) : 0;

    let slotsArray = Object.values(mvpDataMap).filter(s => {
        const meta = JSON.parse(localStorage.getItem(`maple_char_data_${s.id}`) || '{}');
        return !!meta.name;
    });

    let maxIncomeVal = Math.max(...slotsArray.map(s => s.mesoSum + s.subSum), 1);
    let maxTimeVal = Math.max(...slotsArray.map(s => s.totalMin), 1);

    let incomeRankedList = [...slotsArray].sort((a,b) => (b.mesoSum + b.subSum) - (a.mesoSum + a.subSum));
    let grindRankedList = [...slotsArray].sort((a,b) => b.totalMin - a.totalMin);

    let incomeLeaderboardHtml = "";
    incomeRankedList.forEach((node, index) => {
        const meta = JSON.parse(localStorage.getItem(`maple_char_data_${node.id}`) || '{}');
        const totalEarned = node.mesoSum + node.subSum;
        const percentage = Math.min(100, Math.max(8, Math.floor((totalEarned / maxIncomeVal) * 100)));
        const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🎖️";
        
        incomeLeaderboardHtml += `
            <div class="v14-rank-chart-row">
                <div class="v14-rank-identity">
                    <span class="v14-rank-number">${medal} ${index + 1}위</span>
                    <img class="v14-rank-face" src="${meta.avatar}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';"><span style="display:none; font-size:10px;">🍁</span>
                    <span class="v14-rank-name-text">${meta.name}</span>
                </div>
                <div class="v14-rank-graph-area">
                    <div class="v14-rank-bar-bg">
                        <div class="v14-rank-bar-fill income" style="width: ${percentage}%;"></div>
                    </div>
                </div>
                <div class="v14-rank-value-metrics">${totalEarned.toLocaleString()} Meso</div>
            </div>
        `;
    });
    if(incomeLeaderboardHtml === "") {
        incomeLeaderboardHtml = `<div class="v14-empty-rank-lbl">📡 수입 지표 집계 대상 활성 캐릭터가 없습니다.</div>`;
    }

    let grindLeaderboardHtml = "";
    grindRankedList.forEach((node, index) => {
        const meta = JSON.parse(localStorage.getItem(`maple_char_data_${node.id}`) || '{}');
        const hours = (node.totalMin / 60).toFixed(1);
        const percentage = Math.min(100, Math.max(8, Math.floor((node.totalMin / maxTimeVal) * 100)));
        const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🎖️";

        grindLeaderboardHtml += `
            <div class="v14-rank-chart-row">
                <div class="v14-rank-identity">
                    <span class="v14-rank-number">${medal} ${index + 1}위</span>
                    <img class="v14-rank-face" src="${meta.avatar}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';"><span style="display:none; font-size:10px;">🍁</span>
                    <span class="v14-rank-name-text">${meta.name}</span>
                </div>
                <div class="v14-rank-graph-area">
                    <div class="v14-rank-bar-bg">
                        <div class="v14-rank-bar-fill grind" style="width: ${percentage}%;"></div>
                    </div>
                </div>
                <div class="v14-rank-value-metrics">${hours}시간 (${node.recordsCount}재획)</div>
            </div>
        `;
    });
    if(grindLeaderboardHtml === "") {
        grindLeaderboardHtml = `<div class="v14-empty-rank-lbl">📡 시간 지표 집계 대상 활성 캐릭터가 없습니다.</div>`;
    }

    const startDayIdx = new Date(window.attendanceYear, window.attendanceMonth, 1).getDay();
    const totalDaysCount = new Date(window.attendanceYear, window.attendanceMonth + 1, 0).getDate();
    const manualAttendance = JSON.parse(localStorage.getItem(`manual_attendance_integrated`) || '{}');
    
    let calendarCellsHtml = "";
    
    for (let i = 0; i < startDayIdx; i++) {
        calendarCellsHtml += `<div class="v14-cal-day-blank"></div>`;
    }

    for (let day = 1; day <= totalDaysCount; day++) {
        const yearStr = window.attendanceYear;
        const monthStr = String(window.attendanceMonth + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateKeyStr = `${yearStr}-${monthStr}-${dayStr}`;

        let dayActiveAvatars = [];
        allStoredRecords.filter(r => r.date === dateKeyStr).forEach(r => {
            if (r.charId) {
                const cMeta = JSON.parse(localStorage.getItem(`maple_char_data_${r.charId}`) || '{}');
                if (cMeta.avatar && !dayActiveAvatars.includes(cMeta.avatar)) {
                    dayActiveAvatars.push(cMeta.avatar);
                }
            }
        });

        const isAttended = manualAttendance[dateKeyStr] === true;

        let avatarCirclesMarkup = "";
        if (dayActiveAvatars.length > 0) {
            avatarCirclesMarkup = `<div class="v14-cal-stamp-pad-zone">`;
            dayActiveAvatars.forEach(avUrl => {
                avatarCirclesMarkup += `
                    <div class="v14-cal-stamp-avatar-node" title="사냥 인증 도장">
                        <img src="${avUrl}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';" />
                        <span style="display:none; font-size:12px;">🍁</span>
                    </div>
                `;
            });
            avatarCirclesMarkup += `</div>`;
        }

        calendarCellsHtml += `
            <div class="v14-cal-day-item ${isAttended ? 'is-attended-active' : ''}" onclick="window.toggleIntegratedAttendance('${dateKeyStr}')">
                <div class="v14-cal-number-lbl">${day}</div>
                ${isAttended ? '<div class="v14-cal-stamp-icon">✅</div>' : ''}
                ${avatarCirclesMarkup}
            </div>
        `;
    }

    let bottomContentSegmentHtml = "";
    if (window.overviewIntegratedSubView === 'list') {
        bottomContentSegmentHtml = `
            <div class="v14-timeline-data-card" style="width:100%;">
                <div class="v14-section-title-bar">🏆 OMNI INTEGRATED RANKING LEADERBOARD (전 캐릭터 사냥 종합 랭킹 리더보드)</div>
                <div class="v14-leaderboard-twin-grid">
                    <div class="v14-leaderboard-panel-box">
                        <div class="v14-leaderboard-panel-title">💰 누적 총 획득 수익 랭킹 (순메소 + 부수입)</div>
                        ${incomeLeaderboardHtml}
                    </div>
                    <div class="v14-leaderboard-panel-box">
                        <div class="v14-leaderboard-panel-title">⏱️ 누적 사냥 누적 가동 시간 랭킹 (총 시간단위)</div>
                        ${grindLeaderboardHtml}
                    </div>
                </div>
            </div>
        `;
    } else {
        bottomContentSegmentHtml = `
            <div class="v14-timeline-data-card" style="width:100%;">
                <div class="v14-section-title-bar">📅 CHRONO INTEGRATED CALENDAR ENGINE (전 캐릭터 사냥 출석 달력)</div>
                <div class="v14-embedded-calendar-frame">
                    <div class="v14-cal-stepper-row">
                        <button type="button" class="v14-cal-step-btn" onclick="window.changeIntegratedMonth(-1)">◀ 이전달</button>
                        <span class="v14-cal-month-text">${window.attendanceYear}년 ${String(window.attendanceMonth + 1).padStart(2, '0')}월</span>
                        <button type="button" class="v14-cal-step-btn" onclick="window.changeIntegratedMonth(1)">다음달 ▶</button>
                    </div>
                    <div class="v14-cal-weekdays-grid">
                        <div class="v14-cal-header-cell v14-cal-cell-sun">일</div>
                        <div class="v14-cal-header-cell">월</div>
                        <div class="v14-cal-header-cell">화</div>
                        <div class="v14-cal-header-cell " >수</div>
                        <div class="v14-cal-header-cell " >목</div>
                        <div class="v14-cal-header-cell " >금</div>
                        <div class="v14-cal-header-cell v14-cal-cell-sat">토</div>
                    </div>
                    <div class="v14-cal-days-matrix-grid">
                        ${calendarCellsHtml}
                    </div>
                </div>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="v14-overview-wrapper">
            ${innerTabBarHtml}
            
            <div style="width: 100%;">
                <div class="v14-section-title-bar-noborder">📊 OMNI INTEGRATED VOLUME ACCUMULATION (전체 캐릭터 결산 누적 지표)</div>
                <div class="v14-bottom-summary-grid" style="grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 4px;">
                    
                    <div class="v14-summary-bento-box info-report-box">
                        <div class="v14-bento-label">📂 최근 7일 전 슬롯 통합 결산 통계 리포트</div>
                        <div class="v14-bento-integrated-text-grid">
                            <span>💰 순메소: <span class="v14-stat-accent-p">${totalMeso7.toLocaleString()} Meso</span></span>
                            <span>⏱️ 총 사냥시간: <span class="v14-stat-accent-b">${totalHours7}시간 (${totalSessions7}재획)</span></span>
                            <span>💵 부수입: <span class="v14-stat-accent-o">+ ${totalSub7.toLocaleString()}</span></span>
                            <span>📈 평균 시급 효율: <span class="v14-stat-accent-g">${(hourlyMesoRate7/10000).toFixed(0)}만/h</span></span>
                            <span>💎 코어 젬스톤: <span class="v14-stat-accent-p">+ ${totalGem7} EA</span></span>
                            <span>✨ 에르다 조각: <span class="v14-stat-accent-v">+ ${totalFrag7} EA</span></span>
                        </div>
                    </div>

                    <div class="v14-summary-bento-box info-report-box">
                        <div class="v14-bento-label">📅 최근 30일(한달) 전 슬롯 통합 결산 통계 리포트</div>
                        <div class="v14-bento-integrated-text-grid">
                            <span>💰 순메소: <span class="v14-stat-accent-p">${totalMeso30.toLocaleString()} Meso</span></span>
                            <span>⏱️ 총 사냥시간: <span class="v14-stat-accent-b">${totalHours30}시간 (${totalSessions30}재획)</span></span>
                            <span>💵 부수입: <span class="v14-stat-accent-o">+ ${totalSub30.toLocaleString()}</span></span>
                            <span>📈 평균 시급 효율: <span class="v14-stat-accent-g">${(hourlyMesoRate30/10000).toFixed(0)}만/h</span></span>
                            <span>💎 코어 젬스톤: <span class="v14-stat-accent-p">+ ${totalGem30} EA</span></span>
                            <span>✨ 에르다 조각: <span class="v14-stat-accent-v">+ ${totalFrag30} EA</span></span>
                        </div>
                    </div>

                </div>
            </div>

            <div style="display:flex; gap:6px; margin: 2px 0;">
                <button type="button" class="v14-back-list-btn filter-toggle-btn" style="background:${window.overviewIntegratedSubView === 'list' ? 'var(--btn-active-bg, #ede9f8)' : 'var(--card-bg, #ffffff)'};" onclick="window.switchIntegratedSubView('list');">🏆 랭킹 리더보드 그래프 보기</button>
                <button type="button" class="v14-back-list-btn filter-toggle-btn" style="background:${window.overviewIntegratedSubView === 'calendar' ? 'var(--btn-active-bg, #ede9f8)' : 'var(--card-bg, #ffffff)'};" onclick="window.switchIntegratedSubView('calendar');">📅 통합 출석 달력 보기</button>
            </div>

            ${bottomContentSegmentHtml}

        </div>
    `;
    return;
}
};