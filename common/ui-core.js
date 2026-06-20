/**
 * ============================================================================
 * ⚙️ MAPLE OMNI - ui-core.js (최종 무결점 통합본)
 * [핵심 기능] 캐릭터 탭 데이터 동기화, 알림, 주간 위젯 생성 및 [통합 네비게이션 엔진]
 * ============================================================================
 * 💡 [초보자 가이드]
 * 이 파일은 OMNI 홈페이지의 UI 제어 스위치입니다. 화면 깜빡임 제어, 로딩 오버레이,
 * 주간 사냥 정산 위젯 표시 및 페이지 간 이동을 부드럽게 총괄 제어합니다.
 */

if (typeof currentIdx === 'undefined') {
    window.currentIdx = 1; 
}

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

// 💡 [버그 전면 수정] 데이터 형식이 깨지던 통합 묶음고리를 단일 오브젝트로 재조립합니다.
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
        const wrapper = document.createElement('div');
        // 사이드바 버튼 디자인 (Flexbox 유지)
        wrapper.style.cssText = "display: inline-flex; align-items: center; background: #ffffff; padding: 6px 12px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 3px; cursor: pointer; height: 32px; box-sizing: border-box;";
        
        wrapper.innerHTML = `
            <span style="font-weight: 700; color: #64748b; font-size: 13px; white-space: nowrap; pointer-events: none;">${char.name}</span>
            <span onclick="window.deleteRecentSearch(event, '${char.name}')" 
                  style="display: inline-flex; align-items: center; justify-content: center; margin-left: 8px; width: 16px; height: 16px; background: #fee2e2; color: #ef4444; border-radius: 50%; font-size: 10px; font-weight: 900; border: 1px solid #fecaca; cursor: pointer; flex-shrink: 0; line-height: 1;">✕</span>
        `;
        
        wrapper.onclick = () => {
            if (typeof window.openSearchPage === 'function') window.openSearchPage(char.name);
        };
        
        container.appendChild(wrapper);
    });
};

window.openSearchPage = function(searchTerm) {
    const targetName = (searchTerm?.trim()) || localStorage.getItem('last_searched_character');

    if (!targetName || targetName === '테스트캐릭') {
        if (!targetName) alert("조회할 캐릭터명을 입력해주세요!");
        return;
    }

    if (typeof window.syncCharacterData === 'function') {
        window.syncCharacterData({ name: targetName });
    }
    localStorage.setItem('last_searched_character', targetName);

    if (typeof window.omniSwitchPage === 'function') {
        window.omniSwitchPage('searchPageContent');
    }

    if (typeof window.searchCharacter === 'function') {
        document.getElementById('searchPlaceholder')?.style.setProperty('display', 'none', 'important');
        window.searchCharacter(targetName, false, true);
    }

    if (typeof window.renderRecentSearchesMain === 'function') {
        window.renderRecentSearchesMain();
    }
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
        window.showToast("백업 다운로드가 완료되었습니다.");
    } catch (e) { console.error("Backup failed:", e); }
};

window.updateWeeklySummary = function() {
    if (typeof window.refreshWeekly === 'function') {
        window.refreshWeekly();
    } else {
        const allRecords = JSON.parse(localStorage.getItem('maple_hunt_records') || '[]');
        const now = new Date();
        const lastThursday = new Date(now);
        lastThursday.setDate(now.getDate() - ((now.getDay() + 3) % 7));
        lastThursday.setHours(0, 0, 0, 0);

        let meso = 0, exp = 0, frag = 0;
        allRecords.forEach(rec => {
            if (new Date(rec.date) >= lastThursday) {
                meso += parseInt(String(rec.meso).replace(/,/g, "")) || 0;
                exp += parseFloat(rec.exp) || 0;
                frag += parseInt(rec.frag) || 0;
            }
        });

        const mEl = document.getElementById('weekly-hunt-meso');
        const eEl = document.getElementById('weekly-hunt-exp');
        const fEl = document.getElementById('weekly-hunt-frag');
        const tEl = document.getElementById('weekly-total-sum');

        if (mEl) mEl.innerText = (meso / 100000000).toFixed(2) + " 억";
        if (eEl) eEl.innerText = exp.toFixed(3) + " %";
        if (fEl) fEl.innerText = frag.toLocaleString() + " 개";
        if (tEl) tEl.innerText = (meso / 100000000).toFixed(2) + " 억";
    }
};

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
                if (cached) {
                    window.currentSearchData = JSON.parse(cached);
                }
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

    if (updateHistory) {
        window.history.pushState({ page: targetId }, "", "#" + targetId);
    }

    sessionStorage.setItem('omni_current_page', targetId);
    if (targetId === 'mainPortal' && typeof window.updateMainDashboard === 'function') {
        window.updateMainDashboard();
    }
    window.scrollTo(0, 0); 
};

