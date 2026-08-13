/**
 * ============================================================================
 * 🏹 MAPLE OMNI V14 - js/mvp/mvp.js [HYBRID PREMIUM SYSTEM INJECTION CORE]
 * 설명: 구형 메부자의 모든 데이터 계산식(옥션 3% 수수료 자동 공제, 묶음 역산 등)을 완벽히 승계하고,
 * 화이트/다크 모드 하이브리드 가독성 패치, 본서버 전체 목록 동기화, 캐시템 마일리지 복합 연산 로직을 유지했습니다.
 * 규칙: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 달아줍니다.
 * ============================================================================
 */

// 💡 [초보자 가이드] 브라우저 데이터 유실 및 다른 탭 간의 키 충돌을 원천 차단하기 위해 유니크한 독립 스토리지 명칭을 할당합니다.
let omniMvpSimData = JSON.parse(localStorage.getItem('omni_v14_mvp_sim_data')) || [];
let omniMvpInventoryData = JSON.parse(localStorage.getItem('omni_v14_mvp_inventory_data')) || [];
let omniMvpRecordData = JSON.parse(localStorage.getItem('omni_v14_mvp_record_data')) || [];
let omniMvpMonthlyCharges = JSON.parse(localStorage.getItem('omni_v14_mvp_monthly_charges')) || {};
let omniMvpCustomPresets = JSON.parse(localStorage.getItem('omni_v14_mvp_custom_presets')) || [];

// 🪐 변하지 않는 고정형 기본 캐시 아이템 프리셋 구성 (마일리지 최대 30% 적용 가능 플래그 탑재)
const OMNI_MVP_BASE_PRESETS = [
    { id: "base_royal", name: "메이플 로얄 스타일", amount: 45, cash: 99000, mileageAble: false },
    { id: "base_wonder", name: "위습의 원더베리", amount: 11, cash: 54000, mileageAble: false },
    { id: "base_pkarma", name: "플래티넘 카르마의 가위", amount: 1, cash: 5900, mileageAble: true } // 가위 원가는 5900원, 마일리지 30% 가능
];

/**
 * 🧱 [화면 자동 주입 매커니즘]
 * 설명: index.html에 하드코딩되지 않은 유연한 프리미엄 하이브리드 메부자 스켈레톤 마크업을 자바스크립트가 로딩되는 순간 직접 조립해 넣습니다.
 */
