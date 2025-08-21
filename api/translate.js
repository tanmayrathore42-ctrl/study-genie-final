// File: api/translate.js (FINAL CORRECTED VERSION)
const OpenAI = require('openai'); // <-- The curly braces {} are removed. This is the fix.

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send({ message: 'Only POST requests allowed' });
    }

    const { text, language } = req.body;

    if (!text || !language) {
        return res.status(400).send({ message: 'Missing text or language' });
    }

    try {
        const prompt = `You are a direct translation engine. Your only task is to translate the following text into ${language}. Do not add any commentary, explanation, or any text other than the translation itself.\n\nText: "${text}"`;

        const completion = await groq.chat.completions.create({
            model: "llama3-8b-8192",
            messages: [{ role: "user", content: prompt }],
        });

        const translatedText = completion.choices[0].message.content;
        res.status(200).json({ translatedText });

    } catch (error) {
        console.error('Error calling Groq for translation:', error);
        res.status(500).send({ message: 'Failed to translate text.' });
    }
};