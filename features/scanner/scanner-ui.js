/**
 * ============================================================================
 * 🖥️ MAPLE OMNI - scanner-ui.js (인터페이스 및 동적 뷰포트 드로잉 총괄)
 * ============================================================================
 * [초보자 안내서]
 * 이 파일은 브라우저 화면의 레이아웃과 카드들을 그려내는 공간입니다.
 * 넥슨 공식 명세 변수인 character_name을 타겟으로 바인딩하여 백화 현상을 봉쇄합니다.
 */

window.buildScannerBaseLayout = function() {
    const targetSection = document.getElementById('omniScannerSection');
    if (!targetSection) return;

    targetSection.innerHTML = `
    <div style="background: #ffffff; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.02); margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
            <h2 style="margin: 0 0 4px 0; font-size: 22px; font-weight: 900; color: #1e293b; letter-spacing: -0.5px;">📡 OMNI SCANNER</h2>
            <div style="font-size: 12px; color: #64748b; font-weight: 600;">영구 스토리지 캐싱 기반의 실시간 랭킹 추적형 무작위 직업 스펙트럼 대조 기구</div>
        </div>
        
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <div style="display: flex; gap: 6px; align-items: center; background: #f8fafc; padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <span style="font-size: 13px; color: #475569; font-weight: 700;">🏠 기준 등록:</span>
                <input type="text" id="scanner_my_name_input" placeholder="캐릭터명 입력" style="border: none; background: transparent; outline: none; font-size: 13px; font-weight: 700; width: 110px; color: #334155;">
                <button onclick="window.registerMyCharacterDirectly(false)" style="padding: 6px 12px; background: #4f46e5; color: #ffffff; border: none; border-radius: 6px; font-weight: 800; font-size: 11px; cursor: pointer; white-space: nowrap;">등록 (캐시우선)</button>
            </div>

            <button onclick="window.forceRefreshScannerData()" style="padding: 10px 14px; background: #475569; color: #ffffff; border: none; border-radius: 8px; font-weight: 800; font-size: 12px; cursor: pointer; transition: background 0.2s; display: flex; align-items: center; gap: 4px;">
                <span>실시간 무작위 풀 새로고침</span> 🔄
            </button>

            <div style="display: flex; gap: 6px; align-items: center; background: #f8fafc; padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <span style="font-size: 13px; color: #2563eb; font-weight: 700;">👤 대상조:</span>
                <input type="text" id="scanner_target_name" placeholder="상대방 이름" style="border: none; background: transparent; outline: none; font-size: 13px; font-weight: 700; width: 110px; color: #334155;">
                <button onclick="window.startComparison()" style="padding: 6px 12px; background: #2563eb; color: #ffffff; border: none; border-radius: 6px; font-weight: 800; font-size: 11px; cursor: pointer; white-space: nowrap;">대조</button>
            </div>
        </div>
    </div>

    <div id="omni_meta_dashboard" style="display: none; margin-bottom: 20px;"></div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; align-items: start;">
        <div style="background: white; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; text-align: center;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 12px;">
                <span style="font-size: 14px; font-weight: 900; color: #334155;">내 장착 제원 (<span id="scannerMyName">-</span>)</span>
                <span id="scannerMyPowerTitle" style="font-size: 12px; font-weight: 800; color: #4f46e5; background: #eeebff; padding: 4px 10px; border-radius: 6px;">전투력: 스캔 대기</span>
            </div>
            <div id="scanner_my_grid" class="scanner-grid-container">
                <div style="padding: 100px 0; color: #94a3b8; font-size: 13px; font-weight: 700;">캐릭터명을 입력 후 상단 등록 단추를 활성화하십시오.</div>
            </div>
        </div>

        <div style="background: white; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; text-align: center;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 12px;">
                <span style="font-size: 14px; font-weight: 900; color: #2563eb;">타겟 [보성] 스펙트럼 정보</span>
                <span id="scannerRivalPowerTitle" style="font-size: 12px; font-weight: 800; color: #2563eb; background: #e0f2fe; padding: 4px 10px; border-radius: 6px;">전투력: 대기 중</span>
            </div>
            <div id="scanner_target_grid" class="scanner-grid-container" style="display: none;"></div>
            <div id="scanner_target_empty_placeholder" style="padding: 100px 0; color: #94a3b8; font-size: 13px; font-weight: 700; border: 1px dashed #e2e8f0; border-radius: 8px; background: #f8fafc;">
                하단 라이벌을 클릭하면 광부 셋팅 여부 조사를 거쳐 100% 보스 레이드 스펙트럼 기어로 자동 전환 대조합니다.
            </div>
        </div>
    </div>

    <div style="background: white; border-radius: 16px; padding: 20px 24px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
        <div style="font-size: 14px; font-weight: 900; color: #1e293b; margin-bottom: 14px; border-bottom:1px solid #f1f5f9; padding-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
            <span>🎯 랭킹 연동 동일 직업군 무작위 매칭 목록</span>
            <span style="font-size: 12px; font-weight: normal; color: #64748b;">(전투력 제한 완전 해제형 보스 보정 가동)</span>
        </div>
        <div id="scanner_recommend_list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px;">
        </div>
    </div>

    <div id="scanner_report" style="display: none;">
        <div id="scanner_report_content"></div>
    </div>`;
};

