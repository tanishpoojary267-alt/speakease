// ========================================
// Speakease — AI Interview Evaluator v5
// ========================================
// Bug fixes vs v4:
//  1. TECH_Q_WORDS: removed 'what is' / 'what are the' (too generic, mis-classifies "What is your weakness?")
//  2. BHV_Q_WORDS: added 'what is your' as an explicit behavioral pattern
//  3. BHV_A_SIGNALS: purged generic I-phrases (i think, i am, i have…) that made EVERY answer "Behavioral"
//  4. STAR_SIGNALS: phrase-level only — removed bare 'situation','task','action','result' words
//  5. FILLER_WORDS: removed 'like' — too ambiguous ("technologies like React" is NOT a filler)
//  6. checkRelevance: Technical Q + Behavioral A → NOT relevant (was wrongly marked relevant)
//  7. Score formula: 4 dims, spec weights: Relevance 40% | Depth 25% | Structure 20% | Comm 15%
//  8. Minimum threshold for returning a score: 3 words (caller enforces 20-word gate externally)

// ── Behavioral question starter phrases ───────────────────────────────────

const BHV_STARTERS = [
    'tell me about a time', 'describe a time', 'describe a situation',
    'describe when', 'give an example', 'have you ever', 'can you give',
    'share an experience', 'walk me through', 'talk about a time',
];

// ── Behavioral question signals (word-level) ──────────────────────────────
// NOTE: 'what is your' added here so "What is your greatest weakness?" → BEHAVIORAL

const BHV_Q_WORDS = [
    // Personal-stance questions ("what is your X")
    'what is your', 'what are your',
    // Common HR patterns
    'what motivates', 'where do you see', 'why did you', 'why do you',
    'how do you handle', 'how did you handle', 'how would you deal',
    'how do you deal', 'how have you', 'how do you work',
    'what do you do when', 'what is your greatest', 'what was your greatest',
    'tell me about yourself', 'what makes you', 'how do you stay',
    'how do you manage', 'how do you approach', 'what would you do if',
    'why should we hire', 'what are your salary', 'why are you interested',
    'describe your ideal', 'what motivates you', 'do you prefer',
    'do you have any questions', 'why did you choose', 'what do you know about',
    'how do you balance', 'what is your management', 'what is your leadership',
    'what are your long', 'where do you see yourself', 'how do you handle stress',
    'how do you handle pressure', 'what would your', 'what legacy',
    'why are you leaving', 'what are your expectations',
];

// ── Technical question signals ────────────────────────────────────────────
// REMOVED: 'what is', 'what are the' — these are too generic and match behavioral questions.

const TECH_Q_WORDS = [
    'explain', 'define', 'how does', 'difference between',
    'describe the concept', 'how would you implement', 'write a', 'write code',
    'code a', 'design a', 'what is the purpose', 'what does', 'what are the types',
    'when would you use', 'compare', 'what is the difference',
    'can you explain what', 'how is', 'name the', 'list the',
];

// ── Behavioral ANSWER signals (narrative / personal-experience only) ───────
// PURGED: 'i think', 'i believe', 'i feel', 'i am', 'i have', 'i would',
//         'i always', 'i usually', 'i try to', 'i enjoy', 'i prefer', 'i value',
//         'i want to', 'i am passionate', 'i chose', 'i find', 'i consider',
//         'personally' — all far too generic; they matched ANY spoken sentence.

