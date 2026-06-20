/**
 * 🏠 MAPLE OMNI - portal.js (화면 전환 및 순수 포털 제어 모듈)
 * [초보자용 주석] 이 파일은 메인 포털 화면의 위젯, 슬라이더, 통계 수치 및 페이지 간의
 * 단순 라우팅(화면 전환)만 담당합니다. 복잡한 스캐너 레이아웃 코드는 모두 스캐너 모듈로 이관되었습니다.
 */

// 💾 [초보자용 주석] 캐릭터 검색 시 기록을 저장하고 중복을 방지하는 함수입니다.
window.syncCharacterData = function(charData) {
    if (!charData || !charData.name || charData.name === '테스트캐릭') return;
    
    // 저장소에서 기존 검색 기록을 가져옵니다.
    let history = JSON.parse(localStorage.getItem('maple_recent_chars') || '[]');
    
    // 💡 중복된 캐릭터라면 더 이상 추가하지 않고 순서만 맨 앞으로 정렬합니다.
    history = history.filter(c => c.name !== charData.name);
    
    history.unshift(charData); // 새 캐릭터를 맨 앞에 넣습니다.
    if (history.length > 5) history.pop(); // 5개가 넘어가면 가장 오래된 것을 지웁니다.
    localStorage.setItem('maple_recent_chars', JSON.stringify(history));
    
    if (typeof renderSidebarHistory === 'function') renderSidebarHistory();
    if (typeof renderRecentSearchesMain === 'function') renderRecentSearchesMain();
};

// 포털 초기화 리스너를 실행하여 기본 대시보드 화면을 렌더링합니다.
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 [OMNI] 포털 렌더링 시작");
    
    // 0. 필수 위젯/콘텐츠 우선 렌더링
    if (typeof renderPortalWidgets === 'function') renderPortalWidgets();
    if (typeof renderPortalContent === 'function') renderPortalContent();

    // 1. 위젯 및 통계 초기화
    updatePortalWidgets();
    setInterval(updatePortalWidgets, 1000);
    setInterval(refreshStats, 2000);
    
    // 2. 사냥기록/이벤트 렌더링
    if (typeof renderPortalEvents === 'function') renderPortalEvents();
    if (typeof window.renderMainRanking === 'function') window.renderMainRanking();
    
    // 3. UI/대시보드 애니메이션
    animateTotalStats();
    
    // 4. 로컬 스토리지 데이터 동기화
    restoreCharConfig();
    if (typeof window.renderSidebarHistory === 'function') window.renderSidebarHistory();
});

// 🔄 [초보자용 주석] 화면 상에 보이는 드랍/메획 통계를 주기적으로 갱신해 줍니다.
function refreshStats() {
    const currentTabIdx = (typeof window.currentIdx !== 'undefined') ? window.currentIdx : 1;
    let d = 0, m = 0, e = 0;
    
    for(let j = 0; j < 5; j++) {
        const mInput = document.getElementById(`m_stat_${j}_${currentTabIdx}`);
        const dInput = document.getElementById(`d_stat_${j}_${currentTabIdx}`);
        m += parseInt(mInput?.value) || 0;
        d += parseInt(dInput?.value) || 0;
    }
    
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        if (cb.checked) {
            const text = (cb.parentElement.textContent || "").trim();
            if (typeof buffs !== 'undefined') {
                const item = buffs.find(b => text.includes(b.name));
                if (item) { d += (item.d || 0); m += (item.m || 0); e += (item.e || 0); }
            }
        }
    });
    window.currentDopingMeso = m;
    window.currentDopingExp = e;
    
    document.querySelectorAll('body *:not(#portalEventGrid):not(#portalEventGrid *)').forEach(el => {
        if (el.children.length === 0) {
            let txt = el.textContent.trim();
            if (txt.includes('드랍 / 메획 :')) el.textContent = `드랍 / 메획 : ${d} / ${m}`;
            else if (txt.match(/^\d+\s*\/\s*\d+$/)) {
                const parentText = el.parentElement ? el.parentElement.textContent : '';
                if (parentText.includes('드랍') || parentText.includes('메획') || el.id.includes('currentStats')) {
                    el.textContent = `${d} / ${m}`;
                }
            }
        }
    });
}