window.renderMetaDashboardHtml = function(metaData, myJobClass) {
    const dashboard = document.getElementById('omni_meta_dashboard');
    if (!dashboard) return;

    dashboard.style.display = 'block';
    dashboard.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
            <div style="font-size: 12px; font-weight: 800; color: #4f46e5; margin-bottom: 8px;">💎 아키타입(Archetype) 시스템 분석</div>
            <div style="font-size: 14px; font-weight: 800; color: #1e293b; margin-bottom: 4px;">나의 기준 표준 빌드 단계</div>
            <div style="font-size: 12px; color: #64748b; line-height: 1.5;">
                현재 <b>${myJobClass}</b> 직업군 내에서 나의 스냅샷은 
                <span style="color:${metaData.archetypeColor}; font-weight:bold;">${metaData.archetype}</span> 로 자동 분류됩니다.
            </div>
        </div>

        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
            <div style="font-size: 12px; font-weight: 800; color: #2563eb; margin-bottom: 8px;">📈 동급 스펙트럼 장비 메타 분석</div>
            <div style="margin-bottom: 10px;">
                <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:700; margin-bottom:4px;">
                    <span style="color:#475569;">동급 유저의 에테르넬 장비 채용비율</span>
                    <span style="color:#2563eb;">${metaData.eternelRatio}%</span>
                </div>
                <div style="width:100%; height:6px; background:#f1f5f9; border-radius:10px; overflow:hidden;">
                    <div style="width:${metaData.eternelRatio}%; height:100%; background:#2563eb; border-radius:10px;"></div>
                </div>
            </div>
            <div>
                <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:700; margin-bottom:4px;">
                    <span style="color:#475569;">동급 유저의 22성 이상 초고강화 비율</span>
                    <span style="color:#10b981;">${metaData.sf22Ratio}%</span>
                </div>
                <div style="width:100%; height:6px; background:#f1f5f9; border-radius:10px; overflow:hidden;">
                    <div style="width:${metaData.sf22Ratio}%; height:100%; background:#10b981; border-radius:10px;"></div>
                </div>
            </div>
        </div>

        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
            <div style="font-size: 12px; font-weight: 800; color: #4f46e5; margin-bottom: 8px;">🎯 성장 마일스톤(Milestone) 진단</div>
            <div style="font-size: 12px; color: #475569; line-height: 1.6;">
                • 권장 돌파 가능 보스: <b style="color:#1e293b;">${metaData.targetBoss}</b><br>
                • 6차 헥사 권장 진도율: <b style="color:#ea580c;">${metaData.targetHexa}</b><br>
                • 방어율 무시 및 스탯 균형: <span style="color:#10b981; font-weight:bold;">동급 평균 권역 안정권</span>
            </div>
        </div>
    </div>`;
};

// 💡 넥슨 데이터 원천 키 변수명 일치 렌더러
window.renderSimilarRivalsHtml = function(list, container) {
    if (!container) return;
    if (!list || list.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; padding: 20px; text-align: center; color:#94a3b8; font-size:13px; font-weight:bold;">조건을 충족하는 진짜 유저가 존재하지 않습니다.</div>`;
        return;
    }

    const subList = list.slice(0, 6);

    container.innerHTML = subList.map(user => {
        // [명세 싱크 맞춤] user.name 혼용을 지우고 넥슨 공식 리턴 명칭인 character_name으로 완전 동기화 결속합니다.
        const realName = user.character_name || user.name || "알 수 없음";
        const resolvedJobName = window.getCanonicalJobName(user.class_name || user.character_class || "미정 직업");
        const displayMetric = user.character_level 
            ? `Lv.${user.character_level}` 
            : (user.power >= 100000000 ? `${(user.power / 100000000).toFixed(1)}억` : `${Math.floor((user.power || 0) / 10000)}만`);

        return `
        <button type="button" onclick="document.getElementById('scanner_target_name').value='${realName}'; window.startComparison();" 
                style="background: #ffffff; border: 1px solid #cbd5e1; padding: 12px 14px; border-radius: 8px; color: #1e293b; font-weight: 800; cursor: pointer; transition: all 0.15s; box-shadow: 0 1px 3px rgba(0,0,0,0.04); text-align:left; display:flex; flex-direction:column; justify-content:center;"
                onmouseover="this.style.borderColor='#4f46e5'; this.style.background='#fbfcfe'; this.style.transform='translateY(-1px)';" 
                onmouseout="this.style.borderColor='#cbd5e1'; this.style.background='#ffffff'; this.style.transform='translateY(0)';">
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:5px;">
                <span style="color:#4f46e5; font-size:14px;">●</span> 
                <span style="font-size:13px; letter-spacing:-0.3px; color:#1e293b; font-weight: 800;">${realName}</span>
            </div>
            <div style="font-size:11px; color:#64748b; font-family:'Consolas', monospace; padding-left:14px;">
                ${resolvedJobName} (${displayMetric})
            </div>
        </button>
    `;}).join('');
};

