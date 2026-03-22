/**
 * 事件卡系统 V6
 * 类型: opportunity(投资机会), expense(额外支出), market(市场波动), learning(学习),
 *       chain(连锁事件), education(财商教育), fomo(FOMO事件), social(社交攀比),
 *       protection(资产保护), risk(风险事件), loan(贷款相关)
 * V6: 200+新事件, 贷款相关事件, 长线游戏事件
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
    quadrant: { label: '象限进化', badgeClass: 'badge-opportunity' },
    interaction: { label: '资产互动', badgeClass: 'badge-opportunity' },
    loan: { label: '贷款事件', badgeClass: 'badge-expense' },
    career: { label: '职业事件', badgeClass: 'badge-market' },
    windfall: { label: '意外之财', badgeClass: 'badge-opportunity' }
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
            cost: 15000, downPayment: 15000, monthlyIncome: 120,
            asset: { name: '自动售货机', type: 'business', cost: 15000, income: 120 },
            tip: '小生意也是资产！扣除电费和补货成本后，年化回报约10%。',
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
            cost: 8000, downPayment: 8000, monthlyIncome: 60,
            asset: { name: '课程版权', type: 'business', cost: 8000, income: 60 },
            tip: '知识产权也是资产！版税是最纯粹的被动收入之一——创造一次，收入持续。年化回报约9%。',
            unlockMonth: 1
        },

        // === 中级卡 (月份 13+) ===
        {
            id: 'small_apartment',
            title: '小户型出租房',
            description: '朋友介绍了一套三四线城市的小户型公寓，位置不错，租金回报率尚可。',
            cost: 350000, downPayment: 70000, monthlyIncome: 1500,
            liability: { name: '小户型房贷', total: 280000, monthly: 1800 },
            expense: { name: '小户型房贷月供', amount: 1800 },
            asset: { name: '出租小户型', type: 'realestate', cost: 350000, income: 1500 },
            tip: '房产可以是优质资产——前提是它能带来正现金流。净现金流 = ¥1500 - ¥1800 = -¥300/月。注意：目前是负现金流！',
            unlockMonth: 13
        },
        {
            id: 'big_apartment',
            title: '大户型出租房',
            description: '有一套大户型公寓正在出售，可以改成多间出租，租金收入可观。',
            cost: 800000, downPayment: 160000, monthlyIncome: 4000,
            liability: { name: '大户型房贷', total: 640000, monthly: 4200 },
            expense: { name: '大户型房贷月供', amount: 4200 },
            asset: { name: '出租大户型', type: 'realestate', cost: 800000, income: 4000 },
            tip: '这是一笔较大的投资。净现金流 = ¥4000 - ¥4200 = -¥200/月。初期负现金流，但随通胀租金会上涨。',
            unlockMonth: 13
        },
        {
            id: 'online_store',
            title: '网店转让',
            description: '一家盈利中的网店正在转让，品类稳定，客源成熟，每月有稳定利润。',
            cost: 30000, downPayment: 30000, monthlyIncome: 400,
            asset: { name: '网店', type: 'business', cost: 30000, income: 400 },
            tip: '生意是最具潜力的资产类型。好的生意能在你不工作时也为你赚钱。',
            unlockMonth: 13
        },
        {
            id: 'parking_spot',
            title: '停车位投资',
            description: '小区附近的停车位正在出售，买下后出租给住户，月租稳定。',
            cost: 150000, downPayment: 50000, monthlyIncome: 500,
            liability: { name: '车位贷款', total: 100000, monthly: 800 },
            expense: { name: '车位贷款月供', amount: 800 },
            asset: { name: '出租车位', type: 'realestate', cost: 150000, income: 500 },
            tip: '注意！月供(¥800)大于租金收入(¥500)，净现金流为负。不是所有"投资"都是好资产！',
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
            cost: 500000, downPayment: 100000, monthlyIncome: 2500,
            liability: { name: '二手房贷款', total: 400000, monthly: 2600 },
            expense: { name: '二手房贷月供', amount: 2600 },
            asset: { name: '翻新出租房', type: 'realestate', cost: 500000, income: 2500 },
            tip: '房屋翻新是提高资产价值的经典策略。净现金流 = ¥2500 - ¥2600 = -¥100/月，但增值潜力大。',
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
            cost: 2000000, downPayment: 400000, monthlyIncome: 12000,
            liability: { name: '写字楼贷款', total: 1600000, monthly: 10500 },
            expense: { name: '写字楼贷月供', amount: 10500 },
            asset: { name: '出租写字楼', type: 'realestate', cost: 2000000, income: 12000 },
            tip: '商业地产的回报率通常高于住宅。净现金流 = ¥12000 - ¥10500 = ¥1500/月。大投资大回报。',
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
            cost: 3000000, downPayment: 600000, monthlyIncome: 18000,
            liability: { name: '公寓楼贷款', total: 2400000, monthly: 15800 },
            expense: { name: '公寓楼贷月供', amount: 15800 },
            asset: { name: '小型公寓楼', type: 'realestate', cost: 3000000, income: 18000 },
            tip: '这是一笔重大投资。净现金流 = ¥18000 - ¥15800 = ¥2200/月。确保你有足够的现金储备应对意外。',
            unlockMonth: 37
        },
        {
            id: 'warehouse',
            title: '仓储物流中心',
            description: '电商蓬勃发展，一个小型仓储中心正在转让，长期租约稳定。',
            cost: 1200000, downPayment: 300000, monthlyIncome: 8000,
            liability: { name: '仓储贷款', total: 900000, monthly: 5900 },
            expense: { name: '仓储贷月供', amount: 5900 },
            asset: { name: '仓储中心', type: 'realestate', cost: 1200000, income: 8000 },
            tip: '物流仓储是被电商时代推动的优质资产。净现金流 = ¥8000 - ¥5900 = ¥2100/月。',
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

        // === 超高级卡 (月份 61+, 长线游戏) ===
        {
            id: 'hotel_investment',
            title: '精品酒店投资',
            description: '一家精品酒店正在寻找投资人，年均入住率85%，回报稳定。',
            cost: 2500000, downPayment: 500000, monthlyIncome: 15000,
            liability: { name: '酒店贷款', total: 2000000, monthly: 13200 },
            expense: { name: '酒店贷月供', amount: 13200 },
            asset: { name: '精品酒店', type: 'realestate', cost: 2500000, income: 15000 },
            tip: '酒店投资回报高但管理复杂。净现金流 = ¥15000 - ¥13200 = ¥1800/月。',
            unlockMonth: 61
        },
        {
            id: 'solar_farm',
            title: '太阳能电站',
            description: '政府补贴的太阳能发电项目，长期稳定的售电收入。',
            cost: 200000, downPayment: 60000, monthlyIncome: 2000,
            liability: { name: '电站贷款', total: 140000, monthly: 1200 },
            expense: { name: '电站贷月供', amount: 1200 },
            asset: { name: '太阳能电站', type: 'business', cost: 200000, income: 2000 },
            tip: '新能源是未来趋势。政府补贴降低了风险。净现金流 = ¥2000 - ¥1200 = ¥800/月。',
            unlockMonth: 61
        },
        {
            id: 'app_platform',
            title: 'APP平台收购',
            description: '一个用户量稳定的生活服务APP正在出售，广告和会员收入可观。',
            cost: 250000, downPayment: 100000, monthlyIncome: 3000,
            liability: { name: 'APP贷款', total: 150000, monthly: 1500 },
            expense: { name: 'APP贷月供', amount: 1500 },
            asset: { name: 'APP平台', type: 'business', cost: 250000, income: 3000 },
            tip: '互联网平台的边际成本极低。净现金流 = ¥3000 - ¥1500 = ¥1500/月。',
            unlockMonth: 61
        },
        {
            id: 'medical_clinic',
            title: '社区诊所加盟',
            description: '一家连锁社区诊所招加盟，医疗需求刚性，收入非常稳定。',
            cost: 350000, downPayment: 120000, monthlyIncome: 3500,
            liability: { name: '诊所贷款', total: 230000, monthly: 2000 },
            expense: { name: '诊所贷月供', amount: 2000 },
            asset: { name: '社区诊所', type: 'business', cost: 350000, income: 3500 },
            tip: '医疗是刚需行业，经济波动影响小。净现金流 = ¥3500 - ¥2000 = ¥1500/月。',
            unlockMonth: 61
        },
        {
            id: 'ev_charging',
            title: '电动车充电站',
            description: '电动车普及带来充电站需求，政府提供场地补贴。',
            cost: 120000, downPayment: 50000, monthlyIncome: 1500,
            liability: { name: '充电站贷款', total: 70000, monthly: 600 },
            expense: { name: '充电站贷月供', amount: 600 },
            asset: { name: '充电站', type: 'business', cost: 120000, income: 1500 },
            tip: '把握时代趋势就是把握财富机会。净现金流 = ¥1500 - ¥600 = ¥900/月。',
            unlockMonth: 61
        },
        {
            id: 'coworking_space',
            title: '共享办公空间',
            description: '市中心有一层楼可以改造成共享办公空间，灵活租赁市场需求旺盛。',
            cost: 1800000, downPayment: 360000, monthlyIncome: 12000,
            liability: { name: '共享办公贷款', total: 1440000, monthly: 9500 },
            expense: { name: '共享办公贷月供', amount: 9500 },
            asset: { name: '共享办公空间', type: 'realestate', cost: 1800000, income: 12000 },
            tip: '共享经济模式：用空间分时租赁提高坪效。净现金流 = ¥12000 - ¥9500 = ¥2500/月。',
            unlockMonth: 61
        },
        {
            id: 'mini_storage',
            title: '迷你仓储连锁',
            description: '城市居民空间有限，迷你仓储需求大增，一个成熟品牌招加盟。',
            cost: 180000, downPayment: 60000, monthlyIncome: 2200,
            liability: { name: '仓储贷款', total: 120000, monthly: 1000 },
            expense: { name: '仓储加盟贷月供', amount: 1000 },
            asset: { name: '迷你仓储', type: 'business', cost: 180000, income: 2200 },
            tip: '仓储业务运营成本低，利润率高。净现金流 = ¥2200 - ¥1000 = ¥1200/月。',
            unlockMonth: 61
        },
        {
            id: 'dividend_etf',
            title: '高股息ETF组合',
            description: '理财师帮你构建了一个分散化的高股息ETF组合，年化分红约7%。',
            cost: 80000, downPayment: 80000, monthlyIncome: 470,
            asset: { name: '高股息ETF', type: 'fund', cost: 80000, income: 470 },
            tip: 'ETF组合比单只股票风险更低，且分红稳定。被动投资的典范。',
            unlockMonth: 61
        },
        // === 终极卡 (月份 100+) ===
        {
            id: 'shopping_mall',
            title: '商业综合体份额',
            description: '一座新建商业综合体招募投资人，你可以购买一个份额获得租金分成。',
            cost: 5000000, downPayment: 1000000, monthlyIncome: 30000,
            liability: { name: '商场贷款', total: 4000000, monthly: 26400 },
            expense: { name: '商场贷月供', amount: 26400 },
            asset: { name: '商业综合体份额', type: 'realestate', cost: 5000000, income: 30000 },
            tip: '这是重量级投资。净现金流 = ¥30000 - ¥26400 = ¥3600/月。需要雄厚的资金基础。',
            unlockMonth: 100
        },
        {
            id: 'private_equity',
            title: '私募基金份额',
            description: '一位圈内好友邀你参与一只私募基金，历史年化回报15%。',
            cost: 200000, downPayment: 200000, monthlyIncome: 2500,
            asset: { name: '私募基金', type: 'fund', cost: 200000, income: 2500 },
            tip: '私募门槛高但回报也高。适合有经验的投资者。',
            unlockMonth: 100
        },
        {
            id: 'franchise_empire',
            title: '加盟帝国扩张',
            description: '你已经是成功的加盟商，总部给你更多城市的独家代理权。',
            cost: 500000, downPayment: 200000, monthlyIncome: 6000,
            liability: { name: '扩张贷款', total: 300000, monthly: 2500 },
            expense: { name: '扩张贷月供', amount: 2500 },
            asset: { name: '区域代理权', type: 'business', cost: 500000, income: 6000 },
            tip: '从单店到区域代理，这是企业规模化的终极进化。净现金流 = ¥6000 - ¥2500 = ¥3500/月。',
            unlockMonth: 100
        },
        {
            id: 'data_center',
            title: '数据中心投资',
            description: 'AI时代算力需求爆发，一个小型数据中心项目正在募资。',
            cost: 800000, downPayment: 250000, monthlyIncome: 7000,
            liability: { name: '数据中心贷款', total: 550000, monthly: 4500 },
            expense: { name: '数据中心贷月供', amount: 4500 },
            asset: { name: '数据中心', type: 'business', cost: 800000, income: 7000 },
            tip: '技术基础设施是数字时代的"房地产"。净现金流 = ¥7000 - ¥4500 = ¥2500/月。',
            unlockMonth: 100
        },
        // === 月份 130+ 超级资产 ===
        {
            id: 'resort_villa',
            title: '度假别墅群',
            description: '风景区有一组度假别墅出售，可以做民宿运营，旺季收入非常可观。',
            cost: 6000000, downPayment: 1500000, monthlyIncome: 35000,
            liability: { name: '别墅贷款', total: 4500000, monthly: 29700 },
            expense: { name: '别墅贷月供', amount: 29700 },
            asset: { name: '度假别墅群', type: 'realestate', cost: 6000000, income: 35000 },
            tip: '旅游地产回报高但有季节性。净现金流 = ¥35000 - ¥29700 = ¥5300/月。',
            unlockMonth: 130
        },
        {
            id: 'venture_fund',
            title: '创投基金LP',
            description: '一只知名创投基金向你开放了LP份额，投资早期科技公司。',
            cost: 500000, downPayment: 500000, monthlyIncome: 5000,
            asset: { name: '创投基金LP', type: 'fund', cost: 500000, income: 5000 },
            tip: '创投是高风险高回报的专业投资。只用你能承受损失的钱。',
            unlockMonth: 130
        },
        {
            id: 'industrial_park',
            title: '产业园区份额',
            description: '政府主导的产业园区招商，你可以购买一个厂房单元出租给制造企业。',
            cost: 8000000, downPayment: 2000000, monthlyIncome: 45000,
            liability: { name: '厂房贷款', total: 6000000, monthly: 39600 },
            expense: { name: '厂房贷月供', amount: 39600 },
            asset: { name: '产业园厂房', type: 'realestate', cost: 8000000, income: 45000 },
            tip: '工业地产租约长、收入稳。净现金流 = ¥45000 - ¥39600 = ¥5400/月。',
            unlockMonth: 130
        },

        // === S象限专属卡 ===
        {
            id: 'personal_studio',
            title: '个人工作室',
            description: '你可以成立自己的工作室，接更多项目，但需要一笔启动资金。',
            cost: 20000, downPayment: 20000, monthlyIncome: 300,
            asset: { name: '个人工作室', type: 'business', cost: 20000, income: 300 },
            tip: '自雇的起点：用你的技能赚钱。但记住，你还是在用时间换钱。',
            unlockMonth: 1, requireQuadrant: 'S'
        },
        {
            id: 'freelance_project',
            title: '外包项目',
            description: '一个大客户需要你做一个长期外包项目，每月有稳定收入。',
            cost: 5000, downPayment: 5000, monthlyIncome: 250,
            asset: { name: '外包合同', type: 'business', cost: 5000, income: 250 },
            tip: '外包收入是自雇者的典型收入方式。稳定但有上限。',
            unlockMonth: 1, requireQuadrant: 'S'
        },

        // === B象限专属卡 ===
        {
            id: 'hire_team',
            title: '招聘管理团队',
            description: '你的生意需要扩张，招聘一个管理团队让业务系统化运作。投入后收入大幅提升。',
            cost: 50000, downPayment: 50000, monthlyIncome: 800,
            asset: { name: '管理团队', type: 'business', cost: 50000, income: 800 },
            tip: '企业主的核心：建立系统。你不再为钱工作，团队和流程为你创造价值。',
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
            tip: '规模化是企业主的核心策略。每开一家分店，你的系统就更强大。',
            unlockMonth: 1, requireQuadrant: 'B'
        },

        // === I象限专属卡 ===
        {
            id: 'angel_invest',
            title: '天使投资',
            description: '一个初创团队向你融资，项目前景不错。作为天使投资人，你可以获得股权分红。',
            cost: 100000, downPayment: 100000, monthlyIncome: 1500,
            asset: { name: '天使投资', type: 'stock', cost: 100000, income: 1500 },
            tip: '专业投资者的高阶玩法：用资本投资有潜力的项目，获取股权回报。',
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
            tip: '企业并购是专业投资者的利器。用资本买下别人已经建好的系统。',
            unlockMonth: 1, requireQuadrant: 'I'
        }
    ],

    expense: [
        {
            id: 'car_repair', title: '汽车维修',
            description: '你的车突然抛锚了，需要支付一笔维修费用。',
            amount: 2000,
            tip: '意外支出是人生常态。理财建议：永远保留至少3个月支出的现金作为紧急备用金。'
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
            tip: '理财智慧：先建立资产，再享受奢侈。在资产还不够多的时候买奢侈品，是在消耗你的未来。'
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
            description: '4S店推出超低首付购车活动。一辆¥15万的新车只需首付2万，剩下13万贷款分期。每月还¥1,500，还8年多。',
            amount: 20000, optional: true,
            addExpense: { name: '新车贷月供', amount: 1500 },
            addLiability: { name: '新车贷', total: 130000, monthly: 1500 },
            tip: '车是典型的负债而非资产！首付2万+总还款¥1500×100月=¥150,000+利息。车到手就贬值，每月还在掏油费保险。'
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
            description: '同事神秘兮兮地拉你投资一个"内部项目"，说年化收益50%，保证翻倍。你投吗？',
            amount: 15000, optional: true,
            tip: '记住：任何号称"稳赚不赔"、承诺超高回报的投资都是骗局。正规投资年化5-15%已经很好了。'
        },
        {
            id: 'shopping_spree', title: '双十一大促',
            description: '双十一到了，满减优惠力度空前。购物车里堆满了"划算"的商品。',
            amount: 2000, optional: true,
            tip: '打折不等于省钱。如果买的是你本不需要的东西，花的每一分钱都是浪费。'
        },
        {
            id: 'travel_tempt', title: '旅游诱惑',
            description: '同事们组织了一次出国旅游，东南亚7天，费用不菲但听起来很吸引人。',
            amount: 8000, optional: true,
            satisfactionRestore: 15,
            tip: '延迟满足是富人的核心习惯之一。现在把旅游费投资出去，未来可以用被动收入去旅游。'
        },
        {
            id: 'cost_of_living_up', title: '生活成本上涨',
            description: '小区物业费调整，加上日常消费品涨价，每月固定支出增加了200元。',
            amount: 0,
            addExpenseOnly: { name: '生活成本上涨', amount: 200, inflatable: true },
            tip: '生活成本会随时间缓慢上涨。这也是为什么仅靠固定工资很危险——你的支出在增长，但工资未必跟得上。'
        },
        {
            id: 'insurance_offer', title: '保险推销',
            description: '保险公司推荐你买一份综合保障险。一次性支付¥3000，之后医疗类意外支出减半。',
            amount: 3000, optional: true, isInsurance: true,
            tip: '保险的本质是用小钱转移大风险。对于意外支出较多的人来说，保险是一种"防守型资产"。'
        },
        {
            id: 'credit_card_tempt', title: '信用卡分期诱惑',
            description: '银行打电话说可以给你¥10,000的信用卡分期额度，分18期每月只需还¥680。听起来很"轻松"。',
            amount: 0, optional: true,
            cashGain: 10000,
            addExpense: { name: '信用卡分期', amount: 680 },
            addLiability: { name: '信用卡分期', total: 12240, monthly: 680 },
            tip: '信用卡分期的真实年化利率约15-18%。看似每月只还¥680，18个月总还¥12,240——多付了22%！'
        },
        // === V6: 新增额外支出事件 ===
        {
            id: 'pet_emergency', title: '宠物急诊',
            description: '你的宠物突然生病了，需要紧急手术。',
            amount: 3500,
            tip: '宠物也是家庭成员，但宠物医疗费可不便宜。考虑给宠物买保险？'
        },
        {
            id: 'speeding_ticket', title: '超速罚单',
            description: '不小心超速了，收到一张罚单。',
            amount: 500,
            tip: '遵守交通规则不仅安全，也省钱。小额罚款积少成多也是一笔不小的支出。'
        },
        {
            id: 'dental_work', title: '牙科治疗',
            description: '牙疼不是病，疼起来要人命。你需要做一次牙科手术。',
            amount: 4000, medicalType: true,
            tip: '定期体检和口腔护理可以避免高额治疗费。预防胜于治疗。'
        },
        {
            id: 'water_damage', title: '水管爆裂',
            description: '家里水管突然爆裂，需要紧急维修并赔偿楼下邻居的损失。',
            amount: 3000,
            tip: '房屋维护是隐性支出。定期检查家中设施可以避免大额意外支出。'
        },
        {
            id: 'gym_membership', title: '健身房会员',
            description: '朋友推荐了一家高档健身房，年卡优惠价格有限期。要办卡吗？',
            amount: 4800, optional: true,
            satisfactionRestore: 10,
            tip: '健康投资很重要，但也要量力而行。免费跑步和高价健身房效果差别不大。'
        },
        {
            id: 'home_appliance', title: '家电更换',
            description: '冰箱突然坏了，食物全部变质，急需购买新冰箱。',
            amount: 2500,
            tip: '家电是消耗品，要预留更换预算。选择质量好的产品虽然贵但长期更划算。'
        },
        {
            id: 'traffic_accident', title: '轻微交通事故',
            description: '上班路上发生了一起轻微剐蹭，对方要求你赔偿修理费。',
            amount: 2000,
            tip: '车险可以覆盖大部分交通事故费用。如果没有保险，自掏腰包会很痛。'
        },
        {
            id: 'online_scam', title: '网络诈骗',
            description: '不小心点了一个钓鱼链接，银行卡被盗刷了一笔钱。',
            amount: 3000,
            tip: '网络安全意识很重要。不要点击不明链接，定期更换密码，开启二次验证。'
        },
        {
            id: 'festival_gifts', title: '节日礼物',
            description: '春节到了，需要给父母、亲戚、朋友准备礼物和红包。',
            amount: 2000,
            tip: '节日开支是可预测的。提前规划，把这部分预算纳入月度支出计划中。'
        },
        {
            id: 'moving_cost', title: '搬家费用',
            description: '房东要收回房子，你需要搬到新住所。搬家费加上新家布置费用不少。',
            amount: 3500,
            tip: '租房的不确定性就是隐性成本。拥有自己的出租房，至少你不会被"赶走"。'
        },
        {
            id: 'fashion_tempt', title: '换季购衣',
            description: '换季了，衣柜里似乎没有合适的衣服。商场正在打折。',
            amount: 2500, optional: true,
            tip: '衣服的需要和想要差距很大。胶囊衣橱理念：少而精，减少冲动消费。'
        },
        {
            id: 'subscription_trap', title: '订阅陷阱',
            description: '清理账户时发现你有5个已经不用的订阅服务，每月扣款¥150。如果不取消，这笔钱会一直扣下去。',
            amount: 0,
            addExpenseOnly: { name: '订阅服务', amount: 150, inflatable: false },
            tip: '订阅经济的陷阱：单个不贵但积少成多。定期检查所有自动扣费项目。取消它们！'
        },
        {
            id: 'education_loan', title: '孩子出国留学',
            description: '孩子拿到了国外大学offer，首年学费加生活费需要一大笔钱。',
            amount: 80000, optional: true,
            addExpense: { name: '留学费用', amount: 3000 },
            addLiability: { name: '教育贷', total: 200000, monthly: 3000 },
            tip: '教育是最好的投资——但也要考虑投资回报。留学是投资还是消费，取决于之后的发展。'
        },
        {
            id: 'elderly_care', title: '养老护理费',
            description: '父母年纪大了，需要请护工照顾，每月增加固定支出。',
            amount: 0,
            addExpenseOnly: { name: '护工费用', amount: 2000, inflatable: true },
            tip: '老龄化时代，养老支出是每个家庭必须面对的课题。护工月薪¥4000-6000，你承担一半。'
        },
        {
            id: 'crypto_fomo', title: '加密货币热潮',
            description: '朋友靠炒币赚了大钱，你心动了。投¥10,000试试？50%概率翻倍，50%概率归零。',
            amount: 10000, optional: true,
            tip: '加密货币波动极大。50%归零的风险远比你想象的高。朋友赚钱的故事背后，有无数亏损的人沉默不语。'
        },
        {
            id: 'kid_illness', title: '孩子生病',
            description: '孩子感冒发烧转为肺炎，需要住院治疗。',
            amount: 4000, medicalType: true,
            tip: '孩子的医疗支出往往来得突然。为家庭成员都买好保险是基本保障。'
        },
        {
            id: 'upgrade_phone', title: '手机碎屏',
            description: '手机屏幕摔碎了，维修费几乎等于买新的。',
            amount: 1500,
            tip: '手机壳和贴膜是最便宜的"保险"。几十块钱可能省下几千块维修费。'
        },
        {
            id: 'wedding_banquet', title: '参加同事婚礼',
            description: '这个月有3个同事结婚，每个都邀请了你。随份子钱少不了。',
            amount: 1800,
            tip: '社交开支是固定成本。提前规划这类预算，避免影响投资计划。'
        },
        {
            id: 'property_tax', title: '房产税',
            description: '新的房产税政策出台，你持有的房产需要缴纳年度税款。',
            amount: 3000,
            tip: '持有资产的成本不仅仅是月供。税费、维护、保险都要考虑在内。'
        },
        {
            id: 'business_dinner', title: '商务应酬',
            description: '有一个重要的商务饭局，你需要请客。费用不便宜。',
            amount: 1200, optional: true,
            tip: '必要的社交投资可以带来商业机会。但要区分"投资型社交"和"消费型社交"。'
        },
        {
            id: 'car_insurance', title: '车险续费',
            description: '车辆保险到期了，需要续费。',
            amount: 3000,
            tip: '保险是必要开支。选择合适的保额，不多不少，避免过度保险也避免保障不足。'
        },
        {
            id: 'laptop_broken', title: '电脑故障',
            description: '工作电脑突然坏了，数据可能丢失，急需维修或更换。',
            amount: 4000,
            tip: '工具设备是生产力的保障。重要数据一定要有备份。'
        },
        {
            id: 'beauty_spa', title: '美容SPA',
            description: '朋友拉你一起去高档SPA放松一下，价格不菲但听起来很诱人。',
            amount: 1500, optional: true,
            satisfactionRestore: 8,
            tip: '适度的放松是必要的，但要控制频率和预算。'
        },
        {
            id: 'house_decoration', title: '房屋装饰',
            description: '看到邻居家装修得很漂亮，你也想重新装饰一下自己的家。',
            amount: 5000, optional: true,
            satisfactionRestore: 12,
            tip: '居住环境确实影响幸福感，但"装饰"和"翻新"的投入产出比差很多。'
        },
        {
            id: 'concert_tickets', title: '演唱会门票',
            description: '你最喜欢的歌手要来演出了！黄牛票价格翻了好几倍。',
            amount: 2000, optional: true,
            satisfactionRestore: 15,
            tip: '体验消费也有价值，但要在预算范围内。原价买不到就别追高价票了。'
        },
        {
            id: 'gaming_setup', title: '游戏装备升级',
            description: '新出的游戏对配置要求很高，需要升级你的电脑或买新主机。',
            amount: 4000, optional: true,
            satisfactionRestore: 10,
            tip: '娱乐设备更新换代太快。明确你真正的需求，避免为营销噱头买单。'
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
        },
        // === V6: 新增市场波动事件 ===
        {
            id: 'inflation_spike', title: '通胀飙升',
            description: '物价飞涨，你的固定支出增加了15%，但资产价值也水涨船高。',
            inflationEffect: { expenseIncrease: 0.15, assetIncrease: 0.1 },
            tip: '通胀是双刃剑：负债被稀释，但生活成本也上升。持有资产的人受益更多。'
        },
        {
            id: 'tech_disruption', title: '科技颠覆',
            description: 'AI技术革命冲击传统行业，你的部分生意受到影响，收入下降。',
            assetType: 'business', incomeMultiplier: 0.75,
            tip: '技术变革是最大的商业风险之一。持续学习和创新是应对颠覆的唯一方法。'
        },
        {
            id: 'realestate_bubble', title: '房地产泡沫',
            description: '房价已经涨到不可思议的高度！你的房产价值暴涨，但泡沫似乎随时可能破裂。',
            assetType: 'realestate', multiplier: 1.8,
            tip: '泡沫总会破裂。问题是：你能在破裂前卖出吗？还是继续持有等现金流？'
        },
        {
            id: 'pandemic_effect', title: '疫情冲击',
            description: '突发公共卫生事件，经济活动暂停，你的生意收入暂时下降40%。',
            assetType: 'business', incomeMultiplier: 0.6,
            tip: '黑天鹅事件无法预测。保持充足的现金储备是抵御意外的最好方式。'
        },
        {
            id: 'stock_recovery', title: '股市反弹',
            description: '经历下跌后，股市强劲反弹！你的股票资产价值回升30%。',
            assetType: 'stock', multiplier: 1.3,
            tip: '市场总是会恢复的——如果你有耐心持有。恐慌卖出是最大的敌人。'
        },
        {
            id: 'currency_devalue', title: '汇率波动',
            description: '人民币贬值，你的部分海外资产以人民币计价升值了。',
            assetType: 'fund', multiplier: 1.15,
            tip: '持有一些海外资产可以对冲汇率风险。全球化配置是分散风险的高级策略。'
        },
        {
            id: 'green_policy', title: '绿色经济政策',
            description: '政府大力推动绿色经济，新能源相关资产获得额外补贴。',
            assetType: 'business', incomeMultiplier: 1.25,
            tip: '政策导向是重要的投资信号。顺势而为往往事半功倍。'
        },
        {
            id: 'rental_regulation', title: '租金管控政策',
            description: '政府出台租金管控政策，你的出租房租金被限制上涨。',
            assetType: 'realestate', incomeMultiplier: 0.9,
            tip: '政策风险是房地产投资的一部分。多城市分散投资可以降低单一政策的影响。'
        },
        {
            id: 'bond_yield_rise', title: '国债收益率上升',
            description: '国债收益率走高，你的债券类资产收益跟着提升。',
            assetType: 'fund', incomeMultiplier: 1.15,
            tip: '债券市场和利率密切相关。关注央行政策可以帮你更好地配置债券类资产。'
        },
        {
            id: 'market_crash', title: '市场闪崩',
            description: '金融市场突然暴跌！所有资产价值缩水25%！',
            globalMultiplier: 0.75,
            tip: '市场崩盘对所有人一视同仁。但手握现金的人能在低价买入优质资产。危机就是机遇。'
        },
        {
            id: 'ecommerce_boom', title: '电商爆发',
            description: '线上消费持续增长，你的网店和电商相关资产收入大增。',
            assetType: 'business', incomeMultiplier: 1.3,
            tip: '线上经济的增长还远未到顶。拥有线上业务的人会持续受益。'
        },
        {
            id: 'population_aging', title: '老龄化效应',
            description: '老龄化社会到来，医疗和养老相关产业蓬勃发展。',
            assetType: 'business', incomeMultiplier: 1.15,
            tip: '人口趋势是最确定的长期趋势。医疗养老是确定性最高的赛道之一。'
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
            id: 'q2', question: '穷人和富人在财务行为上最大的区别是？',
            options: ['学历高低', '收入多少', '对资产和负债的理解', '运气好坏'],
            answer: 2, reward: 1000,
            explanation: '财务研究表明：富人倾向于买入资产，而多数人买入了他们以为是资产的负债。关键不是收入多少，而是你如何使用你的收入。'
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
            explanation: '用结余购买资产，让资产为你工作，这是走向财务自由的核心路径。加薪后同步提升消费是"收支循环"的陷阱。'
        },
        {
            id: 'q6', question: '"收支死循环"是指什么？',
            options: ['一种经济术语', '赚更多花更多的恶性循环', '股市的追涨杀跌', '创业竞争'],
            answer: 1, reward: 1000,
            explanation: '"收支死循环"是指人们不断工作赚取更多收入，但同时增加更多支出，永远无法实现财务自由的状态。'
        },
        {
            id: 'q7', question: '一套月供3000元的自住房，对你来说是？',
            options: ['既是资产也是负债', '资产，因为房子会增值', '都不是', '负债，因为它每月从你口袋拿走3000元'],
            answer: 3, reward: 1500,
            explanation: '从现金流角度看，自住房是负债——它每月从你口袋里拿走钱（月供、维护费等），而不是放钱进来。'
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
            explanation: '聪明的投资者通过公司、房产折旧、合理的资产结构来合法降低税负。税法的设计本身就在鼓励投资和创业。'
        },
        // === V6: 新增学习题目 ===
        {
            id: 'q17', question: '什么是"杠杆"在投资中的含义？',
            options: ['用别人的钱来放大投资回报', '一种健身器材', '贷款利率', '股票交易手续费'],
            answer: 0, reward: 1500,
            explanation: '杠杆就是借助外力（通常是借款）来放大投资回报。用10万首付买50万的房子，就是5倍杠杆。收益放大，但风险也放大。'
        },
        {
            id: 'q18', question: '以下哪个最接近"收入象限"中B象限的特征？',
            options: ['自己做所有的事', '拥有一个能自动运转的系统', '帮别人打工', '纯靠投资赚钱'],
            answer: 1, reward: 1500,
            explanation: 'B象限的核心是建立系统。你不需要亲自参与日常运营，系统（团队、流程、品牌）会为你工作。'
        },
        {
            id: 'q19', question: '什么是"复利效应"？',
            options: ['利息加利息，收益像雪球般增长', '复杂的利率计算', '多个银行同时存款', '反复申请贷款'],
            answer: 0, reward: 1000,
            explanation: '复利是"利滚利"——你的收益会产生新的收益。爱因斯坦称复利为"世界第八大奇迹"。时间越长，效果越惊人。'
        },
        {
            id: 'q20', question: '以下哪种是最被动的收入？',
            options: ['自由职业收入', '租金收入', '加班工资', '送外卖收入'],
            answer: 1, reward: 1000,
            explanation: '租金收入是典型的被动收入——房子在那里，租客每月付租金，你不需要每天去"上班"。自由职业虽然自由，但仍是用时间换钱。'
        },
        {
            id: 'q21', question: '"收入象限"中，E代表什么？',
            options: ['企业家', '雇员', '经济学家', '专家'],
            answer: 1, reward: 1000,
            explanation: 'E=Employee（雇员），S=Self-employed（自雇），B=Business owner（企业主），I=Investor（投资者）。大多数人处于E象限。'
        },
        {
            id: 'q22', question: '负债率多少算健康？',
            options: ['0%最好', '30%以下', '50%以下', '越高越好'],
            answer: 1, reward: 1000,
            explanation: '一般认为负债率（月还款额/月收入）在30%以下比较健康。超过50%就有较高的财务风险。0%虽然安全但可能错失杠杆机会。'
        },
        {
            id: 'q23', question: '什么是"机会成本"？',
            options: ['投资的手续费', '选择一个选项后放弃的其他最佳选项的价值', '做生意的成本', '抓住机会的花费'],
            answer: 1, reward: 1500,
            explanation: '把5万元存银行，机会成本就是这5万元用来投资可能获得的更高收益。每一次选择都有机会成本。'
        },
        {
            id: 'q24', question: '为什么现金不是好资产？',
            options: ['因为现金会被偷', '因为通货膨胀会让现金贬值', '因为银行利率太低', '现金其实是好资产'],
            answer: 1, reward: 1000,
            explanation: '通胀让现金购买力持续下降。每年3%的通胀意味着10年后你的钱只值原来的74%。现金是"确定会贬值的资产"。'
        },
        {
            id: 'q25', question: '什么是"沉没成本"？',
            options: ['投到水里的钱', '已经花掉且无法收回的成本', '打折后的差价', '建筑地基的费用'],
            answer: 1, reward: 1500,
            explanation: '已经花掉且无法收回的钱就是沉没成本。理性决策应该忽略沉没成本，只看未来的收益和风险。'
        },
        {
            id: 'q26', question: '以下哪个是"好习惯"？',
            options: ['先消费再存剩下的', '先存/投资一部分，再消费', '等发财了再理财', '有多少花多少'],
            answer: 1, reward: 1000,
            explanation: '这就是"先付自己"原则。每月收入先拿出一定比例用于储蓄和投资，剩余的才是消费预算。'
        },
        {
            id: 'q27', question: '什么情况下应该卖出资产？',
            options: ['市场下跌恐慌时', '有更好的投资机会需要资金时', '朋友都在卖的时候', '资产刚买就涨了一点时'],
            answer: 1, reward: 1500,
            explanation: '卖出资产应该是理性决策：要么有更好的投资机会，要么基本面发生了不可逆的变化。恐慌和跟风不是理由。'
        },
        {
            id: 'q28', question: '为什么多元化投资很重要？',
            options: ['让账单看起来更复杂', '分散风险，避免全部亏损', '因为银行要求的', '给理财顾问更多佣金'],
            answer: 1, reward: 1000,
            explanation: '不同资产类别在不同市场环境下表现不同。股票跌时房产可能涨，反之亦然。多元化让你的整体风险降低。'
        },
        {
            id: 'q29', question: '信用评分主要受什么影响？',
            options: ['年龄和性别', '还款记录和负债比率', '银行余额多少', '社交媒体关注数'],
            answer: 1, reward: 1000,
            explanation: '信用评分主要看你的还款历史、负债水平、信用历史长度、信用类型多样性等。按时还款是维持好信用的关键。'
        },
        {
            id: 'q30', question: '以下哪种心态最有利于投资？',
            options: ['一夜暴富', '长期主义', '跟风操作', '追涨杀跌'],
            answer: 1, reward: 1500,
            explanation: '长期主义是最重要的投资心态。巴菲特说"我的财富来自于美国，长期投资，和复利效应的组合"。'
        },
        {
            id: 'q31', question: '什么是"现金流"？',
            options: ['银行取出现金', '收入减去支出的净额', '现金的流通量', '存款利息'],
            answer: 1, reward: 1000,
            explanation: '现金流 = 收入 - 支出。正现金流意味着你的钱在增加，负现金流意味着你在"失血"。管理好现金流是财务健康的基础。'
        },
        {
            id: 'q32', question: '贷款买资产算"好负债"的前提是？',
            options: ['利率很低', '资产产生的收入大于贷款还款额', '别人都这样做', '银行愿意借'],
            answer: 1, reward: 1500,
            explanation: '好负债的核心：资产产生的收入要能覆盖贷款成本并有盈余。月租金3000的房子，月供2000，正现金流1000，这就是好负债。'
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
    },
    // === V6: 新增风险事件 ===
    {
        id: 'cyber_attack',
        title: '网络攻击',
        description: '你的业务系统遭到黑客攻击，客户数据泄露，面临巨额赔偿。',
        effects: {
            0: { type: 'pay_fine', amount: 10000, desc: '赔偿¥10,000' },
            1: { type: 'pay_fine', amount: 8000, desc: '赔偿¥8,000' },
            2: { type: 'pay_fine', amount: 5000, desc: '赔偿¥5,000' },
            3: { type: 'pay_fine', amount: 3000, desc: '赔偿¥3,000（信托保护）' }
        },
        tip: '数字时代的网络安全风险不可忽视。定期更新安全系统是必要的投入。'
    },
    {
        id: 'partner_fraud',
        title: '合伙人诈骗',
        description: '你的一个商业合伙人卷款潜逃！部分投资打了水漂。',
        effects: {
            0: { type: 'lose_asset', desc: '失去1个资产' },
            1: { type: 'lose_asset', desc: '失去1个资产' },
            2: { type: 'pay_fine', amount: 8000, desc: '损失¥8,000' },
            3: { type: 'pay_fine', amount: 4000, desc: '损失¥4,000（信托保护）' }
        },
        tip: '选择合伙人要比选择投资更谨慎。法律文件和资产隔离是最好的防线。'
    },
    {
        id: 'market_manipulation',
        title: '市场操纵丑闻',
        description: '你投资的某只基金被查出市场操纵行为，基金被暂停交易。',
        effects: {
            0: { type: 'asset_devalue', multiplier: 0.5, desc: '基金资产贬值50%' },
            1: { type: 'asset_devalue', multiplier: 0.6, desc: '基金资产贬值40%' },
            2: { type: 'asset_devalue', multiplier: 0.7, desc: '基金资产贬值30%' },
            3: { type: 'asset_devalue', multiplier: 0.8, desc: '基金资产贬值20%' }
        },
        tip: '选择合规的投资机构和产品。监管套利看似诱人，实则风险巨大。'
    }
];

/**
 * V5: 资产互动事件（已有资产触发新决策）
 */
