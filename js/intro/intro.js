/**
 * ============================================================================
 * 🏹 MAPLE OMNI V14 - js/intro/intro.js [ULTIMATE NEO-LAVENDER CONSOLE]
 * 설명: 인트로 레이어의 혁신적 구조 생성 및 API 키 유효성 검증 엔진
 * 패치노트: API 키가 로컬에 저장되어 있어도 대시보드로 자동 점프하지 않고,
 * 인트로 화면을 무조건 먼저 띄워 기존 키를 인풋 창에 예쁘게 채워 넣어 줍니다.
 * 규칙: 코딩 초보자도 완벽하게 이해할 수 있는 1:1 디테일 마스터 주석 시스템 완전판
 * ============================================================================
 */

/**
 * 💡 [초보자 가이드] 화면 전체에 차세대 미니멀 라벤더 인트로 인터페이스를 주입하는 코어 함수입니다.
 */
window.injectOmniIntroScreen = function() {
    // 🛡️ 화면에 이미 인트로 오버레이가 존재할 경우, 중복 호출 및 DOM 꼬임 버그를 원천 차단합니다.
    if (document.getElementById('omniIntroOverlay')) return;

    // 📦 브라우저의 최상단 body 레이어 아래에 삽입할 메인 오버레이 객체를 생성합니다.
    const introLayer = document.createElement('div');
    introLayer.id = 'omniIntroOverlay'; // 오직 전용 CSS로만 통제하기 위해 고유 ID만 부여합니다.

    // 💾 이전에 성공적으로 연동했던 API 토큰이 브라우저 저장소에 보존되어 있다면 자동으로 채워 넣어 유저 편의성을 극대화합니다.
    const savedApiKey = localStorage.getItem("nexon_api_key") || localStorage.getItem("omni_api_key") || "";

    // 🧱 인라인 스타일을 100% 지워버리고, 전문가급 그리드 정렬 매트릭스로 설계된 새 마크업을 주입합니다.
    introLayer.innerHTML = `
        <div class="omni-console-hub">
            
            <div class="omni-console-header">
                <div class="omni-core-logo">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L14.5 7.5L20.5 6L18 11.5L23 14.5L16.5 16L17 22L12 18.5L7 22L7.5 16L1 14.5L6 11.5L3.5 6L9.5 7.5L12 2Z" fill="url(#omniNeoLavenderGrad)"/>
                        <path d="M9 12.5L11 14.5L15 9.5" stroke="#161426" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <defs>
                            <linearGradient id="omniNeoLavenderGrad" x1="1" y1="2" x2="23" y2="22" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stop-color="#CBBFFF"/>
                                <stop offset="100%" stop-color="#9F92EC"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <h1 class="omni-core-title">MAPLE OMNI <span class="version-tag">V14 SYSTEM</span></h1>
                <p class="omni-core-subtitle">넥슨 오픈 API 동기화를 통한 통합 인게임 자산 및 데이터 리포팅 관제 콘솔</p>
            </div>
            
            <div class="omni-console-body">
                
                <div class="omni-gateway-card">
                    <div class="omni-input-wrapper">
                        <div class="omni-input-header">
                            <label class="omni-label">NEXON OPEN API TOKEN</label>
                            <span onclick="window.showGuidePopup()" class="omni-guide-trigger">API KEY 가이드 ↗</span>
                        </div>
                        
                        <input type="text" id="omni_api_key_input" class="omni-input-field" value="${savedApiKey}" placeholder="live_ 또는 test_ 로 시작하는 식별 키 코드를 기입하세요">
                        
                        <p class="omni-input-notice">
                            🔒 본 대시보드는 자사 외부 서버로 사용자의 어떠한 인증 정보도 전송하거나 수집하지 않으며, 오직 클라이언트 브라우저 로컬 저장소(LocalStorage) 내에서 암호화 지침에 의거하여 독립 작동합니다.
                        </p>
                    </div>
                    
                    <button class="omni-connect-btn" onclick="window.handleOmniApiKeyVerification()">
                        인프라 동기화 및 관제 콘솔 진입 ⚡
                    </button>
                </div>

                <div class="omni-feature-grid">
                    <div class="omni-feature-cell">
                        <div class="cell-icon">📅</div>
                        <div class="cell-content">
                            <h5>인게임 연동 스케줄러</h5>
                            <p>캐릭터별 일일/주간 숙제 진행률과 보스 결정을 동기화 추적합니다.</p>
                        </div>
                    </div>
                    
                    <div class="omni-feature-cell">
                        <div class="cell-icon">💰</div>
                        <div class="cell-content">
                            <h5>MVP 등급 손익 계산기</h5>
                            <p>로얄 패키지 번들 및 경매장 수수료 차감 비율을 자동 연산합니다.</p>
                        </div>
                    </div>
                    
                    <div class="omni-feature-cell">
                        <div class="cell-icon">⚔️</div>
                        <div class="cell-content">
                            <h5>사냥 및 재획 기록부</h5>
                            <p>통합/일반 로그 데이터 세트 2종 백업 및 획득 재화를 파싱합니다.</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <div class="omni-console-footer">
            <div class="omni-footer-links">
                <span>서비스 소개</span>
                <span class="policy-highlight">개인정보처리방침</span>
                <span>이용약관</span>
                <span>게임 IP 사용가이드</span>
                <span>기술 문의</span>
            </div>
            <div class="omni-footer-copyright">
                Data based on NEXON OPEN API · This system is an independent management console and is not affiliated with NEXON official.<br>
                © 2026. Maple Omni Architecture. All rights reserved.
            </div>
        </div>
    `;

    // 🚀 완전히 새롭게 조립된 최상위 쉘 구조를 body의 최우선 순위 자식 노드로 장착합니다.
    document.body.insertBefore(introLayer, document.body.firstChild);
    console.log("[인트로엔진] 전문가용 넥스트-제너레이션 다크 라벤더 관제 스킨 주입 프로세스가 성공적으로 완료되었습니다.");
};

