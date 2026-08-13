/**
 * ============================================================================
 * 📑 MAPLE OMNI V15 - dashboard/character.js
 * 설명: 스케줄러 캐릭터 등록, 삭제 및 드래그 앤 드롭 순서 변경 모듈입니다.
 * 초보자 가이드: 캐릭터 리스트 변경 시 대시보드 위젯을 즉시 갱신합니다.
 * ============================================================================
 */

/**
 * 🛠️ API 완료 상태 판별 헬퍼
 */
function isOmniItemCompleted(item) {
    if (!item) return false;
    if (item.clear_yn === "Y" || item.clear_yn === "y" || item.clear_yn === true) return true;
    if (item.quest_state === "2" || item.quest_state === 2) return true;
    if (item.complete_flag === true || item.complete_flag === "true" || item.complete_flag === "Y") return true;
    if (item.is_clear === true || item.clear === true) return true;
    return false;
}

/**
 * 👤 캐릭터 신규 등록 팝업
 */
window.omniTriggerAddCharacterPopup = function() {
    const charName = prompt("등록하실 메이플스토리 캐릭터 이름을 입력해주세요:");
    if (charName && charName.trim()) {
        const cleanName = charName.trim();
        let savedCharsRaw = localStorage.getItem("omni_v14_todo_characters_list");
        let todoCharacters = savedCharsRaw ? JSON.parse(savedCharsRaw) : [];
        
        if (todoCharacters.some(c => (c.name || "").toLowerCase() === cleanName.toLowerCase())) {
            alert("이미 리스트에 존재하거나 등록된 캐릭터 명칭입니다.");
            return;
        }

        localStorage.removeItem(`omni_v14_cached_char_${cleanName}`);
        
        const safeAvatar = window.DASHBOARD_SAFE_AVATAR || "";
        todoCharacters.push({
            id: cleanName,
            name: cleanName,
            job: "신규 직업군",
            level: 260,
            image: safeAvatar
        });
        localStorage.setItem("omni_v14_todo_characters_list", JSON.stringify(todoCharacters));
        
        if (typeof window.startOmniSearch === 'function') {
            window.startOmniSearch(cleanName, true);
        } else {
            alert(`✨ [${cleanName}] 캐릭터가 등록되었습니다!`);
        }
        window.renderDashboardMainWidgets();
    }
};

/**
 * 🗑️ 캐릭터 삭제 처리
 */
window.omniDeleteCharacter = function(index) {
    if (!confirm("정말 이 캐릭터를 스케쥴러에서 삭제하시겠습니까?")) return;
    let savedCharsRaw = localStorage.getItem("omni_v14_todo_characters_list");
    let todoCharacters = savedCharsRaw ? JSON.parse(savedCharsRaw) : [];
    if (todoCharacters[index]) {
        const charObj = todoCharacters[index];
        const charName = charObj.name || charObj.id;

        todoCharacters.splice(index, 1);
        localStorage.setItem("omni_v14_todo_characters_list", JSON.stringify(todoCharacters));

        // 💡 [초보자 가이드] 삭제된 캐릭터를 영구 블랙리스트에 등록하여 API 갱신이나 검색 시 다시 부활하는 현상을 완벽히 차단합니다.[cite: 7]
        if (charName) {
            let deletedList = JSON.parse(localStorage.getItem("omni_v14_deleted_chars_blacklist") || "[]");
            if (!deletedList.some(name => name.toLowerCase() === charName.toLowerCase())) {
                deletedList.push(charName);
                localStorage.setItem("omni_v14_deleted_chars_blacklist", JSON.stringify(deletedList));
            }

            localStorage.removeItem(`omni_v15_cached_char_${charName}`);
            localStorage.removeItem(`omni_v14_cached_char_${charName}`);

            let savedChecksRaw = localStorage.getItem("omni_v14_todo_perfect_storage");
            if (savedChecksRaw) {
                try {
                    let todoCheckData = JSON.parse(savedChecksRaw);
                    delete todoCheckData[charName];
                    localStorage.setItem("omni_v14_todo_perfect_storage", JSON.stringify(todoCheckData));
                } catch (e) {}
            }
        }

        window.renderDashboardMainWidgets();
    }
};

/**
 * 🖐️ 캐릭터 슬롯 드래그 앤 드롭(Drag & Drop) 순서 변경 엔진
 */
let omniDraggedCharIndex = null;

window.omniHandleDragStart = function(e, index) {
    omniDraggedCharIndex = index;
    e.dataTransfer.effectAllowed = 'move';
};

window.omniHandleDragOver = function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
};

window.omniHandleDrop = function(e, targetIndex) {
    e.preventDefault();
    if (omniDraggedCharIndex === null || omniDraggedCharIndex === targetIndex) return;
    let savedCharsRaw = localStorage.getItem("omni_v14_todo_characters_list");
    let todoCharacters = savedCharsRaw ? JSON.parse(savedCharsRaw) : [];
    const movedItem = todoCharacters.splice(omniDraggedCharIndex, 1)[0];
    todoCharacters.splice(targetIndex, 0, movedItem);
    localStorage.setItem("omni_v14_todo_characters_list", JSON.stringify(todoCharacters));
    omniDraggedCharIndex = null;
    window.renderDashboardMainWidgets();
};