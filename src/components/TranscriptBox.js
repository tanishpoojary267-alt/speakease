// ========================================
// Speakease — Transcript Box
// ========================================

export class TranscriptBox {
  constructor() {
    this.container = null;
    this.contentEl = null;
  }

  render() {
    const el = document.createElement('div');
    el.className = 'transcript-box glass-panel';
    el.innerHTML = `
      <div class="transcript-header">
        <div class="flex items-center gap-2">
          <i data-lucide="message-square" style="width:16px;height:16px;color:var(--color-primary-400)"></i>
          <span class="font-semibold text-sm">Live Transcript</span>
        </div>
        <div class="transcript-indicator" id="transcript-indicator">
          <span class="recording-dot"></span>
          <span class="text-xs text-muted">Listening...</span>
        </div>
      </div>
      <div class="transcript-content" id="transcript-content">
        <p class="text-muted text-sm" style="font-style:italic">Start speaking to see your transcript here...</p>
      </div>
    `;
    this.container = el;
    return el;
  }

  update(transcriptData) {
    const content = document.getElementById('transcript-content');
    if (!content) return;
    const { final, interim } = transcriptData;
    if (!final && !interim) return;
    let html = '';
    if (final)   html += `<span class="transcript-final">${this.highlightFillers(final)}</span>`;
    if (interim) html += `<span class="transcript-interim">${interim}</span>`;
    content.innerHTML = html;
    content.scrollTop = content.scrollHeight;
  }

  highlightFillers(text) {
    const fillers = ['um','uh','uhh','umm','ummm','er','err','ah','ahh','like','basically','literally','actually','honestly'];
    let result = text;
    fillers.forEach(f => {
      const regex = new RegExp(`\\b(${f})\\b`, 'gi');
      result = result.replace(regex, '<mark class="filler-highlight">$1</mark>');
    });
    return result;
  }

  clear() {
    const content = document.getElementById('transcript-content');
    if (content) content.innerHTML = '<p class="text-muted text-sm" style="font-style:italic">Start speaking...</p>';
    const hints = document.getElementById('grammar-hints');
    if (hints) hints.innerHTML = '';
  }

  showGrammarHints(grammarResult) {
    let hints = document.getElementById('grammar-hints');
    if (!hints) {
      hints = document.createElement('div');
      hints.id = 'grammar-hints';
      hints.style.cssText = 'margin-top:8px;display:flex;flex-direction:column;gap:5px;';
      this.container?.appendChild(hints);
    }

    const qualScore = grammarResult?.qualityMetrics?.qualityScore ?? 100;
    const errCount  = grammarResult?.errorCount || 0;
    const avg = grammarResult?.qualityMetrics?.avgSentenceLen || 0;

    // ── Quality badge (sentence quality — always visible) ──────────
    const qualColor = qualScore >= 75 ? '#22c55e' : qualScore >= 55 ? '#fbbf24' : qualScore >= 35 ? '#f97316' : '#ef4444';
    const qualLabel = qualScore >= 75 ? 'Strong'  : qualScore >= 55 ? 'Decent'  : qualScore >= 35 ? 'Weak'    : 'Very Weak';
    const qualBadge = `<span style="font-size:10px;font-weight:700;color:${qualColor};background:${qualColor}18;border:1px solid ${qualColor}30;border-radius:99px;padding:2px 8px">
      ✍ Quality: ${qualLabel} (${avg} wds/sentence)
    </span>`;

    // ── Grammar error score badge ──────────────────────────────────
    const errorScore = Math.max(0, 100 - errCount * 7 - (grammarResult?.gibberishCount || 0) * 12);
    const ec = errorScore >= 85 ? '#22c55e' : errorScore >= 70 ? '#4ade80' : errorScore >= 52 ? '#fbbf24' : errorScore >= 35 ? '#f97316' : '#ef4444';
    const el = errorScore >= 85 ? 'Excellent' : errorScore >= 70 ? 'Good' : errorScore >= 52 ? 'Fair' : errorScore >= 35 ? 'Needs Work' : 'Poor';
    const grammarBadge = `<span style="font-size:10px;font-weight:700;color:${ec};background:${ec}18;border:1px solid ${ec}30;border-radius:99px;padding:2px 8px">
      📝 Grammar: ${el}${errCount > 0 ? ` (${errCount} issue${errCount > 1 ? 's' : ''})` : ''}
    </span>`;

    // ── Error detail badges ────────────────────────────────────────
    const TYPE_LABEL = {
      'subject-verb': 'S-V', tense: 'Tense', pronoun: 'Pronoun', grammar: 'Error',
      informal: 'Informal', 'double-negative': 'Double-neg', article: 'Article',
      vague: 'Vague', repetition: 'Repetition', gibberish: 'Non-word',
      incomplete: 'Incomplete', 'filler-phrase': 'Filler',
    };
    const badges = (grammarResult?.errors || []).slice(0, 4).map(e => {
      const tl = TYPE_LABEL[e.type] || e.type;
      const hint = e.hint || '';
      return `<span class="badge badge-warning" style="font-size:10px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${hint}">⚠ [${tl}] ${hint.slice(0,55)}${hint.length > 55 ? '…' : ''}</span>`;
    }).join('');

    const more = errCount > 4
      ? `<span class="badge badge-neutral" style="font-size:10px">+${errCount - 4} more issues</span>`
      : '';

    // Professional word tip
    const proHits = grammarResult?.qualityMetrics?.proWordHits || 0;
    const proNote = proHits > 0
      ? `<span style="font-size:10px;color:#818cf8">✓ ${proHits} professional word${proHits > 1 ? 's' : ''} used</span>`
      : `<span style="font-size:10px;color:#64748b">💡 Use words like: achieve, collaborate, implement, contribute...</span>`;

    hints.innerHTML =
      `<div style="display:flex;flex-wrap:wrap;gap:4px">${qualBadge}${grammarBadge}</div>` +
      (errCount > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${badges}${more}</div>` : '') +
      `<div style="margin-top:3px">${proNote}</div>`;
  }
}
