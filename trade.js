// ========== 商品数据（2x3 紧凑卡片） ==========
var
 cards = [
    { id: '001', title: '教材捡漏',  desc: '正版教材低至1折',  price: '¥5',    original: '¥50',  emoji: '📚', cat: '教材/考研/资料', gradient: 'from-green-300 to-emerald-500'},
 
    { id: '002', title: '手机数码',  desc: '热门3C装备轻松入', price: '¥120',  original: '¥599', emoji: '🎧', cat: '手机/数码/电脑', gradient: 'from-sky-300 to-blue-500'},
 
    { id: '003', title: '潮玩手办',  desc: '热门IP手办随手入', price: '¥29',   original: '¥89',  emoji: '🧸', cat: '游戏/卡券/潮玩', gradient: 'from-pink-300 to-rose-500'},
 
    { id: '004', title: '省钱卡券',  desc: '吃喝玩乐放心购',  price: '¥1.5',  original: '¥15',  emoji: '🎟️', cat: '游戏/卡券/潮玩', gradient: 'from-amber-300 to-yellow-500'},
 
    { id: '005', title: '运动户外',  desc: '球拍器材超值转',  price: '¥35',   original: '¥199', emoji: '🏸', cat: '服饰/箱包/运动', gradient: 'from-violet-300 to-purple-500'},
 
    { id: '006', title: '生活日用',  desc: '宿舍好物便宜出',  price: '¥8',    original: '¥45',  emoji: '🪴', cat: '家具/家电/日用', gradient: 'from-orange-300 to-red-400'}
 
];

// ========== DOM 引用 ==========
var searchInput    = document.querySelector('header input[type="text"]');
var searchBtn      = document.querySelector('header button');
var hotTags        = document.querySelectorAll('.hot-tags a');
var categoryItems  = document.querySelectorAll('.category-list li');
var cardGrid       = document.getElementById('card-grid');
var recommendGrid  = document.getElementById('recommend-grid');
var detailModal    = document.getElementById('detail-modal');
var publishModal   = document.getElementById('publish-modal');
var publishForm    = document.getElementById('publish-form');
var toastEl        = document.getElementById('toast');

// ========== Toast 提示 ==========
function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.remove('opacity-0', '-translate-y-4');
    toastEl.classList.add('opacity-100', 'translate-y-0');
    setTimeout(function () {
        toastEl.classList.remove('opacity-100', 'translate-y-0');
        toastEl.classList.add('opacity-0', '-translate-y-4');
    }, 2000);
}

// ========== 渲染紧凑卡片（2x3网格 - 无数字版） ==========
function renderCards(list) {
    cardGrid.innerHTML = '';
    list.forEach(function (c) {
        var div = document.createElement('div');
        div.className = 'trade-product-card bg-gradient-to-br ' + c.gradient + ' rounded-xl p-4 cursor-pointer hover:scale-[1.02] transition-transform';
        // 在这里我把原本底部的价格 div 整个删掉了
        div.innerHTML =
            '<div class="text-3xl mb-2">' + c.emoji + '</div>' +
            '<h3 class="text-white text-sm font-black leading-tight">' + c.title + '</h3>' +
            '<p class="text-white/70 text-[11px] mt-0.5">' + c.desc + '</p>';
            
        div.addEventListener('click', function () {
            window.location.href = 'search.html?cat=' + encodeURIComponent(c.cat);
        });
        cardGrid.appendChild(div);
    });
}

// ========== 搜索 → 跳转 search.html ==========
function doSearch() {
    var keyword = searchInput.value.trim();
    if (keyword) {
        window.location.href = 'search.html?keyword=' + encodeURIComponent(keyword);
    }
}

searchBtn.addEventListener('click', doSearch);
searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doSearch();
});

// ========== 热搜标签 → 跳转 search.html ==========
hotTags.forEach(function (tag) {
    tag.addEventListener('click', function (e) {
        e.preventDefault();
        var kw = tag.textContent.trim();
        window.location.href = 'search.html?keyword=' + encodeURIComponent(kw);
    });
});

// ========== 分类筛选 → 跳转搜索页 ==========
categoryItems.forEach(function (li) {
    li.addEventListener('click', function (e) {
        if (e.target.closest('a[href*="search.html"]')) return;
        if (e.target.closest('.group > div')) return;
        var cat = li.getAttribute('data-cat');
        if (cat) window.location.href = 'search.html?cat=' + encodeURIComponent(cat);
    });
});

function clearCategoryActive() {}

// ========== 推荐流：动态渲染 ==========
function getAllSeeds() {
    var all = [];
    var keys = Object.keys(searchSeeds);
    for (var i = 0; i < keys.length; i++) {
        all = all.concat(searchSeeds[keys[i]]);
    }
    return all;
}

