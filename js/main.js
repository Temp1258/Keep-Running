/**
 * 游戏入口 V6 - 初始化与事件绑定
 * V6: 游戏时长选择、贷款系统、多重行动
 */
(function () {
    window.game = null;
    window.selectedDuration = 60; // 默认60个月
    window.appSessionId = null;
    window.currentGameRunId = null;

    function initMenu() {
        UI.showScreen('screen-menu');
        const loadBtn = document.getElementById('btn-load-game');
        loadBtn.style.display = Storage.hasAnySaves() ? '' : 'none';

        UI.renderSaveSlots('load',
            (slotId) => { const p = Storage.load(slotId); if (p) startGame(p); },
            (slotId) => {
                Storage.deleteSave(slotId);
                UI.renderSaveSlots('load',
                    (sid) => { const p = Storage.load(sid); if (p) startGame(p); },
                    (sid) => { Storage.deleteSave(sid); initMenu(); }
                );
                loadBtn.style.display = Storage.hasAnySaves() ? '' : 'none';
            }
        );
    }

    function startGame(player, maxMonths) {
        const duration = maxMonths || window.selectedDuration || 60;
        window.currentGameRunId = Storage.startGameRun(window.appSessionId, {
            career: player.careerName,
            duration,
            startMonth: player.month,
            isLoadedGame: player.month > 1
        });
        window.game = new Game(player, duration, window.currentGameRunId);
        UI.showScreen('screen-game');
        UI.clearMessages();
        UI.updateFinancePanel(player, window.game.maxMonths);
        UI.addMessage(`游戏开始！你是一名${player.careerName}，月薪 ¥${player.salary.toLocaleString()}`, 'info');
        UI.addMessage(`目标：${duration}个月内让被动收入超过总支出 ¥${player.getTotalExpense().toLocaleString()}`, 'warning');
        UI.addMessage(`每月有${player.actionsPerMonth}次主动行动机会，可申请贷款、搜索投资、兼职等`, 'info');

        UI.setEventArea(`
            <div style="text-align:center">
                <p style="font-size:16px;margin-bottom:8px">准备就绪</p>
                <p style="color:var(--color-text-dim)">你有${duration}个月实现财务自由</p>
                <p style="color:var(--color-text-dim);margin-top:4px">点击下方按钮开始第一个月</p>
            </div>
        `);

        if (player.month === 1 && !Storage.hasSeenBeginnerGuide()) {
            UI.showBeginnerGuide((dontShowAgain) => {
                if (dontShowAgain) {
                    Storage.markBeginnerGuideSeen();
                }
            });
        }
    }

    function bindDurationSelector() {
        document.querySelectorAll('.btn-duration').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-duration').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                window.selectedDuration = parseInt(btn.dataset.months);
            });
        });
    }

    function bindEvents() {
        // 新游戏
        document.getElementById('btn-new-game').addEventListener('click', () => {
            UI.showScreen('screen-career');
            bindDurationSelector();
            UI.renderCareerList((career) => startGame(new Player(career), window.selectedDuration));
        });

        // 继续游戏
        document.getElementById('btn-load-game').addEventListener('click', () => {
            document.getElementById('save-slots').classList.toggle('hidden');
        });

        // 游戏说明
        document.getElementById('btn-how-to-play').addEventListener('click', () => UI.showScreen('screen-tutorial'));

        // 统计数据
        document.getElementById('btn-stats').addEventListener('click', () => {
            UI.renderStatsScreen();
            UI.showScreen('screen-stats');
        });

        // 成就
        document.getElementById('btn-achievements').addEventListener('click', () => {
            UI.renderAchievementsScreen();
            UI.showScreen('screen-achievements');
        });

        // 返回主菜单
        document.getElementById('btn-back-menu').addEventListener('click', initMenu);
        document.getElementById('btn-back-from-tutorial').addEventListener('click', initMenu);
        document.getElementById('btn-back-from-stats').addEventListener('click', initMenu);
        document.getElementById('btn-back-from-achievements').addEventListener('click', initMenu);

        // 下一个月
        document.getElementById('btn-next-month').addEventListener('click', () => {
            if (window.game && !window.game.isProcessing) {
                document.getElementById('btn-next-month').disabled = true;
                window.game.nextMonth();
            }
        });

        // 存档
        document.getElementById('btn-save').addEventListener('click', () => {
            if (window.game) window.game.save();
        });

        // 先付自己比例切换
        document.getElementById('payself-btn').addEventListener('click', () => {
            if (window.game) window.game.cyclePaySelfRate();
        });

        // V7: 快捷主动行动按钮
        document.getElementById('btn-action-quick').addEventListener('click', () => {
            if (window.game && !window.game.isProcessing) window.game.showActionMenu();
        });

        // 退出
        document.getElementById('btn-quit').addEventListener('click', () => {
            if (confirm('确定要退出吗？未保存的进度将丢失。')) {
                if (window.currentGameRunId && window.game) {
                    Storage.endGameRun(window.currentGameRunId, {
                        won: false,
                        reason: 'quit',
                        month: window.game.player.month
                    });
                }
                window.game = null;
                window.currentGameRunId = null;
                initMenu();
            }
        });

        // 游戏结束返回
        document.getElementById('btn-gameover-menu').addEventListener('click', () => {
            UI.hideGameOver();
            window.game = null;
            window.currentGameRunId = null;
            initMenu();
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (!window.game || !document.getElementById('screen-game').classList.contains('active')) return;
            const modalHidden = document.getElementById('modal-overlay').classList.contains('hidden');
            const gameoverHidden = document.getElementById('modal-gameover').classList.contains('hidden');

            if (e.key === 'Enter' && !window.game.isProcessing && modalHidden && gameoverHidden) {
                const btn = document.getElementById('btn-next-month');
                if (!btn.disabled) {
                    btn.disabled = true;
                    window.game.nextMonth();
                }
            }

            // Space 键打开主动行动菜单
            if (e.key === ' ' && !window.game.isProcessing && modalHidden && gameoverHidden) {
                e.preventDefault();
                const player = window.game.player;
                if (player.actionsPerMonth - player.actionsUsedThisMonth > 0) {
                    window.game.showActionMenu();
                }
            }

            // Escape 关闭弹窗
            if (e.key === 'Escape' && !modalHidden) {
                document.getElementById('modal-overlay').classList.add('hidden');
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        window.appSessionId = Storage.startAppSession();
        bindEvents();
        initMenu();
    });
})();