const BHV_A_SIGNALS = [
    // Past action / experience signals
    'i worked', 'i handled', 'i managed', 'i led', 'i collaborated',
    'i resolved', 'i noticed', 'i realized', 'i took', 'i spoke with',
    'i reached out', 'i decided', 'i learned', 'i felt proud',
    'we decided', 'we worked', 'my team', 'in my previous', 'at my last',
    'when i was', 'while working', 'during my', 'in that role',
    'the situation was', 'as a result', 'the outcome was', 'which led to',
    'i achieved', 'to resolve', 'my role was', 'the challenge was',
    'i built', 'i developed', 'i implemented', 'i created', 'my project',
    // STAR-adjacent narrative
    'there was a time', 'once i', 'i remember when', 'in a previous project',
    'at my last job', 'in that situation', 'i was tasked with',
    'my responsibility was', 'i was assigned', 'i had to',
    // Reflective / outcome phrases
    'the result was', 'the impact was', 'i learned that', 'this helped',
    'we managed to', 'what i took from', 'from that experience',
    // Self-description (kept selective)
    'my strength', 'my weakness', 'my experience', 'my goal',
    'my career', 'my background', 'my passion', 'my interest',
    'in my opinion', 'from my experience', 'based on my',
    'my approach', 'my approach was',
];

// ── Technical ANSWER signals ──────────────────────────────────────────────

const TECH_A_SIGNALS = [
    'algorithm', 'function', 'class', 'object', 'database', 'server',
    'api', 'http', 'request', 'response', 'stack', 'queue', 'array',
    'loop', 'variable', 'method', 'module', 'library', 'framework',
    'component', 'interface', 'inheritance', 'polymorphism',
    'encapsulation', 'abstraction', 'runtime', 'compile', 'syntax',
    'sql', 'nosql', 'git', 'html', 'css', 'javascript', 'python',
    'java', 'node', 'big o', 'complexity', 'recursion', 'schema',
    'query', 'index', 'cache', 'endpoint', 'rest', 'json', 'memory',
    'thread', 'asynchronous', 'promise', 'event', 'pointer',
];

// ── Off-topic cues ────────────────────────────────────────────────────────

const OFF_TOPIC_CUES = [
    'cricket', 'football', 'basketball', 'movie', 'film', 'food',
    'pizza', 'burger', 'game', 'playstation', 'vacation', 'holiday',
    'party', 'weather', 'rain', 'song', 'music', 'dance', 'shopping',
    'restaurant', 'meme', 'tiktok', 'instagram', 'my favourite food',
    'i like to eat', 'i like to watch', 'favourite movie',
];

// ── STAR signals — PHRASE-LEVEL only (single words removed to avoid false hits) ──
// BUG FIX: bare 'situation', 'task', 'action', 'result' matched in ANY sentence.

const STAR_SIGNALS = [
    // Situation
    'the situation was', 'in my previous', 'at my last', 'when i was',
    'while working', 'during my', 'in that role', 'there was a time',
    'once i', 'i was working',
    // Task
    'i was responsible', 'my task was', 'i had to', 'i was assigned',
    'my responsibility was', 'my role was',
    // Action
    'i decided to', 'i took', 'i worked', 'i implemented', 'i resolved',
    'i led', 'i collaborated', 'i reached out', 'i built', 'i developed',
    'i created', 'to resolve', 'in order to',
    // Result
    'the outcome', 'as a result', 'which led to', 'i achieved',
    'we managed to', 'the impact was', 'this helped', 'i learned that',
    'the result was', 'successfully',
];

// ── Professional words (depth indicator) ─────────────────────────────────

const PROFESSIONAL_WORDS = [
    'collaboration', 'initiative', 'stakeholder', 'deadline', 'deliverable',
    'prioritized', 'optimized', 'implemented', 'strategy', 'objective',
    'accountability', 'communication', 'leadership', 'mentored', 'resolved',
    'architected', 'refactored', 'scalable', 'performance', 'efficiency',
    'framework', 'methodology', 'structured', 'evaluated', 'achieved',
];

// ── Filler / vague words (communication quality) ─────────────────────────
// REMOVED: 'like' — too ambiguous ("technologies like React" is NOT a filler)

const FILLER_WORDS = [
    'um', 'uh', 'basically', 'honestly', 'literally',
    'you know', 'kind of', 'sort of', 'i mean', 'stuff', 'things',
];

