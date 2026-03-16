/**
 * UI 渲染与交互
 */
const UI = {
    /** 切换屏幕 */
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    },

    /** 渲染职业选择列表 */
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
                const id = card.dataset.career;
                const career = CAREERS.find(c => c.id === id);
                onSelect(career);
            });
        });
    },

    /** 渲染存档列表 */
    renderSaveSlots(mode, onLoad, onDelete) {
        const container = document.getElementById('save-slots');
        const saves = Storage.getSaveSummaries();

        if (saves.length === 0) {
            container.classList.add('hidden');
            return;
        }

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
                const slotId = btn.closest('.save-slot').dataset.slot;
                onLoad(slotId);
            });
        });

        container.querySelectorAll('.btn-del').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const slotId = btn.closest('.save-slot').dataset.slot;
                onDelete(slotId);
            });
        });
    },

    /** 更新财务报表 */
    updateFinancePanel(player) {
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

        // 资产
        const assetList = document.getElementById('asset-list');
        let assetItems = `<div class="finance-item"><span>现金</span><span>¥${player.cash.toLocaleString()}</span></div>`;
        player.assets.forEach(a => {
            assetItems += `<div class="finance-item"><span>${a.name}</span><span>¥${a.cost.toLocaleString()}</span></div>`;
        });
        assetList.innerHTML = assetItems;
        document.getElementById('total-assets').textContent = player.getTotalAssets().toLocaleString();

        // 负债
        const liabList = document.getElementById('liability-list');
        liabList.innerHTML = player.liabilities.length > 0
            ? player.liabilities.map(l =>
                `<div class="finance-item"><span>${l.name}</span><span>¥${l.total.toLocaleString()}</span></div>`
            ).join('')
            : '<div class="finance-item"><span style="color:var(--color-positive)">无负债</span><span></span></div>';
        document.getElementById('total-liabilities').textContent = player.getTotalLiabilities().toLocaleString();

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
    },

    /** 显示事件卡弹窗 */
    showCard(type, card, actions) {
        const overlay = document.getElementById('modal-overlay');
        const typeInfo = CARD_TYPES[type];

        document.getElementById('card-type-badge').textContent = typeInfo.label;
        document.getElementById('card-type-badge').className = 'card-type-badge ' + typeInfo.badgeClass;
        document.getElementById('card-title').textContent = card.title || card.question || '';
        document.getElementById('card-description').textContent = card.description || '';

        // 详情
        const detailsEl = document.getElementById('card-details');
        detailsEl.innerHTML = '';

        if (type === 'opportunity') {
            detailsEl.innerHTML = `
                <div class="detail-row"><span class="detail-label">总价</span><span class="detail-value">¥${card.cost.toLocaleString()}</span></div>
                <div class="detail-row"><span class="detail-label">首付/全款</span><span class="detail-value">¥${card.downPayment.toLocaleString()}</span></div>
                <div class="detail-row"><span class="detail-label">月收入</span><span class="detail-value" style="color:var(--color-income)">+¥${card.monthlyIncome.toLocaleString()}</span></div>
                ${card.liability ? `<div class="detail-row"><span class="detail-label">月供</span><span class="detail-value" style="color:var(--color-expense)">-¥${card.liability.monthly.toLocaleString()}</span></div>
                <div class="detail-row"><span class="detail-label">净现金流</span><span class="detail-value" style="color:${card.monthlyIncome - (card.liability ? card.liability.monthly : 0) >= 0 ? 'var(--color-income)' : 'var(--color-expense)'}">¥${(card.monthlyIncome - (card.liability ? card.liability.monthly : 0)).toLocaleString()}/月</span></div>` : ''}
            `;
        } else if (type === 'expense') {
            detailsEl.innerHTML = `
                <div class="detail-row"><span class="detail-label">金额</span><span class="detail-value" style="color:var(--color-expense)">-¥${card.amount.toLocaleString()}</span></div>
                ${card.addExpense ? `<div class="detail-row"><span class="detail-label">每月新增支出</span><span class="detail-value" style="color:var(--color-expense)">-¥${card.addExpense.amount.toLocaleString()}/月</span></div>` : ''}
            `;
        } else if (type === 'market') {
            const direction = card.multiplier > 1 ? '上涨' : (card.multiplier < 1 ? '下跌' : '变化');
            const pct = card.multiplier ? Math.round(Math.abs(card.multiplier - 1) * 100) : 0;
            if (card.multiplier) {
                detailsEl.innerHTML = `
                    <div class="detail-row"><span class="detail-label">影响资产类型</span><span class="detail-value">${card.assetType === 'realestate' ? '房产' : card.assetType === 'stock' ? '股票' : '生意'}</span></div>
                    <div class="detail-row"><span class="detail-label">价值变化</span><span class="detail-value" style="color:${card.multiplier > 1 ? 'var(--color-income)' : 'var(--color-expense)'}">${direction} ${pct}%</span></div>
                `;
            }
            if (card.incomeMultiplier) {
                const iPct = Math.round(Math.abs(card.incomeMultiplier - 1) * 100);
                detailsEl.innerHTML = `
                    <div class="detail-row"><span class="detail-label">影响资产类型</span><span class="detail-value">房产</span></div>
                    <div class="detail-row"><span class="detail-label">租金变化</span><span class="detail-value" style="color:var(--color-income)">上涨 ${iPct}%</span></div>
                `;
            }
        } else if (type === 'learning') {
            detailsEl.innerHTML = `
                <div class="detail-row"><span class="detail-label">答对奖励</span><span class="detail-value" style="color:var(--color-gold)">¥${card.reward.toLocaleString()}</span></div>
            `;
        }

        // 提示
        document.getElementById('card-tip').textContent = card.tip || '';

        // 动作按钮
        const actionsEl = document.getElementById('card-actions');
        actionsEl.innerHTML = '';
        actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = 'btn ' + (action.class || 'btn-secondary');
            btn.textContent = action.label;
            if (action.disabled) btn.disabled = true;
            btn.addEventListener('click', () => {
                overlay.classList.add('hidden');
                action.handler();
            });
            actionsEl.appendChild(btn);
        });

        overlay.classList.remove('hidden');
    },

    /** 显示学习卡（问答） */
    showLearningCard(card, onAnswer) {
        const overlay = document.getElementById('modal-overlay');
        const typeInfo = CARD_TYPES.learning;

        document.getElementById('card-type-badge').textContent = typeInfo.label;
        document.getElementById('card-type-badge').className = 'card-type-badge ' + typeInfo.badgeClass;
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
                // 显示结果
                const correct = idx === card.answer;
                document.getElementById('card-title').textContent = correct ? '回答正确！' : '回答错误';
                document.getElementById('card-description').textContent = card.explanation;
                document.getElementById('card-tip').textContent = correct
                    ? `恭喜！获得 ¥${card.reward.toLocaleString()} 奖励`
                    : '没关系，学到知识比金钱更重要！';

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

    /** 显示市场卡（带卖出选项） */
    showMarketCard(card, player, onDecide) {
        const affectedAssets = player.assets.filter(a => a.type === card.assetType);

        if (card.incomeMultiplier) {
            // 租金变化类：直接应用
            this.showCard('market', card, [
                { label: '知道了', class: 'btn-primary', handler: () => onDecide('accept') }
            ]);
            return;
        }

        if (card.multiplier < 1) {
            // 贬值类：直接应用
            this.showCard('market', card, [
                { label: '知道了', class: 'btn-primary', handler: () => onDecide('accept') }
            ]);
            return;
        }

        // 增值类：可以选择卖出
        if (affectedAssets.length === 0) {
            this.showCard('market', card, [
                { label: '知道了', class: 'btn-primary', handler: () => onDecide('hold') }
            ]);
            return;
        }

        const actions = [
            { label: '继续持有', class: 'btn-secondary', handler: () => onDecide('hold') }
        ];

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

    /** 添加消息日志 */
    addMessage(text, type) {
        const list = document.getElementById('message-list');
        const item = document.createElement('div');
        item.className = 'message-item msg-' + (type || 'info');
        item.textContent = `[第${window.game ? window.game.player.month : '?'}月] ${text}`;
        list.insertBefore(item, list.firstChild);
        // 限制消息数量
        while (list.children.length > 50) {
            list.removeChild(list.lastChild);
        }
    },

    /** 清空消息 */
    clearMessages() {
        document.getElementById('message-list').innerHTML = '';
    },

    /** 设置事件区域内容 */
    setEventArea(html) {
        document.getElementById('event-area').innerHTML = html;
    },

    /** 显示游戏结束 */
    showGameOver(win, player) {
        const overlay = document.getElementById('modal-gameover');
        document.getElementById('gameover-title').textContent = win ? '恭喜！财务自由！' : '很遗憾，你破产了';
        document.getElementById('gameover-title').style.color = win ? 'var(--color-gold)' : 'var(--color-negative)';
        document.getElementById('gameover-message').textContent = win
            ? '你成功让被动收入超过了总支出，逃出了老鼠赛跑圈！你已经理解了富爸爸的核心教诲。'
            : '你的现金耗尽了。记住：管理好现金流是理财的第一步。不要让支出失控！';

        document.getElementById('gameover-stats').innerHTML = `
            <div class="stat-item"><div class="stat-label">总月数</div><div class="stat-value">${player.month}</div></div>
            <div class="stat-item"><div class="stat-label">最终现金</div><div class="stat-value">¥${player.cash.toLocaleString()}</div></div>
            <div class="stat-item"><div class="stat-label">被动收入</div><div class="stat-value">¥${player.getPassiveIncome().toLocaleString()}/月</div></div>
            <div class="stat-item"><div class="stat-label">总资产</div><div class="stat-value">¥${player.getTotalAssets().toLocaleString()}</div></div>
        `;

        overlay.classList.remove('hidden');
    },

    /** 隐藏游戏结束弹窗 */
    hideGameOver() {
        document.getElementById('modal-gameover').classList.add('hidden');
    }
};
