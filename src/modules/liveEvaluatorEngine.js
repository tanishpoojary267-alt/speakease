// ========================================
// Speakease — Live Evaluator Engine v3
// ========================================
// Changes vs v2:
//  - Word threshold raised 5 → 20 (avoids false scores on short partial speech)
//  - Behavioral lock now requires ≥2 genuine STAR-level signals (not just any BHV hit)
//  - _reason reflects 20-word gate
import { detectProfanity, detectSlang } from './datasets.js';

// ── Nonsense / gibberish patterns ────────────────────────────────────
const NONSENSE_PATTERNS = [
    /\b(meow|woof|moo|oink|baa|quack)\b/gi,
    /\b(\w)\1{4,}\b/gi,                    // "aaaaaaa"
    /\b(ha|he|ho){4,}\b/gi,               // "hahahahaha"
    /\b(blah|bla|bah|meh|duh){2,}\b/gi,
];

// ── STAR method signals ──────────────────────────────────────────────
const STAR_SITUATION = ['situation', 'when i', 'in my previous', 'at my last', 'during my', 'while working', 'in that role', 'there was a time', 'once i'];
const STAR_TASK      = ['my task', 'my responsibility', 'i was responsible', 'i was assigned', 'my role was', 'i had to'];
const STAR_ACTION    = ['i decided', 'i took', 'i worked', 'i implemented', 'i resolved', 'i led', 'i collaborated', 'i reached out', 'i built', 'i developed', 'i created', 'i managed', 'to resolve', 'in order to'];
const STAR_RESULT    = ['as a result', 'the outcome was', 'which led to', 'i achieved', 'we managed to', 'the impact was', 'this helped', 'i learned that', 'the result was', 'successfully'];

function countHits(lower, signals) {
    return signals.filter(s => lower.includes(s)).length;
}

export class LiveEvaluatorEngine {
    constructor() {
        this._reset();
    }

    reset() { this._reset(); }

    _reset() {
        // Core state
        this._status           = 'Evaluating...';
        this._relevanceLabel   = 'Evaluating...';  // Relevant | Partially Relevant | Not Relevant | Evaluating...
        this._answerType       = 'Unknown';
        this._confidence       = 0;
        this._reason           = '';
        this._behavioralLocked = false;
        this._lastEvalResult   = null;

        // Profanity / professionalism
        this._profanityDetected   = false;
        this._profanityWords      = [];
        this._slangDetected       = false;
        this._slangWords          = [];
        this._profanityLastAlerted = 0;

        // Grammar state (fed from grammarChecker results)
        this._grammarLabel     = 'Evaluating...';  // Good | Needs Improvement | Poor
        this._grammarScore     = 100;
        this._grammarIssues    = [];

        // Completeness
        this._completeness     = 'Evaluating...';  // Complete | Incomplete | Too Short
        this._starHits         = { S: 0, T: 0, A: 0, R: 0 };

        // Nonsense detection
        this._nonsenseDetected = false;
        this._nonsenseRatio    = 0;

        // Issues list (for LIVE EVALUATION panel)
        this._issues           = [];
        this._suggestion       = '';

        // Face / speaking
        this._faceData         = null;
        this._speakingState    = 'paused';
        this._pauseStartTime   = 0;

        // UX signals
        this._lastPulseTime    = 0;
        this._lastHintTime     = 0;
        this._lastBeepTime     = 0;
        this._UX_COOLDOWN_MS   = 2500;
        this._lowEyeFrames     = 0;
        this._LOW_EYE_BEEP_FRAMES = 6;

        // Behavioral/Technical balance
        this._techRatioWarning = false;
    }

    // ── Inject face data ────────────────────────────────────────────
    setFaceData(faceData) {
        this._faceData = faceData;
        if (faceData && faceData.faceDetected) {
            const eyeWarn = faceData.eyeContactWarningLevel || 'good';
            if (eyeWarn === 'critical') {
                this._lowEyeFrames = Math.min(20, this._lowEyeFrames + 1);
            } else {
                this._lowEyeFrames = Math.max(0, this._lowEyeFrames - 1);
            }
        }
    }

    setSpeakingState(state) {
        if (state !== this._speakingState) {
            this._speakingState = state;
            if (state === 'paused') this._pauseStartTime = Date.now();
        }
    }

