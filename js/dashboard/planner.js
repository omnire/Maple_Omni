/**
 * ============================================================================
 * 📑 MAPLE OMNI V15 - dashboard/planner.js
 * 설명: 실시간 메모장 및 메이플 육성 계획서(Strategy Planner) 처리 모듈입니다.
 * 초보자 가이드: 로컬 스토리지 기반 메모 및 계획 데이터 생성/삭제/필터를 관리합니다.
 * ============================================================================
 */

/**
 * 📝 메모 추가 핸들러
 */
window.addDashboardInlineMemo = function() {
    const input = document.getElementById('dashboardMemoInput'); 
    if (!input || !input.value.trim()) return;
    
    const savedMemosRaw = localStorage.getItem("omni_v14_dashboard_memos"); 
    let memoList = savedMemosRaw ? JSON.parse(savedMemosRaw) : [];
    
    const now = new Date(); 
    const currentMonthDay = String(now.getMonth() + 1).padStart(2, '0') + "." + String(now.getDate()).padStart(2, '0');
    
    memoList.unshift({ text: input.value.trim(), date: currentMonthDay }); 
    localStorage.setItem("omni_v14_dashboard_memos", JSON.stringify(memoList)); 
    
    input.value = "";
    window.renderDashboardMainWidgets();
};

/**
 * 🗑️ 메모 삭제 핸들러
 */
window.deleteDashboardInlineMemo = function(index) {
    if (!confirm("⚠️ 작성해 둔 실시간 인라인 메모를 정말 삭제하시겠습니까?")) return; 
    const savedMemosRaw = localStorage.getItem("omni_v14_dashboard_memos"); 
    if (!savedMemosRaw) return;
    
    let memoList = JSON.parse(savedMemosRaw); 
    memoList.splice(index, 1); 
    localStorage.setItem("omni_v14_dashboard_memos", JSON.stringify(memoList)); 
    window.renderDashboardMainWidgets();
};

/**
 * 📅 육성 계획서 등록 핸들러
 */
window.addStrategyPlan = function() {
    const filterSelect = document.getElementById('plannerCharFilter'); 
    const goalInput = document.getElementById('plannerGoalInput'); 
    const routeInput = document.getElementById('plannerRouteInput');
    
    if (!goalInput || !routeInput || !goalInput.value.trim() || !routeInput.value.trim()) { 
        alert("운영 목표와 세부 수행 루트를 모두 작성해야 정밀한 계획 수립이 시작됩니다."); 
        return; 
    }
    
    let targetChar = (!filterSelect || filterSelect.value === "전체") ? "전체 계정 공통" : filterSelect.value;
    const savedPlansRaw = localStorage.getItem("omni_v14_strategy_plans"); 
    let planList = savedPlansRaw ? JSON.parse(savedPlansRaw) : [];
    
    planList.unshift({ 
        char: targetChar, 
        goal: goalInput.value.trim(), 
        route: routeInput.value.trim() 
    }); 
    
    localStorage.setItem("omni_v14_strategy_plans", JSON.stringify(planList)); 
    
    goalInput.value = "";
    routeInput.value = "";
    window.renderDashboardMainWidgets(); 
};

/**
 * 🗑️ 육성 계획서 삭제 핸들러
 */
window.deleteStrategyPlan = function(index) {
    if (!confirm("🚨 정말로 이 메이플 육성 계획을 삭제하시겠습니까?")) return; 
    const savedPlansRaw = localStorage.getItem("omni_v14_strategy_plans"); 
    if (!savedPlansRaw) return;
    
    let planList = JSON.parse(savedPlansRaw); 
    planList.splice(index, 1); 
    localStorage.setItem("omni_v14_strategy_plans", JSON.stringify(planList)); 
    window.renderDashboardMainWidgets();
};

/**
 * 🔍 육성 계획서 캐릭터 드롭다운 필터 변경
 */
window.changePlannerFilter = function(filterValue) { 
    window.omniPlannerFilter = filterValue; 
    window.renderDashboardMainWidgets(); 
};