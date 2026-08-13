/**
 * ============================================================================
 * 📑 MAPLE OMNI V14 - js/todo/js/todo_daily.js [☀️ DAILY QUEST]
 * 역할: 각 캐릭터별 그란디스 전역 심볼 일일 퀘스트 및 심볼 동기화 카드 보드판 렌더링
 * 수정사항: 스케줄러 일퀘 체크 시 즉시 상태 보존 및 리페인트 동기화 처리
 * 규칙: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 달아줍니다.
 * ============================================================================
 */

/**
 * ⚙️ [셀프 체크모드 및 편집 토글 함수] 
 * 캐릭터 카드 우측 상단 톱니바퀴 아이콘 클릭 시 해당 캐릭터의 수동 체크(셀프 체크모드) 권한을 켜고 끕니다.
 * 초보자 가이드: 평상시에는 자동 연동으로 수동 조작이 잠겨있으며, 톱니바퀴를 눌러야만 직접 체크할 수 있습니다.
 */
window.openTodoCharEditModal = function(charId) {
    const targetData = window.omniTodoState.checkData[charId];
    if (!targetData) return;

    // 셀프 체크모드 상태값을 반전(토글) 시킵니다. (true <-> false)
    targetData.selfCheckMode = !targetData.selfCheckMode;
    localStorage.setItem("omni_v14_todo_perfect_storage", JSON.stringify(window.omniTodoState.checkData));

    const char = window.omniTodoState.characters.find(c => c.id === charId);
    const charName = char ? char.name : charId;

    if (targetData.selfCheckMode) {
        alert(`✨ [${charName}] 셀프 체크모드(수동 편집)가 활성화되었습니다!\n이제 일일 퀘스트 및 몬스터파크 항목을 직접 클릭하여 수동으로 체크/해제하실 수 있습니다.`);
    } else {
        alert(`🔒 [${charName}] 셀프 체크모드가 해제되었습니다.\n안전한 API 자동 연동 모드로 전환됩니다.`);
    }

    // 화면을 새로고침하여 편집모드 상태(테두리 색상 및 뱃지)를 즉시 반영합니다.
    window.renderTodoDailyContent();
};

