// ========================================
// Speakease — Live AI Coach v5
// (Semantic Evaluator + Emotion Audio + STOP Overlay)
// ========================================
import {
    initAudio, playTone, playDoublePulse, playChime,
    playStopAlert, playEmotionTone
} from '../modules/audioManager.js';

const COACH_MESSAGES = {
    tooManyFillers: [
        { text: "💬 Too many fillers — pause silently instead of saying 'um'", type: 'warning' },
        { text: "⚠️ Reduce 'uh', 'like', 'basically' — speak deliberately", type: 'warning' },
    ],
    tooFast:   [{ text: "🚀 Slow down — you're speaking too fast!", type: 'warning' }],
    tooSlow:   [{ text: "🐢 Pick up the pace — speak a bit faster!", type: 'info' }],
    goodPace:  [{ text: "🎯 Great speaking pace!", type: 'success' }],
    lowEyeContact:      [{ text: "👁️ Look at the camera — maintain eye contact!", type: 'warning' }],
    criticalEyeContact: [{ text: "🔴 You're looking away too often — noticeable to interviewers!", type: 'danger' }],
    goodEyeContact:     [{ text: "👀 Excellent eye contact!", type: 'success' }],
    highConfidence:     [{ text: "🔥 You look confident — keep it up!", type: 'success' }],
    nervous:   [{ text: "😟 Take a deep breath — slow down and compose yourself.", type: 'info' }],
    stressed:  [{ text: "😤 Relax your jaw and forehead. You're in control.", type: 'info' }],
    lowConf:   [{ text: "💡 Sit up straight and project your voice!", type: 'info' }],
    grammarError: [
        { text: "📝 Grammar issue detected — use formal language.", type: 'warning' },
        { text: "✍️ Watch your sentence structure and verb tenses.", type: 'warning' },
    ],
    encouragement: [
        { text: "⭐ Keep going — you're doing well!", type: 'success' },
        { text: "🌟 Solid answer — stay confident!", type: 'success' },
    ],
};

export class LiveCoach {
    constructor() {
        this.container = null;
        this.lastMessages = new Map();
        this.COOLDOWN_MS = 15000;
        this.prevFillerCount = 0;
        this.checkCount = 0;
        this._lowEyeCount = 0;
        this._eyeBeepCooldown = 0;
        this._lastEmotionAudio = {};
        this.EMOTION_AUDIO_COOLDOWN = 18000;
        this._irrelevantCount = 0;
        this._stopShowing = false;
        this._lastGrammarCount = 0;
        this.onIndicatorChange = null;
    }

    mount() {
        this.container = document.createElement('div');
        this.container.id = 'coach-container';
        this.container.style.cssText = `
          position:fixed; top:72px; right:16px; z-index:9999;
          display:flex; flex-direction:column; gap:8px;
          pointer-events:none; max-width:320px;
        `;
        document.body.appendChild(this.container);
    }

    unmount() {
        if (this.container) { this.container.remove(); this.container = null; }
        this._dismissStop();
    }