const ASSET_INTERACTION_EVENTS = [
    {
        id: 'tenant_negotiate',
        requireAssetType: 'realestate',
        requireAssetCount: 1,
        title: '租客要求降租',
        description: '你的租客因为经济困难要求降低20%租金。拒绝的话他可能搬走，导致2个月空置。',
        choices: [
            { label: '同意降租', effect: 'reduce_income', multiplier: 0.8, satisfactionDelta: 3, socialDelta: 5,
              tip: '留住租客，长期关系更稳定' },
            { label: '拒绝，冒空置风险', effect: 'risk_vacancy', vacancyMonths: 2, chanceOfLeaving: 0.5,
              tip: '坚持价格，但可能损失2个月租金' }
        ],
        tip: '租户关系管理是房产投资的重要一环。'
    },
    {
        id: 'property_renovation',
        requireAssetType: 'realestate',
        requireAssetCount: 2,
        title: '批量装修升级',
        description: '装修公司给你批量优惠：花¥8,000统一升级你的所有出租房，租金可以提高25%。',
        choices: [
            { label: '批量装修 (-¥8,000)', effect: 'upgrade_all_income', cost: 8000, multiplier: 1.25,
              tip: '规模化管理的优势' },
            { label: '算了，现在不需要', effect: 'none',
              tip: '谨慎投入也是一种策略' }
        ],
        tip: '拥有多个同类资产时，可以获得规模化管理优势。'
    },
    {
        id: 'business_partnership',
        requireAssetType: 'business',
        requireAssetCount: 2,
        title: '商业合作提案',
        description: '有人看中了你的生意版图，提议合作：你投入¥15,000，他负责运营，利润五五分。新生意预计月入¥1,200。',
        choices: [
            { label: '合作 (-¥15,000)', effect: 'add_asset', cost: 15000,
              asset: { name: '合作生意', type: 'business', cost: 15000, income: 600 },
              monthlyIncome: 600, tip: '合作就是分成' },
            { label: '不信任，拒绝', effect: 'none',
              tip: '拒绝也无妨' }
        ],
        tip: '生意合作是企业扩张的常见方式，但需要甄别合作伙伴。'
    },
    {
        id: 'stock_split_choice',
        requireAssetType: 'stock',
        requireAssetCount: 1,
        title: '股票分拆选择',
        description: '你持有的一只股票要进行分拆重组。你可以选择：保留原股（稳定分红）或转换为成长股（分红减半但价值可能翻倍）。',
        choices: [
            { label: '保留原股', effect: 'none',
              tip: '稳健策略' },
            { label: '转换成长股', effect: 'transform_stock', incomeMultiplier: 0.5, valueMultiplier: 1.5,
              tip: '用短期收入换长期升值' }
        ],
        tip: '价值投资vs成长投资，没有绝对的对错。'
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
    },
    // === V6: 新增连锁事件 ===
    {
        id: 'natural_disaster', requireAssetType: 'realestate',
        title: '自然灾害', type: 'chain',
        description: '暴雨导致你的出租房被淹，需要花钱修复。维修期间3个月无租金收入。',
        effect: 'lose_income_months', months: 3, repairCost: 5000,
        tip: '自然灾害风险不可忽视。房产保险可以覆盖大部分损失。'
    },
    {
        id: 'viral_marketing', requireAssetType: 'business',
        title: '爆款营销', type: 'chain',
        description: '你的生意突然在社交媒体上走红，短视频播放量破百万！收入暴涨50%。',
        effect: 'upgrade_income', cost: 0, incomeMultiplier: 1.5,
        tip: '网络效应可以让小生意一夜成名。保持产品质量才能留住新客户。'
    },
    {
        id: 'key_employee_quit', requireAssetType: 'business',
        title: '核心员工离职', type: 'chain',
        description: '你的得力干将被竞争对手挖走了，生意效率下降，利润减少20%。',
        effect: 'upgrade_income', cost: 0, incomeMultiplier: 0.8,
        tip: '人才是最重要的资产。建立良好的激励机制才能留住核心团队。'
    },
    {
        id: 'dividend_surprise', requireAssetType: 'stock',
        title: '意外高分红', type: 'chain',
        description: '你持有的一家公司业绩超预期，宣布发放特别分红！你获得一笔额外收入。',
        effect: 'cash_bonus', amount: 5000,
        tip: '选择优质公司长期持有，偶尔会有意外惊喜。这就是价值投资的魅力。'
    },
    {
        id: 'tenant_damage', requireAssetType: 'realestate',
        title: '租客损坏房屋', type: 'chain',
        description: '租客搬走后你发现房屋被严重损坏，需要花钱修复。',
        effect: 'pay_fine', amount: 4000,
        tip: '收取合理的押金可以减少此类损失。筛选租客也很重要。'
    },
    {
        id: 'government_subsidy', requireAssetType: 'business',
        title: '政府补贴', type: 'chain',
        description: '你的生意符合政府扶持政策，获得了一笔创业补贴！',
        effect: 'cash_bonus', amount: 8000,
        tip: '关注政府的产业政策和补贴信息，合理利用政策红利。'
    },
    {
        id: 'fund_bonus_dividend', requireAssetType: 'fund',
        title: '基金年终大分红', type: 'chain',
        description: '你持有的基金年底清算，分红比预期高出很多！',
        effect: 'cash_bonus', amount: 3000,
        tip: '选择历史分红记录好的基金，长期来看能获得更稳定的回报。'
    },
    {
        id: 'supply_chain_issue', requireAssetType: 'business',
        title: '供应链问题', type: 'chain',
        description: '原材料价格上涨，你的生意成本增加，利润下降15%。',
        effect: 'upgrade_income', cost: 0, incomeMultiplier: 0.85,
        tip: '供应链风险是生意的常见挑战。建立多个供应商渠道可以降低风险。'
    },
    {
        id: 'stock_ipo_gain', requireAssetType: 'stock',
        title: '持股公司IPO', type: 'chain',
        description: '你投资的一家公司成功IPO上市！股价暴涨，你的股权价值翻了3倍！',
        effect: 'force_sell', multiplier: 3.0,
        tip: 'IPO是投资者梦寐以求的退出方式。但记得及时兑现利润，纸面富贵不是真富贵。'
    },
    {
        id: 'realestate_appreciation', requireAssetType: 'realestate',
        title: '地铁规划利好', type: 'chain',
        description: '政府公布了新的地铁线路规划，你的房产正好在站点附近！价值上涨40%。',
        effect: 'asset_appreciate', multiplier: 1.4,
        tip: '跟着城市规划买房是房产投资的黄金法则。信息就是财富。'
    },
    {
        id: 'business_award', requireAssetType: 'business',
        title: '获得行业大奖', type: 'chain',
        description: '你的生意获得了行业大奖，品牌知名度大增，客户量上涨，收入增加25%！',
        effect: 'upgrade_income', cost: 0, incomeMultiplier: 1.25,
        tip: '品牌价值是无形资产。好口碑能带来源源不断的客户。'
    }
];

