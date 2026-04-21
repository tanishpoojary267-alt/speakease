// ========================================
// Speakease — Face Analyzer v3 (Dataset-Driven + Landmark Eye Contact)
// ========================================
//
// v3 changes:
// Emotion states are now sourced from datasets.js (interview-relevant mapping).
// Eye contact detection uses face landmark geometry (nose-to-eye ratio) for
// head orientation in addition to bounding-box centering.
// Adds `eyeContactWarningLevel` output: 'good' | 'low' | 'critical'

import * as faceapi from 'face-api.js';
import { EMOTION_STATE_MAP } from './datasets.js';

// ── Thresholds for interview-state classification ────────
// These come from research on typical face-api expression values
// during interview scenarios.
const THRESHOLDS = {
    smileStrong: 0.25,       // happy > this → "a lot of smiling"
    smileMild: 0.08,         // happy > this → "mild smile"
    fearHigh: 0.15,          // fearful > this → clearly fearful
    fearMild: 0.06,          // fearful > this → slightly fearful
    sadHigh: 0.12,
    angryHigh: 0.10,
    surprisedHigh: 0.12,
    neutralGood: 0.50,       // neutral > this → calm baseline
    eyeContactGood: 65,      // eye-contact score > this → good
    eyeContactPoor: 35,      // eye-contact score < this → poor
    headMovHigh: 40,         // headStability < this → high movement
    fastWpm: 180,            // words per minute > this = speaking too fast
    veryFastWpm: 220,        // very fast = high nervousness signal
    slowWpm: 60,             // very slow = hesitating
};

export class FaceAnalyzer {
    constructor() {
        this.isLoaded = false;
        this.isRunning = false;
        this.video = null;
        this.canvas = null;
        this.interval = null;
        this.onUpdate = null;

        // External WPM injected from SessionPage after each speech update
        this.currentWpm = 0;

        this.metrics = this._freshMetrics();
        this.eyeOpenHistory = [];
        this.lastBlinkState = false;

        // Eye contact: 5-frame rolling average to reduce landmark jitter
        this._recentEyeScores = [];
        // Blink: require 2 consecutive closed frames to avoid false detections
        this._blinkConsecutiveFrames = 0;
    }

    _freshMetrics() {
        return {
            confidenceHistory: [],
            nervousnessHistory: [],
            eyeContactHistory: [],
            smileHistory: [],
            headStabilityHistory: [],
            blinkCount: 0,
            expressionCounts: {
                neutral: 0, happy: 0, sad: 0,
                angry: 0, fearful: 0, disgusted: 0, surprised: 0
            },
            lastLandmarks: null,
            frameCount: 0,
            stateHistory: [],
            emotionHistory: [],   // ← 10-frame rolling buffer for smoothing
        };
    }

