/**
 * Sentence-by-Sentence Analysis Module
 * Provides detailed breakdown of speech quality at sentence level
 */

import { GrammarError } from './grammar';

export interface SentenceAnalysis {
    sentence: string;
    index: number;
    wordCount: number;
    status: 'perfect' | 'good' | 'needs-work' | 'critical';
    issues: SentenceIssue[];
    score: number; // 0-100 for this sentence
}

export interface SentenceIssue {
    type: 'filler' | 'profanity' | 'grammar' | 'incomplete';
    severity: 'minor' | 'moderate' | 'critical';
    description: string;
    word?: string; // The problematic word/phrase
    correction?: string; // Suggested correction
}

/**
 * Analyze each sentence individually
 */
export function analyzeSentences(
    sentences: string[],
    fillerWords: Map<string, number>,
    profanityExamples: Array<{ word: string; sentence: string; suggestion: string }>,
    grammarErrors: GrammarError[],
    completeSentences: number,
    incompleteSentences: number
): SentenceAnalysis[] {
    const analyses: SentenceAnalysis[] = [];

    sentences.forEach((sentence, index) => {
        const trimmed = sentence.trim();
        if (!trimmed) return;

        const issues: SentenceIssue[] = [];
        const words = trimmed.split(/\s+/);
        const wordCount = words.length;

        // Check for fillers in this sentence
        const fillerMatches = findFillersInSentence(trimmed, fillerWords);
        fillerMatches.forEach(filler => {
            issues.push({
                type: 'filler',
                severity: 'minor',
                description: `Contains filler word "${filler}"`,
                word: filler,
                correction: '(pause instead)',
            });
        });

        // Check for profanity in this sentence
        const profanityMatch = profanityExamples.find(ex =>
            ex.sentence.toLowerCase().includes(trimmed.toLowerCase())
        );
        if (profanityMatch) {
            issues.push({
                type: 'profanity',
                severity: 'critical',
                description: `Contains profanity: "${profanityMatch.word}"`,
                word: profanityMatch.word,
                correction: profanityMatch.suggestion,
            });
        }

        // Check for grammar errors in this sentence
        const grammarMatch = grammarErrors.filter(err =>
            err.sentence.toLowerCase().includes(trimmed.toLowerCase())
        );
        grammarMatch.forEach(err => {
            issues.push({
                type: 'grammar',
                severity: err.severity === 'major' ? 'critical' : 'moderate',
                description: err.explanation,
                word: err.error,
                correction: err.correction,
            });
        });

        // Check if sentence is incomplete
        if (isIncomplete(trimmed)) {
            issues.push({
                type: 'incomplete',
                severity: 'moderate',
                description: 'Sentence appears incomplete',
                correction: 'Add a complete ending',
            });
        }

        // Calculate sentence status and score
        const { status, score } = calculateSentenceStatus(issues, wordCount);

        analyses.push({
            sentence: trimmed,
            index,
            wordCount,
            status,
            issues,
            score,
        });
    });

    return analyses;
}

/**
 * Find filler words in a specific sentence
 */
function findFillersInSentence(sentence: string, fillerWords: Map<string, number>): string[] {
    const found: string[] = [];
    const lower = sentence.toLowerCase();
    const words = lower.split(/\s+/);

    const FILLER_LIST = ['um', 'uh', 'like', 'you know', 'kind of', 'sort of', 'basically', 'actually', 'literally'];

    for (const filler of FILLER_LIST) {
        if (filler.includes(' ')) {
            // Multi-word filler
            if (lower.includes(filler)) {
                found.push(filler);
            }
        } else {
            // Single word filler
            if (words.includes(filler)) {
                found.push(filler);
            }
        }
    }

    return found;
}

/**
 * Check if a sentence appears incomplete
 */
function isIncomplete(sentence: string): boolean {
    const words = sentence.split(/\s+/);
    if (words.length < 3) return true;

    const lastWord = words[words.length - 1].toLowerCase().replace(/[^a-z]/g, '');
    const trailingConjunctions = ['and', 'but', 'or', 'so', 'because', 'if', 'when', 'while', 'though', 'although'];

    return trailingConjunctions.includes(lastWord);
}

/**
 * Calculate sentence status based on issues
 */
function calculateSentenceStatus(issues: SentenceIssue[], wordCount: number): { status: 'perfect' | 'good' | 'needs-work' | 'critical', score: number } {
    if (issues.length === 0) {
        return { status: 'perfect', score: 100 };
    }

    const hasCritical = issues.some(i => i.severity === 'critical');
    const hasModerate = issues.some(i => i.severity === 'moderate');
    const hasMinor = issues.some(i => i.severity === 'minor');

    if (hasCritical) {
        return { status: 'critical', score: Math.max(20, 50 - (issues.length * 10)) };
    }

    if (hasModerate) {
        return { status: 'needs-work', score: Math.max(40, 70 - (issues.length * 10)) };
    }

    if (hasMinor) {
        return { status: 'good', score: Math.max(70, 90 - (issues.length * 5)) };
    }

    return { status: 'perfect', score: 100 };
}

/**
 * Get a summary of all sentence analyses
 */
export function getSentenceSummary(analyses: SentenceAnalysis[]): {
    total: number;
    perfect: number;
    good: number;
    needsWork: number;
    critical: number;
    averageScore: number;
} {
    const total = analyses.length;
    const perfect = analyses.filter(a => a.status === 'perfect').length;
    const good = analyses.filter(a => a.status === 'good').length;
    const needsWork = analyses.filter(a => a.status === 'needs-work').length;
    const critical = analyses.filter(a => a.status === 'critical').length;
    const averageScore = total > 0
        ? Math.round(analyses.reduce((sum, a) => sum + a.score, 0) / total)
        : 100;

    return {
        total,
        perfect,
        good,
        needsWork,
        critical,
        averageScore,
    };
}

/**
 * Get visual indicator for sentence status
 */
export function getStatusIcon(status: 'perfect' | 'good' | 'needs-work' | 'critical'): string {
    switch (status) {
        case 'perfect': return '✅';
        case 'good': return '✓';
        case 'needs-work': return '⚠️';
        case 'critical': return '🔴';
    }
}

/**
 * Get color for sentence status
 */
export function getStatusColor(status: 'perfect' | 'good' | 'needs-work' | 'critical'): string {
    switch (status) {
        case 'perfect': return '#10B981'; // Green
        case 'good': return '#3B82F6'; // Blue
        case 'needs-work': return '#F59E0B'; // Yellow
        case 'critical': return '#EF4444'; // Red
    }
}
