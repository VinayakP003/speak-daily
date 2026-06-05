/**
 * Transcript Normalization Module
 * 
 * Converts raw speech-to-text output into analyzable data
 * for objective scoring and feedback generation.
 */

import { analyzeGrammar, GrammarAnalysis } from './grammar';
import { analyzeSentences as analyzeSentencesDetailed, SentenceAnalysis } from './sentence-analysis';

export interface NormalizedTranscript {
    original: string;              // Raw transcript from STT
    cleaned: string;               // Without fillers, normalized
    wordCount: number;             // Total words (including fillers)
    cleanWordCount: number;        // Words after removing fillers
    fillerCount: number;           // Total filler words detected
    fillerWords: Map<string, number>; // Filler word → count
    sentences: string[];           // Split by punctuation
    sentenceAnalyses: SentenceAnalysis[]; // Detailed sentence-by-sentence breakdown
    completeSentences: number;     // Sentences with proper structure
    incompleteSentences: number;   // Fragments
    uniqueWords: Set<string>;      // Unique words (lowercased)
    repetitions: number;           // Count of repeated phrases
    repeatedPhrases: string[];     // List of repeated phrases
    estimatedDuration: number;     // Estimated speaking time in seconds
    profanityCount: number;        // Total vulgar/inappropriate words
    profanityWords: Map<string, number>; // Profane word → count (censored)
    profanityDetected: boolean;    // Quick flag for profanity presence
    profanityExamples: Array<{     // Actual usage examples with context
        word: string;              // The profane word (censored)
        sentence: string;          // The sentence containing it
        suggestion: string;        // Specific replacement suggestion
    }>;
    grammarAnalysis: GrammarAnalysis; // Grammar error detection
    grammarErrorCount: number;     // Quick access to error count
}

// Common filler words in English
const FILLER_WORDS = [
    'um',
    'uh',
    'uhm',
    'er',
    'ah',
    'like',
    'you know',
    'i mean',
    'so',
    'basically',
    'actually',
    'literally',
    'kind of',
    'sort of',
    'well',
    'right',
    'okay',
    'yeah',
];

// Words that indicate incomplete sentences
const INCOMPLETE_INDICATORS = [
    'and',
    'but',
    'or',
    'so',
    'because',
    'although',
    'though',
    'if',
    'when',
    'while',
];

// Profane/vulgar words to detect - ACTUAL words for detection
// (They'll be censored in display only)
const PROFANITY_WORDS = [
    // Mild profanity
    'damn',
    'goddamn',
    'hell',
    'crap',
    // Common vulgar terms - ACTUAL WORDS (necessary for detection)
    'fuck',
    'fucking',
    'fucked',
    'fucker',
    'shit',
    'shitty',
    'bitch',
    'ass',
    'asshole',
    'piss',
    'dick',
    'cock',
    'bastard',
    // Offensive slurs and derogatory terms
    'stupid',
    'idiot',
    'dumb',
    'moron',
    'retard',
    'retarded',
];

// Censor function to replace profanity with asterisks for display
function censorWord(word: string): string {
    if (word.length <= 2) return word;
    return word[0] + '*'.repeat(word.length - 2) + word[word.length - 1];
}

/**
 * Normalize a raw transcript into analyzable components
 */
export function normalizeTranscript(
    rawTranscript: string,
    audioDuration?: number
): NormalizedTranscript {
    if (!rawTranscript || rawTranscript.trim().length === 0) {
        return createEmptyTranscript();
    }

    const original = rawTranscript.trim();

    // 1. Detect and count filler words
    const { cleaned, fillerCount, fillerWords } = extractFillers(original);

    // 2. Count words
    const words = original.toLowerCase().split(/\s+/);
    const wordCount = words.length;
    const cleanWords = cleaned.toLowerCase().split(/\s+/);
    const cleanWordCount = cleanWords.filter(w => w.length > 0).length;

    // 3. Extract unique words
    const uniqueWords = new Set(
        cleanWords
            .filter(w => w.length > 2) // Ignore very short words
            .map(w => w.replace(/[^a-z]/g, '')) // Remove punctuation
            .filter(w => w.length > 0)
    );

    // 4. Split into sentences
    const sentences = splitIntoSentences(cleaned);

    // 5. Analyze sentence completeness
    const { completeSentences, incompleteSentences } = analyzeSentences(sentences);

    // 6. Detect repetitions
    const { repetitions, repeatedPhrases } = detectRepetitions(cleanWords);

    // 7. Detect profanity/vulgar language
    const { profanityCount, profanityWords, profanityDetected, profanityExamples } = detectProfanity(original);

    // 8. Analyze grammar
    const grammarAnalysis = analyzeGrammar(original);

    // 9. Perform detailed sentence-by-sentence analysis
    const sentenceAnalyses = analyzeSentencesDetailed(
        sentences,
        fillerWords,
        profanityExamples,
        grammarAnalysis.errors,
        completeSentences,
        incompleteSentences
    );

    // 10. Estimate duration (if not provided)
    const estimatedDuration = audioDuration || estimateDuration(wordCount);

    return {
        original,
        cleaned,
        wordCount,
        cleanWordCount,
        fillerCount,
        fillerWords,
        sentences,
        sentenceAnalyses,
        completeSentences,
        incompleteSentences,
        uniqueWords,
        repetitions,
        repeatedPhrases,
        profanityCount,
        profanityWords,
        profanityDetected,
        profanityExamples,
        grammarAnalysis,
        grammarErrorCount: grammarAnalysis.errorCount,
        estimatedDuration,
    };
}

