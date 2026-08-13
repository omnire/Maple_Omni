/**
 * ============================================================================
 * 📑 MAPLE OMNI V15 - dashboard/widgets.js [SMOOTH REFINED ENGINE]
 * 설명: 메인 대시보드 화면 전체 카드(스케줄러, 일정관리, 랭킹, 사냥통계, 자산요약, 결정석정산, 이벤트 슬라이더, 메모장, 소식, 육성계획서) 총괄 엔진입니다.
 * 초보자 가이드:
 *   - 엑박 방지 기본 SVG 아바타를 적용하여 이미지가 깨지는 현상을 100% 방지했습니다.
 *   - 하단 3개 요약 카드의 레이아웃을 동일한 3단 높이 구조로 깔끔하게 정리했습니다.
 * ============================================================================
 */

// 🛡️ [이미지 엑박 방지용 안전 디폴트 SVG 데이터 URI]
const OMNI_DEFAULT_AVATAR_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='32' fill='%238372d6'/%3E%3Ccircle cx='32' cy='24' r='12' fill='%23ffffff'/%3E%3Cpath d='M12 52c0-11 9-20 20-20s20 9 20 20' fill='%23ffffff'/%3E%3C/svg%3E";

/**
 * 🏆 [넥슨 OpenAPI TOP 10 랭킹 파싱 및 출력]
 */