/**
 * V6: 贷款相关事件
 */
const LOAN_EVENTS = [
    {
        id: 'loan_rate_drop',
        title: '贷款利率优惠',
        description: '银行通知你，由于你信用良好，给你的贷款利率降低了！月供减少10%。',
        effect: 'reduce_loan_payment', multiplier: 0.9,
        requireLoan: true,
        tip: '良好的信用记录是宝贵的无形资产。它能为你节省大量利息支出。'
    },
    {
        id: 'loan_penalty',
        title: '逾期罚息',
        description: '这个月现金紧张，贷款差点逾期！银行收取了一笔罚息。',
        effect: 'pay_fine', amount: 1000,
        requireLoan: true, creditScoreDelta: -30,
        tip: '贷款逾期不仅要付罚息，还会严重影响信用评分。一定要预留还款资金。'
    },
    {
        id: 'refinance_offer',
        title: '贷款重组机会',
        description: '银行提供贷款重组方案：降低月供但延长还款期。总利息会增加，但现金流改善。',
        effect: 'refinance', monthlyReduction: 0.7, termExtension: 1.5,
        requireLoan: true, optional: true,
        tip: '重组降低了短期压力但增加了总成本。权衡短期现金流和长期利息负担。'
    },
    {
        id: 'credit_score_up',
        title: '信用评分提升',
        description: '你连续按时还款，银行提升了你的信用评级。贷款额度增加！',
        effect: 'credit_boost', creditScoreDelta: 30,
        requireLoan: true,
        tip: '信用评分像是你的"财务成绩单"。持续优秀的还款记录是提分的关键。'
    },
    {
        id: 'loan_collector',
        title: '催收电话',
        description: '因为现金流紧张，你的某笔贷款已经逾期。催收公司开始打电话了。',
        effect: 'pay_fine', amount: 2000, creditScoreDelta: -50,
        requireLoan: true,
        tip: '逾期到催收阶段会严重影响信用。宁可卖掉一个资产也不要让贷款逾期。',
        triggerCondition: 'low_cash'
    },
    {
        id: 'early_repay_bonus',
        title: '提前还贷优惠',
        description: '银行推出限时活动：提前还清贷款可免除剩余利息的20%。',
        effect: 'early_repay_discount', discount: 0.2,
        requireLoan: true, optional: true,
        tip: '提前还贷节省利息，但也要考虑这笔钱投资出去是否收益更高。'
    }
];

