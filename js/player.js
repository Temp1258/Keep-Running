/**
 * 玩家数据模型
 * V3: 现金流模式、先付自己、满意度、税务、象限、复利追踪、财商等级、协同、资产保护、破产重启
 */
class Player {
    // 税率常量（贴近中国实际税制）
    static TAX_RATES = {
        passive: 0.10,   // 被动收入综合税率（房租~10%，利息/股息约20%，综合取10%）
        capital: 0.20    // 资产增值税（房产增值税20%，股票免征但游戏简化取20%）
    };

    /** 累进工资税（模拟中国个税，含5000元起征点） */
    static getSalaryTaxRate(salary) {
        const taxable = Math.max(0, salary - 5000); // 起征点5000
        if (taxable <= 3000) return 0.03;
        if (taxable <= 12000) return 0.10;
        if (taxable <= 25000) return 0.20;
        if (taxable <= 35000) return 0.25;
        if (taxable <= 55000) return 0.30;
        return 0.35;
    }

    /** 计算实际工资税额（简化的累进计算） */
    static calculateSalaryTax(salary) {
        const taxable = Math.max(0, salary - 5000);
        if (taxable <= 0) return 0;
        // 简化速算扣除法
        if (taxable <= 3000) return Math.round(taxable * 0.03);
        if (taxable <= 12000) return Math.round(taxable * 0.10 - 210);
        if (taxable <= 25000) return Math.round(taxable * 0.20 - 1410);
        if (taxable <= 35000) return Math.round(taxable * 0.25 - 2660);
        if (taxable <= 55000) return Math.round(taxable * 0.30 - 4410);
        return Math.round(taxable * 0.35 - 7160);
    }

    // 协同效应定义
    static SYNERGIES = [
        {
            id: 'realestate_cluster',
            name: '房产集群',
            desc: '拥有3个以上房产，批量管理降低成本',
            condition: (p) => p.assets.filter(a => a.type === 'realestate').length >= 3,
            bonusType: 'realestate', bonusRate: 0.15
        },
        {
            id: 'business_empire',
            name: '生意帝国',
            desc: '拥有3个以上生意，品牌协同效应',
            condition: (p) => p.assets.filter(a => a.type === 'business').length >= 3,
            bonusType: 'business', bonusRate: 0.20
        },
        {
            id: 'portfolio',
            name: '投资组合',
            desc: '同时持有股票、基金和房产，风险分散奖励',
            condition: (p) => {
                const types = new Set(p.assets.map(a => a.type));
                return types.has('stock') && types.has('fund') && types.has('realestate');
            },
            bonusType: 'all', bonusRate: 0.10
        },
        {
            id: 'supply_chain',
            name: '仓储+网店',
            desc: '仓储中心和网店协同，供应链整合',
            condition: (p) => {
                const names = p.assets.map(a => a.name);
                return names.some(n => n.includes('仓储')) && names.some(n => n.includes('网店'));
            },
            bonusType: 'supply_chain', bonusRate: 0.25
        },
        {
            id: 'diversified',
            name: '全产业链',
            desc: '持有5个以上不同资产，多元化经营',
            condition: (p) => p.assets.length >= 5,
            bonusType: 'all', bonusRate: 0.08
        }
    ];

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

        // 资产列表 { name, type, cost, income, linkedId?, purchaseMonth?, totalEarned? }
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

        // === V3 新增字段 ===

        // 先付自己机制
        this.investReserve = 0;      // 投资准备金
        this.paySelfRate = 0;        // 当前分配比例 (0/0.1/0.2/0.3)

        // 生活满意度 (0-100)
        this.satisfaction = 70;

        // 象限系统 ('E'/'S'/'B'/'I')
        this.quadrant = 'E';

        // 税务追踪
        this.taxPaid = { salary: 0, passive: 0, capital: 0 };

        // 财商等级 (0-3)
        this.financialIQ = 0;