window.fetchAndRenderMapleTop10 = async function() {
    const container = document.getElementById("omniTop10Container");
    if (!container) return;

    const apiKey = localStorage.getItem("nexon_api_key") || localStorage.getItem("omni_api_key") || "";
    if (!apiKey) {
        container.innerHTML = `<div style="font-size: 11px; color: var(--omni-text-muted); text-align: center; padding: 15px 0;">⚠️ 넥슨 API 키가 등록되지 않았습니다.</div>`;
        return;
    }

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 1);
    const dateString = targetDate.toISOString().slice(0, 10);

    try {
        const response = await fetch(`https://open.api.nexon.com/maplestory/v1/ranking/overall?date=${dateString}`, {
            method: "GET",
            headers: { "accept": "application/json", "x-nxopen-api-key": apiKey }
        });

        if (!response.ok) throw new Error(`API 호출 실패 (코드: ${response.status})`);

        const resultData = await response.json();
        const top10List = resultData.ranking ? resultData.ranking.slice(0, 10) : [];

        if (top10List.length === 0) {
            container.innerHTML = `<div style="font-size: 11px; color: var(--omni-text-muted); text-align: center; padding: 15px 0;">랭킹 데이터가 존재하지 않습니다.</div>`;
            return;
        }

        let top10RowsHtml = "";
        top10List.forEach(user => {
            top10RowsHtml += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; background: var(--omni-card-bg); border-radius: 6px; border: 1px dashed var(--omni-card-border-line); font-size: 11px; font-weight: 700;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="color: var(--omni-slate-primary); font-weight: 900; width: 16px; text-align: center;">${user.ranking}</span>
                        <span style="color: var(--omni-text-dark); font-weight: 800;">${user.character_name}</span>
                        <span style="font-size: 9.5px; color: var(--omni-text-sub); font-weight: 600;">(${user.world_name})</span>
                    </div>
                    <div style="display: flex; gap: 8px; color: var(--omni-text-sub);">
                        <span>${user.class_name}</span>
                        <span style="color: var(--omni-slate-primary); font-weight: 800;">Lv.${user.character_level}</span>
                    </div>
                </div>
            `;
        });
        container.innerHTML = top10RowsHtml;
    } catch (err) {
        console.error("랭킹 API 연동 오류:", err);
        container.innerHTML = `<div style="font-size: 11px; color: var(--omni-coral, #dc2626); text-align: center; padding: 15px 0;">랭킹 데이터 로드 실패</div>`;
    }
};

/**
 * 📸 [이벤트 배너 슬라이더 작동 제어]
 */
function initEventSlider() {
    const track = document.getElementById('eventTrack'); 
    const slider = document.getElementById('eventSlider'); 
    const dotsContainer = document.getElementById('eventSliderDots');
    if (!track || !slider || !dotsContainer) return;
    
    let currentIndex = 0; 
    const totalItems = track.children.length; 
    if (totalItems === 0) return;

    const maxIndex = Math.max(0, totalItems - 3);
    
    dotsContainer.innerHTML = '';
    for (let i = 0; i <= maxIndex; i++) {
        const dot = document.createElement('span');
        dot.className = `event-dot ${i === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => {
            goToSlide(i);
        });
        dotsContainer.appendChild(dot);
    }

    const dots = dotsContainer.querySelectorAll('.event-dot');

    function goToSlide(n) {
        currentIndex = n;
        track.style.transform = `translateX(-${currentIndex * 33.3333}%)`;
        dots.forEach((dot, idx) => {
            if (idx === currentIndex) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    }

    function autoSlide() { 
        if (maxIndex > 0) {
            currentIndex = (currentIndex + 1) % (maxIndex + 1); 
            goToSlide(currentIndex);
        }
    }
    
    let slideInterval = setInterval(autoSlide, 3000); 
    
    slider.addEventListener('mouseenter', () => { clearInterval(slideInterval); }); 
    slider.addEventListener('mouseleave', () => {
        clearInterval(slideInterval);
        slideInterval = setInterval(autoSlide, 3000);
    });
}

/**
 * ⏳ [실시간 이벤트 카운트다운 타이머]
 */
window.startDailyResetTimer = function() {
    function updateResetTimer() {
        const now = new Date();
        const activeEvents = window.OMNI_ACTIVE_EVENTS || [];
        const targetEvent = activeEvents.length > 0 ? activeEvents[0] : { title: "챌린저스 월드 시즌4 오픈 레이스", end: "2026-09-16" };
        
        const eventEndDate = new Date(targetEvent.end + "T23:59:59");
        const diff = eventEndDate - now;

        const timerEl = document.getElementById('dailyResetTimer');
        if (timerEl) {
            if (diff <= 0) {
                timerEl.innerText = "이벤트 종료";
            } else {
                const d = Math.floor(diff / 86400000);
                const h = Math.floor((diff % 86400000) / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                timerEl.innerText = `${d}일 ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            }
        }
    }
    if (window.timerInterval) clearInterval(window.timerInterval); 
    window.timerInterval = setInterval(updateResetTimer, 1000); 
    updateResetTimer();
};

/**
 * 🌐 [글로벌 하단 풋터 렌더링]
 */
window.renderGlobalFooter = function() {
    const existingFooter = document.getElementById('omniGlobalFooter'); if (existingFooter) existingFooter.remove();
    const footer = document.createElement('footer'); footer.id = 'omniGlobalFooter'; footer.className = 'omni-global-footer-panel';
    footer.innerHTML = `<div class="footer-links-row"><a href="#">이용약관</a> | <a href="#">개인정보처리방침</a></div><div class="footer-copyright-txt">© 2026 MAPLE OMNI V15. ALL RIGHTS RESERVED.</div>`;
    document.body.appendChild(footer);
};

/**
 * 🖥️ [대시보드 메인 위젯 전체 렌더링 Hub]
 */
window.renderDashboardMainWidgets = function() {
    const container = document.getElementById('dashboardWidgets');
    if (!container) return;

    container.style.opacity = '0';

    try {
        const activeTheme = localStorage.getItem("omni_theme_status") || "light";
        const safeAvatar = window.DASHBOARD_SAFE_AVATAR || OMNI_DEFAULT_AVATAR_SVG;

        const savedCharsRaw = localStorage.getItem("omni_v14_todo_characters_list");
        const savedChecksRaw = localStorage.getItem("omni_v14_todo_perfect_storage");
        const todoCharacters = savedCharsRaw ? JSON.parse(savedCharsRaw) : [];
        const todoCheckData = savedChecksRaw ? JSON.parse(savedChecksRaw) : {};

        // 💡 [초보자 가이드] API 숙제 완수 여부 검증 공통 헬퍼 함수 (중복 선언 오류 원천 제거)
        const checkApiContentDone = (rawHw, contentName) => {
            if (!rawHw) return false;
            const allContents = [...(rawHw.daily_contents || []), ...(rawHw.weekly_contents || []), ...(rawHw.boss_contents || [])];
            const found = allContents.find(item => {
                const name = item.content_name || item.contents_name || item.quest_name || item.boss_name || item.name || "";
                return name.toLowerCase().includes(contentName.toLowerCase());
            });
            if (!found) return false;
            if (typeof window.isOmniContentCleared === 'function') {
                return window.isOmniContentCleared(found);
            }
            const isEpic = (found.content_name || found.quest_name || "").includes("에픽 던전");
            if (isEpic) return typeof found.now_count === "number" && found.now_count > 0;
            return (
                found.clear_yn === "Y" || found.clear_yn === "y" || found.clear_yn === true ||
                found.quest_state === "2" || found.quest_state === 2 ||
                found.complete_flag === true || String(found.complete_flag).toLowerCase() === "true" ||
                found.clear_status === true || found.clear_status === "clear" ||
                found.is_clear === true || String(found.is_clear).toLowerCase() === "true" ||
                (typeof found.now_count === "number" && typeof found.max_count === "number" && found.max_count > 0 && found.now_count >= found.max_count)
            );
        };

        // ---------------------------------------------------------------------
        // 1. [1행 상단 스케줄러 슬롯 4개 HTML 생성]
        // ---------------------------------------------------------------------
        let dailyResetHtml = "";
        const totalSlotsToRender = 4;
        
        for (let i = 0; i < totalSlotsToRender; i++) {
            if (i < todoCharacters.length) {
                const char = todoCharacters[i];
                
                const matchedKey = Object.keys(todoCheckData).find(k => 
                    k.toLowerCase() === (char.name || "").toLowerCase() || 
                    k.toLowerCase() === (char.id || "").toLowerCase()
                );
                const data = (matchedKey ? todoCheckData[matchedKey] : null) || todoCheckData[char.name] || todoCheckData[char.id] || {};
                
                let cachedCharObj = {};
                let rawHomework = null;
                let charWorld = char.world || char.world_name || char.server || "";
                let charExpRate = 0;
                try {
                    const rawCache15 = localStorage.getItem(`omni_v15_cached_char_${char.name}`);
                    const rawCache14 = localStorage.getItem(`omni_v14_cached_char_${char.name}`) || localStorage.getItem('omni_last_active_search_data');
                    const targetRaw = rawCache15 || rawCache14;
                    
                    if (targetRaw) {
                        const parsed = JSON.parse(targetRaw);
                        cachedCharObj = parsed.symbol || parsed.symbol_equipment || parsed.symbols || parsed.symbol_list || parsed;
                        rawHomework = parsed.homework || null;
                        charWorld = parsed.world_name || parsed.basic?.world_name || parsed.character_world_name || parsed.world || "";
                        
                        // 1차: 객체 속성 경로 직접 탐색
                        const expVal = parsed.character_exp_rate || parsed.basic?.character_exp_rate || parsed.exp_rate || parsed.data?.character_exp_rate || 0;
                        charExpRate = parseFloat(expVal) || 0;

                        // 2차: 객체 경로에서 못 찾았을 경우 캐시 문자열 내 정규식으로 직접 추출
                        if (!charExpRate && targetRaw.includes("character_exp_rate")) {
                            const matchExp = targetRaw.match(/"character_exp_rate"\s*:\s*["']?([0-9.]+)["']?/);
                            if (matchExp && matchExp[1]) {
                                charExpRate = parseFloat(matchExp[1]) || 0;
                            }
                        }
                    }

                    // 캐시에서 못 찾았을 경우 전체 로컬 스토리지 및 현재 검색 데이터 탐색
                    if (!charWorld || !charExpRate) {
                        for (let k = 0; k < localStorage.length; k++) {
                            const storageKey = localStorage.key(k);
                            if (storageKey && storageKey.toLowerCase().includes(char.name.toLowerCase())) {
                                const val = localStorage.getItem(storageKey);
                                if (val) {
                                    if (!charWorld && val.includes("world_name")) {
                                        const parsedVal = JSON.parse(val);
                                        charWorld = parsedVal.world_name || parsedVal.basic?.world_name || "";
                                    }
                                    if (!charExpRate && val.includes("character_exp_rate")) {
                                        const matchExp = val.match(/"character_exp_rate"\s*:\s*["']?([0-9.]+)["']?/);
                                        if (matchExp && matchExp[1]) {
                                            charExpRate = parseFloat(matchExp[1]) || 0;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (!charExpRate && window.currentSearchData) {
                        const curBasic = window.currentSearchData.basic || window.currentSearchData;
                        if (curBasic.character_name?.toLowerCase() === char.name.toLowerCase() || window.currentSearchData.character_name?.toLowerCase() === char.name.toLowerCase()) {
                            charExpRate = parseFloat(curBasic.character_exp_rate || window.currentSearchData.character_exp_rate || 0) || 0;
                        }
                    }
                } catch (e) {}

                if (!charWorld) {
                    charWorld = "서버미등록";
                } else if (!char.world || char.world !== charWorld) {
                    // 확인된 서버명을 캐릭터 데이터에 영구 동기화
                    char.world = charWorld;
                    localStorage.setItem("omni_v14_todo_characters_list", JSON.stringify(todoCharacters));
                }

                let formattedExpRate = charExpRate > 0 ? charExpRate.toFixed(2) : "0.00";

                const allSymbolQuests = [
                    { key: 'daily_arcane_yoru', name: '여로', maxLv: 20, matchNames: ['여로', 'Vanishing Vale', '소멸의 여로'] },
                    { key: 'daily_arcane_chuchu', name: '츄츄', maxLv: 20, matchNames: ['츄츄', 'Chu Chu', '츄츄섬'] },
                    { key: 'daily_arcane_lachelein', name: '레헬른', maxLv: 20, matchNames: ['레헬른', 'Lachelein'] },
                    { key: 'daily_arcane_arcana', name: '아르카나', maxLv: 20, matchNames: ['아르카나', 'Arcana'] },
                    { key: 'daily_arcane_moras', name: '모라스', maxLv: 20, matchNames: ['모라스', 'Moras'] },
                    { key: 'daily_arcane_esfera', name: '에스페라', maxLv: 20, matchNames: ['에스페라', 'Esfera'] },
                    { key: 'daily_cernium', name: '세르니움', maxLv: 11, matchNames: ['세르니움', 'Cernium'] },
                    { key: 'daily_arcus', name: '아르크스', maxLv: 11, matchNames: ['아르크스', 'Arcus'] },
                    { key: 'daily_odium', name: '오디움', maxLv: 11, matchNames: ['오디움', 'Odium'] },
                    { key: 'daily_shangrila', name: '도원경', maxLv: 11, matchNames: ['도원경', 'Shangri-La'] },
                    { key: 'daily_arteria', name: '아르테리아', maxLv: 11, matchNames: ['아르테리아', 'Arteria'] },
                    { key: 'daily_carcion', name: '카르시온', maxLv: 11, matchNames: ['카르시온', 'Carcion'] },
                    { key: 'daily_talhart', name: '탈라하트', maxLv: 11, matchNames: ['탈라하트', 'Talhart'] },
                    { key: 'daily_geardlock', name: '기어드락', maxLv: 11, matchNames: ['기어드락', 'Geardlock'] }
                ];

                let dailyKeys = [];
                let dailyNames = [];

                allSymbolQuests.forEach(q => {
                    const shortName = q.key.replace('daily_', '');
                    let symLevel = Number(data[shortName + '_level'] || data[q.key + '_level'] || data['symbol_' + shortName] || data[shortName] || 0);
                    
                    if (symLevel === 0 && cachedCharObj) {
                        if (Array.isArray(cachedCharObj)) {
                            const found = cachedCharObj.find(s => {
                                const sName = s.symbol_name || s.name || s.title || "";
                                return q.matchNames.some(m => sName.includes(m));
                            });
                            if (found) {
                                symLevel = Number(found.symbol_level || found.level || found.value || 0);
                            }
                        }
                    }

                    const isMaxed = symLevel >= q.maxLv || data[q.key + '_max'] === true || data[q.key + '_max'] === "true";

                    if (!isMaxed) {
                        dailyKeys.push(q.key);
                        dailyNames.push(q.name);
                    }
                });

                if (dailyKeys.length === 0) {
                    dailyKeys = ['daily_cernium', 'daily_arcus', 'daily_odium', 'daily_shangrila', 'daily_arteria', 'daily_carcion', 'daily_talhart', 'daily_geardlock'];
                    dailyNames = ['세르니움', '아르크스', '오디움', '도원경', '아르테리아', '카르시온', '탈라하트', '기어드락'];
                }
                
                let dailyDoneCount = 0;
                dailyKeys.forEach((key, idx) => { 
                    const name = dailyNames[idx];
                    const isManualDone = data[key] === true || data[key] === "true";
                    const isApiDone = checkApiContentDone(rawHomework, name);
                    if (isManualDone || isApiDone) dailyDoneCount++; 
                });

                const bossNameMap = {
                    'boss_c_gaensl': '카오스 가엔슬', 'boss_h_suu': '하드 스우', 'boss_h_demian': '하드 데미안',
                    'boss_h_lucid': '하드 루시드', 'boss_h_will': '하드 윌', 'boss_c_dusk': '카오스 더스크',
                    'boss_h_dunkel': '하드 듄켈', 'boss_h_hilla': '하드 진힐라', 'boss_b_mage': '검은마법사',
                    'boss_h_seren': '하드 세렌', 'boss_n_kalos': '노말 칼로스', 'boss_n_kaling': '노말 칼링',
                    'boss_ex_suu': '익스트림 스우'
                };

                const bossKeys = Object.keys(bossNameMap);
                let bossDoneCount = 0;
                let clearedBossChipsHtml = "";

                bossKeys.forEach(key => { 
                    const bossTitle = bossNameMap[key];
                    const isManualDone = data[key] === true || data[key] === "true";
                    const isApiDone = checkApiContentDone(rawHomework, bossTitle);
                    if (isManualDone || isApiDone) {
                        bossDoneCount++; 
                        if (bossTitle) {
                            clearedBossChipsHtml += `<span style="background: rgba(131, 114, 214, 0.2); color: var(--omni-text-dark); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; border: 1px dashed var(--omni-card-border-line); display: inline-block;">${bossTitle}</span>`;
                        }
                    }
                });

                let dailyQuestListHtml = "";
                dailyKeys.forEach((key, idx) => {
                    const name = dailyNames[idx];
                    const isDone = data[key] === true || data[key] === "true" || checkApiContentDone(rawHomework, name);
                    const doneClass = isDone ? "done" : "todo";
                    dailyQuestListHtml += `<span class="expert-quest-dot-chip ${doneClass}">${name}</span>`;
                });

                let bossPct = Math.min(100, Math.round((bossDoneCount / 13) * 100));
                let bossBarColor = bossDoneCount === 13 ? "#10b981" : "var(--omni-slate-primary)";

                const safeCharImg = (char.image && !char.image.includes("default.png")) ? char.image : OMNI_DEFAULT_AVATAR_SVG;

                dailyResetHtml += `
                    <div class="expert-char-profile-card" draggable="true" ondragstart="window.omniHandleDragStart(event, ${i})" ondragover="window.omniHandleDragOver(event)" ondrop="window.omniHandleDrop(event, ${i})" style="position: relative; cursor: grab;">
                        <button onclick="window.omniDeleteCharacter(${i})" title="캐릭터 삭제" style="position: absolute; top: 8px; right: 8px; background: transparent; border: none; color: var(--omni-text-sub); font-size: 16px; font-weight: bold; cursor: pointer; z-index: 5; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; border-radius: 4px;" onmouseover="this.style.background='rgba(220,38,38,0.1)'; this.style.color='#dc2626';" onmouseout="this.style.background='transparent'; this.style.color='var(--omni-text-sub)';">×</button>
                        <div class="expert-avatar-frame-large" style="overflow: hidden; display: flex; justify-content: center; align-items: center;">
                            <img src="${safeCharImg}" style="width: 100%; height: 100%; object-fit: contain; transform: translateY(0%) scale(2.8);" onerror="this.onerror=null; this.src='${OMNI_DEFAULT_AVATAR_SVG}';">
                        </div>
                        <div class="expert-reset-meta" style="display: flex; flex-direction: column; gap: 4px; align-items: center; width: 100%;">
                            <span class="expert-char-name-txt-large" style="background: var(--omni-point-purple-bg); border: 1px dashed var(--omni-card-border-line); border-radius: 6px; padding: 3px 12px; color: var(--omni-slate-primary); font-weight: 900; font-size: 12px;">${char.name}</span>
                            <span class="expert-char-job-level-txt" style="font-size: 10px; color: var(--omni-text-sub); font-weight: 700;">${char.job} | Lv.${char.level} | ${charWorld}</span>
                            
                            <!-- EXP 경험치 진행률 바 영역 -->
                            <div style="width: 100%; display: flex; flex-direction: column; gap: 2px; margin-top: 2px;">
                                <div style="display: flex; justify-content: space-between; font-size: 9px; font-weight: 700; color: var(--omni-text-sub);">
                                    <span>EXP</span>
                                    <span style="color: var(--omni-slate-primary); font-weight: 800;">${formattedExpRate}%</span>
                                </div>
                                <div style="height: 4px; background: var(--omni-hover-point); border-radius: 2px; overflow: hidden; border: 1px dashed var(--omni-card-border-line);">
                                    <div style="width: ${Math.min(100, Math.max(0, charExpRate))}%; height: 100%; background: var(--omni-slate-primary); border-radius: 2px;"></div>
                                </div>
                            </div>
                        </div>
                        <div class="expert-char-details-box">
                            <div class="expert-detail-label">📋 일일 퀘스트 목록 (${dailyDoneCount}/${dailyKeys.length})</div>
                            <div class="expert-daily-quest-grid">
                                ${dailyQuestListHtml}
                            </div>
                            <div class="expert-detail-label" style="margin-top: 6px; display: flex; justify-content: space-between; align-items: center;">
                                <span>👾 주간 보스 정산</span>
                                <span style="font-size: 9.5px; color: var(--omni-slate-primary); font-weight: 700; opacity: 0.85; white-space: nowrap;">💡 마우스 올려 자세히 보기</span>
                            </div>
                            <div class="omni-boss-tooltip-container" style="position: relative; background: var(--omni-card-bg); border: 1px dashed var(--omni-card-border-line); border-radius: 6px; padding: 6px 8px; display: flex; flex-direction: column; gap: 4px; cursor: pointer;" onmouseenter="this.querySelector('.omni-custom-speech-bubble').style.opacity='1'; this.querySelector('.omni-custom-speech-bubble').style.visibility='visible';" onmouseleave="this.querySelector('.omni-custom-speech-bubble').style.opacity='0'; this.querySelector('.omni-custom-speech-bubble').style.visibility='hidden';">
                                <div class="expert-boss-counter-row">
                                    <span>클리어 현황</span>
                                    <strong style="color: ${bossBarColor};">${bossDoneCount} / 13 마리 (${bossPct}%)</strong>
                                </div>
                                <div style="height: 4px; background: var(--omni-hover-point); border-radius: 2px; overflow: hidden; border: 1px dashed var(--omni-card-border-line);">
                                    <div style="width: ${bossPct}%; height: 100%; background: ${bossBarColor};"></div>
                                </div>
                                <div class="omni-custom-speech-bubble" style="position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); width: 220px; background: var(--builder-card-bg, #181721); color: var(--omni-text-dark); padding: 10px 12px; border-radius: 10px; font-size: 11px; font-weight: 600; box-shadow: 0 8px 25px rgba(0,0,0,0.4); border: 1px solid var(--omni-slate-primary); z-index: 100; opacity: 0; visibility: hidden; transition: all 0.2s ease-in-out; pointer-events: none; text-align: left; line-height: 1.4;">
                                    <div style="font-weight: 900; color: var(--omni-text-dark); font-size: 11.5px; margin-bottom: 6px; border-bottom: 1px dashed var(--omni-card-border-line); padding-bottom: 3px; display: flex; justify-content: space-between;">
                                        <span style="color: var(--omni-text-sub);">⚔️ 격파 완료 보스 리스트</span>
                                        <span style="color: #34d399;">${bossDoneCount}/13</span>
                                    </div>
                                    <div style="display: flex; flex-wrap: wrap; gap: 4px;">${clearedBossChipsHtml.length > 0 ? clearedBossChipsHtml : '<span style="color: var(--omni-text-sub); font-weight: 500;">클리어한 주간 보스가 없습니다.</span>'}</div>
                                    <div style="position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border-width: 6px; border-style: solid; border-color: var(--builder-card-bg, #181721) transparent transparent transparent;"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                dailyResetHtml += `
                    <div class="expert-char-profile-card empty-placeholder-slot">
                        <div class="expert-avatar-frame-large empty-avatar-frame" onclick="window.omniTriggerAddCharacterPopup()">
                            <span class="placeholder-plus-icon">+</span>
                        </div>
                        <div class="expert-reset-meta">
                            <span class="expert-char-name-txt-large placeholder-text">빈 캐릭터 슬롯</span>
                            <span class="expert-char-job-level-txt">지정된 전투원이 없습니다</span>
                        </div>
                        <div class="expert-char-details-box" style="align-items: center; justify-content: center; height: 100%; min-height: 85px;">
                            <button onclick="window.omniTriggerAddCharacterPopup()" class="placeholder-reg-btn">👤 캐릭터 등록하기</button>
                        </div>
                    </div>
                `;
            }
        }

        // ---------------------------------------------------------------------
        // 2. [상단 우측: 일정 관리 전용 컴팩트 스크롤 뷰포트 HTML]
        // ---------------------------------------------------------------------
        const activeEventsList = window.OMNI_ACTIVE_EVENTS || [];
        let eventTrackerRowsHtml = "";
        activeEventsList.forEach(evt => {
            const now = new Date(); 
            const start = new Date(evt.start); 
            const end = new Date(evt.end);
            
            let pct = 0; 
            if (now >= end) {
                pct = 100; 
            } else if (now > start) {
                pct = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
            }

            let scaleColor = pct >= 85 ? "#ef4444" : (pct >= 50 ? "#f59e0b" : "var(--omni-slate-primary)");

            eventTrackerRowsHtml += `
                <div style="background: var(--omni-card-bg); padding: 5px 8px; display: flex; flex-direction: column; gap: 3px; border-bottom: 1px dashed var(--omni-card-border-line); transition: all 0.2s ease;">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                        <span style="font-size: 11px; font-weight: 800; color: var(--omni-text-dark); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 175px;" title="${evt.title}">${evt.title}</span>
                        <span style="font-size: 10.5px; font-weight: 900; color: ${scaleColor};">${pct}%</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                        <div style="height: 4px; background: var(--omni-hover-point); border-radius: 9999px; overflow: hidden;">
                            <div style="width: ${pct}%; height: 100%; background: ${scaleColor}; border-radius: 9999px;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 9px; font-weight: 600; color: var(--omni-text-sub);">
                            <span>${evt.start} ~ ${evt.end}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        let sundayComboHtml = `
            <div class="sunday-integrated-combo-area" style="border-top: 1px dashed var(--omni-card-border-line); padding-top: 8px; margin-top: 4px; display: flex; flex-direction: column; gap: 6px;">
                <div style="font-size: calc(var(--omni-base-font-size) * 0.79); font-weight: 800; display: flex; align-items: center; justify-content: space-between; color: var(--omni-text-dark);">
                    <span>🏆 유저 랭킹 TOP 10</span>
                    <span style="font-size: 9.5px; color: var(--omni-text-sub); font-weight: 600;">실시간 API 연동</span>
                </div>
                <div id="omniTop10Container" style="max-height: 125px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding-right: 2px;">
                    <div style="font-size: 11px; color: var(--omni-text-muted); text-align: center; padding: 15px 0;">랭킹 데이터 불러오는 중...</div>
                </div>
            </div>
        `;

        // ---------------------------------------------------------------------
        // 3. [사냥 통계 데이터 계산 및 엑박 방지 MVP 아바타]
        // ---------------------------------------------------------------------
        let totalHuntingMeso = 0; 
        let totalHuntingExp = 0; 
        let totalHuntingMinutes = 0;
        let characterMesoLeaderboard = {}; 

        const extractMinutesInt = function(timeRaw) {
            if (!timeRaw) return 0; if (typeof timeRaw === 'number') return timeRaw;
            const matched = String(timeRaw).match(/(\d+)/); return matched ? parseInt(matched[1], 10) : 0;
        };

        const accumulateLogData = function(rawString) {
            if (!rawString) return;
            try {
                const parsedArray = JSON.parse(rawString);
                if (Array.isArray(parsedArray)) {
                    parsedArray.forEach(session => {
                        if (!session) return;
                        const mesoGain = Number(session.netProfit || session.mesoProfit || session.mesoGain || session.meso || 0);
                        const expGain = Number(session.expGain || session.exp || 0);
                        
                        totalHuntingMeso += isNaN(mesoGain) ? 0 : mesoGain;
                        totalHuntingExp += isNaN(expGain) ? 0 : expGain;
                        totalHuntingMinutes += extractMinutesInt(session.duration || session.huntingTime || session.time || 0);
                        
                        const charName = session.characterName || session.charName || "공통 계정";
                        characterMesoLeaderboard[charName] = (characterMesoLeaderboard[charName] || 0) + (isNaN(mesoGain) ? 0 : mesoGain);
                    });
                }
            } catch (e) { console.error("사냥 로그 파싱 오류:", e); }
        };

        const keysToTry = ["omni_v14_hunting_integrated_log", "omni_v14_hunting_log", "omni_hunting_integrated_log", "omni_hunting_log"];
        keysToTry.forEach(k => accumulateLogData(localStorage.getItem(k)));

        let formattedTotalTime = `${totalHuntingMinutes}분`;
        if (totalHuntingMinutes >= 60) { formattedTotalTime = `${Math.floor(totalHuntingMinutes / 60)}시간 ${totalHuntingMinutes % 60}분`; }

        let mvpCharacterName = "기록 없음"; 
        let highestEarnedMeso = -1; 
        let mvpAvatarImageSrc = OMNI_DEFAULT_AVATAR_SVG;
        
        for (const [name, totalMeso] of Object.entries(characterMesoLeaderboard)) {
            if (totalMeso > highestEarnedMeso && name !== "공통 계정") { 
                highestEarnedMeso = totalMeso; 
                mvpCharacterName = name; 
            }
        }
        
        if (mvpCharacterName !== "기록 없음") {
            const matchCharObj = todoCharacters.find(c => c.name === mvpCharacterName);
            if (matchCharObj && matchCharObj.image && !matchCharObj.image.includes("default.png")) {
                mvpAvatarImageSrc = matchCharObj.image;
            }
        }

        // ---------------------------------------------------------------------
        // 4. [시뮬레이터 자산 및 주간 결정석 정산 계산]
        // ---------------------------------------------------------------------
        const simState = window.omniSimulatorState || { financeSummary: { totalMeso: 89030475000, totalCash: 6600, totalAppraisal: 2448945500 }, cubeUsageData: [] };
        const simMesoFormatted = window.formatKoreanMoneyValue ? window.formatKoreanMoneyValue(simState.financeSummary.totalMeso) : "890억 3047만 5000";
        const simAppraisalFormatted = window.formatKoreanMoneyValue ? window.formatKoreanMoneyValue(simState.financeSummary.totalAppraisal) : "24억 4894만 5500";
        const totalCubesRolled = simState.cubeUsageData.reduce((acc, curr) => acc + (curr.count || 0), 0) || 8725;

        let totalEstimatedBossStonesMeso = 0;
        let totalEstimatedStonesCount = 0;
        todoCharacters.forEach(char => {
            const data = todoCheckData[char.name] || todoCheckData[char.id] || {};
            
            let rawHomework = null;
            try {
                const rawCache15 = localStorage.getItem(`omni_v15_cached_char_${char.name}`);
                const rawCache14 = localStorage.getItem(`omni_v14_cached_char_${char.name}`) || localStorage.getItem('omni_last_active_search_data');
                const targetRaw = rawCache15 || rawCache14;
                if (targetRaw) {
                    const parsed = JSON.parse(targetRaw);
                    rawHomework = parsed.homework || null;
                }
            } catch (e) {}

            const bossValueMap = {
                'c_gaensl': { val: 234000000, name: '카오스 가엔슬' },
                'h_suu': { val: 324000000, name: '하드 스우' },
                'h_demian': { val: 298000000, name: '하드 데미안' },
                'h_lucid': { val: 365000000, name: '하드 루시드' },
                'h_will': { val: 420000000, name: '하드 윌' },
                'c_dusk': { val: 389000000, name: '카오스 더스크' },
                'h_dunkel': { val: 412000000, name: '하드 듄켈' },
                'h_hilla': { val: 378000000, name: '하드 진힐라' },
                'b_mage': { val: 1000000000, name: '검은마법사' },
                'h_seren': { val: 1200000000, name: '하드 세렌' },
                'n_kalos': { val: 1500000000, name: '노말 칼로스' },
                'n_kaling': { val: 1700000000, name: '노말 칼링' },
                'ex_suu': { val: 2500000000, name: '익스트림 스우' }
            };
            
            Object.entries(bossValueMap).forEach(([bossKey, item]) => {
                const checkedManual = data[`boss_${bossKey}`] === true || data[`boss_${bossKey}`] === "true";
                const checkedApi = checkApiContentDone(rawHomework, item.name);
                if (checkedManual || checkedApi) {
                    totalEstimatedBossStonesMeso += item.val;
                    totalEstimatedStonesCount++;
                }
            });
        });

        const formattedStonesMesoStr = totalEstimatedBossStonesMeso > 0 
            ? (totalEstimatedBossStonesMeso / 100000000).toFixed(2) + "억 메소" 
            : "59.62억 메소";

        // ---------------------------------------------------------------------
        // 5. [인라인 메모장 및 육성 계획서 HTML]
        // ---------------------------------------------------------------------
        const savedMemosRaw = localStorage.getItem("omni_v14_dashboard_memos");
        let memoList = savedMemosRaw ? JSON.parse(savedMemosRaw) : [
            { text: "이번 주 고관비/경축비 도핑 재고 확인하기", date: "07.09" },
            { text: "부캐 아케인리버 일퀘 및 몬스터파크 7판 완료하기", date: "07.12" },
            { text: "유니온 아티팩트 주간 미션 포인트 정산 및 수령하기", date: "07.15" }
        ];
        let memoRowsHtml = "";
        memoList.forEach((memo, index) => {
            memoRowsHtml += `
                <div class="dashboard-memo-item-row">
                    <div class="memo-left-content"><span class="pulse-purple-dot"></span><p class="memo-main-text-line">${memo.text}</p></div>
                    <div class="memo-right-actions"><span class="memo-date-badge">${memo.date}</span><button onclick="window.deleteDashboardInlineMemo(${index})" class="memo-inline-del-btn">×</button></div>
                </div>
            `;
        });

        const savedPlansRaw = localStorage.getItem("omni_v14_strategy_plans");
        let planList = savedPlansRaw ? JSON.parse(savedPlansRaw) : [{ char: "전체 계정 공통", goal: "여름 쇼케이스 코인 비축", route: "본캐 보스 순회 주간 정산 완료" }];
        const activePlannerFilter = window.omniPlannerFilter || "전체";
        let planCardsHtml = "";
        planList.forEach((plan, index) => {
            if (activePlannerFilter === "전체" || plan.char === activePlannerFilter) {
                planCardsHtml += `
                    <div class="strategy-plan-card-item">
                        <div class="plan-card-top-bar"><span class="plan-char-target-tag">🎯 ${plan.char}</span><button onclick="window.deleteStrategyPlan(${index})" class="plan-card-del-btn">삭제</button></div>
                        <h5 class="plan-card-goal-title">${plan.goal}</h5><p class="plan-card-route-desc">${plan.route}</p>
                    </div>
                `;
            }
        });

        let plannerFilterDropdownHtml = `<option value="전체" ${activePlannerFilter === "전체" ? "selected" : ""}>🔍 전체 캐릭터 계획</option>`;
        plannerFilterDropdownHtml += `<option value="전체 계정 공통" ${activePlannerFilter === "전체 계정 공통" ? "selected" : ""}>🌐 전체 계정 공통</option>`;
        todoCharacters.forEach(c => { plannerFilterDropdownHtml += `<option value="${c.name}" ${activePlannerFilter === c.name ? "selected" : ""}>👤 ${c.name}</option>`; });

        // ---------------------------------------------------------------------
        // 6. [대시보드 메인 위젯 보드 전체 구조 출력 바인딩]
        // ---------------------------------------------------------------------
        container.innerHTML = `
            <!-- [1행] 메인 위젯 그리드 (스케줄러, 일정관리, 사냥기록, 시뮬자산, 결정석정산) -->
            <div class="widget-grid-layout">
                <div class="omni-dashboard-widget-card" style="grid-column: span 9;">
                    <div class="wdg-hdr">⏰ 스케쥴러 캐릭터 모아보기 (GRID VIEW)</div>
                    <div class="daily-reset-scroll-viewport">${dailyResetHtml}</div>
                </div>

                <div class="omni-dashboard-widget-card" style="grid-column: span 3; justify-content: flex-start; gap: 8px;">
                    <div class="wdg-hdr">
                        <span>📅 메이플 일정 관리</span>
                        <span style="display: flex; align-items: center; gap: 4px; background: var(--omni-card-bg); padding: 2px 8px; border-radius: 6px; border: 1px dashed var(--omni-card-border-line); font-size: 11px; font-weight: 800; color: var(--omni-slate-primary);">
                            <span>⏳</span><span id="dailyResetTimer" style="font-family: monospace;">00:00:00</span>
                        </span>
                    </div>
                    <div class="omni-event-tracker-scroll-viewport" style="flex: 1; max-height: none;">${eventTrackerRowsHtml}</div>
                    ${sundayComboHtml}
                </div>

                <!-- [하단 3개 카드 - 규격화된 대칭 3단 레이아웃] -->
                <div class="omni-dashboard-widget-card" style="grid-column: span 4;">
                    <div class="wdg-hdr">📊 사냥 기록 스테이터스 (HUNTING STATS)</div>
                    <div style="display: flex; flex-direction: column; justify-content: space-between; height: 100%; gap: 12px;">
                        <div class="omni-accumulated-stats-panel" style="padding: 10px 12px; gap: 6px;">
                            <div style="font-size: calc(var(--omni-base-font-size) * 0.79); font-weight: 800; display: flex; align-items: center; gap: 4px; border-bottom: 1px dashed var(--omni-card-border-line); padding-bottom: 6px; margin-bottom: 4px; color: #334155;">🏆 누적 아카이브 통계</div>
                            <div style="display: flex; justify-content: space-between; font-size: calc(var(--omni-base-font-size) * 0.75); color: #334155;">
                                <span style="font-weight: 600;">⏱️ 총 시간:</span>
                                <strong style="font-weight: 800; color: #334155;">${formattedTotalTime}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: calc(var(--omni-base-font-size) * 0.75); color: #334155;">
                                <span style="font-weight: 600;">🔺 총 경험치:</span>
                                <strong style="font-weight: 800; font-size: 11.5px; color: #334155;">${totalHuntingExp.toLocaleString()}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: calc(var(--omni-base-font-size) * 0.75); color: #334155;">
                                <span style="font-weight: 600;">💰 총순수익:</span>
                                <strong style="color: var(--omni-slate-primary); font-weight: 800;">${totalHuntingMeso.toLocaleString()}</strong>
                            </div>
                        </div>

                        <!-- 엑박 방지 처리된 사냥 MVP 도크 -->
                        <div class="omni-hunting-mvp-character-dock" style="padding: 8px 12px;">
                            <div class="mvp-circular-avatar-frame">
                                <img src="${mvpAvatarImageSrc}" style="width: 100%; height: 100%; object-fit: contain; transform: scale(1.4);" onerror="this.onerror=null; this.src='${OMNI_DEFAULT_AVATAR_SVG}';">
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 2px; align-items: flex-start; min-width: 0;">
                                <span style="font-size: 9px; color: var(--omni-point-amber-text) !important; background: var(--omni-point-amber-bg) !important; padding: 1px 5px; border-radius: 3px; font-weight: 800; white-space: nowrap;">🏆 사냥 MVP</span>
                                <strong style="font-size: 11.5px; color: var(--omni-slate-primary); font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; text-align: left;">${mvpCharacterName}</strong>
                            </div>
                        </div>

                        <div class="omni-bottom-summary-bar" style="padding-top: 8px;">
                            <span style="font-size: 11px; font-weight: 600; color: #334155;">💰 누적 사냥 메소</span>
                            <strong style="color: var(--omni-slate-primary); font-size: 12px; font-weight: 900;">${totalHuntingMeso.toLocaleString()}</strong>
                        </div>
                    </div>
                </div>

                <div class="omni-dashboard-widget-card" style="grid-column: span 4;">
                    <div class="wdg-hdr">💎 주간 결정석 정산 (BOSS STONE ESTIMATOR)</div>
                    <div style="display: flex; flex-direction: column; justify-content: space-between; height: 100%; gap: 12px;">
                        <div class="omni-accumulated-stats-panel" style="padding: 10px 12px; gap: 6px;">
                            <div style="font-size: calc(var(--omni-base-font-size) * 0.79); font-weight: 800; display: flex; align-items: center; gap: 4px; border-bottom: 1px dashed var(--omni-card-border-line); padding-bottom: 6px; margin-bottom: 4px; color: #334155;">⚔️ 주간 격파 캐릭터 보스 연동 수익</div>
                            <div style="display: flex; justify-content: space-between; font-size: calc(var(--omni-base-font-size) * 0.75); color: #334155;">
                                <span style="font-weight: 600;">💎 누적 정산 결정석 수량:</span>
                                <strong style="font-weight: 800; color: #10b981;">${totalEstimatedStonesCount > 0 ? totalEstimatedStonesCount : 9} / 180개</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: calc(var(--omni-base-font-size) * 0.75); color: #334155;">
                                <span style="font-weight: 600;">🪙 주간 예상 기대 총액:</span>
                                <strong style="font-weight: 800; color: var(--omni-slate-primary);">${formattedStonesMesoStr}</strong>
                            </div>
                        </div>

                        <!-- 3개 카드 대칭을 맞추기 위한 결정석 연동 도크 -->
                        <div class="omni-boss-stone-status-dock" style="padding: 8px 12px;">
                            <div class="mvp-circular-avatar-frame" style="background: var(--omni-emerald-light); border-color: #10b981;">
                                <span style="font-size: 16px;">⚡</span>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 2px; align-items: flex-start; min-width: 0;">
                                <span style="font-size: 9px; color: #10b981; background: var(--omni-emerald-light); padding: 1px 5px; border-radius: 3px; font-weight: 800; white-space: nowrap;">최근 연동 정산 상태</span>
                                <strong style="font-size: 10.5px; font-weight: 800; color: #10b981;">주간 보스 클리어 연동 완료!</strong>
                            </div>
                        </div>

                        <div class="omni-bottom-summary-bar" style="padding-top: 8px;">
                            <span style="font-size: 10px; color: #334155; width: 100%; text-align: left; font-weight: 600;">* 보스 클리어 실시간 동기화 작동 중</span>
                        </div>
                    </div>
                </div>

                <div class="omni-dashboard-widget-card" style="grid-column: span 4;">
                    <div class="wdg-hdr">🎰 옴니 자산 요약 (SIM QUICK STATS)</div>
                    <div style="display: flex; flex-direction: column; justify-content: space-between; height: 100%; gap: 12px;">
                        <div class="omni-accumulated-stats-panel" style="padding: 10px 12px; gap: 6px;">
                            <div style="font-size: calc(var(--omni-base-font-size) * 0.79); font-weight: 800; display: flex; align-items: center; gap: 4px; border-bottom: 1px dashed var(--omni-card-border-line); padding-bottom: 6px; margin-bottom: 4px; color: #334155;">💎 큐브 & 스타포스 현황</div>
                            <div style="display: flex; justify-content: space-between; font-size: calc(var(--omni-base-font-size) * 0.75); color: #334155;">
                                <span style="font-weight: 600;">🔮 사용 큐브 개수:</span>
                                <strong style="font-weight: 800; color: var(--omni-slate-primary);">${totalCubesRolled.toLocaleString()}개</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: calc(var(--omni-base-font-size) * 0.75); color: #334155;">
                                <span style="font-weight: 600;">🪙 시뮬레이터 소모 메소:</span>
                                <strong style="font-weight: 800; font-size: 11.5px; color: #334155;">${simMesoFormatted}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: calc(var(--omni-base-font-size) * 0.75); color: #334155;">
                                <span style="font-weight: 600;">🔍 돋보기 감정 비용:</span>
                                <strong style="font-weight: 800; font-size: 11.5px; color: #334155;">${simAppraisalFormatted}</strong>
                            </div>
                        </div>

                        <!-- 3개 카드 대칭을 맞추기 위한 자산 상태 도크 -->
                        <div class="omni-sim-status-dock" style="padding: 8px 12px;">
                            <div class="mvp-circular-avatar-frame" style="background: var(--omni-point-purple-bg);">
                                <span style="font-size: 16px;">🔮</span>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 2px; align-items: flex-start; min-width: 0;">
                                <span style="font-size: 9px; color: var(--omni-slate-primary); background: var(--omni-point-purple-bg); padding: 1px 5px; border-radius: 3px; font-weight: 800; white-space: nowrap;">⚡ 시뮬레이터 엔진</span>
                                <strong style="font-size: 11.5px; color: #334155; font-weight: 800;">실시간 자산 가동률 100%</strong>
                            </div>
                        </div>

                        <div class="omni-bottom-summary-bar" style="padding-top: 8px;">
                            <span style="font-size: 10.5px; color: #334155; width: 100%; text-align: left; font-weight: 600;">* [시뮬레이터] 탭의 누적 데이터 연동 출력</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- [2행] 표준 폰트 크기 및 풍부한 콘텐츠 항목으로 여백을 자연스럽게 채운 2열 레이아웃 -->
            <div class="dashboard-secondary-row">
                <div class="secondary-left-column">
                    <div class="omni-extended-panel">
                        <div class="panel-hdr">📸 진행중인 이벤트 (EVENT TIMELINE)</div>
                        <div class="event-slider-container" id="eventSlider">      
                            <div class="event-slider-track" id="eventTrack">
                                <a href="https://maplestory.nexon.com/News/Event" target="_blank" class="banner-wrapper-slot">
                                    <div class="banner-placeholder-box">
                                        <div class="banner-image-crop-layer"><img src="assets/event/event1.png" class="banner-img-core" onerror="this.src='${safeAvatar}';"></div>
                                        <div class="event-info-box"><span class="event-info-title">치지직 방송 드롭스 연동</span><span class="event-info-date">~ 2026.08.15</span></div>
                                    </div>
                                </a>
                                <a href="https://maplestory.nexon.com/News/Event" target="_blank" class="banner-wrapper-slot">
                                    <div class="banner-placeholder-box">
                                        <div class="banner-image-crop-layer"><img src="assets/event/event2.png" class="banner-img-core" onerror="this.src='${safeAvatar}';"></div>
                                        <div class="event-info-box"><span class="event-info-title">여름 한정 코인샵 오픈</span><span class="event-info-date">~ 2026.08.30</span></div>
                                    </div>
                                </a>
                                <a href="https://maplestory.nexon.com/News/Event" target="_blank" class="banner-wrapper-slot">
                                    <div class="banner-placeholder-box">
                                        <div class="banner-image-crop-layer"><img src="assets/event/event3.png" class="banner-img-core" onerror="this.src='${safeAvatar}';"></div>
                                        <div class="event-info-box"><span class="event-info-title">아쉴롬 기억의 정원</span><span class="event-info-date">~ 2026.07.30</span></div>
                                    </div>
                                </a>
                                <a href="https://maplestory.nexon.com/News/Event" target="_blank" class="banner-wrapper-slot">
                                    <div class="banner-placeholder-box">
                                        <div class="banner-image-crop-layer"><img src="assets/event/event4.png" class="banner-img-core" onerror="this.src='${safeAvatar}';"></div>
                                        <div class="event-info-box"><span class="event-info-title">벼룩시장 황금 마차</span><span class="event-info-date">~ 2026.09.20</span></div>
                                    </div>
                                </a>
                                <a href="https://maplestory.nexon.com/News/Event" target="_blank" class="banner-wrapper-slot">
                                    <div class="banner-placeholder-box">
                                        <div class="banner-image-crop-layer"><img src="assets/event/event5.png" class="banner-img-core" onerror="this.src='${safeAvatar}';"></div>
                                        <div class="event-info-box"><span class="event-info-title">버닝 서버 육성 가속 페스티벌</span><span class="event-info-date">~ 2026.09.30</span></div>
                                    </div>
                                </a>
                            </div>
                            <div class="event-slider-dots" id="eventSliderDots"></div>
                        </div>
                    </div>
                    <div class="omni-extended-panel">
                        <div class="panel-hdr-with-action"><div class="panel-hdr-title">📝 메모장 (MEMOS)</div><div class="memo-input-group"><input type="text" id="dashboardMemoInput" placeholder="실시간 메모 기입..."><button onclick="window.addDashboardInlineMemo()" class="mvp-action-btn-custom">등록</button></div></div>
                        <div class="dashboard-memo-scroll-area">${memoRowsHtml ? memoRowsHtml : '<div class="dashboard-empty-mini-alert">작성된 메모가 없습니다.</div>'}</div>
                    </div>
                </div>

                <div class="secondary-right-column">
                    <div class="omni-extended-panel half-height-panel-split">
                        <div class="panel-hdr">📢 메이플 소식 (MAPLESTORY NOTICES)</div>
                        <div class="split-box-scroll-viewport">
                            <div class="notice-list-wrapper">
                                <a href="https://maplestory.nexon.com/News/Notice/All/149495" target="_blank" class="notice-list-item">
                                    <span class="notice-badge type-inspect">점검</span>
                                    <p class="notice-title" style="font-size: calc(var(--omni-base-font-size) * 0.81); font-weight: 800;">7/9(목) 운영정책 위반 단속 결과 및 클린 캠페인 결과 발표</p>
                                    <span class="notice-date">07.09</span>
                                </a>
                                <a href="https://maplestory.nexon.com/News/Event/Ongoing/1349" target="_blank" class="notice-list-item">
                                    <span class="notice-badge type-event">이벤트</span>
                                    <p class="notice-title" style="font-size: calc(var(--omni-base-font-size) * 0.81); font-weight: 800;">챌린저스 월드 시즌4 오픈</p>
                                    <span class="notice-date">06.18</span>
                                </a>
                                <a href="https://maplestory.nexon.com/news/update/807" target="_blank" class="notice-list-item">
                                    <span class="notice-badge type-update">패치</span>
                                    <p class="notice-title" style="font-size: calc(var(--omni-base-font-size) * 0.81); font-weight: 800;">클라이언트 1.2.416 업데이트 안내 (신규 직업 레테)</p>
                                    <span class="notice-date">07.08</span>
                                </a>
                                <a href="https://maplestory.nexon.com/News/CashShop/Sale/632" target="_blank" class="notice-list-item">
                                    <span class="notice-badge type-info">판매</span>
                                    <p class="notice-title" style="font-size: calc(var(--omni-base-font-size) * 0.81); font-weight: 800;">6월 18일 캐시아이템 업데이트 - 제네시스 패스 & 제네시스 패스 PLUS</p>
                                    <span class="notice-date">07.05</span>
                                </a>
                                <a href="https://maplestory.nexon.com/News/Notice/Inspection/149467" target="_blank" class="notice-list-item">
                                    <span class="notice-badge type-inspect">점검</span>
                                    <p class="notice-title" style="font-size: calc(var(--omni-base-font-size) * 0.81); font-weight: 800;">[패치완료] 7/6(월) ver1.2.416 마이너버전(9) 패치(21:18 적용)</p>
                                    <span class="notice-date">07.02</span>
                                </a>
                                <a href="https://maplestory.nexon.com/News/Notice" target="_blank" class="notice-list-item">
                                    <span class="notice-badge type-info">안내</span>
                                    <p class="notice-title" style="font-size: calc(var(--omni-base-font-size) * 0.81); font-weight: 800;">대리 게임 및 비정상 우회 매크로 탐지 시스템 집중 모니터링 주간 선포</p>
                                    <span class="notice-date">06.29</span>
                                </a>
                                <a href="https://maplestory.nexon.com/News/Notice" target="_blank" class="notice-list-item">
                                    <span class="notice-badge type-event">이벤트</span>
                                    <p class="notice-title" style="font-size: calc(var(--omni-base-font-size) * 0.81); font-weight: 800;">버닝 서버 육성 가속 페스티벌 기념 핫타임 이벤트 안내</p>
                                    <span class="notice-date">06.25</span>
                                </a>
                                <a href="https://maplestory.nexon.com/News/Notice" target="_blank" class="notice-list-item">
                                    <span class="notice-badge type-info">공지</span>
                                    <p class="notice-title" style="font-size: calc(var(--omni-base-font-size) * 0.81); font-weight: 800;">메이플스토리 고객센터 운영 시간 개편 및 실시간 상담 안내</p>
                                    <span class="notice-date">06.20</span>
                                </a>
                                <a href="https://maplestory.nexon.com/News/Notice" target="_blank" class="notice-list-item">
                                    <span class="notice-badge type-event">이벤트</span>
                                    <p class="notice-title" style="font-size: calc(var(--omni-base-font-size) * 0.81); font-weight: 800;">여름 방학 버닝 월드 성장 지원 혜택 추가 안내</p>
                                    <span class="notice-date">06.15</span>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="omni-extended-panel half-height-panel-split">
                        <div class="panel-hdr">🚀 옴니 업데이트 (OMNI RECONSTRUCTION UPDATES)</div>
                        <div class="split-box-scroll-viewport">
                            <div class="notice-list-wrapper">
                                <div class="notice-list-item" style="pointer-events:none;">
                                    <span class="notice-badge type-update">V15.0</span>
                                    <p class="notice-title" style="font-size: calc(var(--omni-base-font-size) * 0.81); font-weight: 800;">[API파싱] 넥슨 OpenAPI 숙제(homework) 및 심볼 만렙 자동 감지 엔진 탑재</p>
                                    <span class="notice-date">08.04</span>
                                </div>
                                <div class="notice-list-item" style="pointer-events:none;">
                                    <span class="notice-badge type-update">V14.9</span>
                                    <p class="notice-title" style="font-size: calc(var(--omni-base-font-size) * 0.81); font-weight: 800;">[레이아웃] 순백색 점선(dashed) 테두리 기반의 클래식 화이트 스킨 복구</p>
                                    <span class="notice-date">07.09</span>
                                </div>
                                <div class="notice-list-item" style="pointer-events:none;">
                                    <span class="notice-badge type-update">V14.8</span>
                                    <p class="notice-title" style="font-size: calc(var(--omni-base-font-size) * 0.81); font-weight: 800;">[인터랙션] 메인 이벤트 트랙 가변 배율 슬라이더 무오차 복구 종결</p>
                                    <span class="notice-date">07.09</span>
                                </div>
                                <div class="notice-list-item" style="pointer-events:none;">
                                    <span class="notice-badge type-update">V14.7</span>
                                    <p class="notice-title" style="font-size: calc(var(--omni-base-font-size) * 0.81); font-weight: 800;">[시스템] 대시보드 컴포넌트 세로 여백 및 가독성 최적화 완료</p>
                                    <span class="notice-date">07.05</span>
                                </div>
                                <div class="notice-list-item" style="pointer-events:none;">
                                    <span class="notice-badge type-update">V14.6</span>
                                    <p class="notice-title" style="font-size: calc(var(--omni-base-font-size) * 0.81); font-weight: 800;">[안정성] 메모장 및 스케줄러 컴포넌트 실시간 동기화 오류 예외 처리 강화</p>
                                    <span class="notice-date">07.01</span>
                                </div>
                                <div class="notice-list-item" style="pointer-events:none;">
                                    <span class="notice-badge type-update">V14.5</span>
                                    <p class="notice-title" style="font-size: calc(var(--omni-base-font-size) * 0.81); font-weight: 800;">[디자인] 대시보드 카드 간격 및 폰트 계층 구조 리팩토링 완료</p>
                                    <span class="notice-date">06.28</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- [3행] 육성 전략 계획서 (STRATEGY PLANNER) 제거됨 -->
        `;
        
        window.setOmniTheme(activeTheme);
        initEventSlider();
        window.startDailyResetTimer();
        window.fetchAndRenderMapleTop10();
        window.renderGlobalFooter();
    } catch (err) {
        console.error("🚨 옴니 렌더링 세이프티 엔진 구동 복구 가동:", err);
    } finally {
        setTimeout(() => { container.style.opacity = '1'; }, 20);
    }
};

// 💡 [초기 자동 렌더링 파이프라인]
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.renderDashboardMainWidgets();
    });
} else {
    window.renderDashboardMainWidgets();
}