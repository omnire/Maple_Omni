/**
 * ============================================================================
 * 🏹 MAPLE OMNI - ui-common.js
 * [공통 UI 관리자] 알림, 사이드바, 필터, 화면 제어 및 페이지 라우팅 등 공통 기능
 * ============================================================================
 */

/**
 * ✨ [알림] 화면 하단에 잠깐 나타났다 사라지는 토스트 메시지를 띄웁니다.
 */
window.showToast = function(message) {
    let toast = document.querySelector('.omni-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'omni-toast';
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<span>✅</span> ${message}`;
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); }, 2500);
};

// [💡 수정] 검색과 탭 이름이 연동되어 덮어씌워지던 문제를 방지하기 위해 비활성화합니다.
window.syncSidebarInput = function() {};

// [초보자용 주석] 사냥 기록지 필터를 언제나 이번 달로 리셋해줍니다.
window.setDefaultHistoryFilter = function() {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; 
    window.selectedDate = currentMonth; 
    
    document.querySelectorAll('input[type="month"], #monthFilter, .month-picker').forEach(input => {
        input.value = currentMonth;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    });
};

// 특정 페이지로 이동 시 불필요한 상단 UI 끄기
window.toggleTopUI = function(show) {
    const selectors = [
        '.sidebar', 'aside', '.top-timer', '#timer', 
        '.timer-container', '.top-char-name', '.top-backup-btn', 
        'header', '.header-wrapper', '.omni-top-toolbar'
    ];
    selectors.forEach(sel => { 
        document.querySelectorAll(sel).forEach(el => { 
            el.style.setProperty('display', show ? '' : 'none', 'important'); 
        }); 
    });
};

window.renderWeeklySummaryWidget = function() {
    const container = document.getElementById('weeklySummaryContainer');
    if (!container) return;

    container.innerHTML = `
    <div class="diary-card" style="padding: 20px; background: #ffffff; border-radius: 24px; border: 1px solid #eef2f6; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h4 style="margin: 0; font-size: 14px; font-weight: 800; color: #1e293b;">💰 주간 정산 요약</h4>
            <span style="font-size: 10px; font-weight: 800; color: #94a3b8; background: #f1f5f9; padding: 2px 6px; border-radius: 6px;">목요일 초기화</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700;">
                <span style="color: #64748b;">누적 사냥 메소</span><b id="weekly-hunt-meso">0.00 억</b>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700;">
                <span style="color: #64748b;">누적 경험치</span><b id="weekly-hunt-exp" style="color: #3b82f6;">0.000 %</b>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700;">
                <span style="color: #64748b;">누적 조각</span><b id="weekly-hunt-frag" style="color: #8b5cf6;">0 개</b>
            </div>
            <div style="border-top: 1px dashed #eef2f6; padding-top: 10px; display: flex; justify-content: space-between; font-size: 14px; font-weight: 800; color: #3b82f6;">
                <span>주간 합계</span><b id="weekly-total-sum">0.00 억</b>
            </div>
        </div>
    </div>`;

    if (typeof window.refreshWeekly === 'function') window.refreshWeekly();
};

window.renderAttendanceWidget = function() {
    const container = document.getElementById('attendanceContainer');
    if (!container) return;
    container.innerHTML = `
    <div class="attendance-card diary-card" style="padding: 20px; background: #ffffff; border-radius: 24px; border: 1px solid #eef2f6; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
        <h4 style="margin: 0 0 15px 0; font-size: 14px; font-weight: 800; color: #1e293b;">📅 재획 출석기록부</h4>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <button onclick="changeMonth(-1)" style="border:1px solid #ddd; background:none; cursor:pointer; border-radius:4px;">&lt;</button>
            <div id="currentMonth" style="font-size: 12px; font-weight: 800; color: #ff9100;">${new Date().getFullYear()}년 ${new Date().getMonth() + 1}월</div>
            <button onclick="changeMonth(1)" style="border:1px solid #ddd; background:none; cursor:pointer; border-radius:4px;">&gt;</button>
        </div>
        <div id="attendanceGrid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;"></div>
        <div style="margin-top: 15px; font-size: 10px; color: #94a3b8; text-align: right; font-weight: 700;">오늘 사냥 시 자동 출석 ✅</div>
    </div>`;
};

// ==========================================
// [초보자용 주석] ui-core.js 및 script.js에서 이관된 전체 라우팅 및 UI 검색 모듈
// ==========================================

window.globalSync = function(charName) {
    if (!charName) return;
    if (typeof window.updateSidebarCard === 'function') window.updateSidebarCard(charName);
};

window.updateSidebarCard = function(charName) {
    if (!charName || charName === "캐릭터명" || charName.includes("캐릭터 ")) {
        window.resetSidebarUI();
        return;
    }

    const data = (window.currentSearchData?.basic?.character_name === charName) ? window.currentSearchData : null;
    if (!data?.basic || !data?.stat) {
        window.resetSidebarUI("닉네임 입력 후 엔터");
        return;
    }

    const imgEl = document.getElementById('profileImg');
    if (imgEl) {
        if (data.basic.character_image) {
            imgEl.src = data.basic.character_image;
            imgEl.style.opacity = '1';
            imgEl.style.visibility = 'visible';
        } else {
            imgEl.removeAttribute('src');
            imgEl.style.opacity = '0';
            imgEl.style.visibility = 'hidden';
        }
    }

    document.getElementById('profileName') && (document.getElementById('profileName').innerText = data.basic.character_name);
    document.getElementById('profileWorld') && (document.getElementById('profileWorld').innerText = data.basic.world_name || "월드 미확인");
    document.getElementById('profileGuild') && (document.getElementById('profileGuild').innerText = data.basic.character_guild_name || "길드 없음");
    document.getElementById('profileLevel') && (document.getElementById('profileLevel').innerText = `Lv. ${data.basic.character_level || "---"}`);
    document.getElementById('profileJob') && (document.getElementById('profileJob').innerText = data.basic.character_class || "---");
    
    const getStat = (name) => data.stat.final_stat?.find(s => s.stat_name === name)?.stat_value || "0";
    
    const power = Number(String(getStat("전투력")).replace(/[^0-9]/g, '')).toLocaleString();
    const atk = Number(String(getStat("최대 스탯공격력")).replace(/[^0-9]/g, '')).toLocaleString();
    const dmg = getStat("데미지") + "%";

    document.getElementById('stat_power') && (document.getElementById('stat_power').innerText = power);
    document.getElementById('stat_atk') && (document.getElementById('stat_atk').innerText = atk);
    document.getElementById('stat_dmg') && (document.getElementById('stat_dmg').innerText = dmg);
};

window.resetSidebarUI = function(name = "닉네임 입력 후 엔터") {
    const cardImg = document.getElementById('profileImg');
    if (cardImg) {
        cardImg.style.transition = 'none'; 
        cardImg.removeAttribute('src'); 
        cardImg.style.opacity = '0';
        cardImg.style.visibility = 'hidden';
    }
    const nameEl = document.getElementById('profileName');
    if (nameEl) nameEl.innerText = name;
    
    const els = ['profileWorld', 'profileGuild', 'profileLevel', 'profileJob', 'stat_power', 'stat_atk', 'stat_dmg'];
    const defaults = ["월드 미확인", "길드 없음", "Lv. ---", "---", "0", "-", "-"];
    els.forEach((id, i) => { if(document.getElementById(id)) document.getElementById(id).innerText = defaults[i]; });
};

window.renderSidebarHistory = function() {
    const container = document.getElementById('historyTabContainer');
    if (!container) return;

    let rawHistory = JSON.parse(localStorage.getItem('maple_recent_chars') || '[]');
    let uniqueHistory = [];
    let seenNames = new Set();

    for (let char of rawHistory) {
        if (char && char.name && !seenNames.has(char.name)) {
            seenNames.add(char.name);
            uniqueHistory.push(char);
        }
    }
    
    localStorage.setItem('maple_recent_chars', JSON.stringify(uniqueHistory));
    container.innerHTML = ''; 

    uniqueHistory.forEach(char => {
        const btn = document.createElement('button');
        btn.className = 'tab-btn';
        btn.innerText = char.name;
        btn.dataset.nickname = char.name; 
        btn.style = "padding: 8px 16px; border: none; background: #ffffff; border-radius: 12px; cursor: pointer; font-weight: 700; color: #64748b; border: 1px solid #e2e8f0; margin-right: 8px;";
        btn.onclick = () => {
            if (typeof window.fetchMapleData === 'function') window.fetchMapleData(char.name);
        };
        container.appendChild(btn);
    });
};


window.showDetailTab = function(tabName) { 
    const containers = ['equip', 'stat', 'union', 'skill', 'coordi'];
    containers.forEach(c => {
        const el = document.getElementById(`res_${c}_container`);
        const fallbackEl = document.getElementById(`tab_content_${c}`);
        if (el) el.style.display = (c === tabName) ? 'block' : 'none';
        if (fallbackEl) fallbackEl.style.display = (c === tabName) ? 'block' : 'none';
    });

    const tabButtons = document.querySelectorAll('#detailTabMenu .nav-btn, .detail-nav-btn');
    tabButtons.forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(`'${tabName}'`)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
};

window.showAlert = function(msg) { 
    if (typeof window.omniModal === 'function') {
        window.omniModal({ title: '알림', desc: msg, icon: '⚠️' });
    } else {
        alert(msg); 
    }
};

window.toggleLoading = function(show, message = "Omni Analyzing") {
    const loadingEl = document.getElementById('globalLoading');
    const textEl = document.getElementById('loadingText');
    if (loadingEl) {
        if (show) {
            if (textEl) textEl.innerText = message;
            loadingEl.style.display = 'flex';
        } else {
            setTimeout(() => { loadingEl.style.display = 'none'; }, 500);
        }
    }
};

// 💡 [초보자 가이드] 중복 기능 제거를 위한 코드 무력화 조치입니다.
// 이 파일(ui-common.js)의 옛날 코드가 최신 코드를 덮어쓰지 못하도록 완전히 비워둡니다.
// 진짜 기능은 search_main_new.js와 index.html 하단에서 안전하게 통합 실행됩니다.
window.renderRecentSearchesMain = function() {
    /* 다른 파일의 최신 무결점 코드가 작동하므로 이 구역은 비워둡니다. */
};

// [초보자용 주석] 페이지를 부드럽게 넘나드는 화면 이동 내비게이션 엔진
window.omniSwitchPage = function(targetId, updateHistory = true) {
    const shield = document.getElementById('flicker-shield');
    if (shield) shield.remove();

    const allSections = ['mainPortal', 'searchPageContent', 'omniScannerSection', 'omniBuilderSection', 'appContent', 'bossPageContent', 'mvpCalcSection'];
    
    allSections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.setProperty('display', 'none', 'important');
    });

    const target = document.getElementById(targetId);
    if (target) {
        const displayType = (targetId === 'appContent') ? 'flex' : 'block';
        target.style.display = displayType;
        target.style.setProperty('display', displayType, 'important');
    } else {
        const portal = document.getElementById('mainPortal');
        if(portal) portal.style.setProperty('display', 'block', 'important');
    }
    
    if (targetId === 'searchPageContent') {
        if (!window.currentSearchData) {
            const lastChar = localStorage.getItem('last_searched_character');
            if (lastChar) {
                const cached = localStorage.getItem(`maple_api_search_${lastChar}`);
                if (cached) window.currentSearchData = JSON.parse(cached);
            }
        }
        if (window.currentSearchData && typeof window.renderSearchDetail === 'function') {
            window.renderSearchDetail(
                window.currentSearchData.basic, 
                window.currentSearchData.stat, 
                window.currentSearchData.item, 
                window.currentSearchData.ability, 
                window.currentSearchData.symbol, 
                window.currentSearchData.dojang, 
                window.currentSearchData.union, 
                window.currentSearchData.ranking
            );
        }
    }

    if (updateHistory) window.history.pushState({ page: targetId }, "", "#" + targetId);
    sessionStorage.setItem('omni_current_page', targetId);
    
    if (targetId === 'mainPortal' && typeof window.updateMainDashboard === 'function') window.updateMainDashboard();
    window.scrollTo(0, 0);
};

window.onpopstate = function(event) {
    const page = (event.state && event.state.page) ? event.state.page : 'mainPortal';
    
    if (page !== 'omniBuilderSection') {
        localStorage.setItem('is_builder_open', 'false');
        const builderSection = document.getElementById('omniBuilderSection');
        if (builderSection) builderSection.style.display = 'none';
    }
    
    if (typeof window.omniSwitchPage === 'function') window.omniSwitchPage(page, false);
};

window.openOmniScanner = function() { window.omniSwitchPage('omniScannerSection', true); };
window.closeOmniScanner = function() { window.history.back(); };
window.openOmniBuilder = function() {
    try {
        sessionStorage.setItem('is_builder_open', 'true');
        if (typeof window.omniSwitchPage === 'function') window.omniSwitchPage('omniBuilderSection', true);
        if (typeof window.renderBuilderUI === 'function') window.renderBuilderUI();
    } catch (e) { console.error("빌더 실행 중 오류 발생:", e); }
};
window.closeOmniBuilder = function() {
    sessionStorage.setItem('is_builder_open', 'false');
    window.history.back();
};

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

window.openMvpCalc = function() {
    if (typeof window.initMvpCalc === 'function') window.initMvpCalc();
    if (typeof window.omniSwitchPage === 'function') window.omniSwitchPage('mvpCalcSection', true);
};

// [초보자용 주석] script.js / ui-core.js 하단의 자동 실행 이벤트
document.addEventListener('DOMContentLoaded', () => {
    sessionStorage.removeItem('is_builder_open'); 
    
    const lastTab = sessionStorage.getItem('omni_current_tab') || 1;
    const lastPage = sessionStorage.getItem('omni_nav_page') || 1;

    setTimeout(() => {
        if(typeof window.openTab === 'function') window.openTab(parseInt(lastTab));
        if(typeof window.showPage === 'function') window.showPage(parseInt(lastPage));
    }, 100);

    setInterval(() => {
        const timeElem = document.getElementById('liveTime');
        if (timeElem) {
            const now = new Date();
            timeElem.innerText = now.getHours().toString().padStart(2, '0') + ":" + 
                                 now.getMinutes().toString().padStart(2, '0') + ":" + 
                                 now.getSeconds().toString().padStart(2, '0');
        }
    }, 1000);
});