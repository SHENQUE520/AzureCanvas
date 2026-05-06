(function () {
    const root = document.documentElement;

    const THEME_VARS = {
        light: {
            '--bg': '#ffffff',
            '--bg-subtle': '#f6f8fa',
            '--bg-inset': '#f0f0f0',
            '--text': '#1f2328',
            '--text-muted': '#656d76',
            '--text-light': '#9198a1',
            '--hover-bg': '#f3f4f6',
            '--border': '#e8eaed',
            '--border-muted': '#e8eaed'
        },
        dark: {
            '--bg': '#0d1117',
            '--bg-subtle': '#161b22',
            '--bg-inset': '#21262d',
            '--text': '#e6edf3',
            '--text-muted': '#8b949e',
            '--text-light': '#6e7681',
            '--hover-bg': '#30363d',
            '--border': '#30363d',
            '--border-muted': '#30363d'
        }
    };

    function applyTheme(mode) {
        const vars = THEME_VARS[mode];
        Object.entries(vars).forEach(([prop, val]) => {
            root.style.setProperty(prop, val);
        });

        document.body.style.backgroundColor = mode === 'dark' ? 'rgba(13,17,23,0.96)' : '#000e1c';

        applyComponentStyles(mode);
    }

    function applyComponentStyles(mode) {
        const isDark = mode === 'dark';

        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.style.background = isDark ? 'rgba(44,33,79,0.64)' : 'rgba(255, 255, 255, 0.72)';
            navbar.style.borderBottomColor = isDark ? '#30363d' : 'transparent';
        }

        document.querySelectorAll('.sidebar-section').forEach(el => {
            el.style.background = isDark ? 'rgba(22,27,34,0.7)' : 'var(--bg)';
            el.style.borderColor = isDark ? '#30363d' : 'transparent';
        });

        document.querySelectorAll('.widget').forEach(el => {
            el.style.background = isDark ? '#161b22' : 'var(--bg)';
            el.style.borderColor = isDark ? '#30363d' : 'transparent';
        });

        document.querySelectorAll('.post-card').forEach(el => {
            el.style.background = isDark ? 'rgba(33, 38, 45, 0.95)' : 'var(--bg)';
            el.style.color = isDark ? '#e6edf3' : 'var(--text)';
            el.style.borderColor = isDark ? '#30363d' : 'transparent';
        });

        document.querySelectorAll('.home-section-card').forEach(el => {
            el.style.background = isDark ? 'rgba(22,27,34,0.72)' : 'var(--bg)';
            el.style.borderColor = isDark ? '#30363d' : 'transparent';
        });

        document.querySelectorAll('.home-input-bar').forEach(el => {
            el.style.background = isDark ? 'rgba(22,27,34,0.68)' : 'var(--bg)';
            el.style.borderColor = isDark ? '#30363d' : 'transparent';
        });

        document.querySelectorAll('.detail-card').forEach(el => {
            el.style.background = isDark ? '#161b22' : 'var(--bg)';
            el.style.borderColor = isDark ? '#30363d' : 'transparent';
        });

        document.querySelectorAll('.msg-header, .msg-list, .msg-input-bar, .quick-reply-panel').forEach(el => {
            el.style.background = isDark ? '#161b22' : 'var(--bg)';
            el.style.borderColor = isDark ? '#30363d' : 'transparent';
        });

        document.querySelectorAll('.modal-card').forEach(el => {
            el.style.background = isDark ? '#161b22' : 'var(--bg)';
            el.style.borderColor = isDark ? '#30363d' : 'transparent';
        });

        document.querySelectorAll('.bubble-theirs').forEach(el => {
            el.style.background = isDark ? '#21262d' : 'var(--bg-inset)';
            el.style.color = isDark ? '#e6edf3' : 'var(--text)';
            el.style.borderColor = isDark ? '#30363d' : 'transparent';
        });

        document.querySelectorAll('.btn-primary').forEach(el => {
            el.style.background = isDark ? '#58a6ff' : 'var(--text)';
            el.style.color = '#ffffff';
        });

        document.querySelectorAll('.btn:not(.btn-primary)').forEach(el => {
            el.style.color = isDark ? '#e6edf3' : 'var(--text)';
        });
    }

    if (typeof btn !== 'undefined' && btn) {
        btn.addEventListener('change', e => {
            const mode = e.detail === 'dark' ? 'dark' : 'light';
            applyTheme(mode);
        });
    }

    applyTheme('light');
})();
