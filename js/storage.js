/**
 * localStorage 存档管理 V2
 * 支持3个存档槽位 + 全局统计 + 成就
 */
const Storage = {
    SAVE_KEY: 'cashflow_saves',
    STATS_KEY: 'cashflow_stats',
    ACHIEVE_KEY: 'cashflow_achievements',
    MAX_SLOTS: 3,
    SAVE_VERSION: 2,

    // === 存档管理 ===

    getAllSaves() {
        try {
            const data = localStorage.getItem(this.SAVE_KEY);
            return data ? JSON.parse(data) : {};
        } catch { return {}; }
    },

    save(slotId, player) {
        const saves = this.getAllSaves();
        saves[slotId] = {
            version: this.SAVE_VERSION,
            player: player.toJSON(),
            savedAt: new Date().toISOString(),
            summary: {
                career: player.careerName,
                month: player.month,
                cash: player.cash,
                cashflow: player.getMonthlyCashflow(),
                progress: player.getFreedomProgress()
            }
        };
        localStorage.setItem(this.SAVE_KEY, JSON.stringify(saves));
    },

    load(slotId) {
        const saves = this.getAllSaves();
        if (!saves[slotId]) return null;
        const saveData = saves[slotId];
        // 版本迁移
        if (!saveData.version || saveData.version < this.SAVE_VERSION) {
            return this.migrate(saveData.player);
        }
        return Player.fromJSON(saveData.player);
    },

    /** V1→V2迁移 */
    migrate(playerData) {
        // 补充V2新增字段的默认值
        playerData.history = playerData.history || [];
        playerData.decisions = playerData.decisions || [];
        playerData.quizTotal = playerData.quizTotal || 0;
        playerData.quizCorrect = playerData.quizCorrect || 0;
        playerData.optionalRejected = playerData.optionalRejected || 0;
        playerData.optionalAccepted = playerData.optionalAccepted || 0;
        playerData.lowestCash = playerData.lowestCash !== undefined ? playerData.lowestCash : playerData.cash;
        playerData.hasInsurance = playerData.hasInsurance || false;
        // 给支出补充inflatable字段
        if (playerData.expenses) {
            playerData.expenses.forEach(e => {
                if (e.inflatable === undefined) {
                    e.inflatable = !e.name.includes('月供') && !e.name.includes('还款') &&
                                   !e.name.includes('保险') && !e.name.includes('贷');
                }
            });
        }
        playerData.version = 2;
        return Player.fromJSON(playerData);
    },

    deleteSave(slotId) {
        const saves = this.getAllSaves();
        delete saves[slotId];
        localStorage.setItem(this.SAVE_KEY, JSON.stringify(saves));
    },

    getSaveSummaries() {
        const saves = this.getAllSaves();
        const summaries = [];
        for (let i = 1; i <= this.MAX_SLOTS; i++) {
            const key = 'slot' + i;
            if (saves[key]) {
                summaries.push({ slotId: key, ...saves[key].summary, savedAt: saves[key].savedAt });
            }
        }
        return summaries;
    },

    getNextFreeSlot() {
        const saves = this.getAllSaves();
        for (let i = 1; i <= this.MAX_SLOTS; i++) {
            if (!saves['slot' + i]) return 'slot' + i;
        }
        return null;
    },

    hasAnySaves() {
        return this.getSaveSummaries().length > 0;
    },

    // === 全局统计 ===

    getStats() {
        try {
            const data = localStorage.getItem(this.STATS_KEY);
            return data ? JSON.parse(data) : this.defaultStats();
        } catch { return this.defaultStats(); }
    },

    defaultStats() {
        return {
            totalGames: 0,
            totalMonths: 0,
            totalWins: 0,
            fastestWin: null, // { months, career }
            careerWins: {},   // { careerId: true }
            totalQuizCorrect: 0,
            totalQuizTotal: 0,
            totalPassiveEarned: 0,
            bestPassiveIncome: 0
        };
    },

    updateStats(player, won) {
        const stats = this.getStats();
        stats.totalGames++;
        stats.totalMonths += player.month;
        stats.totalQuizCorrect += player.quizCorrect;
        stats.totalQuizTotal += player.quizTotal;

        if (won) {
            stats.totalWins++;
            if (!stats.fastestWin || player.month < stats.fastestWin.months) {
                stats.fastestWin = { months: player.month, career: player.careerName };
            }
            stats.careerWins[player.careerData.id] = true;
        }

        const passive = player.getPassiveIncome();
        if (passive > stats.bestPassiveIncome) {
            stats.bestPassiveIncome = passive;
        }

        // 估算总被动收入 (从历史记录)
        player.history.forEach(h => {
            stats.totalPassiveEarned += h.passiveIncome;
        });

        localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
        return stats;
    },

    // === 成就 ===

    getUnlockedAchievements() {
        try {
            const data = localStorage.getItem(this.ACHIEVE_KEY);
            return data ? JSON.parse(data) : [];
        } catch { return []; }
    },

    saveAchievements(list) {
        localStorage.setItem(this.ACHIEVE_KEY, JSON.stringify(list));
    }
};
