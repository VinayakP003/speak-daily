const API_KEY = process.env.EXPO_PUBLIC_ASSEMBLYAI_KEY;
console.warn('🔥 transcribe.ts loaded');


export async function transcribeAudio(audioUri: string) {
  console.warn('🔥 transcribeAudio() CALLED');
  if (!API_KEY) {
    throw new Error('AssemblyAI API key missing');
  }

  // 1️⃣ Upload audio
  const audioResponse = await fetch(audioUri);
  const audioBlob = await audioResponse.blob();

  const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      authorization: API_KEY,
    },
    body: audioBlob,
  });

  const uploadData = await uploadRes.json();
  const audioUrl = uploadData.upload_url;

  console.log('Uploaded audio URL:', audioUrl);

  // 2️⃣ Request transcription
  const transcriptRes = await fetch(
    'https://api.assemblyai.com/v2/transcript',
    {
      method: 'POST',
      headers: {
        authorization: API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: audioUrl,
      }),
    }
  );

  const transcriptData = await transcriptRes.json();
  const transcriptId = transcriptData.id;

  console.log('Transcript ID:', transcriptId);

  // 3️⃣ Poll for result
  while (true) {
    await new Promise((r) => setTimeout(r, 3000));

    const pollingRes = await fetch(
      `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
      {
        headers: { authorization: API_KEY },
      }
    );

    const pollingData = await pollingRes.json();

    if (pollingData.status === 'completed') {
      return pollingData.text;
    }

    if (pollingData.status === 'error') {
      throw new Error(pollingData.error);
    }

    console.log('Transcribing...');
  }
}
