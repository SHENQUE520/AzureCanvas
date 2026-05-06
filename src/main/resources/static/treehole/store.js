/**
 * store.js — Data Layer
 * Manages all persistent data: posts, users, follows, messages, notifications
 * Exposed to other modules via window.Store
 */
window.Store = (function () {
  // localStorage key names
  const KEYS = {
    posts: "th_posts_v3",
    user: "th_user",
    follows: "th_follows",
    messages: "th_messages",
    notifications: "th_notifications",
  };

  // ===== Internal State =====
  let posts = [];
  let currentUser = null;
  let follows = new Set(); // Set of followed authorIds
  let messages = {};       // { threadId: { withUser, messages[] } }
  let notifications = [];  // Notification list

  // ===== Default Mock Data =====
  function getMockPosts() {
    return [
      {
        id: "p1", author: "Anonymous Tree", authorId: "u_tree",
        avatarLetter: "A", timestamp: Date.now() - 3600000 * 5,
        content: "Does anyone know if the window seats on the third floor of the library need to be reserved now? 📚",
        category: "question", images: [], likes: 12, liked: false, collected: false,
        comments: [
          { id: "c1", author: "Helpful Classmate", authorId: "u_hot", text: "Yes, you need to reserve, it started last week", timestamp: Date.now() - 800000, replyTo: null },
          { id: "c2", author: "Librarian", authorId: "u_lib", text: "Yes, use the campus card app", timestamp: Date.now() - 400000, replyTo: null }
        ]
      },
      {
        id: "p2", author: "Graduation Countdown", authorId: "u_grad",
        avatarLetter: "G", timestamp: Date.now() - 86400000,
        content: "Taking graduation photos today, keeping four years of memories here 🎓 Thanks, Treehole.",
        category: "emotion", images: [], likes: 45, liked: false, collected: true,
        comments: [
          { id: "c3", author: "Junior", authorId: "u_junior", text: "Wishing seniors a bright future!", timestamp: Date.now() - 4000000, replyTo: null }
        ]
      },
      {
        id: "p3", author: "Canteen Observer", authorId: "u_food",
        avatarLetter: "C", timestamp: Date.now() - 7200000,
        content: "The new spicy hot pot at Canteen 2 is amazing! 🌶️ But the queue is a bit long.",
        category: "life", images: [], likes: 28, liked: true, collected: false,
        comments: []
      }
    ];
  }

  // ===== Initialization =====
  function init() {
    // Load posts
    try { posts = JSON.parse(localStorage.getItem(KEYS.posts)) || getMockPosts(); }
    catch (e) { posts = getMockPosts(); }

    // Load current user (default anonymous state, but will try to refresh via API)
    try { currentUser = JSON.parse(localStorage.getItem(KEYS.user)); }
    catch (e) { currentUser = null; }
    if (!currentUser) {
      currentUser = { id: null, nickname: "Not Logged In", avatarLetter: "N", avatarColor: "#555" };
    }

    // Load follows
    try { follows = new Set(JSON.parse(localStorage.getItem(KEYS.follows)) || []); }
    catch (e) { follows = new Set(); }

    // Load messages
    try { messages = JSON.parse(localStorage.getItem(KEYS.messages)) || {}; }
    catch (e) { messages = {}; }

    // Load notifications
    try { notifications = JSON.parse(localStorage.getItem(KEYS.notifications)) || []; }
    catch (e) { notifications = []; }
  }

  // ===== Persistence =====
  function save() {
    localStorage.setItem(KEYS.posts, JSON.stringify(posts));
    localStorage.setItem(KEYS.user, JSON.stringify(currentUser));
    localStorage.setItem(KEYS.follows, JSON.stringify([...follows]));
    localStorage.setItem(KEYS.messages, JSON.stringify(messages));
    localStorage.setItem(KEYS.notifications, JSON.stringify(notifications));
  }

  // ===== Post Operations =====

  /** Add new post */
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

  /** Toggle like */
  function toggleLike(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    post.liked = !post.liked;
    post.likes = (post.likes || 0) + (post.liked ? 1 : -1);
    save();
  }

  /** Toggle collect */
  function toggleCollect(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    post.collected = !post.collected;
    save();
  }

  /** Add comment (supports reply) */
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
    // Generate reply notification
    if (replyTo && replyTo.authorId !== currentUser.id) {
      addNotification("reply", `${currentUser.nickname} replied to you: ${text.slice(0, 20)}`, postId);
    }
    save();
    return comment;
  }

  // ===== Follow Operations =====

  /** Fetch my following list from API */
  async function fetchFollowingFromApi() {
    try {
      const res = await fetch("https://api.szsummer.com/api/users/me", { credentials: "include" });
      if (!res.ok) return [];
      const user = await res.json();
      const userId = user.userId || user.id;
      if (!userId) return [];

      const followRes = await fetch(`https://api.szsummer.com/api/users/${userId}/following`, { credentials: "include" });
      if (!followRes.ok) return [];
      const followingList = await followRes.json();

      // Update local follow set
      follows = new Set(followingList.map(u => u.userId || u.id));
      save();
      return followingList;
    } catch (e) {
      console.warn("fetchFollowingFromApi failed:", e);
      return [...follows];
    }
  }

  /** Toggle follow status, return new status (calls backend API) */
  async function toggleFollow(authorId) {
    try {
      const res = await fetch(`https://api.szsummer.com/api/users/${authorId}/follow`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        follows.add(authorId);
        save();
        return true;
      } else if (res.status === 400) {
        // Already following, try to unfollow
        return await unfollowUser(authorId);
      }
    } catch (e) {
      console.warn("toggleFollow API failed, using local:", e);
    }
    // Fallback to local operation
    if (follows.has(authorId)) {
      follows.delete(authorId);
    } else {
      follows.add(authorId);
    }
    save();
    return follows.has(authorId);
  }

  /** Unfollow user */
  async function unfollowUser(authorId) {
    try {
      const res = await fetch(`https://api.szsummer.com/api/users/${authorId}/follow`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        follows.delete(authorId);
        save();
        return true;
      }
    } catch (e) {
      console.warn("unfollowUser API failed:", e);
    }
    follows.delete(authorId);
    save();
    return false;
  }

  /** Is following (prefer local cache) */
  function isFollowing(authorId) {
    return follows.has(authorId);
  }

  // ===== Message Operations =====

  /** Get or create message thread */
  function getOrCreateThread(withUser) {
    const threadId = "thread_" + withUser.id;
    if (!messages[threadId]) {
      messages[threadId] = { threadId, withUser, messages: [] };
    }
    return messages[threadId];
  }

  /** Send message */
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

  /** Get message thread */
  function getThread(toUserId) {
    return messages["thread_" + toUserId] || null;
  }

  // ===== Notification Operations =====

  /** Add notification */
  function addNotification(type, content, postId) {
    notifications.unshift({
      id: "notif_" + Date.now(),
      type, content, postId,
      timestamp: Date.now(),
      read: false
    });
    save();
  }

  /** Mark all notifications as read */
  function markAllRead(type) {
    notifications.forEach(n => {
      if (!type || n.type === type) n.read = true;
    });
    save();
  }

  /** Unread notification count */
  function unreadCount(type) {
    return notifications.filter(n => !n.read && (!type || n.type === type)).length;
  }

  // ===== User Settings =====

  /** Update current user info */
  function updateUser(fields) {
    Object.assign(currentUser, fields);
    save();
  }

  // ===== Queries =====

  /** Filter posts by category + keyword */
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

  /** Search posts using ES */
  async function searchPostsWithES(keyword, category) {
    try {
      // Call backend ES API
      const response = await fetch(`https://api.szsummer.com/api/treeholes/search?keyword=${encodeURIComponent(keyword)}&category=${encodeURIComponent(category || 'all')}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Convert to frontend format
        return data.map(item => ({
          id: item.id,
          author: item.author || 'Anonymous User',
          authorId: item.authorId || 'anonymous',
          avatarLetter: item.avatarLetter || 'A',
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
        // API call failed, use local search
        console.warn('ES API call failed, using local search');
        return getFilteredPosts(category, keyword);
      }
    } catch (error) {
      // Network error, use local search
      console.warn('Network error, using local search:', error);
      return getFilteredPosts(category, keyword);
    }
  }

  /** Find post by id */
  function getPost(id) {
    return posts.find(p => p.id === id) || null;
  }

  /** Get followed user info (extracted from posts) */
  function getFollowedUsers() {
    const result = [];
    const seen = new Set();
    for (const id of follows) {
      if (seen.has(id)) continue;
      seen.add(id);
      const userPosts = posts.filter(p => p.authorId === id);
      if (userPosts.length > 0) {
        const p = userPosts[0];
        result.push({ id, nickname: p.author, avatarLetter: p.avatarLetter || "A", postCount: userPosts.length });
      } else {
        result.push({ id, nickname: "Anonymous User", avatarLetter: "A", postCount: 0 });
      }
    }
    return result;
  }

  /** Get collected posts */
  function getCollectedPosts() {
    return posts.filter(p => p.collected);
  }

  /** Fetch all posts from API */
  async function fetchPostsFromApi() {
    try {
      const res = await fetch("https://api.szsummer.com/api/treeholes/posts", { credentials: "include" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const apiPosts = await res.json();
      apiPosts.forEach(p => {
        p.id = p.id || p.postId || "post_" + p.id;
        p.author = p.author || "Anonymous User";
        p.avatarLetter = p.avatarLetter || (p.author ? p.author.substring(0, 1) : "A");
        p.avatarUrl = p.avatarUrl || null;
        p.images = p.imagesList || [];
        p.timestamp = p.createdAt ? new Date(p.createdAt).getTime() : Date.now();
        // Important: map API's likeCount to frontend's likes field
        p.likes = (p.likeCount !== undefined && p.likeCount !== null) ? p.likeCount : 0;
        p.liked = false;
        p.collected = false;
        p.comments = p.comments || [];
      });
      posts = apiPosts;
      save();
      return posts;
    } catch (e) {
      console.warn("fetchPostsFromApi failed, using local data:", e);
      // Use local data when API fails
      if (posts.length === 0) {
        posts = getMockPosts();
        save();
      }
      return posts;
    }
  }

  /** Fetch single post details from API */
  async function fetchPostFromApi(postId) {
    try {
      const res = await fetch("https://api.szsummer.com/api/treeholes/posts/" + postId, { credentials: "include" });
      if (!res.ok) return null;
      const p = await res.json();
      p.id = p.id || p.postId || "post_" + p.id;
      p.author = p.author || "";
      p.avatarLetter = p.avatarLetter || (p.author ? p.author.substring(0, 1) : "");
      p.avatarUrl = p.avatarUrl || null;
      p.images = p.imagesList || [];
      p.timestamp = p.createdAt ? new Date(p.createdAt).getTime() : Date.now();
      // Important: map API's likeCount to frontend's likes field
      p.likes = (p.likeCount !== undefined && p.likeCount !== null) ? p.likeCount : 0;
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

  /** Fetch post comments from API */
  async function fetchCommentsFromApi(postId) {
    try {
      const res = await fetch("https://api.szsummer.com/api/treeholes/posts/" + postId, { credentials: "include" });
      if (!res.ok) return [];
      const data = await res.json();
      return data.comments || [];
    } catch (e) {
      console.warn("fetchCommentsFromApi failed:", e);
      return [];
    }
  }

  /**
   * Enrich comment list with user info (recursively processes children)
   * @param {Array} comments comment array
   */
  async function enrichCommentsWithUserInfo(comments) {
    if (!comments || !comments.length) return [];
    
    // Recursive processing function
    const processComments = (list) => {
      list.forEach(c => {
        // Ensure id is a string
        c.id = String(c.id || c.commentId);
        
        // If userId exists but no author name, could supplement here (but backend buildCommentTreeWithUser should already do this)
        // Mainly ensure avatar (UUID) exists, if backend didn't return, we can map via c.userId or c.authorId
        
        if (c.children && c.children.length) {
          processComments(c.children);
        }
      });
    };

    processComments(comments);
    return comments;
  }

  // ===== Public API =====
  return {
    init, save,
    get posts() { return posts; },
    get currentUser() { return currentUser; },
    get notifications() { return notifications; },
    get messages() { return messages; },
    addPost, toggleLike, toggleCollect, addComment,
    toggleFollow, unfollowUser, isFollowing, fetchFollowingFromApi,
    sendMessage, getThread, getOrCreateThread,
    addNotification, markAllRead, unreadCount,
    updateUser,
    getFilteredPosts, getPost, searchPostsWithES,
    getFollowedUsers, getCollectedPosts,
    fetchPostsFromApi, fetchPostFromApi, fetchCommentsFromApi, enrichCommentsWithUserInfo
  };
})();