// ── Helpers ───────────────────────────────────────────────────────────────

function countHits(text, signals) {
    const lower = text.toLowerCase();
    return signals.filter(s => lower.includes(s.toLowerCase())).length;
}

function wordCount(text) {
    return text.split(/\s+/).filter(Boolean).length;
}

function vocabDiversity(text) {
    const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 3);
    if (words.length === 0) return 100;
    return Math.round((new Set(words).size / words.length) * 100);
}

function avgSentenceLength(text) {
    const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
    const lengths = sentences.map(s => s.trim().split(/\s+/).filter(Boolean).length);
    return lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0;
}

function detectOffTopic(answer) {
    const lower = answer.toLowerCase();
    const cues = OFF_TOPIC_CUES.filter(c => lower.includes(c));
    return { isOffTopic: cues.length > 0, cues };
}

// ── STEP 1: Classify question ─────────────────────────────────────────────
export function classifyQuestion(question) {
    const lower = question.toLowerCase().trim();

    // Behavioral starters take highest priority
    const hasBhvStarter = BHV_STARTERS.some(s => lower.includes(s));
    if (hasBhvStarter) {
        return {
            category: 'Behavioral',
            confidence: 90,
            reason: 'Question begins with a behavioral starter phrase.',
        };
    }

    const bhvHits  = countHits(lower, BHV_Q_WORDS);
    const techHits = countHits(lower, TECH_Q_WORDS);

    if (bhvHits > techHits) {
        return {
            category: 'Behavioral',
            confidence: Math.min(88, 60 + bhvHits * 9),
            reason: `Asks about personal experience or past decisions (${bhvHits} behavioral signals).`,
        };
    }
    if (techHits > bhvHits) {
        return {
            category: 'Technical',
            confidence: Math.min(90, 60 + techHits * 9),
            reason: `Asks for factual or conceptual knowledge (${techHits} technical signals).`,
        };
    }

    // Tie-break: questions directed at "you/your" → behavioral
    if (/\byou(r|rself)?\b/.test(lower)) {
        return { category: 'Behavioral', confidence: 60, reason: 'Directed at personal experience.' };
    }

    return { category: 'Technical', confidence: 50, reason: 'No strong behavioral signals; defaulting to technical.' };
}

// ── STEP 2: Classify answer ───────────────────────────────────────────────

function classifyAnswer(answer) {
    const bhvHits  = countHits(answer, BHV_A_SIGNALS);
    const techHits = countHits(answer, TECH_A_SIGNALS);

    if (bhvHits >= 1 && techHits >= 1) return 'Mixed';
    if (bhvHits > 0  && techHits === 0) return 'Behavioral';
    if (techHits > 0 && bhvHits === 0)  return 'Technical';
    return 'General';
}

// ── STEP 3: Relevance check ───────────────────────────────────────────────
// BUG FIX: Technical Q + Behavioral A was incorrectly marked as Relevant.
// Correct logic per spec:
//   Behavioral Q  + (Behavioral | Mixed | General) → Relevant
//   Technical  Q  + (Technical  | Mixed)           → Relevant
//   Technical  Q  + Behavioral                     → NOT Relevant (personal opinion ≠ technical knowledge)
//   Any Q         + General                        → Neutral (give benefit of doubt)

function checkRelevance(qCategory, answerType) {
    if (answerType === 'General') return true;   // Can't penalise — not enough signal
    if (answerType === 'Mixed')   return true;   // Mixed covers both types
    if (qCategory === 'Behavioral') {
        return answerType === 'Behavioral';
    }
    if (qCategory === 'Technical') {
        // FIX: Behavioral answer to a Technical question is NOT relevant
        return answerType === 'Technical';
    }
    return true;
}

// ── STEP 4: Quality scoring ───────────────────────────────────────────────
// Spec weights: Relevance 40% | Depth 25% | Structure 20% | Communication 15%
// Clarity is computed internally for the 5-bar report display but NOT weighted separately.

