// ========== 商品详情数据 ==========
var products = [
    {
        id: '001', title: '正版教材低至1折 高等数学同济版+线性代数\n全新未拆封 考完用不上了',
        price: '¥5.00', emoji: '📚', gradient: 'from-lime-300 via-green-200 to-emerald-300',
        wants: 12, views: 256, seller: '学长书屋', sellerInitial: 'X',
        sellerStats: '信用极好 · 卖出56件 · 校内',
        tags: [['正版教材','orange'], ['低价转让','purple'], ['包邮','green']]
    },
    {
        id: '002', title: '索尼WH-1000XM4 头戴式降噪耳机\n九成新 送原装收纳盒',
        price: '¥120', emoji: '🎧', gradient: 'from-cyan-300 via-blue-200 to-sky-300',
        wants: 8, views: 183, seller: '数码达人', sellerInitial: 'S',
        sellerStats: '信用良好 · 卖出32件 · 校内',
        tags: [['数码设备','orange'], ['九成新','purple'], ['可验货','green']]
    },
    {
        id: '003', title: '泡泡玛特 MOLLY 系列盲盒手办\n确认款 非隐藏 带包装',
        price: '¥29', emoji: '🧸', gradient: 'from-pink-300 via-rose-200 to-fuchsia-300',
        wants: 25, views: 412, seller: '潮玩收藏家', sellerInitial: 'C',
        sellerStats: '信用极好 · 卖出89件 · 校内',
        tags: [['潮玩手办','orange'], ['确认款','purple'], ['带包装','green']]
    },
    {
        id: '004', title: '星巴克中杯券×3 瑞幸9.9折扣券×5\n有效期到下月底 低价出',
        price: '¥1.50', emoji: '🎟️', gradient: 'from-amber-300 via-yellow-200 to-orange-300',
        wants: 45, views: 678, seller: '卡券专营', sellerInitial: 'K',
        sellerStats: '信用极好 · 卖出210件 · 校内',
        tags: [['优惠卡券','orange'], ['即买即用','purple'], ['超值','green']]
    },
    {
        id: '005', title: '尤尼克斯羽毛球拍 ARC-7 弓箭7\n八成新 送手胶和球包',
        price: '¥35', emoji: '🏸', gradient: 'from-violet-300 via-purple-200 to-indigo-300',
        wants: 6, views: 95, seller: '运动系学弟', sellerInitial: 'Y',
        sellerStats: '信用良好 · 卖出15件 · 校内',
        tags: [['运动器材','orange'], ['八成新','purple'], ['送配件','green']]
    },
    {
        id: '006', title: '宿舍小台灯 LED护眼 三档调光\n用了一学期 功能完好',
        price: '¥8', emoji: '🪴', gradient: 'from-teal-300 via-emerald-200 to-green-300',
        wants: 3, views: 67, seller: '毕业清仓', sellerInitial: 'B',
        sellerStats: '信用良好 · 卖出28件 · 校内',
        tags: [['生活日用','orange'], ['功能完好','purple'], ['自取优先','green']]
    }
];

// ========== 读取 URL 参数并渲染 ==========
var params = new URLSearchParams(window.location.search);
var id = params.get('id');
var product = products.find(function (p) { return p.id === id; });

// 如果 ID 不在预设列表中，从 sessionStorage 读取搜索页传来的数据
if (!product) {
    try {
        var stored = JSON.parse(sessionStorage.getItem('viewProduct'));
        if (stored) {
            var gradients = [
                'from-lime-300 via-green-200 to-emerald-300',
                'from-cyan-300 via-blue-200 to-sky-300',
                'from-pink-300 via-rose-200 to-fuchsia-300',
                'from-amber-300 via-yellow-200 to-orange-300',
                'from-violet-300 via-purple-200 to-indigo-300',
                'from-teal-300 via-emerald-200 to-green-300'
            ];
            var tagOptions = [
                [['闲置好物','orange'], ['正品保证','purple'], ['包邮','green']],
                [['校园闲置','orange'], ['成色好','purple'], ['可面交','green']],
                [['低价转让','orange'], ['自用闲置','purple'], ['急出','green']]
            ];
            product = {
                id: stored.id,
                title: stored.title,
                price: '¥' + stored.price,
                emoji: stored.emoji || '📦',
                gradient: gradients[Math.floor(Math.random() * gradients.length)],
                wants: stored.wants || Math.floor(Math.random() * 50) + 1,
                views: Math.floor(Math.random() * 500) + 50,
                seller: stored.seller || '闲置卖家',
                sellerInitial: (stored.seller || '卖').charAt(0),
                sellerStats: '信用良好 · 校内',
                tags: tagOptions[Math.floor(Math.random() * tagOptions.length)]
            };
        }
    } catch(e) {}
}

if (product) {
    document.title = product.title.split('\n')[0] + ' - AzureTrade';

    var imgEl = document.getElementById('product-image');
    imgEl.className = 'bg-gradient-to-br ' + product.gradient + ' rounded-2xl h-[480px] flex items-center justify-center text-[120px] shadow-sm';
    imgEl.textContent = product.emoji;

    document.getElementById('product-price').textContent = product.price;
    document.getElementById('product-wants').textContent = product.wants + '人想要';
    document.getElementById('product-views').textContent = product.views + '浏览';
    document.getElementById('product-title').innerHTML = product.title.replace(/\n/g, '<br>');

    var tagsEl = document.getElementById('product-tags');
    var colorMap = { orange: 'bg-orange-100 text-orange-600', purple: 'bg-purple-100 text-purple-600', green: 'bg-green-100 text-green-600' };
    tagsEl.innerHTML = product.tags.map(function (t) {
        return '<span class="text-[11px] ' + colorMap[t[1]] + ' px-2 py-0.5 rounded">' + t[0] + '</span>';
    }).join('');

    document.getElementById('seller-avatar').textContent = product.sellerInitial;
    document.getElementById('seller-name').textContent = product.seller;
    document.getElementById('seller-stats').textContent = product.sellerStats;
}
