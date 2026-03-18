/**
 * UI 渲染与交互 V3
 * 新增: 现金流模式图、先付自己面板、满意度显示、象限指示器、协同加成、
 *       财商等级、资产保护、税务分析、复利追踪、破产重启、FOMO/社交弹窗
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
        const traitLabels = {
            frugal: '节俭：可选消费减半',
            learner: '学者：学习奖励翻倍',
            techie: '技术：科技投资+20%',
            connected: '人脉：社交带来投资机会',
            hustler: '副业达人：兼职收入翻倍'
        };
        const list = document.getElementById('career-list');
        list.innerHTML = CAREERS.map(career => `
            <div class="career-card" data-career="${career.id}">
                <span class="career-icon">${career.icon}</span>
                <h3>${career.name}</h3>
                <div class="career-salary">月薪 ¥${career.salary.toLocaleString()}</div>
                <div class="career-detail">
                    初始现金: ¥${career.cash.toLocaleString()}<br>
                    月支出: ¥${career.expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}<br>
                    初始负债: ¥${career.liabilities.reduce((s, l) => s + l.total, 0).toLocaleString()}<br>
                    贷款上限: ¥${(career.maxLoanAmount || 100000).toLocaleString()}
                </div>
                <div style="font-size:12px;color:var(--color-gold);margin-top:8px">${traitLabels[career.specialTrait] || ''}</div>
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

    // === 财务报表（V4: 含现金流图、协同加成、累计收益、税务、社交资本） ===
    updateFinancePanel(player, maxMonths) {
        this.maxMonths = maxMonths;
        // === 现金流模式图 ===
        this.renderCashflowDiagram(player);

        // === 收入（含税后显示） ===
        const incomeList = document.getElementById('income-list');
        const salaryLabel = { E: '工资', S: '自雇收入', B: '系统收入', I: '投资收入' };
        const grossSalary = player.salary;
        const salaryTax = Player.calculateSalaryTax(grossSalary);
        const netSalary = grossSalary - salaryTax;
        const salaryTaxPct = grossSalary > 0 ? Math.round(salaryTax / grossSalary * 100) : 0;
        let incomeItems = `<div class="finance-item">
            <span>${salaryLabel[player.quadrant] || '工资'}</span>
            <span>¥${grossSalary.toLocaleString()}</span>
        </div>
        <div class="finance-item finance-tax-line">
            <span>└ 个税(-${salaryTaxPct}%)</span>
            <span style="color:var(--color-text-dim)">-¥${salaryTax.toLocaleString()}</span>
        </div>`;

        player.passiveIncomes.forEach(p => {
            const tax = Math.round(p.amount * Player.TAX_RATES.passive);
            incomeItems += `<div class="finance-item"><span>${p.name}</span><span>¥${p.amount.toLocaleString()}</span></div>`;
            incomeItems += `<div class="finance-item finance-tax-line"><span>└ 税(-${Math.round(Player.TAX_RATES.passive * 100)}%)</span><span style="color:var(--color-text-dim)">-¥${tax.toLocaleString()}</span></div>`;
        });

        // V5: 协同加成详情展示
        const activeSynergies = player.getActiveSynergies();
        const synergyBonus = player.calculateSynergyBonus();
        if (synergyBonus > 0) {
            incomeItems += `<div class="finance-item synergy-line"><span>协同加成</span><span style="color:var(--color-gold)">+¥${synergyBonus.toLocaleString()}</span></div>`;
            activeSynergies.forEach(syn => {
                incomeItems += `<div class="finance-item finance-sub-line"><span>└ ${syn.name}(+${Math.round(syn.bonusRate * 100)}%)</span><span style="color:var(--color-gold)">${syn.desc}</span></div>`;
            });
        }

        incomeList.innerHTML = incomeItems;
        document.getElementById('total-income').textContent = player.getTotalIncome().toLocaleString();

        // === 支出 ===
        const expenseList = document.getElementById('expense-list');
        expenseList.innerHTML = player.expenses.map(e =>
            `<div class="finance-item"><span>${e.name}</span><span>¥${e.amount.toLocaleString()}</span></div>`
        ).join('');
        document.getElementById('total-expense').textContent = player.getTotalExpense().toLocaleString();

        // === 月现金流 ===
        const cashflow = player.getMonthlyCashflow();
        const cfEl = document.getElementById('monthly-cashflow');
        cfEl.textContent = `¥${cashflow.toLocaleString()}`;
        cfEl.className = 'cashflow-value ' + (cashflow >= 0 ? 'cashflow-positive' : 'cashflow-negative');

        // V7: 现金流变化闪烁动画
        const cfSummary = cfEl.closest('.cashflow-summary');
        if (cfSummary) {
            cfSummary.classList.remove('income-flash');
            void cfSummary.offsetWidth; // force reflow
            cfSummary.classList.add('income-flash');
        }

        // === 资产（V3: 含累计收益和ROI） ===
        const assetList = document.getElementById('asset-list');
        let assetItems = `<div class="finance-item"><span>现金</span><span>¥${player.cash.toLocaleString()}</span></div>`;
        if (player.investReserve > 0) {
            assetItems += `<div class="finance-item"><span>投资准备金</span><span style="color:var(--color-gold)">¥${player.investReserve.toLocaleString()}</span></div>`;
        }
        player.assets.forEach((a, i) => {
            const held = a.purchaseMonth ? player.month - a.purchaseMonth : 0;
            const earned = a.totalEarned || 0;
            const roi = a.purchasePrice && a.purchasePrice > 0 ? Math.round((earned / a.purchasePrice) * 100) : 0;
            assetItems += `<div class="finance-item finance-item-action">
                <span>${a.name}</span>
                <span>
                    ¥${a.cost.toLocaleString()}
                    <button class="btn-inline btn-sell" data-index="${i}" title="卖出">卖</button>
                </span>
            </div>`;
            if (held > 0) {
                assetItems += `<div class="finance-item finance-sub-line">
                    <span>└ 累计收入: ¥${earned.toLocaleString()} (${held}月) ROI: ${roi}%</span>
                    <span></span>
                </div>`;
            }
        });
        assetList.innerHTML = assetItems;
        document.getElementById('total-assets').textContent = player.getTotalAssets().toLocaleString();

        // 资产卖出按钮
        assetList.querySelectorAll('.btn-sell').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.game) window.game.sellAssetManually(parseInt(btn.dataset.index));
            });
        });

        // === 负债（含还贷按钮 + V7: 贷款进度） ===
        const liabList = document.getElementById('liability-list');
        if (player.liabilities.length > 0) {
            let liabHtml = '';
            player.liabilities.forEach((l, i) => {
                liabHtml += `<div class="finance-item finance-item-action">
                    <span>${l.name}</span>
                    <span>
                        ¥${l.total.toLocaleString()}
                        <button class="btn-inline btn-repay" data-index="${i}" title="提前还款">还</button>
                    </span>
                </div>`;
                // V7: 显示个人贷款进度
                const loan = player.personalLoans.find(pl => pl.linkedId === l.linkedId);
                if (loan) {
                    const progress = Math.round((1 - loan.remaining / loan.principal) * 100);
                    liabHtml += `<div class="personal-loan-item">
                        <span>└ 月供¥${loan.monthly} | 剩${loan.monthsLeft}月 | 利率${(loan.interestRate * 100).toFixed(1)}%</span>
                        <span><span class="loan-progress-mini"><span class="loan-progress-mini-fill" style="width:${progress}%"></span></span> ${progress}%</span>
                    </div>`;
                }
            });
            liabList.innerHTML = liabHtml;
        } else {
            liabList.innerHTML = '<div class="finance-item"><span style="color:var(--color-positive)">无负债</span><span></span></div>';
        }
        document.getElementById('total-liabilities').textContent = player.getTotalLiabilities().toLocaleString();

        liabList.querySelectorAll('.btn-repay').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.game) window.game.payOffLiabilityManually(parseInt(btn.dataset.index));
            });
        });

        // === V7: 净资产趋势 ===
        const networthEl = document.getElementById('networth-value');
        const networthChangeEl = document.getElementById('networth-change');
        if (networthEl) {
            const nw = player.getNetWorth();
            networthEl.textContent = `¥${nw.toLocaleString()}`;
            if (player.history.length >= 2) {
                const prev = player.history[player.history.length - 1];
                const diff = nw - (prev.netWorth || 0);
                if (diff > 0) {
                    networthChangeEl.textContent = `▲ +¥${diff.toLocaleString()}`;
                    networthChangeEl.className = 'trend-arrow-up';
                } else if (diff < 0) {
                    networthChangeEl.textContent = `▼ -¥${Math.abs(diff).toLocaleString()}`;
                    networthChangeEl.className = 'trend-arrow-down';
                } else {
                    networthChangeEl.textContent = '━ 持平';
                    networthChangeEl.className = 'trend-flat';
                }
            }
        }

        // === 进度 ===
        const progress = player.getFreedomProgress();
        document.getElementById('freedom-percent').textContent = progress + '%';
        document.getElementById('freedom-bar').style.width = progress + '%';
        document.getElementById('passive-income').textContent = player.getPassiveIncome().toLocaleString();
        document.getElementById('target-expense').textContent = player.getTotalExpense().toLocaleString();

        // === 头部 ===
        document.getElementById('current-month').textContent = player.month;
        document.getElementById('player-career').textContent = player.careerName;
        document.getElementById('player-cash').textContent = player.cash.toLocaleString();

        // V7: 快捷行动按钮状态
        const actionQuickBtn = document.getElementById('btn-action-quick');
        const actionBadge = document.getElementById('action-remain-badge');
        if (actionQuickBtn) {
            const remain = player.actionsPerMonth - player.actionsUsedThisMonth;
            if (remain > 0) {
                actionQuickBtn.style.display = '';
                if (actionBadge) actionBadge.textContent = remain;
            } else {
                actionQuickBtn.style.display = 'none';
            }
        }

        // V3 头部扩展
        this.updateHeaderV3(player, maxMonths);
    },

    /** V3 头部扩展：象限、满意度、准备金、先付自己 */
    updateHeaderV3(player, maxMonths) {
        // 倒计时
        const countdownEl = document.getElementById('month-countdown');
        if (countdownEl && maxMonths) {
            const remaining = maxMonths - player.month + 1;
            countdownEl.textContent = `剩余${remaining}月`;
            countdownEl.className = 'countdown-display' + (remaining <= 10 ? ' countdown-urgent' : '');
        }

        // 象限指示器
        const quadEl = document.getElementById('quadrant-indicator');
        if (quadEl) {
            const quads = ['E', 'S', 'B', 'I'];
            const currentIdx = quads.indexOf(player.quadrant);
            quadEl.innerHTML = quads.map((q, i) => {
                let cls = 'quad-step';
                if (i < currentIdx) cls += ' quad-done';
                else if (i === currentIdx) cls += ' quad-current';
                else cls += ' quad-future';
                return `<span class="${cls}">${q}</span>`;
            }).join('<span class="quad-arrow">→</span>');
        }

        // 满意度
        const satEl = document.getElementById('satisfaction-display');
        if (satEl) {
            const satInfo = player.getSatisfactionLevel();
            satEl.innerHTML = `<span class="sat-icon">${satInfo.icon}</span><span class="sat-value sat-${satInfo.level}">${player.satisfaction}</span>`;
        }

        // 投资准备金 & 先付自己
        const reserveEl = document.getElementById('reserve-display');
        if (reserveEl) {
            reserveEl.textContent = `储备:¥${player.investReserve.toLocaleString()}`;
        }
        const paySelfEl = document.getElementById('payself-btn');
        if (paySelfEl) {
            paySelfEl.textContent = `自付:${Math.round(player.paySelfRate * 100)}%`;
        }

        // 财商等级
        const iqEl = document.getElementById('financial-iq');
        if (iqEl) {
            iqEl.textContent = `IQ:${player.financialIQ}`;
        }

        // 保护等级
        const protEl = document.getElementById('protection-level');
        if (protEl) {
            if (player.protectionLevel > 0) {
                protEl.textContent = `护:${player.protectionLevel}`;
                protEl.style.display = '';
            } else {
                protEl.style.display = 'none';
            }
        }

        // 社交资本
        const socialEl = document.getElementById('social-capital');
        if (socialEl) {
            socialEl.textContent = `社:${player.socialCapital}`;
            socialEl.style.color = player.socialCapital >= 50 ? 'var(--color-income)' : player.socialCapital >= 30 ? 'var(--color-gold)' : 'var(--color-expense)';
        }

        // V7: 信用评分
        const creditEl = document.getElementById('credit-score');
        if (creditEl) {
            creditEl.textContent = `信:${player.creditScore}`;
            creditEl.style.color = player.creditScore >= 800 ? 'var(--color-income)' : player.creditScore >= 650 ? 'var(--color-gold)' : 'var(--color-expense)';
            creditEl.title = `芝麻信用 ${player.creditScore}（影响贷款利率：${Math.max(4, Math.round((0.08 - (player.creditScore - 650) * 0.000133) * 100 * 10) / 10)}%）`;
        }

        // 低满意度氛围
        const gameScreen = document.getElementById('screen-game');
        if (gameScreen) {
            gameScreen.classList.toggle('low-satisfaction', player.satisfaction < 40);
            gameScreen.classList.toggle('crisis-satisfaction', player.satisfaction < 20);
        }

        // V4: 时间压力视觉效果
        if (gameScreen && this.maxMonths) {
            const remaining = (this.maxMonths || 60) - player.month + 1;
            gameScreen.classList.toggle('phase-urgent', remaining <= 12);
            gameScreen.classList.toggle('phase-warning', remaining > 12 && remaining <= 24);
        }
    },

    // === 现金流模式图（系统一） ===
    renderCashflowDiagram(player) {
        const container = document.getElementById('cashflow-pattern');
        if (!container) return;

        const pattern = player.getCashflowPattern();
        const typeLabel = document.getElementById('flow-type-label');
        if (typeLabel) {
            const labels = { poor: '穷人模式', middle: '中产模式', rich: '富人模式' };
            typeLabel.textContent = labels[pattern] || '';
            typeLabel.className = 'flow-type flow-type-' + pattern;
        }

        let html = '';
        if (pattern === 'poor') {
            html = `<div class="flow-diagram flow-poor">
                <div class="flow-box flow-salary">工资</div>
                <div class="flow-arrow flow-arrow-poor">═══></div>
                <div class="flow-box flow-expense">支出</div>
                <div class="flow-desc">钱进来就出去，没有任何资产积累</div>
            </div>`;
        } else if (pattern === 'middle') {
            const liabRatio = Math.min(1.5, player.getLiabilityExpenseRatio() * 2);
            html = `<div class="flow-diagram flow-middle">
                <div class="flow-box flow-salary">工资</div>
                <div class="flow-arrow flow-arrow-middle">══></div>
                <div class="flow-box flow-liability" style="transform:scale(${0.8 + liabRatio * 0.3})">负债</div>
                <div class="flow-arrow flow-arrow-middle">══></div>
                <div class="flow-box flow-expense">支出</div>
                <div class="flow-desc">赚得越多，贷得越多，月供吞噬收入</div>
            </div>`;
        } else {
            const passiveFree = player.getPassiveIncome() >= player.getTotalExpense();
            html = `<div class="flow-diagram flow-rich">
                <div class="flow-box flow-salary ${passiveFree ? 'flow-faded' : ''}">工资</div>
                <div class="flow-arrow flow-arrow-rich">══></div>
                <div class="flow-box flow-asset">资产</div>
                <div class="flow-arrow flow-arrow-rich">══></div>
                <div class="flow-box flow-passive">被动收入</div>
                <div class="flow-arrow flow-arrow-rich">══></div>
                <div class="flow-box flow-expense">支出</div>
                <div class="flow-reinvest">
                    <span class="reinvest-arrow">↻ 再投资</span>
                </div>
                <div class="flow-desc">${passiveFree ? '你可以不用工作了！钱在为你赚钱' : '钱生钱的正循环'}</div>
            </div>`;
        }
        container.innerHTML = html;
    },

    // === 先付自己面板（系统二） ===
    showPaySelfPanel(player, onConfirm) {
        const overlay = document.getElementById('modal-overlay');
        document.getElementById('card-type-badge').textContent = '收入分配';
        document.getElementById('card-type-badge').className = 'card-type-badge badge-learning';
        document.getElementById('card-title').textContent = '先付自己';
        document.getElementById('card-description').textContent =
            '富人和穷人的区别不在于收入多少，而在于拿到收入后的第一个动作。穷人先付账单，富人先付自己。';

        const income = player.getTotalIncome();
        document.getElementById('card-details').innerHTML = `
            <div class="detail-row"><span class="detail-label">本月总收入</span><span class="detail-value">¥${income.toLocaleString()}</span></div>
            <div class="detail-row"><span class="detail-label">选择投资比例</span><span class="detail-value">投资准备金只能用于购买资产</span></div>
        `;
        document.getElementById('card-tip').textContent = '提示：投资准备金只能用于购买资产，不能消费。这就是"强制储蓄"的力量。';

        const actionsEl = document.getElementById('card-actions');
        actionsEl.innerHTML = '';
        actionsEl.style.flexDirection = 'row';

        [0, 0.1, 0.2, 0.3].forEach(rate => {
            const amount = Math.round(income * rate);
            const btn = document.createElement('button');
            btn.className = 'btn ' + (rate === 0.1 ? 'btn-primary' : 'btn-secondary');
            btn.textContent = `${Math.round(rate * 100)}% (¥${amount.toLocaleString()})`;
            btn.addEventListener('click', () => {
                overlay.classList.add('hidden');
                onConfirm(rate);
            });
            actionsEl.appendChild(btn);
        });

        overlay.classList.remove('hidden');
    },

    // === 破产重启弹窗（系统十） ===
    showBankruptRestart(player, callbacks) {
        const overlay = document.getElementById('modal-overlay');
        document.getElementById('card-type-badge').textContent = '破产';
        document.getElementById('card-type-badge').className = 'card-type-badge badge-expense';
        document.getElementById('card-title').textContent = '你破产了...但还没结束';
        document.getElementById('card-description').textContent =
            '富爸爸说："我破产过两次，但我从未变穷过。破产是暂时的，贫穷是永远的。"';

        document.getElementById('card-details').innerHTML = `
            <div class="detail-row"><span class="detail-label">东山再起</span><span class="detail-value">资产清零，但保留知识</span></div>
            <div class="detail-row"><span class="detail-label">保留</span><span class="detail-value">财商等级${player.financialIQ} | 答题记录 | 保护等级${player.protectionLevel}</span></div>
            <div class="detail-row"><span class="detail-label">注意</span><span class="detail-value">一局只能重启一次</span></div>
        `;
        document.getElementById('card-tip').textContent = '失败后的机会不是无限的，每一次重来都更珍贵。';

        const actionsEl = document.getElementById('card-actions');
        actionsEl.innerHTML = '';
        actionsEl.style.flexDirection = 'column';

        // 东山再起按钮：选择新职业
        const restartBtn = document.createElement('button');
        restartBtn.className = 'btn btn-success';
        restartBtn.textContent = '东山再起（选择新职业）';
        restartBtn.addEventListener('click', () => {
            // 显示职业选择
            actionsEl.innerHTML = '';
            actionsEl.style.flexDirection = 'column';
            CAREERS.forEach(career => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-secondary';
                btn.textContent = `${career.icon} ${career.name} (月薪¥${career.salary.toLocaleString()})`;
                btn.addEventListener('click', () => {
                    overlay.classList.add('hidden');
                    callbacks.onRestart(career);
                });
                actionsEl.appendChild(btn);
            });
        });

        const giveUpBtn = document.createElement('button');
        giveUpBtn.className = 'btn btn-secondary';
        giveUpBtn.textContent = '接受失败，回到主菜单';
        giveUpBtn.addEventListener('click', () => {
            overlay.classList.add('hidden');
            callbacks.onGiveUp();
        });

        actionsEl.appendChild(restartBtn);
        actionsEl.appendChild(giveUpBtn);
        overlay.classList.remove('hidden');
    },

    // === V4: 多卡选择界面 ===
    showCardChoice(candidates, onChoose) {
        const overlay = document.getElementById('modal-overlay');
        document.getElementById('card-type-badge').textContent = '选择事件';
        document.getElementById('card-type-badge').className = 'card-type-badge badge-learning';
        document.getElementById('card-title').textContent = '本月有多个事件，选择一个处理';
        document.getElementById('card-description').textContent = '你的人脉和信息渠道带来了多个选择。未选择的事件将不会发生。';

        const detailsEl = document.getElementById('card-details');
        detailsEl.innerHTML = candidates.map((c, i) => {
            const typeInfo = CARD_TYPES[c.type];
            const title = c.card.title || c.card.question || '';
            let preview = '';
            if (c.type === 'opportunity') {
                const net = c.card.monthlyIncome - (c.card.liability ? c.card.liability.monthly : 0);
                preview = `首付¥${c.card.downPayment.toLocaleString()} | 净现金流¥${net}/月`;
            } else if (c.type === 'expense') {
                preview = c.card.optional ? `可选消费 ¥${c.card.amount.toLocaleString()}` : `支出 ¥${c.card.amount.toLocaleString()}`;
            } else if (c.type === 'market') {
                preview = '市场波动事件';
            } else if (c.type === 'learning') {
                preview = `答题奖励 ¥${c.card.reward.toLocaleString()}`;
            } else if (c.type === 'chain') {
                preview = '连锁事件';
            }
            return `<div class="detail-row" style="padding:6px 0;border-bottom:1px solid var(--color-border)">
                <span class="detail-label"><span style="color:${c.type === 'opportunity' ? 'var(--color-income)' : c.type === 'expense' ? 'var(--color-expense)' : 'var(--color-primary)'}">[${typeInfo.label}]</span> ${title}</span>
                <span class="detail-value" style="font-size:12px">${preview}</span>
            </div>`;
        }).join('');

        document.getElementById('card-tip').textContent = '提示：选择对你当前财务状况最有利的事件。';

        const actionsEl = document.getElementById('card-actions');
        actionsEl.innerHTML = '';
        actionsEl.style.flexDirection = 'column';

        candidates.forEach((c, i) => {
            const typeInfo = CARD_TYPES[c.type];
            const btn = document.createElement('button');
            btn.className = 'btn ' + (c.type === 'opportunity' ? 'btn-success' : c.type === 'expense' ? 'btn-danger' : 'btn-secondary');
            btn.textContent = `${typeInfo.label}: ${c.card.title || c.card.question || ''}`;
            btn.addEventListener('click', () => {
                overlay.classList.add('hidden');
                onChoose(c);
            });
            actionsEl.appendChild(btn);
        });

        overlay.classList.remove('hidden');
    },

    // === V4: 主动行动菜单 ===
    showActionMenu(actions, onCancel, remainActions) {
        const overlay = document.getElementById('modal-overlay');
        document.getElementById('card-type-badge').textContent = '主动行动';
        document.getElementById('card-type-badge').className = 'card-type-badge badge-opportunity';
        document.getElementById('card-title').textContent = `选择一个行动（剩余${remainActions || '?'}次）`;
        document.getElementById('card-description').textContent = '每月可执行2次主动行动，主动出击而非被动等待。';

        document.getElementById('card-details').innerHTML = '';
        document.getElementById('card-tip').textContent = '主动行动不消耗月份，每月共有2次行动机会。合理利用行动次数最大化收益！';

        const actionsEl = document.getElementById('card-actions');
        actionsEl.innerHTML = '';
        actionsEl.style.flexDirection = 'column';

        actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-secondary';
            btn.innerHTML = `<span style="margin-right:6px">${action.icon}</span>${action.label} <span style="font-size:12px;color:var(--color-text-dim)">- ${action.desc}</span>`;
            btn.style.textAlign = 'left';
            if (action.disabled) btn.disabled = true;
            btn.addEventListener('click', () => {
                overlay.classList.add('hidden');
                action.handler();
            });
            actionsEl.appendChild(btn);
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-text';
        cancelBtn.textContent = '取消';
        cancelBtn.addEventListener('click', () => {
            overlay.classList.add('hidden');
            if (onCancel) onCancel();
        });
        actionsEl.appendChild(cancelBtn);

        overlay.classList.remove('hidden');
    },

    // === 事件卡弹窗（V3: 支持额外详情文本） ===
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
        } else if (type === 'education') {
            detailsEl.innerHTML = `
                <div class="detail-row"><span class="detail-label">学费</span><span class="detail-value">¥${card.cost.toLocaleString()}</span></div>
                <div class="detail-row"><span class="detail-label">效果</span><span class="detail-value" style="color:var(--color-gold)">${card.effect}</span></div>`;
        } else if (type === 'protection') {
            detailsEl.innerHTML = `
                <div class="detail-row"><span class="detail-label">费用</span><span class="detail-value">¥${card.cost.toLocaleString()}</span></div>
                <div class="detail-row"><span class="detail-label">效果</span><span class="detail-value" style="color:var(--color-income)">${card.effect}</span></div>`;
        } else if (type === 'risk') {
            // 风险事件的详情在game.js中通过extraNote传入
        }

        if (extraNote) {
            const lines = extraNote.split('\n').filter(l => l.trim());
            lines.forEach(line => {
                detailsEl.innerHTML += `<div class="detail-row"><span class="detail-label" style="color:var(--color-primary)">${line}</span></div>`;
            });
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
                btn.disabled = true;
                overlay.classList.add('hidden');
                action.handler();
            });
            actionsEl.appendChild(btn);
        });

        // V5: 投资清晰度视觉效果
        const modalCard = document.getElementById('modal-card');
        modalCard.classList.remove('clarity-foggy', 'clarity-blind');
        if (type === 'opportunity' && window.game) {
            const clarity = window.game.player.getInvestmentClarity();
            if (clarity === 'foggy') modalCard.classList.add('clarity-foggy');
            else if (clarity === 'blind') modalCard.classList.add('clarity-blind');
        }

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

    // === 年度回顾弹窗（V3: 含税务、机会成本） ===
    showAnnualReview(data, onClose) {
        const overlay = document.getElementById('modal-overlay');
        document.getElementById('card-type-badge').textContent = `第${data.year}年总结`;
        document.getElementById('card-type-badge').className = 'card-type-badge badge-learning';
        document.getElementById('card-title').textContent = `年度评级: ${data.grade}`;
        document.getElementById('card-description').textContent = data.gradeMsg;

        const sign = (v) => v >= 0 ? '+' : '';
        let detailsHtml = `
            <div class="detail-row"><span class="detail-label">月现金流</span><span class="detail-value">¥${data.cashflow.toLocaleString()} (${sign(data.cashflowChange)}${data.cashflowChange.toLocaleString()})</span></div>
            <div class="detail-row"><span class="detail-label">被动收入</span><span class="detail-value" style="color:var(--color-income)">¥${data.passiveIncome.toLocaleString()} (${sign(data.passiveChange)}${data.passiveChange.toLocaleString()})</span></div>
            <div class="detail-row"><span class="detail-label">净资产变化</span><span class="detail-value" style="color:${data.netWorthChange >= 0 ? 'var(--color-income)' : 'var(--color-expense)'}"> ${sign(data.netWorthChange)}¥${Math.abs(data.netWorthChange).toLocaleString()}</span></div>
            <div class="detail-row"><span class="detail-label">财务自由进度</span><span class="detail-value" style="color:var(--color-gold)">${data.progress}%</span></div>`;

        // V3: 税务分析
        if (data.taxPaid) {
            const totalTax = data.taxPaid.salary + data.taxPaid.passive + data.taxPaid.capital;
            if (totalTax > 0) {
                detailsHtml += `<div class="detail-row" style="margin-top:8px;border-top:1px solid var(--color-border);padding-top:8px">
                    <span class="detail-label" style="color:var(--color-text-dim)">累计缴税</span>
                    <span class="detail-value">¥${totalTax.toLocaleString()}</span>
                </div>`;
                if (data.taxPaid.salary > 0) {
                    detailsHtml += `<div class="detail-row"><span class="detail-label" style="font-size:12px">├ 工资税</span><span class="detail-value" style="font-size:12px">¥${data.taxPaid.salary.toLocaleString()}</span></div>`;
                }
                if (data.taxPaid.passive > 0) {
                    detailsHtml += `<div class="detail-row"><span class="detail-label" style="font-size:12px">├ 被动收入税</span><span class="detail-value" style="font-size:12px">¥${data.taxPaid.passive.toLocaleString()}</span></div>`;
                }
                if (data.taxPaid.capital > 0) {
                    detailsHtml += `<div class="detail-row"><span class="detail-label" style="font-size:12px">└ 资产增值税</span><span class="detail-value" style="font-size:12px">¥${data.taxPaid.capital.toLocaleString()}</span></div>`;
                }
            }
        }

        // V3: 机会成本
        if (data.rejectedCosts && data.rejectedCosts.length > 0 && data.totalMissed > 0) {
            detailsHtml += `<div class="detail-row" style="margin-top:8px;border-top:1px solid var(--color-border);padding-top:8px">
                <span class="detail-label" style="color:var(--color-expense)">错过的收入</span>
                <span class="detail-value" style="color:var(--color-expense)">¥${data.totalMissed.toLocaleString()}</span>
            </div>`;
            data.rejectedCosts.slice(0, 3).forEach(r => {
                detailsHtml += `<div class="detail-row"><span class="detail-label" style="font-size:12px">├ ${r.name} (第${r.month}月放弃)</span><span class="detail-value" style="font-size:12px;color:var(--color-expense)">¥${r.missedTotal.toLocaleString()}</span></div>`;
            });
        }

        // V5: 协同效应、社交资本、象限进化条件
        if (data.activeSynergies && data.activeSynergies.length > 0) {
            detailsHtml += `<div class="detail-row" style="margin-top:8px;border-top:1px solid var(--color-border);padding-top:8px">
                <span class="detail-label" style="color:var(--color-gold)">协同效应</span>
                <span class="detail-value" style="color:var(--color-gold)">+¥${data.synergyBonus.toLocaleString()}/月</span>
            </div>`;
            data.activeSynergies.forEach(s => {
                detailsHtml += `<div class="detail-row"><span class="detail-label" style="font-size:12px">├ ${s.name}</span><span class="detail-value" style="font-size:12px">${s.desc}</span></div>`;
            });
        }

        detailsHtml += `<div class="detail-row" style="margin-top:8px;border-top:1px solid var(--color-border);padding-top:8px">
            <span class="detail-label">社交资本</span>
            <span class="detail-value" style="color:${data.socialCapital >= 50 ? 'var(--color-income)' : data.socialCapital >= 30 ? 'var(--color-gold)' : 'var(--color-expense)'}">${data.socialCapital}</span>
        </div>`;
        detailsHtml += `<div class="detail-row"><span class="detail-label">当前象限</span><span class="detail-value">${data.quadrant} 象限</span></div>`;
        if (data.quadrantConditions) {
            detailsHtml += `<div class="detail-row"><span class="detail-label" style="font-size:11px;color:var(--color-text-dim)">${data.quadrantConditions}</span><span></span></div>`;
        }

        document.getElementById('card-details').innerHTML = detailsHtml;

        let tipText = '通货膨胀正在侵蚀你的购买力。只有让资产增长速度超过通胀，才能真正变富。';
        if (data.taxPaid && data.taxPaid.salary > data.taxPaid.passive * 2) {
            tipText = '富爸爸说："税法是奖励投资者的。你缴的劳动税越多，说明你还在用时间换钱。"';
        }
        document.getElementById('card-tip').textContent = tipText;

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

    // === V7: 增强版贷款面板 ===
    showLoanPanel(config, onConfirm) {
        const overlay = document.getElementById('modal-overlay');
        document.getElementById('card-type-badge').textContent = '银行贷款';
        document.getElementById('card-type-badge').className = 'card-type-badge badge-opportunity';
        document.getElementById('card-title').textContent = '贷款申请';
        document.getElementById('card-description').textContent = '';

        const { creditScore, annualRate, maxLoan, existingLoans, calcMonthly } = config;

        // 信用等级文本
        const creditLevel = creditScore >= 800 ? '优秀' : creditScore >= 700 ? '良好' : creditScore >= 600 ? '一般' : '较低';

        let existingHtml = '';
        if (existingLoans.length > 0) {
            existingHtml = `<div style="margin-top:8px;border-top:1px solid var(--color-border);padding-top:8px">
                <span style="color:var(--color-text-dim);font-size:12px">现有贷款 (${existingLoans.length}笔):</span>`;
            existingLoans.forEach(l => {
                const progress = Math.round((1 - l.remaining / l.principal) * 100);
                existingHtml += `<div class="personal-loan-item">
                    <span>${l.name} 月供¥${l.monthly} 剩${l.monthsLeft}月</span>
                    <span><span class="loan-progress-mini"><span class="loan-progress-mini-fill" style="width:${progress}%"></span></span> ${progress}%</span>
                </div>`;
            });
            existingHtml += '</div>';
        }

        const detailsEl = document.getElementById('card-details');
        detailsEl.innerHTML = `
            <div class="detail-row"><span class="detail-label">芝麻信用</span><span class="detail-value" style="color:${creditScore >= 750 ? 'var(--color-income)' : 'var(--color-gold)'}">${creditScore} (${creditLevel})</span></div>
            <div class="detail-row"><span class="detail-label">年利率</span><span class="detail-value">${(annualRate * 100).toFixed(1)}%</span></div>
            <div class="detail-row"><span class="detail-label">可贷额度</span><span class="detail-value">¥${maxLoan.toLocaleString()}</span></div>
            <div class="loan-input-group">
                <input type="range" id="loan-amount-slider" min="5000" max="${maxLoan}" step="5000" value="${Math.min(20000, maxLoan)}" style="flex:2">
                <span id="loan-amount-display" style="min-width:80px;text-align:right;font-weight:600">¥${Math.min(20000, maxLoan).toLocaleString()}</span>
            </div>
            <div class="loan-input-group">
                <span style="color:var(--color-text-dim);font-size:13px;white-space:nowrap">期限:</span>
                <select id="loan-term-select">
                    <option value="12">12个月</option>
                    <option value="24" selected>24个月</option>
                    <option value="36">36个月</option>
                    <option value="48">48个月</option>
                    <option value="60">60个月</option>
                </select>
            </div>
            <div class="loan-preview" id="loan-preview">
                <div>月供: <span class="highlight" id="loan-monthly">--</span></div>
                <div>总还款: <span id="loan-total-repay">--</span></div>
                <div>总利息: <span style="color:var(--color-expense)" id="loan-total-interest">--</span></div>
            </div>
            ${existingHtml}`;

        document.getElementById('card-tip').textContent = '贷款是双刃剑。用来购买产生正现金流的资产是"好负债"，用来消费是"坏负债"。';

        // 计算并更新预览
        const updatePreview = () => {
            const amount = parseInt(document.getElementById('loan-amount-slider').value);
            const term = parseInt(document.getElementById('loan-term-select').value);
            const monthly = calcMonthly(amount, term);
            const totalRepay = monthly * term;
            const totalInterest = totalRepay - amount;
            document.getElementById('loan-amount-display').textContent = `¥${amount.toLocaleString()}`;
            document.getElementById('loan-monthly').textContent = `¥${monthly.toLocaleString()}/月`;
            document.getElementById('loan-total-repay').textContent = `¥${totalRepay.toLocaleString()}`;
            document.getElementById('loan-total-interest').textContent = `¥${totalInterest.toLocaleString()}`;
        };

        const actionsEl = document.getElementById('card-actions');
        actionsEl.innerHTML = '';
        actionsEl.style.flexDirection = 'row';

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'btn btn-success';
        confirmBtn.textContent = '确认贷款';
        confirmBtn.addEventListener('click', () => {
            const amount = parseInt(document.getElementById('loan-amount-slider').value);
            const term = parseInt(document.getElementById('loan-term-select').value);
            confirmBtn.disabled = true;
            overlay.classList.add('hidden');
            onConfirm(amount, term);
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.textContent = '取消';
        cancelBtn.addEventListener('click', () => overlay.classList.add('hidden'));

        actionsEl.appendChild(confirmBtn);
        actionsEl.appendChild(cancelBtn);

        overlay.classList.remove('hidden');

        // 绑定滑块和下拉事件（需要在DOM渲染后）
        setTimeout(() => {
            const slider = document.getElementById('loan-amount-slider');
            const select = document.getElementById('loan-term-select');
            if (slider) slider.addEventListener('input', updatePreview);
            if (select) select.addEventListener('change', updatePreview);
            updatePreview();
        }, 50);
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

    // === 游戏结束（V3: 含完整分析报告） ===
    showGameOver(won, player, title, message, stats, v3Data) {
        const overlay = document.getElementById('modal-gameover');
        document.getElementById('gameover-title').textContent = title;
        document.getElementById('gameover-title').style.color = won ? 'var(--color-gold)' : 'var(--color-negative)';
        document.getElementById('gameover-message').textContent = message;

        let statsHtml = `
            <div class="stat-item"><div class="stat-label">总月数</div><div class="stat-value">${player.month}</div></div>
            <div class="stat-item"><div class="stat-label">最终现金</div><div class="stat-value">¥${player.cash.toLocaleString()}</div></div>
            <div class="stat-item"><div class="stat-label">被动收入</div><div class="stat-value" style="color:var(--color-income)">¥${player.getPassiveIncome().toLocaleString()}/月</div></div>
            <div class="stat-item"><div class="stat-label">净资产</div><div class="stat-value">¥${player.getNetWorth().toLocaleString()}</div></div>
        `;

        if (v3Data) {
            statsHtml += `
                <div class="stat-item"><div class="stat-label">最终象限</div><div class="stat-value" style="color:var(--color-gold)">${v3Data.quadrant}</div></div>
                <div class="stat-item"><div class="stat-label">满意度</div><div class="stat-value">${v3Data.satisfaction}</div></div>
                <div class="stat-item"><div class="stat-label">财商等级</div><div class="stat-value">${v3Data.financialIQ}</div></div>
                <div class="stat-item"><div class="stat-label">保护等级</div><div class="stat-value">${v3Data.protectionLevel}</div></div>
            `;
        }

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

        // V3: 税务总结
        if (v3Data && v3Data.taxPaid) {
            const total = v3Data.taxPaid.salary + v3Data.taxPaid.passive + v3Data.taxPaid.capital;
            if (total > 0) {
                analysisHtml += `<div class="report-section"><h4 style="color:var(--color-text-dim)">税务总结</h4>
                    <div class="report-item">累计缴税: ¥${total.toLocaleString()}</div>
                    <div class="report-item">├ 工资税: ¥${v3Data.taxPaid.salary.toLocaleString()}</div>
                    <div class="report-item">├ 被动收入税: ¥${v3Data.taxPaid.passive.toLocaleString()}</div>
                    <div class="report-item">└ 资产增值税: ¥${v3Data.taxPaid.capital.toLocaleString()}</div>
                </div>`;
            }
        }

        // V3: 机会成本
        if (v3Data && v3Data.rejectedCosts && v3Data.rejectedCosts.length > 0) {
            const totalMissed = v3Data.rejectedCosts.reduce((s, r) => s + r.missedTotal, 0);
            if (totalMissed > 0) {
                analysisHtml += `<div class="report-section"><h4 style="color:var(--color-expense)">错过的机会</h4>
                    <div class="report-item">你拒绝了 ${v3Data.rejectedCosts.length} 个投资机会，潜在损失收入: ¥${totalMissed.toLocaleString()}</div>`;
                v3Data.rejectedCosts.slice(0, 5).forEach(r => {
                    analysisHtml += `<div class="report-item">├ ${r.name} (第${r.month}月): 至今可赚 ¥${r.missedTotal.toLocaleString()}</div>`;
                });
                analysisHtml += `<div class="report-item" style="color:var(--color-gold)">时间是资产最好的朋友。越早投资，复利越有力量。</div></div>`;
            }
        }

        // V4: 关键转折点 Timeline
        if (v3Data && v3Data.keyMoments && v3Data.keyMoments.length > 0) {
            analysisHtml += `<div class="report-section"><h4 style="color:var(--color-primary)">关键转折点</h4>`;
            v3Data.keyMoments.forEach(m => {
                const color = m.type === 'good' ? 'var(--color-income)' : m.type === 'missed' ? 'var(--color-expense)' : 'var(--color-gold)';
                const icon = m.type === 'good' ? '✓' : m.type === 'missed' ? '✗' : '⚠';
                analysisHtml += `<div class="report-item" style="color:${color}">${icon} 第${m.month}月: ${m.text}</div>`;
            });
            analysisHtml += '</div>';
        }

        // V4: 社交资本
        if (v3Data && v3Data.socialCapital !== undefined) {
            const scLevel = v3Data.socialCapital >= 60 ? '广泛' : v3Data.socialCapital >= 40 ? '一般' : '匮乏';
            analysisHtml += `<div class="report-section"><h4 style="color:var(--color-text-dim)">社交资本: ${v3Data.socialCapital} (${scLevel})</h4>
                <div class="report-item">${v3Data.socialCapital >= 60 ? '你的人脉为你带来了丰富的投资渠道。' : v3Data.socialCapital >= 40 ? '社交网络尚可，但还有提升空间。' : '社交资本不足限制了你的投资机会来源。'}</div>
            </div>`;
        }

        // V3: 协同效应
        if (v3Data && v3Data.activeSynergies && v3Data.activeSynergies.length > 0) {
            analysisHtml += `<div class="report-section"><h4 style="color:var(--color-gold)">协同效应</h4>`;
            v3Data.activeSynergies.forEach(s => {
                analysisHtml += `<div class="report-item">${s.name}: ${s.desc} (+${Math.round(s.bonusRate * 100)}%)</div>`;
            });
            analysisHtml += '</div>';
        }

        // 学习统计
        if (player.quizTotal > 0) {
            const pct = Math.round((player.quizCorrect / player.quizTotal) * 100);
            analysisHtml += `<div class="report-section"><h4 style="color:var(--color-gold)">财商测试</h4>
                <div class="report-item">答对 ${player.quizCorrect}/${player.quizTotal} (${pct}%)</div></div>`;
        }

        // V3: 先付自己分析
        if (v3Data && v3Data.paySelfAnalysis) {
            const ps = v3Data.paySelfAnalysis;
            analysisHtml += `<div class="report-section"><h4 style="color:var(--color-primary)">先付自己</h4>
                <div class="report-item">分配比例: ${Math.round(ps.rate * 100)}%</div>
                <div class="report-item">剩余准备金: ¥${ps.reserve.toLocaleString()}</div>
                <div class="report-item">累计投入资产: ¥${ps.totalInvested.toLocaleString()}</div>
            </div>`;
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
