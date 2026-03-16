/**
 * 玩家数据模型
 * V2: linkedId关联、历史记录、决策记录、贷款摊还、主动还贷
 */
class Player {
    constructor(career) {
        this.careerData = career;
        this.careerName = career.name;
        this.salary = career.salary;
        this.cash = career.cash;
        this.month = 1;
        this.hasInsurance = false;

        // 支出列表 { name, amount, inflatable, linkedId? }
        this.expenses = career.expenses.map(e => ({ ...e }));

        // 负债列表 { name, total, monthly, linkedId? }
        this.liabilities = career.liabilities.map(l => ({ ...l }));

        // 资产列表 { name, type, cost, income, linkedId? }
        this.assets = [];

        // 被动收入条目 { name, amount, sourceAsset, linkedId? }
        this.passiveIncomes = [];

        // 历史记录（每月快照）
        this.history = [];

        // 决策记录
        this.decisions = [];

        // 学习卡统计
        this.quizTotal = 0;
        this.quizCorrect = 0;

        // 单局拒绝消费计数
        this.optionalRejected = 0;
        this.optionalAccepted = 0;

        // 曾经的最低现金
        this.lowestCash = career.cash;
    }

    /** 生成唯一关联ID */
    static generateLinkedId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    /** 总收入 = 工资 + 被动收入 */
    getTotalIncome() {
        return this.salary + this.getPassiveIncome();
    }

    /** 被动收入总计 */
    getPassiveIncome() {
        return this.passiveIncomes.reduce((sum, p) => sum + p.amount, 0);
    }

    /** 总支出 */
    getTotalExpense() {
        return this.expenses.reduce((sum, e) => sum + e.amount, 0);
    }

    /** 月现金流 */
    getMonthlyCashflow() {
        return this.getTotalIncome() - this.getTotalExpense();
    }

    /** 总资产价值 */
    getTotalAssets() {
        return this.assets.reduce((sum, a) => sum + a.cost, 0) + this.cash;
    }

    /** 总负债 */
    getTotalLiabilities() {
        return this.liabilities.reduce((sum, l) => sum + l.total, 0);
    }

    /** 净资产 */
    getNetWorth() {
        return this.getTotalAssets() - this.getTotalLiabilities();
    }

    /** 财务自由进度 (被动收入 / 总支出) */
    getFreedomProgress() {
        const expense = this.getTotalExpense();
        if (expense === 0) return 100;
        return Math.min(100, Math.round((this.getPassiveIncome() / expense) * 100));
    }

    /** 是否达到财务自由 */
    isFinanciallyFree() {
        return this.getPassiveIncome() >= this.getTotalExpense() && this.getTotalExpense() > 0;
    }

    /** 是否破产 */
    isBankrupt() {
        return this.cash < 0;
    }

    /** 记录月度快照 */
    recordSnapshot() {
        this.history.push({
            month: this.month,
            cash: this.cash,
            cashflow: this.getMonthlyCashflow(),
            passiveIncome: this.getPassiveIncome(),
            totalExpense: this.getTotalExpense(),
            totalAssets: this.getTotalAssets(),
            totalLiabilities: this.getTotalLiabilities(),
            netWorth: this.getNetWorth()
        });
    }

    /** 记录决策 */
    recordDecision(type, name, amount, cashflowImpact) {
        this.decisions.push({
            month: this.month,
            type: type, // 'buy', 'sell', 'reject', 'spend', 'refuse_spend', 'repay'
            name: name,
            amount: amount || 0,
            cashflowImpact: cashflowImpact || 0
        });
    }

    /** 结算月收支 */
    processMonth() {
        // 记录快照（在结算前）
        this.recordSnapshot();

        const income = this.getTotalIncome();
        const expense = this.getTotalExpense();
        this.cash += income - expense;

        // 贷款摊还：月供的60%偿还本金
        this.amortizeLoans();

        this.month++;

        // 更新最低现金记录
        if (this.cash < this.lowestCash) {
            this.lowestCash = this.cash;
        }

        return { income, expense, cashflow: income - expense };
    }

