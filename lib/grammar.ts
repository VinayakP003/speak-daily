/**
 * Grammar Error Detection Module
 * Detects common grammatical errors in spoken English
 * Designed for language learning and improvement
 */

export interface GrammarError {
    type: 'subject-verb' | 'tense' | 'pronoun' | 'word-choice' | 'article' | 'double-negative' | 'comparison';
    sentence: string;
    error: string;
    correction: string;
    explanation: string;
    severity: 'minor' | 'moderate' | 'major';
}

export interface GrammarAnalysis {
    errorCount: number;
    errors: GrammarError[];
    grammarScore: number; // 0-100
}

/**
 * Analyze text for grammar errors
 */
export function analyzeGrammar(text: string): GrammarAnalysis {
    const errors: GrammarError[] = [];

    // Split into sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    for (const sentence of sentences) {
        const trimmed = sentence.trim();

        // Check subject-verb agreement
        errors.push(...checkSubjectVerbAgreement(trimmed));

        // Check tense consistency
        errors.push(...checkTenseConsistency(trimmed));

        // Check pronoun errors
        errors.push(...checkPronounErrors(trimmed));

        // Check common word confusions
        errors.push(...checkWordConfusions(trimmed));

        // Check article errors (a vs an)
        errors.push(...checkArticleErrors(trimmed));

        // Check double negatives
        errors.push(...checkDoubleNegatives(trimmed));

        // Check incomplete comparisons
        errors.push(...checkComparisons(trimmed));
    }

    // Calculate grammar score (100 = perfect, deduct for each error)
    const errorCount = errors.length;
    const wordCount = text.split(/\s+/).length;
    const errorRate = errorCount / Math.max(wordCount / 10, 1); // Errors per 10 words
    const grammarScore = Math.max(0, Math.round(100 - (errorRate * 20)));

    return {
        errorCount,
        errors: errors.slice(0, 5), // Max 5 examples
        grammarScore,
    };
}

/**
 * Check subject-verb agreement
 */
function checkSubjectVerbAgreement(sentence: string): GrammarError[] {
    const errors: GrammarError[] = [];
    const lower = sentence.toLowerCase();

    // Common patterns
    const patterns = [
        // Plural subject + singular verb
        { pattern: /\b(we|they|you)\s+(is|was|has)\b/i, subject: 'plural', verb: 'singular' },
        { pattern: /\b(he|she|it)\s+(are|were|have)\b/i, subject: 'singular', verb: 'plural' },
        { pattern: /\b(I)\s+(is|are|was)\b/i, subject: 'I', verb: 'wrong' },
        { pattern: /\b(you)\s+(is|was)\b/i, subject: 'you', verb: 'wrong' },
    ];

    for (const { pattern, subject, verb } of patterns) {
        const match = lower.match(pattern);
        if (match) {
            const errorText = match[0];
            const correction = getSubjectVerbCorrection(match[1], match[2]);

            errors.push({
                type: 'subject-verb',
                sentence: sentence,
                error: errorText,
                correction: correction,
                explanation: `Subject-verb agreement: "${match[1]}" requires "${correction.split(' ')[1]}", not "${match[2]}"`,
                severity: 'major',
            });
        }
    }

    return errors;
}

/**
 * Get correct subject-verb combination
 */
function getSubjectVerbCorrection(subject: string, verb: string): string {
    const s = subject.toLowerCase();
    const v = verb.toLowerCase();

    // Map to correct forms
    if (s === 'i') {
        if (v === 'is') return 'I am';
        if (v === 'are') return 'I am';
        if (v === 'was') return 'I was';
    }

    if (['we', 'they', 'you'].includes(s)) {
        if (v === 'is') return `${s} are`;
        if (v === 'was') return `${s} were`;
        if (v === 'has') return `${s} have`;
    }

    if (['he', 'she', 'it'].includes(s)) {
        if (v === 'are') return `${s} is`;
        if (v === 'were') return `${s} was`;
        if (v === 'have') return `${s} has`;
    }

    return subject + ' ' + verb;
}

