/**
 * main.js 
 * 核心控制逻辑：管理视图切换、数据交互及事件绑定
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化数据中心
    Store.init();

    // 2. 缓存所有视图容器与全局按钮
    const views = {
        home: document.getElementById('homeView'),
        publish: document.getElementById('publishView'),
        detail: document.getElementById('detailView')
    };

    const feedContainer = document.getElementById('postsFeedContainer');
    const emptyFeedMsg = document.getElementById('emptyFeedMsg');
    const detailContent = document.getElementById('detailContent');
    const navBackBtn = document.getElementById('navBackBtn');
    const newPostBtn = document.getElementById('newPostBtn');
    const mainSearchInput = document.getElementById('mainSearchInput');

    // 发布页表单元素
    const postTitleInput = document.getElementById('postTitleInput');
    const postContentInput = document.getElementById('postContentInput');
    const imagePreviewContainer = document.getElementById('publishImagePreview');
    const hiddenImageInput = document.getElementById('hiddenImageInput');

    const homeView = document.getElementById('homeView');
    const publishView = document.getElementById('publishView');
    const detailView = document.getElementById('detailView');

    /**
     * 3. 核心视图导航函数
     * 控制页面显示哪一部分，并同步导航栏状态
     */
    function navigateTo(viewId) {
        // 隐藏所有视图
        Object.values(views).forEach(view => {
            if (view) view.classList.add('hidden');
        });

        // 显示目标视图
        const targetView = views[viewId];
        if (targetView) targetView.classList.remove('hidden');

        // 同步导航栏：仅主页显示“发布”，其他页面显示“返回”
        if (viewId === 'home') {
            if (navBackBtn) navBackBtn.classList.add('hidden');
            if (newPostBtn) newPostBtn.classList.remove('hidden');
            refreshFeed(); // 返回首页时自动刷新列表
        } else {
            if (navBackBtn) navBackBtn.classList.remove('hidden');
            if (newPostBtn) newPostBtn.classList.add('hidden');
        }
        
        // 切换页面时滚动回顶部
        window.scrollTo(0, 0);
    }

    /**
     * 4. 首页列表刷新
     */
    function refreshFeed(posts = Store.posts) {
        if (!feedContainer) return;
        Render.renderFeed(feedContainer, emptyFeedMsg, posts, (id) => {
            openDetail(id);
        });
    }

    /**
     * 5. 详情页逻辑
     */
    function openDetail(postId) {
        const post = Store.posts.find(p => p.id === postId);
        if (!post) return;
        
        Store.currentPostId = postId;
        renderDetailView(post);
        navigateTo('detail');
    }

    function renderDetailView(post) {
        if (!detailContent) return;

        // 渲染评论列表 HTML
        const commentItems = post.comments.map(c => `
            <div class="comment-item" style="padding: 12px 0; border-bottom: 1px solid #eee;">
                <div style="font-weight: 600; font-size: 0.9rem;">${c.author}</div>
                <div style="color: #666; font-size: 0.8rem; margin-bottom: 4px;">${Render.formatTime(c.timestamp)}</div>
                <div style="font-size: 1rem; line-height: 1.5;">${Render.escapeHtml(c.text)}</div>
            </div>`).join('');

        // 渲染帖子详情 HTML
        detailContent.innerHTML = `
            <div class="detail-post" style="padding-bottom: 20px;">
                <div class="post-header" style="display: flex; gap: 12px; margin-bottom: 15px;">
                    <div class="avatar-placeholder">${post.avatarLetter || '匿'}</div>
                    <div>
                        <div style="font-weight: 600;">${post.author}</div>
                        <div style="color: #666; font-size: 0.85rem;">${Render.formatTime(post.timestamp)}</div>
                    </div>
                </div>
                <h1 style="font-size: 1.5rem; margin-bottom: 15px;">${Render.escapeHtml(post.title || '无标题')}</h1>
                <div style="font-size: 1.1rem; line-height: 1.6; white-space: pre-wrap;">${Render.escapeHtml(post.content)}</div>
                ${post.images && post.images.length ? `<div style="margin-top:15px;">${post.images.map(img => `<img src="${img}" style="max-width:100%; border-radius:8px; margin-bottom:10px;">`).join('')}</div>` : ''}
                
                <div class="detail-actions" style="margin-top: 25px; border-top: 1px solid #eee; padding-top: 15px;">
                    <button class="btn ${post.liked ? 'btn-black' : 'btn-ghost'}" id="detailLikeBtn">
                        <i class="${post.liked ? 'fas' : 'far'} fa-heart"></i> ${post.liked ? '已赞' : '赞'} ${post.likes}
                    </button>
                </div>
            </div>

            <div class="comment-section" style="background: #fcfcfc; padding: 20px; border-radius: 8px; margin-top: 20px;">
                <h3 style="margin-bottom: 15px;">全部评论 (${post.comments.length})</h3>
                <div id="commentsList">${commentItems || '<p style="color:#999; text-align:center;">快来成为第一个评论的人吧</p>'}</div>
                <div class="comment-input-group" style="margin-top: 20px; display: flex; gap: 10px;">
                    <input type="text" id="newCommentInput" class="gh-input" placeholder="写下你的看法..." style="flex:1; border: 1px solid #d0d7de; border-radius: 6px; padding: 8px 12px;">
                    <button class="btn-black" id="submitCommentBtn">评论</button>
                </div>
            </div>
        `;

        // 详情页内部事件监听
        document.getElementById('detailLikeBtn').onclick = () => {
            post.liked = !post.liked;
            post.likes += post.liked ? 1 : -1;
            Store.save();
            renderDetailView(post); // 局部重绘
        };

        document.getElementById('submitCommentBtn').onclick = () => {
            const input = document.getElementById('newCommentInput');
            const val = input.value.trim();
            if (val) {
                post.comments.push({
                    id: Date.now(),
                    author: '匿名同学',
                    text: val,
                    timestamp: Date.now()
                });
                Store.save();
                renderDetailView(post);
            }
        };
    }

    /**
     * 6. 全局搜索逻辑
     */
    if (mainSearchInput) {
        mainSearchInput.oninput = () => {
            const val = mainSearchInput.value.toLowerCase().trim();
            const filtered = Store.posts.filter(p => 
                p.content.toLowerCase().includes(val) || 
                (p.title && p.title.toLowerCase().includes(val)) ||
                p.author.toLowerCase().includes(val)
            );
            refreshFeed(filtered);
        };
    }

    /**
     * 7. 发布页逻辑
     */
    // 进入与退出
    if (newPostBtn) newPostBtn.onclick = () => navigateTo('publish');
    if (navBackBtn) navBackBtn.onclick = () => navigateTo('home');
    const cancelBtn = document.getElementById('cancelPublishBtn');
    if (cancelBtn) cancelBtn.onclick = () => navigateTo('home');

    // 图片上传触发与处理
    const imgTrigger = document.getElementById('imageUploadTrigger');
    if (imgTrigger && hiddenImageInput) {
        imgTrigger.onclick = () => hiddenImageInput.click();
        hiddenImageInput.onchange = (e) => {
            Array.from(e.target.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    Store.selectedImages.push(ev.target.result);
                    const img = document.createElement('img');
                    img.src = ev.target.result;
                    img.style.cssText = "width:80px; height:80px; object-fit:cover; border-radius:6px; border:1px solid #ddd;";
                    if (imagePreviewContainer) imagePreviewContainer.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        };
    }

    // 最终提交发布
    const finalPublishBtn = document.getElementById('finalPublishBtn');
    if (finalPublishBtn) {
        finalPublishBtn.onclick = () => {
            const title = postTitleInput.value.trim();
            const content = postContentInput.value.trim();

            if (!content) return alert('正文不能为空哦！');

            const newPost = {
                id: 'post_' + Date.now(),
                author: '树洞小枝',
                avatarLetter: '新',
                timestamp: Date.now(),
                title: title || '',
                content: content,
                images: [...Store.selectedImages],
                likes: 0,
                liked: false,
                comments: []
            };

            Store.posts.unshift(newPost);
            Store.save();

            // 重置发布页状态
            postTitleInput.value = '';
            postContentInput.value = '';
            Store.selectedImages = [];
            if (imagePreviewContainer) imagePreviewContainer.innerHTML = '';
            if (hiddenImageInput) hiddenImageInput.value = '';

            navigateTo('home'); // 发布成功后跳回首页
        };
    }

    // 8. 初始启动：进入首页
    navigateTo('home');

    // 在 main.js 中

// 1. 视图切换逻辑
function showView(viewId) {
    document.querySelectorAll('.view-container, #homeView, #detailView').forEach(el => el.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
}

// 2. 搜索功能实现
document.getElementById('searchTriggerBtn').onclick = performSearch;
document.getElementById('mainSearchInput').onkeyup = (e) => {
    if (e.key === 'Enter') performSearch();
};

function performSearch() {
    const keyword = document.getElementById('mainSearchInput').value.toLowerCase().trim();
    if (!keyword) {
        Render.renderFeed(feedContainer, emptyFeedMsg, Store.posts, (id) => openDetail(id));
        return;
    }
    
    const filtered = Store.posts.filter(p => 
        p.content.toLowerCase().includes(keyword) || 
        p.author.toLowerCase().includes(keyword)
    );
    
    Render.renderFeed(feedContainer, emptyFeedMsg, filtered, (id) => openDetail(id));
}

// 3. 发起话题跳转
document.getElementById('gotoPublishBtn').onclick = () => {
    showView('publishView');
};

document.getElementById('cancelPublishBtn').onclick = () => {
    showView('homeView');
};

// 4. 核心发布逻辑
document.getElementById('finalPublishBtn').onclick = () => {
    const title = document.getElementById('postTitleInput').value.trim();
    const content = document.getElementById('postContentInput').value.trim();
    
    if (title.length < 5) return alert('标题太短了');
    if (!content) return alert('正文不能为空');

    const newPost = {
        id: 'post_' + Date.now(),
        author: '树洞小枝',
        avatarLetter: '新',
        timestamp: Date.now(),
        title: title, // 新增标题字段
        content: content,
        images: [...Store.selectedImages],
        likes: 0, liked: false, collected: false, comments: []
    };

    Store.posts.unshift(newPost);
    Store.save();
    
    // 清空重置
    document.getElementById('postTitleInput').value = '';
    document.getElementById('postContentInput').value = '';
    Store.selectedImages = [];
    
    showView('homeView');
    refreshUI();
};
function navigateTo(viewId) {
        [homeView, publishView, detailView].forEach(view => view.classList.add('hidden'));
        document.getElementById(viewId).classList.remove('hidden');
        
        // 如果回到首页，则刷新列表
        if (viewId === 'homeView') {
            Render.renderFeed(
                document.getElementById('postsFeedContainer'),
                document.getElementById('emptyFeedMsg'),
                Store.posts,
                (id) => {
                    Store.currentPostId = id;
                    navigateTo('detailView');
                    // 详情页渲染逻辑保持不变...
                }
            );
        }
    }

    // 绑定发布按钮（进入发布页面）
    document.getElementById('newPostBtn').onclick = () => {
        navigateTo('publishView');
    };

    // 绑定取消按钮（返回首页）
    document.getElementById('cancelPublishBtn').onclick = () => {
        navigateTo('homeView');
    };

    // 搜索逻辑
    const searchInput = document.getElementById('mainSearchInput');
    searchInput.oninput = () => {
        const val = searchInput.value.toLowerCase();
        const filtered = Store.posts.filter(p => 
            p.content.toLowerCase().includes(val) || 
            (p.title && p.title.toLowerCase().includes(val))
        );
        Render.renderFeed(
            document.getElementById('postsFeedContainer'),
            document.getElementById('emptyFeedMsg'),
            filtered,
            (id) => { Store.currentPostId = id; navigateTo('detailView'); }
        );
    };

    // 最终发布逻辑
    document.getElementById('finalPublishBtn').onclick = () => {
        const title = document.getElementById('postTitleInput').value.trim();
        const content = document.getElementById('postContentInput').value.trim();

        if (!content) return alert('正文不能为空');

        const newPost = {
            id: 'post_' + Date.now(),
            author: '树洞小枝',
            avatarLetter: '新',
            timestamp: Date.now(),
            title: title,
            content: content,
            images: [...Store.selectedImages],
            likes: 0, liked: false, collected: false, comments: []
        };

        Store.posts.unshift(newPost);
        Store.save();

        // 重置表单
        document.getElementById('postTitleInput').value = '';
        document.getElementById('postContentInput').value = '';
        Store.selectedImages = [];

        // 返回首页
        navigateTo('homeView');
    };
});