// ========================================
// Speakease — Report Generator (fixed)
// ========================================

export class ReportGenerator {
    generate(faceMetrics, speechMetrics, grammarResult, config, questionsAnswered, totalQuestions, questions, answers, pauseData) {
        const hasFace = faceMetrics && (faceMetrics.frameCount > 0 || faceMetrics.confidence > 0);
        const hasSpeech = speechMetrics && speechMetrics.totalWords > 5; // need at least 5 words

        const confidence = this._calcConfidence(faceMetrics, speechMetrics, hasFace, hasSpeech);
        const communication = this._calcCommunication(speechMetrics, grammarResult, hasSpeech);
        const bodyLanguage = this._calcBodyLanguage(faceMetrics, hasFace);

        // Grammar: penalize heavily if all words are nonsense (no real sentences)
        const grammarScore = hasSpeech && grammarResult?.errorCount !== undefined
            ? Math.max(0, 100 - grammarResult.errorCount * 8)
            : 0;

        const technicalQuality = this._calcTechnical(speechMetrics, questionsAnswered, totalQuestions, questions, answers, pauseData);

        // If cheating detected, cap all derived scores
        const isCheating = pauseData?.isCheating || false;
        const cheatMultiplier = isCheating ? 0.55 : 1;

        // ── UNANSWERED QUESTION PENALTY ────────────────────────
        // If user answered 1 of 5 questions → completionRate = 0.20
        // Final score is multiplied by this so: 80 score × 0.20 = 16 (about 10-20%)
        const answered = questionsAnswered || (answers?.length || 0);
        const total = totalQuestions || 1;
        const completionRate = Math.min(1, answered / total);

        // ── WEIGHTED SCORING: 40% relevance + 20% filler + 20% clarity + 20% facial ──
        const relevanceScore = this._calcRelevanceScore(answers, total);
        const fillerScore = this._calcFillerScore(speechMetrics, hasSpeech);
        const clarityScore2 = hasSpeech ? (speechMetrics?.clarityScore || 0) : 0;
        const facialScore = hasFace ? (faceMetrics?.confidence || 0) : 50;

        // Raw score based on quality
        const qualityScore = Math.round(
            relevanceScore * 0.40 +
            fillerScore * 0.20 +
            clarityScore2 * 0.20 +
            facialScore * 0.20
        );

        // Apply completion rate penalty + cheat multiplier
        const overall = Math.round(qualityScore * completionRate * cheatMultiplier);

        const verdict = this._getVerdict(overall);
        const strengths = this._getStrengths(confidence, communication, bodyLanguage, grammarScore, technicalQuality, faceMetrics, speechMetrics);
        const weaknesses = this._getWeaknesses(confidence, communication, bodyLanguage, grammarScore, technicalQuality, faceMetrics, speechMetrics, hasFace, hasSpeech, pauseData);
        const suggestions = this._getSuggestions(weaknesses);

        return {
            overall,
            confidence: Math.round(confidence),
            communication: Math.round(communication),
            bodyLanguage: Math.round(bodyLanguage),
            grammarScore: Math.round(grammarScore),
            technicalQuality: Math.round(technicalQuality),
            // New scoring breakdown
            relevanceScore: Math.round(relevanceScore),
            fillerScore: Math.round(fillerScore),
            isCheating,
            pauseCount: pauseData?.pauseCount || 0,
            completionRate: Math.round(completionRate * 100),
            answeredCount: answered,
            totalQuestions: total,
            behavioral: {
                eyeContact: hasFace ? (faceMetrics.eyeContact || 0) : 0,
                facialStability: hasFace ? (faceMetrics.headStability || 0) : 0,
                nervousness: hasFace ? (faceMetrics.nervousness || 0) : 0,
                authenticity: hasFace
                    ? Math.round((faceMetrics.confidence || 0) * 0.7 + (100 - (faceMetrics.nervousness || 0)) * 0.3)
                    : 0
            },
            speech: {
                totalFillers: hasSpeech ? (speechMetrics.fillerCount || 0) : 0,
                avgWpm: hasSpeech ? (speechMetrics.avgWpm || 0) : 0,
                clarity: hasSpeech ? (speechMetrics.clarityScore || 0) : 0,
                stutterCount: hasSpeech ? (speechMetrics.stutterCount || 0) : 0,
                pauseCount: hasSpeech ? (speechMetrics.pauseCount || 0) : 0,
                totalWords: hasSpeech ? (speechMetrics.totalWords || 0) : 0
            },
            grammar: {
                totalErrors: grammarResult?.errorCount || 0,
                errorTypes: grammarResult?.errorTypes || {},
                vocabularyDiversity: grammarResult?.vocabularyDiversity || 0,
                repetitiveWords: grammarResult?.repetitiveWords || [],
                suggestions: grammarResult?.suggestions?.slice(0, 5) || []
            },
            verdict,
            strengths: strengths.slice(0, 3),
            weaknesses: weaknesses.slice(0, 3),
            suggestions,
            questionsAnswered,
            totalQuestions,
            answers: answers || [],
            faceConfidenceHistory: faceMetrics?.confidenceHistory || [],
            faceNervousnessHistory: faceMetrics?.nervousnessHistory || [],
            wpmHistory: speechMetrics?.wpmHistory || []
        };
    }

