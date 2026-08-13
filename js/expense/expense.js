/**
 * ============================================================================
 * 💰 MAPLE OMNI V14 - js/expense/expense.js [독립형 지출 총괄 기어]
 * 설명: 인게임 메소를 소모하는 주요 지출 지표를 영구 추적 보관하는 엔진입니다.
 * 규칙: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 달아줍니다.
 * ============================================================================
 */

/**
 * 💡 [초보자 가이드] 새로운 메소 소출 정보를 입력 폼에서 추출하여 브라우저에 저장하는 영구 동기화 함수입니다.
 */
window.saveV14ExpenseRecord = function() {
    const type = document.getElementById('v14_exp_type')?.value;
    const amountRaw = document.getElementById('v14_exp_amount')?.value || '';
    const memo = document.getElementById('v14_exp_memo')?.value || '미기입 사유';

    // 콤마가 제거된 순수한 숫자 형태의 소모 금액으로 정규화 필터 처리합니다.
    const amount = parseInt(amountRaw.replace(/,/g, "")) || 0;
    if (amount <= 0) {
        alert("정확한 지출 메소 금액 수치를 기입해 주세요!");
        return;
    }

    // 장부에 저장할 단일 기록 데이터 오브젝트 노드를 생성합니다.
    const newExpenseNode = {
        id: Date.now(), // 고유 정렬 번호 키값으로 활용할 타임스탬프
        date: new Date().toISOString().split('T')[0], // 현재 연도-월-일 자동 기입
        type: type,
        amount: amount,
        memo: memo
    };

    // 로컬 스토리지에 기존 누적된 지출 배열을 로드하여 최상단에 언시프트 주입합니다.
    let currentLedgerList = JSON.parse(localStorage.getItem('omni_expense_records') || '[]');
    currentLedgerList.unshift(newExpenseNode);
    localStorage.setItem('omni_expense_records', JSON.stringify(currentLedgerList));

    // 기입이 성공적으로 처리되면 다음 입력을 위해 기입 필드를 초기화 클리어해줍니다.
    document.getElementById('v14_exp_amount').value = '';
    document.getElementById('v14_exp_memo').value = '';

    // 바뀐 원장 기준에 따라 지출 보드 뷰포트를 실시간 재리프레시합니다.
    window.renderExpensePage();
};

/**
 * 💡 [초보자 가이드] 고유 타임스탬프 ID값을 추적하여 특정 지출 데이터를 영구 영수증 파쇄처리하는 필터 함수입니다.
 */
window.deleteV14ExpenseRecord = function(recordId) {
    if (!confirm("해당 지출 내역을 장부에서 영구 파쇄 소멸시키겠습니까?")) return;
    
    let currentLedgerList = JSON.parse(localStorage.getItem('omni_expense_records') || '[]');
    // 선택한 아이디만 쏙 배제시키는 거름망 필터 가동
    currentLedgerList = currentLedgerList.filter(item => item.id !== recordId);
    localStorage.setItem('omni_expense_records', JSON.stringify(currentLedgerList));
    
    window.renderExpensePage();
};

/**
 * 💡 [초보자 가이드] 주입된 모든 지출 로그의 밸런싱을 실시간으로 역산하여 화면 가득 템플릿을 드로잉해주는 핵심 렌더러입니다.
 */
