/**
 * ============================================================================
 * ⚔️ MAPLE OMNI - 공통 모듈 (타이머, 팝업, 기본 변수 설정 및 초기화)
 * 파일명: features/hunt/hunt-common.js
 * 설명: 모든 사냥 페이지에서 공통적으로 쓰이는 타이머와 기본 뼈대를 담당합니다.
 * ============================================================================
 */

(function hydrateData() {
    console.log("🚀 [성능] 데이터 자동 주입 모드: OFF (독립 실행)");
    return; 
})();

if (!sessionStorage.getItem('omni_session_active')) {
    sessionStorage.setItem('omni_session_active', 'true');
    localStorage.removeItem('search_character_name'); 
}

if (typeof window.timerId === 'undefined') window.timerId = null; 
if (typeof window.timeLeft === 'undefined') window.timeLeft = 1800; // 30분(1800초)
if (typeof window.isPaused === 'undefined') window.isPaused = false; 
if (typeof window.endTime === 'undefined') window.endTime = null; 

if (typeof window.buffTimerId === 'undefined') window.buffTimerId = null;
if (typeof window.buffTimeLeft === 'undefined') window.buffTimeLeft = 0;

if (typeof window.currentOcrMode === 'undefined') window.currentOcrMode = 'hunt';
if (typeof window.currentIdx === 'undefined') window.currentIdx = 1;
if (typeof window.currentHistChar === 'undefined') window.currentHistChar = 1;

if (typeof window.subHistory === 'undefined') window.subHistory = JSON.parse(localStorage.getItem('omni_sub_history')) || {1:[], 2:[], 3:[], 4:[]};
if (typeof window.huntRecords === 'undefined') {
    window.huntRecords = JSON.parse(localStorage.getItem('maple_hunt_records')) || [];
}
if (typeof window.currentEditingId === 'undefined') window.currentEditingId = null;
if (typeof window.currentSearchData === 'undefined') window.currentSearchData = null;

function _getSafeTodayStr() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
window.getTodayStr = function() { return _getSafeTodayStr(); };

window.init = function() {
    if (typeof window.renderTopToolbar === 'function') {
        window.renderTopToolbar();
    } else if (typeof window.reRenderTabs === 'function') {
        window.reRenderTabs();
    }

    const container = document.getElementById('charContents');
    if(!container) return;
    container.innerHTML = ""; 

    for(let i=1; i<=4; i++) {
        const savedConfig = JSON.parse(localStorage.getItem(`maple_config_${i}`) || '{}');
        if (typeof window.renderHuntTabContent === 'function') {
            container.innerHTML += window.renderHuntTabContent(i, savedConfig);
        }
    }

    const sidebarInput = document.getElementById('sidebarSearchInput');
    if (sidebarInput && window.autoSearchDisabled) {
        sidebarInput.value = '';
    }

    if (typeof window.resetSidebarUI === 'function') {
        const img = document.getElementById('profileImg');
        if(img) {
            img.style.transition = 'none';
            img.style.visibility = 'hidden';
        }
        window.resetSidebarUI("닉네임 입력 후 엔터");
    }
    
    console.log("🚀 [성능] 사냥 페이지 로드 - 검색 데이터와 독립적으로 실행합니다.");
    
    if(typeof window.updateAll === 'function') {
        for(let i=1; i<=4; i++) window.updateAll(i); 
    }
    
    for(let i=1; i<=4; i++) { if(typeof window.addSellRow === 'function') window.addSellRow(i); } 

    if (typeof window.renderSubRecords === 'function') {
        window.renderSubRecords(1); 
    }
};

(function checkDailyReset() {
    const today = new Date().toISOString().split('T')[0]; 
    const lastVisit = localStorage.getItem('omni_last_visit_date');
    if (lastVisit !== today) {
        localStorage.removeItem('search_character_data'); 
        localStorage.removeItem('search_character_name'); 
        localStorage.setItem('omni_last_visit_date', today);
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.renderFullLayout === 'function') window.renderFullLayout();
    if (typeof window.updatePortalWidgets === 'function') window.updatePortalWidgets();
});