/**
 * V6: 职业事件
 */
const CAREER_EVENTS = [
    {
        id: 'salary_raise',
        title: '加薪通知',
        description: '老板对你的工作很满意，决定给你加薪15%！',
        effect: 'salary_change', multiplier: 1.15,
        tip: '加薪很好，但别忘了避免"收入陷阱"——赚得越多，花得越多。把多出的部分用于投资。'
    },
    {
        id: 'salary_cut',
        title: '降薪通知',
        description: '公司效益不好，全员降薪10%。',
        effect: 'salary_change', multiplier: 0.9,
        tip: '这就是为什么不能只依赖工资收入。被动收入才是你的安全网。'
    },
    {
        id: 'layoff_scare',
        title: '裁员风波',
        description: '公司正在裁员，你虽然保住了工作，但内心很不安。满意度下降。',
        effect: 'satisfaction_change', delta: -15,
        tip: '就业危机是最好的创业/投资动力。纯靠工资收入永远没有真正的安全感。'
    },
    {
        id: 'overtime_bonus',
        title: '加班奖金',
        description: '这个月项目赶工，你拿到了一大笔加班费。',
        effect: 'cash_bonus', amount: 3000,
        tip: '加班费是用时间换来的额外收入。值得高兴，但更值得思考：如何让钱为你工作？'
    },
    {
        id: 'headhunter_call',
        title: '猎头电话',
        description: '猎头打来电话，对方公司开出高于目前30%的薪资。但需要搬到另一个城市。',
        effect: 'job_offer', salaryMultiplier: 1.3, movingCost: 5000, optional: true,
        tip: '高薪诱惑要全面考虑：搬迁成本、生活成本、社交网络、已有资产管理等。'
    },
    {
        id: 'promotion',
        title: '晋升机会',
        description: '你有机会晋升为管理层，工资涨20%，但要付出更多时间和精力。',
        effect: 'salary_change', multiplier: 1.2,
        satisfactionDelta: -5,
        tip: '晋升意味着更高的工资收入，但也意味着更少的时间用于发展被动收入。'
    },
    {
        id: 'side_income',
        title: '兼职收入',
        description: '你利用业余时间接了一个私活，获得了一笔额外收入。',
        effect: 'cash_bonus', amount: 2000,
        tip: '兼职是自雇的起点。但记住：兼职收入还是在用时间换钱。'
    },
    {
        id: 'training_opportunity',
        title: '公司培训',
        description: '公司提供免费培训机会，学完后有机会获得更好的职位。',
        effect: 'skill_up',
        tip: '持续学习是职场竞争力的保障。利用公司资源提升自己，一举多得。'
    }
];

