#!/usr/bin/env node
/**
 * Test Vinayak's actual transcript
 */

// Simulate the normalization (we'll build the full TypeScript integration soon)
const transcript = "Hello, My name is Vinayak Pant and I am. I just woke up and what to do? This is how it's going now. Thank you.";

console.log('🎤 Analyzing Your Transcript\n');
console.log('='.repeat(60));
console.log(`Original:\n"${transcript}"\n`);
console.log('='.repeat(60));

// Basic analysis
const words = transcript.split(/\s+/);
const wordCount = words.length;

// Filler detection
const fillers = ['um', 'uh', 'like', 'you know', 'basically', 'so', 'actually', 'literally'];
const lowerText = transcript.toLowerCase();
let fillerCount = 0;
const foundFillers = [];

fillers.forEach(filler => {
    const regex = new RegExp(`\\b${filler}\\b`, 'g');
    const matches = lowerText.match(regex);
    if (matches) {
        fillerCount += matches.length;
        foundFillers.push(`${filler} (${matches.length}x)`);
    }
});

// Sentence analysis
const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
console.log('\n📊 Word Analysis:');
console.log(`  • Total words: ${wordCount}`);
console.log(`  • Filler words: ${fillerCount}`);
console.log(`  • Clean word count: ${wordCount - fillerCount}`);

// Unique words
const uniqueWords = new Set(
    words
        .map(w => w.toLowerCase().replace(/[^a-z]/g, ''))
        .filter(w => w.length > 2)
);
console.log(`  • Unique words: ${uniqueWords.size}`);
console.log(`  • Vocabulary richness: ${((uniqueWords.size / wordCount) * 100).toFixed(1)}%`);

console.log('\n📝 Sentence Analysis:');
console.log(`  • Total sentences: ${sentences.length}`);
sentences.forEach((s, i) => {
    const words = s.trim().split(/\s+/);
    const isShort = words.length < 3;
    const endsWeirdly = s.trim().match(/\b(and|but|or)\s*$/i);

    console.log(`  ${i + 1}. "${s.trim()}" (${words.length} words)${isShort || endsWeirdly ? ' ⚠️  Fragment' : ' ✓'}`);
});

// Incomplete sentence detection
const incompleteCount = sentences.filter(s => {
    const words = s.trim().split(/\s+/);
    return words.length < 3 || s.trim().match(/\b(and|but|or|because|if|when)\s*$/i);
}).length;

console.log(`  • Complete sentences: ${sentences.length - incompleteCount}`);
console.log(`  • Incomplete/fragments: ${incompleteCount}`);

// Speaking pace estimation
const estimatedDuration = Math.round((wordCount / 135) * 60); // 135 WPM average
console.log('\n⏱️  Pace Analysis:');
console.log(`  • Estimated duration: ~${estimatedDuration} seconds`);
console.log(`  • Estimated pace: ~${Math.round((wordCount / estimatedDuration) * 60)} words/minute`);

console.log('\n💡 Quick Insights:');
if (fillerCount === 0) {
    console.log('  ✅ Great! No filler words detected.');
} else {
    console.log(`  ⚠️  Found ${fillerCount} filler words: ${foundFillers.join(', ')}`);
}

if (incompleteCount > 0) {
    console.log(`  ⚠️  ${incompleteCount} sentence(s) feel incomplete.`);
    console.log('     Try finishing each thought before moving to the next.');
} else {
    console.log('  ✅ All sentences are complete.');
}

const richnessPercent = (uniqueWords.size / wordCount) * 100;
if (richnessPercent < 50) {
    console.log('  ⚠️  You repeated some words. Try using more variety.');
} else {
    console.log('  ✅ Good vocabulary variety.');
}

console.log('\n' + '='.repeat(60));
console.log('\n🎯 This is what the normalization module extracts!');
console.log('Next: We\'ll turn this into a score (0-100) + suggestions.\n');
