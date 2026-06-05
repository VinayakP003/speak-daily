/**
 * VETERAN TEACHER SUGGESTION SYSTEM
 * 
 * Personality: 10-15 years teaching experience
 * - Polite and encouraging for minor errors
 * - Constructive for moderate issues  
 * - STRICT and firm for profanity
 * - Understands modern language trends
 * - Contextual and intelligent feedback
 */

import { NormalizedTranscript, getTopFiller } from './normalize';
import { SpeechScore } from './scoring';

export interface Suggestion {
    title: string;
    message: string;
    tip: string;
    example: string;
    metric: string;
    userExample?: string;
    severity: 'minor' | 'moderate' | 'critical';  // Teacher's assessment
}

/**
 * Generate suggestions with veteran teacher personality
 * PRIORITY ORDER:
 * 1. Profanity = CRITICAL (overrides everything)
 * 2. Grammar = MAJOR (serious errors)
 * 3. Other metrics = MODERATE/MINOR
 */
export function generateSuggestions(
    score: SpeechScore,
    transcript: NormalizedTranscript,
    exerciseId?: string | null
): Suggestion[] {
    // SPECIAL: Exercise Mode Check
    if (exerciseId === 'no-fillers' && transcript.fillerCount > 0) {
        return [{
            title: 'Exercise Failed: Fillers Detected',
            message: `The goal was zero fillers, but I heard ${transcript.fillerCount} filler words. In professional speaking, silence is much more powerful than "um" or "uh".`,
            tip: 'Next time, if you feel a filler coming, just pause. Silence shows confidence.',
            example: 'Instead of "I think, um, we should...", try "I think... [pause] ...we should..."',
            metric: 'fluency',
            severity: 'moderate'
        }];
    }

    if (exerciseId === 'no-fillers' && transcript.fillerCount === 0) {
        return [{
            title: '🏆 Exercise Mastered!',
            message: 'Outstanding! You spoke without a single filler word. This immediate improvement in your professional presence is exactly what we want to see.',
            tip: 'Keep this habit! Your speech sounds much more authoritative now.',
            example: 'Your performance today was a perfect example of filler-free communication.',
            metric: 'fluency',
            severity: 'minor'
        }];
    }

    // PRIORITY 1: Profanity gets immediate, strict feedback
    if (transcript.profanityDetected) {
        return [getStrictProfanityFeedback(transcript)];
    }

    // PRIORITY 2: Major grammar errors (3+ errors or score < 70)
    if (transcript.grammarErrorCount >= 3 || transcript.grammarAnalysis.grammarScore < 70) {
        return [getGrammarFeedback(transcript)];
    }

    // PRIORITY 3: Find weakest area to focus on
    const metrics = Object.entries(score.metrics).sort(([, a], [, b]) => a - b);
    const [weakestMetric, weakestScore] = metrics[0];

    // Teacher decides severity based on score
    const severity = getSeverityLevel(weakestScore);

    const suggestion = getSuggestionForMetric(
        weakestMetric as keyof typeof score.metrics,
        weakestScore,
        transcript,
        score,
        severity
    );

    return [suggestion];
}

/**
 * Teacher assesses severity of the issue
 */
function getSeverityLevel(score: number): 'minor' | 'moderate' | 'critical' {
    if (score >= 70) return 'minor';
    if (score >= 50) return 'moderate';
    return 'critical';
}

/**
 * Route to appropriate teacher feedback
 */
function getSuggestionForMetric(
    metric: 'fluency' | 'clarity' | 'structure' | 'richness',
    metricScore: number,
    transcript: NormalizedTranscript,
    fullScore: SpeechScore,
    severity: 'minor' | 'moderate' | 'critical'
): Suggestion {
    switch (metric) {
        case 'fluency':
            return getTeacherFluencyFeedback(metricScore, transcript, severity);
        case 'clarity':
            return getTeacherClarityFeedback(metricScore, transcript, severity);
        case 'structure':
            return getTeacherStructureFeedback(metricScore, transcript, severity);
        case 'richness':
            return getTeacherRichnessFeedback(metricScore, transcript, severity);
    }
}

/**
 * FLUENCY: Teacher's pace coaching
 */
