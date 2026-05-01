/**
 * render.js — 渲染层
 * 负责将数据渲染为 HTML，通过 window.Render 暴露
 * 依赖：store.js（Store）
 */
window.Render = (function () {

  // ===== 工具函数 =====

  /** 相对时间格式化 */
  function formatTime(ts) {
    const diff = Date.now() - ts;
    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return Math.floor(diff / 60000) + "分钟前";
    if (diff < 86400000) return Math.floor(diff / 3600000) + "小时前";
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  /** HTML 转义，防止 XSS */
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /** 渲染用户头像：有 avatarUrl 则用图片，否则粉紫渐变+首字母 */
  function renderAvatar(avatarUrl, avatarLetter, extraClass) {
    const letter = avatarLetter || "匿";
    const cls = extraClass || "";
    if (avatarUrl) {
      return `<img src="${avatarUrl}" alt="" class="${cls}" style="border-radius:50%;object-fit:cover;${getAvatarSizeStyle(cls)}" onerror="this.style.display='none'">`;
    }
    return `<div class="${cls}" style="border-radius:50%;background:linear-gradient(135deg,#ff9a9e 0%,#fecfef 50%,#fad0c4 100%);color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.2);${getAvatarSizeStyle(cls)};display:flex;align-items:center;justify-content:center;font-weight:600;">${escapeHtml(letter)}</div>`;
  }

  function getAvatarSizeStyle(cls) {
    if (cls.includes("detail-avatar")) return "width:56px;height:56px;font-size:1.3rem;";
    if (cls.includes("ap-avatar")) return "width:48px;height:48px;font-size:1.2rem;";
    if (cls.includes("comment-avatar")) return "width:32px;height:32px;font-size:0.8rem;";
    return "width:42px;height:42px;font-size:0.95rem;";
  }

  /** 高亮关键字 */
  function highlightKeyword(text, keyword) {
    if (!keyword || !text) return escapeHtml(text);
    // 检查text是否已经包含后端返回的高亮标签
    if (text.includes('<em>')) {
      return text; // 已经包含高亮标签，直接返回
    }
    // 检查text是否已经包含前端高亮标签
    if (text.includes('<span class="text-red-500 font-bold">')) {
      return text; // 已经包含高亮标签，直接返回
    }
    // 将关键词分解为单个字符，分别标红
    var chars = keyword.split('');
    var result = escapeHtml(text);
    chars.forEach(function (char) {
      if (char.trim()) {
        var regex = new RegExp('(' + escapeHtml(char) + ')', 'gi');
        result = result.replace(regex, '<span class="text-red-500 font-bold">$1</span>');
      }
    });
    return result;
  }

  // ===== 帖子流渲染 =====

  /**
   * 渲染主页帖子流
   * @param {HTMLElement} container - 帖子容器
   * @param {HTMLElement} emptyEl - 空状态提示元素
   * @param {Array} posts - 帖子数组
   * @param {Function} onCardClick - 点击卡片回调(postId)
   */
  function renderFeed(container, emptyEl, posts, onCardClick) {
    if (!posts || posts.length === 0) {
      container.innerHTML = "";
      if (emptyEl) emptyEl.style.display = "block";
      return;
    }
    if (emptyEl) emptyEl.style.display = "none";

    container.innerHTML = posts.map(post => {
      const imgHtml = post.images && post.images.length
        ? `<div class="post-images">${post.images.map(u => `<img src="${u}" alt="">`).join("")}</div>`
        : "";
      const commentCount = post.comments ? post.comments.length : 0;
      const isMe = post.authorId === Store.currentUser.id;
      const following = Store.isFollowing(post.authorId);
      const followBtn = isMe ? "" : `
        <button class="follow-btn-card ${following ? "following" : ""}" data-author-id="${post.authorId}"
          data-author="${escapeHtml(post.author)}" data-avatar="${escapeHtml(post.avatarLetter || "匿")}">
          ${following ? '<i class="fas fa-check"></i> 已关注' : '<i class="fas fa-plus"></i> 关注'}
        </button>`;
      const userPosts = Store.posts.filter(p => p.authorId === post.authorId).length;
      return `
        <div class="post-card animated" data-id="${post.id}">
          <div class="post-header">
            <div class="avatar-popover-wrap">
              ${renderAvatar(post.avatarUrl, post.avatarLetter)}
              <div class="author-popover">
                ${renderAvatar(post.avatarUrl, post.avatarLetter, "ap-avatar")}
                <div class="ap-name">${escapeHtml(post.author)}</div>
                <div class="ap-meta">${userPosts} 条帖子</div>
                ${!isMe ? `<button class="ap-follow-btn ${following ? "following" : ""}" data-author-id="${post.authorId}">
                  ${following ? "已关注" : "+ 关注"}
                </button>` : ""}
              </div>
            </div>
            <div class="post-meta" style="flex:1">
              <span class="post-author">${escapeHtml(post.author)}</span>
              <span class="post-time">${formatTime(post.timestamp)}</span>
            </div>
            ${followBtn}
          </div>
          <div class="post-body">${highlightKeyword(post.content, window._curQuery)}</div>
          ${imgHtml}
          <div class="post-actions" onclick="event.stopPropagation()">
            <button class="action-btn ${post.liked ? "liked" : ""}" data-action="like" data-id="${post.id}">
              <i class="${post.liked ? "fas" : "far"} fa-heart"></i> ${post.likes || 0}
            </button>
            <button class="action-btn" data-action="comment" data-id="${post.id}">
              <i class="far fa-comment"></i> ${commentCount}
            </button>
            <button class="action-btn ${post.collected ? "collected" : ""}" data-action="collect" data-id="${post.id}">
              <i class="${post.collected ? "fas" : "far"} fa-bookmark"></i> ${post.collected ? "已收藏" : "收藏"}
            </button>
          </div>
        </div>`;
    }).join("");

    container.querySelectorAll(".post-card").forEach(card => {
      card.addEventListener("click", () => onCardClick(card.dataset.id));
    });

    container.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const { action, id } = btn.dataset;
        if (action === "like") { Store.toggleLike(id); renderFeed(container, emptyEl, Store.getFilteredPosts(window._curCategory, window._curQuery), onCardClick); }
        else if (action === "collect") { Store.toggleCollect(id); renderFeed(container, emptyEl, Store.getFilteredPosts(window._curCategory, window._curQuery), onCardClick); }
        else if (action === "comment") onCardClick(id);
      });
    });

    // 关注按钮 & 气泡由 main.js bindFollowBtns 处理
    if (window.bindFollowBtns) window.bindFollowBtns(container);
  }

  // ===== 详情页渲染 =====

  /**
   * 渲染帖子详情（帖子主体部分）
   * @param {HTMLElement} bodyEl - 帖子主体容器
   * @param {HTMLElement} actionsEl - 操作栏容器
   * @param {Object} post - 帖子对象
   * @param {Function} onFollowClick - 关注/私信按钮回调
   */
  function renderDetailPost(bodyEl, actionsEl, post, onFollowClick) {
    const imgHtml = post.images && post.images.length
      ? `<div class="post-images">${post.images.map(u => `<img src="${u}" alt="">`).join("")}</div>`
      : "";

    const isMe = post.authorId === Store.currentUser.id;
    const following = Store.isFollowing(post.authorId);

    // 关注/私信按钮（自己的帖子不显示）
    const followBtn = isMe ? "" : following
      ? `<button class="btn btn-sm" id="detailMsgBtn" data-author-id="${post.authorId}" data-author="${escapeHtml(post.author)}" data-avatar="${escapeHtml(post.avatarLetter || "匿")}">
           <i class="far fa-comment-dots"></i> 私信
         </button>`
      : `<button class="btn btn-sm" id="detailFollowBtn" data-author-id="${post.authorId}">
           <i class="fas fa-plus"></i> 关注
         </button>`;

    bodyEl.innerHTML = `
      <div class="post-header">
        <div id="detailAvatar" data-author-id="${post.authorId}" style="cursor:pointer" title="点击关注">
          ${renderAvatar(post.avatarUrl, post.avatarLetter, "detail-avatar")}
        </div>
        <div class="post-meta" style="flex:1">
          <span class="post-author">${escapeHtml(post.author)}</span>
          <span class="post-time">${formatTime(post.timestamp)}</span>
        </div>
        ${followBtn}
      </div>
      <div class="post-body" style="font-size:1rem; margin:14px 0;">${highlightKeyword(post.content, window._curQuery)}</div>
      ${imgHtml}
    `;

    actionsEl.innerHTML = `
      <button class="action-btn ${post.liked ? "liked" : ""}" id="detailLikeBtn">
        <i class="${post.liked ? "fas" : "far"} fa-heart"></i> ${post.likes || 0} 点赞
      </button>
      <button class="action-btn ${post.collected ? "collected" : ""}" id="detailCollectBtn">
        <i class="${post.collected ? "fas" : "far"} fa-bookmark"></i> ${post.collected ? "已收藏" : "收藏"}
      </button>
    `;

    // 绑定点赞/收藏
    document.getElementById("detailLikeBtn").addEventListener("click", () => {
      Store.toggleLike(post.id);
      renderDetailPost(bodyEl, actionsEl, Store.getPost(post.id), onFollowClick);
    });
    document.getElementById("detailCollectBtn").addEventListener("click", () => {
      Store.toggleCollect(post.id);
      renderDetailPost(bodyEl, actionsEl, Store.getPost(post.id), onFollowClick);
    });

    // 绑定关注按钮
    const followBtnEl = document.getElementById("detailFollowBtn");
    if (followBtnEl) {
      followBtnEl.addEventListener("click", async () => {
        await Store.toggleFollow(post.authorId);
        renderDetailPost(bodyEl, actionsEl, Store.getPost(post.id), onFollowClick);
        updateNotifBadges();
      });
    }

    // 绑定私信按钮
    const msgBtnEl = document.getElementById("detailMsgBtn");
    if (msgBtnEl) {
      msgBtnEl.addEventListener("click", () => {
        onFollowClick(msgBtnEl.dataset.authorId, msgBtnEl.dataset.author, msgBtnEl.dataset.avatar);
      });
    }

    // 点击头像也可关注
    const avatarEl = document.getElementById("detailAvatar");
    if (avatarEl && !isMe) {
      avatarEl.addEventListener("click", async () => {
        await Store.toggleFollow(post.authorId);
        renderDetailPost(bodyEl, actionsEl, Store.getPost(post.id), onFollowClick);
        updateNotifBadges();
      });
    }
  }

  // ===== 评论渲染 =====

  function countComments(comments) {
    if (!comments || comments.length === 0) return 0;
    let count = 0;
    for (const c of comments) {
      count++;
      if (c.children && c.children.length) count += countComments(c.children);
    }
    return count;
  }

  function renderCommentNode(c, depth, onReply) {
    const replyTag = c.parentId
      ? `<span class="reply-tag">回复 #${c.parentId}</span> `
      : "";
    const authorName = c.authorName || c.author || "匿名用户";
    const avatarUrl = c.avatarUrl || null;
    const avatarLetter = c.avatarLetter || (authorName ? authorName.substring(0, 1) : "匿");
    const time = c.createdAt
      ? formatTime(new Date(c.createdAt).getTime())
      : formatTime(c.timestamp || Date.now());
    const text = c.content || c.text || "";
    const children = c.children && c.children.length > 0
      ? `<div class="comment-children">${c.children.map(child => renderCommentNode(child, depth + 1, onReply)).join("")}</div>`
      : "";
    return `
      <div class="comment-item" data-cmt-id="${c.id}" style="margin-left: ${depth * 16}px">
        <div class="comment-header">
          ${renderAvatar(avatarUrl, avatarLetter, "comment-avatar")}
          <span class="comment-author">${escapeHtml(authorName)}</span>
          <span class="comment-time">${time}</span>
          <button class="reply-btn" data-cmt-id="${c.id}">回复</button>
        </div>
        <div class="comment-text">${replyTag}${escapeHtml(text)}</div>
        ${children}
      </div>`;
  }

  /**
   * 渲染评论列表（支持多级嵌套）
   * @param {HTMLElement} listEl - 评论列表容器
   * @param {HTMLElement} countEl - 评论数标题元素
   * @param {Object} post - 帖子对象
   * @param {Function} onReply - 回复回调(comment)
   */
  function renderComments(listEl, countEl, post, onReply) {
    const totalCount = countComments(post.comments);
    if (countEl) countEl.textContent = `评论 (${totalCount})`;
    if (!post.comments || post.comments.length === 0) {
      listEl.innerHTML = `<div class="empty-tip" style="padding:16px 0;">暂无评论，抢沙发</div>`;
      return;
    }
    listEl.innerHTML = post.comments.map(c => renderCommentNode(c, 0, onReply)).join("");

    listEl.querySelectorAll(".reply-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const findComment = (list, id) => {
          for (const c of list) {
            if (String(c.id) === String(id)) return c;
            if (c.children && c.children.length) {
              const found = findComment(c.children, id);
              if (found) return found;
            }
          }
          return null;
        };
        const cmt = findComment(post.comments, btn.dataset.cmtId);
        if (cmt && onReply) onReply(cmt);
      });
    });
  }

  // ===== 通知徽章更新 =====

  function setBadge(el, count) {
    if (!el) return;
    if (count <= 0) { el.style.display = "none"; return; }
    el.style.display = "inline-block";
    el.textContent = count > 99 ? "…" : count;
  }

  /** 更新左侧栏通知徽章数字 */
  function updateNotifBadges() {
    const replyCount = Store.unreadCount("reply");
    setBadge(document.getElementById("replyBadge"), replyCount);

    // 私信：有对方最后发言的会话数
    const myId = Store.currentUser.id;
    const msgCount = Object.values(Store.messages).filter(t => {
      const msgs = t.messages;
      return msgs.length > 0 && msgs[msgs.length - 1].from !== myId;
    }).length;
    setBadge(document.getElementById("msgBadge"), msgCount);

    // 收藏：已收藏帖子数
    const collectCount = Store.getCollectedPosts().length;
    setBadge(document.getElementById("collectBadge"), collectCount);
  }

  // ===== 公开 API =====
  return { formatTime, escapeHtml, renderAvatar, getAvatarSizeStyle, renderFeed, renderDetailPost, renderComments, updateNotifBadges };
})();
