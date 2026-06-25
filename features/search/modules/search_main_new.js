/**
 * ============================================================================
 * 👤 MAPLE OMNI - search_main_new.js
 * 설명: 모든 화면의 뼈대를 렌더링하고 검색, 탭 전환, 즐겨찾기 등을 제어하는 메인 파일
 * 보정 사항: switchTab 오버라이딩 시 숨겨져 있던 박스를 액티브('block') 시키는 디스플레이 패치 엔진 탑재
 * ============================================================================
 */

const UI = {
    card: "background: white; border-radius: 20px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);",
    pointColor: "#3b82f6", 
    grayText: "#64748b",
    mainText: "#1e293b",
    sectionTitle: "font-size: 16px; font-weight: 800; color: #1e293b; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;"
};

let favoriteChars = JSON.parse(localStorage.getItem('maple_favorites')) || [];

// ==========================================
// 1. 전체 화면 기본 렌더링 (헤더, 로고, 검색창 뼈대)
// ==========================================
window.renderFullSearchPage = function() {
    const container = document.getElementById('searchPageContent');
    if (!container) return; 
    
    container.innerHTML = `
        <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
            <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 20px 0; border-bottom: 1px solid #e2e8f0;">
                
                <div style="flex: 1; display: flex; justify-content: flex-start; gap: 8px;">
                    <button onclick="backToPortal()" style="padding: 8px 16px; border-radius: 8px; border: 1px solid #e2e8f0; background: #ffffff; cursor: pointer; font-weight: 700; color: #64748b; font-size: 12px; transition: all 0.2s;">⬅️ 메인으로</button>
                    
                    <button id="refreshBtn" onclick="this.disabled=true; this.innerText='갱신 중...'; window.fetchMapleData();" 
                        style="background: #eff6ff; color: #3b82f6; border: 1px solid #bfdbfe; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 700; transition: 0.2s;"
                        onmouseover="this.style.background='#dbeafe'" 
                        onmouseout="this.style.background='#eff6ff'">
                        🔄 정보 갱신
                    </button>
                </div>

                <div style="flex: 1; text-align: center;">
                    <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #334155; letter-spacing: -0.5px;">
                        <span style="color: #fb923c;">Maple</span> Look
                    </h1>
                </div>

                <div style="flex: 1; display: flex; flex-direction: column; align-items: flex-end;">
                    <div style="display: flex; align-items: center; width: 280px; border-radius: 8px; border: 1px solid #e2e8f0; background: #ffffff; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.03);">
                        <input type="text" id="inlineSearchInput" placeholder="캐릭터명 검색..." style="flex: 1; border: none; outline: none; padding: 8px 12px; font-size: 13px; font-weight: 700; color: #334155; background: transparent;">
                        <button onclick="window.executeInlineSearch()" style="padding: 8px 16px; background: #475569; color: white; border: none; cursor: pointer; font-weight: 700; font-size: 12px;">검색</button>
                    </div>
                    <div id="recentSearchList" style="display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; justify-content: flex-end; min-height: 20px;"></div>
                </div>
            </div>

            <div id="charDetailContainer" style="width: 100%;">
                <div id="searchPlaceholder" style="text-align: center; padding: 100px 0; color: #94a3b8; font-weight: 800; font-size: 15px;">캐릭터 이름을 입력하여 조회를 시작하세요.</div>
            </div>
        </div>
    `;
};

// ==========================================
// 2. 기본 탭 메뉴 라우터 백업본
// ==========================================
window.switchTab = function(tabName) {
    console.log("📢 탭 메뉴 라우터 기초 작동선언:", tabName);
};

// ==========================================
// 3. 최근 검색어 인터페이스 제어
// ==========================================
window.saveRecentSearch = function(charName) {
    if (!charName || charName === '-' || charName === '테스트캐릭') return;
    
    let history = JSON.parse(localStorage.getItem('maple_recent_chars') || '[]');
    history = history.filter(char => char.name !== charName);
    history.unshift({ name: charName }); 
    if (history.length > 5) history = history.slice(0, 5);
    
    localStorage.setItem('maple_recent_chars', JSON.stringify(history));
    window.renderRecentSearchesMain();
    if (typeof window.renderSidebarHistory === 'function') window.renderSidebarHistory();
};

