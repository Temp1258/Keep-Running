/**
 * 事件卡系统 V3
 * 类型: opportunity(投资机会), expense(额外支出), market(市场波动), learning(学习),
 *       chain(连锁事件), education(财商教育), fomo(FOMO事件), social(社交攀比),
 *       protection(资产保护), risk(风险事件)
 */

const CARD_TYPES = {
    opportunity: { label: '投资机会', badgeClass: 'badge-opportunity' },
    expense: { label: '额外支出', badgeClass: 'badge-expense' },
    market: { label: '市场波动', badgeClass: 'badge-market' },
    learning: { label: '财商学堂', badgeClass: 'badge-learning' },
    chain: { label: '连锁事件', badgeClass: 'badge-market' },
    education: { label: '财商教育', badgeClass: 'badge-learning' },
    fomo: { label: 'FOMO事件', badgeClass: 'badge-expense' },
    social: { label: '社交攀比', badgeClass: 'badge-expense' },
    protection: { label: '资产保护', badgeClass: 'badge-opportunity' },
    risk: { label: '风险事件', badgeClass: 'badge-expense' },
    satisfaction: { label: '生活事件', badgeClass: 'badge-market' },
    quadrant: { label: '象限进化', badgeClass: 'badge-opportunity' }
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
        },

        // === S象限专属卡 ===
        {
            id: 'personal_studio',
            title: '个人工作室',
            description: '你可以成立自己的工作室，接更多项目，但需要一笔启动资金。',
            cost: 20000, downPayment: 20000, monthlyIncome: 300,
            asset: { name: '个人工作室', type: 'business', cost: 20000, income: 300 },
            tip: 'S象限的起点：用你的技能赚钱。但记住，你还是在用时间换钱。',
            unlockMonth: 1, requireQuadrant: 'S'
        },
        {
            id: 'freelance_project',
            title: '外包项目',
            description: '一个大客户需要你做一个长期外包项目，每月有稳定收入。',
            cost: 5000, downPayment: 5000, monthlyIncome: 250,
            asset: { name: '外包合同', type: 'business', cost: 5000, income: 250 },
            tip: '外包收入是S象限的典型收入方式。稳定但有上限。',
            unlockMonth: 1, requireQuadrant: 'S'
        },

        // === B象限专属卡 ===
        {
            id: 'hire_team',
            title: '招聘管理团队',
            description: '你的生意需要扩张，招聘一个管理团队让业务系统化运作。投入后收入大幅提升。',
            cost: 50000, downPayment: 50000, monthlyIncome: 800,
            asset: { name: '管理团队', type: 'business', cost: 50000, income: 800 },
            tip: 'B象限的核心：建立系统。你不再为钱工作，系统为你赚钱。',
            unlockMonth: 1, requireQuadrant: 'B'
        },
        {
            id: 'open_branch',
            title: '开设分店',
            description: '你的品牌已经成熟，可以在另一个区域开设分店。',
            cost: 80000, downPayment: 30000, monthlyIncome: 1000,
            liability: { name: '分店贷款', total: 50000, monthly: 500 },
            expense: { name: '分店贷月供', amount: 500 },
            asset: { name: '品牌分店', type: 'business', cost: 80000, income: 1000 },
            tip: '规模化是B象限的核心策略。每开一家分店，你的系统就更强大。',
            unlockMonth: 1, requireQuadrant: 'B'
        },

        // === I象限专属卡 ===
        {
            id: 'angel_invest',
            title: '天使投资',
            description: '一个初创团队向你融资，项目前景不错。作为天使投资人，你可以获得股权分红。',
            cost: 100000, downPayment: 100000, monthlyIncome: 1500,
            asset: { name: '天使投资', type: 'stock', cost: 100000, income: 1500 },
            tip: 'I象限的高阶玩法：用钱投资别人的梦想，获取股权回报。',
            unlockMonth: 1, requireQuadrant: 'I'
        },
        {
            id: 'business_acquisition',
            title: '企业并购',
            description: '一家盈利稳定的小企业正在出售。收购后你可以整合到你的商业版图中。',
            cost: 200000, downPayment: 80000, monthlyIncome: 3000,
            liability: { name: '并购贷款', total: 120000, monthly: 1500 },
            expense: { name: '并购贷月供', amount: 1500 },
            asset: { name: '收购企业', type: 'business', cost: 200000, income: 3000 },
            tip: '企业并购是I象限投资者的利器。用钱买别人已经建好的系统。',
            unlockMonth: 1, requireQuadrant: 'I'
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
        },
        // === V3: 报复性消费（满意度低时触发） ===
        {
            id: 'revenge_spend', title: '报复性消费',
            description: '你已经很久没有犒劳自己了，压抑的消费欲望突然爆发！你冲动购买了一堆东西。',
            amount: 3000, isForced: true,
            satisfactionRestore: 20,
            tip: '完全压抑消费欲望不可持续。有计划的小奖励好过报复性大消费。',
            triggerCondition: 'low_satisfaction'
        },
        // === V3: 奖励自己（满意度低于50时特殊选项） ===
        {
            id: 'treat_yourself', title: '奖励自己',
            description: '最近压力有点大，给自己买点小东西放松一下？花费不多，但能让你心情好很多。',
            amount: 800, optional: true,
            satisfactionRestore: 15,
            tip: '有计划的小奖励好过报复性大消费。这是"先付自己"中的一种——付给自己的快乐。',
            triggerCondition: 'medium_satisfaction'
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
            options: ['兼职收入', '借钱获得的钱', '工资收入', '不需要持续劳动就能获得的收入'],
            answer: 3, reward: 1000,
            explanation: '被动收入是即使你不工作也能获得的收入，如房租、股息、版税等。财务自由的关键就是让被动收入超过支出。'
        },
        {
            id: 'q4', question: '月现金流 = ？',
            options: ['总收入 - 总支出', '总资产 - 总负债', '工资 × 12', '存款 + 投资'],
            answer: 0, reward: 1000,
            explanation: '月现金流 = 总收入 - 总支出。正现金流意味着每月有结余可以再投资，负现金流意味着你在亏钱。'
        },
        {
            id: 'q5', question: '以下哪种行为最可能帮你走向财务自由？',
            options: ['加薪后提升生活品质', '把所有钱存银行', '用结余购买能产生被动收入的资产', '贷款买更大的房子自住'],
            answer: 2, reward: 1500,
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
            options: ['既是资产也是负债', '资产，因为房子会增值', '都不是', '负债，因为它每月从你口袋拿走3000元'],
            answer: 3, reward: 1500,
            explanation: '按照富爸爸的定义，自住房是负债——它每月从你口袋里拿走钱（月供、维护费等），而不是放钱进来。'
        },
        {
            id: 'q8', question: '财务自由的定义是？',
            options: ['没有任何贷款', '有100万存款', '被动收入 ≥ 总支出', '年薪百万'],
            answer: 2, reward: 1000,
            explanation: '财务自由 = 被动收入 ≥ 总支出。这意味着即使你不工作，你的资产产生的收入也足以覆盖所有开支。'
        },
        {
            id: 'q9', question: '什么是"72法则"？',
            options: ['用72除以年收益率，得出资产翻倍所需年数', '72岁退休', '每月存72%的工资', '投资72种资产'],
            answer: 0, reward: 1500,
            explanation: '72法则：用72÷年收益率=资产翻倍年数。例如年化收益8%，则72÷8=9年翻倍。这是理解复利最简单的方法。'
        },
        {
            id: 'q10', question: '以下哪种是"好负债"？',
            options: ['信用卡消费贷', '贷款买豪车', '分期买奢侈品', '贷款买产生正现金流的出租房'],
            answer: 3, reward: 1500,
            explanation: '好负债是别人帮你还的债——比如贷款买出租房，租客的房租帮你还月供。坏负债是你自己还的债，还不会产生任何收入。'
        },
        {
            id: 'q11', question: '分散投资的主要目的是？',
            options: ['让报表好看', '为了买更多东西', '降低单一投资失败的风险', '因为钱太多了'],
            answer: 2, reward: 1000,
            explanation: '不要把所有鸡蛋放在一个篮子里。分散投资可以降低单一投资失败对整体的影响，让你的投资组合更加稳健。'
        },
        {
            id: 'q12', question: '通货膨胀对谁最有利？',
            options: ['拿固定工资的人', '存款的人', '借钱投资的人', '不投资的人'],
            answer: 2, reward: 1500,
            explanation: '通胀让钱贬值，所以借来的钱在未来价值更低（等于债务缩水）。而你用借来的钱买的资产却在涨价。这就是"用别人的钱赚钱"。'
        },
        {
            id: 'q13', question: '投资回报率(ROI)怎么算？',
            options: ['收入 ÷ 支出', '资产 ÷ 负债', '月收入 × 12', '(收益-成本) ÷ 成本 × 100%'],
            answer: 3, reward: 1000,
            explanation: 'ROI = (收益-成本) ÷ 成本 × 100%。这是衡量一笔投资是否划算的核心指标。ROI越高，投资效率越高。'
        },
        {
            id: 'q14', question: '应急基金应该准备多少？',
            options: ['3-6个月支出', '1个月支出', '全部存款', '不需要准备'],
            answer: 0, reward: 1000,
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
            options: ['不赚钱就不用交税', '只拿现金', '逃税', '通过合法的资产结构降低税负'],
            answer: 3, reward: 1000,
            explanation: '富人通过公司、房产折旧、合理的资产结构来合法降低税负。这就是为什么富爸爸说"税法是为了鼓励投资而设计的"。'
        }
    ]
};

