/**
 * 事件卡系统 V2
 * 类型: opportunity(投资机会), expense(额外支出), market(市场波动), learning(学习)
 * 新增: unlockMonth(阶段解锁), 连锁事件系统
 */

const CARD_TYPES = {
    opportunity: { label: '投资机会', badgeClass: 'badge-opportunity' },
    expense: { label: '额外支出', badgeClass: 'badge-expense' },
    market: { label: '市场波动', badgeClass: 'badge-market' },
    learning: { label: '财商学堂', badgeClass: 'badge-learning' },
    chain: { label: '连锁事件', badgeClass: 'badge-market' }
};

const CARDS = {
    opportunity: [
        // === 基础卡 (月份 1-12) ===
        {
            id: 'index_fund',
            title: '指数基金定投',
            description: '理财经理建议你投资指数基金，长期定投回报稳定，每月可获得基金分红。',
            cost: 10000, downPayment: 10000, monthlyIncome: 60,
            asset: { name: '指数基金', type: 'fund', cost: 10000, income: 60 },
            tip: '指数基金是入门级投资产品。门槛低、风险分散，适合初学者。',
            unlockMonth: 1
        },
        {
            id: 'stock_dividend',
            title: '高分红蓝筹股',
            description: '一位投资顾问推荐了一只高分红蓝筹股，年分红率约6%。',
            cost: 20000, downPayment: 20000, monthlyIncome: 100,
            asset: { name: '蓝筹股', type: 'stock', cost: 20000, income: 100 },
            tip: '股票分红是被动收入的一种。蓝筹股相对稳定，但记住：投资有风险。',
            unlockMonth: 1
        },
        {
            id: 'vending_machine',
            title: '自动售货机生意',
            description: '有个机会可以买一台自动售货机放在商业区，每月能有不错的零售利润。',
            cost: 15000, downPayment: 15000, monthlyIncome: 200,
            asset: { name: '自动售货机', type: 'business', cost: 15000, income: 200 },
            tip: '小生意也是资产！它不需要你花太多时间，但能持续为你赚钱。',
            unlockMonth: 1
        },
        {
            id: 'bond_fund',
            title: '债券基金',
            description: '银行理财经理推荐了一款稳健型债券基金，收益虽低但非常稳定。',
            cost: 15000, downPayment: 15000, monthlyIncome: 75,
            asset: { name: '债券基金', type: 'fund', cost: 15000, income: 75 },
            tip: '低风险低回报是债券的特点。适合保守型投资者，也适合分散投资组合风险。',
            unlockMonth: 1
        },
        {
            id: 'knowledge_course',
            title: '知识付费课程版权',
            description: '你有机会买下一门热门在线课程的版权，每月能收到稳定的版税收入。',
            cost: 5000, downPayment: 5000, monthlyIncome: 80,
            asset: { name: '课程版权', type: 'business', cost: 5000, income: 80 },
            tip: '知识产权也是资产！版税是最纯粹的被动收入之一——创造一次，收入持续。',
            unlockMonth: 1
        },

        // === 中级卡 (月份 13+) ===
        {
            id: 'small_apartment',
            title: '小户型出租房',
            description: '朋友介绍了一套小户型公寓，位置不错，租金回报率高。',
            cost: 50000, downPayment: 10000, monthlyIncome: 500,
            liability: { name: '小户型房贷', total: 40000, monthly: 400 },
            expense: { name: '小户型房贷月供', amount: 400 },
            asset: { name: '出租小户型', type: 'realestate', cost: 50000, income: 500 },
            tip: '富爸爸说：房产是最好的资产之一——前提是它能带来正现金流。净现金流 = ¥500 - ¥400 = ¥100/月',
            unlockMonth: 13
        },
        {
            id: 'big_apartment',
            title: '大户型出租房',
            description: '有一套大户型公寓正在出售，可以改成多间出租，租金收入可观。',
            cost: 150000, downPayment: 30000, monthlyIncome: 1500,
            liability: { name: '大户型房贷', total: 120000, monthly: 1000 },
            expense: { name: '大户型房贷月供', amount: 1000 },
            asset: { name: '出租大户型', type: 'realestate', cost: 150000, income: 1500 },
            tip: '这是一笔较大的投资。净现金流 = ¥1500 - ¥1000 = ¥500/月。确保你有足够的首付！',
            unlockMonth: 13
        },
        {
            id: 'online_store',
            title: '网店转让',
            description: '一家盈利中的网店正在转让，品类稳定，客源成熟，每月有稳定利润。',
            cost: 30000, downPayment: 30000, monthlyIncome: 400,
            asset: { name: '网店', type: 'business', cost: 30000, income: 400 },
            tip: '生意是富爸爸最推崇的资产类型。好的生意能在你不工作时也为你赚钱。',
            unlockMonth: 13
        },
        {
            id: 'parking_spot',
            title: '停车位投资',
            description: '小区附近的停车位正在出售，买下后出租给住户，月租稳定。',
            cost: 60000, downPayment: 15000, monthlyIncome: 300,
            liability: { name: '车位贷款', total: 45000, monthly: 400 },
            expense: { name: '车位贷款月供', amount: 400 },
            asset: { name: '出租车位', type: 'realestate', cost: 60000, income: 300 },
            tip: '注意！月供(¥400)大于租金收入(¥300)，净现金流为负。不是所有"投资"都是好资产！',
            unlockMonth: 13
        },
        {
            id: 'laundromat',
            title: '自助洗衣店',
            description: '大学城旁边有个位置可以开自助洗衣店，投入不大，收入稳定。',
            cost: 25000, downPayment: 25000, monthlyIncome: 350,
            asset: { name: '洗衣店', type: 'business', cost: 25000, income: 350 },
            tip: '自助服务类生意的好处是人力成本低，利润率高。',
            unlockMonth: 13
        },
        {
            id: 'reits_fund',
            title: 'REITs基金',
            description: '一只房地产信托基金正在募集，不用直接买房就能享受房产收益。',
            cost: 30000, downPayment: 30000, monthlyIncome: 200,
            asset: { name: 'REITs基金', type: 'fund', cost: 30000, income: 200 },
            tip: 'REITs让你用较少资金参与房地产投资。是分散投资组合的好选择。',
            unlockMonth: 13
        },
        {
            id: 'delivery_franchise',
            title: '外卖加盟店',
            description: '一个知名外卖品牌在你附近招加盟商，品牌成熟，客源稳定。',
            cost: 40000, downPayment: 40000, monthlyIncome: 500,
            asset: { name: '外卖加盟店', type: 'business', cost: 40000, income: 500 },
            tip: '加盟模式降低了创业风险。成熟品牌 = 成熟客源 = 稳定收入。',
            unlockMonth: 13
        },
        {
            id: 'house_flip',
            title: '二手房翻新',
            description: '有一套需要翻新的二手房，装修后出租回报不错。',
            cost: 80000, downPayment: 20000, monthlyIncome: 800,
            liability: { name: '二手房贷款', total: 60000, monthly: 500 },
            expense: { name: '二手房贷月供', amount: 500 },
            asset: { name: '翻新出租房', type: 'realestate', cost: 80000, income: 800 },
            tip: '房屋翻新是提高资产价值的经典策略。净现金流 = ¥800 - ¥500 = ¥300/月。',
            unlockMonth: 13
        },

        // === 高级卡 (月份 37+) ===
        {
            id: 'chain_laundry',
            title: '连锁洗衣店',
            description: '你的洗衣店生意不错，有机会扩展成连锁品牌，收入会大幅提升。',
            cost: 100000, downPayment: 40000, monthlyIncome: 1200,
            liability: { name: '连锁店贷款', total: 60000, monthly: 600 },
            expense: { name: '连锁店贷月供', amount: 600 },
            asset: { name: '连锁洗衣店', type: 'business', cost: 100000, income: 1200 },
            tip: '从单店到连锁，这是生意规模化的经典路径。净现金流 = ¥1200 - ¥600 = ¥600/月。',
            unlockMonth: 37
        },
        {
            id: 'office_building',
            title: '写字楼出租',
            description: 'CBD有一层写字楼正在出售，租金收益非常可观。',
            cost: 500000, downPayment: 100000, monthlyIncome: 4000,
            liability: { name: '写字楼贷款', total: 400000, monthly: 3000 },
            expense: { name: '写字楼贷月供', amount: 3000 },
            asset: { name: '出租写字楼', type: 'realestate', cost: 500000, income: 4000 },
            tip: '商业地产的回报率通常高于住宅。净现金流 = ¥4000 - ¥3000 = ¥1000/月。大投资大回报。',
            unlockMonth: 37
        },
        {
            id: 'tech_stock',
            title: '科技股期权',
            description: '一家有前景的科技公司开放了员工以外的期权购买，高风险但潜在回报惊人。',
            cost: 50000, downPayment: 50000, monthlyIncome: 600,
            asset: { name: '科技股期权', type: 'stock', cost: 50000, income: 600 },
            tip: '高风险高回报。科技股波动大，但如果选对公司，回报可能是数倍。',
            unlockMonth: 37
        },
        {
            id: 'apartment_building',
            title: '小型公寓楼',
            description: '一栋6层小型公寓楼正在出售，全部出租后收入非常可观。',
            cost: 800000, downPayment: 200000, monthlyIncome: 6000,
            liability: { name: '公寓楼贷款', total: 600000, monthly: 4500 },
            expense: { name: '公寓楼贷月供', amount: 4500 },
            asset: { name: '小型公寓楼', type: 'realestate', cost: 800000, income: 6000 },
            tip: '这是一笔重大投资。净现金流 = ¥6000 - ¥4500 = ¥1500/月。确保你有足够的现金储备应对意外。',
            unlockMonth: 37
        },
        {
            id: 'warehouse',
            title: '仓储物流中心',
            description: '电商蓬勃发展，一个小型仓储中心正在转让，长期租约稳定。',
            cost: 300000, downPayment: 80000, monthlyIncome: 2500,
            liability: { name: '仓储贷款', total: 220000, monthly: 1800 },
            expense: { name: '仓储贷月供', amount: 1800 },
            asset: { name: '仓储中心', type: 'realestate', cost: 300000, income: 2500 },
            tip: '物流仓储是被电商时代推动的优质资产。净现金流 = ¥2500 - ¥1800 = ¥700/月。',
            unlockMonth: 37
        },
        {
            id: 'brand_franchise',
            title: '品牌加盟',
            description: '一个全国知名的连锁品牌开放了你所在城市的加盟权。',
            cost: 150000, downPayment: 60000, monthlyIncome: 1800,
            liability: { name: '加盟贷款', total: 90000, monthly: 800 },
            expense: { name: '加盟贷月供', amount: 800 },
            asset: { name: '品牌加盟店', type: 'business', cost: 150000, income: 1800 },
            tip: '成熟品牌的加盟权本身就是一种资产。净现金流 = ¥1800 - ¥800 = ¥1000/月。',
            unlockMonth: 37
        }
    ],

    expense: [
        {
            id: 'car_repair', title: '汽车维修',
            description: '你的车突然抛锚了，需要支付一笔维修费用。',
            amount: 2000,
            tip: '意外支出是人生常态。富爸爸建议：永远保留至少3个月支出的现金作为紧急备用金。'
        },
        {
            id: 'medical', title: '医疗费用',
            description: '你生了一场病，需要支付医药费。',
            amount: 3000, medicalType: true,
            tip: '健康是最大的资产。同时，保险可以帮你转移大额医疗风险。'
        },
        {
            id: 'luxury_watch', title: '奢侈品诱惑',
            description: '商场打折，一块心仪已久的名表正在促销。你忍不住想买下来。要买吗？',
            amount: 5000, optional: true,
            tip: '富爸爸说：穷人买奢侈品，富人最后才买奢侈品。你真的需要它吗？'
        },
        {
            id: 'new_phone', title: '换新手机',
            description: '最新款手机发布了！你的旧手机还能用，但新功能真的很吸引人。',
            amount: 6000, optional: true,
            tip: '区分"想要"和"需要"是理财的第一步。旧手机还能用，新手机是"想要"而非"需要"。'
        },
        {
            id: 'friend_wedding', title: '朋友结婚',
            description: '好朋友要结婚了，你需要包一个红包。',
            amount: 1000,
            tip: '人情往来是固定支出的一部分。提前规划这类社交开支很重要。'
        },
        {
            id: 'home_repair', title: '房屋维修',
            description: '家里的热水器坏了，需要更换一个新的。',
            amount: 1500,
            tip: '拥有房产就意味着维护成本。这些隐性支出在买房时常被忽略。'
        },
        {
            id: 'new_car_tempt', title: '买新车诱惑',
            description: '4S店推出了超低首付购车活动。一辆漂亮的新车只需首付2万，但每月要还1500的车贷。',
            amount: 20000, optional: true,
            addExpense: { name: '新车贷月供', amount: 1500 },
            addLiability: { name: '新车贷', total: 150000, monthly: 1500 },
            tip: '富爸爸说：车是负债不是资产！它每个月都从你口袋拿钱——油费、保险、折旧、贷款月供。'
        },
        {
            id: 'tax_bill', title: '补缴税款',
            description: '年度税务核算后，你需要补缴一笔个人所得税。',
            amount: 2500,
            tip: '税务规划是财务管理的重要一环。了解合法节税方法可以节省不少钱。'
        },
        // === 新增 8 张 ===
        {
            id: 'child_tuition', title: '孩子学费',
            description: '新学期开始了，孩子的学费和各种辅导班费用需要缴纳。',
            amount: 3000,
            tip: '教育支出是家庭最大的固定开支之一。提前规划教育基金是明智之举。'
        },
        {
            id: 'parent_hospital', title: '父母住院',
            description: '父母年纪大了，突然住院需要你支付一笔医疗费。',
            amount: 5000, medicalType: true,
            tip: '家庭责任是不可避免的支出。为父母购买医疗保险可以大大减轻负担。'
        },
        {
            id: 'scam_investment', title: '"稳赚不赔"的项目',
            description: '同事神秘兮兮地拉你投资一个"内部项目"，说保证翻倍。你投吗？',
            amount: 8000, optional: true,
            tip: '记住：任何号称"稳赚不赔"的投资都是骗局。高回报必然伴随高风险，而骗局只有高风险没有回报。'
        },
        {
            id: 'shopping_spree', title: '双十一大促',
            description: '双十一到了，满减优惠力度空前。购物车里堆满了"划算"的商品。',
            amount: 2000, optional: true,
            tip: '打折不等于省钱。如果买的是你本不需要的东西，花的每一分钱都是浪费。'
        },
        {
            id: 'travel_tempt', title: '旅游诱惑',
            description: '同事们组织了一次出国旅游，费用不菲但听起来很吸引人。',
            amount: 4000, optional: true,
            tip: '延迟满足是富人的核心习惯之一。现在把旅游费投资出去，未来可以用被动收入去旅游。'
        },
        {
            id: 'rent_increase', title: '房东涨房租',
            description: '房东通知你下个月开始涨租金，每月多付200元。',
            amount: 0,
            addExpenseOnly: { name: '房租上涨', amount: 200, inflatable: true },
            tip: '租房者永远在为房东的资产买单。这也是为什么富爸爸建议拥有能产生收入的房产。'
        },
        {
            id: 'insurance_offer', title: '保险推销',
            description: '保险公司推荐你买一份综合保障险。一次性支付¥3000，之后医疗类意外支出减半。',
            amount: 3000, optional: true, isInsurance: true,
            tip: '保险的本质是用小钱转移大风险。对于意外支出较多的人来说，保险是一种"防守型资产"。'
        },
        {
            id: 'credit_card_tempt', title: '信用卡分期诱惑',
            description: '银行打电话说可以给你¥10000的信用卡分期额度，每月只需还¥800。听起来很"轻松"。',
            amount: 0, optional: true,
            cashGain: 10000,
            addExpense: { name: '信用卡分期', amount: 800 },
            addLiability: { name: '信用卡分期', total: 14400, monthly: 800 },
            tip: '信用卡分期是最常见的负债陷阱。看似每月只还¥800，但总共要还¥14400——多付了44%的利息！'
        }
    ],

    market: [
        {
            id: 'property_up', title: '房价上涨',
            description: '你所在城市的房价大涨！如果你有房产，有人愿意高价收购。',
            assetType: 'realestate', multiplier: 1.5,
            tip: '资产增值是财富增长的重要途径。但记住：只有卖出才是真正的利润。'
        },
        {
            id: 'property_down', title: '房价下跌',
            description: '经济不景气，房价下跌了。你的房产价值缩水。',
            assetType: 'realestate', multiplier: 0.7,
            tip: '市场有涨有跌，这是正常现象。持有能产生正现金流的资产，即使价格下跌也不会影响你的收入。'
        },
        {
            id: 'stock_boom', title: '股市大涨',
            description: '牛市来了！你持有的股票价值翻倍。有人想以高价买入你的股票。',
            assetType: 'stock', multiplier: 2.0,
            tip: '别人贪婪时你要恐惧。牛市是卖出获利的好时机，但也意味着失去后续的被动收入。'
        },
        {
            id: 'stock_crash', title: '股市暴跌',
            description: '股市突然大跌，你持有的股票价值腰斩。',
            assetType: 'stock', multiplier: 0.5,
            tip: '别人恐惧时你要贪婪——前提是你有足够的现金储备。长期投资者不惧短期波动。'
        },
        {
            id: 'business_boom', title: '生意兴隆',
            description: '你的小生意所在区域人流量大增，有人出高价要收购你的生意。',
            assetType: 'business', multiplier: 1.8,
            tip: '好的生意会不断增值。但出售也是一种策略——可以获得现金去投资更大的机会。'
        },
        {
            id: 'rent_up', title: '租金上涨',
            description: '市场供不应求，你的租金收入增长了20%！',
            assetType: 'realestate', incomeMultiplier: 1.2,
            tip: '租金收入增长而月供不变，意味着你的现金流在改善。这就是通胀对债务人的好处。'
        },
        // === 新增 6 张 ===
        {
            id: 'fund_dividend_up', title: '基金分红增加',
            description: '你持有的基金今年表现优异，分红增加了15%！',
            assetType: 'fund', incomeMultiplier: 1.15,
            tip: '选择好的基金，长期持有，分红会随时间自然增长。这就是复利的力量。'
        },
        {
            id: 'fund_drop', title: '基金净值下跌',
            description: '市场调整，你持有的基金净值下跌了20%。',
            assetType: 'fund', multiplier: 0.8,
            tip: '基金波动是正常的。如果你投资的是指数基金，长期来看市场总是向上的。不要恐慌卖出。'
        },
        {
            id: 'business_competition', title: '竞争加剧',
            description: '你的生意附近开了几家同类店铺，利润受到了挤压。',
            assetType: 'business', incomeMultiplier: 0.85,
            tip: '商业竞争是常态。保持核心优势、提升服务质量是应对竞争的关键。'
        },
        {
            id: 'rate_cut', title: '央行降息',
            description: '央行宣布降息！你的贷款利率降低，月供减少10%。',
            rateChange: -0.1,
            tip: '降息对借款人有利——月供减少意味着现金流改善。这就是为什么关注宏观经济很重要。'
        },
        {
            id: 'rate_hike', title: '央行加息',
            description: '央行宣布加息！你的浮动利率贷款月供增加10%。',
            rateChange: 0.1,
            tip: '加息会增加贷款成本。这提醒我们：在利率低时锁定固定利率，或尽快还清高息负债。'
        },
        {
            id: 'economic_boom', title: '经济繁荣',
            description: '经济形势大好，所有投资类资产普遍升值20%！',
            globalMultiplier: 1.2,
            tip: '经济繁荣期是资产增值最快的时期。但记住：周期总会转换，繁荣之后可能是衰退。'
        }
    ],

    learning: [
        {
            id: 'q1', question: '以下哪个是"资产"？',
            options: ['自住房（有房贷）', '出租房（租金>月供）', '新买的豪车', '信用卡'],
            answer: 1, reward: 1000,
            explanation: '出租房在租金大于月供时，每月为你带来正现金流，所以是资产。自住房虽然有价值，但它每月让你付出月供，是负债。'
        },
        {
            id: 'q2', question: '富爸爸认为，穷人和富人最大的区别是？',
            options: ['学历高低', '收入多少', '对资产和负债的理解', '运气好坏'],
            answer: 2, reward: 1000,
            explanation: '富爸爸认为：富人买入资产，穷人和中产阶级买入他们以为是资产的负债。关键不是收入多少，而是你如何使用你的收入。'
        },
        {
            id: 'q3', question: '什么是"被动收入"？',
            options: ['工资收入', '不需要持续劳动就能获得的收入', '兼职收入', '借钱获得的钱'],
            answer: 1, reward: 1000,
            explanation: '被动收入是即使你不工作也能获得的收入，如房租、股息、版税等。财务自由的关键就是让被动收入超过支出。'
        },
        {
            id: 'q4', question: '月现金流 = ？',
            options: ['总资产 - 总负债', '总收入 - 总支出', '工资 × 12', '存款 + 投资'],
            answer: 1, reward: 1000,
            explanation: '月现金流 = 总收入 - 总支出。正现金流意味着每月有结余可以再投资，负现金流意味着你在亏钱。'
        },
        {
            id: 'q5', question: '以下哪种行为最可能帮你走向财务自由？',
            options: ['加薪后提升生活品质', '用结余购买能产生被动收入的资产', '贷款买更大的房子自住', '把所有钱存银行'],
            answer: 1, reward: 1500,
            explanation: '用结余购买资产，让资产为你工作，这是走向财务自由的核心路径。加薪后提升消费是"老鼠赛跑"的陷阱。'
        },
        {
            id: 'q6', question: '"老鼠赛跑"是指什么？',
            options: ['一种宠物比赛', '赚更多花更多的恶性循环', '股市的追涨杀跌', '创业竞争'],
            answer: 1, reward: 1000,
            explanation: '"老鼠赛跑"是指人们不断工作赚取更多收入，但同时增加更多支出，永远无法实现财务自由的状态。'
        },
        {
            id: 'q7', question: '一套月供3000元的自住房，对你来说是？',
            options: ['资产，因为房子会增值', '负债，因为它每月从你口袋拿走3000元', '既是资产也是负债', '都不是'],
            answer: 1, reward: 1500,
            explanation: '按照富爸爸的定义，自住房是负债——它每月从你口袋里拿走钱（月供、维护费等），而不是放钱进来。'
        },
        {
            id: 'q8', question: '财务自由的定义是？',
            options: ['年薪百万', '被动收入 ≥ 总支出', '没有任何贷款', '有100万存款'],
            answer: 1, reward: 1000,
            explanation: '财务自由 = 被动收入 ≥ 总支出。这意味着即使你不工作，你的资产产生的收入也足以覆盖所有开支。'
        },
        // === 新增 8 张进阶 ===
        {
            id: 'q9', question: '什么是"72法则"？',
            options: ['72岁退休', '用72除以年收益率，得出资产翻倍所需年数', '每月存72%的工资', '投资72种资产'],
            answer: 1, reward: 1500,
            explanation: '72法则：用72÷年收益率=资产翻倍年数。例如年化收益8%，则72÷8=9年翻倍。这是理解复利最简单的方法。'
        },
        {
            id: 'q10', question: '以下哪种是"好负债"？',
            options: ['信用卡消费贷', '贷款买产生正现金流的出租房', '贷款买豪车', '分期买奢侈品'],
            answer: 1, reward: 1500,
            explanation: '好负债是别人帮你还的债——比如贷款买出租房，租客的房租帮你还月供。坏负债是你自己还的债，还不会产生任何收入。'
        },
        {
            id: 'q11', question: '分散投资的主要目的是？',
            options: ['为了买更多东西', '降低单一投资失败的风险', '因为钱太多了', '让报表好看'],
            answer: 1, reward: 1000,
            explanation: '不要把所有鸡蛋放在一个篮子里。分散投资可以降低单一投资失败对整体的影响，让你的投资组合更加稳健。'
        },
        {
            id: 'q12', question: '通货膨胀对谁最有利？',
            options: ['存款的人', '借钱投资的人', '不投资的人', '拿固定工资的人'],
            answer: 1, reward: 1500,
            explanation: '通胀让钱贬值，所以借来的钱在未来价值更低（等于债务缩水）。而你用借来的钱买的资产却在涨价。这就是"用别人的钱赚钱"。'
        },
        {
            id: 'q13', question: '投资回报率(ROI)怎么算？',
            options: ['收入 ÷ 支出', '(收益-成本) ÷ 成本 × 100%', '资产 ÷ 负债', '月收入 × 12'],
            answer: 1, reward: 1000,
            explanation: 'ROI = (收益-成本) ÷ 成本 × 100%。这是衡量一笔投资是否划算的核心指标。ROI越高，投资效率越高。'
        },
        {
            id: 'q14', question: '应急基金应该准备多少？',
            options: ['1个月支出', '3-6个月支出', '全部存款', '不需要准备'],
            answer: 1, reward: 1000,
            explanation: '一般建议准备3-6个月总支出的应急基金。这样即使失业或遇到意外，也有缓冲时间而不必被迫卖出资产。'
        },
        {
            id: 'q15', question: '为什么高薪也可能破产？',
            options: ['因为税太高', '因为高薪往往伴随更高的消费和负债', '因为公司会裁员', '不可能破产'],
            answer: 1, reward: 1500,
            explanation: '这就是"收入陷阱"：赚得越多，花得越多，负债也越多。月薪5万但月支出4.8万的人，比月薪1万但月支出5千的人更脆弱。'
        },
        {
            id: 'q16', question: '以下哪个是最有效的节税方式？',
            options: ['逃税', '通过合法的资产结构降低税负', '不赚钱就不用交税', '只拿现金'],
            answer: 1, reward: 1000,
            explanation: '富人通过公司、房产折旧、合理的资产结构来合法降低税负。这就是为什么富爸爸说"税法是为了鼓励投资而设计的"。'
        }
    ]
};

