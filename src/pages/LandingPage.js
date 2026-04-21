// ========================================
// Speakease AI — Landing Page (WOW Edition)
// ========================================

import { router } from '../router.js';

export class LandingPage {
  render() {
    const page = document.createElement('div');
    page.className = 'page landing-page';
    page.innerHTML = `

      <!-- ══════════════════ HERO ══════════════════ -->
      <div class="landing-hero">
        <div class="hero-bg-effects">
          <div class="hero-grid"></div>
          <div class="hero-orb hero-orb-1"></div>
          <div class="hero-orb hero-orb-2"></div>
          <div class="hero-orb hero-orb-3"></div>
        </div>

        <div class="container" style="position:relative;z-index:2;display:flex;flex-direction:column;min-height:100vh">
          <!-- Nav -->
          <nav class="landing-nav animate-fade-in-down">
            <div class="landing-brand">
              <div class="navbar-brand-icon">
                <i data-lucide="mic" style="width:16px;height:16px"></i>
              </div>
              <span class="landing-brand-name">Speakease AI</span>
            </div>
            <div class="flex items-center gap-3">
              <div id="landing-nav-actions" class="flex items-center gap-2"></div>
              <button class="btn btn-primary btn-sm" id="nav-start-btn">
                Try Free
                <i data-lucide="arrow-right" style="width:13px;height:13px"></i>
              </button>
            </div>
          </nav>

          <!-- Hero Content -->
          <div class="hero-content">
            <div class="hero-badge animate-fade-in">
              <i data-lucide="sparkles" style="width:11px;height:11px"></i>
              AI-Powered Interview Coach &nbsp;·&nbsp; 100% Free &nbsp;·&nbsp; Runs in Browser
            </div>

            <h1 class="hero-title animate-fade-in-up">
              Stop Freezing.<br/>Start <span class="hero-gradient-word">Winning</span> Interviews.
            </h1>

            <p class="hero-subtitle animate-fade-in-up stagger-1">
              Speakease AI watches your face, listens to your voice, and reads your words —
              then tells you exactly what to fix. Real-time. No uploads. No accounts.
            </p>

            <div class="hero-actions animate-fade-in-up stagger-2">
              <button class="btn btn-primary btn-xl hero-cta-btn" id="start-btn">
                <i data-lucide="play-circle" style="width:20px;height:20px"></i>
                Start Practice Interview
              </button>
              <button class="btn btn-ghost btn-lg" id="learn-more-btn" style="color:var(--text-tertiary)">
                How it works
                <i data-lucide="chevron-down" style="width:16px;height:16px"></i>
              </button>
            </div>

            <!-- Stats Row -->
            <div class="hero-stats animate-fade-in-up stagger-3">
              <div class="hero-stat">
                <span class="hero-stat-value">8</span>
                <span class="hero-stat-label">Emotion States</span>
              </div>
              <div class="hero-stat-divider"></div>
              <div class="hero-stat">
                <span class="hero-stat-value">200+</span>
                <span class="hero-stat-label">Questions</span>
              </div>
              <div class="hero-stat-divider"></div>
              <div class="hero-stat">
                <span class="hero-stat-value">Real-time</span>
                <span class="hero-stat-label">Feedback</span>
              </div>
              <div class="hero-stat-divider"></div>
              <div class="hero-stat">
                <span class="hero-stat-value">0 uploads</span>
                <span class="hero-stat-label">100% Private</span>
              </div>
            </div>
          </div>

          <!-- CSS App Preview Mockup -->
          <div class="app-preview-wrap animate-fade-in-up stagger-4">
            <div class="app-preview">
              <!-- Mock navbar -->
              <div class="mock-navbar">
                <div class="mock-brand">
                  <div class="mock-dot" style="background:var(--gradient-primary);border-radius:4px;width:18px;height:18px"></div>
                  <span style="font-size:11px;font-weight:700;color:var(--text-secondary)">Speakease AI</span>
                  <div class="mock-badge">● LIVE</div>
                </div>
                <div style="display:flex;gap:8px;align-items:center">
                  <div class="mock-pill">⏱ 02:14</div>
                  <div class="mock-pill" style="color:#ef4444;border-color:rgba(239,68,68,0.2)">■ End</div>
                </div>
              </div>

              <!-- Mock body -->
              <div class="mock-body">
                <!-- Mock question -->
                <div class="mock-question-card">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                    <div style="width:24px;height:24px;background:var(--gradient-primary);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:10px">🤖</div>
                    <span style="font-size:9px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em">AI Interviewer · Question 2 of 8</span>
                  </div>
                  <div style="font-size:11px;font-weight:600;color:var(--text-primary);line-height:1.5">
                    Tell me about a time you handled a difficult situation under pressure. What was your approach?
                  </div>
                </div>

                <!-- Mock 3-col layout -->
                <div class="mock-session-row">
                  <!-- Mock video -->
                  <div class="mock-video">
                    <div class="mock-video-inner">
                      <div class="mock-face-ring"></div>
                      <div style="font-size:9px;color:rgba(255,255,255,0.6);margin-top:6px;font-weight:500">📷 Camera Active</div>
                    </div>
                    <div class="mock-video-label">
                      <span class="mock-badge" style="background:rgba(34,197,94,0.15);color:#22c55e;border-color:rgba(34,197,94,0.2)">● Face Detected</span>
                    </div>
                  </div>

                  <!-- Mock transcript -->
                  <div class="mock-transcript">
                    <div style="font-size:9px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.07em;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--border-color)">🎙 Live Transcript</div>
                    <div style="font-size:9.5px;color:var(--text-primary);line-height:1.7;font-weight:450">
                      In my previous role I had to lead a project with a very tight deadline. 
                      <span style="background:rgba(245,158,11,0.18);color:#f59e0b;border-radius:2px;padding:0 2px;font-weight:600">um</span> 
                      The first thing I did was break the problem down into smaller tasks and…
                    </div>
                    <div style="font-size:9px;color:var(--text-muted);font-style:italic;margin-top:6px">
                      prioritize the most critical ones first...
                    </div>
                  </div>

                  <!-- Mock sidebar -->
                  <div class="mock-sidebar">
                    <div class="mock-emotion-box">
                      <div style="font-size:8px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.07em;margin-bottom:6px">Emotional State</div>
                      <div style="display:flex;align-items:center;gap:6px">
                        <span style="font-size:1.3rem">✅</span>
                        <div>
                          <div style="font-size:10px;font-weight:800;color:#22c55e">Confident</div>
                          <div style="font-size:8px;color:var(--text-muted);line-height:1.4;margin-top:1px">Good composure detected</div>
                        </div>
                      </div>
                    </div>

                    <div style="display:flex;flex-direction:column;gap:5px">
                      <div class="mock-metric-row">
                        <span>Confidence</span>
                        <div class="mock-bar"><div class="mock-bar-fill" style="width:76%;background:linear-gradient(90deg,#22c55e,#4ade80)"></div></div>
                        <span>76%</span>
                      </div>
                      <div class="mock-metric-row">
                        <span>Nervousness</span>
                        <div class="mock-bar"><div class="mock-bar-fill" style="width:22%;background:linear-gradient(90deg,#f97316,#ef4444)"></div></div>
                        <span>22%</span>
                      </div>
                      <div class="mock-metric-row">
                        <span>Eye Contact</span>
                        <div class="mock-bar"><div class="mock-bar-fill" style="width:81%;background:linear-gradient(90deg,#6366f1,#818cf8)"></div></div>
                        <span>81%</span>
                      </div>
                      <div class="mock-metric-row" style="margin-top:4px">
                        <span>Speed</span>
                        <span style="font-size:10px;font-weight:800;color:var(--text-primary)">143 WPM</span>
                        <div class="mock-mini-badge good">Good</div>
                      </div>
                      <div class="mock-metric-row">
                        <span>Fillers</span>
                        <span style="font-size:10px;font-weight:800;color:#f59e0b">2</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="preview-label">Live preview of a real session</div>
          </div>
        </div>
      </div>

      <!-- ══════════════════ HOW IT WORKS ══════════════════ -->
      <section class="how-section" id="features">
        <div class="container">
          <div class="text-center" style="margin-bottom:var(--space-16)">
            <div class="section-label" style="justify-content:center">
              <i data-lucide="map" style="width:12px;height:12px"></i>
              How it works
            </div>
            <h2 class="section-title">Three Steps to Interview <span class="gradient-text">Mastery</span></h2>
          </div>

          <div class="steps-grid">
            <div class="step-card animate-fade-in-up">
              <div class="step-number">01</div>
              <div class="step-icon">
                <i data-lucide="sliders" style="width:24px;height:24px"></i>
              </div>
              <h3 class="step-title">Configure Your Interview</h3>
              <p class="step-desc">Choose your field, role, experience level, and interview type. Our AI generates personalized questions tailored to you.</p>
            </div>
            <div class="steps-connector"></div>
            <div class="step-card animate-fade-in-up stagger-2">
              <div class="step-number">02</div>
              <div class="step-icon">
                <i data-lucide="video" style="width:24px;height:24px"></i>
              </div>
              <h3 class="step-title">Practice with Live AI Analysis</h3>
              <p class="step-desc">Answer questions on camera. Watch your confidence, nervousness, speech pace, and grammar scored in real-time.</p>
            </div>
            <div class="steps-connector"></div>
            <div class="step-card animate-fade-in-up stagger-4">
              <div class="step-number">03</div>
              <div class="step-icon">
                <i data-lucide="bar-chart-3" style="width:24px;height:24px"></i>
              </div>
              <h3 class="step-title">Get Your Performance Report</h3>
              <p class="step-desc">Receive a full dashboard with scores, charts, strengths, weaknesses, and a personalized roadmap to improve.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════ FEATURES ══════════════════ -->
      <section class="features-section">
        <div class="container">
          <div class="text-center" style="margin-bottom:var(--space-16)">
            <div class="section-label" style="justify-content:center">
              <i data-lucide="layers" style="width:12px;height:12px"></i>
              What we measure
            </div>
            <h2 class="section-title">Every Dimension of Your<br/><span class="gradient-text">Interview Performance</span></h2>
          </div>

          <div class="features-grid">
            <div class="feature-card card card-interactive animate-fade-in-up">
              <div class="feature-icon-wrap" style="--feat-color:99,102,241">
                <i data-lucide="scan-face" style="width:22px;height:22px"></i>
              </div>
              <h3 class="feature-title">Facial Emotion Analysis</h3>
              <p class="feature-desc">Classifies your live expression into 8 interview states: Confident, Nervous, Overconfident, Distracted, Tense and more — with coaching tips.</p>
              <div class="feature-tags">
                <span class="tag">Real-time</span><span class="tag">8 States</span><span class="tag">Live Tips</span>
              </div>
            </div>

            <div class="feature-card card card-interactive animate-fade-in-up stagger-1">
              <div class="feature-icon-wrap" style="--feat-color:14,165,233">
                <i data-lucide="audio-waveform" style="width:22px;height:22px"></i>
              </div>
              <h3 class="feature-title">Speech & Voice Analysis</h3>
              <p class="feature-desc">Detects filler words, stuttering, speaking speed (WPM), pauses, and hesitations. Live scrolling transcript with highlighted flaws.</p>
              <div class="feature-tags">
                <span class="tag">WPM</span><span class="tag">Filler words</span><span class="tag">Transcript</span>
              </div>
            </div>

            <div class="feature-card card card-interactive animate-fade-in-up stagger-2">
              <div class="feature-icon-wrap" style="--feat-color:34,197,94">
                <i data-lucide="spell-check" style="width:22px;height:22px"></i>
              </div>
              <h3 class="feature-title">Grammar & Language</h3>
              <p class="feature-desc">Catches tense errors, pronoun misuse, and repetitive vocabulary in real-time. Suggests improved sentence structures instantly.</p>
              <div class="feature-tags">
                <span class="tag">Grammar</span><span class="tag">Vocabulary</span><span class="tag">Suggestions</span>
              </div>
            </div>

            <div class="feature-card card card-interactive animate-fade-in-up stagger-3">
              <div class="feature-icon-wrap" style="--feat-color:245,158,11">
                <i data-lucide="brain" style="width:22px;height:22px"></i>
              </div>
              <h3 class="feature-title">Smart AI Interviewer</h3>
              <p class="feature-desc">Generates questions by field, role, and level. Asks intelligent follow-ups based on your answers. Adjusts difficulty dynamically.</p>
              <div class="feature-tags">
                <span class="tag">Personalized</span><span class="tag">Follow-ups</span><span class="tag">Dynamic</span>
              </div>
            </div>

            <div class="feature-card card card-interactive animate-fade-in-up stagger-4">
              <div class="feature-icon-wrap" style="--feat-color:239,68,68">
                <i data-lucide="pie-chart" style="width:22px;height:22px"></i>
              </div>
              <h3 class="feature-title">Detailed Report</h3>
              <p class="feature-desc">Full performance dashboard with an overall score, behavioral analysis, speech breakdown, grammar report, and a job-readiness verdict.</p>
              <div class="feature-tags">
                <span class="tag">PDF Download</span><span class="tag">Charts</span><span class="tag">Roadmap</span>
              </div>
            </div>

            <div class="feature-card card card-interactive animate-fade-in-up stagger-5">
              <div class="feature-icon-wrap" style="--feat-color:168,85,247">
                <i data-lucide="shield-check" style="width:22px;height:22px"></i>
              </div>
              <h3 class="feature-title">100% Private & Secure</h3>
              <p class="feature-desc">All AI runs directly in your browser using on-device models. No video, audio, or text is ever sent to any server. Zero data stored.</p>
              <div class="feature-tags">
                <span class="tag">On-device AI</span><span class="tag">No uploads</span><span class="tag">No account</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════ CTA ══════════════════ -->
      <section class="cta-section">
        <div class="container text-center">
          <div class="cta-glow-ring"></div>
          <div style="position:relative;z-index:1">
            <div class="section-label" style="justify-content:center;margin-bottom:var(--space-5)">
              <i data-lucide="rocket" style="width:12px;height:12px"></i>
              Ready to begin?
            </div>
            <h2 class="cta-title">
              Your Next Interviewer<br/>Is Already Impressed.
            </h2>
            <p style="color:var(--text-tertiary);font-size:var(--text-base);max-width:440px;margin:var(--space-5) auto var(--space-10);line-height:var(--leading-relaxed)">
              Practice now and walk into any interview knowing exactly how confident, clear, and composed you sound.
            </p>
            <button class="btn btn-primary btn-xl hero-cta-btn" id="cta-start-btn">
              Start for Free — No Signup
              <i data-lucide="arrow-right" style="width:18px;height:18px"></i>
            </button>
            <div style="margin-top:var(--space-6);font-size:var(--text-xs);color:var(--text-muted);display:flex;gap:var(--space-6);justify-content:center;align-items:center">
              <span>✓ No account needed</span>
              <span>✓ No data uploaded</span>
              <span>✓ Works in Chrome / Edge</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="landing-footer">
        <span class="landing-brand" style="display:inline-flex;align-items:center;gap:var(--space-2)">
          <div class="navbar-brand-icon" style="width:24px;height:24px">
            <i data-lucide="mic" style="width:12px;height:12px"></i>
          </div>
          <span style="font-size:var(--text-sm);font-weight:700;color:var(--text-muted)">Speakease AI</span>
        </span>
        <span style="font-size:var(--text-xs);color:var(--text-muted)">AI-powered interview coaching · Built with ❤️ for learners</span>
      </footer>
    `;
    return page;
  }

  mount() {
    document.getElementById('start-btn')?.addEventListener('click', () => router.navigate('/setup'));
    document.getElementById('nav-start-btn')?.addEventListener('click', () => router.navigate('/setup'));
    document.getElementById('cta-start-btn')?.addEventListener('click', () => router.navigate('/setup'));
    document.getElementById('learn-more-btn')?.addEventListener('click', () => {
      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
    });

    // Theme toggle in nav
    const navActions = document.getElementById('landing-nav-actions');
    if (navActions) {
      import('../components/ThemeToggle.js').then(({ ThemeToggle }) => {
        const toggle = new ThemeToggle();
        navActions.appendChild(toggle.render());
        if (window.lucide) window.lucide.createIcons();
      });
    }

    // Animate stat counters
    this._animateCounters();
  }

  _animateCounters() {
    // Subtle entrance animation on stats when they scroll into view
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('animate-scale-in'); observer.unobserve(e.target); } });
    }, { threshold: 0.15 });
    document.querySelectorAll('.step-card, .feature-card').forEach(el => observer.observe(el));
  }
}
