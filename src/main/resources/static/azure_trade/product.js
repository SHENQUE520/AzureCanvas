var params = new URLSearchParams(window.location.search);
var itemId = params.get('id');

if (itemId) {
    fetch('/api/market/items/' + itemId)
        .then(function(response) {
            if (!response.ok) throw new Error('Item not found');
            return response.json();
        })
        .then(function(item) {
            document.title = item.title + ' - AzureTrade';

            var gradients = [
                'from-lime-300 via-green-200 to-emerald-300',
                'from-cyan-300 via-blue-200 to-sky-300',
                'from-pink-300 via-rose-200 to-fuchsia-300',
                'from-amber-300 via-yellow-200 to-orange-300',
                'from-violet-300 via-purple-200 to-indigo-300',
                'from-teal-300 via-emerald-200 to-green-300'
            ];
            var emojiMap = {
                '教材书籍': '📚', '数码设备': '🎧', '潮玩手办': '🧸',
                '优惠卡券': '🎟️', '运动器材': '🏸', '生活日用': '🪴'
            };
            var tagMap = {
                '教材书籍': [['正版教材','orange'], ['低价转让','purple'], ['包邮','green']],
                '数码设备': [['数码设备','orange'], ['九成新','purple'], ['可验货','green']],
                '潮玩手办': [['潮玩手办','orange'], ['确认款','purple'], ['带包装','green']],
                '优惠卡券': [['优惠卡券','orange'], ['即买即用','purple'], ['超值','green']],
                '运动器材': [['运动器材','orange'], ['八成新','purple'], ['送配件','green']],
                '生活日用': [['生活日用','orange'], ['功能完好','purple'], ['自取优先','green']]
            };

            var gradient = gradients[Math.abs(hashCode(item.itemId || item.category)) % gradients.length];
            var emoji = emojiMap[item.category] || '📦';
            var tags = tagMap[item.category] || [['闲置好物','orange'], ['正品保证','purple'], ['包邮','green']];

            var imgEl = document.getElementById('product-image');
            imgEl.className = 'w-full h-full bg-gradient-to-br ' + gradient + ' flex items-center justify-center text-[120px]';
            imgEl.textContent = emoji;

            if (item.images && item.images.length > 0) {
                imgEl.innerHTML = '<img src="' + item.images[0] + '" class="w-full h-full object-cover" alt="' + item.title + '">';
            }

            document.getElementById('product-price').textContent = item.price;
            document.getElementById('product-views').textContent = (item.views || 0) + '浏览';
            document.getElementById('product-title').innerHTML = (item.description || item.title).replace(/\n/g, '<br>');

            var wantsEl = document.getElementById('product-wants');
            if (wantsEl) wantsEl.textContent = '0人想要';

            var tagsEl = document.getElementById('product-tags');
            if (tagsEl) {
                var colorMap = { orange: 'bg-orange-100 text-orange-600', purple: 'bg-purple-100 text-purple-600', green: 'bg-green-100 text-green-600' };
                tagsEl.innerHTML = tags.map(function(t) {
                    return '<span class="text-[11px] ' + colorMap[t[1]] + ' px-2 py-0.5 rounded">' + t[0] + '</span>';
                }).join('');
            }

            var sellerAvatar = document.getElementById('seller-avatar');
            var sellerName = document.getElementById('seller-name');
            var sellerStats = document.getElementById('seller-stats');

            if (sellerAvatar) sellerAvatar.textContent = (item.sellerUsername || '?').charAt(0).toUpperCase();
            if (sellerName) sellerName.textContent = item.sellerUsername || '未知卖家';
            if (sellerStats) sellerStats.textContent = (item.location || '校内') + ' · ' + (item.category || '其他');

            fetch('/api/market/items/' + itemId + '/view', { method: 'POST' })
                .catch(function(e) {});
        })
        .catch(function(error) {
            console.error('Failed to load item:', error);
            document.getElementById('product-title').innerHTML = '<span class="text-red-500">商品不存在或已下架</span>';
        });
}

function hashCode(str) {
    var hash = 0;
    if (str.length === 0) return hash;
    for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
}