window.deleteRecentSearch = function(event, charName) {
    if (event) event.stopPropagation(); 
    
    let history = JSON.parse(localStorage.getItem('maple_recent_chars') || '[]');
    history = history.filter(char => char.name !== charName);
    
    localStorage.setItem('maple_recent_chars', JSON.stringify(history));
    window.renderRecentSearchesMain();
    if (typeof window.renderSidebarHistory === 'function') window.renderSidebarHistory();
};

window.renderFavorites = function() {
    const favBox = document.getElementById('favoriteListContainer');
    if (!favBox) return;
    
    const favoriteChars = JSON.parse(localStorage.getItem('maple_favorites') || '[]');
    
    favBox.innerHTML = favoriteChars.length === 0 
        ? '<div style="font-size:12px; color:#94a3b8; text-align:center; padding:20px 0;">등록 캐릭터 없음</div>' 
        : favoriteChars.map(name => `
            <div onclick="window.openSearchPage('${name}')" style="background:#fff; border:1px solid var(--border-light); padding:12px 15px; border-radius:12px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-weight:800; color:#1e293b; font-size:13px;">${name}</span>
                <span style="font-size:11px; color:var(--point-blue);">➔</span>
            </div>
        `).join('');
};

document.addEventListener('portal-rendered', () => {
    window.renderRecentSearchesMain();
});

window.renderRecentSearchesMain = function() {
    const container = document.getElementById('recentSearchList');
    if (!container) return;

    let history = JSON.parse(localStorage.getItem('maple_recent_chars') || '[]');
    history = history.filter(char => char && char.name && char.name !== '테스트캐릭');
    
    container.innerHTML = ''; 

    history.forEach(char => {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = "display: inline-flex; align-items: center; background: #ffffff; padding: 4px 10px; border-radius: 20px; border: 1px solid #3b82f6; margin: 3px; cursor: pointer; height: 28px; box-sizing: border-box;";
        
        wrapper.innerHTML = `
            <span style="color: #3b82f6; font-weight: 800; font-size: 13px; white-space: nowrap; pointer-events: none;">${char.name}</span>
            <span onclick="window.deleteRecentSearch(event, '${char.name}')" 
                  style="display: inline-flex; align-items: center; justify-content: center; margin-left: 6px; width: 16px; height: 16px; background: #fee2e2; color: #ef4444; border-radius: 50%; font-size: 10px; font-weight: 900; border: 1px solid #fecaca; cursor: pointer; flex-shrink: 0; line-height: 1;">✕</span>
        `;
        
        wrapper.onclick = () => {
            const input = document.getElementById('portalSearchInput');
            if (input) input.value = char.name;
            window.openSearchPage(char.name);
        };
        
        container.appendChild(wrapper);
    });
};

window.toggleFavorite = function() {
    const nameEl = document.getElementById('res_profileName');
    if (!nameEl) return;
    const charName = nameEl.innerText;
    if (charName === '-' || !charName) return;

    if (favoriteChars.includes(charName)) { 
        favoriteChars = favoriteChars.filter(n => n !== charName); 
        if (typeof window.showAlert === 'function') window.showAlert(`⭐ ${charName} 즐겨찾기 해제!`); 
    } else { 
        favoriteChars.push(charName); 
        if (typeof window.showAlert === 'function') window.showAlert(`⭐ ${charName} 즐겨찾기 등록!`); 
    }
    localStorage.setItem('maple_favorites', JSON.stringify(favoriteChars));
    window.updateFavoriteBtnState(charName); 
    window.renderFavorites();
};

window.updateFavoriteBtnState = function(charName) {
    const btn = document.getElementById('btn_favorite');
    if (!btn) return;
    if (favoriteChars.includes(charName)) { 
        btn.style.background = 'var(--point-blue)'; btn.style.color = 'white'; btn.innerText = '★ 즐겨찾기 해제'; 
    } else { 
        btn.style.background = 'white'; btn.style.color = 'var(--point-blue)'; btn.innerText = '⭐ 즐겨찾기 추가'; 
    }
};

window.clearSearchUI = function() {
    localStorage.removeItem('last_maple_data');
    window.currentSearchData = null; 
    
    const container = document.getElementById('charDetailContainer');
    if (container) {
        container.innerHTML = '<div id="searchPlaceholder" style="text-align: center; padding: 100px 0; color: #94a3b8; font-weight: 800; font-size: 15px;">캐릭터 이름을 입력하여 조회를 시작하세요.</div>';
    }
};

