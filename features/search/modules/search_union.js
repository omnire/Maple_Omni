/**
 * ============================================================================
 * 👤 MAPLE OMNI - search_union.js (유니온)
 * 설명: 넥슨 API에서 누락된 공격대원 효과를 자동 계산하고, 초압축 콤팩트 UI로 렌더링합니다.
 * ============================================================================
 */

// 💡 유니온 등급별 아이콘 이미지 주소 매핑
window.getUnionGradeIcon = function(grade) {
    const gradeMap = {
        "노비스 유니온 1": "icon/Union/novice1.jpg", "노비스 유니온 2": "icon/Union/novice2.jpg", "노비스 유니온 3": "icon/Union/novice3.jpg", "노비스 유니온 4": "icon/Union/novice4.jpg", "노비스 유니온 5": "icon/Union/novice5.jpg",
        "베테랑 유니온 1": "icon/Union/veteran1.jpg", "베테랑 유니온 2": "icon/Union/veteran2.jpg", "베테랑 유니온 3": "icon/Union/veteran3.jpg", "베테랑 유니온 4": "icon/Union/veteran4.jpg", "베테랑 유니온 5": "icon/Union/veteran5.jpg",
        "마스터 유니온 1": "icon/Union/master1.jpg", "마스터 유니온 2": "icon/Union/master2.jpg", "마스터 유니온 3": "icon/Union/master3.jpg", "마스터 유니온 4": "icon/Union/master4.jpg", "마스터 유니온 5": "icon/Union/master5.jpg",
        "그랜드 마스터 유니온 1": "icon/Union/grandmaster1.jpg", "그랜드 마스터 유니온 2": "icon/Union/grandmaster2.jpg", "그랜드 마스터 유니온 3": "icon/Union/grandmaster3.jpg", "그랜드 마스터 유니온 4": "icon/Union/grandmaster4.jpg", "그랜드 마스터 유니온 5": "icon/Union/grandmaster5.jpg",
        "슈프림 유니온 1": "icon/Union/supreme1.jpg", "슈프림 유니온 2": "icon/Union/supreme2.jpg", "슈프림 유니온 3": "icon/Union/supreme3.jpg", "슈프림 유니온 4": "icon/Union/supreme4.jpg", "슈프림 유니온 5": "icon/Union/supreme5.jpg"
    };
    return gradeMap[grade] || "icon/Union/novice1.jpg";
};

