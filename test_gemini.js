const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) { console.error('No API key'); process.exit(1); }
fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: 'Hello, world!' }] }],
    generationConfig: { temperature: 0.9, maxOutputTokens: 60 },
  }),
})
.then(res => res.json())
.then(data => console.log(JSON.stringify(data)))
.catch(err => console.error(err));