/**
 * Check tense consistency within a sentence
 */
function checkTenseConsistency(sentence: string): GrammarError[] {
    const errors: GrammarError[] = [];
    const lower = sentence.toLowerCase();

    // Simple tense mixing detection (past + present in same sentence)
    const hasPast = /\b(was|were|had|did|went|ate|said|made|took|came)\b/.test(lower);
    const hasPresent = /\b(is|are|am|have|has|do|does|go|goes|eat|eats|say|says|make|makes)\b/.test(lower);

    if (hasPast && hasPresent && !lower.includes('used to') && !lower.includes('while')) {
        errors.push({
            type: 'tense',
            sentence: sentence,
            error: 'Mixed tenses',
            correction: 'Use consistent tense throughout',
            explanation: 'Mixing past and present tense in the same sentence can be confusing. Choose one tense and stick with it.',
            severity: 'moderate',
        });
    }

    return errors;
}

/**
 * Check pronoun errors
 */
function checkPronounErrors(sentence: string): GrammarError[] {
    const errors: GrammarError[] = [];
    const lower = sentence.toLowerCase();

    // Common pronoun errors
    const pronounPatterns = [
        { pattern: /\b(me and \w+)\s+(is|am|are|was|were)\b/i, error: 'me and X', correction: 'X and I' },
        { pattern: /\bbetween you and I\b/i, error: 'between you and I', correction: 'between you and me' },
        { pattern: /\b(him|her|them)\s+and\s+I\b/i, error: 'X and I (object)', correction: 'X and me' },
    ];

    for (const { pattern, error, correction } of pronounPatterns) {
        if (pattern.test(lower)) {
            errors.push({
                type: 'pronoun',
                sentence: sentence,
                error: error,
                correction: correction,
                explanation: `Use "${correction}" instead of "${error}" in this context.`,
                severity: 'moderate',
            });
        }
    }

    return errors;
}

/**
 * Check common word confusions
 */
