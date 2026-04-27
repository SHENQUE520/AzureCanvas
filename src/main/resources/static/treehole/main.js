document.addEventListener("DOMContentLoaded", () => {
  const response = fetch(`/api/treeholes/posts`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (response.ok) {
    for (let responseKey in response) {
      console.log(responseKey);
    }
  }
  // ===== 0. 进入动画（仅首次访问显示）+ 欢迎弹窗 =====
  const splash = document.getElementById("splashScreen");
  const welcomeModal = document.getElementById("welcomeModal");
  const isFirstVisit = true;//!localStorage.getItem("th_visited");

  if (!isFirstVisit) {
    // 非首次：直接隐藏 splash，不播放动画
    splash.style.display = "none";
  } else {
    // 首次：播放银河穿梭动画
    localStorage.setItem("th_visited", "1");
    startGalaxy();
    setTimeout(() => {
      splash.classList.add("fade-out");
      setTimeout(() => {
        splash.style.display = "none";
        welcomeModal.classList.add("open");
      }, 800);
    }, 2800);
  }

  function startGalaxy() {
    const canvas = document.getElementById("galaxyCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    window.addEventListener("resize", () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    });

    // 星星
    const STAR_COUNT = 320;
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      z: Math.random() * W,
      pz: 0
    }));
    stars.forEach(s => s.pz = s.z);

    // 流星
    const meteors = [];
    function spawnMeteor() {
      meteors.push({
        x: Math.random() * W, y: Math.random() * H * 0.5,
        vx: 6 + Math.random() * 6, vy: 3 + Math.random() * 3,
        len: 80 + Math.random() * 120, life: 1
      });
    }
    setInterval(spawnMeteor, 900);

    let frame = 0;
    function draw() {
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2, cy = H / 2;
      const speed = 6;

      // 星场穿梭
      stars.forEach(s => {
        s.pz = s.z;
        s.z -= speed;
        if (s.z <= 0) { s.x = Math.random() * W; s.y = Math.random() * H; s.z = W; s.pz = W; }

        const sx = (s.x - cx) * (W / s.z) + cx;
        const sy = (s.y - cy) * (W / s.z) + cy;
        const px = (s.x - cx) * (W / s.pz) + cx;
        const py = (s.y - cy) * (W / s.pz) + cy;
        const size = Math.max(0.3, (1 - s.z / W) * 2.5);
        const bright = 1 - s.z / W;

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = `rgba(${180 + Math.floor(bright * 75)},${200 + Math.floor(bright * 55)},255,${bright})`;
        ctx.lineWidth = size;
        ctx.stroke();
      });

      // 流星
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx; m.y += m.vy; m.life -= 0.018;
        if (m.life <= 0 || m.x > W + 200 || m.y > H + 200) { meteors.splice(i, 1); continue; }
        const grad = ctx.createLinearGradient(m.x - m.vx * (m.len / 8), m.y - m.vy * (m.len / 8), m.x, m.y);
        grad.addColorStop(0, `rgba(255,255,255,0)`);
        grad.addColorStop(1, `rgba(200,230,255,${m.life * 0.9})`);
        ctx.beginPath();
        ctx.moveTo(m.x - m.vx * (m.len / 8), m.y - m.vy * (m.len / 8));
        ctx.lineTo(m.x, m.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // 星云光晕
      if (frame % 2 === 0) {
        const gx = cx + Math.sin(frame * 0.008) * 120;
        const gy = cy + Math.cos(frame * 0.006) * 80;
        const nebula = ctx.createRadialGradient(gx, gy, 0, gx, gy, 260);
        nebula.addColorStop(0, "rgba(80,60,160,0.06)");
        nebula.addColorStop(0.5, "rgba(40,80,180,0.03)");
        nebula.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = nebula;
        ctx.fillRect(0, 0, W, H);
      }

      frame++;
      requestAnimationFrame(draw);
    }
    draw();
  }

  document.getElementById("welcomeCloseBtn").addEventListener("click", () => {
    welcomeModal.classList.remove("open");
  });

  // ===== 1. 初始化数据层 =====
  Store.init();

  // ===== 2. 初始化各功能模块 =====
  UserModule.init();
  MessageModule.init();

  // ===== 3. 缓存 DOM =====
  const homeView = document.getElementById("homeView");
  const detailView = document.getElementById("detailView");
  const messageView = document.getElementById("messageView");
  const feedContainer = document.getElementById("postsFeedContainer");
  const emptyFeedMsg = document.getElementById("emptyFeedMsg");
  const searchResultsBar = document.getElementById("searchResultsBar");
  const detailPostBody = document.getElementById("detailPostBody");
  const detailActions = document.getElementById("detailActions");
  const commentsList = document.getElementById("commentsList");
  const commentCountEl = document.getElementById("commentCount");
  const commentInput = document.getElementById("commentInput");
  const submitCommentBtn = document.getElementById("submitCommentBtn");

  // ===== 4. 全局状态 =====
  window._curCategory = "all";
  window._curQuery = "";
  let currentPostId = null;
  let replyingTo = null;

  // ===== 5. 视图路由 =====

  async function showHome() {
    homeView.classList.remove("hidden");
    detailView.classList.remove("active");
    messageView.classList.remove("active");
    await refreshFeed();
    Render.updateNotifBadges();
  }

  async function showDetail(postId) {
    currentPostId = postId;
    const post = await Store.fetchPostFromApi(postId);
    if (!post) return;
    homeView.classList.add("hidden");
    detailView.classList.add("active");
    messageView.classList.remove("active");
    Render.renderDetailPost(detailPostBody, detailActions, post, openMessage);
    Render.renderComments(commentsList, commentCountEl, post, onReply);
    replyingTo = null;
    updateReplyHint();
  }

  function openMessage(userId, nickname, avatarLetter) {
    MessageModule.openChat(userId, nickname, avatarLetter);
    homeView.classList.add("hidden");
    detailView.classList.remove("active");
    messageView.classList.add("active");
  }

  // ===== 热搜榜 =====
  function renderHotSearch() {
    const el = document.getElementById("hotSearchList");
    if (!el) return;
    const posts = Store.getFilteredPosts("all", "");
    const ranked = [...posts]
      .map(p => ({ id: p.id, text: p.content.slice(0, 22), heat: (p.likes || 0) * 3 + (p.comments ? p.comments.length : 0) * 5 }))
      .sort((a, b) => b.heat - a.heat)
      .slice(0, 10);
    const heatLabels = ["沸", "热", "热", "热", "热"];
    el.innerHTML = ranked.map((item, i) => `
      <div class="hot-item" data-id="${item.id}">
        <span class="hot-rank ${i === 0 ? "top1" : i === 1 ? "top2" : i === 2 ? "top3" : ""}">${i + 1}</span>
        <span class="hot-text">${Render.escapeHtml(item.text)}</span>
        <span class="hot-heat">${i < 5 ? heatLabels[i] : ""} ${item.heat}</span>
      </div>`).join("");
    el.querySelectorAll(".hot-item").forEach(item => {
      item.addEventListener("click", () => showDetail(item.dataset.id));
    });
  }

  // ===== 6. Feed 刷新（仅真实帖子，不自动轮询）=====

  async function refreshFeed() {
    let posts;

    if (window._curQuery) {
      // 显示加载状态
      feedContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;"><i class="fas fa-spinner fa-spin"></i> 搜索中...</div>';
      if (emptyFeedMsg) emptyFeedMsg.style.display = "none";

      // 使用ES API搜索
      posts = await Store.searchPostsWithES(window._curQuery, window._curCategory);

      searchResultsBar.textContent = `搜索「${window._curQuery}」，找到 ${posts.length} 条结果`;
      searchResultsBar.classList.add("visible");
    } else {
      // 从 API 获取帖子
      await Store.fetchPostsFromApi();
      posts = Store.getFilteredPosts(window._curCategory, window._curQuery);
      searchResultsBar.classList.remove("visible");
    }

    Render.renderFeed(feedContainer, emptyFeedMsg, posts, showDetail);
    animateNewCards();
    renderHotSearch();
  }

  // ===== 7. 帖子卡片入场动画 =====
  function animateNewCards() {
    const cards = feedContainer.querySelectorAll(".post-card:not(.animated)");
    cards.forEach((card, i) => {
      card.classList.add("animated");
      card.style.opacity = "0";
      card.style.transform = "translateY(16px)";
      card.style.transition = "none";
      requestAnimationFrame(() => {
        setTimeout(() => {
          card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
          card.style.opacity = "1";
          card.style.transform = "translateY(0)";
        }, i * 60);
      });
    });
  }

  // ===== 8. 新帖子实时插入（仅真实用户发布触发）=====
  document.addEventListener("th:postAdded", e => {
    const post = e.detail;
    if (!post) { refreshFeed(); return; }
    if (window._curQuery) return;
    if (window._curCategory !== "all" && window._curCategory !== post.category) return;

    const card = document.createElement("div");
    card.className = "post-card real-inject animated";
    card.dataset.id = post.id;
    const imgHtml = post.images && post.images.length
      ? `<div class="post-images">${post.images.map(u => `<img src="../resources/${u}" alt="">`).join("")}</div>`
      : "";
    const isMe = post.authorId === Store.currentUser.id;
    card.innerHTML = `
      <div class="post-header">
        <div class="avatar" style="cursor:pointer" data-author-id="${post.authorId}">${Render.escapeHtml(post.avatarLetter || "匿")}</div>
        <div class="post-meta" style="flex:1">
          <span class="post-author">${Render.escapeHtml(post.author)}</span>
          <span class="post-time">刚刚</span>
        </div>
        ${!isMe ? `<button class="follow-btn-card" data-author-id="${post.authorId}" data-author="${Render.escapeHtml(post.author)}" data-avatar="${Render.escapeHtml(post.avatarLetter || "匿")}">
          ${Store.isFollowing(post.authorId) ? '<i class="fas fa-check"></i> 已关注' : '<i class="fas fa-plus"></i> 关注'}
        </button>` : ""}
      </div>
      <div class="post-body">${Render.escapeHtml(post.content)}</div>
      ${imgHtml}
      <div class="post-actions" onclick="event.stopPropagation()">
        <button class="action-btn" data-action="like" data-id="${post.id}">
          <i class="far fa-heart"></i> ${post.likes || 0}
        </button>
        <button class="action-btn" data-action="comment" data-id="${post.id}">
          <i class="far fa-comment"></i> 0
        </button>
        <button class="action-btn" data-action="collect" data-id="${post.id}">
          <i class="far fa-bookmark"></i> 收藏
        </button>
      </div>`;

    card.style.opacity = "0";
    card.style.transform = "translateY(-12px)";
    if (emptyFeedMsg) emptyFeedMsg.style.display = "none";
    feedContainer.insertBefore(card, feedContainer.firstChild);
    requestAnimationFrame(() => {
      card.style.transition = "opacity 0.4s ease, transform 0.4s ease";
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    });

    card.addEventListener("click", () => showDetail(card.dataset.id));
    card.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const { action, id } = btn.dataset;
        if (action === "like") { Store.toggleLike(id); refreshFeed(); }
        else if (action === "collect") { Store.toggleCollect(id); refreshFeed(); }
        else if (action === "comment") showDetail(id);
      });
    });
    bindFollowBtns(card);
    renderHotSearch();
  });

  // ===== 9. 评论回复 =====

  function onReply(comment) {
    replyingTo = comment;
    updateReplyHint();
    commentInput.focus();
  }

  function updateReplyHint() {
    const hint = document.getElementById("replyHint");
    if (!hint) return;
    if (replyingTo) {
      hint.textContent = `回复 @${replyingTo.author}`;
      hint.style.display = "inline-flex";
    } else {
      hint.style.display = "none";
    }
  }

  submitCommentBtn.addEventListener("click", async () => {
    const text = commentInput.value.trim();
    if (!text || !currentPostId) return;
    try {
      const body = { content: text, isAnonymous: true };
      if (replyingTo && replyingTo.id) body.parentId = parseInt(replyingTo.id) || null;
      const res = await fetch("/api/treeholes/posts/" + currentPostId + "/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      });
      if (res.ok) {
        commentInput.value = "";
        replyingTo = null;
        updateReplyHint();
        const post = await Store.fetchPostFromApi(currentPostId);
        Render.renderComments(commentsList, commentCountEl, post, onReply);
        Render.updateNotifBadges();
      }
    } catch (e) {
      console.warn("addComment failed:", e);
    }
  });

  commentInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitCommentBtn.click(); }
    if (e.key === "Escape") { replyingTo = null; updateReplyHint(); }
  });

  // ===== 10. 导航栏搜索 =====
  let searchTimer = null;
  document.getElementById("searchInput").addEventListener("input", e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
      window._curQuery = e.target.value.trim();
      await refreshFeed();
    }, 300);
  });

  // 搜索按钮点击事件
  document.getElementById("searchButton").addEventListener("click", async e => {
    e.preventDefault();
    window._curQuery = document.getElementById("searchInput").value.trim();
    await refreshFeed();
  });

  // 搜索输入框回车事件
  document.getElementById("searchInput").addEventListener("keypress", async e => {
    if (e.key === "Enter") {
      e.preventDefault();
      window._curQuery = e.target.value.trim();
      await refreshFeed();
    }
  });

  // ===== 11. 左侧分类筛选 =====
  document.querySelectorAll(".sidebar-item[data-category]").forEach(item => {
    item.addEventListener("click", async () => {
      document.querySelectorAll(".sidebar-item[data-category]").forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      window._curCategory = item.dataset.category;
      await refreshFeed();
    });
  });

  // ===== 12. 通知栏点击 → 跳转收藏页对应 tab =====
  document.getElementById("notifyRepliesBtn").addEventListener("click", () => {
    window.location.href = "favorites.html#comments";
  });

  document.getElementById("notifyMsgBtn").addEventListener("click", () => {
    window.location.href = "favorites.html#messages";
  });

  // ===== 我的关注 =====
  document.getElementById("myFollowingBtn").addEventListener("click", () => {
    window.location.href = "favorites.html#following";
  });

  // ===== 我的收藏 =====
  document.getElementById("myFavoritesBtn").addEventListener("click", () => {
    window.location.href = "favorites.html";
  });

  // ===== 关注按钮 & 作者气泡 =====
  window.bindFollowBtns = function (root) {
    (root || document).querySelectorAll(".follow-btn-card").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const uid = btn.dataset.authorId;
        Store.toggleFollow(uid);
        const following = Store.isFollowing(uid);
        btn.innerHTML = following
          ? '<i class="fas fa-check"></i> 已关注'
          : '<i class="fas fa-plus"></i> 关注';
        btn.classList.toggle("following", following);
        // 同步气泡内按钮
        const card = btn.closest(".post-card");
        if (card) {
          const apBtn = card.querySelector(".ap-follow-btn");
          if (apBtn) {
            apBtn.textContent = following ? "已关注" : "+ 关注";
            apBtn.classList.toggle("following", following);
          }
        }
      });
    });

    (root || document).querySelectorAll(".ap-follow-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const uid = btn.dataset.authorId;
        Store.toggleFollow(uid);
        const following = Store.isFollowing(uid);
        btn.textContent = following ? "已关注" : "+ 关注";
        btn.classList.toggle("following", following);
        const card = btn.closest(".post-card");
        if (card) {
          const fbBtn = card.querySelector(".follow-btn-card");
          if (fbBtn) {
            fbBtn.innerHTML = following
              ? '<i class="fas fa-check"></i> 已关注'
              : '<i class="fas fa-plus"></i> 关注';
            fbBtn.classList.toggle("following", following);
          }
        }
      });
    });

    // 头像悬停气泡
    (root || document).querySelectorAll(".avatar-popover-wrap").forEach(wrap => {
      const avatar = wrap.querySelector(".avatar");
      const popover = wrap.querySelector(".author-popover");
      if (!avatar || !popover) return;
      let timer;
      avatar.addEventListener("mouseenter", () => {
        clearTimeout(timer);
        popover.classList.add("visible");
      });
      wrap.addEventListener("mouseleave", () => {
        timer = setTimeout(() => popover.classList.remove("visible"), 200);
      });
      popover.addEventListener("mouseenter", () => clearTimeout(timer));
    });
  };
  document.getElementById("backBtn").addEventListener("click", showHome);

  // ===== 14. 跨模块事件监听 =====

  // 检查从 publish.html 带回的新帖子
  const newPostRaw = sessionStorage.getItem("th_new_post");
  if (newPostRaw) {
    sessionStorage.removeItem("th_new_post");
    try {
      const newPost = JSON.parse(newPostRaw);
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent("th:postAdded", { detail: newPost }));
      }, 300);
    } catch (e) { }
  }

  // 检查从 favorites.html 带回的私信跳转
  const openChatRaw = sessionStorage.getItem("th_open_chat");
  if (openChatRaw) {
    sessionStorage.removeItem("th_open_chat");
    try {
      const { uid, name, avatar } = JSON.parse(openChatRaw);
      setTimeout(() => openMessage(uid, name, avatar), 200);
    } catch (e) { }
  }

  document.addEventListener("th:closeMessage", () => {
    if (currentPostId) showDetail(currentPostId);
    else showHome();
  });

  // 点击遮罩关闭欢迎弹窗
  welcomeModal.addEventListener("click", e => { if (e.target === welcomeModal) welcomeModal.classList.remove("open"); });

  // ===== 15. 用户设置面板 =====
  document.getElementById("userAvatarBtn").addEventListener("click", () => {
    window.location.href = "settings.html";
  }, true);

  // ===== 16. 初始渲染 =====
  (async function () {
    await refreshFeed();
    Render.updateNotifBadges();
  })();

  // ===== 17. 定时任务更新数据 =====
  function setupUpdateTask() {
    // 每5分钟更新一次数据
    setInterval(async () => {
      try {
        // 调用后端API更新数据
        const response = await fetch('/api/treeholes/update', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          console.log('数据更新成功');
          // 如果当前有搜索，刷新搜索结果
          if (window._curQuery) {
            await refreshFeed();
          }
        } else {
          console.warn('数据更新失败');
        }
      } catch (error) {
        console.warn('定时任务执行失败:', error);
      }
    }, 5 * 60 * 1000); // 5分钟
  }

  // 启动定时任务
  setupUpdateTask();
});