window.addEventListener('load', () => {
    try {
        window.currentSearchData = null; // 잔상 방지
        init(); // 초기화 실행
        
        var lastPage = sessionStorage.getItem('omni_current_page') || 'mainPortal';
        if (lastPage === 'hunt') lastPage = 'appContent';
        
        if (typeof window.omniSwitchPage === 'function') {
            window.omniSwitchPage(lastPage, false);
        }
        
        if (typeof window.updateMainDashboard === 'function' && window.currentSearchData) {
            window.updateMainDashboard();
        }

        if (typeof window.renderPortalEvents === 'function') window.renderPortalEvents();

        setTimeout(() => {
            for (var i = 1; i <= 4; i++) {
                if (typeof window.renderSubRecords === 'function') window.renderSubRecords(i);
            }
            if (typeof window.renderTopToolbar === 'function') window.renderTopToolbar();
            if (typeof window.renderAttendance === 'function') window.renderAttendance();
            if (typeof window.refreshWeekly === 'function') window.refreshWeekly();
            if (typeof window.renderSidebarHistory === 'function') window.renderSidebarHistory();
        }, 150); 

    } catch (error) {
        console.error("옴니 실행 중 치명적 에러 발생:", error);
        document.body.innerHTML = `
            <div style="padding: 20px; color: red;">
                <h3>⚠️ 옴니가 잠시 멈췄습니다!</h3>
                <p>에러 내용: ${error.message}</p>
                <button onclick="localStorage.clear(); location.reload();">초기화 후 재시작</button>
            </div>
        `;
    }
});

window.omniModal = function({ type = 'alert', title = '알림', desc = '', icon = '📢', date = '', onConfirm = null }) {
    const modal = document.getElementById('omniModal');
    if (!modal) return; 

    const titleEl = document.getElementById('modalTitle');
    const descEl = document.getElementById('modalDesc');
    const iconEl = document.getElementById('modalIcon');
    const dateInput = document.getElementById('modalDateInput');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');

    if (titleEl) titleEl.innerText = title;
    if (descEl) descEl.innerText = desc;
    if (iconEl) iconEl.innerText = icon;
    
    if (dateInput) {
        dateInput.style.display = (type === 'date') ? 'block' : 'none';
        if (date) dateInput.value = date;
    }
    
    if (cancelBtn) cancelBtn.style.display = (type === 'confirm' || type === 'date') ? 'block' : 'none';
    
    if (confirmBtn) confirmBtn.style.background = (type === 'confirm' && icon === '🗑️') ? '#e11d48' : '#7c3aed';

    if (confirmBtn) {
        confirmBtn.onclick = () => {
            if (onConfirm) onConfirm(dateInput ? dateInput.value : ''); 
            window.closeOmniModal(); 
        };
    }
    modal.style.display = 'flex'; 
};

window.closeOmniModal = function() { 
    const modal = document.getElementById('omniModal');
    if(modal) modal.style.display = 'none'; 
};

window.startTimer = function() { 
    if (!window.timerId) { 
        window.endTime = Date.now() + (window.timeLeft * 1000); 
        window.timerId = setInterval(() => { 
            window.timeLeft = Math.round((window.endTime - Date.now()) / 1000); 
            if (window.timeLeft <= 0) { 
                window.timeLeft = 0; 
                window.stopTimer(); 
                window.updateTD(); 
                window.omniModal({ title: '타이머 종료', desc: '30분 소재가 종료되었습니다!', icon: '⏰' });
                window.timeLeft = 1800; 
            } 
            window.updateTD(); 
        }, 1000); 
        window.isPaused = false; 
        window.updateTimerButtons(); 
    } 
};

window.stopOrResumeTimer = function() { 
    if (window.timerId) { 
        clearInterval(window.timerId); 
        window.timerId = null; 
        window.isPaused = true; 
    } else if (window.isPaused) { 
        window.startTimer(); 
    } 
    window.updateTimerButtons(); 
};

window.stopTimer = function() { 
    clearInterval(window.timerId); 
    window.timerId = null; 
    window.isPaused = false; 
    window.updateTimerButtons(); 
};

