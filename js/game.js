/**
 * 核心游戏引擎 V4
 * V3: 现金流模式检测、先付自己、满意度系统、税务显示、象限进化、
 *     复利追踪、财商教育、协同效应、资产保护、破产重启、FOMO、社交攀比
 * V4: 多卡选择、主动行动、阶段里程碑、社交资本、职业特性、增强复盘
 * V9: 多事件同时发生、职业-事件金额联动
 */
class Game {
    constructor(player, maxMonths) {
        this.player = player;
        this.isProcessing = false;
        this.maxMonths = maxMonths || 60;
        this.isFirstMonth = (player.month === 1);
    }

    // ==============================
    // V9: 职业-事件金额联动
    // ==============================

    /**
     * 根据玩家收入水平缩放事件金额
     * 基准工资 ¥8,000（二线城市中位数），各类别缩放强度不同
     * category:
     *   'tax'      - 税务/罚款，线性缩放（高薪多交税）
     *   'medical'  - 医疗支出，0.6x缩放（部分与收入相关）
     *   'mandatory'- 强制支出（维修等），0.5x缩放
     *   'optional' - 可选消费，0.7x缩放（生活方式通胀）
     *   'social'   - 社交支出，0.6x缩放
     *   'windfall' - 意外收入，0.8x缩放（奖金/退税与收入挂钩）
     *   'career'   - 职业事件金额，线性缩放
     *   'family'   - 家庭支出（学费/赡养），0.7x缩放
     */
    static scaleAmount(baseAmount, player, category) {
        const BASE_SALARY = 8000;
        const ratio = player.salary / BASE_SALARY;

        // 缩放强度：0=不缩放, 1=完全线性
        const intensity = {
            tax: 1.0,       // 税款完全与收入挂钩
            medical: 0.6,   // 医疗费部分与收入相关（高收入选择更好的医院）
            mandatory: 0.5, // 维修费部分与生活水平相关
            optional: 0.7,  // 消费水平与收入正相关
            social: 0.6,    // 社交支出部分与收入相关
            windfall: 0.8,  // 奖金/退税与收入高度相关
            career: 1.0,    // 职业收入事件完全线性
            family: 0.7     // 家庭支出与收入较强相关
        };

        const k = intensity[category] || 0.5;
        // 混合缩放：scaled = base * (1 + k * (ratio - 1))
        // 当ratio=1时返回base，ratio>1时按强度放大，ratio<1时按强度缩小
        const factor = 1 + k * (ratio - 1);
        // 最低不低于原值的30%，最高不超过原值的3倍
        const clampedFactor = Math.max(0.3, Math.min(3.0, factor));
        return Math.round(baseAmount * clampedFactor);
    }

    /** 创建事件卡的缩放副本（不修改原始数据） */
    scaleCard(card, type) {
        const player = this.player;
        const scaled = { ...card };

        if (type === 'expense') {
            if (scaled.amount) {
                // 根据事件子类型选择缩放类别
                let cat = 'mandatory';
                if (scaled.medicalType) cat = 'medical';
                else if (scaled.id === 'tax_bill' || scaled.id === 'property_tax') cat = 'tax';
                else if (scaled.id === 'child_tuition' || scaled.id === 'elderly_care') cat = 'family';
                else if (scaled.optional && !scaled.isInsurance) cat = 'optional';
                else if (scaled.id === 'friend_wedding' || scaled.id === 'business_dinner' || scaled.id === 'festival_gifts') cat = 'social';

                scaled.amount = Game.scaleAmount(scaled.amount, player, cat);
            }
            // 缩放可选消费中的现金获取（如信用卡分期）
            if (scaled.cashGain) {
                scaled.cashGain = Game.scaleAmount(scaled.cashGain, player, 'optional');
            }
            // 缩放新增月支出
            if (scaled.addExpense) {
                scaled.addExpense = { ...scaled.addExpense };
                let cat = scaled.id === 'elderly_care' ? 'family' : 'mandatory';
                scaled.addExpense.amount = Game.scaleAmount(scaled.addExpense.amount, player, cat);
            }
            if (scaled.addExpenseOnly) {
                scaled.addExpenseOnly = { ...scaled.addExpenseOnly };
                scaled.addExpenseOnly.amount = Game.scaleAmount(scaled.addExpenseOnly.amount, player, 'mandatory');
            }
            if (scaled.addLiability) {
                scaled.addLiability = { ...scaled.addLiability };
                scaled.addLiability.total = Game.scaleAmount(scaled.addLiability.total, player, 'optional');
            }
        } else if (type === 'windfall') {
            if (scaled.amount) {
                scaled.amount = Game.scaleAmount(scaled.amount, player, 'windfall');
            }
        } else if (type === 'career') {
            if (scaled.amount) {
                scaled.amount = Game.scaleAmount(scaled.amount, player, 'career');
            }
            if (scaled.movingCost) {
                scaled.movingCost = Game.scaleAmount(scaled.movingCost, player, 'mandatory');
            }
        } else if (type === 'chain') {
            if (scaled.amount) {
                scaled.amount = Game.scaleAmount(scaled.amount, player, 'mandatory');
            }
            if (scaled.cost) {
                scaled.cost = Game.scaleAmount(scaled.cost, player, 'mandatory');
            }
        } else if (type === 'loan') {
            if (scaled.amount) {
                scaled.amount = Game.scaleAmount(scaled.amount, player, 'tax');
            }
        } else if (type === 'risk') {
            // 风险事件的effects数组中的amount也需要缩放
            if (scaled.effects) {
                scaled.effects = scaled.effects.map(e => {
                    const se = { ...e };
                    if (se.amount) se.amount = Game.scaleAmount(se.amount, player, 'mandatory');
                    return se;
                });
            }
        } else if (type === 'social') {
            if (scaled.amount) {
                scaled.amount = Game.scaleAmount(scaled.amount, player, 'social');
            }
        } else if (type === 'interaction') {
            if (scaled.choices) {
                scaled.choices = scaled.choices.map(c => {
                    const sc = { ...c };
                    if (sc.cost) sc.cost = Game.scaleAmount(sc.cost, player, 'mandatory');
                    return sc;
                });
            }
        }

        return scaled;
    }

    /** 进入下一个月 */
    nextMonth() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        const player = this.player;
        const isNewYear = player.month > 1 && player.month % 12 === 0;

        // V6: 重置每月行动标记
        player.actionUsedThisMonth = false;
        player.searchUsedThisMonth = false;
        player.actionsUsedThisMonth = 0;

        // === V3 月度结算流程 ===

        // 1. 结算月收支（含税务、先付自己、满意度衰减）
        const result = player.processMonth();

        // 2. 显示税后收入明细
        this.logMonthlyIncome(result);

        // 3. 检查现金流模式变化
        this.checkCashflowPatternChange();

        // 4. 检查协同效应变化
        this.checkSynergyChanges();

        // 5. 检查破产
        if (player.isBankrupt()) {
            UI.updateFinancePanel(player, this.maxMonths);
            this.handleBankruptcy();
            return;
        }

        // 6. 检查财务自由
        if (player.isFinanciallyFree()) {
            UI.updateFinancePanel(player, this.maxMonths);
            this.endGame(true);
            return;
        }

        // 7. 检查月数限制
        if (player.month > this.maxMonths) {
            UI.updateFinancePanel(player, this.maxMonths);
            this.endGame(false, 'timeout');
            return;
        }

        // 8. 检查象限升级条件
        const quadrantUpgrade = player.checkQuadrantUpgrade();

        UI.updateFinancePanel(player, this.maxMonths);

        // 9. 如果有象限升级机会，优先处理
        if (quadrantUpgrade) {
            this.showQuadrantEvolution(quadrantUpgrade, () => {
                if (isNewYear) {
                    this.handleAnnualEvents();
                } else {
                    this.showPaySelfFirstTime(() => {
                        this.drawAndProcessCard();
                    });
                }
            });
            return;
        }

        // 10. 年度事件
        if (isNewYear) {
            this.handleAnnualEvents();
            return;
        }

        // 11. 第一个月教学
        if (this.isFirstMonth) {
            this.isFirstMonth = false;
            this.showPaySelfFirstTime(() => {
                this.drawAndProcessCard();
            });
            return;
        }