window.executeInlineSearch = function() {
    const inputField = document.getElementById('inlineSearchInput');
    const charName = inputField?.value?.trim();
    if (charName) {
        window.saveRecentSearch(charName);
        window.searchCharacter(charName, false, false);
        inputField.value = ''; 
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.clearSearchUI();
    window.renderFullSearchPage();
    window.renderRecentSearchesMain();

    const inlineInput = document.getElementById('inlineSearchInput');
    if (inlineInput) {
        inlineInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') window.executeInlineSearch();
        });
    }

    const lastSearchName = localStorage.getItem('maple_last_search');
    if (lastSearchName && lastSearchName !== "null" && lastSearchName !== "undefined" && lastSearchName.trim() !== "") {
        const appContainer = document.getElementById('appContent');
        const searchContainer = document.getElementById('searchPageContent');
        const portalContainer = document.getElementById('mainPortal');
        
        if (appContainer) appContainer.style.setProperty('display', 'block', 'important');
        if (portalContainer) portalContainer.style.setProperty('display', 'none', 'important');
        if (searchContainer) searchContainer.style.setProperty('display', 'block', 'important');
        
        if (typeof window.searchCharacter === 'function') {
            window.searchCharacter(lastSearchName, false, false, false);
        }
    }
});

// ============================================================================
// 🚨 [가장 중요] 런타임 최상위 오버라이딩 패치 인터셉터 코어 (Hook)
// 보정 완료: 1. container.style.display = 'block' 강제 주입으로 흰 화면 완전 타파!
//            2. 중복 오버라이딩 조건 제거로 단 한 개의 깨끗한 버튼 구현 완료!
// ============================================================================
window.addEventListener('load', () => {
    console.log("🛠️ [OMNI PATCHER] 최종 탭 컨트롤러 가로채기 엔진 가동 완료");

    if (typeof window.switchTab === 'function') {
        const originalSwitchTab = window.switchTab;

        window.switchTab = function(tabName) {
            if (tabName === '헥사/스킬' || tabName === '헥사/스텟') {
                console.log("🎯 [OMNI PATCHER] 가로채기 성공! '헥사/스킬' 화면을 활성화합니다.");
                
                const container = document.getElementById('tabContentContainer');
                const mainGrid = document.getElementById('mainGridContent'); 
                
                if (mainGrid) mainGrid.style.display = 'none'; 
                if (container) {
                    // 💡 [핵심 보정] 숨겨져 있던 컨테이너 박스를 강제로 화면에 그리도록('block') 설정합니다!
                    container.style.display = 'block'; 
                    container.innerHTML = typeof window.renderSkill === 'function' ? window.renderSkill() : `<div style="padding: 40px; text-align: center; color: #94a3b8; font-weight:700;">🔮 스킬 템플릿 로딩 실패</div>`;
                }

                // 상단 탭 버튼들의 하이라이트 활성화 스타일 제어
                document.querySelectorAll('.tab-btn').forEach(btn => {
                    const txt = btn.innerText.trim();
                    if (txt === '헥사/스킬') {
                        btn.style.color = '#ffffff';
                        btn.style.background = '#ea580c';
                        btn.style.borderColor = '#ea580c';
                        btn.style.fontWeight = '800';
                    } else {
                        btn.style.color = '#64748b';
                        btn.style.background = '#ffffff';
                        btn.style.borderColor = '#e2e8f0';
                        btn.style.fontWeight = '600';
                    }
                });
            } else {
                originalSwitchTab(tabName);
            }
        };
    }

    // 💡 [중복 제거 반영] 코디 버튼을 중복으로 재생성해 버리던 오버레이 필터를 삭제하고 정밀 동기화 처리만 남깁니다.
    if (typeof window.renderSearchDetail === 'function') {
        const originalRenderSearchDetail = window.renderSearchDetail;
        window.renderSearchDetail = function(...args) {
            originalRenderSearchDetail(...args);
            document.querySelectorAll('.tab-btn').forEach(btn => {
                const btnText = btn.innerText.trim();
                if (btnText === '코디' || btnText === '헥사/스텟') {
                    btn.innerText = '헥사/스킬';
                    btn.setAttribute('onclick', "window.switchTab('헥사/스킬')");
                }
            });
        };
    }
});

if (typeof window.renderRecentSearchesMain === 'function') {
    setTimeout(() => { window.renderRecentSearchesMain(); }, 1000);
}