window.renderTodoDailyContent = function() {
    const container = document.getElementById('todo-daily');
    if (!container) return;
    
    // 예외 처리 가드벨트: 스케줄 대상 캐릭터가 없을 때 진입 차단 가이드라인 송출
    if (window.omniTodoState.characters.length === 0) {
        container.innerHTML = `<div class="omni-empty-state">캐릭터를 검색창에 탐색하여 스케줄러 명단에 편입시켜 주십시오.</div>`; 
        return;
    }

    // 💡 [초보자 코딩 가이드] 일일 퀘스트 페이지 상단 가이드 박스의 위쪽 여백을 바짝 붙여 위로 끌어올렸습니다.
    let html = `
        <div class="omni-guide-box" style="background: var(--omni-card-bg, #ffffff); border: 1px dashed #8372d6; border-radius: 12px; padding: 14px 18px; margin-top: -6px; margin-bottom: 12px; display: flex; align-items: flex-start; gap: 14px; box-sizing: border-box; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
            <div style="width: 36px; height: 36px; border-radius: 8px; background: #f3e8ff; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">☀️</div>
            <div style="display: flex; flex-direction: column; gap: 4px; width: 100%;">
                <h2 style="margin: 0; font-size: 14.5px; font-weight: 900; color: var(--omni-text-main, #1e293b); letter-spacing: -0.3px;">일일 퀘스트 페이지 이용 가이드</h2>
                <p style="margin: 0; font-size: 11.5px; font-weight: 500; color: var(--omni-text-sub, #64748b); line-height: 1.5;">
                    각 캐릭터별 그란디스 심볼 일일 퀘스트와 몬스터파크 수행 현황을 관제하는 전문 콘솔입니다.<br>
                    • <b>자동 연동 원칙:</b> 일일 퀘스트 수행 완료 여부는 API 데이터 연동을 통해 자동으로 반영되는 것이 원칙이며, 페이지에서 직접 수동 체크하는 것은 기본적으로 잠겨 있습니다.<br>
                    • <b>셀프 체크모드 (수동 편집):</b> 만약 수동으로 직접 체크를 변경하고 싶으신 경우, 캐릭터 카드 우측 상단의 <b>[⚙️ 편집모드]</b> 톱니바퀴 버튼을 눌러 해당 캐릭터의 <b>셀프 체크모드</b>를 활성화해 주세요.<br>
                    • <b>실시간 툴팁:</b> 각 심볼 퀘스트 이름에 마우스를 올리면 다음 레벨업 및 만렙까지 남은 필수 횟수를 확인할 수 있습니다.
                </p>
            </div>
        </div>
        <div class="omni-character-grid">
    `;
    
    // 캐릭터 명단 고속 루프 처리를 가동해 개별 컴포넌트 숙제 카드를 슬라이싱 드로잉합니다.
    window.omniTodoState.characters.forEach(char => {
        const data = window.omniTodoState.checkData[char.id] || {};
        let currentMparkCount = data.daily_m_park || 0;
        
        const fallbackImg = window.SAFE_FALLBACK_AVATAR || "";
        const safeCharAvatar = (char.image && !char.image.includes("default.png")) ? char.image : fallbackImg;

        // 📊 일일 숙제 달성률 및 완료 카운트 계산 로직
        const questKeys = ['daily_cernium', 'daily_arcus', 'daily_odium', 'daily_shangrila', 'daily_arteria', 'daily_carcion', 'daily_talhart'];
        let doneCount = currentMparkCount >= 7 ? 1 : 0;
        questKeys.forEach(k => { if (data[k]) doneCount++; });
        let progressPct = Math.round((doneCount / 8) * 100);

        // ⚙️ 셀프 체크모드 활성화 여부에 따른 카드 디자인 동적 스타일 적용 (활성화 시 보라색 테두리와 뱃지 표시)
        const isSelfCheckActive = data.selfCheckMode === true;
        const cardBorderStyle = isSelfCheckActive ? 'border: 2px solid #8372d6 !important; background: #faf5ff; width: 340px; box-sizing: border-box;' : 'width: 340px; box-sizing: border-box;';
        const editBtnColor = isSelfCheckActive ? '#7c3aed' : '#94a3b8';
        const selfCheckBadge = isSelfCheckActive ? '<span style="font-size:9px; background:#7c3aed; color:#fff; padding:1px 5px; border-radius:4px; font-weight:800; margin-left:4px;">셀프체크ON</span>' : '';

        html += `
            <div class="omni-char-card" style="${cardBorderStyle}">
                <div class="char-header">
                    <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
                        <div class="char-avatar-wrapper">
                            <img src="${safeCharAvatar}" class="char-avatar" onerror="this.src='${fallbackImg}';">
                        </div>
                        <div class="char-info">
                            <div class="char-name">${char.name} ${selfCheckBadge}</div>
                            <div class="char-spec">Lv.${char.level || 280} · ${char.job || '모험가'}</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; flex-shrink: 0;">
                        <div style="text-align: right; display: flex; flex-direction: column; gap: 1px;">
                            <span style="font-size: 10px; font-weight: 800; color: var(--omni-text-sub, #64748b);">일일 달성률</span>
                            <strong style="font-size: 11.5px; font-weight: 900; color: var(--omni-lavender-main, #8372d6);">${doneCount}/8 완료 (${progressPct}%)</strong>
                        </div>
                        <button class="btn-edit-char" onclick="window.openTodoCharEditModal('${char.id}')" title="셀프 체크모드 토글" style="background: none; border: none; font-size: 14px; cursor: pointer; color: ${editBtnColor}; padding: 0 2px;">⚙️</button>
                        <button class="btn-delete-char" onclick="window.removeTodoCharacter(event, '${char.id}')" style="position: static;">×</button>
                    </div>
                </div>
                <div class="hw-scroll-list">
                    <!-- 몬스터파크 카운터 클릭 체크 컴포넌트 바인딩 링크 -->
                    <div class="hw-item-row ${currentMparkCount >= 7 ? 'is-done' : ''}" onclick="window.incrementMonsterParkCounter('${char.id}')">
                        <div class="hw-left">
                            <div class="custom-premium-checkbox ${currentMparkCount >= 7 ? 'checked' : ''}">${currentMparkCount >= 7 ? '✓' : ''}</div>
                            <span class="hw-title">몬스터파크 (클릭 시 횟수 증가)</span>
                        </div>
                        <span class="hw-counter">${currentMparkCount} / 7 회</span>
                    </div>
                    <!-- 코어에 위임된 일퀘 매핑 헬퍼 함수를 통한 심볼 콘텐츠 행들 조립 (다음 레벨업 및 만렙 잔여 횟수 안내 툴팁 적용) -->
                    ${window.renderHwItem(char.id, 'daily_cernium', '<span class="hw-tooltip-target" title="📍 세르니움 심볼 성장 정보&#10;✨ 다음 레벨업까지: 남은 횟수 산정 중&#10;🏁 만렙까지: 총 필요 횟수 산정 중">세르니움 조사</span>', data.daily_cernium, '완료', '미완료')}
                    ${window.renderHwItem(char.id, 'daily_arcus', '<span class="hw-tooltip-target" title="📍 호텔 아르크스 심볼 성장 정보&#10;✨ 다음 레벨업까지: 남은 횟수 산정 중&#10;🏁 만렙까지: 총 필요 횟수 산정 중">호텔 아르크스 청소</span>', data.daily_arcus, '완료', '미완료')}
                    ${window.renderHwItem(char.id, 'daily_odium', '<span class="hw-tooltip-target" title="📍 오디움 심볼 성장 정보&#10;✨ 다음 레벨업까지: 남은 횟수 산정 중&#10;🏁 만렙까지: 총 필요 횟수 산정 중">오디움 일대 탐사</span>', data.daily_odium, '완료', '미완료')}
                    ${window.renderHwItem(char.id, 'daily_shangrila', '<span class="hw-tooltip-target" title="📍 도원경 심볼 성장 정보&#10;✨ 다음 레벨업까지: 남은 횟수 산정 중&#10;🏁 만렙까지: 총 필요 횟수 산정 중">도원경 오염 정화</span>', data.daily_shangrila, '완료', '미완료')}
                    ${window.renderHwItem(char.id, 'daily_arteria', '<span class="hw-tooltip-target" title="📍 아르테리아 심볼 성장 정보&#10;✨ 다음 레벨업까지: 남은 횟수 산정 중&#10;🏁 만렙까지: 총 필요 횟수 산정 중">아르테리아 잔당 처치</span>', data.daily_arteria, '완료', '미완료')}
                    ${window.renderHwItem(char.id, 'daily_carcion', '<span class="hw-tooltip-target" title="📍 카르시온 심볼 성장 정보&#10;✨ 다음 레벨업까지: 남은 횟수 산정 중&#10;🏁 만렙까지: 총 필요 횟수 산정 중">카르시온 복구 지원</span>', data.daily_carcion, '완료', '미완료')}
                    ${window.renderHwItem(char.id, 'daily_talhart', '<span class="hw-tooltip-target" title="📍 탈라하트 심볼 성장 정보&#10;✨ 다음 레벨업까지: 남은 횟수 산정 중&#10;🏁 만렙까지: 총 필요 횟수 산정 중">탈라하트 조사</span>', data.daily_talhart, '완료', '미완료')}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html + `</div>`;
};