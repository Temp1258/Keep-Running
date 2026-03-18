/**
 * 职业数据定义 V8
 * 20个职业，基于中国二线城市（成都/武汉/杭州）2025年真实数据
 * 每个职业有不同的起始收入、支出和现金
 * inflatable: true 表示该支出受通胀影响
 *
 * 特性系统:
 * - frugal（节俭）: 可选消费金额减半
 * - learner（学者）: 学习卡奖励翻倍
 * - techie（技术）: 科技类投资额外+20%收入
 * - connected（人脉）: 社交事件带来投资机会
 * - hustler（副业达人）: 兼职收入翻倍
 */
const CAREERS = [
    // ==================== 简单难度 ====================
    {
        id: 'waiter',
        name: '服务员',
        icon: '🍽️',
        difficulty: '简单',
        description: '收入低但支出也少，适合入门。注意：低收入限制了大额贷款资格。',
        salary: 3500,
        cash: 5000,
        expenses: [
            { name: '房租', amount: 800, inflatable: true },
            { name: '生活费', amount: 1000, inflatable: true },
            { name: '交通费', amount: 200, inflatable: true }
        ],
        liabilities: [],
        maxLoanAmount: 30000,
        salaryGrowthCap: 200,
        socialCapital: 25,
        specialTrait: 'frugal'
    },
    {
        id: 'courier',
        name: '快递员',
        icon: '📦',
        difficulty: '简单',
        description: '收入靠量，多劳多得。节俭习惯是你的优势。',
        salary: 5500,
        cash: 8000,
        expenses: [
            { name: '房租', amount: 800, inflatable: true },
            { name: '生活费', amount: 1200, inflatable: true },
            { name: '电动车维护', amount: 300, inflatable: true }
        ],
        liabilities: [],
        maxLoanAmount: 50000,
        salaryGrowthCap: 300,
        socialCapital: 20,
        specialTrait: 'frugal'
    },
    {
        id: 'delivery_rider',
        name: '外卖骑手',
        icon: '🛵',
        difficulty: '简单',
        description: '时间自由，收入弹性大。副业达人天赋让你的额外收入翻倍。',
        salary: 6000,
        cash: 6000,
        expenses: [
            { name: '房租', amount: 900, inflatable: true },
            { name: '生活费', amount: 1200, inflatable: true },
            { name: '电动车费用', amount: 400, inflatable: true }
        ],
        liabilities: [],
        maxLoanAmount: 40000,
        salaryGrowthCap: 0,
        socialCapital: 20,
        specialTrait: 'hustler'
    },
    {
        id: 'construction',
        name: '建筑工人',
        icon: '👷',
        difficulty: '简单',
        description: '体力活收入不低，但工作不稳定。节俭是生存之道。',
        salary: 7000,
        cash: 15000,
        expenses: [
            { name: '房租', amount: 600, inflatable: true },
            { name: '生活费', amount: 1500, inflatable: true },
            { name: '交通费', amount: 200, inflatable: true }
        ],
        liabilities: [],
        maxLoanAmount: 50000,
        salaryGrowthCap: 0,
        socialCapital: 15,
        specialTrait: 'frugal'
    },
    {
        id: 'chef',
        name: '厨师',
        icon: '👨‍🍳',
        difficulty: '简单',
        description: '手艺人，收入稳定。在餐饮行业积累经验后可以自己开店。',
        salary: 5500,
        cash: 10000,
        expenses: [
            { name: '房租', amount: 800, inflatable: true },
            { name: '生活费', amount: 1000, inflatable: true },
            { name: '交通费', amount: 200, inflatable: true }
        ],
        liabilities: [],
        maxLoanAmount: 60000,
        salaryGrowthCap: 300,
        socialCapital: 30,
        specialTrait: 'frugal'
    },
    {
        id: 'ridehailing',
        name: '网约车司机',
        icon: '🚗',
        difficulty: '简单',
        description: '时间灵活但车贷压力大。副业达人天赋让你多平台接单收入翻倍。',
        salary: 7000,
        cash: 5000,
        expenses: [
            { name: '车贷月供', amount: 2500, inflatable: false },
            { name: '油费/充电', amount: 1500, inflatable: true },
            { name: '房租', amount: 800, inflatable: true },
            { name: '生活费', amount: 1000, inflatable: true }
        ],
        liabilities: [
            { name: '车贷', total: 120000, monthly: 2500 }
        ],
        maxLoanAmount: 50000,
        salaryGrowthCap: 0,
        socialCapital: 25,
        specialTrait: 'hustler'
    },

    // ==================== 中等难度 ====================
    {
        id: 'teacher',
        name: '教师',
        icon: '📚',
        difficulty: '中等',
        description: '稳定的收入和福利。教育背景带来学习优势，学习卡奖励翻倍。',
        salary: 6500,
        cash: 15000,
        expenses: [
            { name: '房贷月供', amount: 2000, inflatable: false },
            { name: '生活费', amount: 1200, inflatable: true },
            { name: '交通费', amount: 300, inflatable: true },
            { name: '保险', amount: 200, inflatable: false }
        ],
        liabilities: [
            { name: '房贷', total: 400000, monthly: 2000 }
        ],
        maxLoanAmount: 100000,
        salaryGrowthCap: 500,
        socialCapital: 50,
        specialTrait: 'learner'
    },
    {
        id: 'nurse',
        name: '护士',
        icon: '👩‍⚕️',
        difficulty: '中等',
        description: '医疗行业稳定需求。学习能力强，学习卡奖励翻倍。',
        salary: 6000,
        cash: 12000,
        expenses: [
            { name: '房贷月供', amount: 1800, inflatable: false },
            { name: '生活费', amount: 1200, inflatable: true },
            { name: '交通费', amount: 300, inflatable: true },
            { name: '保险', amount: 200, inflatable: false }
        ],
        liabilities: [
            { name: '房贷', total: 350000, monthly: 1800 }
        ],
        maxLoanAmount: 80000,
        salaryGrowthCap: 500,
        socialCapital: 40,
        specialTrait: 'learner'
    },
    {
        id: 'accountant',
        name: '会计',
        icon: '🧮',
        difficulty: '中等',
        description: '数字敏感，财务基础好。学习天赋让你更快掌握投资知识。',
        salary: 7000,
        cash: 18000,
        expenses: [
            { name: '房贷月供', amount: 2200, inflatable: false },
            { name: '生活费', amount: 1300, inflatable: true },
            { name: '交通费', amount: 300, inflatable: true },
            { name: '保险', amount: 200, inflatable: false }
        ],
        liabilities: [
            { name: '房贷', total: 450000, monthly: 2200 }
        ],
        maxLoanAmount: 100000,
        salaryGrowthCap: 600,
        socialCapital: 45,
        specialTrait: 'learner'
    },
    {
        id: 'civil_servant',
        name: '公务员',
        icon: '🏛️',
        difficulty: '中等',
        description: '铁饭碗，收入不高但极其稳定。不受裁员降薪影响，学习天赋加持。',
        salary: 7000,
        cash: 20000,
        expenses: [
            { name: '房贷月供', amount: 2000, inflatable: false },
            { name: '生活费', amount: 1200, inflatable: true },
            { name: '交通费', amount: 200, inflatable: true },
            { name: '保险', amount: 150, inflatable: false }
        ],
        liabilities: [
            { name: '房贷', total: 400000, monthly: 2000 }
        ],
        maxLoanAmount: 120000,
        salaryGrowthCap: 400,
        socialCapital: 55,
        specialTrait: 'learner'
    },
    {
        id: 'pharmacist',
        name: '药剂师',
        icon: '💊',
        difficulty: '中等',
        description: '医药行业稳定需求，专业门槛高。学习天赋助你投资更精准。',
        salary: 7500,
        cash: 15000,
        expenses: [
            { name: '房贷月供', amount: 2300, inflatable: false },
            { name: '生活费', amount: 1200, inflatable: true },
            { name: '交通费', amount: 300, inflatable: true },
            { name: '保险', amount: 200, inflatable: false }
        ],
        liabilities: [
            { name: '房贷', total: 450000, monthly: 2300 }
        ],
        maxLoanAmount: 100000,
        salaryGrowthCap: 500,
        socialCapital: 45,
        specialTrait: 'learner'
    },
    {
        id: 'fitness_trainer',
        name: '健身教练',
        icon: '💪',
        difficulty: '中等',
        description: '收入靠销售课程，弹性大。副业达人天赋让你的私教收入翻倍。',
        salary: 8000,
        cash: 8000,
        expenses: [
            { name: '房租', amount: 1200, inflatable: true },
            { name: '生活费', amount: 1500, inflatable: true },
            { name: '交通费', amount: 300, inflatable: true },
            { name: '健身补剂', amount: 500, inflatable: true }
        ],
        liabilities: [],
        maxLoanAmount: 60000,
        salaryGrowthCap: 500,
        socialCapital: 40,
        specialTrait: 'hustler'
    },
    {
        id: 'content_creator',
        name: '自媒体博主',
        icon: '📱',
        difficulty: '中等',
        description: '收入不稳定但上限高。副业达人天赋让你的变现能力翻倍。',
        salary: 6000,
        cash: 10000,
        expenses: [
            { name: '房租', amount: 1500, inflatable: true },
            { name: '生活费', amount: 1500, inflatable: true },
            { name: '设备折旧', amount: 500, inflatable: false },
            { name: '流量推广', amount: 800, inflatable: true }
        ],
        liabilities: [],
        maxLoanAmount: 50000,
        salaryGrowthCap: 2000,
        socialCapital: 50,
        specialTrait: 'hustler'
    },

    // ==================== 困难难度 ====================
    {
        id: 'designer',
        name: '设计师',
        icon: '🎨',
        difficulty: '困难',
        description: '创意行业，收入不错但竞争激烈。技术背景让科技类投资更有优势。',
        salary: 10000,
        cash: 18000,
        expenses: [
            { name: '房贷月供', amount: 3200, inflatable: false },
            { name: '生活费', amount: 1800, inflatable: true },
            { name: '交通费', amount: 300, inflatable: true },
            { name: '软件订阅', amount: 300, inflatable: false },
            { name: '保险', amount: 300, inflatable: false }
        ],
        liabilities: [
            { name: '房贷', total: 600000, monthly: 3200 }
        ],
        maxLoanAmount: 150000,
        salaryGrowthCap: 1000,
        socialCapital: 45,
        specialTrait: 'techie'
    },
    {
        id: 'programmer',
        name: '程序员',
        icon: '💻',
        difficulty: '困难',
        description: '高薪但高消费高压力。技术背景解锁科技类投资信息优势。',
        salary: 15000,
        cash: 20000,
        expenses: [
            { name: '房贷月供', amount: 5300, inflatable: false },
            { name: '车贷月供', amount: 1500, inflatable: false },
            { name: '生活费', amount: 2500, inflatable: true },
            { name: '信用卡还款', amount: 500, inflatable: false },
            { name: '保险', amount: 500, inflatable: false }
        ],
        liabilities: [
            { name: '房贷', total: 800000, monthly: 5300 },
            { name: '车贷', total: 150000, monthly: 1500 },
            { name: '信用卡', total: 15000, monthly: 500 }
        ],
        maxLoanAmount: 200000,
        salaryGrowthCap: 1500,
        socialCapital: 50,
        specialTrait: 'techie'
    },
    {
        id: 'bank_clerk',
        name: '银行职员',
        icon: '🏦',
        difficulty: '困难',
        description: '金融行业收入不错，人脉广。社交事件能带来独家投资机会。',
        salary: 10000,
        cash: 25000,
        expenses: [
            { name: '房贷月供', amount: 3500, inflatable: false },
            { name: '生活费', amount: 1800, inflatable: true },
            { name: '交通费', amount: 400, inflatable: true },
            { name: '应酬费', amount: 500, inflatable: true },
            { name: '保险', amount: 300, inflatable: false }
        ],
        liabilities: [
            { name: '房贷', total: 650000, monthly: 3500 }
        ],
        maxLoanAmount: 200000,
        salaryGrowthCap: 800,
        socialCapital: 65,
        specialTrait: 'connected'
    },
    {
        id: 'sales_manager',
        name: '销售经理',
        icon: '📊',
        difficulty: '困难',
        description: '底薪+提成，收入波动大。强大人脉让社交场合带来投资机会。',
        salary: 12000,
        cash: 20000,
        expenses: [
            { name: '房贷月供', amount: 4000, inflatable: false },
            { name: '车贷月供', amount: 1500, inflatable: false },
            { name: '生活费', amount: 2000, inflatable: true },
            { name: '应酬费', amount: 1000, inflatable: true },
            { name: '保险', amount: 400, inflatable: false }
        ],
        liabilities: [
            { name: '房贷', total: 700000, monthly: 4000 },
            { name: '车贷', total: 120000, monthly: 1500 }
        ],
        maxLoanAmount: 180000,
        salaryGrowthCap: 1500,
        socialCapital: 70,
        specialTrait: 'connected'
    },
    {
        id: 'realtor',
        name: '房产中介',
        icon: '🏠',
        difficulty: '困难',
        description: '靠成交吃饭，收入波动极大。强大人脉是你最大的资本。',
        salary: 8000,
        cash: 12000,
        expenses: [
            { name: '房租', amount: 1500, inflatable: true },
            { name: '生活费', amount: 1500, inflatable: true },
            { name: '交通费', amount: 600, inflatable: true },
            { name: '电话费', amount: 300, inflatable: false },
            { name: '应酬费', amount: 500, inflatable: true }
        ],
        liabilities: [],
        maxLoanAmount: 80000,
        salaryGrowthCap: 2000,
        socialCapital: 65,
        specialTrait: 'connected'
    },

    // ==================== 专家难度 ====================
    {
        id: 'lawyer',
        name: '律师',
        icon: '⚖️',
        difficulty: '专家',
        description: '高收入高负债。法律背景带来顶级人脉，社交事件解锁投资机会。',
        salary: 18000,
        cash: 15000,
        expenses: [
            { name: '房贷月供', amount: 6600, inflatable: false },
            { name: '车贷月供', amount: 2000, inflatable: false },
            { name: '助学贷款', amount: 1500, inflatable: false },
            { name: '生活费', amount: 3000, inflatable: true },
            { name: '应酬费', amount: 1000, inflatable: true },
            { name: '保险', amount: 600, inflatable: false }
        ],
        liabilities: [
            { name: '房贷', total: 1000000, monthly: 6600 },
            { name: '车贷', total: 200000, monthly: 2000 },
            { name: '助学贷款', total: 120000, monthly: 1500 }
        ],
        maxLoanAmount: 400000,
        salaryGrowthCap: 2000,
        socialCapital: 75,
        specialTrait: 'connected'
    },
    {
        id: 'doctor',
        name: '医生',
        icon: '⚕️',
        difficulty: '专家',
        description: '最高收入但负债最重。高社交资本带来更多投资渠道。',
        salary: 25000,
        cash: 15000,
        expenses: [
            { name: '房贷月供', amount: 9900, inflatable: false },
            { name: '车贷月供', amount: 3000, inflatable: false },
            { name: '助学贷款', amount: 2000, inflatable: false },
            { name: '生活费', amount: 4000, inflatable: true },
            { name: '信用卡还款', amount: 1000, inflatable: false },
            { name: '保险', amount: 800, inflatable: false }
        ],
        liabilities: [
            { name: '房贷', total: 1500000, monthly: 9900 },
            { name: '车贷', total: 350000, monthly: 3000 },
            { name: '助学贷款', total: 200000, monthly: 2000 },
            { name: '信用卡', total: 30000, monthly: 1000 }
        ],
        maxLoanAmount: 500000,
        salaryGrowthCap: 3000,
        socialCapital: 80,
        specialTrait: 'connected'
    }
];