function computeDimensions(qCategory, answerType, answer, offTopic) {
    const wc         = wordCount(answer);
    const diversity  = vocabDiversity(answer);
    const avgSentLen = avgSentenceLength(answer);
    const starHits   = countHits(answer, STAR_SIGNALS);
    const profHits   = countHits(answer, PROFESSIONAL_WORDS);
    const fillerHits = countHits(answer, FILLER_WORDS);
    const isRelevant = checkRelevance(qCategory, answerType);

    // ─── Dimension 1: Relevance (0-100) — 40% weight ─────────────────
    let relevanceDim = 0;
    if (isRelevant) {
        relevanceDim = 65; // base for being on-topic
        if (answerType === 'Mixed')    relevanceDim += 20;
        else if (answerType === 'General') relevanceDim += 10;
        else if (answerType === qCategory) relevanceDim += 25;
        if (offTopic.isOffTopic) relevanceDim -= 20;
    } else {
        relevanceDim = 15; // hard mismatch — spec says 0-19 for "wrong question type"
    }
    relevanceDim = Math.max(0, Math.min(100, relevanceDim));

    // ─── Dimension 2: Depth & Specificity (0-100) — 25% weight ───────
    let depthDim = 0;
    if (wc >= 80) depthDim = 95;
    else if (wc >= 50) depthDim = 78;
    else if (wc >= 30) depthDim = 58;
    else if (wc >= 15) depthDim = 38;
    else depthDim = 12;

    depthDim = Math.min(100, depthDim + profHits * 5);

    // ─── Dimension 3: Structure & Clarity (0-100) — 20% weight ───────
    let structureDim = 0;
    if (qCategory === 'Behavioral' || answerType === 'Behavioral' || answerType === 'Mixed') {
        // STAR narrative flow
        if (starHits >= 4) structureDim = 100;
        else if (starHits >= 3) structureDim = 80;
        else if (starHits >= 2) structureDim = 60;
        else if (starHits >= 1) structureDim = 40;
        else structureDim = 20;
    } else {
        // Technical: logical explanation connectors
        const logicHits = countHits(answer, [
            'because', 'therefore', 'which means', 'for example', 'such as',
            'this allows', 'this ensures', 'this prevents', 'the reason',
            'this is used', 'it works by', 'this helps', 'in contrast',
        ]);
        if (logicHits >= 3) structureDim = 100;
        else if (logicHits >= 2) structureDim = 75;
        else if (logicHits >= 1) structureDim = 50;
        else structureDim = 30;
    }

    // ─── Dimension 4: Communication Quality (0-100) — 15% weight ─────
    let commDim = 100;
    commDim -= fillerHits * 8;
    if (wc < 15) commDim -= 25;
    else if (wc >= 35) commDim += 5;
    commDim = Math.max(0, Math.min(100, commDim));

    // ─── Clarity (computed for report display only, not in formula) ───
    let clarityDim = 0;
    if (diversity >= 70) clarityDim = 90;
    else if (diversity >= 55) clarityDim = 70;
    else if (diversity >= 40) clarityDim = 50;
    else clarityDim = 25;
    if (avgSentLen >= 8 && avgSentLen <= 20) clarityDim = Math.min(100, clarityDim + 10);
    else if (avgSentLen < 4 && wc > 5) clarityDim = Math.max(0, clarityDim - 20);

    return {
        relevanceDim, depthDim, structureDim, commDim, clarityDim,
        starHits, wc, profHits, fillerHits, isRelevant,
    };
}

// Spec formula: Relevance(40%) + Depth(25%) + Structure(20%) + Communication(15%)
function computeScore(dims) {
    return Math.round(
        dims.relevanceDim * 0.40 +
        dims.depthDim     * 0.25 +
        dims.structureDim * 0.20 +
        dims.commDim      * 0.15
    );
}

// ── STEP 5: Structured feedback ───────────────────────────────────────────

