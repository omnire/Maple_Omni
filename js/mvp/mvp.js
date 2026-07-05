/**
 * ============================================================================
 * 📊 MAPLE OMNI V14 - js/mvp/mvp.js [INTEGRATED 3-TAB CONTROL ENGINE]
 * 설명: 시뮬레이션, 구매/재고 관리, 판매기록장을 상호 참조 기믹으로 연동한 시스템
 * 규칙: 초보자를 위한 초정밀 상세 한국어 주석 완전 포함 완본
 * ============================================================================
 */

// 💡 [초보자 가이드] 3개 분할형 탭 데이터의 수치와 입력 상태를 브라우저 내에 통합 유지하는 가이드 메모리 객체입니다.
window.omniMvpState = {
    activeTab: "simulation", // 현재 사용자가 바라보고 있는 활성화 탭 코드 (simulation / inventory / sales)

    // [1] 시뮬레이션 데이터 필드 세션
    simulation: {
        itemName: "로얄스타일 쿠폰",
        itemCount: 50,
        yesterdayPrice: 38000000,
        todayPrice: 40500000
    },

    // [2] 구매 및 재고 관리 원천 배열 데이터 (테스트용 초기 가상 자산 바인딩)
    inventoryList: [
        { id: 101, date: "2026-06-25", itemName: "메이플 가위", unitCount: 1, bundleCount: 19, totalCount: 19, cashCost: 104500, status: "보유중" },
        { id: 102, date: "2026-06-26", itemName: "로얄스타일 쿠폰", unitCount: 10, bundleCount: 5, totalCount: 50, cashCost: 110000, status: "보유중" }
    ],

    // [3] 판매 기록 작성 처리 임시 버퍼 세션
    salesBuffer: {
        selectedInvId: 102,
        actualMesoPrice: 42000000
    }
};

/**
 * 💡 [초보자 가이드] 메인 라우터 시스템에 의해 'MVP 계산기' 메뉴 클릭 시 시동을 거는 마스터 마운트 함수입니다.
 */
window.initOmniMvpTab = function() {
    const rootContainer = document.getElementById('mvpContent');
    if (!rootContainer) return;

    // 마스터 프레임워크 뼈대 (상단 서브 내비게이션 바 + 동적 뷰포트 영역) 배치 빌딩
    rootContainer.innerHTML = `
        <div class="mvp-tab-nav-bar">
            <button id="mvp_btn_sim" class="mvp-tab-btn" onclick="window.switchMvpSubTab('simulation')">📈 시뮬레이션 관제실</button>
            <button id="mvp_btn_inv" class="mvp-tab-btn" onclick="window.switchMvpSubTab('inventory')">📦 구매 및 재고 관리</button>
            <button id="mvp_btn_sale" class="mvp-tab-btn" onclick="window.switchMvpSubTab('sales')">📜 실전 판매기록장</button>
        </div>
        
        <div id="mvpViewportContainer"></div>
    `;

    // 메모리에 저장된 활성 탭 기준 지표 화면 최초 연동 실행
    window.switchMvpSubTab(window.omniMvpState.activeTab);
};

/**
 * 💡 [초보자 가이드] 버튼을 터치할 때 클래스를 스위칭하고 하위 렌더러 루프를 기동해주는 트래픽 제어 스위치입니다.
 */
window.switchMvpSubTab = function(tabId) {
    window.omniMvpState.activeTab = tabId;

    // 모든 버튼의 액티브 하이라이팅 클래스 선제 초기화 제거
    document.getElementById('mvp_btn_sim').classList.remove('tab-active');
    document.getElementById('mvp_btn_inv').classList.remove('tab-active');
    document.getElementById('mvp_btn_sale').classList.remove('tab-active');

    // 선택 대상 컴포넌트에만 액티브 포인트 결속
    if (tabId === 'simulation') {
        document.getElementById('mvp_btn_sim').classList.add('tab-active');
        window.renderMvpSimulationTab();
    } else if (tabId === 'inventory') {
        document.getElementById('mvp_btn_inv').classList.add('tab-active');
        window.renderMvpInventoryTab();
    } else if (tabId === 'sales') {
        document.getElementById('mvp_btn_sale').classList.add('tab-active');
        window.renderMvpSalesTab();
    }
};

// ============================================================================
// 📈 [TAB 1] 시뮬레이션 관제실 파트 렌더러 및 수식 연산 파이프라인
// ============================================================================

