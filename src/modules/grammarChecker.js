// ========================================
// Speakease — Grammar Checker v3
// Dataset-driven: loads rules from src/data/grammarPatterns.json
// ========================================
//
// SCORING — why "Good" was wrong before:
//   Old: starts at 100, subtract only for detected pattern violations.
//   If no violations → 100/100 even for "I am good. I do work. I like it."
//
// NEW scoring has 4 components:
//   1. Error penalty     (pattern violations from JSON dataset)
//   2. Quality penalty   (short sentences, low vocabulary diversity)
//   3. Professional bonus (uses interview-appropriate words)
//   4. Vague word penalty (uses vague/weak words)
//
// Result: weak but grammatically "legal" sentences → 40-60 range, not 100.

import grammarData from '../data/grammarPatterns.json';

// Build rule objects from JSON (convert pattern strings → RegExp)
const JSON_RULES = (grammarData.rules || []).map(r => ({
    pattern: new RegExp(r.pattern, 'gi'),
    type: r.type,
    hint: r.hint,
}));

const QUALITY_CONFIG = grammarData.sentenceQuality || {
    minSentenceLengthWords: 5,
    targetWordsPerSentence: 12,
    minVocabDiversityPercent: 55,
    interviewProfessionalWords: [],
    vagueWeakWords: [],
};

const PROFESSIONAL_WORDS = new Set(QUALITY_CONFIG.interviewProfessionalWords);
const VAGUE_WORDS = new Set(QUALITY_CONFIG.vagueWeakWords);

// ── Gibberish patterns ─────────────────────────────────────────────
const GIBBERISH = [
    /\b[b-df-hj-np-tv-z]{5,}\b/gi,
    /\b[aeiou]{4,}\b/gi,
    /\b(\w)\1{3,}\b/gi,
    /\b(blah|bla|bah|ugh|argh|meh|hmm|duh)\b/gi,
    /\b[a-z]{18,}\b/gi,
];

// ── Stop words excluded from repetition/diversity checks ─────────
const STOP_WORDS = new Set([
    'the','and','that','this','with','have','from','they','been','their',
    'will','would','could','should','about','which','when','what','there',
    'were','than','more','some','very','also','into','just','your','over',
    'such','after','most','only','other','these','then','them','being',
    'made','each','work','worked','time','really','thing','things','going',
    'said','like','know','think','good','well','one','two','first',
    'i','you','he','she','it','we','they','my','your','his','her','our',
    'a','an','is','are','was','in','of','to','for','on','at','by','as',
    'but','or','not','so','up','do','am','had','has','its','be',
]);

export class GrammarChecker {
    constructor() {
        this.errors = [];
        this.wordFrequency = {};
        this.gibberishCount = 0;
        this._lastQualityScore = 100;
    }

    analyze(text) {
        if (!text || text.trim().length < 4) return this._empty();
        const clean = text.trim();
        const errors = [];

        // ── 1. JSON Dataset Rules ──────────────────────────────────
        const sentences = clean.match(/[^.!?]+[.!?]*/g) || [clean];
        sentences.forEach((sentence, sIdx) => {
            JSON_RULES.forEach(rule => {
                try {
                    rule.pattern.lastIndex = 0;
                    const matches = sentence.match(rule.pattern);
                    if (!matches) return;
                    matches.forEach(match => {
                        errors.push({
                            type: rule.type,
                            original: match.trim(),
                            hint: rule.hint,
                            sentence: sentence.trim(),
                            sentenceIndex: sIdx,
                        });
                    });
                } catch (_) {}
            });
        });

        // ── 2. Gibberish detection ─────────────────────────────────
        this.gibberishCount = 0;
        GIBBERISH.forEach(p => {
            (clean.match(p) || []).forEach(h => {
                if (h.length < 3) return;
                this.gibberishCount++;
                errors.push({ type: 'gibberish', original: h, hint: `"${h}" — speak clearly`, sentence: clean, sentenceIndex: 0 });
            });
        });

        // ── 3. Very short sentences ────────────────────────────────
        sentences.forEach((s, idx) => {
            const words = s.trim().split(/\s+/).filter(Boolean);
            if (words.length > 0 && words.length < 4 && idx > 0) {
                errors.push({ type: 'incomplete', original: s.trim(), hint: 'Too short — develop your thought further', sentence: s.trim(), sentenceIndex: idx });
            }
        });

        // ── 4. Word frequency & diversity ─────────────────────────
        const words = clean.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 3);
        this.wordFrequency = {};
        words.forEach(w => { this.wordFrequency[w] = (this.wordFrequency[w] || 0) + 1; });
        const uniqueCount = Object.keys(this.wordFrequency).length;
        const vocabularyDiversity = words.length > 0 ? Math.round((uniqueCount / words.length) * 100) : 100;

