/**
 * ============================================================================
 * 🧮 MAPLE OMNI - js/calculator/cp_calculator.js [전투력 시뮬레이터 연산 커널]
 * 설명: 초보자도 쉽게 이해할 수 있는 실시간 전투력 가상 연산 모듈입니다.
 *       API 재갱신 없이 보공, 크뎀, 최종뎀, 공격력, 주스탯 변화에 따른 
 *       예상 전투력 상승량과 변동치를 정밀 계산합니다.
 * ============================================================================
 */

window.OmniCpCalculator = {

    /**
     * 💡 [초보자 가이드] 현재 검색된 유저의 핵심 스탯 데이터(기본 전투력, 보공, 크뎀 등)를
     * 안전하게 추출하여 계산기 기준선 객체로 파싱합니다.
     */
    getCurrentBaseSpecs: function() {
        // 전역 세션 데이터 또는 캐시된 최신 검색 데이터에서 스탯 정보를 불러옵니다.
        const searchData = window.currentSearchData || window.OmniCache?.getLastSearchData();
        
        // 데이터가 없을 때 사용하는 기본 백업 스탯 수치입니다.
        const baseSpecs = {
            cp: 0,          // 기준 전투력
            bossDmg: 0,     // 보스 몬스터 데미지 (%)
            damage: 0,      // 데미지 (%)
            critDmg: 0,     // 크리티컬 데미지 (%)
            finalDmg: 0,    // 최종 데미지 (%)
            att: 0,         // 공격력/마력
            mainStat: 0     // 주스탯 수치
        };

        if (!searchData || !searchData.stat || !Array.isArray(searchData.stat.final_stat)) {
            // 저장된 최고 전투력(Peak Power)이 있다면 기준 전투력으로 지정합니다.
            const charName = searchData?.basic?.character_name || "";
            baseSpecs.cp = window.OmniCache?.getPeakPower(charName) || 50000000;
            return baseSpecs;
        }

        // 넥슨 API final_stat 배열을 돌면서 공백을 제거한 정확한 스탯 값을 추출합니다.
        searchData.stat.final_stat.forEach(item => {
            if (!item || !item.stat_name) return;
            
            // 스탯 이름의 띄어쓰기를 모두 제거하여 일치 여부를 판단합니다.
            const name = String(item.stat_name).replace(/\s+/g, '');
            const val = parseFloat(String(item.stat_value || '0').replace(/,/g, '')) || 0;

            if (name === "전투력") baseSpecs.cp = val;
            if (name === "보스몬스터데미지" || name === "보스공격력") baseSpecs.bossDmg = val;
            if (name === "데미지") baseSpecs.damage = val;
            if (name === "크리티컬데미지") baseSpecs.critDmg = val;
            if (name === "최종데미지") baseSpecs.finalDmg = val;
            if (name === "공격력" || name === "마력") baseSpecs.att = Math.max(baseSpecs.att, val);
            if (name === "주스탯" || name === "STR" || name === "DEX" || name === "INT" || name === "LUK") {
                if (val > baseSpecs.mainStat) baseSpecs.mainStat = val;
            }
        });

        // 로컬 스토리지에 더 높은 보스 세팅 전투력이 기록되어 있다면 그 값을 우선 적용합니다.
        const charName = searchData?.basic?.character_name || "";
        const peakCp = window.OmniCache?.getPeakPower(charName) || 0;
        if (peakCp > baseSpecs.cp) {
            baseSpecs.cp = peakCp;
        }

        return baseSpecs;
    },

    /**
     * 💡 [초보자 가이드] 스탯 변화 수치(예: 보공 +20%, 크뎀 +5%)를 입력받아
     * 변동된 최종 예상 전투력과 상승액(갭 차이)을 연산해주는 코어 함수입니다.
     * 
     * @param {Object} changes - 변동시킬 스탯 객체 (예: { addBossDmg: 20, addCritDmg: 5, addAtt: 30 })
     */
    calculateProjectedCp: function(changes = {}) {
        // 1. 현재 기준 캐릭터 스탯을 불러옵니다.
        const base = this.getCurrentBaseSpecs();

        if (base.cp <= 0) {
            return { projectedCp: 0, diffCp: 0, growthRate: 0 };
        }

        // 2. 변동 입력값 파싱 (입력값이 없으면 0으로 가산)
        const addBossDmg = parseFloat(changes.addBossDmg) || 0;  // 추가 보공 (%)
        const addDmg = parseFloat(changes.addDmg) || 0;          // 추가 데미지 (%)
        const addCritDmg = parseFloat(changes.addCritDmg) || 0;    // 추가 크뎀 (%)
        const addFinalDmg = parseFloat(changes.addFinalDmg) || 0;  // 추가 최종뎀 (%)
        const addAtt = parseFloat(changes.addAtt) || 0;            // 추가 공격력/마력
        const addMainStat = parseFloat(changes.addMainStat) || 0;  // 추가 주스탯

        // 3. [곱연산 비율 계산 1] 데미지 + 보스데미지 합산 배율 변화량
        // 전투력 공식 상 (100 + 기존데미지 + 기존보공) 대비 (100 + 신규데미지 + 신규보공)의 비율입니다.
        const baseDmgSum = 100 + base.damage + base.bossDmg;
        const newDmgSum = baseDmgSum + addDmg + addBossDmg;
        const dmgFactor = baseDmgSum > 0 ? (newDmgSum / baseDmgSum) : 1;

        // 4. [곱연산 비율 계산 2] 크리티컬 데미지 배율 변화량
        // 기본 크뎀 20% 보정값 포함 연산
        const baseCritFactor = 100 + base.critDmg;
        const newCritFactor = baseCritFactor + addCritDmg;
        const critDmgFactor = baseCritFactor > 0 ? (newCritFactor / baseCritFactor) : 1;

        // 5. [곱연산 비율 계산 3] 최종 데미지 배율 변화량
        const baseFinalFactor = 100 + base.finalDmg;
        const newFinalFactor = baseFinalFactor + addFinalDmg;
        const finalDmgFactor = baseFinalFactor > 0 ? (newFinalFactor / baseFinalFactor) : 1;

        // 6. [가산 연산 비율 계산 4] 공격력/마력 및 주스탯 상승율 보정
        let attFactor = 1;
        if (base.att > 0 && addAtt !== 0) {
            attFactor = (base.att + addAtt) / base.att;
        }

        let statFactor = 1;
        if (base.mainStat > 0 && addMainStat !== 0) {
            statFactor = (base.mainStat + addMainStat) / base.mainStat;
        }

        // 7. 모든 보정 배율을 종합하여 최종 예상 전투력을 산출합니다.
        const totalMultiplier = dmgFactor * critDmgFactor * finalDmgFactor * attFactor * statFactor;
        const projectedCp = Math.round(base.cp * totalMultiplier);
        const diffCp = projectedCp - base.cp; // 상승한 전투력 수치
        const growthRate = ((totalMultiplier - 1) * 100).toFixed(2); // 상승률 (%)

        return {
            baseCp: base.cp,            // 기존 기준 전투력
            projectedCp: projectedCp,  // 시뮬레이션 최종 전투력
            diffCp: diffCp,            // 전투력 차이 (+/-)
            growthRate: growthRate     // 증감 비율 (%)
        };
    },

    /**
     * 💡 [초보자 가이드] 숫자로 들어온 전투력을 "1억 2,345만" 형태의 한글 단위 문자열로 보기 쉽게 포맷팅합니다.
     */
    formatCpToKorean: function(num) {
        if (!num || num <= 0) return "0";
        const eok = Math.floor(num / 100000000);
        const man = Math.floor((num % 100000000) / 10000);

        let str = "";
        if (eok > 0) str += `${eok}억 `;
        if (man > 0) str += `${man.toLocaleString()}만`;
        return str.trim() || `${num.toLocaleString()}`;
    }
};