    _calcConfidence(face, speech, hasFace, hasSpeech) {
        let score = 0;
        let weight = 0;

        if (hasFace) {
            score += (face.confidence || 0) * 0.4;
            weight += 0.4;
        }
        if (hasSpeech) {
            score += (speech.clarityScore || 0) * 0.35;
            score += this._wpmScore(speech.avgWpm || 0) * 0.25;
            weight += 0.6;
        }

        // Normalize to available data
        return weight > 0 ? Math.round(score / weight * 100) / 100 : 0;
    }

    _calcCommunication(speech, grammar, hasSpeech) {
        if (!hasSpeech) return 0;

        const clarity = speech?.clarityScore || 0;
        const fillerPenalty = Math.min(25, (speech?.fillerCount || 0) * 2);
        const grammarBonus = grammar?.errorCount !== undefined ? Math.max(0, 15 - grammar.errorCount * 2) : 10;
        const wpmScore = this._wpmScore(speech?.avgWpm || 0);

        return Math.min(100, Math.max(0, clarity * 0.45 + wpmScore * 0.3 + grammarBonus + 10 - fillerPenalty));
    }

    _calcBodyLanguage(face, hasFace) {
        if (!hasFace || !face) return 0;
        return Math.round(
            (face.eyeContact || 0) * 0.35 +
            (face.headStability || 0) * 0.3 +
            (face.confidence || 0) * 0.2 +
            (100 - (face.nervousness || 0)) * 0.15
        );
    }

    _calcTechnical(speech, answered, total, questions, answers, pauseData) {
        const completionRate = total > 0 ? (answered / total) * 100 : 0;
        const wordDepth = speech?.totalWords > 0
            ? Math.min(60, (speech.totalWords / Math.max(answered || 1, 1)) * 0.5)
            : 0;

        // Use stored relevance scores if available (more accurate)
        const relevance = this._calcRelevanceScore(answers);

        // Pause / Cheating penalty
        const pauseCount = pauseData?.pauseCount || 0;
        let pausePenalty = 0;
        if (pauseCount > 3) pausePenalty = Math.min(40, (pauseCount - 3) * 10);

        const raw = completionRate * 0.25 + wordDepth * 0.15 + relevance * 0.6;
        return Math.max(0, Math.round(raw - pausePenalty));
    }

    // ── Relevance: average of stored per-answer relevance scores ──────
    // Unanswered questions count as ZERO relevance
    _calcRelevanceScore(answers, totalQuestions) {
        if (!answers || answers.length === 0) return 0;

        const total = totalQuestions || answers.length;
        const answersWithScores = answers.filter(a =>
            a.relevanceScore !== undefined && a.relevanceScore !== null
        );

        if (answersWithScores.length > 0) {
            // Sum over ALL questions (not just answered ones) — unanswered = 0
            const sum = answersWithScores.reduce((acc, a) => acc + (a.relevanceScore || 0), 0);
            return Math.round(sum / total);
        }

        return this._calcTopicRelevance([], answers);
    }