function buildStructuredFeedback(qCategory, answerType, dims, score, offTopic) {
    const strengths    = [];
    const improvements = [];

    // ── Strengths ──────────────────────────────────────────────────────
    if (dims.isRelevant) {
        if (answerType === 'Mixed') {
            strengths.push('Balanced answer — combines real experience with technical or project context');
        } else if (answerType === qCategory) {
            strengths.push(`Correctly addressed the ${qCategory.toLowerCase()} nature of the question`);
        }
    }

    if (dims.starHits >= 3 && (qCategory === 'Behavioral' || answerType === 'Mixed')) {
        strengths.push('Good narrative structure — clear Situation, Action, and Result flow');
    } else if (dims.starHits >= 2 && qCategory === 'Behavioral') {
        strengths.push('Partial narrative structure — shows organised storytelling');
    }

    if (dims.clarityDim >= 70) strengths.push('Clear and varied vocabulary — easy to follow');
    if (dims.depthDim   >= 75) strengths.push('Detailed answer with substantive content');
    if (dims.profHits   >= 2)  strengths.push('Uses professional, interview-appropriate language');
    if (dims.commDim    >= 85) strengths.push('Confident delivery with minimal filler words');
    if (dims.structureDim >= 80 && qCategory === 'Technical') {
        strengths.push('Well-structured technical explanation with clear reasoning');
    }

    if (strengths.length === 0) {
        // Do NOT give false praise — spec Rule 2
        strengths.push('Attempted to address the question');
    }

    // ── Improvements ───────────────────────────────────────────────────

    if (offTopic.isOffTopic) {
        improvements.push(
            `Remove unrelated content (${offTopic.cues.slice(0, 2).join(', ')}) and stay focused on the question`
        );
    }

    if (!dims.isRelevant) {
        if (qCategory === 'Behavioral' && answerType === 'Technical') {
            improvements.push(
                'This is a behavioral question — describe a real past experience instead of explaining concepts. Use: Situation → Task → Action → Result'
            );
        } else if (qCategory === 'Technical' && answerType === 'Behavioral') {
            improvements.push(
                'This is a technical question — explain the concept, how it works, and give a concrete factual example. Personal opinion alone is not sufficient'
            );
        }
    }

    if (dims.isRelevant && qCategory === 'Behavioral' && dims.starHits < 3) {
        if (dims.starHits < 2) {
            improvements.push(
                'Structure your answer using STAR: describe the Situation, your Task, the Action you took, and the Result or outcome'
            );
        } else {
            improvements.push(
                'Add a clear Result — what happened because of your action? What changed or what did you learn?'
            );
        }
    }

    if (dims.isRelevant && qCategory === 'Technical' && dims.structureDim < 60) {
        improvements.push('Add a concrete real-world example or analogy to support your explanation');
    }

    if (dims.wc < 30) {
        improvements.push('Expand your answer — aim for at least 50–80 words to fully demonstrate your thinking');
    }

    if (dims.clarityDim < 55) {
        improvements.push('Vary your vocabulary — avoid repeating the same words; use more specific language');
    }

    if (dims.fillerHits >= 3) {
        improvements.push('Reduce filler words (um, uh, basically) — replace them with a confident 1-second pause');
    }

    if (improvements.length === 0) {
        improvements.push(
            score >= 80
                ? 'Consider adding specific metrics or numbers to make your answer even more memorable'
                : 'Continue practising — add more specific details and concrete outcomes to your answers'
        );
    }

    // ── Final Feedback ─────────────────────────────────────────────────
    let finalFeedback = '';
    if (!dims.isRelevant) {
        finalFeedback = qCategory === 'Behavioral'
            ? 'Your answer focused on concepts rather than personal experience. Interviewers want a real story — describe what you actually did, the challenge you faced, and the outcome. Use the STAR method to guide your response.'
            : 'Your answer shared personal experience, but this question asks for technical knowledge. Focus on explaining the concept clearly and supporting it with a factual example or definition.';
    } else if (score >= 80) {
        finalFeedback = qCategory === 'Behavioral'
            ? 'Excellent response! You told a clear, structured story with strong context and a meaningful outcome. To push even higher, add specific metrics or numbers to quantify your impact.'
            : 'Strong technical answer! You explained the concept clearly and with good depth. Adding a quick real-world example or edge-case mention would make it even more compelling.';
    } else if (score >= 60) {
        finalFeedback = qCategory === 'Behavioral'
            ? "Good start — you are on the right track with a relevant story. Strengthen it by making sure your Result is explicit: what changed, what was the impact, or what you learned."
            : 'Solid explanation that addresses the question. To improve, go deeper — explain the "why" behind the concept and give a concrete usage example to show real understanding.';
    } else {
        finalFeedback = qCategory === 'Behavioral'
            ? 'Your answer needs more focus on personal experience. Think of a specific time you faced this situation and walk through exactly what you did using the STAR structure.'
            : 'Try to be more direct and structured in your technical explanation. Start with a clear definition, follow with how it works, and close with a practical example.';
    }

    return { strengths: strengths.slice(0, 3), improvements: improvements.slice(0, 3), finalFeedback };
}

