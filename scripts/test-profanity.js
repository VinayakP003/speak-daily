#!/usr/bin/env node
/**
 * Test Professionalism Feature
 * Demonstrates profanity detection and penalty calculation
 */

console.log('🎓 TESTING PROFESSIONALISM FEATURE\n');
console.log('='.repeat(70));

// Test cases
const testCases = [
    {
        name: 'Clean Professional Speech',
        transcript: 'I am frustrated with this challenging project. It requires significant effort and patience.',
        expected: 'No penalty, full clarity score'
    },
    {
        name: 'Mild Profanity',
        transcript: 'This damn project is taking forever. I need to finish it soon.',
        expected: '1 profane word detected, -22 point penalty'
    },
    {
        name: 'Multiple Vulgar Words',
        transcript: 'This stupid project is complete crap. What an idiot decision to start this.',
        expected: '3 profane words detected, heavy penalty'
    },
    {
        name: 'Heavy Profanity',
        transcript: 'This fucking shit is so damn stupid. What a fucking mess this is.',
        expected: '5 profane words detected, severe penalty, score floor at 20'
    }
];

// Simplified profanity list for testing
const PROFANITY_WORDS = [
    'damn', 'crap', 'stupid', 'idiot', 'dumb', 'moron',
    'fuck', 'fucking', 'shit', 'bitch', 'ass', 'asshole'
];

function censorWord(word) {
    if (word.length <= 2) return word;
    return word[0] + '*'.repeat(word.length - 2) + word[word.length - 1];
}

function detectProfanity(text) {
    const profanityWords = new Map();
    let profanityCount = 0;

    for (const profaneWord of PROFANITY_WORDS) {
        const regex = new RegExp(`\\b${profaneWord}\\b`, 'gi');
        const matches = text.match(regex);

        if (matches) {
            const count = matches.length;
            const censored = censorWord(matches[0]);
            profanityWords.set(censored, count);
            profanityCount += count;
        }
    }

    return {
        profanityCount,
        profanityWords,
        profanityDetected: profanityCount > 0
    };
}

function calculateClarityWithProfanity(profanityCount, totalWords) {
    // Base clarity score (assume no fillers for simplicity)
    let score = 100;

    if (profanityCount > 0) {
        const profanityPercentage = profanityCount / totalWords;
        const penalty = Math.min(40, 20 + (profanityPercentage * 100 * 10));
        score -= penalty;
        return Math.max(20, score); // Floor at 20
    }

    return score;
}

// Run tests
testCases.forEach((testCase, index) => {
    console.log(`\n${index + 1}. ${testCase.name}`);
    console.log('-'.repeat(70));
    console.log(`Transcript: "${testCase.transcript}"`);
    console.log(`Expected: ${testCase.expected}`);

    const words = testCase.transcript.split(/\s+/).length;
    const result = detectProfanity(testCase.transcript);
    const clarityScore = calculateClarityWithProfanity(result.profanityCount, words);

    console.log(`\n📊 Results:`);
    console.log(`  Total words: ${words}`);
    console.log(`  Profanity detected: ${result.profanityDetected ? '✗ YES' : '✓ NO'}`);
    console.log(`  Profanity count: ${result.profanityCount}`);

    if (result.profanityDetected) {
        console.log(`  Words found:`);
        result.profanityWords.forEach((count, word) => {
            console.log(`    - "${word}" (${count}x)`);
        });
        const penalty = 100 - clarityScore;
        console.log(`  Penalty: -${penalty} points`);
    }

    console.log(`  Clarity Score: ${clarityScore}/100`);

    if (result.profanityDetected) {
        console.log(`\n💡 Suggestion Priority: PROFESSIONALISM`);
        console.log(`  Message: Replace profanity with professional alternatives`);
        console.log(`  Example: "I'm frustrated" instead of vulgar expressions`);
    } else {
        console.log(`\n✅ Professional language maintained!`);
    }
});

console.log('\n' + '='.repeat(70));
console.log('\n📚 Feature Summary:\n');
console.log('✓ Detects 10+ common vulgar/profane words');
console.log('✓ Applies -20 to -40 point penalty to Clarity score');
console.log('✓ Professionalism feedback OVERRIDES other suggestions');
console.log('✓ Provides specific professional alternatives');
console.log('✓ Educational, not judgmental approach');
console.log('✓ Helps users develop professional communication skills\n');
