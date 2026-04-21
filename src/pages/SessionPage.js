// ========================================
// Speakease — Session Page (Full, with all creative features)
// ========================================

import { router } from '../router.js';
import { store } from '../store.js';
import { questionEngine } from '../modules/questionEngine.js';
import { faceAnalyzer } from '../modules/faceAnalyzer.js';
import { speechAnalyzer } from '../modules/speechAnalyzer.js';
import { grammarChecker } from '../modules/grammarChecker.js';
import { progressTracker } from '../modules/progressTracker.js';
import { evaluateRelevance } from '../modules/relevanceEvaluator.js';
import { aiEvaluate } from '../modules/aiEvaluator.js';
import { liveEvaluatorEngine } from '../modules/liveEvaluatorEngine.js';
import { detectProfanity } from '../modules/datasets.js';
import { initAudio } from '../modules/audioManager.js';
import { VideoFeed } from '../components/VideoFeed.js';
import { TranscriptBox } from '../components/TranscriptBox.js';
import { MetricsPanel } from '../components/MetricsPanel.js';
import { QuestionCard } from '../components/QuestionCard.js';
import { LiveCoach } from '../components/LiveCoach.js';
import { WaveformVisualizer } from '../components/WaveformVisualizer.js';

export class SessionPage {
    constructor() {
        this.videoFeed = new VideoFeed();
        this.transcriptBox = new TranscriptBox();
        this.metricsPanel = new MetricsPanel();
        this.questionCard = new QuestionCard();
        this.coach = new LiveCoach();
        this.waveform = new WaveformVisualizer();

        this.timer = null;
        this.timerSeconds = 0;
        this.maxSeconds = 0;
        this.questionTimer = 0;       // per-question timer
        this.questionTimerEl = null;

        this.currentAnswer = '';
        this.isWaitingForAnswer = false;
        this.followUpAsked = false;

        // Debounce timer for live relevance evaluation (1.2s)
        this._evalDebounce = null;

        // Live metrics cache for coach
        this._lastSpeechMetrics = null;
        this._lastFaceMetrics = null;
        this._coachInterval = null;

        // Relevance tracking
        this._currentRelevanceScore = null;
        this._currentQuestion = null;
        this._prevEngineStatus = null;  // tracks last engine status for transition flash
        this._lastIntervention = 0;     // epoch ms — prevents repeated pop-ups
        this._INTERVENTION_COOLDOWN = 45000;  // 45s between interventions per question
        this._lastProfanityAlert = null; // epoch ms — for early profanity cooldown

        // Pause / cheat tracking
        this.isMicPaused = false;
        this.pauseCount = 0;
        this.pauseStartTime = 0;
        this.totalPauseDuration = 0;
        this.CHEAT_THRESHOLD = 3;
    }

