// ========================================
// Speakease — Metrics Panel v3 (Live Indicator + Real-Time Evaluator Status)
// ========================================

export class MetricsPanel {
  render() {
    const el = document.createElement('div');
    el.className = 'metrics-panel';
    el.innerHTML = `
      <!-- ── REAL-TIME EVALUATOR STATUS CHIP ── -->
      <div class="rt-status-bar" id="rt-status-bar">
        <span class="rt-status-icon" id="rt-status-icon">⏳</span>
        <span class="rt-status-label" id="rt-status-label">Evaluating...</span>
        <span class="rt-status-type" id="rt-status-type"></span>
      </div>

      <!-- ── EMOTION STATUS ROW ── -->
      <div class="emotion-status-row" id="emotion-status-row">
        <span class="emotion-status-dot" id="emotion-status-dot" style="background:#64748b"></span>
        <span class="emotion-status-text" id="emotion-status-text" style="color:var(--color-text-tertiary)">Emotion: Waiting...</span>
      </div>

      <!-- ── LIVE STATUS INDICATOR (🟢🟡🔴) ── -->
      <div class="live-indicator-bar" id="live-indicator-bar">
        <span class="live-indicator-dot" id="live-indicator-dot"></span>
        <span class="live-indicator-label" id="live-indicator-label">🟢 Initializing...</span>
      </div>

      <!-- ── EMOTION STATE BOX (top of sidebar) ── -->
      <div class="emotion-state-box" id="emotion-state-box">
        <div class="emotion-state-header">
          <span class="emotion-state-dot" id="emotion-dot"></span>
          <span class="emotion-state-label text-xs font-semibold uppercase tracking-wide" style="color:var(--color-text-tertiary)">Emotional State</span>
        </div>
        <div class="emotion-state-main">
          <span class="emotion-state-emoji" id="emotion-emoji">🎯</span>
          <div class="emotion-state-info">
            <div class="emotion-state-name" id="emotion-name">Waiting...</div>
            <div class="emotion-state-desc" id="emotion-desc">Camera will analyze your state</div>
          </div>
        </div>
        <div class="emotion-state-tip" id="emotion-tip"></div>
      </div>

      <!-- ── DATASET EMOTION LABEL (from datasets.js mapping) ── -->
      <div class="dataset-emotion-row" id="dataset-emotion-row" style="display:none">
        <span class="dataset-emotion-emoji" id="dataset-emotion-emoji"></span>
        <div style="flex:1;min-width:0">
          <div class="dataset-emotion-label" id="dataset-emotion-label"></div>
          <div class="dataset-emotion-tip" id="dataset-emotion-tip"></div>
        </div>
        <div class="dataset-confidence-score" id="dataset-confidence-score"></div>
      </div>

      <div class="metrics-divider"></div>

      <!-- ── METRICS TITLE ── -->
      <div class="metrics-title">
        <i data-lucide="activity" style="width:14px;height:14px;color:var(--color-accent-primary)"></i>
        <span class="font-semibold text-sm">Live Metrics</span>
      </div>

      <!-- Confidence with live ring meter -->
      <div class="metric-item">
        <div class="metric-label">
          <i data-lucide="shield-check" style="width:13px;height:13px"></i>
          <span>Confidence</span>
        </div>
        <div class="metric-bar-wrap">
          <div class="meter meter-sm"><div class="meter-fill" id="confidence-fill" style="width:0%;background:linear-gradient(90deg,#22c55e,#4ade80)"></div></div>
          <span class="metric-value" id="confidence-value">0%</span>
        </div>
      </div>

      <!-- Nervousness -->
      <div class="metric-item">
        <div class="metric-label">
          <i data-lucide="alert-triangle" style="width:13px;height:13px"></i>
          <span>Nervousness</span>
        </div>
        <div class="metric-bar-wrap">
          <div class="meter meter-sm"><div class="meter-fill" id="nervousness-fill" style="width:0%;background:linear-gradient(90deg,#f97316,#ef4444)"></div></div>
          <span class="metric-value" id="nervousness-value">0%</span>
        </div>
      </div>

      <!-- Eye Contact -->
      <div class="metric-item">
        <div class="metric-label">
          <i data-lucide="eye" style="width:13px;height:13px"></i>
          <span>Eye Contact</span>
        </div>
        <div class="metric-bar-wrap">
          <div class="meter meter-sm"><div class="meter-fill" id="eyecontact-fill" style="width:0%;background:linear-gradient(90deg,#6395ff,#a78bfa)"></div></div>
          <span class="metric-value" id="eyecontact-value">0%</span>
        </div>
      </div>

      <!-- Answer Relevance -->
      <div class="metric-item" id="relevance-metric-item">
        <div class="metric-label">
          <i data-lucide="target" style="width:13px;height:13px"></i>
          <span>Answer Relevance</span>
        </div>
        <div class="metric-bar-wrap">
          <div class="meter meter-sm"><div class="meter-fill" id="relevance-fill" style="width:0%;background:linear-gradient(90deg,#a855f7,#6395ff)"></div></div>
          <span class="metric-value" id="relevance-value">—</span>
        </div>
      </div>

      <div class="metrics-divider"></div>

      <!-- WPM with pace label -->
      <div class="metric-item">
        <div class="metric-label">
          <i data-lucide="gauge" style="width:13px;height:13px"></i>
          <span>Speaking Speed</span>
        </div>
        <div class="metric-bar-wrap">
          <span class="metric-value metric-value-lg" id="wpm-value" style="font-size:1.2rem;font-weight:700">0</span>
          <span class="metric-value text-xs" style="color:var(--color-text-tertiary);margin-left:2px">WPM</span>
          <span class="pace-badge" id="pace-badge"></span>
        </div>
      </div>

      <!-- Filler + Hesitations -->
      <div class="metric-item">
        <div class="metric-label">
          <i data-lucide="message-circle" style="width:13px;height:13px"></i>
          <span>Fillers / Hesitations</span>
        </div>
        <span class="metric-value metric-value-lg" id="filler-value" style="color:var(--color-warning);font-weight:700">0</span>
      </div>

      <!-- Clarity -->
      <div class="metric-item">
        <div class="metric-label">
          <i data-lucide="type" style="width:13px;height:13px"></i>
          <span>Speech Clarity</span>
        </div>
        <div class="metric-bar-wrap">
          <div class="meter meter-sm"><div class="meter-fill" id="clarity-fill" style="width:0%;background:linear-gradient(90deg,#38bdf8,#6395ff)"></div></div>
          <span class="metric-value" id="clarity-value">0%</span>
        </div>
      </div>

      <!-- Head Stability -->
      <div class="metric-item">
        <div class="metric-label">
          <i data-lucide="move" style="width:13px;height:13px"></i>
          <span>Head Stability</span>
        </div>
        <div class="metric-bar-wrap">
          <div class="meter meter-sm"><div class="meter-fill" id="headstability-fill" style="width:80%;background:linear-gradient(90deg,#a78bfa,#6395ff)"></div></div>
          <span class="metric-value" id="headstability-value">80%</span>
        </div>
      </div>
    `;
    return el;
  }

