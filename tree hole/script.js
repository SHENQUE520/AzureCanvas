(function(){
  "use strict";

  // ---------- 数据存储 ----------
  let posts = [];
  let currentPostId = null;        // 详情页id
  let selectedImages = [];          // 发布时暂存图片(base64)

  // DOM 元素
  const homeView = document.getElementById('homeView');
  const detailView = document.getElementById('detailView');
  const feedContainer = document.getElementById('postsFeedContainer');
  const emptyFeedMsg = document.getElementById('emptyFeedMsg');
  const detailContent = document.getElementById('detailContent');
  const backBtn = document.getElementById('backToFeedBtn');
  const newPostBtn = document.getElementById('newPostBtn');
  
  // 模态框相关
  const modal = document.getElementById('publishModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelPublishBtn = document.getElementById('cancelPublishBtn');
  const submitPostBtn = document.getElementById('submitPostBtn');
  const postTextInput = document.getElementById('postTextInput');
  const imageUploadInput = document.getElementById('imageUploadInput');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const emojiToggleBtn = document.getElementById('emojiToggleBtn');
  const emojiPicker = document.getElementById('emojiPicker');

  // ---------- 初始化 Mock 数据 ----------
  function initMockPosts() {
    const saved = localStorage.getItem('campus_treehole_posts');
    if (saved) {
      try {
        posts = JSON.parse(saved);
        return;
      } catch(e) {}
    }
    
    // 默认帖子 (包含图片示例)
    posts = [
      {
        id: 'p1',
        author: '匿名小树',
        avatarLetter: '匿',
        timestamp: Date.now() - 3600000 * 5,
        content: '有人知道图书馆三楼靠窗的座位现在需要预约吗？📚',
        images: [],
        likes: 12,
        liked: false,
        collected: false,
        comments: [
          { id: 'c1', author: '热心同学', text: '需要预约，上周就开始啦', timestamp: Date.now() - 800000 },
          { id: 'c2', author: '图书管理员', text: '是的，用校园卡app', timestamp: Date.now() - 400000 }
        ]
      },
      {
        id: 'p2',
        author: '毕业倒计时',
        avatarLetter: '毕',
        timestamp: Date.now() - 86400000,
        content: '今天拍毕业照，把四年的记忆留在这里🎓 谢谢树洞。',
        images: ['data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'140\' viewBox=\'0 0 200 140\'%3E%3Crect width=\'200\' height=\'140\' fill=\'%23e0e0e0\'/%3E%3Ctext x=\'20\' y=\'80\' font-family=\'monospace\' fill=\'%23333\'%3E🎓 毕业照%3C/text%3E%3C/svg%3E'],
        likes: 45,
        liked: false,
        collected: true,
        comments: [
          { id: 'c3', author: '学妹', text: '学长学姐前程似锦！', timestamp: Date.now() - 4000000 }
        ]
      },
      {
        id: 'p3',
        author: '食堂观察员',
        avatarLetter: '食',
        timestamp: Date.now() - 7200000,
        content: '二食堂新出的麻辣香锅绝了！🌶️ 但是排队有点长。',
        images: [],
        likes: 28,
        liked: true,
        collected: false,
        comments: []
      }
    ];
    localStorage.setItem('campus_treehole_posts', JSON.stringify(posts));
  }

  // 保存至 localStorage
  function savePosts() {
    localStorage.setItem('campus_treehole_posts', JSON.stringify(posts));
  }

  // 格式化时间
  function formatTime(ts) {
    const date = new Date(ts);
    const now = Date.now();
    const diff = now - ts;
    if (diff < 3600000) return Math.floor(diff/60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff/3600000) + '小时前';
    return `${date.getMonth()+1}/${date.getDate()}`;
  }

  // 渲染帖子卡片 (主页)
  function renderFeed() {
    if (!feedContainer) return;
    if (posts.length === 0) {
      feedContainer.innerHTML = '';
      emptyFeedMsg.style.display = 'block';
      return;
    }
    emptyFeedMsg.style.display = 'none';
    
    let html = '';
    // 按时间倒序 (最新的在前)
    const sorted = [...posts].sort((a,b) => b.timestamp - a.timestamp);
    sorted.forEach(post => {
      const commentCount = post.comments ? post.comments.length : 0;
      const imageTags = post.images && post.images.length 
        ? `<div class="post-images">${post.images.map(url => `<img src="${url}" alt="post image">`).join('')}</div>` 
        : '';
      
      html += `
        <div class="post-card" data-post-id="${post.id}">
          <div class="post-header">
            <div class="avatar-placeholder">${post.avatarLetter || '匿'}</div>
            <div>
              <span class="post-author">${post.author}</span>
              <span class="post-time">· ${formatTime(post.timestamp)}</span>
            </div>
          </div>
          <div class="post-content">${escapeHtml(post.content)}</div>
          ${imageTags}
          <div class="post-stats">
            <span><i class="far fa-heart"></i> ${post.likes || 0}</span>
            <span><i class="far fa-comment"></i> ${commentCount}</span>
            ${post.collected ? '<span><i class="fas fa-bookmark"></i> 已收藏</span>' : ''}
          </div>
        </div>
      `;
    });
    feedContainer.innerHTML = html;
    
    // 绑定卡片点击事件 (进入详情)
    document.querySelectorAll('.post-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const id = card.dataset.postId;
        if (id) {
          currentPostId = id;
          renderDetailView();
          showDetailView();
        }
      });
    });
  }

  // 简单转义
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 显示主页，隐藏详情
  function showHomeView() {
    homeView.classList.remove('hidden');
    detailView.classList.add('hidden');
    renderFeed(); // 刷新数据
  }

  function showDetailView() {
    homeView.classList.add('hidden');
    detailView.classList.remove('hidden');
  }

  // 根据 currentPostId 渲染详情
  function renderDetailView() {
    const post = posts.find(p => p.id === currentPostId);
    if (!post) {
      detailContent.innerHTML = '<p>帖子不见了</p>';
      return;
    }
    
    const commentItems = post.comments ? post.comments.map(c => `
      <div class="comment-item">
        <span class="comment-author">${c.author}</span>
        <span style="color:#555; font-size:0.85rem;">${formatTime(c.timestamp)}</span>
        <div style="margin-top:5px;">${escapeHtml(c.text)}</div>
      </div>
    `).join('') : '';
    
    const imageSection = post.images && post.images.length 
      ? `<div class="post-images">${post.images.map(u => `<img src="${u}" style="max-width:200px;">`).join('')}</div>` 
      : '';
    
    const likedClass = post.liked ? 'active' : '';
    const collectedClass = post.collected ? 'active' : '';
    
    const html = `
      <div class="detail-post">
        <div class="post-header">
          <div class="avatar-placeholder">${post.avatarLetter || '匿'}</div>
          <div>
            <span class="post-author">${post.author}</span>
            <span class="post-time">${formatTime(post.timestamp)}</span>
          </div>
        </div>
        <div class="post-content">${escapeHtml(post.content)}</div>
        ${imageSection}
        
        <div class="action-bar">
          <button class="action-btn ${post.liked ? 'active' : ''}" id="detailLikeBtn" data-id="${post.id}">
            <i class="${post.liked ? 'fas' : 'far'} fa-heart"></i> 点赞 ${post.likes}
          </button>
          <button class="action-btn ${post.collected ? 'active' : ''}" id="detailCollectBtn" data-id="${post.id}">
            <i class="${post.collected ? 'fas' : 'far'} fa-bookmark"></i> 收藏
          </button>
        </div>
      </div>
      
      <div class="comment-section">
        <h4 style="font-weight:500; margin-bottom:12px;"><i class="far fa-comments"></i> 评论 (${post.comments ? post.comments.length : 0})</h4>
        <div id="commentsList">
          ${commentItems || '<div style="color:#777; padding:10px 0;">暂无评论，抢沙发</div>'}
        </div>
        
        <div class="comment-input-area">
          <input type="text" class="comment-input" id="newCommentInput" placeholder="写下你的评论…" autocomplete="off">
          <button class="btn btn-dark" id="submitCommentBtn" style="padding:8px 22px;">发送</button>
        </div>
      </div>
    `;
    
    detailContent.innerHTML = html;
    
    // 绑定详情页按钮事件
    const likeBtn = document.getElementById('detailLikeBtn');
    const collectBtn = document.getElementById('detailCollectBtn');
    if (likeBtn) {
      likeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleLike(post.id);
      });
    }
    if (collectBtn) {
      collectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCollect(post.id);
      });
    }
    
    const submitComment = document.getElementById('submitCommentBtn');
    const commentInput = document.getElementById('newCommentInput');
    if (submitComment) {
      submitComment.addEventListener('click', () => {
        const text = commentInput.value.trim();
        if (!text) return;
        addComment(post.id, text);
        commentInput.value = '';
      });
    }
  }

  // 点赞切换
  function toggleLike(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    post.liked = !post.liked;
    post.likes = (post.likes || 0) + (post.liked ? 1 : -1);
    savePosts();
    // 如果在详情页且是当前帖子，重新渲染详情；同时更新feed
    if (currentPostId === postId && !homeView.classList.contains('hidden') === false) {
      renderDetailView();
    }
    renderFeed(); 
  }

  function toggleCollect(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    post.collected = !post.collected;
    savePosts();
    if (currentPostId === postId && detailView.classList.contains('hidden') === false) {
      renderDetailView();
    }
    renderFeed();
  }

  function addComment(postId, text) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    if (!post.comments) post.comments = [];
    post.comments.push({
      id: 'cmt_' + Date.now() + Math.random(),
      author: '匿名用户',
      text: text,
      timestamp: Date.now()
    });
    savePosts();
    renderDetailView();
    renderFeed(); // 评论数变化
  }

  // 发布新帖
  function publishNewPost(content, images) {
    const newPost = {
      id: 'post_' + Date.now() + Math.random(),
      author: '树洞小枝',
      avatarLetter: '新',
      timestamp: Date.now(),
      content: content,
      images: images || [],
      likes: 0,
      liked: false,
      collected: false,
      comments: []
    };
    posts.unshift(newPost);
    savePosts();
    renderFeed();
    closeModal();
    
    // 清空暂存
    selectedImages = [];
    imagePreviewContainer.innerHTML = '';
    postTextInput.value = '';
  }

  // 模态框控制
  function openModal() {
    modal.style.display = 'flex';
    postTextInput.focus();
  }
  function closeModal() {
    modal.style.display = 'none';
    emojiPicker.style.display = 'none';
  }

  // 图片预览处理
  function handleImageUpload(files) {
    selectedImages = [];
    imagePreviewContainer.innerHTML = '';
    if (!files.length) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        selectedImages.push(e.target.result);
        const img = document.createElement('img');
        img.src = e.target.result;
        img.className = 'preview-img';
        imagePreviewContainer.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  }

  // 表情插入
  function insertEmoji(emoji) {
    const textarea = postTextInput;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    textarea.value = text.slice(0, start) + emoji + text.slice(end);
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
  }

  // ---------- 事件绑定 ----------
  initMockPosts();
  renderFeed();

  // 返回主页
  backBtn.addEventListener('click', () => {
    showHomeView();
  });

  newPostBtn.addEventListener('click', openModal);
  closeModalBtn.addEventListener('click', closeModal);
  cancelPublishBtn.addEventListener('click', closeModal);
  
  // 点击模态背景关闭（简单处理）
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // 图片上传
  imageUploadInput.addEventListener('change', (e) => {
    handleImageUpload(e.target.files);
    imageUploadInput.value = ''; // 允许再次选相同文件
  });

  // 表情切换
  emojiToggleBtn.addEventListener('click', () => {
    emojiPicker.style.display = emojiPicker.style.display === 'grid' ? 'none' : 'grid';
  });

  // 点击表情插入
  emojiPicker.querySelectorAll('span').forEach(span => {
    span.addEventListener('click', () => {
      insertEmoji(span.textContent);
      emojiPicker.style.display = 'none';
    });
  });

  // 发布提交
  submitPostBtn.addEventListener('click', () => {
    const content = postTextInput.value.trim();
    if (!content) {
      alert('内容不能为空');
      return;
    }
    publishNewPost(content, [...selectedImages]);
  });

  // 如果点击详情页返回，也要更新
  window.addEventListener('click', (e) => {
    // 不影响其他
  });

  // 初始显示主页
  showHomeView();
  
  // 处理空状态
  if (posts.length === 0) emptyFeedMsg.style.display = 'block';
})();