    render() {
        const page = document.createElement('div');
        page.className = 'page session-page';
        page.innerHTML = `
      <!-- 3-2-1 Countdown Overlay -->
      <div class="countdown-overlay" id="countdown-overlay">
        <div class="countdown-box">
          <div class="countdown-icon">🎙</div>
          <div class="countdown-number" id="countdown-num">3</div>
          <div class="countdown-label">Interview starting...</div>
        </div>
      </div>

      <div class="session-navbar">
        <div class="flex items-center gap-3">
          <div class="navbar-brand-icon"><i data-lucide="mic" style="width:18px;height:18px"></i></div>
          <span class="font-bold">Speakease AI</span>
          <span class="badge badge-success" id="session-status"><span class="recording-dot"></span> Live</span>
        </div>
        <div class="flex items-center gap-4">
          <!-- Session timer -->
          <div class="session-timer" id="session-timer">
            <i data-lucide="clock" style="width:14px;height:14px"></i>
            <span id="timer-display">00:00</span>
            <span class="text-muted text-xs" id="timer-max"></span>
          </div>
          <!-- Per-question timer -->
          <div class="question-timer-pill" id="question-timer-pill">
            <i data-lucide="target" style="width:12px;height:12px"></i>
            <span id="question-timer-display">0s</span>
          </div>
          <button class="btn btn-sm btn-ghost" id="next-question-btn" title="Next Question">
            <i data-lucide="skip-forward" style="width:16px;height:16px"></i> Next
          </button>
          <button class="btn btn-sm btn-danger" id="end-session-btn">
            <i data-lucide="square" style="width:14px;height:14px"></i> End
          </button>
        </div>
      </div>

      <div class="session-layout">
        <div class="session-main">
          <div id="question-card-container"></div>

          <!-- ── DOMINANT STATUS PILL — top of main area, impossible to miss ── -->
          <div id="dominant-status-pill" class="dominant-pill dominant-pill--evaluating">
            <span id="dominant-pill-icon">⏳</span>
            <span id="dominant-pill-label">Listening...</span>
            <span id="dominant-pill-detail"></span>
          </div>

          <!-- ── PROFESSIONAL LIVE SCORECARD STRIP ── below dominant pill, above webcam ── -->
          <div id="live-scorecard-strip" class="live-scorecard-strip">
            <div class="lsc-metric">
              <span class="lsc-val" id="lsc-score">—</span>
              <span class="lsc-key">Answer Score</span>
              <div class="lsc-mini-bar"><div id="lsc-score-bar" class="lsc-mini-fill" style="width:0%"></div></div>
            </div>
            <div class="lsc-divider"></div>
            <div class="lsc-metric">
              <span class="lsc-val" id="lsc-emotion">—</span>
              <span class="lsc-key">Emotion</span>
            </div>
            <div class="lsc-divider"></div>
            <div class="lsc-metric">
              <span class="lsc-val" id="lsc-eye">—</span>
              <span class="lsc-key">Eye Contact</span>
              <div class="lsc-mini-bar"><div id="lsc-eye-bar" class="lsc-mini-fill" style="width:0%"></div></div>
            </div>
          </div>

          <div class="session-center">
            <div class="session-video-area" id="video-feed-container">
              <!-- ── WEBCAM COACH BUBBLE ── -->
              <div id="webcam-coach-bubble" class="webcam-coach-bubble webcam-coach-hidden">
                <span id="webcam-coach-text"></span>
              </div>
            </div>

            <!-- Right side: Waveform + Transcript -->
            <div class="transcript-side">
              <!-- Mic control bar -->
              <div class="mic-control-bar" id="mic-control-bar">
                <button class="btn btn-primary mic-toggle-btn" id="mic-toggle-btn">
                  <i data-lucide="mic" style="width:16px;height:16px"></i>
                  <span id="mic-btn-label">Pause Mic</span>
                </button>
                <div class="mic-status-info">
                  <span id="mic-status-text" class="text-sm text-secondary">🎙 Mic active — speak your answer</span>
                  <span id="pause-warning" class="text-sm" style="color:var(--color-warning-500);display:none"></span>
                </div>
              </div>

              <!-- Audio waveform -->
              <div id="waveform-container" class="waveform-container"></div>

              <!-- Transcript -->
              <div id="transcript-container" style="flex:1;min-height:0;"></div>
            </div>
          </div>
        </div>
        <aside class="session-sidebar" id="metrics-container"></aside>
      </div>

      <!-- End Interview Modal -->
      <div class="modal-overlay" id="end-modal" style="display:none">
        <div class="modal">
          <h3 class="modal-title">End Interview?</h3>
          <p class="text-secondary" style="margin-bottom:var(--space-6)">Your report will be generated from data collected so far.</p>
          <div class="flex gap-3 justify-end">
            <button class="btn btn-secondary" id="cancel-end-btn">Continue</button>
            <button class="btn btn-primary" id="confirm-end-btn">
              <i data-lucide="bar-chart-3" style="width:16px;height:16px"></i> View Report
            </button>
          </div>
        </div>
      </div>
    `;
        return page;
    }

