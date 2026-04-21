// ========================================
// Speakease — Question Card (with AI TTS Voice)
// ========================================

export class QuestionCard {
    constructor() {
        this.container = null;
        this.isTyping = false;
        this._ttsEnabled = true;   // AI voice on by default
        this._currentUtterance = null;
    }

    render() {
        const el = document.createElement('div');
        el.className = 'question-card glass-panel-strong';
        el.innerHTML = `
      <div class="question-card-header">
        <div class="flex items-center gap-2">
          <div class="ai-avatar">
            <i data-lucide="bot" style="width:20px;height:20px;color:white"></i>
          </div>
          <div>
            <span class="font-semibold text-sm">AI Interviewer</span>
            <span class="badge badge-primary text-xs" id="question-type-badge" style="margin-left:8px">Mixed</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button id="tts-toggle-btn" class="tts-toggle-btn tts-on" title="Toggle AI voice">
            🔊 Voice On
          </button>
          <span class="text-xs text-muted" id="question-counter">Q1 of 10</span>
        </div>
      </div>
      <div class="question-card-body">
        <p class="question-text" id="question-text">Preparing your interview...</p>
      </div>
      <div class="question-card-hear-again">
        <button id="hear-again-btn" class="hear-again-btn">
          🔊 Hear Question Again
        </button>
      </div>
      <div class="question-card-footer">
        <div class="question-progress">
          <div class="meter meter-sm meter-primary">
            <div class="meter-fill" id="question-progress-fill" style="width:0%"></div>
          </div>
        </div>
      </div>
    `;
        this.container = el;

        // Wire TTS toggle
        el.querySelector('#tts-toggle-btn')?.addEventListener('click', () => this._toggleTts());
        el.querySelector('#tts-replay-btn')?.addEventListener('click', () => {
            const text = document.getElementById('question-text')?.textContent;
            if (text) this._speak(text);
        });

        return el;
    }

    setQuestion(text, number, total, type) {
        const textEl = document.getElementById('question-text');
        const counter = document.getElementById('question-counter');
        const badge = document.getElementById('question-type-badge');
        const progress = document.getElementById('question-progress-fill');

        if (counter) counter.textContent = `Q${number} of ${total}`;
        if (badge) {
            const labels = { technical: '💻 Technical', behavioral: '🎯 Behavioral', hr: '👔 HR' };
            badge.textContent = labels[type] || type || 'Mixed';
        }
        if (progress) progress.style.width = ((number / total) * 100) + '%';

        // Stop any previous speech
        this._stopSpeech();

        // Typing animation + TTS after short delay
        if (textEl) {
            textEl.textContent = '';
            this._typeText(textEl, text).then(() => {
                // Speak after typing completes (500ms buffer)
                setTimeout(() => this._speak(text), 500);
            });
        }
    }

    async _typeText(el, text, speed = 22) {
        this.isTyping = true;
        el.textContent = '';
        for (let i = 0; i < text.length; i++) {
            if (!this.isTyping) { el.textContent = text; return; }
            el.textContent += text[i];
            await new Promise(r => setTimeout(r, speed));
        }
        this.isTyping = false;
    }

    setFollowUp(text) {
        const textEl = document.getElementById('question-text');
        if (textEl) {
            this._stopSpeech();
            textEl.textContent = '';
            this._typeText(textEl, '↪ Follow-up: ' + text).then(() => {
                setTimeout(() => this._speak(text), 500);
            });
        }
    }

    showComplete() {
        this._stopSpeech();
        const textEl = document.getElementById('question-text');
        if (textEl) textEl.innerHTML = '<span class="gradient-text font-bold">✨ Interview Complete! Great job!</span>';
        const progress = document.getElementById('question-progress-fill');
        if (progress) progress.style.width = '100%';
        this._speak('Interview complete. Great job! Check your report for detailed feedback.');
    }

    // ── TTS helpers ──────────────────────────────────────
    _speak(text) {
        if (!this._ttsEnabled) return;
        if (!window.speechSynthesis) return;

        this._stopSpeech();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate  = 0.92;    // slightly slower = more authoritative
        utterance.pitch = 1.0;
        utterance.volume = 0.95;

        // Pick a professional voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v =>
            v.name.includes('Google UK English Male') ||
            v.name.includes('Microsoft David') ||
            v.name.includes('Daniel') ||
            v.lang === 'en-GB'
        );
        if (preferred) utterance.voice = preferred;

        this._currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
    }

    _stopSpeech() {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        this._currentUtterance = null;
    }

    _toggleTts() {
        this._ttsEnabled = !this._ttsEnabled;
        const btn = document.getElementById('tts-toggle-btn');
        if (btn) {
            if (this._ttsEnabled) {
                btn.textContent = '🔊 Voice On';
                btn.className = 'tts-toggle-btn tts-on';
            } else {
                this._stopSpeech();
                btn.textContent = '🔇 Voice Off';
                btn.className = 'tts-toggle-btn tts-off';
            }
        }
    }
}
