/**
 * ============================================================================
 * 🛠️ builder/data.js - 데이터베이스, 상태 변수 및 유틸리티 함수
 * ============================================================================
 */

// 1. 전역 상태 변수 설정 (파일이 나뉘어도 공유되도록 window 객체 사용)
window.builderCurrentData = null;
window.currentSelectedSlotIndex = -1; 
window.currentSlotBaseStar = 0;
window.currentSlotBaseScrollStat = 0;
window.currentSlotBaseScrollAtk = 0;

window.simStar = 17;     
window.simScrollStat = 0; 
window.simScrollAtk = 0;  
window.currentPreset = 1; 
window.builderEquippedItems = Array(30).fill(null);

window.searchHistory = JSON.parse(localStorage.getItem('maple_search_history') || '[]');
window.builderCurrentData = JSON.parse(localStorage.getItem('maple_builder_data') || 'null');
window.diffPower = 0; 
window.diffStat = 0;
window.diffAtk = 0;

window.activePresetStats = null;
window.SCROLL_PRESETS = {}; 

// 2. 기본 데이터베이스 (상수)
const CATEGORY_MAP = {
    "장비/hat": ["모자", "햇", "캡", "헬름", "후드", "티아라"],
    "장비/armor": ["상의", "하의", "한벌옷", "아머", "슈트", "코트", "메일"],
    "장비/gloves": ["장갑", "글러브"],
    "장비/shoes": ["신발", "슈즈", "부츠"],
    "장비/cape": ["망토", "케이프"],
    "장신구/face": ["얼굴장식"],
    "장신구/ear": ["귀고리", "이어링"],
    "장신구/ring": ["반지", "링"],
    "장신구/shoulder": ["어깨장식", "숄더", "견장"],
    "장신구/pocket": ["포켓", "성배"]
};

const DOPING_DATA = {
    "마슈르의 선물": { power: 300, stat: 0, icon: "마슈르의 선물.png" },
    "MVP 슈퍼 파워 버프": { power: 300, stat: 0, icon: "MVP 슈퍼 파워 버프.png" },
    "Lv.250의 축복": { power: 500, stat: 0, icon: "Lv.250의 축복.png" },
    "유니온의 힘": { power: 300, stat: 0, icon: "유니온의 힘.png" },
    "향상된 10단계 물약": { power: 0, stat: 30, icon: "향상된 10단계 물약.png" },
    "붕어빵 뿌리기": { power: 300, stat: 0, icon: "붕어빵 뿌리기.png" },
    "익스트림 레드": { power: 300, stat: 0, icon: "익스트림 레드.png" },
    "고급 보스 킬러": { power: 500, stat: 0, icon: "고급 보스 킬러.png" },
    "고급 관통의 비약": { power: 0, stat: 0, icon: "고급 관통의 비약.png" },
    "반짝이는 빨간 별 물약": { power: 0, stat: 0, icon: "반짝이는 빨간 별 물약.png" },
    "영롱한 달빛 포션": { power: 200, stat: 0, icon: "영롱한 달빛 포션.png" },
    "VIP 버프": { power: 150, stat: 15, icon: "VIP버프.png" },
    "챔피언의 가호": { power: 200, stat: 10, icon: "챔피언의 가호.png" },
    "명예의 영약": { power: 600, stat: 0, icon: "명예의 영약.png" },
    "알레리아의 영약": { power: 0, stat: 0, icon: "알레리아의 영약.png" },
    "세이람 영약": { power: 500, stat: 0, icon: "세이람 영약.png" },
    "콜렉터의 영약": { power: 100, stat: 30, icon: "콜렉터의 영약.png" }
};

const MAPLE_SLOT_NAMES = [
    "반지1", "눈장식", null, "모자", "망토",
    "반지2", "얼굴장식", null, "상의", "장갑",
    "반지3", "귀고리", null, "하의", "신발",
    "반지4", "펜던트1", null, "어깨장식", "훈장",
    "벨트", "펜던트2", null, "안드로이드", "기계 심장",
    "포켓 아이템", "무기", "보조무기", "엠블렘", "뱃지"
];