  // Called by SessionPage when face data arrives
  updateFace(data) {
    this._setBar('confidence', data.confidence || 0);
    this._setBar('nervousness', data.nervousness || 0);
    this._setBar('eyecontact', data.eyeContact || 0);
    this._setBar('headstability', data.headStability ?? 80);

    // ── Update live scorecard strip ──
    const eyeEl = document.getElementById('lsc-eye');
    const eyeBar = document.getElementById('lsc-eye-bar');
    const emotionEl = document.getElementById('lsc-emotion');
    const eyePct = data.eyeContact || 0;
    if (eyeEl) {
      eyeEl.textContent = eyePct + '%';
      eyeEl.style.color = eyePct >= 65 ? '#4ade80' : eyePct >= 35 ? '#fbbf24' : '#f87171';
    }
    if (eyeBar) {
      eyeBar.style.width = eyePct + '%';
      eyeBar.style.background = eyePct >= 65 ? '#22c55e' : eyePct >= 35 ? '#f59e0b' : '#ef4444';
    }
    if (emotionEl && data.emotionState) {
      const lbl = data.emotionState.label || 'Stable';
      const clr = data.emotionState.color || '#94a3b8';
      const ico = data.emotionState.emoji || '';
      emotionEl.textContent = `${ico} ${lbl}`;
      emotionEl.style.color = clr;
    } else if (emotionEl && !data.faceDetected) {
      emotionEl.textContent = '📷 No Face';
      emotionEl.style.color = '#64748b';
    }

    // Update interview state emotion box
    if (data.interviewState) {
      this._updateEmotionBox(data.interviewState);
    }

    // Update dataset-driven emotion label (from EMOTION_STATE_MAP)
    if (data.emotionState) {
      this._updateDatasetEmotion(data.emotionState);
    }
  }