window.resetTimer = function() { 
    window.stopTimer(); 
    window.timeLeft = 1800; 
    window.isPaused = false; 
    window.updateTD(); 
    window.updateTimerButtons(); 
};

window.updateTD = function() { 
    const m = Math.floor(window.timeLeft/60);
    const s = window.timeLeft%60; 
    const td = document.getElementById('timerDisplay'); 
    if(td) td.innerText = `${m}:${s<10?'0':''}${s}`; 
};

window.updateTimerButtons = function() { 
    const stopBtn = document.getElementById('mainStopBtn'); 
    if (!stopBtn) return; 
    if (window.isPaused) { 
        stopBtn.innerText = "재개"; 
        stopBtn.classList.add('btn-resume'); 
    } else { 
        stopBtn.innerText = "정지"; 
        stopBtn.classList.remove('btn-resume'); 
    } 
};

window.onMeso = function(el) { 
    if (!el) return;
    let v = String(el.value).replace(/[^0-9]/g, ""); 
    el.value = v === "" ? "" : Number(v).toLocaleString(); 
};

window.exportData = function() {
    try {
        const data = {
            huntRecords: JSON.parse(localStorage.getItem('maple_hunt_records') || '[]'),
            attendance: JSON.parse(localStorage.getItem('mapleAttendance') || '[]'),
            configs: [1, 2, 3, 4].map(i => JSON.parse(localStorage.getItem(`maple_config_${i}`)))
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `MAPLE_OMNI_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        if(typeof window.showToast === 'function') window.showToast("백업 다운로드가 완료되었습니다.");
    } catch (e) { console.error("Backup failed:", e); }
};

window.updateHuntPageByDate = function() {
    const idx = parseInt(window.currentIdx || 1);
    const dateInput = document.getElementById('huntGlobalDate');
    const selectedDate = dateInput && dateInput.value ? dateInput.value : new Date().toISOString().split('T')[0];

    const storageKey = `${idx}_${selectedDate}`;

    if (!window.subHistory[storageKey]) {
        const saved = localStorage.getItem(`maple_subHistory_${storageKey}`);
        window.subHistory[storageKey] = saved ? JSON.parse(saved) : [];
    }

    if (typeof window.renderSubRecords === 'function') window.renderSubRecords(idx);
    if (typeof window.renderGrowthChart === 'function') window.renderGrowthChart();
    if (typeof window.renderGrowthAnalysis === 'function') window.renderGrowthAnalysis(idx);

    console.log(`[시스템] ${selectedDate} 바구니로 전환되었습니다.`);
};

window.renderFullLayout = function() {
    const huntContainer = document.getElementById('huntLayoutContainer');
    if (huntContainer) {
        huntContainer.innerHTML = `
            <div style="width: 100%; max-width: 2000px; margin-bottom: 10px; padding: 0 20px; box-sizing: border-box;" id="huntHeaderArea">
                <div style="background: #ffffff; border: 1px solid #eef2f6; border-radius: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); padding: 20px 15px 15px 15px; text-align: center;">
                    <div style="max-width: 700px; margin: 0 auto;">
                        <h1 onclick="backToPortal()" style="cursor: pointer; user-select: none; font-size: 24px; font-weight: 900; color: #1e293b; letter-spacing: -1px; margin: 0 0 15px 0; line-height: 1.2;">
                            HUNTING <span style="color: #0284c7;">DASHBOARD</span> <span style="font-size: 10px; color: #cbd5e1; font-weight: 700; margin-left: 8px;">V1.2</span>
                        </h1>
                        <nav style="display: flex; gap: 6px; background: #f8fafc; padding: 5px; border-radius: 14px; border: 1px solid #e2e8f0; max-width: 380px; margin: 0 auto;">
                            <button type="button" class="nav-btn active" id="nav_1" onclick="showPage(1)" style="flex: 1; padding: 10px; border-radius: 10px; border: none; font-weight: 800; font-size: 13px; cursor: pointer; transition: all 0.2s; background: #ffffff; color: #475569; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">🏹 실시간 기록</button>
                            <button type="button" class="nav-btn" id="nav_2" onclick="showPage(2)" style="flex: 1; padding: 10px; border-radius: 10px; border: none; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.2s; background: transparent; color: #94a3b8;">📊 통합 기록지</button>
                            <button type="button" class="nav-btn" id="nav_4" onclick="showPage(4); if(typeof renderGrowthAnalysis === 'function') renderGrowthAnalysis();" style="flex: 1; padding: 10px; border-radius: 10px; border: none; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.2s; background: transparent; color: #94a3b8;">📈 성장 분석</button>
                        </nav>
                    </div>
                </div>
            </div>
            <div id="omniTopToolbarContainer" style="width: 100%; max-width: 2000px; padding: 0 20px; box-sizing: border-box; margin-bottom: 12px;"></div>
            <div style="display: flex; flex-direction: row; justify-content: center; gap: 20px; width: 100%; max-width: 2200px; padding: 0 20px; box-sizing: border-box; align-items: flex-start;">
                <aside class="sidebar" style="background: #ffffff; border: 1px solid #eef2f6; padding: 15px 12px; width: 220px; flex-shrink: 0; border-radius: 20px; margin: 0 !important; top: 0; display: flex; flex-direction: column; align-items: center; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
                    <div class="char-card" style="padding: 5px; text-align: center; border: none; box-shadow: none !important; width: 100%;">
                        <div class="char-img-box" style="width: 100px; height: 100px; margin: 0 auto 12px auto; background: #f8fafc; border-radius: 50%; border: 1px solid #f1f5f9; position: relative; overflow: hidden;">
                            <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" id="profileImg" class="char-img-optimized" style="opacity: 0; transition: opacity 0.15s ease-in-out; width: 100%; height: 100%; object-fit: contain;">
                        </div>
                        <div class="char-info" style="width: 100%; display: flex; flex-direction: column; align-items: center;">
                            <input type="text" id="sidebarSearchInput" placeholder="닉네임 입력 후 엔터" 
                                   onkeypress="if(event.key === 'Enter') fetchMapleData();" 
                                   style="width: 100%; box-sizing: border-box; padding: 10px; margin-bottom: 8px; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 15px; font-weight: 900; text-align: center; outline: none; background: #f8fafc; color: #1e293b; transition: all 0.2s;"
                                   onfocus="this.style.borderColor='#3b82f6'; this.style.background='#ffffff';"
                                   onblur="this.style.borderColor='#e2e8f0'; this.style.background='#f8fafc';">
                            <div style="font-size: 11px; margin-bottom: 8px; color: #94a3b8; font-weight: 700;">
                                <span id="profileWorld">월드 미확인</span> <span style="margin: 0 4px; opacity: 0.3;">|</span> <span id="profileGuild">길드 없음</span>
                            </div>
                            <div style="margin-bottom: 12px; font-size: 12px; color: #475569; font-weight: 800;">
                                <span id="profileLevel">Lv. ---</span> <span id="profileJob" style="color: #cbd5e1; margin-left: 4px;">---</span>
                            </div>
                            <div id="statBox" style="padding: 12px 10px; background: #fcfdfe; border-radius: 12px; font-size: 11px; text-align: left; border: 1px solid #f1f5f9; width: 100%; box-sizing: border-box;">
                                <div style="display:flex; justify-content:space-between; margin-bottom:6px; align-items: center;">
                                    <span style="color:#94a3b8; font-weight: 800;">전투력</span>
                                    <b id="stat_power" style="color: #87a1f7 !important; font-weight: 900; font-size: 13px;">0</b>
                                </div>
                                <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                                    <span style="color:#94a3b8; font-weight: 700;">스탯공격력</span>
                                    <b id="stat_atk" style="color:#64748b; font-weight: 700;">-</b>
                                </div>
                                <div style="display:flex; justify-content:space-between;">
                                    <span style="color:#94a3b8; font-weight: 700;">데미지</span>
                                    <b id="stat_dmg" style="color:#64748b; font-weight: 700;">-</b>
                                </div>
                            </div>
                            <button type="button" class="api-refresh-btn" style="width:100%; margin-top:12px; padding:12px; background:#3b82f6; color:white; border-radius:10px; border:none; cursor:pointer; font-weight:900; font-size: 13px; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.2); transition: all 0.2s;" onclick="if(typeof fetchMapleData === 'function') fetchMapleData()">🔍 검색 및 동기화</button>
                        </div>
                    </div>
                </aside>
                <div class="container" style="flex: 1; min-width: 0; max-width: 2000px; margin: 0 !important;">
                    <div id="page_1" style="display: flex; flex-direction: column; gap: 20px;">
                        <div class="hunt-date-controller" style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; padding: 15px 20px; border-radius: 20px; border: 1px solid #eef2f6; box-shadow: 0 4px 10px rgba(0,0,0,0.02);">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 20px;">📅</span>
                                <div>
                                    <div style="font-size: 11px; color: #94a3b8; font-weight: 800; margin-bottom: 2px;">RECORD DATE</div>
                                    <input type="date" id="huntGlobalDate" value="${new Date().toISOString().split('T')[0]}"
                                           onchange="updateHuntPageByDate(); const idx = window.currentIdx || 1; renderSubRecords(idx); if(typeof updateAll === 'function') updateAll(idx);" 
                                           style="border: none; outline: none; font-size: 16px; font-weight: 900; color: #1e293b; cursor: pointer; background: transparent;">
                                </div>
                            </div>
                            <div style="font-size: 11px; color: #64748b; font-weight: 700; text-align: right;">날짜를 변경하면 해당 날짜의 기록이 로드됩니다.</div>
                        </div>
                        <div class="diary-card" style="padding: 25px; border: 1px solid #eef2f6; box-shadow: 0 4px 12px rgba(0,0,0,0.03); min-height: 500px; background: #ffffff; border-radius: 24px;">
                            <div id="charContents"></div>
                        </div>
                    </div>
                    <div id="page_2" style="display:none; padding-top: 15px;">
                        <div class="diary-card" style="padding: 30px; background: #ffffff; border-radius: 28px; border: 1px solid #f1f5f9; box-shadow: 0 10px 40px rgba(0,0,0,0.03);">
                            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 25px; border-bottom: 2px dashed #f1f5f9; padding-bottom: 25px;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div style="background: #f8fafc; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; border-radius: 14px; font-size: 22px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">📊</div>
                                    <div>
                                        <h3 style="color: #334155; font-size: 20px; font-weight: 900; margin: 0; letter-spacing: -0.5px;">사냥 통합 기록지</h3>
                                        <div style="color: #94a3b8; font-size: 13px; font-weight: 700; margin-top: 2px;">나의 사냥 데이터를 한눈에 확인하세요!</div>
                                    </div>
                                </div>
                                <div id="historyTabContainer" style="display: flex; gap: 8px; background: #f8fafc; padding: 6px; border-radius: 16px;"></div>
                            </div>
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="background: #fff; border-radius: 12px; padding: 8px 15px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.01);">
                                        <span style="font-size: 14px;">📅</span>
                                        <input type="month" id="monthFilter" onchange="window.selectedDate = this.value; if(typeof renderHistory === 'function') renderHistory();" style="border: none; background: transparent; color: #475569; font-weight: 800; outline: none; cursor: pointer;">
                                    </div>
                                    <button type="button" onclick="window.selectedDate='all'; document.getElementById('monthFilter').value=''; if(typeof renderHistory === 'function') renderHistory();" style="background: #ffffff; border: 1px solid #e2e8f0; padding: 10px 18px; border-radius: 12px; color: #64748b; font-weight: 800; cursor: pointer; font-size: 13px;">전체보기</button>
                                </div>
                            </div>
                            <div id="recordTableBody"></div>
                        </div>
                    </div>
                    <div id="page_4" style="display: none; padding-top: 0; width: 100%;">
                        <div id="growthAnalysisRoot" style="min-height: 400px; width: 100%;"></div>
                    </div>
                </div>
                <aside class="right-sidebar" style="width: 240px; flex-shrink: 0; display: flex; flex-direction: column; gap: 20px;">
                    <div id="attendanceContainer"></div>
                    <div id="weeklySummaryContainer"></div>
                </aside>
            </div>
        `;
    }

    const auxContainer = document.getElementById('auxiliarySectionsContainer');
    if (auxContainer) {
        auxContainer.innerHTML = `
            <div id="omniScannerSection" style="display: none; width: 100%; max-width: 1400px; margin: 40px auto; padding: 0 20px; box-sizing: border-box;">
                <button onclick="backToPortal()" style="margin-bottom: 20px; padding: 10px 20px; border-radius: 10px; border: 1px solid #cbd5e1; background: white; cursor: pointer; font-weight: 800; color: #64748b;">⬅️ 메인 포탈로 돌아가기</button>
                <div class="diary-card" style="padding:40px; text-align:center; background: white; border-radius: 20px; color: #94a3b8; font-weight: 800; border: 1px dashed #cbd5e1;">OMNI 스캐너 UI 영역</div>
            </div>
            <div id="omniBuilderSection" style="display: none; width: 100%; max-width: 1200px; margin: 40px auto; padding: 0 20px; box-sizing: border-box;">
                <button onclick="backToPortal()" style="margin-bottom: 20px; padding: 10px 20px; border-radius: 10px; border: 1px solid #cbd5e1; background: white; cursor: pointer; font-weight: 800; color: #64748b;">⬅️ 메인 포탈로 돌아가기</button>
                <div class="diary-card" style="padding:40px; text-align:center; background: white; border-radius: 20px; color: #94a3b8; font-weight: 800; border: 1px dashed #cbd5e1;">🛠️ OMNI 빌더 UI 영역</div>
            </div>
            <div id="bossPageContent" style="display: none; width: 100%; max-width: 1200px; margin: 40px auto; padding: 0 20px; box-sizing: border-box;"></div>
            <div id="searchPageContent" style="display: none; width: 100%; max-width: 1200px; margin: 40px auto; padding: 0 20px; box-sizing: border-box;">
                <button onclick="backToPortal()" style="margin-bottom: 20px; padding: 10px 20px; border-radius: 10px; border: 1px solid #cbd5e1; background: white; cursor: pointer; font-weight: 800; color: #64748b;">⬅️ 메인 포탈로 돌아가기</button>
                <div id="charDetailContainer" style="display: none; width: 100%;"></div>
            </div>
            <div id="mvpCalcSection" style="display: none; width: 100%; max-width: 1000px; margin: 40px auto; padding: 0 20px; box-sizing: border-box;">
                <button onclick="backToPortal()" style="margin-bottom: 20px; padding: 10px 20px; border-radius: 10px; border: 1px solid #cbd5e1; background: white; cursor: pointer; font-weight: 800; color: #64748b;">⬅️ 메인 포탈로 돌아가기</button>
                <div id="mvpCalcRoot"></div>
            </div>
        `;
    }
};

window.updateSidebarUI = function(data) {
    if (!data) return;
    
    const img = document.getElementById('profileImg');
    if (img && data.basic && data.basic.character_image) {
        img.src = data.basic.character_image;
        img.style.opacity = '1';
    }

    const worldEl = document.getElementById('profileWorld');
    const guildEl = document.getElementById('profileGuild');
    const levelEl = document.getElementById('profileLevel');
    const jobEl = document.getElementById('profileJob');

    if (worldEl) worldEl.innerText = data.basic.world_name || "월드 미확인";
    if (guildEl) guildEl.innerText = data.basic.character_guild_name || "길드 없음";
    if (levelEl) levelEl.innerText = `Lv.${data.basic.character_level || '---'}`;
    if (jobEl) jobEl.innerText = data.basic.character_class || "---";

    const power = data.stat?.final_stat?.find(s => s.stat_name === "전투력")?.stat_value || "0";
    const attack = data.stat?.final_stat?.find(s => s.stat_name === "스탯공격력")?.stat_value || "0";
    const damage = data.stat?.final_stat?.find(s => s.stat_name === "데미지")?.stat_value || "0";

    if (document.getElementById('stat_power')) document.getElementById('stat_power').innerText = Number(power).toLocaleString();
    if (document.getElementById('stat_atk')) document.getElementById('stat_atk').innerText = Number(attack).toLocaleString();
    if (document.getElementById('stat_dmg')) document.getElementById('stat_dmg').innerText = `${damage}%`;
};