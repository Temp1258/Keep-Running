/**
 * 核心游戏引擎 V2
 * 新增: 月数限制、通胀、年度回顾、连锁事件、利率变动、成就检查
 */
class Game {
    constructor(player) {
        this.player = player;
        this.isProcessing = false;
        this.maxMonths = 60;
        this.loansCleared = []; // 本月自然还清的贷款
    }

    /** 进入下一个月 */
    nextMonth() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        const player = this.player;
        const isNewYear = player.month > 1 && player.month % 12 === 0;

        // 1. 结算月收支
        const result = player.processMonth();

        UI.addMessage(`发薪日！工资 +¥${player.salary.toLocaleString()}`, 'income');
        if (player.getPassiveIncome() > 0) {
            UI.addMessage(`被动收入 +¥${player.getPassiveIncome().toLocaleString()}`, 'income');
        }
        UI.addMessage(`月支出 -¥${result.expense.toLocaleString()}`, 'expense');
        UI.addMessage(`本月现金流: ¥${result.cashflow.toLocaleString()}`, result.cashflow >= 0 ? 'income' : 'expense');

        // 2. 检查贷款自然还清
        // amortizeLoans() was called inside processMonth()
        // Check if any liabilities were cleared by comparing before/after

        // 3. 检查破产
        if (player.isBankrupt()) {
            UI.updateFinancePanel(player, this.maxMonths);
            this.endGame(false);
            return;
        }

        // 4. 检查财务自由
        if (player.isFinanciallyFree()) {
            UI.updateFinancePanel(player, this.maxMonths);
            this.endGame(true);
            return;
        }

        // 5. 检查月数限制
        if (player.month > this.maxMonths) {
            UI.updateFinancePanel(player, this.maxMonths);
            this.endGame(false, 'timeout');
            return;
        }

        UI.updateFinancePanel(player, this.maxMonths);

        // 6. 年度事件（通胀 + 回顾）
        if (isNewYear) {
            this.handleAnnualEvents();
            return;
        }

