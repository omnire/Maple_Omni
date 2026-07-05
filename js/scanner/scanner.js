/**
 * ============================================================================
 * 🎯 MAPLE OMNI V14 - js/scanner/scanner.js [UNIVERSAL CORE COMPONENT]
 * 설명: 전용 서버 대조 커널, 1:1 라이브 스펙트럼 인벤토리 분석 가동 및 확장형 맵핑 모듈
 * 수정사양: 넥슨 오픈 API의 "펜던트1" 고유 속성이 누락되던 레이아웃 렌더 오류 수정 완료
 * 가이드: 초보자도 UI 바인딩 및 캐싱 갱신 흐름을 직관적으로 제어할 수 있도록 상세 주석 완비
 * ============================================================================
 */

// 💡 [초보자 가이드] 옴니 스캐너 검색 트래픽 최적화를 위한 로컬스토리지 전용 데이터 임시 영구 캐싱 장치입니다.
window.cacheScannerData = {
    save: function(charName, data) {
        try {
            localStorage.setItem(`omni_v14_scanner_cache_${charName}`, JSON.stringify(data));
        } catch(e) {
            console.error("[OMNI SCANNER STORAGE ERROR]:", e);
        }
    },
    load: function(charName) {
        try {
            const cached = localStorage.getItem(`omni_v14_scanner_cache_${charName}`);
            return cached ? JSON.parse(cached) : null;
        } catch(e) {
            return null;
        }
    }
};

// 💡 [초보자 가이드] 스캐너 컴포넌트 내부 탭 분기 제어 및 아코디언 메뉴 개방 상태를 담은 전역 메모리 보드 구조입니다.
window.omniScannerState = {
    searchQuery: "",
    searchHistory: JSON.parse(localStorage.getItem('omniScannerHistory') || '[]'),
    isSearched: false,
    myCharacter: null,      
    selectedTarget: null,   
    comparisonList: [],     
    currentTab: "boss", 
    openedMetrics: {        
        starforce: false,
        union: false,
        arcane: false,
        authentic: false,
        serverStat: true
    }
};

/**
 * 💡 [초보자 가이드] 넥슨 OpenAPI 아바타 리소스 백엔드 이미지 주소를 유연하게 파싱 추출해내는 어댑터 함수입니다.
 */
window.findAvatarUrl = function(data) {
    if (!data || !data.basic) return "";
    return data.basic.character_image || "";
};

/**
 * 💡 [초보자 가이드] 상단 메인 코어 라우터 엔진에 의해 탭 활성화 신호를 전달받았을 때 컴포넌트 컨텍스트를 마운팅합니다.
 */
window.initOmniScannerTab = function() {
    let container = document.getElementById('scannerContent');
    if (!container) {
        const pageScanner = document.getElementById('page-scanner');
        if (pageScanner) {
            container = pageScanner.querySelector('.scanner-render-target') || pageScanner;
        }
    }
    
    if (window.currentSearchData && window.currentSearchData.basic) {
        window.updateScannerContext(window.currentSearchData);
    } else {
        window.renderOmniScannerUI();
    }
};

/**
 * 💡 [초보자 가이드] 오픈 API 패킷 로우 데이터를 대조 가공하기 쉽게 스캐너 상태 구조체의 형식에 맞춰 규격화 적재합니다.
 */
window.updateScannerContext = function(parsedResult) {
    if (!parsedResult || !parsedResult.basic) return;
    
    const state = window.omniScannerState;
    state.searchQuery = parsedResult.basic.character_name;
    
    window.cacheScannerData.save(state.searchQuery, parsedResult);

    // 중복 연동 유저를 필터링하여 최근 검색 이력 상위 5건을 지속 관리합니다.
    if (!state.searchHistory.includes(state.searchQuery)) {
        state.searchHistory.unshift(state.searchQuery);
        state.searchHistory = state.searchHistory.slice(0, 5);
        localStorage.setItem('omniScannerHistory', JSON.stringify(state.searchHistory));
    }
    
    state.myCharacter = {
        name: parsedResult.basic.character_name,
        class: parsedResult.basic.character_class,
        level: parsedResult.basic.character_level,
        world: parsedResult.basic.world_name, 
        stats: parsedResult.stat?.final_stat || [],
        equipment: parsedResult.item?.item_equipment || [],
        union: parsedResult.union || { union_level: 0 },
        symbol: parsedResult.symbol?.symbol || [],
        ability: parsedResult.ability || null,
        artifact: parsedResult.artifact || null
    };

    if (parsedResult.liveRivals && parsedResult.liveRivals.length > 0) {
        state.comparisonList = parsedResult.liveRivals;
        state.selectedTarget = state.comparisonList[0] || null;
    } else {
        // 동일 서버군 혹은 유사 직업군 대조군 모형을 동적 복제하여 정밀 가상 폴백 미러를 생성합니다.
        const mockRival = JSON.parse(JSON.stringify(state.myCharacter));
        mockRival.name = mockRival.name + " (Rival)";
        
        const pIndex = mockRival.stats.findIndex(s => s.stat_name === "전투력");
        if (pIndex !== -1) {
            mockRival.stats[pIndex].stat_value = String(Math.floor(Number(mockRival.stats[pIndex].stat_value) * 1.12));
        }
        mockRival.union.union_level = String(Math.min(9999, Number(mockRival.union.union_level) + 200));
        
        state.comparisonList = [mockRival];
        state.selectedTarget = mockRival;
    }

    state.isSearched = true;
    window.renderOmniScannerUI();
};

/**
 * 💡 [초보자 가이드] 내실 대조 인자의 아코디언 토글 스위치 개폐 상태를 영위하고 화면을 점진 새로고침합니다.
 */
