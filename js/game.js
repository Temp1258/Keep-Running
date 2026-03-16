/**
 * 核心游戏引擎
 */
class Game {
    constructor(player) {
        this.player = player;
        this.isProcessing = false;
    }

    /** 进入下一个月 */
    nextMonth() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        const player = this.player;

        // 1. 结算月收支
        const result = player.processMonth();

        UI.addMessage(`发薪日！工资 +¥${player.salary.toLocaleString()}`, 'income');
        if (player.getPassiveIncome() > 0) {
            UI.addMessage(`被动收入 +¥${player.getPassiveIncome().toLocaleString()}`, 'income');
        }
        UI.addMessage(`月支出 -¥${result.expense.toLocaleString()}`, 'expense');
        UI.addMessage(`本月现金流: ¥${result.cashflow.toLocaleString()}`, result.cashflow >= 0 ? 'income' : 'expense');

        // 2. 检查破产
        if (player.isBankrupt()) {
            UI.updateFinancePanel(player);
            UI.showGameOver(false, player);
            this.isProcessing = false;
            return;
        }

        // 3. 检查财务自由
        if (player.isFinanciallyFree()) {
            UI.updateFinancePanel(player);
            UI.showGameOver(true, player);
            this.isProcessing = false;
            return;
        }

        // 4. 抽事件卡
        UI.updateFinancePanel(player);
        this.drawAndProcessCard();
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
            case 'opportunity':
                this.handleOpportunity(card);
                break;
            case 'expense':
                this.handleExpense(card);
                break;
            case 'market':
                this.handleMarket(card);
                break;
            case 'learning':
                this.handleLearning(card);
                break;
        }
    }

    /** 处理投资机会 */
    handleOpportunity(card) {
        const canAfford = this.player.cash >= card.downPayment;
        const actions = [
            {
                label: canAfford ? `买入 (¥${card.downPayment.toLocaleString()})` : `现金不足 (需要¥${card.downPayment.toLocaleString()})`,
                class: 'btn-success',
                disabled: !canAfford,
                handler: () => {
                    this.player.buyAsset(card);
                    UI.addMessage(`购买了 ${card.asset.name}，每月新增被动收入 ¥${card.monthlyIncome}`, 'income');
                    if (card.liability) {
                        UI.addMessage(`新增贷款: ${card.liability.name}，月供 ¥${card.liability.monthly}`, 'expense');
                    }
                    UI.updateFinancePanel(this.player);
                    this.finishTurn();
                }
            },
            {
                label: '放弃',
                class: 'btn-secondary',
                handler: () => {
                    UI.addMessage(`放弃了投资 ${card.asset.name} 的机会`, 'warning');
                    this.finishTurn();
                }
            }
        ];

        UI.showCard('opportunity', card, actions);
    }

    /** 处理额外支出 */
    handleExpense(card) {
        if (card.optional) {
            // 可选择的消费
            const actions = [
                {
                    label: `购买 (-¥${card.amount.toLocaleString()})`,
                    class: 'btn-danger',
                    disabled: this.player.cash < card.amount,
                    handler: () => {
                        this.player.payExpense(card.amount);
                        UI.addMessage(`消费: ${card.title} -¥${card.amount.toLocaleString()}`, 'expense');
                        if (card.addExpense) {
                            this.player.addRecurringExpense(card.addExpense, card.addLiability);
                            UI.addMessage(`新增月支出: ${card.addExpense.name} -¥${card.addExpense.amount}/月`, 'expense');
                        }
                        UI.updateFinancePanel(this.player);
                        if (this.player.isBankrupt()) {
                            UI.showGameOver(false, this.player);
                        } else {
                            this.finishTurn();
                        }
                    }
                },
                {
                    label: '拒绝',
                    class: 'btn-success',
                    handler: () => {
                        UI.addMessage(`明智地拒绝了 ${card.title} 的诱惑`, 'income');
                        this.finishTurn();
                    }
                }
            ];
            UI.showCard('expense', card, actions);
        } else {
            // 强制支出
            UI.showCard('expense', card, [
                {
                    label: `支付 -¥${card.amount.toLocaleString()}`,
                    class: 'btn-danger',
                    handler: () => {
                        this.player.payExpense(card.amount);
                        UI.addMessage(`意外支出: ${card.title} -¥${card.amount.toLocaleString()}`, 'expense');
                        UI.updateFinancePanel(this.player);
                        if (this.player.isBankrupt()) {
                            UI.showGameOver(false, this.player);
                        } else {
                            this.finishTurn();
                        }
                    }
                }
            ]);
        }
    }

    /** 处理市场波动 */
    handleMarket(card) {
        UI.showMarketCard(card, this.player, (decision, assetName, sellPrice) => {
            if (card.incomeMultiplier) {
                // 租金变化
                this.player.updateAssetIncomes(card.assetType, card.incomeMultiplier);
                UI.addMessage(`${card.title}！租金收入变化`, 'info');
            } else if (decision === 'sell') {
                this.player.sellAsset(assetName, sellPrice);
                UI.addMessage(`卖出 ${assetName}，获得 ¥${sellPrice.toLocaleString()}`, 'income');
            } else if (decision === 'accept' && card.multiplier < 1) {
                this.player.updateAssetValues(card.assetType, card.multiplier);
                UI.addMessage(`${card.title}！资产价值缩水`, 'warning');
            } else if (decision === 'hold' && card.multiplier > 1) {
                this.player.updateAssetValues(card.assetType, card.multiplier);
                UI.addMessage(`${card.title}！你选择继续持有，资产增值了`, 'info');
            }

            UI.updateFinancePanel(this.player);
            this.finishTurn();
        });
    }

    /** 处理学习卡 */
    handleLearning(card) {
        UI.showLearningCard(card, (correct) => {
            if (correct) {
                this.player.receiveIncome(card.reward);
                UI.addMessage(`答对问题！奖励 +¥${card.reward.toLocaleString()}`, 'income');
            } else {
                UI.addMessage('答错了，但学到了知识！', 'warning');
            }
            UI.updateFinancePanel(this.player);
            this.finishTurn();
        });
    }

    /** 结束回合 */
    finishTurn() {
        this.isProcessing = false;
        UI.setEventArea(`
            <div style="text-align:center">
                <p style="font-size:16px;margin-bottom:8px">第 ${this.player.month} 月</p>
                <p style="color:var(--color-text-dim)">点击下方按钮进入下个月</p>
            </div>
        `);
        document.getElementById('btn-next-month').disabled = false;
    }

    /** 存档 */
    save() {
        const slot = Storage.getNextFreeSlot();
        if (slot) {
            Storage.save(slot, this.player);
            UI.addMessage('游戏已保存', 'info');
        } else {
            // 覆盖最旧的存档
            Storage.save('slot1', this.player);
            UI.addMessage('存档已满，覆盖了最早的存档', 'warning');
        }
    }
}