window.renderMvpSimulationTab = function() {
    const view = document.getElementById('mvpViewportContainer');
    if (!view) return;

    const simData = window.omniMvpState.simulation;

    view.innerHTML = `
        <div class="mvp-board-card">
            <div class="mvp-grid-layout">
                
                <div>
                    <h4 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 900; color: #1e293b;">📈 어제 vs 오늘 옥션 시세 변동 분석기</h4>
                    
                    <div class="mvp-form-group">
                        <label>현금화 대상 품목명 명시</label>
                        <input type="text" id="sim_input_name" class="mvp-input-box" value="${simData.itemName}" oninput="window.runMvpSimulationCompute()">
                    </div>
                    <div class="mvp-form-group">
                        <label>비교 대상 시뮬레이션 물품 수량 (개)</label>
                        <input type="number" id="sim_input_count" class="mvp-input-box" value="${simData.itemCount}" oninput="window.runMvpSimulationCompute()">
                    </div>
                    <div class="mvp-form-group">
                        <label>어제자 경매장 평균 시세 단가 (메소)</label>
                        <input type="number" id="sim_input_yesterday" class="mvp-input-box" value="${simData.yesterdayPrice}" step="500000" oninput="window.runMvpSimulationCompute()">
                    </div>
                    <div class="mvp-form-group">
                        <label>오늘자 실시간 경매장 시세 단가 (메소)</label>
                        <input type="number" id="sim_input_today" class="mvp-input-box" value="${simData.todayPrice}" step="500000" oninput="window.runMvpSimulationCompute()">
                    </div>
                </div>

                <div class="mvp-digital-panel">
                    <h4 style="margin:0 0 4px 0; font-size:12.5px; color:#94a3b8; font-weight:900;">📊 변동 스펙트럼 분석 리포트</h4>
                    
                    <div class="panel-row">
                        <span style="font-size:12px; color:#cbd5e1;">개당 어제대비 차액</span>
                        <span id="sim_res_unit_diff" class="font-num">+0</span>
                    </div>
                    <div class="panel-row">
                        <span style="font-size:12px; color:#cbd5e1;">수량 대비 총액 차액</span>
                        <span id="sim_res_total_diff" class="font-num">+0</span>
                    </div>
                    <div class="panel-row" style="border-top:1px dashed rgba(255,255,255,0.1); padding-top:12px; margin-top:4px;">
                        <span style="font-size:12px; color:#94a3b8; font-weight:800;">예상 개당 순수 손익 (수수료5% 반영)</span>
                        <span id="sim_res_unit_net" style="font-size:13px; font-weight:900;">0 메소</span>
                    </div>
                    <div class="panel-row">
                        <span style="font-size:12px; color:#38bdf8; font-weight:800;">최종 예상 종합 손익</span>
                        <span id="sim_res_total_net" style="font-size:16px; font-weight:900; color:#38bdf8;">0 메소</span>
                    </div>
                </div>

            </div>
        </div>
    `;
    window.runMvpSimulationCompute();
};

window.runMvpSimulationCompute = function() {
    const name = document.getElementById('sim_input_name').value;
    const count = parseInt(document.getElementById('sim_input_count').value) || 0;
    const yest = parseInt(document.getElementById('sim_input_yesterday').value) || 0;
    const today = parseInt(document.getElementById('sim_input_today').value) || 0;

    // 데이터 복사본 동기화 백업
    window.omniMvpState.simulation = { itemName: name, itemCount: count, yesterdayPrice: yest, todayPrice: today };

    // 💡 단가 차액 수식 연산 처리
    const unitDiff = today - yest;
    const totalDiff = unitDiff * count;

    // UI 컬러 클래스 보정 매핑 변수화
    const diffClass = unitDiff > 0 ? "value-plus" : (unitDiff < 0 ? "value-minus" : "value-stable");
    const prefix = unitDiff > 0 ? "+" : "";

    document.getElementById('sim_res_unit_diff').className = `font-num ${diffClass}`;
    document.getElementById('sim_res_unit_diff').innerText = `${prefix}${unitDiff.toLocaleString()} 메소`;
    
    document.getElementById('sim_res_total_diff').className = `font-num ${diffClass}`;
    document.getElementById('sim_res_total_diff').innerText = `${prefix}${totalDiff.toLocaleString()} 메소`;

    // 💡 [경매장 5% 수수료 반영 공제 공식 기믹]
    // 개당 순이익 = 오늘단가 * 95%
    const unitNet = Math.floor(today * 0.95);
    const totalNet = unitNet * count;

    document.getElementById('sim_res_unit_net').innerText = `${unitNet.toLocaleString()} 메소`;
    document.getElementById('sim_res_total_net').innerText = `${totalNet.toLocaleString()} 메소`;
};

// ============================================================================
// 📦 [TAB 2] 구매 및 재고 관리 파트 렌더러 및 데이터 영구 가공 루프
// ============================================================================

