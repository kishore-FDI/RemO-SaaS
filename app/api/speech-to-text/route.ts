// app/api/speech-to-text/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }
    
    // Convert the file to a format acceptable by your STT service
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Use a speech-to-text service (Google Cloud Speech-to-Text example)
    // Note: You'll need to set up the appropriate credentials for your chosen service
    const response = await fetch('https://speech.googleapis.com/v1/speech:recognize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GOOGLE_CLOUD_API_KEY}`,
      },
      body: JSON.stringify({
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 48000,
          languageCode: 'en-US',
        },
        audio: {
          content: buffer.toString('base64'),
        },
      }),
    });
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return NextResponse.json({ text: '' });
    }
    
    const transcription = data.results[0].alternatives[0].transcript;
    
    return NextResponse.json({ text: transcription });
  } catch (error) {
    console.error('Error in speech-to-text:', error);
    return NextResponse.json({ error: 'Failed to process audio' }, { status: 500 });
  }
}