/**
 * V6: 意外之财事件
 */
const WINDFALL_EVENTS = [
    {
        id: 'lottery_small',
        title: '彩票小奖',
        description: '你买的彩票中了一个小奖！虽然不多，但也是意外之喜。',
        amount: 2000,
        tip: '小概率事件不能作为理财策略。偶尔中奖开心就好，不要沉迷。'
    },
    {
        id: 'inheritance',
        title: '遗产继承',
        description: '一位远房亲戚去世，留给你一笔小遗产。',
        amount: 10000,
        tip: '意外之财最容易被挥霍。把它投入资产，让它持续为你工作。'
    },
    {
        id: 'tax_refund',
        title: '退税',
        description: '年度税务核算后，你获得了一笔退税。',
        amount: 3000,
        tip: '退税是你之前多交的钱。合理的税务规划可以让你更早拿到这笔钱用于投资。'
    },
    {
        id: 'found_money',
        title: '找到被遗忘的存款',
        description: '整理旧物时发现了一张很久以前的定期存款单，已经到期可以取出。',
        amount: 5000,
        tip: '这是过去的你送给现在的你的礼物。把它投入到能产生被动收入的资产中去。'
    },
    {
        id: 'bonus_unexpected',
        title: '意外奖金',
        description: '公司年底业绩超额完成，发放了一笔额外的绩效奖金。',
        amount: 4000,
        tip: '奖金是"先付自己"的好机会。至少把一半用于投资或存入应急基金。'
    },
    {
        id: 'refund_received',
        title: '退款到账',
        description: '之前一笔纠纷终于解决了，对方赔偿了你的损失。',
        amount: 3000,
        tip: '维权也是一种"资产保护"行为。了解自己的权利，该争取就争取。'
    },
    {
        id: 'stock_dividend_special',
        title: '特别分红',
        description: '你之前投资的一家公司宣布特别分红，比平时多了很多！',
        amount: 6000,
        tip: '特别分红通常发生在公司业绩特别好的年份。选择优质公司长期持有是获取此类回报的关键。'
    },
    {
        id: 'friend_repay',
        title: '朋友还钱',
        description: '一个朋友终于还了你很久以前借给他的钱，你都快忘了这回事。',
        amount: 2000,
        tip: '借钱给朋友要谨慎。能要回来是幸运，要不回来是常态。'
    }
];