    // ── Inject grammar checker result ───────────────────────────────
    // Call this whenever grammarChecker.analyze() runs in SessionPage
    setGrammarResult(grammarResult, transcript) {
        if (!grammarResult) return;

        const score       = grammarResult.qualityMetrics?.qualityScore ?? 100;
        const errorCount  = grammarResult.errorCount || 0;
        const combined    = Math.round(score * 0.6 - errorCount * 4);
        this._grammarScore = Math.max(0, Math.min(100, combined));

        // Grammar label per spec: Good / Needs Improvement / Poor
        if (this._grammarScore >= 70) this._grammarLabel = 'Good';
        else if (this._grammarScore >= 40) this._grammarLabel = 'Needs Improvement';
        else this._grammarLabel = 'Poor';

        // Collect top grammar issues for the panel
        this._grammarIssues = (grammarResult.errors || [])
            .slice(0, 4)
            .map(e => e.hint || e.original);

        // Run profanity / slang check on full transcript
        if (transcript) this._checkProfanity(transcript);
    }

    // ── Core update — called on every eval result ───────────────────
    update(evalResult, wordCount, transcript) {
        if (!evalResult) return;

        this._lastEvalResult = evalResult;
        this._answerType     = evalResult.answer_type || 'Unknown';
        this._confidence     = evalResult.score || 0;

        const wc     = wordCount || 0;
        const lower  = (transcript || '').toLowerCase();

        // ── Rule 4: Profanity check ──────────────────────────────────
        this._checkProfanity(lower);

        // ── Nonsense detection ───────────────────────────────────────
        this._detectNonsense(lower, wc);

        // ── STAR hits for behavioral completeness ────────────────────
        this._starHits = {
            S: countHits(lower, STAR_SITUATION) > 0 ? 1 : 0,
            T: countHits(lower, STAR_TASK)      > 0 ? 1 : 0,
            A: countHits(lower, STAR_ACTION)    > 0 ? 1 : 0,
            R: countHits(lower, STAR_RESULT)    > 0 ? 1 : 0,
        };
        const starScore = Object.values(this._starHits).reduce((a, b) => a + b, 0);

        // ── Rule 6: Completeness ─────────────────────────────────────
        if (wc < 8) {
            this._completeness = 'Too Short';
        } else if (wc < 25 || (evalResult.question_type === 'Behavioral' && starScore < 2)) {
            this._completeness = 'Incomplete';
        } else {
            this._completeness = 'Complete';
        }

        // ── Rule 3: Behavioral/Technical balance ─────────────────────
        this._techRatioWarning = false;
        if (evalResult.question_type === 'Behavioral' && wc >= 30) {
            const bhvHits  = evalResult._starHits || starScore;
            const techHits = this._countTechSignals(lower);
            const total    = bhvHits + techHits;
            if (total > 0) {
                const techRatio = techHits / total;
                if (techRatio > 0.35) this._techRatioWarning = true;
            }
        }

        // ── Rule 1: Start evaluating from 20 words ──────────────────
        // Below 20 words gives too many false negatives on partial speech.
        if (wc < 20) {
            this._status         = 'Evaluating...';
            this._relevanceLabel = 'Evaluating...';
            this._buildIssues(evalResult, wc, starScore);
            this._reason = wc < 5
                ? 'Keep speaking — listening...'
                : `${wc} words so far — continue speaking for a full evaluation...`;
            return;
        }

        // ── Lock-In: behavioral detected — require ≥2 STAR signals ───
        // FIX: old code locked on ANY behavioral hit (even generic speech).
        // Now we require at least 2 phrase-level STAR signals to confirm.
        const isNowBehavioral =
            evalResult.answer_type === 'Behavioral' ||
            evalResult.answer_type === 'Mixed';

        const starConfirmed = starScore >= 2;  // ≥2 STAR phrase hits = genuine story
        if (evalResult.question_type === 'Behavioral' && isNowBehavioral && starConfirmed) {
            this._behavioralLocked = true;
        }

        // ── Rule 2: Determine relevance status ───────────────────────
        if (this._behavioralLocked) {
            this._relevanceLabel = 'Relevant';
            this._status         = 'Relevant';
        } else if (evalResult._isStronglyRelevant && !this._nonsenseDetected) {
            this._relevanceLabel = 'Relevant';
            this._status         = 'Relevant';
        } else if (evalResult._isRelevant && !this._nonsenseDetected) {
            this._relevanceLabel = 'Partially Relevant';
            this._status         = 'Partially Relevant';
        } else {
            this._relevanceLabel = 'Not Relevant';
            this._status         = 'Not Relevant';
        }

        // ── Build issues + suggestion ────────────────────────────────
        this._buildIssues(evalResult, wc, starScore);
        this._reason = this._buildReason(evalResult, wc, starScore);
    }

    // ── RULE 4: Profanity + Slang detection (word-boundary regex) ────────
    // Profanity  → WARNING — Unprofessional Language
    // Slang      → Caution — Informal Language
    _checkProfanity(lower) {
        const foundProfanity = detectProfanity(lower);
        if (foundProfanity.length > 0) {
            this._profanityDetected = true;
            this._profanityWords    = foundProfanity;
        }
        const foundSlang = detectSlang(lower);
        if (foundSlang.length > 0) {
            this._slangDetected = true;
            this._slangWords    = foundSlang;
        }
    }

