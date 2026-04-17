// ========== 分类商品数据 ==========
var categoryData = {
    '001': {
        name: '教材捡漏 📖', desc: '正版教材低至1折',
        items: [
            { id: 'p101', title: '高等数学同济第七版 上下册 几乎全新无笔记', price: 15, original: 89, emoji: '📘', wants: 23, seller: '已保研学姐', tags: ['包邮'] },
            { id: 'p102', title: '线性代数 同济六版 有少量铅笔标注 可擦', price: 8, original: 45, emoji: '📗', wants: 15, seller: '大四清仓', tags: [] },
            { id: 'p103', title: '大学物理 马文蔚 上下册+习题解答 三本打包', price: 20, original: 120, emoji: '📕', wants: 31, seller: '物理系学长', tags: ['包邮'] },
            { id: 'p104', title: '考研英语一真题 2015-2024 张剑黄皮书', price: 25, original: 78, emoji: '📙', wants: 56, seller: '上岸选手', tags: ['包邮'] },
            { id: 'p105', title: 'C语言程序设计 谭浩强 第五版 九成新', price: 5, original: 36, emoji: '📓', wants: 8, seller: '计科大二', tags: [] },
            { id: 'p106', title: '概率论与数理统计 浙大版 全新未拆封', price: 12, original: 49, emoji: '📔', wants: 19, seller: '买多了转', tags: ['全新'] },
            { id: 'p107', title: '毛概+思修+马原 三本合售 有重点标注', price: 10, original: 95, emoji: '📒', wants: 42, seller: '期末救星', tags: [] },
            { id: 'p108', title: '数据结构 严蔚敏 C语言版 含课后答案', price: 9, original: 42, emoji: '📚', wants: 27, seller: '算法爱好者', tags: ['包邮'] }
        ]
    },
    '002': {
        name: '手机数码 📱', desc: '热门3C装备轻松入',
        items: [
            { id: 'p201', title: '索尼WH-1000XM4 头戴降噪耳机 黑色 九成新', price: 850, original: 2299, emoji: '🎧', wants: 34, seller: '数码达人', tags: ['可验货'] },
            { id: 'p202', title: 'iPad Air5 64G WiFi版 带笔和键盘壳', price: 2800, original: 5499, emoji: '📱', wants: 67, seller: '换新出旧', tags: [] },
            { id: 'p203', title: '罗技G502无线鼠标 用了半年 手感极佳', price: 180, original: 549, emoji: '🖱️', wants: 12, seller: '游戏退坑', tags: ['包邮'] },
            { id: 'p204', title: '小米充电宝 20000mAh 50W快充 全新未拆', price: 120, original: 199, emoji: '🔋', wants: 45, seller: '中奖转卖', tags: ['全新','包邮'] },
            { id: 'p205', title: 'AirPods Pro 2 USB-C版 AppleCare到明年', price: 1100, original: 1899, emoji: '🎵', wants: 89, seller: '果粉换代', tags: ['可验货'] },
            { id: 'p206', title: '闪迪256G U盘 USB3.2 读速400MB 全新', price: 89, original: 169, emoji: '💾', wants: 7, seller: '多买了一个', tags: ['全新'] },
            { id: 'p207', title: '机械键盘 Cherry红轴 87键 白色背光', price: 220, original: 599, emoji: '⌨️', wants: 18, seller: '键圈玩家', tags: [] },
            { id: 'p208', title: '小米手环8 NFC版 带两条替换表带', price: 95, original: 259, emoji: '⌚', wants: 22, seller: '运动达人', tags: ['包邮'] }
        ]
    },
// CATEGORY_DATA_APPEND
    '003': {
        name: '潮玩手办 🎮', desc: '热门IP手办随手入',
        items: [
            { id: 'p301', title: '泡泡玛特 MOLLY 开心火车系列 确认款', price: 35, original: 89, emoji: '🧸', wants: 28, seller: '潮玩收藏', tags: [] },
            { id: 'p302', title: 'LEGO 机械组 兰博基尼 已拼好 带展示盒', price: 450, original: 1299, emoji: '🏎️', wants: 15, seller: '乐高玩家', tags: [] },
            { id: 'p303', title: '原神 钟离 手办 1/7比例 全新未拆', price: 180, original: 399, emoji: '⚔️', wants: 73, seller: '退坑出', tags: ['全新','包邮'] },
            { id: 'p304', title: 'Switch游戏卡 塞尔达王国之泪 实体卡带', price: 200, original: 369, emoji: '🎮', wants: 41, seller: '通关出', tags: [] },
            { id: 'p305', title: '海贼王 路飞四档 GK手办 带灯光底座', price: 320, original: 680, emoji: '🏴‍☠️', wants: 19, seller: '手办控', tags: ['包邮'] },
            { id: 'p306', title: '迪士尼 草莓熊 毛绒公仔 45cm 正版带吊牌', price: 65, original: 159, emoji: '🍓', wants: 52, seller: '娃娃屋', tags: ['全新'] }
        ]
    },
    '004': {
        name: '省钱卡券 🎫', desc: '吃喝玩乐放心购',
        items: [
            { id: 'p401', title: '星巴克中杯拿铁券×3 有效期到下月底', price: 45, original: 111, emoji: '☕', wants: 89, seller: '卡券专营', tags: ['即买即用'] },
            { id: 'p402', title: '瑞幸9.9元饮品券×5 不限品类', price: 25, original: 50, emoji: '🥤', wants: 120, seller: '薅羊毛达人', tags: [] },
            { id: 'p403', title: '万达影城双人观影券 含两份爆米花套餐', price: 68, original: 168, emoji: '🎬', wants: 34, seller: '中奖转', tags: [] },
            { id: 'p404', title: '肯德基疯狂星期四50元代金券 无门槛', price: 35, original: 50, emoji: '🍗', wants: 67, seller: 'V我50', tags: ['即买即用'] },
            { id: 'p405', title: '网易云音乐年卡会员 官方渠道 可验证', price: 88, original: 168, emoji: '🎵', wants: 45, seller: '会员代购', tags: ['可验证'] },
            { id: 'p406', title: '美团外卖红包 满30减15×4张 本月有效', price: 20, original: 60, emoji: '🛵', wants: 156, seller: '红包雨', tags: [] }
        ]
    },
    '005': {
        name: '运动户外 ⚽', desc: '球拍器材超值转',
        items: [
            { id: 'p501', title: '尤尼克斯羽毛球拍 弓箭11 八成新 送手胶', price: 350, original: 1080, emoji: '🏸', wants: 11, seller: '羽球退役', tags: [] },
            { id: 'p502', title: '迪卡侬瑜伽垫 加厚8mm 紫色 用过几次', price: 25, original: 79, emoji: '🧘', wants: 8, seller: '健身小白', tags: [] },
            { id: 'p503', title: 'Keep智能跳绳 带计数 蓝牙连接APP', price: 45, original: 129, emoji: '🏃', wants: 14, seller: '运动达人', tags: ['包邮'] },
            { id: 'p504', title: '斯伯丁篮球 室外水泥地耐磨款 标准7号', price: 55, original: 169, emoji: '🏀', wants: 22, seller: '球场常客', tags: [] },
            { id: 'p505', title: '迪卡侬登山包 40L 灰色 带防雨罩', price: 80, original: 249, emoji: '🎒', wants: 6, seller: '毕业旅行后', tags: [] },
            { id: 'p506', title: '李宁跑鞋 飞电3 42码 跑了200公里', price: 280, original: 699, emoji: '👟', wants: 17, seller: '跑步爱好者', tags: [] }
        ]
    },
    '006': {
        name: '生活日用 🏡', desc: '宿舍好物便宜出',
        items: [
            { id: 'p601', title: 'LED护眼台灯 三档调光 USB充电 白色', price: 25, original: 89, emoji: '💡', wants: 9, seller: '毕业清仓', tags: [] },
            { id: 'p602', title: '小熊酸奶机 1L容量 用过两次 带说明书', price: 30, original: 99, emoji: '🥛', wants: 13, seller: '宿舍美食家', tags: ['包邮'] },
            { id: 'p603', title: '收纳箱×3 可折叠 透明 大中小各一个', price: 15, original: 59, emoji: '📦', wants: 21, seller: '搬宿舍了', tags: [] },
            { id: 'p604', title: '小米台式风扇 静音款 三挡风速 白色', price: 20, original: 69, emoji: '🌀', wants: 35, seller: '夏天必备', tags: [] },
            { id: 'p605', title: '懒人沙发 灰色 可拆洗 靠背可调节', price: 45, original: 159, emoji: '🛋️', wants: 18, seller: '换宿舍出', tags: [] },
            { id: 'p606', title: '衣架×30 不锈钢 防滑 宿舍搬走带不了', price: 8, original: 35, emoji: '🪝', wants: 5, seller: '大四毕业', tags: [] }
        ]
    }
};