function injectMvpPremiumLayoutFramework() {
    const targetContainer = document.getElementById('mvpContent');
    if (!targetContainer) return;

    if (document.getElementById('mvpModuleRoot')) return;

    targetContainer.innerHTML = `
        <div id="mvpModuleRoot" class="mvp-module-wrapper">
            <div class="mvp-toolbar-panel">
                <div class="mvp-toolbar-group">
                    <span style="font-size:13px; font-weight:800; color:var(--builder-text-main);">📅 정산 월 필터:</span>
                    <input type="month" id="mvpMonthFilter" class="mvp-inline-input" style="padding: 5px 10px;" onchange="window.changeMvpMonthFilterTrigger()">
                    
                    <span style="font-size:13px; font-weight:800; color:var(--builder-text-main); margin-left:15px;">🌐 서버:</span>
                    <select id="mvpServerSelect" class="mvp-inline-input" style="padding: 5px 10px;" onchange="window.saveMvpServerConfig()">
                        <option value="스카니아">스카니아</option>
                        <option value="루나">루나</option>
                        <option value="제니스">제니스</option>
                        <option value="크로아">크로아</option>
                        <option value="유니온">유니온</option>
                        <option value="엘리시움">엘리시움</option>
                        <option value="이노시스">이노시스</option>
                        <option value="레드">레드</option>
                        <option value="오로라">오로라</option>
                        <option value="아케인">아케인</option>
                        <option value="노바">노바</option>
                        <option value="버닝">버닝</option>
                        <option value="버닝2">버닝2</option>
                        <option value="버닝3">버닝3</option>
                    </select>
                </div>
                <div class="mvp-toolbar-group">
                    <button onclick="window.resetMvpAllCoreData()" class="mvp-util-btn" style="border-color: var(--omni-accent-red); color: var(--omni-accent-red);">🧹 전체 리셋</button>
                    <button onclick="window.exportMvpIntegratedJsonPacket()" class="mvp-util-btn">📤 백업</button>
                    <button onclick="document.getElementById('mvpImportFileHidden').click()" class="mvp-util-btn">📂 복구</button>
                    <input type="file" id="mvpImportFileHidden" style="display: none;" accept=".json" onchange="window.importMvpIntegratedJsonPacket(event)">
                </div>
            </div>

            <div class="mvp-dashboard-grid">
                <div class="mvp-premium-card">
                    <div class="mvp-stat-title">
                        <span>CASH FLOW STATUS (이번 달 실 지출 한도 기준 현황)</span>
                    </div>
                    <div class="mvp-stat-row"><span>이번 달 목표 MVP 등록액</span> <input type="text" id="mvpChargeAmount" class="mvp-inline-input" style="width: 130px; text-align: right;" oninput="window.applyMvpRealtimeComma(this); window.saveMvpMonthlyChargeBudget();"></div>
                    <div class="mvp-stat-row"><span>총 반영 MVP 누적액 (한도 대비)</span> <span><span id="mvpTotalUsedCash">0</span>원</span></div>
                    <div class="mvp-stat-row"><span>실제 현금 지출 합계 (할인 반영)</span> <span><span id="mvpActualRealSpentCash">0</span>원</span></div>
                    <div class="mvp-stat-row"><span>남은 가용 MVP 한도</span> <strong id="mvpRemainCash" style="color: var(--builder-text-main); font-size: 15px;">0</strong></div>
                    <div class="mvp-stat-row"><span>정산 완료 최종 손해액</span> <strong id="mvpTotalLossAmount">0원</strong></div>
                    <div class="mvp-stat-row"><span>현재 시점 손해율</span> <span><span id="mvpTotalLossRate">0</span>%</span></div>
                </div>
                
                <div class="mvp-premium-card">
                    <div class="mvp-stat-title">EXCHANGE PROCESS (경매장 메소 환전 리포트)</div>
                    <div class="mvp-stat-row"><span>충전액 환산 목표 메소 한도</span> <span><span id="mvpTargetMeso">0</span></span></div>
                    <div class="mvp-stat-row"><span style="color: var(--omni-accent-blue);">달성 누적 메소 (옥션 수수료 3% 제외)</span> <strong id="mvpTotalExchangedMeso" class="profit-plus" style="font-size: 17px;">0</strong></div>
                    <div class="mvp-stat-row"><span>목표까지 남은 메소 잔액</span> <strong id="mvpRemainMeso" style="color: var(--builder-text-sub);">0</strong></div>
                    <div class="mvp-progress-container"><div id="mvpMesoProgressBar" class="mvp-progress-bar"></div></div>
                    
                    <div style="margin-top: 15px; padding-top: 12px; border-top: 1px dashed var(--builder-border-dashed); display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 12px; font-weight: 700; color: var(--builder-text-sub);">보유 마일리지 잔고:</span>
                        <input type="text" id="mvpMileageAmount" class="mvp-inline-input" style="width: 140px; padding: 5px; text-align: right;" placeholder="보유 마일리지 입력" oninput="window.applyMvpRealtimeComma(this); window.saveMvpMileageBalance();">
                    </div>
                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dotted var(--builder-border-dashed); display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 12px; font-weight: 700; color: var(--builder-text-sub);">기존 보유 메소 잔고 합산:</span>
                        <input type="text" id="mvpExistingMeso" class="mvp-inline-input" style="width: 140px; padding: 5px; text-align: right;" placeholder="보유 메소 입력" oninput="window.applyMvpRealtimeComma(this); window.saveMvpExistingMesoBalance();">
                    </div>
                    <div class="mvp-stat-row" style="margin-top: 8px; font-size: 13px;"><span>💰 지갑 내 총 보유 메소 (기존 + 달성):</span> <strong id="mvpTotalOwnedMeso" style="color: var(--builder-text-main);">0</strong></div>
                </div>
            </div>

            <div class="mvp-premium-card" style="padding:10px 20px; margin-bottom:16px; display:flex; align-items:center; gap:10px;">
                <span style="font-weight:800; font-size:13px; color:var(--builder-text-sub);">📈 실시간 메소 단가 설정 (1억당):</span>
                <input type="number" id="mvpMarketPrice" value="1600" class="mvp-inline-input" style="width: 80px; font-weight: 800; text-align: center; padding:5px;" oninput="window.triggerMvpGlobalRecalc()">
                <span style="font-size:12px; font-weight:700; color:var(--builder-text-sub);">원</span>
            </div>

            <div class="mvp-pill-tabs">
                <button class="mvp-tab-btn active" onclick="window.switchMvpInternalSubTab('mvp-sim-tab-view', event)">📊 시뮬레이션</button>
                <button class="mvp-tab-btn" onclick="window.switchMvpInternalSubTab('mvp-inv-tab-view', event)">🛒 구매/재고 관리</button>
                <button class="mvp-tab-btn" onclick="window.switchMvpInternalSubTab('mvp-record-tab-view', event)">📝 판매 기록장</button>
            </div>

            <div id="mvp-sim-tab-view" class="mvp-sub-page-content" style="display: block;">
                <div class="mvp-premium-card" style="background: var(--builder-card-bg); border-color: var(--builder-border-dashed);">
                    <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 10px;">
                        <select id="mvpSimPreset" class="mvp-inline-input" onchange="window.applyMvpPresetToFields('sim')"></select>
                        <button class="mvp-util-btn" onclick="window.saveMvpInputAsCustomPreset('sim')">⭐ 내 프리셋 저장</button>
                        <button class="mvp-del-btn" style="padding: 7px 10px;" onclick="window.deleteMvpSelectedCustomPreset('sim')">삭제</button>
                        <input type="text" id="mvpSimCategory" class="mvp-inline-input" style="width: 140px;" placeholder="품목명">
                        <input type="number" id="mvpSimAmount" class="mvp-inline-input" style="width: 65px; text-align: center;" placeholder="개수">
                        <input type="text" id="mvpSimCash" class="mvp-inline-input" style="width: 90px; text-align: right;" placeholder="캐시가" oninput="window.applyMvpRealtimeComma(this)">
                        
                        <label style="font-size:12px; font-weight:800; display:flex; align-items:center; gap:4px; color: var(--builder-text-main);">
                            <input type="checkbox" id="mvpSimMileageAble"> 마일리지 30% 적용
                        </label>

                        <button onclick="window.addMvpSimulationItemAction()" class="mvp-action-btn">시뮬레이션 추가 ⚡</button>
                    </div>
                </div>
                <div id="mvpSimTabContainer"></div>
            </div>

            <div id="mvp-inv-tab-view" class="mvp-sub-page-content" style="display: none;">
                <div class="mvp-premium-card" style="background: var(--builder-card-bg); border-color: var(--builder-border-dashed);">
                    <div style="display: flex; gap: 8px; margin-bottom: 12px; align-items: center;">
                        <select id="mvpInvPreset" class="mvp-inline-input" onchange="window.applyMvpPresetToFields('inv')"></select>
                        <button class="mvp-util-btn" onclick="window.saveMvpInputAsCustomPreset('inv')">⭐ 내 프리셋 저장</button>
                        <button class="mvp-del-btn" style="padding: 7px 10px;" onclick="window.deleteMvpSelectedCustomPreset('inv')">삭제</button>
                    </div>
                    <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; margin-bottom: 12px;">
                        <input type="date" id="mvpInvDate" class="mvp-inline-input">
                        <input type="text" id="mvpInvCategory" class="mvp-inline-input" placeholder="구매한 품목명 (예: 메이플 로얄 스타일)">
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr) auto; gap: 12px; background: var(--builder-input-bg); border: 1px solid var(--builder-border); padding: 14px; border-radius: 8px; align-items: center;">
                        <div>
                            <label style="font-size:11px; font-weight:800; color:var(--builder-text-sub); display:block; margin-bottom:4px;">몇 묶음 샀나요? (세트 수량)</label>
                            <input type="number" id="mvpInvSetCount" value="1" class="mvp-inline-input" style="width:70%; text-align:center;"> <span style="font-size:12px; font-weight:700;">묶음</span>
                        </div>
                        <div>
                            <label style="font-size:11px; font-weight:800; color:var(--builder-text-sub); display:block; margin-bottom:4px;">1묶음 안의 개수 (패키지 규격)</label>
                            <input type="number" id="mvpInvAmount" value="10" class="mvp-inline-input" style="width:70%; text-align:center;"> <span style="font-size:12px; font-weight:700;">개입</span>
                        </div>
                        <div>
                            <label style="font-size:11px; font-weight:800; color:var(--builder-text-sub); display:block; margin-bottom:4px;">1묶음당 지출 캐시 비용</label>
                            <input type="text" id="mvpInvCash" class="mvp-inline-input" style="width:70%; text-align:right;" placeholder="ex) 22,000" oninput="window.applyMvpRealtimeComma(this)"> <span style="font-size:12px; font-weight:700;">원</span>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:4px; align-items:flex-start;">
                            <label style="font-size:11px; font-weight:800; color:var(--builder-text-main); display:flex; align-items:center; gap:4px;">
                                <input type="checkbox" id="mvpInvMileageAble"> 마일리지 30% 사용
                            </label>
                            <button onclick="window.addMvpInventoryStockAction()" class="mvp-action-btn" style="background:var(--builder-card-bg); border-color:var(--builder-text-accent); color:var(--builder-text-accent); height:35px; padding:0 15px; font-size:12px;">🛒 구매 등록</button>
                        </div>
                    </div>
                </div>
                <div class="mvp-premium-card">
                    <div class="mvp-stat-title">📦 현재 보유중인 재고 (현금 지출 차감 적용됨)</div>
                    <table class="mvp-premium-table">
                        <thead>
                            <tr><th>구매일</th><th style="text-align:left; padding-left:15px;">품목 (개수)</th><th>MVP 반영(지출캐시)</th><th>실제 지출 현금</th><th>실제 판매가(메소)</th><th>예상 손익</th><th>관리</th></tr>
                        </thead>
                        <tbody id="mvp-inventory-list-tbody"></tbody>
                    </table>
                </div>
            </div>

            <div id="mvp-record-tab-view" class="mvp-sub-page-content" style="display: none;">
                <div class="mvp-premium-card">
                    <div class="mvp-stat-title">📝 최종 판매 완료 기록 <span style="font-size:11px; font-weight:normal; color:var(--omni-accent-red); margin-left:10px;">(※ 주의: 판매 메소는 수수료 공제 전 '경매장 등록 원가'를 적으세요!)</span></div>
                    <table class="mvp-premium-table">
                        <thead>
                            <tr><th>판매일</th><th style="text-align:left;">품목(개수)</th><th>총 판매 메소(원금)</th><th>MVP 반영액</th><th>실지출 현금</th><th>회수액(원)</th><th>실 현금손익</th><th>개당 손익</th><th>관리</th></tr>
                        </thead>
                        <tbody id="mvp-record-list-tbody"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

window.initOmniMvpModule = function() {
    console.log("[MVP ENGINE] 메부자 옴니 최적화 레이아웃 그리기 동기화 집행");
    injectMvpPremiumLayoutFramework();

    if (!document.getElementById('mvpModuleRoot')) return;

    const serverSelect = document.getElementById('mvpServerSelect');
    const marketPrice = document.getElementById('mvpMarketPrice');
    const existingMeso = document.getElementById('mvpExistingMeso');
    const mileageInput = document.getElementById('mvpMileageAmount');
    const monthFilter = document.getElementById('mvpMonthFilter');
    const invDate = document.getElementById('mvpInvDate');

    if (serverSelect) serverSelect.value = localStorage.getItem('omni_v14_mvp_server') || '엘리시움';
    if (marketPrice) marketPrice.value = localStorage.getItem('omni_v14_mvp_market_price') || 1600;
    if (existingMeso && localStorage.getItem('omni_v14_mvp_existing_meso')) {
        existingMeso.value = parseMvpNum(localStorage.getItem('omni_v14_mvp_existing_meso')).toLocaleString();
    }
    if (mileageInput && localStorage.getItem('omni_v14_mvp_mileage')) {
        mileageInput.value = parseMvpNum(localStorage.getItem('omni_v14_mvp_mileage')).toLocaleString();
    }

    const currentYearMonth = new Date().toISOString().substring(0, 7);
    if (monthFilter && !monthFilter.value) monthFilter.value = currentYearMonth;
    if (invDate && !invDate.value) invDate.value = new Date().toISOString().substring(0, 10);

    renderMvpDropdownPresets();
    renderMvpSimulationCards();
    renderMvpInventoryListTable();
    renderMvpFinalRecordListTable();
    calculateMvpIntegratedStats();
};

window.resetMvpAllCoreData = function() {
    if (confirm("⚠️ 경고: 저장된 메부자 시뮬레이션, 구매 재고, 판매 기록이 완전히 영구 소멸됩니다.")) {
        if (confirm("정말로 포맷팅을 집행할까요? 공정 완료 시 복구할 수 없습니다.")) {
            localStorage.removeItem('omni_v14_mvp_sim_data');
            localStorage.removeItem('omni_v14_mvp_inventory_data');
            localStorage.removeItem('omni_v14_mvp_record_data');
            localStorage.removeItem('omni_v14_mvp_monthly_charges');
            localStorage.removeItem('omni_v14_mvp_custom_presets');
            localStorage.removeItem('omni_v14_mvp_server');
            localStorage.removeItem('omni_v14_mvp_market_price');
            localStorage.removeItem('omni_v14_mvp_existing_meso');
            localStorage.removeItem('omni_v14_mvp_mileage');
            alert("모든 MVP 정산 관제 기록 장고가 세척 완료되었습니다.");
            location.reload();
        }
    }
};

function parseMvpNum(val) {
    if (val === undefined || val === null || val === '') return 0;
    return parseFloat(val.toString().replace(/,/g, '')) || 0;
}

window.applyMvpRealtimeComma = function(obj) {
    let cursorPosition = obj.selectionStart;
    let oldLength = obj.value.length;
    let num = parseMvpNum(obj.value);
    let newV = (num === 0 && obj.value === "") ? "" : num.toLocaleString();
    obj.value = newV;
    let newLength = obj.value.length;
    cursorPosition = cursorPosition + (newLength - oldLength);
    obj.setSelectionRange(cursorPosition, cursorPosition);
};

window.saveMvpServerConfig = function() {
    localStorage.setItem('omni_v14_mvp_server', document.getElementById('mvpServerSelect').value);
};

window.saveMvpMileageBalance = function() {
    const val = parseMvpNum(document.getElementById('mvpMileageAmount').value);
    localStorage.setItem('omni_v14_mvp_mileage', val);
    calculateMvpIntegratedStats();
};

window.triggerMvpGlobalRecalc = function() {
    localStorage.setItem('omni_v14_mvp_market_price', document.getElementById('mvpMarketPrice').value);
    renderMvpSimulationCards();
    renderMvpInventoryListTable();
    renderMvpFinalRecordListTable();
    calculateMvpIntegratedStats();
};

window.changeMvpMonthFilterTrigger = function() {
    renderMvpSimulationCards();
    renderMvpInventoryListTable();
    renderMvpFinalRecordListTable();
    calculateMvpIntegratedStats();
};

function getMvpMergedPresets() { 
    return [...OMNI_MVP_BASE_PRESETS, ...omniMvpCustomPresets]; 
}

function renderMvpDropdownPresets() {
    const selects = ['mvpSimPreset', 'mvpInvPreset'];
    selects.forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        sel.innerHTML = '<option value="">🌟 자주 쓰는 품목 (선택 시 자동입력)</option>';
        
        sel.innerHTML += '<optgroup label="[기본 프리셋 항목]">';
        OMNI_MVP_BASE_PRESETS.forEach(p => { 
            sel.innerHTML += `<option value="${p.id}">${p.name} (${p.amount}개) - ${p.cash.toLocaleString()}원</option>`; 
        });
        sel.innerHTML += '</optgroup>';

        if (omniMvpCustomPresets.length > 0) {
            sel.innerHTML += '<optgroup label="[커스텀 추가 항목]">';
            omniMvpCustomPresets.forEach(p => { 
                sel.innerHTML += `<option value="${p.id}">${p.name} (${p.amount}개) - ${p.cash.toLocaleString()}원</option>`; 
            });
            sel.innerHTML += '</optgroup>';
        }
        sel.innerHTML += '<option value="custom">✏️ 직접 입력하기 (빈칸)</option>';
    });
}

window.applyMvpPresetToFields = function(tabType) {
    const suffix = tabType === 'sim' ? 'Sim' : 'Inv';
    const selectedValue = document.getElementById('mvp' + suffix + 'Preset').value;
    
    const nameField = document.getElementById('mvp' + suffix + 'Category');
    const amountField = document.getElementById('mvp' + suffix + 'Amount');
    const cashField = document.getElementById('mvp' + suffix + 'Cash');
    const mableCheck = document.getElementById('mvp' + suffix + 'MileageAble');

    if (!selectedValue || selectedValue === 'custom') {
        if (nameField) nameField.value = '';
        if (amountField) amountField.value = '';
        if (cashField) cashField.value = '';
        if (mableCheck) mableCheck.checked = false;
        if (tabType === 'inv') document.getElementById('mvpInvSetCount').value = '1';
        return;
    }

    const matched = getMvpMergedPresets().find(p => p.id === selectedValue);
    if (matched) {
        if (nameField) nameField.value = matched.name;
        if (amountField) amountField.value = matched.amount;
        if (cashField) cashField.value = matched.cash.toLocaleString();
        if (mableCheck) mableCheck.checked = !!matched.mileageAble;
        if (tabType === 'inv') document.getElementById('mvpInvSetCount').value = '1';
    }
};

window.saveMvpInputAsCustomPreset = function(tabType) {
    const suffix = tabType === 'sim' ? 'Sim' : 'Inv';
    const name = document.getElementById('mvp' + suffix + 'Category').value.trim();
    const amount = parseMvpNum(document.getElementById('mvp' + suffix + 'Amount').value);
    const cash = parseMvpNum(document.getElementById('mvp' + suffix + 'Cash').value);
    const mableCheck = document.getElementById('mvp' + suffix + 'MileageAble');

    if (!name || amount <= 0 || cash <= 0) {
        return alert("품목 기입 명세 데이터에 공백이 없는지 재점검 후 눌러주세요!");
    }

    const newCustomNode = { 
        id: 'custom_' + Date.now(), 
        name, 
        amount, 
        cash, 
        mileageAble: mableCheck ? mableCheck.checked : false 
    };
    omniMvpCustomPresets.push(newCustomNode);
    localStorage.setItem('omni_v14_mvp_custom_presets', JSON.stringify(omniMvpCustomPresets));
    
    renderMvpDropdownPresets();
    document.getElementById('mvp' + suffix + 'Preset').value = newCustomNode.id;
    alert(`🎯 나만의 프리셋 창고에 [${name}] 항목이 신규 적재 보존되었습니다.`);
};

window.deleteMvpSelectedCustomPreset = function(tabType) {
    const suffix = tabType === 'sim' ? 'Sim' : 'Inv';
    const selector = document.getElementById('mvp' + suffix + 'Preset');
    const targetId = selector.value;

    if (!targetId || targetId === 'custom') return alert("삭제 조치할 프리셋 라인을 지정 후 실행해 주세요.");
    if (targetId.startsWith('base_')) return alert("코어 제조사 빌트인 프리셋은 시스템 보호 조치로 파쇄가 금지됩니다.");

    if (confirm("선택하신 유저 프리셋 기록을 증발 삭제할까요?")) {
        omniMvpCustomPresets = omniMvpCustomPresets.filter(p => p.id !== targetId);
        localStorage.setItem('omni_v14_mvp_custom_presets', JSON.stringify(omniMvpCustomPresets));
        renderMvpDropdownPresets();
        window.applyMvpPresetToFields(tabType);
    }
};

window.saveMvpExistingMesoBalance = function() {
    const val = parseMvpNum(document.getElementById('mvpExistingMeso').value);
    localStorage.setItem('omni_v14_mvp_existing_meso', val);
    calculateMvpIntegratedStats();
};

window.saveMvpMonthlyChargeBudget = function() {
    const month = document.getElementById('mvpMonthFilter').value || new Date().toISOString().substring(0, 7);
    const chargeInput = document.getElementById('mvpChargeAmount');
    let rawValue = parseMvpNum(chargeInput.value);
    omniMvpMonthlyCharges[month] = rawValue;
    localStorage.setItem('omni_v14_mvp_monthly_charges', JSON.stringify(omniMvpMonthlyCharges));
    calculateMvpIntegratedStats();
};

function calculateMvpIntegratedStats() {
    const month = document.getElementById('mvpMonthFilter').value || new Date().toISOString().substring(0, 7);
    const chargeInput = document.getElementById('mvpChargeAmount');

    if (document.activeElement !== chargeInput) {
        let currentMonthCharge = omniMvpMonthlyCharges[month] !== undefined ? omniMvpMonthlyCharges[month] : (parseMvpNum(localStorage.getItem('omni_v14_mvp_charge_amount')) || 1530000);
        if (chargeInput) chargeInput.value = currentMonthCharge.toLocaleString();
    }

    const totalBudgetLimit = parseMvpNum(chargeInput ? chargeInput.value : 0);
    const currentMesoRate = parseMvpNum(document.getElementById('mvpMarketPrice').value) || 1600;
    
    const moneyToMesoUnitRatio = currentMesoRate / 100000000;
    const finalTargetMesoGoal = Math.floor(totalBudgetLimit / moneyToMesoUnitRatio);

    let totalUsedCashAccum = 0;          // MVP 반영 점수 누적용
    let totalRealSpentCashAccum = 0;     // 실제 지출된 순수 현금 누적용
    let totalExchangedMesoAccum = 0;     // 누적 획득 메소
    let totalRealReturnedCashAmount = 0; // 실 현금 환산액
    let totalPureSoldProductCost = 0;    // 정산 완료된 품목의 MVP 누적액
    let totalActualSoldSpentCash = 0;    // 정산 완료된 품목의 실제 현금 지출액

    const filteredRecords = omniMvpRecordData.filter(item => item.date.startsWith(month));
    filteredRecords.forEach(item => {
        totalUsedCashAccum += item.cash; // MVP 인정 금액 기준
        totalPureSoldProductCost += item.cash;
        
        // 실제 지출 기록이 없다면 이전 버전 호환성을 위해 cash와 동일 처리
        const actualSpent = item.realSpent !== undefined ? item.realSpent : item.cash;
        totalRealSpentCashAccum += actualSpent;
        totalActualSoldSpentCash += actualSpent;

        let netAuctionIncomeMeso = Math.floor(item.meso * 0.97);
        totalExchangedMesoAccum += netAuctionIncomeMeso;
        totalRealReturnedCashAmount += Math.floor(netAuctionIncomeMeso * moneyToMesoUnitRatio);
    });

    omniMvpInventoryData.filter(item => item.buyDate.startsWith(month)).forEach(item => {
        totalUsedCashAccum += item.cash; // MVP 반영 금액 누적
        const actualSpent = item.realSpent !== undefined ? item.realSpent : item.cash;
        totalRealSpentCashAccum += actualSpent; // 실지출 캐시액 누적
    });

    const totalRemainingCashWallet = totalBudgetLimit - totalUsedCashAccum;
    const remainingMesoDistance = finalTargetMesoGoal - totalExchangedMesoAccum;
    
    // 최종 손해율은 실제 지출한 현금액(실지출 캐시) 대비 정산 회수한 현금액 기준
    const finalCalculatedLossCash = totalActualSoldSpentCash - totalRealReturnedCashAmount;
    const finalLossPercentage = totalActualSoldSpentCash > 0 ? (finalCalculatedLossCash / totalActualSoldSpentCash * 100).toFixed(2) : 0;

    const lossDisplayEl = document.getElementById('mvpTotalLossAmount');
    if (lossDisplayEl) {
        if (finalCalculatedLossCash > 0) {
            lossDisplayEl.innerText = `-${finalCalculatedLossCash.toLocaleString()}원`;
            lossDisplayEl.className = "profit-minus";
        } else if (finalCalculatedLossCash < 0) {
            lossDisplayEl.innerText = `+${Math.abs(finalCalculatedLossCash).toLocaleString()}원 (흑자 이득 발생)`;
            lossDisplayEl.className = "profit-plus";
        } else {
            lossDisplayEl.innerText = "0원";
            lossDisplayEl.className = "";
        }
    }

    const userWalletBaseMeso = parseMvpNum(document.getElementById('mvpExistingMeso')?.value || 0);
    const finalTotalOwnedMesoSum = userWalletBaseMeso + totalExchangedMesoAccum;

    const doc = id => document.getElementById(id);
    if (doc('mvpTargetMeso')) doc('mvpTargetMeso').innerText = finalTargetMesoGoal.toLocaleString() + " 메소";
    if (doc('mvpTotalUsedCash')) doc('mvpTotalUsedCash').innerText = totalUsedCashAccum.toLocaleString() + "원";
    if (doc('mvpActualRealSpentCash')) doc('mvpActualRealSpentCash').innerText = totalRealSpentCashAccum.toLocaleString() + "원";
    if (doc('mvpRemainCash')) doc('mvpRemainCash').innerText = totalRemainingCashWallet.toLocaleString() + "원";
    if (doc('mvpTotalExchangedMeso')) doc('mvpTotalExchangedMeso').innerText = totalExchangedMesoAccum.toLocaleString();
    if (doc('mvpTotalOwnedMeso')) doc('mvpTotalOwnedMeso').innerText = finalTotalOwnedMesoSum.toLocaleString();
    
    if (doc('mvpRemainMeso')) {
        if (finalTargetMesoGoal <= 0 && totalExchangedMesoAccum === 0) {
            doc('mvpRemainMeso').innerText = "0";
        } else {
            doc('mvpRemainMeso').innerText = remainingMesoDistance > 0 ? remainingMesoDistance.toLocaleString() : "🎯 한도 정산 완료 (목표 돌파 달성!)";
        }
    }
    if (doc('mvpTotalLossRate')) doc('mvpTotalLossRate').innerText = finalLossPercentage;

    const targetProgressPercent = finalTargetMesoGoal > 0 ? Math.min((totalExchangedMesoAccum / finalTargetMesoGoal) * 100, 100) : 0;
    const progressBarNode = doc('mvpMesoProgressBar');
    if (progressBarNode) progressBarNode.style.width = targetProgressPercent + '%';
}

window.addMvpSimulationItemAction = function() {
    const category = document.getElementById('mvpSimCategory').value.trim();
    const amount = parseMvpNum(document.getElementById('mvpSimAmount').value);
    const cash = parseMvpNum(document.getElementById('mvpSimCash').value);
    const mileageAble = document.getElementById('mvpSimMileageAble').checked;
    const month = document.getElementById('mvpMonthFilter').value || new Date().toISOString().substring(0, 7);

    if (!category || amount <= 0 || cash <= 0) return alert("시뮬레이션 인덱싱을 위한 수치 및 품목명을 기입해 주세요.");

    omniMvpSimData.push({ 
        id: Date.now(), 
        month, 
        category, 
        amount, 
        cash, 
        mileageAble,
        yesterdayMeso: 0, 
        todayMeso: 0 
    });
    localStorage.setItem('omni_v14_mvp_sim_data', JSON.stringify(omniMvpSimData));

    document.getElementById('mvpSimPreset').value = '';
    window.applyMvpPresetToFields('sim');
    renderMvpSimulationCards();
};

window.updateMvpSimRealtimePriceNode = function(id, type, value) {
    const targetItem = omniMvpSimData.find(d => d.id === id);
    if (!targetItem) return;

    targetItem[type] = parseMvpNum(value);
    localStorage.setItem('omni_v14_mvp_sim_data', JSON.stringify(omniMvpSimData));

    const currentRow = document.getElementById(`mvp-sim-row-${id}`);
    const currentMesoRate = parseMvpNum(document.getElementById('mvpMarketPrice').value) || 1600;
    const ratioUnit = currentMesoRate / 100000000;

    const currentUsedActiveMeso = targetItem.todayMeso > 0 ? targetItem.todayMeso : (targetItem.yesterdayMeso || 0);
    const calculatedBackCash = Math.floor(currentUsedActiveMeso * 0.97 * ratioUnit);
    
    // 시뮬레이션에서도 마일리지 30% 사용에 따른 현금 최적화 반영
    const isMileageAble = !!targetItem.mileageAble;
    const actualCashSpent = isMileageAble ? Math.round(targetItem.cash * 0.7) : targetItem.cash;

    const finalNetProfitResult = calculatedBackCash - actualCashSpent;
    const perUnitProfitString = targetItem.amount > 0 ? Math.floor(finalNetProfitResult / targetItem.amount).toLocaleString() + "원" : "0원";

    const gapDiffMesoValue = (targetItem.todayMeso && targetItem.yesterdayMeso) ? (targetItem.todayMeso - targetItem.yesterdayMeso) : 0;
    const gapCell = currentRow.querySelector('.diff-cell');
    if (gapCell) {
        if (gapDiffMesoValue > 0) { gapCell.innerText = `+${gapDiffMesoValue.toLocaleString()}`; gapCell.className = "diff-cell profit-plus"; }
        else if (gapDiffMesoValue < 0) { gapCell.innerText = gapDiffMesoValue.toLocaleString(); gapCell.className = "diff-cell profit-minus"; }
        else { gapCell.innerText = "-"; gapCell.className = "diff-cell"; }
    }

    const textStyleClass = finalNetProfitResult < 0 ? 'profit-minus' : 'profit-plus';
    currentRow.querySelector('.profit-cell').innerText = finalNetProfitResult.toLocaleString();
    currentRow.querySelector('.profit-cell').className = 'profit-cell ' + textStyleClass;
    currentRow.querySelector('.per-profit-cell').innerText = perUnitProfitString;
    currentRow.querySelector('.per-profit-cell').className = 'per-profit-cell ' + textStyleClass;
};

function renderMvpSimulationCards() {
    const container = document.getElementById('mvpSimTabContainer');
    if (!container) return;
    container.innerHTML = '';

    const currentMonthFilter = document.getElementById('mvpMonthFilter').value;
    const filteredList = omniMvpSimData.filter(item => item.month === currentMonthFilter);

    filteredList.sort((a, b) => a.amount - b.amount);

    const categorizedGroups = filteredList.reduce((acc, obj) => {
        (acc[obj.category] = acc[obj.category] || []).push(obj);
        return acc;
    }, {});

    for (const categoryName in categorizedGroups) {
        const wrapperCard = document.createElement('div');
        wrapperCard.className = 'mvp-premium-card';
        wrapperCard.innerHTML = `
            <div class="mvp-stat-title" style="font-size:13px; font-weight:900;">📦 ${categoryName} 시뮬레이팅 매칭셋</div>
            <table class="mvp-premium-table">
                <thead>
                    <tr><th>구성 개수</th><th>MVP 캐시가</th><th>실제 현금가</th><th>어제 경매장</th><th>오늘 경매장</th><th>시세 차액</th><th>기대 손익</th><th>개당 손익</th><th>제어</th></tr>
                </thead>
                <tbody></tbody>
            </table>
        `;
        
        const tbody = wrapperCard.querySelector('tbody');
        categorizedGroups[categoryName].forEach(item => {
            const tr = document.createElement('tr');
            tr.id = `mvp-sim-row-${item.id}`;
            tbody.appendChild(tr);
            
            const currentMesoRate = parseMvpNum(document.getElementById('mvpMarketPrice').value) || 1600;
            const ratioUnit = currentMesoRate / 100000000;
            const currentUsedActiveMeso = item.todayMeso > 0 ? item.todayMeso : (item.yesterdayMeso || 0);
            const calculatedBackCash = Math.floor(currentUsedActiveMeso * 0.97 * ratioUnit);
            
            // 마일리지 사용 가능 여부에 따른 실지출 가액 환산
            const isMileageAble = !!item.mileageAble;
            const actualCashSpent = isMileageAble ? Math.round(item.cash * 0.7) : item.cash;

            const finalNetProfitResult = calculatedBackCash - actualCashSpent;
            const perUnitProfitString = item.amount > 0 ? Math.floor(finalNetProfitResult / item.amount).toLocaleString() + "원" : "0원";
            const textStyleClass = finalNetProfitResult < 0 ? 'profit-minus' : 'profit-plus';

            const gapDiffMesoValue = (item.todayMeso && item.yesterdayMeso) ? (item.todayMeso - item.yesterdayMeso) : 0;
            let gapString = "-"; let gapClass = "";
            if (gapDiffMesoValue > 0) { gapString = `+${gapDiffMesoValue.toLocaleString()}`; gapClass = "profit-plus"; }
            else if (gapDiffMesoValue < 0) { gapString = gapDiffMesoValue.toLocaleString(); gapClass = "profit-minus"; }

            tr.innerHTML = `
                <td><span style="background:var(--builder-input-bg); color:var(--builder-text-main); padding:3px 8px; border-radius:4px; font-weight:800;">${item.amount}개 구성</span></td>
                <td><span style="color:var(--builder-text-sub);">${item.cash.toLocaleString()}</span></td>
                <td><strong style="color:var(--builder-text-main);">${actualCashSpent.toLocaleString()} ${isMileageAble ? '<span style="font-size:10px;color:var(--omni-accent-green);">(마일30%)</span>' : ''}</strong></td>
                <td><input type="text" class="mvp-inline-input" style="width:110px; text-align:center; padding:5px;" value="${item.yesterdayMeso ? item.yesterdayMeso.toLocaleString() : ''}" oninput="applyMvpRealtimeComma(this); updateMvpSimRealtimePriceNode(${item.id}, 'yesterdayMeso', this.value)"></td>
                <td><input type="text" class="mvp-inline-input" style="width:110px; text-align:center; padding:5px;" value="${item.todayMeso ? item.todayMeso.toLocaleString() : ''}" oninput="applyMvpRealtimeComma(this); updateMvpSimRealtimePriceNode(${item.id}, 'todayMeso', this.value)"></td>
                <td class="diff-cell ${gapClass}">${gapString}</td>
                <td class="profit-cell ${textStyleClass}">${finalNetProfitResult.toLocaleString()}</td>
                <td class="per-profit-cell ${textStyleClass}">${perUnitProfitString}</td>
                <td><button class="mvp-del-btn" onclick="deleteMvpSimRowNode(${item.id})">✕</button></td>
            `;
        });
        container.appendChild(wrapperCard);
    }
}

window.deleteMvpSimRowNode = function(id) {
    omniMvpSimData = omniMvpSimData.filter(d => d.id !== id);
    localStorage.setItem('omni_v14_mvp_sim_data', JSON.stringify(omniMvpSimData));
    renderMvpSimulationCards();
};

window.addMvpInventoryStockAction = function() {
    const buyDate = document.getElementById('mvpInvDate').value;
    const name = document.getElementById('mvpInvCategory').value.trim();
    const setCount = parseMvpNum(document.getElementById('mvpInvSetCount').value) || 1;
    const unitAmount = parseMvpNum(document.getElementById('mvpInvAmount').value) || 1;
    const unitCash = parseMvpNum(document.getElementById('mvpInvCash').value);
    const mileageAble = document.getElementById('mvpInvMileageAble').checked;

    const totalCalculatedAmount = unitAmount * setCount;
    const totalCalculatedCash = unitCash * setCount; // MVP 인정 금액 기준

    if (!name || totalCalculatedAmount <= 0 || unitCash <= 0) {
        return alert("품목 제원 규격 및 매입 캐시 비용을 명확히 기입해 주세요.");
    }

    // 마일리지 사용 로직
    let currentMileage = parseMvpNum(localStorage.getItem('omni_v14_mvp_mileage') || '0');
    let realSpentCash = totalCalculatedCash;
    let usedMileageFromWallet = 0;

    if (mileageAble) {
        const maxMileageApply = Math.round(totalCalculatedCash * 0.3); // 최대 30% 마일리지 결제 가능
        if (currentMileage >= maxMileageApply) {
            usedMileageFromWallet = maxMileageApply;
            realSpentCash = totalCalculatedCash - maxMileageApply; // 실제 지출 현금은 30% 감소
            currentMileage -= maxMileageApply;
        } else {
            // 보유 마일리지가 모자라면 가지고 있는 만큼만 다 털어 씀
            usedMileageFromWallet = currentMileage;
            realSpentCash = totalCalculatedCash - currentMileage;
            currentMileage = 0;
        }
    }

    // 캐시 구매 시 마일리지 적립 로직 (실 결제 금액의 5% 적립)
    const earnedMileage = Math.round(realSpentCash * 0.05);
    currentMileage += earnedMileage;

    // 마일리지 데이터 저장 및 인풋 업데이트
    localStorage.setItem('omni_v14_mvp_mileage', currentMileage);
    const milInput = document.getElementById('mvpMileageAmount');
    if (milInput) milInput.value = currentMileage.toLocaleString();

    omniMvpInventoryData.push({
        id: Date.now(), 
        buyDate, 
        name, 
        unitAmount, 
        setCount, 
        amount: totalCalculatedAmount, 
        cash: totalCalculatedCash, // MVP 등급 반영용 캐시
        unitCash,
        mileageAble,
        realSpent: realSpentCash, // 실제 현금 지출액
        earnedMileage: earnedMileage,
        usedMileage: usedMileageFromWallet
    });

    localStorage.setItem('omni_v14_mvp_inventory_data', JSON.stringify(omniMvpInventoryData));
    document.getElementById('mvpInvPreset').value = '';
    window.applyMvpPresetToFields('inv');
    
    renderMvpInventoryListTable();
    calculateMvpIntegratedStats();

    if (mileageAble && usedMileageFromWallet > 0) {
        alert(`마일리지 복합결제 적용! 털어쓴 마일리지: ${usedMileageFromWallet.toLocaleString()}원 / 실 결제 현금: ${realSpentCash.toLocaleString()}원\n🎁 추가로 5% 적립 마일리지 (+${earnedMileage.toLocaleString()}원)이 지급되었습니다.`);
    } else {
        alert(`현금 결제 완료! 실 결제 현금: ${realSpentCash.toLocaleString()}원\n🎁 추가로 5% 적립 마일리지 (+${earnedMileage.toLocaleString()}원)이 지급되었습니다.`);
    }
};

function renderMvpInventoryListTable() {
    const tbody = document.getElementById('mvp-inventory-list-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const currentMonth = document.getElementById('mvpMonthFilter').value;
    const filteredStocks = omniMvpInventoryData.filter(item => item.buyDate.startsWith(currentMonth));

    if (filteredStocks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="color:var(--builder-text-sub); padding:30px 0;">이번 달 보유 중인 미정산 보관 물류 재고 자산이 비어 있습니다.</td></tr>`;
        return;
    }

    filteredStocks.forEach(item => {
        const uAmt = item.unitAmount || 1;
        const sCnt = item.setCount !== undefined ? item.setCount : item.amount;
        const isBundle = uAmt > 1;

        const complexDisplayName = isBundle
            ? `<strong>${item.name}</strong><div style="font-size:11.5px; color:var(--builder-text-accent); margin-top:3px; font-weight:800;">📦 ${uAmt}개입 규격 × ${sCnt}묶음 대량세트</div>`
            : `<strong>${item.name}</strong><div style="font-size:11.5px; color:var(--builder-text-sub); margin-top:3px;">🔮 단품 낱개 구성 ${sCnt}개 수량</div>`;

        const loopUnitPlaceholder = isBundle ? "1묶음 낙찰 메소 입력" : "1개당 판매 메소 입력";
        const displayRealSpent = item.realSpent !== undefined ? item.realSpent : item.cash;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span style="color:var(--builder-text-sub); font-size:12px;">${item.buyDate}</span></td>
            <td style="text-align:left; padding-left:15px;">${complexDisplayName}</td>
            <td><span style="color:var(--builder-text-sub);">${item.cash.toLocaleString()}</span></td>
            <td><strong style="color:var(--builder-text-main);">${displayRealSpent.toLocaleString()} ${item.usedMileage > 0 ? '<span style="font-size:10px; color:var(--omni-accent-green);">(마일할인)</span>' : ''}</strong></td>
            <td>
                <div style="display:flex; align-items:center; gap:6px; justify-content:center; margin-bottom:5px;">
                    <input type="number" id="mvp-inv-sell-count-${item.id}" value="${sCnt}" class="mvp-inline-input" style="width:55px; text-align:center; padding:4px;">
                    <span style="font-size:11.5px; font-weight:800; color:var(--builder-text-sub);">${isBundle ? '묶음' : '개'} 정산출고</span>
                </div>
                <input type="text" id="mvp-inv-meso-price-${item.id}" class="mvp-inline-input" style="width:90%; text-align:right; padding:5px; font-size:11.5px;" placeholder="${loopUnitPlaceholder}" oninput="applyMvpRealtimeComma(this)">
            </td>
            <td><span style="color:var(--builder-text-sub); font-size:11.5px; font-weight:bold;">완료 단추 클릭 시 계상</span></td>
            <td>
                <div style="display:flex; flex-direction:column; gap:4px; align-items:center;">
                    <button class="mvp-action-btn" style="background:var(--builder-input-bg); color:var(--builder-text-main); padding:5px 10px; font-size:11.5px; width:85px; border: 1px solid var(--builder-border);" onclick="commitMvpStockToSalesRecord(${item.id})">판매 완료</button>
                    <button class="mvp-del-btn" style="padding:3px 6px; font-size:10.5px;" onclick="cancelMvpInventoryStockNode(${item.id})">환불 취소</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.commitMvpStockToSalesRecord = function(id) {
    const stockItem = omniMvpInventoryData.find(d => d.id === id);
    if (!stockItem) return;

    const unitMesoPriceValue = parseMvpNum(document.getElementById(`mvp-inv-meso-price-${id}`).value);
    const intentSellCount = parseMvpNum(document.getElementById(`mvp-inv-sell-count-${id}`).value);

    const uAmt = stockItem.unitAmount || 1;
    const maxAvailableCount = stockItem.setCount !== undefined ? stockItem.setCount : stockItem.amount;
    const isBundle = uAmt > 1;

    if (intentSellCount <= 0 || intentSellCount > maxAvailableCount) {
        return alert(`범위 오버 경고: 1 부터 ${maxAvailableCount} 스케일 내에서만 출고 승인이 성립됩니다.`);
    }
    if (unitMesoPriceValue <= 0) {
        return alert("실제 거래소 경매장에 낙찰된 대금 액수를 입력해 주세요.");
    }

    const netTotalMesoRevenue = unitMesoPriceValue * intentSellCount;
    
    // MVP 등급 기여액과 실제 지출액을 비율만큼 가중 정산
    const proportionalMVPSpent = stockItem.unitCash ? (stockItem.unitCash * intentSellCount) : Math.round((stockItem.cash / maxAvailableCount) * intentSellCount);
    const originalRealSpent = stockItem.realSpent !== undefined ? stockItem.realSpent : stockItem.cash;
    const proportionalRealSpent = Math.round((originalRealSpent / maxAvailableCount) * intentSellCount);
    
    const formattedRecordName = isBundle ? `${stockItem.name} (${uAmt}개 묶음)` : stockItem.name;

    omniMvpRecordData.push({
        id: Date.now(), 
        date: new Date().toISOString().substring(0, 10), 
        name: formattedRecordName, 
        amount: intentSellCount, 
        meso: netTotalMesoRevenue, 
        cash: proportionalMVPSpent,       // MVP 공헌 금액
        realSpent: proportionalRealSpent // 실질적 현금 지출 금액
    });

    if (intentSellCount === maxAvailableCount) {
        omniMvpInventoryData = omniMvpInventoryData.filter(d => d.id !== id);
    } else {
        stockItem.setCount -= intentSellCount;
        stockItem.cash -= proportionalMVPSpent;
        if (stockItem.realSpent !== undefined) {
            stockItem.realSpent -= proportionalRealSpent;
        }
        stockItem.amount = stockItem.setCount * uAmt;
    }

    localStorage.setItem('omni_v14_mvp_inventory_data', JSON.stringify(omniMvpInventoryData));
    localStorage.setItem('omni_v14_mvp_record_data', JSON.stringify(omniMvpRecordData));

    renderMvpInventoryListTable();
    renderMvpFinalRecordListTable();
    calculateMvpIntegratedStats();
};

window.cancelMvpInventoryStockNode = function(id) {
    if (confirm("이 구매 재고 입고 건을 폐기 취소할까요?")) {
        omniMvpInventoryData = omniMvpInventoryData.filter(d => d.id !== id);
        localStorage.setItem('omni_v14_mvp_inventory_data', JSON.stringify(omniMvpInventoryData));
        renderMvpInventoryListTable();
        calculateMvpIntegratedStats();
    }
};

function renderMvpFinalRecordListTable() {
    const tbody = document.getElementById('mvp-record-list-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const currentMesoRate = parseMvpNum(document.getElementById('mvpMarketPrice').value) || 1600;
    const moneyToMesoUnitRatio = currentMesoRate / 100000000;
    const monthFilterValue = document.getElementById('mvpMonthFilter').value;
    let targetDataset = omniMvpRecordData.filter(item => monthFilterValue ? item.date.startsWith(monthFilterValue) : true);

    if (targetDataset.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="color:var(--builder-text-sub); padding:30px 0;">정산 마감 처리 완료된 실 판매 완료 리포트가 전무합니다.</td></tr>`;
        return;
    }

    targetDataset.sort((a, b) => a.name.localeCompare(b.name));

    targetDataset.forEach(item => {
        const netExchangedCashValue = Math.floor(item.meso * 0.97 * moneyToMesoUnitRatio);
        const actualRealSpent = item.realSpent !== undefined ? item.realSpent : item.cash;
        const netProfitOrLossCash = netExchangedCashValue - actualRealSpent; // 실 지출 캐시 대비 이득 판단
        const textStyleClass = netProfitOrLossCash < 0 ? 'profit-minus' : 'profit-plus';

        let convertedTotalPieces = item.amount;
        const regexMatch = item.name.match(/\((\d+)개\s*묶음\)/);
        if (regexMatch) {
            convertedTotalPieces = item.amount * parseInt(regexMatch[1], 10);
        }
        const perPieceProfitString = convertedTotalPieces > 0 ? Math.floor(netProfitOrLossCash / convertedTotalPieces).toLocaleString() + "원" : "0원";

        const tr = document.createElement('tr');
        tr.id = `mvp-record-row-root-${item.id}`;
        tr.innerHTML = `
            <td><span style="font-size:12px; color:var(--builder-text-sub);">${item.date}</span></td>
            <td style="text-align:left;"><strong>${item.name}</strong> <span style="font-size:11px; color:var(--builder-text-sub);">(${item.amount}건)</span></td>
            <td style="text-align:right; padding-right:12px; color:var(--builder-text-main);">${item.meso.toLocaleString()}</td>
            <td style="text-align:right; padding-right:12px; color:var(--builder-text-sub);">${item.cash.toLocaleString()}</td>
            <td style="text-align:right; padding-right:12px; color:var(--builder-text-main); font-weight:800;">${actualRealSpent.toLocaleString()}</td>
            <td style="text-align:right; padding-right:12px; color:var(--builder-text-main);">${netExchangedCashValue.toLocaleString()}</td>
            <td style="text-align:right; padding-right:12px;" class="${textStyleClass}">${netProfitOrLossCash.toLocaleString()}</td>
            <td class="${textStyleClass}" style="font-size:12px;">${perPieceProfitString}</td>
            <td>
                <div style="display:flex; gap:4px; justify-content:center;">
                    <button class="mvp-util-btn" style="padding:3px 6px; font-size:11px;" onclick="activateMvpRecordInlineEditMode(${item.id})">수정</button>
                    <button class="mvp-del-btn" style="padding:3px 6px; font-size:11px;" onclick="deleteMvpSalesRecordNode(${item.id})">삭제</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.activateMvpRecordInlineEditMode = function(id) {
    const item = omniMvpRecordData.find(d => d.id === id);
    if (!item) return;

    const unitMesoAverage = item.amount > 0 ? Math.floor(item.meso / item.amount) : item.meso;
    const targetRow = document.getElementById(`mvp-record-row-root-${id}`);
    const actualRealSpent = item.realSpent !== undefined ? item.realSpent : item.cash;
    
    targetRow.innerHTML = `
        <td><input type="date" id="mvp-edit-date-${id}" value="${item.date}" class="mvp-inline-input" style="padding:4px; font-size:11.5px; width:110px;"></td>
        <td>
            <input type="text" id="mvp-edit-name-${id}" value="${item.name}" class="mvp-inline-input" style="padding:4px; font-size:11.5px; width:140px; margin-bottom:3px;"><br>
            <input type="number" id="mvp-edit-amount-${id}" value="${item.amount}" class="mvp-inline-input" style="padding:4px; font-size:11.5px; width:50px; text-align:center;"> <span style="font-size:11px;">건</span>
        </td>
        <td><input type="text" id="mvp-edit-meso-${id}" value="${unitMesoAverage.toLocaleString()}" class="mvp-inline-input" style="padding:4px; font-size:11.5px; text-align:right; width:100px;" oninput="applyMvpRealtimeComma(this)"></td>
        <td><input type="text" id="mvp-edit-cash-${id}" value="${item.cash.toLocaleString()}" class="mvp-inline-input" style="padding:4px; font-size:11.5px; text-align:right; width:90px;" oninput="applyMvpRealtimeComma(this)"></td>
        <td><input type="text" id="mvp-edit-realspent-${id}" value="${actualRealSpent.toLocaleString()}" class="mvp-inline-input" style="padding:4px; font-size:11.5px; text-align:right; width:90px;" oninput="applyMvpRealtimeComma(this)"></td>
        <td colspan="2" style="font-size:11px; color:var(--builder-text-sub); line-height:1.3;">저장 시<br>자동 재연산 적용</td>
        <td>-</td>
        <td>
            <div style="display:flex; flex-direction:column; gap:3px;">
                <button class="mvp-action-btn" style="padding:4px 8px; font-size:11px; background:var(--builder-input-bg); color:var(--builder-text-main); border:1px solid var(--builder-border);" onclick="saveMvpRecordInlineEditChanges(${id})">저장</button>
                <button class="mvp-util-btn" style="padding:3px 6px; font-size:11px;" onclick="renderMvpFinalRecordListTable()">취소</button>
            </div>
        </td>
    `;
};

window.saveMvpRecordInlineEditChanges = function(id) {
    const item = omniMvpRecordData.find(d => d.id === id);
    if (!item) return;

    item.date = document.getElementById(`mvp-edit-date-${id}`).value;
    item.name = document.getElementById(`mvp-edit-name-${id}`).value.trim();
    const nextAmount = parseMvpNum(document.getElementById(`mvp-edit-amount-${id}`).value) || 1;
    item.amount = nextAmount;

    const nextUnitMeso = parseMvpNum(document.getElementById(`mvp-edit-meso-${id}`).value);
    item.meso = nextUnitMeso * nextAmount;
    item.cash = parseMvpNum(document.getElementById(`mvp-edit-cash-${id}`).value);
    item.realSpent = parseMvpNum(document.getElementById(`mvp-edit-realspent-${id}`).value);

    localStorage.setItem('omni_v14_mvp_record_data', JSON.stringify(omniMvpRecordData));
    renderMvpFinalRecordListTable();
    calculateMvpIntegratedStats();
};

window.deleteMvpSalesRecordNode = function(id) {
    if (confirm("이 판매 완결 정산 명세를 영구 삭제할까요?")) {
        omniMvpRecordData = omniMvpRecordData.filter(d => d.id !== id);
        localStorage.setItem('omni_v14_mvp_record_data', JSON.stringify(omniMvpRecordData));
        renderMvpFinalRecordListTable();
        calculateMvpIntegratedStats();
    }
};

window.exportMvpIntegratedJsonPacket = function() {
    const backupPacket = {
        identity: "MAPLE_OMNI_V14_LAVENDER_MVP_ENGINE",
        exportTimestamp: new Date().toLocaleString(),
        customPresets: omniMvpCustomPresets, simData: omniMvpSimData, inventoryData: omniMvpInventoryData, recordData: omniMvpRecordData,
        configurations: {
            server: localStorage.getItem('omni_v14_mvp_server'), marketPrice: localStorage.getItem('omni_v14_mvp_market_price'),
            existingMeso: localStorage.getItem('omni_v14_mvp_existing_meso'), mileage: localStorage.getItem('omni_v14_mvp_mileage'), monthlyCharges: localStorage.getItem('omni_v14_mvp_monthly_charges')
        }
    };
    const blob = new Blob([JSON.stringify(backupPacket, null, 2)], { type: "application/json" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `OMNI_V14_MVP_통합정산백업_${new Date().toISOString().substring(0, 10)}.json`;
    document.body.appendChild(anchor); anchor.click(); document.body.removeChild(anchor);
};

window.importMvpIntegratedJsonPacket = function(event) {
    const file = event.target.files[0]; if (!file) return;
    const fileReader = new FileReader();
    fileReader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.customPresets || data.customPresets === []) localStorage.setItem('omni_v14_mvp_custom_presets', JSON.stringify(data.customPresets));
            if (data.simData) localStorage.setItem('omni_v14_mvp_sim_data', JSON.stringify(data.simData));
            if (data.inventoryData) localStorage.setItem('omni_v14_mvp_inventory_data', JSON.stringify(data.inventoryData));
            if (data.recordData) localStorage.setItem('omni_v14_mvp_record_data', JSON.stringify(data.recordData));
            
            const configSrc = data.configurations || data.settings || {};
            if (configSrc.server) localStorage.setItem('omni_v14_mvp_server', configSrc.server);
            if (configSrc.marketPrice) localStorage.setItem('omni_v14_mvp_market_price', configSrc.marketPrice);
            if (configSrc.existingMeso) localStorage.setItem('omni_v14_mvp_existing_meso', configSrc.existingMeso);
            if (configSrc.mileage) localStorage.setItem('omni_v14_mvp_mileage', configSrc.mileage);
            if (configSrc.monthlyCharges) {
                const charges = typeof configSrc.monthlyCharges === 'string' ? JSON.parse(configSrc.monthlyCharges) : configSrc.monthlyCharges;
                localStorage.setItem('omni_v14_mvp_monthly_charges', JSON.stringify(charges));
            }
            alert("💾 성공적으로 마이그레이션 자산 연동 복구가 완료되었습니다!");
            location.reload();
        } catch (err) { alert("❌ 복구 실패: 잘못된 구성 파일 패킷 규격입니다."); }
    };
    fileReader.readAsText(file);
};

window.switchMvpInternalSubTab = function(tabId, event) {
    document.querySelectorAll('.mvp-sub-page-content').forEach(el => el.style.display = 'none');
    const targetNode = document.getElementById(tabId);
    if (targetNode) targetNode.style.display = 'block';
    document.querySelectorAll('.mvp-tab-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.currentTarget) event.currentTarget.classList.add('active');
};

document.addEventListener('DOMContentLoaded', () => {
    injectMvpPremiumLayoutFramework();

    if (typeof window.omniSwitchPage === 'function') {
        const originalOmniSwitchPage = window.omniSwitchPage;
        window.omniSwitchPage = function(pageId) {
            originalOmniSwitchPage(pageId);
            if (pageId === 'page-mvp') {
                window.initOmniMvpModule();
            }
        };
    }

    window.initOmniMvpModule();
});