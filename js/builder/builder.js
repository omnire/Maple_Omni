/**
 * ============================================================================
 * 🛠️ MAPLE OMNI V14 - builder.js [INTEGRATED SIMULATOR ENGINE]
 * 설명: 보스 프리셋 조건부 자동 기계 선별, 스타포스 및 주문서 수식 시뮬레이션
 * 규칙: 상세 스텟 아래 배치 가이드 및 초보자 가독성 주석 완전 고정 적용
 * ============================================================================
 */

// 💡 [버그 해결 코어] 외부 모듈에서 데이터를 넘겨주지 못할 때 builder.js가 완전히 먹통이 되는 것을 막는 안전장치입니다.
window.convertEquipmentToBossSet = function(equipmentArray) {
    return equipmentArray || [];
};

// 💡 [초보자 가이드] 시뮬레이터 내부에서 가상으로 변경된 수치들을 실시간 누적 저장하는 가상 메모리 변수 저장소입니다.
window.omniSimMemory = {
    selectedSlot: null,      // 사용자가 시뮬레이션을 위해 인벤토리 보드에서 클릭하여 선택한 현재 장비 슬롯 파츠명
    selectedItem: null,      // 선택된 슬롯 내부의 실제 아이템 원본 데이터 객체
    activePreset: 2,         // 기본 활성화되어 표기될 프리셋 번호 (스냅샷 기준 프리셋 2번 지정)
    
    // 사용자가 제어 패널을 통해 조작 중인 임시 스펙 수치 저장소
    customStats: {
        starforce: 17,
        str: 0, dex: 0, int: 0, luk: 0,
        atk: 0, matk: 0, allStat: 0,
        potentialGrade: "레전드리",
        additionalGrade: "유니크"
    },
    
    // 원본 대비 변경 스펙 증가량 수치 결과 (SPEC DIFF ANALYSIS 연동부)
    computedDelta: {
        totalPower: 0,
        mainStat: 0,
        attackPower: 0
    }
};

/**
 * 💡 [초보자 가이드] 핵심 요구사항 알고리즘 수식 엔진
 * 프리셋 1, 2, 3번 데이터를 스캔하여 잠재옵션 중 [아획/메획 옵션이 2개 이상 장착된] 광부용 프리셋을 감지하고,
 * 이를 제외한 순수 "보스 레이드용 주력 스탯 세팅 프리셋"을 자동 감지하여 1순위 타겟으로 변환합니다.
 */
window.findOptimalBossPreset = function(itemData) {
    if (!itemData) return { presetNum: 2, list: [] };

    const presetSlots = [
        { num: 1, data: itemData.item_equipment_preset_1 || [] },
        { num: 2, data: itemData.item_equipment_preset_2 || [] },
        { num: 3, data: itemData.item_equipment_preset_3 || [] }
    ];

    let fallbackPreset = null;

    for (let i = 0; i < presetSlots.length; i++) {
        const slot = presetSlots[i];
        if (slot.data.length === 0) continue;
        if (!fallbackPreset) fallbackPreset = slot;

        let farmingItemCount = 0; 
        slot.data.forEach(gear => {
            const allPotentials = [
                gear.potential_option_1, gear.potential_option_2, gear.potential_option_3,
                gear.additional_potential_option_1, gear.additional_potential_option_2, gear.additional_potential_option_3
            ].join(' ');

            if (allPotentials.includes("아이템 드롭률") || allPotentials.includes("메소 획득량")) {
                farmingItemCount++;
            }
        });

        // 💡 아획/메획 적용 아이템이 2개 미만인 세팅을 발견하면 "순수 보스 레이드 세팅"으로 간주하고 즉각 반환합니다!
        if (farmingItemCount < 2) {
            return { presetNum: slot.num, list: slot.data };
        }
    }

    if (fallbackPreset) return { presetNum: fallbackPreset.num, list: fallbackPreset.data };
    return { presetNum: 2, list: itemData.item_equipment || [] };
};