/**
 * 💡 [초보자 가이드] 사용자가 입력 창에 입력한 키 패턴을 토대로 넥슨 게이트웨이 원격 서버에 유효성 신호를 검증하는 핵심 비동기 처리 함수입니다.
 */
window.handleOmniApiKeyVerification = async function() {
    const keyField = document.getElementById('omni_api_key_input');
    const apiKeyValue = keyField ? keyField.value.trim() : "";
    
    // 1차 안전 가드선: 입력값이 완전히 공백인 경우를 필터링합니다.
    if(!apiKeyValue) {
        alert("API 키를 입력해 주세요.");
        return;
    }

    // 2차 안전 가드선: 넥슨 OpenAPI의 표준 아키텍처 규격 검증 (live_ 및 test_ 접두 패턴 매칭 확인)
    if (!apiKeyValue.startsWith("live_") && !apiKeyValue.startsWith("test_")) {
        alert("⚠️ 올바르지 않은 규격의 API 키입니다.\n정상적인 test_ 혹은 live_ 형태로 발급된 토큰 키를 입력해 주세요.");
        return;
    }

    try {
        // 넥슨 서버 인터페이스 레이어에 다이렉트로 통신 비동기 요청을 투사합니다.
        const verifyRes = await fetch("https://open.api.nexon.com/maplestory/v1/notice", {
            headers: { "x-nxopen-api-key": apiKeyValue }
        });
        
        // 원격 게이트웨이 에러 상태 코드 발생 시의 분기별 안전 제어 가드 레일
        if (!verifyRes.ok) {
            if (verifyRes.status === 401) throw new Error("입력하신 API 키가 유효하지 않습니다. 철자 및 공백을 다시 검토해 주세요.");
            if (verifyRes.status === 403) throw new Error("API 토큰 권한 설정 누락. 넥슨 오픈 API 센터 개발자 대시보드에서 '메이플스토리' 서비스 권한을 허용해 주세요.");
            throw new Error("네트워크 게이트웨이 예외 오류 (코드: " + verifyRes.status + ")");
        }
    
        // 🔒 유효성 검증을 통과한 무결점 토큰에 한하여 로컬 스토리지에 세션 키를 영구 할당 및 전역 동기화합니다.
        localStorage.setItem("nexon_api_key", apiKeyValue);
        localStorage.setItem("omni_api_key", apiKeyValue);
        window.NEXON_API_KEY = apiKeyValue; 
        console.log("[API 게이트웨이] 인증 무결성 통과. 보안 스토리지 마운트 완료.");
        
        // 메인 대시보드 프레임 스위칭 제어 파이프라인 연동
        if (typeof window.omniSwitchPage === 'function') {
            window.omniSwitchPage('page-dashboard');
        } else {
            localStorage.setItem('omni_current_page', 'page-dashboard');
        }

        // 세션 데이터 상태 활성화
        sessionStorage.setItem("omni_session_active", "true");

        // 🌟 진입 버튼 클릭 시 화면이 투명해지며 상단으로 부드럽게 연기처럼 사라지는 페이드아웃 효과 연출용 클래스 마운팅
        const overlay = document.getElementById('omniIntroOverlay');
        if (overlay) {
            overlay.classList.add('fade-out');
            // CSS 애니메이션 소요 트랜지션 타임(0.6초) 대기 후 최종적으로 DOM 트리에서 완전히 메모리 클리어 해제 처리합니다.
            setTimeout(() => {
                overlay.remove();
            }, 600);
        }

    } catch (err) {
        // 통신 오류 발생 시 유저 알림 가이드 라우팅
        alert("시스템 동기화 실패: " + err.message);
        console.error("[인트로엔진] 비정상적인 키 접근 시도로 인해 대시보드 진입 프로세스가 차단되었습니다:", err);
    }
};

