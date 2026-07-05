/**
 * ============================================================================
 * 🏹 MAPLE OMNI V14 - js/intro/intro.js [SKY BLUE CONTROLLER]
 * 설명: 인트로 레이어의 동적 DOM 주입 및 대시보드 개방 제어 파이프라인
 * 수정사양: showGuidePopup 등 참조 요소를 window 전역 스코프에 안전하게 바인딩 완료
 * 규칙: 코딩 초보자도 완벽하게 이해할 수 있는 1:1 디테일 주석 시스템 완전판
 * ============================================================================
 */

/**
 * 💡 [초보자 가이드] 브라우저 웹 화면에 API 인증용 인트로 인터페이스를 주입하고 가동시키는 마스터 기어입니다.
 */
window.injectOmniIntroScreen = function() {
    // 중복 주입 가드: 화면에 이미 인트로 블록이 생성되어 있다면 로직을 중단시킵니다.
    if (document.getElementById('omniIntroOverlay')) return;

    // 인트로를 감싸는 최상위 div 가상 엘리먼트를 동적 생성합니다.
    const introLayer = document.createElement('div');
    introLayer.id = 'omniIntroOverlay';

    // 사용자가 과거에 입력한 기록이 스토리지에 남아있다면 가져와 채워넣습니다.
    const savedApiKey = localStorage.getItem("omni_api_key") || "";

    // 💡 레이아웃 가이드에 수록된 좌측 폼 블록 및 우측 기능 설명 카드를 안전하게 정렬 주입합니다.
    introLayer.innerHTML = `
        <div class="intro-split-container">
            <div class="intro-left">
                <div class="intro-logo-wrapper">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;">
                        <path d="M12 2L14.5 7.5L20.5 6L18 11.5L23 14.5L16.5 16L17 22L12 18.5L7 22L7.5 16L1 14.5L6 11.5L3.5 6L9.5 7.5L12 2Z" fill="url(#introThemeGrad)"/>
                        <path d="M9 12.5L11 14.5L15 9.5" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <defs>
                            <linearGradient id="introThemeGrad" x1="1" y1="2" x2="23" y2="22" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stop-color="#64748B"/>
                                <stop offset="100%" stop-color="#0284C7"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <h1 class="intro-brand-title">Maple <span>Omni</span></h1>
                
                <div class="intro-login-card">
                    <div class="intro-form-group">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 5px;">
                            <label class="intro-form-label">NEXON OPEN API KEY</label>
                            <span onclick="window.showGuidePopup()" style="font-size:11px; color:#0284C7; font-weight:800; text-decoration:underline; cursor:pointer;">API 발급방법 안내 ↗</span>
                        </div>
                        <input type="text" id="omni_api_key_input" class="intro-form-input" value="${savedApiKey}" placeholder="live_ 또는 test_ 로 시작하는 API키를 입력하세요">
                        <p style="margin:6px 0 0 0; font-size:10.5px; color:#64748b; line-height:1.4; word-break:keep-all;">
                            💡 입력하신 API 키는 외부 서버로 전송되지 않으며, 본인의 브라우저 개인 드라이버 로컬 영역에만 안전하게 보존되어 실시간 인게임 조회 연동에 사용됩니다.
                        </p>
                    </div>
                    <button class="intro-submit-btn" onclick="window.handleOmniApiKeyVerification()">API 키 연동 및 관제 콘솔 진입 ⚡</button>
                </div>
            </div>

            <div class="intro-right">
                <div class="intro-feature-box">
                    <div class="intro-icon-circle">📅</div>
                    <div class="feature-text-node">
                        <h4>인게임 연동 스케줄러</h4>
                        <p>캐릭터별 일일 숙제 진행률과 주간 보스 결정석 수익을 실시간으로 동기화 추적합니다.</p>
                    </div>
                </div>
                <div class="intro-feature-box">
                    <div class="intro-icon-circle">💰</div>
                    <div class="feature-text-node">
                        <h4>MVP 등급 손익 계산기</h4>
                        <p>캐시 및 경매장 수수료 차감 로직을 적용하여 실질 순이익 메소 자산을 완벽 보정합니다.</p>
                    </div>
                </div>
                <div class="intro-feature-box">
                    <div class="intro-icon-circle">⚔️</div>
                    <div class="feature-text-node">
                        <h4>사냥 및 재획 기록부</h4>
                        <p>1소재(30분)부터 1재획(120분) 가변 타이머 연동으로 순수 경험치와 코어 재화를 리포팅합니다.</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="intro-footer-area">
            <div class="intro-footer-links">
                <span>서비스 소개</span>
                <span style="color:#0284C7; font-weight:900;">개인정보처리방침</span>
                <span>이용약관</span>
                <span>게임 IP 사용가이드</span>
                <span>문의하기</span>
            </div>
            <div class="intro-footer-notice">
                Data based on NEXON OPEN API<br>
                This site is not an official site of NEXON and does not provide any warranty.<br>
                v1.4.0 - Copyright 2026. Maple Omni All rights reserved.
            </div>
        </div>
    `;

    // 생성된 인트로 엘리먼트를 화면 최상단 노출을 위해 body 최상위단 자식으로 즉각 인젝션합니다.
    document.body.insertBefore(introLayer, document.body.firstChild);
    console.log("[인트로엔진] 스카이 블루 인증 관문 인프라가 정중앙에 성공적으로 마운트되었습니다.");
};