// 🚨 [핵심 기능] 넥슨 API가 주지 않는 공격대원 효과를 직업과 레벨로 역산출하는 자동 매핑 엔진
window.getUnionBlockEffect = function(jobName, level) {
    if (!jobName) return "효과 없음";
    
    // 레벨에 따른 등급(랭크) 인덱스 계산: B(0), A(1), S(2), SS(3), SSS(4)
    let rankIdx = 0; 
    if (level >= 250) rankIdx = 4;
    else if (level >= 200) rankIdx = 3;
    else if (level >= 140) rankIdx = 2;
    else if (level >= 100) rankIdx = 1;
    else if (level >= 60) rankIdx = 0;

    // 등급별 오르는 수치 배열
    const s100 = [10, 20, 40, 80, 100]; // 주요 스탯 
    const sHP = [250, 500, 1000, 2000, 2500]; // HP/MP 고정
    const sPer = [1, 2, 3, 4, 5]; // 1~5%
    const sBoss = [1, 2, 3, 5, 6]; // 보공, 방무 등 1~6%
    const sCool = [2, 3, 4, 5, 6]; // 쿨감 2~6%
    const sBuff = [5, 10, 15, 20, 25]; // 벞지 5~25%
    const sExp = [4, 6, 8, 10, 12]; // 경험치 4~12%

    // API가 보내주는 정확한 직업명과 효과 매칭
    const effectMap = {
        "히어로": `STR ${s100[rankIdx]} 증가`, "팔라딘": `STR ${s100[rankIdx]} 증가`, "바이퍼": `STR ${s100[rankIdx]} 증가`, "캐논마스터": `STR ${s100[rankIdx]} 증가`, "아크": `STR ${s100[rankIdx]} 증가`, "아델": `STR ${s100[rankIdx]} 증가`, "카이저": `STR ${s100[rankIdx]} 증가`, "스트라이커": `STR ${s100[rankIdx]} 증가`,
        "보우마스터": `DEX ${s100[rankIdx]} 증가`, "패스파인더": `DEX ${s100[rankIdx]} 증가`, "윈드브레이커": `DEX ${s100[rankIdx]} 증가`, "엔젤릭버스터": `DEX ${s100[rankIdx]} 증가`, "카인": `DEX ${s100[rankIdx]} 증가`,
        "아크메이지(썬,콜)": `INT ${s100[rankIdx]} 증가`, "비숍": `INT ${s100[rankIdx]} 증가`, "플레임위자드": `INT ${s100[rankIdx]} 증가`, "루미너스": `INT ${s100[rankIdx]} 증가`, "배틀메이지": `INT ${s100[rankIdx]} 증가`, "일리움": `INT ${s100[rankIdx]} 증가`, "라라": `INT ${s100[rankIdx]} 증가`, "키네시스": `INT ${s100[rankIdx]} 증가`,
        "섀도어": `LUK ${s100[rankIdx]} 증가`, "듀얼블레이더": `LUK ${s100[rankIdx]} 증가`, "나이트워커": `LUK ${s100[rankIdx]} 증가`, "카데나": `LUK ${s100[rankIdx]} 증가`, "호영": `LUK ${s100[rankIdx]} 증가`, "칼리": `LUK ${s100[rankIdx]} 증가`,
        "소울마스터": `최대 HP ${sHP[rankIdx]} 증가`, "미하일": `최대 HP ${sHP[rankIdx]} 증가`,
        "다크나이트": `최대 HP ${sBoss[rankIdx]}% 증가`, "아크메이지(불,독)": `최대 MP ${sBoss[rankIdx]}% 증가`,
        "신궁": `크리티컬 확률 ${sPer[rankIdx]}% 증가`, "나이트로드": `크리티컬 확률 ${sPer[rankIdx]}% 증가`,
        "캡틴": `소환수 지속시간 ${sExp[rankIdx]}% 증가`, "메르세데스": `재사용 대기시간 ${sCool[rankIdx]}% 감소`, "팬텀": `메소 획득량 ${sPer[rankIdx]}% 증가`,
        "은월": `크리티컬 데미지 ${sBoss[rankIdx]}% 증가`, "데몬어벤져": `보스 데미지 ${sBoss[rankIdx]}% 증가`, "블래스터": `방어율 무시 ${sBoss[rankIdx]}% 증가`,
        "와일드헌터": `공격 시 데미지 ${[4, 8, 12, 16, 20][rankIdx]}% 증가`, "메카닉": `버프 지속시간 ${sBuff[rankIdx]}% 증가`,
        "데몬슬레이어": `상태 이상 내성 ${sPer[rankIdx]} 증가`, "제논": `STR/DEX/LUK 각 ${[5, 10, 20, 40, 50][rankIdx]} 증가`,
        "에반": `타격시 MP ${[2, 4, 6, 8, 10][rankIdx]}% 회복`, "제로": `경험치 획득량 ${sExp[rankIdx]}% 증가`
    };
    
    return effectMap[jobName] || `공격력/마력 ${sBoss[rankIdx]} 증가`; // 맵에 없는 신규 직업 대비용
};

window.getBadgeIcon = function(statText) {
    const iconPath = "icon/Badge/";
    if (statText.includes("올스탯")) return iconPath + "allstat.png";
    if (statText.includes("공격력") || statText.includes("마력")) return iconPath + "attack.png";
    if (statText.includes("보스")) return iconPath + "boss.png";
    if (statText.includes("방어율")) return iconPath + "def.png";
    if (statText.includes("크리티컬")) return iconPath + "crit.png";
    return iconPath + "default.png";
};

