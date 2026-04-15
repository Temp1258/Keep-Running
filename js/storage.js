/**
 * localStorage 存档管理 V3
 * 支持3个存档槽位 + 全局统计 + 成就
 */
const Storage = {
    SAVE_KEY: 'cashflow_saves',
    STATS_KEY: 'cashflow_stats',
    ACHIEVE_KEY: 'cashflow_achievements',
    ANALYTICS_KEY: 'cashflow_analytics',
    GUIDE_KEY: 'cashflow_beginner_guide_seen_v1',
    MAX_SLOTS: 3,
    SAVE_VERSION: 4,
    MAX_EVENTS: 2000,

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

    /** 版本迁移：V1→V2→V3 */
    migrate(playerData) {
        // V1→V2: 补充V2新增字段
        if (!playerData.version || playerData.version < 2) {
            playerData.history = playerData.history || [];
            playerData.decisions = playerData.decisions || [];
            playerData.quizTotal = playerData.quizTotal || 0;
            playerData.quizCorrect = playerData.quizCorrect || 0;
            playerData.optionalRejected = playerData.optionalRejected || 0;
            playerData.optionalAccepted = playerData.optionalAccepted || 0;
            playerData.lowestCash = playerData.lowestCash !== undefined ? playerData.lowestCash : playerData.cash;
            playerData.hasInsurance = playerData.hasInsurance || false;
            if (playerData.expenses) {
                playerData.expenses.forEach(e => {
                    if (e.inflatable === undefined) {
                        e.inflatable = !e.name.includes('月供') && !e.name.includes('还款') &&
                                       !e.name.includes('保险') && !e.name.includes('贷');
                    }
                });
            }
            playerData.version = 2;
        }

        // V2→V3: 补充V3新增字段
        if (playerData.version < 3) {
            playerData.investReserve = playerData.investReserve || 0;
            playerData.paySelfRate = playerData.paySelfRate || 0;
            playerData.satisfaction = playerData.satisfaction !== undefined ? playerData.satisfaction : 70;
            playerData.quadrant = playerData.quadrant || 'E';
            playerData.taxPaid = playerData.taxPaid || { salary: 0, passive: 0, capital: 0 };
            playerData.financialIQ = playerData.financialIQ || 0;
            playerData.protectionLevel = playerData.protectionLevel || 0;
            playerData.restartCount = playerData.restartCount || 0;
            playerData.answeredQuizIds = playerData.answeredQuizIds || [];
            playerData.seenPatterns = playerData.seenPatterns || [];
            playerData.lastCashflowPattern = playerData.lastCashflowPattern || 'poor';
            playerData.activeSynergies = playerData.activeSynergies || [];
            playerData.fomoQueue = playerData.fomoQueue || [];
            playerData.lastSocialEventMonth = playerData.lastSocialEventMonth || 0;
            playerData.pendingSocialFollowup = playerData.pendingSocialFollowup || null;
            playerData.totalInvested = playerData.totalInvested || 0;
            // 给现有资产补充V3追踪字段
            if (playerData.assets) {
                playerData.assets.forEach(a => {
                    if (a.purchaseMonth === undefined) a.purchaseMonth = 1;
                    if (a.totalEarned === undefined) a.totalEarned = 0;
                    if (a.purchasePrice === undefined) a.purchasePrice = a.cost || 0;
                });
            }
            playerData.version = 3;
        }

        // V3→V4: 补充V4新增字段
        if (playerData.version < 4) {
            playerData.socialCapital = playerData.socialCapital !== undefined ? playerData.socialCapital : 50;
            playerData.specialTrait = playerData.specialTrait || null;
            playerData.maxLoanAmount = playerData.maxLoanAmount || 100000;
            playerData.salaryGrowthCap = playerData.salaryGrowthCap || 0;
            playerData.milestonesPassed = playerData.milestonesPassed || [];
            playerData.actionUsedThisMonth = false;
            playerData.searchUsedThisMonth = false;
            // 从career数据恢复特性（如果career数据存在）
            if (playerData.careerData) {
                if (!playerData.specialTrait) playerData.specialTrait = playerData.careerData.specialTrait || null;
                if (playerData.maxLoanAmount === 100000) playerData.maxLoanAmount = playerData.careerData.maxLoanAmount || 100000;
                if (playerData.salaryGrowthCap === 0) playerData.salaryGrowthCap = playerData.careerData.salaryGrowthCap || 0;
                if (playerData.socialCapital === 50) playerData.socialCapital = playerData.careerData.socialCapital || 50;
            }
            playerData.version = 4;
        }

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

    // === 新手引导 ===

    hasSeenBeginnerGuide() {
        try {
            return localStorage.getItem(this.GUIDE_KEY) === '1';
        } catch {
            return false;
        }
    },

    markBeginnerGuideSeen() {
        localStorage.setItem(this.GUIDE_KEY, '1');
    },

    // === 行为分析与漏斗 ===

    defaultAnalytics() {
        return {
            version: 1,
            appSessions: {}, // { appSessionId: { openedAt, startedGame, reached6, reached12, won, ... } }
            gameRuns: {},    // { gameRunId: { appSessionId, startedAt, reached6, reached12, won, ended, ... } }
            events: [],      // 最近行为事件，用于调试与深挖
            updatedAt: null
        };
    },

    getAnalytics() {
        try {
            const raw = localStorage.getItem(this.ANALYTICS_KEY);
            const data = raw ? JSON.parse(raw) : this.defaultAnalytics();
            data.version = data.version || 1;
            data.appSessions = data.appSessions || {};
            data.gameRuns = data.gameRuns || {};
            data.events = Array.isArray(data.events) ? data.events : [];
            return data;
        } catch {
            return this.defaultAnalytics();
        }
    },

    saveAnalytics(data) {
        data.updatedAt = new Date().toISOString();
        localStorage.setItem(this.ANALYTICS_KEY, JSON.stringify(data));
    },

    generateTrackingId(prefix) {
        return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    },

    _appendEvent(data, type, payload) {
        data.events.push({
            type,
            ts: new Date().toISOString(),
            ...(payload || {})
        });
        if (data.events.length > this.MAX_EVENTS) {
            data.events = data.events.slice(-this.MAX_EVENTS);
        }
    },

    startAppSession() {
        const data = this.getAnalytics();
        const appSessionId = this.generateTrackingId('app');
        const now = new Date().toISOString();
        data.appSessions[appSessionId] = {
            id: appSessionId,
            openedAt: now,
            lastActiveAt: now,
            startedGame: false,
            reached6: false,
            reached12: false,
            won: false,
            gameRuns: []
        };
        this._appendEvent(data, 'app_open', { appSessionId });
        this.saveAnalytics(data);
        return appSessionId;
    },

    startGameRun(appSessionId, meta) {
        const data = this.getAnalytics();
        const gameRunId = this.generateTrackingId('run');
        const now = new Date().toISOString();
        const startMonth = Math.max(1, (meta && meta.startMonth) || 1);
        const run = {
            id: gameRunId,
            appSessionId: appSessionId || null,
            startedAt: now,
            endedAt: null,
            ended: false,
            won: false,
            career: (meta && meta.career) || '',
            duration: (meta && meta.duration) || 60,
            startMonth,
            maxMonth: startMonth,
            reached6: startMonth >= 6,
            reached12: startMonth >= 12,
            endReason: null,
            endMonth: null,
            isLoadedGame: !!(meta && meta.isLoadedGame)
        };
        data.gameRuns[gameRunId] = run;

        const appSession = appSessionId ? data.appSessions[appSessionId] : null;
        if (appSession) {
            appSession.startedGame = true;
            appSession.lastActiveAt = now;
            appSession.gameRuns = appSession.gameRuns || [];
            appSession.gameRuns.push(gameRunId);
            if (run.reached6) appSession.reached6 = true;
            if (run.reached12) appSession.reached12 = true;
        }

        this._appendEvent(data, 'game_start', {
            appSessionId: appSessionId || null,
            gameRunId,
            career: run.career,
            duration: run.duration,
            startMonth,
            isLoadedGame: run.isLoadedGame
        });
        this.saveAnalytics(data);
        return gameRunId;
    },

    trackGameProgress(gameRunId, month) {
        if (!gameRunId) return;
        const data = this.getAnalytics();
        const run = data.gameRuns[gameRunId];
        if (!run) return;

        const m = Math.max(1, month || 1);
        run.maxMonth = Math.max(run.maxMonth || 1, m);

        let changed = false;
        if (m >= 6 && !run.reached6) {
            run.reached6 = true;
            changed = true;
            this._appendEvent(data, 'reach_month_6', { gameRunId, appSessionId: run.appSessionId || null, month: m });
        }
        if (m >= 12 && !run.reached12) {
            run.reached12 = true;
            changed = true;
            this._appendEvent(data, 'reach_month_12', { gameRunId, appSessionId: run.appSessionId || null, month: m });
        }

        if (changed && run.appSessionId && data.appSessions[run.appSessionId]) {
            const appSession = data.appSessions[run.appSessionId];
            appSession.lastActiveAt = new Date().toISOString();
            if (run.reached6) appSession.reached6 = true;
            if (run.reached12) appSession.reached12 = true;
        }

        if (changed) this.saveAnalytics(data);
    },

    endGameRun(gameRunId, result) {
        if (!gameRunId) return;
        const data = this.getAnalytics();
        const run = data.gameRuns[gameRunId];
        if (!run || run.ended) return;

        const now = new Date().toISOString();
        run.ended = true;
        run.endedAt = now;
        run.won = !!(result && result.won);
        run.endReason = (result && result.reason) || null;
        run.endMonth = (result && result.month) || run.maxMonth || run.startMonth || 1;

        if (run.endMonth >= 6) run.reached6 = true;
        if (run.endMonth >= 12) run.reached12 = true;

        if (run.appSessionId && data.appSessions[run.appSessionId]) {
            const appSession = data.appSessions[run.appSessionId];
            appSession.lastActiveAt = now;
            appSession.startedGame = true;
            if (run.reached6) appSession.reached6 = true;
            if (run.reached12) appSession.reached12 = true;
            if (run.won) appSession.won = true;
        }

        this._appendEvent(data, run.won ? 'game_win' : 'game_end', {
            gameRunId,
            appSessionId: run.appSessionId || null,
            reason: run.endReason,
            month: run.endMonth
        });
        this.saveAnalytics(data);
    },

    trackEvent(type, payload) {
        const data = this.getAnalytics();
        this._appendEvent(data, type, payload || {});
        this.saveAnalytics(data);
    },

    getFunnelReport() {
        const data = this.getAnalytics();
        const appSessions = Object.values(data.appSessions || {});
        const gameRuns = Object.values(data.gameRuns || {});
        const freshRuns = gameRuns.filter(r => !r.isLoadedGame);

        const appEntered = appSessions.length;
        const appProgress = {};
        appSessions.forEach(s => {
            appProgress[s.id] = { started: false, reached6: false, reached12: false, won: false };
        });
        freshRuns.forEach(r => {
            if (!r.appSessionId || !appProgress[r.appSessionId]) return;
            const p = appProgress[r.appSessionId];
            p.started = true;
            if (r.reached6) p.reached6 = true;
            if (r.reached12) p.reached12 = true;
            if (r.won) p.won = true;
        });
        const appStages = Object.values(appProgress);
        const appStarted = appStages.filter(p => p.started).length;
        const appReached6 = appStages.filter(p => p.reached6).length;
        const appReached12 = appStages.filter(p => p.reached12).length;
        const appWon = appStages.filter(p => p.won).length;

        const gameStarted = freshRuns.length;
        const gameReached6 = freshRuns.filter(r => r.reached6).length;
        const gameReached12 = freshRuns.filter(r => r.reached12).length;
        const gameWon = freshRuns.filter(r => r.won).length;
        const loadedGameCount = gameRuns.length - freshRuns.length;

        return {
            app: {
                entered: appEntered,
                started: appStarted,
                reached6: appReached6,
                reached12: appReached12,
                won: appWon
            },
            game: {
                started: gameStarted,
                reached6: gameReached6,
                reached12: gameReached12,
                won: gameWon
            },
            loadedGames: loadedGameCount,
            eventCount: (data.events || []).length,
            updatedAt: data.updatedAt || null
        };
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