    async mount() {
        document.getElementById('question-card-container')?.appendChild(this.questionCard.render());
        document.getElementById('video-feed-container')?.appendChild(this.videoFeed.render());
        document.getElementById('transcript-container')?.appendChild(this.transcriptBox.render());
        document.getElementById('metrics-container')?.appendChild(this.metricsPanel.render());

        if (window.lucide) window.lucide.createIcons();

        const config = store.get('config');
        this.maxSeconds = (config.duration || 10) * 60;
        const maxEl = document.getElementById('timer-max');
        if (maxEl) maxEl.textContent = `/ ${config.duration || 10}:00`;

        const questions = store.get('session.questions');
        if (!questions || questions.length === 0) {
            questionEngine.generateQuestions(config);
            store.set('session.questions', questionEngine.questions);
        } else {
            questionEngine.questions = questions;
            questionEngine.currentIndex = 0;
        }

        // ── Unlock AudioContext on user gesture ──────────────────
        // IMPORTANT: browsers block audio until user interaction.
        // The countdown screen IS the user gesture, so init here.
        initAudio();

        // ── 3-2-1 Countdown then start ──
        await this._showCountdown();

        this._showCurrentQuestion();

        let grammarTimer = null;

        // ── Camera + Face Analysis (start in background, non-blocking) ──
        // We do NOT await this block so speech starts immediately below.
        (async () => {
            try {
                const camResult = await this.videoFeed.startCamera();
                try {
                    await faceAnalyzer.loadModels();
                    faceAnalyzer.setVideo(camResult.video, camResult.canvas);
                    faceAnalyzer.start((data) => {
                        this._lastFaceMetrics = data;
                        this.metricsPanel.updateFace(data);
                        liveEvaluatorEngine.setFaceData(data);
                        this._trackNervousness(data);
                    });
                } catch (e) { console.warn('Face analysis unavailable:', e); }
            } catch (e) {
                console.warn('Camera unavailable:', e);
            }
        })();

        // ── Speech Analysis — starts IMMEDIATELY (mic active when question shows) ──
        if (speechAnalyzer.isSupported) {
            speechAnalyzer.start(
                (transcriptData) => {
                    if (this.isMicPaused) return;
                    this.transcriptBox.update(transcriptData);
                    this.currentAnswer = transcriptData.final;

                    // ── EARLY PROFANITY CHECK (interim+final — fires the instant word appears) ──
                    // Uses 'combined' which includes live interim so no waiting needed
                    if (this._currentQuestion) {
                        const liveText = (transcriptData.combined || transcriptData.final || '').toLowerCase();
                        if (liveText) {
                            const earlyProfanity = detectProfanity(liveText);
                            if (earlyProfanity.length > 0 && !this._lastProfanityAlert) {
                                this._lastProfanityAlert = Date.now();
                                this.metricsPanel.applyPulse('RED_PULSE');
                                this.coach.warnProfanity?.();
                                this._triggerIntervention?.('profanity', 0);
                            }
                            // Reset alert flag after 15s so it can fire again
                            if (this._lastProfanityAlert && Date.now() - this._lastProfanityAlert > 15000) {
                                this._lastProfanityAlert = null;
                            }
                        }
                    }

                    // ── Semantic relevance check (debounced 1.2s, triggers at 20+ words) ──
                    // FIX: old threshold was 5 words → false 10/100 scores on partial speech.
                    // FIX: debounce prevents re-evaluation on every interim transcript word.
                    if (this._currentQuestion && this.currentAnswer) {
                        const wordCount = (this.currentAnswer || '').split(/\s+/).filter(Boolean).length;

                        // Always keep engine aware we are speaking
                        liveEvaluatorEngine.setSpeakingState('speaking');

                        if (wordCount >= 20) {
                            clearTimeout(this._evalDebounce);
                            this._evalDebounce = setTimeout(() => {
                                if (!this._currentQuestion || !this.currentAnswer) return;
                                const wc = (this.currentAnswer || '').split(/\s+/).filter(Boolean).length;
                                const evalResult = evaluateRelevance(this._currentQuestion, this.currentAnswer);
                                this._currentRelevanceScore = evalResult._score100;
                                this._lastEvalResult = evalResult;
                                this.metricsPanel.updateRelevance(evalResult._score100, evalResult);

                                // ── Feed engine: update status state machine ──
                                liveEvaluatorEngine.update(evalResult, wc, this.currentAnswer);
                                const engineOut = liveEvaluatorEngine.getOutput();
                                this.metricsPanel.updateEngineOutput(engineOut);
                                this._updateLiveBanner(engineOut);

                                // ── Flash full screen on status TRANSITION ──
                                const newStatus = engineOut.Status;
                                if (newStatus !== this._prevEngineStatus) {
                                    if (newStatus === 'Relevant') {
                                        this.metricsPanel.applyPulse('GREEN_PULSE');
                                    } else if (newStatus === 'Partially Relevant') {
                                        this.metricsPanel.applyPulse('YELLOW_HINT');
                                    } else if (newStatus === 'Not Relevant') {
                                        this.metricsPanel.applyPulse('RED_PULSE');
                                    }
                                    this._prevEngineStatus = newStatus;
                                }

                                // ── Profanity: immediate coach toast + red flash ──
                                if (engineOut.Profanity_Detected) {
                                    this.metricsPanel.applyPulse('RED_PULSE');
                                    this.coach.warnProfanity?.();
                                    this._triggerIntervention?.('profanity', wc);
                                }

                                // ── Not Relevant intervention (40+ words) ──
                                if (newStatus === 'Not Relevant' && wc >= 40) {
                                    this._triggerIntervention?.('irrelevant', wc);
                                }

                                // Warn coach at 30+ words if not relevant
                                if (wc >= 30 && !evalResult._isRelevant) {
                                    this.coach.warnRelevance(evalResult._score100, this._currentQuestion, evalResult);
                                }
                            }, 1200);
                        }
                    }

                    if (grammarTimer) clearTimeout(grammarTimer);
                    grammarTimer = setTimeout(() => {
                        const text = transcriptData.final;
                        if (text && text.split(' ').length > 5) {
                            const result = grammarChecker.analyze(text);
                            this.transcriptBox.showGrammarHints(result);
                            // Feed grammar into engine
                            liveEvaluatorEngine.setGrammarResult(result, text);
                            // Pass error count so coach can trigger grammar toast
                            if (this._lastSpeechMetrics) {
                                this._lastSpeechMetrics.grammarErrorCount = result.errorCount || 0;
                            }
                        }
                    }, 1500);
                },
                (metrics) => {
                    this._lastSpeechMetrics = metrics;
                    if (!this.isMicPaused) {
                        this.metricsPanel.updateSpeech(metrics);
                        faceAnalyzer.setWpm(metrics.currentWpm || 0);
                    }
                },
                null  // no pre-grabbed stream — let SpeechAnalyzer delay and grab its own
            );
        }

        // Mount waveform after speech analyser started (so analyser exists)
        setTimeout(() => {
            this.waveform.mount('waveform-container', speechAnalyzer.analyser || null);
        }, 800);

        // Mount coach
        this.coach.mount();

        // Coach evaluation every 3s
        this._coachInterval = setInterval(() => {
            if (!this.isMicPaused) {
                this.coach.evaluate(this._lastSpeechMetrics, this._lastFaceMetrics);

                // ── Engine UX signals (Step 5 + 7) ──
                const engineOut = liveEvaluatorEngine.getOutput();
                this.metricsPanel.updateEngineOutput(engineOut);

                // Route BEEP signal to coach
                if (engineOut.UI_Feedback?.Eye_Contact_Alert === 'BEEP') {
                    this.coach.triggerBeep();
                }

                // Route color pulse directly (engine already applied it inside updateEngineOutput)
                // but also route pause state to engine
                liveEvaluatorEngine.setSpeakingState(
                    (this._lastSpeechMetrics?.currentWpm > 0) ? 'speaking' : 'paused'
                );
            }
        }, 3000);

        this._startTimer();

        document.getElementById('mic-toggle-btn')?.addEventListener('click', () => this._toggleMicPause());
        document.getElementById('next-question-btn')?.addEventListener('click', () => this._nextQuestion());
        document.getElementById('end-session-btn')?.addEventListener('click', () => this._showEndModal());
        document.getElementById('cancel-end-btn')?.addEventListener('click', () => this._hideEndModal());
        document.getElementById('confirm-end-btn')?.addEventListener('click', () => this._endSession());

        this._keyHandler = (e) => {
            if (e.key === 'Enter' && e.ctrlKey) this._nextQuestion();
            if (e.key === 'Escape') this._showEndModal();
            if (e.key === ' ' && e.ctrlKey) { e.preventDefault(); this._toggleMicPause(); }
        };
        document.addEventListener('keydown', this._keyHandler);
    }

