/**
 * ============================================================================
 * ✨ MAPLE OMNI - mvp-calc.js (OMNI MVP 프리미엄 에디션)
 * 무결점 통합 자동 치유 및 미니멀 슬레이트 프리미엄 디자인 완성판
 * * [초보자 가이드 주석]
 * 이 파일은 사용자가 메이플스토리 내에서 구매/판매한 캐시 아이템 데이터를 기반으로
 * 목표 MVP 등급까지 남은 충전액, 정산 메소, 최종 캐시 손해율을 계산하는 프로그램입니다.
 * 별도의 HTML 파일 구조가 없어도, 스크립트가 실행되는 순간 브라우저의 화면(DOM)에
 * 깔끔하고 현대적인 대시보드 레이아웃을 스스로 그려내어 주입(Injection)합니다.
 * ============================================================================
 */

// 💾 [데이터 동기화 코어] 브라우저의 로컬 저장소(localStorage)에서 기존에 저장된 유저 데이터를 안전하게 파싱하여 불러옵니다.
let simData = JSON.parse(localStorage.getItem('mapleSimData')) || [];
let inventoryData = JSON.parse(localStorage.getItem('mapleInventoryData')) || []; 
let recordData = JSON.parse(localStorage.getItem('mapleRecordData')) || [];
let monthlyCharges = JSON.parse(localStorage.getItem('mapleMonthlyCharges')) || {};

// 🌟 [기본 시스템 프리셋] 유저들이 가장 자주 가성비나 효율을 계산하는 메이플스토리 대표 캐시 품목의 기본 고정 데이터입니다.
const BASE_PRESETS = [
    { id: "base_royal", name: "메이플 로얄 스타일", amount: 45, cash: 99000 },
    { id: "base_wonder", name: "위습의 원더베리", amount: 11, cash: 54000 },
    { id: "base_pkarma", name: "플래티넘 카르마의 가위 (마일30%)", amount: 1, cash: 4130 }
];

// 🎨 [커스텀 프리셋] 유저가 개인적으로 품목 이름, 수량, 가격을 구성하여 커스텀 저장한 데이터 리스트가 담기는 배열입니다.
let customPresets = JSON.parse(localStorage.getItem('mapleCustomPresets')) || [];

/**
 * 🚀 [모듈 초기화 엔진] 옴니 MVP 서비스가 활성화될 때 UI 인젝션과 데이터 렌더링을 지휘하는 핵심 컨트롤 타워입니다.
 */
