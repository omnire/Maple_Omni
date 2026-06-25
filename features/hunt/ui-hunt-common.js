/**
 * ============================================================================
 * ⚔️ MAPLE OMNI - 시스템 통합 제어 모듈 (전체 기능 완성 패키지)
 * 파일명: features/hunt/maple-omni-hunts.js
 * 설명: 타이머, 독립 탭 캐싱, 실시간 데이터 제어, 통합 달력, 주간 통계 리포트 포함
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. [초보자용 주석] 전역 통제 상태 변수 설정 및 브라우저 세션 초기화 모듈
// ----------------------------------------------------------------------------
(function hydrateData() {
    console.log("🚀 [성능] 데이터 자동 주입 모드: OFF (독립 실행)");
    return; 
})();

// 처음 접속 시 기존 세션 확인 및 검색어 캐시 안전 정리 처리
if (!sessionStorage.getItem('omni_session_active')) {
    sessionStorage.setItem('omni_session_active', 'true');
    localStorage.removeItem('search_character_name'); 
}

// 사냥 타이머 작동용 내부 상태 변수 정의 (브라우저가 꺼져도 작동 상태를 유지할 준비)
if (typeof window.timerId === 'undefined') window.timerId = null; 
if (typeof window.timeLeft === 'undefined') window.timeLeft = 1800; // 30분 기본값(1800초)
if (typeof window.isPaused === 'undefined') window.isPaused = false; 
if (typeof window.endTime === 'undefined') window.endTime = null; 

// UI 연동용 공유 상태 변수 안전 선언
if (typeof window.currentIdx === 'undefined') window.currentIdx = 1; // 실시간 사냥터용 선택 탭 슬롯 (1~4)
if (typeof window.currentHistChar === 'undefined') window.currentHistChar = 1; // 통합기록지 달력용 선택 캐릭터 슬롯 (1~4)
if (typeof window.currentEditingId === 'undefined') window.currentEditingId = null; // 임시 수정중인 항목의 고유 ID 타겟

// 로컬 저장소(브라우저 메모리) 캐시 복원 처리 (데이터 파손 방지용 빈 오브젝트 주입)
if (typeof window.subHistory === 'undefined') {
    window.subHistory = JSON.parse(localStorage.getItem('omni_sub_history')) || {1:[], 2:[], 3:[], 4:[]};
}
if (typeof window.huntRecords === 'undefined') {
    window.huntRecords = JSON.parse(localStorage.getItem('maple_hunt_records')) || [];
}

// [초보자용 주석] 오늘 날짜 문자열(YYYY-MM-DD)을 시차 오류 없이 정확하게 파싱하는 공용 헬퍼 함수
function _getSafeTodayStr() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
window.getTodayStr = function() { return _getSafeTodayStr(); };

// ----------------------------------------------------------------------------
// 2. [초보자용 주석] 페이지 최초 기동 및 새로고침 레이스 차단용 초기화 실행기
// ----------------------------------------------------------------------------
window.init = function() {
    if (typeof window.renderTopToolbar === 'function') {
        window.renderTopToolbar();
    } else if (typeof window.reRenderTabs === 'function') {
        window.reRenderTabs();
    }

    // 현재 열려 있는 탭 번호를 세션 스토리지에 즉시 저장하여 새로고침 시 1번 탭으로 돌아가는 초기화 현상을 차단합니다.
    if (window.currentIdx) {
        sessionStorage.setItem('omni_current_tab_idx', window.currentIdx);
    }

    const container = document.getElementById('charContents');
    if(!container) return;
    container.innerHTML = ""; 

    // 각 탭별 사냥 설정 패널을 한 번에 그려줍니다.
    for(let i=1; i<=4; i++) {
        const savedConfig = JSON.parse(localStorage.getItem(`maple_config_${i}`) || '{}');
        if (typeof window.renderHuntTabContent === 'function') {
            container.innerHTML += window.renderHuntTabContent(i, savedConfig);
        }
    }

    // ★ 닉네임 누락 차단 보완 패치 ★
    // 활성화된 슬롯 번호에 알맞은 캐릭터 정보를 로컬 캐시에서 찾아 전역 변수에 연결합니다.
    const slotIdx = window.currentIdx || 1;
    const slotBasic = localStorage.getItem(`omni_searched_basic_${slotIdx}`);
    const slotStat = localStorage.getItem(`omni_searched_stat_${slotIdx}`);
    
    if (slotBasic) {
        window.currentSearchData = {
            basic: JSON.parse(slotBasic),
            stat: slotStat ? JSON.parse(slotStat) : null
        };
        window.updateSidebarUI(window.currentSearchData);
    } else {
        window.currentSearchData = null;
        if (typeof window.renderHuntCharacterCard === 'function') {
            window.renderHuntCharacterCard(null);
        }
    }
    
    // 전체 보드 데이터 동기화 리플래시 작동
    if(typeof window.updateAll === 'function') {
        for(let i=1; i<=4; i++) window.updateAll(i); 
    }
    
    // 빈 득템 행 추가 뼈대 확보
    for(let i=1; i<=4; i++) { if(typeof window.addSellRow === 'function') window.addSellRow(i); } 

    if (typeof window.renderSubRecords === 'function') {
        window.renderSubRecords(slotIdx); 
    }
};

// 매일 자정에 처음 방문 시 검색 캐시 일제 청소 기능
(function checkDailyReset() {
    const today = new Date().toISOString().split('T')[0]; 
    const lastVisit = localStorage.getItem('omni_last_visit_date');
    if (lastVisit !== today) {
        localStorage.removeItem('search_character_data'); 
        localStorage.removeItem('search_character_name'); 
        localStorage.setItem('omni_last_visit_date', today);
    }
})();

// DOM 생성 시 기본 레이아웃 생성
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.renderFullLayout === 'function') window.renderFullLayout();
});

// 브라우저 로드 완료 후 이전 저장된 캐시 정보 복원
window.addEventListener('load', () => {
    try {
        const savedSlotIdx = sessionStorage.getItem('omni_current_tab_idx');
        if (savedSlotIdx) {
            window.currentIdx = parseInt(savedSlotIdx);
        }
        
        const slotIdx = window.currentIdx || 1;
        let fallbackBasic = localStorage.getItem(`omni_searched_basic_${slotIdx}`);
        let fallbackStat = localStorage.getItem(`omni_searched_stat_${slotIdx}`);
        
        if (!fallbackBasic && slotIdx === 1) {
            fallbackBasic = localStorage.getItem('omni_last_searched_basic');
            fallbackStat = localStorage.getItem('omni_last_searched_stat');
            if (fallbackBasic) {
                localStorage.setItem(`omni_searched_basic_1`, fallbackBasic);
                if (fallbackStat) localStorage.setItem(`omni_searched_stat_1`, fallbackStat);
            }
        }

        if (fallbackBasic) {
            window.currentSearchData = {
                basic: JSON.parse(fallbackBasic),
                stat: fallbackStat ? JSON.parse(fallbackStat) : null
            };
        } else {
            window.currentSearchData = null;
        }

        init(); // 핵심 레이아웃 엔진 렌더링 초기화 실행
        
        var lastPage = sessionStorage.getItem('omni_current_page') || 'hunt';
        if (lastPage === 'mainPortal' || lastPage === 'hunt') {
            window.showPage(1);
        } else if (lastPage.includes('page_2')) {
            window.showPage(2);
        } else if (lastPage.includes('page_4')) {
            window.showPage(4);
        }
        
        if (window.currentSearchData) {
            window.updateSidebarUI(window.currentSearchData);
        }

        // 지연 로딩을 통한 화면 렌더링 안정성 확보
        setTimeout(() => {
            const currentSlot = window.currentIdx || 1;
            if (typeof window.renderSubRecords === 'function') window.renderSubRecords(currentSlot);
            if (typeof window.renderTopToolbar === 'function') window.renderTopToolbar();
            if (typeof window.renderAttendance === 'function') window.renderAttendance();
            if (typeof window.refreshWeekly === 'function') window.refreshWeekly();
            if (typeof window.renderHuntCharacterCard === 'function') window.renderHuntCharacterCard(null);
        }, 150); 

    } catch (error) {
        console.error("옴니 가동 중 에러 감지:", error);
    }
});

// ----------------------------------------------------------------------------
// 3. [초보자용 주석] 공용 팝업 모달창 및 실시간 30분 카운트다운 타이머 시스템
// ----------------------------------------------------------------------------
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
                window.omniModal({ title: '타이머 종료', desc: '30분 재획용 소재 타이머가 종료되었습니다!', icon: '⏰' });
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
    } else { 
        stopBtn.innerText = "정지"; 
    } 
};

// 숫자를 입력하면 자동으로 콤마(,)를 찍어주는 편의 함수
window.onMeso = function(el) { 
    if (!el) return;
    let v = String(el.value).replace(/[^0-9]/g, ""); 
    el.value = v === "" ? "" : Number(v).toLocaleString(); 
};

// JSON 기반 로컬 스토리지 데이터 안전 다운로드 백업기
window.exportData = function() {
    try {
        const data = {
            huntRecords: JSON.parse(localStorage.getItem('maple_hunt_records') || '[]'),
            attendance: JSON.parse(localStorage.getItem('mapleAttendance') || '[]'),
            configs: [1, 2, 3, 4].map(i => JSON.parse(localStorage.getItem(`maple_config_${i}`) || '{}'))
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `MAPLE_OMNI_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
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
    if (typeof window.renderGrowthAnalysis === 'function') window.renderGrowthAnalysis();
    if (typeof window.updateAll === 'function') window.updateAll(idx);
};

// ----------------------------------------------------------------------------
// 4. [초보자용 주석] 메인 프레임 대시보드 구조화 렌더링 스크립트 (HTML 인젝션)
// ----------------------------------------------------------------------------
window.renderFullLayout = function() {
    const huntContainer = document.getElementById('huntLayoutContainer');
    if (huntContainer) {
        huntContainer.innerHTML = `
            <div style="width: 100%; max-width: 2000px; margin-bottom: 10px; padding: 0 20px; box-sizing: border-box;" id="huntHeaderArea">
                <div style="background: #ffffff; border: 1px solid #eef2f6; border-radius: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); padding: 20px 15px 15px 15px; text-align: center;">
                    <div style="max-width: 700px; margin: 0 auto;">
                        <h1 style="cursor: pointer; user-select: none; font-size: 24px; font-weight: 900; color: #1e293b; letter-spacing: -1px; margin: 0 0 15px 0; line-height: 1.2;">
                            MAPLE <span style="color: #0284c7;">OMNI</span> DASHBOARD <span style="font-size: 10px; color: #cbd5e1; font-weight: 700; margin-left: 8px;">V1.5</span>
                        </h1>
                        <nav style="display: flex; gap: 6px; background: #f8fafc; padding: 5px; border-radius: 14px; border: 1px solid #e2e8f0; max-width: 380px; margin: 0 auto;">
                            <button type="button" class="nav-btn active" id="nav_1" onclick="window.showPage(1)" style="flex: 1; padding: 10px; border-radius: 10px; border: none; font-weight: 800; font-size: 13px; cursor: pointer; transition: all 0.2s; background: #ffffff; color: #475569; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">🏹 실시간 기록</button>
                            <button type="button" class="nav-btn" id="nav_2" onclick="window.showPage(2)" style="flex: 1; padding: 10px; border-radius: 10px; border: none; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.2s; background: transparent; color: #94a3b8;">📊 통합 기록지</button>
                            <button type="button" class="nav-btn" id="nav_4" onclick="window.showPage(4)" style="flex: 1; padding: 10px; border-radius: 10px; border: none; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.2s; background: transparent; color: #94a3b8;">📈 성장 분석</button>
                        </nav>
                    </div>
                </div>
            </div>
            <div id="omniTopToolbarContainer" style="width: 100%; max-width: 2000px; padding: 0 20px; box-sizing: border-box; margin-bottom: 12px;"></div>
            <div style="display: flex; flex-direction: row; justify-content: center; gap: 20px; width: 100%; max-width: 2200px; padding: 0 20px; box-sizing: border-box; align-items: flex-start;">

                <aside class="sidebar" style="background: #ffffff; border: 1px solid #eef2f6; padding: 15px 12px; width: 220px; flex-shrink: 0; border-radius: 20px; margin: 0 !important; display: flex; flex-direction: column; align-items: center; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
                    <div id="huntCharacterCard" style="width: 100%;"></div>
                </aside>

                <div class="container" style="flex: 1; min-width: 0; max-width: 2000px; margin: 0 !important;">
                    
                    <div id="page_1" style="display: flex; flex-direction: column; gap: 20px;">
                        <div class="hunt-date-controller" style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; padding: 15px 20px; border-radius: 20px; border: 1px solid #eef2f6; box-shadow: 0 4px 10px rgba(0,0,0,0.02);">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 20px;">📅</span>
                                <div>
                                    <div style="font-size: 11px; color: #94a3b8; font-weight: 800; margin-bottom: 2px;">RECORD DATE</div>
                                    <input type="date" id="huntGlobalDate" value="${new Date().toISOString().split('T')[0]}"
                                           onchange="window.updateHuntPageByDate();" 
                                           style="border: none; outline: none; font-size: 16px; font-weight: 900; color: #1e293b; cursor: pointer; background: transparent;">
                                </div>
                            </div>
                            <div style="font-size: 11px; color: #64748b; font-weight: 700; text-align: right;">선택한 날짜의 타임 바구니가 자동으로 로드됩니다.</div>
                        </div>
                        <div class="diary-card" style="padding: 25px; border: 1px solid #eef2f6; box-shadow: 0 4px 12px rgba(0,0,0,0.03); min-height: 500px; background: #ffffff; border-radius: 24px;">
                            <div id="charContents"></div>
                        </div>
                    </div>

                    <div id="page_2" style="display:none; padding-top: 15px;">
                        <div class="diary-card" style="padding: 30px; background: #ffffff; border-radius: 28px; border: 1px solid #f1f5f9; box-shadow: 0 10px 40px rgba(0,0,0,0.03);">
                            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 25px; border-bottom: 2px dashed #f1f5f9; padding-bottom: 25px;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div style="background: #f8fafc; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; border-radius: 14px; font-size: 22px;">📊</div>
                                    <div>
                                        <h3 style="color: #334155; font-size: 20px; font-weight: 900; margin: 0; letter-spacing: -0.5px;">사냥 통합 기록지</h3>
                                        <div style="color: #94a3b8; font-size: 13px; font-weight: 700; margin-top: 2px;">누적 확정된 데이터가 달력 형태로 표시됩니다.</div>
                                    </div>
                                </div>
                                <div id="historyTabContainer" style="display: flex; gap: 8px; background: #f8fafc; padding: 6px; border-radius: 16px;"></div>
                            </div>
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="background: #fff; border-radius: 12px; padding: 8px 15px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 8px;">
                                        <span style="font-size: 14px;">📅</span>
                                        <input type="month" id="monthFilter" onchange="if(typeof window.renderHistory === 'function') window.renderHistory();" style="border: none; background: transparent; color: #475569; font-weight: 800; outline: none; cursor: pointer;">
                                    </div>
                                    <button type="button" onclick="document.getElementById('monthFilter').value='${new Date().toISOString().slice(0,7)}'; if(typeof window.renderHistory === 'function') window.renderHistory();" style="background: #ffffff; border: 1px solid #e2e8f0; padding: 10px 18px; border-radius: 12px; color: #64748b; font-weight: 800; cursor: pointer; font-size: 13px;">이번달 보기</button>
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
                    <div id="attendanceContainer" style="background: #ffffff; border: 1px solid #eef2f6; border-radius: 20px; padding: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.02); width: 100%; box-sizing: border-box;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                            <span style="font-weight: 800; font-size: 12px; color: #64748b; display: flex; align-items: center; gap: 4px;">📅 사냥 출석부</span>
                            <b id="currentMonth" style="font-size: 12px; color: #1e293b; font-weight: 900;"></b>
                        </div>
                        <div id="attendanceGrid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; width: 100%;"></div>
                    </div>
                    
                    <div id="weeklySummaryContainer" style="width: 100%;"></div>
                </aside>
            </div>
        `;
    }
    
    // 최초 구동 시 무조건 툴바 활성화 연동 진행
    window.init();
};

// ----------------------------------------------------------------------------
// 5. [초보자용 주석] 상단 네비게이션 버튼을 눌러서 탭 전환 시 화면을 바꿔주는 기능
// ----------------------------------------------------------------------------
window.showPage = function(pageIdx) {
    const p1 = document.getElementById('page_1');
    const p2 = document.getElementById('page_2');
    const p4 = document.getElementById('page_4');
    
    if (p1) p1.style.display = (pageIdx === 1) ? 'flex' : 'none';
    if (p2) p2.style.display = (pageIdx === 2) ? 'block' : 'none';
    if (p4) p4.style.display = (pageIdx === 4) ? 'block' : 'none';
    
    // 버튼 내비게이션 하이라이트 클래스 정밀 스위칭
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.id === `nav_${pageIdx}`) {
            btn.style.background = '#ffffff';
            btn.style.color = '#475569';
            btn.style.fontWeight = '900';
            btn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)';
        } else if (btn.id && btn.id.startsWith('nav_')) {
            btn.style.background = 'transparent';
            btn.style.color = '#94a3b8';
            btn.style.fontWeight = '700';
            btn.style.boxShadow = 'none';
        }
    });

    if (pageIdx === 2 && typeof window.renderHistory === 'function') window.renderHistory();
    if (pageIdx === 4 && typeof window.renderGrowthAnalysis === 'function') window.renderGrowthAnalysis();
    
    sessionStorage.setItem('omni_current_page', pageIdx === 1 ? 'hunt' : `page_${pageIdx}`);
};

window.openTab = function(slotIdx) {
    window.currentIdx = slotIdx;
    for(let i=1; i<=4; i++) {
        const el = document.getElementById(`tab_${i}`);
        if(el) el.style.display = (i === slotIdx) ? 'block' : 'none';
    }
    window.init();
};

window.openHistTab = function(slotIdx) {
    window.currentHistChar = slotIdx;
    if (typeof window.renderHistory === 'function') window.renderHistory();
};