    // ── Main evaluation loop (called every ~3s) ─────────────────────
    evaluate(speechMetrics, faceMetrics) {
        this.checkCount++;
        const fillers    = speechMetrics?.fillerCount || 0;
        const wpm        = speechMetrics?.currentWpm  || 0;
        const totalWords = speechMetrics?.totalWords  || 0;
        const newFillers = fillers - this.prevFillerCount;
        const eyeWarn    = faceMetrics?.eyeContactWarningLevel || 'none';
        const eyeContact = faceMetrics?.eyeContact  || 0;
        const confidence = faceMetrics?.confidence  || 0;
        const nervousness = faceMetrics?.nervousness || 0;
        const grammarCount = speechMetrics?.grammarErrorCount || 0;

        // Fillers
        if (newFillers >= 3 && this._canShow('tooManyFillers')) {
            this._show('tooManyFillers');
            playTone(350, 'triangle', 0.3, 0.06);
        }
        this.prevFillerCount = fillers;

        // WPM
        if (totalWords > 30 && wpm > 0) {
            if (wpm > 185 && this._canShow('tooFast')) { this._show('tooFast'); playTone(550, 'sawtooth', 0.2, 0.06); }
            else if (wpm < 75 && this._canShow('tooSlow')) this._show('tooSlow');
            else if (wpm >= 110 && wpm <= 160 && this.checkCount % 5 === 0 && this._canShow('goodPace')) this._show('goodPace');
        }

        // Eye contact
        if (faceMetrics?.faceDetected) {
            if (eyeWarn === 'critical') {
                this._lowEyeCount++;
                if (this._lowEyeCount >= 3 && this._canShow('criticalEyeContact')) {
                    this._show('criticalEyeContact');
                    const now = Date.now();
                    if (now - this._eyeBeepCooldown > 12000) {
                        playDoublePulse(440, 0.07);
                        this._eyeBeepCooldown = now;
                    }
                }
            } else if (eyeWarn === 'low') {
                this._lowEyeCount++;
                if (this._canShow('lowEyeContact')) {
                    this._show('lowEyeContact');
                    playTone(300, 'triangle', 0.3, 0.05);
                }
            } else {
                this._lowEyeCount = Math.max(0, this._lowEyeCount - 1);
                if (eyeContact > 75 && this.checkCount % 6 === 0 && this._canShow('goodEyeContact')) {
                    this._show('goodEyeContact');
                }
            }

            // Emotion audio (reads from JSON dataset config)
            if (faceMetrics.emotionState) {
                this._handleEmotionAudio(faceMetrics.emotionState, nervousness, confidence);
            }

            // State toasts
            if (nervousness > 65 && this._canShow('nervous')) {
                this._show('nervous');
            } else if (faceMetrics?.emotionState?.interviewState === 'stressed' && this._canShow('stressed')) {
                this._show('stressed');
            } else if (faceMetrics?.emotionState?.interviewState === 'low_confidence' && this._canShow('lowConf')) {
                this._show('lowConf');
            } else if (confidence > 75 && this.checkCount % 8 === 0 && this._canShow('highConfidence')) {
                this._show('highConfidence');
            }
        }

        // Grammar
        if (grammarCount > this._lastGrammarCount + 2 && this._canShow('grammarError')) {
            this._show('grammarError');
            playTone(400, 'triangle', 0.25, 0.05);
            this._lastGrammarCount = grammarCount;
        }

        // Encouragement
        if (this.checkCount > 0 && this.checkCount % 20 === 0 && totalWords > 20 && this._canShow('encouragement')) {
            this._show('encouragement');
        }

        this._updateIndicator(eyeWarn, nervousness, confidence, faceMetrics?.faceDetected);
    }

    // ── Relevance warning (called from SessionPage) ─────────────────
    // score: 0–100 | questionText: original question | evalResult: from relevanceEvaluator
    warnRelevance(score, questionText, evalResult) {
        if (score < 35) {
            this._irrelevantCount++;
            if (this._irrelevantCount >= 2) {
                this._showStop(questionText || 'the question asked', evalResult);
                this._irrelevantCount = 0;
            } else if (this._canShow('offTopic')) {
                const msg = evalResult?.feedback
                    ? `⚠️ ${evalResult.feedback}`.slice(0, 130)
                    : '⚠️ Your answer seems off-topic. Focus on the question!';
                this._showToast(msg, 'warning');
                this.lastMessages.set('offTopic', Date.now());
                playDoublePulse(380, 0.06);
            }
        } else {
            this._irrelevantCount = Math.max(0, this._irrelevantCount - 1);
        }
    }

