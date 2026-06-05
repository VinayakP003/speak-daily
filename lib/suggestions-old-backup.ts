/**
 * Improved Suggestion Generation Module
 * 
 * Generates specific, actionable feedback with REAL examples from user's speech
 * NOW with context-specific profanity highlighting
 */

import { NormalizedTranscript, getTopFiller } from './normalize';
import { SpeechScore } from './scoring';

export interface Suggestion {
    title: string;        // e.g., "Focus on sentence structure"
    message: string;      // Specific data-driven message
    tip: string;          // Actionable advice
    example: string;      // Concrete example FROM THE USER'S SPEECH
    metric: string;       // Which metric this addresses
    userExample?: string; // Actual problematic phrase from user
}


/**
 * Generate specific suggestions based on the weakest metric
 * PRIORITY: If profanity detected, that takes precedence over all other feedback
 */
export function generateSuggestions(
    score: SpeechScore,
    transcript: NormalizedTranscript
): Suggestion[] {
    // PRIORITY CHECK: Profanity overrides all other feedback
    if (transcript.profanityDetected) {
        return [getProfessionalismSuggestion(transcript)];
    }

    // Find the weakest metric
    const metrics = Object.entries(score.metrics).sort(([, a], [, b]) => a - b);
    const [weakestMetric, weakestScore] = metrics[0];

    const suggestion = getSuggestionForMetric(
        weakestMetric as keyof typeof score.metrics,
        weakestScore,
        transcript,
        score
    );

    return [suggestion];
}


/**
 * Get specific suggestion for a metric
 */
function getSuggestionForMetric(
    metric: 'fluency' | 'clarity' | 'structure' | 'richness',
    metricScore: number,
    transcript: NormalizedTranscript,
    fullScore: SpeechScore
): Suggestion {
    switch (metric) {
        case 'fluency':
            return getFluencySuggestion(metricScore, transcript);
        case 'clarity':
            return getClaritySuggestion(metricScore, transcript);
        case 'structure':
            return getStructureSuggestion(metricScore, transcript);
        case 'richness':
            return getRichnessSuggestion(metricScore, transcript);
    }
}

/**
 * FLUENCY suggestions with pace analysis
 */
function getFluencySuggestion(score: number, transcript: NormalizedTranscript): Suggestion {
    const wpm = Math.round((transcript.cleanWordCount / transcript.estimatedDuration) * 60);

    if (wpm < 100) {
        return {
            title: 'Increase your speaking pace',
            message: `At ${wpm} WPM, you're speaking slower than conversational pace (target: 120-150 WPM). This can make you sound hesitant.`,
            tip: 'Practice speaking continuously for 10 seconds without pausing. Imagine explaining something exciting to a friend.',
            example: 'Try this exercise: Set a 30-second timer and speak about your morning routine without pausing. Count how many sentences you complete. Aim for at least 5-6 complete sentences.',
            metric: 'fluency',
        };
    } else if (wpm > 160) {
        return {
            title: 'Slow down for better clarity',
            message: `You spoke at ${wpm} WPM, which is faster than average (target: 120-150 WPM). Rapid speech can reduce clarity.`,
            tip: 'Add 1-second pauses between sentences. This gives your listener time to process and makes you sound more thoughtful.',
            example: 'After each complete thought, count "one-thousand" in your head before starting the next sentence.',
            metric: 'fluency',
        };
    } else {
        return {
            title: 'Maintain your natural pace',
            message: `Your pace of ${wpm} WPM is in the optimal range. This sounds natural and confident.`,
            tip: 'Keep this rhythm consistent across all practice sessions.',
            example: 'You\'ve found your natural speaking speed—try to match this in future sessions.',
            metric: 'fluency',
        };
    }
}

/**
 * CLARITY suggestions with actual filler usage
 */
