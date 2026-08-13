/**
 * ============================================================================
 * 📑 MAPLE OMNI V14 - js/todo/js/todo_summary.js [📋 COMPACT SUMMARY & LEDGER ENGINE]
 * 역할: 캐릭터별 통합 진척도 요약 및 사냥기록지 연동 메이플 가계부/물욕템 리포트 렌더링
 * 수정사항: 
 *   1. 화면 점유율 컴팩트화 (아바타/패딩/카드 크기 축소로 시야 확보)
 *   2. 사냥기록지 및 보스 정산금 연동 '메이플 가계부 & 물욕템 드랍 리포트' 패널 신규 탑재
 * 규칙: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 한글 주석을 기입했습니다.
 * ============================================================================
 */

/**
 * 📋 캐릭터별 통합 진척도 요약 및 가계부 통합 렌더링 엔진
 */
window.renderTodoSummaryContent = function() {
    const container = document.getElementById('todo-summary');
    if (!container) return;
    
    // 초보자 가이드: 등록된 캐릭터가 없는 경우의 예외 화면을 출력합니다.
    if (window.omniTodoState.characters.length === 0) {
        container.innerHTML = `<div class="omni-empty-state">스케줄러 명단에 등록된 캐릭터 정보가 없습니다.</div>`;
        return;
    }

    // 1. LocalStorage에서 사냥기록지 및 지출 내역을 불러옵니다.
    let huntingLogs = [];
    try {
        const rawLogs = localStorage.getItem("omni_v14_hunting_logs") || localStorage.getItem("omni_hunting_log");
        if (rawLogs) huntingLogs = JSON.parse(rawLogs);
    } catch(e) { huntingLogs = []; }

    let expenseLogs = [];
    try {
        const rawExp = localStorage.getItem("omni_v14_expense_logs");
        if (rawExp) expenseLogs = JSON.parse(rawExp);
    } catch(e) { expenseLogs = []; }

    // 2. 보스 정산금 총계를 계산합니다.
    let totalBossMeso = 0;
    window.omniTodoState.characters.forEach(char => {
        const data = window.omniTodoState.checkData[char.id] || {};
        Object.keys(window.omniTodoState.bossPrices || {}).forEach(k => {
            if (data[`boss_${k}`]) {
                totalBossMeso += (window.omniTodoState.bossPrices[k] || 0);
            }
        });
    });

    // 3. 사냥기록지 연동 (전체 수입/지출 계산 및 각 캐릭터별 물욕템 드랍 목록 분류)
    let totalHuntingMeso = 0;
    let totalExpenses = 0;
    let rareDropsList = [];
    let charDropsMap = {}; // 각 캐릭터 이름을 키(Key)로 하는 득템 매핑 객체입니다.

    huntingLogs.forEach(log => {
        if (log.meso) totalHuntingMeso += Number(log.meso) || 0;
        if (log.expense) totalExpenses += Number(log.expense) || 0;
        
        // 기록지에 기재된 캐릭터명을 추출합니다.
        const logCharName = log.character || log.charName || log.name || "";

        let foundDrops = [];
        if (log.drops && Array.isArray(log.drops)) {
            log.drops.forEach(d => {
                if (d.isRare || d.rare || (d.price && d.price >= 50000000)) {
                    foundDrops.push({ name: d.name || d.itemName || '물욕템', price: d.price || 0 });
                }
            });
        } else if (log.rareItem) {
            foundDrops.push({ name: log.rareItem, price: log.rareItemMeso || 0 });
        }

        foundDrops.forEach(drop => {
            rareDropsList.push(drop);
            if (logCharName) {
                if (!charDropsMap[logCharName]) charDropsMap[logCharName] = [];
                charDropsMap[logCharName].push(drop);
            }
        });
    });

    expenseLogs.forEach(exp => {
        if (exp.amount) totalExpenses += Number(exp.amount) || 0;
    });

    const totalEarnedMeso = totalBossMeso + totalHuntingMeso;
    const netProfit = totalEarnedMeso - totalExpenses;

    // 초보자 친화적 메소 단위 가공 함수 (억/만/메소 단위로 깔끔하게 표시)
    const formatMesoShort = (meso) => {
        if (!meso || meso === 0) return "0 메소";
        const absMeso = Math.abs(meso);
        let result = "";
        if (absMeso >= 100000000) {
            result = (absMeso / 100000000).toFixed(2) + "억";
        } else if (absMeso >= 10000) {
            result = Math.floor(absMeso / 10000).toLocaleString() + "만";
        } else {
            result = absMeso.toLocaleString() + "메소";
        }
        return meso < 0 ? "-" + result : result;
    };

    // 저번주 수익 불러오기 및 더미 데이터 없이 기록 유무 판별 로직
    let lastWeekProfit = null;
    try {
        const savedLastWeek = localStorage.getItem("omni_v14_last_week_profit");
        if (savedLastWeek !== null && savedLastWeek !== undefined && savedLastWeek !== "") {
            lastWeekProfit = Number(savedLastWeek) || 0;
        }
    } catch(e) { lastWeekProfit = null; }

    let profitCompareText = "";
    if (lastWeekProfit !== null) {
        const profitDiff = netProfit - lastWeekProfit;
        const diffSign = profitDiff >= 0 ? "+" : "";
        profitCompareText = `저번주 수익: ${formatMesoShort(lastWeekProfit)} (${diffSign}${formatMesoShort(profitDiff)})`;
    } else {
        profitCompareText = "저번주 기록 없음";
    }

    // 4. 슬림 공지바 및 메이플 가계부 현황판 생성
    let summaryHeaderHtml = `
        <div class="omni-summary-compact-bar">
            <span class="notice-badge">💡 실시간 동기화</span>
            <span class="notice-text">인게임 숙제 완료 후 [API 데이터 즉시 갱신]을 누르면 최신 정보가 반영됩니다.</span>
        </div>

        <!-- 💰 메이플 가계부 & 물욕템 리포트 패널 -->
        <div class="omni-ledger-dashboard">
            <div class="ledger-card income">
                <div class="ledger-icon">🪙</div>
                <div class="ledger-info">
                    <span class="ledger-label">이번 주 총 수입</span>
                    <strong class="ledger-value positive">${formatMesoShort(totalEarnedMeso)}</strong>
                    <span class="ledger-sub">보스: ${formatMesoShort(totalBossMeso)} · 사냥: ${formatMesoShort(totalHuntingMeso)}</span>
                </div>
            </div>

            <div class="ledger-card expense">
                <div class="ledger-icon">💸</div>
                <div class="ledger-info">
                    <span class="ledger-label">총 지출 (강화/도핑)</span>
                    <strong class="ledger-value negative">${formatMesoShort(totalExpenses)}</strong>
                    <span class="ledger-sub">사냥기록지 지출 합산</span>
                </div>
            </div>

            <div class="ledger-card profit">
                <div class="ledger-icon">💎</div>
                <div class="ledger-info">
                    <span class="ledger-label">주간 순수익</span>
                    <strong class="ledger-value highlight">${formatMesoShort(netProfit)}</strong>
                    <span class="ledger-sub">${profitCompareText}</span>
                </div>
            </div>

            <div class="ledger-card drops">
                <div class="ledger-icon">🎁</div>
                <div class="ledger-info">
                    <span class="ledger-label">전체 물욕템 리포트</span>
                    <div class="ledger-drops-tag-list">
                        ${rareDropsList.length > 0 
                            ? rareDropsList.slice(0, 3).map(d => `<span class="rare-drop-chip" title="${d.name}">✨ ${d.name}</span>`).join('') 
                            : '<span class="no-drops-txt">드랍 기록 없음</span>'}
                    </div>
                </div>
            </div>
        </div>
    `;

    // 5. 캐릭터별 요약 카드 생성 (개별 캐릭터별 물욕템 득템 기록 표시 추가)
    let characterSummaryHtml = "";
    window.omniTodoState.characters.forEach(char => {
        const data = window.omniTodoState.checkData[char.id] || {};
        
        // 일일 진척도 (총 8개 기준)
        let dailyMax = 8; let dailyDone = 0;
        if (parseInt(data.daily_m_park || 0, 10) >= 7) dailyDone++;
        ['daily_cernium', 'daily_arcus', 'daily_odium', 'daily_shangrila', 'daily_arteria', 'daily_carcion', 'daily_talhart'].forEach(k => { if(data[k]) dailyDone++; });
        let dailyPercent = Math.round((dailyDone / dailyMax) * 100);

        // 주간 진척도 (총 15개 기준)
        let weeklyMax = 15; let weeklyDone = 0;
        if(data.weekly_mountain) weeklyDone++;
        if(data.weekly_angeler) weeklyDone++;
        Object.keys(window.omniTodoState.bossPrices || {}).forEach(k => { if (data[`boss_${k}`]) weeklyDone++; });
        let weeklyPercent = Math.min(100, Math.round((weeklyDone / weeklyMax) * 100));

        const avatarImg = char.image || window.SAFE_FALLBACK_AVATAR;

        // 캐릭터별 주간 보스 예상 수익
        let charEstimatedMeso = 0;
        Object.keys(window.omniTodoState.bossPrices || {}).forEach(k => {
            if (data[`boss_${k}`]) {
                charEstimatedMeso += (window.omniTodoState.bossPrices[k] || 0);
            }
        });
        const formattedCharMeso = formatMesoShort(charEstimatedMeso);

        // 해당 캐릭터가 사냥기록지에서 획득한 물욕템 목록만 필터링합니다.
        const myDrops = charDropsMap[char.name] || charDropsMap[char.id] || [];
        let dropsHtml = myDrops.length > 0 
            ? myDrops.map(d => `<span class="rare-drop-chip" title="${d.name}">✨ ${d.name}</span>`).join('') 
            : '<span class="no-drops-txt" style="font-size:10px; color:#94a3b8;">득템 기록 없음</span>';

        characterSummaryHtml += `
            <div class="omni-char-summary-card compact-card">
                <div class="char-compact-header">
                    <div class="char-avatar-frame-compact">
                        <img src="${avatarImg}" onerror="this.src='${window.SAFE_FALLBACK_AVATAR}';">
                    </div>
                    <div class="char-compact-titles">
                        <div class="char-name-tag-compact">${char.name}</div>
                        <div class="char-spec-tag-compact">Lv.${char.level || 280} · ${char.job || '모험가'}</div>
                    </div>
                </div>
                
                <div class="summary-details-compact">
                    <div class="summary-item-compact">
                        <div class="summary-label-compact">
                            <span>☀️ 일일 숙제</span>
                            <span class="percent-txt-compact">${dailyDone}/${dailyMax} (${dailyPercent}%)</span>
                        </div>
                        <div class="summary-progress-track-compact">
                            <div class="summary-progress-bar-compact" style="width: ${dailyPercent}%;"></div>
                        </div>
                    </div>

                    <div class="summary-item-compact">
                        <div class="summary-label-compact">
                            <span>📦 주간 보스</span>
                            <span class="percent-txt-compact">${weeklyDone}/${weeklyMax} (${weeklyPercent}%)</span>
                        </div>
                        <div class="summary-progress-track-compact">
                            <div class="summary-progress-bar-compact weekly" style="width: ${weeklyPercent}%;"></div>
                        </div>
                    </div>

                    <div class="summary-sub-info-compact">
                        <span>💰 보스 예상수익</span>
                        <span class="meso-txt-compact">${formattedCharMeso}</span>
                    </div>

                    <div class="summary-sub-info-compact" style="border-top:1px dashed var(--omni-card-border-line, #cbd5e1); padding-top:6px; margin-top:2px; align-items:flex-start;">
                        <span style="flex-shrink:0; padding-top:2px;">🎁 득템 기록</span>
                        <div class="ledger-drops-tag-list" style="justify-content:flex-end;">${dropsHtml}</div>
                    </div>
                </div>
            </div>
        `;
    });

    // 화면 최종 결합 출력
    container.innerHTML = `
        ${summaryHeaderHtml}
        <div class="omni-summary-grid-compact">
            ${characterSummaryHtml}
        </div>
    `;
};