function checkWordConfusions(sentence: string): GrammarError[] {
    const errors: GrammarError[] = [];
    const lower = sentence.toLowerCase();

    const confusions = [
        // Your vs You're
        { wrong: /\byour\s+(is|are|was|were|have|has)\b/i, correct: "you're", explanation: "Use 'you're' (you are) instead of 'your'" },
        { wrong: /\byou're\s+(car|house|name|job|work|project|idea|friend|family)\b/i, correct: 'your', explanation: "Use 'your' (possessive) instead of 'you're'" },

        // Its vs It's
        { wrong: /\bits\s+(is|was|has|been)\b/i, correct: "it's", explanation: "Use 'it's' (it is/has) instead of 'its'" },
        { wrong: /\bit's\s+(own|color|size|purpose|function)\b/i, correct: 'its', explanation: "Use 'its' (possessive) instead of 'it's'" },

        // Their vs They're vs There
        { wrong: /\btheir\s+(is|are|was|were|have|has)\b/i, correct: "they're", explanation: "Use 'they're' (they are) instead of 'their'" },
        { wrong: /\bthey're\s+(car|house|work|project|idea)\b/i, correct: 'their', explanation: "Use 'their' (possessive) instead of 'they're'" },

        // Then vs Than
        { wrong: /\bbetter then\b/i, correct: 'better than', explanation: "Use 'than' for comparisons" },
        { wrong: /\bmore then\b/i, correct: 'more than', explanation: "Use 'than' for comparisons" },
        { wrong: /\band than\b/i, correct: 'and then', explanation: "Use 'then' for sequence" },
    ];

    for (const { wrong, correct, explanation } of confusions) {
        const match = sentence.match(wrong);
        if (match) {
            errors.push({
                type: 'word-choice',
                sentence: sentence,
                error: match[0],
                correction: correct,
                explanation: explanation,
                severity: 'moderate',
            });
        }
    }

    return errors;
}

/**
 * Check article errors (a vs an)
 */
function checkArticleErrors(sentence: string): GrammarError[] {
    const errors: GrammarError[] = [];

    // "a" before vowel sound
    const aBeforeVowel = sentence.match(/\ba\s+([aeiou]\w+)\b/gi);
    if (aBeforeVowel) {
        for (const match of aBeforeVowel) {
            // Skip exceptions (e.g., "a university" - sounds like "yoo")
            if (!/\ba\s+(university|ユ|one|european)\b/i.test(match)) {
                errors.push({
                    type: 'article',
                    sentence: sentence,
                    error: match,
                    correction: match.replace(/\ba\s+/i, 'an '),
                    explanation: 'Use "an" before words starting with vowel sounds',
                    severity: 'minor',
                });
            }
        }
    }

    // "an" before consonant sound
    const anBeforeConsonant = sentence.match(/\ban\s+([bcdfghjklmnpqrstvwxyz]\w+)\b/gi);
    if (anBeforeConsonant) {
        for (const match of anBeforeConsonant) {
            // Skip exceptions (e.g., "an hour" - h is silent)
            if (!/\ban\s+(hour|honest|honor)\b/i.test(match)) {
                errors.push({
                    type: 'article',
                    sentence: sentence,
                    error: match,
                    correction: match.replace(/\ban\s+/i, 'a '),
                    explanation: 'Use "a" before words starting with consonant sounds',
                    severity: 'minor',
                });
            }
        }
    }

    return errors;
}

/**
 * Check for double negatives
 */
function checkDoubleNegatives(sentence: string): GrammarError[] {
    const errors: GrammarError[] = [];
    const lower = sentence.toLowerCase();

    // Common double negative patterns
    const patterns = [
        /\b(don't|doesn't|didn't|won't|can't|couldn't|shouldn't|wouldn't)\s+\w+\s+(no|nothing|nobody|nowhere|never|none)\b/i,
        /\b(no|nothing|nobody|nowhere|never)\s+\w+\s+(not|n't)\b/i,
    ];

    for (const pattern of patterns) {
        const match = sentence.match(pattern);
        if (match) {
            errors.push({
                type: 'double-negative',
                sentence: sentence,
                error: match[0],
                correction: 'Remove one negative',
                explanation: 'Double negatives can be confusing. Use a single negative for clarity.',
                severity: 'moderate',
            });
        }
    }

    return errors;
}

/**
 * Check for incomplete comparisons
 */
function checkComparisons(sentence: string): GrammarError[] {
    const errors: GrammarError[] = [];

    // Incomplete comparisons like "more better", "most easiest"
    const doubleComparative = sentence.match(/\b(more|most|less|least)\s+(better|worse|bigger|smaller|faster|slower|\w+er|easiest|hardest|\w+est)\b/i);
    if (doubleComparative) {
        errors.push({
            type: 'comparison',
            sentence: sentence,
            error: doubleComparative[0],
            correction: doubleComparative[2], // Just the adjective
            explanation: 'Avoid double comparatives. Use either "more/most" OR "-er/-est", not both.',
            severity: 'moderate',
        });
    }

    return errors;
}

/**
 * Get a friendly suggestion message for grammar errors
 */
export function getGrammarSuggestion(analysis: GrammarAnalysis, wordCount: number): string {
    if (analysis.errorCount === 0) {
        return '✅ Grammar: Excellent! No errors detected.';
    }

    const errorRate = ((analysis.errorCount / wordCount) * 100).toFixed(1);
    const topError = analysis.errors[0];

    if (analysis.errorCount === 1) {
        return `⚠️ Grammar: 1 error detected\n\n"${topError.error}" → "${topError.correction}"\n${topError.explanation}`;
    }

    return `⚠️ Grammar: ${analysis.errorCount} errors detected (${errorRate}% error rate)\n\nMost common:\n"${topError.error}" → "${topError.correction}"\n${topError.explanation}`;
}