/**
 * 💡 [초보자 가이드] 내비게이션 탭에서 '옴니빌더' 스위칭 시 최초 화면 뼈대를 구성하는 메인 시동 함수입니다.
 *      정밀 3열 분할 대시보드 구도를 안전하게 생성합니다.
 */
window.initOmniBuilderTab = function() {
    const rootBox = document.getElementById('builderContent');
    if (!rootBox) return;

    const searchContext = window.currentSearchData;

    // 만약 데이터가 아직 스캔되지 않았다면 가상 테스트용 디폴트 패킷 세션 자동 강제 주입
    if (!searchContext) {
        window.currentSearchData = {
            basic: { character_name: "뽀우엉", character_level: 288, world_name: "엘리시움", character_class: "키네시스", character_image: "" },
            stat: { final_stat: [{ stat_name: "전투력", stat_value: "120435566" }] },
            item: { item_equipment: [] }
        };
    }

    const itemContext = window.currentSearchData.item || {};
    const bossPresetResult = window.findOptimalBossPreset(itemContext);
    
    // 현재 세션 아이템 목록 세팅 복사
    window.builderCurrentList = bossPresetResult.list.length > 0 ? bossPresetResult.list : window.convertEquipmentToBossSet([]);

    // 메인 빌더 3열 레이아웃 구조 하드 렌더링 개시
    rootBox.innerHTML = `
        <!-- 👤 최상단 캐릭터 기본 요약 바 프로필 뷰 -->
        <div style="background: #ffffff; border-radius: 16px; padding: 16px 24px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; width: 100%; box-sizing: border-box; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 14px;">
                <div style="width: 46px; height: 46px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow:hidden;">
                    <img src="${window.findAvatarUrl ? window.findAvatarUrl(window.currentSearchData) : ''}" style="height: 110%; width: auto; object-fit: contain;" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\\'http://www.w3.org/2000/svg\\\' width=\\\'24\\\' height=\\\'24\\\' viewBox=\\\'0 0 24 24\\\' fill=\\\'none\\\' stroke=\\\'%23cbd5e1\\\' stroke-width=\\\'2\\\'><circle cx=\\\'12\\\' cy=\\\'12\\\' r=\\\'10\\\'/><path d=\\\'M16 12a4 4 0 0 1-8 0\\\'/></svg>'">
                </div>
                <div>
                    <div style="font-size: 14px; font-weight: 900; color: #0f172a; display: flex; align-items: center; gap: 6px;">
                        <span>${window.currentSearchData.basic.character_name}</span>
                        <span style="font-size: 10px; background: #fff1f2; color: #f43f5e; padding: 2px 6px; border-radius: 4px; font-weight: 800;">● 보스 세팅</span>
                    </div>
                    <div style="font-size: 11px; color: #64748b; font-weight: 700; margin-top: 3px;">
                        Lv.${window.currentSearchData.basic.character_level || 288} · ${window.currentSearchData.basic.world_name || '엘리시움'} · ${window.currentSearchData.basic.character_class || '키네시스'}
                    </div>
                </div>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
                <button style="background: #ffffff; border: 1px solid #cbd5e1; padding: 8px 14px; border-radius: 8px; font-size: 11.5px; font-weight: 800; color: #334155; cursor: pointer;">📋 API 보스셋팅 기록</button>
                <button onclick="window.forceRefreshScannerData && window.forceRefreshScannerData()" style="background: #2563eb; color: #ffffff; border: none; padding: 8px 14px; border-radius: 8px; font-size: 11.5px; font-weight: 800; cursor: pointer;">🔄 API 데이터 갱신</button>
            </div>
        </div>

        <!-- 3열 본진 컨테이너 시스템 마운트 -->
        <div class="builder-three-column-grid">
            
            <!-- 🧱 [좌측 1열]: 상세 스텟 분석 및 실시간 적용 도핑 고정판 -->
            <div style="display: flex; flex-direction: column; gap: 20px; width: 100%;">
                
                <!-- Card 1: 상세 스텟 분석 보드 -->
                <div class="builder-master-card">
                    <div style="font-size: 13px; font-weight: 900; color: #1e293b; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                        <span>📝 상세 스텟 분석</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 1px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                        ${window.getBuilderStatRowsHtml()}
                    </div>
                </div>

                <!-- Card 2: [요구사항 가이드] 상세 스텟 스코어보드 바로 수평 아랫구역 배치용 도핑 모듈 -->
                <div class="builder-master-card">
                    <div style="font-size: 12.5px; font-weight: 900; color: #0f766e; margin-bottom: 12px; display: flex; align-items: center; gap: 4px;">
                        <span>🧪 실시간 적용 도핑</span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px 6px; justify-items: center;">
                        ${window.getDopingSelectorIconsHtml()}
                    </div>
                </div>

                <!-- Card 3: 실시간 세트 효과 매칭 현황판 -->
                <div class="builder-master-card">
                    <div style="font-size: 12.5px; font-weight: 900; color: #475569; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
                        <span>✨ 실시간 세트 효과 매칭</span>
                    </div>
                    <div style="font-size: 11.5px; line-height: 1.6;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-weight: 800;">
                            <span style="color:#334155;">• 보스 장신구 세트</span>
                            <span style="color:#2563eb;">2세트 적용</span>
                        </div>
                        <div style="color: #94a3b8; font-size: 10px; padding-left: 8px; font-weight: 700; margin-bottom: 8px;">[ 도미네이터 펜던트, 크리스탈 웬투스 뱃지 ]</div>
                        
                        <div style="display: flex; justify-content: space-between; font-weight: 800;">
                            <span style="color:#334155;">• 칠흑의 보스 세트</span>
                            <span style="color:#2563eb;">3세트 적용</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 🧱 [중앙 2열]: 인벤토리 장착 보드판 및 스펙 델타 계측 레이아웃 -->
            <div style="display: flex; flex-direction: column; gap: 20px; width: 100%;">
                <div class="builder-master-card" style="text-align: center;">
                    <div style="font-size: 13px; font-weight: 900; color: #1e293b; text-align: left; margin-bottom: 14px; display: flex; align-items: center; gap: 6px;">
                        <span>🎒 인벤토리 장착 보드</span>
                    </div>
                    
                    <!-- 인게임 장비 UI 프레임 매핑 레이아웃 공간 로드 -->
                    <div id="builder_inventory_grid" class="builder-inventory-grid-container">
                        <!-- window.renderBuilderInventoryGrid() 함수를 통해 동적 데이터 주입 -->
                    </div>

                    <!-- 프리셋 체인저 하단 스위치 캡처 스타일 형상화 -->
                    <div style="display: inline-flex; background: #f1f5f9; padding: 4px; border-radius: 8px; margin-top: 16px; gap: 4px;">
                        <button onclick="window.switchBuilderPreset(1)" id="btn_preset_1" class="builder-preset-pill">프리셋 1</button>
                        <button onclick="window.switchBuilderPreset(2)" id="btn_preset_2" class="builder-preset-pill active">프리셋 2</button>
                        <button onclick="window.switchBuilderPreset(3)" id="btn_preset_3" class="builder-preset-pill">프리셋 3</button>
                    </div>
                    
                    <!-- 스펙 변동폭 측정판 전광 대시보드 스킨 복원 -->
                    <div style="border-top: 1px dashed #e2e8f0; margin-top: 20px; padding-top: 16px; text-align: left;">
                        <div style="font-size: 12px; font-weight: 900; color: #2563eb; letter-spacing: 0.5px; margin-bottom: 12px;">📊 SPEC DIFF ANALYSIS</div>
                        <div style="display: flex; flex-direction: column; gap: 10px; font-size: 12px; font-weight: 800; color: #475569;">
                            <div style="display: flex; justify-content: space-between;">
                                <span>추정 전투력 증감</span>
                                <span id="delta_power_text" style="color: #e11d48; font-weight: 900;">+0</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span>추정 주스탯 증감</span>
                                <span id="delta_stat_text" style="color: #e11d48; font-weight: 900;">+0</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span>추정 공/마 증감</span>
                                <span id="delta_att_text" style="color: #e11d48; font-weight: 900;">+0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 🧱 [우측 3열]: 가상 옵션 커스텀 빌딩 제어 모드 컨트롤 보드 -->
            <div style="display: flex; flex-direction: column; gap: 20px; width: 100%;">
                <div class="builder-master-card" id="builder_right_control_card">
                    <!-- 초기 상태 공백 알림창 표출 영역 -->
                    <div id="builder_right_empty_view" style="text-align: center; padding: 120px 0; color: #94a3b8; font-weight: 700; font-size: 12px; line-height: 1.6;">
                        <div style="font-size: 28px; margin-bottom: 10px;">🖱️</div>
                        왼쪽 인벤토리 장착 보드에서<br>강화 시뮬레이션을 진행할<br>장비 슬롯 파츠를 선택해 주세요.
                    </div>
                    
                    <!-- 아이템 슬롯 선택 시 연동 뷰 활성화 인터랙션 엔진 -->
                    <div id="builder_right_interactive_view" style="display: none; flex-direction: column; gap: 16px;">
                        <div style="font-size: 12.5px; font-weight: 900; color: #1e293b; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                            <span>🛠️ 슬롯 설정을 선택하세요</span>
                        </div>
                        
                        <!-- 선택된 슬롯 정보 요약 뱃지 상자 -->
                        <div style="display: flex; align-items: center; gap: 10px; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                            <div id="control_item_icon_frame" style="width: 36px; height: 36px; background: white; border: 1.5px solid #cbd5e1; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
                                <img src="" style="max-width: 85%; max-height: 85%;">
                            </div>
                            <div style="min-width: 0; flex: 1;">
                                <div id="control_item_name_text" style="font-size: 12px; font-weight: bold; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">-</div>
                                <div id="control_item_slot_text" style="font-size: 10px; color: #64748b; font-weight: 700; margin-top: 1px;">부위: -</div>
                            </div>
                        </div>

                        <!-- 검색창 구조 바인딩 -->
                        <div style="position: relative;">
                            <input type="text" value="🔍 아이템 이름 검색 후 목록을 여세요." disabled style="width: 100%; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; font-size: 11px; background: #f8fafc; color: #64748b; font-weight: 700; box-sizing: border-box;">
                            <select disabled style="width: 100%; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px; font-size: 11px; margin-top: 6px; background: #f8fafc; color: #94a3b8; outline: none;"><option>기본 장착 아이템 사양 프로필 유지</option></select>
                        </div>

                        <!-- 추가옵션 추옵 상세 설정 조작 인풋 매트릭스 보드 구성 -->
                        <div style="border: 1px solid #fbcfe8; background: #fff5f8; border-radius: 10px; padding: 12px;">
                            <div style="font-size: 11.5px; font-weight: 900; color: #be185d; margin-bottom: 8px; display: flex; align-items: center; gap: 4px; justify-content: center;">
                                <span>🔥 추가옵션 (추옵) 상세 설정</span>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; font-weight: bold; color: #475569;">
                                <div>STR <input type="number" id="input_add_str" class="builder-mini-input" value="0" oninput="window.runLiveCalculationLoop()"></div>
                                <div>DEX <input type="number" id="input_add_dex" class="builder-mini-input" value="0" oninput="window.runLiveCalculationLoop()"></div>
                                <div>INT <input type="number" id="input_add_int" class="builder-mini-input" value="0" oninput="window.runLiveCalculationLoop()"></div>
                                <div>LUK <input type="number" id="input_add_luk" class="builder-mini-input" value="0" oninput="window.runLiveCalculationLoop()"></div>
                                <div>공격력 <input type="number" id="input_add_atk" class="builder-mini-input" value="0" oninput="window.runLiveCalculationLoop()"></div>
                                <div>마력 <input type="number" id="input_add_matk" class="builder-mini-input" value="0" oninput="window.runLiveCalculationLoop()"></div>
                                <div style="grid-column: 1 / -1;">올스탯% <input type="number" id="input_add_all" class="builder-mini-input" value="0" oninput="window.runLiveCalculationLoop()"></div>
                            </div>
                        </div>

                        <!-- 스타포스 수치 카운터 증감 스위치 장치 컴포넌트 -->
                        <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px;">
                            <span style="font-size: 11.5px; font-weight: 800; color: #334155;">스타포스 고정 조정:</span>
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <button onclick="window.adjustStarforceStep(-1)" class="builder-square-btn">-</button>
                                <span id="interactive_sf_label" style="font-size: 12px; font-weight: 900; color: #2563eb; min-width: 40px; text-align: center;">17성</span>
                                <button onclick="window.adjustStarforceStep(1)" class="builder-square-btn">+</button>
                            </div>
                        </div>

                        <button style="width: 100%; border: 1px solid #cbd5e1; background: #ffffff; padding: 8px; border-radius: 8px; font-size: 11.5px; font-weight: bold; color: #334155; cursor: pointer;">주문서 상세 설정 ⚙️</button>

                        <!-- 잠재능력 고정 사양 마스킹 처리선 -->
                        <div style="border-top: 1px dashed #e2e8f0; padding-top: 10px; font-size: 11.5px; font-weight: 800; color: #475569; display:flex; flex-direction:column; gap:6px;">
                            <div>✨ 잠재능력 설정 : <span style="color:#16a34a; font-weight:900;">레전드리 고정 사양</span></div>
                            <div>🛡️ 에디셔널 잠재능력 : <span style="color:#b45309; font-weight:900;">유니크 고정 사양</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 기본 그리드 장착 보드판 동적 빌드 개시
    window.renderBuilderInventoryGrid();
};

/**
 * 💡 [초보자 가이드] 정적 스냅샷 지표 기준 무기/방어구 스텟 로우 테이블 데이터를 생성합니다.
 */
window.getBuilderStatRowsHtml = function() {
    const defaultStats = [
        { name: "보스 몬스터 데미지", val: "530.00" }, { name: "최종 데미지", val: "173.09" },
        { name: "방어율 무시", val: "97.03" }, { name: "크리티컬 확률", val: "96" },
        { name: "크리티컬 데미지", val: "97.00" }, { name: "상태이상 내성", val: "94" },
        { name: "스탠스", val: "100" }, { name: "방어력", val: "23414" },
        { name: "이동속도", val: "170" }, { name: "점프력", val: "123" },
        { name: "스타포스", val: "303" }, { name: "아케인포스", val: "1410" }
    ];
    return defaultStats.map(s => `
        <div style="display: flex; justify-content: space-between; background: #ffffff; padding: 6px 10px; font-size: 11px; font-weight: bold; color: #334155;">
            <span style="color:#475569;">${s.name}</span>
            <span style="font-family:'Consolas', monospace; color:#0f172a;">${s.val}</span>
        </div>
    `).join('');
};

/**
 * 💡 [초보자 가이드] 좌측 도핑 아이콘 배치 그리드용 아이콘 홀더 목록을 드로잉합니다.
 */
window.getDopingSelectorIconsHtml = function() {
    const mockIcons = [
        "🧪", "👑", "🌟", "🔥", "🍎", "🍗",
        "🍷", "🍩", "🍬", "🍫", "🍹", "🎫",
        "🔮", "🧿", "💎", "🛡️", "⚔️", "🔱"
    ];
    return mockIcons.map((ico, idx) => `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 3px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px; border-radius: 6px; width: 32px; height: 32px; justify-content: center; position: relative;">
            <span style="font-size: 14px;">${ico}</span>
            <input type="checkbox" ${idx < 4 ? 'checked' : ''} onchange="window.runLiveCalculationLoop()" style="position: absolute; bottom: -2px; right: -2px; width: 10px; height: 10px; cursor: pointer; accent-color: #0f766e;">
        </div>
    `).join('');
};

/**
 * 💡 [초보자 가이드] 인게임 UI를 완벽하게 모사한 5열 6행 규격의 무결성 장착 인벤토리 그리드를 생성합니다.
 */
window.renderBuilderInventoryGrid = function() {
    const gridContainer = document.getElementById('builder_inventory_grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = "";

    // 아바타 전용 중앙 앵커 배치 박스 생성
    const avatarBox = document.createElement('div');
    avatarBox.className = "builder-avatar-frame";
    avatarBox.innerHTML = `<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 24 24' fill='none' stroke='#cbd5e1' stroke-width='1.5'><circle cx='12' cy='12' r='10'/><path d='M16 12a4 4 0 0 1-8 0'/></svg>`;
    gridContainer.appendChild(avatarBox);

    // 인게임 장비창 5열 구조 미러링 데이터셋 정의
    const mapLayout = [
        { slot: "반지4", r: 1, c: 1 }, { slot: "반지3", r: 2, c: 1 }, { slot: "반지2", r: 3, c: 1 }, { slot: "반지1", r: 4, c: 1 }, { slot: "펜던트2", r: 5, c: 1 }, { slot: "포켓 아이템", r: 6, c: 1 },
        { slot: "엠블렘", r: 1, c: 2 }, { slot: "뱃지", r: 2, c: 2 }, { slot: "훈장", r: 3, c: 2 }, { slot: "얼굴장식", r: 4, c: 2 }, { slot: "눈장식", r: 5, c: 2 }, { slot: "귀고리", r: 6, c: 2 },
        { slot: "무기", r: 6, c: 3 },
        { slot: "모자", r: 1, c: 4 }, { slot: "상의", r: 2, c: 4 }, { slot: "하의", r: 3, c: 4 }, { slot: "장갑", r: 4, c: 4 }, { slot: "안드로이드", r: 5, c: 4 }, { slot: "어깨장식", r: 6, c: 4 },
        { slot: "망토", r: 1, c: 5 }, { slot: "보조무기", r: 2, c: 5 }, { slot: "신발", r: 3, c: 5 }, { slot: "펜던트", r: 4, c: 5 }, { slot: "기계 심장", r: 5, c: 5 }, { slot: "벨트", r: 6, c: 5 }
    ];

    const aliasMap = { "배지": "뱃지", "펜던트1": "펜던트", "한벌옷": "상의" };
    const tierBorders = { "레전드리": "#a855f7", "유니크": "#f59e0b", "에픽": "#3b82f6", "레어": "#94a3b8" };

    mapLayout.forEach(cell => {
        const itemSlotNode = document.createElement('div');
        itemSlotNode.className = "builder-item-slot-node";
        itemSlotNode.style.gridRow = cell.r;
        itemSlotNode.style.gridColumn = cell.c;

        if (window.omniSimMemory.selectedSlot === cell.slot) {
            itemSlotNode.classList.add('selected-active');
        }

        // 현재 프리셋에서 슬롯에 매칭되는 아이템 데이터 탐색
        let matchGear = window.builderCurrentList.find(g => g.item_equipment_slot === cell.slot || aliasMap[g.item_equipment_slot] === cell.slot);

        if (matchGear && matchGear.item_icon) {
            const borderTint = tierBorders[matchGear.potential_option_grade] || "#cbd5e1";
            itemSlotNode.style.borderColor = borderTint;
            itemSlotNode.innerHTML = `<img src="${matchGear.item_icon}" style="max-width:85%; max-height:85%; object-fit:contain;">`;
        } else {
            const labelText = cell.slot.length > 3 ? cell.slot.substring(0, 2) : cell.slot;
            itemSlotNode.innerHTML = `<span style="font-size:8.5px; color:#94a3b8; font-weight:800;">${labelText}</span>`;
        }

        // 슬롯 클릭 타겟 트리거 이벤트 결속
        itemSlotNode.onclick = () => window.loadBuilderSlotControlPanel(cell.slot, matchGear);
        gridContainer.appendChild(itemSlotNode);
    });
};