window.renderMvpInventoryTab = function() {
    const view = document.getElementById('mvpViewportContainer');
    if (!view) return;

    const list = window.omniMvpState.inventoryList;

    view.innerHTML = `
        <div class="mvp-board-card" style="display:flex; flex-direction:column; gap:24px;">
            <div class="mvp-grid-layout">
                
                <div>
                    <h4 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 900; color: #1e293b;">🛒 현금화 물품 신규 매입 내역 등록 등록창</h4>
                    
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                        <div class="mvp-form-group">
                            <label>캐시샵 충전 소모 캐시액 (원)</label>
                            <input type="number" id="inv_input_cash" class="mvp-input-box" value="110000" step="5000">
                        </div>
                        <div class="mvp-form-group">
                            <label>구입 품목 명칭</label>
                            <input type="text" id="inv_input_name" class="mvp-input-box" value="로얄스타일 쿠폰">
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                        <div class="mvp-form-group">
                            <label>박스당 아이템 세부 수량 (개)</label>
                            <input type="number" id="inv_input_unit" class="mvp-input-box" value="10" oninput="window.syncMvpInventoryNotation()">
                        </div>
                        <div class="mvp-form-group">
                            <label>매입 총 묶음 팩수 (박스)</label>
                            <input type="number" id="inv_input_box" class="mvp-input-box" value="5" oninput="window.syncMvpInventoryNotation()">
                        </div>
                    </div>

                    <button class="mvp-action-btn" onclick="window.addMvpInventoryNode()">📥 장착고 인프라 데이터 재고 등록하기</button>
                </div>

                <div>
                    <h4 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 800; color: #64748b;">🎯 묶음 구조 가시성 체크 매트릭스</h4>
                    <div id="inv_notation_board" class="mvp-notation-panel">10 개입 x 5 묶음 세팅 (총 50개 확보)</div>
                </div>

            </div>

            <div style="border-top:1px solid #e2e8f0; padding-top:20px;">
                <h4 style="margin: 0 0 12px 0; font-size: 13.5px; font-weight: 900; color: #0f172a;">📦 보유 보관 중인 창고 인벤토리 자산 일람</h4>
                <table class="mvp-data-table">
                    <thead>
                        <tr>
                            <th>등록 일자</th>
                            <th>구입 품목명</th>
                            <th>구조 표기 배율</th>
                            <th>최종 합산 수량</th>
                            <th>매입 캐시 원가</th>
                            <th>현재 상태 지표</th>
                        </tr>
                    </thead>
                    <tbody id="mvp_inventory_table_body">
                        ${list.map(node => `
                            <tr>
                                <td>${node.date}</td>
                                <td style="font-weight:800; color:#0f172a;">${node.itemName}</td>
                                <td style="font-family:monospace; color:#0f766e;">${node.unitCount}x${node.bundleCount}</td>
                                <td class="font-num">${node.totalCount} 개</td>
                                <td>${node.cashCost.toLocaleString()} 원</td>
                                <td><span style="background:#f0fdf4; color:#166534; padding:2px 6px; border-radius:4px; font-size:11px;">${node.status}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
};

window.syncMvpInventoryNotation = function() {
    const unit = parseInt(document.getElementById('inv_input_unit').value) || 0;
    const box = parseInt(document.getElementById('inv_input_box').value) || 0;
    document.getElementById('inv_notation_board').innerText = `${unit} 개입 x ${box} 묶음 세팅 (총 ${unit * box}개 확보)`;
};

window.addMvpInventoryNode = function() {
    const cash = parseInt(document.getElementById('inv_input_cash').value) || 0;
    const name = document.getElementById('inv_input_name').value.trim();
    const unit = parseInt(document.getElementById('inv_input_unit').value) || 0;
    const box = parseInt(document.getElementById('inv_input_box').value) || 0;

    if (!name) { alert("품목 명칭을 누락 없이 입력하세요."); return; }

    const todayStr = new Date().toISOString().split('T')[0];

    // 새 데이터 노드 객체 적재 생성
    const newNode = {
        id: Date.now(),
        date: todayStr,
        itemName: name,
        unitCount: unit,
        bundleCount: box,
        totalCount: unit * box,
        cashCost: cash,
        status: "보유중"
    };

    window.omniMvpState.inventoryList.push(newNode);
    alert("인벤토리 자산 트래킹 대장에 신규 재고 등록이 정상 결속되었습니다.");
    window.renderMvpInventoryTab(); // 전경 새로고침
};

// ============================================================================
// 📜 [TAB 3] 실전 판매기록장 파트 렌더러 및 순수 실이익 정산기
// ============================================================================