// ========== 渲染工具 ==========
var colors = [
    'from-rose-200 to-pink-300', 'from-sky-200 to-blue-300',
    'from-amber-200 to-orange-300', 'from-emerald-200 to-green-300',
    'from-violet-200 to-purple-300', 'from-cyan-200 to-teal-300',
    'from-red-200 to-rose-300', 'from-indigo-200 to-blue-300'
];
var heights = ['h-44', 'h-48', 'h-52', 'h-56', 'h-60'];
var tagOptions = [[], ['包邮'], ['全新'], ['可验货'], ['包邮','全新']];
var sellerAdj = ['快乐的','佛系','校园','宿舍','学霸','毕业','热心','靠谱','诚信','随缘'];
var sellerNoun = ['同学','学长','学姐','小铺','卖家','闲人','达人','玩家','掌柜','店主'];

function renderCard(grid, item) {
    var bg = colors[Math.floor(Math.random() * colors.length)];
    var h = heights[Math.floor(Math.random() * heights.length)];
    var tagHtml = item.tags.map(function (t) {
        return '<span class="absolute top-2 left-2 text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">' + t + '</span>';
    }).join('');
    var card = document.createElement('div');
    card.className = 'bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer';
    card.innerHTML =
        '<div class="relative">' +
            '<div class="' + h + ' bg-gradient-to-br ' + bg + ' flex items-center justify-center text-5xl">' + item.emoji + '</div>' +
            tagHtml +
        '</div>' +
        '<div class="p-3">' +
            '<p class="text-sm text-gray-800 leading-snug line-clamp-2">' + item.title + '</p>' +
            '<div class="flex items-center justify-between mt-2">' +
                '<div><span class="text-orange-500 font-black">¥' + item.price + '</span>' +
                '<span class="text-gray-400 line-through text-xs ml-1">¥' + item.original + '</span></div>' +
            '</div>' +
            '<div class="flex items-center justify-between mt-2">' +
                '<span class="text-xs text-gray-400">' + item.wants + '人想要</span>' +
                '<span class="text-xs text-gray-500">' + item.seller + '</span>' +
            '</div>' +
        '</div>';
    card.addEventListener('click', function () { window.location.href = 'product.html?id=' + item.id; });
    grid.appendChild(card);
}

