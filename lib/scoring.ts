/**
 * Improved Scoring Module with Transparency
 * 
 * Converts normalized transcript data into objective scores with detailed explanations.
 */

import { NormalizedTranscript } from './normalize';

export interface MetricScores {
    fluency: number;      // 0-100: Speaking pace and flow
    clarity: number;      // 0-100: Filler word usage
    structure: number;    // 0-100: Sentence completeness
    richness: number;     // 0-100: Vocabulary diversity
}

export interface MetricDetails {
    score: number;
    label: string;        // e.g., "Excellent", "Good", "Needs work"
    explanation: string;  // Detailed explanation of the score
    data: string;         // Raw data (e.g., "138 WPM", "3 fillers")
}

export interface SpeechScore {
    metrics: MetricScores;
    overall: number;      // 0-100: Weighted average
    breakdown: {
        fluency: string;
        clarity: string;
        structure: string;
        richness: string;
    };
    details: {
        fluency: MetricDetails;
        clarity: MetricDetails;
        structure: MetricDetails;
        richness: MetricDetails;
    };
}

// Improved target ranges
const TARGETS = {
    // Fluency (Words Per Minute)
    WPM_MIN: 90,               // Below = too slow
    WPM_OPTIMAL_LOW: 120,      // Optimal range starts
    WPM_OPTIMAL_HIGH: 150,     // Optimal range ends  
    WPM_MAX: 180,              // Above = too fast

    // Clarity (Filler percentage)
    FILLER_EXCELLENT: 0.02,    // <2% = excellent
    FILLER_GOOD: 0.05,         // <5% = good
    FILLER_ACCEPTABLE: 0.10,   // <10% = acceptable

    // Structure (Completion rate)
    STRUCTURE_EXCELLENT: 0.85, // >85% = excellent
    STRUCTURE_GOOD: 0.70,      // >70% = good

    // Richness (Unique word ratio)
    RICHNESS_EXCELLENT: 0.70,  // >70% = excellent
    RICHNESS_GOOD: 0.55,       // >55% = good
};

/**
 * Calculate all scores from normalized transcript
 */
export function calculateScores(transcript: NormalizedTranscript): SpeechScore {
    const fluencyResult = calculateFluency(transcript);
    const clarityResult = calculateClarity(transcript);
    const structureResult = calculateStructure(transcript);
    const richnessResult = calculateRichness(transcript);

    const metrics = {
        fluency: fluencyResult.score,
        clarity: clarityResult.score,
        structure: structureResult.score,
        richness: richnessResult.score,
    };

    const overall = calculateOverallScore(metrics);

    const breakdown = {
        fluency: getFlucencyBreakdown(fluencyResult.score, transcript),
        clarity: getClarityBreakdown(clarityResult.score, transcript),
        structure: getStructureBreakdown(structureResult.score, transcript),
        richness: getRichnessBreakdown(richnessResult.score, transcript),
    };

    const details = {
        fluency: fluencyResult,
        clarity: clarityResult,
        structure: structureResult,
        richness: richnessResult,
    };

    return { metrics, overall, breakdown, details };
}

/**
 * FLUENCY: Speaking pace (WPM = Words Per Minute)
 * 
 * How it's calculated:
 * 1. WPM = (clean words / duration in seconds) × 60
 * 2. Score based on optimal range (120-150 WPM)
 * 3. Too slow or too fast = lower score
 */