function getTeacherFluencyFeedback(
    score: number,
    transcript: NormalizedTranscript,
    severity: 'minor' | 'moderate' | 'critical'
): Suggestion {
    const wpm = Math.round((transcript.cleanWordCount / transcript.estimatedDuration) * 60);

    if (wpm < 100) {
        if (severity === 'minor') {
            return {
                title: 'Let\'s work on your speaking pace',
                message: `You spoke at ${wpm} words per minute. Natural conversation flows at 120-150 WPM. You're being too cautious—trust yourself more!`,
                tip: 'Think of explaining something exciting to a friend. That natural enthusiasm will speed you up.',
                example: 'Practice exercise: Talk about your favorite meal for 30 seconds. Don\'t overthink—just let the words flow. Aim for 60+ words.',
                metric: 'fluency',
                severity,
            };
        }
        return {
            title: 'Your pace needs significant improvement',
            message: `At ${wpm} WPM, you're speaking much too slowly. This makes listeners lose interest. You need to practice speaking more fluidly.`,
            tip: 'Stop overthinking every word. Practice telling stories without pausing between words.',
            example: 'Challenge: Record yourself reading a news article. Aim for 130 WPM. Time yourself and count words.',
            metric: 'fluency',
            severity,
        };
    } else if (wpm > 160) {
        return {
            title: severity === 'minor' ? 'Slow down just a bit' : 'You\'re speaking too fast',
            message: `You spoke at ${wpm} WPM. When we rush, we sacrifice clarity. Take a breath between sentences.`,
            tip: 'Add a 1-second mental pause after each period. This gives both you and your listener processing time.',
            example: 'After finishing a sentence, count \\"one-thousand-one\\" silently, then continue.',
            metric: 'fluency',
            severity,
        };
    }

    return {
        title: 'Excellent pace!',
        message: `Your ${wpm} WPM is perfect. This is exactly how natural, confident speakers sound.`,
        tip: 'Keep this rhythm consistent. You\'ve found your natural flow.',
        example: 'Great work! Maintain this pace in future sessions.',
        metric: 'fluency',
        severity: 'minor',
    };
}

/**
 * CLARITY: Teacher's filler word coaching
 */
function getTeacherClarityFeedback(
    score: number,
    transcript: NormalizedTranscript,
    severity: 'minor' | 'moderate' | 'critical'
): Suggestion {
    const fillerCount = transcript.fillerCount;
    const topFiller = getTopFiller(transcript);

    if (fillerCount === 0) {
        return {
            title: 'Perfect clarity—zero filler words!',
            message: 'This is professional-level speaking. You didn\'t use a single \\"um\\" or \\"like\\". Excellent work!',
            tip: 'Whatever you did to prepare, do it again. This isthe standard to maintain.',
            example: 'You\'ve demonstrated what polished communication sounds like. Keep it up!',
            metric: 'clarity',
            severity: 'minor',
        };
    }

    if (severity === 'minor' && fillerCount <= 3) {
        return {
            title: `Just ${fillerCount} tiny slip${fillerCount > 1 ? 's' : ''}—excellent!`,
            message: `I only caught ${fillerCount} filler word${fillerCount > 1 ? 's' : ''}. For most people, this happens when thinking. You're doing very well.`,
            tip: 'When you feel \\"um\\" coming, pause for one second instead. Your brain uses that second productively.',
            example: `Next time you want to say \\"${topFiller}\\", just stop. Count to one. Then continue with your real thought. You'll sound even more polished.`,
            metric: 'clarity',
            severity,
        };
    }

    if (severity === 'moderate') {
        const fillerPercentage = ((fillerCount / transcript.wordCount) * 100).toFixed(1);
        return {
            title: `You said \\"${topFiller}\\" ${transcript.fillerWords.get(topFiller)} times`,
            message: `I counted ${fillerCount} filler words (${fillerPercentage}% of your speech). This is a habit we need to break. Every filler reduces your credibility.`,
            tip: 'Awareness is the first step. CATCH yourself about to say a filler and REPLACE it with silence.',
            example: `Exercise: Re-record your speech. Every time you would say \\"${topFiller}\\", snap your fingers instead. This builds awareness. Then replace snaps with 2-second pauses.`,
            metric: 'clarity',
            severity,
        };
    }

    // Critical
    return {
        title: 'Too many filler words—this needs serious attention',
        message: `You used ${fillerCount} filler words. Your speech is cluttered with \\"um\\", \\"like\\", and \\"uh\\". This makes you sound unprepared and uncertain.`,
        tip: 'Stop. Breathe. Speak. These three steps will eliminate 80% of fillers immediately.',
        example: 'Before your next recording, practice this: Say one sentence. Stop completely. Breathe. Say the next sentence. Repeat. No rushing.',
        metric: 'clarity',
        severity,
    };
}

/**
 * STRUCTURE: Teacher's sentence completion coaching
 */