window.initMvpCalc = function() {
    console.log("🛠️ [디버그] OMNI MVP 엔진 가동!");
    
    // 🛡️ [NaN 에러 백신 방어막] 잘못된 데이터 입력이나 데이터 유실로 인해 연산 중 숫자가 깨지는 현상(NaN)을 사전에 전수 조사하여 0 또는 1로 리셋(차단)합니다.
    simData.forEach(d => { d.amount = parseNum(d.amount)||1; d.cash = parseNum(d.cash)||0; });
    inventoryData.forEach(d => { d.amount = parseNum(d.amount)||1; d.setCount = parseNum(d.setCount)||1; d.cash = parseNum(d.cash)||0; });
    recordData.forEach(d => { d.amount = parseNum(d.amount)||1; d.meso = parseNum(d.meso)||0; d.cash = parseNum(d.cash)||0; });
    
    localStorage.setItem('mapleSimData', JSON.stringify(simData));
    localStorage.setItem('mapleInventoryData', JSON.stringify(inventoryData));
    localStorage.setItem('mapleRecordData', JSON.stringify(recordData));

    // 🎨 [통합 CSS 및 스타일 동적 주입] - 외부 CSS 파일 없이 JS 내부에서 디자인과 레이아웃 붕괴를 완벽히 통제합니다.
    if (!document.getElementById('omni-pro-styles')) {
        const style = document.createElement('style');
        style.id = 'omni-pro-styles';
        style.innerHTML = `
            @keyframes pulse-dot {
                0% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                50% { opacity: 0.8; transform: scale(1.05); box-shadow: 0 0 0 4px rgba(16, 185, 129, 0); }
                100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
            }
            .live-pulse {
                display: inline-block; width: 10px; height: 10px; background-color: #10b981; border-radius: 50%;
                animation: pulse-dot 2s infinite;
            }
            .expert-input { box-sizing: border-box; transition: all 0.2s; }
            .expert-input:focus { border-color: #6366f1 !important; outline: none; box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important; }
            
            /* 스크롤바 최적화 */
            .omni-table-wrapper::-webkit-scrollbar { height: 8px; }
            .omni-table-wrapper::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
            .omni-table-wrapper::-webkit-scrollbar-track { background: #f1f5f9; }
            
            /* 공통 버튼 호버 애니메이션 */
            .omni-btn { transition: all 0.2s ease; cursor: pointer; box-sizing: border-box; font-family: inherit; }
            .omni-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .omni-btn:active { transform: translateY(0); }

            /* 테이블 및 레이아웃 무너짐 방지 */
            #mvpCalcSection select, #mvpCalcSection input { box-sizing: border-box; font-family: inherit; }
            #mvpCalcSection table { table-layout: auto; width: 100%; }
            #mvpCalcSection th, #mvpCalcSection td { width: auto !important; }
        `;
        document.head.appendChild(style);
    }

    // 🛡️ [자가 치유 시스템] 화면에 구 버전 돔(DOM) 레이아웃이 남아있다면 중복 생성을 막기 위해 소거합니다.
    let calcSection = document.getElementById('mvpCalcSection');
    if (calcSection) {
        calcSection.remove(); 
    }

    const targetContainer = document.getElementById('auxiliarySectionsContainer');
    if (!targetContainer) return setTimeout(window.initMvpCalc, 200);
    const parentContainer = targetContainer;
    
    calcSection = document.createElement('div');
    calcSection.id = 'mvpCalcSection';
    calcSection.className = 'page-content';
    calcSection.style.cssText = 'display:none; width: 100%; max-width: 1100px; margin: 40px auto; padding: 0 20px; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;';
    
    // 🎨 [인젝션 레이아웃 세팅] - 전문가용 핀테크 자산관리 앱 스타일
    calcSection.innerHTML = `
        <div style="background: #ffffff; padding: 40px; border-radius: 32px; box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.04); border: 1px solid #e2e8f0; box-sizing: border-box;">
            
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 36px; padding-bottom: 24px; border-bottom: 2px solid #f8fafc; align-items: end;">
                <div class="logo-area" style="display: flex; flex-direction: column; gap: 6px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="live-pulse"></span>
                        <h2 style="margin: 0; font-size: 20px; font-weight: 900; color: #0f172a;">OMNI MVP</h2>
                    </div>
                </div>
                
                <div style="display: flex; justify-content: center; gap: 8px;">
                    <select id="serverSelect" class="expert-input" onchange="saveServer()" style="padding: 6px 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; font-weight: 800; color: #0f172a;">
                        <option value="엘리시움">엘리시움</option>
                        <option value="스카니아">스카니아</option>
                        <option value="루나">루나</option>
                        <option value="유니온">유니온</option>
                    </select>
                    <input type="month" id="monthFilter" class="expert-input" onchange="changeFilter()" style="padding: 6px 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; font-weight: 800; color: #0f172a;">
                </div>

                <div style="display: flex; justify-content: end; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc;">
                    <span style="font-size: 11px; font-weight: 800; color: #64748b;">🪙 1억 시세</span>
                    <input type="number" id="marketPrice" class="expert-input" placeholder="1600" oninput="calculateAll()" style="width: 70px; border: none; background: transparent; font-weight: 900; font-size: 13px; text-align: right; color: #6366f1;">
                    <span style="font-size: 11px; font-weight: 800; color: #94a3b8;">원</span>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 16px; width: 100%;">
                <div style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; justify-content: center; gap: 8px;">
                    <div style="font-size: 11px; font-weight: 800; color: #64748b;">🎯 TARGET CHARGE (목표 캐시액)</div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input type="text" id="chargeAmount" class="expert-input" oninput="applyRealtimeComma(this); saveCharge();" style="flex: 1; border: none; background: transparent; font-size: 18px; font-weight: 900; text-align: right; color: #0f172a; outline: none;">
                        <span style="font-size: 14px; font-weight: 800; color: #475569;">원</span>
                    </div>
                </div>
                <div style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; justify-content: center; gap: 8px;">
                    <div style="font-size: 11px; font-weight: 800; color: #64748b;">💰 CURRENT OWNED MESO (보유 메소)</div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input type="text" id="existingMeso" class="expert-input" oninput="applyRealtimeComma(this); saveExistingMeso();" style="flex: 1; border: none; background: transparent; font-size: 18px; font-weight: 900; text-align: right; color: #0f172a; outline: none;">
                        <span style="font-size: 14px; font-weight: 800; color: #475569;">메소</span>
                    </div>
                </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 32px;">
                <button class="omni-btn" onclick="exportMvpData()" style="background: #ffffff; border: 1px solid #e2e8f0; padding: 8px 16px; border-radius: 8px; font-size: 11px; font-weight: 800; color: #64748b;">💾 데이터 백업</button>
                <label class="omni-btn" style="background: #ffffff; border: 1px solid #e2e8f0; padding: 8px 16px; border-radius: 8px; font-size: 11px; font-weight: 800; color: #64748b;">📦 데이터 복구<input type="file" onchange="importMvpData(event)" style="display:none;"></label>
                <button class="omni-btn" onclick="resetAllData()" style="color: #ef4444; font-weight: 800; background: #fff1f2; border: 1px solid #ffe4e6; padding: 8px 16px; border-radius: 8px; font-size: 11px;">초기화 ↺</button>
            </div>

            <div class="dashboard-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 24px; margin-bottom: 32px;">
                <div class="stat-card" style="background: #ffffff; border-radius: 24px; padding: 28px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);">
                    <div>
                        <div class="stat-title" style="font-size: 11px; font-weight: 800; color: #64748b; margin-bottom: 20px; letter-spacing: 0.8px; display: flex; align-items: center; gap: 6px;">
                            <span style="width: 8px; height: 8px; background: #6366f1; border-radius: 50%; box-shadow: 0 0 8px rgba(99, 102, 241, 0.5);"></span>GOAL & CHARGE INDICATOR
                        </div>
                        <div style="font-size: 13px; color: #64748b; font-weight: 700; margin-bottom: 6px;">목표 회수 예상 총액</div>
                        <div style="font-size: 28px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; margin-bottom: 24px;"><span id="targetMeso">0</span> <span style="font-size: 16px; font-weight: 800; color: #475569;">메소</span></div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 14px; padding-top: 20px; border-top: 2px dashed #f1f5f9;">
                        <div style="display: flex; justify-content: space-between; font-size: 14px; color: #64748b; font-weight: 700;"><span>사용한 누적 캐시</span> <span style="font-weight: 900; color: #0f172a;"><span id="totalUsedCash">0</span> 원</span></div>
                        <div style="display: flex; justify-content: space-between; font-size: 14px; color: #64748b; font-weight: 700;"><span>남은 한도 잔여 캐시</span> <span style="font-weight: 900; color: #6366f1;"><span id="remainCash">0</span> 원</span></div>
                    </div>
                </div>
                
                <div class="stat-card" style="background: #ffffff; border-radius: 24px; padding: 28px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);">
                    <div>
                        <div class="stat-title" style="font-size: 11px; font-weight: 800; color: #64748b; margin-bottom: 20px; letter-spacing: 0.8px; display: flex; align-items: center; gap: 6px;">
                            <span style="width: 8px; height: 8px; background: #0f172a; border-radius: 50%;"></span>PORTFOLIO LOSS REPORT
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                            <div>
                                <div style="font-size: 13px; color: #64748b; font-weight: 700; margin-bottom: 6px;">누적 캐시 손익률</div>
                                <div style="font-size: 28px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;" id="totalLossAmount">0원</div>
                            </div>
                            <div style="background: #0f172a; color: #ffffff; padding: 6px 14px; border-radius: 10px; font-size: 15px; font-weight: 900; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"><span id="totalLossRate">0</span>%</div>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 14px; padding-top: 20px; border-top: 2px dashed #f1f5f9;">
                        <div style="display: flex; justify-content: space-between; font-size: 14px; color: #64748b; font-weight: 700;"><span>정산 완료 메소 <span style="font-size:11px; color:#94a3b8; font-weight:normal;">(-3%)</span></span> <span style="font-weight: 900; color: #0f172a;"><span id="totalExchangedMeso">0</span> 메소</span></div>
                        <div style="display: flex; justify-content: space-between; font-size: 14px; color: #64748b; font-weight: 700;"><span>잔액 포함 총 보유 메소</span> <span style="font-weight: 900; color: #10b981;"><span id="totalOwnedMeso">0</span> 메소</span></div>
                        <div style="display: flex; justify-content: space-between; font-size: 14px; color : #64748b; font-weight: 700;"><span>목표대비 남은 회수량</span> <span style="font-weight: 900; color: #0f172a;"><span id="remainMeso">0</span></span></div>
                    </div>
                </div>
            </div>

            <div style="margin-bottom: 40px; padding: 0 4px;">
                <div style="font-size: 12px; font-weight: 800; color: #475569; margin-bottom: 12px; display: flex; justify-content: space-between; letter-spacing: -0.3px;">
                    <span>📊 당월 메소 목표치 회수 진행 스코어</span>
                </div>
                <div class="progress-container" style="width: 100%; background: #f1f5f9; height: 12px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);">
                    <div id="mesoProgressBar" class="progress-bar" style="height: 100%; background: linear-gradient(90deg, #0f172a, #6366f1); width: 0%; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                </div>
            </div>

            <div class="tab-container" style="display: flex; justify-content: center; margin-bottom: 24px;">
                <div class="pill-tabs" style="display: inline-flex; background: #f1f5f9; border-radius: 8px; padding: 3px; gap: 3px; border: 1px solid #e2e8f0;">
                    <button class="tab-btn active omni-btn" onclick="mvpTabControl('sim-tab', event)" style="padding: 6px 14px; border: none; border-radius: 6px; font-weight: 800; font-size: 12px;">📈 시뮬</button>
                    <button class="tab-btn omni-btn" onclick="mvpTabControl('inv-tab', event)" style="padding: 6px 14px; border: none; border-radius: 6px; font-weight: 800; font-size: 12px; background: transparent; color: #64748b;">📦 재고</button>
                    <button class="tab-btn omni-btn" onclick="mvpTabControl('rec-tab', event)" style="padding: 6px 14px; border: none; border-radius: 6px; font-weight: 800; font-size: 12px; background: transparent; color: #64748b;">🧾 기록장</button>
                </div>
            </div>

            <div id="sim-tab" class="page-content" style="display: block;">
                <div class="toolbar" style="display: flex; gap: 6px; margin-bottom: 12px; justify-content: flex-end;">
                    <div class="preset-container" style="display: flex; gap: 4px; width: 100%; max-width: 440px;">
                        <select id="simPreset" class="preset-select expert-input" onchange="applyPreset('sim')" style="flex: 1; border-radius: 6px; border: 1px solid #cbd5e1; padding: 4px 8px; font-weight: 700; color: #475569; background: #ffffff; height: 32px; font-size: 12px;"></select>
                        <button class="omni-btn" onclick="saveAsPreset('sim')" style="background: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; padding: 0 12px; border-radius: 6px; font-weight: 800; height: 32px; font-size: 11px;">📌 저장</button>
                        <button class="omni-btn" onclick="deletePreset('sim')" style="background: #ffffff; color: #94a3b8; border: 1px solid #cbd5e1; padding: 0 12px; border-radius: 6px; font-weight: 800; height: 32px; font-size: 11px;">🗑️ 삭제</button>
                    </div>
                </div>
                <div class="add-box" style="display: flex; gap: 8px; background: #f8fafc; padding: 12px; border-radius: 12px; margin-bottom: 18px; border: 1px solid #e2e8f0; flex-wrap: wrap; align-items: center;">
                    <input type="text" id="simCategory" placeholder="시뮬레이션 품목 입력" class="expert-input" style="flex: 2; min-width:140px; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: 700; color: #0f172a; font-size: 12px; height: 34px;">
                    <input type="text" id="simAmount" placeholder="수량" class="expert-input" style="flex: 0.5; min-width:60px; text-align: center; padding: 6px 4px; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: 800; color: #0f172a; font-size: 12px; height: 34px;" oninput="applyRealtimeComma(this)">
                    <input type="text" id="simCash" placeholder="소모 캐시가" class="expert-input" style="flex: 1; min-width:100px; text-align: right; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: 800; color: #0f172a; font-size: 12px; height: 34px;" oninput="applyRealtimeComma(this)">
                    <button class="omni-btn" onclick="addSimItem()" style="background: #0f172a; color: white; border: none; padding: 0 16px; border-radius: 8px; font-weight: 800; font-size: 12px; height: 34px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">➕ 추가</button>
                </div>
                <div id="sim-container"></div>
            </div>

            <div id="inv-tab" class="page-content" style="display: none;">
                <div class="toolbar" style="display: flex; gap: 6px; margin-bottom: 12px; justify-content: flex-end;">
                    <div class="preset-container" style="display: flex; gap: 4px; width: 100%; max-width: 440px;">
                        <select id="invPreset" class="preset-select expert-input" onchange="applyPreset('inv')" style="flex: 1; border-radius: 6px; border: 1px solid #cbd5e1; padding: 4px 8px; font-weight: 700; color: #475569; background: #ffffff; height: 32px; font-size: 12px;"></select>
                        <button class="omni-btn" onclick="saveAsPreset('inv')" style="background: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; padding: 0 12px; border-radius: 6px; font-weight: 800; height: 32px; font-size: 11px;">📌 저장</button>
                        <button class="omni-btn" onclick="deletePreset('inv')" style="background: #ffffff; color: #94a3b8; border: 1px solid #cbd5e1; padding: 0 12px; border-radius: 6px; font-weight: 800; height: 32px; font-size: 11px;">🗑️ 삭제</button>
                    </div>
                </div>
                <div class="add-box" style="display: flex; gap: 8px; background: #f8fafc; padding: 12px; border-radius: 12px; margin-bottom: 18px; border: 1px solid #e2e8f0; flex-wrap: wrap; align-items: center;">
                    <input type="date" id="invDate" class="expert-input" style="flex: 1.2; min-width: 120px; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: 700; color:#0f172a; font-size: 12px; height: 34px;">
                    <input type="text" id="invCategory" placeholder="재고 물품명" class="expert-input" style="flex: 1.5; min-width:130px; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: 700; color:#0f172a; font-size: 12px; height: 34px;">
                    <input type="number" id="invSetCount" placeholder="묶음" value="1" class="expert-input" style="flex: 0.5; min-width:60px; text-align: center; padding: 6px 4px; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: 800; color:#0f172a; font-size: 12px; height: 34px;">
                    <input type="text" id="invAmount" placeholder="묶음당 개수" class="expert-input" style="flex: 0.6; min-width:70px; text-align: center; padding: 6px 4px; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: 800; color:#0f172a; font-size: 12px; height: 34px;" oninput="applyRealtimeComma(this)">
                    <input type="text" id="invCash" placeholder="묶음당 캐시가" class="expert-input" style="flex: 1; min-width:100px; text-align: right; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: 800; color:#0f172a; font-size: 12px; height: 34px;" oninput="applyRealtimeComma(this)">
                    <button class="omni-btn" onclick="addInvItem()" style="background: #0f172a; color: white; border: none; padding: 0 16px; border-radius: 8px; font-weight: 800; font-size: 12px; height: 34px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">📥 입고</button>
                </div>
                <div class="omni-table-wrapper" style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 16px;">
                    <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 13px; table-layout: auto; min-width: 850px; background: #ffffff;">
                        <colgroup>
                            <col style="width: 12%;">
                            <col style="width: 20%;">
                            <col style="width: 15%;">
                            <col style="width: 25%;">
                            <col style="width: 15%;">
                            <col style="width: 13%;">
                        </colgroup>
                        <thead>
                            <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 800;">
                                <th style="padding:14px 8px; text-align:center;">입고일</th>
                                <th style="text-align:left; padding-left:16px;">품목 구성</th>
                                <th style="text-align:center;">투자 금액</th>
                                <th style="text-align:center;">판매 메소 단가</th>
                                <th style="text-align:center;">예상 리턴</th>
                                <th style="text-align:center;">액션</th>
                            </tr>
                        </thead>
                        <tbody id="inventory-list" style="color: #334155; font-weight: 600;"></tbody>
                    </table>
                </div>
            </div>

            <div id="rec-tab" class="page-content" style="display: none;">
                <div class="omni-table-wrapper" style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 16px;">
                    <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 13px; table-layout: auto; min-width: 850px; background: #ffffff;">
                        <colgroup>
                            <col style="width: 14%;">
                            <col style="width: 22%;">
                            <col style="width: 15%;">
                            <col style="width: 13%;">
                            <col style="width: 13%;">
                            <col style="width: 13%;">
                            <col style="width: 10%;">
                        </colgroup>
                        <thead>
                            <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 800;">
                                <th style="padding:14px 8px; text-align:center;">판매 확정일</th>
                                <th style="text-align:left; padding-left:16px;">판매 물품명</th>
                                <th style="text-align:right; padding-right:16px;">매출 메소</th>
                                <th style="text-align:right; padding-right:16px;">소모 캐시</th>
                                <th style="text-align:right; padding-right:16px;">캐시 환산</th>
                                <th style="text-align:right; padding-right:16px;">순손익</th>
                                <th style="text-align:center;">작업</th>
                            </tr>
                        </thead>
                        <tbody id="record-list" style="color: #334155; font-weight: 600;"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    parentContainer.appendChild(calcSection);

    calcSection.style.display = 'block';

    // 🛡️ [UI 데이터 바인딩 롤백 복구 전용 방어막]
    setTimeout(() => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = (d.getMonth() + 1).toString().padStart(2, '0');
        const dd = d.getDate().toString().padStart(2, '0');
        const mVal = `${yyyy}-${mm}`;
        const dVal = `${yyyy}-${mm}-${dd}`;

        if (document.getElementById('serverSelect')) document.getElementById('serverSelect').value = localStorage.getItem('mapleServer') || '엘리시움';
        if (document.getElementById('marketPrice')) document.getElementById('marketPrice').value = localStorage.getItem('mapleMarketPrice') || 1600;
        
        const existingMeso = document.getElementById('existingMeso');
        if (existingMeso && localStorage.getItem('mapleExistingMeso')) existingMeso.value = parseNum(localStorage.getItem('mapleExistingMeso')).toLocaleString();

        const mF = document.getElementById('monthFilter');
        if (mF) { mF.value = mVal; window.changeFilter(); }

        const iD = document.getElementById('invDate');
        if (iD) iD.value = dVal;

        renderPresets(); 
        window.calculateAll();
    }, 200);
};

/**
 * ============================================================================
 * 🧹 [기능 모듈 내부 함수 및 유틸리티 로직 라인]
 * ============================================================================
 */

function parseNum(val) {
    if (val === undefined || val === null || val === '') return 0;
    return parseFloat(val.toString().replace(/,/g, '')) || 0;
}


window.saveServer = function() { 
    const el = document.getElementById('serverSelect');
    if(el) localStorage.setItem('mapleServer', el.value); 
}

window.calculateAll = function() { 
    const marketPriceEl = document.getElementById('marketPrice');
    if (!marketPriceEl) return; 

    localStorage.setItem('mapleMarketPrice', marketPriceEl.value); 
    renderSimTable(); 
    renderInventoryTable(); 
    renderRecordTable(); 
    updateStats(); 
}

window.mvpTabControl = function(tabId, event) { 
    document.querySelectorAll('#mvpCalcSection .page-content').forEach(el => el.style.display = 'none'); 
    const target = document.getElementById(tabId);
    if(target) target.style.display = 'block'; 
    
    document.querySelectorAll('#mvpCalcSection .tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'transparent';
        btn.style.color = '#64748b';
        btn.style.boxShadow = 'none';
    }); 
    
    event.currentTarget.classList.add('active'); 
    event.currentTarget.style.background = '#ffffff';
    event.currentTarget.style.color = '#0f172a';
    event.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';

    if (typeof window.calculateAll === 'function') window.calculateAll();
}

// ================= 프리셋 처리 구역 =================

function getAllPresets() { return [...BASE_PRESETS, ...customPresets]; }

function renderPresets() {
    const selects = ['simPreset', 'invPreset'];
    selects.forEach(id => {
        const sel = document.getElementById(id);
        if(!sel) return;
        sel.innerHTML = '<option value="">🌟 자주 쓰는 캐시 정산 품목 프리셋 리스트</option>';
        sel.innerHTML += '<optgroup label="[기본 시스템 내장 품목]">';
        BASE_PRESETS.forEach(p => { sel.innerHTML += `<option value="${p.id}">${p.name} (${p.amount}개) - ${p.cash.toLocaleString()}원</option>`; });
        sel.innerHTML += '</optgroup>';
        if (customPresets.length > 0) {
            sel.innerHTML += '<optgroup label="[유저 커스텀 저장 품목]">';
            customPresets.forEach(p => { sel.innerHTML += `<option value="${p.id}">${p.name} (${p.amount}개) - ${p.cash.toLocaleString()}원</option>`; });
            sel.innerHTML += '</optgroup>';
        }
        sel.innerHTML += '<option value="custom">✏️ 직접 입력하기 (공란 양식)</option>';
    });
}

window.saveAsPreset = function(tabType) {
    let nameId = tabType === 'sim' ? 'simCategory' : 'invCategory';
    let amountId = tabType === 'sim' ? 'simAmount' : 'invAmount';
    let cashId = tabType === 'sim' ? 'simCash' : 'invCash';
    
    const nameEl = document.getElementById(nameId);
    const amountEl = document.getElementById(amountId);
    const cashEl = document.getElementById(cashId);
    if(!nameEl || !amountEl || !cashEl) return;

    const name = nameEl.value;
    const amount = parseNum(amountEl.value);
    const cash = parseNum(cashEl.value);
    
    if(!name || amount <= 0 || cash <= 0) return alert("품목명, 구성 수량, 캐시 소모액을 빠짐없이 채워주세요!");
    
    const newPreset = { id: 'custom_' + Date.now(), name, amount, cash };
    customPresets.push(newPreset);
    localStorage.setItem('mapleCustomPresets', JSON.stringify(customPresets));
    renderPresets();
    document.getElementById(tabType + 'Preset').value = newPreset.id;
    alert(`[${name}] 프리셋 슬롯에 영구 등록되었습니다.`);
}

window.deletePreset = function(tabType) {
    const presetEl = document.getElementById(tabType + 'Preset');
    if(!presetEl) return;
    const selId = presetEl.value;
    
    if(!selId || selId === 'custom') return alert("삭제 대상 커스텀 프리셋을 셀렉트 박스에서 선택하세요.");
    if(selId.startsWith('base_')) return alert("시스템 기본 내장 프리셋은 보호 관리 대상이므로 삭제가 불가능합니다.");
    if(confirm("해당 프리셋 양식을 리스트에서 삭제 처리할까요?")) {
        customPresets = customPresets.filter(p => p.id !== selId);
        localStorage.setItem('mapleCustomPresets', JSON.stringify(customPresets));
        renderPresets(); window.applyPreset(tabType);
    }
}

window.applyPreset = function(tabType) {
    const presetEl = document.getElementById(tabType + 'Preset');
    if(!presetEl) return;
    const selectedValue = presetEl.value;
    
    let nameId = tabType === 'sim' ? 'simCategory' : 'invCategory';
    let amountId = tabType === 'sim' ? 'simAmount' : 'invAmount';
    let cashId = tabType === 'sim' ? 'simCash' : 'invCash';
    
    if(!selectedValue || selectedValue === 'custom') {
        document.getElementById(nameId).value = ''; document.getElementById(amountId).value = ''; document.getElementById(cashId).value = '';
        if(tabType === 'inv') document.getElementById('invSetCount').value = '1';
        return;
    }
    const data = getAllPresets().find(p => p.id === selectedValue);
    if(data) {
        document.getElementById(nameId).value = data.name; document.getElementById(amountId).value = data.amount; document.getElementById(cashId).value = data.cash.toLocaleString();
        if(tabType === 'inv') document.getElementById('invSetCount').value = '1'; 
    }
}

// ================= 자산 목표 수치 고밀도 연산 처리장 =================

window.saveExistingMeso = function() { 
    const el = document.getElementById('existingMeso');
    if(el) {
        localStorage.setItem('mapleExistingMeso', parseNum(el.value)); 
        updateStats(); 
    }
}

window.saveCharge = function() {
    const monthEl = document.getElementById('monthFilter');
    const chargeEl = document.getElementById('chargeAmount');
    if(!monthEl || !chargeEl) return;

    const d = new Date();
    const currentMonth = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    const month = monthEl.value || currentMonth;
    let val = parseNum(chargeEl.value);
    monthlyCharges[month] = val;
    localStorage.setItem('mapleMonthlyCharges', JSON.stringify(monthlyCharges));
    localStorage.setItem('mapleChargeAmount', val);
    updateStats(); 
}

window.changeFilter = function() { renderSimTable(); renderRecordTable(); renderInventoryTable(); updateStats(); }

function getFilteredRecords() {
    const monthEl = document.getElementById('monthFilter');
    const monthVal = monthEl ? monthEl.value : '';
    return recordData.filter(item => monthVal ? item.date.startsWith(monthVal) : true);
}

// 🧮 [초보자 가이드 주석] 사용자가 기입한 데이터를 바탕으로 상단 카드 섹션의 목표 메소량, 남은 잔액 등을 계산하는 로직입니다.
function updateStats() {
    const monthEl = document.getElementById('monthFilter');
    const chargeInput = document.getElementById('chargeAmount');
    const marketPriceInput = document.getElementById('marketPrice');
    
    if (!monthEl || !chargeInput || !marketPriceInput) return; 

    const d = new Date();
    const currentMonth = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    const month = monthEl.value || currentMonth;
    
    if (document.activeElement !== chargeInput) {
        let charge = monthlyCharges[month] !== undefined ? monthlyCharges[month] : (parseNum(localStorage.getItem('mapleChargeAmount')) || 1530000);
        chargeInput.value = charge.toLocaleString();
    }

    const currentCharge = parseNum(chargeInput.value);
    const mPrice = parseNum(marketPriceInput.value) || 1600;
    const unit = mPrice / 100000000;
    const targetMeso = Math.floor(currentCharge / unit);
    
    let totalUsedCash = 0, totalExchangedMeso = 0, totalReturnCash = 0;
    let soldCash = 0; 

    getFilteredRecords().forEach(item => {
        totalUsedCash += item.cash; soldCash += item.cash;      
        let actualMesoEarned = Math.floor(item.meso * 0.97); // 경매장 수수료 3% 공제
        totalExchangedMeso += actualMesoEarned;
        totalReturnCash += Math.floor(actualMesoEarned * unit);
    });

    inventoryData.filter(item => item.buyDate.startsWith(month)).forEach(item => { totalUsedCash += item.cash; });

    // 사용자의 정정 요청에 따라, 기존 보유 메소를 제외하고 당월 벌어들인(totalExchangedMeso) 메소만 목표액에서 차감합니다.
    const remainCash = currentCharge - totalUsedCash;
    const remainMeso = targetMeso - totalExchangedMeso;
    const lossAmount = soldCash - totalReturnCash;
    const totalLossRate = soldCash > 0 ? (lossAmount / soldCash * 100).toFixed(2) : 0;

    const lossElement = document.getElementById('totalLossAmount');
    if (lossElement) {
        if (lossAmount > 0) { 
            lossElement.innerText = "-" + lossAmount.toLocaleString() + "원"; 
            lossElement.style.color = "#e11d48"; // 전문가적인 크림슨 레드 (손실)
        } else if (lossAmount < 0) { 
            lossElement.innerText = "+" + Math.abs(lossAmount).toLocaleString() + "원 (수익)"; 
            lossElement.style.color = "#10b981"; // 전문가적인 에메랄드 그린 (수익)
        } else { 
            lossElement.innerText = "0원"; 
            lossElement.style.color = "#64748b"; 
        }
    }

    const existingMeso = parseNum(document.getElementById('existingMeso').value);
    
    document.getElementById('targetMeso') && (document.getElementById('targetMeso').innerText = targetMeso.toLocaleString());
    document.getElementById('totalUsedCash') && (document.getElementById('totalUsedCash').innerText = totalUsedCash.toLocaleString());
    document.getElementById('remainCash') && (document.getElementById('remainCash').innerText = remainCash.toLocaleString());
    document.getElementById('totalExchangedMeso') && (document.getElementById('totalExchangedMeso').innerText = totalExchangedMeso.toLocaleString());
    document.getElementById('totalOwnedMeso') && (document.getElementById('totalOwnedMeso').innerText = (existingMeso + totalExchangedMeso).toLocaleString());
    document.getElementById('remainMeso') && (document.getElementById('remainMeso').innerText = (targetMeso <= 0 && totalExchangedMeso === 0) ? "0" : (remainMeso > 0 ? remainMeso.toLocaleString() : "🎯 목표 한도 달성!"));
    document.getElementById('totalLossRate') && (document.getElementById('totalLossRate').innerText = totalLossRate);

    // 진행률 표시줄(Progress Bar)도 기존 보유 메소(existingMeso)를 제외하고 반영됩니다.
    const percent = targetMeso > 0 ? Math.min((totalExchangedMeso / targetMeso) * 100, 100) : 0;
    const bar = document.getElementById('mesoProgressBar');
    if(bar) bar.style.width = percent + '%';
}

// ================= 📈 1. 실시간 시뮬레이션 테이블 렌더러 =================

window.addSimItem = function() {
    const categoryEl = document.getElementById('simCategory');
    const amountEl = document.getElementById('simAmount');
    const cashEl = document.getElementById('simCash');
    const monthEl = document.getElementById('monthFilter');
    
    if(!categoryEl || !amountEl || !cashEl) return;

    const category = categoryEl.value;
    const amount = parseNum(amountEl.value);
    const cash = parseNum(cashEl.value);
    const d = new Date();
    const currentMonth = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    const month = monthEl ? (monthEl.value || currentMonth) : currentMonth;
    
    if(!category || amount <= 0 || cash <= 0) return alert("품목명, 구성 수량, 캐시가를 양식에 맞춰 기입하세요.");
    
    simData.push({ id: Date.now(), month: month, category, amount, cash, yesterdayMeso: 0, todayMeso: 0 });
    localStorage.setItem('mapleSimData', JSON.stringify(simData));
    
    const simPreset = document.getElementById('simPreset');
    if(simPreset) simPreset.value = ''; 
    window.applyPreset('sim'); 
    renderSimTable();
}

window.updateSimPrice = function(id, type, value) {
    const item = simData.find(d => d.id === id);
    if(item) { item[type] = parseNum(value); localStorage.setItem('mapleSimData', JSON.stringify(simData)); renderSimTable(); }
}

function renderSimTable() {
    const container = document.getElementById('sim-container');
    if(!container) return; 
    container.innerHTML = '';
    
    const monthEl = document.getElementById('monthFilter');
    if(!monthEl) return;

    const currentMonth = monthEl.value;
    const filteredSims = simData.filter(item => item.month === currentMonth).sort((a, b) => a.amount - b.amount);
    const groups = filteredSims.reduce((acc, item) => { (acc[item.category] = acc[item.category] || []).push(item); return acc; }, {});

    const marketPriceEl = document.getElementById('marketPrice');
    const mPrice = marketPriceEl ? (parseNum(marketPriceEl.value) || 1600) : 1600;

    for (const cat in groups) {
        const div = document.createElement('div');
        div.className = "omni-table-wrapper";
        div.style = "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 24px; overflow-x: auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);";
        
        div.innerHTML = `
            <div style="font-weight: 800; color: #0f172a; margin-bottom: 16px; font-size: 15px; display:flex; align-items:center; gap:8px;">
                <span style="display:inline-block; width:8px; height:8px; background:#6366f1; border-radius:50%;"></span>📦 ${cat}
            </div>
            <table style="width:100%; border-collapse:collapse; font-size:13px; text-align:center; table-layout: auto; min-width: 820px;">
                <colgroup>
                    <col style="width: 12%;">
                    <col style="width: 12%;">
                    <col style="width: 18%;">
                    <col style="width: 18%;">
                    <col style="width: 12%;">
                    <col style="width: 12%;">
                    <col style="width: 10%;">
                    <col style="width: 6%;">
                </colgroup>
                <thead>
                    <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color:#475569; font-weight:800;">
                        <th style="padding:12px 4px; text-align:center;">구성</th>
                        <th style="text-align:center;">기본 캐시가</th>
                        <th style="text-align:center;">어제 Auction</th>
                        <th style="text-align:center;">오늘 Auction</th>
                        <th style="text-align:center;">시세 차액</th>
                        <th style="text-align:center;">시뮬 손익</th>
                        <th style="text-align:center;">개당 마진가</th>
                        <th style="text-align:center;">제어</th>
                    </tr>
                </thead>
                <tbody style="font-weight:600; color:#334155;"></tbody>
            </table>`;
            
        const tbody = div.querySelector('tbody');
        groups[cat].forEach(item => {
            const unit = mPrice / 100000000;
            const activeMeso = item.todayMeso > 0 ? item.todayMeso : (item.yesterdayMeso || 0);
            const returnCash = Math.floor(activeMeso * 0.97 * unit);
            const profit = returnCash - item.cash;
            const perProfit = item.amount > 0 ? Math.floor(profit / item.amount).toLocaleString() + "원" : "0원";
            
            let pColor = profit < 0 ? '#e11d48' : '#10b981';
            if(profit === 0) pColor = '#475569';

            const diff = (item.todayMeso && item.yesterdayMeso) ? (item.todayMeso - item.yesterdayMeso) : 0;
            let diffStr = "─"; 
            let dColor = "#64748b";
            if (diff > 0) { diffStr = "▲ " + diff.toLocaleString(); dColor = '#10b981'; } 
            else if (diff < 0) { diffStr = "▼ " + Math.abs(diff).toLocaleString(); dColor = '#e11d48'; }
            
            const row = document.createElement('tr');
            row.style.borderBottom = "1px solid #f1f5f9";
            row.style.verticalAlign = "middle";
            row.innerHTML = `
                <td style="padding:12px 4px; color:#334155;">${item.amount}개 구성</td>
                <td style="color:#64748b;">${item.cash.toLocaleString()}</td>
                <td style="padding:6px 4px;"><input type="text" class="expert-input" value="${item.yesterdayMeso ? item.yesterdayMeso.toLocaleString() : ''}" style="width:100%; max-width:130px; text-align:right; padding:8px 10px; border:1px solid #cbd5e1; border-radius:8px; font-weight:800; color:#0f172a; outline:none; font-size:12px; font-family:inherit; height:34px;" oninput="applyRealtimeComma(this)" onchange="updateSimPrice(${item.id}, 'yesterdayMeso', this.value)"></td>
                <td style="padding:6px 4px;"><input type="text" class="expert-input" value="${item.todayMeso ? item.todayMeso.toLocaleString() : ''}" style="width:100%; max-width:130px; text-align:right; padding:8px 10px; border:1px solid #cbd5e1; border-radius:8px; font-weight:800; color:#0f172a; outline:none; font-size:12px; font-family:inherit; height:34px;" oninput="applyRealtimeComma(this)" onchange="updateSimPrice(${item.id}, 'todayMeso', this.value)"></td>
                <td style="color:${dColor}; font-weight:800; font-size:12px;">${diffStr}</td>
                <td style="color:${pColor}; font-weight:900;">${profit.toLocaleString()}원</td>
                <td style="color:${pColor}; font-weight:800; font-size:12px;">${perProfit}</td>
                <td><button class="omni-btn" style="padding:6px 12px; font-size:11px; border:1px solid #cbd5e1; background:white; color:#64748b; border-radius:8px; font-weight:700; height:30px;" onmouseover="this.style.color='#ef4444'; this.style.borderColor='#fca5a5';" onmouseout="this.style.color='#64748b'; this.style.borderColor='#cbd5e1';" onclick="delSimItem(${item.id})">삭제</button></td>
            `;
            tbody.appendChild(row);
        });
        container.appendChild(div);
    }
}

window.delSimItem = function(id) { simData = simData.filter(d => d.id !== id); localStorage.setItem('mapleSimData', JSON.stringify(simData)); renderSimTable(); }

// ================= 📦 2. 입고 재고 현황판 테이블 렌더러 =================

window.addInvItem = function() {
    const dateEl = document.getElementById('invDate');
    const catEl = document.getElementById('invCategory');
    const setEl = document.getElementById('invSetCount');
    const amtEl = document.getElementById('invAmount');
    const cashEl = document.getElementById('invCash');
    
    if(!dateEl || !catEl || !setEl || !amtEl || !cashEl) return;

    const buyDate = dateEl.value;
    const name = catEl.value;
    const setCount = parseNum(setEl.value) || 1;
    const unitAmount = parseNum(amtEl.value) || 1;
    const unitCash = parseNum(cashEl.value); 
    const totalAmount = unitAmount * setCount;
    const totalCash = unitCash * setCount; 
    
    if(!name || totalAmount <= 0 || unitCash <= 0) return alert("입고 품목의 수량 및 단가 정보를 다시 확인하세요.");
    inventoryData.push({ id: Date.now(), buyDate, name, unitAmount, setCount, amount: totalAmount, cash: totalCash, unitCash });
    localStorage.setItem('mapleInventoryData', JSON.stringify(inventoryData));
    
    const presetEl = document.getElementById('invPreset');
    if(presetEl) presetEl.value = ''; 
    window.applyPreset('inv'); 
    renderInventoryTable(); 
    updateStats(); 
}

function renderInventoryTable() {
    const tbody = document.getElementById('inventory-list');
    if(!tbody) return; 
    tbody.innerHTML = '';
    
    const monthEl = document.getElementById('monthFilter');
    const month = monthEl ? monthEl.value : '';

    inventoryData.filter(item => item.buyDate.startsWith(month)).forEach(item => {
        const uAmt = item.unitAmount || 1;
        const sCnt = item.setCount !== undefined ? item.setCount : item.amount;
        const isBundle = uAmt > 1; 
        const displayName = isBundle ? `<span style="font-weight:800; color:#0f172a;">${item.name}</span><br><span style="font-size:11px; color:#64748b; font-weight:600;">${uAmt}개 단위 × ${sCnt}개 보관중</span>` : `<span style="font-weight:800; color:#0f172a;">${item.name}</span><br><span style="font-size:11px; color:#64748b; font-weight:600;">총 ${sCnt}개 보유</span>`;
        
        const row = document.createElement('tr');
        row.style.borderBottom = "1px solid #f1f5f9";
        row.style.verticalAlign = "middle";
        row.innerHTML = `
            <td style="padding:16px 8px; color:#64748b; font-size:12px; font-weight:600;">${item.buyDate}</td>
            <td style="text-align:left; padding-left:16px;">${displayName}</td>
            <td style="font-weight:800; color:#475569;">${item.cash.toLocaleString()}</td>
            <td style="padding:8px 4px;">
                <div style="display:flex; align-items:center; justify-content:center; gap:6px; margin-bottom:8px;">
                    <input type="text" class="expert-input" id="inv-sell-amount-${item.id}" value="${sCnt}" style="width:60px; height:32px; text-align:center; padding:4px; border:1px solid #cbd5e1; border-radius:8px; font-weight:800; color:#0f172a; outline:none; font-size:12px; font-family:inherit;">
                    <span style="font-size: 11px; font-weight: 700; color: #475569;">${isBundle ? "묶음" : "단품"} 출고</span>
                </div>
                <input type="text" class="expert-input" id="inv-meso-${item.id}" style="border: 1px solid #cbd5e1; border-radius:8px; width:140px; height:34px; text-align:right; padding:6px 10px; font-weight:800; color:#0f172a; outline:none; font-size:12px; font-family:inherit;" placeholder="${isBundle ? "1묶음 정산가" : "1개당 정산가"}" oninput="applyRealtimeComma(this)">
            </td>
            <td style="color:#94a3b8; font-size:11px; font-weight:600; line-height:1.5;">확정 출고 후<br>연산 집계됨</td>
            <td style="padding:8px 4px;">
                <div style="display:flex; flex-direction:column; gap:6px; align-items:center;">
                    <button class="omni-btn" style="background:#0f172a; color:white; border:none; border-radius:8px; padding:6px 12px; font-size:11px; font-weight:800; width:90px; height:30px;" onmouseover="this.style.background='#1e293b'" onmouseout="this.style.background='#0f172a'" onclick="sellItem(${item.id})">판매 완료</button>
                    <button class="omni-btn" style="background:white; border:1px solid #cbd5e1; color:#64748b; border-radius:8px; padding:4px 8px; font-size:11px; font-weight:700; width:90px; height:28px;" onmouseover="this.style.color='#ef4444'; this.style.borderColor='#fca5a5';" onmouseout="this.style.color='#64748b'; this.style.borderColor='#cbd5e1';" onclick="delInventoryItem(${item.id})">입고 취소</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

window.sellItem = function(id) {
    const item = inventoryData.find(d => d.id === id);
    if (!item) return;
    
    const mesoEl = document.getElementById(`inv-meso-${id}`);
    const sellAmtEl = document.getElementById(`inv-sell-amount-${id}`);
    if(!mesoEl || !sellAmtEl) return;

    const unitMesoVal = parseNum(mesoEl.value);
    const sellCount = parseNum(sellAmtEl.value); 
    const uAmt = item.unitAmount || 1;
    const sCnt = item.setCount !== undefined ? item.setCount : item.amount;
    const isBundle = uAmt > 1;
    
    if (sellCount <= 0 || sellCount > sCnt) return alert(`출고 처리가 불가능한 잔여 수량 범위입니다.`);
    if (unitMesoVal <= 0) return alert("실제 Auction에서 정산 환수된 메소 금액을 기입하세요!");
    
    const totalMesoVal = unitMesoVal * sellCount;
    const soldCash = item.unitCash ? (item.unitCash * sellCount) : Math.round((item.cash / sCnt) * sellCount); 
    const recordName = isBundle ? `${item.name} (${uAmt}개 묶음단위)` : item.name;
    
    recordData.push({ id: Date.now(), date: new Date().toISOString().substring(0, 10), name: recordName, amount: sellCount, meso: totalMesoVal, cash: soldCash });
    if (sellCount === sCnt) inventoryData = inventoryData.filter(d => d.id !== id);
    else { item.setCount -= sellCount; item.cash -= soldCash; item.amount = item.setCount * uAmt; }
    
    localStorage.setItem('mapleInventoryData', JSON.stringify(inventoryData));
    localStorage.setItem('mapleRecordData', JSON.stringify(recordData));
    renderInventoryTable(); 
    renderRecordTable(); 
    updateStats();
}

window.delInventoryItem = function(id) { 
    if(confirm("해당 캐시 입고 내역을 전면 환불/취소 처리할까요?")) { 
        inventoryData = inventoryData.filter(d => d.id !== id); 
        localStorage.setItem('mapleInventoryData', JSON.stringify(inventoryData)); 
        renderInventoryTable(); 
        updateStats(); 
    } 
}

// ================= 📝 3. 판매 영수증 기록장 렌더러 =================

function renderRecordTable() {
    const tbody = document.getElementById('record-list');
    if(!tbody) return; 
    tbody.innerHTML = '';
    
    const marketPriceEl = document.getElementById('marketPrice');
    const mPrice = marketPriceEl ? (parseNum(marketPriceEl.value) || 1600) : 1600;
    const unit = mPrice / 100000000;
    
    let filteredData = getFilteredRecords().sort((a, b) => { if(a.date < b.date) return 1; if(a.date > b.date) return -1; return 0; });

    filteredData.forEach(item => {
        const returnCash = Math.floor(item.meso * 0.97 * unit);
        const profit = returnCash - item.cash;
        
        let pColor = profit < 0 ? '#e11d48' : '#10b981';
        if(profit === 0) pColor = '#475569';
        
        const perProfit = item.amount > 0 ? Math.floor(profit / item.amount).toLocaleString() + "원" : "0원";

        const row = document.createElement('tr'); 
        row.dataset.id = item.id;
        row.style.borderBottom = "1px solid #f1f5f9";
        row.style.verticalAlign = "middle";
        row.innerHTML = `
            <td style="padding:16px 8px; color:#64748b; font-size:12px; font-weight:600;">${item.date}</td>
            <td style="text-align:left; padding-left:16px;"><strong style="color:#0f172a;">${item.name}</strong> <span style="color:#64748b; font-size:11px; font-weight:700;">(${item.amount}건 확정)</span></td>
            <td style="text-align:right; padding-right:16px; font-weight:800; color:#334155;">${item.meso.toLocaleString()}</td>
            <td style="text-align:right; padding-right:16px; color:#64748b; font-weight:700;">${item.cash.toLocaleString()}</td>
            <td style="text-align:right; padding-right:16px; font-weight:800; color:#475569;">${returnCash.toLocaleString()}</td>
            <td style="text-align:right; padding-right:16px; font-weight:900; color:${pColor};">${profit.toLocaleString()}원</td>
            <td style="text-align:center;">
                <button class="omni-btn" style="padding:6px 12px; font-size:11px; background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; color:#64748b; font-weight:800; height:30px;" onmouseover="this.style.color='#ef4444'; this.style.borderColor='#fca5a5';" onmouseout="this.style.color='#64748b'; this.style.borderColor='#cbd5e1';" onclick="delRecordItem(${item.id})">삭제</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

window.delRecordItem = function(id) { 
    if(confirm("선택한 영수증 판매 확정 기록을 삭제하고 재고 원장과 한도를 롤백할까요?")) {
        recordData = recordData.filter(d => d.id !== id); 
        localStorage.setItem('mapleRecordData', JSON.stringify(recordData)); 
        renderRecordTable(); 
        updateStats(); 
    }
}

// ================= 백업, 복구 및 초기화 컨트롤 유틸리티 =================

window.exportMvpData = function() {
    const dataToSave = { customPresets, simData, inventoryData, recordData, settings: { server: localStorage.getItem('mapleServer'), marketPrice: localStorage.getItem('mapleMarketPrice'), monthlyCharges: localStorage.getItem('mapleMonthlyCharges'), existingMeso: localStorage.getItem('mapleExistingMeso') } };
    const blob = new Blob([JSON.stringify(dataToSave)], {type: "application/json"}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `OMNI_MVP_Backup_${new Date().toISOString().substring(0,10)}.json`; a.click();
}

window.importMvpData = function(event) {
    const file = event.target.files[0]; if(!file) return; 
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if(data.customPresets) localStorage.setItem('mapleCustomPresets', JSON.stringify(data.customPresets));
            if(data.simData) localStorage.setItem('mapleSimData', JSON.stringify(data.simData));
            if(data.inventoryData) localStorage.setItem('mapleInventoryData', JSON.stringify(data.inventoryData));
            if(data.recordData) localStorage.setItem('mapleRecordData', JSON.stringify(data.recordData));
            alert("💾 OMNI MVP 자산 데이터 백업 파일이 완전히 복원되었습니다."); location.reload(); 
        } catch(err) { alert("❌ 유효하지 않은 백업 암호화 포맷 파일입니다."); }
    }; 
    reader.readAsText(file);
}

window.resetAllData = function() {
    if(confirm("⚠️ 경고: 저장된 모든 프리셋, 시뮬레이션, 재고 및 정산 기록이 영구적으로 삭제됩니다.\n정말 모든 데이터를 초기화하시겠습니까?")) {
        localStorage.removeItem('mapleCustomPresets');
        localStorage.removeItem('mapleSimData');
        localStorage.removeItem('mapleInventoryData');
        localStorage.removeItem('mapleRecordData');
        localStorage.removeItem('mapleMonthlyCharges');
        localStorage.removeItem('mapleChargeAmount');
        localStorage.removeItem('mapleExistingMeso');
        localStorage.removeItem('mapleMarketPrice');
        alert("🔄 대시보드 데이터가 새롭게 초기화되었습니다.");
        location.reload();
    }
}

// 🔄 [자동 브ूट스트랩] 문서의 DOM 트리가 준비되면 자동으로 대시보드를 인젝션 처리합니다.
window.addEventListener('DOMContentLoaded', () => {
    window.initMvpCalc();
});