// 3. 유틸리티 함수 (포맷팅, 이름 추출 등)
window.formatMapleCP = function(num) {
    let cleanStr = String(num).replace(/,/g, ''); 
    let n = Math.abs(Number(cleanStr));
    let sign = Number(cleanStr) < 0 ? "-" : "";
    if (n === 0) return "0";
    
    let eok = Math.floor(n / 100000000);
    let man = Math.floor((n % 100000000) / 10000);
    let rest = Math.floor(n % 10000);
    
    let res = [];
    if (eok > 0) res.push(eok.toString() + "억");
    if (man > 0) res.push(man.toString() + "만");
    if (rest > 0 || (eok === 0 && man === 0)) res.push(rest.toString());
    
    return sign + res.join(" ");
};

window.getLocalItemIconBase = function(itemName) {
    if (!itemName) return null;
    const cleanName = itemName.trim();
    const fileName = window.getCorrectFileName(cleanName);

    if (window.ITEM_REGISTRY && window.ITEM_REGISTRY[cleanName]) {
        return `${window.ITEM_REGISTRY[cleanName]}/${fileName}`;
    }

    if (cleanName.includes("링") && ["리스트레인트", "웨폰퍼프", "크라이시스", "리스크 테이커"].some(k => cleanName.includes(k))) return `icon/시드링/${fileName}`;

    for (const [folder, keywords] of Object.entries(CATEGORY_MAP)) {
        if (keywords.some(k => cleanName.includes(k))) return `icon/${folder}/${fileName}`;
    }

    const bossKeywords = ["루즈 컨트롤", "마력이 깃든", "거대한 공포", "고통의 근원", "커맨더 포스", "몽환의", "창세의", "저주받은", "트와일라이트", "에스텔라", "데이브레이크", "가디언 엔젤", "혼테일", "핑크빛", "영생의"];
    if (bossKeywords.some(k => cleanName.includes(k))) return `icon/boss/${fileName}`;

    return `icon/장비/weapon/${fileName}`; 
};

window.getCorrectFileName = function(itemName) {
    const cleanName = itemName.trim();
    const job = window.builderCurrentData?.basic?.character_class || "";
    
    if (cleanName.includes("미트라") || cleanName.includes("엠블렘")) {
        let suffix = "";
        if (job.includes("전사")) suffix = "-전사";
        else if (job.includes("마법사")) suffix = "-마법사";
        else if (job.includes("궁수")) suffix = "-궁수";
        else if (job.includes("도적")) suffix = "-도적";
        else if (job.includes("해적")) suffix = "-해적";
        return cleanName + suffix;
    }
    return cleanName;
};

window.getJobMainStatName = function(jobName) {
    const jobGroup = window.getJobGroup(jobName);
    if (jobGroup === "전사") return "힘";
    if (jobGroup === "궁수") return "덱";
    if (jobGroup === "마법사") return "인";
    if (jobGroup === "도적") return "럭";
    if (jobGroup === "해적") return "힘";
    return "주스탯";
};

window.getJobGroup = function(jobName) {
    if (!jobName) return "공통";
    const warrior = ["히어로", "팔라딘", "다크나이트", "소울마스터", "미하일", "블래스터", "데몬", "아란", "카이저", "아델", "제로", "전사", "렌"];
    const magician = ["비숍", "아크메이지", "불독", "썬콜", "플레임위자드", "배틀메이지", "에반", "루미너스", "일륨", "라라", "키네시스", "마법사"];
    const bowman = ["보우마스터", "신궁", "패스파인더", "윈드브레이커", "와일드헌터", "메르세데스", "카인", "궁수"];
    const thief = ["나이트로드", "섀도어", "듀얼블레이드", "나이트워커", "팬텀", "카데나", "호영", "칼리", "도적"];
    const pirate = ["바이퍼", "캡틴", "캐논슈터", "스트라이커", "메카닉", "은월", "엔젤릭버스터", "아크", "해적"];
    if (warrior.some(job => jobName.includes(job))) return "전사";
    if (magician.some(job => jobName.includes(job))) return "마법사";
    if (bowman.some(job => jobName.includes(job))) return "궁수";
    if (thief.some(job => jobName.includes(job))) return "도적";
    if (pirate.some(job => jobName.includes(job))) return "해적";
    return "공통";
};

window.getAutoPresetName = function() {
    let dropMesoCount = 0;
    window.builderEquippedItems.forEach(item => {
        if (item && item.potentials) {
            item.potentials.forEach(p => {
                if (p.type === '아이템 드롭률%' || p.type === '메소 획득량%') {
                    dropMesoCount++;
                }
            });
        }
    });
    const isHunting = dropMesoCount >= 2;
    return isHunting ? "사냥 세팅" : "보스 세팅";
};