/**
 * 连锁事件（需要玩家持有特定资产时才会触发）
 */
const CHAIN_EVENTS = [
    // 房产连锁
    {
        id: 'tenant_default', requireAssetType: 'realestate',
        title: '租客拖欠房租', type: 'chain',
        description: '你的一个租客连续3个月没交房租，并且已经搬走了。你损失了3个月的租金收入。',
        effect: 'lose_income_months', months: 3,
        tip: '房东也有风险：空置期和坏账。选择好租客、签好合同很重要。建议留有现金储备应对此类情况。'
    },
    {
        id: 'renovation_opportunity', requireAssetType: 'realestate',
        title: '房屋装修升级', type: 'chain',
        description: '你的出租房可以花¥5000装修升级，装修后租金可以提高20%。',
        effect: 'upgrade_income', cost: 5000, incomeMultiplier: 1.2,
        optional: true,
        tip: '适度的装修投入可以大幅提高租金回报。关键是装修成本要能在合理时间内通过租金增长回收。'
    },
    // 股票连锁
    {
        id: 'company_buyout', requireAssetType: 'stock',
        title: '公司被收购！', type: 'chain',
        description: '你持有股票的公司被一家大公司收购了！收购价是当前股价的200%。你的股票将被强制收购。',
        effect: 'force_sell', multiplier: 2.0,
        tip: '被收购往往带来溢价。但这也意味着你失去了持续的分红收入。拿到现金后，记得尽快再投资。'
    },
    {
        id: 'stock_fraud', requireAssetType: 'stock',
        title: '财报造假丑闻', type: 'chain',
        description: '你持有的一只股票被曝财报造假，股价暴跌80%。',
        effect: 'asset_crash', multiplier: 0.2,
        tip: '集中投资单只股票风险极大。这就是为什么分散投资如此重要——不要把所有鸡蛋放在一个篮子里。'
    },
    // 生意连锁
    {
        id: 'good_employee', requireAssetType: 'business',
        title: '招到好员工', type: 'chain',
        description: '你的生意招到了一个非常能干的员工，效率提升，利润增长了30%。',
        effect: 'upgrade_income', cost: 0, incomeMultiplier: 1.3,
        tip: '人才是企业最大的资产。好的团队能让你的生意实现真正的"被动"收入。'
    },
    {
        id: 'business_fine', requireAssetType: 'business',
        title: '经营罚款', type: 'chain',
        description: '你的生意因为违规被市场监管部门罚款¥3000。',
        effect: 'pay_fine', amount: 3000,
        tip: '合规经营是做生意的底线。罚款不仅损失金钱，还损害信誉。'
    },
    {
        id: 'business_expand', requireAssetType: 'business',
        title: '扩大经营机会', type: 'chain',
        description: '你的生意表现不错，有机会投入¥10000扩大规模，利润可以翻倍。',
        effect: 'upgrade_income', cost: 10000, incomeMultiplier: 2.0,
        optional: true,
        tip: '在已被验证的生意上加大投入，是风险最低的扩张方式。前提是你有足够的现金。'
    },
    // 基金连锁
    {
        id: 'fund_manager_change', requireAssetType: 'fund',
        title: '基金经理更换',type: 'chain',
        description: '你持有的基金更换了基金经理，市场对此反应不一，基金收益暂时下降10%。',
        effect: 'upgrade_income', cost: 0, incomeMultiplier: 0.9,
        tip: '主动管理型基金受基金经理影响很大。这也是指数基金（被动管理）受欢迎的原因之一。'
    }
];