/**
 * Extract and remove filler words from transcript
 */
function extractFillers(text: string): {
    cleaned: string;
    fillerCount: number;
    fillerWords: Map<string, number>;
} {
    let cleaned = text;
    const fillerWords = new Map<string, number>();
    let fillerCount = 0;

    // Sort by length (longest first) to handle multi-word fillers
    const sortedFillers = [...FILLER_WORDS].sort((a, b) => b.length - a.length);

    for (const filler of sortedFillers) {
        // Create a regex that matches the filler as a whole word
        // Case insensitive, with word boundaries
        const regex = new RegExp(`\\b${filler}\\b`, 'gi');
        const matches = text.match(regex);

        if (matches) {
            const count = matches.length;
            fillerWords.set(filler, count);
            fillerCount += count;

            // Remove from cleaned version
            cleaned = cleaned.replace(regex, '');
        }
    }

    // Clean up extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return { cleaned, fillerCount, fillerWords };
}

/**
 * Detect profane/vulgar words for professionalism training
 * Now includes sentence context and specific suggestions
 */
function detectProfanity(text: string): {
    profanityCount: number;
    profanityWords: Map<string, number>;
    profanityDetected: boolean;
    profanityExamples: Array<{
        word: string;
        sentence: string;
        suggestion: string;
    }>;
} {
    const profanityWords = new Map<string, number>();
    const profanityExamples: Array<{ word: string; sentence: string; suggestion: string }> = [];
    let profanityCount = 0;

    // Split text into sentences for context
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Check for each profane word (case-insensitive)
    for (const profaneWord of PROFANITY_WORDS) {
        // Match the actual word (no asterisk replacement needed now)
        const regex = new RegExp(`\\b${profaneWord}\\b`, 'gi');
        const matches = text.match(regex);

        if (matches) {
            const count = matches.length;
            const censored = censorWord(matches[0]);
            profanityWords.set(censored, count);
            profanityCount += count;

            // Find the sentence containing this profane word (avoid duplicates)
            for (const sentence of sentences) {
                const sentenceRegex = new RegExp(`\\b${profaneWord}\\b`, 'gi');
                if (sentenceRegex.test(sentence)) {
                    // Check if we already have this sentence
                    const alreadyAdded = profanityExamples.some(ex => ex.sentence === sentence.trim());
                    if (!alreadyAdded) {
                        const suggestion = getSuggestionForProfanity(matches[0].toLowerCase());
                        profanityExamples.push({
                            word: censored,
                            sentence: sentence.trim(),
                            suggestion: suggestion,
                        });
                    }
                    break; // Only capture first occurrence
                }
            }
        }
    }

    return {
        profanityCount,
        profanityWords,
        profanityDetected: profanityCount > 0,
        profanityExamples: profanityExamples.slice(0, 5), // Show up to 5 examples
    };
}

/**
 * Get a specific suggestion for a profane word
 */
function getSuggestionForProfanity(word: string): string {
    const suggestions: { [key: string]: string } = {
        // Mild profanity
        'damn': 'challenging',
        'goddamn': 'frustrating',
        'hell': 'difficult',
        'crap': 'nonsense',

        // Vulgar terms
        'fuck': 'extremely',
        'fucking': 'very',
        'fucked': 'broken',
        'fucker': 'difficult person',
        'shit': 'mess',
        'shitty': 'poor quality',
        'bitch': 'difficult person',
        'ass': 'fool',
        'asshole': 'difficult person',
        'piss': 'frustrating',
        'dick': 'jerk',
        'cock': 'fool',
        'bastard': 'difficult person',

        // Derogatory terms
        'stupid': 'challenging',
        'idiot': 'mistaken',
        'dumb': 'unwise',
        'moron': 'misguided',
        'retard': 'slow',
        'retarded': 'delayed',
    };

    // Try exact match first
    const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
    if (suggestions[cleaned]) {
        return suggestions[cleaned];
    }

    // Fallback
    return 'better alternative';
}

/**
 * Split text into sentences based on punctuation
 */
function splitIntoSentences(text: string): string[] {
    // Split on sentence-ending punctuation
    const sentences = text
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

    return sentences;
}

/**
 * Analyze sentence structure and completeness
 */