window.renderExpensePage = function() {
    const container = document.getElementById('expenseContent');
    if (!container) return;

    // 저장된 모든 소비 아이템 리스트를 파싱 로드합니다.
    const list = JSON.parse(localStorage.getItem('omni_expense_records') || '[]');
    let totalExpenseMeso = 0;
    let tableRowsHtml = "";

    // 명세 리스트를 루프 돌며 총 지출액 가산 및 테이블 전용 TR 마크업 생성
    list.forEach(item => {
        totalExpenseMeso += item.amount;
        tableRowsHtml += `
            <tr>
                <td><b style="color:#797399;">${item.date}</b></td>
                <td><span style="background:#f2efff; color:#7a6ec7; padding:4px 10px; border-radius:6px; font-size:12px; font-weight:900;">${item.type}</span></td>
                <td style="color:#e11d48; font-weight:900; font-size:15px;">- ${item.amount.toLocaleString()} Meso</td>
                <td style="text-align:left; padding-left:15px; color:#312e4b;">${item.memo}</td>
                <td>
                    <button type="button" style="background:none; border:none; color:#bcaedb; font-size:18px; font-weight:bold; cursor:pointer; transition:color 0.15s;" 
                            onclick="window.deleteV14ExpenseRecord(${item.id})" onhover="this.style.color='#e11d48'">&times;</button>
                </td>
            </tr>
        `;
    });

    // 만약 장부가 텅 비어 아무 데이터도 잡히지 않을 때 예외 메세지 노출 방어선
    if (list.length === 0) {
        tableRowsHtml = `<tr><td colspan="5" style="color:#b2acc7; padding:40px 0; font-weight:700;">기입된 지출 정산 명세 데이터가 존재하지 않습니다.</td></tr>`;
    }

    // 🤍 라벤더 크리스프 화이트 배색의 큼직한 확장 레이아웃 구조 주입
    container.innerHTML = `
        <div class="v14-expense-wrapper">
            
            <!-- 상단 헤더 섹션: 합산 지출 총액 인디케이터 계판 -->
            <div style="font-size: 18px; font-weight: 800; color: #312e4b; margin-bottom: 20px; background: white; padding: 20px; border-radius: 16px; border: 1px solid #ebdffc; box-shadow: 0 4px 12px rgba(122,110,199,0.03); display:flex; align-items:center; gap:10px;">
                💸 현재까지 누적 합산 총 지출액: 
                <span style="color:#e11d48; font-size:24px; font-weight:900; letter-spacing:-0.5px;">
                    ${totalExpenseMeso.toLocaleString()}
                </span> 메소 (Meso)
            </div>
            
            <div class="v14-expense-layout">
                
                <!-- 1열 서브 파츠: 정보 입력 창 폼 보드 -->
                <div class="v14-expense-form-card">
                    <div class="v14-plate-header" style="font-size:14px; margin-bottom:18px;">✍️ NEW EXPENSE REPORT (신규 영수증 기입)</div>
                    <div style="display:flex; flex-direction:column; gap:14px;">
                        
                        <div style="display:flex; flex-direction:column; gap:6px;">
                            <label style="font-size:13px; font-weight:800; color:#5a4eb3;">🛒 소비 항목 카테고리</label>
                            <select id="v14_exp_type" class="v14-input-base">
                                <option value="스타포스 강화">⭐ 스타포스 강화 장비 강화 비용</option>
                                <option value="큐브 조정">🔮 잠재옵션 설정/미라클 큐브</option>
                                <option value="경매장 소비">🛍️ 경매장 소모품 및 완제품 장비 구입</option>
                                <option value="코디/기타">🎁 로얄 스타일 패키지 및 믹스 염색</option>
                            </select>
                        </div>
                        
                        <div style="display:flex; flex-direction:column; gap:6px;">
                            <label style="font-size:13px; font-weight:800; color:#5a4eb3;">🪙 지출 소모 메소 수량</label>
                            <input type="text" id="v14_exp_amount" class="v14-input-base" placeholder="ex) 500,000,000" onkeyup="if(typeof window.applyRealtimeComma === 'function') window.applyRealtimeComma(this);">
                        </div>
                        
                        <div style="display:flex; flex-direction:column; gap:6px;">
                            <label style="font-size:13px; font-weight:800; color:#5a4eb3;">📝 세부 지출 소회 사유 (비고)</label>
                            <input type="text" id="v14_exp_memo" class="v14-input-base" placeholder="ex) 카루타 하의 18성 스트레이트">
                        </div>
                        
                        <button type="button" class="v14-btn v14-btn-save" style="width:100%; margin-top:10px; padding:14px; font-size:14px;" 
                                onclick="window.saveV14ExpenseRecord()">
                            💰 메인 회계 정산 장부에 기록 보관
                        </button>
                    </div>
                </div>
                
                <!-- 2열 서브 파츠: 누적 지출 실시간 명세 테이블 리스트 -->
                <div class="v14-expense-list-card">
                    <div class="v14-plate-header" style="font-size:14px; margin-bottom:18px;">📜 EXPENSE TRANSACTION LOG (소비 내역 종합 원장)</div>
                    <div style="max-height: 450px; overflow-y: auto; padding-right:4px;">
                        <table class="v14-expense-table">
                            <thead>
                                <tr>
                                    <th style="width:18%;">지출 일자</th>
                                    <th style="width:22%;">항목 분류</th>
                                    <th style="width:28%;">소모 금액</th>
                                    <th style="width:25%;">비고 레포트</th>
                                    <th style="width:7%;">파쇄</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRowsHtml}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    `;
};