/**
 * 💡 [초보자 가이드] 인벤토리에서 특정 부위를 누르면 우측 설정 창에 가상 시뮬레이션 환경을 로드합니다.
 */
window.loadBuilderSlotControlPanel = function(slotName, itemObj) {
    window.omniSimMemory.selectedSlot = slotName;
    window.omniSimMemory.selectedItem = itemObj || { item_name: `실전 가상 ${slotName}`, starforce: 0 };
    
    const sfInit = parseInt(window.omniSimMemory.selectedItem.starforce || 0);
    window.omniSimMemory.customStats.starforce = sfInit;

    document.getElementById('builder_right_empty_view').style.display = 'none';
    document.getElementById('builder_right_interactive_view').style.display = 'flex';

    document.getElementById('control_item_name_text').innerText = window.omniSimMemory.selectedItem.item_name;
    document.getElementById('control_item_slot_text').innerText = `부위: ${slotName}`;
    document.getElementById('interactive_sf_label').innerText = `${sfInit}성`;

    const iconFrame = document.getElementById('control_item_icon_frame');
    if (itemObj && itemObj.item_icon) {
        iconFrame.innerHTML = `<img src="${itemObj.item_icon}" style="max-width:85%; max-height:85%;">`;
    } else {
        iconFrame.innerHTML = `<span style="font-size:10px; color:#cbd5e1;">⚙️</span>`;
    }

    // 변경 인풋 수치 리셋 초기화
    document.getElementById('input_add_str').value = 0;
    document.getElementById('input_add_dex').value = 0;
    document.getElementById('input_add_int').value = 0;
    document.getElementById('input_add_luk').value = 0;
    document.getElementById('input_add_atk').value = 0;
    document.getElementById('input_add_matk').value = 0;
    document.getElementById('input_add_all').value = 0;

    // 활성화 테두리를 새로 그리기 위해 인벤토리 격자판 리프레시
    window.renderBuilderInventoryGrid();
    window.runLiveCalculationLoop();
};

