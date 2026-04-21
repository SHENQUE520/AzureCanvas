// render.js
window.Render = {
  // 时间转换逻辑
  formatTime(ts) {
    const date = new Date(ts);
    const now = Date.now();
    const diff = now - ts;
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    return `${date.getMonth() + 1}/${date.getDate()}`;
  },

  // HTML 安全转义
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // 渲染首页列表
  renderFeed(container, emptyMsg, posts, onCardClick) {
    if (posts.length === 0) {
      container.innerHTML = '';
      emptyMsg.style.display = 'block';
      return;
    }
    emptyMsg.style.display = 'none';

    let html = '';
    const sorted = [...posts].sort((a, b) => b.timestamp - a.timestamp);
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
              <span class="post-time">· ${this.formatTime(post.timestamp)}</span>
            </div>
          </div>
          <div class="post-content">${this.escapeHtml(post.content)}</div>
          ${imageTags}
          <div class="post-stats">
            <span><i class="far fa-heart"></i> ${post.likes || 0}</span>
            <span><i class="far fa-comment"></i> ${commentCount}</span>
            ${post.collected ? '<span><i class="fas fa-bookmark"></i> 已收藏</span>' : ''}
          </div>
        </div>`;
    });
    container.innerHTML = html;
    
    // 绑定点击事件进入详情
    container.querySelectorAll('.post-card').forEach(card => {
      card.onclick = () => onCardClick(card.dataset.postId);
    });
  }
};