  // Called by SessionPage when speech data arrives
  updateSpeech(data) {
    const wpmEl = document.getElementById('wpm-value');
    const fillerEl = document.getElementById('filler-value');
    const clarityFill = document.getElementById('clarity-fill');
    const clarityVal = document.getElementById('clarity-value');
    const paceBadge = document.getElementById('pace-badge');

    const wpm = data.currentWpm || 0;
    if (wpmEl) wpmEl.textContent = wpm;
    if (fillerEl) fillerEl.textContent = (data.fillerCount || 0) + (data.hesitationCount ? ` +${data.hesitationCount}` : '');
    if (clarityFill) clarityFill.style.width = (data.clarityScore || 0) + '%';
    if (clarityVal) clarityVal.textContent = (data.clarityScore || 0) + '%';

    if (paceBadge) {
      if (wpm === 0) {
        paceBadge.textContent = '';
        paceBadge.className = 'pace-badge';
      } else if (wpm > 220) {
        paceBadge.textContent = 'Too Fast';
        paceBadge.className = 'pace-badge pace-fast';
      } else if (wpm > 160) {
        paceBadge.textContent = 'Fast';
        paceBadge.className = 'pace-badge pace-warning';
      } else if (wpm < 60 && wpm > 0) {
        paceBadge.textContent = 'Too Slow';
        paceBadge.className = 'pace-badge pace-slow';
      } else {
        paceBadge.textContent = 'Good Pace';
        paceBadge.className = 'pace-badge pace-good';
      }
    }
  }

  // Update answer relevance meter (0-100 or null to hide)
  updateRelevance(score) {
    const fill = document.getElementById('relevance-fill');
    const val = document.getElementById('relevance-value');
    if (fill && val) {
      if (score === null || score === undefined) {
        val.textContent = '—';
        fill.style.width = '0%';
        return;
      }
      fill.style.width = score + '%';
      val.textContent = score + '%';
      // Color based on relevance level
      if (score >= 60) {
        fill.style.background = 'linear-gradient(90deg,#22c55e,#4ade80)';
        val.style.color = '#22c55e';
      } else if (score >= 30) {
        fill.style.background = 'linear-gradient(90deg,#f59e0b,#fbbf24)';
        val.style.color = '#f59e0b';
      } else {
        fill.style.background = 'linear-gradient(90deg,#ef4444,#f97316)';
        val.style.color = '#ef4444';
      }
    }
  }

  // ── LIVE EVALUATION panel (spec output format) ────────────────
  updateEngineOutput(output) {
    if (!output) return;
    this._updateStatusChip(output.Status, output.Answer_Type, output.Confidence);
    this._updateEmotionStatus(output.Emotion_Status);
    this._renderLiveEval(output);
  }

