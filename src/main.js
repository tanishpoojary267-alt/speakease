// ========================================
// Speakease — Main Entry Point
// ========================================

// Styles
import './styles/variables.css';
import './styles/base.css';
import './styles/components.css';
import './styles/pages.css';

// Core
import { router } from './router.js';
import { store } from './store.js';
import { initTheme } from './components/ThemeToggle.js';

// Pages
import { LandingPage } from './pages/LandingPage.js';
import { SetupPage } from './pages/SetupPage.js';
import { SessionPage } from './pages/SessionPage.js';
import { ReportPage } from './pages/ReportPage.js';

// ── Initialize Theme ──
initTheme();

// ── App Container ──
const appEl = document.getElementById('app');
if (!appEl) throw new Error('#app element not found');

// Apply initial transition styles
appEl.style.opacity = '1';
appEl.style.transform = 'translateY(0)';
appEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

// ── Register Routes ──
router.addRoute('/', () => new LandingPage());
router.addRoute('/setup', () => new SetupPage());
router.addRoute('/session', () => new SessionPage());
router.addRoute('/report', () => new ReportPage());

// ── Initialize App ──
router.init(appEl);

// ── Global: Initialize Lucide icons after each route change ──
router.onNavigate = () => {
    requestAnimationFrame(() => {
        if (window.lucide) window.lucide.createIcons();
    });
};

// ── Service Worker (optional PWA) - Register if available ──
if ('serviceWorker' in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register('/sw.js').catch(() => { });
}

console.log('%c🎤 Speakease loaded', 'color:#6366f1;font-weight:bold;font-size:16px');