        // 12. 抽事件卡
        this.drawAndProcessCard();
    }

    /** 记录月度收入明细（含税务） */
    logMonthlyIncome(result) {
        const player = this.player;
        const quadrantLabel = { E: '工资', S: '自雇收入', B: '系统收入', I: '投资收入' };

        const salaryTaxPct = result.grossSalary > 0 ? Math.round(result.salaryTax / result.grossSalary * 100) : 0;
        UI.addMessage(`${quadrantLabel[player.quadrant]} ¥${result.grossSalary.toLocaleString()} → 个税${salaryTaxPct}% → 到手 ¥${result.netSalary.toLocaleString()}`, 'income');

        if (result.grossPassive > 0) {
            UI.addMessage(`被动收入 ¥${result.grossPassive.toLocaleString()} → 扣税${Math.round(Player.TAX_RATES.passive * 100)}% → 到手 ¥${result.netPassive.toLocaleString()}`, 'income');
        }

        if (result.paySelfAmount > 0) {
            UI.addMessage(`先付自己 ${Math.round(player.paySelfRate * 100)}%: ¥${result.paySelfAmount.toLocaleString()} → 投资准备金`, 'info');
        }

        UI.addMessage(`月支出 -¥${result.expense.toLocaleString()}`, 'expense');
        UI.addMessage(`本月现金流: ¥${result.cashflow.toLocaleString()}`, result.cashflow >= 0 ? 'income' : 'expense');

        // 税务对比提示（每3个月提醒一次）
        if (player.month % 3 === 0 && result.grossPassive > 0) {
            const allPassiveAmount = result.grossSalary + result.grossPassive;
            const ifAllPassive = Math.round(allPassiveAmount * (1 - Player.TAX_RATES.passive));
            const actual = result.netSalary + result.netPassive;
            const diff = ifAllPassive - actual;
            if (diff > 0) {
                UI.addMessage(`思考：如果全是被动收入，到手将多 ¥${diff.toLocaleString()}`, 'info');
            }
        }
    }

    // ==============================
    // 现金流模式检测（系统一）
    // ==============================

    checkCashflowPatternChange() {
        const player = this.player;
        const newPattern = player.getCashflowPattern();
        const oldPattern = player.lastCashflowPattern;

        if (newPattern !== oldPattern) {
            player.lastCashflowPattern = newPattern;

            // 一次性教学提示
            const transition = `${oldPattern}->${newPattern}`;
            if (!player.seenPatterns.includes(transition)) {
                player.seenPatterns.push(transition);
                const messages = {
                    'poor->middle': '你开始背负贷款了。中产阶级的陷阱是：赚得越多，贷得越多。记住用"好负债"而非"坏负债"。',
                    'middle->rich': '恭喜！你的现金流模式开始向富人靠拢了。资产正在为你工作！',
                    'rich->middle': '警告：你的被动收入在下降。检查一下是不是负债增长太快了。',
                    'poor->rich': '厉害！你直接跳过中产陷阱，进入了富人的现金流模式！',
                    'rich->poor': '你的资产被清空了，现金流回到了穷人模式。',
                    'middle->poor': '负债减少了，但被动收入也没有增长。需要开始购买资产！'
                };
                if (messages[transition]) {
                    UI.showToast(messages[transition], 5000);
                }
            }
        }
    }

    // ==============================
    // 先付自己教学（系统二）
    // ==============================

    showPaySelfFirstTime(onDone) {
        const player = this.player;
        // 只在第1个月弹出完整教学
        if (player.month !== 2) { // month已经在processMonth中+1了
            onDone();
            return;
        }

        UI.showPaySelfPanel(player, (rate) => {
            player.paySelfRate = rate;
            if (rate > 0) {
                UI.showToast(`已设置先付自己比例: ${Math.round(rate * 100)}%`, 3000);
            }
            onDone();
        });
    }

    // ==============================
    // 象限进化（系统五）
    // ==============================

    showQuadrantEvolution(targetQuadrant, onDone) {
        const player = this.player;

        // V4: 满意度过低不能进化象限
        if (!player.canEvolveQuadrant()) {
            UI.addMessage(`满意度过低（${player.satisfaction}），心态不稳无法接受象限进化。提升到30以上再试！`, 'warning');
            onDone();
            return;
        }

        const quadrantNames = { S: '自雇者', B: '企业主', I: '投资者' };
        const quadrantEffects = {
            S: [
                '工资消失，替换为"自雇收入"（波动范围: ±30%）',
                '解锁S象限独有投资机会卡',
                '收入不再固定，有经营风险'
            ],
            B: [
                '收入稳定化（波动缩小到±10%）',
                '生意类资产收入+20%加成',
                '解锁B象限专属卡：招聘团队、开分店'
            ],
            I: [
                '所有被动收入+10%加成',
                '解锁I象限专属大型交易卡',
                '如果被动收入≥支出，即达成财务自由'
            ]
        };

        const card = {
            title: '象限进化机会！',
            description: `你已经具备了进入${targetQuadrant}象限（${quadrantNames[targetQuadrant]}）的条件。`,
            tip: targetQuadrant === 'S' ? 'S象限的人是自己给自己打工，还是在用时间换钱。' :
                 targetQuadrant === 'B' ? 'B象限的人建立系统，让系统为你赚钱。' :
                 'I象限的人用钱生钱，这是财务自由的终极形态。'
        };

        const detailText = quadrantEffects[targetQuadrant].map(e => e).join('\n');

        UI.showCard('quadrant', card, [
            {
                label: '接受进化', class: 'btn-success',
                handler: () => {
                    player.evolveQuadrant(targetQuadrant);
                    UI.addMessage(`象限进化！你现在是${quadrantNames[targetQuadrant]}（${targetQuadrant}象限）`, 'income');
                    UI.showToast(`进入${targetQuadrant}象限：${quadrantNames[targetQuadrant]}！`, 4000);
                    player.adjustSatisfaction(10);
                    UI.updateFinancePanel(player, this.maxMonths);
                    onDone();
                }
            },
            {
                label: `留在${player.quadrant}象限`, class: 'btn-secondary',
                handler: () => {
                    UI.addMessage(`选择留在${player.quadrant}象限`, 'info');
                    onDone();
                }
            }
        ], `进化效果:\n${detailText}`);
    }

    // ==============================
    // 协同效应检查（系统八）
    // ==============================

    checkSynergyChanges() {
        const player = this.player;
        const currentSynergies = player.getActiveSynergies().map(s => s.id);
        const previousSynergies = player.activeSynergies || [];

        // 检查新触发的协同
        currentSynergies.forEach(id => {
            if (!previousSynergies.includes(id)) {
                const syn = Player.SYNERGIES.find(s => s.id === id);
                if (syn) {
                    UI.showToast(`协同效应触发！"${syn.name}" — ${syn.desc}`, 5000);
                    UI.addMessage(`协同效应：${syn.name}，收入加成 +${Math.round(syn.bonusRate * 100)}%`, 'income');
                }
            }
        });

        player.activeSynergies = currentSynergies;
    }

    // ==============================
    // 年度事件
    // ==============================

    handleAnnualEvents() {
        const player = this.player;
        const year = Math.floor(player.month / 12);

        // 通胀 2~4%（贴近中国CPI实际水平，后期轻微加速）
        const lateBonus = year >= 4 ? 0.01 : 0;
        const rate = 0.02 + Math.random() * 0.02 + lateBonus;
        const increase = player.applyInflation(rate);

        UI.addMessage(`第${year}年结束！物价上涨 ${Math.round(rate * 100)}%，月支出增加 ¥${increase}`, 'warning');

        // V4: 职业加薪（根据职业特性）
        if (player.salaryGrowthCap > 0 && player.quadrant === 'E') {
            const raise = Math.round(Math.random() * player.salaryGrowthCap);
            if (raise > 0) {
                player.salary += raise;
                UI.addMessage(`年度加薪：月薪 +¥${raise}`, 'income');
            }
        }

        // V4: 后期危机事件（第4年起每年有25%概率触发市场危机）
        if (year >= 4 && Math.random() < 0.25 && player.assets.length > 0) {
            UI.addMessage(`经济动荡！部分资产价值受到冲击`, 'expense');
            const types = ['realestate', 'stock', 'fund', 'business'];
            const hitType = types[Math.floor(Math.random() * types.length)];
            player.updateAssetValues(hitType, 0.85);
        }

        UI.updateFinancePanel(player, this.maxMonths);

        this.showAnnualReview(year, () => {
            this.drawAndProcessCard();
        });
    }

    /** 年度回顾（V3: 含税务分析和机会成本） */
    showAnnualReview(year, onClose) {
        const player = this.player;
        const history = player.history;

        const thisYearEnd = history.length > 0 ? history[history.length - 1] : null;
        const lastYearEnd = history.length >= 12 ? history[history.length - 12] : (history.length > 0 ? history[0] : null);

        let grade = 'D';
        let gradeMsg = '需要加油，多投资产生被动收入的资产。';
        const progress = player.getFreedomProgress();
        if (progress >= 80) { grade = 'A'; gradeMsg = '太棒了！财务自由近在咫尺！'; }
        else if (progress >= 50) { grade = 'B'; gradeMsg = '不错的进展，继续保持投资节奏。'; }
        else if (progress >= 25) { grade = 'C'; gradeMsg = '有一定进步，但还需要加快步伐。'; }

        const cashflowChange = thisYearEnd && lastYearEnd ? thisYearEnd.cashflow - lastYearEnd.cashflow : 0;
        const passiveChange = thisYearEnd && lastYearEnd ? thisYearEnd.passiveIncome - lastYearEnd.passiveIncome : 0;
        const netWorthChange = thisYearEnd && lastYearEnd ? thisYearEnd.netWorth - lastYearEnd.netWorth : 0;

        // V3: 计算被拒绝的机会成本
        const rejectedCosts = player.getRejectedOpportunityCost();
        const totalMissed = rejectedCosts.reduce((sum, r) => sum + r.missedTotal, 0);

        UI.showAnnualReview({
            year, grade, gradeMsg,
            cashflow: player.getMonthlyCashflow(),
            cashflowChange, passiveChange, netWorthChange,
            passiveIncome: player.getPassiveIncome(),
            totalExpense: player.getTotalExpense(),
            progress,
            // V3 data
            taxPaid: { ...player.taxPaid },
            rejectedCosts,
            totalMissed,
            satisfaction: player.satisfaction,
            quadrant: player.quadrant,
            // V5: 更多复盘数据
            socialCapital: player.socialCapital,
            activeSynergies: player.getActiveSynergies(),
            synergyBonus: player.calculateSynergyBonus(),
            quadrantConditions: this.getQuadrantConditionText(player),
            assetCount: player.assets.length,
            liabilityCount: player.liabilities.length
        }, onClose);
    }

    // ==============================
    // 抽卡与事件处理
    // ==============================

    /**
     * V9: 每月发生多个事件，全部自动触发（不再让用户选择）
     * 基础2个事件，月份20+后3个，市场调研激活时额外+1
     */
    drawAndProcessCard() {
        const events = [];
        const usedIds = new Set();

        // 抽取事件数量：基础2个，20月后3个，市场调研+1
        let eventCount = 2;
        if (this.player.month >= 20) eventCount = 3;
        if (this.player._marketResearchActive) {
            eventCount++;
            this.player._marketResearchActive = false;
        }

        // 抽取不重复的事件
        for (let e = 0; e < eventCount; e++) {
            for (let attempt = 0; attempt < 8; attempt++) {
                const result = drawCard(this.player);
                if (!usedIds.has(result.card.id)) {
                    usedIds.add(result.card.id);
                    events.push(result);
                    break;
                }
            }
        }

        // 社交资本影响：低社交资本时移除部分投资机会
        const reduction = this.player.getCardPoolReduction();
        if (reduction > 0) {
            for (let i = events.length - 1; i >= 0; i--) {
                if (events[i].type === 'opportunity' && Math.random() < reduction && events.length > 1) {
                    events.splice(i, 1);
                    break; // 最多移除一个
                }
            }
        }

        // 按顺序处理所有事件（上一个事件的弹窗关闭后处理下一个）
        this._processEventQueue(events, 0);
    }

    /** 递归处理事件队列 */
    _processEventQueue(events, index) {
        if (index >= events.length) {
            // 队列完成，调用真正的 finishTurn
            this._eventQueue = null;
            this._realFinishTurn();
            return;
        }

        // 如果已破产，不再处理后续事件
        if (this.player.isBankrupt()) {
            this._eventQueue = null;
            this.handleBankruptcy();
            return;
        }

        // 存储队列状态，让 finishTurn 知道要链式调用
        this._eventQueue = { events, nextIndex: index + 1 };

        const { type, card } = events[index];
        // V9: 对卡牌进行职业缩放
        const scaledCard = this.scaleCard(card, type);

        // 多事件时显示进度提示
        if (events.length > 1) {
            UI.addMessage(`── 事件 ${index + 1}/${events.length} ──`, 'info');
        }

        this._processCard(type, scaledCard);
    }

    /** 处理单张卡 */
    _processCard(type, card) {
        UI.setEventArea(`
            <div style="text-align:center">
                <p style="font-size:18px;color:var(--color-gold);margin-bottom:8px">事件发生！</p>
                <p style="color:var(--color-text-dim)">${CARD_TYPES[type].label}: ${card.title || card.question}</p>
            </div>
        `);

        switch (type) {
            case 'opportunity': this.handleOpportunity(card); break;
            case 'expense': this.handleExpense(card); break;
            case 'market': this.handleMarket(card); break;
            case 'learning': this.handleLearning(card); break;
            case 'chain': this.handleChainEvent(card); break;
            case 'education': this.handleEducation(card); break;
            case 'protection': this.handleProtection(card); break;
            case 'risk': this.handleRisk(card); break;
            case 'fomo': this.handleFOMO(card); break;
            case 'social': this.handleSocial(card); break;
            case 'interaction': this.handleAssetInteraction(card); break;
            case 'loan': this.handleLoanEvent(card); break;
            case 'career': this.handleCareerEvent(card); break;
            case 'windfall': this.handleWindfall(card); break;
            default: this.finishTurn();
        }
    }

    /** 处理投资机会（V4: 准备金支付、财商等级信息差、FOMO队列、满意度/贷款限制） */
    handleOpportunity(card) {
        const player = this.player;

        // V4: 贷款上限检查
        if (card.liability && card.liability.total > player.maxLoanAmount) {
            UI.showCard('opportunity', card, [{
                label: '贷款资格不足', class: 'btn-secondary', disabled: true,
                handler: () => {}
            }, {
                label: '放弃（超出贷款上限）', class: 'btn-danger',
                handler: () => {
                    UI.addMessage(`你的贷款资格不足以获批 ${card.asset.name}（上限¥${player.maxLoanAmount.toLocaleString()}）`, 'warning');
                    this.finishTurn();
                }
            }], `贷款上限: ¥${player.maxLoanAmount.toLocaleString()} | 需要: ¥${card.liability.total.toLocaleString()}`);
            return;
        }

        // V5: 满意度影响投资判断（blind状态不再完全禁止，而是增加成本）
        const clarity = player.getInvestmentClarity();

        const canAfford = player.getInvestableAmount() >= card.downPayment;
        const reserveNote = player.investReserve > 0
            ? `(现金 ¥${player.cash.toLocaleString()} + 准备金 ¥${player.investReserve.toLocaleString()})`
            : '';

        // V5: 满意度影响信息可见度 + blind状态成本增加
        const foggy = clarity === 'foggy';
        const isBlind = clarity === 'blind';
        const blindPenalty = isBlind ? Math.round(card.downPayment * 0.2) : 0; // blind状态投资成本+20%

        // 财商等级信息差
        let extraNote = reserveNote;
        if (isBlind) {
            extraNote += '\n⚠ 心态崩溃：投资判断力严重下降，额外支付20%"冲动溢价"';
        } else if (foggy) {
            extraNote += '\n⚠ 心态低落：投资分析信息模糊，建议先调整状态';
        }
        if (player.financialIQ >= 1 && !foggy && !isBlind) {
            const net = card.monthlyIncome - (card.liability ? card.liability.monthly : 0);
            const payback = net > 0 ? Math.ceil(card.downPayment / net) : '永不';
            extraNote += `\n净现金流: ¥${net}/月 | 回收期: ${payback}${typeof payback === 'number' ? '个月' : ''}`;
        }
        if (player.financialIQ >= 2 && !foggy && !isBlind) {
            const net = card.monthlyIncome - (card.liability ? card.liability.monthly : 0);
            const annualROI = card.downPayment > 0 ? ((net * 12 / card.downPayment) * 100).toFixed(1) : 0;
            const risk = net < 0 ? '高（负现金流）' : net < 200 ? '中' : '低';
            extraNote += `\n年化ROI: ${annualROI}% | 风险评级: ${risk}`;
        }
        if (player.financialIQ >= 3 && !foggy && !isBlind) {
            const net = card.monthlyIncome - (card.liability ? card.liability.monthly : 0);
            const advice = net > 0 ? '建议买入' : '慎重考虑';
            extraNote += `\n投资建议: ${advice}`;
        }

        // 72法则提示
        if (player.financialIQ >= 1 && card.downPayment > 0 && !foggy && !isBlind) {
            const net = card.monthlyIncome - (card.liability ? card.liability.monthly : 0);
            if (net > 0) {
                const annualReturn = (net * 12 / card.downPayment) * 100;
                if (annualReturn > 0) {
                    const doubleYears = (72 / annualReturn).toFixed(1);
                    extraNote += `\n72法则: 约${doubleYears}年翻倍`;
                }
            }
        }

        // V5: 投资预览计算器（买入后的现金流预览）
        const netCashflowAfterBuy = player.getMonthlyCashflow() + card.monthlyIncome - (card.liability ? card.liability.monthly : 0);
        const currentCashflow = player.getMonthlyCashflow();
        extraNote += `\n─────────── 买入预览 ───────────`;
        extraNote += `\n当前月现金流: ¥${currentCashflow.toLocaleString()} → 买入后: ¥${netCashflowAfterBuy.toLocaleString()}`;
        const remainingCash = player.getInvestableAmount() - card.downPayment - blindPenalty;
        extraNote += `\n剩余可用资金: ¥${remainingCash.toLocaleString()}`;

        const totalCost = card.downPayment + blindPenalty;
        const canAffordWithPenalty = player.getInvestableAmount() >= totalCost;
        const actions = [
            {
                label: canAffordWithPenalty ? `买入 (¥${totalCost.toLocaleString()}${blindPenalty > 0 ? ' 含溢价' : ''})` : `资金不足 (需¥${totalCost.toLocaleString()})`,
                class: 'btn-success', disabled: !canAffordWithPenalty,
                handler: () => {
                    // V5: blind状态额外支付冲动溢价
                    if (blindPenalty > 0) {
                        player.payExpense(blindPenalty);
                        UI.addMessage(`冲动溢价: -¥${blindPenalty.toLocaleString()}（心态不稳导致决策失误）`, 'expense');
                    }
                    player.buyAsset(card);
                    UI.addMessage(`购买了 ${card.asset.name}，每月被动收入 +¥${card.monthlyIncome}`, 'income');
                    if (card.liability) {
                        UI.addMessage(`新增贷款: ${card.liability.name}，月供 ¥${card.liability.monthly}`, 'expense');
                    }
                    // V4: 程序员特性 - 科技类投资收入+20%
                    if (player.specialTrait === 'techie' && card.asset.type === 'stock') {
                        const bonus = Math.round(card.monthlyIncome * 0.2);
                        const inc = player.passiveIncomes.find(p => p.sourceAsset === card.asset.name);
                        if (inc) {
                            inc.amount += bonus;
                            UI.addMessage(`技术洞察：科技类投资额外收入 +¥${bonus}/月`, 'income');
                        }
                    }
                    // V4: 服务员特性 - 节俭买入资产满意度+5额外
                    if (player.specialTrait === 'frugal') {
                        player.adjustSatisfaction(3);
                    }
                    UI.updateFinancePanel(player, this.maxMonths);
                    this.checkSynergyChanges();
                    this.checkAchievements();
                    this.finishTurn();
                }
            },
            {
                label: '放弃', class: 'btn-secondary',
                handler: () => {
                    player.recordDecision('reject', card.asset.name, 0, 0, { monthlyIncome: card.monthlyIncome });
                    UI.addMessage(`放弃了投资 ${card.asset.name} 的机会`, 'warning');

                    // FOMO队列：30%概率在2-4个月后触发
                    if (Math.random() < 0.3) {
                        const delay = 2 + Math.floor(Math.random() * 3);
                        player.fomoQueue.push({
                            triggerMonth: player.month + delay,
                            card: {
                                id: 'fomo_' + card.id,
                                title: '错失的机会',
                                description: `你还记得${delay}个月前放弃的${card.asset.name}吗？那个投资现在涨了50%，买了的人每月收入 ¥${card.monthlyIncome}。你有些后悔——但别冲动！`,
                                originalAsset: card.asset.name,
                                monthlyIncome: card.monthlyIncome,
                                tip: 'FOMO是投资者最大的敌人。正确的应对不是后悔过去，而是聚焦当下的策略。'
                            }
                        });
                    }

                    this.finishTurn();
                }
            }
        ];
        UI.showCard('opportunity', card, actions, extraNote || null);
    }

    /** 处理额外支出（V4: 满意度影响+职业特性） */
    handleExpense(card) {
        const player = this.player;
        let actualAmount = card.amount;

        // V4: 服务员节俭特性 - 可选消费金额减半
        if (player.specialTrait === 'frugal' && card.optional && !card.isInsurance && !card.cashGain) {
            actualAmount = Math.round(actualAmount * 0.5);
        }

        // 保险减半医疗支出
        if (card.medicalType && player.hasInsurance) {
            actualAmount = Math.round(card.amount * 0.5);
        }
        // 保护等级减免罚款
        if (card.isFine && player.protectionLevel >= 2) {
            actualAmount = Math.round(card.amount * 0.5);
        }

        if (card.optional) {
            const actions = [];

            if (card.isInsurance) {
                actions.push({
                    label: `购买保险 (-¥${actualAmount.toLocaleString()})`,
                    class: 'btn-primary', disabled: player.cash < actualAmount,
                    handler: () => {
                        player.payExpense(actualAmount);
                        player.hasInsurance = true;
                        player.optionalAccepted++;
                        player.adjustSatisfaction(5);
                        player.recordDecision('spend', card.title, actualAmount, 0);
                        UI.addMessage(`购买了保险，今后医疗类支出减半`, 'info');
                        UI.updateFinancePanel(player, this.maxMonths);
                        this.checkBankrupt() || this.finishTurn();
                    }
                });
            } else if (card.cashGain) {
                actions.push({
                    label: `接受 (获得¥${card.cashGain.toLocaleString()})`,
                    class: 'btn-danger',
                    handler: () => {
                        player.receiveIncome(card.cashGain);
                        player.addRecurringExpense(card.addExpense, card.addLiability);
                        player.optionalAccepted++;
                        player.adjustSatisfaction(5);
                        player.recordDecision('spend', card.title, -card.cashGain, -card.addExpense.amount);
                        UI.addMessage(`接受了信用卡分期，获得 ¥${card.cashGain.toLocaleString()}`, 'expense');
                        UI.addMessage(`新增月支出: ${card.addExpense.name} -¥${card.addExpense.amount}/月`, 'expense');
                        UI.updateFinancePanel(player, this.maxMonths);
                        this.finishTurn();
                    }
                });
            } else {
                // 普通可选消费（含满意度恢复）
                const satNote = card.satisfactionRestore ? ` (满意度+${card.satisfactionRestore})` : '';
                actions.push({
                    label: `购买 (-¥${actualAmount.toLocaleString()})${satNote}`,
                    class: 'btn-danger', disabled: player.cash < actualAmount,
                    handler: () => {
                        player.payExpense(actualAmount);
                        player.optionalAccepted++;
                        if (card.satisfactionRestore) {
                            player.adjustSatisfaction(card.satisfactionRestore);
                        } else {
                            player.adjustSatisfaction(5); // 接受消费+5满意度
                        }
                        player.recordDecision('spend', card.title, actualAmount, 0);
                        UI.addMessage(`消费: ${card.title} -¥${actualAmount.toLocaleString()}`, 'expense');
                        if (card.addExpense) {
                            player.addRecurringExpense(card.addExpense, card.addLiability);
                            UI.addMessage(`新增月支出: ${card.addExpense.name} -¥${card.addExpense.amount}/月`, 'expense');
                        }
                        UI.updateFinancePanel(player, this.maxMonths);
                        this.checkBankrupt() || this.finishTurn();
                    }
                });
            }

            actions.push({
                label: '拒绝', class: 'btn-success',
                handler: () => {
                    player.optionalRejected++;
                    player.adjustSatisfaction(-8); // 拒绝消费 -8 满意度
                    player.recordDecision('refuse_spend', card.title, actualAmount, 0);
                    UI.addMessage(`拒绝了 ${card.title}（满意度-8）`, 'income');
                    if (card.id === 'new_car_tempt') this.checkAchievements('reject_car');
                    UI.updateFinancePanel(player, this.maxMonths);
                    this.finishTurn();
                }
            });

            let discountNote = null;
            if (actualAmount !== card.amount) {
                const reasons = [];
                if (card.medicalType && player.hasInsurance) reasons.push('保险减免');
                if (card.isFine && player.protectionLevel >= 2) reasons.push('保护减免');
                if (player.specialTrait === 'frugal' && card.optional && !card.isInsurance && !card.cashGain) reasons.push('节俭天赋');
                discountNote = `(${reasons.join('+')}后: ¥${actualAmount})`;
            }
            UI.showCard('expense', card, actions, discountNote);
        } else {
            // 房东涨租
            if (card.addExpenseOnly) {
                UI.showCard('expense', card, [{
                    label: '知道了', class: 'btn-danger',
                    handler: () => {
                        player.expenses.push({ ...card.addExpenseOnly });
                        player.recordDecision('spend', card.title, 0, -card.addExpenseOnly.amount);
                        UI.addMessage(`${card.title}，月支出 +¥${card.addExpenseOnly.amount}`, 'expense');
                        UI.updateFinancePanel(player, this.maxMonths);
                        this.finishTurn();
                    }
                }]);
                return;
            }

            // 强制支出（含报复性消费满意度恢复）
            const displayAmount = (card.medicalType && player.hasInsurance) ? actualAmount : card.amount;
            const extra = (card.medicalType && player.hasInsurance) ? ' (保险减免50%)' : '';
            const satRestore = card.satisfactionRestore ? ` 满意度+${card.satisfactionRestore}` : '';

            UI.showCard('expense', card, [{
                label: `支付 -¥${displayAmount.toLocaleString()}${extra}`,
                class: 'btn-danger',
                handler: () => {
                    player.payExpense(displayAmount);
                    if (card.satisfactionRestore) {
                        player.adjustSatisfaction(card.satisfactionRestore);
                    }
                    player.recordDecision('spend', card.title, displayAmount, 0);
                    UI.addMessage(`${card.isForced ? '报复性' : '意外'}支出: ${card.title} -¥${displayAmount.toLocaleString()}${extra}${satRestore}`, 'expense');
                    UI.updateFinancePanel(player, this.maxMonths);
                    this.checkBankrupt() || this.finishTurn();
                }
            }]);
        }
    }

    /** 处理市场波动 */
    handleMarket(card) {
        // 通胀飙升特殊处理
        if (card.inflationEffect) {
            UI.showCard('market', card, [{
                label: '知道了', class: 'btn-danger',
                handler: () => {
                    const player = this.player;
                    // 支出增加
                    const expIncrease = player.applyInflation(card.inflationEffect.expenseIncrease);
                    UI.addMessage(`物价飞涨！月支出增加 ¥${expIncrease}`, 'expense');
                    // 资产增值
                    if (player.assets.length > 0) {
                        player.updateAssetValues('realestate', 1 + card.inflationEffect.assetIncrease);
                        player.updateAssetValues('business', 1 + card.inflationEffect.assetIncrease);
                        UI.addMessage(`资产价值上涨 ${Math.round(card.inflationEffect.assetIncrease * 100)}%`, 'income');
                    }
                    UI.updateFinancePanel(player, this.maxMonths);
                    this.finishTurn();
                }
            }]);
            return;
        }

        if (card.rateChange !== undefined) {
            UI.showCard('market', card, [{
                label: '知道了', class: 'btn-primary',
                handler: () => {
                    const change = card.rateChange;
                    this.player.liabilities.forEach(l => {
                        const diff = Math.round(l.monthly * Math.abs(change));
                        l.monthly += change > 0 ? diff : -diff;
                        const exp = this.player.expenses.find(e =>
                            e.linkedId === l.linkedId || (e.amount && !e.inflatable && e.name.includes('月供'))
                        );
                        if (exp) exp.amount = l.monthly;
                    });
                    const dir = change > 0 ? '增加' : '减少';
                    UI.addMessage(`${card.title}！贷款月供${dir}了${Math.abs(Math.round(change * 100))}%`, change > 0 ? 'expense' : 'income');
                    UI.updateFinancePanel(this.player, this.maxMonths);
                    this.finishTurn();
                }
            }]);
            return;
        }

        if (card.globalMultiplier) {
            UI.showCard('market', card, [{
                label: '知道了', class: 'btn-primary',
                handler: () => {
                    this.player.updateAssetValues('realestate', card.globalMultiplier);
                    this.player.updateAssetValues('stock', card.globalMultiplier);
                    this.player.updateAssetValues('business', card.globalMultiplier);
                    this.player.updateAssetValues('fund', card.globalMultiplier);
                    const pct = Math.round((card.globalMultiplier - 1) * 100);
                    UI.addMessage(`${card.title}！所有资产价值上涨${pct}%`, 'income');
                    UI.updateFinancePanel(this.player, this.maxMonths);
                    this.finishTurn();
                }
            }]);
            return;
        }

        UI.showMarketCard(card, this.player, (decision, assetName, sellPrice) => {
            if (card.incomeMultiplier) {
                this.player.updateAssetIncomes(card.assetType, card.incomeMultiplier);
                const dir = card.incomeMultiplier > 1 ? '增长' : '下降';
                UI.addMessage(`${card.title}！收入${dir}了`, card.incomeMultiplier > 1 ? 'income' : 'warning');
            } else if (decision === 'sell') {
                const result = this.player.sellAsset(assetName, sellPrice);
                UI.addMessage(`卖出 ${assetName}，获得 ¥${sellPrice.toLocaleString()}`, 'income');
                if (result && result.capitalTax > 0) {
                    UI.addMessage(`资产增值税: -¥${result.capitalTax.toLocaleString()}`, 'expense');
                }
                if (result && result.loanRemaining > 0) {
                    UI.addMessage(`偿还贷款余额 -¥${result.loanRemaining.toLocaleString()}`, 'expense');
                }
            } else if (decision === 'accept' && card.multiplier < 1) {
                this.player.updateAssetValues(card.assetType, card.multiplier);
                UI.addMessage(`${card.title}！资产价值缩水`, 'warning');
            } else if (decision === 'hold' && card.multiplier > 1) {
                this.player.updateAssetValues(card.assetType, card.multiplier);
                UI.addMessage(`${card.title}！资产增值，你选择继续持有`, 'info');
            }
            UI.updateFinancePanel(this.player, this.maxMonths);
            this.finishTurn();
        });
    }

    /** 处理学习卡（V4: 满意度+已答题记录+教师特性） */
    handleLearning(card) {
        this.player.quizTotal++;
        UI.showLearningCard(card, (correct) => {
            if (correct) {
                this.player.quizCorrect++;
                let reward = card.reward;
                // V4: 教师特性 - 学习奖励翻倍
                if (this.player.specialTrait === 'learner') {
                    reward *= 2;
                }
                this.player.receiveIncome(reward);
                this.player.adjustSatisfaction(3);
                this.player.answeredQuizIds.push(card.id);
                const traitNote = this.player.specialTrait === 'learner' ? '（教师天赋：奖励翻倍！）' : '';
                UI.addMessage(`答对问题！奖励 +¥${reward.toLocaleString()}（满意度+3）${traitNote}`, 'income');
            } else {
                UI.addMessage('答错了，但学到了知识！', 'warning');
            }
            UI.updateFinancePanel(this.player, this.maxMonths);
            this.checkAchievements();
            this.finishTurn();
        });
    }

    /** 处理连锁事件 */
    handleChainEvent(card) {
        const player = this.player;
        const affectedAssets = player.assets.filter(a => a.type === card.requireAssetType);

        switch (card.effect) {
            case 'lose_income_months': {
                const asset = affectedAssets[0];
                const income = player.passiveIncomes.find(p => p.sourceAsset === asset.name);
                const loss = income ? income.amount * card.months : 0;
                UI.showCard('chain', card, [{
                    label: `承受损失 (-¥${loss.toLocaleString()})`, class: 'btn-danger',
                    handler: () => {
                        player.payExpense(loss);
                        player.recordDecision('spend', card.title, loss, 0);
                        UI.addMessage(`${card.title}，损失 ¥${loss.toLocaleString()}`, 'expense');
                        UI.updateFinancePanel(player, this.maxMonths);
                        this.checkBankrupt() || this.finishTurn();
                    }
                }]);
                break;
            }
            case 'upgrade_income': {
                if (card.optional && card.cost > 0) {
                    const canAfford = player.cash >= card.cost;
                    UI.showCard('chain', card, [
                        {
                            label: canAfford ? `投入 ¥${card.cost.toLocaleString()}` : `现金不足`,
                            class: 'btn-success', disabled: !canAfford,
                            handler: () => {
                                player.payExpense(card.cost);
                                player.updateAssetIncomes(card.requireAssetType, card.incomeMultiplier);
                                player.recordDecision('buy', card.title, card.cost, 0);
                                UI.addMessage(`${card.title}！收入提升了`, 'income');
                                UI.updateFinancePanel(player, this.maxMonths);
                                this.finishTurn();
                            }
                        },
                        {
                            label: '放弃', class: 'btn-secondary',
                            handler: () => {
                                player.recordDecision('reject', card.title, 0, 0);
                                this.finishTurn();
                            }
                        }
                    ]);
                } else {
                    UI.showCard('chain', card, [{
                        label: '知道了', class: 'btn-primary',
                        handler: () => {
                            if (card.cost > 0) player.payExpense(card.cost);
                            player.updateAssetIncomes(card.requireAssetType, card.incomeMultiplier);
                            const dir = card.incomeMultiplier > 1 ? '提升' : '下降';
                            UI.addMessage(`${card.title}！收入${dir}了`, card.incomeMultiplier > 1 ? 'income' : 'warning');
                            UI.updateFinancePanel(player, this.maxMonths);
                            this.finishTurn();
                        }
                    }]);
                }
                break;
            }
            case 'force_sell': {
                const asset = affectedAssets[Math.floor(Math.random() * affectedAssets.length)];
                const sellPrice = Math.round(asset.cost * card.multiplier);
                UI.showCard('chain', card, [{
                    label: `被收购 (¥${sellPrice.toLocaleString()})`, class: 'btn-success',
                    handler: () => {
                        const result = player.sellAsset(asset.name, sellPrice);
                        UI.addMessage(`${asset.name} 被收购！获得 ¥${sellPrice.toLocaleString()}`, 'income');
                        if (result && result.capitalTax > 0) {
                            UI.addMessage(`资产增值税: -¥${result.capitalTax.toLocaleString()}`, 'expense');
                        }
                        UI.updateFinancePanel(player, this.maxMonths);
                        this.finishTurn();
                    }
                }]);
                break;
            }
            case 'asset_crash': {
                const asset = affectedAssets[Math.floor(Math.random() * affectedAssets.length)];
                let multiplier = card.multiplier;
                if (player.protectionLevel >= 3) multiplier = Math.max(multiplier, 0.5);
                UI.showCard('chain', card, [{
                    label: '知道了', class: 'btn-danger',
                    handler: () => {
                        asset.cost = Math.round(asset.cost * multiplier);
                        UI.addMessage(`${card.title}！${asset.name} 价值暴跌`, 'expense');
                        UI.updateFinancePanel(player, this.maxMonths);
                        this.finishTurn();
                    }
                }]);
                break;
            }
            case 'pay_fine': {
                let amount = card.amount;
                if (player.protectionLevel >= 2) amount = Math.round(amount * 0.5);
                UI.showCard('chain', card, [{
                    label: `支付罚款 -¥${amount.toLocaleString()}${player.protectionLevel >= 2 ? ' (保护减免)' : ''}`,
                    class: 'btn-danger',
                    handler: () => {
                        player.payExpense(amount);
                        player.recordDecision('spend', card.title, amount, 0);
                        UI.addMessage(`${card.title}，支付罚款 ¥${amount.toLocaleString()}`, 'expense');
                        UI.updateFinancePanel(player, this.maxMonths);
                        this.checkBankrupt() || this.finishTurn();
                    }
                }]);
                break;
            }
            default:
                this.finishTurn();
        }
    }

    // ==============================
    // V3 新增事件处理
    // ==============================

    /** 处理财商教育卡（系统七） */
    handleEducation(card) {
        const player = this.player;
        const canAfford = player.cash >= card.cost;

        UI.showCard('education', card, [
            {
                label: canAfford ? `报名学习 (-¥${card.cost.toLocaleString()})` : '现金不足',
                class: 'btn-success', disabled: !canAfford,
                handler: () => {
                    player.payExpense(card.cost);
                    player.financialIQ = card.targetLevel;
                    player.adjustSatisfaction(5);
                    player.recordDecision('buy', card.title, card.cost, 0);
                    UI.addMessage(`完成学习！财商等级提升至 ${card.targetLevel} 级`, 'income');
                    UI.showToast(`财商等级 ${card.targetLevel}！${card.effect}`, 5000);
                    UI.updateFinancePanel(player, this.maxMonths);
                    this.finishTurn();
                }
            },
            {
                label: '太贵了，算了', class: 'btn-secondary',
                handler: () => {
                    player.recordDecision('reject', card.title, card.cost, 0);
                    UI.addMessage(`放弃了学习机会`, 'warning');
                    this.finishTurn();
                }
            }
        ], `效果: ${card.effect}`);
    }

    /** 处理资产保护卡（系统九） */
    handleProtection(card) {
        const player = this.player;
        const canAfford = player.cash >= card.cost;

        UI.showCard('protection', card, [
            {
                label: canAfford ? `购买 (-¥${card.cost.toLocaleString()})` : '现金不足',
                class: 'btn-success', disabled: !canAfford,
                handler: () => {
                    player.payExpense(card.cost);
                    player.protectionLevel = card.targetLevel;
                    player.recordDecision('buy', card.title, card.cost, 0);
                    UI.addMessage(`资产保护升级至 ${card.targetLevel} 级: ${card.effect}`, 'income');
                    UI.updateFinancePanel(player, this.maxMonths);
                    this.finishTurn();
                }
            },
            {
                label: '暂时不需要', class: 'btn-secondary',
                handler: () => {
                    player.recordDecision('reject', card.title, card.cost, 0);
                    this.finishTurn();
                }
            }
        ], `效果: ${card.effect}`);
    }

    /** 处理风险事件卡（系统九） */
    handleRisk(card) {
        const player = this.player;
        const effect = card.effects[player.protectionLevel];

        switch (effect.type) {
            case 'lose_asset': {
                if (player.assets.length === 0) {
                    UI.showCard('risk', card, [{
                        label: '还好没有资产', class: 'btn-primary',
                        handler: () => this.finishTurn()
                    }]);
                    return;
                }
                const asset = player.assets[Math.floor(Math.random() * player.assets.length)];
                UI.showCard('risk', card, [{
                    label: `失去 ${asset.name}`, class: 'btn-danger',
                    handler: () => {
                        player.sellAsset(asset.name, 0);
                        UI.addMessage(`${card.title}！失去了 ${asset.name}`, 'expense');
                        UI.updateFinancePanel(player, this.maxMonths);
                        this.finishTurn();
                    }
                }], effect.desc);
                break;
            }
            case 'pay_fine': {
                UI.showCard('risk', card, [{
                    label: `支付 -¥${effect.amount.toLocaleString()}`, class: 'btn-danger',
                    handler: () => {
                        player.payExpense(effect.amount);
                        player.recordDecision('spend', card.title, effect.amount, 0);
                        UI.addMessage(`${card.title}，赔偿 ¥${effect.amount.toLocaleString()}`, 'expense');
                        UI.updateFinancePanel(player, this.maxMonths);
                        this.checkBankrupt() || this.finishTurn();
                    }
                }], effect.desc);
                break;
            }
            case 'asset_devalue': {
                UI.showCard('risk', card, [{
                    label: '知道了', class: 'btn-danger',
                    handler: () => {
                        player.updateAssetValues('realestate', effect.multiplier);
                        player.updateAssetValues('stock', effect.multiplier);
                        player.updateAssetValues('business', effect.multiplier);
                        player.updateAssetValues('fund', effect.multiplier);
                        UI.addMessage(`${card.title}！${effect.desc}`, 'expense');
                        UI.updateFinancePanel(player, this.maxMonths);
                        this.finishTurn();
                    }
                }], effect.desc);
                break;
            }
            case 'force_sell':
            case 'force_sell_no_tax': {
                if (player.assets.length === 0) {
                    UI.showCard('risk', card, [{
                        label: '无资产可卖', class: 'btn-primary',
                        handler: () => this.finishTurn()
                    }]);
                    return;
                }
                const asset = player.assets[Math.floor(Math.random() * player.assets.length)];
                UI.showCard('risk', card, [{
                    label: `被迫卖出 ${asset.name}`, class: 'btn-danger',
                    handler: () => {
                        player.sellAsset(asset.name, asset.cost);
                        UI.addMessage(`${card.title}！被迫卖出 ${asset.name}`, 'expense');
                        UI.updateFinancePanel(player, this.maxMonths);
                        this.finishTurn();
                    }
                }], effect.desc);
                break;
            }
            case 'choose': {
                UI.showCard('risk', card, [{
                    label: '保留资产', class: 'btn-success',
                    handler: () => {
                        UI.addMessage(`${card.title}！高级保护让你得以保留资产`, 'income');
                        this.finishTurn();
                    }
                }], '信托保护：你可以选择保留资产');
                break;
            }
            default:
                this.finishTurn();
        }
    }

    /** 处理FOMO事件（系统三） */
    handleFOMO(card) {
        const player = this.player;
        UI.showCard('fomo', card, [
            {
                label: '确实后悔', class: 'btn-danger',
                handler: () => {
                    player.adjustSatisfaction(-5);
                    UI.addMessage(`FOMO情绪：后悔错过了${card.originalAsset}（满意度-5）`, 'warning');
                    UI.updateFinancePanel(player, this.maxMonths);
                    this.finishTurn();
                }
            },
            {
                label: '无所谓，我有自己的计划', class: 'btn-success',
                handler: () => {
                    player.adjustSatisfaction(3);
                    UI.addMessage(`心态成熟！专注自己的投资策略（满意度+3）`, 'income');
                    UI.updateFinancePanel(player, this.maxMonths);
                    this.finishTurn();
                }
            }
        ]);
    }

    /** 处理社交攀比事件（系统三） */
    handleSocial(card) {
        const player = this.player;

        if (card.isFollowup) {
            // 后续事件：自动+满意度
            UI.showCard('social', card, [{
                label: '知道了', class: 'btn-success',
                handler: () => {
                    player.adjustSatisfaction(card.satisfactionRestore || 8);
                    UI.addMessage(`${card.title}：坚持自己的路是对的！（满意度+${card.satisfactionRestore || 8}）`, 'income');
                    UI.updateFinancePanel(player, this.maxMonths);
                    this.finishTurn();
                }
            }]);
            return;
        }

        // 首次攀比事件
        UI.showCard('social', card, [
            {
                label: `跟风消费 (-¥${card.amount.toLocaleString()})`,
                class: 'btn-danger', disabled: player.cash < card.amount,
                handler: () => {
                    player.payExpense(card.amount);
                    player.adjustSatisfaction(10);
                    player.adjustSocialCapital(5);
                    UI.showToast('社交资本 +5（参与社交活动）', 2000);
                    player.optionalAccepted++;
                    player.recordDecision('spend', card.title, card.amount, 0);
                    UI.addMessage(`跟风消费 -¥${card.amount.toLocaleString()}（满意度+10）`, 'expense');
                    UI.updateFinancePanel(player, this.maxMonths);
                    this.checkBankrupt() || this.finishTurn();
                }
            },
            {
                label: '专注自己的路', class: 'btn-success',
                handler: () => {
                    player.adjustSatisfaction(-5);
                    player.adjustSocialCapital(-8);
                    UI.showToast('社交资本 -8（拒绝社交活动）', 2000);
                    player.optionalRejected++;
                    player.recordDecision('refuse_spend', card.title, card.amount, 0);
                    UI.addMessage(`拒绝攀比消费（满意度-5，社交资本-8），3个月后会有好消息...`, 'income');

                    // 3个月后触发后续
                    player.pendingSocialFollowup = {
                        triggerMonth: player.month + 3
                    };
                    UI.updateFinancePanel(player, this.maxMonths);
                    this.finishTurn();
                }
            }
        ]);
    }

    // ==============================
    // V5: 资产互动事件处理
    // ==============================

    handleAssetInteraction(card) {
        const player = this.player;
        const affectedAssets = player.assets.filter(a => a.type === card.requireAssetType);

        const actions = card.choices.map(choice => ({
            label: choice.label,
            class: choice.effect === 'none' ? 'btn-secondary' : (choice.cost && player.cash < choice.cost ? 'btn-secondary' : 'btn-success'),
            disabled: choice.cost ? player.cash < choice.cost : false,
            handler: () => {
                switch (choice.effect) {
                    case 'reduce_income':
                        player.updateAssetIncomes(card.requireAssetType, choice.multiplier);
                        if (choice.satisfactionDelta) player.adjustSatisfaction(choice.satisfactionDelta);
                        if (choice.socialDelta) {
                            player.adjustSocialCapital(choice.socialDelta);
                            UI.showToast(`社交资本 +${choice.socialDelta}`, 2000);
                        }
                        UI.addMessage(`${card.title}：同意调整，租金下降但保住租客`, 'warning');
                        break;

                    case 'risk_vacancy':
                        if (Math.random() < choice.chanceOfLeaving && affectedAssets.length > 0) {
                            const asset = affectedAssets[0];
                            const income = player.passiveIncomes.find(p => p.sourceAsset === asset.name);
                            const loss = income ? income.amount * choice.vacancyMonths : 0;
                            player.payExpense(loss);
                            UI.addMessage(`租客搬走了！${choice.vacancyMonths}个月空置，损失 ¥${loss.toLocaleString()}`, 'expense');
                        } else {
                            UI.addMessage(`租客接受了现有租金，继续租住`, 'income');
                            player.adjustSatisfaction(3);
                        }
                        break;

                    case 'upgrade_all_income':
                        player.payExpense(choice.cost);
                        player.updateAssetIncomes(card.requireAssetType, choice.multiplier);
                        player.recordDecision('buy', card.title, choice.cost, 0);
                        UI.addMessage(`批量升级完成！${card.requireAssetType === 'realestate' ? '房产' : '生意'}收入提升${Math.round((choice.multiplier - 1) * 100)}%`, 'income');
                        break;

                    case 'add_asset':
                        player.payExpense(choice.cost);
                        const linkedId = Player.generateLinkedId();
                        player.assets.push({ ...choice.asset, linkedId, purchaseMonth: player.month, totalEarned: 0, purchasePrice: choice.cost });
                        player.passiveIncomes.push({ name: choice.asset.name + '收入', amount: choice.monthlyIncome, sourceAsset: choice.asset.name, linkedId });
                        player.recordDecision('buy', choice.asset.name, choice.cost, choice.monthlyIncome);
                        UI.addMessage(`合作达成！新增被动收入 +¥${choice.monthlyIncome}/月`, 'income');
                        break;

                    case 'transform_stock':
                        player.updateAssetIncomes('stock', choice.incomeMultiplier);
                        player.updateAssetValues('stock', choice.valueMultiplier);
                        UI.addMessage(`股票转换完成：分红减半，但价值提升50%`, 'info');
                        break;

                    case 'none':
                    default:
                        UI.addMessage(`你选择了维持现状`, 'info');
                        break;
                }
                UI.updateFinancePanel(player, this.maxMonths);
                this.checkBankrupt() || this.finishTurn();
            }
        }));

        UI.showCard('interaction', card, actions);
    }

    // ==============================
    // V6: 贷款事件处理
    // ==============================

    handleLoanEvent(card) {
        const player = this.player;

        switch (card.effect) {
            case 'reduce_loan_payment': {
                UI.showCard('loan', card, [{
                    label: '好消息！', class: 'btn-success',
                    handler: () => {
                        player.liabilities.forEach(l => {
                            const diff = Math.round(l.monthly * (1 - card.multiplier));
                            l.monthly = Math.round(l.monthly * card.multiplier);
                            const exp = player.expenses.find(e => e.amount && !e.inflatable && e.name.includes('月供'));
                            if (exp) exp.amount = l.monthly;
                        });
                        UI.addMessage(`${card.title}！月供减少了`, 'income');
                        UI.updateFinancePanel(player, this.maxMonths);
                        this.finishTurn();
                    }
                }]);
                break;
            }
            case 'pay_fine': {
                UI.showCard('loan', card, [{
                    label: `支付 -¥${card.amount.toLocaleString()}`, class: 'btn-danger',
                    handler: () => {
                        player.payExpense(card.amount);
                        if (card.creditScoreDelta) {
                            player.creditScore = Math.max(350, player.creditScore + card.creditScoreDelta);
                            UI.addMessage(`信用评分 ${card.creditScoreDelta > 0 ? '+' : ''}${card.creditScoreDelta}`, card.creditScoreDelta > 0 ? 'income' : 'expense');
                        }
                        UI.addMessage(`${card.title}，支付 ¥${card.amount.toLocaleString()}`, 'expense');
                        UI.updateFinancePanel(player, this.maxMonths);
                        this.checkBankrupt() || this.finishTurn();
                    }
                }]);
                break;
            }
            case 'credit_boost': {
                UI.showCard('loan', card, [{
                    label: '好消息！', class: 'btn-success',
                    handler: () => {
                        player.creditScore = Math.min(950, player.creditScore + card.creditScoreDelta);
                        player.maxLoanAmount = Math.round(player.maxLoanAmount * 1.1);
                        UI.addMessage(`${card.title}！信用评分 +${card.creditScoreDelta}，贷款额度提升`, 'income');
                        UI.updateFinancePanel(player, this.maxMonths);
                        this.finishTurn();
                    }
                }]);
                break;
            }
            case 'refinance': {
                if (player.liabilities.length === 0) { this.finishTurn(); return; }
                UI.showCard('loan', card, [
                    {
                        label: '接受重组', class: 'btn-primary',
                        handler: () => {
                            player.liabilities.forEach(l => {
                                l.monthly = Math.round(l.monthly * card.monthlyReduction);
                                l.total = Math.round(l.total * card.termExtension);
                            });
                            UI.addMessage(`贷款重组完成：月供降低，但总还款增加`, 'warning');
                            UI.updateFinancePanel(player, this.maxMonths);
                            this.finishTurn();
                        }
                    },
                    {
                        label: '保持原计划', class: 'btn-secondary',
                        handler: () => { this.finishTurn(); }
                    }
                ]);
                break;
            }
            case 'early_repay_discount': {
                if (player.liabilities.length === 0) { this.finishTurn(); return; }
                const smallest = player.liabilities.reduce((min, l) => l.total < min.total ? l : min, player.liabilities[0]);
                const discountedAmount = Math.round(smallest.total * (1 - card.discount));
                const canAfford = player.cash >= discountedAmount;
                UI.showCard('loan', card, [
                    {
                        label: canAfford ? `提前还清 ${smallest.name} (-¥${discountedAmount.toLocaleString()})` : '现金不足',
                        class: 'btn-success', disabled: !canAfford,
                        handler: () => {
                            player.payExpense(discountedAmount);
                            const liabIdx = player.liabilities.indexOf(smallest);
                            if (liabIdx !== -1) {
                                const liab = player.liabilities[liabIdx];
                                if (liab.linkedId) {
                                    const expIdx = player.expenses.findIndex(e => e.linkedId === liab.linkedId);
                                    if (expIdx !== -1) player.expenses.splice(expIdx, 1);
                                } else {
                                    const expIdx = player.expenses.findIndex(e => e.amount === liab.monthly && !e.inflatable);
                                    if (expIdx !== -1) player.expenses.splice(expIdx, 1);
                                }
                                player.liabilities.splice(liabIdx, 1);
                            }
                            UI.addMessage(`提前还清 ${smallest.name}！节省 ¥${Math.round(smallest.total * card.discount).toLocaleString()} 利息`, 'income');
                            UI.updateFinancePanel(player, this.maxMonths);
                            this.finishTurn();
                        }
                    },
                    {
                        label: '放弃', class: 'btn-secondary',
                        handler: () => { this.finishTurn(); }
                    }
                ]);
                break;
            }
            default:
                this.finishTurn();
        }
    }

    // ==============================
    // V6: 职业事件处理
    // ==============================

    handleCareerEvent(card) {
        const player = this.player;

        // 只在E象限生效（有工作的人）
        if (player.quadrant !== 'E') {
            UI.addMessage(`你已经不是打工人了，职场事件不影响你`, 'info');
            this.finishTurn();
            return;
        }

        switch (card.effect) {
            case 'salary_change': {
                const newSalary = Math.round(player.salary * card.multiplier);
                const diff = newSalary - player.salary;
                const satDelta = card.satisfactionDelta || 0;
                UI.showCard('career', card, [{
                    label: diff > 0 ? '太好了！' : '接受现实',
                    class: diff > 0 ? 'btn-success' : 'btn-danger',
                    handler: () => {
                        player.salary = newSalary;
                        if (satDelta) player.adjustSatisfaction(satDelta);
                        const dir = diff > 0 ? '+' : '';
                        UI.addMessage(`${card.title}！月薪 ${dir}¥${diff.toLocaleString()}${satDelta ? `（满意度${satDelta > 0 ? '+' : ''}${satDelta}）` : ''}`, diff > 0 ? 'income' : 'expense');
                        UI.updateFinancePanel(player, this.maxMonths);
                        this.finishTurn();
                    }
                }]);
                break;
            }
            case 'satisfaction_change': {
                UI.showCard('career', card, [{
                    label: '知道了', class: 'btn-primary',
                    handler: () => {
                        player.adjustSatisfaction(card.delta);
                        UI.addMessage(`${card.title}（满意度${card.delta > 0 ? '+' : ''}${card.delta}）`, 'warning');
                        UI.updateFinancePanel(player, this.maxMonths);
                        this.finishTurn();
                    }
                }]);
                break;
            }
            case 'cash_bonus': {
                UI.showCard('career', card, [{
                    label: `收下 +¥${card.amount.toLocaleString()}`, class: 'btn-success',
                    handler: () => {
                        player.receiveIncome(card.amount);
                        UI.addMessage(`${card.title}！+¥${card.amount.toLocaleString()}`, 'income');
                        UI.updateFinancePanel(player, this.maxMonths);
                        this.finishTurn();
                    }
                }]);
                break;
            }
            case 'job_offer': {
                const newSalary = Math.round(player.salary * card.salaryMultiplier);
                const diff = newSalary - player.salary;
                const canAfford = player.cash >= card.movingCost;
                UI.showCard('career', card, [
                    {
                        label: canAfford ? `接受（搬家费¥${card.movingCost.toLocaleString()}，月薪+¥${diff.toLocaleString()}）` : '搬家费不够',
                        class: 'btn-success', disabled: !canAfford,
                        handler: () => {
                            player.payExpense(card.movingCost);
                            player.salary = newSalary;
                            player.adjustSatisfaction(-5); // 搬家压力
                            player.adjustSocialCapital(-15); // 离开社交圈
                            UI.addMessage(`跳槽成功！月薪 +¥${diff.toLocaleString()}，但搬家花了¥${card.movingCost.toLocaleString()}（社交资本-15）`, 'income');
                            UI.updateFinancePanel(player, this.maxMonths);
                            this.finishTurn();
                        }
                    },
                    {
                        label: '留在现公司', class: 'btn-secondary',
                        handler: () => {
                            UI.addMessage(`拒绝了高薪offer，留在熟悉的环境`, 'info');
                            this.finishTurn();
                        }
                    }
                ]);
                break;
            }
            case 'skill_up': {
                UI.showCard('career', card, [{
                    label: '参加培训', class: 'btn-success',
                    handler: () => {
                        player.adjustSatisfaction(5);
                        player.adjustSocialCapital(5);
                        // 小概率加薪效果
                        if (Math.random() < 0.3) {
                            const raise = Math.round(player.salary * 0.05);
                            player.salary += raise;
                            UI.addMessage(`培训后获得认可，月薪 +¥${raise.toLocaleString()}！`, 'income');
                        } else {
                            UI.addMessage(`完成培训，能力提升（满意度+5，社交资本+5）`, 'info');
                        }
                        UI.updateFinancePanel(player, this.maxMonths);
                        this.finishTurn();
                    }
                }]);
                break;
            }
            default:
                this.finishTurn();
        }
    }

    // ==============================
    // V6: 意外之财事件处理
    // ==============================

    handleWindfall(card) {
        const player = this.player;

        UI.showCard('windfall', card, [{
            label: `收下 +¥${card.amount.toLocaleString()}`, class: 'btn-success',
            handler: () => {
                player.receiveIncome(card.amount);
                UI.addMessage(`${card.title}！+¥${card.amount.toLocaleString()}`, 'income');
                UI.updateFinancePanel(player, this.maxMonths);
                this.checkAchievements();
                this.finishTurn();
            }
        }]);
    }

    // ==============================
    // 破产重启（系统十）
    // ==============================

    handleBankruptcy() {
        const player = this.player;

        if (player.restartCount >= 1) {
            // 已经重启过一次，直接结束
            this.endGame(false);
            return;
        }

        UI.showBankruptRestart(player, {
            onRestart: (newCareer) => {
                player.restart(newCareer);
                UI.addMessage('东山再起！保留知识经验，重新开始。', 'info');
                UI.showToast('破产重启！你的财商等级和学习记录已保留。', 5000);
                UI.updateFinancePanel(player, this.maxMonths);
                this.finishTurn();
            },
            onGiveUp: () => {
                this.endGame(false);
            }
        });
    }

    // ==============================
    // 通用方法
    // ==============================

    checkBankrupt() {
        if (this.player.isBankrupt()) {
            this.handleBankruptcy();
            return true;
        }
        return false;
    }

    checkAchievements(event) {
        const stats = Storage.getStats();
        const newAchievements = AchievementChecker.check(this.player, event, stats);
        newAchievements.forEach(id => {
            const ach = ACHIEVEMENTS.find(a => a.id === id);
            if (ach) UI.showToast(`${ach.icon} 成就解锁: ${ach.name}`);
        });
    }

    /** 游戏结束（V3: 含完整分析报告） */
    endGame(won, reason) {
        this.isProcessing = false;
        const player = this.player;

        const stats = Storage.updateStats(player, won);
        if (won) this.checkAchievements('game_win');

        let title, message;
        if (won) {
            title = '恭喜！财务自由！';
            message = '你成功让被动收入超过了总支出，逃出了老鼠赛跑圈！';
        } else if (reason === 'timeout') {
            title = '时间到！困在老鼠圈';
            message = `${this.maxMonths}个月过去了，你还没有实现财务自由。被动收入 ¥${player.getPassiveIncome().toLocaleString()} / 总支出 ¥${player.getTotalExpense().toLocaleString()}。不要灰心，再试一次！`;
        } else {
            title = '很遗憾，你破产了';
            message = '你的现金耗尽了。管理好现金流是理财的第一步。';
        }

        // V3: 先付自己分析
        let paySelfAnalysis = null;
        if (player.paySelfRate > 0) {
            const totalPotential = player.history.reduce((sum, h) => {
                return sum + Math.round((h.cash || 0) * 0.1); // rough estimate
            }, 0);
            paySelfAnalysis = {
                rate: player.paySelfRate,
                reserve: player.investReserve,
                totalInvested: player.totalInvested
            };
        }

        // V4: 构建关键转折点 timeline
        const keyMoments = [];
        player.decisions.forEach(d => {
            if (d.type === 'buy' && d.cashflowImpact > 200) {
                keyMoments.push({ month: d.month, type: 'good', text: `买入${d.name}（月现金流+¥${d.cashflowImpact}）` });
            }
            if (d.type === 'reject' && d.monthlyIncome && d.monthlyIncome > 200) {
                const missed = (player.month - d.month) * d.monthlyIncome;
                keyMoments.push({ month: d.month, type: 'missed', text: `放弃${d.name}（至今可赚¥${missed.toLocaleString()}）` });
            }
            if (d.type === 'buy' && d.cashflowImpact < -100) {
                keyMoments.push({ month: d.month, type: 'bad', text: `买入${d.name}（月现金流${d.cashflowImpact}）` });
            }
        });
        keyMoments.sort((a, b) => a.month - b.month);

        UI.showGameOver(won, player, title, message, stats, {
            taxPaid: player.taxPaid,
            rejectedCosts: player.getRejectedOpportunityCost(),
            quadrant: player.quadrant,
            satisfaction: player.satisfaction,
            financialIQ: player.financialIQ,
            protectionLevel: player.protectionLevel,
            paySelfAnalysis,
            activeSynergies: player.getActiveSynergies(),
            socialCapital: player.socialCapital,
            keyMoments: keyMoments.slice(0, 10),
            liabilities: player.liabilities.map(l => ({ name: l.name, total: l.total, monthly: l.monthly })),
            totalLiabilities: player.getTotalLiabilities()
        });
    }

    // ==============================
    // V4: 阶段里程碑系统
    // ==============================

    checkPhaseMilestone() {
        const player = this.player;
        const month = player.month;
        const max = this.maxMonths;
        const milestoneChecks = [
            { month: 12, check: () => player.assets.length >= 1, pass: '你已经买了第一个资产！不错的开始。', fail: '警告：12个月了你还没有买任何资产！赶快行动！', id: 'phase_12' },
            { month: Math.round(max * 0.25), check: () => player.getPassiveIncome() >= 1000, pass: '被动收入突破¥1000！你正走在正确的道路上。', fail: '时间已过25%，被动收入还不到¥1000。需要加快投资节奏！', id: 'phase_25pct' },
            { month: Math.round(max * 0.5), check: () => player.getFreedomProgress() >= 30, pass: '财务自由进度已达30%！继续保持！', fail: '已经过了一半时间，但进度不到30%。是时候大胆投资了！', id: 'phase_50pct' },
            { month: Math.round(max * 0.75), check: () => player.getFreedomProgress() >= 50, pass: '财务自由进度50%！继续冲刺！', fail: '时间只剩25%，进度不到50%。需要策略调整！', id: 'phase_75pct' },
            { month: Math.round(max * 0.9), check: () => player.getFreedomProgress() >= 80, pass: '财务自由进度80%！最后冲刺！', fail: '最后阶段了，还差很多。全力以赴！', id: 'phase_90pct' }
        ];

        const milestone = milestoneChecks.find(m => m.month === month && !player.milestonesPassed.includes(m.id));
        if (!milestone) return;

        player.milestonesPassed.push(milestone.id);
        const passed = milestone.check();

        if (passed) {
            player.adjustSatisfaction(10);
            UI.showToast(milestone.pass, 5000);
            UI.addMessage(`里程碑达成！${milestone.pass}`, 'income');
        } else {
            player.adjustSatisfaction(-5);
            UI.showToast(milestone.fail, 5000);
            UI.addMessage(`里程碑未达标：${milestone.fail}`, 'warning');
        }
    }

    // ==============================
    // V4: 主动行动系统
    // ==============================

    /** 显示主动行动菜单 */
    showActionMenu() {
        const player = this.player;
        if (player.actionsUsedThisMonth >= player.actionsPerMonth) {
            UI.showToast(`本月行动次数已用完(${player.actionsPerMonth}次)`, 2000);
            return;
        }

        const remainActions = player.actionsPerMonth - player.actionsUsedThisMonth;

        // 兼职收入根据职业类型差异化：体力劳动者按固定时薪，脑力劳动者按工资比例
        const partTimeBase = player.salary <= 6000
            ? Math.round(800 + Math.random() * 400)    // 低薪职业：跑腿送餐等，约¥800-1200
            : player.salary <= 10000
            ? Math.round(player.salary * 0.12 + Math.random() * 300)  // 中薪：家教/代班等
            : Math.round(player.salary * 0.08 + Math.random() * 500); // 高薪：咨询/接私活等，比例更低
        const partTimeIncome = player.specialTrait === 'hustler' ? partTimeBase * 2 : partTimeBase;

        const actions = [
            {
                label: '搜索投资机会',
                desc: '花时间跑中介、看盘，寻找投资标的（满意度-1）',
                icon: '🔍',
                disabled: player.getInvestmentClarity() === 'blind',
                handler: () => {
                    player.actionsUsedThisMonth++;
                    player.actionUsedThisMonth = true;
                    player.adjustSocialCapital(2);
                    player.adjustSatisfaction(-1); // 看盘跑腿也是消耗精力的
                    UI.showToast('社交资本 +2（搜索中建立人脉）', 2000);
                    let pool = CARDS.opportunity.filter(card => {
                        if ((card.unlockMonth || 1) > player.month) return false;
                        if (card.requireQuadrant && card.requireQuadrant !== player.quadrant) return false;
                        return true;
                    });
                    if (pool.length > 0) {
                        const card = pool[Math.floor(Math.random() * pool.length)];
                        UI.addMessage(`主动搜索到投资机会: ${card.asset.name}（满意度-1）`, 'info');
                        this.handleOpportunity(card);
                    } else {
                        UI.addMessage('跑了一圈没有找到合适的投资机会（满意度-1）', 'warning');
                        UI.updateFinancePanel(player, this.maxMonths);
                    }
                }
            },
            {
                label: '自修财商课程',
                desc: '花¥1200报名线上理财课程，60%概率获得学习卡',
                icon: '📖',
                disabled: player.cash < 1200,
                handler: () => {
                    player.actionsUsedThisMonth++;
                    player.actionUsedThisMonth = true;
                    player.payExpense(1200);
                    player.adjustSatisfaction(-1); // 学习需要消耗精力
                    if (Math.random() < 0.6) {
                        const unanswered = CARDS.learning.filter(c => !player.answeredQuizIds.includes(c.id));
                        if (unanswered.length > 0) {
                            const card = unanswered[Math.floor(Math.random() * unanswered.length)];
                            this.handleLearning(card);
                            return;
                        }
                    }
                    player.adjustSatisfaction(3); // 学完有收获感 (净+2)
                    UI.addMessage(`自学花费¥1,200，增长了见识（满意度+2）`, 'info');
                    if (player.specialTrait === 'learner') {
                        player.receiveIncome(800);
                        UI.addMessage(`教师天赋：学习心得转化为咨询收入 +¥800`, 'income');
                    }
                    UI.updateFinancePanel(player, this.maxMonths);
                }
            },
            {
                label: '社交聚会',
                desc: '花¥300请客吃饭拓展人脉（社交+8，满意度+5）',
                icon: '🤝',
                disabled: player.cash < 300,
                handler: () => {
                    player.actionsUsedThisMonth++;
                    player.actionUsedThisMonth = true;
                    player.payExpense(300);
                    player.adjustSocialCapital(8);
                    player.adjustSatisfaction(5);
                    UI.addMessage(`请朋友吃饭聊天，维护了关系网（社交资本+8，满意度+5）`, 'info');
                    UI.showToast('社交资本 +8（社交聚会）', 2000);
                    if (player.specialTrait === 'connected' && Math.random() < 0.4) {
                        UI.addMessage(`人脉优势：饭局上获得内部投资消息！`, 'income');
                        let pool = CARDS.opportunity.filter(c => (c.unlockMonth || 1) <= player.month + 6);
                        if (pool.length > 0) {
                            const card = pool[Math.floor(Math.random() * pool.length)];
                            setTimeout(() => this.handleOpportunity(card), 500);
                            return;
                        }
                    }
                    UI.updateFinancePanel(player, this.maxMonths);
                }
            },
            {
                label: '申请贷款',
                desc: `可贷额度 ¥${player.getAvailableLoanAmount().toLocaleString()} | 信用分 ${player.creditScore}`,
                icon: '🏦',
                disabled: player.getAvailableLoanAmount() <= 0,
                handler: () => {
                    this.showLoanPanel();
                }
            },
            {
                label: '兼职打工',
                desc: `下班后兼职赚外快，预计收入约¥${partTimeIncome.toLocaleString()}（满意度-5）`,
                icon: '💪',
                disabled: false,
                handler: () => {
                    player.actionsUsedThisMonth++;
                    player.actionUsedThisMonth = true;
                    player.receiveIncome(partTimeIncome);
                    player.adjustSatisfaction(-5); // 下班再打工确实很累
                    const traitNote = player.specialTrait === 'hustler' ? '（副业达人：收入翻倍！）' : '';
                    UI.addMessage(`兼职赚了 ¥${partTimeIncome.toLocaleString()}（满意度-5，加班太累了）${traitNote}`, 'income');
                    UI.updateFinancePanel(player, this.maxMonths);
                }
            },
            {
                label: '休息调整',
                desc: `周末好好休息，恢复满意度+${player.satisfaction < 30 ? 10 : 6}`,
                icon: '🧘',
                disabled: false,
                handler: () => {
                    player.actionsUsedThisMonth++;
                    player.actionUsedThisMonth = true;
                    // 满意度越低休息效果越好，正常状态下回复有限（边际递减）
                    const restore = player.satisfaction < 30 ? 10 : player.satisfaction < 50 ? 8 : 6;
                    player.adjustSatisfaction(restore);
                    UI.addMessage(`好好休息了一下，恢复了精力（满意度+${restore}）`, 'info');
                    UI.updateFinancePanel(player, this.maxMonths);
                }
            },
            {
                label: '市场调研',
                desc: '花¥800购买行业报告和数据，下次事件卡多一个选项',
                icon: '📊',
                disabled: player.cash < 800,
                handler: () => {
                    player.actionsUsedThisMonth++;
                    player.actionUsedThisMonth = true;
                    player.payExpense(800);
                    player._marketResearchActive = true;
                    UI.addMessage(`购买了行业分析报告，下个月事件卡将多一个选择`, 'info');
                    UI.updateFinancePanel(player, this.maxMonths);
                }
            }
        ];

        UI.showActionMenu(actions, () => {
            // 取消不消耗行动
        }, remainActions);
    }

    /** V7: 增强版贷款面板 */
    showLoanPanel() {
        const player = this.player;
        const maxLoan = player.getAvailableLoanAmount();
        const annualRate = Math.max(0.04, 0.08 - (player.creditScore - 650) * 0.000133);

        const calcMonthly = (amount, term) => {
            const monthlyRate = annualRate / 12;
            return Math.round(amount * monthlyRate * Math.pow(1 + monthlyRate, term) / (Math.pow(1 + monthlyRate, term) - 1));
        };

        UI.showLoanPanel({
            creditScore: player.creditScore,
            annualRate,
            maxLoan,
            existingLoans: player.personalLoans,
            calcMonthly
        }, (amount, term) => {
            player.actionsUsedThisMonth++;
            player.actionUsedThisMonth = true;
            const loan = player.takeLoan(amount, term);
            if (loan) {
                const totalInterest = loan.monthly * term - amount;
                UI.addMessage(`贷款成功！获得 ¥${amount.toLocaleString()}，月供 ¥${loan.monthly}（${term}月）`, 'info');
                UI.addMessage(`年利率 ${(annualRate * 100).toFixed(1)}%，总利息 ¥${totalInterest.toLocaleString()}`, 'warning');
                UI.updateFinancePanel(player, this.maxMonths);
            }
        });
    }

    /** 获取当前象限进化条件文本 */
    getQuadrantConditionText(player) {
        switch (player.quadrant) {
            case 'E': {
                const hasBiz = player.assets.some(a => a.type === 'business');
                return `E→S: 现金≥¥50,000(当前¥${player.cash.toLocaleString()}) 且 拥有生意(${hasBiz ? '✓' : '✗'}) 且 满意度≥30(${player.satisfaction >= 30 ? '✓' : '✗'})`;
            }
            case 'S': {
                const bizCount = player.assets.filter(a => a.type === 'business').length;
                const passive = player.getPassiveIncome();
                return `S→B: 生意≥3个(当前${bizCount}个) 且 被动收入≥¥5,000(当前¥${passive.toLocaleString()}) 且 满意度≥30(${player.satisfaction >= 30 ? '✓' : '✗'})`;
            }
            case 'B': {
                const passive = player.getPassiveIncome();
                const target = Math.round(player.getTotalExpense() * 0.8);
                return `B→I: 被动收入≥总支出80%(¥${passive.toLocaleString()}/¥${target.toLocaleString()}) 且 满意度≥30(${player.satisfaction >= 30 ? '✓' : '✗'})`;
            }
            case 'I':
                return '已达最高象限！';
            default:
                return '';
        }
    }

    /** V9: 保存真正的 finishTurn 用于事件队列结束后调用 */
    _realFinishTurn() {
        this._doFinishTurn();
    }

    finishTurn() {
        // V9: 如果还有排队的事件，处理下一个而不是真正结束回合
        if (this._eventQueue) {
            const { events, nextIndex } = this._eventQueue;
            this._processEventQueue(events, nextIndex);
            return;
        }
        this._doFinishTurn();
    }

    _doFinishTurn() {
        this.isProcessing = false;
        const player = this.player;
        const remaining = this.maxMonths - player.month + 1;

        // V4: 阶段里程碑检查
        this.checkPhaseMilestone();

        // V4: 后期挑战 - 40月后事件强度增加
        if (player.month >= 48 && player.month % 3 === 0) {
            UI.addMessage(`最后冲刺阶段！市场波动加剧...`, 'warning');
        }

        // 满意度里程碑检查
        const progress = player.getFreedomProgress();
        const milestones = [25, 50, 75, 100];
        const prevProgress = player.history.length >= 2 ? player.history[player.history.length - 2] : null;
        if (prevProgress) {
            const prevProg = prevProgress.totalExpense > 0
                ? Math.round((prevProgress.passiveIncome / prevProgress.totalExpense) * 100) : 0;
            milestones.forEach(m => {
                if (progress >= m && prevProg < m) {
                    player.adjustSatisfaction(15);
                    UI.showToast(`里程碑达成！财务自由进度 ${m}%！满意度+15`, 4000);
                }
            });
        }

        // 被动收入千元整数门槛
        const passiveK = Math.floor(player.getPassiveIncome() / 1000);
        const prevPassiveK = prevProgress ? Math.floor((prevProgress.passiveIncome || 0) / 1000) : 0;
        if (passiveK > prevPassiveK && passiveK > 0) {
            player.adjustSatisfaction(10);
            UI.showToast(`被动收入突破 ¥${passiveK * 1000}！满意度+10`, 3000);
        }

        // V4: 社交资本自然恢复（每月+1）
        player.adjustSocialCapital(1);

        UI.updateFinancePanel(player, this.maxMonths);

        // V5: 动态提示区域（主动行动按钮更突出 + 状态摘要）
        const phaseWarning = remaining <= 12 ? `<p style="color:var(--color-negative);margin-top:8px;font-weight:600;font-size:18px">最后 ${remaining} 个月！</p>` :
                             remaining <= 24 ? `<p style="color:var(--color-gold);margin-top:8px">剩余 ${remaining} 个月</p>` : '';

        const clarityInfo = player.getInvestmentClarity();
        const clarityLabel = { clear: '', normal: '', foggy: '⚠ 判断力下降', blind: '⚠ 心态崩溃' };
        const clarityHtml = clarityLabel[clarityInfo] ? `<p style="color:var(--color-expense);font-size:13px;margin-top:4px">${clarityLabel[clarityInfo]}（满意度${player.satisfaction}）</p>` : '';

        // V5: 象限进化提示
        const quadCondition = this.getQuadrantConditionText(player);
        const quadHtml = player.quadrant !== 'I' ? `<p style="color:var(--color-text-dim);font-size:12px;margin-top:8px;max-width:400px;margin-left:auto;margin-right:auto">${quadCondition}</p>` : '';

        const remainActions = player.actionsPerMonth - player.actionsUsedThisMonth;
        const actionStatusHtml = remainActions > 0 ?
            `<p style="color:var(--color-gold);font-size:14px;margin-top:8px">剩余 ${remainActions} 次主动行动（按 Space 或点击下方按钮）</p>` :
            `<p style="color:var(--color-text-dim);font-size:12px;margin-top:8px">本月行动次数已用完</p>`;

        UI.setEventArea(`
            <div style="text-align:center">
                <p style="font-size:16px;margin-bottom:8px">第 ${player.month} 月 / 共 ${this.maxMonths} 月</p>
                <p style="color:var(--color-text-dim)">按 Enter 进入下个月</p>
                ${phaseWarning}
                ${clarityHtml}
                ${actionStatusHtml}
                ${quadHtml}
            </div>
        `);

        document.getElementById('btn-next-month').disabled = false;
    }

    /** 主动卖出资产 */
    sellAssetManually(assetIndex) {
        const player = this.player;
        const asset = player.assets[assetIndex];
        if (!asset) return;

        const sellPrice = asset.cost;
        const linkedId = asset.linkedId;
        const liab = linkedId ? player.liabilities.find(l => l.linkedId === linkedId) : null;
        const loanRemaining = liab ? liab.total : 0;
        const profit = sellPrice - (asset.purchasePrice || asset.cost);
        const capitalTax = profit > 0 ? Math.round(profit * Player.TAX_RATES.capital) : 0;
        const netProceeds = sellPrice - loanRemaining - capitalTax;

        const details = [
            { label: '市价', value: `¥${sellPrice.toLocaleString()}` },
            { label: '需偿还贷款', value: liab ? `¥${loanRemaining.toLocaleString()}` : '无' }
        ];
        if (capitalTax > 0) {
            details.push({ label: '资产增值税', value: `-¥${capitalTax.toLocaleString()}` });
        }
        details.push({ label: '净收入', value: `¥${netProceeds.toLocaleString()}`, highlight: netProceeds >= 0 });

        UI.showConfirmModal(
            '确认卖出',
            `确定要卖出 ${asset.name} 吗？`,
            details,
            () => {
                const result = player.sellAsset(asset.name, sellPrice);
                UI.addMessage(`卖出 ${asset.name}，净收入 ¥${netProceeds.toLocaleString()}`, netProceeds >= 0 ? 'income' : 'expense');
                if (result && result.capitalTax > 0) {
                    UI.addMessage(`资产增值税: -¥${result.capitalTax.toLocaleString()}`, 'expense');
                }
                UI.updateFinancePanel(player, this.maxMonths);
                this.checkSynergyChanges();
            }
        );
    }

    /** 主动提前还贷 */
    payOffLiabilityManually(liabIndex) {
        const player = this.player;
        const liab = player.liabilities[liabIndex];
        if (!liab) return;

        if (player.cash < liab.total) {
            UI.showToast('现金不足以偿还此笔贷款');
            return;
        }

        UI.showConfirmModal(
            '确认提前还款',
            `确定要提前还清 ${liab.name} 吗？`,
            [
                { label: '还款金额', value: `¥${liab.total.toLocaleString()}` },
                { label: '每月节省', value: `¥${liab.monthly.toLocaleString()}`, highlight: true }
            ],
            () => {
                const result = player.payOffLiability(liabIndex);
                if (result) {
                    UI.addMessage(`提前还清 ${liab.name}，每月节省 ¥${result.monthlySaved}`, 'income');
                    UI.updateFinancePanel(player, this.maxMonths);
                    this.checkAchievements();
                }
            }
        );
    }

    /** 切换先付自己比例 */
    cyclePaySelfRate() {
        const rates = [0, 0.1, 0.2, 0.3];
        const currentIdx = rates.indexOf(this.player.paySelfRate);
        const nextIdx = (currentIdx + 1) % rates.length;
        this.player.paySelfRate = rates[nextIdx];
        UI.updateFinancePanel(this.player, this.maxMonths);
        UI.showToast(`先付自己比例: ${Math.round(rates[nextIdx] * 100)}%`, 2000);
    }

    /** 存档 */
    save() {
        const slot = Storage.getNextFreeSlot();
        if (slot) {
            Storage.save(slot, this.player);
            UI.addMessage('游戏已保存', 'info');
        } else {
            Storage.save('slot1', this.player);
            UI.addMessage('存档已满，覆盖了最早的存档', 'warning');
        }
    }
}