function getClaritySuggestion(score: number, transcript: NormalizedTranscript): Suggestion {
    const topFiller = getTopFiller(transcript);
    const fillerCount = transcript.fillerCount;
    const fillerPercentage = (fillerCount / transcript.wordCount * 100).toFixed(1);

    if (fillerCount === 0) {
        return {
            title: 'Perfect clarity maintained!',
            message: 'Zero filler words. This is professional-level clarity.',
            tip: 'Document what you did right: Were you more prepared? More confident? Replicate this approach.',
            example: 'Your speech was clean and direct. This is exactly how polished speakers sound.',
            metric: 'clarity',
        };
    } else if (fillerCount <= 3) {
        const fillerList = Array.from(transcript.fillerWords.entries())
            .filter(([, count]) => count > 0)
            .map(([word, count]) => `"${word}" (${count}x)`)
            .join(', ');

        return {
            title: `Nearly perfect—just ${fillerCount} filler${fillerCount > 1 ? 's' : ''}`,
            message: `Fillers detected: ${fillerList}. You're ${fillerPercentage}% away from perfect clarity.`,
            tip: 'RIGHT when you feel a filler coming, bite your tongue and pause for 1 second instead. Your brain will use that time to find the real word.',
            example: 'Practice this drill: Record yourself describing your room. Every time you want to say "um" or "like", snap your fingers instead. You\'ll become aware of the habit.',
            metric: 'clarity',
        };
    } else {
        const mainFiller = topFiller;
        const mainFillerCount = transcript.fillerWords.get(mainFiller) || 0;

        return {
            title: `You said "${mainFiller}" ${mainFillerCount} times`,
            message: `Total fillers: ${fillerCount} (${fillerPercentage}% of your speech). These hurt your credibility.`,
            tip: 'Silence is powerful. When you catch yourself about to say a filler, STOP. Take a 2-second breath. Then continue with your real thought.',
            example: `Exercise: Re-record your speech. Every time you would normally say "${mainFiller}", replace it with a 2-second pause. You'll sound 10x more authoritative.`,
            metric: 'clarity',
            userExample: `Most common filler: "${mainFiller}" appeared ${mainFillerCount} times`,
        };
    }
}

/**
 * STRUCTURE suggestions with sentence analysis
 */
function getStructureSuggestion(score: number, transcript: NormalizedTranscript): Suggestion {
    const total = transcript.completeSentences + transcript.incompleteSentences;
    const completeRate = Math.round((transcript.completeSentences / total) * 100);
    const incomplete = transcript.incompleteSentences;

    // Find actual incomplete sentences from the transcript
    const incompleteSentences = transcript.sentences.filter(s => {
        const words = s.split(/\s+/);
        if (words.length < 3) return true;
        const lastWord = words[words.length - 1].toLowerCase().replace(/[^a-z]/g, '');
        return ['and', 'but', 'or', 'so', 'because', 'if', 'when', 'while'].includes(lastWord);
    });

    if (incomplete === 0) {
        return {
            title: 'Excellent sentence structure!',
            message: '100% of your sentences were complete. This shows clear, organized thinking.',
            tip: 'You finished every thought before moving on. This is a professional speaking habit.',
            example: 'Keep applying this skill: Think → Speak → Complete. Don\'t start a new sentence until the previous one is done.',
            metric: 'structure',
        };
    } else if (incomplete <= 2) {
        const exampleSentence = incompleteSentences[0] || 'sentence fragment';

        return {
            title: `${incomplete} incomplete sentence${incomplete > 1 ? 's' : ''} detected`,
            message: `You completed ${completeRate}% of your sentences. Almost there!`,
            tip: 'Before starting a new thought, ask yourself: "Did I finish the previous sentence?" If not, complete it.',
            example: `You said: "${exampleSentence}..." — This feels unfinished. Add a conclusion: "${exampleSentence}, which helped me start my day."`,
            metric: 'structure',
            userExample: `Incomplete: "${exampleSentence}"`,
        };
    } else {
        const examples = incompleteSentences.slice(0, 2);

        return {
            title: `${incomplete}/${total} sentences incomplete (${100 - completeRate}% fragmented)`,
            message: `Many thoughts are left hanging. This makes you harder to follow.`,
            tip: 'Use this formula: Subject + Verb + Object + Period. Example: "I ate breakfast." Complete, then move on.',
            example: examples.length > 0
                ? `You said:\n• "${examples[0]}..."\n• ${examples[1] ? `"${examples[1]}..."\n\n` : ''}Complete them:\n• "${examples[0]}, which gave me energy."\n• ${examples[1] ? `"${examples[1]}, and then I was ready."` : ''}`
                : 'Finish each sentence with a clear ending before starting a new one.',
            metric: 'structure',
            userExample: examples.length > 0 ? `Examples: "${examples[0]}", "${examples[1] || ''}"` : undefined,
        };
    }
}

/**
 * RICHNESS suggestions with repetition examples
 */