// 2026 OMNI 대시보드 사냥 시간 갱신
window.updateMainDashboard = function() {
    const allRecords = JSON.parse(localStorage.getItem('maple_hunt_records') || '[]');
    const totalHours = allRecords.reduce((sum, rec) => sum + (parseFloat(rec.hour) || 0), 0);
    const hourEl = document.getElementById('omni-total-hour');
    if (hourEl) window.animateTotalStats(totalHours);
};

window.animateTotalStats = function(targetValue) {
    const duration = 1500;
    const element = document.getElementById('omni-total-hour');
    if (!element) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        element.innerText = Math.floor(progress * targetValue).toLocaleString();
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
};

function updatePortalWidgets() {
    const now = new Date();
    const timeElem = document.getElementById('liveTime');
    if (timeElem) timeElem.innerText = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0') + ":" + now.getSeconds().toString().padStart(2, '0');

    const eventEndDate = new Date('2026-06-17T23:59:59'); 
    const eventStartDate = new Date('2026-04-01T00:00:00');
    const diffTime = eventEndDate - now;
    const dDayDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const totalDuration = eventEndDate - eventStartDate;
    const elapsed = now - eventStartDate;
    let progress = (elapsed / totalDuration) * 100;
    progress = Math.min(Math.max(progress, 0), 100);

    const dDayElem = document.getElementById('event-dday');
    const progressElem = document.getElementById('event-progress');
    if (dDayElem) dDayElem.innerText = dDayDiff > 0 ? `D-${dDayDiff.toString().padStart(2, '0')}` : (dDayDiff === 0 ? "D-Day" : "종료");
    if (progressElem) progressElem.style.width = progress + '%';

    const resetWidgets = document.querySelectorAll('.mini-widget:nth-child(2) div[style*="font-size: 20px"]');
    if (resetWidgets.length >= 2) {
        let nextReset = new Date();
        nextReset.setDate(now.getDate() + (4 + 7 - now.getDay()) % 7);
        nextReset.setHours(0, 0, 0, 0);
        if (now >= nextReset) nextReset.setDate(nextReset.setDate() + 7);
        const resetDiff = nextReset - now;
        const days = Math.floor(resetDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((resetDiff / (1000 * 60 * 60)) % 24);
        resetWidgets[0].innerHTML = `${days.toString().padStart(2, '0')}<span style="font-size: 12px; color: #94a3b8; margin-left: 2px;">D</span>`;
        resetWidgets[1].innerHTML = `${hours.toString().padStart(2, '0')}<span style="font-size: 12px; color: #94a3b8; margin-left: 2px;">H</span>`;
    }
}

window.renderPortalEvents = function() {
    const eventContainer = document.getElementById('portalEventGrid');
    if (!eventContainer) return;

    const events = [
        { title: "[여름 사전예약] 썸머 카운트다운", date: "2026.05.14 ~ 07.01", img: "icon/event/countdown.png", link: "https://maplestory.nexon.com/News/Event/Ongoing/1301" },
        { title: "메이플 용사 진", date: "2026.05.14 ~ 06.17", img: "icon/event/jin.png", link: "https://maplestory.nexon.com/News/Event/Ongoing/1302" },
        { title: "월드 베스트 펀치킹", date: "2026.05.14 ~ 05.27", img: "icon/event/punchking.png", link: "https://maplestory.nexon.com/News/Event/Ongoing/1303" },
        { title: "메이플 어택! 초능력 윷놀이", date: "2026.05.14 ~ 05.27", img: "icon/event/attack_yoot.png", link: "https://maplestory.nexon.com/News/Event/Ongoing/1304" },
        { title: "리버스 차원의 탑", date: "2026.05.14 ~ 06.17", img: "icon/event/reverse.png", link: "https://maplestory.nexon.com/News/Event/Ongoing/1305" },
        { title: "[이벤트 샵] 메이플포인트샵", date: "2026.05.14 ~ 06.17", img: "icon/event/pointshop.png", link: "https://maplestory.nexon.com/News/Event/Ongoing/1306" },
        { title: "프리미엄PC방 접속보상", date: "2026.05.15 ~ 06.18", img: "icon/event/primium.png", link: "https://maplestory.nexon.com/News/Event/Ongoing/1307" },
        { title: "[사냥] 악몽의 메아리", date: "2026.04.16 ~ 06.17", img: "icon/event/meari.png", link: "https://maplestory.nexon.com/News/Event/Ongoing/1308" },
        { title: "[체인지 버닝] 루시드", date: "2026.03.19 ~ 06.17", img: "icon/event/change.png", link: "https://maplestory.nexon.com/News/Event/Ongoing/1309" },
        { title: "[출석] 마스코트 퍼레이드", date: "2026.03.19 ~ 06.17", img: "icon/event/mas.png", link: "https://maplestory.nexon.com/News/Event/Ongoing/1310" },
        { title: "[체인지 버닝] 루시드 드림", date: "2026.03.19 ~ 06.17", img: "icon/event/deram.png", link: "https://maplestory.nexon.com/News/Event/Ongoing/1311" },
        { title: "몽환의 장비 & 결정", date: "2026.03.19 ~ 06.17", img: "icon/event/monhwan_1.png", link: "https://maplestory.nexon.com/News/Event/Ongoing/1312" },
        { title: "[체인지 버닝] 악몽의 숲", date: "2026.03.19 ~ 06.17", img: "icon/event/monhwan_2.png", link: "https://maplestory.nexon.com/News/Event/Ongoing/1313" },
        { title: "[체인지 버닝] 몽환의 시련", date: "2026.03.19 ~ 06.17", img: "icon/event/monhwan_3.png", link: "https://maplestory.nexon.com/News/Event/Ongoing/1314" },
        { title: "[체인지 버닝] 드림 샤드샵", date: "2026.03.19 ~ 06.17", img: "icon/event/dreamsa.png", link: "https://maplestory.nexon.com/News/Event/Ongoing/1315" },
        { title: "[이벤트 스킬] 메이플 스위츠", date: "2026.03.19 ~ 06.17", img: "icon/event/switch.png", link: "https://maplestory.nexon.com/News/Event/Ongoing/1316" },
        { title: "[이벤트 샵] 기프트 티켓 상점", date: "2026.03.19 ~ 06.17", img: "icon/event/giftshop.png", link: "https://maplestory.nexon.com/News/Event/Ongoing/1317" },
        { title: "하이퍼 버닝 부스터", date: "2026.03.19 ~ 06.17", img: "icon/event/hyper.png", link: "https://maplestory.nexon.com/News/Event/Ongoing/1318" },
        { title: "하이퍼 버닝 MAX", date: "2025.12.18 ~ 06.17", img: "icon/event/hypermax.jpg", link: "https://maplestory.nexon.com/News/Event/Ongoing/1319" },
        { title: "버닝 BEYOND", date: "2025.12.18 ~ 06.17", img: "icon/event/beyond.jpg", link: "https://maplestory.nexon.com/News/Event/Ongoing/1320" },
        { title: "VIP 사우나", date: "2025.12.18 ~ 06.17", img: "icon/event/vip.png", link: "https://maplestory.nexon.com/News/Event/Ongoing/1321" }
    ];

    const itemsPerPage = 6;
    const totalPages = Math.ceil(events.length / itemsPerPage);
    eventContainer.innerHTML = '';
    
    events.forEach((ev) => {
        const card = document.createElement('a');
        card.href = ev.link;
        card.target = "_blank";
        card.className = "event-card-item";
        card.innerHTML = `
            <div class="event-thumbnail">
                <img src="${ev.img}" alt="${ev.title}" onerror="this.style.display='none'; this.parentElement.style.background='#eee';">
            </div>
            <div class="event-text-area">
                <div class="event-title">${ev.title}</div>
                <div class="event-date">${ev.date}</div>
            </div>`;
        eventContainer.appendChild(card);
    });

    let dotContainer = document.getElementById('event-dots');
    if (!dotContainer) {
        dotContainer = document.createElement('div');
        dotContainer.id = 'event-dots';
        dotContainer.style = "text-align:center; display:flex; justify-content:center; gap:8px; margin-top:10px;";
        eventContainer.parentNode.insertBefore(dotContainer, eventContainer.nextSibling);
    }
    let curPage = 0;
    const showPage = (p) => {
        curPage = p;
        document.querySelectorAll('.event-card-item').forEach((c, i) => {
            c.style.display = (Math.floor(i / itemsPerPage) === p) ? 'flex' : 'none';
        });
        dotContainer.innerHTML = Array.from({length: totalPages}, (_, i) => 
            `<span style="cursor:pointer; height:8px; width:8px; border-radius:50%; background:${i===p?'#3b82f6':'#cbd5e1'}"></span>`
        ).join('');
    };
    const startSlider = () => {
        if (window.eventSliderTimer) clearInterval(window.eventSliderTimer);
        window.eventSliderTimer = setInterval(() => {
            curPage = (curPage + 1) % totalPages;
            showPage(curPage);
        }, 3000);
    };
    eventContainer.onmouseenter = () => clearInterval(window.eventSliderTimer);
    eventContainer.onmouseleave = () => startSlider();
    startSlider();
    dotContainer.onclick = (e) => {
        const dots = Array.from(dotContainer.children);
        const idx = dots.indexOf(e.target);
        if(idx !== -1) showPage(idx);
    };
    showPage(0);

    const noticeContainer = document.getElementById('portalNoticeContainer');
    if (noticeContainer) {
        const notices = [
            {t: "Notice", txt: "Tver.1.2.200 우수테스터 발표 안내"},
            {t: "Check", txt: "잠재능력 재설정 시 동일 옵션 오류 복구"},
            {t: "Notice", txt: "클라이언트 패치 내역 (ver 1.2.390)"},
            {t: "Notice", txt: "6월 메이플스토리 테스트 월드 운영"},
            {t: "Check", txt: "일부 퀘스트 진행 불가 현상 수정"}
        ];
        noticeContainer.innerHTML = notices.map(n => `
            <a href="#" class="rank-item" style="display:block; padding:6px 0; text-decoration:none;">
                <span><span class="${n.t==='Notice'?'badge-notice':'badge-check'}">${n.t}</span> ${n.txt}</span>
            </a>
        `).join('');
    }
};

window.renderPortalWidgets = function() {
    const container = document.getElementById('portalWidgetsContainer');
    if (!container) return;
    container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 24px;">
        <div class="diary-card mini-widget">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="font-weight: 800; color: var(--point-orange); font-size: 11px; letter-spacing: 1px;">EVENT TRACKER</div>
                <div id="event-dday" style="font-size: 11px; color: #f87b8d; font-weight: 800; background: #fff1f2; padding: 2px 6px; border-radius: 4px;">D-00</div>
            </div>
            <div style="font-weight: 600; font-size: 14px; color: var(--text-main); margin: 2px 0;">🎉 메이플 어택! <span style="color: #ff99cc;">마스코트 퍼레이드</span></div>
            <div class="progress-container"><div id="event-progress" class="progress-bar" style="width: 0%; background: var(--point-orange);"></div></div>
        </div>
        <div class="diary-card mini-widget">
            <div style="font-weight: 900; color: var(--point-blue); font-size: 11px; letter-spacing: 1px;">WEEKLY RESET</div>
            <div style="display: flex; align-items: baseline; gap: 8px; margin-top: 2px;">
                <div style="font-size: 20px; font-weight: 900; color: #1e293b;">04<span style="font-size: 12px; color: #94a3b8; margin-left: 2px;">D</span></div>
                <div style="font-size: 20px; font-weight: 900; color: #1e293b;">18<span style="font-size: 12px; color: #94a3b8; margin-left: 2px;">H</span></div>
                <div style="font-size: 11px; color: #f87b8d; font-weight: 700; margin-left: auto;">목요일 오전 0시 초기화</div>
            </div>
        </div>
        <div class="diary-card mini-widget">
            <div style="font-weight: 900; color: var(--point-blue); font-size: 11px; letter-spacing: 1px;">OMNI LIVE STATS</div>
            <div style="margin-top: 4px; display:flex; justify-content:space-between; align-items: baseline;">
                <span style="font-weight: 700; color: var(--text-sub); font-size: 13px;">전체 사냥 시간</span>
                <b style="font-weight: 900; color: var(--text-main); font-size: 18px;">
                    <span id="omni-total-hour">0</span> <span style="font-size: 14px; font-weight: 800;">시간</span>
                </b>
            </div>
            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 9px; color: #cbd5e1; font-weight: 600;">ACTIVE USERS ONLY</span>
                <span style="font-size: 9px; color: #f87b8d; font-weight: 800; display: flex; align-items: center; gap: 3px;"><span class="dot-blink" style="color: #ff4d4d;">●</span> LIVE</span>
            </div>
        </div>
    </div>`;
};

window.renderPortalContent = function() {
    const container = document.getElementById('portalMainContentContainer');
    if (!container) return;
    container.innerHTML = `
    <div style="display: grid; grid-template-columns: 1.8fr 1fr; gap: 24px; align-items: stretch;">
        <div style="display: flex; flex-direction: column; gap: 24px; min-height: 0; height: 100%;">
            <div class="diary-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h4 style="font-size: 16px; margin: 0; font-weight: 900; color: var(--text-main);">🎉 진행 중인 이벤트</h4>
                    <span style="font-size: 11px; color: var(--point-blue); cursor: pointer; font-weight: 800;" onclick="window.open('https://maplestory.nexon.com/News/Event')">전체보기 ➔</span>
                </div>
                <div id="portalEventGrid" class="event-grid"></div>
            </div>
            <div class="diary-card" style="display: flex; flex-direction: column; flex: 1; min-height: 300px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h4 style="font-size: 16px; margin: 0; font-weight: 900; color: var(--text-main);">📢 최신 공지사항</h4>
                    <span style="font-size: 11px; color: var(--point-blue); cursor: pointer; font-weight: 800;" onclick="window.open('https://maplestory.nexon.com/News/Notice')">전체보기 ➔</span>
                </div>
                <div class="scroll-content" style="flex: 1; overflow-y: auto; padding-right: 5px;">
                    <a href="https://maplestory.nexon.com/News/Notice/All/149185" class="rank-item" target="_blank"><span><span class="badge-notice">Notice</span>5/28(목) 넥슨 정기점검 안내</span></a>
                    <a href="https://maplestory.nexon.com/News/Notice/All/149151" class="rank-item" target="_blank"><span><span class="badge-check">Check</span>(수정)(연장)[점검완료] 5/20(수) 메이플 옥션 서버점검 (11:00~11:25)</span></a>
                    <a href="https://maplestory.nexon.com/News/Notice/All/149142" class="rank-item" target="_blank"><span><span class="badge-notice">Notice</span>5/21(목) 넥슨 정기점검 안내</span></a>
                    <a href="https://maplestory.nexon.com/News/Notice/Notice/149134" class="rank-item" target="_blank"><span><span class="badge-notice">Notice</span>(수정) 넥슨 X 네이버 이벤트 진행 안내</span></a>
                    <a href="https://maplestory.nexon.com/News/Notice/Notice/149120" class="rank-item" target="_blank"><span><span class="badge-notice">Notice</span>(완료) 5/14(목) 메이플 어택! 초능력 윷놀이 이벤트 임시 제한 안내</span></a>
                    <a href="https://maplestory.nexon.com/News/Notice/Notice/149101" class="rank-item" target="_blank"><span><span class="badge-check">Check</span>5/14(목) 넥슨 정기점검 안내</span></a>
                    <a href="https://maplestory.nexon.com/News/Notice/Notice/149092" class="rank-item" target="_blank"><span><span class="badge-check">Check</span>5/11(월) 버그악용/불법프로그램 신고 보상 지급 안내</span></a>
                </div>
            </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 24px;">
            <div class="diary-card">
                <h4 style="font-size: 16px; margin: 0 0 15px 0; font-weight: 900; color: var(--text-main);">✨ OMNI 업데이트</h4>
                <div class="scroll-content" style="max-height: 180px;">
                    <div class="rank-item"><span><span class="badge-update">V13.6</span> 메인 테마 개편 및 사냥 기록 UI 최적화</span></div>
                    <div class="rank-item"><span><span class="badge-update">Update</span> 스캐너 & 빌더 직작 시뮬레이터 기능</span></div>
                </div>
            </div>
            <div class="diary-card" style="display: flex; flex-direction: column; flex: 1;">
                <h4 style="font-size: 16px; margin: 0 0 15px 0; font-weight: 900; color: var(--text-main);">🏆 종합 랭킹 TOP 10</h4>
                <div class="scroll-content" id="rankingList" style="max-height: 500px;">
                    <div style="padding:20px; font-size:12px; color:var(--text-sub); text-align:center;">데이터를 불러오는 중...</div>
                </div>
            </div>
        </div>
    </div>`;
    
    document.dispatchEvent(new CustomEvent('portal-rendered'));
};

window.omniSwitchPage = function(targetId, updateHistory = true) {
    const allSections = ['mainPortal', 'searchPageContent', 'omniScannerSection', 'omniBuilderSection', 'appContent', 'bossPageContent', 'mvpCalcSection'];
    
    allSections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.setProperty('display', 'none', 'important');
    });

    const target = document.getElementById(targetId);
    if (target) {
        const displayType = (targetId === 'appContent') ? 'flex' : 'block';
        target.style.setProperty('display', displayType, 'important');
    }

    if (updateHistory) {
        window.history.pushState({ page: targetId }, "", "#" + targetId);
    }
    sessionStorage.setItem('omni_current_page', targetId);
    window.scrollTo(0, 0);
};

// 💡 [구조 통합 개편] 옴니 스캐너 진입 버튼 제어 함수
window.openOmniScanner = function() {
    console.log("🔍 스캐너 버튼 클릭 감지됨!");
    
    // 1. 레이아웃 페이지 전환 수행
    window.omniSwitchPage('omniScannerSection', true);
    
    // 2. 통합 이관된 UI 생성기 작동 (index.html에서 분리된 레이아웃 복원)
    if (typeof window.buildScannerBaseLayout === 'function') {
        window.buildScannerBaseLayout();
    }
    
    // 3. 코어 로직 엔진 구동 및 내 데이터 로드 처리
    if (typeof window.executeOmniScannerCore === 'function') {
         window.executeOmniScannerCore(); 
    } else {
         console.error("❌ executeOmniScannerCore 함수를 찾을 수 없습니다. 핵심 스크립트 파일 상태를 확인하세요.");
    }
};

window.backToPortal = function() {
    window.omniSwitchPage('mainPortal', true);
};