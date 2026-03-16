/**
 * localStorage 存档管理
 * 支持3个存档槽位
 */
const Storage = {
    SAVE_KEY: 'cashflow_saves',
    MAX_SLOTS: 3,

    /** 获取所有存档 */
    getAllSaves() {
        try {
            const data = localStorage.getItem(this.SAVE_KEY);
            return data ? JSON.parse(data) : {};
        } catch {
            return {};
        }
    },

    /** 保存游戏到指定槽位 */
    save(slotId, player) {
        const saves = this.getAllSaves();
        saves[slotId] = {
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

    /** 加载指定槽位的存档 */
    load(slotId) {
        const saves = this.getAllSaves();
        if (!saves[slotId]) return null;
        return Player.fromJSON(saves[slotId].player);
    },

    /** 删除指定槽位 */
    deleteSave(slotId) {
        const saves = this.getAllSaves();
        delete saves[slotId];
        localStorage.setItem(this.SAVE_KEY, JSON.stringify(saves));
    },

    /** 获取存档摘要列表 */
    getSaveSummaries() {
        const saves = this.getAllSaves();
        const summaries = [];
        for (let i = 1; i <= this.MAX_SLOTS; i++) {
            const key = 'slot' + i;
            if (saves[key]) {
                summaries.push({
                    slotId: key,
                    ...saves[key].summary,
                    savedAt: saves[key].savedAt
                });
            }
        }
        return summaries;
    },

    /** 查找下一个空闲槽位 */
    getNextFreeSlot() {
        const saves = this.getAllSaves();
        for (let i = 1; i <= this.MAX_SLOTS; i++) {
            if (!saves['slot' + i]) return 'slot' + i;
        }
        return null;
    },

    /** 是否有任何存档 */
    hasAnySaves() {
        return this.getSaveSummaries().length > 0;
    }
};