    /** 贷款自然摊还 */
    amortizeLoans() {
        const toRemove = [];
        this.liabilities.forEach((l, idx) => {
            const principalPayment = Math.round(l.monthly * 0.6);
            l.total -= principalPayment;
            if (l.total <= 0) {
                toRemove.push(idx);
            }
        });

        // 从后向前移除已还清的贷款
        for (let i = toRemove.length - 1; i >= 0; i--) {
            const idx = toRemove[i];
            const liab = this.liabilities[idx];
            // 移除对应月供支出
            if (liab.linkedId) {
                const expIdx = this.expenses.findIndex(e => e.linkedId === liab.linkedId);
                if (expIdx !== -1) this.expenses.splice(expIdx, 1);
            } else {
                // 兼容旧数据：按名称+金额匹配
                const expIdx = this.expenses.findIndex(e => e.amount === liab.monthly && !e.inflatable);
                if (expIdx !== -1) this.expenses.splice(expIdx, 1);
            }
            this.liabilities.splice(idx, 1);
        }

        return toRemove.length; // 返回还清的贷款数量
    }

    /** 通胀：可通胀的支出涨价 */
    applyInflation(rate) {
        let totalIncrease = 0;
        this.expenses.forEach(e => {
            if (e.inflatable) {
                const increase = Math.round(e.amount * rate);
                e.amount += increase;
                totalIncrease += increase;
            }
        });
        return totalIncrease;
    }

    /** 购买资产（使用linkedId关联） */
    buyAsset(card) {
        if (this.cash < card.downPayment) return false;

        const linkedId = Player.generateLinkedId();
        this.cash -= card.downPayment;

        this.assets.push({ ...card.asset, linkedId });
        this.passiveIncomes.push({
            name: card.asset.name + '收入',
            amount: card.monthlyIncome,
            sourceAsset: card.asset.name,
            linkedId
        });

        // 如果有贷款
        if (card.liability) {
            this.liabilities.push({ ...card.liability, linkedId });
            this.expenses.push({ ...card.expense, inflatable: false, linkedId });
        }

        // 记录决策
        const netCashflow = card.monthlyIncome - (card.liability ? card.liability.monthly : 0);
        this.recordDecision('buy', card.asset.name, card.downPayment, netCashflow);

        return true;
    }

    /** 卖出资产（通过linkedId精确匹配） */
    sellAsset(assetName, sellPrice) {
        const assetIndex = this.assets.findIndex(a => a.name === assetName);
        if (assetIndex === -1) return false;

        const asset = this.assets[assetIndex];
        const linkedId = asset.linkedId;
        let loanRemaining = 0;

        this.cash += sellPrice;

        // 移除资产
        this.assets.splice(assetIndex, 1);

        // 移除对应的被动收入
        let removedIncome = 0;
        if (linkedId) {
            const incIdx = this.passiveIncomes.findIndex(p => p.linkedId === linkedId);
            if (incIdx !== -1) {
                removedIncome = this.passiveIncomes[incIdx].amount;
                this.passiveIncomes.splice(incIdx, 1);
            }
        } else {
            const incIdx = this.passiveIncomes.findIndex(p => p.sourceAsset === assetName);
            if (incIdx !== -1) {
                removedIncome = this.passiveIncomes[incIdx].amount;
                this.passiveIncomes.splice(incIdx, 1);
            }
        }

        // 移除对应的负债和支出
        if (linkedId) {
            const liabIdx = this.liabilities.findIndex(l => l.linkedId === linkedId);
            if (liabIdx !== -1) {
                loanRemaining = this.liabilities[liabIdx].total;
                this.cash -= loanRemaining;
                this.liabilities.splice(liabIdx, 1);

                const expIdx = this.expenses.findIndex(e => e.linkedId === linkedId);
                if (expIdx !== -1) this.expenses.splice(expIdx, 1);
            }
        } else {
            // 兼容旧数据
            const liabIdx = this.liabilities.findIndex(l =>
                l.name.includes(assetName) || assetName.includes(l.name.replace('房贷', '').replace('贷款', ''))
            );
            if (liabIdx !== -1) {
                const liab = this.liabilities[liabIdx];
                loanRemaining = liab.total;
                this.cash -= loanRemaining;
                this.liabilities.splice(liabIdx, 1);

                const expIdx = this.expenses.findIndex(e => e.amount === liab.monthly &&
                    (e.name.includes(assetName) || assetName.includes(e.name.replace('月供', '').replace('房贷', ''))));
                if (expIdx !== -1) this.expenses.splice(expIdx, 1);
            }
        }

        // 记录决策
        this.recordDecision('sell', assetName, sellPrice - loanRemaining, -removedIncome);

        return { netProceeds: sellPrice - loanRemaining, loanRemaining };
    }