/**
 * 💡 [초보자 가이드] API 발급 방법 안내 링크를 터치했을 때 중앙 공간에 오버마운트되는 전문가 스타일의 마이크로 모달 레이어입니다.
 */
window.showGuidePopup = function() {
    if (document.querySelector('.omni-modal')) return;

    const modal = document.createElement('div');
    modal.className = 'omni-modal';
    modal.innerHTML = `
        <div class="omni-modal-content">
            <h3>NEXON OPEN API CONFIGURATION</h3>
            <div class="modal-steps-box">
                <p><span>01</span> 넥슨 오픈 API 센터(Nexon Open API Center) 공식 포털에 로그인합니다.</p>
                <p><span>02</span> 상단 메뉴의 애플리케이션 등록 관리 프로젝트 탭을 클릭하여 신규 발급을 개시합니다.</p>
                <p><span>03</span> 서비스 API 제공 범위 선택란에서 <strong>'메이플스토리'</strong> 권한 체인을 무조건 체크 적용합니다.</p>
                <p><span>04</span> 최종 출력된 고유 식별 API KEY 토큰 스트링을 전체 복사하여 메인 콘솔 인풋 상자에 바인딩하십시오.</p>
            </div>
            <button class="omni-modal-btn" onclick="this.parentElement.parentElement.remove()">설정 완료 및 창 닫기</button>
        </div>
    `;
    document.body.appendChild(modal);
};

// ============================================================================
// 🔄 [코어 세션 자격 증명 검사 후 인트로 제어 트랙]
// ============================================================================
window.NEXON_API_KEY = localStorage.getItem("nexon_api_key") || localStorage.getItem("omni_api_key") || "";

if (window.NEXON_API_KEY && !window.NEXON_API_KEY.startsWith("live_") && !window.NEXON_API_KEY.startsWith("test_")) {
    localStorage.removeItem("nexon_api_key");
    localStorage.removeItem("omni_api_key");
    window.NEXON_API_KEY = "";
}

if (!window.NEXON_API_KEY) {
    localStorage.setItem('omni_current_page', 'page-intro');
    if (typeof window.omniSwitchPage === 'function') {
        window.omniSwitchPage('page-intro');
    }
    if (typeof window.setOmniCurrentSearchData === 'function') {
        window.setOmniCurrentSearchData(null);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.injectOmniIntroScreen);
} else {
    window.injectOmniIntroScreen();
}