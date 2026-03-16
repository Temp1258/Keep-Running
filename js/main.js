/**
 * 游戏入口 - 初始化与事件绑定
 */
(function () {
    window.game = null;

    /** 初始化主菜单 */
    function initMenu() {
        UI.showScreen('screen-menu');
        const loadBtn = document.getElementById('btn-load-game');
        loadBtn.style.display = Storage.hasAnySaves() ? '' : 'none';

        UI.renderSaveSlots('load',
            (slotId) => {
                const player = Storage.load(slotId);
                if (player) startGame(player);
            },
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

    /** 开始游戏 */
    function startGame(player) {
        window.game = new Game(player);
        UI.showScreen('screen-game');
        UI.clearMessages();
        UI.updateFinancePanel(player);
        UI.addMessage(`游戏开始！你是一名${player.careerName}，月薪 ¥${player.salary.toLocaleString()}`, 'info');
        UI.addMessage(`目标：让被动收入超过总支出 ¥${player.getTotalExpense().toLocaleString()}`, 'warning');

        UI.setEventArea(`
            <div style="text-align:center">
                <p style="font-size:16px;margin-bottom:8px">准备就绪</p>
                <p style="color:var(--color-text-dim)">点击下方按钮开始第一个月</p>
            </div>
        `);
    }

    /** 绑定事件 */
    function bindEvents() {
        // 新游戏
        document.getElementById('btn-new-game').addEventListener('click', () => {
            UI.showScreen('screen-career');
            UI.renderCareerList((career) => {
                const player = new Player(career);
                startGame(player);
            });
        });

        // 继续游戏
        document.getElementById('btn-load-game').addEventListener('click', () => {
            const slots = document.getElementById('save-slots');
            slots.classList.toggle('hidden');
        });

        // 游戏说明
        document.getElementById('btn-how-to-play').addEventListener('click', () => {
            UI.showScreen('screen-tutorial');
        });

        // 返回主菜单（从职业选择）
        document.getElementById('btn-back-menu').addEventListener('click', () => {
            initMenu();
        });

        // 返回主菜单（从游戏说明）
        document.getElementById('btn-back-from-tutorial').addEventListener('click', () => {
            initMenu();
        });

        // 下一个月
        document.getElementById('btn-next-month').addEventListener('click', () => {
            if (window.game && !window.game.isProcessing) {
                document.getElementById('btn-next-month').disabled = true;
                window.game.nextMonth();
            }
        });

        // 存档
        document.getElementById('btn-save').addEventListener('click', () => {
            if (window.game) {
                window.game.save();
            }
        });

        // 退出游戏
        document.getElementById('btn-quit').addEventListener('click', () => {
            if (confirm('确定要退出吗？未保存的进度将丢失。')) {
                window.game = null;
                initMenu();
            }
        });

        // 游戏结束返回主菜单
        document.getElementById('btn-gameover-menu').addEventListener('click', () => {
            UI.hideGameOver();
            window.game = null;
            initMenu();
        });
    }

    // 启动
    document.addEventListener('DOMContentLoaded', () => {
        bindEvents();
        initMenu();
    });
})();
