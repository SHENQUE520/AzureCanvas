// ========== 读取参数并初始化 ==========
var params = new URLSearchParams(window.location.search);
var keyword = params.get('keyword') || '';
var cat = params.get('cat') || '';
var searchInput = document.getElementById('search-input');
var searchBtn = document.getElementById('search-btn');
var grid = document.getElementById('product-grid');

var seeds;
var displayName = '';

if (cat && categoryMap[cat]) {
    // 大类：合并该类下所有子类的种子数据
    seeds = [];
    categoryMap[cat].forEach(function (subKey) {
        if (searchSeeds[subKey]) seeds = seeds.concat(searchSeeds[subKey]);
    });
    if (seeds.length === 0) seeds = fallbackSeeds;
    displayName = cat;
    searchInput.value = cat;
} else {
    seeds = getSeeds(keyword);
    displayName = keyword;
    searchInput.value = keyword;
}

document.title = (displayName || '全部商品') + ' - AzureTrade搜索';
document.getElementById('search-title').textContent = displayName ? '"' + displayName + '"的搜索结果' : '全部商品';

var seeds = getSeeds(keyword);

// 初始渲染12个商品
function renderBatch(count) {
    for (var i = 0; i < count; i++) {
        renderCard(grid, makeItem(seeds[Math.floor(Math.random() * seeds.length)]));
    }
}
renderBatch(12);
document.getElementById('result-count').textContent = '为你找到大量好物';

// ========== 无限滚动 ==========
var loading = false;
window.addEventListener('scroll', function () {
    if (loading) return;
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
        loading = true;
        var loader = document.createElement('div');
        loader.className = 'text-center py-4 text-gray-400 text-sm';
        loader.textContent = '加载中...';
        grid.appendChild(loader);
        setTimeout(function () {
            grid.removeChild(loader);
            renderBatch(8);
            loading = false;
        }, 500);
    }
});

// ========== 搜索跳转 ==========
function doSearch() {
    var val = searchInput.value.trim();
    if (val) window.location.href = 'search.html?keyword=' + encodeURIComponent(val);
}
searchBtn.addEventListener('click', doSearch);
searchInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') doSearch(); });

// ========== 排序标签切换 ==========
document.querySelectorAll('.sort-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
        document.querySelectorAll('.sort-tab').forEach(function (t) {
            t.classList.remove('text-purple-600', 'font-bold', 'border-b-2', 'border-purple-600');
            t.classList.add('text-gray-500');
        });
        tab.classList.remove('text-gray-500');
        tab.classList.add('text-purple-600', 'font-bold', 'border-b-2', 'border-purple-600');
        grid.innerHTML = '';
        renderBatch(12);
    });
});

// ========== 筛选标签多选（checkbox） ==========
document.querySelectorAll('.filter-tag input[type="checkbox"]').forEach(function (cb) {
    cb.addEventListener('change', function () {
        var span = cb.nextElementSibling;
        if (cb.checked) {
            span.classList.remove('bg-gray-50', 'text-gray-600', 'border-gray-200');
            span.classList.add('bg-purple-50', 'text-purple-600', 'border-purple-200', 'font-medium');
        } else {
            span.classList.remove('bg-purple-50', 'text-purple-600', 'border-purple-200', 'font-medium');
            span.classList.add('bg-gray-50', 'text-gray-600', 'border-gray-200');
        }
        grid.innerHTML = '';
        renderBatch(12);
    });
});