function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
}

function renderRecommend(seedFilter) {
    recommendGrid.innerHTML = '';
    var pool = seedFilter ? seedFilter : getAllSeeds();
    var picked = shuffle(pool).slice(0, 8);
    picked.forEach(function (seed) {
        var item = makeItem(seed);
        var bg = colors[Math.floor(Math.random() * colors.length)];
        var h = heights[Math.floor(Math.random() * heights.length)];
        var tagHtml = item.tags.map(function (t) {
            if (t === '包邮') return '<span class="trade-badge trade-badge--free">' + t + '</span>';
            if (t === '全新') return '<span class="trade-badge trade-badge--fresh">' + t + '</span>';
            return '<span class="trade-badge trade-badge--hot">' + t + '</span>';
        }).join(' ');

        var card = document.createElement('div');
        card.className = 'trade-recommend-card';
        card.style.breakInside = 'avoid';
        card.style.marginBottom = '1rem';
        card.innerHTML =
            '<div class="' + h + ' bg-gradient-to-br ' + bg + ' flex items-center justify-center text-6xl">' + item.emoji + '</div>' +
            '<div class="p-3 flex flex-col flex-1">' +
                (tagHtml ? '<div class="mb-1">' + tagHtml + '</div>' : '') +
                '<p class="text-sm text-gray-800 leading-snug line-clamp-2">' + item.title + '</p>' +
                '<div class="mt-auto pt-2">' +
                    '<div class="flex items-center justify-between">' +
                        '<span class="trade-price text-base">¥' + item.price + '</span>' +
                        '<span class="text-xs text-gray-400">' + item.wants + '人想要</span>' +
                    '</div>' +
                    '<div class="flex items-center mt-2 space-x-1.5">' +
                        '<div class="w-5 h-5 rounded-full bg-purple-200 flex items-center justify-center text-[10px] text-purple-600 font-bold">' + item.seller.charAt(0) + '</div>' +
                        '<span class="text-xs text-gray-500">' + item.seller + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>';
        card.addEventListener('click', function () {
            sessionStorage.setItem('viewProduct', JSON.stringify(item));
            window.location.href = 'product.html?id=' + item.id;
        });
        recommendGrid.appendChild(card);
    });
}

// ========== 推荐流标签切换 ==========
var tabSeedMap = {
    '猜你喜欢': null,
    '个人闲置': null,
    '数码设备': categoryMap['手机/数码/电脑'],
    '教材资料': categoryMap['教材/考研/资料'],
    '吉他乐器': categoryMap['乐器/文具/手工'],
    '摄影摄像': ['微单相机','单反相机'],
    '运动户外': categoryMap['服饰/箱包/运动'],
    '女装穿搭': ['连衣裙','T恤','卫衣','外套','牛仔裤'],
    '居家好物': categoryMap['家具/家电/日用']
};

document.querySelectorAll('.recommend-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
        // 1. 重置所有标签的样式（移除紫色渐变和白字，恢复未选中时的白底灰字）
        document.querySelectorAll('.recommend-tab').forEach(function (t) {
            t.style.background = ''; 
            t.classList.remove('text-white', 'font-bold', 'bg-gradient-to-br', 'from-purple-500', 'to-purple-600');
            t.classList.add('bg-white', 'text-gray-600');
        });
        
        // 2. 为当前点击的标签添加主题配套的紫色渐变
        tab.classList.remove('bg-white', 'text-gray-600');
        tab.classList.add('text-white', 'font-bold', 'bg-gradient-to-br', 'from-purple-500', 'to-purple-600');
        // (注：这里删除了原本写死黄色的 tab.style.background)

        var label = tab.textContent.trim();
        var subKeys = tabSeedMap[label];
        var pool = null;
        if (subKeys) {
            pool = [];
            subKeys.forEach(function (k) {
                if (searchSeeds[k]) pool = pool.concat(searchSeeds[k]);
            });
            if (pool.length === 0) pool = null;
        }
        renderRecommend(pool);
    });
});

// ========== 卡片详情弹窗 ==========
function openModal(card) {
    var banner = document.getElementById('modal-banner');
    banner.className = 'h-48 flex items-center justify-center text-6xl bg-gradient-to-br ' + (card.gradient || 'from-purple-300 to-purple-500');
    banner.textContent = card.emoji;
    document.getElementById('modal-title').textContent = card.title;
    document.getElementById('modal-desc').textContent = card.desc;
    document.getElementById('modal-price').textContent = card.price;
    document.getElementById('modal-original').textContent = card.original;
    detailModal.classList.remove('hidden');
    detailModal.classList.add('flex');
}