    async loadModels() {
        if (this.isLoaded) return;
        // Try /models first (production), fall back to ./models (dev)
        const paths = ['/models', './models'];
        let lastErr;
        for (const modelPath of paths) {
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
                    faceapi.nets.faceExpressionNet.loadFromUri(modelPath),
                    faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
                ]);
                this.isLoaded = true;
                console.log('[FaceAnalyzer] Models loaded from:', modelPath);
                return;
            } catch (err) {
                console.warn('[FaceAnalyzer] Could not load from', modelPath, err.message);
                lastErr = err;
            }
        }
        console.error('[FaceAnalyzer] All model paths failed:', lastErr);
        throw lastErr;
    }

    setVideo(videoElement, canvasElement) {
        this.video = videoElement;
        this.canvas = canvasElement;
    }

    start(onUpdate, fps = 3) {
        if (!this.isLoaded || !this.video) return;
        this.isRunning = true;
        this.onUpdate = onUpdate;
        this.interval = setInterval(() => this._analyze(), Math.round(1000 / fps));
    }

    stop() {
        this.isRunning = false;
        if (this.interval) { clearInterval(this.interval); this.interval = null; }
    }

    // Called by SessionPage on every speech metrics update
    setWpm(wpm) {
        this.currentWpm = wpm || 0;
    }

    // ── Main analysis frame ──────────────────────────────
    async _analyze() {
        if (!this.isRunning || !this.video || this.video.readyState < 2) return;

        try {
            const detection = await faceapi
                .detectSingleFace(this.video, new faceapi.TinyFaceDetectorOptions({
                    inputSize: 320, scoreThreshold: 0.20
                }))
                .withFaceLandmarks()
                .withFaceExpressions();

            if (!detection) {
                if (this.onUpdate) {
                    this.onUpdate({
                        faceDetected:           false,
                        confidence:             0,
                        nervousness:            0,
                        eyeContact:             0,
                        eyeContactWarningLevel: 'critical',  // no face = can't maintain eye contact
                        smile:                  0,
                        headStability:          0,
                        dominantExpression:     'none',
                        interviewState:         this._noFaceState(),
                    });
                }
                return;
            }

            this.metrics.frameCount++;
            this._drawOverlay(detection);

            const ex = detection.expressions;
            const dom = this._dominant(ex);
            if (this.metrics.expressionCounts[dom] !== undefined) {
                this.metrics.expressionCounts[dom]++;
            }

            // ── Compute sub-scores ───────────────────────
            const confidence = this._computeConfidence(ex);
            const nervousness = this._computeNervousness(ex);
            const eyeContact = this._calcEyeContact(detection.detection.box, detection.landmarks);
            const smile = Math.min(100, Math.round((ex.happy || 0) * 250));
            const headStability = this._calcHeadStability(detection.landmarks);

            this._detectBlink(detection.landmarks);

            // ── Eye contact warning level (for beep / coach alerts) ───
            let eyeContactWarningLevel = 'good';
            if (eyeContact < THRESHOLDS.eyeContactPoor) {
                this._lowEyeFrames = (this._lowEyeFrames || 0) + 1;
                eyeContactWarningLevel = this._lowEyeFrames >= 6 ? 'critical' : 'low';
            } else {
                this._lowEyeFrames = Math.max(0, (this._lowEyeFrames || 0) - 1);
            }

            // ── Store history ────────────────────────────
            this.metrics.confidenceHistory.push(confidence);
            this.metrics.nervousnessHistory.push(nervousness);
            this.metrics.eyeContactHistory.push(eyeContact);
            this.metrics.smileHistory.push(smile);
            this.metrics.headStabilityHistory.push(headStability);

            const MAX = 300;
            ['confidenceHistory', 'nervousnessHistory', 'eyeContactHistory', 'smileHistory', 'headStabilityHistory']
                .forEach(k => { if (this.metrics[k].length > MAX) this.metrics[k] = this.metrics[k].slice(-MAX); });

            // ── Classify interview state ─────────────────
            const interviewState = this._classifyInterviewState(
                ex, eyeContact, headStability, confidence, nervousness
            );
            this.metrics.stateHistory.push(interviewState.state);
            if (this.metrics.stateHistory.length > MAX) {
                this.metrics.stateHistory = this.metrics.stateHistory.slice(-MAX);
            }

            if (this.onUpdate) {
                // ── Smooth dominant emotion over last 10 frames ─────────────────
                // face-api fluctuates heavily frame-to-frame; majority vote
                // over a rolling window prevents jittery emotion display.
                this.metrics.emotionHistory.push(dom);
                // FIX: 15-frame window (5s at 3fps) for stable emotion classification
                if (this.metrics.emotionHistory.length > 15)
                    this.metrics.emotionHistory.shift();
                const smoothedDom = this._smoothedDominant();

                const rawEmotionEntry = EMOTION_STATE_MAP[smoothedDom] || EMOTION_STATE_MAP.neutral;

                // Normalize: JSON dataset uses 'interviewState'/'interviewLabel'/'feedback'.
                // MetricsPanel reads .tip — map 'feedback' → 'tip' so the coaching tip shows up.
                // Also support legacy 'state'/'label' keys so LiveCoach and MetricsPanel work.
                const emotionState = {
                    ...rawEmotionEntry,
                    state: rawEmotionEntry.interviewState || rawEmotionEntry.state || 'stable',
                    label: rawEmotionEntry.interviewLabel || rawEmotionEntry.label || 'Stable',
                    // BUG FIX: emotions.json stores coaching text in 'feedback', not 'tip'
                    tip: rawEmotionEntry.tip || rawEmotionEntry.feedback || '',
                };

                this.onUpdate({
                    faceDetected: true,
                    confidence,
                    nervousness,
                    eyeContact,
                    smile,
                    headStability,
                    dominantExpression: dom,
                    blinkCount: this.metrics.blinkCount,
                    interviewState,
                    eyeContactWarningLevel,
                    emotionState,
                });
            }
        } catch (err) {
            // Log frame-level errors so they are visible in DevTools
            console.warn('[FaceAnalyzer] Frame analysis error:', err?.message || err);
        }
    }

    // ── Confidence score (0-100) ─────────────────────────
    // Baseline: calm neutral person → 65. Smiling adds bonus.
    // Fear / sadness / anger subtract. Scaled to a natural 15-100 range.
    _computeConfidence(ex) {
        const neutral = ex.neutral || 0;
        const happy = ex.happy || 0;
        const fear = ex.fearful || 0;
        const sad = ex.sad || 0;
        const angry = ex.angry || 0;

        // Positive signals boost confidence toward 100
        const positiveBoost = neutral * 55 + happy * 60;
        // Negative signals drag it down toward 0
        const negativeDrag = fear * 80 + sad * 45 + angry * 50;

        const raw = 30 + positiveBoost - negativeDrag;
        // FIX: floor raised from 10 to 45 — a detected face with neutral expression
        // should never score below 45; old minimum created phantom "low confidence" readings.
        return Math.round(Math.min(100, Math.max(45, raw)));
    }

    // ── Nervousness score (0-100) ────────────────────────
    // Combines face fear + speech pace (fast WPM = nervousness signal)
    // Fixed: old multiplier of 300 was far too strong (values always near 100).
    // New: each emotion contributes 0-100 directly via its own weight.
    _computeNervousness(ex) {
        const fear = ex.fearful || 0;
        const sad = ex.sad || 0;
        const angry = ex.angry || 0;
        const surprised = ex.surprised || 0;

        // FIX: fear * 90 saturated too fast (almost any fear → ~100 nervousness).
        // Remapped to give a more natural 0-70 range before WPM fusion.
        let faceNerv = fear * 70 + sad * 25 + angry * 15 + surprised * 10;
        faceNerv = Math.min(100, Math.max(0, faceNerv));

        // Fuse with WPM: speaking very fast increases nervousness reading
        let wpmNerv = 0;
        if (this.currentWpm > THRESHOLDS.veryFastWpm) {
            wpmNerv = 45;
        } else if (this.currentWpm > THRESHOLDS.fastWpm) {
            wpmNerv = 22;
        }

        return Math.round(Math.min(100, faceNerv * 0.75 + wpmNerv * 0.25));
    }

    // ── Interview State Classification ───────────────────
    // Returns { state, label, emoji, color, description, tip }
    _classifyInterviewState(ex, eyeContact, headStability, confidence, nervousness) {
        const fear = ex.fearful || 0;
        const sad = ex.sad || 0;
        const happy = ex.happy || 0;
        const neutral = ex.neutral || 0;
        const angry = ex.angry || 0;
        const wpm = this.currentWpm;
        const poorEye = eyeContact < THRESHOLDS.eyeContactPoor;
        const goodEye = eyeContact > THRESHOLDS.eyeContactGood;
        const highMovement = headStability < THRESHOLDS.headMovHigh;

        // ── Very Nervous ──
        if (
            (fear > THRESHOLDS.fearHigh || nervousness > 65) &&
            (poorEye || highMovement || wpm > THRESHOLDS.fastWpm)
        ) {
            return {
                state: 'very_nervous',
                label: 'Very Nervous',
                emoji: '😰',
                color: '#ef4444',
                description: wpm > THRESHOLDS.fastWpm
                    ? 'Speaking too fast — slow down and breathe'
                    : 'High anxiety detected — take a deep breath',
                tip: 'Pause, breathe, and speak more slowly.',
            };
        }

        // ── Nervous ──
        if (
            fear > THRESHOLDS.fearMild ||
            (nervousness > 40 && !goodEye) ||
            (wpm > THRESHOLDS.fastWpm && !goodEye)
        ) {
            return {
                state: 'nervous',
                label: 'Nervous',
                emoji: '😟',
                color: '#f97316',
                description: wpm > THRESHOLDS.fastWpm
                    ? 'Speaking pace is fast — nerves showing'
                    : 'Some nervousness detected',
                tip: 'Maintain eye contact and moderate your pace.',
            };
        }

        // ── Tense/Stressed ──
        if (angry > THRESHOLDS.angryHigh || (angry > 0.05 && fear > THRESHOLDS.fearMild)) {
            return {
                state: 'tense',
                label: 'Tense',
                emoji: '😤',
                color: '#dc2626',
                description: 'Facial tension detected — you look stressed',
                tip: 'Relax your jaw and shoulders. Soften your expression.',
            };
        }

        // ── Overconfident ──
        if (
            happy > THRESHOLDS.smileStrong &&
            neutral < 0.3 &&
            wpm > THRESHOLDS.fastWpm
        ) {
            return {
                state: 'overconfident',
                label: 'Overconfident',
                emoji: '😏',
                color: '#a855f7',
                description: 'Expression may seem overconfident to interviewer',
                tip: 'Balance enthusiasm with composure. Listen carefully.',
            };
        }

        // ── Distracted ──
        if (highMovement && !goodEye) {
            return {
                state: 'distracted',
                label: 'Distracted',
                emoji: '👀',
                color: '#eab308',
                description: 'Frequent head movement — stay focused',
                tip: 'Keep your gaze steady and face the camera.',
            };
        }

        // ── Slightly Nervous ──
        if (
            (fear > 0.03 && fear <= THRESHOLDS.fearMild) ||
            (sad > 0.08) ||
            (wpm > 150 && wpm <= THRESHOLDS.fastWpm)
        ) {
            return {
                state: 'slightly_nervous',
                label: 'Slightly Nervous',
                emoji: '😬',
                color: '#facc15',
                description: wpm > 150
                    ? 'Speaking a bit fast — slow down slightly'
                    : 'Mild nervousness — you\'re doing well',
                tip: 'Take your time. Brief pauses show thoughtfulness.',
            };
        }

        // ── Focused ──
        if (neutral > THRESHOLDS.neutralGood && goodEye && happy < THRESHOLDS.smileMild) {
            return {
                state: 'focused',
                label: 'Focused',
                emoji: '🎯',
                color: '#38bdf8',
                description: 'Calm and attentive — good interview posture',
                tip: 'Add a natural smile occasionally to appear warmer.',
            };
        }

        // ── Speaking Too Slow ──
        if (wpm > 0 && wpm < THRESHOLDS.slowWpm) {
            return {
                state: 'hesitating',
                label: 'Hesitating',
                emoji: '🤔',
                color: '#fb923c',
                description: 'Speaking pace is very slow — may seem unsure',
                tip: 'Maintain a steady, confident rhythm when speaking.',
            };
        }

        // ── Default: Confident ──
        return {
            state: 'confident',
            label: 'Confident',
            emoji: '✅',
            color: '#22c55e',
            description: 'Good composure — you appear confident',
            tip: 'Keep it up! Maintain this tone throughout.',
        };
    }

    _noFaceState() {
        return {
            state: 'no_face',
            label: 'No Face Detected',
            emoji: '📷',
            color: '#64748b',
            description: 'Face not visible — check your camera position',
            tip: 'Move closer to the camera and ensure good lighting.',
        };
    }

    // ── Temporal smoothing: majority vote across last 10 frames ──────
    // Prevents rapid emotion flicker caused by face-api frame noise.
    // Needs at least 3 votes to report non-neutral; otherwise neutral.
    _smoothedDominant() {
        const hist = this.metrics.emotionHistory;
        if (!hist || hist.length === 0) return 'neutral';
        const votes = {};
        hist.forEach(e => { votes[e] = (votes[e] || 0) + 1; });
        let best = 'neutral', bestCount = 0;
        for (const [emotion, count] of Object.entries(votes)) {
            if (count > bestCount) { bestCount = count; best = emotion; }
        }
        // Require at least 3 of 10 frames to overcome neutral default
        return (best !== 'neutral' && bestCount >= 3) ? best : 'neutral';
    }

    _dominant(expressions) {
        let max = 0, dominant = 'neutral';
        for (const [expr, val] of Object.entries(expressions)) {
            if (val > max) { max = val; dominant = expr; }
        }
        return dominant;
    }

    // ── Eye Contact (landmark-aware) ──────────────────────
    // Combines face box centering + landmark-based head angle estimate.
    // If nose tip is significantly offset from the midpoint between eyes,
    // it indicates head is turned away from camera.
    _calcEyeContact(faceBox, landmarks) {
        if (!this.video) return 50;
        const vw = this.video.videoWidth || 640;
        const vh = this.video.videoHeight || 480;
        const cx = faceBox.x + faceBox.width / 2;
        const cy = faceBox.y + faceBox.height / 2;
        const dx = Math.abs(cx - vw / 2) / (vw / 2);
        const dy = Math.abs(cy - vh / 2) / (vh / 2);
        let boxScore = Math.max(0, Math.min(100, (1 - Math.sqrt(dx ** 2 + dy ** 2) * 0.7) * 100));

        // Landmark-based head turn: compare nose tip horizontal position
        // relative to midpoint between left-eye center and right-eye center.
        // If nose is shifted far left/right, head is turned.
        let landmarkPenalty = 0;
        if (landmarks) {
            try {
                const nose = landmarks.getNose();
                const leftEye = landmarks.getLeftEye();
                const rightEye = landmarks.getRightEye();

                // Nose tip = nose[3], eye centers
                const noseTipX = nose[3].x;
                const leftEyeCx = (leftEye[0].x + leftEye[3].x) / 2;
                const rightEyeCx = (rightEye[0].x + rightEye[3].x) / 2;
                const eyeMidX = (leftEyeCx + rightEyeCx) / 2;
                const eyeSpan = Math.abs(rightEyeCx - leftEyeCx);

                // Horizontal offset as fraction of eye span (head turn angle proxy)
                if (eyeSpan > 5) {
                    const turnRatio = Math.abs(noseTipX - eyeMidX) / eyeSpan;
                    // turnRatio > 0.25 = noticeable turn, > 0.45 = looking away
                    landmarkPenalty = Math.min(40, turnRatio * 100);
                }
            } catch (_) { /* landmarks unavailable */ }
        }

        // FIX: apply 5-frame rolling average to smooth out landmark jitter
        const rawScore = Math.round(Math.max(0, Math.min(100, boxScore - landmarkPenalty)));
        this._recentEyeScores.push(rawScore);
        if (this._recentEyeScores.length > 5) this._recentEyeScores.shift();
        return Math.round(
            this._recentEyeScores.reduce((a, b) => a + b, 0) / this._recentEyeScores.length
        );
    }

    _calcHeadStability(landmarks) {
        const noseTip = landmarks.getNose()[3];
        if (!this.metrics.lastLandmarks) {
            this.metrics.lastLandmarks = { x: noseTip.x, y: noseTip.y };
            return 85;
        }
        const move = Math.sqrt(
            (noseTip.x - this.metrics.lastLandmarks.x) ** 2 +
            (noseTip.y - this.metrics.lastLandmarks.y) ** 2
        );
        this.metrics.lastLandmarks = { x: noseTip.x, y: noseTip.y };
        return Math.round(Math.max(0, Math.min(100, 100 - move * 3.5)));
    }

    _detectBlink(landmarks) {
        const ear = (pts) => {
            const v1 = Math.hypot(pts[1].x - pts[5].x, pts[1].y - pts[5].y);
            const v2 = Math.hypot(pts[2].x - pts[4].x, pts[2].y - pts[4].y);
            const h = Math.hypot(pts[0].x - pts[3].x, pts[0].y - pts[3].y);
            return (v1 + v2) / (2.0 * Math.max(h, 0.01));
        };
        const avgEAR = (ear(landmarks.getLeftEye()) + ear(landmarks.getRightEye())) / 2;
        // FIX: threshold raised 0.2 → 0.22 (camera-angle tolerance);
        // require 2 consecutive closed frames to prevent spurious blink counts.
        const closed = avgEAR < 0.22;
        if (closed) {
            this._blinkConsecutiveFrames++;
            if (this._blinkConsecutiveFrames === 2) this.metrics.blinkCount++;
        } else {
            this._blinkConsecutiveFrames = 0;
        }
        this.lastBlinkState = closed && this._blinkConsecutiveFrames >= 2;
    }

    _drawOverlay(detection) {
        if (!this.canvas || !this.video) return;
        try {
            const dims = faceapi.matchDimensions(this.canvas, this.video, true);
            const ctx = this.canvas.getContext('2d');
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            const resized = faceapi.resizeResults(detection, dims);
            const box = resized.detection.box;

            // Draw face bounding box
            ctx.strokeStyle = 'rgba(99, 149, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.strokeRect(box.x, box.y, box.width, box.height);
            ctx.setLineDash([]);

            // Draw corner accents
            const sz = 12, lw = 3;
            ctx.strokeStyle = 'rgba(99, 149, 255, 0.9)';
            ctx.lineWidth = lw;
            ctx.setLineDash([]);
            // top-left
            ctx.beginPath(); ctx.moveTo(box.x, box.y + sz); ctx.lineTo(box.x, box.y); ctx.lineTo(box.x + sz, box.y); ctx.stroke();
            // top-right
            ctx.beginPath(); ctx.moveTo(box.x + box.width - sz, box.y); ctx.lineTo(box.x + box.width, box.y); ctx.lineTo(box.x + box.width, box.y + sz); ctx.stroke();
            // bottom-left
            ctx.beginPath(); ctx.moveTo(box.x, box.y + box.height - sz); ctx.lineTo(box.x, box.y + box.height); ctx.lineTo(box.x + sz, box.y + box.height); ctx.stroke();
            // bottom-right
            ctx.beginPath(); ctx.moveTo(box.x + box.width - sz, box.y + box.height); ctx.lineTo(box.x + box.width, box.y + box.height); ctx.lineTo(box.x + box.width, box.y + box.height - sz); ctx.stroke();
        } catch (_) { }
    }

    getAverageMetrics() {
        const avg = arr => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
        return {
            confidence: avg(this.metrics.confidenceHistory),
            nervousness: avg(this.metrics.nervousnessHistory),
            eyeContact: avg(this.metrics.eyeContactHistory),
            smile: avg(this.metrics.smileHistory),
            headStability: avg(this.metrics.headStabilityHistory),
            blinkCount: this.metrics.blinkCount,
            blinkRate: this.metrics.frameCount > 0
                ? Math.round((this.metrics.blinkCount / this.metrics.frameCount) * 180) : 0,
            expressionCounts: { ...this.metrics.expressionCounts },
            frameCount: this.metrics.frameCount,
            confidenceHistory: [...this.metrics.confidenceHistory],
            nervousnessHistory: [...this.metrics.nervousnessHistory],
            stateHistory: [...this.metrics.stateHistory],
        };
    }

    reset() {
        this.metrics = this._freshMetrics();
        this.eyeOpenHistory = [];
        this.lastBlinkState = false;
        this._recentEyeScores = [];
        this._blinkConsecutiveFrames = 0;
    }
}

export const faceAnalyzer = new FaceAnalyzer();