    // ── Nonsense detection ───────────────────────────────────────────
    _detectNonsense(lower, wc) {
        if (wc < 5) return;
        let nonsenseHits = 0;
        NONSENSE_PATTERNS.forEach(p => {
            const m = lower.match(p);
            if (m) nonsenseHits += m.length;
        });
        this._nonsenseRatio    = wc > 0 ? nonsenseHits / wc : 0;
        this._nonsenseDetected = this._nonsenseRatio > 0.15 || nonsenseHits >= 5;
    }

    // ── Count technical signals in text ─────────────────────────────
    _countTechSignals(lower) {
        const techWords = ['algorithm', 'function', 'class', 'database', 'api', 'framework', 'server', 'code', 'system', 'architecture', 'protocol', 'module'];
        return techWords.filter(w => lower.includes(w)).length;
    }

    // ── Build issues list for LIVE EVALUATION panel ──────────────────
    _buildIssues(evalResult, wc, starScore) {
        const issues = [];

        // Profanity — highest priority
        if (this._profanityDetected) {
            issues.push('Unprofessional language detected — use formal vocabulary');
        }
        if (this._slangDetected && this._slangWords.length >= 2) {
            issues.push('Slang detected — avoid casual/informal speech in interviews');
        }

        // Nonsense
        if (this._nonsenseDetected) {
            issues.push('Nonsense or off-topic content detected — answer the question directly');
        }

        // Behavioral balance
        if (this._techRatioWarning) {
            issues.push('Too technical for a behavioural answer — focus on personal experience');
        }

        // STAR check
        if (wc >= 30 && evalResult.question_type === 'Behavioral' && starScore < 2) {
            issues.push('Answer lacks structure — use the STAR method (Situation, Task, Action, Result)');
        }

        // Completeness
        if (this._completeness === 'Too Short') {
            issues.push('Answer too short — expand with example or explanation');
        } else if (this._completeness === 'Incomplete') {
            issues.push('Answer seems incomplete — add more detail or a clear outcome');
        }

        // Grammar issues (top 2 only)
        this._grammarIssues.slice(0, 2).forEach(g => {
            if (g) issues.push(g);
        });

        // Filler words
        const fillers = evalResult._wordCount > 10 && (evalResult.dimensions?.communication < 50);
        if (fillers) issues.push('High filler word usage (um, uh, like) — replace with a confident pause');

        // Eye contact
        if (this._faceData?.faceDetected === false || !this._faceData) {
            issues.push('No face detected — look at the camera for better engagement');
        } else if ((this._faceData?.eyeContact || 0) < 35) {
            issues.push('Low eye contact — maintain camera focus');
        }

        this._issues = issues.slice(0, 5);  // max 5 issues displayed

        // ── Build improvement suggestion ─────────────────────────────
        if (this._profanityDetected) {
            this._suggestion = 'Replace all unprofessional language with formal alternatives immediately.';
        } else if (this._nonsenseDetected) {
            this._suggestion = 'Stop and refocus — your answer must directly address the question asked.';
        } else if (this._status === 'Not Relevant') {
            this._suggestion = evalResult.improvements?.[0] || 'Refocus: answer exactly what was asked, not a general topic.';
        } else if (this._completeness !== 'Complete' && wc >= 20) {
            this._suggestion = evalResult.improvements?.[0] || 'Expand your answer with a specific example and a clear result.';
        } else if (evalResult.question_type === 'Behavioral' && starScore < 3) {
            this._suggestion = 'Add a clear Result or outcome — what happened because of your action?';
        } else {
            this._suggestion = evalResult.improvements?.[0] || 'Continue building on your answer with more specific details.';
        }
    }

    // ── UX Pulse Signals ────────────────────────────────────────────
    getUxSignals() {
        const now     = Date.now();
        const face    = this._faceData;
        let colorSignal    = 'NONE';
        let eyeContactAlert = 'NONE';
        let ui_signal      = null;

        if (this._lowEyeFrames >= this._LOW_EYE_BEEP_FRAMES && now - this._lastBeepTime > this._UX_COOLDOWN_MS) {
            eyeContactAlert    = 'BEEP';
            ui_signal          = 'eye_contact_warning';
            this._lastBeepTime = now;
        }

        const confidence  = face?.confidence  || 0;
        const nervousness = face?.nervousness || 0;

        if (now - this._lastPulseTime > this._UX_COOLDOWN_MS) {
            if (this._profanityDetected) {
                colorSignal = 'RED_PULSE';
                this._lastPulseTime = now;
            } else if (confidence >= 70 && nervousness < 40) {
                colorSignal = 'GREEN_PULSE';
                this._lastPulseTime = now;
            } else if (nervousness >= 60 || confidence < 35) {
                colorSignal = 'RED_PULSE';
                this._lastPulseTime = now;
            }
        }

        if (colorSignal === 'NONE' && this._speakingState === 'paused' && this._pauseStartTime > 0 && now - this._pauseStartTime > 2000 && now - this._lastHintTime > this._UX_COOLDOWN_MS) {
            colorSignal = 'YELLOW_HINT';
            this._lastHintTime = now;
        }

        return { colorSignal, eyeContactAlert, ui_signal };
    }

