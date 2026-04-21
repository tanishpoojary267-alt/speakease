// ========================================
// Speakease AI — Progress Tracker
// Saves sessions, scores, streaks to localStorage
// ========================================

const STORAGE_KEY = 'speakease_progress_v1';

const EMPATHY_QUOTES = [
    { text: "Every expert was once a beginner. Every pro was once an amateur.", author: "Robin Sharma" },
    { text: "The only way to do great work is to love what you do — keep practicing.", author: "Steve Jobs" },
    { text: "Confidence is not 'they will like me'. Confidence is 'I'll be fine if they don't'.", author: "Christina Grimmie" },
    { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
    { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
    { text: "A river cuts through rock not by power, but by persistence.", author: "James N. Watkins" },
    { text: "It's not about being the best. It's about being better than you were yesterday.", author: "Unknown" },
    { text: "Courage is not the absence of fear, but the triumph over it.", author: "Nelson Mandela" },
    { text: "Every interview is a practice run. Every practice run makes you stronger.", author: "Speakease AI" },
    { text: "Nervousness means you care. That's already a strength.", author: "Speakease AI" },
    { text: "The person who falls and gets up is much stronger than the one who never fell.", author: "Unknown" },
    { text: "Don't compare your beginning to someone else's middle.", author: "Jon Acuff" },
];

// Score-based empathy messages — tailored to what went wrong
const EMPATHY_MESSAGES = {
    low: [
        { trigger: 'nervous', msg: "Nervousness is just excitement without breath. Try the 4-7-8 breathing technique before your next session: inhale 4s, hold 7s, exhale 8s. It works." },
        { trigger: 'speech', msg: "Speaking slowly is a sign of confidence, not lack of it. Interviewers love a candidate who pauses to think. Practice speaking 20% slower next time." },
        { trigger: 'grammar', msg: "Even native speakers make grammar mistakes under pressure. What matters is your ideas — and you had good ones. Keep going." },
        { trigger: 'general', msg: "Today's session is data, not failure. You now know exactly what to work on. That's more than most people ever get." },
    ],
    mid: [
        { trigger: 'nervous', msg: "Your confidence is building — the nervousness score dropped compared to what it could be. One more session and you'll feel the shift." },
        { trigger: 'speech', msg: "Your speaking pace is getting steadier. Try recording yourself talking for 2 minutes tonight — you'll be surprised how far you've come." },
        { trigger: 'general', msg: "You're in the zone where progress feels invisible but it's happening. Three more sessions and you'll see a clear jump in your score." },
    ],
    good: [
        { trigger: 'general', msg: "You're interview-ready. Now it's about maintaining this level under real pressure. You've got this." },
    ],
};

// Growth-mindset score labels (replaces cold numbers)
export const SCORE_TIERS = [
    { min: 0, max: 30, label: '🌱 First Steps', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', encouragement: "Showing up takes courage. You took the first step — that's 50% of the journey." },
    { min: 30, max: 50, label: '📈 Building Up', color: '#f97316', bg: 'rgba(249,115,22,0.1)', encouragement: "You're forming habits. This is where real growth begins — keep the momentum." },
    { min: 50, max: 65, label: '⚡ Getting There', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', encouragement: "You're past the halfway mark. The hard part is behind you — push through." },
    { min: 65, max: 80, label: '🎯 Almost Ready', color: '#6366f1', bg: 'rgba(99,102,241,0.1)', encouragement: "This score would impress most interviewers. You're refining, not rebuilding." },
    { min: 80, max: 101, label: '🏆 Interview Ready', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', encouragement: "Outstanding. Walk into your next interview with your head held high." },
];

export function getScoreTier(score) {
    return SCORE_TIERS.find(t => score >= t.min && score < t.max) || SCORE_TIERS[0];
}

export function getDailyQuote() {
    const dayIndex = Math.floor(Date.now() / 86400000) % EMPATHY_QUOTES.length;
    return EMPATHY_QUOTES[dayIndex];
}

export function getEmpathyMessage(score, dominantWeakness = 'general') {
    const bank = score < 50 ? EMPATHY_MESSAGES.low : score < 70 ? EMPATHY_MESSAGES.mid : EMPATHY_MESSAGES.good;
    const specific = bank.find(m => m.trigger === dominantWeakness);
    return (specific || bank.find(m => m.trigger === 'general') || bank[0]).msg;
}

class ProgressTracker {
    constructor() {
        this.data = this._load();
    }

    _load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (_) { }
        return { sessions: [], streak: 0, lastSessionDate: null, totalSessions: 0 };
    }

    _save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        } catch (_) { }
    }

    saveSession({ overall, confidence, communication, bodyLanguage, grammar, config, timestamp }) {
        const today = new Date().toDateString();
        const lastDate = this.data.lastSessionDate;

        // Streak logic
        if (lastDate === today) {
            // Same day — don't double-count streak
        } else if (lastDate === new Date(Date.now() - 86400000).toDateString()) {
            this.data.streak += 1; // consecutive day
        } else {
            this.data.streak = 1; // streak reset
        }

        this.data.lastSessionDate = today;
        this.data.totalSessions = (this.data.totalSessions || 0) + 1;

        const entry = {
            id: Date.now(),
            date: timestamp || new Date().toISOString(),
            overall,
            confidence,
            communication,
            bodyLanguage,
            grammar,
            config: config || {},
        };

        this.data.sessions.unshift(entry);
        if (this.data.sessions.length > 30) {
            this.data.sessions = this.data.sessions.slice(0, 30);
        }

        this._save();
        return entry;
    }

    getRecentSessions(n = 5) {
        return this.data.sessions.slice(0, n);
    }

    getBestScore() {
        if (!this.data.sessions.length) return 0;
        return Math.max(...this.data.sessions.map(s => s.overall || 0));
    }

    getTrend() {
        // Compare last 2 sessions
        const sessions = this.data.sessions;
        if (sessions.length < 2) return 'first';
        const diff = (sessions[0].overall || 0) - (sessions[1].overall || 0);
        if (diff > 4) return 'up';
        if (diff < -4) return 'down';
        return 'steady';
    }

    getStreak() { return this.data.streak || 0; }
    getTotalSessions() { return this.data.totalSessions || 0; }
    hasHistory() { return this.data.sessions.length > 0; }

    clear() {
        this.data = { sessions: [], streak: 0, lastSessionDate: null, totalSessions: 0 };
        this._save();
    }
}

export const progressTracker = new ProgressTracker();