/**
 * 抽取一张随机事件卡
 * V2: 支持阶段解锁和连锁事件
 */
function drawCard(player) {
    // 15%概率触发连锁事件（如果有适用的）
    if (Math.random() < 0.15) {
        const applicable = CHAIN_EVENTS.filter(ce =>
            player.assets.some(a => a.type === ce.requireAssetType)
        );
        if (applicable.length > 0) {
            const card = applicable[Math.floor(Math.random() * applicable.length)];
            return { type: 'chain', card };
        }
    }

    // 常规抽卡：投资机会35%, 额外支出25%, 市场波动15%, 学习25%
    const rand = Math.random();
    let type;
    if (rand < 0.35) {
        type = 'opportunity';
    } else if (rand < 0.60) {
        type = 'expense';
    } else if (rand < 0.75) {
        type = 'market';
    } else {
        type = 'learning';
    }

    let pool = CARDS[type];

    // 投资机会卡按月份过滤
    if (type === 'opportunity') {
        pool = pool.filter(card => (card.unlockMonth || 1) <= player.month);
    }

    // 市场波动卡过滤
    if (type === 'market') {
        const applicable = pool.filter(card => {
            if (card.assetType) {
                return player.assets.some(a => a.type === card.assetType);
            }
            if (card.rateChange) {
                return player.liabilities.length > 0;
            }
            if (card.globalMultiplier) {
                return player.assets.length > 0;
            }
            return true;
        });
        if (applicable.length === 0) {
            type = 'opportunity';
            pool = CARDS.opportunity.filter(card => (card.unlockMonth || 1) <= player.month);
        } else {
            pool = applicable;
        }
    }

    const card = pool[Math.floor(Math.random() * pool.length)];
    return { type, card };
}
