/**
 * ============================================================================
 * 👤 MAPLE OMNI - search_alts.js
 * 설명: 부캐(유니온 연동 부캐릭) 탭을 눌렀을 때 실행될 코드를 작성할 전용 파일입니다.
 * ============================================================================
 */

window.renderAlts = function() {
    const data = window.currentSearchData;
    if (!data || !data.union) {
        return `<div style="padding:60px; text-align:center; color:#94a3b8; font-weight:700; background:white; border-radius:20px;">👥 유니온 공격대 연동 정보가 없어 월드 내 부캐 리스트를 추출할 수 없습니다.</div>`;
    }

    // 💡 [유니온 원본 연동 캡처 엔진] 공격대원 데이터에 적재된 모든 월드 캐릭터 블록 리스트를 안전 추적 가로채기 합니다.
    const rawMembers = Array.isArray(data.union.union_block) && data.union.union_block.length > 0 ? data.union.union_block : 
                     (Array.isArray(data.union.union_raider_block) ? data.union.union_raider_block : []);

    // 💡 [고급 알고리즘 정렬 및 필터 가동] 현재 검색 완료된 본캐릭닉네임은 목록에서 고도화 분리 차단하고 레벨 역순 고정 정렬합니다.
    const currentMainName = data.basic?.character_name || "";
    const altList = rawMembers
        .filter(m => m.block_class !== data.basic?.character_class) // 현재 조회 중인 동일 직업/본캐 예외 컷 처리
        .sort((a, b) => parseInt(b.block_level) - parseInt(a.block_level)); // 레벨 높은 명예순 정렬

    return `
        <div style="width: 100%; box-sizing: border-box; padding: 10px 0; display: flex; flex-direction: column; gap: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding-left: 4px;">
                <h3 style="margin: 0; font-size: 14px; font-weight: 900; color: #1e293b;">🌐 유니온 월드 연동 부캐릭터 목록</h3>
                <span style="font-size: 11px; font-weight: 800; background: #f3e8ff; color: #7c3aed; padding: 4px 12px; border-radius: 8px;">계정 보유 부캐 총 ${altList.length}개</span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 10px;">
                ${altList.length > 0 ? altList.map(alt => {
                    // 직업 아이콘 매핑 유효성 필터 안전 검사
                    const jobIcon = typeof window.getJobIcon === 'function' ? window.getJobIcon(alt.block_class) : "icon/Jobs/default.png";
                    
                    return `
                        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px; display: flex; align-items: center; gap: 12px; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
                            <div style="width: 32px; height: 32px; background: #f8fafc; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid #f1f5f9; flex-shrink: 0; overflow:hidden;">
                                <img src="${jobIcon}" style="width: 20px; height: 20px; object-fit: contain;" onerror="this.src='icon/Jobs/default.png'">
                            </div>
                            <div style="flex-grow: 1; min-width: 0;">
                                <div style="font-size: 12px; font-weight: 900; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${alt.block_class}</div>
                                <div style="font-size: 10px; font-weight: 700; color: #7c3aed; margin-top: 2px;">
                                    Lv.${alt.block_level} <span style="font-size:9px; background:#f3e8ff; padding: 0px 4px; border-radius:3px; margin-left:3px; font-weight:800;">${parseInt(alt.block_level) >= 200 ? 'SS' : 'S'}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('') : '<div style="grid-column: 1/-1; padding: 50px 0; text-align: center; color: #94a3b8; font-size: 12px; font-weight: 700; background:white; border-radius:16px;">월드 연동 부캐 서브 데이터가 전무합니다.</div>'}
            </div>
        </div>
    `;
};