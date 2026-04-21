// ========================================
// Speakease — Setup Page
// ========================================

import { router } from '../router.js';
import { store } from '../store.js';
import { questionEngine } from '../modules/questionEngine.js';

const FIELDS = ['Software', 'Marketing', 'Finance', 'Medical', 'Education', 'Law', 'Design', 'Sales', 'HR', 'Other'];
const ROLES = {
    Software: ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Scientist', 'DevOps Engineer', 'QA Engineer', 'Product Manager', 'Other'],
    Marketing: ['Digital Marketer', 'Content Strategist', 'SEO Specialist', 'Brand Manager', 'Social Media Manager', 'Other'],
    Finance: ['Financial Analyst', 'Accountant', 'Investment Banker', 'Risk Manager', 'CFO', 'Other'],
    Medical: ['Doctor', 'Nurse', 'Pharmacist', 'Medical Researcher', 'Other'],
    Education: ['Teacher', 'Professor', 'Education Consultant', 'Other'],
    Law: ['Lawyer', 'Legal Analyst', 'Paralegal', 'Other'],
    Design: ['UI/UX Designer', 'Graphic Designer', 'Product Designer', 'Other'],
    Sales: ['Sales Executive', 'Account Manager', 'Business Development', 'Other'],
    HR: ['HR Manager', 'Recruiter', 'Training Specialist', 'Other'],
    Other: ['General Role']
};

export class SetupPage {
    render() {
        const page = document.createElement('div');
        page.className = 'page setup-page';
        const savedConfig = store.get('config');
        page.innerHTML = `
      <div class="setup-bg-effects">
        <div class="hero-orb hero-orb-1"></div>
        <div class="hero-orb hero-orb-2"></div>
      </div>

      <div class="container container-sm" style="position:relative;z-index:2;padding-top:var(--space-16);padding-bottom:var(--space-16)">
        <button class="btn btn-ghost" id="back-btn" style="margin-bottom:var(--space-6)">
          <i data-lucide="arrow-left" style="width:18px;height:18px"></i> Back
        </button>

        <div class="card animate-fade-in-up" style="padding:var(--space-8)">
          <div class="section-header text-center" style="margin-bottom:var(--space-8)">
            <div class="ai-avatar" style="margin:0 auto var(--space-4)">
              <i data-lucide="settings" style="width:24px;height:24px;color:white"></i>
            </div>
            <h1 class="text-2xl font-extrabold">Configure Your Interview</h1>
            <p class="text-tertiary text-sm" style="margin-top:var(--space-2)">Set up your practice session to get personalized questions.</p>
          </div>

          <form id="setup-form" class="setup-form">
            <div class="grid grid-2 gap-4">
              <div class="form-group">
                <label class="form-label">Industry / Field</label>
                <select class="form-select" id="field-select" required>
                  <option value="">Select field...</option>
                  ${FIELDS.map(f => `<option value="${f}" ${savedConfig.field === f ? 'selected' : ''}>${f}</option>`).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Job Role</label>
                <select class="form-select" id="role-select" required>
                  <option value="">Select role...</option>
                </select>
              </div>
            </div>

            <div class="grid grid-3 gap-4" style="margin-top:var(--space-4)">
              <div class="form-group">
                <label class="form-label">Experience Level</label>
                <select class="form-select" id="experience-select">
                  <option value="fresher" ${savedConfig.experience === 'fresher' ? 'selected' : ''}>Fresher</option>
                  <option value="mid" ${savedConfig.experience === 'mid' ? 'selected' : ''}>Mid-Level</option>
                  <option value="senior" ${savedConfig.experience === 'senior' ? 'selected' : ''}>Senior</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Interview Type</label>
                <select class="form-select" id="type-select">
                  <option value="mixed" ${savedConfig.interviewType === 'mixed' ? 'selected' : ''}>Mixed</option>
                  <option value="technical" ${savedConfig.interviewType === 'technical' ? 'selected' : ''}>Technical</option>
                  <option value="behavioral" ${savedConfig.interviewType === 'behavioral' ? 'selected' : ''}>Behavioral</option>
                  <option value="hr" ${savedConfig.interviewType === 'hr' ? 'selected' : ''}>HR</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Difficulty</label>
                <select class="form-select" id="difficulty-select">
                  <option value="easy" ${savedConfig.difficulty === 'easy' ? 'selected' : ''}>Easy</option>
                  <option value="medium" ${savedConfig.difficulty === 'medium' ? 'selected' : ''}>Medium</option>
                  <option value="hard" ${savedConfig.difficulty === 'hard' ? 'selected' : ''}>Hard</option>
                </select>
              </div>
            </div>

            <div class="form-group" style="margin-top:var(--space-4)">
              <label class="form-label">Duration: <span id="duration-value">${savedConfig.duration || 10}</span> minutes</label>
              <input type="range" id="duration-range" class="form-range" min="5" max="30" step="5" value="${savedConfig.duration || 10}" />
              <div class="flex justify-between text-xs text-muted" style="margin-top:var(--space-1)">
                <span>5 min</span><span>30 min</span>
              </div>
            </div>

            <div class="divider"></div>

            <div id="setup-summary" class="setup-summary" style="display:none">
              <div class="flex items-center gap-2" style="margin-bottom:var(--space-3)">
                <i data-lucide="clipboard-list" style="width:16px;height:16px;color:var(--color-primary-400)"></i>
                <span class="font-semibold text-sm">Session Preview</span>
              </div>
              <div class="grid grid-3 gap-3" id="summary-cards"></div>
            </div>

            <button type="submit" class="btn btn-primary btn-lg w-full" style="margin-top:var(--space-6)" id="start-interview-btn">
              <i data-lucide="play" style="width:20px;height:20px"></i>
              Start Interview
            </button>
          </form>
        </div>
      </div>
    `;
        return page;
    }