function getTeacherStructureFeedback(
    score: number,
    transcript: NormalizedTranscript,
    severity: 'minor' | 'moderate' | 'critical'
): Suggestion {
    const incomplete = transcript.incompleteSentences;

    if (incomplete === 0) {
        return {
            title: 'Perfect sentence structure!',
            message: 'Every sentence was complete. This shows organized, clear thinking. Well done!',
            tip: 'You\'re finishing your thoughts before starting new ones. This is professional communication.',
            example: 'Maintain this standard. Complete thoughts = clear communication.',
            metric: 'structure',
            severity: 'minor',
        };
    }

    if (severity === 'minor' && incomplete <= 2) {
        return {
            title: `${incomplete} incomplete sentence${incomplete > 1 ? 's' : ''}`,
            message: `You left ${incomplete} thought${incomplete > 1 ? 's' : ''} hanging. This happens when thinking quickly. Almost perfect!`,
            tip: 'Ask yourself: \\"Did I finish that thought?\\" If not, add an ending before moving on.',
            example: 'Instead of \\"After that I had...\\" say \\"After that, I had my breakfast, which gave me energy.\\"',
            metric: 'structure',
            severity,
        };
    }

    if (severity === 'moderate') {
        return {
            title: `${incomplete} incomplete sentences—let's fix this`,
            message: `Several of your sentences trail off without ending. This makes you harder to follow.`,
            tip: 'Use this formula: Subject + Verb + Complete Thought + Period. Then start the next sentence.',
            example: 'INCOMPLETE: \\"I woke up and then...\\" COMPLETE: \\"I woke up at 7 AM, feeling refreshed.\\"',
            metric: 'structure',
            severity,
        };
    }

    return {
        title: 'Major issue: Most sentences are incomplete',
        message: `You're starting thoughts without finishing them. This is confusing and unprofessional. We need to work on sentence completion.`,
        tip: 'Slow down. Finish ONE complete sentence before starting another.',
        example: 'Practice: Write 5 complete sentences about your day. Read them aloud. Each should have clear beginning, middle, and end.',
        metric: 'structure',
        severity,
    };
}

/**
 * RICHNESS: Teacher's vocabulary coaching
 */
function getTeacherRichnessFeedback(
    score: number,
    transcript: NormalizedTranscript,
    severity: 'minor' | 'moderate' | 'critical'
): Suggestion {
    const richnessRate = Math.round((transcript.uniqueWords.size / transcript.cleanWordCount) * 100);

    if (transcript.repetitions > 5 && severity !== 'minor') {
        const topRepeated = transcript.repeatedPhrases.slice(0, 2);
        return {
            title: `You're repeating yourself—${transcript.repetitions} times`,
            message: `I noticed you repeated phrases like \\"${topRepeated[0]}\\" multiple times. Repetitive speech sounds boring and unpolished.`,
            tip: 'Before repeating, pause and ask: \\"Can I say this differently?\\" Use synonyms.',
            example: `Instead of saying \\"after that\\" repeatedly, vary it:\n• \\"then...\\"\n• \\"following that...\\"\n• \\"next...\\"`,
            metric: 'richness',
            severity,
        };
    }

    if (richnessRate >= 65) {
        return {
            title: `Excellent vocabulary variety (${richnessRate}% unique)`,
            message: 'Your word choices are diverse and engaging. This keeps listeners interested.',
            tip: 'Continue expanding your vocabulary through reading.',
            example: 'Challenge: Try using one new advanced word in your next session.',
            metric: 'richness',
            severity: 'minor',
        };
    }

    if (severity === 'moderate') {
        return {
            title: `Limited vocabulary (${richnessRate}% unique)`,
            message: 'You\'re overusing certain words. Let\'s expand your active vocabulary.',
            tip: 'Learn 3 synonyms for words you use repeatedly.',
            example: 'Replace common words:\n• \\"good\\" → excellent, pleasant\n• \\"went\\" → traveled, headed\n• \\"said\\" → mentioned, stated',
            metric: 'richness',
            severity,
        };
    }

    return {
        title: 'Very limited vocabulary—needs improvement',
        message: `Only ${richnessRate}% of your words were unique. You're repeating basic words too often.`,
        tip: 'Read more. Actively learn new words. Use a thesaurus.',
        example: 'Daily exercise: Learn 5 new words. Use them in sentences. Practice.',
        metric: 'richness',
        severity,
    };
}

/**
 * PROFANITY: STRICT TEACHER MODE
 * NO tolerance, firm correction, clear consequences
 */
