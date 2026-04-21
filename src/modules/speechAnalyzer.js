// ========================================
// Speakease — Speech Analyzer v4 (Dataset-Driven)
// ========================================
//
// v4 changes:
// 1. Filler words sourced from centralized datasets.js
// 2. SpeechRecognition restarts immediately on `end` (robust restart logic)
// 3. Separate AudioContext for waveform — does not conflict with SpeechRecognition
// 4. WPM calculated in a rolling 15-second window
// 5. Filler detection on both final and interim results
// 6. `isPaused` flag prevents accidental restarts

import { FILLER_SINGLE_WORDS as FILLER_SINGLE, FILLER_PHRASES } from './datasets.js';

export class SpeechAnalyzer {
    constructor() {
        this.recognition = null;
        this.isSupported = false;
        this.isRunning = false;
        this.isPaused = false;

        this.onTranscript = null;
        this.onMetricsUpdate = null;

        this.wordBuffer = [];        // { word, time } for WPM window
        this.wpmInterval = null;

        this.metrics = this._defaultMetrics();
        this._seenFinalTexts = new Set();

        // Web Audio for volume / hesitation detection
        this.audioContext = null;
        this.analyser = null;         // exposed for WaveformVisualizer
        this._audioCheckInterval = null;

        // Restart management
        this._restartTimeout = null;
        this._startedAt = 0;          // time recognition.start() was last called

        this._checkSupport();
    }

    _defaultMetrics() {
        return {
            totalWords: 0,
            fillerWords: [],
            fillerCount: 0,
            hesitationCount: 0,
            stutterCount: 0,
            pauseCount: 0,
            longPauseCount: 0,
            wpmHistory: [],
            currentWpm: 0,
            segments: [],
            startTime: null,
            lastSpeechTime: null,
            fullTranscript: '',
            silenceDurations: [],
            // Volume for emotion fusion
            avgVolume: 50,
            _volumeSamples: [],
        };
    }