window.renderScannerEquip = function(equipList, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";
    container.className = "scanner-grid-container";
    container.style.display = "grid";

    const charBox = document.createElement('div');
    charBox.className = "scanner-char-container";
    container.appendChild(charBox);

    let charImgUrl = "";
    if (containerId === 'scanner_my_grid') {
        charImgUrl = window.findAvatarUrl(window.currentSearchData);
    } else {
        charImgUrl = window.findAvatarUrl(window.lastRivalRawData);
    }

    if (charImgUrl) {
        const charImg = document.createElement('img');
        charImg.src = charImgUrl;
        charImg.className = "scanner-char-img";
        charImg.onerror = function() { 
            this.src = "https://open.nexon.net/static/maplestory/character/default-avatar.png";
        };
        charBox.appendChild(charImg);
    }

    const iGameLayout = [
        { s: "반지4", r: 1, c: 1 }, { s: "반지3", r: 2, c: 1 }, { s: "반지2", r: 3, c: 1 }, { s: "반지1", r: 4, c: 1 }, { s: "포켓 아이템", r: 5, c: 1 },
        { s: "모자", r: 1, c: 2 }, { s: "펜던트2", r: 2, c: 2 }, { s: "펜던트", r: 3, c: 2 }, { s: "무기", r: 4, c: 2 }, { s: "벨트", r: 5, c: 2 }, { s: "하의", r: 6, c: 2 },
        { s: "장갑", r: 6, c: 3 },
        { s: "엠블렘", r: 1, c: 4 }, { s: "얼굴장식", r: 2, c: 4 }, { s: "눈장식", r: 3, c: 4 }, { s: "보조무기", r: 4, c: 4 }, { s: "상의", r: 5, c: 4 }, { s: "신발", r: 6, c: 4 },
        { s: "뱃지", r: 1, c: 5 }, { s: "훈장", r: 2, c: 5 }, { s: "귀고리", r: 3, c: 5 }, { s: "어깨장식", r: 4, c: 5 }, { s: "망토", r: 5, c: 5 }, { s: "기계 심장", r: 6, c: 5 }
    ];

    const slotNameMap = { "배지": "뱃지", "펜던트1": "펜던트", "한벌옷": "상의" };

    iGameLayout.forEach(slotData => {
        const slot = document.createElement('div');
        slot.className = "scanner-item-slot";
        slot.style.gridRow = slotData.r;
        slot.style.gridColumn = slotData.c;

        let item = (equipList && Array.isArray(equipList)) ? equipList.find(eq => eq.item_equipment_slot === slotData.s || slotNameMap[eq.item_equipment_slot] === slotData.s) : null;
    
        if (item) {
            slot.innerHTML = `<img src="${item.item_icon}">`;
            slot.onmouseover = (e) => window.showOmniTooltip(e, item);
            slot.onmousemove = (e) => window.moveTooltip(e);
            slot.onmouseout = () => window.hideTooltip();
        } else {
            slot.style.background = "#f8fafc";
            slot.innerHTML = "";
        }
        container.appendChild(slot);
    });
};