/**
 * V6: 新增更多资产互动事件
 */
const EXTRA_INTERACTION_EVENTS = [
    {
        id: 'merge_businesses',
        requireAssetType: 'business',
        requireAssetCount: 3,
        title: '生意整合机会',
        description: '你拥有多个生意，有人建议你整合成一个品牌运营。花¥20,000重组，总收入可以提升40%。',
        choices: [
            { label: '整合重组 (-¥20,000)', effect: 'upgrade_all_income', cost: 20000, multiplier: 1.4,
              tip: '品牌化运营是企业主的高阶操作' },
            { label: '各自独立运营', effect: 'none',
              tip: '分散也有分散的好处' }
        ],
        tip: '规模化、品牌化是从小生意到大企业的关键一步。'
    },
    {
        id: 'portfolio_rebalance',
        requireAssetType: 'fund',
        requireAssetCount: 2,
        title: '投资组合再平衡',
        description: '理财顾问建议你重新调整基金配置。花¥3,000咨询费，但预计收益提升15%。',
        choices: [
            { label: '接受建议 (-¥3,000)', effect: 'upgrade_all_income', cost: 3000, multiplier: 1.15,
              tip: '专业的事交给专业的人' },
            { label: '自己管理', effect: 'none',
              tip: '省下顾问费' }
        ],
        tip: '定期再平衡是专业投资者的基本操作。'
    },
    {
        id: 'tenant_long_term',
        requireAssetType: 'realestate',
        requireAssetCount: 1,
        title: '租客续约谈判',
        description: '你的长期租客合约到期。他愿意签3年长约但要求降5%租金。不签的话可能空置1-2月。',
        choices: [
            { label: '签长约(租金-5%)', effect: 'reduce_income', multiplier: 0.95, satisfactionDelta: 5,
              tip: '稳定比最大化更重要' },
            { label: '不签，寻找新租客', effect: 'risk_vacancy', vacancyMonths: 2, chanceOfLeaving: 0.7,
              tip: '可能找到出价更高的租客' }
        ],
        tip: '长期稳定租客的价值往往大于那5%的租金差。'
    },
    {
        id: 'cross_sell',
        requireAssetType: 'business',
        requireAssetCount: 2,
        title: '交叉销售机会',
        description: '你发现两个生意的客户群有重叠，可以互相导流。预计收入各增10%。',
        choices: [
            { label: '推行交叉销售', effect: 'upgrade_all_income', cost: 0, multiplier: 1.1,
              tip: '协同效应是多元化经营的回报' },
            { label: '暂时不需要', effect: 'none',
              tip: '保持简单' }
        ],
        tip: '拥有多个生意的最大好处就是协同效应——1+1>2。'
    }
];