function closeModal() {
    detailModal.classList.add('hidden');
    detailModal.classList.remove('flex');
}

detailModal.addEventListener('click', function (e) {
    if (e.target === detailModal) closeModal();
});

// ========== 发布弹窗 ==========
function openPublish() {
    publishModal.classList.remove('hidden');
    publishModal.classList.add('flex');
}

function closePublish() {
    publishModal.classList.add('hidden');
    publishModal.classList.remove('flex');
    publishForm.reset();
}

publishModal.addEventListener('click', function (e) {
    if (e.target === publishModal) closePublish();
});

publishForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    var formData = new FormData(publishForm);
    var imageFiles = document.getElementById('publish-images').files;

    // 先将图片转为 dataURL 存入 localStorage（支持0~9张）
    var imagePromises = Array.from(imageFiles).slice(0, 9).map(function (file) {
        return new Promise(function (resolve) {
            var reader = new FileReader();
            reader.onload = function (ev) { resolve(ev.target.result); };
            reader.readAsDataURL(file);
        });
    });

    var imageDataUrls = await Promise.all(imagePromises);

    // 构建本地存储对象
    var item = {
        id: Date.now().toString(),
        title: formData.get('title'),
        category: formData.get('category'),
        description: formData.get('description'),
        price: parseFloat(formData.get('price')),
        condition: formData.get('condition'),
        address: formData.get('address'),
        images: imageDataUrls,
        isUrgent: !!publishForm.querySelector('[name="isUrgent"]').checked,
        isShippingFree: !!publishForm.querySelector('[name="isShippingFree"]').checked,
        canInspect: !!publishForm.querySelector('[name="canInspect"]').checked,
        createdAt: new Date().toISOString(),
        status: 'available'
    };

    // 无论 API 是否成功，都存入 localStorage
    var published = JSON.parse(localStorage.getItem('publishedItems') || '[]');
    published.unshift(item);
    localStorage.setItem('publishedItems', JSON.stringify(published));
    updateDropdownCounts();

    // 尝试调用后端 API
    var uploadData = new FormData();
    uploadData.append('title', formData.get('title'));
    uploadData.append('category', formData.get('category'));
    uploadData.append('description', formData.get('description'));
    uploadData.append('price', formData.get('price'));
    Array.from(imageFiles).slice(0, 9).forEach(function (file) {
        uploadData.append('images', file);
    });

    try {
        var response = await fetch('/api/market/items', {
            method: 'POST',
            credentials: 'include',
            body: uploadData
        });

        if (response.status === 401) {
            showToast('请先登录');
            window.location.href = '/login?redirect=/trade';
            return;
        }
    } catch (err) {
        console.warn('后端未连接，商品已保存到本地:', err);
    }

    closePublish();
    showToast('发布成功！商品已上架');
});

// ========== 发布表单：描述字数统计 ==========
(function () {
    var desc = document.getElementById('publish-desc');
    var count = document.getElementById('desc-count');
    if (desc && count) {
        desc.addEventListener('input', function () {
            count.textContent = desc.value.length;
        });
    }
})();

// ========== 发布表单：图片预览 ==========
(function () {
    var fileInput = document.getElementById('publish-images');
    var preview = document.getElementById('image-preview');
    if (!fileInput || !preview) return;
    fileInput.addEventListener('change', function () {
        preview.innerHTML = '';
        Array.from(fileInput.files).slice(0, 9).forEach(function (file) {
            var reader = new FileReader();
            reader.onload = function (e) {
                var img = document.createElement('div');
                img.className = 'w-20 h-20 rounded-lg bg-gray-100 overflow-hidden';
                img.innerHTML = '<img src="' + e.target.result + '" class="w-full h-full object-cover">';
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    });
})();

// 绑定所有「发布闲置」按钮
document.querySelectorAll('button').forEach(function (btn) {
    if (btn.textContent.indexOf('发布闲置') !== -1 || btn.textContent.indexOf('发闲置') !== -1) {
        btn.addEventListener('click', openPublish);
    }
});

// ========== ESC 关闭弹窗 ==========
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeModal(); closePublish();
        var dd = document.getElementById('user-dropdown');
        var ar = document.getElementById('avatar-arrow');
        if (dd && !dd.classList.contains('hidden')) {
            dd.classList.add('hidden');
            ar && ar.classList.remove('rotate-180');
        }
    }
});