function randomItem(seedItems) {
    var base = seedItems[Math.floor(Math.random() * seedItems.length)];
    var priceMul = 0.5 + Math.random() * 1.5;
    var p = Math.round(base.price * priceMul);
    return {
        id: 'rand_' + Date.now() + '_' + Math.floor(Math.random() * 99999),
        title: base.title,
        price: Math.max(1, p),
        original: Math.round(p * (2 + Math.random() * 3)),
        emoji: base.emoji,
        wants: Math.floor(Math.random() * 200) + 1,
        seller: sellerAdj[Math.floor(Math.random() * sellerAdj.length)] + sellerNoun[Math.floor(Math.random() * sellerNoun.length)],
        tags: tagOptions[Math.floor(Math.random() * tagOptions.length)]
    };
}

// ========== 读取参数并渲染 ==========
var params = new URLSearchParams(window.location.search);
var catId = params.get('id');
var cat = categoryData[catId];

if (cat) {
    document.title = cat.name + ' - AzureTrade';
    document.getElementById('cat-title').textContent = cat.name;
    document.getElementById('cat-desc').textContent = cat.desc;
    document.getElementById('cat-count').textContent = '好物低价 源源不断';

    var grid = document.getElementById('product-grid');
    cat.items.forEach(function (item) { renderCard(grid, item); });

    // ========== 无限滚动 ==========
    var loading = false;
    window.addEventListener('scroll', function () {
        if (loading) return;
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
            loading = true;
            var loader = document.createElement('div');
            loader.className = 'col-span-4 text-center py-4 text-gray-400 text-sm';
            loader.textContent = '加载中...';
            grid.appendChild(loader);
            setTimeout(function () {
                grid.removeChild(loader);
                for (var i = 0; i < 8; i++) {
                    renderCard(grid, randomItem(cat.items));
                }
                loading = false;
            }, 500);
        }
    });
}
