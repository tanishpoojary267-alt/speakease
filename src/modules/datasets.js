// ========================================
// Speakease — Datasets Module v3
// ========================================
// Loads emotions from src/data/emotions.json
// Loads question keywords from src/data/questionKeywords.json
// Uses SIMPLE matching: answer is relevant if 3+ of 10 keywords appear.
// This is transparent, explainable, and dataset-driven.

import emotionsData from '../data/emotions.json';
import questionData from '../data/questionKeywords.json';

// ── 1. EMOTION STATE MAP (loaded from JSON) ──────────────────────────
// face-api.js outputs: neutral, happy, sad, angry, fearful, surprised, disgusted
export const EMOTION_STATE_MAP = emotionsData.emotions;

// Get interview state for a dominant emotion
export function getEmotionState(expressions) {
    if (!expressions) return EMOTION_STATE_MAP.neutral;
    let maxVal = 0, dominant = 'neutral';
    for (const [emotion, val] of Object.entries(expressions)) {
        if (val > maxVal) { maxVal = val; dominant = emotion; }
    }
    return EMOTION_STATE_MAP[dominant] || EMOTION_STATE_MAP.neutral;
}

// ── 2. FILLER WORDS ──────────────────────────────────────────────────
export const FILLER_SINGLE_WORDS = [
    'um', 'uh', 'uhh', 'umm', 'ummm', 'uhhh', 'uhm',
    'er', 'err', 'errr',
    'ah', 'ahh', 'aah', 'aaa', 'aaah', 'aa',
    'hmm', 'hm', 'huh',
    'like', 'basically', 'actually', 'honestly',
    'right', 'well', 'okay', 'ok',
    'so', 'yeah', 'yep', 'yup',
    'just', 'totally', 'absolutely', 'definitely',
    'essentially', 'generally', 'typically',
    'technically', 'obviously', 'clearly',
    'whatever', 'anyway', 'anyways', 'alright',
    'frankly', 'hopefully', 'fundamentally',
];

export const FILLER_PHRASES = [
    'you know', 'i mean', 'sort of', 'kind of',
    'so yeah', 'you see', 'okay so', 'right so',
    'you know what i mean', 'like i said',
    'at the end of the day', 'to be honest', 'to be fair',
    'i think', 'i guess', 'i suppose', 'i feel like',
    'and stuff', 'and things', 'and so on',
    'if that makes sense', 'does that make sense',
    'at the same time', 'kind of like', 'sort of like',
    'more or less', 'something like that', 'et cetera',
    'or whatever', 'so to speak', 'in other words',
    'long story short', 'needless to say',
    'going forward', 'moving forward',
];

// ── 3. INTERVIEW PROFANITY / UNPROFESSIONAL LANGUAGE LIST ────────────
// IMPORTANT: These are matched using FULL WORD BOUNDARIES only (\bword\b)
// to prevent false positives like "accomplish" matching "ass".
// 50 explicit words/phrases that should NEVER appear in a professional interview.
export const INTERVIEW_PROFANITY_LIST = [
    // Strong profanity
    'fuck', 'fucker', 'fucking', 'fucked', 'motherfucker',
    'shit', 'bullshit', 'shitty', 'bullshitting',
    'bitch', 'bitching', 'bastard',
    'cunt', 'cock', 'dick', 'prick',
    'pussy', 'ass', 'asshole', 'jackass', 'dumbass', 'smartass',
    'tits', 'boobs', 'boob', 'titty',
    'piss', 'pissed', 'pissing',
    'crap', 'crappy',
    'damnit', 'goddamn', 'goddamnit', 'damn',
    'whore', 'slut', 'slag',
    'retard', 'retarded',
    'fag', 'faggot',
    'nigga', 'nigger',
    'hell',
    // Aggressive slang
    'screw you', 'screw this', 'screw it',
    'hate this', 'hate you', 'hate my',
    'shut up', 'shut the',
    'wtf', 'stfu', 'gtfo', 'omfg',
    // Highly unprofessional terms
    'loser', 'idiot', 'moron', 'stupid',
    'dumbass', 'dumbo', 'doughhead',
    'jerk', 'jerkoff',
];

// Build pre-compiled regex patterns for whole-word matching
// This is done ONCE at module load — no regex recompilation per transcript
export const PROFANITY_PATTERNS = INTERVIEW_PROFANITY_LIST.map(word => ({
    word,
    pattern: new RegExp(`\\b${word.replace(/\s+/g, '\\s+')}\\b`, 'i'),
}));

// Returns array of matched profanity words found in text (empty = clean)
// Handles BOTH real words AND Chrome Web Speech API censored words (bull****, f***)
export function detectProfanity(text) {
    if (!text) return [];
    const lower = text.toLowerCase();
    const found = [];

    // 1. Direct word-boundary match (for uncensored speech)
    PROFANITY_PATTERNS.forEach(({ pattern, word }) => {
        if (pattern.test(lower)) found.push(word);
    });

    // 2. Censored asterisk detection — Chrome replaces profanity with asterisks
    //    e.g. "bullshit" → "********", "fuck" → "f***", "shit" → "****"
    //    Match ANY sequence of 3+ consecutive asterisks — Chrome's censor pattern
    const asteriskPattern = /\*{3,}/g;
    const censored = lower.match(asteriskPattern);
    if (censored && censored.length > 0) {
        found.push(...censored.map(w => `[censored: ${w}]`));
    }

    return found;
}