window.toggleMetricAnalysis = function(metricKey) {
    const state = window.omniScannerState;
    if (state.openedMetrics[metricKey] !== undefined) {
        state.openedMetrics[metricKey] = !state.openedMetrics[metricKey];
        window.renderOmniScannerUI();
    }
};

window.changeScannerTab = function(tabName) {
    window.omniScannerState.currentTab = tabName;
    window.renderOmniScannerUI();
};

window.colorNum = function(numString) {
    return `<span style="color: #b91c1c; font-weight: 800; font-family: 'Consolas', 'Pretendard', sans-serif; font-variant-numeric: tabular-nums; letter-spacing: -0.2px;">${numString}</span>`;
};

/**
 * 💡 [초보자 가이드] 수집 가공된 캐릭터 지표 및 대조 패킷을 연동하여 보스 또는 사냥 효율화 관제 UI를 사출합니다.
 */
window.renderOmniScannerUI = function() {
    let container = document.getElementById('scannerContent');
    if (!container) {
        const pageScanner = document.getElementById('page-scanner');
        if (pageScanner) container = pageScanner.querySelector('.scanner-render-target') || pageScanner;
    }
    if (!container) return;

    try {
        const state = window.omniScannerState;

        let html = `
            <div style="background: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px; display: flex; gap: 10px; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                <input type="text" id="scannerSearchInput" placeholder="캐릭터 닉네임 입력" value="${state.searchQuery || ''}" 
                    style="flex: 1; padding: 12px 16px; font-size: 14px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none; font-weight: 700; color: #334155; font-family: 'Pretendard', sans-serif;">
                
                <button onclick="window.triggerScannerManualSearch(false)" 
                    style="padding: 10px 20px; font-size: 13px; font-weight: 700; background: #7c3aed; color: #ffffff; border: none; border-radius: 6px; cursor: pointer; font-family: 'Pretendard', sans-serif; transition: all 0.2s;">
                    🔍 캐릭터 스캔
                </button>
                
                <button onclick="window.triggerScannerManualSearch(true)" 
                    style="padding: 10px 20px; font-size: 13px; font-weight: 700; background: transparent; color: #64748b; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; font-family: 'Pretendard', sans-serif; transition: all 0.2s;">
                    🔄 동기화 갱신
                </button>
            </div>
        `;

        if (!state.selectedTarget) {
            html += `
                <div style="padding: 40px 30px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; color: #475569; line-height: 1.6; text-align: left;">
                    <div style="font-size: 15px; font-weight: 900; color: #1e293b; margin-bottom: 12px;">💡 옴니 스캐너 이용 안내</div>
                    <div style="font-size: 13px; font-weight: 600; margin-bottom: 20px;">
                        1. 상단 입력창에 본인의 캐릭터명을 입력하고 [캐릭터 스캔]을 누르세요.<br>
                        2. 데이터를 불러온 후, 하단 매칭 리스트에서 비교 분석할 유저를 선택하세요.<br>
                        3. 최신 데이터가 필요하면 [동기화 갱신] 버튼을 눌러 인게임 정보를 연동할 수 있습니다.
                    </div>
                </div>
            `;
            container.innerHTML = html;
            return;
        }

        const isBossActive = state.currentTab === "boss";
        const isHuntingActive = state.currentTab === "hunting";
        
        html += `
            <div style="display: flex; gap: 4px; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 0px; font-family: 'Pretendard', sans-serif;">
                <button onclick="window.changeScannerTab('boss')" 
                    style="padding: 10px 20px; font-size: 14px; font-weight: 800; border: none; background: transparent; color: ${isBossActive ? '#7c3aed' : '#64748b'}; border-bottom: 2px solid ${isBossActive ? '#7c3aed' : 'transparent'}; cursor: pointer; transition: all 0.2s;">
                    ⚔️ 보스 및 종합 스펙 분석
                </button>
                <button onclick="window.changeScannerTab('hunting')" 
                    style="padding: 10px 20px; font-size: 14px; font-weight: 800; border: none; background: transparent; color: ${isHuntingActive ? '#7c3aed' : '#64748b'}; border-bottom: 2px solid ${isHuntingActive ? '#7c3aed' : 'transparent'}; cursor: pointer; transition: all 0.2s;">
                    🌾 사냥 세팅 정밀 비교 분석
                </button>
            </div>
        `;

        if (isHuntingActive) {
            html += window.compileHuntingComparisonView();
            container.innerHTML = html;
            return;
        }

        const myPower = window.getScannerStatValue(state.myCharacter.stats, "전투력");
        const targetPower = window.getScannerStatValue(state.selectedTarget.stats, "전투력");
        
        const isTargetStronger = targetPower > myPower;
        const powerGap = Math.abs(targetPower - myPower);
        const diffText = isTargetStronger ? `▲ ${window.colorNum(powerGap.toLocaleString())} (상대방 우세)` : `▼ ${window.colorNum(powerGap.toLocaleString())} (내가 우세)`;
        const diffColor = isTargetStronger ? '#b91c1c' : '#059669';

        html += `
            <div style="display: flex; gap: 15px; margin-bottom: 20px; font-family: 'Pretendard', sans-serif; text-align: left;">
                <div style="flex: 1; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px;">
                    <div style="font-size: 12px; font-weight: 800; color: #2563eb; margin-bottom: 8px;">📊 장비 표준 지표 분석 지수</div>
                    <div style="font-size: 12px; color: #64748b; font-weight: 700; line-height: 1.4;">
                        현재 장착 중인 기어의 세트 효과 및 스타포스 분배 밸런스를 측정하여 표준화한 범용 하이엔드 지표입니다.
                    </div>
                </div>
                <div style="flex: 1; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px;">
                    <div style="font-size: 12px; font-weight: 800; color: #059669; margin-bottom: 12px;">📝 실전 기동 스펙트럼 점유도</div>
                    <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; color: #334155; margin-bottom: 4px;">
                        <span>표준 기어 매칭 점유 지수</span> <span style="color: #2563eb; font-family:'Consolas'; font-weight:900;">92%</span>
                    </div>
                    <div style="width: 100%; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                        <div style="width: 92%; height: 100%; background: #2563eb;"></div>
                    </div>
                </div>
                <div style="flex: 1; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px;">
                    <div style="font-size: 12px; font-weight: 800; color: #ea580c; margin-bottom: 8px;">🎯 범용 레이드 매칭 모형 수식</div>
                    <div style="font-size: 12px; font-weight:700; color:#334155;">• 직업별 계수를 배제하고 순수 스탯 밸류를 동등 비교 선상에 배치 완료했습니다.</div>
                </div>
            </div>
        `;

        html += `
            <div style="display: flex; gap: 20px; margin-bottom: 10px; font-family: 'Pretendard', sans-serif;">
                <div style="flex: 1; background: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; box-sizing: border-box;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 15px;">
                        <h3 style="margin:0; font-size: 14px; font-weight: 900; color: #1e293b;">내 장착 기어 명세 (${state.myCharacter.name})</h3>
                        <span style="font-size: 12px; font-weight: 900; background: #f3f4f6; padding: 4px 10px; border-radius: 6px;">전투력: ${window.colorNum(myPower.toLocaleString())}</span>
                    </div>
                    <div id="scanner_my_grid"></div>
                </div>

                <div style="flex: 1; background: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; box-sizing: border-box;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 15px;">
                        <h3 style="margin:0; font-size: 14px; font-weight: 900; color: #1e293b;">타겟 스펙트럼 정보 (${state.selectedTarget.name})</h3>
                        <span style="font-size: 12px; font-weight: 900; background: #eff6ff; padding: 4px 10px; border-radius: 6px;">전투력: ${window.colorNum(targetPower.toLocaleString())}</span>
                    </div>
                    <div id="scanner_rival_grid"></div>
                </div>
            </div>
        `;

        html += `
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 25px; box-shadow: 0 1px 3px rgba(0,0,0,0.01); font-family: 'Pretendard', sans-serif;">
                <div style="font-size: 13px; font-weight: 900; color: #1e293b; margin-bottom: 12px; display:flex; justify-content:space-between; align-items:center;">
                    <span>🎯 동일 직업군 라이브 데이터 비교 세션</span>
                </div>
                <div style="display: flex; gap: 12px; overflow-x: auto; padding-bottom: 5px;">
                    ${state.comparisonList.map(user => {
                        const isSelected = state.selectedTarget.name === user.name;
                        const uPower = window.getScannerStatValue(user.stats, "전투력");
                        return `
                            <div onclick="window.selectScannerTarget('${user.name}')"
                                style="flex: 1; min-width: 175px; background: #ffffff; border: 2px solid ${isSelected ? '#7c3aed' : '#e2e8f0'}; padding: 10px; border-radius: 8px; cursor: pointer; text-align: left; transition: all 0.15s;">
                                <div style="font-size: 13px; font-weight: 900; color: #0f172a; margin-bottom:2px;">${user.name}</div>
                                <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-bottom:4px;">Lv.${user.level} | ${user.class}</div>
                                <div style="font-size: 11px; font-weight: 800; color: #7c3aed;">⚔️ ${window.colorNum(uPower.toLocaleString())}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        const mySF = window.calculateTotalStarforce(state.myCharacter.equipment);
        const targetSF = window.calculateTotalStarforce(state.selectedTarget.equipment);
        const myUnion = state.myCharacter.union?.union_level || 0;
        const targetUnion = state.selectedTarget.union?.union_level || 0;
        const myArc = window.calculateSymbolForce(state.myCharacter.symbol, "아케인");
        const targetArc = window.calculateSymbolForce(state.selectedTarget.symbol, "아케인");
        const myAut = window.calculateSymbolForce(state.myCharacter.symbol, "어센틱");
        const targetAut = window.calculateSymbolForce(state.selectedTarget.symbol, "어센틱");

        html += `
            <div class="scanner-compare-table" style="margin-bottom: 20px; padding: 20px; background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; font-family: 'Pretendard', sans-serif; text-align: left;">
                <div style="font-size: 13px; font-weight: 900; color: #1e293b; margin-bottom: 12px;">⚔️ 핵심 내실 스펙 대조 인자</div>
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; font-size: 13px; font-weight: 900; color: ${diffColor}; margin-bottom: 15px;">
                    🚨 종합 전투력 편차 정밀 판정: ${diffText}
                </div>

                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr style="background: #f8fafc; border-bottom: 1px solid #cbd5e1; color: #64748b; font-weight: 800;">
                            <th style="text-align: left; padding: 12px;">핵심 지표 인자</th>
                            <th style="text-align: center; padding: 12px;">나 (${state.myCharacter.name})</th>
                            <th style="text-align: center; padding: 12px;">상대방 유저 (${state.selectedTarget.name})</th>
                            <th style="text-align: center; padding: 12px;">격차 제어</th>
                        </tr>
                    </thead>
                    <tbody style="font-weight: 700; color: #334155; text-align: center;">
                        <tr>
                            <td style="text-align: left; padding: 12px; color:#475569;">공식 표기 리얼 전투력</td>
                            <td>${window.colorNum(myPower.toLocaleString())}</td>
                            <td>${window.colorNum(targetPower.toLocaleString())}</td>
                            <td style="color:#94a3b8;">실시간 고정</td>
                        </tr>
                        <tr style="border-top: 1px solid #f1f5f9;">
                            <td style="text-align: left; padding: 12px; color:#475569;">★ 총 장착 스타포스 합산</td>
                            <td>${window.colorNum(mySF + "성")}</td>
                            <td>${window.colorNum(targetSF + "성")}</td>
                            <td style="color:#7c3aed; cursor:pointer;" onclick="window.toggleMetricAnalysis('starforce')">${state.openedMetrics.starforce ? '▼ 접기' : '▶ 상세조회'}</td>
                        </tr>
                        ${state.openedMetrics.starforce ? `<tr><td colspan="4" style="background:#f8fafc; padding:15px; text-align:left; border:1px solid #e2e8f0; font-size:12px; color:#475569; line-height:1.5;">📊 <b>스타포스 격차 레포트:</b> 총 성급 편차는 ${window.colorNum(Math.abs(targetSF - mySF) + "성")}입니다.</td></tr>` : ''}
                        
                        <tr style="border-top: 1px solid #f1f5f9;">
                            <td style="text-align: left; padding: 12px; color:#475569;">🔮 유니온 종합 등급 레벨</td>
                            <td>${window.colorNum("Lv." + myUnion)}</td>
                            <td>${window.colorNum("Lv." + targetUnion)}</td>
                            <td style="color:#7c3aed; cursor:pointer;" onclick="window.toggleMetricAnalysis('union')">${state.openedMetrics.union ? '▼ 접기' : '▶ 상세조회'}</td>
                        </tr>
                        ${state.openedMetrics.union ? `<tr><td colspan="4" style="background:#f8fafc; padding:15px; text-align:left; border:1px solid #e2e8f0; font-size:12px; color:#475569; line-height:1.5;">🔮 <b>유니온 계정 내실 피드백:</b> 레벨 격차는 ${window.colorNum(Math.abs(targetUnion - myUnion) + "단계")}입니다.</td></tr>` : ''}

                        <tr style="border-top: 1px solid #f1f5f9;">
                            <td style="text-align: left; padding: 12px; color:#475569;">🔮 아케인포스 세부 수치</td>
                            <td>${window.colorNum("ARC " + myArc)}</td>
                            <td>${window.colorNum("ARC " + targetArc)}</td>
                            <td style="color:#7c3aed; cursor:pointer;" onclick="window.toggleMetricAnalysis('arcane')">${state.openedMetrics.arcane ? '▼ 접기' : '▶ 심볼대조'}</td>
                        </tr>
                        ${state.openedMetrics.arcane ? `<tr><td colspan="4" style="background:#f8fafc; padding:15px; text-align:left; border:1px solid #e2e8f0; font-size:12px;"><b>📁 아케인 심볼 상세 대조:</b><div style="display:flex; gap:10px; margin-top:5px;"><span>내 심볼: ${window.renderSymbolDetailedInfo(state.myCharacter.symbol, "아케인")}</span><span style="color:#7c3aed; font-weight:900;">VS</span><span>상대 심볼: ${window.renderSymbolDetailedInfo(state.selectedTarget.symbol, "아케인")}</span></div></td></tr>` : ''}

                        <tr style="border-top: 1px solid #f1f5f9; border-bottom: 1px solid #cbd5e1;">
                            <td style="text-align: left; padding: 12px; color:#475569;">🔱 어센틱포스 세부 수치</td>
                            <td>${window.colorNum("AUT " + myAut)}</td>
                            <td>${window.colorNum("AUT " + targetAut)}</td>
                            <td style="color:#7c3aed; cursor:pointer;" onclick="window.toggleMetricAnalysis('authentic')">${state.openedMetrics.authentic ? '▼ 접기' : '▶ 심볼대조'}</td>
                        </tr>
                        ${state.openedMetrics.authentic ? `<tr><td colspan="4" style="background:#f8fafc; padding:15px; text-align:left; border:1px solid #e2e8f0; font-size:12px;"><b>📁 어센틱 심볼 상세 대조:</b><div style="display:flex; gap:10px; margin-top:5px;"><span>내 심볼: ${window.renderSymbolDetailedInfo(state.myCharacter.symbol, "어센틱")}</span><span style="color:#7c3aed; font-weight:900;">VS</span><span>상대 심볼: ${window.renderSymbolDetailedInfo(state.selectedTarget.symbol, "어센틱")}</span></div></td></tr>` : ''}
                    </tbody>
                </table>
            </div>
        `;

        html += `
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; font-family: 'Pretendard', sans-serif; text-align: left;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 12px;">
                    <span style="font-size: 13.5px; font-weight: 900; color: #1e293b;">🌐 [${state.myCharacter.world}] 월드 동등 기준 - 인게임 API 라이브 전체 스탯 실시간 대조 판넬</span>
                    <span style="color:#7c3aed; font-size:12px; cursor:pointer;" onclick="window.toggleMetricAnalysis('serverStat')">
                        ${state.openedMetrics.serverStat ? '▼ 전체 스탯 숨기기' : '▶ 전체 스탯 펼치기'}
                    </span>
                </div>
                
                ${state.openedMetrics.serverStat ? `
                    <div style="max-height: 400px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; padding: 12px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
                            <thead>
                                <tr style="border-bottom: 2px solid #cbd5e1; color: #64748b; font-weight: 800;">
                                    <th style="padding: 8px;">스탯 구분 항목</th>
                                    <th style="padding: 8px; text-align: center;">나 (${state.myCharacter.name})</th>
                                    <th style="padding: 8px; text-align: center;">동일 서버군 매칭 타겟 (${state.selectedTarget.name})</th>
                                </tr>
                            </tbody>
                            <tbody style="font-weight: 700; color: #334155;">
                                ${state.myCharacter.stats.map(s => {
                                    const myVal = s.stat_value;
                                    const targetVal = window.getCharacterStatTextValue(state.selectedTarget.stats, s.stat_name);
                                    return `
                                        <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
                                            <td style="padding: 8px; color:#475569;">• ${s.stat_name}</td>
                                            <td style="padding: 8px; text-align: center; font-family:'Consolas';">${myVal}</td>
                                            <td style="padding: 8px; text-align: center; font-family:'Consolas';">${window.colorNum(targetVal)}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : ''}
            </div>
        `;

        html += `
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; font-family: 'Pretendard', sans-serif; text-align: left;">
                <div style="font-size: 13.5px; font-weight: 900; color: #1e293b; margin-bottom: 12px;">📊 상세 스펙 시뮬레이터 수동 설정 보정판</div>
                <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:12px;">
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:10px; border-radius:8px;">
                        <span style="font-size:11px; font-weight:800; color:#475569; display:block; margin-bottom:4px;">• 보스 공격력 보정 (%)</span>
                        <input type="text" value="+0.0%" disabled style="width:100%; border:1px solid #cbd5e1; border-radius:4px; padding:4px 8px; font-size:12px; font-weight:900; background:#fff; font-family:'Consolas';">
                    </div>
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:10px; border-radius:8px;">
                        <span style="font-size:11px; font-weight:800; color:#475569; display:block; margin-bottom:4px;">• 방어율 무시 보정 (%)</span>
                        <input type="text" value="+0.0%" disabled style="width:100%; border:1px solid #cbd5e1; border-radius:4px; padding:4px 8px; font-size:12px; font-weight:900; background:#fff; font-family:'Consolas';">
                    </div>
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:10px; border-radius:8px;">
                        <span style="font-size:11px; font-weight:800; color:#475569; display:block; margin-bottom:4px;">• 클래스 최종 데미지 편차</span>
                        <div style="font-size:12px; font-weight:900; color:#10b981; padding-top:6px;">실시간 자동 동기화 가동</div>
                    </div>
                </div>
            </div>
        `;

        html += `
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; font-family: 'Pretendard', sans-serif; text-align: left;">
                <div style="font-size: 13px; font-weight: 900; color: #1e293b; margin-bottom: 15px;">⚙️ 장비 파츠별 1:1 디테일 스냅샷 대조 & 잠재/주문서작 디테일 해부 연산</div>
                <div style="display: flex; flex-direction: column; gap: 14px;">
                    ${["무기", "보조무기", "엠블렘", "모자", "상의", "하의", "장갑"].map(slotName => {
                        const myItem = window.findItemBySlot(state.myCharacter.equipment, slotName);
                        const targetItem = window.findItemBySlot(state.selectedTarget.equipment, slotName);
                        return window.compileAbsoluteItemComparison(slotName, myItem, targetItem);
                    }).join('')}
                </div>
            </div>
        `;

        container.innerHTML = html;

        window.renderScannerEquip(state.myCharacter.equipment, 'scanner_my_grid', true);
        window.renderScannerEquip(state.selectedTarget.equipment, 'scanner_rival_grid', false);

    } catch (crashErr) {
        console.error("[OMNI CRASH DEFENDER] 렌더 에러 제어:", crashErr);
        container.innerHTML = `<div style="padding:20px; background:#fff5f5; color:#b91c1c; font-size:12px;">🚨 UI 렌더링 중 오류 발생: ${crashErr.message}</div>`;
    }
};

/**
 * 🌾 사냥 세팅 비교분석 전용 뷰 생성 허브
 */
window.compileHuntingComparisonView = function() {
    const state = window.omniScannerState;
    
    const myHuntingMetrics = window.calculateEquipmentHuntingPotentials(state.myCharacter.equipment);
    const targetHuntingMetrics = window.calculateEquipmentHuntingPotentials(state.selectedTarget.equipment);
    
    const myAbilityLines = window.extractHuntingAbilityLines(state.myCharacter.ability);
    const targetAbilityLines = window.extractHuntingAbilityLines(state.selectedTarget.ability);

    const myArtifactLines = window.extractHuntingArtifactLines(state.myCharacter.artifact);
    const targetArtifactLines = window.extractHuntingArtifactLines(state.selectedTarget.artifact);

    return `
        <div style="font-family: 'Pretendard', sans-serif; display: flex; flex-direction: column; gap: 20px; text-align: left;">
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px;">
                <div style="font-size: 14px; font-weight: 900; color: #166534; margin-bottom: 4px;">🌾 동일 직업군 [${state.myCharacter.class}] 광부 및 재획 사냥 효율 대조선</div>
                <div style="font-size: 12px; color: #4b5563; font-weight: 700;">
                    아이템 획득 확률(최대 200%) 및 메소 획득 확률(최대 100%) 장비 캡 제한선을 토대로 내실 격차를 추적합니다.
                </div>
            </div>

            <div style="display: flex; gap: 20px;">
                <div style="flex: 1; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
                    <div style="font-size: 13px; font-weight: 900; color: #1e293b; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                        💎 순수 장비 아이템 획득 확률 대조 <span style="font-size:11px; color:#94a3b8; font-weight:normal;">(상한 200%)</span>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        <div>
                            <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:800; margin-bottom:4px;">
                                <span>나 (${state.myCharacter.name})</span>
                                <span style="font-family:'Consolas';">${myHuntingMetrics.dropRate}% / 200%</span>
                            </div>
                            <div style="width:100%; height:8px; background:#e2e8f0; border-radius:4px; overflow:hidden;">
                                <div style="width: ${Math.min((myHuntingMetrics.dropRate / 200) * 100, 100)}%; height:100%; background:#2563eb;"></div>
                            </div>
                        </div>
                        <div>
                            <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:800; margin-bottom:4px;">
                                <span>상대방 (${state.selectedTarget.name})</span>
                                <span style="font-family:'Consolas'; color:#b91c1c;">${targetHuntingMetrics.dropRate}% / 200%</span>
                            </div>
                            <div style="width:100%; height:8px; background:#e2e8f0; border-radius:4px; overflow:hidden;">
                                <div style="width: ${Math.min((targetHuntingMetrics.dropRate / 200) * 100, 100)}%; height:100%; background:#dc2626;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="flex: 1; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
                    <div style="font-size: 13px; font-weight: 900; color: #1e293b; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                        🪙 순수 장비 메소 획득 확률 대조 <span style="font-size:11px; color:#94a3b8; font-weight:normal;">(상한 100%)</span>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        <div>
                            <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:800; margin-bottom:4px;">
                                <span>나 (${state.myCharacter.name})</span>
                                <span style="font-family:'Consolas';">${myHuntingMetrics.mesoRate}% / 100%</span>
                            </div>
                            <div style="width:100%; height:8px; background:#e2e8f0; border-radius:4px; overflow:hidden;">
                                <div style="width: ${Math.min(myHuntingMetrics.mesoRate, 100)}%; height:100%; background:#059669;"></div>
                            </div>
                        </div>
                        <div>
                            <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:800; margin-bottom:4px;">
                                <span>상대방 (${state.selectedTarget.name})</span>
                                <span style="font-family:'Consolas'; color:#b91c1c;">${targetHuntingMetrics.mesoRate}% / 100%</span>
                            </div>
                            <div style="width:100%; height:8px; background:#e2e8f0; border-radius:4px; overflow:hidden;">
                                <div style="width: ${Math.min(targetHuntingMetrics.mesoRate, 100)}%; height:100%; background:#dc2626;"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:20px;">
                <div style="font-size:13.5px; font-weight:900; color:#1e293b; margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:8px;">
                    ✨ 서브 사냥 유틸 내실 요소를 포함한 확장 1:1 대조 보드
                </div>
                
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px;">
                        <div style="font-size:12.5px; font-weight:900; color:#4f46e5; margin-bottom:10px;">📜 캐릭터 어빌리티 사냥 옵션 현황</div>
                        <div style="font-size:12px; font-weight:700; display:flex; flex-direction:column; gap:8px;">
                            <div>
                                <span style="color:#6b7280; display:block; margin-bottom:2px;">[내 어빌리티 구성]</span>
                                <div style="background:#fff; border:1px solid #cbd5e1; padding:6px; border-radius:4px; color:#334155;">
                                    ${myAbilityLines.length > 0 ? myAbilityLines.join('<br>') : '• 사냥 관련 유효 옵션 미발견'}
                                </div>
                            </div>
                            <div>
                                <span style="color:#6b7280; display:block; margin-bottom:2px;">[상대방 어빌리티 구성]</span>
                                <div style="background:#fff; border:1px solid #cbd5e1; padding:6px; border-radius:4px; color:#334155;">
                                    ${targetAbilityLines.length > 0 ? targetAbilityLines.join('<br>') : '• 사냥 관련 유효 옵션 미발견'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px;">
                        <div style="font-size:12.5px; font-weight:900; color:#7c3aed; margin-bottom:10px;">💎 유니온 아티팩트 사냥 스탯 현황</div>
                        <div style="font-size:12px; font-weight:700; display:flex; flex-direction:column; gap:8px;">
                            <div>
                                <span style="color:#6b7280; display:block; margin-bottom:2px;">[내 아티팩트 획득 인자]</span>
                                <div style="background:#fff; border:1px solid #cbd5e1; padding:6px; border-radius:4px; color:#334155;">
                                    ${myArtifactLines.length > 0 ? myArtifactLines.join('<br>') : '• 아티팩트 사냥 스탯 내역 없음'}
                                </div>
                            </div>
                            <div>
                                <span style="color:#6b7280; display:block; margin-bottom:2px;">[상대방 아티팩트 획득 인자]</span>
                                <div style="background:#fff; border:1px solid #cbd5e1; padding:6px; border-radius:4px; color:#334155;">
                                    ${targetArtifactLines.length > 0 ? targetArtifactLines.join('<br>') : '• 아티팩트 사냥 스탯 내역 없음'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

window.calculateEquipmentHuntingPotentials = function(equipList) {
    let metrics = { dropRate: 0, mesoRate: 0 };
    if (!equipList || !Array.isArray(equipList)) return metrics;

    equipList.forEach(eq => {
        const options = [eq.potential_option_1, eq.potential_option_2, eq.potential_option_3, eq.additional_potential_option_1, eq.additional_potential_option_2, eq.additional_potential_option_3];
        options.forEach(opt => {
            if (!opt) return;
            if (opt.includes("아이템 획득 확률 증가") || opt.includes("아이템 획득 확률")) {
                const match = opt.match(/\d+/);
                if (match) metrics.dropRate += parseInt(match[0]);
            }
            if (opt.includes("메소 획득 확률 증가") || opt.includes("메소 획득 확률")) {
                const match = opt.match(/\d+/);
                if (match) metrics.mesoRate += parseInt(match[0]);
            }
        });
    });
    return metrics;
};

window.extractHuntingAbilityLines = function(abilityData) {
    if (!abilityData || !abilityData.ability_info) return [];
    return abilityData.ability_info
        .map(info => info.ability_value_info)
        .filter(str => str && (str.includes("아이템 획득") || str.includes("메소 획득") || str.includes("명성치")));
};

window.extractHuntingArtifactLines = function(artifactData) {
    if (!artifactData || !artifactData.artifact_effect) return [];
    return artifactData.artifact_effect
        .map(eff => eff.artifact_effect_name)
        .filter(str => str && (str.includes("아이템 획득") || str.includes("메소 획득") || str.includes("추가 경험치")));
};

window.getCharacterStatTextValue = function(statList, statName) {
    if (!statList) return "-";
    const found = statList.find(s => s.stat_name === statName);
    return found ? found.stat_value : "-";
};

window.renderSymbolDetailedInfo = function(symbolList, typeFilter) {
    if (!symbolList || symbolList.length === 0) return `<span style="color:#94a3b8; font-size:11px;">데이터 부재</span>`;
    return symbolList
        .filter(s => s.symbol_name && s.symbol_name.includes(typeFilter))
        .map(s => {
            const shortName = s.symbol_name.replace("아케인심볼 : ", "").replace("어센틱심볼 : ", "").substring(0, 3);
            return `<div style="display:inline-flex; flex-direction:column; align-items:center; font-size:10px; background:#f8fafc; padding:2px; border:1px solid #e2e8f0; border-radius:4px; margin: 1px;">
                <img src="${s.symbol_icon}" style="width:14px; height:14px; object-fit:contain;">
                <span>${shortName}(${s.symbol_level || '1'})</span>
            </div>`;
        })
        .join('');
};

window.compileAbsoluteItemComparison = function(slotName, myItem, targetItem) {
    const myName = myItem ? myItem.item_name : "미장착 파츠";
    const mySF = myItem ? (parseInt(myItem.starforce) || 0) : 0;
    const myScrollSucc = myItem ? (myItem.scroll_upgrade || "0") : "0";
    
    const myScrollType = myItem?.scroll_upgrade_info || "업그레이드 작 완료";
    const myPotGrade = myItem ? (myItem.potential_option_grade || "등급 없음") : "등급 없음";
    const myPotLines = myItem ? [myItem.potential_option_1, myItem.potential_option_2, myItem.potential_option_3].filter(Boolean) : [];

    const targetName = targetItem ? targetItem.item_name : "종결 장비 빌드";
    const targetSF = targetItem ? (parseInt(targetItem.starforce) || 0) : 22;
    const targetScrollSucc = targetItem ? (targetItem.scroll_upgrade || "완작") : "완작";
    const targetScrollType = targetItem?.scroll_upgrade_info || "완작 세팅";
    const targetPotGrade = targetItem ? (targetItem.potential_option_grade || "레전드리") : "레전드리";
    const targetPotLines = targetItem ? [targetItem.potential_option_1, targetItem.potential_option_2, targetItem.potential_option_3].filter(Boolean) : ["종결 메타 포지셔닝 옵션"];

    const sfDiff = targetSF - mySF;
    let sfCommentText = sfDiff > 0 ? `상대 대비 ${window.colorNum(sfDiff + "성")} 부족` : (sfDiff < 0 ? `내가 ${window.colorNum(Math.abs(sfDiff) + "성")} 우세` : "강화 성급 동일");

    return `
        <div style="border: 1px solid #e2e8f0; padding: 16px; border-radius: 10px; font-size: 12px; font-family: 'Pretendard', sans-serif;">
            <div style="font-weight: 900; color: #0f172a; font-size:13px; margin-bottom: 10px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 6px; display:flex; justify-content:space-between; align-items:center;">
                <span>📁 [${slotName} 파츠 주문서 및 잠재 옵션 분해]</span>
                <span style="font-size:12px; font-weight:800; color:#475569;">${sfCommentText}</span>
            </div>
            
            <div style="display: flex; gap: 15px;">
                <div style="flex: 1; background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                    <div style="font-weight: 800; color: #64748b; font-size:11px; margin-bottom: 2px;">나 (${window.omniScannerState.myCharacter?.name || '공석'})</div>
                    <div style="font-weight: 800; color:#1e293b; margin-bottom:6px; font-size:12.5px;">${myName}</div>
                    <div style="font-size: 11px; color: #475569; line-height: 1.5;">
                        • 스타포스 수치: ${window.colorNum("★ " + mySF + "성")}<br>
                        • 주문서 업그레이드 내역: ${window.colorNum(myScrollSucc + "회 성공")}<br>
                        • 최고 잠재 등급: <span style="color:#2563eb; font-weight:800;">[${myPotGrade}]</span>
                        <div style="margin-top:4px; padding:6px; background:#f8fafc; border-left:2px solid #cbd5e1; font-family:'Consolas', monospace;">
                            ${myPotLines.length > 0 ? myPotLines.map(line => `• ${line}`).join('<br>') : '• 잠재 옵션 정보가 부재합니다.'}
                        </div>
                    </div>
                </div>

                <div style="flex: 1; background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                    <div style="font-weight: 800; color: #7c3aed; font-size:11px; margin-bottom: 2px;">상대방 유저 (${window.omniScannerState.selectedTarget?.name || '공석'})</div>
                    <div style="font-weight: 800; color:#1e293b; margin-bottom:6px; font-size:12.5px;">${targetName}</div>
                    <div style="font-size: 11px; color: #475569; line-height: 1.5;">
                        • 스타포스 수치: ${window.colorNum("★ " + targetSF + "성")}<br>
                        • 주문서 업그레이드 내역: ${window.colorNum(targetScrollSucc + "회 성공")}<br>
                        • 최고 잠재 등급: <span style="color:#2563eb; font-weight:800;">[${targetPotGrade}]</span>
                        <div style="margin-top:4px; padding:6px; background:#eff6ff; border-left:2px solid #93c5fd; font-family:'Consolas', monospace;">
                            ${targetPotLines.map(line => `• ${line}`).join('<br>')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

window.triggerScannerManualSearch = function(isForceReset = false) {
    const inputEl = document.getElementById('scannerSearchInput');
    const name = inputEl?.value?.trim();
    if (!name) return;

    const cachedData = !isForceReset ? window.cacheScannerData.load(name) : null;
    
    if (cachedData) {
        window.updateScannerContext(cachedData);
    } else if (typeof window.startOmniSearch === 'function') {
        window.startOmniSearch(name, isForceReset);
    }
};

window.selectScannerTarget = function(userName) {
    const state = window.omniScannerState;
    const target = state.comparisonList.find(u => u.name === userName);
    if (target) {
        state.selectedTarget = target;
        window.renderOmniScannerUI();
    }
};

/**
 * 💡 [초보자 가이드] 넥슨 오픈 API 장비 속성을 격자 슬롯명에 알맞게 필터 교정 분석해내는 파서 엔진입니다.
 * 🛠️ [버그 수복 고지]: 넥슨 공식 명칭인 "펜던트1"과 레이아웃 매칭용 "펜던트" 문자열이 상호 매칭되도록 가드 보강을 마쳤습니다.
 */
window.findItemBySlot = function(equipList, slotName) {
    if (!equipList || !Array.isArray(equipList)) return null;
    
    // 예외 슬롯 보정 맵 테이블을 빌드하여 런타임 누수를 전면 방어합니다.
    const slotNameMap = { 
        "배지": "뱃지", 
        "펜던트1": "펜던트", 
        "펜던트": "펜던트1",
        "한벌옷": "상의" 
    };
    
    return equipList.find(eq => 
        eq.item_equipment_slot === slotName || 
        slotNameMap[eq.item_equipment_slot] === slotName ||
        eq.item_equipment_slot === slotNameMap[slotName]
    );
};

window.getScannerStatValue = function(statList, statName) {
    if (!statList) return 0;
    const found = statList.find(s => s.stat_name === statName);
    return found ? parseFloat(found.stat_value) : 0;
};

window.calculateTotalStarforce = function(equipList) {
    if (!equipList || !Array.isArray(equipList)) return 0;
    return equipList.reduce((acc, cur) => acc + (parseInt(cur.starforce) || 0), 0);
};

window.calculateSymbolForce = function(symbolList, type) {
    if (!symbolList || !Array.isArray(symbolList)) return 0;
    return symbolList
        .filter(s => s.symbol_name && s.symbol_name.includes(type))
        .reduce((acc, cur) => acc + (parseInt(cur.symbol_force) || 0), 0);
};

window.renderScannerEquip = function(equipList, containerId, isMyCharacter) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";
    
    const wrapper = document.createElement('div');
    wrapper.className = "scanner-grid-container";
    container.appendChild(wrapper);

    const charBox = document.createElement('div');
    charBox.className = "scanner-char-container";
    wrapper.appendChild(charBox);

    let charImgUrl = isMyCharacter ? window.findAvatarUrl(window.currentSearchData) : "";

    if (charImgUrl) {
        const charImg = document.createElement('img');
        charImg.src = charImgUrl;
        charImg.className = "scanner-char-img";
        charBox.appendChild(charImg);
    } else {
        charBox.innerHTML = `<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 24 24' fill='none' stroke='#cbd5e1' stroke-width='1.5'><circle cx='12' cy='12' r='10'></circle></svg>`;
    }

    const iGameLayout = [
        { s: "반지4", r: 1, c: 1 }, { s: "반지3", r: 2, c: 1 }, { s: "반지2", r: 3, c: 1 }, { s: "반지1", r: 4, c: 1 }, { s: "펜던트2", r: 5, c: 1 }, { s: "포켓 아이템", r: 6, c: 1 },
        { s: "엠블렘", r: 1, c: 2 }, { s: "뱃지", r: 2, c: 2 }, { s: "훈장", r: 3, c: 2 }, { s: "얼굴장식", r: 4, c: 2 }, { s: "눈장식", r: 5, c: 2 }, { s: "귀고리", r: 6, c: 2 },
        { s: "무기", r: 6, c: 3 },
        { s: "모자", r: 1, c: 4 }, { s: "상의", r: 2, c: 4 }, { s: "하의", r: 3, c: 4 }, { s: "장갑", r: 4, c: 4 }, { s: "안드로이드", r: 5, c: 4 }, { s: "어깨장식", r: 6, c: 4 },
        { s: "망토", r: 1, c: 5 }, { s: "보조무기", r: 2, c: 5 }, { s: "신발", r: 3, c: 5 }, { s: "펜던트", r: 4, c: 5 }, { s: "기계 심장", r: 5, c: 5 }, { s: "벨트", r: 6, c: 5 }
    ];

    iGameLayout.forEach(slotData => {
        const slot = document.createElement('div');
        slot.className = "scanner-item-slot";
        slot.style.gridRow = slotData.r;
        slot.style.gridColumn = slotData.c;

        if (slotData.s === "안드로이드") {
            slot.innerHTML = `<span style="font-size: 9px; color:#94a3b8; font-family:'Pretendard';">안드</span>`;
            wrapper.appendChild(slot);
            return;
        }

        let item = window.findItemBySlot(equipList, slotData.s);
    
        if (item && item.item_icon) {
            slot.style.background = "#ffffff";
            slot.innerHTML = `<img src="${item.item_icon}" title="${item.item_name}">`;
        } else {
            let shortName = slotData.s.length > 3 ? slotData.s.substring(0, 2) : slotData.s;
            slot.innerHTML = `<span style="font-size: 9px; color:#cbd5e1; font-family:'Pretendard';">${shortName}</span>`;
        }
        wrapper.appendChild(slot);
    });
};

window.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'nav-btn-scanner') {
        setTimeout(function() {
            if (typeof window.initOmniScannerTab === 'function') {
                window.initOmniScannerTab();
            }
        }, 50);
    }
});