window.onpopstate = function(event) {
    const page = (event.state && event.state.page) ? event.state.page : 'mainPortal';
    
    if (page !== 'omniBuilderSection') {
        localStorage.setItem('is_builder_open', 'false');
        const builderSection = document.getElementById('omniBuilderSection');
        if (builderSection) builderSection.style.display = 'none';
    }
    
    if (typeof window.omniSwitchPage === 'function') {
        window.omniSwitchPage(page, false);
    }
};

window.openOmniScanner = function() {
    window.omniSwitchPage('omniScannerSection', true);
};

window.closeOmniScanner = function() {
    window.history.back();
};

window.openOmniBuilder = function() {
    try {
        sessionStorage.setItem('is_builder_open', 'true');
        if (typeof window.omniSwitchPage === 'function') {
            window.omniSwitchPage('omniBuilderSection', true);
        }
        if (typeof window.renderBuilderUI === 'function') {
            window.renderBuilderUI();
        } else {
            console.warn("⚠️ 빌더 렌더링 함수(renderBuilderUI)를 찾을 수 없습니다.");
        }
    } catch (e) {
        console.error("빌더 실행 중 오류 발생:", e);
    }
};
window.closeOmniBuilder = function() {
    sessionStorage.setItem('is_builder_open', 'false');
    window.history.back();
};

window.openMvpCalc = function() {
    if (typeof window.initMvpCalc === 'function') {
        window.initMvpCalc();
    } else {
        console.error("❌ [디버그] initMvpCalc 함수를 찾을 수 없습니다.");
    }

    if (typeof window.omniSwitchPage === 'function') {
        window.omniSwitchPage('mvpCalcSection', true);
    } else {
        console.error("❌ [디버그] omniSwitchPage 함수를 찾을 수 없습니다.");
    }
};

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

    const rightSidebar = document.querySelector('.right-sidebar');
    if (rightSidebar && !document.getElementById('weekly-summary-widget')) {
        const settlementWidget = document.createElement('div');
        settlementWidget.id = 'weekly-summary-widget';
        settlementWidget.className = 'diary-card';
        settlementWidget.style.cssText = 'padding: 20px; background: #ffffff; border-radius: 24px; border: 1px solid #eef2f6; margin-top: 20px;';
        settlementWidget.innerHTML = `
            <h4 style="margin: 0 0 15px 0; font-size: 13px; font-weight: 800; color: #1e293b; display: flex; justify-content: space-between;">
                💰 주간 정산 요약 <span style="font-size: 10px; color: #94a3b8; font-weight: 600;">이번주</span>
            </h4>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 11px; color: #64748b; font-weight: 600;">누적 사냥 메소</span>
                    <b id="weekly-hunt-meso" style="font-size: 12px; color: #1e293b;">0 억</b>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 11px; color: #64748b; font-weight: 600;">누적 획득 경험치</span>
                    <b id="weekly-hunt-exp" style="font-size: 12px; color: #818cf8;">0.000 %</b>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 11px; color: #64748b; font-weight: 600;">누적 획득 조각</span>
                    <b id="weekly-hunt-frag" style="font-size: 12px; color: #f59e0b;">0 개</b>
                </div>
                <div style="height: 1px; background: #f1f5f9; margin: 2px 0;"></div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 11px; color: #0284c7; font-weight: 800;">주간 합계</span>
                    <b id="weekly-total-sum" style="font-size: 14px; color: #0284c7; font-weight: 900;">0 억</b>
                </div>
            </div>`;
        
        const oldWidget = document.getElementById('weekly-summary-widget');
        if (oldWidget) oldWidget.remove();
        rightSidebar.appendChild(settlementWidget);
        
        window.updateWeeklySummary();
    }
});