// 🌟 유니온 데이터 종합 화면 빌드 함수
window.renderUnion = function(union) {
    if (!union) union = { union_grade: "데이터 없음", union_level: 0, union_block: [] };
    if (!union.union_block) union.union_block = [];

    const grade = union.union_grade || "데이터 없음";
    const level = (union.union_level || 0).toLocaleString();
    
    const members = Array.isArray(union.union_block) ? union.union_block : [];
    const championBadges = Array.isArray(union.champion_badge_total_info) ? union.champion_badge_total_info : [];
    const champions = Array.isArray(union.union_champion) ? union.union_champion : [];
    
    const artifactLevel = union.union_artifact_level || 0;
    const artifactPoint = (union.union_artifact_point || 0).toLocaleString();

    return `
    <div class="union-main-container">
        <div class="union-stat-grid">
            <div class="union-stat-card"><div class="stat-label">유니온 등급</div><div class="stat-value">${grade}</div></div>
            <div class="union-stat-card"><div class="stat-label">전체 레벨</div><div class="stat-value-lv">Lv.${level}</div></div>
            <div class="union-stat-card"><div class="stat-label">아티팩트 (Lv/Pt)</div><div class="stat-value-art">Lv.${artifactLevel} / ${artifactPoint}</div></div>
        </div>

        <div class="union-split-grid">
            <div class="union-compact-box">
                <h3 class="compact-title">🏆 챔피언 현황</h3>
                ${window.renderUnionChampion(champions)}
            </div>
            <div class="union-compact-box">
                <h3 class="compact-title">🏆 챔피언 휘장 효과</h3>
                <div class="compact-scroll-list">
                    ${championBadges.length > 0 ? championBadges.map(b => `
                        <div class="compact-list-item">
                            <span class="icon-star">⭐</span><span class="val-text">${b.stat || '설명 없음'}</span>
                        </div>
                    `).join('') : '<div class="no-data">휘장 데이터 없음</div>'}
                </div>
            </div>
        </div>

        <div class="union-split-grid">
            <div class="union-compact-box">
                <h3 class="compact-title">⚔️ 공격대원 효과</h3>
                <div class="compact-scroll-list">
                    ${members.map(m => {
                        // 💡 API에 block_effect가 없다면 위에서 만든 엔진으로 즉시 산출합니다.
                        const effectText = m.block_effect || window.getUnionBlockEffect(m.block_class, m.block_level);
                        return `
                        <div class="compact-list-item">
                            <span class="job-chip">${m.block_class}</span>
                            <span class="val-text">${effectText}</span>
                        </div>`;
                    }).join('')}
                    ${members.length === 0 ? '<div class="no-data">배치된 대원 없음</div>' : ''}
                </div>
            </div>
            <div class="union-compact-box">
                <h3 class="compact-title">🚩 점령 효과</h3>
                <div class="compact-scroll-list">
                    ${Array.isArray(union.union_raider_stat) && union.union_raider_stat.length > 0 ? union.union_raider_stat.map(s => `
                        <div class="compact-list-item"><span class="val-text">${s}</span></div>
                    `).join('') : '<div class="no-data">점령 효과 없음</div>'}
                </div>
            </div>
        </div>

        <div class="union-compact-box">
            ${window.renderUnionMembersList(members)}
        </div>
    </div>`;
};

// 🌟 유니온 챔피언 현황 렌더링
window.renderUnionChampion = function(champions) {
    const getGradeStyle = (grade) => {
        if (grade === 'SSS') return { c: '#ea580c', bg: '#fff7ed', b: '#fed7aa' };
        if (grade === 'S') return { c: '#7c3aed', bg: '#f5f3ff', b: '#ddd6fe' };
        if (grade === 'A') return { c: '#16a34a', bg: '#f0fdf4', b: '#bbf7d0' };
        return { c: '#475569', bg: '#f1f5f9', b: '#e2e8f0' };
    };

    return `
    <div class="compact-scroll-list">
        ${champions.length > 0 ? champions.map(c => {
            const st = getGradeStyle(c.champion_grade);
            return `
            <div class="champ-mini-card">
                <div class="champ-card-header">
                    <div class="champ-name-box">
                        <span class="champ-name">${c.champion_name}</span>
                        <span class="champ-sub">Lv.${c.champion_level || 0}</span>
                    </div>
                    <span class="grade-chip" style="color:${st.c}; background:${st.bg}; border:1px solid ${st.b};">${c.champion_grade || 'C'}</span>
                </div>
                <div class="champ-badges-container">
                    ${(c.champion_badge_info || []).map(b => `<span class="mini-badge">${b.stat}</span>`).join('')}
                </div>
            </div>`;
        }).join('') : '<div class="no-data">등록된 챔피언 없음</div>'}
    </div>`;
};