/**
 * 抽取一张随机事件卡
 * V6: 支持满意度影响、象限过滤、财商教育、已答题过滤、贷款事件、职业事件、意外之财
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
            { item: '新车', cost: 5000 },
            { item: '出国旅游', cost: 3000 },
            { item: '名牌包', cost: 4000 },
            { item: '新款手机', cost: 2000 }
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

    // V6: 8%概率触发贷款事件（需有贷款：包括初始负债和个人贷款）
    if (player.liabilities && player.liabilities.length > 0 && Math.random() < 0.08) {
        const applicable = LOAN_EVENTS.filter(evt => {
            if (evt.triggerCondition === 'low_cash' && player.cash > 5000) return false;
            return true;
        });
        if (applicable.length > 0) {
            const card = applicable[Math.floor(Math.random() * applicable.length)];
            return { type: 'loan', card };
        }
    }

    // V6: 7%概率触发职业事件
    if (Math.random() < 0.07) {
        const card = CAREER_EVENTS[Math.floor(Math.random() * CAREER_EVENTS.length)];
        return { type: 'career', card };
    }

    // V6: 5%概率触发意外之财
    if (Math.random() < 0.05) {
        const card = WINDFALL_EVENTS[Math.floor(Math.random() * WINDFALL_EVENTS.length)];
        return { type: 'windfall', card };
    }

    // V5+V6: 12%概率触发资产互动事件（需持有足够资产）
    if (Math.random() < 0.12 && player.month >= 13) {
        const allInteractions = [...ASSET_INTERACTION_EVENTS, ...EXTRA_INTERACTION_EVENTS];
        const applicable = allInteractions.filter(evt => {
            const count = player.assets.filter(a => a.type === evt.requireAssetType).length;
            return count >= evt.requireAssetCount;
        });
        if (applicable.length > 0) {
            const card = applicable[Math.floor(Math.random() * applicable.length)];
            return { type: 'interaction', card };
        }
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