function calculateFluency(transcript: NormalizedTranscript): MetricDetails {
    if (transcript.estimatedDuration === 0 || transcript.cleanWordCount === 0) {
        return {
            score: 50,
            label: 'Insufficient data',
            explanation: 'Not enough speech to measure pace',
            data: '0 WPM',
        };
    }

    const wpm = Math.round((transcript.cleanWordCount / transcript.estimatedDuration) * 60);
    let score = 0;
    let label = '';
    let explanation = '';

    if (wpm < TARGETS.WPM_MIN) {
        // Too slow: 0-70 points
        score = Math.max(40, (wpm / TARGETS.WPM_MIN) * 70);
        label = 'Too slow';
        explanation = `You're speaking slower than average. Try to speak with more confidence and momentum.`;
    } else if (wpm >= TARGETS.WPM_MIN && wpm < TARGETS.WPM_OPTIMAL_LOW) {
        // Slow but acceptable: 70-85 points
        score = 70 + ((wpm - TARGETS.WPM_MIN) / (TARGETS.WPM_OPTIMAL_LOW - TARGETS.WPM_MIN)) * 15;
        label = 'A bit slow';
        explanation = `Your pace is okay, but you can speak a bit faster. Aim for ${TARGETS.WPM_OPTIMAL_LOW}-${TARGETS.WPM_OPTIMAL_HIGH} words/minute.`;
    } else if (wpm >= TARGETS.WPM_OPTIMAL_LOW && wpm <= TARGETS.WPM_OPTIMAL_HIGH) {
        // Optimal range: 85-100 points
        const midpoint = (TARGETS.WPM_OPTIMAL_LOW + TARGETS.WPM_OPTIMAL_HIGH) / 2;
        const distance = Math.abs(wpm - midpoint);
        const maxDistance = TARGETS.WPM_OPTIMAL_HIGH - midpoint;
        score = 100 - (distance / maxDistance) * 15;
        label = 'Excellent pace';
        explanation = `Perfect! You're speaking at a natural, conversational pace.`;
    } else if (wpm > TARGETS.WPM_OPTIMAL_HIGH && wpm <= TARGETS.WPM_MAX) {
        // Fast but acceptable: 75-85 points
        score = 85 - ((wpm - TARGETS.WPM_OPTIMAL_HIGH) / (TARGETS.WPM_MAX - TARGETS.WPM_OPTIMAL_HIGH)) * 10;
        label = 'A bit fast';
        explanation = `You're speaking quickly. Slow down slightly to ensure clarity.`;
    } else {
        // Too fast: 50-75 points
        score = Math.max(50, 75 - ((wpm - TARGETS.WPM_MAX) / 20) * 10);
        label = 'Too fast';
        explanation = `You're rushing. Take pauses between thoughts to stay clear.`;
    }

    return {
        score: Math.round(score),
        label,
        explanation,
        data: `${wpm} WPM`,
    };
}

/**
 * CLARITY: Filler word usage + Professionalism
 * 
 * How it's calculated:
 * 1. Filler % = (filler words / total words) × 100
 * 2. Lower % = higher score
 * 3. 0-2% = excellent, 2-5% = good, 5-10% = acceptable, >10% = needs work
 * 4. PROFANITY PENALTY: -20 to -40 points for vulgar language
 */
function calculateClarity(transcript: NormalizedTranscript): MetricDetails {
    if (transcript.wordCount === 0) {
        return {
            score: 50,
            label: 'Insufficient data',
            explanation: 'Not enough speech to measure clarity',
            data: '0 fillers',
        };
    }

    const fillerPercentage = transcript.fillerCount / transcript.wordCount;
    let score = 0;
    let label = '';
    let explanation = '';

    if (fillerPercentage === 0) {
        score = 100;
        label = 'Perfect';
        explanation = `Outstanding! No filler words detected. Your speech is very clear.`;
    } else if (fillerPercentage <= TARGETS.FILLER_EXCELLENT) {
        score = 95 + ((TARGETS.FILLER_EXCELLENT - fillerPercentage) / TARGETS.FILLER_EXCELLENT) * 5;
        label = 'Excellent';
        explanation = `Very few fillers (${(fillerPercentage * 100).toFixed(1)}%). Your speech is very clear.`;
    } else if (fillerPercentage <= TARGETS.FILLER_GOOD) {
        score = 85 + ((TARGETS.FILLER_GOOD - fillerPercentage) / (TARGETS.FILLER_GOOD - TARGETS.FILLER_EXCELLENT)) * 10;
        label = 'Good';
        explanation = `Some fillers detected (${(fillerPercentage * 100).toFixed(1)}%), but still clear overall.`;
    } else if (fillerPercentage <= TARGETS.FILLER_ACCEPTABLE) {
        score = 70 + ((TARGETS.FILLER_ACCEPTABLE - fillerPercentage) / (TARGETS.FILLER_ACCEPTABLE - TARGETS.FILLER_GOOD)) * 15;
        label = 'Needs work';
        explanation = `Noticeable fillers (${(fillerPercentage * 100).toFixed(1)}%). Try pausing instead of using "um" or "like".`;
    } else {
        score = Math.max(40, 70 - ((fillerPercentage - TARGETS.FILLER_ACCEPTABLE) * 200));
        label = 'High filler usage';
        explanation = `Many fillers (${(fillerPercentage * 100).toFixed(1)}%). Replace fillers with brief pauses for thinking time.`;
    }

    // PROFANITY PENALTY - SEVERE punishment for unprofessional language
    if (transcript.profanityDetected) {
        const profanityPercentage = transcript.profanityCount / transcript.wordCount;
        // SEVERE penalty: -40 to -70 points depending on frequency
        // Even 1 profane word in 50 words (2%) = -60 penalty
        const profanityPenalty = Math.min(70, 40 + (profanityPercentage * 100 * 15));
        score -= profanityPenalty;

        label = 'Unprofessional language';
        explanation = `${transcript.profanityCount} vulgar word${transcript.profanityCount !== 1 ? 's' : ''} detected. This is unacceptable in professional communication. ${explanation}`;
    }

    return {
        score: Math.round(Math.max(10, score)), // Floor at 10 for severe profanity
        label,
        explanation,
        data: transcript.profanityDetected
            ? `${transcript.fillerCount} fillers + ${transcript.profanityCount} profane`
            : `${transcript.fillerCount} filler${transcript.fillerCount !== 1 ? 's' : ''} (${(fillerPercentage * 100).toFixed(1)}%)`,
    };
}

