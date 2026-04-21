// main.js
document.addEventListener('DOMContentLoaded', () => {
  // 1. 初始化数据
  Store.init();

  // 2. 缓存 DOM 元素
  const homeView = document.getElementById('homeView');
  const detailView = document.getElementById('detailView');
  const feedContainer = document.getElementById('postsFeedContainer');
  const emptyFeedMsg = document.getElementById('emptyFeedMsg');
  const detailContent = document.getElementById('detailContent');
  const postTextInput = document.getElementById('postTextInput');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const emojiPicker = document.getElementById('emojiPicker');
  const modal = document.getElementById('publishModal');

  // 3. 视图切换逻辑
  const refreshUI = () => {
    Render.renderFeed(feedContainer, emptyFeedMsg, Store.posts, (id) => {
      Store.currentPostId = id;
      switchToDetail();
    });
  };

  const switchToDetail = () => {
    const post = Store.posts.find(p => p.id === Store.currentPostId);
    if (!post) return;
    homeView.classList.add('hidden');
    detailView.classList.remove('hidden');
    renderDetailView(post);
  };

  function renderDetailView(post) {
    const commentItems = post.comments.map(c => `
      <div class="comment-item">
        <span class="comment-author">${c.author}</span>
        <span style="color:#555; font-size:0.85rem;">${Render.formatTime(c.timestamp)}</span>
        <div style="margin-top:5px;">${Render.escapeHtml(c.text)}</div>
      </div>`).join('');

    detailContent.innerHTML = `
      <div class="detail-post">
        <div class="post-header">
          <div class="avatar-placeholder">${post.avatarLetter || '匿'}</div>
          <div><span class="post-author">${post.author}</span><span class="post-time">${Render.formatTime(post.timestamp)}</span></div>
        </div>
        <div class="post-content">${Render.escapeHtml(post.content)}</div>
        <div class="action-bar">
          <button class="action-btn ${post.liked ? 'active' : ''}" id="detailLikeBtn"><i class="${post.liked ? 'fas' : 'far'} fa-heart"></i> 点赞 ${post.likes}</button>
          <button class="action-btn ${post.collected ? 'active' : ''}" id="detailCollectBtn"><i class="${post.collected ? 'fas' : 'far'} fa-bookmark"></i> 收藏</button>
        </div>
      </div>
      <div class="comment-section">
        <h4 style="margin-bottom:12px;">评论 (${post.comments.length})</h4>
        <div id="commentsList">${commentItems || '暂无评论'}</div>
        <div class="comment-input-area">
          <input type="text" class="comment-input" id="newCommentInput" placeholder="写下你的评论…">
          <button class="btn btn-dark" id="submitCommentBtn">发送</button>
        </div>
      </div>`;

    // 详情页内部事件
    document.getElementById('detailLikeBtn').onclick = () => {
      post.liked = !post.liked;
      post.likes += post.liked ? 1 : -1;
      Store.save();
      renderDetailView(post);
    };
    document.getElementById('detailCollectBtn').onclick = () => {
      post.collected = !post.collected;
      Store.save();
      renderDetailView(post);
    };
    document.getElementById('submitCommentBtn').onclick = () => {
      const input = document.getElementById('newCommentInput');
      if (input.value.trim()) {
        post.comments.push({ id: Date.now(), author: '匿名用户', text: input.value.trim(), timestamp: Date.now() });
        Store.save();
        renderDetailView(post);
      }
    };
  }

  // 4. 外部按钮绑定
  document.getElementById('newPostBtn').onclick = () => modal.style.display = 'flex';
  document.getElementById('closeModalBtn').onclick = () => modal.style.display = 'none';
  document.getElementById('backToFeedBtn').onclick = () => {
    homeView.classList.remove('hidden');
    detailView.classList.add('hidden');
    refreshUI();
  };

  // 发布功能
  document.getElementById('submitPostBtn').onclick = () => {
    const text = postTextInput.value.trim();
    if (!text) return alert('内容不能为空');
    const newPost = {
      id: 'post_' + Date.now(),
      author: '树洞小枝',
      avatarLetter: '新',
      timestamp: Date.now(),
      content: text,
      images: [...Store.selectedImages],
      likes: 0, liked: false, collected: false, comments: []
    };
    Store.posts.unshift(newPost);
    Store.save();
    
    // 重置发布框
    postTextInput.value = '';
    Store.selectedImages = [];
    imagePreviewContainer.innerHTML = '';
    modal.style.display = 'none';
    refreshUI();
  };

  // 表情与图片预览
  document.getElementById('emojiToggleBtn').onclick = () => {
    emojiPicker.style.display = emojiPicker.style.display === 'grid' ? 'none' : 'grid';
  };
  emojiPicker.querySelectorAll('span').forEach(s => {
    s.onclick = () => postTextInput.value += s.textContent;
  });

  document.getElementById('imageUploadInput').onchange = (e) => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        Store.selectedImages.push(ev.target.result);
        const img = document.createElement('img');
        img.src = ev.target.result;
        img.className = 'preview-img';
        imagePreviewContainer.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  };

  // 初始加载
  refreshUI();
});