    // ── STOP overlay (shown after 2 consecutive irrelevant readings) ─
    _showStop(questionText, evalResult) {
        if (this._stopShowing) return;
        this._stopShowing = true;
        playStopAlert();

        const feedback = evalResult?.feedback   || 'Refocus and answer the question directly.';
        const verdict  = evalResult?.verdict    || 'not relevant';
        const qType    = evalResult?.question_type || '';
        const aType    = evalResult?.answer_type   || '';
        const mismatch = qType && aType && qType !== aType && !aType.includes('general');
        const vc = verdict === 'not relevant' ? '#ef4444' : '#f59e0b';

        const verdictChip = `<span style="font-size:11px;font-weight:700;background:${vc}20;color:${vc};border:1px solid ${vc}40;border-radius:99px;padding:2px 10px">${verdict.toUpperCase()}</span>`;
        const mismatchNote = mismatch
            ? `<div style="font-size:11px;color:#f59e0b;margin:8px 0">⚠ This is a <b>${qType}</b> question — your answer sounded <b>${aType}</b></div>`
            : '';

        const overlay = document.createElement('div');
        overlay.id = 'stop-breathe-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(8,17,31,0.93);backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:center';
        overlay.innerHTML = `
          <div style="text-align:center;max-width:480px;padding:36px 28px;background:rgba(255,255,255,0.04);border:1.5px solid rgba(239,68,68,0.35);border-radius:24px;box-shadow:0 0 80px rgba(239,68,68,0.12),0 20px 60px rgba(0,0,0,0.5);animation:stopIn .35s cubic-bezier(.34,1.56,.64,1) both">
            <style>@keyframes stopIn{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}@keyframes bp{0%,100%{transform:scale(1)}50%{transform:scale(1.14)}}#stop-breathe-ok:hover{opacity:.85}</style>
            <div style="font-size:3rem;margin-bottom:10px;animation:bp 2s ease-in-out infinite">✋</div>
            <h2 style="color:#ef4444;font-size:1.45rem;font-weight:900;margin:0 0 8px">PAUSE — Take a Breath</h2>
            <div style="margin-bottom:10px">${verdictChip}</div>
            ${mismatchNote}
            <div style="background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.28);border-radius:12px;padding:12px 16px;color:#a5b4fc;font-size:0.88rem;font-weight:600;margin-bottom:12px;font-style:italic;line-height:1.5">
              &ldquo;${questionText}&rdquo;
            </div>
            <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:10px 14px;color:#fbbf24;font-size:0.82rem;margin-bottom:16px;line-height:1.55;text-align:left">
              💡 ${feedback}
            </div>
            <div style="color:rgba(255,255,255,0.3);font-size:0.75rem;margin-bottom:16px">🫁 Inhale 4s &nbsp;·&nbsp; Hold 4s &nbsp;·&nbsp; Exhale 4s</div>
            <button id="stop-breathe-ok" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border:none;border-radius:50px;padding:10px 32px;font-size:0.85rem;font-weight:700;cursor:pointer;pointer-events:all;transition:all .2s">
              I'm Ready — Continue ✓
            </button>
          </div>
        `;
        document.body.appendChild(overlay);
        document.getElementById('stop-breathe-ok')?.addEventListener('click', () => this._dismissStop());
        setTimeout(() => this._dismissStop(), 20000);
    }

    _dismissStop() {
        const el = document.getElementById('stop-breathe-overlay');
        if (el) {
            el.style.opacity = '0';
            el.style.transition = 'opacity 0.3s';
            setTimeout(() => el.remove(), 350);
        }
        this._stopShowing = false;
    }

    // ── Emotion audio from JSON dataset config ──────────────────────
    _handleEmotionAudio(emotionState, nervousness, confidence) {
        const stateKey = emotionState?.interviewState || emotionState?.state;
        if (!stateKey) return;
        const now = Date.now();
        const last = this._lastEmotionAudio[stateKey] || 0;
        if (now - last < this.EMOTION_AUDIO_COOLDOWN) return;

        const audioConfig = emotionState?.audio;
        const severity    = emotionState?.severity;

        if (severity === 'warning' || severity === 'critical') {
            if (audioConfig?.doublePulse || emotionState?.doublePulse) {
                playDoublePulse(audioConfig?.freq || 220, audioConfig?.gain || 0.07);
            } else {
                playEmotionTone(audioConfig);
            }
            this._lastEmotionAudio[stateKey] = now;
        } else if (severity === 'positive' && confidence > 75) {
            playChime();
            this._lastEmotionAudio[stateKey] = now;
        }
    }