  // ── Render the full LIVE EVALUATION block ───────────────────────
  _renderLiveEval(o) {
    let panel = document.getElementById('live-eval-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'live-eval-panel';
      panel.className = 'live-eval-panel';
      const statusBar = document.getElementById('rt-status-bar');
      if (statusBar?.parentNode) {
        statusBar.parentNode.insertBefore(panel, statusBar.nextSibling);
      }
    }

    const relColor = o.Relevance === 'Relevant' ? '#22c55e'
      : o.Relevance === 'Partially Relevant' ? '#f59e0b'
        : o.Relevance === 'Not Relevant' ? '#ef4444' : '#94a3b8';
    const relTag = (o.Relevance || 'Evaluating...').toUpperCase();

    const profCol = o.Profanity_Detected ? '#ef4444' : '#22c55e';
    const profLbl = o.Profanity_Detected
      ? 'WARNING — Unprofessional Language'
      : (o.Professionalism?.includes('Caution') ? 'Caution — Informal' : 'Professional');

    const gramCol = o.Grammar === 'Good' ? '#22c55e'
      : o.Grammar === 'Needs Improvement' ? '#f59e0b'
        : o.Grammar === 'Poor' ? '#ef4444' : '#94a3b8';

    const compCol = o.Completeness === 'Complete' ? '#22c55e' : '#f59e0b';

    const issuesHtml = (o.Issues || []).length > 0
      ? (o.Issues).map(i => `<div class="lep-issue">- ${i}</div>`).join('')
      : '<div class="lep-issue lep-issue-none">No issues detected</div>';

    panel.innerHTML = `
      <div class="lep-title">LIVE EVALUATION</div>

      <div class="lep-row">
        <span class="lep-row-label">Relevance</span>
        <span class="lep-tag" style="color:${relColor};border-color:${relColor}40;background:${relColor}12">${relTag}</span>
      </div>
      ${o.Reason ? `<div class="lep-reason">${o.Reason}</div>` : ''}

      <div class="lep-divider"></div>

      <div class="lep-row">
        <span class="lep-row-label">Professionalism</span>
        <span class="lep-tag" style="color:${profCol};border-color:${profCol}40;background:${profCol}12">${profLbl}</span>
      </div>
      <div class="lep-row">
        <span class="lep-row-label">Grammar</span>
        <span class="lep-tag" style="color:${gramCol};border-color:${gramCol}40;background:${gramCol}12">${o.Grammar || 'Evaluating...'}</span>
      </div>
      <div class="lep-row">
        <span class="lep-row-label">Completeness</span>
        <span class="lep-tag" style="color:${compCol};border-color:${compCol}40;background:${compCol}12">${o.Completeness || 'Evaluating...'}</span>
      </div>

      <div class="lep-divider"></div>

      <div class="lep-issues-title">Issues Detected</div>
      <div class="lep-issues">${issuesHtml}</div>

      ${o.Suggestion ? `
      <div class="lep-divider"></div>
      <div class="lep-suggestion-title">Improvement Suggestion</div>
      <div class="lep-suggestion">${o.Suggestion}</div>` : ''}
    `;
  }

  // ── Status chip (top of panel) ───────────────────────────────────────
  _updateStatusChip(status, answerType) {
    const bar = document.getElementById('rt-status-bar');
    const icon = document.getElementById('rt-status-icon');
    const label = document.getElementById('rt-status-label');
    const type = document.getElementById('rt-status-type');
    if (!bar || !label) return;

    let color, bg, borderColor, chipText;
    switch (status) {
      case 'Relevant':
        color = '#22c55e'; bg = 'rgba(34,197,94,0.1)'; borderColor = 'rgba(34,197,94,0.3)';
        chipText = 'RELEVANT';
        break;
      case 'Partially Relevant':
        color = '#f59e0b'; bg = 'rgba(245,158,11,0.1)'; borderColor = 'rgba(245,158,11,0.25)';
        chipText = 'PARTIAL';
        break;
      case 'Not Relevant':
        color = '#ef4444'; bg = 'rgba(239,68,68,0.1)'; borderColor = 'rgba(239,68,68,0.3)';
        chipText = 'NOT RELEVANT';
        break;
      default:
        color = '#f59e0b'; bg = 'rgba(245,158,11,0.08)'; borderColor = 'rgba(245,158,11,0.2)';
        chipText = '...';
    }
    bar.style.background = bg;
    bar.style.borderColor = borderColor;
    if (icon) { icon.textContent = chipText; icon.style.cssText = `color:${color};font-size:9px;font-weight:800;letter-spacing:.05em`; }
    label.textContent = status;
    label.style.color = color;
    if (type) type.textContent = answerType && answerType !== 'Unknown' ? answerType : '';
  }