    // ── Filler Score (0-100, higher = fewer fillers = better) ─────
    _calcFillerScore(speech, hasSpeech) {
        if (!hasSpeech || !speech) return 50;
        const fillerRatio = speech.totalWords > 0 ? (speech.fillerCount || 0) / speech.totalWords : 0;
        // 0 fillers = 100, 10%+ fillers = ~0
        return Math.round(Math.max(0, Math.min(100, 100 - fillerRatio * 600)));
    }

    // ── Topic Relevance: checks how many question keywords appear in answers ──
    // Returns 0-100. Off-topic = near 0. On-topic = near 100.
    _calcTopicRelevance(questions, answers) {
        if (!questions || !answers || answers.length === 0) return 0;

        const stopWords = new Set([
            'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
            'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall',
            'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
            'before', 'after', 'above', 'below', 'between', 'out', 'off', 'again', 'then', 'than',
            'so', 'if', 'or', 'and', 'but', 'how', 'what', 'when', 'where', 'which', 'who', 'why',
            'your', 'their', 'our', 'my', 'you', 'tell', 'me', 'us', 'about', 'describe', 'explain',
            'discuss', 'give', 'example', 'please', 'would', 'like', 'just', 'now', 'also', 'this',
            'that', 'these', 'those', 'they', 'we', 'he', 'she', 'it', 'its', 'some', 'any', 'all',
            'each', 'every', 'many', 'much', 'very', 'more', 'most', 'own', 'here', 'there', 'where'
        ]);

        let totalScore = 0;
        let evaluated = 0;

        answers.forEach(ans => {
            const questionText = (ans.question || (questions[ans.questionIndex]?.q) || '').toLowerCase();
            const answerText = (ans.answer || '').toLowerCase();

            if (!questionText || !answerText || answerText.split(' ').length < 3) return;

            // Extract 4+ letter non-stopword keywords from question
            const keywords = questionText.split(/\s+/)
                .map(w => w.replace(/[^a-z]/g, ''))
                .filter(w => w.length >= 4 && !stopWords.has(w));

            if (keywords.length === 0) return;

            // Check keyword match
            const matched = keywords.filter(k => answerText.includes(k)).length;
            const ratio = matched / keywords.length;

            // Also check general answer coherence (not all same repeated word)
            const ansWords = answerText.split(/\s+/).map(w => w.replace(/[^a-z]/g, '')).filter(w => w.length > 2);
            const uniqueAnsWords = new Set(ansWords);
            const diversityRatio = ansWords.length > 0 ? uniqueAnsWords.size / ansWords.length : 0;

            // Score: keyword match (70%) + word diversity (30%)
            // Pure nonsense like "aaa bbb ccc" will have 0 keyword match AND high diversity by coincidence
            // But real gibberish like "lorem ipsum" repeated has 0 keywords and low diversity
            const ansScore = Math.round((ratio * 70) + (Math.min(diversityRatio * 100, 100) * 0.3));

            totalScore += ansScore;
            evaluated++;
        });

        return evaluated > 0 ? Math.round(totalScore / evaluated) : 0;
    }

    _wpmScore(wpm) {
        if (wpm <= 0) return 0;
        if (wpm >= 110 && wpm <= 160) return 100;
        if (wpm >= 80 && wpm <= 190) return 75;
        if (wpm >= 60 && wpm <= 220) return 50;
        return 25;
    }

    _getVerdict(score) {
        if (score >= 80) return { level: 'top', label: '🟢🌟 Top Candidate Level', color: '#22c55e', description: 'Exceptional performance! You demonstrated outstanding communication and confidence.' };
        if (score >= 65) return { level: 'ready', label: '🟢 Interview Ready', color: '#22c55e', description: 'Great job! You are well-prepared for real interviews.' };
        if (score >= 45) return { level: 'almost', label: '🟡 Almost Ready', color: '#f59e0b', description: 'Good progress! A few more practice sessions will make a big difference.' };
        return { level: 'improve', label: '🔴 Needs Improvement', color: '#ef4444', description: 'Keep practicing! Focus on the areas highlighted below.' };
    }

