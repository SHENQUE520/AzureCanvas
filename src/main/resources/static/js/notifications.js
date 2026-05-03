/**
 * Gorgeous Bubble Notifications
 * Styles using Tailwind CSS classes with custom glassmorphism.
 */
class NotificationManager {
    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = 'fixed top-5 right-5 z-[19999] flex flex-col gap-3 pointer-events-none';
        document.body.appendChild(this.container);
        
        this.types = {
            success: {
                bg: 'bg-emerald-500/20',
                border: 'border-emerald-500/50',
                text: 'text-emerald-400',
                icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            },
            error: {
                bg: 'bg-rose-500/20',
                border: 'border-rose-500/50',
                text: 'text-rose-400',
                icon: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z'
            },
            warning: {
                bg: 'bg-amber-500/20',
                border: 'border-amber-500/50',
                text: 'text-amber-400',
                icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z'
            }
        };
    }

    show(message, type = 'success', duration = 5000) {
        const config = this.types[type] || this.types.success;
        
        const notification = document.createElement('div');
        notification.className = `
            pointer-events-auto
            flex items-center gap-3 px-4 py-3 rounded-2xl
            backdrop-filter border
            ${config.bg} ${config.border} ${config.text}
            shadow-2xl shadow-black/20
            translate-x-full opacity-0 transition-all duration-500 ease-out
            min-w-[280px] max-w-md 
            z-[19999]
        `;

        notification.innerHTML = `
            <div class="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="${config.icon}" />
                </svg>
            </div>
            <div class="flex-grow font-medium text-sm">
                ${message}
            </div>
            <button class="flex-shrink-0 hover:opacity-70 transition-opacity close-btn">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        `;

        this.container.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.classList.remove('translate-x-full', 'opacity-0');
        });

        const close = () => {
            notification.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => {
                notification.remove();
            }, 500);
        };

        notification.querySelector('.close-btn').onclick = close;

        if (duration > 0) {
            setTimeout(close, duration);
        }
    }

    /**
     * Show a bubble error under a specific input element
     * @param {HTMLElement} element - The input element
     * @param {string} message - The error message
     * @param {number} duration - How long to show (ms)
     */
    showInputError(element, message, duration = 3000) {
        const container = element.parentElement;
        if (!container) return;

        // Remove existing error bubbles for this element
        const existing = container.querySelector('.input-error-bubble');
        if (existing) existing.remove();

        const bubble = document.createElement('div');
        bubble.className = `
            input-error-bubble
            absolute left-0 top-full mt-1 px-3 py-1.5
            bg-rose-500 text-white text-xs font-medium rounded-lg
            shadow-lg z-[20000] whitespace-nowrap
            animate-in fade-in slide-in-from-top-1 duration-200
        `;
        bubble.innerHTML = `
            <div class="absolute -top-1 left-4 w-2 h-2 bg-rose-500 rotate-45"></div>
            ${message}
        `;

        // Ensure container is relative for absolute positioning
        const originalPosition = window.getComputedStyle(container).position;
        if (originalPosition === 'static') {
            container.style.position = 'relative';
        }

        container.appendChild(bubble);

        setTimeout(() => {
            bubble.classList.add('animate-out', 'fade-out', 'slide-out-to-top-1');
            setTimeout(() => bubble.remove(), 200);
        }, duration);
    }
}

// Global instance
window.notify = new NotificationManager();

// Utility function to get CSRF token from cookie
window.getCsrfToken = function() {
    const name = 'XSRF-TOKEN=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return null;
};