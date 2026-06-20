/**
 * ============================================================================
 * 👤 MAPLE OMNI - search_main.js
 * 설명: 모든 화면의 뼈대를 렌더링하고 검색, 탭 전환, 즐겨찾기 등을 제어하는 메인 파일
 * ============================================================================
 */

// 💡 [초보자 가이드] 자주 사용하는 디자인 속성을 변수로 만들어두면 나중에 색상 바꿀 때 한 번만 수정해도 됩니다!
const UI = {
    card: "background: white; border-radius: 20px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);",
    pointColor: "#3b82f6", // 메인 포인트 블루
    grayText: "#64748b",
    mainText: "#1e293b",
    sectionTitle: "font-size: 16px; font-weight: 800; color: #1e293b; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;"
};

// 💡 [초보자 가이드] 브라우저 저장소(localStorage)에서 기존에 저장해둔 즐겨찾기와 검색 기록을 꺼내옵니다.
let favoriteChars = JSON.parse(localStorage.getItem('maple_favorites')) || [];

// ==========================================
// 1. 전체 화면 기본 렌더링
// ==========================================
window.renderFullSearchPage = function() {
    const container = document.getElementById('searchPageContent');
    if (!container) return; // 💡 화면에 그릴 공간이 없으면 에러를 막기 위해 바로 종료!
    
    container.innerHTML = `
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
// 2. 탭 메뉴 기능 (내실, 유니온 등 화면 전환 로직)
// ==========================================
window.switchTab = function(tabName) {
    // 💡 클릭한 버튼만 진한 색으로 만들고, 나머지는 회색으로 만듭니다.
    document.querySelectorAll('.tab-btn').forEach(btn => {
        const isActive = btn.innerText === tabName;
        btn.style.color = isActive ? '#36455e' : '#94a3b8';
        btn.style.borderBottomColor = isActive ? '#3b82f6' : 'transparent';
        btn.style.fontWeight = isActive ? '800' : '600';
    });
    
    const container = document.getElementById('tabContentContainer');
    const mainGrid = document.getElementById('mainGridContent'); // 내실 화면 요소
    if (!container) return;
    
    // 💡 선택된 탭에 따라 화면을 교체합니다. (파일 분할을 위해 기능 연동 구조 추가)
    if (tabName === '내실') {
        container.innerHTML = ''; 
        if (mainGrid) mainGrid.style.display = 'grid'; // 내실 탭은 메인 화면을 다시 보여줍니다.
    } else {
        if (mainGrid) mainGrid.style.display = 'none'; // 내실 화면은 숨깁니다.
        
        if (tabName === '유니온') {
            if (window.currentSearchData && window.currentSearchData.union) {
                const unionData = window.currentSearchData.union;
                // search_union.js 에 있는 함수를 호출합니다!
                let html = window.renderUnion(unionData); 
                if (unionData.union_champion_list && unionData.union_champion_list.length > 0) {
                    html += window.renderUnionChampion(unionData.union_champion_list);
                }
                container.innerHTML = html;
            } else {
                container.innerHTML = `<div style="padding: 40px; text-align: center; color: #94a3b8; font-weight:700;">유니온 데이터가 없습니다.</div>`;
            }
        } 
        else if (tabName === '코디') { container.innerHTML = typeof window.renderCody === 'function' ? window.renderCody() : `<div style="padding: 40px; text-align: center; color: #94a3b8; font-weight:700;">${tabName} 탭 렌더링 준비 중</div>`; }
        else if (tabName === '업적') { container.innerHTML = typeof window.renderAchievement === 'function' ? window.renderAchievement() : `<div style="padding: 40px; text-align: center; color: #94a3b8; font-weight:700;">${tabName} 탭 렌더링 준비 중</div>`; }
        else if (tabName === '부캐') { container.innerHTML = typeof window.renderAlts === 'function' ? window.renderAlts() : `<div style="padding: 40px; text-align: center; color: #94a3b8; font-weight:700;">${tabName} 탭 렌더링 준비 중</div>`; }
        else { container.innerHTML = `<div style="padding: 40px; text-align: center; color: #94a3b8; font-weight:700;">${tabName} 정보 준비 중입니다.</div>`; }
    }
};

// ==========================================
// 3. 최근 검색어 기능 (오브젝트 저장소 전면 통합 버전)
// ==========================================
window.saveRecentSearch = function(charName) {
    if (!charName || charName === '-' || charName === '테스트캐릭') return;
    
    // 💡 [초보자 가이드] 배열에서 중복된 이름을 필터링한 후 오브젝트 구조로 최상단에 추가합니다.
    let history = JSON.parse(localStorage.getItem('maple_recent_chars') || '[]');
    history = history.filter(char => char.name !== charName);
    history.unshift({ name: charName }); 
    if (history.length > 5) history = history.slice(0, 5);
    
    localStorage.setItem('maple_recent_chars', JSON.stringify(history));
    window.renderRecentSearchesMain();
    if (typeof window.renderSidebarHistory === 'function') window.renderSidebarHistory();
};

window.deleteRecentSearch = function(event, charName) {
    if (event) event.stopPropagation(); // 💡 검색 페이지 이동 이벤트를 방지합니다.
    
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

// 💡 포털이 화면을 다 그렸을 때 연동 수신 리스너
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

// ==========================================
// 4. 즐겨찾기 기능
// ==========================================
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

// 🔥 데이터 변수까지 완전히 초기화하여 잔상을 원천 차단합니다.
window.clearSearchUI = function() {
    localStorage.removeItem('last_maple_data');
    window.currentSearchData = null; // 💡 저장된 API 데이터 변수를 비웁니다.
    
    const container = document.getElementById('charDetailContainer');
    if (container) {
        container.innerHTML = '<div id="searchPlaceholder" style="text-align: center; padding: 100px 0; color: #94a3b8; font-weight: 800; font-size: 15px;">캐릭터 이름을 입력하여 조회를 시작하세요.</div>';
    }
};

// ==========================================
// 5. 검색 실행 및 이벤트 리스너
// ==========================================
window.executeInlineSearch = function() {
    const inputField = document.getElementById('inlineSearchInput');
    const charName = inputField?.value?.trim();
    if (charName) {
        window.saveRecentSearch(charName);
        window.searchCharacter(charName, false, false);
        inputField.value = ''; 
    }
};

// 💡 [초보자 가이드] HTML 문서 로딩이 끝나면 최초로 화면을 그려주는 트리거입니다.
document.addEventListener('DOMContentLoaded', () => {
    console.log("🔥 시스템 로딩 시작: DOMContentLoaded");

    window.clearSearchUI();
    
    window.renderFullSearchPage();

    const checkEl = document.getElementById('recentSearchList');
    if (!checkEl) {
        console.error("❌ 오류: recentSearchList 요소를 찾을 수 없습니다!");
    } else {
        console.log("✅ 성공: recentSearchList 요소를 찾았습니다!");
    }
    
    window.renderRecentSearchesMain();

    const inlineInput = document.getElementById('inlineSearchInput');
    if (inlineInput) {
        inlineInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') window.executeInlineSearch();
        });
    }
});

// search_main.js 맨 아래에 추가
console.log("🔍 search_main.js 파일이 정상 로드됨!");

if (typeof window.renderRecentSearchesMain === 'function') {
    console.log("✅ 렌더링 함수 감지됨. 1초 후 실행 시작...");
    setTimeout(() => {
        window.renderRecentSearchesMain();
        console.log("🚀 강제 렌더링 시도 완료.");
    }, 1000);
} else {
    console.error("❌ 렌더링 함수를 찾을 수 없음! 파일 로드 순서를 다시 확인하세요.");
}