// ── MAIN: evaluateRelevance ───────────────────────────────────────────────
export function evaluateRelevance(question, answer) {
    if (!question || !answer || wordCount(answer) < 3) {
        return {
            question_type:       'Unknown',
            answer_type:         'None',
            relevance_score:     0.0,
            verdict:             'not relevant',
            relevance_label:     'Not Relevant',
            score:               0,
            strengths:           [],
            improvements:        ['No answer detected. Please speak your answer clearly.'],
            finalFeedback:       'No answer was detected. Please try again.',
            _score100:           0,
            _isRelevant:         false,
            _isStronglyRelevant: false,
            _source:             'keyword',
        };
    }

    const qClassification = classifyQuestion(question);
    const qCategory       = qClassification.category;       // 'Behavioral' | 'Technical'
    const answerType      = classifyAnswer(answer);          // 'Behavioral' | 'Technical' | 'Mixed' | 'General'
    const offTopic        = detectOffTopic(answer);

    const dims     = computeDimensions(qCategory, answerType, answer, offTopic);
    const score100 = computeScore(dims);
    const score    = parseFloat((score100 / 100).toFixed(2));

    const relevanceLabel = score100 >= 60 ? 'Relevant'
                         : score100 >= 30 ? 'Partially Relevant'
                         : 'Not Relevant';

    const verdict = score100 >= 65 ? 'relevant'
                  : score100 >= 35 ? 'partially relevant'
                  : 'not relevant';

    const { strengths, improvements, finalFeedback } = buildStructuredFeedback(
        qCategory, answerType, dims, score100, offTopic
    );

    const feedback = improvements[0] || finalFeedback;

    return {
        // ── Standard output ──
        question_type:   qCategory,
        answer_type:     answerType,
        relevance_score: score,
        verdict,
        relevance_label: relevanceLabel,
        score:           score100,
        strengths,
        improvements,
        finalFeedback,

        // ── Legacy fields ──
        feedback,
        classifier: qClassification,

        // ── Score dimensions (5-bar report display) ──
        dimensions: {
            relevance:     dims.relevanceDim,
            clarity:       dims.clarityDim,
            structure:     dims.structureDim,
            depth:         dims.depthDim,
            communication: dims.commDim,
        },

        // ── Internal helpers ──
        _score100:           score100,
        _isRelevant:         score100 >= 20,
        _isStronglyRelevant: score100 >= 55,
        _starHits:           dims.starHits,
        _wordCount:          dims.wc,
        _source:             'keyword',
    };
}

export function getRelevanceScore100(question, answer) {
    return evaluateRelevance(question, answer)._score100;
}