    _getStrengths(conf, comm, body, gram, tech, face, speech) {
        const s = [];
        if (conf >= 65) s.push('Strong confidence and clarity throughout the interview');
        if (comm >= 65) s.push('Clear and articulate communication style');
        if (body >= 65) s.push('Good body language and eye contact');
        if (gram >= 80) s.push('Excellent grammar and vocabulary usage');
        if (tech >= 65) s.push('Thorough and detailed answers');
        if ((speech?.fillerCount || 0) < 3) s.push('Minimal use of filler words');
        if ((face?.smile || 0) > 30) s.push('Positive and engaging demeanor');
        if ((speech?.avgWpm || 0) >= 110 && (speech?.avgWpm || 0) <= 160) s.push('Excellent speaking pace — easy to follow');
        if (s.length === 0) s.push('Willingness to practice and improve');
        return s;
    }

    _getWeaknesses(conf, comm, body, gram, tech, face, speech, hasFace, hasSpeech, pauseData) {
        const w = [];
        if (!hasSpeech) w.push('No speech detected — ensure your microphone is working');
        if (!hasFace) w.push('No face detected — ensure your camera is working and well-lit');
        if (pauseData?.isCheating) w.push(`Excessive mic pauses detected (${pauseData.pauseCount}x) — this is considered cheating in real interviews`);
        if (hasSpeech && tech < 25) w.push('Answers appear off-topic or unrelated to the questions asked');
        if (hasSpeech && conf < 45) w.push('Low confidence — practice speaking with more conviction');
        if (hasSpeech && comm < 45) w.push('Communication clarity needs improvement');
        if (hasFace && body < 45) w.push('Body language appears tense or distracted');
        if (hasSpeech && gram < 60) w.push('Grammar errors detected — review sentence structure');
        if (hasSpeech && (speech?.fillerCount || 0) > 5) w.push('Excessive filler words — practice pausing instead of saying um/uh/like');
        if (hasSpeech && (speech?.avgWpm || 0) > 180) w.push('Speaking too fast — slow down for better clarity');
        if (hasSpeech && (speech?.avgWpm || 0) < 80 && (speech?.avgWpm || 0) > 0) w.push('Speaking too slowly — aim for 110–160 WPM');
        if (hasFace && (face?.nervousness || 0) > 60) w.push('High nervousness detected — try relaxation techniques before interviews');
        if (w.length === 0) w.push('Minor improvements possible with continued practice');
        return w;
    }

    _getSuggestions(weaknesses) {
        const map = {
            'confidence': 'Practice power poses and record yourself answering questions — reviewing your own recordings builds self-awareness fast.',
            'communication': 'Use the STAR method (Situation, Task, Action, Result) to structure every answer clearly.',
            'body language': 'Practice maintaining eye contact with the camera while speaking. Sit up straight with shoulders back.',
            'grammar': 'Read professional content daily. Practice writing structured responses before verbalizing them.',
            'filler': 'Replace filler words with a 1-second silent pause. Record yourself and count your fillers — awareness alone reduces them significantly.',
            'fast': 'Take a deliberate breath between sentences. Record yourself and listen back at 0.75x speed.',
            'slow': 'Practice with timed mock questions. Build topic confidence so you hesitate less.',
            'nervous': 'Try the 4-7-8 breathing technique before sessions (inhale 4s, hold 7s, exhale 8s).',
            'microphone': 'Check your browser microphone permissions. Use Chrome for best speech recognition support.',
            'camera': 'Allow camera access in browser settings. Ensure good lighting facing you.'
        };
        const suggestions = [];
        weaknesses.forEach(w => {
            const lower = w.toLowerCase();
            Object.entries(map).forEach(([key, sug]) => {
                if (lower.includes(key)) suggestions.push(sug);
            });
        });
        if (suggestions.length === 0) suggestions.push('Continue practicing regularly. Try harder difficulty levels to push your skills further.');
        return [...new Set(suggestions)].slice(0, 4);
    }
}

export const reportGenerator = new ReportGenerator();
