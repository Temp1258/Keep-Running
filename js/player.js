/**
 * 玩家数据模型
 */
class Player {
    constructor(career) {
        this.careerData = career;
        this.careerName = career.name;
        this.salary = career.salary;
        this.cash = career.cash;
        this.month = 1;

        // 支出列表 { name, amount }
        this.expenses = career.expenses.map(e => ({ ...e }));

        // 负债列表 { name, total, monthly }
        this.liabilities = career.liabilities.map(l => ({ ...l }));

        // 资产列表 { name, type, cost, income }
        this.assets = [];

        // 被动收入条目 { name, amount, sourceAsset }
        this.passiveIncomes = [];
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

    /** 结算月收支 */
    processMonth() {
        const income = this.getTotalIncome();
        const expense = this.getTotalExpense();
        this.cash += income - expense;
        this.month++;
        return { income, expense, cashflow: income - expense };
    }

    /** 购买资产 */
    buyAsset(card) {
        if (this.cash < card.downPayment) return false;

        this.cash -= card.downPayment;
        this.assets.push({ ...card.asset });
        this.passiveIncomes.push({
            name: card.asset.name + '收入',
            amount: card.monthlyIncome,
            sourceAsset: card.asset.name
        });

        // 如果有贷款
        if (card.liability) {
            this.liabilities.push({ ...card.liability });
            this.expenses.push({ ...card.expense });
        }

        return true;
    }

    /** 卖出资产 */
    sellAsset(assetName, sellPrice) {
        const assetIndex = this.assets.findIndex(a => a.name === assetName);
        if (assetIndex === -1) return false;

        const asset = this.assets[assetIndex];
        this.cash += sellPrice;

        // 移除资产
        this.assets.splice(assetIndex, 1);

        // 移除对应的被动收入
        const incomeIndex = this.passiveIncomes.findIndex(p => p.sourceAsset === assetName);
        if (incomeIndex !== -1) this.passiveIncomes.splice(incomeIndex, 1);

        // 移除对应的负债和支出
        const liabIndex = this.liabilities.findIndex(l =>
            l.name.includes(assetName) || assetName.includes(l.name.replace('房贷', '').replace('贷款', ''))
        );
        if (liabIndex !== -1) {
            const liab = this.liabilities[liabIndex];
            // 卖出价需先还清贷款
            const remaining = liab.total;
            this.cash -= remaining;
            this.liabilities.splice(liabIndex, 1);

            // 移除对应月供支出
            const expIndex = this.expenses.findIndex(e => e.amount === liab.monthly &&
                (e.name.includes(assetName) || assetName.includes(e.name.replace('月供', '').replace('房贷', ''))));
            if (expIndex !== -1) this.expenses.splice(expIndex, 1);
        }

        return true;
    }

    /** 支付一次性费用 */
    payExpense(amount) {
        this.cash -= amount;
    }

    /** 添加持续性支出和负债 */
    addRecurringExpense(expenseData, liabilityData) {
        if (expenseData) this.expenses.push({ ...expenseData });
        if (liabilityData) this.liabilities.push({ ...liabilityData });
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

    /** 序列化 */
    toJSON() {
        return {
            careerData: this.careerData,
            careerName: this.careerName,
            salary: this.salary,
            cash: this.cash,
            month: this.month,
            expenses: this.expenses,
            liabilities: this.liabilities,
            assets: this.assets,
            passiveIncomes: this.passiveIncomes
        };
    }

    /** 反序列化 */
    static fromJSON(data) {
        const p = new Player(data.careerData);
        p.careerName = data.careerName;
        p.salary = data.salary;
        p.cash = data.cash;
        p.month = data.month;
        p.expenses = data.expenses;
        p.liabilities = data.liabilities;
        p.assets = data.assets;
        p.passiveIncomes = data.passiveIncomes;
        return p;
    }
}