// 💡 직업 아이콘 매핑 (상대경로 적용 완료)
window.getJobIcon = function(jobName) {
    const jobIconMap = {
        "히어로": "icon/Jobs/히어로.png", "팔라딘": "icon/Jobs/팔라딘.png", "다크나이트": "icon/Jobs/다크나이트.png",
        "비숍": "icon/Jobs/비숍.png", "아크메이지(불,독)": "icon/Jobs/불독.png", "아크메이지(썬,콜)": "icon/Jobs/썬콜.png",
        "보우마스터": "icon/Jobs/보우마스터.png", "신궁": "icon/Jobs/신궁.png", "패스파인더": "icon/Jobs/패스파인더.png",
        "나이트로드": "icon/Jobs/나이트로드.png", "섀도어": "icon/Jobs/섀도어.png", "듀얼블레이더": "icon/Jobs/듀얼블레이더.png",
        "바이퍼": "icon/Jobs/바이퍼.png", "캡틴": "icon/Jobs/캡틴.png", "캐논마스터": "icon/Jobs/캐논마스터.png",
        "미하일": "icon/Jobs/미하일.png", "소울마스터": "icon/Jobs/소울마스터.png", "플레임위자드": "icon/Jobs/플레임위자드.png", "윈드브레이커": "icon/Jobs/윈드브레이커.png", "나이트워커": "icon/Jobs/나이트워커.png", "스트라이커": "icon/Jobs/스트라이커.png",
        "아란": "icon/Jobs/아란.png", "에반": "icon/Jobs/에반.png", "메르세데스": "icon/Jobs/메르세데스.png", "팬텀": "icon/Jobs/팬텀.png", "은월": "icon/Jobs/은월.png",
        "데몬슬레이어": "icon/Jobs/데몬슬레이어.png", "데몬어벤져": "icon/Jobs/데몬어벤져.png", "블래스터": "icon/Jobs/블래스터.png", "배틀메이지": "icon/Jobs/배틀메이지.png", "와일드헌터": "icon/Jobs/와일드헌터.png", "메카닉": "icon/Jobs/메카닉.png", "제논": "icon/Jobs/제논.png", "제로": "icon/Jobs/제로.png", "키네시스": "icon/Jobs/키네시스.png",
        "카이저": "icon/Jobs/카이저.png", "엔젤릭버스터": "icon/Jobs/엔젤릭버스터.png", "카데나": "icon/Jobs/카데나.png", "아크": "icon/Jobs/아크.png", "일리움": "icon/Jobs/일리움.png", "호영": "icon/Jobs/호영.png", "아델": "icon/Jobs/아델.png", "카인": "icon/Jobs/카인.png", "라라": "icon/Jobs/라라.png", "칼리": "icon/Jobs/칼리.png", "렌": "icon/Jobs/렌.png"
    };
    return jobIconMap[jobName] || "icon/Jobs/default.png";
};

// 🌟 [수정됨] 전체 공격대원 목록 - 초압축 명함(대시보드) 스타일
window.renderUnionMembersList = function(members) {
    const getUnionRankInfo = (lv) => {
        if (lv >= 250) return { name: "SSS", c: "#e11d48", bg: "#ffe4e6", b: "#fecdd3" };
        if (lv >= 200) return { name: "SS", c: "#d97706", bg: "#fef3c7", b: "#fde68a" };
        if (lv >= 140) return { name: "S", c: "#6d28d9", bg: "#ede9fe", b: "#ddd6fe" };
        return { name: "A-C", c: "#475569", bg: "#f1f5f9", b: "#e2e8f0" };
    };

    const rankGroups = { "SSS": [], "SS": [], "S": [], "A-C": [] };
    members.forEach(m => {
        const rank = getUnionRankInfo(m.block_level);
        rankGroups[rank.name].push({ ...m, rData: rank });
    });

    return `
    <div class="dashboard-header">
        <h3 class="compact-title" style="margin:0;">⚔️ 전체 공격대원 목록</h3>
        <span class="total-badge">총 ${members.length}명</span>
    </div>
    
    <div class="dashboard-body">
        ${Object.keys(rankGroups).map(rankKey => rankGroups[rankKey].length > 0 ? `
            <div class="rank-row">
                <div class="rank-label" style="color: ${rankGroups[rankKey][0].rData.c}; border-bottom: 2px solid ${rankGroups[rankKey][0].rData.c};">
                    ${rankKey} Rank <span class="r-cnt">(${rankGroups[rankKey].length})</span>
                </div>
                <div class="member-chip-grid">
                    ${rankGroups[rankKey].map(m => `
                        <div class="member-chip" style="border: 1px solid ${m.rData.b}; background: #fafafa;">
                            <img src="${window.getJobIcon(m.block_class)}" onerror="this.style.display='none'">
                            <div class="m-info">
                                <div class="m-job">${m.block_class}</div>
                                <div class="m-lv">Lv.${m.block_level} <span style="color:${m.rData.c}; font-weight:900;">${m.rData.name}</span></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '').join('')}
    </div>`;
};