/**
 * 💡 [초보자 가이드] 스타포스 변경 버튼 클릭 시 최소 0성 ~ 최대 25성 범위를 안전하게 가이드 보정합니다.
 */
window.adjustStarforceStep = function(offset) {
    const stats = window.omniSimMemory.customStats;
    let nextSf = stats.starforce + offset;
    if (nextSf < 0) nextSf = 0;
    if (nextSf > 25) nextSf = 25;

    stats.starforce = nextSf;
    document.getElementById('interactive_sf_label').innerText = `${nextSf}성`;
    window.runLiveCalculationLoop();
};

/**
 * 💡 [초보자 가이드] 수동 입력 추가옵션과 스타포스 격차를 연산하여 전광 대시보드 스킨에 변동량을 뿌려주는 시뮬레이터 수식 연산 엔진입니다.
 */
window.runLiveCalculationLoop = function() {
    const memory = window.omniSimMemory;
    if (!memory.selectedSlot) return;

    const addStr = parseInt(document.getElementById('input_add_str').value) || 0;
    const addDex = parseInt(document.getElementById('input_add_dex').value) || 0;
    const addInt = parseInt(document.getElementById('input_add_int').value) || 0;
    const addLuk = parseInt(document.getElementById('input_add_luk').value) || 0;
    const addAtk = parseInt(document.getElementById('input_add_atk').value) || 0;
    const addMatk = parseInt(document.getElementById('input_add_matk').value) || 0;
    const addAll = parseInt(document.getElementById('input_add_all').value) || 0;

    const originalSf = parseInt(memory.selectedItem.starforce || 0);
    const currentSf = memory.customStats.starforce;
    const sfGap = currentSf - originalSf;

    // 가상 대입 시뮬레이션 산출 공식 기조 (스타포스 격차당 밸런스 조정치 반영)
    let sfStatBonus = sfGap > 0 ? (sfGap * 6) : (sfGap * 4); 
    let sfAtkBonus = sfGap > 0 ? (sfGap * 5) : (sfGap * 3);

    let totalStatDelta = addStr + addDex + addInt + addLuk + (addAll * 10) + sfStatBonus;
    let totalAtkDelta = addAtk + addMatk + sfAtkBonus;

    if (totalStatDelta < 0 && sfGap >= 0) totalStatDelta = 0;
    if (totalAtkDelta < 0 && sfGap >= 0) totalAtkDelta = 0;

    // 전투력 상승 추정 변산식 환산 대입 (주스탯 및 공/마 가중치 부여)
    let totalPowerDelta = (totalStatDelta * 1850) + (totalAtkDelta * 12500);

    // 하단 SPEC DIFF 분석판 보드 인터페이스 동적 매핑 연동
    document.getElementById('delta_power_text').innerText = (totalPowerDelta >= 0 ? '+' : '') + totalPowerDelta.toLocaleString();
    document.getElementById('delta_stat_text').innerText = (totalStatDelta >= 0 ? '+' : '') + totalStatDelta.toLocaleString();
    document.getElementById('delta_att_text').innerText = (totalAtkDelta >= 0 ? '+' : '') + totalAtkDelta.toLocaleString();

    // 색상 동적 변경 (상승 시 로즈레드, 하락 시 블루)
    const color = totalPowerDelta >= 0 ? "#e11d48" : "#2563eb";
    document.getElementById('delta_power_text').style.color = color;
    document.getElementById('delta_stat_text').style.color = totalStatDelta >= 0 ? "#e11d48" : "#2563eb";
    document.getElementById('delta_att_text').style.color = totalAtkDelta >= 0 ? "#e11d48" : "#2563eb";
};

