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
    { id: 'survivor', name: '绝地求生', desc: '现金低于¥1000后逆转通关', icon: '🔥' }
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

        // 保存新成就
        if (newlyUnlocked.length > 0) {
            Storage.saveAchievements([...unlocked, ...newlyUnlocked]);
        }

        return newlyUnlocked;
    }
};
