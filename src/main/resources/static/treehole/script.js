(function () {
  "use strict";

  // ===== 数据 =====
  let posts = [];
  let currentPostId = null;
  let selectedImages = [];
  let currentCategory = "all";
  let searchQuery = "";

  // ===== DOM =====
  const homeView = document.getElementById("homeView");
  const detailView = document.getElementById("detailView");
  const feedContainer = document.getElementById("postsFeedContainer");
  const emptyFeedMsg = document.getElementById("emptyFeedMsg");
  const backBtn = document.getElementById("backBtn");
  const newPostBtn = document.getElementById("newPostBtn");
  const homeInputBar = document.getElementById("homeInputBar");

  const publishModal = document.getElementById("publishModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const cancelPublishBtn = document.getElementById("cancelPublishBtn");
  const submitPostBtn = document.getElementById("submitPostBtn");
  const postTextInput = document.getElementById("postTextInput");
  const postCategorySelect = document.getElementById("postCategorySelect");
  const imageUploadInput = document.getElementById("imageUploadInput");
  const imagePreviewContainer = document.getElementById("imagePreviewContainer");
  const emojiToggleBtn = document.getElementById("emojiToggleBtn");
  const emojiPicker = document.getElementById("emojiPicker");

  const searchInput = document.getElementById("searchInput");
  const searchResultsBar = document.getElementById("searchResultsBar");

  const detailPostBody = document.getElementById("detailPostBody");
  const detailActions = document.getElementById("detailActions");
  const commentsList = document.getElementById("commentsList");
  const commentCountEl = document.getElementById("commentCount");
  const commentInput = document.getElementById("commentInput");
  const submitCommentBtn = document.getElementById("submitCommentBtn");

  // ===== 初始化数据 =====
  function initPosts() {
    const saved = localStorage.getItem("treehole_posts_v2");
    if (saved) {
      try { posts = JSON.parse(saved); return; } catch (e) {}
    }
    posts = [
      {
        id: "p1", author: "匿名小树", avatarLetter: "匿",
        timestamp: Date.now() - 3600000 * 5,
        content: "有人知道图书馆三楼靠窗的座位现在需要预约吗？📚",
        category: "question", images: [], likes: 12, liked: false, collected: false,
        comments: [
          { id: "c1", author: "热心同学", text: "需要预约，上周就开始啦", timestamp: Date.now() - 800000 },
          { id: "c2", author: "图书管理员", text: "是的，用校园卡app", timestamp: Date.now() - 400000 }
        ]
      },
      {
        id: "p2", author: "毕业倒计时", avatarLetter: "毕",
        timestamp: Date.now() - 86400000,
        content: "今天拍毕业照，把四年的记忆留在这里🎓 谢谢树洞。",
        category: "emotion", images: [], likes: 45, liked: false, collected: true,
        comments: [
          { id: "c3", author: "学妹", text: "学长学姐前程似锦！", timestamp: Date.now() - 4000000 }
        ]
      },
      {
        id: "p3", author: "食堂观察员", avatarLetter: "食",
        timestamp: Date.now() - 7200000,
        content: "二食堂新出的麻辣香锅绝了！🌶️ 但是排队有点长。",
        category: "life", images: [], likes: 28, liked: true, collected: false,
        comments: []
      }
    ];
    savePosts();
  }

  function savePosts() {
    localStorage.setItem("treehole_posts_v2", JSON.stringify(posts));
  }

  // ===== 工具函数 =====
  function formatTime(ts) {
    const diff = Date.now() - ts;
    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return Math.floor(diff / 60000) + "分钟前";
    if (diff < 86400000) return Math.floor(diff / 3600000) + "小时前";
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function getFilteredPosts() {
    let result = [...posts].sort((a, b) => b.timestamp - a.timestamp);
    if (currentCategory !== "all") {
      result = result.filter(p => p.category === currentCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.content.toLowerCase().includes(q) || p.author.toLowerCase().includes(q));
    }
    return result;
  }

  // ===== 渲染主页帖子流 =====
  function renderFeed() {
    const filtered = getFilteredPosts();

    if (searchQuery) {
      searchResultsBar.textContent = `搜索「${searchQuery}」，找到 ${filtered.length} 条结果`;
      searchResultsBar.classList.add("visible");
    } else {
      searchResultsBar.classList.remove("visible");
    }

    if (filtered.length === 0) {
      feedContainer.innerHTML = "";
      emptyFeedMsg.style.display = "block";
      return;
    }
    emptyFeedMsg.style.display = "none";

    feedContainer.innerHTML = filtered.map(post => {
      const imgHtml = post.images && post.images.length
        ? `<div class="post-images">${post.images.map(u => `<img src="${u}" alt="">`).join("")}</div>`
        : "";
      return `
        <div class="post-card" data-id="${post.id}">
          <div class="post-header">
            <div class="avatar">${post.avatarLetter || "匿"}</div>
            <div class="post-meta">
              <span class="post-author">${escapeHtml(post.author)}</span>
              <span class="post-time">${formatTime(post.timestamp)}</span>
            </div>
          </div>
          <div class="post-body">${escapeHtml(post.content)}</div>
          ${imgHtml}
          <div class="post-actions" onclick="event.stopPropagation()">
            <button class="action-btn ${post.liked ? "liked" : ""}" data-action="like" data-id="${post.id}">
              <i class="${post.liked ? "fas" : "far"} fa-heart"></i> ${post.likes || 0}
            </button>
            <button class="action-btn" data-action="comment" data-id="${post.id}">
              <i class="far fa-comment"></i> ${post.comments ? post.comments.length : 0}
            </button>
            <button class="action-btn ${post.collected ? "collected" : ""}" data-action="collect" data-id="${post.id}">
              <i class="${post.collected ? "fas" : "far"} fa-bookmark"></i> ${post.collected ? "已收藏" : "收藏"}
            </button>
          </div>
        </div>
      `;
    }).join("");

    // 绑定卡片点击（进入详情）
    feedContainer.querySelectorAll(".post-card").forEach(card => {
      card.addEventListener("click", () => {
        currentPostId = card.dataset.id;
        showDetail();
      });
    });

    // 绑定操作按钮（阻止冒泡已在HTML中处理）
    feedContainer.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const { action, id } = btn.dataset;
        if (action === "like") toggleLike(id);
        else if (action === "collect") toggleCollect(id);
        else if (action === "comment") { currentPostId = id; showDetail(); }
      });
    });
  }

  // ===== 详情页 =====
  function showDetail() {
    const post = posts.find(p => p.id === currentPostId);
    if (!post) return;

    homeView.classList.add("hidden");
    detailView.classList.add("active");

    const imgHtml = post.images && post.images.length
      ? `<div class="post-images">${post.images.map(u => `<img src="${u}" alt="">`).join("")}</div>`
      : "";

    detailPostBody.innerHTML = `
      <div class="post-header">
        <div class="avatar">${post.avatarLetter || "匿"}</div>
        <div class="post-meta">
          <span class="post-author">${escapeHtml(post.author)}</span>
          <span class="post-time">${formatTime(post.timestamp)}</span>
        </div>
      </div>
      <div class="post-body">${escapeHtml(post.content)}</div>
      ${imgHtml}
    `;

    detailActions.innerHTML = `
      <button class="action-btn ${post.liked ? "liked" : ""}" id="detailLikeBtn">
        <i class="${post.liked ? "fas" : "far"} fa-heart"></i> ${post.likes || 0} 点赞
      </button>
      <button class="action-btn ${post.collected ? "collected" : ""}" id="detailCollectBtn">
        <i class="${post.collected ? "fas" : "far"} fa-bookmark"></i> ${post.collected ? "已收藏" : "收藏"}
      </button>
    `;

    document.getElementById("detailLikeBtn").addEventListener("click", () => {
      toggleLike(post.id);
      showDetail(); // 重新渲染
    });
    document.getElementById("detailCollectBtn").addEventListener("click", () => {
      toggleCollect(post.id);
      showDetail();
    });

    renderComments(post);
  }

  function renderComments(post) {
    commentCountEl.textContent = `评论 (${post.comments ? post.comments.length : 0})`;
    if (!post.comments || post.comments.length === 0) {
      commentsList.innerHTML = `<div class="empty-tip" style="padding:20px 0;">暂无评论，抢沙发</div>`;
      return;
    }
    commentsList.innerHTML = post.comments.map(c => `
      <div class="comment-item">
        <div class="comment-header">
          <span class="comment-author">${escapeHtml(c.author)}</span>
          <span class="comment-time">${formatTime(c.timestamp)}</span>
        </div>
        <div class="comment-text">${escapeHtml(c.text)}</div>
      </div>
    `).join("");
  }

  function showHome() {
    detailView.classList.remove("active");
    homeView.classList.remove("hidden");
    renderFeed();
  }

  // ===== 交互操作 =====
  function toggleLike(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    post.liked = !post.liked;
    post.likes = (post.likes || 0) + (post.liked ? 1 : -1);
    savePosts();
    renderFeed();
  }

  function toggleCollect(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    post.collected = !post.collected;
    savePosts();
    renderFeed();
  }

  function addComment(postId, text) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    if (!post.comments) post.comments = [];
    post.comments.push({
      id: "cmt_" + Date.now(),
      author: "匿名用户",
      text,
      timestamp: Date.now()
    });
    savePosts();
    renderComments(post);
    renderFeed();
  }

  // ===== 发布 =====
  function openModal() {
    publishModal.classList.add("open");
    postTextInput.focus();
  }

  function closeModal() {
    publishModal.classList.remove("open");
    emojiPicker.classList.remove("open");
    postTextInput.value = "";
    imagePreviewContainer.innerHTML = "";
    selectedImages = [];
  }

  function publishPost() {
    const content = postTextInput.value.trim();
    if (!content) { window.notify.show.show("内容不能为空", 'error'); return; }
    posts.unshift({
      id: "post_" + Date.now(),
      author: "树洞小枝",
      avatarLetter: "新",
      timestamp: Date.now(),
      content,
      category: postCategorySelect.value || "all",
      images: [...selectedImages],
      likes: 0, liked: false, collected: false, comments: []
    });
    savePosts();
    renderFeed();
    closeModal();
  }

  // ===== 图片上传 =====
  imageUploadInput.addEventListener("change", e => {
    selectedImages = [];
    imagePreviewContainer.innerHTML = "";
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        selectedImages.push(ev.target.result);
        const img = document.createElement("img");
        img.src = ev.target.result;
        img.className = "preview-img";
        imagePreviewContainer.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
    imageUploadInput.value = "";
  });

  // ===== 表情 =====
  emojiToggleBtn.addEventListener("click", () => {
    emojiPicker.classList.toggle("open");
  });

  emojiPicker.querySelectorAll("span").forEach(span => {
    span.addEventListener("click", () => {
      const start = postTextInput.selectionStart;
      const end = postTextInput.selectionEnd;
      const val = postTextInput.value;
      postTextInput.value = val.slice(0, start) + span.textContent + val.slice(end);
      postTextInput.focus();
      postTextInput.selectionStart = postTextInput.selectionEnd = start + span.textContent.length;
      emojiPicker.classList.remove("open");
    });
  });

  // ===== 搜索 =====
  let searchTimer = null;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchQuery = searchInput.value.trim();
      renderFeed();
    }, 300);
  });

  // ===== 分类筛选 =====
  document.querySelectorAll(".sidebar-item[data-category]").forEach(item => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".sidebar-item[data-category]").forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      currentCategory = item.dataset.category;
      renderFeed();
    });
  });

  // ===== 事件绑定 =====
  newPostBtn.addEventListener("click", openModal);
  homeInputBar.addEventListener("click", openModal);
  closeModalBtn.addEventListener("click", closeModal);
  cancelPublishBtn.addEventListener("click", closeModal);
  submitPostBtn.addEventListener("click", publishPost);
  backBtn.addEventListener("click", showHome);

  publishModal.addEventListener("click", e => {
    if (e.target === publishModal) closeModal();
  });

  submitCommentBtn.addEventListener("click", () => {
    const text = commentInput.value.trim();
    if (!text || !currentPostId) return;
    addComment(currentPostId, text);
    commentInput.value = "";
  });

  commentInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitCommentBtn.click();
    }
  });

  // ===== 启动 =====
  initPosts();
  renderFeed();
})();
