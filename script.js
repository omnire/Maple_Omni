/**
 * ============================================================================
 * 🌟 MAPLE OMNI - script.js (UI, 렌더링, 대시보드 계산 전용 클린 버전)
 * [초보자용 주석] 화면의 세부 계산과 레이아웃 표시를 전담하는 파일입니다.
 * ============================================================================
 */

// 🚀 [수정] 페이지 로드 시 캐시를 자동 주입하여 화면에 이전 캐릭터 얼굴이 겹치는 잔상을 방지합니다.
(function hydrateData() {
    console.log("🚀 [성능] 데이터 자동 주입 모드: OFF (독립 실행)");
    return; 
})();

// 🛡️ 세션 초기화 (사이트를 처음 열었는지 확인하는 용도)
if (!sessionStorage.getItem('omni_session_active')) {
    sessionStorage.setItem('omni_session_active', 'true');
    localStorage.removeItem('search_character_name'); 
}

window.toggleDetails = function(idx) {
    const detailEl = document.getElementById(`details_${idx}`);
    const btn = event.currentTarget; 

    if (detailEl) {
        // [초보자용 주석] 상세정보 창이 꺼져있으면 켜고, 켜져있으면 끄는 토글(Toggle) 스위치입니다.
        const isHidden = detailEl.style.display === 'none' || detailEl.style.display === '';
        detailEl.style.display = isHidden ? 'block' : 'none';
        
        if (btn) {
            btn.innerText = isHidden ? "✨ 상세 능력치 및 도핑 설정 닫기" : "✨ 상세 능력치 및 도핑 설정 열기";
        }
    }
};

window.subHistory = JSON.parse(localStorage.getItem('omni_sub_history')) || {};

// 🔢 [초보자용 주석] 사용자가 숫자를 칠 때마다 자동으로 1,000 단위 콤마(,)를 찍어줍니다.
window.applyRealtimeComma = function(input) {
    let val = input.value.replace(/[^0-9]/g, '');
    if(val === '') { input.value = ''; return; }
    input.value = parseInt(val, 10).toLocaleString();
};

if (typeof window.currentSearchData === 'undefined') window.currentSearchData = null;

function _getSafeTodayStr() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
function getTodayStr() { return _getSafeTodayStr(); }

window.handleSidebarInput = function(val) {
    const idx = window.currentIdx || 1;
    const cfg = JSON.parse(localStorage.getItem(`maple_config_${idx}`) || '{}');
    cfg.name = val.trim() || `캐릭터 ${idx}`;
    localStorage.setItem(`maple_config_${idx}`, JSON.stringify(cfg));
    
    const tabBtn = document.getElementById(`tab_btn_${idx}`);
    const histTabBtn = document.getElementById(`hist_tab_btn_${idx}`);
    if(tabBtn) tabBtn.innerText = cfg.name;
    if(histTabBtn) histTabBtn.innerText = cfg.name;
};

// 📂 [초보자용 주석] 화면의 상단 탭(캐릭터 1, 2, 3...)을 클릭했을 때 작동하는 화면 전환 마법사입니다.
window.openTab = function(idx, forceRefresh = false) {
    // 🛡️ [강제 초기화] 탭 전환 시 사이드바의 얼굴과 기록을 싹 비웁니다.
    if (typeof window.resetSidebarUI === 'function') window.resetSidebarUI("닉네임 입력 후 엔터");
    
    window.currentIdx = idx;
    document.querySelectorAll('.content').forEach(c => c.style.display = 'none'); 
    const targetTab = document.getElementById(`tab_${idx}`);
    if (targetTab) targetTab.style.display = 'block'; 

    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); 
    const targetBtn = document.getElementById(`tab_btn_${idx}`);
    if (targetBtn) targetBtn.classList.add('active'); 

    sessionStorage.setItem('omni_current_tab', idx); 

    if (typeof restoreCharConfig === 'function') restoreCharConfig();

    const cfg = JSON.parse(localStorage.getItem(`maple_config_${idx}`) || '{}');
    const charName = cfg.name;
    
    // 💡 탭 전환 시 사이드바와 상세 정보를 다른 캐릭터의 데이터로 강제로 불러오지 않습니다. (완전 분리)
    if (typeof window.updateSidebarCard === 'function') window.updateSidebarCard("캐릭터명");

    if (typeof updateSubDisplay === 'function') updateSubDisplay(idx);
    if (typeof updateAll === 'function') updateAll(idx);
    if (typeof refreshWeekly === 'function') refreshWeekly();

    if (typeof window.renderTopToolbar === 'function') window.renderTopToolbar();
    if (typeof window.renderSubRecords === 'function') window.renderSubRecords(idx);
    if (typeof window.syncSidebarInput === 'function') window.syncSidebarInput(); 

    if (typeof window.renderAttendance === 'function') window.renderAttendance();
    
    if (typeof window.renderGrowthChart === 'function') {
        setTimeout(() => {
            window.renderGrowthChart();
        }, 100);
    }
};