function getStrictProfanityFeedback(transcript: NormalizedTranscript): Suggestion {
    const examples = transcript.profanityExamples;

    if (examples.length === 0) {
        return {
            title: '⚠️ UNACCEPTABLE: Vulgar Language Detected',
            message: `I will not tolerate profanity in this learning environment.\n\nYou used ${transcript.profanityCount} inappropriate word${transcript.profanityCount !== 1 ? 's' : ''}. This is unprofessional and disrespectful.`,
            tip: 'You MUST eliminate ALL vulgar language. No exceptions.',
            example: 'Professional communicators express frustration without resorting to profanity. Learn these alternatives immediately.',
            metric: 'professionalism',
            severity: 'critical',
        };
    }

    // Build strict feedback with exact examples
    const yourWords = examples.map((ex, i) => {
        const highlighted = ex.sentence.replace(
            new RegExp(`\\b${ex.word.replace(/\*/g, '.')}\\b`, 'gi'),
            `[${ex.word.toUpperCase()}]`
        );
        return `${i + 1}. \\"${highlighted}\\"`;
    }).join('\n');

    const correctWords = examples.map((ex, i) => {
        const corrected = ex.sentence.replace(
            new RegExp(`\\b${ex.word.replace(/\*/g, '.')}\\b`, 'gi'),
            ex.suggestion
        );
        return `${i + 1}. \\"${corrected}\\"`;
    }).join('\n');

    return {
        title: '⚠️ STOP: Vulgar Language Is UNACCEPTABLE',
        message: `I detected ${transcript.profanityCount} instance${transcript.profanityCount !== 1 ? 's' : ''} of inappropriate language. This is completely unacceptable in professional communication.

WHAT YOU SAID:
${yourWords}

This demonstrates poor emotional regulation and damages your credibility instantly.`,
        tip: 'You MUST replace profanity with professional alternatives. There are NO situations where vulgarity improves communication.',
        example: `SAY THIS INSTEAD:
${correctWords}

Professionals express strong emotions using precise words like \\"frustrating\\", \\"challenging\\", or \\"disappointing\\"—NEVER profanity.

Your score is significantly penalized. Fix this immediately.`,
        metric: 'professionalism',
        severity: 'critical',
        userExample: `${transcript.profanityCount} vulgar word${transcript.profanityCount !== 1 ? 's' : ''} detected`,
    };
}

/**
 * GRAMMAR: Teacher's grammar error feedback
 * Shows actual errors with explanations
 */
function getGrammarFeedback(transcript: NormalizedTranscript): Suggestion {
    const { grammarAnalysis } = transcript;
    const { errors, errorCount, grammarScore } = grammarAnalysis;

    if (errors.length === 0) {
        return {
            title: 'Grammar check passed',
            message: 'No grammar errors detected.',
            tip: 'Keep up the good work!',
            example: 'Your grammar is solid.',
            metric: 'grammar',
            severity: 'minor',
        };
    }

    // Build error display
    const errorDisplay = errors.slice(0, 3).map((err, i) => {
        return `${i + 1}. ❌ "${err.error}" → ✅ "${err.correction}"\n   ${err.explanation}`;
    }).join('\n\n');

    const severity = errorCount >= 5 ? 'critical' : errorCount >= 3 ? 'moderate' : 'minor';

    return {
        title: errorCount === 1 ? '1 grammar error detected' : `${errorCount} grammar errors detected`,
        message: `Your grammar score: ${grammarScore}/100\n\nI found ${errorCount} grammatical error${errorCount !== 1 ? 's' : ''} in your speech. Let's fix them:\n\n${errorDisplay}`,
        tip: 'Pay attention to subject-verb agreement, tense consistency, and word choices. Grammar errors make you sound less educated.',
        example: errorCount >= 3
            ? 'Practice: Before speaking, mentally check - Does my subject match my verb? Am I using the right tense?'
            : 'You\'re close! Just watch out for these small errors and you\'ll be perfect.',
        metric: 'grammar',
        severity,
        userExample: `${errorCount} error${errorCount !== 1 ? 's' : ''}: ${errors[0].type}`,
    };
}

/**
 * Encouraging message based on overall performance
 * Teacher adjusts tone based on progress
 */
export function getEncouragingMessage(overallScore: number): string {
    if (overallScore >= 90) return "Outstanding work! You're speaking like a seasoned professional! 🌟";
    if (overallScore >= 80) return "Excellent progress! You're really improving! 🎉";
    if (overallScore >= 70) return "Good work! You're on the right track! 👏";
    if (overallScore >= 60) return "You're making progress. Keep practicing! 💪";
    if (overallScore >= 50) return "You're learning! Don't give up! 🚀";
    return "Keep working at it. Every session builds skill! 💪";
}
