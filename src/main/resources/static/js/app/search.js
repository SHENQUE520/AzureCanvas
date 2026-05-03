// ========== 读取参数并初始化 ==========
var params = new URLSearchParams(window.location.search);
var keyword = params.get('keyword') || '';
var cat = params.get('cat') || '';
var searchInput;
var searchBtn;
var grid;

var seeds;
var displayName = '';

// 确保DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOMContentLoaded事件触发');
    // 获取DOM元素
    searchInput = document.getElementById('search-input');
    searchBtn = document.getElementById('search-btn');
    grid = document.getElementById('product-grid');

    console.log('获取DOM元素:', {
        searchInput: searchInput,
        searchBtn: searchBtn,
        grid: grid
    });

    // 初始化seeds为fallbackSeeds，确保即使ES API请求失败也有数据
    seeds = fallbackSeeds;

    if (cat && categoryMap && categoryMap[cat]) {
        // 大类：合并该类下所有子类的种子数据
        var categorySeeds = [];
        categoryMap[cat].forEach(function (subKey) {
            if (searchSeeds[subKey]) categorySeeds = categorySeeds.concat(searchSeeds[subKey]);
        });
        if (categorySeeds.length > 0) seeds = categorySeeds;
        displayName = cat;
        searchInput.value = cat;

        // 渲染分类结果
        renderBatch(12);
        document.getElementById('result-count').textContent = '为你找到大量好物';
    } else {
        // 使用ES API获取搜索结果
        displayName = keyword;
        searchInput.value = keyword;

        // 调用ES API
        if (keyword) {
            // 显示加载状态
            grid.innerHTML = '<div class="text-center py-12 text-gray-400">搜索中...</div>';

            fetch('http://localhost:8088/api/market/search/es?keyword=' + encodeURIComponent(keyword))
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    console.log('ES API返回数据:', data);
                    if (Array.isArray(data) && data.length > 0) {
                        // 转换ES结果为本地种子格式，确保title包含关键字以便标红
                        seeds = data.map(function (item) {
                            return {
                                t: item.title || '未知商品',
                                p: item.price || 0,
                                e: '📦',
                                highlightTitle: item.highlightTitle || null
                            };
                        });
                    } else {
                        // 如果ES返回空结果，使用本地getSeeds
                        seeds = getSeeds(keyword);
                    }
                    // 重新渲染
                    grid.innerHTML = '';
                    renderBatch(12);
                    document.getElementById('result-count').textContent = seeds.length > 0 ? '为你找到大量好物' : '未找到相关结果';
                })
                .catch(function (err) {
                    console.error('ES搜索失败:', err);
                    // 搜索失败时使用本地getSeeds
                    seeds = getSeeds(keyword);
                    // 重新渲染
                    grid.innerHTML = '';
                    renderBatch(12);
                    document.getElementById('result-count').textContent = '为你找到大量好物';
                });
        } else {
            // 没有关键词时使用fallbackSeeds
            seeds = fallbackSeeds;
            renderBatch(12);
            document.getElementById('result-count').textContent = '为你找到大量好物';
        }
    }

    document.title = (displayName || '全部商品') + ' - AzureTrade搜索';
    document.getElementById('search-title').textContent = displayName ? '"' + displayName + '"的搜索结果' : '全部商品';

    // 初始渲染12个商品
    function renderBatch(count) {
        // 确保seeds不为空
        if (!seeds || seeds.length === 0) {
            console.error('seeds为空，使用fallbackSeeds');
            seeds = fallbackSeeds;
        }

        for (var i = 0; i < count; i++) {
            var randomIndex = Math.floor(Math.random() * seeds.length);
            var seed = seeds[randomIndex];
            if (seed) {
                renderCard(grid, makeItem(seed), keyword);
            }
        }
    }

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
        console.log('doSearch函数被调用');
        var val = searchInput.value.trim();
        console.log('搜索关键词:', val);
        if (val) {
            // 使用相对路径跳转到search.html
            console.log('准备跳转到:', 'search.html?keyword=' + encodeURIComponent(val));
            window.location.href = 'search.html?keyword=' + encodeURIComponent(val);
        } else {
            console.log('搜索关键词为空');
        }
    }

    // 确保searchBtn和searchInput不为null
    if (searchBtn) {
        console.log('添加搜索按钮点击事件监听器');
        searchBtn.addEventListener('click', doSearch);
    } else {
        console.error('searchBtn为null');
    }

    if (searchInput) {
        console.log('添加搜索输入框回车事件监听器');
        searchInput.addEventListener('keydown', function (e) {
            console.log('按键按下:', e.key);
            if (e.key === 'Enter') {
                doSearch();
            }
        });
    } else {
        console.error('searchInput为null');
    }

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
});

// ========== 辅助函数：高亮关键字 ==========
function highlightKeyword(text, keyword) {
    if (!keyword || !text) return text;
    
    // 如果文本已经包含HTML标签（如ES返回的高亮结果），直接返回
    if (text.indexOf('<') !== -1 && text.indexOf('>') !== -1) {
        return text;
    }
    
    // 转义HTML特殊字符，防止XSS
    var escapedText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    
    // 将关键词分解为单个字符，分别标红
    var chars = keyword.split('');
    var result = escapedText;
    chars.forEach(function (char) {
        if (char.trim()) {
            var regex = new RegExp('(' + char + ')', 'gi');
            result = result.replace(regex, '<span class="text-red-500 font-bold">$1</span>');
        }
    });
    return result;
}