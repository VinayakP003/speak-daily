#!/usr/bin/env node
/**
 * Test script for transcript normalization
 * Usage: node scripts/test-normalize.js
 */

// Since this is a .js file running in Node, we'll use require
// In production, this would be TypeScript

const sampleTranscripts = [
    {
        name: 'Beginner (many fillers)',
        text: 'Um, today I went to the, like, market and, uh, I bought some vegetables. You know, I was thinking about, um, making a salad for dinner. Like, I really enjoy cooking, so, basically, I wanted to try something new.',
        duration: 25,
    },
    {
        name: 'Intermediate (some fillers)',
        text: 'Today I went to the market and bought some vegetables. I was thinking about making a salad for dinner. I really enjoy cooking, so I wanted to try something new. Maybe I will add some lettuce and tomatoes.',
        duration: 20,
    },
    {
        name: 'Advanced (few fillers)',
        text: 'This morning I visited the local farmers market to purchase fresh ingredients for tonight\'s dinner. I decided to prepare a Mediterranean-style salad using heirloom tomatoes, mixed greens, and kalamata olives. The variety of produce available was impressive.',
        duration: 22,
    },
    {
        name: 'Repetitive speech',
        text: 'I think, I think that we should go. I really think we should go to the park. The park is nice. The park has trees. I like the park.',
        duration: 15,
    },
];

console.log('🧪 Testing Transcript Normalization\n');
console.log('='.repeat(60));

for (const sample of sampleTranscripts) {
    console.log(`\n📝 ${sample.name}`);
    console.log('-'.repeat(60));
    console.log(`Original: "${sample.text}"`);
    console.log(`\nAnalysis:`);

    // Simulate the normalization (manual calculation for demo)
    const words = sample.text.split(/\s+/);
    const wordCount = words.length;

    // Count fillers manually
    const fillers = ['um', 'uh', 'like', 'you know', 'basically', 'so'];
    let fillerCount = 0;
    const lowerText = sample.text.toLowerCase();

    fillers.forEach(filler => {
        const regex = new RegExp(`\\b${filler}\\b`, 'g');
        const matches = lowerText.match(regex);
        if (matches) fillerCount += matches.length;
    });

    // Remove fillers for cleaned version
    let cleaned = sample.text;
    fillers.forEach(filler => {
        const regex = new RegExp(`\\b${filler}\\b`, 'gi');
        cleaned = cleaned.replace(regex, '');
    });
    cleaned = cleaned.replace(/\s+/g, ' ').replace(/,\s+,/g, ',').trim();

    const sentences = sample.text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    console.log(`  • Total words: ${wordCount}`);
    console.log(`  • Filler words: ${fillerCount} (${((fillerCount / wordCount) * 100).toFixed(1)}%)`);
    console.log(`  • Clean words: ${wordCount - fillerCount}`);
    console.log(`  • Sentences: ${sentences.length}`);
    console.log(`  • Duration: ${sample.duration}s`);
    console.log(`  • WPM: ${Math.round((wordCount / sample.duration) * 60)}`);
    console.log(`\nCleaned: "${cleaned}"`);
}

console.log('\n' + '='.repeat(60));
console.log('\n✅ Test complete!\n');
console.log('To use this in your app, import normalizeTranscript():');
console.log('  import { normalizeTranscript } from \'../lib/normalize\';');
console.log('  const result = normalizeTranscript(transcript, audioDuration);');
console.log('');
