/**
 * store.js — 数据层
 * 管理所有持久化数据：帖子、用户、关注、私信、通知
 * 通过 window.Store 暴露给其他模块
 */
window.Store = (function () {
  // localStorage 键名
  const KEYS = {
    posts: "th_posts_v3",
    user: "th_user",
    follows: "th_follows",
    messages: "th_messages",
    notifications: "th_notifications",
  };

  // ===== 内部状态 =====
  let posts = [];
  let currentUser = null;
  let follows = new Set(); // 关注的 authorId 集合
  let messages = {};       // { threadId: { withUser, messages[] } }
  let notifications = [];  // 通知列表

  // ===== 默认 Mock 数据 =====
  function getMockPosts() {
    return [
      {
        id: "p1", author: "匿名小树", authorId: "u_tree",
        avatarLetter: "匿", timestamp: Date.now() - 3600000 * 5,
        content: "有人知道图书馆三楼靠窗的座位现在需要预约吗？📚",
        category: "question", images: [], likes: 12, liked: false, collected: false,
        comments: [
          { id: "c1", author: "热心同学", authorId: "u_hot", text: "需要预约，上周就开始啦", timestamp: Date.now() - 800000, replyTo: null },
          { id: "c2", author: "图书管理员", authorId: "u_lib", text: "是的，用校园卡app", timestamp: Date.now() - 400000, replyTo: null }
        ]
      },
      {
        id: "p2", author: "毕业倒计时", authorId: "u_grad",
        avatarLetter: "毕", timestamp: Date.now() - 86400000,
        content: "今天拍毕业照，把四年的记忆留在这里🎓 谢谢树洞。",
        category: "emotion", images: [], likes: 45, liked: false, collected: true,
        comments: [
          { id: "c3", author: "学妹", authorId: "u_junior", text: "学长学姐前程似锦！", timestamp: Date.now() - 4000000, replyTo: null }
        ]
      },
      {
        id: "p3", author: "食堂观察员", authorId: "u_food",
        avatarLetter: "食", timestamp: Date.now() - 7200000,
        content: "二食堂新出的麻辣香锅绝了！🌶️ 但是排队有点长。",
        category: "life", images: [], likes: 28, liked: true, collected: false,
        comments: []
      }
    ];
  }

  // ===== 初始化 =====
  function init() {
    // 加载帖子
    try { posts = JSON.parse(localStorage.getItem(KEYS.posts)) || getMockPosts(); }
    catch (e) { posts = getMockPosts(); }

    // 加载当前用户（默认匿名）
    try { currentUser = JSON.parse(localStorage.getItem(KEYS.user)); }
    catch (e) { currentUser = null; }
    if (!currentUser) {
      currentUser = { id: "me", nickname: "我的树洞", avatarLetter: "我", avatarColor: "#555" };
    }

    // 加载关注列表
    try { follows = new Set(JSON.parse(localStorage.getItem(KEYS.follows)) || []); }
    catch (e) { follows = new Set(); }

    // 加载私信
    try { messages = JSON.parse(localStorage.getItem(KEYS.messages)) || {}; }
    catch (e) { messages = {}; }

    // 加载通知
    try { notifications = JSON.parse(localStorage.getItem(KEYS.notifications)) || []; }
    catch (e) { notifications = []; }
  }

  // ===== 持久化 =====
  function save() {
    localStorage.setItem(KEYS.posts, JSON.stringify(posts));
    localStorage.setItem(KEYS.user, JSON.stringify(currentUser));
    localStorage.setItem(KEYS.follows, JSON.stringify([...follows]));
    localStorage.setItem(KEYS.messages, JSON.stringify(messages));
    localStorage.setItem(KEYS.notifications, JSON.stringify(notifications));
  }

  // ===== 帖子操作 =====

  /** 新增帖子 */
  function addPost(content, category, images) {
    const post = {
      id: "post_" + Date.now(),
      author: currentUser.nickname,
      authorId: currentUser.id,
      avatarLetter: currentUser.avatarLetter,
      timestamp: Date.now(),
      content, category: category || "all",
      images: images || [],
      likes: 0, liked: false, collected: false, comments: []
    };
    posts.unshift(post);
    save();
    return post;
  }

  /** 切换点赞 */
  function toggleLike(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    post.liked = !post.liked;
    post.likes = (post.likes || 0) + (post.liked ? 1 : -1);
    save();
  }

  /** 切换收藏 */
  function toggleCollect(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    post.collected = !post.collected;
    save();
  }

  /** 添加评论（支持回复） */
  function addComment(postId, text, replyTo) {
    const post = posts.find(p => p.id === postId);
    if (!post) return null;
    const comment = {
      id: "cmt_" + Date.now(),
      author: currentUser.nickname,
      authorId: currentUser.id,
      text,
      timestamp: Date.now(),
      replyTo: replyTo || null  // { id, author, authorId }
    };
    post.comments.push(comment);
    // 生成回复通知
    if (replyTo && replyTo.authorId !== currentUser.id) {
      addNotification("reply", `${currentUser.nickname} 回复了你：${text.slice(0, 20)}`, postId);
    }
    save();
    return comment;
  }

  // ===== 关注操作 =====

  /** 切换关注状态，返回新状态 */
  function toggleFollow(authorId) {
    if (follows.has(authorId)) {
      follows.delete(authorId);
    } else {
      follows.add(authorId);
    }
    save();
    return follows.has(authorId);
  }

  /** 是否已关注 */
  function isFollowing(authorId) {
    return follows.has(authorId);
  }

  // ===== 私信操作 =====

  /** 获取或创建私信会话 */
  function getOrCreateThread(withUser) {
    const threadId = "thread_" + withUser.id;
    if (!messages[threadId]) {
      messages[threadId] = { threadId, withUser, messages: [] };
    }
    return messages[threadId];
  }

  /** 发送私信 */
  function sendMessage(toUserId, toNickname, toAvatarLetter, text, type) {
    const withUser = { id: toUserId, nickname: toNickname, avatarLetter: toAvatarLetter };
    const thread = getOrCreateThread(withUser);
    thread.messages.push({
      id: "msg_" + Date.now(),
      from: currentUser.id,
      text,
      timestamp: Date.now(),
      type: type || "text"
    });
    save();
    return thread;
  }

  /** 获取私信会话 */
  function getThread(toUserId) {
    return messages["thread_" + toUserId] || null;
  }

  // ===== 通知操作 =====

  /** 添加通知 */
  function addNotification(type, content, postId) {
    notifications.unshift({
      id: "notif_" + Date.now(),
      type, content, postId,
      timestamp: Date.now(),
      read: false
    });
    save();
  }

  /** 标记所有通知已读 */
  function markAllRead(type) {
    notifications.forEach(n => {
      if (!type || n.type === type) n.read = true;
    });
    save();
  }

  /** 未读通知数 */
  function unreadCount(type) {
    return notifications.filter(n => !n.read && (!type || n.type === type)).length;
  }

  // ===== 用户设置 =====

  /** 更新当前用户信息 */
  function updateUser(fields) {
    Object.assign(currentUser, fields);
    save();
  }

  // ===== 查询 =====

  /** 按分类+关键词过滤帖子 */
  function getFilteredPosts(category, query) {
    let result = [...posts].sort((a, b) => b.timestamp - a.timestamp);
    if (category && category !== "all") {
      result = result.filter(p => p.category === category);
    }
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(p =>
        p.content.toLowerCase().includes(q) || p.author.toLowerCase().includes(q)
      );
    }
    return result;
  }

  /** 使用ES搜索帖子 */
  async function searchPostsWithES(keyword, category) {
    try {
      // 调用后端ES API
      const response = await fetch(`/api/treeholes/search?keyword=${encodeURIComponent(keyword)}&category=${encodeURIComponent(category || 'all')}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // 转换为前端需要的格式
        return data.map(item => ({
          id: item.id,
          author: item.author || '匿名用户',
          authorId: item.authorId || 'anonymous',
          avatarLetter: item.avatarLetter || '匿',
          timestamp: item.timestamp || Date.now(),
          content: item.content || '',
          category: item.category || 'all',
          images: item.images || [],
          likes: item.likes || 0,
          liked: item.liked || false,
          collected: item.collected || false,
          comments: item.comments || []
        }));
      } else {
        // API调用失败，使用本地搜索
        console.warn('ES API调用失败，使用本地搜索');
        return getFilteredPosts(category, keyword);
      }
    } catch (error) {
      // 网络错误，使用本地搜索
      console.warn('网络错误，使用本地搜索:', error);
      return getFilteredPosts(category, keyword);
    }
  }

  /** 根据 id 查找帖子 */
  function getPost(id) {
    return posts.find(p => p.id === id) || null;
  }

  /** 获取已关注用户信息（从帖子中提取） */
  function getFollowedUsers() {
    const result = [];
    const seen = new Set();
    for (const id of follows) {
      if (seen.has(id)) continue;
      seen.add(id);
      const userPosts = posts.filter(p => p.authorId === id);
      if (userPosts.length > 0) {
        const p = userPosts[0];
        result.push({ id, nickname: p.author, avatarLetter: p.avatarLetter || "匿", postCount: userPosts.length });
      } else {
        result.push({ id, nickname: "匿名用户", avatarLetter: "匿", postCount: 0 });
      }
    }
    return result;
  }

  /** 获取已收藏帖子 */
  function getCollectedPosts() {
    return posts.filter(p => p.collected);
  }

  /** 从 API 获取所有帖子 */
  async function fetchPostsFromApi() {
    try {
      const res = await fetch("/api/treeholes/posts", { credentials: "include" });
      if (!res.ok) return [];
      const apiPosts = await res.json();
      apiPosts.forEach(p => {
        p.id = p.id || p.postId || "post_" + p.id;
        p.author = p.author || "匿名用户";
        p.avatarLetter = p.avatarLetter || (p.author ? p.author.substring(0, 1) : "匿");
        p.avatarUrl = p.avatarUrl || null;
        p.images = p.imagesList || [];
        p.timestamp = p.createdAt ? new Date(p.createdAt).getTime() : Date.now();
        p.liked = false;
        p.collected = false;
        p.comments = p.comments || [];
      });
      posts = apiPosts;
      save();
      return posts;
    } catch (e) {
      console.warn("fetchPostsFromApi failed:", e);
      return posts;
    }
  }

  /** 从 API 获取单个帖子详情 */
  async function fetchPostFromApi(postId) {
    try {
      const res = await fetch("/api/treeholes/posts/" + postId, { credentials: "include" });
      if (!res.ok) return null;
      const p = await res.json();
      p.id = p.id || p.postId || "post_" + p.id;
      p.author = p.author || "匿名用户";
      p.avatarLetter = p.avatarLetter || (p.author ? p.author.substring(0, 1) : "匿");
      p.avatarUrl = p.avatarUrl || null;
      p.images = p.imagesList || [];
      p.timestamp = p.createdAt ? new Date(p.createdAt).getTime() : Date.now();
      p.liked = false;
      p.collected = false;
      const idx = posts.findIndex(x => String(x.id) === String(postId));
      if (idx >= 0) posts[idx] = p;
      else posts.unshift(p);
      save();
      return p;
    } catch (e) {
      console.warn("fetchPostFromApi failed:", e);
      return getPost(postId);
    }
  }

  /** 从 API 获取帖子的评论 */
  async function fetchCommentsFromApi(postId) {
    try {
      const res = await fetch("/api/treeholes/posts/" + postId, { credentials: "include" });
      if (!res.ok) return [];
      const data = await res.json();
      return data.comments || [];
    } catch (e) {
      console.warn("fetchCommentsFromApi failed:", e);
      return [];
    }
  }

  // ===== 公开 API =====
  return {
    init, save,
    get posts() { return posts; },
    get currentUser() { return currentUser; },
    get notifications() { return notifications; },
    get messages() { return messages; },
    addPost, toggleLike, toggleCollect, addComment,
    toggleFollow, isFollowing,
    sendMessage, getThread, getOrCreateThread,
    addNotification, markAllRead, unreadCount,
    updateUser,
    getFilteredPosts, getPost, searchPostsWithES,
    getFollowedUsers, getCollectedPosts,
    fetchPostsFromApi, fetchPostFromApi, fetchCommentsFromApi
  };
})();
