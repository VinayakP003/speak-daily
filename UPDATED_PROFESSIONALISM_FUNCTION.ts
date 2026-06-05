/**
 * UPDATED: Professionalism Suggestion Function
 * Shows ACTUAL sentences with highlighted profanity and targeted replacements
 */

function getProfessionalismSuggestion(transcript: NormalizedTranscript): Suggestion {
    const examples = transcript.profanityExamples;

    if (examples.length === 0) {
        // Fallback
        return {
            title: `⚠️ Unprofessional Language Detected`,
            message: `Your speech contained ${transcript.profanityCount} inappropriate word${transcript.profanityCount !== 1 ? 's' : ''}.`,
            tip: 'Replace profanity with professional alternatives.',
            example: 'Use respectful language.',
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
        title: `⚠️ Unprofessional Language Detected`,
        message: `Your speech contained ${transcript.profanityCount} inappropriate word${transcript.profanityCount !== 1 ? 's' : ''}.

YOU SAID:
${sentencesWithHighlight}`,
        tip: `Replace profane words with professional alternatives.`,
        example: `SAY THIS INSTEAD:
${targetedSuggestions}

Express emotions professionally: "frustrating", "challenging", "disappointing".`,
        metric: 'professionalism',
        userExample: examples[0] ? `Profanity found: "${examples[0].word}"` : undefined,
    };
}