        // 7. 抽事件卡
        this.drawAndProcessCard();
    }

    /** 年度事件处理 */
    handleAnnualEvents() {
        const player = this.player;
        const year = Math.floor(player.month / 12);

        // 通胀 5~8%
        const rate = 0.05 + Math.random() * 0.03;
        const increase = player.applyInflation(rate);

        UI.addMessage(`第${year}年结束！物价上涨 ${Math.round(rate * 100)}%，月支出增加 ¥${increase}`, 'warning');
        UI.updateFinancePanel(player, this.maxMonths);

        // 显示年度回顾
        this.showAnnualReview(year, () => {
            this.drawAndProcessCard();
        });
    }

    /** 年度回顾 */
    showAnnualReview(year, onClose) {
        const player = this.player;
        const history = player.history;

        // 取今年和去年的数据对比
        const thisYearEnd = history.length > 0 ? history[history.length - 1] : null;
        const lastYearEnd = history.length >= 12 ? history[history.length - 12] : (history.length > 0 ? history[0] : null);

        let grade = 'D';
        let gradeMsg = '需要加油，多投资产生被动收入的资产。';
        const progress = player.getFreedomProgress();
        if (progress >= 80) { grade = 'A'; gradeMsg = '太棒了！财务自由近在咫尺！'; }
        else if (progress >= 50) { grade = 'B'; gradeMsg = '不错的进展，继续保持投资节奏。'; }
        else if (progress >= 25) { grade = 'C'; gradeMsg = '有一定进步，但还需要加快步伐。'; }

        const cashflowChange = thisYearEnd && lastYearEnd
            ? thisYearEnd.cashflow - lastYearEnd.cashflow : 0;
        const passiveChange = thisYearEnd && lastYearEnd
            ? thisYearEnd.passiveIncome - lastYearEnd.passiveIncome : 0;
        const netWorthChange = thisYearEnd && lastYearEnd
            ? thisYearEnd.netWorth - lastYearEnd.netWorth : 0;

        UI.showAnnualReview({
            year, grade, gradeMsg,
            cashflow: player.getMonthlyCashflow(),
            cashflowChange, passiveChange, netWorthChange,
            passiveIncome: player.getPassiveIncome(),
            totalExpense: player.getTotalExpense(),
            progress
        }, onClose);
    }

    /** 抽卡并处理 */
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
        }
    }

    /** 处理投资机会 */
    handleOpportunity(card) {
        const canAfford = this.player.cash >= card.downPayment;
        const actions = [
            {
                label: canAfford ? `买入 (¥${card.downPayment.toLocaleString()})` : `现金不足 (需¥${card.downPayment.toLocaleString()})`,
                class: 'btn-success', disabled: !canAfford,
                handler: () => {
                    this.player.buyAsset(card);
                    UI.addMessage(`购买了 ${card.asset.name}，每月被动收入 +¥${card.monthlyIncome}`, 'income');
                    if (card.liability) {
                        UI.addMessage(`新增贷款: ${card.liability.name}，月供 ¥${card.liability.monthly}`, 'expense');
                    }
                    UI.updateFinancePanel(this.player, this.maxMonths);
                    this.checkAchievements();
                    this.finishTurn();
                }
            },
            {
                label: '放弃', class: 'btn-secondary',
                handler: () => {
                    this.player.recordDecision('reject', card.asset.name, 0, 0);
                    UI.addMessage(`放弃了投资 ${card.asset.name} 的机会`, 'warning');
                    this.finishTurn();
                }
            }
        ];
        UI.showCard('opportunity', card, actions);
    }

    /** 处理额外支出 */
    handleExpense(card) {
        // 保险减半医疗支出
        let actualAmount = card.amount;
        if (card.medicalType && this.player.hasInsurance) {
            actualAmount = Math.round(card.amount * 0.5);
        }

        if (card.optional) {
            const actions = [];

            if (card.isInsurance) {
                // 保险卡特殊处理
                actions.push({
                    label: `购买保险 (-¥${actualAmount.toLocaleString()})`,
                    class: 'btn-primary', disabled: this.player.cash < actualAmount,
                    handler: () => {
                        this.player.payExpense(actualAmount);
                        this.player.hasInsurance = true;
                        this.player.optionalAccepted++;
                        this.player.recordDecision('spend', card.title, actualAmount, 0);
                        UI.addMessage(`购买了保险，今后医疗类支出减半`, 'info');
                        UI.updateFinancePanel(this.player, this.maxMonths);
                        this.checkBankrupt() || this.finishTurn();
                    }
                });
            } else if (card.cashGain) {
                // 信用卡分期特殊处理
                actions.push({
                    label: `接受 (获得¥${card.cashGain.toLocaleString()})`,
                    class: 'btn-danger',
                    handler: () => {
                        this.player.receiveIncome(card.cashGain);
                        this.player.addRecurringExpense(card.addExpense, card.addLiability);
                        this.player.optionalAccepted++;
                        this.player.recordDecision('spend', card.title, -card.cashGain, -card.addExpense.amount);
                        UI.addMessage(`接受了信用卡分期，获得 ¥${card.cashGain.toLocaleString()}`, 'expense');
                        UI.addMessage(`新增月支出: ${card.addExpense.name} -¥${card.addExpense.amount}/月`, 'expense');
                        UI.updateFinancePanel(this.player, this.maxMonths);
                        this.finishTurn();
                    }
                });
            } else {
                actions.push({
                    label: `购买 (-¥${actualAmount.toLocaleString()})`,
                    class: 'btn-danger', disabled: this.player.cash < actualAmount,
                    handler: () => {
                        this.player.payExpense(actualAmount);
                        this.player.optionalAccepted++;
                        this.player.recordDecision('spend', card.title, actualAmount, 0);
                        UI.addMessage(`消费: ${card.title} -¥${actualAmount.toLocaleString()}`, 'expense');
                        if (card.addExpense) {
                            this.player.addRecurringExpense(card.addExpense, card.addLiability);
                            UI.addMessage(`新增月支出: ${card.addExpense.name} -¥${card.addExpense.amount}/月`, 'expense');
                        }
                        UI.updateFinancePanel(this.player, this.maxMonths);
                        this.checkBankrupt() || this.finishTurn();
                    }
                });
            }

            actions.push({
                label: '拒绝', class: 'btn-success',
                handler: () => {
                    this.player.optionalRejected++;
                    this.player.recordDecision('refuse_spend', card.title, actualAmount, 0);
                    UI.addMessage(`明智地拒绝了 ${card.title}`, 'income');
                    // 检查拒绝车贷成就
                    if (card.id === 'new_car_tempt') this.checkAchievements('reject_car');
                    this.finishTurn();
                }
            });

            UI.showCard('expense', card, actions, actualAmount !== card.amount ? `(保险减免后: ¥${actualAmount})` : null);
        } else {
            // 房东涨租特殊处理
            if (card.addExpenseOnly) {
                UI.showCard('expense', card, [{
                    label: '知道了', class: 'btn-danger',
                    handler: () => {
                        this.player.expenses.push({ ...card.addExpenseOnly });
                        this.player.recordDecision('spend', card.title, 0, -card.addExpenseOnly.amount);
                        UI.addMessage(`${card.title}，月支出 +¥${card.addExpenseOnly.amount}`, 'expense');
                        UI.updateFinancePanel(this.player, this.maxMonths);
                        this.finishTurn();
                    }
                }]);
                return;
            }

            // 强制支出（保险可减免）
            const displayAmount = (card.medicalType && this.player.hasInsurance) ? actualAmount : card.amount;
            const extra = (card.medicalType && this.player.hasInsurance) ? ' (保险减免50%)' : '';
            UI.showCard('expense', card, [{
                label: `支付 -¥${displayAmount.toLocaleString()}${extra}`,
                class: 'btn-danger',
                handler: () => {
                    this.player.payExpense(displayAmount);
                    this.player.recordDecision('spend', card.title, displayAmount, 0);
                    UI.addMessage(`意外支出: ${card.title} -¥${displayAmount.toLocaleString()}${extra}`, 'expense');
                    UI.updateFinancePanel(this.player, this.maxMonths);
                    this.checkBankrupt() || this.finishTurn();
                }
            }]);
        }
    }

    /** 处理市场波动 */
    handleMarket(card) {
        // 利率变化
        if (card.rateChange !== undefined) {
            UI.showCard('market', card, [{
                label: '知道了', class: 'btn-primary',
                handler: () => {
                    const change = card.rateChange;
                    this.player.liabilities.forEach(l => {
                        const diff = Math.round(l.monthly * Math.abs(change));
                        l.monthly += change > 0 ? diff : -diff;
                        // 同步更新对应支出
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

        // 全局涨跌
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

        // 常规资产涨跌
        UI.showMarketCard(card, this.player, (decision, assetName, sellPrice) => {
            if (card.incomeMultiplier) {
                this.player.updateAssetIncomes(card.assetType, card.incomeMultiplier);
                const dir = card.incomeMultiplier > 1 ? '增长' : '下降';
                UI.addMessage(`${card.title}！收入${dir}了`, card.incomeMultiplier > 1 ? 'income' : 'warning');
            } else if (decision === 'sell') {
                const result = this.player.sellAsset(assetName, sellPrice);
                UI.addMessage(`卖出 ${assetName}，获得 ¥${sellPrice.toLocaleString()}`, 'income');
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

    /** 处理学习卡 */
    handleLearning(card) {
        this.player.quizTotal++;
        UI.showLearningCard(card, (correct) => {
            if (correct) {
                this.player.quizCorrect++;
                this.player.receiveIncome(card.reward);
                UI.addMessage(`答对问题！奖励 +¥${card.reward.toLocaleString()}`, 'income');
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
                // 损失N个月租金
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
                    // 自动生效（好事或坏事）
                    UI.showCard('chain', card, [{
                        label: '知道了', class: 'btn-primary',
                        handler: () => {
                            if (card.cost > 0) player.payExpense(card.cost);
                            player.updateAssetIncomes(card.requireAssetType, card.incomeMultiplier);
                            const dir = card.incomeMultiplier > 1 ? '提升' : '下降';
                            UI.addMessage(`${card.title}！${card.requireAssetType === 'business' ? '生意' : '基金'}收入${dir}了`, card.incomeMultiplier > 1 ? 'income' : 'warning');
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
                        player.sellAsset(asset.name, sellPrice);
                        UI.addMessage(`${asset.name} 被收购！获得 ¥${sellPrice.toLocaleString()}`, 'income');
                        UI.updateFinancePanel(player, this.maxMonths);
                        this.finishTurn();
                    }
                }]);
                break;
            }

            case 'asset_crash': {
                const asset = affectedAssets[Math.floor(Math.random() * affectedAssets.length)];
                UI.showCard('chain', card, [{
                    label: '知道了', class: 'btn-danger',
                    handler: () => {
                        asset.cost = Math.round(asset.cost * card.multiplier);
                        UI.addMessage(`${card.title}！${asset.name} 价值暴跌`, 'expense');
                        UI.updateFinancePanel(player, this.maxMonths);
                        this.finishTurn();
                    }
                }]);
                break;
            }

            case 'pay_fine': {
                UI.showCard('chain', card, [{
                    label: `支付罚款 -¥${card.amount.toLocaleString()}`, class: 'btn-danger',
                    handler: () => {
                        player.payExpense(card.amount);
                        player.recordDecision('spend', card.title, card.amount, 0);
                        UI.addMessage(`${card.title}，支付罚款 ¥${card.amount.toLocaleString()}`, 'expense');
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

    /** 检查破产 */
    checkBankrupt() {
        if (this.player.isBankrupt()) {
            this.endGame(false);
            return true;
        }
        return false;
    }

    /** 检查成就 */
    checkAchievements(event) {
        const stats = Storage.getStats();
        const newAchievements = AchievementChecker.check(this.player, event, stats);
        newAchievements.forEach(id => {
            const ach = ACHIEVEMENTS.find(a => a.id === id);
            if (ach) UI.showToast(`${ach.icon} 成就解锁: ${ach.name}`);
        });
    }

    /** 游戏结束 */
    endGame(won, reason) {
        this.isProcessing = false;
        const player = this.player;

        // 更新全局统计
        const stats = Storage.updateStats(player, won);

        // 检查结束时成就
        if (won) this.checkAchievements('game_win');

        // 根据结束原因显示不同消息
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

        UI.showGameOver(won, player, title, message, stats);
    }

    /** 结束回合 */
    finishTurn() {
        this.isProcessing = false;
        const remaining = this.maxMonths - this.player.month + 1;
        UI.setEventArea(`
            <div style="text-align:center">
                <p style="font-size:16px;margin-bottom:8px">第 ${this.player.month} 月 / 共 ${this.maxMonths} 月</p>
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

        const sellPrice = asset.cost; // 按当前市价卖出
        const linkedId = asset.linkedId;
        const liab = linkedId
            ? player.liabilities.find(l => l.linkedId === linkedId)
            : null;
        const loanRemaining = liab ? liab.total : 0;
        const netProceeds = sellPrice - loanRemaining;

        UI.showConfirmModal(
            '确认卖出',
            `确定要卖出 ${asset.name} 吗？`,
            [
                { label: '市价', value: `¥${sellPrice.toLocaleString()}` },
                { label: '需偿还贷款', value: liab ? `¥${loanRemaining.toLocaleString()}` : '无' },
                { label: '净收入', value: `¥${netProceeds.toLocaleString()}`, highlight: netProceeds >= 0 }
            ],
            () => {
                player.sellAsset(asset.name, sellPrice);
                UI.addMessage(`卖出 ${asset.name}，净收入 ¥${netProceeds.toLocaleString()}`, netProceeds >= 0 ? 'income' : 'expense');
                UI.updateFinancePanel(player, this.maxMonths);
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
