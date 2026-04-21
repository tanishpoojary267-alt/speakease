// ========================================
// Speakease — Theme Toggle
// ========================================

import { store } from '../store.js';

export class ThemeToggle {
    render() {
        const btn = document.createElement('button');
        btn.className = 'btn btn-icon btn-ghost theme-toggle';
        btn.id = 'theme-toggle';
        btn.setAttribute('data-tooltip', 'Toggle theme');
        btn.innerHTML = `<i data-lucide="${store.get('theme') === 'dark' ? 'sun' : 'moon'}" style="width:20px;height:20px"></i>`;

        btn.addEventListener('click', () => {
            const current = store.get('theme');
            const next = current === 'dark' ? 'light' : 'dark';
            store.set('theme', next);
            document.documentElement.setAttribute('data-theme', next);
            btn.innerHTML = `<i data-lucide="${next === 'dark' ? 'sun' : 'moon'}" style="width:20px;height:20px"></i>`;
            if (window.lucide) window.lucide.createIcons();
        });

        return btn;
    }
}

export function initTheme() {
    const theme = store.get('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
}