    mount() {
        const fieldSelect = document.getElementById('field-select');
        const roleSelect = document.getElementById('role-select');
        const durationRange = document.getElementById('duration-range');
        const durationValue = document.getElementById('duration-value');
        const form = document.getElementById('setup-form');

        // Update roles when field changes
        fieldSelect?.addEventListener('change', () => {
            const field = fieldSelect.value;
            const roles = ROLES[field] || ['General Role'];
            roleSelect.innerHTML = '<option value="">Select role...</option>' +
                roles.map(r => `<option value="${r}">${r}</option>`).join('');
            this._updateSummary();
        });

        // Populate roles if field already selected
        if (fieldSelect?.value) {
            const roles = ROLES[fieldSelect.value] || ['General Role'];
            roleSelect.innerHTML = '<option value="">Select role...</option>' +
                roles.map(r => `<option value="${r}" ${store.get('config').role === r ? 'selected' : ''}>${r}</option>`).join('');
        }

        // Duration slider
        durationRange?.addEventListener('input', () => {
            if (durationValue) durationValue.textContent = durationRange.value;
            this._updateSummary();
        });

        // Update summary on any change
        ['field-select', 'role-select', 'experience-select', 'type-select', 'difficulty-select'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => this._updateSummary());
        });

        // Form submit
        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this._startInterview();
        });

        // Back button
        document.getElementById('back-btn')?.addEventListener('click', () => router.navigate('/'));

        this._updateSummary();
    }

    _updateSummary() {
        const field = document.getElementById('field-select')?.value;
        const role = document.getElementById('role-select')?.value;
        const summary = document.getElementById('setup-summary');
        const cards = document.getElementById('summary-cards');

        if (!field || !role) { if (summary) summary.style.display = 'none'; return; }

        const exp = document.getElementById('experience-select')?.value || 'fresher';
        const type = document.getElementById('type-select')?.value || 'mixed';
        const diff = document.getElementById('difficulty-select')?.value || 'medium';
        const dur = document.getElementById('duration-range')?.value || 10;

        const tempQuestions = questionEngine.generateQuestions({ field, role, experience: exp, interviewType: type, difficulty: diff });

        if (summary) summary.style.display = 'block';
        if (cards) {
            cards.innerHTML = `
        <div class="stat-card"><div class="stat-card-value">${tempQuestions.length}</div><div class="stat-card-label">Questions</div></div>
        <div class="stat-card"><div class="stat-card-value">${dur}m</div><div class="stat-card-label">Duration</div></div>
        <div class="stat-card"><div class="stat-card-value">${diff.charAt(0).toUpperCase() + diff.slice(1)}</div><div class="stat-card-label">Difficulty</div></div>
      `;
        }
    }

    _startInterview() {
        const config = {
            field: document.getElementById('field-select')?.value,
            role: document.getElementById('role-select')?.value,
            experience: document.getElementById('experience-select')?.value || 'fresher',
            interviewType: document.getElementById('type-select')?.value || 'mixed',
            difficulty: document.getElementById('difficulty-select')?.value || 'medium',
            duration: parseInt(document.getElementById('duration-range')?.value || 10)
        };

        if (!config.field || !config.role) {
            alert('Please select a field and role.');
            return;
        }

        store.set('config', config);

        // Generate questions
        const questions = questionEngine.generateQuestions(config);
        store.set('session.questions', questions);
        store.set('session.active', true);
        store.set('session.startTime', new Date().toISOString());
        store.set('session.currentQuestionIndex', 0);

        router.navigate('/session');
    }
}
