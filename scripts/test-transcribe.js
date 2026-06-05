#!/usr/bin/env node
/**
 * Test script for AssemblyAI transcription
 * Usage: node scripts/test-transcribe.js path/to/audio.mp3
 */

const fs = require('fs');
const path = require('path');

// Load API key from .env file
function loadEnv() {
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) {
        console.error('❌ .env file not found');
        process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/EXPO_PUBLIC_ASSEMBLYAI_KEY=(.+)/);

    if (!match) {
        console.error('❌ EXPO_PUBLIC_ASSEMBLYAI_KEY not found in .env');
        process.exit(1);
    }

    return match[1].trim();
}

async function transcribeFile(filePath) {
    const API_KEY = loadEnv();

    console.log('🔥 Starting transcription test...');
    console.log('📁 File:', filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
        console.error('❌ File not found:', filePath);
        process.exit(1);
    }

    // Read the audio file
    console.log('📖 Reading file...');
    const audioBuffer = fs.readFileSync(filePath);
    console.log('✅ File loaded:', (audioBuffer.length / 1024).toFixed(2), 'KB');

    // 1️⃣ Upload audio
    console.log('\n⏫ Uploading to AssemblyAI...');
    const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
            authorization: API_KEY,
        },
        body: audioBuffer,
    });

    if (!uploadRes.ok) {
        console.error('❌ Upload failed:', uploadRes.status, uploadRes.statusText);
        const errorText = await uploadRes.text();
        console.error('Response:', errorText);
        process.exit(1);
    }

    const uploadData = await uploadRes.json();
    const audioUrl = uploadData.upload_url;
    console.log('✅ Uploaded audio URL:', audioUrl);

    // 2️⃣ Request transcription
    console.log('\n🎙️ Requesting transcription...');
    const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
            authorization: API_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            audio_url: audioUrl,
        }),
    });

    if (!transcriptRes.ok) {
        console.error('❌ Transcription request failed:', transcriptRes.status);
        const errorText = await transcriptRes.text();
        console.error('Response:', errorText);
        process.exit(1);
    }

    const transcriptData = await transcriptRes.json();
    const transcriptId = transcriptData.id;
    console.log('✅ Transcript ID:', transcriptId);

    // 3️⃣ Poll for result
    console.log('\n⏳ Waiting for transcription...');
    let attempts = 0;
    const maxAttempts = 60; // 3 minutes max

    while (attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 3000));
        attempts++;

        const pollingRes = await fetch(
            `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
            {
                headers: { authorization: API_KEY },
            }
        );

        if (!pollingRes.ok) {
            console.error('❌ Polling failed:', pollingRes.status);
            process.exit(1);
        }

        const pollingData = await pollingRes.json();

        if (pollingData.status === 'completed') {
            console.log('\n✅ Transcription completed successfully!\n');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📝 TRANSCRIPT:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(pollingData.text);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            return pollingData.text;
        }

        if (pollingData.status === 'error') {
            console.error('❌ Transcription error:', pollingData.error);
            process.exit(1);
        }

        console.log(`⏳ Status: ${pollingData.status} (attempt ${attempts}/${maxAttempts})`);
    }

    console.error('❌ Transcription timed out after', maxAttempts * 3, 'seconds');
    process.exit(1);
}

// Main
const args = process.argv.slice(2);

if (args.length === 0) {
    console.error('Usage: node scripts/test-transcribe.js <audio-file-path>');
    console.error('Example: node scripts/test-transcribe.js audio.mp3');
    process.exit(1);
}

const filePath = path.resolve(args[0]);
transcribeFile(filePath).catch((err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
