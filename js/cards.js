/**
 * 事件卡系统
 * 类型: opportunity(投资机会), expense(额外支出), market(市场波动), learning(学习)
 */

const CARD_TYPES = {
    opportunity: { label: '投资机会', badgeClass: 'badge-opportunity' },
    expense: { label: '额外支出', badgeClass: 'badge-expense' },
    market: { label: '市场波动', badgeClass: 'badge-market' },
    learning: { label: '财商学堂', badgeClass: 'badge-learning' }
};

const CARDS = {
    opportunity: [
        {
            id: 'small_apartment',
            title: '小户型出租房',
            description: '朋友介绍了一套小户型公寓，位置不错，租金回报率高。购买后可以出租获得稳定的租金收入。',
            cost: 50000,
            downPayment: 10000,
            monthlyIncome: 500,
            liability: { name: '小户型房贷', total: 40000, monthly: 400 },
            expense: { name: '小户型房贷月供', amount: 400 },
            asset: { name: '出租小户型', type: 'realestate', cost: 50000, income: 500 },
            tip: '富爸爸说：房产是最好的资产之一——前提是它能带来正现金流。这套房净现金流 = ¥500 - ¥400 = ¥100/月'
        },
        {
            id: 'big_apartment',
            title: '大户型出租房',
            description: '有一套大户型公寓正在出售，可以改成多间出租，租金收入可观。',
            cost: 150000,
            downPayment: 30000,
            monthlyIncome: 1500,
            liability: { name: '大户型房贷', total: 120000, monthly: 1000 },
            expense: { name: '大户型房贷月供', amount: 1000 },
            asset: { name: '出租大户型', type: 'realestate', cost: 150000, income: 1500 },
            tip: '这是一笔较大的投资。净现金流 = ¥1500 - ¥1000 = ¥500/月。确保你有足够的首付！'
        },
        {
            id: 'stock_dividend',
            title: '高分红蓝筹股',
            description: '一位投资顾问推荐了一只高分红蓝筹股，年分红率约6%，按月计每月能获得稳定分红。',
            cost: 20000,
            downPayment: 20000,
            monthlyIncome: 100,
            asset: { name: '蓝筹股', type: 'stock', cost: 20000, income: 100 },
            tip: '股票分红是被动收入的一种。蓝筹股相对稳定，但记住：投资有风险。'
        },
        {
            id: 'index_fund',
            title: '指数基金定投',
            description: '理财经理建议你投资指数基金，长期定投回报稳定，每月可获得基金分红。',
            cost: 10000,
            downPayment: 10000,
            monthlyIncome: 60,
            asset: { name: '指数基金', type: 'fund', cost: 10000, income: 60 },
            tip: '指数基金是入门级投资产品。门槛低、风险分散，适合初学者。'
        },
        {
            id: 'vending_machine',
            title: '自动售货机生意',
            description: '有个机会可以买一台自动售货机放在商业区，每月能有不错的零售利润。',
            cost: 15000,
            downPayment: 15000,
            monthlyIncome: 200,
            asset: { name: '自动售货机', type: 'business', cost: 15000, income: 200 },
            tip: '小生意也是资产！它不需要你花太多时间，但能持续为你赚钱。'
        },
        {
            id: 'online_store',
            title: '网店转让',
            description: '一家盈利中的网店正在转让，品类稳定，客源成熟，每月有稳定利润。',
            cost: 30000,
            downPayment: 30000,
            monthlyIncome: 400,
            asset: { name: '网店', type: 'business', cost: 30000, income: 400 },
            tip: '生意是富爸爸最推崇的资产类型。好的生意能在你不工作时也为你赚钱。'
        },
        {
            id: 'parking_spot',
            title: '停车位投资',
            description: '小区附近的停车位正在出售，买下后出租给住户，月租稳定。',
            cost: 60000,
            downPayment: 15000,
            monthlyIncome: 300,
            liability: { name: '车位贷款', total: 45000, monthly: 400 },
            expense: { name: '车位贷款月供', amount: 400 },
            asset: { name: '出租车位', type: 'realestate', cost: 60000, income: 300 },
            tip: '注意！这个投资的月供(¥400)大于租金收入(¥300)，净现金流为负。不是所有"投资"都是好资产！'
        },
        {
            id: 'laundromat',
            title: '自助洗衣店',
            description: '大学城旁边有个位置可以开自助洗衣店，投入不大，收入稳定。',
            cost: 25000,
            downPayment: 25000,
            monthlyIncome: 350,
            asset: { name: '洗衣店', type: 'business', cost: 25000, income: 350 },
            tip: '自助服务类生意的好处是人力成本低，利润率高。'
        }
    ],

    expense: [
        {
            id: 'car_repair',
            title: '汽车维修',
            description: '你的车突然抛锚了，需要支付一笔维修费用。',
            amount: 2000,
            tip: '意外支出是人生常态。富爸爸建议：永远保留至少3个月支出的现金作为紧急备用金。'
        },
        {
            id: 'medical',
            title: '医疗费用',
            description: '你生了一场病，需要支付医药费。',
            amount: 3000,
            tip: '健康是最大的资产。同时，保险可以帮你转移大额医疗风险。'
        },
        {
            id: 'luxury_watch',
            title: '奢侈品诱惑',
            description: '商场打折，一块心仪已久的名表正在促销。你忍不住想买下来。要买吗？',
            amount: 5000,
            optional: true,
            tip: '富爸爸说：穷人买奢侈品，富人最后才买奢侈品。你真的需要它吗？'
        },
        {
            id: 'new_phone',
            title: '换新手机',
            description: '最新款手机发布了！你的旧手机还能用，但新功能真的很吸引人。',
            amount: 6000,
            optional: true,
            tip: '区分"想要"和"需要"是理财的第一步。旧手机还能用，新手机是"想要"而非"需要"。'
        },
        {
            id: 'friend_wedding',
            title: '朋友结婚',
            description: '好朋友要结婚了，你需要包一个红包。',
            amount: 1000,
            tip: '人情往来是固定支出的一部分。提前规划这类社交开支很重要。'
        },
        {
            id: 'home_repair',
            title: '房屋维修',
            description: '家里的热水器坏了，需要更换一个新的。',
            amount: 1500,
            tip: '拥有房产就意味着维护成本。这些隐性支出在买房时常被忽略。'
        },
        {
            id: 'new_car_tempt',
            title: '买新车诱惑',
            description: '4S店推出了超低首付购车活动。一辆漂亮的新车只需首付2万，但每月要还1500的车贷。',
            amount: 20000,
            optional: true,
            addExpense: { name: '新车贷月供', amount: 1500 },
            addLiability: { name: '新车贷', total: 150000, monthly: 1500 },
            tip: '富爸爸说：车是负债不是资产！它每个月都从你口袋拿钱——油费、保险、折旧、贷款月供。'
        },
        {
            id: 'tax_bill',
            title: '补缴税款',
            description: '年度税务核算后，你需要补缴一笔个人所得税。',
            amount: 2500,
            tip: '税务规划是财务管理的重要一环。了解合法节税方法可以节省不少钱。'
        }
    ],

    market: [
        {
            id: 'property_up',
            title: '房价上涨',
            description: '你所在城市的房价大涨！如果你有房产，有人愿意高价收购。',
            assetType: 'realestate',
            multiplier: 1.5,
            tip: '资产增值是财富增长的重要途径。但记住：只有卖出才是真正的利润。'
        },
        {
            id: 'property_down',
            title: '房价下跌',
            description: '经济不景气，房价下跌了。你的房产价值缩水。',
            assetType: 'realestate',
            multiplier: 0.7,
            tip: '市场有涨有跌，这是正常现象。持有能产生正现金流的资产，即使价格下跌也不会影响你的收入。'
        },
        {
            id: 'stock_boom',
            title: '股市大涨',
            description: '牛市来了！你持有的股票价值翻倍。有人想以高价买入你的股票。',
            assetType: 'stock',
            multiplier: 2.0,
            tip: '别人贪婪时你要恐惧。牛市是卖出获利的好时机，但也意味着失去后续的被动收入。'
        },
        {
            id: 'stock_crash',
            title: '股市暴跌',
            description: '股市突然大跌，你持有的股票价值腰斩。',
            assetType: 'stock',
            multiplier: 0.5,
            tip: '别人恐惧时你要贪婪——前提是你有足够的现金储备。长期投资者不惧短期波动。'
        },
        {
            id: 'business_boom',
            title: '生意兴隆',
            description: '你的小生意所在区域人流量大增，有人出高价要收购你的生意。',
            assetType: 'business',
            multiplier: 1.8,
            tip: '好的生意会不断增值。但出售也是一种策略——可以获得现金去投资更大的机会。'
        },
        {
            id: 'rent_increase',
            title: '租金上涨',
            description: '市场供不应求，你的租金收入增长了20%！',
            assetType: 'realestate',
            incomeMultiplier: 1.2,
            tip: '租金收入增长而月供不变，意味着你的现金流在改善。这就是通胀对债务人的好处。'
        }
    ],

    learning: [
        {
            id: 'q1',
            question: '以下哪个是"资产"？',
            options: ['自住房（有房贷）', '出租房（租金>月供）', '新买的豪车', '信用卡'],
            answer: 1,
            reward: 1000,
            explanation: '出租房在租金大于月供时，每月为你带来正现金流，所以是资产。自住房虽然有价值，但它每月让你付出月供，是负债。'
        },
        {
            id: 'q2',
            question: '富爸爸认为，穷人和富人最大的区别是？',
            options: ['学历高低', '收入多少', '对资产和负债的理解', '运气好坏'],
            answer: 2,
            reward: 1000,
            explanation: '富爸爸认为：富人买入资产，穷人和中产阶级买入他们以为是资产的负债。关键不是收入多少，而是你如何使用你的收入。'
        },
        {
            id: 'q3',
            question: '什么是"被动收入"？',
            options: ['工资收入', '不需要持续劳动就能获得的收入', '兼职收入', '借钱获得的钱'],
            answer: 1,
            reward: 1000,
            explanation: '被动收入是即使你不工作也能获得的收入，如房租、股息、版税等。财务自由的关键就是让被动收入超过支出。'
        },
        {
            id: 'q4',
            question: '月现金流 = ？',
            options: ['总资产 - 总负债', '总收入 - 总支出', '工资 × 12', '存款 + 投资'],
            answer: 1,
            reward: 1000,
            explanation: '月现金流 = 总收入 - 总支出。正现金流意味着每月有结余可以再投资，负现金流意味着你在亏钱。'
        },
        {
            id: 'q5',
            question: '以下哪种行为最可能帮你走向财务自由？',
            options: ['加薪后提升生活品质', '用结余的钱购买能产生被动收入的资产', '贷款买更大的房子自住', '把所有钱存银行'],
            answer: 1,
            reward: 1500,
            explanation: '用结余购买资产，让资产为你工作，这是走向财务自由的核心路径。加薪后提升消费是"老鼠赛跑"的陷阱。'
        },
        {
            id: 'q6',
            question: '"老鼠赛跑"是指什么？',
            options: ['一种宠物比赛', '赚更多花更多的恶性循环', '股市的追涨杀跌', '创业竞争'],
            answer: 1,
            reward: 1000,
            explanation: '"老鼠赛跑"是指人们不断努力工作赚取更多收入，但同时也增加更多支出，永远无法实现财务自由的状态。'
        },
        {
            id: 'q7',
            question: '一套月供3000元的自住房，对你来说是？',
            options: ['资产，因为房子会增值', '负债，因为它每月从你口袋拿走3000元', '既是资产也是负债', '都不是'],
            answer: 1,
            reward: 1500,
            explanation: '按照富爸爸的定义，自住房是负债——它每月从你口袋里拿走钱（月供、维护费、物业费等），而不是放钱进来。'
        },
        {
            id: 'q8',
            question: '财务自由的定义是？',
            options: ['年薪百万', '被动收入 ≥ 总支出', '没有任何贷款', '有100万存款'],
            answer: 1,
            reward: 1000,
            explanation: '财务自由 = 被动收入 ≥ 总支出。这意味着即使你不工作，你的资产产生的收入也足以覆盖所有开支。'
        }
    ]
};

/**
 * 抽取一张随机事件卡
 */
function drawCard(player) {
    // 权重分配：投资机会40%, 额外支出25%, 市场波动15%, 学习20%
    const rand = Math.random();
    let type;
    if (rand < 0.40) {
        type = 'opportunity';
    } else if (rand < 0.65) {
        type = 'expense';
    } else if (rand < 0.80) {
        type = 'market';
    } else {
        type = 'learning';
    }

    const pool = CARDS[type];
    // 对市场波动卡做过滤——只有玩家持有相应类型资产时才抽到涨跌卡
    if (type === 'market') {
        const applicable = pool.filter(card => {
            if (card.assetType) {
                return player.assets.some(a => a.type === card.assetType);
            }
            return true;
        });
        if (applicable.length === 0) {
            // 没有适用的市场卡，改为投资机会
            type = 'opportunity';
            const card = CARDS.opportunity[Math.floor(Math.random() * CARDS.opportunity.length)];
            return { type, card };
        }
        const card = applicable[Math.floor(Math.random() * applicable.length)];
        return { type, card };
    }

    const card = pool[Math.floor(Math.random() * pool.length)];
    return { type, card };
}
