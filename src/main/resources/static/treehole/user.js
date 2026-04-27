/**
 * user.js — 用户模块
 * 仅负责右上角头像按钮的渲染与同步
 */
window.UserModule = (function () {

  function init() {
    fetchCurrentUser();
  }

  async function fetchCurrentUser() {
    try {
      const res = await fetch("/api/users/me", { credentials: "include" });
      if (res.ok) {
        const u = await res.json();
        Store.updateUser({ id: u.userId, nickname: u.username, avatarUrl: u.avatarUrl, avatarLetter: u.username ? u.username.substring(0, 1) : "我" });
      }
    } catch (e) {
      console.warn("fetchCurrentUser failed:", e);
    }
    renderUserBadge();
  }

  function renderUserBadge() {
    const btn = document.getElementById("userAvatarBtn");
    if (!btn) return;
    const u = Store.currentUser;
    if (u.avatarUrl) {
      btn.textContent = "";
      btn.style.backgroundImage = `url(${u.avatarUrl})`;
      btn.style.backgroundSize = "cover";
      btn.style.backgroundPosition = "center";
    } else {
      const letter = u.avatarLetter || u.nickname ? u.nickname.substring(0, 1) : "我";
      btn.textContent = letter;
      btn.style.backgroundImage = "linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)";
      btn.style.backgroundSize = "auto";
    }
  }

  function openSettings() {
    window.location.href = "settings.html";
  }

  return { init, renderUserBadge, openSettings };
})();