    // ── 3-2-1 Countdown ──
    _showCountdown() {
        return new Promise((resolve) => {
            const overlay = document.getElementById('countdown-overlay');
            const numEl = document.getElementById('countdown-num');
            if (!overlay) { resolve(); return; }

            overlay.style.display = 'flex';
            let count = 3;

            const tick = () => {
                if (numEl) {
                    numEl.textContent = count;
                    numEl.style.animation = 'none';
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => { numEl.style.animation = 'countdownPop 0.8s ease-out forwards'; });
                    });
                }
                if (count <= 0) {
                    setTimeout(() => {
                        overlay.style.opacity = '0';
                        setTimeout(() => { overlay.style.display = 'none'; overlay.style.opacity = '1'; resolve(); }, 400);
                    }, 500);
                    return;
                }
                count--;
                setTimeout(tick, 900);
            };
            tick();
        });
    }

    // ── Pause / Resume Mic ──
    _toggleMicPause() {
        const btn = document.getElementById('mic-toggle-btn');
        const statusText = document.getElementById('mic-status-text');
        const warning = document.getElementById('pause-warning');
        const statusBadge = document.getElementById('session-status');

        if (!this.isMicPaused) {
            this.isMicPaused = true;
            this.pauseCount++;
            this.pauseStartTime = Date.now();
            speechAnalyzer.pauseRecognition();
            this.waveform.stop();

            if (btn) btn.innerHTML = '<i data-lucide="mic-off" style="width:16px;height:16px"></i> <span>Resume Mic</span>';
            if (btn) btn.className = 'btn btn-warning mic-toggle-btn';
            if (statusText) statusText.textContent = '⏸ Mic paused — press Resume to continue';
            if (statusBadge) { statusBadge.innerHTML = '⏸ Paused'; statusBadge.className = 'badge badge-warning'; }
            if (this.pauseCount > this.CHEAT_THRESHOLD && warning) {
                warning.style.display = 'inline';
                warning.textContent = `⚠ ${this.pauseCount} pauses — score penalty applied!`;
            }
            if (window.lucide) window.lucide.createIcons();
        } else {
            this.isMicPaused = false;
            this.totalPauseDuration += (Date.now() - this.pauseStartTime) / 1000;
            speechAnalyzer.resumeRecognition();

            // Restart waveform
            setTimeout(() => {
                this.waveform.mount('waveform-container', speechAnalyzer.analyser || null);
            }, 500);

            if (btn) btn.innerHTML = '<i data-lucide="mic" style="width:16px;height:16px"></i> <span>Pause Mic</span>';
            if (btn) btn.className = 'btn btn-primary mic-toggle-btn';
            if (statusText) statusText.textContent = '🎙 Mic active — speak your answer';
            if (statusBadge) { statusBadge.innerHTML = '<span class="recording-dot"></span> Live'; statusBadge.className = 'badge badge-success'; }
            if (window.lucide) window.lucide.createIcons();
        }
    }

    _showCurrentQuestion() {
        const q = questionEngine.getCurrentQuestion();
        if (!q) { this.questionCard.showComplete(); return; }
        this.questionCard.setQuestion(q.q, questionEngine.getQuestionNumber(), questionEngine.getTotalQuestions(), q.type);
        this.isWaitingForAnswer = true;
        this.followUpAsked = false;
        this.currentAnswer = '';
        this.questionTimer = 0;

        // ── Reset relevance for new question ───
        this._currentQuestion = q.q;
        this._currentRelevanceScore = null;
        this.metricsPanel.updateRelevance(null);

        // ── Reset engine for new question ──
        liveEvaluatorEngine.reset();
        this._prevEngineStatus = null;
        this._lastIntervention = 0;
        this._lastProfanityAlert = null;
        this.metricsPanel.updateEngineOutput(liveEvaluatorEngine.getOutput());
        // Reset dominant pill + silence prompt
        const pill = document.getElementById('dominant-status-pill');
        if (pill) pill.className = 'dominant-pill dominant-pill--evaluating';
        const pillLabel = document.getElementById('dominant-pill-label');
        if (pillLabel) pillLabel.textContent = 'Listening...';
        const pillDetail = document.getElementById('dominant-pill-detail');
        if (pillDetail) pillDetail.textContent = '';
        const pillIcon = document.getElementById('dominant-pill-icon');
        if (pillIcon) pillIcon.textContent = '⏳';
        const scoreEl = document.getElementById('lsc-score');
        if (scoreEl) scoreEl.textContent = '—';
        const barEl = document.getElementById('lsw-bar-fill');
        if (barEl) barEl.style.width = '0%';
        this._hideIntervention();
        this._startSilencePrompt?.();
    }

    _nextQuestion() {
        if (this.currentAnswer) {
            const answers = store.get('session.answers') || [];
            const _answerEntry = {
                questionIndex: questionEngine.currentIndex,
                question: questionEngine.getCurrentQuestion()?.q || '',
                answer: this.currentAnswer,
                timestamp: Date.now(),
                duration: this.questionTimer,
                relevanceScore: this._currentRelevanceScore,
                evalResult: this._lastEvalResult || null,
                aiEvalResult: null,  // filled async — falls back to keyword result without API key
            };
            answers.push(_answerEntry);
            store.set('session.answers', answers);

            // ── Background AI evaluation (non-blocking) ──
            // Without API key: aiEvaluate() instantly returns keyword result.
            // With API key: runs async and updates stored answer when complete.
            (() => {
                const _qIdx = answers.length - 1;
                const _q = _answerEntry.question;
                const _a = _answerEntry.answer;
                aiEvaluate(_q, _a).then(aiResult => {
                    const saved = store.get('session.answers') || [];
                    if (saved[_qIdx]) {
                        saved[_qIdx].aiEvalResult = aiResult;
                        store.set('session.answers', saved);
                    }
                }).catch(e => console.warn('[aiEvaluator] _nextQuestion eval failed:', e.message));
            })();

            const wordCount = this.currentAnswer.split(/\s+/).length;
            if (!this.followUpAsked && questionEngine.shouldAskFollowUp(wordCount)) {
                const followUp = questionEngine.getFollowUp();
                if (followUp) {
                    this.questionCard.setFollowUp(followUp);
                    this.followUpAsked = true;
                    this.currentAnswer = '';
                    this.questionTimer = 0;
                    return;
                }
            }
        }

        questionEngine.nextQuestion();
        if (questionEngine.isComplete()) { this._endSession(); return; }

        this._showCurrentQuestion();
        this.transcriptBox.clear();
        speechAnalyzer.metrics.fullTranscript = '';
    }

    _startTimer() {
        this.timerSeconds = 0;
        this.timer = setInterval(() => {
            this.timerSeconds++;
            this.questionTimer++;

            const mins = Math.floor(this.timerSeconds / 60).toString().padStart(2, '0');
            const secs = (this.timerSeconds % 60).toString().padStart(2, '0');
            const timerEl = document.getElementById('timer-display');
            if (timerEl) timerEl.textContent = `${mins}:${secs}`;

            // Per-question timer display
            const qTimerEl = document.getElementById('question-timer-display');
            if (qTimerEl) {
                const qm = Math.floor(this.questionTimer / 60);
                const qs = this.questionTimer % 60;
                qTimerEl.textContent = qm > 0 ? `${qm}m ${qs}s` : `${qs}s`;
            }

            if (this.maxSeconds > 0 && this.timerSeconds >= this.maxSeconds) this._endSession();
        }, 1000);
    }

    _showEndModal() {
        const modal = document.getElementById('end-modal');
        if (modal) modal.style.display = 'flex';
    }

    _hideEndModal() {
        const modal = document.getElementById('end-modal');
        if (modal) modal.style.display = 'none';
    }

    _endSession() {
        if (this.timer) clearInterval(this.timer);
        if (this._coachInterval) clearInterval(this._coachInterval);
        if (this.isMicPaused) this.totalPauseDuration += (Date.now() - this.pauseStartTime) / 1000;

        this.coach.unmount();
        this.waveform.unmount();
        faceAnalyzer.stop();
        speechAnalyzer.stop();
        this.videoFeed.stopCamera();
        if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);

        if (this.currentAnswer) {
            const answers = store.get('session.answers') || [];
            const _finalEntry = {
                questionIndex: questionEngine.currentIndex,
                question: questionEngine.getCurrentQuestion()?.q || '',
                answer: this.currentAnswer,
                timestamp: Date.now(),
                duration: this.questionTimer,
                relevanceScore: this._currentRelevanceScore,
                evalResult: this._lastEvalResult || null,
                aiEvalResult: null,
            };
            answers.push(_finalEntry);
            store.set('session.answers', answers);

            // ── Background AI eval for final answer ──
            (() => {
                const _qIdx = answers.length - 1;
                aiEvaluate(_finalEntry.question, _finalEntry.answer).then(aiResult => {
                    const saved = store.get('session.answers') || [];
                    if (saved[_qIdx]) {
                        saved[_qIdx].aiEvalResult = aiResult;
                        store.set('session.answers', saved);
                    }
                }).catch(e => console.warn('[aiEvaluator] _endSession eval failed:', e.message));
            })();
        }

        const faceMetrics = faceAnalyzer.getAverageMetrics();
        const speechMetrics = speechAnalyzer.getFullMetrics();
        const grammarResult = grammarChecker.analyze(speechMetrics.fullTranscript);
        const pauseData = {
            pauseCount: this.pauseCount,
            totalPauseDuration: Math.round(this.totalPauseDuration),
            isCheating: this.pauseCount > this.CHEAT_THRESHOLD
        };

        store.set('session.endTime', new Date().toISOString());
        store.set('session.faceMetrics', faceMetrics);
        store.set('session.speechMetrics', speechMetrics);
        store.set('session.grammarMetrics', grammarResult);
        store.set('session.pauseData', pauseData);
        store.set('session.active', false);

        store.saveSessionToHistory();
        router.navigate('/report');
    }

    // ── Live Empathy Coach ────────────────────────────────
    _trackNervousness(faceData) {
        if (!this._nervousFrames) this._nervousFrames = 0;
        if (!this._lastCoachTime) this._lastCoachTime = 0;

        const state = faceData?.interviewState?.state || '';
        // FIX: interview states are lowercase (very_nervous, nervous, tense)
        const isNervous = state === 'very_nervous' || state === 'nervous' || state === 'tense';

        if (isNervous) {
            this._nervousFrames++;
        } else {
            this._nervousFrames = Math.max(0, this._nervousFrames - 2); // decay faster
        }

        // Face analyzer runs at ~3fps, so 30 frames ≈ 10 seconds
        const now = Date.now();
        if (this._nervousFrames >= 30 && (now - this._lastCoachTime) > 25000) {
            this._lastCoachTime = now;
            this._nervousFrames = 0;
            this._showEmpathyCoach();
        }
    }

    // ── PROMINENT LIVE EVALUATION BANNER ──────────────────────────────────
    // Renders a big, visible banner in the main session area (not the sidebar)
    // showing real-time status, issue, and suggestion.
    _updateLiveBanner(engineOut) {
        const banner = document.getElementById('live-eval-banner');
        if (!banner) return;
        const status = engineOut?.Status || 'Evaluating...';

        // Hide cleanly while evaluating
        if (status === 'Evaluating...') {
            banner.classList.add('live-eval-hidden');
            return;
        }

        // Colors and labels per status
        const cfg = {
            'Relevant': {
                accent: '#22c55e',
                bg: 'rgba(22,163,74,0.08)',
                border: 'rgba(34,197,94,0.25)',
                icon: 'CHECK',
                label: 'RELEVANT',
            },
            'Partially Relevant': {
                accent: '#f59e0b',
                bg: 'rgba(245,158,11,0.08)',
                border: 'rgba(245,158,11,0.3)',
                icon: 'WARNING',
                label: 'PARTIALLY RELEVANT',
            },
            'Not Relevant': {
                accent: '#ef4444',
                bg: 'rgba(239,68,68,0.08)',
                border: 'rgba(239,68,68,0.3)',
                icon: 'STOP',
                label: 'NOT RELEVANT',
            },
        }[status] || { accent:'#94a3b8', bg:'transparent', border:'transparent', icon:'...', label: status.toUpperCase() };

        const reason    = engineOut.Reason || '';
        const topIssue  = (engineOut.Issues || [])[0] || '';
        const suggest   = engineOut.Suggestion || '';
        const prof      = engineOut.Profanity_Detected
            ? '<span class="leb-pill" style="background:rgba(239,68,68,0.12);color:#ef4444;border-color:rgba(239,68,68,0.3)">UNPROFESSIONAL LANGUAGE</span>'
            : '';
        const grammar   = engineOut.Grammar && engineOut.Grammar !== 'Evaluating...'
            ? `<span class="leb-pill" style="color:${engineOut.Grammar==='Good'?'#22c55e':engineOut.Grammar==='Poor'?'#ef4444':'#f59e0b'};background:${engineOut.Grammar==='Good'?'rgba(34,197,94,0.1)':engineOut.Grammar==='Poor'?'rgba(239,68,68,0.1)':'rgba(245,158,11,0.1)'};border-color:transparent">GRAMMAR: ${engineOut.Grammar.toUpperCase()}</span>`
            : '';
        const complete  = engineOut.Completeness && engineOut.Completeness !== 'Evaluating...'
            ? `<span class="leb-pill" style="color:${engineOut.Completeness==='Complete'?'#22c55e':'#f59e0b'};background:${engineOut.Completeness==='Complete'?'rgba(34,197,94,0.1)':'rgba(245,158,11,0.1)'};border-color:transparent">${engineOut.Completeness.toUpperCase()}</span>`
            : '';

        banner.className = 'live-eval-banner live-eval-visible';
        banner.style.background    = cfg.bg;
        banner.style.borderColor   = cfg.border;
        banner.innerHTML = `
            <div class="leb-left" style="border-color:${cfg.accent}">
                <div class="leb-icon" style="color:${cfg.accent}">${cfg.icon}</div>
            </div>
            <div class="leb-body">
                <div class="leb-top">
                    <span class="leb-status" style="color:${cfg.accent}">${cfg.label}</span>
                    <div class="leb-pills">${prof}${grammar}${complete}</div>
                </div>
                ${reason ? `<div class="leb-reason">${reason}</div>` : ''}
                ${topIssue ? `<div class="leb-issue">Issue: ${topIssue}</div>` : ''}
            </div>
            ${suggest ? `<div class="leb-suggest"><div class="leb-suggest-label">SUGGESTION</div><div class="leb-suggest-text">${suggest}</div></div>` : ''}
        `;
    }

    _showEmpathyCoach() {
        const tips = [
            { icon: '🌬️', text: 'Take a slow breath. Breathe in for 4 seconds, hold 4, breathe out for 6. You\'ve got this.' },
            { icon: '💪', text: 'Nervousness means you care — that\'s a strength. Slow down a little and trust yourself.' },
            { icon: '🎯', text: 'Focus on one sentence at a time. You don\'t need to say everything perfectly.' },
            { icon: '😊', text: 'Relax your jaw and shoulders. You\'re doing better than you think!' },
            { icon: '⏸️', text: 'A short pause before answering shows confidence, not weakness. Take your time.' },
        ];
        const tip = tips[Math.floor(Math.random() * tips.length)];

        // Remove existing toast
        document.getElementById('empathy-coach-toast')?.remove();

        const toast = document.createElement('div');
        toast.id = 'empathy-coach-toast';
        toast.className = 'empathy-coach-toast';
        toast.innerHTML = `
            <span class="empathy-coach-icon">${tip.icon}</span>
            <span class="empathy-coach-text">${tip.text}</span>
        `;
        document.body.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            requestAnimationFrame(() => toast.classList.add('visible'));
        });

        // Auto-hide after 6 seconds
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 500);
        }, 6000);
    }

    // ── INTERVENTION OVERLAY ──────────────────────────────────────────
    // Fires when answer is Not Relevant (40+ words) or profanity is detected.
    // Blocks the screen and pauses the mic until the user acknowledges.
    _triggerIntervention(type, wordCount) {
        const now = Date.now();
        if (now - this._lastIntervention < this._INTERVENTION_COOLDOWN) return;
        if (document.getElementById('intervention-overlay')) return; // already showing
        this._lastIntervention = now;
        this._showIntervention(type);
    }

    _showIntervention(type) {
        // Pause mic during intervention
        const wasPaused = this.isMicPaused;
        if (!wasPaused) {
            import('../modules/speechAnalyzer.js').then(({ speechAnalyzer }) => {
                speechAnalyzer.pauseRecognition?.();
            });
        }

        // Build message content based on type
        const isProfanity = type === 'profanity';
        const headline    = isProfanity
            ? 'UNPROFESSIONAL LANGUAGE DETECTED'
            : 'YOUR ANSWER IS NOT RELEVANT';
        const body        = isProfanity
            ? 'You used unprofessional or abusive language. This is a professional interview environment. Please eliminate all slang and profanity and answer the question clearly and respectfully.'
            : 'Your answer is not addressing the question asked. Stop and refocus. Listen to the question again and respond with a clear, on-topic answer using the STAR method if it is a behavioural question.';
        const question    = this._currentQuestion || '';
        const accent      = isProfanity ? '#ef4444' : '#f59e0b';

        const overlay = document.createElement('div');
        overlay.id = 'intervention-overlay';
        overlay.className = 'intervention-overlay';
        overlay.innerHTML = `
            <div class="intervention-card">
                <div class="intervention-bar" style="background:${accent}"></div>
                <div class="intervention-icon" style="color:${accent}">
                    ${isProfanity ? '⚠' : '✕'}
                </div>
                <div class="intervention-headline" style="color:${accent}">${headline}</div>
                <div class="intervention-body">${body}</div>
                ${question ? `
                <div class="intervention-question-box">
                    <div class="intervention-question-label">REMEMBER THE QUESTION</div>
                    <div class="intervention-question-text">${question}</div>
                </div>` : ''}
                <div class="intervention-hints">
                    ${isProfanity
                        ? '<div class="intervention-hint">- Keep all language formal and professional</div><div class="intervention-hint">- Replace slang with precise, professional vocabulary</div><div class="intervention-hint">- Breathe, reset, and continue calmly</div>'
                        : '<div class="intervention-hint">- Re-read the question above carefully</div><div class="intervention-hint">- Use STAR method: Situation, Task, Action, Result</div><div class="intervention-hint">- Stay specific and on-topic — no generic answers</div>'
                    }
                </div>
                <button class="intervention-btn" id="intervention-dismiss-btn">
                    Got it — I will speak better
                </button>
            </div>
        `;
        document.body.appendChild(overlay);

        // Fade in
        requestAnimationFrame(() => {
            requestAnimationFrame(() => overlay.classList.add('visible'));
        });

        // Dismiss button
        document.getElementById('intervention-dismiss-btn')?.addEventListener('click', () => {
            this._hideIntervention();
            // Resume mic
            if (!wasPaused) {
                import('../modules/speechAnalyzer.js').then(({ speechAnalyzer }) => {
                    speechAnalyzer.resumeRecognition?.();
                });
            }
        });
    }

    _hideIntervention() {
        const overlay = document.getElementById('intervention-overlay');
        if (!overlay) return;
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 400);
    }

    // ── DOMINANT STATUS PILL — top of session, color-coded, instant ──
    _updateDominantPill(engineOut) {
        const pill   = document.getElementById('dominant-status-pill');
        const icon   = document.getElementById('dominant-pill-icon');
        const label  = document.getElementById('dominant-pill-label');
        const detail = document.getElementById('dominant-pill-detail');
        if (!pill || !icon || !label) return;

        const status = engineOut?.Status || 'Evaluating...';
        const reason = engineOut?.Reason  || '';
        const issue  = (engineOut?.Issues || [])[0] || '';

        pill.className = 'dominant-pill';
        if (status === 'Relevant') {
            pill.classList.add('dominant-pill--relevant');
            icon.textContent  = '✅';
            label.textContent = 'RELEVANT';
        } else if (status === 'Partially Relevant') {
            pill.classList.add('dominant-pill--partial');
            icon.textContent  = '⚠️';
            label.textContent = 'PARTIALLY RELEVANT';
        } else if (status === 'Not Relevant') {
            pill.classList.add('dominant-pill--notrelevant');
            icon.textContent  = '❌';
            label.textContent = 'OFF TOPIC — REFOCUS';
        } else {
            pill.classList.add('dominant-pill--evaluating');
            icon.textContent  = '⏳';
            label.textContent = 'Listening...';
        }
        detail.textContent = issue || reason || '';
    }

    // ── LIVE SCORE — writes to the professional scorecard strip ──
    _updateLiveScore(engineOut) {
        const scoreEl = document.getElementById('lsc-score');
        const barEl   = document.getElementById('lsc-score-bar');
        if (!scoreEl) return;

        const evalResult = engineOut?._lastEvalResult;
        if (!evalResult) return;

        const score = Math.round(evalResult._score100 || 0);
        scoreEl.textContent = score + '/100';
        scoreEl.style.color = score >= 75 ? '#4ade80' : score >= 45 ? '#fbbf24' : '#f87171';
        if (barEl) {
            barEl.style.width = score + '%';
            barEl.style.background = score >= 75 ? '#22c55e' : score >= 45 ? '#f59e0b' : '#ef4444';
        }
    }

    // ── WEBCAM COACH BUBBLE — overlaid on video, rotates tips ──
    _showWebcamCoach(tip) {
        const bubble = document.getElementById('webcam-coach-bubble');
        const text   = document.getElementById('webcam-coach-text');
        if (!bubble || !text || !tip) return;
        text.textContent = tip;
        bubble.classList.remove('webcam-coach-hidden');
        clearTimeout(this._webcamCoachTimer);
        this._webcamCoachTimer = setTimeout(() => {
            bubble.classList.add('webcam-coach-hidden');
        }, 7000);
    }

    // ── LIVE BANNER (kept for compatibility) ────────────────────────
    _updateLiveBanner(engineOut) {
        this._updateDominantPill(engineOut);
        this._updateLiveScore(engineOut);
        // Show top issue as webcam coach bubble
        const tip = (engineOut?.Issues || [])[0] || engineOut?.Suggestion || null;
        if (tip) this._showWebcamCoach('💡 ' + tip);
    }

    // ── SILENCE PROMPT — appears after 5s without speech ────────────
    _startSilencePrompt() {
        clearTimeout(this._silenceTimer);
        this._silenceTimer = setTimeout(() => {
            const bubble = document.getElementById('webcam-coach-bubble');
            const text   = document.getElementById('webcam-coach-text');
            if (bubble && text && !this.isMicPaused) {
                text.textContent = '🎙️ Ready? Start speaking — I\'m listening...';
                bubble.classList.remove('webcam-coach-hidden');
            }
        }, 5000);
    }
}