/**
 * STRUCTURE: Sentence completeness
 * 
 * How it's calculated:
 * 1. Completion % = (complete sentences / total sentences) × 100
 * 2. Higher % = higher score
 * 3. >85% = excellent, >70% = good, <70% = needs work
 */
function calculateStructure(transcript: NormalizedTranscript): MetricDetails {
    const totalSentences = transcript.completeSentences + transcript.incompleteSentences;

    if (totalSentences === 0) {
        return {
            score: 50,
            label: 'Insufficient data',
            explanation: 'Not enough sentences to measure structure',
            data: '0 sentences',
        };
    }

    const completionRate = transcript.completeSentences / totalSentences;
    let score = 0;
    let label = '';
    let explanation = '';

    if (completionRate >= TARGETS.STRUCTURE_EXCELLENT) {
        score = 90 + ((completionRate - TARGETS.STRUCTURE_EXCELLENT) / (1 - TARGETS.STRUCTURE_EXCELLENT)) * 10;
        label = 'Excellent';
        explanation = `${Math.round(completionRate * 100)}% of your sentences are complete. Great structure!`;
    } else if (completionRate >= TARGETS.STRUCTURE_GOOD) {
        score = 75 + ((completionRate - TARGETS.STRUCTURE_GOOD) / (TARGETS.STRUCTURE_EXCELLENT - TARGETS.STRUCTURE_GOOD)) * 15;
        label = 'Good';
        explanation = `${Math.round(completionRate * 100)}% complete sentences. Mostly well-structured.`;
    } else if (completionRate >= 0.5) {
        score = 60 + ((completionRate - 0.5) / (TARGETS.STRUCTURE_GOOD - 0.5)) * 15;
        label = 'Needs improvement';
        explanation = `${Math.round(completionRate * 100)}% complete. ${transcript.incompleteSentences} sentence${transcript.incompleteSentences !== 1 ? 's' : ''} felt incomplete.`;
    } else {
        score = Math.max(40, 60 * completionRate / 0.5);
        label = 'Many fragments';
        explanation = `Only ${Math.round(completionRate * 100)}% complete sentences. Focus on finishing each thought before starting a new one.`;
    }

    return {
        score: Math.round(score),
        label,
        explanation,
        data: `${transcript.completeSentences}/${totalSentences} complete`,
    };
}

/**
 * RICHNESS: Vocabulary diversity
 * 
 * How it's calculated:
 * 1. Uniqueness % = (unique words / total clean words) × 100
 * 2. Higher % = higher score
 * 3. >70% = excellent, >55% = good, <55% = needs work
 */