// ========== 用户头像下拉面板 ==========
(function () {
    var avatarBtn = document.getElementById('user-avatar-btn');
    var dropdown  = document.getElementById('user-dropdown');
    var arrow     = document.getElementById('avatar-arrow');
    var logoutBtn = document.getElementById('logout-btn');
    if (!avatarBtn || !dropdown) return;

    avatarBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = !dropdown.classList.contains('hidden');
        if (isOpen) {
            dropdown.classList.add('hidden');
            arrow && arrow.classList.remove('rotate-180');
        } else {
            dropdown.classList.remove('hidden');
            arrow && arrow.classList.add('rotate-180');
        }
    });

    document.addEventListener('click', function (e) {
        if (!dropdown.classList.contains('hidden') && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
            arrow && arrow.classList.remove('rotate-180');
        }
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () { showToast('已退出登录'); });
    }

    dropdown.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function (e) {
            if (a.getAttribute('href') === '#') {
                e.preventDefault();
                var label = a.querySelector('.text-gray-700');
                if (label) showToast(label.textContent + ' - 功能开发中');
            }
        });
    });
})();

// ========== 实时统计数字 ==========
function updateDropdownCounts() {
    var published = JSON.parse(localStorage.getItem('publishedItems') || '[]');
    var postsCount = published.length;

    var dropdownPosts = document.getElementById('dropdown-posts');
    if (dropdownPosts) dropdownPosts.textContent = postsCount;
}

// ========== 初始化渲染 ==========
renderCards(cards);
renderRecommend(null);
updateDropdownCounts();

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/users/me', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (response.ok) {
            const user = await response.json();

            // 保存完整用户数据到 localStorage（供 profile 等页面使用）
            var existing = {};
            try { existing = JSON.parse(localStorage.getItem('userProfile') || '{}'); } catch(e) {}
            Object.keys(user).forEach(function(k) { existing[k] = user[k]; });
            localStorage.setItem('userProfile', JSON.stringify(existing));

            // 更新头像和用户名
            const headerAvatar = document.getElementById('header-avatar');
            const headerUsername = document.getElementById('header-username');
            const dropdownAvatar = document.getElementById('dropdown-avatar');
            const dropdownUsername = document.getElementById('dropdown-username');

            const username = user.username || user.nickname || '用户';
            const firstChar = username.charAt(0).toUpperCase();

            if (headerUsername) headerUsername.textContent = username;
            if (dropdownUsername) dropdownUsername.textContent = username;

            if (user.avatar_url) {
                if (headerAvatar) {
                    headerAvatar.innerHTML = '<img src="' + user.avatar_url + '" class="w-9 h-9 rounded-full object-cover">';
                    headerAvatar.className = 'w-9 h-9 rounded-full overflow-hidden shadow';
                }
                if (dropdownAvatar) {
                    dropdownAvatar.innerHTML = '<img src="' + user.avatar_url + '" class="w-14 h-14 rounded-full object-cover">';
                    dropdownAvatar.className = 'w-14 h-14 rounded-full overflow-hidden shadow-md';
                }
            } else {
                if (headerAvatar) headerAvatar.textContent = firstChar;
                if (dropdownAvatar) dropdownAvatar.textContent = firstChar;
            }

            // 更新侧边栏徽章
            const badgeSell = document.getElementById('badge-sell');
            const badgeBuy = document.getElementById('badge-buy');
            const badgeFav = document.getElementById('badge-fav');

            if (badgeSell) badgeSell.textContent = user.sell || 0;
            if (badgeBuy) badgeBuy.textContent = user.buy || 0;
            if (badgeFav) badgeFav.textContent = user.favorites || 0;

            // 更新下拉面板：粉丝/关注
            const dropdownFollowers = document.getElementById('dropdown-followers');
            const dropdownFollowing = document.getElementById('dropdown-following');
            if (dropdownFollowers) dropdownFollowers.textContent = user.followers || 0;
            if (dropdownFollowing) dropdownFollowing.textContent = user.followings || 0;

            // 更新下拉菜单：发布/买到/卖出/收藏数量
            const dropdownPosts = document.getElementById('dropdown-posts');
            const dropdownBuy = document.getElementById('dropdown-buy');
            const dropdownSell = document.getElementById('dropdown-sell');
            const dropdownFav = document.getElementById('dropdown-fav');
            if (dropdownPosts) dropdownPosts.textContent = user.posts || 0;
            if (dropdownBuy) dropdownBuy.textContent = user.buy || 0;
            if (dropdownSell) dropdownSell.textContent = user.sell || 0;
            if (dropdownFav) dropdownFav.textContent = user.favorites || 0;
        } else {
            if (response.status === 401) {
                window.location.href = '/login?redirect=/trade';
            }
        }
    } catch (error) {
        console.error("获取用户信息失败:", error);
    }
});