        // 资产保护等级 (0-3)
        this.protectionLevel = 0;

        // 破产重启
        this.restartCount = 0;
        this.answeredQuizIds = [];

        // 已触发的现金流模式（用于一次性教学提示）
        this.seenPatterns = [];

        // 上一个现金流模式（用于检测变化）
        this.lastCashflowPattern = 'poor';

        // 已激活的协同效应ID列表
        this.activeSynergies = [];

        // FOMO事件队列 [{triggerMonth, card}]
        this.fomoQueue = [];

        // 社交攀比事件追踪
        this.lastSocialEventMonth = 0;
        this.pendingSocialFollowup = null; // {triggerMonth}

        // 累计投资总额（用于先付自己的分析报告）
        this.totalInvested = 0;

        // === V4 新增字段 ===

        // 社交资本 (0-100)，影响投资机会来源
        this.socialCapital = career.socialCapital || 50;

        // 职业特性
        this.specialTrait = career.specialTrait || null;

        // 贷款上限
        this.maxLoanAmount = career.maxLoanAmount || 100000;

        // 薪资涨幅上限
        this.salaryGrowthCap = career.salaryGrowthCap || 0;

        // 里程碑追踪
        this.milestonesPassed = [];

        // 主动行动次数（每月限多次额外行动）
        this.actionUsedThisMonth = false;

        // 本月是否已用"搜索投资"
        this.searchUsedThisMonth = false;

        // === V6 新增字段 ===

        // 贷款系统
        this.personalLoans = [];  // [{name, principal, remaining, monthly, interestRate, monthsLeft, linkedId}]
        this.totalLoansTaken = 0;
        this.creditScore = 650;   // 信用评分 350-950（芝麻信用体系）

        // 副业系统
        this.sideHustles = [];    // [{name, income, effort, linkedId}]