/**
 * 财商教育机会卡（每15月出现一次）
 */
const EDUCATION_CARDS = [
    {
        id: 'edu_basic',
        title: '基础理财课程',
        description: '一位成功的投资人在你的城市开设基础理财研讨会。学习后你能看到投资卡的更多信息。',
        cost: 2000, targetLevel: 1,
        effect: '投资卡额外显示"净现金流"和"回收期"',
        tip: '信息差是最大的财富差距。花小钱学知识，避免大钱买教训。'
    },
    {
        id: 'edu_advanced',
        title: '进阶投资分析课',
        description: '一位知名基金经理开设高级投资分析课程。学习后你能看到投资的风险评级。',
        cost: 5000, targetLevel: 2,
        effect: '投资卡额外显示"年化ROI"和"风险评级"',
        tip: '懂得分析风险，是从新手到高手的分水岭。这¥5000可能帮你避免一个亏损¥10000的投资。'
    },
    {
        id: 'edu_master',
        title: '大师班：财务自由之路',
        description: '一位已实现财务自由的投资大师亲自授课。学习后你能看到完整的投资分析和建议。',
        cost: 10000, targetLevel: 3,
        effect: '投资卡显示完整分析 + 投资建议（"建议买入"/"慎重考虑"）',
        tip: '最好的投资是投资自己的大脑。大师级的眼光，让你的每一分钱都花在刀刃上。'
    }
];