window.showPage = function(pageNum) {
    // 🛡️ [강제 초기화] 페이지 이동 시 사이드바를 무조건 비웁니다.
    if (typeof window.resetSidebarUI === 'function') window.resetSidebarUI("닉네임 입력 후 엔터");

    const pages = ['page_1', 'page_2', 'page_3', 'page_4'];
    const appContent = document.getElementById('appContent');
    
    pages.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) el.style.display = (i + 1 === pageNum) ? (pageNum === 1 ? 'flex' : 'block') : 'none';
    });

    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById('nav_' + pageNum);
    if (activeBtn) activeBtn.classList.add('active');

    if (appContent) {
        appContent.style.setProperty('justify-content', 'flex-start', 'important');
        if (pageNum === 2 || pageNum === 3 || pageNum === 4) {
            if (typeof toggleTopUI === 'function') toggleTopUI(false);
        } else {
            if (typeof toggleTopUI === 'function') toggleTopUI(true);
        }
    }

    const leftSidebar = document.querySelector('.sidebar');       
    const rightSidebar = document.querySelector('.right-sidebar'); 
    const mainContainer = document.querySelector('.container');    

    if (pageNum === 2 || pageNum === 4) {
        if (leftSidebar) leftSidebar.style.display = 'none';
        if (rightSidebar) rightSidebar.style.display = 'none';
        if (mainContainer) {
            mainContainer.style.maxWidth = '100%'; 
            mainContainer.style.margin = '0 auto';
        }
    } else {
        if (leftSidebar) leftSidebar.style.display = 'block';
        if (rightSidebar) rightSidebar.style.display = 'block';
        if (mainContainer) {
            mainContainer.style.maxWidth = '100%'; 
        }
    }

    if (pageNum === 2) {
        const targetIdx = (typeof window.currentIdx !== 'undefined') ? window.currentIdx : 1;
        setTimeout(() => { if (typeof window.openHistTab === 'function') window.openHistTab(targetIdx); }, 50);
    }

    if (pageNum === 4 && typeof window.renderGrowthAnalysis === 'function') {
        window.renderGrowthAnalysis();
    }

    sessionStorage.setItem('omni_nav_page', pageNum);
};

window.openHistTab = function(i) {
    window.currentHistChar = i; 
    sessionStorage.setItem('omni_history_tab', i);

    document.querySelectorAll('#historyTabContainer .nav-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`hist_tab_btn_${i}`);
    if (activeBtn) activeBtn.classList.add('active');

    if (typeof toggleTopUI === 'function') toggleTopUI(false);
    if (typeof setDefaultHistoryFilter === 'function') setDefaultHistoryFilter();
    
    if (typeof window.renderHistory === 'function') {
        window.renderHistory();
    }
};

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
    
    saveCharConfig(i); 
};

function saveCharConfig(i) {
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
}

function restoreCharConfig() {
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
}

// 🚀 [초보자용 주석] 처음에 웹사이트가 켜질 때 필요한 세팅을 전부 자동으로 돌려주는 함수입니다.
function init() {
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

    // 💡 초기 로딩 시 데이터를 자동으로 불러오지 않도록 주석 처리합니다.
    // restoreCharConfig(); 
    
    const sidebarInput = document.getElementById('sidebarSearchInput');
    if (sidebarInput && window.autoSearchDisabled) {
        sidebarInput.value = '';
    }

    // 💡 [강제 분리] 사냥 페이지는 검색 데이터(currentSearchData)를 절대 참조하지 않습니다.
    // 페이지가 초기화되는 찰나의 잔상을 막기 위해 즉시 비웁니다.
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
}

(function checkDailyReset() {
    const today = new Date().toISOString().split('T')[0]; 
    const lastVisit = localStorage.getItem('omni_last_visit_date');
    if (lastVisit !== today) {
        localStorage.removeItem('search_character_data'); 
        localStorage.removeItem('search_character_name'); 
        localStorage.setItem('omni_last_visit_date', today);
    }
})();

window.openBossPage = function() {
    if (typeof window.omniSwitchPage === 'function') window.omniSwitchPage('bossPageContent');
    if (typeof window.renderBossPresets === 'function') {
        window.renderBossPresets();
        if(typeof window.renderSelectedBossList === 'function') window.renderSelectedBossList();
    }
};

window.backToPortal = function() {
    if (typeof window.omniSwitchPage === 'function') window.omniSwitchPage('mainPortal');
};

window.addEventListener('load', () => {
    try {
        // 💡 페이지 로드 시 검색 데이터를 자동으로 메모리에 복구하지 않습니다. (잔상 방지)
        window.currentSearchData = null;

        init();
        
        var lastPage = sessionStorage.getItem('omni_current_page') || 'mainPortal';
        if (lastPage === 'hunt') lastPage = 'appContent';
        
        if (typeof window.omniSwitchPage === 'function') {
            // 💡 페이지 로드 시, 메인 포탈일 경우에만 UI를 갱신하도록 처리합니다.
            window.omniSwitchPage(lastPage, false);
        }
        
        // 💡 대시보드 업데이트 시 현재 데이터가 있는 경우에만 처리하도록 안전 장치 추가
        if (typeof window.updateMainDashboard === 'function' && window.currentSearchData) {
            window.updateMainDashboard();
        }

        if (typeof window.renderPortalEvents === 'function') {
            window.renderPortalEvents();
        }

        setTimeout(() => {
            for (var i = 1; i <= 4; i++) {
                if (typeof window.renderSubRecords === 'function') window.renderSubRecords(i);
            }
            
            if (typeof window.renderTopToolbar === 'function') {
                window.renderTopToolbar();
            }
            if (typeof window.renderAttendance === 'function') window.renderAttendance();
            if (typeof window.refreshWeekly === 'function') window.refreshWeekly();
            
            if (typeof window.renderSidebarHistory === 'function') {
                window.renderSidebarHistory();
            }
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

window.addEventListener('DOMContentLoaded', () => {
    if (typeof window.renderAttendanceWidget === 'function') {
        window.renderAttendanceWidget();
    }
    if (typeof window.renderWeeklySummaryWidget === 'function') {
        window.renderWeeklySummaryWidget();
    }

    if (typeof window.renderPortalWidgets === 'function') window.renderPortalWidgets();
    if (typeof window.renderPortalContent === 'function') window.renderPortalContent();
});