function getRichnessSuggestion(score: number, transcript: NormalizedTranscript): Suggestion {
    const richnessRate = Math.round((transcript.uniqueWords.size / transcript.cleanWordCount) * 100);

    if (transcript.repetitions > 5) {
        const topRepeated = transcript.repeatedPhrases.slice(0, 3);

        return {
            title: `${transcript.repetitions} repeated phrases detected`,
            message: `You're repeating yourself frequently. Repetitive speech sounds less confident.`,
            tip: 'Before repeating a phrase, pause and ask: "Is there another way to say this?" Use synonyms.',
            example: topRepeated.length > 0
                ? `You repeated:\n${topRepeated.map((p, i) => `${i + 1}. "${p}"`).join('\n')}\n\nVariations:\n${topRepeated.map((p, i) => {
                    if (p.includes('after that')) return `${i + 1}. Try: "then", "next", "following that"`;
                    if (p.includes('I had')) return `${i + 1}. Try: "I ate", "I consumed", "I enjoyed"`;
                    return `${i + 1}. Rephrase using different words`;
                }).join('\n')}`
                : 'Catch yourself repeating and rephrase using different words.',
            metric: 'richness',
            userExample: topRepeated.length > 0 ? `Most repeated: "${topRepeated[0]}"` : undefined,
        };
    } else if (richnessRate < 55) {
        return {
            title: `Only ${richnessRate}% unique words`,
            message: `You're overusing certain words. This limits your expressiveness.`,
            tip: 'Expand your active vocabulary. Before recording, think of 3 synonyms for common words you use.',
            example: 'Exercise: Describe your day using these word swaps:\n• "good" → excellent, pleasant, enjoyable\n• "went" → traveled, headed, moved\n• "did" → completed, accomplished, finished',
            metric: 'richness',
        };
    } else {
        return {
            title: `Good vocabulary variety (${richnessRate}% unique)`,
            message: `You're using diverse word choices. This makes your speech more engaging.`,
            tip: 'Keep reading and learning new words. Try using one new word each session.',
            example: 'Challenge: In your next practice, incorporate one advanced word you learned this week.',
            metric: 'richness',
        };
    }
}

/**
 * PROFESSIONALISM: Vulgarity/profanity detection
 * This takes PRIORITY over all other suggestions
 * NOW SHOWS ACTUAL SENTENCES with highlighted profanity
 */
function getProfessionalismSuggestion(transcript: NormalizedTranscript): Suggestion {
    const examples = transcript.profanityExamples;

    if (examples.length === 0) {
        // Fallback
        return {
            title: 'Warning: Unprofessional Language Detected',
            message: `Your speech contained ${transcript.profanityCount} inappropriate word${transcript.profanityCount !== 1 ? 's' : ''}.`,
            tip: 'Replace profanity with professional alternatives.',
            example: 'Use respectful language in professional settings.',
            metric: 'professionalism',
        };
    }

    // Show actual sentences with [HIGHLIGHTED] profanity
    const sentencesWithHighlight = examples.map((ex, i) => {
        const highlighted = ex.sentence.replace(
            new RegExp(`\\b${ex.word.replace(/\*/g, '.')}\\b`, 'gi'),
            `[${ex.word.toUpperCase()}]`
        );
        return `${i + 1}. "${highlighted}"`;
    }).join('\n');

    // Build targeted replacements
    const targetedSuggestions = examples.map((ex, i) => {
        const corrected = ex.sentence.replace(
            new RegExp(`\\b${ex.word.replace(/\*/g, '.')}\\b`, 'gi'),
            ex.suggestion
        );
        return `${i + 1}. "${corrected}"`;
    }).join('\n');

    return {
        title: 'Warning: Unprofessional Language Detected',
        message: `Your speech contained ${transcript.profanityCount} inappropriate word${transcript.profanityCount !== 1 ? 's' : ''}.\n\nYOU SAID:\n${sentencesWithHighlight}`,
        tip: `Replace profane words with professional alternatives. Pause before speaking if you catch yourself about to use vulgar language.`,
        example: `SAY THIS INSTEAD:\n${targetedSuggestions}\n\nExpress emotions professionally: "frustrating", "challenging", "disappointing".`,
        metric: 'professionalism',
        userExample: examples[0] ? `Profanity found: "${examples[0].word}"` : undefined,
    };
}

/**
 * Get an encouraging closing message
 */
export function getEncouragingMessage(overallScore: number): string {
    if (overallScore >= 90) return "You're speaking like a pro! 🌟";
    if (overallScore >= 80) return "Excellent progress! Keep it up! 🎉";
    if (overallScore >= 70) return "You're doing great! 👏";
    if (overallScore >= 60) return "Good work! You're improving! 💪";
    if (overallScore >= 50) return "Keep practicing! You're getting better! 🚀";
    return "Every session makes you stronger! 💪";
}