  // ── Emotion Status row ────────────────────────────────────────────
  _updateEmotionStatus(emotionStatus) {
    const dot = document.getElementById('emotion-status-dot');
    const text = document.getElementById('emotion-status-text');
    if (!dot || !text) return;

    if (emotionStatus === 'Active') {
      dot.style.background = '#22c55e';
      dot.style.boxShadow = '0 0 6px #22c55e';
      text.textContent = 'Emotion: Active';
      text.style.color = '#22c55e';
    } else {
      dot.style.background = '#64748b';
      dot.style.boxShadow = 'none';
      text.textContent = 'Emotion: Not Detected';
      text.style.color = 'var(--color-text-tertiary)';
    }
  }

  // ── UX Pulse Signals (FULL-SCREEN flash overlay) ─────────────────
  // GREEN_PULSE = full screen flashes green for ~600ms
  // RED_PULSE   = full screen flashes red for ~600ms
  // YELLOW_HINT = full screen flashes yellow for ~500ms
  applyPulse(colorSignal) {
    this._applyUxPulse(colorSignal);
  }

  _applyUxPulse(colorSignal) {
    if (!colorSignal || colorSignal === 'NONE') return;

    const pulseMap = {
      GREEN_PULSE: { color: 'rgba(34, 197, 94, 0.22)', duration: 650 },
      RED_PULSE: { color: 'rgba(239, 68, 68, 0.20)', duration: 650 },
      YELLOW_HINT: { color: 'rgba(245, 158, 11, 0.18)', duration: 500 },
    };
    const cfg = pulseMap[colorSignal];
    if (!cfg) return;

    // Remove any existing flash overlay to avoid stacking
    const existing = document.getElementById('ux-screen-flash');
    if (existing) existing.remove();

    // Create a full-screen overlay
    const overlay = document.createElement('div');
    overlay.id = 'ux-screen-flash';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 99990;
      background: ${cfg.color};
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.12s ease;
    `;
    document.body.appendChild(overlay);

    // Flash in, then fade out
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        setTimeout(() => {
          overlay.style.opacity = '0';
          overlay.style.transition = 'opacity 0.4s ease';
          setTimeout(() => overlay.remove(), 420);
        }, cfg.duration);
      });
    });
  }


  // ── Update the interview state emotion box ────────────────────
  _updateEmotionBox(state) {
    const box = document.getElementById('emotion-state-box');
    const dot = document.getElementById('emotion-dot');
    const emoji = document.getElementById('emotion-emoji');
    const name = document.getElementById('emotion-name');
    const desc = document.getElementById('emotion-desc');
    const tip = document.getElementById('emotion-tip');

    if (!box) return;

    box.style.borderColor = state.color;
    box.style.boxShadow = `0 0 16px ${state.color}30, inset 0 0 20px ${state.color}08`;

    if (dot) { dot.style.background = state.color; dot.style.boxShadow = `0 0 6px ${state.color}`; }
    if (emoji) {
      emoji.style.transform = 'scale(1.3)';
      emoji.textContent = state.emoji;
      setTimeout(() => { emoji.style.transform = 'scale(1)'; }, 200);
    }
    if (name) { name.textContent = state.label; name.style.color = state.color; }
    if (desc) desc.textContent = state.description;
    if (tip && state.tip) { tip.style.display = 'block'; tip.textContent = `💡 ${state.tip}`; }
  }

  // ── Update dataset-driven emotion label row ──────────────────
  _updateDatasetEmotion(emotionState) {
    const row = document.getElementById('dataset-emotion-row');
    const emojiEl = document.getElementById('dataset-emotion-emoji');
    const labelEl = document.getElementById('dataset-emotion-label');
    const tipEl = document.getElementById('dataset-emotion-tip');
    const scoreEl = document.getElementById('dataset-confidence-score');

    if (!row) return;
    row.style.display = 'flex';
    if (emojiEl) emojiEl.textContent = emotionState.emoji || '';
    if (labelEl) { labelEl.textContent = emotionState.label || ''; labelEl.style.color = emotionState.color || '#fff'; }
    if (tipEl) tipEl.textContent = emotionState.tip || '';
    if (scoreEl) {
      scoreEl.textContent = (emotionState.confidenceScore || 0) + '';
      scoreEl.style.color = emotionState.color || '#fff';
    }
  }

  _setBar(id, value) {
    const fill = document.getElementById(id + '-fill');
    const val = document.getElementById(id + '-value');
    if (fill) fill.style.width = value + '%';
    if (val) val.textContent = value + '%';
  }
}