        // Repetition check
        const repThreshold = words.length > 40 ? 3 : 2;
        const repetitiveWords = Object.entries(this.wordFrequency)
            .filter(([w, c]) => c >= repThreshold && !STOP_WORDS.has(w))
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word, count]) => ({ word, count }));
        repetitiveWords.forEach(({ word, count }) => {
            errors.push({ type: 'repetition', original: word, hint: `"${word}" used ${count} times — vary vocabulary`, sentence: '', sentenceIndex: -1 });
        });

        this.errors = errors;

        // Deduplicate
        const seen = new Set();
        const deduped = errors.filter(e => {
            const k = `${e.type}:${e.original.toLowerCase()}`;
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
        });

        // ── 5. Sentence quality metrics ────────────────────────────
        const qualityMetrics = this._calcQuality(clean, sentences, words, vocabularyDiversity);
        this._lastQualityScore = qualityMetrics.qualityScore;

        return {
            errors: deduped,
            suggestions: deduped.map(e => ({ original: e.original, improved: e.hint, type: e.type })),
            vocabularyDiversity,
            repetitiveWords,
            errorCount: deduped.length,
            gibberishCount: this.gibberishCount,
            qualityMetrics,
            errorTypes: {
                'subject-verb': deduped.filter(e => e.type === 'subject-verb').length,
                tense: deduped.filter(e => e.type === 'tense').length,
                pronoun: deduped.filter(e => e.type === 'pronoun').length,
                grammar: deduped.filter(e => e.type === 'grammar').length,
                informal: deduped.filter(e => e.type === 'informal').length,
                'double-negative': deduped.filter(e => e.type === 'double-negative').length,
                article: deduped.filter(e => e.type === 'article').length,
                vague: deduped.filter(e => e.type === 'vague').length,
                repetition: deduped.filter(e => e.type === 'repetition').length,
                gibberish: deduped.filter(e => e.type === 'gibberish').length,
                incomplete: deduped.filter(e => e.type === 'incomplete').length,
            },
        };
    }

    // ── Sentence quality scoring ───────────────────────────────────
    // Checks things pattern-matching can NEVER catch:
    //  - Are sentences too short? (< 5 words average)
    //  - Is the vocabulary diverse enough?
    //  - Are professional interview words used?
    //  - Are vague/filler words overused?
    _calcQuality(text, sentences, words, vocabDiversity) {
        const allSentenceWords = sentences.map(s =>
            s.trim().split(/\s+/).filter(Boolean).length
        );
        const avgSentenceLen = allSentenceWords.length > 0
            ? allSentenceWords.reduce((a, b) => a + b, 0) / allSentenceWords.length
            : 0;

        const lower = text.toLowerCase();

        // Professional word bonus (up to +20)
        const proWordHits = [...PROFESSIONAL_WORDS].filter(w => lower.includes(w)).length;
        const professionalBonus = Math.min(20, proWordHits * 4);

        // Vague word penalty (each vague word = -5, max -25)
        const vagueHits = [...VAGUE_WORDS].filter(w => {
            const re = new RegExp(`\\b${w}\\b`, 'gi');
            const count = (lower.match(re) || []).length;
            return count >= 2; // only penalize if used 2+ times
        }).length;
        const vaguePenalty = Math.min(25, vagueHits * 5);

        // Sentence length score (0–40)
        // Target: 10–15 words per sentence
        let sentLenScore = 0;
        if (avgSentenceLen >= 8 && avgSentenceLen <= 20) sentLenScore = 40;
        else if (avgSentenceLen >= 5) sentLenScore = 25;
        else if (avgSentenceLen >= 3) sentLenScore = 12;
        else sentLenScore = 0;

        // Vocabulary diversity score (0–40)
        let divScore = 0;
        if (vocabDiversity >= 70) divScore = 40;
        else if (vocabDiversity >= 55) divScore = 30;
        else if (vocabDiversity >= 40) divScore = 18;
        else divScore = 5;

        // Raw quality before bonuses/penalties
        const rawQuality = sentLenScore + divScore + professionalBonus - vaguePenalty;
        const qualityScore = Math.max(0, Math.min(100, Math.round(rawQuality)));

        return {
            qualityScore,
            avgSentenceLen: Math.round(avgSentenceLen * 10) / 10,
            proWordHits,
            vagueHits,
            professionalBonus,
            vaguePenalty,
            vocabDiversity,
            sentLenScore,
        };
    }

    // ── Final grammar score: pattern errors + quality ──────────────
    // OLD: 100 - (errors × 6). Weak sentence with 0 errors = 100. WRONG.
    // NEW: blend 50% error-based + 50% quality-based → honest score
    getScore(text) {
        const result = text ? this.analyze(text) : null;
        const qualScore = this._lastQualityScore;

        const strictErrors = this.errors.filter(e => e.type !== 'repetition');
        const errorPenalty = strictErrors.length * 7;
        const gibberishPenalty = this.gibberishCount * 12;
        const errorBased = Math.max(0, 100 - errorPenalty - gibberishPenalty);

        // Blend: 50% error-detection + 50% quality assessment
        const blended = Math.round(errorBased * 0.5 + qualScore * 0.5);
        return Math.max(0, Math.min(100, blended));
    }

    // Stricter thresholds — don't say "Good" for mediocre speech
    getFeedbackLabel(score) {
        if (score >= 85) return { label: 'Excellent', color: '#22c55e' };
        if (score >= 70) return { label: 'Good',      color: '#4ade80' };
        if (score >= 52) return { label: 'Fair',      color: '#fbbf24' };
        if (score >= 35) return { label: 'Needs Work', color: '#f97316' };
        return              { label: 'Poor',       color: '#ef4444' };
    }

    // Quality label (separate from grammar errors)
    getQualityLabel(qualityScore) {
        if (qualityScore >= 75) return { label: 'Strong', color: '#22c55e' };
        if (qualityScore >= 55) return { label: 'Decent', color: '#fbbf24' };
        if (qualityScore >= 35) return { label: 'Weak',   color: '#f97316' };
        return                   { label: 'Very Weak', color: '#ef4444' };
    }

    reset() {
        this.errors = [];
        this.wordFrequency = {};
        this.gibberishCount = 0;
        this._lastQualityScore = 100;
    }

    _empty() {
        return {
            errors: [], suggestions: [], vocabularyDiversity: 100,
            repetitiveWords: [], errorCount: 0, gibberishCount: 0,
            qualityMetrics: { qualityScore: 100, avgSentenceLen: 0, proWordHits: 0 },
            errorTypes: {},
        };
    }
}

export const grammarChecker = new GrammarChecker();
