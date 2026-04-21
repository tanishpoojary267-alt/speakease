// ========================================
// Speakease AI — Report Page (Empathy Edition)
// ========================================

import { router } from '../router.js';
import { store } from '../store.js';
import { reportGenerator } from '../modules/reportGenerator.js';
import { ScoreChart } from '../components/ScoreChart.js';
import { progressTracker, getScoreTier, getEmpathyMessage, getDailyQuote } from '../modules/progressTracker.js';

export class ReportPage {
  constructor() {
    this.charts = new ScoreChart();
    this.report = null;
  }

  render() {
    const faceMetrics = store.get('session.faceMetrics') || {};
    const speechMetrics = store.get('session.speechMetrics') || {};
    const grammarMetrics = store.get('session.grammarMetrics') || {};
    const config = store.get('config') || {};
    const answers = store.get('session.answers') || [];
    const questions = store.get('session.questions') || [];
    const pauseData = store.get('session.pauseData') || {};

    this.report = reportGenerator.generate(
      faceMetrics, speechMetrics, grammarMetrics, config,
      answers.length, questions.length,
      questions, answers, pauseData
    );

    const R = this.report;

    // ── Save to progress tracker ──
    progressTracker.saveSession({
      overall: R.overall,
      confidence: R.confidence,
      communication: R.communication,
      bodyLanguage: R.bodyLanguage,
      grammar: R.grammarScore,
      config,
      timestamp: new Date().toISOString(),
    });

    const tier = getScoreTier(R.overall);
    const sessions = progressTracker.getRecentSessions(5);
    const streak = progressTracker.getStreak();
    const total = progressTracker.getTotalSessions();
    const trend = progressTracker.getTrend();
    const bestScore = progressTracker.getBestScore();

    // Determine dominant weakness for empathy message
    const scores = { nervousness: R.behavioral?.nervousness || 0, speech: 100 - (R.communication || 50), grammar: 100 - (R.grammarScore || 50) };
    const weakness = scores.nervousness > 60 ? 'nervous' : scores.grammar > 40 ? 'grammar' : scores.speech > 40 ? 'speech' : 'general';
    const empathyMsg = getEmpathyMessage(R.overall, weakness);

    const trendIcon = trend === 'up' ? '📈' : trend === 'down' ? '📉' : trend === 'first' ? '🌟' : '➡️';
    const trendLabel = trend === 'up' ? 'Improving!' : trend === 'down' ? 'Keep going — dips are normal' : trend === 'first' ? 'First session!' : 'Steady';

    const page = document.createElement('div');
    page.className = 'page report-page';
    page.innerHTML = `
      <div class="report-navbar">
        <div class="flex items-center gap-3">
          <div class="navbar-brand-icon"><i data-lucide="mic" style="width:18px;height:18px"></i></div>
          <span class="font-bold">Speakease AI</span>
          <span class="badge badge-primary">Report</span>
        </div>
        <div class="flex items-center gap-3">
          <button class="btn btn-secondary btn-sm" id="download-btn">
            <i data-lucide="download" style="width:14px;height:14px"></i> Download PDF
          </button>
          <button class="btn btn-primary btn-sm" id="new-interview-btn">
            <i data-lucide="refresh-cw" style="width:14px;height:14px"></i> Try Again
          </button>
        </div>
      </div>

      <div class="report-body" id="report-content">

        <!-- ── Empathy Hero ── -->
        <div class="report-hero" style="background:var(--bg-secondary);border-bottom:1px solid var(--border-color)">
          <div class="container">
            <div class="report-hero-content animate-fade-in-up">

              <!-- Score Tier Badge -->
              <div class="score-tier-badge animate-fade-in" style="background:${tier.bg};border:1px solid ${tier.color}30;color:${tier.color}">
                ${tier.label}
              </div>

              <h1 class="report-hero-title">
                ${R.overall >= 70 ? 'Great Session! 🎉' : R.overall >= 50 ? 'Good Effort! 💪' : 'You Showed Up. That Counts. ❤️'}
              </h1>
              <p class="text-tertiary" style="margin-bottom:var(--space-6)">${config.role || 'General'} · ${config.field || ''} · ${(config.experience || 'fresher').charAt(0).toUpperCase() + (config.experience || 'fresher').slice(1)} Level</p>

              <!-- Score Ring -->
              <div class="overall-score-ring animate-fade-in-scale stagger-2">
                <canvas id="overall-donut" width="200" height="200"></canvas>
                <div class="overall-score-center">
                  <div class="overall-score-value" id="overall-value">0</div>
                  <div class="overall-score-label">Overall</div>
                </div>
              </div>

              <!-- Empathy message box -->
              <div class="empathy-message-box animate-fade-in-up stagger-3">
                <span class="empathy-icon">💬</span>
                <p class="empathy-text">${empathyMsg}</p>
              </div>

              <!-- Encouragement from tier -->
              <p class="tier-encouragement animate-fade-in-up stagger-4">${tier.encouragement}</p>
            </div>
          </div>
        </div>

        <!-- ── Your Journey (Progress History) ── -->
        ${total > 1 ? `
        <div class="container report-section">
          <div class="journey-card card animate-fade-in-up">
            <div class="journey-header">
              <div>
                <h3 class="font-bold" style="margin-bottom:4px">Your Journey 🚀</h3>
                <p class="text-xs text-muted">Every session counts. Here's your progress.</p>
              </div>
              <div class="journey-stats">
                <div class="journey-stat">
                  <span class="journey-stat-value">${total}</span>
                  <span class="journey-stat-label">Sessions</span>
                </div>
                <div class="journey-stat">
                  <span class="journey-stat-value">${streak}🔥</span>
                  <span class="journey-stat-label">Day Streak</span>
                </div>
                <div class="journey-stat">
                  <span class="journey-stat-value">${bestScore}</span>
                  <span class="journey-stat-label">Best Score</span>
                </div>
                <div class="journey-stat">
                  <span class="journey-stat-value">${trendIcon}</span>
                  <span class="journey-stat-label">${trendLabel}</span>
                </div>
              </div>
            </div>

            <!-- Mini score bars for recent sessions -->
            <div class="session-history-bars">
              ${sessions.map((s, i) => {
      const t = getScoreTier(s.overall || 0);
      return `
                <div class="session-bar-item">
                  <div class="session-bar-wrap">
                    <div class="session-bar-fill" style="height:${Math.max(8, (s.overall || 0) * 0.7)}px;background:${t.color};opacity:${i === 0 ? 1 : 0.5 + i * 0.08}"></div>
                  </div>
                  <div class="session-bar-score" style="color:${i === 0 ? t.color : 'var(--text-muted)'}">${s.overall || 0}</div>
                  <div class="session-bar-label">${i === 0 ? 'Now' : '#' + (total - i)}</div>
                </div>`;
    }).join('')}
            </div>
          </div>
        </div>` : ''}

        <!-- ── What You Did Well (FIRST — psychologically important) ── -->
        <div class="container report-section animate-fade-in-up">
          <div class="card" style="border-color:rgba(34,197,94,0.2)">
            <h3 class="font-bold" style="margin-bottom:var(--space-4);color:var(--color-success-500);display:flex;align-items:center;gap:8px">
              <span>✅</span> What You Did Well
            </h3>
            <div class="strengths-list">
              ${R.strengths.map(s => `
                <div class="strength-item">
                  <i data-lucide="check-circle" style="width:16px;height:16px;color:var(--color-success-500);flex-shrink:0"></i>
                  <span>${s}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- ── Score Breakdown ── -->
        <div class="container report-section">
          <h2 class="section-title" style="font-size:var(--text-2xl)">Score Breakdown</h2>
          <div class="grid grid-4 gap-4" style="margin-bottom:var(--space-8)">
            ${[
        { label: 'Confidence', value: R.confidence, icon: 'shield-check', color: '#22c55e' },
        { label: 'Communication', value: R.communication, icon: 'message-circle', color: '#6366f1' },
        { label: 'Body Language', value: R.bodyLanguage, icon: 'scan-face', color: '#0ea5e9' },
        { label: 'Grammar', value: R.grammarScore, icon: 'spell-check', color: '#f59e0b' }
      ].map(s => `
              <div class="score-card card animate-fade-in-up">
                <div class="score-card-icon" style="color:${s.color}"><i data-lucide="${s.icon}" style="width:24px;height:24px"></i></div>
                <div class="score-card-value" style="color:${s.color}">${s.value}<span class="text-lg">/100</span></div>
                <div class="score-card-label">${s.label}</div>
                <div class="meter meter-sm" style="margin-top:var(--space-2)">
                  <div class="meter-fill" style="width:${s.value}%;background:${s.color}"></div>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Radar Chart -->
          <div class="card" style="padding:var(--space-8)">
            <h3 class="font-semibold" style="margin-bottom:var(--space-4)">Performance Radar</h3>
            <div style="max-width:400px;margin:0 auto">
              <canvas id="radar-chart"></canvas>
            </div>
          </div>
        </div>

        <!-- ── Behavioral & Speech Row ── -->
        <div class="container report-section">
          <div class="grid grid-2 gap-6">
            <div class="card">
              <h3 class="font-semibold" style="margin-bottom:var(--space-4)">
                <i data-lucide="scan-face" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;color:var(--color-accent-500)"></i>Behavioral Analysis
              </h3>
              ${[
        { label: 'Eye Contact', value: R.behavioral.eyeContact, icon: 'eye' },
        { label: 'Facial Stability', value: R.behavioral.facialStability, icon: 'activity' },
        { label: 'Authenticity', value: R.behavioral.authenticity, icon: 'heart' },
        { label: 'Calm Level', value: Math.max(0, 100 - R.behavioral.nervousness), icon: 'smile' }
      ].map(m => `
                <div class="metric-row">
                  <div class="metric-row-label">
                    <i data-lucide="${m.icon}" style="width:14px;height:14px"></i>
                    <span>${m.label}</span>
                  </div>
                  <div class="metric-row-bar">
                    <div class="meter"><div class="meter-fill meter-primary" style="width:${m.value}%"></div></div>
                    <span class="metric-row-value">${m.value}%</span>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="card">
              <h3 class="font-semibold" style="margin-bottom:var(--space-4)">
                <i data-lucide="audio-waveform" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;color:var(--color-primary-400)"></i>Speech Breakdown
              </h3>
              <div class="speech-stats-grid">
                <div class="speech-stat"><span class="speech-stat-value">${R.speech.totalFillers}</span><span class="speech-stat-label">Filler Words</span></div>
                <div class="speech-stat"><span class="speech-stat-value">${R.speech.avgWpm}</span><span class="speech-stat-label">Avg WPM</span></div>
                <div class="speech-stat"><span class="speech-stat-value">${R.speech.clarity}%</span><span class="speech-stat-label">Clarity</span></div>
                <div class="speech-stat"><span class="speech-stat-value">${R.speech.totalWords}</span><span class="speech-stat-label">Total Words</span></div>
                <div class="speech-stat"><span class="speech-stat-value">${R.speech.pauseCount}</span><span class="speech-stat-label">Pauses</span></div>
                <div class="speech-stat"><span class="speech-stat-value">${R.speech.stutterCount}</span><span class="speech-stat-label">Stutters</span></div>
              </div>
              <div style="height:80px;margin-top:var(--space-4)">
                <canvas id="wpm-chart"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Grammar Report ── -->
        <div class="container report-section">
          <div class="card">
            <h3 class="font-semibold" style="margin-bottom:var(--space-4)">
              <i data-lucide="spell-check" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;color:var(--color-warning-500)"></i>Grammar Report
            </h3>
            <div class="grid grid-3 gap-4" style="margin-bottom:var(--space-6)">
              <div class="stat-card"><div class="stat-card-value">${R.grammar.totalErrors}</div><div class="stat-card-label">Issues Found</div></div>
              <div class="stat-card"><div class="stat-card-value">${R.grammar.vocabularyDiversity}%</div><div class="stat-card-label">Vocab Diversity</div></div>
              <div class="stat-card"><div class="stat-card-value">${Math.max(0, 100 - R.grammar.totalErrors * 5)}</div><div class="stat-card-label">Grammar Score</div></div>
            </div>
            ${R.grammar.suggestions.length > 0 ? `
              <div>
                <p class="font-semibold text-sm" style="margin-bottom:var(--space-3)">Areas to refine:</p>
                <div class="grammar-suggestions">
                  ${R.grammar.suggestions.slice(0, 6).map(s => `
                    <div class="grammar-item">
                      <i data-lucide="arrow-right" style="width:12px;height:12px;flex-shrink:0;color:var(--text-muted)"></i>
                      <span class="grammar-improved">${s.improved}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : '<p class="text-muted text-sm" style="color:var(--color-success-500)">✓ No grammar issues detected. Well spoken!</p>'}
            ${R.grammar.repetitiveWords.length > 0 ? `
              <div style="margin-top:var(--space-4)">
                <p class="font-semibold text-sm" style="margin-bottom:var(--space-2)">Words to vary:</p>
                <div class="flex flex-wrap gap-2">
                  ${R.grammar.repetitiveWords.map(w => `<span class="badge badge-warning">"${w.word}" ×${w.count}</span>`).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- ── Answer-by-Answer Analysis ── -->
        ${R.answers && R.answers.length > 0 ? `
        <div class="container report-section">
          <h2 class="section-title" style="font-size:var(--text-2xl);margin-bottom:var(--space-6)">
            <i data-lucide="clipboard-list" style="width:22px;height:22px;vertical-align:middle;margin-right:8px;color:var(--color-primary-400)"></i>Answer-by-Answer Analysis
          </h2>
          <div style="display:flex;flex-direction:column;gap:var(--space-5)">
            ${R.answers.map((ans, idx) => {
      const ev = ans.aiEvalResult || ans.evalResult;
      if (!ev) return '';
      const scoreColor = ev.score >= 70 ? '#22c55e' : ev.score >= 50 ? '#f59e0b' : '#ef4444';
      const scoreLabel = ev.score >= 70 ? 'Strong' : ev.score >= 50 ? 'Fair' : 'Needs Work';
      const relevBg    = ev.relevance_label === 'Relevant' ? 'rgba(34,197,94,0.12)' : ev.relevance_label === 'Partially Relevant' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)';
      const relevColor = ev.relevance_label === 'Relevant' ? '#22c55e' : ev.relevance_label === 'Partially Relevant' ? '#f59e0b' : '#ef4444';
      const dims = ev.dimensions || {};
      const isAI = ev._source === 'ai';
      const sourceBadge = isAI
        ? `<span class="badge" style="background:rgba(139,92,246,0.15);color:#a78bfa;font-size:10px;margin-left:auto">✦ AI Scored</span>`
        : `<span class="badge" style="background:rgba(148,163,184,0.12);color:#94a3b8;font-size:10px;margin-left:auto">Auto Scored</span>`;
      return `
              <div class="card animate-fade-in-up" style="border-left:4px solid ${scoreColor};padding:var(--space-6)">
                <!-- Header row -->
                <div style="display:flex;align-items:center;flex-wrap:wrap;gap:var(--space-3);margin-bottom:var(--space-4)">
                  <span style="font-weight:700;font-size:var(--text-lg)">Q${idx + 1}</span>
                  <span class="badge" style="background:rgba(99,102,241,0.15);color:var(--color-primary-400);font-size:11px">${ev.question_type}</span>
                  <span class="badge" style="background:rgba(99,102,241,0.08);color:var(--text-secondary);font-size:11px">A: ${ev.answer_type}</span>
                  <span class="badge" style="background:${relevBg};color:${relevColor};font-size:11px">${ev.relevance_label}</span>
                  ${sourceBadge}
                  <span style="font-weight:700;font-size:var(--text-xl);color:${scoreColor}">${ev.score}<span style="font-size:var(--text-sm);color:var(--text-muted);font-weight:400">/100</span></span>
                  <span style="font-size:11px;color:${scoreColor};font-weight:600">${scoreLabel}</span>
                </div>

                <!-- Question text -->
                <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-3);font-style:italic;border-left:2px solid var(--border-color);padding-left:var(--space-3)">${(ans.question || '').slice(0, 140)}${(ans.question || '').length > 140 ? '\u2026' : ''}</p>

                <!-- AI Answer Summary -->
                ${ev.answer_summary ? `
                <div style="margin-bottom:var(--space-4);padding:var(--space-2) var(--space-3);background:rgba(99,102,241,0.05);border-radius:var(--radius-sm);border-left:2px solid rgba(99,102,241,0.3)">
                  <span style="font-size:11px;font-weight:600;color:var(--color-primary-400);margin-right:6px">SUMMARY</span>
                  <span style="font-size:12px;color:var(--text-secondary)">${ev.answer_summary}</span>
                </div>` : ''}

                <!-- 5-dimension mini bars -->
                ${dims.relevance !== undefined ? `
                <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:var(--space-5)">
                  ${[
    ['Relevance', dims.relevance, '#6366f1'],
    ['Clarity', dims.clarity, '#38bdf8'],
    ['Structure', dims.structure, '#a855f7'],
    ['Depth', dims.depth, '#22c55e'],
    ['Communication', dims.communication, '#f59e0b'],
  ].map(([label, val, col]) => `
                    <div style="text-align:center">
                      <div style="font-size:10px;color:var(--text-muted);margin-bottom:4px">${label}</div>
                      <div style="height:4px;background:var(--bg-tertiary);border-radius:2px;overflow:hidden">
                        <div style="height:100%;width:${val || 0}%;background:${col};border-radius:2px;transition:width 0.6s ease"></div>
                      </div>
                      <div style="font-size:11px;font-weight:600;color:${col};margin-top:3px">${val || 0}</div>
                    </div>`).join('')}
                </div>` : ''}

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);margin-bottom:var(--space-4)">
                  <!-- Strengths -->
                  <div style="background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.18);border-radius:var(--radius-md);padding:var(--space-4)">
                    <p style="font-weight:600;font-size:var(--text-sm);color:var(--color-success-500);margin-bottom:var(--space-2)">✅ Strengths</p>
                    ${(ev.strengths || []).map(s => `<p style="font-size:12px;color:var(--text-secondary);margin-bottom:4px">• ${s}</p>`).join('')}
                  </div>
                  <!-- Improvements -->
                  <div style="background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.18);border-radius:var(--radius-md);padding:var(--space-4)">
                    <p style="font-weight:600;font-size:var(--text-sm);color:var(--color-primary-400);margin-bottom:var(--space-2)">🔧 Improvements</p>
                    ${(ev.improvements || []).map(i => `<p style="font-size:12px;color:var(--text-secondary);margin-bottom:4px">• ${i}</p>`).join('')}
                  </div>
                </div>

                <!-- Final Feedback -->
                ${ev.finalFeedback ? `
                <div style="background:var(--bg-secondary);border-radius:var(--radius-sm);padding:var(--space-3) var(--space-4);border-left:3px solid ${scoreColor};margin-bottom:var(--space-3)">
                  <span style="font-size:12px;color:var(--text-muted);margin-right:6px">\uD83D\uDCAC</span>
                  <span style="font-size:13px;color:var(--text-secondary)">${ev.finalFeedback}</span>
                </div>` : ''}

                <!-- Follow-up Question (from AI evaluator) -->
                ${ev.follow_up_question ? `
                <div style="padding:var(--space-3) var(--space-4);background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.2);border-radius:var(--radius-sm);display:flex;align-items:flex-start;gap:8px">
                  <span style="font-size:14px;flex-shrink:0">\uD83D\uDCA1</span>
                  <div>
                    <div style="font-size:10px;font-weight:700;color:#f59e0b;letter-spacing:.05em;margin-bottom:3px">FOLLOW-UP A REAL INTERVIEWER MIGHT ASK</div>
                    <div style="font-size:12px;color:var(--text-secondary);font-style:italic">${ev.follow_up_question}</div>
                  </div>
                </div>` : ''}
              </div>`;
    }).join('')}
          </div>
        </div>` : ''}

        <!-- ── Growth Roadmap (replaces cold weaknesses list) ── -->
        <div class="container report-section">
          <div class="grid grid-2 gap-6">
            <!-- Strengths already shown above, here show focus areas with motivation -->
            <div class="card" style="border-color:rgba(99,102,241,0.2)">
              <h3 class="font-bold" style="margin-bottom:var(--space-4);display:flex;align-items:center;gap:8px">
                <span>🎯</span> Your Growth Goals
              </h3>
              <p class="text-xs text-muted" style="margin-bottom:var(--space-4)">These aren't failures — they're your next wins.</p>
              <div class="weaknesses-list">
                ${R.weaknesses.map(w => `
                  <div class="weakness-item" style="border-color:rgba(99,102,241,0.12);background:rgba(99,102,241,0.04)">
                    <i data-lucide="arrow-up-right" style="width:16px;height:16px;color:var(--color-primary-500);flex-shrink:0"></i>
                    <span>${w}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Personalized Practice -->
            <div class="card" style="background:var(--gradient-primary);color:white;border:none">
              <h3 class="font-semibold" style="margin-bottom:var(--space-4);color:white;display:flex;align-items:center;gap:8px">
                <i data-lucide="lightbulb" style="width:18px;height:18px"></i> Practice Plan
              </h3>
              <div class="suggestions-grid">
                ${R.suggestions.map((s, i) => `
                  <div class="suggestion-card">
                    <div class="suggestion-number">${i + 1}</div>
                    <p>${s}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- ── Session Summary ── -->
        <div class="container report-section">
          <div class="card">
            <h3 class="font-semibold" style="margin-bottom:var(--space-4)">
              <i data-lucide="list-checks" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;color:var(--color-primary-400)"></i>Session Summary
            </h3>
            <div class="grid grid-3 gap-4">
              <div class="stat-card"><div class="stat-card-value">${R.questionsAnswered}</div><div class="stat-card-label">Questions Answered</div></div>
              <div class="stat-card"><div class="stat-card-value">${R.totalQuestions}</div><div class="stat-card-label">Total Questions</div></div>
              <div class="stat-card"><div class="stat-card-value">${R.questionsAnswered > 0 ? Math.round((R.questionsAnswered / R.totalQuestions) * 100) : 0}%</div><div class="stat-card-label">Completion Rate</div></div>
            </div>
          </div>
        </div>

        <!-- ── Motivational CTA at bottom ── -->
        <div class="container report-section" style="padding-bottom:var(--space-16)">
          <div class="motivation-cta card" style="text-align:center;padding:var(--space-10)">
            <div class="motivation-quote-mark">"</div>
            <p class="motivation-quote-text" id="daily-quote-text"></p>
            <p class="motivation-quote-author" id="daily-quote-author"></p>
            <div style="margin-top:var(--space-8);display:flex;gap:var(--space-3);justify-content:center;flex-wrap:wrap">
              <button class="btn btn-primary btn-lg" id="try-again-btn">
                <i data-lucide="refresh-cw" style="width:16px;height:16px"></i>
                ${R.overall >= 70 ? 'Practice Again' : 'Try Again — You\'ve Got This'}
              </button>
              <button class="btn btn-secondary btn-lg" id="go-home-btn">
                <i data-lucide="home" style="width:16px;height:16px"></i>
                Home
              </button>
            </div>
          </div>
        </div>

      </div>
    `;

    return page;
  }

  mount() {
    const R = this.report;
    if (!R) return;

    // Daily quote
    const q = getDailyQuote();
    const qtEl = document.getElementById('daily-quote-text');
    const qaEl = document.getElementById('daily-quote-author');
    if (qtEl) qtEl.textContent = q.text;
    if (qaEl) qaEl.textContent = '— ' + q.author;

    // Animate overall score counter
    this._animateCounter('overall-value', R.overall);

    requestAnimationFrame(() => {
      this.charts.createRadar(
        'radar-chart',
        ['Confidence', 'Communication', 'Body Language', 'Grammar', 'Technical'],
        [R.confidence, R.communication, R.bodyLanguage, R.grammarScore, R.technicalQuality],
        'Your Performance'
      );

      const tier = getScoreTier(R.overall);
      this.charts.createDoughnut('overall-donut', R.overall, tier.color);

      if (R.wpmHistory && R.wpmHistory.length > 1) {
        const labels = R.wpmHistory.map((_, i) => `${i * 3}s`);
        this.charts.createLine('wpm-chart', labels, [{
          label: 'WPM', data: R.wpmHistory,
          borderColor: 'rgba(99,102,241,0.8)', backgroundColor: 'rgba(99,102,241,0.1)'
        }]);
      }

      if (window.lucide) window.lucide.createIcons();
    });

    // Button listeners
    document.getElementById('new-interview-btn')?.addEventListener('click', () => {
      store.resetSession(); router.navigate('/setup');
    });
    document.getElementById('try-again-btn')?.addEventListener('click', () => {
      store.resetSession(); router.navigate('/setup');
    });
    document.getElementById('go-home-btn')?.addEventListener('click', () => {
      store.resetSession(); router.navigate('/');
    });
    document.getElementById('download-btn')?.addEventListener('click', () => this._downloadPDF());
  }

  _animateCounter(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    let current = 0;
    const step = target / 60;
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.round(current);
      if (current >= target) clearInterval(interval);
    }, 16);
  }

  async _downloadPDF() {
    const btn = document.getElementById('download-btn');
    if (btn) { btn.textContent = 'Generating...'; btn.disabled = true; }
    try {
      const jspdfModule = await import('jspdf');
      const jsPDF = jspdfModule.jsPDF || jspdfModule.default?.jsPDF || jspdfModule.default;
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default || html2canvasModule;
      const content = document.getElementById('report-content');
      if (!content) return;
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const bgColor = isDark ? '#0f172a' : '#f0f4ff';
      const canvas = await html2canvas(content, { scale: 0.85, useCORS: true, allowTaint: true, backgroundColor: bgColor, logging: false, imageTimeout: 5000 });
      const imgData = canvas.toDataURL('image/jpeg', 0.72);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      let yOffset = 0, page = 0, remaining = imgHeight;
      while (remaining > 0) {
        if (page > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, -yOffset, pageWidth, imgHeight);
        yOffset += pageHeight; remaining -= pageHeight; page++;
      }
      pdf.save(`speakease-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error('PDF generation failed:', e);
      alert('PDF download failed. Please try again.');
    } finally {
      if (btn) { btn.innerHTML = '<i data-lucide="download" style="width:14px;height:14px"></i> Download PDF'; btn.disabled = false; if (window.lucide) window.lucide.createIcons(); }
    }
  }
}