    _checkSupport() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            console.warn('SpeechRecognition not supported in this browser. Use Chrome or Edge.');
            return;
        }
        this.isSupported = true;
        this._SR = SR;   // store class reference for re-instantiation
        this._buildRecognition();
    }

    _buildRecognition() {
        const SR = this._SR;
        if (!SR) return;
        this.recognition = new SR();
        this.recognition.continuous     = true;
        this.recognition.interimResults = true;
        this.recognition.lang           = 'en-US';
        this.recognition.maxAlternatives = 3;  // more candidates → better accuracy

        this.recognition.onresult = (e) => this._handleResult(e);

        this.recognition.onerror = (e) => {
            console.warn('SpeechRecognition error:', e.error);
            if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
                console.error('Microphone permission denied.');
                this.isRunning = false;
                this._showMicError('Microphone access denied. Please allow mic permission and reload.');
            } else if (e.error === 'audio-capture') {
                console.warn('audio-capture: mic busy, will retry via onend restart');
            } else if (e.error === 'network') {
                console.warn('Speech API network error — will retry');
            }
        };

        this.recognition.onstart = () => {
            this._startedAt = Date.now();
        };

        this.recognition.onend = () => {
            if (this.isRunning && !this.isPaused) {
                // If recognition died within 1s it's likely an error — wait 500ms before retry.
                // Otherwise restart immediately (10ms) so there's no gap in transcription.
                const runTime = Date.now() - this._startedAt;
                const delay = runTime < 1000 ? 500 : 10;

                this._restartTimeout = setTimeout(() => {
                    if (this.isRunning && !this.isPaused) {
                        try { this.recognition.start(); } catch (_) { }
                    }
                }, delay);
            }
        };
    }

    // ── Start ──────────────────────────────────────────
    // audioStream: the mic MediaStream (audio-only or combined camera+mic)
    start(onTranscript, onMetricsUpdate, audioStream = null) {
        if (!this.isSupported) {
            console.warn('Speech recognition not supported.');
            return false;
        }

        this.onTranscript = onTranscript;
        this.onMetricsUpdate = onMetricsUpdate;
        this.isRunning = true;
        this.isPaused = false;
        this.metrics = this._defaultMetrics();
        this.metrics.startTime = Date.now();
        this.metrics.lastSpeechTime = Date.now();
        this._seenFinalTexts.clear();

        // Rebuild recognition object to clear any lingering state
        this._buildRecognition();

        try {
            this.recognition.start();
        } catch (e) {
            console.warn('recognition.start() error:', e);
        }

        // WPM recalc every 2s
        this.wpmInterval = setInterval(() => this._calcWPM(), 2000);

        // Set up audio analysis AFTER a delay so SpeechRecognition
        // grabs the mic first on mobile Chrome (avoids exclusive mic-lock conflict).
        if (audioStream) {
            // Caller provided a stream — use it directly (desktop path)
            this._startAudioAnalysis(audioStream);
        } else {
            // Delay 2s: let SpeechRecognition open the mic before we try to
            // open another getUserMedia handle for the waveform visualizer.
            setTimeout(() => {
                if (!this.isRunning) return; // user stopped in the meantime
                navigator.mediaDevices.getUserMedia({ audio: true, video: false })
                    .then(s => this._startAudioAnalysis(s))
                    .catch(() => {
                        // Mobile Chrome may deny a second getUserMedia — that's OK;
                        // speech recognition still works without the waveform.
                        console.info('Audio analysis unavailable (mic already in use by SpeechRecognition)');
                    });
            }, 2000);
        }

        return true;
    }

    // ── Pause ──────────────────────────────────────────
    pauseRecognition() {
        if (!this.isRunning || this.isPaused) return;
        this.isPaused = true;
        if (this._restartTimeout) { clearTimeout(this._restartTimeout); this._restartTimeout = null; }
        try { this.recognition?.abort(); } catch (_) { }
    }

    // ── Resume ──────────────────────────────────────────
    resumeRecognition() {
        if (!this.isRunning || !this.isPaused) return;
        this.isPaused = false;
        this._buildRecognition();   // fresh instance avoids "already started" errors
        try { this.recognition.start(); } catch (_) { }
    }

    // ── Stop ──────────────────────────────────────────
    stop() {
        this.isRunning = false;
        this.isPaused = false;
        if (this._restartTimeout) { clearTimeout(this._restartTimeout); this._restartTimeout = null; }
        try { this.recognition?.abort(); } catch (_) { }
        if (this.wpmInterval) { clearInterval(this.wpmInterval); this.wpmInterval = null; }
        if (this._audioCheckInterval) { clearInterval(this._audioCheckInterval); this._audioCheckInterval = null; }
        try { this.audioContext?.close(); } catch (_) { }
        this.audioContext = null;
        this.analyser = null;
    }

    // ── Show mic error to user (visible banner) ─────────
    _showMicError(msg) {
        // Try to show an on-screen toast so user knows what happened
        const toast = document.createElement('div');
        toast.style.cssText = [
            'position:fixed', 'top:20px', 'left:50%', 'transform:translateX(-50%)',
            'background:#f97316', 'color:#fff', 'font-weight:700',
            'padding:12px 24px', 'border-radius:10px', 'z-index:99999',
            'font-size:13px', 'text-align:center', 'max-width:90vw',
            'box-shadow:0 4px 20px rgba(0,0,0,0.3)'
        ].join(';');
        toast.textContent = '🎙️ ' + msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 8000);
    }

    // ── Web Audio Analysis (volume + hesitation) ────────
    _startAudioAnalysis(stream) {
        // Ensure we only use audio tracks
        const audioTracks = stream.getAudioTracks();
        if (!audioTracks || audioTracks.length === 0) {
            console.warn('No audio tracks in provided stream for audio analysis.');
            return;
        }

        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;

            this.audioContext = new Ctx();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 512;
            this.analyser.smoothingTimeConstant = 0.75;

            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyser);

            const bufLen = this.analyser.frequencyBinCount;
            const data = new Uint8Array(bufLen);

            let wasSpeaking = false;
            let silentFrames = 0;
            let audioSpeechStart = 0;
            let hesitationTimer = null;

            this._audioCheckInterval = setInterval(() => {
                if (!this.isRunning || this.isPaused || !this.analyser) return;

                this.analyser.getByteFrequencyData(data);
                const sum = data.reduce((a, v) => a + v * v, 0);
                const rms = Math.sqrt(sum / bufLen);
                const volume = Math.min(100, (rms / 100) * 100);  // 0-100

                // Track volume for emotion analysis
                this.metrics._volumeSamples.push(volume);
                if (this.metrics._volumeSamples.length > 50) this.metrics._volumeSamples.shift();
                this.metrics.avgVolume = Math.round(
                    this.metrics._volumeSamples.reduce((a, b) => a + b, 0) / this.metrics._volumeSamples.length
                );

                const SPEAK_THRESH = 8;
                const isSpeaking = volume > SPEAK_THRESH;

                if (isSpeaking) {
                    silentFrames = 0;
                    if (!wasSpeaking) {
                        wasSpeaking = true;
                        audioSpeechStart = Date.now();
                        // If audio is present but no transcript arrives in 2s → hesitation
                        if (hesitationTimer) clearTimeout(hesitationTimer);
                        hesitationTimer = setTimeout(() => {
                            if (!this.isRunning || this.isPaused) return;
                            const sinceTranscript = Date.now() - (this.metrics.lastSpeechTime || 0);
                            const sinceAudio = Date.now() - audioSpeechStart;
                            if (sinceAudio > 1800 && sinceTranscript > 2500) {
                                this.metrics.hesitationCount++;
                                this.metrics.fillerWords.push({ word: '[hesitation]', position: this.metrics.totalWords });
                                this.metrics.fillerCount++;
                                this._emitMetrics();
                            }
                        }, 2000);
                    }
                } else {
                    silentFrames++;
                    if (wasSpeaking && silentFrames >= 8) {
                        wasSpeaking = false;
                        if (hesitationTimer) { clearTimeout(hesitationTimer); hesitationTimer = null; }
                        audioSpeechStart = 0;
                    }
                }
            }, 100);

        } catch (e) {
            console.warn('Audio analysis setup failed:', e);
        }
    }

    // ── Handle SpeechRecognition result ────────────────
    _handleResult(event) {
        let interim = '';
        let newFinal = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                newFinal += transcript;
            } else {
                interim += transcript;
            }
        }

        if (newFinal) {
            // Deduplicate finals (Chrome occasionally fires the same result twice)
            const key = newFinal.trim().toLowerCase().slice(0, 100);
            if (!this._seenFinalTexts.has(key)) {
                this._seenFinalTexts.add(key);
                this._processFinal(newFinal);
            }
        }

        if (this.onTranscript) {
            this.onTranscript({
                final: this.metrics.fullTranscript,
                interim,
                combined: this.metrics.fullTranscript + (interim ? ' ' + interim : '')
            });
        }
    }

    // ── Process a confirmed final segment ──────────────
    _processFinal(text) {
        const now = Date.now();
        const trimmed = text.trim();
        if (!trimmed) return;

        // Pause between utterances
        if (this.metrics.lastSpeechTime) {
            const silenceSec = (now - this.metrics.lastSpeechTime) / 1000;
            if (silenceSec > 1.5) {
                this.metrics.pauseCount++;
                this.metrics.silenceDurations.push(silenceSec);
                if (silenceSec > 4) this.metrics.longPauseCount++;
            }
        }
        this.metrics.lastSpeechTime = now;
        this.metrics.fullTranscript += (this.metrics.fullTranscript ? ' ' : '') + trimmed;

        const lower = trimmed.toLowerCase();
        const words = lower.split(/\s+/).filter(w => w.length > 0);
        this.metrics.totalWords += words.length;
        words.forEach(w => this.wordBuffer.push({ word: w, time: now }));

        // Filler phrase detection
        FILLER_PHRASES.forEach(phrase => {
            let idx = lower.indexOf(phrase);
            while (idx !== -1) {
                const ok = (idx === 0 || /[\s,.!?]/.test(lower[idx - 1])) &&
                    (idx + phrase.length >= lower.length || /[\s,.!?]/.test(lower[idx + phrase.length]));
                if (ok) {
                    this.metrics.fillerWords.push({ word: phrase, position: this.metrics.totalWords });
                    this.metrics.fillerCount++;
                }
                idx = lower.indexOf(phrase, idx + 1);
            }
        });

        // Single filler word detection
        words.forEach((word, i) => {
            const clean = word.replace(/[^a-z']/g, '');
            if (FILLER_SINGLE.includes(clean)) {
                this.metrics.fillerWords.push({ word: clean, position: this.metrics.totalWords - words.length + i });
                this.metrics.fillerCount++;
            }
        });

        // Stutter detection (same word twice in a row)
        for (let i = 1; i < words.length; i++) {
            const w1 = words[i].replace(/[^a-z]/g, '');
            const w2 = words[i - 1].replace(/[^a-z]/g, '');
            if (w1 === w2 && w1.length > 1) this.metrics.stutterCount++;
        }

        this.metrics.segments.push({ text: trimmed, timestamp: now, wordCount: words.length });
        this._emitMetrics();
    }

    // ── WPM (rolling 15-second window) ─────────────────
    _calcWPM() {
        const now = Date.now();
        const WINDOW = 15000;   // 15-second rolling window
        this.wordBuffer = this.wordBuffer.filter(w => now - w.time < WINDOW);
        // Scale to per-minute
        this.metrics.currentWpm = Math.round(this.wordBuffer.length * (60000 / WINDOW));
        this.metrics.wpmHistory.push(this.metrics.currentWpm);
        if (this.metrics.wpmHistory.length > 150) {
            this.metrics.wpmHistory = this.metrics.wpmHistory.slice(-150);
        }
        this._emitMetrics();
    }

    // ── Emit metrics to SessionPage ────────────────────
    _emitMetrics() {
        if (!this.onMetricsUpdate) return;
        const elapsed = this.metrics.startTime ? (Date.now() - this.metrics.startTime) / 60000 : 0.1;
        const fillerRatio = this.metrics.totalWords > 0 ? this.metrics.fillerCount / this.metrics.totalWords : 0;
        const stutterRatio = this.metrics.totalWords > 0 ? this.metrics.stutterCount / this.metrics.totalWords : 0;
        const clarityScore = Math.round(Math.max(0, Math.min(100,
            100 - (fillerRatio * 150) - (stutterRatio * 250)
        )));

        this.onMetricsUpdate({
            totalWords: this.metrics.totalWords,
            fillerCount: this.metrics.fillerCount,
            hesitationCount: this.metrics.hesitationCount,
            currentWpm: this.metrics.currentWpm,
            avgWpm: Math.round(this.metrics.totalWords / Math.max(elapsed, 0.1)),
            pauseCount: this.metrics.pauseCount,
            stutterCount: this.metrics.stutterCount,
            clarityScore,
            avgVolume: this.metrics.avgVolume,
        });
    }

    // ── Full metrics snapshot (used for report) ─────────
    getFullMetrics() {
        const elapsed = this.metrics.startTime ? (Date.now() - this.metrics.startTime) / 60000 : 0.1;
        const avgWpm = Math.round(this.metrics.totalWords / Math.max(elapsed, 0.1));
        const fillerRatio = this.metrics.totalWords > 0 ? this.metrics.fillerCount / this.metrics.totalWords : 0;
        const stutterRatio = this.metrics.totalWords > 0 ? this.metrics.stutterCount / this.metrics.totalWords : 0;
        const clarityScore = Math.round(Math.max(0, Math.min(100,
            100 - (fillerRatio * 150) - (stutterRatio * 250)
        )));
        const avgSilence = this.metrics.silenceDurations.length > 0
            ? this.metrics.silenceDurations.reduce((a, b) => a + b, 0) / this.metrics.silenceDurations.length : 0;

        return {
            ...this.metrics,
            avgWpm,
            clarityScore,
            avgSilenceDuration: Math.round(avgSilence * 10) / 10,
            elapsedMinutes: Math.round(elapsed * 10) / 10,
            fillerWords: [...this.metrics.fillerWords],
            wpmHistory: [...this.metrics.wpmHistory],
            segments: [...this.metrics.segments],
        };
    }

    reset() {
        this.metrics = this._defaultMetrics();
        this.wordBuffer = [];
        this._seenFinalTexts = new Set();
    }
}

export const speechAnalyzer = new SpeechAnalyzer();
