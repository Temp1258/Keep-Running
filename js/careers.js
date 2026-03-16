/**
 * 职业数据定义
 * 每个职业有不同的起始收入、支出和现金
 */
const CAREERS = [
    {
        id: 'waiter',
        name: '服务员',
        icon: '🍽️',
        difficulty: '简单',
        description: '收入低但支出也少，适合入门',
        salary: 2500,
        cash: 5000,
        expenses: [
            { name: '房租', amount: 600 },
            { name: '生活费', amount: 800 },
            { name: '交通费', amount: 200 }
        ],
        liabilities: []
    },
    {
        id: 'teacher',
        name: '教师',
        icon: '📚',
        difficulty: '简单',
        description: '稳定的收入，适中的开支',
        salary: 5000,
        cash: 8000,
        expenses: [
            { name: '房贷月供', amount: 1500 },
            { name: '生活费', amount: 1000 },
            { name: '交通费', amount: 300 },
            { name: '保险', amount: 200 }
        ],
        liabilities: [
            { name: '房贷', total: 300000, monthly: 1500 }
        ]
    },
    {
        id: 'programmer',
        name: '程序员',
        icon: '💻',
        difficulty: '中等',
        description: '高薪但高消费，需要谨慎理财',
        salary: 12000,
        cash: 15000,
        expenses: [
            { name: '房贷月供', amount: 4000 },
            { name: '车贷月供', amount: 1500 },
            { name: '生活费', amount: 2000 },
            { name: '信用卡还款', amount: 500 },
            { name: '保险', amount: 500 }
        ],
        liabilities: [
            { name: '房贷', total: 800000, monthly: 4000 },
            { name: '车贷', total: 150000, monthly: 1500 },
            { name: '信用卡', total: 15000, monthly: 500 }
        ]
    },
    {
        id: 'doctor',
        name: '医生',
        icon: '⚕️',
        difficulty: '困难',
        description: '最高收入但也背负最多负债',
        salary: 20000,
        cash: 10000,
        expenses: [
            { name: '房贷月供', amount: 6000 },
            { name: '车贷月供', amount: 3000 },
            { name: '助学贷款', amount: 2000 },
            { name: '生活费', amount: 3000 },
            { name: '信用卡还款', amount: 1000 },
            { name: '保险', amount: 800 }
        ],
        liabilities: [
            { name: '房贷', total: 1500000, monthly: 6000 },
            { name: '车贷', total: 350000, monthly: 3000 },
            { name: '助学贷款', total: 200000, monthly: 2000 },
            { name: '信用卡', total: 30000, monthly: 1000 }
        ]
    }
];
