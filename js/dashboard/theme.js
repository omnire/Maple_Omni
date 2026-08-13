/**
 * ============================================================================
 * 📑 MAPLE OMNI V15 - dashboard/theme.js
 * 설명: 대시보드의 테마 변경(라이트, 다크, 핑크, 블루) 및 팔레트 제어를 담당하는 모듈입니다.[cite: 1]
 * 초보자 가이드: 로컬 스토리지에 테마 상태를 보존하고 body 클래스를 스위칭합니다.[cite: 1]
 * ============================================================================
 */

// 💡 [글로벌 이벤트 목록 기본값 선언]: 파일 분리로 인한 ReferenceError 차단[cite: 1]
window.OMNI_ACTIVE_EVENTS = window.OMNI_ACTIVE_EVENTS || [
    { title: "치지직 방송 드롭스 연동", start: "2026-06-18", end: "2026-08-15" },
    { title: "여름 한정 코인샵 오픈", start: "2026-06-18", end: "2026-08-30" },
    { title: "아쉴롬 기억의 정원", start: "2026-07-01", end: "2026-07-30" },
    { title: "벼룩시장 황금 마차", start: "2026-07-01", end: "2026-09-20" },
    { title: "버닝 서버 육성 가속 페스티벌", start: "2026-06-18", end: "2026-09-30" }
];

/**
 * 🎨 [테마 마스터 컨트롤 Hub]
 * 입력받은 테마 명칭에 따라 전체 스킨 클래스를 변경하고 로컬 스토리지에 저장합니다.[cite: 1]
 */
window.setOmniTheme = function(themeName) {
    const body = document.body;
    body.classList.remove('dark-theme', 'light-pink', 'light-blue');
    
    if (themeName === 'dark') {
        body.classList.add('dark-theme');
    } else if (themeName === 'light-pink') {
        body.classList.add('light-pink');
    } else if (themeName === 'light-blue') {
        body.classList.add('light-blue');
    }
    
    localStorage.setItem("omni_theme_status", themeName);
    
    const lightBtn = document.getElementById('theme-btn-master-light');
    const darkBtn = document.getElementById('theme-btn-master-dark');
    const dotsContainer = document.getElementById('omniLightDots');
    
    if (lightBtn && darkBtn) {
        lightBtn.classList.remove('active');
        darkBtn.classList.remove('active');
        
        if (themeName === 'dark') {
            darkBtn.classList.add('active');
            if (dotsContainer) dotsContainer.style.display = 'none';
        } else {
            lightBtn.classList.add('active');
        }
    }
    
    document.querySelectorAll('.palette-dot').forEach(dot => {
        dot.style.transform = 'scale(1)';
        dot.style.outline = 'none';
    });
    
    const targetDotId = themeName === 'light' ? 'dot-light' : `dot-${themeName}`;
    const activeDot = document.getElementById(targetDotId);
    if (activeDot) {
        activeDot.style.transform = 'scale(1.2)';
        activeDot.style.outline = '2px solid var(--omni-text-dark)';
    }
};

/**
 * ☀️/🌙 [메인 라이트/다크 버튼 클릭 핸들러][cite: 1]
 */
window.handleMainThemeClick = function(mode) {
    const dotsContainer = document.getElementById('omniLightDots');
    
    if (mode === 'dark') {
        if (dotsContainer) dotsContainer.style.display = 'none';
        window.setOmniTheme('dark');
    } else {
        const currentTheme = localStorage.getItem("omni_theme_status") || "light";
        
        if (currentTheme === 'dark') {
            window.setOmniTheme('light');
            if (dotsContainer) dotsContainer.style.display = 'flex';
        } else {
            if (dotsContainer) {
                dotsContainer.style.display = (dotsContainer.style.display === 'flex') ? 'none' : 'flex';
            }
        }
    }
};

/**
 * 🎨 [서브 팔레트 Dot 클릭 스킨 선택 핸들러][cite: 1]
 */
window.selectDotColorSkin = function(colorName) {
    window.setOmniTheme(colorName);
    const dotsContainer = document.getElementById('omniLightDots');
    if (dotsContainer) dotsContainer.style.display = 'none';
};