    // ── Emotion Validation ──────────────────────────────────────────
    getEmotionStatus() {
        const face = this._faceData;
        if (!face || !face.faceDetected || face.confidence === undefined) {
            return { emotion_status: 'Not Detected', fallback: 'No face visible — look at the camera' };
        }
        return { emotion_status: 'Active', fallback: null };
    }

    // ── STEP 9: Full LIVE EVALUATION output ─────────────────────────
    getOutput() {
        const emotionInfo = this.getEmotionStatus();
        const uxSignals   = this.getUxSignals();
        const face        = this._faceData;

        // Confidence & delivery
        const faceConf    = face?.confidence  || 0;
        const nervousness = face?.nervousness || 0;
        let deliveryLabel = 'Evaluating...';
        if (face?.faceDetected) {
            if (faceConf >= 70 && nervousness < 40) deliveryLabel = 'Confident';
            else if (nervousness >= 60) deliveryLabel = 'Nervous';
            else if (faceConf >= 50) deliveryLabel = 'Moderate';
            else deliveryLabel = 'Low Confidence';
        }

        return {
            // Core status (Rule 2)
            Status:       this._status,

            // Relevance detail
            Relevance:    this._relevanceLabel,
            Reason:       this._reason,

            // Professionalism (Rule 4)
            Professionalism: this._profanityDetected
                ? 'WARNING — Unprofessional Language Detected'
                : (this._slangDetected ? 'Caution — Informal Language' : 'Professional'),
            Profanity_Detected: this._profanityDetected,
            Profanity_Words:    this._profanityWords,

            // Grammar (Rule 5)
            Grammar:      this._grammarLabel,
            Grammar_Score: this._grammarScore,

            // Completeness (Rule 6)
            Completeness: this._completeness,

            // STAR breakdown (Rule 10 / Behavioral)
            STAR: this._starHits,

            // Delivery (Rule 8)
            Answer_Type:   this._answerType,
            Confidence:    this._confidence,
            Delivery:      deliveryLabel,
            Delivery_Pct:  faceConf,

            // Eye contact (Rule 7)
            Eye_Contact:   face?.eyeContact || 0,

            // Emotion (Rule 6)
            Emotion_Status: emotionInfo.emotion_status,
            emotion_fallback: emotionInfo.fallback,

            // Issues list (Rule 9)
            Issues:       this._issues,
            Suggestion:   this._suggestion,

            // UX Signals
            UI_Feedback: {
                Color_Signal:      uxSignals.colorSignal,
                Eye_Contact_Alert: uxSignals.eyeContactAlert,
                ui_signal:         uxSignals.ui_signal,
            },

            // Misc flags
            Nonsense_Detected:  this._nonsenseDetected,
            Tech_Ratio_Warning: this._techRatioWarning,
            Behavioral_Locked:  this._behavioralLocked,
            _lastEvalResult:    this._lastEvalResult,
        };
    }

    // ── Helpers ─────────────────────────────────────────────────────
    _buildReason(evalResult, wc, starScore) {
        if (this._profanityDetected) {
            return 'Unprofessional language used. This will significantly impact interview performance.';
        }
        if (this._nonsenseDetected) {
            return 'Answer contains off-topic or nonsense content — does not address the question.';
        }
        if (this._behavioralLocked) {
            return `Personal experience confirmed (${starScore} STAR signals) — answer is on-track for this behavioural question.`;
        }
        if (this._relevanceLabel === 'Relevant') {
            return `${evalResult.question_type} question matched with a ${this._answerType} answer (score: ${this._confidence}/100).`;
        }
        if (this._relevanceLabel === 'Partially Relevant') {
            return `Some relevance detected but the answer does not fully address the ${evalResult.question_type} question.`;
        }
        if (this._relevanceLabel === 'Not Relevant') {
            return `This is a ${evalResult.question_type} question — your response appears ${this._answerType}. Refocus on what was asked.`;
        }
        return 'Continue speaking to receive a full evaluation.';
    }
}

export const liveEvaluatorEngine = new LiveEvaluatorEngine();
