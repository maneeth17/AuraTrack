const apiKey = process.env.GEMINI_API_KEY;
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
.then(res => res.json())
.then(data => {
  const models = data.models.filter(m => m.supportedGenerationMethods.includes('generateContent')).map(m => m.name);
  console.log(models.join('\n'));
})
.catch(err => console.error(err));
