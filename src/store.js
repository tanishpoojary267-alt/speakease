// ========================================
// Speakease — Global State Store
// ========================================

const STORAGE_KEY = 'speakease_data';

const defaultState = {
    // Theme
    theme: 'dark',

    // Interview Config
    config: {
        field: '',
        role: '',
        experience: 'fresher',
        interviewType: 'mixed',
        difficulty: 'medium',
        duration: 10,
        interviewerTone: 'professional'
    },

    // Active Session Data
    session: {
        active: false,
        startTime: null,
        endTime: null,
        currentQuestionIndex: 0,
        questions: [],
        answers: [],
        transcript: '',

        // Face metrics over time
        faceMetrics: {
            confidenceHistory: [],
            nervousnessHistory: [],
            eyeContactHistory: [],
            smileHistory: [],
            blinkCount: 0,
            headStabilityHistory: [],
            expressionCounts: {}
        },

        // Speech metrics
        speechMetrics: {
            totalWords: 0,
            fillerWords: [],
            fillerCount: 0,
            wpmHistory: [],
            currentWpm: 0,
            pauseCount: 0,
            longPauseCount: 0,
            stutterCount: 0,
            volumeHistory: [],
            clarityScore: 0
        },

        // Grammar metrics
        grammarMetrics: {
            errors: [],
            errorCount: 0,
            suggestions: [],
            vocabularyDiversity: 0,
            sentenceStructureScore: 0
        }
    },

    // Past sessions for history tracking
    history: [],

    // Current live metrics (for display during session)
    liveMetrics: {
        confidence: 0,
        nervousness: 0,
        eyeContact: 0,
        wpm: 0,
        fillerCount: 0,
        speakingSpeed: 'normal'
    }
};

class Store {
    constructor() {
        this.state = this.loadState();
        this.listeners = new Map();
    }

    loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return this.deepMerge(structuredClone(defaultState), parsed);
            }
        } catch (e) {
            console.warn('Failed to load state:', e);
        }
        return structuredClone(defaultState);
    }

    deepMerge(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                this.deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
        return target;
    }

    saveState() {
        try {
            // Only persist config, theme, and history — not active session data
            const toSave = {
                theme: this.state.theme,
                config: this.state.config,
                history: this.state.history
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        } catch (e) {
            console.warn('Failed to save state:', e);
        }
    }

    get(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], this.state);
    }

    set(path, value) {
        const keys = path.split('.');
        const last = keys.pop();
        const target = keys.reduce((obj, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, this.state);

        target[last] = value;
        this.notify(path, value);
        this.saveState();
    }

    update(path, updater) {
        const current = this.get(path);
        this.set(path, updater(current));
    }

    subscribe(path, callback) {
        if (!this.listeners.has(path)) {
            this.listeners.set(path, new Set());
        }
        this.listeners.get(path).add(callback);

        return () => {
            this.listeners.get(path)?.delete(callback);
        };
    }

    notify(changedPath, value) {
        this.listeners.forEach((callbacks, path) => {
            if (changedPath.startsWith(path) || path.startsWith(changedPath)) {
                callbacks.forEach(cb => cb(value, changedPath));
            }
        });
    }

    resetSession() {
        this.state.session = structuredClone(defaultState.session);
        this.state.liveMetrics = structuredClone(defaultState.liveMetrics);
        this.notify('session', this.state.session);
        this.notify('liveMetrics', this.state.liveMetrics);
    }

    saveSessionToHistory() {
        const session = this.state.session;
        if (!session.startTime) return;

        const historyEntry = {
            id: Date.now(),
            date: new Date().toISOString(),
            config: { ...this.state.config },
            duration: session.endTime
                ? (new Date(session.endTime) - new Date(session.startTime)) / 1000
                : 0,
            questionsAnswered: session.answers.length,
            scores: null // Will be set by report generator
        };

        this.state.history.unshift(historyEntry);

        // Keep only last 20 sessions
        if (this.state.history.length > 20) {
            this.state.history = this.state.history.slice(0, 20);
        }

        this.saveState();
    }

    getLastHistoryEntry() {
        return this.state.history[0] || null;
    }

    clearHistory() {
        this.state.history = [];
        this.saveState();
    }
}

export const store = new Store();