        // 每月可用行动次数（基础2次）
        this.actionsPerMonth = 2;
        this.actionsUsedThisMonth = 0;
    }

    /** 生成唯一关联ID */
    static generateLinkedId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    // ==============================
    // 收入计算（含税务、象限、协同）
    // ==============================

    /** 获取本月工资（受象限影响） */
    getQuadrantSalary() {
        switch (this.quadrant) {
            case 'E': return this.salary;
            case 'S': {
                // 自雇：波动70%-130%
                const factor = 0.7 + Math.random() * 0.6;
                return Math.round(this.salary * factor);
            }
            case 'B': {
                // 企业主：波动90%-110%，基础+20%
                const factor = 0.9 + Math.random() * 0.2;
                return Math.round(this.salary * 1.2 * factor);
            }
            case 'I': {
                // 投资者：工资淡化，保持基础值
                return this.salary;
            }
            default: return this.salary;
        }
    }

    /** 被动收入总计（含协同加成和象限加成） */
    getPassiveIncome() {
        let base = this.passiveIncomes.reduce((sum, p) => sum + p.amount, 0);
        // 协同加成
        base += this.calculateSynergyBonus();
        // B象限生意加成
        if (this.quadrant === 'B' || this.quadrant === 'I') {
            const businessIncome = this.passiveIncomes
                .filter(p => {
                    const asset = this.assets.find(a => a.name === p.sourceAsset);
                    return asset && asset.type === 'business';
                })
                .reduce((sum, p) => sum + p.amount, 0);
            if (this.quadrant === 'B') base += Math.round(businessIncome * 0.2);
        }
        // I象限全部被动收入加成
        if (this.quadrant === 'I') {
            base = Math.round(base * 1.1);
        }
        return base;
    }

    /** 获取基础被动收入（不含加成，用于计算） */
    getBasePassiveIncome() {
        return this.passiveIncomes.reduce((sum, p) => sum + p.amount, 0);
    }

    /** 总收入 = 工资 + 被动收入 */
    getTotalIncome() {
        return this.salary + this.getPassiveIncome();
    }

    /** 税后工资（累进税率） */
    getAfterTaxSalary(salaryAmount) {
        return salaryAmount - Player.calculateSalaryTax(salaryAmount);
    }

    /** 税后被动收入 */
    getAfterTaxPassiveIncome() {
        return Math.round(this.getPassiveIncome() * (1 - Player.TAX_RATES.passive));
    }

    /** 总支出 */
    getTotalExpense() {
        return this.expenses.reduce((sum, e) => sum + e.amount, 0);
    }

    /** 月现金流（税后） */
    getMonthlyCashflow() {
        const salary = this.getAfterTaxSalary(this.salary);
        const passive = this.getAfterTaxPassiveIncome();
        return salary + passive - this.getTotalExpense();
    }

    /** 总资产价值 */
    getTotalAssets() {
        return this.assets.reduce((sum, a) => sum + a.cost, 0) + this.cash + this.investReserve;
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

    // ==============================
    // 现金流模式（系统一）
    // ==============================

    /** 获取负债支出占比 */
    getLiabilityExpenseRatio() {
        const totalExpense = this.getTotalExpense();
        if (totalExpense === 0) return 0;
        const loanExpenses = this.expenses.filter(e => !e.inflatable).reduce((sum, e) => sum + e.amount, 0);
        return loanExpenses / totalExpense;
    }

    /** 获取当前现金流模式 */
    getCashflowPattern() {
        const totalIncome = this.salary + this.getBasePassiveIncome();
        if (totalIncome === 0) return 'poor';
        const passiveRatio = this.getBasePassiveIncome() / totalIncome;
        const liabilityRatio = this.getLiabilityExpenseRatio();

        if (passiveRatio >= 0.30) return 'rich';
        if (passiveRatio < 0.05 && liabilityRatio < 0.20) return 'poor';
        if (liabilityRatio >= 0.30) return 'middle';
        return 'poor';
    }

    // ==============================
    // 先付自己（系统二）
    // ==============================

    /** 分配先付自己的比例 */
    allocatePaySelf(rate, totalIncome) {
        this.paySelfRate = rate;
        const amount = Math.round(totalIncome * rate);
        this.investReserve += amount;
        this.cash -= amount;
        return amount;
    }

    /** 用准备金+现金购买资产（优先用准备金） */
    spendForInvestment(amount) {
        if (this.investReserve + this.cash < amount) return false;
        if (this.investReserve >= amount) {
            this.investReserve -= amount;
        } else {
            const fromCash = amount - this.investReserve;
            this.investReserve = 0;
            this.cash -= fromCash;
        }
        return true;
    }

    /** 获取可投资总额（现金+准备金） */
    getInvestableAmount() {
        return this.cash + this.investReserve;
    }

    // ==============================
    // 满意度系统（系统三）
    // ==============================

    /** 调整满意度 */
    adjustSatisfaction(delta) {
        this.satisfaction = Math.max(0, Math.min(100, this.satisfaction + delta));
    }

    /** 获取满意度等级描述 */
    getSatisfactionLevel() {
        if (this.satisfaction >= 60) return { level: 'good', label: '良好', icon: '😊' };
        if (this.satisfaction >= 40) return { level: 'medium', label: '一般', icon: '😐' };
        if (this.satisfaction >= 20) return { level: 'low', label: '低落', icon: '😟' };
        return { level: 'crisis', label: '崩溃', icon: '😰' };
    }

    // ==============================
    // 象限系统（系统五）
    // ==============================

    /** 检查象限升级条件 */
    checkQuadrantUpgrade() {
        switch (this.quadrant) {
            case 'E':
                // E→S: 现金>=50000且有>=1个生意类资产
                if (this.cash >= 50000 && this.assets.some(a => a.type === 'business')) {
                    return 'S';
                }
                break;
            case 'S':
                // S→B: >=3个生意类资产且被动收入>=5000
                if (this.assets.filter(a => a.type === 'business').length >= 3 && this.getPassiveIncome() >= 5000) {
                    return 'B';
                }
                break;
            case 'B':
                // B→I: 被动收入>=总支出的80%
                if (this.getPassiveIncome() >= this.getTotalExpense() * 0.8) {
                    return 'I';
                }
                break;
        }
        return null;
    }

    /** 执行象限进化 */
    evolveQuadrant(newQuadrant) {
        this.quadrant = newQuadrant;
    }

    // ==============================
    // 协同效应（系统八）
    // ==============================

    /** 计算协同加成总金额 */
    calculateSynergyBonus() {
        let totalBonus = 0;
        Player.SYNERGIES.forEach(syn => {
            if (!syn.condition(this)) return;
            if (syn.bonusType === 'all') {
                totalBonus += Math.round(this.passiveIncomes.reduce((s, p) => s + p.amount, 0) * syn.bonusRate);
            } else if (syn.bonusType === 'supply_chain') {
                this.passiveIncomes.forEach(p => {
                    const asset = this.assets.find(a => a.name === p.sourceAsset);
                    if (asset && (asset.name.includes('仓储') || asset.name.includes('网店'))) {
                        totalBonus += Math.round(p.amount * syn.bonusRate);
                    }
                });
            } else {
                this.passiveIncomes.forEach(p => {
                    const asset = this.assets.find(a => a.name === p.sourceAsset);
                    if (asset && asset.type === syn.bonusType) {
                        totalBonus += Math.round(p.amount * syn.bonusRate);
                    }
                });
            }
        });
        return totalBonus;
    }

    /** 获取当前激活的协同效应列表 */
    getActiveSynergies() {
        return Player.SYNERGIES.filter(syn => syn.condition(this));
    }

    // ==============================
    // 月度结算（V3）
    // ==============================

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
            netWorth: this.getNetWorth(),
            satisfaction: this.satisfaction,
            quadrant: this.quadrant
        });
    }

    /** 记录决策 */
    recordDecision(type, name, amount, cashflowImpact, extra) {
        this.decisions.push({
            month: this.month,
            type: type,
            name: name,
            amount: amount || 0,
            cashflowImpact: cashflowImpact || 0,
            ...(extra || {})
        });
    }

    /** 结算月收支（V3: 含税务） */
    processMonth() {
        // 记录快照
        this.recordSnapshot();

        // 1. 象限收入计算
        const grossSalary = this.getQuadrantSalary();
        const grossPassive = this.getPassiveIncome();

        // 2. 税务扣除（累进工资税 + 被动收入税）
        const salaryTax = Player.calculateSalaryTax(grossSalary);
        const passiveTax = Math.round(grossPassive * Player.TAX_RATES.passive);
        const netSalary = grossSalary - salaryTax;
        const netPassive = grossPassive - passiveTax;

        // 累计税务
        this.taxPaid.salary += salaryTax;
        this.taxPaid.passive += passiveTax;

        // 3. 总净收入
        const totalNetIncome = netSalary + netPassive;

        // 4. 先付自己分配（在game.js中处理UI选择后调用allocatePaySelf）
        // 这里根据已设定的比例自动分配
        const paySelfAmount = Math.round(totalNetIncome * this.paySelfRate);
        this.investReserve += paySelfAmount;

        // 5. 扣除支出
        const expense = this.getTotalExpense();
        this.cash += totalNetIncome - paySelfAmount - expense;

        // 6. 贷款摊还
        this.amortizeLoans();

        // 6.5 V6: 个人贷款处理
        this.processLoans();

        // 7. 满意度自然衰减
        this.adjustSatisfaction(-2);

        // 8. 累计资产收益
        this.passiveIncomes.forEach(p => {
            const asset = this.assets.find(a => a.linkedId === p.linkedId || a.name === p.sourceAsset);
            if (asset) {
                asset.totalEarned = (asset.totalEarned || 0) + p.amount;
            }
        });

        this.month++;

        // 更新最低现金记录
        if (this.cash < this.lowestCash) {
            this.lowestCash = this.cash;
        }

        return {
            grossSalary, grossPassive, salaryTax, passiveTax,
            netSalary, netPassive, totalNetIncome,
            paySelfAmount, expense,
            cashflow: totalNetIncome - paySelfAmount - expense
        };
    }

    /** 贷款自然摊还（排除个人贷款，个人贷款由processLoans单独处理） */
    amortizeLoans() {
        const personalLoanIds = new Set(this.personalLoans.map(l => l.linkedId));
        const toRemove = [];
        this.liabilities.forEach((l, idx) => {
            if (personalLoanIds.has(l.linkedId)) return; // 跳过个人贷款
            // 等额本息近似：前期利息占比高，假设年利率5%
            const annualRate = 0.05;
            const monthlyRate = annualRate / 12;
            const interest = Math.round(l.total * monthlyRate);
            const principalPayment = Math.max(0, l.monthly - interest);
            l.total -= principalPayment;
            if (l.total <= 0) {
                toRemove.push(idx);
            }
        });

        for (let i = toRemove.length - 1; i >= 0; i--) {
            const idx = toRemove[i];
            const liab = this.liabilities[idx];
            if (liab.linkedId) {
                const expIdx = this.expenses.findIndex(e => e.linkedId === liab.linkedId);
                if (expIdx !== -1) this.expenses.splice(expIdx, 1);
            } else {
                const expIdx = this.expenses.findIndex(e => e.amount === liab.monthly && !e.inflatable);
                if (expIdx !== -1) this.expenses.splice(expIdx, 1);
            }
            this.liabilities.splice(idx, 1);
        }

        return toRemove.length;
    }

    /** 通胀 */
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

    /** 购买资产（V3: 支持准备金、复利追踪） */
    buyAsset(card) {
        const totalAvailable = this.getInvestableAmount();
        if (totalAvailable < card.downPayment) return false;

        const linkedId = Player.generateLinkedId();

        // 优先使用投资准备金
        this.spendForInvestment(card.downPayment);
        this.totalInvested += card.downPayment;

        this.assets.push({
            ...card.asset,
            linkedId,
            purchaseMonth: this.month,
            totalEarned: 0,
            purchasePrice: card.downPayment
        });
        this.passiveIncomes.push({
            name: card.asset.name + '收入',
            amount: card.monthlyIncome,
            sourceAsset: card.asset.name,
            linkedId
        });

        if (card.liability) {
            this.liabilities.push({ ...card.liability, linkedId });
            this.expenses.push({ ...card.expense, inflatable: false, linkedId });
        }

        const netCashflow = card.monthlyIncome - (card.liability ? card.liability.monthly : 0);
        this.recordDecision('buy', card.asset.name, card.downPayment, netCashflow);

        // 满意度：买入资产+2
        this.adjustSatisfaction(2);

        return true;
    }

    /** 卖出资产（V3: 含增值税） */
    sellAsset(assetName, sellPrice) {
        const assetIndex = this.assets.findIndex(a => a.name === assetName);
        if (assetIndex === -1) return false;

        const asset = this.assets[assetIndex];
        const linkedId = asset.linkedId;
        let loanRemaining = 0;

        // 计算资本利得税
        const purchasePrice = asset.purchasePrice || asset.cost;
        const profit = sellPrice - purchasePrice;
        let capitalTax = 0;
        if (profit > 0) {
            capitalTax = Math.round(profit * Player.TAX_RATES.capital);
            this.taxPaid.capital += capitalTax;
        }

        this.cash += sellPrice - capitalTax;

        // 移除资产
        this.assets.splice(assetIndex, 1);

        // 移除被动收入
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

        // 移除负债和支出
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

        this.recordDecision('sell', assetName, sellPrice - loanRemaining - capitalTax, -removedIncome, { capitalTax });
        return { netProceeds: sellPrice - loanRemaining - capitalTax, loanRemaining, capitalTax };
    }

    /** 主动提前还清负债 */
    payOffLiability(index) {
        if (index < 0 || index >= this.liabilities.length) return false;
        const liab = this.liabilities[index];
        if (this.cash < liab.total) return false;

        this.cash -= liab.total;
        const linkedId = liab.linkedId;

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

    /** 支付一次性费用（仅从现金扣除） */
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

    /** 获取被拒绝的投资机会的机会成本 */
    getRejectedOpportunityCost() {
        return this.decisions
            .filter(d => d.type === 'reject' && d.monthlyIncome)
            .map(d => ({
                name: d.name,
                month: d.month,
                monthlyIncome: d.monthlyIncome,
                missedTotal: (this.month - d.month) * d.monthlyIncome
            }));
    }

    // ==============================
    // V4: 社交资本
    // ==============================

    /** 调整社交资本 */
    adjustSocialCapital(delta) {
        this.socialCapital = Math.max(0, Math.min(100, this.socialCapital + delta));
    }

    /** 社交资本影响：投资卡池是否被限制 */
    getCardPoolReduction() {
        if (this.socialCapital >= 60) return 0;     // 正常卡池
        if (this.socialCapital >= 40) return 0.15;   // 减少15%投资机会
        if (this.socialCapital >= 20) return 0.30;   // 减少30%
        return 0.50;                                  // 减少50%
    }

    /** 满意度是否影响投资判断（V4） */
    getInvestmentClarity() {
        if (this.satisfaction >= 60) return 'clear';     // 看到完整信息
        if (this.satisfaction >= 40) return 'normal';    // 正常
        if (this.satisfaction >= 20) return 'foggy';     // 部分信息模糊
        return 'blind';                                   // 无法做投资决策
    }

    /** 满意度是否影响象限进化（V4） */
    canEvolveQuadrant() {
        return this.satisfaction >= 30;
    }

    // ==============================
    // V6: 贷款系统
    // ==============================

    /** 获取可贷款额度 */
    getAvailableLoanAmount() {
        const existingLoans = this.personalLoans.reduce((sum, l) => sum + l.remaining, 0);
        const maxTotal = this.maxLoanAmount + Math.floor((this.creditScore - 350) / 100) * 10000;
        return Math.max(0, maxTotal - existingLoans);
    }

    /** 申请贷款 */
    takeLoan(amount, termMonths) {
        const available = this.getAvailableLoanAmount();
        if (amount > available || amount <= 0) return false;

        // 利率基于信用评分（芝麻信用）：650分=8%, 950分=4%
        const baseRate = 0.08 - (this.creditScore - 650) * 0.000133;
        const annualRate = Math.max(0.04, Math.min(0.12, baseRate));
        const monthlyRate = annualRate / 12;
        // 等额本息还款
        const monthly = Math.round(amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths) / (Math.pow(1 + monthlyRate, termMonths) - 1));

        const linkedId = Player.generateLinkedId();
        const loan = {
            name: `个人贷款(¥${(amount/1000).toFixed(0)}K/${termMonths}月)`,
            principal: amount,
            remaining: amount,
            monthly: monthly,
            interestRate: annualRate,
            monthsLeft: termMonths,
            linkedId
        };

        this.personalLoans.push(loan);
        this.expenses.push({ name: loan.name + '月供', amount: monthly, inflatable: false, linkedId, isLoan: true });
        this.liabilities.push({ name: loan.name, total: amount, monthly: monthly, linkedId });
        this.cash += amount;
        this.totalLoansTaken += amount;

        this.recordDecision('loan', loan.name, amount, -monthly);
        return loan;
    }

    /** 提前还清个人贷款 */
    repayLoan(loanIndex) {
        if (loanIndex < 0 || loanIndex >= this.personalLoans.length) return false;
        const loan = this.personalLoans[loanIndex];
        if (this.cash < loan.remaining) return false;

        this.cash -= loan.remaining;
        const linkedId = loan.linkedId;

        // 移除支出
        const expIdx = this.expenses.findIndex(e => e.linkedId === linkedId);
        if (expIdx !== -1) this.expenses.splice(expIdx, 1);

        // 移除负债
        const liabIdx = this.liabilities.findIndex(l => l.linkedId === linkedId);
        if (liabIdx !== -1) this.liabilities.splice(liabIdx, 1);

        const saved = loan.monthly;
        this.personalLoans.splice(loanIndex, 1);

        // 提前还贷提升信用分
        this.creditScore = Math.min(950, this.creditScore + 15);

        this.recordDecision('repay_loan', loan.name, loan.remaining, saved);
        return { amount: loan.remaining, monthlySaved: saved };
    }

    /** 贷款月度处理（在processMonth中调用） */
    processLoans() {
        const toRemove = [];
        this.personalLoans.forEach((loan, idx) => {
            const interest = Math.round(loan.remaining * loan.interestRate / 12);
            const principal = loan.monthly - interest;
            loan.remaining = Math.max(0, loan.remaining - principal);
            loan.monthsLeft--;

            if (loan.monthsLeft <= 0 || loan.remaining <= 0) {
                toRemove.push(idx);
            }
        });

        // 清理到期贷款
        for (let i = toRemove.length - 1; i >= 0; i--) {
            const idx = toRemove[i];
            const loan = this.personalLoans[idx];
            const linkedId = loan.linkedId;

            const expIdx = this.expenses.findIndex(e => e.linkedId === linkedId);
            if (expIdx !== -1) this.expenses.splice(expIdx, 1);

            const liabIdx = this.liabilities.findIndex(l => l.linkedId === linkedId);
            if (liabIdx !== -1) this.liabilities.splice(liabIdx, 1);

            this.personalLoans.splice(idx, 1);
            this.creditScore = Math.min(950, this.creditScore + 10);
        }

        return toRemove.length;
    }

    /** 逾期处理（现金不足时） */
    handleLoanDefault() {
        if (this.cash < 0) {
            this.creditScore = Math.max(350, this.creditScore - 50);
        }
    }

    // ==============================
    // 破产重启（系统十）
    // ==============================

    /** 重启（保留知识，清空资产） */
    restart(newCareer) {
        this.restartCount++;
        const savedIQ = this.financialIQ;
        const savedQuizCorrect = this.quizCorrect;
        const savedQuizTotal = this.quizTotal;
        const savedQuizIds = [...this.answeredQuizIds];
        const savedDecisions = [...this.decisions];
        const savedMonth = this.month;
        const savedProtection = this.protectionLevel;

        // 重置为新职业
        this.careerData = newCareer;
        this.careerName = newCareer.name;
        this.salary = newCareer.salary;
        this.cash = newCareer.cash;
        this.expenses = newCareer.expenses.map(e => ({ ...e }));
        this.liabilities = newCareer.liabilities.map(l => ({ ...l }));
        this.assets = [];
        this.passiveIncomes = [];
        this.investReserve = 0;
        this.paySelfRate = 0;
        this.satisfaction = 50; // 破产后满意度较低
        this.quadrant = 'E';
        this.hasInsurance = false;
        this.activeSynergies = [];
        this.totalInvested = 0;
        this.lowestCash = newCareer.cash;
        this.optionalRejected = 0;
        this.optionalAccepted = 0;
        this.taxPaid = { salary: 0, passive: 0, capital: 0 };
        this.personalLoans = [];
        this.totalLoansTaken = 0;
        this.sideHustles = [];
        this.actionsUsedThisMonth = 0;

        // 保留知识
        this.financialIQ = savedIQ;
        this.quizCorrect = savedQuizCorrect;
        this.quizTotal = savedQuizTotal;
        this.answeredQuizIds = savedQuizIds;
        this.decisions = savedDecisions;
        this.protectionLevel = savedProtection;
        // month不变，继续倒计时
        this.month = savedMonth;
    }

    // ==============================
    // 序列化
    // ==============================

    toJSON() {
        return {
            version: 4,
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
            lowestCash: this.lowestCash,
            // V3 fields
            investReserve: this.investReserve,
            paySelfRate: this.paySelfRate,
            satisfaction: this.satisfaction,
            quadrant: this.quadrant,
            taxPaid: this.taxPaid,
            financialIQ: this.financialIQ,
            protectionLevel: this.protectionLevel,
            restartCount: this.restartCount,
            answeredQuizIds: this.answeredQuizIds,
            seenPatterns: this.seenPatterns,
            lastCashflowPattern: this.lastCashflowPattern,
            activeSynergies: this.activeSynergies,
            fomoQueue: this.fomoQueue,
            lastSocialEventMonth: this.lastSocialEventMonth,
            pendingSocialFollowup: this.pendingSocialFollowup,
            totalInvested: this.totalInvested,
            // V4 fields
            socialCapital: this.socialCapital,
            specialTrait: this.specialTrait,
            maxLoanAmount: this.maxLoanAmount,
            salaryGrowthCap: this.salaryGrowthCap,
            milestonesPassed: this.milestonesPassed,
            actionUsedThisMonth: this.actionUsedThisMonth,
            searchUsedThisMonth: this.searchUsedThisMonth,
            // V6 fields
            personalLoans: this.personalLoans,
            totalLoansTaken: this.totalLoansTaken,
            creditScore: this.creditScore,
            sideHustles: this.sideHustles,
            actionsPerMonth: this.actionsPerMonth,
            actionsUsedThisMonth: this.actionsUsedThisMonth
        };
    }

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
        // V3 fields
        p.investReserve = data.investReserve || 0;
        p.paySelfRate = data.paySelfRate || 0;
        p.satisfaction = data.satisfaction !== undefined ? data.satisfaction : 70;
        p.quadrant = data.quadrant || 'E';
        p.taxPaid = data.taxPaid || { salary: 0, passive: 0, capital: 0 };
        p.financialIQ = data.financialIQ || 0;
        p.protectionLevel = data.protectionLevel || 0;
        p.restartCount = data.restartCount || 0;
        p.answeredQuizIds = data.answeredQuizIds || [];
        p.seenPatterns = data.seenPatterns || [];
        p.lastCashflowPattern = data.lastCashflowPattern || 'poor';
        p.activeSynergies = data.activeSynergies || [];
        p.fomoQueue = data.fomoQueue || [];
        p.lastSocialEventMonth = data.lastSocialEventMonth || 0;
        p.pendingSocialFollowup = data.pendingSocialFollowup || null;
        p.totalInvested = data.totalInvested || 0;
        // V4 fields
        p.socialCapital = data.socialCapital !== undefined ? data.socialCapital : 50;
        p.specialTrait = data.specialTrait || null;
        p.maxLoanAmount = data.maxLoanAmount || 100000;
        p.salaryGrowthCap = data.salaryGrowthCap || 0;
        p.milestonesPassed = data.milestonesPassed || [];
        p.actionUsedThisMonth = data.actionUsedThisMonth || false;
        p.searchUsedThisMonth = data.searchUsedThisMonth || false;
        // V6 fields
        p.personalLoans = data.personalLoans || [];
        p.totalLoansTaken = data.totalLoansTaken || 0;
        p.creditScore = data.creditScore || 650;
        p.sideHustles = data.sideHustles || [];
        p.actionsPerMonth = data.actionsPerMonth || 2;
        p.actionsUsedThisMonth = data.actionsUsedThisMonth || 0;
        return p;
    }
}