function analyzeSentences(sentences: string[]): {
    completeSentences: number;
    incompleteSentences: number;
} {
    let completeSentences = 0;
    let incompleteSentences = 0;

    for (const sentence of sentences) {
        const words = sentence.split(/\s+/);

        // Too short = incomplete
        if (words.length < 3) {
            incompleteSentences++;
            continue;
        }

        // Check if ends with incomplete indicator
        const lastWord = words[words.length - 1].toLowerCase().replace(/[^a-z]/g, '');
        const isIncomplete = INCOMPLETE_INDICATORS.includes(lastWord);

        if (isIncomplete) {
            incompleteSentences++;
        } else {
            completeSentences++;
        }
    }

    return { completeSentences, incompleteSentences };
}

/**
 * Detect repeated phrases (2-7 words) and sentence-level repetitions
 */
function detectRepetitions(words: string[]): {
    repetitions: number;
    repeatedPhrases: string[];
} {
    const phraseCount = new Map<string, number>();
    const repeatedPhrasesSet = new Set<string>();

    // Check phrases of length 2-7 words
    for (let phraseLength = 2; phraseLength <= 7; phraseLength++) {
        for (let i = 0; i <= words.length - phraseLength; i++) {
            const phrase = words.slice(i, i + phraseLength).join(' ');

            // Only count meaningful phrases (all words > 2 chars, excluding common words)
            const meaningfulWords = words.slice(i, i + phraseLength)
                .filter(w => w.length > 2 && !['the', 'and', 'for', 'that', 'this', 'with'].includes(w));

            // Need at least 2 meaningful words for a phrase to count
            if (meaningfulWords.length >= 2) {
                phraseCount.set(phrase, (phraseCount.get(phrase) || 0) + 1);
            }
        }
    }

    // Count repetitions (phrases that appear more than once)
    let totalRepetitions = 0;
    const sortedPhrases = Array.from(phraseCount.entries())
        .filter(([phrase, count]) => count > 1)
        .sort((a, b) => {
            // Sort by: word count (longer first), then by frequency
            const aWords = a[0].split(' ').length;
            const bWords = b[0].split(' ').length;
            if (aWords !== bWords) return bWords - aWords;
            return b[1] - a[1];
        });

    // Add unique repeated phrases (prefer longer phrases)
    for (const [phrase, count] of sortedPhrases) {
        // Check if this phrase is already contained in a longer repeated phrase
        let isSubPhrase = false;
        for (const existing of repeatedPhrasesSet) {
            if (existing.includes(phrase) && existing !== phrase) {
                isSubPhrase = true;
                break;
            }
        }

        if (!isSubPhrase) {
            repeatedPhrasesSet.add(phrase);
            totalRepetitions += (count - 1); // Count extra occurrences
        }
    }

    return {
        repetitions: totalRepetitions,
        repeatedPhrases: Array.from(repeatedPhrasesSet).slice(0, 5) // Top 5
    };
}

/**
 * Estimate speaking duration based on word count
 * Average speaking rate: 120-150 words per minute
 */
function estimateDuration(wordCount: number): number {
    const AVERAGE_WPM = 135;
    return Math.round((wordCount / AVERAGE_WPM) * 60);
}

/**
 * Create an empty transcript for edge cases
 */
function createEmptyTranscript(): NormalizedTranscript {
    return {
        original: '',
        cleaned: '',
        wordCount: 0,
        cleanWordCount: 0,
        fillerCount: 0,
        fillerWords: new Map(),
        sentences: [],
        sentenceAnalyses: [],
        completeSentences: 0,
        incompleteSentences: 0,
        uniqueWords: new Set(),
        repetitions: 0,
        repeatedPhrases: [],
        profanityCount: 0,
        profanityWords: new Map(),
        profanityDetected: false,
        profanityExamples: [],
        grammarAnalysis: { errorCount: 0, errors: [], grammarScore: 100 },
        grammarErrorCount: 0,
        estimatedDuration: 0,
    };
}

/**
 * Get the most common filler word
 */
export function getTopFiller(transcript: NormalizedTranscript): string {
    let maxCount = 0;
    let topFiller = 'filler words';

    transcript.fillerWords.forEach((count, filler) => {
        if (count > maxCount) {
            maxCount = count;
            topFiller = filler;
        }
    });

    return topFiller;
}

/**
 * Format transcript with fillers highlighted for display
 */
export function highlightFillers(transcript: NormalizedTranscript): string {
    let highlighted = transcript.original;

    // Sort by length (longest first) to handle multi-word fillers
    const sortedFillers = Array.from(transcript.fillerWords.keys())
        .sort((a, b) => b.length - a.length);

    for (const filler of sortedFillers) {
        const regex = new RegExp(`\\b(${filler})\\b`, 'gi');
        highlighted = highlighted.replace(regex, '[$1]');
    }

    return highlighted;
}