window.renderMvpSalesTab = function() {
    const view = document.getElementById('mvpViewportContainer');
    if (!view) return;

    const list = window.omniMvpState.inventoryList;
    const buffer = window.omniMvpState.salesBuffer;

    view.innerHTML = `
        <div class="mvp-board-card">
            <div class="mvp-grid-layout">
                
                <div>
                    <h4 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 900; color: #1e293b;">📜 인벤토리 매각 처분 정산 기록서</h4>
                    
                    <div class="mvp-form-group">
                        <label>연동 판매 처리할 창고 재고 선택</label>
                        <select id="sale_select_node" class="mvp-input-box" onchange="window.runMvpSalesCompute()">
                            ${list.map(node => `
                                <option value="${node.id}" ${node.id === buffer.selectedInvId ? 'selected' : ''}>
                                    ${node.itemName} [${node.unitCount}x${node.bundleCount}] (${node.totalCount}개) - 원가:${node.cashCost.toLocaleString()}원
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="mvp-form-group">
                        <label>실제 개당 메이플 옥션 판매 성사 금액 (메소)</label>
                        <input type="number" id="sale_input_meso" class="mvp-input-box" value="${buffer.actualMesoPrice}" step="500000" oninput="window.runMvpSalesCompute()">
                    </div>
                </div>

                <div class="mvp-digital-panel" style="background:#090d16; border:1px solid #1e293b;">
                    <h4 style="margin:0 0 4px 0; font-size:12.5px; color:#64748b; font-weight:900;">📊 순수 마진 정산 성적표</h4>
                    
                    <div class="panel-row">
                        <span style="font-size:12px; color:#94a3b8;">총 옥션 매각 매출액</span>
                        <span id="sale_res_gross" class="font-num" style="color:#fff;">0 메소</span>
                    </div>
                    <div class="panel-row">
                        <span style="font-size:12px; color:#e11d48; font-weight:800;">⚠️ 옥션 자동 공제 수수료 (5%)</span>
                        <span id="sale_res_fee" class="font-num" style="color:#f87171;">-0 메소</span>
                    </div>
                    <div class="panel-row" style="border-top:1px dashed rgba(255,255,255,0.1); padding-top:12px; margin-top:4px;">
                        <span style="font-size:12px; color:#cbd5e1; font-weight:800;">수수료 제외 최종 순수 획득 메소</span>
                        <span id="sale_res_net_meso" style="font-size:14px; font-weight:900; color:#22c55e;">0 메소</span>
                    </div>
                    <div class="panel-row">
                        <span style="font-size:12px; color:#38bdf8; font-weight:800;">투자 원가 대비 최종 정산 환수율</span>
                        <span id="sale_res_roi" style="font-size:15px; font-weight:900; color:#38bdf8;">계산 중</span>
                    </div>
                </div>

            </div>
        </div>
    `;
    window.runMvpSalesCompute();
};

window.runMvpSalesCompute = function() {
    const selectEl = document.getElementById('sale_select_node');
    const priceEl = document.getElementById('sale_input_meso');
    if (!selectEl || !priceEl) return;

    const targetId = parseInt(selectEl.value);
    const unitPrice = parseInt(priceEl.value) || 0;

    // 전역 동기화 싱크 보정
    window.omniMvpState.salesBuffer = { selectedInvId: targetId, actualMesoPrice: unitPrice };

    // 매칭 인벤토리 자산 추출
    const targetNode = window.omniMvpState.inventoryList.find(n => n.id === targetId);
    if (!targetNode) return;

    // 💡 개수x묶음 최종 수량 연산 상속
    const totalCount = targetNode.totalCount;

    // 총 가공 매출액 산출
    const grossMeso = totalCount * unitPrice;
    
    // 💡 [유저 핵심 요청 반영]: 옥션 수수료 5% 정밀 분리 산출 공식
    const feeMeso = Math.floor(grossMeso * 0.05);
    const netMeso = grossMeso - feeMeso; // 5% 수 수 료 공 제 완 료

    document.getElementById('sale_res_gross').innerText = `${grossMeso.toLocaleString()} 메소`;
    document.getElementById('sale_res_fee').innerText = `-${feeMeso.toLocaleString()} 메소`;
    document.getElementById('sale_res_net_meso').innerText = `${netMeso.toLocaleString()} 메소`;

    // 💡 투자 대비 효율 연산 (1억 메소당 대략 현금 환산액 가치 2,500원 방어선 대입 보정 계산)
    const currentMesoCashValue = Math.floor((netMeso / 100000000) * 2500);
    const costCash = targetNode.cashCost || 1; // 0 나누기 방어

    const roiPercent = ((currentMesoCashValue / costCash) * 100).toFixed(1);
    document.getElementById('sale_res_roi').innerText = `${roiPercent}% (캐시 환급 환수)`;
};

// ============================================================================
// 📡 GLOBAL ACTION ROUTER SYSTEM BINDING
// ============================================================================

window.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'nav-btn-mvp') {
        setTimeout(function() {
            if (typeof window.initOmniMvpTab === 'function') {
                window.initOmniMvpTab();
            }
        }, 50);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.initOmniMvpTab === 'function') {
        window.initOmniMvpTab();
    }
});