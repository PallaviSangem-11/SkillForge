// backend-example/test-gemini-call.js
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

(async () => {
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in the environment.');
    process.exit(1);
  }

  const geminiRequest = {
    contents: [
      { parts: [{ text: 'Generate 2 simple MCQ questions about JavaScript variables in JSON format: { \"questions\": [{ \"prompt\": \"...\", \"options\": [\"...\",\"...\"], \"correct\": 1 }] }' }] }
    ],
    generationConfig: {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 500,
      responseMimeType: "application/json"
    }
  };

  try {
    const res = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, geminiRequest, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('Status:', res.status);
    console.log('Full response data:', JSON.stringify(res.data, null, 2));
    const text = res.data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('Generated text:\n', text);
  } catch (err) {
    console.error('Request failed:', err.toString());
    if (err.response) console.error('Response data:', JSON.stringify(err.response.data, null, 2));
  }
})();