/**
 * 资产保护卡
 */
const PROTECTION_CARDS = [
    {
        id: 'protection_basic',
        title: '综合保险升级',
        description: '保险顾问建议你升级为综合保障险，覆盖更多风险场景。',
        cost: 3000, targetLevel: 1,
        effect: '意外支出减半',
        tip: '基础保护是理财的第一步。用小钱转移大风险。'
    },
    {
        id: 'protection_company',
        title: '成立个人公司',
        description: '财务顾问建议你成立个人公司持有资产，可以有效隔离个人风险。',
        cost: 8000, targetLevel: 2,
        effect: '诉讼/罚款类事件伤害减半',
        tip: '资产与个人分离是富人的基本操作。个人公司就是一层法律护盾。'
    },
    {
        id: 'protection_trust',
        title: '家族信托结构',
        description: '一位资深律师帮你设计家族信托结构，为你的资产提供最高级别的保护。',
        cost: 15000, targetLevel: 3,
        effect: '资产价值波动影响减30%',
        tip: '家族信托是顶级的资产保护工具。赚到第一桶金后，保护它和继续增长一样重要。'
    }
];

/**
 * 风险事件卡（受保护等级影响）
 */
const RISK_EVENTS = [
    {
        id: 'lawsuit',
        title: '合伙人纠纷诉讼',
        description: '你的一个合伙人起诉了你，要求赔偿损失。',
        effects: {
            0: { type: 'lose_asset', desc: '失去1个资产' },
            1: { type: 'lose_asset', desc: '失去1个资产' },
            2: { type: 'pay_fine', amount: 5000, desc: '赔偿¥5,000' },
            3: { type: 'pay_fine', amount: 2500, desc: '赔偿¥2,500' }
        },
        tip: '法律纠纷是做生意的常见风险。资产保护结构可以大幅降低你的损失。'
    },
    {
        id: 'economic_crisis',
        title: '经济危机',
        description: '全球经济陷入衰退，所有资产价值大幅缩水。',
        effects: {
            0: { type: 'asset_devalue', multiplier: 0.7, desc: '所有资产贬值30%' },
            1: { type: 'asset_devalue', multiplier: 0.7, desc: '所有资产贬值30%' },
            2: { type: 'asset_devalue', multiplier: 0.7, desc: '所有资产贬值30%' },
            3: { type: 'asset_devalue', multiplier: 0.8, desc: '所有资产贬值20%（信托保护）' }
        },
        tip: '经济危机总会来临。持有现金流资产的人受影响最小，因为价格下跌不影响租金收入。'
    },
    {
        id: 'policy_change',
        title: '政策变动',
        description: '政府出台新政策，对某类资产进行限制。',
        effects: {
            0: { type: 'force_sell', desc: '被迫卖出一个资产' },
            1: { type: 'force_sell', desc: '被迫卖出一个资产' },
            2: { type: 'force_sell_no_tax', desc: '被迫卖出但免税' },
            3: { type: 'choose', desc: '可以选择保留' }
        },
        tip: '政策风险是不可控的。分散投资类型可以降低政策变动带来的影响。'
    }
];

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
        title: '基金经理更换', type: 'chain',
        description: '你持有的基金更换了基金经理，市场对此反应不一，基金收益暂时下降10%。',
        effect: 'upgrade_income', cost: 0, incomeMultiplier: 0.9,
        tip: '主动管理型基金受基金经理影响很大。这也是指数基金（被动管理）受欢迎的原因之一。'
    }
];