// ── 4. INTERVIEW SLANG / INFORMAL LANGUAGE LIST ───────────────────────
// These are informal but NOT profanity — they trigger "Caution" not "WARNING"
// Also matched using full word boundaries to avoid false positives.
export const INTERVIEW_SLANG_LIST = [
    'gonna', 'wanna', 'gotta', 'kinda', 'sorta',
    'gimme', 'lemme', 'ain\'t', 'dunno',
    'lol', 'lmao', 'omg', 'bruh', 'bro', 'dude', 'yolo',
    'nah', 'nope', 'yep', 'yup',
    'chill', 'chillin', 'chilling',
    'super', 'totally', 'legit', 'literally',
    'heck', 'dang', 'darn',
    'cool cool', 'stuff', 'things',
    'awesome', 'epic',
];

export const SLANG_PATTERNS = INTERVIEW_SLANG_LIST.map(word => ({
    word,
    pattern: new RegExp(`\\b${word.replace(/\s+/g, '\\s+')}\\b`, 'i'),
}));

// Returns array of matched slang words (empty = clean)
export function detectSlang(text) {
    if (!text) return [];
    const lower = text.toLowerCase();
    return SLANG_PATTERNS
        .filter(({ pattern }) => pattern.test(lower))
        .map(({ word }) => word);
}

// ── 3. QUESTION KEYWORDS (from JSON dataset) ─────────────────────────
// Each question has exactly 10 keywords.
// The dataset threshold is 3: user must match 3+ of 10 to be relevant.
const KEYWORD_THRESHOLD = questionData.threshold || 3;
const KEYWORD_LIST = questionData.questions || [];

// Find matching question entry (fuzzy match on question text)
export function getKeywordsForQuestion(questionText) {
    if (!questionText || !KEYWORD_LIST.length) return [];
    const lower = questionText.toLowerCase().replace(/[^a-z0-9\s]/g, '');

    // Try substring match: question text contains the dataset key
    for (const entry of KEYWORD_LIST) {
        const key = entry.q.toLowerCase();
        // Check if 2+ words from dataset key appear in the question
        const keyWords = key.split(/\s+/).filter(w => w.length > 3);
        const hits = keyWords.filter(w => lower.includes(w));
        if (hits.length >= 2) return entry.keywords;
    }

    // Reverse: check if 2+ question words appear in our dataset keys
    const qWords = lower.split(/\s+/).filter(w => w.length > 3);
    for (const entry of KEYWORD_LIST) {
        const key = entry.q.toLowerCase();
        const hits = qWords.filter(w => key.includes(w));
        if (hits.length >= 2) return entry.keywords;
    }

    // Fallback: extract meaningful words from the question itself as keywords
    const STOP = new Set(['what', 'when', 'where', 'who', 'how', 'why', 'tell', 'give', 'about', 'your', 'the', 'and', 'for', 'are', 'you', 'this', 'that', 'have', 'will', 'with', 'can', 'its', 'them', 'they', 'our', 'from', 'into', 'more', 'most', 'some', 'any', 'but', 'not', 'does']);
    return lower.split(/\s+/)
        .map(w => w.replace(/[^a-z]/g, ''))
        .filter(w => w.length >= 4 && !STOP.has(w))
        .slice(0, 10);
}

// ── 4. SIMPLE RELEVANCE CALCULATOR ───────────────────────────────────
// Logic: check if answer contains 3+ of the 10 keywords.
// Score = (matched / total) × 100
// isRelevant = matched >= threshold (3)
// SIMPLE, TRANSPARENT, EXPLAINABLE — perfect for a college project.
export function calcAnswerRelevance(questionText, answerText) {
    const keywords = getKeywordsForQuestion(questionText);
    if (!keywords || keywords.length === 0) {
        return { score: 50, matched: [], total: 0, isRelevant: true, matchCount: 0 };
    }

    const lower = (answerText || '').toLowerCase();

    // Simple word presence check (no stemming needed — keeps it transparent)
    const matched = keywords.filter(kw => {
        const k = kw.toLowerCase();
        // Whole-word match (avoids matching "skill" inside "skillset" wrong)
        const regex = new RegExp(`\\b${k}`, 'i');
        return regex.test(lower);
    });

    const matchCount = matched.length;
    const score = Math.round((matchCount / keywords.length) * 100);
    const isRelevant = matchCount >= KEYWORD_THRESHOLD;

    return {
        score,
        matched,
        total: keywords.length,
        matchCount,
        threshold: KEYWORD_THRESHOLD,
        isRelevant,
        // Explainable message
        explanation: `Matched ${matchCount} of ${keywords.length} keywords (need ${KEYWORD_THRESHOLD} to be relevant)`,
    };
}
