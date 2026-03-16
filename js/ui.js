/**
 * UI 渲染与交互 V2
 * 新增: toast、年度回顾、确认弹窗、卖出/还贷按钮、统计页、成就页、结算报告
 */
const UI = {
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    },

    // === Toast通知 ===
    showToast(message, duration) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('toast-show'), 10);
        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => toast.remove(), 300);
        }, duration || 3000);
    },

    // === 职业选择 ===
    renderCareerList(onSelect) {
        const list = document.getElementById('career-list');
        list.innerHTML = CAREERS.map(career => `
            <div class="career-card" data-career="${career.id}">
                <span class="career-icon">${career.icon}</span>
                <h3>${career.name}</h3>
                <div class="career-salary">月薪 ¥${career.salary.toLocaleString()}</div>
                <div class="career-detail">
                    初始现金: ¥${career.cash.toLocaleString()}<br>
                    月支出: ¥${career.expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}<br>
                    初始负债: ¥${career.liabilities.reduce((s, l) => s + l.total, 0).toLocaleString()}
                </div>
                <div class="career-difficulty">难度: ${career.difficulty}</div>
            </div>
        `).join('');
        list.querySelectorAll('.career-card').forEach(card => {
            card.addEventListener('click', () => {
                const career = CAREERS.find(c => c.id === card.dataset.career);
                onSelect(career);
            });
        });
    },

    // === 存档列表 ===
    renderSaveSlots(mode, onLoad, onDelete) {
        const container = document.getElementById('save-slots');
        const saves = Storage.getSaveSummaries();
        if (saves.length === 0) { container.classList.add('hidden'); return; }

        container.classList.remove('hidden');
        container.innerHTML = '<h3 style="margin-bottom:12px;font-size:16px;">存档列表</h3>' +
            saves.map(s => {
                const date = new Date(s.savedAt).toLocaleString('zh-CN');
                return `
                <div class="save-slot" data-slot="${s.slotId}">
                    <div class="save-slot-info">
                        <h4>${s.career} - 第${s.month}月</h4>
                        <p>现金流: ¥${s.cashflow.toLocaleString()} | 进度: ${s.progress}% | ${date}</p>
                    </div>
                    <div class="save-slot-actions">
                        <button class="btn btn-small btn-load">加载</button>
                        <button class="btn btn-small btn-del" style="color:var(--color-negative)">删除</button>
                    </div>
                </div>`;
            }).join('');

        container.querySelectorAll('.btn-load').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                onLoad(btn.closest('.save-slot').dataset.slot);
            });
        });
        container.querySelectorAll('.btn-del').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                onDelete(btn.closest('.save-slot').dataset.slot);
            });
        });
    },

    // === 财务报表（含卖出/还贷按钮） ===
    updateFinancePanel(player, maxMonths) {
        // 收入
        const incomeList = document.getElementById('income-list');
        let incomeItems = `<div class="finance-item"><span>工资</span><span>¥${player.salary.toLocaleString()}</span></div>`;
        player.passiveIncomes.forEach(p => {
            incomeItems += `<div class="finance-item"><span>${p.name}</span><span>¥${p.amount.toLocaleString()}</span></div>`;
        });
        incomeList.innerHTML = incomeItems;
        document.getElementById('total-income').textContent = player.getTotalIncome().toLocaleString();

        // 支出
        const expenseList = document.getElementById('expense-list');
        expenseList.innerHTML = player.expenses.map(e =>
            `<div class="finance-item"><span>${e.name}</span><span>¥${e.amount.toLocaleString()}</span></div>`
        ).join('');
        document.getElementById('total-expense').textContent = player.getTotalExpense().toLocaleString();

        // 月现金流
        const cashflow = player.getMonthlyCashflow();
        const cfEl = document.getElementById('monthly-cashflow');
        cfEl.textContent = `¥${cashflow.toLocaleString()}`;
        cfEl.className = 'cashflow-value ' + (cashflow >= 0 ? 'cashflow-positive' : 'cashflow-negative');

        // 资产（含卖出按钮）
        const assetList = document.getElementById('asset-list');
        let assetItems = `<div class="finance-item"><span>现金</span><span>¥${player.cash.toLocaleString()}</span></div>`;
        player.assets.forEach((a, i) => {
            assetItems += `<div class="finance-item finance-item-action">
                <span>${a.name}</span>
                <span>
                    ¥${a.cost.toLocaleString()}
                    <button class="btn-inline btn-sell" data-index="${i}" title="卖出">卖</button>
                </span>
            </div>`;
        });
        assetList.innerHTML = assetItems;
        document.getElementById('total-assets').textContent = player.getTotalAssets().toLocaleString();

        // 资产卖出按钮事件
        assetList.querySelectorAll('.btn-sell').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.game) window.game.sellAssetManually(parseInt(btn.dataset.index));
            });
        });

        // 负债（含还贷按钮）
        const liabList = document.getElementById('liability-list');
        if (player.liabilities.length > 0) {
            liabList.innerHTML = player.liabilities.map((l, i) =>
                `<div class="finance-item finance-item-action">
                    <span>${l.name}</span>
                    <span>
                        ¥${l.total.toLocaleString()}
                        <button class="btn-inline btn-repay" data-index="${i}" title="提前还款">还</button>
                    </span>
                </div>`
            ).join('');
        } else {
            liabList.innerHTML = '<div class="finance-item"><span style="color:var(--color-positive)">无负债</span><span></span></div>';
        }
        document.getElementById('total-liabilities').textContent = player.getTotalLiabilities().toLocaleString();

        // 负债还贷按钮事件
        liabList.querySelectorAll('.btn-repay').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.game) window.game.payOffLiabilityManually(parseInt(btn.dataset.index));
            });
        });

        // 进度
        const progress = player.getFreedomProgress();
        document.getElementById('freedom-percent').textContent = progress + '%';
        document.getElementById('freedom-bar').style.width = progress + '%';
        document.getElementById('passive-income').textContent = player.getPassiveIncome().toLocaleString();
        document.getElementById('target-expense').textContent = player.getTotalExpense().toLocaleString();

        // 头部
        document.getElementById('current-month').textContent = player.month;
        document.getElementById('player-career').textContent = player.careerName;
        document.getElementById('player-cash').textContent = player.cash.toLocaleString();

        // 倒计时
        const countdownEl = document.getElementById('month-countdown');
        if (countdownEl && maxMonths) {
            const remaining = maxMonths - player.month + 1;
            countdownEl.textContent = `剩余${remaining}月`;
            countdownEl.className = 'countdown-display' + (remaining <= 10 ? ' countdown-urgent' : '');
        }
    },

    // === 事件卡弹窗 ===
    showCard(type, card, actions, extraNote) {
        const overlay = document.getElementById('modal-overlay');
        const typeInfo = CARD_TYPES[type];

        document.getElementById('card-type-badge').textContent = typeInfo.label;
        document.getElementById('card-type-badge').className = 'card-type-badge ' + typeInfo.badgeClass;
        document.getElementById('card-title').textContent = card.title || card.question || '';
        document.getElementById('card-description').textContent = card.description || '';

        const detailsEl = document.getElementById('card-details');
        detailsEl.innerHTML = '';

        if (type === 'opportunity') {
            let html = `
                <div class="detail-row"><span class="detail-label">总价</span><span class="detail-value">¥${card.cost.toLocaleString()}</span></div>
                <div class="detail-row"><span class="detail-label">首付/全款</span><span class="detail-value">¥${card.downPayment.toLocaleString()}</span></div>
                <div class="detail-row"><span class="detail-label">月收入</span><span class="detail-value" style="color:var(--color-income)">+¥${card.monthlyIncome.toLocaleString()}</span></div>`;
            if (card.liability) {
                const net = card.monthlyIncome - card.liability.monthly;
                html += `<div class="detail-row"><span class="detail-label">月供</span><span class="detail-value" style="color:var(--color-expense)">-¥${card.liability.monthly.toLocaleString()}</span></div>
                <div class="detail-row"><span class="detail-label">净现金流</span><span class="detail-value" style="color:${net >= 0 ? 'var(--color-income)' : 'var(--color-expense)'}">¥${net.toLocaleString()}/月</span></div>`;
            }
            detailsEl.innerHTML = html;
        } else if (type === 'expense' || type === 'chain') {
            if (card.amount) {
                detailsEl.innerHTML = `<div class="detail-row"><span class="detail-label">金额</span><span class="detail-value" style="color:var(--color-expense)">-¥${card.amount.toLocaleString()}</span></div>`;
            }
            if (card.addExpense) {
                detailsEl.innerHTML += `<div class="detail-row"><span class="detail-label">每月新增支出</span><span class="detail-value" style="color:var(--color-expense)">-¥${card.addExpense.amount.toLocaleString()}/月</span></div>`;
            }
            if (card.cashGain) {
                detailsEl.innerHTML = `<div class="detail-row"><span class="detail-label">获得现金</span><span class="detail-value" style="color:var(--color-income)">+¥${card.cashGain.toLocaleString()}</span></div>
                <div class="detail-row"><span class="detail-label">每月新增支出</span><span class="detail-value" style="color:var(--color-expense)">-¥${card.addExpense.amount.toLocaleString()}/月</span></div>
                <div class="detail-row"><span class="detail-label">总共还款</span><span class="detail-value" style="color:var(--color-expense)">¥${card.addLiability.total.toLocaleString()}</span></div>`;
            }
            if (card.addExpenseOnly) {
                detailsEl.innerHTML = `<div class="detail-row"><span class="detail-label">月支出增加</span><span class="detail-value" style="color:var(--color-expense)">+¥${card.addExpenseOnly.amount.toLocaleString()}/月</span></div>`;
            }
            if (card.cost && type === 'chain') {
                detailsEl.innerHTML += `<div class="detail-row"><span class="detail-label">投入成本</span><span class="detail-value">¥${card.cost.toLocaleString()}</span></div>`;
            }
        } else if (type === 'market') {
            if (card.multiplier) {
                const dir = card.multiplier > 1 ? '上涨' : '下跌';
                const pct = Math.round(Math.abs(card.multiplier - 1) * 100);
                const assetLabel = { realestate: '房产', stock: '股票', business: '生意', fund: '基金' };
                detailsEl.innerHTML = `
                    <div class="detail-row"><span class="detail-label">影响资产</span><span class="detail-value">${assetLabel[card.assetType] || '所有'}</span></div>
                    <div class="detail-row"><span class="detail-label">价值变化</span><span class="detail-value" style="color:${card.multiplier > 1 ? 'var(--color-income)' : 'var(--color-expense)'}">${dir} ${pct}%</span></div>`;
            }
            if (card.incomeMultiplier) {
                const dir = card.incomeMultiplier > 1 ? '上涨' : '下降';
                const pct = Math.round(Math.abs(card.incomeMultiplier - 1) * 100);
                const assetLabel = { realestate: '房产', fund: '基金', business: '生意' };
                detailsEl.innerHTML = `
                    <div class="detail-row"><span class="detail-label">影响资产</span><span class="detail-value">${assetLabel[card.assetType] || ''}</span></div>
                    <div class="detail-row"><span class="detail-label">收入变化</span><span class="detail-value" style="color:${card.incomeMultiplier > 1 ? 'var(--color-income)' : 'var(--color-expense)'}">${dir} ${pct}%</span></div>`;
            }
            if (card.rateChange !== undefined) {
                const dir = card.rateChange > 0 ? '上调' : '下调';
                detailsEl.innerHTML = `
                    <div class="detail-row"><span class="detail-label">利率变化</span><span class="detail-value" style="color:${card.rateChange > 0 ? 'var(--color-expense)' : 'var(--color-income)'}">${dir} ${Math.abs(Math.round(card.rateChange * 100))}%</span></div>
                    <div class="detail-row"><span class="detail-label">影响</span><span class="detail-value">所有浮动利率贷款</span></div>`;
            }
            if (card.globalMultiplier) {
                const pct = Math.round((card.globalMultiplier - 1) * 100);
                detailsEl.innerHTML = `
                    <div class="detail-row"><span class="detail-label">影响</span><span class="detail-value">所有投资类资产</span></div>
                    <div class="detail-row"><span class="detail-label">价值变化</span><span class="detail-value" style="color:var(--color-income)">上涨 ${pct}%</span></div>`;
            }
        } else if (type === 'learning') {
            detailsEl.innerHTML = `<div class="detail-row"><span class="detail-label">答对奖励</span><span class="detail-value" style="color:var(--color-gold)">¥${card.reward.toLocaleString()}</span></div>`;
        }

        if (extraNote) {
            detailsEl.innerHTML += `<div class="detail-row"><span class="detail-label" style="color:var(--color-primary)">${extraNote}</span></div>`;
        }

        document.getElementById('card-tip').textContent = card.tip || '';

        const actionsEl = document.getElementById('card-actions');
        actionsEl.innerHTML = '';
        actionsEl.style.flexDirection = 'row';
        actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = 'btn ' + (action.class || 'btn-secondary');
            btn.textContent = action.label;
            if (action.disabled) btn.disabled = true;
            btn.addEventListener('click', () => {
                btn.disabled = true; // 防重复点击
                overlay.classList.add('hidden');
                action.handler();
            });
            actionsEl.appendChild(btn);
        });

        overlay.classList.remove('hidden');
    },

    // === 学习卡问答 ===
    showLearningCard(card, onAnswer) {
        const overlay = document.getElementById('modal-overlay');
        document.getElementById('card-type-badge').textContent = CARD_TYPES.learning.label;
        document.getElementById('card-type-badge').className = 'card-type-badge badge-learning';
        document.getElementById('card-title').textContent = card.question;
        document.getElementById('card-description').textContent = '';
        document.getElementById('card-details').innerHTML =
            `<div class="detail-row"><span class="detail-label">答对奖励</span><span class="detail-value" style="color:var(--color-gold)">¥${card.reward.toLocaleString()}</span></div>`;
        document.getElementById('card-tip').textContent = '';

        const actionsEl = document.getElementById('card-actions');
        actionsEl.innerHTML = '';
        actionsEl.style.flexDirection = 'column';

        card.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-secondary';
            btn.textContent = opt;
            btn.addEventListener('click', () => {
                const correct = idx === card.answer;
                document.getElementById('card-title').textContent = correct ? '回答正确！' : '回答错误';
                document.getElementById('card-description').textContent = card.explanation;
                document.getElementById('card-tip').textContent = correct
                    ? `恭喜！获得 ¥${card.reward.toLocaleString()} 奖励` : '没关系，学到知识比金钱更重要！';
                actionsEl.innerHTML = '';
                actionsEl.style.flexDirection = 'row';
                const closeBtn = document.createElement('button');
                closeBtn.className = 'btn ' + (correct ? 'btn-success' : 'btn-primary');
                closeBtn.textContent = '继续';
                closeBtn.addEventListener('click', () => {
                    overlay.classList.add('hidden');
                    onAnswer(correct);
                });
                actionsEl.appendChild(closeBtn);
            });
            actionsEl.appendChild(btn);
        });
        overlay.classList.remove('hidden');
    },

    // === 市场卡 ===
    showMarketCard(card, player, onDecide) {
        const affectedAssets = player.assets.filter(a => a.type === card.assetType);

        if (card.incomeMultiplier || (card.multiplier && card.multiplier < 1)) {
            this.showCard('market', card, [
                { label: '知道了', class: 'btn-primary', handler: () => onDecide('accept') }
            ]);
            return;
        }

        if (affectedAssets.length === 0) {
            this.showCard('market', card, [
                { label: '知道了', class: 'btn-primary', handler: () => onDecide('hold') }
            ]);
            return;
        }

        const actions = [{ label: '继续持有', class: 'btn-secondary', handler: () => onDecide('hold') }];
        affectedAssets.forEach(asset => {
            const sellPrice = Math.round(asset.cost * card.multiplier);
            actions.push({
                label: `卖出${asset.name} (¥${sellPrice.toLocaleString()})`,
                class: 'btn-success',
                handler: () => onDecide('sell', asset.name, sellPrice)
            });
        });
        this.showCard('market', card, actions);
    },

    // === 确认弹窗 ===
    showConfirmModal(title, message, details, onConfirm) {
        const overlay = document.getElementById('modal-overlay');
        document.getElementById('card-type-badge').textContent = '确认操作';
        document.getElementById('card-type-badge').className = 'card-type-badge badge-market';
        document.getElementById('card-title').textContent = title;
        document.getElementById('card-description').textContent = message;

        const detailsEl = document.getElementById('card-details');
        detailsEl.innerHTML = details.map(d =>
            `<div class="detail-row"><span class="detail-label">${d.label}</span><span class="detail-value" style="${d.highlight ? 'color:var(--color-income)' : ''}">${d.value}</span></div>`
        ).join('');

        document.getElementById('card-tip').textContent = '';

        const actionsEl = document.getElementById('card-actions');
        actionsEl.innerHTML = '';
        actionsEl.style.flexDirection = 'row';

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'btn btn-success';
        confirmBtn.textContent = '确认';
        confirmBtn.addEventListener('click', () => {
            confirmBtn.disabled = true;
            overlay.classList.add('hidden');
            onConfirm();
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.textContent = '取消';
        cancelBtn.addEventListener('click', () => overlay.classList.add('hidden'));

        actionsEl.appendChild(confirmBtn);
        actionsEl.appendChild(cancelBtn);
        overlay.classList.remove('hidden');
    },

    // === 年度回顾弹窗 ===
    showAnnualReview(data, onClose) {
        const overlay = document.getElementById('modal-overlay');
        document.getElementById('card-type-badge').textContent = `第${data.year}年总结`;
        document.getElementById('card-type-badge').className = 'card-type-badge badge-learning';
        document.getElementById('card-title').textContent = `年度评级: ${data.grade}`;
        document.getElementById('card-description').textContent = data.gradeMsg;

        const sign = (v) => v >= 0 ? '+' : '';
        document.getElementById('card-details').innerHTML = `
            <div class="detail-row"><span class="detail-label">月现金流</span><span class="detail-value">¥${data.cashflow.toLocaleString()} (${sign(data.cashflowChange)}${data.cashflowChange.toLocaleString()})</span></div>
            <div class="detail-row"><span class="detail-label">被动收入</span><span class="detail-value" style="color:var(--color-income)">¥${data.passiveIncome.toLocaleString()} (${sign(data.passiveChange)}${data.passiveChange.toLocaleString()})</span></div>
            <div class="detail-row"><span class="detail-label">净资产变化</span><span class="detail-value" style="color:${data.netWorthChange >= 0 ? 'var(--color-income)' : 'var(--color-expense)'}"> ${sign(data.netWorthChange)}¥${Math.abs(data.netWorthChange).toLocaleString()}</span></div>
            <div class="detail-row"><span class="detail-label">财务自由进度</span><span class="detail-value" style="color:var(--color-gold)">${data.progress}%</span></div>
        `;
        document.getElementById('card-tip').textContent = '通货膨胀正在侵蚀你的购买力。只有让资产增长速度超过通胀，才能真正变富。';

        const actionsEl = document.getElementById('card-actions');
        actionsEl.innerHTML = '';
        actionsEl.style.flexDirection = 'row';
        const btn = document.createElement('button');
        btn.className = 'btn btn-primary';
        btn.textContent = '继续前进';
        btn.addEventListener('click', () => { overlay.classList.add('hidden'); onClose(); });
        actionsEl.appendChild(btn);
        overlay.classList.remove('hidden');
    },

    // === 消息日志 ===
    addMessage(text, type) {
        const list = document.getElementById('message-list');
        const item = document.createElement('div');
        item.className = 'message-item msg-' + (type || 'info');
        item.textContent = `[第${window.game ? window.game.player.month : '?'}月] ${text}`;
        list.insertBefore(item, list.firstChild);
        while (list.children.length > 50) list.removeChild(list.lastChild);
    },

    clearMessages() {
        document.getElementById('message-list').innerHTML = '';
    },

    setEventArea(html) {
        document.getElementById('event-area').innerHTML = html;
    },

    // === 游戏结束（含分析报告） ===
    showGameOver(won, player, title, message, stats) {
        const overlay = document.getElementById('modal-gameover');
        document.getElementById('gameover-title').textContent = title;
        document.getElementById('gameover-title').style.color = won ? 'var(--color-gold)' : 'var(--color-negative)';
        document.getElementById('gameover-message').textContent = message;

        // 统计数据
        let statsHtml = `
            <div class="stat-item"><div class="stat-label">总月数</div><div class="stat-value">${player.month}</div></div>
            <div class="stat-item"><div class="stat-label">最终现金</div><div class="stat-value">¥${player.cash.toLocaleString()}</div></div>
            <div class="stat-item"><div class="stat-label">被动收入</div><div class="stat-value" style="color:var(--color-income)">¥${player.getPassiveIncome().toLocaleString()}/月</div></div>
            <div class="stat-item"><div class="stat-label">净资产</div><div class="stat-value">¥${player.getNetWorth().toLocaleString()}</div></div>
        `;

        // 决策分析
        const topDecisions = player.getTopDecisions(3);
        let analysisHtml = '';
        if (topDecisions.best.length > 0) {
            analysisHtml += '<div class="report-section"><h4 style="color:var(--color-income)">最佳决策</h4>';
            topDecisions.best.forEach(d => {
                if (d.cashflowImpact > 0) {
                    analysisHtml += `<div class="report-item">第${d.month}月 买入${d.name}，月现金流 +¥${d.cashflowImpact}</div>`;
                }
            });
            analysisHtml += '</div>';
        }
        if (topDecisions.worst.length > 0 && topDecisions.worst.some(d => d.cashflowImpact < 0)) {
            analysisHtml += '<div class="report-section"><h4 style="color:var(--color-expense)">需改进的决策</h4>';
            topDecisions.worst.forEach(d => {
                if (d.cashflowImpact < 0) {
                    analysisHtml += `<div class="report-item">第${d.month}月 买入${d.name}，月现金流 ${d.cashflowImpact}</div>`;
                }
            });
            analysisHtml += '</div>';
        }

        // 学习统计
        if (player.quizTotal > 0) {
            const pct = Math.round((player.quizCorrect / player.quizTotal) * 100);
            analysisHtml += `<div class="report-section"><h4 style="color:var(--color-gold)">财商测试</h4>
                <div class="report-item">答对 ${player.quizCorrect}/${player.quizTotal} (${pct}%)</div></div>`;
        }

        // 综合评语
        let grade, gradeMsg;
        if (won && player.month <= 20) { grade = 'S'; gradeMsg = '投资天才！你用最短时间实现了财务自由。'; }
        else if (won && player.month <= 30) { grade = 'A'; gradeMsg = '非常出色！你对资产和负债有深刻的理解。'; }
        else if (won && player.month <= 45) { grade = 'B'; gradeMsg = '做得不错！你已经掌握了理财的核心要义。'; }
        else if (won) { grade = 'C'; gradeMsg = '恭喜通关！但还有提升空间，试试更快达成目标。'; }
        else { grade = 'D'; gradeMsg = '别灰心！每次失败都是学习的机会。调整策略再来一次！'; }

        analysisHtml += `<div class="report-grade">
            <div class="grade-letter" style="color:${won ? 'var(--color-gold)' : 'var(--color-text-dim)'}">${grade}</div>
            <div class="grade-msg">${gradeMsg}</div>
        </div>`;

        document.getElementById('gameover-stats').innerHTML = statsHtml;
        document.getElementById('gameover-analysis').innerHTML = analysisHtml;

        overlay.classList.remove('hidden');
    },

    hideGameOver() {
        document.getElementById('modal-gameover').classList.add('hidden');
    },

    // === 统计页 ===
    renderStatsScreen() {
        const stats = Storage.getStats();
        const container = document.getElementById('stats-content');
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item"><div class="stat-label">总游玩次数</div><div class="stat-value">${stats.totalGames}</div></div>
                <div class="stat-item"><div class="stat-label">通关次数</div><div class="stat-value" style="color:var(--color-income)">${stats.totalWins}</div></div>
                <div class="stat-item"><div class="stat-label">最快通关</div><div class="stat-value" style="color:var(--color-gold)">${stats.fastestWin ? `${stats.fastestWin.months}月 (${stats.fastestWin.career})` : '暂无'}</div></div>
                <div class="stat-item"><div class="stat-label">累计游玩月数</div><div class="stat-value">${stats.totalMonths}</div></div>
                <div class="stat-item"><div class="stat-label">最高被动收入</div><div class="stat-value" style="color:var(--color-income)">¥${stats.bestPassiveIncome.toLocaleString()}/月</div></div>
                <div class="stat-item"><div class="stat-label">答题正确率</div><div class="stat-value">${stats.totalQuizTotal > 0 ? Math.round(stats.totalQuizCorrect / stats.totalQuizTotal * 100) + '%' : '暂无'}</div></div>
            </div>
        `;
    },

    // === 成就页 ===
    renderAchievementsScreen() {
        const unlocked = Storage.getUnlockedAchievements();
        const container = document.getElementById('achievements-content');
        container.innerHTML = ACHIEVEMENTS.map(a => {
            const isUnlocked = unlocked.includes(a.id);
            return `<div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                <span class="achievement-icon">${isUnlocked ? a.icon : '🔒'}</span>
                <div class="achievement-info">
                    <div class="achievement-name">${a.name}</div>
                    <div class="achievement-desc">${a.desc}</div>
                </div>
            </div>`;
        }).join('');
    }
};
