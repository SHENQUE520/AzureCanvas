// store.js
window.Store = {
  posts: [],
  currentPostId: null,
  selectedImages: [],

  // 初始化：优先读取本地缓存，否则加载默认数据
  init() {
    const saved = localStorage.getItem('campus_treehole_posts');
    if (saved) {
      try {
        this.posts = JSON.parse(saved);
      } catch (e) {
        this.posts = this.getMockData();
      }
    } else {
      this.posts = this.getMockData();
    }
    this.save();
  },

  // 持久化到本地
  save() {
    localStorage.setItem('campus_treehole_posts', JSON.stringify(this.posts));
  },

  // 原始 Mock 数据
  getMockData() {
    return [
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
  }
};