    /** 主动提前还清负债 */
    payOffLiability(index) {
        if (index < 0 || index >= this.liabilities.length) return false;
        const liab = this.liabilities[index];
        if (this.cash < liab.total) return false;

        this.cash -= liab.total;
        const linkedId = liab.linkedId;

        // 移除对应月供支出
        if (linkedId) {
            const expIdx = this.expenses.findIndex(e => e.linkedId === linkedId);
            if (expIdx !== -1) this.expenses.splice(expIdx, 1);
        } else {
            const expIdx = this.expenses.findIndex(e => e.amount === liab.monthly && !e.inflatable);
            if (expIdx !== -1) this.expenses.splice(expIdx, 1);
        }

        const amount = liab.total;
        const monthlySaved = liab.monthly;
        this.liabilities.splice(index, 1);

        this.recordDecision('repay', liab.name, amount, monthlySaved);
        return { amount, monthlySaved };
    }

    /** 支付一次性费用 */
    payExpense(amount) {
        this.cash -= amount;
        if (this.cash < this.lowestCash) this.lowestCash = this.cash;
    }

    /** 添加持续性支出和负债 */
    addRecurringExpense(expenseData, liabilityData) {
        const linkedId = Player.generateLinkedId();
        if (expenseData) this.expenses.push({ ...expenseData, inflatable: false, linkedId });
        if (liabilityData) this.liabilities.push({ ...liabilityData, linkedId });
    }

    /** 获得一次性收入 */
    receiveIncome(amount) {
        this.cash += amount;
    }

    /** 更新资产价值 */
    updateAssetValues(assetType, multiplier) {
        this.assets.forEach(a => {
            if (a.type === assetType) {
                a.cost = Math.round(a.cost * multiplier);
            }
        });
    }

    /** 更新资产收入 */
    updateAssetIncomes(assetType, multiplier) {
        this.passiveIncomes.forEach(p => {
            const asset = this.assets.find(a => a.name === p.sourceAsset && a.type === assetType);
            if (asset) {
                p.amount = Math.round(p.amount * multiplier);
            }
        });
    }

    /** 获取资产类型统计 */
    getAssetTypeCount() {
        const types = new Set(this.assets.map(a => a.type));
        return types.size;
    }

    /** 获取最佳/最差决策 */
    getTopDecisions(count) {
        const buys = this.decisions.filter(d => d.type === 'buy' && d.cashflowImpact !== 0);
        const sorted = [...buys].sort((a, b) => b.cashflowImpact - a.cashflowImpact);
        return {
            best: sorted.slice(0, count),
            worst: sorted.slice(-count).reverse()
        };
    }

    /** 序列化 */
    toJSON() {
        return {
            version: 2,
            careerData: this.careerData,
            careerName: this.careerName,
            salary: this.salary,
            cash: this.cash,
            month: this.month,
            hasInsurance: this.hasInsurance,
            expenses: this.expenses,
            liabilities: this.liabilities,
            assets: this.assets,
            passiveIncomes: this.passiveIncomes,
            history: this.history,
            decisions: this.decisions,
            quizTotal: this.quizTotal,
            quizCorrect: this.quizCorrect,
            optionalRejected: this.optionalRejected,
            optionalAccepted: this.optionalAccepted,
            lowestCash: this.lowestCash
        };
    }

    /** 反序列化 */
    static fromJSON(data) {
        const p = new Player(data.careerData);
        p.careerName = data.careerName;
        p.salary = data.salary;
        p.cash = data.cash;
        p.month = data.month;
        p.hasInsurance = data.hasInsurance || false;
        p.expenses = data.expenses;
        p.liabilities = data.liabilities;
        p.assets = data.assets;
        p.passiveIncomes = data.passiveIncomes;
        p.history = data.history || [];
        p.decisions = data.decisions || [];
        p.quizTotal = data.quizTotal || 0;
        p.quizCorrect = data.quizCorrect || 0;
        p.optionalRejected = data.optionalRejected || 0;
        p.optionalAccepted = data.optionalAccepted || 0;
        p.lowestCash = data.lowestCash !== undefined ? data.lowestCash : data.cash;
        return p;
    }
}
