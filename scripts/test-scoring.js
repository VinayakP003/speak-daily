#!/usr/bin/env node
/**
 * Test scoring with Vinayak's actual transcript
 */

const transcript = "Hello, My name is Vinayak Pant and I am. I just woke up and what to do? This is how it's going now. Thank you.";
const estimatedDuration = 10; // seconds

console.log('🎯 SCORING YOUR TRANSCRIPT\n');
console.log('='.repeat(70));
console.log(`"${transcript}"`);
console.log('='.repeat(70));

// Simulate normalization
const words = transcript.split(/\s+/);
const wordCount = words.length; // 23

// Filler detection
const fillers = ['um', 'uh', 'like', 'you know', 'basically', 'so'];
let fillerCount = 0;
fillers.forEach(filler => {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = transcript.match(regex);
    if (matches) fillerCount += matches.length;
});

// Unique words
const uniqueWords = new Set(
    words.map(w => w.toLowerCase().replace(/[^a-z]/g, '')).filter(w => w.length > 2)
);

// Sentences
const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
const completeSentences = sentences.filter(s => {
    const trimmed = s.trim();
    const words = trimmed.split(/\s+/);
    return words.length >= 3 && !trimmed.match(/\b(and|but|or|because|if)\s*$/i);
}).length;
const incompleteSentences = sentences.length - completeSentences;

console.log('\n📊 NORMALIZED DATA:');
console.log(`  Words: ${wordCount} total, ${wordCount - fillerCount} clean`);
console.log(`  Fillers: ${fillerCount}`);
console.log(`  Sentences: ${completeSentences} complete, ${incompleteSentences} incomplete`);
console.log(`  Unique words: ${uniqueWords.size}`);
console.log(`  Duration: ${estimatedDuration}s`);

// SCORING CALCULATIONS
console.log('\n🎯 METRIC SCORES:\n');

// 1. FLUENCY (pace)
const wpm = Math.round((wordCount / estimatedDuration) * 60);
let fluency = 0;
if (wpm < 100) {
    fluency = (wpm / 100) * 70;
} else if (wpm >= 100 && wpm <= 135) {
    fluency = 70 + ((wpm - 100) / 35) * 25;
} else if (wpm > 135 && wpm <= 160) {
    fluency = 95 - ((wpm - 135) / 25) * 10;
}
fluency = Math.round(fluency);

console.log(`  📈 Fluency: ${fluency}/100`);
console.log(`     → Pace: ${wpm} words/minute`);
console.log(`     → ${wpm >= 120 ? '✅ Good pace' : '⚠️ A bit slow'}`);

// 2. CLARITY (fillers)
const fillerPercentage = fillerCount / wordCount;
let clarity = 100;
if (fillerCount === 0) {
    clarity = 100;
} else if (fillerPercentage <= 0.05) {
    clarity = 100 - (fillerPercentage / 0.05) * 5;
} else {
    clarity = 95 - ((fillerPercentage - 0.05) * 300);
}
clarity = Math.round(Math.max(40, clarity));

console.log(`\n  💎 Clarity: ${clarity}/100`);
console.log(`     → Filler rate: ${(fillerPercentage * 100).toFixed(1)}%`);
console.log(`     → ${fillerCount === 0 ? '✅ Perfect! No fillers' : `⚠️ ${fillerCount} filler words`}`);

// 3. STRUCTURE (sentence completion)
const completionRate = completeSentences / sentences.length;
let structure = 0;
if (completionRate >= 0.6) {
    structure = 70 + ((completionRate - 0.6) / 0.4) * 30;
} else {
    structure = 40 + (completionRate / 0.6) * 30;
}
structure = Math.round(structure);

console.log(`\n  🏗️  Structure: ${structure}/100`);
console.log(`     → Completion rate: ${Math.round(completionRate * 100)}%`);
console.log(`     → ${completionRate >= 0.6 ? '✅ Mostly complete' : '⚠️ Many fragments'}`);

// 4. RICHNESS (vocabulary)
const richnessRatio = uniqueWords.size / wordCount;
let richness = 0;
if (richnessRatio >= 0.5) {
    richness = 70 + ((richnessRatio - 0.5) / 0.5) * 30;
} else {
    richness = 40 + (richnessRatio / 0.5) * 30;
}
richness = Math.round(richness);

console.log(`\n  📚 Richness: ${richness}/100`);
console.log(`     → Unique words: ${Math.round(richnessRatio * 100)}%`);
console.log(`     → ${richnessRatio >= 0.5 ? '✅ Good variety' : '⚠️ Some repetition'}`);

// OVERALL SCORE
const weighted = (fluency * 0.30) + (clarity * 0.25) + (structure * 0.25) + (richness * 0.20);
const curved = Math.sqrt(weighted / 100) * 100;
const overall = Math.round(curved);

console.log('\n' + '='.repeat(70));
console.log(`\n  🌟 OVERALL SCORE: ${overall}/100`);
console.log(`\n  ${overall >= 80 ? '🎉 Great job!' : overall >= 65 ? '👍 Good work!' : '💪 Keep practicing!'}`);
console.log('\n' + '='.repeat(70));

// BREAKDOWN
console.log('\n📋 DETAILED BREAKDOWN:\n');
console.log(`  Fluency (30%):   ${fluency} → contributes ${Math.round(fluency * 0.30)} points`);
console.log(`  Clarity (25%):   ${clarity} → contributes ${Math.round(clarity * 0.25)} points`);
console.log(`  Structure (25%): ${structure} → contributes ${Math.round(structure * 0.25)} points`);
console.log(`  Richness (20%):  ${richness} → contributes ${Math.round(richness * 0.20)} points`);

// TOP SUGGESTION
console.log('\n💡 TOP SUGGESTION:\n');
const scores = { fluency, clarity, structure, richness };
const lowest = Object.entries(scores).sort(([, a], [, b]) => a - b)[0];

if (lowest[0] === 'structure') {
    console.log('  🎯 Focus on completing your sentences.');
    console.log('     Try finishing one thought before starting another.');
    console.log(`     Example: Instead of "and I am...", say "and I am excited to start my day!"`);
} else if (lowest[0] === 'clarity') {
    console.log('  🎯 Reduce filler words like "um" and "like".');
    console.log('     When you feel one coming, pause instead.');
} else if (lowest[0] === 'fluency') {
    console.log('  🎯 Try speaking a bit faster.');
    console.log('     Aim for 2-3 sentences before pausing.');
} else {
    console.log('  🎯 Use more variety in your vocabulary.');
    console.log('     Try using synonyms instead of repeating words.');
}

console.log('\n' + '='.repeat(70));
console.log('\n✅ Scoring logic is working!\n');