    // ── Visual 🟢🟡🔴 indicator ────────────────────────────────────
    _updateIndicator(eyeWarn, nervousness, confidence, faceDetected) {
        let level = 'green';
        if (!faceDetected) level = 'yellow';
        else if (eyeWarn === 'critical' || nervousness > 65) level = 'red';
        else if (eyeWarn === 'low' || nervousness > 40 || confidence < 45) level = 'yellow';

        if (this.onIndicatorChange) this.onIndicatorChange(level);

        const dot   = document.getElementById('live-indicator-dot');
        const label = document.getElementById('live-indicator-label');
        const bar   = document.getElementById('live-indicator-bar');
        if (!dot || !label) return;

        const cfg = {
            green:  { color: '#22c55e', text: '🟢 Confident', bg: 'rgba(34,197,94,0.1)'   },
            yellow: { color: '#f59e0b', text: '🟡 Caution',   bg: 'rgba(245,158,11,0.1)'  },
            red:    { color: '#ef4444', text: '🔴 Nervous',   bg: 'rgba(239,68,68,0.1)'   },
        };
        const c = cfg[level];
        dot.style.background  = c.color;
        dot.style.boxShadow   = `0 0 8px ${c.color}`;
        label.textContent     = c.text;
        label.style.color     = c.color;
        if (bar) bar.style.background = c.bg;
    }

    // ── Profanity / Unprofessional Language Warning ─────────────────────
    // Fires immediately when engine detects profanity. High-priority danger toast.
    warnProfanity() {
        const now = Date.now();
        // 10-second cooldown — don't spam on every word
        if (now - (this._lastProfanityToast || 0) < 10000) return;
        this._lastProfanityToast = now;
        playDoublePulse(520, 0.12);
        this._showToast(
            'UNPROFESSIONAL LANGUAGE DETECTED — Use professional vocabulary',
            'danger'
        );
    }

    // ── Eye Contact BEEP (triggered from LiveEvaluatorEngine) ──────────
    // Called by SessionPage when engine.getUxSignals() returns eyeContactAlert: 'BEEP'
    triggerBeep() {
        playDoublePulse(440, 0.07);
        this._showToast("👁️ Look at the camera — maintain eye contact!", 'warning');
    }

    _canShow(type) { return Date.now() - (this.lastMessages.get(type) || 0) > this.COOLDOWN_MS; }

    _show(type) {
        const opts = COACH_MESSAGES[type];
        if (!opts || !this.container) return;
        const msg = opts[Math.floor(Math.random() * opts.length)];
        this.lastMessages.set(type, Date.now());
        this._showToast(msg.text, msg.type);
    }

    _showToast(text, type = 'info') {
        if (!this.container) return;
        const colors = {
            success: { bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.35)',  text: '#22c55e' },
            warning: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)', text: '#f59e0b' },
            danger:  { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)',   text: '#ef4444' },
            info:    { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.35)', text: '#818cf8' },
        };
        const c = colors[type] || colors.info;
        const toast = document.createElement('div');
        toast.style.cssText = `background:${c.bg};border:1px solid ${c.border};color:${c.text};padding:10px 14px;border-radius:12px;font-size:13px;font-weight:500;line-height:1.4;backdrop-filter:blur(12px);pointer-events:none;opacity:0;transform:translateX(20px);transition:all .3s cubic-bezier(.34,1.56,.64,1);box-shadow:0 4px 20px rgba(0,0,0,.2);max-width:100%`;
        toast.textContent = text;
        this.container.appendChild(toast);
        requestAnimationFrame(() => requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }));
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            setTimeout(() => toast.remove(), 400);
        }, 4500);
    }
}

export const liveCoach = new LiveCoach();
