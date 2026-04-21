// ========================================
// Speakease — SPA Router
// ========================================

export class Router {
    constructor() {
        this.routes = {};
        this.currentPage = null;
        this.container = null;
        this.onNavigate = null;

        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    init(container) {
        this.container = container;
        this.handleRoute();
    }

    addRoute(path, pageFactory) {
        this.routes[path] = pageFactory;
    }

    navigate(path) {
        window.location.hash = path;
    }

    getCurrentPath() {
        return window.location.hash.slice(1) || '/';
    }

    async handleRoute() {
        const path = this.getCurrentPath();
        const pageFactory = this.routes[path] || this.routes['/'];

        if (!pageFactory || !this.container) return;

        // Animate out current page
        if (this.currentPage) {
            this.container.style.opacity = '0';
            this.container.style.transform = 'translateY(10px)';
            await new Promise(r => setTimeout(r, 200));
        }

        // Clear and render new page
        this.container.innerHTML = '';
        this.currentPage = pageFactory();

        if (typeof this.currentPage === 'string') {
            this.container.innerHTML = this.currentPage;
        } else if (this.currentPage instanceof HTMLElement) {
            this.container.appendChild(this.currentPage);
        } else if (this.currentPage && typeof this.currentPage.render === 'function') {
            const el = this.currentPage.render();
            if (typeof el === 'string') {
                this.container.innerHTML = el;
            } else {
                this.container.appendChild(el);
            }
            if (typeof this.currentPage.mount === 'function') {
                // Defer mount to next frame so DOM is ready
                requestAnimationFrame(() => this.currentPage.mount());
            }
        }

        // Animate in
        requestAnimationFrame(() => {
            this.container.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            this.container.style.opacity = '1';
            this.container.style.transform = 'translateY(0)';
        });

        // Initialize Lucide icons if available
        if (window.lucide) {
            window.lucide.createIcons();
        }

        if (this.onNavigate) {
            this.onNavigate(path);
        }
    }
}

export const router = new Router();