function calculateRichness(transcript: NormalizedTranscript): MetricDetails {
    if (transcript.cleanWordCount === 0) {
        return {
            score: 50,
            label: 'Insufficient data',
            explanation: 'Not enough words to measure vocabulary',
            data: '0 words',
        };
    }

    const richnessRatio = transcript.uniqueWords.size / transcript.cleanWordCount;
    let score = 0;
    let label = '';
    let explanation = '';

    if (richnessRatio >= TARGETS.RICHNESS_EXCELLENT) {
        score = 90 + ((richnessRatio - TARGETS.RICHNESS_EXCELLENT) / (1 - TARGETS.RICHNESS_EXCELLENT)) * 10;
        label = 'Excellent';
        explanation = `${Math.round(richnessRatio * 100)}% unique words. Great vocabulary variety!`;
    } else if (richnessRatio >= TARGETS.RICHNESS_GOOD) {
        score = 75 + ((richnessRatio - TARGETS.RICHNESS_GOOD) / (TARGETS.RICHNESS_EXCELLENT - TARGETS.RICHNESS_GOOD)) * 15;
        label = 'Good';
        explanation = `${Math.round(richnessRatio * 100)}% unique words. Good variety.`;
    } else if (richnessRatio >= 0.4) {
        score = 60 + ((richnessRatio - 0.4) / (TARGETS.RICHNESS_GOOD - 0.4)) * 15;
        label = 'Some repetition';
        explanation = `${Math.round(richnessRatio * 100)}% unique words. Try using more varied vocabulary.`;
    } else {
        score = Math.max(40, 60 * richnessRatio / 0.4);
        label = 'Repetitive';
        explanation = `Only ${Math.round(richnessRatio * 100)}% unique words. You're repeating words often.`;
    }

    // Penalty for excessive repetition
    if (transcript.repetitions > 5) {
        const penalty = Math.min(15, (transcript.repetitions - 5) * 2);
        score -= penalty;
        explanation += ` (${transcript.repetitions} repeated phrases detected)`;
    }

    return {
        score: Math.round(Math.max(40, score)),
        label,
        explanation,
        data: `${transcript.uniqueWords.size}/${transcript.cleanWordCount} unique (${Math.round(richnessRatio * 100)}%)`,
    };
}

/**
 * OVERALL SCORE: Weighted average
 * 
 * Weights:
 * - Fluency: 30% (pace is important for confidence)
 * - Clarity: 30% (fillers are very noticeable)
 * - Structure: 25% (completing thoughts matters)
 * - Richness: 15% (vocabulary is nice but less critical for beginners)
 */
function calculateOverallScore(metrics: MetricScores): number {
    const weights = {
        fluency: 0.30,
        clarity: 0.30,
        structure: 0.25,
        richness: 0.15,
    };

    const weighted =
        metrics.fluency * weights.fluency +
        metrics.clarity * weights.clarity +
        metrics.structure * weights.structure +
        metrics.richness * weights.richness;

    // Apply slight curve to make progress feel rewarding
    const curved = Math.pow(weighted / 100, 0.9) * 100;

    return Math.round(Math.min(100, Math.max(40, curved)));
}

// Legacy breakdown functions (kept for backward compatibility)
function getFlucencyBreakdown(score: number, transcript: NormalizedTranscript): string {
    const wpm = Math.round((transcript.cleanWordCount / transcript.estimatedDuration) * 60);
    if (score >= 90) return `Excellent pace (${wpm} WPM)`;
    if (score >= 75) return `Good pace (${wpm} WPM)`;
    if (score >= 60) return `Could be faster (${wpm} WPM)`;
    return `Try speaking faster (${wpm} WPM)`;
}

function getClarityBreakdown(score: number, transcript: NormalizedTranscript): string {
    if (score >= 95) return 'Perfect clarity';
    if (score >= 85) return 'Very clear';
    if (score >= 70) return 'Some fillers noticed';
    return `${transcript.fillerCount} filler words`;
}

function getStructureBreakdown(score: number, transcript: NormalizedTranscript): string {
    const total = transcript.completeSentences + transcript.incompleteSentences;
    const rate = Math.round((transcript.completeSentences / total) * 100);
    if (score >= 90) return 'Excellent structure';
    if (score >= 75) return `${rate}% complete`;
    if (score >= 60) return `${rate}% complete`;
    return `Many incomplete (${rate}%)`;
}

function getRichnessBreakdown(score: number, transcript: NormalizedTranscript): string {
    const rate = Math.round((transcript.uniqueWords.size / transcript.cleanWordCount) * 100);
    if (score >= 90) return `Rich vocabulary (${rate}%)`;
    if (score >= 75) return `Good variety (${rate}%)`;
    if (score >= 60) return `Some repetition (${rate}%)`;
    return `Repetitive (${rate}%)`;
}

export function getMotivationalMessage(score: number): string {
    if (score >= 90) return "Outstanding! You're speaking with great confidence! 🌟";
    if (score >= 80) return "Excellent work! Keep up this momentum! 🎉";
    if (score >= 70) return "Great job! You're improving with each session! 👏";
    if (score >= 60) return "Good progress! Focus on one area at a time! 💪";
    if (score >= 50) return "Keep practicing! You're building a strong foundation! 🚀";
    return "Every session makes you better! Stay consistent! 💪";
}
