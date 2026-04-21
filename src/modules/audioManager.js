// ========================================
// Speakease — Audio Manager
// ========================================
// WHY THIS EXISTS:
// Browsers block AudioContext until user interacts (clicks, touches).
// If we create AudioContext before a click, it stays "suspended" and NO SOUND plays.
// This module solves that by:
//   1. Creating AudioContext only AFTER the first user gesture
//   2. Resuming it if suspended
//   3. Providing a dead-simple playTone / playBeep API

let _ctx = null;

// Call this once the user clicks the "Start Session" button
export function initAudio() {
    if (_ctx) {
        // Resume if suspended (Chrome puts it to sleep after idle)
        if (_ctx.state === 'suspended') _ctx.resume();
        return;
    }
    try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        _ctx = new Ctx();
        console.log('[AudioManager] AudioContext initialized. State:', _ctx.state);
    } catch (e) {
        console.warn('[AudioManager] AudioContext not available:', e);
    }
}

function getCtx() {
    if (!_ctx) return null;
    if (_ctx.state === 'suspended') {
        _ctx.resume().catch(() => { });
    }
    return _ctx;
}

// ── playTone(freq, type, duration, gain, sweepTo) ──────────────────
// freq     = Hz (pitch), e.g. 440
// type     = 'sine' | 'triangle' | 'square' | 'sawtooth'
// duration = seconds (e.g. 0.4)
// gain     = volume 0–1 (keep < 0.1 to avoid jarring)
// sweepTo  = optional end freq for rising/falling tones
export function playTone(freq = 440, type = 'sine', duration = 0.4, gain = 0.06, sweepTo = null) {
    const ctx = getCtx();
    if (!ctx) return;
    try {
        const osc = ctx.createOscillator();
        const gNode = ctx.createGain();
        osc.connect(gNode);
        gNode.connect(ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        if (sweepTo !== null) {
            osc.frequency.linearRampToValueAtTime(sweepTo, ctx.currentTime + duration);
        }
        gNode.gain.setValueAtTime(gain, ctx.currentTime);
        gNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    } catch (e) {
        console.warn('[AudioManager] playTone failed:', e);
    }
}

// Two quick pulses (warning sound)
export function playDoublePulse(freq = 350, gain = 0.07) {
    playTone(freq, 'triangle', 0.18, gain);
    setTimeout(() => playTone(freq, 'triangle', 0.18, gain), 280);
}

// Pleasant rising chime (positive feedback)
export function playChime() {
    playTone(880, 'sine', 0.25, 0.06, 1050);
    setTimeout(() => playTone(1320, 'sine', 0.18, 0.035), 200);
}

// Three-tone descending alert (STOP intervention)
export function playStopAlert() {
    playTone(660, 'sine', 0.3, 0.08);
    setTimeout(() => playTone(520, 'sine', 0.3, 0.08), 320);
    setTimeout(() => playTone(380, 'sine', 0.5, 0.09), 640);
}

// Play emotion-specific sound from emotions.json audio config
export function playEmotionTone(audioConfig) {
    if (!audioConfig) return;
    const { freq, type, duration, gain, sweep } = audioConfig;
    playTone(freq || 440, type || 'sine', duration || 0.4, gain || 0.06, sweep || null);
}
