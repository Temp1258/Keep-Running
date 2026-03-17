/**
 * 成就系统
 */
const ACHIEVEMENTS = [
    { id: 'first_asset', name: '第一桶金', desc: '首次购买资产', icon: '🏆' },
    { id: 'passive_1k', name: '被动收入破千', desc: '被动收入达到 ¥1,000/月', icon: '💰' },
    { id: 'passive_10k', name: '被动收入破万', desc: '被动收入达到 ¥10,000/月', icon: '💎' },
    { id: 'no_tempt', name: '定力大师', desc: '一局中拒绝所有可选消费', icon: '🧘' },
    { id: 'speed_30', name: '闪电自由', desc: '30个月内达成财务自由', icon: '⚡' },
    { id: 'speed_20', name: '极速自由', desc: '20个月内达成财务自由', icon: '🚀' },
    { id: 'all_careers', name: '全能选手', desc: '用4个职业各通关1次', icon: '🎭' },
    { id: 'quiz_master', name: '财商达人', desc: '累计答对20道题', icon: '🎓' },
    { id: 'diversified', name: '分散投资', desc: '同时持有3种类型资产', icon: '🌐' },
    { id: 'debt_free', name: '无债一身轻', desc: '还清所有负债（含初始负债）', icon: '🕊️' },
    { id: 'reject_car', name: '拒绝车贷', desc: '拒绝买新车的诱惑', icon: '🚫' },
    { id: 'survivor', name: '绝地求生', desc: '现金低于¥1000后逆转通关', icon: '🔥' },
    // V3 achievements
    { id: 'quadrant_s', name: '自由职业者', desc: '进化到S象限', icon: '🔧' },
    { id: 'quadrant_b', name: '企业主', desc: '进化到B象限', icon: '🏢' },
    { id: 'quadrant_i', name: '投资家', desc: '进化到I象限', icon: '👑' },
    { id: 'synergy_first', name: '协同效应', desc: '首次触发资产协同效应', icon: '🔗' },
    { id: 'synergy_3', name: '协同大师', desc: '同时激活3个协同效应', icon: '⚙️' },
    { id: 'iq_max', name: '财商满级', desc: '财商等级达到3级', icon: '🧠' },
    { id: 'protection_max', name: '铜墙铁壁', desc: '资产保护等级达到3级', icon: '🛡️' },
    { id: 'phoenix', name: '浴火重生', desc: '破产重启后达成财务自由', icon: '🐦' },
    { id: 'rich_pattern', name: '富人模式', desc: '现金流模式达到富人模式', icon: '💫' },
    { id: 'payselfirst', name: '先付自己', desc: '投资准备金累计达到¥50,000', icon: '🏦' },
    { id: 'satisfaction_max', name: '心满意足', desc: '满意度达到100', icon: '😊' }
];

const AchievementChecker = {
    /** 检查并返回新解锁的成就 */
    check(player, event, globalStats) {
        const unlocked = Storage.getUnlockedAchievements();
        const newlyUnlocked = [];

        const tryUnlock = (id) => {
            if (!unlocked.includes(id)) {
                newlyUnlocked.push(id);
            }
        };

        // first_asset: 购买第一个资产
        if (player.assets.length >= 1) tryUnlock('first_asset');

        // passive_1k
        if (player.getPassiveIncome() >= 1000) tryUnlock('passive_1k');

        // passive_10k
        if (player.getPassiveIncome() >= 10000) tryUnlock('passive_10k');

        // diversified: 3种类型
        if (player.getAssetTypeCount() >= 3) tryUnlock('diversified');

        // debt_free: 无负债
        if (player.liabilities.length === 0 && player.month > 1) tryUnlock('debt_free');

        // reject_car
        if (event === 'reject_car') tryUnlock('reject_car');

        // 游戏结束时检查
        if (event === 'game_win') {
            if (player.month <= 30) tryUnlock('speed_30');
            if (player.month <= 20) tryUnlock('speed_20');
            if (player.optionalAccepted === 0 && player.optionalRejected > 0) tryUnlock('no_tempt');
            if (player.lowestCash < 1000) tryUnlock('survivor');

            // all_careers
            if (globalStats) {
                const careerWins = globalStats.careerWins || {};
                careerWins[player.careerData.id] = true;
                if (Object.keys(careerWins).length >= 4) tryUnlock('all_careers');
            }
        }

        // quiz_master: 累计
        if (globalStats && globalStats.totalQuizCorrect >= 20) tryUnlock('quiz_master');

        // V3 achievements

        // quadrant evolution
        if (player.quadrant === 'S' || player.quadrant === 'B' || player.quadrant === 'I') tryUnlock('quadrant_s');
        if (player.quadrant === 'B' || player.quadrant === 'I') tryUnlock('quadrant_b');
        if (player.quadrant === 'I') tryUnlock('quadrant_i');

        // synergy
        const activeSynergies = player.getActiveSynergies ? player.getActiveSynergies() : (player.activeSynergies || []);
        if (activeSynergies.length >= 1) tryUnlock('synergy_first');
        if (activeSynergies.length >= 3) tryUnlock('synergy_3');

        // financial IQ max
        if (player.financialIQ >= 3) tryUnlock('iq_max');

        // protection max
        if (player.protectionLevel >= 3) tryUnlock('protection_max');

        // phoenix: restart then win
        if (event === 'game_win' && player.restartCount > 0) tryUnlock('phoenix');

        // rich pattern
        if (player.getCashflowPattern && player.getCashflowPattern() === 'rich') tryUnlock('rich_pattern');
        if (player.lastCashflowPattern === 'rich') tryUnlock('rich_pattern');

        // pay self first reserve
        if (player.investReserve >= 50000) tryUnlock('payselfirst');

        // satisfaction max
        if (player.satisfaction >= 100) tryUnlock('satisfaction_max');

        // 保存新成就
        if (newlyUnlocked.length > 0) {
            Storage.saveAchievements([...unlocked, ...newlyUnlocked]);
        }

        return newlyUnlocked;
    }
};