/**
 * 💡 [초보자 가이드] 하단 프리셋 체인저 탭 클릭 시 해당되는 장비 셋 데이터를 재동기화 및 렌더링 교체해주는 스위치 핸들러입니다.
 */
window.switchBuilderPreset = function(presetNumber) {
    window.omniSimMemory.activePreset = presetNumber;
    
    document.querySelectorAll('.builder-preset-pill').forEach(btn => btn.classList.remove('active'));
    const targetBtn = document.getElementById(`btn_preset_${presetNumber}`);
    if (targetBtn) targetBtn.classList.add('active');

    const itemContext = window.currentSearchData?.item || {};
    let chosenList = [];

    if (presetNumber === 1) chosenList = itemContext.item_equipment_preset_1 || [];
    else if (presetNumber === 2) chosenList = itemContext.item_equipment_preset_2 || [];
    else if (presetNumber === 3) chosenList = itemContext.item_equipment_preset_3 || [];

    window.builderCurrentList = chosenList.length > 0 ? chosenList : window.convertEquipmentToBossSet([]);
    
    window.renderBuilderInventoryGrid();
    if (window.showOmniToast) window.showOmniToast(`프리셋 ${presetNumber}번 장비 사양으로 자동 전환 완료했습니다.`, "success");
};

// 💡 [초보자 가이드] 상단 내비게이션 탭의 페이지 스위칭 상호작용 발생을 감지하여 빌더 화면을 로드하는 리스너입니다.
window.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'nav-btn-builder') {
        setTimeout(function() {
            if (typeof window.initOmniBuilderTab === 'function') {
                window.initOmniBuilderTab();
            }
        }, 50);
    }
});

// 최초 완전 초기 구동 시점 대비 예비 인터페이스 결속 시동
document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.initOmniBuilderTab === 'function') {
        window.initOmniBuilderTab();
    }
});