/**
 * 抽取一张随机事件卡
 * V3: 支持满意度影响、象限过滤、财商教育、已答题过滤
 */
function drawCard(player) {
    // 检查FOMO队列
    if (player.fomoQueue && player.fomoQueue.length > 0) {
        const fomoIdx = player.fomoQueue.findIndex(f => f.triggerMonth <= player.month);
        if (fomoIdx !== -1) {
            const fomo = player.fomoQueue.splice(fomoIdx, 1)[0];
            return { type: 'fomo', card: fomo.card };
        }
    }

    // 检查社交攀比后续事件
    if (player.pendingSocialFollowup && player.pendingSocialFollowup.triggerMonth <= player.month) {
        const followup = player.pendingSocialFollowup;
        player.pendingSocialFollowup = null;
        return {
            type: 'social',
            card: {
                id: 'social_followup',
                title: '后续消息',
                description: `你发现那个同学其实贷款买的，每月还款压力巨大。而你的被动收入又增长了。谁的路更对？`,
                isFollowup: true,
                satisfactionRestore: 8,
                tip: '别人的"光鲜"很可能是负债堆出来的。资产和负债的区别，看的不是外表。'
            }
        };
    }

    // 满意度20-39时报复性消费
    if (player.satisfaction >= 20 && player.satisfaction < 40 && Math.random() < 0.4) {
        const amount = 2000 + Math.floor(Math.random() * 3000);
        return {
            type: 'expense',
            card: {
                ...CARDS.expense.find(c => c.id === 'revenge_spend'),
                amount: amount
            }
        };
    }

    // 满意度低于50时"奖励自己"选项（20%概率）
    if (player.satisfaction < 50 && player.satisfaction >= 20 && Math.random() < 0.2) {
        return {
            type: 'expense',
            card: CARDS.expense.find(c => c.id === 'treat_yourself')
        };
    }

    // 满意度40-59时"消费诱惑"概率翻倍（通过增加expense概率实现）
    const consumeBoost = (player.satisfaction >= 40 && player.satisfaction < 60) ? 0.10 : 0;

    // 心态崩溃: 满意度0-19时跳过投资机会
    const skipOpportunity = player.satisfaction < 20;

    // 社交攀比（每10月一次）
    if (player.month - player.lastSocialEventMonth >= 10 && Math.random() < 0.3) {
        player.lastSocialEventMonth = player.month;
        const socialEvents = [
            { item: '新车', cost: 3000 },
            { item: '出国旅游', cost: 3000 },
            { item: '大房子', cost: 3000 }
        ];
        const evt = socialEvents[Math.floor(Math.random() * socialEvents.length)];
        return {
            type: 'social',
            card: {
                id: 'social_comparison',
                title: '朋友圈攀比',
                description: `朋友圈刷屏：你的同学刚买了${evt.item}。你的心里有点不平衡...`,
                amount: evt.cost,
                optional: true,
                tip: '别人的"光鲜"很可能是负债堆出来的。资产和负债的区别，看的不是外表。'
            }
        };
    }

    // 15%概率触发连锁事件
    if (Math.random() < 0.15) {
        const applicable = CHAIN_EVENTS.filter(ce =>
            player.assets.some(a => a.type === ce.requireAssetType)
        );
        if (applicable.length > 0) {
            const card = applicable[Math.floor(Math.random() * applicable.length)];
            return { type: 'chain', card };
        }
    }

    // 风险事件（月份30+，5%概率，有资产时触发）
    if (player.month >= 30 && player.assets.length > 0 && Math.random() < 0.05) {
        const riskCard = RISK_EVENTS[Math.floor(Math.random() * RISK_EVENTS.length)];
        return { type: 'risk', card: riskCard };
    }

    // 财商教育（每15月触发一次检查，有合适课程时触发）
    if (player.month % 15 === 0 && player.financialIQ < 3) {
        const nextEdu = EDUCATION_CARDS.find(e => e.targetLevel === player.financialIQ + 1);
        if (nextEdu) {
            return { type: 'education', card: nextEdu };
        }
    }

    // 资产保护（月份30+，保护等级<3，10%概率）
    if (player.month >= 30 && player.protectionLevel < 3 && Math.random() < 0.1) {
        const nextProt = PROTECTION_CARDS.find(p => p.targetLevel === player.protectionLevel + 1);
        if (nextProt) {
            return { type: 'protection', card: nextProt };
        }
    }

    // 常规抽卡（概率受满意度影响）
    const rand = Math.random();
    let type;
    const oppRate = skipOpportunity ? 0 : 0.35;
    const expRate = 0.25 + consumeBoost + (skipOpportunity ? 0.15 : 0);
    const mktRate = 0.15;
    // learning gets the rest

    if (rand < oppRate) {
        type = 'opportunity';
    } else if (rand < oppRate + expRate) {
        type = 'expense';
    } else if (rand < oppRate + expRate + mktRate) {
        type = 'market';
    } else {
        type = 'learning';
    }

    let pool = CARDS[type];

    // 投资机会卡按月份和象限过滤
    if (type === 'opportunity') {
        pool = pool.filter(card => {
            if ((card.unlockMonth || 1) > player.month) return false;
            if (card.requireQuadrant && card.requireQuadrant !== player.quadrant) return false;
            // V4: 社交资本低时高级投资机会减少
            if (player.socialCapital < 30 && card.unlockMonth >= 37 && Math.random() < 0.5) return false;
            return true;
        });
    }

    // 学习卡过滤已答对的题目
    if (type === 'learning') {
        const unanswered = pool.filter(card => !player.answeredQuizIds.includes(card.id));
        if (unanswered.length > 0) {
            pool = unanswered;
        }
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
            pool = CARDS.opportunity.filter(card => {
                if ((card.unlockMonth || 1) > player.month) return false;
                if (card.requireQuadrant && card.requireQuadrant !== player.quadrant) return false;
                return true;
            });
        } else {
            pool = applicable;
        }
    }

    // 额外支出卡过滤特殊条件卡
    if (type === 'expense') {
        pool = pool.filter(card => !card.triggerCondition);
    }

    const card = pool[Math.floor(Math.random() * pool.length)];
    return { type, card };
}