/**
 * 💡 [초보자 가이드] 사용자가 기입한 토큰 키값을 바탕으로 넥슨 공지사항 API를 찔러 키 유효성을 비동기로 최종 검증합니다.
 */
window.handleOmniApiKeyVerification = async function() {
    const keyField = document.getElementById('omni_api_key_input');
    const apiKeyValue = keyField ? keyField.value.trim() : "";
    
    if(!apiKeyValue) {
        alert("API 키를 입력해 주세요.");
        return;
    }

    try {
        // 실제 인게임 연동 데이터 유효성을 미리 테스트하기 위해 넥슨 오픈 API 엔드포인트를 호출합니다.
        const verifyRes = await fetch("https://open.api.nexon.com/maplestory/v1/notice", {
            headers: { "x-nxopen-api-key": apiKeyValue }
        });
        
        // HTTP 상태코드가 200번대(성공)가 아닐 경우 실패 사유 분기 처리를 이행합니다.
        if (!verifyRes.ok) {
            if (verifyRes.status === 401) throw new Error("입력하신 API 키가 올바르지 않습니다. 다시 확인해 주세요.");
            if (verifyRes.status === 403) throw new Error("API 키 권한 설정이 필요합니다. 넥슨 오픈 API 설정에서 '메이플스토리' 관련 권한(특히 헥사 정보)을 모두 체크해 주세요.");
            throw new Error("서버 응답 오류 (상태코드: " + verifyRes.status + ")");
        }
    
        // 넥슨 인증 성공 시 브라우저 내부 스토리지 영역에 영구 적재합니다.
        localStorage.setItem("omni_api_key", apiKeyValue);
        window.NEXON_API_KEY = apiKeyValue; 
        console.log("[API 미들웨어] 인증키 검증 성공 및 적재 완료.");
        
        const overlay = document.getElementById('omniIntroOverlay');
        if (overlay) {
            overlay.classList.add('fade-out');
            // css 트랜지션 애니메이션 지속 시간인 0.6초 뒤에 DOM 트리에서 완벽히 소멸 처리합니다.
            setTimeout(() => { overlay.remove(); }, 600);
        }

    } catch (err) {
        // 예외 상황(네트워크 끊김, 잘못된 키 규격 등) 발생 시 연동 진입을 강제 전면 차단합니다.
        alert("연동 실패: " + err.message);
        console.error("[인트로엔진] 대시보드 진입 차단됨:", err);
    }
};

/**
 * 💡 [초보자 가이드] API 발급방법 상세 안내 모달 팝업창을 띄워주는 전역 바인딩 인터페이스 기믹입니다.
 */
window.showGuidePopup = function() {
    // 중복 모달 팝업 방지용 안전 조건식
    if (document.querySelector('.omni-modal')) return;

    const modal = document.createElement('div');
    modal.className = 'omni-modal';
    modal.innerHTML = `
        <div class="omni-modal-content" style="border: 1px solid #0284C7;">
            <h3 style="color: #0284C7; margin-top:0;">API 키 발급 안내</h3>
            <p>1. 넥슨 오픈 API 센터 접속<br>2. 로그인 후 프로젝트 생성<br>3. 발급된 키를 복사!</p>
            <button class="omni-modal-btn" onclick="this.parentElement.parentElement.remove()" 
                style="background: transparent; border: 1px solid #0284C7; color: #0284C7; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-weight:700;">확인</button>
        </div>
    `;
    document.body.appendChild(modal);
};

// 브라우저 렌더러 로딩 파이프라인 진행 상태에 맞춰 즉각적인 오버레이 엔진 마운트를 실행합니다.
if (!localStorage.getItem("omni_api_key")) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.injectOmniIntroScreen);
    } else {
        window.injectOmniIntroScreen();
    }
} else {
    console.log("[인트로엔진] 저장된 API 키 확인 완료. 인트로 스킵 및 자동 진입.");
}