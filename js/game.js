/**
 * 核心游戏引擎 V3
 * 新增: 现金流模式检测、先付自己、满意度系统、税务显示、象限进化、
 *       复利追踪、财商教育、协同效应、资产保护、破产重启、FOMO、社交攀比
 */
class Game {
    constructor(player) {
        this.player = player;
        this.isProcessing = false;
        this.maxMonths = 60;
        this.isFirstMonth = (player.month === 1);
    }

    /** 进入下一个月 */
    nextMonth() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        const player = this.player;
        const isNewYear = player.month > 1 && player.month % 12 === 0;

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

        UI.addMessage(`${quadrantLabel[player.quadrant]} ¥${result.grossSalary.toLocaleString()} → 扣税${Math.round(Player.TAX_RATES.salary * 100)}% → 到手 ¥${result.netSalary.toLocaleString()}`, 'income');

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

        // 通胀 5~8%
        const rate = 0.05 + Math.random() * 0.03;
        const increase = player.applyInflation(rate);

        UI.addMessage(`第${year}年结束！物价上涨 ${Math.round(rate * 100)}%，月支出增加 ¥${increase}`, 'warning');
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
            quadrant: player.quadrant
        }, onClose);
    }

    // ==============================
    // 抽卡与事件处理
    // ==============================

    drawAndProcessCard() {
        const { type, card } = drawCard(this.player);

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
            default: this.finishTurn();
        }
    }

    /** 处理投资机会（V3: 准备金支付、财商等级信息差、FOMO队列） */
    handleOpportunity(card) {
        const player = this.player;
        const canAfford = player.getInvestableAmount() >= card.downPayment;
        const reserveNote = player.investReserve > 0
            ? `(现金 ¥${player.cash.toLocaleString()} + 准备金 ¥${player.investReserve.toLocaleString()})`
            : '';

        // 财商等级信息差
        let extraNote = reserveNote;
        if (player.financialIQ >= 1) {
            const net = card.monthlyIncome - (card.liability ? card.liability.monthly : 0);
            const payback = net > 0 ? Math.ceil(card.downPayment / net) : '永不';
            extraNote += `\n净现金流: ¥${net}/月 | 回收期: ${payback}${typeof payback === 'number' ? '个月' : ''}`;
        }
        if (player.financialIQ >= 2) {
            const net = card.monthlyIncome - (card.liability ? card.liability.monthly : 0);
            const annualROI = card.downPayment > 0 ? ((net * 12 / card.downPayment) * 100).toFixed(1) : 0;
            const risk = net < 0 ? '高（负现金流）' : net < 200 ? '中' : '低';
            extraNote += `\n年化ROI: ${annualROI}% | 风险评级: ${risk}`;
        }
        if (player.financialIQ >= 3) {
            const net = card.monthlyIncome - (card.liability ? card.liability.monthly : 0);
            const advice = net > 0 ? '建议买入' : '慎重考虑';
            extraNote += `\n投资建议: ${advice}`;
        }

        // 72法则提示
        if (player.financialIQ >= 1 && card.downPayment > 0) {
            const net = card.monthlyIncome - (card.liability ? card.liability.monthly : 0);
            if (net > 0) {
                const annualReturn = (net * 12 / card.downPayment) * 100;
                if (annualReturn > 0) {
                    const doubleYears = (72 / annualReturn).toFixed(1);
                    extraNote += `\n72法则: 约${doubleYears}年翻倍`;
                }
            }
        }

        const actions = [
            {
                label: canAfford ? `买入 (¥${card.downPayment.toLocaleString()})` : `资金不足 (需¥${card.downPayment.toLocaleString()})`,
                class: 'btn-success', disabled: !canAfford,
                handler: () => {
                    player.buyAsset(card);
                    UI.addMessage(`购买了 ${card.asset.name}，每月被动收入 +¥${card.monthlyIncome}`, 'income');
                    if (card.liability) {
                        UI.addMessage(`新增贷款: ${card.liability.name}，月供 ¥${card.liability.monthly}`, 'expense');
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

    /** 处理额外支出（V3: 满意度影响） */
    handleExpense(card) {
        const player = this.player;
        let actualAmount = card.amount;

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

            UI.showCard('expense', card, actions, actualAmount !== card.amount ? `(保险/保护减免后: ¥${actualAmount})` : null);
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

    /** 处理学习卡（V3: 满意度+已答题记录） */
    handleLearning(card) {
        this.player.quizTotal++;
        UI.showLearningCard(card, (correct) => {
            if (correct) {
                this.player.quizCorrect++;
                this.player.receiveIncome(card.reward);
                this.player.adjustSatisfaction(3); // 学习答对+3
                this.player.answeredQuizIds.push(card.id);
                UI.addMessage(`答对问题！奖励 +¥${card.reward.toLocaleString()}（满意度+3）`, 'income');
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
                    player.optionalRejected++;
                    player.recordDecision('refuse_spend', card.title, card.amount, 0);
                    UI.addMessage(`拒绝攀比消费（满意度-5），3个月后会有好消息...`, 'income');

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
            message = `60个月过去了，你还没有实现财务自由。被动收入 ¥${player.getPassiveIncome().toLocaleString()} / 总支出 ¥${player.getTotalExpense().toLocaleString()}。不要灰心，再试一次！`;
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

        UI.showGameOver(won, player, title, message, stats, {
            taxPaid: player.taxPaid,
            rejectedCosts: player.getRejectedOpportunityCost(),
            quadrant: player.quadrant,
            satisfaction: player.satisfaction,
            financialIQ: player.financialIQ,
            protectionLevel: player.protectionLevel,
            paySelfAnalysis,
            activeSynergies: player.getActiveSynergies()
        });
    }

    finishTurn() {
        this.isProcessing = false;
        const player = this.player;
        const remaining = this.maxMonths - player.month + 1;

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

        UI.updateFinancePanel(player, this.maxMonths);

        UI.setEventArea(`
            <div style="text-align:center">
                <p style="font-size:16px;margin-bottom:8px">第 ${player.month} 月 / 共 ${this.maxMonths} 月</p>
                <p style="color:var(--color-text-dim)">点击下方按钮进入下个月</p>
                ${remaining <= 10 ? `<p style="color:var(--color-negative);margin-top:8px;font-weight:600">剩余 ${remaining} 个月！</p>` : ''}
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
